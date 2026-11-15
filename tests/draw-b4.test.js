'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/b4.js');
const m=AD.modules.find(x=>x.id==='b4');
const base={p:10,T:100,K:180,K20:235,S:1.5,ST:1.05,v:.85,c1:.5,c2:1,
 ...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
const dumps=[];
function check(svg){
 assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(vb);const W=+vb[1],V=+vb[2];
 const bound=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=V,`outside ${x}, ${y}`);
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 for(const tag of body.matchAll(/<(?:line|rect|circle|text|polygon|polyline)\b[^>]*>/g)){
  const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  // Dimension text has a local y=-3; bound the actual transformed location.
  if(a.transform){
   const tr=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);assert(tr);
   const q=+tr[3]*Math.PI/180,X=+(a.x||0),Y=+(a.y||0);
   bound(+tr[1]+X*Math.cos(q)-Y*Math.sin(q),+tr[2]+X*Math.sin(q)+Y*Math.cos(q));
  }else for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']]){
   if(a[x]!==undefined&&a[y]!==undefined)bound(+a[x],+a[y]);
  }
  if(a.width&&a.height&&a.x&&a.y)bound(+a.x + +a.width,+a.y + +a.height);
  if(a.points)for(const point of a.points.split(' '))bound(...point.split(',').map(Number));
 }
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);
}
const cases=[['default',{}],['hemisphere',{R:400,di:800,dk:900,Da:1000,sn:24,r:24}],
 ['thin-failed',{sn:4,r:6,p:50}],['flat',{R:2000,di:500,sn:12,r:12}],
 ['nan',{R:NaN}],['bad-geometry',{di:3000}],['extreme',{R:1e300,di:1e299,Da:2e299,dk:1.5e299,sn:1e298,r:30}]];
fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});let passed=0;
for(const [name,patch] of cases){
 const g={...base,...patch},svg=m.draw(g,AD.h,m.calc(g,AD.h));check(svg);
 if(['nan','bad-geometry','extreme'].includes(name))assert(svg.includes('Maße eingeben'));
 else{
  assert(svg.includes('da '+AD.h.fmt(g.Da,1)));assert(svg.includes('dk '+AD.h.fmt(g.dk,1)));
  assert(svg.includes('di '+AD.h.fmt(g.di,1)));assert(svg.includes('se '+AD.h.fmt(g.sn,1)));
  assert(svg.includes('R '+AD.h.fmt(g.R,1)));assert(svg.includes('cut'));
  if(name==='thin-failed')assert(svg.includes('o bad'));
 }
 const file=path.join(__dirname,`../out/b4-${name}.svg`);fs.writeFileSync(file,svg);dumps.push(file);passed++;
}
check(m.draw(null,AD.h,null));passed++;
check(m.draw(base,AD.h,null));passed++;
const unsupported=m.draw({...base,attachment:'loose'},AD.h,null);check(unsupported);assert(unsupported.includes('Maße eingeben'));passed++;
console.log(`PASS ${passed}/${cases.length+3}`);
function localRender(){
 const {spawnSync}=require('node:child_process');
 const palette={paper:'#fbfcfd',ink:'#1b2630',ink2:'#6b7782',hatch:'#9aa6b0',dimc:'#1d5b86',bad:'#b0342a',ok:'#1b7548','f-mono':'monospace'};
 // librsvg lacks browser CSS custom property support: resolve drawing tokens.
 const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8').split('\n').filter(l=>l.startsWith('.tz')).join('\n').replace(/var\(--([\w-]+)\)/g,(_,key)=>palette[key]||'#ffffff');
 for(const f of dumps){
  const svg=fs.readFileSync(f,'utf8').replace(/(<svg[^>]*>)/,'$1<style>'+css+'</style>');
  const r=spawnSync('/opt/homebrew/bin/rsvg-convert',['--background-color','white','-w','840','-o',f.replace(/\.svg$/,'.png')],{input:svg,encoding:'utf8'});
  if(r.error||r.status!==0)throw new Error('SVG-Renderer: '+(r.error||r.stderr));
 }
 console.log(`PNG: ${dumps.length} Ansichten mit lokalem SVG-Renderer gerendert.`);
}
(async()=>{
 let chromium;
 try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}
 catch(e){console.log('PNG: Playwright nicht verfügbar.');localRender();return;}
 let browser;
 try{browser=await chromium.launch({headless:true});}
 catch(e){if(/Permission denied|Operation not permitted/.test(String(e))){console.log('PNG: Sandbox verhindert Browserstart.');localRender();return;}throw e;}
 try{
  const page=await browser.newPage({viewport:{width:840,height:620},deviceScaleFactor:1});
  const css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const f of dumps){await page.setContent(`<style>${css}body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(f,'utf8')}`);
   await page.locator('svg.tz').screenshot({path:f.replace(/\.svg$/,'.png')});}
  console.log(`PNG: ${dumps.length} Ansichten gerendert (headless).`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
