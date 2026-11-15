/* ASME II-D 2021 (metric), Section VIII Division 1.
 * Only explicitly transcribed temperature points; no ksi/°F conversion.
 * K20 = specified minimum yield in Y-1's identification columns; higher K = Sy(T).
 * asmeS at 20 °C uses the Table 1A column headed temperature NOT EXCEEDING 40 °C.
 * S (AD safety factor) and asmeS (ASME allowable stress) are different quantities.
 * Each source locator uses PRINTED page numbers, not the PDF viewer's page count.
 */
(function(AD){
  'use strict';
  const source = '(Normtext, nicht verlinkt))%202021.pdf';
  const edition = 'ASME II-D 2021 (Metric)';
  const temps = [20,100,200,300,400];
  const table = values => values.map((value,i) => [temps[i],value]);
  function add(grade, std, product, uns, pno, rm, k, allowable, stressRow, yieldRow, extra='', type='ferritic') {
    AD.materials.push({
      id:grade+' | '+std+' | '+product,
      name:grade, family:'ASME', std:std+' (BPVC 2021)', product, type,
      K:table(k), Rm:rm, S:type === 'cast' ? 2.0 : 1.5,
      asmeS:table(allowable), asmeEdition:edition, asmeTable:'1A', asmeUse:'pressure-wall',
      Tmax:Math.max(temps[k.length-1],temps[allowable.length-1]),
      aliases:[uns,'UNS '+uns,'P-No. '+pno],
      note:'QUELLE: ASME BPVC.II.D.M-2021, Tabelle 1A, '+stressRow+
        '; Tabelle Y-1, '+yieldRow+' ('+source+'). '+
        'Rm und K bei 20 °C: Spalten Mindestzugfestigkeit/Mindeststreckgrenze; '+
        'K bei höheren Temperaturen: ASME-Entwurfskennwert Sy(T), kein zugesicherter Mindestwert bei Temperatur (Guideline §3). asmeS bei 20 °C: Spalte ≤ 40 °C. '+
        'Alle Spannungen unverändert in MPa, Temperaturen in °C; keine Einheitenumrechnung. '+
        'S ist der AD-Vorgabewert nach Erzeugnisform (data/SCHEMA.md), keine ASME-Spannung. '+
        'Tabellenende ist keine allgemeine Werkstoffzulassung; Code-Anmerkungen, Wärmebehandlung und Zeitstandnachweis beachten. '+extra
    });
  }

  add('SA-516 Gr 60','SA-516','Blech', 'K02100','1',415,
    [220,201,189,172,153],[118,118,118,115,88.9],
    'S. 16–18, Z. 3','S. 782–785, Z. 38');
  add('SA-516 Gr 65','SA-516','Blech', 'K02403','1',450,
    [240,220,207,188,167],[128,128,128,125,95.0],
    'S. 20–22, Z. 3','S. 788–791, Z. 32');
  add('SA-516 Gr 70','SA-516','Blech', 'K02700','1',485,
    [260,239,225,204,181],[138,138,138,136,101],
    'S. 20–22, Z. 45','S. 794–797, Z. 38');
  add('SA-515 Gr 60','SA-515','Blech', 'K02401','1',415,
    [220,201,189,172,153],[118,118,118,115,88.9],
    'S. 16–18, Z. 2','S. 782–785, Z. 37');
  add('SA-515 Gr 70','SA-515','Blech', 'K03101','1',485,
    [260,239,225,204,181],[138,138,138,136,101],
    'S. 20–22, Z. 44','S. 794–797, Z. 37');
  add('SA-285 Gr C','SA-285','Blech', 'K02801','1',380,
    [205,189,177],[108,108,108],
    'S. 12–14, Z. 4','S. 776–778, Z. 38',
    'Hier nur bis 200 °C übertragene Stützstellen; weitere Temperaturen nicht hinterlegt.');
  add('SA-537 Cl 1','SA-537','Blech t ≤ 65 mm', 'K12437','1',485,
    [345,302,261,235],[138,138,134,134],
    'S. 24–26, Z. 24','S. 800–803, Z. 14',
    'Nur erste Dickenstufe; keine Übertragung auf 65 < t ≤ 100 mm.');
  add('SA-612','SA-612','Blech 12,5 < t ≤ 25 mm', 'K02900','10C',560,
    [345,300,260,237],[159,159,156,155],
    'S. 28–30, Z. 27','S. 806–809, Z. 20',
    'VIII-1-Grenze 343 °C; Datensatz endet konservativ bei 300 °C.');
  add('SA-106 Gr B','SA-106','Nahtloses Rohr', 'K03006','1',415,
    [240,220,207,188,167],[118,118,118,118,88.9],
    'S. 16–18, Z. 16','S. 788–791, Z. 4');
  add('SA-106 Gr C','SA-106','Nahtloses Rohr', 'K03501','1',485,
    [275,251,237,216,191],[138,138,138,138,101],
    'S. 24–26, Z. 6','S. 794–797, Z. 43');
  add('SA-53 Gr B (seamless)','SA-53','Nahtloses Rohr, Type S', 'K03005','1',415,
    [240,220,207,188,167],[118,118,118,118,88.9],
    'S. 16–18, Z. 15','S. 788–791, Z. 3',
    'Type S; nicht die reduzierte Spannung der geschweißten Zeile verwenden.');
  add('SA-333 Gr 6','SA-333','Nahtloses Rohr', 'K03006','1',415,
    [240,220,207,188,167],[118,118,118,118,88.9],
    'S. 16–18, Z. 19','S. 788–791, Z. 7',
    'Nur nahtlose Ausführung aus der gemeinsamen nahtlos/geschweißt-Zeile.');
  add('SA-334 Gr 6','SA-334','Nahtloses Rohr (tube)', 'K03006','1',415,
    [240,220,207,188],[118,118,118,118],
    'S. 16–18, Z. 21','S. 788–791, Z. 8',
    'VIII-1-Grenze 343 °C; keine 400-°C-Spannung in Tabelle 1A.');
  add('SA-105','SA-105','Schmiedestück', 'K03504','1',485,
    [250,227,213,194,171],[138,138,138,129,101],
    'S. 20–22, Z. 31','S. 794–797, Z. 25');
  add('SA-350 LF2 Cl1','SA-350','Schmiedestück, Class 1', 'K03011','1',485,
    [250,227,213,194,171],[138,138,138,129,101],
    'S. 20–22, Z. 36','S. 794–797, Z. 30');
  add('SA-181 Cl70','SA-181','Schmiedestück, Class 70', 'K03502','1',485,
    [250,227,213,194,171],[138,138,138,129,101],
    'S. 20–22, Z. 32','S. 794–797, Z. 26');
  add('SA-216 WCB','SA-216','Stahlguss', 'J03002','1',485,
    [250,227,213,194,171],[138,138,138,129,101],
    'S. 20–22, Z. 33','S. 794–797, Z. 27',
    'AD-Vorgabe S = 2,0 für Guss ohne besonderen Prüfnachweis.','cast');

  add('SA-182 F11 Cl2','SA-182','Schmiedestück, Class 2', 'K11572','4',485,
    [275,253,233,219,204],[138,138,138,138,136],
    'S. 40–42, Z. 27','S. 830–833, Z. 13');
  add('SA-213 T11','SA-213','Nahtloses Rohr (tube)', 'K11597','4',415,
    [205,190,175,164,153],[118,118,116,109,102],
    'S. 40–42, Z. 17','S. 830–833, Z. 6');
  add('SA-335 P11','SA-335','Nahtloses Rohr', 'K11597','4',415,
    [205,190,175,164,153],[118,118,116,109,102],
    'S. 40–42, Z. 21','S. 830–833, Z. 8');
  add('SA-387 Gr 11 Cl 2','SA-387','Blech, Class 2', 'K11789','4',515,
    [310,284,262,246,229],[148,148,148,148,148],
    'S. 40–42, Z. 30','S. 830–833, Z. 19');
  add('SA-213 T22','SA-213','Nahtloses Rohr (tube)', 'K21590','5A',415,
    [205,192,185,185,185],[118,118,114,114,114],
    'S. 40–42, Z. 37','S. 830–833, Z. 26');
  add('SA-335 P22','SA-335','Nahtloses Rohr', 'K21590','5A',415,
    [205,192,185,185,185],[118,118,114,114,114],
    'S. 40–42, Z. 41','S. 830–833, Z. 28');
  add('SA-182 F22 Cl3','SA-182','Schmiedestück, Class 3', 'K21590','5A',515,
    [310,282,263,253,241],[148,147,142,141,136],
    'S. 44–46, Z. 10','S. 830–833, Z. 44');
  add('SA-387 Gr 22 Cl 2','SA-387','Blech, Class 2', 'K21590','5A',515,
    [310,282,263,253,241],[148,147,142,141,136],
    'S. 44–46, Z. 12','S. 836–839, Z. 1');
  add('SA-182 F91','SA-182','Schmiedestück, Type 1, t ≤ 75 mm', 'K90901','15E',620,
    [415,384,377,377,358],[177,177,177,175,162],
    'S. 48–50, Z. 33','S. 842–845, Z. 22',
    'Nur Type 1; Wärmebehandlungsanforderungen und Tabellenanmerkung T6 beachten.');
  add('SA-213 T91','SA-213','Nahtloses Rohr (tube), Type 1', 'K90901','15E',585,
    [415,384,377,377,358],[168,168,167,164,153],
    'S. 48–50, Z. 26','S. 842–845, Z. 17',
    'Nur Type 1; Tabellenanmerkung T6 beachten.');
  add('SA-335 P91','SA-335','Nahtloses Rohr, Type 1, t ≤ 75 mm', 'K90901','15E',585,
    [415,384,377,377,358],[168,168,167,164,153],
    'S. 48–50, Z. 28','S. 842–845, Z. 19',
    'Nur Type 1; keine Übertragung auf die Dickenstufe t > 75 mm; Tabellenanmerkung T6 beachten.');
  // Requested ASME Sy is Rp0.2 here, not the AD austenitic Rp1.0 convention.
  const aust = 'K ist hier auftragsgemäß ASME Sy (Rp0,2), nicht Rp1,0 nach AD W2. '+
    'AD/EN-Werkstoffzulassung und die dort maßgebende Festigkeitsdefinition gesondert prüfen. '+
    'UNVERIFIED: Rp1,0 und Mindestbruchdehnung A; nicht hinterlegt. '+
    'asmeS verwendet die niedrigere Tabellenzeile ohne G5 (keine erhöhte Streckgrenzenausnutzung).';
  add('SA-182 F304','SA-182','Schmiedestück t ≤ 130 mm','S30400','8',515,
    [205,170,144,129,118],[138,113,95.7,85.9,79.2],
    'S. 92–94, Z. 8','S. 902–905, Z. 12',aust,'austenitic');
  add('SA-182 F304L','SA-182','Schmiedestück t ≤ 130 mm','S30403','8',485,
    [170,146,121,108,101],[115,97.0,81.2,72.3,67.6],
    'S. 88–90, Z. 12','S. 896–899, Z. 33',aust,'austenitic');
  add('SA-182 F316','SA-182','Schmiedestück t ≤ 130 mm','S31600','8',515,
    [205,176,148,132,123],[138,118,99.2,88.1,82.0],
    'S. 76–78, Z. 23','S. 884–887, Z. 20',aust,'austenitic');
  add('SA-182 F316L','SA-182','Schmiedestück t ≤ 130 mm','S31603','8',485,
    [170,145,121,109,101],[115,96.3,81.2,72.5,67.5],
    'S. 72–74, Z. 31','S. 878–881, Z. 43',aust,'austenitic');
  add('SA-240 Type 304','SA-240','Blech','S30400','8',515,
    [205,170,144,129,118],[138,113,95.7,85.9,79.2],
    'S. 92–94, Z. 18','S. 902–905, Z. 19',aust,'austenitic');
  add('SA-240 Type 304L','SA-240','Blech','S30403','8',485,
    [170,146,121,108,101],[115,97.0,81.2,72.3,67.6],
    'S. 88–90, Z. 16','S. 896–899, Z. 35',aust,'austenitic');
  add('SA-240 Type 316','SA-240','Blech','S31600','8',515,
    [205,176,148,132,123],[138,118,99.2,88.1,82.0],
    'S. 76–78, Z. 27','S. 884–887, Z. 24',aust,'austenitic');
  add('SA-240 Type 316L','SA-240','Blech','S31603','8',485,
    [170,145,121,109,101],[115,96.3,81.2,72.5,67.5],
    'S. 72–74, Z. 35','S. 878–881, Z. 45',aust,'austenitic');
  add('SA-312 TP304','SA-312','Nahtloses Rohr','S30400','8',515,
    [205,170,144,129,118],[138,113,95.7,85.9,79.2],
    'S. 92–94, Z. 31','S. 902–905, Z. 23',aust,'austenitic');
  add('SA-312 TP304L','SA-312','Nahtloses Rohr','S30403','8',485,
    [170,146,121,108,101],[115,97.0,81.2,72.3,67.6],
    'S. 88–90, Z. 21','S. 896–899, Z. 37',aust,'austenitic');
  add('SA-312 TP316','SA-312','Nahtloses Rohr','S31600','8',515,
    [205,176,148,132,123],[138,118,99.2,88.1,82.0],
    'S. 76–78, Z. 33','S. 884–887, Z. 26',aust,'austenitic');
  add('SA-312 TP316L','SA-312','Nahtloses Rohr','S31603','8',485,
    [170,145,121,109,101],[115,96.3,81.2,72.5,67.5],
    'S. 72–74, Z. 40','S. 884–887, Z. 2',aust,'austenitic');
  add('SA-351 CF8','SA-351','Stahlguss','J92600','8',485,
    [205,170,144,129,118],[138,113,95.7,85.6,79.2],
    'S. 88–90, Z. 41','S. 902–905, Z. 5',aust,'cast');
  add('SA-351 CF8M','SA-351','Stahlguss','J92900','8',485,
    [205,176,148,131,123],[138,117,98.5,88.2,82.0],
    'S. 76–78, Z. 12','S. 884–887, Z. 14',aust,'cast');
  add('SA-240 Type 321','SA-240','Blech','S32100','8',515,
    [205,184,160,142,132],[138,123,106,94.5,87.5],
    'S. 112–114, Z. 30','S. 926–929, Z. 4',aust,'austenitic');
  add('SA-240 Type 347','SA-240','Blech','S34700','8',515,
    [205,189,166,150,141],[138,126,111,99.8,94.4],
    'S. 104–106, Z. 6','S. 914–917, Z. 24',aust,'austenitic');
  add('SA-240 Type 2205 (S31803)','SA-240','Blech','S31803','10H',620,
    [450,395,354,334],[177,177,165,160],
    'S. 132–134, Z. 19','S. 938–941, Z. 25',
    'UNS S31803, nicht S32205; beide Tabellen hier nur bis 300 °C übertragen.','duplex');

  /* Nicht als auswählbare Einträge angelegt:
   * SA-193 B7 / SA-193 B8 Cl1 / SA-320 L7: UNVERIFIED für die hier
   * verlangte Kombination Tabelle 1A + Y-1. Schrauben-Spannungen gehören
   * in II-D Tabelle 3 (nicht Tabelle 1A); keine Table-3-Werte als 1A ausgeben.
   * SA-194 Gr 2H: UNVERIFIED Rm/Sy und Tabelle-1A-Spannungen; Mutter mit
   * Prüfbelastungs-/Härteanforderungen, keine erfundene Streckgrenze in K.
   * Quelle zur Tabellenzuordnung: ASME II-D 2021, Guideline on Locating
   * Materials, §2.5 (Table 3), §3.3 (Y-1), und Table 3:
   * (Normtext, nicht verlinkt))%202021.pdf
   */
})(globalThis.AD);
