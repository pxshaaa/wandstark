/* Erläuterungen und Eingabetipps für die Stutzenmodule; keine Rechenlogik. */
(function(AD){
'use strict';
AD.glossary=Object.assign(AD.glossary||{},{});
const common={
 sn:'Ausgeführte Wanddicke am Ausschnitt: mindestens 2 mm und größer als die Summe der gemeinsamen Zuschläge. Ausnahmen von der Mindestwanddicke sind nicht implementiert.',
 dA:'Außendurchmesser des Stutzenrohres aus der Rohrabmessung; die lichte Weite ergibt sich durch Abzug der doppelten Rohrwanddicke.',
 ss:'Stutzenwanddicke mindestens 2 mm einschließlich Zuschlägen; die Nettowanddicke darf höchstens das Doppelte der Nettowanddicke des Grundkörpers betragen.',
 ls:'Verfügbarer äußerer Überstand ab der Außenfläche des Grundkörpers; angerechnet wird höchstens die berechnete mittragende Länge.',
 Ks:'Festigkeitskennwert des Stutzenwerkstoffs bei Berechnungstemperatur. Bei Eingabe von 0 wird der Grundkörperwert übernommen; dieser begrenzt den anrechenbaren Kennwert im Flächenvergleich.',
 Ss:'Sicherheitsbeiwert des Stutzenwerkstoffs; 0 übernimmt den gemeinsamen Sicherheitsbeiwert, sonst einen positiven Wert eingeben.'
};
const FTIP={
 b9:Object.assign({},common,{
  Da:'Mantel-Außendurchmesser; der Innendurchmesser ergibt sich durch Abzug der doppelten ausgeführten Wanddicke.',
  sn:'Ausgeführte Mantelwanddicke am Ausschnitt: mindestens 2 mm und größer als die Summe der gemeinsamen Zuschläge.',
  mount:'Anschlussart wählen; eingesetzte Stutzen werden ohne Anrechnung von Wanddurchtritt und inneren Überständen berechnet.',
  hp:'Ausgeführte Dicke einer Verstärkungsscheibe; sie wird nur dargestellt und erhöht die berechnete Tragfähigkeit nicht.',
  bp:'Radiale Breite der Verstärkungsscheibe ab Stutzenaußenkante; sie wird nur dargestellt und im Festigkeitsnachweis nicht angerechnet.'
 }),
 b9k:Object.assign({},common,{
  shape:'Kugelschale oder Bodenkalotte wählen. Für den Flächenvergleich ersetzt das Modul die Schale durch einen Zylinder gleichen Innendurchmessers (nicht verifiziert). Böden zusätzlich als Ganzes nachweisen.',
  R:'Innenradius der Kugelschale oder Bodenkalotte, nicht der Krempe.',
  Da:'Außendurchmesser des gesamten Bodens; begrenzt die zulässige Scheitelzone auf einen Durchmesser von 60 % dieses Wertes.',
  x:'Radialer Abstand der Öffnungsmitte von der Bodenachse, in der Projektion gemessen. Öffnung und erforderlicher ungestörter Wandbereich müssen vollständig innerhalb der Scheitelzone liegen.'
 })
};
const MTIP={
 b9:[
  "Nur einen senkrechten, volltragend angeschlossenen Einzelstutzen ohne Nachbaröffnungen oder äußere Lasten bewerten. Diese zusätzlichen Einflüsse sind im Flächenvergleich nicht enthalten.",
  "„Mantelwanddicke am Ausschnitt“ ab Ausschnittsrand über mindestens die berechnete mittragende Breite und drei Mantelwanddicken sicherstellen. Sonst fehlt die vorausgesetzte tragende Wandfläche.",
  "„Stutzenwanddicke“ vor Abzug von „Minustoleranz“ und „Korrosionszuschlag“ eingeben; beide werden auch am Stutzen abgezogen. Scheiben und innere Überstände erhöhen die Tragfähigkeit hier nicht."
 ],
 b9k:[
  "Bei „Innenradius Kugel / Kalotte“ den tatsächlichen Innenradius eingeben; er bestimmt die Druckbeanspruchung. Bei Böden zusätzlich den gesamten Boden gesondert nachweisen.",
  "Bei Böden Öffnung und erforderlichen ungestörten Wandbereich innerhalb eines Radius von 30 % des Werts „Boden-Außendurchmesser“ halten. Außerhalb dieser Scheitelzone sperrt der Rechner den Nachweis.",
  "Nur radiale aufgesetzte Einzelstutzen ohne Scheibe, Innenüberstände oder äußere Lasten prüfen. Der Zylinderersatz für die Kugel ist nicht verifiziert; Anschluss gesondert prüfen."
 ]
};
for(const id in FTIP){const m=AD.modules.find(x=>x.id===id);if(!m)continue;
 m.fields.forEach(f=>{if(FTIP[id][f.id])f.tip=FTIP[id][f.id];});m.tips=MTIP[id];}
})(globalThis.AD);
