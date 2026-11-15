'use strict';
// Round 2: seeded properties + independent arithmetic, historical editions.
// Primary text: module header URLs; EN 13445 §§6,7; EN 13480 §§4–6;
// ASME VIII-1 (2010) UG-27/32/34/99 and Appendix 1-4(d).
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
for(const f of ['en13445','en13480','asme'])require('../modules/'+f+'.js');
const mod=id=>AD.modules.find(m=>m.id===id);
const input=(id,p={})=>({p:10,K:180,K20:235,v:1,c1:.5,c2:1,...Object.fromEntries(mod(id).fields.filter(f=>'def'in f).map(f=>[f.id,f.def])),...p});
let count=0,pass=0;const failures=new Map();
function test(name,fn){count++;try{fn();pass++;}catch(e){const key=name.replace(/ seed \d+/, '');if(!failures.has(key))failures.set(key,{n:0,message:e.message});failures.get(key).n++;process.exitCode=1;}}
const near=(x,y,t=1e-9)=>assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} != ${y}`);
let seed=0x13445134;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const variants=[['en_shell',{}],['en_shell',{shape:'sph'}],['en_head',{head:'tori'}],['en_head',{head:'ell'}],['en_head',{head:'hemi'}],['en_cone',{}],['pipe',{}],['bend',{}],['ug27',{}],['ug27',{shape:'sph'}],['ug32',{}],['ug32',{head:'hemi'}],['ug32',{head:'tor6'}],['ug32',{head:'tor'}],['ug34',{}]];
function numbers(r){return [r.headline.value,r.util,r.pmax,...r.rows.map(x=>x[2]),...(r.test?[r.test.PT,r.test.req,r.test.have]:[])];}
// Compare separately evaluated polynomials and fixed point with production bisection.
function headOracle(g,P,f,fb,test=false){
 const Di=g.Da-2*(g.sn-g.c1-(test?0:g.c2)),loss=test?g.c2:0,k=Di/(2*(g.hi-loss));
 const R=g.head==='ell'?Di*(.44*k+.02):g.R-loss,r=g.head==='ell'?Di*(.5/k-.08):g.r-loss,C=.75*R+.2*Di;
 function B(e){const y=Math.min(e/R,.04),z=Math.log10(1/y),N=1.006-1/(6.2+Math.pow(90*y,4));
 const b6=N*(((-.3635*z+2.2124)*z-3.2937)*z+1.8873),b10=N*(((-.1833*z+1.0383)*z-1.2943)*z+.837),b20=Math.max(.5,.95*(.56-1.94*y-82.5*y*y));
 return r/Di<=.1?b6+(b10-b6)*(r/Di-.06)/.04:b10+(b20-b10)*(r/Di-.1)/.1;}
 let ey=10;for(let j=0;j<1000;j++)ey=(ey+B(ey)*P*C/f)/2;
 return Math.max(P*R/(2*f*g.v-P/2),ey,C*Math.pow(P*Math.pow(Di/r,.825)/(111*fb),2/3));
}
function oracle(id,g){
 const P=g.p/10,c=g.c1+g.c2;
 if(id.startsWith('en_')){
  const rp=g.K,rm=g.Rm, f=g.product==='casting'?Math.min(rp/1.9,rm/3):g.steel==='aust'?(g.A>=35?Math.max(rp/1.5,Math.min(rp/1.2,g.RmT/3)):rp/1.5):Math.min(rp/1.5,rm/2.4);
  if(id==='en_head'&&g.head!=='hemi')return headOracle(g,P,f,(g.steel==='aust'?g.Rp02:g.K)/1.5)+c;
  if(id==='en_cone'){
   const a=g.alpha*Math.PI/180;
   return Math.max(P*g.Da/((2*f*g.v+P)*Math.cos(a)),Math.pow(P*Math.pow(g.Da-g.sn,1.5)*Math.max(Math.tan(a),Math.sqrt(Math.tan(a)))/(6*f*g.v),2/3))+c;
  }
  return P*g.Da/((g.shape==='sph'||g.head==='hemi'?4:2)*f*g.v+P)+c;
 }
 if(id==='pipe'||id==='bend'){
  const f=g.product==='casting'?Math.min(g.RpT/1.9,g.Rm/3):Math.min(g.RpT*2/3,g.Rm*5/12);
  const k=id==='bend'?(4*g.R-g.Do)/(4*g.R-2*g.Do):1;
  return (g.p*g.Do/(20*f*g.v+g.p)*k+c+g.thin)*100/(100-g.tol);
 }
 const S=id==='ug32'&&['tor','tor6'].includes(g.head)&&g.Rm>500?Math.min(g.S,150*Math.min(1,g.S/g.ST)):g.S,SE=S*g.E;
 if(id==='ug34')return g.D*Math.sqrt(g.C*P/SE)+c;
 if(id==='ug27'&&g.shape==='cyl')return Math.max(P*g.D/(2*SE-1.2*P),P*g.D/(4*SE+.8*P))+c;
 if(id==='ug32'&&['tor','tor6'].includes(g.head)){
  const L=g.head==='tor6'?g.D+2*(g.sn-c):g.L;
  const M=g.head==='tor6'?1.77:(3+Math.sqrt(L/g.r))/4;
  return P*L*M/(2*SE-.2*P)+c;
 }
 return P*g.D/(id==='ug32'&&g.head==='ell'?2*SE-.2*P:4*SE-.4*P)+c;
}
for(const [id,patch] of variants){
 // Five explicit textbook substitutions per branch (75 independent cases).
 for(const [i,p] of [2,5,10,15,20].entries())test('oracle '+id+JSON.stringify(patch)+' '+i,()=>{
  const g=input(id,{...patch,p,sn:id==='ug34'?100:12}),r=mod(id).calc(g,AD.h);
  near(r.headline.value,oracle(id,g));
 });
 for(let i=0;i<320;i++){
  const diameter=400+rand()*1400,ratio=.008+rand()*.008,wall=diameter*ratio;
  const g=input(id,{...patch,Da:diameter,Do:diameter,D:diameter,sn:id==='ug34'?diameter*(.055+rand()*.025):wall,
   R:diameter*.9,r:diameter*.1,hi:(diameter-2*(wall-1.5))/4,L:diameter,RpT:150+rand()*30,
   Rp20:235,K:150+rand()*30,K20:235,Rm:360,p:1+rand()*4,v:.7+rand()*.3,E:.7+rand()*.3,
   c1:.1,c2:.2,tol:rand()*12,thin:0});
  if(id==='bend')g.R=diameter*1.5;
  const m=mod(id),r=m.calc(g,AD.h),label=id+JSON.stringify(patch)+' seed '+i;
  test(label+' consistency',()=>{
   near(r.headline.value,oracle(id,g));near(r.util,r.headline.value/g.sn);
   assert.equal(r.fail,id==='en_cone');
   if(!r.fail){assert(numbers(r).every(Number.isFinite));assert(r.util<=1);}
   const e=r.rows.find(x=>x[1]==='eord')||r.rows.find(x=>x[1]==='t0')||r.rows.find(x=>x[1]==='e');
   near(e[2]+(id==='pipe'||id==='bend'?0:g.c1+g.c2),r.headline.value);
   assert(r.formula.includes(AD.h.fmt(r.headline.value,id==='pipe'||id==='bend'?3:3)));
   if(r.test){assert(r.test.PT>=g.p);assert.equal(r.test.have,g.sn);if(id.startsWith('en_'))assert(r.test.ok);if(id==='ug27'||id==='ug32'||id==='ug34')assert.equal(r.test.ok,null);}
  });
  test(label+' monotonic',()=>{
   const req=p=>m.calc({...g,...p},AD.h).headline.value;
   assert(req({p:g.p*1.01})>r.headline.value);
   // For shaped parts scale ALL defining dimensions (fixed angle/shape).
   const larger={Da:g.Da*1.01,Do:g.Do*1.01,D:g.D*1.01,R:g.R*1.01,r:g.r*1.01,hi:g.hi*1.01,L:g.L*1.01};
   assert(req(larger)>r.headline.value);
   if(id!=='en_cone'){
    assert(m.calc({...g,sn:g.sn*1.01},AD.h).pmax>r.pmax);
    // Strength monotonicity is non-strict if tensile or buckling cap controls.
    assert(m.calc({...g,K:g.K*1.01,RpT:g.RpT*1.01,S:g.S*1.01},AD.h).pmax>=r.pmax);
   }
  });
  test(label+' pmax roundtrip',()=>{
   if(id==='en_cone'){assert(r.fail&&Number.isNaN(r.pmax)&&r.test===null);return;}
   const at=m.calc({...g,p:r.pmax},AD.h);near(at.util,1,1e-6);assert(!at.fail,JSON.stringify(at.notes.filter(n=>n[0]==='e')));
   const over=m.calc({...g,p:r.pmax*(1+1e-7)},AD.h);assert(over.fail&&over.util>1);
  });
  test(label+' drawing',()=>{
   for(const q of [g,{...g,Da:NaN,Do:NaN,D:NaN},{...g,Da:1e308,Do:1e308,D:1e308,sn:1e307,R:1e308}]){
    const svg=m.draw(q,AD.h,null);assert(svg.startsWith('<svg'));assert(!/NaN|Infinity|undefined/.test(svg));
    const fields=new Set(m.fields.map(f=>f.id));
    for(const t of svg.matchAll(/data-p="([^"]+)"/g))for(const f of t[1].split(/\s+/))assert(fields.has(f));
   }
  });
 }
}
for(const [id,patch] of variants){
 const m=mod(id),g=input(id,patch),keys=id.startsWith('en_')?['p','Da','sn','K','K20','v','Rm']:id==='pipe'||id==='bend'?['p','Do','sn','RpT','Rp20','Rm','v']:['p','D','sn','S','ST','E'];
 for(const key of keys)for(const val of [-1,NaN,Infinity,1e308])test('invalid '+id+JSON.stringify(patch)+' '+key+' '+val,()=>{
  assert(m.calc({...g,[key]:val},AD.h).fail,`${key}=${val} accepted`);
 });
 for(const c of [g.sn,g.sn+1])test('consumed wall '+id+JSON.stringify(patch)+' '+c,()=>assert(m.calc({...g,c1:c,c2:0},AD.h).fail));
}

// Exact applicability limits, with equality separate from either side.
function boundary(name,id,g,key,limit,inside,expectedAt=true){
 for(const [suffix,value,expected] of [['inside',limit*(1+inside*1e-8),true],['exact',limit,expectedAt],['outside',limit*(1-inside*1e-8),false]]){
  test(name+' '+suffix,()=>{const r=mod(id).calc(input(id,{...g,[key]:value}),AD.h);assert.equal(!r.fail,expected,JSON.stringify(r.notes.filter(n=>n[0]==='e')));});
 }
}
const low={p:.001,c1:0,c2:0,v:1};
boundary('EN shell e/De .16','en_shell',{...low,Da:1000},'sn',160,-1);
boundary('EN sphere e/De .16','en_shell',{...low,Da:1000,shape:'sph'},'sn',160,-1);
for(const head of ['tori','ell']){
 const b={...low,p:.5,Da:1000,sn:10,head,R:900,r:98,hi:245};
 if(head==='tori'){
  boundary('EN r/Di .06','en_head',b,'r',.06*980,1);
  boundary('EN r/Di .2','en_head',b,'r',.2*980,-1);
  boundary('EN R/De 1','en_head',b,'R',1000,-1);
  boundary('EN physical R>Di/2','en_head',b,'R',490,1,false);
  boundary('EN ea/De .001','en_head',{...b,r:99.8},'sn',1,1);
  boundary('EN knuckle r>=2ea','en_head',{...b,sn:40,r:80},'r',80,1);
 }else{
  // k=Di/(2hi): endpoints excluded, use k as the varied value directly.
  for(const k of [1.7,2.2])for(const d of [-1e-8,0,1e-8])test('EN ell k '+k+' '+d,()=>{
   const r=mod('en_head').calc(input('en_head',{...b,hi:980/(2*(k+d))}),AD.h);
   // At k near 1.7, equivalent r/Di exceeds the verified beta domain .2.
   // This pre-existing conservative exclusion must remain fail-closed.
   assert.equal(!r.fail,k===1.7?false:d<0);
  });
 }
}
for(const id of ['pipe','bend']){
 // Do/Di=1.7, nominal wall, not the corroded smaller analysis wall.
 boundary('EN pipe ratio '+id,id,{...low,Do:1700,R:2550,tol:0,thin:0},'sn',350,-1);
 boundary('EN tol<100 '+id,id,{...low,p:1e-12,Do:1000,R:1500,sn:100},'tol',100,-1,false);
 boundary('EN weld z<=1 '+id,id,{...low,Do:1000,R:1500,sn:20,tol:0},'v',1,-1);
 test('EN inconsistent strengths '+id,()=>assert(mod(id).calc(input(id,{Rp20:400,Rm:360})).fail));
}
boundary('EN bend R>Do/2','bend',{...low,p:1e-12,Do:1000,sn:20,tol:0},'R',500,1,false);
boundary('UG27 cylindrical t/R .5','ug27',{...low,D:1000,E:1},'sn',250,-1);
boundary('UG27 spherical t/R .356','ug27',{...low,D:1000,shape:'sph',E:1},'sn',178,-1);
boundary('UG32 hemi t/L .356','ug32',{...low,D:1000,head:'hemi',E:1},'sn',178,-1);
for(const [id,patch,ratio] of [['ug27',{shape:'cyl'},.385],['ug27',{shape:'sph'},.665],['ug32',{head:'hemi'},.665]]){
 for(const offset of [-1e-8,0,1e-8])test('ASME pressure domain '+id+JSON.stringify(patch)+' '+offset,()=>{
  const r=mod(id).calc(input(id,{...low,...patch,D:1000,sn:patch.shape==='cyl'?250:178,S:120,E:1,p:ratio*120*10*(1+offset)}),AD.h);
  // Rounded code pressure bounds slightly exceed the intersection with the
  // conservative actual-wall bound. Check applicability separately from overload.
  assert(r.fail);assert.equal(r.notes.some(n=>n[0]==='e'&&/Bereichs|Kugelbereichs|Halbkugel/.test(n[1])),offset>0);
 });
}
boundary('UG32 ell ts/L .002','ug32',{...low,D:1000,head:'ell',E:1},'sn',1.8,1);
boundary('UG32 free tor ts/L .002','ug32',{...low,D:1000,head:'tor',L:1000,r:100,E:1},'sn',2,1);
boundary('UG32 free tor r>=3t','ug32',{...low,D:1000,head:'tor',L:1000,sn:30,E:1},'r',90,1);
boundary('UG32 free tor r>=.06Do','ug32',{...low,D:1000,head:'tor',L:1000,sn:10,E:1},'r',61.2,1);
boundary('UG32 free tor L<=Do','ug32',{...low,D:1000,head:'tor',r:100,sn:10,E:1},'L',1020,-1);
boundary('UG32 free tor r<D/2','ug32',{...low,D:1000,head:'tor',L:1000,sn:10,E:1},'r',500,-1,false);
boundary('UG34 C>=.10','ug34',{...low,D:1000,sn:100,E:1},'C',.1,1);
boundary('UG34 C<=.75','ug34',{...low,D:1000,sn:100,E:1},'C',.75,-1);
// Zero may be valid for allowances, but zero geometry/strength must fail.
for(const [id,patch] of variants){
 const g=input(id,patch);
 const positive=id.startsWith('en_')?['p','Da','sn','K','K20','Rm','v']:['pipe','bend'].includes(id)?['Do','sn','RpT','Rp20','Rm','v']:['p','D','sn','S','ST','E'];
 for(const key of positive)test('zero '+id+JSON.stringify(patch)+' '+key,()=>assert(mod(id).calc({...g,[key]:0},AD.h).fail));
 for(const key of ['c1','c2'])for(const val of [-1,NaN,Infinity,1e308])test('invalid allowance '+id+key+val,()=>assert(mod(id).calc({...g,[key]:val},AD.h).fail));
}
// The round-one product/weld/material fixes must hold for EVERY EN branch.
for(const id of ['en_shell','en_head','en_cone'])for(const patch of [{product:'unknown'},{product:'casting',steel:'aust'},{weldRoute:'single'},{weldRoute:'unknown'},{steel:'aust',RmT:NaN},{steel:'aust',A:29.999}])test('R1 guard '+id+JSON.stringify(patch),()=>{
 const r=mod(id).calc(input(id,patch),AD.h);assert(r.fail&&Number.isNaN(r.pmax)&&!r.test?.ok);
});
for(const id of ['pipe','bend'])test('R2 failed cast hydrotest '+id,()=>{
 const g=input(id,{p:50,v:1,c1:0,c2:0,product:'casting',RpT:240,Rp20:240,Rm:420,Do:1000,R:1500,sn:id==='pipe'?20:25,tol:0,thin:0});
 const r=mod(id).calc(g),k=id==='pipe'?1:1.25;
 // Independent: f=126.315789, test limit=171.428571, PT=71.5.
 near(r.headline.value,5000/(480/1.9+5)*k);
 near(r.test.req,7150/(480/1.4+7.15)*k);near(r.test.PT,71.5);
 assert(r.util<1&&r.test.req>g.sn&&r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
});
// Failed-state proof must never become a false pass with extreme finite inputs.
for(const id of ['ug27','ug32','ug34'])test('R2 extreme ST '+id,()=>{
 const r=mod(id).calc(input(id,{ST:1e308}),AD.h);assert(r.fail&&!r.test.ok);
});


test('R2 EN head proof-state applicability: corroded r valid, test r invalid',()=>{
 const g=input('en_head',{head:'tori',p:298.1142857142852,K:235,K20:235,Rm:600,v:1,c1:0,c2:1,Da:1000,sn:81,R:800,r:160});
 const r=mod('en_head').calc(g,AD.h);
 // Operating t=79.9160042, corroded r=160 >=2t.
 // Initial R=799, r=159; PT=426.30342857 bar; test t=79.8999161.
 near(r.headline.value,80.91600419978987);near(r.test.req,79.89991610500404);
 assert(g.r>=2*(r.headline.value-g.c2));assert(g.r-g.c2<2*r.test.req);
 assert(r.util<1&&r.test.req<g.sn&&r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
 assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('Prüfzustand außerhalb')));
});
for(const id of ['en_shell','en_head'])test('R2 EN impossible room-temperature proof strength '+id,()=>{
 const r=mod(id).calc(input(id,{K20:500,Rm:360}),AD.h);assert(r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
});
for(const key of ['Rp02','Rp0220'])test('R2 EN impossible austenitic proof-strength order '+key,()=>{
 const r=mod('en_head').calc(input('en_head',{steel:'aust',K:170,K20:250,Rm:550,RmT:440,A:35,Rp02:130,Rp0220:200,[key]:300}),AD.h);
 assert(r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
});
// Cone remains unavailable, so applicability boundaries are tested through errors,
// not by manufacturing a completed check for an UNVERIFIED junction.
for(const alpha of [1e-8,75,75+1e-8,0])test('cone angle '+alpha,()=>{
 const r=mod('en_cone').calc(input('en_cone',{alpha,Lcyl:10000,Lcone:10000}),AD.h);
 assert(r.fail&&Number.isNaN(r.pmax)&&r.test===null);
 assert.equal(r.notes.some(n=>n[0]==='e'&&n[1].includes('Kegel außerhalb')),alpha===0||alpha>75);
});
for(const field of ['Lcyl','Lcone'])for(const d of [-1e-8,0,1e-8])test('cone distance '+field+' '+d,()=>{
 const g=input('en_cone',{Da:1000,sn:12,c1:.5,c2:1,alpha:30,Lcyl:10000,Lcone:10000});
 const limit=2*Math.sqrt(988*10.5/(field==='Lcone'?Math.cos(Math.PI/6):1));
 const r=mod('en_cone').calc({...g,[field]:limit*(1+d)},AD.h);
 assert(r.fail);assert.equal(r.notes.some(n=>n[0]==='e'&&n[1].includes('Abstand')),d<=0);
});
// Random material routes, including tensile-limited and yield-limited castings,
// and both verified austenitic elongation routes. No production oracle helpers.
for(const id of ['en_shell','en_head','pipe','bend'])for(let i=0;i<320;i++)test('material fuzz '+id+' '+i,()=>{
 const cast=i%2===0,D=600+rand()*1000;
 const g=input(id,{Da:D,Do:D,sn:D*.02,p:1+rand()*3,R:id==='bend'?1.5*D:.9*D,r:D*.1,c1:.2,c2:.8,
  product:cast?'casting':'wrought',K:150+rand()*30,K20:235,Rm:cast?280+rand()*300:550,
  RpT:150+rand()*30,Rp20:235,v:.7+rand()*.2,tol:rand()*10,thin:rand()*.2});
 if(!cast&&id.startsWith('en_'))Object.assign(g,{steel:'aust',A:i%4===1?30:35,K:170,K20:250,Rm:550,RmT:420,Rp02:130,Rp0220:200});
 const r=mod(id).calc(g,AD.h);near(r.headline.value,oracle(id,g));
 assert(!r.fail,JSON.stringify(r.notes));assert(numbers(r).every(Number.isFinite));assert(r.test.ok);
 const room=id.startsWith('en_')?(cast?Math.min(235/1.9,g.Rm/3):Math.max(250/1.5,g.A>=35?Math.min(250/1.2,550/3):0)):(cast?Math.min(235/1.9,g.Rm/3):Math.min(235/1.5,g.Rm/2.4));
 const f=r.rows.find(x=>x[1]==='fT'||x[1]==='f')[2];near(r.test.PT,Math.max(1.25*g.p*room/f,1.43*g.p));
 if(id==='en_head')near(r.test.req,headOracle({...g,v:1},r.test.PT/10,g.K20/(cast?1.33:1.05),(g.steel==='aust'?g.Rp0220:g.K20)/1.05,true)+g.c1);
 if(id==='en_shell')near(r.test.req,r.test.PT/10*g.Da/(2*g.K20/(cast?1.33:1.05)+r.test.PT/10)+g.c1);
});


boundary('EN head rating ea/De .08','en_head',{p:.5,c1:0,c2:0,v:1,Da:1000,head:'tori',R:800,r:166.5},'sn',80,-1);
test('R2 EN head out-of-scope pmax at 83mm',()=>{
 const r=mod('en_head').calc(input('en_head',{head:'tori',p:1,Da:1000,sn:83,c1:0,c2:0,R:800,r:166.5,K:235,K20:235,Rm:600,v:1}),AD.h);
 assert(r.fail&&Number.isNaN(r.pmax));assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('ea > 0,08De')));
});

test('R2 negative beta no false pass at low pressure',()=>{
 const r=mod('en_head').calc(input('en_head',{p:.1}),AD.h);
 assert(r.rows.find(x=>x[1]==='β')[2]<0);assert(r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
 assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
for(const [key,v] of failures)console.error('FAIL '+key+' ('+v.n+'): '+v.message);
console.log(`PASS ${pass}/${count}`);
