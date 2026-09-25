const CACHE='calculadora-construccion-v1';
const CORE=[
  './','index.html','style.css','data.js','app.js','app-a1.js','app-a2.js','app-b.js',
  'ui-a.html','ui-b.html','ui-c.html','logo.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  event.respondWith(
    fetch(event.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return res;
    }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./')))
  );
});
