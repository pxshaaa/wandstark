'use strict';
// Regression cases from findings.txt, mirrored about the shell mid-surface.
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/profiles.js');require('../modules/b6.js');
const m=AD.modules.find(x=>x.id==='b6');
const base={...Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])),
 Da:1000,sn:8,c1:0,c2:0,l:1000,ringSpacing:1000,rings:'yes',p:0,
 E:210000,K:235,K20:235,S:1.6,ST:1.1,u:1.5,ringK:235,ringS:1.6,ringSource:'manual'};
const calc=g=>m.calc({...base,...g});
const errors=r=>r.notes.filter(n=>n[0]==='e').map(n=>n[1]).join('; ');
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
for(const ringPos of ['outside','inside']){
 const mirror=d=>ringPos==='inside'?1984-d:d;
 const manual={ringPos,ringSection:'user',ringH:80,ringB:12,ringA:1800,ringI:40000,ringW:10000,ringIs:20000};
 test('finding 1 impossible centroid '+ringPos,()=>{
  // The original 10 mm centroid and its reflected counterpart must fail closed.
  for(const ringDm of [10,mirror(10),mirror(992-1e-6),mirror(1160+1e-6)]){
   const r=calc({...manual,p:1,ringDm});assert.equal(r.fail,true);assert.ok(!Number.isFinite(r.pmax));
   assert.match(errors(r),/Dm muss zwischen Schalenmittelfläche und freiem Profilrand/);
  }
 });
 test('finding 1 impossible modulus at admissible centroid '+ringPos,()=>{
  const r=calc({...manual,ringDm:mirror(992)});
  assert.equal(r.fail,true);assert.match(errors(r),/Wm darf Im\/max/);
  assert.ok(!Number.isFinite(r.pmax));
 });
 test('finding 1 centroid and extreme-fibre boundaries '+ringPos,()=>{
  for(const e of [-4,0,20,60,80]){
   const ringDm=mirror(1000+2*e),ringW=40000/Math.max(e+8,80-e);
   const r=calc({...manual,ringDm,ringW});assert.equal(r.fail,false,errors(r));
   assert.equal(calc({...manual,ringDm,ringW:ringW*.9}).fail,false);
   const bad=calc({...manual,ringDm,ringW:ringW*(1+1e-7)});
   assert.equal(bad.fail,true);assert.match(errors(bad),/Wm darf Im\/max/);
  }
 });
 test('finding 1 net thickness controls bounds '+ringPos,()=>{
  // t=8 remains unchanged when nominal thickness and corrosion rise together.
  const good=calc({...manual,sn:10,c1:1,c2:1,ringDm:mirror(992),ringW:40000/84});
  assert.equal(good.fail,false,errors(good));
  assert.equal(calc({...manual,sn:10,c1:1,c2:1,ringDm:mirror(991.99),ringW:1}).fail,true);
 });
 test('finding 1 fractional net-thickness centroid boundaries '+ringPos,()=>{
  const t=7.7;
  const bounds=ringPos==='inside'?[1000-2*t-160,1000-t]:[1000-t,1160];
  for(const ringDm of bounds){
   const r=calc({...manual,c1:.3,ringDm,ringW:1});
   assert.equal(r.fail,false,errors(r));
  }
 });
 const angle={ringPos,ringSource:'standard',ringProfileType:'L',ringSizeL:'L 120x8',sn:20,p:1};
 test('finding 2 catalogue L120x8 test-state class 3 '+ringPos,()=>{
  const operating=calc(angle);assert.equal(operating.fail,false,errors(operating));
  const valid=calc({...angle,testMode:'external',pTest:1,ETest:210000,ringK20:235});
  assert.equal(valid.test.ok,true,errors(valid));
  const r=calc({...angle,testMode:'external',pTest:1,ETest:210000,ringK20:355});
  assert.equal(r.fail,true);assert.equal(r.test.ok,false);
  assert.match(errors(r),/Prüfzustand: Profilplatten zu schlank/);
  assert.equal(calc({...angle,ringK:355}).fail,true);
 });
 const beam={ringPos,ringSection:'ibeam',ringH:140,ringBf:270,ringTw:10,ringTf:10};
 test('finding 3 remote I flange guard '+ringPos,()=>{
  const r=calc({...beam,E:23500,p:1});assert.equal(r.fail,true);
  assert.match(errors(r),/Freier Profilgurt: weder Steg- noch Gurtproportion/);
  assert.ok(!Number.isFinite(r.pmax));
 });
 test('finding 2 test-state E triggers supplementary I guard '+ringPos,()=>{
  const operating=calc(beam);assert.equal(operating.fail,false,errors(operating));
  const r=calc({...beam,testMode:'external',pTest:0,ETest:23500,ringK20:235});
  assert.equal(r.test.ok,false);assert.equal(r.fail,true);
  assert.match(errors(r),/Prüfzustand: Freier Profilgurt/);
 });
 test('finding 3 retain OR and I web depth h-2tf '+ringPos,()=>{
  // sqrt(E/K)=10: web d/tw <=11 alone suffices; flange wf/tf <=5 alone suffices.
  for(const patch of [{ringH:130},{ringH:140,ringBf:100}]){
   const r=calc({...beam,...patch,E:23500});assert.equal(r.fail,false,errors(r));
  }
  assert.equal(calc({...beam,ringH:130.000001,E:23500}).fail,true);
 });
 for(const [section,dims] of [
  ['tee',{ringH:80,ringTw:10,ringBf:260,ringTf:10}],
  ['channel',{ringH:400,ringTw:10,ringBf:100,ringTf:10}],
  ['hollow',{ringH:400,ringBf:100,ringWall:10}]
 ])test('finding 2 test-state class 3 '+section+' '+ringPos,()=>{
  const g={ringPos,ringSection:section,...dims};
  const op=calc(g);assert.equal(op.fail,false,errors(op));
  const r=calc({...g,testMode:'external',pTest:0,ETest:210000,ringK20:355});
  assert.equal(r.test.ok,false);assert.equal(r.fail,true);assert.match(errors(r),/Prüfzustand:.*(?:schlank|schlankheit)/);
 });
}
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
