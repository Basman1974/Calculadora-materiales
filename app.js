(() => {
  const v = '20260925-selectfix1';
  const parts = ['app-a1.js?v=' + v, 'app-a2.js?v=' + v, 'app-b.js?v=' + v];
  function fail(err){
    console.error(err);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/Basman1974/Calculadora-materiales@cf296d4f4b351bf98ce5dacbcf9fde8d6689b140/app.js';
    document.head.appendChild(s);
  }
  Promise.all(parts.map(u => fetch(u, {cache:'no-store'}).then(r => {
    if(!r.ok) throw new Error(u);
    return r.text();
  }))).then(chunks => {
    const code = chunks.join('');
    if(!code || code.length < 1000) throw new Error('empty');
    const s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
  }).catch(fail);
})();
