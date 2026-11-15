'use strict';
const assert = require('node:assert/strict');
const AD = require('../src/ad.js');
require('../data/materials.js');
const baseCount = AD.materials.length;
require('../data/mat_tubes.js');
const tubes = AD.materials.slice(baseCount);
let passed=0, total=0;
function test(name,fn){ total++; try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);} }
const allowed=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
test('IDs unique across ALL loaded entries; append preserves baseline',()=>{
  assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length);
  assert.equal(tubes.length,54);
  assert.equal(AD.materials[0].id,'P235GH');
});
// Legacy materials.js lacks family/type/Rm: full new schema applies to appended
// entries; ID and K-table checks below apply to every loaded entry.
for(const m of AD.materials) test('K schema / monotonicity '+m.id,()=>{
  assert.ok(Array.isArray(m.K)&&m.K.length);
  assert.equal(m.K[0][0],20);
  m.K.forEach((p,i)=>{
    assert.equal(p.length,2); assert.ok(p.every(Number.isFinite)); assert.ok(p[1]>0);
    if(i){assert.ok(p[0]>m.K[i-1][0]);assert.ok(p[1]<=m.K[i-1][1]);}
  });
});
for(const m of tubes) test('entry schema '+m.id,()=>{
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string'&&m[key].length);
  assert.ok(allowed.includes(m.family)); assert.equal(m.family,'EN Rohr');
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type));
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0); assert.equal(m.S,1.5);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
  assert.ok(Array.isArray(m.aliases)&&m.aliases.every(x=>typeof x==='string'));
  assert.match(m.note,/QUELLE:.*Tabelle/); assert.match(m.note,/https:\/\/|Normtext/);
  assert.equal(m.id.split(' | ').length,3);
});
function get(grade,std,band){const found=tubes.filter(m=>m.id.startsWith(grade+' | '+std+' | ')&&m.product.includes(band));assert.equal(found.length,1);return found[0];}
// Independent transcriptions from the cited tables, NOT computed from module rows.
// EN 10216-2:2002 Tables 4/5, URL in mat_tubes.js sources.en2.
const spots=[
 ['P195GH','EN 10216-2','t ≤ 16',400,94],
 ['P235GH','EN 10216-2','16 < t',20,225],
 ['P235GH','EN 10216-2','40 < t',450,108],
 ['P265GH','EN 10216-2','t ≤ 16',200,192],
 ['20MnNb6','EN 10216-2','40 < t',20,335],
 ['16Mo3','EN 10216-2','16 < t',500,146],
 ['13CrMo4-5','EN 10216-2','t ≤ 16',300,192],
 ['10CrMo9-10','EN 10216-2','40 < t',500,180],
 ['14MoV6-3','EN 10216-2','40 < t',550,197],
 ['X10CrMoVNb9-1','EN 10216-2','t ≤ 100',600,215],
 ['X20CrMoV11-1','EN 10216-2','t ≤ 100',200,430],
 // EN 10216-3:2002 Table 4, sources.en3.
 ['P355N','EN 10216-3','80 < t',20,305],
 ['P460N','EN 10216-3','12 < t',20,450],
 // EN 10216-4:2002 Table 4, sources.en4.
 ['P215NL','EN 10216-4','t ≤ 10',20,215],
 ['P265NL','EN 10216-4','t ≤ 25',20,265],
 ['26CrMo4-2','EN 10216-4','t ≤ 40',20,440],
 // EN 10216-5:2004 Tables 6/9, sources.en5 (Rp1,0).
 ['1.4301','EN 10216-5','t ≤ 60',100,190],
 ['1.4307','EN 10216-5','t ≤ 60',150,160],
 ['1.4404','EN 10216-5','t ≤ 60',250,153],
 ['1.4541','EN 10216-5','kalt gefertigt',20,235],
 ['1.4541','EN 10216-5','warm gefertigt',300,127],
 ['1.4571','EN 10216-5','kalt gefertigt',50,234],
 ['1.4571','EN 10216-5','warm gefertigt',20,225],
 // EN 10217-2:2019 Tables 4/5, sources.w2.
 ['P195GH','EN 10217-2','t ≤ 16',250,130],
 ['P235GH','EN 10217-2','t ≤ 16',400,112],
 ['P265GH','EN 10217-2','t ≤ 16',100,226],
 ['16Mo3','EN 10217-2','t ≤ 16',300,173],
 // EN 10217-7:2005 Tables 6/8, sources.w7 (Rp1,0).
 ['1.4301','EN 10217-7','t ≤ 60',100,191],
 ['1.4404','EN 10217-7','t ≤ 60',250,157]
];
for(const [g,s,b,T,K] of spots) test('source spot '+[g,s,b,T].join(' / '),()=>{
  const row=get(g,s,b).K.find(p=>p[0]===T); assert.ok(row); assert.equal(row[1],K);
});
test('room-temperature only N / NL; unsupported values excluded',()=>{
 for(const m of tubes.filter(m=>/EN 10216-[34]:/.test(m.std))){
  assert.deepEqual(m.K.map(p=>p[0]),[20]); assert.match(m.note,/UNVERIFIED/);
  assert.ok(Number.isNaN(AD.h.atT(m.K,100)));
 }
 const x=get('X20CrMoV11-1','EN 10216-2','t ≤ 100');
 assert.ok(!x.K.some(p=>[100,150,600].includes(p[0])));
});
test('Rm thickness bands and stainless proof-strength selection',()=>{
 assert.equal(get('P355N','EN 10216-3','50 < t').Rm,490);
 assert.equal(get('P355N','EN 10216-3','65 < t').Rm,450);
 assert.equal(get('P460N','EN 10216-3','65 < t').Rm,490);
 assert.equal(get('1.4301','EN 10216-5','t ≤ 60').K[0][1],230); // Rp1,0, not Rp0,2=195
 assert.equal(get('1.4404','EN 10217-7','t ≤ 60').Rm,490);
});
console.log(`PASS ${passed}/${total}`);
if(passed!==total) process.exitCode=1;
