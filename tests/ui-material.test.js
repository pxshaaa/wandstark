'use strict';
// Real UI event handlers and calculations, with only browser rendering stubbed.
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'),path=require('node:path');
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error(`FAIL ${name}: ${e.stack}`);}}
function boot(){
 const elements=new Map();
 class Element{
  constructor(id=''){this.id=id;this._value='';this.dataset={};this.style={};this.listeners={};this.options=[];this.children=new Map();this.classList={toggle(){},remove(){},add(){},contains(){return false;}};this.parentElement={classList:this.classList};this.textContent='';this.firstChild={textContent:''};}
  set value(v){this._value=String(v);} get value(){return this._value;}
  get selectedIndex(){return this.options.findIndex(x=>x.value===this.value);}
  set innerHTML(s){this._html=s;this.options=[...s.matchAll(/<option value="([^"]*)"[^>]*>(.*?)<\/option>/g)].map(m=>({value:m[1],textContent:m[2]}));if(this.options.length)this.value=this.options[0].value;
   if(this.id==='modFields'){
    for(const k of [...elements.keys()])if(k.startsWith('f_'))elements.delete(k);
    for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]*)"/g))get(m[1]).value=m[2];
    for(const m of s.matchAll(/<select id="([^"]+)">([\s\S]*?)<\/select>/g)){const el=get(m[1]);el.innerHTML=m[2];const sel=m[2].match(/<option value="([^"]*)" selected/);if(sel)el.value=sel[1];}
   }
  }
  get innerHTML(){return this._html||'';}
  insertAdjacentHTML(){} setAttribute(){} addEventListener(e,fn){(this.listeners[e]??=[]).push(fn);}
  fire(type='input'){for(const fn of this.listeners[type]||[])fn({target:this,preventDefault(){},stopPropagation(){}});}
  querySelector(s){if(s==='svg')return null;if(!this.children.has(s))this.children.set(s,new Element());return this.children.get(s);}
  querySelectorAll(){return [];} closest(){return null;}
 }
 function get(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);}
 const document={getElementById:get,querySelector:s=>get(s),querySelectorAll:()=>[],addEventListener(){},body:new Element()};
 const ctx={document,console,localStorage:{getItem(){return null;},setItem(){}},setTimeout(){},matchMedia:()=>({matches:false}),navigator:{}};ctx.window=ctx;
 vm.createContext(ctx);
 const load=f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
 load('src/ad.js');load('data/materials.js');for(const f of fs.readdirSync(path.join(__dirname,'../data')).filter(f=>/^mat_.*\.js$/.test(f)).sort())load('data/'+f);
 for(const f of ['b1.js','b6.js','en13445.js','en13480.js','asme.js'])load('modules/'+f);
 for(const [id,v] of Object.entries({p:'16',T:'200',K20:'265',K:'205',E:'200000',S:'1,5',ST:'1,05',c1:'0,3',c2:'1',v:'1'}))get(id).value=v;
 get('v').options=[{value:'1',textContent:'1'},{value:'0.85',textContent:'0,85'}];
 load('src/ui.js');
 const ui=ctx.AD.ui;
 return {AD:ctx.AD,ui,get,input(id,v){get(id).value=v;get(id).fire();},select(id,mod){ui.fillMatSelect('');const i=ctx.AD.materials.findIndex(m=>m.id===id);assert(i>=0,id);get('mat').value=String(i);get('mat').fire('change');if(mod)ui.setMod(mod);},result(){const d=ui.reportData();assert(d,'calculation present');return d.result;}};
}
test('1: sparse Table 1A uses lower stored stress, ≤40 °C constant',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.name==='SA-240 Type 304');assert(m);
 // II-D 2021 Table 1A p.94 row18: 150°C=103 MPa. Sparse 200°C=95.7 is conservative.
 assert.equal(b.ui.asmeAtT(m.asmeS,150),95.7);assert(b.ui.asmeAtT(m.asmeS,150)<=103);
 for(const T of [20,30,40])assert.equal(b.ui.asmeAtT(m.asmeS,T),138);
 assert.equal(b.ui.asmeAtT(m.asmeS,100),113); // II-D 2021 Table 1A p.94 row18
 assert(Number.isNaN(b.ui.asmeAtT(m.asmeS,401)));
});
test('1: formerly false UG27 pass becomes failure with conservative S',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.name==='SA-240 Type 304');b.select(m.id,'ug27');
 for(const [id,v] of Object.entries({T:150,p:20.85,c1:0,c2:0}))b.input(id,v);
 assert.equal(b.result()._g.S,95.7);assert.equal(b.result().ok,false);assert(b.result().headline.value>12.08);
});
test('2: casting detection covers family/product/name even austenitic castings',()=>{
 const b=boot();for(const m of [{name:'GP240GH'},{name:'G20Mn5'},{name:'GX2CrNi19-11',type:'austenitic'},{product:'Stahlguss'},{family:'cast steel'},{type:'cast'}])assert(b.ui.isCasting(m));
 assert(!b.ui.isCasting({name:'P265GH',family:'EN Blech'}));
 for(const mod of ['en_shell','pipe']){
  const id=b.AD.modules.find(m=>m.id===mod)?.id;if(!id)continue;
  const m=b.AD.materials.find(m=>m.name.startsWith('GP240GH'));b.select(m.id,id);assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/Gussroute/.test(t)));
 }
});
test('3: all manual override flags survive fresh restore and vessel collection',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.name==='SA-516 Gr 70');b.select(m.id,'ug27');
 for(const [id,v] of Object.entries({p:20,T:20,c1:0,c2:0,f_S:80,f_ST:100,K20:222,K:210,E:188000,S:1.8}))b.input(id,v);
 const saved=b.ui.snapshot();assert(saved.modTouched.ug27S);assert(saved.modTouched.ug27ST);assert(saved.k20Manual);assert(saved.kManual);assert(saved.eManual);assert.equal(saved.Stouched,'1');
 const c=boot();c.ui.restore(saved);assert.equal(c.result()._g.S,80);assert.equal(c.result()._g.ST,100);assert.equal(c.result()._g.K20,222);assert.equal(c.result().ok,false);assert(Math.abs(c.result().headline.value-14.97005988)<1e-6);
 c.get('vesAdd').fire('click');c.input('f_S',138);const {ds,bad}=c.ui.collectVessel();assert.equal(bad.length,0);assert.equal(ds[0].result._g.S,80);assert.equal(ds[0].result.ok,false);assert.equal(c.result()._g.S,138);
});
test('3: legacy restore preserves saved material values; modern restore clears stale flags',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.name==='SA-516 Gr 70');b.select(m.id,'ug27');b.input('f_S',80);const s=b.ui.snapshot();delete s.modTouched;delete s.k20Manual;
 const c=boot();c.ui.restore(s);assert.equal(c.result()._g.S,80);
 const fresh=boot();fresh.select(m.id,'ug27');const auto=fresh.ui.snapshot();c.ui.restore(auto);assert.equal(c.result()._g.S,138);assert.equal(Object.keys(c.ui.snapshot().modTouched).length,0);
});
test('4: duplex E source values / unsupported material and temperatures fail closed',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.id.startsWith('1.4462')&&m.family==='EN Blech');b.select(m.id,'b6');
 for(const [T,E] of [[20,200000],[100,194000],[200,186000],[300,180000]]){b.input('T',T);assert.equal(b.result()._g.E,E);}
 b.input('T',20);b.input('p',5.16631);b.input('c1',0);b.input('c2',0);assert.equal(b.result().ok,false);assert(Math.abs(b.result().pmax-5.01584)<0.00002);
 b.input('T',301);assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/E-Modul/.test(t)));
 b.select('P265GH');b.input('T',20);assert.equal(b.result()._g.E,212000);assert(!b.result().notes.some(([c,t])=>c==='e'&&/E-Modul/.test(t))); // AD ferritic table
 assert.equal(b.ui.elasticTable({name:'Alloy 625',id:'2.4856'}),null); // nickel: manual E
 assert.equal(b.ui.elasticTable({type:'duplex',name:'unlisted duplex'}),null);
});
test('5: P265GH selects exact thickness band before filling K / K20',()=>{
 const b=boot();b.select('P265GH','cyl');b.input('T',20);b.input('p',70);b.input('f_Da',1000);b.input('c1',0);b.input('c2',0);b.input('f_sn',20);
 assert.equal(b.result()._g.K,255);assert.equal(b.result()._g.K20,255);assert.equal(b.result().ok,false);assert(Math.abs(b.result().headline.value-20.17291066)<1e-6);
 b.input('f_sn',16);assert.equal(b.result()._g.K,265);b.input('f_sn',40);assert.equal(b.result()._g.K,255);b.input('f_sn',40.01);assert.equal(b.result()._g.K,245);
 b.input('f_sn',61);assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/Dickenstufe/.test(t)));
 const oldK=b.result()._g.K;b.input('T',200);assert.equal(b.result()._g.K,oldK); // no autofill outside stored bands
});
test('5: bounds preserve inclusivity, product and treatment; ranges below minimum block',()=>{
 const b=boot();for(const [p,t,yes] of [['3 ≤ t ≤ 75 mm',3,true],['3 ≤ t ≤ 75 mm',2,false],['16 < t ≤ 40 mm',16,false],['tR ≤ 35 mm',36,false],['tR ≤ 35 mm',20,false],['Blech 5 … 16 mm',4,false],['12,5 < t ≤ 25 mm',12.5,false]])assert.equal(b.ui.inBand(b.ui.thicknessBand({product:p}),t),yes,p);
 assert.equal(b.ui.inBand(b.ui.thicknessBand({product:'90 < Vergleichsdurchmesser ≤ 150 mm'}),80),false);
 const m=b.AD.materials.find(m=>m.id.startsWith('1.4462')&&m.family==='EN Blech');b.select(m.id,'cyl');b.input('f_sn',2);assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/Dickenstufe/.test(t)));
});
test('6: missing forging A does not enable enhanced austenitic stress route',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.id.startsWith('1.4541')&&m.family==='EN Schmiedestück');assert(m);assert.equal(m.A,undefined);b.select(m.id,'en_shell');
 b.input('T',200);b.input('p',31);b.input('c1',0);b.input('c2',0);b.input('f_RmT',390);
 assert.equal(b.result()._g.A,30);assert.equal(b.result().ok,false);
 assert(b.result().notes.some(([c,t])=>c==='e'&&/Erzeugnisgrenzen/.test(t)));
 // EN 10222-5 Table 4 guarantees transverse A=30. Independent EN module
 // comparison with verified strengths: enhanced route must not be used.
 const md=b.AD.modules.find(m=>m.id==='en_shell');
 const r=md.calc({...b.result()._g,K:186,K20:235,Rm:510,A:30},b.AD.h);
 assert(Math.abs(r.headline.value-12.345679012)<1e-6);
 b.input('f_A',40);assert.equal(b.result()._g.A,40);
});
test('7: first austenitic calculation validates RmT after assigning steel group',()=>{
 const b=boot();b.ui.setMod('en_shell');b.select('1.4301');assert.equal(b.result()._g.steel,'aust');assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/Rm bei/.test(t)));
});
test('8: searching retains selection and report material, report freezes calculation inputs',()=>{
 const b=boot();b.select('P265GH','cyl');b.input('T',200);const before=b.ui.reportData();const cur=b.get('mat').value;
 assert.equal(b.ui.fillMatSelect('nonexistent material'),0);assert.equal(b.get('mat').value,cur);
 b.input('matQ','1.4301');assert.equal(b.get('mat').value,cur);assert.equal(b.ui.reportData().material[0][2],'P265GH (1.0425)');assert.equal(b.ui.reportData().result._g.K,205);
 b.get('K').value='999';assert.equal(b.ui.reportData().material[3][2],before.material[3][2]);
 b.select('1.4301');assert.equal(b.ui.reportData().material[0][2],'1.4301 (X5CrNi18-10)');assert.equal(b.result()._g.K,157);
});
test('9: Table 3 bolting stresses are rejected in all pressure-wall ASME modules',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.name==='SA-193 B7');assert(m);
 for(const x of b.AD.materials.filter(m=>m.asmeS)){assert(['1A','3'].includes(x.asmeTable));assert.equal(x.asmeUse,x.asmeTable==='3'?'bolting':'pressure-wall');}assert.equal(m.asmeTable,'3');assert.equal(m.asmeUse,'bolting');
 for(const id of ['ug27','ug32','ug34']){b.select(m.id,id);assert.equal(b.result().ok,false);assert.notEqual(b.result()._g.S,172);assert(b.result().notes.some(([c,t])=>c==='e'&&/Table 3/.test(t)));assert(!b.result().notes.some(([,t])=>/Table 1A/.test(t)));}
});
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
