/* Round 2 independent worksheets + deterministic properties, 2026-11-14.
 * Historical primary text checked: B7 08.2007 §§5–8, B8 04.2015 §§7,8.4,
 * S3/1 09.2001 §§7,8.2, S3/2 02.2004 §§1,4,5,8, S3/4 09.2001 §§1,6,7.4:
 * (Normtext, nicht verlinkt)
 * (Normtext, nicht verlinkt)
 * Source-table crosscheck: all 792 Type11 dimensional cells match Emsal's
 * original DATA table (PN10/16/25/40, DN15–500), retrieved 2026-11-14:
 * https://emsalvana.com/en/en-1092-1-type-11
 * All 72 gasket ID/OD pairs checked against GORE EN1514-1:1997 IBC:
 * https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf
 * Applicability: these modules return pmax=NaN, test=null by design. B7/B8
 * accept independently established TOTAL bolt forces; no pressure conversion
 * can be inferred. S3/1, S3/2 and lifting-eye overall approval is always blocked.
 * Therefore pressure-capacity identities are NOT asserted for these modules.
 * Force boundaries and pressure-only S3/4 stress boundaries are tested instead.
 * B8 da is the flange OUTSIDE diameter: increasing ring width can reduce the
 * required blade thickness; generic cylinder-diameter monotonicity is inapplicable.
 */
'use strict';
const assert=require('node:assert/strict'),AD=require('../src/ad.js');
require('../data/flanges.js');
for(const p of ['b7b8','s3','s3b','s31'])require('../modules/'+p+'.js');
const H=AD.h,mods=Object.fromEntries(AD.modules.map(m=>[m.id,m]));
let count=0,passed=0,seed=0x71f12;
function test(name,f){count++;try{f();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);}}
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const between=(a,b)=>a+(b-a)*rand();
const base=id=>({p:5,T:20,K:235,K20:265,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(mods[id].fields.filter(f=>'def'in f).map(f=>[f.id,f.def])),...(id==='s3p'?{Cphi:.81,Cx:1.15,Kphi:.89,Kx:1.07,nphi:.1,nx:.1,mphi:.1,mx:.1,charts:'yes'}:{})});
const calc=(id,g)=>mods[id].calc(g,H);
const near=(a,b)=>assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const row=(r,s)=>{const x=r.rows.find(x=>x[1]===s);assert(x,s+' missing');return x[2];};
function contract(id,g,r){
 assert(Number.isNaN(r.pmax));assert.equal(r.test,null);
 assert.equal(typeof r.fail,'boolean');assert.equal(typeof r.formula,'string');
 if(!r.fail){assert(Number.isFinite(r.util));assert(r.util<=1);assert(Number.isFinite(r.headline.value));for(const x of r.rows)assert(Number.isFinite(x[2]),x[1]);}
 if(['s3','s31','s3o'].includes(id))assert(r.fail,'incomplete overall proof');
 if(['b7','b8'].includes(id)&&Number.isFinite(r.headline.value))near(r.util,r.headline.value/(id==='b7'?g.dk:g.hf));
 if(['s3p','s3o','s3'].includes(id)&&Number.isFinite(r.util))near(r.headline.value,100*r.util);
 if(Number.isFinite(r.util)){
  if(id==='b7'){near(r.headline.value,Math.max(...['dKB','dKE','dKP'].map(s=>row(r,s))));assert(r.formula.includes(H.fmt(r.headline.value)+' mm'));assert(r.testNote.includes('Prüfzustand'));}
  if(id==='b8'){near(r.headline.value,Math.max(row(r,'hAA'),row(r,'hBB')));assert(r.formula.includes(H.fmt(r.headline.value)+' mm'));assert(r.testNote.includes('Prüfzustand'));}
  if(id==='s3')near(r.util,Math.max(...r.rows.filter(x=>x[1]==='η').map(x=>x[2])));
  if(id==='s3p')assert(r.formula.includes(H.fmt(r.util*100)+' %'));
 }
 const svg=mods[id].draw(g,H,r);assert(svg.startsWith('<svg'));assert(!/NaN|Infinity|undefined/.test(svg));
 // Any interactive tags must refer to real input geometry, never stress/force.
 const geom=new Set(mods[id].fields.filter(f=>f.unit==='mm'||f.id==='n'||f.id==='angle').map(f=>f.id));
 for(const match of svg.matchAll(/data-fields="([^"]+)"/g))for(const k of match[1].split(/\s+/))assert(geom.has(k),'non-geometric tag '+k);
}
function boltOracle(g){
 const areaFactor=4/(Math.PI*Number(g.phi)*g.n);
 const bare=Math.sqrt(areaFactor*1.8*g.FB/g.KB);
 const allowance=bare<=20?3:bare>=50?1:3-(bare-20)*2/30;
 const secondary=(g.ratio==='high'?1.3:1.26)*areaFactor/g.KB20;
 return Math.max(bare+allowance,Math.sqrt(secondary*g.FV),Math.sqrt(secondary*g.FP));
}
function flangeOracle(g){
 const width=g.da-g.di-2*g.dL,neck=Math.min(g.sf,g.hf/3);
 const arm=[(g.dt-g.di-neck)/2,(g.dt-g.di-g.s1)/2],seal=(g.dt-g.dD)/2;
 const height=(g.ha-g.hf)/g.hf,taper=(g.sf+g.s1)/width;
 const B=(1+taper*height)/(1+taper*height*(height+2));
 const capacity=arm.map(a=>Math.max(g.FB*a/(g.K/g.S),g.FV*seal/(g.K20/g.ST),g.FP*a/(g.K20/g.ST)));
 const credits=[(g.di+neck)*neck**2,.75*(g.di+g.s1)*g.s1**2];
 return Math.max(Math.sqrt(Math.max(0,(1.27*capacity[0]-credits[0])/width)),B*Math.sqrt(Math.max(0,(1.27*capacity[1]-credits[1])/width)));
}
function bracketOracle(g){
 const R=(g.Da-g.sn)/2,e=g.sn-g.c1-g.c2,beta=Math.pow(g.bv*g.hv**2,1/3)/(2*R),ML=g.F*1000*g.ap;
 const x=R*g.p/(10*e),y=x/2,n=g.nphi*ML*g.Cphi/(R**2*beta*e),N=g.nx*ML*g.Cx/(R**2*beta*e);
 const b=6*g.mphi*ML/(R*beta*g.Kphi*e**2),B=6*g.mx*ML/(R*beta*g.Kx*e**2);
 const mises=(u,v)=>Math.hypot(u-v/2,Math.sqrt(3)*v/2);let sm=0,st=0;
 for(let mask=0;mask<16;mask++){const s=[0,1,2,3].map(i=>mask&(1<<i)?1:-1);sm=Math.max(sm,mises(x+s[0]*n,y+s[1]*N));st=Math.max(st,mises(x+s[0]*n+s[2]*b,y+s[1]*N+s[3]*B));}
 const Z=1.5-(sm/g.K)**2/2,f=g.K/g.S;
 return {sm,st,Z,util:Z>0?Math.max(sm/(1.5*f),st/(1.5*Z*f)):Infinity};
}
// Five separate hand worksheets per registered module. They check physical
// quantities, not a second invocation of calc or any module helper.
for(let j=0;j<5;j++){
 test('B7 oracle '+j,()=>{const g={...base('b7'),FB:20000*(j+1),FV:30000*(j+1),FP:28600*(j+1),ratio:j%2?'high':'low',phi:j%2?'.75':'1'};if(j%2)g.phi='0.75';const r=calc('b7',g);near(r.headline.value,boltOracle(g));});
 test('B8 oracle '+j,()=>{const g={...base('b8'),FB:50000*(j+1),FV:75000*(j+1),FP:71500*(j+1)},r=calc('b8',g);near(r.headline.value,flangeOracle(g));});
 test('S3/4 oracle '+j,()=>{const g={...base('s3p'),F:2+3*j,p:2*j},r=calc('s3p',g),ex=bracketOracle(g);near(row(r,'σmV'),ex.sm);near(row(r,'σgesV'),ex.st);near(row(r,'Z'),ex.Z);near(r.util,ex.util);});
 test('S3/1 oracle '+j,()=>{const g={...base('s31'),M:50*j,weight:100*(j+1),c2:j/4},r=calc('s31',g);const R=g.Da/2-g.c1-g.c2,ri=g.Da/2-g.sn,A=Math.PI*(R-ri)*(R+ri),I=Math.PI/4*(R-ri)*(R+ri)*(R*R+ri*ri),W=I/R,stress=g.weight*1000/A+Math.abs(g.M)*1e6/W;near(row(r,'A4'),A);near(row(r,'W4'),W);near(r.headline.value,stress);near(row(r,'FK,Z'),Math.max(0,(4*Math.abs(g.M5)*1e6/g.Dt-900*g.F5)/g.n));assert(r.fail);});
 test('S3/2 static oracle '+j,()=>{const g={...base('s3'),weight:30*(j+1),p:j},r=calc('s3',g);const d=g.Da-2*g.sn,e=g.sn-g.c1-g.c2,F=g.weight*500,q=g.weight*1000/(g.L+4*g.h/3),support=q*(g.a+2*g.h/3)**2/2-q*d*d/16,mid=q*d*d/16+F*(g.L/2-g.a)-q/2*(g.L/2+2*g.h/3)**2;near(row(r,'Fi'),F);near(row(r,'Mi'),support);near(row(r,'MF'),mid);near(row(r,'Qi'),F*(g.L-2*g.a)/(g.L+4*g.h/3));near(row(r,'σS'),(g.p*d/(40*e)+4*Math.abs(support)/(Math.PI*d*d*e))/g.v);assert(r.fail);});
 test('Lifting eye oracle '+j,()=>{const g={...base('s3o'),F:10*(j+1),alpha:10*j},r=calc('s3o',g);const e=g.t-g.c1-g.c2,F=g.F*1000,Q=F*Math.sin(g.alpha*Math.PI/180),V=F*Math.cos(g.alpha*Math.PI/180),A=(g.b-g.d)*e,W=e*(g.b-g.d)**2/6,sig=V/A+Q*g.h/W,tau=F/((2*g.edge-g.d)*e),bearing=F/(g.dp*e),weld=3*Q*g.h/(g.a*g.l*g.l)+Math.sqrt(3)*F/(2*g.a*g.l);near(row(r,'σ'),sig);near(row(r,'τ'),tau);near(row(r,'σL'),bearing);near(row(r,'σw'),weld);near(r.util,Math.max((sig+Math.sqrt(3)*Q/A),Math.sqrt(3)*tau,bearing,weld)/(g.K/g.S));assert(r.fail);});
}
// 320 valid, reproducible inputs per module (1920 geometry/load sets).
for(let i=0;i<320;i++){
 test('B7 properties '+i,()=>{const g={...base('b7'),KB:between(100,450),KB20:between(200,550),n:4+Math.floor(rand()*20),dn:100,dk:80,FB:between(1,1e6),FV:between(1,1e6),FP:between(1,1e6),ratio:rand()<.5?'high':'low',phi:rand()<.5?'1':'0.75'};const r=calc('b7',g);contract('b7',g,r);near(r.headline.value,boltOracle(g));assert(calc('b7',{...g,FB:g.FB*1.01}).headline.value>=r.headline.value-1e-12);assert(calc('b7',{...g,KB:g.KB*1.01}).headline.value<=r.headline.value+1e-12);const limit={...g,dk:r.headline.value};near(calc('b7',limit).util,1);assert(!calc('b7',limit).fail);assert(calc('b7',{...limit,dk:limit.dk*(1-1e-7)}).fail);});
 test('B8 properties '+i,()=>{const scale=between(.8,3),g={...base('b8'),di:400*scale,da:600*scale,dt:530*scale,dD:450*scale,dL:26*scale,hf:60*scale,ha:105*scale,sf:18*scale,s1:12*scale,r:8*scale,FB:between(1000,8e5),FV:between(1000,8e5),FP:between(1000,8e5),K:between(120,400)};const r=calc('b8',g);contract('b8',g,r);near(r.headline.value,flangeOracle(g));assert.equal(r.fail,r.util>1);const stronger=calc('b8',{...g,K:g.K*1.01});assert(stronger.headline.value<=r.headline.value+1e-10);const thicker={...g,hf:g.hf*1.01,ha:g.ha*1.01};assert(calc('b8',thicker).util<=r.util+1e-10);assert(calc('b8',{...g,FB:g.FB*1.01}).headline.value>=r.headline.value-1e-10);near(calc('b8',{...g,p:1e5}).util,r.util);});
 test('S3/4 properties '+i,()=>{const g={...base('s3p'),F:between(0,40),p:between(0,15),K:between(150,400),ap:between(50,200)},r=calc('s3p',g),ex=bracketOracle(g);contract('s3p',g,r);near(r.util,ex.util);assert.equal(r.fail,r.util>1);assert(calc('s3p',{...g,p:g.p*1.01}).util>=r.util-1e-10);assert(calc('s3p',{...g,K:g.K*1.01}).util<=r.util+1e-10);assert(calc('s3p',{...g,sn:10.1}).util<=r.util+1e-10);});
 test('S3/1 properties '+i,()=>{const scale=between(.5,3),g={...base('s31'),Da:2000*scale,sn:12*scale,Dt:2200*scale,h:2500*scale,M:between(-800,800),M5:between(-800,800),weight:between(0,900)},r=calc('s31',g);contract('s31',g,r);assert(calc('s31',{...g,sn:g.sn*1.1}).headline.value<r.headline.value);near(calc('s31',{...g,M:-g.M}).headline.value,r.headline.value);assert(r.fail);});
 test('S3/2 properties '+i,()=>{const scale=between(.5,2),g={...base('s3'),Da:2000*scale,sn:12*scale,L:6000*scale,h:500*scale,a:450*scale,b:200*scale,angle:between(60,180),p:between(0,7),weight:between(10,150)},r=calc('s3',g);contract('s3',g,r);assert(r.rows.length>0);const load=calc('s3',{...g,weight:g.weight*1.01});assert(load.util>=r.util-1e-9);assert(r.fail);});
 test('Lifting eye properties '+i,()=>{const g={...base('s3o'),F:between(1,100),alpha:between(0,60),t:between(10,50)},r=calc('s3o',g);contract('s3o',g,r);near(calc('s3o',{...g,F:g.F*2}).util,r.util*2);assert(calc('s3o',{...g,t:g.t*1.1}).util<=r.util+1e-12);assert(r.fail);});
}
// Pressure-only bracket boundary from hand solution of
// q = (1.5/S)(1.5-q²/2), with sigmaV=sqrt(3)*p*R/(20e).
test('S3/4 pressure limit and monotonic diameter',()=>{for(let i=0;i<320;i++){const g={...base('s3p'),F:0,K:between(100,400)},e=g.sn,R=(g.Da-g.sn)/2,limit=20*e*g.K/(Math.sqrt(3)*R),at=calc('s3p',{...g,p:limit});near(at.util,1);assert(!calc('s3p',{...g,p:limit*(1-1e-10)}).fail);assert(calc('s3p',{...g,p:limit*(1+1e-7)}).fail);assert(calc('s3p',{...g,Da:g.Da*1.01}).util>=calc('s3p',g).util);}});
// Exact applicability boundaries, separate invalid geometry from strength.
function boundary(id,patch,valid){const r=calc(id,{...base(id),...patch});assert.equal(r.rows.length>0,valid);if(!valid)assert(r.fail);}
test('B7 c5 corners 20 / 50 mm',()=>{for(const d of [20-1e-8,20,20+1e-8,50-1e-8,50,50+1e-8]){const g={...base('b7'),dn:100,dk:80,FV:0,FP:0,FB:d*d*Math.PI*base('b7').KB*base('b7').n/(4*1.8)},r=calc('b7',g);near(r.headline.value,boltOracle(g));}});
test('B7 temperature, count, minimum thread boundaries',()=>{for(const T of [-10,300])assert(!calc('b7',{...base('b7'),T}).fail);for(const T of [-10-1e-8,300+1e-8])assert(calc('b7',{...base('b7'),T}).fail);for(const patch of [{n:3},{n:4.1},{dn:9.999},{dk:25}])assert(calc('b7',{...base('b7'),...patch}).fail);assert(!calc('b7',{...base('b7'),dn:10,dk:8,FB:1,FV:1,FP:1}).fail);});
test('B8 B1/ring-ratio/radius boundaries',()=>{for(const ha of [90,120])assert(!calc('b8',{...base('b8'),ha}).fail);for(const ha of [90-1e-8,120+1e-8])assert(calc('b8',{...base('b8'),ha}).fail);for(const x of [.1,.3]){const b=30/x,g={...base('b8'),da:400+52+b,dt:520,n:32,FB:1,FV:1,FP:1};assert(!calc('b8',g).fail);const outside=calc('b8',{...g,da:g.da+(x===.1?1e-6:-1e-6)});assert(outside.fail);}assert(!calc('b8',{...base('b8'),r:6}).fail);assert(calc('b8',{...base('b8'),r:6-1e-8}).fail);});
test('S3/2 angle and K14 limits',()=>{for(const angle of [60,180])boundary('s3',{angle},true);for(const angle of [60-1e-8,180+1e-8])boundary('s3',{angle},false);const D=1976;for(const L of [D,10*D])boundary('s3',{L},true);for(const L of [D-1e-8,10*D+1e-8])boundary('s3',{L},false);for(const ratio of [20,500]){const e=D/ratio;boundary('s3',{Da:D+2*e,sn:e},true);boundary('s3',{Da:D+2*e,sn:e,c2:ratio===500?1e-7:0,...(ratio===20?{sn:e+1e-7,Da:D+2*(e+1e-7)}:{})},false);}});
test('S3/4 pad wall/end/ratio boundaries',()=>{for(const ev of [10,15])assert(!calc('s3p',{...base('s3p'),ev}).fail);for(const ev of [10-1e-8,15+1e-8])assert(calc('s3p',{...base('s3p'),ev}).fail);const end=Math.sqrt(2010*10);assert(!calc('s3p',{...base('s3p'),end}).fail);assert(calc('s3p',{...base('s3p'),end:end-1e-8}).fail);for(const ratio of [.25,4]){const g={...base('s3p'),bv:300,hv:300*ratio,F:0};assert(!calc('s3p',g).fail);assert(calc('s3p',{...g,hv:g.hv+(ratio===.25?-1e-6:1e-6)}).fail);}});
test('S3/1 and eye geometry boundaries',()=>{for(const n of [3,4])boundary('s31',{n},true);boundary('s31',{n:2},false);boundary('s31',{Dt:2000},false);boundary('s31',{Dt:2000+1e-7},true);boundary('s3o',{alpha:60},true);boundary('s3o',{alpha:60+1e-8},false);boundary('s3o',{dp:40},true);boundary('s3o',{dp:40+1e-8},false);});
test('B8 diameter, bolt pitch, and four-bolt exact limits',()=>{
 const g={...base('b8'),di:3600,da:5400,dt:4770,dD:4050,dL:234,hf:540,ha:945,sf:162,s1:108,r:72};
 assert(!calc('b8',g).fail);assert(calc('b8',{...g,di:3600+1e-7}).fail);
 const pitch={...base('b8'),dt:16*5*26/Math.PI,da:750,FB:1,FV:1,FP:1};
 assert(!calc('b8',pitch).fail);assert(calc('b8',{...pitch,dt:pitch.dt+1e-7}).fail);
 const four={...base('b8'),n:4,di:30,da:150,dt:100,dD:50,dL:20,sf:5,s1:3,hf:24,ha:42,r:6,FB:1,FV:1,FP:1};
 assert(!calc('b8',four).fail);assert(calc('b8',{...four,n:3}).fail);
});
test('S3/2 bore, saddle-width and end-distance exact limits',()=>{
 boundary('s3',{b:1976*.2},true);boundary('s3',{b:1976*.2+1e-7},false);
 boundary('s3',{h:988},true);boundary('s3',{h:988+1e-7},false);
 boundary('s3',{a:100,b:200},true);boundary('s3',{a:100,b:200+1e-7},false);
 boundary('s3',{a:2900,b:200},true);boundary('s3',{a:2900+1e-7,b:200},false);
});
test('S3/4 shell slenderness and beta exact limits',()=>{
 const minWall={...base('s3p'),sn:2010*.003,ev:2010*.003*1.2,F:0,p:0};
 assert(!calc('s3p',minWall).fail);assert(calc('s3p',{...minWall,sn:minWall.sn-1e-7}).fail);
 const thick={...base('s3p'),sn:2010/31,ev:2010/31*1.2,end:1000,F:0,p:0};
 assert(!calc('s3p',thick).fail);assert(calc('s3p',{...thick,sn:thick.sn+1e-7}).fail);
 // gamma=300 cannot coexist with e/Da>=.003 and positive nominal wall:
 // gamma=(Da-sn)/(2e) < 1/(2*.003) < 300. No fabricated passing case.
 for(const beta of [.025,.5]){
  const g={...base('s3p'),bv:2000*beta,hv:2000*beta,hp:40,b:20,Kphi:1,Kx:1,F:0,p:0};
  assert(!calc('s3p',g).fail);assert(calc('s3p',{...g,bv:g.bv+(beta===.025?-1e-6:1e-6),hv:g.hv+(beta===.025?-1e-6:1e-6)}).fail);
 }
 const beta=.125; // bv=hv=250 gives an exactly representable beta.
 for(const parameter of ['Kphi','Kx'])for(const edge of [.025,.5]){
  const g={...base('s3p'),bv:250,hv:250,[parameter]:edge/beta,F:0,p:0};
  assert(!calc('s3p',g).fail);assert(calc('s3p',{...g,[parameter]:g[parameter]+(edge===.025?-1e-7:1e-7)}).fail);
 }
});
test('B8 overlapping bolt holes and exact chord boundary',()=>{
 const g={...base('b8'),n:64,FB:1,FV:1,FP:1},chord=g.dt*Math.sin(Math.PI/g.n);
 assert(!calc('b8',{...g,dL:chord-1e-7}).fail);
 assert(calc('b8',{...g,dL:chord}).fail);
 assert(calc('b8',{...g,dL:chord+1e-7}).fail);
 assert(calc('b8',{...base('b8'),n:100}).fail);
});
test('S3/1 outside loss is the conservative section envelope',()=>{
 const g={...base('s31'),c2:1},r=calc('s31',g);near(r.headline.value,13.17735478730277);
 // All 21 possible loss-side splits must have at least the retained A/W.
 for(let j=0;j<=20;j++){const outside=j/20,Ro=1000-outside,Ri=988+(1-outside),A=Math.PI*(Ro*Ro-Ri*Ri),W=Math.PI*(Ro**4-Ri**4)/(4*Ro);assert(row(r,'A4')<=A+1e-7);assert(row(r,'W4')<=W+1e-7);}
});
// Regression cases for the confirmed false-pass paths.
test('B8 standard allowances reject negatives and NaN',()=>{for(const c of [-10,NaN,Infinity,-Infinity])for(const key of ['c1','c2']){const g={...base('b8'),flSource:'standard',flPN:'16',flDN:'100',di:100,sf:6,s1:4,ha:50,FB:10000,FV:15000,FP:14300,[key]:c};assert(calc('b8',g).fail);assert(mods.b8.draw(g,H,null).includes('Maße eingeben'));}});
test('S3/4 infinite allowable stress fails closed',()=>{const g={...base('s3p'),K:1e308,S:1e-308,p:0,F:0};assert(calc('s3p',g).fail);});
test('B7 overflowing KB*n cannot create zero load demand',()=>{assert(calc('b7',{...base('b7'),KB:1e308,FB:1e308,FV:0,FP:0,dk:3.1}).fail);});
test('B8 infinite hub credit cannot approve zero required wall',()=>{const g={...base('b8'),di:400,da:1e308,dt:4e307,dD:1e307,dL:1e306,sf:1e307,s1:1e306,hf:3e307,ha:5e307,FB:0,FV:0,FP:0};assert(calc('b8',g).fail);});
test('S3/2 blocked result colors drawing as failed',()=>{const g={...base('s3'),weight:1,p:0},r=calc('s3',g);assert(r.util<1);assert(r.fail);assert(mods.s3.draw(g,H,r).includes('o bad'));});
for(const id of ['b7','b8','s3','s3p','s3o','s31']){
 test(id+' invalid inputs fail closed',()=>{const g=base(id);const keys={b7:['KB','KB20','n','dn','dk'],b8:['K','K20','S','ST','di','da','dt','hf','ha'],s3:['K','S','v','Da','sn','L','b'],s3p:['K','S','Da','sn','bv','hv','ev'],s3o:['K','S','b','t','d','dp','a','l'],s31:['Da','sn','h','fZ','Dt','n']}[id];for(const key of keys)for(const value of [0,-1,NaN,Infinity,-Infinity])assert(calc(id,{...g,[key]:value}).fail,key+'='+value);if(!['b7','b8'].includes(id)){const thickness=id==='s3o'?'t':'sn';assert(calc(id,{...g,c1:g[thickness]}).fail);}});
 test(id+' draws null / huge / invalid without non-finite SVG',()=>{for(const g of [null,{},Object.fromEntries(Object.entries(base(id)).map(([k,v])=>[k,typeof v==='number'?1e308:v])),{...base(id),dn:1e308,dk:1e307,n:8},{...base(id),h:1e308,edge:1e308,l:1e308}]){const svg=mods[id].draw(g,H,null);assert(!/NaN|Infinity|undefined/.test(svg));}});
}
test('Extreme finite inputs never approve non-finite result rows',()=>{
 for(const id of ['b7','b8','s3p'])for(const [key,value]of Object.entries(base(id))){if(typeof value!=='number')continue;for(const extreme of [Number.MIN_VALUE,1e-250,1e150,1e308]){const g={...base(id),[key]:extreme},r=calc(id,g);if(!r.fail){assert(Number.isFinite(r.util));assert(Number.isFinite(r.headline.value));assert(r.rows.every(x=>Number.isFinite(x[2])),id+' '+key);}const svg=mods[id].draw(g,H,r);assert(!/NaN|Infinity|undefined/.test(svg),id+' '+key);}}
});
// Independent source transcription of every GORE gasket size in this scope.
test('72 gasket pairs against EN1514 IBC source',()=>{const id=[22,27,34,43,49,61,77,89,115,141,169,220,273,324,356,407,458,508],od={10:[51,61,71,82,92,107,127,142,162,192,218,273,328,378,438,489,539,594],16:[51,61,71,82,92,107,127,142,162,192,218,273,329,384,444,495,555,617],25:[51,61,71,82,92,107,127,142,168,194,224,284,340,400,457,514,564,624],40:[51,61,71,82,92,107,127,142,168,194,224,290,352,417,474,546,571,628]};for(const pn of [10,16,25,40])Object.values(AD.gaskets[pn]).forEach((g,i)=>assert.deepEqual([g.di,g.da],[id[i],od[pn][i]]));});
// EN 1092-1:2018 Tables 12–15, independent primary-table transcription.
// C1 at PN40 DN450/500 is purchaser-specified (merged footnote d), not C2=57.
// (Normtext, nicht verlinkt)
const en1092={"10":[[15,95,65,14,4,"M12",14,16],[20,105,75,14,4,"M12",16,18],[25,115,85,14,4,"M12",16,18],[32,140,100,18,4,"M16",18,18],[40,150,110,18,4,"M16",18,18],[50,165,125,18,4,"M16",20,18],[65,185,145,18,8,"M16",20,18],[80,200,160,18,8,"M16",20,20],[100,220,180,18,8,"M16",22,20],[125,250,210,18,8,"M16",22,22],[150,285,240,22,8,"M20",24,22],[200,340,295,22,8,"M20",24,24],[250,395,350,22,12,"M20",26,26],[300,445,400,22,12,"M20",26,26],[350,505,460,22,16,"M20",30,26],[400,565,515,26,16,"M24",32,26],[450,615,565,26,20,"M24",36,28],[500,670,620,26,20,"M24",38,28]],"16":[[15,95,65,14,4,"M12",14,16],[20,105,75,14,4,"M12",16,18],[25,115,85,14,4,"M12",16,18],[32,140,100,18,4,"M16",18,18],[40,150,110,18,4,"M16",18,18],[50,165,125,18,4,"M16",20,18],[65,185,145,18,8,"M16",20,18],[80,200,160,18,8,"M16",20,20],[100,220,180,18,8,"M16",22,20],[125,250,210,18,8,"M16",22,22],[150,285,240,22,8,"M20",24,22],[200,340,295,22,12,"M20",26,24],[250,405,355,26,12,"M24",29,26],[300,460,410,26,12,"M24",32,28],[350,520,470,26,16,"M24",35,30],[400,580,525,30,16,"M27",38,32],[450,640,585,30,20,"M27",42,34],[500,715,650,33,20,"M30",46,36]],"25":[[15,95,65,14,4,"M12",14,16],[20,105,75,14,4,"M12",16,18],[25,115,85,14,4,"M12",16,18],[32,140,100,18,4,"M16",18,18],[40,150,110,18,4,"M16",18,18],[50,165,125,18,4,"M16",20,20],[65,185,145,18,8,"M16",22,22],[80,200,160,18,8,"M16",24,24],[100,235,190,22,8,"M20",26,24],[125,270,220,26,8,"M24",28,26],[150,300,250,26,8,"M24",30,28],[200,360,310,26,12,"M24",32,30],[250,425,370,30,12,"M27",35,32],[300,485,430,30,16,"M27",38,34],[350,555,490,33,16,"M30",42,38],[400,620,550,36,16,"M33",48,40],[450,670,600,36,20,"M33",54,46],[500,730,660,36,20,"M33",58,48]],"40":[[15,95,65,14,4,"M12",14,16],[20,105,75,14,4,"M12",16,18],[25,115,85,14,4,"M12",16,18],[32,140,100,18,4,"M16",18,18],[40,150,110,18,4,"M16",18,18],[50,165,125,18,4,"M16",20,20],[65,185,145,18,8,"M16",22,22],[80,200,160,18,8,"M16",24,24],[100,235,190,22,8,"M20",26,24],[125,270,220,26,8,"M24",28,26],[150,300,250,26,8,"M24",30,28],[200,375,320,30,12,"M27",36,34],[250,450,385,33,12,"M30",42,38],[300,515,450,33,16,"M30",52,42],[350,580,510,36,16,"M33",58,46],[400,660,585,39,16,"M36",65,50],[450,685,610,39,20,"M36",null,57],[500,755,670,42,20,"M39",null,57]]};
test('144 flange rows against primary EN1092 tables',()=>{for(const [pn,rows]of Object.entries(en1092))for(const [dn,D,K,L,n,bolt,C1,C2]of rows)for(const type of ['01','11']){const f=AD.flanges[type][pn][dn];assert.deepEqual([f.D,f.K,f.L,f.n,f.bolt,f.C],[D,K,L,n,bolt,type==='01'?C1:C2]);}});
console.log(`PASS ${passed}/${count}`);if(passed!==count)process.exitCode=1;
