'use strict';
const assert=require('assert');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s31.js');
const m=AD.modules.find(m=>m.id==='s31'),H=AD.h;
const base={...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),c1:0,c2:1};
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
const close=(a,b)=>assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let pass=0;
// Independent hand calculation: integrate ring using radii, W=I/R.
// N=500000 N, M=200000000 Nmm; conservative outer radius 999, inner radius 988 mm (loss outside).
const cases=[{}, {M:0,M5:0}, {weight:0,F5:0,M:-80,M5:-100}, {M:10000,M5:10000}, {Da:1200,sn:20,c1:1,c2:2,h:800,weight:230,M:110,F5:240,M5:120,Dt:1400,n:8}, {weight:0,F5:0,M:0,M5:0}];
for(const patch of cases){
 const g={...base,...patch},r=m.calc(g,H);
 const R=g.Da/2-g.c1-g.c2,ri=g.Da/2-g.sn,area=Math.PI*(R**2-ri**2);
 const inertia=Math.PI*(R**4-ri**4)/4,modulus=inertia/R;
 const direct=g.weight*1000/area,bending=Math.abs(g.M)*1000000/modulus;
 close(row(r,'A4'),area);close(row(r,'W4'),modulus);close(row(r,'σ4p'),bending-direct);close(row(r,'σ4q'),-bending-direct);
 close(r.headline.value,direct+bending);close(row(r,'ησ'),(direct+bending)/g.fZ);
 const raw=(Math.abs(g.M5)*4000000/g.Dt-g.F5*900)/g.n;
 close(row(r,'FKp'),raw);close(row(r,'FK,Z'),Math.max(0,raw));
 assert.strictEqual(r.util,direct+bending>0?Infinity:0);
 assert(r.fail&&r.ok===false);assert(Number.isNaN(r.pmax));assert.strictEqual(r.test,null);
 assert(r.notes.some(x=>x[0]==='w'&&x[1].includes('UNVERIFIED')));
 if(g.M===10000)assert(row(r,'ησ')>1);
 pass++;
}
// Out-of-scope opening; invalid remaining wall; invalid moment; noninteger anchors.
for(const patch of [{opening:'yes'},{sn:1,c2:2},{M:NaN},{n:3.5},{Da:20,sn:12}]){
 const r=m.calc({...base,...patch},H);assert(r.fail);assert(Number.isNaN(r.util));assert(r.notes.some(n=>n[0]==='e'));pass++;
}
console.log(`PASS ${pass}/${cases.length+5}`);
