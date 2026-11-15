'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b9.js');
const m=AD.modules.find(x=>x.id==='b9');
assert(m);
assert.equal(m.name,'Stutzen');
assert.equal(m.group,'Ausschnitte');
const base={p:10,T:20,K:150,K20:150,S:1.5,ST:1.05,v:1,c1:0,c2:0,
  Da:1010,sn:10,dA:150,ss:10,ls:20,mount:'on',Ks:0,Ss:0,hp:0,bp:0};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const row=(r,sym)=>{const x=r.rows.find(x=>x[1]===sym);assert(x,`Zeile ${sym}`);return x[2];};
function contract(r){
  for(const k of ['headline','util','pmax','test','rows','notes','fail','formula']) assert(k in r,k);
  assert.equal(r.test,null);
  assert.equal(r.headline.unit,'%');
  near(r.headline.value,r.util*100);
}
let passed=0;
const cases=[];
function test(name,fn){cases.push([name,fn]);}
// Handrechnung unabhängig vom Modul: Di=990, di=130, b=100,
// l=20, A0=1000, A1=200. Druckfläche als Summe dreier Rechtecke:
// 495*100 + 495*75 + 65*30 = 88575 mm².
// Bei 10 bar: Tragkraft 99,5*(1000+200)=119400 N.
// pGrenz=10*120000/(88575+600)=1200000/89175 bar.
test('Aufgesetzt, Handrechnung mit ganzzahligen Querschnitten',()=>{
  const r=m.calc(base,AD.h);contract(r);assert.equal(r.fail,false);
  near(row(r,'b'),100);near(row(r,'Aσ0'),1000);near(row(r,'Aσ1'),200);
  near(row(r,'Ap'),88575);near(r.util,88575/119400);near(r.pmax,1200000/89175);
});
test('Schwächerer Stutzenwerkstoff',()=>{
  const r=m.calc({...base,Ks:75},AD.h);contract(r);assert.equal(r.fail,false);
  // Mantel 100 MPa, Stutzen 50 MPa: 99,5*1000+49,5*200.
  near(r.util,88575/109400);near(r.pmax,1100000/89175);near(row(r,'f1'),50);
});
test('Höhere Stutzenfestigkeit nicht als Verstärkung ausgenutzt',()=>{
  const r=m.calc({...base,Ks:300},AD.h);contract(r);assert.equal(r.fail,false);
  near(r.util,88575/119400);near(r.pmax,1200000/89175);near(row(r,'f1'),100);
});
test('Unterschiedlicher Sicherheitsbeiwert am Stutzen',()=>{
  const r=m.calc({...base,Ks:150,Ss:3},AD.h);contract(r);
  near(r.util,88575/109400);near(r.pmax,1100000/89175);
});
test('Vorhandene Länge größer als mittragende Länge',()=>{
  const r=m.calc({...base,ls:200},AD.h);contract(r);assert.equal(r.fail,false);
  // Handrechnung: l²=1,25²*140*10=2187,5; A1=10*l.
  // Ap=86625+65*(10+l)=87275+65*l.
  const length=Math.sqrt(2187.5), area=1000+10*length, pressureArea=87275+65*length;
  near(row(r,'lS'),length);near(row(r,'Ap'),pressureArea);
  near(r.util,pressureArea/(99.5*area));near(r.pmax,1000*area/(pressureArea+area/2));
});
test('Kein Überstand: keine Stutzenflächenanrechnung',()=>{
  const r=m.calc({...base,ls:0},AD.h);contract(r);assert.equal(r.fail,false);
  near(row(r,'Aσ1'),0);near(row(r,'Ap'),87275);near(r.util,87275/99500);
  near(r.pmax,1000000/87775);
});
test('Nicht bestandener Flächenvergleich bei ausreichendem B1-Mantel',()=>{
  const r=m.calc({...base,p:20},AD.h);contract(r);assert.equal(r.fail,true);
  // B1: 1010*20/(2000+20)=10 mm; B9 versagt trotzdem.
  near(row(r,'s,B1'),10);near(r.util,177150/118800);assert(r.util>1);
  near(r.pmax,1200000/89175);
});
test('Durchmesserverhältnis außerhalb Modulumfang',()=>{
  const r=m.calc({...base,dA:900,p:0.1},AD.h);contract(r);assert.equal(r.fail,true);assert(Number.isNaN(r.pmax));
  // di=880; Ap=495*550+440*30=285450; capacity=99,995*1200.
  near(row(r,'di/Di'),880/990);near(row(r,'Ap'),285450);near(r.util,2854.5/119994);
  assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('0,8')));
});
test('Eingesetzt und Scheibe: bewusst keine zusätzliche Fläche',()=>{
  const r=m.calc({...base,mount:'in',hp:8,bp:150},AD.h);contract(r);assert.equal(r.fail,false);
  near(row(r,'Aσ2'),0);near(r.util,88575/119400);near(r.pmax,1200000/89175);
  assert(r.notes.filter(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')).length>=2);
});
test('Gemeinsame Zuschläge auf Mantel und Stutzen',()=>{
  const r=m.calc({...base,Da:1014,sn:12,dA:154,ss:12,c1:1,c2:1},AD.h);contract(r);assert.equal(r.fail,false);
  // Di=990, di=130 und beide Netto-Wände=10: gleiche B9-Handrechnung.
  near(row(r,'se−c'),10);near(row(r,'sS−c'),10);near(r.util,88575/119400);
  near(r.pmax,1200000/89175);
});
test('Nahtfaktor konservativ und sichtbar gekennzeichnet',()=>{
  const r=m.calc({...base,v:0.8},AD.h);contract(r);assert.equal(r.fail,false);
  near(r.util,88575/95400);near(r.pmax,960000/89175);
  assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
test('Null Druck',()=>{
  const r=m.calc({...base,p:0},AD.h);contract(r);assert.equal(r.fail,false);near(r.util,0);near(r.pmax,1200000/89175);
});
test('Dünnwandige große Öffnung außerhalb B9 §1.1 (4)',()=>{
  const r=m.calc({...base,sn:1,ss:1,dA:450,p:0.01},AD.h);contract(r);assert.equal(r.fail,true);
  // Di=1008, di=448, b=sqrt(1009), l=20, A0=b, A1=20.
  const b=Math.sqrt(1009), ap=504*(b+225)+224*21;
  near(row(r,'Ap'),ap);near(r.util,0.001*ap/(99.9995*(b+20)));
  assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('1/3')));assert(Number.isNaN(r.pmax));
});
test('Wanddickenverhältnis größer als zwei',()=>{
  const r=m.calc({...base,ss:21,dA:252,p:0.1},AD.h);contract(r);assert.equal(r.fail,true);
  // di=210; A1=420; Ap=495*(100+21+105)+105*30=115020.
  near(row(r,'Ap'),115020);near(r.util,1150.2/(99.995*1420));assert(Number.isNaN(r.pmax));
});
test('Nichtpositive Netto-Wand liefert vollständiges Fehlerergebnis',()=>{
  const r=m.calc({...base,c1:10},AD.h);assert.equal(r.fail,true);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));
  for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r);
});
test('Ungültige Eingaben und unbekannter Anschluss abgewiesen',()=>{
  for(const patch of [{K:NaN},{v:1.1},{p:-1},{mount:'schraeg'},{ls:-1},{Ss:-1}]){
    const r=m.calc({...base,...patch},AD.h);assert.equal(r.fail,true);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));
  }
});
test('Kennwertbegrenzung vor Sicherheitsbeiwert, Hinweis nur bei Ks > K',()=>{
  // K/S=150/1.5=100; min(120,150)/1=120, without a cap.
  const r=m.calc({...base,Ks:120,Ss:1},AD.h);
  near(row(r,'f0'),100);near(row(r,'f1'),120);
  near(r.util,88575/(99500+23900));near(r.pmax,1240000/89175);
  assert(!r.notes.some(n=>n[1].includes('begrenzt')&&n[1].includes('Kennwert')));
  // min(300,150)/3=50; the raw stress is 100, but K is capped.
  const capped=m.calc({...base,Ks:300,Ss:3},AD.h);
  near(row(capped,'f1'),50);near(capped.util,88575/109400);
  assert(capped.notes.some(n=>n[1].includes('Festigkeitskennwert')&&n[1].includes('begrenzt')));
  assert(!capped.notes.some(n=>n[1].includes('Mantelspannung begrenzt')));
});
test('Nichtendliche Ableitungen aus endlichen Eingaben sperren den Nachweis',()=>{
  // The ordinary worksheet has A0=1000 mm²: (1e308/1.5)*1000
  // exceeds Number.MAX_VALUE even though K and K/S are finite.
  assert(Number.isFinite(1e308/1.5));assert(!Number.isFinite((1e308/1.5)*1000));
  for(const patch of [{K:1e308},{S:1e-308},{p:1e308},{Da:1e160,sn:1e158,dA:1e159,ss:1e157}]){
    const r=m.calc({...base,...patch},AD.h);
    assert.equal(r.fail,true);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));
    assert(r.notes.some(n=>n[0]==='e'));
  }
});
for(const [name,fn] of cases){try{fn();passed++;}catch(e){console.error(`FAIL ${name}: ${e.message}`);}}
console.log(`PASS ${passed}/${cases.length}`);
if(passed!==cases.length)process.exitCode=1;
