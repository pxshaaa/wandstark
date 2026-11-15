'use strict';
const assert = require('node:assert/strict');
require('../src/ad.js');
require('../data/materials.js');
const baseline = AD.materials.slice();
require('../data/mat_forge_cast_bar.js');
const added = AD.materials.slice(baseline.length);
let passed=0, total=0;
function check(label, fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+label+': '+e.message);}}
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
const types=['ferritic','austenitic','duplex','cast','nickel','other'];
check('all loaded IDs unique',()=>assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length));
check('append preserves existing objects',()=>baseline.forEach((m,i)=>assert.equal(AD.materials[i],m)));
check('all 29 requested grades',()=>assert.equal(added.length,29));
// Existing materials.js predates SCHEMA.md: family/type/Rm are absent there.
// Check its available tables as well; apply mandatory new-entry fields to this file.
for(const m of AD.materials){
  check(m.id+' K table',()=>{
    assert.ok(Array.isArray(m.K)&&m.K.length);
    assert.equal(m.K[0][0],20);
    m.K.forEach(([t,k],i)=>{
      assert.ok(Number.isFinite(t)&&Number.isFinite(k)&&k>0);
      if(i){assert.ok(t>m.K[i-1][0]);assert.ok(k<=m.K[i-1][1]);}
    });
    assert.equal(m.Tmax,m.K.at(-1)[0]);
  });
}
for(const m of added){
  check(m.id+' schema',()=>{
    for(const field of ['id','name','std','product','note'])assert.ok(typeof m[field]==='string'&&m[field].length);
    assert.equal(m.id.split(' | ').length,3);
    assert.ok(families.includes(m.family));assert.ok(types.includes(m.type));
    assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
    assert.ok(Array.isArray(m.aliases)&&m.aliases.length);
    assert.ok(m.note.includes('QUELLE:')&&m.note.includes('Tabelle')&&(m.note.includes('https://')||m.note.includes('Normtext')));
    assert.equal(m.S,m.family==='EN Stahlguss'?2:1.5);
    assert.ok(m.note.includes('Tafel 2'));
  });
}
function find(grade,std){const m=added.find(m=>m.id.startsWith(grade+' | '+std+' | '));assert.ok(m,grade+' '+std);return m;}
// Independent literal transcriptions of source cells, not generated from K.
// EN 10222-2:2017+A1:2021 Tables 4/5, pp.13–16:
// (Normtext, nicht verlinkt)
const spots=[
 ['P245GH','EN 10222-2:2017+A1:2021',20,245],
 ['P280GH','EN 10222-2:2017+A1:2021',200,225],
 ['P305GH','EN 10222-2:2017+A1:2021',400,165],
 ['16Mo3','EN 10222-2:2017+A1:2021',20,295],
 ['13CrMo4-5','EN 10222-2:2017+A1:2021',500,175],
 ['11CrMo9-10','EN 10222-2:2017+A1:2021',20,310],
 ['X10CrMoVNb9-1','EN 10222-2:2017+A1:2021',600,215],
 // EN 10222-4:2017 Tables 4/6:
 // (Normtext, nicht verlinkt)
 ['P285NH','EN 10222-4:2017',300,166],
 ['P355QH1','EN 10222-4:2017',100,287],
 // EN 10222-5:2017 Tables 4/6; Rp1.0 (not Rp0.2):
 // (Normtext, nicht verlinkt)
 ['1.4301','EN 10222-5:2017',20,230],
 ['1.4404','EN 10222-5:2017',20,225],
 ['1.4571','EN 10222-5:2017',500,158],
 // EN 10213:2007 Tables 3/6:
 // (Normtext, nicht verlinkt)
 ['GP240GH','EN 10213:2007',200,175],
 ['GP280GH','EN 10213:2007',450,150],
 ['G20Mo5','EN 10213:2007',20,245],
 ['G17CrMo5-5','EN 10213:2007',550,160],
 ['G17CrMo9-10','EN 10213:2007',200,355],
 ['GX5CrNi19-10','EN 10213:2007',100,160],
 ['GX5CrNiMo19-11-2','EN 10213:2007',400,105],
 // EN 10273:2000 Tables 4/6 (historical edition):
 // (Normtext, nicht verlinkt)
 ['P235GH','EN 10273:2000',50,206],
 ['P250GH','EN 10273:2000',450,90],
 ['P295GH','EN 10273:2000',100,250],
 ['P355GH','EN 10273:2000',400,180],
 ['16Mo3','EN 10273:2000',200,215],
 ['13CrMo4-5','EN 10273:2000',500,165],
 // EN 10269:2013 Tables 4/6:
 // (Normtext, nicht verlinkt)
 ['C35E','EN 10269:2013',200,229],
 ['25CrMo4','EN 10269:2013',500,235],
 ['42CrMo4','EN 10269:2013',20,730],
 ['21CrMoV5-7','EN 10269:2013',400,410]
];
for(const [g,s,t,k]of spots)check('source '+g+' '+s+' @'+t,()=>assert.equal(find(g,s).K.find(p=>p[0]===t)?.[1],k));
check('spot coverage >= 8',()=>assert.ok(spots.length>=8));
check('forging/plate strengths stay distinct',()=>assert.notEqual(find('16Mo3','EN 10222-2:2017+A1:2021').K[0][1],baseline.find(m=>m.id==='16Mo3').K[0][1]));
check('no invented missing cast 100°C point',()=>assert.ok(!find('G20Mo5','EN 10213:2007').K.some(p=>p[0]===100)));
check('no extrapolation beyond table',()=>assert.ok(Number.isNaN(AD.h.atT(find('GX5CrNi19-10','EN 10213:2007').K,301))));
check('A2/A4 note only',()=>{
  assert.ok(!added.some(m=>/A[24]-70/.test(m.id)));
  assert.ok(find('C35E','EN 10269:2013').note.includes('UNVERIFIED'));
});
console.log('PASS '+passed+'/'+total);
if(passed!==total)process.exitCode=1;
