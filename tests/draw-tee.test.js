'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/tee.js');
const output=path.join(__dirname,'../out');fs.mkdirSync(output,{recursive:true});
let pass=0,total=0;const files=[];
for(const id of ['tee_ad','tee_en']){
 const m=AD.modules.find(m=>m.id===id),base={p:20,K:182,K20:235,S:1.5,ST:1.05,v:1,c1:.2,c2:.8};
 for(const f of m.fields)base[f.id]=f.def;
 [{},{dA:219.1,sS:10},{p:500,lb:25},{dA:NaN},id==='tee_en'?{RpT:1e308,Rp20:1e308,Rm:1e308}:{K:1e308}].forEach((change,i)=>{
  total++;try{
   const g={...base,...change},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);
   assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(svg));
   const vb=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(vb);const [w,h]=vb.slice(1).map(Number);
   for(const tag of svg.matchAll(/<[^>]+>/g)){
    const tr=tag[0].match(/transform="translate\(([\d.-]+) ([\d.-]+)\) rotate\(([\d.-]+)\)"/);
    for(const a of tag[0].matchAll(/\b(x[12]?|y[12]?|cx|cy)="(-?[\d.]+)"/g)){
     const n=Number(a[2]);
     // Dimension text y=-3 is local: check its transformed global position.
     if(tr){const angle=Number(tr[3])*Math.PI/180,x=Number(tr[1])-n*Math.sin(angle),y=Number(tr[2])+n*Math.cos(angle);assert.ok(x>=0&&x<=w&&y>=0&&y<=h);}
     else assert.ok(n>=0&&n<=(a[1].includes('x')?w:h),`${id} ${i}: ${a[0]}`);
    }
    const p=tag[0].match(/points="([^"]+)"/);if(p)for(const point of p[1].split(' ')){const [x,y]=point.split(',').map(Number);assert.ok(x>=0&&x<=w&&y>=0&&y<=h);}
    const rect=tag[0].match(/^<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
    if(rect){const [x,y,rw,rh]=rect.slice(1).map(Number);assert.ok(x+rw<=w+.01&&y+rh<=h+.01);}
   }
   if(i!==3){for(const field of [id==='tee_en'?'Do':'Da',id==='tee_en'?'eord':'sA','dA','sS','lb'])assert.ok(new RegExp('data-p="[^"]*\\b'+field+'\\b').test(svg));
    assert.ok(svg.includes('cut'));if(i!==4)assert.ok(svg.includes('class="h"'));if(i===2||i===4)assert.ok(svg.includes('bad'));
   }else assert.ok(svg.includes('Maße eingeben'));
   const file=path.join(output,`${id.replace('_','-')}-${i}.svg`);fs.writeFileSync(file,svg);files.push(file);pass++;
  }catch(e){console.error(id,i,e.message);process.exitCode=1;}
 });
}
console.log(`PASS ${pass}/${total}`);
(async()=>{
 let pw;try{pw=require(process.env.HOME+'/.claude/skills/playwright-skill/node_modules/playwright');}catch(e){console.log('Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{browser=await pw.chromium.launch({headless:true});}catch(e){console.log('Headless-Rendering nicht verfügbar: '+e.message.split('\n')[0]);return;}
 try{const page=await browser.newPage({viewport:{width:840,height:640},deviceScaleFactor:1});for(const file of files){
  await page.setContent('<style>body{margin:0;background:white}svg{width:840px;height:640px}.o{stroke:#222;stroke-width:1.4;fill:none}.t,.d,.h{stroke:#444;stroke-width:.6;fill:none}.h{stroke-dasharray:4 2}.c{stroke:#555;stroke-width:.6;stroke-dasharray:9 3 2 3}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.hl{stroke:#777;stroke-width:.5}.frame,.frame2{fill:none;stroke:#777;stroke-width:.6}.tx{font:9px sans-serif;fill:#222;stroke:none}.tb1{font-size:11px}.tb2{font-size:8px}.ar{fill:#444}.bad{stroke:#c22}</style>'+fs.readFileSync(file,'utf8'));
  // Requested raster inspection: return PNG in memory, preserving SVG-only output files.
  const png=await page.screenshot();if(process.env.TEE_INSPECT==='1')console.log('PNG '+path.basename(file)+' '+png.toString('base64'));
 }
 console.log('Headless PNG: '+files.length+' (im Speicher)');}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
