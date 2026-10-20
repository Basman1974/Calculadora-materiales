const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function roof(sys='double',values={}){const f=fixture();f.set(values);f.api.roofSys(sys);return {f,part:f.add('roofResult')};}
const find=(part,name)=>part.items.find(row=>row[0]===name);
const qty=(part,name)=>Number(find(part,name)[1].match(/^[\d.]+/)[0]);

test('Los parámetros de techo corresponden al registro de fuentes y mantienen sus condiciones',()=>{
  const root=path.join(__dirname,'..'),context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
  const data=context.window.CALC_ROOF_DATA,ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/techos-20261019/fuentes.json'),'utf8'));
  const d11=ledger.sources[data.sourceId].verified_values;
  assert.deepEqual(JSON.parse(JSON.stringify(data.standardWeight)),d11.standardWeight);
  assert.deepEqual(JSON.parse(JSON.stringify(data.f47)),d11.f47);
  for(const key of ['perimeterFixing','profileEdge','hangerEdge'])assert.equal(data[key],d11[key]);
  for(const [key,value]of Object.entries(ledger.sources[data.t24.sourceId].verified_values))assert.equal(data.t24[key],value);
  for(const source of Object.values(ledger.sources))for(const key of ['manufacturer','product_or_system','document','document_version','page_or_section','url','verified_on','unit','conditions','status'])assert.ok(source[key]);
  assert.match(ledger.implementation_criteria.screw_600,/pendiente de ficha/);
});

for(const [sys,layers,expected]of [['simple',1,45],['simple',2,54],['double',1,42],['double',2,48]]){
  test('F47/17 5×4, '+sys+', '+layers+' capas: '+expected+' suspensiones por recorridos',()=>{
    const {part}=roof(sys,{rLayers:layers,rRodMargin:5}),p=part.roofLayout;
    assert.equal(qty(part,'Horquillas / cuelgues Pívot F47/17'),expected);
    assert.equal(qty(part,'Fijaciones al forjado F47/17'),2*expected);
    assert.equal(qty(part,'Ángulo perimetral L 30/25'),6);
    assert.match(find(part,'Ángulo perimetral L 30/25')[2],/^18 m/);
    assert.equal(qty(part,'Fijaciones del perimetral'),38);
    assert.equal(qty(part,'Banda acústica perimetral'),18);
    assert.equal(p.supported,true);assert.equal(part.incomplete,true);
    for(let i=1;i<p.secondary.length;i++)assert.ok(p.secondary[i]-p.secondary[i-1]<=.5+1e-8);
    for(let i=1;i<p.hangerAxis.length;i++)assert.ok(p.hangerAxis[i]-p.hangerAxis[i-1]<=p.maxHangerSpacing+1e-8);
    assert.ok(p.hangerAxis[0]<=.15);assert.ok(5-p.hangerAxis.at(-1)<=.15+1e-8);
  });
}
test('La forma del paño cambia la distribución y no se resuelve con el área',()=>{
  assert.equal(roof('simple',{rL:10,rW:2}).part.roofLayout.hangers,55);
  assert.equal(roof('double',{rL:10,rW:2}).part.roofLayout.hangers,56);
});
for(const [sys,values,reason]of [
  ['simple',{rWeight:31},/fuera del intervalo/],
  ['double',{rExtraLoad:20},/fuera del intervalo/],
  ['simple',{rBoardType:'hidro'},/peso del conjunto/],
  ['simple',{rBoardType:'rf',rWeight:20},/RF ensayada/],
  ['double',{rReference:'generic'},/otra perfilería/],
  ['simple',{rBoardThick:18,rWeight:20},/Espesor fuera/],
  ['double',{rBoardThick:15},/peso del conjunto/]
]){
  test('No se dimensiona una configuración sin tabla: '+JSON.stringify(values),()=>{
    const {f,part}=roof(sys,values),row=find(part,'Perfilería y suspensiones TC47');
    assert.equal(row[1],'No dimensionados');assert.match(row[2],reason);
    assert.equal(find(part,'Horquillas / cuelgues Pívot F47/17'),undefined);
    assert.equal(f.api.totals().incomplete,1);
  });
}
test('Peso manual, adicional y límite de carga se aplican en kN/m², sin suponer densidades',()=>{
  const {part}=roof('simple',{rBoardType:'hidro',rWeight:'12,5',rExtraLoad:'5,5'});
  assert.ok(Math.abs(part.roofLayout.loadKN-.17658)<1e-10);assert.equal(part.roofLayout.hangers,54);
  const edge=roof('double',{rWeight:String(.3*1000/9.81)}).part;assert.equal(edge.roofLayout.supported,true);
});
test('Cambiar el encuentro no portante no reduce los cuelgues',()=>{
  const withClip=roof('simple',{rPerimeter:'clip'}).part,without=roof('simple',{rPerimeter:'none'}).part;
  assert.equal(qty(withClip,'Perfil perimetral Clip 18'),6);assert.equal(withClip.roofLayout.hangers,54);
  assert.equal(find(without,'Ángulo perimetral L 30/25'),undefined);assert.equal(without.roofLayout.hangers,54);
  assert.match(find(without,'Comprobación de perímetro')[2],/no se descuentan cuelgues/);
});
test('Varilla: se exige margen explícito y el corte usa plenum más margen',()=>{
  assert.equal(find(roof().part,'Varilla roscada M6')[1],'No dimensionados');
  assert.equal(qty(roof('double',{rDrop:20,rRodMargin:5}).part,'Varilla roscada M6 1 m'),12);
  assert.equal(qty(roof('double',{rDrop:20,rRodMargin:0}).part,'Varilla roscada M6 1 m'),10);
  assert.equal(find(roof('double',{rDrop:100,rRodMargin:5}).part,'Varilla roscada M6')[1],'No dimensionados');
  assert.equal(qty(roof('double',{rDrop:120,rRodMargin:10,rRodStock:2}).part,'Varilla roscada M6 2 m'),48);
});
test('Los redondeos solo eliminan error binario, sin ocultar incrementos reales',()=>{
  const {api}=fixture();assert.equal(api.roofCeil(20*5*1.1),110);assert.equal(api.roofCeil(110.000000001),111);
  assert.equal(api.roofCeil(50.00000000000001),50);assert.equal(api.roofCeil(50.00001),51);
});
test('Tornillos de techo por piezas: no se reutilizan los ratios de pared',()=>{
  const {part}=roof('double',{rFixWaste:0});
  // 13 encuentros con perfil por columna × (7+7+7+3) tornillos = 312 por capa.
  assert.equal(qty(part,'Tornillos 1.ª placa 3,5 × 25'),312);
  assert.equal(qty(part,'Tornillos 2.ª placa 3,5 × 35'),312);
  assert.equal(part.items.some(row=>row[0].includes('metal-metal')),false);
  const t15=roof('double',{rBoardThick:15,rWeight:25,rFixWaste:10}).part;
  assert.equal(qty(t15,'Tornillos 2.ª placa 3,5 × 45'),344);
});
test('Cinta cuenta juntas una vez y solo la capa visible en el modelo sin resistencia al fuego',()=>{
  const {part}=roof('double',{rFixWaste:0});
  // 15 m de juntas longitudinales + 8 m de transversales + 18 m de perímetro.
  assert.equal(qty(part,'Cinta de papel para juntas'),41);
  assert.equal(find(part,'Cinta de papel 1.ª capa'),undefined);
  assert.equal(qty(part,'Pasta de juntas'),10);
});
test('Pasta configurable del conjunto: se aplica una sola vez antes de merma',()=>{
  const {part}=roof('double',{rPasteRate:'0,8',rFixWaste:5});assert.equal(qty(part,'Pasta de juntas'),16.8);
});
for(const format of ['2.7,1.2','2,.6']){
  test('Formato '+format+': exige peso y añade apoyos de juntas sin perder el formato',()=>{
    assert.equal(roof('double',{rBoard:format}).part.roofLayout.supported,false);
    const {part}=roof('double',{rBoard:format,rWeight:20});assert.equal(part.roofLayout.supported,true);
    for(let i=1;i<part.roofLayout.secondary.length;i++)assert.ok(part.roofLayout.secondary[i]-part.roofLayout.secondary[i-1]<=.5+1e-8);
    assert.ok(part.editor.values.rBoard===format);assert.equal(find(part,'Pasta de juntas')[1],'No dimensionados');
  });
}
for(const sys of ['desmontable60','desmontable120']){
  test('T24 6×6 '+sys+': perfiles de borde, cuelgues y anclajes sin duplicar conjuntos',()=>{
    const {f,part}=roof(sys,{rL:6,rW:6,rWaste:0});
    assert.equal(qty(part,'Perfil T24 primario 3600'),10);assert.equal(qty(part,'Perfil T24 secundario 1200'),54);
    assert.equal(qty(part,'Cuelgues T24 completos'),30);assert.equal(qty(part,'Anclajes al forjado T24'),30);
    assert.equal(qty(part,'Fijaciones del perimetral'),64);assert.equal(qty(part,'Ángulo perimetral T24'),8);
    assert.equal(find(part,'Varilla o cuelgue'),undefined);assert.equal(find(part,'Cuelgues / suspensiones'),undefined);
    if(sys==='desmontable60')assert.equal(qty(part,'Perfil T24 secundario 600'),40);
    else assert.equal(find(part,'Perfil T24 secundario 600'),undefined);
    assert.equal(f.nodes.roofSuspensionOptions.classList.contains('hidden'),true);
  });
}
test('Sierra no importa la tabla TC47 y no inventa barras sin longitud comercial',()=>{
  const {part}=roof('sierra');assert.equal(find(part,'Perfil sierra')[1],'No dimensionados');
  assert.equal(find(part,'TC47 secundario 3000')[1],'No dimensionados');assert.equal(find(part,'Suspensiones sierra')[1],'No dimensionados');
  assert.equal(qty(part,'Ángulo perimetral L 30/25'),4);assert.equal(qty(part,'Canal perimetral 48 para sierra'),3);
  const specified=roof('sierra',{rSierraRuns:6,rSierraBar:3,rSierraHangers:24}).part;
  assert.equal(find(specified,'Perfil sierra')[1],'12 barras de 3 m');assert.equal(qty(specified,'Suspensiones sierra'),24);
});
test('M70 es autoportante: se conserva pendiente sin horquillas ni varillas falsas',()=>{
  const {part}=roof('cm70');assert.equal(find(part,'Montante M70')[1],'No dimensionados');
  assert.equal(find(part,'Fijaciones del perimetral')[1],'No dimensionados');
  assert.equal(part.items.some(row=>/Horquilla|Varilla roscada|metal-metal/.test(row[0])),false);
});
test('Escayola no conserva ratios sin fuente; con datos calcula por piezas y consumos configurados',()=>{
  const empty=roof('escayola').part;assert.equal(find(empty,'Fijaciones de estopa')[1],'No dimensionados');
  assert.equal(find(empty,'Estopa / fibra vegetal')[1],'No dimensionados');
  const {part}=roof('escayola',{rL:2,rW:1.2,rWaste:0,rGypsumPoints:3,rGypsumFibre:.2,rGypsumPaste:5});
  assert.equal(qty(part,'Placa de escayola 1000 × 600'),4);assert.equal(qty(part,'Fijaciones de estopa'),12);
  assert.equal(qty(part,'Estopa / fibra vegetal'),.48);assert.equal(qty(part,'Pasta de escayola'),1);
  assert.equal(part.items.some(row=>/25 cm/.test(row[1])),false);
});
test('Huecos descuentan placas y dejan el recercado sin dimensionar, sin rebajar cuelgues',()=>{
  const {part}=roof('double',{rHoles:4});assert.equal(part.net,16);assert.equal(part.roofLayout.hangers,48);
  assert.equal(find(part,'Recercado de huecos')[1],'No dimensionados');
});
test('Los controles ocultos no bloquean otros sistemas ni contaminan el perímetro sierra',()=>{
  const {f}=roof();f.set({rRodStock:'error',rRodMargin:'error',rWeight:'error',rExtraLoad:'error',rFixWaste:'error',rPasteRate:'error',rPerimeter:'none'});
  f.api.roofSys('desmontable60');assert.doesNotMatch(f.nodes.roofResult.innerHTML,/role="alert"/);
  f.api.roofSys('cm70');assert.doesNotMatch(f.nodes.roofResult.innerHTML,/role="alert"/);
  f.api.roofSys('sierra');assert.doesNotMatch(f.nodes.roofResult.innerHTML,/role="alert"/);assert.ok(find(f.add('roofResult'),'Ángulo perimetral L 30/25'));
});
for(const values of [{rRodMargin:-1},{rWeight:'Infinity'},{rSierraRuns:1.5},{rGypsumPaste:-1},{rL:100000},{rFixWaste:1e100}]){
  test('Entrada de techo inválida: '+JSON.stringify(values),()=>{
    const f=fixture();f.set(values);f.api.roofSys('rSierraRuns'in values?'sierra':'rGypsumPaste'in values?'escayola':'double');
    assert.match(f.nodes.roofResult.innerHTML,/role="alert"/);assert.doesNotMatch(f.nodes.roofResult.innerHTML,/addWork/);
  });
}
test('Separaciones y bordes se cumplen también con paños estrechos o no modulares',()=>{
  const {api}=fixture();
  for(const length of [.01,.1,.2,.3,.6,1,2.73,5,10,29.99])for(const gap of [.5,.75,.9,1,1.2]){
    const a=api.roofHangerAxis(length,gap,.15);assert.ok(a.length>=1);assert.ok(a[0]>=0&&a.at(-1)<=length+1e-9);
    assert.ok(a[0]<=.15+1e-9&&length-a.at(-1)<=.15+1e-9);
    for(let i=1;i<a.length;i++)assert.ok(a[i]-a[i-1]<=gap+1e-9);
  }
});
test('Una obra antigua conserva cantidades, precio y copia; editar no hereda nuevos datos de otro techo',()=>{
  const old={title:'Techo doble TC47 · 20 m²',calculationVersion:'20261012-auditoria',items:[['Horquillas','21 uds','']],editor:{screen:'roof',values:{rSys:'double',rL:'5',rW:'4',rLayers:'2'}}};
  const f=fixture({'calculadora-work-v1':JSON.stringify([old]),'calculadora-prices-v1':JSON.stringify({'Horquillas [ud]':2}),'calculadora-job-v1':JSON.stringify({vat:0}),'calculadora-jobs-v1':JSON.stringify([{meta:{vat:0},work:[old],prices:{'Horquillas [ud]':2}}])});
  assert.equal(f.api.rows()[0].items[0][1],'21 uds');assert.equal(f.api.totals().mat,42);assert.equal(f.api.totals().provisional,true);
  f.set({rWeight:20,rExtraLoad:5,rRodMargin:10,rPerimeter:'none'});f.api.show('work');f.nodes.workContent.querySelectorAll('[data-edit]')[0].click();
  assert.equal(f.nodes.rBoardThick.value,'15');assert.equal(f.nodes.rWeight.value,'');assert.equal(f.nodes.rExtraLoad.value,'0');assert.equal(f.nodes.rRodMargin.value,'');assert.equal(f.nodes.rPerimeter.value,'angle');
  f.set({rWeight:25,rRodMargin:5});f.api.roof();f.add('roofResult');
  assert.equal(f.api.rows().length,1);assert.equal(f.api.rows()[0].roofLayout.hangers,48);
  assert.equal(f.api.state().savedJobs[0].work[0].items[0][1],'21 uds');
});
test('Reabrir un borrador antiguo conserva el espesor de 15 mm antes asumido',()=>{
  const f=fixture({'calc-form-draft':JSON.stringify({rSys:'double',rL:'5',rW:'4',rLayers:'2'})});assert.equal(f.nodes.rBoardThick.value,'15');
  assert.match(f.nodes.roofResult.innerHTML,/peso del conjunto/);
});
test('Persistencia y todas las exportaciones incluyen perímetro y suspensiones con total provisional',async()=>{
  const {f,part}=roof('double',{rRodMargin:5});
  assert.equal(JSON.parse(f.storage.get('calculadora-work-v1'))[0].items.length,part.items.length);
  assert.ok(f.api.totals().rows.some(row=>row.name==='Fijaciones del perimetral'&&row.qty===38));
  for(const entry of f.api.pricing().entries)entry.price=1;
  const totals=f.api.totals();assert.equal(totals.missing,0);assert.equal(totals.provisional,true);
  await f.fire('exportPrint');const html=f.opens.at(-1).html;assert.match(html,/Ángulo perimetral L 30\/25/);assert.match(html,/Fijaciones del perimetral/);assert.match(html,/TOTAL PROVISIONAL/);
  await f.fire('exportCsv');const csv=await f.blobs.at(-1).text();assert.match(csv,/Ángulo perimetral L 30\/25/);assert.match(csv,/Horquillas/);assert.match(csv,/TOTAL PROVISIONAL/);
  await f.fire('exportWa');const text=decodeURIComponent(f.opens.at(-1).url);assert.match(text,/Ángulo perimetral L 30\/25/);assert.match(text,/TOTAL PROVISIONAL/);
  await f.fire('shareBudget');assert.match(f.shared.at(-1).text,/Ángulo perimetral L 30\/25/);assert.match(f.shared.at(-1).text,/TOTAL PROVISIONAL/);
  await f.fire('backupExport');const backup=JSON.parse(await f.blobs.at(-1).text());assert.equal(backup.work[0].roofLayout.hangers,48);
  const restored=fixture();restored.nodes.backupImport.files=[{size:10000,text:async()=>JSON.stringify(backup)}];
  await restored.fire('backupImport','change');assert.equal(restored.nodes.backupStatus.textContent,'Copia restaurada.');
  assert.equal(restored.api.rows()[0].roofLayout.hangers,48);assert.equal(restored.api.totals().grand,totals.grand);
});
