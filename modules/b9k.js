/* AD 2000 B9 02.2010, korr. 09.2016, §§1.1, 4.1–4.4, Bild 10.
 * Textquelle: (Normtext, nicht verlinkt)
 * B3 05.2011 §8.1.2 (Scheitelzone), §8.1.1 (Kugelersatz):
 * (Normtext, nicht verlinkt)
 * Kleiner, konservativer Umfang: radialer aufgesetzter Einzelstutzen;
 * keine Scheiben, inneren Überstände, Nachbarn, Zusatzlasten oder Prüflast.
 * UNVERIFIED: Bild 10 nicht geometrisch verifiziert; Zylinder-Ersatz nach
 * Bild 9 mit gleichem Innenradius als konservativer Flächenvergleich.
 * Ausgabe 2023 nicht abgeglichen. Kein vollständiger B3-Bodennachweis.
 */
(function(AD){
'use strict';
AD.register({
 id:'b9k',name:'Stutzen Kugel/Boden',code:'B9',group:'Ausschnitte',
 icon:'<path d="M3 28Q22 13 41 28M3 32Q22 17 41 32M17 21V3h10v18M20 3v17M24 3v17"/>',
 fields:[
  {id:'shape',label:'Grundkörper',type:'select',def:'sphere',options:[['sphere','Kugelschale'],['kl','Klöpperboden (Kalotte)'],['kor','Korbbogenboden (Kalotte)']]},
  {id:'R',label:'Innenradius Kugel / Kalotte',sym:'R',unit:'mm',def:1000},
  {id:'Da',label:'Boden-Außendurchmesser',sym:'Da',unit:'mm',def:1000,when:{shape:['kl','kor']}},
  {id:'x',label:'Radialer Abstand vom Scheitel (Projektion)',sym:'x',unit:'mm',def:0,min:'zero',when:{shape:['kl','kor']}},
  {id:'sn',label:'Wanddicke am Ausschnitt',sym:'se',unit:'mm',def:12},
  {id:'dA',label:'Stutzen-Außendurchmesser',sym:'dA',unit:'mm',def:114.3},
  {id:'ss',label:'Stutzenwanddicke',sym:'sS',unit:'mm',def:8},
  {id:'ls',label:'Äußerer Stutzenüberstand',sym:'lvorh',unit:'mm',def:80,min:'zero'},
  {id:'Ks',label:'Stutzenkennwert (0 = Grundkörper)',sym:'Ks',unit:'N/mm²',def:0,min:'zero'},
  {id:'Ss',label:'Stutzensicherheit (0 = Grundkörper)',sym:'Ss',unit:'–',def:0,min:'zero'}
 ],
 help:'Konservativer B9-Flächenvergleich für einen radialen, volltragend aufgesetzten Stutzen. Bild 10 nicht vollständig verifiziert: konservativer Zylinder-Ersatz. R ist der tatsächliche Innenradius. Bei Böden muss der gesamte mittragende Bereich in 0,6·Da liegen; Krempe und Gesamtboden separat nach B3 nachweisen.',
 calc(g,H){
  H=H||AD.h;
  const a=Object.assign({shape:'sphere',Ks:0,Ss:0},g),notes=[],rows=[];
  let fail=false;
  const error=s=>{fail=true;notes.push(['e',s]);};
  const finish=(util=Infinity,pmax=NaN,formula='Keine gültige Berechnung möglich.')=>({headline:{value:100*util,unit:'%',label:'% Auslastung (B9/B1)',of:'zulässig höchstens 100 %'},util,pmax,test:null,rows,notes,fail,formula});
  if(!['sphere','kl','kor'].includes(a.shape)||['R','sn','dA','ss','K','S','v'].some(k=>!Number.isFinite(a[k])||a[k]<=0)||['p','c1','c2','ls','Ks','Ss'].some(k=>!Number.isFinite(a[k])||a[k]<0)||a.v>1||
    (a.shape!=='sphere'&&(!Number.isFinite(a.Da)||a.Da<=0||!Number.isFinite(a.x)||a.x<0))){error('Ungültige Maße, Werkstoffwerte oder Druck; 0 < v ≤ 1 erforderlich.');return finish();}
  // B9 §3/B0: Nettoquerschnitte; Bild 10: Innenabmessungen.
  const c=a.c1+a.c2,t=a.sn-c,u=a.ss-c,Di=2*a.R,di=a.dA-2*a.ss;
  // B3 §8.1.1 / B1 Gl. (3): äußerer Kugel-Ersatzdurchmesser.
  const Dk=2*(a.R+a.sn);
  if(t<=0||u<=0||di<=0||a.dA>=Di){error('Positive Nettowände und lichte Stutzenweite sowie dA < 2·R erforderlich.');return finish();}
  // B9 §1.1 (1),(3),(4): dünnwandiger Teilumfang, keine Dickwandoption.
  if(t/Dk>0.1||(t/Dk<0.002&&di/Dk>1/3))error('B9 §1.1: Wanddickenverhältnis außerhalb des implementierten Dünnwandbereichs.');
  // UNVERIFIED: zusätzliche konservative Modulgrenze; B9 §1.1 (5)
  // nennt 0,8 nur für bestimmte Zylinder-/Kegelfälle, nicht als Kugelgrenze.
  if(di/Di>0.8)error('Konservative Modulgrenze di/(2·R) ≤ 0,8 überschritten (keine allgemeine B9-Kugelgrenze).');
  // B9 §4.4.2 Gl. (5).
  if(u/t>2)error('B9 §4.4.2: Netto-Wanddickenverhältnis sS/sA > 2.');
  // B1 §1: auf Dünnwandbereich beschränkt, wie in B9-Vorlage.
  if(Dk/Di>1.2||a.dA/di>1.2)error('B1-Dünnwandgrenze Da/Di ≤ 1,2 überschritten.');
  // B9 §4.3.1 Gl. (3), §4.1: maximale mittragende Breite.
  const b=Math.sqrt((Di+t)*t);
  // B9 §4.4.3 Gl. (6): fS = 1 bei Kugelschalen, nie 1,25.
  const lmax=Math.sqrt((di+u)*u),l=Math.min(a.ls,lmax);
  // B9 §4.4.1: Wanddicke über mindestens 3 se vorhanden halten.
  const zone=Math.max(b,3*a.sn);
  if(a.shape!=='sphere'){
   // B3 §8.1.2: Scheitelbereich Durchmesser 0,6 Da.
   // UNVERIFIED: konservativ nicht nur Öffnung, sondern gesamte
   // mittragende Breite als radiale Projektion innerhalb dieser Zone.
   if(a.x+a.dA/2+zone>0.3*a.Da)error('Mittragender Bereich verlässt die konservativ begrenzte Scheitelzone 0,6·Da; Krempenausschnitt nicht zulässig.');
   notes.push(['w','UNVERIFIED: Gesamter mittragender Bereich konservativ innerhalb 0,6·Da verlangt. Krempen-, Bord- und Gesamtbodennachweis nach B3 separat erforderlich.']);
  }
  // B9 §4.1 retains the unpierced-wall requirements: B1 §6.1 for
  // spheres/nozzle pipes; B3 §9.1 for heads. B0 §10 exceptions not implemented.
  if(a.sn<2||a.ss<2)error('Grundkörper und Stutzen benötigen mindestens 2 mm Wanddicke (B1 §6.1, Böden B3 §9.1); Ausnahmen sind nicht implementiert.');
  const applicable=!fail;
  // UNVERIFIED: B9 §4.1, Bild 10 nicht geometrisch verifiziert.
  // Konservativer Ersatz nach Bild 9 / Anhang Gl. (10): gleiche
  // Kugel-Innenweite als Zylinder; dessen Umfangsspannung ist doppelt
  // so groß wie die Kugelmembranspannung. Keine Kugelentlastung ansetzen.
  // Tangentiale Streifenfläche statt größerer gekrümmter Materialfläche.
  const A0=b*t,A1=l*u,As=A0+A1;
  const Ap=Di/2*(b+u+di/2)+di/2*(l+t);
  // B9 §2.6 und §4.1 Gl. (2): Ki ≤ K0; stärkeren Stutzen nicht ausnutzen.
  const Ks=a.Ks||a.K,Ss=a.Ss||a.S;
  // UNVERIFIED: Nahtfaktor pauschal konservativ auch auf Verstärkung;
  // B9 Gl. (2) enthält keinen solchen zusätzlichen Faktor.
  const f0=a.K/a.S*a.v,f1=Math.min(Ks,a.K)/Ss*a.v;
  // B9 §4.1 Gl. (2), bar -> N/mm².
  const force=a.p/10*Ap,capacity=(f0-a.p/20)*A0+(f1-a.p/20)*A1;
  const areaUtil=capacity>0?force/capacity:Infinity;
  // B9 §4.1 Gl. (2), algebraisch nach Druck in bar aufgelöst.
  const pArea=10*(f0*A0+f1*A1)/(Ap+As/2);
  // B1 Gl. (3), B3 §8.1.1: ungeschwächte Kugel / Kalotte.
  const req=Dk*a.p/(40*f0+a.p)+c;
  // B1 Gl. (2): ungeschwächtes Stutzenrohr.
  const reqN=a.dA*a.p/(20*Ks/Ss*a.v+a.p)+c;
  // B1 Gl. (3) und (2) nach Druck in bar aufgelöst.
  const pShell=40*f0*t/(Dk-t),pNozzle=20*Ks/Ss*a.v*u/(a.dA-u);
  if(![c,t,u,Di,di,Dk,b,lmax,l,zone,A0,A1,As,Ap,f0,f1,force,capacity,pArea,req,reqN,pShell,pNozzle].every(Number.isFinite)){
   error('Berechnung außerhalb des endlichen Zahlenbereichs; kein zulässiger Druck bestimmbar.');return finish();
  }
  if(pArea<=0||pShell<=0||pNozzle<=0){error('Kein positiver endlicher Grenzdruck; Zahlenbereich unterschritten.');return finish();}
  const pLimit=Math.min(pArea,pShell,pNozzle);
  // Normalize only the exact reported pressure limit, never an overload band.
  const rawUtil=Math.max(areaUtil,a.p/pShell,a.p/pNozzle);
  const util=a.p===pLimit?1:a.p<pLimit?Math.min(1,rawUtil):Math.max(1+Number.EPSILON,rawUtil);
  if(a.p>pLimit)error('Flächenvergleich oder ungeschwächter Grundkörper / Stutzen unzureichend.');
  notes.push(['w','UNVERIFIED: Kugel-Flächengeometrie Bild 10 durch konservativen Zylinder-Flächenvergleich ersetzt; keine exakte Bild-10-Berechnung.']);
  notes.push(['w','UNVERIFIED: di/(2·R) ≤ 0,8 als zusätzliche konservative Modulgrenze.']);
  if(a.v<1)notes.push(['w','UNVERIFIED: Nahtfaktor v konservativ auf beide Verstärkungsspannungen angewendet.']);
  notes.push(['',`B9 02.2010 / Korrektur 09.2016. Ungestörte Wandbreite mindestens ${H.fmt(zone)} mm ab Ausschnitt; volltragende Nähte separat nachweisen.`]);
  notes.push(['w','Nur radialer Einzelstutzen unter Innendruck; keine Scheiben, Innenüberstände, Nachbarn, Ermüdung, Zeitstand, äußeren Lasten oder Prüfdruckprüfung. Kein Abgleich mit Ausgabe 2023.']);
  rows.push(['Kugel-Innendurchmesser','Di',Di,'mm'],['Kugel-Außendurchmesser','Dk',Dk,'mm'],['Netto-Grundwand','t',t,'mm'],['Netto-Stutzenwand','u',u,'mm'],['Stutzen-Innenweite','di',di,'mm'],['Durchmesserverhältnis','di/Di',di/Di,'–'],['Mittragende Breite','b',b,'mm'],['Ungestörte Breite','bvorh,min',zone,'mm'],['Maximale Stutzenlänge','lS,max',lmax,'mm'],['Angerechnete Stutzenlänge','lS',l,'mm'],['Grundkörperfläche (Ersatz)','Aσ0',A0,'mm²'],['Stutzenfläche','Aσ1',A1,'mm²'],['Druckfläche (Ersatz)','Ap',Ap,'mm²'],['Druckkraft','F',force,'N'],['Tragfähigkeit','Z',capacity,'N'],['Auslastung Flächenvergleich','ηB9',areaUtil,'–'],['Kugelwand nach B1','s,B1',req,'mm'],['Stutzenwand nach B1','sS,B1',reqN,'mm'],['Grenzdruck Flächenvergleich','p,B9',pArea,'bar'],['Grenzdruck Kugel','p,B1',pShell,'bar'],['Grenzdruck Stutzen','pS,B1',pNozzle,'bar'],['Maßgebende Auslastung','η',util,'–']);
  return finish(util,applicable?Math.min(pArea,pShell,pNozzle):NaN,
   `Konservativer Zylinder-Ersatz (UNVERIFIED für Bild 10)\nDi = 2·R = ${H.fmt(Di)} mm\nb = √[(Di+t)·t] = ${H.fmt(b)} mm\nlS = min(lvorh; √[(di+u)·u]) = ${H.fmt(l)} mm\nAσ0 = b·t = ${H.fmt(A0)} mm²; Aσ1 = lS·u = ${H.fmt(A1)} mm²\nAp,Ersatz = Di/2·(b+u+di/2)+di/2·(lS+t) = ${H.fmt(Ap)} mm²\np·Ap/10 ≤ Σ(fi−p/20)·Aσi\n${H.fmt(force)} N ≤ ${H.fmt(capacity)} N\nKugel: s = Dk·p/(40·K/S·v+p)+c = ${H.fmt(req)} mm\nStutzen: s = dA·p/(20·Ks/Ss·v+p)+c = ${H.fmt(reqN)} mm\nη = max(ηB9; p/pKugel; p/pStutzen) = ${H.fmt(util,4)}`);
 },
 draw(g,H,r){
  H=H||AD.h;const D=H.draw,W=420,V=320,title='Kugelstutzen · Schnitt';
  const empty=()=>D.svg(W,V,D.text(210,140,'Maße eingeben'),{title,sub:'AD 2000 B9 · radiales Detail'});
  if(!g||!['R','sn','dA','ss'].every(k=>Number.isFinite(g[k])&&g[k]>0)||!Number.isFinite(g.ls)||g.ls<0||g.dA<=2*g.ss||g.dA>=2*g.R||!['sphere','kl','kor'].includes(g.shape)||
   (g.shape!=='sphere'&&(!Number.isFinite(g.Da)||g.Da<=0||!Number.isFinite(g.x)||g.x<0)))return empty();
  const val=s=>{const z=r&&r.rows&&r.rows.find(a=>a[1]===s);return z&&Number.isFinite(z[2])?z[2]:null;};
  const b=val('b'),l=val('lS');
  const k=D.fit(g.dA+2*(b||g.dA),g.ls+g.sn,280,110,0);
  const half=g.dA*k/2,t=Math.max(5,Math.min(18,g.sn*k)),u=Math.max(5,Math.min(half*.4,g.ss*k));
  if(!Number.isFinite(k)||half<8||half>115)return empty();
  const xl=210-half,xr=210+half,y=167,top=y-Math.min(95,g.ls*k);
  const bad=r&&(r.ok===false||r.fail||r.util>1),cls=bad?'o bad':'o';
  // Lokales Kugel-/Kalottendetail, Krümmung schematisch; Nettoflächen
  // ausschließlich aus calc, keine zweite Festigkeitsberechnung im SVG.
  const shell=(left,right)=>D.path(`M ${left} ${y+24} Q ${(left+right)/2} ${y-1} ${right} ${y} L ${right} ${y+t} Q ${(left+right)/2} ${y+t-1} ${left} ${y+24+t} Z`,cls,true);
  let s=D.text(16,20,'Radialer Stutzen · Maße in mm','start','tx tb2');
  s+=D.tag('shape',shell(55,xl+u));
  s+=D.path(`M ${xr-u} ${y} Q ${(xr-u+365)/2} ${y-1} 365 ${y+24} L 365 ${y+24+t} Q ${(xr-u+365)/2} ${y+t-1} ${xr-u} ${y+t} Z`,cls,true);
  s+=(D.rect(xl,top,u,y-top,cls,2)+D.rect(xr-u,top,u,y-top,cls,2));
  s+=D.centre(210,34,210,250);
  s+=D.tag('dA',D.dim(xl,top,xr,top,-16,'dA '+H.fmt(g.dA,1)));
  s+=D.tag('ls',D.dim(xl,top,xl,y,25,'lvorh '+H.fmt(g.ls,1)));
  s+=D.tag('sn',D.dim(365,y+24,365,y+24+t,-20,'se '+H.fmt(g.sn,1)));
  s+=D.tag('ss',D.dim(xr-u,top,xr,top,-32,'sS '+H.fmt(g.ss,1)));
  s+=D.tag('R',D.leader(85,y+15,20,88,'R '+H.fmt(g.R,1)));
  if(b!==null&&l!==null){
   s+=D.dim(xr,y+30,Math.min(350,xr+b*k),y+30,22,'b '+H.fmt(b,1));
   s+=D.leader(xr-u/2,y-Math.min(85,l*k)/2,300,102,'Aσ1; lS '+H.fmt(l,1));
   s+=D.leader(Math.min(340,xr+b*k*.6),y+t/2+8,300,145,'Aσ0');
   s+=D.pline([[215,y+4],[215,242],[340,242],[340,y+38]],'h');
   s+=D.text(274,235,'Ap,Ersatz','middle','tx dt');
  }
  if(g.shape!=='sphere'){
   s+=D.tag('shape Da',D.path('M 24 238 Q 57 213 90 238','t')+D.dim(24,238,90,238,13,'Da '+H.fmt(g.Da,1)));
   s+=D.tag('x',D.dim(57,224,78,224,-12,'x '+H.fmt(g.x,1)));
  }
  s+=D.text(16,265,'Krümmung schematisch; Wände überhöht','start','tx tb2');
  s+=D.text(16,279,'Flächen: konservativer Zylinder-Ersatz','start','tx tb2');
  return D.svg(W,V,s,{title,sub:'AD 2000 B9 · Bild 10: UNVERIFIED'});
 }
});
})(globalThis.AD);
