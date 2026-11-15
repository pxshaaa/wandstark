'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');require('../modules/b9k.js');
const m=AD.modules.find(x=>x.id==='b9k');
const base={p:10,T:20,K:150,K20:150,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.filter(f=>'def'in f).map(f=>[f.id,f.def]))};
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
const near=(a,b)=>assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Independent worksheet: R=495, se=10 -> Di=990, Dk=1010;
// b=sqrt(1000*10)=100; dA=150, ss=10 -> di=130;
// lmax=sqrt(140*10)=sqrt(1400), l=20.
// A0=1000, A1=200, Ap=495*(100+10+65)+65*(20+10)=88575.
// f=100; at p=10, capacity=99.5*1200=119400 N, demand=88575 N.
const hand={...base,R:495,sn:10,dA:150,ss:10,ls:20};
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error(name);throw e;}}
test('hand worksheet sphere',()=>{
 const r=m.calc(hand,AD.h);assert(!r.fail);near(row(r,'b'),100);near(row(r,'lS'),20);near(row(r,'lS,max'),Math.sqrt(1400));
 near(row(r,'Aσ0'),1000);near(row(r,'Aσ1'),200);near(row(r,'Ap'),88575);
 near(r.util,88575/119400);near(r.pmax,1200000/89175);
 near(row(r,'s,B1'),10100/4010);near(row(r,'sS,B1'),1500/2010);
 assert.equal(r.test,null);assert(r.notes.some(x=>x[0]==='w'&&x[1].includes('UNVERIFIED')));
});
test('Klopper crown',()=>{const r=m.calc({...hand,shape:'kl',Da:1000,x:20},AD.h);assert(!r.fail);near(r.util,88575/119400);});
test('Korbbogen crown',()=>{const r=m.calc({...hand,shape:'kor',Da:1000,x:30},AD.h);assert(!r.fail);near(r.pmax,1200000/89175);});
test('nozzle length limited; factor one',()=>{
 const r=m.calc({...hand,ls:200},AD.h),L=Math.sqrt(1400),A=1000+10*L,P=495*175+65*(L+10);
 near(row(r,'lS'),L);near(r.util,P/(99.5*A));near(r.pmax,1000*A/(P+A/2));
});
test('corrosion + weaker nozzle',()=>{
 // Gross R=495,se=12,ss=12,c=2 leaves t=u=10, di=126;
 // b=100; l=20; Ap=495*(100+10+63)+63*30=87525.
 const r=m.calc({...hand,sn:12,ss:12,c1:.5,c2:1.5,Ks:120},AD.h);
 near(row(r,'Ap'),87525);near(row(r,'Aσ0'),1000);near(row(r,'Aσ1'),200);
 near(r.util,87525/(99.5*1000+79.5*200));near(r.pmax,10*(100*1000+80*200)/(87525+600));
});
test('pressure failure',()=>{const r=m.calc({...hand,p:100},AD.h);assert(r.fail);assert(r.util>1);near(r.util,885750/(95*1200));});
test('crown out of range',()=>{const r=m.calc({...hand,shape:'kl',Da:1000,x:126},AD.h);assert(r.fail);assert(Number.isNaN(r.pmax));});
test('diameter out of range',()=>{const r=m.calc({...hand,dA:950,ss:10},AD.h);assert(r.fail);near(row(r,'di/Di'),930/990);assert(Number.isNaN(r.pmax));});
test('zero projection and pressure',()=>{const r=m.calc({...hand,ls:0,p:0},AD.h);assert(!r.fail);near(r.util,0);near(row(r,'Aσ1'),0);near(r.pmax,1000000/(87275+500));});
test('invalid and ignored hidden fields',()=>{
 const r=m.calc({...hand,R:NaN},AD.h);assert(r.fail);assert(Number.isNaN(r.pmax));
 const good=m.calc({...hand,Da:NaN,x:NaN},AD.h);assert(!good.fail);
 for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r);
});
test('2 mm nominal minimum applies independently to sphere, head and nozzle',()=>{
 // Original counterexample: t=u=1; b=sqrt(201); l=sqrt(19).
 // A=b+l; Ap=100*(b+10)+9*(l+1); pressure alone uses < 14%.
 const b=Math.sqrt(201),l=Math.sqrt(19),A=b+l,Ap=100*(b+10)+9*(l+1);
 assert(.1*Ap/(99.95*A)<.14);
 for(const shape of ['sphere','kl','kor'])for(const [sn,ss] of [[1,1],[1,2],[2,1],[2,2]]){
  const r=m.calc({...base,shape,Da:1000,x:0,R:100,sn,ss,dA:30,ls:10,p:1},AD.h);
  assert.equal(r.fail,sn<2||ss<2);
  if(r.fail){assert(Number.isNaN(r.pmax));assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('2 mm')));}
  else assert(Number.isFinite(r.pmax));
 }
 const original=m.calc({...base,R:100,sn:1,dA:20,ss:1,ls:10,p:1},AD.h);
 near(original.util,.1*Ap/(99.95*A));assert(original.fail&&Number.isNaN(original.pmax));
 // The rule concerns nominal walls, not net thickness: 2 - 0.5 = 1.5 mm.
 const net=m.calc({...base,R:100,sn:2,dA:30,ss:2,ls:10,p:1,c1:.5},AD.h);
 assert(!net.fail);near(row(net,'t'),1.5);near(row(net,'u'),1.5);
});
test('overflow in stresses, forces, areas or pressure limits fails closed',()=>{
 // Independent worksheet above: A0=1000, A1=200. K/S=6.666e307
 // remains finite but its product with either area exceeds binary64 range.
 assert(Number.isFinite(1e308/1.5));assert(!Number.isFinite((1e308/1.5)*200));
 for(const patch of [{K:1e308},{S:1e-308},{p:1e308},{R:1e160,sn:1e158,dA:1e159,ss:1e157}]){
  const r=m.calc({...hand,...patch},AD.h);
  assert(r.fail);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));
 }
});
test('exact pressure equality without accepting positive overload',()=>{
 // Independent worksheet gives p*=1200000/89175 bar.
 // For target eta, solve p*8857.5 = eta*(120000-60*p).
 const pStar=1200000/89175;
 const exact=m.calc({...hand,p:pStar},AD.h);assert(!exact.fail);assert.equal(exact.util,1);
 const atLimit=m.calc({...base,p:m.calc(base,AD.h).pmax},AD.h);
 assert(!atLimit.fail);assert.equal(atLimit.util,1);assert.equal(atLimit.headline.value,100);
 for(const eta of [1-5e-10,1+5e-10,1-2e-9,1+2e-9]){
  const p=eta*120000/(8857.5+60*eta),r=m.calc({...hand,p},AD.h);
  near(row(r,'ηB9'),eta);
  near(r.util,eta);assert.equal(r.fail,eta>1);assert.notEqual(r.util,1);
 }
});
console.log(`PASS ${passed}/${total}`);
