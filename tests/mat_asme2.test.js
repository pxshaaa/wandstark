'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AD = require('../src/ad.js');
require('../data/materials.js');
// Include every material extension, including files added after this test.
const dataDir = path.join(__dirname,'../data');
for (const file of fs.readdirSync(dataDir).filter(f => /^mat_.*\.js$/.test(f) && f !== 'mat_asme2.js').sort()) {
  require(path.join(dataDir,file));
}
const before = JSON.stringify(AD.materials);
const count = AD.materials.length;
require('../data/mat_asme2.js');
const added = AD.materials.slice(count);
let passed = 0, total = 0;
function test(name,fn) {
  total++;
  try { fn(); passed++; }
  catch (e) { console.error('FAIL '+name+': '+e.message); }
}
const families = new Set(['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss',
  'EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME']);
const types = new Set(['ferritic','austenitic','duplex','cast','nickel','other']);
function checkTable(table,monotone=true) {
  assert.ok(Array.isArray(table) && table.length > 0);
  for (let i=0;i<table.length;i++) {
    const p = table[i];
    assert.ok(Array.isArray(p) && p.length === 2);
    assert.ok(p.every(Number.isFinite) && p[1] > 0);
    if (i) {
      assert.ok(p[0] > table[i-1][0],'ascending temperature');
      if (monotone) assert.ok(p[1] <= table[i-1][1],'nonincreasing strength/stress');
    }
  }
}
const normalized = s => s.toUpperCase().replace(/\s*\(BPVC 2021\)/g,'').replace(/[\s–-]/g,'');
const gradeKey = m => [m.name,m.std,m.product].map(normalized).join('|');
test('append only; 19 new ASME grades',() => {
  assert.equal(JSON.stringify(AD.materials.slice(0,count)),before);
  assert.equal(added.length,19);
  assert.ok(added.every(m => m.family === 'ASME'));
});
test('unique IDs and grade/standard/band across the entire database',() => {
  assert.equal(new Set(AD.materials.map(m => m.id)).size,AD.materials.length);
  const prior = new Set(AD.materials.slice(0,count).map(gradeKey));
  for (const m of added) {
    assert.ok(!prior.has(gradeKey(m)),'duplicate grade/standard/band: '+m.id);
    prior.add(gradeKey(m));
  }
});
for (const m of AD.materials) test('database schema and plausibility: '+m.id,() => {
  for (const key of ['id','name','std','product']) assert.ok(typeof m[key] === 'string' && m[key].length,key);
  assert.ok(families.has(m.family),'family');
  assert.ok(types.has(m.type),'type');
  checkTable(m.K);
  assert.equal(m.K[0][0],20);
  assert.ok(Number.isFinite(m.Rm) && m.Rm > m.K[0][1],'Rm > K20');
  assert.ok(Number.isFinite(m.S) && m.S > 0,'positive safety factor');
  if (m.asmeS) checkTable(m.asmeS);
});
for (const m of added) test('ASME source and table boundaries: '+m.name,() => {
  assert.equal(m.id,m.name+' | '+m.std.replace(' (BPVC 2021)','')+' | '+m.product);
  assert.match(m.asmeEdition,/2021.*Metric/);
  assert.match(m.note,/QUELLE:.*Tabelle (1A|3), S\..*Z\./);
  assert.match(m.note,/Tabelle Y-1, S\..*Z\./);
  assert.match(m.note,/https:\/\/|Normtext/);
  assert.equal(m.asmeS[0][0],20);
  assert.equal(m.S,1.5);
  assert.equal(m.Tmax,400);
  assert.equal(m.K.at(-1)[0],m.Tmax);
  assert.equal(m.asmeS.at(-1)[0],m.Tmax);
  assert.ok(m.aliases.length >= 1);
  assert.ok(Number.isNaN(AD.h.atT(m.K,401)),'no yield extrapolation');
  assert.ok(Number.isNaN(AD.h.atT(m.asmeS,401)),'no allowable extrapolation');
});
const byName = name => {
  const m = added.find(m => m.name === name);
  assert.ok(m,'missing '+name);
  return m;
};
// Independent source spots, MPa. ASME BPVC.II.D.M-2021 (Metric):
// (Normtext, nicht verlinkt))%202021.pdf
// Locators below are PRINTED pages / line numbers, not PDF page indices.
// Each fixture is [grade, field, temperature (null for scalar), source value, locator].
const spots = [
  ['SA-516 Gr 55','Rm',null,380,'Y-1 p777 L41'],
  ['SA-516 Gr 55','K',20,205,'Y-1 p777 L41 minimum yield'],
  ['SA-516 Gr 55','K',400,143,'Y-1 p779 L41'],
  ['SA-516 Gr 55','asmeS',400,89.1,'1A p14 L8'],
  ['SA-182 F5','K',200,237,'Y-1 p838 L43'],
  ['SA-182 F5','asmeS',400,121,'1A p50 L8'],
  ['SA-182 F9','Rm',null,585,'Y-1 p843 L13'],
  ['SA-182 F9','K',400,301,'Y-1 p845 L13'],
  ['SA-182 F9','asmeS',100,166,'1A p50 L22'],
  ['SA-182 F12 Cl2','K',300,212,'Y-1 p827 L29'],
  ['SA-182 F12 Cl2','asmeS',100,135,'1A p42 L10'],
  ['SA-182 F321','K',200,160,'Y-1 p928 L1'],
  ['SA-182 F321','asmeS',300,94.5,'1A p114 L24'],
  ['SA-182 F347','K',200,166,'Y-1 p916 L21'],
  ['SA-182 F347','asmeS',400,94.4,'1A p106 L2'],
  ['SA-335 P1','K',100,193,'Y-1 p814 L40'],
  ['SA-335 P1','asmeS',400,106,'1A p34 L17'],
  ['SA-335 P5','K',200,178,'Y-1 p838 L38'],
  ['SA-335 P5','asmeS',300,112,'1A p50 L3'],
  ['SA-335 P9','K',400,165,'Y-1 p845 L11'],
  ['SA-335 P9','asmeS',400,104,'1A p50 L20'],
  ['SA-335 P12','K',20,220,'Y-1 p825 L10 minimum yield'],
  ['SA-335 P12','K',100,198,'Y-1 p826 L10'],
  ['SA-335 P12','asmeS',100,116,'1A p38 L36'],
  ['SA-312 TP321','K',300,142,'Y-1 p929 L6'],
  ['SA-312 TP321','asmeS',200,106,'1A p114 L37'],
  ['SA-312 TP347','K',100,189,'Y-1 p916 L26'],
  ['SA-312 TP347','asmeS',300,99.8,'1A p106 L12'],
  ['SA-387 Gr 12 Cl 2','Rm',null,450,'Y-1 p825 L23'],
  ['SA-387 Gr 12 Cl 2','K',400,201,'Y-1 p827 L23'],
  ['SA-387 Gr 12 Cl 2','asmeS',100,125,'1A p42 L4'],
  ['SA-387 Gr 91 Cl 2','K',100,384,'Y-1 p844 L21'],
  ['SA-387 Gr 91 Cl 2','asmeS',400,153,'1A p50 L31'],
  ['SA-240 Type 316Ti','K',200,149,'Y-1 p898 L17'],
  ['SA-240 Type 316Ti','asmeS',200,99.3,'1A p86 L26'],
  ['SA-193 B7','K',20,725,'Y-1 p819 L44 minimum yield'],
  ['SA-193 B7','K',100,671,'Y-1 p820 L44'],
  ['SA-193 B7','asmeS',400,162,'3 p412 L32'],
  ['SA-193 B8 Cl1','K',100,169,'Y-1 p904 L14 (not F304)'],
  ['SA-193 B8 Cl1','asmeS',20,130,'3 p420 L4, <=40 C'],
  ['SA-193 B8 Cl1','asmeS',300,84.5,'3 p420 L4'],
  ['SA-193 B16','K',100,696,'Y-1 p826 L35'],
  ['SA-193 B16','K',400,592,'Y-1 p827 L35'],
  ['SA-193 B16','asmeS',400,172,'3 p416 L1'],
  ['SA-320 L7','Rm',null,860,'Y-1 p819 L45'],
  ['SA-320 L7','K',300,595,'Y-1 p821 L45'],
  ['SA-320 L7','asmeS',400,162,'3 p412 L33']
];
for (const [name,field,T,want,locator] of spots) test('source spot: '+name+' '+field+' '+T+' ('+locator+')',() => {
  const m = byName(name);
  const got = T === null ? m[field] : m[field].find(p => p[0] === T)?.[1];
  assert.equal(got,want);
});
test('bolting uses Table 3 and explicit source note',() => {
  const bolts = added.filter(m => m.product.startsWith('Schrauben'));
  assert.equal(bolts.length,4);
  for (const m of bolts) assert.match(m.note,/Tabelle 3.*Table 3 bolting stresses apply/);
  assert.notEqual(byName('SA-193 B8 Cl1').K[1][1],170,'do not substitute F304 curve');
});
test('requested product/size restrictions retained',() => {
  assert.match(byName('SA-182 F321').product,/130/);
  assert.match(byName('SA-182 F347').product,/130/);
  assert.match(byName('SA-312 TP321').product,/9,5/);
  assert.match(byName('SA-387 Gr 91 Cl 2').product,/Type 1.*75/);
  assert.match(byName('SA-193 B7').product,/64/);
  assert.match(byName('SA-193 B16').product,/64/);
  assert.match(byName('SA-320 L7').product,/65/);
});
console.log('PASS '+passed+'/'+total);
if (passed !== total) process.exitCode = 1;
