'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const AD=require('../src/ad.js');
require('../data/materials.js');
if(fs.existsSync(require('node:path').join(__dirname,'../data/profiles.js')))require('../data/profiles.js');
require('../modules/b6.js');
require('../modules/b6-tips.js');
const m=AD.modules.find(x=>x.id==='b6');
const defaults={...Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])),p:1,E:210000,K:235,K20:235,S:1.6,ST:1.1,c1:0,c2:0,T:20};
const ids=new Set(m.fields.map(f=>f.id)),symbols=new Set(m.fields.flatMap(f=>[f.id,f.sym].filter(Boolean)));
let passed=0,total=0;
function check(fn){total++;fn();passed++;}
// Check conditional fields too: every offered input needs an explanation.
for(const f of m.fields.filter(f=>f.type!=='heading'&&!f.hidden))check(()=>{
 assert.equal(typeof f.tip,'string',f.id);assert.ok(f.tip.length>0&&f.tip.length<=220,f.id+' length '+f.tip.length);
});
check(()=>assert.equal(m.tips.length,3));
check(()=>{
 const tip=m.fields.find(f=>f.id==='ringPos').tip;
 assert.ok(tip.includes('Innen oder außen'));assert.ok(tip.includes('Schwerpunktdurchmesser'));
 assert.ok(tip.includes('Einbauten'));assert.ok(!/nur dargestellt|nicht verifiziert|keine Druckfreigabe/.test(tip));
});
for(const tip of [...m.fields.map(f=>f.tip).filter(Boolean),...m.tips])check(()=>{
 assert.ok(!/laut Zeichnung|z\. B\.|im zukünftigen Zustand/.test(tip),tip);
 for(const token of tip.match(/\b[A-Z]{2,}[A-Za-z0-9_]*\b|\b[a-z]_[a-z0-9]+\b/g)||[])
  assert.ok(Object.hasOwn(AD.glossary,token)||symbols.has(token),'Missing glossary: '+token);
});
const cases=[{}, {lengthMode:'heads'}, {lengthMode:'heads',headType:'flat'},
 ...['flat','angle','tee','channel','ibeam','hollow','halfpipe','user'].flatMap(ringSection=>['outside','inside'].map(ringPos=>({rings:'yes',ringSource:'manual',ringSection,ringPos}))),
 ...Object.keys(AD.profiles||{}).map(ringProfileType=>({rings:'yes',ringSource:'standard',ringProfileType}))];
const seen=new Set();
for(const patch of cases)check(()=>{
 const g={...defaults,...patch},svg=m.draw(g,AD.h,null);
 assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined/.test(svg));
 for(const a of svg.matchAll(/\b(x|x1|x2|cx|y|y1|y2|cy)="(-?[\d.]+)"/g)){
  const max=a[1].includes('x')?420:320;assert.ok(+a[2]>=0&&+a[2]<=max,a[0]);
 }
 const local=new Set();
 for(const match of svg.matchAll(/data-p="([^"]+)"/g))for(const id of match[1].split(/\s+/)){
  assert.ok(ids.has(id),'Unknown drawing field '+id);seen.add(id);local.add(id);
 }
 assert.ok(local.has('Da')&&local.has('sn'));
 if(g.rings==='yes'){
  for(const id of ['ringSpacing','ringPos'])assert.ok(local.has(id),id);
  assert.equal(local.has('shellWidth'),g.widthMode==='input','shellWidth tagged only when entered');
  if(g.ringSource==='standard')assert.ok(local.has('ringSize'+g.ringProfileType));
 }
});
for(const id of ['Da','sn','l','lengthMode','overallLength','headDepth1','headDepth2','ringSpacing','ringB','ringH','ringTw','ringBf','ringTf','ringWall','ringPipeD','ringPos','ringSection'])check(()=>assert.ok(seen.has(id),'Missing highlight '+id));
check(()=>{
 assert.ok(!/gesperrt|unsymmetrischer Biegung/.test(m.fields.find(f=>f.id==='ringSource').tip));
 assert.ok(m.fields.find(f=>f.id==='ringSection').tip.includes('an der Schale an'));
 for(const type of ['UPN','L','T','RHS'])assert.ok(m.fields.find(f=>f.id==='ringSize'+type).tip.includes('Katalogwerte enthalten Walz- und Eckradien'));
});
console.log(`PASS ${passed}/${total}`);
