const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

// Ejecuta el bloque real de presupuesto sin cambiar la API de la PWA ni sus fragmentos.
function calculator(){
  const source = readFileSync(join(__dirname, '..', 'app-a1.js'), 'utf8');
  const end = source.indexOf('  const screens =');
  assert.ok(end > 0, 'Debe existir el bloque de presupuesto antes de la navegación');
  const context = vm.createContext({
    document:{querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null},
    localStorage:{getItem:()=>null, setItem:()=>{}}
  });
  vm.runInContext(source.slice(0, end) + `
    globalThis.budget = {
      totals:budgetTotals, summary:budgetSummary, percentage:percentageValue,
      normalize:normalizeJobMeta,
      csv:parseTariffCsv,safeCell:csvSafeCell,
      set:(parts, prices, meta)=>{work=parts;priceBook=prices;jobMeta=meta;}
    };
  })();`, context);
  return context.budget;
}

function thousand(meta = {}){
  const calc = calculator();
  calc.set([{title:'Prueba',items:[['Material','10 ud',''],['Mano de obra montaje','200,00 €','']]}],
    {Material:50}, {vat:21,laborExtra:200,extra:100,disc:0,profitPct:0,...meta});
  return calc;
}

test('Ejemplo: coste de 1.000 €, beneficio del 15 % e IVA del 21 %', ()=>{
  const t = thousand({profitPct:15}).totals();
  assert.equal(t.base,1000);
  assert.equal(t.profit,150);
  assert.equal(t.subtotal,1150);
  assert.equal(t.vat,241.50);
  assert.equal(t.grand,1391.50);
});

test('Filas informativas, cantidad cero y referencia de mortero no piden precio',()=>{
  const c=calculator();c.set([{title:'Cerámica',items:[['Tipo de baldosa','Porcelánico',''],['Encolado','Doble encolado',''],['Baldosas','0 uds','']]},{title:'Ladrillo',items:[['Mortero de colocación','14 L',''],['Mortero predosificado','1 sacos de 25 kg','']]}],{'Mortero predosificado':4},{vat:0});
  const t=c.totals();assert.equal(t.rows.length,1);assert.equal(t.missing,0);assert.equal(t.grand,4);
});
test('Material con igual nombre y distinta unidad no mezcla cantidades ni hereda el precio ambiguo',()=>{
  const c=calculator();c.set([{title:'Unidades',items:[['Mortero','10 kg',''],['Mortero','2 sacos','']]}],{Mortero:100,'Mortero [kg]':1,'Mortero [saco]':5},{vat:0});
  const t=c.totals();assert.equal(t.rows.length,2);assert.equal(t.grand,20);assert.deepEqual(Array.from(t.rows,r=>r.qty),[10,2]);
});
test('Un despiece incompleto sigue provisional aunque todos los materiales tengan precio',()=>{
  const c=calculator();c.set([{title:'Fuera de tabla',items:[['Placas','2 ud',''],['Montantes','No dimensionados','']]}],{Placas:10},{vat:21});
  const t=c.totals();assert.equal(t.missing,0);assert.equal(t.incomplete,1);assert.equal(t.provisional,true);assert.equal(c.summary(t).at(-1).label,'TOTAL PROVISIONAL');
});
test('Los precios no finitos o negativos se consideran pendientes y no generan Infinity',()=>{
  const c=calculator();for(const price of [Infinity,-1,'abc']){c.set([{title:'A',items:[['A','1 ud','']]}],{A:price},{vat:'Infinity',extra:'Infinity',laborExtra:-10});const t=c.totals();assert.equal(t.missing,1);assert.equal(t.grand,0);}
});
test('CSV: comillas, coma decimal, separador dentro de nombre y cabecera',()=>{
  const c=calculator();const comma=c.csv('Material,Precio\r\n"Perfil, especial","1,25"\r\n"Placa ""H""",2.50');
  assert.equal(comma[0][0],'Perfil, especial');assert.equal(comma[0][1],1.25);assert.equal(comma[1][0],'Placa "H"');
  assert.equal(c.csv('\ufeffNombre;Precio\n"Mortero; 25 kg";"3,75"')[0][1],3.75);
  for(const bad of ['A;abc','A;-1','A;Infinity','"A;1.2'])assert.throws(()=>c.csv(bad));
});
test('CSV: protege texto interpretado como fórmula y mantiene los descuentos numéricos',()=>{
  const c=calculator();assert.equal(c.safeCell('=SUM(A1)'),"'=SUM(A1)");assert.equal(c.safeCell('+CMD'),"'+CMD");assert.equal(c.safeCell('-115,00'),'-115,00');assert.equal(c.safeCell('Material'),'Material');
});

test('Ejemplo: descuento del 10 % después del beneficio', ()=>{
  const t = thousand({profitPct:15,disc:10}).totals();
  assert.equal(t.disc,115);
  assert.equal(t.taxable,1035);
  assert.equal(t.vat,217.35);
  assert.equal(t.grand,1252.35);
});

for(const [vat,expected] of [[0,1035],[10,1138.50],[21,1252.35]]){
  test('IVA '+vat+' % con beneficio y descuento', ()=>{
    assert.equal(thousand({profitPct:15,disc:10,vat}).totals().grand,expected);
  });
}

test('Presupuestos anteriores y porcentaje ausente conservan el 0 %', ()=>{
  const c = thousand();
  const old = c.normalize({name:'Antigua',vat:'21',disc:10});
  assert.equal(old.profitPct,0);
  assert.equal(old.name,'Antigua');
  const t = thousand({profitPct:undefined,disc:10}).totals();
  assert.equal(t.profit,0);
  assert.equal(t.taxable,900);
  assert.equal(t.grand,1089);
});

test('Porcentajes decimales con coma y punto; son recargo sobre el coste', ()=>{
  for(const profitPct of ['12,5','12.5']){
    const t = thousand({profitPct}).totals();
    assert.equal(t.profit,125);
    assert.equal(t.grand,1361.25);
  }
  const t = thousand({profitPct:'15',disc:'2,5'}).totals();
  assert.equal(t.disc,28.75);
  assert.equal(t.taxable,1121.25);
  assert.equal(t.grand,1356.71);
});

test('Validación: vacío, extremos y números no válidos', ()=>{
  const c = calculator();
  assert.equal(c.percentage('',1000),0);
  assert.equal(c.percentage(' 15,25 ',1000),15.25);
  assert.equal(c.percentage(',5',1000),0.5);
  assert.equal(c.percentage('1000',1000),1000);
  assert.equal(c.percentage(0.0000001,1000),0.0000001);
  for(const value of ['-1','1000.01','Infinity','NaN','1e2','0x10','abc','15 %','1,2,3']){
    assert.equal(c.percentage(value,1000),null,value);
  }
  assert.equal(c.percentage('100.01',100),null);
});

test('Descuento del 100 % y máximo técnico de recargo', ()=>{
  assert.equal(thousand({profitPct:15,disc:100}).totals().grand,0);
  const t = thousand({profitPct:1000,vat:0}).totals();
  assert.equal(t.profit,10000);
  assert.equal(t.grand,11000);
});

test('Los materiales sin precio siguen pendientes; precio explícito 0 es válido', ()=>{
  const c = calculator();
  const parts = [{title:'Sin valorar',items:[['A','2 ud',''],['B','1 ud','']]}];
  c.set(parts,{A:0},{vat:21,profitPct:15});
  const t = c.totals();
  assert.equal(t.missing,1);
  assert.equal(t.grand,0);
  assert.equal(c.summary(t).at(-1).label,'TOTAL PROVISIONAL');
});

test('Obra vacía no genera importes', ()=>{
  const c = calculator();
  c.set([],{}, {vat:21,profitPct:15});
  assert.equal(c.totals().grand,0);
});

test('Cantidades precisas y redondeo a céntimos de líneas e importes sucesivos', ()=>{
  const c = calculator();
  c.set([{title:'Decimales',items:[['A','1.005 m²',''],['B','1.005 m²','']]}],
    {A:1,B:1},{vat:21,profitPct:15,disc:10});
  const t = c.totals();
  assert.equal(t.rows[0].qty,1.005);
  assert.equal(t.rows[0].total,1.01);
  assert.equal(t.mat,2.02);
  assert.equal(t.profit,0.30);
  assert.equal(t.subtotal,2.32);
  assert.equal(t.disc,0.23);
  assert.equal(t.taxable,2.09);
  assert.equal(t.vat,0.44);
  assert.equal(t.grand,2.53);
});

test('El desglose común incluye extras, porcentaje, descuento y total', ()=>{
  const c = thousand({profitPct:15,disc:10});
  const summary = c.summary(c.totals());
  assert.equal(summary.find(x=>x.label==='Desplazamiento / varios').amount,100);
  assert.equal(summary.find(x=>x.label==='Beneficio industrial 15 %').amount,150);
  assert.equal(summary.find(x=>x.label==='Descuento 10 %').amount,-115);
  assert.equal(summary.at(-1).amount,1252.35);
});

test('Un porcentaje decimal pequeño no se pierde al guardarlo como número',()=>{
  const c=thousand({profitPct:0.0000001});
  assert.equal(c.totals().profitPct,0.0000001);
  assert.equal(c.summary(c.totals()).find(x=>x.label.startsWith('Beneficio')).label,'Beneficio industrial 0,0000001 %');
});

test('Formatos distintos de ladrillo en obras anteriores requieren precios separados',()=>{
  const c=calculator();c.set([{title:'A',items:[['Ladrillo cerámico','10 uds','formato 33 × 16,5 × 4 cm · junta 5 mm']]},{title:'B',items:[['Ladrillo cerámico','20 uds','formato 33 × 20 × 7 cm · junta 5 mm']]}],{'Ladrillo cerámico':1},{vat:0});
  assert.equal(c.totals().rows.length,2);assert.equal(c.totals().missing,2);
});

test('El precio por unidad permanece al eliminar la otra unidad con el mismo nombre',()=>{
  const c=calculator(),prices={Mortero:100,'Mortero [kg]':1,'Mortero [saco]':5};
  c.set([{title:'Mezcla',items:[['Mortero','10 kg',''],['Mortero','2 sacos','']]}],prices,{vat:0});assert.equal(c.totals().grand,20);
  c.set([{title:'Restante',items:[['Mortero','10 kg','']]}],prices,{vat:0});assert.equal(c.totals().grand,10);assert.equal(c.totals().rows[0].key,'Mortero [kg]');
});
