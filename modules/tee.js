/* Pipe branches: isolated, radial, pressure only. No external loads or pads.
 * AD B9 02.2010 (correction 09.2016), §§1.1, 2.6, 4.1, 4.4, Fig.9:
 * (Normtext, nicht verlinkt)
 * EN 13480-3:2017 §§4.3,5.2.1,6.1,8.3,8.4, Fig.8.4.3-1:
 * (Normtext, nicht verlinkt)
 * Text cross-check: (Normtext, nicht verlinkt)
 * UNVERIFIED: EN Fig.8.3.1-1 graphical ordinates could not be read from the
 * primary text. Conservative eab/eas <= 1 instead of interpolating the chart.
 * Deliberately no loader/picker edits: registration supplies the new group.
 */
(function(AD){
'use strict';
const num=(id,label,sym,def,tip,min)=>({id,label,sym,unit:'mm',def,tip,...(min?{min}:{})});
const select=(id,label,def,options,tip)=>({id,label,type:'select',def,options,tip});
const icon='<path d="M3 21h13V4h12v17h13M3 29h38M16 4h12M20 4v21M24 4v21"/>';
function fields(en){return [
 num(en?'Do':'Da','Grundrohr-Außendurchmesser',en?'Do':'Da',219.1,'Außendurchmesser des geraden Grundrohres am Abzweig eingeben.'),
 num(en?'eord':'sA','Wanddicke Grundrohr',en?'eord':'sA',10,'Kleinste garantierte Wanddicke im gesamten Verstärkungsbereich eingeben.'),
 num('dA','Abzweig-Außendurchmesser','dA',114.3,'Außendurchmesser des senkrechten Abzweigrohres eingeben.'),
 num('sS','Wanddicke Abzweig','sS',8,'Kleinste garantierte Abzweigwanddicke vor den separat eingegebenen Abzügen eingeben.'),
 num('lb','Verfügbarer äußerer Abzweigüberstand','lvorh',100,'Gerade Länge des Abzweigs von der Grundrohr-Außenfläche bis zum nächsten Übergang, Flansch oder zur nächsten Naht messen. Sie begrenzt die mittragende Abzweiglänge.','zero'),
 ...(en?[num('ls','Verfügbarer Grundrohrbereich','ls,vorh',100,'Auf beiden Seiten des Abzweigs entlang der Grundrohrachse vom äußeren Abzweigrand bis zum nächsten Übergang oder zur nächsten Öffnung messen. Den kleineren Abstand eingeben; er begrenzt die mittragende Grundrohrlänge.','zero')]:[]),
 select('kind','Ausführung','weld',[['weld','Aufgeschweißter Abzweig'],['extruded','Ausgehalstes / gezogenes T-Stück'],['forged','Geschmiedetes T-Stück']],'Aufgeschweißt: Abzweigrohr mit Naht am Grundrohr. Ausgehalst: aus dem Rohr gezogen, nur bis Durchmesserverhältnis 0,8. Geschmiedet: auch gleichschenklig, wenn die Mindestdicken im Kreuzungsbereich garantiert sind.'),
 select('angle','Abzweigwinkel','90',[['90','90°'],['45','45° (nicht abgedeckt)']],'Nur einen senkrecht zur Grundrohrachse angeschlossenen Abzweig mit 90° berechnen.'),
 select('scope','Anwendungsbereich bestätigt','yes',[['yes',en?'Nichtaustenitisch, ohne Zeitstand':'Ohne Zeitstand und ohne Nachweise nach S1 oder S2'],['no','Andere / nicht bestätigt']],en?'Nur für nichtaustenitische Stähle außerhalb des Zeitstandbereichs bestätigen; andere Werkstoffe und Zeitstandbeanspruchung berechnet das Modul nicht.':'Nur bestätigen, wenn kein Zeitstandnachweis und kein Nachweis nach S1 oder S2 erforderlich ist; diese Fälle berechnet das Modul nicht.'),
 ...(en?[
 {id:'RpT',label:'Streckgrenze bei Temperatur',sym:'Rp,t',unit:'N/mm²',def:182,tip:'Rp0,2 beziehungsweise ReH bei Berechnungstemperatur aus dem Rohrzeugnis eingeben.'},
 {id:'Rp20',label:'Streckgrenze bei 20 °C',sym:'Rp,20',unit:'N/mm²',def:235,tip:'Mindeststreckgrenze bei Raumtemperatur aus dem Rohrzeugnis eingeben.'},
 {id:'Rm',label:'Mindestzugfestigkeit bei 20 °C',sym:'Rm',unit:'N/mm²',def:360,tip:'Mindestzugfestigkeit für die zutreffende Rohrwanddicke eingeben.'},
 {id:'tol',label:'Zusätzliche Minustoleranz',sym:'a',unit:'%',def:12.5,min:'zero',tip:'Relative Minustoleranz eingeben und denselben Abzug nicht nochmals unter c1 erfassen.'},
 num('thin','Zusätzlicher Fertigungsabtrag','cF',0,'Zusätzlichen garantierten Wandverlust durch die Fertigung eingeben.','zero')
 ]:[
 {id:'Ks',label:'Abzweigkennwert (0 = Grundrohr)',sym:'Ks',unit:'N/mm²',def:0,min:'zero',tip:'Festigkeitskennwert des Abzweigs bei Temperatur eingeben oder mit 0 den Grundrohrwert übernehmen.'},
 {id:'Ss',label:'Abzweigsicherheit (0 = Grundrohr)',sym:'Ss',unit:'–',def:0,min:'zero',tip:'Sicherheitsbeiwert des Abzweigwerkstoffs eingeben oder mit 0 den Grundrohrwert übernehmen.'}
 ])];}
function calc(g,H,en){
 H=H||AD.h;const rows=[],notes=[];let fail=false;
 const error=s=>{fail=true;notes.push(['e',s]);};
 const finish=(util=Infinity,pmax=NaN,test=null,formula='Keine gültige Berechnung möglich.')=>({headline:{value:util*100,unit:'%',label:'% Auslastung',of:'Flächenvergleich und Rohre, höchstens 100 %'},util,pmax,test,rows,notes,fail,formula});
 if(g.kind==='seamless')g={...g,kind:'extruded'}; // projects saved before the split
 const Da=g[en?'Do':'Da'],s=g[en?'eord':'sA'];
 const positive=[Da,s,g.dA,g.sS,g.v,...(en?[g.RpT,g.Rp20,g.Rm]:[g.K,g.S])];
 const zero=[g.p,g.c1,g.c2,g.lb,...(en?[g.ls,g.tol,g.thin]:[g.Ks,g.Ss])];
 if(positive.some(x=>!Number.isFinite(x)||x<=0)||zero.some(x=>!Number.isFinite(x)||x<0)||g.v>1||(en&&g.tol>=100)||!['weld','extruded','forged'].includes(g.kind)){
  error('Positive Maße und Festigkeiten, nichtnegative Abzüge und Längen sowie 0 < v ≤ 1 erforderlich.');return finish();
 }
 if(g.angle!=='90')error('Nur 90°-Abzweige sind implementiert.');
 if(g.scope!=='yes')error(en?'Nur nichtaustenitisch und ohne Zeitstand (§5.2.1, §8.4.4).':'Zeitstand und Nachweise nach S1/S2 sind ausgeschlossen (B9 §1.1 (5)).');
 if(en&&(g.RpT>g.Rp20||g.Rp20>g.Rm))error('Festigkeiten müssen Rp,t ≤ Rp,20 ≤ Rm erfüllen.');
 // B9 §3/§4.1; EN §4.3 (4.3-2): net analysis thickness after allowances.
 const c=g.c1+g.c2+(en?g.thin:0),a=en?g.tol/100:0,t=s*(1-a)-c,u=g.sS*(1-a)-c;
 // EN §4.4 / §8.3.8: nominal bores determine geometric applicability.
 // B9 Fig.9: as-built bores (same convention as b9.js).
 // EN §4.3 / Fig.8.4.3-1: analysis bores, conservative all losses internal.
 const DiNom=Da-2*s,diNom=g.dA-2*g.sS,ratio=diNom/DiNom;
 const Di=Da-2*(en?t:s),di=g.dA-2*(en?u:g.sS);
 if(t<=0||u<=0||DiNom<=0||diNom<=0||Di<=0||di<=0){error('Positive Netto-Wanddicken und freie Innendurchmesser erforderlich.');return finish();}
 if(g.dA>Da||diNom>DiNom)error('Abzweig darf weder außen noch innen größer als das Grundrohr sein.');
 // B9 §1.1 (5): no blanket forged exception for the broad seamless option.
 // EN §8.3.8: extruded outlets in non-austenitic steel only up to d/D = 0,8; applied to B9 too (conservative).
 if(g.kind==='extruded'&&diNom>.8*DiNom)error('Ausgehalstes T-Stück: di/Di = '+H.fmt(ratio)+' > 0,8 nicht zulässig (EN 13480-3 §8.3.8). Für gleichschenklige T-Stücke „Geschmiedetes T-Stück“ oder „Aufgeschweißter Abzweig“ wählen.');
 if(!en&&ratio>.8&&(!Number.isFinite(g.K20)||g.K20<=0))error('B9 §1.1 (5): Für di/Di > 0,8 ist ein positiver endlicher Kennwert K20 ≤ 440 N/mm² erforderlich.');
 if(!en&&ratio>.8&&g.K20>440)error('B9 §1.1 (5): K20 > 440 N/mm² bei di/Di > 0,8; besondere geschmiedete Ausnahmen hier nicht freigegeben.');
 // B9 §1.1 (1),(4) and B1 thin-wall scope; EN §6.1 thin-wall scope.
 if(!en&&((t/Da<.002&&di/Da>1/3)||t/Da>.1))error('B9 §1.1: relative Grundrohrwand außerhalb des implementierten Bereichs.');
 if(Da/DiNom>(en?1.7:1.2)||g.dA/diNom>(en?1.7:1.2))error('Dickwandiger Rohrnachweis ist nicht implementiert.');
 // B9 §4.4.2 (5); UNVERIFIED EN chart: conservative lower envelope 1.
 const limit=en?1:2;
 if(u>limit*t)error('Netto-Wanddickenverhältnis über der Modulgrenze '+H.fmt(limit)+' (Abzweig / Grundrohr).');
 if(!en&&(s<2||g.sS<2))error('B1: Stahl-Mindestwanddicke 2 mm unterschritten.');
 if(en)notes.push(['w','Nicht gegen die Norm verifiziert: Bild 8.3.1-1 wird konservativ nur bis zum Wanddickenverhältnis eab/eas ≤ 1 angesetzt; höhere Diagrammwerte bleiben ungenutzt.']);
 const applicable=!fail;
 // B9 §4.3.1 (3), §4.4.3 (6); EN (8.4.1-2..4), (8.4.3-1).
 const lsMax=Math.sqrt((en?Da-t:Di+t)*t),lbMax=(en?1:1.25)*Math.sqrt((en?g.dA-u:di+u)*u);
 const ls=en?Math.min(g.ls,lsMax):lsMax,lb=Math.min(g.lb,lbMax);
 // B9 §4.4.1: idealised extrusion without transition radii: 0.9 material area.
 // Forged tees retain q = 1; no transition-radius credit.
 const q=g.kind==='extruded'?.9:1;
 if(q<1)notes.push(['w','Ausgehalstes T-Stück als idealisierter Abzweig gerechnet: v = 1, tragende Flächen × 0,9 nach B9 §4.4.1 bzw. EN §8.3.8; Übergangsradien ohne Anrechnung.']);
 if(g.kind==='forged')notes.push(['w','Geschmiedetes T-Stück (EN §8.3.9): v = 1, Radien ohne Anrechnung. Die eingegebenen Wanddicken müssen als Mindestdicken im gesamten Kreuzungsbereich garantiert sein (Werkszeugnis, Maßprüfung).']);
 // B9 Fig.9 / Annex (10); EN Fig.8.4.3-1: half-section areas, no inner projection.
 const A0=q*(ls+(en?u:0))*t,A1=q*lb*u,As=A0+A1;
 const Ap=Di/2*(ls+u+di/2)+di/2*(lb+t);
 // EN §5.2.1.1 (5.2.1-1); B9 §2.6 / §4.1 (2) caps K before division.
 const Kb=en?0:(g.Ks||g.K),Sb=en?0:(g.Ss||g.S);
 const f=en?Math.min(g.RpT/1.5,g.Rm/2.4):g.K/g.S;
 const fb=en?f:Math.min(Kb,g.K)/Sb;
 // UNVERIFIED blanket v on the area method: conservative reduction, as b9.js.
 const v=g.kind==='weld'?g.v:1,F=f*v,Fb=fb*v;
 if(v<1)notes.push(['w','Nicht gegen die Norm verifiziert: Nahtfaktor konservativ auf beide Flächenspannungen angewendet; Anschlussnaht gesondert nachweisen.']);
 // B9 §4.1 (2); EN (8.4.3-3), p in bar converted to MPa.
 const capacity=(F-g.p/20)*A0+(Fb-g.p/20)*A1,demand=g.p/10*Ap,areaUtil=capacity>0?demand/capacity:Infinity;
 // Algebraic inversion of preceding pressure-area inequality.
 const pArea=10*(F*A0+Fb*A1)/(Ap+As/2);
 // B1 (2); EN §6.1 (6.1-1): independent unpierced pipe check and inversion.
 const FbPipe=en?F:Kb/Sb*v;
 const pRun=20*F*t/(Da-t),pBranch=20*FbPipe*u/(g.dA-u);
 const reqRun=(Da*g.p/(20*F+g.p)+c)/(1-a),reqBranch=(g.dA*g.p/(20*FbPipe+g.p)+c)/(1-a);
 if(![c,a,t,u,DiNom,diNom,Di,di,ratio,lsMax,lbMax,ls,lb,A0,A1,As,Ap,f,fb,F,Fb,FbPipe,capacity,demand,pArea,pRun,pBranch,reqRun,reqBranch].every(Number.isFinite)){
  error('Berechnung außerhalb des endlichen Zahlenbereichs; kein zulässiger Druck bestimmbar.');return finish();
 }
 if(pArea<=0||pRun<=0||pBranch<=0){error('Kein positiver endlicher Grenzdruck; Zahlenbereich unterschritten.');return finish();}
 const pLimit=Math.min(pArea,pRun,pBranch);
 const rawUtil=Math.max(areaUtil,g.p/pRun,g.p/pBranch);
 const util=g.p===pLimit?1:g.p<pLimit?Math.min(1,rawUtil):Math.max(1+Number.EPSILON,rawUtil);
 if(g.p>pRun||g.p>pBranch)error('Ungeschwächtes Grundrohr oder Abzweigrohr reicht für den Innendruck nicht aus.');
 if(g.p>pArea)error('Flächenvergleich nicht erfüllt: '+H.fmt(areaUtil*100)+' % Auslastung.');
 let test=null;
 if(!en&&Number.isFinite(g.K20)&&g.K20>0&&Number.isFinite(g.ST)&&g.ST>0&&g.Ks===0&&g.Ss===0&&applicable){
  // PED Annex I §7.4 / H.PT; B9 (2) and B1 (2) with K20/ST.
  // Conservative: retain all operating allowances in the test geometry.
  const PT=H.PT(g),ft=g.K20/g.ST*v,ct=(ft-PT/20)*As;
  const testForce=PT/10*Ap,testRun=20*ft*t/(Da-t),testBranch=20*ft*u/(g.dA-u);
  if(![PT,ft,ct,testForce,testRun,testBranch].every(Number.isFinite)){
   error('Prüfberechnung außerhalb des endlichen Zahlenbereichs; kein zulässiger Druck bestimmbar.');return finish();
  }
  const eta=Math.max(ct>0?testForce/ct:Infinity,PT/testRun,PT/testBranch);
  if(!Number.isFinite(eta*100))error('Prüfauslastung außerhalb des endlichen Zahlenbereichs; Prüfzustand nicht erfüllt.');
  test={PT,req:eta*100,have:100,unit:'%',ok:eta<=1,note:'PED-Sollprüfdruck mit p = PS; B9/B1 bei K20/S′, volle Zuschläge konservativ beibehalten. Anschlussnähte separat prüfen.'};
 }else if(!en)notes.push(['w','Kein Prüfnachweis: K20/S′ erforderlich; abweichender Abzweigwerkstoff benötigt eigene Prüfkennwerte.']);
 notes.push(['w','Nur isolierter Abzweig unter Innendruck. Keine Zusatzlasten, Ermüdung, Schweißnahtbemessung oder Nachbaröffnungen nachgewiesen.']);
 notes.push(['',en?'Beide Rohre mit denselben Werkstoffkennwerten und Abzügen; Mindestdicken am fertigen Teil garantieren.':'Ungestörte Grundrohrbreite ab Ausschnitt mindestens '+H.fmt(Math.max(ls,3*s))+' mm sicherstellen (B9 §4.4.1).']);
 if(en)notes.push(['','Isolation nach §8.4.1: Achsabstand ≥ (d1+d2)/2 + 2·lsMax; 2·lsMax = '+H.fmt(2*lsMax)+' mm. Maßgebend ist die volle Länge aus Gleichung (8.4.1-2), nicht die verkürzte angerechnete Länge ls = '+H.fmt(ls)+' mm. Randabstände nach §8.3.2 separat sicherstellen.']);
 rows.push(['Abzüge absolut','c',c,'mm'],['Relative Minustoleranz','a',a,'–'],['Netto-Grundrohrwand','t',t,'mm'],['Netto-Abzweigwand','u',u,'mm'],['Grundrohr innen, Nennmaß','Di,nom',DiNom,'mm'],['Abzweig innen, Nennmaß','di,nom',diNom,'mm'],['Grundrohr innen, Rechnung','Di',Di,'mm'],['Abzweig innen, Rechnung','di',di,'mm'],['Nenn-Durchmesserverhältnis','di/Di',ratio,'–'],['Wanddickenverhältnis','u/t',u/t,'–'],['Grenze Wanddickenverhältnis','u/t,max',limit,'–'],['Grundrohrlänge maximal','ls,max',lsMax,'mm'],['Grundrohrlänge angerechnet','ls',ls,'mm'],['Abzweiglänge maximal','lb,max',lbMax,'mm'],['Abzweiglänge angerechnet','lb',lb,'mm'],['Flächenfaktor','q',q,'–'],['Grundrohrquerschnitt','A0',A0,'mm²'],['Abzweigquerschnitt','A1',A1,'mm²'],['Gesamtquerschnitt','As',As,'mm²'],['Druckfläche','Ap',Ap,'mm²'],['Grundrohrspannung mit v','F',F,'N/mm²'],['Abzweigspannung mit v','Fb',Fb,'N/mm²'],['Druckkraft','pAp',demand,'N'],['Tragfähigkeit','C',capacity,'N'],['Grundrohr erforderlich','s,Rohr',reqRun,'mm'],['Abzweig erforderlich','sS,Rohr',reqBranch,'mm'],['Grenzdruck Fläche','p,Fläche',pArea,'bar'],['Grenzdruck Grundrohr','p,Rohr',pRun,'bar'],['Grenzdruck Abzweig','p,Abzweig',pBranch,'bar'],['Auslastung Flächenvergleich','ηFläche',areaUtil,'–'],['Maßgebende Auslastung','η',util,'–']);
 return finish(util,applicable?Math.min(pArea,pRun,pBranch):NaN,test,
  (en?'f = min(Rp,t/1,5; Rm/2,4) = '+H.fmt(f)+' N/mm²\n':'')+
  't = '+H.fmt(s)+'·(1 − '+H.fmt(a)+') − '+H.fmt(c)+' = '+H.fmt(t)+' mm; u = '+H.fmt(u)+' mm\n'+
  'ls = '+H.fmt(ls)+' mm; lb = min('+H.fmt(g.lb)+'; '+H.fmt(lbMax)+') = '+H.fmt(lb)+' mm\n'+
  'A0 = '+H.fmt(q)+'·('+H.fmt(ls)+(en?' + '+H.fmt(u):'')+')·'+H.fmt(t)+' = '+H.fmt(A0)+' mm²\n'+
  'A1 = '+H.fmt(q)+'·'+H.fmt(lb)+'·'+H.fmt(u)+' = '+H.fmt(A1)+' mm²\n'+
  'Ap = '+H.fmt(Di)+'/2·('+H.fmt(ls)+' + '+H.fmt(u)+' + '+H.fmt(di)+'/2) + '+H.fmt(di)+'/2·('+H.fmt(lb)+' + '+H.fmt(t)+') = '+H.fmt(Ap)+' mm²\n'+
  H.fmt(g.p)+'/10·'+H.fmt(Ap)+' ≤ ('+H.fmt(F)+' − '+H.fmt(g.p)+'/20)·'+H.fmt(A0)+' + ('+H.fmt(Fb)+' − '+H.fmt(g.p)+'/20)·'+H.fmt(A1)+'\n'+
  H.fmt(demand)+' N ≤ '+H.fmt(capacity)+' N; ηFläche = '+H.fmt(areaUtil)+'; η = '+H.fmt(util)+'\n'+
  'pFläche = 10·(F·A0 + Fb·A1)/(Ap + As/2) = '+H.fmt(pArea)+' bar');
}
function draw(g,H,r,en){
 H=H||AD.h;const D=H.draw,title='T-Stück · Längsschnitt',W=420,V=320;
 const empty=()=>D.svg(W,V,D.text(210,140,'Maße eingeben'),{title});
 if(!g)return empty();
 const da=g[en?'Do':'Da'],s=g[en?'eord':'sA'];
 if(![da,s,g.dA,g.sS].every(x=>Number.isFinite(x)&&x>0)||!Number.isFinite(g.lb)||g.lb<0||s>=da/2||g.sS>=g.dA/2||g.dA>da)return empty();
 if(en&&(!Number.isFinite(g.ls)||g.ls<0))return empty();
 const val=id=>{const row=r&&r.rows&&r.rows.find(x=>x[1]===id);return row&&Number.isFinite(row[2])?row[2]:null;};
 const ls=val('ls'),lb=val('lb'),span=ls===null?da*.3:ls;
 // Drawing scale only; reinforcement lengths exclusively from calculation rows.
 const k=Math.min(D.fit(Math.max(da,g.dA+2*span),da+g.lb,300,178,0),78/da,95/Math.max(g.lb,1));
 const h=da*k,w=g.dA*k,projection=g.lb*k;
 if(!Number.isFinite(k)||w<12||h<14||projection>160)return empty();
 const x=210,y=158,xl=x-w/2,xr=x+w/2,top=y-projection,bottom=y+h;
 const t=Math.min(h*.24,Math.max(5,s*k)),u=Math.min(w*.3,Math.max(5,g.sS*k));
 const cls=r&&(r.ok===false||r.fail||r.util>1)?'o bad':'o';
 const runId=en?'eord':'sA',diamId=en?'Do':'Da';
 let b=D.text(16,20,'Schnitt A–A · Maße in mm','start','tx tb2');
 b+=D.tag(runId,D.rect(55,y,xl+u-55,t,cls,true)+D.rect(xr-u,y,365-xr+u,t,cls,true)+D.rect(55,bottom-t,310,t,cls,true));
 b+=D.tag('sS lb',D.rect(xl,top,u,projection,cls,2)+D.rect(xr-u,top,u,projection,cls,2));
 b+=D.tag(diamId,D.line(55,y+t,55,bottom-t,'t')+D.line(365,y+t,365,bottom-t,'t'));
 b+=D.centre(45,y+h/2,375,y+h/2)+D.centre(x,Math.max(28,top-10),x,bottom+12);
 b+=D.tag(diamId,D.dim(55,y,55,bottom,22,(en?'Do ':'Da ')+H.fmt(da,1)));
 b+=D.tag('dA',D.dim(xl,top,xr,top,-16,'dA '+H.fmt(g.dA,1)));
 b+=D.tag(runId,D.leader(100,y+t/2,78,126,'sA '+H.fmt(s,1)));
 b+=D.tag('sS',D.leader(xr-u/2,top+projection*.3,300,72,'sS '+H.fmt(g.sS,1)));
 b+=D.tag('lb',D.dim(xl,top,xl,y,25,'lvorh '+H.fmt(g.lb,1)));
 if(en)b+=D.tag('ls',D.line(xr,y-7,xr+Math.min(140,g.ls*k),y-7,'h')+D.leader(xr+Math.min(140,g.ls*k)*.7,y-7,340,y-40,'ls,vorh '+H.fmt(g.ls,1)));
 if(ls!==null&&lb!==null){
  const L=Math.min(365-xr,ls*k),B=Math.min(projection,lb*k);
  b+=D.rect(xr,y,L,t,'h')+D.rect(xr-u,y-B,u,B,'h');
  b+=D.dim(xr,bottom,xr+L,bottom,18,'l_s '+H.fmt(ls,1));
  b+=D.dim(xr,y-B,xr,y,-34,'l_b '+H.fmt(lb,1));
 }
 b+=D.text(16,264,'Gestrichelt: mittragende Bereiche','start','tx tb2');
 b+=D.text(16,278,'Wände ggf. überhöht; Radien schematisch','start','tx tb2');
 return D.svg(W,V,b,{title,sub:en?'EN 13480-3 · radialer Rohrabzweig':'AD 2000 B9 · radialer Rohrabzweig'});
}
for(const en of [false,true])AD.register({id:en?'tee_en':'tee_ad',name:'T-Stück',code:en?'EN 13480-3':'B9 Rohr',group:'T-Stücke',icon,fields:fields(en),
 help:en?'EN 13480-3:2017 §8.4.3/8.4.4: isolierter 90°-Rohrabzweig bis di/Di = 1, nichtaustenitisch und ohne Zeitstand. Gleicher Werkstoff beider Rohre. Konservativ eab/eas ≤ 1; c1 absolut, c2 Korrosion, relative Toleranz zusätzlich. Tragfähiger Anschluss und freie Verstärkungslängen erforderlich.':'AD 2000 B9 (02.2010): isolierter 90°-Rohrabzweig bis di/Di = 1, ohne Zeitstand oder erforderliche Nachweise nach S1/S2. Netto-Wandverhältnis höchstens 2; beide Rohre innerhalb der B1-Dünnwandgrenze. c1 und c2 gelten für beide Rohre. Ausgehalste T-Stücke mit Flächenfaktor q = 0,9, geschmiedete mit q = 1; beide mit v = 1.',
 tips:[
 'Die kleinsten garantierten Wanddicken am fertigen T-Stück eingeben; Übergänge können dünner als die angeschlossenen Rohre sein.',
 'Freie Abzweiglänge ab Grundrohr-Außenfläche messen; Flansche und andere Übergänge begrenzen die anrechenbare Verstärkung.',
 en?'Toleranz nicht doppelt abziehen: c1 in mm, zusätzliche relative Minustoleranz in Prozent; Rohrzeugniswerte für Rp und Rm verwenden.':'Die Grundrohrwanddicke beidseits des Ausschnitts über die im Ergebnis genannte ungestörte Breite einhalten, sonst fehlt Verstärkungsfläche. Äußere Lasten und Anschlussnaht gesondert nachweisen.'
 ],calc:(g,H)=>calc(g,H,en),draw:(g,H,r)=>draw(g,H,r,en)});
})(globalThis.AD);
