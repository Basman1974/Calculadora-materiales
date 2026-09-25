(() => {
  const v = '20260925-helpfix1';
  const base = ['app-a1.js', 'app-a2.js', 'app-b.js'];

  async function getPart(name){
    const first = name + '?v=' + v;
    try{
      const r = await fetch(first, {cache:'no-store'});
      if(!r.ok) throw new Error(first + ' ' + r.status);
      return await r.text();
    }catch(err){
      const retry = name + '?v=' + v + '&retry=1';
      const r2 = await fetch(retry, {cache:'reload'});
      if(!r2.ok) throw err;
      return await r2.text();
    }
  }

  Promise.all(base.map(getPart)).then(chunks => {
    const code = chunks.join('');
    if(!code || code.length < 1000) throw new Error('Código de aplicación incompleto');
    const s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
  }).catch(err => {
    console.error(err);
    const box = document.createElement('div');
    box.setAttribute('role','alert');
    box.style.cssText = 'margin:18px;padding:14px;border:2px solid #b42318;border-radius:12px;font:700 14px system-ui;color:#b42318;background:#fff';
    box.textContent = 'No se pudieron cargar los controles de la calculadora. Recarga la página.';
    document.body.prepend(box);
  });
})();
