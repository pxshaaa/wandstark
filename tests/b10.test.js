'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b10.js');
const m=AD.modules.find(m=>m.id==='b10');
assert(m&&m.name==='Dickwandig'&&m.code==='B10'&&m.group==='Schalen');
const base={p:230,T:100,K:180,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,
 ...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),Da:1000,sn:120}; // test geometry fixed, independent of UI defaults
let passed=0,total=0;
const near=(a,b)=>assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function contract(r){for(const key of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(key in r,key);}
// Independent worksheets, B10 §6.1 (1)-(3). Each row states the hand-selected
// remaining wall, pressure and allowable stress. Expanded numerical expressions
// below intentionally do not call required(), H.PT(), or any module helper.
const sheets=[
 ['Zylinder',{},1000*230/(23*120-230),23*120*120/1120,230*1120/(23*120),230*640/(23*120),Math.max(1.25*230*235/180,1.43*230),120,0],
 ['Mit Zuschlägen',{c1:1,c2:2},1000*230/(23*120-230)+3,23*120*117/1117,230*1117/(23*117),230*649/(23*117),Math.max(1.25*230*235/180,1.43*230),120,3],
 ['Kleiner Durchmesser',{Da:200,sn:25,p:200},200*200/(23*120-200),23*120*25/225,200*225/(23*25),200*125/(23*25),Math.max(1.25*200*235/180,1.43*200),25,0],
 ['Warmzustand',{K:120,p:150,c1:1,c2:1},1000*150/(23*80-150)+2,23*80*118/1118,150*1118/(23*118),150*646/(23*118),Math.max(1.25*150*235/120,1.43*150),120,2],
 ['Betrieb versagt',{p:350},1000*350/(23*120-350),23*120*120/1120,350*1120/(23*120),350*640/(23*120),Math.max(1.25*350*235/180,1.43*350),120,0],
 ['Prüfung versagt',{p:280,K20:180,ST:1.5},1000*280/(23*120-280),23*120*120/1120,280*1120/(23*120),280*640/(23*120),1.43*280,120,0]
];
for(const [name,patch,s,pm,si,sa,PT,have,c] of sheets)test(name,()=>{
 const g={...base,...patch},r=m.calc(g,AD.h);contract(r);
 near(r.headline.value,s);
 const expectedProofForUtil=g.Da*PT/(23*g.K20/g.ST-PT)+c;
 near(r.util,Math.max(s,expectedProofForUtil)/have);
 near(r.pmax,Math.min(pm,23*g.K20/g.ST*(have-c)/(g.Da+have-c)/(PT/g.p)));
 near(row(r,'σvi'),si);near(row(r,'σva'),sa);near(r.test.PT,PT);
 const expectedProof=g.Da*PT/(23*g.K20/g.ST-PT)+c;
 near(r.test.req,expectedProof);assert.equal(r.test.ok,expectedProof<=have);
 assert.equal(r.fail,s>have||expectedProof>have);
 if(name==='Prüfung versagt'){assert(r.headline.value/have<1);assert(r.util>1);assert(!r.test.ok);}
 assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
for(const [name,patch] of [
 ['Dünnwandig',{sn:50}],['Untergrenze exakt',{Da:1200,sn:100}],
 ['Zu dick',{sn:180}],['Kugel',{shape:'sph'}],['Nahtwertigkeit',{v:.85}],
 ['Temperaturgradient',{thermal:'gradient'}],['Axiallast',{axial:'other'}],
 ['Werkstoff',{material:'other'}],['Sonderfreigabe',{S:1.4}],['Prüfsicherheit',{ST:1}],
 ['Ungültiger Innendurchmesser',{sn:500}],['Restwand null',{c1:120}],
 ['Restwand zu dünn',{sn:100,c1:20}],['NaN',{Da:NaN}],['Negativer Druck',{p:-1}],['Unendliche Temperatur',{T:Infinity}]
])test(name,()=>{const r=m.calc({...base,...patch},AD.h);contract(r);assert(r.fail);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);assert(r.notes.some(n=>n[0]==='e'));});
test('Obergrenze exakt und separat berechneter Druck',()=>{
 const r=m.calc({...base,Da:900,sn:150,p:230},AD.h);
 near(row(r,'Da/Di'),1.5);near(r.pmax,23*120*150/1050);assert(!r.fail);
});
test('Null-Druck',()=>{const r=m.calc({...base,p:0},AD.h);near(r.headline.value,0);near(r.test.req,0);assert(!r.fail);});
test('Singulärer Nenner',()=>{const r=m.calc({...base,p:2760},AD.h);assert(r.fail);assert(!Number.isFinite(r.headline.value));assert.equal(r.test,null);});
test('Rückrechnung pmax',()=>{
 const pm=23*120*120/1120;
 const r=m.calc({...base,p:pm},AD.h);near(r.headline.value,120);
});
console.log(`PASS ${passed}/${total}`);
