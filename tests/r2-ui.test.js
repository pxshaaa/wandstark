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
 for(const f of fs.readdirSync(path.join(__dirname,'../modules')).filter(f=>f.endsWith('.js')&&!f.includes('-tips')).sort())load('modules/'+f);
 for(const [id,v] of Object.entries({p:'16',T:'200',K20:'265',K:'205',E:'200000',S:'1,5',ST:'1,05',c1:'0,3',c2:'1',v:'1'}))get(id).value=v;
 get('v').options=[{value:'1',textContent:'1'},{value:'0.85',textContent:'0,85'}];
 load('data/profiles.js');load('data/flanges.js');load('src/ui.js');
 const ui=ctx.AD.ui;
 return {AD:ctx.AD,ui,get,ctx,load,input(id,v){get(id).value=v;get(id).fire();},select(id,mod){ui.fillMatSelect('');const i=ctx.AD.materials.findIndex(m=>m.id===id);assert(i>=0,id);get('mat').value=String(i);get('mat').fire('change');if(mod)ui.setMod(mod);},result(){const d=ui.reportData();assert(d,'calculation present');return d.result;}};
}
test('non-ASME material cannot reuse ASME allowable stresses',()=>{
 const b=boot();b.select(b.AD.materials.find(m=>m.name==='SA-516 Gr 70').id,'ug27');b.input('T',20);b.input('p',1);b.select('P265GH');
 assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/ASME/.test(t)));
 b.input('f_S',100);assert.equal(b.result().ok,false);b.input('f_ST',110);assert(!b.result().notes.some(([c,t])=>c==='e'&&/kein ASME-Werkstoff/.test(t))); // UG-99 remains explicitly unverified
});
test('unknown enum and weld factor fail closed on restore',()=>{
 const b=boot();b.ui.setMod('cyl');b.input('p',1);const s=b.ui.snapshot();s.vals.cyl.shape='garbage';s.wf='2';b.ui.restore(s);assert.equal(b.ui.reportData(),null);
});
test('unknown module/material and future schema cannot silently substitute',()=>{
 const b=boot();const s=b.ui.snapshot();for(const patch of [{mod:'unknown'},{matName:'deleted-grade'},{v:999}])assert.throws(()=>b.ui.restore({...s,...patch}));
});
test('missing snapshot shared values cannot inherit another session',()=>{
 const b=boot(),s=b.ui.snapshot();delete s.shared.p;assert.throws(()=>b.ui.restore(s));
});
test('EN13480 material group and actual yield stresses match selected grade',()=>{
 const b=boot();b.select('P265GH','pipe');b.input('T',200);assert.equal(b.result()._g.RpT,205);assert.equal(b.result()._g.Rp20,265);
 b.select('1.4301');assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/austenit/i.test(t)));
});
test('material interpolation never rounds strength upwards',()=>{
 const b=boot();b.select('P265GH','cyl');b.input('T',100.3);assert(Math.abs(b.result()._g.K-240.892)<1e-10);
});
test('negative temperatures need independently entered material values',()=>{
 const b=boot();b.select('P265GH','cyl');b.input('T',-100);assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/UNVERIFIED/.test(t)));
});
test('restored vessel never trusts cached green summaries',()=>{
 const b=boot();b.ui.setMod('cyl');b.input('p',999);b.get('vesAdd').fire('click');const s=b.ui.snapshot();s.vessel.comps[0].sum={ok:true,util:0,text:'OK'};b.ui.restore(s);assert.equal(b.ui.vessel().comps[0].sum.ok,false);
});
test('UI rejects nonfinite successful result and error notes',()=>{
 const b=boot();b.select('P265GH','cyl');const m=b.AD.modules.find(m=>m.id==='cyl'),calc=m.calc;
 for(const patch of [{headline:{value:Infinity}},{rows:[['invalid','x',NaN,'mm']]},{notes:[['e','unverified']]},{test:{PT:Infinity,req:1,have:2,ok:true}}]){m.calc=(g,H)=>({...calc(g,H),fail:false,util:.1,...patch});b.ui.calc();assert.equal(b.result().ok,false);}
});
// Seeded generator: reproducible material × module × temperature coverage.
let seed=0x3b928c1;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const fuzz=boot();
const stable=d=>d?JSON.stringify({...d,date:null}):null;
for(const md of fuzz.AD.modules)for(let i=0;i<300;i++)test(`roundtrip ${md.id} ${i}`,()=>{
 fuzz.ui.setMod(md.id);for(const f of md.fields.filter(f=>f.type!=='heading'&&f.type!=='select'&&f.def===''))fuzz.input('f_'+f.id,'1');
 const mt=fuzz.AD.materials[Math.floor(random()*fuzz.AD.materials.length)];
 fuzz.select(mt.id,md.id);fuzz.input('T',20+Math.floor(random()*601));fuzz.input('p',(0.1+random()*80).toFixed(8));
 const snapshot=fuzz.ui.snapshot(),before=stable(fuzz.ui.reportData()),status=fuzz.get('statusTxt').textContent;
 // Mutate independent live state, then restore: no dependence on the previous module/material.
 fuzz.input('p','999');fuzz.ui.restore(snapshot);
 assert.equal(stable(fuzz.ui.reportData()),before);assert.equal(fuzz.get('statusTxt').textContent,status);
 const d=fuzz.ui.reportData();if(d?.result.ok){const r=d.result;assert(Number.isFinite(r.util)&&r.util>=0&&r.util<=1);assert(!r.fail);assert(!r.notes.some(n=>n[0]==='e'));}
 assert(!/NaN|Infinity|undefined/.test(fuzz.get('drawing').innerHTML));
 const beforeView=stable(fuzz.ui.reportData());fuzz.ui.setView(i%2?'mob':'desk');assert.equal(stable(fuzz.ui.reportData()),beforeView);
});
test('every material table and thickness boundary: finite monotone temperature axis',()=>{
 for(const m of fuzz.AD.materials){for(const key of ['K','E','RmT','asmeS'])if(m[key]){const t=m[key];assert(t.length>0);t.forEach(([T,v],i)=>{assert(Number.isFinite(T)&&Number.isFinite(v)&&v>0,m.id);if(i)assert(T>t[i-1][0],m.id);});}
  const b=fuzz.ui.thicknessBand(m);if(b&&!b.unsupported){assert.equal(fuzz.ui.inBand(b,b.min),!!b.minInclusive,m.id);assert.equal(fuzz.ui.inBand(b,b.max),!!b.maxInclusive,m.id);assert(!fuzz.ui.inBand(b,b.min-1e-7));assert(!fuzz.ui.inBand(b,b.max+1e-7));}
 }
});
test('B4 and Zarge thickness bands use actual material thickness',()=>{
 const b=boot();for(const id of ['b4','s31']){b.select('P265GH',id);b.input('f_sn',24);b.input('T',20);assert.equal(b.result()._g.K,255);}
});
test('FFS material band uses original nominal wall rather than required residual wall',()=>{
 const b=boot();b.select('P265GH','ffs4');b.input('f_t_nom',20);b.input('f_t_min',5);b.input('T',20);assert.equal(b.result()._g.K,255);assert(!b.result().notes.some(([c,t])=>c==='e'&&/Dickenstufe/.test(t)));
});
// Primary-text audit fixtures: distinct material entries; independently copied
// from EN 10028-2:2003 Tables 3/4 (printed pp.11–14), EN 10028-3:2003
// Tables 4/5 (pp.11–12), EN 10028-7:2007 Tables 9/10/13/14 (pp.17–26).
// Source URLs opened during R2:
// (Normtext, nicht verlinkt)
// (Normtext, nicht verlinkt)
// (Normtext, nicht verlinkt)
const sourceSpots=[
 ['P235GH',null,20,235],['P265GH',null,200,205],['P295GH',null,400,167],['P355GH',null,100,323],['16Mo3',null,450,147],['13CrMo4-5',null,500,164],
 ['P235GH','16 <',200,174],['P235GH','40 <',400,122],['P265GH','16 <',200,197],['P265GH','40 <',400,139],
 ['P295GH','16 <',200,225],['P295GH','40 <',400,162],['P355GH','16 <',200,267],['P355GH','40 <',400,190],
 ['16Mo3','16 <',500,139],['16Mo3','40 <',500,134],['13CrMo4-5','16 <',200,243],['13CrMo4-5','40 <',500,159],
 ['10CrMo9-10',null,200,248],['13CrMoSi5-5+QT',null,400,322],['X10CrMoVNb9-1',null,500,324],
 ['12CrMo9-10',null,450,279],['18MnMo4-5',null,400,235],['20MnMoNi4-5',null,400,384],['15NiCuMoNb5-6-4',null,450,331],['X12CrMo5',null,500,222],
 ['P275NH',null,200,213],['P355N',null,20,355],['P355NH',null,400,202],['P355NL1',null,20,355],['P355NL2',null,20,355],['P460NH',null,200,356],
 ['P275NL1',null,20,275],['P275NL2',null,20,275],['P460NL1',null,20,460],['P460NL2',null,20,460],
 ['1.4301',null,200,157],['1.4404',null,200,167],['1.4541',null,200,186],['1.4571',null,200,196],
 ['1.4307',null,200,147],['1.4306',null,200,147],['1.4435',null,200,165],['1.4539',null,200,205],['1.4462',null,200,315],['1.4362',null,200,280],
 ['1.4401',null,200,177],['1.4550',null,200,186],['1.4432',null,200,167],['1.4429',null,200,198],['1.4547',null,200,225]
];
for(const [grade,band,T,K] of sourceSpots)test(`primary material ${grade} ${band||''}`,()=>{
 const m=fuzz.AD.materials.find(m=>m.family==='EN Blech'&&m.id.split(' | ')[0]===grade&&(!band||m.product.includes(band)));
 assert(m);assert.equal(m.K.find(p=>p[0]===T)?.[1],K);
});
// ASME II-D 2021 Table 1A, identification / tensile / yield columns, printed
// pp.12,16,20,24,28; entry source locators specify exact line numbers.
const asmeSpots=[['SA-516 Gr 60',415,220],['SA-516 Gr 65',450,240],['SA-516 Gr 70',485,260],['SA-515 Gr 60',415,220],['SA-515 Gr 70',485,260],['SA-285 Gr C',380,205],['SA-537 Cl 1',485,345],['SA-612',560,345],['SA-106 Gr B',415,240],['SA-106 Gr C',485,275],['SA-53 Gr B (seamless)',415,240],['SA-333 Gr 6',415,240]];
for(const [name,rm,sy] of asmeSpots)test(`primary ASME ${name}`,()=>{const m=fuzz.AD.materials.find(m=>m.name===name);assert.equal(m.Rm,rm);assert.equal(m.K[0][1],sy);});
test('primary E tables: GPa → N/mm², full sourced axes',()=>{
 assert.equal(JSON.stringify(fuzz.AD.Eduplex),JSON.stringify([[20,200000],[100,194000],[200,186000],[300,180000]]));
 assert.equal(JSON.stringify(fuzz.AD.Eferritic),JSON.stringify([[20,212000],[100,207000],[200,199000],[300,192000],[400,184000],[500,175000]]));
 assert.equal(JSON.stringify(fuzz.AD.Eaustenitic),JSON.stringify([[20,200000],[100,194000],[200,186000],[300,179000],[400,172000],[500,165000]]));
});
test('DIN tube external diameter product limit cannot be ignored',()=>{
 const b=boot(),m=b.AD.materials.find(m=>m.id.startsWith('St 35.8 |'));b.select(m.id,'cyl');b.input('f_sn',2);b.input('p',1);
 b.input('f_Da',30);assert.equal(b.result().ok,false);b.input('f_Da',30.0001);assert(!b.result().notes.some(([c,t])=>c==='e'&&/Erzeugnisgrenze/.test(t)));b.input('f_Da',29.9999);assert.equal(b.result().ok,false);
});
// Independent integration oracles: hand interpolation and hand B1 equation,
// including the bar → N/mm² conversion. Five non-tabulated temperatures.
for(const [T,K] of [[120,233.8],[140,226.6],[160,219.4],[180,212.2],[220,198.2]])test(`B1 material / units oracle ${T}`,()=>{
 const b=boot();b.select('P265GH','cyl');for(const [id,v] of Object.entries({T,p:10,c1:0,c2:0,S:1.5,f_Da:1000,f_sn:12}))b.input(id,v);
 const r=b.result(),expected=1000/(2*K/1.5+1);assert(Math.abs(r._g.K-K)<1e-10);assert(Math.abs(r.headline.value-expected)<1e-10);assert(Math.abs(r.util-expected/12)<1e-10);
 assert.equal(b.ui.reportData().material[3][2],String(K).replace('.',','));
});
test('ambiguous EN hot thickness limits fail closed exactly at 16 mm',()=>{
 const b=boot();for(const grade of ['16Mo3','13CrMo4-5','10CrMo9-10']){
  const m=b.AD.materials.find(m=>m.family==='EN Blech'&&m.id.split(' | ')[0]===grade);b.select(m.id,'cyl');b.input('T',200);
  for(const [wall,blocked] of [[15.999999,false],[16,true],[16.000001,grade==='10CrMo9-10']]){b.input('f_sn',wall);const r=b.result();assert.equal(r.notes.some(([c,t])=>c==='e'&&/Warmkennwert|Dickenstufe/.test(t)),blocked,grade+' '+wall);}
 }
});
test('invalid vessel component is reported and current UI restored after collection',()=>{
 const b=boot();b.ui.setMod('cyl');b.get('vesAdd').fire('click');const s=b.ui.snapshot();s.vessel.comps[0].snap.mod='missing';b.ui.restore(s);const before=stable(b.ui.reportData());const {ds,bad}=b.ui.collectVessel();assert.equal(ds.length,0);assert.equal(bad.length,1);assert.equal(stable(b.ui.reportData()),before);assert.equal(b.ui.vessel().comps[0].sum.ok,false);
});
test('ASME test state (UG-99, pressure only) informs but does not block',()=>{
 const b=boot();b.select(b.AD.materials.find(m=>m.name==='SA-516 Gr 70').id,'ug27');b.input('p',1);b.input('T',20);assert.equal(b.result().test.ok,null);assert.equal(b.result().ok,true);assert(b.result().notes.some(([c,t])=>c==='w'&&/nur der Prüfdruck/.test(t)));
});
test('matching numeric pressure cannot attach the PED formula to ASME/EN tests',()=>{
 const b=boot();for(const id of ['ug27','en_shell','pipe']){b.ui.setMod(id);const md=b.AD.modules.find(m=>m.id===id),calc=md.calc;md.calc=(g,H)=>{const r=calc(g,H);return {...r,test:{...r.test,PT:H.PT(g)}};};b.ui.calc();assert(!b.get('testNote').textContent.includes('K20/K'));}
});
for(const [T,K] of [[120,233.8],[140,226.6],[160,219.4],[180,212.2],[220,198.2]])test(`EN pipe selected material oracle ${T}`,()=>{
 const b=boot();b.select('P265GH','pipe');for(const [id,v] of Object.entries({T,p:10,c1:0,c2:0,f_tol:0,f_Do:219.1,f_sn:8}))b.input(id,v);
 const r=b.result(),f=Math.min(K/1.5,410/2.4),f20=Math.min(265/1.5,410/2.4),expected=219.1/(2*f+1),pm=20*f*8/(219.1-8),pt=Math.max(12.5*f20/f,14.3);
 assert(Math.abs(r._g.RpT-K)<1e-10);assert(Math.abs(r.headline.value-expected)<1e-10);assert(Math.abs(r.pmax-pm)<1e-10);assert(Math.abs(r.test.PT-pt)<1e-10);
});
for(const [T,S] of [[20,138],[100,138],[150,138],[250,136],[350,101]])test(`ASME selected stress oracle ${T}`,()=>{
 const b=boot();b.select(b.AD.materials.find(m=>m.name==='SA-516 Gr 70').id,'ug27');for(const [id,v] of Object.entries({T,p:10,c1:0,c2:0,f_D:1000,f_sn:12,f_E:.85}))b.input(id,v);
 const r=b.result(),req=500/(S*.85-.6),pm=10*S*.85*12/(500+.6*12),pt=1.3*pm*138/S;
 assert.equal(r._g.S,S);assert.equal(r._g.ST,138);assert(Math.abs(r.headline.value-req)<1e-10);assert(Math.abs(r.pmax-pm)<1e-10);assert(Math.abs(r.test.PT-pt)<1e-10);assert.equal(r.ok,true); // UG-99 test pressure is informative
});
test('B8 effective dimensions cannot certify original material thickness',()=>{
 const b=boot();b.select('P265GH','b8');assert.equal(b.result().ok,false);assert(b.result().notes.some(([c,t])=>c==='e'&&/Dickenstufe für B8/.test(t)));
});
test('lifting-eye plate thickness selects actual 24 mm band',()=>{
 const b=boot();b.select('P265GH','s3o');b.input('f_t',24);b.input('T',20);assert.equal(b.result()._g.K,255);
});
test('calculation exception clears report and refreshes current geometry',()=>{
 const b=boot();b.ui.setMod('cyl');const md=b.AD.modules.find(m=>m.id==='cyl');md.draw=g=>'<svg>Da '+g.Da+'</svg>';b.ui.calc();md.calc=()=>{throw new Error('test failure');};b.input('f_Da',2000);assert.equal(b.ui.reportData(),null);assert.equal(b.get('drawing').innerHTML,'<svg>Da 2000</svg>');
});
async function reportAudit(){
 const b=boot(),captured=[];
 class Pdf{
  constructor(){this.tables=[];this.texts=[];this.lastAutoTable={finalY:30};captured.push(this);}
  text(t){this.texts.push(t);}autoTable(o){this.tables.push(o.body);this.lastAutoTable={finalY:30};}
  getFont(){return {fontName:'helvetica',fontStyle:'normal'};}getFontSize(){return 10;}getNumberOfPages(){return 1;}
  splitTextToSize(s){return [s];}
 }
 for(const k of ['addPage','setFillColor','rect','setTextColor','setFont','setFontSize','setDrawColor','setLineWidth','line','roundedRect','circle','setPage','addImage'])Pdf.prototype[k]=function(){};
 b.ctx.AD_LIBS=[];b.ctx.jspdf={jsPDF:Pdf};b.load('src/report.js');
 for(const md of b.AD.modules){
  total++;try{
   b.select('P265GH',md.id);b.input('T',20);b.input('p',10);for(const f of md.fields.filter(f=>f.type!=='heading'&&f.type!=='select'&&f.def===''))b.input('f_'+f.id,'1');const d=b.ui.reportData();assert(d,md.id);
   const frozen=stable(d);const pdf=await b.AD.report.buildPdf(d);
   assert.equal(stable(d),frozen);assert(pdf.texts.includes(d.result.ok?'NACHWEIS ERFÜLLT':'NACHWEIS NICHT ERFÜLLT'));
   const all=JSON.stringify(pdf.tables);for(const row of [...d.shared,...d.material,...d.factors,...d.fields,...d.result.rows]){
    if(typeof row[2]==='number'&&Number.isFinite(row[2]))assert(all.includes(b.AD.h.n(row[2]).replace(/\u2212/g,'-')),md.id+': '+row[0]);
   }
   const hl=d.result.headline;if(hl.text==null&&Number.isFinite(hl.value))assert(pdf.texts.some(s=>typeof s==='string'&&s.includes(b.AD.h.fmt(hl.value))),md.id);
   if(Number.isFinite(d.result.pmax))assert(pdf.texts.some(s=>typeof s==='string'&&s.includes('zulässiger Druck '+b.AD.h.fmt(d.result.pmax,2))),md.id);
   if(['ASME','EN 13445','EN 13480'].includes(md.group))assert(!d.factors.some(r=>['S','S′'].includes(r[1])));
   passed++;
  }catch(e){console.error('FAIL PDF '+md.id+': '+e.stack);}
 }
 total++;try{await assert.rejects(b.AD.report.buildVesselPdf({name:'empty'},[]));passed++;}catch(e){console.error('FAIL empty vessel PDF: '+e.stack);}
 // Combined report status and per-component sections use the same result objects.
 total++;try{b.ui.setMod('cyl');b.get('vesAdd').fire('click');b.ui.setMod('sph');b.get('vesAdd').fire('click');const {ds,bad}=b.ui.collectVessel();assert.equal(bad.length,0);const pdf=await b.AD.report.buildVesselPdf({name:'R2 audit'},ds);assert.equal(pdf.tables[0].length,2);assert.equal(pdf.texts.filter(t=>/^NACHWEIS /.test(t)).length,2);passed++;}catch(e){console.error('FAIL vessel PDF: '+e.stack);}
 total++;try{
  let attempts=0;b.ctx.AD_LIBS=['https://example.invalid/r2.js'];b.ctx.document.scripts=[];
  b.ctx.document.createElement=()=>({remove(){b.ctx.document.scripts.splice(b.ctx.document.scripts.indexOf(this),1);}});
  b.ctx.document.head={appendChild(s){b.ctx.document.scripts.push(s);attempts++;if(attempts===1)s.onerror();else s.onload();}};
  b.load('src/report.js');b.ui.setMod('cyl');const d=b.ui.reportData();await assert.rejects(b.AD.report.buildPdf(d));await b.AD.report.buildPdf(d);assert.equal(attempts,2);passed++;
 }catch(e){console.error('FAIL PDF library retry: '+e.stack);}
 total++;try{
  // Resolve an older PDF after a newer preview. It must not append stale pages.
  const pending=[],canvases=[];b.ctx.pdfjsLib={GlobalWorkerOptions:{},getDocument(){return {promise:new Promise(resolve=>pending.push(resolve))};}};
  Pdf.prototype.output=()=>new ArrayBuffer(0);b.get('pvClose').focus=()=>{};b.get('pvPages').clientWidth=600;b.get('pvPages').appendChild=c=>canvases.push(c);
  const script=b.ctx.document.createElement;b.ctx.document.createElement=tag=>tag==='canvas'?{style:{},setAttribute(){},getContext(){return {};}}:script();
  const d=b.ui.reportData(),one=b.AD.report.previewVessel({name:'old'},[{...d,part:'one'}],()=>{});
  for(let i=0;i<5&&pending.length<1;i++)await new Promise(setImmediate);assert.equal(pending.length,1);b.get('pvClose').fire('click');
  const two=b.AD.report.previewVessel({name:'new'},[{...d,part:'two'}],()=>{});for(let i=0;i<5&&pending.length<2;i++)await new Promise(setImmediate);assert.equal(pending.length,2);
  const pdf=n=>({numPages:n,async getPage(){return {getViewport({scale}){return {width:200*scale,height:300*scale};},render(){return {promise:Promise.resolve()};}};}});
  pending[1](pdf(1));await two;pending[0](pdf(2));await one;assert.equal(canvases.length,1);assert.equal(b.get('pvInfo').textContent,'1 Seite');passed++;
 }catch(e){console.error('FAIL stale PDF preview: '+e.stack);}
 console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
}
reportAudit().catch(e=>{console.error('FAIL report audit '+e.stack);process.exitCode=1;});
