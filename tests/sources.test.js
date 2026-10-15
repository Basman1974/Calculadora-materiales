const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/auditoria/fuentes-tecnicas.json'),'utf8'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
const catalogue=context.window.CALC_DATA;

test('Cada producto del catálogo tiene un estado documental explícito',()=>{
  for(const [family,group]of Object.entries(catalogue))for(const name of Object.keys(group))assert.ok(ledger.catalogue.some(p=>p.family===family&&p.name===name),family+' '+name);
});
test('Parámetros documentados del catálogo coinciden con el registro de fuentes',()=>{
  for(const group of Object.values(catalogue))for(const item of Object.values(group)){
    if(!item.sourceId)continue;
    const source=ledger.sources[item.sourceId];assert.ok(source,item.sourceId);
    for(const [field,value]of Object.entries(source.verified_values))assert.equal(item[field],value,item.sourceId+' '+field);
    for(const field of ['manufacturer','document','document_version','page_or_section','url','verified_on','unit','conditions','status'])assert.ok(source[field],item.sourceId+' '+field);
  }
});
test('Los parámetros sin ficha identificada permanecen marcados como pendientes',()=>{
  assert.ok(ledger.orientative_parameters.length>=10);
  for(const parameter of ledger.orientative_parameters){assert.equal(parameter.status,'pendiente_de_documentar');assert.equal(parameter.url,null);}
});
