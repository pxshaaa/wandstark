'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s3b.js');
const mods=['s3p','s3o'].map(id=>AD.modules.find(m=>m.id===id));
// Chart/Tafel values have no defaults any more (review fix); tests supply the former example values explicitly.
const EX={Cphi:.81,Cx:1.15,Kphi:.89,Kx:1.07,nphi:.1,nx:.1,mphi:.1,mx:.1};
const base=m=>{const d={...{p:10,T:20,K:150,K20:150,S:1.5,ST:1.05,v:1,c1:0,c2:0},...Object.fromEntries(m.fields.filter(f=>'def' in f).map(f=>[f.id,f.def]))}; for(const k in EX) if(k in d) d[k]=EX[k]; return d;};
const near=(a,b)=>assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const row=(r,s)=>{const x=r.rows.find(x=>x[1]===s);assert(x,s);return x[2];};
const contract=r=>{for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r,k);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);};
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error(name);throw e;}}
const [p,o]=mods;
// Independent hand calculation: R=1000, e=10, gamma=100,
// beta=cuberoot(32,000,000)/2000; ML=1,500,000.
// Conservative triangle bound can be checked by explicit 16 stress pairs.
function shellExpected(g){
 const radius=(g.Da-g.sn)/2,wall=g.sn-g.c1-g.c2,beta=Math.pow(g.bv*g.hv*g.hv,1/3)/(2*radius),moment=g.F*1000*g.ap;
 const loads=[radius*g.p/10/wall,radius*g.p/20/wall,g.nphi*moment*g.Cphi/radius**2/beta/wall,g.nx*moment*g.Cx/radius**2/beta/wall,6*g.mphi*moment/radius/(beta*g.Kphi)/wall**2,6*g.mx*moment/radius/(beta*g.Kx)/wall**2];
 const mises=(x,y)=>Math.hypot(x-y/2,Math.sqrt(3)*y/2);
 const membrane=[],combined=[];
 for(let mask=0;mask<16;mask++){const signs=[0,1,2,3].map(i=>(mask&(1<<i))?1:-1);const x=loads[0]+signs[0]*loads[2],y=loads[1]+signs[1]*loads[3];membrane.push(mises(x,y));combined.push(mises(x+signs[2]*loads[4],y+signs[3]*loads[5]));}
 const sm=Math.max(...membrane),st=Math.max(...combined),Z=1.5-.5*(sm/g.K)**2;
 return {sm,st,Z,util:Math.max(sm/(1.5*g.K/g.S),st/(1.5*Z*g.K/g.S))};
}
for(const [name,patch] of [['typisch',{}],['Zuschläge',{c1:.5,c2:.5}],['ohne Druck',{p:0}],['Zuglast null',{F:0}],['andere Abmessungen',{Da:1610,sn:10,bv:180,hv:360,end:180,ev:11,F:5}]])test('Pratze '+name,()=>{
 const g={...base(p),charts:'yes',...patch},r=p.calc(g,AD.h),ex=shellExpected(g);contract(r);near(row(r,'σmV'),ex.sm);near(row(r,'σgesV'),ex.st);near(row(r,'Z'),ex.Z);near(r.util,ex.util);assert.equal(r.fail,r.util>1);
});
test('Pratze Überlast',()=>{const r=p.calc({...base(p),charts:'yes',F:1000},AD.h);assert(r.util>1);assert(r.fail);});
test('Pratze Diagrammgrenze',()=>{const r=p.calc({...base(p),charts:'yes',bv:5000},AD.h);assert(r.fail);assert(r.notes.some(n=>n[0]==='e'));});
test('Pratze unbestätigte Tafel-/Diagrammwerte gesperrt',()=>{const r=p.calc(base(p),AD.h);assert(r.fail);assert(r.notes.some(n=>n[1].includes('nicht bestätigt')));});
test('Pratze ohne Blech ignoriert versteckte NaN',()=>{const r=p.calc({...base(p),pad:'no',bv:NaN,hv:NaN,ev:NaN},AD.h);contract(r);assert(r.fail);assert(Number.isNaN(r.util));});
test('Pratze ungültige Wand',()=>{const r=p.calc({...base(p),sn:0},AD.h);assert(r.fail);assert(Number.isNaN(r.util));});
// Independent hand-computed axial eye: F=20000 N, net A=1600 mm²,
// sigma=12.5 MPa, shear area=1600 mm² => tau=12.5 MPa,
// bearing=20000/(38*20), weld shear area=1200 mm².
for(const [name,patch] of [['axial',{}],['halbe Kraft',{F:10}],['dickeres Blech',{t:30}],['Zuschläge',{c1:1,c2:1}],['Schrägzug',{alpha:30}]])test('Öse '+name,()=>{
 const g={...base(o),...patch},r=o.calc(g,AD.h);contract(r);
 const wall=g.t-g.c1-g.c2,force=g.F*1000,vertical=force*Math.cos(g.alpha/180*Math.PI),horizontal=force*Math.sin(g.alpha/180*Math.PI);
 const sigma=vertical/((g.b-g.d)*wall)+6*horizontal*g.h/(wall*(g.b-g.d)**2),tau=force/((2*g.edge-g.d)*wall),bearing=force/g.dp/wall,weld=3*horizontal*g.h/g.a/g.l**2+Math.sqrt(3)*force/(2*g.a*g.l);
 near(row(r,'σ'),sigma);near(row(r,'τ'),tau);near(row(r,'σL'),bearing);near(row(r,'σw'),weld);
 const ex=Math.max((sigma+Math.sqrt(3)*horizontal/((g.b-g.d)*wall))/(g.K/g.S),Math.sqrt(3)*tau/(g.K/g.S),bearing/(g.K/g.S),weld/(g.K/g.S));near(r.util,ex);assert(r.fail);assert(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
test('Öse Überlast',()=>{const r=o.calc({...base(o),F:1000},AD.h);assert(r.util>1);assert(r.fail);});
test('Öse Winkelgrenze',()=>{const r=o.calc({...base(o),alpha:61},AD.h);assert(Number.isNaN(r.util));assert(r.fail);});
test('Öse Loch größer als Platte',()=>{const r=o.calc({...base(o),d:130},AD.h);assert(Number.isNaN(r.util));assert(r.fail);});
test('Öse ungültige Eingabe',()=>{const r=o.calc({...base(o),a:NaN},AD.h);contract(r);assert(r.fail);});
console.log(`PASS ${passed}/${total}`);
