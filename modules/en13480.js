/* EN 13480-3:2017, nichtaustenitische Stähle, zeitunabhängige Auslegung.
 * Casting factors use the base 2017 edition §5.2.4, not A3:2020 (EN 12516-2).
 * Normtext (einschließlich Änderungen):
 * (Normtext, nicht verlinkt)
 * EN 13480-5:2017:
 * (Normtext, nicht verlinkt)
 * Eigene Rp-Eingaben: AD-Werkstoffwerte K können Rp1,0 statt Rp0,2 enthalten.
 * Gemeinsame c1 = absolute Minustoleranz, c2 = Korrosion; zusätzliche relative
 * Minustoleranz tol wird additiv berücksichtigt (nicht doppelt eingeben).
 */
(function(AD){
'use strict';
const H=AD.h;
const fields=[
 {id:'product',label:'Produktform',type:'select',def:'wrought',options:[['unknown','Bitte bestätigen'],['wrought','Walz- oder Schmiedestahl'],['casting','Stahlguss']],tip:'Voreingestellt ist Walz- oder Schmiedestahl. Bei Stahlguss (etwa GP240GH, G20Mn5) unbedingt „Stahlguss“ wählen, sonst sind die Sicherheitsbeiwerte zu niedrig.'},
 {id:'Do',label:'Außendurchmesser',sym:'Do',unit:'mm',def:219.1},
 {id:'sn',label:'Bestellte Wanddicke / Mindestwert am Bogen',sym:'eord',unit:'mm',def:8},
 {id:'RpT',label:'Streckgrenze bei Berechnungstemperatur',sym:'Rp0,2,t / ReH,t',unit:'N/mm²',def:182},
 {id:'Rp20',label:'Streckgrenze bei 20 °C (Prüfung)',sym:'Rp0,2,20 / ReH,20',unit:'N/mm²',def:235},
 {id:'Rm',label:'Mindestzugfestigkeit bei 20 °C',sym:'Rm',unit:'N/mm²',def:360},
 {id:'tol',label:'Zusätzliche relative Minustoleranz',sym:'a',unit:'%',def:12.5,min:'zero'},
 {id:'thin',label:'Zusätzlicher Fertigungsabtrag',sym:'cF',unit:'mm',def:0,min:'zero'},
 {id:'scope',label:'Werkstoff / Temperaturbereich bestätigt',type:'select',def:'yes',options:[['yes','Nichtaustenitisch, ohne Zeitstand'],['no','Andere / nicht bestätigt']]}
];
function calc(g,bend){
 const notes=[];let fail=false;
 const error=t=>{notes.push(['e',t]);fail=true;};
 const pos=['Do','sn','RpT','Rp20','Rm','v'];
 if(bend)pos.push('R');
 if(pos.some(k=>!Number.isFinite(g[k])||g[k]<=0||g[k]>Number.MAX_SAFE_INTEGER)||!Number.isFinite(g.p)||g.p<0||g.p>Number.MAX_SAFE_INTEGER||
   ['c1','c2','thin','tol'].some(k=>!Number.isFinite(g[k])||g[k]<0||g[k]>Number.MAX_SAFE_INTEGER)||g.tol>=100||g.v>1)
   error('Ungültige Eingaben: positive Maße und Festigkeiten, 0 ≤ Toleranz < 100 %, 0 < z ≤ 1 erforderlich.');
 if(!['wrought','casting'].includes(g.product))error('Produktform aus dem Werkstoffzeugnis bestätigen.');
 if(g.product==='casting')notes.push(['w','Stahlguss nach EN 13480-3:2017, Grundausgabe §5.2.4. Ab A3:2020 gilt stattdessen EN 12516-2; dieser Änderungsstand ist hier nicht abgedeckt.']);
 if(g.scope!=='yes')error('Nur nichtaustenitische Stähle im zeitunabhängigen Bereich nach §5.2.1 abgedeckt.');
 if(g.Rp20>g.Rm||g.RpT>g.Rp20)error('Festigkeitswerte widersprüchlich: Rp,t ≤ Rp,20 ≤ Rm erforderlich.');
 // EN 13480-3 §6.1: einfacher Ansatz nur Do/Di ≤ 1,7; dickwandiger Zweig nicht implementiert.
 if(!(g.sn<g.Do/2)||g.Do/(g.Do-2*g.sn)>1.7)error('Do/Di > 1,7 oder kein freier Innendurchmesser: außerhalb des implementierten dünnwandigen Ansatzes.');
 // §6.2.3.1 Gl. (6.2.3-1)/(6.2.3-2); Singularität R/Do = 0,5 ausgeschlossen.
 if(bend&&!(g.R>g.Do/2))error('Biegeradius R muss größer als Do/2 sein.');
 // EN 13480-3 §5.2.1.1, Gl. (5.2.1-1); f20 ist Auslegungsspannung bei Prüftemperatur.
 const cast=g.product==='casting',Sy=cast?1.9:1.5,Su=cast?3:2.4;
 const f=Math.min(g.RpT/Sy,g.Rm/Su),f20=Math.min(g.Rp20/Sy,g.Rm/Su);
 // EN 13480-3 §6.2.3.1, Gl. (6.2.3-1)/(6.2.3-2): Faktoren innen/außen.
 const q=g.R/g.Do;
 const ki=bend?(q-.25)/(q-.5):1,ke=bend?(q+.25)/(q+.5):1;
 // EN 13480-3 §6.1, Gl. (6.1-1); bar → N/mm².
 const e=g.p/10*g.Do/(2*f*g.v+g.p/10),ei=e*ki,ee=e*ke;
 // EN 13480-3 §4.3, Gl. (4.3-2), auf bestellte Dicke umgestellt;
 // absolute Toleranz c1 + relativer Anteil a·eord, Korrosion c2, Fertigungsabtrag thin.
 const a=g.tol/100,c=g.c1+g.c2+g.thin,req=(ei+c)/(1-a),ea=g.sn*(1-a)-c;
 if(ea<=0)error('Wirksame Wanddicke nach Abzügen ist nicht positiv.');
 if(req>g.sn)error('Bestellte Wanddicke reicht für den Innendruck nicht aus.');
 // Umstellung §6.1 (6.1-1) und §6.2.3.1 (6.2.3-1); Innenbogen maßgebend.
 let pm=ea>0?20*f*g.v*ea/(ki*g.Do-ea):NaN;
 // EN 13480-5 §9.3.2.2.1, Gl. (9.3.2-1)/(9.3.2-2); p wird hier als PS angesetzt.
 const PT=Math.max(1.25*g.p*f20/f,1.43*g.p);
 // EN 13480-3 §5.2.1.2: 95 % Rp bei 20 °C; §4.5: im Prüfzustand z = 1.
 const ft=cast?g.Rp20/1.4:.95*g.Rp20;
 // EN 13480-3 §§6.1,6.2.3.1; konservativ volle Korrosion auch bei Erstprüfung abgezogen.
 const tr=(PT/10*g.Do/(2*ft+PT/10)*ki+c)/(1-a);
 // Keep the published rating on the safe side of floating-point equality.
 if(Number.isFinite(pm))pm*=1-8*Number.EPSILON;
 if(![req,req/g.sn,pm,PT,tr,f,f20,ft,e,ei,ee,ea,ki,ke].every(Number.isFinite)||!(f>0)||!(ft>0)||!(pm>0))error('Berechnung nicht endlich oder außerhalb des numerisch sicheren Bereichs.');
 const testValid=!fail&&Number.isFinite(tr)&&Number.isFinite(PT);
 if(testValid&&tr>g.sn)error('Prüfzustand überschreitet die zulässige Prüfspannung; gesondertes Prüfkonzept erforderlich.');
 if(fail)pm=NaN;
 notes.push(['w','Nur Innendruck; keine Zusatzlasten, Ermüdung, Zeitstand- oder Stabilitätsnachweise. Rp und Rm separat aus dem passenden Rohrzeugnis übernehmen; gemeinsame K, S und S′ werden nicht verwendet.']);
 notes.push(['','c1: absolute Minustoleranz; c2: Korrosion. Relative Toleranz nur zusätzlich eingeben. Prüfung bei 20 °C, p = PS; statische Flüssigkeitssäule und andere Bauteile separat prüfen.']);
 if(bend)notes.push(['w','sn ist die garantierte kleinste Dicke nach dem Biegen, konservativ an allen Umfangslagen angesetzt. Ausdünnung und Ovalität nach EN 13480-4 nachweisen; keine automatische Bestellung des Ausgangsrohres.']);
 return {headline:{value:req,unit:'mm',label:'mm erforderlich',of:'vorhanden '+H.fmt(g.sn,2)+' mm'},util:req/g.sn,pmax:pm,
 test:testValid?{PT,req:tr,have:g.sn,unit:'mm',ok:!fail&&tr<=g.sn,note:'Wasserdruckprüfung: Sollprüfdruck; bei Überschreitung der Prüfspannung Prüfkonzept nach §9.3.2.2.1 anpassen. Korrosion konservativ voll abgezogen.'}:null,
 rows:[['Auslegungsspannung','f',f,'N/mm²'],['Auslegungsspannung bei 20 °C','f20',f20,'N/mm²'],['Prüfspannungsgrenze',cast?'Rp20/1,4':'0,95 Rp20',ft,'N/mm²'],['Rohr ohne Zuschläge','e',e,'mm'],['Innenbogen / Rohr','eint',ei,'mm'],['Außenbogen / Rohr','eext',ee,'mm'],['Wirksame Dicke','ea',ea,'mm'],['Bestelldicke erforderlich','eord',req,'mm']],notes,fail,
 formula:'f = min(Rp,t / '+(cast?'1,9; Rm / 3':'1,5; Rm / 2,4')+') = '+H.fmt(f,3)+' N/mm²\ne = (p/10)·Do / (2·f·z + p/10) = '+H.fmt(e,3)+' mm'+(bend?'\neint = e·(R/Do − 0,25)/(R/Do − 0,5) = '+H.fmt(ei,3)+' mm\neext = e·(R/Do + 0,25)/(R/Do + 0,5) = '+H.fmt(ee,3)+' mm':'')+'\neord = (eint + c1 + c2 + cF)/(1 − a) = '+H.fmt(req,3)+' mm\nPT = max(1,25·PS·f20/f; 1,43·PS) = '+H.fmt(PT,2)+' bar'};
}
function draw(g,H,r,bend){
 const D=H.draw,W=420,V=300,title=bend?'Rohrbogen EN 13480':'Gerades Rohr EN 13480';
 if(![g.Do,g.sn].every(x=>Number.isFinite(x)&&x>0)||g.sn>=g.Do/2||(bend&&(!Number.isFinite(g.R)||g.R<=g.Do/2)))
  return D.svg(W,V,D.text(210,130,'Maße eingeben'),{title});
 const bad=r&&(r.ok===false||r.fail||r.util>1),cls=bad?'o bad':'o';let b='';
 if(!bend){
  const k=D.fit(g.Do,g.Do,190,190,15),R=g.Do*k/2,t=Math.min(R-4,Math.max(5,g.sn*k)),a=R-t,x=103,y=121;
  b+=D.path(`M ${x-R} ${y} a ${R} ${R} 0 1 0 ${2*R} 0 a ${R} ${R} 0 1 0 ${-2*R} 0 Z M ${x-a} ${y} a ${a} ${a} 0 1 1 ${2*a} 0 a ${a} ${a} 0 1 1 ${-2*a} 0 Z`,cls,true);
  b+=D.centre(14,y,192,y)+D.centre(x,29,x,211);
  b+=D.dim(x-R,y+R,x+R,y+R,23,'Do '+H.fmt(g.Do,1));
  b+=D.rect(230,y-R,160,t,cls,true)+D.rect(230,y+R-t,160,t,cls,true)+D.centre(219,y,401,y);
  b+=D.line(230,y-R+t,230,y+R-t,'t')+D.line(390,y-R+t,390,y+R-t,'t');
  b+=D.dim(390,y-R,390,y+R,-14,'Do '+H.fmt(g.Do,1));
  b+=D.leader(280,y-R+t/2,240,26,'s '+H.fmt(g.sn,2));
  b+=D.text(x,23,'Schnitt A–A','middle','tx tb2');
  b+=D.line(305,y-12,305,y-R+t+3,'d').replace('/>',' marker-end="url(#tza)"/>');
  b+=D.text(305,y+20,'p '+H.fmt(g.p,1)+' bar','middle','tx dt');
 }else{
  // Reine Zeichnungsgeometrie: 90°-Bogen, Radien proportional zu R und Do.
  const k=D.fit(g.R+g.Do/2,g.R+g.Do/2,250,205,5),rad=g.R*k,h=g.Do*k/2,t=Math.min(h*.65,Math.max(5,g.sn*k)),cx=100,cy=224;
  const sector=(lo,hi)=>`M ${cx} ${cy-hi} A ${hi} ${hi} 0 0 1 ${cx+hi} ${cy} L ${cx+lo} ${cy} A ${lo} ${lo} 0 0 0 ${cx} ${cy-lo} Z`;
  b+=D.path(sector(rad-h,rad-h+t),cls,true)+D.path(sector(rad+h-t,rad+h),'o',true);
  b+=D.path(`M ${cx} ${cy-rad} A ${rad} ${rad} 0 0 1 ${cx+rad} ${cy}`,'c');
  b+=D.centre(cx-10,cy,cx+25,cy)+D.centre(cx,cy-25,cx,cy+10);
  b+=D.dim(cx,cy,cx+rad,cy,21,'R '+H.fmt(g.R,1));
  b+=D.dim(cx,cy-rad-h,cx,cy-rad+h,30,'Do '+H.fmt(g.Do,1));
  const u=Math.SQRT1_2;
  b+=D.leader(cx+(rad-h+t/2)*u,cy-(rad-h+t/2)*u,255,156,'Innenbogen');
  b+=D.leader(cx+(rad+h-t/2)*u,cy-(rad+h-t/2)*u,300,44,'Außenbogen');
  b+=D.text(230,22,'s min '+H.fmt(g.sn,2)+' mm','middle','tx tb2');
  b+=D.text(318,202,'p '+H.fmt(g.p,1)+' bar','middle','tx dt');
 }
 b+=D.text(14,263,'Wanddicke ggf. überhöht dargestellt','start','tx tb2');
 return D.svg(W,V,b,{title,sub:bend?'Schnitt in Bogenebene · 90° schematisch':'Schnitt A–A und Längsschnitt'});
}
for(const bend of [false,true])AD.register({id:bend?'bend':'pipe',name:bend?'Rohrbogen':'Gerades Rohr',code:bend?'EN 13480-3 §6.2.3':'EN 13480-3 §6.1',group:'EN 13480',icon:bend?'<path d="M8 29V20A14 14 0 0 1 22 6h14M16 29V20a6 6 0 0 1 6-6h14"/>':'<path d="M5 8h34v18H5zM5 12h34M5 22h34"/>',fields:fields.concat(bend?[{id:'R',label:'Biegeradius der Rohrmittellinie',sym:'R',unit:'mm',def:328.65}]:[]),help:'EN 13480-3:2017: nichtaustenitisch, ohne Zeitstand; Do/Di ≤ 1,7. Eigene Festigkeitswerte eingeben. Gemeinsame c1/c2 gelten als absolute Toleranz/Korrosion.',calc:g=>calc(g,bend),draw:(g,H,r)=>draw(g,H,r,bend)});
})(globalThis.AD);
