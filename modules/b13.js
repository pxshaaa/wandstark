/* AD 2000 B13 (07/2012), Teilnachweis für einwandige U-Bälge.
 * Originaltext, Seiten 2–9, insbesondere §1, §3, §5, §6 und Gl. (16):
 * (Normtext, nicht verlinkt)
 * Bewusst KEIN vollständiger B13-Nachweis. Keine EJMA-Ersatzformeln.
 */
(function(AD){
'use strict';
AD.register({
 id:'b13',name:'Kompensator',code:'B13',group:'Verbindungen',
 icon:'<path d="M3 25h4V9h6v16h6V9h6v16h6V9h6v16h4"/>',
 fields:[
  {id:'Di',label:'Innendurchmesser der Innenwelle',sym:'di',unit:'mm',def:400},
  {id:'w',label:'Wellenhöhe',sym:'h',unit:'mm',def:40},
  {id:'q',label:'Wellenteilung in neutraler Lage',sym:'l',unit:'mm',def:20},
  {id:'s',label:'Minimale Lagendicke nach Umformung',sym:'s',unit:'mm',def:1,help:'Kleinste nachgewiesene Wanddicke einschließlich Fertigungstoleranz; keine Ausgangsblechdicke.'},
  {id:'r',label:'Mittlerer Krempenradius',sym:'r',unit:'mm',def:5,help:'Erforderlicher B13-Geometrieparameter; hier nur parallele U-Flanken mit l = 4r.'},
  {id:'n',label:'Anzahl der Lagen',sym:'np',unit:'–',def:1,help:'B13 gilt nur für eine Lage. Mehrlagige Bälge werden gesperrt.'},
  {id:'z',label:'Anzahl der Wellen',sym:'z',unit:'–',def:6},
  {id:'movement',label:'Einseitiger axialer Gesamtweg',sym:'Δ',unit:'mm',def:6,min:'zero',help:'Aus der neutralen Lage; keine laterale oder angulare Bewegung.'}
 ],
 help:'Nur mittlere Umfangsspannung nach B13 §6.2.1 (16). Gesamtfreigabe gesperrt: Vergleichsspannung, Bewegung, Ermüdung, Instabilität und Prüfzustand fehlen. Keine zusätzlichen Kräfte oder Torsion.',
 calc(g,H){
  H=H||AD.h;g=g||{};
  const notes=[['w','UNVERIFIED: Gesamtbewertung gesperrt. Meridionale Membran- und Biegespannungen sowie Druckvergleichsspannung nicht nachgewiesen (B13 §6.1.1, §6.1.6 und §6.5: Rechenstützwerte fehlen).'],
   ['w','UNVERIFIED: Bewegungsbeanspruchung und zulässige Lastspielzahl nicht nachgewiesen (B13 §6.1.3 und §6.3, Gl. 18–23). Keine Lastspielzahl ohne Spannungsschwingbreite.'],
   ['w','UNVERIFIED: Säulen- und Welleninstabilität sowie Prüfzustand nicht nachgewiesen (B13 §6.2.2, Gl. 17a/17b; §6.2.1).']];
  const rows=[];
  const reject=t=>notes.push(['e',t]);
  const pos=['Di','w','q','s','r','n','z','K','v'];
  let valid=pos.every(k=>Number.isFinite(g[k])&&g[k]>0)&&Number.isFinite(g.p)&&g.p>=0&&Number.isFinite(g.movement)&&g.movement>=0;
  if(!valid)reject('Endliche positive Maße, Festigkeit und Nahtwertigkeit sowie nichtnegativer Druck und Axialweg erforderlich.');
  if(valid){
   // B13 §1: ausschließlich einwandig; keine Tragfähigkeitssteigerung durch np.
   if(g.n!==1){valid=false;reject('Mehrlagigkeit liegt außerhalb B13 §1; keine Addition der Lagendicken.');}
   if(!Number.isInteger(g.z)||!Number.isInteger(g.n)){valid=false;reject('Wellen- und Lagenzahl müssen ganzzahlig sein.');}
   // B13 §3: di = d − s, also d = di + s (s hier nachgewiesenes Mindestmaß).
   const d=g.Di+g.s;
   // B13 §1: 3 ≤ d/h ≤ 100, 0,1 ≤ r/h ≤ 0,5, 0,018 ≤ s/h ≤ 0,1.
   rows.push(['Durchmesserverhältnis','d/h',d/g.w,'–'],['Krempenverhältnis','r/h',g.r/g.w,'–'],['Dickenverhältnis','s/h',g.s/g.w,'–']);
   if(d/g.w<3||d/g.w>100||g.r/g.w<0.1||g.r/g.w>0.5||g.s/g.w<0.018||g.s/g.w>0.1){valid=false;reject('Geometrie außerhalb der Grenzen nach B13 §1.');}
   // Bild 1: idealisierte parallele Flanken, vier Viertelkreise pro Teilung.
   if(Math.abs(g.q-4*g.r)>1e-8*Math.max(g.q,4*g.r)||g.w<2*g.r){valid=false;reject('Hier nur ideale U-Wellen mit l = 4r und h ≥ 2r; andere Profile gesperrt.');}
   // B13 §5: keine Zuschläge. §2.5: Korrosion nicht durch Dickenzuschlag abdecken.
   if(g.v>1||!Number.isFinite(g.c1)||!Number.isFinite(g.c2)||g.c1!==0||g.c2!==0){valid=false;reject('Nahtwertigkeit muss ≤ 1 sein; c1 und c2 müssen null sein (B13 §5). Fertigungstoleranz bereits im Mindestmaß s berücksichtigen.');}
  }
  let sigma=NaN,allow=NaN,u=NaN;
  if(valid){
   // B13 §3 d=di+s; §6.2.1 Gl. (16), MT=0, Sum=1,5 (NICHT g.S).
   const d=g.Di+g.s;
   const numerator=(d+g.w)*g.q*g.p,denominator=40*g.s*(1.14*g.r+g.w)*g.v;
   // An overflowed denominator must never masquerade as zero stress.
   sigma=Number.isFinite(numerator)&&Number.isFinite(denominator)&&denominator>0?numerator/denominator:NaN;
   allow=g.K/1.5;
   u=sigma/allow;
   if(![sigma,allow,u].every(Number.isFinite)){valid=false;reject('Zahlenbereich überschritten; keine verwertbare Teilrechnung.');sigma=allow=u=NaN;}
   else if(u>1)reject('Mittlere Umfangsspannung überschreitet K/1,5 nach B13 §6.2.1 (16).');
  }
  rows.push(['Mittlere Umfangsspannung (Teilnachweis)','σum',sigma,'N/mm²'],['Zulässige Umfangsspannung','K/1,5',allow,'N/mm²'],['Ausnutzung nur Umfangsspannung','Uum',u,'–'],
   ['Meridionale Membranspannung: nicht nachgewiesen','σm',NaN,'N/mm²'],['Meridionale Biegespannung: nicht nachgewiesen','σb',NaN,'N/mm²'],['Zulässige Lastspielzahl: nicht nachgewiesen','Nzul',NaN,'–']);
  // UNVERIFIED: Kein endlicher konservativer Ersatz für fehlende Tabellen,
  // Randbedingungen und Lastkollektive. Infinity + fail=true verhindern Freigabe.
  return {headline:{value:NaN,text:'Nachweis offen',unit:'N/mm²',label:'B13 unvollständig',of:valid?'Umfangsspannung '+H.fmt(sigma,2)+' N/mm²':'Teilrechnung gesperrt'},
   util:Infinity,pmax:NaN,test:null,rows,notes,fail:true,
   formula:valid?'Teilnachweis B13 §6.2.1 (16), ohne Torsion:\nσum = (di+s+h)·l·p / [40·s·(1,14r+h)·v]\nσum = '+H.fmt(sigma,3)+' N/mm²; K/1,5 = '+H.fmt(allow,3)+' N/mm²\nUum = '+H.fmt(u,3)+'\nGesamtnachweis offen; kein zulässiger Gesamtdruck.':'Keine gültige B13-Teilrechnung; siehe Hinweise.'};
 },
 draw(g,H,result){
  H=H||AD.h;
  const D=H.draw,W=420,V=310;
  const empty=()=>D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Kompensator B13',sub:'Axialer Halbschnitt'});
  if(!g||!['Di','w','q','s','r','n','z'].every(k=>Number.isFinite(g[k])&&g[k]>0)||!Number.isInteger(g.z)||!Number.isInteger(g.n)||!Number.isFinite(g.movement)||g.movement<0)return empty();
  // Ausschließlich schematische Zeichnungsgeometrie, keine Berechnungsformel.
  const count=Math.min(g.z,4),k=D.fit(count*g.q,g.w,290,130,4);
  if(!Number.isFinite(k)||k<=0||![g.q*k,g.w*k,g.s*k].every(Number.isFinite))return empty();
  const pitch=Math.max(24,g.q*k),height=Math.max(24,Math.min(110,g.w*k)),rad=Math.min(pitch/4,height/2),left=70,base=164,top=base-height;
  const layers=Math.min(g.n,3),t=Math.max(5,Math.min(9,g.s*k)),cls=result&&(result.ok===false||result.fail||result.util>1)?'o bad':'o';
  const pts=[[left,base]];
  for(let j=0;j<count;j++){
   const x=left+j*pitch;
   // Four quarter-circle bends with parallel straight flanks (ideal U-profile).
   for(let a=0;a<=8;a++){const q=a*Math.PI/16;pts.push([x+rad*Math.sin(q),base-rad+rad*Math.cos(q)]);}
   pts.push([x+rad,top+rad]);
   for(let a=0;a<=16;a++){const q=Math.PI-a*Math.PI/16;pts.push([x+2*rad+rad*Math.cos(q),top+rad-rad*Math.sin(q)]);}
   pts.push([x+3*rad,base-rad]);
   for(let a=0;a<=8;a++){const q=Math.PI-a*Math.PI/16;pts.push([x+4*rad+rad*Math.cos(q),base-rad+rad*Math.sin(q)]);}
   pts.push([x+pitch,base]);
  }
  let b=D.text(14,21,'Axialer Halbschnitt · schematisch','start','tx tb2');
  for(let i=0;i<layers;i++)b+=D.poly(pts.map(([x,y])=>[x,y-i*t]).concat([...pts].reverse().map(([x,y])=>[x,y-(i+1)*t])),cls,i%2?2:true);
  const right=left+count*pitch;
  b+=D.centre(42,220,398,220);
  b+=D.dim(left,base,left,220,23,'di/2 '+H.fmt(g.Di/2,1));
  b+=D.dim(left,top,left,base,-(right-left+22),'h '+H.fmt(g.w,1));
  b+=D.dim(left,base,left+pitch,base,29,'l '+H.fmt(g.q,1));
  b+=D.leader(left+pitch/2,top-layers*t,170,38,'s '+H.fmt(g.s,2)+' mm; '+H.fmt(g.n,0)+' Lage(n)');
  b+=D.text(82,243,'z = '+H.fmt(g.z,0)+'; Δ = '+H.fmt(g.movement,1)+' mm','start','tx tb2');
  b+=D.text(14,262,'Wanddicke überhöht; max. vier Wellen gezeigt','start','tx tb2');
  return D.svg(W,V,b,{title:'Kompensator B13',sub:'U-Balg · Teilnachweis ohne Freigabe'});
 }
});
})(typeof globalThis!=='undefined'?globalThis.AD:window.AD);
