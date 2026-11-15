'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/tee.js');require('../modules/b9.js');
const ad=AD.modules.find(m=>m.id==='tee_ad'),en=AD.modules.find(m=>m.id==='tee_en'),old=AD.modules.find(m=>m.id==='b9');
function base(m){const g={p:20,K:182,K20:235,S:1.5,ST:1.05,v:1,c1:.2,c2:.8};for(const f of m.fields)g[f.id]=f.def;return g;}
function near(x,y){assert.ok(Math.abs(x-y)<=1e-9*Math.max(1,Math.abs(y)),`${x} != ${y}`);}
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
// Independent hand equilibrium: rectangular half-section, then load balance.
// No module helper or root solver is used for these expected values.
function hand(g,isEn){
 const D=isEn?g.Do:g.Da,s=isEn?g.eord:g.sA;
 const t=s*(1-(isEn?g.tol/100:0))-g.c1-g.c2-(isEn?g.thin:0);
 const u=g.sS*(1-(isEn?g.tol/100:0))-g.c1-g.c2-(isEn?g.thin:0);
 const R=D/2-(isEn?t:s),r=g.dA/2-(isEn?u:g.sS);
 const L=Math.min(isEn?g.ls:Infinity,Math.sqrt((isEn?D-t:2*R+t)*t));
 const B=Math.min(g.lb,(isEn?1:1.25)*Math.sqrt((isEn?g.dA-u:2*r+u)*u));
 const q=g.kind==='extruded'?.9:1,v=g.kind==='weld'?g.v:1;
 const A=q*t*(L+(isEn?u:0)),C=q*u*B;
 // Pressure area as two rectangles; same geometry, independently arranged.
 const P=R*(L+u)+r*(B+D/2);
 // For AD, D/2 = R+s; pressure geometry uses R+t, not nominal s.
 const Ap=isEn?P:R*(L+u)+r*(B+R+t);
 const f=(isEn?Math.min(g.RpT/1.5,g.Rm/2.4):g.K/g.S)*v;
 const fb=isEn?f:Math.min(g.Ks||g.K,g.K)/(g.Ss||g.S)*v;
 const fp=isEn?f:(g.Ks||g.K)/(g.Ss||g.S)*v;
 const resistance=f*A+fb*C-g.p/20*(A+C);
 return {util:g.p/10*Ap/resistance,pmax:Math.min(10*(f*A+fb*C)/(Ap+(A+C)/2),20*f*t/(D-t),20*fp*u/(g.dA-u)),A,C,Ap,L,B};
}
let total=0,pass=0;
function test(name,fn){total++;try{fn();pass++;}catch(e){console.error(name,e.message);process.exitCode=1;}}
for(const [name,m,change] of [
 ['AD reduziert',ad,{}],['AD gleich',ad,{dA:219.1,sS:10}],['AD oberhalb 0,8',ad,{dA:200,sS:10}],
 ['AD anderer Werkstoff',ad,{Ks:150,Ss:1.7}],['AD kurzer Abzweig',ad,{lb:7}],['AD ausgehalst',ad,{kind:'extruded',v:.85}],['AD geschmiedet gleich',ad,{kind:'forged',dA:219.1,sS:10,v:.85}],
 ['EN reduziert',en,{}],['EN gleich',en,{dA:219.1,sS:10}],['EN kurze Längen',en,{ls:12,lb:9}],['EN ohne Toleranz',en,{tol:0,thin:.3}],['EN ausgehalst',en,{kind:'extruded'}],['EN geschmiedet gleich',en,{kind:'forged',dA:219.1,sS:10}]
])test(name,()=>{const g={...base(m),...change},r=m.calc(g,AD.h),h=hand(g,m===en);assert.equal(r.fail,false);near(r.util,h.util);near(r.pmax,h.pmax);near(row(r,'A0'),h.A);near(row(r,'A1'),h.C);near(row(r,'Ap'),h.Ap);near(row(r,'ls'),h.L);near(row(r,'lb'),h.B);});
for(const m of [ad,en]){
 test(m.id+' Druckversagen',()=>{const g={...base(m),p:600},r=m.calc(g,AD.h);assert.ok(r.fail&&r.util>1);near(r.util,hand(g,m===en).util);});
 test(m.id+' zu großer Abzweig',()=>{const r=m.calc({...base(m),dA:300},AD.h);assert.ok(r.fail&&Number.isNaN(r.pmax));});
 test(m.id+' NaN',()=>{const r=m.calc({...base(m),dA:NaN},AD.h);assert.ok(r.fail);for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert.ok(k in r);});
 test(m.id+' Winkel',()=>assert.ok(m.calc({...base(m),angle:'45'},AD.h).fail));
 test(m.id+' Bereich',()=>assert.ok(m.calc({...base(m),scope:'no'},AD.h).fail));
 test(m.id+' Wandverhältnis',()=>{const r=m.calc({...base(m),sS:m===en?11:24},AD.h);assert.ok(r.fail&&Number.isNaN(r.pmax));});
 test(m.id+' Null Druck',()=>{const r=m.calc({...base(m),p:0},AD.h);assert.equal(r.fail,false);near(r.util,0);});
 test(m.id+' Metadaten',()=>{assert.equal(m.group,'T-Stücke');assert.equal(m.tips.length,3);for(const f of m.fields)assert.ok(f.tip);for(const t of m.tips)assert.ok(t.length<=220);});
}
for(const change of [{},{lb:6},{Ks:150,Ss:1.7},{v:.85},{dA:160,sS:12}])test('B9 Quervergleich '+JSON.stringify(change),()=>{
 const g={...base(ad),...change};const r=ad.calc(g,AD.h),b=old.calc({...g,sn:g.sA,ss:g.sS,ls:g.lb,mount:'on',hp:0,bp:0},AD.h);
 near(r.util,b.util);near(r.pmax,b.pmax);assert.equal(r.fail,b.fail);
});
test('PED-Prüfung von Hand',()=>{const g=base(ad),r=ad.calc(g,AD.h),h=hand(g,false);const PT=Math.max(1.25*g.p*g.K20/g.K,1.43*g.p),ft=g.K20/g.ST;
 const eta=Math.max(PT/10*h.Ap/((ft-PT/20)*(h.A+h.C)),PT/(20*ft*9/(219.1-9)),PT/(20*ft*7/(114.3-7)));
 near(r.test.PT,PT);near(r.test.req,eta*100);assert.equal(r.test.ok,eta<=1);
});
test('Kein fremder Prüfkennwert erfunden',()=>assert.equal(ad.calc({...base(ad),Ks:150},AD.h).test,null));
test('EN konservativer Hinweis',()=>assert.ok(en.calc(base(en),AD.h).notes.some(n=>n[0]==='w'&&n[1].includes('Nicht gegen die Norm verifiziert'))));
test('AD hochfest oberhalb 0,8',()=>{const r=ad.calc({...base(ad),dA:219.1,sS:10,K20:460},AD.h);assert.ok(r.fail&&Number.isNaN(r.pmax));});
for(const m of [ad,en]){
 const D=m===en?'Do':'Da',S=m===en?'eord':'sA';
 const ratio=g=>(g.dA-2*g.sS)/(g[D]-2*g[S]);
 // find branch OD giving di/Di just below / above 0,8 (sS fixed)
 const at=x=>{const g={...base(m),kind:'extruded',sS:8};let lo=50,hi=219.1;for(let i=0;i<80;i++){const mid=(lo+hi)/2;(ratio({...g,dA:mid})<x?lo=mid:hi=mid);}return {...g,dA:lo};};
 test(m.id+' ausgehalst knapp unter 0,8',()=>{const g=at(.799),r=m.calc(g,AD.h);assert.equal(r.fail,false);});
 test(m.id+' ausgehalst über 0,8 gesperrt',()=>{const g=at(.81),r=m.calc(g,AD.h);assert.ok(r.fail&&r.notes.some(n=>n[1].includes('0,8')));});
 test(m.id+' ausgehalst gleich gesperrt',()=>assert.ok(m.calc({...base(m),kind:'extruded',dA:219.1,sS:10},AD.h).fail));
 test(m.id+' alte Auswahl seamless',()=>{const a=m.calc({...base(m),kind:'seamless'},AD.h),b=m.calc({...base(m),kind:'extruded'},AD.h);near(a.pmax,b.pmax);});
}
test('EN applicability uses nominal rather than analysis bores',()=>{
 const g={...base(en),p:5,dA:168.2,sS:4,kind:'extruded',c1:0,c2:0,thin:0},r=en.calc(g,AD.h);
 // Nominal: 219.1-20=199.1; 168.2-8=160.2 -> 0.804621 > .8.
 // Analysis: t=8.75,u=3.5 -> 201.6 and 161.2 -> 0.799603 < .8.
 near(row(r,'Di,nom'),199.1);near(row(r,'di,nom'),160.2);
 near(row(r,'di/Di'),160.2/199.1);near(row(r,'Di'),201.6);near(row(r,'di'),161.2);
 assert(160.2/199.1>.8&&161.2/201.6<.8);assert(r.fail&&Number.isNaN(r.pmax));
 // The load equilibrium still uses conservative analysis bores unchanged.
 near(r.util,hand(g,true).util);
});
test('EN nominal bore boundary and impossible walls with large deductions',()=>{
 // 0.8*199.1+8=167.28 is the nominal dA boundary for a 4 mm branch.
 for(const [dA,fail] of [[167.28,false],[167.29,true]]){
  const r=en.calc({...base(en),p:5,c1:0,c2:0,kind:'extruded',dA,sS:4},AD.h);
  assert.equal(r.fail,fail);near(row(r,'di/Di'),(dA-8)/199.1);
 }
 // Nominal run bore 219.1-2*110=-0.9; deduction of 80 leaves
 // positive analysis t=30, but cannot make the physical bore valid.
 for(const patch of [{eord:110,sS:90,c1:80},{eord:65,sS:60,c1:55}]){
  const r=en.calc({...base(en),tol:0,c2:0,...patch},AD.h);
  assert(r.fail);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));
 }
});
test('EN spacing uses full Eq.8.4.1-2 length rather than credited length',()=>{
 const g={...base(en),c1:0,c2:0,ls:5},r=en.calc(g,AD.h);
 // t=10*.875=8.75; lsMax=sqrt((219.1-8.75)*8.75).
 const full=Math.sqrt(1840.5625);
 near(row(r,'ls,max'),full);near(row(r,'ls'),5);near(row(r,'A0'),(5+7)*8.75);
 const note=r.notes.find(n=>n[1].includes('Isolation'))[1];
 assert(note.includes('2·lsMax = '+AD.h.fmt(2*full)+' mm'));
 assert(note.includes('nicht die verkürzte angerechnete Länge ls = 5,00 mm'));
 near(r.util,hand(g,true).util);
});
for(const m of [ad,en])test(m.id+' finite inputs producing overflow fail closed',()=>{
 // A regular tee has hundreds of mm² of section; a stress of at least
 // 1e308/2.4 multiplied by 100 already exceeds binary64's maximum.
 assert(Number.isFinite(1e308/2.4));assert(!Number.isFinite(100*(1e308/2.4)));
 const material=m===en?{RpT:1e308,Rp20:1e308,Rm:1e308}:{K:1e308};
 const geometry=m===en?{Do:1e160,eord:1e158}:{Da:1e160,sA:1e158};
 for(const patch of [material,{p:1e308},{...geometry,dA:1e159,sS:1e157}]){
  const r=m.calc({...base(m),...patch},AD.h);
  assert(r.fail);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
 }
});
test('AD overflow in optional proof-pressure calculation also fails closed',()=>{
 const r=ad.calc({...base(ad),K20:1e308},AD.h);
 // 1.25*20*1e308/182 overflows before division.
 assert(r.fail);assert.equal(r.util,Infinity);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
});
test('AD help distinguishes extrusion and forging factors',()=>{
 assert(ad.help.includes('Ausgehalste T-Stücke mit Flächenfaktor q = 0,9'));
 assert(ad.help.includes('geschmiedete mit q = 1; beide mit v = 1'));
 for(const [kind,q] of [['extruded',.9],['forged',1]]){
  const r=ad.calc({...base(ad),kind,v:.7},AD.h),L=Math.sqrt(208.1*9),B=1.25*Math.sqrt(105.3*7);
  near(row(r,'q'),q);near(row(r,'A0'),q*L*9);near(row(r,'A1'),q*B*7);near(row(r,'F'),182/1.5);
 }
});
console.log(`PASS ${pass}/${total}`);
