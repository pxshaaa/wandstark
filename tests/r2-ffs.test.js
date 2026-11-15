'use strict';
// Round 2: independent arithmetic and deterministic property tests.
// Sources inspected 2026-11-14:
// API 579-1 (2016), Tables 4.3/4.4/5.2, §§4.4.2, 5.4.2 and 2017 Errata Eq.5.13:
// (Normtext, nicht verlinkt)
// (Normtext, nicht verlinkt)
// ASME B31G-2012 §§1.2,1.7,1.9,2.2:
// (Normtext, nicht verlinkt)
// PED Annex II, all nine original diagrams visually checked, pp.69–73:
// https://www.ibf-solutions.com/fileadmin/dateidownloads/amtsblaetter/directive-2014-68-ec-relating-to-the-making-available-on-the-market-of-pressure-equipment-en.pdf
// Applicability: PED has no pmax/utilization/thickness/test-pressure calculation;
// FFS5/B31G report pressure capacity, not a required thickness. All FFS modules
// return test:null: none performs a pressure-test verification. Direct-thickness
// FFS4 has pmax:NaN by contract (no inverse pressure basis).
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../modules/ffs.js');require('../modules/ffs-tips.js');require('../modules/ped.js');
const H=AD.h, ids=['ffs4','ffs5','b31g','ped'];
const mod=id=>AD.modules.find(m=>m.id===id);
const base=id=>({p:1,T:20,K:150,K20:235,S:1.5,v:1,c1:0,c2:0,...Object.fromEntries(mod(id).fields.filter(f=>'def' in f).map(f=>[f.id,f.def]))});
const calc=(id,g={})=>mod(id).calc({...base(id),...g},H);
const row=(r,s)=>{const x=r.rows.find(x=>x[1]===s);assert(x,'row '+s);return x[2];};
const near=(x,y,e=1e-10)=>assert(Number.isFinite(x)&&Math.abs(x-y)<=e*Math.max(1,Math.abs(y)),`${x} != ${y}`);
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);}}
let seed=0x579b31;
function rand(a=0,b=1){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+(b-a)*seed/4294967296;}
function svgOK(id,g,r){const svg=mod(id).draw(g,H,r);assert(svg.startsWith('<svg'));assert(!/NaN|Infinity|undefined/.test(svg));const fields=new Set(mod(id).fields.map(f=>f.id));for(const m of svg.matchAll(/data-p="([^"]+)"/g))for(const id of m[1].split(/\s+/))assert(fields.has(id),'unknown drawing tag '+id);return svg;}
function finitePass(r){if(r.fail)return;assert(Number.isFinite(r.util));assert.equal(r.test,null);for(const x of r.rows)if(typeof x[2]==='number')assert(Number.isFinite(x[2]),'nonfinite row '+x[1]);assert(!/NaN|Infinity/.test(r.formula));assert(!r.notes.some(x=>x[0]==='e'));}
function inverse(id,g,r){assert(!r.fail);assert(r.pmax>0);const at=calc(id,{...g,p:r.pmax}),over=calc(id,{...g,p:r.pmax*(1+1e-7)});near(at.util,1,1e-6);assert(!at.fail,'exact pmax must pass');assert(over.fail&&over.util>1,'above pmax must fail');near(at.pmax,r.pmax);near(over.pmax,r.pmax);assert.equal(at.test,null);assert.equal(over.test,null);}
// Five independently substituted pressure/thickness cases (B1 + API4 gates).
for(const [i,a] of [
 [1000,10,8,7,.5,150,1.5,10,'inner'],
 [600,8,7,6.5,.3,200,1.5,20,'outer'],
 [2000,25,21,20,1,180,1.5,15,'inner'],
 [508,10,9.2,9,.2,235,1.5,25,'outer'],
 [1200,16,14,13.5,.7,160,1.5,12,'inner']
].entries())test('API4 hand oracle '+i,()=>{
 const [Da,t_nom,t_am,t_mm,FCA,K,S,p,side]=a,g={Da,t_nom,t_am,t_mm,FCA,K,S,p,side,COV:.05};
 const d=side==='outer'?Da-2*(t_nom-t_am+FCA):Da;
 const req=d*p/(20*K/S+p),avg=t_am-FCA,mn=t_mm-FCA,lim=Math.max(.2*t_nom,2.5),pm=20*K/S*Math.min(avg,2*mn)/(d-Math.min(avg,2*mn));
 const r=calc('ffs4',g);near(r.headline.value,req);near(r.util,Math.max(req/avg,Math.max(.5*req,lim)/mn));near(r.pmax,pm);near(row(r,'t_min'),req);assert.equal(r.fail,p>pm);assert(r.formula.includes(H.fmt(req)));finitePass(r);
});
// Five exact independent Table 5.2 values, avoiding the module interpolator.
for(const [lambda,M] of [[.5,1.056],[1,1.199],[2,1.618],[4,2.600],[10,5.497]])test('API5 hand oracle lambda '+lambda,()=>{
 const tc=9.5,tm=4.75,D=1000,s=lambda*Math.sqrt(9500)/1.285,Rt=.5,rsf=Rt/(1-(1-Rt)/M);
 const pc=2000*tc/(1000+tc),pl=4000*tc/(500-.4*tc),pm=Math.min(pc,pl)*Math.min(1,rsf/.9);
 const g={side:'outer',t_mm:5.25,s,c:20,L_msd:500,p:1},r=calc('ffs5',g);
 near(row(r,'λ'),lambda);near(row(r,'Mt'),M);near(row(r,'RSF'),rsf);near(r.pmax,pm);near(r.util,1/pm);near(r.headline.value,pm);assert(!r.fail);assert(r.headline.text.includes(H.fmt(pm)));assert(r.formula.includes(H.fmt(pm)));finitePass(r);
});
// Five independent B31G geometry cases for EACH method, covering both branches.
for(const method of ['original','modified'])for(const [z,q] of [[4,0],[20,.2],[21,.4],[50,.6],[51,.8]])test('B31G hand oracle '+method+' z='+z,()=>{
 const D=40*z,t=10,L=20*z,M=method==='original'?Math.sqrt(1+.8*z):z<=50?Math.sqrt(1+.6275*z-.003375*z*z):.032*z+3.3;
 const flow=method==='original'?258.5:304,A=method==='original'?2*q/3:.85*q;
 const stress=method==='original'&&z>20?flow*(1-q):flow*(1-A)/(1-A/M),pm=20*stress*t/D*.72;
 const r=calc('b31g',{method,D,t_nom:t,d:q*t,L});near(r.pmax,pm);near(r.headline.value,pm);near(row(r,'Ps'),pm);near(r.util,1/pm);assert(!r.fail);assert(r.formula.includes(H.fmt(pm)));finitePass(r);
});
// Independent envelopes read directly from the PED diagrams: maximum PS in each
// region as a function of V/DN. This is separate from the module's product tests.
function pedOracle(t,p,x,T=20){
 if(p<=.5)return 'Außerhalb PED';
 const envelopes={
 1:[x<=1?200:Math.min(200,25/x),Math.min(200,50/x),Math.min(200,200/x),x<=1?1000:Math.min(1000,1000/x),Infinity],
 2:[x<=1?1000:Math.min(1000,50/x),Math.min(1000,200/x),Math.min(1000,1000/x),x<=1?3000:Math.min(3000,Math.max(4,3000/x)),Infinity],
 3:[x<=1?500:Math.min(500,200/x),10,x<=1?Infinity:500,Infinity],
 4:[Math.min(1000,Math.max(10,10000/x)),x<=10?Infinity:500,Infinity],
 5:[x<=2?Infinity:0,x<=1000?Math.min(32,50/x):0,x<=1000?Math.min(32,200/x):0,x<=1000?Math.min(32,3000/x):0,Infinity],
 6:[x<=25?Infinity:0,x<=100?1000/x:0,x<=350?(x<=100?Infinity:3500/x):0,Infinity],
 7:[x<=32?Infinity:1000/x,x<=100?Infinity:3500/x,x<=250?Infinity:5000/x,Infinity],
 8:[x<=25?Infinity:2000/x,10,500,Infinity],
 9:[x<=200?Infinity:Math.max(10,5000/x),500,Infinity]
 };
 let c=envelopes[t].findIndex(limit=>p<=limit);if(t===7&&c===2&&(!Number.isFinite(T)||T>350))c=3;
 return c?'Kat. '+['','I','II','III','IV'][c]:'Art. 4 Abs. 3';
}
function pedInput(t,p,x,T=20){return {equipment:t===5?'steam':t>=6?'piping':'vessel',state:[3,4,8,9].includes(t)?'liquid':'gas',fluid:[2,4,7,9].includes(t)?'2':'1',p,V:x,DN:x,T};}
const pedCases={
 1:[[10,2,0],[10,4,1],[10,10,2],[10,50,3],[10,200,4]],
 2:[[10,4,0],[10,10,1],[10,50,2],[10,200,3],[10,400,4]],
 3:[[5,20,0],[5,100,1],[20,20,2],[600,1,2],[600,2,3]],
 4:[[10,2000,0],[20,500,0],[20,600,1],[1100,10,1],[600,20,2]],
 5:[[50,2,0],[5,5,1],[10,10,2],[10,100,3],[40,3,4]],
 6:[[100,25,0],[10,50,1],[20,100,2],[10,300,2],[20,300,3]],
 7:[[10,50,0],[20,100,1],[20,200,2],[20,300,3],[1000,250,2]],
 8:[[1000,25,0],[5,500,1],[20,200,2],[600,30,3],[10,200,0]],
 9:[[10,1000,0],[1000,200,0],[20,250,0],[20,300,1],[600,300,2]]
};
for(const t of Object.keys(pedCases).map(Number))for(const [p,x,c] of pedCases[t])test('PED hand oracle '+t+' '+p+'/'+x,()=>{const r=calc('ped',pedInput(t,p,x));assert.equal(r.headline.text,c?'Kat. '+['','I','II','III','IV'][c]:'Art. 4 Abs. 3');assert.equal(r.test,null);assert(r.noUtil);finitePass(r);});
// At least 300 valid generated cases PER module, and paired perturbations.
for(let i=0;i<320;i++){
 test('API4 fuzz '+i,()=>{
  const t=rand(8,25),Da=rand(35,100)*t,t_am=rand(.85,.97)*t,t_mm=rand(.9,.99)*t_am,FCA=rand(.01,.08)*t;
  const g={...base('ffs4'),Da,t_nom:t,t_am,t_mm,FCA,K:rand(120,300),S:rand(1.2,2),v:rand(.7,1),p:1,COV:.1,side:i%2?'outer':'inner',readings:i%3?'ptr':'profile',...(i%4===0?{geom:'bend',Rb:rand(1.1,4)*Da,bpos:['intr','extr','flank'][i%3]}:{})};
  // Generate a realizable sample summary, including its variance bounds.
  const covMax=(1-t_mm/t_am)*Math.sqrt(15);g.COV=(covMax/14+Math.min(.1,covMax))/2;
  const r=calc('ffs4',g);inverse('ffs4',g,r);finitePass(r);assert.equal(r.fail,r.util>1);near(row(r,'t_min'),r.headline.value);svgOK('ffs4',g,r);
  assert(calc('ffs4',{...g,p:2}).headline.value>r.headline.value);assert(calc('ffs4',{...g,Da:Da*1.001}).headline.value>r.headline.value);
  assert(calc('ffs4',{...g,t_am:t_am+.001,t_mm:t_mm+.001}).pmax>r.pmax);assert(calc('ffs4',{...g,K:g.K*1.01}).pmax>r.pmax);
 });
 test('API5 fuzz '+i,()=>{
  const t=rand(8,25),D=rand(30,100)*t,LOSS=rand(0,.08)*t,FCA=rand(.01,.05)*t,tc=t-LOSS-FCA,s=rand(.5,8)*Math.sqrt(D*tc)/1.285;
  const g={...base('ffs5'),D,t_nom:t,LOSS,FCA,t_mm:rand(.5,.95)*(t-LOSS),s,c:s*.4,L_msd:4*Math.sqrt((D+2*(LOSS+FCA))*tc),K:rand(120,300),v:rand(.8,1),Ec:rand(.7,1),side:i%2?'outer':'inner',p:1};
  const r=calc('ffs5',g);inverse('ffs5',g,r);finitePass(r);near(r.util,g.p/r.pmax);near(r.headline.value,r.pmax);near(row(r,'MAWPr'),r.pmax);svgOK('ffs5',g,r);
  assert(calc('ffs5',{...g,K:g.K*1.01}).pmax>r.pmax);assert(calc('ffs5',{...g,t_nom:t+.01,t_mm:g.t_mm+.01}).pmax>r.pmax);assert(calc('ffs5',{...g,D:D*1.001}).pmax<r.pmax);
 });
 test('B31G fuzz '+i,()=>{
  const t=rand(5,25),D=rand(20,100)*t,g={...base('b31g'),D,t_nom:t,d:rand(.01,.79)*t,L:Math.sqrt(rand(.01,100)*D*t),K20:rand(150,400),SMTS:600,F:rand(.4,.8),method:i%2?'original':'modified',side:i%3?'outer':'inner',p:1,...(i%4===0?{geom:'bend',Rb:rand(1.1,4)*D,bpos:['intr','extr','flank'][i%3]}:{})};
  const r=calc('b31g',g);inverse('b31g',g,r);finitePass(r);near(r.util,g.p/r.pmax);near(r.headline.value,r.pmax);near(row(r,'Ps'),r.pmax);svgOK('b31g',g,r);
  assert(calc('b31g',{...g,K20:g.K20*1.01}).pmax>r.pmax);assert(calc('b31g',{...g,t_nom:t+.01}).pmax>r.pmax);// Original B31G jumps at z=20; a larger D can cross that prescribed
  // branch. Diameter monotonicity is asserted only within the same branch.
  if(g.method!=='original'||(g.L*g.L/(g.D*g.t_nom)>20)===(g.L*g.L/(g.D*1.001*g.t_nom)>20))assert(calc('b31g',{...g,D:D*1.001}).pmax<r.pmax);
  near(calc('b31g',{...g,side:g.side==='outer'?'inner':'outer'}).pmax,r.pmax);
 });
 test('PED fuzz '+i,()=>{
  const t=1+i%9,p=10**rand(-.5,4),x=10**rand(-1,4),T=i%2?20:351,g=pedInput(t,p,x,T),r=calc('ped',g);
  assert.equal(r.headline.text,pedOracle(t,p,x,T));assert(!r.fail);assert.equal(r.util,0);assert(r.noUtil&&Number.isNaN(r.pmax));near(r.rows[2][2],p*x);assert(r.formula.includes(r.headline.text));finitePass(r);svgOK('ped',g,r);
 });
}
// Boundary probes: every PED candidate limit, on both sides as well as exactly.
const pedLimits={1:[[1],[.5,200,1000],[25,50,200,1000]],2:[[1],[.5,4,1000,3000],[50,200,1000,3000]],3:[[1],[.5,10,500],[200]],4:[[10],[.5,10,500,1000],[10000]],5:[[2,1000],[.5,32],[50,200,3000]],6:[[25,100,350],[.5],[1000,3500]],7:[[32,100,250],[.5],[1000,3500,5000]],8:[[25],[.5,10,500],[2000]],9:[[200],[.5,10,500],[5000]]};
for(const [key,[xs,ps,qs]] of Object.entries(pedLimits)){
 const t=+key;
 for(const p of ps)for(const x of [.5,2,50,400,2000])for(const f of [1-1e-8,1,1+1e-8])test(`PED P boundary ${t}/${p}/${x}/${f}`,()=>assert.equal(calc('ped',pedInput(t,p*f,x)).headline.text,pedOracle(t,p*f,x)));
 for(const x of xs)for(const p of [1,10,100,600,4000])for(const f of [1-1e-8,1,1+1e-8])test(`PED x boundary ${t}/${p}/${x}/${f}`,()=>assert.equal(calc('ped',pedInput(t,p,x*f)).headline.text,pedOracle(t,p,x*f)));
 // x=2 makes every exact product boundary binary-exact, including q/2.
 for(const q of qs)for(const x of [2,64,512])for(const f of [1-1e-8,1,1+1e-8])test(`PED product boundary ${t}/${q}/${x}/${f}`,()=>assert.equal(calc('ped',pedInput(t,q/x*f,x)).headline.text,pedOracle(t,q/x*f,x)));
}
for(const [name,g,ok] of [
 ['COV exactly .1',{COV:.1},true],['COV outside',{COV:.10000001},false],['N exactly 15',{N:15},true],['N below 15',{N:14},false],['N fractional',{N:15.1},false],
 ['thin exact',{Da:120,t_nom:10,t_am:9,t_mm:8.8,FCA:0,p:.1,COV:.05},true],['thin outside',{Da:119.99999,t_nom:10,t_am:9,t_mm:8.8,FCA:0,p:.1,COV:.05},false],
 ['minimum floor exact',{basis:'direct',t_min:2,t_am:5,t_mm:3,FCA:.5,COV:.1,N:100},true],['minimum floor outside',{basis:'direct',t_min:2,t_am:5,t_mm:2.999999,FCA:.5,COV:.1,N:100},false],
 ['inconsistent COV',{t_am:8,t_mm:4,COV:.05},false],
 ['equal mean and minimum with nonzero COV',{t_am:8,t_mm:8,COV:.05},false],
 ['equal readings with zero COV',{t_am:8,t_mm:8,COV:0},true]
])test('API4 boundary '+name,()=>assert.equal(calc('ffs4',g).fail,!ok));
for(const f of [1-1e-8,1,1+1e-8]){
 test('API5 upper Rt '+f,()=>assert.equal(calc('ffs5',{t_mm:10*f}).fail,f>1));
 test('API5 B1 thin limit '+f,()=>assert.equal(calc('ffs5',{D:200*f,t_nom:20,t_mm:15,L_msd:1000}).fail,f<1));
 for(const [method,z,D,L] of [['original',20,800,400],['modified',50,500,500]])test('B31G exact branch '+method+' '+f,()=>{const r=calc('b31g',{method,D,L:L*f,t_nom:10,d:4});near(row(r,'z'),z*f*f);assert(!r.fail);const flow=method==='original'?258.5:304, zz=z*f*f,M=method==='original'?Math.sqrt(1+.8*zz):zz<=50?Math.sqrt(1+.6275*zz-.003375*zz*zz):.032*zz+3.3;const sf=method==='original'?(zz<=20?flow*(1-2*.4/3)/(1-2*.4/(3*M)):flow*.6):flow*.66/(1-.34/M);near(r.pmax,20*sf*10/D*.72);});
 test('API5 distance '+f,()=>{const g={side:'outer',L_msd:1.8*Math.sqrt(9500)*f};assert.equal(calc('ffs5',g).fail,f<1);});
 test('API5 circumference criterion '+f,()=>{assert.equal(calc('ffs5',{c:200*f}).fail,f>1);});
 test('API5 minimum wall '+f,()=>{assert.equal(calc('ffs5',{t_mm:.5+2.5*f}).fail,f<1);});
 test('API5 Rt floor '+f,()=>{assert.equal(calc('ffs5',{t_nom:20,t_mm:.5+3.9*f,L_msd:1000}).fail,f<1);});
 test('B31G depth '+f,()=>assert.equal(calc('b31g',{d:8*f}).fail,f>1));
 test('B31G temperature '+f,()=>assert.equal(calc('b31g',{T:120*f}).fail,f>=1));
 test('B31G SMYS '+f,()=>assert.equal(calc('b31g',{K20:483*f,SMTS:600}).fail,f>1));
 test('B31G F '+f,()=>assert.equal(calc('b31g',{F:f}).fail,f>1));
 test('API4 bend radius '+f,()=>assert.equal(calc('ffs4',{geom:'bend',Rb:1000*f}).fail,f<1));
 test('API5 Ec '+f,()=>assert.equal(calc('ffs5',{Ec:f,c:50}).fail,f>1));
 test('API5 RSFa '+f,()=>assert.equal(calc('ffs5',{RSFa:f,c:50}).fail,f>1));
}
for(const id of ids){
 const g=base(id),m=mod(id);
 for(const field of m.fields){
  if(field.type==='heading'||field.when&&!Object.entries(field.when).every(([k,v])=>(Array.isArray(v)?v:[v]).includes(g[k])))continue;
  for(const v of field.type==='select'?['?']:[NaN,Infinity,-1,...(field.min==='zero'||field.min==='any'?[]:[0])])test(id+' invalid '+field.id+'='+v,()=>{const bad={...g,[field.id]:v},r=calc(id,bad);assert(r.fail);svgOK(id,bad,r);});
 }
 for(const p of [0,-1,NaN,Infinity])test(id+' invalid p='+p,()=>assert(calc(id,{p}).fail));
}
for(const [id,g] of [['ffs4',{K:1e308}],['ffs4',{p:1e308}],['ffs4',{rate:1e-320}],['ffs5',{s:1e308}],['ffs5',{D:1e308}],['b31g',{L:1e308}],['ped',{p:1e308,V:1e308}]])test(id+' derived overflow '+JSON.stringify(g),()=>{const full={...base(id),...g},r=calc(id,g);assert(r.fail);svgOK(id,full,r);});
for(const id of ['ffs4','ffs5'])test(id+' FCA exhausted',()=>assert(calc(id,{FCA:10}).fail));
for(const flaw of ['groove','notch','crack'])test('API5 excluded '+flaw,()=>assert(calc('ffs5',{flaw}).fail));
for(const flaw of ['crack','notch','dent','seam'])test('B31G excluded '+flaw,()=>assert(calc('b31g',{flaw}).fail));
test('API5 unverified bend fails closed',()=>{const r=calc('ffs5',{geom:'bend'});assert(r.fail&&r.pmax===0);assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));});
test('API4 retains capacity above demand limit',()=>{const r=calc('ffs4',{p:100});assert(r.fail&&r.util>1&&r.pmax>0);assert(r.formula.includes(' < '));});
test('API4 sample COV exact feasibility limits',()=>{const mx=(1-7/8)*Math.sqrt(15),mn=mx/14;for(const COV of [mn,mx/2]){if(COV<=.1)assert(!calc('ffs4',{COV}).fail);}assert(calc('ffs4',{COV:mn*(1-1e-8)}).fail);});
test('API4 zero corrosion rate has no nonfinite rows',()=>{const r=calc('ffs4',{rate:0});assert(!r.fail);assert.equal(row(r,'RL'),'nicht bestimmbar');finitePass(r);});
test('PED temperature result and drawing agree',()=>{for(const T of [350,350.000001,NaN]){const g=pedInput(7,20,250,T),r=calc('ped',g),s=svgOK('ped',g,r);assert.equal(r.headline.text,T<=350?'Kat. II':'Kat. III');assert.equal(s.includes('ped-region-2'),T<=350);assert(s.includes('ped-region-3'));}});
test('direct thickness ignores inactive stress and no inverse is claimed',()=>{const r=calc('ffs4',{basis:'direct',K:NaN,S:NaN,v:NaN});assert(!r.fail);assert(Number.isNaN(r.pmax));finitePass(r);});
test('round1 drawing tags remain real geometry fields',()=>{const g=base('ffs4'),s=svgOK('ffs4',g,null);assert(!/data-p="[^"]*flaw/.test(s));assert(!/data-p="t_min"/.test(s));const d=svgOK('ffs4',{...g,basis:'direct'},null);assert(d.includes('data-p="t_min"'));});
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
