/* Field explanations (ⓘ toggle) and input tips for the 'Bewertung' modules — concise wording, few abbreviations.
 * Text only — no calculation logic. Loaded after modules/ffs.js.
 * Content reviewed 13.11.2026 (Codex gpt-6.1-sol) against API 579-1 (2016) Parts 4/5, ASME B31G-2012 and the code.
 * AD.glossary: abbreviations that the UI marks with <abbr> (hover / tap shows the long form). */
(function(AD){
'use strict';
AD.glossary=Object.assign(AD.glossary||{},{
 'LTA':'Bereich mit örtlich verringerter Wanddicke (Local Thin Area)',
 'FCA':'zukünftiger Korrosionszuschlag (Future Corrosion Allowance)',
 'COV':'Variationskoeffizient: Standardabweichung / Mittelwert',
 'RSFa':'zulässiger Restfestigkeitsfaktor',
 'RSF':'Restfestigkeitsfaktor (Remaining Strength Factor)',
 'MAWPr':'abgeminderter zulässiger Betriebsdruck',
 'MAWP':'zulässiger Betriebsdruck (Maximum Allowable Working Pressure)',
 'MAOP':'maximal zulässiger Betriebsdruck der Leitung (Maximum Allowable Operating Pressure)',
 'SMYS':'spezifizierte Mindeststreckgrenze (Specified Minimum Yield Strength)',
 'SMTS':'spezifizierte Mindestzugfestigkeit (Specified Minimum Tensile Strength)',
 't_nom':'Nennwanddicke',
 't_mm':'kleinste gemessene Wanddicke',
 't_am':'mittlere gemessene Wanddicke',
 't_min':'erforderliche Mindestwanddicke',
 't_c':'Referenzwanddicke = Nennwanddicke − bisheriger Abtrag − Korrosionszuschlag',
 'L_msd':'Abstand zur nächsten Strukturstörung',
 't_lim':'zusätzliche Mindestwanddicke',
 'LOSS':'bisheriger gleichmäßiger Abtrag neben der Abtragsstelle',
 'E_C':'Nahtfaktor der Umfangsnähte',
 'CR':'Korrosionsrate',
 'API':'American Petroleum Institute',
 'ZfP':'zerstörungsfreie Prüfung',
 'UNS':'Unified Numbering System (US-Werkstoffnummer)',
 'DIN':'Deutsches Institut für Normung',
 'PED':'Druckgeräterichtlinie 2014/68/EU (Pressure Equipment Directive)',
 'DGRL':'Druckgeräterichtlinie 2014/68/EU',
 'PS':'maximal zulässiger Druck nach Druckgeräterichtlinie',
 'TS':'maximal oder minimal zulässige Temperatur nach Druckgeräterichtlinie',
 'PT':'Prüfdruck',
 'PN':'Nenndruckstufe',
 'DN':'Nennweite',
 'DASt':'Deutscher Ausschuss für Stahlbau',
 'IBC':'innerhalb des Schraubenlochkreises (Inside Bolt Circle)',
 'WT':'Wärmeaustauscher',
 'ASME':'American Society of Mechanical Engineers',
 'B31G':'Verfahren zur Bewertung korrodierter Rohrleitungen',
 'B1':'Merkblatt für Zylinder- und Kugelschalen unter innerem Überdruck',
 'EN':'Europäische Norm'
});
const FTIP={
 ffs4:{
  geom:'Gerades Rohr, Zylinderschale oder Rohrbogen wählen. Bei berechneter Mindestwanddicke berücksichtigt der Rechner die höhere Beanspruchung am Innenbogen.',
  Rb:'Biegeradius bis zur Rohrachse, mindestens so groß wie der Außendurchmesser.',
  bpos:'Wo im Bogen der Abtrag liegt. Am Innenbogen ist die Beanspruchung am höchsten.',
  side:'Innen- oder Außenabtrag wählen. Bei Berechnung nach B1 verkleinert Außenabtrag den angesetzten Außendurchmesser; Innenabtrag lässt ihn unverändert. Bei direkter Mindestdickeneingabe beeinflusst die Auswahl den Nachweis nicht.',
  basis:'Die erforderliche Wanddicke nach AD 2000 B1 berechnen lassen oder ohne Zuschläge direkt eingeben. Bei direkter Eingabe muss sie bereits für die gewählte Lage im Rohrbogen gelten.',
  Da:'Außendurchmesser der Zylinderschale.',
  t_nom:'Ursprüngliche Nennwanddicke, ohne Abzüge.',
  FCA:'Erwarteter weiterer Abtrag bis zur nächsten Prüfung: Abtragsrate × Zeit bis dahin.',
  t_min:'Erforderliche Mindestwanddicke ohne Zuschläge aus einem gültigen Festigkeitsnachweis für den eingegebenen Berechnungsdruck übernehmen. Bei Rohrbögen muss sie bereits die gewählte Lage im Bogen berücksichtigen.',
  t_am:'Mittelwert aller gemessenen Wanddicken eingeben. Bei Punktmessungen wird er bewertet. Im Profilmodus bewertet der Rechner den kleinsten Messwert und prüft den Mittelwert nur auf Plausibilität.',
  t_mm:'Die kleinste gemessene Wanddicke aus der vollständigen Messreihe eingeben. Sie wird zusätzlich zum Mittelwert gegen eine lokale Mindestgrenze geprüft.',
  readings:'Bei Punktmessungen ist der Mittelwert ab 15 Messungen mit COV ≤ 0,10 zulässig. Im Profilmodus wird konservativ der kleinste Messwert bewertet.',
  COV:'Stichproben-Standardabweichung (Nenner N−1) durch den Mittelwert teilen. Höchstens 0,10; der Wert muss zum Minimum, Mittelwert und zur Anzahl der Messungen passen.',
  N:'Anzahl aller Punktmessungen der ausgewerteten Messreihe eingeben. Für die Bewertung mit dem Mittelwert sind mindestens 15 erforderlich.',
  t_lim:'Die kleinste gemessene Wanddicke abzüglich zukünftigem Korrosionszuschlag muss mindestens dem größten dieser Werte entsprechen: halbe erforderliche Wanddicke, 20 % der Nennwanddicke, 2,5 mm oder diese Eingabe.',
  rate:'Jährlichen Wanddickenverlust in Millimetern eingeben; daraus wird die Restlebensdauer berechnet. Bei 0 ist keine endliche Restlebensdauer ableitbar.'},
 ffs5:{
  side:'Bei innerem Abtrag wächst der Innendurchmesser um 2 × (LOSS + FCA); bei äußerem Abtrag bleibt er unverändert. LOSS ist der bisherige, FCA der zukünftige Korrosionsabtrag.',
  D:'Ursprünglicher Innendurchmesser. Den Bewertungsdurchmesser berechnet der Rechner aus der Lage des Abtrags.',
  t_nom:'Ursprüngliche Nennwanddicke, ohne Abzüge.',
  FCA:'Erwarteter weiterer Abtrag bis zur nächsten Prüfung, innerhalb und außerhalb der Abtragsstelle gleich.',
  LOSS:'Nur nötig, wenn auch neben der Abtragsstelle gleichmäßig Wand fehlt: Nennwanddicke minus dort gemessene Wanddicke. Sonst 0 lassen; die Stelle selbst ist mit der kleinsten gemessenen Wanddicke erfasst.',
  t_mm:'Kleinste gemessene Wanddicke in der Abtragsstelle.',
  s:'Länge der Abtragsstelle in Achsrichtung, einschließlich erwartetem Wachstum.',
  c:'Breite der Abtragsstelle in Umfangsrichtung, einschließlich erwartetem Wachstum.',
  L_msd:'Vom Rand der Abtragsstelle zum nächsten Stutzen, Boden, Kegel, Ring oder Sattel messen. Mindestabstand: 1,8·√(D·t_c); D ist der Innendurchmesser im Bewertungszustand, t_c die Referenzwanddicke.',
  Ec:'Nahtfaktor der Rundnähte. Wirkt auf die Tragfähigkeit in Längsrichtung.',
  RSFa:'Mindestwert für den Restfestigkeitsfaktor. Üblich 0,90; niedrigere Werte nur mit gesonderter technischer Begründung nach API 579 Anhang 2F.',
  flaw:'Art der Schädigung. Bewertbar ist nur flächiger Abtrag mit weichen Übergängen; für Nuten, Kerben und Risse nennt der Rechner das passende Verfahren.',
  geom:'Gerades Rohr oder Zylinderschale. Rohrbögen sind in dieser Kombination aus B1-Druckbasis und API-579-Screening UNVERIFIED; der Rechner sperrt den Nachweis.',
  Rb:'Biegeradius bis zur Rohrachse, mindestens so groß wie der Außendurchmesser.',
  bpos:'Wo im Bogen der Abtrag liegt. Am Innenbogen ist die Beanspruchung am höchsten, am Außenbogen am niedrigsten.'},
 b31g:{
  side:'Lage des Fehlers. B31G rechnet innen und außen gleich; die Angabe dient der Dokumentation.',
  method:'Original B31G ist das ältere Verfahren, Modified B31G das heute übliche. Welches den niedrigeren zulässigen Druck ergibt, hängt von der Fehlergeometrie ab.',
  D:'Rohraußendurchmesser.',
  t_nom:'Nennwanddicke des Rohres.',
  d:'Größte gemessene Fehlertiefe, höchstens 80 % der Wanddicke.',
  L:'Länge des Korrosionsfehlers in Rohrlängsrichtung.',
  F:'„Druckfaktor“ ist der Kehrwert des Sicherheitsfaktors und multipliziert den Versagensdruck. Üblich sind höchstens 0,8; größere Werte erfordern eine Begründung.',
  yield:'Mindeststreckgrenze aus dem gewählten Werkstoff übernehmen oder direkt eingeben.',
  SMYS:'Spezifizierte Mindeststreckgrenze aus der Rohrnorm eingeben. Dieses Modul ist auf höchstens 483 N/mm² begrenzt.',
  SMTS:'Mindestzugfestigkeit; wird aus dem gewählten Werkstoff übernommen und muss mindestens so groß wie die Streckgrenze sein.',
  flaw:'Art der Schädigung. Bewertbar ist nur flächiger Korrosionsabtrag; für Risse, Kerben, Beulen und Nahtkorrosion nennt der Rechner jeweils das passende Verfahren.',
  geom:'Gerades Rohr oder Rohrbogen wählen. Am Innenbogen vermindert der Bogenfaktor den zulässigen Druck; an Flanke und Außenbogen rechnet das Modul wie beim geraden Rohr.',
  Rb:'Biegeradius bis zur Rohrachse, mindestens so groß wie der Außendurchmesser.',
  bpos:'Wo im Bogen der Fehler liegt. Am Innenbogen ist die Beanspruchung am höchsten.'}
};
const MTIP={
 ffs4:[
  "Den gesamten korrodierten Bereich mit Ultraschall vermessen. „Mittlere gemessene Wanddicke“ und „Kleinste gemessene Wanddicke“ aus der vollständigen Messreihe bestimmen, damit dünne Stellen erfasst werden.",
  "Bei „Messdaten“ nur ab 15 Punktmessungen und „Variationskoeffizient der Messreihe“ höchstens 0,10 „Punktmessungen“ wählen. Sonst „Profil“ nutzen; dann bewertet der Rechner den kleinsten Messwert.",
  "Ist nur eine Stelle deutlich dünner, das Modul „Örtlicher Abtrag (LTA)“ verwenden. Dort gehen Länge und Breite der Abtragsstelle in die Bewertung ein; eine reine Mittelwertbewertung reicht dafür nicht."
 ],
 ffs5:[
  "„Länge der Abtragsstelle“ und „Breite der Abtragsstelle“ einschließlich Wachstum erfassen, wo die Wanddicke nach künftigem Abtrag unter der verbleibenden Wand außerhalb der Stelle liegt. Das bestimmt die Abminderung.",
  "„Abstand zur Strukturstörung“ vom Rand der Abtragsstelle zum nächsten Stutzen, Boden oder anderen störenden Bauteil messen. Unter dem berechneten Mindestabstand ist dieses Verfahren nicht anwendbar.",
  "„Berechnungsdruck“ mit dem abgeminderten zulässigen Betriebsdruck im Ergebnis vergleichen. Überschreitet er diesen Wert, ist die Drucktragfähigkeit der Abtragsstelle nicht ausreichend."
 ],
 b31g:[
  "Nur duktile Kohlenstoffstahlrohre unter Innendruck ohne wesentliche Zusatzlasten bewerten. „Berechnungstemperatur“ muss unter 120 °C liegen; sonst gelten die verwendeten Fließspannungen hier nicht.",
  "Korrosionsstellen mit Längs- oder Umfangsabstand von höchstens drei ursprünglichen Nennwanddicken gemeinsam bewerten. Sonst kann die getrennte Eingabe ihre Wechselwirkung übersehen.",
  "„Druckfaktor“ passend zur geforderten Sicherheit wählen; er multipliziert den Versagensdruck. Ein höherer berechneter sicherer Druck erlaubt keine Erhöhung des bisher zulässigen Leitungsbetriebsdrucks."
 ]
};
// collapsible 'Weitere Parameter': rarely changed / derivable fields go to a folded section at the end
const ADV={ffs4:['t_lim','COV','N'],ffs5:['LOSS','Ec','RSFa','L_msd'],b31g:['F','yield','SMYS','SMTS']};
for(const id in ADV){ const m=AD.modules.find(x=>x.id===id); if(!m||m.fields.some(f=>f.id==='h_more')) continue;
  const adv=m.fields.filter(f=>ADV[id].includes(f.id)); m.fields=m.fields.filter(f=>!ADV[id].includes(f.id));
  m.fields.push({type:'heading',id:'h_more',label:'Weitere Parameter',fold:true},...adv); }
for(const id in FTIP){ const m=AD.modules.find(x=>x.id===id); if(!m) continue;
  m.fields.forEach(f=>{ if(FTIP[id][f.id]) f.tip=FTIP[id][f.id]; }); m.tips=MTIP[id]; }
})(globalThis.AD);
