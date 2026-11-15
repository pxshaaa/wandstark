/* AD 2000 B4, Ausgabe 10.2000, Tellerböden.
 * Primärtext (gescannte Merkblatt-Ausgabe, Textvorschau):
 * (Normtext, nicht verlinkt)
 * Umfang: §8.1 / Bild 2, gleiche Dicke in Kalotte und Flansch,
 * durchgehende Dichtung, Innendruck, ohne Ausschnitte und Zusatzlasten.
 * Gl. (6)–(8) verifiziert gegen AD 2000 B4 (10.2000), Taschenbuch 2016 S. 218–222, Bild 3 (Review 13.11.2026).
 */
(function(AD){
'use strict';
AD.register({
  id:'b4',name:'Tellerboden',code:'B4',group:'Böden',
  icon:'<path d="M3 25h9Q22 4 32 25h9M3 29h11Q22 10 30 29h11"/>',
  fields:[
    {id:'attachment',label:'Anschluss / Dichtung',type:'select',def:'equal',options:[['equal','Gleiche Dicke, durchgehende Dichtung'],['inside','Gleiche Dicke, innenliegende Dichtung (gesperrt)'],['loose','Losflansch (gesperrt)'],['reinforced','Verstärkter Flansch (gesperrt)'],['welded','Angeschweißter Boden (gesperrt)']]},
    {id:'R',label:'Innerer Wölbungsradius',sym:'R',unit:'mm',def:600},
    {id:'di',label:'Lichter Kalottendurchmesser am Flansch',sym:'di',unit:'mm',def:600},
    {id:'Da',label:'Flansch-Außendurchmesser',sym:'da',unit:'mm',def:800},
    {id:'dk',label:'Schraubenlochkreis (nur Zeichnung)',sym:'dk',unit:'mm',def:720},
    {id:'sn',label:'Dicke in Kalotte und Flansch',sym:'se',unit:'mm',def:24},
    {id:'r',label:'Übergangsradius',sym:'r',unit:'mm',def:24}
  ],
  help:'B4 §8.1, Bild 2: durchgehende Dichtung, gleiche Dicke in Kalotte und Flansch. Der Beiwert wird mit β = max(1,85; 1 + 0,833·√(R/t)·sin α·cos α) berechnet; t ist die Wanddicke nach Abzug der Zuschläge, sin α = di/(2R). Schrauben, Dichtung und Gegenflansch separat nach B7/B8 nachweisen. Keine Ausschnitte, äußeren Lasten oder Außendruck.',
  calc(g,H){
    H=H||AD.h;
    const notes=[],rows=[];let fail=false;
    const error=s=>{fail=true;notes.push(['e',s]);};
    const result=(s=NaN,pm=NaN,test=null,formula='Keine gültige Berechnung möglich.')=>({
      headline:{value:s,unit:'mm',label:'mm erforderlich',of:'ausgeführt '+H.fmt(g&&g.sn,1)+' mm'},
      util:s/(g&&g.sn),pmax:pm,test,rows,notes,fail,formula
    });
    if(!g||!['R','di','Da','dk','sn','r','K','K20','S','ST','v'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
       !['p','c1','c2'].every(k=>Number.isFinite(g[k])&&g[k]>=0)||g.v>1){
      error('Ungültige Eingaben: Maße und Kennwerte positiv, Druck und Zuschläge nichtnegativ; 0 < v ≤ 1.');return result();
    }
    if(g.attachment!=='equal') error('Dieser Anschluss ist nicht implementiert. Berechnet wird ausschließlich B4 §8.1, Bild 2, mit durchgehender Dichtung.');
    // B4 §7 verweist auf B0 §9: Abzug der Zuschläge von der Nennwand.
    const c=g.c1+g.c2,t=g.sn-c;
    // B4 §1, Gl. (1): 0,005 <= (se-c1-c2)/R <= 0,1.
    const rel=t/g.R;
    rows.push(['Wirksame Wanddicke','t',t,'mm'],['Relatives Dickenverhältnis','t/R',rel,'–']);
    if(rel<0.005||rel>0.1) error('B4 §1: 0,005 ≤ (se−c1−c2)/R ≤ 0,1 ist nicht erfüllt.');
    // B4 §8.1 Gl. (7)/(8), geometrische Existenz der Kugelkalotte.
    if(g.di>2*g.R||g.di>=g.dk||g.dk>=g.Da) error('Geometrie erforderlich: di ≤ 2·R und di < dk < da.');
    // B4 §10.1: 2 mm Mindestdicke; Ausnahmen werden nicht ausgenutzt.
    if(g.sn<2) error('B4 §10: kleinste Wanddicke von 2 mm unterschritten.');
    // B4 §2.3: mindestens 6 mm; konservativ auch Forderung für A5<10%
    // auf alle Werkstoffe angewandt, damit kein unbekannter A5-Wert benötigt wird.
    if(g.r<Math.max(6,Math.min(g.sn,30))) error('B4 §2.3: r ≥ max(6 mm, min(se, 30 mm)) wird hier für alle Werkstoffe gefordert.');
    if(fail)return result();
    if(!(g.di>0&&g.di<=2*g.R)){notes.push(['e','di muss zwischen 0 und 2·R liegen (sin α = di/(2R) ≤ 1, B4 Bild 3: di/R ≤ 2).']);fail=true;}
    notes.push(['','β nach B4 Gl. (5a)–(8): β = max(1,85; 1 + 0,833·√(R/t)·sin α·cos α), sin α = di/(2R); C_A = 0 (durchgehende Dichtung).']);
    notes.push(['w','Nachweis nur für Tellerboden mit durchgehender Dichtung. Schrauben, Dichtung und Gegenflansch nach B7/B8 separat nachweisen.']);
    notes.push(['','Keine Ausschnitte oder Zusatzlasten; kein Nachweis für Außendruck. Übergangsradius konservativ für geringe Bruchdehnung geprüft.']);
    // B4 §8.1 Gl. (5), (5a), (6), Untergrenze nach Gl. (8):
    // CA=0 für durchgehende Dichtung (§8.1, vor Gl. 9).
    // B4 §8.1 Gl. (5a), (6), (7), (8): β1 = 1 + 0,833·√(R/t)·sinα·cosα; β ≥ 1,85; C_A = 0 bei durchgehender Dichtung.
    const sinA=Math.min(1,g.di/(2*g.R)), cosA=Math.sqrt(Math.max(0,1-sinA*sinA));
    const beta=x=>Math.max(1.85,1+0.833*Math.sqrt(g.R/x)*sinA*cosA);
    // B4 §8.1 Gl. (5) umgestellt nach p [bar], t [mm], K [N/mm²].
    const pressure=(x,K,S)=>20*K*g.v*x/(S*g.R*beta(x));
    // B4 Gl. (5) implizit; monoton steigende Kapazität. Numerische Inversion,
    // kein Regelwerksbeiwert: Bisektion nur im Anwendungsbereich Gl. (1).
    const required=(p,K,S,allowance)=>{
      const lo=0.005*g.R,hi=0.1*g.R;
      const cap=pressure(hi,K,S);
      if(!Number.isFinite(p)||!Number.isFinite(cap)||!(cap>0)||p>cap)return Infinity;
      return Math.max(2,H.solve(x=>pressure(x,K,S)-p,lo,hi)+allowance);
    };
    const s=required(g.p,g.K,g.S,c),pm=pressure(t,g.K,g.S);
    // Gemeinsame PED-Prüfdruckkonvention aus H.PT (p als PS), wie B1.
    // UNVERIFIED: Prüfzustandsübertragung von B4 Gl. (5) mit K20/S',
    // c1 UND c2 bleiben konservativ erhalten (keine Korrosionsgutschrift).
    const PT=H.PT(g),sT=required(PT,g.K20,g.ST,c);
    const test={PT,req:sT,have:g.sn,unit:'mm',ok:Number.isFinite(PT)&&Number.isFinite(sT)&&sT<=g.sn,
      note:'Vorbemessung mit K20/S′; c1 und c2 bleiben erhalten. p als PS. Prüfzustandsübertragung UNVERIFIED.'};
    notes.push(['w','UNVERIFIED: Prüfzustand aus Innendruckgleichung mit K20 und S′ übertragen; beide Zuschläge bleiben konservativ erhalten.']);
    if(![s,pm,PT,sT,g.K/g.S,beta(t)].every(Number.isFinite)||!(pm>0))error('Zahlenbereich überschritten; keine verwertbare Berechnung oder Druckfreigabe.');
    if(s>g.sn)error('Betriebszustand: ausgeführte Dicke kleiner als erforderlich.');
    if(!test.ok)error('Prüfzustand: ausgeführte Dicke kleiner als erforderlich.');
    if(!Number.isFinite(s)||!Number.isFinite(sT))error('Erforderliche Dicke außerhalb t/R ≤ 0,1; keine Extrapolation.');
    rows.push(['Berechnungsdruck','p',g.p,'bar'],['Zulässige Spannung','K/S',g.K/g.S,'N/mm²'],
      ['Wölbungsradius','R',g.R,'mm'],['Lichter Durchmesser','di',g.di,'mm'],['Beiwert bei vorhandener Dicke','β',beta(t),'–'],['Winkelfunktion','sinα·cosα',sinA*cosA,'–'],
      ['Erforderliche Dicke einschließlich Zuschläge','s',s,'mm'],['Zulässiger Druck (Vorbemessung)','p_zul',pm,'bar']);
    return result(s,pm,test,
      'B4 §8.1: s = max(2 mm; max(0,005·R; p·R·β / (20·K/S·v)) + c1 + c2)\n'+
      'β = max(1,85; 1 + 0,833·√(R/t)·sinα·cosα), sinα = di/(2R) = '+H.fmt(sinA,3)+', t = s−c1−c2\n'+
      'Iterativ: s = '+H.fmt(s,3)+' mm; Zuschläge '+H.fmt(c,2)+' mm\n'+
      'Bei se = '+H.fmt(g.sn,2)+' mm: β = '+H.fmt(beta(t),3)+', p_zul = '+H.fmt(pm,3)+' bar\n'+
      'Prüfzustand: p′ = '+H.fmt(PT,3)+' bar; s′ = '+H.fmt(sT,3)+' mm');
  },
  draw(g,H,r){
    H=H||AD.h;const D=H.draw,W=420,V=310;
    const empty=()=>D.svg(W,V,D.text(210,135,'Maße eingeben'),{title:'Tellerboden B4',sub:'Halbschnitt · Maße in mm'});
    if(!g||g.attachment!=='equal'||!['R','di','Da','dk','sn','r'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
       g.di>2*g.R||g.di>=g.dk||g.dk>=g.Da||g.sn>=g.R)return empty();
    // Reine Zeichnungsgeometrie einer Kugelkalotte: Kreisprofil; Flansch
    // und verrundeter Anschluss schematisch, keine Nachweisformel.
    const half=g.di/2,h=half*half/(g.R+Math.sqrt(g.R*g.R-half*half));
    const k=D.fit(g.Da,h+g.sn,330,148,5),a=half*k,A=g.Da*k/2,B=g.dk*k/2;
    if(!Number.isFinite(k)||a<12||A<20)return empty();
    const x=210,y=176,t=Math.min(18,Math.max(5,g.sn*k)),rise=h*k;
    const R=g.R*k,cy=y+R-rise;
    const yy=dx=>cy-Math.sqrt(Math.max(0,R*R-dx*dx));
    const inner=[],outer=[];
    for(let i=0;i<=40;i++){const dx=a*i/40;inner.push([x+dx,yy(dx)]);outer.push([x+dx,yy(dx)-t]);}
    const bad=r&&(r.ok===false||r.fail||r.util>1||r.test&&r.test.ok===false),cls=bad?'o bad':'o';
    let b=D.text(14,22,'Halbschnitt · Flanschanschluss schematisch','start','tx tb2');
    // Rechts geschnitten, links Außenansicht; Übergangsradius per Hinweis.
    b+=D.poly([...outer,[x+A,y-t],[x+A,y],...inner.reverse()],cls,true);
    b+=D.pline(outer.map(p=>[2*x-p[0],p[1]]),'o');
    b+=D.line(x-a,y-t,x-A,y-t)+D.line(x-A,y-t,x-A,y)+D.line(x-A,y,x-a,y);
    b+=D.centre(x,Math.max(30,y-rise-t-12),x,219);
    b+=D.centre(x-A-9,y,x+A+9,y);
    // Schraubenachsen (Bohrungsdurchmesser nicht gegeben, daher keine Bohrung).
    b+=D.centre(x-B,y-20,x-B,y+12)+D.centre(x+B,y-20,x+B,y+12);
    b+=D.dim(x-A,y,x+A,y,62,'da '+H.fmt(g.Da,1));
    b+=D.dim(x-a,y,x+a,y,26,'di '+H.fmt(g.di,1));
    b+=D.dim(x-B,y,x+B,y,44,'dk '+H.fmt(g.dk,1));
    b+=D.leader(x+0.3*a,yy(0.3*a),270,42,'R '+H.fmt(g.R,1));
    b+=D.leader(x+0.72*a,yy(0.72*a)-t/2,330,82,'se '+H.fmt(g.sn,1));
    b+=D.leader(x+a,y-t/2,320,119,'r '+H.fmt(g.r,1));
    for(const f of [0.2,0.55]){
      const xx=x+a*f,Y=yy(a*f);
      b+=D.line(xx,Y+30,xx,Y+4,'d').replace('/>',' marker-end="url(#tza)"/>');
    }
    b+=D.text(85,60,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
    b+=D.text(14,258,'Durchgehende Dichtung · gleiche Dicke','start','tx tb2');
    b+=D.text(14,273,'Schraubenachsen: ohne Bohrungsnachweis','start','tx tb2');
    if(Math.abs(t-g.sn*k)>1e-6)b+=D.text(14,300,'Wand überhöht','start','tx tb2');
    return D.svg(W,V,b,{title:'Tellerboden B4',sub:'Halbschnitt · Anschluss schematisch'});
  }
});
})(globalThis.AD);
