'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const AD=require('../src/ad.js');require('../data/materials.js');require('../data/profiles.js');require('../modules/b6.js');
const m=AD.modules.find(m=>m.id==='b6'),H=AD.h;
const defaults=Object.fromEntries(m.fields.filter(f=>f.type!=='heading').map(f=>[f.id,f.def]));
const base={...defaults,p:1,E:210000,K:235,K20:235,S:1.6,ST:1.1,c1:0,c2:0,T:20};
const cases=[['default',{}],['outside',{rings:'yes',ringSource:'standard',ringProfileType:'FL',ringSizeFL:'FL 80x12',p:.1}],['inside',{rings:'yes',ringPos:'inside',ringSource:'standard',ringProfileType:'HEB',ringSizeHEB:'HEB 100',p:.1}],['invalid',{Da:NaN}],['ipe',{rings:'yes',ringSource:'standard',ringProfileType:'IPE',ringSizeIPE:'IPE 300'}],['rhs',{rings:'yes',ringSource:'standard',ringProfileType:'RHS',ringSizeRHS:'RHS 40x20x2'}],['angle',{rings:'yes',ringSection:'angle',ringH:80,ringBf:60,ringTw:12,ringTf:10}],['channel',{rings:'yes',ringSource:'standard',ringProfileType:'UPN',ringSizeUPN:'UPN 50'}],['bad-ring',{rings:'yes',ringH:NaN}]];
for(const [type,list] of Object.entries(AD.profiles)) cases.push(['max-'+type,{rings:'yes',ringSource:'standard',ringProfileType:type,['ringSize'+type]:list[list.length-1].name}]);
cases.push(['halfpipe',{rings:'yes',ringSection:'halfpipe'}]);
const out=path.resolve(__dirname,'../out');fs.mkdirSync(out,{recursive:true});let passed=0;
for(const [name,patch] of cases){
 const g={...base,...patch},r=m.calc(g),svg=m.draw(g,H,r);
 assert.equal(typeof svg,'string');assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined/.test(svg),name);
 const box=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert.ok(box);
 for(const a of svg.matchAll(/\b(x|x1|x2|cx|y|y1|y2|cy)="(-?[\d.]+)"/g)){
  const max=a[1].includes('x')?+box[1]:+box[2];assert.ok(+a[2]>=0&&+a[2]<=max,name+' '+a[0]);
 }
 for(const p of svg.matchAll(/points="([^"]+)"/g))for(const pair of p[1].split(' ')){const [x,y]=pair.split(',').map(Number);assert.ok(x>=0&&x<=420&&y>=0&&y<=320,name+' polygon');}
 fs.writeFileSync(path.join(out,'b6-'+name+'.svg'),svg);passed++;
}
console.log(`PASS ${passed}/${cases.length}`);
// Optional headless render; PNGs are visual QA artifacts, not part of the calculator.
(async()=>{
 let pw;try{pw=require(path.join(process.env.HOME,'.claude/skills/playwright-skill/node_modules/playwright'));}catch{console.log('Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
 let browser;try{
 browser=await pw.chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:840,height:640},deviceScaleFactor:1});
 const style='<style>body{margin:0;background:white}svg{width:840px;height:640px} .o{stroke:#172b3b;stroke-width:1.3;fill:none}.t,.frame,.frame2{stroke:#777;stroke-width:.5;fill:none}.c{stroke:#777;stroke-width:.5;stroke-dasharray:8 2 1 2}.d{stroke:#405c70;stroke-width:.5;fill:none}.hl{stroke:#7d8d99;stroke-width:.5}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}.tx{font:8px sans-serif;fill:#123}.dt{font-size:7px}.tb1{font-weight:bold}.tb2{font-size:8px}.ar{fill:#405c70}.bad{stroke:#b22}</style>';
 for(const [name] of cases){await page.setContent(style+fs.readFileSync(path.join(out,'b6-'+name+'.svg'),'utf8'));await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'b6-'+name+'.png')});}
 console.log('Headless PNGs: '+cases.length);
 }finally{if(browser)await browser.close();}
})().catch(e=>{
 if(/Permission denied|bootstrap_check_in|Executable doesn't exist/.test(e.message)) console.log('PNG-Prüfung nicht verfügbar: Browserstart durch Umgebung gesperrt; SVG-Grenzen geprüft.');
 else {console.error(e.message);process.exitCode=1;}
});
