/* ASME II-D 2021 (Metric), supplemental grades. Append after materials.js.
 * Temperatures/stresses are transcribed in °C/MPa, without unit conversion.
 * K20 is specified minimum yield (identification columns), not rounded Sy(≤40).
 * Higher K points are Table Y-1 design yield Sy, not guaranteed hot-test minima.
 * Bolting asmeS comes from Table 3, NOT Table 1A. Printed page locators below.
 */
(function(AD){
  'use strict';
  const source = '(Normtext, nicht verlinkt))%202021.pdf';
  const temperatures = [20,100,200,300,400];
  const table = values => values.map((v,i) => [temperatures[i],v]);
  const aust = 'K ist auftragsgemäß ASME Sy (Rp0,2), nicht der AD-W2-Kennwert Rp1,0. '+
    'UNVERIFIED: Rp1,0 und Mindestbruchdehnung A; nicht hinterlegt. '+
    'asmeS: niedrigere Tabelle-1A-Zeile ohne G5, ohne erhöhte Streckgrenzenausnutzung. ';
  function add(grade,std,product,uns,rm,k,allowable,stressRow,yieldRow,extra='',type='ferritic',bolting=false) {
    const id = grade+' | '+std+' | '+product;
    // Do not silently hide duplicate grades when the database is assembled.
    if (AD.materials.some(m => m.id === id ||
        (m.name === grade && m.std.replace(/ \(BPVC 2021\)$/,'') === std && m.product === product))) {
      throw new Error('Duplicate ASME material: '+id);
    }
    AD.materials.push({
      id, name:grade, family:'ASME', std:std+' (BPVC 2021)', product, type,
      Rm:rm, K:table(k), S:1.5, asmeS:table(allowable),
      asmeEdition:'ASME II-D 2021 (Metric)', asmeTable:bolting?'3':'1A', asmeUse:bolting?'bolting':'pressure-wall', Tmax:400, aliases:[uns,'UNS '+uns],
      note:'QUELLE: ASME BPVC.II.D.M-2021, Tabelle '+(bolting?'3':'1A')+', '+stressRow+
        '; Tabelle Y-1, '+yieldRow+' ('+source+'). '+
        'Rm und K20: spezifizierte Mindestzugfestigkeit/Mindeststreckgrenze in den Identifikationsspalten von Y-1. '+
        'K oberhalb 20 °C: Entwurfskennwert Sy(T), kein zugesicherter Warmzugversuch-Mindestwert (Guideline §3). '+
        'asmeS bei 20 °C: Spalte Temperatur ≤ 40 °C. Nur Stützstellen 20/100/200/300/400 °C übernommen; MPa = N/mm². '+
        'S = 1,5 ist der AD-Vorgabewert gemäß data/SCHEMA.md, keine ASME-Spannung. '+
        (bolting?'Es gelten die Schrauben-Spannungen aus Tabelle 3 (Table 3 bolting stresses apply); nicht als Tabelle-1A-Spannungen für drucktragende Wände verwenden. ':'')+
        'Tmax ist das Ende dieses Auszugs, keine allgemeine Werkstoffzulassung; Code-Anmerkungen, Wärmebehandlung und Zeitstandnachweis beachten. '+extra
    });
  }

  add('SA-516 Gr 55','SA-516','Blech','K01800',380,
    [205,189,177,161,143],[108,108,108,107,89.1],
    'S. 12–14, Z. 8','S. 776–779, Z. 41');
  add('SA-182 F5','SA-182','Schmiedestück','K41545',485,
    [275,248,237,233,219],[138,138,132,131,121],
    'S. 48–50, Z. 8','S. 836–839, Z. 43');
  add('SA-182 F9','SA-182','Schmiedestück','K90941',585,
    [380,341,326,320,301],[168,166,161,159,147],
    'S. 48–50, Z. 22','S. 842–845, Z. 13');
  add('SA-182 F12 Cl2','SA-182','Schmiedestück, Class 2','K11564',485,
    [275,248,225,212,201],[138,135,132,132,132],
    'S. 40–42, Z. 10','S. 824–827, Z. 29');
  add('SA-182 F321','SA-182','Schmiedestück t ≤ 130 mm','S32100',515,
    [205,184,160,142,132],[138,123,106,94.5,87.5],
    'S. 112–114, Z. 24','S. 926–929, Z. 1',aust,'austenitic');
  add('SA-182 F347','SA-182','Schmiedestück t ≤ 130 mm','S34700',515,
    [205,189,166,150,141],[138,126,111,99.8,94.4],
    'S. 104–106, Z. 2','S. 914–917, Z. 21',aust+'Tabelle-1A-Anmerkung H1 beachten. ','austenitic');

  add('SA-335 P1','SA-335','Nahtloses Rohr','K11522',380,
    [205,193,180,170,159],[108,108,108,108,106],
    'S. 32–34, Z. 17','S. 812–815, Z. 40','Tabelle-1A-Anmerkung G11 beachten.');
  add('SA-335 P5','SA-335','Nahtloses Rohr','K41545',415,
    [205,186,178,175,165],[118,118,114,112,104],
    'S. 48–50, Z. 3','S. 836–839, Z. 38');
  add('SA-335 P9','SA-335','Nahtloses Rohr','K90941',415,
    [205,186,178,175,165],[118,118,114,112,104],
    'S. 48–50, Z. 20','S. 842–845, Z. 11');
  add('SA-335 P12','SA-335','Nahtloses Rohr','K11562',415,
    [220,198,180,170,161],[118,116,114,113,107],
    'S. 36–38, Z. 36','S. 824–827, Z. 10');
  add('SA-312 TP321','SA-312','Nahtloses Rohr t ≤ 9,5 mm','S32100',515,
    [205,184,160,142,132],[138,123,106,94.5,87.5],
    'S. 112–114, Z. 37','S. 926–929, Z. 6',aust+'Nur nahtlose Ausführung, t ≤ 9,5 mm. ','austenitic');
  add('SA-312 TP347','SA-312','Nahtloses Rohr','S34700',515,
    [205,189,166,150,141],[138,126,111,99.8,94.4],
    'S. 104–106, Z. 12','S. 914–917, Z. 26',aust+'Nur nahtlose Ausführung der gemeinsamen Rohrzeile. ','austenitic');
  add('SA-387 Gr 12 Cl 2','SA-387','Blech, Class 2','K11757',450,
    [275,248,225,212,201],[128,125,123,123,123],
    'S. 40–42, Z. 4','S. 824–827, Z. 23');
  add('SA-387 Gr 91 Cl 2','SA-387','Blech, Class 2, Type 1, t ≤ 75 mm','K90901',585,
    [415,384,377,377,358],[168,168,167,164,153],
    'S. 48–50, Z. 31','S. 842–845, Z. 21',
    'Nur Type 1 und t ≤ 75 mm; Y-1-Zeile gilt für Types 1 & 2. Tabelle-1A-Anmerkung T6 beachten.');
  add('SA-240 Type 316Ti','SA-240','Blech','S31635',515,
    [205,180,149,131,123],[138,120,99.3,86.7,82.0],
    'S. 84–86, Z. 26','S. 896–899, Z. 17',aust,'austenitic');

  add('SA-193 B7','SA-193','Schrauben t ≤ 64 mm','G41400',860,
    [725,671,632,595,534],[172,172,172,172,162],
    'S. 410–412, Z. 32','S. 818–821, Z. 44',
    'Nur erste Größenstufe; keine Übertragung auf t > 64 mm. ','ferritic',true);
  add('SA-193 B8 Cl1','SA-193','Schrauben, Class 1','S30400',515,
    [205,169,144,129,118],[130,114,95.7,84.5,79.2],
    'S. 418–420, Z. 4','S. 902–905, Z. 14',
    'K ist ASME Sy (Rp0,2). UNVERIFIED: AD-Rp1,0 und A; nicht hinterlegt. Nur Class 1; Tabelle-3-Anmerkungen G5/G6 beachten. ','austenitic',true);
  add('SA-193 B16','SA-193','Schrauben t ≤ 64 mm','K14072',860,
    [725,696,664,631,592],[172,172,172,172,172],
    'S. 414–416, Z. 1','S. 824–827, Z. 35',
    'Nur erste Größenstufe; keine Übertragung auf t > 64 mm. ','ferritic',true);
  add('SA-320 L7','SA-320','Schrauben t ≤ 65 mm','G41400',860,
    [725,671,632,595,534],[172,172,172,172,162],
    'S. 410–412, Z. 33','S. 818–821, Z. 45',
    'Nur t ≤ 65 mm; keine Übertragung auf andere Schraubengüten. ','ferritic',true);
})(globalThis.AD);
