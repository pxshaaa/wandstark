/* ASME BPVC VIII-1, 2010: UG-27, UG-32, UG-34, UG-99(b).
 * Verified code text: (Normtext, nicht verlinkt)
 * Appendix 1-4(d), Eq. (3), M: ASME BPVC VIII-1, 2023, p. 323:
 * (Normtext, nicht verlinkt)
 * All diameter/radius inputs are CORRODED dimensions; sn is minimum actual
 * thickness after forming. c2 is corrosion allowance, c1 optional extra deduction.
 * S/ST/E intentionally override shared AD safety factors / elastic modulus.
 */
(function(AD){
'use strict';
const positive=x=>Number.isFinite(x)&&x>0&&x<=Number.MAX_SAFE_INTEGER;
const common=[
 {id:'D',label:'Innendurchmesser im korrodierten Zustand',sym:'Di',unit:'mm',def:1000},
 {id:'sn',label:'Mindestwanddicke nach Umformung',sym:'s',unit:'mm',def:12},
 {id:'S',label:'Zulässige ASME-Spannung bei Auslegung',sym:'S',unit:'MPa',def:120,help:'Aus ASME II-D; kein AD-Sicherheitsbeiwert.'},
 {id:'Rm',label:'Mindestzugfestigkeit bei 20 °C',sym:'Rm',unit:'MPa',def:360},
 {id:'ST',label:'Zulässige ASME-Spannung bei 20 °C',sym:'ST',unit:'MPa',def:138},
 {id:'E',label:'Nahtwirkungsgrad nach UW-12',sym:'E',unit:'–',def:0.85,help:'Kleinster maßgebender Wirkungsgrad; 0 < E ≤ 1.'}
];
const icon='<path d="M5 27V15Q22 -5 39 15V27M5 27h34"/>';
function calc(id,g,H){
 const notes=[],rows=[];let fail=false;
 const error=t=>{notes.push(['e',t]);fail=true;};
 // UG-32(e), 2010: retain raw II-D stresses for UG-99(b)'s material ratio.
 const tor=id==='ug32'&&['tor','tor6'].includes(g.head);
 if(tor&&!positive(g.Rm))error('Mindestzugfestigkeit bei 20 °C für die Torisphäre eingeben.');
 const S=tor&&g.Rm>500?Math.min(g.S,150*Math.min(1,g.S/g.ST)):g.S;
 const P=g.p/10,SE=S*g.E,c=g.c1+g.c2,t=g.sn-c,R=g.D/2;
 if(![g.p,g.D,g.sn,g.S,g.ST,g.E].every(positive)||g.E>1||![g.c1,g.c2].every(x=>Number.isFinite(x)&&x>=0&&x<=Number.MAX_SAFE_INTEGER)||t<=0)
   error('Eingaben ungültig: positive Maße und Spannungen, 0 < E ≤ 1 und s > c1 + c2 erforderlich.');
 let a=NaN,b=NaN,expr='',th=NaN,tl=NaN,L=NaN,r=NaN;
 if(id==='ug27'){
  if(g.shape==='cyl'){
   // UG-27(c)(1), Eq. (1): hoop; UG-27(c)(2), Eq. (2): axial.
   th=P*R/(SE-0.6*P);tl=P*R/(2*SE+0.4*P);
   a=R;b=0.6;expr='tU = P·R/(S·E − 0,6P); tL = P·R/(2S·E + 0,4P)';
   // Conservative subset of UG-27(c): require both pressure and wall limits.
   if(t>0.5*R||P>0.385*SE)error('Außerhalb des hier abgedeckten UG-27(c)-Bereichs: t/R ≤ 0,5 und P/(S·E) ≤ 0,385 erforderlich.');
   notes.push(['','E wird für beide Nahtrichtungen gleich angesetzt; bei verschiedenen Wirkungsgraden den kleineren eingeben.']);
  }else if(g.shape==='sph'){
   // UG-27(d), Eq. (3): spherical shell.
   a=R;b=0.2;expr='t = P·R/(2S·E − 0,2P)';
   if(t>0.356*R||P>0.665*SE)error('Außerhalb des hier abgedeckten Kugelbereichs: t/R ≤ 0,356 und P/(S·E) ≤ 0,665 erforderlich.');
  }else error('Schalenform unbekannt.');
 }else if(id==='ug32'){
  if(g.head==='ell'){
   // UG-32(d), Eq. (1), exact 2:1 ellipsoid; UG-37 equivalent L = 0.90 D.
   a=g.D;b=0.2;L=0.9*g.D;expr='t = P·D/(2S·E − 0,2P)';
  }else if(g.head==='hemi'){
   // UG-32(f), Eq. (3).
   a=R;b=0.2;L=R;expr='t = P·L/(2S·E − 0,2P)';
   if(t>0.356*L||P>0.665*SE)error('Halbkugel außerhalb des hier abgedeckten UG-32(f)-Bereichs.');
  }else if(g.head==='tor6'||g.head==='tor'){
   // UG-32(e), Eq. (2): L = skirt outside diameter and r = 0.06 L.
   // D and Do refer to the SAME corroded geometry: Do = D + 2t.
   L=g.head==='tor6'?g.D+2*t:g.L;r=g.head==='tor6'?0.06*L:g.r;
   if(!positive(L)||!positive(r)||L>g.D+2*t+1e-8||r<0.06*(g.D+2*t)-1e-8||r<3*t||r>=R||L<R)
    error('Torisphäre: R ≤ L ≤ D + 2t; 0,06·(D + 2t) ≤ r < D/2 und r ≥ 3t erforderlich (UG-32(j)).');
   // Appendix 1-4(d), Eq. (3); M definition; UG-32(e) uses rounded M/2=0.885.
   const M=g.head==='tor6'?1.77:(3+Math.sqrt(L/r))/4;
   a=L*M;b=0.2;expr=g.head==='tor6'?'t = 0,885P·L/(S·E − 0,1P)':'M = (3 + √(L/r))/4; t = P·L·M/(2S·E − 0,2P)';
   rows.push(['Kalottenradius','L',L,'mm'],['Krempenradius','r',r,'mm'],['Formbeiwert','M',M,'–']);
   if(g.Rm>500)notes.push(['','UG-32(e), Ausgabe 2010: S auf 150 MPa bei 20 °C begrenzt, bei Temperatur proportional zu den Werkstoffspannungen vermindert.']);
  }else error('Bodenform unbekannt.');
  // UG-32(d),(e): t_s/L >= .002; here use net thickness conservatively.
  if(g.head!=='hemi'&&t/L<0.002)error('t/L < 0,002: Zusatznachweis nach Anhang 1-4(f) erforderlich; hier nicht abgedeckt.');
  notes.push(['','E muss auch die Boden-Mantel-Naht berücksichtigen (konservativ für UG-32(b)).']);
 }else{
  // UG-34(c)(2), Eq. (1): circular flat head without bolt edge moment.
  if(!positive(g.C)||g.C<0.1||g.C>0.75)error('C außerhalb des abgedeckten Bereichs 0,10 bis 0,75; Anschluss nach Bild UG-34 prüfen.');
  expr='t = D·√(C·P/(S·E))';
  notes.push(['w','Nur unverankerte runde Böden ohne Schraubenrandmoment. C und Berechnungsdurchmesser nach Bild UG-34; Anschluss separat prüfen.']);
  rows.push(['Anschlussbeiwert','C',g.C,'–']);
 }
 // Each inverse is the algebraic inverse of the cited UG equation above.
 const factor=id==='ug27'&&g.shape==='cyl'?1:2;
 const req=(p,s)=>id==='ug34'?g.D*Math.sqrt(g.C*p/(s*g.E)):
   id==='ug27'&&g.shape==='cyl'?Math.max(p*R/(s*g.E-0.6*p),p*R/(2*s*g.E+0.4*p)):
   p*a/(2*s*g.E-b*p);
 let t0=req(P,S),pm=id==='ug34'?10*SE/g.C*(t/g.D)**2:
   id==='ug27'&&g.shape==='cyl'?10*Math.min(SE*t/(R+0.6*t),2*SE*t/(R-0.4*t)):
   10*factor*SE*t/(a+b*t);
 // Round MAWP down to keep its forward thickness calculation conservative.
 if(Number.isFinite(pm))pm*=1-8*Number.EPSILON;
 if(!positive(t0)||!positive(pm)||(id!=='ug34'&&(factor*SE-b*P<=0)))error('Kein gültiger positiver Nenner oder Druckwert.');
 if(fail){pm=NaN;t0=Number.isFinite(t0)&&t0>0?t0:NaN;}
 const required=t0+c,util=required/g.sn;
 if(util>1)error('Ausgeführte Wanddicke '+H.fmt(g.sn,2)+' mm unterschreitet '+H.fmt(required,2)+' mm.');
 // UG-99(b): PT = 1.3 * MAWP * lowest material stress ratio (ST/S).
 // Single component, single material; full vessel MAWP/LSR must be supplied separately.
 const PT=Number.isFinite(pm)?1.3*pm*g.ST/g.S:NaN;
 // Conservative sufficient screen: same cited design equations at ST, no higher
 // test-only stress allowance claimed. Retain corroded dimensions, remove c2.
 const testReq=req(PT/10,g.ST)+g.c1;
 if(![required,util,pm,PT,testReq,S,SE].every(Number.isFinite))error('Berechnung oder Prüfzustand nicht endlich; keine Freigabe.');
 notes.push(['w','Prüfdruck nach UG-99(b) ausgegeben. Lasten und bleibende Verformung im Prüfzustand nicht bewertet; gesondert nachweisen. UG-99(d) nennt keine allgemeine obere Prüfdruckgrenze.']);
 notes.push(['','Die zulässigen Spannungen S und ST werden für hinterlegte ASME-Werkstoffe automatisch übernommen, sonst aus ASME II-D eingeben; EN-Werkstoffdaten und AD-Sicherheitsbeiwerte werden nicht verwendet. Maße im korrodierten Zustand; c1 zusätzlich, c2 Korrosion.']);
 notes.push(['w','Bauteil-MAWP für Innendruck; Mindestdicken, Öffnungen, Zusatzlasten und Gesamtbehälter nicht nachgewiesen.']);
 rows.unshift(['Innendruck','P',P,'MPa'],['Verwendete Berechnungsspannung','S',S,'MPa'],['Werkstoffspannung bei Auslegung','Smat',g.S,'MPa'],['Werkstoffspannung bei 20 °C','STmat',g.ST,'MPa'],['Nahtwirkungsgrad','E',g.E,'–'],['Berechnungsdurchmesser','D',g.D,'mm']);
 if(Number.isFinite(th))rows.push(['Umfangsspannung: Wanddicke','tU',th,'mm'],['Längsspannung: Wanddicke','tL',tl,'mm']);
 rows.push(['Wirksame Wanddicke','t',t,'mm'],['Druckwanddicke','t0',t0,'mm'],['Zuschläge','c1+c2',c,'mm'],['Bauteil-MAWP','MAWP',pm,'bar']);
 return {headline:{value:required,unit:'mm',label:'mm erforderlich',of:'ausgeführt '+H.fmt(g.sn,2)+' mm'},util,pmax:pm,fail,rows,notes,
  test:{PT,req:testReq,have:g.sn,unit:'mm',ok:null,note:'UG-99(b): 1,3·Bauteil-MAWP·ST/S. ST/S muss kleinstes Werkstoffverhältnis sein; hydrostatische Höhe separat. Konservativer Dickenvergleich mit ST.'},
  formula:expr+'\nP = '+H.fmt(P,3)+' MPa; S = '+H.fmt(S,2)+' MPa; E = '+H.fmt(g.E,3)+'\nt0 = '+H.fmt(t0,3)+' mm; s = t0 + c1 + c2 = '+H.fmt(required,3)+' mm\nMAWP = '+H.fmt(pm,3)+' bar\nPT = 1,3·MAWP·STmat/Smat = '+H.fmt(PT,3)+' bar'};
}

function draw(id,g,H,result){
 const D=H.draw,W=420,V=300,title=id==='ug27'?'Schale UG-27':id==='ug32'?'Boden UG-32':'Ebener Boden UG-34';
 const empty=()=>D.svg(W,V,D.text(210,130,'Maße eingeben'),{title,sub:'Schnitt A–A'});
 if(!positive(g.D)||!positive(g.sn)||g.sn>=g.D/2||!Number.isFinite(g.p))return empty();
 if(id==='ug27'&&!['cyl','sph'].includes(g.shape)||id==='ug32'&&!['ell','hemi','tor','tor6'].includes(g.head))return empty();
 const sphere=id==='ug27'&&g.shape==='sph';
 const k=D.fit(g.D+2*g.sn,sphere?g.D+2*g.sn:g.D/2+g.sn,310,180,10),A=g.D*k/2,t=Math.min(20,Math.max(5,g.sn*k)),x=210,Y=sphere?120:174;
 const cls=result&&(result.ok===false||result.fail||result.util>1)?'o bad':'o';let body='';
 if(id==='ug34'){
  body=D.rect(x-A,95,2*A,t,cls,true)+D.rect(x-A-10,95,10,t+40,'o',2)+D.rect(x+A,95,10,t+40,'o',2);
  body+=D.centre(x,70,x,200)+D.dim(x-A,95,x+A,95,-30,'D '+H.fmt(g.D,1)+' mm')+D.dim(x+A,95,x+A,95+t,-25,'s '+H.fmt(g.sn,1));
  body+=D.text(14,232,'Anschluss schematisch; C = '+H.fmt(g.C,3),'start','tx tb2');
 }else if(id==='ug27'&&g.shape==='cyl'){
  const h=110,top=65;
  body=D.rect(x-A-t,top,t,h,cls,true)+D.rect(x+A,top,t,h,cls,true)+D.centre(x,45,x,197)+D.centre(x-A-20,120,x+A+20,120);
  body+=D.dim(x-A,top+h,x+A,top+h,30,'D '+H.fmt(g.D,1)+' mm')+D.dim(x+A,top,x+A+t,top,-20,'s '+H.fmt(g.sn,1));
 }else{
  const sph=id==='ug27',hemi=sph||g.head==='hemi',tor=id==='ug32'&&['tor','tor6'].includes(g.head);
  if(tor){
   const net=g.sn-(g.c1||0)-(g.c2||0),Lmm=g.head==='tor6'?g.D+2*net:g.L,rmm=g.head==='tor6'?0.06*Lmm:g.r;
   const L=Lmm*k,rr=rmm*k,u=A-rr,q=Math.sqrt((L-rr)**2-u*u),cy=Y+q;
   if(!positive(L)||!positive(rr)||!Number.isFinite(q)||u<=0||rr>=L)return empty();
   const jx=x+u*L/(L-rr),jy=cy-q*L/(L-rr),ox=x+u*(L+t)/(L-rr),oy=cy-q*(L+t)/(L-rr);
   body=D.path(`M ${x} ${cy-L-t} A ${L+t} ${L+t} 0 0 1 ${ox} ${oy} A ${rr+t} ${rr+t} 0 0 1 ${x+A+t} ${Y} L ${x+A} ${Y} A ${rr} ${rr} 0 0 0 ${jx} ${jy} A ${L} ${L} 0 0 0 ${x} ${cy-L} Z`,cls,true);
   body+=D.path(`M ${x-A-t} ${Y} A ${rr+t} ${rr+t} 0 0 1 ${2*x-ox} ${oy} A ${L+t} ${L+t} 0 0 1 ${x} ${cy-L-t}`,'o');
   body+=D.text(14,40,'L '+H.fmt(Lmm,1)+' · r '+H.fmt(rmm,1)+' mm','start','tx tb2');
  }else{
   const B=hemi?A:A/2;
   // Ellipse/circle geometry only: closed right-half section, left outer view.
   body=D.path(`M ${x} ${Y-B-t} A ${A+t} ${B+t} 0 0 1 ${x+A+t} ${Y} L ${x+A} ${Y} A ${A} ${B} 0 0 0 ${x} ${Y-B} Z`,cls,true);
   body+=D.path(`M ${x-A-t} ${Y} A ${A+t} ${B+t} 0 0 1 ${x} ${Y-B-t}`,'o');
   if(sph)body+=D.path(`M ${x-A-t} ${Y} A ${A+t} ${A+t} 0 0 0 ${x+A+t} ${Y} L ${x+A} ${Y} A ${A} ${A} 0 0 1 ${x-A} ${Y} Z`,cls,true);
  }
  // Sphere uses a smaller fitted radius to keep the complete section inside frame.
  body+=D.centre(x,28,x,sph?Y+A+t+8:195)+D.dim(x-A,Y,x+A,Y,32,'D '+H.fmt(g.D,1)+' mm');
  body+=D.leader(x+A+t/2,Y-4,365,120,'s '+H.fmt(g.sn,1),'end');
 }
 // Pressure arrows, drawing geometry only; the actual pressure remains in bar.
 const arrow=(x1,y1,x2,y2)=>D.line(x1,y1,x2,y2,'d').replace('/>', ' marker-end="url(#tza)"/>');
 if(id==='ug27'&&g.shape==='cyl'){
  body+=arrow(x-30,120,x-A+4,120)+arrow(x+30,120,x+A-4,120);
 }else if(id==='ug34'){
  for(const f of [-0.5,0,0.5])body+=arrow(x+f*A,178,x+f*A,95+t+4);
 }else{
  body+=arrow(x,Y-5,x,Y-(id==='ug32'&&g.head==='ell'?A/2:A)*0.55);
 }
 body+=D.text(210,225,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
 body+=D.text(14,22,'Schnitt A–A · '+(id==='ug32'?'Bodenform':'Innendruck'),'start','tx tb2');
 body+=D.text(14,250,'Wanddicke ggf. überhöht dargestellt','start','tx tb2');
 return D.svg(W,V,body,{title,sub:'D '+H.fmt(g.D,0)+' × s '+H.fmt(g.sn,1)+' mm'});
}
for(const id of ['ug27','ug32','ug34']){
 const extra=id==='ug27'?[{id:'shape',label:'Schalenform',type:'select',def:'cyl',options:[['cyl','Zylinder'],['sph','Kugel']]}]:
  id==='ug32'?[{id:'head',label:'Bodenform',type:'select',def:'ell',options:[['ell','Ellipsoid 2:1'],['tor6','Torisphäre, 6-%-Krempe'],['tor','Torisphäre, freie Radien'],['hemi','Halbkugel']]},
  {id:'L',label:'Kalottenradius (korrodiert)',sym:'L',unit:'mm',def:1000,when:{head:'tor'}},
  {id:'r',label:'Krempenradius (korrodiert)',sym:'r',unit:'mm',def:100,when:{head:'tor'}}]:
  [{id:'C',label:'Anschlussbeiwert nach Bild UG-34',sym:'C',unit:'–',def:0.33}];
 AD.register({id,name:id==='ug27'?'Zylinder/Kugel':id==='ug32'?'Böden':'Ebene Böden',code:id.toUpperCase().replace('UG','UG-'),group:'ASME',icon,
 fields:[...common.map(f=>({...f,def:f.id==='sn'&&id==='ug34'?60:f.def})),...extra],
 help:'ASME VIII-1: S und ST werden für hinterlegte ASME-Werkstoffe automatisch übernommen, sonst aus ASME II-D in MPa eingeben; den Nahtwirkungsgrad E selbst festlegen. Innenmaße bereits korrodiert. p in bar. Nur Bauteil unter Innendruck; Geltungsgrenzen und Hinweise beachten.',
 calc:(g,H=AD.h)=>calc(id,g,H),draw:(g,H=AD.h,r)=>draw(id,g,H,r)});
}
})(globalThis.AD);
