const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');

test('Ladrillo: geometría 33×16,5×4, junta 5 mm, sin merma y sin doble mortero',()=>{
  const f=fixture();f.set({wetArea:10,wetWaste:0,wetMortarWaste:0});f.api.wet();const part=f.add('wetResult');
  assert.equal(part.items[0][1],'176 uds');
  assert.match(part.items[0][2],/17.56 ud\/m²/);
  assert.equal(part.items.find(r=>r[0]==='Volumen geométrico de mortero')[1],'17.6 L');
  const t=f.api.totals();assert.equal(t.rows.length,2);assert.equal(t.missing,2);
});
test('Volver a obra húmeda conserva dimensiones editadas',()=>{
  const f=fixture();f.set({wetBrickL:24,wetBrickH:12,wetBrickT:5});f.api.show('wet');assert.equal(f.nodes.wetBrickL.value,'24');
});
test('Un ladrillo sin dimensiones exige introducirlas',()=>{
  const f=fixture();f.select('ladrillos','Perforado 10 cm');f.api.wet();assert.equal(f.nodes.wetBrickL.value,'');assert.match(f.nodes.wetResult.innerHTML,/role="alert"/);assert.doesNotMatch(f.nodes.wetResult.innerHTML,/Añadir a Obra/);
});
for(const [name,area,consumption,expected]of [['SikaTop-50',100,0.15,'3 envase(s) de 5 kg'],['SikaTop-30',100,0.175,'4 envase(s) de 5 kg'],['Puente de Unión Morteros Henares (PTU-20)',100,0.45,'9 envase(s) de 5 kg'],['Aplica primer TOP 5KG',100,0.175,'4 envase(s) de 5 kg']]){
  test('Puente: '+name+' mantiene consumo en kg y envases correctos',()=>{
    const f=fixture();f.select('puentes',name);f.set({wetArea:area,wetWaste:0,wetConsumption:consumption});f.api.wet();const part=f.add('wetResult');assert.equal(part.items[0][1],expected);assert.equal(f.api.totals().rows[0].unit,'envase');
  });
}
test('SikaTop-10: consumo configurable por capa y dos capas',()=>{
  const f=fixture();f.select('puentes','SikaTop-10');f.set({wetArea:100,wetWaste:0,wetConsumption:0.5,wetCoats:2});f.api.wet();const part=f.add('wetResult');assert.equal(part.items[0][1],'20 envase(s) de 5 kg');assert.match(part.items[0][2],/100.00 kg/);
});
test('Level Primer: concentrado según las dos diluciones del soporte poroso',()=>{
  const f=fixture();f.select('puentes','Imprimacion Aplica Level Primer 5 L');f.set({wetArea:100,wetWaste:0,wetSupport:'poroso'});f.api.wet();assert.match(f.add('wetResult').items[0][2],/11.00 L de concentrado/);
});
test('PRISMA utiliza la ficha de 2026 y advierte capas; fino rechaza 10 mm',()=>{
  const f=fixture();f.select('revestimientos','weberpral prisma');f.set({wetArea:10,wetWaste:0,wetMortarWaste:0,wetThickness:20});f.api.wet();const part=f.add('wetResult');assert.equal(part.items[0][1],'12 sacos');assert.match(part.items[1][2],/15 mm por capa/);
  f.select('revestimientos','weber.rev fino');f.set({wetThickness:10});f.api.wet();assert.match(f.nodes.wetResult.innerHTML,/Espesor fuera/);
});
for(const [name,area,thickness,waste,expectedKg,expectedSacks]of [
  ['APLICAREV Cal Nature Pro',10,10,0,'180.00',8],
  ['APLICAREV Cal Nature Pro',10,10,10,'198.00',8],
  ['APLICAREV Cal Nature Pro',25,10,0,'450.00',18],
  ['APLICAREV Cal Nature Pro',10,20,0,'360.00',15],
  ['Mortero Cal revoco Aplicarev 25kg BCO',10,9,0,'126.00',6],
  ['Mortero Cal revoco Aplicarev 25kg BCO',10,7,10,'107.80',5]
]){
  test('Mortero de cal: '+name+' '+area+' m² × '+thickness+' mm, merma '+waste+' %',()=>{
    const f=fixture();f.select('revestimientos',name);f.set({wetArea:area,wetThickness:thickness,wetWaste:waste});f.api.wet();
    const part=f.add('wetResult'),material=part.items[0],total=f.api.totals();
    assert.equal(material[1],expectedSacks+' sacos');assert.ok(material[2].startsWith(expectedKg+' kg ·'));
    assert.equal(total.rows[0].qty,expectedSacks);assert.equal(total.rows[0].unit,'saco');assert.equal(total.incomplete,0);
  });
}
for(const thickness of [9.01,10]){
  test('Cal Revoco rechaza espesores superiores a 9 mm: '+thickness,()=>{
    const f=fixture();f.select('revestimientos','Mortero Cal revoco Aplicarev 25kg BCO');f.set({wetThickness:thickness});f.api.wet();
    assert.match(f.nodes.wetResult.innerHTML,/role="alert"/);assert.doesNotMatch(f.nodes.wetResult.innerHTML,/Añadir a Obra/);
  });
}
test('Cal Nature antiguo conserva cantidades, precio y copia; editar aplica el consumo actualizado',()=>{
  const name='APLICAREV Cal Nature Pro';
  const oldPart={title:name+' · 10.00 m²',calculationVersion:'20261012-auditoria',items:[[name,'9 sacos','205.20 kg · espesor 10 mm · merma 8 %']],editor:{screen:'wet',cat:'revestimientos',values:{wetProduct:name,wetArea:'10',wetMeasureMode:'direct',wetThickness:'10',wetWaste:'8'}}};
  const f=fixture({'calculadora-work-v1':JSON.stringify([oldPart]),'calculadora-prices-v1':JSON.stringify({[name+' [saco]']:10}),'calculadora-job-v1':JSON.stringify({vat:0}),'calculadora-jobs-v1':JSON.stringify([{meta:{vat:0},work:[oldPart],prices:{[name+' [saco]']:10}}])});
  assert.equal(f.api.rows()[0].items[0][1],'9 sacos');assert.equal(f.api.totals().mat,90);assert.equal(f.api.totals().provisional,true);
  f.api.show('work');f.nodes.workContent.querySelectorAll('[data-edit]')[0].click();f.add('wetResult');
  assert.equal(f.api.rows().length,1);assert.equal(f.api.rows()[0].items[0][1],'8 sacos');assert.match(f.api.rows()[0].items[0][2],/^194.40 kg/);
  assert.equal(f.api.totals().mat,80);assert.equal(f.api.totals().provisional,false);
  assert.equal(f.api.state().savedJobs[0].work[0].items[0][1],'9 sacos');
});
test('Cerámica: respeta merma cero y las cuñas dependen de la tanda',()=>{
  const f=fixture();f.set({cA:60,cB:60,cArea:36,cWaste:0,cBatchArea:5});f.api.ceramic();const part=f.add('levelResult');assert.equal(part.items.find(r=>r[0]==='Baldosas / piezas')[1],'100 uds');assert.equal(part.items.find(r=>r[0]==='Cuñas reutilizables')[1],'60 uds');assert.equal(f.api.totals().rows.length,5);
});
test('T24 60×120: 50 placas exactas y solo secundarios de 1200',()=>{
  const f=fixture();f.set({rL:6,rW:6,rWaste:0});f.api.roofSys('desmontable120');const part=f.add('roofResult');assert.equal(part.items[0][1],'50 uds');assert.equal(part.items.find(r=>r[0]==='Perfil T24 secundario 1200')[1],'54 barras');assert.equal(part.items.some(r=>r[0]==='Perfil T24 secundario 600'),false);assert.equal(f.api.totals().provisional,true);
});
test('Varillas: 21 suspensiones de 70 cm necesitan 21 barras de 1 m',()=>{
  const f=fixture();assert.equal(f.api.rod(21,70)[1],'21 uds');assert.equal(f.api.rod(21,30)[1],'7 uds');assert.equal(f.api.rod(21,120)[1],'No dimensionados');
});
test('Doble TC47: crucetas coinciden con las intersecciones de los perfiles',()=>{
  const f=fixture();f.api.roof();const part=f.add('roofResult');assert.equal(part.items.find(r=>r[0]==='Crucetas F47/17')[1],'66 uds');
});
test('Trasdosado directo: pasta aproximada configurable y sin estructura',()=>{
  const f=fixture();f.set({lL:4,lH:2.5,lWaste:0,lPasteRate:5});f.api.liningType('direct');const part=f.add('liningResult');assert.equal(part.items.find(r=>r[0]==='Pasta de agarre')[1],'3 saco(s) de 20 kg');assert.equal(part.items.some(r=>/Montante|Canal|Tornillos/.test(r[0])),false);assert.equal(f.nodes.lProfileWrap.classList.contains('hidden'),true);
});
test('Tabique de dos caras, guardavivos medidos y presupuesto fuera de tabla provisional',()=>{
  const f=fixture();f.set({wL:4,wH:2.5,wA:1,wB:1});f.api.wall();let part=f.add('wallResult');assert.equal(part.items[0][1],'8 uds');assert.equal(part.items.some(r=>r[0]==='Guardavivos metálico'),false);
  f.set({wEdges:4.2,wH:10});f.api.wall();part=f.add('wallResult');assert.equal(part.items.find(r=>r[0]==='Guardavivos metálico')[1],'4.20 m · 2 barras de 3 m');assert.equal(f.api.totals().incomplete,1);
});
for(const [method,result,values]of [['wall','wallResult',{wL:0}],['lining','liningResult',{lH:'Infinity'}],['roof','roofResult',{rHoles:21}],['wall','wallResult',{wDoors:0.5}],['wet','wetResult',{wetArea:-2}],['ceramic','levelResult',{cJoint:0}]]){
  test('Validación '+method+' '+JSON.stringify(values),()=>{const f=fixture();f.set(values);f.api[method]();assert.match(f.nodes[result].innerHTML,/role="alert"/);assert.doesNotMatch(f.nodes[result].innerHTML,/Añadir a Obra/);});
}
test('Todos los sistemas de techo y trasdosado generan resultados sin errores JS',()=>{
  const f=fixture();for(const sys of ['simple','double','sierra','cm70','desmontable60','desmontable120','escayola']){f.api.roofSys(sys);assert.match(f.nodes.roofResult.innerHTML,/Añadir a Obra/);}
  for(const type of ['direct','semi','auto']){f.api.liningType(type);assert.match(f.nodes.liningResult.innerHTML,/Añadir a Obra/);}
});

test('Cerámica: junta de 0,2 mm y tanda de 0,1 m² se respetan sin mínimos ocultos',()=>{
  const f=fixture();f.set({cA:60,cB:60,cArea:10,cWaste:0,cBatchArea:0.1,cJoint:0.2,cThickness:10});f.api.ceramic();const rows=f.add('levelResult').items;assert.equal(rows.find(r=>r[0]==='Cuñas reutilizables')[1],'2 uds');assert.match(rows.find(r=>r[0]==='Mortero de juntas')[2],/0.011 kg\/m²/);
});
test('Pasta y cinta conservan cantidades decimales antes del redondeo de envases',()=>{
  const f=fixture();f.set({wL:4,wH:2.5,wA:1,wB:1});f.api.wall();const part=f.add('wallResult');assert.equal(part.items.find(r=>r[0]==='Pasta de juntas cara vista')[1],'8.80 kg · 1 saco(s) de 20 kg');
});
test('El arranque soporta almacenamiento de tipos erróneos sin sobrescribirlo',()=>{
  const invalid={'calculadora-work-v1':'{}','calculadora-jobs-v1':'"texto"','calculadora-prices-v1':'[]'};
  const f=fixture(invalid);assert.equal(f.api.state().work.length,0);assert.equal(f.api.state().savedJobs.length,0);assert.equal(f.storage.get('calculadora-work-v1'),'{}');
});
test('Navegación lógica: las nueve secciones existen y se activan al seleccionar',()=>{
  const f=fixture();for(const id of ['home','wall','lining','roof','wet','ceramic','work','list','help']){f.api.show(id);assert.equal(f.nodes[id].classList.contains('active'),true);}
});

test('Las mermas de ladrillos y mortero se calculan de forma independiente',()=>{
  const f=fixture();f.set({wetArea:10,wetWaste:0,wetMortarWaste:10});f.api.wet();const part=f.add('wetResult');assert.equal(part.items[0][1],'176 uds');assert.equal(part.items.find(r=>r[0]==='Volumen geométrico de mortero')[1],'19.3 L');
});

test('Bloques: el consumo de mortero configurado se calcula sin usar geometría de ladrillo',()=>{
  const f=fixture();f.select('bloques','Bloque ligero gris 39x19x19');f.set({wetArea:10,wetWaste:0,wetMortarWaste:0,wetBlockMortar:10});f.api.wet();const rows=f.add('wetResult').items;assert.equal(rows[0][1],'125 uds');assert.equal(rows.find(r=>r[0]==='Mortero')[1],'4 sacos de 25 kg');
});
test('Editar una partida recupera el sistema de techo y sus tarjetas',()=>{
  const f=fixture();f.api.roofSys('desmontable120');f.add('roofResult');f.api.roofSys('simple');f.api.show('work');f.nodes.workContent.querySelectorAll('[data-edit]')[0].click();assert.equal(f.nodes.rSys.value,'desmontable120');const selected=f.all.find(n=>n.dataset.roofSys==='desmontable120');assert.equal(selected.attributes['aria-pressed'],'true');assert.equal(selected.classList.contains('hidden'),false);
});

test('Caravista: no se interpreta el orden de dimensiones del nombre como alto/espesor verificados',()=>{
  const f=fixture();f.select('ladrillos','Rojo liso caravista 24x12x5');f.api.wet();assert.equal(f.nodes.wetBrickH.value,'');assert.match(f.nodes.wetResult.innerHTML,/role="alert"/);
});

test('Cambiar sistema elimina errores de controles que quedan ocultos',()=>{
  const f=fixture();f.set({lPasteRate:-1});f.api.liningType('direct');assert.equal(f.nodes.lPasteRate.checkValidity(),false);f.api.liningType('auto');assert.equal(f.nodes.lPasteRate.checkValidity(),true);
  f.select('ladrillos','Perforado 10 cm');f.api.wet();assert.equal(f.nodes.wetBrickH.checkValidity(),false);f.select('bloques','Bloque ligero gris 39x19x19');f.api.wet();assert.equal(f.nodes.wetBrickH.checkValidity(),true);
});

test('Alturas condicionales y techo incompleto muestran su advertencia antes del detalle',()=>{
  const f=fixture();f.api.wall();assert.match(f.nodes.wallResult.innerHTML,/no acredita la validez de perfiles genéricos/);assert.ok(f.nodes.wallResult.innerHTML.indexOf('perfiles genéricos')<f.nodes.wallResult.innerHTML.indexOf('techDetails'));f.api.roof();assert.match(f.nodes.roofResult.innerHTML,/El presupuesto será provisional/);
});
