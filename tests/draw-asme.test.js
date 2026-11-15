'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/asme.js');
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
  // Commands emitted by the ASME drawings are absolute; check endpoints and H/V segments.
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

let passed=0,total=0;const dumps=[];
const path=require('node:path');fs.mkdirSync(path.join(__dirname,'../out'),{recursive:true});
for(const id of ['ug27','ug32','ug34']){
 const m=AD.modules.find(x=>x.id===id);
 const base={p:10,c1:0,c2:1,...Object.fromEntries(m.fields.map(f=>[f.id,f.def]))};
 const cases=[['default',{}],['small',{D:200,sn:1}],['failed',{p:100,sn:2}],['nan',{D:NaN}],['thick',{D:500,sn:249}],['large',{D:100000,sn:0.01}]];
 if(id==='ug27')cases.push(['sphere',{shape:'sph'}],['sphere-thick',{shape:'sph',D:500,sn:249}]);
 if(id==='ug32')cases.push(['hemi',{head:'hemi'}],['tor6',{head:'tor6'}],['tor',{head:'tor',L:1000,r:100}],['bad-radius',{head:'tor',L:NaN}]);
 for(const [name,patch] of cases){
  total++;const g={...base,...patch},r=m.calc(g,AD.h),svg=m.draw(g,AD.h,r);check(svg);
  if(name==='nan'||name==='bad-radius')assert(svg.includes('Maße eingeben'));
  else {assert(svg.includes(AD.h.fmt(g.D,1))||svg.includes(AD.h.fmt(g.D,0)));if(r.fail)assert(svg.includes('bad'));}
  const file=path.join(__dirname,`../out/asme-${id}-${name}.svg`);fs.writeFileSync(file,svg);dumps.push(file);passed++;
 }
 // Null result must not throw either.
 check(m.draw(base,AD.h,null));total++;passed++;
}
console.log(`PASS ${passed}/${total}`);
render().catch(e=>{console.error(e);process.exitCode=1;});
