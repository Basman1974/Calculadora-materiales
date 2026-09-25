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
  function renderSavedJobs(){
    const c = el('savedJobs');
    if(!c) return;
    if(!savedJobs.length){ c.innerHTML = '<div class="empty">Sin copias guardadas.</div>'; return; }
    c.innerHTML = '<div class="groupHead" style="margin:-13px -13px 8px;border-radius:17px 17px 0 0">COPIAS EN ESTE DISPOSITIVO</div>' + savedJobs.map((j,i) => '<div class="savedJob"><div><b>' + esc(j.meta && j.meta.num || 'Copia') + '</b><div class="small">' + esc((j.meta && j.meta.name) || 'Sin nombre') + ' · ' + esc((j.meta && j.meta.client) || '') + '</div></div><div><button class="btn" data-load-job="' + i + '" type="button">Abrir</button> <button class="btn" data-del-job="' + i + '" type="button">Borrar</button></div></div>').join('');
    c.querySelectorAll('[data-load-job]').forEach(b => b.onclick = () => {
      const j = savedJobs[Number(b.dataset.loadJob)];
      if(!j) return;
      work = JSON.parse(JSON.stringify(j.work || []));
      jobMeta = Object.assign({}, jobMeta, j.meta || {});
      saveWork(); persist(JOB_KEY, jobMeta); fillJobFields(); renderWork(); renderList();
    });
    c.querySelectorAll('[data-del-job]').forEach(b => b.onclick = () => {
      savedJobs.splice(Number(b.dataset.delJob), 1);
      persist(SNAP_KEY, savedJobs);
      renderSavedJobs();
    });
  }
  function renderWork(){
    fillJobFields();
    renderSavedJobs();
    const c = el('workContent');
    if(!c) return;
    c.innerHTML = work.length ? work.map((x,i) => '<div class="workItem"><b>' + (i + 1) + '. ' + esc(x.title) + '</b><div class="small">' + (x.items||[]).length + ' líneas</div><button class="btn" data-del="' + i + '" style="margin-top:8px">Eliminar</button></div>').join('') : '<div class="empty">Todavía no has añadido partidas.</div>';
    c.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { work.splice(Number(b.dataset.del), 1); saveWork(); renderWork(); renderList(); });
  }
  function renderList(){
    fillJobFields();
    readJobFields();
    const c = el('listContent');
    if(!c) return;
    if(!work.length){ c.innerHTML = '<div class="empty">Añade partidas para generar el presupuesto.</div>'; return; }
    const tot = budgetTotals();
    const co = company.name || 'Tu empresa';
    const head = '<div class="quoteHead"><div><div class="quoteBrand">' + esc(co) + '</div><div class="small">' + esc([company.nif, company.phone, company.mail].filter(Boolean).join(' · ')) + '</div><div class="small">' + esc(company.addr||'') + '</div></div><div class="quoteMeta"><div><b>' + esc(jobMeta.num || 'Presupuesto') + '</b></div><div>' + esc(jobMeta.name || 'Obra sin nombre') + '</div><div>' + esc(jobMeta.client ? ('Cliente: ' + jobMeta.client) : '') + '</div><div>' + esc(jobMeta.addr||'') + '</div><div>CP ' + esc(postalState.code||'') + (postalState.store ? ' · ' + esc(postalState.store) : '') + '</div></div></div>';
    const parts = '<div class="groupHead">PARTIDAS</div>' + work.map((x,i) => '<div class="listLine"><span>' + (i+1) + '. ' + esc(x.title) + '</span><strong>' + (x.items||[]).length + '</strong></div>').join('');
    const table = '<div class="groupHead">MATERIALES Y PRECIOS</div><div class="budgetHead"><span>Concepto</span><span>Ud</span><span>€/ud</span><span>Importe</span></div>' +
      tot.rows.map(r => '<div class="budgetLine"><div>' + esc(r.name) + '<div class="rowDetail">' + esc((r.qty ? (String(r.qty).replace('.',',') + ' ' + r.unit) : '') + (r.detail ? ' · ' + r.detail : '')) + '</div></div><div class="money">' + esc(r.labor ? '—' : (String(r.qty).replace('.',',') + ' ' + r.unit)) + '</div><div>' + (r.labor ? '<span class="money">' + money(r.total) + '</span>' : '<input class="price" data-price-key="' + esc(r.name) + '" inputmode="decimal" value="' + (r.unitPrice||'') + '">') + '</div><div class="budgetAmt">' + money(r.total) + ' €</div></div>').join('');
    const sums = '<div class="budgetTot"><span>Materiales</span><span>' + money(tot.mat) + ' €</span></div>' +
      '<div class="budgetTot"><span>Mano de obra</span><span>' + money(tot.labor) + ' €</span></div>' +
      (tot.extra ? '<div class="budgetTot"><span>Desplazamiento / varios</span><span>' + money(tot.extra) + ' €</span></div>' : '') +
      (tot.disc ? '<div class="budgetTot"><span>Descuento ' + tot.discPct + ' %</span><span>− ' + money(tot.disc) + ' €</span></div>' : '') +
      '<div class="budgetTot"><span>Base imponible</span><span>' + money(tot.taxable) + ' €</span></div>' +
      '<div class="budgetTot"><span>IVA ' + tot.vatPct + ' %</span><span>' + money(tot.vat) + ' €</span></div>' +
      '<div class="budgetTot grand"><span>TOTAL</span><span>' + money(tot.grand) + ' €</span></div>';
    const notes = jobMeta.notes ? '<div class="info">' + esc(jobMeta.notes) + '</div>' : '';
    const valid = jobMeta.valid ? '<div class="small" style="margin-top:8px">Validez: ' + esc(jobMeta.valid) + ' días. Cantidades orientativas UNE 102043. Precios introducidos por el usuario.</div>' : '';
    c.innerHTML = head + parts + table + sums + notes + valid;
    c.querySelectorAll('[data-price-key]').forEach(inp => {
      inp.onchange = inp.onblur = () => {
        const key = inp.dataset.priceKey;
        const v = Number(String(inp.value).replace(',','.'));
        if(isFinite(v) && v >= 0) priceBook[key] = v; else delete priceBook[key];
        savePrices(); renderList();
      };
    });
  }
  function budgetText(){
    readJobFields();
    const tot = budgetTotals();
    const lines = [];
    lines.push((company.name || 'Presupuesto') + (jobMeta.num ? ' · ' + jobMeta.num : ''));
    if(jobMeta.name) lines.push('Obra: ' + jobMeta.name);
    if(jobMeta.client) lines.push('Cliente: ' + jobMeta.client);
    if(jobMeta.addr) lines.push('Dirección: ' + jobMeta.addr);
    lines.push('');
    work.forEach((x,i) => lines.push((i+1) + '. ' + x.title));
    lines.push('');
    tot.rows.forEach(r => lines.push(r.name + ' · ' + (r.labor ? money(r.total)+' €' : (String(r.qty).replace('.',',') + ' ' + r.unit + ' × ' + money(r.unitPrice) + ' = ' + money(r.total) + ' €'))));
    lines.push('');
    lines.push('Materiales: ' + money(tot.mat) + ' €');
    lines.push('Mano de obra: ' + money(tot.labor) + ' €');
    if(tot.extra) lines.push('Varios: ' + money(tot.extra) + ' €');
    if(tot.disc) lines.push('Descuento: −' + money(tot.disc) + ' €');
    lines.push('Base: ' + money(tot.taxable) + ' €');
    lines.push('IVA ' + tot.vatPct + '%: ' + money(tot.vat) + ' €');
    lines.push('TOTAL: ' + money(tot.grand) + ' €');
    if(jobMeta.notes){ lines.push(''); lines.push(jobMeta.notes); }
    lines.push('');
    lines.push('Estimación UNE 102043. Precios introducidos por el usuario. No es tarifa OBRAMAT.');
    return lines.join('\n');
  }
  function exportPrint(){
    readJobFields(); saveJob();
    const tot = budgetTotals();
    const w = window.open('', '_blank');
    if(!w){ window.print(); return; }
    const rows = tot.rows.map(r => '<tr><td>' + esc(r.name) + '</td><td style="text-align:right">' + (r.labor ? '—' : esc(String(r.qty).replace('.',',') + ' ' + r.unit)) + '</td><td style="text-align:right">' + (r.labor ? '—' : money(r.unitPrice)) + '</td><td style="text-align:right">' + money(r.total) + ' €</td></tr>').join('');
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(jobMeta.num || 'Presupuesto') + '</title><style>body{font:14px/1.4 system-ui,Segoe UI,Arial;margin:24px;color:#111}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ccc;padding:6px 4px;text-align:left;vertical-align:top}th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#555}.tot{margin-top:14px}.tot div{display:flex;justify-content:space-between;padding:3px 0}.grand{font-weight:800;font-size:18px;border-top:2px solid #111;margin-top:8px;padding-top:8px}.muted{color:#555;font-size:12px}header{display:flex;justify-content:space-between;gap:16px;margin-bottom:18px}@media print{button{display:none}}</style></head><body>');
    w.document.write('<header><div><h1>' + esc(company.name || 'Presupuesto de obra') + '</h1><div class="muted">' + esc([company.nif,company.phone,company.mail,company.addr].filter(Boolean).join(' · ')) + '</div></div><div class="muted"><b>' + esc(jobMeta.num||'') + '</b><br>' + esc(jobMeta.name||'') + '<br>' + esc(jobMeta.client?('Cliente: '+jobMeta.client):'') + '<br>' + esc(jobMeta.addr||'') + '<br>' + esc(new Date().toLocaleDateString('es-ES')) + '</div></header>');
    w.document.write('<p class="muted">Partidas: ' + work.map(x => esc(x.title)).join(' · ') + '</p>');
    w.document.write('<table><thead><tr><th>Concepto</th><th style="text-align:right">Cant.</th><th style="text-align:right">€/ud</th><th style="text-align:right">Importe</th></tr></thead><tbody>' + rows + '</tbody></table>');
    w.document.write('<div class="tot"><div><span>Materiales</span><span>' + money(tot.mat) + ' €</span></div><div><span>Mano de obra</span><span>' + money(tot.labor) + ' €</span></div>' + (tot.extra?('<div><span>Varios</span><span>' + money(tot.extra) + ' €</span></div>'):'') + (tot.disc?('<div><span>Descuento</span><span>− ' + money(tot.disc) + ' €</span></div>'):'') + '<div><span>Base imponible</span><span>' + money(tot.taxable) + ' €</span></div><div><span>IVA ' + tot.vatPct + ' %</span><span>' + money(tot.vat) + ' €</span></div><div class="grand"><span>TOTAL</span><span>' + money(tot.grand) + ' €</span></div></div>');
    if(jobMeta.notes) w.document.write('<p>' + esc(jobMeta.notes).replace(/\n/g,'<br>') + '</p>');
    w.document.write('<p class="muted">Validez ' + esc(jobMeta.valid||'30') + ' días. Estimación de cantidades UNE 102043. Los precios los introduce el usuario. No es tarifa OBRAMAT ni sustituye medición de proyecto.</p>');
    w.document.write('<button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>');
    w.document.close();
    setTimeout(function(){ try { w.focus(); w.print(); } catch(e){} }, 250);
  }
  function exportCsv(){
    readJobFields();
    const tot = budgetTotals();
    const lines = [['Presupuesto', jobMeta.num||'', jobMeta.name||'', jobMeta.client||''],['Concepto','Cantidad','Unidad','Precio ud','Importe']];
    tot.rows.forEach(r => lines.push([r.name, String(r.qty).replace('.',','), r.unit, money(r.unitPrice), money(r.total)]));
    lines.push([]);
    lines.push(['Materiales','','','',money(tot.mat)]);
    lines.push(['Mano de obra','','','',money(tot.labor)]);
    lines.push(['Base','','','',money(tot.taxable)]);
    lines.push(['IVA ' + tot.vatPct + '%','','','',money(tot.vat)]);
    lines.push(['TOTAL','','','',money(tot.grand)]);
    const csv = lines.map(row => row.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\r\n');
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (jobMeta.num || 'presupuesto') + '.csv';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
  }
  function exportWa(){
    const txt = budgetText();
    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }
  function newJob(){
    saveJob();
    work = [];
    jobMeta.name = ''; jobMeta.client = ''; jobMeta.addr = ''; jobMeta.notes = ''; jobMeta.laborExtra = 0; jobMeta.extra = 0; jobMeta.disc = 0;
    jobMeta.num = nextQuoteNum();
    if(el('jobName')) el('jobName').value = '';
    if(el('jobClient')) el('jobClient').value = '';
    if(el('jobAddr')) el('jobAddr').value = '';
    if(el('jobNotes')) el('jobNotes').value = '';
    if(el('jobLaborExtra')) el('jobLaborExtra').value = '0';
    if(el('jobExtra')) el('jobExtra').value = '0';
    if(el('jobDisc')) el('jobDisc').value = '0';
    if(el('jobNum')) el('jobNum').value = jobMeta.num;
    saveWork(); persist(JOB_KEY, jobMeta); renderWork(); renderList();
  }
  function saveSnap(){
    readJobFields();
    savedJobs.unshift({at:Date.now(), meta:Object.assign({}, jobMeta), work:JSON.parse(JSON.stringify(work))});
    if(savedJobs.length > 20) savedJobs = savedJobs.slice(0,20);
    persist(SNAP_KEY, savedJobs); persist(JOB_KEY, jobMeta); persist(CO_KEY, company);
    renderSavedJobs();
  }
  on(el('exportPrint'), 'click', exportPrint);
  on(el('exportCsv'), 'click', exportCsv);
  on(el('exportWa'), 'click', exportWa);
  on(el('jobNew'), 'click', newJob);
  on(el('jobSaveSnap'), 'click', saveSnap);
  ['jobName','jobClient','jobAddr','jobVat','jobDisc','jobLaborExtra','jobExtra','jobValid','jobNotes','jobNum','coName','coNif','coPhone','coMail','coAddr'].forEach(id => {
    on(el(id), 'change', () => { saveJob(); if(id==='jobVat'||id==='jobDisc'||id==='jobLaborExtra'||id==='jobExtra') renderList(); });
    on(el(id), 'blur', saveJob);
  });
  fillJobFields();
})();
