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
    if(/tabla fabricante|une |une-|ficha/.test(text)) return {c:'verified',t:'VERIFICADO'};
    return {c:'estimate',t:'ESTIMACIÓN'};
  }
  function resultHTML(title, meta, rows){
    const quick=rows.filter(x=>!/comprobación de altura|huecos descontados|aviso/i.test(String(x[0]))).slice(0,6);
    const quickHtml=quick.map(x=>'<div class="quickLine"><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong></div>').join('');
    const tech=rows.map(x=>{const q=rowConfidence(x);return '<div class="row"><div class="rowName">'+esc(x[0])+' <span class="trust '+q.c+'">'+q.t+'</span></div><div class="rowVal">'+esc(x[1])+'</div>'+(x[2]?'<div class="rowDetail">'+esc(x[2])+'</div>':'')+'</div>';}).join('');
    return '<div class="resultHead"><div class="eyebrow">RESULTADO RÁPIDO</div><div class="resultTitle">'+esc(title)+'</div><div class="resultMeta">'+esc(meta)+'</div></div>'+
      '<div class="quickResult">'+quickHtml+'</div>'+
      '<details class="techDetails"><summary>Ver cálculo técnico, fórmulas y fuentes</summary><div class="groupHead">DETALLE TÉCNICO</div>'+tech+'</details>'+
      '<div class="workZoneWrap"><label>Estancia / zona<input class="workZone" placeholder="Ej. Baño principal"></label></div>'+
      '<div class="actions"><button class="btn addWork" type="button">Añadir a Obra</button></div>';
  }
  function bindAdd(node, obj){
    if(!node) return;
    const b=node.querySelector('.addWork');
    if(b) b.onclick=e=>{
      const z=node.querySelector('.workZone');
      const copy=Object.assign({},obj,{zone:(z&&z.value.trim())||'General'});
      work.push(copy); saveWork();
      e.target.textContent='Añadido';
      setTimeout(()=>e.target.textContent='Añadir a Obra',700);
    };
  }
  function sketchLegend(items){
    const names={board:'Placa PYL',metal:'Perfilería',wool:'Lana mineral',support:'Soporte / muro',adhesive:'Pasta / adhesivo',hang:'Suspensión',tile:'Placa registrable',rope:'Estopa'};
    return '<div class="sketchLegend">'+items.map(k=>'<span><i class="skKey skKey-'+k+'"></i>'+names[k]+'</span>').join('')+'</div>';
  }
  function sketchShell(title,sub,svg){
    return '<div class="sketchHead"><div><strong>'+title+'</strong><span>'+sub+'</span></div><span class="sketchBadge">DETALLE</span></div><div class="sketchCanvas techDrawing">'+svg+'</div><div class="sketchNote">Esquema técnico simplificado basado en detalles constructivos de fabricante. Verificar siempre el sistema concreto.</div>';
  }
  function renderWallSketch(a,b,p,sp,wool){
    const box=el('wallSketch'); if(!box) return;
    const b2a=a>1?'<line class="tdBoard" x1="49" y1="39" x2="49" y2="143"/>':'';
    const b2b=b>1?'<line class="tdBoard" x1="271" y1="39" x2="271" y2="143"/>':'';
    const ins=wool?'<path class="tdIns" d="M108 51l11 9-11 9 11 9-11 9 11 9-11 9 11 9M145 51l11 9-11 9 11 9-11 9 11 9-11 9M182 51l11 9-11 9 11 9-11 9 11 9-11 9"/>':'';
    const svg='<svg viewBox="0 0 320 184" role="img" aria-label="Sección de tabique PYL">'+
      '<defs><pattern id="hatchWall" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="tdHatch"/></pattern></defs>'+
      '<rect class="tdSupport" x="24" y="149" width="272" height="14"/>'+
      '<path class="tdMetal" d="M89 39h142v9H89zM89 135h142v9H89z"/>'+
      '<path class="tdMetal" d="M103 47h10v89h-10zM155 47h10v89h-10zM207 47h10v89h-10z"/>'+ins+
      '<line class="tdBoard" x1="61" y1="39" x2="61" y2="143"/>'+b2a+
      '<line class="tdBoard" x1="259" y1="39" x2="259" y2="143"/>'+b2b+
      '<path class="tdLeader" d="M108 47L77 19M160 83L160 19M259 54L286 19"/>'+
      '<text class="tdText" x="40" y="16">Canal</text><text class="tdText" x="133" y="16">Montante M'+p+'</text><text class="tdText" x="247" y="16">Placa</text>'+
      '<path class="tdDim" d="M103 171h104M103 167v8M207 167v8"/><text class="tdTextSm" x="155" y="181" text-anchor="middle">'+Math.round(sp*1000)+' mm</text>'+
    '</svg>';
    box.innerHTML=sketchShell('Tabique '+a+'+'+b,'Sección técnica · estructura simple',svg);
  }

  function renderLiningSketch(t,l,p,sp,wool){
    const box=el('liningSketch'); if(!box) return;
    const wall='<rect class="tdMasonry" x="24" y="27" width="62" height="125"/><path class="tdMasonryLines" d="M24 52h62M24 77h62M24 102h62M24 127h62M45 27v25M66 52v25M42 77v25M67 102v25M48 127v25"/>';
    let title='',sub='',core='';
    if(t==='direct'){
      title='Trasdosado directo'; sub='Placa adherida · sin perfilería';
      core=wall+
        '<circle class="tdDot" cx="106" cy="50" r="5"/><circle class="tdDot" cx="106" cy="88" r="5"/><circle class="tdDot" cx="106" cy="126" r="5"/>'+
        '<line class="tdBoard" x1="132" y1="27" x2="132" y2="152"/>'+
        '<path class="tdLeader" d="M106 50L159 18M132 67L247 18"/>'+
        '<text class="tdText" x="151" y="15">Pasta de agarre</text><text class="tdText" x="242" y="15">Placa PYL</text>';
    }else if(t==='semi'){
      title='Trasdosado semidirecto'; sub='Maestra fijada al soporte';
      core=wall+
        '<path class="tdFix" d="M90 45h18M90 88h18M90 131h18"/>'+
        '<path class="tdOmegaLine" d="M108 36h11v108h-11"/>'+
        (wool?'<path class="tdIns" d="M127 49l10 9-10 9 10 9-10 9 10 9-10 9 10 9M148 49l10 9-10 9 10 9-10 9 10 9-10 9"/>':'')+
        '<line class="tdBoard" x1="184" y1="27" x2="184" y2="152"/>'+(l>1?'<line class="tdBoard" x1="195" y1="27" x2="195" y2="152"/>':'')+
        '<path class="tdLeader" d="M113 45L159 18M184 62L263 18"/>'+
        '<text class="tdText" x="141" y="15">Maestra</text><text class="tdText" x="246" y="15">Placa PYL</text>'+
        '<text class="tdTextSm" x="160" y="176" text-anchor="middle">Intereje '+Math.round(sp*1000)+' mm</text>';
    }else{
      title='Trasdosado autoportante'; sub='Estructura independiente del muro';
      core=wall+
        '<path class="tdMetal" d="M110 36h125v8H110zM110 135h125v8H110z"/>'+
        '<path class="tdMetal" d="M121 43h10v93h-10zM167 43h10v93h-10zM213 43h10v93h-10z"/>'+
        (wool?'<path class="tdIns" d="M135 52l10 9-10 9 10 9-10 9 10 9-10 9M181 52l10 9-10 9 10 9-10 9 10 9-10 9"/>':'')+
        '<line class="tdBoard" x1="246" y1="28" x2="246" y2="151"/>'+(l>1?'<line class="tdBoard" x1="257" y1="28" x2="257" y2="151"/>':'')+
        '<path class="tdLeader" d="M114 36L131 17M172 79L172 17M246 58L282 17"/>'+
        '<text class="tdText" x="104" y="14">Canal</text><text class="tdText" x="148" y="14">Montante M'+p+'</text><text class="tdText" x="255" y="14">Placa</text>'+
        '<path class="tdDim" d="M121 166h92M121 162v8M213 162v8"/><text class="tdTextSm" x="167" y="179" text-anchor="middle">'+Math.round(sp*1000)+' mm</text>';
    }
    const svg='<svg viewBox="0 0 320 184" role="img" aria-label="'+title+'">'+core+'</svg>';
    box.innerHTML=sketchShell(title,sub,svg);
  }

  function renderRoofSketch(sys){
    const box=el('roofSketch'); if(!box) return;
    const m=roofMeta[sys]||roofMeta.double;
    let core='';
    const slab='<rect class="tdSlab" x="24" y="20" width="272" height="16"/><path class="tdSlabHatch" d="M28 34l12-12M45 36l14-14M64 36l14-14M83 36l14-14M102 36l14-14M121 36l14-14M140 36l14-14M159 36l14-14M178 36l14-14M197 36l14-14M216 36l14-14M235 36l14-14M254 36l14-14M273 36l14-14"/>';
    if(sys==='double'){
      core=slab+
        '<path class="tdHang" d="M80 36v45M160 36v45M240 36v45"/>'+
        '<path class="tdProfile" d="M50 78h220M50 90h220"/>'+
        '<path class="tdProfileThin" d="M72 68v42M118 68v42M164 68v42M210 68v42M256 68v42"/>'+
        '<line class="tdBoardH" x1="42" y1="122" x2="278" y2="122"/>'+
        '<text class="tdText" x="24" y="155">Cuelgue</text><text class="tdText" x="124" y="155">Primario</text><text class="tdText" x="221" y="155">Secundario</text>';
    }else if(sys==='simple'){
      core=slab+
        '<path class="tdHang" d="M80 36v58M160 36v58M240 36v58"/>'+
        '<path class="tdProfile" d="M50 94h220"/>'+
        '<line class="tdBoardH" x1="42" y1="122" x2="278" y2="122"/>'+
        '<text class="tdText" x="27" y="155">Cuelgue</text><text class="tdText" x="126" y="155">TC47</text><text class="tdText" x="231" y="155">Placa</text>';
    }else if(sys==='sierra'){
      core=slab+
        '<path class="tdHang" d="M80 36v40M160 36v40M240 36v40"/>'+
        '<path class="tdSawLine" d="M48 79l14-10 14 10 14-10 14 10 14-10 14 10 14-10 14 10 14-10 14 10 14-10 14 10 14-10 14 10 14-10 14 10"/>'+
        '<path class="tdProfile" d="M50 101h220"/><line class="tdBoardH" x1="42" y1="126" x2="278" y2="126"/>'+
        '<text class="tdText" x="53" y="157">Perfil sierra</text><text class="tdText" x="207" y="157">TC47</text>';
    }else if(sys==='cm70'){
      core='<rect class="tdWallEdge" x="23" y="22" width="14" height="120"/><rect class="tdWallEdge" x="283" y="22" width="14" height="120"/>'+
        '<path class="tdMetal" d="M37 78h18v30H37zM265 78h18v30h-18z"/>'+
        '<path class="tdProfile" d="M55 93h210"/><line class="tdBoardH" x1="45" y1="124" x2="275" y2="124"/>'+
        '<path class="tdLeader" d="M50 82L84 41M160 93L160 41M271 82L238 41"/>'+
        '<text class="tdText" x="68" y="38">Canal</text><text class="tdText" x="123" y="38">M70 biapoyado</text><text class="tdText" x="226" y="38">Canal</text>'+
        '<text class="tdTextSm" x="160" y="158" text-anchor="middle">Sin cuelgues · verificar luz admisible</text>';
    }else if(sys==='desmontable60'||sys==='desmontable120'){
      const wide=sys==='desmontable120';
      core=slab+'<path class="tdHang" d="M80 36v48M160 36v48M240 36v48"/>'+
        '<path class="tdTGrid" d="M48 86h224M74 80v47M128 80v47M182 80v47M236 80v47"/>'+
        (wide?'<rect class="tdTile" x="54" y="93" width="68" height="25"/><rect class="tdTile" x="134" y="93" width="68" height="25"/>':'<rect class="tdTile" x="54" y="93" width="42" height="25"/><rect class="tdTile" x="104" y="93" width="42" height="25"/><rect class="tdTile" x="154" y="93" width="42" height="25"/><rect class="tdTile" x="204" y="93" width="42" height="25"/>')+
        '<text class="tdText" x="40" y="154">Suspensión</text><text class="tdText" x="141" y="154">T24</text><text class="tdText" x="220" y="154">'+(wide?'600×1200':'600×600')+'</text>';
    }else{
      core=slab+'<path class="tdRope" d="M80 36q10 20 0 45M160 36q10 20 0 45M240 36q10 20 0 45"/>'+
        '<line class="tdBoardH" x1="48" y1="107" x2="272" y2="107"/>'+
        '<path class="tdJoint" d="M106 101v12M181 101v12"/>'+
        '<text class="tdText" x="57" y="150">Estopa</text><text class="tdText" x="190" y="150">Placa escayola</text>';
    }
    const svg='<svg viewBox="0 0 320 170" role="img" aria-label="'+m.name+'">'+core+'</svg>';
    box.innerHTML=sketchShell(m.name,m.hint,svg);
  }

  function calcWall(){
    const L=num('wL'),H=num('wH'),A=L*H,a=num('wA'),b=num('wB'),sp=num('wS')||.6,p=num('wP'),thick=num('wBoardThick')||15;
    const jambs=jambStuds(num('wDoors'),num('wWins')), holes=openingsM2(num('wDoors'),num('wWins')), net=netArea(A,holes);
    const board=bestPylBoard(H),kind=boardTypeLabel('wBoardType'),layersGov=Math.min(a,b);
    const structural=choosePlacoHeight('wall',H,p,sp,layersGov,thick);
    const useP=structural?structural.profile:p, useSp=structural?structural.spacing/1000:sp, doubled=!!(structural&&structural.double);
    const axes=Math.ceil(L/useSp)+1+jambs, mult=doubled?2:1, seg=profileSegments(H,useP), totalStudBars=axes*mult*seg.segments;
    const totalLayers=a+b,plateUds=Math.ceil(net*totalLayers/board.area*1.08),bandNeed=2*L+2*H;
    const finish=mergeFaceWork([pylFaceWork(net,a,thick),pylFaceWork(net,b,thick)]);
    const rows=[
      ['Placa PYL '+kind+' '+thick.toString().replace('.',',')+' mm · '+board.label,plateUds+' uds','UNE-EN 520 · '+kind+' · altura '+H.toFixed(2)+' m · '+board.note+' · merma 8 % · cara 1: '+a+' · cara 2: '+b+' · neto '+net.toFixed(2)+' m²']
    ];
    if(structural){
      const mode=doubled?'doble H/cajón':'simple';
      rows.push(['Comprobación de altura Placo',H.toFixed(2)+' m ≤ '+structural.limit.toFixed(2)+' m','Tabla fabricante · M'+useP+' · '+structural.spacing+' mm · '+mode+' · gobierna la cara menos revestida: '+layersGov+' capa(s) de '+thick.toString().replace('.',',')+' mm']);
      rows.push(['Montante M'+useP+(doubled?' doble H/cajón':''),totalStudBars+' barras de 3 m',axes+' ejes/jambas × '+mult+' perfil(es) por eje × '+seg.segments+' tramo(s) · solape mínimo '+Math.round(seg.overlap*100)+' cm cuando haya prolongación']);
    }else{
      rows.push(['ALTURA FUERA DE TABLA','Requiere sistema de gran altura','No hay combinación M48/M70/M90 · 400/600 mm · simple/H-cajón que cumpla '+H.toFixed(2)+' m con '+layersGov+' capa(s) de '+thick.toString().replace('.',',')+' mm. Revisar sistema específico de fabricante.']);
      rows.push(['Montantes','No dimensionados','No se genera una cantidad estructural falsa fuera de la tabla verificada.']);
    }
    rows.push(['Canal R'+useP,Math.ceil(2*L/3)+' barras','UNE-EN 14195 · suelo y techo · barra 3 m']);
    rows.push.apply(rows,pylJoinRows(finish));
    rows.push(mmRow(A,'wall'));
    rows.push(['Banda acústica',bandNeed.toFixed(1)+' m · '+Math.ceil(bandNeed/30)+' rollo(s) de 30 m','UNE 102043 · perímetro de canales y arranques']);
    rows.push(tacoRow(L,2));
    const useWool=el('wWool')?el('wWool').value!=='0':true;
    if(useWool)rows.push(woolRow(net,woolThick(useP,'wall'),'wall'));
    if(holes)rows.push(['Huecos descontados',holes.toFixed(2)+' m²',(num('wDoors')||0)+' puerta(s) 0,80×2,10 · '+(num('wWins')||0)+' ventana(s) 1,20×1,20 · restan placa, pasta, cinta y lana']);
    rows.push(cornerBeadRow(H,num('wDoors')));
    const lab=laborRow(net,num('wLabor'),'tabique');if(lab)rows.push(lab);
    const obj={title:'Tabique PYL · '+kind+' · '+A.toFixed(2)+' m²',items:rows,area:A,net:net};
    renderWallSketch(a,b,useP,useSp,useWool);
    const box=el('wallResult');
    const metaStruct=structural?' · M'+useP+' '+(doubled?'doble H/cajón':'simple')+' @'+structural.spacing+' · límite '+structural.limit.toFixed(2)+' m':' · FUERA DE TABLA';
    if(box){box.innerHTML=resultHTML(obj.title,'Familia Tabique PYL · UNE 102043'+metaStruct+(useWool?' · lana '+woolThick(useP,'wall')+' mm':'')+' · neto '+net.toFixed(2)+' m²',rows);bindAdd(box,obj);}
  }
  on(el('wallForm'),'submit',e=>{e.preventDefault();calcWall();});
  ['wA','wB','wP','wS','wBoardThick','wWool','wBoardType','wDoors','wWins','wLabor'].forEach(id=>on(el(id),'change',calcWall));
  ['wL','wH'].forEach(id=>on(el(id),'input',calcWall));
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
    calcWall();
  }));

  function calcLining(){
    const L=num('lL'),H=num('lH'),A=L*H,t=el('lType')?el('lType').value:'auto',l=t==='direct'?1:num('lLayers'),sp=num('lS')||.6,p=num('lP'),thick=num('lBoardThick')||15;
    const holes=openingsM2(num('lDoors'),num('lWins')),net=netArea(A,holes),board=bestPylBoard(H),kind=boardTypeLabel('lBoardType');
    const liningPlates=Math.ceil(net*l/board.area*1.08);
    const rows=[['Placa PYL '+kind+' '+thick.toString().replace('.',',')+' mm · '+board.label,liningPlates+' uds','UNE-EN 520 · '+kind+' · altura '+H.toFixed(2)+' m · '+board.note+' · merma 8 % · '+l+' capa(s) · neto '+net.toFixed(2)+' m²']];
    let title='', structural=null, useP=p, useSp=sp, doubled=false;
    if(el('lLayersWrap'))el('lLayersWrap').classList.toggle('hidden',t==='direct');
    if(el('lProfileWrap'))el('lProfileWrap').classList.toggle('hidden',t==='direct');
    if(el('lSpacingWrap'))el('lSpacingWrap').classList.toggle('hidden',t==='direct');
    if(el('lWoolWrap'))el('lWoolWrap').classList.toggle('hidden',t==='direct');
    if(el('lWoolHint'))el('lWoolHint').classList.toggle('hidden',t==='direct');
    const finish=mergeFaceWork([pylFaceWork(net,l,thick)]);
    const useWool=t!=='direct'&&el('lWool')&&el('lWool').value!=='0';
    if(t==='direct'){
      title='Trasdosado directo';rows.push(['Pasta de agarre',Math.ceil(net*4.5)+' kg','UNE 102043 · trasdosado directo · ≈4,5 kg/m²']);
    }else if(t==='semi'){
      title='Trasdosado semidirecto';const o=Math.ceil(L/sp)+1;rows.push(['Perfil omega / auxiliar',o*Math.ceil(H/3)+' barras','UNE-EN 14195 · '+o+' ejes'],tacoRow(H,o,'omega'));if(useWool)rows.push(woolRow(net,woolThick(p,'semi'),'semi'));
    }else{
      title='Trasdosado autoportante';
      structural=choosePlacoHeight('lining',H,p,sp,l,thick);
      if(structural){useP=structural.profile;useSp=structural.spacing/1000;doubled=!!structural.double;}
      const jambs=jambStuds(num('lDoors'),num('lWins')),axes=Math.ceil(L/useSp)+1+jambs,bandNeed=2*L+2*H;
      if(structural){
        const mult=doubled?2:1,seg=profileSegments(H,useP),bars=axes*mult*seg.segments,mode=doubled?'doble H/cajón':'simple';
        rows.push(['Comprobación de altura Placo',H.toFixed(2)+' m ≤ '+structural.limit.toFixed(2)+' m','Tabla de trasdosado autoportante sin arriostrar · M'+useP+' · '+structural.spacing+' mm · '+mode+' · '+l+' capa(s) de '+thick.toString().replace('.',',')+' mm']);
        rows.push(['Montante M'+useP+(doubled?' doble H/cajón':''),bars+' barras de 3 m',axes+' ejes/jambas × '+mult+' perfil(es) por eje × '+seg.segments+' tramo(s) · solape mínimo '+Math.round(seg.overlap*100)+' cm cuando haya prolongación']);
      }else{
        const bad125=(l===1&&thick<14);
        rows.push(['ALTURA / CONFIGURACIÓN FUERA DE TABLA','Revisar sistema de fabricante',bad125?'La tabla cargada no da valor para 1×12,5 mm en trasdosado autoportante.':'No hay combinación M48/M70/M90 · 400/600 mm · simple/H-cajón que cumpla '+H.toFixed(2)+' m con '+l+' capa(s) de '+thick.toString().replace('.',',')+' mm.']);
        rows.push(['Montantes','No dimensionados','No se genera una cantidad estructural falsa fuera de la tabla verificada.']);
      }
      rows.push(['Canal R'+useP,Math.ceil(2*L/3)+' barras','UNE-EN 14195 · suelo y techo'],['Banda acústica',bandNeed.toFixed(1)+' m · '+Math.ceil(bandNeed/30)+' rollo(s) de 30 m','UNE 102043 · perímetro'],tacoRow(L,2));
      if(useWool)rows.push(woolRow(net,woolThick(useP,'auto'),'auto'));
    }
    if(t!=='direct'){rows.push.apply(rows,pylJoinRows(finish));rows.push(mmRow(A,'lining'));}else rows.push.apply(rows,pylJoinRows(finish).filter(r=>r[0].indexOf('Tornillos')!==0));
    if(holes)rows.push(['Huecos descontados',holes.toFixed(2)+' m²',(num('lDoors')||0)+' puerta(s) · '+(num('lWins')||0)+' ventana(s) · restan placa y acabado']);
    if(t!=='direct')rows.push(cornerBeadRow(H,num('lDoors')));
    const lab=laborRow(net,num('lLabor'),'trasdosado');if(lab)rows.push(lab);
    const famNote=t==='direct'?'Familia Trasdosado directo':t==='semi'?'Familia Trasdosado semidirecto':'Familia Trasdosado autoportante';
    const obj={title:title+' · '+kind+' · '+A.toFixed(2)+' m²',items:rows,area:A,net:net};
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
  }));
  on(el('liningForm'), 'submit', e => { e.preventDefault(); calcLining(); });
  ['lType','lLayers','lS','lP','lBoardThick','lWool','lBoardType','lDoors','lWins','lLabor'].forEach(id => on(el(id), 'change', calcLining));
  ['lL','lH'].forEach(id => on(el(id), 'input', calcLining));
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
  }));
  $all('[data-roof-sys]').forEach(btn => on(btn, 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    setRoofSys(btn.dataset.roofSys);
  }));
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
    const holes = num('rHoles'), net = netArea(A, holes);
    const kind = boardTypeLabel('rBoardType');
    const fmt = (el('rBoard') ? el('rBoard').value : '2,1.2').split(',').map(Number);
    const sys = el('rSys') ? el('rSys').value : 'double', d = num('rDrop');
    const modular = sys === 'desmontable60' || sys === 'desmontable120' || sys === 'escayola';
    renderRoofSketch(sys);
    if(el('rBoardWrap')) el('rBoardWrap').classList.toggle('hidden', modular);
    if(el('rLayersWrap')) el('rLayersWrap').classList.toggle('hidden', modular);
    let rows = [], title = 'Techo', meta = 'plenum ' + d + ' cm';
    if(sys === 'desmontable60' || sys === 'desmontable120'){
      const tile60 = sys === 'desmontable60';
      const tileUds = Math.ceil(net * (tile60 ? 2.78 : 1.39) * 1.08);
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
      const plates = Math.ceil(net * 1.67 * 1.05);
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
      const plates = Math.ceil(net * l * 1.08 / (fmt[0] * fmt[1]));
      rows = [['Placa PYL ' + kind + ' ' + Math.round(fmt[0] * 1000) + ' × ' + Math.round(fmt[1] * 1000), plates + ' uds', 'UNE-EN 520 · ' + kind + ' · ' + l + ' capa(s) · merma 8 % · neto ' + net.toFixed(2) + ' m²']];
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
        rows.push(['Perfil sierra', Math.ceil(A / 2.7) + ' barras', 'Estimación 0,37 barra/m² · verificar despiece de forjado'], ['TC47 secundario 3000', sec.bars + ' barras', 'Secundario cada 0,50 m · ' + sec.ml.toFixed(1) + ' m'], empalmeRow(sec.splices), ['Suspensiones', Math.ceil(A / .95) + ' uds', 'Puntos de suspensión']);
      } else {
        title = 'Techo canal + montante';
        rows.push(['Canal R70', Math.ceil(2 * (L + W) / 3) + ' barras', 'UNE-EN 14195 · apoyo perimetral'], ['Montante M70', Math.ceil(A / 1.8) + ' barras', 'UNE-EN 14195 · elemento portante biapoyado'], ['Comprobación de luz', 'Verificar tabla D13 / fabricante', 'Sistema biapoyado: no lleva suspensiones. La luz admisible depende de perfil, modulación, placas y carga.']);
      }
      rows.push.apply(rows, pylJoinRows(mergeFaceWork([pylFaceWork(net, l)])));
      rows.push(mmRow(A, 'roof'));
      meta = 'UNE 102043 · plenum ' + d + ' cm';
    }
    if(holes) rows.push(['Huecos descontados', holes.toFixed(2) + ' m²', 'Restan placa y acabado. La perfilería va a la superficie bruta.']);
    const lab = laborRow(net, num('rLabor'), 'techo');
    if(lab) rows.push(lab);
    const obj = {title:title + ' · ' + A.toFixed(2) + ' m²', items:rows, area:A, net:net};
    const box = el('roofResult');
    if(box){ box.innerHTML = resultHTML(obj.title, meta + ' · neto ' + net.toFixed(2) + ' m²', rows); bindAdd(box, obj); }
  }
  on(el('roofForm'), 'submit', e => { e.preventDefault(); calcRoof(); });
  ['rSys','rBoard','rLayers','rBoardType','rHoles','rLabor'].forEach(id => on(el(id), 'change', calcRoof));
  ['rL','rW','rDrop'].forEach(id => on(el(id), 'input', calcRoof));
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
