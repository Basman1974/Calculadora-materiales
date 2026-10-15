const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');
const KEY='calculadora-tarifas-v1';
const copy=x=>JSON.parse(JSON.stringify(x));
function seeded({parts,prices,extraStorage={}}={}){
  return fixture({'calculadora-work-v1':JSON.stringify(parts||[{title:'Prueba',items:[['Material','2 ud','']]}]),'calculadora-prices-v1':JSON.stringify(prices||{Material:5}),'calculadora-job-v1':JSON.stringify({vat:'0',profitPct:0,disc:0,laborExtra:0,extra:0}),...extraStorage});
}
async function provider(f,name){f.set({supplierName:name});await f.fire('supplierForm','submit');const p=f.api.catalog().providers.find(p=>p.name===name);assert.ok(p,f.nodes.catalogStatus.textContent);return p.id;}
async function tariff(f,{name='Material',unit='ud',supplier='general',price=10,included='no',vat='',date='2026-10-15',reference=''}={}){
  await f.fire('tariffReset');f.set({tariffMaterial:name,tariffUnit:unit,tariffProvider:supplier,tariffPrice:price,tariffVatIncluded:included,tariffVat:vat,tariffDate:date,tariffReference:reference});await f.fire('tariffForm','submit');
}
async function budgetPrice(f,value){f.api.show('list');const input=f.nodes.listContent.querySelectorAll('[data-price-key]')[0];input.value=String(value);await f.fireNode(input,'change');return input;}
async function lineProvider(f,id){f.api.show('list');const select=f.nodes.listContent.querySelectorAll('[data-price-provider]')[0];select.value=id;await f.fireNode(select,'change');}
function material(f,name='Material',unit='ud'){return f.api.catalog().materials.find(m=>m.name===name&&m.unit===unit);}

test('Migra precio anterior a tarifa general sin cambiar importes ni inventar fecha',()=>{
  const f=seeded();assert.equal(f.api.totals().grand,10);assert.equal(material(f).rates[0].price,5);assert.equal(material(f).rates[0].updatedAt,null);assert.equal(f.api.pricing().entries[0].price,5);assert.ok(f.storage.has(KEY));
});
test('Precio anterior sin unidad permanece pendiente, conservado y sin asignación automática',()=>{
  const f=seeded({parts:[],prices:{Desconocido:2.5}});assert.equal(f.api.catalog().pendingRates[0].name,'Desconocido');assert.equal(f.api.catalog().materials.length,0);
});
test('La migración utiliza unidades inequívocas del historial sin tomar sus precios antiguos',()=>{
  const f=seeded({parts:[],prices:{Material:7},extraStorage:{'calculadora-jobs-v1':JSON.stringify([{meta:{name:'Antigua'},work:[{title:'A',items:[['Material','1 kg','']]}],prices:{Material:3}}])}});assert.equal(material(f,'Material','kg').rates[0].price,7);
});
test('Al migrar se prioriza el precio con unidad frente al ambiguo, independientemente del orden',()=>{
  const f=seeded({prices:{'Material [ud]':9,Material:5}});assert.equal(material(f).rates[0].price,9);assert.equal(f.api.totals().grand,18);
});
test('Crear proveedor y escribir precio en Presupuesto guarda obra y catálogo sin IVA',async()=>{
  const f=seeded(),id=await provider(f,'Almacén A');await lineProvider(f,id);assert.equal(f.api.totals().missing,1);await budgetPrice(f,'7,25');assert.equal(material(f).rates.find(r=>r.providerId===id).price,7.25);assert.equal(f.api.totals().grand,14.5);assert.equal(JSON.parse(f.storage.get(KEY)).active.entries[0].providerId,id);
});
test('Se conservan los decimales de un precio unitario y el precio cero es válido',async()=>{
  const f=seeded({parts:[{title:'Tornillos',items:[['Material','1200 ud','']]}]});await budgetPrice(f,'0,083');assert.equal(f.api.totals().grand,99.6);assert.equal(material(f).rates[0].price,.083);await budgetPrice(f,'0');assert.equal(f.api.totals().missing,0);assert.equal(material(f).rates[0].price,0);
});
test('Vaciar precio deja la obra pendiente y conserva el precio del catálogo',async()=>{
  const f=seeded();await budgetPrice(f,'8');await budgetPrice(f,'');assert.equal(f.api.totals().missing,1);assert.equal(material(f).rates[0].price,8);await f.fire('jobNew');f.api.wall();f.add('wallResult');assert.ok(f.api.catalog().materials.some(m=>m.name==='Material'));
});
for(const [gross,vat,net]of [['12,10','21',10],['11','10',10],['10','0',10]]){
  test('Tarifa con IVA '+vat+' %: conserva el neto '+net,async()=>{const f=seeded();await tariff(f,{price:gross,included:'yes',vat});const rate=material(f).rates[0];assert.equal(rate.price,net);assert.equal(rate.inputPrice,Number(gross.replace(',','.')));assert.equal(f.api.totals().grand,10);});
}
test('IVA incluido exige porcentaje y una tarifa inválida no sustituye la anterior',async()=>{
  const f=seeded(),before=f.storage.get(KEY);await tariff(f,{price:12.1,included:'yes',vat:''});assert.match(f.nodes.catalogStatus.textContent,/Indica el porcentaje/);assert.equal(f.storage.get(KEY),before);
});
test('Actualizar catálogo no modifica obra y la propuesta usa los totales centrales',async()=>{
  const f=seeded();await tariff(f,{price:10});assert.equal(f.api.totals().grand,10);f.set({jobProfitPct:15,jobVat:21,jobDisc:10});f.api.show('list');await f.fire('previewTariff');assert.match(f.nodes.tariffPreview.innerHTML,/25,05/);assert.equal(f.api.totals().grand,12.52);await f.nodes.tariffPreview.querySelector('[data-apply-tariff]').click();assert.equal(f.api.totals().grand,25.05);
});
test('Una propuesta conserva los materiales sin tarifa del proveedor elegido',async()=>{
  const f=seeded({parts:[{title:'Dos',items:[['Material','2 ud',''],['Otro','3 kg','']]}],prices:{Material:5,Otro:4}}),id=await provider(f,'Proveedor B');await tariff(f,{supplier:id,price:9});const proposal=f.api.propose(id);assert.equal(proposal.changes.length,1);assert.equal(proposal.unavailable[0].name,'Otro');assert.equal(f.api.totals(proposal.pricing).grand,30);assert.equal(f.api.totals().grand,22);
});
test('Cambiar proveedor sin oferta deja la línea pendiente y no copia otro precio',async()=>{
  const f=seeded(),id=await provider(f,'Sin tarifa');await lineProvider(f,id);assert.equal(f.api.totals().missing,1);assert.equal(f.api.totals().rows[0].providerName,'Sin tarifa');
});
test('Nueva obra reutiliza catálogo y proveedor seleccionado sin heredar precios congelados',async()=>{
  const f=seeded(),id=await provider(f,'Almacén habitual');f.set({jobProvider:id});await f.fire('jobProvider','change');await lineProvider(f,id);await budgetPrice(f,'9');await tariff(f,{supplier:id,price:11});await f.fire('jobNew');assert.equal(f.api.pricing().defaultProviderId,id);assert.equal(f.api.pricing().entries.length,0);f.api.rows().push({title:'Nueva',items:[['Material','3 ud','']]});f.api.freeze();assert.equal(f.api.totals().grand,33);
});
test('Obra guardada recupera su precio y proveedor aunque cambie el catálogo',async()=>{
  const f=seeded(),id=await provider(f,'Proveedor guardado');await lineProvider(f,id);await budgetPrice(f,7);await f.fire('jobSaveSnap');await tariff(f,{supplier:id,price:19});await f.fire('jobNew');f.api.show('work');await f.nodes.savedJobs.querySelectorAll('[data-load-job]')[0].click();assert.equal(f.api.totals().grand,14);assert.equal(f.api.totals().rows[0].providerName,'Proveedor guardado');assert.equal(material(f).rates.find(r=>r.providerId===id).price,19);
});
test('Una copia antigua sin precio no adopta el precio del catálogo actual',async()=>{
  const f=seeded({extraStorage:{'calculadora-jobs-v1':JSON.stringify([{meta:{name:'Antigua',vat:'0'},work:[{title:'A',items:[['Material','2 ud','']]}]}])}});f.api.show('work');await f.nodes.savedJobs.querySelectorAll('[data-load-job]')[0].click();assert.equal(f.api.totals().missing,1);assert.equal(material(f).rates[0].price,5);
});
test('Una propuesta obsoleta se vuelve a mostrar y no se aplica a ciegas',async()=>{
  const f=seeded();await tariff(f,{price:9});await f.fire('previewTariff');const apply=f.nodes.tariffPreview.querySelector('[data-apply-tariff]');f.api.rows()[0].items[0][1]='3 ud';await apply.click();assert.equal(f.api.totals().grand,15);assert.match(f.nodes.jobPriceStatus.textContent,/Revisa de nuevo/);await f.nodes.tariffPreview.querySelector('[data-apply-tariff]').click();assert.equal(f.api.totals().grand,27);
});
test('Igual nombre en kg y sacos mantiene tarifas distintas',async()=>{
  const f=seeded({parts:[{title:'Distintas unidades',items:[['Mortero','10 kg',''],['Mortero','2 sacos','']]}],prices:{}});await tariff(f,{name:'Mortero',unit:'kg',price:1});await tariff(f,{name:'Mortero',unit:'saco',price:7});assert.equal(f.api.catalog().materials.filter(m=>m.name==='Mortero').length,2);const proposal=f.api.propose('general');assert.equal(f.api.totals(proposal.pricing).grand,24);
});
test('Dos formatos cerámicos del mismo tipo no comparten identificación ni precio',()=>{
  const part=(format)=>({title:'Cerámica',items:[['Tipo de baldosa','Porcelánico',''],['Baldosas / piezas','10 uds','formato '+format+' · merma 0 %']]});const f=seeded({parts:[part('60 × 60 cm'),part('30 × 30 cm')],prices:{}});assert.equal(f.api.totals().rows.length,2);assert.notEqual(f.api.totals().rows[0].id,f.api.totals().rows[1].id);
});
test('CSV con proveedores, unidades, referencias y fecha española conserva neto y obra',async()=>{
  const f=seeded(),text='material;unidad;precio;proveedor;referencia;fecha;iva_incluido;iva\nMaterial;ud;12,10;Almacén CSV;REF-1;15/10/2026;sí;21';const result=f.api.parsePrices(text,'general');assert.equal(result.imported,1);const rate=result.catalog.materials[0].rates.find(r=>r.providerId!=='general');assert.equal(rate.price,10);assert.equal(rate.updatedAt,'2026-10-15');f.api.commit(result.catalog,f.api.pricing());assert.equal(f.api.totals().grand,10);
});
test('CSV de dos columnas asigna solo unidad inequívoca; desconocido queda pendiente',()=>{
  const f=seeded(),result=f.api.parsePrices('concepto;precio\nMaterial;2,25\nDesconocido;1,50','general');assert.equal(result.imported,2);assert.equal(result.pending,1);assert.equal(result.catalog.materials.find(m=>m.name==='Material').rates[0].price,2.25);
});
test('CSV completo maneja comillas y no importa parcialmente tras error o duplicado',()=>{
  const f=seeded(),before=JSON.stringify(f.api.catalog());for(const bad of ['material;unidad;precio;proveedor\nMaterial;ud;2;Nuevo\nOtro;kg;-1;Nuevo','material;unidad;precio\nMaterial;ud;2\nMaterial;ud;3'])assert.throws(()=>f.api.parsePrices(bad,'general'),/Fila 3/);assert.equal(JSON.stringify(f.api.catalog()),before);const good=f.api.parsePrices('material,unidad,precio,proveedor\n"Perfil, reforzado",barra,"4,25","Almacén, norte"','general');assert.equal(good.catalog.materials.find(m=>m.name==='Perfil, reforzado').rates[0].price,4.25);
});
test('Plantillas omiten precios vacíos, conservan cero y rechazan una importación sin precios',()=>{
  const f=seeded(),result=f.api.parsePrices('material;unidad;precio\nMaterial;ud;\nOtro;kg;0','general');assert.equal(result.imported,1);assert.equal(result.omitted,1);assert.equal(result.catalog.materials.find(m=>m.name==='Otro').rates[0].price,0);assert.throws(()=>f.api.parsePrices('material;unidad;precio\nMaterial;ud;','general'),/no contiene precios/);
});
test('CSV con fecha vacía explícita no inventa la fecha de una tarifa anterior',()=>{const f=seeded(),result=f.api.parsePrices('material;unidad;precio;fecha\nMaterial;ud;5;','general');assert.equal(result.catalog.materials[0].rates[0].updatedAt,null);});
test('Completar unidad de un precio anterior lo mueve al catálogo sin cambiar la obra',async()=>{
  const f=seeded({prices:{Material:5,Desconocido:2.5}});f.api.show('prices');await f.nodes.pendingPriceContent.querySelectorAll('[data-pending-price]')[0].click();f.set({tariffUnit:'kg'});await f.fire('tariffForm','submit');assert.equal(f.api.catalog().pendingRates.length,0);assert.equal(material(f,'Desconocido','kg').rates[0].price,2.5);assert.equal(f.api.totals().grand,10);
});
test('Catálogo muestra nombres escapados y no ejecuta contenido de un CSV',async()=>{
  const f=seeded(),name='<img src=x onerror=alert(1)>';await tariff(f,{name,price:3});f.api.show('prices');assert.match(f.nodes.priceCatalogContent.innerHTML,/&lt;img/);assert.doesNotMatch(f.nodes.priceCatalogContent.innerHTML,/<img src=x/);
});
test('Error de almacenamiento mantiene catálogo y precio de obra anteriores',async()=>{
  const f=seeded(),before=f.storage.get(KEY);f.failWrites(key=>key===KEY);await tariff(f,{price:99});assert.equal(f.storage.get(KEY),before);assert.equal(material(f).rates[0].price,5);const input=await budgetPrice(f,9);assert.equal(input.checkValidity(),false);assert.equal(f.api.totals().grand,10);assert.match(f.nodes.jobPriceStatus.textContent,/No se pudo guardar/);await f.fire('exportCsv');assert.equal(f.blobs.length,0);
});
test('Recargar el dispositivo conserva proveedores, tarifas y precios de la obra',async()=>{
  const f=seeded(),id=await provider(f,'Persistente');await lineProvider(f,id);await budgetPrice(f,9);const reloaded=fixture(Object.fromEntries(f.storage));assert.equal(reloaded.api.totals().grand,18);assert.equal(reloaded.api.totals().rows[0].providerName,'Persistente');assert.equal(material(reloaded).rates.find(r=>r.providerId===id).price,9);
});
test('JSON v2 conserva y restaura tarifas, proveedores y precios congelados del historial',async()=>{
  const f=seeded(),id=await provider(f,'En copia');await lineProvider(f,id);await budgetPrice(f,7);await f.fire('jobSaveSnap');await tariff(f,{supplier:id,price:11});await f.fire('backupExport');const text=await f.blobs.at(-1).text(),backup=JSON.parse(text);assert.equal(backup.version,2);assert.equal(backup.savedJobs[0].pricing.entries[0].price,7);assert.equal(backup.priceCatalog.materials[0].rates.find(r=>r.providerId===id).price,11);await f.fire('jobNew');f.nodes.backupImport.files=[{size:text.length,text:async()=>text}];await f.fire('backupImport','change');assert.equal(f.nodes.backupStatus.textContent,'Copia restaurada.');assert.equal(f.api.totals().grand,14);
});
test('Copia v1 migra a tarifa general y proveedores mal formados no sustituyen datos',async()=>{
  const f=seeded();await f.fire('backupExport');const backup=JSON.parse(await f.blobs.at(-1).text());backup.version=1;delete backup.priceCatalog;delete backup.jobPricing;f.nodes.backupImport.files=[{size:1000,text:async()=>JSON.stringify(backup)}];await f.fire('backupImport','change');assert.equal(f.nodes.backupStatus.textContent,'Copia restaurada.');assert.equal(material(f).rates[0].price,5);await f.fire('backupExport');const bad=JSON.parse(await f.blobs.at(-1).text());bad.priceCatalog.providers.push({id:'general',name:'Duplicado'});f.nodes.backupImport.files=[{size:1000,text:async()=>JSON.stringify(bad)}];await f.fire('backupImport','change');assert.match(f.nodes.backupStatus.textContent,/No se ha restaurado/);assert.equal(f.api.totals().grand,10);
});
test('Restauración con falta de espacio revierte todas las escrituras parciales',async()=>{
  const f=seeded();await f.fire('backupExport');const backup=JSON.parse(await f.blobs.at(-1).text());backup.jobMeta.name='No debe entrar';backup.priceCatalog.materials[0].rates[0].reference='Nuevo dato';const before=Object.fromEntries(f.storage);let failed=false;f.failWrites(key=>{if(key==='calculadora-work-v1'&&!failed){failed=true;return true;}return false;});f.nodes.backupImport.files=[{size:1000,text:async()=>JSON.stringify(backup)}];await f.fire('backupImport','change');assert.match(f.nodes.backupStatus.textContent,/No se ha restaurado/);assert.deepEqual(Object.fromEntries(f.storage),before);assert.equal(f.api.state().jobMeta.name,'');
});
test('Tarifas exportadas CSV conservan precisión y protegen fórmulas de texto',async()=>{
  const f=seeded(),id=await provider(f,'=SUM(A1)');await tariff(f,{supplier:id,price:.083,reference:'REF'});await f.fire('catalogCsvExport');const csv=await f.blobs.at(-1).text();assert.match(csv,/0,083/);assert.match(csv,/"'=SUM\(A1\)"/);assert.match(csv,/"ud"/);
});
test('Ayuda y navegación incluyen catálogo, proveedores, recuperación e IVA',()=>{
  const f=seeded();f.api.show('prices');assert.equal(f.nodes.prices.classList.contains('active'),true);assert.ok(f.all.some(n=>n.dataset.open==='prices'));for(const id of ['supplierForm','tariffForm','catalogCsv','previewTariff'])assert.ok(f.nodes[id]);
});

test('Bandas para distinto perfil y calzos de distinta junta no comparten tarifa',()=>{
  const f=seeded({parts:[{title:'Tabique 48',items:[['Banda acústica','10 m',''],['Canal R48','2 barras','']]},{title:'Tabique 70',items:[['Banda acústica','10 m',''],['Canal R70','2 barras','']]},{title:'Cerámica 1',items:[['Calzos de nivelación','20 uds',''],['Mortero de juntas','1 sacos','junta 1 mm']]},{title:'Cerámica 3',items:[['Calzos de nivelación','20 uds',''],['Mortero de juntas','1 sacos','junta 3 mm']]}],prices:{}});assert.equal(f.api.totals().rows.filter(r=>r.name.startsWith('Banda acústica')).length,2);assert.equal(f.api.totals().rows.filter(r=>r.name.startsWith('Calzos de nivelación')).length,2);
});
test('El filtro por proveedor sigue mostrando materiales pendientes de tarifar',async()=>{
  const f=seeded(),id=await provider(f,'Por completar');f.set({catalogProvider:id});f.api.show('prices');assert.match(f.nodes.priceCatalogContent.innerHTML,/Material/);assert.match(f.nodes.priceCatalogContent.innerHTML,/Sin precio para este proveedor/);
});
test('Quitar una tarifa conserva precio de obra y no deja una oferta activa',async()=>{
  const f=seeded();f.api.show('prices');await f.nodes.priceCatalogContent.querySelectorAll('[data-rate-remove]')[0].click();assert.equal(material(f).rates.length,0);assert.equal(f.api.totals().grand,10);
});
test('Un precio de Presupuesto no válido mantiene el último y bloquea las exportaciones',async()=>{
  const f=seeded();for(const value of ['-1','Infinity','abc','1,2,3']){const input=await budgetPrice(f,value);assert.equal(input.checkValidity(),false);assert.equal(f.api.totals().grand,10);await f.fire('exportPrint');await f.fire('exportCsv');assert.equal(f.opens.length,0);assert.equal(f.blobs.length,0);}
});
test('Importar CSV mediante el formulario guarda proveedores sin cambiar la valoración activa',async()=>{
  const f=seeded(),text='material;unidad;precio;proveedor\nMaterial;ud;8;Importado';f.nodes.catalogCsv.files=[{size:text.length,text:async()=>text}];await f.fire('catalogCsv','change');assert.ok(f.api.catalog().providers.some(p=>p.name==='Importado'));assert.match(f.nodes.catalogCsvStatus.textContent,/1 precios importados/);assert.equal(f.api.totals().grand,10);
});
test('Tras convertir IVA de tarifa, pantalla y exportaciones usan el mismo neto y un solo IVA final',async()=>{
  const f=seeded();await tariff(f,{price:'12,10',included:'yes',vat:21});f.set({jobVat:21});f.api.show('list');await f.fire('previewTariff');await f.nodes.tariffPreview.querySelector('[data-apply-tariff]').click();assert.equal(f.api.totals().grand,24.2);await f.fire('exportCsv');assert.match(await f.blobs.at(-1).text(),/24,20/);await f.fire('exportPrint');assert.match(f.opens[0].html,/24,20 €/);await f.fire('shareBudget');assert.match(f.shared[0].text,/TOTAL: 24,20 €/);
});
test('La entrada manual y el código de referencia se escapan también en el presupuesto',async()=>{
  const f=seeded(),id=await provider(f,'<script>bad</script>');await lineProvider(f,id);await budgetPrice(f,3);assert.doesNotMatch(f.nodes.listContent.innerHTML,/<script>bad/);assert.match(f.nodes.listContent.innerHTML,/&lt;script&gt;bad/);
});

test('Un fallo al cambiar proveedor restaura la selección anterior y conserva su precio',async()=>{
  const f=seeded(),id=await provider(f,'Otro proveedor');f.api.show('list');const select=f.nodes.listContent.querySelectorAll('[data-price-provider]')[0];f.failWrites(key=>key===KEY);select.value=id;await f.fireNode(select,'change');assert.equal(select.value,'general');assert.equal(f.api.totals().grand,10);
});
test('Catálogo dañado no se sobrescribe y su contenido original se adjunta a la copia',async()=>{
  const raw='{"catalog":"dato incompleto"',f=seeded({extraStorage:{[KEY]:raw}});assert.equal(f.storage.get(KEY),raw);await tariff(f,{price:99});assert.equal(f.storage.get(KEY),raw);await f.fire('backupExport');const backup=JSON.parse(await f.blobs.at(-1).text());assert.equal(backup.priceCatalogRecovery,raw);assert.match(f.nodes.backupStatus.textContent,/no pudieron validarse/);
});
test('Las fechas inválidas y las tarifas sin unidad inequívoca no se aplican por error',()=>{
  const f=seeded({parts:[{title:'A',items:[['Mortero','10 kg',''],['Mortero','2 sacos','']]}],prices:{}});assert.throws(()=>f.api.parsePrices('material;unidad;precio;fecha\nMortero;kg;1;31/02/2026','general'),/Fecha no válida/);const result=f.api.parsePrices('concepto;precio\nMortero;7','general');assert.equal(result.pending,1);assert.equal(result.catalog.materials.every(m=>m.rates.length===0),true);
});
test('No se crean proveedores duplicados por mayúsculas o espacios de más',async()=>{
  const f=seeded();await provider(f,'Almacén Central');f.set({supplierName:'  almacén   central  '});await f.fire('supplierForm','submit');assert.equal(f.api.catalog().providers.length,2);
});

test('CSV con líneas iniciales vacías y comillas correctas se lee sin modificar precios por error',()=>{
  const f=seeded(),result=f.api.parsePrices('\n\r\nmaterial;unidad;precio\nMaterial;ud;"1,25"','general');assert.equal(result.catalog.materials[0].rates[0].price,1.25);for(const text of ['material;unidad;precio\nMaterial;ud;"1"2','material;unidad;precio\nMate"rial;ud;2'])assert.throws(()=>f.api.parsePrices(text,'general'),/CSV/);
});

test('Teclear un precio lo guarda y actualiza importes sin sustituir el campo ni perder el texto decimal',async()=>{
  const f=seeded();f.api.show('list');const input=f.nodes.listContent.querySelectorAll('[data-price-key]')[0];input.value='7,25';await f.fireNode(input,'input');assert.equal(JSON.parse(f.storage.get(KEY)).active.entries[0].price,7.25);assert.equal(f.nodes.listContent.querySelectorAll('[data-price-key]')[0],input);assert.equal(input.value,'7,25');assert.equal(f.nodes.listContent.querySelectorAll('[data-row-total]')[0].textContent,'14,50 €');assert.match(f.nodes.listContent.querySelectorAll('[data-budget-totals]')[0].innerHTML,/14,50 €/);
});

test('Volver al último precio válido elimina el error sin exigir un precio distinto',async()=>{
  const f=seeded();f.api.show('list');const input=f.nodes.listContent.querySelectorAll('[data-price-key]')[0];input.value='abc';await f.fireNode(input,'input');assert.equal(input.checkValidity(),false);input.value='5';await f.fireNode(input,'input');assert.equal(input.checkValidity(),true);await f.fire('exportCsv');assert.equal(f.blobs.length,1);assert.equal(f.api.totals().grand,10);
});

test('Un precio anterior con unidad se migra al formato conocido y se reutiliza en una obra nueva',async()=>{
  const parts=[{title:'Tabique',items:[['Banda acústica','10 m',''],['Canal R70','2 barras','']]}],f=seeded({parts,prices:{'Banda acústica [m]':.5}});assert.equal(material(f,'Banda acústica · para perfil 70 mm','m').rates[0].price,.5);await f.fire('jobNew');f.api.rows().push(copy(parts[0]));f.api.freeze();assert.equal(f.api.totals().rows.find(r=>r.name.startsWith('Banda')).unitPrice,.5);
});

test('Actualizar tarifas respeta por defecto los distintos proveedores de cada línea',async()=>{
  const f=seeded({parts:[{title:'Mixto',items:[['Material','2 ud',''],['Otro','3 kg','']]}],prices:{Material:5,Otro:4}}),a=await provider(f,'Proveedor A'),b=await provider(f,'Proveedor B');await tariff(f,{supplier:a,price:7});await tariff(f,{name:'Otro',unit:'kg',supplier:b,price:6});f.api.show('list');let selects=f.nodes.listContent.querySelectorAll('[data-price-provider]');selects[0].value=a;await f.fireNode(selects[0],'change');selects=f.nodes.listContent.querySelectorAll('[data-price-provider]');selects[1].value=b;await f.fireNode(selects[1],'change');await tariff(f,{supplier:a,price:9});await tariff(f,{name:'Otro',unit:'kg',supplier:b,price:8});f.api.show('list');await f.fire('previewTariff');await f.nodes.tariffPreview.querySelector('[data-apply-tariff]').click();assert.equal(f.api.totals().grand,42);assert.equal(f.api.totals().rows[0].providerId,a);assert.equal(f.api.totals().rows[1].providerId,b);
});
test('Se puede proponer expresamente un proveedor para toda la obra',async()=>{
  const f=seeded(),id=await provider(f,'Proveedor único');await tariff(f,{supplier:id,price:9});f.set({updateTariffProvider:id});await f.fire('previewTariff');await f.nodes.tariffPreview.querySelector('[data-apply-tariff]').click();assert.equal(f.api.totals().grand,18);assert.equal(f.api.totals().rows[0].providerId,id);
});
