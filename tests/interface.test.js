const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');

function budget(prices={}){
  const f=fixture({'calculadora-work-v1':JSON.stringify([{title:'Prueba',items:[['Material A','2 ud',''],['Material B','3 kg','']]}]),'calculadora-prices-v1':JSON.stringify(prices),'calculadora-job-v1':JSON.stringify({vat:'0'})});
  f.api.show('list');return f;
}
const inputs=f=>f.nodes.listContent.querySelectorAll('[data-price-key]');
async function type(f,input,text){input.value=text;await f.fireNode(input,'input');}

test('Tabique resume medidas con coma y huecos usando la misma superficie neta del resultado',()=>{
  const f=fixture();f.set({wL:'4,20',wH:'2,60',wDoors:'1',wWins:'1',wEdges:'3,5',wLabor:'12,75'});f.api.wall();
  assert.match(f.nodes.wallMeasureSummary.textContent,/4,2 × 2,6 m · 10,92 m² brutos · 7,80 m² netos/);
  assert.match(f.nodes.wallOpeningsSummary.textContent,/1 puerta.*1 ventana.*3,5 m/);
  assert.equal(f.nodes.wallLaborSummary.textContent,'12,75 €/m²');
  const part=f.add('wallResult');assert.ok(Math.abs(part.net-7.8)<1e-10);assert.ok(part.items.some(row=>row[0]==='Guardavivos metálico'));
  assert.equal(part.editor.values.wL,'4,20');assert.equal(part.items.length,f.api.rows()[0].items.length);
});

test('La configuración plegada conserva capas, placa, aislamiento y lámina en el resumen',()=>{
  const f=fixture();f.set({wA:'2',wB:'2',wBoardType:'hidro',wBoardThick:'12.5',wWool:'0',wMembrane:'both',wMembraneWaste:'7,5'});f.api.wall();
  assert.equal(!!f.nodes.wallSystemOptions.open,false);
  assert.match(f.nodes.wallSystemSummary.textContent,/2\+2.*Hidrófuga H 12,5 mm.*sin lana.*ambas caras.*7,5 %/);
  assert.equal(f.nodes.wBoardType.value,'hidro');assert.equal(f.nodes.wMembrane.value,'both');
});

test('Las plantillas reflejan la selección y conservan las medidas en el borrador',async()=>{
  const f=fixture();f.set({wL:'7,25'});const preset=f.all.find(n=>n.dataset.wallPreset==='doble');await preset.click();
  assert.equal(preset.attributes['aria-pressed'],'true');assert.match(f.nodes.wallSystemSummary.textContent,/2\+2/);
  const draft=JSON.parse(f.storage.get('calc-form-draft'));assert.equal(draft.wA,'2');assert.equal(draft.wL,'7,25');
  f.set({wP:'90'});f.api.wall();assert.equal(preset.attributes['aria-pressed'],'false');
});

test('Los errores de Tabique aparecen junto al campo y abren el bloque al enviar',async()=>{
  const f=fixture();f.set({wLabor:'abc'});await f.fire('wallForm','submit');
  assert.equal(f.nodes.wLaborError.hidden,false);assert.match(f.nodes.wLaborError.textContent,/Introduce un número/);
  assert.equal(f.nodes.wallLaborOptions.open,true);assert.equal(f.nodes.wLabor.focused,true);assert.doesNotMatch(f.nodes.wallResult.innerHTML,/addWork/);
  f.set({wLabor:'0',wDoors:'1.5'});f.api.wall();assert.match(f.nodes.wDoorsError.textContent,/entero/);
  f.set({wDoors:'1'});f.api.wall();assert.equal(f.nodes.wDoorsError.hidden,true);assert.match(f.nodes.wallResult.innerHTML,/addWork/);
});

test('Huecos excesivos se señalan y no permiten añadir una partida',async()=>{
  const f=fixture();f.set({wL:'1',wH:'1',wDoors:'2'});await f.fire('wallForm','submit');
  assert.equal(f.nodes.wallOpeningsError.hidden,false);assert.match(f.nodes.wallOpeningsSummary.textContent,/Revisar/);
  assert.equal(f.nodes.wallOpeningsOptions.open,true);assert.doesNotMatch(f.nodes.wallResult.innerHTML,/addWork/);
});

test('El aviso de altura sigue visible con ajustes cerrados y distingue la propuesta estructural',()=>{
  const f=fixture();f.set({wH:'4',wP:'48'});f.api.wall();assert.match(f.nodes.wallHeightNotice.textContent,/El resultado propone/);assert.match(f.nodes.wallSystemSummary.textContent,/M48/);
  f.set({wH:'8'});f.api.wall();assert.match(f.nodes.wallHeightNotice.textContent,/fuera de tabla/);assert.equal(!!f.nodes.wallSystemOptions.open,false);
});

test('Una lámina incompatible se desactiva sin dejar un error de merma oculto',()=>{
  const f=fixture();f.set({wA:'2',wMembrane:'1',wMembraneWaste:'abc'});f.api.wall();assert.equal(f.nodes.wMembraneWaste.checkValidity(),false);
  f.set({wA:'1'});f.api.wall();assert.equal(f.nodes.wMembrane.value,'none');assert.equal(f.nodes.wMembraneWaste.checkValidity(),true);
  assert.match(f.nodes.wallSystemSummary.textContent,/sin lámina/);assert.match(f.nodes.wallResult.innerHTML,/addWork/);
});

test('Intro permite pasar de largo a alto sin alterar las medidas',async()=>{
  const f=fixture();f.set({wL:'4,25'});await f.fireNode(f.nodes.wL,'keydown',{key:'Enter'});assert.equal(f.nodes.wH.focused,true);assert.equal(f.nodes.wL.value,'4,25');
});

test('Valorar pendientes recorre los precios y acepta 0 sin sustituir los campos',async()=>{
  const f=budget(),[a,b]=inputs(f);assert.match(f.nodes.budgetProgress.textContent,/2 material/);await f.fire('valuePending');assert.equal(a.focused,true);
  await type(f,a,'0');await f.fireNode(a,'keydown',{key:'Enter'});assert.equal(b.focused,true);assert.equal(inputs(f)[0],a);
  await type(f,b,'3,25');assert.equal(f.nodes.budgetQuickTotal.textContent,'9,75 €');assert.equal(f.nodes.valuePending.disabled,true);
  assert.match(f.nodes.budgetProgress.textContent,/Todos los materiales tienen precio/);assert.equal(b.value,'3,25');
});

test('Errores de precio quedan junto al campo y bloquean exportar sin alterar el último total',async()=>{
  const f=budget({'Material A':5,'Material B':2}),[a]=inputs(f);await type(f,a,'abc');
  const error=f.nodes.listContent.querySelectorAll('[data-price-error]')[0];assert.equal(error.hidden,false);assert.ok(error.textContent);
  assert.match(f.nodes.budgetProgress.textContent,/últimos valores válidos/);assert.equal(f.nodes.budgetQuickTotal.textContent,'16,00 €');
  await f.fire('exportCsv');assert.equal(f.blobs.length,0);assert.equal(a.focused,true);
  await type(f,a,'5');assert.equal(error.hidden,true);assert.equal(a.checkValidity(),true);
});

test('Cambiar proveedor conserva los otros campos y permite volver a escribir el precio anterior',async()=>{
  const f=budget({'Material A':5,'Material B':2});f.set({supplierName:'Proveedor alternativo'});await f.fire('supplierForm','submit');
  const id=f.api.catalog().providers.find(p=>p.name==='Proveedor alternativo').id;
  f.set({tariffMaterial:'Material A',tariffUnit:'ud',tariffProvider:id,tariffPrice:'7',tariffDate:'2026-10-15'});await f.fire('tariffForm','submit');
  f.api.show('list');const [a,b]=inputs(f);await type(f,b,'incorrecto');const select=f.nodes.listContent.querySelectorAll('[data-price-provider]')[0];select.value=id;await f.fireNode(select,'change');
  assert.equal(inputs(f)[0],a);assert.equal(inputs(f)[1],b);assert.equal(b.value,'incorrecto');assert.equal(b.checkValidity(),false);assert.equal(a.value,'7');
  await type(f,a,'5');assert.equal(f.api.pricing().entries.find(e=>e.materialId===f.api.id('Material A','ud')).price,5);
  assert.equal(f.nodes.listContent.querySelectorAll('[data-provider-name]')[0].textContent,'Proveedor alternativo');
});

test('IVA, beneficio, descuento y extras recalculan el resumen sin perder un precio en edición',async()=>{
  const f=budget({'Material A':500,'Material B':0}),[a,b]=inputs(f);
  f.set({jobProfitPct:'15'});await f.fire('jobProfitPct','input');f.set({jobDisc:'10'});await f.fire('jobDisc','input');
  for(const [vat,total]of [['0','1035,00 €'],['10','1138,50 €'],['21','1252,35 €']]){f.set({jobVat:vat});await f.fire('jobVat','change');assert.equal(f.nodes.budgetQuickTotal.textContent,total);}
  await type(f,b,'error');f.set({jobExtra:'12,50'});await f.fire('jobExtra','input');assert.equal(inputs(f)[0],a);assert.equal(inputs(f)[1],b);assert.equal(b.value,'error');
  assert.match(f.nodes.budgetAdjustmentsSummary.textContent,/IVA 21 %.*beneficio 15 %.*descuento 10 %.*12,50 €/);
  await f.fire('valuePending');assert.equal(b.focused,true);
});

test('Al volver del catálogo se recupera la línea consultada sin aplicar una tarifa nueva',async()=>{
  const f=budget({'Material A':5,'Material B':2});const offers=f.nodes.listContent.querySelectorAll('[data-price-offers]')[1];await offers.click();f.api.show('list');
  const input=inputs(f)[1];assert.equal(input.focused,true);assert.equal(input.value,'2');assert.equal(f.api.totals().grand,16);
});

test('Abrir una obra sin partidas limpia total y contador de pendientes',async()=>{
  const f=budget({'Material A':5});await f.fire('viewMaterials');assert.equal(f.nodes.budgetOverview.hidden,true);await f.fire('valuePending');assert.equal(f.nodes.listContent.classList.contains('materialsOnly'),false);assert.equal(f.nodes.budgetOverview.hidden,false);
  await f.fire('jobNew');assert.equal(f.nodes.budgetQuickTotal.textContent,'0,00 €');assert.equal(f.nodes.valuePending.disabled,true);assert.match(f.nodes.budgetProgress.textContent,/Añade una partida/);
});

test('Un extra incorrecto se explica junto al campo y permite abrir los ajustes para corregirlo',async()=>{
  const f=budget({'Material A':5,'Material B':2});f.set({jobLaborExtra:'-2'});await f.fire('jobLaborExtra','input');
  assert.equal(f.nodes.jobLaborExtraError.hidden,false);assert.match(f.nodes.jobLaborExtraError.textContent,/importe válido/);
  await f.fire('valuePending');assert.equal(f.nodes.budgetAdjustments.open,true);assert.equal(f.nodes.jobLaborExtra.focused,true);
  f.set({jobLaborExtra:'2,50'});await f.fire('jobLaborExtra','input');assert.equal(f.nodes.jobLaborExtraError.hidden,true);assert.equal(f.nodes.budgetQuickTotal.textContent,'18,50 €');
});
