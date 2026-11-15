'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const AD=require('../src/ad.js');
require('../data/materials.js');
if(fs.existsSync(path.join(__dirname,'../data/profiles.js'))) require('../data/profiles.js');
require('../modules/b1.js');
require('../modules/b10.js');
require('../modules/b1-tips.js');
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
const ids=['cyl','sph','b3','b5','b10'];
const expectedTags={cyl:['Da','sn'],sph:['Da','sn'],b3:['Da','sn','htype'],b5:['D','sn'],b10:['Da','sn','shape']};
for(const id of ids){
 const m=AD.modules.find(x=>x.id===id);
 const defaults=Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def]));
 const fields=new Set(m.fields.filter(f=>f.type!=='heading').map(f=>f.id));
 const symbols=new Set([...fields,...m.fields.flatMap(f=>(f.sym||'').match(/\b[A-Z]{2,}[A-Za-z0-9_]*\b|\b[a-z]_[a-z0-9]+\b/g)||[])]);
 const visible=f=>!f.when||Object.entries(f.when).every(([key,value])=>(Array.isArray(value)?value:[value]).includes(defaults[key]));
 test(id+' field tips',()=>{
  for(const f of m.fields.filter(f=>f.type!=='heading'&&visible(f))){
   assert.equal(typeof f.tip,'string',f.id);assert(f.tip.trim().length>0,f.id);assert(f.tip.length<=220,`${f.id}: ${f.tip.length}`);
  }
 });
 test(id+' input tips',()=>{assert.equal(m.tips.length,3);for(const tip of m.tips)assert(typeof tip==='string'&&tip.trim().length>0&&tip.length<=220);});
 test(id+' language and glossary',()=>{
  for(const tip of [...m.fields.map(f=>f.tip).filter(Boolean),...m.tips]){
   assert(!/laut Zeichnung|z\. B\.|im zukünftigen Zustand/.test(tip),tip);
   for(const token of tip.match(/\b[A-Z]{2,}[A-Za-z0-9_]*\b|\b[a-z]_[a-z0-9]+\b/g)||[]) assert(symbols.has(token)||Object.hasOwn(AD.glossary,token),`${id}: ${token}`);
  }
 });
 test(id+' drawing tags',()=>{
  const variants=id==='b3'?[{}, {htype:'kb'}]:id==='b10'?[{}, {shape:'sph'}]:[{}];
  for(const patch of variants){
   const g={p:10,T:100,K:180,K20:235,S:1.5,ST:1.05,v:1,c1:0.5,c2:1,...defaults,...patch};
   const svg=m.draw(g,AD.h,null),tagged=new Set();
   for(const match of svg.matchAll(/data-p="([^"]*)"/g)) for(const field of match[1].split(/\s+/)){
    assert(fields.has(field),`${id}: unknown field ${field}`);tagged.add(field);
   }
   for(const field of expectedTags[id]) assert(tagged.has(field),`${id}: missing tag ${field}`);
   // Wall focus must target the dimension, never a complete wall contour.
   for(const match of svg.matchAll(/<g data-p="sn">([\s\S]*?)<\/g>/g))assert(!/<(?:path|rect|circle|polygon)\b/.test(match[1]));
  }
 });
}
console.log(`PASS ${passed}/${total}`);
