'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../data/flanges.js');
require('../modules/b7b8.js');
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
const dns=[15,20,25,32,40,50,65,80,100,125,150,200,250,300,350,400,450,500];
test('vollständige bevorzugte DN-Reihe und Datentypen',()=>{
 let count=0;
 for(const type of ['01','11'])for(const pn of [10,16,25,40])for(const dn of dns){
  const f=AD.flanges[type][pn][dn];count++;
  assert.equal(f.type,type);assert.equal(f.DN,dn);assert.equal(f.PN,pn);
  for(const k of ['D','K','L','n'])assert.ok(Number.isFinite(f[k])&&f[k]>0,k);
  assert.ok(f.D>f.K+f.L);assert.ok(Number.isInteger(f.n)&&f.n>=4);
  assert.match(f.bolt,/^M\d+$/);assert.match(f.source,/^https:\/\//);
  assert.ok(f.C>0||(f.C===null&&f.unverified.includes('C')));
  if(type==='11')for(const k of ['A','N','H','s','r'])assert.ok(f.hub[k]>0,k);
 }
 assert.equal(count,144);
});
// Independent transcription: Emsal table EN Type11 PN16 DN100.
test('Typ11 DN100 PN16',()=>{
 const f=AD.flanges['11'][16][100];
 assert.deepEqual([f.D,f.K,f.L,f.n,f.bolt,f.C],[220,180,18,8,'M16',20]);
 assert.deepEqual(f.hub,{A:114.3,N:131,H:52,s:3.6,r:8});
});
test('PN10 und PN16 DN200 unterscheiden sich in Schraubenzahl',()=>{
 assert.equal(AD.flanges['11'][10][200].n,8);assert.equal(AD.flanges['11'][16][200].n,12);
});
test('Typ11 DN500 PN40 Randwert',()=>{
 const f=AD.flanges['11'][40][500];
 assert.deepEqual([f.D,f.K,f.L,f.n,f.bolt,f.C],[755,670,42,20,'M39',57]);
});
test('Typ01 hat eigene Blattdicke',()=>{
 assert.equal(AD.flanges['01'][16][100].C,22);
 assert.equal(AD.flanges['01'][25][500].C,58);
 assert.equal(AD.flanges['01'][40][300].C,52);
});
test('nicht belegte Dicke bleibt ausdrücklich unbekannt',()=>{
 for(const dn of [450,500]){
  assert.equal(AD.flanges['01'][40][dn].C,null);
  assert.deepEqual(AD.flanges['01'][40][dn].unverified,['C']);
 }
});
test('IBC-Dichtungen: 72 Maße ohne reduzierte GORE-ID',()=>{
 for(const pn of [10,16,25,40]){
  assert.equal(Object.keys(AD.gaskets[pn]).length,18);
  for(const dn of dns){const d=AD.gaskets[pn][dn];assert.ok(d.da>d.di);assert.equal(d.form,'IBC');}
 }
 assert.deepEqual([AD.gaskets[16][100].di,AD.gaskets[16][100].da],[115,162]);
 assert.deepEqual([AD.gaskets[10][500].di,AD.gaskets[10][500].da],[508,594]);
 assert.equal(AD.gaskets[40][200].da,290);
 assert.equal(AD.gaskets[16][250].da,329);
});
test('außerhalb Tabelle keine Interpolation oder Ersatzwahl',()=>{
 assert.equal(AD.flanges['11'][16][600],undefined);
 assert.equal(AD.flanges['11'][63],undefined);
 assert.equal(AD.gaskets[16][175],undefined);
});
console.log(`PASS ${passed}/${total}`);
if(passed!==total)process.exitCode=1;
