const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

// Pruebas de los handlers reales con almacenamiento y DOM simulado.
// No sustituyen una comprobación visual en Android.
function fixture({oldSnapshot=false,missing=false,unitPrice=50,quantity='10 ud'}={}){
  class Node {
    constructor(value=''){this.value=value;this.events={};this.dataset={};this.children=[];this.hidden=false;this.invalid='';this.attributes={};this.textContent='';this.classList={toggle:()=>{}};}
    addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
    setAttribute(name,value){this.attributes[name]=value;}
    setCustomValidity(message){this.invalid=message;}
    checkValidity(){return !this.invalid;}
    reportValidity(){return this.checkValidity();}
    focus(){this.focused=true;}
    set innerHTML(html){
      this.html=html;this.children=[];
      for(const match of html.matchAll(/<(?:button|input)\b[^>]*>/g)){
        const node=new Node();
        for(const attr of match[0].matchAll(/([\w-]+)="([^"]*)"/g)){
          if(attr[1].startsWith('data-'))node.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=attr[2];
          if(attr[1]==='value')node.value=attr[2];
        }
        this.children.push(node);
      }
    }
    get innerHTML(){return this.html||'';}
    querySelectorAll(selector){
      const key=selector.slice(6,-1).replace(/-([a-z])/g,(_,x)=>x.toUpperCase());
      return this.children.filter(node=>Object.hasOwn(node.dataset,key));
    }
  }
  const nodes={};
  for(const id of ['jobName','jobClient','jobAddr','jobVat','jobDisc','jobProfitPct','jobProfitPctError','jobDiscError','jobLaborExtra','jobExtra','jobValid','jobNotes','jobNum','coName','coNif','coPhone','coMail','coAddr','saveStatus','listContent','workContent','savedJobs','undoWork','undoDelete','exportPrint','exportCsv','exportWa','shareBudget','jobNew','jobSaveSnap','backupExport','backupImport'])nodes[id]=new Node();
  nodes.backupStatus=new Node();
  const parts=[{title:'Prueba',zone:'Salón',items:[['Material',quantity,''],['Mano de obra montaje','200,00 €','']]}];
  const prices=missing?{}:{Material:unitPrice};
  const meta={name:'Prueba',vat:'21',laborExtra:200,extra:100,disc:0,num:'P-TEST'};
  const storage=new Map([
    ['calculadora-work-v1',JSON.stringify(parts)],['calculadora-prices-v1',JSON.stringify(prices)],
    ['calculadora-job-v1',JSON.stringify(meta)],
    ['calculadora-jobs-v1',JSON.stringify(oldSnapshot?[{meta,work:parts,prices,company:{}}]:[])]
  ]);
  const blobs=[],links=[],opens=[],shared=[];
  const context=vm.createContext({
    Blob,console,
    document:{readyState:'complete',querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>nodes[id]||null,
      createElement:()=>{const node=new Node();node.click=()=>links.push({download:node.download,href:node.href});return node;}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    navigator:{share:async data=>shared.push(data)},
    window:{addEventListener:()=>{},print:()=>{},open:(url)=>{
      const popup={url,html:'',focus:()=>{},print:()=>{popup.printed=true;}};
      popup.document={write:text=>popup.html+=text,close:()=>{}};opens.push(popup);return popup;
    }},
    URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:test/'+blobs.length;},revokeObjectURL:()=>{}},
    setTimeout:fn=>fn(),confirm:()=>true,alert:()=>{}
  });
  const root=join(__dirname,'..');
  const a=readFileSync(join(root,'app-a1.js'),'utf8');
  const a2=readFileSync(join(root,'app-a2.js'),'utf8');
  const b=readFileSync(join(root,'app-b.js'),'utf8');
  const code=a.slice(0,a.indexOf('  const screens ='))+
    a2.slice(a2.indexOf('  function rowConfidence('),a2.indexOf('  function sketchLegend('))+
    b.slice(b.indexOf('  function renderSavedJobs(){'),b.indexOf('  // Recuperar las medidas'))+`
      fillJobFields();renderWork();renderList();
      globalThis.api={totals:budgetTotals,state:()=>({jobMeta,work,priceBook,savedJobs}),text:budgetText,add:bindAdd};
    })();`;
  vm.runInContext(code,context);
  const fire=async(id,event='click',extra={})=>{
    const node=nodes[id],e={target:node,preventDefault:()=>{},...extra};
    if(node['on'+event])await node['on'+event](e);
    for(const fn of node.events[event]||[])await fn(e);
  };
  const input=async(id,value,event='input')=>{nodes[id].value=value;await fire(id,event);};
  return {nodes,fire,input,blobs,links,opens,shared,storage,add:context.api.add,
    totals:()=>context.api.totals(),text:()=>context.api.text(),
    state:()=>JSON.parse(JSON.stringify(context.api.state()))};
}

test('Entrada decimal: recálculo inmediato y guardado automático',async()=>{
  const f=fixture();
  await f.input('jobProfitPct','15,0');
  assert.equal(f.totals().grand,1391.50);
  assert.equal(JSON.parse(f.storage.get('calculadora-job-v1')).profitPct,15);
  assert.match(f.nodes.listContent.innerHTML,/Beneficio industrial 15 %/);
  assert.match(f.nodes.listContent.innerHTML,/150,00 €/);
  await f.input('jobDisc','10');
  assert.equal(f.totals().grand,1252.35);
});

test('Porcentaje no válido: mantiene el anterior e impide exportar',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');
  for(const value of ['-1','1001','abc','Infinity','1e2']){
    await f.input('jobProfitPct',value);
    assert.equal(f.nodes.jobProfitPct.attributes['aria-invalid'],'true');
    assert.equal(f.nodes.jobProfitPctError.hidden,false);
    assert.equal(f.state().jobMeta.profitPct,15);
    await f.fire('exportCsv');await f.fire('exportPrint');await f.fire('exportWa');await f.fire('shareBudget');
    assert.equal(f.links.length,0);assert.equal(f.opens.length,0);assert.equal(f.shared.length,0);
  }
  await f.input('jobProfitPct','12.5');
  assert.equal(f.nodes.jobProfitPct.checkValidity(),true);
  assert.equal(f.nodes.jobProfitPctError.hidden,true);
});

test('Descuento fuera de rango no produce importes negativos',async()=>{
  const f=fixture();await f.input('jobDisc','101');
  assert.equal(f.nodes.jobDisc.checkValidity(),false);
  assert.equal(f.totals().grand,1210);
  await f.input('jobDisc','100');assert.equal(f.totals().grand,0);
});

test('Pantalla, CSV, impresión/PDF, WhatsApp y Compartir usan el mismo desglose',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');await f.input('jobDisc','10');
  await f.fire('exportCsv');
  const csv=await f.blobs.at(-1).text();
  assert.match(csv,/"Beneficio industrial 15 %";"";"";"";"150,00"/);
  assert.match(csv,/"Desplazamiento \/ varios";"";"";"";"100,00"/);
  assert.match(csv,/"Descuento 10 %";"";"";"";"-115,00"/);
  assert.match(csv,/"TOTAL";"";"";"";"1252,35"/);
  await f.fire('exportPrint');
  assert.match(f.opens[0].html,/Beneficio industrial 15 %/);
  assert.match(f.opens[0].html,/1252,35 €/);
  assert.equal(f.opens[0].printed,true);
  await f.fire('exportWa');
  const whatsapp=decodeURIComponent(f.opens[1].url.split('?text=')[1]);
  assert.match(whatsapp,/Beneficio industrial 15 %: 150,00 €/);
  assert.match(whatsapp,/TOTAL: 1252,35 €/);
  await f.fire('shareBudget');assert.equal(f.shared[0].text,whatsapp);
  assert.match(f.nodes.listContent.innerHTML,/1252,35 €/);
});

test('Partidas pendientes identifican como provisional todas las salidas',async()=>{
  const f=fixture({missing:true});await f.input('jobProfitPct','15');
  await f.fire('exportCsv');assert.match(await f.blobs.at(-1).text(),/PRESUPUESTO PROVISIONAL/);
  await f.fire('exportPrint');assert.match(f.opens[0].html,/TOTAL PROVISIONAL/);
  assert.match(f.text(),/PRESUPUESTO PROVISIONAL/);
  assert.match(f.nodes.listContent.innerHTML,/TOTAL PROVISIONAL/);
});

test('Obra nueva restablece el recargo y una copia recupera su porcentaje',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');await f.fire('jobSaveSnap');
  assert.equal(f.state().savedJobs[0].meta.profitPct,15);
  await f.fire('jobNew');
  assert.equal(f.state().jobMeta.profitPct,0);
  assert.equal(String(f.nodes.jobProfitPct.value),'0');
  assert.equal(f.state().work.length,0);
  await f.nodes.savedJobs.querySelectorAll('[data-load-job]')[0].onclick();
  assert.equal(f.state().jobMeta.profitPct,15);
  assert.equal(f.totals().grand,1391.50);
});

test('Abrir una copia anterior no hereda el porcentaje de la obra activa',async()=>{
  const f=fixture({oldSnapshot:true});await f.input('jobProfitPct','15');
  await f.nodes.savedJobs.querySelectorAll('[data-load-job]')[0].onclick();
  assert.equal(f.state().jobMeta.profitPct,0);
  assert.equal(f.totals().grand,1210);
});

test('Copias JSON guardan y restauran beneficio en obra activa e historial',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');await f.fire('jobSaveSnap');await f.fire('backupExport');
  const payload=await f.blobs.at(-1).text();
  const backup=JSON.parse(payload);
  assert.equal(backup.jobMeta.profitPct,15);
  assert.equal(backup.savedJobs[0].meta.profitPct,15);
  await f.fire('jobNew');
  f.nodes.backupImport.files=[{size:payload.length,text:async()=>payload}];
  await f.fire('backupImport','change');
  assert.equal(f.nodes.backupStatus.textContent,'Copia restaurada.');
  assert.equal(f.totals().grand,1391.50);
});

test('Restaurar una copia antigua usa el 0 %; una copia inválida no sustituye datos',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');await f.fire('jobSaveSnap');await f.fire('backupExport');
  const backup=JSON.parse(await f.blobs.at(-1).text());
  delete backup.jobMeta.profitPct;delete backup.savedJobs[0].meta.profitPct;
  f.nodes.backupImport.files=[{size:100,text:async()=>JSON.stringify(backup)}];
  await f.fire('backupImport','change');
  assert.equal(f.state().jobMeta.profitPct,0);
  assert.equal(f.state().savedJobs[0].meta.profitPct,0);
  backup.jobMeta.profitPct=1001;
  await f.fire('backupImport','change');
  assert.match(f.nodes.backupStatus.textContent,/No se ha restaurado/);
  assert.equal(f.state().jobMeta.profitPct,0);
});

test('Añadir a Obra conserva todas las líneas de material y las medidas',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');
  const button={},zone={value:'Dormitorio'};
  const section={id:'wall',querySelectorAll:()=>[{id:'wLength',value:'4'},{id:'wHeight',value:'2,5'}]};
  const result={querySelector:selector=>selector==='.addWork'?button:zone,closest:()=>section};
  const items=[['Placas','10 m²',''],['Banda acústica','10 m',''],['Lámina acústica','5 m²',''],['Tornillos','100 ud','']];
  f.add(result,{title:'Tabique de prueba',items});button.onclick();
  const added=f.state().work.at(-1);
  assert.deepEqual(added.items,items);
  assert.equal(added.zone,'Dormitorio');
  assert.deepEqual(added.editor.values,{wLength:'4',wHeight:'2,5'});
  assert.equal(f.state().jobMeta.profitPct,15);
  assert.equal(JSON.parse(f.storage.get('calculadora-work-v1')).at(-1).items.length,4);
});

test('Duplicar, eliminar y deshacer partidas mantienen el beneficio industrial',async()=>{
  const f=fixture();await f.input('jobProfitPct','15');
  f.nodes.workContent.querySelectorAll('[data-duplicate]')[0].onclick();
  assert.equal(f.state().work.length,2);
  assert.deepEqual(f.state().work[0],f.state().work[1]);
  f.nodes.workContent.querySelectorAll('[data-del]')[1].onclick();
  assert.equal(f.state().work.length,1);
  await f.fire('undoDelete');
  assert.equal(f.state().work.length,2);
  assert.equal(f.state().jobMeta.profitPct,15);
});

test('Los precios unitarios conservan sus decimales en todas las exportaciones',async()=>{
  const f=fixture({unitPrice:0.083,quantity:'1200 ud'});
  assert.equal(f.totals().mat,99.60);
  assert.equal(f.nodes.listContent.querySelectorAll('[data-price-key]')[0].value,'0.083');
  await f.fire('exportCsv');
  assert.match(await f.blobs.at(-1).text(),/"Material";"1200";"ud";"0,083";"99,60"/);
  await f.fire('exportPrint');
  assert.match(f.opens[0].html,/>0,083<\/td>/);
  assert.match(f.opens[0].html,/>99,60 €<\/td>/);
  const text=f.text();
  assert.match(text,/1200 ud × 0,083 = 99,60 €/);
  await f.fire('exportWa');
  assert.equal(decodeURIComponent(f.opens[1].url.split('?text=')[1]),text);
  await f.fire('shareBudget');assert.equal(f.shared[0].text,text);
});
