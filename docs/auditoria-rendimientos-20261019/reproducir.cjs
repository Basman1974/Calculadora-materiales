// Auditoría de lectura: ejecuta los fragmentos reales con el DOM simulado existente.
// Los asserts fijan observaciones reproducibles; NO certifican rendimientos de obra.
// Ejecutar desde cualquier directorio: node docs/auditoria-rendimientos-20261019/reproducir.cjs
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const fixture=require('../../tests/material-fixture.cjs');
const cases=[];
const clone=x=>JSON.parse(JSON.stringify(x));
function save(id,inputs,result){cases.push({id,inputs,result:clone(result)});return result;}
function calculate(method,resultId,values={},configure=()=>{}){
  const f=fixture();configure(f);f.set(values);f.api[method]();
  const valid=!/role="alert"/.test(f.nodes[resultId].innerHTML);
  return {f,valid,part:valid?f.add(resultId):null};
}
function roof(sys,values={}){
  const c=calculate('roof','roofResult',{rL:5,rW:4,rDrop:30,rLayers:2,rWaste:8,rHoles:0,...values},f=>f.api.roofSys(sys));
  return save('techo-'+sys+'-'+cases.length,{sys,...values},{...c.part,provisional:c.f.api.totals().provisional});
}
function row(part,name){return part.items.find(r=>r[0]===name);}
function wall(values={}){return calculate('wall','wallResult',{wL:4,wH:2.5,wA:1,wB:1,wP:70,wS:0.6,wDoors:0,wWins:0,wWool:1,...values});}
function wet(cat,name,values={}){
  const c=calculate('wet','wetResult',{wetArea:10,wetWaste:0,wetMortarWaste:0,...values},f=>f.select(cat,name));
  return save('humeda-'+cases.length,{cat,name,...values},{valid:c.valid,part:c.part});
}
async function main(){
  for(const sys of ['simple','double','sierra','cm70','desmontable60','desmontable120','escayola']){
    const p=roof(sys);assert.equal(p.provisional,true);
    if(['simple','double','sierra'].includes(sys))assert.equal(p.items.some(r=>/perimetral|ángulo|anclaje al forjado|banda acústica/i.test(r[0])),false);
  }
  assert.equal(row(cases[0].result,'Horquillas')[1],'17 uds');
  assert.equal(row(cases[1].result,'Horquillas')[1],'21 uds');
  assert.equal(row(cases[1].result,'Crucetas')[1],'66 uds');
  const floating=save('redondeo-tornillos-techo',{area:20,rate:5,wastePct:10},{rawJS:20*5*1.1,exactDecimal:20*5*110/100,row:row(cases[0].result,'Tornillos metal-metal 3,5 × 9,5')});
  assert.equal(floating.exactDecimal,110);assert.match(floating.row[1],/^111 uds/);
  const one=roof('simple',{rLayers:1}),two=roof('simple',{rLayers:2});
  assert.equal(row(one,'Horquillas')[1],row(two,'Horquillas')[1]);
  const long=roof('simple',{rL:10,rW:2});assert.equal(row(long,'Horquillas')[1],'17 uds');
  const d1=roof('double',{rLayers:1}),d2=roof('double',{rLayers:2});assert.equal(row(d1,'Horquillas')[1],row(d2,'Horquillas')[1]);
  for(const drop of [20,30,70,100,120])save('varilla-'+drop,{hangers:21,dropCm:drop},fixture().api.rod(21,drop));
  const w600=wall(),w400=wall({wS:0.4});
  save('tabique-600',{wS:0.6},w600.part);save('tabique-400',{wS:0.4},w400.part);
  const screw=p=>p.items.find(r=>r[0].startsWith('Tornillos placa-metal'))[1];
  assert.equal(screw(w600.part),screw(w400.part));
  save('tabique-2+2',{wA:2,wB:2},wall({wA:2,wB:2}).part);
  save('tabique-huecos',{wDoors:1,wWins:1},wall({wDoors:1,wWins:1}).part);
  save('tabique-alto',{wH:10},wall({wH:10}).part);
  const wr=wall({wL:1.2345});
  save('redondeo-lana',{wL:1.2345,wH:2.5},{rawM2:1.2345*2.5*1.08,row:wr.part.items.find(r=>r[0].startsWith('Lana mineral')),budgetRow:wr.f.api.totals().rows.find(r=>r.name.startsWith('Lana mineral'))});
  assert.equal(wr.f.api.totals().rows.find(r=>r.name.startsWith('Lana mineral')).qty,3.3);
  for(const type of ['direct','semi','auto']){
    const c=calculate('lining','liningResult',{lL:4,lH:2.5,lLayers:1,lWaste:0,lPasteRate:5,lDoors:0,lWins:0},f=>f.api.liningType(type));
    save('trasdosado-'+type,{type},c.part);
  }
  for(const [cat,products] of Object.entries(fixture().data))for(const [name,it]of Object.entries(products)){
    const values=cat==='revestimientos'?{wetThickness:it.min||10}:{};
    const result=wet(cat,name,values);
    if(cat==='ladrillos'&&!it.dims)assert.equal(result.valid,false);
    else assert.equal(result.valid,true,name);
  }
  const brick=wet('ladrillos','Hueco sencillo 33x16.5x4',{wetJoint:5});
  assert.equal(brick.part.items[0][1],'176 uds');
  assert.equal(row(brick.part,'Volumen geométrico de mortero')[1],'17.6 L');
  const narrow=wet('ladrillos','Hueco sencillo 33x16.5x4',{wetBrickT:0.5});
  assert.match(narrow.part.items[0][0],/×1 cm$/);
  wet('ladrillos','Hueco sencillo 33x16.5x4',{wetJoint:5.4});
  const thin=wet('revestimientos','APLICAREV Cal Nature Pro',{wetThickness:0.5});
  assert.match(thin.part.items[0][2],/espesor 1 mm/);
  for(const support of ['sin_absorcion','poco_poroso','poroso'])wet('puentes','Imprimacion Aplica Level Primer 5 L',{wetSupport:support,wetArea:100});
  wet('puentes','SikaTop-10',{wetConsumption:0.5,wetCoats:2,wetArea:100});
  for(const body of ['porcelanico','pasta_roja','pasta_blanca'])for(const pattern of ['recto','tercio','mitad','diagonal']){
    const f=fixture();await f.fireNode(f.all.find(n=>n.dataset.cerBody===body));
    f.set({cArea:36,cA:60,cB:60,cWaste:0,cBatchArea:5,cPattern:pattern});f.api.ceramic();
    const p=f.add('levelResult');save('ceramica-'+body+'-'+pattern,{body,pattern,area:36,batch:5,waste:0},p);
    assert.equal(row(p,'Baldosas / piezas')[1],'100 uds');assert.equal(row(p,'Cuñas reutilizables')[1],'60 uds');
  }
  const c=calculate('ceramic','levelResult',{cA:60,cB:60,cArea:8,cWaste:10,cBond:'doble',cTrowel:10});
  await c.f.fire('adhForm','submit');
  save('cola-dos-pantallas',{cArea:8,cWaste:10,cBond:'doble',cTrowel:10},{materials:row(c.part,'Cemento cola'),classificationHTML:c.f.nodes.adhResult.innerHTML});
  assert.equal(row(c.part,'Cemento cola')[1],'3 saco(s) de 25 kg');assert.match(c.f.nodes.adhResult.innerHTML,/48.0 kg · 2 saco\(s\) 25 kg/);
  const source=fs.readFileSync(path.join(__dirname,'../../app-a1.js'),'utf8'),end=source.indexOf('  const screens =');
  const ctx=vm.createContext({document:{querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}}});
  vm.runInContext(source.slice(0,end)+`globalThis.check=(parts,prices,meta)=>{work=parts;priceBook=prices;jobMeta=meta;return budgetTotals();};})();`,ctx);
  for(const vat of [0,10,21])for(const disc of [0,10]){
    const total=ctx.check([{title:'Caso 1.000',items:[['Material','10 ud',''],['Mano de obra montaje','200,00 €','']]}],{Material:50},{vat,disc,profitPct:15,laborExtra:200,extra:100});
    const taxable=disc?1035:1150,grand=Math.round(taxable*(1+vat/100)*100)/100;
    assert.equal(total.base,1000);assert.equal(total.profit,150);assert.equal(total.grand,grand);
    save('presupuesto-'+vat+'-'+disc,{vat,disc,profitPct:15},total);
  }
  const incomplete=ctx.check([{title:'Techo',items:[['Placa','1 uds',''],['Aviso de despiece','Despiece pendiente de validar','']]}],{Placa:10},{vat:21});
  assert.equal(incomplete.provisional,true);save('presupuesto-techo-con-precio',{},incomplete);
  const orientative=ctx.check([{title:'Cerámica',calculationVersion:'20261012-auditoria',items:[['Cemento cola','2 sacos','Consumo orientativo; verificar ficha del adhesivo']]}],{'Cemento cola':10},{vat:21});
  assert.equal(orientative.provisional,false);save('presupuesto-orientativo-con-precio',{},orientative);
  const out={date:'2026-10-19',commit:'f0f2b29bc7a31c11f3f91c11489e1ffa480dc94f',scope:'Reproducciones de comportamiento, no certificación de rendimientos',node:process.version,count:cases.length,cases};
  fs.writeFileSync(path.join(__dirname,'casos.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`${cases.length} casos de auditoría ejecutados; observaciones reproducidas. Véase casos.json.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
