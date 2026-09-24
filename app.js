(() => {
  const $ = s => document.querySelector(s);
  const num = s => Math.max(0, Number(String($(s).value).replace(',','.')) || 0);
  let currentCat = 'ladrillos';
  let currentCerBody = 'porcelanico';
  let work = [];
  const screens = [...document.querySelectorAll('.screen')];
  const storeMap=[
    {name:'OBRAMAT Almería',postalPrefixes:['040','041','042','043','044','045','046','047','048']},
    {name:'OBRAMAT Granada',postalPrefixes:['180','181','182','183','184','185','186','187','188']},
    {name:'OBRAMAT Málaga',postalPrefixes:['290','291','292','293','294','295','296','297']},
    {name:'OBRAMAT Murcia',postalPrefixes:['300','301','302','303','304','305','306','307','308']},
    {name:'OBRAMAT Córdoba',postalPrefixes:['140','141','142','143','144','145','146','147','148','149']}
  ];
  let postalState={code:'',store:''};
  try{postalState=JSON.parse(localStorage.getItem('calculadora-postal-v1')||'{"code":"","store":""}');}catch(e){}
  const nav = [...document.querySelectorAll('[data-nav]')];
  const data = window.CALC_DATA;
  function show(id){
    screens.forEach(x=>x.classList.toggle('active',x.id===id));
    nav.forEach(b=>b.classList.toggle('active',b.dataset.nav===(['wall','lining','roof','wet','ceramic'].includes(id)?'home':id)));
    if(id==='work') renderWork();
    if(id==='list') renderList();
  }
  function resolveStore(cp){
    const prefix=cp.slice(0,3),hit=storeMap.find(s=>s.postalPrefixes.includes(prefix));
    return hit?hit.name:'Almacén OBRAMAT por verificar';
  }
  function applyPostal(cp){
    const store=resolveStore(cp);postalState={code:cp,store};
    try{localStorage.setItem('calculadora-postal-v1',JSON.stringify(postalState));}catch(e){}
    $('#storeTitle').textContent=store;$('#storeSub').textContent='CP '+cp+' · referencias vinculadas a zona';
    $('#storebar').classList.add('show');
    const cerTxt=$('#cerStoreText');
    if(cerTxt) cerTxt.textContent='CP '+cp+' · '+store+' · precio y stock solo si OBRAMAT los confirma para este almacén.';
    show('home');
  }
  $('#postalForm').onsubmit=e=>{e.preventDefault();const cp=$('#postalCode').value.trim();if(!/^[0-9]{5}$/.test(cp)){ $('#postalError').textContent='Introduce un código postal español de 5 dígitos.';return;}$('#postalError').textContent='';applyPostal(cp);};
  $('#useLocation').onclick=()=>{
    const status=$('#locationStatus');$('#postalError').textContent='';
    if(!navigator.geolocation){status.textContent='Este navegador no permite obtener la ubicación.';return;}
    status.textContent='Solicitando permiso de ubicación…';
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        status.textContent='Localizando código postal…';
        const lat=pos.coords.latitude,lon=pos.coords.longitude;
        const res=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&addressdetails=1',{headers:{'Accept':'application/json'}});
        if(!res.ok) throw new Error('reverse');
        const geo=await res.json();
        const cp=(geo.address&&geo.address.postcode||'').match(/\d{5}/)?.[0]||'';
        if(!cp) throw new Error('postcode');
        $('#postalCode').value=cp;status.textContent='Código postal detectado: '+cp;applyPostal(cp);
      }catch(err){status.textContent='No he podido obtener el código postal automáticamente. Introdúcelo manualmente.';}
    },err=>{
      const msg=err.code===1?'Permiso de ubicación denegado. Actívalo en el navegador para usar esta opción.':err.code===2?'No se ha podido determinar tu ubicación.':'La ubicación ha tardado demasiado en responder.';
      status.textContent=msg;
    },{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
  };
  $('#changePostal').onclick=()=>{$('#postalCode').value=postalState.code||'';$('#storebar').classList.remove('show');show('postal');};
  function pylPallets(uds){
    const n=Math.max(0,Math.ceil(Number(uds)||0));
    if(!n) return '0 palets';
    return [30,36,50].map(p=>Math.ceil(n/p)+' pal. × '+p).join(' · ');
  }
  $('#loadObramatCeramic').onclick=()=>{
    const raw=$('#cerProductCode').value.trim();
    const code=raw.replace(/\D/g,'');
    const status=$('#cerProductStatus'),card=$('#cerProductCard');
    const cp=postalState.code||'',store=postalState.store||resolveStore(cp);
    const a=num('#cA'),b=num('#cB');
    if(raw && !/^\d{6,12}$/.test(code)){status.textContent='La referencia, si la pones, tiene que ser numérica de 6 a 12 dígitos.';return;}
    if(a<5||b<5){status.textContent='Introduce el largo y el ancho de la baldosa en cm.';return;}
    $('#aSize').value=Math.max(a,b);
    card.classList.remove('hidden');
    card.innerHTML='<div style="font-weight:950">'+(code?('Ref. anotada '+code):'Sin referencia')+'</div><div class="small">'+store+(cp?' · CP '+cp:'')+'</div><div class="small" style="margin-top:6px">Formato usado: '+a+' × '+b+' cm. Precio y stock no disponibles desde esta página.</div>';
    calcLevel(); adhesiveClass();
    status.textContent='Cálculo hecho con las medidas introducidas. OBRAMAT no se ha consultado sola.';
  };
  $('#chooseObramatCeramic').onclick=()=>{
    const cp=postalState.code||'';
    const store=postalState.store||resolveStore(cp);
    const q=$('#cerProductCode').value.trim().replace(/\D/g,'')||'suelo ceramico';
    $('#cerStoreText').textContent=(cp?'CP '+cp+' · ':'')+store+' · consulta manual en OBRAMAT.';
    window.open('https://www.obramat.es/search?q='+encodeURIComponent(q),'_blank','noopener');
  };
  if(postalState.code&&/^[0-9]{5}$/.test(postalState.code)){ $('#storeTitle').textContent=postalState.store||resolveStore(postalState.code);$('#storeSub').textContent='CP '+postalState.code+' · referencias vinculadas a zona';$('#storebar').classList.add('show');const cerTxt=$('#cerStoreText');if(cerTxt) cerTxt.textContent='CP '+postalState.code+' · '+(postalState.store||resolveStore(postalState.code));show('home');}
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{show(b.dataset.open);if(b.dataset.open==='wet'){renderProducts();calcWet();}});
  document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('home'));
  nav.forEach(b=>b.onclick=()=>show(b.dataset.nav));
  $('#look').onclick=()=>$('#appearance').classList.toggle('open');
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{document.body.dataset.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  document.querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{const [a,s,o]=b.dataset.ac.split('|');document.documentElement.style.setProperty('--accent',a);document.documentElement.style.setProperty('--accent2',a);document.documentElement.style.setProperty('--accentSoft',s);document.documentElement.style.setProperty('--on',o);document.querySelectorAll('[data-ac]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  function resultHTML(title,meta,rows){
    return '<div class="resultHead"><div class="eyebrow">RESULTADO</div><div class="resultTitle">'+title+'</div><div class="resultMeta">'+meta+'</div></div>'+
      '<div class="groupHead">MATERIALES</div>'+
      rows.map(x=>'<div class="row"><div class="rowName">'+x[0]+'</div><div class="rowVal">'+x[1]+'</div>'+(x[2]?'<div class="rowDetail">'+x[2]+'</div>':'')+'</div>').join('')+
      '<div class="actions"><button class="btn addWork" type="button">Añadir a Obra</button></div>';
  }
  function bindAdd(el,obj){const b=el.querySelector('.addWork');if(b)b.onclick=e=>{work.push(obj);e.target.textContent='Añadido';setTimeout(()=>e.target.textContent='Añadir a Obra',700);};}
  function calcWall(){
    const L=num('#wL'),H=num('#wH'),A=L*H,a=num('#wA'),b=num('#wB'),sp=num('#wS')||.6,p=num('#wP'),studs=Math.ceil(L/sp)+1;
    const totalLayers=a+b,plateUds=Math.ceil(A*totalLayers/3*1.08);
    const screwNeed=Math.ceil(A*totalLayers*15*11/10),screwType=Math.max(a,b)>=2?'TN 35':'TN 25',screwBoxes=Math.ceil(screwNeed/1000);
    const bandNeed=2*L+2*H,bandRolls=Math.ceil(bandNeed/30);
    const visibleArea=A*2,tapeNeed=Math.ceil(visibleArea*1.4*1.10),tapeRolls=Math.ceil(tapeNeed/150),pasteNeed=Math.ceil(visibleArea*0.35*1.10),pasteBags=Math.ceil(pasteNeed/20);
    const rows=[['Placa PYL 1200 × 2500',plateUds+' uds',totalLayers+' capas totales · paletización '+pylPallets(plateUds)],['Montante M'+p,studs*Math.ceil(H/3)+' barras',studs+' ejes'],['Canal R'+p,Math.ceil(2*L/3)+' barras','Suelo y techo'],['Tornillos PYL '+screwType,screwNeed+' uds · '+screwBoxes+' caja(s) de 1.000','Consumo orientativo · incluye 10%'],['Banda acústica',bandNeed.toFixed(1)+' m · '+bandRolls+' rollo(s) de 30 m','Canales + encuentros laterales'],['Cinta de papel para juntas',tapeNeed+' m · '+tapeRolls+' rollo(s) de 150 m','Estimación según superficie visible'],['Pasta de juntas',pasteNeed+' kg · '+pasteBags+' saco(s) de 20 kg','Consumo orientativo 0,35 kg/m² · incluye 10%']];
    const obj={title:'Tabique · '+A.toFixed(2)+' m²',items:rows};
    $('#wallResult').innerHTML=resultHTML(obj.title,'Intereje '+Math.round(sp*1000)+' mm',rows);bindAdd($('#wallResult'),obj);
  }
  $('#wallForm').onsubmit=e=>{e.preventDefault();calcWall();};
  function calcLining(){
    const L=num('#lL'),H=num('#lH'),A=L*H,t=$('#lType').value,l=num('#lLayers'),sp=num('#lS')||.6,p=num('#lP');
    const liningPlates=Math.ceil(A*l/3*1.08);
    const rows=[['Placa PYL 1200 × 2500',liningPlates+' uds',l+' capa(s) · paletización '+pylPallets(liningPlates)]];
    let title='';
    $('#lProfileWrap').classList.toggle('hidden',t==='direct');
    const screwNeed=Math.ceil(A*l*15*11/10),screwType=l>=2?'TN 35':'TN 25',screwBoxes=Math.ceil(screwNeed/1000);
    const tapeNeed=Math.ceil(A*1.4*1.10),tapeRolls=Math.ceil(tapeNeed/150),pasteNeed=Math.ceil(A*0.35*1.10),pasteBags=Math.ceil(pasteNeed/20);
    if(t==='direct'){title='Trasdosado directo';rows.push(['Pasta de agarre',Math.ceil(A*4.5)+' kg','Consumo orientativo']);}
    else if(t==='semi'){title='Trasdosado semidirecto';const o=Math.ceil(L/sp)+1;rows.push(['Perfil omega / auxiliar',o*Math.ceil(H/3)+' barras',o+' ejes']);}
    else{title='Trasdosado autoportante';const s=Math.ceil(L/sp)+1;const bandNeed=2*L+2*H;rows.push(['Montante M'+p,s*Math.ceil(H/3)+' barras',s+' ejes'],['Canal R'+p,Math.ceil(2*L/3)+' barras','Suelo y techo'],['Banda acústica',bandNeed.toFixed(1)+' m · '+Math.ceil(bandNeed/30)+' rollo(s) de 30 m','Canales + encuentros']);}
    if(t!=='direct') rows.push(['Tornillos PYL '+screwType,screwNeed+' uds · '+screwBoxes+' caja(s) de 1.000','Consumo orientativo · incluye 10%']);
    rows.push(['Cinta de papel para juntas',tapeNeed+' m · '+tapeRolls+' rollo(s) de 150 m','Estimación según superficie visible'],['Pasta de juntas',pasteNeed+' kg · '+pasteBags+' saco(s) de 20 kg','Consumo orientativo 0,35 kg/m² · incluye 10%']);
    const obj={title:title+' · '+A.toFixed(2)+' m²',items:rows};
    $('#liningResult').innerHTML=resultHTML(obj.title,'Intereje '+Math.round(sp*1000)+' mm',rows);bindAdd($('#liningResult'),obj);
  }
  $('#liningForm').onsubmit=e=>{e.preventDefault();calcLining();};
  ['#lType','#lLayers','#lS','#lP'].forEach(x=>$(x).onchange=calcLining);
  function calcRoof(){
    const L=num('#rL'),W=num('#rW'),A=L*W,l=num('#rLayers'),fmt=$('#rBoard').value.split(',').map(Number),plates=Math.ceil(A*l*1.08/(fmt[0]*fmt[1])),sys=$('#rSys').value,d=num('#rDrop');
    const rows=[['Placa PYL '+Math.round(fmt[0]*1000)+' × '+Math.round(fmt[1]*1000),plates+' uds',l+' capa(s) · paletización '+pylPallets(plates)]];
    if(sys==='double')rows.push(['TC47 primario',Math.ceil(A/2.7)+' barras','Primaria'],['TC47 secundario',Math.ceil(A/1.5)+' barras','Secundaria'],['Crucetas',Math.ceil(A/.475)+' uds','Cruces'],['Horquillas',Math.ceil(A/.95)+' uds','Suspensiones'],['Varilla M6 1 m',Math.ceil(A/.95*Math.max(.05,d/100))+' uds','Plenum '+d+' cm']);
    else if(sys==='simple')rows.push(['TC47 portante',Math.ceil(A/1.5)+' barras','Estructura'],['Horquillas',Math.ceil(A/1.2)+' uds','Suspensiones'],['Varilla M6 1 m',Math.ceil(A/1.2*Math.max(.05,d/100))+' uds','Plenum '+d+' cm']);
    else if(sys==='sierra')rows.push(['Perfil sierra',Math.ceil(A/2.7)+' barras','Primario'],['TC47 secundario',Math.ceil(A/1.5)+' barras','Secundario'],['Suspensiones',Math.ceil(A/.95)+' uds','Puntos de suspensión']);
    else rows.push(['Canal R70',Math.ceil(2*(L+W)/3)+' barras','Perímetro'],['Montante M70',Math.ceil(A/1.8)+' barras','Portante'],['Suspensiones MS',Math.ceil(A/2.7)+' uds','Puntos de suspensión']);
    const obj={title:'Techo · '+A.toFixed(2)+' m²',items:rows};
    $('#roofResult').innerHTML=resultHTML(obj.title,'Plenum '+d+' cm',rows);bindAdd($('#roofResult'),obj);
  }
  $('#roofForm').onsubmit=e=>{e.preventDefault();calcRoof();};
  document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{currentCat=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));$('#wetWaste').value=currentCat==='puentes'?'0':'8';renderProducts();calcWet();});
  function renderProducts(){
    const s=$('#wetProduct');s.innerHTML='';
    Object.keys(data[currentCat]).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;s.appendChild(o);});
    syncWet();
  }
  function wetArea(){return $('#wetMeasureMode').value==='direct'?num('#wetArea'):num('#wetL')*num('#wetH');}
  function syncWet(){
    const name=$('#wetProduct').value,it=data[currentCat][name],dims=$('#wetMeasureMode').value==='dims';
    $('#wetAreaWrap').classList.toggle('hidden',dims);$('#wetLWrap').classList.toggle('hidden',!dims);$('#wetHWrap').classList.toggle('hidden',!dims);
    $('#wetThicknessWrap').classList.toggle('hidden',currentCat!=='revestimientos');
    $('#wetMortarWrap').classList.toggle('hidden',!(currentCat==='ladrillos'||currentCat==='bloques'));
    $('#wetSupportWrap').classList.toggle('hidden',!(currentCat==='puentes'&&it&&it.k==='level_primer'));
    if(it){
      $('#productImg').src=it.img;$('#productName').textContent=name;$('#productSpec').textContent=it.spec||'';$('#productLink').href=it.url;
      const chips=[];if(it.u)chips.push(it.u+' ud/m²');if(it.p)chips.push('Palet '+it.p);if(it.kg)chips.push(it.kg+' kg/m²·mm');if(it.min!=null&&it.max!=null)chips.push(it.min===it.max?it.min+' consumo':it.min+'–'+it.max+' consumo');
      $('#productChips').innerHTML=chips.map(x=>'<span class="chip">'+x+'</span>').join('');
    }
    $('#wetInfo').textContent=currentCat==='ladrillos'||currentCat==='bloques'?'El rendimiento base se muestra separado de la merma.':currentCat==='revestimientos'?'El consumo depende del espesor seleccionado.':'Cada puente de unión mantiene su fórmula específica.';
  }
  function calcWet(){
    syncWet();const name=$('#wetProduct').value,it=data[currentCat][name];if(!it)return;
    const A=wetArea(),w=num('#wetWaste'),f=1+w/100,rows=[];
    if(currentCat==='ladrillos'||currentCat==='bloques'){
      const base=it.u*A,uds=Math.ceil(base*f),kg=uds*it.w;
      rows.push([name,uds+' uds',it.u+' ud/m² base · '+Math.ceil(base)+' uds sin merma · '+kg.toFixed(2)+' kg · '+(uds/it.p).toFixed(2)+' palets equiv.']);
      if(it.m){const mk=it.m*A*f;if($('#wetMortar').value==='predosificado')rows.push(['Mortero',Math.ceil(mk/25)+' sacos de 25 kg',mk.toFixed(2)+' kg estimados']);else rows.push(['Mortero hecho en obra',mk.toFixed(2)+' kg','Dosificación a verificar según mortero']);}
    } else if(currentCat==='revestimientos'){
      const th=Math.max(1,num('#wetThickness')),kg=it.kg*th*A*f;rows.push([name,Math.ceil(kg/25)+' sacos',kg.toFixed(2)+' kg · espesor '+th+' mm']);if(th>it.max)rows.push(['Aviso','Espesor excedido','Máximo almacenado: '+it.max+' mm']);
    } else {
      if(it.k==='level_primer'){const s=$('#wetSupport').value,c=s==='sin_absorcion'?.075:s==='poco_poroso'?.06:.11,total=A*c*f;rows.push([name,Math.ceil(total/5)+' botes de 5 L',total.toFixed(2)+' L estimados']);}
      else if(it.k==='sikatop10'||it.k==='rango_kilos'){const c=it.k==='sikatop10'?it.min:(it.min+it.max)/2,kg=A*c*f,L=kg/it.d;rows.push([name,Math.ceil(L)+' L',L.toFixed(2)+' L exactos · '+kg.toFixed(2)+' kg aprox.']);}
      else {const L=A*((it.min+it.max)/2)*f;rows.push([name,Math.ceil(L)+' L',L.toFixed(2)+' L calculados']);}
    }
    const obj={title:name+' · '+A.toFixed(2)+' m²',items:rows};
    $('#wetResult').innerHTML=resultHTML(obj.title,'Merma '+w+' %',rows);bindAdd($('#wetResult'),obj);
  }
  $('#wetForm').onsubmit=e=>{e.preventDefault();calcWet();};
  ['#wetProduct','#wetMeasureMode','#wetThickness','#wetSupport','#wetMortar','#wetWaste'].forEach(x=>$(x).onchange=calcWet);
  function ceramicBodyLabel(k){return {porcelanico:'Porcelánico',pasta_roja:'Pasta roja',pasta_blanca:'Pasta blanca'}[k]||'Porcelánico';}
  function ceramicGlueKgM2(side,body,bond){
    const simple=side<=30?3:side<=60?3.5:4.5;
    const doble=side<=30?5:side<=60?6:6.5;
    let kg=bond==='doble'?doble:simple;
    if(body==='porcelanico'&&bond==='simple'&&side>45) kg+=0.5;
    return kg;
  }
  function calcLevel(){
    const A=Math.max(10,num('#cA')),B=Math.max(10,num('#cB')),area=num('#cArea'),w=num('#cWaste'),body=currentCerBody;
    $('#aSize').value=Math.max(A,B);
    const tileAreaM2=(A*B)/10000,tilesBase=tileAreaM2>0?area/tileAreaM2:0,tiles=Math.ceil(tilesBase*(1+w/100)),tilesM2=tileAreaM2>0?1/tileAreaM2:0;
    const clipsM2=Math.max(4, Math.ceil(tilesM2*2)),total=Math.ceil(clipsM2*area*(1+w/100)),side=Math.max(A,B);
    const bond=$('#cBond').value||'doble',glueKgM2=ceramicGlueKgM2(side,body,bond),bondLabel=bond==='doble'?'Doble encolado':'Encolado simple';
    const glueKg=glueKgM2*area*(1+w/100),groutKgM2=side<=30?0.8:side<=60?0.5:0.35,groutKg=groutKgM2*area;
    const rows=[
      ['Tipo de baldosa',ceramicBodyLabel(body),body==='porcelanico'?'Baja absorción · adhesivo C2TE o superior':'Absorción media/alta · verificar ficha'],
      ['Baldosas / piezas',tiles+' uds',tilesM2.toFixed(2)+' ud/m² base · formato '+A+' × '+B+' cm · merma '+w+' %'],
      ['Calzos de nivelación',total+' uds',clipsM2+' calzos/m² estimados'],
      ['Cuñas reutilizables','No consumibles','Se reutilizan durante la colocación'],
      ['Encolado',bondLabel,side>45||body==='porcelanico'?'Recomendado doble si lado > 45 cm o porcelánico':'Capa en soporte y/o dorso'],
      ['Cemento cola C2TE (consumo técnico)',Math.ceil(glueKg/25)+' saco(s) de 25 kg',glueKg.toFixed(1)+' kg · '+glueKgM2+' kg/m² · '+bondLabel+'. No SKU OBRAMAT.'],
      ['Mortero de juntas (consumo técnico)',Math.ceil(groutKg/5)+' saco(s) de 5 kg',groutKg.toFixed(1)+' kg · estimación según formato.']
    ];
    const obj={title:ceramicBodyLabel(body)+' · '+area.toFixed(2)+' m²',items:rows};
    $('#levelResult').innerHTML=resultHTML(obj.title,'Baldosa '+A+' × '+B+' cm · merma '+w+' %',rows);bindAdd($('#levelResult'),obj);
  }
  $('#levelForm').onsubmit=e=>{e.preventDefault();calcLevel();};
  $('#cBond').onchange=()=>{calcLevel();if(!$('#adhForm').classList.contains('hidden')) adhesiveClass();};
  function adhesiveClass(){
    const zone=$('#aZone').value,place=$('#aPlace').value,size=num('#aSize'),support=$('#aSupport').value,body=currentCerBody;
    let cls='C2TE';
    if(support==='wood') cls=size>60?'R2':'C2S1';
    else if(support==='metal') cls=size>60?'R2':'R1';
    else if(support==='radiant') cls=size>60?'C2S2':'C2S1';
    else if(place==='exterior') cls=size>90?'C2S2':'C2TES1';
    else if(size>120) cls='C2S2';
    else if(size>60) cls='C2TES1';
    else if(body==='pasta_roja' && size<=30 && support==='cement' && zone==='wall') cls='C1';
    else if(body==='porcelanico') cls=size>45?'C2TES1':'C2TE';
    else cls='C2TE';
    const meanings={C1:'Adhesivo cementoso de adherencia normal',C2:'Adhesivo cementoso de adherencia mejorada',C2TE:'Cementoso mejorado TE',C2TES1:'C2TE deformable',C2S1:'Cementoso mejorado deformable',C2S2:'Cementoso altamente deformable',R1:'Resinas reactivas',R2:'Resinas reactivas mejorado'};
    const area=num('#cArea'),bond=$('#cBond')?($('#cBond').value||'doble'):'doble',glueKgM2=ceramicGlueKgM2(size,body,bond),bondLabel=bond==='doble'?'Doble encolado':'Encolado simple';
    const rows=[['Tipo de baldosa',ceramicBodyLabel(body),'Influye en la clase mínima del adhesivo'],['Clasificación orientativa',cls,meanings[cls]||'Consultar ficha'],['Encolado',bondLabel,'Simple ≈ 3–4 kg/m² · doble ≈ 5–6 kg/m²'],['Consumo técnico C2TE',area?((glueKgM2*area).toFixed(1)+' kg · '+Math.ceil(glueKgM2*area/25)+' saco(s) 25 kg'):glueKgM2+' kg/m²',glueKgM2+' kg/m² · '+bondLabel],['Comprobación','Obligatoria','Verificar ficha técnica del fabricante']];
    $('#adhResult').classList.remove('hidden');$('#adhResult').innerHTML=resultHTML('Cemento cola · '+cls,ceramicBodyLabel(body)+' · lado mayor '+size+' cm',rows);
  }
  $('#adhForm').onsubmit=e=>{e.preventDefault();adhesiveClass();};
  document.querySelectorAll('[data-cer-body]').forEach(b=>b.onclick=()=>{currentCerBody=b.dataset.cerBody;document.querySelectorAll('[data-cer-body]').forEach(x=>x.classList.toggle('active',x===b));calcLevel();if(!$('#adhForm').classList.contains('hidden')) adhesiveClass();});
  document.querySelectorAll('[data-cer-tab]').forEach(b=>b.onclick=()=>{const level=b.dataset.cerTab==='level';document.querySelectorAll('[data-cer-tab]').forEach(x=>x.classList.toggle('active',x===b));$('#levelForm').classList.toggle('hidden',!level);$('#levelResult').classList.toggle('hidden',!level);$('#adhForm').classList.toggle('hidden',level);$('#adhResult').classList.toggle('hidden',level);});
  function renderWork(){
    const c=$('#workContent');
    c.innerHTML=work.length?work.map((x,i)=>'<div class="workItem"><b>'+(i+1)+'. '+x.title+'</b><br><button class="btn" data-del="'+i+'" style="margin-top:8px">Eliminar</button></div>').join(''):'<div class="empty">Todavía no has añadido partidas.</div>';
    c.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{work.splice(Number(b.dataset.del),1);renderWork();});
  }
  function renderList(){
    const c=$('#listContent');
    c.innerHTML=work.length?work.flatMap(x=>x.items).map(x=>'<div class="listLine"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join(''):'<div class="empty">Añade partidas para generar la lista.</div>';
  }
  renderProducts();calcWall();calcLining();calcRoof();calcWet();calcLevel();
})();
