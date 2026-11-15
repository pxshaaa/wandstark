/* Verified sources (older editions, not a claim of current-edition compliance):
 * B7 08.2007 §§5–8: (Normtext, nicht verlinkt)
 * B8 04.2015 §§8.4–8.4.1, pp.6–8 (PDF pp.291–293):
 * (Normtext, nicht verlinkt)
 * B8 05.2007 equivalent equations §§6.1.4–6.2.1:
 * (Normtext, nicht verlinkt)
 * Scope: static steel connections, entered total forces, no creep or thermal loads.
 */
(function(AD){
'use strict';
const H=AD.h;
const num=(id,label,sym,unit,def,min)=>({id,label,sym,unit,def,...(min?{min}:{})});
function invalid(notes,text){notes.push(['e',text]);}
function checkNumbers(g,positive,nonnegative,notes){
  if(positive.some(k=>!Number.isFinite(g[k])||g[k]<=0)||
     nonnegative.some(k=>!Number.isFinite(g[k])||g[k]<0))
    invalid(notes,'Eingaben müssen endlich und positiv sein; Kräfte dürfen null sein.');
}
function scope(g,notes){
  // Deliberately narrower implementation scope, NOT a temperature limit from B7/B8.
  if(!Number.isFinite(g.T)||g.T < -10||g.T>300)
    invalid(notes,'Außerhalb des hier abgedeckten Temperaturbereichs −10 bis 300 °C; kein Zeitstandnachweis.');
}
AD.register({
  id:'b7',name:'Schrauben',code:'B7',group:'Verbindungen',
  icon:'<path d="M16 4h12v6H16zM19 10v20h6V10M18 14h8M18 19h8M18 24h8"/>',
  fields:[
    num('n','Schraubenzahl','n','–',8),
    num('dn','Gewindenenndurchmesser','d','mm',24),
    num('dk','Ausgeführter Kerndurchmesser','dK','mm',20),
    num('FB','Gesamtschraubenkraft Betrieb','FSB','N',200000,'zero'),
    num('FV','Gesamtschraubenkraft Einbau','FDV','N',300000,'zero'),
    num('FP','Gesamtschraubenkraft Prüfung','FSP','N',286000,'zero'),
    num('KB','Schraubenkennwert bei Schraubentemperatur','KB','N/mm²',200),
    num('KB20','Schraubenkennwert bei 20 °C','KB20','N/mm²',240),
    {id:'ratio',label:'Verhältnis Streckgrenze/Zugfestigkeit',type:'select',def:'low',options:[['low','≤ 0,8 (Tafel 3.1)'],['high','> 0,8 (Tafel 3.2)']]},
    {id:'phi',label:'Gütewert der parallelen Auflageflächen',type:'select',def:'1',options:[['1','1,00 · bearbeitet'],['0.75','0,75 · unbearbeitet']]}
  ],
  help:'Vollschaft-/Starrschrauben mit bekanntem Streckgrenzkennwert; KB und KB20 separat für den Schraubenwerkstoff eingeben. Kräfte sind Gesamtkräfte aller Schrauben nach B7 §6.1 einschließlich Zusatzlasten. Keine Hohlschrauben. Gemeinsame K-, S- und Zuschlagsfelder werden hier nicht verwendet.',
  draw(g,H,r){
    const D=H.draw, W=420, HH=300;
    const empty=()=>D.svg(W,HH,D.text(210,140,'Maße eingeben'),{title:'Schrauben B7',sub:'Gewinde und Schraubenanordnung'});
    if(!g||!['dn','dk','n'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
       g.dk>g.dn||!Number.isInteger(g.n)||g.n<4||g.n>120) return empty();
    const bad=r&&(r.ok===false||r.fail===true||r.util>1), cls=bad?'o bad':'o';
    // B7 §3: dK = Gewindekerndurchmesser, n = Schraubenzahl.
    // Drawing geometry only: length, head and bolt-circle size are schematic,
    // since B7 inputs here do not supply them. No strength formula is added.
    const k=D.fit(4*g.dn,5*g.dn,180,210,15);
    if(!Number.isFinite(k)||k<=0) return empty();
    const cx=91, top=67, end=214, half=g.dn*k/2;
    const core=Math.max(half*g.dk/g.dn,half-10);
    let b=D.text(91,24,'Seitenansicht','middle','tx tb2');
    b+=D.poly([[cx-half*1.65,45],[cx+half*1.65,45],[cx+half*1.85,50],
      [cx+half*1.85,top],[cx-half*1.85,top],[cx-half*1.85,50]],'o');
    b+=D.line(cx-half,top,cx-half,end-4,cls)+D.line(cx+half,top,cx+half,end-4,cls);
    b+=D.pline([[cx-half,end-4],[cx-core,end],[cx+core,end],[cx+half,end-4]],cls);
    b+=D.line(cx-core,top+8,cx-core,end,'t')+D.line(cx+core,top+8,cx+core,end,'t');
    // Simplified thread strokes; pitch is intentionally not dimensioned.
    for(let y=top+13;y<end-5;y+=9) b+=D.line(cx-half,y,cx+half,y-5,'t');
    b+=D.centre(cx,36,cx,225);
    b+=D.dim(cx-core,end,cx+core,end,22,'dK '+H.fmt(g.dk,1));
    b+=D.dim(cx-half,top+12,cx+half,top+12, -44,'M'+H.fmt(g.dn,0));
    const pcx=295,pcy=131,R=66,hr=Math.min(10,Math.PI*R/g.n*0.65);
    b+=D.text(pcx,24,'Lochkreis · Draufsicht','middle','tx tb2');
    b+=D.circle(pcx,pcy,R+hr+12,'t')+D.circle(pcx,pcy,R,'c');
    b+=D.centre(pcx-R-25,pcy,pcx+R+25,pcy)+D.centre(pcx,pcy-R-25,pcx,pcy+R+25);
    for(let i=0;i<g.n;i++){
      const a=2*Math.PI*i/g.n-Math.PI/2, x=pcx+R*Math.cos(a),y=pcy+R*Math.sin(a);
      b+=D.circle(x,y,hr,cls)+D.line(x-hr/2,y,x+hr/2,y,'c')+D.line(x,y-hr/2,x,y+hr/2,'c');
    }
    b+=D.text(pcx,235,H.fmt(g.n,0)+' Schrauben · M'+H.fmt(g.dn,0),'middle','tx');
    b+=D.text(14,258,'Länge, Kopf, Gewindesteigung und Lochkreis schematisch','start','tx tb2');
    if(core!==half*g.dk/g.dn) b+=D.text(14,271,'Gewindetiefe begrenzt dargestellt','start','tx tb2');
    return D.svg(W,HH,b,{title:'Schrauben B7',sub:'Maße in mm · Anordnung schematisch'});
  },
  calc(g){
    const notes=[];
    checkNumbers(g,['n','dn','dk','KB','KB20'],['FB','FV','FP'],notes); scope(g,notes);
    if(!Number.isSafeInteger(g.n)||g.n<4) invalid(notes,'Hier nur Verbindungen mit mindestens vier Schrauben und ganzzahligem n.');
    // B7 §8: normal minimum M10; exceptional smaller threads deliberately excluded.
    if(g.dn<10||g.dk>g.dn) invalid(notes,'Nur Gewinde ab M10; Kerndurchmesser darf Nenndurchmesser nicht überschreiten.');
    if(!['low','high'].includes(g.ratio)||!['1','0.75'].includes(String(g.phi))) invalid(notes,'Ungültige Auswahl für Tafel oder Gütewert.');
    const phi=Number(g.phi);
    // B7 §5, Tafeln 3.1/3.2: Vollschaftschrauben, known yield strength.
    const SB=1.8, SE=g.ratio==='high'?1.3:1.26;
    // B7 §6.2, eqs.(14)–(17), exact Z instead of rounded table values.
    const ZB=Math.sqrt(4*SB/(Math.PI*phi)), ZE=Math.sqrt(4*SE/(Math.PI*phi));
    const d0=ZB*Math.sqrt(g.FB/g.KB/g.n);
    // B7 §7, eqs.(18),(19) and linear interpolation between 20 and 50 mm.
    const c5=d0<=20?3:d0>=50?1:(65-d0)/15;
    const dB=d0+c5, dE=ZE*Math.sqrt(g.FV/g.KB20/g.n), dP=ZE*Math.sqrt(g.FP/g.KB20/g.n);
    const req=Math.max(dB,dE,dP), util=req/g.dk;
    if(![g.KB*g.n,g.KB20*g.n,ZB,ZE,d0,c5,dB,dE,dP,req,util].every(Number.isFinite))
      invalid(notes,'Numerischer Überlauf oder nicht endliches Zwischenergebnis; keine Freigabe.');
    if(util>1) invalid(notes,`Kerndurchmesser ${H.fmt(g.dk)} mm < erforderlich ${H.fmt(req)} mm.`);
    notes.push(['w','Kräfte einschließlich Dichtungs-, Druck-, Zusatz- und Temperatureinflüssen extern ermitteln. Gewinde, Mutter, Auflage und Dichtheit sind separat nachzuweisen.']);
    notes.push(['','B7 Ausgabe 08.2007; Prüfzustand wird stets mitgerechnet. Keine automatischen Temperaturabschläge. c1 und c2 entfallen nach B7 §7.']);
    return {headline:{value:req,unit:'mm',label:'mm Kerndurchmesser erforderlich',of:`ausgeführt ${H.fmt(g.dk)} mm`},
      util,pmax:NaN,test:null,testNote:'Prüfzustand mit der eingegebenen Schraubenkraft im Prüfzustand berücksichtigt; den Prüfdruck nach Druckgeräterichtlinie gesondert ermitteln.',fail:notes.some(n=>n[0]==='e'),notes,
      rows:[['Sicherheit Betrieb','SB',SB,'–'],['Sicherheit Einbau/Prüfung','SE',SE,'–'],['Gütewert','φ',phi,'–'],
        ['Hilfswert Betrieb','ZB',ZB,'–'],['Hilfswert Einbau/Prüfung','ZE',ZE,'–'],['Betrieb ohne Zuschlag','d0',d0,'mm'],
        ['Konstruktionszuschlag','c5',c5,'mm'],['Kerndurchmesser Betrieb','dKB',dB,'mm'],['Kerndurchmesser Einbau','dKE',dE,'mm'],['Kerndurchmesser Prüfung','dKP',dP,'mm']],
      formula:`Z = √(4·S/(π·φ))\ndKB = √(4·${H.fmt(SB)}·${H.fmt(g.FB)}/(π·${H.fmt(phi)}·${H.fmt(g.KB)}·${H.fmt(g.n,0)})) + ${H.fmt(c5)} = ${H.fmt(dB)} mm\ndKE = √(4·${H.fmt(SE)}·${H.fmt(g.FV)}/(π·${H.fmt(phi)}·${H.fmt(g.KB20)}·${H.fmt(g.n,0)})) = ${H.fmt(dE)} mm\ndKP = √(4·${H.fmt(SE)}·${H.fmt(g.FP)}/(π·${H.fmt(phi)}·${H.fmt(g.KB20)}·${H.fmt(g.n,0)})) = ${H.fmt(dP)} mm\ndK = max(dKB; dKE; dKP) = ${H.fmt(req)} mm`};
  }
});
AD.register({
  id:'b8',name:'Flansch',code:'B8',group:'Verbindungen',
  icon:'<path d="M12 3v10H4v8h36v-8h-8V3M17 3v15h10V3M9 10v14M35 10v14"/>',
  fields:[
    num('di','Lichter Innendurchmesser (wirksam)','di','mm',400),
    num('da','Flanschaußendurchmesser','da','mm',600),
    num('dt','Schraubenlochkreisdurchmesser','dt','mm',530),
    num('dD','Mittlerer Dichtungsdurchmesser','dD','mm',450),
    num('dL','Tatsächlicher Schraubenlochdurchmesser','dL','mm',26),
    num('n','Schraubenzahl','n','–',16),
    num('hf','Wirksame ausgeführte Flanschblatthöhe','hF','mm',60),
    num('ha','Wirksame gesamte Flanschhöhe','hA','mm',105),
    num('sf','Wirksame Ansatzdicke am Blatt','sF','mm',18),
    num('s1','Wirksame Zargenwanddicke','s1','mm',12),
    num('r','Übergangsradius','r','mm',8),
    num('FB','Gesamtschraubenkraft Betrieb','FSB','N',250000,'zero'),
    num('FV','Gesamtschraubenkraft Einbau','FDV','N',400000,'zero'),
    num('FP','Gesamtschraubenkraft Prüfung','FSP','N',360000,'zero')
  ],
  help:'Vorschweißflansch mit konischem Ansatz, innenliegender Flachdichtung, Stahl mit Bruchdehnung ≥ 10 %. Alle Maße sind wirksame Maße nach Abzug von Toleranz und Korrosion; gemeinsame c1/c2 werden nicht nochmals abgezogen. Gleicher Werkstoff für Zarge und Flansch. Kräfte extern nach B7 ermitteln. Nach Änderung der Blattdicke erneut rechnen.',
  draw(g,H,r){
    const D=H.draw,W=420,HH=320;
    const empty=()=>D.svg(W,HH,D.text(210,140,'Maße eingeben'),{title:'Vorschweißflansch B8',sub:'Halbschnitt · Maße in mm'});
    if(!g||!['di','da','dt','dD','dL','hf','ha','sf','s1','r'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
       !(g.di<g.dD&&g.dD<g.dt&&g.dt+g.dL<g.da&&g.di+2*g.sf<g.dt-g.dL&&g.sf>=g.s1&&g.ha>g.hf)) return empty();
    // B8 05.2007 §6.2.1, Bilder 1/2 (2015 §8.4.1.1): geometry
    // and section names A-A/B-B; no calculation formulas are changed.
    const k=D.fit(g.da,g.ha,320,190,20), cx=200;
    const ro=g.da*k/2,ri=g.di*k/2,rt=g.dt*k/2,rd=g.dD*k/2;
    const axial=Math.max(135,g.ha*k)/g.ha;
    const blade=Math.max(12,g.hf*axial), hub=Math.max(28,(g.ha-g.hf)*axial);
    const bottom=205, shoulder=bottom-blade, top=shoulder-hub;
    const s1=Math.max(5,g.s1*k), sf=Math.max(s1,g.sf*k,5);
    const rad=Math.min(g.r*k,Math.max(1,(ro-ri-sf)/3),hub/3);
    const hole=g.dL*k,xi=cx+ri, xo=cx+ro, xh=cx+rt;
    if(![k,axial,blade,hub,s1,sf,rad,hole,xi,xo,xh].every(Number.isFinite)||k<=0) return empty();
    const bad=r&&(r.ok===false||r.fail===true||r.util>1),cls=bad?'o bad':'o';
    // Right axial half is sectioned; the left half is the external view.
    const right=`M ${xi} ${top} L ${xi+s1} ${top} L ${xi+sf} ${shoulder-rad} Q ${xi+sf} ${shoulder} ${xi+sf+rad} ${shoulder} L ${xo} ${shoulder} L ${xo} ${bottom} L ${xi} ${bottom} Z`;
    const left=`M ${cx-ri} ${top} L ${cx-ri-s1} ${top} L ${cx-ri-sf} ${shoulder-rad} Q ${cx-ri-sf} ${shoulder} ${cx-ri-sf-rad} ${shoulder} L ${cx-ro} ${shoulder} L ${cx-ro} ${bottom} L ${cx-ri} ${bottom} Z`;
    let b=D.text(15,20,'Halbschnitt · rechte Hälfte geschnitten','start','tx tb2');
    b+=D.path(right,cls,true)+D.path(left,'o');
    b+=D.rect(xh-hole/2,shoulder,hole,blade,'t');
    // Clear the hole through the hatch using helper-built paper rectangle.
    b+=D.rect(xh-hole/2,shoulder,hole,blade,'frame2')+
      D.line(xh-hole/2,shoulder,xh-hole/2,bottom,'o')+D.line(xh+hole/2,shoulder,xh+hole/2,bottom,'o');
    b+=D.line(cx-rt-hole/2,shoulder,cx-rt-hole/2,bottom,'h')+D.line(cx-rt+hole/2,shoulder,cx-rt+hole/2,bottom,'h');
    b+=D.centre(cx,top-12,cx,213)+D.centre(xh,shoulder-10,xh,bottom+6);
    // Dichtung: mean diameter is located on the sealing face, not its unknown edges.
    b+=D.line(cx-rd,bottom-3,cx-rd,bottom+5,'t')+D.line(cx+rd,bottom-3,cx+rd,bottom+5,'t');
    b+=D.dim(cx-ri,bottom,cx+ri,bottom,18,'di '+H.fmt(g.di,1));
    b+=D.dim(cx-rd,bottom,cx+rd,bottom,36,'dD '+H.fmt(g.dD,1));
    b+=D.dim(cx-rt,bottom,cx+rt,bottom,54,'dt '+H.fmt(g.dt,1));
    b+=D.dim(cx-ro,bottom,cx+ro,bottom,72,'da '+H.fmt(g.da,1));
    b+=D.dim(xo,shoulder,xo,bottom,-28,'hF '+H.fmt(g.hf,1));
    b+=D.dim(cx-ro,top,cx-ro,bottom,26,'hA '+H.fmt(g.ha,1));
    b+=D.dim(xi,top,xi+s1,top,-16,'s₁ '+H.fmt(g.s1,1));
    b+=D.dim(xi,shoulder,xi+sf,shoulder,-17,'sF '+H.fmt(g.sf,1));
    b+=D.dim(xh-hole/2,shoulder,xh+hole/2,shoulder,-49,'dL '+H.fmt(g.dL,1));
    b+=D.leader(xi+sf+rad*0.3,shoulder-rad*0.3,398,shoulder-7,'r '+H.fmt(g.r,1),'end');
    // Section traces pass through the middle of the hub wall at the
    // flange blade (A-A) and at the cylindrical neck (B-B).
    b+=D.centre(xi+sf/2,shoulder-5,xi+sf/2,bottom+4);
    b+=D.centre(xi+s1/2,top-5,xi+s1/2,top+14);
    b+=D.leader(xi+sf/2,shoulder+blade/2,220,shoulder+blade/2,'A–A','end');
    b+=D.leader(xi+s1/2,top+10,220,top+10,'B–B','end');
    const exaggerated=s1>g.s1*k||sf>g.sf*k;
    if(exaggerated) b+=D.text(14,297,'Wände überhöht','start','tx tb2');
    if(axial>k) b+=D.text(14,309,'Axial überhöht','start','tx tb2');
    return D.svg(W,HH,b,{title:'Vorschweißflansch B8',sub:'A–A / B–B · wirksame Maße in mm'});
  },
  calc(g){
    const notes=[];
    checkNumbers(g,['di','da','dt','dD','dL','n','hf','ha','sf','s1','r','K','K20','S','ST'],['FB','FV','FP'],notes); scope(g,notes);
    // B8 04.2015 §8.4.1.1 eq.(3), Fig.3: dL' <= actual dL.
    // Conservatively retain the full actual hole diameter (no Fig.3 reduction).
    const b=g.da-g.di-2*g.dL;
    // B8 §8.4.1.1: sF limited to hF/3 in eqs.(4),(7) only.
    const sf=Math.min(g.sf,g.hf/3);
    // B8 §8.4.1.1 eqs.(4),(5),(7),(8),(13).
    const Z=(g.di+sf)*sf*sf, Z1=0.75*(g.di+g.s1)*g.s1*g.s1;
    const aA=(g.dt-g.di-sf)/2, aB=(g.dt-g.di-g.s1)/2, aD=(g.dt-g.dD)/2;
    // B8 §8.4.1.1 eqs.(10)–(12): B is a ratio, NOT its square root.
    const B1=(g.ha-g.hf)/g.hf, sm=(g.sf+g.s1)/2;
    const B=(1+2*sm/b*B1)/(1+2*sm/b*(B1*B1+2*B1));
    // B8 §8.4 eqs.(1),(2): installation uses S' in the 04.2015 edition.
    const WA=Math.max(g.FB*g.S/g.K*aA,g.FV*g.ST/g.K20*aD,g.FP*g.ST/g.K20*aA);
    const WB=Math.max(g.FB*g.S/g.K*aB,g.FV*g.ST/g.K20*aD,g.FP*g.ST/g.K20*aB);
    // B8 §8.4.1.1 eqs.(6),(9). Negative radicand: hub alone covers
    // the moment in that section; no positive blade requirement from this equation.
    const hAA=Math.sqrt(Math.max(0,(1.27*WA-Z)/b));
    const hBB=B*Math.sqrt(Math.max(0,(1.27*WB-Z1)/b));
    const req=Math.max(hAA,hBB), util=req/g.hf;
    if(g.di>3600) invalid(notes,'Innendurchmesser > 3600 mm: außerhalb des hier abgedeckten Bereichs (B8 05.2007 §1).');
    if(!(b>0&&g.di<g.dD&&g.dD<g.dt&&g.dt+g.dL<g.da&&g.dt-g.dL>g.di+2*g.sf&&g.sf>=g.s1))
      invalid(notes,'Unzulässige Geometrie: positive Ringbreite, innenliegende Dichtung, freie Schraubenlöcher und konischer Ansatz erforderlich.');
    // B8 §8.4.1.1, B-B applicability limits immediately preceding eq.(9).
    if(B1<0.5||B1>1||(g.s1+g.sf)/b<0.1||(g.s1+g.sf)/b>0.3)
      invalid(notes,'B-B außerhalb der Grenzen: 0,5 ≤ (hA−hF)/hF ≤ 1 und 0,1 ≤ (s1+sF)/b ≤ 0,3. DIN-2505-Nachweis erforderlich.');
    // B8 05.2007 §2.3.1.1, §2.3.1.3; implementation requires both.
    if(!Number.isInteger(g.n)||g.n<4||Math.PI*g.dt/g.n>5*g.dL)
      invalid(notes,'Mindestens vier Schrauben; Schraubenteilung π·dt/n darf 5·dL nicht überschreiten.');
    // Equal angular spacing: use the chord, not the arc, for hole clearance.
    // Touching/overlapping holes have no ligament and invalidate the ring model.
    if(!(g.dt*Math.sin(Math.PI/g.n)>g.dL))
      invalid(notes,'Schraubenlöcher berühren oder überschneiden sich: dt·sin(π/n) muss größer als dL sein.');
    if(g.r<6) invalid(notes,'Übergangsradius mindestens 6 mm erforderlich; nur Stahl mit Bruchdehnung ≥ 10 %.');
    if(![b,sf,Z,Z1,aA,aB,aD,B1,sm,B,WA,WB,hAA,hBB,req,util].every(Number.isFinite))
      invalid(notes,'Numerischer Überlauf oder nicht endliches Zwischenergebnis; keine Freigabe.');
    if(util>1) invalid(notes,`Wirksames Blatt ${H.fmt(g.hf)} mm < erforderlich ${H.fmt(req)} mm bei eingegebener Geometrie.`);
    notes.push(['','B8 Ausgabe 04.2015: A-A und B-B, jeweils Betrieb, Einbau und Prüfung. Volle Lochweite konservativ ohne Reduktion nach Bild 3.']);
    notes.push(['w','Teilnachweis Flanschfestigkeit: Dichtung, Schrauben, Anschlusszarge und Flanschblattneigung/Dichtheit separat prüfen. Keine äußeren Kräfte/Momente oder Temperaturdifferenzen abgedeckt.']);
    notes.push(['w','Nur wirksame Maße eingeben. Gemeinsame Zuschläge c1/c2 werden nicht automatisch berücksichtigt; erforderliche Bestellmaße separat festlegen.']);
    return {headline:{value:req,unit:'mm',label:'mm wirksames Blatt erforderlich',of:`wirksam ausgeführt ${H.fmt(g.hf)} mm`},
      util,pmax:NaN,test:null,testNote:'Prüfzustand mit der eingegebenen Schraubenkraft im Prüfzustand berücksichtigt; den Prüfdruck nach Druckgeräterichtlinie gesondert ermitteln.',fail:notes.some(n=>n[0]==='e'),notes,
      rows:[['Doppelte wirksame Ringbreite','b',b,'mm'],['Angerechnete Ansatzdicke','sF,rech',sf,'mm'],
        ['Hebelarm A-A','aA',aA,'mm'],['Hebelarm B-B','aB',aB,'mm'],['Hebelarm Einbau','aD',aD,'mm'],
        ['Flanschwiderstand A-A','WA',WA,'mm³'],['Flanschwiderstand B-B','WB',WB,'mm³'],
        ['Ansatzbeitrag A-A','Z',Z,'mm³'],['Ansatzbeitrag B-B','Z1',Z1,'mm³'],
        ['Höhenverhältnis','B1',B1,'–'],['Ansatzbeiwert','B',B,'–'],['Erforderliches Blatt A-A','hAA',hAA,'mm'],['Erforderliches Blatt B-B','hBB',hBB,'mm']],
      formula:`b = da − di − 2·dL = ${H.fmt(b)} mm\nsF,rech = min(sF; hF/3) = ${H.fmt(sf)} mm\naA = ${H.fmt(aA)} mm; aB = ${H.fmt(aB)} mm; aD = ${H.fmt(aD)} mm\nWA = max(FSB·S·aA/K; FDV·S′·aD/K20; FSP·S′·aA/K20) = ${H.fmt(WA)} mm³\nWB = max(FSB·S·aB/K; FDV·S′·aD/K20; FSP·S′·aB/K20) = ${H.fmt(WB)} mm³\nB = (1 + 2·sm·B1/b)/(1 + 2·sm·(B1²+2·B1)/b) = ${H.fmt(B,4)}\nhAA = √max(0; (1,27·WA−Z)/b) = ${H.fmt(hAA)} mm\nhBB = B·√max(0; (1,27·WB−Z1)/b) = ${H.fmt(hBB)} mm\nhF = max(hAA; hBB) = ${H.fmt(req)} mm`};
  }
});
/* Normmaße sind eine optionale Geometriequelle; die AD-Rechenwege oben bleiben
 * unverändert. Daten müssen vom Einbinder vor der Berechnung geladen werden.
 * Ausgeblendete manuelle Werte bleiben beim Wechsel zurück erhalten.
 */
const flDNs=[15,20,25,32,40,50,65,80,100,125,150,200,250,300,350,400,450,500];
function standardGeometry(g, id, notes=[]){
  if(!g || g.flSource===undefined || g.flSource==='manual') return g;
  const type=id==='b8'?'11':(g.flType||'11');
  const f=AD.flanges && AD.flanges[type] && AD.flanges[type][g.flPN] && AD.flanges[type][g.flPN][g.flDN];
  const d=AD.gaskets && AD.gaskets[g.flPN] && AD.gaskets[g.flPN][g.flDN];
  const keys=id==='b7'?['n','dn']:['dt','da','dL','n','dD','hf'];
  if(id==='b8'&&![g.c1,g.c2].every(c=>Number.isFinite(c)&&c>=0)) {
    invalid(notes,'Normflansch: c1 und c2 müssen endlich und nicht negativ sein.');
    return {...g,...Object.fromEntries(keys.map(k=>[k,NaN]))};
  }
  if(g.flSource!=='standard'||!['01','11'].includes(type)||!f||!d){
    invalid(notes,'Normflansch nicht verfügbar: Maßtabellen laden und PN/DN prüfen.');
    return {...g,...Object.fromEntries(keys.map(k=>[k,NaN]))};
  }
  notes.push(['',`Normflansch EN 1092-1 Typ ${type}, PN ${H.fmt(Number(g.flPN),0)}, DN ${H.fmt(Number(g.flDN),0)}; Schrauben ${f.bolt}.`]);
  notes.push(['w','Hersteller-Nennmaße sind keine Druck-Temperatur-Freigabe. Blattdicke wirksam = C − c1 − c2 (automatisch); übrige Maße als Nennmaße – bei weiteren Abzügen auf manuelle Eingabe wechseln.']);
  if(f.unverified.length||d.unverified.length)
    notes.push(['w','UNVERIFIED: Unvollständig belegte Normmaße; Herstellerzeichnung erforderlich.']);
  // B8 §8.4.1.1 Bild 1: dD ist der mittlere Dichtungsdurchmesser.
  // Geometrischer Mittelkreis der IBC-Dichtung aus GORE EN1514-1:1997;
  // keine Dichtungskennwerte oder wirksame Dichtungsbreite werden daraus abgeleitet.
  return {...g,dt:f.K,da:f.D,dL:f.L,n:f.n,dn:Number(f.bolt.slice(1)),
    dD:(d.di+d.da)/2,hf:f.C-g.c1-g.c2}; // Review-Fix: B8 rechnet mit wirksamen Maßen: Nenndicke C − c1 − c2
}
for(const id of ['b7','b8']){
  const m=AD.modules.find(m=>m.id===id);
  const auto=id==='b7'?['n','dn']:['da','dt','dD','dL','n','hf'];
  m.fields=[
    {id:'flSource',label:'Normflansch / Geometriequelle',type:'select',def:'manual',options:[['manual','Manuelle Eingabe'],['standard','Normflansch EN 1092-1']]},
    ...(id==='b7'?[{id:'flType',label:'Flanschtyp',type:'select',def:'11',options:[['11','Typ 11 · Vorschweißflansch'],['01','Typ 01 · Glatter Flansch']],when:{flSource:'standard'}}]:[]),
    {id:'flPN',label:'Nenndruckstufe',type:'select',def:'16',options:[10,16,25,40].map(x=>[String(x),'PN '+H.fmt(x,0)]),when:{flSource:'standard'}},
    {id:'flDN',label:'Nennweite',type:'select',def:'100',options:flDNs.map(x=>[String(x),'DN '+H.fmt(x,0)]),when:{flSource:'standard'}},
    ...m.fields.map(f=>auto.includes(f.id)?{...f,when:{flSource:'manual'}}:f)
  ];
  m.help+=' Normflansch: Tabellenmaße werden in Rechnung und Zeichnung übernommen und im Ergebnis ausgegeben. '+
    (id==='b7'?'Kerndurchmesser weiterhin nach tatsächlichem Gewinde eingeben.':'Nur Typ 11; lichte Weite und wirksame Ansatzmaße weiterhin nach Herstellerzeichnung eingeben.');
  // Pure resolver also available for callers needing the effective input geometry.
  m.geometry=g=>standardGeometry(g,id);
  const calculate=m.calc, draw=m.draw;
  m.calc=function(g){
    const notes=[], effective=standardGeometry(g,id,notes), result=calculate(effective,H);
    if(g.flSource==='standard'){
      result.rows.unshift(...(id==='b7'?
        [['Übernommene Schraubenzahl','n',effective.n,'–'],['Übernommener Nenndurchmesser','d',effective.dn,'mm']]:
        [['Übernommener Außendurchmesser','da',effective.da,'mm'],['Übernommener Lochkreis','dt',effective.dt,'mm'],
         ['Übernommener Lochdurchmesser','dL',effective.dL,'mm'],['Übernommene Schraubenzahl','n',effective.n,'–'],
         ['Mittlerer Durchmesser der Dichtung innerhalb des Schraubenlochkreises','dD',effective.dD,'mm'],['Übernommene wirksame Flanschblatthöhe','hF',effective.hf,'mm']]));
    }
    result.notes.unshift(...notes);
    result.fail=result.fail||notes.some(n=>n[0]==='e');
    return result;
  };
  m.draw=(g,h,r)=>draw(standardGeometry(g,id),h,r);
}
})(globalThis.AD);
