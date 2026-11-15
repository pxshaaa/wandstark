'use strict';
const assert = require('node:assert/strict');
const AD = require('../src/ad.js');
require('../data/materials.js');
const baseline = AD.materials.length;
require('../data/mat_line.js');
const added = AD.materials.slice(baseline);
const allowed = ['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
let passed = 0, total = 0;
function test(name, fn){
  total++;
  try { fn(); passed++; }
  catch (e){ console.error('FAIL '+name+': '+e.message); }
}
function tableValid(table){
  assert.ok(Array.isArray(table) && table.length);
  assert.equal(table[0][0],20);
  table.forEach((point,i) => {
    assert.equal(point.length,2);
    assert.ok(Number.isFinite(point[0]));
    assert.ok(Number.isFinite(point[1]) && point[1]>0);
    if(i){
      assert.ok(point[0]>table[i-1][0], 'ascending T');
      assert.ok(point[1]<=table[i-1][1], 'K must not increase');
    }
  });
}
test('unique IDs across ALL loaded entries', () => {
  assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length);
  for(const m of AD.materials) tableValid(m.K);
});
// materials.js predates SCHEMA.md and has no family/type/Rm; enforce complete
// entry schema on this append file, without rewriting that independent baseline.
for(const m of added) test('schema and plausibility: '+m.id, () => {
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string' && m[key].length);
  assert.equal(m.id.split(' | ').length,3);
  assert.ok(allowed.includes(m.family));
  assert.equal(m.family,'Leitungsrohr');
  assert.equal(m.type,'ferritic');
  assert.ok(Number.isFinite(m.Rm) && m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S) && m.S>0);
  tableValid(m.K);
  assert.equal(m.K.length,1);
  assert.equal(m.Tmax,20);
  assert.match(m.note,/QUELLE:.*Tabelle/);
  assert.match(m.note,/https:\/\/|Normtext/);
  assert.match(m.note,/über 50 °C.*Abminderungsdaten/);
  assert.ok(Array.isArray(m.aliases));
  assert.equal(new Set(m.aliases).size,m.aliases.length);
});
function find(name,std,product){
  const matches=added.filter(m=>m.name===name && m.std.includes(std) && (!product || m.product.includes(product)));
  assert.equal(matches.length,1,'unambiguous source row '+name);
  return matches[0];
}
// Independently transcribed source rows: API 5L:2012 tables 6/7; EN 10208-1
// table 4; EN 10208-2 table 5; Böhler pipeline comparison p.5;
// ArcelorMittal Mechanical Properties pp.3/5; EN 10217-1 table 4;
// Tomrods DoP Performance characteristics; Tata Forcon Properties.
// URLs for these precise tables are attached to each material's note.
const spots = [
  ['L245 (B) PSL1','API 5L',null,245,415],
  ['L320 (X46) PSL1','API 5L',null,320,435],
  ['L390 (X56) PSL2','API 5L',null,390,490],
  ['L485 (X70) PSL2','API 5L',null,485,570],
  ['L555 (X80) PSL2','API 5L',null,555,625],
  ['L210GA','EN 10208-1',null,210,335],
  ['L235GA','EN 10208-1',null,235,370],
  ['L360NB','EN 10208-2',null,360,460],
  ['L485MB','EN 10208-2',null,485,570],
  ['StE 240.7','DIN 17172',null,240,370],
  ['StE 360.7','DIN 17172',null,360,510],
  ['StE 480.7','DIN 17172',null,480,600],
  ['P195TR1','EN 10216-1',null,195,320],
  ['P265TR2','EN 10216-1',null,265,410],
  ['P235TR2','EN 10217-1',null,235,360],
  ['S195T','EN 10255',null,195,320],
  ['S235JRH','EN 10210-1',null,235,360],
  
  ['S355J2H','EN 10219-1','3 ≤ t',355,470],['S355J2H','EN 10210-1','t ≤ 3',355,510]
];
for(const [name,std,product,k,rm] of spots) test('source spot: '+name+' '+std+' '+(product||''), () => {
  const m=find(name,std,product);
  assert.deepEqual(m.K,[[20,k]]);
  assert.equal(m.Rm,rm);
});
test('scope, historical successors and standard-valid aliases', () => {
  assert.equal(added.length,64);
  assert.equal(added.filter(m=>m.replacedBy).length,9);
  for(const m of added.filter(m=>m.replacedBy)){
    assert.ok(added.some(n=>n.name===m.replacedBy || n.aliases.includes(m.replacedBy)));
    assert.match(m.note,/UNVERIFIED: replacedBy/);
  }
  assert.ok(find('L245 (B) PSL2','API 5L').aliases.includes('L245N'));
  assert.ok(find('L415 (X60) PSL2','API 5L').aliases.includes('X60N'));
  assert.ok(find('L555 (X80) PSL2','API 5L').aliases.includes('L555Q'));
  assert.ok(!find('L450 (X65) PSL2','API 5L').aliases.includes('L450N'));
  assert.ok(!added.some(m=>m.name==='L555 (X80) PSL1'));
});
test('20 °C only: no extrapolated warm strength', () => {
  for(const m of added){
    assert.equal(AD.h.atT(m.K,20),m.K[0][1]);
    assert.ok(Number.isNaN(AD.h.atT(m.K,50)));
  }
});
console.log('PASS '+passed+'/'+total);
if(passed!==total) process.exitCode=1;
