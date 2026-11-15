'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/s3b.js');
const out=path.join(__dirname,'../out');fs.mkdirSync(out,{recursive:true});
const dumps=[];let passed=0;
function check(svg){
 assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));
 const [,w,h]=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),W=+w,H=+h;
 const bound=(x,y)=>assert(x>=0&&x<=W&&y>=0&&y<=H,`outside ${x},${y}`);
 // Dimensions use local y=-3; test transformed coordinates, as ISO dimension
 // text has its own origin. Definitions have their own coordinate systems.
 const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
 for(const t of body.matchAll(/<(?:line|rect|circle|text|polygon|polyline)\b[^>]*>/g)){
 const a=Object.fromEntries([...t[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 if(a.transform){const tr=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);assert(tr);const angle=+tr[3]*Math.PI/180;bound(+tr[1]-(+a.y)*Math.sin(angle),+tr[2]+(+a.y)*Math.cos(angle));}
 else for(const [key,val] of Object.entries(a)){if(/^(x|x1|x2|cx)$/.test(key))assert(+val>=0&&+val<=W);if(/^(y|y1|y2|cy)$/.test(key))assert(+val>=0&&+val<=H);}
 if(a.width&&a.x)bound(+a.x+(+a.width),+a.y+(+a.height));
 if(a.r){bound(+a.cx-(+a.r),+a.cy-(+a.r));bound(+a.cx+(+a.r),+a.cy+(+a.r));}
 if(a.points)for(const pt of a.points.split(' '))bound(...pt.split(',').map(Number));
 }
 for(const p of body.matchAll(/<path d="([^"]+)"/g)){const ts=p[1].match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);for(let i=0;i<ts.length;){const c=ts[i++];if(c==='M'||c==='L')bound(+ts[i++],+ts[i++]);else if(c==='A'){i+=5;bound(+ts[i++],+ts[i++]);}else assert(c==='Z');}}
 assert(svg.match(/class="tx tb1">([^<]*)/)[1].length<=28);assert(svg.match(/class="tx tb2">([^<]*)<\/text><\/g><\/svg>$/)[1].length<=44);
}
for(const id of ['s3p','s3o']){
 const m=AD.modules.find(m=>m.id===id),base={p:10,T:20,K:150,K20:150,S:1.5,ST:1.05,v:1,c1:0,c2:0,...Object.fromEntries(m.fields.filter(f=>'def' in f).map(f=>[f.id,f.def]))};
 const cases=id==='s3p'?[['default',{}],['without-pad',{pad:'no',bv:NaN,hv:NaN,ev:NaN}],['failed',{F:1000}],['large',{Da:5000,sn:20,hp:1000,hv:1200,bv:400,b:350,ap:400}],['nan',{sn:NaN}]]:[['default',{}],['thin',{t:2,alpha:30}],['failed',{F:1000}],['wide',{b:250,d:80,dp:70,edge:100,h:200}],['nan',{d:NaN}]];
 for(const [name,patch] of cases){const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);check(svg);if(name==='nan')assert(svg.includes('Maße eingeben'));else{assert(svg.includes('cut'));assert(svg.includes('o bad'));}const file=path.join(out,`s3b-${id}-${name}.svg`);fs.writeFileSync(file,svg);dumps.push(file);passed++;}
 // Optional result and primitive invalid geometry must never throw.
 check(m.draw(base,AD.h,null));check(m.draw({},AD.h,null));
}
console.log(`PASS ${passed}/${dumps.length}`);
(async()=>{let chromium;try{({chromium}=require(path.join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}catch(e){console.log('PNG: Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{browser=await chromium.launch({headless:true,...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'})});}catch(e){if(/Permission denied|Operation not permitted|Executable doesn't exist/.test(String(e))){console.log('PNG: Browser nicht verfügbar; SVG-Grenzen geprüft.');return;}throw e;}
 try{const page=await browser.newPage({viewport:{width:840,height:620},deviceScaleFactor:1}),css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8');for(const file of dumps){await page.setContent(`<style>${css} body{margin:0;background:white}.tz{width:840px;max-width:none}</style>${fs.readFileSync(file,'utf8')}`);await page.locator('svg.tz').screenshot({path:file.replace(/\.svg$/,'.png')});}console.log(`PNG: ${dumps.length} Ansichten gerendert (headless).`);}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
