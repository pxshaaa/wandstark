'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const AD=require('../src/ad.js');
require('../data/materials.js');
require('../modules/b2.js');
const m=AD.modules.find(x=>x.id==='b2');
const base=Object.assign({p:10,T:20,K:150,K20:150,S:1.5,ST:1.05,v:1,c1:0,c2:0},
  Object.fromEntries(m.fields.filter(f=>f.id&&'def' in f).map(f=>[f.id,f.def])));
// SVG bounds include transformed dimension text; marker/pattern coordinates use
// their own coordinate system and are intentionally excluded from page bounds.
function check(svg){
  assert.equal(typeof svg,'string');assert(svg.startsWith('<svg'));
  assert(!/NaN|undefined|Infinity/.test(svg));
  const box=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(box);
  const W=+box[1],V=+box[2];
  const body=svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
  const bound=(x,y)=>{assert(x>=0&&x<=W&&y>=0&&y<=V,`outside ${x},${y}`);};
  for(const tag of body.matchAll(/<(?:line|rect|circle|text|polygon|polyline)\b[^>]*>/g)){
    const a=Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    if(a.transform){
      const tr=a.transform.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);
      assert(tr,'known dimension text transform');
      const angle=+tr[3]*Math.PI/180,x=+(a.x||0),y=+(a.y||0);
      bound(+tr[1]+x*Math.cos(angle)-y*Math.sin(angle),+tr[2]+x*Math.sin(angle)+y*Math.cos(angle));
    }else{
      for(const [x,y] of [['x','y'],['x1','y1'],['x2','y2'],['cx','cy']]){
        if(a[x]!==undefined&&a[y]!==undefined)bound(+a[x],+a[y]);
      }
    }
    if(a.width&&a.height&&a.x&&a.y)bound(+a.x + +a.width,+a.y + +a.height);
    if(a.points)for(const point of a.points.split(' '))bound(...point.split(',').map(Number));
  }
  // Commands emitted by B2 are absolute; check endpoints and H/V segments.
  for(const path of body.matchAll(/<path d="([^"]+)"/g)){
    let x=0,y=0;
    const tokens=path[1].match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];
    for(let i=0;i<tokens.length;){
      const cmd=tokens[i++];
      if(cmd==='M'||cmd==='L'){x=+tokens[i++];y=+tokens[i++];bound(x,y);}
      else if(cmd==='H'){x=+tokens[i++];bound(x,y);}
      else if(cmd==='V'){y=+tokens[i++];bound(x,y);}
      else if(cmd==='A'){i+=5;x=+tokens[i++];y=+tokens[i++];bound(x,y);}
      else assert(cmd==='Z'||cmd==='z','known absolute path command');
    }
  }
  const title=svg.match(/class="tx tb1">([^<]*)/);assert(title&&title[1].length<=28);
}
async function render(){
  let chromium;
  try{({chromium}=require(require('node:path').join(require('node:os').homedir(),'.claude/skills/playwright-skill/node_modules/playwright')));}
  catch(e){console.log('PNG: Playwright nicht verfügbar; SVG-Grenzen geprüft.');return;}
  let browser;
  try{browser=await chromium.launch({headless:true});}
  catch(e){
    if(/Permission denied|Operation not permitted/.test(String(e))){console.log('PNG: Sandbox verhindert Browserstart; SVG-Grenzen geprüft.');return;}
    throw e;
  }
  try{
    const page=await browser.newPage({viewport:{width:840,height:640},deviceScaleFactor:1});
    const css=fs.readFileSync(require('node:path').join(__dirname,'../src/style.css'),'utf8');
    for(const file of dumps){
      await page.setContent(`<style>${css} body{margin:0;background:white}.tz{width:840px}</style>${fs.readFileSync(file,'utf8')}`);
      await page.locator('svg.tz').screenshot({path:file.replace(/\.svg$/,'.png')});
    }
    console.log(`PNG: ${dumps.length} Ansichten gerendert (headless).`);
  }finally{await browser.close();}
}
let passed=0;const dumps=[];
fs.mkdirSync(require('node:path').join(__dirname,'../out'),{recursive:true});

const cases=[
 ['default',{},null],
 ['knuckle',{junction:'knuckle',r:100},null],
 ['steep',{phi:70,Da:500,sn:5},null],
 ['failed',{p:100,sn:2},null],
 ['range',{phi:85},'empty'],
 ['thick',{sn:490},'empty'],
 ['nan',{Da:NaN},'empty'],
 ['hidden-radius',{r:NaN},null],
 ['no-result',{sn:0.1},'null']
];
for(const [name,patch,mode] of cases){
 const g={...base,...patch};const r=mode==='null'?null:m.calc(g,AD.h);
 const svg=m.draw(g,AD.h,r);check(svg);
 if(mode==='empty')assert(svg.includes('Maße eingeben'));
 else{
  assert(svg.includes('Da/2 = '+AD.h.fmt(g.Da/2,1)));
  assert(svg.includes('se '+AD.h.fmt(g.sn,1)));
  assert(svg.includes('φ '+AD.h.fmt(g.phi,1)+'°'));
  // Independent geometric half-diameter and angle, not obtained from calc.
  if(name==='default'){assert.equal(g.Da/2,500);assert.equal(g.phi,30);}
  if(name==='knuckle')assert(svg.includes('r 100,0')&&svg.includes(' A '));
  if(name==='failed')assert(svg.includes('o bad'));
 }
 const file=require('node:path').join(__dirname,`../out/b2-${name}.svg`);
 fs.writeFileSync(file,svg);dumps.push(file);passed++;
}

// Review 8: tan(phi)=3/4 gives 36.86989765°, but phi is derived in dims mode.
for(const mode of ['angle','dims']){
 const g={...base,geoMode:mode,phi:Math.atan(.75)*180/Math.PI,Da2:400,Lk:400};
 const svg=m.draw(g,AD.h,m.calc(g,AD.h));check(svg);
 assert(svg.includes('φ '+AD.h.fmt(36.86989764584402,1)+'°'));
 assert.equal(svg.includes('data-p="phi"'),mode==='angle');
 assert(!svg.includes('data-p="Da2"'));assert(!svg.includes('data-p="Lk"'));
 passed++;cases.push(['tag-'+mode]);
}
console.log(`PASS ${passed}/${cases.length}`);
render().catch(e=>{console.error(e);process.exitCode=1;});
