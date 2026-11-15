/* Leitungsrohre: ausschließlich belegte Raumtemperatur-Mindestwerte in N/mm².
 * PSL und Lieferzustand sind keine pauschale AD-2000-Werkstoffzulassung.
 * Historische Vergleichssorten sind keine austauschbaren Spezifikationen.
 */
(function(AD){
  'use strict';
  const api = '(Normtext, nicht verlinkt)';
  const iso = 'https://cdn.standards.iteh.ai/samples/68051/12f51b0aef19496f8400eb07e8c0e49a/SIST-EN-ISO-3183-2020.pdf';
  const en1 = '(Normtext, nicht verlinkt)';
  const en2 = '(Normtext, nicht verlinkt)';
  const boehler = 'https://wilhelm-group.com/downloads/docs/Brochure%20Pipeline%20english%20-%20Edition%202005.pdf';
  const am = 'https://constructalia.arcelormittal.com/files/AMTP%20-%20Seamless%20Structural--e3f0a1335b0a9f403e59a2eead788c45.pdf';
  const welded = '(Normtext, nicht verlinkt)';
  const tata = 'https://products.tatasteelnederland.com/products/tubes/structural-tubes/forcon';
  const room = ' Nur Raumtemperatur belegt; K = Mindeststreckgrenze, nicht zulässige Spannung. Für Verwendung über 50 °C sind Abminderungsdaten erforderlich; UNVERIFIED: Warmfestigkeit, daher keine erhöhten K-Stützstellen. Tmax = 20 °C.';
  const safety = ' S = 1,5 für Walzstahl: AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1 ((Normtext, nicht verlinkt)). Eignung nach AD-W-Reihe und Schweißnahtfaktor gesondert prüfen.';
  const entries = [];
  function add(grade, std, product, K20, Rm, aliases, source, extra){
    entries.push(Object.assign({
      id:grade+' | '+std+' | '+product, name:grade, family:'Leitungsrohr',
      std, product, type:'ferritic', K:[[20,K20]], Rm, S:1.5,
      Tmax:20, aliases:aliases || [], note:source+room+safety
    }, extra || {}));
  }

  // API 5L, 45. Ausgabe 2012, Tabellen 6/7 (Rohrkörper) und 1 (Suffixe).
  // ISO 3183:2019 Einleitung bestätigt die technischen Gemeinsamkeiten der Ausgaben 2012.
  const grades = [
    ['L245','B',245,415], ['L290','X42',290,415], ['L320','X46',320,435],
    ['L360','X52',360,460], ['L390','X56',390,490], ['L415','X60',415,520],
    ['L450','X65',450,535], ['L485','X70',485,570], ['L555','X80',555,625]
  ];
  for (const [grade, us, yieldMin, tensileMin] of grades){
    const std = 'EN ISO 3183:2012 / API 5L:2012';
    if (yieldMin <= 485) add(grade+' ('+us+') PSL1',std,
      'Nahtloses/geschweißtes Leitungsrohr, PSL1',yieldMin,tensileMin,[grade,us,'API 5L '+us],
      'QUELLE: API 5L:2012, Tabelle 6, Rt0,5 min. und Rm min. ('+api+'). ISO-Bezug: Einleitung ISO 3183:2019 ('+iso+').');
    const suffixes = yieldMin <= 415 ? ['N','Q','M'] : ['Q','M'];
    if (yieldMin <= 290) suffixes.push('R');
    const aliases = [grade,us,'API 5L '+us];
    for (const suffix of suffixes) aliases.push(grade+suffix,us+suffix);
    add(grade+' ('+us+') PSL2',std,'Nahtloses/geschweißtes Leitungsrohr, PSL2',yieldMin,tensileMin,aliases,
      'QUELLE: API 5L:2012, Tabelle 7, Rt0,5 min. und Rm min.; Tabelle 1: zulässige Lieferzustände '+suffixes.join('/')+' ('+api+'). ISO-Bezug: Einleitung ISO 3183:2019 ('+iso+'). Keine Aliasfreigabe für nicht aufgeführte Lieferzustände.');
  }

  for (const [grade, number, y, rm] of [
    ['L210GA','1.0319',210,335], ['L235GA','1.0458',235,370],
    ['L245GA','1.0459',245,415], ['L290GA','1.0483',290,415], ['L360GA','1.0499',360,460]
  ]) add(grade,'EN 10208-1:1997','Nahtloses/geschweißtes Leitungsrohr, Klasse A',y,rm,[number],
    'QUELLE: EN 10208-1:1997, Tabelle 4, Rohrkörper, Rt0,5 min. und untere Grenze Rm ('+en1+').');

  // Separate entries preserve N/Q/M product conditions and material numbers.
  for (const [grade, number, y, rm] of [
    ['L245NB','1.0457',245,415], ['L245MB','1.0418',245,415],
    ['L290NB','1.0484',290,415], ['L290MB','1.0429',290,415],
    ['L360NB','1.0582',360,460], ['L360QB','1.8948',360,460], ['L360MB','1.0578',360,460],
    ['L415NB','1.8972',415,520], ['L415QB','1.8947',415,520], ['L415MB','1.8973',415,520],
    ['L450QB','1.8952',450,535], ['L450MB','1.8975',450,535],
    ['L485QB','1.8955',485,570], ['L485MB','1.8977',485,570]
  ]) add(grade,'EN 10208-2:2009','Leitungsrohr, Klasse B, t ≤ 25 mm, +'+grade.slice(-2,-1),y,rm,[number],
    'QUELLE: EN 10208-2:2009, Tabelle 5, Rohrkörper für T ≤ 25 mm, Rt0,5 min. und Rm min. ('+en2+'). Größere Wanddicken nur nach Vereinbarung; M für geschweißte Rohre.');

  // Historical minimum values as printed in Böhler's comparison table, not API values.
  for (const [grade,y,rm,target,tm] of [
    ['StE 210.7',210,320,'L210GA',false], ['StE 240.7',240,370,'L245MB',false],
    ['StE 290.7',290,420,'L290MB',true], ['StE 320.7',320,460,'L320',true],
    ['StE 360.7',360,510,'L360MB',true], ['StE 385.7',385,530,'L390',true],
    ['StE 415.7',415,550,'L415MB',true], ['StE 445.7',445,560,'L450MB',true],
    ['StE 480.7',480,600,'L485MB',true]
  ]) add(grade,'DIN 17172 (alt)',
    'Leitungsrohr, '+(y>=445?'TM; ':'')+'historische Vergleichstabelle',y,rm,
    tm ? [grade+' TM'] : [],
    'QUELLE: Böhler Welding, Consumables for pipeline construction, Ausgabe 2005, S. 5, Tabelle „Comparison table for pipe steels“, DIN-17172-Zeile ('+boehler+'). Die Tabelle nennt keinen Dickenbereich; Anwendung am Zeugnis prüfen. '+
    'UNVERIFIED: replacedBy ist eine Such-/Nachfolgerzuordnung, keine bestätigte normative Gleichwertigkeit. Alte Mindestwerte bleiben unverändert; bei '+grade+' nicht durch Kennwerte von '+target+' ersetzen.',
    {replacedBy:target});

  for (const [base,y,rm] of [['P195',195,320],['P235',235,360],['P265',265,410]]){
    for (const quality of ['TR1','TR2']){
      const grade = base+quality;
      for (const [std,product,source] of [
        ['EN 10216-1','Nahtloses Rohr, t ≤ 16 mm',
          'ArcelorMittal Seamless Structural Mechanical Pipe Brochure, S. 5, Tabelle „Mechanical Properties“, EN 10216-1 ('+am+')'],
        ['EN 10217-1:2002+A1:2005','Geschweißtes Rohr, t ≤ 16 mm',
          'EN 10217-1:2002+A1:2005, Tabelle 4, mechanische Eigenschaften ('+welded+')']
      ]) add(grade,std,product,y,rm,[],
        'QUELLE: '+source+'. ReH min., untere Grenze Rm. '+
        (quality==='TR1'?'TR1 ohne garantierte Kerbschlagarbeit; keine automatische Druckgeräte-Eignung (EN 10217-1, Tabelle 4, Fußnote e). ':''));
    }
  }
  add('S195T','EN 10255:2004+A1:2007','Nahtloses/geschweißtes Gewinderohr, t ≤ 5,4 mm',195,320,['1.0026'],
    'QUELLE: Tomrods, Declaration of Performance Gas & Water Tube S195T, 04.05.2014, Tabelle „Performance characteristics“, ReH min. / Rm min. bis 5,4 mm (https://www.tomrods.co.uk/docs/gaswater/S195T.pdf).');

  for (const [std,product,source] of [
    ['EN 10210-1','Warmgefertigtes nahtloses Hohlprofil',
      'ArcelorMittal Seamless Structural Mechanical Pipe Brochure, S. 3, Tabelle „Mechanical Properties“, EN 10210-1 ('+am+')'],
    ['EN 10219-1','Kaltgefertigtes geschweißtes Hohlprofil',
      'Tata Steel Forcon, Tabellen „Properties / Mechanical Properties“ S235JRH und S355J2H ('+tata+')']
  ]){
    add('S235JRH',std,product+', t ≤ 16 mm',235,360,[],
      'QUELLE: '+source+'. ReH min., untere Grenze Rm. Konstruktionshohlprofil; keine automatische Druckrohr-Zulassung.');
    // S355 tensile minima change at 3 mm; do not merge the thickness bands.
    const e10210=std.startsWith('EN 10210'); // EN 10210: 510 bis t ≤ 3 mm; EN 10219: 470 ab t ≥ 3 mm
    add('S355J2H',std,product+(e10210?', t ≤ 3 mm':', t < 3 mm'),355,510,[],
      'QUELLE: '+source+'. ReH min. bis 16 mm, untere Grenze Rm für t < 3 mm. Konstruktionshohlprofil; keine automatische Druckrohr-Zulassung.');
    add('S355J2H',std,product+(e10210?', 3 < t ≤ 16 mm':', 3 ≤ t ≤ 16 mm'),355,470,[], /* Review-Fix: Grenze 3 mm je Norm */
      'QUELLE: '+source+'. ReH min. bis 16 mm, untere Grenze Rm für 3 < t ≤ 50 mm (ArcelorMittal) bzw. 3 ≤ t ≤ 40 mm (Tata); hier konservativ nur 3 < t ≤ 16 mm. Konstruktionshohlprofil; keine automatische Druckrohr-Zulassung.');
  }
  AD.materials.push(...entries);
})(globalThis.AD);
