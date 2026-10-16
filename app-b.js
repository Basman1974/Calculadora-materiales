  function calcWet(){
    syncWet();
    const name = el('wetProduct') ? el('wetProduct').value : '';
    const it = data[currentCat] && data[currentCat][name];
    if(!it){
      updateWetOverview(false);
      const box = el('wetResult');
      if(box) box.innerHTML = resultHTML('Obra húmeda', currentCat, [['Aviso', 'Elige un producto', 'No hay ficha cargada para esta categoría']]);
      return;
    }
    const rules=[['wetWaste'],...(['ladrillos','bloques'].includes(currentCat)?[['wetMortarWaste']]:[]),...(el('wetMeasureMode').value==='direct'?[['wetArea',0.000001]]:[['wetL',0.000001],['wetH',0.000001]])];
    if(currentCat==='ladrillos')rules.push(['wetBrickL',0.000001],['wetBrickH',0.000001],['wetBrickT',0.000001],['wetJoint'],...(el('wetMortar').value==='predosificado'?[['wetMortarYield',0.000001]]:[]));
    if(currentCat==='bloques')rules.push(['wetBlockMortar']);
    if(currentCat==='revestimientos')rules.push(['wetThickness',0.000001]);
    if(currentCat==='puentes'&&it.k==='kg_range')rules.push(['wetConsumption',0.000001],...(it.perCoat?[['wetCoats',1,true]]:[]));
    const thickness=num('wetThickness');
    const error=currentCat==='revestimientos'&&((it.min&&thickness<it.min)||thickness>it.max)?'Espesor fuera del intervalo del producto: '+(it.min||'mínimo pendiente de verificar')+'–'+it.max+' mm.':'';
    const valid=validCalculation('wetResult',rules,error,'wetThickness');updateWetOverview(valid);if(!valid)return;
    const A = wetArea(), w = num('wetWaste'), f = 1 + w / 100, rows = [];
    if(currentCat === 'ladrillos'){
      const L=Math.max(1,num('wetBrickL')), H=Math.max(1,num('wetBrickH')), T=Math.max(1,num('wetBrickT')), jointMm=Math.max(0,num('wetJoint'));
      const j=jointMm/10;
      const unitsM2=10000/((L+j)*(H+j));
      const base=unitsM2*A, uds=Math.ceil(base*f);
      const wallVolM3=(T/100)*A;
      const unitVolM3=(L/100)*(H/100)*(T/100);
      const mortarM3=Math.max(0,wallVolM3-(base*unitVolM3));
      const mortarL=mortarM3*1000*(1+num('wetMortarWaste')/100);
      rows.push(['Ladrillo cerámico '+name+' · '+L+'×'+H+'×'+T+' cm',uds+' uds',unitsM2.toFixed(2)+' ud/m² · formato '+L.toString().replace('.',',')+' × '+H.toString().replace('.',',')+' × '+T.toString().replace('.',',')+' cm · junta '+jointMm.toFixed(0)+' mm · merma '+w+' %']);
      rows.push(['Volumen geométrico de mortero',mortarL.toFixed(1)+' L', 'Volumen geométrico de tendeles y llagas para '+A.toFixed(2)+' m² · antes de merma '+(mortarM3*1000).toFixed(1)+' L']);
      if(el('wetMortar') && el('wetMortar').value === 'predosificado'){
        const yieldL=num('wetMortarYield');
        rows.push(['Mortero predosificado',Math.ceil(mortarL/yieldL)+' sacos de 25 kg',mortarL.toFixed(1)+' L necesarios · rendimiento configurado '+yieldL.toFixed(1)+' L/saco · merma de mortero '+num('wetMortarWaste')+' %']);
      }else{
        rows.push(['Mortero hecho en obra',mortarL.toFixed(1)+' L','Volumen fresco estimado; merma de mortero '+num('wetMortarWaste')+' %; la dosificación cemento/arena se define aparte']);
      }
    } else if(currentCat === 'bloques'){
      const base = it.u * A, uds = Math.ceil(base * f), kg = uds * it.w;
      rows.push([name, uds + ' uds', it.u + ' ud/m² base · ' + Math.ceil(base) + ' uds sin merma · +' + w + '% merma · ' + kg.toFixed(2) + ' kg']);
      if(num('wetBlockMortar')){
        const mk = num('wetBlockMortar') * A * (1+num('wetMortarWaste')/100);
        if(el('wetMortar') && el('wetMortar').value === 'predosificado') rows.push(['Mortero', Math.ceil(mk / 25) + ' sacos de 25 kg', mk.toFixed(2) + ' kg · consumo configurado '+num('wetBlockMortar')+' kg/m²; referencia orientativa pendiente de documentar']);
        else rows.push(['Mortero hecho en obra', mk.toFixed(2) + ' kg', 'Dosificación a verificar en obra']);
      }
    } else if(currentCat === 'revestimientos'){
      const th = Math.max(1, num('wetThickness')), kg = it.kg * th * A * f;
      rows.push([name, Math.ceil(kg / 25) + ' sacos', kg.toFixed(2) + ' kg · espesor ' + th + ' mm · merma ' + w + ' %']);
      if(it.maxLayer&&th>it.maxLayer)rows.push(['Aviso de capas','Aplicar en varias capas','Máximo '+it.maxLayer+' mm por capa. Verificar preparación, espesores mínimos y acabado.']);
    } else {
      if(it.k === 'level_primer'){
        const s = el('wetSupport') ? el('wetSupport').value : 'poroso';
        const c = s === 'sin_absorcion' ? .075 : s === 'poco_poroso' ? .06 : .11;
        const total = A * c * f;
        rows.push([name, Math.ceil(total / 5) + ' botes de 5 L', total.toFixed(2) + ' L de concentrado · estimación con 0,15 L/m²/capa de producto diluido · rango documentado 0,10–0,20 · '+(s==='poroso'?'dos capas: 1:2 y 1:1,5':s==='poco_poroso'?'una capa 1:1,5':'una capa 1:1')]);
      } else if(it.k === 'kg_range'){
        const c=num('wetConsumption'),coats=it.perCoat?num('wetCoats'):1,kg=A*c*coats*f;
        const detail=kg.toFixed(2)+' kg · consumo configurado '+c.toFixed(3)+' kg/m²'+(it.perCoat?'/capa × '+coats+' capas':'')+' · referencia '+it.min.toFixed(3)+'–'+it.max.toFixed(3)+' kg/m²'+(it.perCoat?'/capa':'')+' · merma '+w+' %';
        if(it.packL){
          const litres=kg/it.densityMin;
          rows.push([name+' · envase '+it.packL+' L',Math.ceil(litres/it.packL)+' botes de '+it.packL+' L',detail+' · volumen conservador con densidad mínima documentada '+it.densityMin+' kg/L (intervalo '+it.densityMin+'–'+it.densityMax+')']);
        }else{
          rows.push([name+' · envase '+it.packKg+' kg',Math.ceil(kg/it.packKg)+' envase(s) de '+it.packKg+' kg',detail]);
        }
      } else if(it.k === 'rango_kilos'){
        const c = (it.min + it.max) / 2, kg = A * c * f, L = kg / it.d;
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
  on(el('wetForm'), 'submit', e => submitProgressiveCalculation(e,'wetForm','wetResult',calcWet));
  ['wetProduct','wetMeasureMode','wetThickness','wetSupport','wetMortar','wetWaste'].forEach(id => on(el(id), 'change', calcWet));
  ['wetArea','wetL','wetH','wetThickness','wetBrickL','wetBrickH','wetBrickT','wetJoint','wetMortarYield','wetConsumption','wetCoats','wetBlockMortar','wetMortarWaste'].forEach(id => on(el(id), 'input', calcWet));
  function ceramicBodyLabel(k){ return {porcelanico:'Porcelánico',pasta_roja:'Pasta roja',pasta_blanca:'Pasta blanca'}[k] || 'Porcelánico'; }
  function ceramicGlueKgM2(side, body, bond, trowel){
    const t=Math.max(6, Number(trowel)||10);
    let simple = t<=6 ? 2.5 : t<=8 ? 3.2 : t<=10 ? 4.0 : 4.8;
    if(side>60) simple += 0.4;
    if(body==='porcelanico') simple += 0.2;
    return bond==='doble' ? simple+1.8 : simple;
  }
  function groutKgM2(aCm,bCm,thickMm,jointMm,density){
    const A=aCm*10,B=bCm*10,T=thickMm,J=jointMm,D=Number(density);
    if(![A,B,T,J,D].every(value=>Number.isFinite(value)&&value>0))return 0;
    return ((A+B)/(A*B))*T*J*D;
  }
  function patternWaste(pattern, manual){
    const base={recto:5,tercio:8,mitad:10,diagonal:15}[pattern]||5;
    return manual===undefined||manual===null||manual===''?base:finiteAmount(manual);
  }
  function ceramicAdhesiveMode(){return el('adhForm')&&!el('adhForm').classList.contains('hidden');}
  function recalcCeramic(){if(ceramicAdhesiveMode())adhesiveClass();else calcLevel();}
  function setCeramicTab(tab){
    const level=tab!=='adhesive';
    $all('[data-cer-tab]').forEach(button=>{button.classList.toggle('active',(button.dataset.cerTab==='level')===level);button.setAttribute('aria-pressed',String((button.dataset.cerTab==='level')===level));});
    el('levelForm')?.classList.remove('hidden');
    for(const id of ['ceramicFormatFields','ceramicJointOptions','ceramicBatchOptions','levelActionBar','levelResult'])el(id)?.classList.toggle('hidden',!level);
    el('adhForm')?.classList.toggle('hidden',level);el('adhResult')?.classList.toggle('hidden',level);
    recalcCeramic();
  }
  function updateCeramicOverview(valid,adhesive=false){
    const area=num('cArea'),working=Math.min(area,num('cBatchArea'));
    const surface=adhesive&&area===0?'Consumo por m²':inputNumberText('cArea')+' m²';
    setOverview('ceramicMeasureSummary',valid?surface+(adhesive?' · lado mayor '+inputNumberText('aSize')+' cm':' · formato '+inputNumberText('cA')+' × '+inputNumberText('cB')+' cm'):'Revisa los datos señalados antes de calcular.');
    setOverview('ceramicSystemSummary',ceramicBodyLabel(currentCerBody)+' · '+surface+' · '+selectText('cBond')+' · llana '+inputNumberText('cTrowel')+' mm'+(adhesive?' · lado mayor '+inputNumberText('aSize')+' cm · '+selectText('aZone')+' · '+selectText('aPlace')+' · soporte '+selectText('aSupport'):' · junta '+inputNumberText('cJoint')+' mm · espesor '+inputNumberText('cThickness')+' mm · patrón '+selectText('cPattern')+' · merma '+inputNumberText('cWaste')+' %'));
    setOverview('ceramicJointSummary','Junta '+inputNumberText('cJoint')+' mm · espesor '+inputNumberText('cThickness')+' mm · '+selectText('cPattern')+' · merma '+inputNumberText('cWaste')+' %');
    setOverview('ceramicBatchSummary',inputNumberText('cBatchArea')+' m² solicitados · '+money(working)+' m² simultáneos'+(num('cBatchArea')>area?' (limitados a la superficie total)':''));
    setOverview('ceramicTechnicalNotice',adhesive?'La clasificación y el consumo de adhesivo son orientativos. Confirma compatibilidad, rendimiento y condiciones en la ficha técnica.':'Los consumos de adhesivo y juntas y los clips son orientativos. Las cuñas se calculan para la superficie simultánea y se reutilizan.');
  }
  function calcLevel(){
    const valid=validCalculation('levelResult',[['cA',0.000001],['cB',0.000001],['cArea',0.000001],['cThickness',0.000001],['cJoint',0.000001],['cBatchArea',0.000001],['cWaste']]);updateCeramicOverview(valid);if(!valid)return;
    const A=num('cA'),B=num('cB'),area=num('cArea'),body=currentCerBody;
    const pattern=(el('cPattern')&&el('cPattern').value)||'recto';
    const w=patternWaste(pattern,num('cWaste'));
    const thick=num('cThickness'),joint=num('cJoint'),trowel=num('cTrowel')||10;
    if(el('aSize')) el('aSize').value=Math.max(A,B);
    const tileAreaM2=(A*B)/10000,tilesBase=tileAreaM2>0?area/tileAreaM2:0,tiles=Math.ceil(tilesBase*(1+w/100)),tilesM2=tileAreaM2>0?1/tileAreaM2:0;
    const side=Math.max(A,B);
    const edgesPerTile=(A>=60||B>=60)?4:2;
    const clipsM2=Math.max(4,Math.ceil(tilesM2*edgesPerTile)),total=Math.ceil(clipsM2*area*(1+w/100));
    const requestedBatch=num('cBatchArea'),workingArea=Math.min(area,requestedBatch),wedges=Math.min(total,Math.ceil(clipsM2*workingArea));
    const bond=(el('cBond')&&el('cBond').value)||'doble',bondLabel=bond==='doble'?'Doble encolado':'Encolado simple';
    const glueKgM2=ceramicGlueKgM2(side,body,bond,trowel),glueKg=glueKgM2*area*(1+w/100);
    const groutRate=groutKgM2(A,B,thick,joint,1.6),groutKg=groutRate*area*1.10;
    const rows=[
      ['Tipo de baldosa',ceramicBodyLabel(body),body==='porcelanico'?'UNE-EN 14411 · baja absorción · verificar adhesivo compatible':'UNE-EN 14411 · verificar grupo y absorción de la baldosa'],
      ['Baldosas / piezas',tiles+' uds',tilesM2.toFixed(2)+' ud/m² · formato '+A+' × '+B+' cm · patrón '+pattern+' · merma aplicada '+w+' %'],
      ['Calzos de nivelación',total+' uds',clipsM2+' calzos/m² · estimación geométrica según formato; verificar sistema de nivelación elegido'],
      ['Cuñas reutilizables',wedges+' uds','Dotación operativa para '+workingArea.toFixed(1)+' m² simultáneos · '+clipsM2+' cuñas/m² · se recuperan tras el fraguado y se reutilizan en la siguiente tanda'],
      ['Encolado',bondLabel,'Llana '+trowel+' mm · consumo estimado '+glueKgM2.toFixed(1)+' kg/m² · verificar ficha del adhesivo'],
      ['Cemento cola',Math.ceil(glueKg/25)+' saco(s) de 25 kg',glueKg.toFixed(1)+' kg · llana '+trowel+' mm · '+bondLabel+' · UNE-EN 12004'],
      ['Mortero de juntas',Math.ceil(groutKg/5)+' saco(s) de 5 kg',groutKg.toFixed(1)+' kg · '+groutRate.toFixed(3)+' kg/m² × 1,10 · fórmula geométrica: formato '+A+'×'+B+' cm · espesor '+thick+' mm · junta '+joint+' mm · coeficiente orientativo 1,6; ajustar según ficha del mortero']
    ];
    const obj={title:ceramicBodyLabel(body)+' · '+area.toFixed(2)+' m²',items:rows};
    const box=el('levelResult');
    if(box){box.innerHTML=resultHTML(obj.title,'UNE-EN 14411/12004 · '+A+' × '+B+' cm · patrón '+pattern+' · merma '+w+' %',rows);bindAdd(box,obj);}
  }
  on(el('levelForm'),'submit',e=>submitProgressiveCalculation(e,ceramicAdhesiveMode()?'adhForm':'levelForm',ceramicAdhesiveMode()?'adhResult':'levelResult',recalcCeramic));
  ['cBond','cPattern','cWaste','cTrowel'].forEach(id=>on(el(id),'change',recalcCeramic));
  ['cA','cB','cArea','cBatchArea','cThickness','cJoint'].forEach(id=>on(el(id),'input',recalcCeramic));
    function adhesiveClass(){
    const valid=validCalculation('adhResult',[['aSize',0.000001],['cArea'],['cTrowel',0.000001]]);updateCeramicOverview(valid,true);if(!valid)return;
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
    const area = num('cArea'), bond = (el('cBond') && el('cBond').value) || 'doble', trowel=num('cTrowel')||10, glueKgM2 = ceramicGlueKgM2(size, body, bond, trowel), bondLabel = bond === 'doble' ? 'Doble encolado' : 'Encolado simple';
    const rows = [
      ['Tipo de baldosa', ceramicBodyLabel(body), 'UNE-EN 14411 · influye en la clase mínima'],
      ['Clasificación orientativa', cls, 'UNE-EN 12004 · ' + (meanings[cls] || 'Consultar ficha')],
      ['Encolado', bondLabel, 'Llana '+trowel+' mm · consumo orientativo según configuración'],
      ['Consumo técnico', area ? ((glueKgM2 * area).toFixed(1) + ' kg · ' + Math.ceil(glueKgM2 * area / 25) + ' saco(s) 25 kg') : glueKgM2 + ' kg/m²', glueKgM2.toFixed(1) + ' kg/m² · llana '+trowel+' mm · ' + bondLabel + ' · UNE-EN 12004 · verificar ficha'],
      ['Comprobación', 'Obligatoria', 'Verificar ficha técnica del adhesivo elegido']
    ];
    const box = el('adhResult');
    if(box){
      box.classList.remove('hidden');box.innerHTML=resultHTML('Cemento cola · '+cls,ceramicBodyLabel(body)+' · lado mayor '+size+' cm',rows,false)+'<div class="actions"><button class="btn" type="button" data-adh-materials>Ir al cálculo de materiales</button></div>';
      box.querySelector('[data-adh-materials]').onclick=()=>{setCeramicTab('level');focusInput(el('cA'));};
    }
  }
  on(el('adhForm'), 'submit', e => submitProgressiveCalculation(e,'adhForm','adhResult',adhesiveClass));
  ['aZone','aPlace','aSupport'].forEach(id=>on(el(id),'change',adhesiveClass));on(el('aSize'),'input',adhesiveClass);
  for(const [from,to]of [['lL','lH'],['rL','rW'],['wetL','wetH'],['cA','cB'],['cB','cArea']])on(el(from),'keydown',event=>{if(event.key==='Enter'){event.preventDefault();focusInput(el(to));}});
  function renderSavedJobs(){
    const c = el('savedJobs');
    if(!c) return;
    if(!savedJobs.length){ c.innerHTML = '<div class="empty">Sin copias guardadas.</div>'; return; }
    c.innerHTML = '<div class="groupHead" style="margin:-13px -13px 8px;border-radius:17px 17px 0 0">COPIAS EN ESTE DISPOSITIVO</div>' + savedJobs.map((j,i) => '<div class="savedJob"><div><b>' + esc(j.meta && j.meta.num || 'Copia') + '</b><div class="small">' + esc((j.meta && j.meta.name) || 'Sin nombre') + ' · ' + esc((j.meta && j.meta.client) || '') + '</div></div><div><button class="btn" data-load-job="' + i + '" type="button">Abrir</button> <button class="btn" data-del-job="' + i + '" type="button">Borrar</button></div></div>').join('');
    c.querySelectorAll('[data-load-job]').forEach(b => b.onclick = () => {
      const j = savedJobs[Number(b.dataset.loadJob)];
      if(!j) return;
      if(work.length&&!confirm('Abrir esta copia sustituirá la obra actual. ¿Continuar?'))return;
      editingPart=null;
      const restoredWork=clonePricing(j.work||[]),restoredBook=clonePricing(j.prices||{}),catalog=clonePricing(priceCatalog);
      const restoredPricing=pricingForLines(mergedLines(restoredWork),validJobPricing(j.pricing)?j.pricing:emptyJobPricing(),catalog,{legacy:true,book:restoredBook});
      try{commitPricing(catalog,restoredPricing);}catch(err){pricingStatus(err.message,true);return;}
      work=restoredWork;priceBook=restoredBook;savePrices();if(el('updateTariffProvider'))el('updateTariffProvider').value='current';
      if(!j.prices&&!j.pricing)pricingStatus('Copia antigua sin precios: las líneas quedan pendientes de valorar, sin usar tarifas actuales.');
      if(j.company){company=Object.assign({},j.company);persist(CO_KEY,company);}
      jobMeta = Object.assign({}, jobMeta, normalizeJobMeta(j.meta || {}));
      saveWork(); persist(JOB_KEY, jobMeta); fillJobFields(); renderWork(); renderList();
    });
    c.querySelectorAll('[data-del-job]').forEach(b => b.onclick = () => {
      if(!confirm('¿Eliminar esta copia guardada?'))return;
      savedJobs.splice(Number(b.dataset.delJob), 1);
      persist(SNAP_KEY, savedJobs);
      renderSavedJobs();
    });
  }
  let deletedPart=null;
  on(el('undoDelete'),'click',()=>{if(!deletedPart)return;work.splice(deletedPart.index,0,deletedPart.part);deletedPart=null;el('undoWork').hidden=true;saveWork();renderWork();});
  function renderWork(){
    fillJobFields();
    renderSavedJobs();
    const c = el('workContent');
    if(!c) return;
    c.innerHTML = work.length ? work.map((x,i) => '<div class="workItem"><b>' + (i + 1) + '. ' + esc(x.title) + '</b><div class="small">Zona: ' + esc(x.zone||'General') + ' · ' + (x.items||[]).length + ' líneas</div><button class="btn" data-edit="' + i + '" type="button" '+(x.editor?'':'disabled')+'>Editar</button> <button class="btn" data-duplicate="' + i + '" type="button">Duplicar</button> <button class="btn" data-del="' + i + '" style="margin-top:8px">Eliminar</button></div>').join('') : '<div class="empty">Todavía no has añadido partidas.</div>';
    c.querySelectorAll('[data-duplicate]').forEach(b=>b.onclick=()=>{work.push(JSON.parse(JSON.stringify(work[Number(b.dataset.duplicate)])));saveWork();renderWork();});
    c.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
      const index=Number(b.dataset.edit),item=work[index],cfg=item.editor;if(!cfg)return;
      editingPart=index;currentCat=cfg.cat||currentCat;currentCerBody=cfg.body||currentCerBody;
      show(cfg.screen);
      for(const id of ['wEdges','lEdges'])if(el(id)&&!Object.hasOwn(cfg.values||{},id))el(id).value='0';
      $all('[data-cer-body]').forEach(b=>b.classList.toggle('active',b.dataset.cerBody===currentCerBody));
      $all('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===currentCat));
      if(el('wetMortarWaste')&&!Object.hasOwn(cfg.values||{},'wetMortarWaste'))el('wetMortarWaste').value=cfg.values?.wetWaste||'8';
      Object.entries(cfg.values||{}).forEach(([id,value])=>{if(el(id))el(id).value=value;});
      if(cfg.screen==='wall')calcWall();
      if(cfg.screen==='lining')setLiningType(el('lType').value);
      if(cfg.screen==='roof')setRoofSys(el('rSys').value);
      if(cfg.screen==='wet'){renderProducts();applyWetDefaults(data[currentCat]?.[cfg.values?.wetProduct]);Object.entries(cfg.values||{}).forEach(([id,v])=>{if(el(id))el(id).value=v;});calcWet();}
      if(cfg.screen==='ceramic')setCeramicTab('level');
    });
    c.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { deletedPart={index:Number(b.dataset.del),part:work[Number(b.dataset.del)]};work.splice(deletedPart.index, 1); editingPart=null;el('undoWork').hidden=false; saveWork(); renderWork(); renderList(); });
  }
  function renderList(){
    readJobFields();freezeJobPrices();renderPriceProviders();invalidateTariffPreview();
    const c = el('listContent');
    if(!c) return;
    if(!work.length){ c.innerHTML = '<div class="empty">Añade partidas para generar el presupuesto.</div>';refreshBudgetOverview(budgetTotals()); return; }
    const tot = budgetTotals();
    const co = company.name || 'Tu empresa';
    const head = '<div class="quoteHead"><div><div class="quoteBrand">' + esc(co) + '</div><div class="small">' + esc([company.nif, company.phone, company.mail].filter(Boolean).join(' · ')) + '</div><div class="small">' + esc(company.addr||'') + '</div></div><div class="quoteMeta"><div><b>' + esc(jobMeta.num || 'Presupuesto') + '</b></div><div>' + esc(jobMeta.name || 'Obra sin nombre') + '</div><div>' + esc(jobMeta.client ? ('Cliente: ' + jobMeta.client) : '') + '</div><div>' + esc(jobMeta.addr||'') + '</div></div></div>';
    const parts = '<div class="groupHead">PARTIDAS POR ESTANCIA</div>' + work.map((x,i) => '<div class="listLine"><span><b>' + esc(x.zone||'General') + '</b> · ' + (i+1) + '. ' + esc(x.title) + '</span><strong>' + (x.items||[]).length + '</strong></div>').join('');
    const table = '<div class="groupHead">MATERIALES Y PRECIOS</div><div class="budgetHead"><span>Concepto</span><span>Ud</span><span>€/unidad sin IVA</span><span>Importe</span></div>' +
      tot.rows.map(budgetLineHTML).join('');
    const sums = '<div data-budget-totals>'+budgetSummaryHTML(tot)+'</div>';
    const notes = jobMeta.notes ? '<div class="info">' + esc(jobMeta.notes) + '</div>' : '';
    const valid = jobMeta.valid ? '<div class="small" style="margin-top:8px">Validez: ' + esc(jobMeta.valid) + ' días. Cantidades orientativas; verificar el sistema y la medición. Precios introducidos por el usuario.</div>' : '';
    c.innerHTML = '<div class="info" data-budget-warning role="status"'+(tot.provisional?'':' hidden')+'>'+(tot.provisional?'Presupuesto provisional: '+esc(provisionalText(tot))+'.':'')+'</div>' + head + parts + table + sums + notes + valid;
    bindBudgetPrices(c,tot.rows);
    refreshBudgetOverview(tot);
  }
  function budgetLineHTML(row,index){
    const id=esc(encodeURIComponent(row.id)),quantity=esc(String(row.qty).replace('.',',')+' '+row.unit),priceId='budgetPrice'+index,errorId=priceId+'Error';
    const price=row.labor?'<span class="small">Incluida en la partida</span>':'<label for="'+priceId+'"><span class="budgetFieldLabel">Precio por '+esc(row.unit)+' · sin IVA</span><input id="'+priceId+'" class="price" data-price-key="'+esc(row.key)+'" data-material-id="'+id+'" aria-describedby="'+errorId+'" aria-label="Precio por '+esc(row.unit)+' sin IVA de '+esc(row.name)+'" placeholder="Sin precio" inputmode="decimal" enterkeyhint="next" value="'+(row.missing?'':row.unitPrice)+'"></label><span id="'+errorId+'" class="fieldError" data-price-error="'+id+'" hidden></span>';
    return '<div class="budgetLine'+(row.missing?' isMissing':'')+'" data-budget-material="'+id+'"><div class="budgetConcept"><b>'+esc(row.name)+'</b><div class="rowDetail">'+esc(row.detail||'')+'</div></div><div class="budgetQty"><span class="budgetFieldLabel">Cantidad</span>'+ (row.labor?'—':quantity)+'</div><div class="budgetPriceField">'+price+'</div><div class="budgetLineAmount"><span class="budgetFieldLabel">Importe</span><strong class="budgetAmt" data-row-total="'+id+'">'+(row.missing?'Sin precio':money(row.total)+' €')+'</strong></div>'+budgetProviderHTML(row)+'</div>';
  }
  function budgetText(){
    if(!budgetInputValid()) return '';
    const tot = budgetTotals();
    const lines = [];
    lines.push((company.name || 'Presupuesto') + (jobMeta.num ? ' · ' + jobMeta.num : ''));
    if(jobMeta.name) lines.push('Obra: ' + jobMeta.name);
    if(jobMeta.client) lines.push('Cliente: ' + jobMeta.client);
    if(jobMeta.addr) lines.push('Dirección: ' + jobMeta.addr);
    if(tot.provisional)lines.push('PRESUPUESTO PROVISIONAL: '+provisionalText(tot));
    lines.push('');
    work.forEach((x,i) => lines.push((i+1) + '. [' + (x.zone||'General') + '] ' + x.title));
    lines.push('');
    tot.rows.forEach(r => lines.push(r.name + ' · ' + (r.labor ? money(r.total)+' €' : (String(r.qty).replace('.',',') + ' ' + r.unit + ' × ' + (r.missing?'SIN PRECIO':unitPriceText(r.unitPrice) + ' = ' + money(r.total) + ' €')))));
    lines.push('');
    budgetSummary(tot).forEach(line => lines.push(line.label + ': ' + money(line.amount) + ' €'));
    if(jobMeta.notes){ lines.push(''); lines.push(jobMeta.notes); }
    lines.push('');
    lines.push('Estimación de cantidades; verificar el sistema y la medición. Precios introducidos por el usuario.');
    return lines.join('\n');
  }
  function exportPrint(){
    if(!budgetInputValid()) return;
    if(budgetTotals().provisional&&!confirm('Faltan precios o hay cálculos incompletos. El documento será un presupuesto provisional. ¿Exportar?'))return;
    readJobFields(); saveJob();
    const tot = budgetTotals();
    const w = window.open('', '_blank');
    if(!w){ window.print(); return; }
    const rows = tot.rows.map(r => '<tr><td>' + esc(r.name) + '</td><td style="text-align:right">' + (r.labor ? '—' : esc(String(r.qty).replace('.',',') + ' ' + r.unit)) + '</td><td style="text-align:right">' + (r.labor ? '—' : r.missing?'Sin precio':unitPriceText(r.unitPrice)) + '</td><td style="text-align:right">' + (r.missing?'Pendiente':money(r.total)+' €') + '</td></tr>').join('');
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(jobMeta.num || 'Presupuesto') + '</title><style>body{font:14px/1.4 system-ui,Segoe UI,Arial;margin:24px;color:#111}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ccc;padding:6px 4px;text-align:left;vertical-align:top}th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#555}.tot{margin-top:14px}.tot div{display:flex;justify-content:space-between;padding:3px 0}.grand{font-weight:800;font-size:18px;border-top:2px solid #111;margin-top:8px;padding-top:8px}.muted{color:#555;font-size:12px}header{display:flex;justify-content:space-between;gap:16px;margin-bottom:18px}@media print{button{display:none}}</style></head><body>');
    w.document.write('<header><div><h1>' + esc(company.name || 'Presupuesto de obra') + '</h1><div class="muted">' + esc([company.nif,company.phone,company.mail,company.addr].filter(Boolean).join(' · ')) + '</div></div><div class="muted"><b>' + esc(jobMeta.num||'') + '</b><br>' + esc(jobMeta.name||'') + '<br>' + esc(jobMeta.client?('Cliente: '+jobMeta.client):'') + '<br>' + esc(jobMeta.addr||'') + '<br>' + esc(new Date().toLocaleDateString('es-ES')) + '</div></header>');
    if(tot.provisional)w.document.write('<p><b>PRESUPUESTO PROVISIONAL: '+esc(provisionalText(tot))+'.</b></p>');
    w.document.write('<p class="muted">Partidas: ' + work.map(x => esc(x.title)).join(' · ') + '</p>');
    w.document.write('<table><thead><tr><th>Concepto</th><th style="text-align:right">Cant.</th><th style="text-align:right">€/ud</th><th style="text-align:right">Importe</th></tr></thead><tbody>' + rows + '</tbody></table>');
    w.document.write('<div class="tot">' + budgetSummary(tot).map(line => '<div' + (line.grand ? ' class="grand"' : '') + '><span>' + esc(line.label) + '</span><span>' + money(line.amount) + ' €</span></div>').join('') + '</div>');
    if(jobMeta.notes) w.document.write('<p>' + esc(jobMeta.notes).replace(/\n/g,'<br>') + '</p>');
    w.document.write('<p class="muted">Validez ' + esc(jobMeta.valid||'30') + ' días. Estimación de cantidades; verificar el sistema y la medición. Los precios los introduce el usuario. No sustituye medición de proyecto.</p>');
    w.document.write('<button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>');
    w.document.close();
    setTimeout(function(){ try { w.focus(); w.print(); } catch(e){} }, 250);
  }
  function exportCsv(){
    if(!budgetInputValid()) return;
    if(budgetTotals().provisional&&!confirm('Faltan precios o hay cálculos incompletos. El CSV será provisional. ¿Exportar?'))return;
    readJobFields();
    const tot = budgetTotals();
    const lines = [['Presupuesto', jobMeta.num||'', jobMeta.name||'', jobMeta.client||''],['Concepto','Cantidad','Unidad','Precio ud','Importe']];
    if(tot.provisional) lines.splice(1, 0, ['PRESUPUESTO PROVISIONAL', provisionalText(tot)]);
    tot.rows.forEach(r => lines.push([r.name, String(r.qty).replace('.',','), r.unit, r.missing?'Sin precio':unitPriceText(r.unitPrice), r.missing?'Pendiente':money(r.total)]));
    lines.push([]);
    budgetSummary(tot).forEach(line => lines.push([line.label,'','','',money(line.amount)]));
    const csv = lines.map(row => row.map(c => '"' + csvSafeCell(c).replace(/"/g,'""') + '"').join(';')).join('\r\n');
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (jobMeta.num || 'presupuesto') + '.csv';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
  }
  function exportWa(){
    const txt = budgetText();
    if(!txt) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }
  function newJob(){
    if(work.length&&!confirm('Crear una obra nueva vacía la actual. Guarda una copia antes si quieres conservarla. ¿Continuar?'))return;
    try{commitPricing(priceCatalog,emptyJobPricing(jobPricing.defaultProviderId));}catch(err){pricingStatus(err.message,true);return;}
    editingPart=null;deletedPart=null;if(el('undoWork'))el('undoWork').hidden=true;
    saveJob();
    work = [];priceBook={};savePrices();if(el('updateTariffProvider'))el('updateTariffProvider').value='current';
    jobMeta.name = ''; jobMeta.client = ''; jobMeta.addr = ''; jobMeta.notes = ''; jobMeta.laborExtra = 0; jobMeta.extra = 0; jobMeta.disc = 0; jobMeta.profitPct = 0;
    jobMeta.num = nextQuoteNum();
    if(el('jobName')) el('jobName').value = '';
    if(el('jobClient')) el('jobClient').value = '';
    if(el('jobAddr')) el('jobAddr').value = '';
    if(el('jobNotes')) el('jobNotes').value = '';
    if(el('jobLaborExtra')) el('jobLaborExtra').value = '0';
    if(el('jobExtra')) el('jobExtra').value = '0';
    if(el('jobDisc')) el('jobDisc').value = '0';
    if(el('jobProfitPct')) el('jobProfitPct').value = '0';
    if(el('jobNum')) el('jobNum').value = jobMeta.num;
    saveWork(); persist(JOB_KEY, jobMeta); renderWork(); renderList();
  }
  function saveSnap(){
    if(!budgetInputValid()) return;
    freezeJobPrices();
    savedJobs.unshift({at:Date.now(),pricing:clonePricing(jobPricing), meta:Object.assign({}, jobMeta), work:JSON.parse(JSON.stringify(work)),prices:JSON.parse(JSON.stringify(priceBook)),company:Object.assign({},company)});

    persist(SNAP_KEY, savedJobs); persist(JOB_KEY, jobMeta); persist(CO_KEY, company);
    renderSavedJobs();
  }
  on(el('exportPrint'), 'click', exportPrint);
  on(el('exportCsv'), 'click', exportCsv);
  on(el('exportWa'), 'click', exportWa);
  on(el('jobNew'), 'click', newJob);
  on(el('jobSaveSnap'), 'click', saveSnap);
  on(el('priceCsv'),'change',event=>importProviderPrices(event,'priceCsvStatus',el('jobProvider')?.value||jobPricing.defaultProviderId));
  let deferredInstall=null;
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault(); deferredInstall=e;
    if(el('installApp')) el('installApp').classList.remove('hidden');
  });
  on(el('installApp'),'click',async()=>{
    if(!deferredInstall) return;
    deferredInstall.prompt();
    try{await deferredInstall.userChoice;}catch(e){}
    deferredInstall=null;
    if(el('installApp')) el('installApp').classList.add('hidden');
  });
  if('serviceWorker' in navigator){
    const registerWorker = () => navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    // Los fragmentos pueden terminar de cargarse después del evento load.
    if(document.readyState === 'complete') registerWorker();
    else window.addEventListener('load', registerWorker, {once:true});
  }
  ['jobName','jobClient','jobAddr','jobVat','jobDisc','jobProfitPct','jobLaborExtra','jobExtra','jobValid','jobNotes','jobNum','coName','coNif','coPhone','coMail','coAddr'].forEach(id => {
    on(el(id), 'change', () => { saveJob(); if(['jobVat','jobDisc','jobProfitPct','jobLaborExtra','jobExtra'].includes(id)){invalidateTariffPreview();refreshBudgetAmounts(el('listContent'));} });
    on(el(id), 'blur', saveJob);
  });
  ['jobProfitPct','jobDisc','jobLaborExtra','jobExtra'].forEach(id => on(el(id), 'input', () => { saveJob();invalidateTariffPreview();refreshBudgetAmounts(el('listContent')); }));
  ['viewAmounts','viewMaterials'].forEach(id=>on(el(id),'click',()=>{
    setBudgetView(id==='viewMaterials');
  }));
  function setBudgetView(materials){
    el('listContent')?.classList.toggle('materialsOnly',materials);
    el('viewMaterials')?.setAttribute('aria-pressed',String(materials));el('viewAmounts')?.setAttribute('aria-pressed',String(!materials));
    if(el('budgetOverview'))el('budgetOverview').hidden=materials;
  }
  on(el('shareBudget'),'click',async()=>{
    const text=budgetText();
    if(!text) return;
    try{if(navigator.share)await navigator.share({title:'Presupuesto',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Presupuesto copiado para compartir.');}else exportWa();}catch(e){if(e.name!=='AbortError')alert('No se pudo compartir. Usa PDF o WhatsApp.');}
  });
  on(el('showNews'),'click',()=>{el('updateNotice').hidden=false;show('home');});
  on(el('backupExport'),'click',()=>{
    if(!budgetInputValid()) return;
    saveJob();
    freezeJobPrices();
    const payload={format:'calculadora-backup',version:2,work,priceBook,jobMeta,company,savedJobs,priceCatalog,jobPricing};
    if(pricingLoadError){try{const raw=localStorage.getItem(PRICING_KEY);if(raw!==null)payload.priceCatalogRecovery=raw;}catch(err){}}
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='calculadora-copia-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    el('backupStatus').textContent='Copia descargada. Contiene datos de clientes y empresa: guárdala en un lugar seguro.'+(pricingLoadError?' Las tarifas no pudieron validarse; conserva este archivo para recuperar los datos originales.':'');
  });
  on(el('backupImport'),'change',async e=>{
    try{
      const file=e.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error('Archivo demasiado grande: máximo 20 MB');
      const d=JSON.parse(await file.text());
      const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
      const editor=x=>x===undefined||(obj(x)&&['wall','lining','roof','wet','ceramic'].includes(x.screen)&&obj(x.values)&&Object.values(x.values).every(v=>typeof v==='string'));
      const parts=x=>Array.isArray(x)&&x.every(p=>obj(p)&&editor(p.editor)&&typeof p.title==='string'&&Array.isArray(p.items)&&p.items.every(r=>Array.isArray(r)&&r.length>=2&&r.every(v=>typeof v==='string')));
      const prices=x=>obj(x)&&Object.values(x).every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0);
      const fields=x=>obj(x)&&Object.values(x).every(v=>typeof v==='string'||typeof v==='number');
      const meta=x=>fields(x)&&['profitPct','disc','vat','laborExtra','extra'].every(key=>!Object.hasOwn(x,key)||percentageValue(x[key],key==='profitPct'?1000:key==='laborExtra'||key==='extra'?Number.MAX_VALUE:100)!==null);
      if(d.format!=='calculadora-backup'||![1,2].includes(d.version)||!parts(d.work)||!prices(d.priceBook)||!meta(d.jobMeta)||!fields(d.company)||!Array.isArray(d.savedJobs)||!d.savedJobs.every(j=>obj(j)&&parts(j.work)&&meta(j.meta)&&(!j.prices||prices(j.prices))&&(!j.company||fields(j.company))&&(!j.pricing||validJobPricing(j.pricing))))throw Error('Formato de copia no válido');
      if(d.version===2&&(!validPriceCatalog(d.priceCatalog)||!validJobPricing(d.jobPricing)))throw Error('Catálogo de proveedores o precios de obra no válido');
      if(!confirm('Restaurar sustituirá las obras, tarifas, proveedores y datos actuales. '+(d.version===1?'Esta copia antigua solo contiene tarifa general. ':'')+(d.priceCatalogRecovery?'Esta copia incluye tarifas originales sin validar que no se aplicarán: conserva el archivo para recuperarlas. ':'')+'Descarga primero una copia si quieres conservarlos. ¿Continuar?'))return;
      const nextCatalog=d.version===2?d.priceCatalog:catalogFromLegacy(d.priceBook,mergedLines(d.work.concat(d.savedJobs.flatMap(j=>j.work))));
      const nextPricing=pricingForLines(mergedLines(d.work),d.version===2?d.jobPricing:emptyJobPricing(),nextCatalog,{legacy:true,book:d.priceBook});
      restorePricingBackup(d,nextCatalog,nextPricing);if(el('updateTariffProvider'))el('updateTariffProvider').value='current';
      fillJobFields();renderWork();renderList();renderPriceCatalog();el('backupStatus').textContent='Copia restaurada.';
    }catch(err){el('backupStatus').textContent='No se ha restaurado: '+err.message;}finally{e.target.value='';}
  });
  let tariffPreview=null,editingPendingRate=null;
  function priceDateLabel(value){return value?value.slice(8,10)+'/'+value.slice(5,7)+'/'+value.slice(0,4):'Fecha no registrada';}
  function providerOptions(selected,{historicalName=''}={}){
    const choices=priceCatalog.providers.map(p=>'<option value="'+esc(p.id)+'"'+(p.id===selected?' selected':'')+'>'+esc(p.name)+'</option>');
    if(selected&&historicalName&&!priceCatalog.providers.some(p=>p.id===selected))choices.push('<option value="'+esc(selected)+'" selected disabled>'+esc(historicalName)+'</option>');
    return choices.join('');
  }
  function renderPriceProviders(){
    for(const id of ['catalogProvider','tariffProvider','catalogImportProvider','jobProvider','updateTariffProvider']){
      const node=el(id);if(!node)continue;
      const selected=id==='jobProvider'?jobPricing.defaultProviderId:(node.value||(id==='updateTariffProvider'?'current':'general'));
      node.innerHTML=(id==='catalogProvider'?'<option value="all">Todos los proveedores</option>':id==='updateTariffProvider'?'<option value="current">Conservar proveedor de cada línea</option>':'')+providerOptions(selected);
      node.value=selected==='all'&&id==='catalogProvider'?'all':selected==='current'&&id==='updateTariffProvider'?'current':priceCatalog.providers.some(p=>p.id===selected)?selected:'general';
    }
  }
  function invalidateTariffPreview(){tariffPreview=null;if(el('tariffPreview')){el('tariffPreview').hidden=true;el('tariffPreview').innerHTML='';}}
  function pricingSignature(){return JSON.stringify({work,jobPricing,jobMeta,priceBook,priceCatalog});}
  function budgetProviderHTML(row){
    if(row.labor)return '';
    return '<details class="budgetSupplier" data-budget-supplier="'+esc(encodeURIComponent(row.id))+'"><summary>Proveedor: <span data-provider-name="'+esc(encodeURIComponent(row.id))+'">'+esc(row.providerName)+'</span> · Ver tarifas</summary><div class="priceSource"><label>Cambiar proveedor<select data-price-provider="'+esc(encodeURIComponent(row.id))+'" aria-label="Proveedor de '+esc(row.name)+'">'+providerOptions(row.providerId,{historicalName:row.providerName})+'</select></label><span class="small" data-price-info="'+esc(encodeURIComponent(row.id))+'">'+esc(priceDateLabel(row.priceDate)+(row.reference?' · Ref. '+row.reference:''))+'</span><button class="btn" type="button" data-price-offers="'+esc(encodeURIComponent(row.id))+'">Comparar precios / registrar tarifa</button></div></details>';
  }
  function budgetSummaryHTML(tot){return budgetSummary(tot).map(line=>'<div class="budgetTot'+(line.grand?' grand':'')+'"><span>'+esc(line.label)+'</span><span>'+money(line.amount)+' €</span></div>').join('');}
  function refreshBudgetOverview(tot){
    const priceInputs=[...el('listContent')?.querySelectorAll('[data-price-key]')||[]];
    const errors=priceInputs.concat(['jobProfitPct','jobDisc','jobLaborExtra','jobExtra'].map(id=>el(id)).filter(Boolean)).filter(input=>!input.checkValidity()).length;
    if(el('budgetQuickTotal'))el('budgetQuickTotal').textContent=money(tot.grand)+' €';
    if(el('budgetQuickLabel'))el('budgetQuickLabel').textContent=tot.provisional||errors?'TOTAL PROVISIONAL':'TOTAL CON IVA';
    if(el('budgetProgress'))el('budgetProgress').textContent=!work.length?'Añade una partida desde las calculadoras.':errors?'Revisa '+errors+' campo(s). El total conserva los últimos valores válidos.':(tot.missing?tot.missing+' material(es) sin precio. Presupuesto provisional.':'Todos los materiales tienen precio.')+(tot.incomplete?' '+tot.incomplete+' partida(s) pendientes de revisión técnica. Presupuesto provisional.':'');
    if(el('valuePending')){el('valuePending').disabled=!tot.missing&&!errors;el('valuePending').textContent=errors?'Revisar datos':'Valorar pendientes'+(tot.missing?' ('+tot.missing+')':'');}
    if(el('budgetAdjustmentsSummary'))el('budgetAdjustmentsSummary').textContent='IVA '+decimalText(tot.vatPct)+' % · beneficio '+decimalText(tot.profitPct)+' % · descuento '+decimalText(tot.discPct)+' %'+(jobMeta.laborExtra?' · mano de obra extra '+money(jobMeta.laborExtra)+' €':'')+(tot.extra?' · desplazamiento / varios '+money(tot.extra)+' €':'');
  }
  function refreshBudgetAmounts(container){
    if(!container)return;
    const tot=budgetTotals();
    container.querySelectorAll('[data-row-total]').forEach(node=>{const row=tot.rows.find(r=>r.id===decodeURIComponent(node.dataset.rowTotal));if(row)node.textContent=row.missing?'Sin precio':money(row.total)+' €';});
    container.querySelectorAll('[data-price-info]').forEach(node=>{const row=tot.rows.find(r=>r.id===decodeURIComponent(node.dataset.priceInfo));if(row)node.textContent=priceDateLabel(row.priceDate)+(row.reference?' · Ref. '+row.reference:'');});
    container.querySelectorAll('[data-budget-totals]').forEach(node=>node.innerHTML=budgetSummaryHTML(tot));
    container.querySelectorAll('[data-budget-warning]').forEach(node=>{node.hidden=!tot.provisional;node.textContent=tot.provisional?'Presupuesto provisional: '+provisionalText(tot)+'.':'';});
    container.querySelectorAll('[data-provider-name]').forEach(node=>{const row=tot.rows.find(r=>r.id===decodeURIComponent(node.dataset.providerName));if(row)node.textContent=row.providerName;});
    container.querySelectorAll('[data-budget-material]').forEach(node=>{const row=tot.rows.find(r=>r.id===decodeURIComponent(node.dataset.budgetMaterial));if(row)node.classList.toggle('isMissing',row.missing);});
    refreshBudgetOverview(tot);
  }
  function bindBudgetPrices(container,rows){
    container.querySelectorAll('[data-price-key]').forEach(input=>{
      const line=rows.find(r=>r.id===decodeURIComponent(input.dataset.materialId||''))||rows.find(r=>r.key===input.dataset.priceKey);
      if(!line)return;
      input.dataset.savedPriceValue=String(input.value);
      const showError=message=>container.querySelectorAll('[data-price-error]').forEach(node=>{if(node.dataset.priceError===input.dataset.materialId){node.textContent=message;node.hidden=!message;}});
      input.oninput=input.onchange=input.onblur=()=>{
        if(String(input.value)===input.dataset.savedPriceValue){const hadError=!input.checkValidity();input.setCustomValidity('');input.setAttribute('aria-invalid','false');showError('');if(hadError){pricingStatus('Se mantiene el último precio guardado.');refreshBudgetOverview(budgetTotals());}return;}
        try{
          saveBudgetMaterialPrice(line,input.value);input.dataset.savedPriceValue=String(input.value);input.setCustomValidity('');input.setAttribute('aria-invalid','false');showError('');
          invalidateTariffPreview();refreshBudgetAmounts(container);pricingStatus(String(input.value).trim()===''?'Esta línea queda sin valorar. La tarifa guardada se conserva.':'Precio guardado para esta obra y en la tarifa del proveedor.');
        }catch(err){input.setCustomValidity(err.message);input.setAttribute('aria-invalid','true');showError(err.message);refreshBudgetOverview(budgetTotals());pricingStatus(err.message,true);}
      };
      input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();input.oninput();focusPendingBudgetPrice(input);}};
    });
    container.querySelectorAll('[data-price-provider]').forEach(select=>select.onchange=()=>{
      const line=rows.find(r=>r.id===decodeURIComponent(select.dataset.priceProvider));if(!line)return;
      const previous=jobPricing.entries.find(e=>e.materialId===line.id)?.providerId||line.providerId;
      try{
        const entry=selectBudgetProvider(line,select.value),input=[...container.querySelectorAll('[data-price-key]')].find(node=>decodeURIComponent(node.dataset.materialId)===line.id);
        if(input){input.value=entry.price===null?'':decimalText(entry.price);input.dataset.savedPriceValue=String(input.value);input.setCustomValidity('');input.setAttribute('aria-invalid','false');}
        container.querySelectorAll('[data-price-error]').forEach(node=>{if(decodeURIComponent(node.dataset.priceError)===line.id){node.hidden=true;node.textContent='';}});
        invalidateTariffPreview();refreshBudgetAmounts(container);pricingStatus(entry.price===null?'Este proveedor no tiene tarifa para el material. Introduce el precio sin IVA.':'Tarifa aplicada a esta línea de la obra.');
      }catch(err){select.value=previous;pricingStatus(err.message,true);}
    });
    container.querySelectorAll('[data-price-offers]').forEach(button=>button.onclick=()=>{
      const line=rows.find(r=>r.id===decodeURIComponent(button.dataset.priceOffers));if(!line)return;
      budgetReturnMaterialId=line.id;
      show('prices');if(el('catalogSearch'))el('catalogSearch').value=line.name;if(el('catalogProvider'))el('catalogProvider').value='all';renderPriceCatalog();
      if(catalogMaterial(line.id)?.rates.length)el('priceCatalogContent')?.scrollIntoView?.({behavior:'smooth',block:'start'});else openTariffEditor(line.id,line.providerId);
    });
  }
  function focusPendingBudgetPrice(from=null){
    const container=el('listContent');if(!container)return;
    setBudgetView(false);
    const inputs=[...container.querySelectorAll('[data-price-key]')];
    const invalid=inputs.concat(['jobProfitPct','jobDisc','jobLaborExtra','jobExtra'].map(id=>el(id)).filter(Boolean)).find(input=>!input.checkValidity());
    if(invalid){focusInput(invalid);invalid.reportValidity();return;}
    const missing=new Set(budgetTotals().rows.filter(row=>row.missing).map(row=>row.id)),start=inputs.indexOf(from);
    for(let step=1;step<=inputs.length;step++){const input=inputs[(start+step)%inputs.length];if(missing.has(decodeURIComponent(input.dataset.materialId))){focusInput(input);input.select?.();return;}}
    if(el('budgetProgress'))el('budgetProgress').textContent='Todos los materiales tienen precio.'+(budgetTotals().incomplete?' Revisa los avisos técnicos de las partidas.':'');
    from?.blur?.();
  }
  on(el('valuePending'),'click',()=>focusPendingBudgetPrice());
  function resetTariffEditor(){
    editingPendingRate=null;
    for(const id of ['tariffMaterial','tariffPrice','tariffReference','tariffVat'])if(el(id)){el(id).value='';el(id).setCustomValidity('');}
    if(el('tariffMaterial'))el('tariffMaterial').readOnly=false;
    if(el('tariffUnit')){el('tariffUnit').value='';el('tariffUnit').disabled=false;}
    if(el('tariffVatIncluded'))el('tariffVatIncluded').value='no';
    if(el('tariffDate'))el('tariffDate').value=priceToday();
    if(el('tariffFormTitle'))el('tariffFormTitle').textContent='Registrar un precio';
    syncTariffVat();
  }
  function syncTariffVat(){if(el('tariffVatWrap'))el('tariffVatWrap').hidden=el('tariffVatIncluded')?.value!=='yes';}
  function openTariffEditor(id,providerId){
    resetTariffEditor();
    const material=catalogMaterial(id);if(!material)return;
    const rate=catalogMaterialRate(id,providerId);
    el('tariffMaterial').value=material.name;el('tariffMaterial').readOnly=true;el('tariffUnit').value=material.unit;el('tariffUnit').disabled=true;
    el('tariffProvider').value=priceCatalog.providers.some(p=>p.id===providerId)?providerId:'general';
    if(rate){el('tariffPrice').value=decimalText(rate.inputPrice);el('tariffReference').value=rate.reference;el('tariffDate').value=rate.updatedAt||'';el('tariffVatIncluded').value=rate.vatIncluded?'yes':'no';el('tariffVat').value=rate.vatPct??'';}
    el('tariffFormTitle').textContent='Precio de '+material.name;syncTariffVat();el('tariffForm').scrollIntoView?.({behavior:'smooth',block:'start'});el('tariffPrice').focus();
  }
  function renderPriceCatalog(){
    const content=el('priceCatalogContent');if(!content)return;
    freezeJobPrices();renderPriceProviders();
    const selected=el('catalogProvider')?.value||'general',query=cleanPriceName(el('catalogSearch')?.value).toLocaleLowerCase('es-ES');
    const materials=priceCatalog.materials.filter(m=>!query||(m.name+' '+m.rates.map(r=>r.reference+' '+providerName(r.providerId)).join(' ')).toLocaleLowerCase('es-ES').includes(query)).slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
    content.innerHTML=materials.length?materials.map(material=>{
      const rates=material.rates.filter(r=>selected==='all'||r.providerId===selected).slice().sort((a,b)=>a.price-b.price);
      return '<article class="priceCard"><h3>'+esc(material.name)+'</h3><p class="small">Precio por '+esc(material.unit)+' · comparación del mismo material y unidad</p>'+(rates.length?rates.map(rate=>'<div class="priceOffer"><div><b>'+esc(providerName(rate.providerId))+'</b><div class="small">'+esc(priceDateLabel(rate.updatedAt)+(rate.reference?' · Ref. '+rate.reference:''))+'</div></div><strong>'+esc(unitPriceText(rate.price))+' €/'+esc(material.unit)+' <span class="small">sin IVA</span></strong><button class="btn" type="button" data-rate-edit="'+esc(encodeURIComponent(material.id))+'" data-provider="'+esc(rate.providerId)+'">Editar precio</button><button class="btn" type="button" data-rate-remove="'+esc(encodeURIComponent(material.id))+'" data-provider="'+esc(rate.providerId)+'">Quitar tarifa</button></div>').join(''):'<p>Sin precio para este proveedor.</p><button class="btn" type="button" data-rate-edit="'+esc(encodeURIComponent(material.id))+'" data-provider="'+esc(selected==='all'?'general':selected)+'">Añadir precio</button>')+'</article>';
    }).join(''):'<div class="empty">No hay materiales con ese filtro. Añade una partida a Obra o registra un material.</div>';
    content.querySelectorAll('[data-rate-edit]').forEach(button=>button.onclick=()=>openTariffEditor(decodeURIComponent(button.dataset.rateEdit),button.dataset.provider));
    content.querySelectorAll('[data-rate-remove]').forEach(button=>button.onclick=()=>{
      if(!confirm('¿Quitar este precio del catálogo? Las obras y copias conservarán sus precios.'))return;
      const catalog=clonePricing(priceCatalog),material=catalogMaterial(decodeURIComponent(button.dataset.rateRemove),catalog);
      material.rates=material.rates.filter(r=>r.providerId!==button.dataset.provider);
      try{commitPricing(catalog,jobPricing);renderPriceCatalog();pricingStatus('Tarifa retirada. Los precios de las obras no han cambiado.');}catch(err){pricingStatus(err.message,true);}
    });
    const pending=el('pendingPriceContent');
    if(pending){
      pending.innerHTML=priceCatalog.pendingRates.length?'<h3>Precios anteriores o importados sin unidad</h3><p>Se conservan, pero no se aplican hasta que confirmes su unidad.</p>'+priceCatalog.pendingRates.map((item,index)=>'<div class="priceCard"><b>'+esc(item.name)+'</b><p>'+esc(providerName(item.rate.providerId))+' · '+esc(unitPriceText(item.rate.price))+' € · unidad pendiente</p><button class="btn" type="button" data-pending-price="'+index+'">Completar unidad</button></div>').join(''):'';
      pending.querySelectorAll('[data-pending-price]').forEach(button=>button.onclick=()=>{
        const item=priceCatalog.pendingRates[Number(button.dataset.pendingPrice)];if(!item)return;
        resetTariffEditor();editingPendingRate={name:item.name,providerId:item.rate.providerId};el('tariffMaterial').value=item.name;el('tariffProvider').value=item.rate.providerId;el('tariffPrice').value=decimalText(item.rate.inputPrice);el('tariffReference').value=item.rate.reference;el('tariffDate').value=item.rate.updatedAt||'';el('tariffVatIncluded').value=item.rate.vatIncluded?'yes':'no';el('tariffVat').value=item.rate.vatPct??'';syncTariffVat();el('tariffUnit').focus();el('tariffForm').scrollIntoView?.({behavior:'smooth',block:'start'});
      });
    }
    if(el('priceMaterials'))el('priceMaterials').innerHTML=priceCatalog.materials.map(m=>'<option value="'+esc(m.name)+'">'+esc(m.unit)+'</option>').join('');
    if(el('catalogCount'))el('catalogCount').textContent=priceCatalog.materials.length+' materiales · '+priceCatalog.providers.length+' tarifas de proveedor · '+priceCatalog.pendingRates.length+' precios pendientes de unidad';
    if(pricingLoadError)pricingStatus(pricingLoadError,true);
  }
  function showTariffPreview(){
    if(!budgetInputValid())return;
    if(!work.length){pricingStatus('Añade una partida a Obra antes de actualizar precios.',true);return;}
    freezeJobPrices();
    try{
      const proposal=proposeTariff(el('updateTariffProvider')?.value||'current'),current=budgetTotals(),next=budgetTotals(proposal.pricing);
      tariffPreview={...proposal,signature:pricingSignature()};
      const box=el('tariffPreview');if(!box)return;
      box.hidden=false;box.innerHTML='<h3>Revisar actualización de precios</h3><p>'+proposal.changes.length+' líneas por actualizar. '+proposal.unavailable.length+' sin tarifa: conservan el precio actual.</p>'+proposal.changes.map(change=>'<div class="pricePreviewLine"><b>'+esc(change.line.name)+'</b><span>'+esc(change.old.providerName)+': '+(change.old.price===null?'Sin precio':esc(unitPriceText(change.old.price))+' €/'+esc(change.line.unit))+'</span><span>'+esc(change.entry.providerName)+': '+esc(unitPriceText(change.entry.price))+' €/'+esc(change.line.unit)+'</span></div>').join('')+(proposal.unavailable.length?'<p class="small">Sin tarifa: '+proposal.unavailable.map(line=>esc(line.name+' ('+line.unit+')')).join(' · ')+'</p>':'')+'<p>Total actual'+(current.provisional?' provisional':'')+': <b>'+money(current.grand)+' €</b><br>Total propuesto'+(next.provisional?' provisional':'')+': <b>'+money(next.grand)+' €</b></p><div class="actions"><button class="btn" type="button" data-apply-tariff'+(proposal.changes.length?'':' disabled')+'>Aplicar estos cambios</button><button class="btn" type="button" data-cancel-tariff>Cancelar</button></div>';
      box.querySelector('[data-apply-tariff]').onclick=()=>{
        if(!budgetInputValid())return;
        if(!tariffPreview)return;
        if(tariffPreview.signature!==pricingSignature()){showTariffPreview();pricingStatus('La obra o la tarifa han cambiado. Revisa de nuevo la propuesta.',true);return;}
        try{const count=tariffPreview.changes.length;commitPricing(priceCatalog,tariffPreview.pricing);renderList();pricingStatus(count+' líneas actualizadas en esta obra. Las copias guardadas no cambian.');}catch(err){pricingStatus(err.message,true);}
      };
      box.querySelector('[data-cancel-tariff]').onclick=invalidateTariffPreview;
    }catch(err){pricingStatus(err.message,true);}
  }
  function downloadTariffCsv(rows,filename){
    const csv=rows.map(row=>row.map(value=>'"'+csvSafeCell(value).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importProviderPrices(event,statusId,providerId){
    const file=event.target.files?.[0],status=el(statusId);if(!file)return;
    try{
      if(file.size>5000000)throw Error('Archivo demasiado grande: máximo 5 MB.');
      const result=parseProviderTariff(await file.text(),providerId);commitPricing(result.catalog,jobPricing);renderPriceCatalog();invalidateTariffPreview();
      const message=result.imported+' precios importados. '+result.pending+' pendientes de unidad. '+result.omitted+' filas sin precio omitidas. La obra no cambia: revisa «Actualizar con tarifa actual».';
      if(status)status.textContent=message;pricingStatus(message);
    }catch(err){if(status)status.textContent='No se ha importado: '+err.message;pricingStatus(err.message,true);}finally{event.target.value='';}
  }
  on(el('supplierForm'),'submit',event=>{
    event.preventDefault();
    try{
      const catalog=clonePricing(priceCatalog),provider=ensureProvider(catalog,el('supplierName').value);commitPricing(catalog,jobPricing);renderPriceProviders();
      el('catalogProvider').value=provider.id;el('tariffProvider').value=provider.id;el('catalogImportProvider').value=provider.id;el('supplierName').value='';renderPriceCatalog();pricingStatus('Proveedor disponible: '+provider.name+'.');
    }catch(err){pricingStatus(err.message,true);}
  });
  on(el('tariffForm'),'submit',event=>{
    event.preventDefault();
    try{
      const catalog=clonePricing(priceCatalog),rate=makeMaterialRate(el('tariffProvider').value,el('tariffPrice').value,{included:el('tariffVatIncluded').value==='yes',vat:el('tariffVat').value,reference:el('tariffReference').value,updatedAt:el('tariffDate').value||null});
      upsertMaterialRate(catalog,el('tariffMaterial').value,el('tariffUnit').value,rate);
      if(editingPendingRate)catalog.pendingRates=catalog.pendingRates.filter(p=>p.name!==editingPendingRate.name||p.rate.providerId!==editingPendingRate.providerId);
      commitPricing(catalog,jobPricing);resetTariffEditor();renderPriceCatalog();invalidateTariffPreview();pricingStatus('Precio guardado en el catálogo. Los presupuestos existentes conservan sus precios.');
    }catch(err){pricingStatus(err.message,true);}
  });
  on(el('tariffReset'),'click',resetTariffEditor);
  on(el('tariffVatIncluded'),'change',syncTariffVat);
  on(el('catalogProvider'),'change',renderPriceCatalog);
  on(el('catalogSearch'),'input',renderPriceCatalog);
  on(el('catalogCsv'),'change',event=>importProviderPrices(event,'catalogCsvStatus',el('catalogImportProvider')?.value||'general'));
  on(el('jobProvider'),'change',()=>{
    try{const pricing=clonePricing(jobPricing);pricing.defaultProviderId=el('jobProvider').value;commitPricing(priceCatalog,pricing);renderList();pricingStatus('Proveedor para materiales nuevos actualizado. Las líneas existentes no cambian hasta que lo indiques.');}catch(err){pricingStatus(err.message,true);renderPriceProviders();}
  });
  on(el('previewTariff'),'click',showTariffPreview);
  on(el('updateTariffProvider'),'change',invalidateTariffPreview);
  on(el('catalogCsvTemplate'),'click',()=>{
    const rows=[['material','unidad','precio','proveedor','referencia','fecha','iva_incluido','iva']];
    priceCatalog.materials.forEach(m=>rows.push([m.name,m.unit,'',providerName(el('catalogImportProvider')?.value||'general'),'','','no','']));
    downloadTariffCsv(rows,'plantilla-tarifas.csv');
  });
  on(el('catalogCsvExport'),'click',()=>{
    const rows=[['material','unidad','precio','proveedor','referencia','fecha','iva_incluido','iva']];
    priceCatalog.materials.forEach(m=>m.rates.forEach(r=>rows.push([m.name,m.unit,decimalText(r.price),providerName(r.providerId),r.reference,r.updatedAt||'','no',''])));
    priceCatalog.pendingRates.forEach(p=>rows.push([p.name,'',decimalText(p.rate.price),providerName(p.rate.providerId),p.rate.reference,p.rate.updatedAt||'','no','']));
    downloadTariffCsv(rows,'tarifas-proveedores.csv');
  });
  renderPriceProviders();resetTariffEditor();

  // Recuperar las medidas del último uso sin alterar los presupuestos guardados.
  try{const draft=JSON.parse(localStorage.getItem('calc-form-draft')||'{}');if(data[draft.__cat])currentCat=draft.__cat;else if(draft.wetProduct){const cat=Object.keys(data).find(k=>data[k][draft.wetProduct]);if(cat)currentCat=cat;}if(['porcelanico','pasta_roja','pasta_blanca'].includes(draft.__body))currentCerBody=draft.__body;if(el('wetProduct'))renderProducts();if(el('wetMortarWaste')&&!Object.hasOwn(draft,'wetMortarWaste')&&draft.wetWaste!==undefined)el('wetMortarWaste').value=draft.wetWaste;Object.entries(draft).forEach(([id,v])=>{const node=el(id);if(node&&node.closest('form')&&typeof v==='string')node.value=v;});}catch(e){}
  document.addEventListener('input',saveDraft);
  document.addEventListener('change',saveDraft);
  function saveDraft(e){if(!e.target.closest('form')||!['wall','lining','roof','wet','ceramic'].includes(e.target.closest('.screen')?.id))return;const draft={__cat:currentCat,__body:currentCerBody};$all('form input[id],form select[id]').filter(n=>['wall','lining','roof','wet','ceramic'].includes(n.closest('.screen')?.id)).forEach(n=>draft[n.id]=n.value);persist('calc-form-draft',draft);}

  $all('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===currentCat));
  $all('[data-cer-body]').forEach(b=>b.classList.toggle('active',b.dataset.cerBody===currentCerBody));
  if(el('lType'))setLiningType(el('lType').value);
  if(el('rSys'))setRoofSys(el('rSys').value);
  fillJobFields();
})();

