'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s31.js');
const m=AD.modules.find(m=>m.id==='s31'),H=AD.h;
const base={...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),c1:0,c2:1};
const cases=[['default',{}],['wide',{Da:6000,h:800,sn:18}],['tall',{Da:800,h:12000,sn:6}],['invalid',{Da:NaN}]];
const out=path.join(__dirname,'../out');fs.mkdirSync(out,{recursive:true});
let pass=0;const svgs=[];
for(const [name,patch]of cases){const g={...base,...patch},s=m.draw(g,H,m.calc(g,H));
 assert(s.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(s));
 const v=s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(v);
 for(const a of s.matchAll(/\b(x|y|x1|x2|y1|y2|cx|cy)="([-\d.]+)"/g)){
  const n=+a[2],limit=/^(x|cx)/.test(a[1])?+v[1]:+v[2];assert(n>=0&&n<=limit,`${name}: ${a[1]}=${n}`);
 }
 if(name==='invalid')assert(s.includes('Maße eingeben'));else {assert(s.includes('cut'));assert(s.includes('bad'));}
 fs.writeFileSync(path.join(out,`s31-${name}.svg`),s);svgs.push([name,s]);pass++;
}
(async()=>{
 let pw;try{pw=require(path.join(process.env.HOME,'.claude/skills/playwright-skill/node_modules/playwright'));}catch(e){console.log('Playwright nicht verfügbar; SVG-Grenzen geprüft.');}
 let browser; if(pw){try{browser=await pw.chromium.launch({headless:true});}catch(e){console.log('Chromium durch Sandbox gesperrt; PNG-Ausgabe mit librsvg.');}}
 if(browser){try{
 const page=await browser.newPage({viewport:{width:840,height:620}});
 for(const [name,s]of svgs){await page.setContent(`<style>body{margin:0}svg{width:840px;height:620px}.o{fill:none;stroke:#26384a;stroke-width:1.5}.t,.d{fill:none;stroke:#536475;stroke-width:.7}.c{stroke:#657687;stroke-dasharray:8 3 1 3}.hl{stroke:#7b8791;stroke-width:.45}.frame,.frame2{fill:none;stroke:#8c9aa8}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.bad{stroke:#c12929}.ar{fill:#536475}.tx{font:9px sans-serif;fill:#26384a}.dt,.tb2{font-size:8px}.tb1{font-size:10px}</style>${s}`);
 await page.screenshot({path:path.join(out,`s31-${name}.png`)});
 }
 }finally{await browser.close();}}
 if(!browser){const cp=require('child_process');for(const [name,s]of svgs){const css='.o{fill:none;stroke:#26384a;stroke-width:1.5}.t,.d{fill:none;stroke:#536475;stroke-width:.7}.c{stroke:#657687;stroke-dasharray:8 3 1 3}.hl{stroke:#7b8791;stroke-width:.45}.frame,.frame2{fill:none;stroke:#8c9aa8}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.bad{stroke:#c12929}.ar{fill:#536475}.tx{font:9px sans-serif;fill:#26384a}.dt,.tb2{font-size:8px}.tb1{font-size:10px}'; const r=cp.spawnSync('rsvg-convert',['-w','840','-h','620','-b','white','-o',path.join(out,`s31-${name}.png`)],{input:s.replace('<defs>','<style>'+css+'</style><defs>'),encoding:'utf8'});if(r.error&&r.error.code==='ENOENT'){console.log('librsvg nicht verfügbar; nur SVG-Grenzen geprüft.');break;}assert.strictEqual(r.status,0,r.stderr);}}
 console.log(`PASS ${pass}/${cases.length}`);
})().catch(e=>{console.error(e);process.exitCode=1;});
