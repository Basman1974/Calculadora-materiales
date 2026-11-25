const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');

const row=(part,start)=>part.items.find(r=>r[0].startsWith(start));

test('Lana: 10 m² exactos dan 15 paneles, no 16 por error de coma flotante',()=>{
  const f=fixture();f.set({wL:'4',wH:'2.5',wDoors:'0',wWins:'0'});f.api.wall();
  assert.match(row(f.add('wallResult'),'Lana mineral')[1],/· 15 panel/);
});
test('Tabique 2,60 × 2,50 m: 6 placas (3 columnas por cara), no 5',()=>{
  const f=fixture();f.set({wL:'2,60',wH:'2,5'});f.api.wall();
  assert.equal(row(f.add('wallResult'),'Placa PYL')[1],'6 uds');
});
test('Tabique 4 × 6 m: 16 placas (4 columnas × 2 filas de 3000 mm por cara), no 15',()=>{
  const f=fixture();f.set({wL:'4',wH:'6'});f.api.wall();
  assert.equal(row(f.add('wallResult'),'Placa PYL')[1],'16 uds');
});
test('Tabique por defecto mantiene 8 placas',()=>{
  const f=fixture();f.api.wall();
  assert.equal(row(f.add('wallResult'),'Placa PYL')[1],'8 uds');
});
test('Trasdosado 2,60 × 2,50 m con dos capas: 6 placas por geometría',()=>{
  const f=fixture();f.set({lL:'2,60',lH:'2,5'});f.api.lining();
  assert.equal(row(f.add('liningResult'),'Placa PYL')[1],'6 uds');
});
