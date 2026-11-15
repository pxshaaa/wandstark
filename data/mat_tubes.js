/* Rohrkennwerte: °C, N/mm², mm. Historische Normausgaben ausdrücklich genannt.
 * Nur tabellierte Mindestwerte; Tmax ist kein Zeitstands-/Einsatzgrenzwert.
 * Keine Übertragung von Blechkennwerten oder von nahtlos auf geschweißt.
 */
(function(AD){
  'use strict';
  const sources = {
    en2:'(Normtext, nicht verlinkt)',
    en3:'(Normtext, nicht verlinkt)',
    en4:'(Normtext, nicht verlinkt)',
    en5:'(Normtext, nicht verlinkt)',
    w2:'(Normtext, nicht verlinkt)',
    w7:'(Normtext, nicht verlinkt)'
  };
  const safety = ' S = 1,5: AD 2000 B0 (11/2008), §7, Tafel 2, Walzstahl ((Normtext, nicht verlinkt)). Schweißnahtfaktor v ist gesondert anzusetzen.';
  const limit = ' Tmax ist nur das Ende der K-Tabelle; im Zeitstandsbereich zusätzlicher Nachweis nach AD 2000 B0 §5.2 / S6 erforderlich. Kein werkstoffspezifischer E-Modul hinterlegt.';
  const entries = [];
  function add(grade, number, std, product, type, K, Rm, note){
    entries.push({id:grade+' | '+std.split(':')[0]+' | '+product,
      name:grade+(grade===number?'':' ('+number+')')+' Rohr', family:'EN Rohr', std, product,
      type, K, Rm, S:1.5, aliases:[number], Tmax:K[K.length-1][0], note:note+safety+limit});
  }
  const temperatures = [100,150,200,250,300,350,400,450,500,550,600];
  // EN 10216-2:2002, Tabelle 4: Raumtemperatur nach Wanddicke;
  // Tabelle 5 nennt ausdrücklich eine gemeinsame Warmstreckgrenzenreihe bis 60 mm.
  const seamless = [
    ['P195GH','1.0348',[195],320,[175,165,150,130,113,102,94]],
    ['P235GH','1.0345',[235,225,215],360,[198,187,170,150,132,120,112,108]],
    ['P265GH','1.0425',[265,255,245],410,[226,213,192,171,154,141,134,128]],
    ['20MnNb6','1.0471',[355,345,335],500,[312,292,264,241,219,200,186,174]],
    ['16Mo3','1.5415',[280,270,260],450,[243,237,224,205,173,159,156,150,146]],
    ['13CrMo4-5','1.7335',[290,290,280],440,[264,253,245,236,192,182,174,168,166]],
    ['10CrMo9-10','1.7380',[280,280,270],480,[249,241,234,224,219,212,207,193,180]],
    ['14MoV6-3','1.7715',[320,320,310],460,[282,276,267,241,225,216,209,203,200,197]]
  ];
  const bands = ['t ≤ 16 mm','16 < t ≤ 40 mm','40 < t ≤ 60 mm'];
  for(const [g,n,room,rm,hot] of seamless) room.forEach((k,i)=>add(g,n,'EN 10216-2:2002',
    'Nahtloses Rohr, '+bands[i],'ferritic',[[20,k],...hot.map((v,j)=>[temperatures[j],v])],rm,
    'QUELLE: EN 10216-2:2002, Tabelle 4 (ReH/Rp0,2 und Rm bei 20 °C), Tabelle 5 (Rp0,2 bei erhöhter Temperatur, '+(g==='P195GH'?'t ≤ 16':'t ≤ 60')+' mm): '+sources.en2+'. Warmzugprüfung nach §8.3.2 / Option 6 vereinbaren.'));
  add('X10CrMoVNb9-1','1.4903','EN 10216-2:2002','Nahtloses Rohr, t ≤ 100 mm','ferritic',
    [[20,450],...[410,395,380,370,360,350,340,320,300,270,215].map((v,i)=>[temperatures[i],v])],630,
    'QUELLE: EN 10216-2:2002, Tabellen 4 und 5, t ≤ 100 mm: '+sources.en2+'.');
  add('X20CrMoV11-1','1.4922','EN 10216-2:2002','Nahtloses Rohr, t ≤ 100 mm','ferritic',
    [[20,490],...[430,415,390,380,360,330,290,250].map((v,i)=>[200+50*i,v])],690,
    'QUELLE: EN 10216-2:2002, Tabellen 4 und 5, t ≤ 100 mm: '+sources.en2+'. Tabelle 5 enthält keine Werte bei 100/150/600 °C; keine zusätzlichen Stützstellen.');

  // Grundreihe N: keine Warmkennwerte der NH-/NL-Reihe unterstellen.
  const grainBands=['t ≤ 12 mm','12 < t ≤ 20 mm','20 < t ≤ 40 mm','40 < t ≤ 50 mm','50 < t ≤ 65 mm','65 < t ≤ 80 mm','80 < t ≤ 100 mm'];
  for(const [g,n,ks,rms] of [
    ['P355N','1.0562',[355,355,345,335,325,315,305],[490,490,490,490,490,450,450]],
    ['P460N','1.8905',[460,450,440,425,410,400,390],[560,560,560,560,560,490,490]]
  ]) ks.forEach((k,i)=>add(g,n,'EN 10216-3:2002','Nahtloses Rohr, '+grainBands[i]+', +N','ferritic',[[20,k]],rms[i],
    'QUELLE: EN 10216-3:2002, Tabelle 4, ReH/Rp0,2 und Rm: '+sources.en3+'. Nur 20 °C; §8.3.2 und Tabellen 5/6 behandeln NH/QH sowie bedingt NL/QL, nicht die Grundreihe N. Warmkennwerte für diese N-Sorte UNVERIFIED und nicht in K enthalten.'));

  for(const [g,n,band,k,rm] of [
    ['P215NL','1.0451','t ≤ 10 mm',215,360],
    ['P265NL','1.0453','t ≤ 25 mm',265,410],
    ['26CrMo4-2','1.7219','t ≤ 40 mm',440,560]
  ]) add(g,n,'EN 10216-4:2002','Nahtloses Rohr, '+band,'ferritic',[[20,k]],rm,
    'QUELLE: EN 10216-4:2002, Tabelle 4 einschließlich Fußnoten b/c (Dickenbegrenzungen), ReH/Rp0,2 und Rm bei Raumtemperatur: '+sources.en4+'. Nur 20 °C; erhöhte Temperaturkennwerte UNVERIFIED und nicht in K enthalten.');

  // EN 10216-5:2004, Tabelle 6 / Tabelle 9 (Rp1,0, rechte Tabellenhälfte).
  const stainless = [
    ['1.4301','+AT',230,500,[218,190,170,155,145,135,129,125,122,120,120]],
    ['1.4307','+AT',215,460,[200,180,160,145,135,127,121,116,112,109,108]],
    ['1.4404','+AT',225,490,[217,200,180,165,153,145,139,135,130,128,127]],
    ['1.4541','kalt gefertigt, +AT',235,500,[222,208,195,185,175,167,161,156,152,149,147]],
    ['1.4541','warm gefertigt, +AT',215,460,[201,181,162,147,137,127,121,116,112,109,108]],
    ['1.4571','kalt gefertigt, +AT',245,500,[234,208,195,185,175,167,161,156,152,149,147]],
    ['1.4571','warm gefertigt, +AT',225,490,[201,181,162,147,137,127,121,116,112,109,108]]
  ];
  for(const [g,finish,k,rm,hot] of stainless) add(g,g,'EN 10216-5:2004',
    'Nahtloses Rohr, t ≤ 60 mm, '+finish,'austenitic',[[20,k],...hot.map((v,i)=>[50+50*i,v])],rm,
    'QUELLE: EN 10216-5:2004, Tabelle 6 (Rp1,0 und Rm bei 20 °C), Tabelle 9 (Rp1,0 bei 50–550 °C), t ≤ 60 mm, '+finish+': '+sources.en5+'. Lösungsgeglüht; Warmzugprüfung nach Option 9. K = Rp1,0; keine Übernahme aus EN 10028-7.');

  for(const [g,n,room,rm,hot] of seamless.filter(r=>['P195GH','P235GH','P265GH','16Mo3'].includes(r[0])))
    add(g,n,'EN 10217-2:2019','HFW-Rohr, t ≤ 16 mm','ferritic',
      [[20,room[0]],...hot.slice(0,7).map((v,i)=>[temperatures[i],v])],rm,
      'QUELLE: EN 10217-2:2019, Tabelle 4 (ReH/Rp0,2 und Rm), Tabelle 5 (Rp0,2, 100–400 °C), t ≤ 16 mm: '+sources.w2+'. Die vier Reihen wurden getrennt gegen diese Schweißrohrnorm geprüft. Warmzugprüfung nach Option 6.');

  for(const [g,k,rm,hot] of [
    ['1.4301',230,500,[218,191,172,157,145,135,129,125,122,120,120]],
    ['1.4404',225,490,[217,199,181,167,157,145,139,135,130,128,127]]
  ]) add(g,g,'EN 10217-7:2005','Geschweißtes Rohr, t ≤ 60 mm, +AT','austenitic',
    [[20,k],...hot.map((v,i)=>[50+50*i,v])],rm,
    'QUELLE: EN 10217-7:2005, Tabelle 6 (Rp1,0 und Rm bei 20 °C), Tabelle 8 (Rp1,0 bei 50–550 °C), t ≤ 60 mm, lösungsgeglüht: '+sources.w7+'. Warmzugprüfung nach Option 11.');
  AD.materials.push(...entries);
})(globalThis.AD);
