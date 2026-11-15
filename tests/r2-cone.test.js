'use strict';
// Round 2, primary worksheets: AD 2000 Taschenbuch 2016, B2 (10/2000)
// pp. 190–203, B4 pp. 218–225, B13 (07/2012) pp. 326–334.
// (Normtext, nicht verlinkt)
// Coefficients below independently read from the printed diagrams, not imported.
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
for(const id of ['b2','b4','b13'])require('../modules/'+id+'.js');
const modules=Object.fromEntries(AD.modules.map(m=>[m.id,m]));
const shared={p:10,K:180,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0};
const base=id=>({...shared,...Object.fromEntries(modules[id].fields.map(f=>[f.id,f.def]))});
let pass=0,total=0,seed=0x213b40;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function test(name,fn){total++;try{fn();pass++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function near(a,b,tol=1e-9){assert(Number.isFinite(a)&&Number.isFinite(b),`${a} / ${b} finite`);assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const row=(r,s)=>{const x=r.rows.find(x=>x[1]===s);assert(x,'missing '+s);return x[2];};
function finitePass(r){if(!r.fail){for(const x of [r.headline.value,r.util,r.pmax,...r.rows.map(x=>x[2]),...(r.test?[r.test.PT,r.test.req,r.test.have]:[])])assert(Number.isFinite(x),'nonfinite passing result '+x);assert(r.util<=1);assert(!r.test||r.test.ok);}}
function drawing(id,g,r){const svg=modules[id].draw(g,undefined,r);assert(svg.startsWith('<svg'));assert(!/NaN|Infinity|undefined/.test(svg),'nonfinite drawing');const fields=new Set([...modules[id].fields.map(f=>f.id),'p']);for(const m of svg.matchAll(/data-p="([^"]+)"/g))for(const id of m[1].split(' '))assert(fields.has(id),'tag for nonexistent input '+id);return svg;}
// Closed form worksheet: choose x, directly expand printed polynomial and
// compute p. Expected x is prescribed, never obtained through a module solver.
const charts=[
 [10,[.8176136502,1.0381861882,.0622158210,.0096929535],[.0597195135,-.2412593780,-.1880642590,-.0324536587]],
 [20,[-.1430803135,.1381824165,-.1765906005,-.0065026025],[-1.4462692977,-.8328006417,-.1486039657,-.0281519950]],
 [30,[-.3500365835,-.2440822374,-.3246595673,-.0190535072],[-3.6181287755,-2.6258109205,-.5453370384,-.0635460883]],
 [40,[.8575902466,.5378481964,-.1986685329,-.0125237427],[-8.8199247674,-6.4515131511,-1.3258437675,-.1177022189]],
 [50,[1.2789917860,.8377077949,-.1656688432,-.0118934136],[-5.0206287530,-3.5637644804,-.5711850721,-.0600216109]],
 [60,[1.8694396440,1.3659163860,-.0648173574,-.0057345617],[.0553080284,-.0511260440,.3015922949,.0090201888]],
 [70,[-.3134405430,.0067874373,-.3697977429,-.0270859480],[17.879816063,11.917959356,2.9083873997,.1924692668]]
];
function chartP(c,x,y,A){const L=Math.log(x),a=c[1],b=c[2];return 15*A*Math.exp(a[0]+a[1]*L+a[2]*L*L+a[3]*L*L*L+y*(b[0]+b[1]*L+b[2]*L*L+b[3]*L*L*L));}
for(const ch of charts)for(const y of [0,.05,.15])test(`B2 oracle ${ch[0]} y=${y}`,()=>{
 const g={...base('b2'),phi:ch[0],sn:35,Da:1000,junction:y?'knuckle':'sharp',r:y*1000,c1:.5,c2:1,K20:400,ST:.5};
 const x=.014,A=g.K/g.S*g.v;g.p=chartP(ch,x,y,A);
 const r=modules.b2.calc(g),sg=1000*g.p/((20*A-g.p)*Math.cos(ch[0]*Math.PI/180));
 near(row(r,'sl,0'),14);near(row(r,'sg,0'),sg);near(r.headline.value,Math.max(14,sg)+1.5);
 near(row(r,'p_l'),chartP(ch,.0335,y,A));near(row(r,'p_g'),20*A*33.5*Math.cos(ch[0]*Math.PI/180)/(1000+33.5*Math.cos(ch[0]*Math.PI/180)));
 finitePass(r);
});
// B4 beta and pressure directly from Eq. (5)–(8). Five prescribed thicknesses.
function beta(R,t,di){const sin=di/(2*R);return Math.max(1.85,1+.833*Math.sqrt(R/t)*sin*Math.sqrt(1-sin*sin));}
for(const [R,t,di,K] of [[600,12,600,180],[400,8,500,200],[1000,25,900,160],[300,6,450,140],[800,40,1600,220]])test('B4 oracle '+R,()=>{
 const g={...base('b4'),R,di,dk:di+100,Da:di+200,sn:1.5*t+1.5,r:30,K,c1:.5,c2:1,K20:500,ST:.5};
 g.p=20*K*t/(1.5*R*beta(R,t,di));const r=modules.b4.calc(g);
 near(r.headline.value,t+1.5);near(r.util,(t+1.5)/g.sn);near(row(r,'β'),beta(R,g.sn-1.5,di));
 near(r.pmax,20*K*(g.sn-1.5)/(1.5*R*beta(R,g.sn-1.5,di)));finitePass(r);
});
for(const [Di,h,r,s,p,v] of [[400,40,5,1,10,1],[200,20,4,.5,3,1],[600,60,10,2,8,.85],[150,25,5,1,20,.7],[900,100,25,3,2,1]])test('B13 oracle '+Di,()=>{
 const g={...base('b13'),Di,w:h,r,s,q:4*r,p,v};const out=modules.b13.calc(g);
 const sigma=(Di+s+h)*4*r*p/(40*s*(1.14*r+h)*v);near(row(out,'σum'),sigma);near(row(out,'Uum'),sigma/120);near(row(out,'K/1,5'),120);
 assert(out.fail&&out.util===Infinity&&Number.isNaN(out.pmax)&&out.test===null);assert(out.headline.text==='Nachweis offen');
});
// 360 deterministic valid geometries per module. Test-state strength deliberately
// generous here to isolate operating capacity; separate proof-only failures below.
for(const id of ['b2','b4'])for(let i=0;i<360;i++)test(`${id} property ${i}`,()=>{
 const m=modules[id],d=400+2400*random(),c1=random(),c2=random(),t=d*(.008+.065*random());
 const g={...base(id),K:100+200*random(),K20:800,ST:.5,v:.6+.4*random(),c1,c2,sn:t+c1+c2,r:30,
 ...(id==='b2'?{Da:d,phi:10+60*random(),junction:i%2?'sharp':'knuckle',r:d*(.01+.14*random())}:{R:d,di:d*(.3+1.6*random()),dk:2.1*d,Da:2.3*d})};
 const first=m.calc(g);assert(Number.isFinite(first.pmax)&&first.pmax>0);
 const at=m.calc({...g,p:first.pmax});near(at.util,1,1e-6);assert(!at.fail,JSON.stringify(at.notes.filter(x=>x[0]==='e')));finitePass(at);
 const above=m.calc({...g,p:first.pmax*(1+1e-6)});assert(above.fail&&above.util>1);
 const a=m.calc({...g,p:first.pmax*.4}),b=m.calc({...g,p:first.pmax*.7});
 assert(b.headline.value>=a.headline.value);assert(!a.fail&&!b.fail);finitePass(a);finitePass(b);
 const thicker=m.calc({...g,sn:g.sn*1.05,p:first.pmax*.4});assert(thicker.pmax>=a.pmax);
 const stronger=m.calc({...g,K:g.K*1.1,p:first.pmax*.4});assert(stronger.pmax>=a.pmax);
 // Da1 drives B2 equations; B4 da is a drawing dimension, R drives sizing.
 // Vary B4 R with constant di/R, retaining valid t/R and bolt geometry.
 const larger=m.calc({...g,p:first.pmax*.4,...(id==='b2'?{Da:g.Da*1.01,r:g.r*1.01}:{R:g.R*1.01,di:g.di*1.01})});
 assert(larger.headline.value>=a.headline.value);
 near(a.util,a.headline.value/g.sn);near(row(a,'s'),a.headline.value);near(row(a,'p_zul'),a.pmax);
 assert.equal(a.fail,a.util>1||!a.test.ok);assert.equal(above.test.ok,above.test.req<=g.sn);near(a.test.PT,Math.max(1.25*first.pmax*.4*g.K20/g.K,1.43*first.pmax*.4));
 assert(a.formula.includes(AD.h.fmt(a.pmax,3)));assert(a.formula.includes(AD.h.fmt(a.headline.value,3)));drawing(id,g,first);
 if(id==='b2'){
  const Da2=.5*g.Da,f=g.phi*Math.PI/180,Lk=(g.Da-Da2)/(2*Math.tan(f))+(g.junction==='knuckle'?(g.r+g.sn)*Math.tan(f/2):0); // tangent-circle geometry
  const dim=m.calc({...g,geoMode:'dims',Da2,Lk}),angle=m.calc({...g,geoMode:'angle'});
  if(dim._skip){} else if(!dim.fail||!angle.fail){near(row(dim,'φ'),g.phi,1e-6);near(dim.headline.value,angle.headline.value,1e-6);near(dim.pmax,angle.pmax,1e-6);}
  const svg=drawing(id,{...g,geoMode:'dims',Da2,Lk},dim);assert(!svg.includes('data-p="phi"'));
 }
});
for(let i=0;i<360;i++)test('b13 property '+i,()=>{
 const h=20+80*random(),s=h*(.02+.07*random()),r=h*(.1+.39*random()),Di=h*(4+80*random())-s;
 const g={...base('b13'),w:h,s,r,Di,q:4*r,p:1+50*random(),K:100+200*random(),v:.6+.4*random(),z:1+Math.floor(20*random()),movement:20*random()};
 const a=modules.b13.calc(g),b=modules.b13.calc({...g,p:2*g.p});
 const sigma=(Di+s+h)*g.q*g.p/(40*s*(1.14*r+h)*g.v);near(row(a,'σum'),sigma);near(row(b,'σum'),2*sigma);near(row(a,'Uum'),sigma/(g.K/1.5));
 assert(a.fail&&a.util===Infinity&&Number.isNaN(a.pmax)&&a.test===null);assert(a.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
 // No overall pmax or required thickness is defensible for the incomplete B13
 // proof. Check the independent circumference-only limit without granting a pass.
 const pLimit=(g.K/1.5)*40*s*(1.14*r+h)*g.v/((Di+s+h)*g.q);
 const at=modules.b13.calc({...g,p:pLimit}),above=modules.b13.calc({...g,p:pLimit*(1+1e-6)});
 near(row(at,'Uum'),1,1e-6);assert(at.fail);assert(row(above,'Uum')>1&&above.fail);drawing('b13',g,a);
});
// Every applicability boundary, exact endpoints, and immediately outside.
for(const [key,low,high] of [['phi',10,70],['sn',2,200]])for(const v of [low,high])test(`B2 boundary ${key} ${v}`,()=>{
 const g={...base('b2'),p:0,Da:2000,sn:20,[key]:v},r=modules.b2.calc(g);assert(!r.fail);finitePass(r);
 const outside={...g,[key]:v===low?low-1e-7:high+1e-7};assert(modules.b2.calc(outside).fail);
});
for(const r of [10,150])test('B2 r/Da '+r,()=>{const g={...base('b2'),p:0,junction:'knuckle',r};assert(!modules.b2.calc(g).fail);assert(modules.b2.calc({...g,r:r===10?r-1e-7:r+1e-7}).fail);});
for(const t of [3,60])test('B4 t/R '+t,()=>{const g={...base('b4'),p:0,sn:t,r:30};assert(!modules.b4.calc(g).fail);assert(modules.b4.calc({...g,sn:t===3?t-1e-7:t+1e-7}).fail);});
test('B4 di=2R and minimum radius',()=>{const g={...base('b4'),p:0,di:1200,dk:1300,Da:1400,r:24};assert(!modules.b4.calc(g).fail);assert(modules.b4.calc({...g,di:1200.00001}).fail);assert(modules.b4.calc({...g,r:23.99999}).fail);});
test('B4 minimum nominal thickness in result',()=>{const g={...base('b4'),R:100,di:100,dk:120,Da:150,sn:2,r:6,p:0},r=modules.b4.calc(g);assert(!r.fail);near(r.headline.value,2);near(r.test.req,2);assert(modules.b4.calc({...g,sn:1.999999}).fail);});
for(const [key,lo,hi] of [['d/h',3,100],['r/h',.1,.5],['s/h',.018,.1]])for(const v of [lo,hi])test(`B13 boundary ${key} ${v}`,()=>{
 const g={...base('b13'),w:100,s:2,r:20,q:80};
 const change=(x)=>key==='d/h'?{Di:100*x-g.s}:key==='r/h'?{r:100*x,q:400*x}:{s:100*x};
 const a=modules.b13.calc({...g,...change(v)});assert(Number.isFinite(row(a,'σum')));assert(a.fail);
 const out=modules.b13.calc({...g,...change(v===lo?v-1e-8:v+1e-8)});assert(Number.isNaN(row(out,'σum'))&&out.fail);
});
for(const id of ['b2','b4','b13']){
 const b=base(id),positive=modules[id].fields.filter(f=>!f.type&&f.min!=='zero'&&!f.when).map(f=>f.id);
 for(const key of new Set([...positive,'K','v',...(id==='b13'?[]:['K20','S','ST'])]))for(const v of [0,-1,NaN,Infinity,-Infinity])test(`${id} invalid ${key} ${v}`,()=>{const r=modules[id].calc({...b,[key]:v});assert(r.fail);});
 for(const patch of [{p:NaN},{p:-1},{p:Infinity},{v:1.01},{c1:-1},{c2:NaN},{c1:1000,c2:1000},{K:1e308},{K:1e-308},{p:1e308},{S:1e-308}])test(id+' edge '+JSON.stringify(patch),()=>{
  const r=modules[id].calc({...b,...patch});if(id==='b13')assert(r.fail);else assert(r.fail);finitePass(r);
 });
 for(const g of [null,undefined,{},b,{...b,p:NaN},{...b,sn:1e308,Da:1e308,Di:1e308,q:1e308},{...b,r:NaN}])test(id+' drawing edge '+String(g&&g.p),()=>{drawing(id,g,null);});
 test(id+' calc missing',()=>{assert(modules[id].calc(null).fail);assert(modules[id].calc(undefined).fail);});
}
test('B2 dimension mode with knuckle recovers the true angle',()=>{
 // Circle tangent geometry: for phi=30°, axial length measured from the
 // cylinder tangency plane is deltaR*cot(phi)+(r+sn)*tan(phi/2).
 const g={...base('b2'),geoMode:'dims',junction:'knuckle',Da:1000,Da2:600,r:150,sn:12};
 g.Lk=200/Math.tan(Math.PI/6)+162*Math.tan(Math.PI/12);
 const apparent=Math.atan(200/g.Lk)*180/Math.PI;assert(apparent<30);near(apparent,27.16054651865433,1e-6);
 const r=modules.b2.calc(g);near(row(r,'φ'),30,1e-9);assert(!drawing('b2',g,r).includes('Maße eingeben'));
 const direct=modules.b2.calc({...g,geoMode:'angle',phi:30});assert(!direct.fail);near(row(direct,'φ'),30);
});
for(const key of ['Da2','Lk'])for(const v of [0,-1,NaN,Infinity])test('B2 invalid dimension '+key+' '+v,()=>{
 assert(modules.b2.calc({...base('b2'),geoMode:'dims',[key]:v}).fail);
});
test('B2 unknown geometry mode rejected',()=>assert(modules.b2.calc({...base('b2'),geoMode:'typo'}).fail));
test('B2 collapsed small end round 1',()=>{const g={...base('b2'),geoMode:'dims',Da2:10,Lk:800,sn:20};assert(modules.b2.calc(g).fail);});
test('B4 unsupported seals remain blocked',()=>{for(const attachment of ['inside','loose','reinforced','welded','unknown'])assert(modules.b4.calc({...base('b4'),attachment}).fail);});
for(const id of ['b2','b4'])test(id+' proof-only failure agrees with state',()=>{const g={...base(id),K20:180,ST:1.5},m=modules[id];g.p=m.calc(g).pmax*.8;const r=m.calc(g);assert(r.util<1);assert(!r.test.ok&&r.fail);});
test('B13 overflow cannot report zero partial stress',()=>{
 const g={...base('b13'),p:.1,Di:3.01e154,w:1e154,q:4.1e153,r:1.025e153,s:9e152};
 const r=modules.b13.calc(g);assert(r.fail);assert(Number.isNaN(row(r,'σum')));assert(r.notes.some(n=>n[0]==='e'&&n[1].includes('Zahlenbereich')));
 // Dimensionless independent worksheet gives 0.04181 N/mm², not zero.
 near((3.1+1)*.41*.1/(40*.09*(1.14*.1025+1)),.04180905622459995,1e-12);
});
for(const id of ['b2','b4'])test(id+' nonfinite proof pressure is never a passing test state',()=>{
 const g={...base(id),K20:1e308,sn:id==='b2'?100:60,r:30};const r=modules[id].calc(g);assert(r.fail);assert(!r.test.ok);
});
console.log(`PASS ${pass}/${total}`);
