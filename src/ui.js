(function(AD){
const H=AD.h, $=id=>document.getElementById(id);
const GROUPS=['Schalen','Böden','Ausschnitte','T-Stücke','Verbindungen','Zusatzlasten','Bewertung','EN 13445','EN 13480','ASME','Richtlinie'];
const mods=AD.modules.slice().sort((a,b)=>GROUPS.indexOf(a.group)-GROUPS.indexOf(b.group));
const byId=Object.fromEntries(mods.map(m=>[m.id,m]));
const vals={}; mods.forEach(m=>{vals[m.id]={};m.fields.forEach(f=>{if(f.type!=='heading')vals[m.id][f.id]=String(f.def).replace('.',',');});});
let mod=mods[0].id, kManual=false, eManual=false, k20Manual=false;
const parse=s=>{s=String(s).trim().replace(',','.');return /^-?\d+(\.\d+)?$|^-?\.\d+$/.test(s)?parseFloat(s):NaN;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// picker
const groupsUsed=GROUPS.filter(gr=>mods.some(m=>m.group===gr)).concat([...new Set(mods.map(m=>m.group))].filter(gr=>!GROUPS.includes(gr)));
$('picker').insertAdjacentHTML('beforebegin',`<div class="gchips" id="gchips" role="tablist">${groupsUsed.map(gr=>`<button class="gchip" role="tab" data-g="${esc(gr)}" aria-selected="false">${esc(gr)}<small>${mods.filter(m=>m.group===gr).length}</small></button>`).join('')}</div>`);
$('picker').innerHTML=mods.map(m=>`<button class="pick" data-mod="${m.id}" data-g="${esc(m.group)}" aria-pressed="false"><svg viewBox="0 0 44 34" fill="none" stroke="currentColor" stroke-width="2">${m.icon||''}</svg><span><b>${esc(m.name)}</b><small>${esc(m.code)}</small></span></button>`).join('');
let curGroup=null;
function showGroup(gr){ curGroup=gr; document.querySelectorAll('.gchip').forEach(b=>b.setAttribute('aria-selected',b.dataset.g===gr)); document.querySelectorAll('.pick').forEach(b=>b.hidden=b.dataset.g!==gr); }
$('gchips').addEventListener('click',e=>{const b=e.target.closest('.gchip'); if(b) showGroup(b.dataset.g);});
// materials
const mats=AD.materials||[];
const FAM=['EN Blech','EN Rohr','EN Schmiedestück','EN Stahlguss','EN Stab/Schraube','Leitungsrohr','DIN (alt)','ASME'];
const famOf=m=>m.family||'EN Blech';
const hay=m=>[m.id,m.name,m.std,m.product,...(m.aliases||[]),...(m.replaces||[]),m.replacedBy||''].join(' ').toLowerCase().replace(/\s+/g,' ');
function fillMatSelect(q){
  const cur=$('mat').value, words=String(q||'').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const hit=mats.map((m,i)=>[m,i]).filter(([m])=>words.every(w=>hay(m).includes(w)||hay(m).replace(/[\s.\-]/g,'').includes(w.replace(/[\s.\-]/g,''))));
  const matchCount=hit.length;
  // Search may hide matches, but must never replace the calculation's active material.
  if(cur!=='custom' && mats[+cur] && !hit.some(([,i])=>String(i)===cur)) hit.push([mats[+cur],+cur]);
  const qs=words.join(' '), nm=m=>(m.name||'').toLowerCase();
  const score=m=>!qs?0:nm(m).startsWith(qs)?3:nm(m).includes(qs)?2:1;
  const fams=[...FAM,...new Set(mats.map(famOf).filter(f=>!FAM.includes(f)))]
    .map((f,k)=>[f,k,Math.max(0,...hit.filter(([m])=>famOf(m)===f).map(([m])=>score(m)))]).sort((a,b)=>b[2]-a[2]||a[1]-b[1]).map(x=>x[0]);
  let html=fams.map(f=>{const g=hit.filter(([m])=>famOf(m)===f); return g.length?`<optgroup label="${esc(f)} (${g.length})">${g.map(([m,i])=>`<option value="${i}">${esc(m.name)}${m.product&&!m.name.includes(m.product)?' · '+esc(m.product):''}</option>`).join('')}</optgroup>`:'';}).join('');
  html+='<option value="custom">Eigener Werkstoff</option>';
  $('mat').innerHTML=html;
  if([...$('mat').options].some(o=>o.value===cur)) $('mat').value=cur;
  return matchCount;
}
fillMatSelect('');
const pi=mats.findIndex(m=>/^P265GH/.test(m.id||m.name)&&famOf(m)==='EN Blech'); if(pi>=0)$('mat').value=String(pi);
const curMat=()=>$('mat').value==='custom'?null:mats[+$('mat').value];

function renderFields(){
  const m=byId[mod];
  $('modTitle').textContent=`${m.name} · ${m.code}`;
  $('modFields').innerHTML=m.fields.map(f=>{
    if(f.type==='heading') return f.fold
      ? `<button type="button" class="fr fh fold" data-fid="${f.id||''}" aria-expanded="${!!openFolds[mod+f.id]}"><span>${esc(f.label)}</span><em>${openFolds[mod+f.id]?'ausblenden':'einblenden'}</em></button>`
      : `<div class="fr fh" data-fid="${f.id||''}"><span>${esc(f.label)}</span></div>`;
    const v=vals[mod][f.id];
    const ctl=f.type==='select'
      ? `<div class="box wide"><select id="f_${f.id}">${f.options.map(([o,l])=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(l)}</option>`).join('')}</select></div>`
      : `<div class="box"><input id="f_${f.id}" inputmode="decimal" value="${esc(v)}"><em>${esc(f.unit||'')}</em></div>`;
    const tip=f.tip?`<button type="button" class="tipbtn" aria-label="Erklärung zu ${esc(f.label)}" aria-expanded="false">i</button>`:'';
    return `<div class="fr${f.tip?' hastip':''}" data-fid="${f.id}"><label for="f_${f.id}"><span>${esc(f.label)}${tip}</span>${f.sym?`<i>${f.tip||(AD.glossary||{})[f.sym]?`<abbr title="${esc((AD.glossary||{})[f.sym]||f.label)}" tabindex="0">${esc(f.sym)}</abbr>`:esc(f.sym)}</i>`:''}${f.help?`<small class="fhelp">${abbrify(f.help)}</small>`:''}${f.tip?`<small class="tipbox" hidden>${abbrify(f.tip)}</small>`:''}</label>${ctl}</div>`;
  }).join('');
  $('modHelp').hidden=!m.help; $('modHelp').innerHTML=abbrify(m.help||'');
  const tl=$('modTips'); tl.hidden=!(m.tips&&m.tips.length); tl.querySelector('ul').innerHTML=(m.tips||[]).map(t=>`<li>${abbrify(t)}</li>`).join('');
  document.querySelectorAll('#modFields .tipbtn').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const box=b.closest('label').querySelector('.tipbox');box.hidden=!box.hidden;b.setAttribute('aria-expanded',String(!box.hidden));}));
  document.querySelectorAll('#modFields .fr[data-fid]').forEach(row=>{const id=row.dataset.fid;
    row.addEventListener('mouseenter',()=>hilite(id)); row.addEventListener('mouseleave',()=>hilite(activeField));
    row.addEventListener('focusin',()=>{activeField=id;hilite(id);}); row.addEventListener('focusout',()=>{activeField=null;hilite(null);});});
  $('EmRow').hidden=!m.usesE;
  document.querySelector('label[for="p"] i').textContent=m.id==='b6'?'p · Außendruck':'p · Überdruck';
  m.fields.forEach(f=>{const el=$('f_'+f.id); if(el) el.addEventListener('input',e=>{vals[mod][f.id]=e.target.value;modTouched[mod+f.id]=true;applyWhen();calc();});});
  document.querySelectorAll('#modFields .fold').forEach(b=>b.addEventListener('click',()=>{const k=mod+b.dataset.fid;openFolds[k]=!openFolds[k];b.setAttribute('aria-expanded',!!openFolds[k]);b.querySelector('em').textContent=openFolds[k]?'ausblenden':'einblenden';applyWhen();}));
  applyWhen();
}

// field.when = {otherFieldId: value | [values]} -> field (or heading) shown only when all match
// when: object (all keys must match) or function(values) for OR conditions
const shown=f=>!f.when||(typeof f.when==='function'?!!f.when(vals[mod]):Object.entries(f.when).every(([k,v])=>Array.isArray(v)?v.includes(vals[mod][k]):vals[mod][k]===v));
const openFolds={};
function applyWhen(){ let folded=false; byId[mod].fields.forEach(f=>{ if(f.type==='heading') folded=!!f.fold&&!openFolds[mod+f.id]; const row=document.querySelector(`#modFields [data-fid="${f.id||''}"]`); if(row&&f.id) row.hidden=!shown(f)||(f.type!=='heading'&&folded);});
  byId[mod].fields.filter(f=>f.type==='heading'&&!f.id).forEach(()=>{}); }
// Sparse II-D extracts omit published columns (e.g. 50/150 °C). Never
// interpolate across them: use the lower endpoint stress, even for adjacent
// columns. The stored 20 °C allowable denotes the published ≤40 °C column.
function asmeAtT(tbl,T){
  if(!tbl?.length||!Number.isFinite(T)) return NaN;
  if(T<=40) return tbl[0][1];
  for(let i=1;i<tbl.length;i++){
    if(T===tbl[i][0]) return tbl[i][1];
    if(T<tbl[i][0]) return Math.min(tbl[i-1][1],tbl[i][1]);
  }
  return NaN;
}
const isCasting=m=>m.type==='cast'||/guss|cast|\bG(?:P\d|\d|X)/i.test([m.product,m.family,m.name,m.id].join(' '));
// Convert the explicit product label into structured bounds; never infer a
// different product form, heat treatment or orientation from a grade alone.
function thicknessBand(m){
  if(m.thickness) return m.thickness;
  if(/Vergleichsdurchmesser|\btR\b|\bd\s*(?:≤|<)|d\/t|teq/i.test(m.product||'')) return {unsupported:true};
  const p=(m.product||'').replace(/,/g,'.'), n='(\\d+(?:\\.\\d+)?)';
  let r=p.match(new RegExp(n+'\\s*(<|≤)\\s*tR?\\s*(<|≤)\\s*'+n+'\\s*mm','i'));
  if(r) return {min:+r[1],minInclusive:r[2]==='≤',max:+r[4],maxInclusive:r[3]==='≤'};
  r=p.match(new RegExp(n+'\\s*(?:…|–|-)\\s*'+n+'\\s*mm'));
  if(r) return {min:+r[1],minInclusive:true,max:+r[2],maxInclusive:true};
  r=p.match(/(?:tR?\s*)?(≤|<)\s*(\d+(?:\.\d+)?)\s*mm/i);
  if(r) return {min:0,minInclusive:false,max:+r[2],maxInclusive:r[1]==='≤'};
  return null;
}
const inBand=(b,t)=>!b||(!b.unsupported&&Number.isFinite(t)&&(b.minInclusive?t>=b.min:t>b.min)&&(b.maxInclusive?t<=b.max:t<b.max));
const gradeOf=m=>(m.id||m.name).split(/\s|\(/)[0];
const stdOf=m=>(m.std||'').replace(/:\d{4}.*/,'');
const productOf=m=>(m.product||'').replace(/(?:\d+(?:[.,]\d+)?\s*(?:<|≤)\s*)?tR?\s*(?:<|≤)\s*\d+(?:[.,]\d+)?\s*mm|(?:\d+(?:[.,]\d+)?\s*(?:…|–|-)\s*)?(?:<|≤)?\s*\d+(?:[.,]\d+)?\s*mm/gi,'').replace(/\s+/g,' ').trim();
function matchingBand(m,t){
  return mats.find(x=>gradeOf(x)===gradeOf(m)&&stdOf(x)===stdOf(m)&&x.family===m.family&&x.type===m.type&&productOf(x)===productOf(m)&&thicknessBand(x)&&inBand(thicknessBand(x),t));
}
function checkMaterialBand(){
  const m=curMat(); if(!m) return [];
  if(mod==='b8'&&thicknessBand(m))return [['w','UNVERIFIED: B8 enthält wirksame Flanschmaße; die ursprüngliche Erzeugnisdicke ist daraus nicht sicher bestimmbar.'],['e','Werkstoff-Dickenstufe für B8 nicht belegt. Eigenen Werkstoff wählen und Kennwerte für die ursprüngliche Erzeugnisdicke eingeben.']];
  const diameter=(m.product||'').match(/\bD\s*(>|≥|<|≤)\s*(\d+(?:[.,]\d+)?)\s*mm/);
  if(diameter){
    const id=['Da','Do','D'].find(id=>byId[mod].fields.some(f=>f.id===id&&shown(f)));
    // Product D is outside diameter. ASME D and FFS inner D cannot be substituted.
    const d=id&&byId[mod].group!=='ASME'&&!mod.startsWith('ffs')?parse(vals[mod][id]):NaN,limit=+diameter[2].replace(',','.');
    const valid=Number.isFinite(d)&&({'>':d>limit,'≥':d>=limit,'<':d<limit,'≤':d<=limit})[diameter[1]];
    if(!valid)return [['e',`UNVERIFIED / außerhalb der Erzeugnisgrenze ${diameter[0]}: Außendurchmesser für diesen Werkstoff nicht belegt. Eigenen Werkstoff mit belegten Kennwerten wählen.`]];
  }
  // Wall fields used by the supported pressure-wall modules (nominal thickness).
  const fs=byId[mod].fields.filter(f=>f.type!=='heading'&&shown(f)&&f.unit==='mm'&&
    (mod.startsWith('ffs')||mod==='b31g'?f.id==='t_nom':mod==='s3o'?f.id==='t':f.id==='sn'||/wanddicke|wanddicken|lagendicke/i.test(f.label)));
  if(!fs.length) return [];
  const ts=fs.map(f=>parse(vals[mod][f.id])), b=thicknessBand(m);
  if(m.hotThickness&&ts.every(t=>inBand(b,t))&&parse($('T').value)>20&&!kManual&&!ts.every(t=>inBand(m.hotThickness,t)))
    return [['w','UNVERIFIED: EN 10028-2:2003 Tabelle 4 druckt in der ersten Warm-Dickenstufe t < 16 mm; der Grenzfall t = 16 mm ist nicht belegt.'],['e','Warmkennwert für diese Wanddicke nicht belegt. Eigenen Werkstoff wählen und belegte Kennwerte eingeben.']];
  if(!b||ts.every(t=>inBand(b,t))) return [];
  if(b.unsupported) return [['e',`Erzeugnisgrenzen (${m.product}) lassen sich aus der Wanddicke nicht prüfen. Eigenen Werkstoff wählen und belegte Kennwerte eingeben.`]];
  const next=matchingBand(m,ts[0]);
  if(next&&ts.every(t=>inBand(thicknessBand(next),t))){
    const i=mats.indexOf(next); fillMatSelect(''); $('mat').value=String(i);
    return [...checkMaterialBand(),['',`Dickenstufe angepasst: ${next.product}.`]];
  }
  return [['e',`Wanddicke außerhalb der Werkstoff-Dickenstufe (${m.product}). Passende Erzeugnisform oder „Eigener Werkstoff“ wählen und belegte Kennwerte eingeben.`]];
}
function elasticTable(m){
  if(m.E) return m.E;
  // Forta Tables 9/11: only the identified EN duplex grades, no generic
  // ferritic fallback for duplex, nickel, cast or unknown materials.
  const txt=[m.id,m.name,m.family,m.product,...(m.aliases||[])].join(' ');
  const duplex=m.type==='duplex'||/\b1\.(4462|4362|4501|4410|4162|4062|4507)\b|duplex|\b2205\b|\b2507\b|S3[12]\d{3}/i.test(txt);
  if(duplex) return /\b1\.(4462|4362|4501|4410)\b/.test(txt)?AD.Eduplex:null;
  // Nickel, aluminium, copper, titanium: no generic table, E must be entered.
  if(/\b2\.4\d{3}\b|\b3\.\d{4}\b|\b2\.[01]\d{3}\b|alumin|kupfer|copper|nickel|titan|EN AW|Inconel|Incoloy|Hastelloy|Monel|SB-/i.test(txt)) return null;
  // Austenitic / other stainless: AD austenitic table (lower E, on the safe side for buckling).
  if(m.type==='austenitic'||/\b1\.4\d{3}\b|\b(304|316|321|347|309|310)L?H?\b|TP3\d\d|X\d+CrNi/i.test(txt)) return AD.Eaustenitic;
  // Carbon and low-alloy steels incl. cast steel: AD ferritic table.
  if(m.type==='ferritic'||!m.type) return AD.Eferritic;
  return null;
}
function applyMaterial(){
  const m=curMat(), T=parse($('T').value), notes=[];
  if(!m){$('kAuto').hidden=true;$('eAuto').hidden=true;$('matHelp').textContent='Eigener Werkstoff: K20, K bei T und E selbst eintragen.';return notes;}
  if(T<20&&(!kManual||(!eManual&&byId[mod].usesE))) notes.push(['w','UNVERIFIED: Tieftemperatureignung nicht belegt.'],['e','UNVERIFIED: Automatische Werkstoffkennwerte unter 20 °C sind nicht belegt; Eignung bei Tieftemperatur prüfen und belegte Werte manuell eingeben.']);
  if(!k20Manual) $('K20').value=String(m.K[0][1]).replace('.',',');
  if(m.S&&!$('S').dataset.touched) $('S').value=String(m.S).replace('.',',');
  if(!kManual&&Number.isFinite(T)){const k=m.K.length===1?(T<=50?m.K[0][1]:NaN):H.atT(m.K,T);
    if(Number.isFinite(k)) $('K').value=String(k).replace('.',',');
    else notes.push(['e',m.K.length===1?`Für ${m.name} ist nur der 20 °C-Wert hinterlegt (gültig bis 50 °C). K bei ${H.fmt(T,0)} °C manuell eintragen.`:`T = ${H.fmt(T,0)} °C liegt außerhalb der Werkstofftabelle (bis ${m.K[m.K.length-1][0]} °C). K manuell eintragen.`]);}
  const Et=elasticTable(m);
  if(!eManual&&!Et&&byId[mod].usesE) notes.push(['e',`Für ${m.name} ist keine passende E-Modul-Tabelle hinterlegt. E bei Berechnungstemperatur manuell eintragen.`]);
  if(!eManual&&Et&&Number.isFinite(T)){const e=H.atT(Et,T); if(Number.isFinite(e)) $('E').value=String(e); else if(byId[mod].usesE) notes.push(['e',`E-Modul bei ${H.fmt(T,0)} °C nicht in der Tabelle (bis ${Et[Et.length-1][0]} °C). E manuell eintragen.`]);}
  $('kAuto').hidden=kManual||m.K.length<2; $('eAuto').hidden=eManual||!Et;
  if(!eManual&&Et===AD.Eduplex&&byId[mod].usesE) notes.push(['','E-Modul: Outokumpu Forta, Tabellen 9/11 (typische physikalische Werte), 20–300 °C.']);
  const rel=[m.aliases&&m.aliases.length?'auch: '+m.aliases.join(', '):'',m.replacedBy?'ersetzt durch '+m.replacedBy:'',m.replaces&&m.replaces.length?'ersetzt '+m.replaces.join(', '):''].filter(Boolean).join(' · ');
  $('matHelp').innerHTML=`<b>${esc(m.std||'')}</b>${m.product?' · '+esc(m.product):''}${m.Rm?' · Rm '+m.Rm+' N/mm²':''}${m.Tmax?' · Tabelle bis '+m.Tmax+' °C':''}${rel?'<br>'+esc(rel):''}${m.replacedBy?'<br><span style="color:var(--warn)">Zurückgezogene Norm – für Neuauslegung den Nachfolgewerkstoff verwenden.</span>':''}<br>K wird aus der Tabelle interpoliert, solange du ihn nicht überschreibst. ${kManual?'<button class="reset" id="kReset">Tabellenwert verwenden</button>':''}`;
  const r=$('kReset'); if(r) r.onclick=()=>{kManual=false;calc();};
  return notes;
}

const modTouched={};
function applyModuleMaterial({blocked=false}={}){
  const m=curMat(), md=byId[mod], T=parse($('T').value), notes=[]; if(!m) return notes;
  if((md.group==='EN 13445'||md.group==='EN 13480')&&isCasting(m)) return [['e','Stahlguss: keine automatische Übernahme von EN-Festigkeiten. Gussroute wählen und belegte Kennwerte selbst eingeben (eigener Werkstoff).']];
  const has=id=>md.fields.some(f=>f.id===id), set=(id,v)=>{ if(!modTouched[mod+id]&&Number.isFinite(v)){ vals[mod][id]=String(v).replace('.',','); const el=$('f_'+id); if(el) el.value=vals[mod][id]; } };
  if(has('steel')&&!modTouched[mod+'steel']){ const v=m.type==='austenitic'?'aust':'ferr'; const f=md.fields.find(f=>f.id==='steel'); if(f.options.some(o=>o[0]===v)&&vals[mod].steel!==v){ vals[mod].steel=v; const el=$('f_steel'); if(el) el.value=v; applyWhen(); } }
  if(has('A')){
    if(Number.isFinite(m.A)) set('A',m.A);
    else if(!modTouched[mod+'A']){ set('A',30); notes.push(['w','Bruchdehnung nicht hinterlegt: konservativ A = 30 %; keine erhöhte austenitische Spannung. Mindestdehnung und Eignung nach Werkstoffnorm prüfen.']); }
  }
  if(md.group==='EN 13480'&&m.type==='austenitic') notes.push(['e','EN 13480: Dieses Modul deckt nur nichtaustenitische Stähle ab; austenitischer Werkstoff ausgewählt.']);
  if(blocked) return notes; // Bounds unverified: do not reuse or replace material strengths.
  if(has('Rm')&&m.Rm) set('Rm',m.Rm);
  if(has('RmT')&&m.RmT&&Number.isFinite(T)) set('RmT',H.atT(m.RmT,T));
  // Review-Fix: Rm bei T für Austenite nicht in der Datenbank -> nicht still den Startwert verwenden.
  if(has('RmT')&&(!m.RmT||!Number.isFinite(H.atT(m.RmT,T)))&&vals[mod].steel==='aust'&&!modTouched[mod+'RmT']) notes.push(['e',`Rm bei ${H.fmt(T,0)} °C ist für ${m.name} nicht hinterlegt. Rm,T aus der Werkstoffnorm eintragen (Feld „Zugfestigkeit bei Temperatur“).`]);
  if(md.group==='EN 13480'&&m.type!=='austenitic'){
    if(!modTouched[mod+'RpT']) set('RpT',parse($('K').value));
    if(!modTouched[mod+'Rp20']) set('Rp20',parse($('K20').value));
  }
  if(has('SMTS')&&m.Rm) set('SMTS',m.Rm); // Mindestzugfestigkeit aus dem Werkstoff (B31G)

  if(md.group==='ASME'&&has('S')){
    if(m.asmeUse==='bolting'||m.asmeTable==='3') return [...notes,['e',`${m.name}: ${m.asmeEdition} Table ${m.asmeTable} gilt nur für Schrauben, nicht für drucktragende Wände. Geeigneten Werkstoff wählen.`]];
    if(m.asmeS){ const s=asmeAtT(m.asmeS,T); if(Number.isFinite(s)) set('S',s); else notes.push(['e',`ASME-Spannung für ${m.name} bei ${H.fmt(T,0)} °C nicht tabelliert (bis ${m.asmeS[m.asmeS.length-1][0]} °C).`]);
      if(has('ST')) set('ST',m.asmeS[0][1]); notes.push(['',`Werkstoffquelle: ${m.asmeEdition||'ASME II-D'} Table ${m.asmeTable||'1A'} für ${m.name}${modTouched[mod+'S']||modTouched[mod+'ST']?' (S/ST manuell überschrieben)':''}; zwischen gespeicherten Stützstellen konservativ der niedrigere Wert, ≤ 40 °C konstant.`]); }
    else notes.push([modTouched[mod+'S']&&modTouched[mod+'ST']?'w':'e',`${m.name} ist kein ASME-Werkstoff: S und ST manuell aus ASME II-D eintragen.`]);
  } else if(m.family==='ASME'&&md.group!=='ASME') notes.push(['w','ASME-Werkstoff in AD/EN-Rechnung: K = Sy(T) aus II-D Table Y-1; Werkstoffeignung nach AD W-Reihe / EN-Regelwerk gesondert prüfen.']);
  return notes;
}
function read(){
  const m=byId[mod], g={v:parse($('v').value),bad:[]};
  if(!Number.isFinite(g.v)||g.v<=0||g.v>1||![...$('v').options].some(o=>o.value===$('v').value)) g.bad.push('v');
  const shared={p:'pos',T:'any',K20:'pos',K:'pos',S:'pos',ST:'pos',c1:'zero',c2:'zero',E:'pos'};
  for(const [id,rule] of Object.entries(shared)){
    const x=parse($(id).value); g[id]=x;
    const ok=Number.isFinite(x)&&(rule==='pos'?x>0:rule==='zero'?x>=0:true);
    const skip=id==='E'&&!m.usesE;
    $(id).parentElement.classList.toggle('err',!ok&&!skip); if(!ok&&!skip) g.bad.push(id);
  }
  m.fields.forEach(f=>{
    if(f.type==='heading') return;
    if(f.type==='select'){g[f.id]=vals[mod][f.id];if(shown(f)&&!f.options.some(o=>String(o[0])===g[f.id]))g.bad.push(f.id);return;}
    if(!shown(f)){g[f.id]=parse(vals[mod][f.id]);const el=$('f_'+f.id);if(el)el.parentElement.classList.remove('err');return;}
    const x=parse(vals[mod][f.id]); g[f.id]=x; const rule=f.min||'pos';
    const ok=Number.isFinite(x)&&(rule==='pos'?x>0:rule==='zero'?x>=0:true);
    const el=$('f_'+f.id); if(el) el.parentElement.classList.toggle('err',!ok); if(!ok) g.bad.push(f.id);
  });
  return g;
}

function calc(){
  const bandNotes=checkMaterialBand();
  const blocked=bandNotes.some(n=>n[0]==='e')||((byId[mod].group==='EN 13445'||byId[mod].group==='EN 13480')&&curMat()&&isCasting(curMat()));
  const matNotes=[...bandNotes,...(blocked?[]:applyMaterial()),...applyModuleMaterial({blocked:bandNotes.some(n=>n[0]==='e')})], m=byId[mod], g=read();
  $('advSum').textContent=`v ${H.fmt(g.v,2)} · S ${H.fmt(g.S,2)} · c ${H.fmt((g.c1||0)+(g.c2||0),1)} mm`;
  if(g.bad.length){render(null,'Rot markierte Felder brauchen eine gültige Zahl.');renderDrawing(g,null);return;}
  let r; try{ r=m.calc(g,H); }catch(e){ render(null,'Rechenfehler im Modul: '+e.message); renderDrawing(g,null); return; }
  const notes=[...matNotes,...(r.notes||[])];
  if(kManual&&g.T>50&&g.K>=g.K20) notes.push(['w',`T = ${H.fmt(g.T,0)} °C, aber K ≥ K20. Warmstreckgrenze bei T eintragen.`]);
  const matFail=matNotes.some(n=>n[0]==='e');
  const numericBad=(!Number.isNaN(r.pmax)&&typeof r.pmax==='number'&&!Number.isFinite(r.pmax))||
    /NaN|Infinity|undefined/.test(r.formula||'')||(r.headline?.text==null&&!Number.isFinite(r.headline?.value))||
    (r.rows||[]).some(row=>typeof row[2]==='number'&&!Number.isFinite(row[2]))||
    (r.test&&(!Number.isFinite(r.test.PT)||[r.test.req,r.test.have].some(x=>typeof x==='number'&&!Number.isFinite(x))));
  if(r.test?.ok===true&&Number.isFinite(r.test.req)&&Number.isFinite(r.test.have)&&r.test.req>r.test.have) notes.push(['e','Prüfzustand widersprüchlich: erforderlich größer als vorhanden.']);
  if(numericBad) notes.push(['e','Nicht endliche Rechenergebnisse: Nachweis gesperrt.']);
  // test.ok null = test pressure only reported (e.g. ASME UG-99: no stress limit in the test state) — informs, does not block.
  if(r.test&&r.test.ok!==true&&r.test.ok!==false) notes.push(['w','Prüfzustand: nur der Prüfdruck wird ausgegeben, eine Spannungsbewertung im Prüfzustand ist hier nicht durchgeführt.']);
  const ok=Number.isFinite(r.util)&&r.util>=0&&r.util<=1&&!r.fail&&!matFail&&!numericBad&&!notes.some(n=>n[0]==='e')&&(!r.test||r.test.ok!==false);
  if(r.test&&r.test.ok===false) notes.push(['e','Nachweis im Prüfzustand nicht erfüllt.']);
  render({...r,notes,ok,_g:g});
  renderDrawing(g,{...r,ok});
  lastReport=buildReportData();
}

// mark glossary abbreviations (AD.glossary) with <abbr>: hover shows the long form, tap toggles it on touch
function abbrify(text){ const g=AD.glossary||{}, keys=Object.keys(g).sort((a,b)=>b.length-a.length); let s=esc(text);
  if(!keys.length) return s; const re=new RegExp('(?<![A-Za-z0-9_])('+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![A-Za-z0-9_])','g');
  return s.replace(re,m=>`<abbr title="${esc(g[m])}" tabindex="0">${m}</abbr>`); }
document.addEventListener('click',e=>{ const a=e.target.closest('abbr[title]'); document.querySelectorAll('abbr.open').forEach(x=>{ if(x!==a) x.classList.remove('open'); }); if(a){ e.preventDefault(); a.classList.toggle('open'); } });
let activeField=null;
// highlight drawing elements tagged with data-p containing the field id
function hilite(id){ const svg=$('drawing'); if(!svg) return; svg.querySelectorAll('.hlp').forEach(e=>e.classList.remove('hlp'));
  const note=$('drawNote'); if(note) note.hidden=true;
  if(!id) return; let n=0; svg.querySelectorAll('[data-p]').forEach(e=>{ if(e.dataset.p.split(' ').includes(id)){ e.classList.add('hlp'); n++; } });
  // fields without a drawn element: say so instead of silently showing nothing
  if(!n&&note&&svg.querySelector('svg')){ const f=byId[mod].fields.find(x=>x.id===id); if(f){ note.textContent=`„${f.label}“ ist nicht in der Zeichnung dargestellt.`; note.hidden=false; } }
  return n; }
function renderDrawing(g,r){
  const m=byId[mod], el=$('drawing');
  if(!m.draw){ $('drawCard').hidden=true; return; }
  $('drawCard').hidden=false;
  try{ let svg=m.draw(g,H,r||null); setTimeout(()=>hilite(activeField),0); if(/NaN|Infinity|undefined/.test(svg)) svg=H.draw.svg(420,140,H.draw.text(210,70,'Maße prüfen – Zeichnung nicht darstellbar'),{title:m.name,sub:m.code}); el.innerHTML=svg; $('drawSub').textContent=matchMedia('(max-width:520px)').matches||document.body.dataset.view==='mob'?'Maße in mm · seitlich wischen':'Maße in mm'; }
  catch(e){ el.innerHTML=''; $('drawSub').textContent='Zeichnung nicht möglich: '+e.message; }
}
let lastRes=null, lastReport=null;
function render(r,msg){
  const st=$('status');
  if(!r){
    lastRes=null; lastReport=null;
    st.className='status bad'; $('statusTxt').textContent='Eingaben prüfen';
    $('sReq').textContent='–'; $('sOf').textContent=''; $('dockV').textContent='–'; $('dockL').textContent=msg; $('dockL').style.color='var(--bad)';
    ['barFill','dockFill'].forEach(i=>$(i).style.width='0');
    $('stats').innerHTML=''; $('formula').textContent=msg; $('test').innerHTML=''; $('testNote').textContent='';
    $('rows').innerHTML=''; $('notes').innerHTML=''; $('noteSum').textContent=''; window._report=''; return;
  }
  lastRes=r;
  const m=byId[mod], pct=Math.min(100,(r.util||0)*100), hl=r.headline||{};
  st.className='status '+(r.ok?'ok':'bad'); $('statusTxt').textContent=(r.ok?'Nachweis erfüllt':'Nachweis nicht erfüllt')+` · ${m.name} · ${m.code}`;
  $('resBox').classList.toggle('bad',!r.ok);
  $('sReq').textContent=hl.text!=null?hl.text:H.fmt(hl.value); $('sOf').textContent=`${hl.label||''}${hl.of?' · '+hl.of:''}`;
  $('barFill').style.width=pct+'%';
  const stats=r.noUtil?[]:[[H.fmt(r.util*100,2)+' %','Ausnutzung']];
  (r.stats||[]).forEach(x=>stats.push(x));
  if(Number.isFinite(r.pmax)) stats.push([H.fmt(r.pmax,2),'bar zulässig']);
  if(r.test&&Number.isFinite(r.test.PT)) stats.push([H.fmt(r.test.PT,2),'bar Prüfdruck']);
  $('stats').innerHTML=stats.map(([a,b])=>`<div class="stat"><b>${a}</b><span>${b}</span></div>`).join('');
  $('formula').textContent=r.formula||'';
  $('rows').innerHTML=(r.rows||[]).map(([l,s,v,u])=>`<tr><td>${esc(l)}</td><td class="s">${esc(s)}</td><td class="n">${typeof v==='number'?H.n(v):esc(v)}</td><td class="u">${esc(u)}</td></tr>`).join('');
  if(r.test){const t=r.test;
    $('test').innerHTML=[[H.fmt(t.PT,2),'bar PT'],[H.fmt(t.req,2),`${t.unit||'mm'} nötig`],[t.ok===true?'erfüllt':t.ok===false?'nicht erfüllt':'nicht geprüft','Prüfzustand']].map(([a,b])=>`<div class="stat"><b>${a}</b><span>${b}</span></div>`).join('');
    const usesPT=['cyl','sph','b3','b5','b10','b2','b4','tee_ad'].includes(m.id)&&Math.abs(t.PT-H.PT(r._g||{}))<1e-9*Math.max(1,t.PT);
    $('testNote').textContent=(t.note||'')+(usesPT?' PT = max(1,25·p·K20/K ; 1,43·p).':'');
  } else {$('test').innerHTML='';$('testNote').textContent=r.testNote||'Für dieses Bauteil wird kein Prüfzustand gerechnet.';}
  $('notes').innerHTML=r.notes.map(([c,t])=>`<li class="${c}">${abbrify(t)}</li>`).join('');
  const nw=r.notes.filter(n=>n[0]).length; $('noteSum').textContent=nw?nw+' offen':'';
  $('dockL').textContent=(r.ok?'Erfüllt':'Nicht erfüllt')+' · Ausnutzung '+H.fmt(r.util*100,2)+' %';
  $('dockL').style.color=r.ok?'var(--ok)':'var(--bad)';
  $('dockV').textContent=`${hl.text!=null?hl.text:H.fmt(hl.value)} ${hl.unit||''}  ·  ${m.code}`;
  $('dockFill').style.width=pct+'%'; $('dockBar').classList.toggle('bad',!r.ok);
  window._report=['AD 2000 Rechner (Prototyp, nicht validiert)',`${m.name} · ${m.code}`,'',r.formula||'','',
    ...(r.rows||[]).map(([l,s,v,u])=>`${l} ${s} = ${typeof v==='number'?H.n(v):v} ${u}`),'',
    `Ausnutzung ${H.fmt(r.util*100,2)} % · ${r.ok?'Nachweis erfüllt':'Nachweis nicht erfüllt'}`,
    r.test?`Prüfdruck PT = ${H.fmt(r.test.PT)} bar · ${r.test.ok===true?'erfüllt':r.test.ok===false?'nicht erfüllt':'Prüfzustand nicht geprüft'}`:'',
    '','Hinweise:',...r.notes.map(n=>'- '+n[1])].join('\n');
}

let matUserChosen=false;
// ASME modules need ASME II-D stresses: if the material was never chosen by the user and is not an ASME material, start with SA-516 Gr 70.
function asmeDefaultMat(id){ if(byId[id].group!=='ASME'||matUserChosen) return; const m=curMat(); if(m&&m.asmeS) return;
  const i=mats.findIndex(x=>x.asmeS&&/SA-516 Gr 70/.test(x.name)); if(i<0) return; fillMatSelect(''); $('mat').value=String(i);
  kManual=false;eManual=false;k20Manual=false;$('S').dataset.touched='';Object.keys(modTouched).forEach(k=>delete modTouched[k]); }
function setMod(id){ mod=id; asmeDefaultMat(id); document.querySelectorAll('.pick').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mod===id)); if(byId[id].group!==curGroup) showGroup(byId[id].group); renderFields(); calc(); }
$('picker').addEventListener('click',e=>{const b=e.target.closest('.pick');if(b)setMod(b.dataset.mod);});
$('mat').addEventListener('change',()=>{matUserChosen=true;kManual=false;eManual=false;k20Manual=false;$('S').dataset.touched='';Object.keys(modTouched).forEach(k=>delete modTouched[k]);calc();});
$('matQ').addEventListener('input',()=>{const n=fillMatSelect($('matQ').value);$('matQ').parentElement.classList.toggle('err',n===0);});
$('K20').addEventListener('input',()=>{k20Manual=true;});
$('K').addEventListener('input',()=>{kManual=true;calc();});
$('E').addEventListener('input',()=>{eManual=true;calc();});
$('S').addEventListener('input',()=>{$('S').dataset.touched='1';calc();});
['p','T','K20','ST','c1','c2','v'].forEach(id=>$(id).addEventListener('input',calc));
const copyText=(t,ok,fb)=>{try{ if(!navigator.clipboard||!navigator.clipboard.writeText) throw 0; navigator.clipboard.writeText(t).then(ok,fb);}catch(e){fb();}};
$('copy').addEventListener('click',()=>{const t=window._report||'';
  copyText(t,()=>{$('copy').textContent='Kopiert';setTimeout(()=>$('copy').textContent='Bericht als Text kopieren',1500);},()=>{const f=$('fallback');f.hidden=false;f.value=t;f.select();});});
function setView(v){document.body.dataset.view=v;if($('drawSub'))$('drawSub').textContent=matchMedia('(max-width:520px)').matches||v==='mob'?'Maße in mm · seitlich wischen':'Maße in mm';document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v));try{localStorage.setItem('ad2000-view',v);}catch(e){}}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setView(b.dataset.view);});
let v0=null;try{v0=localStorage.getItem('ad2000-view');}catch(e){}
setView(v0==='mob'||v0==='desk'?v0:(matchMedia('(min-width:900px)').matches?'desk':'mob'));
// ---- projects (per-browser convenience storage + JSON export/import) ----
const SH=['p','T','K20','K','E','S','ST','c1','c2'];
let vessel={name:'',comps:[]}, activeComp=null;
function snapshot(o={}){ return {v:1,app:'ad2000-rechner',mod,vals:JSON.parse(JSON.stringify(vals)),...(o.noVessel?{}:{vessel:JSON.parse(JSON.stringify(vessel))}),
  shared:Object.fromEntries(SH.map(id=>[id,$(id).value])),wf:$('v').value,mat:$('mat').value,matName:(curMat()||{}).id||'custom',kManual,eManual,k20Manual,modTouched:{...modTouched},Stouched:$('S').dataset.touched||''}; }
function restore(s,o={}){ matUserChosen=true; // restored projects keep their material
  if(!s||s.app!=='ad2000-rechner'||!s.vals) throw new Error('Kein AD-2000-Rechner-Projekt.');
  // Validate before changing any live input; incomplete/foreign projects must not reuse session values.
  if((s.v!=null&&s.v!==1)||!byId[s.mod]||!s.shared||SH.some(id=>s.shared[id]==null)||s.wf==null||
     (s.matName!=='custom'&&!mats.some(m=>m.id===s.matName))||
     Object.values(s.vals).some(v=>!v||typeof v!=='object'||Array.isArray(v))||
     (s.vessel&&(!Array.isArray(s.vessel.comps)||s.vessel.comps.some(x=>!x||typeof x!=='object'||typeof x.name!=='string'||!x.snap))))
    throw new Error('Projektversion, Modul, Werkstoff oder Eingaben unbekannt/unvollständig.');
  // Review-Fix: every registered module starts from its defaults before the saved values are applied
  mods.forEach(md=>md.fields.forEach(f=>{ if(f.type!=='heading') vals[md.id][f.id]=String(f.def).replace('.',','); }));
  Object.entries(s.vals).forEach(([m,o])=>{ if(!vals[m]) return;
    // fields missing in older snapshots are reset to their defaults (deterministic, independent of the current session)
    byId[m]&&byId[m].fields.forEach(f=>{ if(f.type!=='heading'&&!(f.id in o)) vals[m][f.id]=String(f.def).replace('.',','); });
    Object.entries(o).forEach(([k,v])=>{ if(k in vals[m]) vals[m][k]=String(v); });
    // migration: before 'side' existed, ffs5 D was already the assessment (future) diameter -> keep that meaning via 'outer'
    if(m==='ffs5'&&!('side' in o)) vals[m].side='outer';
    if(m==='b31g'&&o.flaw==='other') vals[m].flaw='crack';
    if(m==='ffs5'&&o.flaw==='groove') vals[m].flaw='groove'; });
  Object.keys(modTouched).forEach(k=>delete modTouched[k]);
  if(s.modTouched&&typeof s.modTouched==='object') Object.entries(s.modTouched).forEach(([k,v])=>{if(v===true)modTouched[k]=true;});
  else { // Legacy snapshots cannot distinguish saved manual values from autofill. Preserve saved material fields.
    Object.entries(s.vals).forEach(([id,vs])=>['S','ST','steel','Rm','RmT','A','SMTS','RpT','Rp20'].forEach(k=>{if(k in vs)modTouched[id+k]=true;}));
  }
  fillMatSelect('');
  const mi=mats.findIndex(m=>m.id===s.matName); $('mat').value=mi>=0?String(mi):'custom';
  SH.forEach(id=>{ if(s.shared&&s.shared[id]!=null) $(id).value=s.shared[id]; });
  if(s.wf) $('v').value=s.wf; kManual=!!s.kManual; eManual=!!s.eManual; k20Manual=s.k20Manual==null?!!s.shared?.K20:!!s.k20Manual; $('S').dataset.touched=s.Stouched||'';
  setMod(byId[s.mod]?s.mod:mods[0].id);
  if(!o.keepVessel){ vessel=s.vessel&&Array.isArray(s.vessel.comps)?JSON.parse(JSON.stringify(s.vessel)):{name:'',comps:[]}; activeComp=null;
    const cur=snapshot({noVessel:true});
    vessel.comps.forEach(x=>{try{restore(x.snap,{keepVessel:true,silent:true});x.sum=curSum();}
      catch(e){x.sum={ok:false,util:NaN,text:'Projekt ungültig: '+e.message,code:'',mname:''};}});
    restore(cur,{keepVessel:true,silent:true});
    if(typeof renderVessel==='function') renderVessel(); }
  if(!o.silent){ try{localStorage.setItem('ad2000-last',JSON.stringify(snapshot()));}catch(e){} }
}
const store={get(){try{return JSON.parse(localStorage.getItem('ad2000-projects')||'{}');}catch(e){return {};}},
  set(o){try{localStorage.setItem('ad2000-projects',JSON.stringify(o));return true;}catch(e){return false;}}};
let pendingDel=null;
function listProjects(){
  const o=store.get(), names=Object.keys(o).sort((a,b)=>(o[b].t||0)-(o[a].t||0));
  $('projSum').textContent=names.length?names.length+' gespeichert':'';
  $('projList').innerHTML=names.map(n=>`<li><b title="${esc(n)}">${esc(n)}</b><small>${esc(byId[o[n].s.mod]?byId[o[n].s.mod].code:'')}</small>`+
    (pendingDel===n?`<button data-a="del2" data-n="${esc(n)}" class="del">Wirklich löschen</button><button data-a="cancel">Abbrechen</button>`
      :`<button data-a="load" data-n="${esc(n)}">Laden</button><button data-a="del" data-n="${esc(n)}" class="del">Löschen</button>`)+`</li>`).join('');
}
const msg=t=>{$('projMsg').textContent=t;};
$('projSave').addEventListener('click',()=>{ const n=$('projName').value.trim(); if(!n){msg('Bitte einen Projektnamen eingeben.');return;}
  const o=store.get(); o[n]={t:Date.now(),s:snapshot()}; msg(store.set(o)?`„${n}“ gespeichert.`:'Speichern in diesem Browser nicht möglich. Nutze „Als JSON kopieren“.'); listProjects(); });
$('projList').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const n=b.dataset.n, o=store.get();
  if(b.dataset.a==='load'&&o[n]){ try{restore(o[n].s);$('projName').value=n;msg(`„${n}“ geladen.`);}catch(err){msg(err.message);} }
  if(b.dataset.a==='del'){pendingDel=n;} if(b.dataset.a==='cancel'){pendingDel=null;}
  if(b.dataset.a==='del2'){delete o[n];store.set(o);pendingDel=null;msg(`„${n}“ gelöscht.`);}
  listProjects(); });
$('projExport').addEventListener('click',()=>{ const t=JSON.stringify({name:$('projName').value.trim()||'Projekt',...snapshot()},null,1);
  copyText(t,()=>msg('Projekt als JSON in die Zwischenablage kopiert.'),()=>{const f=$('projIO');f.hidden=false;f.value=t;f.select();msg('Text markiert – bitte manuell kopieren.');}); });
$('projImportBtn').addEventListener('click',()=>{ $('projIO').hidden=false; $('projImport').hidden=false; $('projIO').value=''; $('projIO').focus(); });
$('projImport').addEventListener('click',()=>{ try{ const s=JSON.parse($('projIO').value); restore(s); if(s.name) $('projName').value=s.name; msg('Projekt importiert.'); $('projIO').hidden=true; $('projImport').hidden=true; }catch(err){ msg('Import fehlgeschlagen: '+(err.message||'ungültiges JSON')); } });
// autosave last state
const autosave=()=>{try{localStorage.setItem('ad2000-last',JSON.stringify(snapshot()));}catch(e){}};
document.addEventListener('input',e=>{ if(!e.target.closest('.proj')) setTimeout(autosave,0); });
document.addEventListener('click',e=>{ if(e.target.closest('.pick')) setTimeout(autosave,0); });
listProjects();
function reportData(){ return lastReport?{...lastReport,project:$('projName').value.trim(),date:new Date()}:null; }
function buildReportData(){
  if(!lastRes) return null;
  const m=byId[mod], mt=curMat(), lab=id=>{const l=document.querySelector(`label[for="${id}"] span`);return l?l.firstChild.textContent.trim():id;};
  const sh=[['Berechnungsdruck','p','p','bar'],['Berechnungstemperatur','T','T','°C']];
  const matRows=[['Werkstoff','',mt?mt.name:'Eigener Werkstoff',''],...(mt?[['Norm / Erzeugnis','',[mt.std,mt.product].filter(Boolean).join(' · '),'']]:[]),
    ['Kennwert bei 20 °C','K20',$('K20').value,'N/mm²'],['Kennwert bei T','K',$('K').value+(kManual?' (manuell)':''),'N/mm²'],...(m.usesE?[['E-Modul bei T','E',$('E').value,'N/mm²']]:[])];
  const fac=[['Schweißnahtfaktor','v',$('v').options[$('v').selectedIndex].textContent,''],['Sicherheitsbeiwert','S',$('S').value,'–'],['Sicherheitsbeiwert Prüfung','S′',$('ST').value,'–'],['Minustoleranz','c1',$('c1').value,'mm'],['Korrosionszuschlag','c2',$('c2').value,'mm']].filter(row=>!(['ASME','EN 13445','EN 13480'].includes(m.group)&&['S','S′'].includes(row[1]))&&!(m.group==='ASME'&&row[1]==='v'));
  const fields=m.fields.filter(f=>f.type!=='heading'&&shown(f)).map(f=>{const el=$('f_'+f.id); let v=vals[mod][f.id];
    if(f.type==='select'&&el) v=el.options[el.selectedIndex]?el.options[el.selectedIndex].textContent:v; return [f.label,f.sym||'',v,f.unit||''];});
  return {app:'AD 2000 Rechner',help:m.help||'',module:{id:m.id,name:m.name,code:m.code,group:m.group},project:$('projName').value.trim(),
    date:new Date(),shared:sh.map(([l,s,id,u])=>[l,s,$(id).value,u]),material:matRows,factors:fac,fields,result:lastRes,
    svg:($('drawing').querySelector('svg')||{}).outerHTML||''};
}
// ---- Gesamtbehälter: collect components (full state snapshots), overview, combined report ----
function curSum(){ const r=lastRes, m=byId[mod]; if(!r) return {ok:false,util:NaN,text:'Eingaben prüfen',code:m.code,mname:m.name};
  const hl=r.headline||{}; return {ok:!!r.ok,util:r.noUtil?NaN:r.util,text:hl.text!=null?hl.text:`${H.fmt(hl.value)} ${hl.unit||''}`.trim(),code:m.code,mname:m.name}; }
const vmsg=t=>{$('vesMsg').textContent=t;};
function renderVessel(){
  const c=vessel.comps; $('vesName').value=vessel.name||'';
  const nok=c.filter(x=>!x.sum.ok).length, worst=c.reduce((a,x,i)=>Number.isFinite(x.sum.util)&&(a<0||x.sum.util>c[a].sum.util)?i:a,-1);
  $('vesSum').textContent=c.length?`${c.length} Bauteil${c.length===1?'':'e'} · ${nok?nok+' nicht erfüllt':'alle erfüllt'}`:'';
  $('vesList').innerHTML=c.map((x,i)=>`<li class="${i===activeComp?'act':''}"><span class="vd${x.sum.ok?'':' bad'}"></span><span class="vmain"><b title="${esc(x.name)}">${esc(x.name)} <small>${esc(x.sum.code)}</small></b>`+
    `<span class="vr">${esc(x.sum.text)}${Number.isFinite(x.sum.util)&&!/%/.test(x.sum.text)?' · '+H.fmt(x.sum.util*100,2)+' %':''}${i===worst&&c.length>1?' · maßgebend':''}</span></span>`+
    (x.del?`<button data-v="del2" data-i="${i}" class="del">Wirklich entfernen</button><button data-v="cancel" data-i="${i}">Abbrechen</button>`
      :`<button data-v="load" data-i="${i}">Bearbeiten</button>${i===activeComp?`<button data-v="save" data-i="${i}">Übernehmen</button>`:''}<button data-v="del" data-i="${i}" class="del">Entfernen</button>`)+`</li>`).join('')
    +(c.length?`<li><span class="vtot ${nok?'bad':'ok'}">${nok?`${nok} von ${c.length} Nachweisen nicht erfüllt`:'Alle Nachweise erfüllt'}</span></li>`:'');
  $('vesEdit').hidden=activeComp==null; if(activeComp!=null&&c[activeComp]) $('vesEdit').textContent=`Du bearbeitest „${c[activeComp].name}“. Änderungen mit „Übernehmen“ speichern.`;
}
function vRecompute(patch){ // re-evaluate all components (optionally patching their shared inputs), then return to the current state
  const cur=snapshot({noVessel:true}), ac=activeComp;
  try{vessel.comps.forEach(x=>{try{if(patch&&x.snap.shared) Object.assign(x.snap.shared,patch); restore(x.snap,{keepVessel:true,silent:true}); x.snap=snapshot({noVessel:true}); x.sum=curSum();}
    catch(e){x.sum={ok:false,util:NaN,text:'Projekt ungültig: '+e.message,code:'',mname:''};}});}
  finally{restore(cur,{keepVessel:true}); activeComp=ac; renderVessel(); autosave();}
}
$('vesName').addEventListener('input',()=>{vessel.name=$('vesName').value; autosave();});
$('vesAdd').addEventListener('click',()=>{ const m=byId[mod]; const name=$('vesComp').value.trim()||m.name;
  vessel.comps.push({name,snap:snapshot({noVessel:true}),sum:curSum()}); activeComp=vessel.comps.length-1; $('vesComp').value='';
  vmsg(`„${name}“ hinzugefügt.`); renderVessel(); autosave(); });
$('vesList').addEventListener('click',e=>{ const b=e.target.closest('button[data-v]'); if(!b) return; const i=+b.dataset.i, x=vessel.comps[i]; if(!x) return;
  if(b.dataset.v==='load'){ restore(x.snap,{keepVessel:true}); activeComp=i; vmsg(`„${x.name}“ geladen.`); }
  if(b.dataset.v==='save'){ x.snap=snapshot({noVessel:true}); x.sum=curSum(); vmsg(`„${x.name}“ aktualisiert.`); }
  if(b.dataset.v==='del') x.del=true; if(b.dataset.v==='cancel') delete x.del;
  if(b.dataset.v==='del2'){ vessel.comps.splice(i,1); if(activeComp===i) activeComp=null; else if(activeComp>i) activeComp--; vmsg(`„${x.name}“ entfernt.`); }
  renderVessel(); autosave(); });
$('vesApply').addEventListener('click',()=>{ if(!vessel.comps.length){vmsg('Noch keine Bauteile im Behälter.');return;}
  vRecompute({p:$('p').value,T:$('T').value}); vmsg(`p = ${$('p').value} bar und T = ${$('T').value} °C auf alle Bauteile übertragen und neu berechnet.`); });
function collectVessel(){ const cur=snapshot({noVessel:true}), ac=activeComp, ds=[], bad=[];
  try{vessel.comps.forEach(x=>{ try{restore(x.snap,{keepVessel:true,silent:true}); const d=reportData(); if(d){ d.part=x.name; d.project=vessel.name||d.project; ds.push(d); x.sum=curSum(); } else {bad.push(x.name);x.sum=curSum();}} catch(e){bad.push(x.name);x.sum={ok:false,util:NaN,text:'Projekt ungültig: '+e.message,code:'',mname:''};} });}
  finally{restore(cur,{keepVessel:true}); activeComp=ac; renderVessel();} return {ds,bad}; }
$('vesPrev').addEventListener('click',async()=>{ if(!vessel.comps.length){vmsg('Noch keine Bauteile im Behälter.');return;}
  const {ds,bad}=collectVessel(); if(bad.length){ vmsg(`Ungültige Eingaben in: ${bad.join(', ')}. Bitte korrigieren.`); return; }
  await AD.report.previewVessel({name:vessel.name||$('projName').value.trim()},ds,vmsg); });
$('vesPdf').addEventListener('click',async()=>{ if(!vessel.comps.length){vmsg('Noch keine Bauteile im Behälter.');return;}
  const btn=$('vesPdf'); btn.disabled=true; btn.textContent='Bericht wird erstellt …';
  const {ds,bad}=collectVessel();
  if(bad.length){ vmsg(`Ungültige Eingaben in: ${bad.join(', ')}. Bitte korrigieren.`); btn.disabled=false; btn.textContent='Gesamtbericht (PDF)'; return; }
  await AD.report.exportVesselPdf({name:vessel.name||$('projName').value.trim()}, ds, vmsg); btn.disabled=false; btn.textContent='Gesamtbericht (PDF)'; });
renderVessel();
// pin ("freeze") drawing card while scrolling; remembered per browser
function setPin(on){ const card=$('drawCard'),btn=$('pinBtn'); card.classList.toggle('pinned',on); btn.setAttribute('aria-pressed',String(on));
  btn.querySelector('span').textContent=on?'Angeheftet':'Anheften'; if(on) card.open=true; try{localStorage.setItem('ad2000-pin',on?'1':'0');}catch(e){} }
$('pinBtn').addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); setPin(!$('drawCard').classList.contains('pinned')); });
$('drawCard').addEventListener('toggle',()=>{ if(!$('drawCard').open&&$('drawCard').classList.contains('pinned')) setPin(false); });
try{ if(localStorage.getItem('ad2000-pin')==='1') setPin(true); }catch(e){}
AD.ui={setMod,setView,calc,snapshot,restore,reportData,collectVessel,fillMatSelect,asmeAtT,isCasting,thicknessBand,inBand,matchingBand,elasticTable,vessel:()=>vessel};
window.ADui=AD.ui;
setMod(mod);
try{const last=JSON.parse(localStorage.getItem('ad2000-last')||'null'); if(last) restore(last);}catch(e){}
})(globalThis.AD);
