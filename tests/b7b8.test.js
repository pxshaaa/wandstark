'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../data/flanges.js');
require('../modules/b7b8.js');
const bolt=AD.modules.find(m=>m.id==='b7'), flange=AD.modules.find(m=>m.id==='b8');
const shared={p:10,T:100,K:200,K20:240,S:1.5,ST:1.05,c1:0,c2:0};
const defaults=m=>Object.fromEntries(m.fields.map(f=>[f.id,f.def]));
const bg={...shared,...defaults(bolt)}, fg={...shared,...defaults(flange)};
let passed=0,total=0;
function near(a,b){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
function row(r,s){return r.rows.find(x=>x[1]===s)[2];}
function shape(r){for(const k of ['headline','util','pmax','test','rows','notes','fail','formula']) assert.ok(k in r,k); assert.ok(Number.isNaN(r.pmax)); assert.equal(r.test,null);}
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error(`FAIL ${name}: ${e.stack}`);}}
// Independent calculations below use N and mm; areas and moments are built from
// the supplied numerical cases, never from module outputs or module helpers.
test('B7 Betrieb, Vollschaft, Tafel 3.1',()=>{
 const r=bolt.calc(bg); shape(r);
 const operating=Math.sqrt(1.8*200000/(200*8)*4/Math.PI)+3;
 const installation=Math.sqrt(1.26*300000/(240*8)*4/Math.PI);
 const proof=Math.sqrt(1.26*286000/(240*8)*4/Math.PI);
 near(r.headline.value,Math.max(operating,installation,proof));
 near(row(r,'dKE'),installation);near(row(r,'dKP'),proof);assert.equal(r.fail,false);
});
test('B7 Einbau maßgebend, hohe Streckgrenze und unbearbeitet',()=>{
 const r=bolt.calc({...bg,FV:1000000,phi:'0.75',ratio:'high',dk:35,dn:42});
 const expected=Math.sqrt(1.3*1000000/(240*8*0.75)*4/Math.PI);
 near(r.headline.value,expected);near(row(r,'SE'),1.3);assert.equal(r.fail,false);
});
test('B7 Prüfung maßgebend',()=>{
 const r=bolt.calc({...bg,FP:1200000,dk:35,dn:42});
 near(r.headline.value,Math.sqrt(1.26*1200000/(240*8)*4/Math.PI));assert.equal(r.fail,false);
});
test('B7 Zuschlagsinterpolation bei 35 mm',()=>{
 const force=Math.PI*35*35/4*200*8/1.8;
 const r=bolt.calc({...bg,FB:force,dk:40,dn:48});
 near(row(r,'d0'),35);near(row(r,'c5'),2);near(r.headline.value,37);assert.equal(r.fail,false);
});
test('B7 Zuschlag oberhalb 50 mm',()=>{
 const force=Math.PI*55*55/4*200*8/1.8;
 const r=bolt.calc({...bg,FB:force,dk:60,dn:70});
 near(row(r,'c5'),1);near(r.headline.value,56);assert.equal(r.fail,false);
});
test('B7 Unterdimensionierung',()=>{
 const r=bolt.calc({...bg,dk:10});
 near(r.util,(Math.sqrt(900/Math.PI)+3)/10);assert.equal(r.fail,true);
});
test('B7 außerhalb Bereich / ungültige Werte',()=>{
 for(const change of [{T:400},{dn:8},{n:3},{n:8.5},{KB:0},{FB:-1},{phi:'0.5'},{ratio:'unknown'}])
  assert.equal(bolt.calc({...bg,...change}).fail,true,JSON.stringify(change));
});
// Default flange: b=600-400-52=148; sF=18; Z=418*18²=135432;
// Z1=3/4*412*12²=44496; aA=56; aB=59; aD=40;
// B1=3/4; sm=15; B=(1+30/148*3/4)/(1+30/148*(9/16+3/2)).
const beta=(1+22.5/148)/(1+61.875/148);
test('B8 Betrieb in beiden Querschnitten',()=>{
 const r=flange.calc(fg);shape(r);
 // WB=250000*(1.5/200)*59=110625, WA=105000.
 const aa=Math.sqrt((1.27*105000-135432)/148 < 0 ? 0 : (1.27*105000-135432)/148);
 const bb=beta*Math.sqrt((1.27*110625-44496)/148);
 near(row(r,'WA'),105000);near(row(r,'WB'),110625);near(row(r,'B'),beta);
 near(row(r,'hAA'),aa);near(row(r,'hBB'),bb);near(r.headline.value,Math.max(aa,bb));assert.equal(r.fail,false);
});
test('B8 Einbau maßgebend, S-Strich',()=>{
 const r=flange.calc({...fg,FV:1200000});
 // Einbaumoment=48e6 Nmm; W=48e6*1.05/240=210000 mm³.
 const aa=Math.sqrt((1.27*210000-135432)/148);
 const bb=beta*Math.sqrt((1.27*210000-44496)/148);
 near(row(r,'WA'),210000);near(row(r,'WB'),210000);
 near(r.headline.value,Math.max(aa,bb));assert.equal(r.fail,false);
});
test('B8 Prüfung maßgebend',()=>{
 const r=flange.calc({...fg,FP:1200000});
 const aa=Math.sqrt((1.27*294000-135432)/148);
 const bb=beta*Math.sqrt((1.27*309750-44496)/148);
 near(row(r,'WA'),294000);near(row(r,'WB'),309750);
 near(r.headline.value,Math.max(aa,bb));assert.equal(r.fail,false);
});
test('B8 Begrenzung sF auf hF/3 nur in A-A',()=>{
 const r=flange.calc({...fg,sf:24});
 // sF,rech=20; Z=420*400; aA=55; sm=18, B1=.75.
 const bFactor=(1+27/148)/(1+74.25/148);
 const aa=Math.sqrt(Math.max(0,(1.27*103125-168000)/148));
 const bb=bFactor*Math.sqrt((1.27*110625-44496)/148);
 near(row(r,'sF,rech'),20);near(row(r,'B'),bFactor);
 near(r.headline.value,Math.max(aa,bb));assert.equal(r.fail,false);
});
test('B8 Unterdimensionierung mit gültiger Geometrie',()=>{
 const r=flange.calc({...fg,FB:3000000});
 const aa=Math.sqrt((1.27*1260000-135432)/148);
 const bb=beta*Math.sqrt((1.27*1327500-44496)/148);
 near(r.headline.value,Math.max(aa,bb));assert.ok(r.util>1);assert.equal(r.fail,true);
});
test('B8 Geometriegrenzen und konstruktive Grenzen',()=>{
 for(const change of [{ha:140},{sf:50},{di:3700},{n:4},{r:5},{dD:540},{K:0},{hf:0},{FB:NaN},{T:301}])
  assert.equal(flange.calc({...fg,...change}).fail,true,JSON.stringify(change));
});
test('B8 untere und obere Höhengrenze inklusive',()=>{
 for(const ha of [90,120]) {
  const r=flange.calc({...fg,ha});
  const x=(ha-60)/60;
  const B=(1+30/148*x)/(1+30/148*(x*x+2*x));
  near(r.headline.value,B*Math.sqrt((1.27*110625-44496)/148));assert.equal(r.fail,false);
 }
});
test('B7/B8 keine automatische Druckskalierung oder doppelte Zuschläge',()=>{
 const b=bolt.calc({...bg,p:99,c1:7,c2:8,K:1,S:20});
 near(b.headline.value,Math.sqrt(900/Math.PI)+3);
 const f=flange.calc({...fg,p:99,c1:7,c2:8});
 near(f.headline.value,beta*Math.sqrt((1.27*110625-44496)/148));
 assert.ok(f.notes.some(n=>n[0]==='w'&&n[1].includes('Zuschläge')));
});
// Standard path: expectations below independently use the source table values.
const std={flSource:'standard',flPN:'16',flDN:'100',flType:'11'};
test('B7 Normflansch überschreibt nur Anzahl und Nenngewinde',()=>{
 const g={...bg,...std,FB:10000,FV:15000,FP:14300,dk:13,n:999,dn:999};
 const before={...g},r=bolt.calc(g);shape(r);
 near(r.headline.value,Math.sqrt(4*1.8*10000/(Math.PI*200*8))+3);
 assert.equal(r.fail,false);assert.deepEqual(g,before);
 const effective=bolt.geometry(g);assert.equal(effective.n,8);assert.equal(effective.dn,16);
 assert.equal(effective.dk,13);
});
test('B7 Typ01 Normflansch DN200 PN10, Einbau maßgebend',()=>{
 const r=bolt.calc({...bg,...std,flType:'01',flDN:'200',flPN:'10',dk:17,FB:1000,FV:200000,FP:1000});
 near(r.headline.value,Math.sqrt(4*1.26*200000/(Math.PI*240*8)));
 assert.equal(r.fail,false);
});
// PN16 DN100: D220,K180,L18,n8,C20; IBC ID115/OD162 => dD138.5.
// Entered effective hub: di100, sf6, s1=4, ha32, r8.
// b84, Z106*36, Z1=.75*104*16, aA37, aB38, aD20.75, B1=.6.
const standardHub={di:100,sf:6,s1:4,ha:32,r:8,FB:10000,FV:15000,FP:14300};
function standardExpected(force){
 const WA=Math.max(force*1.5/200*37,15000*1.05/240*20.75,14300*1.05/240*37);
 const WB=Math.max(force*1.5/200*38,15000*1.05/240*20.75,14300*1.05/240*38);
 const B=(1+10/84*.6)/(1+10/84*(.36+1.2));
 return Math.max(Math.sqrt(Math.max(0,(1.27*WA-106*36)/84)),B*Math.sqrt(Math.max(0,(1.27*WB-.75*104*16)/84)));
}
test('B8 Normflansch mit unabhängig berechnetem Ergebnis',()=>{
 const g={...fg,...std,...standardHub,da:NaN,dt:NaN,dL:NaN,n:NaN,dD:NaN,hf:NaN};
 const r=flange.calc(g);shape(r);near(r.headline.value,standardExpected(10000));
 near(r.util,standardExpected(10000)/20);near(row(r,'b'),84);near(row(r,'dD'),138.5);
 assert.equal(r.fail,false);
 const effective=flange.geometry(g);
 assert.deepEqual([effective.da,effective.dt,effective.dL,effective.n,effective.dn,effective.hf],[220,180,18,8,16,20]);
 assert.deepEqual([effective.di,effective.ha,effective.sf,effective.s1,effective.r],[100,32,6,4,8]);
});
test('B8 Normflansch unterdimensioniert',()=>{
 const r=flange.calc({...fg,...std,...standardHub,FB:1000000});
 near(r.headline.value,standardExpected(1000000));assert.ok(r.util>1);assert.equal(r.fail,true);
});
test('Normauswahl außerhalb PN/DN oder ohne Daten fällt sicher durch',()=>{
 for(const m of [bolt,flange])for(const change of [{flPN:'63'},{flDN:'600'},{flDN:'NaN'},{flSource:'other'}]){
  const r=m.calc({...shared,...defaults(m),...std,...change});shape(r);assert.equal(r.fail,true);
 }
 const saved=AD.flanges;
 try{delete AD.flanges;const r=flange.calc({...fg,...std});assert.equal(r.fail,true);assert.ok(r.notes.some(n=>n[0]==='e'&&n[1].includes('laden')));}
 finally{AD.flanges=saved;}
});
test('Normfelder bedingt sichtbar, manuelle Rückkehr erhält Geometrie',()=>{
 for(const m of [bolt,flange]){
  for(const id of ['flPN','flDN'])assert.deepEqual(m.fields.find(f=>f.id===id).when,{flSource:'standard'});
  const g={...shared,...defaults(m),flSource:'manual',flPN:'63',flDN:'999'};
  assert.equal(m.geometry(g),g);
 }
 near(flange.calc({...fg,flSource:'manual',flPN:'40',flDN:'500'}).headline.value,beta*Math.sqrt((1.27*110625-44496)/148));
});
test('Zeichnungen nutzen dieselbe Normgeometrie ohne NaN',()=>{
 for(const m of [bolt,flange]){
  const g={...shared,...defaults(m),...std,...(m===bolt?{dk:13}:standardHub)};
  const svg=m.draw(g,AD.h,null);
  assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined/.test(svg));
  // Same SVG as explicitly entering the resolved dimensions in manual mode.
  assert.equal(svg,m.draw({...m.geometry(g),flSource:'manual'},AD.h,null));
  const empty=m.draw({...g,flDN:'999'},AD.h,null);
  assert.ok(empty.includes('Maße eingeben'));assert.ok(!/NaN|undefined/.test(empty));
 }
});
console.log(`PASS ${passed}/${total}`);
if(passed!==total) process.exitCode=1;
