/* AD 2000 S3/1, Ausgabe September 2001, §§2,3,5,7,8.2.
 * Originaltext: (Normtext, nicht verlinkt)
 * PDF-Seiten 827–834, insbesondere S.5–6. Historische Ausgabe, keine Aussage
 * zur Übereinstimmung mit 05.2018. Teilberechnung, Gesamtfreigabe stets gesperrt.
 */
(function(AD){
'use strict';
AD.register({
 id:'s31',name:'Standzarge',code:'S3/1',group:'Zusatzlasten',
 icon:'<path d="M12 21V9a10 6 0 0 1 20 0v12M12 21q10 8 20 0M13 22v8m18-8v8M8 30h28"/>',
 fields:[
  {id:'Da',label:'Zargenaußendurchmesser',sym:'Da',unit:'mm',def:2000},
  {id:'sn',label:'Ausgeführte Zargendicke',sym:'se',unit:'mm',def:12},
  {id:'h',label:'Zargenhöhe',sym:'hZ',unit:'mm',def:2500,help:'Nur Zeichnung; M muss das resultierende Schnittmoment einschließlich Hebelarm enthalten.'},
  {id:'weight',label:'Druckkraft im Schnitt 4–4',sym:'F4',unit:'kN',def:500,min:'zero',help:'Lastfallwert aus Gewicht und Füllung oberhalb des untersuchten Schnittes; positiv drückend.'},
  {id:'M',label:'Moment im Schnitt 4–4',sym:'M4',unit:'kNm',def:200,min:'any',help:'Resultierendes Wind-/Erdbebenmoment aus der Lastkombination; keine automatische Lastgenerierung.'},
  {id:'fZ',label:'Zulässige Zargenspannung im Lastfall',sym:'fZ',unit:'N/mm²',def:150,help:'Nach S3/0 ermitteln, für Zargenwerkstoff und tatsächliche Temperatur. Nicht automatisch aus dem Behälterwerkstoff übernommen.'},
  {id:'opening',label:'Zargenquerschnitt',type:'select',def:'none',options:[['none','Unverschwächt, zylindrisch'],['yes','Mit Ausschnitt (gesperrt)']]},
  {id:'F5',label:'Druckkraft am Fußring',sym:'F5',unit:'kN',def:520,min:'zero',help:'Gesamte Vertikallast am Fundament, einschließlich Zarge. Eigenen maßgebenden Lastfall angeben.'},
  {id:'M5',label:'Moment am Fußring',sym:'M5',unit:'kNm',def:220,min:'any'},
  {id:'Dt',label:'Ankerlochkreisdurchmesser',sym:'Dt',unit:'mm',def:2200},
  {id:'n',label:'Anzahl gleichmäßig verteilter Anker',sym:'n',unit:'–',def:12}
 ],
 help:'Historischer Teilnachweis nach S3/1 (09.2001), unverschwächte zylindrische Zarge. Schnittlasten und zulässige Spannung je Lastfall nach S3/0 vorgeben. Beulen, Anschluss, Fußring und Ankertragfähigkeit sind gesperrt; keine Gesamtfreigabe.',
 calc(g,H){
  const notes=[['w','Ausgabe S3/1 09.2001; Änderungen der Ausgabe 05.2018 nicht geprüft.'],
   ['w','UNVERIFIED: Beultragfähigkeit nach S3/1 §7 mit DASt 013 / Literatur [1]–[3] nicht verifiziert. Konservativ keine Drucktragfähigkeit für den Stabilitätsnachweis angesetzt.'],
   ['e','Anschlussnachweise nach §§4 und 6 (einschließlich Boden/Krempe und Schweißnähten), Fußring/Beton nach §8.3, Gleiten nach §8.1 und Ankertragfähigkeit nach S3/0 fehlen. Gesamtfreigabe gesperrt.']];
  const invalid=t=>({headline:{value:NaN,text:'Eingaben prüfen',unit:'N/mm²',label:'Zargenspannung',of:'Teilnachweis gesperrt'},util:NaN,pmax:NaN,test:null,rows:[],notes:notes.concat([['e',t]]),fail:true,ok:false,formula:'Keine Berechnung: '+t});
  for(const key of ['Da','sn','h','fZ','Dt','n'])if(!Number.isFinite(g[key])||g[key]<=0)return invalid('Positive endliche Eingabe erforderlich: '+key+'.');
  if(!['weight','F5','c1','c2'].every(k=>Number.isFinite(g[k])&&g[k]>=0)||![g.M,g.M5].every(Number.isFinite))return invalid('Kräfte und Zuschläge müssen endlich und nicht negativ, Momente endlich sein.');
  if(!Number.isInteger(g.n)||g.n<3)return invalid('Mindestens drei Anker, ganzzahlige Anzahl erforderlich.');
  if(g.opening!=='none')return invalid('Ausschnitte / Restquerschnitte nach §7 sind nicht implementiert.');
  // S3/1 §7: actual remaining ring section, e = se − Σc.
  // With no corrosion-side input, put all loss outside: this gives the
  // smallest area and elastic section modulus for the remaining thickness.
  const e=g.sn-g.c1-g.c2,da=g.Da-2*(g.c1+g.c2),di=g.Da-2*g.sn;
  if(e<=0||g.sn>=g.Da/2||di<=0||g.Dt<=g.Da)return invalid('Wirksame Dicke, Innendurchmesser oder außenliegender Ankerlochkreis unzulässig.');
  // S3/1 §7 Gl.(23): A4 und W4 des unverschwächten Kreisringquerschnitts.
  // Exakte geometrische Integration, keine Dünnwandnäherung; ΔM4=0 ohne Ausschnitt.
  const A=Math.PI/4*(da-di)*(da+di),I=Math.PI/64*(da-di)*(da+di)*(da*da+di*di),W=I/(da/2);
  // S3/1 §7 Gl.(23): σ4n = ±M4/W4 − F4/A4 (Zug positiv).
  // Einheiten kN→N und kNm→Nmm; §5: eingegebene resultierende Schnittgrößen.
  const F=g.weight*1000,M=Math.abs(g.M)*1e6,axial=F/A,bend=M/W;
  const sp=bend-axial,sq=-bend-axial,compression=axial+bend,tension=Math.max(0,sp),stress=Math.max(Math.abs(sp),Math.abs(sq));
  // S3/1 §7 Gl.(24): Betragsspannung konservativ gegen lastfallabhängiges fZ.
  const stressUtil=stress/g.fZ;
  // UNVERIFIED S3/1 §7: keine verifizierte Beulformel. Null Tragfähigkeit,
  // somit bei jeder Druckbeanspruchung unendliche Stabilitätsausnutzung.
  const bucklingAllow=0,bucklingUtil=compression>0?Infinity:0,util=Math.max(stressUtil,bucklingUtil);
  // S3/1 §8.2 Gl.(27): FKp = (4 M5/Dt − 0,9 F5)/n.
  // Negative Werte bedeuten keinen Zugbedarf, nicht eine negative Ankerzugkraft.
  const anchorRaw=(4*Math.abs(g.M5)*1e6/g.Dt-0.9*g.F5*1000)/g.n,anchor=Math.max(0,anchorRaw);
  if(compression>0)notes.push(['e','Druckspannung vorhanden: Stabilitätsnachweis offen, zulässige Beulspannung konservativ 0 N/mm².']);
  if(stressUtil>1)notes.push(['e','Zargenspannung überschreitet die vorgegebene zulässige Spannung.']);
  notes.push(['','Zuschläge konservativ vollständig außen abgezogen; Restquerschnitt mit kleinstem A4 und W4.']);
  notes.push(['w','Ankerkraft ist nur der Zugbedarf nach Gl. (27), kein Tragfähigkeitsnachweis. Vorspannung und sämtliche Lastfälle gesondert prüfen.'],['','Zargenhöhe nur zur Darstellung. Kein Innendruck in der offenen Zarge; Druckeinfluss im Bodenanschluss ist nicht nachgewiesen.']);
  return {headline:{value:stress,unit:'N/mm²',label:'maximale Zargenspannung',of:'zulässig '+H.fmt(g.fZ)+' N/mm² · Teilnachweis'},util,pmax:NaN,test:null,notes,fail:true,ok:false,
   rows:[['Wirksame Wanddicke','e',e,'mm'],['Konservativer Restaußendurchmesser','Da,eff',da,'mm'],['Querschnittsfläche','A4',A,'mm²'],['Flächenträgheitsmoment','I4',I,'mm⁴'],['Widerstandsmoment','W4',W,'mm³'],['Druck aus Gewicht','F4/A4',axial,'N/mm²'],['Biegeanteil','|M4|/W4',bend,'N/mm²'],['Längsspannung p (Zug positiv)','σ4p',sp,'N/mm²'],['Längsspannung q (Zug positiv)','σ4q',sq,'N/mm²'],['Maximale Druckspannung','σD',compression,'N/mm²'],['Maximale Zugspannung','σZ',tension,'N/mm²'],['Spannungsausnutzung ohne Beulen','ησ',stressUtil,'–'],['Beulgrenze (gesperrt)','σB,zul',bucklingAllow,'N/mm²'],['Rechnerische Ankerkraft, vor Begrenzung','FKp',anchorRaw,'N'],['Zugbedarf je Anker','FK,Z',anchor,'N']],
   formula:`e = se − c₁ − c₂ = ${H.fmt(e)} mm\nDa,eff = Da − 2(c₁+c₂) = ${H.fmt(da)} mm\nA₄ = π(Da,eff² − Di²)/4 = ${H.fmt(A)} mm²\nW₄ = π(Da,eff⁴ − Di⁴)/(32Da,eff) = ${H.fmt(W)} mm³\nσ₄p,q = ±|M₄|/W₄ − F₄/A₄ = ${H.fmt(sp)} / ${H.fmt(sq)} N/mm²\nησ = max|σ₄n|/fZ = ${H.fmt(stressUtil)}\nUNVERIFIED: Beulgrenze = 0 N/mm²; Gesamtfreigabe gesperrt.\nFKp = (4|M₅|/Dt − 0,9F₅)/n = ${H.fmt(anchorRaw)} N\nZugbedarf = max(0; FKp) = ${H.fmt(anchor)} N`};
 },
 draw(g,H,r){
  g=g||{};
  const D=H.draw,W=420,V=310,empty=()=>D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Standzarge S3/1',sub:'Teilnachweis · Schnittansicht'});
  if(![g.Da,g.sn,g.h].every(x=>Number.isFinite(x)&&x>0)||g.sn>=g.Da/2)return empty();
  // Reine Zeichnungsgeometrie; Behälter und Fußring schematisch, ohne Dickenmaß.
  const k=D.fit(g.Da,g.h,220,130,5),w=Math.max(60,g.Da*k),h=Math.max(60,g.h*k),x=210-w/2,y=246-h;
  const t=Math.min(w/4,Math.max(5,g.sn*k));
  const cls=r&&(r.ok===false||r.fail||r.util>1)?'o bad':'o';
  let b=D.text(16,22,'Längsschnitt · Behälter schematisch','start','tx tb2');
  b+=D.path(`M ${x} ${y} L ${x} ${y-48} Q 210 ${y-78} ${x+w} ${y-48} L ${x+w} ${y} Q 210 ${y+36} ${x} ${y}`,'o');
  b+=D.rect(x,y,t,h,cls,true)+D.rect(x+w-t,y,t,h,cls,true);
  b+=D.rect(x-12,246,w+24,6,'o',2)+D.line(x-24,256,x+w+24,256,'t');
  b+=D.centre(210,Math.max(28,y-72),210,263);
  b+=D.dim(x,246,x+w,246,24,'Da '+H.fmt(g.Da,0)+' mm');
  b+=D.dim(x+w,y,x+w,246,-26,'hZ '+H.fmt(g.h,0)+' mm');
  b+=D.leader(x+t/2,y+h*.55,24,192,'se '+H.fmt(g.sn,1)+' mm');
  b+=D.line(210,Math.max(30,y-63),210,Math.max(48,y-42),'d').replace('/>',' marker-end="url(#tza)"/>');
  b+=D.text(270,52,'F₄ '+H.fmt(g.weight,1)+' kN','start','tx dt');
  b+=D.text(270,67,'M₄ '+H.fmt(g.M,1)+' kNm','start','tx dt');
  b+=D.text(16,279,(w!==g.Da*k||h!==g.h*k)?'Geometrie schematisch; Wand überhöht':t>g.sn*k?'Wanddicke überhöht dargestellt':'Wanddicke maßstäblich','start','tx tb2');
  return D.svg(W,V,b,{title:'Standzarge S3/1',sub:'09.2001 · Anschluss nicht nachgewiesen'}).replaceAll('y="-3"','y="0" dy="-3"');
 }
});
})(typeof globalThis!=='undefined'?globalThis.AD:window.AD);
