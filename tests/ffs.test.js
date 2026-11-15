'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/ffs.js');
const get=id=>AD.modules.find(m=>m.id===id);
const base=id=>({...Object.fromEntries(get(id).fields.filter(f=>'def'in f).map(f=>[f.id,f.def])),p:10,T:20,K:150,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,...(id==='ffs5'?{side:'outer'}:{})});
const calc=(id,patch={})=>get(id).calc({...base(id),...patch},AD.h);
const row=(r,s)=>{const found=r.rows.find(x=>x[1]===s);assert(found,s);return found[2];};
const near=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let passed=0,total=0;
function test(name,f){total++;try{f();passed++;}catch(e){console.error('FAIL '+name);throw e;}}
function contract(r){for(const k of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(k in r,k);assert.equal(r.test,null);assert.equal(typeof r.fail,'boolean');}
// Independent arithmetic: 1000 mm, 10 bar, K/S=100 MPa => 10000/2010 mm.
test('ffs4 default and inverse pressure',()=>{const r=calc('ffs4');contract(r);const req=10000/2010;near(r.headline.value,req);near(r.util,req/7.5);near(r.pmax,2000*7.5/(1000-7.5));near(row(r,'RL'),(8-req)/.1);near(row(r,'RL_FCA'),Math.min(7.5-req,6.5-2.5)/.1);assert(!r.fail);});
test('ffs4 direct requirement ignores hidden stress',()=>{const r=calc('ffs4',{basis:'direct',t_min:6,K:NaN,S:NaN,v:NaN});near(r.util,.8);near(r.headline.value,6);assert(Number.isNaN(r.pmax));assert(!r.fail);});
test('ffs4 minimum gate fails despite good average',()=>{const r=calc('ffs4',{basis:'direct',t_min:6,t_mm:3});near(r.util,3/2.5);assert(r.fail);});
test('ffs4 average gate fails',()=>{const r=calc('ffs4',{t_am:4.8,t_mm:4.5});near(r.util,(10000/2010)/4.3);assert(r.fail);near(r.pmax,2000*4.3/(1000-4.3));});
test('ffs4 COV out of range',()=>{const r=calc('ffs4',{COV:.101});assert(r.fail);assert.equal(r.pmax,0);});
test('ffs4 insufficient inspection count',()=>assert(calc('ffs4',{N:14}).fail));
test('ffs4 profile minimum substitution ignores hidden COV',()=>{const r=calc('ffs4',{readings:'profile',COV:NaN,N:NaN});near(row(r,'t_a'),7);near(r.util,(10000/2010)/6.5);assert(!r.fail);});
test('ffs4 zero rate not infinite claim',()=>{const r=calc('ffs4',{rate:0});assert.equal(row(r,'RL'),'nicht bestimmbar');assert(!r.fail);});
test('ffs4 nominal fraction dominates floor',()=>{const r=calc('ffs4',{basis:'direct',t_min:5,t_nom:30,t_am:10,t_mm:7,Da:2000,COV:.1});near(row(r,'t_lim'),6);near(r.util,6/6.5);assert(!r.fail);});
test('ffs4 malformed geometry',()=>assert(calc('ffs4',{Da:30}).fail));
// Table 5.2 exact knots: lambda=1 => Mt=1.199. tc=9.5, tm=4.75 => Rt=0.5.
const exact={s:Math.sqrt(9500)/1.285,c:50,t_mm:5.25};
test('ffs5 exact table knot and B1 inverse',()=>{const r=calc('ffs5',exact);contract(r);const factor=.5/(1-.5/1.199),mawp=2000*9.5/1009.5;near(row(r,'t_c'),9.5);near(row(r,'Rt'),.5);near(row(r,'λ'),1);near(row(r,'Mt'),1.199);near(row(r,'RSF'),factor);near(r.pmax,mawp*factor/.9);near(r.util,10/r.pmax);near(row(r,'L_msd,min'),1.8*Math.sqrt(9500));assert(!r.fail);});
test('ffs5 permitted interpolation',()=>{const r=calc('ffs5',{...exact,s:1.25*Math.sqrt(9500)/1.285});near(row(r,'Mt'),(1.199+1.394)/2);});
test('ffs5 future uniform LOSS counted once',()=>{const r=calc('ffs5',{LOSS:1});near(row(r,'t_c'),8.5);near(row(r,'Rt'),7/8.5);near(row(r,'MAWP'),2000*8.5/1008.5);});
test('ffs5 no flaw yields unflawed pressure',()=>{const r=calc('ffs5',{t_mm:10});near(row(r,'RSF'),1);near(r.pmax,2000*9.5/1009.5);assert(!r.fail);});
test('ffs5 distance gate fails closed',()=>{const r=calc('ffs5',{L_msd:1});assert(r.fail);assert.equal(r.pmax,0);});
test('ffs5 minimum remaining wall',()=>{const r=calc('ffs5',{t_mm:2.9});near(row(r,'Rt'),2.4/9.5);assert(r.fail);assert.equal(r.pmax,0);});
test('ffs5 Rt applicability limit',()=>{const r=calc('ffs5',{t_nom:20,t_mm:3.5});near(row(r,'Rt'),3/19.5);assert(r.fail);assert.equal(r.pmax,0);});
test('ffs5 corrected errata ratio accepts EC/EL',()=>{const r=calc('ffs5',{v:.8,Ec:1,c:240});near(row(r,'c_max'),250);assert(!r.fail);});
test('ffs5 corrected errata ratio rejects opposite ratio',()=>{const r=calc('ffs5',{v:1,Ec:.8,c:180});near(row(r,'c_max'),160);assert(r.fail);assert.equal(r.pmax,0);});
test('ffs5 grooves excluded',()=>{const r=calc('ffs5',{flaw:'groove'});assert(r.fail);assert.equal(r.pmax,0);});
test('ffs5 lambda capped per table note',()=>{const r=calc('ffs5',{s:2000,t_mm:9});near(row(r,'Mt'),24.027);});
test('ffs5 pressure overstress',()=>{const r=calc('ffs5',{p:100});assert(r.fail);assert(r.util>1);assert(r.pmax>0);});
// Independent B31G arithmetic at z=4 and q=0.4; default material K20=235 MPa.
for(const method of ['original','modified'])test('b31g '+method+' short defect',()=>{const r=calc('b31g',{method,L:Math.sqrt(4*508*10)});contract(r);const flow=method==='original'?258.5:304;const M=method==='original'?Math.sqrt(4.2):Math.sqrt(1+2.51-.054);const A=method==='original'?4/15:.34;const pressure=20*flow*10/508*(1-A)/(1-A/M)*.72;near(r.pmax,pressure);near(r.util,10/pressure);assert(!r.fail);});
test('b31g original z>20',()=>{const r=calc('b31g',{method:'original',L:400});near(r.pmax,20*258.5*10/508*.6*.72);});
test('b31g modified z>50',()=>{const r=calc('b31g',{L:1000});const z=1e6/5080,M=.032*z+3.3;near(row(r,'M_M'),M);near(r.pmax,20*304*10/508*.66/(1-.34/M)*.72);});
test('b31g flow cap and override',()=>{const r=calc('b31g',{yield:'override',SMYS:350,SMTS:375,K20:NaN,d:0});near(row(r,'S_flow,O'),375);near(row(r,'S_flow,M'),375);near(r.pmax,20*375*10/508*.72);});
test('b31g pressure failure retains valid capacity',()=>{const r=calc('b31g',{p:1000});assert(r.fail);assert(r.util>1);assert(r.pmax>0);});
test('b31g too deep fails closed',()=>{const r=calc('b31g',{d:8.01});assert(r.fail);assert.equal(r.pmax,0);});
test('b31g exactly 80 percent allowed',()=>assert(!calc('b31g',{d:8,p:1}).fail));
test('b31g unsupported temperature',()=>assert.equal(calc('b31g',{T:120}).pmax,0));
test('b31g unsupported yield',()=>assert.equal(calc('b31g',{K20:500}).pmax,0));
for(const fl of ['crack','notch','dent','seam']) test('b31g defect type '+fl+' enforced separately',()=>{const r=calc('b31g',{flaw:fl});assert.equal(r.pmax,0);assert(r.notes.some(n=>n[0]==='e'&&n[1].length>20));});
for(const fl of ['groove','notch','crack']) test('ffs5 defect type '+fl+' enforced separately',()=>{const r=calc('ffs5',{flaw:fl});assert(r.fail);});
// Public worked example: PHMSA OPS TTO11 Pipe Wrinkle Study (2004), Tables 4-1/4-2,
// pp.13–14: D=24 in, t=.266 in, d/t=.5, L=10 in, X60, F=.72; reported 743 psi.
// https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/docs/technical-resources/pipeline/hazardous-liquid-integrity-management/64361/tto11pipewrinklestudyfinalreportoct2004.pdf
// ONLY its straight-pipe pressure subproblem is reproduced, not the wrinkle assessment.
// Report prints inconsistent Folias coefficients (.00375 vs standard .003375),
// and uses 10 ksi rather than rounded 69 MPa. Hence compare report within 2 psi;
// independent exact reference below uses the requested B31G-2012 / 69 MPa basis.
test('PHMSA public worked pressure example',()=>{const psiMPa=.006894757293168,inch=25.4;const r=calc('b31g',{D:24*inch,t_nom:.266*inch,d:.133*inch,L:10*inch,yield:'override',SMYS:60000*psiMPa,SMTS:75000*psiMPa,p:700*psiMPa*10});const z=100/(24*.266),M=Math.sqrt(1+.6275*z-.003375*z*z),flow=60000*psiMPa+69;const expected=20*flow*.266/24*.575/(1-.425/M)*.72;near(r.pmax,expected);assert(Math.abs(r.pmax/(psiMPa*10)-743)<2);assert(!r.fail);});
for(const id of ['ffs4','ffs5','b31g'])test(id+' NaN input rejects',()=>{const r=calc(id,{t_nom:NaN});contract(r);assert(r.fail);assert(!Number.isFinite(r.pmax));});
test('unknown select rejects',()=>assert(calc('b31g',{method:'invalid'}).fail));
console.log(`PASS ${passed}/${total}`);

// Review regression: longitudinal capacity with Ec governs (UG-27(c)(2) / API 579 2C.22, R = D/2)
{ const m=AD.modules.find(x=>x.id==='ffs5'); const g={p:18,T:20,K20:265,K:150,E:2e5,S:1.5,ST:1.05,v:1,c1:0,c2:0};
  m.fields.forEach(f=>{if(f.id&&f.type!=='heading'&&g[f.id]===undefined)g[f.id]=f.def}); Object.assign(g,{Ec:0.45,t_mm:9.5});
  const r=m.calc(g,AD.h), tc=g.t_nom-g.LOSS-g.FCA, Dev=g.side==='outer'?g.D:g.D+2*(g.LOSS+g.FCA), pl=10*2*100*0.45*tc/(Dev/2-0.4*tc);
  if(!(pl>0)||Math.abs(r.pmax-pl)>1e-9) throw new Error('longitudinal capacity must equal p_L with the evaluated diameter');
  if(r.fail!==true||r.pmax>pl+1e-6) throw new Error('review regression failed: longitudinal capacity'); console.log('review regression ok: p_L '+pl.toFixed(3)+' bar'); }

// ---- Lage des Abtrags (innen/außen), independent hand calculations ----
{ const assert=require('node:assert/strict');
  const B1=(Da,p,K,S,v)=>Da*p/(20*K/S*v+p);
  // ffs4 outer: Da_eff = Da - 2*(t_nom - t_am + FCA) = 1000 - 2*(10 - 8 + 0.5) = 995
  const g4={...base('ffs4'),side:'outer'}, r4o=get('ffs4').calc(g4,AD.h), r4i=get('ffs4').calc({...g4,side:'inner'},AD.h);
  assert.ok(Math.abs(r4o.headline.value-B1(995,10,150,1.5,1))<1e-9,'ffs4 outer t_min');
  assert.ok(Math.abs(r4i.headline.value-B1(1000,10,150,1.5,1))<1e-9,'ffs4 inner t_min');
  assert.ok(r4o.headline.value<r4i.headline.value,'outer loss reduces Da -> smaller t_min');
  // ffs5 inner: D_eval = D + 2*(LOSS + FCA); with LOSS=1, FCA=0.5 -> 1003
  const g5={...base('ffs5'),LOSS:1}, r5i=get('ffs5').calc({...g5,side:'inner'},AD.h), r5o=get('ffs5').calc({...g5,side:'outer'},AD.h);
  const row=(r,s)=>r.rows.find(x=>x[1]===s)[2];
  assert.equal(row(r5i,'D'),g5.D+2*(1+g5.FCA)); assert.equal(row(r5o,'D'),g5.D);
  const tc=g5.t_nom-1-g5.FCA; assert.ok(Math.abs(row(r5i,'λ')-1.285*g5.s/Math.sqrt((g5.D+3)*tc))<1e-9,'lambda uses corrected D');
  // b31g: side does not change the result
  const g3=base('b31g'); assert.equal(get('b31g').calc({...g3,side:'inner'},AD.h).pmax,get('b31g').calc({...g3,side:'outer'},AD.h).pmax);
  console.log('side regression ok (ffs4 Da_eff, ffs5 D correction, b31g unchanged)'); }

// ---- Rohrbogen: Bogenfaktor nach EN 13480-3 §6.2.3, independent hand calculation ----
{ const assert=require('node:assert/strict');
  const kI=(x)=>(x-0.25)/(x-0.5), kE=(x)=>(x+0.25)/(x+0.5), B1=(Da,p,K,S,v)=>Da*p/(20*K/S*v+p);
  const g4={...base('ffs4'),geom:'bend',Rb:1500}; // Da 1000 -> R/Da = 1.5
  const ri=get('ffs4').calc({...g4,bpos:'intr'},AD.h), re=get('ffs4').calc({...g4,bpos:'extr'},AD.h), rf=get('ffs4').calc({...g4,bpos:'flank'},AD.h);
  const t0=B1(1000,10,150,1.5,1);
  assert.ok(Math.abs(ri.headline.value-t0*kI(1.5))<1e-9,'intrados'); assert.ok(Math.abs(re.headline.value-t0*Math.max(1,kE(1.5)))<1e-9,'extrados (k >= 1)'); assert.ok(Math.abs(rf.headline.value-t0)<1e-9,'flank');
  assert.ok(get('ffs4').calc({...g4,Rb:900},AD.h).fail,'R/Da < 1 rejected');
  const g3={...base('b31g'),T:20}, p0=get('b31g').calc(g3,AD.h).pmax, p1=get('b31g').calc({...g3,geom:'bend',Rb:3*g3.D,bpos:'intr'},AD.h).pmax;
  assert.ok(p0>0&&Math.abs(p1-p0/kI(3))<1e-6,'b31g bend = straight / k');
  console.log('bend regression ok (ffs4 k_i/k_e/flank, b31g Pf/k)'); }
