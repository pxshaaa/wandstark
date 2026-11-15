'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/b10.js');
const m=AD.modules.find(x=>x.id==='b10');
const base={p:230,T:100,K:180,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,
 ...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),Da:1000,sn:120}; // test geometry fixed, independent of UI defaults
function check(svg){
 assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const box=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(box);
 const W=+box[1],V=+box[2],bound=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=V,`outside ${x},${y}`);
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 for(const tag of body.matchAll(/<(?:line|rect|circle|text|polygon|polyline)\b[^>]*>/g)){
  const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  // H.draw.dim uses local y=-3 for text; check final transformed coordinates.
  if(a.transform){
   const tr=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);assert(tr);
   const q=+tr[3]*Math.PI/180,x=+(a.x||0),y=+(a.y||0);
   bound(+tr[1]+x*Math.cos(q)-y*Math.sin(q),+tr[2]+x*Math.sin(q)+y*Math.cos(q));
  }else for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']])if(x in a&&y in a)bound(+a[x],+a[y]);
  if(a.width&&a.height&&a.x&&a.y)bound(+a.x + +a.width,+a.y + +a.height);
 }
 // Ring contour uses absolute M/A commands. Check arc extents, not only endpoints.
 for(const p of body.matchAll(/<path d="([^"]+)"/g)){
  const tokens=p[1].match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];
  for(let i=0;i<tokens.length;){const c=tokens[i++];
   if(c==='M'){bound(+tokens[i++],+tokens[i++]);}
   else if(c==='A'){const rx=+tokens[i++],ry=+tokens[i++];i+=3;const x=+tokens[i++],y=+tokens[i++];bound(x,y);bound(185-rx,132-ry);bound(185+rx,132+ry);}
   else assert(c==='Z');
  }
 }
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);
 assert(svg.match(/class="tx tb2">([^<]*)<\/text><\/g><\/svg>/)[1].length<=44);
}
const cases=[['default',{}],['thick',{sn:160}],['failed',{p:400}],['sphere',{shape:'sph'}],['thin',{sn:1}],['nan',{Da:NaN}],['invalid',{sn:500}]];
const out=path.join(__dirname,'../out');fs.mkdirSync(out,{recursive:true});let passed=0;
for(const [name,patch] of cases){
 const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);check(svg);
 if(['nan','invalid'].includes(name))assert(svg.includes('Maße eingeben'));
 else {assert(svg.includes('Da '+AD.h.fmt(g.Da,1)));assert(svg.includes('Di '+AD.h.fmt(g.Da-2*g.sn,1)));assert(svg.includes('s '+AD.h.fmt(g.sn,1)));assert(svg.includes('cut'));}
 if(name==='failed')assert(svg.includes('o bad'));
 fs.writeFileSync(path.join(out,`b10-${name}.svg`),svg);passed++;
}
check(m.draw(null,AD.h,null));
console.log(`PASS ${passed}/${cases.length}`);
(async()=>{
 let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch(e){console.log('PNG: Playwright nicht verfügbar; Grenzen geprüft.');return;}
 let browser;
 try{browser=await chromium.launch({headless:true});}
 catch(e){
  if(!/Permission denied|Operation not permitted/.test(String(e)))throw e;
  console.log('PNG: Sandbox blockiert Chromium; Ersatzrendering mit librsvg.');
  const {spawnSync}=require('node:child_process');
  // librsvg does not resolve the application's CSS custom properties reliably.
  // Resolve the existing light-theme tokens without changing the source SVGs.
  const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8'),tokens={};
  for(const a of css.matchAll(/--([\w-]+):([^;}]+)/g))if(!(a[1] in tokens))tokens[a[1]]=a[2];
  const drawingCSS=css.slice(css.indexOf('.tz{')).replace(/var\(--([\w-]+)\)/g,(_,key)=>tokens[key]);
  for(const [name] of cases){
   const svg=fs.readFileSync(path.join(out,`b10-${name}.svg`),'utf8').replace('<defs>',`<style>${drawingCSS}</style><defs>`);
   const result=spawnSync('rsvg-convert',['--background-color','white','-w','840','-o',path.join(out,`b10-${name}.png`)],{encoding:'utf8',input:svg});
   if(result.error&&result.error.code==='ENOENT'){console.log('PNG: librsvg nicht verfügbar; SVG-Grenzen geprüft.');return;}
   assert.equal(result.status,0,result.stderr);
  }
  console.log(`PNG: ${cases.length} Ansichten mit librsvg gerendert.`);return;
 }
 try{
  const page=await browser.newPage({viewport:{width:840,height:620}});
  const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const [name] of cases){
   await page.setContent(`<style>${css}body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(path.join(out,`b10-${name}.svg`),'utf8')}`);
   await page.locator('svg.tz').screenshot({path:path.join(out,`b10-${name}.png`)});
  }
  console.log(`PNG: ${cases.length} Ansichten gerendert (headless).`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
