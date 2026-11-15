/* PDF calculation report: jsPDF + AutoTable (lazy-loaded from cdnjs), saved through the `downloads` capability. */
(function(AD){
const $=id=>document.getElementById(id);
const LIBS=window.AD_LIBS||['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'];
const loadScript=src=>new Promise((ok,fail)=>{ if([...document.scripts].some(s=>s.src===src)) return ok();
  const s=document.createElement('script'); s.src=src; s.onload=()=>ok(); s.onerror=()=>{s.remove();fail(new Error('Bibliothek nicht ladbar'));}; document.head.appendChild(s); });
let libs=null; const ensureLibs=()=>libs||(libs=LIBS.reduce((p,u)=>p.then(()=>loadScript(u)),Promise.resolve()).catch(e=>{libs=null;throw e;}));

// Standard PDF fonts are WinAnsi only: map the symbols the modules use.
const MAP={'≤':'<=','≥':'>=','√':'sqrt','β':'beta','σ':'sigma','φ':'phi','ν':'nu','λ':'lambda','ε':'eps','τ':'tau','η':'eta','θ':'theta','Δ':'Delta','δ':'delta',
  'π':'pi','α':'alpha','γ':'gamma','ψ':'psi','ω':'omega','Ω':'Omega','′':"'",'″':'"','∞':'unendlich','→':'->','←':'<-','↔':'<->','≈':'~','≠':'!=','−':'-','∑':'Summe','Σ':'Summe','µ':'µ',
  '⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9','⁰':'^0','¹':'^1','₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','ᵢ':'i','ₘ':'m',
  '·':'·','„':'"','“':'"','”':'"','‚':"'",'‘':"'",'’':"'",'✓':'OK','✗':'x','∅':'D','⌀':'D','µ':'µ'};
const pt=s=>String(s==null?'':s).replace(/[^\x00-\xFF€–—…‰]/g,c=>MAP[c]!=null?MAP[c]:'?');

const INK=[22,32,42], MUTED=[93,106,117], ACC=[29,91,134], OK=[27,117,72], BAD=[176,52,42], WARN=[143,98,0], LINE=[219,225,229];
const SVGCSS=`.frame{fill:none;stroke:#6b7782;stroke-width:.5}.frame2{fill:#fff}.o{fill:none;stroke:#1b2630;stroke-width:1.5;stroke-linejoin:round}
.t{fill:none;stroke:#6b7782;stroke-width:.6}.c{fill:none;stroke:#6b7782;stroke-width:.6;stroke-dasharray:14 3 2 3}.h{fill:none;stroke:#6b7782;stroke-width:.8;stroke-dasharray:5 3}
.d{fill:none;stroke:#1d5b86;stroke-width:.6}.ar{fill:#1d5b86}.hl{stroke:#9aa6b0;stroke-width:.8}.cut{fill:url(#tzh)}.cut2{fill:url(#tzh2)}
text,.tx{fill:#1b2630;font-size:10px;font-family:Helvetica,Arial,sans-serif}.dt{fill:#1d5b86;font-size:9.5px}.tb1{font-size:10px;font-weight:600}.tb2{font-size:8.5px;fill:#6b7782}
.ok{stroke:#1b7548}.bad{stroke:#b0342a}`;
const TOK={'--paper':'#ffffff','--ink':'#1b2630','--ink2':'#6b7782','--hatch':'#9aa6b0','--dimc':'#1d5b86','--ok':'#1b7548','--bad':'#b0342a','--warn':'#8f6200',
  '--accent':'#1d5b86','--fg':'#16202a','--muted':'#5d6a75','--line':'#dbe1e5','--panel':'#ffffff','--bg':'#f2f4f5','--field':'#f7f9fa','--ok-soft':'#e0f1e7','--bad-soft':'#f8e3e0',
  '--warn-soft':'#f6eed7','--accent-soft':'#e2edf5'};
function svgToPng(svg){
  return new Promise(res=>{
    if(!svg) return res(null);
    const vb=(svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)||[]).slice(1).map(Number); const w=vb[0]||420,h=vb[1]||280, k=2.2;
    let s=svg.replace(/var\((--[a-z0-9-]+)\)/gi,(m,t)=>TOK[t]||'#1b2630')
      .replace('<svg ',`<svg width="${w*k}" height="${h*k}" `).replace(/<defs>/,`<defs><style>${SVGCSS}</style>`);
    if(!/xmlns=/.test(s)) s=s.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
    const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); c.width=w*k; c.height=h*k; const x=c.getContext('2d');
      x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0); try{res({url:c.toDataURL('image/png'),w,h});}catch(e){res(null);} };
    img.onerror=()=>res(null); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
  });
}
const fmtDate=d=>d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});

// ext: {doc, part, noFooter} – append to an existing document (vessel report) instead of creating one
async function buildPdf(d, ext={}){
  await ensureLibs();
  const {jsPDF}=window.jspdf, doc=ext.doc||new jsPDF({unit:'mm',format:'a4'}), W=210, M=16, r=d.result, H=AD.h;
  if(ext.doc) doc.addPage();
  let y=0;
  const head=()=>{ doc.setFillColor(...ACC); doc.rect(0,0,W,11,'F'); doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('AD 2000 Rechner · Berechnungsbericht',M,7.2); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.text(pt(`${d.module.name} · ${d.module.code}`),W-M,7.2,{align:'right'}); doc.setTextColor(...INK); };
  const need=h=>{ if(y+h>282){ const f=doc.getFont(), fs=doc.getFontSize(); doc.addPage(); head(); doc.setFont(f.fontName,f.fontStyle); doc.setFontSize(fs); doc.setTextColor(...INK); y=20; } };
  const h2=t=>{ need(14); doc.setFont('helvetica','bold'); doc.setFontSize(11.5); doc.setTextColor(...ACC); doc.text(pt(t),M,y); y+=1.8;
    doc.setDrawColor(...ACC); doc.setLineWidth(.3); doc.line(M,y,W-M,y); y+=5; doc.setTextColor(...INK); doc.setFont('helvetica','normal'); doc.setFontSize(9.5); };
  const table=(rows,opt={})=>{ doc.autoTable({startY:y,margin:{left:M,right:M,top:20},theme:'plain',head:opt.head?[opt.head.map(pt)]:undefined,
      body:rows.map(rw=>rw.map(c=>pt(typeof c==='number'?H.n(c):c))),styles:{font:'helvetica',fontSize:9,cellPadding:{top:1.4,bottom:1.4,left:2,right:2},textColor:INK,lineColor:LINE,lineWidth:{bottom:.2}},
      headStyles:{fontStyle:'bold',textColor:MUTED,fontSize:8.2},columnStyles:opt.cols||{0:{cellWidth:72},1:{textColor:ACC,font:'courier',cellWidth:30},2:{halign:'right',font:'courier',cellWidth:54},3:{textColor:MUTED,cellWidth:22}},
      didParseCell:c=>{ if(c.section==='body'&&c.column.index===2&&!opt.cols&&String(c.cell.raw||'').length>22){ c.cell.styles.font='helvetica'; c.cell.styles.fontSize=8.6; }
        if(c.section==='head'){ const cs=(opt.cols||{1:{},2:{halign:'right'}})[c.column.index]; if(cs&&cs.halign) c.cell.styles.halign=cs.halign; } },
      didDrawPage:()=>{head();}}); y=doc.lastAutoTable.finalY+6; };

  // title block
  head(); y=24;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text(pt(ext.part||'Berechnungsbericht'),M,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(...MUTED); doc.text(pt(`${d.module.name} nach ${d.module.code}`),M,y); doc.setTextColor(...INK); y+=7;
  table([['Projekt','',d.project||'—',''],['Datum','',fmtDate(d.date),''],['Bauteil / Regelwerk','',`${d.module.name} · ${d.module.code} (${d.module.group})`,''],
         ['Status der Software','','Prototyp, nicht gegen DIMy validiert',''] ],{cols:{0:{textColor:MUTED,cellWidth:48},2:{halign:'left'}}});
  // status box
  need(26); const ok=r.ok, col=ok?OK:BAD;
  doc.setFillColor(...(ok?[224,241,231]:[248,227,224])); doc.setDrawColor(...col); doc.setLineWidth(.4); doc.roundedRect(M,y,W-2*M,22,2,2,'FD');
  doc.setTextColor(...col); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text(ok?'NACHWEIS ERFÜLLT':'NACHWEIS NICHT ERFÜLLT',M+5,y+8);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...INK);
  const hl=r.headline||{}; const main=hl.text!=null?hl.text:`${H.fmt(hl.value)} ${hl.unit||''}`;
  const lbl=String(hl.label||''), unit=String(hl.unit||'').trim(), lbl2=unit&&lbl.startsWith(unit)?lbl.slice(unit.length).trim():lbl;
  doc.text(pt(`${main} ${lbl2}${hl.of?' · '+hl.of:''}`),M+5,y+14.5);
  const st=[]; if(!r.noUtil&&Number.isFinite(r.util)) st.push(`Ausnutzung ${H.fmt(r.util*100,2)} %`); if(Number.isFinite(r.pmax)) st.push(`zulässiger Druck ${H.fmt(r.pmax,2)} bar`);
  if(r.test&&Number.isFinite(r.test.PT)) st.push(`Prüfdruck ${H.fmt(r.test.PT,2)} bar (${r.test.ok===true?'erfüllt':r.test.ok===false?'nicht erfüllt':'nicht geprüft'})`);
  (r.stats||[]).forEach(s=>st.push(`${s[1]} ${s[0]}`));
  doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(pt(st.join('   ·   ')),M+5,y+19.5); doc.setTextColor(...INK); y+=29;

  h2('1  Eingaben');
  table([['Betrieb','','',''],...d.shared],{head:['Größe','Symbol','Wert','Einheit']});
  table([['Werkstoff','','',''],...d.material,['Faktoren und Zuschläge','','',''],...d.factors]);
  table([[`Bauteil: ${d.module.name}`,'','',''],...d.fields]);

  const png=await svgToPng(d.svg);
  if(png){ const iw=W-2*M, ih=iw*png.h/png.w; need(ih+22); h2('2  Schematische Darstellung'); doc.addImage(png.url,'PNG',M,y,iw,ih,undefined,'FAST'); y+=ih+3;
    doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(pt('Nicht maßstäblich; Maße in mm.'),M,y+2); doc.setTextColor(...INK); y+=8; }

  h2((png?'3':'2')+'  Rechengang');
  doc.setFont('courier','normal'); doc.setFontSize(8.6);
  String(r.formula||'').split('\n').forEach(line=>{ doc.splitTextToSize(pt(line)||' ',W-2*M).forEach(l=>{ need(4.2); doc.text(l,M,y); y+=4.1; }); });
  y+=4; doc.setFont('helvetica','normal');

  h2((png?'4':'3')+'  Zwischenwerte');
  table((r.rows||[]).map(([l,s,v,u])=>[l,s,v,u]),{head:['Größe','Symbol','Wert','Einheit']});

  if(r.test){ h2((png?'5':'4')+'  Prüfzustand');
    table([['Prüfdruck','PT',r.test.PT,'bar'],['Erforderlich im Prüfzustand','',Number.isFinite(r.test.req)?r.test.req:'—',r.test.unit||'mm'],['Vorhanden','',Number.isFinite(r.test.have)?r.test.have:'—',r.test.unit||'mm'],
      ['Ergebnis','',r.test.ok===true?'erfüllt':r.test.ok===false?'nicht erfüllt':'nicht geprüft','']]);
    if(r.test.note){ doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.splitTextToSize(pt(r.test.note),W-2*M).forEach(l=>{need(4);doc.text(l,M,y);y+=4;}); doc.setTextColor(...INK); y+=3; } }

  h2('Hinweise und Auswertung');
  const notes=r.notes||[], er=notes.filter(n=>n[0]==='e'), wa=notes.filter(n=>n[0]==='w'), inf=notes.filter(n=>!n[0]);
  doc.setFontSize(9.8);
  const para=(t,c=INK,bold=false)=>{ doc.setTextColor(...c); doc.setFont('helvetica',bold?'bold':'normal'); doc.splitTextToSize(pt(t),W-2*M).forEach(l=>{need(4.8);doc.text(l,M,y);y+=4.7;}); y+=1.5; doc.setTextColor(...INK); doc.setFont('helvetica','normal'); };
  para(ok?`Mit den eingegebenen Werten ist der Nachweis für ${d.module.name} nach ${d.module.code} erfüllt`+(!r.noUtil&&Number.isFinite(r.util)?` (Ausnutzung ${H.fmt(r.util*100,2)} %).`:'.')
         :`Der Nachweis für ${d.module.name} nach ${d.module.code} ist mit den eingegebenen Werten NICHT erfüllt. Maßgebend sind die unten aufgeführten Fehler und offenen Nachweise.`,ok?OK:BAD,true);
  const list=(title,arr,c)=>{ if(!arr.length) return; need(8); doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...c); doc.text(pt(`${title} (${arr.length})`),M,y); y+=5;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    arr.forEach(n=>{ const ls=doc.splitTextToSize(pt(n[1]),W-2*M-5); need(ls.length*4.3+1); doc.setFillColor(...c); doc.circle(M+1.3,y-1.2,.8,'F'); ls.forEach(l=>{doc.text(l,M+5,y);y+=4.3;}); y+=1; }); y+=2; };
  list('Fehler',er,BAD); list('Warnungen und Einschränkungen',wa,WARN); list('Hinweise',inf,MUTED);
  if(d.help) list('Anwendungsbereich des Moduls',[['',d.help]],MUTED);
  para('Dieser Bericht wurde mit einem Prototyp erstellt. Die Rechenmodule sind nicht gegen DIMy oder andere zugelassene Software validiert. '+
       'Werkstoffkennwerte, Beiwerte und Geltungsgrenzen sind vor Verwendung anhand der gültigen Ausgaben der Regelwerke zu prüfen. '+
       'Der Bericht ersetzt keine Prüfung durch eine zugelassene Überwachungsstelle.',MUTED);

  if(ext.noFooter) return doc;
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){ doc.setPage(i); doc.setFontSize(7.8); doc.setTextColor(...MUTED); doc.setDrawColor(...LINE); doc.setLineWidth(.2); doc.line(M,287,W-M,287);
    doc.text(pt(`${d.project?d.project+' · ':''}${d.module.code} · ${fmtDate(d.date)}`),M,291); doc.text(`Seite ${i} von ${n}`,W-M,291,{align:'right'}); }
  return doc;
}

const msg=t=>{ const el=$('pdfMsg'); if(el) el.textContent=t; };
const safe=s=>String(s).replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ß/g,'ss').normalize('NFKD').replace(/[^\w.\- ]+/g,'').trim().replace(/\s+/g,'_').slice(0,60);
async function savePdf(doc,name){
  const blob=doc.output('blob'), inClaude=!!(window.claude&&window.claude.use), dl=inClaude?await window.claude.use('downloads'):null;
  if(!dl){ if(inClaude) return 'PDF-Speichern ist in dieser Ansicht nicht verfügbar.';
    const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000); return `„${name}“ heruntergeladen.`; }
  try{ await dl.save({filename:name,data:blob}); return `„${name}“ gespeichert.`; }
  catch(e){ return e&&e.code==='declined'?'Speichern abgebrochen.':e&&e.code==='rate_limited'?'Ein Speichern-Dialog ist schon offen. Bitte kurz warten.':'Speichern nicht möglich: '+((e&&e.message)||'unbekannter Fehler'); }
}
// Vessel (Gesamtbehälter) report: cover with overview + one full section per component
async function buildVesselPdf(v, ds){
  if(!Array.isArray(ds)||!ds.length||ds.some(d=>!d||!d.result))throw new Error('Keine gültigen Bauteil-Ergebnisse für den Gesamtbericht.');
  await ensureLibs();
  const {jsPDF}=window.jspdf, doc=new jsPDF({unit:'mm',format:'a4'}), W=210, M=16, H=AD.h, now=new Date();
  doc.setFillColor(...ACC); doc.rect(0,0,W,11,'F'); doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text('Wandstark · Gesamtbericht Behälter',M,7.2); doc.setTextColor(...INK);
  let y=24; doc.setFontSize(18); doc.text(pt(v.name||'Behälter'),M,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(...MUTED); doc.text(pt(`${ds.length} Bauteile · ${fmtDate(now)}`),M,y); doc.setTextColor(...INK); y+=8;
  const okAll=ds.every(d=>d.result.ok), worst=ds.reduce((a,d)=>(!a||((d.result.util||0)>(a.result.util||0)))?d:a,null), col=okAll?OK:BAD;
  doc.setFillColor(...(okAll?[224,241,231]:[248,227,224])); doc.setDrawColor(...col); doc.setLineWidth(.4); doc.roundedRect(M,y,W-2*M,20,2,2,'FD');
  doc.setTextColor(...col); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text(okAll?'ALLE NACHWEISE ERFÜLLT':`${ds.filter(d=>!d.result.ok).length} VON ${ds.length} NACHWEISEN NICHT ERFÜLLT`,M+5,y+8);
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
  if(worst&&Number.isFinite(worst.result.util)) doc.text(pt(`Maßgebend: ${worst.part} (${worst.module.code}) mit ${H.fmt(worst.result.util*100,2)} % Ausnutzung`),M+5,y+15);
  y+=27;
  const sh=ds[0]?ds[0].shared:[];
  doc.autoTable({startY:y,margin:{left:M,right:M,top:20},theme:'plain',head:[['Bauteil','Regelwerk','Ergebnis','Ausnutzung','Status'].map(pt)],
    body:ds.map(d=>{const r=d.result,hl=r.headline||{};return [d.part,`${d.module.name} · ${d.module.code}`,hl.text!=null?hl.text:`${H.fmt(hl.value)} ${hl.unit||''}`,r.noUtil||!Number.isFinite(r.util)?'–':H.fmt(r.util*100,2)+' %',r.ok?'erfüllt':'nicht erfüllt'].map(pt);}),
    styles:{font:'helvetica',fontSize:9,cellPadding:{top:1.6,bottom:1.6,left:2,right:2},textColor:INK,lineColor:LINE,lineWidth:{bottom:.2}},headStyles:{fontStyle:'bold',textColor:MUTED,fontSize:8.2},
    columnStyles:{2:{font:'courier'},3:{halign:'right',font:'courier'}},
    didParseCell:c=>{ if(c.section==='body'&&c.column.index===4) c.cell.styles.textColor=c.cell.raw==='erfüllt'?OK:BAD; if(c.section==='head'&&c.column.index===3) c.cell.styles.halign='right'; }});
  y=doc.lastAutoTable.finalY+8; doc.setFontSize(8.6); doc.setTextColor(...MUTED);
  doc.splitTextToSize(pt('Jedes Bauteil wird mit seinen eigenen Eingaben (Werkstoff, Maße, Faktoren) auf den folgenden Seiten vollständig nachgewiesen. Prototyp, nicht gegen DIMy validiert; ersetzt keine Prüfung durch eine zugelassene Überwachungsstelle.'),W-2*M).forEach(l=>{doc.text(l,M,y);y+=4.2;});
  for(let i=0;i<ds.length;i++) await buildPdf(ds[i],{doc,part:`Bauteil ${i+1}: ${ds[i].part}`,noFooter:true});
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){ doc.setPage(i); doc.setFontSize(7.8); doc.setTextColor(...MUTED); doc.setDrawColor(...LINE); doc.setLineWidth(.2); doc.line(M,287,W-M,287);
    doc.text(pt(`${v.name||'Behälter'} · Gesamtbericht · ${fmtDate(now)}`),M,291); doc.text(`Seite ${i} von ${n}`,W-M,291,{align:'right'}); }
  return doc;
}
// ---- PDF preview (pdf.js renders the real PDF pages to canvases) ----
const PDFJS=window.AD_PDFJS||['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
let pdfjsP=null;
const ensurePdfjs=()=>pdfjsP||(pdfjsP=loadScript(PDFJS[0]).then(()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS[1]; return window.pdfjsLib; }).catch(e=>{pdfjsP=null;throw e;}));
let previewSeq=0, pv={doc:null,name:'',back:null};
function closePreview(){ previewSeq++; $('pvw').hidden=true; $('pvPages').innerHTML=''; document.body.classList.remove('pvopen'); if(pv.back) pv.back.focus(); pv={doc:null,name:'',back:null}; }
async function previewDoc(doc,name,title,setMsg){
  const seq=++previewSeq;
  pv={doc,name,back:document.activeElement};
  $('pvTitle').textContent=title; $('pvInfo').textContent='Vorschau wird erstellt …'; $('pvPages').innerHTML=''; $('pvw').hidden=false; document.body.classList.add('pvopen'); $('pvClose').focus();
  try{ const lib=await ensurePdfjs(), pdf=await lib.getDocument({data:doc.output('arraybuffer')}).promise;
    if(seq!==previewSeq)return;
    $('pvInfo').textContent=`${pdf.numPages} Seite${pdf.numPages===1?'':'n'}`;
    const wrap=$('pvPages'), cw=Math.min(wrap.clientWidth-24, 900), dpr=Math.min(2,window.devicePixelRatio||1);
    for(let i=1;i<=pdf.numPages;i++){ const page=await pdf.getPage(i), v0=page.getViewport({scale:1}), sc=cw/v0.width, vp=page.getViewport({scale:sc*dpr});
      if(seq!==previewSeq)return;
      const c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; c.style.width=(vp.width/dpr)+'px'; c.style.height=(vp.height/dpr)+'px'; c.setAttribute('aria-label',`Seite ${i}`);
      wrap.appendChild(c); await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise; }
  }catch(e){ if(seq!==previewSeq)return; $('pvInfo').textContent='Vorschau nicht möglich: '+e.message+' – „Herunterladen“ funktioniert trotzdem.'; }
}
$('pvClose').addEventListener('click',closePreview);
$('pvw').addEventListener('keydown',e=>{ if(e.key==='Escape') closePreview(); });
$('pvDl').addEventListener('click',async()=>{ if(!pv.doc) return; $('pvInfo').textContent=await savePdf(pv.doc,pv.name); });
async function previewVessel(v,ds,setMsg){ try{ const doc=await buildVesselPdf(v,ds); await previewDoc(doc,`Behaelter_${safe(v.name||'Gesamtbericht')}_${new Date().toISOString().slice(0,10)}.pdf`,`Gesamtbericht ${v.name||''}`.trim(),setMsg); }catch(e){ setMsg('Vorschau nicht möglich: '+e.message); } }
async function exportVesselPdf(v, ds, setMsg){
  try{ const doc=await buildVesselPdf(v,ds); setMsg(await savePdf(doc,`Behaelter_${safe(v.name||'Gesamtbericht')}_${new Date().toISOString().slice(0,10)}.pdf`)); }
  catch(e){ setMsg('Gesamtbericht konnte nicht erstellt werden: '+e.message); }
}
async function exportPdf(){
  const d=window.ADui&&window.ADui.reportData(); if(!d){ msg('Bitte zuerst gültige Eingaben machen – ohne Ergebnis kein Bericht.'); return; }
  const btn=$('pdfBtn'); btn.disabled=true; btn.textContent='PDF wird erstellt …';
  try{
    const inClaude=!!(window.claude&&window.claude.use);
    const dl=inClaude?await window.claude.use('downloads'):null;
    const doc=await buildPdf(d), blob=doc.output('blob');
    const dt=d.date.toISOString().slice(0,10), name=`Berechnung_${safe(d.module.code)}_${safe(d.project||d.module.name)}_${dt}.pdf`;
    if(!dl){
      if(inClaude){ msg('PDF-Speichern ist in dieser Ansicht nicht verfügbar.'); return; }
      // Standalone web app: ordinary browser download.
      const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000); msg(`„${name}“ heruntergeladen.`); return;
    }
    try{ await dl.save({filename:name,data:blob}); msg(`„${name}“ gespeichert.`); }
    catch(e){ msg(e&&e.code==='declined'?'Speichern abgebrochen.':e&&e.code==='rate_limited'?'Ein Speichern-Dialog ist schon offen. Bitte kurz warten.':'Speichern nicht möglich: '+((e&&e.message)||'unbekannter Fehler')); }
  }catch(e){ msg('PDF konnte nicht erstellt werden: '+e.message); }
  finally{ btn.disabled=false; btn.textContent='PDF-Bericht herunterladen'; }
}
$('pdfBtn').addEventListener('click',exportPdf);
$('pdfPrev').addEventListener('click',async()=>{ const d=window.ADui&&window.ADui.reportData(); if(!d){ msg('Bitte zuerst gültige Eingaben machen – ohne Ergebnis kein Bericht.'); return; }
  try{ const doc=await buildPdf(d), dt=d.date.toISOString().slice(0,10); await previewDoc(doc,`Berechnung_${safe(d.module.code)}_${safe(d.project||d.module.name)}_${dt}.pdf`,`${d.module.name} · ${d.module.code}`,msg); }
  catch(e){ msg('Vorschau nicht möglich: '+e.message); } });
AD.report={buildPdf,buildVesselPdf,exportVesselPdf,previewVessel};
})(globalThis.AD);
