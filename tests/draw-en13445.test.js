'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/en13445.js');
const mods=AD.modules.filter(m=>m.group==='EN 13445'),dumps=[];
function check(svg){
 assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const box=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(box);const W=+box[1],V=+box[2];assert.equal(W,420);
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 const bounds=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=V,`outside ${x},${y}`);
 for(const tag of body.matchAll(/<(?:line|rect|circle|text|polygon|polyline)\b[^>]*>/g)){
  const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  if(a.transform){const tr=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);assert(tr);const ang=+tr[3]*Math.PI/180,x=+(a.x||0),y=+(a.y||0);bounds(+tr[1]+x*Math.cos(ang)-y*Math.sin(ang),+tr[2]+x*Math.sin(ang)+y*Math.cos(ang));}
  else for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']])if(a[x]!==undefined&&a[y]!==undefined)bounds(+a[x],+a[y]);
  if(a.width&&a.height&&a.x&&a.y)bounds(+a.x + +a.width,+a.y + +a.height);
  if(a.points)for(const p of a.points.split(' '))bounds(...p.split(',').map(Number));
 }
 // Absolute path endpoint bounds; arc radii are positive and contained by construction.
 for(const m of body.matchAll(/<path d="([^"]+)"/g)){
  const ts=m[1].match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];
  for(let i=0;i<ts.length;){const cmd=ts[i++];if(cmd==='M'||cmd==='L')bounds(+ts[i++],+ts[i++]);else if(cmd==='A'){assert(+ts[i]>=0&&+ts[i+1]>=0);i+=5;bounds(+ts[i++],+ts[i++]);}else assert(/^[Zz]$/.test(cmd));}
 }
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);
}
const cases=[['default',{}],['small',{Da:200,sn:4,R:200,r:20,hi:48}],['failed',{p:200,sn:2}],['nan',{Da:NaN}],['sphere',{shape:'sph'}],['ellipsoid',{head:'ell'}],['hemisphere',{head:'hemi'}],['thick',{sn:600}],['nan-local',{R:NaN,alpha:NaN}],['steep',{alpha:70}]];
let passed=0;fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});
for(const m of mods){
 const base={...Object.fromEntries(m.fields.filter(f=>'def'in f).map(f=>[f.id,f.def])),p:10,K:180,K20:235,T:150,v:1,c1:.5,c2:1};
 for(const [name,patch]of cases){const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);check(svg);
 if(['nan','thick'].includes(name))assert(svg.includes('Maße eingeben'));
 if(name==='default')assert(svg.includes('en '+AD.h.fmt(g.sn,1)));
 if(name==='failed')assert(svg.includes('bad'));
 const file=path.join(__dirname,`../out/en13445-${m.id}-${name}.svg`);fs.writeFileSync(file,svg);dumps.push(file);passed++;
 }
 check(m.draw(base,AD.h,null));
}
console.log(`PASS ${passed}/${mods.length*cases.length}`);
async function render(){
 let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch(e){console.log('PNG: Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{browser=await chromium.launch({headless:true});}catch(e){if(/Permission denied|Operation not permitted/.test(String(e))){console.log('PNG: Sandbox verhindert Browserstart; SVG-Grenzen geprüft.');return;}throw e;}
 try{const page=await browser.newPage({viewport:{width:840,height:600},deviceScaleFactor:1});const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const file of dumps){await page.setContent(`<style>${css}body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(file,'utf8')}`);await page.locator('svg.tz').screenshot({path:file.replace(/\.svg$/,'.png')});}
  console.log(`PNG: ${dumps.length} Zeichnungen headless gerendert.`);
 }finally{await browser.close();}
}
render().catch(e=>{console.error(e);process.exitCode=1;});
