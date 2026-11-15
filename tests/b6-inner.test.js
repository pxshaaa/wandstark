'use strict';
// Independent global-radius integrals, AD 2000 B6 10.2006 §7.4.1 (9)–(12),
// Bilder 2/3 (inner arrangement dashed). Da remains in (10), Dm² in (11).
// Cross-check only: EN13445-3:2021 §8.5.3.6 (28)/(29), §8.5.3.8,
// Fig.8.5-17 and (52)/(53); ASME VIII-1 UG-29(a)–(c), UG-30.
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/profiles.js');require('../modules/b6.js');
const m=AD.modules.find(x=>x.id==='b6');
const base={...Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])),
 Da:1000,sn:8,l:1000,ringSpacing:1000,rings:'yes',p:.1,c1:0,c2:0,E:210000,K:235,K20:235,S:1.6,ST:1.1,T:20,ringK:235,ringS:1.6};
let passed=0,total=0;
function test(name,f){total++;try{f();passed++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
function near(a,b,eps=2e-9){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const calc=g=>m.calc({...base,...g}),row=(r,k)=>r.rows.find(x=>x[1]===k)?.[2];
// Hardcoded catalogue values, not read from AD.profiles; installed orientation:
// L/T free flange away from shell; UPN rotated, opening towards shell.
const cases=[
 ['FL','FL 40x5','flat',{a:200,z:20,i:5*40**3/12,is:40*5**3/12,h:40,b:5}],
 ['L','L 50x5','angle',{a:480,z:36,i:109600,is:109600,h:50,b:5}],
 ['UPN','UPN 100','channel',{a:1350,z:34,i:293000,is:2060000,h:50,b:0}],
 ['T','T 60','tee',{a:794,z:43.4,i:238000,is:122000,h:60,b:7}],
 ['RHS','RHS 100x60x4','hollow',{a:1170,z:50,i:1530000,is:687000,h:100,b:44}],
 ['IPE','IPE 80','ibeam',{a:2*46*5.2+3.8*69.6,z:40,i:Math.min(801300,2*(46*5.2**3/12+46*5.2*37.4**2)+3.8*69.6**3/12),is:2*5.2*46**3/12+69.6*3.8**3/12,h:80,b:46}]
];
function shell(g){
 const t=g.sn-g.c1-g.c2,R=g.Da/2,lambda=Math.PI*R/g.ringSpacing,x=t/R,S=Math.max(1.6,g.S),sk=Math.max(3,g.SK,2.25+.5*g.u);
 let pe=Infinity;
 for(let n=2;n<=2000;n++){if(n<=lambda)continue;const a=1+(n/lambda)**2;
 pe=Math.min(pe,10*g.E/sk*(x/((n*n-1)*a*a)+x**3/(12*(1-g.nu**2))*(n*n-1+(2*n*n-1-g.nu)/a)));}
 const ratio=g.Da/g.ringSpacing,pp=ratio<=5?10*g.K/S*x/(1+.03*g.u*(1-.2*ratio)/x):Math.max(10*g.K/S*x,30*g.K/S*(t/g.ringSpacing)**2);
 return Math.min(pe,pp);
}
function hand(g,q){
 const t=g.sn-g.c1-g.c2,R=g.Da/2,inside=g.ringPos==='inside',sign=inside?-1:1;
 const lm=g.widthMode==='input'?g.shellWidth:Math.min(g.ringSpacing,1.1*Math.sqrt(g.Da*t)+q.b),As=lm*t,A=As+q.a;
 const face=inside?R-t:R,rs=R-t/2,rr=face+sign*q.z;
 const rc=(As*rs+q.a*rr)/A;
 // Moments about shell centre, then translate to the global composite centroid.
 const I=lm*t**3/12+As*(rs-rc)**2+q.i+q.a*(rr-rc)**2;
 const rmin=inside?face-q.h:R-t,rmax=inside?R:R+q.h,W=I/Math.max(rc-rmin,rmax-rc),Dm=2*rc;
 const pe=240*g.E*I/((1-g.nu**2)*(g.Da-t)*Dm**2*g.ringSpacing),sk=Math.max(3,g.SK,2.25+.5*g.u);
 const a=lm*g.Da/(20*A),b=g.ringSpacing*g.Da**2*g.u/(8000*W),c=sk/pe,F=g.ringK/Math.max(g.ringS,g.S,1.6),B=a+b+F*c;
 const pr=2*F/(B+Math.sqrt(B*B-4*a*c*F));
 return {lm,Am:A,e:sign*(rc-face),Im:I,Wm:W,Dm,pe,'σr':g.p*(a+b/(1-c*g.p)),p_ring:pr,pmax:Math.min(shell(g),pr)};
}
for(const [type,name,section,q] of cases)for(const patch of [{},{c1:.4,c2:.6},{widthMode:'input',shellWidth:60},{Da:1400,sn:12,ringSpacing:1600}])test('global-radius hand calculation '+name+' '+JSON.stringify(patch),()=>{
 const pair={};
 for(const ringPos of ['outside','inside']){
  const g={...base,...patch,ringPos,ringSource:'standard',ringProfileType:type,['ringSize'+type]:name},r=calc(g),ex=hand(g,q);
  assert.equal(r.fail,false,r.notes.filter(n=>n[0]==='e').join(';'));
  for(const [k,v] of Object.entries(ex))near(k==='pmax'?r.pmax:row(r,k),v);
  near(row(r,'Ar'),q.a);near(row(r,'er'),q.z);near(row(r,'Ir'),q.i);near(row(r,'Is'),q.is);
  const t=g.sn-g.c1-g.c2;
  if(ringPos==='inside'){assert.ok(row(r,'Dm')<g.Da);assert.ok(row(r,'Dm')>g.Da-2*t-2*q.h);}
  assert.equal(calc({...g,p:r.pmax}).fail,false);assert.equal(calc({...g,p:r.pmax*(1+1e-6)}).fail,true);
  const tr=calc({...g,testMode:'external',pTest:g.p,ETest:g.E,ringK20:g.ringK});assert.equal(tr.test.ok,true);near(row(tr,'σr′'),ex['σr']);
  pair[ringPos]=r;
 }
 const out=pair.outside,inn=pair.inside;
 for(const k of ['Ar','er','Ir','Is','lm','Am','e','Im','Wm'])near(row(inn,k),row(out,k));
 const g={...base,...patch};near(row(inn,'Dm')+row(out,'Dm'),2*(g.Da-g.sn+g.c1+g.c2));
 // Identical section and load: the only capacity/stress change is Dm² in pe.
 near(row(inn,'pe')/row(out,'pe'),(row(out,'Dm')/row(inn,'Dm'))**2);
 assert.ok(row(inn,'pe')>row(out,'pe'));assert.ok(row(inn,'σr')<row(out,'σr'));assert.ok(inn.pmax>=out.pmax);
});
// Direct signed rectangle integrals for genuinely custom sizes, no catalogue match.
function sharp(section){
 const h=83,b=63,tw=12,tf=10,w=6;
 let rects;
 if(section==='flat')rects=[[14,h,h/2]];
 if(section==='angle'||section==='tee')rects=[[tw,h-tf,(h-tf)/2],[b,tf,h-tf/2]];
 if(section==='channel')rects=[[b,tw,h-tw/2],[2*tf,h-tw,(h-tw)/2]];
 if(section==='ibeam')rects=[[b,tf,tf/2],[tw,h-2*tf,h/2],[b,tf,h-tf/2]];
 if(section==='hollow')rects=[[b,h,h/2],[-(b-2*w),h-2*w,h/2]];
 const a=rects.reduce((s,[b,h])=>s+b*h,0),z=rects.reduce((s,[b,h,z])=>s+b*h*z,0)/a;
 return {a,z,i:rects.reduce((s,[b,h,v])=>s+b*h**3/12+b*h*(v-z)**2,0),h,b:section==='flat'?14:section==='channel'?2*tf:section==='ibeam'||section==='hollow'?b:tw};
}
for(const [type,section] of [['FL','flat'],['L','angle'],['UPN','channel'],['T','tee'],['IPE','ibeam'],['HEA','ibeam'],['HEB','ibeam'],['RHS','hollow']])for(const source of ['manual','custom'])test('independent sharp '+type+' '+source,()=>{
 const g={...base,ringPos:'inside',ringSource:source==='manual'?'manual':'standard',ringSection:section,ringProfileType:type,['ringSize'+type]:'custom',ringH:83,ringB:14,ringBf:63,ringTw:12,ringTf:10,ringWall:6};
 const r=calc(g),ex=hand(g,sharp(section));assert.equal(r.fail,false);
 for(const [k,v] of Object.entries(ex))near(k==='pmax'?r.pmax:row(r,k),v);
 // User-entered composite must reproduce the same inner arrangement exactly.
 const u=calc({...g,ringSource:'manual',ringSection:'user',ringA:ex.Am,ringI:ex.Im,ringW:ex.Wm,ringDm:ex.Dm,ringIs:row(r,'Is'),ringB:sharp(section).b});
 assert.equal(u.fail,false);near(u.pmax,r.pmax);near(row(u,'σr'),ex['σr']);
});
for(const ringPos of ['outside','inside'])test('all existing lateral/local/width limits retained '+ringPos,()=>{
 const g={ringSource:'manual',ringPos,p:0};
 const boundary=80**4/3000;
 for(const patch of [
  {ringSection:'flat',ringB:10,ringH:80+1e-7},
  {ringSection:'angle',ringH:80,ringTw:10,ringTf:10,ringBf:150+1e-6},
  {ringSection:'angle',ringH:120,ringTw:10,ringTf:10,ringBf:130,E:23500*(1-1e-7)},
  {ringSection:'channel',ringH:80,ringTw:1,ringTf:1,ringBf:60},
  {ringSection:'hollow',ringH:80,ringWall:1,ringBf:60},
  {ringSection:'user',ringDm:ringPos==='inside'?950:1050,ringIs:boundary*(1-1e-8)},
  {ringSection:'flat',widthMode:'input',shellWidth:1.1*Math.sqrt(8000)+12+1e-6}
 ])assert.equal(calc({...g,...patch}).fail,true,JSON.stringify(patch));
 assert.equal(calc({...g,ringSection:'flat',ringB:10,ringH:80}).fail,false);
 assert.equal(calc({...g,ringSection:'user',ringDm:ringPos==='inside'?950:1050,ringIs:boundary}).fail,false);
});
test('axis clearance applies to dimensions and supplied composites, including corrosion',()=>{
 for(const ringSection of ['flat','user'])for(const c1 of [0,1]){
  const g={ringPos:'inside',ringSource:'manual',ringSection,Da:200,sn:5,ringSpacing:200,ringB:20,ringH:95,ringDm:100,c1,p:0,ringIs:1e7};
  assert.ok(calc(g).notes.some(n=>n[0]==='e'&&n[1].includes('Behälterachse')));
  assert.equal(calc({...g,ringH:95-1e-6}).fail,false);
 }
});
test('manual inner centroid bounds reject stale outside diameter',()=>{
 const g={ringPos:'inside',ringSource:'manual',ringSection:'user',p:0};
 for(const ringDm of [1040,1000,824,823])assert.equal(calc({...g,ringDm}).fail,true);
 assert.equal(calc({...g,ringDm:950}).fail,false);
});
test('monotonic inner pressure, stiffness, spacing and ovality',()=>{
 const g={ringPos:'inside',ringSource:'manual',ringSection:'flat',ringH:80,ringB:12,p:.001},r=calc(g);
 assert.ok(calc({...g,E:base.E*1.1}).pmax>=r.pmax);
 assert.ok(calc({...g,ringSpacing:base.ringSpacing*.9}).pmax>=r.pmax);
 assert.ok(calc({...g,u:base.u*1.1}).pmax<=r.pmax);
 assert.ok(calc({...g,ringB:14}).pmax>=r.pmax);
 near(calc({...g,p:0}).pmax,r.pmax);near(row(calc({...g,p:0}),'σr'),0);
 near(row(calc({...g,u:0}),'σr'),g.p*row(r,'lm')*base.Da/(20*row(r,'Am')));
});
test('both extreme fibres used after reflection, shell-side fibre governs',()=>{
 const q={a:2300,z:(300*15+2000*40)/2300,i:10*30**3/12+300*(15-(300*15+2000*40)/2300)**2+100*20**3/12+2000*(40-(300*15+2000*40)/2300)**2,h:50,b:10};
 for(const ringPos of ['inside','outside']){
  const g={...base,ringSource:'manual',ringSection:'tee',ringPos,ringH:50,ringBf:100,ringTw:10,ringTf:20},r=calc(g),ex=hand(g,q);
  assert.equal(r.fail,false);assert.ok(row(r,'e')+8>50-row(r,'e'));
  near(row(r,'Wm'),row(r,'Im')/(row(r,'e')+8));near(row(r,'Wm'),ex.Wm);near(row(r,'σr'),ex['σr']);
 }
});
for(const [type,list] of Object.entries(AD.profiles))for(const p of list)test('catalogue mirrored properties and checks '+p.name,()=>{
 const g={ringSource:'standard',ringProfileType:type,['ringSize'+type]:p.name,p:0},o=calc({...g,ringPos:'outside'}),i=calc({...g,ringPos:'inside'});
 for(const k of ['Ar','er','Ir','Is','Am','e','Im','Wm'])near(row(i,k),row(o,k));
 near(row(i,'Dm')+row(o,'Dm'),2*(base.Da-base.sn));
 assert.equal(i.fail,o.fail); // same geometric, lateral and plate limits
 if(!i.fail){assert.ok(i.pmax>=o.pmax);near(row(i,'pe')/row(o,'pe'),(row(o,'Dm')/row(i,'Dm'))**2);}
});
test('inner matching custom catalogue envelope and external test state',()=>{
 const g={ringPos:'inside',ringSource:'manual',ringSection:'hollow',ringH:40,ringBf:20,ringWall:2,p:.001};
 const r=calc(g),cat=calc({ringPos:'inside',ringSource:'standard',ringProfileType:'RHS',ringSizeRHS:'RHS 40x20x2',p:.001});
 near(r.pmax,cat.pmax);assert.ok(row(r,'p_ring,geo')>r.pmax);
 assert.equal(calc({...g,p:r.pmax*(1+1e-6)}).fail,true);
 const tr=calc({...g,testMode:'external',pTest:r.pmax*1.01,ETest:base.E,ringK20:base.ringK});
 assert.equal(tr.test.ok,false);assert.equal(tr.fail,true);
});
for(const [type,name] of cases) test('drawing mirrored and contained '+name,()=>{
 for(const ringPos of ['outside','inside']){
  const g={...base,ringPos,ringSource:'standard',ringProfileType:type,['ringSize'+type]:name},r=calc(g),svg=m.draw(g,AD.h,r);
  assert.ok(!/NaN|Infinity|undefined/.test(svg));
  for(const e of svg.matchAll(/<(rect|line|text|circle)\b([^>]*)>/g)){
   const a=Object.fromEntries([...e[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
   for(const k of ['x','x1','x2','cx','y','y1','y2','cy'])if(a[k]!==undefined){const v=+a[k];assert.ok(v>=0&&v<=(k.includes('x')?420:320),k+' '+v);}
   if(e[1]==='rect'){assert.ok(+a.x+(+a.width)<=420);assert.ok(+a.y+(+a.height)<=320);}
  }
  const groups=[...svg.matchAll(/<g data-p="([^"]*\bringPos\b[^"]*)">([\s\S]*?)<\/g>/g)];assert.equal(groups.length,4);
  // Detail attachment surface is y=72 inside, y=163 outside. All profile
  // material extends towards the selected side; shell itself is not tagged.
  for(const rect of groups[3][2].matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"/g)){
   if(ringPos==='inside')assert.ok(+rect[2]>=72);else assert.ok(+rect[2]+(+rect[4])<=163.01);
  }
  for(const group of groups)assert.ok(!/ringK|ringS(?: |$)|ringA|ringI|ringW|ringDm|ringIs/.test(group[1]));
 }
});
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;
