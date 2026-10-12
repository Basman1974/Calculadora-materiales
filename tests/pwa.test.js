const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync,existsSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const root = join(__dirname,'..');

function worker({failInstall=false,offline=false} = {}){
  const events={},deleted=[],requests=[],matches=[];
  let skipped=0,claimed=0;
  const context=vm.createContext({
    URL,location:{origin:'https://calculadora.test'},
    Request:class {constructor(path,options){this.url=path;this.cache=options.cache;}},
    self:{
      addEventListener:(name,handler)=>events[name]=handler,
      skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{claimed++;}}
    },
    caches:{
      open:async()=>({
        addAll:async list=>{requests.push(...list);if(failInstall)throw new Error('Recurso no disponible');},
        put:async()=>{}
      }),
      keys:async()=>['calculadora-construccion-antigua','otra-aplicacion','calculadora-construccion-20261012-beneficio-industrial'],
      delete:async key=>{deleted.push(key);},
      match:async(request,options)=>{matches.push({request,options});return 'recurso-cache';}
    },
    fetch:async()=>{if(offline)throw new Error('Sin conexión');return {clone:()=>({})};}
  });
  vm.runInContext(readFileSync(join(root,'service-worker.js'),'utf8'),context);
  return {events,deleted,requests,matches,get skipped(){return skipped;},get claimed(){return claimed;}};
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
