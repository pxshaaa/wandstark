'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b1.js');
const base={p:10,T:100,K:180,K20:235,E:200000,S:1.5,ST:1.05,v:0.85,c1:0.5,c2:1};
const out=path.resolve(__dirname,'../out');
fs.mkdirSync(out,{recursive:true});
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
function near(a,b){assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const images=[];
// Coordinates are checked in the SVG viewport, including local dimension-label transforms.
// Definition geometry (marker/pattern viewports) has its own coordinate system.
function bounds(svg){
  assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
  const [,w,h]=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  assert.equal(w,420);assert(h>=260&&h<=320);
  const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
  for(const m of body.matchAll(/<(?:line|rect|circle|text)\b[^>]*>/g)){
    const tag=m[0],attrs=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));
    const tr=attrs.transform||'',translate=tr.match(/translate\(([-\d.]+) ([-\d.]+)\)/),rotate=tr.match(/rotate\(([-\d.]+)(?: ([-\d.]+) ([-\d.]+))?\)/);
    for(const pair of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']]){
      if(!(pair[0] in attrs)&&!(pair[1] in attrs))continue;
      let x=Number(attrs[pair[0]]||0),y=Number(attrs[pair[1]]||0);
      if(rotate){const a=+rotate[1]*Math.PI/180,cx=+(rotate[2]||0),cy=+(rotate[3]||0),dx=x-cx,dy=y-cy;x=cx+dx*Math.cos(a)-dy*Math.sin(a);y=cy+dx*Math.sin(a)+dy*Math.cos(a);}
      if(translate){x+=+translate[1];y+=+translate[2];}
      assert(x>=0&&x<=w&&y>=0&&y<=h,`Koordinate ${x},${y}: ${tag}`);
    }
    if(attrs.width)assert(+attrs.x+(+attrs.width)<=w);
    if(attrs.height)assert(+attrs.y+(+attrs.height)<=h);
  }
  // All polygon vertices must also remain in the viewport.
  for(const m of body.matchAll(/points="([^"]+)"/g))for(const p of m[1].split(' ')){
    const [x,y]=p.split(',').map(Number);assert(x>=0&&x<=w&&y>=0&&y<=h);
  }
  assert(/class="tb"/.test(svg));
}
for(const id of ['sph','b3','b5']){
  const m=AD.modules.find(m=>m.id===id),defaults={...base,...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),...(id==='b3'?{beta:2}:id==='b5'?{C:.4}:{})};
  const size=id==='b5'?'D':'Da';
  const cases=[['default',{},true],['failure',{p:200,sn:2},true],['large',{[size]:1800,sn:18},true],['thin',{sn:.1},true],['nan',{[size]:NaN},false],['thick',{sn:300},true],['infinite',{sn:Infinity},false],['zero',{[size]:0},false]];
  if(id==='b3')cases.push(['korbbogen',{htype:'kb'},true],['crown',{beta:1,p:200},true],['knuckle',{beta:4,p:200},true]);
  for(const [name,patch,calc] of cases)test(`${id} ${name}`,()=>{
    const g={...defaults,...patch},r=calc?m.calc(g,AD.h):null,svg=m.draw(g,AD.h,r);
    bounds(svg);
    const placeholder=/Maße eingeben/.test(svg);
    if(!calc||id!=='b5'&&g.sn>=g.Da/2)assert(placeholder);
    else{
      assert(svg.includes(AD.h.fmt(g[size],1)));assert(svg.includes(AD.h.fmt(g.sn,1)));
      assert(/cut/.test(svg));assert(/marker-end="url\(#tza\)"/.test(svg));assert(/class="c"/.test(svg));
      if(r.fail||r.util>1)assert(/o bad/.test(svg));
      if(id==='b3'){
        assert(svg.includes(AD.h.fmt((g.htype==='kl'?1:.8)*g.Da,1)));
        assert(svg.includes(AD.h.fmt((g.htype==='kl'?.1:.154)*g.Da,1)));
        assert(svg.includes('h2 '+AD.h.fmt((g.htype==='kl'?.1935:.255)*g.Da-(g.htype==='kl'?.455:.635)*g.sn,1)));
        const crownReq=2*((g.htype==='kl'?1:.8)*g.Da+g.sn)*g.p/(40*g.K/g.S*g.v+g.p);
        const knuckleReq=g.Da*g.p*g.beta/(40*g.K/g.S*g.v);
        assert(svg.includes('Maßgebend: '+(knuckleReq>=crownReq?'Krempe':'Kalotte')));
      }
    }
    // No calculation result is required for drawing (e.g. live field editing).
    bounds(m.draw(g,AD.h,null));
    const file=path.join(out,`${id}-${name}.svg`);fs.writeFileSync(file,svg);images.push(file);
  });
}
// Independent hand worksheets verify that adding drawings left calc results unchanged.
// B1 sphere: s0=Da*p/(40*K/S*v+p); B3: max(knuckle,crown); B5: C*D1*sqrt(p*S/(10*K)).
for(const [id,patch] of [['sph',{}],['sph',{p:200,sn:2}],['sph',{sn:100}],['b3',{htype:'kb',beta:3}],['b5',{sn:2}]])test(`${id} Rechenregression ${JSON.stringify(patch)}`,()=>{
  const m=AD.modules.find(m=>m.id===id),g={...base,...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),...(id==='b3'?{beta:2}:id==='b5'?{C:.4}:{}),...patch};
  let expected;
  if(id==='sph')expected=g.Da*g.p/(40*g.K/g.S*g.v+g.p)+g.c1+g.c2;
  if(id==='b3')expected=Math.max(g.Da*g.p*g.beta/(40*g.K/g.S*g.v),2*(.8*g.Da+g.sn)*g.p/(40*g.K/g.S*g.v+g.p))+g.c1+g.c2;
  if(id==='b5')expected=g.C*g.D*Math.sqrt(g.p*g.S/(10*g.K))+(g.sn>25?0:g.c1)+g.c2;
  const r=m.calc(g,AD.h);for(const key of ['headline','util','pmax','test','rows','notes','fail','formula'])assert(key in r,key);
  near(r.headline.value,expected);near(r.util,expected/g.sn);
  if(patch.sn===2)assert(r.util>1);
  if(id==='sph'&&patch.sn===100)assert(r.fail);
});

// Review regressions: independent AD 2000 worksheets, bar / N/mm² / mm.
const moduleFor=id=>AD.modules.find(m=>m.id===id);
const input=(id,patch={})=>({...base,...Object.fromEntries(moduleFor(id).fields.map(f=>[f.id,f.def])),...(id==='b3'?{beta:2}:id==='b5'?{C:.4}:{}),...patch});
const value=(r,sym)=>r.rows.find(row=>row[1]===sym)[2];
function rejectedResult(r){assert(r.fail);assert.equal(r.test,null);assert(!Number.isFinite(r.pmax));assert(!Number.isFinite(r.headline.value));}
test('Finding 1: B5 deformation limit, operating and proof load',()=>{
  const g=input('b5',{D:1000,sn:4,p:.1,K:180,S:1.5,C:.4,E:200000,c1:0,c2:0});
  const r=moduleFor('b5').calc(g);
  near(r.headline.value,3.6514837167011076);
  near(value(r,'⁴√(0,0087·p/E)'),.008121239944801474);
  near(r.pmax,.005885057471264368/(1.25*235/180)); // 200000/.0087 * (4/1000)^4
  near(r.test.PT,Math.max(.125*235/180,.143));
  assert(r.fail);assert(!r.test.ok);
  // E is exposed and mandatory, rather than silently defaulted.
  assert.equal(moduleFor('b5').usesE,true);
  for(const E of [NaN,Infinity,0,-1])rejectedResult(moduleFor('b5').calc({...g,E}));
});
test('Finding 1: B5 upper ratio and proof-only lower-limit failure',()=>{
  // 34/100 > 1/3; no pressure capacity inside this simplified plate model.
  const thick=moduleFor('b5').calc(input('b5',{D:100,sn:34,p:.1,c1:0,c2:0}));
  assert(thick.fail);assert(!thick.test.ok);assert(!Number.isFinite(thick.pmax));
  // p_def=0.00588505747 bar: .005 passes service, PT=.00815972 fails scope.
  const proof=moduleFor('b5').calc(input('b5',{D:1000,sn:4,p:.005,c1:0,c2:0}));
  near(proof.pmax,.005885057471264368/(1.25*235/180));assert(proof.pmax<.005);
  assert(proof.fail);assert(!proof.test.ok);assert(proof.test.req<4);
  const valid=moduleFor('b5').calc(input('b5',{D:1000,sn:4,p:.001,c1:0,c2:0}));
  assert(!valid.fail);assert(valid.test.ok);
});
test('Finding 2: impossible B3 head, unknown type and collapsed bore',()=>{
  // h2=.1935*508-.455*300=-38.202; Da-2*sn=-92.
  near(.1935*508-.455*300,-38.202);
  for(const patch of [{sn:300,c1:290,p:1,beta:2},{htype:'other'},{sn:254},{sn:0}])
    rejectedResult(moduleFor('b3').calc(input('b3',patch)));
  const r=moduleFor('b3').calc(input('b3'));
  near(value(r,'h2'),94.658); // .1935*508-.455*8
});
test('Finding 4: crown B9 and knuckle beta guidance preserve arithmetic',()=>{
  require('../modules/b1-tips.js');
  const m=moduleFor('b3'),r=m.calc(input('b3',{v:1,c1:.5,c2:1}));
  near(value(r,'s0,K'),2.1166666666666667); // 508*10*2/(40*180/1.5)
  near(value(r,'s0,Kal'),10320/4810); // 2*(508+8)*10/(4800+10)
  assert(r.notes.some(n=>/Kalottenausschnitte.*B9/.test(n[1])));
  assert(r.notes.some(n=>/Krempenausschnitte.*β/.test(n[1])));
  assert(m.tips.some(t=>/Kalottenausschnitte.*B9/.test(t)));
  for(const m of AD.modules.filter(m=>['cyl','sph','b3','b5'].includes(m.id)))
    for(const tip of [...m.tips,...m.fields.map(f=>f.tip).filter(Boolean)])assert(tip.length<=220,tip);
});
test('Finding 5: B5 has no blanket 2 mm minimum (B5 §6.1, B0 §10)',()=>{
  const r=moduleFor('b5').calc(input('b5',{D:10,sn:1,p:10,C:.4,c1:0,c2:0}));
  near(r.headline.value,.3651483716701107); // .4*10*sqrt(10*1.5/1800)
  near(r.util,.3651483716701107);
  near(r.pmax,75); // strength: 1200*(1/4)^2, deformation > 2000 bar
  assert(!r.fail);assert(r.test.ok);
  assert(!moduleFor('b5').fields.find(f=>f.id==='sn').tip.includes('mindestens 2'));
});
for(const id of ['cyl','sph','b3'])test('Finding 6: '+id+' reports enforced minimum consistently',()=>{
  const r=moduleFor(id).calc(input(id,{p:.1,sn:2,c1:0,c2:0}));
  near(r.headline.value,2);near(r.util,1);near(value(r,'s'),2);
  near(r.test.req,2);assert(r.test.ok);
  if(id==='cyl')near(value(r,'s0'),50.8/2040.1);
  if(id==='sph')near(value(r,'s0'),50.8/4080.1);
  if(id==='b3')near(value(r,'s0,K'),101.6/4080);
});
test('Finding 7: B3 pressure-only equations explicitly exclude allowances',()=>{
  const r=moduleFor('b3').calc(input('b3',{v:1,c1:.5,c2:1}));
  near(value(r,'s0,K')+1.5,3.6166666666666667);
  near(r.headline.value,10320/4810+1.5);
  assert(r.formula.includes('Krempe:  s0,K ='));assert(r.formula.includes('Kalotte: s0,Kal ='));
  for(const line of r.formula.split('\n').filter(l=>/^(Krempe|Kalotte):/.test(l)))assert(!line.includes('+ c'));
});
test('Finding 8: B3 derived height is visible without a field tag',()=>{
  const m=moduleFor('b3'),g=input('b3'),calls=[];
  const draw={...AD.h.draw,tag:(ids,svg)=>{calls.push([ids,svg]);return AD.h.draw.tag(ids,svg);}};
  const svg=m.draw(g,{...AD.h,draw},m.calc(g));
  assert(svg.includes('h2 '+AD.h.fmt(94.658,1)));
  assert(!calls.some(([ids,svg])=>svg.includes('h2 ')));
  assert(calls.some(([ids])=>ids==='htype')); // shape selection still highlights contour
});
for(const id of ['cyl','sph','b3','b5'])test('Finding 9: '+id+' invalid numeric domains fail closed',()=>{
  for(const key of ['p','K','K20','S','ST','sn','c1','c2',id==='b5'?'D':'Da',...(id==='b5'?['C','E']:['v']),...(id==='b3'?['beta']:[])])
    for(const bad of [NaN,Infinity,-1])rejectedResult(moduleFor(id).calc(input(id,{[key]:bad})));
  for(const key of ['K','K20','S','ST','sn'])rejectedResult(moduleFor(id).calc(input(id,{[key]:0})));
  if(id!=='b5')rejectedResult(moduleFor(id).calc(input(id,{v:1.01})));
  // Zero pressure and zero allowances remain legitimate, finite calculations.
  const zero=moduleFor(id).calc(input(id,{p:0,c1:0,c2:0}));
  near(zero.headline.value,id==='b5'?0:2);assert(Number.isFinite(zero.pmax));
});
async function render(){
  let chromium;
  try{({chromium}=require(path.join(process.env.HOME,'.claude/skills/playwright-skill/node_modules/playwright')));}
  catch(e){console.log('Playwright nicht verfügbar; SVG-Grenzprüfung ausgeführt.');return;}
  let browser;
  try{browser=await chromium.launch({headless:true});}
  catch(e){if(/bootstrap_check_in|Permission denied|EPERM/.test(e.message)){console.log('SKIP Chromium: macOS-Sandbox blockiert; PNG mit librsvg, SVG-Grenzprüfung ausgeführt.');
    const {execFileSync}=require('node:child_process');
    const css=fs.readFileSync(path.resolve(__dirname,'../src/style.css'),'utf8');
    for(const file of images){const palette={paper:'#fff',ink:'#202a34',ink2:'#5c6772',dimc:'#3c576c',hatch:'#89939e',bad:'#c22',ok:'#287b42','f-mono':'monospace'};const drawingCss=css.slice(css.indexOf('.tz{')).replace(/var\(--([\w-]+)\)/g,(m,key)=>palette[key]||'#555');const svg=fs.readFileSync(file,'utf8').replace(/(<svg[^>]*>)/,'$1<style>'+drawingCss+'</style>');execFileSync('/opt/homebrew/bin/rsvg-convert',['-w','840','-o',file.replace('.svg','.png')],{input:svg});}
    return;}throw e;}
  try{
    const page=await browser.newPage({viewport:{width:840,height:640},deviceScaleFactor:1});
    const css=fs.readFileSync(path.resolve(__dirname,'../src/style.css'),'utf8');
    for(const file of images){
      const svg=fs.readFileSync(file,'utf8');
      await page.setContent(`<style>${css} body{margin:0;background:#fff}.tz{width:840px;--paper:#fff;--ink:#202a34;--ink2:#5c6772;--dimc:#3c576c;--hatch:#89939e;--bad:#c22}</style>${svg}`);
      // Animation-free SVG; a short settling wait keeps screenshots deterministic.
      await page.waitForTimeout(100);
      const outside=await page.locator('svg').evaluate(el=>{
        const box=el.viewBox.baseVal,bad=[];
        for(const e of el.querySelectorAll('path,polygon,polyline,text')){
          if(e.closest('defs'))continue;
          const b=e.getBBox(),m=e.getCTM(),root=el.getCTM().inverse();
          const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]];
          for(const [x,y] of points){const p=new DOMPoint(x,y).matrixTransform(root.multiply(m));if(p.x<0||p.x>box.width||p.y<0||p.y>box.height)bad.push(e.outerHTML.slice(0,120));}
        }return bad;
      });
      test(path.basename(file)+' gerenderte Grenzen',()=>assert.deepEqual(outside,[]));
      await page.locator('svg').screenshot({path:file.replace('.svg','.png')});
    }
  }finally{await browser.close();}
}
render().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>console.log(`PASS ${passed}/${total}`));
