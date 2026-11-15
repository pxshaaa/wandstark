'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/b13.js');
const m=AD.modules.find(m=>m.id==='b13');
const base={p:10,K:180,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
const val=(r,s)=>r.rows.find(x=>x[1]===s)[2];
let pass=0,total=0;
function test(name,fn){total++;try{fn();pass++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
const near=(a,b)=>assert(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
// Independent hand worksheets: B13 (07/2012) §3 d=di+s,
// §6.2.1 (16). Values expanded with numerical inputs; no production helper.
const cases=[
 ['Standard',{},441*20*10/(40*1*45.7),120],
 ['Niederdruck',{p:2},441*20*2/(40*1*45.7),120],
 ['Naht und Warmfestigkeit',{v:0.8,K:120},441*20*10/(40*1*45.7*0.8),80],
 ['Dicker',{s:2,p:4},442*20*4/(40*2*45.7),120],
 ['Andere Geometrie',{Di:200,w:20,q:16,r:4,s:0.5,p:3},220.5*16*3/(40*0.5*24.56),120],
 ['Umfangsspannung versagt',{p:100},441*20*100/(40*45.7),120],
 ['Ohne Druck',{p:0,movement:0},0,120],
 ['Globale Sicherheit nicht B13',{S:3},441*20*10/(40*45.7),120]
];
for(const [name,patch,sigma,allow] of cases)test(name,()=>{
 const r=m.calc({...base,...patch},AD.h);
 for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r);
 near(val(r,'σum'),sigma);near(val(r,'K/1,5'),allow);near(val(r,'Uum'),sigma/allow);
 assert(r.fail);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
 assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
 assert(Number.isNaN(val(r,'Nzul')));assert(Number.isNaN(val(r,'σm')));assert(Number.isNaN(val(r,'σb')));
 if(name==='Umfangsspannung versagt')assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('überschreitet')));
});
for(const [name,patch] of [['Mehrlagig',{n:2}],['Zu dünn',{s:0.1}],['Zu groß',{Di:5000}],['Krempe außerhalb',{r:1,q:4}],['Teilung unpassend',{q:22}],['Korrosion',{c2:0.1}],['Toleranz nicht enthalten',{c1:0.1}],['Keine ganze Wellenzahl',{z:2.5}],['Negativer Weg',{movement:-1}],['NaN',{Di:NaN}],['Nahtwertigkeit',{v:1.1}],['Negativdruck',{p:-1}]])test(name,()=>{
 const r=m.calc({...base,...patch},AD.h);assert(r.fail);assert(Number.isNaN(val(r,'σum')));assert(Number.isNaN(r.pmax));assert.equal(r.test,null);assert(r.notes.some(n=>n[0]==='e'));
});
test('Fehlende Eingabe',()=>assert(m.calc(null,AD.h).fail));
console.log(`PASS ${pass}/${total}`);
