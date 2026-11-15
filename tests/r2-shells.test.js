'use strict';
/* R2 primary-text audit, editions B1/B10 10/2000, B3 05/2011, B5 11/2014:
 * (Normtext, nicht verlinkt)
 * B1 pp.191–192; B3 pp.206–217; B5 §1, §5, §6.1.1; B10 pp.324–325.
 * (Normtext, nicht verlinkt)
 * B0 §4.1/4.4, Tables 2/3; PED Annex I 7.4 (p=PS; no hydrostatic head).
 * Oracle worksheets below implement the printed equations independently of calc/H.PT.
 * Headline and row s explicitly describe operation; util and s_ma govern all states.
 */
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../modules/b1.js');require('../modules/b10.js');require('../modules/b1-tips.js');
const ids=['cyl','sph','b3','b5','b10'];
const mod=id=>AD.modules.find(m=>m.id===id);
const base=(id,patch={})=>({p:10,T:100,K:180,K20:235,S:1.5,ST:1.05,E:200000,v:1,c1:.5,c2:1,
 ...Object.fromEntries(mod(id).fields.map(f=>[f.id,f.def])),...(id==='b3'?{beta:3}:id==='b5'?{C:.4}:{}),...patch});
let passed=0,total=0;
function test(name,f){total++;try{f();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
const near=(a,b)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const row=(r,s)=>r.rows.find(x=>x[1]===s)?.[2];
// Five worksheets per module, covering ambient/warm, allowances, weld efficiency,
// and alternate geometry. Every expected state is derived from the source equations.
const worksheets=[
 {Da:500,D:400,sn:20,p:10,K:180,K20:235,c1:.5,c2:1,beta:3,C:.4},
 {Da:1000,D:600,sn:40,p:20,K:150,K20:235,c1:1,c2:2,beta:3.2,C:.45},
 {Da:250,D:200,sn:15,p:15,K:235,K20:235,c1:0,c2:0,beta:4,C:.5},
 {Da:800,D:500,sn:35,p:30,K:120,K20:235,c1:.3,c2:1,beta:2.8,C:.4},
 {Da:1200,D:1000,sn:60,p:5,K:100,K20:180,c1:1,c2:3,beta:2.5,C:.55}
];
function oracle(id,g){
 const q=Math.max(1.25*g.K20/g.K,1.43),PT=q*g.p;
 const c1=id==='b5'&&g.sn>25?0:g.c1,c=c1+g.c2,t=g.sn-c,tp=g.sn-c1;
 const R=(g.htype==='kb'?.8:1)*g.Da,dk=2*(R+g.sn);
 let sb,sp,pm,sd=0,sdp=0;
 if(id==='cyl'||id==='sph'){
  const factor=id==='cyl'?20:40;
  sb=Math.max(2,g.Da*g.p/(factor*g.K/g.S*g.v+g.p)+c);
  sp=Math.max(2,g.Da*PT/(factor*g.K20/g.ST*g.v+PT)+c1);
  pm=Math.min(factor*g.K/g.S*g.v*t/(g.Da-t),factor*g.K20/g.ST*g.v*tp/(g.Da-tp)/q);
 }else if(id==='b3'){
  sb=Math.max(2,Math.max(g.Da*g.p*g.beta/(40*g.K/g.S*g.v),dk*g.p/(40*g.K/g.S*g.v+g.p))+c);
  sp=Math.max(2,Math.max(g.Da*PT*g.beta/(40*g.K20/g.ST*g.v),dk*PT/(40*g.K20/g.ST*g.v+PT))+c);
  pm=Math.min(40*g.K/g.S*g.v*t/(g.Da*g.beta),40*g.K/g.S*g.v*t/(dk-t),40*g.K20/g.ST*g.v*t/(g.Da*g.beta)/q,40*g.K20/g.ST*g.v*t/(dk-t)/q);
 }else if(id==='b5'){
  sb=g.C*g.D*Math.sqrt(g.p*g.S/(10*g.K))+c;
  sp=g.C*g.D*Math.sqrt(PT*g.ST/(10*g.K20))+c1;
  sd=g.D*Math.pow(.0087*g.p/g.E,.25)+c;sdp=g.D*Math.pow(.0087*PT/g.E,.25)+c1;
  pm=Math.min(10*g.K/g.S*(t/(g.C*g.D))**2,g.E/.0087*(t/g.D)**4,10*g.K20/g.ST*(tp/(g.C*g.D))**2/q,g.E/.0087*(tp/g.D)**4/q);
 }else{
  sb=g.Da*g.p/(23*g.K/g.S-g.p)+c;
  sp=g.Da*PT/(23*g.K20/g.ST-PT)+c; // conservative c2 retained, explicitly UNVERIFIED
  pm=Math.min(23*g.K/g.S*t/(g.Da+t),23*g.K20/g.ST*t/(g.Da+t)/q);
 }
 return {sb,sp,PT,pm,need:Math.max(sb,sp,sd,sdp),sd,sdp};
}
for(const id of ids)for(let i=0;i<5;i++)test(`${id} independent worksheet ${i+1}`,()=>{
 const g=base(id,{...worksheets[i],...(id==='b10'?{sn:worksheets[i].Da*.13}:{}),...(id==='b3'&&i%2?{htype:'kb'}:{})});
 const r=mod(id).calc(g),o=oracle(id,g);
 near(r.headline.value,o.sb);near(r.util,o.need/g.sn);near(row(r,'s_B'),o.sb);near(row(r,'s_P'),o.sp);near(row(r,'s_ma'),o.need);
 near(r.pmax,o.pm);near(r.test.PT,o.PT);near(r.test.req,o.sp);assert.equal(r.test.ok,o.sp<=g.sn&&(id!=='b5'||o.sdp<=g.sn));
 assert.equal(r.fail,o.need>g.sn);assert(r.formula.includes(AD.h.fmt(o.need,3)));assert(r.headline.label.includes('Betrieb'));
});
let seed=0x5134b10;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const id of ids)for(let i=0;i<350;i++)test(`${id} seeded property ${i+1}`,()=>{
 const Da=300+rnd()*2700;
 const g=base(id,{Da,D:Da,sn:Da*(id==='b10'?.105+rnd()*.045:id==='b5'?.04+rnd()*.12:.015+rnd()*.04),K:80+rnd()*180,K20:100+rnd()*260,p:.1+rnd()*50,
  c1:rnd()*.2,c2:rnd()*.5,beta:2.5+rnd()*3,C:.4+rnd()*.2,v:id==='b10'?1:.7+rnd()*.3,htype:rnd()<.5?'kl':'kb'});
 const m=mod(id),r=m.calc(g),o=oracle(id,g);near(r.pmax,o.pm);near(r.headline.value,o.sb);near(r.util,o.need/g.sn);
 assert.equal(r.fail,r.util>1);assert.equal(r.test.ok,o.sp<=g.sn&&(id!=='b5'||o.sdp<=g.sn));
 const at=m.calc({...g,p:r.pmax});near(at.util,1);assert(!at.fail,'capacity equality must pass');assert(at.test.ok);
 assert(m.calc({...g,p:r.pmax*(1+1e-7)}).fail,'above capacity must fail');
 assert(m.calc({...g,p:g.p*1.01}).headline.value>=r.headline.value,'pressure monotonic');
 assert(m.calc({...g,Da:Da*1.001,D:Da*1.001}).headline.value>=r.headline.value,'diameter monotonic');
 assert(m.calc({...g,sn:g.sn*1.001}).pmax>=r.pmax,'wall monotonic');
 assert(m.calc({...g,K:g.K*1.01}).pmax>=r.pmax,'strength monotonic (proof cap can govern)');
 if(!r.fail){for(const n of [r.headline.value,r.util,r.pmax,r.test.PT,r.test.req,...r.rows.map(x=>x[2])])assert(Number.isFinite(n));}
 near(row(r,'s'),r.headline.value);near(row(r,'s_ma'),r.util*g.sn);assert(r.formula.includes(AD.h.fmt(o.need,3)));
 for(const candidate of [g,{...g,Da:NaN,D:NaN}, {...g,sn:1e308}, {...g,Da:1e-300,D:1e-300,sn:1e-302}]){
  const svg=m.draw(candidate,AD.h,null);assert(!/NaN|Infinity|undefined/.test(svg),'finite drawing');
  const geometry=new Set(id==='b10'?['Da','sn','shape']:id==='b3'?['Da','sn','htype']:id==='b5'?['D','sn']:['Da','sn']);
  for(const tag of svg.matchAll(/data-p="([^"]+)"/g))for(const field of tag[1].split(' '))assert(geometry.has(field),'geometric tag '+field);
 }
});
for(const id of ids){
 const m=mod(id),valid=base(id,id==='b10'?{Da:900,sn:120}:{sn:id==='b5'?40:20});
 for(const k of ['Da','sn','K','K20','S','ST','v','c1','c2','p','T',...(id==='b5'?['D','C','E']:[]),...(id==='b3'?['beta']:[])]){
  if(k==='Da'&&id==='b5'||k==='v'&&id==='b5')continue;
  for(const bad of [NaN,Infinity,-Infinity,...(k==='T'?[-274]:[-1]),1e308])test(`${id} invalid ${k} ${bad}`,()=>assert(m.calc({...valid,[k]:bad}).fail));
 }
 for(const k of ['sn','K','K20','S','ST',...(id==='b5'?['D','C','E']:['Da','v']),...(id==='b3'?['beta']:[])])test(`${id} zero ${k}`,()=>assert(m.calc({...valid,[k]:0}).fail));
 test(id+' exhausted wall',()=>assert(m.calc({...valid,c2:valid.sn}).fail));
 test(id+' no load is valid',()=>assert(!m.calc({...valid,p:0}).fail));
 test(id+' unsafe safety factors',()=>{assert(m.calc({...valid,S:1.49}).fail);assert(m.calc({...valid,ST:1.049}).fail);});
}
for(const id of ['cyl','sph'])for(const f of [1-1e-8,1,1+1e-8])test(`${id} B1 ratio boundary ${f}`,()=>{
 const g=base(id,{Da:1200,sn:100*f,p:1,c1:0,c2:0});assert.equal(mod(id).calc(g).fail,f>1);
});
for(const htype of ['kl','kb'])for(const limit of [.001,.1])for(const f of [1-1e-8,1,1+1e-8])test(`B3 ${htype} ratio ${limit} x ${f}`,()=>{
 const r=mod('b3').calc(base('b3',{Da:10000,sn:10000*limit*f,p:.01,c1:0,c2:0,htype}));assert.equal(r.fail,limit===.001?f<1:f>1);
});
for(const ratio of [1.2,1.5])for(const delta of [-1e-8,0,1e-8])test(`B10 ratio ${ratio} ${delta}`,()=>{
 const r=mod('b10').calc(base('b10',{Da:900,sn:(900-900/(ratio+delta))/2,p:1,c1:0,c2:0}));assert.equal(r.fail,ratio+delta<=1.2||ratio+delta>1.5);
});
for(const f of [1-1e-8,1,1+1e-8])test('B5 upper limit '+f,()=>{
 const r=mod('b5').calc(base('b5',{D:300,sn:100*f,p:.01,c1:0,c2:0}));assert.equal(r.fail,f>1);
});
for(const sn of [25-1e-8,25,25+1e-8])test('B5 tolerance boundary '+sn,()=>{
 const g=base('b5',{D:300,sn,c1:1,c2:0,p:1});near(row(mod('b5').calc(g),'c1+c2'),sn>25?0:1);
});
for(const id of ['cyl','sph','b3','b5'])test(id+' proof-only failure cannot pass',()=>{
 // Realistic ambient steel: the PED factor 1.43 is slightly greater than S/S′.
 const p={cyl:69.35,sph:138.7,b3:45.31,b5:59.74}[id];
 const g=base(id,{Da:1000,D:400,p,sn:id==='b5'?30:20,K:255,K20:255,ST:1.05,T:20,beta:3,c1:0,c2:0});
 const r=mod(id).calc(g);assert(r.headline.value<g.sn);assert(!r.test.ok);assert(r.fail);assert(r.util>1);assert(r.pmax<g.p);
});
test('B3 chart factor is mandatory, not an unsafe preset',()=>{assert.equal(mod('b3').fields.find(f=>f.id==='beta').def,'');assert(mod('b3').calc(base('b3',{beta:NaN})).fail);assert(mod('b3').calc(base('b3',{beta:.99})).fail);});

for(let i=0;i<30;i++)for(const id of ids)test(`${id} randomized exact scope boundaries ${i}`,()=>{
 const Da=2500+rnd()*20000;
 const run=sn=>mod(id).calc(base(id,{Da,D:Da,sn,p:.00001,c1:0,c2:0}));
 if(id==='cyl'||id==='sph'){
  const t=Da/12;assert(!run(t).fail);assert(!run(t*(1-1e-8)).fail);assert(run(t*(1+1e-8)).fail);
 }else if(id==='b3'){
  for(const limit of [.001,.1]){const t=Da*limit;assert(!run(t).fail);assert(!run(t*(limit===.001?1+1e-8:1-1e-8)).fail);assert(run(t*(limit===.001?1-1e-8:1+1e-8)).fail);}
 }else if(id==='b5'){
  const t=Da/3;assert(!run(t).fail);assert(!run(t*(1-1e-8)).fail);assert(run(t*(1+1e-8)).fail);
 }else{
  const lo=Da/12,hi=Da/6;assert(run(lo).fail);assert(!run(lo*(1+1e-8)).fail);assert(!run(hi).fail);assert(run(hi*(1+1e-8)).fail);
 }
});
for(const id of ['cyl','sph','b3'])for(const sn of [2-1e-8,2,2+1e-8])test(id+' steel minimum '+sn,()=>{assert.equal(mod(id).calc(base(id,{Da:1000,sn,p:.00001,c1:0,c2:0})).fail,sn<2);});
test('B5 support factor requires an explicit table selection',()=>{assert.equal(mod('b5').fields.find(f=>f.id==='C').def,'');assert(mod('b5').calc(base('b5',{C:NaN})).fail);});
for(const id of ids)test(id+' null drawing remains safe',()=>{assert(!/NaN|Infinity|undefined/.test(mod(id).draw(null,AD.h,null)));});
console.log(`PASS ${passed}/${total}`);
