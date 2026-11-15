/* Field explanations and practical input tips for B1, B3, B5 and B10.
 * Text only; loaded after modules/b1.js and modules/b10.js. */
(function(AD){
'use strict';
AD.glossary=Object.assign(AD.glossary||{},{
 AD:'Arbeitsgemeinschaft Druckbehälter',
 B1:'Merkblatt für Zylinder- und Kugelschalen unter innerem Überdruck',
 B3:'Merkblatt für gewölbte Böden unter innerem und äußerem Überdruck',
 B9:'Merkblatt für Ausschnitte in Zylindern, Kegeln und Kugeln',
 B5:'Merkblatt für ebene Böden und Platten',
 Da:'Außendurchmesser', Di:'Innendurchmesser',
 B10:'Merkblatt für dickwandige zylindrische Mäntel unter innerem Überdruck'
});
const shell={
 Da:'Außendurchmesser der Schale am betrachteten Querschnitt; zulässig ist höchstens Da/Di = 1,2. Da ist der Außen-, Di der Innendurchmesser.',
 sn:'Ausgeführte Wanddicke vor Abzug der Toleranz- und Korrosionszuschläge; für Stahl mindestens 2 mm.'
};
const FTIP={
 cyl:{...shell},
 sph:{...shell},
 b3:{
  Da:'Außendurchmesser am zylindrischen Bord; daraus berechnet das Modul die Radien der gewählten Bodenform.',
  sn:'Die ausgeführte Bodenwanddicke muss mindestens 2 mm betragen. Nach Abzug der Zuschläge gilt: 0,001 ≤ Nettowanddicke/Außendurchmesser ≤ 0,1.',
  htype:'Bodenform wählen; daraus berechnet das Modul die inneren Wölbungs- und Krempenradien sowie die Wölbungshöhe.',
  beta:'Pflichteingabe aus B3: Beiwert für Nettowanddicke/Außendurchmesser und Krempenausschnitte; nach Maß-/Zuschlagsänderungen neu ablesen. Prüfung behält konservativ beide Zuschläge bei.'
 },
 b5:{
  D:'Berechnungsdurchmesser passend zur Anschlussform aus AD 2000 B5 Tafel 1; er ist nicht immer der Außendurchmesser der Platte.',
  sn:'Ausgeführte Plattendicke vor Abzug der Zuschläge; oberhalb 25 mm entfällt der Toleranzzuschlag. Maßgrenzen nach B5 beachten; Fertigungsanforderungen gesondert prüfen.',
  C:'Pflichteingabe: Beiwert und Berechnungsdurchmesser gemeinsam für die tatsächliche Anschlussform aus AD 2000 B5 Tafel 1 wählen.'
 },
 b10:{
  shape:'Nur zylindrische Mäntel sind abgedeckt; die Auswahl Kugel sperrt den Nachweis.',
  Da:'Außendurchmesser; für das Verhältnis zum Innendurchmesser muss mit und ohne Berücksichtigung der Zuschläge 1,2 < Da/Di ≤ 1,5 gelten. Da ist der Außen-, Di der Innendurchmesser.',
  sn:'Ausgeführte Wanddicke einschließlich Toleranz- und Korrosionszuschlag; beide werden auch bei der Prüfung abgezogen.',
  thermal:'Temperaturunterschied zwischen Innen- und Außenseite der Wand; bei nennenswertem Unterschied ist der Nachweis gesperrt.',
  axial:'Volle Axialbeanspruchung durch Innendruck bei geschlossenen Enden wählen; andere Fälle sind gesperrt.',
  material:'Nur verformungsfähigen Walz- oder Schmiedestahl wählen; Festigkeitswerte müssen zur Erzeugnisdicke passen.'
 }
};
const MTIP={
 cyl:[
  "„Außendurchmesser“ und „Ausgeführte Wanddicke“ am selben Zylinderquerschnitt bestimmen. Aus beiden berechnet der Rechner den Innendurchmesser und prüft den Geltungsbereich.",
  "„Ausgeführte Wanddicke“ ohne vorherige Abzüge eingeben; „Minustoleranz“ und „Korrosionszuschlag“ werden gesondert abgezogen. Bleibt keine Wanddicke übrig, ist kein Nachweis möglich.",
  "Außen- durch Innendurchmesser teilen; über 1,2 ist der Zylindernachweis hier nicht anwendbar. Dann den Geltungsbereich des Moduls für dickwandige Zylinder prüfen."
 ],
 sph:[
  "„Außendurchmesser“ und „Ausgeführte Wanddicke“ der Kugelschale vor Abzug der Zuschläge eingeben. Daraus berechnet der Rechner die erforderliche Dicke und den zulässigen Druck.",
  "Für Stahl bei „Ausgeführte Wanddicke“ mindestens 2 mm ansetzen. „Minustoleranz“ und „Korrosionszuschlag“ getrennt eingeben, damit der Rechner die verbleibende Wand richtig bewertet.",
  "Außen- durch Innendurchmesser der Kugelschale teilen. Liegt das Verhältnis über 1,2, ist dieses Modul nicht anwendbar und ein gesonderter Dickwandnachweis erforderlich."
 ],
 b3:[
  "„Bodenform“ passend zum gefertigten Boden wählen. Der Rechner leitet daraus Wölbungsradius, Krempenradius und Bodenhöhe ab; eine falsche Auswahl verändert den Nachweis.",
  "„Beiwert aus Diagramm“ nach Änderungen an „Ausgeführte Wanddicke“, „Außendurchmesser“ oder Zuschlägen neu bestimmen. Der Rechner aktualisiert den Krempenbeiwert nicht selbst.",
  "Krempenausschnitte beim Ablesen von β nach B3 berücksichtigen. Für Kalottenausschnitte die Verstärkung gesondert nach B9 nachweisen; der Rechner berechnet die Kalotte ohne Ausschnitte."
 ],
 b5:[
  "„Beiwert Einspannung“ und „Berechnungsdurchmesser“ für dieselbe Anschlussform aus AD 2000 B5 Tafel 1 wählen. Eine falsche Zuordnung verfälscht die erforderliche Plattendicke.",
  "Nur unverankerte runde Platten ohne zusätzliches Randmoment mit diesem Modul prüfen. Andere Plattenformen und Belastungen sind durch die verwendete Formel nicht abgedeckt.",
  "„Ausgeführte Wanddicke“ ohne Abzüge eingeben, „Minustoleranz“ und „Korrosionszuschlag“ getrennt. Über 25 mm Plattendicke lässt der Rechner nur die Minustoleranz entfallen."
 ],
 b10:[
  "Nur glatte Zylindermäntel ohne Bohrungen, Zusatzlasten oder Zeitstandbeanspruchung bewerten. Diese Einflüsse sind im Nachweis nicht enthalten und erfordern eine gesonderte Berechnung.",
  "„Schweißnahtfaktor“ auf 1 setzen; „Sicherheitsbeiwert“ mindestens 1,5 und „Sicherheitsbeiwert Prüfung“ mindestens 1,05 wählen. Kleinere Werte sperren den Nachweis.",
  "Festigkeitswerte passend zur tatsächlichen Erzeugnisdicke wählen; sie bestimmen die zulässige Spannung. Den vorläufigen Berechnungsansatz für den Prüfzustand gesondert prüfen."
 ]
};
for(const id in FTIP){
 const m=AD.modules.find(x=>x.id===id); if(!m) continue;
 m.fields.forEach(f=>{if(FTIP[id][f.id]) f.tip=FTIP[id][f.id];});
 m.tips=MTIP[id];
}
})(globalThis.AD);
