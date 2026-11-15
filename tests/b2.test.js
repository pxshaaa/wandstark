'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b2.js');
const m=AD.modules.find(x=>x.id==='b2');
assert(m && m.name==='Kegel' && m.code==='B2' && m.group==='Schalen');
const base={p:10,T:100,K:180,K20:235,E:200000,S:1.5,ST:1.05,v:0.85,
 c1:0.5,c2:1,Da:1000,phi:30,sn:30,junction:'sharp',r:50};
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function near(actual,expected){assert(Number.isFinite(actual));assert(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}
function row(result,symbol){const r=result.rows.find(r=>r[1]===symbol);assert(r,'missing '+symbol);return r[2];}
function shape(r){for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r,k);}
// Worksheet: coefficients re-transcribed from B2 (10.2000), Bilder 3.1–3.7 (review 2026-11-13: 8 digit fixes at 10/20/30/50/60/70°).
// Expand the cubic directly, evaluate a known x, then demand recovery of Da*x.
// The expected thickness is known BEFORE calling calc; no module solver is used.
const sheet=[
 [10,[.8176136502,1.0381861882,.0622158210,.0096929535],[.0597195135,-.2412593780,-.1880642590,-.0324536587]],
 [20,[-.1430803135,.1381824165,-.1765906005,-.0065026025],[-1.4462692977,-.8328006417,-.1486039657,-.0281519950]],
 [30,[-.3500365835,-.2440822374,-.3246595673,-.0190535072],[-3.6181287755,-2.6258109205,-.5453370384,-.0635460883]],
 [40,[.8575902466,.5378481964,-.1986685329,-.0125237427],[-8.8199247674,-6.4515131511,-1.3258437675,-.1177022189]],
 [50,[1.2789917860,.8377077949,-.1656688432,-.0118934136],[-5.0206287530,-3.5637644804,-.5711850721,-.0600216109]],
 [60,[1.8694396440,1.3659163860,-.0648173574,-.0057345617],[.0553080284,-.0511260440,.3015922949,.0090201888]],
 [70,[-.3134405430,.0067874373,-.3697977429,-.0270859480],[17.879816063,11.917959356,2.9083873997,.1924692668]]
];
function zValue(t,x,y){const a=t[1],b=t[2],L=Math.log(x);return a[0]+a[1]*L+a[2]*L**2+a[3]*L**3+y*(b[0]+b[1]*L+b[2]*L**2+b[3]*L**3);}
function capacity(t,x,y,A){return 15*A*Math.exp(zValue(t,x,y));}
// Separate log-space Newton worksheet for the proof load; does not call AD.h.solve.
function worksheetThickness(t,p,A,Da,y){
 const target=Math.log(p/(15*A));let L=Math.log(.01);
 for(let i=0;i<30;i++){
  const a=t[1],b=t[2];
  const residual=zValue(t,Math.exp(L),y)-target;
  const slope=a[1]+2*a[2]*L+3*a[3]*L*L+y*(b[1]+2*b[2]*L+3*b[3]*L*L);
  L-=residual/slope;
 }
 return Da*Math.max(.001,Math.exp(L));
}
const wall=(g,p,A)=>g.Da*p/((20*A-p)*Math.cos(g.phi*Math.PI/180));
for(const t of sheet)for(const knuckle of [false,true]) test(`Diagrammpunkt ${t[0]}° ${knuckle?'Krempe':'Eckstoß'}`,()=>{
 const g={...base,phi:t[0],junction:knuckle?'knuckle':'sharp'};
 const y=knuckle?.05:0,A=g.K/g.S*g.v,x=.01;
 g.p=capacity(t,x,y,A);
 const expectedJoint=10,expectedWall=wall(g,g.p,A),expectedReq=Math.max(expectedJoint,expectedWall)+1.5;
 const have=.0285,pg=20*A*(have*1000)*Math.cos(g.phi*Math.PI/180)/(1000+have*1000*Math.cos(g.phi*Math.PI/180));
 const pl=capacity(t,have,y,A);
 const PT=Math.max(1.25*g.p*g.K20/g.K,1.43*g.p),AT=g.K20/g.ST*g.v;
 const expectedTest=Math.max(2,Math.max(wall(g,PT,AT),worksheetThickness(t,PT,AT,1000,y))+.5);
 const r=m.calc(g,AD.h);shape(r);
 near(row(r,'sl,0'),expectedJoint);near(row(r,'sg,0'),expectedWall);
 near(r.headline.value,expectedReq);near(r.util,expectedReq/30);near(r.pmax,Math.min(pg,pl));
 near(row(r,'β'),40*A*expectedJoint/(1000*g.p));near(r.test.PT,PT);near(r.test.req,expectedTest);
 assert.equal(r.test.ok,expectedTest<=30);assert.equal(r.fail,expectedReq>30||expectedTest>30);
 assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('Prüfzustand')));
});
test('Winkelinterpolation der Wanddicken',()=>{
 const g={...base,phi:35},A=g.K/g.S*g.v;
 const s30=worksheetThickness(sheet[2],g.p,A,1000,0),s40=worksheetThickness(sheet[3],g.p,A,1000,0);
 const expected=(s30+s40)/2,r=m.calc(g,AD.h);
 near(row(r,'sl,0'),expected);near(r.headline.value,Math.max(expected,wall(g,g.p,A))+1.5);
 // Allowable pressure must recover the available thickness under the same interpolation.
 const atLimit=m.calc({...g,p:row(r,'p_l')},AD.h);near(row(atLimit,'sl,0'),g.sn-g.c1-g.c2);
});
test('Zu geringe Wanddicke',()=>{
 const g={...base,sn:3,p:30},r=m.calc(g,AD.h);shape(r);
 assert(r.fail);assert(r.util>1);assert(!r.test.ok);near(row(r,'sg,0'),wall(g,30,102));
});
test('Winkel außerhalb Geltungsbereich',()=>{
 const r=m.calc({...base,phi:75},AD.h);shape(r);assert(r.fail);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
});
test('Krempenradius außerhalb Geltungsbereich',()=>{
 const r=m.calc({...base,junction:'knuckle',r:5},AD.h);assert(r.fail);assert.equal(r.test,null);
});
test('Aufgebrauchte Wanddicke',()=>{
 const r=m.calc({...base,sn:1.5},AD.h);assert(r.fail);assert(Number.isNaN(r.pmax));
});
test('Eckstoß ignoriert Krempenradius',()=>{
 const a=m.calc({...base,r:0},AD.h),b=m.calc({...base,r:100},AD.h);near(a.headline.value,b.headline.value);near(a.pmax,b.pmax);
});
test('Diagrammüberschreitung und Membransingularität',()=>{
 const r=m.calc({...base,p:10000},AD.h);shape(r);assert(r.fail);assert(!r.test.ok);assert(!Number.isFinite(r.headline.value));
});
test('Null-Druck und Mindestdicke',()=>{
 const g={...base,p:0},r=m.calc(g,AD.h);near(r.headline.value,2.5);near(r.test.req,2);assert(!r.fail);
});
test('Prüfzustand allein nicht ausreichend',()=>{
 const g={...base,v:1,sn:7.2,K20:180,ST:1.5},r=m.calc(g,AD.h);
 assert(r.util<1);assert(r.fail);assert(!r.test.ok);
 near(r.test.PT,14.3);
 const expected=Math.max(wall(g,14.3,120),worksheetThickness(sheet[2],14.3,120,1000,0))+.5;
 near(r.test.req,expected);
});
test('Prüfzustand außerhalb relativer Dickenbegrenzung',()=>{
 const r=m.calc({...base,sn:101,c1:.5,c2:2},AD.h);assert(r.fail);assert.equal(r.test,null);
});

test('Review 3: dimensions reject a collapsed small-end bore',()=>{
 const phi=Math.atan(990/1600),projection=40/Math.cos(phi);
 near(phi*180/Math.PI,31.74715045739109);
 near(10-projection,-37.03788366837947);
 const r=m.calc({...base,geoMode:'dims',Da:1000,Da2:10,Lk:800,sn:20,p:1,c1:0,c2:0},AD.h);
 assert(r.fail);assert.equal(r.test,null);assert(!Number.isFinite(r.pmax));
 assert(r.notes.some(n=>/engen Ende/.test(n[1])));
 // tan(phi)=3/4 -> cos(phi)=4/5, radial wall=25, limiting diameter=50.
 for(const Da2 of [49.9,50]){
  const r=m.calc({...base,geoMode:'dims',Da2,Lk:(1000-Da2)/1.5,sn:20,p:1,c1:0,c2:0},AD.h);
  assert(r.fail);assert.equal(r.test,null);
 }
 const valid=m.calc({...base,geoMode:'dims',Da2:50.1,Lk:949.9/1.5,sn:20,p:1,c1:0,c2:0},AD.h);
 assert(valid.test);assert(Number.isFinite(valid.pmax));
});
console.log(`PASS ${passed}/${total}`);

// ---- Kegelgeometrie aus Maßen: tan φ = (Da1 − Da2)/(2·L), independent check ----
{ const assert=require('node:assert/strict'); const AD2=globalThis.AD; const m=AD2.modules.find(x=>x.id==='b2');
  const g0={p:10,T:20,K:235,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0}; m.fields.forEach(f=>{if(f.id&&f.type!=='heading')g0[f.id]=f.def;});
  const phi=Math.atan((1000-600)/(2*400))*180/Math.PI; // 26.565°
  const rd=m.calc({...g0,geoMode:'dims',Da:1000,Da2:600,Lk:400},AD2.h), ra=m.calc({...g0,geoMode:'angle',phi},AD2.h);
  assert.ok(Math.abs(rd.rows.find(r=>r[1]==='φ')[2]-phi)<1e-9,'phi from dims');
  assert.ok(Math.abs(rd.headline.value-ra.headline.value)<1e-9,'same result as entering the angle');
  assert.ok(m.calc({...g0,geoMode:'dims',Da:1000,Da2:1200,Lk:400},AD2.h).fail,'Da2 >= Da rejected');
  console.log('cone dims regression ok (phi 26.57°)'); }
// knuckle + dims: build L from known phi by hand, the module must recover phi
{ const AD=globalThis.AD, m=AD.modules.find(x=>x.id==='b2'); let ok=0,n=0;
  for(const [deg,r,s,Da,Da2] of [[30,50,12,1000,600],[20,80,10,1200,900],[45,30,8,800,300],[60,20,6,500,200]]){
    const f=deg*Math.PI/180,ro=r+s,dR=(Da-Da2)/2,L=ro*Math.sin(f)+(dR-ro*(1-Math.cos(f)))/Math.tan(f);
    const g={p:2,T:20,K:235,K20:235,E:2e5,S:1.5,ST:1.1,v:1,c1:0,c2:0};m.fields.forEach(x=>{if(x.id&&x.def!==undefined)g[x.id]=x.def});
    Object.assign(g,{geoMode:'dims',junction:'knuckle',r,sn:s,Da,Da2,Lk:L});
    const row=m.calc(g,AD.h).rows.find(x=>x[1]==='φ'); n++; if(row&&Math.abs(row[2]-deg)<1e-6) ok++; else console.error('knuckle dims',deg,row&&row[2]); }
  if(ok!==n){process.exitCode=1;} console.log(`knuckle dims PASS ${ok}/${n}`); }
