'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/b4.js');
const m=AD.modules.find(m=>m.id==='b4');
const base={p:10,T:100,K:180,K20:235,S:1.5,ST:1.05,v:0.85,c1:0.5,c2:1,
 ...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
let passed=0,total=0;
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function shape(r){for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r);}
// Independent worksheet: prescribe net required wall x, THEN derive its load.
// No call to module helpers or solver is used for expected results.
// B4 §8.1 Gl. (5), (5a), (6)–(8) (AD 2000 B4 10.2000, Taschenbuch 2016 S. 218–222).
const B=(R,t,di)=>{const s=di/(2*R),c=Math.sqrt(1-s*s);return Math.max(1.85,1+.833*Math.sqrt(R/t)*s*c);};
const solveT=(f,lo,hi)=>{for(let i=0;i<200;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;};
for(const [R,x,K,v] of [[600,12,180,.85],[400,10,200,1],[1000,30,160,.7],[300,5,140,1]]){
 test(`Handrechnung R=${R}, t=${x}`,()=>{
  const g={...base,R,di:R,Da:1.4*R,dk:1.2*R,sn:1.8*x+1.5,r:30,K,v};
  const beta=B(R,x,g.di);
  g.p=20*K*v*x/(g.S*R*beta);
  const r=m.calc(g,AD.h);shape(r);
  near(r.headline.value,x+1.5);near(r.util,(x+1.5)/g.sn);
  const have=g.sn-1.5;
  near(r.pmax,20*K*v*have/(g.S*R*B(R,have,g.di)));
  const PT=Math.max(1.25*g.p*235/K,1.43*g.p);near(r.test.PT,PT);
  // Separate bisection worksheet: t = PT·S'·R·β(t)/(20·K20·v).
  const q=PT*g.ST/(20*g.K20*v), tt=solveT(t=>q*R*B(R,t,g.di)-t,1e-6,R);
  const expected=Math.max(.005*R,tt)+1.5;
  near(r.test.req,expected);assert.equal(r.test.ok,expected<=g.sn);assert(!r.fail);
  assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
 });
}
test('Unzureichende Dicke',()=>{
 const g={...base,p:35,sn:8,r:8},r=m.calc(g,AD.h);shape(r);
 assert(r.fail);assert(r.util>1);assert(!r.test.ok);
 near(r.pmax,20*180*.85*6.5/(1.5*600*B(600,6.5,base.di)));
});
test('Außerhalb relativer Dickenbegrenzung',()=>{
 for(const sn of [3,62]){const r=m.calc({...base,sn,r:30},AD.h);shape(r);assert(r.fail);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);}
});
test('Nicht implementierte Anschlüsse gesperrt',()=>{
 for(const attachment of ['inside','loose','reinforced','welded','unknown']){
  const r=m.calc({...base,attachment},AD.h);assert(r.fail);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
 }
});
test('Geometrie und Übergangsradius',()=>{
 for(const patch of [{di:1201},{dk:500},{dk:900},{r:5},{r:10}]){
  const r=m.calc({...base,...patch},AD.h);assert(r.fail);assert.equal(r.test,null);
 }
});
test('NaN und negative Eingaben',()=>{
 for(const patch of [{R:NaN},{sn:NaN},{p:-1},{v:1.1},{c2:-1},{K20:0}]){
  const r=m.calc({...base,...patch},AD.h);shape(r);assert(r.fail);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
 }
});
test('Nulldruck mit unterer Anwendungsgrenze',()=>{
 const r=m.calc({...base,p:0},AD.h);near(r.headline.value,4.5);near(r.test.req,4.5);assert(!r.fail);
});
test('Prüfzustand allein maßgebend',()=>{
 const g={...base,sn:20,r:20,K20:180,ST:1.5,p:20*180*.85*15/(1.5*600*B(600,15,base.di))};const r=m.calc(g,AD.h);
 assert(r.util<1);assert(!r.test.ok);assert(r.fail);near(r.test.PT,1.43*g.p);
});
test('Keine Extrapolation bei extremem Druck',()=>{
 const r=m.calc({...base,p:10000},AD.h);assert(r.fail);assert.equal(r.headline.value,Infinity);assert(!r.test.ok);
});
test('Halbkugelgeometrie di = 2R: sinα·cosα = 0, β = 1,85 (Untergrenze)',()=>{
 const g={...base,di:1200,dk:1300,Da:1400},r=m.calc(g,AD.h);assert(!r.fail);
 const have=g.sn-1.5; near(r.pmax,20*180*.85*have/(1.5*600*1.85));
});
test('di > 2R wird abgelehnt',()=>{const r=m.calc({...base,di:1300,dk:1400,Da:1500},AD.h);assert(r.fail);});
console.log(`PASS ${passed}/${total}`);
