/* EN 13445-3:2014, Issue 4 (2017-07), §§6–7 (historical edition).
 * Primary standard text: (Normtext, nicht verlinkt)
 * Head equations cross-checked against the EN extract at:
 * (Normtext, nicht verlinkt)
 * EN 13445-5:2014 §10.2.3.3: (Normtext, nicht verlinkt)
 * No AD safety factors S/ST are applied to EN nominal design stresses.
 */
(function(AD){
'use strict';
const F=(id,label,sym,unit,def,extra={})=>({id,label,sym,unit,def,...extra});
const common=[
 F('product','Produktform','','','wrought',{type:'select',options:[['unknown','Bitte bestätigen'],['wrought','Walz- oder Schmiedestahl'],['casting','Stahlguss']],tip:'Voreingestellt ist Walz- oder Schmiedestahl. Bei Stahlguss (etwa GP240GH, G20Mn5) unbedingt „Stahlguss“ wählen, sonst sind die Sicherheitsbeiwerte zu niedrig.'}),
 F('weldRoute','Maßgebende Schweißnähte','','','standard',{type:'select',options:[['unknown','Bitte bestätigen'],['standard','Keine einlagigen maßgebenden Nähte'],['single','Einlagige maßgebende Nähte']],tip:'Voreingestellt: keine einlagigen maßgebenden Nähte. Einlagige maßgebende Nähte sind hier ausgeschlossen. Für sie können nach EN 13445-5 §10.2.3.3.1(c) höhere Prüfdrücke und zusätzliche Formkontrollen nötig sein.'}),
 F('steel','Werkstoffgruppe','','', 'ferr',{type:'select',options:[['ferr','Nichtaustenitischer Stahl'],['aust','Austenit, A ≥ 30 %']]}),
 F('Rm','Zugfestigkeit bei 20 °C','Rm,20','N/mm²',360),
 F('RmT','Zugfestigkeit bei Temperatur','Rm,T','N/mm²',320,{when:{steel:'aust'}}),
 F('A','Bruchdehnung','A','%',35,{when:{steel:'aust'}}),
 F('Da','Außendurchmesser','De','mm',1000),F('sn','Ausgeführte Wanddicke','en','mm',12)
];
const icon='<path d="M7 25V13Q22 0 37 13V25Z"/>';
const help='K = Rp bei T, K20 = Rp bei 20 °C; für Austenite jeweils Rp1,0, sonst Rp0,2. Rm unabhängig eingeben. Nur Innendruck, Prüfgruppe 1–3, unterhalb Zeitstandbereich; Prüftemperatur 20 °C. p wird als Pd = PS verwendet. Keine Zusatzlasten, Ausschnitte oder Ermüdung. R, r und hi im korrodierten Zustand eingeben; für die Erstprüfung wird c2 von den inneren Radien und der Bodenhöhe abgezogen.';
// EN 13445-3 §6.2.1, §6.5.1, §6.6.1 / table 6-1. User-requested extended
// austenitic route is restricted to A >=35 by the verified 2014 edition.
function stress(g,ambient=false){
 const rp=ambient?g.K20:g.K,rm=ambient?g.Rm:g.RmT;
 if(g.product==='casting')return Math.min(rp/1.9,g.Rm/3);
 return g.steel==='aust'? (g.A>=35?Math.max(rp/1.5,Math.min(rp/1.2,rm/3)):rp/1.5):Math.min(rp/1.5,g.Rm/2.4);
}
// EN 13445-3 §7.4, (7.4-2)/(7.4-5); P in N/mm².
const wall=(P,De,f,z,n=2)=>P*De/(n*f*z+P);
// EN 13445-3 §7.5.3.5, (7.5-9)…(7.5-17).
function beta(e,R,r,Di){
 const Y=Math.min(e/R,.04),Z=Math.log10(1/Y),X=r/Di,N=1.006-1/(6.2+(90*Y)**4);
 const b06=N*(-.3635*Z**3+2.2124*Z**2-3.2937*Z+1.8873);
 const b10=N*(-.1833*Z**3+1.0383*Z**2-1.2943*Z+.837);
 const b20=Math.max(.95*(.56-1.94*Y-82.5*Y**2),.5);
 return X<=.1?25*((.1-X)*b06+(X-.06)*b10):10*((.2-X)*b10+(X-.1)*b20);
}
// Pure numerical bisection, fixed bounded iterations; no standard equation.
function root(fun,hi){let lo=1e-8;if(!Number.isFinite(fun(hi))||fun(hi)<0)return NaN;for(let i=0;i<100;i++){const m=(lo+hi)/2;if(fun(m)>=0)hi=m;else lo=m;}return hi;}
function geometry(g,test=false){
 // §5.5.1: outer diameter fixed, inner dimensions in the same analysis state.
 const Di=g.Da-2*(g.sn-g.c1-(test?0:g.c2)),loss=test?g.c2:0;
 // EN 13445-3 §7.5.4 (7.5-18)…(7.5-20), equivalent torisphere.
 const k=Di/(2*(g.hi-loss));
 return {Di,k,R:g.head==='ell'?Di*(.44*k+.02):g.R-loss,r:g.head==='ell'?Di*(.5/k-.08):g.r-loss};
}
function headReq(g,P,f,fb,test=false){
 const {Di,R,r}=geometry(g,test),C=.75*R+.2*Di;
 // EN 13445-3 §7.5.3.2 (7.5-1), (7.5-2), beta evaluated at ey.
 const es=2*f*g.v>.5*P?P*R/(2*f*g.v-.5*P):Infinity;
 const ey=root(e=>e-beta(e,R,r,Di)*P*C/f,g.Da*.5);
 // EN 13445-3 §7.5.3.2 (7.5-3)/(7.5-4); keep buckling even when exemption permitted.
 const eb=C*(P/(111*fb)*(Di/r)**.825)**(2/3);
 return {e:Math.max(es,ey,eb),es,ey,eb,beta:beta(ey,R,r,Di)};
}
function coneReq(g,P,f){
 const a=g.alpha*Math.PI/180,cs=Math.cos(a),Dc=g.Da-g.sn;
 // EN 13445-3 §7.6.4 (7.6-3); full large-end De (no DK reduction).
 const econ=wall(P,g.Da,f,g.v)/cs;
 // UNVERIFIED: §7.6.6.2 (7.6-11) radical placement not reliably readable.
 // Conservative upper envelope of candidate transcriptions: omit denominator >=1
 // and negative -0.15; max(tan(a),sqrt(tan(a))) covers either radical extent.
 // Solve ej = P*Dc/(2*f) * sqrt(Dc/ej)*max(tan,sqrt(tan))/3.
 // Extra division by z is conservative for junction (original equation has no z).
 const ej=(P*Dc**1.5*Math.max(Math.tan(a),Math.sqrt(Math.tan(a))))/(6*f*g.v);
 const junction=ej**(2/3);
 return {e:Math.max(econ,junction),econ,ej:junction,Dc,cs};
}
function calc(kind,g,H){
 const notes=[],rows=[];let fail=false;
 const error=t=>{notes.push(['e',t]);fail=true;};
 const active=['p','K','K20','Rm','Da','sn','v'];
 if(g.steel==='aust')active.push('RmT','A');
 if(kind==='head'&&g.head!=='hemi'){if(g.head==='ell')active.push('hi');else active.push('R','r');if(g.steel==='aust')active.push('Rp02','Rp0220');}
 if(kind==='cone')active.push('alpha','Lcyl','Lcone');
 if(active.some(k=>!Number.isFinite(g[k])||g[k]<=0||g[k]>Number.MAX_SAFE_INTEGER)||!Number.isFinite(g.c1)||g.c1<0||!Number.isFinite(g.c2)||g.c2<0||g.v>1||g.sn>=g.Da/2)error('Ungültige Maße, Festigkeiten, Zuschläge oder Schweißnahtfaktor.');
 if(!['wrought','casting'].includes(g.product))error('Produktform aus dem Werkstoffzeugnis bestätigen.');
 if(g.product==='casting'&&g.steel==='aust')error('Austenitischer Stahlguss: Rp0,2-Werte erforderlich; automatische Rp1,0-Werte hier nicht abgedeckt.');
 if(g.weldRoute!=='standard')error('Nahtausführung bestätigen: einlagige maßgebende Nähte benötigen einen gesonderten Prüfnachweis nach EN 13445-5 §10.2.3.3.1(c).');
 if(!['ferr','aust'].includes(g.steel))error('Werkstoffgruppe auswählen.');
 if(g.steel==='aust'&&g.A<30)error('Austenitische Route erfordert A ≥ 30 %.');
 if(g.K20>g.Rm)error('Werkstoffwerte widersprüchlich: Rp bei 20 °C darf Rm bei 20 °C nicht überschreiten.');
 if(kind==='head'&&g.head!=='hemi'&&g.steel==='aust'&&(g.Rp02>g.K||g.Rp0220>g.K20))error('Werkstoffwerte widersprüchlich: Rp0,2 darf Rp1,0 bei gleicher Temperatur nicht überschreiten.');
 if(g.steel==='aust'&&g.A<35)notes.push(['w','EN 13445-3:2014 §6.4: bei 30 ≤ A < 35 % nur Rp1,0/1,5; erweiterte Route erst ab 35 %.']);
 // EN 13445-3 §5.2 / §5.5: analysis thickness excludes tolerance and corrosion allowances.
 const c=g.c1+g.c2,ea=g.sn-c,f=stress(g),fa=stress(g,true);
 if(c>Number.MAX_SAFE_INTEGER)error('Zuschläge außerhalb des numerisch sicheren Bereichs.');
 if(!(ea>0))error('Wirksame Wanddicke muss größer als null sein.');
 if(kind==='shell'&&!['cyl','sph'].includes(g.shape))error('Schalenform auswählen.');
 if(kind==='head'&&!['tori','ell','hemi'].includes(g.head))error('Bodenform auswählen.');
 // EN 13445-3 §6.2.2/§6.4.2, conservative test stress also for §6.5; castings §6.6.2.
 const testFactor=g.product==='casting'?1.33:1.05,ft=g.K20/testFactor;
 // EN 13445-5:2014 §10.2.3.3.1 a), (1)/(2); assumption Pd=PS and one material.
 const PT=Math.max(1.25*g.p*fa/f,1.43*g.p);
 let q,qt,pm=NaN,path='',extra=[];
 const sphere=kind==='shell'&&g.shape==='sph'||kind==='head'&&g.head==='hemi';
 if(kind==='shell'||sphere){
  const n=sphere?4:2;
  q={e:wall(g.p/10,g.Da,f,g.v,n)};qt={e:wall(PT/10,g.Da,ft,1,n)}; // Review-Fix: EN 13445-3 §5.6 z = 1 im Prüfzustand
  // EN 13445-3 §7.4 (7.4-3)/(7.4-6), Dm=De-ea for corroded section.
  pm=10*n*f*g.v*ea/(g.Da-ea);
  // §7.4.1; conservative screen on actual effective thickness as well as required.
  if(ea/g.Da>.16||q.e/g.Da>.16||qt.e/g.Da>.16)error('e/De > 0,16: außerhalb §7.4.1 ohne gesonderten Ermüdungsnachweis.');
  path=`e = P·De / (${n}·f·z + P)`;
  if(kind==='head')notes.push(['w','Zylinderanschluss bis zur Tangente gesondert nach §7.4.2 nachweisen.']);
 }else if(kind==='head'){
  const geo=geometry(g),{Di,R,r,k}=geo;
  // EN 13445-3 §7.5.3.1 / §7.5.4 validity limits.
  if(g.head==='ell'&&r>.2*Di)notes.push(['w','UNVERIFIED: Äquivalentradius r/Di > 0,2 beim Ellipsoid; außerhalb des hier belegten β-Verfahrens. Keine Freigabe.']);
  if(g.head==='ell'&&!(k>1.7&&k<2.2))error('Ellipsoid: 1,7 < Di/(2hi) < 2,2 erforderlich.');
  if(!(r>=.06*Di&&r<=.2*Di&&R<=g.Da&&R>Di/2&&r<Di/2))error('Geometrie außerhalb §7.5.3: 0,06Di ≤ r ≤ 0,2Di, Di/2 < R ≤ De.');
  const tg=geometry(g,true);
  if(!(tg.r>=.06*tg.Di&&tg.r<=.2*tg.Di&&tg.R<=g.Da&&tg.R>tg.Di/2&&tg.r<tg.Di/2)||g.head==='ell'&&!(tg.k>1.7&&tg.k<2.2))error('Bodengeometrie bei Erstprüfung außerhalb §7.5; korrodierte Maße und Korrosionszuschlag prüfen.');
  // EN 13445-3 §7.5-4: Rp0.2 for buckling, never substitute Rp1.0.
  const fb=(g.steel==='aust'?g.Rp02:g.K)/1.5, fbt=(g.steel==='aust'?g.Rp0220:g.K20)/1.05;
  q=headReq(g,g.p/10,f,fb);qt=headReq({...g,v:1},PT/10,ft,fbt,true); // §5.6 z = 1 im Prüfzustand
  if(!(q.beta>0&&qt.beta>0)){notes.push(['w','UNVERIFIED: β-Verfahren liefert bei sehr kleinen Druckdicken keinen positiven Faktor; Näherung hier nicht freigegeben.']);error('Kein positiver β-Faktor für Betriebs- oder Prüfzustand.');}
  if(q.e>.08*g.Da||r<2*q.e||ea<.001*g.Da||r<2*ea)error('Grenzen §7.5.3.1 verletzt: e ≤ 0,08De, r ≥ 2e, ea ≥ 0,001De.');
  if(ea>.08*g.Da)error('Wirksame Dicke ea > 0,08De: konservativ ausgeschlossen, da die Bauteilbewertung am Grenzdruck sonst außerhalb §7.5.3.1 liegt.');
  if(qt.e>.08*g.Da||tg.r<2*qt.e)error('Prüfzustand außerhalb §7.5.3.1: e ≤ 0,08De und r ≥ 2e auch mit den unkorrodierten Prüfradien erforderlich.');
  // EN 13445-3 §7.5.3.3 (7.5-6)…(7.5-8); conservatively retain Pb.
  const C=.75*R+.2*Di;
  pm=10*Math.min(2*f*g.v*ea/(R+.5*ea),f*ea/(beta(ea,R,r,Di)*C),111*fb*(ea/C)**1.5*(r/Di)**.825);
  extra=[['Innendurchmesser, korrodiert','Di',Di,'mm'],['Kalottenradius','R',R,'mm'],['Krempenradius','r',r,'mm'],['Kalotte','es',q.es,'mm'],['Fließen Krempe','ey',q.ey,'mm'],['Beulen Krempe','eb',q.eb,'mm'],['Beiwert bei ey','β',q.beta,'–']];
  path='e = max(es, ey, eb)\nes = P·R/(2fz − 0,5P)\ney = β(ey)·P·(0,75R + 0,2Di)/f\neb = (0,75R + 0,2Di)·[P/(111fb)·(Di/r)^0,825]^(2/3)';
  notes.push(['w','Gleichmäßige Bodendicke; Bord, Öffnungen und Anschluss an Zylinder gesondert nachweisen. Beulnachweis konservativ ohne Ausnahme gerechnet.']);
 }else{
  q=coneReq(g,g.p/10,f);qt=coneReq({...g,v:1},PT/10,ft); // §5.6 z = 1 im Prüfzustand
  if(!(g.alpha>0&&g.alpha<=75)||ea*q.cs/q.Dc<=.001)error('Kegel außerhalb §7.6.1: 0 < α ≤ 75° und ea·cosα/Dc > 0,001 erforderlich.');
  // EN 13445-3 §7.6.5 (7.6-9)/(7.6-10); uniform thickness on both sides.
  const l1=Math.sqrt(q.Dc*ea),l2=Math.sqrt(q.Dc*ea/q.cs);
  if(g.Lcyl<=2*l1||g.Lcone<=2*l2)error('Abstand zur nächsten Störstelle muss zylinderseitig > 2l1 und kegelseitig > 2l2 sein (§7.6.5).');
  extra=[['Kegelwand','econ',q.econ,'mm'],['Anschluss, obere Abschätzung','ej',q.ej,'mm'],['Verstärkungslänge Zylinder','1,4l1',1.4*l1,'mm'],['Verstärkungslänge Kegel','1,4l2',1.4*l2,'mm']];
  path='econ = P·De/[(2fz + P)·cosα]\nej = [P·Dc^(3/2)·max(tanα, √tanα)/(6fz)]^(2/3)\ne = max(econ, ej)';
  notes.push(['w','UNVERIFIED: Anschluss ohne Krempe nur konservative obere Abschätzung; keine abgeschlossene EN-Anschlussfreigabe. pmax und Prüfnachweis nicht freigegeben. Stumpfnaht mit glattem Übergang, gleiche Dicke und gleicher Werkstoff vorausgesetzt.']);
  // Fail closed: unverified junction must never appear as a completed EN check.
  fail=true;
 }
 // Round ratings down, never relax the strict thickness acceptance comparison.
 if(Number.isFinite(pm))pm*=1-8*Number.EPSILON;
 const req=q.e+c,treq=qt.e+g.c1;
 if(![req,req/g.sn,treq,PT,f,fa,ft,...Object.values(q),...Object.values(qt),...extra.map(x=>x[2])].every(Number.isFinite)||!(f>0)||kind!=='cone'&&!(Number.isFinite(pm)&&pm>0))error('Berechnung nicht lösbar; Eingaben und Geltungsbereich prüfen.');
 if(req>g.sn)error('Ausgeführte Wanddicke ist kleiner als erforderlich.');
 const tok=Number.isFinite(treq)&&treq<=g.sn;
 if(!tok)error('Prüfzustand erfüllt die erforderliche Wanddicke nicht.');
 if(fail)pm=NaN;
 rows.push(['Berechnungsdruck','Pd',g.p,'bar'],['Berechnungsspannung bei T','fT',f,'N/mm²'],['Berechnungsspannung bei 20 °C','fa',fa,'N/mm²'],['Prüfspannung','ftest',ft,'N/mm²'],['Wirksame Dicke','ea',ea,'mm'],...extra,['Dicke ohne Zuschläge','e',q.e,'mm'],['Zuschläge','c1+c2',c,'mm']);
 notes.push(['w','Historische Ausgabe EN 13445-3:2014, Stand 2017. Nur Festigkeitsnachweis für den angegebenen Innendruck; keine vollständige Behälterfreigabe.']);
 return {headline:{value:req,unit:'mm',label:'mm erforderlich',of:'ausgeführt '+H.fmt(g.sn,1)+' mm'},util:req/g.sn,pmax:pm,
 test:kind==='cone'?null:{PT,req:treq,have:g.sn,unit:'mm',ok:tok&&!fail,note:'Wasserprüfung bei 20 °C; Pd = PS, Prüfgruppe 1–3, ohne Wassersäule. Nur c1 abgezogen; ftest = Rp/'+(g.product==='casting'?'1,33':'1,05')+'.'},rows,notes,fail,
 formula:path+'\nP = '+H.fmt(g.p/10,3)+' N/mm²; f = '+H.fmt(f,3)+' N/mm²; z = '+H.fmt(g.v,3)+'\ne + c1 + c2 = '+H.fmt(req,3)+' mm\nPt = max(1,25·Pd·fa/fT; 1,43·Pd) = '+H.fmt(PT,3)+' bar'};
}
// Drawing geometry only: no design equations. Dimensions show original mm.
function draw(kind,g,H,r){
 const D=H.draw,W=420,V=300,title=kind==='shell'?'EN Zylinder/Kugel':kind==='head'?'EN Gewölbter Boden':'EN Kegelanschluss';
 const empty=()=>D.svg(W,V,D.text(210,125,'Maße eingeben'),{title,sub:'EN 13445-3 · Schnitt A–A'});
 if(!Number.isFinite(g.Da)||g.Da<=0||!Number.isFinite(g.sn)||g.sn<=0||g.sn>=g.Da/2)return empty();
 if(kind==='cone'&&(!Number.isFinite(g.alpha)||g.alpha<=0||g.alpha>75))return empty();
 if(kind==='head'&&!['hemi','tori','ell'].includes(g.head))return empty();
 if(kind==='head'&&g.head!=='hemi'){
  const gg=geometry({...g,c1:0},true);if(![gg.R,gg.r,gg.Di].every(x=>Number.isFinite(x)&&x>0)||gg.R<=gg.Di/2||gg.r>=gg.Di/2)return empty();
 }
 const cls=r&&(r.ok===false||r.fail||r.util>1)?'o bad':'o';
 const scale=D.fit(g.Da,g.Da,200,200,20),R=g.Da*scale/2,t=Math.min(R*.3,Math.max(5,g.sn*scale));
 let b=D.text(14,20,'Schnitt A–A','start','tx tb2');
 const arrow=(x1,y1,x2,y2)=>D.line(x1,y1,x2,y2,'d').replace('/>',' marker-end="url(#tza)"/>');
 if(kind==='shell'&&g.shape==='sph'){
  const x=210,y=120,a=R-t;
  b+=D.path(`M ${x-R} ${y} A ${R} ${R} 0 1 0 ${x+R} ${y} A ${R} ${R} 0 1 0 ${x-R} ${y} Z M ${x-a} ${y} A ${a} ${a} 0 1 1 ${x+a} ${y} A ${a} ${a} 0 1 1 ${x-a} ${y} Z`,cls,true);
  b+=D.centre(x-R-12,y,x+R+12,y)+D.centre(x,y-R-12,x,y+R+12);
  b+=D.dim(x-R,y+R,x+R,y+R,23,'De '+H.fmt(g.Da,1)+' mm');
  b+=D.leader(x+R*.7,y-R*.7,310,35,'en '+H.fmt(g.sn,1));
  b+=arrow(x,y-15,x,y-a+4)+arrow(x+15,y,x+a-4,y);
 }else if(kind==='shell'){
  if(g.shape!=='cyl')return empty();
  const x=100,y=120,a=R-t;
  b+=D.path(`M ${x-R} ${y} A ${R} ${R} 0 1 0 ${x+R} ${y} A ${R} ${R} 0 1 0 ${x-R} ${y} Z M ${x-a} ${y} A ${a} ${a} 0 1 1 ${x+a} ${y} A ${a} ${a} 0 1 1 ${x-a} ${y} Z`,cls,true);
  b+=D.centre(x-R-10,y,x+R+10,y)+D.centre(x,y-R-10,x,y+R+10);
  b+=D.dim(x-R,y+R,x+R,y+R,24,'De '+H.fmt(g.Da,1));
  b+=D.rect(220,y-R,175,t,cls,true)+D.rect(220,y+R-t,175,t,cls,true)+D.centre(210,y,405,y);
  b+=arrow(270,y-20,270,y-R+t+4)+arrow(340,y+20,340,y+R-t-4);
  b+=D.leader(350,y-R+t/2,310,30,'en '+H.fmt(g.sn,1));
 }else if(kind==='cone'){
  const cs=Math.cos(g.alpha*Math.PI/180),height=70,dx=height*Math.tan(g.alpha*Math.PI/180);
  const k=Math.min(1,105/Math.max(dx,1)),h=height*k,dd=dx*k;
  const y0=65,y1=120,y2=y1+h,left=85,right=335;
  b+=D.poly([[left,y0],[left,y1],[left+dd,y2],[left+dd+t*cs,y2-t],[left+t,y1],[left+t,y0]],cls,true);
  b+=D.poly([[right,y0],[right,y1],[right-dd,y2],[right-dd-t*cs,y2-t],[right-t,y1],[right-t,y0]],cls,true);
  b+=D.centre(210,35,210,225)+D.centre(65,y1,355,y1);
  b+=D.dim(left,y0,right,y0,-25,'De '+H.fmt(g.Da,1)+' mm');
  b+=D.leader(right,y1,350,100,'Anschluss','end');
  b+=D.leader(left+dd/2,y1+h/2,30,220,'α '+H.fmt(g.alpha,1)+'°');
  b+=D.leader(right-t/2,80,300,25,'en '+H.fmt(g.sn,1));
  b+=arrow(210,90,right-t-5,90);
  b+=D.text(14,241,'Kegel gekürzt; Anschluss ohne Krempe','start','tx tb2');
 }else{
  // Meridional head profile: sampled true ellipse or tangent crown/knuckle arcs.
  const base=193,A=130,Di=g.Da-2*g.sn,sk=2*A/g.Da,ai=Di*sk/2;
  const gt=geometry({...g,c1:0},true),Rin=gt.R*sk,rr=gt.r*sk;
  let pts=[];
  if(g.head==='hemi'||g.head==='ell'){
   const hh=g.head==='hemi'?ai:g.hi*sk;
   if(!Number.isFinite(hh)||hh<=0)return empty();
   const sy=Math.min(1,135/hh);
   for(let i=0;i<=40;i++){const a=Math.PI-i*Math.PI/40;pts.push([210+ai*Math.cos(a),base-hh*sy*Math.sin(a)]);}
  }else{
   const u=ai-rr,delta=Rin-rr,q=Math.sqrt(delta*delta-u*u),cy=base+q;
   if(!Number.isFinite(q)||delta<=0||u<=0)return empty();
   const join=ai-rr+rr*u/delta;
   for(let i=0;i<=40;i++){
    const xx=-ai+2*ai*i/40,ax=Math.abs(xx);
    let yy=ax<=join?cy-Math.sqrt(Math.max(0,Rin*Rin-xx*xx)):base-Math.sqrt(Math.max(0,rr*rr-(ax-u)**2));
    pts.push([210+xx,yy]);
   }
  }
  const top=Math.min(...pts.map(p=>p[1]));if(top<30)return empty();
  // Parallel schematic outer contour with at least 5 drawing units wall thickness.
  const tt=Math.min(12,Math.max(5,g.sn*sk));
  const outer=pts.map(([x,y])=>[210+(x-210)*(ai+tt)/ai,y-tt]);
  b+=D.poly([...outer,...pts.slice().reverse()],cls,true);
  b+=D.centre(210,top-tt-10,210,215)+D.centre(60,base,360,base);
  b+=D.dim(outer[0][0],base,outer[outer.length-1][0],base,27,'De '+H.fmt(g.Da,1)+' mm');
  b+=D.leader(210,top-tt/2,285,32,'en '+H.fmt(g.sn,1));
  if(g.head==='tori')b+=D.text(14,240,'R '+H.fmt(g.R,1)+' · r '+H.fmt(g.r,1)+' mm','start','tx tb2');
  if(g.head==='ell')b+=D.text(14,240,'hi '+H.fmt(g.hi,1)+' mm · Ellipsoid','start','tx tb2');
  b+=arrow(185,base-10,185,top+10);
 }
 b+=D.text(210,145,'p '+H.fmt(g.p,1)+' bar','middle','tx dt');
 b+=D.text(14,260,'Wanddicke überhöht; Kontur schematisch','start','tx tb2');
 return D.svg(W,V,b,{title,sub:'De '+H.fmt(g.Da,0)+' × '+H.fmt(g.sn,1)+' mm'});
}
AD.register({id:'en_shell',name:'Zylinder/Kugel',code:'EN 13445-3 §7.4',group:'EN 13445',icon,help,
 fields:[F('shape','Schalenform','','','cyl',{type:'select',options:[['cyl','Zylinder'],['sph','Kugel']]}),...common],
 calc:(g,H=AD.h)=>calc('shell',g,H),draw:(g,H=AD.h,r)=>draw('shell',g,H,r)});
AD.register({id:'en_head',name:'Gewölbte Böden',code:'EN 13445-3 §7.5',group:'EN 13445',icon,help,
 fields:[F('head','Bodenform','','','tori',{type:'select',options:[['tori','Torisphärisch'],['ell','Ellipsoid'],['hemi','Halbkugel']]}),...common,
 F('R','Kalottenradius, korrodiert','R','mm',1000,{when:{head:'tori'}}),F('r','Krempenradius, korrodiert','r','mm',100,{when:{head:'tori'}}),
 F('hi','Innere Bodenhöhe, korrodiert','hi','mm',244,{when:{head:'ell'}}),
 F('Rp02','Rp0,2 bei T für Beulen','Rp0,2,T','N/mm²',150,{when:{steel:'aust'}}),F('Rp0220','Rp0,2 bei 20 °C für Beulen','Rp0,2,20','N/mm²',210,{when:{steel:'aust'}})],
 calc:(g,H=AD.h)=>calc('head',g,H),draw:(g,H=AD.h,r)=>draw('head',g,H,r)});
AD.register({id:'en_cone',name:'Kegel',code:'EN 13445-3 §7.6',group:'EN 13445',icon,help:help+' Anschluss ohne Krempe nur konservative, nicht freigegebene Abschätzung.',
 fields:[...common,F('alpha','Kegelhalbwinkel','α','°',30),F('Lcyl','Abstand Störstelle im Zylinder','Lcyl','mm',1000),F('Lcone','Abstand Störstelle entlang Kegel','Lcone','mm',1000)],
 calc:(g,H=AD.h)=>calc('cone',g,H),draw:(g,H=AD.h,r)=>draw('cone',g,H,r)});
})(globalThis.AD);
