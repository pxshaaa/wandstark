/* Ergänzung EN-Bleche. Quellenstände bewusst historisch: EN 10028-2/-3:2003,
 * EN 10028-7:2007. K in N/mm²: ferritisch ReH/Rp0,2, austenitisch Rp1,0.
 * Nur belegte Tabellenpunkte, keine ergänzten Zwischenwerte oder Zeitstandwerte.
 */
(function(AD){
  'use strict';
  const en2='(Normtext, nicht verlinkt)';
  const en3='(Normtext, nicht verlinkt)';
  const en7='(Normtext, nicht verlinkt)';
  const temperatures=[20,50,100,150,200,250,300,350,400,450,500,550];
  const safety=' S = 1,5 für Walzstahl: AD 2000 B0 (11/2008), §7, Tafel 2, Zeile 1 ((Normtext, nicht verlinkt)).';
  const limit=' Tmax ist das Ende der K-Tabelle, keine Freigabe für Dauerbetrieb; Zeitstandnachweis nach AD 2000 B0 §5.2 / S6 gegebenenfalls zusätzlich erforderlich. Kein werkstoffspezifischer E-Modul hinterlegt.';
  function plate(grade,number,std,product,type,Rm,A,values,note,aliases=[]){
    const K=values.map((v,i)=>[temperatures[i],v]);
    return {id:grade+' | '+std+' | '+product,name:grade+' ('+number+') '+product,
      family:'EN Blech',std,product,type,Rm,A,S:1.5,aliases:[number,...aliases],
      K,Tmax:K[K.length-1][0],Emax:null,note:note+safety+limit};
  }
  function ferritic(grade,number,product,Rm,A,values,extra=''){
    return plate(grade,number,'EN 10028-2:2003',product,'ferritic',Rm,A,values,
      'SOURCE: EN 10028-2:2003, Tabelle 1 (Werkstoffnummer), Tabelle 3 (ReH bei 20 °C, Rm-Untergrenze, A quer und Lieferzustand), Tabelle 4 (Rp0,2 bei 50–500 °C, nur belegter Temperaturbereich), jeweils angegebene Dickenstufe ('+en2+'). '+extra);
  }
  AD.materials.push(
    ferritic('12CrMo9-10','1.7375','Blech t ≤ 250 mm, +NT oder +QT',540,18,
      [355,341,323,311,303,298,295,292,287,279]),
    ferritic('18MnMo4-5','1.5414','Blech t ≤ 60 mm, +NT',510,20,
      [345,330,320,315,310,295,285,265,235,215],
      'Tabelle 4, Fußnote e: Warmwerte beziehen sich auf ofennormalisierte Proben.'),
    ferritic('20MnMoNi4-5','1.6311','Blech t < 40 mm, +QT',590,18,
      [470,460,448,439,432,424,415,402,384],
      'Tabelle 4 druckt in der ersten Stufe „< 40“, Tabelle 3 „≤ 40“; deshalb konservativ t < 40 mm hinterlegt, Grenzfall 40 mm nicht zugeordnet.'),
    ferritic('15NiCuMoNb5-6-4','1.6368','Blech t < 40 mm, +NT',610,16,
      [460,447,429,415,403,391,380,366,351,331],
      'Tabelle 4 druckt in der ersten Stufe „< 40“, Tabelle 3 „≤ 40“; deshalb konservativ t < 40 mm hinterlegt, Grenzfall 40 mm nicht zugeordnet.'),
    ferritic('X12CrMo5','1.7362','Blech t ≤ 60 mm, +NT',510,20,
      [320,310,299,295,294,293,291,285,273,253,222])
  );
  // NL-Warmwerte dürfen ohne Bestellvereinbarung nicht als garantiert erscheinen.
  for(const [grade,number,ReH,Rm,A] of [
    ['P275NL1','1.0488',275,390,24],['P275NL2','1.1104',275,390,24],
    ['P460NL1','1.8915',460,570,17],['P460NL2','1.8918',460,570,17]
  ]) AD.materials.push(plate(grade,number,'EN 10028-3:2003','Blech t ≤ 16 mm, +N','ferritic',Rm,A,[ReH],
    'SOURCE: EN 10028-3:2003, Tabelle 4 (Werkstoffnummer, ReH, Rm-Untergrenze und A, erste Dickenstufe bis 16 mm), §8.4.2 und Tabelle 5 ('+en3+'). Warmwerte der entsprechenden NH-Sorte gelten für NL1/NL2 nur bei Vereinbarung bei Anfrage und Bestellung. Ohne diese Vereinbarung sind erhöhte Rp0,2-Werte UNVERIFIED und nicht in K hinterlegt; Tmax = 20 °C.'));

  for(const [number,designation,Rm,A,values] of [
    ['1.4401','X5CrNiMo17-12-2',520,45,[260,242,211,191,177,167,156,150,144,141,139,137]],
    ['1.4550','X6CrNiNb18-10',500,40,[240,229,211,196,186,177,167,161,156,152,149,147]],
    ['1.4432','X2CrNiMo17-12-3',520,45,[260,237,199,181,167,157,145,139,135,130,128,127]],
    ['1.4429','X2CrNiMoN17-13-3',580,40,[320,292,246,218,198,183,175,169,164,160,158,157]],
    ['1.4547','X1CrNiMoCuN20-18-7',650,40,[340,314,270,245,225,212,200,195,190,184,180]]
  ]) AD.materials.push(plate(number,number,'EN 10028-7:2007','Warmgewalztes Blech 3 ≤ t ≤ 75 mm, +AT','austenitic',Rm,A,values,
    'SOURCE: '+designation+': EN 10028-7:2007, Tabelle 9, Erzeugnisform P, lösungsgeglüht (Rp1,0 bei 20 °C, Rm-Untergrenze, A quer für proportionale Probe ab 3 mm, maximale Dicke 75 mm); Tabelle 13, rechter Block Rp1,0 (Warmwerte, 50 °C einschließlich des ausdrücklich tabellierten interpolierten Normwertes nach Fußnote a) ('+en7+'). K = Rp1,0 gemäß AD 2000 B0 §6.1 in Verbindung mit W2; keine Übernahme der linken Rp0,2-Spalten. Bei 1.4547 endet die belegte Rp1,0-Reihe bei 500 °C.',[designation]));
})(globalThis.AD);
