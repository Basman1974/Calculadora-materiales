(() => {
  const CALCULATION_VERSION='20261019-techos';
  const $ = s => document.querySelector(s);
  const $all = s => [...document.querySelectorAll(s)];
  const cache = Object.create(null);
  function el(id){ if(cache[id] === undefined) cache[id] = document.getElementById(id); return cache[id]; }
  function finiteAmount(value){ const n=Number(String(value ?? '').replace(',','.')); return Number.isFinite(n)&&n>=0?n:0; }
  function num(id){ const n = el(id); return n?finiteAmount(n.value):0; }
  function focusInput(input){
    if(!input)return;
    for(let parent=input.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
    input.focus({preventScroll:true});
    input.scrollIntoView?.({block:'center',behavior:'auto'});
  }
  function submitProgressiveCalculation(event,formId,resultId,calculate){
    event.preventDefault();calculate();
    const form=el(formId),section=el(resultId)?.closest('.screen');
    const invalid=[...(form?.querySelectorAll('input,select')||[]),...(section?.querySelectorAll('input,select')||[])].find(input=>!input.checkValidity());
    if(invalid){focusInput(invalid);invalid.reportValidity();return;}
    if(!el(resultId)?.querySelectorAll('[role="alert"]').length)el(resultId)?.scrollIntoView?.({block:'start',behavior:'auto'});
  }
  function inputNumberText(id){
    const input=el(id),text=String(input?.value??'').trim(),value=Number(text.replace(',','.'));
    return text!==''&&Number.isFinite(value)&&value>=0&&input?.checkValidity()?decimalText(value):'pendiente';
  }
  function setOverview(id,text){if(el(id))el(id).textContent=text;}
  function selectText(id){const input=el(id);return Array.from(input?.options||[]).find(option=>option.value===input.value)?.textContent||input?.value||'pendiente';}
  function validCalculation(resultId, rules, message='',messageField=''){
    const errors=[];
    const section=el(resultId)?.closest('.screen');
    if(section)section.querySelectorAll('input,select').forEach(input=>{input.setCustomValidity('');input.setAttribute('aria-invalid','false');const hint=el(input.id+'Error');if(hint){hint.textContent='';hint.hidden=true;}});
    rules.forEach(([id,min=0,integer=false])=>{
      const input=el(id);if(!input)return;
      const text=String(input.value).trim(),value=Number(text.replace(',','.'));
      const valid=text!==''&&Number.isFinite(value)&&value>=min&&(!integer||Number.isInteger(value));
      const error=valid?'':'Introduce un número '+(integer?'entero ':'')+(min===0.000001?'mayor que 0':'igual o mayor que '+min)+'.';
      input.setCustomValidity(error);input.setAttribute('aria-invalid',String(!valid));
      const hint=el(id+'Error');if(hint){hint.textContent=error;hint.hidden=valid;}
      if(!valid)errors.push(error);
    });
    if(message){errors.push(message);const input=el(messageField);if(input){input.setCustomValidity(message);input.setAttribute('aria-invalid','true');const hint=el(messageField+'Error');if(hint){hint.textContent=message;hint.hidden=false;}}}
    if(errors.length){const box=el(resultId);if(box)box.innerHTML='<div class="info" role="alert">'+esc(message||errors[0])+'</div>';return false;}
    return true;
  }
  function on(node, ev, fn){ if(node) node.addEventListener(ev, fn); }
  on(el('closeUpdateNotice'),'click',()=>{
    el('updateNotice').hidden=true;
    try{localStorage.setItem('calc-notice-seen','20261020-techos-visibles');}catch(e){}
    const heading=document.querySelector('#home .hero h2');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  });
  try{if(localStorage.getItem('calc-notice-seen')==='20261020-techos-visibles')el('updateNotice').hidden=true;}catch(e){}
  let editingPart=null;
  let currentCat = 'ladrillos';
  let currentCerBody = 'porcelanico';
  let work = [];
  let priceBook = {};
  let jobMeta = {name:'',client:'',addr:'',vat:'21',laborExtra:0,extra:0,disc:0,profitPct:0,valid:'30',notes:'',num:''};
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
  try { jobMeta = Object.assign(jobMeta, normalizeJobMeta(JSON.parse(localStorage.getItem(JOB_KEY) || '{}') || {})); } catch(e){}
  try { company = Object.assign(company, JSON.parse(localStorage.getItem(CO_KEY) || '{}') || {}); } catch(e){}
  try { savedJobs = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]') || []; } catch(e){ savedJobs = []; }
  // No sobrescribir datos dañados al arrancar: una copia aún puede recuperarlos.
  if(!Array.isArray(work))work=[];
  const validPart=part=>part&&typeof part==='object'&&typeof part.title==='string'&&Array.isArray(part.items)&&part.items.every(row=>Array.isArray(row)&&row.length>=2&&row.every(value=>typeof value==='string'));
  const validEditor=cfg=>cfg&&typeof cfg==='object'&&['wall','lining','roof','wet','ceramic'].includes(cfg.screen)&&cfg.values&&typeof cfg.values==='object'&&!Array.isArray(cfg.values)&&Object.values(cfg.values).every(value=>typeof value==='string');
  work=work.filter(validPart).map(part=>{if(part.editor&&!validEditor(part.editor))delete part.editor;return part;});
  if(!priceBook||typeof priceBook!=='object'||Array.isArray(priceBook))priceBook={};
  if(!Array.isArray(savedJobs))savedJobs=[];
  savedJobs=savedJobs.filter(job=>job&&typeof job==='object'&&Array.isArray(job.work)&&job.work.every(validPart)&&job.meta&&typeof job.meta==='object'&&!Array.isArray(job.meta));
  savedJobs.forEach(job=>job.work.forEach(part=>{if(part.editor&&!validEditor(part.editor))delete part.editor;}));

  function money(n){ return (Math.round((Number(n)||0)*100)/100).toFixed(2).replace('.', ','); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function openingsM2(doors, wins){ return Math.max(0, Number(doors)||0) * 0.80 * 2.10 + Math.max(0, Number(wins)||0) * 1.20 * 1.20; }
  function netArea(gross, holes){ return Math.max(0, (Number(gross)||0) - (Number(holes)||0)); }
  function jambStuds(doors, wins){
    return Math.max(0, Math.round(Number(doors)||0)) * 2 + Math.max(0, Math.round(Number(wins)||0)) * 2;
  }
  function cornerBeadRow(m){
    return ['Guardavivos metálico', m.toFixed(2) + ' m · ' + Math.ceil(m / 3) + ' barras de 3 m', 'Longitud de aristas expuestas medida por el usuario; no presupone cantos libres ni jambas a toda altura.'];
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
    const container=String(val||'').match(/^\s*\d+(?:[.,]\d+)?\s*(envase(?:\(s\)|s)?|bote(?:s)?)\b/i);
    if(container)return container[1].toLowerCase().startsWith('bote')?'bote':'envase';
    const explicit=String(val||'').match(/^\s*\d+(?:[.,]\d+)?\s*(m²|m2|kg|m\b|uds?\b|barras?\b|sacos?\b|rollos?\b|cajas?\b|panel(?:es)?\b|L\b)/i);
    if(explicit){const u=explicit[1].toLowerCase();return ({m2:'m²',uds:'ud',barras:'barra',sacos:'saco',rollos:'rollo',cajas:'caja',paneles:'panel',l:'L'})[u]||u;}

    // Una cantidad expresada solo en m² tiene unidad explícita; el nombre no la cambia.
    if(/^\s*\d+(?:[.,]\d+)?\s*m(?:²|2)\s*$/i.test(String(val||''))) return 'm²';
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
  function persist(key, val){ try { localStorage.setItem(key, JSON.stringify(val));if(el('saveStatus'))el('saveStatus').textContent='Guardado en este dispositivo'; } catch(e){if(el('saveStatus'))el('saveStatus').textContent='No se pudo guardar. Descarga una copia desde Más antes de cerrar.';} }
  function saveWork(){ persist(WORK_KEY, work); }
  function savePrices(){ persist(PRICE_KEY, priceBook); }
  // Límite técnico de entrada para el recargo; no es un porcentaje legal o comercial.
  function percentageValue(value, max){
    if(typeof value === 'number') return Number.isFinite(value) && value >= 0 && value <= max ? value : null;
    const text = String(value == null ? '' : value).trim();
    if(text === '') return 0;
    if(!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
    const n = Number(text.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  }
  function normalizeJobMeta(meta){
    if(!meta||typeof meta!=='object'||Array.isArray(meta))meta={};
    return Object.assign({}, meta, {profitPct:percentageValue(meta.profitPct, 1000) ?? 0, disc:percentageValue(meta.disc, 100) ?? 0,vat:percentageValue(meta.vat,100)??21,laborExtra:finiteAmount(meta.laborExtra),extra:finiteAmount(meta.extra)});
  }
  function decimalText(value){
    return Number(value).toLocaleString('es-ES', {useGrouping:false, maximumSignificantDigits:21});
  }
  function unitPriceText(value){
    const [whole, fraction=''] = decimalText(value).split(',');
    return whole + ',' + fraction.padEnd(2, '0');
  }
  function readPercentage(id, previous, max){
    const input = el(id);
    if(!input) return percentageValue(previous, max) ?? 0;
    const value = percentageValue(input.value, max);
    const message = value === null ? 'Introduce un porcentaje entre 0 y ' + max.toLocaleString('es-ES') + ' %, con coma o punto decimal. Se mantiene el último porcentaje válido.' : '';
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(value === null));
    const error = el(id + 'Error');
    if(error){ error.textContent = message; error.hidden = !message; }
    return value === null ? (percentageValue(previous, max) ?? 0) : value;
  }
  function budgetInputValid(){
    readJobFields();
    for(const id of ['jobProfitPct','jobDisc','jobLaborExtra','jobExtra']){
      const input = el(id);
      if(input && !input.checkValidity()){ focusInput(input); input.reportValidity(); return false; }
    }
    for(const input of el('listContent')?.querySelectorAll('[data-price-key]')||[]){if(!input.checkValidity()){el('viewAmounts')?.click();focusInput(input);input.reportValidity();return false;}}
    return true;
  }
  function readBudgetAmount(id,previous){
    const input=el(id);if(!input)return finiteAmount(previous);
    const value=percentageValue(input.value,Number.MAX_VALUE);
    input.setCustomValidity(value===null?'Introduce un importe válido igual o mayor que 0. Se conserva el último importe válido.':'');
    input.setAttribute('aria-invalid',String(value===null));
    const hint=el(id+'Error');if(hint){hint.textContent=input.validationMessage;hint.hidden=value!==null;}
    return value===null?finiteAmount(previous):value;
  }
  function readJobFields(){
    jobMeta.name = el('jobName') ? el('jobName').value : jobMeta.name || '';
    jobMeta.client = (el('jobClient') && el('jobClient').value) || '';
    jobMeta.addr = (el('jobAddr') && el('jobAddr').value) || '';
    jobMeta.vat = (el('jobVat') && el('jobVat').value) || jobMeta.vat || '21';
    jobMeta.disc = readPercentage('jobDisc', jobMeta.disc, 100);
    jobMeta.profitPct = readPercentage('jobProfitPct', jobMeta.profitPct, 1000);
    jobMeta.laborExtra = readBudgetAmount('jobLaborExtra',jobMeta.laborExtra);
    jobMeta.extra = readBudgetAmount('jobExtra',jobMeta.extra);
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
    const map = {jobName:jobMeta.name,jobClient:jobMeta.client,jobAddr:jobMeta.addr,jobVat:jobMeta.vat,jobDisc:decimalText(jobMeta.disc ?? 0),jobProfitPct:decimalText(jobMeta.profitPct ?? 0),jobLaborExtra:jobMeta.laborExtra,jobExtra:jobMeta.extra,jobValid:jobMeta.valid,jobNotes:jobMeta.notes,jobNum:jobMeta.num,coName:company.name,coNif:company.nif,coPhone:company.phone,coMail:company.mail,coAddr:company.addr};
    Object.keys(map).forEach(id => { if(el(id) && map[id] != null) el(id).value = map[id]; });
    readPercentage('jobProfitPct', jobMeta.profitPct, 1000);
    readPercentage('jobDisc', jobMeta.disc, 100);
    if(el('jobNum') && !el('jobNum').value){
      const n = 'P-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String((savedJobs.length||0)+1).padStart(3,'0');
      el('jobNum').value = n; jobMeta.num = n;
    }
  }
  function nextQuoteNum(){
    return 'P-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(Date.now()).slice(-4);
  }
  function isTechnicalRow(row){return !Array.isArray(row)||/comprobación|huecos descontados|aviso|fuera de tabla|volumen geométrico/i.test(row[0]) || /no dimensionados|requiere sistema/i.test(row[1]) || !/^\s*\d+(?:[.,]\d+)?\s*(?:m²|m2|kg|m\b|uds?\b|barras?\b|sacos?\b|saco\(s\)|rollos?\b|cajas?\b|panel(?:es)?\b|botes?\b|envases?\b|envase\(s\)|L\b|€)/i.test(String(row[1]));}
  function mergedLines(parts=work){
    const map = Object.create(null);
    const brickFormats=new Set(parts.flatMap(part=>(part.items||[]).filter(row=>row[0]==='Ladrillo cerámico').map(row=>String(row[2]||'').match(/formato ([^·]+)/)?.[1].trim()||'')));
    parts.forEach(part => (part.items||[]).forEach(row => {
      if(isTechnicalRow(row)||(!/^Mano de obra/i.test(row[0])&&lineQty(row[1])===0)) return;
      // Obras anteriores incluían el volumen de referencia y el mortero comprado.
      if(row[0]==='Mortero de colocación'&&part.items.some(r=>/^Mortero (predosificado|hecho en obra)$/.test(r[0])))return;
      const detail=row[2]||'',format=detail.match(/formato ([^·]+)/)?.[1].trim();
      let name=row[0]==='Ladrillo cerámico'&&brickFormats.size>1?row[0]+' · '+(format||'formato sin documentar'):row[0],val=row[1];
      if(row[0]==='Baldosas / piezas'&&format){const body=(part.items||[]).find(r=>r[0]==='Tipo de baldosa')?.[1]||'Tipo sin especificar';name+=' · '+body+' · '+format;}
      if(row[0]==='Banda acústica'){
        const profile=(part.items||[]).map(r=>String(r[0]).match(/^Canal R(\d+)/)).find(Boolean)?.[1];
        if(profile)name+=' · para perfil '+profile+' mm';
      }
      if(row[0]==='Calzos de nivelación'){
        const joint=(part.items||[]).find(r=>r[0]==='Mortero de juntas')?.[2]?.match(/junta (\d+(?:[.,]\d+)?) mm/)?.[1];
        if(joint)name+=' · junta '+joint.replace(',','.')+' mm';
      }
      const labor = /^Mano de obra/i.test(name);
      const unit=lineUnit(name,val),key=JSON.stringify([name,unit]);
      if(!map[key]) map[key] = {name,legacyName:row[0],qty:0,unit,detail,labor:labor,amount:0};
      if(labor){
        const euros = Number(String(val).replace(',','.').replace(/[^\d.]/g,'')) || 0;
        map[key].amount += euros;
        map[key].qty += 1;
        map[key].unit = 'partida';
      } else {
        map[key].qty = Math.round((map[key].qty + lineQty(val)) * 1e6) / 1e6;
        if(detail && map[key].detail.indexOf(detail) < 0) map[key].detail = map[key].detail || detail;
      }
    }));
    const lines=Object.values(map);
    return lines.map(line=>Object.assign(line,{legacyUnique:lines.filter(other=>other.legacyName===line.legacyName).length===1,key:lines.some(other=>other.name===line.name&&other.unit!==line.unit)?line.name+' ['+line.unit+']':line.name}));
  }
  function budgetRows(pricing=jobPricing){
    return mergedLines().map(line=>{
      const id=materialPriceId(line.name,line.unit),held=pricing.entries.find(e=>e.materialId===id);
      const legacy=held?null:legacyLinePrice(line),price=held?held.price:legacy?.price;
      const validPrice=typeof price==='number'&&Number.isFinite(price)&&price>=0;
      const qty=line.labor?1:line.qty,unitPrice=validPrice?price:0,total=line.labor?line.amount:qty*unitPrice;
      return Object.assign({},line,{id,key:legacy?.key||line.key,qty,unitPrice,total:roundEuros(total),missing:!line.labor&&!validPrice,providerId:held?.providerId||'general',providerName:held?.providerName||'Tarifa general',priceDate:held?.updatedAt||null,reference:held?.reference||''});
    });
  }
  function roundEuros(value){ return Math.round((value + Math.abs(value) * Number.EPSILON) * 100) / 100; }
  function partNeedsReview(part){
    const items=part.items||[];
    if(part.incomplete||items.some(row=>/no dimensionados|fuera de tabla|verificar tabla técnica|usar varilla|despiece pendiente|pendiente de dimensionar/i.test(row.join(' '))))return true;
    if((part.editor?.screen==='roof'||/techo/i.test(part.title))&&part.calculationVersion!==CALCULATION_VERSION)return true;
    if(!['20261019-cal-morteros',CALCULATION_VERSION].includes(part.calculationVersion)&&items.some(row=>row[0]==='APLICAREV Cal Nature Pro'))return true;
    // No recalcular ni sustituir precios de copias antiguas de forma silenciosa.
    return !['20261012-auditoria','20261019-cal-morteros',CALCULATION_VERSION].includes(part.calculationVersion)&&(/techo|caravista 24x12x5/i.test(part.title)||items.some(row=>/^SikaTop-(10|30|50)$|^Puente de unión PLUS \(MH\)$|^Puente de Unión Morteros Henares \(PTU-20\)$|^Aplica primer TOP 5KG$|^weberpral prisma$|^Guardavivos metálico$/.test(row[0])));
  }
  function budgetTotals(pricing=jobPricing){
    const rows = budgetRows(pricing);
    let mat = 0, labor = 0;
    rows.forEach(r => { if(r.labor) labor += r.total; else mat += r.total; });
    mat = roundEuros(mat);
    labor = roundEuros(labor + finiteAmount(jobMeta.laborExtra));
    const extra = roundEuros(finiteAmount(jobMeta.extra));
    const discPct = percentageValue(jobMeta.disc, 100) ?? 0;
    const base = roundEuros(Math.max(0, mat + labor + extra));
    const profitPct = percentageValue(jobMeta.profitPct, 1000) ?? 0;
    const profit = roundEuros(base * profitPct / 100);
    const subtotal = roundEuros(base + profit);
    const disc = roundEuros(subtotal * discPct / 100);
    const taxable = roundEuros(subtotal - disc);
    const vatPct = percentageValue(jobMeta.vat,100)??0;
    const vat = roundEuros(taxable * vatPct / 100);
    const missing=rows.filter(r=>r.missing).length;
    const incomplete=work.filter(partNeedsReview).length;
    return {missing,incomplete,provisional:missing>0||incomplete>0, rows, mat, labor, extra, base, profitPct, profit, subtotal, disc, discPct, taxable, vat, vatPct, grand:roundEuros(taxable + vat)};
  }
  function provisionalText(tot){return [tot.missing?tot.missing+' materiales sin precio':'',tot.incomplete?tot.incomplete+' partidas con cálculo incompleto':''].filter(Boolean).join(' · ');}
  function csvSafeCell(value){
    const text=String(value);
    return /^[\s]*[=+@-]/.test(text)&&!/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(text)?"'"+text:text;
  }
  function parseCsvRecords(text){
    text=String(text).replace(/^\ufeff/,'');
    let quoted=false,semi=0,comma=0,hasContent=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){if(quoted&&text[i+1]==='"'){i++;continue;}quoted=!quoted;}
      if(!quoted){
        if(c==='\n'||c==='\r'){if(hasContent)break;semi=0;comma=0;continue;}
        if(c===';')semi++;if(c===',')comma++;
      }
      if(c.trim()!=='')hasContent=true;
    }
    const separator=semi?';':',',rows=[];let row=[],cell='',state='start';
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(state==='quoted'){
        if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else state='closed';}
        else cell+=c;
        continue;
      }
      if(c===separator){row.push(cell);cell='';state='start';continue;}
      if(c==='\n'||c==='\r'){row.push(cell);rows.push(row);row=[];cell='';state='start';if(c==='\r'&&text[i+1]==='\n')i++;continue;}
      if(state==='closed'){if(c===' '||c==='\t')continue;throw Error('CSV: texto inesperado después de una comilla de cierre.');}
      if(c==='"'){if(cell.trim()!=='')throw Error('CSV: comilla dentro de un campo sin entrecomillar.');cell='';state='quoted';}
      else{cell+=c;state='bare';}
    }
    if(state==='quoted')throw Error('CSV con comillas sin cerrar');
    if(cell!==''||row.length||state==='closed'){row.push(cell);rows.push(row);}
    return rows;
  }
  function parseTariffCsv(text){
    return parseCsvRecords(text).flatMap((fields,index)=>{
      if(fields.every(value=>!value.trim()))return [];
      const name=(fields[0]||'').trim(),raw=(fields[1]||'').trim();
      if(index===0&&/^(concepto|material|nombre|producto)$/i.test(name)&&/precio/i.test(raw))return [];
      const price=percentageValue(raw,Number.MAX_VALUE);
      if(fields.length!==2||!name||raw===''||price===null)throw Error('Tarifa no válida en la fila '+(index+1));
      return [[name,price]];
    });
  }
  // Un mismo desglose para pantalla, impresión/PDF, CSV y texto compartido.
  function budgetSummary(tot){
    const pct = n => decimalText(n) + ' %';
    return [
      {label:'Materiales', amount:tot.mat},
      {label:'Mano de obra', amount:tot.labor},
      ...(tot.extra ? [{label:'Desplazamiento / varios', amount:tot.extra}] : []),
      {label:'Coste base', amount:tot.base},
      {label:'Beneficio industrial ' + pct(tot.profitPct), amount:tot.profit},
      {label:'Subtotal', amount:tot.subtotal},
      ...(tot.discPct ? [{label:'Descuento ' + pct(tot.discPct), amount:-tot.disc}] : []),
      {label:'Base imponible', amount:tot.taxable},
      {label:'IVA ' + pct(tot.vatPct), amount:tot.vat},
      {label:tot.provisional ? 'TOTAL PROVISIONAL' : 'TOTAL', amount:tot.grand, grand:true}
    ];
  }

  // Catálogo y precios de obra separados; ambos se guardan en una sola escritura.
  const PRICING_KEY='calculadora-tarifas-v1';
  const PRICE_UNITS=['ud','saco','barra','rollo','caja','panel','envase','bote','m','m²','kg','L'];
  const clonePricing=value=>JSON.parse(JSON.stringify(value));
  const plainObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const cleanPriceName=value=>String(value??'').normalize('NFC').trim().replace(/\s+/g,' ');
  function priceUnit(value){
    const text=cleanPriceName(value).toLowerCase();
    return ({uds:'ud',unidad:'ud',unidades:'ud',sacos:'saco',barras:'barra',rollos:'rollo',cajas:'caja',paneles:'panel',envases:'envase',botes:'bote',m2:'m²',litro:'L',litros:'L',l:'L'})[text]|| (PRICE_UNITS.includes(text)?text:'');
  }
  function materialPriceId(name,unit){return JSON.stringify([cleanPriceName(name),priceUnit(unit)]);}
  function priceToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function validPriceDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function csvPriceDate(value){
    const text=String(value??'').trim(),match=text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const day=match?match[3]+'-'+match[2]+'-'+match[1]:text;
    if(!validPriceDate(day))throw Error('Fecha no válida. Usa AAAA-MM-DD o DD/MM/AAAA.');
    return day;
  }
  function netMaterialPrice(amount,included=false,vat=null){
    const inputPrice=percentageValue(amount,Number.MAX_VALUE);
    if(String(amount??'').trim()===''||inputPrice===null)throw Error('Introduce un precio válido igual o mayor que 0.');
    const vatPct=included?percentageValue(vat,100):null;
    if(included&&(String(vat??'').trim()===''||vatPct===null))throw Error('Indica el porcentaje de IVA incluido, entre 0 y 100 %.');
    return {price:included?inputPrice/(1+vatPct/100):inputPrice,inputPrice,vatIncluded:included,vatPct};
  }
  function makeMaterialRate(providerId,amount,{included=false,vat=null,reference='',updatedAt=priceToday()}={}){
    if(updatedAt!==null&&!validPriceDate(updatedAt))throw Error('Fecha del precio no válida.');
    return Object.assign({providerId,updatedAt,reference:cleanPriceName(reference)},netMaterialPrice(amount,included,vat));
  }
  function emptyPriceCatalog(){return {version:1,providers:[{id:'general',name:'Tarifa general'}],materials:[],pendingRates:[]};}
  function emptyJobPricing(providerId='general'){return {version:1,defaultProviderId:providerId,entries:[]};}
  function validMaterialRate(rate){
    if(!plainObject(rate)||typeof rate.providerId!=='string'||typeof rate.price!=='number'||!Number.isFinite(rate.price)||rate.price<0||typeof rate.reference!=='string'||rate.reference.length>500||(rate.updatedAt!==null&&!validPriceDate(rate.updatedAt))||typeof rate.vatIncluded!=='boolean')return false;
    try{const expected=netMaterialPrice(rate.inputPrice,rate.vatIncluded,rate.vatPct);return expected.price===rate.price&&expected.vatPct===rate.vatPct;}catch(e){return false;}
  }
  function validPriceCatalog(catalog){
    if(!plainObject(catalog)||catalog.version!==1||!Array.isArray(catalog.providers)||!Array.isArray(catalog.materials)||!Array.isArray(catalog.pendingRates))return false;
    const providers=catalog.providers;
    if(!providers.some(p=>p.id==='general'&&p.name==='Tarifa general')||!providers.every(p=>plainObject(p)&&/^(general|p-[a-zA-Z0-9_-]+)$/.test(p.id)&&typeof p.name==='string'&&p.name===cleanPriceName(p.name)&&p.name.length>0&&p.name.length<=160))return false;
    if(new Set(providers.map(p=>p.id)).size!==providers.length||new Set(providers.map(p=>p.name.toLocaleLowerCase('es-ES'))).size!==providers.length)return false;
    const known=id=>providers.some(p=>p.id===id);
    if(!catalog.materials.every(m=>plainObject(m)&&typeof m.name==='string'&&m.name===cleanPriceName(m.name)&&m.name.length>0&&m.name.length<=500&&PRICE_UNITS.includes(m.unit)&&m.id===materialPriceId(m.name,m.unit)&&Array.isArray(m.rates)&&m.rates.every(r=>validMaterialRate(r)&&known(r.providerId))&&new Set(m.rates.map(r=>r.providerId)).size===m.rates.length))return false;
    if(new Set(catalog.materials.map(m=>m.id)).size!==catalog.materials.length)return false;
    return catalog.pendingRates.every(p=>plainObject(p)&&typeof p.name==='string'&&p.name===cleanPriceName(p.name)&&p.name.length>0&&p.name.length<=500&&validMaterialRate(p.rate)&&known(p.rate.providerId))&&new Set(catalog.pendingRates.map(p=>JSON.stringify([p.name,p.rate.providerId]))).size===catalog.pendingRates.length;
  }
  function validJobPricing(pricing){
    return plainObject(pricing)&&pricing.version===1&&typeof pricing.defaultProviderId==='string'&&Array.isArray(pricing.entries)&&pricing.entries.every(e=>{
      if(!plainObject(e)||typeof e.materialId!=='string'||typeof e.providerId!=='string'||!e.providerId||typeof e.providerName!=='string'||!e.providerName.trim()||typeof e.reference!=='string'||(e.updatedAt!==null&&!validPriceDate(e.updatedAt))||(e.price!==null&&(typeof e.price!=='number'||!Number.isFinite(e.price)||e.price<0)))return false;
      try{const key=JSON.parse(e.materialId);return Array.isArray(key)&&key.length===2&&cleanPriceName(key[0])===key[0]&&key[0]!==''&&PRICE_UNITS.includes(key[1])&&materialPriceId(...key)===e.materialId;}catch(err){return false;}
    })&&new Set(pricing.entries.map(e=>e.materialId)).size===pricing.entries.length;
  }
  let priceCatalog=emptyPriceCatalog(),jobPricing=emptyJobPricing(),pricingLoadError='';
  function providerName(id,catalog=priceCatalog){return catalog.providers.find(p=>p.id===id)?.name||'Proveedor de una copia anterior';}
  function catalogMaterial(id,catalog=priceCatalog){return catalog.materials.find(m=>m.id===id);}
  function catalogMaterialRate(id,providerId,catalog=priceCatalog){return catalogMaterial(id,catalog)?.rates.find(r=>r.providerId===providerId)||null;}
  function registerPriceMaterial(catalog,name,unit){
    name=cleanPriceName(name);unit=priceUnit(unit);
    if(!name||name.length>500||!unit)throw Error('Indica el nombre del material y una unidad válida.');
    const id=materialPriceId(name,unit);
    let material=catalogMaterial(id,catalog);
    if(!material){material={id,name,unit,rates:[]};catalog.materials.push(material);}
    return material;
  }
  function upsertMaterialRate(catalog,name,unit,rate){
    if(!catalog.providers.some(p=>p.id===rate.providerId)||!validMaterialRate(rate))throw Error('Precio o proveedor no válido.');
    const material=registerPriceMaterial(catalog,name,unit),index=material.rates.findIndex(r=>r.providerId===rate.providerId);
    if(index<0)material.rates.push(rate);else material.rates[index]=rate;
    return material;
  }
  function ensureProvider(catalog,name){
    name=cleanPriceName(name);if(!name||name.length>160)throw Error('Introduce un nombre de proveedor de hasta 160 caracteres.');
    const existing=catalog.providers.find(p=>p.name.toLocaleLowerCase('es-ES')===name.toLocaleLowerCase('es-ES'));if(existing)return existing;
    let id;do{id='p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}while(catalog.providers.some(p=>p.id===id));
    const provider={id,name};catalog.providers.push(provider);return provider;
  }
  function legacyLinePrice(line,book=priceBook){
    const candidates=[line.name+' ['+line.unit+']',line.key];
    if(line.legacyName&&line.legacyUnique)candidates.push(line.legacyName+' ['+line.unit+']',line.legacyName);
    for(const key of candidates){
      if(!Object.prototype.hasOwnProperty.call(book,key))continue;
      const raw=book[key],price=typeof raw==='number'?raw:NaN;
      if(Number.isFinite(price)&&price>=0)return {key,price};
    }
    return null;
  }
  function catalogFromLegacy(book,knownLines){
    const catalog=emptyPriceCatalog();
    Object.entries(book).sort(([a],[b])=>Number(/ \[[^\]]+\]$/.test(a))-Number(/ \[[^\]]+\]$/.test(b))).forEach(([key,amount])=>{
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0)return;
      const scoped=key.match(/^(.*) \[([^\]]+)\]$/),sourceName=scoped?scoped[1]:key;
      const matches=knownLines.filter(line=>!line.labor&&(line.name===sourceName||line.legacyName===sourceName)&&(!scoped||line.unit===priceUnit(scoped[2])));
      const identities=[...new Set(matches.map(line=>materialPriceId(line.name,line.unit)))];
      const rate=makeMaterialRate('general',amount,{updatedAt:null});
      if(scoped&&priceUnit(scoped[2]))upsertMaterialRate(catalog,identities.length===1?matches[0].name:scoped[1],priceUnit(scoped[2]),rate);
      else if(identities.length===1){const line=matches[0];upsertMaterialRate(catalog,line.name,line.unit,rate);}
      else catalog.pendingRates.push({name:cleanPriceName(key),rate});
    });
    return catalog;
  }
  function pricingEntry(line,providerId,rate=null,catalog=priceCatalog){
    return {materialId:materialPriceId(line.name,line.unit),providerId,providerName:providerName(providerId,catalog),price:rate?.price??null,updatedAt:rate?.updatedAt??null,reference:rate?.reference||''};
  }
  function pricingForLines(lines,pricing,catalog,{legacy=false,book=priceBook}={}){
    const next=clonePricing(pricing);
    if(!catalog.providers.some(p=>p.id===next.defaultProviderId))next.defaultProviderId='general';
    lines.filter(line=>!line.labor).forEach(line=>{
      const material=registerPriceMaterial(catalog,line.name,line.unit);
      if(next.entries.some(e=>e.materialId===material.id))return;
      const old=legacy?legacyLinePrice(line,book):null;
      const rate=legacy?(old?{price:old.price}:null):catalogMaterialRate(material.id,next.defaultProviderId,catalog);
      next.entries.push(pricingEntry(line,legacy?'general':next.defaultProviderId,rate,catalog));
    });
    return next;
  }
  function pricingStatus(message,isError=false){
    for(const id of ['catalogStatus','jobPriceStatus']){const node=el(id);if(node){node.textContent=message;node.setAttribute('role',isError?'alert':'status');}}
  }
  function commitPricing(catalog,pricing,{restoring=false}={}){
    if(pricingLoadError&&!restoring)throw Error(pricingLoadError);
    if(!validPriceCatalog(catalog)||!validJobPricing(pricing))throw Error('Datos de tarifas no válidos.');
    try{localStorage.setItem(PRICING_KEY,JSON.stringify({version:1,catalog,active:pricing}));}
    catch(err){throw Error('No se pudo guardar. Se conserva el último precio guardado. Descarga una copia y revisa el espacio del dispositivo.');}
    priceCatalog=catalog;jobPricing=pricing;pricingLoadError='';
  }
  function freezeJobPrices({legacy=false,book=priceBook}={}){
    const catalog=clonePricing(priceCatalog),pricing=pricingForLines(mergedLines(),jobPricing,catalog,{legacy,book});
    if(JSON.stringify(catalog)===JSON.stringify(priceCatalog)&&JSON.stringify(pricing)===JSON.stringify(jobPricing))return true;
    try{commitPricing(catalog,pricing);return true;}catch(err){pricingStatus(err.message,true);return false;}
  }
  function initializePricing(){
    try{
      const raw=localStorage.getItem(PRICING_KEY);
      if(raw){
        const stored=JSON.parse(raw);
        if(!plainObject(stored)||stored.version!==1||!validPriceCatalog(stored.catalog)||!validJobPricing(stored.active))throw Error('Formato de tarifas no válido');
        priceCatalog=stored.catalog;jobPricing=stored.active;freezeJobPrices();
      }else{
        priceCatalog=catalogFromLegacy(priceBook,mergedLines(work.concat(savedJobs.flatMap(j=>j.work))));
        jobPricing=pricingForLines(mergedLines(),emptyJobPricing(),priceCatalog,{legacy:true});
        if(work.length||Object.keys(priceBook).length){try{commitPricing(priceCatalog,jobPricing);}catch(err){pricingStatus(err.message,true);}}
      }
    }catch(err){pricingLoadError='No se pudieron cargar las tarifas. Los datos originales se conservan; restaura una copia válida antes de modificarlas.';pricingStatus(pricingLoadError,true);}
  }
  function saveBudgetMaterialPrice(line,text){
    const id=materialPriceId(line.name,line.unit),catalog=clonePricing(priceCatalog),pricing=clonePricing(jobPricing);
    const previous=pricing.entries.find(e=>e.materialId===id)||pricingEntry(line,pricing.defaultProviderId,null,catalog);
    let entry;
    if(String(text).trim()===''){entry=Object.assign({},previous,{price:null,updatedAt:null,reference:''});}
    else{
      if(!catalog.providers.some(p=>p.id===previous.providerId))throw Error('Selecciona un proveedor actual para guardar este precio.');
      const rate=makeMaterialRate(previous.providerId,text,{reference:previous.reference});
      upsertMaterialRate(catalog,line.name,line.unit,rate);entry=pricingEntry(line,previous.providerId,rate,catalog);
    }
    const index=pricing.entries.findIndex(e=>e.materialId===id);if(index<0)pricing.entries.push(entry);else pricing.entries[index]=entry;
    commitPricing(catalog,pricing);
    const scoped=line.name+' ['+line.unit+']';
    if(entry.price===null){delete priceBook[scoped];delete priceBook[line.key];}else priceBook[scoped]=entry.price;
    savePrices();return entry;
  }
  function selectBudgetProvider(line,providerId){
    if(!priceCatalog.providers.some(p=>p.id===providerId))throw Error('Proveedor no válido.');
    const pricing=clonePricing(jobPricing),entry=pricingEntry(line,providerId,catalogMaterialRate(materialPriceId(line.name,line.unit),providerId));
    const index=pricing.entries.findIndex(e=>e.materialId===entry.materialId);if(index<0)pricing.entries.push(entry);else pricing.entries[index]=entry;
    commitPricing(priceCatalog,pricing);return entry;
  }
  function proposeTariff(providerId){
    if(providerId!=='current'&&!priceCatalog.providers.some(p=>p.id===providerId))throw Error('Selecciona un proveedor válido.');
    const pricing=clonePricing(jobPricing),changes=[],unavailable=[];
    mergedLines().filter(line=>!line.labor).forEach(line=>{
      const id=materialPriceId(line.name,line.unit),target=providerId==='current'?(pricing.entries.find(e=>e.materialId===id)?.providerId||jobPricing.defaultProviderId):providerId;
      const rate=catalogMaterialRate(id,target);
      if(!rate){unavailable.push(line);return;}
      const index=pricing.entries.findIndex(e=>e.materialId===id),old=index>=0?pricing.entries[index]:pricingEntry(line,jobPricing.defaultProviderId);
      const entry=pricingEntry(line,target,rate);
      if(JSON.stringify(old)!==JSON.stringify(entry)){changes.push({line,old,entry});if(index<0)pricing.entries.push(entry);else pricing.entries[index]=entry;}
    });
    return {pricing,changes,unavailable};
  }
  function restorePricingBackup(backup,catalog,pricing){
    if(!validPriceCatalog(catalog)||!validJobPricing(pricing))throw Error('Datos de tarifas no válidos');
    const meta=normalizeJobMeta(backup.jobMeta),jobs=backup.savedJobs.map(j=>Object.assign({},j,{meta:normalizeJobMeta(j.meta)}));
    const values=[[PRICING_KEY,{version:1,catalog,active:pricing}],[WORK_KEY,backup.work],[PRICE_KEY,backup.priceBook],[JOB_KEY,meta],[CO_KEY,backup.company],[SNAP_KEY,jobs]];
    const previous=values.map(([key])=>[key,localStorage.getItem(key)]),written=[];
    try{for(const [key,value]of values){localStorage.setItem(key,JSON.stringify(value));written.push(key);}}
    catch(err){
      try{written.forEach(key=>localStorage.removeItem(key));for(const [key,value]of previous)if(written.includes(key)&&value!==null)localStorage.setItem(key,value);}
      catch(rollback){throw Error('La restauración falló y no pudo recuperar todo el almacenamiento anterior. Conserva la copia descargada antes de cerrar.');}
      throw Error('No hay espacio o acceso al almacenamiento. No se han sustituido los datos anteriores.');
    }
    priceCatalog=catalog;jobPricing=pricing;pricingLoadError='';work=backup.work;priceBook=backup.priceBook;jobMeta=meta;company=backup.company;savedJobs=jobs;editingPart=null;
  }
  function parseProviderTariff(text,providerId,catalog=priceCatalog){
    const rows=parseCsvRecords(text).filter(row=>row.some(cell=>cell.trim()!=='')),next=clonePricing(catalog);
    if(!next.providers.some(p=>p.id===providerId))throw Error('Selecciona el proveedor de importación.');
    if(!rows.length)throw Error('El archivo no contiene precios.');
    const field=value=>cleanPriceName(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const aliases={concepto:'material',nombre:'material',producto:'material',material:'material',unidad:'unidad',precio:'precio',proveedor:'proveedor',referencia:'referencia',fecha:'fecha',iva_incluido:'iva_incluido',iva:'iva'};
    const header=rows[0].map(v=>aliases[field(v)]||'');
    const hasHeader=header.includes('material')&&header.includes('precio');
    if(hasHeader&&(header.some(v=>!v)||new Set(header).size!==header.length))throw Error('Cabecera CSV no válida o columnas repetidas.');
    let imported=0,pending=0,omitted=0;const seen=new Set();
    rows.slice(hasHeader?1:0).forEach((cells,index)=>{
      try{
        const columns=hasHeader?header:cells.length===2?['material','precio']:cells.length===3?['material','unidad','precio']:[];
        if(!columns.length||cells.length!==columns.length)throw Error('Número de columnas no válido.');
        const values=Object.fromEntries(columns.map((key,i)=>[key,cells[i].trim()]));
        if(values.precio===''){omitted++;return;}
        const name=cleanPriceName(values.material);if(!name||name.length>500)throw Error('Nombre de material no válido.');
        const provider=values.proveedor?ensureProvider(next,values.proveedor):next.providers.find(p=>p.id===providerId);
        const inclusion=field(values.iva_incluido||'no');if(!['no','si','true','false','1','0'].includes(inclusion))throw Error('IVA incluido debe ser sí o no.');
        const included=['si','true','1'].includes(inclusion);
        const rate=makeMaterialRate(provider.id,values.precio,{included,vat:values.iva,reference:values.referencia||'',updatedAt:Object.hasOwn(values,'fecha')?(values.fecha?csvPriceDate(values.fecha):null):priceToday()});
        let unit='';
        if(values.unidad){unit=priceUnit(values.unidad);if(!unit)throw Error('Unidad no reconocida.');}
        else{const units=[...new Set(next.materials.filter(m=>m.name===name).map(m=>m.unit))];if(units.length===1)unit=units[0];}
        const duplicate=JSON.stringify([name,unit,provider.id]);if(seen.has(duplicate))throw Error('Precio duplicado para el mismo material, unidad y proveedor.');seen.add(duplicate);
        if(unit)upsertMaterialRate(next,name,unit,rate);
        else{
          const item={name,rate},at=next.pendingRates.findIndex(p=>p.name===name&&p.rate.providerId===provider.id);
          if(at<0)next.pendingRates.push(item);else next.pendingRates[at]=item;pending++;
        }
        imported++;
      }catch(err){throw Error('Fila '+(index+(hasHeader?2:1))+': '+err.message);}
    });
    if(!imported)throw Error('El archivo no contiene precios.');
    return {catalog:next,imported,pending,omitted};
  }
  initializePricing();

  const screens = $all('.screen');
  const nav = $all('[data-nav]');
  const data = window.CALC_DATA || {};
  let currentScreen='home';
  let budgetReturnMaterialId=null;
  const scrollPositions={};
  function show(id, fromHistory=false){
    if(!el(id))return;
    scrollPositions[currentScreen]=window.scrollY;
    if(id!==currentScreen&&!fromHistory)history.pushState({screen:id},'', '#'+id);
    currentScreen=id;
    screens.forEach(x => x.classList.toggle('active', x.id === id));
    nav.forEach(b => b.classList.toggle('active', b.dataset.nav === (id==='prices'?'help':['wall','lining','roof','wet','ceramic'].includes(id)?'home':id)));
    if(editingPart!==null&&id!==work[editingPart]?.editor?.screen)editingPart=null;
    if(id === 'work') renderWork();
    if(id === 'list') renderList();
    if(id === 'prices')renderPriceCatalog();
    if(id === 'wet'){ renderProducts(); calcWet(); }
    else if(id === 'wall' && !primed.wall){ calcWall(); primed.wall = 1; }
    else if(id === 'lining' && !primed.lining){ calcLining(); primed.lining = 1; }
    else if(id === 'roof' && !primed.roof){ calcRoof(); primed.roof = 1; }
    else if(id === 'ceramic' && !primed.ceramic){ recalcCeramic(); primed.ceramic = 1; }
    window.scrollTo(0, scrollPositions[id]||0);
    const shell = document.scrollingElement || document.documentElement;
    if(shell) shell.scrollTop = scrollPositions[id]||0;
    const app = document.querySelector('.app') || document.querySelector('.shell');
    if(app) app.scrollTop = 0;
    if(id==='list'&&budgetReturnMaterialId){
      const input=[...el('listContent')?.querySelectorAll('[data-price-key]')||[]].find(node=>decodeURIComponent(node.dataset.materialId)===budgetReturnMaterialId);
      budgetReturnMaterialId=null;if(input){setBudgetView(false);focusInput(input);}
    }
  }
  // Navegación directa: la app abre en Inicio, sin clave ni código postal.
  history.replaceState({screen:'home'},'', '#home');
  window.addEventListener('popstate',e=>show(e.state?.screen||'home',true));
  show('home');
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
    return ['Tornillos metal-metal 3,5 × 9,5', mm.n + ' uds · ' + mm.boxes + ' caja(s) de 500', 'Estimación orientativa pendiente de verificar con el sistema · ' + src + ' · +10% merma · caja 500 ud'];
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
    return ['Lana mineral ' + thickMm + ' mm', need.toFixed(1) + ' m² · ' + uds + ' panel(es) 1200 × 600', 'Estimación orientativa · ' + where + ' · 1 m²/m² · merma corte 8 % · panel 0,72 m² · UNE-EN 13162'];
  }
  function tacoRow(lengthM, runs, kind){
    const n = Math.max(0, runs) * (Math.ceil(Math.max(0, lengthM) / 0.6) + 1);
    const detail = kind === 'omega'
      ? 'Estimación de fijaciones pendiente de contraste · anclaje de omega al paramento · ala del perfil · paso máx. 600 mm · primer y último cerca del extremo'
      : 'Estimación de fijaciones pendiente de contraste · anclaje de canales al soporte · paso máx. 600 mm · primer y último cerca del extremo';
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
    return {n:n, firstNeed:Math.ceil(A*firstRate*waste), firstType:'3,5 × '+firstLen, secondNeed:Math.ceil(A*secondRate*waste), secondType:n>=2?('3,5 × '+secondLen):'', tapeInner:inner*A*1.6*waste, tapeVisible:visible*A*1.6*waste, pasteInner:inner*A*0.20*waste, pasteVisible:visible*A*0.40*waste};
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
    if(w.firstNeed) rows.push([w.hasSecond ? 'Tornillos 1.ª placa ' + w.firstType : 'Tornillos placa-metal ' + w.firstType, w.firstNeed + ' uds · ' + screwBoxes(w.firstNeed) + ' caja(s) de 1.000', w.hasSecond ? 'Estimación orientativa · capa interior · ≈8 ud/m²·cara · paso amplio · +10% merma · UNE-EN 14566' : 'Estimación orientativa · cara vista · 15 ud/m² · paso orientativo de pared 250 mm; comprobar el sistema y el uso en techo · largo = espesor + 10 mm · +10% merma']);
    if(w.hasSecond && w.secondNeed) rows.push(['Tornillos 2.ª placa ' + w.secondType, w.secondNeed + ' uds · ' + screwBoxes(w.secondNeed) + ' caja(s) de 1.000', 'Estimación orientativa · cara vista · 15 ud/m² · paso orientativo de pared 250 mm; comprobar el sistema y el uso en techo · largo = 2 placas + 10 mm · UNE-EN 14566 · +10% merma']);
    if(w.hasInner && w.tapeInner) rows.push(['Cinta de papel 1.ª capa', w.tapeInner.toFixed(2) + ' m · ' + Math.ceil(w.tapeInner / 150) + ' rollo(s) de 150 m', 'Estimación orientativa · juntas de todas las capas · 1,6 m/m² · UNE-EN 13963']);
    if(w.hasInner && w.pasteInner) rows.push(['Pasta de juntas 1.ª capa', w.pasteInner.toFixed(2) + ' kg · ' + Math.ceil(w.pasteInner / 20) + ' saco(s) de 20 kg', 'Estimación orientativa · acabado Q1 interior · ≈0,20 kg/m² · UNE-EN 13963']);
    if(w.hasVisible && w.tapeVisible) rows.push(['Cinta de papel cara vista', w.tapeVisible.toFixed(2) + ' m · ' + Math.ceil(w.tapeVisible / 150) + ' rollo(s) de 150 m', 'Estimación orientativa · junta de última placa · 1,6 m/m² · +10% merma · UNE-EN 13963']);
    if(w.hasVisible && w.pasteVisible) rows.push(['Pasta de juntas cara vista', w.pasteVisible.toFixed(2) + ' kg · ' + Math.ceil(w.pasteVisible / 20) + ' saco(s) de 20 kg', 'Estimación orientativa · acabado Q2 · juntas + cabezas · ≈0,40 kg/m² · +10% merma']);
    return rows;
  }
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
    recalcCeramic();
  }));
  $all('[data-cer-tab]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault(); e.stopPropagation();
    setCeramicTab(btn.dataset.cerTab);
  }));

  $all('[data-mount]').forEach(button=>on(button,'click',()=>{
    const panel=el(button.dataset.mount);if(!panel)return;
    panel.hidden=!panel.hidden;
    button.setAttribute('aria-expanded',String(!panel.hidden));
    const name={wallSketch:'Tabique',liningSketch:'Trasdosado',roofSketch:'Techo'}[panel.id];
    button.textContent=(panel.hidden?'Ver montaje · ':'Ocultar montaje · ')+name;
  }));

  // Ayuda y desplegables: control directo para evitar fallos de <details> en Android/WebView.
  $all('.helpAcc > summary, .moreBox > summary').forEach(summary => on(summary, 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    const details=summary.parentElement;
    if(!details || details.tagName!=='DETAILS') return;
    details.open=!details.open;
    summary.setAttribute('aria-expanded',String(details.open));
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
      recalcCeramic();
      return;
    }
    const tab = e.target.closest('[data-cer-tab]');
    if(tab && tab.dataset.cerTab){
      setCeramicTab(tab.dataset.cerTab);
    }
  });


