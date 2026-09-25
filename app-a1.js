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
  let priceBook = {};
  let jobMeta = {name:'',client:'',addr:'',vat:'21',laborExtra:0,extra:0,disc:0,valid:'30',notes:'',num:''};
  let company = {name:'',nif:'',phone:'',mail:'',addr:''};
  let savedJobs = [];
  const primed = Object.create(null);
  const WORK_KEY = 'calculadora-work-v1';
  const PRICE_KEY = 'calculadora-prices-v1';
  const JOB_KEY = 'calculadora-job-v1';
  const CO_KEY = 'calculadora-company-v1';
  const SNAP_KEY = 'calculadora-jobs-v1';
  try { work = JSON.parse(localStorage.getItem(WORK_KEY) || '[]') || []; } catch(e){ work = []; }
  try { priceBook = JSON.parse(localStorage.getItem(PRICE_KEY) || '{}') || {}; } catch(e){ priceBook = {}; }
  try { jobMeta = Object.assign(jobMeta, JSON.parse(localStorage.getItem(JOB_KEY) || '{}') || {}); } catch(e){}
  try { company = Object.assign(company, JSON.parse(localStorage.getItem(CO_KEY) || '{}') || {}); } catch(e){}
  try { savedJobs = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]') || []; } catch(e){ savedJobs = []; }

  function money(n){ return (Math.round((Number(n)||0)*100)/100).toFixed(2).replace('.', ','); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function openingsM2(doors, wins){ return Math.max(0, Number(doors)||0) * 0.80 * 2.10 + Math.max(0, Number(wins)||0) * 1.20 * 1.20; }
  function netArea(gross, holes){ return Math.max(0, (Number(gross)||0) - (Number(holes)||0)); }
  function jambStuds(doors, wins){
    return Math.max(0, Math.round(Number(doors)||0)) * 2 + Math.max(0, Math.round(Number(wins)||0)) * 2;
  }
  function cornerBeadRow(H, doors){
    const h = Math.max(0, Number(H)||0);
    const d = Math.max(0, Math.round(Number(doors)||0));
    const runs = 2 + d * 2;
    const m = runs * h;
    return ['Guardavivos metálico', m.toFixed(1) + ' m · ' + Math.ceil(m / 3) + ' barras de 3 m', '2 cantos del paño + 2 jambas por puerta · ' + runs + ' verticales × ' + h.toFixed(2) + ' m · no sustituye rincones de proyecto'];
  }
  function boardTypeLabel(id){
    const v = el(id) ? el(id).value : 'normal';
    return {normal:'Estándar BA',hidro:'Hidrófuga H',rf:'RF / F',dura:'Alta dureza I'}[v] || 'Estándar BA';
  }
  function laborRow(area, rate, label){
    const a = Math.max(0, Number(area)||0), r = Math.max(0, Number(rate)||0);
    if(!r) return null;
    return ['Mano de obra ' + (label||'montaje'), money(a*r) + ' €', r.toFixed(2).replace('.', ',') + ' €/m² · ' + a.toFixed(2) + ' m² netos'];
  }
  function lineQty(val){
    const s = String(val||'');
    const m = s.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return m ? Math.abs(Number(m[0])) : 0;
  }
  function lineUnit(name, val){
    const s = (String(val||'') + ' ' + String(name||'')).toLowerCase();
    if(s.includes('€')) return '€';
    if(s.includes('barra')) return 'barra';
    if(s.includes('saco')) return 'saco';
    if(s.includes('rollo')) return 'rollo';
    if(s.includes('caja')) return 'caja';
    if(s.includes('panel')) return 'panel';
    if(s.includes('bote')) return 'bote';
    if(/\bkg\b/.test(s)) return 'kg';
    if(/\bl\b/.test(s) || s.includes(' litro')) return 'L';
    if(s.includes('m²') || s.includes('m2')) return 'm²';
    if(s.includes(' m ') || s.includes('m ·')) return 'm';
    return 'ud';
  }
  function persist(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} }
  function saveWork(){ persist(WORK_KEY, work); }
  function savePrices(){ persist(PRICE_KEY, priceBook); }
  function readJobFields(){
    jobMeta.name = (el('jobName') && el('jobName').value) || jobMeta.name || '';
    jobMeta.client = (el('jobClient') && el('jobClient').value) || '';
    jobMeta.addr = (el('jobAddr') && el('jobAddr').value) || '';
    jobMeta.vat = (el('jobVat') && el('jobVat').value) || jobMeta.vat || '21';
    jobMeta.disc = num('jobDisc');
    jobMeta.laborExtra = num('jobLaborExtra');
    jobMeta.extra = num('jobExtra');
    jobMeta.valid = (el('jobValid') && el('jobValid').value) || jobMeta.valid || '30';
    jobMeta.notes = (el('jobNotes') && el('jobNotes').value) || '';
    jobMeta.num = (el('jobNum') && el('jobNum').value) || jobMeta.num || '';
    company.name = (el('coName') && el('coName').value) || '';
    company.nif = (el('coNif') && el('coNif').value) || '';
    company.phone = (el('coPhone') && el('coPhone').value) || '';
    company.mail = (el('coMail') && el('coMail').value) || '';
    company.addr = (el('coAddr') && el('coAddr').value) || '';
  }
  function saveJob(){ readJobFields(); persist(JOB_KEY, jobMeta); persist(CO_KEY, company); }
  function fillJobFields(){
    const map = {jobName:jobMeta.name,jobClient:jobMeta.client,jobAddr:jobMeta.addr,jobVat:jobMeta.vat,jobDisc:jobMeta.disc,jobLaborExtra:jobMeta.laborExtra,jobExtra:jobMeta.extra,jobValid:jobMeta.valid,jobNotes:jobMeta.notes,jobNum:jobMeta.num,coName:company.name,coNif:company.nif,coPhone:company.phone,coMail:company.mail,coAddr:company.addr};
    Object.keys(map).forEach(id => { if(el(id) && map[id] != null && map[id] !== '') el(id).value = map[id]; });
    if(el('jobNum') && !el('jobNum').value){
      const n = 'P-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String((savedJobs.length||0)+1).padStart(3,'0');
      el('jobNum').value = n; jobMeta.num = n;
    }
  }
  function nextQuoteNum(){
    return 'P-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(Date.now()).slice(-4);
  }
  function mergedLines(){
    const map = Object.create(null);
    work.forEach(part => (part.items||[]).forEach(row => {
      const name = row[0], val = row[1], detail = row[2] || '';
      const labor = /^Mano de obra/i.test(name);
      const key = name;
      if(!map[key]) map[key] = {name, qty:0, unit:lineUnit(name,val), detail, labor:labor, amount:0};
      if(labor){
        const euros = Number(String(val).replace(',','.').replace(/[^\d.]/g,'')) || 0;
        map[key].amount += euros;
        map[key].qty += 1;
        map[key].unit = 'partida';
      } else {
        map[key].qty += lineQty(val);
        if(detail && map[key].detail.indexOf(detail) < 0) map[key].detail = map[key].detail || detail;
      }
    }));
    return Object.keys(map).map(k => map[k]);
  }
  function budgetRows(){
    return mergedLines().map(line => {
      const price = Number(priceBook[line.name]);
      const unitPrice = isFinite(price) ? price : 0;
      const qty = line.labor ? 1 : line.qty;
      const total = line.labor ? line.amount : qty * unitPrice;
      return Object.assign({}, line, {qty:qty, unitPrice:unitPrice, total:total});
    });
  }
  function budgetTotals(){
    const rows = budgetRows();
    let mat = 0, labor = 0;
    rows.forEach(r => { if(r.labor) labor += r.total; else mat += r.total; });
    labor += Number(jobMeta.laborExtra)||0;
    const extra = Number(jobMeta.extra)||0;
    const discPct = Math.max(0, Number(jobMeta.disc)||0);
    const base = Math.max(0, mat + labor + extra);
    const disc = base * discPct / 100;
    const taxable = base - disc;
    const vatPct = Number(jobMeta.vat)||0;
    const vat = taxable * vatPct / 100;
    return {rows, mat, labor, extra, disc, discPct, taxable, vat, vatPct, grand: taxable + vat};
  }

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
  const ACCESS_STORE = 'calculadora-access-v1';
  const ACCESS_HASH = 'ecb565830c0e28693d2e04e6360c7c07a6738ef62b7fc332f53e7daeb13a4737';
  let hasAccess = false;
  try { hasAccess = localStorage.getItem(ACCESS_STORE) === ACCESS_HASH; } catch(e){}
  const nav = $all('[data-nav]');
  const data = window.CALC_DATA || {};
  function setLocked(on){ document.body.dataset.locked = on ? '1' : '0'; }
  async function sha256hex(text){
    if(window.crypto && crypto.subtle){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }
    return '';
  }
  function enterApp(){
    setLocked(false);
    if(postalState.code && /^[0-9]{5}$/.test(postalState.code)){
      if(el('storeTitle')) el('storeTitle').textContent = postalState.store || resolveStore(postalState.code);
      if(el('storeSub')) el('storeSub').textContent = 'CP ' + postalState.code + ' · referencias vinculadas a zona';
      if(el('storebar')) el('storebar').classList.add('show');
      show('home');
    } else show('postal');
  }
  function show(id){
    if(!hasAccess && id !== 'gate'){ id = 'gate'; }
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
    const title = el('storeTitle'), sub = el('storeSub'), bar = el('storebar');
    if(title) title.textContent = store;
    if(sub) sub.textContent = 'CP ' + cp + ' · referencias vinculadas a zona';
    if(bar) bar.classList.add('show');
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
  on(el('gateToggle'), 'click', e => {
    const input=el('gateKey'); if(!input) return;
    const show=input.type==='password';
    input.type=show?'text':'password';
    e.currentTarget.textContent=show?'Ocultar':'Ver';
    e.currentTarget.setAttribute('aria-pressed',String(show));
    e.currentTarget.setAttribute('aria-label',show?'Ocultar clave':'Mostrar clave');
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
  function woolThick(profile, kind){
    if(kind === 'semi') return 40;
    const p = Number(profile) || 70;
    if(p <= 48) return 40;
    if(p <= 70) return 60;
    return 80;
  }
  function woolRow(area, thickMm, kind){
    const need = Math.max(0, area) * 1.08;
    const panel = 1.2 * 0.6;
    const uds = Math.ceil(need / panel);
    const where = kind === 'semi' ? 'entre perfiles omega' : 'relleno de cámara entre montantes';
    return ['Lana mineral ' + thickMm + ' mm', need.toFixed(1) + ' m² · ' + uds + ' panel(es) 1200 × 600', 'UNE 102043 · ' + where + ' · 1 m²/m² · merma corte 8 % · panel 0,72 m² · UNE-EN 13162'];
  }
  function tacoRow(lengthM, runs, kind){
    const n = Math.max(0, runs) * (Math.ceil(Math.max(0, lengthM) / 0.6) + 1);
    const detail = kind === 'omega'
      ? 'UNE 102043 §16.6 · anclaje de omega al paramento · ala del perfil · paso máx. 600 mm · primer y último cerca del extremo'
      : 'UNE 102043 §16.6 · anclaje de canales al soporte · paso máx. 600 mm · primer y último cerca del extremo';
    return ['Tacos de golpeo', n + ' uds · ' + Math.ceil(n / 100) + ' caja(s) de 100', detail];
  }
  function screwBoxes(n){ return Math.ceil(Math.max(0, n) / 1000); }
  function pylScrewLength(totalBoardMm){
    const need = Math.max(0, Number(totalBoardMm)||0) + 10;
    const commercial = [25,35,45,55,70,90];
    return commercial.find(x => x >= need) || Math.ceil(need/10)*10;
  }
  function pylFaceWork(area, layers, thick){
    const A = Math.max(0, area), n = Math.max(0, Math.round(Number(layers) || 0)), waste = 1.10;
    const t = Math.max(12.5, Number(thick)||15);
    const inner = Math.max(0, n - 1), visible = n > 0 ? 1 : 0;
    const firstRate = n >= 2 ? 8 : (n === 1 ? 15 : 0), secondRate = n >= 2 ? 15 : 0;
    const firstLen = pylScrewLength(t), secondLen = n >= 2 ? pylScrewLength(t*n) : 0;
    return {n:n, firstNeed:Math.ceil(A*firstRate*waste), firstType:'3,5 × '+firstLen, secondNeed:Math.ceil(A*secondRate*waste), secondType:n>=2?('3,5 × '+secondLen):'', tapeInner:Math.ceil(inner*A*1.6*waste), tapeVisible:Math.ceil(visible*A*1.6*waste), pasteInner:Math.ceil(inner*A*0.20*waste), pasteVisible:Math.ceil(visible*A*0.40*waste)};
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
  on(el('gateForm'), 'submit', async e => {
    e.preventDefault();
    const raw = (el('gateKey') && el('gateKey').value) || '';
    const err = el('gateError');
    const hash = await sha256hex(raw.trim());
    if(hash !== ACCESS_HASH){
      if(err) err.textContent = 'Clave incorrecta.';
      return;
    }
    try { localStorage.setItem(ACCESS_STORE, ACCESS_HASH); } catch(err2){}
    hasAccess = true;
    if(err) err.textContent = '';
    enterApp();
  });
  setLocked(!hasAccess);
  if(hasAccess) enterApp();
  else show('gate');
  // Controles estáticos: listeners directos para evitar fallos táctiles en Android/WebView.
  $all('[data-open]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation(); show(btn.dataset.open);
  }));
  $all('[data-home]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation(); show('home');
  }));
  $all('[data-nav]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation(); show(btn.dataset.nav);
  }));
  on(el('look'), 'click', e => {
    e.preventDefault(); e.stopPropagation();
    const ap=el('appearance'); if(ap) ap.classList.toggle('open');
  });
  $all('[data-mode]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation();
    document.body.dataset.mode=btn.dataset.mode;
    $all('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
  }));
  $all('[data-ac]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation();
    const parts=(btn.dataset.ac||'').split('|');
    if(parts.length===3){
      const root=document.documentElement.style;
      root.setProperty('--accent',parts[0]); root.setProperty('--accent2',parts[0]);
      root.setProperty('--accentSoft',parts[1]); root.setProperty('--on',parts[2]);
      $all('[data-ac]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
    }
  }));
  $all('#wetCats [data-cat]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation(); setWetCat(btn.dataset.cat);
  }));
  $all('[data-cer-body]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation();
    currentCerBody=btn.dataset.cerBody;
    $all('[data-cer-body]').forEach(x=>x.classList.toggle('active',x===btn));
    calcLevel();
    if(el('adhForm')&&!el('adhForm').classList.contains('hidden')) adhesiveClass();
  }));
  $all('[data-cer-tab]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation();
    const level=btn.dataset.cerTab==='level';
    $all('[data-cer-tab]').forEach(x=>x.classList.toggle('active',x===btn));
    if(el('levelForm')) el('levelForm').classList.toggle('hidden',!level);
    if(el('levelResult')) el('levelResult').classList.toggle('hidden',!level);
    if(el('adhForm')) el('adhForm').classList.toggle('hidden',level);
    if(el('adhResult')) el('adhResult').classList.toggle('hidden',level);
    if(level) calcLevel(); else adhesiveClass();
  }));

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
    const liningType = e.target.closest('[data-lining-type]');
    if(liningType && liningType.dataset.liningType){ setLiningType(liningType.dataset.liningType); return; }
    const roofFam = e.target.closest('[data-roof-fam]');
    if(roofFam && roofFam.dataset.roofFam){ setRoofFam(roofFam.dataset.roofFam); return; }
    const roofSys = e.target.closest('[data-roof-sys]');
    if(roofSys && roofSys.dataset.roofSys){ setRoofSys(roofSys.dataset.roofSys); return; }
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
