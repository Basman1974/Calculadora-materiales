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
test('Ladrillo: referencia de catálogo 86 kg/m² × 10 m² = 860 kg, marcada como no contrastada',()=>{
  const f=fixture();f.set({wetArea:10,wetWaste:0,wetMortarWaste:0});f.select('ladrillos','Termocerámico 24 cm');f.api.wet();
  const r=row(f.add('wetResult'),'Referencia de catálogo');
  assert.equal(r[1],'860.0 kg');assert.match(r[0],/no contrastada/);
});
test('Ladrillo 4 cm: catálogo corregido a 15 kg/m² (foto del punto de venta)',()=>{
  const f=fixture();f.data.ladrillos;const d=f.data.ladrillos['Hueco sencillo 33x16.5x4'];assert.equal(d.m,15);
});
test('Revestimientos sin ficha verificada quedan marcados como no contrastados',()=>{
  const f=fixture();const d=f.data.revestimientos;
  assert.match(d['weber.rev fino'].spec,/no contrastado/);assert.match(d['APLICAREV Cal Nature Pro'].spec,/no contrastado/);
  assert.equal(d['weberpral prisma'].kg,1.5);assert.equal(d['weberev hidro PLUS'].kg,1.8);
});
