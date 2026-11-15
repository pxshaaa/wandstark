/* AD 2000 B9, Ausgabe 02.2010, korrigiert 09.2016.
 * Primärquelle (Abschnitte und Gleichungen unten):
 * (Normtext, nicht verlinkt)
 * Verifizierter Umfang: einzelner senkrechter, volltragend angeschlossener
 * Rohrstutzen im Zylinder; keine inneren Überstände, Zusatzlasten oder Nachbarn.
 * Die Ausgabe 2023 wurde nicht abgeglichen. Keine Scheibenanrechnung.
 */
(function(AD){
'use strict';
AD.register({
  id:'b9', name:'Stutzen', code:'B9', group:'Ausschnitte',
  icon:'<path d="M4 22h12V5h12v17h12M4 28h36M16 5h12M20 5v17M24 5v17"/>',
  fields:[
    {id:'Da',label:'Mantel-Außendurchmesser',sym:'Da',unit:'mm',def:1000},
    {id:'sn',label:'Mantelwanddicke am Ausschnitt',sym:'se',unit:'mm',def:12},
    {id:'dA',label:'Stutzen-Außendurchmesser',sym:'dA',unit:'mm',def:114.3},
    {id:'ss',label:'Stutzenwanddicke',sym:'sS',unit:'mm',def:8},
    {id:'ls',label:'Verfügbarer äußerer Stutzenüberstand',sym:'lS,vorh',unit:'mm',def:80,min:'zero',help:'Ab Mantelaußenfläche; innere Überstände werden nicht angerechnet.'},
    {id:'mount',label:'Stutzenanschluss',type:'select',def:'on',options:[['on','Aufgesetzt'],['in','Eingesetzt (ohne Zusatzanrechnung)']]},
    {id:'Ks',label:'Stutzenkennwert bei Temperatur (0 = Mantel)',sym:'Ks',unit:'N/mm²',def:0,min:'zero'},
    {id:'Ss',label:'Stutzensicherheit (0 = Mantel)',sym:'Ss',unit:'–',def:0,min:'zero'},
    {id:'hp',label:'Scheibendicke (ohne Anrechnung)',sym:'h',unit:'mm',def:0,min:'zero'},
    {id:'bp',label:'Radiale Scheibenbreite (ohne Anrechnung)',sym:'bS',unit:'mm',def:0,min:'zero'}
  ],
  help:'B9 (02.2010): isolierter, senkrechter Einzelstutzen unter Innendruck. Volltragender Anschluss und ungestörter Mantel über die mittragende Breite b, mindestens 3·se, erforderlich. Keine äußeren Kräfte, Momente oder Nachbaröffnungen. Zuschläge c1 und c2 gelten auch für das Stutzenrohr. Verstärkungsscheiben werden nicht angerechnet.',
  draw(g,H,r){
    H=H||AD.h;
    const D=H.draw,W=420,V=320,title='Stutzen · Längsschnitt';
    const empty=()=>D.svg(W,V,D.text(210,140,'Maße eingeben'),{title,sub:'AD 2000 B9'});
    if(!g||!['Da','sn','dA','ss'].every(k=>Number.isFinite(g[k])&&g[k]>0)||
       !['ls','hp','bp'].every(k=>Number.isFinite(g[k])&&g[k]>=0)||
       g.Da<=2*g.sn||g.dA<=2*g.ss||g.dA>=g.Da||!['on','in'].includes(g.mount)) return empty();
    // B9 §4.1, Bild 9: lokale abgewickelte Längsschnittdarstellung.
    // b (§4.3.1 Gl. 3) und lS (§4.4.3 Gl. 6) ausschließlich aus calc-Zeilen;
    // keine zweite Berechnung oder ungesicherte Ersatzformel in der Zeichnung.
    const row=s=>r&&Array.isArray(r.rows)?r.rows.find(x=>x[1]===s):null;
    const val=s=>{const a=row(s);return a&&Number.isFinite(a[2])?a[2]:null;};
    const b=val('b'), l=val('lS'), have=b!==null&&l!==null&&b>0&&l>=0&&l<=g.ls;
    const bw=have?b:0;
    const realW=g.dA+2*Math.max(bw,g.bp,g.dA*.3);
    const k=D.fit(realW,g.ls+g.sn+g.hp,285,122,0);
    const cx=210, y=172, half=g.dA*k/2;
    const t=Math.max(5,Math.min(22,g.sn*k)), u=Math.max(5,Math.min(half*.45,g.ss*k));
    // Extrem schmale Details sind nicht sinnvoll darstellbar.
    if(!Number.isFinite(k)||half<6||half>140||t>=80) return empty();
    const xl=cx-half,xr=cx+half, il=xl+u, ir=xr-u;
    const projection=g.ls*k, top=y-projection, bottom=y+t, end=g.mount==='in'?bottom:y;
    const bad=r&&(r.ok===false||r.fail||r.util>1), cls=bad?'o bad':'o';
    let body=D.text(16,20,(g.mount==='in'?'Eingesetzt':'Aufgesetzt')+' · Maße in mm','start','tx tb2');
    // Aufgesetzt: Bohrung im Mantel = lichte Stutzenweite; eingesetzt:
    // Mantel endet außen am Rohr, das Rohr reicht bis zur Mantelinnenfläche.
    const edgeL=g.mount==='in'?xl:il,edgeR=g.mount==='in'?xr:ir;
    body+=D.rect(55,y,edgeL-55,t,'o',true)+D.rect(edgeR,y,365-edgeR,t,'o',true);
    body+=D.tag('mount',D.rect(xl,top,u,end-top,cls,2)+D.rect(ir,top,u,end-top,cls,2));
    body+=D.centre(cx,35,cx,253);
    body+=D.tag('dA',D.dim(xl,top,xr,top,-15,'dA '+H.fmt(g.dA,1)));
    body+=D.tag('sn',D.dim(365,y,365,bottom,-20,'se '+H.fmt(g.sn,1)));
    body+=D.tag('ls',D.dim(xl,top,xl,y,22,'lvorh '+H.fmt(g.ls,1)));
    body+=D.tag('ss',D.dim(ir,top,xr,top,-31,'sS '+H.fmt(g.ss,1)));
    if(g.hp>0&&g.bp>0){
      const ph=Math.min(20,Math.max(5,g.hp*k)), pw=Math.min(g.bp*k,140-half);
      body+=D.tag('hp bp',D.rect(xl-pw,y-ph,pw,ph,'o',2)+D.rect(xr,y-ph,pw,ph,'o',2));
      body+=D.tag('bp',D.dim(xr,y-ph,xr+pw,y-ph,-12,'bS '+H.fmt(g.bp,1)));
      body+=D.tag('hp',D.dim(xl-pw,y-ph,xl-pw,y,14,'h '+H.fmt(g.hp,1)));
    }
    if(have){
      const B=b*k,L=l*k;
      // B9 Bild 9 / §4.1: rechte Schnitt-Hälfte, Aσ0 und Aσ1 markiert;
      // Nettoflächenwerte aus calc, Nennwandkonturen nur zur Orientierung.
      body+=D.rect(xr,y,B,t,bad?'t bad':'t',2);
      body+=D.rect(ir,y-L,u,L,bad?'t bad':'t',true);
      body+=D.dim(xr,bottom,xr+B,bottom,22,'b '+H.fmt(b,1)); // derived values (b, lS, Aσ) are not input fields
      body+=D.dim(xr,y-L,xr,y,-18,'lS '+H.fmt(l,1));
      body+=D.leader(xr+B*.65,y+t/2,300,224,'Aσ0');
      body+=D.leader(ir+u/2,y-L/2,300,115,'Aσ1');
      // B9 Bild 9: Ap im Längsschnitt als dünn gestrichelte Umrissfläche.
      // Bis zur Behälterachse verkürzt gezeichnet (Achse im lokalen Detail
      // außerhalb des Maßstabs); kein Flächenmaß aus SVG-Geometrie ableiten.
      body+=D.pline([[cx,245],[xr+B,245],[xr+B,bottom],[ir,bottom],[ir,y-L],[cx,y-L],[cx,245]],'t h');
      body+=D.text(cx+18,238,'Ap','start','tx dt');
      body+=D.text(16,264,'Aσ: Nettoflächen, rechts markiert','start','tx tb2');
    }else body+=D.text(16,264,'b, lS, Aσ, Ap: gültiges Ergebnis nötig','start','tx tb2');
    // Separater Mantelquerschnitt: vollständiges Durchmessermaß, nicht
    // am abgewickelten Detail oder an der verkürzten Ap-Fläche bemaßen.
    body+=D.tag('Da',D.circle(85,231,18,'o',true)+D.circle(85,231,14,'frame2')+D.circle(85,231,14,'o'));
    body+=D.centre(60,231,110,231)+D.centre(85,208,85,253);
    body+=D.tag('Da',D.text(110,234,'Mantel Da '+H.fmt(g.Da,1),'start','tx dt'));
    body+=D.text(16,278,'Mantel lokal abgewickelt; Ap verkürzt','start','tx tb2');
    if(Math.abs(t-g.sn*k)>1e-6||Math.abs(u-g.ss*k)>1e-6) body+=D.text(16,306,'Wände schematisch','start','tx tb2');
    return D.svg(W,V,body,{title,sub:'AD 2000 B9 · Scheibe ohne Anrechnung'});
  },
  calc(g,H){
    H=H||AD.h;
    const notes=[], rows=[];
    let fail=false;
    const error=text=>{notes.push(['e',text]);fail=true;};
    const finish=(util=Infinity,pmax=NaN,formula='Keine gültige Berechnung möglich.')=>({
      headline:{value:util*100,unit:'%',label:'% Auslastung (B9/B1)',of:'zulässig höchstens 100 %'},
      util,pmax,test:null,rows,notes,fail,formula
    });
    const a=Object.assign({mount:'on',Ks:0,Ss:0,hp:0,bp:0},g);
    const positive=['Da','sn','dA','ss','K','S','v'];
    const nonnegative=['p','c1','c2','ls','Ks','Ss','hp','bp'];
    if(positive.some(k=>!Number.isFinite(a[k])||a[k]<=0)||
       nonnegative.some(k=>!Number.isFinite(a[k])||a[k]<0)||a.v>1||!['on','in'].includes(a.mount)){
      error('Ungültige Eingaben: Maße und Festigkeiten müssen positiv, Zuschläge, Überstand und Druck nichtnegativ sein; 0 < v ≤ 1.');
      return finish();
    }
    // B9 §3 / §4.1: Zuschläge gemäß B0, Nettoquerschnitte.
    const c=a.c1+a.c2, t=a.sn-c, u=a.ss-c;
    // B9 Bild 9, geometrische Innendurchmesser der ausgeführten Teile.
    const Di=a.Da-2*a.sn, di=a.dA-2*a.ss;
    if(t<=0||u<=0||Di<=0||di<=0){
      error('Mantel und Stutzen benötigen positive Innendurchmesser und positive Wanddicken nach Abzug von c1 + c2.');
      return finish();
    }
    // B9 §1.1 (1), (4): Untergrenze mit Ausnahme für kleine Öffnungen.
    const rel=t/a.Da, ratio=di/Di;
    if(rel<0.002&&di/a.Da>1/3) error('B9 §1.1 (4): Bei (se−c)/Da < 0,002 muss di/Da ≤ 1/3 sein.');
    if(rel>0.1) error('Außerhalb des Modulumfangs: (se−c)/Da > 0,1; dickwandige Fälle nach B9 §1.1 (2) sind nicht implementiert.');
    // B9 §1.1 (5): vorsorglich auf sämtliche Werkstoffe/Lastfälle eingeschränkt.
    if(ratio>0.8) error(`di/Di = ${H.fmt(ratio,3)} > 0,8: außerhalb des konservativ begrenzten Modulumfangs (B9 §1.1 (5)).`);
    // B9 §4.1 fordert außerdem den ungeschwächten Mantelnachweis nach B1.
    if(a.Da/Di>1.2||a.dA/di>1.2) error('B1-Dünnwandgrenze Da/Di ≤ 1,2 für Mantel oder Stutzen überschritten; B10 ist hier nicht implementiert.');
    // B9 §4.4.2 Gl. (5): keine zusätzliche Anrechnung über das Verhältnis 2.
    if(u/t>2) error(`B9 §4.4.2: Netto-Wanddickenverhältnis sS/sA = ${H.fmt(u/t,3)} > 2.`);
    // Review-Fix: B1 §6 Mindestwanddicke 2 mm für Mantel und Stutzen (wie Modul B1).
    if(a.sn<2) error('Mantel: Mindestwanddicke 2 mm für Stahl (B1) unterschritten.');
    if(a.ss<2) error('Stutzen: Mindestwanddicke 2 mm für Stahl (B1) unterschritten.');
    const applicable=!fail;
    // B9 §4.3.1 Gl. (3), §4.1: maximale mittragende Mantelbreite.
    const b=Math.sqrt((Di+t)*t);
    // B9 §4.4.3 Gl. (6): fS = 1,25 beim senkrechten Zylinderstutzen;
    // §4.1: höchstens vorhandene Länge anrechnen.
    const lmax=1.25*Math.sqrt((di+u)*u), l=Math.min(a.ls,lmax);
    // B9 §4.1, Bild 9; Anhang Gl. (10): Aσ = b·sA + lS·sS.
    const A0=b*t, A1=l*u, As=A0+A1;
    // B9 Anhang Gl. (10), Nenner, umgestellt mit Bild 9:
    // Ap = Di/2·[b+sS+di/2 + di/Di·(lS+sA)].
    const Ap=Di/2*(b+u+di/2)+di/2*(l+t);
    // B9 §2.6 und §4.1 Gl. (2): höhere Verstärkungsfestigkeit nicht nutzen.
    const Ks=a.Ks||a.K, Ss=a.Ss||a.S, f0=a.K/a.S, f1=Math.min(Ks,a.K)/Ss; // Review-Fix: B9 §2.6/Gl. (2) Ki ≤ K0 vor Division durch S
    // UNVERIFIED: B9 Gl. (2) enthält keinen pauschalen Nahtfaktor.
    // Konservative Erweiterung: zulässige Spannungen beider Teile mit v reduzieren.
    const f0v=f0*a.v, f1v=f1*a.v;
    // B9 §4.1 Gl. (2): Druckkraft / verbleibende Querschnittstragfähigkeit.
    const capacity=(f0v-a.p/20)*A0+(f1v-a.p/20)*A1;
    const demand=a.p/10*Ap;
    const areaUtil=capacity>0?demand/capacity:Infinity;
    // B9 §4.1 Gl. (2), nach p aufgelöst; bar, da 1 bar = 0,1 N/mm².
    const pArea=10*(f0v*A0+f1v*A1)/(Ap+As/2);
    // B1 Gl. (2), über B9 §4.1 vorgeschrieben: ungeschwächte Teile.
    const shellReq=a.Da*a.p/(20*f0v+a.p)+c;
    const nozzleReq=a.dA*a.p/(20*(Ks/Ss)*a.v+a.p)+c;
    // B1 Gl. (2), nach p aufgelöst, Netto-Wanddicke vorgegeben.
    const pShell=20*f0v*t/(a.Da-t), pNozzle=20*(Ks/Ss)*a.v*u/(a.dA-u);
    if(![c,t,u,Di,di,rel,ratio,b,lmax,l,A0,A1,As,Ap,f0,f1,f0v,f1v,capacity,demand,pArea,shellReq,nozzleReq,pShell,pNozzle].every(Number.isFinite)){
      error('Berechnung außerhalb des endlichen Zahlenbereichs; kein zulässiger Druck bestimmbar.');return finish();
    }
    if(pArea<=0||pShell<=0||pNozzle<=0){error('Kein positiver endlicher Grenzdruck; Zahlenbereich unterschritten.');return finish();}
    const pLimit=Math.min(pArea,pShell,pNozzle);
    // Exact algebraic pressure boundary; do not admit any positive overload.
    const rawUtil=Math.max(areaUtil,a.p/pShell,a.p/pNozzle);
    const util=a.p===pLimit?1:a.p<pLimit?Math.min(1,rawUtil):Math.max(1+Number.EPSILON,rawUtil);
    if(a.p>pShell) error(`Ungeschwächter Mantel nach B1 unzureichend: ${H.fmt(shellReq)} mm erforderlich.`);
    if(a.p>pNozzle) error(`Stutzenrohr nach B1 unzureichend: ${H.fmt(nozzleReq)} mm erforderlich.`);
    if(a.p>pArea) error(`B9-Flächenvergleich nicht erfüllt: Auslastung ${H.fmt(areaUtil*100,1)} %.`);
    notes.push(['','Berechnung nach B9, Ausgabe 02.2010, korrigiert 09.2016; kein Abgleich mit Ausgabe 2023.']);
    notes.push(['',`Unbeeinflusste Mantelbreite mindestens ${H.fmt(Math.max(b,3*a.sn))} mm ab Ausschnittsrand sicherstellen (B9 §4.4.1). Anschlussnähte nach §2.5.3 gesondert nachweisen.`]);
    notes.push(['w','Nur isolierter radialer Einzelstutzen; Nachbaröffnungen, Randnähe, Ermüdung, Zeitstand und äußere Lasten sind nicht nachgewiesen. Kein Prüfdrucknachweis.']);
    if(a.mount==='in'){
      // UNVERIFIED: Detailgeometrie des eingesetzten Anschlusses nicht verifiziert.
      // Konservativ mit aufgesetztem Stutzen rechnen: kein Wanddurchtritts-
      // oder Innenüberstandsquerschnitt; keine 20-%-Ermäßigung nach §4.4.1.
      notes.push(['w','UNVERIFIED: Eingesetzter Stutzen konservativ wie aufgesetzt gerechnet; Wanddurchtritt und innerer Überstand ohne Anrechnung. Anschlussdetail gesondert prüfen.']);
    }
    if(a.hp>0||a.bp>0){
      // UNVERIFIED: Bild-9-Scheibengeometrie nicht verifiziert: Aσ2 = 0.
      notes.push(['w','UNVERIFIED: Verstärkungsscheibe nicht angerechnet (Aσ2 = 0). Ergebnis gilt nur für den Mantel und das Stutzenrohr ohne Scheibenwirkung; Scheibe und Schweißnähte gesondert prüfen.']);
    }
    if(a.v<1) notes.push(['w','UNVERIFIED: Nahtfaktor v konservativ auf beide zulässigen Spannungen angewendet; B9-Anschlussnahtnachweis bleibt erforderlich.']);
    if(Ks>a.K) notes.push(['','Festigkeitskennwert des Stutzens für die Verstärkung auf den Mantelkennwert begrenzt (B9 §2.6); Sicherheitsbeiwerte separat berücksichtigt.']);
    rows.push(['Netto-Mantelwand','se−c',t,'mm'],['Netto-Stutzenwand','sS−c',u,'mm'],
      ['Mantel-Innendurchmesser','Di',Di,'mm'],['Stutzen-Innendurchmesser','di',di,'mm'],
      ['Durchmesserverhältnis','di/Di',ratio,'–'],['Relative Mantelwand','(se−c)/Da',rel,'–'],
      ['Mittragende Mantelbreite','b',b,'mm'],['Maximale Stutzenlänge','lS,max',lmax,'mm'],['Angerechnete Stutzenlänge','lS',l,'mm'],
      ['Tragender Mantelquerschnitt','Aσ0',A0,'mm²'],['Tragender Stutzenquerschnitt','Aσ1',A1,'mm²'],['Tragender Scheibenquerschnitt','Aσ2',0,'mm²'],
      ['Tragender Gesamtquerschnitt','Aσ',As,'mm²'],['Druckbelastete Fläche','Ap',Ap,'mm²'],
      ['Zulässige Mantelspannung mit v','f0',f0v,'N/mm²'],['Angerechnete Stutzenspannung mit v','f1',f1v,'N/mm²'],
      ['Druckkraft','p·Ap/10',demand,'N'],['Verbleibende Tragfähigkeit','Σ(fi−p/20)·Aσi',capacity,'N'],
      ['Mantelwand nach B1','s,B1',shellReq,'mm'],['Stutzenwand nach B1','sS,B1',nozzleReq,'mm'],
      ['Grenzdruck Flächenvergleich','p,B9',pArea,'bar'],['Grenzdruck Mantel','p,B1',pShell,'bar'],['Grenzdruck Stutzen','pS,B1',pNozzle,'bar'],['Auslastung Flächenvergleich','ηB9',areaUtil,'–'],['Maßgebende Auslastung','η',util,'–']);
    // Keine zulässige Druckangabe außerhalb der geprüften Anwendungsgrenzen.
    const pmax=applicable?Math.min(pArea,pShell,pNozzle):NaN;
    return finish(util,pmax,
      `b = √[(Di+t)·t] = ${H.fmt(b)} mm\nlS = min(lvorh; 1,25·√[(di+u)·u]) = ${H.fmt(l)} mm\n`+
      `Aσ0 = b·t = ${H.fmt(A0)} mm²; Aσ1 = lS·u = ${H.fmt(A1)} mm²\n`+
      `Ap = Di/2·(b+u+di/2) + di/2·(lS+t) = ${H.fmt(Ap)} mm²\n`+
      `p·Ap/10 ≤ (f0−p/20)·Aσ0 + (f1−p/20)·Aσ1\n`+
      `${H.fmt(a.p)}·${H.fmt(Ap)}/10 = ${H.fmt(demand)} N ≤ ${H.fmt(capacity)} N\n`+
      `ηB9 = ${H.fmt(areaUtil,4)}; η = ${H.fmt(util,4)}; pB9 = ${H.fmt(pArea)} bar\n`+
      `B1: s = Da·p/(20·K/S·v+p)+c; Mantel ${H.fmt(shellReq)} mm, Stutzen ${H.fmt(nozzleReq)} mm.`);
  }
});
})(globalThis.AD);
