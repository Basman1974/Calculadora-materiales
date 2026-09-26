const CACHE='calculadora-construccion-20260926-placo1';
const CORE=[
  './','index.html','style.css','data.js','app.js','app-a1.js','app-a2.js','app-b.js',
  'ui-a.html','ui-b.html','ui-c.html','manifest.json','logo.png',
  'assets/montaje-tabique.svg','assets/montaje-directo.svg','assets/montaje-semidirecto.svg','assets/montaje-autoportante.svg','assets/montaje-techo.svg','assets/montaje-techo-simple.svg','assets/montaje-techo-doble.svg','assets/montaje-techo-sierra.svg','assets/montaje-techo-biapoyado.svg','assets/montaje-registrable-60.svg','assets/montaje-registrable-120.svg','assets/montaje-escayola.svg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  event.respondWith(
    fetch(event.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(event.request,{ignoreSearch:true}).then(r=>r||caches.match('./')))
  );
});
