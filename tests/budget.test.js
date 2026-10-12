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
