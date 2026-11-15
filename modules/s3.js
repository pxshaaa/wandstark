/* Sattellager: AD 2000 S3/2 (02.2004), §§1–5, 8.
 * Quelle: (Normtext, nicht verlinkt)
 * PDF-Seiten 835–847. S3/3 betrifft Füße, NICHT Sättel. Kennung auftragsgemäß.
 * Teilnachweis: keine Freigabe ohne Stabilitätsnachweis und Sattelnachweis §6.
 */
(function(AD){
'use strict';
const fields=[
 {id:'Da',label:'Außendurchmesser',sym:'Da',unit:'mm',def:2000},
 {id:'sn',label:'Ausgeführte Wanddicke',sym:'se',unit:'mm',def:12},
 {id:'L',label:'Zylinderlänge einschließlich Bord',sym:'L',unit:'mm',def:6000},
 {id:'head',label:'Bodenform',type:'select',def:'ell',options:[['ell','Gewölbter Boden'],['hem','Halbkugel']]},
 {id:'h',label:'Bodentiefe ohne Bord',sym:'h₂',unit:'mm',def:500,help:'Tatsächliche Tiefe eingeben; bei Halbkugel h₂ = Di/2.'},
 {id:'a',label:'Sattelmitte ab Zylinderende',sym:'a₁',unit:'mm',def:450},
 {id:'angle',label:'Umschlingungswinkel',sym:'δ₁',unit:'°',def:120},
 {id:'b',label:'Sattelbreite in Achsrichtung',sym:'b₁',unit:'mm',def:200},
 {id:'weight',label:'Gesamtgewicht je Lastfall',sym:'G',unit:'kN',def:100,help:'Behälter, Böden, Einbauten und gesamte Füllung einschließen; symmetrische Lastverteilung.'},
 {id:'pad',label:'Verstärkungsblech',type:'select',def:'no',options:[['no','Ohne'],['yes','Vorhanden (ohne Festigkeitsgutschrift)']]},
 {id:'ep',label:'Blechdicke (nur Zeichnung)',sym:'ev',unit:'mm',def:12,when:{pad:'yes'}}
];
// AD S3/2 §5.1 Gl.(2): rationalisierte positive Lösung; θ₂<0 gemäß Tafel 1 umzeichnen.
function kOne(t,u){if(u<0){u=-u;t=-t;} if(u>=1)return 0;
 const A=1+3*t*u, B=1-u*u;
 // UNVERIFIED: Vorzeichenast A≤0 nicht abgesichert; konservativ keine Tragfähigkeit.
 if(A<=0)return 0;
 return 3*B/(Math.hypot(A,3*t*Math.sqrt(B))+A);
}
AD.register({id:'s3',name:'Sattellager',code:'S3/2',group:'Zusatzlasten',noUtil:false,
 icon:'<path d="M8 8h28a7 7 0 0 1 0 14H8a7 7 0 0 1 0-14ZM10 22v7h5v-7m14 0v7h5v-7"/>',fields,
 help:'Teilnachweis für zwei symmetrische Sättel nach S3/2 (02.2004). S3/3 gilt für Füße. Gesamtgewicht einschließlich Füllung eingeben. Stabilität und Sattelkonstruktion gesondert nachweisen.',
 calc(g,H){
  const notes=[['w','Teilberechnung für Sattellager nach S3/2, Ausgabe 02.2004.'],
   ['w','UNVERIFIED: Bei 1 + 3θ₁θ₂ ≤ 0 wird konservativ keine lokale Tragfähigkeit angesetzt.'],
   ['w','UNVERIFIED: Schubspannung als konservative Balkenabschätzung; kein Ersatz für den Stabilitätsnachweis nach S3/2 §5.2.1.2.'],
   ['e','Teilnachweis: Stabilität nach §4.3.1 / §5.2.1.2 und Satteltragfähigkeit nach §6 fehlen. Keine vollständige Freigabe.']];
  const invalid=(text)=>({headline:{value:NaN,text:'–',unit:'%',label:'Ausnutzung',of:'Eingaben prüfen'},noUtil:false,util:NaN,pmax:NaN,test:null,rows:[],notes:notes.concat([['e',text]]),fail:true,ok:false,formula:'Keine Berechnung: '+text});
  for(const key of ['Da','sn','L','h','a','angle','b','weight','K','S','v'])if(!Number.isFinite(g[key])||g[key]<=0)return invalid('Ungültige Eingabe: '+(fields.find(f=>f.id===key)||{label:key}).label+'.');
  if(![g.p,g.c1,g.c2].every(Number.isFinite)||g.p<0||g.c1<0||g.c2<0)return invalid('Druck und Zuschläge müssen endlich und nicht negativ sein.');
  // AD S3/2 §3.1: D = Innendurchmesser; B0: wirksame Wand ohne Zuschläge.
  const D=g.Da-2*g.sn,e=g.sn-g.c1-g.c2,f=g.K/g.S;
  if(D<=0||e<=0||g.a>=g.L/2||g.b>2*g.a||g.b>g.L-2*g.a||g.h>D/2||g.v>1)return invalid('Unzulässige Geometrie, Zuschläge oder Nahtwertigkeit.');
  // AD S3/2 §§1.5,2.3.3: b1/D ≤ 0,2; e/D ≤ 0,05; 60° ≤ δ1 ≤ 180°.
  if(g.b/D>0.2||e/D>0.05||g.angle<60||g.angle>180)return invalid('Geltungsbereich: b₁/Di ≤ 0,2; e/Di ≤ 0,05; 60° ≤ δ₁ ≤ 180°.');
  if(!['ell','hem'].includes(g.head)||!['yes','no'].includes(g.pad))return invalid('Bodenform oder Verstärkungsblech ungültig.');
  if(g.head==='hem'&&Math.abs(g.h-D/2)>0.01)return invalid('Bei Halbkugelböden muss h₂ = Di/2 sein.');
  if(Math.abs(g.S-1.5)>1e-9)return invalid('Betriebszustand nach §5.1 setzt S = 1,5 voraus.');
  if(g.pad==='yes'){
   if(!Number.isFinite(g.ep)||g.ep<=0)return invalid('Blechdicke muss positiv sein.');
   notes.push(['w','Verstärkungsblech ohne Festigkeitsgutschrift: gerechnet wird ausschließlich mit der unverstärkten Schale. Blechabmessungen und Nähte gesondert prüfen.']);
  }
  // S3/2 §4.2, Bild 4: Ersatzlänge, Linienlast, Bodenmoment; a3=a1+2h2/3.
  const G=g.weight*1000,q=G/(g.L+4*g.h/3),M0=q*D*D/16,a3=g.a+2*g.h/3;
  // S3/2 §§4.2.1–4.2.2 Lagerungsart A: je Sattel Fi, Mi, Qi, Feldmoment.
  const F=G/2,Ms=q*a3*a3/2-M0,Q=(g.L-2*g.a)/(g.L+4*g.h/3)*F;
  const Mf=M0+F*(g.L/2-g.a)-q/2*(g.L/2+2*g.h/3)**2;
  // S3/2 §8, Gleichungen unter K14: x=L/D, y=D/e; kein Diagramm extrapolieren.
  const x=g.L/D,y=D/e;
  if(x<1||x>10||y<20||y>500)return invalid('Implementierter Bereich für K₁₄: 1 ≤ L/Di ≤ 10 und 20 ≤ Di/e ≤ 500.');
  const z=1.6-.20924*(x-1)+.028702*x*(x-1)+.0004795*y*(x-1)-.0000002391*x*y*(x-1)-.0029936*(x-1)*x*x-.00000085692*(x-1)*y*y+.00000088174*x*x*(x-1)*y-.0000000075955*y*y*(x-1)*x+.000082748*(x-1)*x*x*x+.00000000048168*(x-1)*y*y*y;
  const K14=Math.max(z,1);
  // S3/2 §4.3.1 Gl.(1), conservatively also applied over support (local proof remains required).
  const sp=g.p*D/(40*e),sm=4*Math.abs(Ms)/(Math.PI*D*D*e);
  const sMid=(sp+4*Math.abs(Mf)*K14/(Math.PI*D*D*e))/g.v,sSupport=(sp+sm)/g.v;
  // S3/2 §5.2.1.1: β, γ and K3…K10. Winkel in rad in these coefficient equations.
  const d=g.angle*Math.PI/180,beta=.91*g.b/Math.sqrt(D*e),gamma=2.83*g.a/D*Math.sqrt(e/D),sd=Math.sin(d/2);
  const K3=Math.max(Math.exp(-beta)*Math.sin(beta)/beta,.25),K4=(1-Math.exp(-beta)*Math.cos(beta))/beta;
  const K5=(1.15-.1432*d)/sd,K6=Math.max(1.7-2.1*d/Math.PI,0)/sd,K7=(1.45-.43*d)/sd;
  const K8=Math.min(1,(.8*Math.sqrt(gamma)+6*gamma)/d),K9=1-.65/(1+(6*gamma)**2)*Math.sqrt(Math.PI/(3*d));
  const K10=1/(1+.6*Math.cbrt(D/e)*g.b/D*d);
  // S3/2 §5.1 Gl.(2), Tafel 1: beide θ2-Zustände (drucklos und Betriebsdruck) berücksichtigen.
  const factor=1.2/(g.S*f),t2=-.23*K6*K8/(K5*K3),t3=-.53*K4/(K7*K9*K10*sd);
  const gr2=Math.min(kOne(t2,-sm*factor),kOne(t2,(sp-sm)*factor))*f*g.S/1.2;
  const gr3=Math.min(kOne(t3,0),kOne(t3,2*sp*factor))*f*g.S/1.2;
  // S3/2 §5.2.1.1 Gl.(3),(4): lokale Längs-/Umfangstragfähigkeit, einschließlich Sattelhorn.
  const F2=.7*gr2*Math.sqrt(D*e)*e/(K3*K5),F3=.9*gr3*Math.sqrt(D*e)*e/(K7*K9*K10);
  // UNVERIFIED S3/2 §5.2.1.2: nur ergänzende Balkenabschätzung, τmax=2Q/A, A=πDe;
  // f/√3 is a conservative von-Mises shear allowance, NOT the buckling capacity zul Q in Gl.(7).
  const tau=2*Math.abs(Q)/(Math.PI*D*e),tauAllow=f/Math.sqrt(3);
  const checks=[['Feldbiegung',sMid/f],['Biegung am Sattel',sSupport/f],['Lokale Längstragfähigkeit',F2>0?F/F2:Infinity],['Sattelhorn / Umfangstragfähigkeit',F3>0?F/F3:Infinity],['Schub (Abschätzung)',tau/tauAllow]];
  const gov=checks.reduce((a,b)=>b[1]>a[1]?b:a),util=gov[1];
  notes.push(['','Maßgebend: '+gov[0]+'.']);
  if(util>1)notes.push(['e','Berechnete Ausnutzung überschreitet 100 %.']);
  notes.push(['w','Nur symmetrische Gewichtslast; Wind, Erdbeben, Stutzenlasten, Temperaturzwängungen und hydrostatischer Zusatzdruck nicht enthalten. Prüfzustand gesondert rechnen.']);
  const rows=[['Innendurchmesser','Di',D,'mm'],['Wirksame Wanddicke','e',e,'mm'],['Zulässige Spannung','f',f,'N/mm²'],['Auflagerkraft je Sattel','Fi',F,'N'],['Linienlast','q',q,'N/mm'],['Stützmoment (Vorzeichen nach Merkblatt)','Mi',Ms,'Nmm'],['Feldmoment','MF',Mf,'Nmm'],['Querkraft','Qi',Q,'N'],['Feldbeiwert','K14',K14,'–'],['Längsspannung im Feld','σF',sMid,'N/mm²'],['Längsspannung am Sattel','σS',sSupport,'N/mm²'],['Biegegrenzspannung längs','σgr,2',gr2,'N/mm²'],['Biegegrenzspannung Umfang','σgr,3',gr3,'N/mm²'],['Zulässige Sattelkraft längs','F2,zul',F2,'N'],['Zulässige Sattelkraft Umfang','F3,zul',F3,'N'],['Schubspannung (Abschätzung)','τ',tau,'N/mm²'],['Schubgrenze (Abschätzung)','τzul',tauAllow,'N/mm²']];
  for(const [name,u]of checks)rows.push([name,'η',u,'–']);
  return {headline:{value:util*100,text:(Number.isFinite(util)?H.fmt(util*100,1):'∞')+'%',unit:'%',label:'maßgebende Ausnutzung',of:gov[0]+' · Teilnachweis'},noUtil:false,util,pmax:NaN,test:null,rows,notes,fail:true,ok:false,
   formula:`Di = Da − 2·se = ${H.fmt(D)} mm; e = se − c₁ − c₂ = ${H.fmt(e)} mm\nq = G/(L + 4h₂/3) = ${H.fmt(q)} N/mm; Fi = G/2 = ${H.fmt(F)} N\nMi = q(a₁ + 2h₂/3)²/2 − qDi²/16 = ${H.fmt(Ms)} Nmm\nMF = M₀ + Fi(L/2 − a₁) − q(L/2 + 2h₂/3)²/2 = ${H.fmt(Mf)} Nmm\nσF = [pDi/(40e) + 4|MF|K₁₄/(πDi²e)]/v = ${H.fmt(sMid)} N/mm²\nσgr = K₁fS/1,2; F2,zul = ${H.fmt(F2)} N; F3,zul = ${H.fmt(F3)} N\nτ ≈ 2|Qi|/(πDi·e) = ${H.fmt(tau)} N/mm² (UNVERIFIED)\nη = max(σF/f; σS/f; Fi/F2,zul; Fi/F3,zul; τ/τzul) = ${H.fmt(util*100,1)} %`};
 },
 draw(g,H,r){
  g=g||{};
  const D=H.draw,W=420,V=310,empty=()=>D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Sattellager',sub:'AD 2000 S3/2 · Teilnachweis'});
  if(!['Da','sn','L','h','a','angle','b'].every(k=>Number.isFinite(g[k])&&g[k]>0)||g.sn>=g.Da/2||g.a>=g.L/2||g.angle<60||g.angle>180||g.b>2*g.a||g.b>g.L-2*g.a||g.h>g.Da/2)return empty();
  // Horizontale Maßtexte mit Baseline 0: auch lokale x/y-Attribute bleiben im Rahmen.
  const dim=(...args)=>D.dim(...args).replace(/translate\(([-\d.]+) ([-\d.]+)\)/,(_,x,y)=>'translate('+x+' '+(+y-3)+')').replace('y="-3"','y="0"');
  const scale=D.fit(g.L+2*g.h,g.Da,382,145,12),len=g.L*scale,hd=g.h*scale,R=g.Da*scale/2,t=Math.min(R*.4,Math.max(5,g.sn*scale));
  if(R<7||len<20)return empty();
  const x0=210-len/2,x1=210+len/2,cy=92,top=cy-R,bot=cy+R;
  const bad=!!r&&(r.fail||r.ok===false||r.util>1),cls=bad?'o bad':'o';
  let b=D.text(14,14,'Längshalbschnitt · zwei Sättel','start','tx tb2');
  b+=D.rect(x0,top,len,t,cls,true)+D.line(x0,bot,x1,bot,'o');
  b+=D.path(`M ${x0} ${top} A ${hd} ${R} 0 0 0 ${x0} ${bot} M ${x1} ${top} A ${hd} ${R} 0 0 1 ${x1} ${bot}`,'o');
  b+=D.centre(x0-hd-8,cy,x1+hd+8,cy);
  const sx=[x0+g.a*scale,x1-g.a*scale],bw=Math.max(6,Math.min(g.b*scale,30));
  for(const x of sx){
   if(g.pad==='yes')b+=D.rect(x-bw/2-3,bot, bw+6,5,'o',true);
   const y=bot+(g.pad==='yes'?5:0);
   b+=D.rect(x-bw/2,y,bw,20,cls,2)+D.line(x-bw/2-5,y+20,x+bw/2+5,y+20,'t');
   b+=D.centre(x,top-5,x,y+23);
  }
  b+=dim(x0,top,x1,top,-19,'L '+H.fmt(g.L,0)+' mm');
  b+=dim(x0,bot,sx[0],bot,40,'a '+H.fmt(g.a,0));
  b+=D.text(210,cy+15,'G = '+H.fmt(g.weight,1)+' kN','middle','tx dt');
  // Schematischer Querschnitt zum Umschlingungswinkel, unabhängig vom Längsmaßstab.
  const cx=78,yy=226,rr=27,ang=g.angle*Math.PI/360,dx=rr*Math.sin(ang),dy=rr*Math.cos(ang);
  b+=D.circle(cx,yy,rr,'t')+D.centre(cx-35,yy,cx+35,yy)+D.centre(cx,yy-34,cx,yy+34);
  b+=D.path(`M ${cx-dx} ${yy+dy} A ${rr} ${rr} 0 0 0 ${cx+dx} ${yy+dy}`,cls);
  b+=D.line(cx,yy,cx-dx,yy+dy,'d')+D.line(cx,yy,cx+dx,yy+dy,'d');
  b+=D.text(127,245,'δ₁ = '+H.fmt(g.angle,0)+'°','start','tx dt');
  b+=D.text(14,272,'Wanddicke überhöht; Böden schematisch','start','tx tb2');
  return D.svg(W,V,b,{title:'Sattellager · Teilnachweis',sub:'Di '+H.fmt(g.Da-2*g.sn,0)+' · se '+H.fmt(g.sn,1)+' mm'});
 }
});
})(globalThis.AD);
