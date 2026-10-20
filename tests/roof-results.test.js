const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');

const summary=f=>f.nodes.roofResult.innerHTML.split('<details class="techDetails">')[0];
function screenshotCase(){
  const f=fixture();
  f.set({rL:'3.3',rW:'2.2',rLayers:'2',rBoardThick:'15'});
  f.api.roofSys('simple');
  return f;
}

test('Caso confirmado: TC47 simple con una BA15 calcula cuatro placas y muestra la estructura',()=>{
  const f=screenshotCase();f.set({rLayers:1});f.api.roof();
  const part=f.add('roofResult'),visible=summary(f);
  assert.match(visible,/1 placa\(s\) de 15 mm/);
  assert.equal(part.items.find(row=>row[0].startsWith('Placa PYL'))[1],'4 uds');
  assert.equal(f.nodes.rWeight.checkValidity(),true);
  assert.equal(part.roofLayout.supported,true);
  assert.match(visible,/TC47 portante 3000/);
  assert.match(visible,/Horquillas \/ cuelgues Pívot F47\/17/);
  assert.doesNotMatch(visible,/data-roof-complete="rWeight"|Tornillos 2.ª placa/);
  assert.equal(part.editor.values.rLayers,'1');
  assert.equal(part.editor.values.rBoardThick,'15');
});

test('Caso de la captura: 7,26 m² y dos BA15 muestran los materiales pendientes sin abrir detalles',()=>{
  const f=screenshotCase(),visible=summary(f);
  assert.match(visible,/7.26 m²/);
  assert.match(visible,/2 placa\(s\) de 15 mm/);
  assert.match(visible,/DESPIECE INCOMPLETO/);
  assert.match(visible,/Perfilería y suspensiones TC47/);
  assert.match(visible,/Tornillos y tratamiento de juntas/);
  assert.match(visible,/Pendiente de calcular/);
  assert.match(visible,/Introduce el peso del conjunto según ficha/);
  assert.match(visible,/data-roof-complete="rWeight"/);
  assert.match(f.nodes.roofLoadSummary.textContent,/Falta el peso/);
  assert.equal(f.nodes.rWeight.value,'');
  assert.equal(f.nodes.rWeight.checkValidity(),false);
  assert.equal(f.nodes.roofResult.querySelector('.addWork').textContent,'Guardar despiece incompleto');
  assert.equal(f.add('roofResult').items.find(r=>r[0].startsWith('Placa PYL'))[1],'7 uds');
});

test('Calcular abre el campo de peso y el botón del resultado conduce al mismo campo',async()=>{
  const f=screenshotCase();
  await f.fire('roofForm','submit');
  assert.equal(f.nodes.roofLoadOptions.open,true);
  assert.equal(f.nodes.rWeight.focused,true);
  assert.match(f.nodes.rWeightError.textContent,/2 placa\(s\) de 15 mm/);
  f.nodes.roofLoadOptions.open=false;f.nodes.rWeight.focused=false;
  await f.nodes.roofResult.querySelector('[data-roof-complete="rWeight"]').click();
  assert.equal(f.nodes.roofLoadOptions.open,true);
  assert.equal(f.nodes.rWeight.focused,true);
});

test('Completar un peso de prueba recalcula perfiles y cuelgues; los auxiliares sin datos siguen visibles',async()=>{
  const f=screenshotCase();
  // Dato manual de prueba: no se propone como peso de ningún producto.
  f.set({rWeight:'25'});
  await f.fire('rWeight','input');
  const visible=summary(f);
  assert.equal(f.nodes.rWeight.checkValidity(),true);
  assert.equal(f.nodes.rWeightError.hidden,true);
  assert.doesNotMatch(visible,/data-roof-complete="rWeight"/);
  assert.match(visible,/TC47 portante 3000/);
  assert.match(visible,/Horquillas \/ cuelgues Pívot F47\/17/);
  assert.match(visible,/Tornillos 2.ª placa/);
  assert.match(visible,/Varilla roscada M6/);
  assert.match(visible,/Pasta de juntas/);
  const part=f.add('roofResult');
  assert.equal(part.roofLayout.hangers,24); // 6 recorridos × 4 cuelgues a paso <= 1 m.
  assert.equal(part.items.find(r=>r[0]==='TC47 portante 3000')[1],'12 barras');
  assert.equal(part.incomplete,true);
});

test('Acciones de varilla y pasta abren sus bloques; completarlas retira el estado de cantidades incompletas',async()=>{
  const f=screenshotCase();f.set({rWeight:25});f.api.roof();
  await f.nodes.roofResult.querySelector('[data-roof-complete="rRodMargin"]').click();
  assert.equal(f.nodes.roofSuspensionOptions.open,true);
  assert.equal(f.nodes.rRodMargin.focused,true);
  await f.nodes.roofResult.querySelector('[data-roof-complete="rPasteRate"]').click();
  assert.equal(f.nodes.roofFinishingOptions.open,true);
  assert.equal(f.nodes.rPasteRate.focused,true);
  f.set({rRodMargin:5,rPasteRate:.5});await f.fire('rPasteRate','input');
  const visible=summary(f);
  assert.doesNotMatch(visible,/DESPIECE INCOMPLETO|data-roof-complete|Pendiente de calcular/);
  assert.match(visible,/MATERIALES CALCULADOS/);
  assert.match(visible,/provisional/);
  assert.equal(f.add('roofResult').incomplete,true); // Sigue pendiente la validación del sistema real.
});

test('Cambiar a una placa BA15 o a T24 retira el error de peso sin modificar el dato manual',async()=>{
  const f=screenshotCase();f.set({rLayers:1});await f.fire('rLayers','change');
  assert.equal(f.nodes.rWeight.checkValidity(),true);
  assert.match(f.nodes.roofLoadSummary.textContent,/12,5/);
  assert.match(summary(f),/Horquillas/);
  f.set({rLayers:2});f.api.roof();assert.equal(f.nodes.rWeight.checkValidity(),false);
  f.api.roofSys('desmontable60');
  assert.equal(f.nodes.rWeight.checkValidity(),true);
  assert.doesNotMatch(summary(f),/data-roof-complete="rWeight"/);
});

for(const [sys,values,material,button]of [
  ['simple',{rReference:'generic'},'Perfilería y suspensiones TC47','rReference'],
  ['double',{rBoardType:'rf'},'Perfilería y suspensiones TC47','rBoardType'],
  ['simple',{rBoardThick:18},'Perfilería y suspensiones TC47','rBoardThick'],
  ['double',{rExtraLoad:50},'Perfilería y suspensiones TC47','rWeight'],
  ['sierra',{},'Suspensiones sierra','rSierraRuns'],
  ['cm70',{},'Montante M70',null],
  ['escayola',{},'Fijaciones de estopa','rGypsumPoints']
]){
  test('Pendientes visibles también en '+sys+' '+JSON.stringify(values),async()=>{
    const f=fixture();f.set(values);f.api.roofSys(sys);
    assert.match(summary(f),/DESPIECE INCOMPLETO/);
    assert.ok(summary(f).includes(material));
    if(button){
      await f.nodes.roofResult.querySelector('[data-roof-complete="'+button+'"]').click();
      assert.equal(f.nodes[button].focused,true);
    }
    const before=JSON.stringify(f.add('roofResult').items);
    await f.fire('exportCsv');
    assert.match(await f.blobs.at(-1).text(),/provisional/i);
    assert.equal(JSON.stringify(f.api.rows()[0].items),before);
  });
}
