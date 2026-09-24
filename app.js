(() => {
  const $ = s => document.querySelector(s);
  const $all = s => [...document.querySelectorAll(s)];
  const cache = Object.create(null);
  function el(id){ if(cache[id] === undefined) cache[id] = document.getElementById(id); return cache[id]; }
  function num(id){ const n = el(id); if(!n) return 0; return Math.max(0, Number(String(n.value).replace(',','.')) || 0); }
  function on(node, ev, fn){ if(node) node.addEventListener(ev, fn); }
  let currentCat = 'ladrillos';
  let currentCerBody = 'porcelanico';
  let work = [];
  const primed = Object.create(null);
  const screens = $all('.screen');
  const storeMap = [
    {name:'OBRAMAT Almería',postalPrefixes:['040','041','042','043','044','045','046','047','048']},
    {name:'OBRAMAT Granada',postalPrefixes:['180','181','182','183','184','185','186','187','188']},
    {name:'OBRAMAT Málaga',postalPrefixes:['290','291','292','293','294','295','296','297']},
    {name:'OBRAMAT Murcia',postalPrefixes:['300','301','302','303','304','305','306','307','308']},
    {name:'OBRAMAT Córdoba',postalPrefixes:['140','141','142','143','144','145','146','147','148','149']}
  ];
  let postalState = {code:'',store:''};
  try { postalState = JSON.parse(localStorage.getItem('calculadora-postal-v1') || '{"code":"","store":""}'); } catch(e){}
  const nav = $all('[data-nav]');
  const data = window.CALC_DATA || {};
  function show(id){
    screens.forEach(x => x.classList.toggle('active', x.id === id));
    nav.forEach(b => b.classList.toggle('active', b.dataset.nav === (['wall','lining','roof','wet','ceramic'].includes(id) ? 'home' : id)));
    if(id === 'work') renderWork();
    if(id === 'list') renderList();
    if(id === 'wet'){ renderProducts(); calcWet(); }
    else if(id === 'wall' && !primed.wall){ calcWall(); primed.wall = 1; }
    else if(id === 'lining' && !primed.lining){ calcLining(); primed.lining = 1; }
    else if(id === 'roof' && !primed.roof){ calcRoof(); primed.roof = 1; }
    else if(id === 'ceramic' && !primed.ceramic){ calcLevel(); primed.ceramic = 1; }
    window.scrollTo(0, 0);
    const shell = document.scrollingElement || document.documentElement;
    if(shell) shell.scrollTop = 0;
    const app = document.querySelector('.app') || document.querySelector('.shell');
    if(app) app.scrollTop = 0;
  }
  function resolveStore(cp){
    const prefix = cp.slice(0,3);
    const hit = storeMap.find(s => s.postalPrefixes.includes(prefix));
    return hit ? hit.name : 'Almacén OBRAMAT por verificar';
  }
  function applyPostal(cp){
    const store = resolveStore(cp);
    postalState = {code:cp,store};
    try { localStorage.setItem('calculadora-postal-v1', JSON.stringify(postalState)); } catch(e){}
    const title = el('storeTitle'), sub = el('storeSub'), bar = el('storebar'), cerTxt = el('cerStoreText');
    if(title) title.textContent = store;
    if(sub) sub.textContent = 'CP ' + cp + ' · referencias vinculadas a zona';
    if(bar) bar.classList.add('show');
    if(cerTxt) cerTxt.textContent = 'CP ' + cp + ' · ' + store + ' · precio y stock solo si OBRAMAT los confirma para este almacén.';
    show('home');
  }
  on(el('postalForm'), 'submit', e => {
    e.preventDefault();
    const cp = (el('postalCode') && el('postalCode').value.trim()) || '';
    const err = el('postalError');
    if(!/^[0-9]{5}$/.test(cp)){ if(err) err.textContent = 'Introduce un código postal español de 5 dígitos.'; return; }
    if(err) err.textContent = '';
    applyPostal(cp);
  });
  on(el('useLocation'), 'click', () => {
    const status = el('locationStatus');
    const err = el('postalError');
    if(err) err.textContent = '';
    if(!navigator.geolocation){ if(status) status.textContent = 'Este navegador no permite obtener la ubicación.'; return; }
    if(status) status.textContent = 'Solicitando permiso de ubicación…';
    navigator.geolocation.getCurrentPosition(async pos => {
      try{
        if(status) status.textContent = 'Localizando código postal…';
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&addressdetails=1', {headers:{'Accept':'application/json'}});
        if(!res.ok) throw new Error('reverse');
        const geo = await res.json();
        const cp = (geo.address && geo.address.postcode || '').match(/\d{5}/)?.[0] || '';
        if(!cp) throw new Error('postcode');
        if(el('postalCode')) el('postalCode').value = cp;
        if(status) status.textContent = 'Código postal detectado: ' + cp;
        applyPostal(cp);
      }catch(err2){ if(status) status.textContent = 'No he podido obtener el código postal automáticamente. Introdúcelo manualmente.'; }
    }, err3 => {
      const msg = err3.code === 1 ? 'Permiso de ubicación denegado. Actívalo en el navegador para usar esta opción.' : err3.code === 2 ? 'No se ha podido determinar tu ubicación.' : 'La ubicación ha tardado demasiado en responder.';
      if(status) status.textContent = msg;
    }, {enableHighAccuracy:true,timeout:12000,maximumAge:300000});
  });
  on(el('changePostal'), 'click', () => {
    if(el('postalCode')) el('postalCode').value = postalState.code || '';
    if(el('storebar')) el('storebar').classList.remove('show');
    show('postal');
  });
  const PYL_LENGTHS = [2, 2.5, 2.6, 2.7, 2.8, 3];
  function bestPylBoard(H){
    const h = Math.max(0, Number(H) || 0);
    const fit = PYL_LENGTHS.find(len => len + 0.0005 >= h);
    const len = fit || 3;
    const stacked = !fit;
    const w = 1.2;
    return {w:w,h:len,area:w*len,label:'1200 × '+Math.round(len*1000),stacked:stacked,note:stacked?'Altura > 3 m · usar 3000 mm y junta horizontal':(Math.abs(len-h)<0.02?'Ajuste a la altura, casi sin recorte de largo':'Recorte de largo ≈ '+Math.round(Math.max(0,len-h)*1000)+' mm')};
  }
  function mmScrews(area, kind){
    const rate = kind === 'roof' ? 5 : 3;
    const n = Math.ceil(Math.max(0, area) * rate * 1.10);
    return {n:n, rate:rate, boxes:Math.ceil(n / 500)};
  }
  function mmRow(area, kind){
    const mm = mmScrews(area, kind);
    const src = kind === 'roof' ? 'techo 5 ud/m² de estructura' : 'tabique 3 ud/m² de estructura';
    return ['Tornillos metal-metal 3,5 × 9,5', mm.n + ' uds · ' + mm.boxes + ' caja(s) de 500', 'UNE 102043 y UNE-EN 14566 · ' + src + ' · +10% merma · caja 500 ud'];
  }
  function tacoRow(lengthM, runs, kind){
    const n = Math.max(0, runs) * (Math.ceil(Math.max(0, lengthM) / 0.6) + 1);
    const detail = kind === 'omega'
      ? 'UNE 102043 §16.6 · anclaje de omega al paramento · ala del perfil · paso máx. 600 mm · primer y último cerca del extremo'
      : 'UNE 102043 §16.6 · anclaje de canales al soporte · paso máx. 600 mm · primer y último cerca del extremo';
    return ['Tacos de golpeo', n + ' uds · ' + Math.ceil(n / 100) + ' caja(s) de 100', detail];
  }
  function screwBoxes(n){ return Math.ceil(Math.max(0, n) / 1000); }
  function pylFaceWork(area, layers){
    const A = Math.max(0, area), n = Math.max(0, Math.round(Number(layers) || 0)), waste = 1.10;
    const inner = Math.max(0, n - 1), visible = n > 0 ? 1 : 0;
    const firstRate = n >= 2 ? 8 : (n === 1 ? 15 : 0), secondRate = n >= 2 ? 15 : 0;
    return {n:n, firstNeed:Math.ceil(A*firstRate*waste), firstType:'3,5 × 25', secondNeed:Math.ceil(A*secondRate*waste), secondType:n>=2?'3,5 × 35':'', tapeInner:Math.ceil(inner*A*1.6*waste), tapeVisible:Math.ceil(visible*A*1.6*waste), pasteInner:Math.ceil(inner*A*0.20*waste), pasteVisible:Math.ceil(visible*A*0.40*waste)};
  }
  function mergeFaceWork(list){
    return list.reduce((acc, x) => {
      acc.firstNeed += x.firstNeed; acc.secondNeed += x.secondNeed;
      acc.tapeInner += x.tapeInner; acc.tapeVisible += x.tapeVisible;
      acc.pasteInner += x.pasteInner; acc.pasteVisible += x.pasteVisible;
      if(x.n >= 2) acc.hasSecond = 1;
      if(x.n >= 1) acc.hasVisible = 1;
      if(x.n >= 2) acc.hasInner = 1;
      acc.firstType = x.firstType; acc.secondType = x.secondType || acc.secondType;
      return acc;
    }, {firstNeed:0,secondNeed:0,tapeInner:0,tapeVisible:0,pasteInner:0,pasteVisible:0,hasSecond:0,hasVisible:0,hasInner:0,firstType:'3,5 × 25',secondType:'3,5 × 35'});
  }
  function pylJoinRows(w){
    const rows = [];
    if(w.firstNeed) rows.push([w.hasSecond ? 'Tornillos 1.ª placa ' + w.firstType : 'Tornillos placa-metal ' + w.firstType, w.firstNeed + ' uds · ' + screwBoxes(w.firstNeed) + ' caja(s) de 1.000', w.hasSecond ? 'UNE 102043 · capa interior · ≈8 ud/m²·cara · paso amplio · +10% merma · UNE-EN 14566' : 'UNE 102043 · cara vista · 15 ud/m² · paso máx. 250 mm · largo = espesor + 10 mm · +10% merma']);
    if(w.hasSecond && w.secondNeed) rows.push(['Tornillos 2.ª placa ' + w.secondType, w.secondNeed + ' uds · ' + screwBoxes(w.secondNeed) + ' caja(s) de 1.000', 'UNE 102043 · cara vista · 15 ud/m² · paso máx. 250 mm · largo = 2 placas + 10 mm · UNE-EN 14566 · +10% merma']);
    if(w.hasInner && w.tapeInner) rows.push(['Cinta de papel 1.ª capa', w.tapeInner + ' m · ' + Math.ceil(w.tapeInner / 150) + ' rollo(s) de 150 m', 'UNE 102043 §18 · juntas de todas las capas · 1,6 m/m² · UNE-EN 13963']);
    if(w.hasInner && w.pasteInner) rows.push(['Pasta de juntas 1.ª capa', w.pasteInner + ' kg · ' + Math.ceil(w.pasteInner / 20) + ' saco(s) de 20 kg', 'UNE 102043 · acabado Q1 interior · ≈0,20 kg/m² · UNE-EN 13963']);
    if(w.hasVisible && w.tapeVisible) rows.push(['Cinta de papel cara vista', w.tapeVisible + ' m · ' + Math.ceil(w.tapeVisible / 150) + ' rollo(s) de 150 m', 'UNE 102043 §18 · junta de última placa · 1,6 m/m² · +10% merma · UNE-EN 13963']);
    if(w.hasVisible && w.pasteVisible) rows.push(['Pasta de juntas cara vista', w.pasteVisible + ' kg · ' + Math.ceil(w.pasteVisible / 20) + ' saco(s) de 20 kg', 'UNE 102043 · acabado Q2 · juntas + cabezas · ≈0,40 kg/m² · +10% merma']);
    return rows;
  }
  on(el('loadObramatCeramic'), 'click', () => {
    const raw = (el('cerProductCode') && el('cerProductCode').value.trim()) || '';
    const code = raw.replace(/\D/g,'');
    const status = el('cerProductStatus'), card = el('cerProductCard');
    const cp = postalState.code || '', store = postalState.store || resolveStore(cp);
    const a = num('cA'), b = num('cB');
    if(raw && !/^\d{6,12}$/.test(code)){ if(status) status.textContent = 'La referencia, si la pones, tiene que ser numérica de 6 a 12 dígitos.'; return; }
    if(a < 5 || b < 5){ if(status) status.textContent = 'Introduce el largo y el ancho de la baldosa en cm.'; return; }
    if(el('aSize')) el('aSize').value = Math.max(a,b);
    if(card){
      card.classList.remove('hidden');
      card.innerHTML = '<div style="font-weight:950">' + (code ? ('Ref. anotada ' + code) : 'Sin referencia') + '</div><div class="small">' + store + (cp ? ' · CP ' + cp : '') + '</div><div class="small" style="margin-top:6px">Formato usado: ' + a + ' × ' + b + ' cm. Precio y stock no disponibles desde esta página.</div>';
    }
    calcLevel(); adhesiveClass();
    if(status) status.textContent = 'Cálculo hecho con las medidas introducidas. OBRAMAT no se ha consultado sola.';
  });
  on(el('chooseObramatCeramic'), 'click', () => {
    const cp = postalState.code || '';
    const store = postalState.store || resolveStore(cp);
    const q = ((el('cerProductCode') && el('cerProductCode').value.trim()) || '').replace(/\D/g,'') || 'suelo ceramico';
    const cerTxt = el('cerStoreText');
    if(cerTxt) cerTxt.textContent = (cp ? 'CP ' + cp + ' · ' : '') + store + ' · consulta manual en OBRAMAT.';
    window.open('https://www.obramat.es/search?q=' + encodeURIComponent(q), '_blank', 'noopener');
  });
  if(postalState.code && /^[0-9]{5}$/.test(postalState.code)){
    if(el('storeTitle')) el('storeTitle').textContent = postalState.store || resolveStore(postalState.code);
    if(el('storeSub')) el('storeSub').textContent = 'CP ' + postalState.code + ' · referencias vinculadas a zona';
    if(el('storebar')) el('storebar').classList.add('show');
    const cerTxt = el('cerStoreText');
    if(cerTxt) cerTxt.textContent = 'CP ' + postalState.code + ' · ' + (postalState.store || resolveStore(postalState.code));
    show('home');
  }
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if(open){ show(open.dataset.open); return; }
    const home = e.target.closest('[data-home]');
    if(home){ show('home'); return; }
    const navBtn = e.target.closest('[data-nav]');
    if(navBtn){ show(navBtn.dataset.nav); return; }
    const look = e.target.closest('#look');
    if(look){ const ap = el('appearance'); if(ap) ap.classList.toggle('open'); return; }
    const mode = e.target.closest('[data-mode]');
    if(mode && mode.dataset.mode){
      document.body.dataset.mode = mode.dataset.mode;
      $all('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === mode)));
      return;
    }
    const color = e.target.closest('[data-ac]');
    if(color && color.dataset.ac){
      const [a,s,o] = color.dataset.ac.split('|');
      const root = document.documentElement.style;
      root.setProperty('--accent', a); root.setProperty('--accent2', a); root.setProperty('--accentSoft', s); root.setProperty('--on', o);
      $all('[data-ac]').forEach(x => x.setAttribute('aria-pressed', String(x === color)));
      return;
    }
    const cat = e.target.closest('#wetCats [data-cat], [data-cat]');
    if(cat && cat.dataset.cat){
      setWetCat(cat.dataset.cat);
      return;
    }
    const body = e.target.closest('[data-cer-body]');
    if(body && body.dataset.cerBody){
      currentCerBody = body.dataset.cerBody;
      $all('[data-cer-body]').forEach(x => x.classList.toggle('active', x === body));
      calcLevel();
      if(el('adhForm') && !el('adhForm').classList.contains('hidden')) adhesiveClass();
      return;
    }
    const tab = e.target.closest('[data-cer-tab]');
    if(tab && tab.dataset.cerTab){
      const level = tab.dataset.cerTab === 'level';
      $all('[data-cer-tab]').forEach(x => x.classList.toggle('active', x === tab));
      if(el('levelForm')) el('levelForm').classList.toggle('hidden', !level);
      if(el('levelResult')) el('levelResult').classList.toggle('hidden', !level);
      if(el('adhForm')) el('adhForm').classList.toggle('hidden', level);
      if(el('adhResult')) el('adhResult').classList.toggle('hidden', level);
    }
  });
  function resultHTML(title, meta, rows){
    return '<div class="resultHead"><div class="eyebrow">RESULTADO</div><div class="resultTitle">' + title + '</div><div class="resultMeta">' + meta + '</div></div>' +
      '<div class="groupHead">MATERIALES</div>' +
      rows.map(x => '<div class="row"><div class="rowName">' + x[0] + '</div><div class="rowVal">' + x[1] + '</div>' + (x[2] ? '<div class="rowDetail">' + x[2] + '</div>' : '') + '</div>').join('') +
      '<div class="actions"><button class="btn addWork" type="button">Añadir a Obra</button></div>';
  }
  function bindAdd(node, obj){
    if(!node) return;
    const b = node.querySelector('.addWork');
    if(b) b.onclick = e => { work.push(obj); e.target.textContent = 'Añadido'; setTimeout(() => e.target.textContent = 'Añadir a Obra', 700); };
  }
  function calcWall(){
    const L = num('wL'), H = num('wH'), A = L * H, a = num('wA'), b = num('wB'), sp = num('wS') || .6, p = num('wP'), studs = Math.ceil(L / sp) + 1;
    const board = bestPylBoard(H);
    const totalLayers = a + b, plateUds = Math.ceil(A * totalLayers / board.area * 1.08);
    const bandNeed = 2 * L + 2 * H;
    const finish = mergeFaceWork([pylFaceWork(A, a), pylFaceWork(A, b)]);
    const rows = [
      ['Placa PYL ' + board.label, plateUds + ' uds', 'UNE-EN 520 · elegida por altura ' + H.toFixed(2) + ' m · ' + board.note + ' · merma corte 8 % · cara 1: ' + a + ' · cara 2: ' + b],
      ['Montante M' + p, studs * Math.ceil(H / 3) + ' barras', 'UNE-EN 14195 · ' + studs + ' ejes · barra 3 m'],
      ['Canal R' + p, Math.ceil(2 * L / 3) + ' barras', 'UNE-EN 14195 · suelo y techo · barra 3 m']
    ];
    rows.push.apply(rows, pylJoinRows(finish));
    rows.push(mmRow(A, 'wall'));
    rows.push(['Banda acústica', bandNeed.toFixed(1) + ' m · ' + Math.ceil(bandNeed / 30) + ' rollo(s) de 30 m', 'UNE 102043 · perímetro de canales y arranques']);
    rows.push(tacoRow(L, 2));
    const obj = {title:'Tabique · ' + A.toFixed(2) + ' m²', items:rows};
    const box = el('wallResult');
    if(box){ box.innerHTML = resultHTML(obj.title, 'UNE 102043 · intereje ' + Math.round(sp * 1000) + ' mm', rows); bindAdd(box, obj); }
  }
  on(el('wallForm'), 'submit', e => { e.preventDefault(); calcWall(); });
  function calcLining(){
    const L = num('lL'), H = num('lH'), A = L * H, t = el('lType') ? el('lType').value : 'auto', l = num('lLayers'), sp = num('lS') || .6, p = num('lP');
    const board = bestPylBoard(H);
    const liningPlates = Math.ceil(A * l / board.area * 1.08);
    const rows = [['Placa PYL ' + board.label, liningPlates + ' uds', 'UNE-EN 520 · elegida por altura ' + H.toFixed(2) + ' m · ' + board.note + ' · merma corte 8 % · ' + l + ' capa(s)']];
    let title = '';
    if(el('lProfileWrap')) el('lProfileWrap').classList.toggle('hidden', t === 'direct');
    const finish = mergeFaceWork([pylFaceWork(A, l)]);
    if(t === 'direct'){ title = 'Trasdosado directo'; rows.push(['Pasta de agarre', Math.ceil(A * 4.5) + ' kg', 'UNE 102043 · trasdosado directo · ≈4,5 kg/m²']); }
    else if(t === 'semi'){ title = 'Trasdosado semidirecto'; const o = Math.ceil(L / sp) + 1; rows.push(['Perfil omega / auxiliar', o * Math.ceil(H / 3) + ' barras', 'UNE-EN 14195 · ' + o + ' ejes'], tacoRow(H, o, 'omega')); }
    else { title = 'Trasdosado autoportante'; const s = Math.ceil(L / sp) + 1; const bandNeed = 2 * L + 2 * H; rows.push(['Montante M' + p, s * Math.ceil(H / 3) + ' barras', 'UNE-EN 14195 · ' + s + ' ejes · barra 3 m'], ['Canal R' + p, Math.ceil(2 * L / 3) + ' barras', 'UNE-EN 14195 · suelo y techo'], ['Banda acústica', bandNeed.toFixed(1) + ' m · ' + Math.ceil(bandNeed / 30) + ' rollo(s) de 30 m', 'UNE 102043 · perímetro'], tacoRow(L, 2)); }
    if(t !== 'direct'){ rows.push.apply(rows, pylJoinRows(finish)); rows.push(mmRow(A, 'lining')); }
    else rows.push.apply(rows, pylJoinRows(finish).filter(r => r[0].indexOf('Tornillos') !== 0));
    const obj = {title:title + ' · ' + A.toFixed(2) + ' m²', items:rows};
    const box = el('liningResult');
    if(box){ box.innerHTML = resultHTML(obj.title, 'UNE 102043 · intereje ' + Math.round(sp * 1000) + ' mm', rows); bindAdd(box, obj); }
  }
  on(el('liningForm'), 'submit', e => { e.preventDefault(); calcLining(); });
  ['lType','lLayers','lS','lP'].forEach(id => on(el(id), 'change', calcLining));
  function tc47Pack(span, width, spacing, barLen){
    const sp = spacing || 0.5, bar = barLen || 3;
    const runs = Math.max(1, Math.ceil(Math.max(0, width) / sp) + 1);
    const per = Math.max(1, Math.ceil(Math.max(0.01, span) / bar));
    return {runs:runs, bars:runs * per, splices:runs * Math.max(0, per - 1), ml:runs * span};
  }
  function empalmeRow(n){
    const ud = Math.max(0, Math.ceil(n));
    return ['Empalme TC47', ud + ' uds · ' + Math.ceil(ud / 50) + ' caja(s) de 50', 'UNE 102043 · unión de barras de 3 m · 1 pieza por junta de perfil'];
  }
  function calcRoof(){
    const L = num('rL'), W = num('rW'), A = L * W, l = num('rLayers');
    const fmt = (el('rBoard') ? el('rBoard').value : '2,1.2').split(',').map(Number);
    const sys = el('rSys') ? el('rSys').value : 'double', d = num('rDrop');
    const modular = sys === 'desmontable60' || sys === 'desmontable120' || sys === 'escayola';
    if(el('rBoardWrap')) el('rBoardWrap').classList.toggle('hidden', modular);
    if(el('rLayersWrap')) el('rLayersWrap').classList.toggle('hidden', modular);
    let rows = [], title = 'Techo', meta = 'plenum ' + d + ' cm';
    if(sys === 'desmontable60' || sys === 'desmontable120'){
      const tile60 = sys === 'desmontable60';
      const tileUds = Math.ceil(A * (tile60 ? 2.78 : 1.39) * 1.08);
      const primM = A * 0.84, sec12M = A * (tile60 ? 1.67 : 0.84), sec6M = A * (tile60 ? 0.84 : 1.67);
      const hang = Math.ceil(A * 0.70), peri = 2 * (L + W);
      title = tile60 ? 'Techo desmontable 60 × 60' : 'Techo desmontable 60 × 120';
      meta = 'Perfilería T24 vista · primarios cada 1,20 m';
      rows = [
        [tile60 ? 'Placa desmontable 600 × 600' : 'Placa desmontable 600 × 1200', tileUds + ' uds', (tile60 ? '2,78' : '1,39') + ' ud/m² · merma corte 8 % · sistema T24'],
        ['Perfil T24 primario 3600', Math.ceil(primM / 3.6) + ' barras', primM.toFixed(1) + ' m · 0,84 m/m²'],
        ['Perfil T24 secundario 1200', Math.ceil(sec12M / 1.2) + ' barras', sec12M.toFixed(1) + ' m · ' + (tile60 ? '1,67' : '0,84') + ' m/m²'],
        ['Perfil T24 secundario 600', Math.ceil(sec6M / 0.6) + ' barras', sec6M.toFixed(1) + ' m · ' + (tile60 ? '0,84' : '1,67') + ' m/m²'],
        ['Ángulo perimetral T24', Math.ceil(peri / 3) + ' barras', peri.toFixed(1) + ' m de perímetro · barra 3 m'],
        ['Cuelgues / suspensiones', hang + ' uds', '0,70 ud/m² · primarios cada 1,20 m'],
        ['Varilla o cuelgue', hang + ' uds', 'Plenum ' + d + ' cm · una por suspensión']
      ];
    } else if(sys === 'escayola'){
      const plates = Math.ceil(A * 1.67 * 1.05);
      const fix = Math.ceil(A * 3);
      const estopa = A * 0.22;
      const pasta = A * 6;
      title = 'Techo fijo de escayola';
      meta = 'Fijación por estopa · mín. 3 puntos/m²';
      rows = [
        ['Placa de escayola 1000 × 600', plates + ' uds', '1,67 ud/m² · merma 5 % · placa nervada habitual'],
        ['Fijaciones de estopa', fix + ' uds', 'NTE · mínimo 3 puntos/m² no alineados · solo si plenum ≤ 25 cm'],
        ['Estopa / fibra vegetal', Math.ceil(estopa) + ' kg', '0,22 kg/m² · esparto o sisal amasado con pasta'],
        ['Pasta de escayola UNE-EN 13279-1', Math.ceil(pasta / 20) + ' saco(s) de 20 kg', pasta.toFixed(1) + ' kg · estopadas + juntas + enlucido'],
        ['Aviso de plenum', d > 25 ? 'Plenum ' + d + ' cm: usar varilla, no solo estopa' : 'Plenum ' + d + ' cm válido para estopa', 'Estopa admisible hasta 25 cm de separación al forjado']
      ];
    } else {
      const plates = Math.ceil(A * l * 1.08 / (fmt[0] * fmt[1]));
      rows = [['Placa PYL ' + Math.round(fmt[0] * 1000) + ' × ' + Math.round(fmt[1] * 1000), plates + ' uds', 'UNE-EN 520 · ' + l + ' capa(s) · merma corte 8 %']];
      if(sys === 'double'){
        title = 'Techo doble TC47';
        const prim = tc47Pack(L, W, 1.0, 3), sec = tc47Pack(W, L, 0.5, 3);
        rows.push(['TC47 primario 3000', prim.bars + ' barras', 'UNE 102043 · cada 1,00 m · ' + prim.runs + ' recorridos · ' + prim.ml.toFixed(1) + ' m'], ['TC47 secundario 3000', sec.bars + ' barras', 'UNE 102043 · cada 0,50 m · ' + sec.runs + ' recorridos · ' + sec.ml.toFixed(1) + ' m'], empalmeRow(prim.splices + sec.splices), ['Crucetas', Math.ceil(A / .475) + ' uds', 'Cruces primaria-secundaria'], ['Horquillas', Math.ceil(A / .95) + ' uds', 'Suspensiones'], ['Varilla M6 1 m', Math.ceil(A / .95 * Math.max(.05, d / 100)) + ' uds', 'Plenum ' + d + ' cm']);
      } else if(sys === 'simple'){
        title = 'Techo TC47 simple';
        const pack = tc47Pack(Math.max(L, W), Math.min(L, W), 0.5, 3);
        rows.push(['TC47 portante 3000', pack.bars + ' barras', 'UNE 102043 · cada 0,50 m · ' + pack.runs + ' recorridos · ' + pack.ml.toFixed(1) + ' m'], empalmeRow(pack.splices), ['Horquillas', Math.ceil(A / 1.2) + ' uds', 'Suspensiones'], ['Varilla M6 1 m', Math.ceil(A / 1.2 * Math.max(.05, d / 100)) + ' uds', 'Plenum ' + d + ' cm']);
      } else if(sys === 'sierra'){
        title = 'Techo perfil sierra';
        const sec = tc47Pack(Math.max(L, W), Math.min(L, W), 0.5, 3);
        rows.push(['Perfil sierra', Math.ceil(A / 2.7) + ' barras', 'UNE 102043 · primario'], ['TC47 secundario 3000', sec.bars + ' barras', 'Secundario cada 0,50 m · ' + sec.ml.toFixed(1) + ' m'], empalmeRow(sec.splices), ['Suspensiones', Math.ceil(A / .95) + ' uds', 'Puntos de suspensión']);
      } else {
        title = 'Techo canal + montante';
        rows.push(['Canal R70', Math.ceil(2 * (L + W) / 3) + ' barras', 'UNE-EN 14195 · perímetro'], ['Montante M70', Math.ceil(A / 1.8) + ' barras', 'UNE-EN 14195 · portante'], ['Suspensiones MS', Math.ceil(A / 2.7) + ' uds', 'Puntos de suspensión']);
      }
      rows.push.apply(rows, pylJoinRows(mergeFaceWork([pylFaceWork(A, l)])));
      rows.push(mmRow(A, 'roof'));
      meta = 'UNE 102043 · plenum ' + d + ' cm';
    }
    const obj = {title:title + ' · ' + A.toFixed(2) + ' m²', items:rows};
    const box = el('roofResult');
    if(box){ box.innerHTML = resultHTML(obj.title, meta, rows); bindAdd(box, obj); }
  }
  on(el('roofForm'), 'submit', e => { e.preventDefault(); calcRoof(); });
  ['rSys','rBoard','rLayers'].forEach(id => on(el(id), 'change', calcRoof));
  function setWetCat(cat){
    if(!data[cat]) return;
    currentCat = cat;
    $all('#wetCats [data-cat], [data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === cat));
    if(el('wetWaste')) el('wetWaste').value = cat === 'puentes' ? '0' : '8';
    renderProducts();
    calcWet();
  }
  function productImgSrc(it){
    const img = (it && it.img) || '';
    if(/^https?:\/\//i.test(img)) return img;
    if(img) return img;
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23eef3ef"/><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="18">Producto</text></svg>';
  }
  function renderProducts(){
    const s = el('wetProduct');
    const group = data[currentCat];
    if(!s){ return; }
    if(!group){
      s.innerHTML = '';
      const box = el('wetResult');
      if(box) box.innerHTML = resultHTML('Obra húmeda', 'Sin catálogo', [['Aviso', 'No hay productos', 'La categoría ' + currentCat + ' no está en data.js']]);
      return;
    }
    const prev = s.value;
    s.innerHTML = '';
    Object.keys(group).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; s.appendChild(o); });
    if(prev && group[prev]) s.value = prev;
    else s.selectedIndex = 0;
    syncWet();
  }
  function wetArea(){ return (el('wetMeasureMode') && el('wetMeasureMode').value === 'direct') ? num('wetArea') : num('wetL') * num('wetH'); }
  function syncWet(){
    const name = el('wetProduct') ? el('wetProduct').value : '';
    const it = data[currentCat] && data[currentCat][name];
    const dims = el('wetMeasureMode') && el('wetMeasureMode').value === 'dims';
    if(el('wetAreaWrap')) el('wetAreaWrap').classList.toggle('hidden', dims);
    if(el('wetLWrap')) el('wetLWrap').classList.toggle('hidden', !dims);
    if(el('wetHWrap')) el('wetHWrap').classList.toggle('hidden', !dims);
    if(el('wetThicknessWrap')) el('wetThicknessWrap').classList.toggle('hidden', currentCat !== 'revestimientos');
    if(el('wetMortarWrap')) el('wetMortarWrap').classList.toggle('hidden', !(currentCat === 'ladrillos' || currentCat === 'bloques'));
    if(el('wetSupportWrap')) el('wetSupportWrap').classList.toggle('hidden', !(currentCat === 'puentes' && it && it.k === 'level_primer'));
    if(it){
      if(el('productImg')){
        el('productImg').onerror = function(){ this.onerror = null; this.src = productImgSrc({}); };
        el('productImg').src = productImgSrc(it);
      }
      if(el('productName')) el('productName').textContent = name;
      if(el('productSpec')) el('productSpec').textContent = it.spec || '';
      if(el('productLink')) el('productLink').href = it.url;
      const chips = [];
      if(it.u) chips.push(it.u + ' ud/m²');
      if(it.kg) chips.push(it.kg + ' kg/m²·mm');
      if(it.min != null && it.max != null) chips.push(it.min === it.max ? it.min + ' consumo' : it.min + '–' + it.max + ' consumo');
      if(el('productChips')) el('productChips').innerHTML = chips.map(x => '<span class="chip">' + x + '</span>').join('');
    }
    if(el('wetInfo')) el('wetInfo').textContent = currentCat === 'ladrillos' || currentCat === 'bloques' ? 'El rendimiento base se muestra separado de la merma.' : currentCat === 'revestimientos' ? 'El consumo depende del espesor seleccionado.' : 'Cada puente de unión mantiene su fórmula específica.';
  }
  function calcWet(){
    syncWet();
    const name = el('wetProduct') ? el('wetProduct').value : '';
    const it = data[currentCat] && data[currentCat][name];
    if(!it){
      const box = el('wetResult');
      if(box) box.innerHTML = resultHTML('Obra húmeda', currentCat, [['Aviso', 'Elige un producto', 'No hay ficha cargada para esta categoría']]);
      return;
    }
    const A = wetArea(), w = num('wetWaste'), f = 1 + w / 100, rows = [];
    if(currentCat === 'ladrillos' || currentCat === 'bloques'){
      const base = it.u * A, uds = Math.ceil(base * f), kg = uds * it.w;
      rows.push([name, uds + ' uds', it.u + ' ud/m² base · ' + Math.ceil(base) + ' uds sin merma · +' + w + '% merma · ' + kg.toFixed(2) + ' kg']);
      if(it.m){
        const mk = it.m * A * f;
        if(el('wetMortar') && el('wetMortar').value === 'predosificado') rows.push(['Mortero', Math.ceil(mk / 25) + ' sacos de 25 kg', mk.toFixed(2) + ' kg · consumo de tendel y llaga']);
        else rows.push(['Mortero hecho en obra', mk.toFixed(2) + ' kg', 'Dosificación a verificar en obra']);
      }
    } else if(currentCat === 'revestimientos'){
      const th = Math.max(1, num('wetThickness')), kg = it.kg * th * A * f;
      rows.push([name, Math.ceil(kg / 25) + ' sacos', kg.toFixed(2) + ' kg · espesor ' + th + ' mm · merma ' + w + ' %']);
      if(th > it.max) rows.push(['Aviso', 'Espesor excedido', 'Máximo almacenado: ' + it.max + ' mm']);
    } else {
      if(it.k === 'level_primer'){
        const s = el('wetSupport') ? el('wetSupport').value : 'poroso';
        const c = s === 'sin_absorcion' ? .075 : s === 'poco_poroso' ? .06 : .11;
        const total = A * c * f;
        rows.push([name, Math.ceil(total / 5) + ' botes de 5 L', total.toFixed(2) + ' L · consumo según absorción del soporte']);
      } else if(it.k === 'sikatop10' || it.k === 'rango_kilos'){
        const c = it.k === 'sikatop10' ? it.min : (it.min + it.max) / 2, kg = A * c * f, L = kg / it.d;
        rows.push([name, Math.ceil(L) + ' L', L.toFixed(2) + ' L · ' + kg.toFixed(2) + ' kg · ficha de consumo']);
      } else {
        const L = A * ((it.min + it.max) / 2) * f;
        rows.push([name, Math.ceil(L) + ' L', L.toFixed(2) + ' L · media del rango de consumo']);
      }
    }
    const obj = {title:name + ' · ' + A.toFixed(2) + ' m²', items:rows};
    const box = el('wetResult');
    if(box){ box.innerHTML = resultHTML(obj.title, 'Merma ' + w + ' %', rows); bindAdd(box, obj); }
  }
  on(el('wetForm'), 'submit', e => { e.preventDefault(); calcWet(); });
  ['wetProduct','wetMeasureMode','wetThickness','wetSupport','wetMortar','wetWaste'].forEach(id => on(el(id), 'change', calcWet));
  ['wetArea','wetL','wetH'].forEach(id => on(el(id), 'input', calcWet));
  $all('#wetCats [data-cat]').forEach(btn => on(btn, 'click', e => { e.preventDefault(); setWetCat(btn.dataset.cat); }));
  function ceramicBodyLabel(k){ return {porcelanico:'Porcelánico',pasta_roja:'Pasta roja',pasta_blanca:'Pasta blanca'}[k] || 'Porcelánico'; }
  function ceramicGlueKgM2(side, body, bond){
    const simple = side <= 30 ? 3 : side <= 60 ? 3.5 : 4.5;
    const doble = side <= 30 ? 5 : side <= 60 ? 6 : 6.5;
    let kg = bond === 'doble' ? doble : simple;
    if(body === 'porcelanico' && bond === 'simple' && side > 45) kg += 0.5;
    return kg;
  }
  function calcLevel(){
    const A = Math.max(10, num('cA')), B = Math.max(10, num('cB')), area = num('cArea'), w = num('cWaste'), body = currentCerBody;
    if(el('aSize')) el('aSize').value = Math.max(A, B);
    const tileAreaM2 = (A * B) / 10000, tilesBase = tileAreaM2 > 0 ? area / tileAreaM2 : 0, tiles = Math.ceil(tilesBase * (1 + w / 100)), tilesM2 = tileAreaM2 > 0 ? 1 / tileAreaM2 : 0;
    const clipsM2 = Math.max(4, Math.ceil(tilesM2 * 2)), total = Math.ceil(clipsM2 * area * (1 + w / 100)), side = Math.max(A, B);
    const bond = (el('cBond') && el('cBond').value) || 'doble', glueKgM2 = ceramicGlueKgM2(side, body, bond), bondLabel = bond === 'doble' ? 'Doble encolado' : 'Encolado simple';
    const glueKg = glueKgM2 * area * (1 + w / 100), groutKgM2 = side <= 30 ? 0.8 : side <= 60 ? 0.5 : 0.35, groutKg = groutKgM2 * area;
    const rows = [
      ['Tipo de baldosa', ceramicBodyLabel(body), body === 'porcelanico' ? 'UNE-EN 14411 · baja absorción · adhesivo C2TE o superior' : 'UNE-EN 14411 · absorción media/alta'],
      ['Baldosas / piezas', tiles + ' uds', tilesM2.toFixed(2) + ' ud/m² · formato ' + A + ' × ' + B + ' cm · merma ' + w + ' %'],
      ['Calzos de nivelación', total + ' uds', clipsM2 + ' calzos/m² · 2 puntos por pieza como base'],
      ['Cuñas reutilizables', 'No consumibles', 'Se reutilizan durante la colocación'],
      ['Encolado', bondLabel, side > 45 || body === 'porcelanico' ? 'Doble si lado > 45 cm o porcelánico · UNE-EN 12004' : 'Capa en soporte y/o dorso · UNE-EN 12004'],
      ['Cemento cola C2TE', Math.ceil(glueKg / 25) + ' saco(s) de 25 kg', glueKg.toFixed(1) + ' kg · ' + glueKgM2 + ' kg/m² · ' + bondLabel + ' · UNE-EN 12004'],
      ['Mortero de juntas', Math.ceil(groutKg / 5) + ' saco(s) de 5 kg', groutKg.toFixed(1) + ' kg · estimación por formato']
    ];
    const obj = {title:ceramicBodyLabel(body) + ' · ' + area.toFixed(2) + ' m²', items:rows};
    const box = el('levelResult');
    if(box){ box.innerHTML = resultHTML(obj.title, 'UNE-EN 14411 · ' + A + ' × ' + B + ' cm · merma ' + w + ' %', rows); bindAdd(box, obj); }
  }
  on(el('levelForm'), 'submit', e => { e.preventDefault(); calcLevel(); });
  on(el('cBond'), 'change', () => { calcLevel(); if(el('adhForm') && !el('adhForm').classList.contains('hidden')) adhesiveClass(); });
  function adhesiveClass(){
    const zone = el('aZone') ? el('aZone').value : 'floor';
    const place = el('aPlace') ? el('aPlace').value : 'interior';
    const size = num('aSize');
    const support = el('aSupport') ? el('aSupport').value : 'cement';
    const body = currentCerBody;
    let cls = 'C2TE';
    if(support === 'wood') cls = size > 60 ? 'R2' : 'C2S1';
    else if(support === 'metal') cls = size > 60 ? 'R2' : 'R1';
    else if(support === 'radiant') cls = size > 60 ? 'C2S2' : 'C2S1';
    else if(place === 'exterior') cls = size > 90 ? 'C2S2' : 'C2TES1';
    else if(size > 120) cls = 'C2S2';
    else if(size > 60) cls = 'C2TES1';
    else if(body === 'pasta_roja' && size <= 30 && support === 'cement' && zone === 'wall') cls = 'C1';
    else if(body === 'porcelanico') cls = size > 45 ? 'C2TES1' : 'C2TE';
    else cls = 'C2TE';
    const meanings = {C1:'Adhesivo cementoso de adherencia normal',C2:'Adhesivo cementoso de adherencia mejorada',C2TE:'Cementoso mejorado TE',C2TES1:'C2TE deformable',C2S1:'Cementoso mejorado deformable',C2S2:'Cementoso altamente deformable',R1:'Resinas reactivas',R2:'Resinas reactivas mejorado'};
    const area = num('cArea'), bond = (el('cBond') && el('cBond').value) || 'doble', glueKgM2 = ceramicGlueKgM2(size, body, bond), bondLabel = bond === 'doble' ? 'Doble encolado' : 'Encolado simple';
    const rows = [
      ['Tipo de baldosa', ceramicBodyLabel(body), 'UNE-EN 14411 · influye en la clase mínima'],
      ['Clasificación orientativa', cls, 'UNE-EN 12004 · ' + (meanings[cls] || 'Consultar ficha')],
      ['Encolado', bondLabel, 'Simple ≈ 3–4 kg/m² · doble ≈ 5–6 kg/m²'],
      ['Consumo técnico', area ? ((glueKgM2 * area).toFixed(1) + ' kg · ' + Math.ceil(glueKgM2 * area / 25) + ' saco(s) 25 kg') : glueKgM2 + ' kg/m²', glueKgM2 + ' kg/m² · ' + bondLabel + ' · UNE-EN 12004'],
      ['Comprobación', 'Obligatoria', 'Verificar ficha técnica del adhesivo elegido']
    ];
    const box = el('adhResult');
    if(box){ box.classList.remove('hidden'); box.innerHTML = resultHTML('Cemento cola · ' + cls, ceramicBodyLabel(body) + ' · lado mayor ' + size + ' cm', rows); }
  }
  on(el('adhForm'), 'submit', e => { e.preventDefault(); adhesiveClass(); });
  function renderWork(){
    const c = el('workContent');
    if(!c) return;
    c.innerHTML = work.length ? work.map((x,i) => '<div class="workItem"><b>' + (i + 1) + '. ' + x.title + '</b><br><button class="btn" data-del="' + i + '" style="margin-top:8px">Eliminar</button></div>').join('') : '<div class="empty">Todavía no has añadido partidas.</div>';
    c.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { work.splice(Number(b.dataset.del), 1); renderWork(); });
  }
  function renderList(){
    const c = el('listContent');
    if(!c) return;
    c.innerHTML = work.length ? work.flatMap(x => x.items).map(x => '<div class="listLine"><span>' + x[0] + '</span><strong>' + x[1] + '</strong></div>').join('') : '<div class="empty">Añade partidas para generar la lista.</div>';
  }
})();
