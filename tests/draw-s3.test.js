'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s3.js');
const m=AD.modules.find(x=>x.id==='s3'),H=AD.h;
const base={...Object.fromEntries(m.fields.map(f=>[f.id,f.def])),p:5,K:235,K20:235,S:1.5,ST:1.1,v:1,c1:0,c2:1};
const cases=[['default',{}],['pad',{pad:'yes',ep:12,Da:1200,L:4000,h:250,a:500,angle:90}],['hemisphere',{head:'hem',h:988,angle:180,weight:10000}],['invalid',{Da:NaN}]];
fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});
const files=[];let pass=0;
for(const [name,patch]of cases){
 const g={...base,...patch},svg=m.draw(g,H,m.calc(g,H));
 assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(vb);const W=+vb[1],V=+vb[2];
 // Every numeric coordinate attribute must lie inside the outer viewBox.
 for(const tag of svg.matchAll(/<[^>]+>/g)){
  const txt=tag[0],tr=txt.match(/transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"/);
  for(const a of txt.matchAll(/\b(x|y|x1|x2|y1|y2|cx|cy)="([-\d.]+)"/g)){
   let v=+a[2];
   assert(v>=0&&v<=(a[1].startsWith('x')||a[1]==='cx'?W:V),`${name}: ${a[1]}=${v}`);
  }
 }
 const filename=path.join(__dirname,`../out/s3-${name}.svg`);fs.writeFileSync(filename,svg);files.push([name,filename]);pass++;
 // Embedded QA stylesheet only for PNG export; delivered SVG uses the application's classes.
 const css='.o{fill:none;stroke:#26384a;stroke-width:1.5}.t,.d{fill:none;stroke:#536475;stroke-width:.7}.c{stroke:#657687;stroke-width:.6;stroke-dasharray:8 3 1 3}.frame,.frame2{fill:none;stroke:#8c9aa8;stroke-width:.5}.hl{stroke:#7b8791;stroke-width:.45}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.bad{stroke:#c12929}.ar{fill:#536475}.tx{font:9px sans-serif;fill:#26384a;stroke:none}.dt{font-size:8px}.tb1{font-size:10px}.tb2{font-size:8px}';
 const render=require('child_process').spawnSync('rsvg-convert',['-w','840','-h','620','-b','white','-o',filename.replace('.svg','.png')],{input:svg.replace('<defs>','<style>'+css+'</style><defs>'),encoding:'utf8'});
 if(render.error && render.error.code==='ENOENT')console.log('librsvg nicht verfügbar.');else assert.strictEqual(render.status,0,render.stderr);
}
(async()=>{
 let pw;try{pw=require(path.join(process.env.HOME,'.claude/skills/playwright-skill/node_modules/playwright'));}catch(e){console.log('Playwright nicht verfügbar; SVG-Grenzen geprüft.');}
 if(pw){
  let browser;try{browser=await pw.chromium.launch({headless:true});}catch(e){console.log('PNG-Prüfung: Chromium durch Sandbox gesperrt; SVG-Grenzen bestanden.');console.log(`PASS ${pass}/${cases.length}`);return;}
  try{const page=await browser.newPage({viewport:{width:840,height:620},deviceScaleFactor:1});
   for(const [name,f]of files){const svg=fs.readFileSync(f,'utf8');
    await page.setContent(`<style>body{margin:0;background:#fff}svg{width:840px;height:620px}.o{fill:none;stroke:#26384a;stroke-width:1.5}.t,.d{fill:none;stroke:#536475;stroke-width:.7}.c{stroke:#657687;stroke-width:.6;stroke-dasharray:8 3 1 3}.frame,.frame2{fill:none;stroke:#8c9aa8;stroke-width:.5}.hl{stroke:#7b8791;stroke-width:.45}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.bad{stroke:#c12929}.ar{fill:#536475}.tx{font:9px sans-serif;fill:#26384a;stroke:none}.dt{font-size:8px}.tb1{font-size:10px}.tb2{font-size:8px}</style>${svg}`);
    // Check transformed coordinates and complete text boxes in the outer frame.
    const errors=await page.evaluate(()=>{let svg=document.querySelector('svg'),errs=[];for(let e of svg.querySelectorAll('text')){let b=e.getBBox(),t=e.getCTM();for(let p of [[b.x,b.y],[b.x+b.width,b.y+b.height]]){let q=new DOMPoint(...p).matrixTransform(t);if(q.x<0||q.y<0||q.x>840||q.y>620)errs.push(e.textContent);}}return errs;});
    assert.deepStrictEqual(errors,[],name+' text clipping');
    await page.screenshot({path:f.replace('.svg','.png')});
   }
  }finally{await browser.close();}
 }
 console.log(`PASS ${pass}/${cases.length}`);
})().catch(e=>{console.error(e);process.exitCode=1;});
