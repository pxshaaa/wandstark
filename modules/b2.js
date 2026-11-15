/* AD 2000-Merkblatt B 2, Ausgabe 10.2000, innerer Überdruck.
 * Quellen (Text und Diagrammgleichungen visuell geprüft):
 * (Normtext, nicht verlinkt)
 * (Normtext, nicht verlinkt)
 * Abschn. 8.1.1, Bilder 3.1–3.7: direkte Diagrammgleichungen, NICHT Tafel A1.
 * Umfang: konvergierender Kegel, 10° <= phi <= 70°, homogene Wanddicke
 * im Anschluss (Zylinder und Kegel), ohne Ausschnitte oder Zusatzlasten.
 */
(function(AD){
'use strict';
// B2 8.1.1, Bilder 3.1–3.7: je [A11,A21,A31,A41], [A12,A22,A32,A42].
const charts = [
 [10,[0.8176136502,1.0381861882,0.0622158210,0.0096929535],[0.0597195135,-0.2412593780,-0.1880642590,-0.0324536587]],
 [20,[-0.1430803135,0.1381824165,-0.1765906005,-0.0065026025],[-1.4462692977,-0.8328006417,-0.1486039657,-0.0281519950]],
 [30,[-0.3500365835,-0.2440822374,-0.3246595673,-0.0190535072],[-3.6181287755,-2.6258109205,-0.5453370384,-0.0635460883]],
 [40,[0.8575902466,0.5378481964,-0.1986685329,-0.0125237427],[-8.8199247674,-6.4515131511,-1.3258437675,-0.1177022189]],
 [50,[1.2789917860,0.8377077949,-0.1656688432,-0.0118934136],[-5.0206287530,-3.5637644804,-0.5711850721,-0.0600216109]],
 [60,[1.8694396440,1.3659163860,-0.0648173574,-0.0057345617],[0.0553080284,-0.0511260440,0.3015922949,0.0090201888]],
 [70,[-0.3134405430,0.0067874373,-0.3697977429,-0.0270859480],[17.879816063,11.917959356,2.9083873997,0.1924692668]]
];
// B2 Bilder 3.1–3.7: X=ln((sl-c)/Da), Y=r/Da,
// Z=sum(Aij X^(i-1) Y^(j-1)); p*S/(15*K*v)=exp(Z), p in bar.
function chartPressure(chart,x,y,A){
 const X=Math.log(x), a=chart[1], b=chart[2];
 let z=0;
 for(let i=3;i>=0;i--) z=z*X+a[i]+b[i]*y;
 return 15*A*Math.exp(z);
}
// B2 8.1.1: Wanddicken (nicht Drücke oder Koeffizienten) linear nach phi interpolieren.
function junction(p,A,Da,phi,y,H){
 const thickness=chart=>{
  if(p>chartPressure(chart,0.1,y,A)) return Infinity;
  // B2 Abschn. 1 Gl. (1): untere Diagrammgrenze konservativ als Mindestdicke.
  return Da*H.solve(x=>chartPressure(chart,x,y,A)-p,0.001,0.1);
 };
 const k=Math.min(5,Math.floor((phi-10)/10));
 if(phi===charts[k][0]) return thickness(charts[k]);
 if(phi===charts[k+1][0]) return thickness(charts[k+1]);
 const s1=thickness(charts[k]),s2=thickness(charts[k+1]);
 if(!Number.isFinite(s1)||!Number.isFinite(s2)) return Infinity;
 return s1+(s2-s1)*(phi-charts[k][0])/10;
}
// Kegelgeometrie aus Maßen: tan φ = (Da1 − Da2) / (2·L) (halber Öffnungswinkel, Außendurchmesser, axiale Länge)
function withPhi(g){ g=g||{}; if(g.geoMode!=='dims') return g;
  let ok=[g.Da,g.Da2,g.Lk].every(x=>Number.isFinite(x)&&x>0)&&g.Da2<g.Da;
  if(!ok) return {...g,phi:NaN,_dimsOk:false};
  const dR=(g.Da-g.Da2)/2;
  if(g.junction!=='knuckle') return {...g,phi:Math.atan(dR/g.Lk)*180/Math.PI,_dimsOk:true};
  // With knuckle: outer contour = cylinder → torus (radius ro = r + s, r inner) → straight cone to Da2.
  // L = axial length from knuckle start (cylinder end) to small end:
  // L(φ) = ro·sinφ + (dR − ro·(1−cosφ))/tanφ, strictly decreasing in φ → bisection.
  const ro=(Number.isFinite(g.r)&&g.r>=0?g.r:NaN)+g.sn; if(!Number.isFinite(ro)) return {...g,phi:NaN,_dimsOk:false};
  const L=f=>ro*Math.sin(f)+(dR-ro*(1-Math.cos(f)))/Math.tan(f);
  let lo=1e-6,hi=Math.PI/2-1e-6; if(L(hi)>g.Lk||L(lo)<g.Lk) return {...g,phi:NaN,_dimsOk:false};
  for(let i=0;i<200;i++){const m=(lo+hi)/2;(L(m)>g.Lk?lo=m:hi=m);}
  const f=(lo+hi)/2; ok=dR-ro*(1-Math.cos(f))>=0;
  return {...g,phi:ok?f*180/Math.PI:NaN,_dimsOk:ok,_knuckleDims:true}; }
AD.register({
 id:'b2',name:'Kegel',code:'B2',group:'Schalen',
 icon:'<path d="M5 5h10l24 9v6l-24 9H5zM15 5v24M39 14v6"/>',
 fields:[
  {id:'Da',label:'Außendurchmesser am weiten Ende / Anschlusszylinder',sym:'Da1',unit:'mm',def:1000},
  {id:'geoMode',label:'Kegelgeometrie',type:'select',options:[['angle','Winkel eingeben'],['dims','Aus Länge und Durchmessern']],def:'angle'},
  {id:'phi',label:'Halber Öffnungswinkel',sym:'φ',unit:'°',def:30,when:{geoMode:'angle'}},
  {id:'Da2',label:'Außendurchmesser am engen Ende',sym:'Da2',unit:'mm',def:600,when:{geoMode:'dims'}},
  {id:'Lk',label:'Axiale Länge des Kegels',sym:'L',unit:'mm',def:400,when:{geoMode:'dims'}},
  {id:'sn',label:'Ausgeführte Wanddicke (Kegel und Anschlusszylinder)',sym:'se',unit:'mm',def:12},
  {id:'junction',label:'Anschluss am weiten Ende',type:'select',options:[['sharp','Ohne Krempe (Eckstoß)'],['knuckle','Mit Krempe']],def:'sharp'},
  {id:'r',label:'Innerer Krempenradius',sym:'r',unit:'mm',def:50,min:'zero',when:{junction:'knuckle'}}
 ],
 help:'Nur INNENDRUCK (B2 §8.1). Kegel unter äußerem Überdruck/Vakuum (B2 §8.2) werden hier nicht berechnet. Stahlkegel mit einem halben Öffnungswinkel von 10° bis 70°; Kegel und Anschlusszylinder müssen dieselbe Wanddicke haben. Winkel aus Durchmessern und axialer Länge nur beim Eckstoß; bei Krempen den halben Öffnungswinkel direkt eingeben. β wird aus den B2-Diagrammgleichungen ermittelt. Ohne Krempe gilt r = 0; mit Krempe 0,01 ≤ r/Da1 ≤ 0,15. Keine Ausschnitte oder zusätzlichen Kräfte/Momente.',
 draw(g,H,r){
  g=withPhi(g);
  H=H||AD.h;
  const D=H.draw, W=420, V=300, title='Kegel · Längshalbschnitt';
  const empty=()=>D.svg(W,V,D.text(210,140,'Maße eingeben'),{title,sub:'AD 2000 B2'});
  if(!g||!['Da','sn','phi'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
     g.sn/g.Da>0.1||g.phi<10||g.phi>70||!['sharp','knuckle'].includes(g.junction)||
     (g.junction==='knuckle'&&(!Number.isFinite(g.r)||g.r<=0||g.r>g.Da*.15))) return empty();
  // B2 Bild 1a: koaxialer konvergierender Kegel; Längen der abgeschnittenen
  // freien Schenkel sind reine Zeichenlängen, keine Eingaben/Nachweise.
  const a=g.phi*Math.PI/180, si=Math.sin(a), co=Math.cos(a), R=g.Da/2;
  const kr=g.junction==='knuckle'?g.r:0, L=.55*R/Math.tan(a), C=.35*R;
  const k=D.fit(C+L+kr,R,300,165,0), t=Math.max(5,g.sn*k);
  const x0=75, axis=226, y=axis-R*k, j=x0+C*k;
  const ri=kr*k, ro=ri+t, yc=y+ro;
  const qx=j+ro*si, qy=yc-ro*co;
  const xe=qx+L*k, ye=qy+L*k*Math.tan(a);
  const ix=xe-t*si, iy=ye+t*co;
  const bad=r&&(r.ok===false||r.fail||r.util>1), cls=bad?'o bad':'o';
  let body=D.text(16,20,'Zylinder → Kegel · Maße in mm','start','tx tb2');
  if(kr){
   // B2 Bild 1a: innerer Krempenradius r, konzentrische Außenkontur r+se.
   body+=D.path(`M ${x0} ${y} H ${j} A ${ro} ${ro} 0 0 1 ${qx} ${qy} L ${xe} ${ye} L ${ix} ${iy} L ${j+ri*si} ${yc-ri*co} A ${ri} ${ri} 0 0 0 ${j} ${y+t} H ${x0} Z`,cls,true);
   body+=D.tag('r',D.leader(j+ri*Math.sin(a/2),yc-ri*Math.cos(a/2),j+35,38,'r '+H.fmt(g.r,1)));
  }else{
   body+=D.poly([[x0,y],[j,y],[xe,ye],[ix,iy],[j-t*Math.tan(a/2),y+t],[x0,y+t]],cls,true);
   body+=D.leader(j,y,j+35,38,'Eckstoß');
  }
  body+=D.centre(62,axis,395,axis);
  body+=D.tag('Da',D.dim(x0,y,x0,axis,25,'Da/2 = '+H.fmt(g.Da/2,1)));
  body+=D.tag('sn',D.leader(x0+15,y+t/2,95,45,'se '+H.fmt(g.sn,1)));
  // Winkel φ zwischen Kegelmantellinie und achsparalleler Bezugslinie (B2 Bild 1a).
  const ar=35, ax=qx+10*co, ay=qy+10*si;
  const angleDrawing=D.line(ax,ay,ax+48,ay,'t')+D.path(`M ${ax+ar} ${ay} A ${ar} ${ar} 0 0 1 ${ax+ar*co} ${ay+ar*si}`,'d')+D.text(ax+53,ay+12,'φ '+H.fmt(g.phi,1)+'°','start','tx dt');
  body+=g.geoMode==='angle'?D.tag('phi',angleDrawing):angleDrawing;
  body+=D.text(16,247,'Da = '+H.fmt(g.Da,1)+' mm · kleiner Anschluss offen','start','tx tb2');
  body+=D.text(16,260,'Freie Schenkellängen schematisch','start','tx tb2');
  if(t>g.sn*k) body+=D.text(16,273,'Wanddicke überhöht','start','tx tb2');
  return D.svg(W,V,body,{title,sub:'AD 2000 B2 · Eckstoß / Krempe'});
 },
 calc(g,H){
  g=withPhi(g);
  if(g.geoMode==='dims'&&!g._dimsOk) return {headline:{value:NaN,unit:'mm',label:'Eingaben prüfen'},util:Infinity,pmax:NaN,test:null,rows:[],notes:[['e','Kegelmaße prüfen: Der Durchmesser am engen Ende muss kleiner als am weiten Ende sein, die Länge positiv.']],fail:true,formula:''};
  H=H||AD.h;
  const notes=[['w','Nur Innendruck nach B2 §8.1. Äußerer Überdruck / Vakuum (B2 §8.2 mit +20 % auf S und Beulnachweis) ist nicht abgedeckt.']]; let fail=false; // Review-Fix
  const error=t=>{notes.push(['e',t]);fail=true;};
  const c=g.c1+g.c2, e=g.sn-c;
  const r=g.junction==='sharp'?0:g.r, y=r/g.Da;
  const pos=['Da','sn','K','K20','S','ST','v'];
  if(pos.some(k=>!Number.isFinite(g[k])||g[k]<=0)||g.v>1 ||
    !Number.isFinite(g.p)||g.p<0 || !Number.isFinite(g.c1)||g.c1<0 || !Number.isFinite(g.c2)||g.c2<0)
   error('Ungültige Eingabe: Geometrie, Kennwerte und Sicherheitsbeiwerte müssen positiv sein; p und Zuschläge nicht negativ, 0 < v ≤ 1.');
  // B2 8.1.1 Bilder 3.1–3.7; unter 10° hier keine Extrapolation, >70° siehe 8.1.3.
  if(!Number.isFinite(g.phi)||g.phi<10||g.phi>70)
   error('Außerhalb des implementierten Winkelbereichs 10° … 70°; flache Kegel nach B2 8.1.3 gesondert rechnen.');
  if(g._knuckleDims) notes.push(['','Winkel aus Maßen mit Krempe: Außenkontur Zylinder → Krempe (Radius r + s) → gerader Kegel; L gemessen vom Krempenbeginn am Zylinder bis zum engen Ende.']);
  if(g.geoMode!==undefined&&!['angle','dims'].includes(g.geoMode)) error('Unbekannter Geometriemodus.');
  if(!['sharp','knuckle'].includes(g.junction)) error('Unbekannte Anschlussart.');
  // B2 Abschn. 1.1 Gl. (3); r=0 ist der Eckstoß der Bilder 3.1–3.7.
  if(g.junction==='knuckle'&&(!Number.isFinite(y)||y<0.01||y>0.15))
   error(`r/Da1 = ${H.fmt(y,4)} außerhalb 0,01 … 0,15 (B2).`);
  // B2 Abschn. 1 Gl. (1), für Anschluss und freien Kegelbereich.
  if(!(e/g.Da>=0.001&&e/g.Da<=0.1)) error('Wirksame Wanddicke / Da1 außerhalb 0,001 … 0,1 (B2).');
  // B2 9.1: Stahl mindestens 2 mm; Aluminium ist nicht Gegenstand dieses Moduls.
  if((g.sn-g.c1)/g.Da>0.1) error('Wirksame Wanddicke im Prüfzustand / Da1 über 0,1; außerhalb der B2-Diagramme.');
  if(g.sn<2) error('Mindestwanddicke 2 mm für Stahl nach B2 9.1 unterschritten.');
  if(!(g.Da>2*g.sn)) error('Nicht positive lichte Anschlussweite.');
  // B2 Bild 1a: normal wall thickness projects radially as se/cos φ.
  if(g.geoMode==='dims'&&!(g.Da2>2*g.sn/Math.cos(g.phi*Math.PI/180)))
   error('Am engen Ende bleibt keine lichte Weite: Da2 muss größer als 2·se/cos φ sein.');
  if(fail) return {
   headline:{value:NaN,unit:'mm',label:'nicht nachgewiesen',of:`ausgeführt ${H.fmt(g.sn,1)} mm`},
   util:Infinity,pmax:NaN,test:null,rows:[],notes,fail:true,
   formula:'Keine Berechnung außerhalb des implementierten Geltungsbereichs.'
  };
  // B2 8.1.2 Gl. (6), mit konservativem DK=Da1 >= DK nach Gl. (7).
  const cos=Math.cos(g.phi*Math.PI/180);
  const wall=(p,A)=>20*A>p ? g.Da*p/((20*A-p)*cos) : Infinity;
  const design=(p,A)=>({sg:wall(p,A),sl:junction(p,A,g.Da,g.phi,y,H)});
  const A=g.K/g.S*g.v, d=design(g.p,A);
  // B2 8.1.1: sl >= sg; Abschn. 7 Zuschläge; Abschn. 9.1 Mindestwanddicke.
  const req=Math.max(2,Math.max(d.sg,d.sl)+c),util=req/g.sn;
  if(!Number.isFinite(req)) error('Erforderliche Wanddicke liegt oberhalb der Diagrammgrenze 0,1 · Da1 oder der Membrangrenze.');
  else if(util>1) error(`Ausgeführt ${H.fmt(g.sn,2)} mm < erforderlich ${H.fmt(req,2)} mm.`);
  // Algebraische Umstellung B2 Gl. (6) mit DK=Da1; p in bar.
  const pg=20*A*e*cos/(g.Da+e*cos);
  // B2 8.1.1: inverse Wanddickeninterpolation, gleiche Methode wie bei der Auslegung.
  let lo=0,hi=Math.max(...charts.map(ch=>chartPressure(ch,0.1,y,A)));
  for(let i=0;i<90;i++){
   const mid=(lo+hi)/2;
   if(junction(mid,A,g.Da,g.phi,y,H)<=e)lo=mid;else hi=mid;
  }
  const pl=lo;
  // Invert the actual returned nominal requirement, including additions.
  // This guarantees that pmax itself is feasible despite floating-point rounding.
  lo=0;hi=Math.min(pg,pl);
  for(let i=0;i<90;i++){
   const mid=(lo+hi)/2,dm=design(mid,A);
   if(Math.max(2,Math.max(dm.sg,dm.sl)+c)<=g.sn)lo=mid;else hi=mid;
  }
  const pm=lo;
  // Äquivalenter β-Faktor: Definition aus dem B2-Diagrammergebnis sl,
  // sl = Da1*p*β/(40*K/S*v). Keine konstante β-Näherung in der Berechnung!
  const beta=g.p>0?40*A*d.sl/(g.Da*g.p):NaN;
  // Prüfzustand wie B1: PED-Prüfdruck aus gemeinsamem H.PT, K20/S′, nur c1.
  // UNVERIFIED: Übertragung dieser B1/PED-Prüfkonvention auf B2 nicht im B2-Text geregelt.
  const PT=H.PT(g),t=design(PT,g.K20/g.ST*g.v);
  const sT=Math.max(2,Math.max(t.sg,t.sl)+g.c1),ok=Number.isFinite(PT)&&Number.isFinite(sT)&&sT<=g.sn;
  if(![A,req,util,pg,pl,pm,PT,sT,...(g.p>0?[beta]:[])].every(Number.isFinite)||!(pm>0))
   error('Zahlenbereich überschritten; keine verwertbare Berechnung oder Druckfreigabe.');
  if(!ok) error('Wanddicke im Prüfzustand nicht ausreichend oder oberhalb der Diagrammgrenze.');
  notes.push(['','Kegelwand mit DK = Da1 konservativ gegenüber dem reduzierten DK nach B2 Gl. (7).']);
  notes.push(['','Anschluss aus B2 Bildern 3.1–3.7; β ist der äquivalente Ergebnisbeiwert, kein konstanter Eingabefaktor.']);
  notes.push(['w','UNVERIFIED: Prüfzustand: Übertragung der B1/PED-Konvention auf B2 nicht im B2-Text verifiziert; p wird als PS angenommen.']);
  notes.push(['w','Gleiche Wanddicke in Anschlusszylinder und Kegel sowie ausreichende ungestörte Anschlusslängen vorausgesetzt; kleiner Anschluss, Ausschnitte, Zusatzlasten und Ermüdung gesondert nachweisen.']);
  if(g.junction==='sharp') notes.push(['w','Eckstoß: Gegenschweißung oder Gleichwertigkeitsnachweis nach B2 2.3 / HP 5/3 erforderlich.']);
  return {
   headline:{value:req,unit:'mm',label:'mm erforderlich',of:`ausgeführt ${H.fmt(g.sn,1)} mm`},
   util,pmax:pm,test:{PT,req:sT,have:g.sn,unit:'mm',ok,note:'K20, S′, nur c1; B1/PED-Prüfkonvention, siehe Warnhinweis.'},
   rows:[['Berechnungsdruck','p',g.p,'bar'],['Zulässige Spannung mit Nahtfaktor','K/S·v',A,'N/mm²'],
    ...(g.geoMode==='dims'?[['Außendurchmesser am engen Ende','Da2',g.Da2,'mm'],['Axiale Länge','L',g.Lk,'mm']]:[]),
    ['Halber Öffnungswinkel'+(g.geoMode==='dims'?(g._knuckleDims?' (aus L, Da1, Da2 und Krempe)':' (aus tan φ = (Da1 − Da2)/(2·L))'):''),'φ',g.phi,'°'],['Krempenradius','r',r,'mm'],['Relativer Radius','r/Da1',y,'–'],
    ['Wirksame Wanddicke','se−c1−c2',e,'mm'],['Relative Wanddicke','(se−c)/Da1',e/g.Da,'–'],
    ...(g.p>0?[['Äquivalenter Anschlussbeiwert','β',beta,'–']]:[]),['Kegelwand ohne Zuschläge','sg,0',d.sg,'mm'],
    ['Anschluss ohne Zuschläge','sl,0',d.sl,'mm'],['Zuschläge','c1+c2',c,'mm'],
    ['Erforderliche Wanddicke','s',req,'mm'],['Zulässiger Druck Kegelwand','p_g',pg,'bar'],
    ['Zulässiger Druck Anschluss','p_l',pl,'bar'],['Zulässiger Druck','p_zul',pm,'bar']],
   notes,fail,
   formula:`B2 Gl. (6): sg,0 = Da1·p / [(20·K/S·v − p)·cos φ]\nsg,0 = ${H.fmt(g.Da)}·${H.fmt(g.p)} / [(20·${H.fmt(A)} − ${H.fmt(g.p)})·${H.fmt(cos,5)}] = ${H.fmt(d.sg,3)} mm\nAnschluss: X = ln(sl,0/Da1), Y = r/Da1; Z = Σ Aij·X^(i−1)·Y^(j−1)\np·S/(15·K·v) = exp(Z); nach sl,0 gelöst, Wanddicken nach φ interpoliert (Bilder 3.1–3.7).\n${g.p>0?'sl,0 = Da1·p·β / (40·K/S·v) = '+H.fmt(d.sl,3)+' mm; äquivalent β = '+H.fmt(beta,4):'p = 0: sl,0 = 0,001·Da1 = '+H.fmt(d.sl,3)+' mm (untere Diagrammgrenze); β nicht definiert'}\ns = max(2 mm; max(sg,0; sl,0) + c1 + c2) = ${H.fmt(req,3)} mm\np_zul = min(p_g; p_l) = ${H.fmt(pm,3)} bar`
  };
 }
});
})(globalThis.AD);
