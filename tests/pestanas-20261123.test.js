const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const js=['app-a1.js','app-a2.js','app-b.js'].map(f=>readFileSync(join(root,f),'utf8')).join('\n');
const html=['ui-a.html','ui-b.html','ui-c.html'].map(f=>readFileSync(join(root,f),'utf8')).join('\n');

test('El selector de tema no captura <body data-mode> (bloqueaba todos los desplegables)',()=>{
  assert.match(html,/<body data-mode=/);
  assert.doesNotMatch(js,/\$all\('\[data-mode\]'\)/);
  assert.doesNotMatch(js,/closest\('\[data-mode\]'\)/);
  assert.match(js,/\$all\('button\[data-mode\]'\)/);
});
test('Todos los desplegables estáticos tienen control directo',()=>{
  assert.match(js,/\$all\('details > summary'\)/);
});
test('Las plantillas del tabique usan valores que existen en el desplegable de separación',()=>{
  const options=[...html.match(/<select id="wS">([\s\S]*?)<\/select>/)[1].matchAll(/value="([^"]+)"/g)].map(m=>m[1]);
  const used=[...js.matchAll(/set\('wS',([^)]+)\)/g)].map(m=>m[1].replace(/'/g,''));
  assert.ok(used.length>=3);
  for(const v of used)assert.ok(options.includes(v),'valor '+v+' no existe en wS: '+options.join(','));
});
test('Un borrador con desplegables vacíos vuelve al valor por defecto',()=>{
  assert.match(js,/s\.selectedIndex<0/);
});
