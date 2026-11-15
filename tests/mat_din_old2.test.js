'use strict';
const assert=require('node:assert/strict');
require('../src/ad.js');
require('../data/materials.js');
// Load the earlier DIN supplement as well: repeated grade names must not collide.
require('../data/mat_din_old.js');
const before=AD.materials.slice();
require('../data/mat_din_old2.js');
const entries=AD.materials.slice(before.length);
let passed=0,total=0;
function check(label,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+label+': '+e.message);}}
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
check('append only, twelve sourced grades',()=>{
  assert.equal(entries.length,12);
  before.forEach((m,i)=>assert.equal(AD.materials[i],m));
});
check('unique ids across ALL loaded entries',()=>assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length));
for(const m of AD.materials) check(m.id+' schema/table/plausibility',()=>{
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string'&&m[key].length,key);
  assert.ok(families.includes(m.family));
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type));
  assert.ok(Array.isArray(m.K)&&m.K.length);
  assert.equal(m.K[0][0],20);
  m.K.forEach((point,i)=>{
    assert.equal(point.length,2);
    const [t,k]=point;
    assert.ok(Number.isFinite(t)&&t>0);
    assert.ok(Number.isFinite(k)&&k>0);
    if(i){assert.ok(t>m.K[i-1][0]);assert.ok(k<=m.K[i-1][1]);}
  });
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
});
for(const m of entries) check(m.id+' DIN metadata/source',()=>{
  assert.equal(m.family,'DIN (alt)');
  assert.equal(m.id.split(' | ').length,3);
  assert.ok(typeof m.replacedBy==='string'&&m.replacedBy.length);
  assert.ok(Array.isArray(m.aliases)&&m.aliases.length);
  assert.ok(m.aliases.every(a=>typeof a==='string'&&a.length));
  assert.ok(m.aliases.some(a=>/^1\.\d{4}$/.test(a)));
  assert.match(m.note,/SOURCE:/);
  assert.match(m.note,/Tabelle/);
  assert.match(m.note,/https:\/\/|Normtext/);
});
function material(grade){const found=entries.filter(m=>m.id.startsWith(grade+' | '));assert.equal(found.length,1,grade);return found[0];}
// Independent fixtures transcribed from the manufacturer's reproduced DIN tables.
// NEUMIRA DIN-FLANSCHEN, PDF pp.58/59, DIN 17440 tables 5/6:
// https://www.neumira-engineering.com/catalogues/DIN-FLANSCHEN.pdf
// Table 6 has two parallel blocks: fixtures below refer ONLY to RIGHT Rp1.0.
const spots=[
  ['X5CrNi18 10',20,230],['X5CrNi18 10',50,211],['X5CrNi18 10',200,157],['X5CrNi18 10',550,120],
  ['X2CrNi19 11',20,215],['X2CrNi19 11',100,181],['X2CrNi19 11',200,147],['X2CrNi19 11',550,108],
  ['X6CrNiTi18 10',20,235],['X6CrNiTi18 10',50,222],['X6CrNiTi18 10',200,185],['X6CrNiTi18 10',550,147],
  ['X5CrNiMo17 12 2',20,240],['X5CrNiMo17 12 2',200,177],['X5CrNiMo17 12 2',400,144],['X5CrNiMo17 12 2',550,137],
  ['X2CrNiMo17 12 2',20,225],['X2CrNiMo17 12 2',200,167],['X2CrNiMo17 12 2',400,135],['X2CrNiMo17 12 2',550,127],
  ['X6CrNiMoTi17 12 2',20,245],['X6CrNiMoTi17 12 2',200,196],['X6CrNiMoTi17 12 2',400,164],['X6CrNiMoTi17 12 2',550,157],
  // DIN 17243:1987 tables 3/4 (equivalent diameter, not vessel-wall thickness):
  // (Normtext, nicht verlinkt)
  // (Normtext, nicht verlinkt)
  ['C 22.8',20,250],['C 22.8',100,237],['C 22.8',300,150],['C 22.8',450,90],
  ['17 Mn 4',20,250],['17 Mn 4',200,180],['17 Mn 4',350,135],
  ['15 Mo 3',20,275],['15 Mo 3',200,200],['15 Mo 3',500,135],
  ['13 CrMo 4 4',20,295],['13 CrMo 4 4',200,240],['13 CrMo 4 4',500,175],
  // Podbrezova handbook 2012 DIN 17155 rows; IGV-PP-17B Rev.0 annex
  // https://industriegaseverband.de/download-file/IGV-PP-17B-Rev0_Schutz%20vor%20Brandlasten_23.09.2022.pdf
  ['H I',20,235],['H II',20,265]
];
for(const [grade,t,k] of spots) check('source K '+grade+' @ '+t,()=>assert.equal(material(grade).K.find(p=>p[0]===t)?.[1],k));
for(const [grade,rm] of [
  ['X5CrNi18 10',500],['X2CrNi19 11',460],['X6CrNiTi18 10',500],
  ['X5CrNiMo17 12 2',510],['X2CrNiMo17 12 2',490],['X6CrNiMoTi17 12 2',500],
  ['C 22.8',410],['17 Mn 4',460],['15 Mo 3',440],['13 CrMo 4 4',440],['H I',360],['H II',410]
]) check('source Rm '+grade,()=>assert.equal(material(grade).Rm,rm));
check('room-only plates cannot interpolate warm values',()=>{
  for(const grade of ['H I','H II']){
    const m=material(grade);assert.equal(m.K.length,1);assert.equal(m.Tmax,20);
    assert.ok(Number.isNaN(AD.h.atT(m.K,100)));assert.match(m.note,/Erhöhte Temperaturwerte UNVERIFIED/);
  }
});
check('aliases preserve old spelling variants',()=>{
  assert.ok(material('X5CrNi18 10').aliases.includes('X5CrNi18 9'));
  assert.ok(material('X2CrNi19 11').aliases.includes('X2CrNi18 9'));
  assert.ok(material('X2CrNiMo17 12 2').aliases.includes('X2CrNiMo17 13 2'));
});
check('do not extrapolate ambiguous forging rows',()=>{
  assert.match(material('15 Mo 3').product,/90 < Vergleichsdurchmesser ≤ 150/);
  assert.equal(material('17 Mn 4').Tmax,450); // 400/450 °C ergänzt (Review 13.11.2026)
  assert.equal(AD.h.atT(material('17 Mn 4').K,400),130);assert.ok(Number.isNaN(AD.h.atT(material('17 Mn 4').K,460)));
});
console.log('PASS '+passed+'/'+total);
if(passed!==total)process.exitCode=1;
