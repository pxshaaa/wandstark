'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/en13480.js');
const output=path.join(__dirname,'../out');fs.mkdirSync(output,{recursive:true});
let pass=0,total=0;
const files=[];
for(const id of ['pipe','bend']){
 const m=AD.modules.find(m=>m.id===id),base={p:40,c1:.2,c2:1,v:1};
 for(const f of m.fields)base[f.id]=f.def;
 [{}, {Do:508,sn:3,R:762}, {Do:60.3,sn:10,R:32,p:100}, {Do:NaN}].forEach((change,i)=>{
  total++;try{
   const g={...base,...change},svg=m.draw(g,AD.h,i===2?{ok:false}:null);
   assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(svg));
   const vb=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(vb);
   const [w,h]=vb.slice(1).map(Number);
   // H.draw.dim uses y=-3 inside a translated/rotated text. Resolve those
   // local coordinates before checking global positions; all other attrs direct.
   for(const tag of svg.matchAll(/<[^>]+>/g)){
    const tr=tag[0].match(/transform="translate\(([\d.-]+) ([\d.-]+)\) rotate\(([\d.-]+)\)"/);
    for(const a of tag[0].matchAll(/\b(x[12]?|y[12]?|cx|cy)="(-?[\d.]+)"/g)){
     let n=Number(a[2]),max=/x/.test(a[1])?w:h;
     if(tr){const angle=Number(tr[3])*Math.PI/180;
      const x=Number(tr[1])-n*Math.sin(angle),y=Number(tr[2])+n*Math.cos(angle);
      assert.ok(x>=0&&x<=w&&y>=0&&y<=h,'transformed text bounds');continue;}
     assert.ok(n>=0&&n<=max,`${id} ${i}: ${a[0]}`);
    }
    const points=tag[0].match(/points="([^"]+)"/);
    if(points)for(const p of points[1].split(' ')){const [x,y]=p.split(',').map(Number);assert.ok(x>=0&&x<=w&&y>=0&&y<=h);}
   }
   const file=path.join(output,`en13480-${id}-${i}.svg`);fs.writeFileSync(file,svg);files.push(file);pass++;
  }catch(e){console.error(id,i,e.message);process.exitCode=1;}
 });
}
console.log(`PASS ${pass}/${total}`);
// Optional headless visual evidence, loading only the user's known installation.
(async()=>{
 let pw;try{pw=require(process.env.HOME+'/.claude/skills/playwright-skill/node_modules/playwright');}catch(e){console.log('Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{browser=await pw.chromium.launch({headless:true});}
 catch(e){console.log('PNG-Sichtprüfung nicht möglich: Headless-Start gesperrt ('+e.message.split('\n')[0]+'). SVG-Grenzprüfung bestanden.');return;}
 try{const page=await browser.newPage({viewport:{width:840,height:600},deviceScaleFactor:1});
 for(const file of files){const svg=fs.readFileSync(file,'utf8');
 await page.setContent('<style>body{margin:0;background:white}svg{width:840px;height:600px}.o{stroke:#222;stroke-width:1.4;fill:none}.t,.d{stroke:#444;stroke-width:.6;fill:none}.c{stroke:#555;stroke-width:.6;stroke-dasharray:9 3 2 3}.cut{fill:url(#tzh)}.hl{stroke:#777;stroke-width:.5}.frame,.frame2{fill:none;stroke:#777;stroke-width:.6}.tx{font:9px sans-serif;fill:#222;stroke:none}.tb1{font-size:11px}.tb2{font-size:8px}.ar{fill:#444}.bad{stroke:#c22}</style>'+svg);
 await page.screenshot({path:file.replace(/\.svg$/,'.png')});}
 console.log('Headless PNG: '+files.length);
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
