'use strict';
// Primary text: AD 2000 B6 10.2006, PDF pp. 266–269, equations (1), (4)–(12).
// (Normtext, nicht verlinkt)
// Profile axes and tabulated values: ArcelorMittal Sections and Merchant Bars 2023-4.
// https://projects.arcelormittal.com/media/3gqnoxif/sections-merchant-bars-arcelormittal-2023-4.pdf
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/profiles.js');require('../modules/b6.js');require('../modules/b6-tips.js');
const m=AD.modules.find(x=>x.id==='b6'),H=AD.h;
const base={...Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def])),p:.1,E:210000,K:235,K20:250,S:1.6,ST:1.1,c1:0,c2:0,T:20};
let pass=0,total=0,seed=0xB6002006;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function test(name,fn){total++;try{fn();pass++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
const calc=g=>m.calc({...base,...g}),row=(r,k)=>r.rows.find(x=>x[1]===k)?.[2];
function near(a,b,eps=1e-8){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
function drawing(g,r){const s=m.draw(g,H,r);assert.ok(s.startsWith('<svg'));assert.ok(!/NaN|Infinity|undefined/.test(s));const ids=new Set(m.fields.map(f=>f.id));for(const t of s.matchAll(/data-p="([^"]+)"/g))for(const id of t[1].split(' '))assert.ok(ids.has(id),id);assert.ok(!/data-p="[^"]*ring[KS](?: |")/.test(s));}
// Independent radius formulation, exhaustive fixed mode table; no AD helpers.
function shellOracle(g,s=g.sn-g.c1-g.c2){
 const radius=g.Da/2,lambda=Math.PI*radius/g.l,sk=Math.max(g.SK,3,g.u>1.5?2.25+.5*g.u:0),S=Math.max(g.S,1.6),nu=g.nu;
 let elastic=Infinity,mode=0;
 for(let n=2;n<=1500;n++){if(n<=lambda)continue;const q=n/lambda,a=1+q*q,x=s/radius;
 const p=10*g.E/sk*(x/((n*n-1)*a*a)+x**3/(12*(1-nu*nu))*(n*n-1+(2*n*n-1-nu)/a));if(p<elastic){elastic=p;mode=n;}}
 const x=s/radius,ratio=g.Da/g.l;
 const plastic=ratio<=5?10*g.K/S*x/(1+.03*g.u*(1-.2*ratio)/x):Math.max(10*g.K/S*x,30*g.K/S*(s/g.l)**2);
 return {p1:elastic,p2:plastic,pmax:Math.min(elastic,plastic),mode};
}
// Five textbook geometries; check direct equation values AND independently invert.
for(const [Da,l,sn,p,c1,c2] of [[1000,2000,8,1,0,0],[2698,35100,37,.513,8,0],[1332,320,16,1.03,3,0],[1332,4669,16.5,1.03,2,1.5],[1000,100,16,.5,0,1]])test('shell oracle '+Da+'/'+l,()=>{
 const g={...base,Da,l,sn,p,c1,c2},r=calc(g),e=shellOracle(g);near(r.pmax,e.pmax);near(row(r,'p1'),e.p1);near(row(r,'p2'),e.p2);assert.equal(row(r,'n'),e.mode);
 let lo=0,hi=Da/12-c1-c2;for(let j=0;j<70;j++){const s=(hi+lo)/2;if(shellOracle(g,s).pmax>=p)hi=s;else lo=s;}near(r.headline.value,hi+c1+c2);
});
// Independent flat-ring oracle using moments about the inner shell face, then one shift.
for(const [Da,sn,l,b,h] of [[1000,8,1000,12,80],[800,6,500,10,60],[1500,12,900,15,100],[600,6,400,8,50],[2000,16,1200,20,120]])test('ring oracle '+Da,()=>{
 const g={...base,Da,sn,ringSpacing:l,rings:'yes',ringSource:'manual',ringSection:'flat',ringB:b,ringH:h},r=calc(g);
 const lm=Math.min(l,1.1*Math.sqrt(Da*sn)+b),As=lm*sn,Ar=b*h,A=As+Ar,z=(As*sn/2+Ar*(sn+h/2))/A;
 const I=lm*sn**3/3+b*((sn+h)**3-sn**3)/3-A*z*z,W=I/Math.max(z,sn+h-z),Dm=Da-2*sn+2*z;
 const pe=240*g.E*I/((1-g.nu**2)*(Da-sn)*Dm**2*l),a=lm*Da/(20*A),beta=l*Da**2*g.u/(8000*W),c=3/pe,F=g.ringK/g.ringS,B=a+beta+F*c;
 const pr=2*F/(B+Math.sqrt(B*B-4*a*c*F));
 for(const [k,v] of Object.entries({lm,Ar,Am:A,Im:I,Wm:W,Dm,pe,p_ring:pr,'σr':g.p*(a+beta/(1-c*g.p))}))near(row(r,k),v);
 near(r.pmax,Math.min(pr,shellOracle({...g,l}).pmax));
});
function properties(g){
 let r=calc(g);assert.equal(r.fail,false);assert.ok(r.pmax>0);near(r.util,Math.max(g.p/row(r,'p1'),g.p/row(r,'p2'),g.rings==='yes'?row(r,'ηr,e'):0,g.rings==='yes'?row(r,'ηr,σ'):0));
 assert.ok(r.rows.every(x=>typeof x[2]!=='number'||Number.isFinite(x[2])));near(r.headline.value,row(r,'s'));near(r.pmax,row(r,'p_zul'));assert.ok(r.formula.includes('p_zul = '+H.fmt(r.pmax,3)));drawing({...base,...g},r);
 let edge=calc({...g,p:r.pmax});assert.equal(edge.fail,false,'at pmax');near(edge.util,1,1e-6);assert.equal(calc({...g,p:r.pmax*(1+1e-6)}).fail,true,'above pmax');
 assert.ok(calc({...g,p:g.p*1.1}).headline.value>=r.headline.value-1e-9,'pressure/thickness');
 assert.ok(calc({...g,Da:g.Da*1.01}).headline.value>=r.headline.value-1e-9,'diameter/thickness');
 assert.ok(calc({...g,sn:g.sn*1.01}).pmax>=r.pmax*(1-1e-12),'wall/capacity');
 assert.ok(calc({...g,K:g.K*1.1,ringK:g.ringK*1.1}).pmax>=r.pmax*(1-1e-12),'strength/capacity');
 for(const f of [.1,.8,1,1.01,1.5]){const q=calc({...g,p:r.pmax*f});assert.equal(q.fail,q.util>1,'util/fail');}
 const tr=calc({...g,testMode:'external',pTest:g.p,ETest:g.E,K20:g.K,ST:g.S,ringK20:g.ringK});assert.equal(tr.fail,false);assert.equal(tr.test.ok,true);near(tr.test.req,r.headline.value);near(tr.test.PT,g.p);
 const bad=calc({...g,testMode:'external',pTest:r.pmax*3,ETest:g.E,K20:g.K,ST:g.S,ringK20:g.ringK});assert.equal(bad.fail,true);assert.equal(bad.test.ok,false);
}
for(let i=0;i<350;i++)test('shell seeded property '+i,()=>{
 const Da=400+rand()*2600,sn=4+rand()*25,c1=rand()*.3,c2=rand()*.5;
 properties({...base,Da,sn,l:Da*(.5+rand()*9),c1,c2,p:1e-4,K:180+rand()*200,E:150000+rand()*70000,u:rand()*4,nu:.2+rand()*.15});
});
const sections={flat:{ringB:12,ringH:80},angle:{ringH:80,ringTw:12,ringBf:60,ringTf:10},tee:{ringH:80,ringTw:12,ringBf:60,ringTf:10},ibeam:{ringH:80,ringTw:12,ringBf:60,ringTf:10},channel:{ringH:80,ringTw:12,ringBf:60,ringTf:10},hollow:{ringH:60,ringBf:50,ringWall:8}};
for(const [section,dimensions]of Object.entries(sections))for(let i=0;i<300;i++)test(section+' seeded property '+i,()=>{
 const Da=500+rand()*1500,sn=5+rand()*15;
 const g={...base,...dimensions,rings:'yes',ringSource:'manual',ringSection:section,ringPos:i%2?'inside':'outside',Da,sn,ringSpacing:Da*(.6+rand()*2),p:1e-5,u:.1+rand()*3,ringK:180+rand()*120};
 properties(g);
});
// Fail-closed malformed values, inactive numeric fields deliberately ignored by contract.
for(const k of ['Da','sn','l','E','K','S','SK'])for(const v of [0,-1,NaN,Infinity,1e308])test('invalid '+k+' '+v,()=>assert.equal(calc({[k]:v}).fail,true));
for(const patch of [{c1:8},{c1:4,c2:4},{c1:-1},{p:-1},{p:NaN},{u:100},{u:-1},{u:NaN},{sn:100},{nu:-1},{nu:.5},{lengthMode:'bad'},{rings:'bad'},{testMode:'bad'},{ovalityMode:'bad'},
 {Da:1e150,sn:1e148,l:1e150,p:0},{Da:1e-200,sn:1e-202,l:1e-200,tubeType:'exchanger',p:0},{ovalityMode:'diameters',Dmax:1e308,Dmin:1e308}])test('invalid patch '+JSON.stringify(patch),()=>assert.equal(calc(patch).fail,true));
for(const type of ['__proto__','constructor','toString','unknown','',0,null])test('invalid catalogue series '+type,()=>{const g={...base,rings:'yes',ringProfileType:type};assert.equal(calc(g).fail,true);drawing(g,calc(g));});
for(const [type,list]of Object.entries(AD.profiles))for(const p of list)test('catalogue '+p.name,()=>{
 const g={...base,rings:'yes',ringProfileType:type,['ringSize'+type]:p.name,p:1e-6},r=calc(g);assert.ok(row(r,'Ar')<=p.A*(1+1e-12));if(type!=='UPN'&&p.Iy)assert.ok(row(r,'Ir')<=p.Iy*(1+1e-12));
 if(['UPN','T','RHS','L'].includes(type)){near(row(r,'Ar'),p.A);near(row(r,'Ir'),type==='UPN'?p.Iz:p.Iy);if(!r.fail)assert.ok(r.pmax>0);}drawing(g,r);
});
// Exact applicability limits and adjacent values. p=0 is valid: B6 includes unloaded state.
for(const Da of [199.999,200,200.001,1000])test('diameter ratio boundary '+Da,()=>{
 const limit=Da<=200?1.7:1.2,sn=Da*(1-1/limit)/2;assert.equal(calc({Da,sn,p:0}).fail,false);assert.equal(calc({Da,sn:sn*(1-1e-8),p:0}).fail,false);assert.equal(calc({Da,sn:sn*(1+1e-8),p:0}).fail,true);
});
for(const [materialClass,min]of [['steel',3],['aluminium',5]])test('minimum wall '+materialClass,()=>{assert.equal(calc({materialClass,sn:min,p:0}).fail,false);assert.equal(calc({materialClass,sn:min-1e-8,p:0}).fail,true);});
for(const u of [1.5-1e-8,1.5,1.5+1e-8])test('ovality safety boundary '+u,()=>near(row(calc({u}),'SK'),Math.max(3,2.25+.5*u)));
test('flat ring h/b boundary',()=>{const g={rings:'yes',ringSource:'manual',ringSection:'flat',ringB:10,p:0};assert.equal(calc({...g,ringH:80}).fail,false);assert.equal(calc({...g,ringH:80+1e-7}).fail,true);});
test('width boundary',()=>{const lm=1.1*Math.sqrt(1000*8)+12,g={rings:'yes',ringSource:'manual',ringSection:'flat',widthMode:'input',p:0};assert.equal(calc({...g,shellWidth:lm}).fail,false);assert.equal(calc({...g,shellWidth:lm+1e-7}).fail,true);});
test('user ring lateral inertia boundary',()=>{const g={rings:'yes',ringSource:'manual',ringSection:'user',p:0};const Is=80**4/3000;assert.equal(calc({...g,ringIs:Is}).fail,false);assert.equal(calc({...g,ringIs:Is*(1-1e-8)}).fail,true);});
for(const patch of [{rings:'yes',ringSource:'manual',ringSection:'halfpipe'},{materialClass:'other'},{creep:'yes'},{lengthMode:'heads',overallLength:400,headDepth1:200,headDepth2:200}])test('unsupported '+JSON.stringify(patch),()=>{assert.equal(calc(patch).fail,true);drawing({...base,...patch},calc(patch));});

// Every alternative ovality and head-input path must reproduce the same geometry.
for(let i=0;i<300;i++)test('head/ovality equivalence '+i,()=>{
 const Da=500+rand()*2000,sn=5+rand()*20,l=Da*(.5+rand()*5),u=rand()*3;
 const g={...base,Da,sn,l,u,p:1e-5},r=calc(g),di=Da-2*sn;
 const paths=[{lengthMode:'heads',headType:'dished',overallLength:l+300,headDepth1:100,headDepth2:200,l:NaN},
 {lengthMode:'heads',headType:'flat',overallLength:l,l:NaN,headDepth1:NaN,headDepth2:NaN},
 {ovalityMode:'diameters',Dmax:di*(1+u/200),Dmin:di*(1-u/200),u:NaN},
 {ovalityMode:'flat',q:u*Da/400,u:NaN}];
 for(const patch of paths){const q={...g,...patch},a=calc(q);assert.equal(a.fail,false);near(a.pmax,r.pmax);near(a.headline.value,r.headline.value);near(a.util,r.util);drawing(q,a);}
});
// User-supplied verified composites reproduce the automatic reference geometry.
for(let i=0;i<300;i++)test('user composite '+i,()=>{
 const Da=600+rand()*1800,sn=5+rand()*15,g={...base,Da,sn,rings:'yes',ringSource:'manual',ringSection:'flat',p:1e-5,ringB:16,ringH:80,ringPos:i%2?'inside':'outside',ringSpacing:Da*(.7+rand()*2)};
 const flat=calc(g),patch={...g,ringSection:'user',ringA:row(flat,'Am'),ringI:row(flat,'Im'),ringW:row(flat,'Wm'),ringDm:row(flat,'Dm'),ringIs:row(flat,'Is')},r=calc(patch);
 assert.equal(r.fail,false);near(r.pmax,flat.pmax);near(r.util,flat.util);const edge=calc({...patch,p:r.pmax});assert.equal(edge.fail,false);near(edge.util,1,1e-6);assert.equal(calc({...patch,p:r.pmax*(1+1e-6)}).fail,true);drawing(patch,r);
});
for(const section of ['flat','angle','tee','ibeam','channel','hollow','user','halfpipe']){
 const keys={flat:['ringB','ringH'],angle:['ringH','ringTw','ringBf','ringTf'],tee:['ringH','ringTw','ringBf','ringTf'],ibeam:['ringH','ringTw','ringBf','ringTf'],channel:['ringH','ringTw','ringBf','ringTf'],hollow:['ringH','ringBf','ringWall'],user:['ringB','ringH','ringA','ringI','ringW','ringDm','ringIs'],halfpipe:['ringPipeD','ringWall']}[section];
 for(const key of keys)for(const v of [0,-1,NaN,Infinity,1e308])test('invalid ring '+section+' '+key+' '+v,()=>{
  const g={...base,...sections[section],rings:'yes',ringSource:'manual',ringSection:section,[key]:v,p:0};assert.equal(calc(g).fail,true);drawing(g,calc(g));
 });
}


// University of Washington, Bending of Beams with Unsymmetrical Sections:
// https://courses.washington.edu/me354a/Unsym.pdf
// Integrate both centroidal moments and their product, independently of module rows.
test('L section restrained B6 bending differs from a free unsymmetric beam',()=>{
 const g={...base,...sections.angle,rings:'yes',ringSource:'manual',ringSection:'angle'},r=calc(g);
 const lm=1.1*Math.sqrt(1000*8)+12,parts=[{x:0,z:-4,w:lm,h:8},{x:0,z:35,w:12,h:70},{x:24,z:75,w:60,h:10}];
 const area=parts.reduce((s,q)=>s+q.w*q.h,0),xc=parts.reduce((s,q)=>s+q.w*q.h*q.x,0)/area,zc=parts.reduce((s,q)=>s+q.w*q.h*q.z,0)/area;
 let Ix=0,Iz=0,Ixz=0;for(const q of parts){const a=q.w*q.h;Ix+=q.w*q.h**3/12+a*(q.z-zc)**2;Iz+=q.h*q.w**3/12+a*(q.x-xc)**2;Ixz+=a*(q.x-xc)*(q.z-zc);}
 let max=0;for(const q of parts)for(const x of [q.x-q.w/2,q.x+q.w/2])for(const z of [q.z-q.h/2,q.z+q.h/2])max=Math.max(max,Math.abs((Iz*(z-zc)-Ixz*(x-xc))/(Ix*Iz-Ixz*Ixz)));
 near(1/max,37224.11193479743);near(row(r,'Wm'),52712.60604698008);assert.ok(row(r,'Wm')>1.4/max);assert.equal(r.fail,false);assert.ok(r.pmax>0);assert.ok(r.notes.some(n=>n[1].includes('Deviationsmoment')));
});


test('rotated UPN catalogue strong axis cannot cap radial bending',()=>{
 // Manufacturer p. 100: UPN50 Iy=26.40 cm4, Iz=9.120 cm4.
 const r=calc({rings:'yes',ringProfileType:'UPN',ringSizeUPN:'UPN 50',p:.001});
 near(row(r,'Ir'),91200);near(row(r,'er'),24);near(row(r,'Is'),264000);
 assert.equal(r.fail,false);assert.ok(r.pmax>0);
});
test('RHS area scaling does not bound corner-sensitive second moment',()=>{
 // Counterexample with same bounding dimensions and EXACT catalogue area 214 mm2.
 // Outer radius r, inner radius r-2; integrate square minus quarter-circle corners.
 const r=1+10/(4*(4-Math.PI));
 const area=224-(4-Math.PI)*(r*r-(r-2)**2);near(area,214);
 function roundedI(b,h,r){const z=h/2-r,square=r*((h/2)**3-z**3)/3;
  const quarter=Math.PI*r*r*z*z/4+2*z*r**3/3+Math.PI*r**4/16;return b*h**3/12-4*(square-quarter);}
 const trueI=roundedI(20,40,r)-roundedI(16,36,r-2);
 const q=calc({rings:'yes',ringProfileType:'RHS',ringSizeRHS:'RHS 40x20x2',p:.001});
 near(row(q,'Ar'),area);near(row(q,'Ir'),40500);assert.ok(row(q,'Ir')<trueI*1.02);assert.equal(q.fail,false);assert.ok(q.pmax>0);
});

console.log(`PASS ${pass}/${total}`);if(pass!==total)process.exitCode=1;
