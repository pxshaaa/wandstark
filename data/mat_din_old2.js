/* Historische DIN-Ergänzungen. °C, N/mm², mm. Keine EN-Warmwerte als DIN-Werte.
 * replacedBy dient nur der Umschlüsselung, nicht als Gleichwertigkeitsfreigabe.
 * UNVERIFIED / nicht aufgenommen: DIN 17155 17Mn4, 19Mn6, 15Mo3,
 * 13CrMo44, 10CrMo910 (historische Tabellen mit eindeutiger Dickenbindung fehlen);
 * DIN 17245 alle vier angefragten Gussorten (vollständige Rm/K/Dicken-Zuordnung fehlt).
 * Dünne Austenit-Bänder nach DIN 17441 nicht aus Blechwerten abgeleitet.
 */
(function(AD){
  'use strict';
  const stainless='https://www.neumira-engineering.com/catalogues/DIN-FLANSCHEN.pdf';
  const forging='(Normtext, nicht verlinkt)';
  const forgingScan='(Normtext, nicht verlinkt)';
  const mapping='https://www.din.de/resource/blob/87846/c20d32f877f186e5fc75e514ac737c9d/mehrwert-des-nationalen-vorworts-data.pdf';
  const safety=' S = 1,5: AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1 ((Normtext, nicht verlinkt)).';
  const caution=' Tmax bezeichnet nur das Ende der K-Tabelle, keine Dauerbetriebsfreigabe; Zeitstandnachweis gegebenenfalls gesondert erforderlich.';
  const entries=[];
  function add(grade,number,std,product,type,replacedBy,Rm,K,aliases,note){
    entries.push({id:grade+' | '+std+' | '+product,name:grade+' ('+number+')',
      family:'DIN (alt)',std,product,type,replacedBy,aliases:[number,...aliases],
      Rm,K,S:1.5,Tmax:K[K.length-1][0],note:note+safety+caution});
  }
  // Nur belegte Raumtemperaturwerte; DIN-Warmwerte bleiben ausdrücklich offen.
  const plateSource='SOURCE: Železiarne Podbrezová, Poradnik rury stalowe, 8. Ausgabe 2012, Tabelle chemische Zusammensetzung und mechanische Eigenschaften, Zeilen DIN 17155 H I/H II (https://www.zelpo.sk/e-brochure/PL/PORADNIK_RURY_STALOWE_8wydanie2012/files/assets/common/downloads/accessibility/poradnik-rury-stalowe-2012.pdf?uni=f8466e51e073d5df60e62b104c502060). Dickenbindung ReH: IGV-PP-17B Rev.0, Tabelle im Anhang, Zeilen HI/HII nach DIN 17155 (https://industriegaseverband.de/download-file/IGV-PP-17B-Rev0_Schutz%20vor%20Brandlasten_23.09.2022.pdf). Umschlüsselung: GNS, Tabelle 2.2.1 ((Normtext, nicht verlinkt)). Erhöhte Temperaturwerte UNVERIFIED; ausschließlich 20 °C in K.';
  add('H I','1.0345','DIN 17155','Blech, t ≤ 16 mm','ferritic','P235GH',360,[[20,235]],['HI'],plateSource);
  add('H II','1.0425','DIN 17155','Blech, t ≤ 16 mm','ferritic','P265GH',410,[[20,265]],['HII'],plateSource);

  // NEUMIRA: Originalauszug DIN 17440, Tabelle 5/6, PDF-Seiten 58/59.
  // K ist Rp1,0 (rechte Hälfte der Tabelle 6), NICHT Rp0,2.
  const temps=[20,50,100,150,200,250,300,350,400,450,500,550];
  const ssNote='SOURCE: NEUMIRA Engineering, DIN-FLANSCHEN, DIN 17440, Tabelle 5 (Rp1,0/Rm bei Raumtemperatur, PDF-S. 58), Tabelle 6 (Rp1,0 bei 50–550 °C, rechte Tabellenhälfte, PDF-S. 59) ('+stainless+'). Lösungsgeglühter/abgeschreckter Zustand der Tabelle; keine kaltverfestigte Ausführung. Tabelle 6 nennt für stabilisierte Stähle eine Absenkung erst bei Stäben/Schmiedestücken mit Vergleichsdurchmesser > 160 mm; hier nicht anwendbar. Normausgabe im Abdruck UNVERIFIED, daher keine Jahreszahl behauptet. Die letzte Tabellenspalte ist eine Korrosionsgrenztemperatur, nicht das Ende der Rp1,0-Tabelle. ';
  for(const [grade,number,en,rm,values,aliases] of [
    ['X5CrNi18 10','1.4301','X5CrNi18-10',500,[230,211,191,172,157,145,135,129,125,122,120,120],['X5CrNi18 9','X5CrNi189','X5CrNi1810']],
    ['X2CrNi19 11','1.4306','X2CrNi19-11',460,[215,201,181,162,147,137,127,121,116,112,109,108],['X2CrNi18 9','X2CrNi189','X2CrNi1911']],
    ['X6CrNiTi18 10','1.4541','X6CrNiTi18-10',500,[235,222,208,195,185,175,167,161,156,152,149,147],['X6CrNiTi1810']],
    ['X5CrNiMo17 12 2','1.4401','X5CrNiMo17-12-2',510,[240,230,211,191,177,167,156,150,144,141,139,137],['X5CrNiMo17122']],
    ['X2CrNiMo17 12 2','1.4404','X2CrNiMo17-12-2',490,[225,217,199,181,167,157,145,139,135,130,128,127],['X2CrNiMo17 13 2','X2CrNiMo17132']],
    ['X6CrNiMoTi17 12 2','1.4571','X6CrNiMoTi17-12-2',500,[245,234,218,206,196,186,175,169,164,160,158,157],['X6CrNiMoTi17122']]
  ]) add(grade,number,'DIN 17440','Blech, t ≤ 75 mm, lösungsgeglüht','austenitic',en,rm,
    temps.map((t,i)=>[t,values[i]]),aliases,ssNote+'EN-Kurzname nach Werkstoffnummer im Witzenmann-Handbuch, §7.2 (https://www.witzenmann.de/mediapool/documents/brochures/handbuch-der-metallschl%C3%A4uche.pdf).');

  const forgeNote='SOURCE: DIN 17243:1987, Tabelle 3 (ReH/Rm bei 20 °C) und Tabelle 4 (Rp0,2), Normauszug ('+forging+'); Originalscan Tabellen 3/4, S. 7/8 ('+forgingScan+'). Maß ist der wärmebehandlungsmaßgebende Vergleichsdurchmesser, nicht die lokale Wanddicke. Normalgeglüht; keine Zeitstandkennwerte in K. ';
  add('C 22.8','1.0460','DIN 17243:1987','Schmiedestück, Vergleichsdurchmesser ≤ 60 mm, +N','ferritic','P250GH',410,
    [[20,250],[100,237],[150,216],[200,190],[250,170],[300,150],[350,130],[400,110],[450,90]],['C22.8'],forgeNote+'P250GH: DIN, Beispiel DIN EN 10222-2:2000-04, nationales Vorwort ('+mapping+').');
  add('17 Mn 4','1.0481','DIN 17243:1987','Schmiedestück, Vergleichsdurchmesser ≤ 750 mm, +N','ferritic','P295GH',460,
    [[20,250],[100,225],[150,210],[200,180],[250,165],[300,150],[350,135],[400,130],[450,100]],['17Mn4'],forgeNote+'400/450 °C ergänzt nach DIN-17243-Tabelle ((Normtext, nicht verlinkt)), Review 13.11.2026. Sorte laut DIN-Vorwort entfallen ('+mapping+'); P295GH als direkter Schmiedestück-Ersatz UNVERIFIED.');
  add('15 Mo 3','1.5415','DIN 17243:1987','Schmiedestück, 90 < Vergleichsdurchmesser ≤ 150 mm, +N','ferritic','16Mo3',440,
    [[20,275],[100,240],[150,220],[200,200],[250,185],[300,160],[350,155],[400,145],[450,140],[500,135]],['15Mo3'],forgeNote+'Gezielt die übereinstimmend lesbare Dickenstufe 90–150 mm; andere Stufen nicht ergänzt. Umschlüsselung: KTA 3211.1, Anhang Werkstoffumstellung (https://www.umwelt-online.de/regelwerk/t_regeln/kta/3211_1c.htm).');
  add('13 CrMo 4 4','1.7335','DIN 17243:1987','Schmiedestück, Vergleichsdurchmesser ≤ 60 mm, +NT','ferritic','13CrMo4-5',440,
    [[20,295],[100,260],[150,245],[200,240],[250,230],[300,215],[350,200],[400,190],[450,180],[500,175]],['13CrMo44'],forgeNote+'Umschlüsselung der Werkstoffnummer in DIN EN 10222-2; Änderungen der Kennwerte im nationalen Vorwort ausdrücklich genannt ('+mapping+').');
  AD.materials.push(...entries);
})(globalThis.AD);
