const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

// Ejecuta los tres fragmentos originales. Simula controles, no el renderizado móvil.
module.exports=function fixture(storageValues={}){
  const nodes={},all=[],storage=new Map(Object.entries(storageValues));let storageFailure=null;const blobs=[],downloads=[],opens=[],shared=[];
  const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  class Node{
    set value(value){this.currentValue=String(value??'');}
    get value(){return this.currentValue||'';}
    constructor(attrs={},tag='div'){
      this.attributes=attrs;this.id=attrs.id||'';this.tagName=tag.toUpperCase();this.dataset={};this.events={};this.value=attrs.value||'';this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this.children=[];this.options=[];
      const classes=new Set((attrs.class||'').split(' '));
      this.classList={contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>{if(on===undefined)on=!classes.has(c);on?classes.add(c):classes.delete(c);}};
      for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=v;
      this.style={setProperty:()=>{}};
    }
    addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
    setAttribute(k,v){this.attributes[k]=v;}
    setCustomValidity(message){this.error=message;}
    checkValidity(){return !this.error;}
    reportValidity(){return this.checkValidity();}
    focus(){document.activeElement=this;this.focused=true;}
    blur(){if(document.activeElement===this)document.activeElement=null;}
    select(){this.selected=true;}
    scrollIntoView(){this.scrolled=true;}
    get validationMessage(){return this.error||'';}
    append(...items){items.forEach(n=>this.appendChild(n));}
    appendChild(n){this.children.push(n);if(this.tagName==='SELECT'){this.options.push(n);if(!this.value)this.value=n.value;}}
    replaceChildren(){this.children=[];}
    set selectedIndex(i){this.value=this.options[i]?.value||'';}
    set innerHTML(value){this.html=value;this.children=[];if(this.tagName==='SELECT'){this.options=[];this.value='';}const stack=[this];for(const m of value.matchAll(/<(\/)?([a-z][\w-]*)\b([^>]*)>/g)){const tag=m[2];if(m[1]){while(stack.length>1){const last=stack.pop();if(last.tagName===tag.toUpperCase())break;}continue;}const n=new Node(attributes(m[3]),tag);n.section=this.section;n.parentElement=stack.at(-1);if(tag==='select'){const body=value.slice(m.index+m[0].length).split('</select>')[0];for(const option of body.matchAll(/<option\b([^>]*)>/g)){const o=new Node(attributes(option[1]),'option');n.options.push(o);if(!n.value||'selected'in o.attributes)n.value=o.value;}}this.children.push(n);if(!['input','br','img','hr','meta','link'].includes(tag))stack.push(n);}}
    get innerHTML(){return this.html||'';}
    querySelectorAll(selector){return choose(this.children,selector);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||new Node();}
    closest(selector){return selector==='form'?this.form||null:selector==='.screen'?this.section||null:null;}
    async dispatchEvent(event){await fire(this,event.type);}
    click(){if(this.disabled)return;if(this.tagName==='A')downloads.push({href:this.href,download:this.download});return fire(this,'click');}
  }
  function attributes(text){const attrs={};for(const m of text.matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[m[1]]=(m[2]||'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');return attrs;}
  function choose(list,selector){
    if(selector.includes(','))return [...new Set(selector.split(',').flatMap(s=>choose(list,s.trim())))];
    const attr=selector.match(/\[([\w-]+)(?:="([^"]*)")?\]/);
    if(attr)return list.filter(n=>attr[1]in n.attributes&&(attr[2]===undefined||n.attributes[attr[1]]===attr[2]));
    if(selector.startsWith('.'))return list.filter(n=>n.classList.contains(selector.slice(1)));
    return list.filter(n=>n.tagName===selector.toUpperCase());
  }
  const html=['ui-a.html','ui-b.html','ui-c.html'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('');
  for(const m of html.matchAll(/<(\w+)\b([^>]*)>/g)){
    const attrs=attributes(m[2]);if(!attrs.id&&!Object.keys(attrs).some(k=>k.startsWith('data-')))continue;
    const n=new Node(attrs,m[1]);n.offset=m.index;all.push(n);if(n.id)nodes[n.id]=n;
    if(m[1]==='select'){
      const body=html.slice(m.index+m[0].length).split('</select>')[0];
      for(const opt of body.matchAll(/<option\b([^>]*)>([^<]*)/g)){const o=new Node(attributes(opt[1]),'option');o.textContent=opt[2];n.options.push(o);if(!n.value||'selected'in o.attributes)n.value=o.value;}
    }
  }
  for(const m of html.matchAll(/<(section|form)\b[^>]*id="([^"]+)"[^>]*>/g)){
    const parent=nodes[m[2]],end=html.indexOf('</'+m[1]+'>',m.index);
    const children=all.filter(n=>n.offset>m.index&&n.offset<end);
    for(const n of children){if(m[1]==='form')n.form=parent;else n.section=parent;}
    parent.children=children;
  }
  for(const m of html.matchAll(/<details\b[^>]*id="([^"]+)"[^>]*>/g)){
    const parent=nodes[m[1]],end=html.indexOf('</details>',m.index);for(const node of all.filter(n=>n.offset>m.index&&n.offset<end))node.parentElement=parent;
  }
  const document={readyState:'complete',getElementById:id=>nodes[id]||null,querySelector:s=>s[0]==='#'?nodes[s.slice(1)]||null:choose(all,s)[0]||null,querySelectorAll:s=>choose(all,s),createElement:tag=>new Node({},tag),addEventListener:()=>{},body:new Node(),documentElement:new Node()};
  const context=vm.createContext({document,window:{addEventListener:()=>{},scrollTo:()=>{},scrollY:0,CALC_DATA:{},print:()=>{},open:url=>{const popup={url,html:'',focus:()=>{},print:()=>{}};popup.document={write:text=>popup.html+=text,close:()=>{}};opens.push(popup);return popup;}},history:{replaceState:()=>{},pushState:()=>{}},navigator:{share:async data=>shared.push(data)},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(storageFailure?.(k,v))throw Error('QuotaExceededError');storage.set(k,v);},removeItem:k=>storage.delete(k)},URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:test/'+blobs.length;},revokeObjectURL:()=>{}},Blob,Event,confirm:()=>true,alert:()=>{},setTimeout:()=>{}});
  vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
  const app=['app-a1.js','app-a2.js','app-b.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
  vm.runInContext(app.replace(/\}\)\(\);\s*$/,`globalThis.api={wall:calcWall,lining:calcLining,roof:calcRoof,roofAxis,roofHangerAxis,roofCeil,roofWallStock,wet:calcWet,ceramic:calcLevel,totals:budgetTotals,show,liningType:setLiningType,roofSys:setRoofSys,wetCat:setWetCat,products:renderProducts,rod:rodRow,apply:applyWetDefaults,setCat:cat=>currentCat=cat,rows:()=>work,state:()=>({work,jobMeta,priceBook,savedJobs,priceCatalog,jobPricing}),catalog:()=>priceCatalog,pricing:()=>jobPricing,freeze:freezeJobPrices,parsePrices:parseProviderTariff,propose:proposeTariff,commit:commitPricing,net:netMaterialPrice,id:materialPriceId,validCatalog:validPriceCatalog,validPricing:validJobPricing,preview:showTariffPreview};})();`),context);
  async function fire(n,event='click',extra={}){const e={type:event,target:n,preventDefault:()=>{},stopPropagation:()=>{},...extra};if(n['on'+event])await n['on'+event](e);for(const fn of n.events[event]||[])await fn(e);}
  return {nodes,all,storage,blobs,downloads,opens,shared,failWrites:predicate=>storageFailure=predicate,fireNode:fire,api:context.api,data:context.window.CALC_DATA,fire:(id,event)=>fire(nodes[id],event),set:values=>Object.entries(values).forEach(([id,v])=>nodes[id].value=String(v)),select:(cat,name)=>{context.api.setCat(cat);context.api.products();nodes.wetProduct.value=name;context.api.apply(context.window.CALC_DATA[cat][name]);},add:resultId=>{nodes[resultId].querySelector('.addWork').click();return context.api.rows().at(-1);}};
};
