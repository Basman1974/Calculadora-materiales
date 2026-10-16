const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync,existsSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const root = join(__dirname,'..');

function worker({failInstall=false,offline=false,status=200,cached='recurso-cache'} = {}){
  const events={},deleted=[],requests=[],matches=[],puts=[];
  let skipped=0,claimed=0;
  const context=vm.createContext({
    URL,Response,location:{origin:'https://calculadora.test'},
    Request:class {constructor(path,options){this.url=path;this.cache=options.cache;}},
    self:{
      addEventListener:(name,handler)=>events[name]=handler,
      skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{claimed++;}}
    },
    caches:{
      open:async()=>({
        addAll:async list=>{requests.push(...list);if(failInstall)throw new Error('Recurso no disponible');},
        put:async request=>{puts.push(request);},
        match:async(request,options)=>{matches.push({request,options});return request==='./'?'pagina-cache':cached;}
      }),
      keys:async()=>['calculadora-construccion-antigua','otra-aplicacion','calculadora-construccion-20261016-interfaz-completa'],
      delete:async key=>{deleted.push(key);},
      match:async()=>{throw Error('No debe consultar otras cachés');}
    },
    fetch:async()=>{if(offline)throw new Error('Sin conexión');return {ok:status>=200&&status<300,status,clone:()=>({})};}
  });
  vm.runInContext(readFileSync(join(root,'service-worker.js'),'utf8'),context);
  return {events,deleted,requests,matches,puts,get skipped(){return skipped;},get claimed(){return claimed;}};
}

test('La caché completa se descarga antes de activar la actualización',async()=>{
  const w=worker();let promise;
  w.events.install({waitUntil:p=>promise=p});
  assert.equal(w.skipped,0);
  await promise;
  assert.equal(w.skipped,1);
  assert.ok(w.requests.length>20);
  for(const request of w.requests){
    assert.equal(request.cache,'reload');
    assert.ok(existsSync(join(root,request.url)),request.url);
  }
});

test('Una descarga incompleta impide activar la nueva versión',async()=>{
  const w=worker({failInstall:true});let promise;
  w.events.install({waitUntil:p=>promise=p});
  await assert.rejects(promise,/Recurso no disponible/);
  assert.equal(w.skipped,0);
  assert.equal(w.deleted.length,0);
});

test('Activación: conserva otras aplicaciones y espera a asumir el control',async()=>{
  const w=worker();let promise;
  w.events.activate({waitUntil:p=>promise=p});
  assert.equal(w.claimed,0);
  await promise;
  assert.deepEqual(w.deleted,['calculadora-construccion-antigua']);
  assert.equal(w.claimed,1);
});

test('Sin conexión, recupera recursos versionados ignorando los parámetros',async()=>{
  const w=worker({offline:true});let promise;
  w.events.fetch({request:{method:'GET',url:'https://calculadora.test/app-a1.js?v=nueva'},respondWith:p=>promise=p});
  assert.equal(await promise,'recurso-cache');
  assert.equal(w.matches[0].options.ignoreSearch,true);
});
test('Un JS ausente sin conexión recibe 503 y nunca una página HTML',async()=>{
  let promise;
  // null evita el valor predeterminado de la fixture.
  const empty=worker({offline:true,cached:null});
  empty.events.fetch({request:{method:'GET',mode:'cors',url:'https://calculadora.test/ausente.js'},respondWith:p=>promise=p});
  const response=await promise;assert.equal(response.status,503);assert.equal(empty.matches.some(m=>m.request==='./'),false);
});
test('La navegación sin conexión puede recuperar el inicio',async()=>{
  const w=worker({offline:true,cached:null});let promise;
  w.events.fetch({request:{method:'GET',mode:'navigate',url:'https://calculadora.test/otra'},respondWith:p=>promise=p});
  assert.equal(await promise,'pagina-cache');
});
for(const status of [404,500,200]){
  test('HTTP '+status+': solo se cachean respuestas correctas y se espera la escritura',async()=>{
    const w=worker({status});let response,write;
    w.events.fetch({request:{method:'GET',url:'https://calculadora.test/app.js'},respondWith:p=>response=p,waitUntil:p=>write=p});
    await response;if(write)await write;
    assert.equal(w.puts.length,status===200?1:0);
  });
}

for(const readyState of ['loading','complete']){
  test('Registro del service worker con documento '+readyState,async()=>{
    const source=readFileSync(join(root,'app-b.js'),'utf8');
    const start=source.indexOf("  if('serviceWorker' in navigator){");
    const end=source.indexOf("  ['jobName'",start);
    assert.ok(start>=0 && end>start);
    let registered=0,listener;
    vm.runInNewContext(source.slice(start,end),{
      document:{readyState},
      navigator:{serviceWorker:{register:async path=>{assert.equal(path,'service-worker.js');registered++;}}},
      window:{addEventListener:(name,fn,options)=>{assert.equal(name,'load');assert.equal(options.once,true);listener=fn;}}
    });
    if(readyState==='loading'){
      assert.equal(registered,0);await listener();
    }
    assert.equal(registered,1);
  });
}

test('Las dimensiones declaradas del logo corresponden a las del PNG real',()=>{
  const png=readFileSync(join(root,'logo.png'));const size=png.readUInt32BE(16)+'x'+png.readUInt32BE(20);
  const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
  assert.equal(manifest.icons.find(icon=>icon.src==='logo.png').sizes,size);
  // No afirma que este logo rectangular cumpla los tamaños de instalación.
});

test('Cargadores, interfaz, aviso y caché utilizan la misma versión de recursos',()=>{
  const version=readFileSync(join(root,'app.js'),'utf8').match(/const v = '([^']+)'/)[1];
  const index=readFileSync(join(root,'index.html'),'utf8');
  for(const file of ['ui-a.html','ui-b.html','ui-c.html'])assert.ok(index.includes(file+'?v='+version));
  assert.ok(readFileSync(join(root,'ui-a.html'),'utf8').includes('style.css?v='+version));
  for(const file of ['app.js','data.js'])assert.ok(readFileSync(join(root,'ui-c.html'),'utf8').includes(file+'?v='+version));
  assert.ok(readFileSync(join(root,'service-worker.js'),'utf8').includes("const CACHE='calculadora-construccion-"+version+"'"));
  assert.ok(readFileSync(join(root,'app-a1.js'),'utf8').includes("localStorage.setItem('calc-notice-seen','"+version+"')"));
});
