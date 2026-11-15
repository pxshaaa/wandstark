'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AD = require('../src/ad.js');
require('../data/materials.js');
// Every extension is loaded, including future additions: uniqueness is database-wide.
const files = fs.readdirSync(path.join(__dirname,'../data'))
  .filter(f=>/^mat_.*\.js$/.test(f)&&f!=='mat_tubes2.js').sort();
for(const file of files) require('../data/'+file);
const baseline = AD.materials.slice();
require('../data/mat_tubes2.js');
const added = AD.materials.slice(baseline.length);
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);}}
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
const types=['ferritic','austenitic','duplex','cast','nickel','other'];
function checkTable(table){
  assert.ok(Array.isArray(table)&&table.length);
  table.forEach((p,i)=>{
    assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));assert.ok(p[1]>0);
    if(i){assert.ok(p[0]>table[i-1][0]);assert.ok(p[1]<=table[i-1][1]);}
  });
}
test('all database IDs unique, append only',()=>{
  assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length);
  assert.deepEqual(AD.materials.slice(0,baseline.length),baseline);
  assert.equal(added.length,26);
});
for(const m of AD.materials) test('database schema and plausibility '+m.id,()=>{
  for(const k of ['id','name','std','product','note']) assert.ok(typeof m[k]==='string'&&m[k].trim().length);
  assert.ok(families.includes(m.family));assert.ok(types.includes(m.type));
  checkTable(m.K);assert.equal(m.K[0][0],20);
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.ok(Number.isFinite(m.Tmax)&&m.Tmax>=m.K.at(-1)[0]);
  assert.ok(Array.isArray(m.aliases)&&m.aliases.every(a=>typeof a==='string'));
  if(m.A!==undefined) assert.ok(Number.isFinite(m.A)&&m.A>0&&m.A<=100);
  for(const key of ['RmT','E','asmeS']) if(m[key]) checkTable(m[key]);
});
for(const m of added) test('new source, identity, band '+m.id,()=>{
  assert.equal(m.family,'EN Rohr');assert.equal(m.S,1.5);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
  assert.match(m.note,/QUELLE:.*Tabelle/);assert.match(m.note,/https:\/\/|Normtext/);
  assert.equal(m.id,m.id.split(' | ')[0]+' | '+m.std.split(':')[0]+' | '+m.product);
  // Catch a pre-existing grade/standard/band even if its ID spelling differs.
  const grade=m.id.split(' | ')[0];
  assert.ok(!baseline.some(b=>(b.id.split(' | ')[0]===grade||b.name.split(' ')[0]===grade)&&
    b.std.split(':')[0]===m.std.split(':')[0]&&b.product===m.product));
});
function get(grade,std){
  const rows=added.filter(m=>m.id.startsWith(grade+' | '+std+' | '));
  assert.equal(rows.length,1);return rows[0];
}
// Independent source transcriptions; literal expected values, no module-derived expectations.
// EN 10216-2:2002 Tables 4/5:
// (Normtext, nicht verlinkt)
const spots=[
  ['11CrMo9-10','EN 10216-2',20,355],['11CrMo9-10','EN 10216-2',500,239],
  ['X11CrMo5+I','EN 10216-2',100,156],['X11CrMo5+NT1','EN 10216-2',450,181],
  ['X11CrMo5+NT2','EN 10216-2',250,332],['X11CrMo9-1+I','EN 10216-2',550,120],
  ['X11CrMo9-1+NT','EN 10216-2',500,290],
  // EN 10216-3:2002 Tables 4/5:
  // (Normtext, nicht verlinkt)
  ['P355NH','EN 10216-3',100,304],['P355NH','EN 10216-3',400,167],
  ['P460NH','EN 10216-3',150,373],['P460NH','EN 10216-3',400,235],
  ['P275NL1','EN 10216-3',20,275],['P275NL2','EN 10216-3',20,275],
  ['P355NL1','EN 10216-3',20,355],['P355NL2','EN 10216-3',20,355],
  ['P460NL1','EN 10216-3',20,460],['P460NL2','EN 10216-3',20,460],
  // EN 10216-4:2002 Table 4:
  // (Normtext, nicht verlinkt)
  ['P255QL','EN 10216-4',20,255],['12Ni14','EN 10216-4',20,345],
  ['X12Ni5','EN 10216-4',20,390],['X10Ni9','EN 10216-4',20,510],
  // EN 10216-5:2004 Tables 6/8/9/11:
  // (Normtext, nicht verlinkt)
  ['1.4306','EN 10216-5',20,215],['1.4306','EN 10216-5',100,180],
  ['1.4401','EN 10216-5',50,230],['1.4435','EN 10216-5',200,165],
  ['1.4550','EN 10216-5',150,195],['1.4539','EN 10216-5',20,250],
  ['1.4539','EN 10216-5',550,135],['1.4462','EN 10216-5',20,450],
  ['1.4462','EN 10216-5',200,310],['1.4462','EN 10216-5',250,295],
  // EN 10217-7:2005 Tables 6/8 (visually read; scanned tables):
  // (Normtext, nicht verlinkt)
  ['1.4541','EN 10217-7',20,235],['1.4541','EN 10217-7',150,196],
  ['1.4571','EN 10217-7',50,232],['1.4571','EN 10217-7',100,218],
  ['1.4571','EN 10217-7',550,157]
];
for(const [g,s,T,v] of spots) test('source K spot '+[g,s,T].join('/'),()=>{
  const p=get(g,s).K.find(p=>p[0]===T);assert.ok(p);assert.equal(p[1],v);
});
test('source Rm and A spots, independent proof-strength selection',()=>{
  assert.equal(get('X11CrMo5+NT2','EN 10216-2').Rm,570); // Table 4
  assert.equal(get('P460NH','EN 10216-3').Rm,560); // Table 4
  assert.equal(get('12Ni14','EN 10216-4').Rm,440); // Table 4
  assert.equal(get('1.4435','EN 10216-5').Rm,490); // Table 6
  assert.equal(get('1.4462','EN 10216-5').Rm,640); // Table 8
  assert.equal(get('1.4306','EN 10216-5').A,35); // Table 6, transverse
  assert.equal(get('1.4571','EN 10217-7').A,30); // Table 6, transverse
});
test('NH elevated tensile source values, Table 6 EN 10216-3',()=>{
  assert.equal(get('P355NH','EN 10216-3').RmT.find(p=>p[0]===100)[1],440);
  assert.equal(get('P460NH','EN 10216-3').RmT.find(p=>p[0]===400)[1],460);
});
test('low temperature grades contain no unverified hot points',()=>{
  const low=added.filter(m=>/NL[12] \| EN 10216-3/.test(m.id)||m.std==='EN 10216-4:2002');
  assert.equal(low.length,10);
  for(const m of low){assert.equal(m.Tmax,20);assert.equal(m.K.length,1);assert.match(m.note,/UNVERIFIED/);assert.ok(Number.isNaN(AD.h.atT(m.K,100)));}
});
test('coverage: 23 requested grade/standard pairs, 26 heat-treatment entries',()=>{
  assert.equal(new Set(added.map(m=>m.id.split(' | ')[0].replace(/\+(?:I|NT1|NT2|NT)$/,'')+' | '+m.std)).size,23);
});
console.log(`PASS ${passed}/${total}`);
if(passed!==total) process.exitCode=1;
