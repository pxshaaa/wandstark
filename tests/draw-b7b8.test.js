'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b7b8.js');
const out=path.join(__dirname,'../out');
fs.mkdirSync(out,{recursive:true});
let passed=0,total=0;
const renders=[];
function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name+': '+e.stack);}}
// Independently transform local SVG coordinates (dimension text uses y=-3
// inside translate/rotate), rather than mistaking these for global positions.
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const unit=[1,0,0,1,0,0];
function bounds(svg){
 assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(svg));
 const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert.ok(vb);
 const W=+vb[1],H=+vb[2];assert.equal(W,420);assert.ok(H>=260&&H<=320);
 const stack=[unit]; let defs=0;
 for(const m of svg.matchAll(/<(\/?)([\w-]+)([^>]*?)(\/?)>/g)){
  const [,close,tag,attrs,self]=m;
  if(tag==='defs'){defs+=close?-1:1;continue;}if(defs)continue;
  if(close){stack.pop();continue;}
  const a=Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
  let t=stack[stack.length-1];
  for(const tr of (a.transform||'').matchAll(/(translate|rotate)\(([^)]+)\)/g)){
   const n=tr[2].trim().split(/[ ,]+/).map(Number);
   if(tr[1]==='translate') t=mul(t,[1,0,0,1,n[0],n[1]||0]);
   else {const ang=n[0]*Math.PI/180,c=Math.cos(ang),s=Math.sin(ang),x=n[1]||0,y=n[2]||0;
    t=mul(t,[c,s,-s,c,x-c*x+s*y,y-s*x-c*y]);}
  }
  function point(x,y){const X=t[0]*x+t[2]*y+t[4],Y=t[1]*x+t[3]*y+t[5];
   assert.ok(X>=-0.02&&X<=W+0.02&&Y>=-0.02&&Y<=H+0.02,`${tag}: (${X},${Y}) outside ${W}×${H}`);}
  if('x' in a||'y' in a){point(+(a.x||0),+(a.y||0));if(tag==='rect')point(+(a.x||0)+ +a.width,+(a.y||0)+ +a.height);}
  if('x1' in a){point(+a.x1,+a.y1);point(+a.x2,+a.y2);}
  if('cx' in a){point(+a.cx- +a.r,+a.cy- +a.r);point(+a.cx+ +a.r,+a.cy+ +a.r);}
  if(a.points){const n=a.points.trim().split(/[ ,]+/).map(Number);for(let i=0;i<n.length;i+=2)point(n[i],n[i+1]);}
  // Our paths contain only absolute M/L/Q/Z; check control points as well.
  if(a.d){assert.ok(!/[ACHVSTachvst]/.test(a.d));const n=(a.d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]).map(Number);for(let i=0;i<n.length;i+=2)point(n[i],n[i+1]);}
  if(!self)stack.push(t);
 }
}
for(const id of ['b7','b8']){
 const mod=AD.modules.find(m=>m.id===id);
 const g=Object.fromEntries(mod.fields.filter(f=>f.id).map(f=>[f.id,f.def]));
 const variants=id==='b7'?
  [['default',{},null],['four',{dn:42,dk:35,n:4},{ok:true}],['failed',{dk:10},{ok:false}],['thin',{dn:12,dk:11.9,n:32},null],['range',{n:121},null],['invalid',{dk:NaN},null]]:
  [['default',{},null],['large',{di:800,da:1200,dt:1060,dD:900,dL:52,hf:120,ha:210,sf:36,s1:24,r:16},null],['failed',{}, {fail:true}],['thin',{s1:1,sf:2,hf:20,ha:40},null],['range',{dt:700},null],['invalid',{di:NaN},null]];
 for(const [label,change,r] of variants)test(id+' '+label,()=>{
  const input={...g,...change},svg=mod.draw(input,AD.h,r);bounds(svg);
  if(label==='invalid'||label==='range')assert.ok(svg.includes('Maße eingeben'));
  else {
   if(label==='failed')assert.ok(svg.includes('o bad'));
   if(id==='b7'){
    assert.ok(svg.includes('dK '+AD.h.fmt(input.dk,1)));assert.ok(svg.includes('M'+AD.h.fmt(input.dn,0)));
    // One pitch circle + one outer reference circle, then exactly n bolts.
    assert.equal((svg.match(/<circle /g)||[]).length,input.n+2);
    if(label==='default')assert.ok(svg.includes('cx="295" cy="65"')); // top bolt: 131 - 66
   } else {
    for(const [key,sym] of [['di','di'],['da','da'],['dt','dt'],['dD','dD'],['dL','dL'],['hf','hF'],['ha','hA'],['sf','sF'],['s1','s₁'],['r','r']])
     assert.ok(svg.includes(sym+' '+AD.h.fmt(input[key],1)),sym);
    assert.ok(svg.includes('A–A')&&svg.includes('B–B')&&svg.includes('cut'));
    if(label==='default'){
     // Radial drawing scale independently: (320-2*20)/600 = 7/15.
     // Bore limits = 200 ± 400/2*7/15, rounded to 2 decimals.
     assert.ok(svg.includes('x1="106.67"'));assert.ok(svg.includes('x2="293.33"'));
    }
   }
  }
  const file=path.join(out,`${id}-${label}.svg`);fs.writeFileSync(file,svg);renders.push(file);
 });
 test(id+' missing inputs',()=>bounds(mod.draw(null,AD.h,null)));
}
async function render(){
 let pw;
 try{pw=require(path.join(process.env.HOME,'.claude/skills/playwright-skill/node_modules/playwright'));}
 catch(e){if(e.code==='MODULE_NOT_FOUND'){console.log('Rendering übersprungen: Playwright nicht verfügbar.');return;}throw e;}
 let browser;
 try{browser=await pw.chromium.launch({headless:true});}
 catch(e){
  // The macOS task sandbox can deny Chromium's Mach bootstrap registration.
  // Use an installed non-browser rasterizer, preserving headless execution.
  const {spawnSync}=require('node:child_process');
  const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  const vars={};
  for(const m of css.matchAll(/--([\w-]+):([^;{}]+);/g))if(!(m[1] in vars))vars[m[1]]=m[2];
  const drawingCss=css.slice(css.indexOf('.tz{')).replace(/var\(--([\w-]+)\)/g,(_,v)=>vars[v]||'#16202a');
  for(const file of renders){
   const source=fs.readFileSync(file,'utf8').replace(/(<svg[^>]*>)/,'$1<style>'+drawingCss+'</style>');
   const res=spawnSync('/opt/homebrew/bin/rsvg-convert',['-w','840','-b','white','-o',file.replace(/\.svg$/,'.png')],{input:source,encoding:'utf8'});
   if(res.error||res.status!==0)throw new Error('SVG-Rasterung fehlgeschlagen: '+(res.error||res.stderr));
  }
  console.log('RENDER '+renders.length+' PNG (rsvg; Chromium durch Sandbox blockiert)');return;
 }
 try{
  const page=await browser.newPage({viewport:{width:840,height:640},deviceScaleFactor:1});
  const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const file of renders){
   await page.setContent(`<style>${css}body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(file,'utf8')}`);
   await page.locator('svg.tz').screenshot({path:file.replace(/\.svg$/,'.png')});
  }
  console.log('RENDER '+renders.length+' PNG (headless)');
 }finally{await browser.close();}
}
render().then(()=>{console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;}).catch(e=>{console.error(e);console.log(`PASS ${passed}/${total} (Rendering fehlgeschlagen)`);process.exitCode=1;});
