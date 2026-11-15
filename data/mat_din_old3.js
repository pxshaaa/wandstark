/* Historische DIN-Ergänzung 3. Einheiten: °C, N/mm², mm.
 * Nur belegte Tabellenpunkte; keine Übertragung heutiger EN-Warmwerte.
 * UNVERIFIED / nicht aufgenommen: DIN 17245 GS-16 Mo 5 (Bezeichnung nicht
 * belegt), GS-22 Mo 4, GS-17 CrMo 5 5, GS-18 CrMo 9 10 (keine vollständig
 * belegte historische Zuordnung von Rm, K, Lieferzustand und Dickenbereich).
 * replacedBy und historische aliases sind Umschlüsselungshilfen;
 * sie geben keine Gleichwertigkeit unterschiedlicher Normausgaben frei.
 */
(function(AD){
  'use strict';
  const entries=[];
  const b0='(Normtext, nicht verlinkt)';
  const platePDF='https://de.cdn-website.com/2996e3ef68364a6ba843313781d9149f/files/uploaded/1057267-13CrMo44_chapa.pdf';
  const plateMap='https://www.dillinger.de/app/uploads/2024/03/20160215042253-ki_stahlsortenvergleich_rev0_d.pdf';
  const ss='https://www.neumira-engineering.com/catalogues/DIN-FLANSCHEN.pdf';
  const ebro='https://www.ebro-armaturen.com/wp-content/uploads/2019/10/Technisches%20Begleitheft_01-2017_DE.pdf';
  function add(grade,number,std,product,type,replacedBy,Rm,K,aliases,note){
    entries.push({id:grade+' | '+std+' | '+product,name:grade+' ('+number+')',
      family:'DIN (alt)',std,product,type,replacedBy,aliases:[number,...aliases],
      Rm,K,S:type==='cast'?2:1.5,Tmax:K[K.length-1][0],
      note:note+' S = '+(type==='cast'?'2,0 für Stahlguss ohne besonderen Prüfnachweis':'1,5 für Walzstahl')+
        ': AD 2000 B0 (11/2008), §7, Tafel 2 ('+b0+'). Tmax ist nur das Ende der K-Tabelle; kein Zeitstandnachweis und keine Dauerbetriebsfreigabe.'});
  }
  // Historische ReH-Werte unterscheiden sich von heutigen EN-Werten (17Mn4: 290).
  // Bei 15Mo3 die Fußnote für t < 10 mm ausdrücklich ausschließen.
  for(const [grade,number,en,rm,k,band,aliases] of [
    ['17Mn4','1.0481','P295GH',460,290,'6 ≤ t ≤ 16 mm',['17 Mn 4']],
    ['19Mn6','1.0473','P355GH',510,355,'6 ≤ t ≤ 16 mm',['19 Mn 6']],
    ['15Mo3','1.5415','16Mo3',440,275,'10 ≤ t ≤ 16 mm',['15 Mo 3']],
    ['13CrMo44','1.7335','13CrMo4-5',440,300,'6 ≤ t ≤ 16 mm',['13 CrMo 4 4']],
    ['10CrMo910','1.7380','10CrMo9-10',480,310,'6 ≤ t ≤ 16 mm',['10 CrMo 9 10','10CrMo9.10']]
  ]) add(grade,number,'DIN 17155','Blech, '+band,'ferritic',en,rm,[[20,k]],aliases,
    'SOURCE: DIN-17155-Wiedergabe, Tabelle „Propiedades mecánicas“, S. 1, ReH-Spalte ≤ 16 mm / Rm-Spalte ≤ 60 mm ('+platePDF+'); '+
    'Katalor, Tabelle „Mechanical Properties“ für '+grade+' (https://www.katalor.com/pressure-vessel/DIN-17155/DIN-17155-'+grade+'.html). '+
    (grade==='15Mo3'?'Fußnote 3: t < 10 mm hat einen anderen ReH-Mindestwert und ist ausgeschlossen. ':'')+
    'Umschlüsselung: Dillinger, Kundeninformation Stahlsortenvergleich, Tabelle alte nationale Normen / EN 10028-2 ('+plateMap+'). '+
    'Normausgabe der Kennwertwiedergabe UNVERIFIED. Historische erhöhte Temperaturwerte UNVERIFIED und nicht in K enthalten. Nur Raumtemperatur; Lieferzustand und Kennwerte nach Spannungsarmglühen gesondert prüfen.');

  add('14MoV63','1.7715','DIN 17175:1979','Nahtloses Rohr, t ≤ 16 mm, D > 30 mm','ferritic','14MoV6-3',460,
    [[20,320],[200,270],[250,255],[300,230],[350,215],[400,200],[450,185],[500,170]],['14 MoV 6 3','14MoV6-3'],
    'SOURCE: Klöckner Konstruktionshandbuch, S. 263, Tabelle 2 (ReH/Rm bei Raumtemperatur), S. 264, Tabelle 3 (Rp0,2 bei 200–500 °C, Wanddicke ≤ 40 mm), nach DIN 17175 ('+
    '(Normtext, nicht verlinkt)). Originalnorm-Wiedergabe DIN 17175:1979, Tabellen 5/6 ('+
    '(Normtext, nicht verlinkt)). Die abweichende unnummerierte Kurztafel auf PDF-S. 1 wird nicht verwendet. '+
    'Kein Kleinrohrabschlag, da D > 30 mm. Umschlüsselung: Železiarne Podbrezová, Poradnik rury stalowe, 2012, S. 116, Vergleichstabelle DIN 17175 / EN 10216-2 ('+
    'https://www.zelpo.sk/e-brochure/PL/PORADNIK_RURY_STALOWE_8wydanie2012/116/).');

  const temperatures=[20,50,100,150,200,250,300,350,400,450,500,550];
  for(const [grade,number,en,rm,values,aliases] of [
    ['X3CrNiMo17 13 3','1.4436','X3CrNiMo17-13-3',510,[240,230,211,191,177,167,156,150,144,141,139,137],['X5CrNiMo17 13 3','X5CrNiMo17133','X3CrNiMo17-13-3']],
    ['X2CrNiMo18 14 3','1.4435','X2CrNiMo18-14-3',490,[225,217,199,181,167,157,145,139,135,130,128,127],['X2CrNiMo18143','X2CrNiMo18-14-3']],
    ['X6CrNiNb18 10','1.4550','X6CrNiNb18-10',510,[240,226,211,196,186,177,167,161,156,152,149,147],['X6CrNiNb1810','X6CrNiNb18-10']]
  ]) add(grade,number,'DIN 17440','Blech, t ≤ 75 mm, lösungsgeglüht','austenitic',en,rm,
    temperatures.map((t,i)=>[t,values[i]]),aliases,
    'SOURCE: NEUMIRA Engineering DIN-FLANSCHEN, DIN 17440, Tabelle 5, PDF-S. 58 (Rp1,0/Rm für Flacherzeugnisse ≤ 75 mm), Tabelle 6, PDF-S. 59 (rechte Tabellenhälfte: Rp1,0 bei 50–550 °C) ('+ss+'). '+
    'Lösungsgeglüht und abgeschreckt; keine kaltverfestigte Ausführung. Die Korrosionsgrenztemperatur in der letzten Spalte ist kein K-Tabellenende. Normausgabe im Abdruck UNVERIFIED. '+
    (number==='1.4436'?'Kennwerte ausschließlich aus der X3CrNiMo17-13-3-Zeile; X5CrNiMo17 13 3 ist die ältere Suchbezeichnung, nicht eine zusätzliche Kennwertreihe. Gleichheit der Kennwerte früherer X5-Normausgaben UNVERIFIED. ':'')+
    'EN-/DIN-Kurzname nach Werkstoffnummer: EBRO, Technisches Begleitheft, Abschnitt 6, Tabelle „Rostfreie Stähle“ ('+ebro+').');

  add('GS-C 25','1.0619','DIN 17245','Feinguss, vergütet, Herstellerkennwerte ohne Dickenstaffel','cast','GP240GH',440,[[20,245]],['GS C 25','GS-C25'],
    'SOURCE: ZOLLERN, Stahl-Legierungen, Tabelle „Warmfester Stahlguss“, Zeile GS C 25 / 1.0619 / DIN 17245 und EN 10213, Spalten Rp0,2 bei 20 °C und Rm ('+
    'https://www.zollern.com/fileadmin/data/ZGF_ZGM_Gussteile/files/de/ZOLLERN-Broschuere_ZGF_Stahl-Legierungen_D.pdf). '+
    'Nur vergüteter Feinguss gemäß Hersteller; eine allgemeine DIN-Dickenfreigabe ist UNVERIFIED und wird nicht behauptet. Normausgabe und historische Warmwerte UNVERIFIED; keine Warmwerte in K. '+
    'Umschlüsselung: EBRO, Technisches Begleitheft, Abschnitt 6, Tabelle „Gußwerkstoffe“ ('+ebro+').');
  AD.materials.push(...entries);
})(globalThis.AD);
