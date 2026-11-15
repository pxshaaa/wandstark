'use strict';
// Round 2 independent equilibrium worksheets and seeded metamorphic tests.
// Primary texts: AD B9 02.2010 / correction 09.2016 §§1,2.6,4, Fig.9,
// (Normtext, nicht verlinkt) pp.304–323.
// EN 13480-3:2017+A5:2022 §§4.3,5.2.1,6.1,8.3,8.4:
// (Normtext, nicht verlinkt)
// b9k deliberately tests its declared UNVERIFIED cylinder substitute, not Fig.10.
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
for(const f of ['b9','b9k','b9-tips','tee'])require('../modules/'+f+'.js');
let total=0,passed=0;
function check(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function near(a,b,tol=1e-10){assert(Number.isFinite(a)&&Number.isFinite(b));assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const row=(r,k)=>{const x=r.rows.find(x=>x[1]===k);assert(x,'missing '+k);return x[2];};
const base=m=>({p:1,K:150,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.filter(f=>'def'in f).map(f=>[f.id,f.def]))});
let seed=0x251410;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const modules=AD.modules.filter(m=>['b9','b9k','tee_ad','tee_en'].includes(m.id));
// Independent worksheet geometry: run inner radius=495, net wall=10,
// branch inner radius=65, net wall=10.  b=sqrt(1000*10)=100.
// Finite branch lengths below either limit. AD areas:1000 and 10*L.
// EN area includes the corner rectangle:1100 and 10*L.
// Ap=495*175 + 65*(L+10)=87275+65*L.
for(const m of modules){
 const en=m.id==='tee_en',tee=m.id.startsWith('tee'),sphere=m.id==='b9k';
 for(const [i,worksheet] of [
  {L:0,K:150,v:1,c:0},{L:10,K:180,v:.9,c:0},
  {L:20,K:150,v:1,c:0},{L:30,K:120,v:1,c:0},
  {L:20,K:180,v:1,c:2},{L:20,K:150,v:1,c:0,kind:'extruded'}
 ].entries())check(m.id+' independent worksheet '+i,()=>{
  const {L,K,v,c,kind='weld'}=worksheet;
  const g={...base(m),Da:1010+2*c,Do:1010+2*c,R:495,sn:10+c,sA:10+c,eord:10+c,dA:150+2*c,ss:10+c,sS:10+c,ls:tee&&en?200:L,lb:L,K,v,c1:c,c2:0,tol:0,thin:0,RpT:K,Rp20:235,Rm:360,kind};
  const q=tee&&kind==='extruded'?.9:1,V=tee&&kind!=='weld'?1:v;
  // EN net analysis bores are 990+2c / 130+2c; AD uses 990 / 130.
  const b=en?Math.sqrt((1000+2*c)*10):100;
  const A=q*10*(b+(en?10:0)),B=q*10*L;
  const Ap=en?(495+c)*(b+10+65+c)+(65+c)*(L+10):87275+65*L;
  const F=(en?Math.min(K/1.5,150):K/1.5)*V;
  const area=g.p/10*Ap/((F-g.p/20)*(A+B));
  const pShell=20*F*10/(1000+2*c),pN=20*F*10/(140+2*c);
  const P=Math.min(10*F*(A+B)/(Ap+(A+B)/2),sphere?40*F*10/(1000+2*c):pShell,pN);
  const r=m.calc(g,AD.h);assert(!r.fail);near(row(r,tee?'A0':'Aσ0'),A);near(row(r,tee?'A1':'Aσ1'),B);near(row(r,'Ap'),Ap);near(r.pmax,P);
  near(r.util,Math.max(area,g.p/(sphere?40*F*10/(1000+2*c):pShell),g.p/pN));near(r.headline.value,100*r.util);
  if(sphere)assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
  if(m.id==='tee_ad'){
   const PT=Math.max(1.25*g.p*235/K,1.43*g.p),Ft=235/1.05*V;
   const eta=Math.max(PT/10*Ap/((Ft-PT/20)*(A+B)),PT/(20*Ft*10/(1000+2*c)),PT/(20*Ft*10/(140+2*c)));
   near(r.test.PT,PT);near(r.test.req,100*eta);assert.equal(r.test.ok,eta<=1);
  }else assert.equal(r.test,null);
 });
 for(let i=0;i<350;i++)check(m.id+' seeded properties '+i,()=>{
  const D=500+random()*1200,t=8+random()*15,u=3+random()*3,c=random(),p=0.2+random()*3;
  const g={...base(m),p,K:100+random()*150,v:.75+random()*.25,Da:D,Do:D,R:(D-2*(t+c))/2,sn:t+c,sA:t+c,eord:t+c,dA:90+random()*70,ss:u+c,sS:u+c,c1:c,c2:0,ls:random()*120,lb:random()*100,tol:0,thin:0,RpT:150+random()*60,Rp20:235,Rm:360};
  const r=m.calc(g,AD.h);assert(!r.fail,'generated valid geometry '+JSON.stringify(g));
  assert(Number.isFinite(r.pmax)&&r.pmax>0);near(r.headline.value,100*r.util);
  for(const x of r.rows)assert(Number.isFinite(x[2]),'nonfinite '+x[1]);
  assert(!/NaN|Infinity|undefined/.test(r.formula));
  const at=m.calc({...g,p:r.pmax},AD.h);assert(!at.fail,'equality rejected '+r.pmax);near(at.util,1,1e-6);near(at.headline.value,100,1e-6);
  const over=m.calc({...g,p:r.pmax*(1+1e-7)},AD.h);assert(over.fail&&over.util>1,'positive overload accepted');
  for(const P of [0,r.pmax*.999,r.pmax*1.001]){const a=m.calc({...g,p:P},AD.h);assert.equal(a.fail,a.util>1);}
  const hi=m.calc({...g,p:p*1.1},AD.h);
  const req=sphere?'s,B1':tee?'s,Rohr':'s,B1';assert(row(hi,req)>row(r,req));
  const larger=m.calc({...g,Da:D*1.01,Do:D*1.01,R:g.R*1.01},AD.h);assert(row(larger,req)>row(r,req));
  const thicker=m.calc({...g,sn:g.sn+.1,sA:g.sA+.1,eord:g.eord+.1},AD.h);assert(thicker.pmax>=r.pmax);
  const stronger=m.calc({...g,K:g.K*1.01,RpT:g.RpT*1.01,Rm:g.Rm*1.01},AD.h);assert(stronger.pmax>=r.pmax);
  near(row(r,'η'),r.util);assert(r.formula.includes(AD.h.fmt(r.util,4))||r.formula.includes(AD.h.fmt(r.util)));
  const svg=m.draw(g,AD.h,r);assert(!/NaN|Infinity|undefined/.test(svg));
  const geometric=new Set(m.fields.filter(f=>f.unit==='mm'||['shape','mount','kind','angle'].includes(f.id)).map(f=>f.id));
  for(const tag of svg.matchAll(/data-p="([^"]+)"/g))for(const id of tag[1].split(/\s+/))assert(geometric.has(id),'non-geometric tag '+id);
  if(r.test){assert(Number.isFinite(r.test.PT)&&Number.isFinite(r.test.req));assert.equal(r.test.ok,r.test.req<=r.test.have);}
 });
 // Invalid active inputs; zero remains valid for pressure, allowances and lengths.
 for(const f of ['K','S','v',...(en?['RpT','Rp20','Rm','Do','eord']:sphere?['R','sn','ss']:tee?['Da','sA','sS']:['Da','sn','ss']),'dA'].filter(f=>!en||!['K','S'].includes(f)))for(const bad of [0,-1,NaN,Infinity])check(m.id+' rejects '+f+' '+bad,()=>assert(m.calc({...base(m),[f]:bad},AD.h).fail));
 for(const patch of [{p:-1},{p:NaN},{p:1e308},{c1:-1},{c2:Infinity},{c1:1000},en?{RpT:1e308,Rp20:1e308,Rm:1e308}:{K:1e308},en?{RpT:1e-320,Rp20:1e-320,Rm:1e-320}:{K:1e-320,S:1e10}])check(m.id+' closed numerical/invalid '+JSON.stringify(patch),()=>assert(m.calc({...base(m),...patch},AD.h).fail));
 for(const patch of [{dA:NaN},{ls:NaN},{sn:-1,ss:-1,sA:-1,sS:-1,eord:-1},{Da:1e308,Do:1e308,R:1e308,sn:1e307,sA:1e307,eord:1e307,dA:1e307,ss:1e306,sS:1e306}])check(m.id+' drawing invalid robustness',()=>assert(!/NaN|Infinity|undefined/.test(m.draw({...base(m),...patch},AD.h,null))));
 check(m.id+' no input drawing',()=>assert(!/NaN|Infinity|undefined/.test(m.draw(null,AD.h,null))));
}
// Regression counterexample: nozzle pipe governs while its credited area is zero.
for(const id of ['b9','tee_ad','b9k'])check(id+' weak uncredited nozzle governs headline',()=>{
 const m=modules.find(m=>m.id===id),g={...base(m),Da:1000,R:500,sn:50,sA:50,dA:100,ss:2,sS:2,ls:0,lb:0,Ks:1};
 const r=m.calc(g,AD.h),at=m.calc({...g,p:r.pmax},AD.h),over=m.calc({...g,p:r.pmax*1.001},AD.h);
 near(r.pmax,20*(1/1.5)*2/98);near(at.util,1);assert(!at.fail);assert(over.fail&&over.util>1);
});
check('b9k does not hide 5e-10 positive overload',()=>{
 const m=modules.find(m=>m.id==='b9k'),g={...base(m),R:495,sn:10,dA:150,ss:10,ls:20};
 const eta=1+5e-10,p=eta*120000/(8857.5+60*eta),r=m.calc({...g,p},AD.h);assert(r.fail&&r.util>1);
});
for(const K20 of [NaN,0,-1,Infinity])check('AD large tee requires K20 '+K20,()=>{
 const m=modules.find(m=>m.id==='tee_ad');const r=m.calc({...base(m),p:1,dA:219.1,sS:10,K20},AD.h);assert(r.fail&&Number.isNaN(r.pmax));
});
check('AD nonfinite proof utilization fails closed',()=>{
 const m=modules.find(m=>m.id==='tee_ad'),r=m.calc({...base(m),ST:1e100},AD.h);assert(r.fail&&r.test&&!r.test.ok);
});
// Exact and adjacent applicability boundaries (pressure deliberately negligible).
for(const m of modules){
 const tee=m.id.startsWith('tee'),en=m.id==='tee_en',sphere=m.id==='b9k';
 for(const ratio of [.8-1e-8,.8,.8+1e-8])check(m.id+' diameter boundary '+ratio,()=>{
  const g={...base(m),p:.0001,Da:1000,Do:1000,R:500,sn:10,sA:10,eord:10,dA:ratio*(sphere?1000:980)+20,ss:10,sS:10,tol:0,c1:0,c2:0,kind:tee?'extruded':undefined};
  if(!tee)delete g.kind;
  const r=m.calc(g,AD.h);assert.equal(r.fail,ratio>.8);
 });
 const limit=en?1:2;
 for(const d of [-1e-8,0,1e-8])check(m.id+' wall ratio boundary '+d,()=>{
  const g={...base(m),p:.0001,Da:1000,Do:1000,R:500,sn:10,sA:10,eord:10,dA:300,ss:10*(limit+d),sS:10*(limit+d),c1:0,c2:0,tol:0};
  assert.equal(m.calc(g,AD.h).fail,d>0);
 });
 if(!en)for(const s of [2-1e-8,2,2+1e-8])check(m.id+' minimum wall '+s,()=>{
  const g={...base(m),p:.0001,Da:500,R:250,sn:s,sA:s,dA:50,ss:2,sS:2,c1:0,c2:0};assert.equal(m.calc(g,AD.h).fail,s<2);
 });
 if(tee){
  for(const r of [1-1e-8,1,1+1e-8])check(m.id+' full diameter '+r,()=>{
   const g={...base(m),p:.0001,dA:r*(219.1-20)+20,sS:10,c1:0,c2:0,tol:0,kind:'forged'};assert.equal(m.calc(g,AD.h).fail,r>1);
  });
  for(const angle of ['45','bogus'])check(m.id+' angle '+angle,()=>assert(m.calc({...base(m),angle},AD.h).fail));
  check(m.id+' unconfirmed scope',()=>assert(m.calc({...base(m),scope:'no'},AD.h).fail));
 }
}
// Lower relative-wall exception: small holes remain valid below 0.002.
for(const id of ['b9','tee_ad']){
 const m=modules.find(m=>m.id===id);
 for(const rel of [.002-1e-10,.002,.002+1e-10])check(id+' relative-wall lower '+rel,()=>{
  const wall=2000*rel,g={...base(m),p:.00001,Da:2000,sn:wall,sA:wall,dA:710,ss:3,sS:3,c1:0,c2:0};
  assert.equal(m.calc(g,AD.h).fail,rel<.002);
 });
 for(const hole of [2000/3-1e-6,2000/3,2000/3+1e-6])check(id+' small hole exception '+hole,()=>{
  const g={...base(m),p:.00001,Da:2000,sn:3,sA:3,dA:hole+6,ss:3,sS:3,c1:0,c2:0};
  assert.equal(m.calc(g,AD.h).fail,hole>2000/3);
 });
}
for(const m of modules){
 const sphere=m.id==='b9k',en=m.id==='tee_en',limit=en?1.7:1.2;
 for(const ratio of [limit-1e-8,limit,limit+1e-8])check(m.id+' thin-wall scope '+ratio,()=>{
  const s=sphere?500*(ratio-1):(1000-1000/ratio)/2;
  const g={...base(m),p:.000001,Da:1000,Do:1000,R:500,sn:s,sA:s,eord:s,dA:150,ss:10,sS:10,tol:0,c1:0,c2:0};
  assert.equal(m.calc(g,AD.h).fail,ratio>limit);
 });
 for(const delta of [-1e-8,0,1e-8])check(m.id+' net wall exhausted '+delta,()=>{
  const g={...base(m),p:0,Da:1000,Do:1000,c1:8+delta,c2:0,ss:8,sS:8};
  if(en){g.eord=8;g.tol=0;}else if(sphere)g.sn=8;else if(m.id==='b9')g.sn=8;else g.sA=8;
  assert.equal(m.calc(g,AD.h).fail,delta>=0);
 });
}
for(const shape of ['kl','kor'])for(const x of [125-1e-8,125,125+1e-8])check('b9k crown boundary '+shape+' '+x,()=>{
 const m=modules.find(m=>m.id==='b9k'),g={...base(m),p:.0001,shape,R:495,Da:1000,sn:10,dA:150,ss:10,ls:20,x};
 // b=100, 3se=30; x + dA/2 + b <= 300.
 assert.equal(m.calc(g,AD.h).fail,x>125);
});
const en=modules.find(m=>m.id==='tee_en');
for(const tol of [100-1e-8,100,100+1e-8])check('EN tolerance limit '+tol,()=>{
 const r=en.calc({...base(en),p:0,tol,c1:0,c2:0},AD.h);assert.equal(r.fail,tol>=100);
});
// Adjacent IEEE-754 values catch rounding discrepancies hidden by ordinary fuzzing.
const bits=new DataView(new ArrayBuffer(8));
function adjacent(x,dir){bits.setFloat64(0,x);bits.setBigUint64(0,bits.getBigUint64(0)+BigInt(dir));return bits.getFloat64(0);}
for(const m of modules)for(let i=0;i<300;i++)check(m.id+' adjacent pressure '+i,()=>{
 const g={...base(m),ls:i*.13,lb:i*.13},limit=m.calc(g,AD.h).pmax;
 for(const dir of [-1,0,1]){
  const r=m.calc({...g,p:dir?adjacent(limit,dir):limit},AD.h);
  assert.equal(r.fail,dir>0);assert.equal(r.util>1,dir>0);
  if(dir===0)near(r.util,1);
 }
});
check('B9 minimum wall invalidates allowable pressure',()=>{
 const m=modules.find(m=>m.id==='b9'),r=m.calc({...base(m),p:.01,Da:200,sn:1,dA:20,ss:1,ls:10},AD.h);
 assert(r.fail&&Number.isNaN(r.pmax));
});
console.log(`PASS ${passed}/${total}`);
