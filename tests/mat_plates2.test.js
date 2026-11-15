'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('../src/ad.js');
require('../data/materials.js');
const ownFile='mat_plates2.js';
const dataDir=path.join(__dirname,'../data');
// Every supplement is loaded, including supplements added after this test.
for(const file of fs.readdirSync(dataDir).filter(f=>/^mat_.*\.js$/.test(f)&&f!==ownFile).sort()) require(path.join(dataDir,file));
const before=AD.materials.slice();
const snapshot=JSON.stringify(before);
require('../data/'+ownFile);
const entries=AD.materials.slice(before.length);
let passed=0,total=0;
function check(label,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+label+': '+e.message);}}
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
check('append only; fourteen requested grades',()=>{
  assert.equal(entries.length,14);
  assert.equal(JSON.stringify(AD.materials.slice(0,before.length)),snapshot);
  before.forEach((m,i)=>assert.equal(AD.materials[i],m));
});
check('unique ids across entire database',()=>assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length));
for(const m of AD.materials) check(m.id+' schema and plausibility',()=>{
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string'&&m[key].length,key);
  assert.ok(families.includes(m.family));
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type));
  assert.ok(Array.isArray(m.K)&&m.K.length);
  assert.equal(m.K[0][0],20);
  m.K.forEach(([t,k],i)=>{
    assert.equal(m.K[i].length,2);
    assert.ok(Number.isFinite(t)&&t>0);
    assert.ok(Number.isFinite(k)&&k>0);
    if(i){assert.ok(t>m.K[i-1][0],'ascending T');assert.ok(k<=m.K[i-1][1],'non-increasing K');}
  });
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
});
function grade(m){return m.id.split(' | ')[0];}
function standard(m){return m.std.replace(/:\d{4}.*/,'');}
for(const m of entries) check(m.id+' source and no existing grade/standard/band',()=>{
  assert.equal(m.family,'EN Blech');
  assert.equal(m.id.split(' | ').length,3);
  assert.ok(Array.isArray(m.aliases)&&m.aliases.length);
  assert.ok(m.aliases.every(a=>typeof a==='string'&&a.length));
  assert.match(m.note,/SOURCE:/);assert.match(m.note,/Tabelle/);assert.match(m.note,/https:\/\/|Normtext/);
  // All requested grades must be new to this EN plate standard, regardless of
  // differing ID spellings, aliases, edition suffixes or band formatting.
  assert.ok(!before.some(old=>old.family===m.family&&standard(old)===standard(m)&&
    (grade(old)===grade(m)||old.aliases?.includes(grade(m)))), 'existing grade under same standard');
});
function material(g){const found=entries.filter(m=>grade(m)===g);assert.equal(found.length,1,g);return found[0];}
// Independent source fixtures. EN 10028-2:2003, tables 3/4, printed pp.11–14:
// (Normtext, nicht verlinkt)
// EN 10028-3:2003 table 4, printed p.11:
// (Normtext, nicht verlinkt)
// EN 10028-7:2007 table 9 (P rows) and table 13 RIGHT block Rp1.0:
// (Normtext, nicht verlinkt)
const spots=[
  ['12CrMo9-10',20,355],['12CrMo9-10',100,323],['12CrMo9-10',450,279],
  ['18MnMo4-5',20,345],['18MnMo4-5',200,310],['18MnMo4-5',450,215],
  ['20MnMoNi4-5',20,470],['20MnMoNi4-5',50,460],['20MnMoNi4-5',400,384],
  ['15NiCuMoNb5-6-4',20,460],['15NiCuMoNb5-6-4',300,380],['15NiCuMoNb5-6-4',450,331],
  ['X12CrMo5',20,320],['X12CrMo5',250,293],['X12CrMo5',500,222],
  ['P275NL1',20,275],['P275NL2',20,275],['P460NL1',20,460],['P460NL2',20,460],
  ['1.4401',20,260],['1.4401',50,242],['1.4401',200,177],['1.4401',550,137],
  ['1.4550',20,240],['1.4550',50,229],['1.4550',100,211],['1.4550',550,147],
  ['1.4432',20,260],['1.4432',100,199],['1.4432',300,145],['1.4432',550,127],
  ['1.4429',20,320],['1.4429',100,246],['1.4429',300,175],['1.4429',550,157],
  ['1.4547',20,340],['1.4547',100,270],['1.4547',250,212],['1.4547',500,180]
];
for(const [g,t,k] of spots) check('source K '+g+' @ '+t,()=>assert.equal(material(g).K.find(p=>p[0]===t)?.[1],k));
for(const [g,rm,a] of [
  ['12CrMo9-10',540,18],['18MnMo4-5',510,20],['20MnMoNi4-5',590,18],
  ['15NiCuMoNb5-6-4',610,16],['X12CrMo5',510,20],
  ['P275NL1',390,24],['P275NL2',390,24],['P460NL1',570,17],['P460NL2',570,17],
  ['1.4401',520,45],['1.4550',500,40],['1.4432',520,45],['1.4429',580,40],['1.4547',650,40]
]) check('source Rm and A '+g,()=>{assert.equal(material(g).Rm,rm);assert.equal(material(g).A,a);});
check('NL elevated properties require ordering agreement; no extrapolation',()=>{
  for(const g of ['P275NL1','P275NL2','P460NL1','P460NL2']){
    const m=material(g);assert.equal(m.Tmax,20);assert.equal(m.K.length,1);
    assert.match(m.note,/§8\.4\.2/);assert.match(m.note,/UNVERIFIED/);
    assert.ok(Number.isNaN(AD.h.atT(m.K,100)));
  }
});
check('do not extend warm tables into missing cells',()=>{
  for(const g of ['12CrMo9-10','18MnMo4-5','15NiCuMoNb5-6-4']) assert.equal(material(g).Tmax,450);
  assert.equal(material('20MnMoNi4-5').Tmax,400);
  assert.equal(material('1.4547').Tmax,500);
  assert.ok(Number.isNaN(AD.h.atT(material('1.4547').K,550)));
});
check('first warm-band printed strict boundary preserved',()=>{
  for(const g of ['20MnMoNi4-5','15NiCuMoNb5-6-4']) assert.match(material(g).product,/t < 40 mm/);
});
console.log('PASS '+passed+'/'+total);
if(passed!==total) process.exitCode=1;
