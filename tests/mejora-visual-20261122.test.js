const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const fixture=require('./material-fixture.cjs');
const root=join(__dirname,'..');

test('Peso del tabique: placas, perfiles y sacos con pesos de ficha',()=>{
  const f=fixture();f.set({wL:4,wH:2.5,wA:1,wB:1,wDoors:0,wWins:0});f.api.wall();
  const html=f.nodes.wallResult.innerHTML;
  // 8 placas BA15 1200×2500 × 10,8 kg/m² = 259,2 · 8 montantes M70 × 3 m × 0,70 = 16,8 · 3 canales R70 × 3 m × 0,55 = 4,95 · 1 saco de 20 kg
  assert.match(html,/≈ 301 kg/);
  assert.match(f.nodes.wallLive.innerHTML,/8 placas.*10,00 m².*≈ 301 kg/);
  assert.equal(f.nodes.wallLive.hidden,false);
});
test('Resultado con dibujo a escala, sección y cifras con coma decimal',()=>{
  const f=fixture();f.set({wL:4,wH:2.6,wDoors:1,wWins:1});f.api.wall();
  const html=f.nodes.wallResult.innerHTML;
  assert.match(html,/<figure class="planBox">/);
  assert.match(html,/Alzado de tabique de 4,00 por 2,60 metros/);
  assert.match(html,/class="pHole"/);
  assert.match(html,/Sección: 1 placa · M70 con lana · 1 placa/);
  // Cantidad visible en formato es-ES; la fila guardada no cambia.
  assert.match(html.split('<details class="techDetails">')[0],/1 rollo de 150 m/);
  assert.doesNotMatch(html.split('<details class="techDetails">')[0],/rollo\(s\)/);
  assert.match(f.add('wallResult').items.find(r=>r[0]==='Cinta de papel cara vista')[1],/rollo\(s\)/);
});
test('Trasdosado por estancia: perímetro 2 × (largo + ancho) y 4 montantes de esquina',()=>{
  const f=fixture();f.api.liningType('auto');f.set({lMeasure:'room',lRoomA:4,lRoomB:3,lH:2.5,lDoors:0,lWins:0});f.api.lining();
  assert.equal(f.nodes.lL.value,'14');
  const part=f.add('liningResult');
  assert.equal(part.area,35);
  const studs=part.items.find(r=>r[0].startsWith('Montante'));
  // ceil(14 / 0,6) + 1 + 4 esquinas = 29
  assert.equal(studs[1],'29 barras de 3 m');assert.match(studs[2],/4 de esquina/);
  f.set({lRoomB:0});f.api.lining();assert.match(f.nodes.liningResult.innerHTML,/role="alert"/);
});
test('Obra húmeda: peso de ladrillos según catálogo y sacos de mortero',()=>{
  const f=fixture();f.set({wetArea:10,wetWaste:0,wetMortarWaste:0});f.api.wet();
  // 176 ladrillos × 1,5 kg + 2 sacos de 25 kg = 314 kg
  assert.match(f.nodes.wetResult.innerHTML,/≈ 314 kg/);
});
test('Inicio sin imágenes externas y modo Básico/Pro disponible',()=>{
  const html=['ui-a.html','ui-b.html','ui-c.html'].map(p=>readFileSync(join(root,p),'utf8')).join('');
  assert.doesNotMatch(html,/wixstatic|squarespace|unsplash|gyproclatenplaatsen/);
  for(const n of ['tabique','trasdosado','techo','humeda','ceramica'])assert.match(html,new RegExp('tile-'+n+'\\.jpg'));
  assert.match(html,/id="levelToggle"/);
  const f=fixture();assert.equal(f.nodes.levelToggle.textContent,'Básico');
});
