/* Product-specific minimum strengths, MPa = N/mm²; temperature °C.
 * K is ReH/Rp0.2 for ferritic steels and Rp1.0 for austenitic steels,
 * never a permissible stress already divided by S. Only sourced points.
 * One explicitly bounded product section per grade; no plate-data reuse.
 */
(function(AD){
  'use strict';
  const f2='(Normtext, nicht verlinkt)';
  const f4='(Normtext, nicht verlinkt)';
  const f5='(Normtext, nicht verlinkt)';
  const cast='(Normtext, nicht verlinkt)';
  const bar='(Normtext, nicht verlinkt)';
  const bolt='(Normtext, nicht verlinkt)';
  const b0='(Normtext, nicht verlinkt)';
  const limit=' Tmax ist das Ende der hinterlegten K-Tabelle, keine Zeitstandfreigabe; gegebenenfalls zusätzlicher Nachweis nach AD B0 §5.2/S6. Kein werkstoffspezifischer E-Modul hinterlegt.';
  const boltNote=' A2-70/A4-70 sind Festigkeitsklassen für nichtrostende Verbindungselemente, keine EN-10269-Stahlsorten. Zuordnung und AD-K-Temperaturreihe UNVERIFIED; deshalb keine eigenen K-Einträge und keine Gleichsetzung mit lösungsgeglühten Stählen.';
  function add(grade,num,std,product,family,type,Rm,K,source,extra=''){
    AD.materials.push({
      id:grade+' | '+std+' | '+product,
      name:grade+' ('+num+') '+(family==='EN Schmiedestück'?'Schmiedestück':family==='EN Stahlguss'?'Stahlguss':'Stab/Schraube'),
      family,std,product,type,Rm,K,S:family==='EN Stahlguss'?2:1.5,
      Tmax:K[K.length-1][0],aliases:[num],
      note:'QUELLE: '+source+' '+extra+' S: AD 2000 B0 (11/2008), §7, Tafel 2, '+(family==='EN Stahlguss'?'Zeile 2 (Stahlguss), S = 2,0':'Zeile 1 (Walz-/Schmiedestahl), S = 1,5')+' ('+b0+').'+limit
    });
  }
  const forged='EN Schmiedestück', bars='EN Stab/Schraube';
  const forgeSource='EN 10222-2:2017+A1:2021, Tabelle 4 (ReH und Rm bei Raumtemperatur), Tabelle 5 (Rp0,2 bei erhöhter Temperatur) ('+f2+').';
  const section=' tR bezeichnet den maßgebenden wärmebehandelten Querschnitt, nicht die fertige Wanddicke; andere Querschnittsformen nach EN 10222-1 Anhang A. Bei Ersatz von ReH durch Rp0,2 ist die Fußnote der Tabelle 4 zu beachten.';
  add('P245GH','1.0352','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +N',forged,'ferritic',410,[[20,245],[100,195],[150,185],[200,175],[250,160],[300,145],[350,135],[400,125]],forgeSource,section);
  add('P280GH','1.0426','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +N',forged,'ferritic',460,[[20,280],[100,250],[150,235],[200,225],[250,205],[300,185],[350,170],[400,155]],forgeSource,section);
  add('P305GH','1.0436','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +N',forged,'ferritic',510,[[20,305],[100,270],[150,255],[200,240],[250,220],[300,200],[350,190],[400,165]],forgeSource,section);
  add('16Mo3','1.5415','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +N',forged,'ferritic',440,[[20,295],[100,264],[150,245],[200,225],[250,205],[300,180],[350,170],[400,160],[450,155],[500,150]],forgeSource,section);
  add('13CrMo4-5','1.7335','EN 10222-2:2017+A1:2021','tR ≤ 35 mm, +NT',forged,'ferritic',440,[[20,295],[100,260],[150,245],[200,240],[250,230],[300,215],[350,200],[400,190],[450,180],[500,175]],forgeSource,section);
  add('11CrMo9-10','1.7383','EN 10222-2:2017+A1:2021','tR ≤ 200 mm, +NT',forged,'ferritic',520,[[20,310],[100,265],[150,250],[200,235],[250,230],[300,220],[350,205],[400,195],[450,185],[500,175]],forgeSource,section);
  add('X10CrMoVNb9-1','1.4903','EN 10222-2:2017+A1:2021','tR ≤ 130 mm, +NT',forged,'ferritic',630,[[20,450],[100,410],[150,395],[200,380],[250,370],[300,360],[350,350],[400,340],[450,320],[500,300],[550,270],[600,215]],forgeSource,section);
  const fineSource='EN 10222-4:2017, Tabelle 4 (ReH, Rm), Tabelle 6 (Rp0,2) ('+f4+').';
  add('P285NH','1.0477','EN 10222-4:2017','tR ≤ 16 mm, +N',forged,'ferritic',390,[[20,285],[50,276],[100,259],[150,240],[200,221],[250,202],[300,166],[350,153],[400,144]],fineSource,section);
  add('P355QH1','1.0571','EN 10222-4:2017','70 < tR ≤ 100 mm, +QT',forged,'ferritic',470,[[20,315],[50,305],[100,287],[150,265],[200,244],[250,224],[300,206],[350,190],[400,179]],fineSource,section);
  const stainlessSource='EN 10222-5:2017, Tabelle 4 (Rp1,0 und Rm), Tabelle 6 (Rp1,0 bei erhöhter Temperatur) ('+f5+'). K = Rp1,0; keine Rp0,2-Werte eingesetzt.';
  add('1.4301','1.4301','EN 10222-5:2017','tR ≤ 250 mm, +AT',forged,'austenitic',500,[[20,230],[100,191],[150,172],[200,157],[250,145],[300,135],[350,129],[400,125],[500,120]],stainlessSource,section);
  add('1.4404','1.4404','EN 10222-5:2017','tR ≤ 250 mm, +AT',forged,'austenitic',490,[[20,225],[100,199],[150,181],[200,167],[250,157],[300,145],[350,139],[400,135],[500,128]],stainlessSource,section);
  add('1.4571','1.4571','EN 10222-5:2017','tR ≤ 450 mm, +AT',forged,'austenitic',510,[[20,245],[100,218],[150,206],[200,196],[250,186],[300,175],[350,169],[400,164],[500,158]],stainlessSource,section);
  const castSource='EN 10213:2007, Tabelle 3 (Raumtemperatur: Rp0,2 bzw. Rp1,0 und Rm), Tabelle 6 (erhöhte Temperatur; Verifikation bei Bestellung vereinbaren) ('+cast+').';
  function casting(g,n,p,rm,k,aust=false){add(g,n,'EN 10213:2007',p,'EN Stahlguss',aust?'austenitic':'cast',rm,k,castSource,aust?'Austenitischer Stahlguss: K = Rp1,0, Tabelle 6 einschließlich Fußnote a; keine Absenkung auf Rp0,2.':'Ferritischer Stahlguss: K = Rp0,2.');}
  casting('GP240GH','1.0619','t ≤ 100 mm, +N',420,[[20,240],[100,210],[200,175],[300,145],[350,135],[400,130],[450,125]]);
  casting('GP280GH','1.0625','t ≤ 100 mm, +N',480,[[20,280],[100,250],[200,220],[300,190],[350,170],[400,160],[450,150]]);
  casting('G20Mo5','1.5419','t ≤ 100 mm, +QT',440,[[20,245],[200,190],[300,165],[350,155],[400,150],[450,145],[500,135]]);
  casting('G17CrMo5-5','1.7357','t ≤ 100 mm, +QT',490,[[20,315],[200,250],[300,230],[350,215],[400,200],[450,190],[500,175],[550,160]]);
  casting('G17CrMo9-10','1.7379','t ≤ 150 mm, +QT',590,[[20,400],[200,355],[300,345],[350,330],[400,315],[450,305],[500,280],[550,240]]);
  casting('GX5CrNi19-10','1.4308','t ≤ 150 mm, +AT',440,[[20,200],[100,160],[200,125],[300,110]],true);
  casting('GX5CrNiMo19-11-2','1.4408','t ≤ 150 mm, +AT',440,[[20,210],[100,170],[200,135],[300,115],[400,105]],true);
  const barSource='EN 10273:2000 (historischer Quellenstand), Tabelle 4 (ReH, Rm), Tabelle 6 (Rp0,2 bei erhöhter Temperatur) ('+bar+').';
  const barNote=' Warmgewalzter Stab; K20 = ReH. Wenn ReH nicht ausgeprägt ist, fordert Tabelle 4 Fußnote 3 stattdessen einen um 10 N/mm² niedrigeren Rp0,2-Mindestwert; dann K20 entsprechend dem Zeugnis wählen.';
  function rolled(g,n,p,rm,k){add(g,n,'EN 10273:2000',p,bars,'ferritic',rm,k,barSource,barNote);}
  rolled('P235GH','1.0345','d/t ≤ 16 mm, +N',360,[[20,235],[50,206],[100,190],[150,180],[200,170],[250,150],[300,130],[350,120],[400,110]]);
  rolled('P250GH','1.0460','d/t ≤ 50 mm, +N',410,[[20,250],[50,242],[100,237],[150,216],[200,190],[250,170],[300,150],[350,130],[400,110],[450,90]]);
  rolled('P295GH','1.0481','d/t ≤ 16 mm, +N',460,[[20,295],[50,272],[100,250],[150,235],[200,225],[250,205],[300,185],[350,170],[400,155]]);
  rolled('P355GH','1.0473','d/t ≤ 16 mm, +N',510,[[20,355],[50,318],[100,290],[150,270],[200,255],[250,235],[300,215],[350,200],[400,180]]);
  rolled('16Mo3','1.5415','d/t ≤ 16 mm, +N',440,[[20,275],[200,215],[250,200],[300,170],[350,160],[400,150],[450,145],[500,140]]);
  rolled('13CrMo4-5','1.7335','d/t ≤ 16 mm, +NT',450,[[20,300],[200,230],[250,220],[300,205],[350,190],[400,180],[450,170],[500,165]]);
  const boltSource='EN 10269:2013, Tabelle 4 (Rp0,2, Rm), Tabelle 6 (Rp0,2 bei erhöhter Temperatur) ('+bolt+').';
  function bolting(g,n,p,rm,k){add(g,n,'EN 10269:2013',p,bars,'ferritic',rm,k,boltSource,'Ausgangsmaterial für Verbindungselemente; fertige Schraube zusätzlich nach AD W7 und einschlägiger Produktnorm prüfen.'+boltNote);}
  bolting('C35E','1.1181','d ≤ 60 mm, +QT',500,[[20,300],[100,270],[200,229],[300,192],[400,173]]);
  bolting('25CrMo4','1.7218','d ≤ 100 mm, +QT',600,[[20,440],[200,412],[250,392],[300,363],[350,333],[400,304],[450,275],[500,235]]);
  // Restrict to 60 mm: Table 4 extends to 65 mm, Table 6 only to 60 mm.
  bolting('42CrMo4','1.7225','d ≤ 60 mm, +QT',860,[[20,730],[100,702],[150,677],[200,640],[250,602],[300,562],[350,518],[400,475],[450,420],[500,375]]);
  bolting('21CrMoV5-7','1.7709','d ≤ 160 mm, +QT',700,[[20,550],[100,530],[200,500],[300,460],[400,410],[450,380],[500,350]]);
})(globalThis.AD);
