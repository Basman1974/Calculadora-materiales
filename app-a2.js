  const PLACO_HEIGHT_WALL = {
    600:{48:{s:{a15:2.60,b15:3.05,a18:2.85,b18:3.40},d:{a15:3.00,b15:3.60,a18:3.40,b18:4.05}},70:{s:{a15:3.20,b15:3.85,a18:3.60,b18:4.30},d:{a15:3.80,b15:4.55,a18:4.25,b18:5.10}},90:{s:{a15:3.70,b15:4.45,a18:4.15,b18:5.00},d:{a15:4.45,b15:5.30,a18:4.95,b18:5.95}}},
    400:{48:{s:{a15:2.80,b15:3.35,a18:3.15,b18:3.75},d:{a15:3.35,b15:4.00,a18:3.75,b18:4.45}},70:{s:{a15:3.55,b15:4.25,a18:3.95,b18:4.75},d:{a15:4.20,b15:5.05,a18:4.75,b18:5.65}},90:{s:{a15:4.10,b15:4.95,a18:4.60,b18:5.50},d:{a15:4.90,b15:5.90,a18:5.50,b18:6.55}}}
  };
  const PLACO_HEIGHT_LINING = {
    600:{48:{s:{a15:2.15,a18:2.30,b125:2.55,b15:2.55,b18:2.85},d:{a15:2.55,a18:2.70,b125:3.00,b15:3.00,b18:3.40}},70:{s:{a15:2.70,a18:2.90,b125:3.20,b15:3.20,b18:3.60},d:{a15:3.20,a18:3.45,b125:3.80,b15:3.80,b18:4.25}},90:{s:{a15:3.15,a18:3.35,b125:3.70,b15:3.70,b18:4.10},d:{a15:3.70,a18:4.00,b125:4.45,b15:4.45,b18:4.95}}},
    400:{48:{s:{a15:2.35,a18:2.55,b125:2.80,b15:2.80,b18:3.15},d:{a15:2.80,a18:3.00,b125:3.35,b15:3.35,b18:3.75}},70:{s:{a15:3.00,a18:3.20,b125:3.55,b15:3.55,b18:3.95},d:{a15:3.55,a18:3.80,b125:4.20,b15:4.20,b18:4.70}},90:{s:{a15:3.45,a18:3.70,b125:4.10,b15:4.10,b18:4.60},d:{a15:4.10,a18:4.40,b125:4.90,b15:4.90,b18:5.50}}}
  };
  function wallHeightKey(layers, thick){ return Number(thick)>=17 ? (layers>=2?'b18':'a18') : (layers>=2?'b15':'a15'); }
  function liningHeightKey(layers, thick){
    const t=Number(thick)||15;
    if(layers>=2) return t<14?'b125':(t>=17?'b18':'b15');
    if(t<14) return null;
    return t>=17?'a18':'a15';
  }
  function placoLimit(kind, spacing, profile, doubled, layers, thick){
    const table=kind==='wall'?PLACO_HEIGHT_WALL:PLACO_HEIGHT_LINING;
    const key=kind==='wall'?wallHeightKey(layers,thick):liningHeightKey(layers,thick);
    if(!key) return null;
    return table[spacing]&&table[spacing][profile]&&table[spacing][profile][doubled?'d':'s'] ? table[spacing][profile][doubled?'d':'s'][key] : null;
  }
  function choosePlacoHeight(kind,H,profile,spacing,layers,thick){
    const p0=Number(profile), s0=Number(spacing)<=.4?400:600;
    const candidates=[];
    const add=(p,s,d)=>{const limit=placoLimit(kind,s,p,d,layers,thick);if(limit!=null)candidates.push({profile:p,spacing:s,double:d,limit:limit});};
    add(p0,s0,false); add(p0,s0,true);
    if(s0===600){add(p0,400,false);add(p0,400,true);}
    [48,70,90].filter(p=>p>p0).forEach(p=>{add(p,s0,false);add(p,s0,true);if(s0===600){add(p,400,false);add(p,400,true);}});
    const ok=candidates.find(x=>H<=x.limit+0.0001);
    return ok||null;
  }
  function profileSegments(height, profile){
    const overlap={48:.25,70:.35,90:.45}[Number(profile)]||.35;
    let n=1;
    while(n*3-overlap*Math.max(0,n-1)<height && n<5)n++;
    return {segments:n,overlap:overlap};
  }
  function rowConfidence(row){
    const text=((row&&row[0])+' '+(row&&row[2]||'')).toLowerCase();
    if(/fuera de tabla|revisar|verificar|obligatoria|no dimensionad/.test(text)) return {c:'review',t:'REVISAR'};
    if(/tabla técnica|une |une-|ficha/.test(text)) return {c:'estimate',t:'REFERENCIA ORIENTATIVA'};
    return {c:'estimate',t:'ESTIMACIÓN'};
  }
  function resultHTML(title, meta, rows, canAdd=true, options={}){
    const missing=options.showPending?rows.filter(row=>/no dimensionados/i.test(row[1])):[];
    const pending=partNeedsReview({title,items:rows,calculationVersion:CALCULATION_VERSION});
    const conditionalHeight=rows.some(row=>row[0]==='Comprobación de altura');
    const warning=pending?'Hay elementos sin dimensionar o un despiece pendiente. El presupuesto será provisional.':conditionalHeight?'Altura orientativa según tabla del sistema. Confirma perfiles, placas y condiciones: este cálculo no acredita la validez de perfiles genéricos.':'';
    const quick=rows.filter(x=>!isTechnicalRow(x)||missing.includes(x));
    const quickHtml=quick.map(x=>missing.includes(x)?
      '<div class="quickPending"><div class="quickLine"><span>'+esc(x[0])+'</span><strong>Pendiente de calcular</strong></div><p>'+esc(x[2]||'Completa los datos del sistema para calcular este material.')+'</p></div>':
      '<div class="quickLine"><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong></div>').join('');
    const completion=missing.length?'<div class="roofCompletion" role="status"><b>Faltan cantidades en este despiece</b><p>'+esc(missing[0][2])+'</p>'+
      (options.actions||[]).map(action=>'<button class="btn" type="button" data-roof-complete="'+esc(action.field)+'">'+esc(action.label)+'</button>').join('')+
      '<p class="small">El presupuesto será provisional. Los elementos pendientes aparecen en la lista. Puedes guardar el despiece para completarlo después.</p></div>':'';
    const tech=rows.map(x=>{const q=rowConfidence(x);return '<div class="row"><div class="rowName">'+esc(x[0])+' <span class="trust '+q.c+'">'+q.t+'</span></div><div class="rowVal">'+esc(x[1])+'</div>'+(x[2]?'<div class="rowDetail">'+esc(x[2])+'</div>':'')+'</div>';}).join('');
    return '<div class="resultHead"><div class="eyebrow">'+(missing.length?'DESPIECE INCOMPLETO':'MATERIALES CALCULADOS')+'</div><div class="resultTitle">'+esc(title)+'</div><div class="resultMeta">'+esc(meta)+'</div></div>'+
      completion+(!completion&&warning?'<div class="info" role="status">'+esc(warning)+'</div>':'')+'<div class="quickResult">'+quickHtml+'</div>'+
      '<details class="techDetails"><summary>Ver cálculo técnico, fórmulas y fuentes</summary><div class="groupHead">DETALLE TÉCNICO</div>'+tech+'</details>'+
      (canAdd?'<div class="workZoneWrap"><label>Estancia / zona<input class="workZone" placeholder="Ej. Baño principal"></label></div>'+
      '<div class="actions"><button class="btn addWork" type="button">Añadir a Obra</button></div>':'');
  }
  function bindAdd(node, obj){
    if(!node) return;
    const b=node.querySelector('.addWork');
    if(b) b.onclick=e=>{
      const section=node.closest('.screen');
      const values={}; section.querySelectorAll('input[id],select[id],textarea[id]').forEach(x=>values[x.id]=x.value);
      const z=node.querySelector('.workZone');
      const copy=Object.assign({},obj,{calculationVersion:CALCULATION_VERSION,zone:(z&&z.value.trim())||'General',editor:{screen:section.id,values,cat:currentCat,body:currentCerBody}});
      if(editingPart!==null){work[editingPart]=copy;editingPart=null;}else work.push(copy);
      freezeJobPrices();saveWork(); b.textContent='Guardado en Obra';
    };
    if(b&&editingPart!==null){b.textContent='Guardar cambios';const z=node.querySelector('.workZone');if(z)z.value=work[editingPart]?.zone||'';}
  }

  function sketchLegend(items){
    const names={board:'Placa PYL',metal:'Perfilería',wool:'Lana mineral',support:'Soporte / muro',adhesive:'Pasta / adhesivo',hang:'Suspensión',tile:'Placa registrable',rope:'Estopa'};
    return '<div class="sketchLegend">'+items.map(k=>'<span><i class="skKey skKey-'+k+'"></i>'+names[k]+'</span>').join('')+'</div>';
  }
  function sketchShell(title,sub,svg){
    return '<div class="sketchHead"><div><strong>'+title+'</strong><span>'+sub+'</span></div><span class="sketchBadge">DETALLE</span></div><div class="sketchCanvas techDrawing">'+svg+'</div><div class="sketchNote">Esquema técnico simplificado basado en documentación técnica del sistema. Verificar siempre la solución concreta.</div>';
  }
  const MOUNT_SPRITE_CROPS={
    'assets/montaje-directo.svg':[252,0,218,482],
    'assets/montaje-semidirecto.svg':[477,0,243,482],
    'assets/montaje-autoportante.svg':[0,489,370,279],
    'assets/montaje-techo-simple.svg':[375,489,345,279],
    'assets/montaje-techo-doble.svg':[0,773,382,307],
    'assets/montaje-techo-sierra.svg':[387,773,333,307]
  };
  function mountingGraphic(path,title){
    if(path==='assets/montaje-tabique.svg'){
      const src=path+'?v=20261001-tabique-referencia';
      return '<a class="wallReferenceLink" href="'+src+'" target="_blank" rel="noopener" aria-label="Ampliar imagen del montaje de tabique"><img class="mountingSheetImg" src="'+src+'" alt="Tabique de placas de yeso a ambas caras con montantes, canales, lana mineral, juntas y sellado acústico" loading="lazy" decoding="async"><span>Ampliar imagen ↗</span></a>';
    }
    const crop=MOUNT_SPRITE_CROPS[path];
    if(crop){
      if(window.MOUNT_SPRITE && window.MOUNT_SPRITE.length===73032){
        const x=crop[0],y=crop[1],w=crop[2],h=crop[3];
        return '<svg class="mountingSheetImg mountingSprite" viewBox="'+x+' '+y+' '+w+' '+h+'" role="img" aria-label="'+title+'" preserveAspectRatio="xMidYMid meet">'+
          '<image href="data:image/webp;base64,'+window.MOUNT_SPRITE+'" x="0" y="0" width="720" height="1080"/>'+
        '</svg>';
      }
      return '<img class="mountingSheetImg" src="'+path+'?v=20261007-montajes" alt="'+esc(title)+'">';
    }
    return '<img class="mountingSheetImg" src="'+path+'?v=20260927-fiximg1" alt="'+title+'" loading="lazy" decoding="async">';
  }
  function mountingSheet(path,title,sub,detail){
    return '<div class="sketchHead"><div><strong>'+title+'</strong><span>'+sub+'</span></div><span class="sketchBadge">MONTAJE</span></div>'+
      '<div class="mountingSheetWrap">'+mountingGraphic(path,title)+'</div>'+
      '<div class="mountingCurrent">'+detail+'</div>'+
      '<div class="sketchNote">Ejemplo de montaje visual. La configuración calculada aparece debajo de la lámina.</div>';
  }
  function renderWallSketch(a,b,p,sp,wool){
    const box=el('wallSketch'); if(!box) return;
    box.innerHTML=mountingSheet('assets/montaje-tabique.svg','Tabique PYL '+a+'+'+b,'Ejemplo de montaje','Configuración actual · M'+p+' · '+Math.round(sp*1000)+' mm · '+(wool?'con lana mineral':'sin lana mineral'));
    box.querySelector('.sketchNote').textContent='Imagen de referencia: las capas y la lana del dibujo no varían con los selectores. Para el pedido se utiliza la configuración actual.';
  }
  function renderLiningSketch(t,l,p,sp,wool){
    const box=el('liningSketch'); if(!box) return;
    let path='assets/montaje-autoportante.svg',title='Trasdosado autoportante',sub='Canal + montante independiente del muro',detail='M'+p+' · '+Math.round(sp*1000)+' mm · '+l+' placa'+(l>1?'s':'');
    if(t==='direct'){
      path='assets/montaje-directo.svg'; title='Trasdosado directo'; sub='Placa adherida al soporte · sin perfilería'; detail='1 placa · pasta de agarre · sin modulación';
    }else if(t==='semi'){
      path='assets/montaje-semidirecto.svg'; title='Trasdosado semidirecto'; sub='Maestra / omega fijada al soporte'; detail=Math.round(sp*1000)+' mm · '+l+' placa'+(l>1?'s':'')+' · '+(wool?'con lana mineral':'sin lana mineral');
    }else{
      detail+=' · '+(wool?'con lana mineral':'sin lana mineral');
    }
    box.innerHTML=mountingSheet(path,title,sub,detail);
  }
  function renderRoofSketch(sys){
    const box=el('roofSketch'); if(!box) return;
    const m=roofMeta[sys]||roofMeta.double;
    const paths={
      double:'assets/montaje-techo-doble.svg',
      simple:'assets/montaje-techo-simple.svg',
      sierra:'assets/montaje-techo-sierra.svg',
      cm70:'assets/montaje-techo-biapoyado.svg',
      desmontable60:'assets/montaje-registrable-60.svg',
      desmontable120:'assets/montaje-registrable-120.svg',
      escayola:'assets/montaje-escayola.svg'
    };
    box.innerHTML=mountingSheet(paths[sys]||'assets/montaje-techo.svg',m.name,m.famName,m.hint);
  }

  function updateWallOverview(){
    const ids=['wL','wH','wDoors','wWins','wEdges','wLabor',...(el('wMembrane')?.value!=='none'?['wMembraneWaste']:[])];
    const valid=ids.every(id=>{const text=String(el(id)?.value??'').trim(),n=Number(text.replace(',','.'));return el(id)?.checkValidity()&&text!==''&&Number.isFinite(n)&&n>=0&&(!['wL','wH'].includes(id)||n>0)&&(!['wDoors','wWins'].includes(id)||Number.isInteger(n));});
    const gross=num('wL')*num('wH'),holes=openingsM2(num('wDoors'),num('wWins'));
    if(el('wallMeasureSummary'))el('wallMeasureSummary').textContent=valid&&holes<=gross?decimalText(num('wL'))+' × '+decimalText(num('wH'))+' m · '+money(gross)+' m² brutos · '+money(gross-holes)+' m² netos':'Revisa los datos señalados para calcular los materiales.';
    const membrane=el('wMembrane')?.value||'none';
    if(el('wallSystemSummary'))el('wallSystemSummary').textContent=num('wA')+'+'+num('wB')+' placas · '+boardTypeLabel('wBoardType')+' '+decimalText(num('wBoardThick'))+' mm · M'+num('wP')+' cada '+Math.round(num('wS')*1000)+' mm · '+(el('wWool')?.value==='0'?'sin lana':'con lana mineral')+' · '+({none:'sin lámina acústica','1':'lámina en cara 1','2':'lámina en cara 2',both:'lámina en ambas caras'}[membrane]||'sin lámina acústica')+(membrane!=='none'?' (merma '+decimalText(num('wMembraneWaste'))+' %)':'');
    if(el('wallOpeningsSummary'))el('wallOpeningsSummary').textContent=['wDoors','wWins','wEdges'].every(id=>el(id)?.checkValidity())&&!openingSurfaceError()?(num('wDoors')+' puerta(s) · '+num('wWins')+' ventana(s) · '+decimalText(num('wEdges'))+' m de aristas'):'Revisar datos';
    if(el('wallLaborSummary'))el('wallLaborSummary').textContent=el('wLabor')?.checkValidity()? (num('wLabor')?decimalText(num('wLabor'))+' €/m²':'Sin añadir'):'Revisar precio';
    $all('[data-wall-preset]').forEach(button=>{
      const p=button.dataset.wallPreset,d=p==='doble',wet=p==='bano';
      const active=num('wA')===(d?2:1)&&num('wB')===(d?2:1)&&num('wP')===70&&num('wS')===(wet?0.4:0.6)&&num('wBoardThick')===15&&el('wBoardType')?.value===(wet?'hidro':'normal')&&el('wWool')?.value==='1';
      button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);
    });
    return valid&&holes<=gross;
  }
  function openingSurfaceError(){return openingsM2(num('wDoors'),num('wWins'))>num('wL')*num('wH');}
  function syncWallMembrane(){
    const select=el('wMembrane');if(!select)return 0;
    const allowed={none:true,'1':num('wA')>=2,'2':num('wB')>=2,both:num('wA')>=2&&num('wB')>=2};
    Array.from(select.options).forEach(option=>{option.disabled=!allowed[option.value];});
    if(!allowed[select.value])select.value='none';
    const faces=select.value==='both'?2:(select.value==='none'?0:1);
    el('wMembraneWasteWrap')?.classList.toggle('hidden',!faces);return faces;
  }
  function calcWall(){
    const membraneFaces=syncWallMembrane();
    const openingError=openingSurfaceError()?'Los huecos superan la superficie del tabique.':'';
    if(el('wallOpeningsError')){el('wallOpeningsError').textContent=openingError;el('wallOpeningsError').hidden=!openingError;}
    const valid=validCalculation('wallResult',[['wL',0.000001],['wH',0.000001],['wA',1,true],['wB',1,true],['wDoors',0,true],['wWins',0,true],['wEdges'],['wLabor'],...(membraneFaces?[['wMembraneWaste']]:[])],openingError);
    if(!membraneFaces&&el('wMembraneWasteError'))el('wMembraneWasteError').hidden=true;
    updateWallOverview();
    if(!valid){if(el('wallHeightNotice'))el('wallHeightNotice').textContent='Hay datos pendientes de corregir. No se pueden añadir estos materiales a la obra.';return;}
    const L=num('wL'),H=num('wH'),A=L*H,a=num('wA'),b=num('wB'),sp=num('wS')||.6,p=num('wP'),thick=num('wBoardThick')||15;
    const jambs=jambStuds(num('wDoors'),num('wWins')), holes=openingsM2(num('wDoors'),num('wWins')), net=netArea(A,holes);
    const membrane=el('wMembrane');
    const membraneWaste=num('wMembraneWaste');
    const membraneArea=net*membraneFaces*(1+membraneWaste/100);
    if(el('wMembraneWasteWrap')) el('wMembraneWasteWrap').classList.toggle('hidden',!membraneFaces);
    if(el('wMembraneHint')) el('wMembraneHint').textContent=membraneFaces
      ? 'Lámina: '+membraneArea.toFixed(2)+' m² · '+net.toFixed(2)+' m² netos × '+membraneFaces+' cara(s) × (1 + '+membraneWaste+' %). Introduce el precio por m² en el presupuesto. La merma no incluye un solape de producto predeterminado.'
      : 'Sin lámina en el presupuesto. Solo se puede seleccionar en caras con dos placas; si quitas una placa, la selección incompatible se desactiva.';
    const board=bestPylBoard(H),kind=boardTypeLabel('wBoardType'),layersGov=Math.min(a,b);
    const structural=choosePlacoHeight('wall',H,p,sp,layersGov,thick);
    if(el('wallHeightNotice'))el('wallHeightNotice').textContent=!structural?'Altura fuera de tabla: la estructura no está dimensionada. Requiere revisión técnica.':((structural.profile!==p||structural.spacing!==Math.round(sp*1000)||structural.double)?'El resultado propone M'+structural.profile+' '+(structural.double?'doble H/cajón':'simple')+' cada '+structural.spacing+' mm para esta altura. ':'')+'La comprobación de altura es condicional al sistema y sus perfiles; revisa los avisos del resultado.';
    const useP=structural?structural.profile:p, useSp=structural?structural.spacing/1000:sp, doubled=!!(structural&&structural.double);
    const axes=Math.ceil(L/useSp)+1+jambs, mult=doubled?2:1, seg=profileSegments(H,useP), totalStudBars=axes*mult*seg.segments;
    const totalLayers=a+b,plateUds=Math.ceil(net*totalLayers/board.area*1.08),bandNeed=2*L+2*H;
    const finish=mergeFaceWork([pylFaceWork(net,a,thick),pylFaceWork(net,b,thick)]);
    const rows=[
      ['Placa PYL '+kind+' '+thick.toString().replace('.',',')+' mm · '+board.label,plateUds+' uds','UNE-EN 520 · '+kind+' · altura '+H.toFixed(2)+' m · '+board.note+' · merma 8 % · cara 1: '+a+' · cara 2: '+b+' · neto '+net.toFixed(2)+' m²']
    ];
    if(membraneFaces) rows.push(['Lámina acústica entre placas',membraneArea.toFixed(2)+' m²',net.toFixed(2)+' m² netos × '+membraneFaces+' cara(s) · '+(membrane.value==='both'?'ambas caras':'cara '+membrane.value)+' · merma '+membraneWaste+' % · precio por m² a introducir']);
    if(structural){
      const mode=doubled?'doble H/cajón':'simple';
      rows.push(['Comprobación de altura',H.toFixed(2)+' m ≤ '+structural.limit.toFixed(2)+' m','Tabla condicional: perfiles del sistema de 0,60 mm, comprobar inercia y compatibilidad · M'+useP+' · '+structural.spacing+' mm · '+mode+' · gobierna la cara menos revestida: '+layersGov+' capa(s) de '+thick.toString().replace('.',',')+' mm']);
      rows.push(['Montante M'+useP+(doubled?' doble H/cajón':''),totalStudBars+' barras de 3 m',axes+' ejes/jambas × '+mult+' perfil(es) por eje × '+seg.segments+' tramo(s) · solape mínimo '+Math.round(seg.overlap*100)+' cm cuando haya prolongación']);
    }else{
      rows.push(['ALTURA FUERA DE TABLA','Requiere sistema de gran altura','No hay combinación M48/M70/M90 · 400/600 mm · simple/H-cajón que cumpla '+H.toFixed(2)+' m con '+layersGov+' capa(s) de '+thick.toString().replace('.',',')+' mm. Revisar documentación técnica específica del sistema.']);
      rows.push(['Montantes','No dimensionados','No se genera una cantidad estructural falsa fuera de la tabla verificada.']);
    }
    rows.push(['Canal R'+useP,Math.ceil(2*L/3)+' barras','UNE-EN 14195 · suelo y techo · barra 3 m']);
    rows.push.apply(rows,pylJoinRows(finish));
    rows.push(mmRow(A,'wall'));
    rows.push(['Banda acústica',bandNeed.toFixed(1)+' m · '+Math.ceil(bandNeed/30)+' rollo(s) de 30 m','Estimación orientativa · perímetro de canales y arranques']);
    rows.push(tacoRow(L,2));
    const useWool=el('wWool')?el('wWool').value!=='0':true;
    if(useWool)rows.push(woolRow(net,woolThick(useP,'wall'),'wall'));
    if(holes)rows.push(['Huecos descontados',holes.toFixed(2)+' m²',(num('wDoors')||0)+' puerta(s) 0,80×2,10 · '+(num('wWins')||0)+' ventana(s) 1,20×1,20 · restan placa, pasta, cinta y lana']);
    if(num('wEdges'))rows.push(cornerBeadRow(num('wEdges')));
    const lab=laborRow(net,num('wLabor'),'tabique');if(lab)rows.push(lab);
    const obj={title:'Tabique PYL · '+kind+' · '+A.toFixed(2)+' m²',items:rows,area:A,net:net};
    renderWallSketch(a,b,useP,useSp,useWool);
    const box=el('wallResult');
    const metaStruct=structural?' · M'+useP+' '+(doubled?'doble H/cajón':'simple')+' @'+structural.spacing+' · límite '+structural.limit.toFixed(2)+' m':' · FUERA DE TABLA';
    if(box){box.innerHTML=resultHTML(obj.title,'Familia Tabique PYL · UNE 102043'+metaStruct+(useWool?' · lana '+woolThick(useP,'wall')+' mm':'')+' · neto '+net.toFixed(2)+' m²',rows);bindAdd(box,obj);}
  }
  on(el('wallForm'),'submit',e=>{
    e.preventDefault();calcWall();
    const invalid=[...el('wallForm').querySelectorAll('input,select')].find(input=>!input.checkValidity());
    if(invalid){focusInput(invalid);invalid.reportValidity();return;}
    if(!el('wallOpeningsError')?.hidden){focusInput(el('wDoors'));return;}
    el('wallResult')?.scrollIntoView?.({block:'start',behavior:'auto'});
  });
  ['wA','wB','wP','wS','wBoardThick','wWool','wBoardType','wDoors','wWins','wLabor'].forEach(id=>on(el(id),'change',calcWall));
  on(el('wMembrane'),'change',calcWall);
  ['wL','wH','wDoors','wWins','wEdges','wLabor','wMembraneWaste'].forEach(id=>on(el(id),'input',calcWall));
  ['wL','wH'].forEach((id,index)=>on(el(id),'keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();if(index===0)focusInput(el('wH'));else{el(id).blur?.();el('wallForm').requestSubmit?.();}}));
  document.addEventListener('change', e => {
    const id=e.target && e.target.id;
    if(['wA','wB','wP','wS','wBoardThick','wWool','wBoardType'].includes(id)) calcWall();
  });
  $all('[data-wall-preset]').forEach(btn=>on(btn,'click',()=>{
    const p=btn.dataset.wallPreset;
    const set=(id,v)=>{if(el(id)) el(id).value=String(v);};
    if(p==='vivienda'){set('wA',1);set('wB',1);set('wP',70);set('wS',.6);set('wBoardThick',15);set('wBoardType','normal');set('wWool',1);}
    if(p==='bano'){set('wA',1);set('wB',1);set('wP',70);set('wS',.4);set('wBoardThick',15);set('wBoardType','hidro');set('wWool',1);}
    if(p==='doble'){set('wA',2);set('wB',2);set('wP',70);set('wS',.6);set('wBoardThick',15);set('wBoardType','normal');set('wWool',1);}
    calcWall();saveDraft({target:el('wA')});
  }));

  function singleFaceMembrane(prefix, eligible, net){
    const select=el(prefix+'Membrane');
    if(!select) return null;
    select.disabled=!eligible;
    if(!eligible) select.value='0';
    const active=eligible&&select.value==='1', waste=num(prefix+'MembraneWaste');
    const area=net*(1+waste/100);
    el(prefix+'MembraneWasteWrap').classList.toggle('hidden',!active);
    el(prefix+'MembraneHint').textContent=active
      ? 'Lámina: '+area.toFixed(2)+' m² · '+net.toFixed(2)+' m² netos × (1 + '+waste+' %). Una lámina entre las dos placas. Introduce el precio por m² en el presupuesto.'
      : eligible?'Sin lámina en el presupuesto. Puedes añadir una lámina entre las dos placas.'
      :'Disponible solo con doble placa PYL. Al cambiar a una placa o a otro material se desactiva.';
    return active?['Lámina acústica entre placas',area.toFixed(2)+' m²',net.toFixed(2)+' m² netos · una lámina entre dos placas · merma '+waste+' % · precio por m² a introducir']:null;
  }
  function syncLiningControls(){
    const type=el('lType').value,direct=type==='direct';
    for(const [id,hidden]of [['lLayersWrap',direct],['lProfileWrap',type!=='auto'],['lSpacingWrap',direct],['lWoolWrap',direct],['lPasteRateWrap',!direct]])el(id)?.classList.toggle('hidden',hidden);
  }
  function updateLiningOverview(valid,structural){
    const type=el('lType').value,direct=type==='direct',layers=direct?1:num('lLayers'),area=num('lL')*num('lH'),holes=openingsM2(num('lDoors'),num('lWins'));
    setOverview('liningMeasureSummary',valid?inputNumberText('lL')+' × '+inputNumberText('lH')+' m · '+money(area)+' m² brutos · '+money(area-holes)+' m² netos':'Revisa los datos señalados para calcular los materiales.');
    setOverview('liningSystemSummary',({direct:'Directo · placas adheridas, sin perfilería',semi:'Semidirecto · perfiles omega',auto:'Autoportante · M'+inputNumberText('lP')})[type]+' · '+layers+' placa(s) '+boardTypeLabel('lBoardType')+' '+inputNumberText('lBoardThick')+' mm'+(direct?' · pasta '+inputNumberText('lPasteRate')+' kg/m² configurados':' · separación '+Math.round(num('lS')*1000)+' mm · '+(el('lWool').value==='0'?'sin lana':'con lana mineral')+' · '+(el('lMembrane').value==='1'?'con lámina (merma '+inputNumberText('lMembraneWaste')+' %)':'sin lámina')));
    setOverview('liningOpeningsSummary',inputNumberText('lDoors')+' puerta(s) · '+inputNumberText('lWins')+' ventana(s) · '+inputNumberText('lEdges')+' m de aristas · merma '+inputNumberText('lWaste')+' %');
    setOverview('liningLaborSummary',num('lLabor')?inputNumberText('lLabor')+' €/m² sin IVA':el('lLabor').checkValidity()?'Sin añadir':'Revisar precio');
    const notice=direct?'Pasta de agarre: consumo aproximado configurable; comprueba producto y soporte.':type==='semi'?'Verifica la compatibilidad de omega, aislamiento, placa y fijaciones del sistema.':!structural?'Altura o configuración fuera de tabla: montantes sin dimensionar. Presupuesto provisional.':((structural.profile!==num('lP')||structural.spacing!==Math.round(num('lS')*1000)||structural.double)?'El resultado propone M'+structural.profile+' '+(structural.double?'doble H/cajón':'simple')+' cada '+structural.spacing+' mm. ':'')+'La comprobación de altura es condicional: verifica los perfiles y condiciones del sistema.';
    setOverview('liningTechnicalNotice',valid?notice:'Hay datos por corregir. No se pueden añadir estos materiales a la obra.');
  }
  function calcLining(){
    syncLiningControls();
    const eligible=el('lType').value!=='direct'&&num('lLayers')>=2;
    const membraneRow=singleFaceMembrane('l',eligible,netArea(num('lL')*num('lH'),openingsM2(num('lDoors'),num('lWins'))));
    if(!validCalculation('liningResult',[['lL',0.000001],['lH',0.000001],...(el('lType').value!=='direct'?[['lLayers',1,true]]:[]),['lDoors',0,true],['lWins',0,true],['lEdges'],['lWaste'],['lLabor'],...(membraneRow?[['lMembraneWaste']]:[]),...(el('lType').value==='direct'?[['lPasteRate',0.000001]]:[])],openingsM2(num('lDoors'),num('lWins'))>num('lL')*num('lH')?'Los huecos superan la superficie del trasdosado.':'','lDoors')){updateLiningOverview(false);return;}
    const L=num('lL'),H=num('lH'),A=L*H,t=el('lType')?el('lType').value:'auto',l=t==='direct'?1:num('lLayers'),sp=num('lS')||.6,p=num('lP'),thick=num('lBoardThick')||15,waste=Math.max(0,num('lWaste')||0),wf=1+waste/100;
    const holes=openingsM2(num('lDoors'),num('lWins')),net=netArea(A,holes),board=bestPylBoard(H),kind=boardTypeLabel('lBoardType');
    const liningPlates=Math.ceil(net*l/board.area*wf);
    const rows=[['Placa PYL '+kind+' '+thick.toString().replace('.',',')+' mm · '+board.label,liningPlates+' uds','UNE-EN 520 · '+kind+' · altura '+H.toFixed(2)+' m · '+board.note+' · merma '+waste+' % · '+l+' capa(s) · neto '+net.toFixed(2)+' m²']];
    let title='', structural=null, useP=p, useSp=sp, doubled=false;
    if(membraneRow) rows.push(membraneRow);
    if(el('lLayersWrap'))el('lLayersWrap').classList.toggle('hidden',t==='direct');
    if(el('lProfileWrap'))el('lProfileWrap').classList.toggle('hidden',t!=='auto');
    if(el('lSpacingWrap'))el('lSpacingWrap').classList.toggle('hidden',t==='direct');
    if(el('lWoolWrap'))el('lWoolWrap').classList.toggle('hidden',t==='direct');
    if(el('lPasteRateWrap'))el('lPasteRateWrap').classList.toggle('hidden',t!=='direct');
    const finish=mergeFaceWork([pylFaceWork(net,l,thick)]);
    const useWool=t!=='direct'&&el('lWool')&&el('lWool').value!=='0';
    if(t==='direct'){
      title='Trasdosado directo';const pasteRate=el('lPasteRate')?num('lPasteRate'):5,pasteKg=net*pasteRate*wf;rows.push(['Pasta de agarre',Math.ceil(pasteKg/20)+' saco(s) de 20 kg',pasteKg.toFixed(1)+' kg · '+pasteRate.toString().replace('.',',')+' kg/m² configurados · merma '+waste+' % · referencia aproximada, depende del soporte y producto']);
    }else if(t==='semi'){
      title='Trasdosado semidirecto';const o=Math.ceil(L/sp)+1;rows.push(['Perfil omega / auxiliar',o*Math.ceil(H/3)+' barras','UNE-EN 14195 · '+o+' ejes'],tacoRow(H,o,'omega'));if(useWool)rows.push(woolRow(net,woolThick(p,'semi'),'semi'));
    }else{
      title='Trasdosado autoportante';
      structural=choosePlacoHeight('lining',H,p,sp,l,thick);
      if(structural){useP=structural.profile;useSp=structural.spacing/1000;doubled=!!structural.double;}
      const jambs=jambStuds(num('lDoors'),num('lWins')),axes=Math.ceil(L/useSp)+1+jambs,bandNeed=2*L+2*H;
      if(structural){
        const mult=doubled?2:1,seg=profileSegments(H,useP),bars=axes*mult*seg.segments,mode=doubled?'doble H/cajón':'simple';
        rows.push(['Comprobación de altura',H.toFixed(2)+' m ≤ '+structural.limit.toFixed(2)+' m','Tabla condicional de trasdosado sin arriostrar; perfiles del sistema de 0,60 mm, comprobar inercia y compatibilidad · M'+useP+' · '+structural.spacing+' mm · '+mode+' · '+l+' capa(s) de '+thick.toString().replace('.',',')+' mm']);
        rows.push(['Montante M'+useP+(doubled?' doble H/cajón':''),bars+' barras de 3 m',axes+' ejes/jambas × '+mult+' perfil(es) por eje × '+seg.segments+' tramo(s) · solape mínimo '+Math.round(seg.overlap*100)+' cm cuando haya prolongación']);
      }else{
        const bad125=(l===1&&thick<14);
        rows.push(['ALTURA / CONFIGURACIÓN FUERA DE TABLA','Revisar documentación técnica del sistema',bad125?'La tabla cargada no da valor para 1×12,5 mm en trasdosado autoportante.':'No hay combinación M48/M70/M90 · 400/600 mm · simple/H-cajón que cumpla '+H.toFixed(2)+' m con '+l+' capa(s) de '+thick.toString().replace('.',',')+' mm.']);
        rows.push(['Montantes','No dimensionados','No se genera una cantidad estructural falsa fuera de la tabla verificada.']);
      }
      rows.push(['Canal R'+useP,Math.ceil(2*L/3)+' barras','UNE-EN 14195 · suelo y techo'],['Banda acústica',bandNeed.toFixed(1)+' m · '+Math.ceil(bandNeed/30)+' rollo(s) de 30 m','Estimación orientativa · perímetro'],tacoRow(L,2));
      if(useWool)rows.push(woolRow(net,woolThick(useP,'auto'),'auto'));
    }
    if(t!=='direct'){rows.push.apply(rows,pylJoinRows(finish));rows.push(mmRow(A,'lining'));}else rows.push.apply(rows,pylJoinRows(finish).filter(r=>r[0].indexOf('Tornillos')!==0));
    if(holes)rows.push(['Huecos descontados',holes.toFixed(2)+' m²',(num('lDoors')||0)+' puerta(s) · '+(num('lWins')||0)+' ventana(s) · restan placa y acabado']);
    if(num('lEdges'))rows.push(cornerBeadRow(num('lEdges')));
    const lab=laborRow(net,num('lLabor'),'trasdosado');if(lab)rows.push(lab);
    const famNote=t==='direct'?'Familia Trasdosado directo':t==='semi'?'Familia Trasdosado semidirecto':'Familia Trasdosado autoportante';
    const obj={title:title+' · '+kind+' · '+A.toFixed(2)+' m²',items:rows,area:A,net:net};
    updateLiningOverview(true,structural);
    renderLiningSketch(t,l,useP,useSp,useWool);
    const box=el('liningResult');
    const metaStruct=t==='auto'?(structural?' · M'+useP+' '+(doubled?'doble H/cajón':'simple')+' @'+structural.spacing+' · límite '+structural.limit.toFixed(2)+' m':' · FUERA DE TABLA'):t==='semi'?(' · intereje '+Math.round(sp*1000)+' mm'):' · fijación directa sin perfilería';
    if(box){box.innerHTML=resultHTML(obj.title,famNote+' · UNE 102043'+metaStruct+(useWool?' · lana '+woolThick(useP,t==='semi'?'semi':'auto')+' mm':'')+' · neto '+net.toFixed(2)+' m²',rows);bindAdd(box,obj);}
  }
  function setLiningType(t){
    const names = {
      direct:{name:'Trasdosado directo', sub:'Pasta de agarre · sin cámara de lana'},
      semi:{name:'Trasdosado semidirecto', sub:'Omega al paramento · lana 40 mm'},
      auto:{name:'Trasdosado autoportante', sub:'Canal + montante · cámara para lana'}
    };
    if(el('lType')) el('lType').value = t;
    if(t==='direct' && el('lLayers')) el('lLayers').value='1';
    $all('[data-lining-type]').forEach(b => {
      const on = b.dataset.liningType === t;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const meta = names[t] || names.auto;
    const banner = el('liningFamNow');
    if(banner) banner.innerHTML = '<span class="famName">' + meta.name + '</span><span class="famSub">' + meta.sub + '</span>';
    calcLining();
  }
  $all('[data-lining-type]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    setLiningType(btn.dataset.liningType);
    saveDraft({target:el('lType')});
  }));
  on(el('liningForm'), 'submit', e => submitProgressiveCalculation(e,'liningForm','liningResult',calcLining));
  ['lType','lLayers','lS','lP','lBoardThick','lWool','lWaste','lBoardType','lDoors','lWins','lLabor'].forEach(id => on(el(id), 'change', calcLining));
  on(el('lMembrane'),'change',calcLining);
  ['lL','lH','lDoors','lWins','lEdges','lLabor','lPasteRate','lMembraneWaste'].forEach(id => on(el(id), 'input', calcLining));
  const roofMeta = {
    double:{fam:'continuo',famName:'Continuo PYL',name:'Doble TC47',hint:'Primaria + secundaria · 47/500'},
    simple:{fam:'continuo',famName:'Continuo PYL',name:'TC47 simple',hint:'Una estructura 47/500 suspendida'},
    sierra:{fam:'continuo',famName:'Continuo PYL',name:'Sierra + TC47',hint:'Rastrel primario y secundario TC47'},
    cm70:{fam:'continuo',famName:'Continuo PYL',name:'Canal + M70',hint:'Estructura autoportante perimetral'},
    desmontable60:{fam:'registrable',famName:'Registrable T24',name:'Desmontable 60 × 60',hint:'T24 vista · placa 600 × 600'},
    desmontable120:{fam:'registrable',famName:'Registrable T24',name:'Desmontable 60 × 120',hint:'T24 vista · placa 600 × 1200'},
    escayola:{fam:'tradicional',famName:'Tradicional',name:'Escayola con estopa',hint:'Placa fija con estopa al forjado'}
  };
  function setRoofFam(fam, keepSys){
    const f = fam || 'continuo';
    $all('[data-roof-fam]').forEach(b => {
      const on = b.dataset.roofFam === f;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $all('[data-roof-sys]').forEach(b => {
      const match = (b.dataset.fam || 'continuo') === f;
      b.classList.toggle('hidden', !match);
    });
    if(!keepSys){
      const first = $all('[data-roof-sys]').find(b => (b.dataset.fam || 'continuo') === f);
      if(first) setRoofSys(first.dataset.roofSys);
    }
  }
  function setRoofSys(sys){
    const meta = roofMeta[sys] || roofMeta.double;
    if(el('rSys')) el('rSys').value = sys;
    $all('[data-roof-sys]').forEach(b => {
      const on = b.dataset.roofSys === sys;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const now = el('roofSysNow');
    if(now) now.innerHTML = '<span class="sysNowFam">' + meta.famName + '</span><strong>' + meta.name + '</strong><span>' + meta.hint + '</span>';
    if(meta.fam) setRoofFam(meta.fam, true);
    calcRoof();
  }
  $all('[data-roof-fam]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    setRoofFam(btn.dataset.roofFam);
    saveDraft({target:el('rSys')});
  }));
  $all('[data-roof-sys]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    setRoofSys(btn.dataset.roofSys);
    saveDraft({target:el('rSys')});
  }));
  const roofData=window.CALC_ROOF_DATA;
  const roofDefaults={rBoardThick:'12.5',rReference:'f47',rWeight:'',rExtraLoad:'0',rRodMargin:'',rRodStock:'1',rPerimeter:'angle',rFixWaste:'10',rPasteRate:'',rSierraRuns:'',rSierraBar:'',rSierraHangers:'',rGypsumPoints:'',rGypsumFibre:'',rGypsumPaste:''};
  function roofHas(id){return String(el(id)?.value??'').trim()!=='';}
  function roofReferenceWeight(layers,thick,fmt){
    return el('rBoardType').value==='normal'&&fmt[0]===2&&fmt[1]===1.2?roofData.standardWeight[layers+'x'+thick]:undefined;
  }
  function roofCeil(value){const near=Math.round(value);return Math.abs(value-near)<=32*Number.EPSILON*Math.max(1,Math.abs(value))?near:Math.ceil(value);}
  function roofNumber(value){return Number(value.toFixed(6)).toString();}
  function roofUnique(values){return [...new Set(values.map(x=>Number(x.toFixed(9))))].sort((a,b)=>a-b);}
  function roofCuts(length,module,offset=0){
    const values=[0,length];
    for(let x=offset||module;x<length-1e-9;x+=module)if(x>1e-9)values.push(x);
    return roofUnique(values);
  }
  function roofCenteredCuts(length,module){
    const cells=roofCeil(length/module);if(cells<=1)return [0,length];
    const edge=(length-(cells-2)*module)/2;
    return roofUnique([0,length,...Array.from({length:cells-1},(_,i)=>edge+i*module)]);
  }
  function roofAxis(length,gap,edge,extra=[]){
    if(length<=2*edge)return roofUnique([length/2,...extra.filter(x=>x>0&&x<length)]);
    const axis=[edge,length-edge,...extra.filter(x=>x>0&&x<length)];
    for(let x=gap;x<length-edge-1e-9;x+=gap)if(x>edge)axis.push(x);
    return roofUnique(axis);
  }
  function roofHangerAxis(length,gap,edge){
    if(length<=2*edge)return [length/2];
    const intervals=roofCeil((length-2*edge)/gap);
    return Array.from({length:intervals+1},(_,i)=>edge+i*(length-2*edge)/intervals);
  }
  function roofPack(span,axis,bar=3){
    const pieces=roofCeil(span/bar);
    return {runs:axis.length,bars:axis.length*pieces,splices:axis.length*Math.max(0,pieces-1),ml:span*axis.length};
  }
  function roofWallStock(lengths,bar=3){
    let full=0;const tails=[],segments=[];
    for(const length of lengths){
      const count=roofCeil(length/bar),tail=length-(count-1)*bar;
      full+=count-1;for(let i=1;i<count;i++)segments.push(bar);segments.push(tail);
      if(tail>bar-1e-9)full++;else tails.push(tail);
    }
    const bins=[];
    tails.sort((a,b)=>b-a).forEach(tail=>{const i=bins.findIndex(left=>left+1e-9>=tail);if(i<0)bins.push(bar-tail);else bins[i]-=tail;});
    return {bars:full+bins.length,segments};
  }
  function roofPerimeterRows(L,W,sys){
    const perimeter=2*(L+W),t24=sys.startsWith('desmontable'),cm=sys==='cm70',sierra=sys==='sierra';
    if(['simple','double'].includes(sys)&&el('rPerimeter').value==='none')return [['Comprobación de perímetro','Revisar encuentro sin perfil','Encuentro no portante; no se descuentan cuelgues por apoyo en paredes.']];
    const groups=sierra?[{name:'Ángulo perimetral L 30/25',lengths:[Math.max(L,W),Math.max(L,W)]},{name:'Canal perimetral 48 para sierra',lengths:[Math.min(L,W),Math.min(L,W)]}]:[{name:t24?'Ángulo perimetral T24':cm?'Canal R70':el('rPerimeter').value==='clip'?'Perfil perimetral Clip 18':'Ángulo perimetral L 30/25',lengths:[L,L,W,W]}];
    const rows=[];let fixes=0;
    for(const group of groups){
      const stock=roofWallStock(group.lengths);
      rows.push([group.name,stock.bars+' barras de 3 m',roofNumber(group.lengths.reduce((a,b)=>a+b,0))+' m · cortes aprovechados entre paredes, sin unir retales adicionales']);
      for(const segment of stock.segments)fixes+=roofHangerAxis(segment,t24?roofData.t24.perimeterFixing:roofData.perimeterFixing,.1).length;
    }
    rows.push(['Fijaciones del perimetral',cm?'No dimensionados':fixes+' uds',cm?'Definir fijación del apoyo portante mediante tabla y soporte.':'Por cada tramo comercial, paso máximo '+(t24?'450':'600')+' mm; primera y última a 100 mm o menos. Elegir fijación adecuada al soporte.']);
    if(!t24)rows.push(['Banda acústica perimetral',roofNumber(perimeter)+' m · '+roofCeil(perimeter/30)+' rollo(s) de 30 m','Longitud del encuentro con paredes; elegir banda compatible con el perfil.']);
    return rows;
  }
  function empalmeRow(n){return ['Empalme TC47',n+' uds · '+roofCeil(n/50)+' caja(s) de 50','Una pieza compatible por junta de perfil; alternar las juntas.'];}
  function rodRow(hangers,dropCm,marginCm=0,stockM=1){
    const length=(dropCm+marginCm)/100;
    if(!Number.isFinite(length)||length<=0||!Number.isFinite(stockM)||stockM<=0||length>stockM+1e-12)return ['Varilla roscada M6','No dimensionados','La longitud de corte no cabe en la varilla comercial; revisar plenum, margen y montaje.'];
    const ratio=stockM/length,near=Math.round(ratio),cuts=Math.abs(ratio-near)<32*Number.EPSILON*Math.max(1,ratio)?near:Math.floor(ratio);
    return ['Varilla roscada M6 '+roofNumber(stockM)+' m',roofCeil(hangers/cuts)+' uds',hangers+' suspensiones · '+cuts+' corte(s) de '+roofNumber(dropCm+marginCm)+' cm · plenum '+roofNumber(dropCm)+' + margen '+roofNumber(marginCm)+' cm'];
  }
  function roofRodRow(hangers){return roofHas('rRodMargin')?rodRow(hangers,num('rDrop'),num('rRodMargin'),num('rRodStock')):['Varilla roscada M6','No dimensionados','Introduce el margen real de fijación y regulación para determinar la longitud de corte.'];}
  function roofJointLength(rects,span,width){
    const groups=new Map();
    function edge(orientation,coord,a,b,max){if(coord<=1e-9||coord>=max-1e-9)return;const key=orientation+':'+coord.toFixed(9);if(!groups.has(key))groups.set(key,[]);groups.get(key).push([a,b]);}
    for(const r of rects){edge('x',r.x,r.y,r.y+r.h,span);edge('x',r.x+r.w,r.y,r.y+r.h,span);edge('y',r.y,r.x,r.x+r.w,width);edge('y',r.y+r.h,r.x,r.x+r.w,width);}
    let length=0;
    for(const intervals of groups.values()){
      intervals.sort((a,b)=>a[0]-b[0]);let start=intervals[0][0],end=intervals[0][1];
      for(const [a,b]of intervals.slice(1)){if(a<=end+1e-9)end=Math.max(end,b);else{length+=end-start;start=a;end=b;}}length+=end-start;
    }
    return length;
  }
  function roofBoards(span,width,fmt,layers){
    const all=[];const edges=[];
    for(let layer=0;layer<layers;layer++){
      const rects=[],xcuts=roofCuts(span,fmt[1],layer?fmt[1]/2:0);
      for(let col=0;col<xcuts.length-1;col++){
        const ycuts=roofCuts(width,fmt[0],(col+layer)%2?fmt[0]/2:0);edges.push(...ycuts.slice(1,-1));
        for(let row=0;row<ycuts.length-1;row++)rects.push({x:xcuts[col],y:ycuts[row],w:xcuts[col+1]-xcuts[col],h:ycuts[row+1]-ycuts[row]});
      }
      all.push({rects,joints:roofJointLength(rects,span,width)});
    }
    return {layers:all,edges:roofUnique(edges)};
  }
  function roofBuildPlan(sys,L,W,layers,thick,fmt){
    const span=sys==='double'?W:Math.max(L,W),width=sys==='double'?L:Math.min(L,W),boards=roofBoards(span,width,fmt,layers);
    const base=roofHas('rWeight')?num('rWeight'):roofReferenceWeight(layers,thick,fmt);
    const load=base===undefined?null:(base+num('rExtraLoad'))*9.81/1000;
    const limits=load===null?null:roofData.f47[sys]?.find(row=>load<=row.load+1e-12);
    const supported=el('rReference').value==='f47'&&el('rBoardType').value!=='rf'&&[12.5,15].includes(thick)&&!!limits;
    const secondary=roofAxis(width,.5,roofData.profileEdge,boards.edges);
    const primary=sys==='double'?roofAxis(W,.9,roofData.profileEdge):[];
    const hangerSpan=sys==='double'?L:span;
    const hangerAxis=supported?roofHangerAxis(hangerSpan,limits.hanger,roofData.hangerEdge):[];
    const hangers=(sys==='double'?primary.length:secondary.length)*hangerAxis.length;
    return {sourceId:roofData.sourceId,span,width,baseWeight:base??null,extraWeight:num('rExtraLoad'),loadKN:load,limits,supported,secondary,primary,hangerAxis,hangers,boards};
  }
  function roofFinishRows(plan,net,thick,layers,fmt){
    const rows=[],waste=1+num('rFixWaste')/100,rf=el('rBoardType').value==='rf',hard=el('rBoardType').value==='dura';
    if(rf||hard)rows.push(['Tornillos placa-metal específicos','No dimensionados','Definir tornillo y patrón de fijación del sistema RF o placa de alta dureza; no se usa el patrón de pared.']);
    else{
      const pitch=fmt[1]===1.2?.2:.15;
      plan.boards.layers.forEach((layer,index)=>{
        let screws=0;
        for(const r of layer.rects){const supports=plan.secondary.filter(y=>y>=r.y-1e-9&&y<=r.y+r.h+1e-9).length;screws+=supports*roofHangerAxis(r.w,pitch,.01).length;}
        rows.push(['Tornillos '+(index+1)+'.ª placa 3,5 × '+pylScrewLength(thick*(index+1)),roofCeil(screws*waste)+' uds · '+roofCeil(roofCeil(screws*waste)/1000)+' caja(s) de 1.000',screws+' uds geométricas · separación adoptada '+Math.round(pitch*1000)+' mm en todas las capas · merma '+num('rFixWaste')+' % · revisar recortes y fijación real']);
      });
      if(fmt[1]!==1.2)rows.push(['Comprobación de formato','Revisar ficha de placa 600 mm','Se adopta paso conservador 150 mm para estimar la compra; compatibilidad del producto y sistema pendiente de verificar.']);
    }
    const jointLengths=rf?plan.boards.layers.map(layer=>layer.joints):[plan.boards.layers.at(-1).joints];
    const tape=(jointLengths.reduce((a,b)=>a+b,0)+2*(plan.span+plan.width))*waste;
    rows.push(['Cinta de papel para juntas',roofNumber(tape)+' m · '+roofCeil(tape/150)+' rollo(s) de 150 m','Juntas contadas una vez por capa tratada y perímetro; '+(rf?'sistema RF pendiente de validar':'capa visible; relleno de las juntas interiores sin cinta')+' · merma '+num('rFixWaste')+' %']);
    const reference=el('rBoardType').value==='normal'&&thick===12.5&&fmt[0]===2&&fmt[1]===1.2?(layers===1?.3:.5):null;
    const rate=roofHas('rPasteRate')?num('rPasteRate'):reference;
    rows.push(['Pasta de juntas',rate===null?'No dimensionados':roofNumber(net*rate*waste)+' kg · '+roofCeil(net*rate*waste/20)+' saco(s) de 20 kg',rate===null?'Introduce el consumo total por m² según producto y acabado.':rate+' kg/m² del conjunto, antes de merma · '+(roofHas('rPasteRate')?'configurado por el usuario':'media orientativa de la configuración estándar de referencia; verificar efecto del perímetro y acabado')]);
    return rows;
  }
  function updateRoofOverview(valid){
    const sys=el('rSys').value,meta=roofMeta[sys]||roofMeta.double,pyl=meta.fam==='continuo',area=num('rL')*num('rW');
    setOverview('roofMeasureSummary',valid?inputNumberText('rL')+' × '+inputNumberText('rW')+' m · '+money(area)+' m² brutos · '+money(area-num('rHoles'))+' m² netos':'Revisa los datos señalados para calcular los materiales.');
    setOverview('roofSystemSummary',meta.name+(pyl?' · '+num('rLayers')+' placa(s) '+boardTypeLabel('rBoardType')+' '+inputNumberText('rBoardThick')+' mm · '+el('rBoard').value.split(',').map(Number).map(n=>Math.round(n*1000)).join(' × ')+' mm · '+(el('rMembrane').value==='1'?'con lámina':'sin lámina'):'')+(sys==='cm70'?' · autoportante, sin suspensiones':' · descuelgue '+inputNumberText('rDrop')+' cm'));
    setOverview('roofOpeningsSummary',inputNumberText('rHoles')+' m² de huecos · merma '+inputNumberText('rWaste')+' %');
    setOverview('roofLaborSummary',num('rLabor')?inputNumberText('rLabor')+' €/m² sin IVA':el('rLabor').checkValidity()?'Sin añadir':'Revisar precio');
    const reference=roofReferenceWeight(num('rLayers'),num('rBoardThick'),el('rBoard').value.split(',').map(Number));
    setOverview('roofLoadSummary',roofHas('rWeight')?'Conjunto '+inputNumberText('rWeight')+' + adicional '+inputNumberText('rExtraLoad')+' kg/m²':reference===undefined?'Falta el peso del conjunto para esta configuración':'Referencia '+decimalText(reference)+' + adicional '+inputNumberText('rExtraLoad')+' kg/m²');
    setOverview('rWeightHint',reference===undefined?'Esta combinación no tiene un peso de referencia cargado. Introduce el peso de placas y estructura según la ficha del sistema; las cargas adicionales se suman aparte.':'Si dejas el campo vacío se utiliza '+decimalText(reference)+' kg/m² del conjunto de referencia. Confirma que corresponde a tus placas y estructura; puedes sustituirlo por el dato de la ficha.');
    el('rWeight').placeholder=reference===undefined?'Necesario para esta combinación':decimalText(reference)+' kg/m² de referencia';
    setOverview('roofTechnicalNotice',(valid?'':'Hay datos por corregir. ')+(sys==='cm70'?'Sistema autoportante: luz y apoyo pendientes de dimensionar. ':'')+'Despiece de referencia, pendiente de validar con el sistema y soporte reales. El presupuesto será provisional.');
  }
  function calcRoof(){
    if(!roofData?.f47||!el('rBoardThick')){el('roofResult').innerHTML='<div class="info" role="alert">Los recursos de techo están incompletos. Recarga cuando haya conexión para recibir la misma versión de todos los archivos.</div>';return;}
    const sys=el('rSys').value,pyl=roofMeta[sys]?.fam==='continuo',suspended=['simple','double'].includes(sys),t24=sys?.startsWith('desmontable');
    const visible={roofSystemOptions:pyl,roofLoadOptions:suspended,roofSuspensionOptions:suspended,roofFinishingOptions:suspended,roofSierraOptions:sys==='sierra',roofGypsumOptions:sys==='escayola',rPerimeterWrap:suspended,rDropWrap:sys!=='cm70'};
    Object.entries(visible).forEach(([id,on])=>el(id)?.classList.toggle('hidden',!on));
    ['rBoardWrap','rLayersWrap','rBoardTypeWrap','rBoardThickWrap'].forEach(id=>el(id)?.classList.toggle('hidden',!pyl));
    const A=num('rL')*num('rW'),holes=num('rHoles'),net=netArea(A,holes),membrane=singleFaceMembrane('r',pyl&&num('rLayers')>=2,net);
    const rules=[['rL',.000001],['rW',.000001],['rHoles'],['rWaste'],['rLabor'],...(sys!=='cm70'?[['rDrop']]:[]),...(pyl?[['rLayers',1,true],['rBoardThick',.000001]]:[]),...(suspended?[['rExtraLoad'],['rFixWaste']]:[]),...(suspended&&roofHas('rWeight')?[['rWeight',.000001]]:[]),...(suspended?[['rRodStock',.000001],...(roofHas('rRodMargin')?[['rRodMargin']]:[])]:[]),...(suspended&&roofHas('rPasteRate')?[['rPasteRate']]:[]),...(membrane?[['rMembraneWaste']]:[])];
    for(const [id,min,integer]of sys==='sierra'?[['rSierraRuns',1,true],['rSierraBar',.000001],['rSierraHangers',1,true]]:sys==='escayola'?[['rGypsumPoints',1,true],['rGypsumFibre',0],['rGypsumPaste',.000001]]:[])if(roofHas(id))rules.push([id,min,integer]);
    const fmt=el('rBoard').value.split(',').map(Number),layers=num('rLayers'),thick=num('rBoardThick');
    const error=!roofMeta[sys]?'Selecciona un sistema de techo válido.':holes>A?'Los huecos superan la superficie del techo.':pyl&&(![1,2].includes(layers)||![12.5,15,18].includes(thick)||!['2,1.2','2.7,1.2','2,.6'].includes(el('rBoard').value))?'Configuración de placa no disponible.':suspended&&(!['f47','generic'].includes(el('rReference').value)||!['angle','clip','none'].includes(el('rPerimeter').value))?'Selecciona una referencia y un encuentro disponibles.':A>10000||Math.max(num('rL'),num('rW'))>1000?'Paño demasiado grande para el despiece interactivo; divídelo en estancias.':rules.some(([id])=>num(id)>1000000)?'Valor demasiado grande para el cálculo; revisa las unidades.':'';
    if(!validCalculation('roofResult',rules,error,holes>A?'rHoles':'rL')){updateRoofOverview(false);return;}
    const L=num('rL'),W=num('rW'),waste=1+num('rWaste')/100;let rows=[],layout={},title=roofMeta[sys].name,missingWeight=false;
    renderRoofSketch(sys);
    if(t24){
      const grid=roofData.t24,xcuts=roofCenteredCuts(L,.6),ycuts=roofCenteredCuts(W,.6),primary=ycuts.slice(1,-1).filter((_,i)=>i%2===0);
      if(!primary.length)primary.push(W/2);
      const cross=xcuts.slice(1,-1),secondary600=ycuts.slice(1,-1).filter(y=>!primary.some(p=>Math.abs(p-y)<1e-9));
      const hanging=roofHangerAxis(L,grid.hanger,grid.hangerEdge),hangers=primary.length*hanging.length;
      layout={sourceId:grid.sourceId,primary,cross,secondary600,hangerAxis:hanging,hangers};
      rows=[
        [sys==='desmontable60'?'Placa desmontable 600 × 600':'Placa desmontable 600 × 1200',roofCeil(net/(sys==='desmontable60'?.36:.72)*waste)+' uds','Compra por superficie y merma '+num('rWaste')+' %; comprobar cortes de borde y orientación.'],
        ['Perfil T24 primario 3600',primary.length*roofCeil(L/3.6)+' barras',primary.length+' recorridos × '+roofNumber(L)+' m; máximo 1,20 m entre primarios; sin reutilizar recortes con conectores.'],
        ['Perfil T24 secundario 1200',cross.length*(primary.length+1)+' barras',cross.length+' alineaciones × '+(primary.length+1)+' tramos entre primarios y paredes; incluye piezas de borde, sin reutilizar recortes.'],
        ...(sys==='desmontable60'?[['Perfil T24 secundario 600',secondary600.length*(xcuts.length-1)+' barras',secondary600.length+' alineaciones entre primarios × '+(xcuts.length-1)+' tramos; incluye recortes de borde.']]:[]),
        ...roofPerimeterRows(L,W,sys),
        ['Cuelgues T24 completos',hangers+' uds',primary.length+' primarios × '+hanging.length+' cuelgues; paso ≤1200 mm y extremos ≤450 mm. Conjunto completo: no se suma otra fila genérica de varilla o cuelgue.'],
        ['Anclajes al forjado T24',hangers+' uds','Un punto por cuelgue del modelo; seleccionar conjunto y anclaje compatible con soporte y carga.'],
        ['Comprobación de instalaciones','Revisar refuerzos y cuelgues adicionales','El modelo no incluye equipos ni luminarias. Verificar también capacidad del sistema, peso del panel y profundidad mínima de desmontaje.']
      ];
    }else if(sys==='escayola'){
      const pieces=roofCeil(L)*roofCeil(W/.6),points=roofHas('rGypsumPoints')?pieces*num('rGypsumPoints'):null;
      layout={piecesBeforeWaste:pieces,points};
      rows=[['Placa de escayola 1000 × 600',roofCeil(Math.max(pieces,net/.6)*waste)+' uds',pieces+' piezas del replanteo rectangular, sin reutilizar recortes; merma '+num('rWaste')+' %.'],
        ['Fijaciones de estopa',points===null?'No dimensionados':points+' uds',points===null?'Introduce los puntos por pieza según placa y montaje.':pieces+' piezas × '+num('rGypsumPoints')+' puntos/pieza configurados; revisar los recortes.'],
        ['Estopa / fibra vegetal',roofHas('rGypsumFibre')?roofNumber(A*num('rGypsumFibre'))+' kg':'No dimensionados','Consumo introducido según producto y montaje; no se aplica 0,22 kg/m² por defecto.'],
        ['Pasta de escayola',roofHas('rGypsumPaste')?roofCeil(A*num('rGypsumPaste')/20)+' saco(s) de 20 kg':'No dimensionados','Consumo configurado para fijaciones, juntas y acabado; no se aplica 6 kg/m² por defecto.'],
        ['Comprobación de suspensión','Pendiente de dimensionar','Verificar placa, soporte, puntos, longitud y tipo de fijación. No se utiliza el umbral histórico de 25 cm como límite validado.']];
    }else{
      rows=[['Placa PYL '+boardTypeLabel('rBoardType')+' '+roofNumber(thick).replace('.',',')+' mm · '+fmt.map(x=>Math.round(x*1000)).join(' × '),roofCeil(net*layers*waste/(fmt[0]*fmt[1]))+' uds',layers+' capa(s) · neto '+roofNumber(net)+' m² · merma '+num('rWaste')+' % · compra por superficie; comprobar aprovechamiento de cortes.']];
      rows.push(...roofPerimeterRows(L,W,sys));
      const plan=roofBuildPlan(sys,L,W,layers,thick,fmt);layout={sourceId:plan.sourceId,baseWeight:plan.baseWeight,extraWeight:plan.extraWeight,loadKN:plan.loadKN,primary:plan.primary,secondary:plan.secondary,hangerAxis:plan.hangerAxis,hangers:plan.hangers,maxHangerSpacing:plan.limits?.hanger??null,supported:plan.supported,jointLengths:plan.boards.layers.map(layer=>layer.joints)};
      if(suspended){
        missingWeight=plan.loadKN===null&&el('rReference').value==='f47'&&el('rBoardType').value!=='rf'&&[12.5,15].includes(thick);
        rows.push(['Comprobación de carga',plan.loadKN===null?'Peso pendiente de definir':roofNumber(plan.loadKN)+' kN/m²',plan.loadKN===null?'No hay peso de referencia para esta combinación; falta el peso del conjunto según ficha.':'Conjunto '+plan.baseWeight+' + adicional '+plan.extraWeight+' kg/m². '+(roofHas('rWeight')?'Peso del conjunto introducido por el usuario.':'Peso de una variante estándar de referencia; confirmar el peso del conjunto real.')]);
        if(plan.supported){
          const sec=roofPack(plan.span,plan.secondary),prim=sys==='double'?roofPack(L,plan.primary):null;
          if(prim)rows.push(['TC47 primario 3000',prim.bars+' barras',prim.runs+' recorridos × '+roofNumber(L)+' m; separación máxima 900 mm.'],['Crucetas F47/17',prim.runs*sec.runs+' uds','Una pieza de encaje compatible por cruce primario-secundario; no se añaden tornillos metal-metal por un ratio de m².']);
          rows.push([sys==='double'?'TC47 secundario 3000':'TC47 portante 3000',sec.bars+' barras',sec.runs+' recorridos × '+roofNumber(plan.span)+' m; paso máximo 500 mm y perfiles adicionales en juntas de placa.'],empalmeRow(sec.splices+(prim?.splices||0)),
            ['Horquillas / cuelgues Pívot F47/17',plan.hangers+' uds',(sys==='double'?plan.primary.length:plan.secondary.length)+' recorridos × '+plan.hangerAxis.length+' puntos; paso máximo '+roofNumber(plan.limits.hanger*1000)+' mm; extremos a 150 mm o menos.'],
            ['Anclaje universal de suspensión F47/17',plan.hangers+' uds','Una pieza por cuelgue de la configuración de referencia Pívot + universal.'],
            ['Fijaciones al forjado F47/17',plan.hangers*2+' uds','Dos fijaciones por anclaje universal de referencia; elegir fijación según soporte y carga.'],roofRodRow(plan.hangers));
        }else rows.push(['Perfilería y suspensiones TC47','No dimensionados',el('rReference').value==='generic'?'La tabla F47/17 no acredita otra perfilería.':el('rBoardType').value==='rf'?'Selecciona una solución RF ensayada con todos sus componentes.':![12.5,15].includes(thick)?'Espesor fuera de las variantes de referencia cargadas.':plan.loadKN===null?'Introduce el peso del conjunto según ficha.':'Carga fuera del intervalo configurado de hasta 0,30 kN/m². No se extrapolan separaciones.']);
      }else if(sys==='sierra'){
        const count=roofHas('rSierraRuns')&&roofHas('rSierraBar')?num('rSierraRuns')*roofCeil(Math.max(L,W)/num('rSierraBar')):null;
        rows.push(['Perfil sierra',count===null?'No dimensionados':count+' barras de '+roofNumber(num('rSierraBar'))+' m','Recorridos y longitud comercial introducidos según plano; verificar producto, luces, muescas y uniones.'],
          ['TC47 secundario 3000','No dimensionados','Replantear según las muescas y compatibilidad del perfil sierra; no se reutiliza la tabla de doble TC47.'],
          ['Suspensiones sierra',roofHas('rSierraHangers')?num('rSierraHangers')+' uds':'No dimensionados','Cantidad del plano verificado; completar varillas, anclajes y accesorios propios del sistema.'],
          ['Empalmes y fijaciones sierra','No dimensionados','Definir el detalle del producto. No se aplica un ratio de barras ni suspensiones por superficie.']);
      }else rows.push(['Montante M70','No dimensionados','Dimensionar luz, modulación, placas y cargas mediante tabla del sistema.'],['Fijaciones y uniones M70','No dimensionados','Definir apoyos, anclajes y uniones; no se utilizan tornillos por un ratio de superficie.'],['Comprobación de luz','Verificar tabla técnica D13','Sistema autoportante sin horquillas ni varillas; no se dimensiona mediante el descuelgue.']);
      if(suspended&&plan.supported)rows.push(...roofFinishRows(plan,net,thick,layers,fmt));
      else rows.push(['Tornillos y tratamiento de juntas','No dimensionados','Definir la estructura, fijación y tratamiento del sistema para completar los auxiliares.']);
      if(el('rMembrane').value==='1')rows.push(['Comprobación de lámina acústica','Verificar peso y compatibilidad','Incluye el peso de la lámina en la carga adicional si no forma parte del peso del conjunto.']);
    }
    if(membrane)rows.splice(1,0,membrane);
    if(holes)rows.push(['Huecos descontados',roofNumber(holes)+' m²','Descontados de placas por superficie. Sin posición del hueco, no se descuentan perfiles, fijaciones ni longitud de juntas.'],['Recercado de huecos','No dimensionados','Definir posición, dimensiones y refuerzos de cada hueco para completar el pedido.']);
    rows.push(['Aviso de despiece','Despiece pendiente de validar','Verificar componentes, soporte, carga, recortes, anclajes y accesorios. La cantidad de referencia no acredita una solución estructural aprobada.']);
    const lab=laborRow(net,num('rLabor'),'techo');if(lab)rows.push(lab);
    const obj={title:title+' · '+A.toFixed(2)+' m²',items:rows,area:A,net,roofLayout:layout,incomplete:true};
    updateRoofOverview(true);
    const actions=[];
    if(missingWeight){
      const message='Falta el peso del conjunto para '+layers+' placa(s) de '+roofNumber(thick).replace('.',',')+' mm. Incluye placas y estructura según la ficha para calcular perfiles y cuelgues.';
      el('rWeight').setCustomValidity(message);el('rWeight').setAttribute('aria-invalid','true');
      el('rWeightError').textContent=message;el('rWeightError').hidden=false;
      actions.push({field:'rWeight',label:'Completar peso del conjunto'});
    }else if(suspended&&!layout.supported)actions.push({field:el('rReference').value==='generic'?'rReference':el('rBoardType').value==='rf'?'rBoardType':![12.5,15].includes(thick)?'rBoardThick':'rWeight',label:'Revisar configuración y carga'});
    if(suspended&&layout.supported){
      if(rows.some(row=>row[0]==='Varilla roscada M6'&&row[1]==='No dimensionados'))actions.push({field:!roofHas('rRodMargin')?'rRodMargin':num('rDrop')+num('rRodMargin')<=0?'rDrop':'rRodStock',label:'Completar longitud de varilla'});
      if(rows.some(row=>row[0]==='Pasta de juntas'&&row[1]==='No dimensionados'))actions.push({field:'rPasteRate',label:'Completar consumo de pasta'});
    }
    if(sys==='sierra'&&(!roofHas('rSierraRuns')||!roofHas('rSierraBar')||!roofHas('rSierraHangers')))actions.push({field:!roofHas('rSierraRuns')?'rSierraRuns':!roofHas('rSierraBar')?'rSierraBar':'rSierraHangers',label:'Completar datos del plano'});
    if(sys==='escayola'&&(!roofHas('rGypsumPoints')||!roofHas('rGypsumFibre')||!roofHas('rGypsumPaste')))actions.push({field:!roofHas('rGypsumPoints')?'rGypsumPoints':!roofHas('rGypsumFibre')?'rGypsumFibre':'rGypsumPaste',label:'Completar datos de escayola'});
    const box=el('roofResult'),missing=rows.some(row=>row[1]==='No dimensionados');
    box.innerHTML=resultHTML(obj.title,(pyl?layers+' placa(s) de '+roofNumber(thick).replace('.',',')+' mm · ':'')+'Despiece de referencia · neto '+roofNumber(net)+' m²',rows,true,{showPending:true,actions});bindAdd(box,obj);
    box.querySelectorAll('[data-roof-complete]').forEach(button=>on(button,'click',()=>focusInput(el(button.dataset.roofComplete))));
    if(missing)box.querySelector('.addWork').textContent=editingPart===null?'Guardar despiece incompleto':'Guardar cambios · despiece incompleto';
  }
  on(el('roofForm'),'submit',e=>submitProgressiveCalculation(e,'roofForm','roofResult',calcRoof));
  ['rSys','rBoard','rLayers','rBoardType','rBoardThick','rReference','rPerimeter','rWaste','rMembrane'].forEach(id=>on(el(id),'change',calcRoof));
  ['rL','rW','rDrop','rHoles','rLabor','rMembraneWaste',...Object.keys(roofDefaults).filter(id=>!['rBoardThick','rReference','rPerimeter'].includes(id))].forEach(id=>on(el(id),'input',calcRoof));
  function setWetCat(cat){
    if(!data[cat]) return;
    currentCat = cat;
    $all('#wetCats [data-cat], [data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === cat));
    if(el('wetWaste')) el('wetWaste').value = cat === 'puentes' ? '0' : '8';
    renderProducts();
    calcWet();
    saveDraft({target:el('wetProduct')});
  }
  function productImgSrc(it){
    const img = (it && it.img) || '';
    if(/^https?:\/\//i.test(img)) return img;
    if(img) return img;
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23eef3ef"/><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="18">Producto</text></svg>';
  }
  function closeWetPicker(){
    el('wetPickerPanel').hidden=true;el('wetPickerToggle').setAttribute('aria-expanded','false');el('wetPickerToggle').focus({preventScroll:true});
  }
  function renderWetChoices(){
    const box=el('wetProductOptions');if(!box)return;
    const normalize=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const query=normalize(el('wetProductSearch').value).trim();
    const group=data[currentCat]||{},selected=el('wetProduct').value;
    const names=Object.keys(group).filter(name=>normalize(name+' '+(group[name].spec||'')).includes(query));
    el('wetProductCount').textContent=names.length?names.length+' productos disponibles':'No hay coincidencias. Prueba otro nombre o medida.';
    box.replaceChildren();
    names.forEach(name=>{
      const item=group[name],b=document.createElement('button');b.type='button';b.className='wetProductChoice';b.setAttribute('aria-pressed',String(name===selected));
      const img=document.createElement('img');img.src=productImgSrc(item);img.alt='';img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src=productImgSrc({});};
      const text=document.createElement('span'),title=document.createElement('strong'),spec=document.createElement('small'),state=document.createElement('span');
      title.textContent=name;spec.textContent=item.spec||'Consulta las características al seleccionarlo';state.className='wetChoiceState';state.textContent=name===selected?'✓ Seleccionado':'Seleccionar';text.append(title,spec,state);b.append(img,text);
      b.onclick=()=>{
        el('wetProduct').value=name;
        applyWetDefaults(item);
        el('wetProduct').dispatchEvent(new Event('change',{bubbles:true}));closeWetPicker();
      };
      box.appendChild(b);
    });
  }
  on(el('wetPickerToggle'),'click',()=>{
    const panel=el('wetPickerPanel');panel.hidden=!panel.hidden;
    el('wetPickerToggle').setAttribute('aria-expanded',String(!panel.hidden));
    if(!panel.hidden){el('wetProductSearch').value='';renderWetChoices();el('wetProductSearch').focus({preventScroll:true});}
  });
  on(el('wetPickerClose'),'click',closeWetPicker);
  on(el('wetProductSearch'),'input',renderWetChoices);
  on(el('wetPickerPanel'),'keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeWetPicker();}});
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
    if(el('wetProductSearch'))el('wetProductSearch').value='';
    const prev = s.value;
    s.innerHTML = '';
    Object.keys(group).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; s.appendChild(o); });
    if(prev && group[prev]) s.value = prev;
    else s.selectedIndex = 0;
    if(s.value!==prev)applyWetDefaults(group[s.value]);
    syncWet();
  }
  function applyWetDefaults(item){
    if(!item)return;
    if(currentCat==='ladrillos')['wetBrickL','wetBrickH','wetBrickT'].forEach((id,i)=>{if(el(id))el(id).value=Array.isArray(item.dims)?String(item.dims[i]):'';});
    if(el('wetConsumption')&&item.k==='kg_range')el('wetConsumption').value=String((item.min+item.max)/2);
    if(el('wetCoats'))el('wetCoats').value='1';
    if(el('wetBlockMortar')&&item.m)el('wetBlockMortar').value=String(item.m);
  }
  function wetArea(){ return (el('wetMeasureMode') && el('wetMeasureMode').value === 'direct') ? num('wetArea') : num('wetL') * num('wetH'); }
  function updateWetOverview(valid){
    const name=el('wetProduct').value,item=data[currentCat]?.[name];
    setOverview('wetMeasureSummary',valid?money(wetArea())+' m²'+(el('wetMeasureMode').value==='dims'?' · '+inputNumberText('wetL')+' × '+inputNumberText('wetH')+' m':' introducidos'):'Revisa los datos señalados antes de calcular.');
    let setting=name||'Elige un producto';
    if(currentCat==='ladrillos')setting+=' · '+inputNumberText('wetBrickL')+' × '+inputNumberText('wetBrickH')+' × '+inputNumberText('wetBrickT')+' cm · junta '+inputNumberText('wetJoint')+' mm';
    if(currentCat==='revestimientos')setting+=' · espesor '+inputNumberText('wetThickness')+' mm';
    if(currentCat==='puentes'&&item?.k==='kg_range')setting+=' · '+inputNumberText('wetConsumption')+' kg/m²'+(item.perCoat?'/capa · '+inputNumberText('wetCoats')+' capa(s)':'');
    if(currentCat==='puentes'&&item?.k==='level_primer')setting+=' · soporte '+selectText('wetSupport');
    setOverview('wetSystemSummary',setting);
    setOverview('wetBrickSummary',inputNumberText('wetBrickL')+' × '+inputNumberText('wetBrickH')+' × '+inputNumberText('wetBrickT')+' cm · junta '+inputNumberText('wetJoint')+' mm');
    setOverview('wetMortarSummary',selectText('wetMortar')+(currentCat==='ladrillos'&&el('wetMortar').value==='predosificado'?' · '+inputNumberText('wetMortarYield')+' L/saco':currentCat==='bloques'?' · '+inputNumberText('wetBlockMortar')+' kg/m² configurados':''));
    setOverview('wetWasteSummary','Producto '+inputNumberText('wetWaste')+' %'+(['ladrillos','bloques'].includes(currentCat)?' · mortero '+inputNumberText('wetMortarWaste')+' %':''));
    let notice=currentCat==='ladrillos'?'Las dimensiones y la junta determinan el cálculo geométrico. '+(item?.u?'Referencia comercial de catálogo: '+item.u+' ud/m². ':'')+'Comprueba largo, alto y espesor reales.':currentCat==='bloques'?'El consumo de mortero es orientativo y configurable; compruébalo para el bloque y mortero utilizados.':currentCat==='revestimientos'?'Comprueba el intervalo de espesores y el máximo por capa en la documentación del producto.':'Comprueba consumo, unidad de envase y condiciones de aplicación del producto.';
    if(item?.k==='kg_range'&&(num('wetConsumption')<item.min||num('wetConsumption')>item.max))notice+=' El consumo configurado está fuera del intervalo de referencia: revisa su justificación.';
    setOverview('wetTechnicalNotice',(valid?'':'Hay datos por corregir. ')+notice);
  }
  function syncWet(){
    const name = el('wetProduct') ? el('wetProduct').value : '';
    const it = data[currentCat] && data[currentCat][name];
    el('wetBrickOptions')?.classList.toggle('hidden',currentCat!=='ladrillos');
    el('wetMortarOptions')?.classList.toggle('hidden',!['ladrillos','bloques'].includes(currentCat));
    if(el('wetSelectedName'))el('wetSelectedName').textContent=name||'Aún no hay producto';
    if(el('wetProductOptions'))renderWetChoices();
    const dims = el('wetMeasureMode') && el('wetMeasureMode').value === 'dims';
    if(el('wetAreaWrap')) el('wetAreaWrap').classList.toggle('hidden', dims);
    if(el('wetLWrap')) el('wetLWrap').classList.toggle('hidden', !dims);
    if(el('wetHWrap')) el('wetHWrap').classList.toggle('hidden', !dims);
    if(el('wetThicknessWrap')) el('wetThicknessWrap').classList.toggle('hidden', currentCat !== 'revestimientos');
    if(el('wetBrickDimsWrap')) el('wetBrickDimsWrap').classList.toggle('hidden', currentCat !== 'ladrillos');
    if(el('wetMortarWrap')) el('wetMortarWrap').classList.toggle('hidden', !(currentCat === 'ladrillos' || currentCat === 'bloques'));
    if(el('wetMortarWasteWrap')) el('wetMortarWasteWrap').classList.toggle('hidden', !['ladrillos','bloques'].includes(currentCat));
    if(el('wetMortarYieldWrap')) el('wetMortarYieldWrap').classList.toggle('hidden', !(currentCat === 'ladrillos' && el('wetMortar') && el('wetMortar').value === 'predosificado'));
    if(el('wetSupportWrap')) el('wetSupportWrap').classList.toggle('hidden', !(currentCat === 'puentes' && it && it.k === 'level_primer'));
    if(el('wetConsumptionWrap'))el('wetConsumptionWrap').classList.toggle('hidden',!(currentCat==='puentes'&&it?.k==='kg_range'));
    if(el('wetCoatsWrap'))el('wetCoatsWrap').classList.toggle('hidden',!(currentCat==='puentes'&&it?.perCoat));
    if(el('wetBlockMortarWrap'))el('wetBlockMortarWrap').classList.toggle('hidden',currentCat!=='bloques');
    if(el('wetConsumptionHint')&&it?.k==='kg_range')el('wetConsumptionHint').textContent='Referencia aproximada '+it.min+'–'+it.max+' kg/m²'+(it.perCoat?'/capa':'')+'. El valor inicial es la media: ajústalo según el soporte.';
    if(it){
      if(el('productImg')){
        el('productImg').onerror = function(){ this.onerror = null; this.src = productImgSrc({}); };
        el('productImg').src = productImgSrc(it);
      }
      if(el('productName')) el('productName').textContent = name;
      if(el('productSpec')) el('productSpec').textContent = it.spec || '';
      const chips = [];
      if(it.u && currentCat!=='ladrillos') chips.push(it.u + ' ud/m²');
      if(it.kg) chips.push(it.kg + ' kg/m²·mm');
      if(it.min != null && it.max != null) chips.push(it.min+'–'+it.max+' '+(currentCat==='revestimientos'?'mm de espesor':it.k==='kg_range'?'kg/m²'+(it.perCoat?'/capa':''):'consumo'));
      if(el('productChips')) el('productChips').innerHTML = chips.map(x => '<span class="chip">' + x + '</span>').join('');
    }
    if(el('wetInfo')) el('wetInfo').textContent = currentCat === 'ladrillos'
      ? 'Las unidades por m² y el mortero se calculan con las dimensiones reales del ladrillo y el espesor de junta que indiques.'
      : currentCat === 'bloques' ? 'El rendimiento base se muestra separado de la merma.'
      : currentCat === 'revestimientos' ? 'El consumo depende del espesor seleccionado.'
      : 'Cada puente de unión mantiene su fórmula específica.';
  }


