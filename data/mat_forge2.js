/* Product-specific sourced minima, N/mm²; temperature °C.
 * No plate-table substitutions. tR is the as-heat-treated ruling section.
 */
(function(AD){
  'use strict';
  const f2='(Normtext, nicht verlinkt)';
  const f4='(Normtext, nicht verlinkt)';
  const f5='(Normtext, nicht verlinkt)';
  const cast='(Normtext, nicht verlinkt)';
  const bolt='(Normtext, nicht verlinkt)';
  const api='(Normtext, nicht verlinkt)';
  const iso='(Normtext, nicht verlinkt)';
  const b0='(Normtext, nicht verlinkt)';
  const forge='EN Schmiedestück', casting='EN Stahlguss', bars='EN Stab/Schraube';
  const section=' tR ist der maßgebende wärmebehandelte Querschnitt, keine fertige Wanddicke; andere Querschnittsformen nach EN 10222-1 Anhang A prüfen.';
  function add(grade,num,std,product,family,type,Rm,K,source,extra='',aliases=[]){
    const id=grade+' | '+std+' | '+product;
    // Fail explicitly rather than silently add an already loaded product row.
    if(AD.materials.some(m=>m.id===id)) throw new Error('Doppelter Werkstoff: '+id);
    AD.materials.push({id,name:grade+(num?' ('+num+')':''),std,product,family,type,Rm,K,
      aliases:num?[num,...aliases]:aliases,S:family===casting?2:1.5,Tmax:K[K.length-1][0],
      note:'QUELLE: '+source+extra+' S = '+(family===casting?'2,0 für Stahlguss ohne besonderen Prüfnachweis':'1,5 für Walz-/Schmiedestahl')+': AD 2000 B0 (11/2008), §7, Tafel 2 ('+b0+'). Tmax ist nur das Ende der K-Tabelle, keine Zeitstandfreigabe; gegebenenfalls AD B0 §5.2/S6 prüfen. Kein werkstoffspezifischer E-Modul hinterlegt.'});
  }
  const s2='EN 10222-2:2017+A1:2021, Tabelle 4 (ReH, Rm, Werkstoffnummer), Tabelle 5 (Rp0,2), Tabelle 1 (Lieferzustand) ('+f2+').';
  const reNote=section+' K20 = ReH; bei Ersatz durch Rp0,2 nach Tabelle 4 Fußnote b ist der Raumtemperatur-Mindestwert um 10 MPa niedriger; entsprechend dem Zeugnis wählen.';
  add('P235GH','1.0345','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +N',forge,'ferritic',360,
    [[20,235],[100,190],[150,180],[200,170],[250,150],[300,130],[350,120],[400,110]],s2,reNote);
  add('P250GH','1.0460','EN 10222-2:2017+A1:2021','tR ≤ 60 mm, +N',forge,'ferritic',410,
    [[20,250],[100,237],[150,216],[200,190],[250,170],[300,150],[350,130],[400,110],[420,90]],s2,reNote+' Tabelle 5 Fußnote c: Der in der 450-°C-Spalte gedruckte Wert gilt tatsächlich für 420 °C; deshalb Stützstelle bei 420 °C.');
  add('P265GH','1.0425','EN 10222-2:2017+A1:2021','tR ≤ 60 mm, +N',forge,'ferritic',410,
    [[20,245],[100,215],[150,205],[200,195],[250,175],[300,155],[350,140],[400,130]],s2,reNote);
  add('P295GH','1.0481','EN 10222-2:2017+A1:2021','tR ≤ 60 mm, +NT',forge,'ferritic',460,
    [[20,285],[100,250],[150,235],[200,225],[250,205],[300,185],[350,170],[400,155]],s2,reNote);
  const s4='EN 10222-4:2017, Tabellen 1/4 (Lieferzustand, ReH, Rm, Werkstoffnummer) ('+f4+').';
  add('P355NH','1.0565','EN 10222-4:2017','tR ≤ 16 mm, +N',forge,'ferritic',490,
    [[20,355],[50,343],[100,323],[150,299],[200,275],[250,252],[300,232],[350,214],[400,202]],s4+' Rp0,2: Tabelle 6. ',section+' K20 = ReH; bei Ersatz durch Rp0,2 nach Tabelle 4 Fußnote c ist K20 um 10 MPa niedriger.');
  for(const [g,n] of [['P355NL1','1.0566'],['P355NL2','1.1106']])
    add(g,n,'EN 10222-4:2017','tR ≤ 16 mm, teq < 40 mm, +N',forge,'ferritic',490,[[20,355]],s4,
      section+' K20 = ReH; bei Ersatz durch Rp0,2 nach Tabelle 4 Fußnote c ist K20 um 10 MPa niedriger. Tabelle 1 Fußnote c: teq < 40 mm. UNVERIFIED: Warmfestigkeit; Tabelle 6 führt NL1/NL2 nicht auf, deshalb keine erhöhten K-Stützstellen und keine Übertragung von NH.');
  add('1.4541','1.4541','EN 10222-5:2017','tR ≤ 450 mm, +AT',forge,'austenitic',510,
    [[20,235],[100,208],[150,196],[200,186],[250,177],[300,167],[350,161],[400,156],[500,149]],
    'EN 10222-5:2017, Tabelle 4 (Rp1,0, Rm), Tabelle 6 (Rp1,0 bei erhöhter Temperatur), Tabellen 1/2 (Zustand/Bezeichnung) ('+f5+').',
    section+' K = Rp1,0, nicht Rp0,2.', ['X6CrNiTi18-10']);
  const sc='EN 10213:2007, Tabelle 3 (Rp1,0 für Austenite bzw. Rp0,2 für ferritischen Guss, Rm, Zustand, Wanddicke), Tabelle 6 (Warmdehngrenze; Prüfung bei Bestellung vereinbaren) ('+cast+').';
  for(const [g,n,k,hot] of [
    ['GX2CrNi19-11','1.4309',210,[165,130,110]],
    ['GX2CrNiMo19-11-2','1.4409',220,[175,145,115]],
    ['GX5CrNiMoNb19-11-2','1.4581',210,[185,160,145]]
  ]) add(g,n,'EN 10213:2007','t ≤ 150 mm, +AT',casting,'austenitic',440,
    [[20,k],[100,hot[0]],[200,hot[1]],[300,hot[2]]],sc,' Austenitischer Stahlguss: K = Rp1,0 (Tabelle 6 Fußnote a). Tabelle bewusst auf eindeutig belegte Punkte bis 300 °C begrenzt.');
  add('G17CrMoV5-10','1.7706','EN 10213:2007','t ≤ 150 mm, +QT',casting,'cast',590,
    [[20,440],[200,385],[300,365],[350,350],[400,335],[450,320],[500,300],[550,260]],sc,' Ferritischer Stahlguss: K = Rp0,2.');
  const sb='EN 10269:2013, Tabelle 4 (Rp0,2, Rm), Tabelle 6 (Rp0,2 bei erhöhter Temperatur), Tabelle 2 (Werkstoffnummer) ('+bolt+').';
  add('X22CrMoV12-1','1.4923','EN 10269:2013','d ≤ 160 mm, +QT1',bars,'ferritic',800,
    [[20,600],[100,560],[200,530],[300,480],[400,420],[450,380],[500,335]],sb,' Ausgangsmaterial für Verbindungselemente; fertige Schraube nach AD W7 prüfen. Nur QT1; QT2 nicht gleichsetzen.');
  add('40CrMoV4-6','1.7711','EN 10269:2013','d ≤ 100 mm, +QT',bars,'ferritic',850,
    [[20,700],[100,670],[150,647],[200,631],[250,608],[300,593],[350,577],[400,554],[450,523],[500,470],[550,400],[600,293]],sb,' Ausgangsmaterial für Verbindungselemente; fertige Schraube nach AD W7 prüfen.');
  add('X19CrMoNbVN11-1','1.4913','EN 10269:2013','d ≤ 160 mm, +QT',bars,'ferritic',900,
    [[20,750],[100,701],[150,676],[200,651],[250,643],[300,627],[350,610],[400,577],[450,544],[500,495],[550,412],[600,305]],
    'EN 10269:2013, Tabelle 5 (Rp0,2, Rm), Tabelle 7 (Rp0,2 bei erhöhter Temperatur), Tabelle 2 (Werkstoffnummer) ('+bolt+').',
    ' ACHTUNG: Tabellen 5/7 Fußnote b: Sorte/Zustand erfüllt ohne weitere Kriterien nicht die wesentlichen Sicherheitsanforderungen der Richtlinie 97/23/EG, Anhang I §7.5. Keine automatische PED-/AD-W7-Freigabe.');
  for(const [g,a,k,rm] of [['L175','A25',175,310],['L175P','A25P',175,310],['L210','A',210,335]])
    add(g+' ('+a+') PSL1',null,'EN ISO 3183:2012 / API 5L:2012',
      'Leitungsrohr, PSL1'+(k===175?', D ≤ 141,3 mm':'')+(g==='L175P'?', Gewindeenden':''),
      'Leitungsrohr','ferritic',rm,[[20,k]],
      'API 5L, 45. Ausgabe 2012, Tabelle 6 (Rohrkörper: Rt0,5 min., Rm min.), Tabelle 2 Fußnote b (D-Grenze), §9.12.1.1 (Gewindeenden L175P) ('+api+'). ISO-Bezug: ISO 3183:2012, Tabelle 6 ('+iso+').',
      ' K = Rt0,5. UNVERIFIED: Warmfestigkeit; keine erhöhten K-Stützstellen. AD-Werkstoffeignung gesondert prüfen.',[g,a,'API 5L '+a]);
})(globalThis.AD);
