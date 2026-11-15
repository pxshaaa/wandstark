'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const AD = require('../src/ad.js');
require('../data/materials.js');
const baseline = JSON.stringify(AD.materials);
const baselineCount = AD.materials.length;
require('../data/mat_asme.js');
const added = AD.materials.slice(baselineCount);
const byName = name => {
  const m = added.find(m => m.name === name);
  assert.ok(m, 'Missing '+name);
  return m;
};
let passed = 0, total = 0;
function test(name, fn) {
  total++;
  try { fn(); passed++; }
  catch (error) { console.error('FAIL '+name+': '+error.message); }
}
const families = new Set(['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss',
  'EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME']);
const types = new Set(['ferritic','austenitic','duplex','cast','nickel','other']);
function checkTable(tbl) {
  assert.ok(Array.isArray(tbl) && tbl.length > 0);
  tbl.forEach((point,i) => {
    assert.equal(point.length,2);
    assert.ok(Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[1] > 0);
    if (i) {
      assert.ok(point[0] > tbl[i-1][0], 'Temperatures must increase');
      assert.ok(point[1] <= tbl[i-1][1], 'Strength/stress must not increase');
    }
  });
}
test('append-only and unique ids across ALL loaded entries', () => {
  assert.equal(JSON.stringify(AD.materials.slice(0,baselineCount)),baseline);
  assert.equal(added.length,45);
  assert.equal(new Set(AD.materials.map(m => m.id)).size,AD.materials.length);
  for (const m of AD.materials) {
    assert.ok(typeof m.id === 'string' && m.id.length > 0);
    checkTable(m.K);
    assert.equal(m.K[0][0],20);
    // materials.js predates SCHEMA.md: its original entries lack family/Rm.
    // Validate any supplied legacy fields; require every field on new entries below.
    if (m.family !== undefined) assert.ok(families.has(m.family));
    if (m.Rm !== undefined) assert.ok(m.Rm > m.K[0][1]);
  }
});
for (const m of added) test(m.name+' schema and plausibility', () => {
  for (const key of ['id','name','std','product','note','asmeEdition']) {
    assert.ok(typeof m[key] === 'string' && m[key].length > 0,key);
  }
  assert.equal(m.id,m.name+' | '+m.std.replace(' (BPVC 2021)','')+' | '+m.product);
  assert.ok(families.has(m.family));
  assert.equal(m.family,'ASME');
  assert.ok(types.has(m.type));
  assert.ok(Number.isFinite(m.Rm) && m.Rm > m.K[0][1]);
  assert.ok(Number.isFinite(m.S) && m.S > 1);
  assert.equal(m.S,m.type === 'cast' ? 2 : 1.5);
  checkTable(m.K);
  checkTable(m.asmeS);
  assert.equal(m.K[0][0],20);
  assert.equal(m.asmeS[0][0],20);
  assert.equal(m.Tmax,Math.max(m.K.at(-1)[0],m.asmeS.at(-1)[0]));
  assert.ok(m.asmeS.every(([,S]) => S < m.Rm));
  assert.match(m.asmeEdition,/2021.*Metric/);
  assert.match(m.note,/Tabelle 1A.*Z\./);
  assert.match(m.note,/Tabelle Y-1.*Z\./);
  assert.match(m.note,/https:\/\/|Normtext/);
  assert.ok(Array.isArray(m.aliases));
  assert.ok(m.aliases.some(a => /^[KSJ]\d{5}$/.test(a)), 'UNS alias');
  assert.ok(m.aliases.some(a => /^P-No\. (1|4|5A|8|10C|10H|15E)$/.test(a)), 'P-No. alias');
  assert.ok(Number.isNaN(AD.h.atT(m.K,m.K.at(-1)[0]+1)), 'No yield extrapolation');
  assert.ok(Number.isNaN(AD.h.atT(m.asmeS,m.asmeS.at(-1)[0]+1)), 'No stress extrapolation');
});

// Independent source transcription, NOT computed from the database or safety factor.
// ASME BPVC.II.D.M-2021 (metric), Tables 1A / Y-1, exact source row per entry:
// (Normtext, nicht verlinkt))%202021.pdf
// Minimum tensile and minimum room-temperature yield columns (MPa).
const roomSpots = [
  ['SA-516 Gr 60',415,220],['SA-516 Gr 65',450,240],['SA-516 Gr 70',485,260],
  ['SA-515 Gr 60',415,220],['SA-515 Gr 70',485,260],['SA-285 Gr C',380,205],
  ['SA-537 Cl 1',485,345],['SA-612',560,345],['SA-106 Gr B',415,240],
  ['SA-106 Gr C',485,275],['SA-53 Gr B (seamless)',415,240],
  ['SA-333 Gr 6',415,240],['SA-334 Gr 6',415,240],['SA-105',485,250],
  ['SA-350 LF2 Cl1',485,250],['SA-181 Cl70',485,250],['SA-216 WCB',485,250],
  ['SA-182 F11 Cl2',485,275],['SA-182 F22 Cl3',515,310],['SA-182 F91',620,415],
  ['SA-213 T11',415,205],['SA-213 T22',415,205],['SA-213 T91',585,415],
  ['SA-335 P11',415,205],['SA-335 P22',415,205],['SA-335 P91',585,415],
  ['SA-387 Gr 11 Cl 2',515,310],['SA-387 Gr 22 Cl 2',515,310],
  ['SA-182 F304',515,205],['SA-182 F304L',485,170],
  ['SA-182 F316',515,205],['SA-182 F316L',485,170],
  ['SA-240 Type 304',515,205],['SA-240 Type 304L',485,170],
  ['SA-240 Type 316',515,205],['SA-240 Type 316L',485,170],
  ['SA-240 Type 321',515,205],['SA-240 Type 347',515,205],
  ['SA-240 Type 2205 (S31803)',620,450],
  ['SA-312 TP304',515,205],['SA-312 TP304L',485,170],
  ['SA-312 TP316',515,205],['SA-312 TP316L',485,170],
  ['SA-351 CF8',485,205],['SA-351 CF8M',485,205]
];
for (const [name,rm,sy] of roomSpots) test(name+' source minima', () => {
  const m = byName(name);
  assert.equal(m.Rm,rm);
  assert.equal(m.K[0][1],sy);
});
// Temperature-column spot checks cover all product groups, alternate rows,
// stainless 0.2% yield, and the duplex grade-specific limit.
const spots = [
  ['SA-516 Gr 60','K',200,189], ['SA-516 Gr 60','asmeS',400,88.9],
  ['SA-516 Gr 65','K',400,167], ['SA-516 Gr 65','asmeS',300,125],
  ['SA-516 Gr 70','K',100,239], ['SA-516 Gr 70','asmeS',300,136],
  ['SA-515 Gr 60','asmeS',300,115], ['SA-515 Gr 60','K',200,189], ['SA-515 Gr 70','K',200,225],
  ['SA-285 Gr C','K',200,177], ['SA-285 Gr C','asmeS',200,108],
  ['SA-537 Cl 1','K',300,235], ['SA-537 Cl 1','asmeS',200,134],
  ['SA-612','K',100,300], ['SA-612','asmeS',300,155],
  ['SA-106 Gr B','asmeS',300,118], ['SA-106 Gr C','K',400,191],
  ['SA-53 Gr B (seamless)','asmeS',400,88.9], ['SA-333 Gr 6','K',200,207],
  ['SA-334 Gr 6','asmeS',300,118], ['SA-105','asmeS',300,129],
  ['SA-350 LF2 Cl1','K',400,171], ['SA-181 Cl70','asmeS',400,101],
  ['SA-216 WCB','K',300,194], ['SA-182 F11 Cl2','K',400,204],
  ['SA-182 F11 Cl2','asmeS',400,136], ['SA-213 T11','K',100,190],
  ['SA-335 P11','asmeS',200,116], ['SA-213 T22','K',400,185],
  ['SA-335 P22','asmeS',400,114], ['SA-182 F22 Cl3','K',300,253],
  ['SA-387 Gr 11 Cl 2','K',200,262], ['SA-387 Gr 22 Cl 2','asmeS',100,147],
  ['SA-182 F91','asmeS',300,175], ['SA-213 T91','K',200,377],
  ['SA-335 P91','asmeS',400,153], ['SA-182 F304','asmeS',100,113],
  ['SA-240 Type 304','K',100,170], ['SA-240 Type 304','asmeS',200,95.7],
  ['SA-182 F304L','K',100,146], ['SA-240 Type 304L','asmeS',400,67.6],
  ['SA-182 F316','K',300,132], ['SA-240 Type 316','asmeS',200,99.2],
  ['SA-182 F316L','K',100,145], ['SA-240 Type 316L','asmeS',400,67.5],
  ['SA-312 TP304','asmeS',300,85.9], ['SA-312 TP304L','K',300,108],
  ['SA-312 TP316','asmeS',300,88.1], ['SA-312 TP316L','K',300,109],
  ['SA-351 CF8','asmeS',300,85.6], ['SA-351 CF8M','K',300,131],
  ['SA-240 Type 321','K',400,132], ['SA-240 Type 321','asmeS',300,94.5],
  ['SA-240 Type 347','K',200,166], ['SA-240 Type 347','asmeS',400,94.4],
  ['SA-240 Type 2205 (S31803)','K',200,354],
  ['SA-240 Type 2205 (S31803)','asmeS',300,160]
];
for (const [name,key,T,value] of spots) test(name+' '+key+' at '+T+' °C', () => {
  // Require the actual sourced point, rather than passing through interpolation.
  assert.deepEqual(byName(name)[key].find(p => p[0] === T),[T,value]);
});
test('documented missing data and applicability', () => {
  for (const m of added.filter(m => m.type === 'austenitic' || /^SA-351/.test(m.name))) {
    assert.match(m.note,/Rp0,2/);
    assert.match(m.note,/UNVERIFIED: Rp1,0/);
    assert.equal(m.A,undefined);
  }
  assert.equal(byName('SA-334 Gr 6').Tmax,300);
  assert.equal(byName('SA-612').Tmax,300);
  assert.equal(byName('SA-240 Type 2205 (S31803)').Tmax,300);
  for (const name of ['SA-193 B7','SA-193 B8 Cl1','SA-194 Gr 2H','SA-320 L7']) {
    assert.ok(!added.some(m => m.name === name), 'No fabricated Table 1A bolting entry');
  }
});
test('browser IIFE appends to an existing registry', () => {
  const sentinel = {id:'sentinel'};
  const context = {AD:{materials:[sentinel]}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../data/mat_asme.js'),'utf8'),context);
  assert.equal(context.AD.materials[0],sentinel);
  assert.equal(context.AD.materials.length,added.length+1);
  assert.equal(JSON.stringify(context.AD.materials.slice(1)),JSON.stringify(added));
});
console.log('PASS '+passed+'/'+total);
if (passed !== total) process.exitCode = 1;
