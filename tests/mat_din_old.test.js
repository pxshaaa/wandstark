'use strict';
const assert = require('node:assert/strict');
require('../src/ad.js');
require('../data/materials.js');
const baselineCount = AD.materials.length;
const baseline = AD.materials.slice();
require('../data/mat_din_old.js');
const entries = AD.materials.slice(baselineCount);
let passed=0, total=0;
function check(label, fn){
  total++;
  try {fn(); passed++;}
  catch(error){console.error('FAIL '+label+': '+error.message);}
}
const allowed = ['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss',
  'EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
check('appends without replacing existing entries',()=>{
  assert.equal(entries.length,21);
  baseline.forEach((m,i)=>assert.equal(AD.materials[i],m));
});
check('unique ids across ALL loaded entries',()=>{
  assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length);
});
// Base materials.js predates SCHEMA.md and lacks family/type/Rm on some rows.
// Validate its temperature tables too, but require the new schema on new rows.
for(const m of AD.materials) check(m.id+' temperature/strength table',()=>{
  assert.equal(m.K[0][0],20);
  m.K.forEach(([t,k],i)=>{
    assert.ok(Number.isFinite(t)&&Number.isFinite(k)&&k>0);
    if(i){assert.ok(t>m.K[i-1][0]); assert.ok(k<=m.K[i-1][1]);}
  });
});
for(const m of entries) check(m.id+' schema and plausibility',()=>{
  for(const key of ['id','name','std','product','replacedBy','note'])
    assert.ok(typeof m[key]==='string'&&m[key].length>0,key);
  assert.equal(m.id.split(' | ').length,3);
  assert.ok(allowed.includes(m.family));
  assert.equal(m.family,'DIN (alt)');
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type));
  assert.ok(Array.isArray(m.aliases)&&m.aliases.some(s=>/^1\.\d{4}$/.test(s)));
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
  assert.match(m.note,/SOURCE:/);
  assert.match(m.note,/Tabelle \d/);
  assert.match(m.note,/https:\/\/|Normtext/);
});
function material(grade,std){
  const found=entries.filter(m=>m.id.startsWith(grade+' | '+std+' | '));
  assert.equal(found.length,1,grade+' '+std);
  return found[0];
}
// Independent source fixtures. DIN 17175:1979, tables 5/6, original scan
// pp.12/13: (Normtext, nicht verlinkt)
const spots=[
  ['St 35.8','DIN 17175:1979',20,235],
  ['St 35.8','DIN 17175:1979',300,140],
  ['St 45.8','DIN 17175:1979',20,255],
  ['St 45.8','DIN 17175:1979',450,125],
  ['17Mn4','DIN 17175:1979',20,270],
  ['17Mn4','DIN 17175:1979',300,175],
  ['19Mn5','DIN 17175:1979',20,310],
  ['19Mn5','DIN 17175:1979',350,180],
  ['15Mo3','DIN 17175:1979',20,270],
  ['15Mo3','DIN 17175:1979',500,150],
  ['13CrMo44','DIN 17175:1979',20,290],
  ['13CrMo44','DIN 17175:1979',400,190],
  ['10CrMo910','DIN 17175:1979',20,280],
  ['10CrMo910','DIN 17175:1979',500,185],
  ['X20CrMoV121','DIN 17175:1979',550,250],
  // DIN 1629 table 4 / DIN 1630 table 3, hot-finished t <=16 mm:
  // (Normtext, nicht verlinkt)
  // (Normtext, nicht verlinkt)
  ['St 37.0','DIN 1629:1984',20,235],
  ['St 44.0','DIN 1629:1984',20,275],
  ['St 52.0','DIN 1629:1984',20,355],
  ['St 37.4','DIN 1630:1984',20,235],
  ['St 44.4','DIN 1630:1984',20,275],
  ['St 52.4','DIN 1630:1984',20,355],
  // DIN 17102 tables 3/4, smallest thickness band:
  // (Normtext, nicht verlinkt)
  ['StE 355','DIN 17102',20,355],
  ['WStE 355','DIN 17102',100,304],
  ['WStE 355','DIN 17102',200,255],
  ['WStE 355','DIN 17102',400,167],
  ['TStE 355','DIN 17102',20,355],
  ['StE 460','DIN 17102',20,460],
  // DIN 17100 table 2, 3 <= t <=16 mm:
  // (Normtext, nicht verlinkt)
  ['St 37-2','DIN 17100',20,235],
  ['St 37-3','DIN 17100',20,235],
  ['St 52-3','DIN 17100',20,355]
];
for(const [grade,std,t,k] of spots) check('source spot '+grade+' @ '+t,()=>{
  assert.equal(material(grade,std).K.find(p=>p[0]===t)?.[1],k);
});
for(const [grade,std,rm] of [
  ['15Mo3','DIN 17175:1979',450],['X20CrMoV121','DIN 17175:1979',690],
  ['St 44.4','DIN 1630:1984',420],['StE 460','DIN 17102',560],
  ['St 37-2','DIN 17100',340],['St 52-3','DIN 17100',490]
]) check('source Rm '+grade,()=>assert.equal(material(grade,std).Rm,rm));
check('historical tube thickness and application restrictions',()=>{
  assert.match(material('15Mo3','DIN 17175:1979').product,/10 < t/);
  assert.match(material('13CrMo44','DIN 17175:1979').product,/10 < t/);
  assert.match(material('17Mn4','DIN 17175:1979').product,/Sammler/);
  assert.match(material('19Mn5','DIN 17175:1979').product,/Sammler/);
});
check('no warm interpolation beyond room-temperature-only sources',()=>{
  for(const m of entries.filter(m=>/DIN (1629|1630|17100)/.test(m.std))) {
    assert.equal(m.K.length,1);
    assert.ok(Number.isNaN(AD.h.atT(m.K,100)));
  }
});
console.log('PASS '+passed+'/'+total);
if(passed!==total) process.exitCode=1;
