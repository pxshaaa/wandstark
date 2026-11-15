'use strict';
const assert=require('assert');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s3.js');
const m=AD.modules.find(x=>x.id==='s3'),H=AD.h;
const base={...Object.fromEntries(m.fields.map(x=>[x.id,x.def])),p:5,K:235,K20:235,S:1.5,ST:1.1,v:1,c1:0,c2:1};
const near=(a,b)=>a===b?undefined:assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
// Independent worksheet: local limit is obtained by solving
// 3t²k² + (2+6tu)k - 3(1-u²)=0 by bisection (not the module's rationalisation).
function expected(g){
 const d=g.Da-2*g.sn,t=g.sn-g.c1-g.c2,allow=g.K/g.S;
 const w=g.weight*1000/(g.L+4*g.h/3),F=g.weight*500;
 const support=w*((g.a+2*g.h/3)**2/2-d*d/16);
 const mid=w*d*d/16+F*(g.L/2-g.a)-w*(g.L/2+2*g.h/3)**2/2;
 const shear=F*(g.L-2*g.a)/(g.L+4*g.h/3);
 const angle=g.angle/180*Math.PI,B=.91*g.b/Math.sqrt(d*t),Y=2.83*g.a/d*Math.sqrt(t/d);
 const c3=Math.max(.25,Math.exp(-B)*Math.sin(B)/B),c4=(1-Math.exp(-B)*Math.cos(B))/B;
 const c5=(1.15-.1432*angle)/Math.sin(angle/2),c6=Math.max(1.7-2.1*angle/Math.PI,0)/Math.sin(angle/2);
 const c7=(1.45-.43*angle)/Math.sin(angle/2),c8=Math.min(1,(.8*Math.sqrt(Y)+6*Y)/angle);
 const c9=1-.65*Math.sqrt(Math.PI/(3*angle))/(1+36*Y*Y),c10=1/(1+.6*Math.cbrt(d/t)*g.b/d*angle);
 function limit(a,b){
  if(b<0){a=-a;b=-b;} if(b>=1||1+3*a*b<=0)return 0;
  let lo=0,hi=100;
  for(let i=0;i<100;i++){let k=(lo+hi)/2;let q=3*a*a*k*k+(2+6*a*b)*k-3*(1-b*b);if(q>0)hi=k;else lo=k;}
  return (lo+hi)/2*g.K/1.2;
 }
 const long=4*Math.abs(support)/(Math.PI*d*d*t),pr=g.p*d/(40*t),norm=1.2/g.K;
 const l2=Math.min(limit(-.23*c6*c8/(c5*c3),-long*norm),limit(-.23*c6*c8/(c5*c3),(pr-long)*norm));
 const l3=Math.min(limit(-.53*c4/(c7*c9*c10*Math.sin(angle/2)),0),limit(-.53*c4/(c7*c9*c10*Math.sin(angle/2)),2*pr*norm));
 const cap2=.7*l2*Math.sqrt(d*t)*t/(c3*c5),cap3=.9*l3*Math.sqrt(d*t)*t/(c7*c9*c10);
 // S3/2 §8 polynomial grouped independently by powers of y.
 const x=g.L/d,y=d/t;
 const p0=1.6+(x-1)*(-.20924+.028702*x-.0029936*x*x+.000082748*x*x*x);
 const p1=(x-1)*(.0004795-.0000002391*x+.00000088174*x*x);
 const p2=(x-1)*(-.00000085692-.0000000075955*x),p3=(x-1)*.00000000048168;
 const k14=Math.max(1,p0+y*(p1+y*(p2+y*p3)));
 const sigF=(pr+4*Math.abs(mid)*k14/(Math.PI*d*d*t))/g.v;
 const sigS=(pr+long)/g.v,tau=2*Math.abs(shear)/(Math.PI*d*t);
 return {F,support,mid,shear,k14,l2,l3,cap2,cap3,sigF,tau,util:Math.max(sigF/allow,sigS/allow,F/(cap2||0),F/(cap3||0),tau*Math.sqrt(3)/allow)};
}
let pass=0,total=0;
function test(name,fn){total++;try{fn();pass++;console.log('OK '+name);}catch(e){console.error('FAIL '+name,e);process.exitCode=1;}}
for(const [name,patch]of [['Betrieb',{}],['Drucklos',{p:0}],['Anderer Winkel',{angle:90,a:600,weight:240}],['Überlast',{weight:10000}],['Halbkugel',{head:'hem',h:988,p:10}],['Verstärkungsblech',{pad:'yes',ep:12}]]){
 test(name,()=>{const g={...base,...patch},r=m.calc(g,H),v=expected(g);
  for(const [s,k]of [['Fi','F'],['Mi','support'],['MF','mid'],['Qi','shear'],['K14','k14'],['σgr,2','l2'],['σgr,3','l3'],['F2,zul','cap2'],['F3,zul','cap3'],['σF','sigF'],['τ','tau']])near(row(r,s),v[k]);
  near(r.util,v.util);assert.strictEqual(r.noUtil,false);assert.strictEqual(r.test,null);assert(Number.isNaN(r.pmax));assert(r.fail&&r.ok===false,'Incomplete stability must prevent full approval');
  if(name==='Überlast')assert(r.util>1);else assert(!Number.isNaN(r.util));
  assert(r.notes.some(x=>x[0]==='w'&&x[1].includes('UNVERIFIED')));
 });
}
test('Außerhalb Winkelbereich',()=>{const r=m.calc({...base,angle:45},H);assert(r.fail);assert(Number.isNaN(r.util));});
test('Ungültige Zahl',()=>{const r=m.calc({...base,Da:NaN},H);assert(r.fail);assert(r.rows.length===0);});
test('Blech ohne Festigkeitsgutschrift',()=>near(m.calc({...base,pad:'yes',ep:18},H).util,m.calc(base,H).util));
console.log(`PASS ${pass}/${total}`);
