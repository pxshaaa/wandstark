/* AD 2000 B10, Ausgabe 10/2000: nur dickwandige ZYLINDRISCHE Mäntel.
 * Primärtext (Scan/OCR):
 * (Normtext, nicht verlinkt)
 * B0, Ausgabe 11/2008: (Normtext, nicht verlinkt)
 * Kein Kugelnachweis, keine thermischen Spannungen nach B10 §6.2.
 */
(function(AD){
'use strict';
const H=AD.h;
const snap=(x,s)=>Number.isFinite(x)&&Number.isFinite(s)&&Math.abs(x-s)<=16*Number.EPSILON*Math.max(Math.abs(x),Math.abs(s))?s:x;
// B10 §6.1 Gl. (1), p in bar, K in N/mm²; Zuschläge gemäß B0 §9.
const required=(Da,p,K,S,c)=>23*K/S>p ? Da*p/(23*K/S-p)+c : Infinity;
AD.register({
 id:'b10',name:'Dickwandig',code:'B10',group:'Schalen',
 icon:'<circle cx="22" cy="17" r="14"/><circle cx="22" cy="17" r="10"/><path d="M12 7l3 3M8 16h4M29 28l3 3"/>',
 fields:[
  {id:'shape',label:'Schalenform',type:'select',options:[['cyl','Zylinder'],['sph','Kugel (außerhalb B10)']],def:'cyl'},
  {id:'Da',label:'Außendurchmesser',sym:'Da',unit:'mm',def:300},
  {id:'sn',label:'Ausgeführte Wanddicke',sym:'se',unit:'mm',def:40},
  {id:'thermal',label:'Temperaturdifferenz durch die Wand',type:'select',options:[['none','Nicht nennenswert'],['gradient','Nennenswert (gesonderter Nachweis)']],def:'none'},
  {id:'axial',label:'Axialbeanspruchung durch Innendruck',type:'select',options:[['full','Volle Axialbeanspruchung (geschlossene Enden)'],['other','Andere Axialbeanspruchung']],def:'full'},
  {id:'material',label:'Werkstoffbereich',type:'select',options:[['steel','Verformungsfähiger Walz-/Schmiedestahl'],['other','Anderer Werkstoff']],def:'steel'}
 ],
 help:'B10 (10/2000), 1,2 < Da/Di ≤ 1,5, v = 1. Nur glatte Mäntel ohne Bohrungen, Zusatzlasten oder Zeitstandbeanspruchung. K und K20 müssen zur tatsächlichen Erzeugnisdicke passen. Kugeln sind nicht durch B10 abgedeckt.',
 calc(g){
  const notes=[],rows=[];
  const error=t=>notes.push(['e',t]);
  const invalid=()=>({headline:{value:NaN,unit:'mm',label:'mm erforderlich',of:'Geltungsbereich prüfen'},util:NaN,pmax:NaN,test:null,rows,notes,fail:true,formula:'Kein Nachweis: Eingaben oder Geltungsbereich unzulässig.'});
  if(['Da','sn','K','K20','S','ST','p','c1','c2','T'].some(k=>Math.abs(g[k])>1e100)||g.T< -273.15||!['Da','sn','K','K20','S','ST'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
     !['p','c1','c2'].every(k=>Number.isFinite(g[k])&&g[k]>=0)||!Number.isFinite(g.T)){
   error('Endliche, positive Maße und Festigkeitswerte sowie nichtnegative Drücke und Zuschläge eingeben.');return invalid();
  }
  // B0 §9: Zuschläge von der verfügbaren Wand abziehen; Di ist reine Geometrie.
  const c=g.c1+g.c2,se=g.sn-c,Di=g.Da-2*g.sn,Dic=g.Da-2*se;
  rows.push(['Innendurchmesser (Nennmaß)','Di',Di,'mm'],['Wirksame Wanddicke','s0,vorh',se,'mm']);
  if(Di<=0||se<=0){error('Di und Wanddicke nach Abzug von c1 + c2 müssen positiv sein.');return invalid();}
  const ratio=g.Da/Di,ratioC=g.Da/Dic;
  rows.push(['Durchmesserverhältnis (Nennmaß)','Da/Di',ratio,'–'],['Durchmesserverhältnis ohne Zuschläge','Da/Di,c',ratioC,'–']);
  // B10 §1: 1,2 < Da/Di ≤ 1,5. Zusätzlich konservativ auch Restwand prüfen.
  if(snap(ratio,1.2)<=1.2||snap(ratio,1.5)>1.5||snap(ratioC,1.2)<=1.2||snap(ratioC,1.5)>1.5)
   error('B10 §1: 1,2 < Da/Di ≤ 1,5 erforderlich; hier auch für die Wand ohne Zuschläge geprüft. Dünnere Schalen nach B1, dickere gesondert nachweisen.');
  if(g.shape!=='cyl') error('B10 §1 gilt nur für Zylinder; für Kugeln ist ein gesonderter Nachweis erforderlich.');
  // B10 §5.1 verlangt volle Beanspruchbarkeit der Längsschweißnaht.
  if(g.v!==1) error('B10 §5.1 verlangt v = 1; eine Abminderung mit v ist hier nicht zulässig.');
  if(g.axial!=='full') error('B10 §1 setzt volle Axialbeanspruchung durch Innendruck voraus.');
  if(g.material!=='steel') error('Dieser Umfang gilt nur für verformungsfähigen Walz-/Schmiedestahl (B10 §1, B0 Tafel 2).');
  if(g.thermal!=='none') error('Temperaturspannungen nach B10 §6.2 sind nicht enthalten; Nachweis gesperrt.');
  // B0 §7, Tafel 2 Zeile 1. Sonderfall B10 §4.2 (S=1,4) bewusst ausgeschlossen.
  if(g.S<1.5||g.ST<1.05) error('Für diesen Umfang mindestens S = 1,5 und S′ = 1,05 verwenden; Sonderfreigabe nach B10 §4.2 nicht enthalten.');
  if(notes.length) return invalid();
  const sReq=snap(required(g.Da,g.p,g.K,g.S,c),g.sn);
  // B10 §6.1 Gl. (1), nach p umgestellt; keine Multiplikation mit v.
  const q=H.PT({...g,p:1});
  const pmax=Math.min(23*(g.K/g.S)*se/(g.Da+se),23*(g.K20/g.ST)*se/(g.Da+se)/q);
  // B10 §6.1 Gl. (2), (3); konservativ Restwand statt Nennwand eingesetzt (B0 §9).
  const svi=g.p*(g.Da+se)/(23*se),sva=g.p*(g.Da-3*se)/(23*se);
  // B0 §4.1, §4.4: Prüfdruck und K20/S′; B10 §6.1 Gl. (1).
  // UNVERIFIED: gemeinsame Anwendung auf den Prüfzustand mit beiden Zuschlägen;
  // konservativ c2 beibehalten und daher keine höhere Tragfähigkeit bei Erstprüfung.
  // PT-Konvention des Rechners: p=PS; DGRL 2014/68/EU Anhang I §7.4:
  // https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32014L0068
  const PT=H.PT(g),sT=snap(required(g.Da,PT,g.K20,g.ST,c),g.sn);
  const need=snap(Math.max(sReq,sT),g.sn);
  const test={PT,req:sT,have:g.sn,unit:'mm',ok:Number.isFinite(sT)&&sT<=g.sn,
   note:'Wasserdruckprüfung bei 20 °C; p = PS. Konservativ c1 + c2 beibehalten; örtliche und hydrostatische Zusatzlasten gesondert berücksichtigen.'};
  let fail=!Number.isFinite(need)||need>g.sn||!test.ok;
  if(sReq>g.sn) error('Betriebszustand: ausgeführte Wanddicke kleiner als erforderlich.');
  if(!test.ok) error('Prüfzustand: ausgeführte Wanddicke reicht nicht aus.');
  notes.push(['w','UNVERIFIED: Prüfzustand mit B10-Formel (1), K20/S′ und konservativ beiden Zuschlägen; gesondert bestätigen.'],
   ['','Gültig nur ohne nennenswerte Temperaturdifferenz; volle Axialbeanspruchung, keine Bohrungen, Zusatzlasten oder Zeitstandbeanspruchung.']);
  rows.push(['Zulässige Spannung','K/S',g.K/g.S,'N/mm²'],['Zuschläge','c1+c2',c,'mm'],
   ['Vergleichsspannung innen','σvi',svi,'N/mm²'],['Vergleichsspannung außen','σva',sva,'N/mm²'],
   ['Betriebszustand erforderlich','s_B',sReq,'mm'],['Prüfzustand erforderlich','s_P',sT,'mm'],['Erforderliche Wanddicke Betrieb','s',sReq,'mm'],['Maßgebende Wanddicke Betrieb/Prüfung','s_ma',need,'mm'],['Zulässiger Druck','p_zul',pmax,'bar']);
  if(![need,pmax,PT,sT,svi,sva,...rows.map(x=>x[2])].every(Number.isFinite)){error('Numerischer Wertebereich überschritten; kein Nachweis möglich.');return invalid();}
  return {headline:{value:sReq,unit:'mm',label:'mm Betrieb erforderlich',of:'ausgeführt '+H.fmt(g.sn,1)+' mm'},
   util:need/g.sn,pmax,test,rows,notes,fail,
   formula:'B10 §6.1 (1): s = Da·p / (23·K/S − p) + c1 + c2\n'+
    's = '+H.fmt(g.Da)+'·'+H.fmt(g.p)+' / (23·'+H.fmt(g.K)+'/'+H.fmt(g.S)+' − '+H.fmt(g.p)+') + '+H.fmt(c)+' = '+H.fmt(sReq,3)+' mm\n'+
    'p_zul = min(23·(K/S)·s0,vorh/(Da+s0,vorh); 23·(K20/S′)·s0,vorh/(Da+s0,vorh)/q) = '+H.fmt(pmax)+' bar; q = max(1,25·K20/K; 1,43)\n'+
    'σvi = p·(Da + s0,vorh)/(23·s0,vorh) = '+H.fmt(svi)+' N/mm²\n'+
    'σva = p·(Da − 3·s0,vorh)/(23·s0,vorh) = '+H.fmt(sva)+' N/mm²\n'+
    'Prüfung: PT = '+H.fmt(PT)+' bar; s′ = '+H.fmt(sT,3)+' mm (K20/S′, c1 + c2).\ns_ma = max(s_B; s_P) = '+H.fmt(need,3)+' mm.'};
 },
 draw(g,H,r){
  const D=H.draw,W=420,V=310;
  const empty=()=>D.svg(W,V,D.text(210,135,'Maße eingeben'),{title:'Dickwandige Schale B10',sub:'Schnitt A–A · Maße in mm'});
  if(!g||![g.Da,g.sn].every(x=>Number.isFinite(x)&&x>0)||g.sn>=g.Da/2||!['cyl','sph'].includes(g.shape))return empty();
  // Reine Schnittgeometrie, keine Bemessungsformel; dicke Wände maßstäblich.
  const k=D.fit(g.Da,g.Da,230,230,20),R=g.Da*k/2,cx=185,cy=132;
  const t=Math.min(R-1,Math.max(5,g.sn*k)),a=R-t,Di=g.Da-2*g.sn;
  const cls=r&&(r.ok===false||r.fail||r.util>1)?'o bad':'o';
  // Gegenläufige Konturen: Ringfläche schraffiert, Druckraum ausgespart.
  let b=D.tag('shape',D.path(`M ${cx-R} ${cy} A ${R} ${R} 0 1 0 ${cx+R} ${cy} A ${R} ${R} 0 1 0 ${cx-R} ${cy} Z M ${cx-a} ${cy} A ${a} ${a} 0 1 1 ${cx+a} ${cy} A ${a} ${a} 0 1 1 ${cx-a} ${cy} Z`,cls,true));
  b+=D.centre(cx-R-10,cy,cx+R+10,cy)+D.centre(cx,cy-R-10,cx,cy+R+10);
  b+=D.text(16,21,g.shape==='cyl'?'Zylinder · Schnitt A–A':'Kugel · kein B10-Nachweis','start','tx tb2');
  b+=D.tag('Da',D.dim(cx-R,cy+R,cx+R,cy+R,27,'Da '+H.fmt(g.Da,1)+' mm'));
  // Di oberhalb der waagerechten Mittellinie, Wanddicke mit separater Maßlinie oben.
  b+=D.dim(cx-a,cy,cx+a,cy,-23,'Di '+H.fmt(Di,1)+' mm'); // derived value: not tied to an input field
  b+=D.tag('sn',D.dim(cx+a,cy,cx+R,cy,-(R+14),'s '+H.fmt(g.sn,1)+' mm'));
  if(a>24){
   b+=D.line(cx,cy+30,cx,cy+a-4,'d').replace('/>',' marker-end="url(#tza)"/>');
   b+=D.text(cx,cy+17,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
  }
  b+=D.text(16,271,t===g.sn*k?'Wanddicke maßstäblich':'Wanddicke überhöht dargestellt','start','tx tb2');
  return D.svg(W,V,b,{title:g.shape==='cyl'?'Dickwandiger Zylinder B10':'Kugel außerhalb B10',sub:'Da '+H.fmt(g.Da,0)+' × '+H.fmt(g.sn,1)+' mm'});
 }
});
})(globalThis.AD);
