/* Werkstofftabellen: Temperaturen °C, Festigkeit und E-Modul N/mm².
 * K enthält Mindestwerte, KEINE bereits durch S geteilten Spannungen.
 * Tmax: obere K-Tabellentemperatur, keine Freigabe für Dauerbetrieb/Kriechen.
 * Emax: obere Temperatur der werkstoffspezifischen E-Tabelle, sonst null.
 * Fehlende Temperaturen werden nicht durch erfundene Stützstellen ergänzt.
 * Die Kennwertwahl nach AD 2000 B0 §6.1 verweist auf die Reihe W;
 * im Zeitstandsbereich ist zusätzlich B0 §5.2 / S6 anzuwenden.
 * Quellenstände: EN 10028-2:2003 und EN 10028-7:2007 (historische Ausgaben).
 */
(function(AD){
  'use strict';
  const en2 = '(Normtext, nicht verlinkt)';
  const en7 = '(Normtext, nicht verlinkt)';
  const b0 = '(Normtext, nicht verlinkt)';
  // AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1: Walz- und Schmiedestähle.
  const safety = ' S = 1,5: AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1 (' + b0 + ').';
  const creep = ' Tmax bezeichnet nur das Tabellenende; Zeitstandnachweis nach AD 2000 B0 §5.2 / S6 gegebenenfalls zusätzlich erforderlich.';

  // Lucefin P235GH, Tabelle „Proprietà fisiche secondo DIN SEW 310 (08/1992)“.
  // https://www.lucefin.com/wp-content/files_mf/p235gh.pdf
  // Gruppenreferenz beibehalten; nicht ungeprüft auf andere ferritische Sorten übertragen.
  AD.Eferritic = [[20,212000],[100,207000],[200,199000],[300,192000],[400,184000],[500,175000]];
  // voestalpine/Böhler 1.4301_05.20, S. 11, „Physikalische Eigenschaften“.
  // https://www.boehlerstahl.ch/app/uploads/sites/95/2020/05/1-4301_0520.pdf
  // Gruppenreferenz; werkstoffspezifische Zuordnung hier nur für 1.4301.
  AD.Eaustenitic = [[20,200000],[100,194000],[200,186000],[300,179000],[400,172000],[500,165000]];

  // Outokumpu Forta duplex datasheet, p.12, Tables 9 and 11.
  // 1.4462/1.4362/1.4501/1.4410: 200 GPa at 20 °C; Table 11 elevated
  // temperature typical values. GPa × 1000 = N/mm²; no extrapolation.
  // https://www.outokumpu.com/-/media/files/products/forta/outokumpu-forta-range-datasheet.pdf
  AD.Eduplex = [[20,200000],[100,194000],[200,186000],[300,180000]];
  AD.materials = [
    {
      id:'P235GH', thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:360, A:24, aliases:['1.0345','H I'], replaces:['H I'], name:'P235GH (1.0345)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +N', S:1.5, Tmax:400, Emax:500,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2 bei erhöhter Temperatur: Tabelle 4, t ≤ 16 mm ('+en2+'). E: Lucefin P235GH, Tabelle physikalische Eigenschaften nach SEW 310 (https://www.lucefin.com/wp-content/files_mf/p235gh.pdf).'+safety+creep,
      K:[[20,235],[50,227],[100,214],[150,198],[200,182],[250,167],[300,153],[350,142],[400,133]], E:AD.Eferritic
    },
    {
      id:'P265GH', thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:410, A:22, aliases:['1.0425','H II'], replaces:['H II'], name:'P265GH (1.0425)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +N', S:1.5, Tmax:400, Emax:null,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, t ≤ 16 mm ('+en2+'). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      // Tabelle 4: 205 MPa bei 200 °C; die Arvedi-Webtabelle enthält hier einen Druckfehler (105).
      K:[[20,265],[50,256],[100,241],[150,223],[200,205],[250,188],[300,173],[350,160],[400,150]]
    },
    {
      id:'P295GH', thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:460, A:21, aliases:['1.0481','17Mn4'], replaces:['17Mn4'], name:'P295GH (1.0481)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +N', S:1.5, Tmax:400, Emax:null,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, t ≤ 16 mm ('+en2+'). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,295],[50,285],[100,268],[150,249],[200,228],[250,209],[300,192],[350,178],[400,167]]
    },
    {
      id:'P355GH', thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:510, A:20, aliases:['1.0473','19Mn6'], replaces:['19Mn6'], name:'P355GH (1.0473)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +N', S:1.5, Tmax:400, Emax:null,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, t ≤ 16 mm ('+en2+'). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,355],[50,343],[100,323],[150,299],[200,275],[250,252],[300,232],[350,214],[400,202]]
    },
    {
      id:'16Mo3', hotThickness:{min:0,max:16,minInclusive:false,maxInclusive:false}, thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:440, A:22, aliases:['1.5415','15Mo3'], replaces:['15Mo3'], name:'16Mo3 (1.5415)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +N', S:1.5, Tmax:500, Emax:null,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, erste Dickenstufe bis 16 mm ('+en2+'). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,275],[50,273],[100,264],[150,250],[200,233],[250,213],[300,194],[350,175],[400,159],[450,147],[500,141]]
    },
    {
      id:'13CrMo4-5', hotThickness:{min:0,max:16,minInclusive:false,maxInclusive:false}, thickness:{min:0,max:16,minInclusive:false,maxInclusive:true}, family:'EN Blech', type:'ferritic', Rm:450, A:19, aliases:['1.7335','13CrMo44'], replaces:['13CrMo44'], name:'13CrMo4-5 (1.7335)', std:'EN 10028-2', product:'Blech ≤ 16 mm, +NT', S:1.5, Tmax:500, Emax:null,
      note:'ReH bei 20 °C: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, erste Dickenstufe bis 16 mm ('+en2+'). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,300],[50,294],[100,285],[150,269],[200,252],[250,234],[300,216],[350,200],[400,186],[450,175],[500,164]]
    },
    {
      id:'P355NL1', family:'EN Blech', type:'ferritic', Rm:490, A:22, aliases:['1.0566','TStE 355'], replaces:['TStE 355'], name:'P355NL1 (1.0566)', std:'EN 10028-3', product:'Blech 5 … 16 mm, +N', S:1.5, Tmax:20, Emax:null,
      note:'ReH bei 20 °C: ArcelorMittal Grobblechkatalog H62, Tabelle P355NL1 / mechanische Eigenschaften, 5–16 mm (https://industry.arcelormittal.com/catalogue/H62/EN). Nur Raumtemperatur: erhöhte Rp0,2-Werte gelten nach EN 10028-3:2003 §8.4.2 für NL1 nur bei gesonderter Bestellvereinbarung ((Normtext, nicht verlinkt)). Kein werkstoffspezifischer E-Modul hinterlegt.'+safety,
      K:[[20,355]]
    },
    {
      id:'1.4301', family:'EN Blech', type:'austenitic', Rm:520, A:45, aliases:['1.4301','X5CrNi189'], replaces:['X5CrNi189'], name:'1.4301 (X5CrNi18-10)', std:'EN 10028-7', product:'Warmgewalztes Blech ≤ 75 mm, +AT', S:1.5, Tmax:550, Emax:500,
      note:'Rp1,0: EN 10028-7:2007, Tabelle 9, Erzeugnisform P (20 °C), Tabelle 13 (50–550 °C), lösungsgeglüht ('+en7+'). AD B0 §6.1 in Verbindung mit W2: für Austenite K = Rp1,0. E: voestalpine/Böhler 1.4301_05.20, S. 11, physikalische Eigenschaften (https://www.boehlerstahl.ch/app/uploads/sites/95/2020/05/1-4301_0520.pdf).'+safety+creep,
      K:[[20,250],[50,228],[100,191],[150,172],[200,157],[250,145],[300,135],[350,129],[400,125],[450,122],[500,120],[550,120]], E:AD.Eaustenitic
    },
    {
      id:'1.4404', family:'EN Blech', type:'austenitic', Rm:520, A:45, aliases:['1.4404','X2CrNiMo17132'], replaces:['X2CrNiMo17132'], name:'1.4404 (X2CrNiMo17-12-2)', std:'EN 10028-7', product:'Warmgewalztes Blech ≤ 75 mm, +AT', S:1.5, Tmax:550, Emax:null,
      note:'Rp1,0: EN 10028-7:2007, Tabelle 9, Erzeugnisform P (20 °C), Tabelle 13 (50–550 °C), lösungsgeglüht ('+en7+'). AD B0 §6.1 in Verbindung mit W2: für Austenite K = Rp1,0. Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,260],[50,237],[100,199],[150,181],[200,167],[250,157],[300,145],[350,139],[400,135],[450,130],[500,128],[550,127]]
    },
    {
      id:'1.4541', family:'EN Blech', type:'austenitic', Rm:500, A:40, aliases:['1.4541','X6CrNiTi1810'], replaces:['X6CrNiTi1810'], name:'1.4541 (X6CrNiTi18-10)', std:'EN 10028-7', product:'Warmgewalztes Blech ≤ 75 mm, +AT', S:1.5, Tmax:550, Emax:null,
      note:'Rp1,0: EN 10028-7:2007, Tabelle 9, Erzeugnisform P (20 °C), Tabelle 13 (50–550 °C), lösungsgeglüht ('+en7+'). AD B0 §6.1 in Verbindung mit W2: für Austenite K = Rp1,0. Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,240],[50,228],[100,208],[150,196],[200,186],[250,177],[300,167],[350,161],[400,156],[450,152],[500,149],[550,147]]
    },
    {
      id:'1.4571', family:'EN Blech', type:'austenitic', Rm:520, A:40, aliases:['1.4571','X6CrNiMoTi17122'], replaces:['X6CrNiMoTi17122'], name:'1.4571 (X6CrNiMoTi17-12-2)', std:'EN 10028-7', product:'Warmgewalztes Blech ≤ 75 mm, +AT', S:1.5, Tmax:550, Emax:null,
      note:'Rp1,0: EN 10028-7:2007, Tabelle 9, Erzeugnisform P (20 °C), Tabelle 13 (50–550 °C), lösungsgeglüht ('+en7+'). AD B0 §6.1 in Verbindung mit W2: für Austenite K = Rp1,0. Kein werkstoffspezifischer E-Modul hinterlegt.'+safety+creep,
      K:[[20,260],[50,244],[100,218],[150,206],[200,196],[250,186],[300,175],[350,169],[400,164],[450,160],[500,158],[550,157]]
    }
  ];

  // Ergänzungen: ursprüngliche IDs und sämtliche vorhandenen Werte bleiben erhalten.
  const en3 = '(Normtext, nicht verlinkt)';
  const en7extract = '(Normtext, nicht verlinkt)';
  const salzgitter = 'https://www.salzgitter-flachstahl.de/en/products/hot-rolled-products/steel-grades/weldable-fine-grain-structural-steels-for-pressure-vessels.html';
  const dinCompare = 'https://www.norskstaal.no/Files/Files/Norsk-Stal-Tekniske-Tabeller.pdf';
  const stainlessNames = 'https://ucpcdn.thyssenkrupp.com/_binary/UCPtkBAMXCochius/de/produkte/edelstahl/link-Lieferprogramm-Edelstahl-Rohre-geschweisst-11.pdf';
  for (const m of AD.materials) {
    m.note += m.std === 'EN 10028-2'
      ? ' Rm (Untergrenze), A (quer), Werkstoffnummer: EN 10028-2:2003, Tabellen 1/3 ('+en2+'). Alt-DIN-Zuordnung: Tabelle Comparison Table Boiler Steels ('+dinCompare+'); Suchbezeichnung, keine automatische Austauschfreigabe.'
      : m.std === 'EN 10028-3'
        ? ' Rm (Untergrenze), A (quer), Werkstoffnummer: EN 10028-3:2003, Tabelle 4 ('+en3+'). Alt-DIN: Salzgitter, Tabelle Standards ('+salzgitter+').'
        : ' Rm (Untergrenze), A (quer, proportionale Probe ab 3 mm), Werkstoffnummer: EN 10028-7:2007, Tabelle 9, Form P ('+en7extract+'). Alt-DIN: thyssenkrupp, Tabelle Gegenüberstellung von Werkstoffen und ausländischen Bezeichnungen ('+stainlessNames+'); Suchbezeichnungen, keine automatische Austauschfreigabe.';
  }

  // Nur explizit belegte Stützstellen; keine rechnerisch erzeugten Festigkeitswerte.
  const temperatures = [20,50,100,150,200,250,300,350,400,450,500,550];
  function plate(grade, number, std, product, type, Rm, A, values, note, replaces=[]) {
    const K = values.map((value,i) => [temperatures[i],value]);
    return {id:grade+' | '+std+' | '+product, name:grade+' ('+number+') '+product,
      family:'EN Blech', std, product, type, Rm, A, aliases:[number], replaces,
      S:1.5, Tmax:K[K.length-1][0], Emax:null, K,
      note:note+safety+creep};
  }
  const bands = [
    ["P235GH", "16 < t ≤ 40 mm", [225, 218, 205, 190, 174, 160, 147, 136, 128]],
    ["P235GH", "40 < t ≤ 60 mm", [215, 208, 196, 181, 167, 153, 140, 130, 122]],
    ["P265GH", "16 < t ≤ 40 mm", [255, 247, 232, 215, 197, 181, 166, 154, 145]],
    ["P265GH", "40 < t ≤ 60 mm", [245, 237, 223, 206, 190, 174, 160, 148, 139]],
    ["P295GH", "16 < t ≤ 40 mm", [290, 280, 264, 244, 225, 206, 189, 175, 165]],
    ["P295GH", "40 < t ≤ 60 mm", [285, 276, 259, 240, 221, 202, 186, 172, 162]],
    ["P355GH", "16 < t ≤ 40 mm", [345, 334, 314, 291, 267, 245, 225, 208, 196]],
    ["P355GH", "40 < t ≤ 60 mm", [335, 324, 305, 282, 259, 238, 219, 202, 190]],
    ["16Mo3", "16 < t ≤ 40 mm", [270, 268, 259, 245, 228, 209, 190, 172, 156, 145, 139]],
    ["16Mo3", "40 < t ≤ 60 mm", [260, 258, 250, 236, 220, 202, 183, 165, 150, 139, 134]],
    ["13CrMo4-5", "16 < t ≤ 40 mm", [290, 285, 275, 260, 243, 226, 209, 194, 180, 169, 159]],
    ["13CrMo4-5", "40 < t ≤ 60 mm", [290, 285, 275, 260, 243, 226, 209, 194, 180, 169, 159]],
  ];
  for (const [grade,band,values] of bands) {
    const base = AD.materials.find(m => m.id === grade);
    const m = plate(grade,base.aliases[0],'EN 10028-2:2003','Blech '+band+(grade==='13CrMo4-5'?', +NT':', +N'),
      'ferritic',base.Rm,base.A,values,
      'ReH, Rm, A: EN 10028-2:2003, Tabelle 3; Rp0,2: Tabelle 4, genau die angegebene Dickenstufe ('+en2+').'+
      (grade==='13CrMo4-5'?' Tabelle 4 fasst 16 < t ≤ 60 mm ausdrücklich zusammen.':''),base.replaces);
    const [,lo,hi]=band.match(/(\d+) < t ≤ (\d+)/);
    m.thickness={min:+lo,max:+hi,minInclusive:false,maxInclusive:true};
    m.aliases = base.aliases.slice();
    m.note += ' Alt-DIN-Zuordnung: Tabelle Comparison Table Boiler Steels ('+dinCompare+').';
    AD.materials.push(m);
  }
  AD.materials.push(
    plate('10CrMo9-10','1.7380','EN 10028-2:2003','Blech t ≤ 16 mm, +NT','ferritic',480,18,
      [310,288,266,254,248,243,236,225,212,197,185],
      'ReH, Rm, A: Tabelle 3; Rp0,2: Tabelle 4, erste Dickenstufe, EN 10028-2:2003 ('+en2+').'),
    plate('13CrMoSi5-5+QT','1.7336','EN 10028-2:2003','Blech 60 < t ≤ 100 mm, +QT','ferritic',500,20,
      [390,384,364,352,344,339,335,330,322,309],
      'ReH, Rm, A: Tabelle 3; Rp0,2: Tabelle 4, EN 10028-2:2003, 60 < t ≤ 100 mm ('+en2+'). Für t ≤ 60 mm enthält Tabelle 4 keine eigene +QT-Zeile: UNVERIFIED Warmwerte dieser dünneren Dickenstufe, nicht hinterlegt.'),
    plate('X10CrMoVNb9-1','1.4903','EN 10028-2:2003','Blech t ≤ 60 mm, +NT','ferritic',580,18,
      [445,432,415,401,392,385,379,373,364,349,324],
      'ReH, Rm, A: Tabelle 3; Rp0,2: Tabelle 4, EN 10028-2:2003, t ≤ 60 mm ('+en2+').'),
    plate('P275NH','1.0487','EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',390,24,
      [275,266,250,232,213,195,179,166,156],
      'ReH, Rm, A: Tabelle 4; Rp0,2: Tabelle 5, EN 10028-3:2003 ('+en3+'). Alt-DIN WStE 285: Tabelle Standards ('+salzgitter+').',['WStE 285']),
    plate('P355N','1.0562','EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',490,22,[355],
      'ReH, Rm, A: EN 10028-3:2003, Tabelle 4 ('+en3+'). Tabelle 5 enthält keine Warmwerte für N: UNVERIFIED, nicht hinterlegt. Alt-DIN StE 355: Tabelle Standards ('+salzgitter+').',['StE 355']),
    plate('P355NH','1.0565','EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',490,22,
      [355,343,323,299,275,252,232,214,202],
      'ReH, Rm, A: Tabelle 4; Rp0,2: Tabelle 5, EN 10028-3:2003 ('+en3+'). Alt-DIN WStE 355: Tabelle Standards ('+salzgitter+').',['WStE 355']),
    plate('P355NL2','1.1106','EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',490,22,[355],
      'ReH, Rm, A: EN 10028-3:2003, Tabelle 4 ('+en3+'). Warmwerte nach §8.4.2 nur bei gesonderter Bestellvereinbarung: UNVERIFIED ohne Vereinbarung, nicht hinterlegt. Alt-DIN EStE 355: Tabelle Standards ('+salzgitter+').',['EStE 355']),
    plate('P460NH','1.8935','EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',570,17,
      [460,445,419,388,356,326,300,278,261],
      'ReH, Rm, A: Tabelle 4 (Ausgabe 2003, keine Übernahme neuerer Rm-Werte); Rp0,2: Tabelle 5, EN 10028-3:2003 ('+en3+').'),
    plate('P355ML1','1.8832','EN 10028-5','Blech 3 ≤ t ≤ 16 mm, +M','ferritic',450,22,[355],
      'ReH, Rm, A: Salzgitter Flachstahl, Tabelle Mechanical properties, Nenndicke ≤ 16 mm ('+salzgitter+'). Warmwerte UNVERIFIED, nicht hinterlegt.'),
    plate('1.4307','1.4307','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT','austenitic',500,45,
      [240,218,181,162,147,137,127,121,116,112,109,108],
      'X2CrNi18-9: Rp1,0, Rm, A: Tabelle 9, Form P; Warmwerte Rp1,0: Tabelle 13, EN 10028-7:2007 ('+en7extract+'). K = Rp1,0.'),
    plate('1.4306','1.4306','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT','austenitic',500,45,
      [240,218,181,162,147,137,127,121,116,112,109,108],
      'X2CrNi19-11: Rp1,0, Rm, A: Tabelle 9, Form P; Warmwerte Rp1,0: Tabelle 13, EN 10028-7:2007 ('+en7extract+'). K = Rp1,0.'),
    plate('1.4435','1.4435','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT','austenitic',520,45,
      [260,237,200,180,165,153,145,139,135,130,128,127],
      'X2CrNiMo18-14-3: Rp1,0, Rm, A: Tabelle 9, Form P; Warmwerte Rp1,0: Tabelle 13, EN 10028-7:2007 ('+en7extract+'). K = Rp1,0.'),
    plate('1.4539','1.4539','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT','austenitic',520,35,
      [260,251,235,220,205,190,175,165,155,145,140,135],
      'X1NiCrMoCu25-20-5: Rp1,0, Rm, A: Tabelle 9, Form P; Warmwerte Rp1,0: Tabelle 13, EN 10028-7:2007 ('+en7extract+'). K = Rp1,0.'),
    plate('1.4462','1.4462','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT, quer','duplex',640,25,
      [460,422,360,335,315,300],
      'X2CrNiMoN22-5-3: Rp0,2 quer (Breite ≥ 300 mm), Rm, A: Tabelle 10, Form P; Warmwerte Rp0,2: Tabelle 14, EN 10028-7:2007 ('+en7extract+'). K = Rp0,2, nicht Rp1,0.'),
    plate('1.4362','1.4362','EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 50 mm, +AT, quer','duplex',630,25,
      [400,374,330,300,280,265],
      'X2CrNiN23-4: Rp0,2 quer (Breite ≥ 300 mm), Rm, A: Tabelle 10, Form P; Warmwerte Rp0,2: Tabelle 14, EN 10028-7:2007 ('+en7extract+'). K = Rp0,2, nicht Rp1,0.')
  );
  // Table 4 prints '< 16' for these hot rows (Table 3 room minima use ≤16).
  AD.materials.find(m=>m.id.startsWith('10CrMo9-10 |')).hotThickness={min:0,max:16,minInclusive:false,maxInclusive:false};
  // Historische Sorte 11CrMo9-10 (1.7383), EN 10028-2:1992:
  // UNVERIFIED Blech-Festigkeitswerte der historischen Tabellen; NICHT aus EN 10216-2 übertragen.
  // Daher kein berechenbarer Eintrag. Nachfolger 12CrMo9-10 seit 2003, siehe
  // DIN EN 10028-2:2003, Nationales Vorwort, Änderung a:
  // (Normtext, nicht verlinkt)
  // https://www.appluslaboratories.com/materials-portal/datasheet/11crmo9-10-1-7383/-1631465235
  const stainlessAliases = {'1.4307':'X2CrNi18-9','1.4306':'X2CrNi19-11','1.4435':'X2CrNiMo18-14-3','1.4539':'X1NiCrMoCu25-20-5','1.4462':'X2CrNiMoN22-5-3','1.4362':'X2CrNiN23-4'};
  for (const m of AD.materials) {
    const grade = m.id.split(' | ')[0];
    if (stainlessAliases[grade]) m.aliases.push(stainlessAliases[grade]);
    for (const old of m.replaces) if (!m.aliases.includes(old)) m.aliases.push(old);
  }
})(globalThis.AD);
