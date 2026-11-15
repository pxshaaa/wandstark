/* AD 2000 supplementary loads. Sources consulted 2026-11-13:
 * (Normtext, nicht verlinkt)
 * S3/4, 09.2001, §§1,2,5,6, Tafel 1/2 and Bilder 2–5 (12 pages).
 * Requested picker codes are retained, but are NOT the normative attribution:
 * S3/2 concerns saddles; S3/4 concerns support brackets, NOT lifting eyes.
 */
(function(AD){
'use strict';
const field=(id,label,sym,unit,def,min)=>({id,label,sym,unit,def,...(min?{min}:{})});
const icon='<path d="M10 3v28m0-17h24v12H10m0-12 24 12"/>';
const good=(g,keys)=>keys.every(k=>Number.isFinite(g[k])&&g[k]>0);
const bad=r=>r&&(r.ok===false||r.fail||r.util>1);
function result(H,util,rows,notes,fail,formula){if(rows.some(r=>!Number.isFinite(r[2]))){fail=true;notes.push(['e','Nicht endliches Zwischenergebnis; keine Freigabe.']);}if(util>1)notes.push(['e','Spannungsgrenze überschritten: Ausnutzung '+H.fmt(util*100)+' %.']);return {headline:{value:util*100,unit:'%',label:'% Ausnutzung',of:'örtlicher Teilnachweis'},util,pmax:NaN,test:null,rows,notes,fail:fail||!Number.isFinite(util)||util>1,formula};}
function empty(H,title){return H.draw.svg(420,300,H.draw.text(210,135,'Maße eingeben'),{title,sub:'Geometrie prüfen'});}
function arrow(D,x,y,X,Y){return D.line(x,y,X,Y,'d').replace('/>',' marker-end="url(#tza)"/>');}
AD.register({id:'s3p',name:'Tragpratzen',code:'S3/4',group:'Zusatzlasten',icon,
help:'Örtlicher Schalen-Teilnachweis nach S3/4 (09.2001), Abschnitt 6. Diagrammwerte und Hilfswerte für die jeweilige Geometrie selbst ablesen. Ohne Verstärkungsblech kein freigegebener Nachweis.',
fields:[
 field('Da','Außendurchmesser','Da','mm',2010),field('sn','Schalenwanddicke','se','mm',10),
 field('F','Maßgebende Pratzenkraft nach S3/0','NF','kN',10,'zero'),field('ap','Hebelarm zur Schalenwand','ap','mm',150,'zero'),
 field('hp','Pratzenhöhe','hp','mm',350),field('b','Pratzenbreite','b','mm',160),
 {id:'pad',label:'Verstärkungsblech',type:'select',options:[['yes','Mit Verstärkungsblech'],['no','Ohne Verstärkungsblech']],def:'yes'},
 ...[field('bv','Breite Verstärkungsblech','bv','mm',200),field('hv','Höhe Verstärkungsblech','hv','mm',400),field('ev','Dicke ohne Zuschläge','ev','mm',12),field('end','Abstand Blechrand zum Zylinderende','lE','mm',200)].map(f=>({...f,when:{pad:'yes'}})),
 // Review-Fix: keine Vorbelegung – Tafel- und Diagrammwerte müssen für die aktuelle Geometrie eingetragen werden.
 field('Cphi','Hilfswert aus Tafel 1 (eintragen)','CLφ','–',''),field('Cx','Hilfswert aus Tafel 1 (eintragen)','CLx','–',''),
 field('Kphi','Hilfswert aus Tafel 1 (eintragen)','KLφ','–',''),field('Kx','Hilfswert aus Tafel 1 (eintragen)','KLx','–',''),
 field('nphi','Diagrammwert Bild 2 (eintragen)','Nφ·Rm²·β/ML','–','','zero'),field('nx','Diagrammwert Bild 3 (eintragen)','Nx·Rm²·β/ML','–','','zero'),
 field('mphi','Diagrammwert Bild 4 (eintragen)','Mφ·Rm·βMφ/ML','–','','zero'),field('mx','Diagrammwert Bild 5 (eintragen)','Mx·Rm·βMx/ML','–','','zero'),
 {id:'charts',label:'Diagrammwerte geprüft',type:'select',options:[['no','Nein – noch nicht bestätigt'],['yes','Ja – Tafel 1 und Bilder 2–5 für aktuelle Geometrie abgelesen']],def:'no'}
],
calc(g,H){
 const notes=[['w','Nur örtliche Schalenbeanspruchung; Pratze, Verstärkungsblech, Nähte, Anker, Stabilität und sämtliche Lastfälle nach S3/0 separat nachweisen.']];
 let fail=false;
 const valid=good(g,['Da','sn','K','S','Cphi','Cx','Kphi','Kx','hp','b'])&&['p','c1','c2','F','ap','nphi','nx','mphi','mx'].every(k=>Number.isFinite(g[k])&&g[k]>=0);
 if(!valid||g.sn<=g.c1+g.c2||g.Da<=2*g.sn){notes.push(['e','Ungültige Eingaben oder keine wirksame Wanddicke.']);return result(H,NaN,[],notes,true,'Berechnung nicht möglich.');}
 if(g.pad!=='yes'||!good(g,['bv','hv','ev','end'])){notes.push(['w','UNVERIFIED: S3/4 Abschnitt 1 setzt Verstärkungsbleche voraus. Ohne Blech wird kein Ersatzmodell freigegeben.']);return result(H,NaN,[],notes,true,'Ohne gültiges Verstärkungsblech: gesonderter Nachweis erforderlich.');}
 // S3/4 §3: analysis thickness excludes allowances; mean shell radius.
 const e=g.sn-g.c1-g.c2,R=(g.Da-g.sn)/2;
 // S3/4 §6, Gl. (1)–(5): NF in N, ML in N mm.
 const ML=g.F*1000*g.ap,beta=Math.cbrt(g.bv*g.hv*g.hv)/(2*R),gamma=R/e,bp=beta*g.Kphi,bx=beta*g.Kx;
 // S3/4 §6, Tafel 2, Zeilen 1–4,8–9. Diagrammwerte are magnitudes.
 const pp=R*g.p/(10*e),px=pp/2,np=g.nphi*ML*g.Cphi/(R*R*beta*e),nx=g.nx*ML*g.Cx/(R*R*beta*e),
       mp=6*g.mphi*ML/(R*bp*e*e),mx=6*g.mx*ML/(R*bx*e*e);
 // S3/4 Tafel 2, Zeilen 7,12: plane von Mises. Conservative envelope:
 // independently combine all signs, also enclosing the A/B signs in Tafel 2.
 const vm=(a,b)=>Math.sqrt(a*a+b*b-a*b);
 let sm=0,st=0;
 for(const a of [-1,1])for(const b of [-1,1]){sm=Math.max(sm,vm(pp+a*np,px+b*nx));for(const c of [-1,1])for(const d of [-1,1])st=Math.max(st,vm(pp+a*np+c*mp,px+b*nx+d*mx));}
 // S3/4 Tafel 2, Zeilen 7,13–15: q uses K, NOT f; f=K/S (B0 §7).
 const f=g.K/g.S,q=sm/g.K,Z=1.5-.5*q*q,allow=1.5*Z*f,util=allow>0?Math.max(sm/(1.5*f),st/allow):Infinity;
 // S3/4 §1: e/Da >= .003 and distance to cylinder end >= sqrt(Da e).
 // S3/4 §6 Tafel1/Bilder2–5: gamma 15..300, hv/bv .25..4, beta .025.. .5.
 if(e/g.Da<.003||gamma<15||gamma>300||g.hv/g.bv<.25||g.hv/g.bv>4||[beta,bp,bx].some(x=>x<.025||x>.5)||g.end<Math.sqrt(g.Da*e)){fail=true;notes.push(['e','Außerhalb der berücksichtigten Geometrie- oder Diagrammgrenzen (S3/4 Abschnitte 1 und 6).']);}
 // S3/4 §7.4 Gl. (20): pad thickness between e and 1.5e (additional pad proof omitted).
 if(g.ev<e||g.ev>1.5*e){fail=true;notes.push(['e','Verstärkungsblech: e ≤ ev ≤ 1,5·e erforderlich.']);}
 if(g.charts!=='yes'){fail=true;notes.push(['w','Tafel- und Diagrammwerte nicht bestätigt: für β, γ und hv/bv aus S3/4 Tafel 1 und Bildern 2–5 ablesen und bestätigen; keine Freigabe.']);}
 notes.push(['','Konservative Vorzeichenhülle über A/B sowie Innen-/Außenseite; Blechdicke wird der Schalenwand nicht zugeschlagen.']);
 const rows=[['Wirksame Schalenwand','e',e,'mm'],['Mittlerer Radius','Rm',R,'mm'],['Lastmoment','ML',ML,'N mm'],['Formparameter','β',beta,'–'],['Schalenparameter','γ',gamma,'–'],['Biegeparameter Umfang','βMφ',bp,'–'],['Biegeparameter Längs','βMx',bx,'–'],['Druckspannung Umfang','σpφ',pp,'N/mm²'],['Druckspannung Längs','σpx',px,'N/mm²'],['Lokaler Membrananteil Umfang','σNφ',np,'N/mm²'],['Lokaler Membrananteil Längs','σNx',nx,'N/mm²'],['Biegeanteil Umfang','σBφ',mp,'N/mm²'],['Biegeanteil Längs','σBx',mx,'N/mm²'],['Membranvergleichsspannung','σmV',sm,'N/mm²'],['Gesamtvergleichsspannung','σgesV',st,'N/mm²'],['Abminderungsfaktor','Z',Z,'–'],['Zulässige Gesamtspannung','σzul',allow,'N/mm²']];
 return result(H,util,rows,notes,fail,`S3/4 Abschnitt 6, Tafel 2\nML = NF·ap = ${H.fmt(ML)} N mm\nβ = ∛(bv·hv²)/(2·Rm) = ${H.fmt(beta,4)}; γ = Rm/e = ${H.fmt(gamma)}\nσpφ = Rm·p/(10·e) = ${H.fmt(pp)} N/mm²; σpx = σpφ/2\nσN = Diagrammwert·ML·CL/(Rm²·β·e)\nσB = 6·Diagrammwert·ML/(Rm·βM·e²)\nσV = √(σφ² + σx² − σφ·σx), alle Vorzeichen\nq = σmV/K; Z = 1,5 − 0,5·q² = ${H.fmt(Z,4)}\nσmV ≤ 1,5·K/S; σgesV ≤ 1,5·Z·K/S\nAusnutzung = ${H.fmt(util*100)} %`);
},
draw(g,H,r){
 g=g||{};
 const D=H.draw;if(!good(g,['Da','sn','hp','b'])||!Number.isFinite(g.ap)||g.ap<0||g.sn>=g.Da/2)return empty(H,'Tragpratze · Schnitt');
 const pad=g.pad==='yes';if(pad&&!good(g,['bv','hv','ev']))return empty(H,'Tragpratze · Schnitt');
 const height=Math.max(g.hp,pad?g.hv:0),k=D.fit(Math.max(g.ap,g.b),height,260,180,10),h=height*k,t=Math.max(5,Math.min(15,g.sn*k)),pt=pad?Math.max(5,Math.min(12,g.ev*k)):0,x=130,y=55;
 const cl=bad(r)?'o bad':'o';let b=D.text(15,22,'Schnitt A–A / örtlicher Anschluss','start','tx tb2');
 b+=D.rect(x-t,y-8,t,h+16,cl,true)+D.centre(x-60,y-15,x-60,y+h+20);
 if(pad)b+=D.rect(x,y,pt,g.hv*k,'o',2);
 const yp=y+(height-g.hp)*k,xx=x+pt,w=Math.max(20,g.ap*k-pt); // force acts at ap from the shell surface x
 b+=D.poly([[xx,yp],[xx+w,yp+g.hp*k-7],[xx,yp+g.hp*k-7]],'o',true)+D.rect(xx,yp+g.hp*k-7,w,7,'o',2);
 b+=arrow(D,xx+w,y+h+33,xx+w,y+h+7)+D.text(xx+w+13,y+h+28,'NF','start','tx dt');
 b+=D.dim(x,y+h+3,xx+w,y+h+3,24,'ap '+H.fmt(g.ap,1)+' mm');
 b+=D.dim(x,yp,x,yp+g.hp*k,52,'hp '+H.fmt(g.hp,1));
 b+=D.leader(x-t/2,y+16,190,38,'se '+H.fmt(g.sn,1)+' mm');
 if(pad)b+=D.leader(x+pt/2,y+40,275,78,'ev '+H.fmt(g.ev,1)+' mm');
 b+=D.text(15,251,'Dicken überhöht; Breiten senkrecht zur Ansicht','start','tx tb2');
 b+=D.text(15,265,'Da '+H.fmt(g.Da,1)+' · b '+H.fmt(g.b,1)+(pad?' · bv '+H.fmt(g.bv,1)+' · hv '+H.fmt(g.hv,1):'')+' mm','start','tx tb2');
 return D.svg(420,310,b,{title:'Tragpratze · Schnitt',sub:pad?'S3/4 · mit Verstärkungsblech':'Ohne Blech · Nachweis gesperrt'});
}
});
AD.register({id:'s3o',name:'Tragösen',code:'nicht AD',group:'Zusatzlasten',icon:'<path d="M10 30V14a12 12 0 0 1 24 0v16z"/><circle cx="22" cy="14" r="5"/>',
 help:'UNVERIFIED: S3/4 behandelt Tragpratzen, nicht Tragösen. Nur elementare Vorbemessung einer eben belasteten Öse mit zwei seitlichen Nähten. Kein positiver Normnachweis möglich.',
 fields:[field('F','Bemessungs-Seilkraft je Öse inkl. Dynamik','F','kN',20,'zero'),field('alpha','Seilwinkel zur Ösenachse','α','°',0,'zero'),field('b','Ösenbreite','b','mm',120),field('t','Blechdicke','t','mm',20),field('d','Lochdurchmesser','d','mm',40),field('dp','Bolzendurchmesser','dB','mm',38),field('edge','Lochmitte bis freier Rand','eR','mm',60),field('h','Lochmitte bis Nahtgruppenmitte','h','mm',100),field('a','Wirksame Kehlnahtdicke','a','mm',6),field('l','Länge jeder der zwei Nähte','l','mm',100)],
 calc(g,H){const notes=[['w','UNVERIFIED: Keine verifizierbare AD-2000-Merkblattstelle für diese Tragösenformeln. S3/4 ist Tragpratzen zugeordnet. Vorbemessung stets gesperrt.'],['w','Ebene Belastung, zwei gleiche seitliche Nähte, gleicher Werkstoff. Schrägzug aus der Ebene, Kerben, Ermüdung, Bolzenbiegung und Behälteranschluss nicht nachgewiesen.']];
 if(!good(g,['b','t','d','dp','edge','h','a','l','K','S'])||!Number.isFinite(g.F)||g.F<0||!Number.isFinite(g.alpha)||g.alpha<0||g.alpha>60||g.d>=g.b||g.dp>g.d||2*g.edge<=g.d||g.edge>g.h||g.l>2*g.h||![g.c1,g.c2].every(c=>Number.isFinite(c)&&c>=0)){notes.push(['e','Ungültige Geometrie oder Winkel außerhalb 0° bis 60°.']);return result(H,NaN,[],notes,true,'Vorbemessung nicht möglich.');}
 // UNVERIFIED: requested S3/4 contains no lifting-lug section. Elementary
 // statics only; no AD attribution can be supplied. Force is already factored.
 const F=1000*g.F,ang=g.alpha*Math.PI/180,V=F*Math.cos(ang),Q=F*Math.sin(ang),e=g.t-g.c1-g.c2;
 if(!Number.isFinite(e)||e<=0){notes.push(['e','Keine wirksame Ösendicke.']);return result(H,NaN,[],notes,true,'Dicke prüfen.');}
 // UNVERIFIED (no applicable AD section): lower-bound net width W=t(b-d)^2/6;
 // absolute force sum and no elevated bearing allowance, deliberately restrictive.
 const A=(g.b-g.d)*e,W=e*(g.b-g.d)**2/6,M=Q*g.h,sig=V/A+M/W,tau=F/(2*(g.edge-g.d/2)*e),bearing=F/(g.dp*e);
 // UNVERIFIED (no applicable AD section): two line welds, A=2al,
 // W=al²/3; linear sum of bending normal and sqrt(3)*direct shear.
 const weld=M/(g.a*g.l*g.l/3)+Math.sqrt(3)*F/(2*g.a*g.l),f=g.K/g.S,
 util=Math.max((sig+Math.sqrt(3)*Q/A)/f,Math.sqrt(3)*tau/f,bearing/f,weld/f);
 const rows=[['Wirksame Dicke','te',e,'mm'],['Nettoschnittfläche','An',A,'mm²'],['Konservatives Widerstandsmoment','Wn',W,'mm³'],['Zug und Biegung','σ',sig,'N/mm²'],['Ausscheren zum Rand','τ',tau,'N/mm²'],['Lochleibung am Bolzen','σL',bearing,'N/mm²'],['Nahtvergleichsspannung','σw',weld,'N/mm²'],['Vergleichsgrenze Vorbemessung','f',f,'N/mm²']];
 return result(H,util,rows,notes,true,`UNVERIFIED – keine Normfreigabe\nF = ${H.fmt(F)} N; V = F·cos α; Q = F·sin α\nte = t − c1 − c2 = ${H.fmt(e)} mm\nAn = (b−d)·te; Wn = te·(b−d)²/6\nσ = V/An + Q·h/Wn = ${H.fmt(sig)} N/mm²\nτ = F/[2·(eR−d/2)·te] = ${H.fmt(tau)} N/mm²\nσL = F/(dB·te) = ${H.fmt(bearing)} N/mm²\nσw = Q·h/(a·l²/3) + √3·F/(2·a·l) = ${H.fmt(weld)} N/mm²\nVergleichsgrenze K/S = ${H.fmt(f)} N/mm²`);
 },
 draw(g,H,r){
 g=g||{};const D=H.draw;if(!good(g,['b','t','d','dp','edge','h','a','l'])||g.d>=g.b||g.dp>g.d||g.edge<=g.d/2||g.edge>g.h||g.l>2*g.h||!Number.isFinite(g.h+g.edge+g.l/2))return empty(H,'Tragöse · Ansichten');
 const total=g.h+g.edge+g.l/2,k=D.fit(g.b,total,220,195,15),w=g.b*k,h=total*k,x=140-w/2,y=45,cx=140,cy=y+g.edge*k,rad=g.d*k/2,cl=bad(r)?'o bad':'o';
 let b=D.text(16,22,'Ansicht / Schnitt A–A','start','tx tb2');
 // Absolute path with reversed hole contour: cut material hatched, hole clear.
 b+=D.path(`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z M ${cx-rad} ${cy} A ${rad} ${rad} 0 1 0 ${cx+rad} ${cy} A ${rad} ${rad} 0 1 0 ${cx-rad} ${cy} Z`,cl,true);
 b+=D.centre(cx,y-12,cx,y+h+10)+D.centre(x-12,cy,x+w+12,cy);
 b+=D.dim(x,y+h,x+w,y+h,22,'b '+H.fmt(g.b,1));
 const wc=cy+g.h*k,wl=g.l*k;
 b+=D.rect(x-3,wc-wl/2,3,wl,'o',2)+D.rect(x+w,wc-wl/2,3,wl,'o',2);
 b+=D.dim(x,cy,x,wc,32,'h '+H.fmt(g.h,1));
 b+=D.leader(cx+rad,cy,212,65,'d '+H.fmt(g.d,1));
 b+=arrow(D,cx,cy-rad-4,cx,cy-rad-27)+D.text(cx+10,cy-rad-19,'F','start','tx dt');
 const sx=290,sy=55,tt=Math.max(5,Math.min(25,g.t*k));
 b+=D.rect(sx,sy,tt,h,cl,true)+D.line(sx,sy+g.edge*k-rad,sx+tt,sy+g.edge*k-rad,'h')+D.line(sx,sy+g.edge*k+rad,sx+tt,sy+g.edge*k+rad,'h');
 b+=D.poly([[sx-6,sy+h],[sx,sy+h-8],[sx,sy+h]],cl,2)+D.poly([[sx+tt,sy+h],[sx+tt,sy+h-8],[sx+tt+6,sy+h]],cl,2);
 b+=D.dim(sx,sy+h,sx+tt,sy+h,27,'t '+H.fmt(g.t,1));
 b+=D.leader(sx+tt+2,sy+h-3,345,215,'a '+H.fmt(g.a,1));
 b+=D.text(260,37,'2 Nähte · l '+H.fmt(g.l,1)+' mm','start','tx tb2');
 b+=D.text(15,253,'Dicken ggf. überhöht · ebener Seilzug','start','tx tb2');
 b+=D.text(15,267,'UNVERIFIED · kein Normnachweis','start','tx tb2');
 return D.svg(420,310,b,{title:'Tragöse · Ansichten',sub:'Vorbemessung · S3/4 nicht anwendbar'});
 }
});
})(globalThis.AD);
