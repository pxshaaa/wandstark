'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/b13.js');
const m=AD.modules.find(m=>m.id==='b13'),base={p:10,K:180,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
const cases=[['default',{}],['single',{z:1,movement:0}],['multi',{n:3,s:0.5}],['failed',{p:100}],['nan',{Di:NaN}],['wide',{q:200,r:50,w:100}],['tall',{q:2,r:0.5,w:1000}]];
const out=path.join(__dirname,'../out');fs.mkdirSync(out,{recursive:true});
function check(svg){
 assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const box=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),W=+box[1],V=+box[2];
 const bound=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=V,`Grenze ${x},${y}`);
 for(const tag of svg.replace(/<defs>[\s\S]*?<\/defs>/,'').matchAll(/<\w+\b[^>]*>/g)){
  const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  // Dimension text y=-3 is local SVG geometry; test transformed canvas positions.
  const tr=(a.transform||'').match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);
  if(tr){const t=+tr[3]*Math.PI/180;bound(+tr[1]- +(a.y||0)*Math.sin(t),+tr[2]+ +(a.y||0)*Math.cos(t));}
  else for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']])if(x in a&&y in a)bound(+a[x],+a[y]);
  if(a.points)for(const p of a.points.split(' '))bound(...p.split(',').map(Number));
  if(a.width&&a.height&&a.x&&a.y)bound(+a.x + +a.width,+a.y + +a.height);
 }
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);
}
let pass=0;
for(const [name,patch] of cases){const g={...base,...patch},svg=m.draw(g,AD.h,m.calc(g,AD.h));check(svg);if(name==='nan')assert(svg.includes('Maße eingeben'));else assert(svg.includes('cut')&&svg.includes('o bad'));fs.writeFileSync(path.join(out,`b13-${name}.svg`),svg);pass++;}
check(m.draw(null,AD.h,null));
console.log(`PASS ${pass}/${cases.length}`);
(async()=>{
 let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch(e){console.log('PNG: Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;
 try{browser=await chromium.launch({headless:true});}catch(e){console.log('PNG: Chromium nicht startbar; SVG-Grenzen geprüft: '+e.message.split('\n')[0]);return;}
 try{const page=await browser.newPage({viewport:{width:840,height:620}}),css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const [name] of cases){await page.setContent(`<style>${css}body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(path.join(out,`b13-${name}.svg`),'utf8')}`);await page.locator('svg.tz').screenshot({path:path.join(out,`b13-${name}.png`)});}
  console.log(`PNG: ${cases.length} Ansichten gerendert (headless).`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
