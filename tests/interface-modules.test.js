const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./material-fixture.cjs');
const clickTab=(f,tab)=>f.all.find(n=>n.dataset.cerTab===tab).click();

test('Trasdosado directo muestra pasta y medidas, sin resumir una estructura inexistente',()=>{
  const f=fixture();f.set({lL:'4,2',lH:'2,6',lPasteRate:'5,5',lDoors:'1'});f.api.liningType('direct');
  assert.match(f.nodes.liningSystemSummary.textContent,/Directo.*sin perfilería.*1 placa.*5,5 kg/);
  assert.match(f.nodes.liningMeasureSummary.textContent,/10,92 m² brutos · 9,24 m² netos/);
  assert.equal(f.nodes.lProfileWrap.classList.contains('hidden'),true);assert.equal(f.nodes.lPasteRateWrap.classList.contains('hidden'),false);
  const part=f.add('liningResult');assert.ok(Math.abs(part.net-9.24)<1e-10);assert.ok(part.items.some(r=>r[0]==='Pasta de agarre'));
});

test('Trasdosado: el envío abre huecos y señala el número incorrecto',async()=>{
  const f=fixture();f.set({lDoors:'1,5'});await f.fire('liningForm','submit');
  assert.equal(f.nodes.liningOpeningsOptions.open,true);assert.equal(f.nodes.lDoors.focused,true);assert.match(f.nodes.lDoorsError.textContent,/entero/);
  f.set({lDoors:'100'});await f.fire('liningForm','submit');assert.match(f.nodes.lDoorsError.textContent,/huecos superan/);assert.doesNotMatch(f.nodes.liningResult.innerHTML,/addWork/);
});

test('Trasdosado: cambiar sistema elimina errores de pasta o lámina que dejan de utilizarse',()=>{
  const f=fixture();f.set({lPasteRate:'error'});f.api.liningType('direct');assert.equal(f.nodes.lPasteRateError.hidden,false);
  f.api.liningType('semi');assert.equal(f.nodes.lPasteRateError.hidden,true);assert.match(f.nodes.liningSystemSummary.textContent,/omega/);
  f.set({lLayers:'2',lMembrane:'1',lMembraneWaste:'error'});f.api.lining();assert.equal(f.nodes.lMembraneWasteError.hidden,false);
  f.set({lLayers:'1'});f.api.lining();assert.equal(f.nodes.lMembrane.value,'0');assert.equal(f.nodes.lMembraneWasteError.hidden,true);assert.match(f.nodes.liningResult.innerHTML,/addWork/);
});

test('Trasdosado autoportante mantiene el aviso fuera de tabla aunque la configuración esté plegada',()=>{
  const f=fixture();f.set({lH:'8'});f.api.liningType('auto');assert.match(f.nodes.liningTechnicalNotice.textContent,/fuera de tabla.*provisional/);
  assert.equal(!!f.nodes.liningSystemOptions.open,false);assert.match(f.add('liningResult').items.find(r=>r[0]==='Montantes')[1],/No dimensionados/);
});

for(const sys of ['simple','double','sierra','cm70','desmontable60','desmontable120','escayola']){
  test('Techo '+sys+': resumen, controles pertinentes, aviso y guardado completos',()=>{
    const f=fixture();f.api.roofSys(sys);
    assert.match(f.nodes.roofMeasureSummary.textContent,/20,00 m² brutos/);assert.ok(f.nodes.roofSystemSummary.textContent.length>10);
    assert.equal(f.nodes.roofSystemOptions.classList.contains('hidden'),['desmontable60','desmontable120','escayola'].includes(sys));
    assert.equal(f.nodes.rDropWrap.classList.contains('hidden'),sys==='cm70');assert.match(f.nodes.roofTechnicalNotice.textContent,/provisional/);
    const part=f.add('roofResult');assert.ok(part.items.length>3);assert.equal(part.editor.values.rSys,sys);assert.equal(f.api.totals().incomplete,1);
  });
}

test('Techo autoportante no queda bloqueado por un descuelgue oculto incorrecto',()=>{
  const f=fixture();f.set({rDrop:'error',rMembrane:'1',rMembraneWaste:'error'});f.api.roofSys('cm70');assert.equal(f.nodes.rDrop.checkValidity(),true);
  assert.equal(f.nodes.rMembraneWaste.checkValidity(),false);f.api.roofSys('desmontable60');assert.equal(f.nodes.rMembrane.value,'0');assert.equal(f.nodes.rMembraneWasteError.hidden,true);
  f.set({rDrop:'30'});f.api.roofSys('cm70');assert.match(f.nodes.roofSystemSummary.textContent,/sin suspensiones/);assert.match(f.nodes.roofResult.innerHTML,/addWork/);
});

test('Techo: un hueco excesivo abre el bloque y explica el error junto a la superficie',async()=>{
  const f=fixture();f.set({rHoles:'21'});await f.fire('roofForm','submit');assert.equal(f.nodes.roofOpeningsOptions.open,true);assert.equal(f.nodes.rHoles.focused,true);
  assert.match(f.nodes.rHolesError.textContent,/huecos superan/);assert.doesNotMatch(f.nodes.roofResult.innerHTML,/addWork/);
});

test('Obra húmeda mantiene selector visual y buscador y presenta geometría y referencia comercial separadas',async()=>{
  const f=fixture();await f.fire('wetPickerToggle');assert.equal(f.nodes.wetPickerPanel.hidden,false);f.set({wetProductSearch:'hueco sencillo'});await f.fire('wetProductSearch','input');assert.ok(f.nodes.wetProductOptions.children.length>0);
  f.set({wetBrickL:'33',wetBrickH:'16,5',wetBrickT:'4',wetJoint:'5',wetWaste:'0',wetMortarWaste:'10'});f.api.wet();
  assert.match(f.nodes.wetBrickSummary.textContent,/33 × 16,5 × 4 cm.*5 mm/);assert.match(f.nodes.wetTechnicalNotice.textContent,/Referencia comercial.*18 ud/);
  assert.match(f.nodes.wetWasteSummary.textContent,/Producto 0 %.*mortero 10 %/);assert.equal(f.add('wetResult').items[0][1],'176 uds');
});

test('Un ladrillo sin medidas abre los ajustes necesarios; cambiar familia retira sus errores',async()=>{
  const f=fixture();f.select('ladrillos','Perforado 10 cm');await f.fire('wetForm','submit');assert.equal(f.nodes.wetBrickOptions.open,true);assert.equal(f.nodes.wetBrickL.focused,true);assert.equal(f.nodes.wetBrickLError.hidden,false);
  f.select('bloques','Bloque ligero gris 39x19x19');f.api.wet();assert.equal(f.nodes.wetBrickOptions.classList.contains('hidden'),true);assert.equal(f.nodes.wetBrickLError.hidden,true);assert.match(f.nodes.wetMortarSummary.textContent,/30 kg\/m²/);
});

test('Mortero hecho en obra no queda bloqueado por un rendimiento de saco que no utiliza',async()=>{
  const f=fixture();f.set({wetMortarYield:'0'});await f.fire('wetForm','submit');assert.equal(f.nodes.wetMortarOptions.open,true);assert.equal(f.nodes.wetMortarYieldError.hidden,false);
  f.set({wetMortar:'obra'});await f.fire('wetMortar','change');assert.equal(f.nodes.wetMortarYieldError.hidden,true);assert.match(f.nodes.wetMortarSummary.textContent,/Hecho en obra/);assert.match(f.nodes.wetResult.innerHTML,/Mortero hecho en obra/);
});

test('Revestimientos señalan un espesor fuera de intervalo y conservan las cantidades al corregirlo',async()=>{
  const f=fixture();f.select('revestimientos','weberpral prisma');f.set({wetThickness:'9'});await f.fire('wetForm','submit');assert.equal(f.nodes.wetThickness.focused,true);assert.match(f.nodes.wetThicknessError.textContent,/12–30 mm/);
  f.set({wetThickness:'15',wetArea:'10',wetWaste:'8'});await f.fire('wetThickness','input');assert.equal(f.nodes.wetThicknessError.hidden,true);assert.match(f.nodes.wetSystemSummary.textContent,/espesor 15 mm/);assert.equal(f.add('wetResult').items[0][1],'10 sacos');
});

test('Puentes conservan consumo por capa y envases, con detalles de albañilería ocultos',()=>{
  const f=fixture();f.select('puentes','SikaTop-10');f.set({wetArea:'100',wetConsumption:'0,5',wetCoats:'2',wetWaste:'0'});f.api.wet();
  assert.match(f.nodes.wetSystemSummary.textContent,/0,5 kg\/m²\/capa · 2 capa/);assert.equal(f.nodes.wetBrickOptions.classList.contains('hidden'),true);assert.equal(f.nodes.wetMortarOptions.classList.contains('hidden'),true);
  assert.equal(f.add('wetResult').items[0][1],'20 envase(s) de 5 kg');
});

test('Adhesivo permite revisar superficie, encolado y llana en la misma pestaña',async()=>{
  const f=fixture();await clickTab(f,'adhesive');assert.equal(f.nodes.levelForm.classList.contains('hidden'),false);assert.equal(f.nodes.ceramicFormatFields.classList.contains('hidden'),true);assert.equal(f.nodes.ceramicJointOptions.classList.contains('hidden'),true);
  f.set({aSize:'90',cArea:'20',cBond:'simple',cTrowel:'12'});await f.fire('aSize','input');await f.fire('cTrowel','change');assert.match(f.nodes.ceramicSystemSummary.textContent,/20 m².*Simple.*12 mm.*90 cm/);assert.match(f.nodes.adhResult.innerHTML,/108.0 kg/);
  await f.all.find(n=>n.dataset.cerBody==='pasta_roja').click();assert.equal(f.nodes.aSize.value,'90');assert.match(f.nodes.adhResult.innerHTML,/104.0 kg/);
});

test('Pasar a adhesivo retira los errores de junta inactiva y conserva el modo por m² con superficie 0',async()=>{
  const f=fixture();f.set({cJoint:'0'});await f.fire('levelForm','submit');assert.equal(f.nodes.ceramicJointOptions.open,true);assert.equal(f.nodes.cJointError.hidden,false);
  await clickTab(f,'adhesive');assert.equal(f.nodes.cJointError.hidden,true);f.set({cArea:'0'});await f.fire('cArea','input');assert.doesNotMatch(f.nodes.adhResult.innerHTML,/role="alert"/);assert.match(f.nodes.adhResult.innerHTML,/kg\/m²/);
  f.set({aSize:'error'});await f.fire('adhForm','submit');assert.equal(f.nodes.aSize.focused,true);assert.equal(f.nodes.aSizeError.hidden,false);
});

test('Una tanda mayor que la obra muestra el límite efectivo sin multiplicar las cuñas por toda la obra',()=>{
  const f=fixture();f.set({cA:'60',cB:'60',cArea:'10',cBatchArea:'200',cWaste:'0'});f.api.ceramic();assert.match(f.nodes.ceramicBatchSummary.textContent,/200 m² solicitados · 10,00 m² simultáneos/);assert.equal(f.add('levelResult').items.find(r=>r[0]==='Cuñas reutilizables')[1],'120 uds');
});

test('Editar una partida de cerámica recupera el formulario de materiales aunque estuviera abierta la orientación',async()=>{
  const f=fixture();f.set({cA:'30',cB:'60',cArea:'12'});f.api.ceramic();f.add('levelResult');await clickTab(f,'adhesive');f.api.show('work');await f.nodes.workContent.querySelectorAll('[data-edit]')[0].click();
  assert.equal(f.nodes.levelResult.classList.contains('hidden'),false);assert.equal(f.nodes.adhForm.classList.contains('hidden'),true);assert.match(f.nodes.ceramicMeasureSummary.textContent,/12 m².*30 × 60 cm/);
});

test('La orientación de adhesivo ofrece una acción funcional hacia el cálculo completo de materiales',async()=>{
  const f=fixture();f.set({cArea:'25'});await clickTab(f,'adhesive');assert.doesNotMatch(f.nodes.adhResult.innerHTML,/addWork/);
  await f.nodes.adhResult.querySelector('[data-adh-materials]').click();assert.equal(f.nodes.adhForm.classList.contains('hidden'),true);assert.equal(f.nodes.cArea.value,'25');assert.equal(f.nodes.cA.focused,true);
  assert.match(f.nodes.levelResult.innerHTML,/addWork/);assert.ok(f.add('levelResult').items.some(row=>row[0]==='Cemento cola'));
});

for(const [from,to]of [['lL','lH'],['rL','rW'],['wetL','wetH'],['cA','cB'],['cB','cArea']]){
  test('Entrada con Intro: '+from+' pasa a '+to,async()=>{const f=fixture();await f.fireNode(f.nodes[from],'keydown',{key:'Enter'});assert.equal(f.nodes[to].focused,true);});
}
