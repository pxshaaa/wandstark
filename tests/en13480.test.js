'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/en13480.js');
const base={p:40,T:200,K:1,K20:1,S:99,ST:99,v:1,c1:.2,c2:1,Do:219.1,sn:8,RpT:182,Rp20:235,Rm:360,tol:12.5,thin:0,scope:'yes',product:'wrought',R:328.65};
let pass=0,total=0;
function test(name,fn){total++;try{fn();pass++;}catch(e){console.error(name,e.message);process.exitCode=1;}}
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-9*Math.max(1,Math.abs(y)),`${x} != ${y}`);
for(const id of ['pipe','bend']){
 const m=AD.modules.find(m=>m.id===id);
 // Independent arithmetic from pressure equilibrium and code factors. No module helpers.
 const cases=[{}, {p:12,v:.85,sn:6,tol:0,c1:0,c2:.5}, {p:80,Rm:240,sn:12,R:657.3,thin:.4}, {p:0,sn:6}, {p:100,sn:2}, {sn:50}];
 cases.forEach((changes,i)=>test(id+' '+i,()=>{
  const g={...base,...changes},r=m.calc(g,AD.h);
  const stress=Math.min(g.RpT*2/3,g.Rm*5/12);
  const straight=g.p*g.Do/(20*stress*g.v+g.p);
  // Bogenfaktoren in algebraisch anderer Form (4R ± Do)/(4R ± 2Do).
  const inner=id==='bend'?(4*g.R-g.Do)/(4*g.R-2*g.Do):1;
  const outer=id==='bend'?(4*g.R+g.Do)/(4*g.R+2*g.Do):1;
  const req=(straight*inner+g.c1+g.c2+g.thin)*100/(100-g.tol);
  near(r.headline.value,req);near(r.util,req/g.sn);
  near(r.rows.find(x=>x[1]==='eext')[2],straight*outer);
  const out=i===5;assert.equal(r.fail,out||req>g.sn);
  if(!r.fail){
   const net=g.sn*(100-g.tol)/100-g.c1-g.c2-g.thin;
   near(r.pmax,20*stress*g.v*net/(inner*g.Do-net));
   const room=Math.min(g.Rp20/1.5,g.Rm/2.4);
   const pressure=g.p*Math.max(1.25*room/stress,1.43);
   near(r.test.PT,pressure);
   near(r.test.req,(pressure*g.Do/(19*g.Rp20+pressure)*inner+g.c1+g.c2+g.thin)*100/(100-g.tol));
   assert.equal(r.test.ok,r.test.req<=g.sn);
  }else assert.ok(Number.isNaN(r.pmax));
  for(const key of ['headline','util','pmax','test','rows','notes','fail','formula'])assert.ok(key in r);
 }));
 test(id+' invalid tolerance',()=>assert.equal(m.calc({...base,tol:100}).fail,true));
 test(id+' unsupported material',()=>assert.equal(m.calc({...base,scope:'no'}).fail,true));
 test(id+' NaN',()=>assert.equal(m.calc({...base,Do:NaN}).fail,true));
 test(id+' shared AD strengths ignored',()=>near(m.calc(base).headline.value,m.calc({...base,K:999,K20:999,S:1,ST:1}).headline.value));
}
test('bend singular radius',()=>assert.equal(AD.modules.find(m=>m.id==='bend').calc({...base,R:base.Do/2}).fail,true));

for(const id of ['pipe','bend'])test('2: Stahlguss '+id,()=>{
 const m=AD.modules.find(m=>m.id===id),g={...base,product:'casting',Do:1000,R:1500,sn:20,RpT:240,Rp20:240,Rm:420,p:30,tol:0,thin:0,c1:0,c2:0};
 const r=m.calc(g),k=id==='bend'?1.25:1;
 // f=240/1.9, PT=42.9 bar, ftest=240/1.4. Bend factor=(6-1)/(6-2).
 near(r.headline.value,3000/(480/1.9+3)*k);
 near(r.pmax,20*(240/1.9)*20/(1000*k-20));
 near(r.test.PT,42.9);near(r.test.req,4290/(480/1.4+4.29)*k);assert(!r.fail);
 near(r.rows.find(x=>x[0]==='Prüfspannungsgrenze')[2],240/1.4);
 const thin=m.calc({...g,sn:10});assert(thin.fail&&thin.headline.value>10&&Number.isNaN(thin.pmax));
 for(const product of [undefined,'unknown','other'])assert(m.calc({...g,product}).fail);
 assert.equal(m.fields.find(f=>f.id==='product').def,'wrought');
 const tensile=m.calc({...g,RpT:400,Rp20:400});near(tensile.headline.value,3000/283*k);
});

console.log(`PASS ${pass}/${total}`);
