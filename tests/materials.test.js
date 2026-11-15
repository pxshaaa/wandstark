'use strict';
const assert = require('node:assert/strict');
const AD = require('../src/ad.js');
require('../data/materials.js');
const byId = id => AD.materials.find(m => m.id === id);
let passed = 0, total = 0;
function test(name, fn) {
  total++;
  try { fn(); passed++; }
  catch (error) { console.error(`FAIL: ${name}: ${error.message}`); }
}
function tableValid(table) {
  assert.ok(Array.isArray(table) && table.length > 0);
  table.forEach(([T, value], i) => {
    assert.ok(Number.isFinite(T) && Number.isFinite(value) && value > 0);
    assert.equal(table[i].length, 2);
    if (i) {
      assert.ok(T > table[i-1][0], 'Temperatur muss streng steigen');
      assert.ok(value <= table[i-1][1], 'Kennwert darf nicht steigen');
    }
  });
}
test('Alle elf ursprünglichen Werkstoffe vorhanden, eindeutige IDs', () => {
  const expected = ['P235GH','P265GH','P295GH','P355GH','16Mo3','13CrMo4-5','P355NL1','1.4301','1.4404','1.4541','1.4571'];
  for (const id of expected) assert.ok(byId(id), id);
  assert.equal(new Set(AD.materials.map(m => m.id)).size, AD.materials.length);
  assert.equal(AD.materials.length, 38);
});
test('Vertrag, Quellen, Sicherheitsbeiwert und Temperaturgrenzen', () => {
  for (const m of AD.materials) {
    for (const key of ['id','name','std','product','note']) assert.ok(typeof m[key] === 'string' && m[key].length > 0);
    assert.match(m.note, /https:\/\/|Normtext/);
    assert.match(m.note, /Tabelle|Tafel/);
    assert.equal(m.S, 1.5); // AD B0 §7, Tafel 2: Walzstahl.
    tableValid(m.K);
    assert.equal(m.K[0][0], 20);
    assert.equal(m.Tmax, m.K[m.K.length-1][0]);
    assert.ok(m.K.every(([, K]) => K >= 100 && K <= 600));
    if (m.E) {
      tableValid(m.E);
      assert.equal(m.Emax, m.E[m.E.length-1][0]);
    } else assert.equal(m.Emax, null);
  }
});
// Unabhängig aus EN 10028-2:2003 Tabellen 3/4 übertragen (URL in materials.js).
// Werte werden ausdrücklich nicht aus der Datenbank als Erwartung abgeleitet.
const ferriticSpots = [
  ['P235GH',235,182,133], ['P265GH',265,205,150],
  ['P295GH',295,228,167], ['P355GH',355,275,202],
  ['16Mo3',275,233,159], ['13CrMo4-5',300,252,186]
];
for (const [id, room, at200, at400] of ferriticSpots) test(`${id}: Tabellenwerte 20/200/400 °C`, () => {
  const m = byId(id);
  assert.equal(AD.h.atT(m.K,20), room);
  assert.equal(AD.h.atT(m.K,200), at200);
  assert.equal(AD.h.atT(m.K,400), at400);
});
test('Legierte Stähle: 450/500 °C', () => {
  assert.equal(AD.h.atT(byId('16Mo3').K,450),147);
  assert.equal(AD.h.atT(byId('16Mo3').K,500),141);
  assert.equal(AD.h.atT(byId('13CrMo4-5').K,450),175);
  assert.equal(AD.h.atT(byId('13CrMo4-5').K,500),164);
});
test('P355NL1: belegter Raumtemperaturwert, keine ungeprüfte Warmfestigkeit', () => {
  // ArcelorMittal H62, mechanische Eigenschaften, 5–16 mm.
  assert.deepEqual(byId('P355NL1').K, [[20,355]]);
  assert.ok(Number.isNaN(AD.h.atT(byId('P355NL1').K,50)));
  assert.match(byId('P355NL1').note, /Bestellvereinbarung/);
});
// EN 10028-7:2007 Tabellen 9 (P) und 13: Rp1,0, NICHT Rp0,2.
for (const [id, room, at100, at300, at500, at550] of [
  ['1.4301',250,191,135,120,120], ['1.4404',260,199,145,128,127],
  ['1.4541',240,208,167,149,147], ['1.4571',260,218,175,158,157]
]) test(`${id}: Rp1,0 bei 20/100/300/500/550 °C`, () => {
  const m = byId(id);
  [20,100,300,500,550].forEach((T,i) => assert.equal(AD.h.atT(m.K,T), [room,at100,at300,at500,at550][i]));
  assert.match(m.note, /K = Rp1,0/);
  assert.match(m.product, /75 mm/);
});
test('Lineare Zwischenwerte unabhängig von Tabellen-Helfer berechnet', () => {
  // Handrechnung zwischen 150 und 200 °C: 198 + (182−198)·25/50 = 190.
  const expectedFerritic = 198 + (182-198)*25/50;
  assert.equal(AD.h.atT(byId('P235GH').K,175), expectedFerritic);
  // Zwischen 100 und 150 °C: 199 + (181−199)·25/50 = 190.
  const expectedAustenitic = 199 + (181-199)*25/50;
  assert.equal(AD.h.atT(byId('1.4404').K,125), expectedAustenitic);
});
test('Außerhalb des oberen Tabellenbereichs: NaN für jeden Werkstoff', () => {
  for (const m of AD.materials) assert.ok(Number.isNaN(AD.h.atT(m.K,m.Tmax+1)));
  for (const id of ['P235GH','P265GH','P295GH','P355GH']) {
    assert.ok(Number.isNaN(AD.h.atT(byId(id).K,450)));
    assert.ok(Number.isNaN(AD.h.atT(byId(id).K,500)));
  }
});
test('Unter 20 °C: Kernvertrag hält den Raumtemperaturwert; keine Tieftemperaturfreigabe', () => {
  assert.equal(AD.h.atT(byId('P265GH').K,-10),265);
  assert.ok(Number.isNaN(AD.h.interp(byId('P265GH').K,19)));
});
test('E-Referenzen, Einheiten und Tabellenende', () => {
  tableValid(AD.Eferritic); tableValid(AD.Eaustenitic);
  // Lucefin P235GH / SEW310 bzw. Böhler 1.4301_05.20 S.11.
  assert.equal(AD.h.atT(AD.Eferritic,20),212000);
  assert.equal(AD.h.atT(AD.Eferritic,300),192000);
  assert.equal(AD.h.atT(AD.Eferritic,500),175000);
  assert.equal(AD.h.atT(AD.Eaustenitic,20),200000);
  assert.equal(AD.h.atT(AD.Eaustenitic,300),179000);
  assert.equal(AD.h.atT(AD.Eaustenitic,500),165000);
  assert.ok(Number.isNaN(AD.h.atT(AD.Eaustenitic,501)));
});
test('Fehlerfall: Validator erkennt steigende Festigkeit und doppelte Temperatur', () => {
  assert.throws(() => tableValid([[20,235],[100,250]]), assert.AssertionError);
  assert.throws(() => tableValid([[20,235],[20,214]]), assert.AssertionError);
  assert.throws(() => tableValid([[20,-1]]), assert.AssertionError);
});

const families = ['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
test('Schema aller geladenen Einträge: Familie, Typ, Rm, A und Aliasse', () => {
  for (const m of AD.materials) {
    assert.ok(families.includes(m.family), m.id);
    assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type), m.id);
    assert.ok(Number.isFinite(m.Rm) && m.Rm > m.K[0][1], m.id+' Rm > K20');
    assert.ok(Number.isFinite(m.A) && m.A > 0 && m.A <= 100, m.id+' A');
    assert.ok(Array.isArray(m.aliases) && m.aliases.length > 0, m.id);
    assert.ok(m.aliases.every(a => typeof a === 'string' && a.length > 0));
    assert.ok(Array.isArray(m.replaces));
    for (const old of m.replaces) assert.ok(m.aliases.includes(old));
  }
});
const entry = (grade,band='') => AD.materials.find(m => m.id.startsWith(grade+' | ') && m.product.includes(band));
// Independent transcriptions, not expectations computed from material data.
// EN 10028-2:2003, Tables 3 and 4:
// (Normtext, nicht verlinkt)
for (const [grade,band,T,expected] of [
  ['P235GH','16 < t',20,225], ['P235GH','40 < t',200,167],
  ['P265GH','16 < t',100,232], ['P265GH','40 < t',400,139],
  ['P295GH','16 < t',200,225], ['P295GH','40 < t',350,172],
  ['P355GH','16 < t',300,225], ['P355GH','40 < t',400,190],
  ['16Mo3','16 < t',500,139], ['16Mo3','40 < t',200,220],
  ['13CrMo4-5','16 < t',100,275], ['13CrMo4-5','40 < t',500,159],
  ['10CrMo9-10','',20,310], ['10CrMo9-10','',500,185],
  ['13CrMoSi5-5+QT','',20,390], ['13CrMoSi5-5+QT','',450,309],
  ['X10CrMoVNb9-1','',20,445], ['X10CrMoVNb9-1','',500,324]
]) test(`${grade} ${band}: Quelle ${T} °C = ${expected}`, () => {
  assert.equal(entry(grade,band).K.find(([t]) => t===T)?.[1],expected);
});
// EN 10028-3:2003, Tables 4/5, (Normtext, nicht verlinkt)
// EN 10028-7:2007, Tables 9/10/13/14, URL in the entry note.
for (const [grade,T,expected] of [
  ['P275NH',200,213], ['P355N',20,355], ['P355NH',400,202],
  ['P355NL2',20,355], ['P460NH',100,419],
  ['1.4307',20,240], ['1.4307',550,108], ['1.4306',100,181],
  ['1.4435',100,200], ['1.4435',200,165], ['1.4539',50,251],
  ['1.4539',550,135], ['1.4462',20,460], ['1.4462',200,315],
  ['1.4362',20,400], ['1.4362',250,265]
]) test(`${grade}: Quelle ${T} °C = ${expected}`, () => {
  assert.equal(entry(grade).K.find(([t]) => t===T)?.[1],expected);
});
// Salzgitter, table Mechanical properties, URL in P355ML1 note.
test('P355ML1: Salzgitter Raumtemperaturwerte', () => {
  const m=entry('P355ML1');
  assert.deepEqual(m.K,[[20,355]]); assert.equal(m.Rm,450); assert.equal(m.A,22);
});
test('Stainless: Form P Rm/A, keine Bandwerte', () => {
  for (const [grade,Rm,A] of [['1.4307',500,45],['1.4306',500,45],['1.4435',520,45],['1.4539',520,35],['1.4462',640,25],['1.4362',630,25]]) {
    assert.equal(entry(grade).Rm,Rm); assert.equal(entry(grade).A,A);
  }
  assert.equal(byId('1.4404').A,45);
  assert.equal(byId('1.4541').Rm,500);
});
test('Keine ungeprüften Warmwerte oder historische Rohrwerte', () => {
  for (const grade of ['P355N','P355NL2','P355ML1']) {
    assert.equal(entry(grade).Tmax,20);
    assert.ok(Number.isNaN(AD.h.atT(entry(grade).K,50)));
    assert.match(entry(grade).note,/UNVERIFIED/);
  }
  assert.equal(AD.materials.some(m => m.id.startsWith('11CrMo9-10')),false);
  assert.match(entry('13CrMoSi5-5+QT').product,/60 < t ≤ 100/);
});

console.log(`PASS ${passed}/${total}`);
if (passed !== total) process.exitCode = 1;
