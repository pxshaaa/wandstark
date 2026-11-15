/* AD 2000 B1: cylindrical and spherical shells under internal pressure; B3 dished heads; B5 flat ends. */
(function(AD){
const H = AD.h;
const Pt = (g) => H.PT(g);
// Only remove roundoff at equality (16 floating-point ulps), never an engineering tolerance.
const snap = (x, have) => Number.isFinite(x)&&Number.isFinite(have)&&Math.abs(x-have)<=16*Number.EPSILON*Math.max(Math.abs(x),Math.abs(have)) ? have : x;
// Audit every published numeric value; finite inputs can still overflow intermediate arithmetic.
const finish = r => {
  const values=[r.headline.value,r.util,r.pmax,...r.rows.map(x=>x[2]),
    ...(r.test?[r.test.PT,r.test.req,r.test.have]:[])];
  if(!r.fail&&!values.every(Number.isFinite)) return rejected('Numerischer Wertebereich überschritten oder keine wirksame Wanddicke; kein Nachweis möglich.');
  if(!values.every(Number.isFinite)) r.fail=true;
  return r;
};
// Overall utilization includes service, proof load and (B5) deformation; headline remains explicitly service-only.
function governing(g, rows, notes, service, proof, extra=0){
  const need=snap(Math.max(service,proof,extra),g.sn);
  rows.push(['Betriebszustand erforderlich','s_B',service,'mm'],['Prüfzustand erforderlich','s_P',proof,'mm']);
  rows.push(['Maßgebende Wanddicke Betrieb/Prüfung','s_ma',need,'mm']);
  if(proof>g.sn){notes.push(['e','Prüfzustand: ausgeführte Wanddicke kleiner als erforderlich.']);}
  return need;
}
// B0 units/domains; validate before arithmetic, including proof-load inputs.
const invalid = (g, extra, weld=true) =>
  [...extra,'sn','K','K20','S','ST',...(weld?['v']:[])].some(k=>!Number.isFinite(g[k])||g[k]<=0)||
  [...extra,'sn','K','K20','S','ST','p','T','c1','c2'].some(k=>Math.abs(g[k])>1e100)||
  (weld&&g.v>1)||g.S<1.5||g.ST<1.05||(!Number.isFinite(g.T)||g.T< -273.15)||!Number.isFinite(g.p)||g.p<0||
  ['c1','c2'].some(k=>!Number.isFinite(g[k])||g[k]<0);
const rejected = text => ({headline:{value:NaN,unit:'mm',label:'Eingaben prüfen'},
  util:Infinity,pmax:NaN,test:null,rows:[],notes:[['e',text]],fail:true,formula:''});

// Drawing-only helpers; no influence on the calculation or its applicability.
const drawBad = r => !!r && (r.ok === false || r.fail || r.util > 1);
const drawArrow = (D,x1,y1,x2,y2) => D.line(x1,y1,x2,y2,'d').replace('/>', ' marker-end="url(#tza)"/>');
function drawSphere(g,H,r){
  g=g||{};
  const D=H.draw,W=420,V=290;
  if(!Number.isFinite(g.Da)||!Number.isFinite(g.sn)||g.Da<1e-6||g.sn<=0||g.sn>=g.Da/2)
    return D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Kugelschale B1',sub:'Schnitt A–A'});
  const k=D.fit(g.Da,g.Da,200,200,20),R=g.Da*k/2,t=Math.min(R-5,Math.max(5,g.sn*k)),a=R-t,cx=210,cy=119;
  // Geometrischer Kreisring (B1, Kugelschale); gegenläufige Innenkontur lässt den Druckraum frei.
  let b=D.path(`M ${cx-R} ${cy} a ${R} ${R} 0 1 0 ${2*R} 0 a ${R} ${R} 0 1 0 ${-2*R} 0 Z M ${cx-a} ${cy} a ${a} ${a} 0 1 1 ${2*a} 0 a ${a} ${a} 0 1 1 ${-2*a} 0 Z`,drawBad(r)?'o bad':'o',true);
  b+=D.centre(cx-R-12,cy,cx+R+12,cy)+D.centre(cx,cy-R-12,cx,cy+R+12);
  for(const q of [-Math.PI/2,0,Math.PI/2,Math.PI])
    b+=drawArrow(D,cx+(a-28)*Math.cos(q),cy+(a-28)*Math.sin(q),cx+(a-4)*Math.cos(q),cy+(a-4)*Math.sin(q));
  b+=D.text(cx,cy+17,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
  b+=D.tag('Da',D.dim(cx-R,cy+R,cx+R,cy+R,23,'Da '+H.fmt(g.Da,1)+' mm'));
  b+=D.tag('sn',D.dim(cx+a,cy,cx+R,cy,-85,'se '+H.fmt(g.sn,1)));
  b+=D.text(16,22,'Schnitt A–A','start','tx tb2');
  if(t!==g.sn*k) b+=D.text(14,246,t>g.sn*k?'Wanddicke überhöht dargestellt':'Wanddicke schematisch dargestellt','start','tx tb2');
  return D.svg(W,V,b,{title:'Kugelschale B1',sub:'Da '+H.fmt(g.Da,0)+' × '+H.fmt(g.sn,1)+' mm'});
}


function shell(kind){
  const k = kind === 'cyl' ? 20 : 40;
  const req = (Da,p,K,S,v) => Da*p/(k*K/S*v + p);
  const pmax = (Da,se,K,S,v) => k*K/S*v*se/(Da - se);
  return {
    id: kind, name: kind==='cyl' ? 'Zylinder' : 'Kugel', code: 'B1', group: 'Schalen',
    icon: kind==='cyl'
      ? '<ellipse cx="9" cy="17" rx="5" ry="12"/><path d="M9 5h26M9 29h26"/><path d="M35 5a5 12 0 0 1 0 24"/>'
      : '<circle cx="22" cy="17" r="13"/><ellipse cx="22" cy="17" rx="13" ry="4" stroke-dasharray="3 3"/>',
    fields: [
      {id:'Da', label:'Außendurchmesser', sym:'Da', unit:'mm', def:508},
      {id:'sn', label:'Ausgeführte Wanddicke', sym:'se', unit:'mm', def:8}
    ],
    draw(g,H,r){
      g=g||{};
      if(kind==='sph') return drawSphere(g,H,r);
      const D=H.draw, W=420, Hh=290, cy=116;
      const ok=Number.isFinite(g.Da)&&g.Da>=1&&Number.isFinite(g.sn)&&g.sn>0&&g.sn<g.Da/2; if(!ok) return D.svg(W,Hh,D.text(W/2,Hh/2,'Maße eingeben'),{title:'Zylinderschale',sub:'AD 2000 B1'});
      // left: cross-section (section A-A), right: longitudinal half-section
      const R=78, k=R/(g.Da/2), t=Math.max(g.sn*k,6), cx=100;
      let b=D.circle(cx,cy,R,'o',true)+D.circle(cx,cy,R-t,'o')+`<circle cx="${cx}" cy="${cy}" r="${R-t}" class="frame2"/>`+D.circle(cx,cy,R-t,'o');
      b+=D.centre(cx-R-10,cy,cx+R+10,cy)+D.centre(cx,cy-R-10,cx,cy+R+10);
      b+=D.tag('Da',D.dim(cx-R,cy+R+4,cx+R,cy+R+4,14,'Da '+H.fmt(g.Da,1)));
      b+=D.tag('sn',D.leader(cx+R*0.71-t*0.35,cy-R*0.71+t*0.35,cx+R+8,cy-R-6,'se '+H.fmt(g.sn,1)));
      b+=D.text(cx,cy-R-14,'Schnitt A–A','middle','tx tb2');
      // longitudinal view
      const x0=215,x1=395, top=cy-R, bot=cy+R;
      b+=D.rect(x0,top,x1-x0,t,'o',true)+D.rect(x0,bot-t,x1-x0,t,'o',true);
      b+=D.line(x0,top+t,x0,bot-t,'t')+D.line(x1,top+t,x1,bot-t,'t');
      b+=D.centre(x0-10,cy,x1+10,cy);
      const pp=[0.25,0.5,0.75].map(f=>x0+(x1-x0)*f);
      pp.forEach(x=>{b+=`<line x1="${x}" y1="${cy-22}" x2="${x}" y2="${top+t+3}" class="d" marker-end="url(#tza)"/><line x1="${x}" y1="${cy+22}" x2="${x}" y2="${bot-t-3}" class="d" marker-end="url(#tza)"/>`;});
      b+=D.text((x0+x1)/2,cy+4,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
      b+=D.tag('Da',D.dim(x0-4,top,x0-4,bot,12,'Da'));
      if(t>g.sn*k) b+=D.text(14,Hh-44,'Wanddicke überhöht dargestellt','start','tx tb2');
      return D.svg(W,Hh,b,{title:'Zylinderschale B1',sub:`Da ${H.fmt(g.Da,0)} × ${H.fmt(g.sn,1)} mm`+(r&&Number.isFinite(r.headline&&r.headline.value)?` · s erf. ${H.fmt(r.headline.value,2)} mm`:'')});
    },
    calc(g){
      if(invalid(g,['Da'])) return rejected('Eingaben prüfen: endliche Maße und Kennwerte > 0, S ≥ 1,5, S′ ≥ 1,05; Druck und Zuschläge nicht negativ, 0 < v ≤ 1.');
      const notes=[], c=g.c1+g.c2, seff=g.sn-c; let fail=false;
      const s0=req(g.Da,g.p,g.K,g.S,g.v), sReq=snap(Math.max(2,s0+c),g.sn);
      const q=Pt({...g,p:1});
      const pm = seff>0 ? Math.min(pmax(g.Da,seff,g.K,g.S,g.v),pmax(g.Da,g.sn-g.c1,g.K20,g.ST,g.v)/q) : NaN;
      const Di=g.Da-2*g.sn;
      const rows=[['Berechnungsdruck','p',g.p,'bar'],['Zulässige Spannung','K/S',g.K/g.S,'N/mm²'],['Schweißnahtfaktor','v',g.v,'–'],
        ['Außendurchmesser','Da',g.Da,'mm'],['Innendurchmesser','Di',Di,'mm']];
      if(Di<=0){notes.push(['e','Wanddicke zu groß für diesen Durchmesser (Di ≤ 0).']);fail=true;}
      else{const r=g.Da/Di; rows.push(['Durchmesserverhältnis','Da/Di',r,'–']);
        if(snap(r,1.2)>1.2){notes.push(['e',kind==='sph'?`Da/Di = ${H.fmt(r,3)} > 1,2: außerhalb dieses B1-Moduls. Für die dickwandige Kugelschale ist ein gesonderter Nachweis erforderlich; B10 gilt hier nur für Zylinder.`:`Da/Di = ${H.fmt(r,3)} > 1,2: außerhalb B1, dickwandig nach B10 rechnen.`]);fail=true;}
        else notes.push(['',`Da/Di = ${H.fmt(r,3)} ≤ 1,2: im Geltungsbereich von B1.`]);}
      if(g.sn<2){notes.push(['e','Mindestwanddicke 2 mm für Stahl (B1) unterschritten.']);fail=true;}
      if(seff<=0){notes.push(['e','Wanddicke ist nicht größer als c1 + c2.']);fail=true;}
      if(sReq>g.sn){notes.push(['e',`Ausgeführte Wanddicke ${H.fmt(g.sn,1)} mm < erforderlich ${H.fmt(sReq,2)} mm.`]);fail=true;} // Review-Fix: fail-Flag konsistent
      rows.push(['Wanddicke ohne Zuschläge','s0',s0,'mm'],['Zuschläge','c1+c2',c,'mm'],['Erforderliche Wanddicke','s',sReq,'mm'],
        ['Wirksame Wanddicke','se−c',seff,'mm'],['Zulässiger Druck','p_zul',pm,'bar']);
      const PT=Pt(g), sT=snap(Math.max(2,req(g.Da,PT,g.K20,g.ST,g.v)+g.c1),g.sn);
      const need=governing(g,rows,notes,sReq,sT); fail=fail||need>g.sn;
      return finish({
        headline:{value:sReq,unit:'mm',label:'mm Betrieb erforderlich',of:`ausgeführt ${H.fmt(g.sn,1)} mm`},
        util:need/g.sn, pmax:pm, rows, notes, fail,
        test:{PT,req:sT,have:g.sn,unit:'mm',ok:sT<=g.sn,note:'Prüfzustand mit K20, S′, nur c1 abgezogen. p wird als PS angenommen.'},
        formula:`s = max(2 mm; Da·p / (${k}·K/S·v + p) + c1 + c2)\ns = max(2 mm;  ${g.Da}·${g.p} / (${k}·${g.K}/${g.S}·${g.v} + ${g.p}) + ${g.c1} + ${g.c2})\n  = max(2 mm; ${H.fmt(s0,3)} + ${H.fmt(c,2)}) = ${H.fmt(sReq,3)} mm\n\np_zul bei se = ${H.fmt(g.sn,1)} mm: ${H.fmt(pm,2)} bar (Betrieb und Prüfung; q = max(1,25·K20/K; 1,43))\ns_ma = max(s_B; s_P) = ${H.fmt(need,3)} mm; s_P = ${H.fmt(sT,3)} mm; PT = ${H.fmt(PT,3)} bar`
      });
    }
  };
}
AD.register(shell('cyl'));
AD.register(shell('sph'));

/* B3 dished heads: knuckle with beta (from chart, user input) + crown as sphere with Da = 2(R+se) */
AD.register({
  id:'b3', name:'Gewölbter Boden', code:'B3', group:'Böden',
  icon:'<path d="M5 27h34"/><path d="M5 27v-4q0-6 6-8q11-5 22 0q6 2 6 8v4"/>',
  fields:[
    {id:'Da',label:'Außendurchmesser',sym:'Da',unit:'mm',def:508},
    {id:'sn',label:'Ausgeführte Wanddicke',sym:'se',unit:'mm',def:8},
    {id:'htype',label:'Bodenform',type:'select',options:[['kl','Klöpperboden'],['kb','Korbbogenboden']],def:'kl'},
    {id:'beta',label:'Beiwert aus Diagramm',sym:'β · B3',unit:'–',def:''}
  ],
  help:'β nach B3 für (se−c)/Da und Krempenausschnitte ablesen. Kalottenausschnitte erfordern einen gesonderten Nachweis nach B9.',
  draw(g,H,result){
    g=g||{};
    const D=H.draw,W=420,V=300;
    const empty=()=>D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Gewölbter Boden B3',sub:'Halbschnitt'});
    if(!Number.isFinite(g.Da)||!Number.isFinite(g.sn)||g.Da<1e-6||g.sn<=0||g.sn>=g.Da/2||!['kl','kb'].includes(g.htype)) return empty();
    const kl=g.htype==='kl';
    // AD 2000 B3 (05/2011), Abschnitt 1 a)/b), Gl. (1)–(6), Bild 1:
    // R, r und h2 der Klöpper-/Korbbogenform. Quelle (Merkblatt-Textvorschau):
    // (Normtext, nicht verlinkt)
    const Rmm=(kl?1:0.8)*g.Da,rmm=(kl?0.1:0.154)*g.Da,h2=(kl?0.1935:0.255)*g.Da-(kl?0.455:0.635)*g.sn;
    if(h2<=0) return empty();
    const k=D.fit(g.Da,g.Da*.5,300,150,10),A=g.Da*k/2,t=Math.min(A*.4,Math.max(5,g.sn*k)),a=A-t,R=Rmm*k,r=rmm*k;
    // Reine Zeichnungsgeometrie: tangentiale Kreisbögen mit gemeinsamem Berührpunkt.
    // Der Bord ist schematisch, ohne vorgegebene oder nachgewiesene Bordhöhe h1.
    const x=210,Y=156,B=191,u=a-r,q=Math.sqrt((R-r)**2-u*u),cc=Y+q;
    if(!Number.isFinite(q)||u<=0) return empty();
    const ix=x+u*R/(R-r),iy=cc-q*R/(R-r),ox=x+u*(R+t)/(R-r),oy=cc-q*(R+t)/(R-r),top=cc-R-t;
    const gov=(result&&result.notes||[]).find(n=>n[1].startsWith('Maßgebend:'));
    const crown=!!gov&&gov[1].startsWith('Maßgebend: Kalotte'),knuckle=!!gov&&gov[1].startsWith('Maßgebend: Krempe');
    const bad=drawBad(result),kc=bad&&(knuckle||!gov)?'o bad':'o',sc=bad&&(crown||!gov)?'o bad':'o';
    // Rechte Hälfte geschnitten; linke Hälfte Außenansicht (Halbschnitt).
    let b=D.path(`M ${x} ${top} A ${R+t} ${R+t} 0 0 1 ${ox} ${oy} A ${r+t} ${r+t} 0 0 1 ${x+A} ${Y} L ${x+A} ${B} L ${x+a} ${B} L ${x+a} ${Y} A ${r} ${r} 0 0 0 ${ix} ${iy} A ${R} ${R} 0 0 0 ${x} ${cc-R} Z`,'o',true);
    b+=D.path(`M ${x-A} ${B} L ${x-A} ${Y} A ${r+t} ${r+t} 0 0 1 ${2*x-ox} ${oy} A ${R+t} ${R+t} 0 0 1 ${x} ${top}`,'o');
    b+=D.tag('htype',D.path(`M ${x} ${top} A ${R+t} ${R+t} 0 0 1 ${ox} ${oy}`,sc));
    b+=D.tag('htype',D.path(`M ${ox} ${oy} A ${r+t} ${r+t} 0 0 1 ${x+A} ${Y}`,kc));
    b+=D.centre(x,top-12,x,B+12)+D.centre(x-A-9,Y,x+A+9,Y);
    b+=D.tag('Da',D.dim(x-A,B,x+A,B,29,'Da '+H.fmt(g.Da,1)+' mm'));
    b+=D.dim(x,cc-R,x,Y,145,'h2 '+H.fmt(h2,1));
    b+=D.tag('sn',D.dim(x+a,B-5,x+A,B-5,20,'se '+H.fmt(g.sn,1)));
    b+=(D.leader(x+R*.22,cc-Math.sqrt(R*R-(R*.22)**2),230,34,'R '+H.fmt(Rmm,1)));
    b+=(D.leader((ix+x+a)/2,(iy+Y)/2,350,87,'r '+H.fmt(rmm,1)));
    b+=D.leader(x+A,B-7,333,240,'Bord (schem.)','end');
    b+=drawArrow(D,x+35,Y+8,x+35,cc-Math.sqrt(R*R-35*35)+5);
    b+=drawArrow(D,x+76,Y+8,x+76,cc-Math.sqrt(R*R-76*76)+5);
    b+=D.text(x+48,B-6,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
    b+=D.text(14,22,kl?'Klöpperboden · Halbschnitt':'Korbbogenboden · Halbschnitt','start','tx tb2');
    if(gov) b+=D.text(14,245,'Maßgebend: '+(crown?'Kalotte':'Krempe')+' (Betrieb)','start','tx tb2');
    if(t!==g.sn*k) b+=D.text(14,260,t>g.sn*k?'Wanddicke überhöht dargestellt':'Wanddicke schematisch dargestellt','start','tx tb2');
    return D.svg(W,V,b,{title:'Gewölbter Boden B3',sub:kl?'Klöpperform · R, r innen':'Korbbogenform · R, r innen'});
  },
  calc(g){
    if(invalid(g,['Da','beta'])||g.beta<1||!['kl','kb'].includes(g.htype)||g.sn>=g.Da/2)
      return rejected('Bodenmaße und Bodenform prüfen: 0 < Wanddicke < Da/2; Kennwerte positiv und endlich; S ≥ 1,5, S′ ≥ 1,05; β ≥ 1 aus B3-Diagramm erforderlich.');
    const notes=[], c=g.c1+g.c2, seff=g.sn-c; let fail=false;
    const geo = g.htype==='kl' ? {R:g.Da,r:0.1*g.Da,h:0.1935*g.Da-0.455*g.sn} : {R:0.8*g.Da,r:0.154*g.Da,h:0.255*g.Da-0.635*g.sn};
    if(![geo.R,geo.r,geo.h].every(x=>Number.isFinite(x)&&x>0)) return rejected('Bodenradien und Wölbungshöhe müssen positiv und endlich sein.');
    const Dk = 2*(geo.R+g.sn);
    const knuck=(p,K,S)=>g.Da*p*g.beta/(40*K/S*g.v), crown=(p,K,S)=>Dk*p/(40*K/S*g.v+p);
    const sK=knuck(g.p,g.K,g.S), sC=crown(g.p,g.K,g.S), s0=Math.max(sK,sC), sReq=snap(Math.max(2,s0+c),g.sn);
    const pK=seff>0?40*g.K/g.S*g.v*seff/(g.Da*g.beta):NaN, pC=seff>0?40*g.K/g.S*g.v*seff/(Dk-seff):NaN;
    // Keep the same remaining-wall ratio as the manually read beta chart.
    // UNVERIFIED: retain c2 conservatively for proof rather than reusing beta at a different ratio.
    const q=Pt({...g,p:1}), st=seff;
    const pm=Math.min(pK,pC,40*g.K20/g.ST*g.v*st/(g.Da*g.beta)/q,40*g.K20/g.ST*g.v*st/(Dk-st)/q), gov=sK>=sC?'Krempe':'Kalotte', rel=seff/g.Da;
    if(snap(rel,0.001)<0.001||snap(rel,0.1)>0.1){notes.push(['e',`(se−c)/Da = ${H.fmt(rel,4)} liegt außerhalb 0,001 … 0,1 (B3).`]);fail=true;}
    if(g.sn<2){notes.push(['e','Mindestwanddicke 2 mm für Stahl unterschritten.']);fail=true;}
    if(seff<=0){notes.push(['e','Wanddicke ist nicht größer als c1 + c2.']);fail=true;}
    if(sReq>g.sn){notes.push(['e',`Ausgeführte Wanddicke ${H.fmt(g.sn,1)} mm < erforderlich ${H.fmt(sReq,2)} mm.`]);fail=true;} // Review-Fix: fail-Flag konsistent
    notes.push(['',`Maßgebend: ${gov} (Betrieb). Krempe und Kalotte werden beide geprüft.`]);
    notes.push(['w','Kalottenausschnitte: Verstärkung gesondert nach B9 nachweisen (B3 8.1.2). Krempenausschnitte über β berücksichtigen (B3 8.1.4).']);
    notes.push(['w','UNVERIFIED: β manuell aus B3 bestätigen und nach Maß-/Zuschlagsänderung neu ablesen. Im Prüfzustand konservativ c1 + c2 beibehalten (gleiches Nettodickenverhältnis für β).']);
    const PT=Pt(g), sT=snap(Math.max(2,Math.max(knuck(PT,g.K20,g.ST),crown(PT,g.K20,g.ST))+c),g.sn);
    const rows=[['Betriebszustand erforderlich','s_B',sReq,'mm'],['Prüfzustand erforderlich','s_P',sT,'mm']];
    const need=governing(g,[],notes,sReq,sT); fail=fail||need>g.sn;
    return finish({
      headline:{value:sReq,unit:'mm',label:'mm Betrieb erforderlich',of:`ausgeführt ${H.fmt(g.sn,1)} mm`},
      util:need/g.sn,pmax:pm,notes,fail,
      rows:[...rows,['Berechnungsdruck','p',g.p,'bar'],['Zulässige Spannung','K/S',g.K/g.S,'N/mm²'],['Beiwert','β',g.beta,'–'],
        ['Wölbungsradius (innen)','R',geo.R,'mm'],['Krempenradius (innen)','r',geo.r,'mm'],['Höhe gewölbter Teil','h2',geo.h,'mm'],
        ['Relative Wanddicke','(se−c)/Da',rel,'–'],['Krempe ohne Zuschläge','s0,K',sK,'mm'],['Kalotte ohne Zuschläge','s0,Kal',sC,'mm'],
        ['Erforderliche Wanddicke Betrieb','s',sReq,'mm'],['Maßgebende Wanddicke Betrieb/Prüfung','s_ma',need,'mm'],['Zulässiger Druck','p_zul',pm,'bar']],
      test:{PT,req:sT,have:g.sn,unit:'mm',ok:sT<=g.sn,note:'Krempe und Kalotte im Prüfzustand mit K20, S′; konservativ c1 + c2, damit β zum gleichen Nettodickenverhältnis gehört.'},
      formula:`Krempe:  s0,K = Da·p·β / (40·K/S·v)\n         = ${g.Da}·${g.p}·${g.beta} / (40·${g.K}/${g.S}·${g.v}) = ${H.fmt(sK,3)} mm\nKalotte: s0,Kal = 2·(R+se)·p / (40·K/S·v + p)\n         = ${H.fmt(Dk,1)}·${g.p} / (40·${g.K}/${g.S}·${g.v} + ${g.p}) = ${H.fmt(sC,3)} mm\nMaßgebend: ${gov}\n  s = max(2 mm; ${H.fmt(s0,3)} + ${H.fmt(c,2)}) = ${H.fmt(sReq,3)} mm\n\np_zul bei se = ${H.fmt(g.sn,1)} mm: ${H.fmt(pm,2)} bar (Betrieb und Prüfung; q = max(1,25·K20/K; 1,43))\ns_ma = max(s_B; s_P) = ${H.fmt(need,3)} mm; s_P = max(2 mm; max(Da·PT·β/(40·K20/S′·v); 2·(R+se)·PT/(40·K20/S′·v+PT)) + c1 + c2) = ${H.fmt(sT,3)} mm; PT = ${H.fmt(PT,3)} bar`
    });
  }
});

/* B5 unstayed circular flat end without additional edge moment */
AD.register({
  id:'b5', name:'Ebener Boden', code:'B5', group:'Böden', usesE:true,
  icon:'<rect x="5" y="14" width="34" height="6" rx="1"/><path d="M9 20v8M35 20v8"/>',
  fields:[
    {id:'D',label:'Berechnungsdurchmesser',sym:'D1',unit:'mm',def:400},
    {id:'sn',label:'Ausgeführte Wanddicke',sym:'se',unit:'mm',def:30},
    {id:'C',label:'Beiwert Einspannung',sym:'C · B5 Tafel 1',unit:'–',def:''}
  ],
  help:'Pflichteingabe: C und D1 gemeinsam für die tatsächliche Randeinspannung aus B5 Tafel 1 bestimmen.',
  draw(g,H,r){
      g=g||{};
    const D=H.draw,W=420,V=290;
    if(!Number.isFinite(g.D)||!Number.isFinite(g.sn)||g.D<=0||g.sn<=0)
      return D.svg(W,V,D.text(210,130,'Maße eingeben'),{title:'Ebener Boden B5',sub:'Schnitt A–A'});
    const k=D.fit(g.D,g.sn,300,105,10),L=g.D*k,t=Math.max(5,g.sn*k),x=210-L/2,y=94;
    let b=D.rect(x,y,L,t,drawBad(r)?'o bad':'o',true);
    // Schematische Einspannung an D1; keine Festlegung einer Anschlussform nach B5 Tafel 1.
    b+=(D.rect(x-12,y,12,t+45,'o',2)+D.rect(x+L,y,12,t+45,'o',2));
    b+=D.centre(210,y-22,210,y+t+68);
    b+=D.tag('D',D.dim(x,y,x+L,y,-30,'D1 '+H.fmt(g.D,1)+' mm'));
    b+=D.tag('sn',D.dim(x+L,y,x+L,y+t,-35,'se '+H.fmt(g.sn,1)));
    for(const f of [.2,.4,.6,.8]) b+=drawArrow(D,x+f*L,y+t+48,x+f*L,y+t+4);
    b+=D.text(210,y+t+67,'p = '+H.fmt(g.p,1)+' bar','middle','tx dt');
    b+=D.text(14,22,'Schnitt A–A · Randeinspannung','start','tx tb2');
    b+=D.text(14,t>60?39:228,'Anschluss schematisch; C nach B5 Tafel 1','start','tx tb2');
    if(t>g.sn*k) b+=D.text(14,245,'Wanddicke überhöht dargestellt','start','tx tb2');
    return D.svg(W,V,b,{title:'Ebener Boden B5',sub:'D1 '+H.fmt(g.D,0)+' × '+H.fmt(g.sn,1)+' mm'});
  },
  calc(g){
    if(invalid(g,['D','C','E'],false)) return rejected('Eingaben prüfen: Maße, E und Kennwerte positiv und endlich; S ≥ 1,5 und S′ ≥ 1,05; Druck und Zuschläge nicht negativ.');
    const notes=[]; let fail=false;
    const c1=g.sn>25?0:g.c1, c=c1+g.c2, seff=g.sn-c;
    if(g.sn>25) notes.push(['','se > 25 mm: c1 entfällt nach B5.']);
    const req=(p,K,S)=>g.C*g.D*Math.sqrt(p*S/(10*K));
    const s0=req(g.p,g.K,g.S), sReq=snap(s0+c,g.sn);
    // B5 §1: (se-c)/D >= fourthRoot(0.0087*p/E), s/D <= 1/3; p in bar.
    const lower=Math.pow(0.0087*g.p/g.E,0.25), rel=seff/g.D, upper=snap(g.sn/g.D,1/3)<=1/3;
    const pDef=g.E/0.0087*Math.pow(rel,4);
    const q=Pt({...g,p:1}), st=g.sn-c1;
    const pm=seff>0&&upper?Math.min(10*g.K/g.S*Math.pow(seff/(g.C*g.D),2),pDef,10*g.K20/g.ST*Math.pow(st/(g.C*g.D),2)/q,g.E/0.0087*Math.pow(st/g.D,4)/q):NaN;
    if(snap(g.D*lower+c,g.sn)>g.sn||!upper){notes.push(['e','Außerhalb B5 §1: Nettodicke/D muss mindestens ⁴√(0,0087·p/E) betragen, Plattendicke/D höchstens 1/3. Gesonderte Spannungs- und Verformungsanalyse erforderlich.']);fail=true;}
    if(seff<=0){notes.push(['e','Wanddicke ist nicht größer als c1 + c2.']);fail=true;}
    if(sReq>g.sn){notes.push(['e',`Ausgeführte Wanddicke ${H.fmt(g.sn,1)} mm < erforderlich ${H.fmt(sReq,2)} mm.`]);fail=true;} // Review-Fix: fail-Flag konsistent
    notes.push(['w','Gilt für unverankerte runde Platten ohne zusätzliches Randmoment. Kein Schweißnahtfaktor.']);
    const PT=Pt(g), sT=snap(req(PT,g.K20,g.ST)+c1,g.sn);
    const sDef=snap(g.D*lower+c,g.sn), sDefT=snap(g.D*Math.pow(0.0087*PT/g.E,0.25)+c1,g.sn);
    const testLimits=sDefT<=g.sn&&upper;
    if(!testLimits){notes.push(['e','Prüfzustand außerhalb der Maßgrenzen nach B5 §1; gesonderte Analyse erforderlich.']);fail=true;}
    const need=governing(g,[],notes,sReq,sT,Math.max(sDef,sDefT)); fail=fail||need>g.sn;
    return finish({
      headline:{value:sReq,unit:'mm',label:'mm Betrieb erforderlich',of:`ausgeführt ${H.fmt(g.sn,1)} mm`},
      util:need/g.sn,pmax:pm,notes,fail,
      rows:[['Betriebszustand erforderlich','s_B',sReq,'mm'],['Prüfzustand erforderlich','s_P',sT,'mm'],['Verformungsgrenze Betrieb','s_def',sDef,'mm'],['Verformungsgrenze Prüfung','s_def,P',sDefT,'mm'],['Berechnungsdruck','p',g.p,'bar'],['Kennwert','K',g.K,'N/mm²'],['Beiwert','C',g.C,'–'],['Berechnungsdurchmesser','D1',g.D,'mm'],
        ['Wanddicke ohne Zuschläge','s0',s0,'mm'],['Zuschläge','c1+c2',c,'mm'],['Erforderliche Wanddicke Betrieb','s',sReq,'mm'],['Maßgebende Wanddicke Betrieb/Prüfung','s_ma',need,'mm'],
        ['Relative Nettodicke','(se−c)/D',rel,'–'],['Untere Maßgrenze','⁴√(0,0087·p/E)',lower,'–'],['Druckgrenze Verformung','p_def',pDef,'bar'],['Zulässiger Druck','p_zul',pm,'bar']],
      test:{PT,req:sT,have:g.sn,unit:'mm',ok:sT<=g.sn&&testLimits,note:'Prüfzustand mit K20, S′, nur c1; Maßgrenzen nach B5 §1 mit eingegebenem E geprüft.'},
      formula:`B5 §1: (se−c)/D ≥ ⁴√(0,0087·p/E); se/D ≤ 1/3\np_def = E/0,0087·((se−c)/D)⁴ = ${H.fmt(pDef,4)} bar\ns = C·D1·√(p·S / (10·K)) + c1 + c2\ns = ${g.C}·${g.D}·√(${g.p}·${g.S} / (10·${g.K})) + ${c1} + ${g.c2}\n  = ${H.fmt(s0,3)} + ${H.fmt(c,2)} = ${H.fmt(sReq,3)} mm\n\np_zul = min(p_Festigkeit,B; p_def,B; p_Festigkeit,P/q; p_def,P/q) bei se = ${H.fmt(g.sn,1)} mm: ${H.fmt(pm,2)} bar (Betrieb und Prüfung; q = max(1,25·K20/K; 1,43))\ns_ma = max(s_B; s_P; s_def; s_def,P) = ${H.fmt(need,3)} mm\ns_P = ${H.fmt(sT,3)} mm; s_def = ${H.fmt(sDef,3)} mm; s_def,P = ${H.fmt(sDefT,3)} mm`
    });
  }
});
})(globalThis.AD);
