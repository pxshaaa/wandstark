'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/ffs.js');
const files=[];let passed=0,total=0;
function bounds(svg){
 assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const v=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert(v);const W=+v[1],V=+v[2];assert.equal(W,420);assert(V>=260&&V<=320);
 const inside=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=V,`outside ${x},${y}`);
 // Definitions have their own coordinate systems; transformed dimension text is
 // checked in final page coordinates (H.draw.dim deliberately uses local y=-3).
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 for(const tag of body.matchAll(/<(?:line|rect|text|circle|polygon|polyline)\b[^>]*>/g)){
  const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  if(a.transform){const t=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);assert(t);const q=+t[3]*Math.PI/180,x=+(a.x||0),y=+(a.y||0);inside(+t[1]+x*Math.cos(q)-y*Math.sin(q),+t[2]+x*Math.sin(q)+y*Math.cos(q));}
  else for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']])if(a[x]!==undefined&&a[y]!==undefined)inside(+a[x],+a[y]);
  if(a.width&&a.height&&a.x&&a.y)inside(+a.x + +a.width,+a.y + +a.height);
  if(a.points)for(const p of a.points.split(' '))inside(...p.split(',').map(Number));
 }
 const title=svg.match(/class="tx tb1">([^<]*)/),sub=svg.match(/class="tx tb2">([^<]*)<\/text><\/g><\/svg>$/);assert(title&&title[1].length<=28);assert(sub&&sub[1].length<=44);
}
fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});
for(const id of ['ffs4','ffs5','b31g']){
 const m=AD.modules.find(x=>x.id===id),base={p:10,T:20,K:150,K20:235,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
 const altered=id==='ffs4'?{t_am:7,t_mm:6,Da:600}:id==='ffs5'?{s:250,c:150,t_mm:6}:{L:1000,d:7};
 const failed=id==='ffs4'?{t_mm:1}:id==='ffs5'?{L_msd:1}:{d:8.5};
 for(const [name,patch] of [['default',{}],['altered',altered],['failed',failed],['nan',{t_nom:NaN}],['huge',id==='ffs5'?{s:1e9,c:1e8}:id==='ffs4'?{Da:1e9}:{L:1e9}]]){
  const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);bounds(svg);
  if(name==='nan')assert(svg.includes('Maße eingeben'));else if(name==='failed')assert(svg.includes('bad'));
  if(name==='default')assert(svg.includes('cut')&&svg.includes('class="c"'));
  const file=path.join(__dirname,`../out/${id}-${name}.svg`);fs.writeFileSync(file,svg);files.push(file);passed++;total++;
 }
 // Null assessment result must also be safe.
 bounds(m.draw(base,AD.h,null));passed++;total++;
}
async function render(){
 let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch(e){console.log('PNG: Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{browser=await chromium.launch({headless:true});}catch(e){if(/Permission denied|Operation not permitted/.test(String(e))){console.log('PNG: Sandbox verhindert Browserstart; SVG-Grenzen geprüft.');return;}throw e;}
 try{
  const page=await browser.newPage({viewport:{width:840,height:620},deviceScaleFactor:1});const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const file of files){await page.setContent(`<style>${css} body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(file,'utf8')}`);await page.locator('svg.tz').screenshot({path:file.replace(/\.svg$/,'.png')});}
  console.log(`PNG: ${files.length} Ansichten gerendert (headless).`);
 }finally{await browser.close();}
}
console.log(`PASS ${passed}/${total}`);
render().catch(e=>{console.error(e);process.exitCode=1;});
