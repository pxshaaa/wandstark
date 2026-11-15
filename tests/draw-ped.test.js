'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/ped.js');
const m=AD.modules.find(m=>m.id==='ped');
const base={p:10,T:20,...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
const cases=[['default',{}],['t1',{fluid:'1'}],['t3',{fluid:'1',state:'liquid',p:100,V:20}],['t4',{state:'liquid',p:100,V:200}],['t5',{equipment:'steam',V:300,p:10}],['t6',{equipment:'piping',fluid:'1',DN:150}],['t7',{equipment:'piping',DN:300,p:20,T:400}],['t8',{equipment:'piping',state:'liquid',fluid:'1',DN:300}],['t9',{equipment:'piping',state:'liquid',DN:300,p:30}],['nan',{V:NaN}],['invalid',{p:0}],['extreme',{V:1e12,p:1e5}],['tiny',{V:1e-5,p:1e-4}]];
const dumps=[];let passed=0;
fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});
for(const [name,patch] of cases){
 const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);
 assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(vb);const W=+vb[1],H=+vb[2];
 const bound=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=H,`${name}: bounds ${x},${y}`);
 for(const a of svg.matchAll(/\b(x|x1|x2|cx|y|y1|y2|cy)="(-?[\d.]+)"/g)){
  const v=+a[2],limit=a[1].includes('x')?W:H;assert(v>=0&&v<=limit,`${name} ${a[1]}=${v}`);
 }
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 for(const tag of body.matchAll(/<rect\b[^>]*>/g)){
  const attrs=Object.fromEntries([...tag[0].matchAll(/(x|y|width|height)="([\d.]+)"/g)].map(m=>[m[1],+m[2]]));bound(attrs.x+attrs.width,attrs.y+attrs.height);
 }
 for(const p of body.matchAll(/<path d="([^"]+)"/g)){
  const nums=p[1].replace(/[MLZ]/g,' ').trim().split(/\s+/).map(Number);assert.equal(nums.length%2,0);for(let i=0;i<nums.length;i+=2)bound(nums[i],nums[i+1]);
 }
 if(['nan','invalid'].includes(name))assert(svg.includes('Maße eingeben'));
 else {assert(svg.includes('ped-region-'));assert(svg.includes('PS '));assert(svg.includes('logarithmische Achsen'));}
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);
 const file=path.join(__dirname,`../out/ped-${name}.svg`);fs.writeFileSync(file,svg);dumps.push(file);passed++;
}
console.log(`PASS ${passed}/${cases.length}`);
(async()=>{
 let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch{console.log('PNG: Playwright nicht verfügbar; Grenzen geprüft.');return;}
 let browser;try{browser=await chromium.launch({headless:true});}catch(e){
  if(!/Permission denied|Operation not permitted|bootstrap_check_in/.test(String(e)))throw e;
  console.log('PNG: Chromium durch Sandbox blockiert; SVG-Grenzen geprüft.');
  // Independent renderer fallback; only PNG artifacts are written.
  const cp=require('node:child_process');
  const css='.tz .frame,.tz .t{fill:none;stroke:#777;stroke-width:.6}.tz .o{fill:none;stroke:#222;stroke-width:1.5}.tz .c{fill:none;stroke:#999;stroke-width:.6;stroke-dasharray:14 3 2 3}.tz .tx{font-family:monospace;fill:#222;font-size:10px}.tz .tb2{font-size:8.5px}.tz .tb1{font-size:10px;font-weight:600}.tz .bad{stroke:#c33}';
  for(const file of dumps){const svg=fs.readFileSync(file,'utf8').replace('<defs>','<style>'+css+'</style><defs>');
   const png=cp.spawnSync('/opt/homebrew/bin/rsvg-convert',['-b','white','-w','840'],{input:svg});
   if(png.error||png.status!==0)throw png.error||new Error(String(png.stderr));
   fs.writeFileSync(file.replace('.svg','.png'),png.stdout);
  }
  console.log(`PNG: ${dumps.length} Diagramme mit librsvg gerendert.`);return;
 }
 try{
  const page=await browser.newPage({viewport:{width:840,height:640}}),css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');
  for(const file of dumps){await page.setContent(`<style>${css} body{margin:0;background:white}.tz{width:840px;max-height:none}</style>${fs.readFileSync(file,'utf8')}`);await page.locator('svg').screenshot({path:file.replace('.svg','.png')});}
  console.log(`PNG: ${dumps.length} Diagramme headless gerendert.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
