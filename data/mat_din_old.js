/* Zurückgezogene DIN-Werkstoffe. Einheiten: °C, N/mm², mm.
 * Nur die unten belegten Erzeugnisse/Dickenbereiche sind auswählbar.
 * UNVERIFIED / noch nicht aufgenommen: DIN 17155 (alle sieben angefragten
 * Blechsorten; historische Warmstreckgrenzen nicht sicher belegt), DIN 17440/
 * 17441 (alle sechs angefragten Austenite; vollständige Zuordnung von Rp1,0,
 * Rm, Lieferzustand und Erzeugnisdicke fehlt), DIN 17245 (drei Gussorten),
 * DIN 17243 (C 22.8 und 15 Mo 3). Keine EN-Kennwerte als DIN-Werte übernommen.
 * replacedBy ist eine Umschlüsselungshilfe, keine Gleichwertigkeitsfreigabe.
 */
(function(AD){
  'use strict';
  const tube = '(Normtext, nicht verlinkt)';
  const scan = '(Normtext, nicht verlinkt)';
  const fine = '(Normtext, nicht verlinkt)';
  const structural = '(Normtext, nicht verlinkt)';
  const map = 'https://www.stock-rohre.de/fileadmin/user_upload/pdf/Normen-DIN-EN.pdf';
  const plateMap = 'https://www.rff.de/_uploads/files/produkte/kataloge/rff_Basics-2019_E.pdf';
  const safety = ' S = 1,5: AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1 ((Normtext, nicht verlinkt)).';
  const creep = ' Tmax ist das Ende der K-Tabelle, keine Dauerbetriebsfreigabe; Zeitstandnachweis gegebenenfalls gesondert.';
  const entries = [];
  function add(grade, std, product, number, replacedBy, Rm, K, note){
    entries.push({id:grade+' | '+std+' | '+product, name:grade+' ('+number+')',
      family:'DIN (alt)', std, product, type:'ferritic', aliases:[number], replacedBy,
      Rm, K, S:1.5, Tmax:K[K.length-1][0], note:note+safety+creep});
  }
  // DIN 17175:1979, Originaltafeln 5/6, nicht die widersprüchliche Kurztafel
  // auf Seite 1 des TubeSolution-Abdrucks. Originalscan S. 12/13 gegengeprüft.
  const tubeNote = 'SOURCE: DIN 17175:1979, Tabelle 5 (ReH/Rm bei 20 °C), Tabelle 6 (Rp0,2 bei 200–550 °C), einschließlich Fußnoten ('+tube+'); Originalscan S. 12–13 ('+scan+'). Außendurchmesser > 30 mm; keine Absenkung für Kleinrohre. ';
  add('St 35.8','DIN 17175:1979','Nahtloses Rohr, t ≤ 16 mm, D > 30 mm','1.0305','P235GH',360,
    [[20,235],[200,185],[250,165],[300,140],[350,120],[400,110],[450,105]],
    tubeNote+'Umschlüsselung: Tabelle DIN 17175 / EN 10216-2 ('+map+').');
  add('St 45.8','DIN 17175:1979','Nahtloses Rohr, t ≤ 16 mm, D > 30 mm','1.0405','P265GH',410,
    [[20,255],[200,205],[250,185],[300,160],[350,140],[400,130],[450,125]],
    tubeNote+'UNVERIFIED: Zuordnung P265GH als EN-Vergleichssorte; kein belegter identischer Ersatz.');
  add('17Mn4','DIN 17175:1979','Sammlerrohr, t ≤ 16 mm, D > 30 mm','1.0481','P295GH',460,
    [[20,270],[200,235],[250,215],[300,175],[350,155],[400,145],[450,135]],
    tubeNote+'Nur Sammler nach Tabelle 1 Fußnote 3. P295GH: Werkstoffnummer-Zuordnung in rff Vergleichstabelle Flacherzeugnisse ('+plateMap+'); UNVERIFIED als direkter Rohrersatz.');
  add('19Mn5','DIN 17175:1979','Sammlerrohr, t ≤ 16 mm, D > 30 mm','1.0482','P355N',510,
    [[20,310],[200,255],[250,235],[300,205],[350,180],[400,160],[450,150]],
    tubeNote+'Nur Sammler nach Tabelle 1 Fußnote 3. UNVERIFIED: P355N ist lediglich eine EN-Vergleichssorte, kein belegter direkter Nachfolger.');
  add('15Mo3','DIN 17175:1979','Nahtloses Rohr, 10 < t ≤ 16 mm, D > 30 mm','1.5415','16Mo3',450,
    [[20,270],[200,225],[250,205],[300,180],[350,170],[400,160],[450,155],[500,150]],
    tubeNote+'t > 10 mm: Zuschlag aus Tabelle 5 Fußnote 4 / Tabelle 6 Fußnote 2 nicht angesetzt. Umschlüsselung Tabelle DIN 17175 / EN 10216-2 ('+map+').');
  add('13CrMo44','DIN 17175:1979','Nahtloses Rohr, 10 < t ≤ 16 mm, D > 30 mm','1.7335','13CrMo4-5',440,
    [[20,290],[200,240],[250,230],[300,215],[350,200],[400,190],[450,180],[500,175]],
    tubeNote+'t > 10 mm: kein Zuschlag für Dünnwandrohre. Umschlüsselung der Werkstoffnummer: rff Vergleichstabelle ('+plateMap+'); UNVERIFIED als direkter Rohrersatz.');
  add('10CrMo910','DIN 17175:1979','Nahtloses Rohr, t ≤ 16 mm, D > 30 mm','1.7380','10CrMo9-10',450,
    [[20,280],[200,245],[250,240],[300,230],[350,215],[400,205],[450,195],[500,185]],
    tubeNote+'Umschlüsselung der Werkstoffnummer: rff Vergleichstabelle ('+plateMap+'); UNVERIFIED als direkter Rohrersatz.');
  add('X20CrMoV121','DIN 17175:1979','Nahtloses Rohr, t ≤ 16 mm, D > 30 mm','1.4922','X20CrMoV11-1',690,
    [[20,490],[200,430],[250,415],[300,390],[350,380],[400,360],[450,330],[500,290],[550,250]],
    tubeNote+'UNVERIFIED: EN-Nachfolger X20CrMoV11-1; Umschlüsselung im vorliegenden DIN-Auszug nicht belegt.');

  // Warmgefertigt: NBK-Abminderungen für kaltgefertigte Rohre nicht anwendbar.
  for (const [std,table,rows] of [
    ['DIN 1629:1984','4',[
      ['St 37.0','1.0254','P235TR1',235,350],
      ['St 44.0','1.0256','P265TR1',275,420],
      ['St 52.0','1.0421','P355N',355,500]]],
    ['DIN 1630:1984','3',[
      ['St 37.4','1.0255','P235TR2',235,350],
      ['St 44.4','1.0257','P265TR2',275,420],
      ['St 52.4','1.0581','P355N',355,500]]]
  ]) {
    const url='(Normtext, nicht verlinkt)'+std.slice(4,8)+'.pdf';
    for(const [grade,number,en,k,rm] of rows) add(grade,std,
      'Nahtloses warmgefertigtes Rohr, t ≤ 16 mm',number,en,rm,[[20,k]],
      'SOURCE: '+std+', Tabelle '+table+', mechanische Eigenschaften im Lieferzustand bei Raumtemperatur ('+url+'). Kein kaltgefertigtes NBK-Rohr. Umschlüsselung: Tabelle DIN 1629/1630 / EN 10216-1 ('+map+'). '+
      (grade.includes('52')?'P355N nach EN 10216-3 ist ein Vergleich für die entfallene Sorte, kein identischer EN-10216-1-Ersatz. ':'')+
      'Erhöhte Temperaturwerte UNVERIFIED und nicht in K enthalten.');
  }
  for(const [grade,number,en,k,rm] of [
    ['StE 355','1.0562','P355N',355,490],
    ['WStE 355','1.0565','P355NH',355,490],
    ['TStE 355','1.0566','P355NL1',355,490],
    ['StE 460','1.8905','P460N',460,560]
  ]) add(grade,'DIN 17102','Blech, t ≤ 16 mm, normalgeglüht',number,en,rm,
    grade==='WStE 355'?[[20,k],[100,304],[150,284],[200,255],[250,235],[300,216],[350,196],[400,167]]:[[20,k]],
    'SOURCE: DIN 17102, Tabelle 3 (ReH/Rm), '+(grade==='WStE 355'?'Tabelle 4 (Rp0,2, jeweils kleinste Dickenstufe)':'keine Warmwerte für diese Reihe übernommen')+' ('+fine+'). '+
    'Umschlüsselung für Druckzwecke: rff Vergleichstabelle ('+plateMap+'). '+
    (grade==='StE 460'?'P460N: AD 2000 HP0, Werkstoffgruppenliste ((Normtext, nicht verlinkt)). ':'')+
    (grade==='WStE 355'?'':'Erhöhte Temperaturwerte UNVERIFIED und nicht in K enthalten.'));
  for(const [grade,number,en,k,rm] of [
    ['St 37-2','1.0037','S235JR',235,340],
    ['St 37-3','1.0116','S235J2',235,340],
    ['St 52-3','1.0570','S355J2',355,490]
  ]) add(grade,'DIN 17100','Blech, 3 ≤ t ≤ 16 mm, normalgeglüht',number,en,rm,[[20,k]],
    'SOURCE: DIN 17100, Tabelle 2 (ReH und untere Rm-Grenze für t ≥ 3 mm) ('+structural+'). '+
    'Umschlüsselung für St 37-3 und St 52-3 gilt für Lieferzustand N: HSM, Normung der Stahlwerkstoffe, Tabelle 2, S. 44 (https://www.hsm-stahl.de/wp-content/uploads/2025/04/TD0080-Normung-der-Stahlwerkstoffe-2021.pdf). '+
    'Nur Raumtemperatur; keine generelle Eignungsfreigabe als Druckbehälterwerkstoff.');
  AD.materials.push(...entries);
})(globalThis.AD);
