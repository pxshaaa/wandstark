'use strict';
const assert=require('assert');
const fs=require('fs');
require('../src/ad.js');
require('../data/materials.js');
if(fs.existsSync(require('path').join(__dirname,'../data/profiles.js')))require('../data/profiles.js');
require('../modules/b9.js');
require('../modules/b9k.js');
require('../modules/b9-tips.js');
const AD=globalThis.AD;
let passed=0,total=0;
function check(fn){total++;fn();passed++;}
for(const id of ['b9','b9k']){
 const m=AD.modules.find(m=>m.id===id);
 const base=Object.assign({p:10,K:150,K20:235,S:1.5,v:1,c1:0,c2:1},Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])));
 const fields=new Set(m.fields.map(f=>f.id));
 for(const f of m.fields.filter(f=>f.type!=='heading'))check(()=>assert(f.tip&&f.tip.length<=220,`${id}.${f.id}: missing/long tip`));
 check(()=>assert.strictEqual(m.tips.length,3));
 for(const tip of m.tips)check(()=>assert(tip.length<=220,`${id}: long module tip`));
 for(const field of ['sn','ss'])check(()=>assert(m.fields.find(f=>f.id===field).tip.includes('mindestens 2 mm')));
 const symbols=new Set(m.fields.flatMap(f=>[f.id,f.sym]));
 for(const tip of [...m.fields.map(f=>f.tip).filter(Boolean),...m.tips]){
  check(()=>assert(!/laut Zeichnung|z\. B\.|im zukünftigen Zustand/.test(tip),tip));
  for(const token of tip.match(/\b[A-Z]{2,}[A-Za-z0-9_]*\b|\b[a-z]_[a-z0-9]+\b/g)||[])check(()=>assert(AD.glossary[token]||symbols.has(token),`${id}: ${token}`));
 }
 const cases=id==='b9'?[base,{...base,mount:'in',hp:6,bp:35}]:[base,{...base,shape:'kl'},{...base,shape:'kor',x:10}];
 for(const g of cases){
  const svg=m.draw(g,AD.h,m.calc(g,AD.h));const tags=[...svg.matchAll(/data-p="([^"]+)"/g)];
  check(()=>assert(tags.length>0));
  for(const tag of tags)for(const field of tag[1].split(/\s+/))check(()=>assert(fields.has(field),`${id}: unknown tag ${field}`));
  const tagged=new Set(tags.flatMap(t=>t[1].split(/\s+/)));
  for(const f of m.fields.filter(f=>f.type!=='heading'&&(!f.when||Object.entries(f.when).every(([k,v])=>(Array.isArray(v)?v:[v]).includes(g[k]))))){
   if(['Ks','Ss'].includes(f.id))continue; // material properties have no geometric tag
   if(id==='b9'&&['hp','bp'].includes(f.id)&&!(g.hp&&g.bp))continue;
   check(()=>assert(tagged.has(f.id),`${id}: untagged ${f.id}`));
  }
 }
}
console.log(`PASS ${passed}/${total}`);
