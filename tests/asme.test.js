'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/asme.js');
const mod=id=>AD.modules.find(m=>m.id===id);
const base=id=>({...Object.fromEntries(mod(id).fields.map(f=>[f.id,f.def])),p:10,c1:0.5,c2:1,S:120,ST:138,E:0.85});
const near=(a,b)=>assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){throw new Error(name+': '+e.message);}}
// Independent hand substitution: P=1 MPa, R=500, SE=102, net=10.5.
// Expected values use no production calculator/helper, only direct arithmetic.
test('Zylinder: Umfang und Längsrichtung',()=>{
 const r=mod('ug27').calc(base('ug27'),AD.h),u=500/101.4,l=500/204.4;
 near(r.headline.value,Math.max(u,l)+1.5);near(r.pmax,102*10.5/(500+0.6*10.5)*10);
 near(r.rows.find(x=>x[1]==='tL')[2],l);
 near(r.test.PT,1.3*(102*10.5/(500+6.3)*10)*(138/120));
 const pt=1.3*(102*10.5/(500+6.3)*10)*(138/120)/10;
 near(r.test.req,pt*500/(138*0.85-0.6*pt)+0.5);assert(!r.fail);
});
test('Kugelschale',()=>{
 const r=mod('ug27').calc({...base('ug27'),shape:'sph'},AD.h);
 near(r.headline.value,500/203.8+1.5);near(r.pmax,204*10.5/(500+2.1)*10);
});
test('Ellipsoid 2:1',()=>{
 const r=mod('ug32').calc(base('ug32'),AD.h);
 near(r.headline.value,1000/203.8+1.5);near(r.pmax,204*10.5/(1000+2.1)*10);
});
test('Halbkugel',()=>{
 const r=mod('ug32').calc({...base('ug32'),head:'hemi'},AD.h);
 near(r.headline.value,500/203.8+1.5);near(r.pmax,204*10.5/(500+2.1)*10);
});
test('6-Prozent-Krempe',()=>{
 const r=mod('ug32').calc({...base('ug32'),head:'tor6'},AD.h);
 // Corroded skirt OD=1000+2*(12-1.5)=1021; r=61.26.
 near(r.headline.value,0.885*1021/101.9+1.5);
 near(r.pmax,102*10.5/(0.885*1021+1.05)*10);
 near(r.rows.find(x=>x[1]==='r')[2],61.26);assert(!r.fail);
});
test('Torisphäre freie Radien',()=>{
 const r=mod('ug32').calc({...base('ug32'),head:'tor',L:1000,r:100},AD.h);
 const M=(3+Math.sqrt(10))/4;
 near(r.headline.value,1000*M/203.8+1.5);near(r.pmax,204*10.5/(1000*M+2.1)*10);
});
test('Ebener Boden: C unter der Wurzel',()=>{
 const r=mod('ug34').calc(base('ug34'),AD.h);
 near(r.headline.value,1000*Math.sqrt(.33/102)+1.5);
 near(r.pmax,10*102/.33*(58.5/1000)**2);assert(!r.fail);
 near(r.test.PT,1.3*r.pmax*138/120);
});
test('Unterdimensioniert',()=>{
 const r=mod('ug27').calc({...base('ug27'),sn:3},AD.h);
 near(r.headline.value,500/101.4+1.5);assert(r.util>1&&r.fail);assert(Number.isFinite(r.pmax));
});
test('Druck außerhalb Geltungsbereich',()=>{
 const r=mod('ug27').calc({...base('ug27'),p:400},AD.h);
 assert(r.fail&&Number.isNaN(r.pmax)&&!r.test.ok);
});
test('Sehr dünner Boden',()=>{
 const r=mod('ug32').calc({...base('ug32'),sn:2,p:0.1,c1:0,c2:1},AD.h);
 assert(r.fail&&r.notes.some(n=>n[1].includes('1-4(f)')));assert(Number.isNaN(r.pmax));
});
test('Ungültiger Wirkungsgrad',()=>{const r=mod('ug34').calc({...base('ug34'),E:1.2},AD.h);assert(r.fail&&Number.isNaN(r.pmax));});
test('Ungültiger Anschlussbeiwert',()=>{const r=mod('ug34').calc({...base('ug34'),C:.01},AD.h);assert(r.fail);});
test('Krempe zu klein',()=>{const r=mod('ug32').calc({...base('ug32'),head:'tor',r:20},AD.h);assert(r.fail);});
test('AD-Kennwerte beeinflussen ASME nicht',()=>{
 const g=base('ug27'),r=mod('ug27').calc(g,AD.h),q=mod('ug27').calc({...g,K:1,K20:1,v:.1},AD.h);near(r.pmax,q.pmax);
});
test('Formvertrag und Prüfdruck aller Varianten',()=>{
 for(const [id,patch] of [['ug27',{}],['ug27',{shape:'sph'}],['ug32',{}],['ug32',{head:'tor6'}],['ug32',{head:'hemi'}],['ug32',{head:'tor'}],['ug34',{}]]){
  const g={...base(id),...patch},r=mod(id).calc(g,AD.h);
  for(const key of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(key in r);
  near(r.test.PT,1.3*r.pmax*138/120);assert.equal(mod(id).group,'ASME');
 }
});
test('NaN-Eingabe',()=>{for(const id of ['ug27','ug32','ug34'])assert(mod(id).calc({...base(id),D:NaN},AD.h).fail);});
test('Ebener Boden unterdimensioniert',()=>{
 const r=mod('ug34').calc({...base('ug34'),sn:20},AD.h);
 near(r.headline.value,1000*Math.sqrt(.33/102)+1.5);assert(r.fail&&r.util>1);
});
test('Boden unterdimensioniert',()=>{
 const r=mod('ug32').calc({...base('ug32'),sn:4},AD.h);
 near(r.headline.value,1000/203.8+1.5);assert(r.fail&&r.util>1);
});
test('Ebener Boden anderer Anschluss',()=>{
 const r=mod('ug34').calc({...base('ug34'),C:.2,D:400,sn:30,E:1,c1:0,c2:0},AD.h);
 near(r.headline.value,400*Math.sqrt(.2/120));near(r.pmax,120/.2*(30/400)**2*10);assert(!r.fail);
});

test('5: UG-32(e) hochfest, automatische Rm/S/ST-Werte',()=>{
 for(const head of ['tor6','tor']){
  const g={...base('ug32'),head,D:1000,sn:6,p:10.5,E:1,c1:0,c2:0,Rm:585,S:168,ST:168,L:1012,r:60.72};
  const r=mod('ug32').calc(g,AD.h),M=head==='tor6'?1.77:(3+Math.sqrt(1/.06))/4;
  // Used S=150 MPa, L=1012; raw material ratio remains 168/168.
  near(r.headline.value,1.05*1012*M/(300-.21));
  near(r.pmax,300*6/(1012*M+1.2)*10);assert(r.fail&&r.headline.value>6);
  near(r.rows.find(x=>x[1]==='S')[2],150);near(r.rows.find(x=>x[1]==='Smat')[2],168);
  near(r.test.PT,1.3*r.pmax);
  const hot=mod('ug32').calc({...g,S:126},AD.h);
  near(hot.rows.find(x=>x[1]==='S')[2],112.5);
  near(hot.test.PT,1.3*hot.pmax*4/3);
  const boundary=mod('ug32').calc({...g,Rm:500},AD.h);
  near(boundary.rows.find(x=>x[1]==='S')[2],168);
  assert(mod('ug32').calc({...g,Rm:NaN},AD.h).fail);
  near(mod('ug32').calc({...g,S:180},AD.h).rows.find(x=>x[1]==='S')[2],150);
 }
});
test('6: UG-99 beschreibt den nicht geführten Prüfnachweis korrekt',()=>{
 const r=mod('ug27').calc(base('ug27'),AD.h),text=r.notes.map(n=>n[1]).join(' ');
 assert(!text.includes('90 %'));assert(text.includes('keine allgemeine obere Prüfdruckgrenze'));
 assert(text.includes('bleibende Verformung'));assert.equal(r.test.ok,null);
 // Unchanged UG-99(b) arithmetic: 1.3 * component MAWP * raw II-D ratio.
 near(r.test.PT,1.3*(102*10.5/506.3*10)*138/120);
});

console.log(`PASS ${passed}/${total}`);
