'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('../src/ad.js');
require('../data/materials.js');
// Every supplement, including future additions, participates in uniqueness checks.
const data=path.join(__dirname,'../data');
const own='mat_din_old3.js';
for(const file of fs.readdirSync(data).filter(f=>/^mat_.*\.js$/.test(f)&&f!==own).sort()) require(path.join(data,file));
const before=AD.materials.slice();
require('../data/'+own);
const added=AD.materials.slice(before.length);
let passed=0,total=0;
function check(label,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+label+': '+e.message);}}
const families=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
check('append only, ten grades',()=>{assert.equal(added.length,10);before.forEach((m,i)=>assert.equal(AD.materials[i],m));});
check('unique ids in entire database',()=>assert.equal(new Set(AD.materials.map(m=>m.id)).size,AD.materials.length));
// Also detect spelling/edition aliases that could disguise the same grade/band.
const norm=s=>s.replace(/[^a-z0-9]/gi,'').toLowerCase();
check('no duplicate grade/standard/product bands',()=>{
  const keys=AD.materials.map(m=>norm(m.aliases?.find(a=>/^1\.\d{4}$/.test(a))||m.name.split(' (')[0])+'|'+m.std.replace(/:\d{4}.*/, '').replace(/\s/g,'')+'|'+norm(m.product));
  assert.equal(new Set(keys).size,keys.length);
});
for(const m of AD.materials) check(m.id+' schema and plausibility',()=>{
  for(const key of ['id','name','std','product','note']) assert.ok(typeof m[key]==='string'&&m[key].length,key);
  assert.ok(families.includes(m.family));
  assert.ok(['ferritic','austenitic','duplex','cast','nickel','other'].includes(m.type));
  assert.ok(Array.isArray(m.K)&&m.K.length);
  assert.equal(m.K[0][0],20);
  for(let i=0;i<m.K.length;i++){
    const p=m.K[i];assert.equal(p.length,2);
    assert.ok(p.every(v=>Number.isFinite(v)&&v>0));
    if(i){assert.ok(p[0]>m.K[i-1][0]);assert.ok(p[1]<=m.K[i-1][1]);}
  }
  assert.ok(Number.isFinite(m.Rm)&&m.Rm>m.K[0][1]);
  assert.ok(Number.isFinite(m.S)&&m.S>0);
  assert.equal(m.Tmax,m.K.at(-1)[0]);
  for(const key of ['E','RmT','asmeS']) if(m[key]) m[key].forEach((p,i)=>{
    assert.ok(p.every(v=>Number.isFinite(v)&&v>0));
    if(i)assert.ok(p[0]>m[key][i-1][0]);
  });
});
for(const m of added) check(m.id+' metadata and source',()=>{
  assert.equal(m.family,'DIN (alt)');assert.equal(m.id.split(' | ').length,3);
  assert.ok(m.replacedBy&&typeof m.replacedBy==='string');
  assert.ok(m.aliases.length&&m.aliases.every(a=>typeof a==='string'&&a.length));
  assert.match(m.note,/SOURCE:/);assert.match(m.note,/Tabelle/);assert.match(m.note,/https:\/\/|Normtext/);
});
function material(grade){const rows=added.filter(m=>m.id.startsWith(grade+' | '));assert.equal(rows.length,1,grade);return rows[0];}
// Independent source fixtures. DIN 17155 reproduced table "Propiedades mecánicas",
// PDF p.1, first ReH band / first Rm band, footnote 3 excludes t<10 for 15Mo3:
// https://de.cdn-website.com/2996e3ef68364a6ba843313781d9149f/files/uploaded/1057267-13CrMo44_chapa.pdf
for(const [grade,k,rm] of [
  ['17Mn4',290,460],['19Mn6',355,510],['15Mo3',275,440],
  ['13CrMo44',300,440],['10CrMo910',310,480]
]){
  check('source K20 '+grade,()=>assert.equal(material(grade).K[0][1],k));
  check('source Rm '+grade,()=>assert.equal(material(grade).Rm,rm));
  check('no unverified warm plate data '+grade,()=>{
    const m=material(grade);assert.equal(m.K.length,1);
    assert.ok(Number.isNaN(AD.h.atT(m.K,100)));assert.match(m.note,/Temperaturwerte UNVERIFIED/);
  });
}
// Klöckner Konstruktionshandbuch pp.263/264 tables 2/3, DIN 17175.
// (Normtext, nicht verlinkt)
// NEUMIRA PDF pp.58/59 DIN 17440 tables 5/6: RIGHT-HAND Rp1.0 block.
// https://www.neumira-engineering.com/catalogues/DIN-FLANSCHEN.pdf
// ZOLLERN table Warmfester Stahlguss, GS C25 row:
// https://www.zollern.com/fileadmin/data/ZGF_ZGM_Gussteile/files/de/ZOLLERN-Broschuere_ZGF_Stahl-Legierungen_D.pdf
const spots=[
  ['14MoV63',20,320],['14MoV63',200,270],['14MoV63',250,255],
  ['14MoV63',300,230],['14MoV63',400,200],['14MoV63',500,170],
  ['X3CrNiMo17 13 3',20,240],['X3CrNiMo17 13 3',100,211],
  ['X3CrNiMo17 13 3',200,177],['X3CrNiMo17 13 3',550,137],
  ['X2CrNiMo18 14 3',20,225],['X2CrNiMo18 14 3',50,217],
  ['X2CrNiMo18 14 3',300,145],['X2CrNiMo18 14 3',550,127],
  ['X6CrNiNb18 10',20,240],['X6CrNiNb18 10',50,226],
  ['X6CrNiNb18 10',150,196],['X6CrNiNb18 10',200,186],
  ['X6CrNiNb18 10',400,156],['X6CrNiNb18 10',550,147],['GS-C 25',20,245]
];
for(const [grade,t,k] of spots)check('source K '+grade+' @ '+t,()=>assert.equal(material(grade).K.find(p=>p[0]===t)?.[1],k));
for(const [grade,rm] of [['14MoV63',460],['X3CrNiMo17 13 3',510],['X2CrNiMo18 14 3',490],['X6CrNiNb18 10',510],['GS-C 25',440]])
  check('source Rm '+grade,()=>assert.equal(material(grade).Rm,rm));
check('tube and plate bands preserve source limitations',()=>{
  assert.match(material('15Mo3').product,/10 ≤ t ≤ 16/);
  assert.match(material('14MoV63').product,/D > 30/);
  assert.equal(material('14MoV63').Tmax,500);
  assert.ok(Number.isNaN(AD.h.atT(material('14MoV63').K,550)));
});
check('older X5 spelling is an alias of the sourced X3 row',()=>{
  assert.ok(material('X3CrNiMo17 13 3').aliases.includes('X5CrNiMo17 13 3'));
  assert.match(material('X3CrNiMo17 13 3').note,/früherer X5-Normausgaben UNVERIFIED/);
});
check('cast safety factor and room-only scope',()=>{
  const m=material('GS-C 25');assert.equal(m.type,'cast');assert.equal(m.S,2);
  assert.equal(m.K.length,1);assert.match(m.product,/Feinguss/);
  assert.ok(Number.isNaN(AD.h.atT(m.K,200)));
});
check('unsupported castings omitted',()=>{
  for(const g of ['GS-16 Mo 5','GS-22 Mo 4','GS-17 CrMo 5 5','GS-18 CrMo 9 10'])
    assert.ok(!added.some(m=>m.id.startsWith(g+' | ')));
});
console.log('PASS '+passed+'/'+total);
if(passed!==total)process.exitCode=1;
