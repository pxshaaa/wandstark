'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/en13445.js');
const modules=Object.fromEntries(AD.modules.filter(m=>m.group==='EN 13445').map(m=>[m.id,m]));
function input(id,patch={}){return {...Object.fromEntries(modules[id].fields.filter(f=>'def'in f).map(f=>[f.id,f.def])),product:'wrought',weldRoute:'standard',p:10,T:150,K:180,K20:235,v:1,c1:.5,c2:1,...patch};}
const close=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Independently calculated scalar expressions: no module helpers called.
function f(g,room=false){const rp=room?g.K20:g.K;return g.steel==='aust'?(g.A<35?rp/1.5:Math.max(rp/1.5,Math.min(rp/1.2,(room?g.Rm:g.RmT)/3))):Math.min(rp/1.5,g.Rm/2.4);}
// Separate tabulated polynomial evaluation and fixed point, not module bisection.
function expectedHead(g,P,ft,fb,test=false){
 const loss=test?g.c2:0,Di=g.Da-2*(g.sn-g.c1-(test?0:g.c2)),K=Di/(2*(g.hi-loss)),R=g.head==='ell'?Di*(.44*K+.02):g.R-loss,r=g.head==='ell'?Di*(.5/K-.08):g.r-loss;
 const C=.75*R+.2*Di;
 function B(t){const y=Math.min(t/R,.04),z=Math.log10(1/y),n=1.006-1/(6.2+Math.pow(90*y,4));
 const values=[[-.3635,2.2124,-3.2937,1.8873],[-.1833,1.0383,-1.2943,.837]].map(co=>n*co.reduce((v,c)=>v*z+c,0));
 const b20=Math.max(.5,.95*(.56-1.94*y-82.5*y*y)),x=r/Di;
 return x<=.1?values[0]+(values[1]-values[0])*(x-.06)/.04:values[1]+(b20-values[1])*(x-.1)/.1;
 }
 let ey=5;for(let i=0;i<2000;i++)ey=(ey+B(ey)*P*C/ft)/2;
 return Math.max(P*R/(2*ft*g.v-P/2),ey,C*Math.pow(P/(111*fb)*Math.pow(Di/r,.825),2/3));
}
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name);throw e;}}
for(const [name,patch,n] of [['Zylinder',{},2],['Prüfdruck Mindestfaktor',{K:235},2],['Kugel',{shape:'sph'},4],['Naht',{v:.7},2],['Austenit',{steel:'aust',K:160,K20:250,Rm:550,RmT:420,A:35},2],['A30',{steel:'aust',K:160,K20:250,Rm:550,RmT:420,A:30},2]]){
 test(name,()=>{const g=input('en_shell',patch),r=modules.en_shell.calc(g,AD.h),F=f(g),fa=f(g,true),P=g.p/10,ea=g.sn-g.c1-g.c2;
 close(r.headline.value,P*g.Da/(n*F*g.v+P)+g.c1+g.c2);
 close(r.pmax,10*n*F*g.v*ea/(g.Da-ea));
 const pt=Math.max(1.25*g.p*fa/F,1.43*g.p);close(r.test.PT,pt);
 close(r.test.req,(pt/10)*g.Da/(n*(g.K20/1.05)*1+pt/10)+g.c1); // §5.6: z = 1 im Prüfzustandassert(!r.fail);
 });
}
test('Zugfestigkeit maßgebend',()=>{const g=input('en_shell',{K:400,Rm:240}),r=modules.en_shell.calc(g,AD.h);close(r.headline.value,1000/(200+1)+1.5);});
test('Überlastung',()=>{const g=input('en_shell',{p:200,sn:3}),r=modules.en_shell.calc(g,AD.h);close(r.headline.value,20*1000/(240+20)+1.5);assert(r.fail&&r.util>1&&!r.test.ok);});
test('Dickwandiger Bereich',()=>{const g=input('en_shell',{sn:200}),r=modules.en_shell.calc(g,AD.h);close(r.headline.value,1000/241+1.5);assert(r.fail&&Number.isNaN(r.pmax));});
test('Ungültige Eingabe',()=>{assert(modules.en_shell.calc(input('en_shell',{Da:NaN}),AD.h).fail);});
for(const [name,patch] of [['Torisphäre',{}],['Ellipsoid',{head:'ell',hi:244}],['Austenit Boden',{steel:'aust',K:170,K20:250,Rm:550,RmT:440,A:35,Rp02:130,Rp0220:200}],['Krempe 0,06Di',{r:59.62}],['Krempe 0,2Di',{r:195.8}]]){
 test(name,()=>{const g=input('en_head',patch),r=modules.en_head.calc(g,AD.h),fb=(g.steel==='aust'?g.Rp02:g.K)/1.5;
 close(r.headline.value,expectedHead(g,g.p/10,f(g),fb)+1.5);assert(!r.fail);
 const pt=Math.max(1.25*g.p*f(g,true)/f(g),1.43*g.p);close(r.test.PT,pt);
 close(r.test.req,expectedHead(g,pt/10,g.K20/1.05,(g.steel==='aust'?g.Rp0220:g.K20)/1.05,true)+.5);
 });
}
test('Halbkugel',()=>{const g=input('en_head',{head:'hemi',R:NaN,r:NaN}),r=modules.en_head.calc(g,AD.h);close(r.headline.value,1000/481+1.5);assert(!r.fail);});
test('Ellipsoid außerhalb Bereich',()=>{const g=input('en_head',{head:'ell',hi:400}),r=modules.en_head.calc(g,AD.h);assert(976/(2*g.hi)<1.7);assert(r.fail);});
test('Torisphäre außerhalb Bereich',()=>{const r=modules.en_head.calc(input('en_head',{r:30}),AD.h);assert(30/976<.06);assert(r.fail);});
test('Kegel konservative Grenze',()=>{const g=input('en_cone'),r=modules.en_cone.calc(g,AD.h),a=Math.PI/6;
 const cone=1000/(241*Math.cos(a));
 const j=Math.pow(Math.pow(988,1.5)*Math.sqrt(Math.tan(a))/(6*120),2/3);
 close(r.headline.value,Math.max(cone,j)+1.5);assert(r.fail&&Number.isNaN(r.pmax)&&r.test===null);assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
test('Kegel außerhalb Winkel',()=>{const g=input('en_cone',{alpha:80}),r=modules.en_cone.calc(g,AD.h);assert(80>75);assert(r.fail&&r.notes.some(n=>n[0]==='e'));});
for(const m of Object.values(modules)){test('Vertrag '+m.id,()=>{const r=m.calc(input(m.id),AD.h);for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r);assert.equal(m.group,'EN 13445');});}

test('1: Stahlguss Betrieb und Prüfung, unabhängige Handrechnung',()=>{
 const g=input('en_shell',{product:'casting',K:240,K20:240,Rm:420,Da:1000,sn:10,p:30,c1:0,c2:0});
 const r=modules.en_shell.calc(g,AD.h);
 // 240/1.9 = 126.315789; 420/3 = 140; P=3 MPa.
 close(r.headline.value,3000/(480/1.9+3));assert(r.headline.value>10&&r.fail&&!r.test.ok);
 close(r.rows.find(x=>x[1]==='ftest')[2],240/1.33);
 close(r.test.req,4290/(480/1.33+4.29));
 const good=modules.en_shell.calc({...g,sn:20},AD.h);
 close(good.pmax,20*(240/1.9)*20/980);assert(!good.fail);
 // Rm branch, independent of yield branch.
 const tensile=modules.en_shell.calc({...g,K:400,K20:400,sn:20},AD.h);
 close(tensile.headline.value,3000/283);
});
test('1: Produktform fehlt oder ist unbekannt: keine Freigabe',()=>{
 for(const product of [undefined,'unknown','other']){
  const r=modules.en_shell.calc(input('en_shell',{product}),AD.h);
  assert(r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
 }
 assert.equal(modules.en_shell.fields.find(f=>f.id==='product').def,'wrought');
 const r=modules.en_shell.calc(input('en_shell',{product:'casting',steel:'aust'}),AD.h);
 assert(r.fail&&!r.test.ok);
});
test('3: Korrodierter Boden verwirft bisherigen falschen Pass',()=>{
 const g=input('en_head',{Da:1000,sn:10,c1:0,c2:2,R:1000,r:60,p:8.84});
 const r=modules.en_head.calc(g,AD.h);
 // Di=1000-2*(10-2)=984; C=.75*1000+.2*984=946.8.
 // Knuckle yielding governs: beta06=1.1555042701165912,
 // beta10=.8500041341356108; interpolation at r/Di=60/984 gives beta=1.1480530472877868.
 const limit=120*8/(1.1480530472877868*946.8)*10;
 assert(Math.abs(limit-8.831837)<.000001);assert(r.fail&&r.headline.value>10&&!r.test.ok);
 close(r.rows.find(x=>x[1]==='Di')[2],984);
 close(r.headline.value,expectedHead(g,.884,120,120)+2);
 const pt=Math.max(1.25*8.84*150/120,1.43*8.84);
 close(r.test.req,expectedHead(g,pt/10,235/1.05,235/1.05,true));
});
test('4: Einlagige maßgebende Naht und unbekannte Route gesperrt',()=>{
 const g=input('en_shell',{Da:1000,sn:4,c1:0,c2:1,p:7});
 // §10.2.3.3.1(c): Fk=2.1 => PT=2.1*7*(150/120)=18.375 bar.
 // Required test wall = 1837.5/(2*235/1.05+1.8375)=4.0883 > 4.
 close(2.1*7*150/120,18.375);assert(1837.5/(470/1.05+1.8375)>4);
 for(const weldRoute of ['single','unknown',undefined]){
  const r=modules.en_shell.calc({...g,weldRoute},AD.h);
  assert(r.fail&&!r.test.ok&&Number.isNaN(r.pmax));
  assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('10.2.3.3.1(c)')));
 }
 assert(!modules.en_shell.calc(g,AD.h).fail);
});

console.log(`PASS ${passed}/${total}`);
