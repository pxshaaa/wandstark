/* Ergänzende Rohrkennwerte: °C, N/mm², mm; keine Blechkennwerte.
 * Historische Normausgaben und Lieferzustände sind ausdrücklich angegeben.
 * Tieftemperatursorten bleiben auftragsgemäß auf Raumtemperatur beschränkt.
 */
(function(AD){
  'use strict';
  const src = {
    en2:'(Normtext, nicht verlinkt)',
    en3:'(Normtext, nicht verlinkt)',
    en4:'(Normtext, nicht verlinkt)',
    en5:'(Normtext, nicht verlinkt)',
    w7:'(Normtext, nicht verlinkt)'
  };
  const safety = ' S = 1,5: AD 2000 B0 (11/2008), §7, Tafel 2, Walzstahl ((Normtext, nicht verlinkt)). Schweißnahtfaktor v gesondert berücksichtigen.';
  const limit = ' Tmax ist das K-Tabellenende, keine Einsatzfreigabe; gegebenenfalls zusätzlicher Zeitstandnachweis nach AD 2000 B0 §5.2 / S6. Kein werkstoffspezifischer E-Modul hinterlegt.';
  const entries = [];
  function add(grade,number,std,product,type,K,Rm,note,A){
    const id = grade+' | '+std.split(':')[0]+' | '+product;
    // Doppelte Einträge werden als Datenfehler sichtbar, nicht still übersprungen.
    if(AD.materials.some(m=>m.id===id)||entries.some(m=>m.id===id)) throw new Error('Duplicate material: '+id);
    const m = {id,name:grade+(grade===number?'':' ('+number+')')+' Rohr',family:'EN Rohr',
      std,product,type,K,Rm,S:1.5,aliases:[number],Tmax:K[K.length-1][0],note:note+safety+limit};
    if(A!==undefined) m.A=A;
    entries.push(m);
    return m;
  }
  const hot = (room,values,start=100) => [[20,room],...values.map((v,i)=>[start+50*i,v])];

  // Tabelle 4 trennt die Lieferzustände; Tabelle 5 gilt bis zur jeweils genannten Wanddicke.
  for(const [grade,number,state,band,k,rm,values] of [
    ['11CrMo9-10','1.7383','+QT',60,355,540,[323,312,304,296,289,280,275,257,239]],
    ['X11CrMo5+I','1.7362','+I',100,175,430,[156,150,148,147,145,142,137,129,116]],
    ['X11CrMo5+NT1','1.7362','+NT1',100,280,480,[245,237,230,223,216,206,196,181,167]],
    ['X11CrMo5+NT2','1.7362','+NT2',100,390,570,[366,350,334,332,309,299,289,280,265]],
    ['X11CrMo9-1+I','1.7386','+I',60,210,460,[187,186,178,177,175,171,164,153,142,120]],
    ['X11CrMo9-1+NT','1.7386','+NT',60,390,590,[363,348,334,330,326,322,316,311,290,235]]
  ]) add(grade,number,'EN 10216-2:2002','Nahtloses Rohr, t ≤ '+band+' mm, '+state,'ferritic',hot(k,values),rm,
    'QUELLE: EN 10216-2:2002, Tabelle 1 (Lieferzustand), Tabelle 4 (ReH/Rp0,2 und Rm), Tabelle 5 (Rp0,2, 100–'+(values.length===10?'550':'500')+' °C), '+state+', t ≤ '+band+' mm ('+src.en2+'). Tabelle 4 nennt in allen hier zusammengefassten Dickenstufen denselben Raumtemperaturwert; Tabelle 5 fasst sie ausdrücklich zusammen. Warmzugprüfung nach §8.3.2 / Option 6 vereinbaren.');

  // Erste Dickenstufe ist vollständig belegt; keine Übertragung auf dickere Rohre.
  for(const [grade,number,k,rm,values,rmValues] of [
    ['P355NH','1.0565',355,490,[304,284,255,235,216,196,167],[440,430,410,410,410,400,390]],
    ['P460NH','1.8935',460,560,[402,373,343,314,294,265,235],[510,490,480,480,480,470,460]],
    ['P275NL1','1.0488',275,390],['P275NL2','1.1104',275,390],
    ['P355NL1','1.0566',355,490],['P355NL2','1.1106',355,490],
    ['P460NL1','1.8915',460,560],['P460NL2','1.8918',460,560]
  ]){
    const m=add(grade,number,'EN 10216-3:2002','Nahtloses Rohr, t ≤ 12 mm, +N','ferritic',hot(k,values||[]),rm,
      'QUELLE: EN 10216-3:2002, Tabelle 4 (ReH/Rp0,2 und Rm, erste Dickenstufe), '+
      (values?'Tabelle 5 (Rp0,2, 100–400 °C), Tabelle 6 (Rm bei erhöhter Temperatur, t ≤ 30 mm)':'§8.3.2 und Tabellen 5/6 bzw. Anhang A für optionale Warmkennwerte')+
      ' ('+src.en3+'). '+(values?'Warmzugprüfung bei 400 °C nach Option 4 vereinbaren.':'Nur Raumtemperatur für Tieftemperatursorten. Warmwerte ohne bestellte Option 5 UNVERIFIED und nicht in K enthalten.'));
    if(rmValues) m.RmT=rmValues.map((v,i)=>[100+50*i,v]);
  }

  for(const [grade,number,k,rm] of [
    ['P255QL','1.0452',255,360],['12Ni14','1.5637',345,440],
    ['X12Ni5','1.5680',390,510],['X10Ni9','1.5682',510,690]
  ]) add(grade,number,'EN 10216-4:2002','Nahtloses Rohr, t ≤ 40 mm','ferritic',[[20,k]],rm,
    'QUELLE: EN 10216-4:2002, Tabelle 4 (ReH/Rp0,2 und Rm bei Raumtemperatur, t ≤ 40 mm; keine zusätzliche Dickenbeschränkung der Fußnoten b/c für diese vier Sorten) ('+src.en4+'). Nur Raumtemperatur; erhöhte Temperaturkennwerte UNVERIFIED und nicht in K enthalten.');

  // Austenit: K = Rp1,0, rechte Hälfte der Tabelle 9; A jeweils quer.
  for(const [grade,k,rm,A,values] of [
    ['1.4306',215,460,35,[200,180,160,145,135,127,121,116,112,109,108]],
    ['1.4401',240,510,30,[230,210,190,175,165,155,150,145,141,139,137]],
    ['1.4435',225,490,30,[217,200,180,165,153,145,139,135,130,128,127]],
    ['1.4550',240,510,30,[232,210,195,185,175,167,161,156,152,149,147]],
    ['1.4539',250,520,30,[244,235,220,205,190,175,165,155,145,140,135]]
  ]) add(grade,grade,'EN 10216-5:2004','Nahtloses Rohr, t ≤ 60 mm, +AT','austenitic',hot(k,values,50),rm,
    'QUELLE: EN 10216-5:2004, Tabelle 6 (Rp1,0, Rm, A quer), Tabelle 9 (Rp1,0, 50–550 °C, t ≤ 60 mm) ('+src.en5+'). Lösungsgeglüht; K = Rp1,0. Warmzugprüfung nach Option 9 vereinbaren.',A);
  add('1.4462','1.4462','EN 10216-5:2004','Nahtloses Rohr, t ≤ 30 mm, +AT','duplex',
    hot(450,[415,360,335,310,295],50),640,
    'QUELLE: EN 10216-5:2004, Tabelle 8 (Rp0,2, Rm, A quer), Tabelle 11 (Rp0,2, 50–250 °C, t ≤ 30 mm) ('+src.en5+'). Lösungsgeglüht; K = Rp0,2, nicht Rp1,0. Warmzugprüfung nach Option 9 vereinbaren.',22);

  // Geschweißte Rohre: eigenständig gegen Tabellen 6 und 8 geprüft.
  for(const [grade,k,values] of [
    ['1.4541',235,[222,208,196,186,177,167,161,156,152,149,147]],
    ['1.4571',245,[232,218,206,196,186,175,169,164,160,158,157]]
  ]) add(grade,grade,'EN 10217-7:2005','Geschweißtes Rohr, t ≤ 60 mm, +AT','austenitic',hot(k,values,50),500,
    'QUELLE: EN 10217-7:2005, Tabelle 6 (Rp1,0, Rm, A quer), Tabelle 8 (Rp1,0, 50–550 °C, t ≤ 60 mm) ('+src.w7+'). Lösungsgeglüht; K = Rp1,0. Warmzugprüfung nach Option 11 vereinbaren. Keine Übertragung der Warmwerte aus EN 10216-5.',30);
  AD.materials.push(...entries);
})(globalThis.AD);
