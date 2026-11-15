'use strict';
// Independent oracles: tabulated numbers are transcribed here, never obtained
// from AD.profiles by the hand calculations. B6 10.2006 §7.4.1 (9)–(12).
// Tables: AM 2023-4 pp.100–109; SUALSA ficha técnica perfil T (d,Ix,Iy);
// Tata Hybox355 pp.13–14; SSAB Table2 RHS40x20; Tosyali L40x4.
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/profiles.js');require('../modules/b6.js');
const m=AD.modules.find(m=>m.id==='b6');
const base={...Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])),Da:1000,sn:8,l:1000,ringSpacing:1000,rings:'yes',p:.001,c1:0,c2:0,E:210000,K:235,K20:235,S:1.6,ST:1.1,T:20,u:1.5,nu:.3,ringK:235,ringS:1.6};
let passed=0,total=0;
function test(name,f){total++;try{f();passed++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
function near(a,b,tol=1e-9){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const calc=g=>m.calc({...base,...g}),row=(r,k)=>r.rows.find(q=>q[1]===k)?.[2];
// >=15 hardcoded source values, all axes/centroids/principal axes covered.
const samples=[
 ['UPN','UPN 50',{A:710,Iy:264000,Iz:91200,ys:14,r2:3.5}],
 ['UPN','UPN 100',{A:1350,Iy:2060000,Iz:293000,ys:16}],
 ['UPN','UPN 300',{A:5880,Iy:80300000,Iz:4950000,ys:27}],
 ['T','T 30',{A:226,Iy:17200,Iz:8700,zs:8.5}],
 ['T','T 60',{A:794,Iy:238000,Iz:122000,zs:16.6}],
 ['T','T 140',{A:3990,Iy:6600000,Iz:3300000,zs:38}],
 ['RHS','RHS 40x20x2',{A:214,Iy:40500,Iz:13400,zs:20,ys:10}],
 ['RHS','RHS 80x60x4',{A:1010,Iy:879000,Iz:561000}],
 ['RHS','RHS 200x100x4',{A:2290,Iy:12000000,Iz:4110000}],
 ['L','L 40x4',{A:308,Iy:44700,Iz:44700,ys:11.2,Iu:71000,Iv:18400,Iyz:-26300,tanAlpha:1}],
 ['L','L 50x5',{A:480,Iy:109600,Iz:109600,zs:14,Iu:174100,Iv:45200,Iyz:-64500}],
 ['L','L 100x10',{A:1920,Iy:1767000,Iz:1767000,zs:28.2,Iu:2807000,Iv:726600,Iyz:-1040000}],
 ['L','L 150x15',{A:4300,Iy:8981000,Iu:14270000,Iv:3690000,Iyz:-5291000}]
];
for(const [type,name,values] of samples)for(const [k,v] of Object.entries(values))test('source '+name+' '+k,()=>near(AD.profiles[type].find(p=>p.name===name)[k],v));
for(const type of ['UPN','T','RHS','L'])for(const p of AD.profiles[type])test('complete source properties '+p.name,()=>{
 for(const k of ['A','Iy','Iz','ys','zs'])assert.ok(Number.isFinite(p[k])&&p[k]>0,k);
 if(type==='L'){
  for(const k of ['Iu','Iv','Iyz','tanAlpha'])assert.ok(Number.isFinite(p[k]),k);
  near(p.Iu+p.Iv,p.Iy+p.Iz,.001);near((p.Iu-p.Iv)/2,-p.Iyz,.001);near(p.tanAlpha,1);
 }
});
// Independent shell equations in radius notation, fixed integer enumeration.
function shell(g){
 const R=g.Da/2,lam=Math.PI*R/g.ringSpacing,x=(g.sn-g.c1-g.c2)/R,sk=Math.max(3,g.SK,2.25+.5*g.u);
 let pe=Infinity;
 for(let n=2;n<=2000;n++){if(n<=lam)continue;const a=1+(n/lam)**2;
  pe=Math.min(pe,10*g.E/sk*(x/((n*n-1)*a*a)+x**3/(12*(1-g.nu*g.nu))*(n*n-1+(2*n*n-1-g.nu)/a)));}
 const q=g.Da/g.ringSpacing;
 const pp=q<=5?10*g.K/Math.max(1.6,g.S)*x/(1+.03*g.u*(1-.2*q)/x):Math.max(10*g.K/Math.max(1.6,g.S)*x,30*g.K/Math.max(1.6,g.S)*((g.sn-g.c1-g.c2)/g.ringSpacing)**2);
 return Math.min(pe,pp);
}
function composite(g,{Ar,er,Ir,Is,h,b}){
 const t=g.sn-g.c1-g.c2,l=g.ringSpacing,lm=Math.min(l,1.1*Math.sqrt(g.Da*t)+b),As=lm*t,A=Ar+As;
 // Raw moments about inner shell face, then translate once. Independent of module.
 const z=(As*t/2+Ar*(t+er))/A,e=z-t;
 const I=lm*t**3/3+Ir+Ar*(t+er)**2-A*z*z;
 const W=I/Math.max(z,t+h-z),Dm=g.ringPos==='inside'?g.Da-2*t-2*e:g.Da+2*e;
 const pe=240*g.E*I/((1-g.nu*g.nu)*(g.Da-t)*Dm*Dm*l);
 const a=lm*g.Da/(20*A),beta=l*g.Da*g.Da*g.u/(8000*W),c=Math.max(3,g.SK,2.25+.5*g.u)/pe,F=g.ringK/Math.max(g.ringS,g.S,1.6);
 const B=a+beta+F*c,pr=2*F/(B+Math.sqrt(B*B-4*a*c*F));
 return {Ar,er,Ir,Is,lm,Am:A,e,Im:I,Wm:W,Dm,pe,p_ring:pr,pmax:Math.min(shell(g),pr)};
}
// At least two sizes per series, actual installed axes and contact widths.
const cases=[
 ['UPN','UPN 50',{Ar:710,er:24,Ir:91200,Is:264000,h:38,b:0}],
 ['UPN','UPN 100',{Ar:1350,er:34,Ir:293000,Is:2060000,h:50,b:0}],
 ['T','T 30',{Ar:226,er:21.5,Ir:17200,Is:8700,h:30,b:4}],
 ['T','T 100',{Ar:2090,er:72.6,Ir:1790000,Is:883000,h:100,b:11}],
 ['RHS','RHS 40x20x2',{Ar:214,er:20,Ir:40500,Is:13400,h:40,b:12}],
 ['RHS','RHS 100x60x4',{Ar:1170,er:50,Ir:1530000,Is:687000,h:100,b:44}],
 ['L','L 50x5',{Ar:480,er:36,Ir:109600,Is:109600,h:50,b:5}],
 ['L','L 100x10',{Ar:1920,er:71.8,Ir:1767000,Is:1767000,h:100,b:10}]
];
for(const [type,name,props] of cases)for(const ringPos of ['outside','inside'])test('hand composite '+name+' '+ringPos,()=>{
 const g={...base,ringPos,ringSource:'standard',ringProfileType:type,['ringSize'+type]:name},r=calc(g),ex=composite(g,props);
 for(const k of Object.keys(ex).filter(k=>k!=='pmax'&&k!=='pe'&&k!=='p_ring'))near(row(r,k),ex[k]);
 near(row(r,'pe'),ex.pe);near(row(r,'p_ring'),ex.p_ring);near(r.pmax,ex.pmax);assert.equal(r.fail,false);
 const edge=calc({...g,p:r.pmax});assert.equal(edge.fail,false);assert.equal(calc({...g,p:r.pmax*(1+1e-7)}).fail,true);
});
// Signed rectangles integrated directly. No module helpers or catalogue data.
function sharp(section,h,b,tw,tf,t){
 let rects;
 if(section==='hollow')rects=[[b,h,0,h/2,1],[b-2*t,h-2*t,0,h/2,-1]];
 if(section==='channel')rects=[[b,tw,0,h-tw/2,1],[tf,h-tw,-(b-tf)/2,(h-tw)/2,1],[tf,h-tw,(b-tf)/2,(h-tw)/2,1]];
 if(section==='tee'||section==='angle')rects=[[tw,h-tf,0,(h-tf)/2,1],[b,tf,section==='angle'?(b-tw)/2:0,h-tf/2,1]];
 const Ar=rects.reduce((a,[w,v,x,z,s])=>a+s*w*v,0),er=rects.reduce((a,[w,v,x,z,s])=>a+s*w*v*z,0)/Ar;
 const x=rects.reduce((a,[w,v,x,z,s])=>a+s*w*v*x,0)/Ar;
 const Ir=rects.reduce((a,[w,v,x,z,s])=>a+s*(w*v**3/12+w*v*(z-er)**2),0);
 const Is=rects.reduce((a,[w,v,y,z,s])=>a+s*(v*w**3/12+w*v*(y-x)**2),0);
 const Ixz=rects.reduce((a,[w,v,y,z,s])=>a+s*w*v*(y-x)*(z-er),0);
 return {Ar,er,Ir,Is,Ixz,h,b:section==='hollow'?b:section==='channel'?2*tf:tw};
}
for(const [type,section] of [['L','angle'],['UPN','channel'],['T','tee'],['RHS','hollow']])for(const f of [1,1.25])test('hand sharp '+section+' scale '+f,()=>{
 const h=83*f,b=63*f,tw=12*f,tf=10*f,t=6*f;
 const input={ringH:h,ringBf:b,ringTw:tw,ringTf:tf,ringWall:t};
 const props=sharp(section,h,b,tw,tf,t),ex=composite(base,props);
 for(const source of ['manual','custom']){
  const g={...input,ringSource:source==='manual'?'manual':'standard',ringSection:section,ringProfileType:type,['ringSize'+type]:'custom'};
  const r=calc(g);for(const k of ['Ar','er','Ir','Is','lm','Am','e','Im','Wm','Dm','pe','p_ring'])near(row(r,k),ex[k]);
  near(row(r,'Ixz'),props.Ixz);near(r.pmax,ex.pmax);assert.equal(r.fail,false);
 }
});
// Matching nominal dimensions: geometry stays exact, pressure envelope prevents
// an optimistic radius-free bypass when catalogue radial I is smaller.
for(const type of ['UPN','T','RHS','L'])for(const p of AD.profiles[type])test('equivalent sharp pressure envelope '+p.name,()=>{
 const h=type==='UPN'?p.b:p.h,b=type==='UPN'?p.h:p.b,section={UPN:'channel',T:'tee',RHS:'hollow',L:'angle'}[type];
 const dims={ringH:h,ringBf:b,ringTw:p.tw||p.t,ringTf:p.tf||p.t,ringWall:p.t};
 const cat=calc({ringSource:'standard',ringProfileType:type,['ringSize'+type]:p.name});
 for(const source of ['manual','custom']){
  const r=calc({...dims,ringSource:source==='manual'?'manual':'standard',ringSection:section,ringProfileType:type,['ringSize'+type]:'custom'}),sp=sharp(section,h,b,p.tw||p.t,p.tf||p.t,p.t);
  near(row(r,'Ar'),sp.Ar);near(row(r,'Ir'),sp.Ir);near(row(r,'er'),sp.er);
  // Radius effects are bounded here against actual tabulated values, never assumed
  // to be a universal scaling of all moments/centroids.
  assert.ok(Math.abs(sp.Ar-p.A)/p.A<.10);assert.ok(Math.abs(sp.Ir-(type==='UPN'?p.Iz:p.Iy))/(type==='UPN'?p.Iz:p.Iy)<.25);
  if(!cat.fail&&!r.fail){assert.ok(Math.abs(r.pmax-cat.pmax)/cat.pmax<.25);if(sp.Ir>(type==='UPN'?p.Iz:p.Iy))assert.ok(r.pmax<=cat.pmax*(1+1e-12));}
 }
});
for(const type of ['UPN','T','RHS','L'])test('larger catalogue '+type,()=>{
 const pair=cases.filter(c=>c[0]===type).map(([type,name])=>calc({ringSource:'standard',ringProfileType:type,['ringSize'+type]:name}));
 assert.equal(pair[0].fail,false);assert.equal(pair[1].fail,false);assert.ok(pair[1].pmax>=pair[0].pmax);
});
test('L B6 lateral inertia boundary uses geometric Iz',()=>{
 const p=AD.profiles.L.find(p=>p.name==='L 50x5'),old=p.Iz,oldProduct=p.Iyz,g={ringSource:'standard',ringProfileType:'L',ringSizeL:p.name,p:0};
 try{p.Iyz=0;p.Iz=50**4/3000;assert.equal(calc(g).fail,false);p.Iz*=1-1e-8;const r=calc(g);assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));assert.ok(r.notes.some(n=>n[1].includes('Is < h⁴/3000')));}finally{p.Iz=old;p.Iyz=oldProduct;}
});
test('L class3 outstanding plate boundary retained',()=>{
 const g={ringSource:'manual',ringSection:'angle',ringH:80,ringTw:10,ringTf:10,ringBf:150,p:0};
 assert.equal(calc(g).fail,false);assert.equal(calc({...g,ringBf:150+1e-6}).fail,true);
});
for(const type of ['UPN','T','RHS','L'])for(const key of ['A','Iy','Iz',type==='UPN'?'ys':'zs'])test('missing catalogue property '+type+' '+key,()=>{
 const p=AD.profiles[type][0],old=p[key];try{p[key]=NaN;const r=calc({ringSource:'standard',ringProfileType:type,['ringSize'+type]:p.name});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));}finally{p[key]=old;}
});
test('EN supplementary proportions: constant boundary and lower E',()=>{
 const g={ringSource:'manual',ringSection:'angle',ringH:120,ringTw:10,ringTf:10,ringBf:130,E:23500,p:0};
 assert.equal(calc(g).fail,false);
 const r=calc({...g,E:23500*(1-1e-7)});assert.equal(r.fail,true);assert.ok(r.notes.some(n=>n[0]==='e'&&n[1].includes('(52)/(53)')));
});
test('custom radius envelope governs failure and external test state',()=>{
 const g={ringSource:'manual',ringSection:'hollow',ringH:40,ringBf:20,ringWall:2};
 const r=calc(g),cat=calc({ringSource:'standard',ringProfileType:'RHS',ringSizeRHS:'RHS 40x20x2'});
 near(r.pmax,cat.pmax);assert.ok(row(r,'p_ring,geo')>r.pmax);assert.ok(row(r,'Ir')>row(cat,'Ir'));
 const above=calc({...g,p:r.pmax*(1+1e-6)});assert.equal(above.fail,true);assert.ok(above.util>1);
 const tr=calc({...g,testMode:'external',ETest:210000,ringK20:235,pTest:r.pmax*1.01});
 assert.equal(tr.test.ok,false);assert.equal(tr.fail,true);
});
test('L composite restraint reaction includes product of inertia',()=>{
 const g={ringSource:'standard',ringProfileType:'L',ringSizeL:'L 50x5'},r=calc(g);
 const lm=1.1*Math.sqrt(1000*8)+5,As=lm*8,A=As+480;
 // axial centroid of rolled angle from its back minus half welded leg thickness
 const xr=14-2.5,Ixz=64500+480*As/A*xr*(36+4);
 near(row(r,'Ixz,m'),Ixz);near(row(r,'Mz/Mx'),Ixz/row(r,'Im'));assert.ok(Ixz>64500);
});
for(const key of ['ys','Iu','Iv','Iyz','tanAlpha'])test('missing L restraint property '+key,()=>{
 const p=AD.profiles.L[0],old=p[key];try{p[key]=NaN;const r=calc({ringSource:'standard',ringProfileType:'L',ringSizeL:p.name});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));}finally{p[key]=old;}
});
test('missing RHS contact radius fails closed',()=>{
 const p=AD.profiles.RHS[0],old=p.rOuter;try{p.rOuter=NaN;const r=calc({ringSource:'standard',ringProfileType:'RHS',ringSizeRHS:p.name});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));}finally{p.rOuter=old;}
});
for(const ringSection of ['angle','tee','channel','hollow'])test('larger sharp '+ringSection,()=>{
 const pmax=f=>calc({ringSource:'manual',ringSection,ringH:83*f,ringBf:63*f,ringTw:12*f,ringTf:10*f,ringWall:6*f}).pmax;
 assert.ok(pmax(1.25)>=pmax(1));
});
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
