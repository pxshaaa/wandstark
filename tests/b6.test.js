'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../data/profiles.js');
require('../modules/b6.js');
const m=AD.modules.find(x=>x.id==='b6');
const base={Da:1000,l:2000,sn:8,p:1,K:235,K20:235,S:1.6,ST:1.05,E:210000,v:0.85,c1:0,c2:0,T:20};
const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
function close(a,b,eps=1e-9){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);}

/* Independent hand calculation in radius notation, N/mm², then x10 to bar.
 * B6 7.2.1 (1), 7.3.1 (4). No calls into the implementation or AD helpers.
 * Fixed n are hand-selected for each nominal geometry; neighboring modes checked.
 */
function elastic(g,s,n){
  const R=g.Da/2, k=n*g.l/(Math.PI*R), r=s/R, nu=g.nu??.3;
  const sk=Math.max(g.SK??3,(g.u??1.5)<=1.5?3:2.25+.5*g.u);
  return 10/sk*(g.E*r/((n*n-1)*(1+k*k)**2)+
    g.E*r**3/(12*(1-nu**2))*(n*n-1+(2*n*n-1-nu)/(1+k*k)));
}
function plastic(g,s){
  if(g.Da/g.l>5) return Math.max(20*g.K/g.S*s/g.Da,30*g.K/g.S*(s/g.l)**2);
  const oval=(g.u===undefined?1.5:g.u)/100;
  const membrane=2*(g.K/g.S)*s/g.Da;
  const factor=1+1.5*oval*(1-.2*g.Da/g.l)*g.Da/s;
  return 10*membrane/factor;
}
function handThickness(g){
  // A fixed mode gives p=a*s+b*s³. Analytic cubic inversion, independently
  // of H.solve. All 99 fixed modes must satisfy pressure; take the largest root.
  let largest=0, mode=0;
  for(let n=Math.max(2,Math.floor(Math.PI*g.Da/(2*g.l))+1);n<=100;n++){
    const R=g.Da/2, k=n*g.l/(Math.PI*R), A=1+k*k;
    const nu=g.nu??.3, sk=Math.max(g.SK??3,(g.u??1.5)<=1.5?3:2.25+.5*g.u);
    const a=10*g.E/(sk*R*(n*n-1)*A*A);
    const b=10*g.E/(12*sk*(1-nu**2)*R**3)*(n*n-1+(2*n*n-1-nu)/A);
    const root=2*Math.sqrt(a/(3*b))*Math.sinh(Math.asinh(3*g.p/(2*a)*Math.sqrt(3*b/a))/3);
    if(root>largest){largest=root;mode=n;}
  }
  assert.ok(mode<99,'hand mode table covers governing root');
  const a=20*g.K/(g.S*g.Da);
  const b=1.5*(g.u===undefined?1.5:g.u)/100*(1-.2*g.Da/g.l)*g.Da;
  // B6 (4) rearranged: a*s² - p*s - p*b = 0.
  const plasticRoot=g.Da/g.l>5?Math.min(g.p/a,g.l*Math.sqrt(g.p*g.S/(30*g.K))):
    (g.p+Math.sqrt(g.p*g.p+4*a*g.p*b))/(2*a);
  return Math.max(largest,plasticRoot)+g.c1+g.c2;
}
let passed=0,total=0;
function test(name,f){total++;try{f();passed++;}catch(e){console.error(`FAIL ${name}: ${e.stack}`);}}
function check(patch,n,fail=false){
  const g={...base,...patch},r=m.calc(g),s=g.sn-g.c1-g.c2;
  const p1=elastic(g,s,n),p2=plastic(g,s),p=Math.min(p1,p2);
  close(row(r,'p1'),p1);close(row(r,'p2'),p2);close(r.pmax,p);
  assert.equal(row(r,'n'),n);
  if(n>2&&n-1>Math.PI*g.Da/(2*g.l)) assert.ok(p1<=elastic(g,s,n-1));
  assert.ok(p1<=elastic(g,s,n+1));
  close(r.util,g.p/p);close(r.headline.value,handThickness(g));
  assert.equal(r.fail,fail);assert.equal(r.test,null);
  for(const key of ['headline','util','pmax','test','rows','notes','fail','formula']) assert.ok(key in r);
  assert.ok(r.notes.some(x=>x[0]==='w'&&x[1].includes('Prüfzustand')));
  return r;
}
test('registry and material contract',()=>{
  assert.ok(AD.materials.length);assert.equal(m.name,'Zylinder Außendruck');assert.equal(m.usesE,true);
  assert.equal(m.code,'B6');assert.equal(m.group,'Schalen');assert.equal(m.fields.find(f=>f.id==='u').def,1.5);
});
test('typical shell, n=4',()=>check({},4));
test('long shell, n=2',()=>{
  const r=check({Da:2698,l:35100,sn:37,c1:8,K:448,E:206000,p:.513},2);
  // Independently published example: 1.954 bar elastic, 19.664 bar plastic.
  close(row(r,'p1'),1.954,0.0002);close(row(r,'p2'),19.664,0.00002);
});
test('short shell governed by plastic deformation, n=9',()=>check({Da:1332,l:320,sn:16,c1:3,K:290.832,E:191640,p:1.03},9));
test('medium length, n=3, both allowances',()=>check({Da:1332,l:4669,sn:16.5,c1:2,c2:1.5,K:286.048,E:190840,p:1.03},3));
test('insufficient thickness',()=>check({sn:2},5,true));
test('round shell and weld factor independence',()=>{
  const a=check({u:0},4),b=m.calc({...base,u:0,v:1});close(a.pmax,b.pmax);
});
test('Da/l=5 boundary',()=>check({l:200},10));
test('short cylinder B6 (5)/(6), previously excluded',()=>check({l:199},10));
test('out of range diameter ratio',()=>{
  const r=m.calc({...base,sn:100});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
});
test('out of range ovality and invalid input',()=>{
  for(const patch of [{u:100},{u:-1},{E:0},{l:0},{p:-1},{c1:8},{Da:NaN}]){
    const r=m.calc({...base,...patch});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  }
});
test('S below 1.6 is raised to B6 Tafel 1 value',()=>{
  const a=m.calc({...base,S:1}),b=m.calc({...base,S:1.6});close(a.pmax,b.pmax);assert.equal(a.fail,false);
});
test('minimum thickness 3 mm is an error',()=>{
  const r=m.calc({...base,sn:1,p:0.001});assert.equal(r.fail,true);
});
test('no solution within scope',()=>{
  const r=m.calc({...base,p:2000});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.headline.value));
  close(r.pmax,Math.min(elastic(base,8,4),plastic(base,8)));
});
test('zero pressure',()=>{
  const r=m.calc({...base,p:0,c1:.5,c2:1});close(r.headline.value,1.5);close(r.util,0);assert.equal(r.fail,false);
});

// New paths: independent arithmetic in radius notation, fixed trial modes,
// analytic roots / separately rearranged B6 ring equations. No AD helpers used.
const make=patch=>m.calc({...base,...patch});
const defaults=Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def]));
test('complete UI defaults and conditional hidden NaN inputs',()=>{
  const a=m.calc({...base,...defaults}),b=make({ringA:NaN,ringI:NaN,ringB:NaN,Dmax:NaN,Dmin:NaN,pTest:NaN,headDepth1:NaN});
  assert.equal(a.fail,false);close(a.pmax,b.pmax);assert.ok(m.fields.some(f=>f.type==='heading'&&f.when));
  assert.ok(m.fields.find(f=>f.id==='Dmax').when);
});
test('head length from two measured depths; no third-depth contribution',()=>{
  const r=make({lengthMode:'heads',overallLength:2450,headType:'dished',headDepth1:200,headDepth2:250,l:NaN});
  close(row(r,'l'),2000);close(r.pmax,Math.min(elastic(base,8,4),plastic(base,8)));assert.equal(r.fail,false);
});
test('flat anchored end support length, hidden head depths ignored',()=>{
  const r=make({lengthMode:'heads',headType:'flat',overallLength:2000,headDepth1:NaN,headDepth2:NaN,l:NaN});
  close(row(r,'l'),2000);close(r.pmax,elastic(base,8,4));assert.equal(r.fail,false);
});
test('invalid head geometry blocks capacity',()=>{
  for(const patch of [{overallLength:300,headDepth1:200,headDepth2:200},{overallLength:2400,headDepth1:-1,headDepth2:200}]){
    const r=make({lengthMode:'heads',headType:'dished',...patch});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  }
});
test('measured diameters B6 (7), hidden u ignored',()=>{
  const r=make({ovalityMode:'diameters',Dmax:991.38,Dmin:976.62,u:NaN});
  const u=200*(991.38-976.62)/(991.38+976.62);
  close(row(r,'u'),u);close(row(r,'p2'),plastic({...base,u},8));assert.equal(r.fail,false);
});
test('local flattening B6 (8)',()=>{
  const r=make({ovalityMode:'flat',q:2.5,u:NaN});
  close(row(r,'u'),400*2.5/1000);close(row(r,'p2'),plastic({...base,u:1},8));assert.equal(r.fail,false);
});
test('invalid measured diameters and flattening',()=>{
  for(const patch of [{ovalityMode:'diameters',Dmax:970,Dmin:980},{ovalityMode:'diameters',Dmax:NaN,Dmin:980},{ovalityMode:'flat',q:-1}]){
    const r=make(patch);assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  }
});
test('large ovality increases SK using B6 4.2',()=>{
  const g={...base,u:3},r=make({u:3});close(row(r,'SK'),3.75);close(row(r,'p1'),elastic(g,8,4));close(row(r,'p2'),plastic(g,8));
  close(r.headline.value,handThickness(g));assert.equal(r.fail,false);
});
test('higher user SK retained',()=>{const r=make({SK:4});close(row(r,'SK'),4);close(row(r,'p1'),elastic({...base,SK:4},8,4));});
test('variable Poisson ratio',()=>{const r=make({nu:.25});close(row(r,'p1'),elastic({...base,nu:.25},8,4));close(r.headline.value,handThickness({...base,nu:.25}));});
test('Poisson ratio boundaries rejected',()=>{for(const nu of [-1,.5,NaN]) assert.equal(make({nu}).fail,true);});
for(const [materialClass,S,ST] of [['steel',1.6,1.1],['austenitic',1.6,1.1],['cast',2,1.5],['aluminium',1.6,1.1],['copper',4,2.5],['gjs700',5,2.5],['gjs500',4,2],['gjs400',3.5,1.7],['gjs350',2.4,1.2]]){
  test('Tafel 1 operating and test factors '+materialClass,()=>{
    const r=make({materialClass,S:1,ST:1,testMode:'external',pTest:.5,ETest:210000});
    close(row(r,'S'),S);close(row(r,'S′'),ST);close(row(r,'p2'),plastic({...base,S},8));
    close(row(r,'p_zul′'),Math.min(elastic(base,8,4),plastic({...base,S:ST},8)));
    assert.equal(r.fail,false);assert.equal(r.test.ok,true);
  });
}
test('higher user S and ST retained',()=>{const r=make({S:3,ST:2,testMode:'external',pTest:.1,ETest:210000});close(row(r,'S'),3);close(row(r,'S′'),2);});
test('unclassified material conservatively blocked with UNVERIFIED warning',()=>{
  const r=make({materialClass:'other'});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));assert.ok(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')));
});
test('minimum thickness, aluminium and heat-exchanger exception',()=>{
  assert.equal(make({sn:2.5,p:.001}).fail,true);
  assert.equal(make({materialClass:'aluminium',sn:4,p:.001}).fail,true);
  const r=make({tubeType:'exchanger',sn:1,p:.001});assert.equal(r.fail,false);close(row(r,'smin'),0);
});
test('creep domain rejected; no arbitrary numeric temperature limit',()=>{
  assert.equal(make({creep:'yes'}).fail,true);close(make({T:300}).pmax,elastic(base,8,4));
});
test('short cylinder (6) governs over membrane formula',()=>check({l:40},40));
test('buckling mode restriction n>Z on thick short cylinder',()=>{
  const g={...base,l:199,sn:80,p:1},r=make(g),Z=Math.PI*1000/(2*199);
  // n=8 is the lowest admissible integer and governs at this large thickness.
  assert.equal(row(r,'n'),8);assert.ok(row(r,'n')>Z);close(row(r,'p1'),elastic(g,80,8));
});
const ringBase={rings:'yes',ringSpacing:1000,ringSection:'flat',ringB:12,ringH:80,widthMode:'auto',ringK:235,ringS:1.6};
function handRing(patch={}){
  const g={...base,...ringBase,...patch},s=g.sn-g.c1-g.c2;
  const width=Math.min(g.ringSpacing,12+1.1*Math.sqrt(g.Da*s));
  const lm=g.widthMode==='input'?g.shellWidth:width;
  // Hand composite of a shell rectangle and the outer radial flat bar.
  const a1=lm*s,a2=g.ringB*g.ringH,z1=s/2,z2=s+g.ringH/2;
  const A=a1+a2,z=(a1*z1+a2*z2)/A;
  const I=lm*s**3/12+a1*(z-z1)**2+g.ringB*g.ringH**3/12+a2*(z2-z)**2;
  const W=I/Math.max(z,s+g.ringH-z),Dm=g.Da-2*s+2*z;
  const pe=240*g.E*I/((1-.3**2)*(g.Da-s)*Dm**2*g.ringSpacing);
  const sk=Math.max(g.SK??3,(g.u??1.5)<=1.5?3:2.25+.5*g.u),c=sk/pe;
  const a=lm*g.Da/(20*A),b=g.ringSpacing*g.Da**2*(g.u??1.5)/(8000*W),F=g.ringK/Math.max(g.ringS,g.S);
  const sigma=a*g.p+b*g.p/(1-c*g.p);
  // Rearrange (10) into a*c*p² - (a+b+F*c)*p + F = 0;
  // stable smaller root, limited by the strict elastic boundary (9).
  const B=a+b+F*c,pRing=2*F/(B+Math.sqrt(B*B-4*a*c*F));
  return {lm,A,I,W,Dm,pe,sigma,pRing,g};
}
function checkRing(patch={}){
  const e=handRing(patch),r=make({...ringBase,...patch});
  for(const [sym,val] of [['lm',e.lm],['Am',e.A],['Im',e.I],['Wm',e.W],['Dm',e.Dm],['pe',e.pe],['σr',e.sigma],['p_ring',e.pRing]]) close(row(r,sym),val);
  close(row(r,'ηr,e'),e.g.p*3/e.pe);close(row(r,'ηr,σ'),e.sigma/(e.g.ringK/Math.max(e.g.S,e.g.ringS)));
  const shell={...e.g,l:e.g.ringSpacing};
  const peShell=Math.min(...Array.from({length:98},(_,i)=>elastic(shell,e.g.sn-e.g.c1-e.g.c2,i+2)));
  close(r.pmax,Math.min(e.pRing,peShell,plastic(shell,e.g.sn-e.g.c1-e.g.c2)));
  close(r.util,Math.max(e.g.p/Math.min(peShell,plastic(shell,e.g.sn-e.g.c1-e.g.c2)),3*e.g.p/e.pe,e.sigma/(e.g.ringK/Math.max(e.g.S,e.g.ringS))));
  return r;
}
test('outer flat bar ring complete composite and pressure limit',()=>{assert.equal(checkRing().fail,false);});
test('reduced effective shell width',()=>{assert.equal(checkRing({widthMode:'input',shellWidth:50}).fail,false);});
test('effective width capped at ring spacing',()=>{const r=checkRing({ringSpacing:80,p:.01});close(row(r,'lm'),80);});
test('ring strength and higher safety input affect stress capacity',()=>{
  const r=checkRing({ringK:120,ringS:3,p:.01});assert.equal(r.fail,false);close(row(r,'Kr/Sr'),40);
});
test('ring weak stress failure can govern a passing shell',()=>{
  const r=checkRing({ringK:10});assert.equal(r.fail,true);assert.ok(row(r,'ηr,σ')>1);assert.ok(base.p<row(r,'p1'));
});
test('ring elastic overall buckling failure',()=>{
  const r=make({...ringBase,p:100});assert.equal(r.fail,true);assert.ok(row(r,'ηr,e')>=1);assert.equal(row(r,'σr'),Infinity);
});
test('profile input reproduces independently calculated flat ring geometry',()=>{
  const e=handRing(),r=make({...ringBase,ringSection:'user',ringA:e.A,ringI:e.I,ringW:e.W,ringDm:e.Dm,ringIs:20000});
  close(row(r,'pe'),e.pe);close(row(r,'σr'),e.sigma);close(row(r,'p_ring'),e.pRing);assert.equal(r.fail,false);
});
test('round ring finite capacity at zero ovality',()=>{const r=checkRing({u:0,p:.01});assert.equal(r.fail,false);});
test('invalid ring geometry, excessive shell credit and lateral instability',()=>{
  const e=handRing();
  for(const patch of [{ringH:100},{ringB:0},{widthMode:'input',shellWidth:10000},{ringSection:'user',ringA:e.A,ringI:e.I,ringW:e.W,ringDm:e.Dm,ringIs:1}]){
    const r=make({...ringBase,...patch});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  }
});
test('ring test state independently evaluated at test E and K',()=>{
  const r=make({...ringBase,testMode:'external',pTest:1.3,ETest:200000,K20:250,ST:1,ringK20:250}),e=handRing({p:1.3,E:200000,ringK:250});
  close(row(r,'σr′'),e.sigma);close(row(r,'S′'),1.1);close(row(r,'SK′'),3);assert.equal(r.test.ok,true);
  close(r.test.req,handThickness({...base,p:1.3,E:200000,K:250,S:1.1,l:1000}));
});
test('test shell failure propagates; conservative SK above 1.3p',()=>{
  const r=make({testMode:'external',pTest:10,ETest:210000});assert.equal(r.test.ok,false);assert.equal(r.fail,true);close(row(r,'SK′'),3);
  close(r.test.req,handThickness({...base,p:10,S:1.1}));
});
test('test-only ring failure propagates even with sufficient shell',()=>{
  const r=make({...ringBase,ringK20:5,testMode:'external',pTest:1.3,ETest:210000});assert.equal(r.test.ok,false);assert.equal(r.fail,true);assert.ok(row(r,'p_zul′')>1.3);
});
test('full allowances retained conservatively in test state',()=>{
  const g={...base,c1:.5,c2:.5,p:.01,testMode:'external',pTest:.1,ETest:210000};
  const r=m.calc(g);close(r.test.req,handThickness({...g,p:.1,S:1.1}));assert.equal(r.test.ok,true);
});
test('invalid active test input blocks overall result',()=>{
  for(const patch of [{pTest:-1},{ETest:0},{ST:NaN}]){const r=make({testMode:'external',pTest:1,ETest:210000,...patch});assert.equal(r.fail,true);assert.equal(r.test,null);}
});
test('unknown classes and nonfinite composite properties fail safely',()=>{
  assert.equal(make({materialClass:'constructor'}).fail,true);
  const r=make({...ringBase,ringH:1e150,ringB:1e150});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
});
test('zero external pressure with rings and no hidden-input contamination',()=>{
  const r=make({...ringBase,p:0,Dmax:NaN,Dmin:NaN,ringI:NaN,ringA:NaN,headDepth1:NaN,l:NaN});
  assert.equal(r.fail,false);close(r.util,0);close(row(r,'σr'),0);close(r.headline.value,0);
});

// Independent section calculations: first and second moments about the BASE,
// followed by a single centroid shift. No implementation/helper calls.
// B6 7.4.1 requires centroidal properties, not tabulated nominal profile sizes.
const profiles={
  flat:{ringB:12,ringH:80},
  angle:{ringH:80,ringTw:12,ringBf:60,ringTf:10},
  tee:{ringH:80,ringTw:12,ringBf:60,ringTf:10},
  channel:{ringH:80,ringTw:12,ringBf:60,ringTf:10},
  ibeam:{ringH:80,ringTw:12,ringBf:60,ringTf:10},
  hollow:{ringH:60,ringBf:50,ringWall:8},
  halfpipe:{ringPipeD:100,ringWall:6}
};
function handSection(kind,q){
  const h=q.ringH,w=q.ringTw,B=q.ringBf,f=q.ringTf,t=q.ringWall;
  let a,m,j,jy,xm=0,b,depth=h;
  if(kind==='flat'){
    b=q.ringB;a=b*h;m=b*h*h/2;j=b*h**3/3;jy=h*b**3/12;
  }else if(kind==='angle'||kind==='tee'){
    b=w;
    a=w*(h-f)+B*f;
    m=w*(h-f)**2/2+B*(h*h-(h-f)**2)/2;
    j=w*(h-f)**3/3+B*(h**3-(h-f)**3)/3;
    jy=(h-f)*w**3/12+f*B**3/12;
    if(kind==='angle'){
      const dx=(B-w)/2;xm=B*f*dx;
      jy+=B*f*dx**2-xm*xm/a;
    }
  }else if(kind==='ibeam'){
    b=B;a=2*B*f+w*(h-2*f);m=a*h/2;
    j=(B*h**3-(B-w)*(h-f)**3+(B-w)*f**3)/3;
    jy=2*f*B**3/12+(h-2*f)*w**3/12;
  }else if(kind==='channel'){
    b=2*f;a=B*w+2*f*(h-w);
    m=(B*(h*h-(h-w)**2)+2*f*(h-w)**2)/2;
    j=(B*(h**3-(h-w)**3)+2*f*(h-w)**3)/3;
    jy=w*B**3/12+2*(h-w)*(f**3/12+f*((B-f)/2)**2);
  }else if(kind==='hollow'){
    b=B;a=B*h-(B-2*t)*(h-2*t);m=a*h/2;
    const centered=(B*h**3-(B-2*t)*(h-2*t)**3)/12;
    j=centered+a*h*h/4;
    jy=(h*B**3-(h-2*t)*(B-2*t)**3)/12;
  }else{
    const R=q.ringPipeD/2,r=R-t;b=2*t;depth=R;
    a=(Math.PI*R**2-Math.PI*r**2)/2;
    m=(2*R**3-2*r**3)/3;
    j=(Math.PI*R**4-Math.PI*r**4)/8;jy=j;
  }
  return {a,e:m/a,i:j-m*m/a,is:jy,b,depth};
}
function handProfile(kind,q,inside=false){
  const r=handSection(kind,q),s=8,Da=1000,l=1000;
  const lm=Math.min(l,1.1*Math.sqrt(Da*s)+r.b),as=lm*s;
  const A=as+r.a,e=(r.a*r.e-as*s/2)/A;
  const I=lm*s**3/12+as*(-s/2-e)**2+r.i+r.a*(r.e-e)**2;
  const W=I/Math.max(s+e,r.depth-e),Dm=inside?Da-2*s-2*e:Da+2*e;
  const pe=240*210000*I/(.91*(Da-s)*Dm*Dm*l);
  const p=.1,alpha=lm*Da/(20*A),beta=l*Da*Da*1.5/(8000*W),c=3/pe,F=235/1.6;
  const sigma=alpha*p+beta*p/(1-c*p),B=alpha+beta+F*c;
  const pr=2*F/(B+Math.sqrt(B*B-4*alpha*c*F));
  return {...r,lm,A,e,I,W,Dm,pe,sigma,pr};
}
for(const [kind,q] of Object.entries(profiles)){
  test(kind+' independent A, centroid, own I, Is and composite properties',()=>{
    const expected=handProfile(kind,q),r=make({...ringBase,ringSection:kind,p:.1,...q});
    for(const [sym,value] of [['Ar',expected.a],['er',handSection(kind,q).e],['Ir',expected.i],['Is',expected.is],
      ['Am',expected.A],['e',expected.e],['Im',expected.I],['Wm',expected.W],['Dm',expected.Dm],['lm',expected.lm]]) close(row(r,sym),value);
    if(kind==='halfpipe'){
      assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
      assert.ok(r.notes.some(n=>n[0]==='w'&&n[1].includes('UNVERIFIED')&&n[1].includes('7.4.2')));

    }else{
      close(row(r,'pe'),expected.pe);close(row(r,'σr'),expected.sigma);close(row(r,'p_ring'),expected.pr);
      const shell={...base,l:1000,p:.1};
      const shellAllow=Math.min(plastic(shell,8),...Array.from({length:98},(_,i)=>elastic(shell,8,i+2)));
      close(r.pmax,Math.min(shellAllow,expected.pr));
      close(r.util,Math.max(.1/shellAllow,.3/expected.pe,expected.sigma/(235/1.6)));
      assert.equal(r.fail,false);
    }
    for(const key of ['headline','util','pmax','test','rows','notes','fail','formula']) assert.ok(key in r);
  });
  test(kind+' internal ring reflected geometry and B6 capacity',()=>{
    const e=handProfile(kind,q,true),r=make({...ringBase,ringSection:kind,ringPos:'inside',p:.1,...q});
    close(row(r,'Am'),e.A);close(row(r,'Im'),e.I);close(row(r,'Wm'),e.W);close(row(r,'Dm'),e.Dm);
    assert.equal(r.fail,kind==='halfpipe');
    if(kind==='halfpipe') assert.ok(Number.isNaN(r.pmax));
    else {close(row(r,'pe'),e.pe);close(row(r,'σr'),e.sigma);close(row(r,'p_ring'),e.pr);assert.ok(r.pmax>0);}
    assert.ok(!r.notes.some(n=>n[1].includes('Innenring')&&n[1].includes('UNVERIFIED')));
  });
  if(kind!=='halfpipe') test(kind+' complete ring pressure failure',()=>{
    const r=make({...ringBase,ringSection:kind,p:100,...q});
    assert.equal(r.fail,true);assert.ok(row(r,'ηr,e')>=1||row(r,'ηr,σ')>1);
  });
}
test('selected dimensions only; hidden flat dimensions ignored for automatic profiles',()=>{
  for(const [kind,q] of Object.entries(profiles)){
    if(kind==='flat') continue;
    const g={...ringBase,ringH:NaN,ringB:NaN,ringSection:kind,p:.1,...q};
    const r=make(g),e=handProfile(kind,q);close(row(r,'Am'),e.A);close(row(r,'Im'),e.I);
    assert.equal(r.fail,kind==='halfpipe');
  }
});
test('impossible dimensions and conservative slenderness limits block approval',()=>{
  const invalid=[['angle',{ringBf:5}],['tee',{ringH:10}],['ibeam',{ringH:20}],
    ['channel',{ringBf:20}],['hollow',{ringWall:30}],['halfpipe',{ringWall:50}],
    ['angle',{ringTw:1}],['tee',{ringBf:500}],['channel',{ringTf:1}],['hollow',{ringWall:1}]];
  for(const [kind,patch] of invalid){
    const r=make({...ringBase,ringSection:kind,p:.1,...profiles[kind],...patch});
    assert.equal(r.fail,true,kind);assert.ok(Number.isNaN(r.pmax),kind);
  }
});
test('automatic T section test pressure uses its computed properties',()=>{
  const r=make({...ringBase,ringSection:'tee',...profiles.tee,p:.1,testMode:'external',pTest:.1,ETest:210000,ringK20:235});
  close(row(r,'σr′'),handProfile('tee',profiles.tee).sigma);assert.equal(r.test.ok,true);
});
test('unknown profile and position rejected',()=>{
  for(const patch of [{ringSection:'unknown'},{ringPos:'unknown'}]){
    const r=make({...ringBase,...patch});assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  }
});
test('new fields use valid contract conditions and unique IDs',()=>{
  const ids=m.fields.map(f=>f.id);assert.equal(new Set(ids).size,ids.length);
  const field=id=>m.fields.find(f=>f.id===id);
  assert.deepEqual(field('ringPos').options.map(x=>x[0]),['outside','inside']);
  // visibility is now a function (OR: 'Freie Maße' or 'Eigene Maße' within a series)
  const vis=(id,v)=>field(id).when({rings:'yes',...v});
  assert.ok(vis('ringPipeD',{ringSource:'manual',ringSection:'halfpipe'})&&!vis('ringPipeD',{ringSource:'manual',ringSection:'flat'}));
  assert.ok(!vis('ringH',{ringSource:'manual',ringSection:'halfpipe'}));
  assert.ok(vis('ringB',{ringSource:'manual',ringSection:'flat'})&&vis('ringB',{ringSource:'manual',ringSection:'user'}));
  assert.ok(vis('ringA',{ringSource:'manual',ringSection:'user'}));
  assert.ok(vis('ringB',{ringSource:'standard',ringProfileType:'FL',ringSizeFL:'custom'})&&!vis('ringB',{ringSource:'standard',ringProfileType:'FL',ringSizeFL:'FL 60x8'}));
});
test('automatic profile lateral inertia threshold independently enforced',()=>{
  const q={ringH:80,ringTw:12,ringBf:12,ringTf:10};
  const expected=handSection('tee',q),r=make({...ringBase,ringSection:'tee',p:.01,...q});
  close(row(r,'Is'),11520);assert.ok(expected.is<80**4/3000);
  assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
  assert.ok(r.notes.some(n=>n[0]==='e'&&n[1].includes('Is < h⁴/3000')));
});
// Catalogue selection: independent ideal-section arithmetic (B6 7.4.1).
test('standard flat bar ignores hidden manual dimensions',()=>{
 const g={...base,...defaults,...ringBase,ringSource:'standard',ringProfileType:'FL',ringSizeFL:'FL 80x12',p:.1,ringH:NaN,ringB:NaN};
 const r=m.calc(g),expected=handProfile('flat',{ringH:80,ringB:12});
 close(row(r,'Ar'),80*12);close(row(r,'Am'),expected.A);close(row(r,'Im'),expected.I);close(row(r,'Wm'),expected.W);assert.equal(r.fail,false);
});
const slender=r=>r.notes.some(n=>n[0]==='e'&&/schlank/i.test(n[1]));
test('standard angle maps both equal legs and thickness',()=>{
 const r=make({...defaults,...ringBase,ringSource:'standard',ringProfileType:'L',ringSizeL:'L 50x5',p:.001});
 close(row(r,'Ar'),480);close(row(r,'Ir'),109600);close(row(r,'er'),36);
 assert.equal(r.fail,false);
 // independently: web c/t = (50-5)/5 = 9 <= 42ε, leg outstand (50-5)/5 = 9 <= 14ε (EN 1993-1-1 Tab. 5.2 class 3)
 assert.equal(slender(r),false);
});
test('standard IPE maps strong radial axis',()=>{
 const r=make({...defaults,...ringBase,ringSource:'standard',ringProfileType:'IPE',ringSizeIPE:'IPE 80',p:.001});
 const area=2*46*5.2+(80-2*5.2)*3.8;
 close(row(r,'Ar'),area);
 // web (80-10.4)/3.8 = 18.3 <= 42ε, flange outstand (46-3.8)/2/5.2 = 4.06 <= 14ε
 assert.equal(slender(r),false);
});
test('standard UPN uses tabulated weak radial axis',()=>{
 const r=make({...defaults,...ringBase,ringSource:'standard',ringProfileType:'UPN',ringSizeUPN:'UPN 50',p:.001});
 const cat=globalThis.AD.profiles.UPN.find(x=>x.name==='UPN 50').A; close(row(r,'Ar'),cat);close(row(r,'Ir'),91200);close(row(r,'er'),24);
 const ratio=row(r,'Ar/A'); assert.ok(ratio>0.9&&ratio<=1.05, 'Ar/A '+ratio);
 assert.ok(!r.notes.some(n=>n[0]==='e'&&n[1].includes('Rechteckmodell')));
});
test('standard hollow and T profiles pass the catalogue area check',()=>{
 for(const [type,name] of [['RHS','RHS 40x20x2'],['T','T 30']]){
  const r=make({...defaults,...ringBase,ringSource:'standard',ringProfileType:type,['ringSize'+type]:name,p:.001});
  const ratio=row(r,'Ar/A'); assert.ok(ratio<=1.05,name+' Ar/A '+ratio);
  assert.equal(r.fail,false);assert.ok(r.pmax>0);
 }
});
test('catalogue uses supplied tabulated area and radial moment directly',()=>{
 const P=globalThis.AD.profiles.RHS, oA=P[0].A, oI=P[0].Iy;
 const g={...defaults,...ringBase,ringSource:'standard',ringProfileType:'RHS',['ringSizeRHS']:P[0].name};
 const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
 try{ const r0=make(g); P[0].A=row(r0,'Ar')*0.8; P[0].Iy=row(r0,'Ir')*0.5; const r=make(g);
   assert.ok(Math.abs(row(r,'Ar')-P[0].A)<1e-9*P[0].A); assert.ok(row(r,'Ir')<=P[0].Iy*(1+1e-12));
   assert.ok(!(r.pmax>r0.pmax)); close(row(r,'Ir'),P[0].Iy); } finally { P[0].A=oA; P[0].Iy=oI; }
});
test('missing catalogue size fails closed',()=>{
 const r=make({...defaults,...ringBase,ringSource:'standard',ringProfileType:'HEB',ringSizeHEB:'HEB 999'});
 assert.equal(r.fail,true);assert.ok(Number.isNaN(r.pmax));
});
test('catalogue fields and manual conditions',()=>{
 for(const type of Object.keys(AD.profiles)){
  const f=m.fields.find(f=>f.id==='ringSize'+type);assert.equal(f.options.length,AD.profiles[type].length+1);assert.equal(f.options.at(-1)[0],'custom');assert.equal(f.when.ringProfileType,type);
 }
 assert.ok(m.fields.find(f=>f.id==='ringH').when({rings:'yes',ringSource:'manual',ringSection:'flat'}));
});
test('Eigene Maße in a series equal the manual flat bar',()=>{
  const base2={...base,...defaults,rings:'yes',ringSpacing:1500,Da:2000,sn:10,p:1};
  const a=m.calc({...base2,ringSource:'standard',ringProfileType:'FL',ringSizeFL:'custom',ringB:15,ringH:100},AD.h);
  const b=m.calc({...base2,ringSource:'manual',ringSection:'flat',ringB:15,ringH:100},AD.h);
  assert.equal(a.pmax,b.pmax); assert.ok(a.pmax>0);
});
console.log(`PASS ${passed}/${total}`);
if(passed!==total) process.exitCode=1;
