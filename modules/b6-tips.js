/* B6 field explanations; text only, loaded after b6.js. */
(function(AD){
'use strict';
AD.glossary=Object.assign(AD.glossary||{},{
 IPE:'schmale europäische I-Profilreihe',HEA:'leichte europäische Breitflanschprofilreihe',
 HEB:'europäische Breitflanschprofilreihe',UPN:'U-Profilreihe mit geneigten Flanschen',
 FL:'Flachstahl',RHS:'Rechteck-Hohlprofil'
});
const FTIP={b6:{
 Da:'Außendurchmesser der Schale; zusammen mit der Wanddicke bestimmt er das zulässige Durchmesserverhältnis.',
 sn:'Ausgeführte Wanddicke vor Abzug von Toleranz und Korrosionszuschlag. Mindestwert gewöhnlich 3 mm, bei Aluminium 5 mm.',
 rings:'Nur wirksame, gleichmäßig verteilte Umfangsringe wählen; ihre Anschlussnähte sind gesondert nachzuweisen.',
 lengthMode:'Freie Stützlänge direkt eingeben oder aus der Gesamtlänge zwischen den Bodenscheiteln abzüglich beider Bodenhöhen ermitteln.',
 l:'Abstand zwischen wirksamen Stützstellen; bei gewölbten Böden zwischen den Übergängen von Bord zu Krempe messen.',
 headType:'Beide Böden müssen als Endstützen wirken; bei ebenen Böden wird die Gesamtlänge zwischen den Stützebenen verwendet.',
 overallLength:'Bei gewölbten Böden zwischen den äußeren Scheiteln messen, bei ebenen Böden zwischen den wirksamen Stützebenen.',
 headDepth1:'Axialer Abstand vom linken äußeren Scheitel bis zum Übergang von Bord zu Krempe; wird von der Gesamtlänge abgezogen.',
 headDepth2:'Axialer Abstand vom rechten äußeren Scheitel bis zum Übergang von Bord zu Krempe; wird von der Gesamtlänge abgezogen.',
 ovalityMode:'Unrundheit als Prozentwert, aus zwei Durchmessern desselben Querschnitts oder aus örtlicher Abflachung bestimmen.',
 u:'Unrundheit in Prozent; bei mehr als 1,5 % wird der erforderliche Sicherheitsbeiwert gegen elastisches Einbeulen erhöht. Werte ab 100 % sind ungültig.',
 Dmax:'Größter gemessener Durchmesser im selben Querschnitt wie der kleinste Wert; bei Rohren sind auch Außendurchmesser zulässig.',
 Dmin:'Kleinster gemessener Durchmesser im selben Querschnitt und mit derselben Innen- oder Außenmessung wie der größte Wert.',
 q:'Gemessene örtliche Abflachung; die Unrundheit in Prozent wird als 400 × Abflachung / Außendurchmesser berechnet.',
 materialClass:'Werkstoffklasse wählen; sie bestimmt die Mindestsicherheiten, sonstige Werkstoffe sind gesperrt.',
 nu:'Querkontraktionszahl aus Werkstoffdaten, bei Stahl meist 0,30; zulässig sind Werte größer als −1 und kleiner als 0,5.',
 SK:'Sicherheit gegen elastisches Einbeulen, mindestens 3; bei Unrundheit über 1,5 % mindestens 2,25 + 0,5 × Prozentwert.',
 tubeType:'Die Ausnahme von der Mindestwanddicke nur für Wärmeaustauscherrohre wählen; den Korrosionszuschlag dafür gesondert festlegen.',
 creep:'Bei Berechnung im Zeitstandbereich ist ein gesonderter Nachweis nötig; dieses Modul erteilt dann keine Freigabe.',
 ringSpacing:'Größten Ringabstand einschließlich Endfeldern eingeben; gleichmäßige Ringabstände werden vorausgesetzt.',
 ringPos:'Innen oder außen wählen: Das Profil wird an der jeweiligen Schalenfläche angeordnet. Der Schwerpunktdurchmesser des Verbunds beeinflusst die Stabilität; Freiraum zu Einbauten und Anschlussnähte gesondert prüfen.',
 ringSource:'Normprofile mit belegten Achsenwerten oder freie, scharfkantige Maße wählen. Die mittragende Schale wird zum Ringquerschnitt addiert.',
 ringProfileType:'Profilreihe passend zum verwendeten Ring wählen; das U-Profil wird mit der offenen Seite zur Schale angeordnet.',
 ringSection:'Profil liegt mit Steg- bzw. Schenkelstirnseite an der Schale an; der freie Gurt zeigt von ihr weg. Beim U liegen beide Schenkel an. Verbundwerte enthalten Ring und Schale.',
 ringB:'Axiale Anschlussbreite des Rings; beim Flachstahl darf die radiale Höhe höchstens das Achtfache betragen.',
 ringH:'Radiale Gesamthöhe ab Anschlussfläche einschließlich Gurten; beim Flachstahl höchstens achtmal die Anschlussbreite.',
 ringTw:'Stegdicke aus den Profilmaßen; beim U-Profil ist dies die radiale Dicke des axialen Stegs am freien Ende.',
 ringBf:'Gesamte axiale Profilbreite aus dem Profilquerschnitt; bei offenen Profilen ist sie nicht immer die Anschlussbreite.',
 ringTf:'Gurtdicke aus den Profilmaßen; beim U-Profil die axiale Dicke der beiden radialen Schenkel.',
 ringWall:'Wanddicke des Hohlprofils oder Halbrohrs; doppelte Wanddicke muss kleiner als die kleinste äußere Querschnittsabmessung sein.',
 ringPipeD:'Außendurchmesser des Ausgangsrohrs; die Halbrohrhöhe beträgt den halben Durchmesser. Ein Drucknachweis für das Halbrohr ist hier nicht enthalten.',
 widthMode:'Automatisch begrenzte mittragende Schalenbreite verwenden oder eine kleinere Breite vorgeben.',
 shellWidth:'Wirksame axiale Schalenbreite: höchstens der kleinere Wert aus Ringabstand und 1,1·√(Außendurchmesser·Nettowanddicke) + Anschlussbreite.',
 ringA:'Verbundfläche aus Ring und mittragender Schale gesondert berechnen; bei Dickenänderungen neu bestimmen.',
 ringI:'Trägheitsmoment des Verbunds um die zur Behälterachse parallele Schwerpunktachse aus der Verbundberechnung.',
 ringW:'Kleinstes Widerstandsmoment des Verbunds aus Ring und mittragender Schale; höchstens Im/max(e+s₀; h−e). Beide radialen Randfasern berücksichtigen; e zeigt ab Anschlussfläche zum freien Profilrand.',
 ringDm:'Durchmesser der Schwerpunktlinie aus Ring und mittragender Schale. Mit Nettowanddicke s₀: außen Da−s₀ ≤ Dm ≤ Da+2h, innen Da−2s₀−2h ≤ Dm ≤ Da−s₀. Verbundwerte für die gewählte Ringlage berechnen.',
 ringIs:'Trägheitsmoment des Rings ohne Schale gegen seitliches Ausknicken; mindestens (radiale Höhe)⁴ / 3000.',
 ringK:'Festigkeitskennwert des Ringwerkstoffs bei Berechnungstemperatur eingeben. Ring und Schale müssen denselben Elastizitätsmodul haben.',
 ringS:'Sicherheitsfaktor des Ringwerkstoffs; die Berechnung verwendet mindestens die wirksame plastische Sicherheit der Schale.',
 testMode:'Nur bei tatsächlich äußerer Druckdifferenz den Prüfzustand aktivieren; eine Innendruckprüfung wird hier nicht nachgewiesen.',
 pTest:'Positive äußere Druckdifferenz bei der Prüfung in bar, direkt aus den Prüfbedingungen; kein automatisch abgeleiteter Prüfdruck.',
 ETest:'Elastizitätsmodul von Schale und Ring bei Prüftemperatur; Stahl bei Raumtemperatur etwa 210000 N/mm².',
 ringK20:'Festigkeitskennwert des Ringwerkstoffs bei tatsächlicher Prüftemperatur aus den Werkstoffdaten übernehmen; wird zusammen mit E′ auch für die Profilplatten- und Proportionsprüfungen verwendet.'
}};
for(const type of ['IPE','HEA','HEB','UPN','L','T','FL','RHS'])
 FTIP.b6['ringSize'+type]='Eine Kataloggröße wählen oder mit „Eigene Maße“ die Abmessungen des verwendeten Profils eingeben. Katalogwerte enthalten Walz- und Eckradien; eigene Maße beschreiben scharfe Kanten.';
const MTIP={
 b6:[
  "Bei „Berechnungsdruck“ die größte äußere Druckdifferenz einschließlich Vakuum eingeben. Werkstoffwerte zur „Berechnungstemperatur“ wählen, da sie den zulässigen Außendruck bestimmen.",
  "„Freie Länge zwischen wirksamen Stützen“ ohne gewölbte Bodenhöhen und „Unrundheit“ am Bauteil bestimmen. Zu kleine Eingaben können den zulässigen Außendruck überschätzen.",
  "Bei „Größter Ringabstand / größtes Endfeld“ auch die Endfelder berücksichtigen. Durchgehende beidseitige Anschlussnähte gesondert nachweisen, damit die Ringe als Stützen wirken können."
 ]
};
for(const id in FTIP){const m=AD.modules.find(x=>x.id===id);if(!m)continue;
 m.fields.forEach(f=>{if(FTIP[id][f.id])f.tip=FTIP[id][f.id];});m.tips=MTIP[id];}
})(globalThis.AD);
