const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const fixture=require('./material-fixture.cjs');
const root=join(__dirname,'..');
const find=(part,name)=>part.items.find(row=>row[0].startsWith(name));

test('Tabique doble placa: capa interior solo con pasta, sin cinta',()=>{
  const f=fixture();f.set({wL:4,wH:2.6,wA:2,wB:2,wDoors:0,wWins:0});f.api.wall();const part=f.add('wallResult');
  assert.equal(find(part,'Cinta de papel 1.ª capa'),undefined);
  assert.ok(find(part,'Pasta de juntas 1.ª capa'));
  assert.ok(find(part,'Cinta de papel cara vista'));
});
test('Canal del tabique descuenta 0,80 m de suelo por puerta',()=>{
  const f=fixture();f.set({wL:6,wH:2.6,wA:1,wB:1,wDoors:0,wWins:0});f.api.wall();
  assert.equal(find(f.add('wallResult'),'Canal R')[1],'4 barras');
  f.set({wDoors:2});f.api.wall();
  // 6 m de techo + (6 − 1,60) m de suelo = 10,40 m → 4 barras de 3 m
  const row=find(f.add('wallResult'),'Canal R');assert.equal(row[1],'4 barras');assert.match(row[2],/10\.40 m/);
  f.set({wL:3.5,wDoors:2});f.api.wall();
  // 3,50 + (3,50 − 1,60) = 5,40 m → 2 barras (sin descontar: 7 m → 3 barras)
  const short=find(f.add('wallResult'),'Canal R');assert.equal(short[1],'2 barras');assert.match(short[2],/5\.40 m/);
});
test('Trasdosado semidirecto sin tornillos metal-metal; autoportante los mantiene',()=>{
  const f=fixture();f.api.liningType('semi');f.api.lining();
  assert.equal(f.add('liningResult').items.some(row=>/metal-metal/.test(row[0])),false);
  f.api.liningType('auto');f.api.lining();
  assert.equal(f.add('liningResult').items.some(row=>/metal-metal/.test(row[0])),true);
});
test('Manifest incluye iconos cuadrados 192 y 512 que existen con ese tamaño',()=>{
  const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
  for(const size of [192,512]){
    const icon=manifest.icons.find(i=>i.sizes===size+'x'+size);assert.ok(icon);
    const png=readFileSync(join(root,icon.src));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
    assert.ok(readFileSync(join(root,'service-worker.js'),'utf8').includes("'"+icon.src+"'"));
  }
});
