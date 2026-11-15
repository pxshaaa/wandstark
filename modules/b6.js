/* AD 2000 B6, Ausgabe 10.2006, Abschnitte 1–8, Tafel 1.
 * Primärquelle (PDF-Seiten 266–269):
 * (Normtext, nicht verlinkt)
 * Gegenprüfung Ausgabe 10.2000: (Normtext, nicht verlinkt)
 * Parameterinventar: p, T, Da, se, c1, c2, l/Ringabstand, Endstützung;
 * u oder Di,max/Di,min (Rohre auch Da,max/Da,min) oder Abflachung q;
 * E(T), ν, K(T), Werkstoffklasse, S, SK; im Prüfzustand p', E', K20, S', SK'.
 * Ringe: b, h bzw. Am, Im, Wm, Dm des VERBUNDQUERSCHNITTS, Is;
 * lm <= min(l, 1,1 sqrt(Da (se-c1-c2))+b), K des Rings, S nach B0.
 * Katalog UPN/L/T/RHS mit Tabellenwerten; freie Maße als exakte scharfkantige Geometrie.
 * EN-Gegenprüfung: (Normtext, nicht verlinkt)
 * ASME-Gegenprüfung: UG-29(a), Fig.UG-29.1, UG-30:
 * (Normtext, nicht verlinkt)
 * B6 §7.4.1, Bilder 2/3: Außenringe und gestrichelt dargestellte Innenringe.
 * Dm bezeichnet den VERBUND-Schwerpunktdurchmesser, nicht den Ring allein.
 * (10) verwendet Da; die Ringlage geht über Dm² in (11) und damit (9)/(10) ein.
 * EN 13445-3:2021 §8.3: Rs = Ringschwerpunkt, Rf = freier Profilrand,
 * ef = Gurtdicke (kein Exzentrizitätsmaß); §8.5.3.6 (28)/(29) unterscheidet
 * innen/außen, §8.5.3.8 Bild 8.5-17 zeigt einen inneren T-Ring.
 * ASME VIII-1 UG-29(a)–(c), UG-30: beide Ringlagen und deren Anschlüsse;
 * keine Übernahme der dortigen Formeln anstelle der B6-Gleichungen.
 * Heizkanäle bleiben ohne vollständigen Nachweis nach §7.4.2 gesperrt.
 * B6 7.1.2: l beginnt am Übergang Bord/Krempe, KEIN Bodenhöhenanteil.
 * Außerhalb dieses Moduls: Heizkanäle 7.4.2, Grauguss-Innendruckersatz 2.2,
 * Sondernachweise B0 §10, Ausschnitte B9, Zusatzlasten, Zeitstandbereich.
 */
(function(AD){
  'use strict';
  const H=AD.h;
  // B6 4.1, Tafel 1: [S Betrieb, S' Prüfung]. Austenit ist Walz-/Schmiedestahl.
  const safety={steel:[1.6,1.1],austenitic:[1.6,1.1],cast:[2,1.5],
    aluminium:[1.6,1.1],copper:[4,2.5],gjs700:[5,2.5],gjs500:[4,2],
    gjs400:[3.5,1.7],gjs350:[2.4,1.2]};
  const catalogue=AD.profiles||{};
  const types=['IPE','HEA','HEB','UPN','L','T','FL','RHS'];
  // Catalogue dimensions -> existing radial/axial convention, B6 7.4.1 Bild 3.
  // UPN is rotated: catalogue h becomes axial width, b radial height.
  function resolveRing(input){
    if(input.rings!=='yes'||input.ringSource!=='standard') return {g:input,profile:null};
    const type=input.ringProfileType===undefined?'FL':input.ringProfileType;
    const list=Object.prototype.hasOwnProperty.call(catalogue,type)?catalogue[type]:null;
    if(!Array.isArray(list)||!Object.prototype.hasOwnProperty.call(SERIES,type))
      return {g:{...input,ringSection:'invalid'},error:'Unbekannte Profilreihe.'};
    // 'Eigene Maße' within a profile series: use the manual dimension fields with the series' section type
    if(input['ringSize'+type]==='custom') return {g:{...input,ringSection:SERIES[type]},profile:null,type,custom:true};
    const name=input['ringSize'+type]===undefined?(list[0]&&list[0].name):input['ringSize'+type];
    const p=list.find(p=>p.name===name);
    if(!p) return {g:{...input,ringSection:'invalid'},error:'Normprofil nicht im geladenen Katalog gefunden.'};
    const g={...input,ringH:p.h,ringB:p.b,ringBf:p.b,ringTw:p.tw||p.t,ringTf:p.tf||p.t,ringWall:p.t};
    g.ringSection={IPE:'ibeam',HEA:'ibeam',HEB:'ibeam',UPN:'channel',L:'angle',T:'tee',FL:'flat',RHS:'hollow'}[type];
    if(type==='UPN'){g.ringH=p.b;g.ringBf=p.h;}
    return {g,profile:p,type};
  }
  const SERIES={IPE:'ibeam',HEA:'ibeam',HEB:'ibeam',UPN:'channel',L:'angle',T:'tee',FL:'flat',RHS:'hollow'};
  const ringWhen={rings:'yes'}, headWhen={rings:'none',lengthMode:'heads'};
  // manual dimension fields are shown for 'Freie Maße' AND for 'Eigene Maße' inside a standard profile series
  const dimWhen=secs=>v=>v.rings==='yes'&&((v.ringSource==='manual'&&secs.includes(v.ringSection))||(v.ringSource==='standard'&&v['ringSize'+v.ringProfileType]==='custom'&&secs.includes(SERIES[v.ringProfileType])));
  AD.register({
    id:'b6',name:'Zylinder Außendruck',code:'B6',group:'Schalen',usesE:true,
    icon:'<ellipse cx="10" cy="17" rx="5" ry="11"/><path d="M10 6h24M10 28h24M34 6a5 11 0 0 1 0 22M22 1v9m-3-3 3 3 3-3M22 33v-9m-3 3 3-3 3 3"/>',
    fields:[
      {type:'heading',id:'h_shell',label:'Schale und Stützung'},
      {id:'Da',label:'Außendurchmesser',sym:'Da',unit:'mm',def:1000},
      {id:'sn',label:'Ausgeführte Wanddicke',sym:'se',unit:'mm',def:8},
      {id:'rings',label:'Versteifungsringe',type:'select',options:[['none','Keine'],['yes','Ringe']],def:'none'},
      {id:'lengthMode',label:'Längendefinition',type:'select',options:[['direct','Zwischen wirksamen Stützen'],['heads','Gesamtlänge mit Böden']],def:'direct',when:{rings:'none'}},
      {id:'l',label:'Freie Länge zwischen wirksamen Stützen',sym:'l',unit:'mm',def:2000,when:{rings:'none',lengthMode:'direct'}},
      {id:'headType',label:'Abschlussböden (beide Enden)',type:'select',options:[['dished','Nach außen gewölbt'],['flat','Wirksam verankerte ebene Böden']],def:'dished',when:headWhen},
      {id:'overallLength',label:'Gesamtlänge zwischen Bodenscheiteln bzw. Stützebenen',sym:'L',unit:'mm',def:2400,when:headWhen},
      {id:'headDepth1',label:'Scheitel bis Übergang Bord/Krempe, links',sym:'hL',unit:'mm',def:200,min:'zero',when:{...headWhen,headType:'dished'}},
      {id:'headDepth2',label:'Scheitel bis Übergang Bord/Krempe, rechts',sym:'hR',unit:'mm',def:200,min:'zero',when:{...headWhen,headType:'dished'}},
      {id:'ovalityMode',label:'Unrundheit bestimmen',type:'select',options:[['percent','Unrundheit in Prozent'],['diameters','Gemessene Durchmesser'],['flat','Örtliche Abflachung']],def:'percent'},
      {id:'u',label:'Unrundheit',sym:'u',unit:'%',def:1.5,min:'zero',when:{ovalityMode:'percent'}},
      {id:'Dmax',label:'Größter gemessener Durchmesser',sym:'Dmax',unit:'mm',def:991.38,when:{ovalityMode:'diameters'},help:'B6 (7): an demselben Querschnitt messen; für Rohre sind auch Außendurchmesser zulässig.'},
      {id:'Dmin',label:'Kleinster gemessener Durchmesser',sym:'Dmin',unit:'mm',def:976.62,when:{ovalityMode:'diameters'}},
      {id:'q',label:'Örtliche Abflachung',sym:'q',unit:'mm',def:3.75,min:'zero',when:{ovalityMode:'flat'}},
      {type:'heading',id:'h_material',label:'Werkstoff und Geltungsbereich',fold:true},
      {id:'materialClass',label:'Werkstoffklasse nach Tafel 1',type:'select',options:[['steel','Walz- und Schmiedestahl'],['austenitic','Austenitischer Walz-/Schmiedestahl'],['cast','Stahlguss'],['aluminium','Aluminium-Knetwerkstoff'],['copper','Kupfer / Bronze'],['gjs700','EN-GJS-700 / 600'],['gjs500','EN-GJS-500'],['gjs400','EN-GJS-400-15'],['gjs350','EN-GJS-400-18 / 350-22'],['other','Sonstige / nicht zugeordnet']],def:'steel'},
      {id:'nu',label:'Querkontraktionszahl',sym:'ν',unit:'–',def:0.3,min:'any'},
      {id:'SK',label:'Sicherheit gegen elastisches Einbeulen',sym:'SK',unit:'–',def:3,help:'Wird mindestens auf den Wert nach B6 4.2 angehoben.'},
      {id:'tubeType',label:'Mindestwanddickenregel',type:'select',options:[['shell','Schale / gewöhnliches Rohr'],['exchanger','Wärmeaustauscherrohr (B6 8.4)']],def:'shell'},
      {id:'creep',label:'Berechnung im Zeitstandbereich',type:'select',options:[['no','Nein'],['yes','Ja (gesonderter Nachweis erforderlich)']],def:'no'},
      {type:'heading',id:'h_rings',label:'Ringnachweis nach B6 7.4.1',when:ringWhen},
      {id:'ringSpacing',label:'Größter Ringabstand / größtes Endfeld',sym:'l',unit:'mm',def:1000,when:ringWhen,help:'Gleichmäßige Ringe; auch das Endfeld darf diesen Abstand nicht überschreiten.'},
      {id:'ringPos',label:'Ringlage',type:'select',options:[['outside','Außen'],['inside','Innen']],def:'outside',when:ringWhen},
      {id:'ringSource',label:'Ringprofil wählen',type:'select',options:[['standard','Normprofil'],['manual','Freie Maße']],def:'standard',when:ringWhen},
      {id:'ringProfileType',label:'Profilreihe',type:'select',options:types.map(t=>[t,t]),def:'IPE',when:{...ringWhen,ringSource:'standard'}},
      ...types.map(type=>({id:'ringSize'+type,label:'Profilgröße '+type,type:'select',options:[...(catalogue[type]||[]).map(p=>[p.name,p.name]),['custom','Eigene Maße']],def:(catalogue[type]||[])[0]?.name||'',when:{...ringWhen,ringSource:'standard',ringProfileType:type}})),
      {id:'ringSection',label:'Ringquerschnitt',type:'select',options:[['flat','Flachstahl (rechteckig)'],['angle','Winkelprofil L'],['tee','T-Profil'],['channel','U-Profil (offen zur Schale)'],['ibeam','I-/Doppel-T-Profil'],['hollow','Rechteck-Hohlprofil'],['halfpipe','Halbrohr (offen zur Schale)'],['user','Profilring: Verbundwerte eingeben']],def:'flat',when:{...ringWhen,ringSource:'manual'}},
      {id:'ringB',label:'Axiale Anschlussbreite',sym:'b',unit:'mm',def:12,when:dimWhen(['flat','user'])},
      {id:'ringH',label:'Radiale Gesamthöhe des Profils',sym:'h',unit:'mm',def:80,when:dimWhen(['flat','angle','tee','channel','ibeam','hollow','user'])},
      {id:'ringTw',label:'Stegdicke (U: Steg am freien Ende)',sym:'tw',unit:'mm',def:12,when:dimWhen(['angle','tee','channel','ibeam'])},
      {id:'ringBf',label:'Axiale Profilbreite',sym:'bf',unit:'mm',def:60,when:dimWhen(['angle','tee','channel','ibeam','hollow'])},
      {id:'ringTf',label:'Gurtdicke (U: radiale Schenkel)',sym:'tf',unit:'mm',def:10,when:dimWhen(['angle','tee','channel','ibeam'])},
      {id:'ringWall',label:'Wanddicke Hohlprofil / Halbrohr',sym:'tr',unit:'mm',def:8,when:dimWhen(['hollow','halfpipe'])},
      {id:'ringPipeD',label:'Außendurchmesser Halbrohr',sym:'dr',unit:'mm',def:100,when:dimWhen(['halfpipe'])},
      {id:'widthMode',label:'Mittragende Schalenbreite',type:'select',options:[['auto','Nach B6 (12)'],['input','Verminderte Breite vorgeben']],def:'auto',when:ringWhen},
      {id:'shellWidth',label:'Verminderte mittragende Schalenbreite',sym:'lm',unit:'mm',def:100,when:{...ringWhen,widthMode:'input'}},
      {id:'ringA',label:'Verbundfläche Ring und mittragende Schale',sym:'Am',unit:'mm²',def:1800,when:dimWhen(['user'])},
      {id:'ringI',label:'Verbund-Trägheitsmoment um Mantelparallele',sym:'Im',unit:'mm⁴',def:1500000,when:dimWhen(['user'])},
      {id:'ringW',label:'Kleinstes Verbund-Widerstandsmoment',sym:'Wm',unit:'mm³',def:20000,when:dimWhen(['user'])},
      {id:'ringDm',label:'Durchmesser des Verbundschwerpunkts',sym:'Dm',unit:'mm',def:1040,when:dimWhen(['user'])},
      {id:'ringIs',label:'Profil-Trägheitsmoment gegen seitliches Ausknicken',sym:'Is',unit:'mm⁴',def:20000,when:dimWhen(['user'])},
      {id:'ringK',label:'Festigkeitskennwert des Rings bei T',sym:'Kr',unit:'N/mm²',def:235,when:ringWhen},
      {id:'ringS',label:'Ring-Sicherheit (mindestens Schalenwert)',sym:'Sr',unit:'–',def:1.6,when:ringWhen,help:'Konservativ mindestens Schalen-S nach Tafel 1; Kennwertwahl des Ringwerkstoffs nach B0 prüfen. Ring und Schale mit gleichem E.'},
      {type:'heading',id:'h_test',label:'Prüfzustand',fold:true},
      {id:'testMode',label:'Äußerer Überdruck bei Prüfung',type:'select',options:[['none','Kein Außendrucknachweis der Prüfung'],['external','Äußeren Prüfdruck vorgeben']],def:'none'},
      {id:'pTest',label:'Äußerer Prüfdruck (Druckdifferenz)',sym:'p′',unit:'bar',def:1.3,min:'zero',when:{testMode:'external'}},
      {id:'ETest',label:'E-Modul bei Prüftemperatur',sym:'E′',unit:'N/mm²',def:210000,when:{testMode:'external'}},
      {id:'ringK20',label:'Ringkennwert bei Prüftemperatur',sym:'Kr′',unit:'N/mm²',def:235,when:{rings:'yes',testMode:'external'}}
    ],
    help:'B6 Ausgabe 10.2006. p ist die positive äußere Druckdifferenz. E und K müssen zur Temperatur und Werkstoffklasse passen. Böden müssen als Endstützen wirksam sein. Bei Ringen gilt gleichmäßiger Abstand und gleicher E-Modul von Ring und Schale. Ausschnitte und Zusatzlasten gesondert nachweisen.',
    draw(input,H,r){
      const D=H.draw,W=420,V=320,resolved=resolveRing(input),g=resolved.g;
      const ring=g.rings==='yes';
      let l=ring?g.ringSpacing:g.lengthMode==='heads'?g.overallLength-(g.headType==='flat'?0:g.headDepth1+g.headDepth2):g.l;
      const good=[g.Da,g.sn,l].every(v=>Number.isFinite(v)&&v>0)&&g.sn<g.Da/2;
      const empty=()=>D.svg(W,V,D.text(210,145,'Maße eingeben'),{title:'Außendruckschale B6',sub:'AD 2000 B6 · Maße in mm'});
      if(!good||resolved.error) return empty();
      const section=g.ringSection||'flat',h=section==='halfpipe'?g.ringPipeD/2:g.ringH;
      const bf=section==='halfpipe'?g.ringPipeD:section==='flat'||section==='user'?g.ringB:g.ringBf;
      if(ring&&(![h,bf].every(v=>Number.isFinite(v)&&v>0)||
        (['angle','tee','ibeam','channel'].includes(section)&&![g.ringTw,g.ringTf].every(v=>Number.isFinite(v)&&v>0))||
        (['hollow','halfpipe'].includes(section)&&!(Number.isFinite(g.ringWall)&&g.ringWall>0)))) return empty();
      const bad=r&&(r.fail||r.ok===false||r.util>1),cls=bad?'o bad':'o';
      let body=D.text(112,17,'Längshalbschnitt','middle','tx tb2');
      // Overview: two equal bays when rings are selected. Actual spacing governs B6.
      const length=ring?2*l:l;
      if(!Number.isFinite(length)||!Number.isFinite(g.Da/2+(ring?h:0))) return empty();
      const k=D.fit(length,g.Da/2+(ring?h:0),190,90,0);
      const x0=35,x1=x0+length*k,axis=130,sy=axis-g.Da/2*k,wall=Math.max(5,Math.min(10,g.sn*k));
      body+=D.rect(x0,sy,x1-x0,wall,cls,true)+D.centre(x0-8,axis,x1+8,axis);
      body+=D.line(x0,sy,x0,axis,'t')+D.line(x1,sy,x1,axis,'t');
      // Same ideal section used by calc, with thin walls exaggerated for legibility.
      function profile(cx,base,kp,inside){
        const hh=Math.max(10,h*kp),bb=Math.max(7,bf*kp),sgn=inside?1:-1;
        const tw=Math.min(bb,Math.max(5,(g.ringTw||g.ringWall||bf)*kp));
        const tf=Math.min(hh/3,Math.max(5,(g.ringTf||g.ringWall||bf)*kp));
        const rr=(x,z,w,v)=>D.rect(cx+x,base+sgn*z,w,sgn*v,cls,2);
        if(section==='flat'||section==='user') return rr(-bb/2,0,bb,hh);
        if(section==='hollow'){
          const wt=Math.min(bb/3,hh/3,Math.max(5,g.ringWall*kp));
          return rr(-bb/2,0,bb,wt)+rr(-bb/2,hh-wt,bb,wt)+rr(-bb/2,wt,wt,hh-2*wt)+rr(bb/2-wt,wt,wt,hh-2*wt);
        }
        if(section==='halfpipe'){
          // B6 7.4.2 Bild 4: halber Kreisring, nur Darstellung der Geometrie.
          const outer=hh,inner=Math.max(outer*.2,outer-Math.max(5,g.ringWall*kp)),pts=[];
          for(let i=0;i<=24;i++){const a=Math.PI*i/24;pts.push([cx+outer*Math.cos(a),base+sgn*outer*Math.sin(a)]);}
          for(let i=24;i>=0;i--){const a=Math.PI*i/24;pts.push([cx+inner*Math.cos(a),base+sgn*inner*Math.sin(a)]);}
          return D.poly(pts,cls,2);
        }
        if(section==='channel') return rr(-bb/2,hh-tw,bb,tw)+rr(-bb/2,0,tf,hh-tw)+rr(bb/2-tf,0,tf,hh-tw);
        const webX=section==='angle'?-bb/2:-tw/2;
        return rr(webX,section==='ibeam'?tf:0,tw,hh-tf-(section==='ibeam'?tf:0))+rr(-bb/2,hh-tf,bb,tf)+(section==='ibeam'?rr(-bb/2,0,bb,tf):'');
      }
      if(ring){
        [x0,(x0+x1)/2,x1].forEach(x=>body+=D.tag('rings ringPos',profile(x,g.ringPos==='inside'?sy+wall:sy,Math.min(k,18/h,10/bf),g.ringPos==='inside')));
        body+=D.tag('ringSpacing',D.dim(x0,axis,(x0+x1)/2,axis,19,'l = '+H.fmt(l,0)));
        body+=D.text(112,174,'Ringabstand / größtes Endfeld','middle','tx dt');
      }else body+=(g.lengthMode==='heads'?x=>x:x=>D.tag('l',x))(D.dim(x0,axis,x1,axis,19,'l = '+H.fmt(l,0)));
      body+=D.tag('Da',D.dim(x0,sy,x0,axis,22,'Da/2 '+H.fmt(g.Da/2,0)));
      body+=D.tag('sn',D.dim(x1+5,sy,x1+5,sy+wall,-9,'se '+H.fmt(g.sn,1)));
      [0.22,0.5,0.78].forEach(f=>{const x=x0+f*(x1-x0);body+=D.leader(x,sy-2,x,Math.max(25,sy-22),'');});
      body+=D.text(112,29,'p außen = '+H.fmt(g.p,2)+' bar','middle','tx dt');
      body+=D.tag('Da',D.text(14,191,'Da = '+H.fmt(g.Da,1)+' mm','start','tx dt'));
      if(!ring&&g.lengthMode==='heads'){
        // Small schematic of the actual support planes and the outer head apices.
        const kL=180/g.overallLength,xa=30,xb=210,yl=219;
        const hl=g.headType==='flat'?0:g.headDepth1*kL,hr=g.headType==='flat'?0:g.headDepth2*kL;
        body+=D.tag('headType lengthMode',D.pline([[xa,yl+8],[xa+hl,yl],[xb-hr,yl],[xb,yl+8]],'o'));
        body+=D.tag('overallLength lengthMode',D.dim(xa,yl+8,xb,yl+8,20,'L '+H.fmt(g.overallLength,0)));
        if(g.headType!=='flat'){
          body+=D.tag('headDepth1',D.dim(xa,yl+8,xa+hl,yl+8,-20,'hL '+H.fmt(g.headDepth1,0)));
          body+=D.tag('headDepth2',D.dim(xb-hr,yl+8,xb,yl+8,-20,'hR '+H.fmt(g.headDepth2,0)));
        }
      }
      if(ring){
        const lmRow=r&&r.rows&&r.rows.find(x=>x[1]==='lm');
        const eRow=r&&r.rows&&r.rows.find(x=>x[1]==='e');
        const dmRow=r&&r.rows&&r.rows.find(x=>x[1]==='Dm');
        // B6 (12), drawing only; no capacity calculation is performed here.
        const t=g.sn-(g.c1||0)-(g.c2||0),contact=resolved.type==='UPN'&&resolved.profile?0:resolved.type==='RHS'&&resolved.profile?Math.max(0,bf-2*resolved.profile.rOuter):section==='flat'?bf:section==='ibeam'||section==='hollow'?bf:section==='channel'?2*g.ringTf:g.ringTw;
        const lm=lmRow&&Number.isFinite(lmRow[2])?lmRow[2]:g.widthMode==='input'?g.shellWidth:Math.min(l,1.1*Math.sqrt(g.Da*Math.max(0,t))+contact);
        if(!Number.isFinite(lm)||lm<=0) return empty();
        const kp=D.fit(Math.max(lm,bf),h+g.sn,135,100,0),cx=320,base=g.ringPos==='inside'?72:163,inside=g.ringPos==='inside';
        const sh=Math.max(5,Math.min(12,g.sn*kp)),span=lm*kp;
        body+=D.text(cx,17,'Einzelheit X','middle','tx tb2')+D.text(cx,31,'Vergrößert · schematisch','middle','tx dt');
        const profileIds='ringPos ringSource ringSection ringProfileType'+(resolved.profile?' ringSize'+resolved.type:'');
        body+=D.rect(cx-span/2,base+(inside?-sh:0),span,sh,cls,true)+D.tag(profileIds,profile(cx,base,kp,inside));
        const hh=Math.max(10,h*kp),bb=Math.max(7,bf*kp),top=inside?base:base-hh;
        body+=D.tag(section==='halfpipe'?'ringPipeD':section==='flat'||section==='user'?'ringB':'ringBf',D.dim(cx-bb/2,top,cx+bb/2,top,-13,(section==='halfpipe'?'dr ':section==='flat'||section==='user'?'b ':'bf ')+H.fmt(bf,1)));
        body+=(section==='halfpipe'?(x=>x):x=>D.tag('ringH',x))(D.dim(cx+bb/2,top,cx+bb/2,top+hh,-8,'h '+H.fmt(h,1)));
        body+=(g.widthMode==='input'?x=>D.tag('shellWidth',x):x=>x)(D.dim(cx-span/2,190,cx+span/2,190,14,'lm '+H.fmt(lm,1)));
        // Supplied composite Dm also locates the centroid for an inner ring.
        const localE=eRow?eRow[2]:section==='user'&&dmRow?(inside?(g.Da-2*t-dmRow[2])/2:(dmRow[2]-g.Da)/2):NaN;
        const ey=base+(inside?1:-1)*localE*kp;
        if(Number.isFinite(localE)&&ey>=40&&ey<=185){
          body+=D.centre(cx-span/2-3,ey,cx+span/2+3,ey);
          if(Math.abs(ey-base)>1) body+=D.dim(252,base,252,ey,16,'e '+H.fmt(localE,1));
          else body+=D.text(255,223,'e = '+H.fmt(localE,2)+' mm','start','tx dt');
        }else body+=D.text(255,223,'e: Verbundwerte erforderlich','start','tx dt');
        if(['angle','tee','ibeam','channel'].includes(section)){
          const twDraw=Math.min(bb,Math.max(5,g.ringTw*kp)),tfDraw=Math.min(hh/3,Math.max(5,g.ringTf*kp));
          const webX=section==='angle'?cx-bb/2:cx-twDraw/2;
          if(section==='channel'){
            body+=D.tag('ringTw',D.dim(cx+bb/2+4,inside?base+hh-twDraw:top,cx+bb/2+4,inside?base+hh:top+twDraw,-18,'tw '+H.fmt(g.ringTw,1)));
            body+=D.tag('ringTf',D.dim(cx-bb/2,231,cx-bb/2+tfDraw,231,12,'tf '+H.fmt(g.ringTf,1)));
          }else{
            body+=D.tag('ringTw',D.dim(webX,231,webX+twDraw,231,12,'tw '+H.fmt(g.ringTw,1)));
            body+=D.tag('ringTf',D.dim(cx+bb/2+4,inside?base+hh-tfDraw:top,cx+bb/2+4,inside?base+hh:top+tfDraw,-18,'tf '+H.fmt(g.ringTf,1)));
          }
        }
        if(['hollow','halfpipe'].includes(section)){
          const wt=Math.min(bb/3,hh/3,Math.max(5,g.ringWall*kp));
          const z=inside?base+hh:base-hh;
          body+=D.tag('ringWall',D.dim(cx,z,cx,z+(inside?-wt:wt),-32,'tr '+H.fmt(g.ringWall,1)));
        }
        body+=D.text(14,246,resolved.profile?resolved.profile.name:'Freie Maße · '+({flat:'Flachstahl',angle:'Winkel',tee:'T-Profil',ibeam:'I-Profil',channel:'U-Profil',hollow:'Hohlprofil',halfpipe:'Halbrohr',user:'Verbundwerte'}[section]||'Profil'),'start','tx tb2');
      }
      body+=D.text(14,267,'Wanddicken überhöht; Radien entfallen','start','tx dt');
      return D.svg(W,V,body,{title:'Außendruckschale B6',sub:'Längshalbschnitt · Maße in mm'}).replaceAll('y="-3"','dy="-3"');
    },
    calc(g){
      const resolved=resolveRing(g); g=resolved.g;
      const notes=[], rows=[]; let fail=false, catalogueUnverified=false;
      const error=t=>{notes.push(['e',t]);fail=true;};
      if(g.rings==='yes'&&g.ringSource!==undefined&&!['standard','manual'].includes(g.ringSource)) error('Unbekannte Auswahl der Profilquelle.');
      if(resolved.error) error(resolved.error);
      if(resolved.profile){
        const tabulated=['UPN','T','RHS','L'].includes(resolved.type);
        notes.push(['',tabulated?`Normprofil ${resolved.profile.name}: tabellierte Fläche, Schwerpunkt und Trägheitsmomente einschließlich Walz-/Eckradien.`:
          `Normprofil ${resolved.profile.name}; konservative Rechteckzerlegung mit Katalogobergrenzen.`]);
        notes.push(['w','Profilmaße und Kennwerte vor Fertigung mit dem Herstellerdatenblatt abgleichen.']);
      }
      const get=(k,d)=>g[k]===undefined?d:g[k];
      const rings=get('rings','none'), lengthMode=get('lengthMode','direct'),
        ovalityMode=get('ovalityMode','percent'), materialClass=get('materialClass','steel'),
        testMode=get('testMode','none'), section=get('ringSection','flat'),
        widthMode=get('widthMode','auto'), tubeType=get('tubeType','shell');
      const nu=get('nu',.3), c=g.c1+g.c2, t=g.sn-c;
      // Reject values whose square overflows before subsequent moment/stress arithmetic.
      const values=(keys)=>keys.every(k=>Number.isFinite(g[k])&&g[k]>0&&Number.isFinite(g[k]*g[k]));
      const nonnegative=(keys)=>keys.every(k=>Number.isFinite(g[k])&&g[k]>=0);
      let l=g.l;
      // B6 7.1.2: geometrische Umrechnung der Scheitellänge, kein h/3-Zuschlag.
      if(rings==='yes') l=g.ringSpacing;
      else if(lengthMode==='heads'){
        const headType=get('headType','dished');
        if(!['dished','flat'].includes(headType)) error('Unbekannte Bodenform.');
        if(!values(['overallLength'])||(headType==='dished'&&!nonnegative(['headDepth1','headDepth2']))) error('Bodenabmessungen sind ungültig.');
        l=g.overallLength-(headType==='dished'?g.headDepth1+g.headDepth2:0);
        notes.push(['','B6 7.1.2: Beullänge zwischen den Übergängen Bord/Krempe; kein Anteil der gewölbten Bodenhöhe. Bei ebenen Böden L zwischen den wirksamen Stützebenen eingeben.']);
      }
      // B6 7.3.4 (7), (8): Durchmesser am selben Querschnitt; u in Prozent.
      let u=get('u',1.5);
      if(ovalityMode==='diameters'){
        if(!values(['Dmax','Dmin'])||g.Dmax<g.Dmin) error('Gemessene Durchmesser müssen positiv und Dmax ≥ Dmin sein.');
        u=200*(g.Dmax-g.Dmin)/(g.Dmax+g.Dmin);
      }else if(ovalityMode==='flat'){
        if(!nonnegative(['q'])) error('Abflachung q muss endlich und nicht negativ sein.');
        u=400*g.q/g.Da;
      }
      if(!['none','yes'].includes(rings)||!['direct','heads'].includes(lengthMode)||
         !['percent','diameters','flat'].includes(ovalityMode)||!['none','external'].includes(testMode)||
         !['shell','exchanger'].includes(tubeType)||!['no','yes'].includes(get('creep','no'))) error('Unbekannte Auswahl.');
      if(!values(['Da','sn','E','K','S'])||!nonnegative(['p','c1','c2'])||
         !Number.isFinite(l)||l<=0||!Number.isFinite(u)||u<0||u>=100||
         !Number.isFinite(nu)||nu<=-1||nu>=.5||!Number.isFinite(get('SK',3))||get('SK',3)<=0) error('Ungültige Eingaben: Geometrie, Kennwerte und Sicherheiten positiv; Druck, Zuschläge und Unrundheit nicht negativ; −1 < ν < 0,5.');
      // Keep dimensional moments and diameter arithmetic inside finite IEEE-754 range.
      if(![g.Da**3,g.sn**3,l*l,g.Da*g.sn].every(x=>Number.isFinite(x)&&x>0)) error('Geometrie außerhalb des numerisch darstellbaren Bereichs.');
      if(ovalityMode==='diameters'&&!Number.isFinite(g.Dmax+g.Dmin)) error('Gemessene Durchmesser außerhalb des numerisch darstellbaren Bereichs.');
      if(t<=0) error('Wirksame Wanddicke se−c1−c2 muss positiv sein.');
      // B6 Abschnitt 1: Da/Di <= 1,2; Rohre Da <= 200 mm bis 1,7.
      const Di=g.Da-2*g.sn, limit=g.Da<=200?1.7:1.2;
      if(Di<=0||g.Da/Di>limit+1e-12) error(`Da/Di liegt außerhalb des B6-Bereichs (Grenze ${H.fmt(limit,1)}).`);
      const table=Object.prototype.hasOwnProperty.call(safety,materialClass)?safety[materialClass]:null;
      if(!table){
        // UNVERIFIED: keine pauschale Sicherheit für beliebige andere Werkstoffe.
        // Konservative Sperre anstelle eines erfundenen Tafelwertes, B6 4.1 / 2.2.
        notes.push(['w','UNVERIFIED: Sonstiger Werkstoff einschließlich Grauguss nicht zugeordnet; kein zulässiger Druck. Grauguss erfordert den Ersatznachweis nach B6 2.2.']);
        error('Werkstoffklasse ist nicht durch dieses Modul abgedeckt.');
      }
      // B6 4.1 Tafel 1; höhere Anwendereingabe beibehalten.
      const S6=Math.max(g.S,table?table[0]:Infinity);
      // B6 4.2: SK materialunabhängig, auch bei u > 1,5 %.
      const SK=Math.max(get('SK',3),u<=1.5?3:2.25+.5*u);
      if(g.S<S6) notes.push(['',`B6 Tafel 1: S = ${H.fmt(S6,2)} statt ${H.fmt(g.S,2)} verwendet.`]);
      if(u>1.5) notes.push(['w','Unrundheit über 1,5 %: SK nach B6 4.2 erhöht; Zulässigkeit der Fertigungsabweichung nach HP 1 gesondert prüfen.']);
      if(get('creep','no')==='yes') error('Zeitstandbereich: zusätzlicher Nachweis nach B0 / S6 erforderlich; hier nicht abgedeckt.');
      const geometryOK=!fail;
      // B6 8.1, 8.2, 8.4: Mindestdicke 3 mm, Aluminium 5 mm; Ausnahme WT-Rohre.
      const minWall=materialClass==='aluminium'?5:3;
      if(tubeType==='shell'&&g.sn<minWall) error(`B6 Abschnitt 8: Mindestwanddicke ${H.fmt(minWall,0)} mm unterschritten.`);
      if(tubeType==='exchanger') notes.push(['w','B6 8.4: Mindestwanddicken-Ausnahme nur für Wärmeaustauscherrohre; c2 nach B6 2.1 gemäß Vereinbarung wählen.']);
      const Z=Math.PI*g.Da/(2*l); // B6 7.2.1 (1).
      function pressure(s,E,K,S,sk){
        if(s===0) return {p1:0,p2:0,allow:0,n:2};
        const x=s/g.Da;
        // B6 7.2.1 (1): Minimum über ganzzahlige n >= 2 UND n > Z.
        const bending=E/sk*80/(12*(1-nu*nu))*x*x*x;
        let p1=Infinity,ncrit=NaN,ended=false;
        for(let n=Math.max(2,Math.floor(Z)+1);n<=10000;n++){
          // Untergrenze des positiven Biegeterms von B6 (1).
          if(bending*(n*n-1)>=p1){ended=true;break;}
          const a=1+(n/Z)*(n/Z);
          const pn=E/sk*20*x/((n*n-1)*a*a)+bending*(n*n-1+(2*n*n-1-nu)/a);
          if(pn<p1){p1=pn;ncrit=n;}
        }
        if(!ended) return {p1:NaN,p2:NaN,allow:NaN,n:NaN};
        // B6 7.3.1 (4), 7.3.3 (5)/(6): größerer plastischer Druck für Da/l > 5.
        const p2=g.Da/l<=5?20*K/S*x/(1+1.5*u/100*(1-.2*g.Da/l)/x):
          Math.max(20*K/S*x,30*K/S*(s/l)**2);
        return {p1,p2,allow:Math.min(p1,p2),n:ncrit}; // B6 7.1.1.
      }
      let actual={p1:NaN,p2:NaN,allow:NaN,n:NaN},req=NaN;
      if(geometryOK){
        actual=pressure(t,g.E,g.K,S6,SK);
        // Numerische Umkehrung B6 (1), (4)–(6), Bereichsgrenze Abschnitt 1.
        const maxNominal=g.Da*(1-1/limit)/2;
        if(maxNominal<=c) error('Zuschläge lassen keine wirksame Wanddicke im Geltungsbereich zu.');
        else req=H.solve(s=>pressure(s,g.E,g.K,S6,SK).allow-g.p,0,maxNominal-c)+c;
        if(!Number.isFinite(req)) error('Keine erforderliche Wanddicke innerhalb des B6-Durchmesserverhältnisses gefunden.');
        if(![actual.p1,actual.p2,actual.allow,actual.n].every(x=>Number.isFinite(x)&&x>0)) error('Beulwellensuche konnte nicht vollständig abgeschlossen werden.');
      }
      const pos=get('ringPos','outside');
      let Ar=NaN,er=NaN,Ir=NaN,Is=NaN,Ixz=0,xr=0,e=NaN,depth=g.ringH,b=g.ringB;
      const automatic=section!=='user';
      let profileValid=true;
      const badProfile=()=>{profileValid=false;};
      // B6 7.4.1 Bilder 2/3: geometrische Größen des idealen Querschnitts.
      // Rechteckzerlegung, Schwerpunkt und Steiner sind Geometrie, keine AD-Näherung.
      // Koordinaten: z radial von der Anschlussfläche zum freien Ende, x axial.
      const parts=[];
      function rect(w,h,x,z,sign=1){
        const a=sign*w*h;
        parts.push({a,x,z,ix:sign*w*h**3/12,iy:sign*h*w**3/12});
      }
      // Same local plate/proportion checks for both orientations and load states.
      // These checks supplement B6; E and Kr must belong to the evaluated state.
      function sectionCheck(E,Kr,state='Betriebszustand'){
        let ok=true;
        const reject=message=>{ok=false;error(`${state}: ${message}`);};
        if(!Number.isFinite(E)||E<=0||!Number.isFinite(Kr)||Kr<=0){
          reject('E und Kr für die Profilprüfung müssen endlich und positiv sein.');return false;
        }
        const h=g.ringH,tw=g.ringTw,bf=g.ringBf,tf=g.ringTf,wall=g.ringWall;
        if(['angle','tee','ibeam'].includes(section)){
          // B6 7.4.1 nennt h <= 8b nur für Flachstahl.
          // Konservative zusätzliche Sperre für schlanke freie Profilplatten;
          // keine Behauptung einer normativen lokalen Beulgrenze für L/T/I.
          const outstand=section==='angle'?bf-tw:(bf-tw)/2;
          // Ersatzkriterium (nicht AD 2000): EN 1993-1-1 Tab. 5.2, Querschnittsklasse 3, ε = √(235/K).
          // Steg zwischen Schale und Gurt beidseitig gestützt: c/t ≤ 42ε; freier Gurtüberstand: c/t ≤ 14ε.
          const eps=Math.sqrt(235/Kr), cw=section==='ibeam'?h-2*tf:h-tf;
          if(cw/tw>42*eps||outstand/tf>14*eps){reject(`Profilplatten zu schlank: Steg c/t = ${H.fmt(cw/tw,1)} (≤ ${H.fmt(42*eps,1)}), Gurt c/t = ${H.fmt(outstand/tf,1)} (≤ ${H.fmt(14*eps,1)}) nach EN 1993-1-1 Tab. 5.2.`);}
          // Ergänzende konservative Proportionen aus EN13445-3:2021
          // §8.5.3.8.1(b), (52)/(53): konstante Terme allein sind hinreichend
          // für die dortigen max-Grenzen, ohne Pys/P aus einer EN-Rechnung.
          // EN verlangt (52) ODER (53); hier zusätzlich zu B6 und EC3.
          {
            const d=section==='ibeam'?h-2*tf:h-tf,wf=section==='angle'?bf-tw:bf/2;
            if(d/tw>1.1*Math.sqrt(E/Kr)&&wf/tf>.5*Math.sqrt(E/Kr)){
              reject('Freier Profilgurt: weder Steg- noch Gurtproportion nach EN 13445-3 8.5.3.8.1 (52)/(53), konservative konstante Grenzen, erfüllt.');
            }
            notes.push(['',`${state}: Freier Gurt: zusätzliche konservative Proportionen nach EN 13445-3 8.5.3.8.1 (52)/(53); globale Seitenstabilität nach B6 7.4.1. Kein vollständiger EN-Nachweis.`]);
          }
          notes.push(['w',`${state}: Örtliches Beulen: B6 nennt keine Grenze; Ersatzkriterium EN 1993-1-1 Tab. 5.2 Klasse 3 (Steg ${H.fmt(cw/tw,1)} ≤ ${H.fmt(42*eps,1)}, Gurt ${H.fmt(outstand/tf,1)} ≤ ${H.fmt(14*eps,1)}). Radien bei den Plattenschlankheiten nicht angerechnet.`]);
        }else if(section==='channel'){
          const eps=Math.sqrt(235/Kr);
          if((h-tw)/tf>42*eps||(bf-2*tf)/tw>42*eps) reject('U-Profil: Plattenschlankheit über 42ε (EN 1993-1-1 Tab. 5.2 Klasse 3).');
        }else if(section==='hollow'){
          const eps=Math.sqrt(235/Kr);
          if(Math.max(h-2*wall,bf-2*wall)/wall>42*eps) reject('Hohlprofil: Wandschlankheit über 42ε (EN 1993-1-1 Tab. 5.2 Klasse 3).');
        }
        return ok;
      }
      if(rings==='yes'&&automatic){
        const h=g.ringH,tw=g.ringTw,bf=g.ringBf,tf=g.ringTf,wall=g.ringWall;
        if(section==='flat'){
          if(!values(['ringB','ringH'])) badProfile();
          rect(g.ringB,h,0,h/2);
        }else if(['angle','tee','ibeam'].includes(section)){
          if(!values(['ringH','ringTw','ringBf','ringTf'])||bf<tw||h<=(section==='ibeam'?2:1)*tf) badProfile();
          b=section==='ibeam'?bf:tw;
          if(section==='ibeam'){
            rect(bf,tf,0,tf/2);rect(tw,h-2*tf,0,h/2);rect(bf,tf,0,h-tf/2);
          }else{
            rect(tw,h-tf,0,(h-tf)/2);
            rect(bf,tf,section==='angle'?(bf-tw)/2:0,h-tf/2);
          }
          if(!resolved.profile) notes.push(['','Scharfkantiger Querschnitt nach Eingabemaßen; h umfasst Steg und Gurte.']);
          notes.push(['',section==='angle'?'Profil liegt mit der Stirnseite des radialen L-Schenkels an der Schale an; der axiale Schenkel liegt am freien Ende.':section==='tee'?'Profil liegt mit der Stegstirnseite an der Schale an; der T-Gurt liegt am freien Ende.':'Profil liegt mit einem I-Gurt an der Schale an.']);
        }else if(section==='channel'){
          if(!values(['ringH','ringTw','ringBf','ringTf'])||h<=tw||bf<=2*tf) badProfile();
          // B6 7.4.1 Bild 3: U offen zur Schale, zwei radiale Schenkel,
          // axialer Steg am freien Ende; überlappungsfreie Rechtecke.
          rect(bf,tw,0,h-tw/2);
          rect(tf,h-tw,-(bf-tf)/2,(h-tw)/2);rect(tf,h-tw,(bf-tf)/2,(h-tw)/2);
          // B6 (12): nur tatsächliche Kontaktstreifen, kein Zwischenraum.
          b=2*tf;
          notes.push(['w','Profil liegt mit beiden U-Schenkelstirnseiten an der Schale an; beide sind durchgehend angeschweißt; für b nur die Summe der Kontaktbreiten. Örtliches Beulen nach Ersatzkriterium EN 1993-1-1 Tab. 5.2 Klasse 3 (c/t ≤ 42ε, beidseitig gestützt).']);
        }else if(section==='hollow'){
          if(!values(['ringH','ringBf','ringWall'])||2*wall>=Math.min(h,bf)) badProfile();
          // B6 7.4.1: ideale Geometrie als Außenrechteck minus Innenrechteck.
          rect(bf,h,0,h/2);rect(bf-2*wall,h-2*wall,0,h/2,-1);b=bf;
          // Geschlossene Platten: zusätzlich EN1993-1-1 Tab.5.2, Klasse3.
          notes.push(['w','Profil liegt mit der axialen Hohlprofilwand an der Schale an; örtliches Beulen nach Ersatzkriterium EN 1993-1-1 Tab. 5.2 Klasse 3 (c/t ≤ 42ε). Anschlussfläche vollflächig anliegend vorausgesetzt.']);
        }else if(section==='halfpipe'){
          if(!values(['ringPipeD','ringWall'])||2*wall>=g.ringPipeD) badProfile();
          const R=g.ringPipeD/2,r=R-wall;depth=R;b=2*wall;
          // B6 7.4.2 Bild 4: reine Geometrie eines halben Kreisrings.
          // Exakte Integrale A=∫dA, e=∫z dA/A, I=∫z²dA−Ae².
          Ar=Math.PI*(R*R-r*r)/2;er=2*(R**3-r**3)/(3*Ar);
          Is=Math.PI*(R**4-r**4)/8;Ir=Is-Ar*er*er;
          // UNVERIFIED: Heizkanal ist nach 7.4.2 über den ganzen Mantel
          // nachzuweisen, nicht pauschal als diskreter Ring nach 7.4.1.
          notes.push(['w','UNVERIFIED: Halbrohr offen zur Schale; geschlossener Umfangsring vorausgesetzt, keine Schraubenlinie. Nur Geometrie berechnet. Heizkanalwirkung und Eigen-/Innendruck nach B6 7.4.2 hier nicht nachgewiesen; keine Druckfreigabe.']);
          error('Halbrohr: vollständiger Heizkanalnachweis nach B6 7.4.2 erforderlich.');
        }else badProfile();
        if(parts.length){
          // B6 7.4.1: Schwerpunktachsen x–x und y–y; Steiner je Rechteck.
          Ar=parts.reduce((a,q)=>a+q.a,0);
          xr=parts.reduce((a,q)=>a+q.a*q.x,0)/Ar;
          er=parts.reduce((a,q)=>a+q.a*q.z,0)/Ar;
          Ir=parts.reduce((a,q)=>a+q.ix+q.a*(q.z-er)**2,0);
          Is=parts.reduce((a,q)=>a+q.iy+q.a*(q.x-xr)**2,0);
          Ixz=parts.reduce((a,q)=>a+q.a*(q.x-xr)*(q.z-er),0);
          if(resolved.profile){
            const p=resolved.profile;
            rows.push(['Profilfläche scharfkantig / Katalog','Ar/A',Ar/p.A,'–']);
            if(['UPN','T','RHS','L'].includes(resolved.type)){
              // B6 10.2006 §7.4.1 (9)–(12): Schwerpunktachse parallel zur
              // Mantelachse, ausdrücklich NICHT automatisch die starke Profilachse.
              // Herstellerachsen: UPN um 90° gedreht => Ir=Iz, Is=Iy,
              // er=b-ys (Stegrücken am freien Ende). T/L: Gurt/Schenkel frei,
              // er=h-zs. RHS: horizontale y-Achse, er=h/2.
              const rotated=resolved.type==='UPN';
              const centroid=rotated?p.b-p.ys:resolved.type==='RHS'?p.zs:p.h-p.zs;
              if(![p.A,p.Iy,p.Iz,centroid].every(v=>Number.isFinite(v)&&v>0)||centroid>=depth){
                catalogueUnverified=true;
                error('Katalogprofil: Fläche, beide Achsenträgheitsmomente oder Schwerpunktlage fehlen bzw. sind ungültig. Keine Druckfreigabe.');
              }else{
                Ar=p.A;er=centroid;Ir=rotated?p.Iz:p.Iy;Is=rotated?p.Iy:p.Iz;
                // L: Spiegelung der radialen Katalogkoordinate ändert Iyz-Vorzeichen.
                Ixz=resolved.type==='L'?-p.Iyz:0;
                xr=resolved.type==='L'?p.ys-g.ringTw/2:0;
                if(resolved.type==='L'&&(![p.Iu,p.Iv,p.ys].every(v=>Number.isFinite(v)&&v>0)||
                  ![p.Iyz,p.tanAlpha].every(Number.isFinite)||p.ys>=p.b||p.Iy*p.Iz<=p.Iyz*p.Iyz)){
                  catalogueUnverified=true;error('L-Katalogprofil: Hauptachsenwerte, Schwerpunkt oder Deviationsmoment fehlen bzw. sind ungültig. Keine Druckfreigabe.');
                }
                if(resolved.type==='RHS'&&(!Number.isFinite(p.rOuter)||p.rOuter<=0||2*p.rOuter>=Math.min(p.h,p.b))){
                  catalogueUnverified=true;error('Hohlprofil: belegter äußerer Eckradius und ebene Anschlussbreite fehlen bzw. sind ungültig. Keine Druckfreigabe.');
                }
                // UPN: geneigte/gerundete Schenkelspitzen. Ohne belegte ebene
                // Anschlussbreite keinen b-Zuschlag beanspruchen (B6 (12)).
                if(rotated){b=0;notes.push(['','UPN: Ir = Katalog-Iz, Is = Katalog-Iy. Für die getrennten, gerundeten Schenkelkontakte wird kein Anschlussbreitenzuschlag angesetzt (b = 0).']);}
                if(resolved.type==='RHS') b=Math.max(0,p.b-2*p.rOuter);
              }
            }else{
              // Bestehende konservative IPE/HE/FL-Pfade beibehalten.
              if(Ar>p.A){const factor=p.A/Ar;Ar=p.A;Ir*=factor;Is*=factor;
                notes.push(['','Rechteckmodell auf die Katalogfläche abgemindert.']);}
              if(p.Iy>0) Ir=Math.min(Ir,p.Iy);
            }
          }
        }
      }
      if(rings==='yes'&&automatic&&!sectionCheck(g.E,g.ringK)) badProfile();
      // B6 7.4.1 (12): höchstens l; geringere Kontaktbreiten konservativ.
      const lmLimit=Math.min(l,1.1*Math.sqrt(g.Da*t)+b);
      const lm=widthMode==='input'?g.shellWidth:lmLimit;
      let A=NaN,I=NaN,W=NaN,Dm=NaN,IxzComposite=NaN,ringOK=true;
      const ringS=Math.max(g.ringS,S6); // B6 7.4.1 / B0: konservativ S >= Tafel 1.
      if(rings==='yes'){
        if(!values(['ringSpacing','ringK','ringS'])||!profileValid||
           !['outside','inside'].includes(pos)||!['auto','input'].includes(widthMode)||
           !Number.isFinite(lm)||lm<=0||lm>lmLimit+1e-9){error('Ungültige Ringdaten oder mittragende Breite größer als B6 (12).');ringOK=false;}
        if(automatic){
          // B6 7.4.1 (10)–(12): Ring + mittragende Schale, Steiner.
          // Lokale Koordinate zum freien Profilende (innen nach innen), Schale −t/2.
          // Spiegelung erhält A, e, I, Is und W in diesen lokalen Koordinaten.
          // Beide Randfasern: Schalenrand −t und freier Profilrand +depth.
          // EN §8.5.3.6 (40): ebenfalls Abstand zur jeweils fernsten Randfaser.
          const As=lm*t;
          A=As+Ar;e=(Ar*er-As*t/2)/A;
          I=lm*t**3/12+As*(-t/2-e)**2+Ir+Ar*(er-e)**2;
          W=I/Math.max(e+t,depth-e);
          // Composite product, with shell strip centred on the welded radial leg.
          // Constrained lateral curvature requires M_lateral/M_radial = Ixz,m/Im.
          IxzComposite=Ixz+Ar*As/A*xr*(er+t/2);
          // B6 §7.4.1 (11), Bilder 2/3: Durchmesser der Verbundschwerpunktlinie.
          // Wirksame Schalenflächen bei Da und Da−2t; Spiegelung um Schalenmitte.
          // Daher Dm,innen + Dm,außen = 2(Da−t); kein Ersatz von Da in (10).
          Dm=pos==='inside'?g.Da-2*t-2*e:g.Da+2*e;
          if(section==='flat'){
            // B6 7.4.1 Bild 2: h <= 8 b gegen seitliches Ausknicken.
            if(depth>8*b){error('Flachstahlring: h > 8 b; Seitenstabilität nicht nachgewiesen (B6 7.4.1).');ringOK=false;}
          }else{
            // B6 7.4.1 Bild 3, letzter Absatz: eigenes Is >= h^4/3000.
            if(!Number.isFinite(Is)||Is<depth**4/3000){error('Profilring: Is < h⁴/3000; Seitenstabilität nach B6 7.4.1 nicht erfüllt.');ringOK=false;}
          }
        }else{
          A=g.ringA;I=g.ringI;W=g.ringW;Dm=g.ringDm;Is=g.ringIs;
          if(!values(['ringB','ringH','ringA','ringI','ringW','ringDm','ringIs'])){error('Verbundwerte Am, Im, Wm, Dm und Is müssen positiv sein.');ringOK=false;}
          // Local e points from the attachment face towards the free profile edge.
          // Outside: Dm=Da+2e. Inside: Dm=Da−2t−2e.
          // Shell centroid is e=−t/2; profile extremity is e=depth.
          e=pos==='inside'?(g.Da-2*t-Dm)/2:(Dm-g.Da)/2;
          const dmMin=pos==='inside'?g.Da-2*t-2*depth:g.Da-t;
          const dmMax=pos==='inside'?g.Da-t:g.Da+2*depth;
          if(!Number.isFinite(e)||Dm<dmMin||Dm>dmMax){
            error(`Manuelle Verbundwerte (${pos==='inside'?'Innenring':'Außenring'}): Dm muss zwischen Schalenmittelfläche und freiem Profilrand liegen: ${H.fmt(dmMin,3)} ≤ Dm ≤ ${H.fmt(dmMax,3)} mm (−s₀/2 ≤ e ≤ h).`);ringOK=false;
          }
          const extreme=Math.max(e+t,depth-e),wLimit=I/extreme;
          // Tiny relative tolerance only for roundoff in reflected centroids.
          if(!Number.isFinite(wLimit)||wLimit<=0||W>wLimit*(1+1e-12)){
            error(`Manuelle Verbundwerte: Wm darf Im/max(e+s₀; h−e) = ${H.fmt(wLimit,3)} mm³ nicht überschreiten; beide radialen Randfasern berücksichtigen.`);ringOK=false;
          }
          // B6 7.4.1 Bild 3: Seitenträgheitsmoment mindestens h^4/3000.
          if(Is<g.ringH**4/3000){error('Profilring: Is < h⁴/3000; Seitenstabilität nach B6 7.4.1 nicht erfüllt.');ringOK=false;}
          notes.push(['w',`Verbundfläche, Trägheitsmoment, Widerstandsmoment und Schwerpunktdurchmesser müssen den Ring und ${H.fmt(lm,2)} mm mittragende Schale mit der Wanddicke nach Abzug von Minustoleranz und Korrosionszuschlag abbilden. Nach Änderungen an Wanddicke oder Zuschlägen neu bestimmen.`]);
        }
        if(pos==='inside'){
          notes.push(['','Innenring nach B6 7.4.1: Profil zur inneren Schalenfläche gespiegelt; Schwerpunktdurchmesser des Verbunds in Gleichung (11). Freiraum zu Einbauten gesondert prüfen.']);
        }
        if(automatic&&section==='angle'){
          // B6 §7.4.1 defines BOTH Im and Wm about the geometric centroidal
          // axis parallel to the shell axis. Cross-check: ASME VIII-1 UG-29(a),
          // definitions I/I', Fig.UG-29.1 (angle leg attached), UG-30 attachment;
          // EN13445-3:2021 §8.5.3.6 (26), §8.5.3.8 Fig.8.5-16.
          // A continuous double-sided shell weld restrains lateral curvature:
          // constrained bending, NOT a free unsymmetrical beam. Ixz need not
          // vanish; the weld/shell carries the lateral restraint reaction.
          // B6 §7.4.1 last paragraph supplies its own lateral stability rule
          // Is>=h^4/3000, checked above with the ACTUAL geometric lateral axis.
          // Thus EN (49)–(51) is not substituted as an unrelated full EN design.
          notes.push(['','L-Profil: B6 7.4.1, Biegung um die zur Behälterachse parallele Schwerpunktachse; Schalenanschluss hält den radialen Schenkel seitlich. Is ≥ h⁴/3000 ist zusätzlich einzuhalten.']);
          notes.push(['w','L-Profil nur mit durchgehenden beidseitigen Nähten und seitlich wirksamem Schalenanschluss. Anschluss muss auch die Reaktion aus dem Deviationsmoment aufnehmen; gesonderter Nachweis erforderlich.']);
        }
        if(catalogueUnverified) ringOK=false;
        if(section==='halfpipe') ringOK=false;
        if(![A,I,W,Dm].every(x=>Number.isFinite(x)&&x>0)){error('Ring-Verbundwerte sind nicht endlich und positiv.');ringOK=false;}
        if(pos==='inside'&&depth>=Math.min(Di,g.Da-2*t)/2){error('Innenring ragt bis zur Behälterachse oder darüber hinaus.');ringOK=false;}
        notes.push(['w','B6 7.4.3: durchgehende beidseitige Anschlussnähte vorausgesetzt; Nahttragfähigkeit gesondert nachweisen. Unterbrochene Nähte hier nicht freigegeben (B6 verlangt je Seite mindestens 1/3 Umfang, Teilung mindestens 300 mm und mindestens 2n Unterbrechungen). Gleichmäßige Ringabstände und gleicher E-Modul vorausgesetzt.']);
      }
      function ringCheck(p,E,K,S,sk){
        // B6 §7.4.1 (9), (11): pe in bar; innen wie außen gilt Dm².
        // Umgestellt: I_erf > p·SK·(1−ν²)·(Da−t)·Dm²·l/(240E).
        // Da−t ist der Schalenmitteldurchmesser, Dm der Verbunddurchmesser.
        const pe=240*E*I/((1-nu*nu)*(g.Da-t)*Dm*Dm*l);
        const elasticUtil=p*sk/pe;
        // B6 §7.4.1 (10): Da bleibt in BEIDEN Lasttermen (auch innen).
        // lm im Membranterm, l im Biegeterm; u in Prozent. Der Dm-Einfluss
        // auf die Spannung erfolgt ausschließlich über pe im Verstärkungsfaktor.
        const sigma=elasticUtil>=1?Infinity:p*lm*g.Da/(20*A)+
          (p===0||u===0?0:p*l*g.Da*g.Da/(8000*W)*u/(1-elasticUtil));
        return {pe,sigma,elasticUtil,stressUtil:sigma/(K/S)};
      }
      let ring={pe:NaN,sigma:NaN,elasticUtil:NaN,stressUtil:NaN},pRing=NaN;
      if(rings==='yes'&&geometryOK&&ringOK){
        ring=ringCheck(g.p,g.E,g.ringK,ringS,SK);
        if(!Number.isFinite(ring.pe)||ring.pe<=0) error('Elastischer Ringbeuldruck ist numerisch nicht bestimmbar.');
        // Umkehrung B6 (9)/(10), feste ausgeführte Verbundgeometrie.
        let lo=0,hi=ring.pe/SK;
        for(let j=0;j<100;j++){
          const mid=(lo+hi)/2;
          if(ringCheck(mid,g.E,g.ringK,ringS,SK).stressUtil<=1) lo=mid; else hi=mid;
        }
        pRing=lo;
        if(ring.elasticUtil>=1) error('Ring: p·SK ≥ pe, elastische Gesamtstabilität nicht erfüllt.');
        if(ring.stressUtil>1) error('Ring: Spannung nach B6 (10) überschreitet Kr/Sr.');
      }
      let envelope=null;
      if(rings==='yes'&&automatic&&!resolved.profile&&ringOK){
        // Additional conservative capacity envelope, not a change of geometry:
        // nominal custom dimensions can describe a rolled section whose corner
        // removal makes its tabulated Ir smaller. Never approve a higher pressure
        // merely by selecting "Eigene Maße" with those identical dimensions.
        // Nonmatching fabricated sharp-cornered profiles remain exact/unmodified.
        for(const type of ['UPN','T','RHS','L']){
          if(SERIES[type]!==section) continue;
          const match=(catalogue[type]||[]).find(p=>{
            const h=type==='UPN'?p.b:p.h,bf=type==='UPN'?p.h:p.b;
            return g.ringH===h&&g.ringBf===bf&&(section==='hollow'?g.ringWall===p.t:
              g.ringTw===(p.tw||p.t)&&g.ringTf===(p.tf||p.t))&&Ir>(type==='UPN'?p.Iz:p.Iy);
          });
          if(match){
            envelope=AD.modules.find(m=>m.id==='b6').calc({...g,ringSource:'standard',ringProfileType:type,['ringSize'+type]:match.name,p:0,testMode:'none'});
            if(!Number.isFinite(envelope.pmax)){
              error('Maßgleiches Katalogprofil: zusätzliche konservative Druckgrenze nicht bestimmbar. Profil-/Anschlussdaten prüfen.');pRing=NaN;
            }else{
              rows.push(['Ringdruck aus scharfkantiger Geometrie','p_ring,geo',pRing,'bar'],['Zusätzliche Katalog-Druckgrenze','p_Katalog',envelope.pmax,'bar']);
              pRing=Math.min(pRing,envelope.pmax);
              notes.push(['',`Eigene Maße entsprechen ${match.name}. Geometriewerte bleiben scharfkantig; der Druck wird zusätzlich auf den Katalogpfad mit kleinerem Eigenträgheitsmoment begrenzt.`]);
              if(g.p>envelope.pmax) error('Zusätzliche konservative Druckgrenze des maßgleichen Katalogprofils überschritten.');
            }
            break;
          }
        }
      }
      const pmax=rings==='yes'?Math.min(actual.allow,pRing):actual.allow;
      // B6 7.1.1 / 7.4.1: Schalen- und Ringnachweise gemeinsam erfüllen.
      // Ring: Ausnutzung als Spannungs-/Stabilitätsverhältnis (nichtlinear in p); erreicht 1 beim selben Druck wie p_zul.
      const util=rings==='yes'?Math.max(g.p/actual.allow,ring.elasticUtil,ring.stressUtil,envelope?g.p/envelope.pmax:0):g.p/actual.allow;
      if(Number.isFinite(pmax)&&g.p>pmax&&!(util>1)) error('Zulässiger Gesamtdruck unterschritten.');
      if(g.p>actual.allow) error(`Außendruck ${H.fmt(g.p,3)} bar > Schale zulässig ${H.fmt(actual.allow,3)} bar.`);
      let test=null;
      if(testMode==='external'){
        if(!nonnegative(['pTest'])||!values(['ETest','K20','ST'])||(rings==='yes'&&!values(['ringK20']))) error('Ungültige Kennwerte für den äußeren Prüfzustand.');
        else if(geometryOK&&ringOK){
          // B6 4.1, Tafel 1: S'; 4.2: bei p' > 1,3p mindestens 2,2 SK/3.
          // Konservativ SK'=SK auch unterhalb dieser Schwelle; volle c1+c2 bleiben abgezogen.
          const st=Math.max(g.ST,table[1]),skt=SK;
          const tr=pressure(t,g.ETest,g.K20,st,skt);
          const rt=rings==='yes'?ringCheck(g.pTest,g.ETest,g.ringK20,Math.max(st,ringS),skt):null;
          const maxNominal=g.Da*(1-1/limit)/2;
          const reqT=H.solve(s=>pressure(s,g.ETest,g.K20,st,skt).allow-g.pTest,0,maxNominal-c)+c;
          const capTest=envelope?AD.modules.find(m=>m.id==='b6').calc({...g,p:0,testMode:'none',E:g.ETest,K:g.K20,S:st,ringK:g.ringK20,ringS:Math.max(st,ringS)}).pmax:Infinity;
          const sectionOK=rings!=='yes'||!automatic||sectionCheck(g.ETest,g.ringK20,'Prüfzustand');
          const ok=sectionOK&&Number.isFinite(reqT)&&g.pTest<=tr.allow&&g.pTest<=capTest&&(!rt||(rt.elasticUtil<1&&rt.stressUtil<=1));
          test={PT:g.pTest,req:reqT,have:g.sn,unit:'mm',ok,note:'Äußerer Prüfdruck vorgegeben; S′ nach Tafel 1, konservativ SK′ = SK und voller Abzug c1+c2. Ringgeometrie unverändert; E′ bei tatsächlicher Prüftemperatur verwenden.'};
          rows.push(['Prüfsicherheit plastisch','S′',st,'–'],['Prüfsicherheit elastisch','SK′',skt,'–'],['Schale zulässig bei Prüfung','p_zul′',tr.allow,'bar']);
          if(rt) rows.push(['Ringspannung bei Prüfung','σr′',rt.sigma,'N/mm²']);
          if(!ok) error('Äußerer Prüfzustand nicht erfüllt.');
        }
      }else notes.push(['w','Prüfzustand nicht berechnet: tatsächliche Druckrichtung und Randbedingungen der Druckprüfung gesondert nachweisen.']);
      notes.push(['','B6 5: kein Schweißnahtfaktor v. K muss zum Werkstoff nach Tafel 1 und zur Temperatur passen (Austenit: geeigneter Dehngrenzenkennwert). Kein Zeitstandnachweis.']);
      notes.push(['w','Ausschnitte nach B9, zusätzliche Axiallasten, Fertigung nach HP 1 und Wirksamkeit der Abschlussböden gesondert nachweisen.']);
      rows.push(['Außendruck','p',g.p,'bar'],['Wirksame Wanddicke','se−c1−c2',t,'mm'],['Freie Länge','l',l,'mm'],
        ['Längenverhältnis','Da/l',g.Da/l,'–'],['Unrundheit','u',u,'%'],['Querkontraktionszahl','ν',nu,'–'],
        ['Elastizitätsmodul','E',g.E,'N/mm²'],['Sicherheit gegen plastisches Verformen','S',S6,'–'],
        ['Zulässige Spannung','K/S',g.K/S6,'N/mm²'],['Sicherheit gegen Einbeulen','SK',SK,'–'],
        ['Mindestwanddicke (Ausnahme Wärmeaustauscherrohr)','smin',tubeType==='exchanger'?0:minWall,'mm'],
        ['Hilfsgröße','Z',Z,'–'],['Maßgebende Beulwellenzahl','n',actual.n,'–'],['Elastisch zulässiger Druck','p1',actual.p1,'bar'],
        ['Plastisch zulässiger Druck','p2',actual.p2,'bar'],['Zulässiger Außendruck','p_zul',pmax,'bar'],['Erforderliche Schalenwanddicke','s',req,'mm']);
      if(rings==='yes'&&automatic) rows.push(['Ringfläche ohne Schale','Ar',Ar,'mm²'],['Ring-Schwerpunkt ab Anschlussfläche','er',er,'mm'],['Eigen-Trägheitsmoment des Rings','Ir',Ir,'mm⁴'],['Seitenträgheitsmoment des Rings','Is',Is,'mm⁴'],['Ring-Deviationsmoment (axial/radial)','Ixz',Ixz,'mm⁴'],['Verbundschwerpunkt ab Anschlussfläche','e',e,'mm']);
      if(rings==='yes'&&automatic&&section==='angle') rows.push(['Verbund-Deviationsmoment','Ixz,m',IxzComposite,'mm⁴'],['Seitliches Anschlussmoment / radiales Biegemoment','Mz/Mx',IxzComposite/I,'–']);
      if(rings==='yes') rows.push(['Mittragende Schalenbreite','lm',lm,'mm'],['Verbundfläche','Am',A,'mm²'],['Verbund-Trägheitsmoment','Im',I,'mm⁴'],
        ['Verbund-Widerstandsmoment','Wm',W,'mm³'],['Schwerpunktdurchmesser','Dm',Dm,'mm'],['Elastischer Ringbeuldruck','pe',ring.pe,'bar'],
        ['Ring-Sicherheit','Sr',ringS,'–'],['Ringspannung','σr',ring.sigma,'N/mm²'],['Zulässige Ringspannung','Kr/Sr',g.ringK/ringS,'N/mm²'],
        ['Ringauslastung elastisch','ηr,e',ring.elasticUtil,'–'],['Ringauslastung Spannung','ηr,σ',ring.stressUtil,'–'],['Ring zulässiger Druck','p_ring',pRing,'bar']);
      if(!fail&&(!Number.isFinite(req)||!Number.isFinite(util)||!Number.isFinite(pmax)||pmax<=0||
        rows.some(r=>typeof r[2]==='number'&&!Number.isFinite(r[2]))||
        (test&&![test.PT,test.req,test.have].every(Number.isFinite)))) error('Ergebnis numerisch nicht vollständig bestimmbar; keine Druckfreigabe.');
      return {
        headline:{value:req,unit:'mm',label:'mm Schale erforderlich',of:`ausgeführt ${H.fmt(g.sn,1)} mm${rings==='yes'?'; Ringe gesondert':''}`},
        util,pmax,test,rows,notes,fail,
        formula:`B6 7.1.2: l = ${H.fmt(l,3)} mm (zwischen wirksamen Stützebenen)\n`+
          `s₀ = se − c1 − c2 = ${H.fmt(t,3)} mm; x = s₀/Da; Z = π·Da/(2·l) = ${H.fmt(Z,4)}\n`+
          `B6 (1): A = 1 + (n/Z)²; ganzzahlig n ≥ 2 und n > Z\np1 = min E/SK · [20·x/((n²−1)·A²) + 80·x³/(12·(1−ν²))·(n²−1+(2n²−1−ν)/A)]\n`+
          `ν = ${H.fmt(nu,3)}; SK = ${H.fmt(SK,3)}; n = ${H.fmt(actual.n,0)}; p1 = ${H.fmt(actual.p1,3)} bar\n`+
          (g.Da/l<=5?`B6 (4): p2 = 20·K/S·x / [1 + 1,5·u/100·(1−0,2·Da/l)/x]`:
            `B6 (5)/(6): p2 = max[20·K/S·x; 30·K/S·(s₀/l)²]`)+` = ${H.fmt(actual.p2,3)} bar\n`+
          `B6 (7)/(8): u = ${H.fmt(u,3)} %; S = ${H.fmt(S6,3)}\n`+
          (rings==='yes'&&automatic?`B6 7.4.1: Ringquerschnitt; Ar = ${H.fmt(Ar,3)} mm²; er = ${H.fmt(er,3)} mm; Ir = ${H.fmt(Ir,3)} mm⁴; Is = ${H.fmt(Is,3)} mm⁴\n`+
            `Steiner: Am = lm·s₀+Ar = ${H.fmt(A,3)} mm²; e = [Ar·er−lm·s₀²/2]/Am = ${H.fmt(e,3)} mm\n`+
            `Im = Σ(Ii+Ai·Δei²) = ${H.fmt(I,3)} mm⁴; Wm = Im/max(e+s₀; Profilhöhe−e) = ${H.fmt(W,3)} mm³\n`+
            `Ringlage: ${pos==='inside'?'innen':'außen'}; Dm = ${pos==='inside'?'Da−2·s₀−2·e':'Da+2·e'} = ${H.fmt(Dm,3)} mm\n`:'')+
          (rings==='yes'?`B6 (12): b = ${H.fmt(b,3)} mm; lm ≤ min[l; 1,1·√(Da·s₀)+b] = ${H.fmt(lmLimit,3)} mm\n`+
            `B6 (11): pe = 240·E·Im/[(1−ν²)·(Da−s₀)·Dm²·l] = ${H.fmt(ring.pe,3)} bar\n`+
            `B6 (9)/(10): p·SK < pe; σr = p·lm·Da/(20·Am) + p·l·Da²·u/[8000·Wm·(1−SK·p/pe)] = ${H.fmt(ring.sigma,3)} ≤ ${H.fmt(g.ringK/ringS,3)} N/mm²\n`:'')+
          `p_zul = ${H.fmt(pmax,3)} bar; Auslastung = ${H.fmt(util,3)}\n`+
          `s = kleinste Schalen-Nettowanddicke aus Drucknachweis + c1 + c2 = ${H.fmt(req,3)} mm; Mindestdicke und Ringnachweis zusätzlich beachten.`
      };
    }
  });
})(globalThis.AD);
