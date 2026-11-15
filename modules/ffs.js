/* Bestehende Ausrüstung: begrenzte Level-1-Bewertung, ausschließlich Innendruck.
 * Quellen (historische Ausgaben; keine Übertragung auf andere Ausgaben):
 * API 579-1/ASME FFS-1 (2016), Teile 2, 4, 5:
 * (Normtext, nicht verlinkt)
 * Errata 1 (2017), korrigierte Gl. (5.13):
 * (Normtext, nicht verlinkt)
 * ASME B31G-2012 §§1.2, 1.7, 2.2:
 * (Normtext, nicht verlinkt)
 * AD 2000 B1 (10/2000), §5, Gl. (2), Zylinderschale, Außendurchmesserform:
 * (Normtext, nicht verlinkt)
 * Geltungsbereich B1 §1, Gl. (1):
 * (Normtext, nicht verlinkt)
 * EN 13480-3:2017 §6.2.3.1, Gl. (6.2.3-1)/(6.2.3-2):
 * (Normtext, nicht verlinkt)
 * B1-Primärscan (10/2000), inklusive §1/Gl. (1), §5/Gl. (2):
 * (Normtext, nicht verlinkt)
 * Die AD-Druckbasis ist eine ausdrücklich gewählte Kombination mit API-Screening.
 */
(function(AD){
'use strict';
const num=(id,label,sym,unit,def,min='pos',extra={})=>({id,label,sym,unit,def,min,...extra});
const sel=(id,label,def,options)=>({id,label,type:'select',def,options});
const icon='<path d="M4 10h10l5 7h9l5-7h7M4 27h36"/><path d="M20 3v9M17 8l3 4 3-4"/>';
const common=[num('t_nom','Nennwanddicke','t_nom','mm',10),num('FCA','Zukünftiger Korrosionszuschlag','FCA','mm',0.5,'zero')];
const scope='Bewertet werden duktile Rohre und Zylinderschalen unter Innendruck ohne wesentliche Zusatzlasten, Kriechen, Ermüdung oder Risse. Für Rohrbögen verwendet das Modul zusätzlich einen Bogenfaktor. Die Eignung des Bauteils für das Verfahren und die erforderlichen Prüfdaten müssen nach API 579 Teil 2 gesondert nachgewiesen sein.';
function invalid(m,g){
 for(const f of m.fields){
  if(f.when&&!Object.entries(f.when).every(([k,v])=>(Array.isArray(v)?v:[v]).includes(g[k])))continue;
  if(f.type==='select'){if(!f.options.some(o=>o[0]===g[f.id]))return true;}
  else if(f.type!=='heading'&&(!Number.isFinite(g[f.id])||(f.min==='zero'?g[f.id]<0:f.min==='any'?false:g[f.id]<=0)))return true;
 }
 return !Number.isFinite(g.p)||g.p<=0;
}
function empty(){return {headline:{value:NaN,unit:'–',label:'Eingaben prüfen'},util:Infinity,pmax:NaN,test:null,rows:[],notes:[['e','Ungültige oder fehlende Eingaben.']],fail:true,formula:'Keine Bewertung möglich.'};}
function stressOK(g){return [g.K,g.S,g.v].every(x=>Number.isFinite(x)&&x>0)&&g.v<=1;}
// AD 2000 B1 §5, Gl. (2): t_min = Da·p/(20·K/S·v+p), ohne bereits separat berücksichtigte Zuschläge.
const required=(g,Da)=>Da*g.p/(20*g.K/g.S*g.v+g.p);
// AD 2000 B1 §5, Gl. (2), algebraische Umkehrung; bar, N/mm², mm.
const pressure=(g,Da,t)=>t>0&&t<Da?20*g.K/g.S*g.v*t/(Da-t):0;
// B1 §1 Gl. (1), hier bewusst enger auf Da/Di ≤ 1,2 begrenzt (keine Rohr-Ausnahme).
const thin=(Da,t)=>Da>2*t&&Da/(Da-2*t)<=1.2;
const bad=r=>!!r&&(r.ok===false||r.fail||r.util>1);
const title={ffs4:'Allgemeiner Abtrag',ffs5:'Örtlicher Abtrag',b31g:'Rohrkorrosion B31G'};
// Bauteilart: gerades Rohr/Zylinder oder Rohrbogen. Bogenfaktor nach EN 13480-3 §6.2.3 (Lorenz):
// Innenbogen k = (R/Do − 0,25)/(R/Do − 0,5), Außenbogen k = (R/Do + 0,25)/(R/Do + 0,5), Flanke k = 1.
const geomFields=()=>[sel('geom','Bauteil','pipe',[['pipe','Gerades Rohr / Zylinder'],['bend','Rohrbogen']]),
 num('Rb','Biegeradius (Rohrachse)','R','mm',1500,'pos',{when:{geom:'bend'}}),
 {...sel('bpos','Lage im Bogen','intr',[['intr','Innenbogen'],['extr','Außenbogen'],['flank','Flanke']]),when:{geom:'bend'}}];
function bend(g,Do){ if(g.geom!=='bend') return {k:1,ok:true,ratio:NaN};
  const x=g.Rb/Do, kL=g.bpos==='intr'?(x-0.25)/(x-0.5):g.bpos==='extr'?(x+0.25)/(x+0.5):1;
  // Review-Fix: k nie kleiner als 1 – der Bogen wird nie günstiger als das gerade Rohr bewertet (Außenbogen konservativ k = 1).
  return {k:Math.max(1,kL),kL,ok:Number.isFinite(x)&&x>=1,ratio:x}; }
function bendRows(g,b,rows,notes,check){ if(g.geom!=='bend') return;
  check(b.ok,'Biegeradius zu klein: R/Da muss mindestens 1 sein.');
  notes.push(['w','Rohrbogen: Die Unrundheit muss innerhalb der Toleranzen nach EN 13480-4 liegen.']);
  if(b.kL<1) notes.push(['','Außenbogen: rechnerischer Bogenfaktor '+AD.h.fmt(b.kL,2)+' < 1; konservativ mit k = 1 gerechnet.']);
  rows.push(['Biegeradius / Außendurchmesser','R/Da',b.ratio,'–'],['Bogenfaktor ('+(g.bpos==='intr'?'Innenbogen':g.bpos==='extr'?'Außenbogen':'Flanke')+')','k',b.k,'–']); }
function drawing(id,g,H,r){
 const D=H.draw,fmt=x=>H.fmt(x,1),V=310;
 const keys=id==='ffs4'?['Da','t_nom','t_am','t_mm','FCA','t_lim']:id==='ffs5'?['D','t_nom','t_mm','s','c','FCA','LOSS','L_msd']:['D','t_nom','L','d'];
 if(keys.some(k=>!Number.isFinite(g[k])||g[k]<0||g[k]>1e100)||g.t_nom<=0||(id!=='b31g'&&(g.t_mm<=0||g.t_mm>g.t_nom||g.FCA>=g.t_mm))||(id==='b31g'&&(g.d>=g.t_nom||g.D<=2*g.t_nom||g.L<=0))||(id==='ffs5'&&(g.D<=0||g.s<=0||g.c<=0||g.LOSS+g.t_mm>g.t_nom))||(id==='ffs4'&&(g.Da<=2*g.t_nom||g.t_am<g.t_mm||g.t_am>g.t_nom)))
  return D.svg(420,V,D.text(210,125,'Maße eingeben'),{title:title[id],sub:'Maße in mm'});
 const cls=bad(r)?'o bad':'o';let b=D.text(14,20,id==='ffs5'?'Abwicklung und Schnitt A–A':'Längsschnitt A–A','start','tx tb2');
 if(id==='ffs5'){
  const k=D.fit(g.s,g.c,260,100,10),w=Math.max(24,g.s*k),h=Math.max(16,g.c*k),x=210-w/2,y=74-h/2;
  b+=D.rect(45,35,330,82,'o')+D.tag('s c flaw',D.rect(x,y,w,h,cls))+D.centre(30,74,390,74);
  b+=D.tag('s',D.dim(x,y,x+w,y,-14,'s '+fmt(g.s)))+D.tag('c',D.dim(x+w,y,x+w,y+h,-22,'c '+fmt(g.c)));
  b+=D.tag('D',D.text(17,136,'Di '+fmt(g.D)+' · Abwicklung schematisch','start','tx tb2'));
  const k2=D.fit(g.s,g.t_nom,260,50,5),tn=Math.min(43,Math.max(25,g.t_nom*k2)),tm=Math.max(6,tn*g.t_mm/g.t_nom),f=Math.max(3,tn*g.FCA/g.t_nom),y0=174,yb=y0+tn;
  // outer surface on top, inner surface (medium) below; Y(d) = depth d from the surface that carries the loss
  const inn=g.side!=='outer',Y=d=>inn?yb-d:y0+d;
  b+=D.poly([[55,Y(0)],[130,Y(0)],[130,Y(tn-tm)],[285,Y(tn-tm)],[285,Y(0)],[365,Y(0)],[365,Y(tn)],[55,Y(tn)]],cls,true);
  b+=D.tag('FCA',D.line(130,Y(tn-tm+f),285,Y(tn-tm+f),'h'))+D.centre(35,yb+18,380,yb+18);
  b+=D.tag('side',D.text(130,y0-6,inn?'Außenseite':'Außenseite (Abtrag)','start','tx tb2')+D.text(130,yb+11,inn?'Innenseite / Medium (Abtrag)':'Innenseite / Medium','start','tx tb2'));
  b+=D.tag('t_nom',D.dim(55,y0,55,yb,23,'t_nom '+fmt(g.t_nom)));
  // LOSS: current surrounding surface relative to the original surface (review fix)
  const yl=Y(Math.max(0,tn*g.LOSS/g.t_nom));
  b+=D.tag('LOSS',(g.LOSS>0?D.line(55,yl,130,yl,'h')+D.line(285,yl,365,yl,'h')+D.dim(365,Y(0),365,yl,-14,''):'')+D.text(372,y0-6,'LOSS '+fmt(g.LOSS),'end','tx dt'));
  // L_msd: distance from LTA edge to the next structural discontinuity (schematic)
  b+=D.tag('L_msd',D.line(400,35,400,117,'o')+D.dim(x+w,117,400,117,14,'L_msd '+fmt(g.L_msd)));
  b+=D.tag('t_mm',D.dim(285,Math.min(Y(tn-tm),Y(tn)),285,Math.max(Y(tn-tm),Y(tn)),-26,'t_mm '+fmt(g.t_mm)));
  b+=D.tag('FCA',D.leader(192,Y(tn-tm+f),170,inn?yb+34:155,'FCA '+fmt(g.FCA)));
 }else{
  const measured=id==='ffs4'?g.t_mm:g.t_nom-g.d;
  const span=id==='ffs4'?g.Da:g.L,k=D.fit(span,g.t_nom,330,90,10),w=Math.min(310,Math.max(120,span*k)),x=210-w/2,y=80,tn=72,tm=Math.max(6,tn*measured/g.t_nom),yb=y+tn;
  const xa=x+w*.3,xb=x+w*.7;
  // outer surface on top, inner surface (medium) below; Y(d) = depth d from the surface that carries the loss
  const inn=g.side!=='outer',Y=d=>inn?yb-d:y+d,lo=(a,c)=>Math.min(Y(a),Y(c)),hi=(a,c)=>Math.max(Y(a),Y(c));
  b+=D.poly([[x,Y(0)],[xa,Y(0)],[xa,Y(tn-tm)],[xb,Y(tn-tm)],[xb,Y(0)],[x+w,Y(0)],[x+w,Y(tn)],[x,Y(tn)]],cls,true);
  b+=id==='ffs4'?D.tag('t_mm',D.line(xa,Y(tn-tm),xb,Y(tn-tm),cls)):D.tag('d L flaw',D.pline([[xa,Y(0)],[xa,Y(tn-tm)],[xb,Y(tn-tm)],[xb,Y(0)]],cls));
  b+=D.line(xa,Y(0),xb,Y(0),'h')+D.centre(x-12,yb+21,x+w+12,yb+21);
  b+=D.tag('side',D.text(x+w,y-6,inn?'Außenseite':'Außenseite (Abtrag)','end','tx tb2')+D.text(x+w,yb+13,inn?'Innenseite / Medium (Abtrag)':'Innenseite / Medium','end','tx tb2'));
  b+=D.tag('t_nom',D.dim(x,y,x,yb,24,'t_nom '+fmt(g.t_nom)));
  b+=id==='ffs4'?D.tag('t_mm',D.dim(xb,lo(tn-tm,tn),xb,hi(tn-tm,tn),-42,'t_mm '+fmt(measured))):D.dim(xb,lo(tn-tm,tn),xb,hi(tn-tm,tn),-42,'Rest '+fmt(measured));
  if(id==='b31g'){
   b+=D.tag('L',D.dim(xa,Y(0),xb,Y(0),inn?38:-30,'L '+fmt(g.L)));
   b+=D.tag('d',D.dim(xa,lo(0,tn-tm),xa,hi(0,tn-tm),30,'d '+fmt(g.d)));
   b+=D.tag('D',D.text(15,221,'Da '+fmt(g.D)+' mm','start','tx tb2'));
  }else{
   const ya=Y(tn-tn*g.t_am/g.t_nom),yf=Y(tn-tm+Math.max(3,tn*g.FCA/g.t_nom));
   b+=D.tag('t_am',D.line(x,ya,x+w,ya,'t'))+D.tag('FCA',D.line(xa,yf,xb,yf,'h'));
   b+=D.tag('t_am',D.leader(x+w-12,ya,290,44,'t_am '+fmt(g.t_am),'end'));
   b+=D.tag('FCA',D.leader(210,yf,210,201,'FCA '+fmt(g.FCA)));
   b+=D.tag('Da',D.text(15,225,'Profil schematisch · Da '+fmt(g.Da)+' mm','start','tx tb2'));
   // t_min / effective t_lim reference levels from the retained outer surface (review fix)
   const tr=r&&Number.isFinite(r.headline&&r.headline.value)?r.headline.value:(g.basis==='direct'?g.t_min:required(g,g.Da)), tl=Math.max(0.2*g.t_nom,2.5,g.t_lim);
   if(Number.isFinite(tr)&&tr>0&&tr<g.t_nom) b+=(g.basis==='direct'?q=>D.tag('t_min',q):q=>q)(D.line(x,Y(tn-tn*tr/g.t_nom),x+w,Y(tn-tn*tr/g.t_nom),'h')+D.text(15,240,'t_min '+fmt(tr),'start','tx dt'));
   if(tl<g.t_nom) b+=(g.t_lim>=Math.max(0.2*g.t_nom,2.5)?q=>D.tag('t_lim',q):q=>q)(D.line(x,Y(tn-tn*tl/g.t_nom),x+w,Y(tn-tn*tl/g.t_nom),'h')+D.text(405,240,'Mindestgrenze '+fmt(tl),'end','tx dt'));
  }
 }
 b+=D.text(14,258,'Wanddicken überhöht; Längen schematisch','start','tx tb2');
 return D.svg(420,V,b,{title:title[id],sub:'Maße in mm · Innendruck'});
}
AD.register({id:'ffs4',name:'Allgemeiner Abtrag',code:'API 579 Teil 4',group:'Bewertung',icon,
 fields:[sel('basis','Erforderliche Wanddicke','b1',[['b1','AD 2000 B1'],['direct','Direkte Eingabe']]),num('Da','Außendurchmesser','Da','mm',1000),...geomFields(),sel('side','Lage des Abtrags','inner',[['inner','Innen (Mediumseite)'],['outer','Außen']]),...common,
 num('t_min','Erforderliche Wanddicke','t_min','mm',5,'pos',{when:{basis:'direct'}}),
 num('t_am','Mittlere gemessene Wanddicke','t_am','mm',8),num('t_mm','Kleinste gemessene Wanddicke','t_mm','mm',7),
 sel('readings','Messdaten','ptr',[['ptr','Punktmessungen'],['profile','Profil: konservativ mit Minimum']]),
 num('COV','Variationskoeffizient der Messreihe','COV','–',0.05,'zero',{when:{readings:'ptr'}}),num('N','Anzahl der Punktmessungen','N','–',15,'pos',{when:{readings:'ptr'}}),
 num('t_lim','Zusätzliche Mindestdicke','t_lim','mm',2.5),num('rate','Korrosionsrate','CR','mm/a',0.1,'zero')],
 help:scope+' Im Profilmodus wird der kleinste Messwert bewertet; der Mittelwert wird weiterhin auf Plausibilität geprüft.',
 draw(g,H,r){return drawing('ffs4',g,H,r);},
 calc(g,H=AD.h){
  if(invalid(this,g)||(g.basis==='b1'&&!stressOK(g)))return empty();
  const notes=[['w',scope]],rows=[];let fail=false;
  const check=(ok,msg)=>{if(!ok){fail=true;notes.push(['e',msg]);}};
  // Table 4.4 note 3 permits minimum thickness in place of an average.
  const assessed=g.readings==='profile'?g.t_mm:g.t_am,avg=assessed-g.FCA,mn=g.t_mm-g.FCA;
  // Lage des Abtrags: außen verkleinert den Außendurchmesser um 2·(t_nom − t_a + FCA); innen bleibt Da (B1-Außendurchmesserform).
  const DaEff=g.side==='outer'?g.Da-2*(g.t_nom-assessed+g.FCA):g.Da;
  const bd=bend(g,g.Da);
  // Rohrbogen: erforderliche Dicke = k · t_min des geraden Rohres; zulässiger Druck mit t/k (EN 13480-3 §6.2.3).
  const tmin=(g.basis==='direct'?g.t_min:required(g,DaEff))*(g.basis==='direct'?1:bd.k);
  // API 579 (2016) Table 4.4: vessel floor; additional user floor can only tighten it.
  const lim=Math.max(0.2*g.t_nom,2.5,g.t_lim),floor=Math.max(0.5*tmin,lim);
  let util=Math.max(tmin/avg,floor/mn);
  check([avg,mn,DaEff,bd.k,tmin,lim,floor,util].every(Number.isFinite),'Numerischer Wertebereich überschritten; keine verlässliche Bewertung.');
  check(g.t_mm<=g.t_am&&g.t_am<=g.t_nom,'Messwerte müssen t_mm ≤ t_am ≤ t_nom erfüllen.');
  check(avg>0&&mn>0,'FCA verbraucht die verfügbare Wanddicke.');
  // Review-Fix: Geometrie in beiden Modi prüfen (Innendurchmesser > 0).
  check(g.Da>2*g.t_nom,'Außendurchmesser muss größer als die doppelte Nennwanddicke sein.');
  if(g.basis==='b1')check(thin(g.Da,g.t_nom),'Außerhalb der hier verwendeten B1-Grenze Da/Di ≤ 1,2.');
  // API 579 §4.4.2.1(b), Table 4.3 note 1 / §4.3.3.2: PTR COV ≤0.10 and N≥15.
  if(g.readings==='ptr'){
   check(g.COV<=0.1,'COV > 0,10: Profilbewertung erforderlich.');
   check(Number.isSafeInteger(g.N)&&g.N>=15,'Mindestens 15 exakt darstellbare Punktmessungen erforderlich.');
   // Feasible sample-COV range for a series with this mean and minimum:
   // one minimum / equal other values gives the lower bound; N−1 minima
   // / one larger reading gives the upper bound.
   const covMax=(1-g.t_mm/g.t_am)*Math.sqrt(g.N),covMin=covMax/(g.N-1);
   check(g.COV>=covMin&&g.COV<=covMax,'Widersprüchliche Messkennwerte: COV passt nicht zu t_mm, t_am und N.');
   notes.push(['w','COV und t_am aus der vollständigen Messreihe bestimmen; der Rechner erhält nur deren Kennwerte.']);
  }else notes.push(['','Profilmodus: t_mm ersetzt den Mittelwert konservativ nach Tabelle 4.4, Anmerkung 3.']);
  // Separate inspection/applicability gates from pressure demand, so pmax does not
  // disappear on overload. B1 inversion is the authoritative boundary comparison.
  check(mn>=lim,'Kleinste wirksame Wanddicke unterschreitet die druckunabhängige Mindestgrenze.');
  // API 579 §4.5.1.1, Gl. (4.7): physical remaining life without subtracting FCA twice.
  const life=g.rate>0?Math.max(0,(assessed-tmin)/g.rate):NaN;
  // Same linear loss model, projected to BOTH Table 4.4 gates; FCA reserves future loss.
  const reserve=g.rate>0?Math.max(0,Math.min(avg-tmin,mn-floor)/g.rate):NaN;
  if(g.rate>0)check([life,reserve].every(Number.isFinite),'Restlebensdauer numerisch nicht darstellbar.');
  if(g.rate===0)notes.push(['w','Korrosionsrate null: keine endliche Restlebensdauer ableitbar.']);
  let pm=NaN;
  // Inverse B1 combined with Table 4.4: t_min ≤ avg and t_min ≤ 2·mn.
  bendRows(g,bd,rows,notes,check);
  if(g.basis==='b1'){
   const candidate=pressure(g,DaEff,Math.min(avg,2*mn)/bd.k);
   check(Number.isFinite(candidate)&&candidate>0,'Keine endliche positive Drucktragfähigkeit.');
   pm=fail?0:candidate;
   if(pm>0){
    const within=g.p<=pm;
    // Only reconcile floating-point rounding with the exact pressure comparison;
    // never admit a pressure above the returned capacity.
    util=within?Math.min(util,1):Math.max(util,1+Number.EPSILON);
    check(within,'Betriebsdruck überschreitet die Drucktragfähigkeit nach beiden Dickenkriterien.');
   }
  }else{
   check(avg>=tmin,'Wirksamer Mittelwert unterschreitet die erforderliche Mindestwanddicke.');
   check(mn>=floor,'Kleinste wirksame Wanddicke unterschreitet die Mindestgrenze.');
  }
  if(g.geom==='bend'&&g.basis==='direct') notes.push(['w','Rohrbogen mit direkt eingegebener Mindestdicke: t_min muss bereits für die gewählte Bogenlage gelten.']);
  notes.push(['',g.side==='outer'?(g.basis==='direct'?'Abtrag außen dokumentiert. Der Nachweis verwendet die direkt eingegebene Mindestwanddicke; der korrigierte Außendurchmesser beeinflusst ihn nicht.':`Abtrag außen: gerechnet mit verkleinertem Außendurchmesser ${H.fmt(DaEff)} mm.`):'Abtrag innen: Außendurchmesser unverändert.']);
  rows.push(['Lage des Abtrags','',g.side==='outer'?'außen':'innen',''],['Wirksamer Außendurchmesser','Da,eff',DaEff,'mm']);
  rows.push(['Erforderliche Dicke','t_min',tmin,'mm'],['Mindestdicke','t_lim',lim,'mm'],['Lokale Mindestgrenze','max(0,5 t_min; t_lim)',floor,'mm'],['Bewerteter Mittelwert','t_a',assessed,'mm'],['Wirksamer Mittelwert','t_a−FCA',avg,'mm'],['Wirksames Minimum','t_mm−FCA',mn,'mm'],['Restlebensdauer bis t_min','RL',g.rate>0?life:'nicht bestimmbar','a'],['Zeitreserve nach beiden Kriterien und FCA','RL_FCA',g.rate>0?reserve:'nicht bestimmbar','a']);
  return {headline:{value:tmin,unit:'mm',label:'mm erforderlich',of:'Mittelwert wirksam '+H.fmt(avg)+' mm'},util:avg>0&&mn>0?util:Infinity,pmax:pm,test:null,rows,notes,fail,
   formula:'t_min '+(g.basis==='b1'?(bd.k!==1?'(B1, Bogen) = k·Da,eff·p/(20·K/S·v+p)':'(B1) = Da,eff·p/(20·K/S·v+p)'):'(Eingabe)')+' = '+H.fmt(tmin)+' mm'+(g.basis==='b1'?'\nDa,eff = '+H.fmt(DaEff)+' mm; k = '+H.fmt(bd.k,3):'')+'\nt_a−FCA = '+H.fmt(avg)+(avg>=tmin||g.basis==='b1'&&pm>0&&g.p<=pm?' ≥ ':' < ')+H.fmt(tmin)+' mm\nt_mm−FCA = '+H.fmt(mn)+(mn>=floor||g.basis==='b1'&&pm>0&&g.p<=pm?' ≥ ':' < ')+'max(0,5·t_min; t_lim) = '+H.fmt(floor)+' mm\nRestlebensdauer = (t_a−t_min)/CR = '+(g.rate>0?H.fmt(life)+' a':'nicht bestimmbar')};
 }
});
// API 579 (2016), Table 5.2, cylinder column; note 2 permits linear interpolation.
// Note 2 caps lambda at 20; use table rather than OCR-ambiguous polynomial signs.
const folias=[1.001,1.056,1.199,1.394,1.618,1.857,2.103,2.351,2.600,2.847,3.091,3.331,3.568,3.801,4.032,4.262,4.492,4.727,4.970,5.225,5.497,5.791,6.112,6.468,6.864,7.307,7.804,8.362,8.989,9.693,10.481,11.361,12.340,13.423,14.616,15.921,17.338,18.864,20.494,22.219,24.027].map((m,i)=>[i/2,m]);
AD.register({id:'ffs5',name:'Örtlicher Abtrag (LTA)',code:'API 579 Teil 5',group:'Bewertung',icon,
 fields:[num('D','Ursprünglicher Innendurchmesser','Di','mm',1000),...geomFields(),sel('side','Lage des Abtrags','inner',[['inner','Innen (Mediumseite)'],['outer','Außen']]),...common,num('LOSS','Allgemeiner bisheriger Abtrag','LOSS','mm',0,'zero'),num('t_mm','Kleinste Wanddicke in der Abtragsstelle','t_mm','mm',7.5),num('s','Länge der Abtragsstelle','s','mm',100),num('c','Breite der Abtragsstelle','c','mm',80),num('L_msd','Abstand zur Strukturstörung','L_msd','mm',500),num('Ec','Faktor Umfangsnaht','E_C','–',1),num('RSFa','Zulässiger Restfestigkeitsfaktor','RSFa','–',0.9),sel('flaw','Schadensform','lta',[['lta','Flächiger Abtrag'],['groove','Nut (längliche Rinne)'],['notch','Scharfe Kerbe'],['crack','Riss oder Rissverdacht']])],
 help:scope+' Als Längsnahtfaktor E_L wird der gemeinsam eingestellte Schweißnahtfaktor v verwendet. Di als ursprünglichen Innendurchmesser eingeben (die Korrektur nach Lage des Abtrags erfolgt automatisch); s und c einschließlich erwartetem Wachstum. FCA gilt innerhalb und außerhalb der Abtragsstelle gleich.',
 draw(g,H,r){return drawing('ffs5',g,H,r);},
 calc(g,H=AD.h){
  if(invalid(this,g)||!stressOK(g))return empty();
  const notes=[['w',scope]],rows=[];let fail=false;
  const check=(ok,msg)=>{if(!ok){fail=true;notes.push(['e',msg]);}};
  // API 579 §5.4.2.2(b–e), Gl. (5.3), (5.5), (5.6).
  // Lage des Abtrags (API 579 Annex 2C.2.9): innen wächst der Innendurchmesser um 2·(LOSS + FCA), außen bleibt er.
  const D0=g.D; g={...g,D:g.side==='outer'?D0:D0+2*(g.LOSS+g.FCA)};
  notes.push(['',g.side==='outer'?`Abtrag außen: Innendurchmesser unverändert ${H.fmt(g.D)} mm.`:`Abtrag innen: gerechnet mit Innendurchmesser ${H.fmt(g.D)} mm (ursprünglich ${H.fmt(D0)} mm + 2 × (bisheriger Abtrag + FCA)).`]);
  rows.push(['Lage des Abtrags','',g.side==='outer'?'außen':'innen',''],['Innendurchmesser im Bewertungszustand','D',g.D,'mm']);
  const tc=g.t_nom-g.LOSS-g.FCA,tm=g.t_mm-g.FCA,Rt=tm/tc,lambda=1.285*g.s/Math.sqrt(g.D*tc);
  const Mt=H.interp(folias,Math.min(lambda,20));
  // API 579 §5.4.2.2(h), Gl. (5.12); Table 5.2.
  const RSF=Rt/(1-(1-Rt)/Mt);
  // B1 §5 inverse using fixed outside diameter of FUTURE uniform shell: Da=D+2tc.
  const bd=bend(g,D0+2*g.t_nom); bendRows(g,bd,rows,notes,check);
  // API 579 includes elbows, but that does not validate this hybrid pressure basis.
  // Retain the candidate arithmetic for diagnostics and block an acceptance below.
  if(g.geom==='bend'){
   notes.push(['w','UNVERIFIED: Kombination aus API 579 Teil 5, B1-Druckbasis und EN-Bogenfaktor ist nicht verifiziert.']);
   check(false,'Rohrbogen: Für diese Kombination ist kein belastbarer Level-1-Nachweis implementiert; gesonderte Bewertung erforderlich.');
  }
  const Da=g.D+2*tc,MAWPc=pressure(g,Da,tc/bd.k);
  // Review-Fix: API 579 Annex 2C Gl. (2C.22) / UG-27(c)(2): Längsrichtung mit E_C, t_sl = 0: p_L = 2·(K/S)·E_C·tc/(R − 0,4·tc), R = D/2 [N/mm²] → ×10 bar.
  const MAWPl=10*2*(g.K/g.S)*g.Ec*tc/(g.D/2-0.4*tc), MAWP=Math.min(MAWPc,MAWPl);
  if(MAWPl<MAWPc) notes.push(['',`Längsrichtung maßgebend (E_C = ${H.fmt(g.Ec,2)}): MAWP_L = ${H.fmt(MAWPl,2)} bar < MAWP_C = ${H.fmt(MAWPc,2)} bar.`]);
  // API 579 §2.4.2.2: rerating by RSF/RSFa, capped at unflawed MAWP.
  const candidate=MAWP*Math.min(1,RSF/g.RSFa);
  // API 579 Gl. (5.10); corrected (5.13), Errata 1 (2017): c ≤ 2s EC/EL.
  const distance=1.8*Math.sqrt(g.D*tc),cmax=2*g.s*g.Ec/g.v;
  check(tc>0&&tm>0&&g.t_mm<=g.t_nom-g.LOSS,'Ungültige Restwanddicke oder t_mm größer als die verbleibende Wanddicke außerhalb der Abtragsstelle.');
  check(g.Ec<=1&&g.RSFa<=1,'Nahtfaktoren und RSFa dürfen 1 nicht überschreiten.');
  check(thin(D0+2*g.t_nom,g.t_nom),'Außerhalb der hier verwendeten B1-Grenze Da/Di ≤ 1,2.');
  // API 579 Gl. (5.7), (5.8), (5.10).
  check(Rt>=0.2&&Rt<=1,'Rt muss zwischen 0,20 und 1 liegen.');
  check(tm>=2.5,'t_mm−FCA < 2,5 mm: Level 1 nicht erfüllt.');
  check(g.L_msd>=distance,'Abstand zur Strukturstörung kleiner als 1,8·√(D·t_c).');
  check(g.c<=Math.PI*g.D,'Umfangsausdehnung überschreitet den Rohrumfang.');
  check(g.c<=cmax,'Umfangskriterium c ≤ 2s·E_C/E_L nicht erfüllt; Schritte 9.2–9.4 / höhere Bewertungsstufe erforderlich.');
  // §5.4.2.2(f), Gl. (5.11): no groove-radius inputs => exclude ALL grooves.
  ({groove:()=>check(false,'Nut: nach API 579 Teil 5 nur mit ausreichend großem Nutradius bewertbar. Diese Radiusprüfung ist hier nicht umgesetzt.'),
    notch:()=>check(false,'Scharfe Kerbe: nicht als Korrosionsabtrag bewertbar. Als rissartigen Fehler nach API 579 Teil 9 bewerten.'),
    crack:()=>check(false,'Riss oder Rissverdacht: nach API 579 Teil 9 (rissartige Fehler) bewerten.')}[g.flaw]||(()=>{}))();
  check([g.D,tc,tm,Rt,lambda,Mt,RSF,MAWPc,MAWPl,distance,cmax].every(Number.isFinite),'Numerischer Wertebereich überschritten; keine verlässliche Bewertung.');
  check(Number.isFinite(candidate)&&candidate>0,'Keine endliche positive Drucktragfähigkeit.');
  const pm=fail?0:candidate,util=pm>0?g.p/pm:Infinity;
  if(util>1){fail=true;notes.push(['e','Betriebsdruck überschreitet MAWPr oder Anwendungsgrenze verletzt.']);}
  notes.push(['w','B1-Druckbasis mit API-579-Screening; keine pauschale Gleichwertigkeit der Regelwerke. Risse und scharfe Nuten separat bewerten.']);
  if(lambda>20)notes.push(['','λ > 20: Folias-Faktor mit λ = 20 gemäß Tabelle 5.2, Anmerkung 2.']);
  rows.push(['Referenzwanddicke im Bewertungszustand','t_c',tc,'mm'],['Wirksames Minimum','t_mm−FCA',tm,'mm'],['Restdickenverhältnis','Rt',Rt,'–'],['Längenparameter','λ',lambda,'–'],['Folias-Faktor','Mt',Mt,'–'],['Restfestigkeitsfaktor','RSF',RSF,'–'],['Drucktragfähigkeit außerhalb der Abtragsstelle','MAWP',MAWP,'bar'],['Rechnerischer reduzierter Druck','MAWPr,rech',candidate,'bar'],['Erforderlicher Abstand','L_msd,min',distance,'mm'],['Zulässige Umfangsausdehnung','c_max',cmax,'mm'],['Bewertbarer reduzierter Druck','MAWPr',pm,'bar']);
  return {headline:{value:pm,text:'RSF '+H.fmt(RSF,3)+' · '+H.fmt(pm)+' bar',unit:'bar',label:'RSF und MAWPr'},util,pmax:pm,test:null,rows,notes,fail,
   formula:'t_c = t_nom−LOSS−FCA = '+H.fmt(tc)+' mm\nRt = (t_mm−FCA)/t_c = '+H.fmt(Rt,3)+'\nλ = 1,285·s/√(D·t_c) = '+H.fmt(lambda,3)+'; Mt = '+H.fmt(Mt,3)+'\nRSF = Rt/[1−(1−Rt)/Mt] = '+H.fmt(RSF,3)+'\nMAWPr,rech = MAWP·min(1; RSF/RSFa) = '+H.fmt(candidate)+' bar\nUmfangsgrenze 2s·E_C/E_L = '+H.fmt(cmax)+' mm'};
 }
});
AD.register({id:'b31g',name:'Korrosion Rohrleitung',code:'ASME B31G',group:'Bewertung',icon,
 fields:[sel('method','Verfahren','modified',[['original','Original B31G'],['modified','Modified B31G']]),num('D','Außendurchmesser','Da','mm',508),...geomFields(),sel('side','Lage des Abtrags','inner',[['inner','Innen (Mediumseite)'],['outer','Außen']]),num('t_nom','Ursprüngliche Nennwanddicke','t','mm',10),num('d','Maximale Fehlertiefe','d','mm',4,'zero'),num('L','Längsausdehnung','L','mm',200),num('F','Druckfaktor','F','–',0.72),sel('yield','Streckgrenze','shared',[['shared','Werkstoffwert bei 20 °C'],['override','Mindeststreckgrenze eingeben']]),num('SMYS','Mindeststreckgrenze','SMYS','N/mm²',359,'pos',{when:{yield:'override'}}),num('SMTS','Mindestzugfestigkeit','SMTS','N/mm²',450),sel('flaw','Schadensform','blunt',[['blunt','Flächiger Korrosionsabtrag'],['crack','Riss'],['notch','Kerbe oder Riefe'],['dent','Beule'],['seam','Selektive Nahtkorrosion']])],
 help:'Nur duktile Kohlenstoffstahlrohre, T < 120 °C, ohne Zusatzlasten. SMTS und SMYS aus der Rohrnorm prüfen. F ist eine Eingabe und keine automatische Freigabe des ursprünglichen MAOP.',
 draw(g,H,r){return drawing('b31g',g,H,r);},
 calc(g,H=AD.h){
  if(invalid(this,g)||!Number.isFinite(g.T)||(g.yield==='shared'&&!(Number.isFinite(g.K20)&&g.K20>0)))return empty();
  const notes=[['',(g.side==='outer'?'Abtrag außen':'Abtrag innen')+': B31G rechnet innen und außen mit derselben Gleichung; die Lage beeinflusst Prüfbarkeit und Messung, nicht das Ergebnis.']],rows=[];let fail=false;
  const check=(ok,msg)=>{if(!ok){fail=true;notes.push(['e',msg]);}};
  const Y=g.yield==='override'?g.SMYS:g.K20;
  // ASME B31G-2012 §1.7(b)(1),(2): flow stresses, each capped by SMTS.
  const flowO=Math.min(1.1*Y,g.SMTS),flowM=Math.min(Y+69,g.SMTS);
  // B31G-2012 §2.2(a),(b): z, original and modified Folias factors.
  const z=g.L*g.L/(g.D*g.t_nom),q=g.d/g.t_nom,Mo=Math.sqrt(1+0.8*z),Mm=z<=50?Math.sqrt(1+0.6275*z-0.003375*z*z):0.032*z+3.3;
  // §2.2(a): ORIGINAL switches to rectangular long-defect expression for z>20.
  const so=flowO*(z<=20?(1-2*q/3)/(1-2*q/(3*Mo)):1-q);
  // §2.2(b): modified 0.85dL area approximation, BOTH length branches.
  const sm=flowM*(1-0.85*q)/(1-0.85*q/Mm);
  // §1.5: PF=2 SF t/D (MPa); ×10 gives bar. §2.2 steps 6–8: PS=PF/SF_safety.
  const bd=bend(g,g.D); bendRows(g,bd,rows,notes,check);
  // UNVERIFIED Erweiterung: B31G ist für gerade Rohre formuliert; Rohrbogen konservativ mit Bogenfaktor (Pf/k).
  if(g.geom==='bend') notes.push(['w','Rohrbogen: B31G-2012 umfasst auch Feld-, Induktions- und Formstückbögen. Die zusätzliche Abminderung mit dem Bogenfaktor nach EN 13480-3 ist eine konservative, nicht verifizierte Ergänzung.']);
  const po=20*so*g.t_nom/g.D/bd.k,pm=20*sm*g.t_nom/g.D/bd.k,selected=g.method==='original'?po:pm,candidate=selected*g.F;
  // §1.2 exclusions; depth limited here to 80% (task scope); §1.7 material limitations.
  check(g.D>2*g.t_nom,'Durchmesser muss größer als die doppelte Nennwanddicke sein.');
  check(q<=0.8,'d/t > 0,80: außerhalb des Bewertungsumfangs.');
  check(g.F<=1,'Druckfaktor F muss zwischen 0 und 1 liegen.');
  // Review-Hinweis: B31G-2012 §1.9 empfiehlt Sicherheitsfaktor ≥ 1,25 (F ≤ 0,8); Ausnahmen begründen.
  if(g.F>0.8) notes.push(['w','F > 0,8 entspricht einem Sicherheitsfaktor < 1,25 (B31G §1.9). Ausnahme im Bewertungsbericht begründen.']);
  check(g.T<120,'Gewählte Fließspannungen gelten hier nur für T < 120 °C.');
  check(Y<=483&&g.SMTS>=Y,'Hier nur SMYS ≤ 483 MPa und SMTS ≥ SMYS.');
  ({crack:()=>check(false,'Riss: mit B31G nicht bewertbar. Bruchmechanische Bewertung erforderlich, etwa nach API 579 Teil 9.'),
    notch:()=>check(false,'Kerbe oder Riefe: mit B31G nicht bewertbar. Mechanische Riefen und Materialausbrüche nach API 579 Teil 12 prüfen, scharfe rissartige Kerben nach Teil 9.'),
    dent:()=>check(false,'Beule: mit B31G nicht bewertbar. Bewertung nach API 579 Teil 12 oder Betreiberrichtlinie.'),
    seam:()=>check(false,'Selektive oder bevorzugte Korrosion an Längs-, Spiral- oder Rundnähten: von B31G ausgenommen. Gesonderte Bewertung erforderlich.')}[g.flaw]||(()=>{}))();
  check([flowO,flowM,z,q,Mo,Mm,so,sm,po,pm,1/g.F].every(Number.isFinite),'Numerischer Wertebereich überschritten; keine verlässliche Bewertung.');
  check(Number.isFinite(candidate)&&candidate>0,'Keine positive Drucktragfähigkeit.');
  const safe=fail?0:candidate,util=safe>0?g.p/safe:Infinity;
  if(util>1){fail=true;notes.push(['e','Betriebsdruck überschreitet den sicheren Druck oder Anwendungsgrenze verletzt.']);}
  notes.push(['w','Nur Korrosionsabtrag mit glatten Übergängen in duktilen Kohlenstoffstahlrohren. Wechselwirkungen zwischen Schäden, Zähigkeit und ursprünglichen MAOP gesondert prüfen (§§1.2, 1.7, 1.8).']);
  notes.push(['','F = '+H.fmt(g.F,3)+' entspricht einem Sicherheitsfaktor '+H.fmt(1/g.F,3)+'.']);
  rows.push(['Mindeststreckgrenze','SMYS',Y,'N/mm²'],['Fließspannung Original','S_flow,O',flowO,'N/mm²'],['Fließspannung Modified','S_flow,M',flowM,'N/mm²'],['Relative Fehlertiefe','d/t',q,'–'],['Längenparameter','z',z,'–'],['Folias Original','M_O',Mo,'–'],['Folias Modified','M_M',Mm,'–'],['Versagensdruck Original','Pf,O',po,'bar'],['Versagensdruck Modified','Pf,M',pm,'bar'],['Sicherer Druck Original (rechnerisch)','Ps,O',po*g.F,'bar'],['Sicherer Druck Modified (rechnerisch)','Ps,M',pm*g.F,'bar'],['Bewertbarer sicherer Druck','Ps',safe,'bar']);
  return {headline:{value:safe,unit:'bar',label:'bar sicherer Druck',of:g.method==='original'?'Original B31G':'Modified B31G'},util,pmax:safe,test:null,rows,notes,fail,
   formula:'z = L²/(D·t) = '+H.fmt(z,3)+'; d/t = '+H.fmt(q,3)+'\nM_original = √(1+0,8z) = '+H.fmt(Mo,3)+'\nM_modified = '+(z<=50?'√(1+0,6275z−0,003375z²)':'0,032z+3,3')+' = '+H.fmt(Mm,3)+'\nPf_original = '+H.fmt(po)+' bar; Pf_modified = '+H.fmt(pm)+' bar\nPs,rech = Pf·F = '+H.fmt(candidate)+' bar'};
 }
});
})(typeof globalThis!=='undefined'?globalThis.AD:window.AD);
