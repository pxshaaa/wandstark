'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const AD=require('../src/ad.js');
require('../data/materials.js');
// Load every other database append file before this file to catch global collisions.
for(const f of fs.readdirSync(path.join(__dirname,'../data')).sort())
  if(/^mat_.*\.js$/.test(f) && f!=='mat_forge2.js') require('../data/'+f);
const baseline=AD.materials.slice();
require('../data/mat_forge2.js');
const added=AD.materials.slice(baseline.length);
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);}}
function valid(m){
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string'&&m[key].length,key);
  assert.ok(families.includes(m.family),'family');
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type),'type');
  assert.ok(m.K.length>0);
  assert.equal(m.K[0][0],20);
  m.K.forEach(([t,k],i)=>{
    assert.ok(Number.isFinite(t)&&Number.isFinite(k)&&k>0);
    if(i){assert.ok(t>m.K[i-1][0],'ascending T');assert.ok(k<=m.K[i-1][1],'non-increasing K');}
  });
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1],'Rm > K20');
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
}
test('unique ids across the complete database',()=>assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length));
for(const m of AD.materials) test('database schema / plausibility '+m.id,()=>valid(m));
test('18 requested grades added',()=>assert.equal(added.length,18));
for(const m of added) test('source and product identity '+m.id,()=>{
  assert.equal(m.id.split(' | ').length,3);
  assert.match(m.note,/QUELLE:.*Tabelle/);
  assert.match(m.note,/https:\/\/|Normtext/);
  assert.ok(Array.isArray(m.aliases));
  assert.equal(new Set(m.aliases).size,m.aliases.length);
  // Compare grade + standard independently from the id's textual band formatting.
  const grade=m.id.split(' | ')[0];
  assert.ok(!baseline.some(b=>b.id.split(' | ')[0]===grade&&b.std===m.std),'existing grade/standard');
  if(m.family==='EN Stahlguss') assert.equal(m.S,2);
});
function find(g){const a=added.filter(m=>m.id.split(' | ')[0]===g);assert.equal(a.length,1,g);return a[0];}
// Independent source-row fixtures: EN 10222-2 Tables 4/5, EN 10222-4 Tables 4/6,
// EN 10222-5 Tables 4/6, EN 10213 Tables 3/6, EN 10269 Tables 4–7,
// API 5L:2012 Table 6. URLs are recorded beside each production entry.
for(const [g,t,k] of [
  ['P235GH',20,235],['P235GH',200,170],['P250GH',100,237],['P250GH',420,90],
  ['P265GH',20,245],['P265GH',300,155],['P295GH',20,285],['P295GH',400,155],
  ['P355NH',300,232],['P355NL1',20,355],['P355NL2',20,355],
  ['1.4541',20,235],['1.4541',500,149],['GX2CrNi19-11',100,165],
  ['GX2CrNiMo19-11-2',200,145],['GX5CrNiMoNb19-11-2',300,145],
  ['G17CrMoV5-10',550,260],['X22CrMoV12-1',20,600],['X22CrMoV12-1',500,335],
  ['40CrMoV4-6',200,631],['X19CrMoNbVN11-1',600,305],
  ['L175 (A25) PSL1',20,175],['L175P (A25P) PSL1',20,175],['L210 (A) PSL1',20,210]
]) test('source spot '+g+' at '+t,()=>assert.equal(find(g).K.find(p=>p[0]===t)?.[1],k));
for(const [g,rm] of [['P235GH',360],['P265GH',410],['1.4541',510],['40CrMoV4-6',850],['L210 (A) PSL1',335]])
  test('source Rm '+g,()=>assert.equal(find(g).Rm,rm));
test('P250GH footnote c overrides column heading',()=>assert.ok(!find('P250GH').K.some(p=>p[0]===450)));
test('NL grades have no borrowed warm values',()=>{
  for(const g of ['P355NL1','P355NL2']){assert.deepEqual(find(g).K,[[20,355]]);assert.match(find(g).note,/UNVERIFIED/);}
});
test('X19 additional qualification caveat',()=>assert.match(find('X19CrMoNbVN11-1').note,/Tabellen 5\/7 Fußnote b/));
console.log('PASS '+passed+'/'+total);
if(passed!==total)process.exitCode=1;
