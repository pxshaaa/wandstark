/* PED classification, not a wall-thickness calculation.
 * Source: Directive 2014/68/EU, Art. 1, 4, 13, 14; Annex II §§1–4,
 * Tables 1–9; Annex III. Original OJ diagrams visually checked (pp. 215–219).
 * https://eur-lex.europa.eu/eli/dir/2014/68/oj
 * Accessible consolidated text, PDF pp. 69–73:
 * https://www.ibf-solutions.com/fileadmin/dateidownloads/amtsblaetter/directive-2014-68-ec-relating-to-the-making-available-on-the-market-of-pressure-equipment-en.pdf
 */
(function(AD){
'use strict';
const roman=['','I','II','III','IV'];
const modules=['Gute Ingenieurpraxis; keine CE-Kennzeichnung nach dieser Richtlinie.',
 'A', 'A2, D1 oder E1',
 'B (Entwurfsmuster) + D oder F; B (Baumuster) + E oder C2; H',
 'B (Baumuster) + D oder F; G; H1']; // Annex II §1; procedures in Annex III.
function table(g){return g.equipment==='steam'?5:(g.equipment==='piping'?6:1)+(g.state==='liquid'?2:0)+(g.fluid==='2'?1:0);}
function valid(g){return ['vessel','steam','piping'].includes(g.equipment)&&
 (g.equipment==='steam'||(['gas','liquid'].includes(g.state)&&['1','2'].includes(g.fluid)))&&
 Number.isFinite(g.p)&&g.p>0&&Number.isFinite(g.equipment==='piping'?g.DN:g.V)&&(g.equipment==='piping'?g.DN:g.V)>0;}
// Each comparison includes the demarcation line in the lower category: Annex II §4.
// q = PS·V (bar·l) or PS·DN (bar), as defined in Art. 4(1).
function category(t,p,x){
 const q=p*x;
 if(p<=0.5)return 0; // Art. 1(1): outside scope, distinguished in calc().
 switch(t){
 case 1: // Art.4(1)(a)(i), first indent; Annex II Table 1.
  if(p<=200&&(x<=1||q<=25))return 0;
  if(p<=200&&q<=50)return 1;
  if(p<=200&&q<=200)return 2;
  return p<=1000&&(x<=1||q<=1000)?3:4;
 case 2: // Art.4(1)(a)(i), second indent; Annex II Table 2, incl. PS=4 plateau.
  if(p<=1000&&(x<=1||q<=50))return 0;
  if(p<=1000&&q<=200)return 1;
  if(p<=1000&&q<=1000)return 2;
  return p<=3000&&(x<=1||q<=3000||p<=4)?3:4;
 case 3: // Art.4(1)(a)(ii), first indent; Annex II Table 3, V<=1: max. II.
  if(p<=500&&(x<=1||q<=200))return 0;
  return p<=10?1:(p<=500||x<=1?2:3);
 case 4: // Art.4(1)(a)(ii), second indent; Annex II Table 4, V<=10: max. I.
  if(p<=1000&&(p<=10||q<=10000))return 0;
  return p<=500||x<=10?1:2;
 case 5: // Art.4(1)(b); Annex II Table 5, PS=32 / PS·V=3000 / V=1000.
  if(x<=2)return 0;
  if(p>32||q>3000||x>1000)return 4;
  return q<=50?1:(q<=200?2:3);
 case 6: // Art.4(1)(c)(i), first indent; Annex II Table 6.
  if(x<=25)return 0;
  if(x<=100&&q<=1000)return 1;
  return x<=350&&(x<=100||q<=3500)?2:3;
 case 7: // Art.4(1)(c)(i), second indent; Annex II Table 7.
  if(x<=32||q<=1000)return 0;
  if(x<=100||q<=3500)return 1;
  return x<=250||q<=5000?2:3;
 case 8: // Art.4(1)(c)(ii), first indent; Annex II Table 8.
  if(x<=25||q<=2000)return 0;
  return p<=10?1:(p<=500?2:3);
 case 9: // Art.4(1)(c)(ii), second indent; Annex II Table 9.
  if(p<=10||x<=200||q<=5000)return 0;
  return p<=500?1:2;
 }
}
// Boundary values from the corresponding Annex II table; also used for drawing segmentation.
const limits={
 1:{x:[1],p:[0.5,200,1000],q:[25,50,200,1000]},
 2:{x:[1],p:[0.5,4,1000,3000],q:[50,200,1000,3000]},
 3:{x:[1],p:[0.5,10,500],q:[200]},
 4:{x:[10],p:[0.5,10,500,1000],q:[10000]},
 5:{x:[2,1000],p:[0.5,32],q:[50,200,3000]},
 6:{x:[25,100,350],p:[0.5],q:[1000,3500]},
 7:{x:[32,100,250],p:[0.5],q:[1000,3500,5000]},
 8:{x:[25],p:[0.5,10,500],q:[2000]},
 9:{x:[200],p:[0.5,10,500],q:[5000]}
};
AD.register({
 id:'ped',name:'Kategorie nach Druckgeräterichtlinie',code:'2014/68/EU',group:'Richtlinie',
 icon:'<path d="M5 28V5m0 23h34M8 10l24 16M8 5l29 16"/><circle cx="23" cy="14" r="3"/>',
 fields:[
  {id:'equipment',label:'Druckgeräteart',type:'select',def:'vessel',options:[['vessel','Behälter'],['steam','Dampferzeuger'],['piping','Rohrleitung']]},
  {id:'state',label:'Mediumzustand nach Art. 4',type:'select',def:'gas',options:[['gas','Gas'],['liquid','Flüssigkeit']],when:{equipment:['vessel','piping']}},
  {id:'fluid',label:'Fluidgruppe nach Art. 13',type:'select',def:'2',options:[['1','Gruppe 1'],['2','Gruppe 2']],when:{equipment:['vessel','piping']}},
  {id:'V',label:'Inneres Volumen',sym:'V',unit:'l',def:100,when:{equipment:['vessel','steam']}},
  {id:'DN',label:'Nennweite',sym:'DN',unit:'–',def:50,when:{equipment:'piping'}}
 ],
 help:'p wird als maximal zulässiger Druck PS in bar verwendet. Gas umfasst Dämpfe und Flüssigkeiten mit Dampfdruck bei TS > 0,5 bar über Atmosphärendruck. Dampferzeuger: beheizt, Überhitzungsrisiko, Dampf/Heißwasser > 110 °C (Art. 4 Abs. 1 b). T für Rohrleitungen als maximal zulässige Temperatur TS eingeben.',
 calc(g,H){
  const notes=[],rows=[],t=table(g),pipe=g.equipment==='piping',x=pipe?g.DN:g.V;
  if(!valid(g)||!Number.isFinite(g.p*x))return {headline:{text:'Eingaben prüfen'},noUtil:true,stats:[],util:0,fail:true,pmax:NaN,test:null,rows,notes:[['e','Gültige Geräteart, Fluiddaten sowie endliche positive Werte für PS und V bzw. DN eingeben.']],fail:true,formula:'Keine Einstufung bei ungültigen Eingaben.'};
  const c=category(t,g.p,x),outside=g.p<=0.5;
  let actual=c;
  // Annex II Table 7 exception: TS > 350 °C raises category II to III.
  if(t===7&&c===2){
   if(Number.isFinite(g.T)&&g.T>350){actual=3;notes.push(['w','TS > 350 °C: Kategorie II wird nach Anhang II, Tabelle 7 zu Kategorie III.']);}
   else if(!Number.isFinite(g.T)){actual=3;notes.push(['w','TS fehlt: vorsorglich Kategorie III statt II; Ausnahme Tabelle 7 prüfen.']);}
  }
  rows.push(['Zulässiger Druck','PS',g.p,'bar'],[pipe?'Nennweite':'Volumen',pipe?'DN':'V',x,pipe?'–':'l'],['Kennwert',pipe?'PS·DN':'PS·V',g.p*x,pipe?'bar':'bar·l']); // Art. 4(1).
  const L=limits[t];
  L.x.forEach(v=>rows.push(['Grenzwert Tabelle '+H.fmt(t,0),pipe?'DN':'V',v,pipe?'–':'l']));
  L.p.forEach(v=>rows.push(['Druckgrenze Tabelle '+H.fmt(t,0),'PS',v,'bar']));
  L.q.forEach(v=>rows.push(['Produktgrenze Tabelle '+H.fmt(t,0),pipe?'PS·DN':'PS·V',v,pipe?'bar':'bar·l']));
  if(outside)notes.push(['w','PS ≤ 0,5 bar: außerhalb des Geltungsbereichs (Art. 1 Abs. 1), keine Einstufung nach Art. 4 Abs. 3.']);
  else notes.push(['',actual?'Zulässige Verfahren nach Anhang II Nr. 1 / Anhang III: '+modules[actual]+'. Verfahren einer höheren Kategorie sind nach Art. 14 Abs. 3 ebenfalls zulässig.':modules[0]]);
  notes.push(['','Grenzlinien gehören zur jeweils niedrigeren Kategorie (Anhang II Nr. 4). Tabellenwerte gelten gemeinsam, nicht als unabhängige Einzelgrenzen.']);
  if(t===1||t===6)notes.push(['w','Instabile Gase: Kategorien I und II sind auf III anzuheben (Ausnahme Tabelle '+H.fmt(t,0)+'); hier reguläre Fluide vorausgesetzt.']);
  if(t===2)notes.push(['w','Tragbare Feuerlöscher und Atemluftflaschen: mindestens Kategorie III; hier gewöhnlicher Behälter vorausgesetzt.']);
  if(t===5)notes.push(['w','Schnellkochtöpfe: Entwurf mindestens nach Verfahren der Kategorie III; hier gewöhnlicher Dampferzeuger vorausgesetzt.']);
  notes.push(['','Ausrüstungsteile mit Sicherheitsfunktion: grundsätzlich Kategorie IV; für bestimmte Geräte hergestellte Teile dürfen deren Kategorie erhalten (Anhang II Nr. 2).']);
  const text=outside?'Außerhalb PED':actual?'Kat. '+roman[actual]:'Art. 4 Abs. 3';
  return {headline:{text},noUtil:true,stats:[[H.fmt(g.p*x,2)+(pipe?' bar':' bar·l'),pipe?'PS·DN':'PS·V'],[H.fmt(t,0),'Tabelle Anhang II']],util:0,pmax:NaN,test:null,rows,notes,fail:false,
   formula:'Anhang II, Tabelle '+H.fmt(t,0)+'\nPS = '+H.fmt(g.p,3)+' bar; '+(pipe?'DN = ':'V = ')+H.fmt(x,3)+(pipe?'':' l')+'\n'+(pipe?'PS·DN':'PS·V')+' = '+H.fmt(g.p,3)+' · '+H.fmt(x,3)+' = '+H.fmt(g.p*x,3)+(pipe?' bar':' bar·l')+'\n'+text};
 },
 draw(g,H,r){
  const D=H.draw,W=420,V=320;
  if(!valid(g)||!Number.isFinite(g.p*(g.equipment==='piping'?g.DN:g.V))||[g.p,g.equipment==='piping'?g.DN:g.V].some(v=>v<1e-300||v>1e300))return D.svg(W,V,D.text(210,140,'Maße eingeben'),{title:'PED-Kategorie',sub:'Anhang II'});
  const t=table(g),pipe=g.equipment==='piping',x=pipe?g.DN:g.V,L=limits[t];
  // Apply the same Table 7 temperature exception as calc() to every region.
  const C=(p,x)=>{const c=category(t,p,x);return t===7&&c===2&&(!Number.isFinite(g.T)||g.T>350)?3:c;};
  // Logarithmic plotting only; not a pressure-vessel design formula.
  const xmin=Math.min(-1,Math.floor(Math.log10(x))),xmax=Math.max(4,Math.ceil(Math.log10(x))),
   ymin=Math.min(-1,Math.floor(Math.log10(g.p))),ymax=Math.max(4,Math.ceil(Math.log10(g.p)));
  const X=v=>55+345*(Math.log10(v)-xmin)/(xmax-xmin),Y=p=>242-210*(Math.log10(p)-ymin)/(ymax-ymin);
  const xp=z=>10**z,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const tick=i=>Math.abs(i)>=4?H.fmt(1,0)+'e'+H.fmt(i,0):H.fmt(xp(i),Math.max(0,-i));
  const number=v=>{if(v>=1e6||v<0.01){const [a,e]=v.toExponential(2).split('e');return H.fmt(+a,2)+'e'+H.fmt(+e,0);}return H.fmt(v,2);};
  let b=D.text(12,18,'PS [bar]','start','tx tb2');
  for(let i=xmin;i<=xmax;i++){const a=X(xp(i));if(((i-xmin)%Math.max(1,Math.ceil((xmax-xmin)/7))===0&&xmax-i>=Math.max(1,Math.ceil((xmax-xmin)/7))*0.75)||i===xmax)b+=D.text(a,256,tick(i),i===xmax?'end':i===xmin?'start':'middle','tx tb2');}
  for(let i=ymin;i<=ymax;i++){const a=Y(xp(i));if((i-ymin)%Math.max(1,Math.ceil((ymax-ymin)/7))===0||i===ymax)b+=D.text(50,a+3,tick(i),'end','tx tb2');}
  // Exact region boundaries: split log-x at each vertical boundary and all
  // intersections of PS=constant with PS*x=constant (Annex II Tables 1–9).
  const cuts=[xmin,xmax,...L.x.map(Math.log10),...L.q.flatMap(q=>[...L.p,xp(ymin),xp(ymax)].map(p=>Math.log10(q/p)))].filter(v=>v>=xmin&&v<=xmax).sort((a,b)=>a-b);
  const xs=[...new Set(cuts)];const labels={};
  for(let i=0;i<xs.length-1;i++){
   const a=xs[i],z=xs[i+1],mid=(a+z)/2,xx=xp(mid);
   const edges=[{f:()=>ymin},{f:()=>ymax},...L.p.map(p=>({f:()=>Math.log10(p)})),...L.q.map(q=>({f:v=>Math.log10(q)-v}))].sort((a,b)=>a.f(mid)-b.f(mid));
   for(let j=0;j<edges.length-1;j++){
    const lo=edges[j],hi=edges[j+1],bot=clamp(lo.f(mid),ymin,ymax),top=clamp(hi.f(mid),ymin,ymax);
    if(top<=bot)continue;
    const pp=xp((bot+top)/2),cat=pp<=0.5?-1:C(pp,xx),pts=[[X(xp(a)),Y(xp(clamp(lo.f(a),ymin,ymax)))],[X(xp(z)),Y(xp(clamp(lo.f(z),ymin,ymax)))],[X(xp(z)),Y(xp(clamp(hi.f(z),ymin,ymax)))],[X(xp(a)),Y(xp(clamp(hi.f(a),ymin,ymax)))]];
    // Tone bands indicate hazard categories; no material section is depicted.
    b+=D.path('M '+pts.map(p=>p.map(v=>v.toFixed(2)).join(' ')).join(' L ')+' Z','ped-region-'+cat).replace('/>',` style="fill:${cat<0?'#eeeeee':['#f4f5f6','#e1eee6','#c6dfcf','#a6cdb7','#7db397'][cat]};stroke:none"/>`);
    const area=(z-a)*(top-bot);if(!labels[cat]||area>labels[cat].area)labels[cat]={area,x:X(xx),y:Y(xp((bot+top)/2)),width:X(xp(z))-X(xp(a)),height:Y(xp(bot))-Y(xp(top))};
   }
  }
  // Draw only genuine category transitions, using adjacent values at each candidate line.
  function edge(a,z,f){const m=(a+z)/2,p=xp(f(m)),xx=xp(m);if(C(p*(1-1e-8),xx)!==C(p*(1+1e-8),xx))b+=D.line(X(xp(a)),Y(xp(f(a))),X(xp(z)),Y(xp(f(z))),'t');}
  for(let i=0;i<xs.length-1;i++){const a=xs[i],z=xs[i+1];for(const p of L.p)if(Math.log10(p)>=ymin&&Math.log10(p)<=ymax)edge(a,z,()=>Math.log10(p));for(const q of L.q){const f=v=>Math.log10(q)-v;if(f((a+z)/2)>ymin&&f((a+z)/2)<ymax)edge(a,z,f);}}
  for(const v of L.x){const ys=[ymin,ymax,...L.p.map(Math.log10),...L.q.map(q=>Math.log10(q/v))].filter(y=>y>=ymin&&y<=ymax).sort((a,b)=>a-b);for(let j=0;j<ys.length-1;j++){const p=xp((ys[j]+ys[j+1])/2);if(C(p,v*(1-1e-8))!==C(p,v*(1+1e-8)))b+=D.line(X(v),Y(xp(ys[j])),X(v),Y(xp(ys[j+1])),'t');}}
  Object.keys(labels).forEach(c=>{const l=labels[c],label=c==='-1'?'außerhalb':c==='0'?'Art. 4(3)':roman[c];if(l.x-label.length*2.6>55&&l.x+label.length*2.6<400&&l.height>12)b+=D.text(l.x,l.y,label,'middle','tx tb2');});
  b+=D.rect(55,32,345,210,'t')+D.text(398,273,pipe?'DN [–]':'V [l]','end','tx tb2');
  const px=X(x),py=Y(g.p);b+=D.line(px-4,py,px+4,py,'o')+D.line(px,py-4,px,py+4,'o')+D.circle(px,py,3,r&&(r.ok===false||r.fail)?'o bad':'o');
  b+=D.text(12,287,'PS '+number(g.p)+' bar · '+(pipe?'DN ':'V ')+number(x)+(pipe?'':' l'),'start','tx tb2');
  b+=D.text(12,273,t===7&&(!Number.isFinite(g.T)||g.T>350)?'Tabelle 7: II → III (TS); siehe Hinweise':'Regelfall; siehe Hinweise','start','tx tb2');
  return D.svg(W,V,b,{title:'PED · Tabelle '+H.fmt(t,0),sub:'Anhang II · logarithmische Achsen'});
 }
});
})(typeof globalThis!=='undefined'?globalThis.AD:window.AD);
