/* AD core: module registry + pure helpers. Runs in the browser and in node (tests).
 *
 * MODULE CONTRACT — AD.register({...}):
 *   id      unique short id, e.g. 'b2'
 *   name    German display name, e.g. 'Kegel'
 *   code    Merkblatt label, e.g. 'B2'
 *   group   picker group: 'Schalen' | 'Böden' | 'Ausschnitte' | 'T-Stücke' | 'Verbindungen' | 'Zusatzlasten' | 'EN 13445' | 'ASME' | 'Richtlinie'
 *   icon    inner SVG markup for a 44x34 viewBox, stroke=currentColor, no fill
 *   usesE   true if the module needs the elastic modulus g.E (N/mm²)
 *   fields  [{id,label,sym,unit,def,help?, type?:'num'|'select', options?:[[value,label]],
 *             min?: 'pos'(default, >0) | 'zero'(>=0) | 'any'(finite),
 *             when?: {otherFieldId: value | [values]}  -> field shown (and validated) only when matching;
 *                    hidden numeric fields arrive in g as parsed numbers (may be NaN) — ignore them }
 *           heading rows: {type:'heading', id:'h_xyz', label:'Versteifungsringe', when?:{...}} (id required if when is used)
 *   help    optional one-paragraph hint shown under the fields
 *   tips    optional array of input tips (strings) shown as 'Eingabetipps'
 *   field.tip optional explanation of a field (tooltip on hover, ⓘ toggle on touch)
 *   drawings: wrap elements with H.draw.tag('fieldId otherId', svg) to highlight them while that field is active
 *   calc(g, H) -> result
 *   draw(g, H, r) -> SVG string (optional) technical drawing of the component, built ONLY with H.draw helpers
 *           (r = calc result, may be null when inputs are invalid). Use real dimensions from g, scaled with H.draw.fit.
 *           Conventions (ISO 128): outlines 'o', thin 't', centre lines 'c', hidden 'h'; cut material hatched;
 *           dimension lines via H.draw.dim with the real value in mm; title block via H.draw.svg(…, {title}).
 *
 * g = shared inputs + this module's fields (numbers; select values as strings):
 *   p bar (internal overpressure, or external pressure for B6), T °C, K20 N/mm², K N/mm² at T,
 *   E N/mm² at T, S, ST (test safety factor S'), v (weld factor), c1 mm, c2 mm, plus module fields.
 *
 * result = {
 *   headline: {value:Number, unit:'mm', label:'mm erforderlich', of:'ausgeführt 8,0 mm', text?:String (shown instead of value, e.g. 'Kat. II')},
 *   noUtil:   optional true -> hide the 'Ausnutzung' stat (e.g. classification modules); stats?: [[valueString,label]] extra stat tiles
 *   util:     Number   ratio required/available (<=1 passes)
 *   pmax:     Number   allowable pressure in bar (NaN if not applicable)
 *   test:     null | {PT:Number bar, req:Number, have:Number, unit:'mm', ok:Boolean, note:String}
 *   rows:     [[label, symbol, value:Number, unit]]   intermediate values for the table
 *   notes:    [[cls, text]]   cls: '' info, 'w' warning, 'e' error (errors should also set fail)
 *   fail:     Boolean  true when any validity/applicability check fails
 *   formula:  String   multi-line calculation path with substituted numbers
 * }
 * Units throughout: p in bar, stresses N/mm², lengths mm. 10 bar = 1 N/mm².
 */
(function(root){
  const AD = root.AD || (root.AD = {});
  AD.modules = AD.modules || [];
  AD.materials = AD.materials || [];
  AD.register = m => { AD.modules.push(m); };
  // At most 2 decimals (user preference); values below 0.1 keep 2 significant digits so they don't collapse to 0,00.
  const fmt = (x,d=2) => { if(!Number.isFinite(x)) return '–';
    if(d>2){ const ax=Math.abs(x); if(ax>0&&ax<0.1){ const sig=Math.min(6,Math.max(2,1-Math.floor(Math.log10(ax)))); return x.toLocaleString('de-DE',{minimumFractionDigits:sig,maximumFractionDigits:sig}); } d=2; }
    return x.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d}); };
  AD.h = {
    fmt,
    n: x => fmt(x, Math.abs(x) < 0.1 && x !== 0 ? 3 : 2),
    // PED test pressure, p taken as PS
    PT: g => Math.max(1.25*g.p*g.K20/g.K, 1.43*g.p),
    // monotone root finder: smallest x in [lo,hi] with f(x) >= 0 (f increasing)
    solve(f, lo, hi, it=100){ if(f(lo)>=0) return lo; if(f(hi)<0) return NaN;
      for(let i=0;i<it;i++){ const m=(lo+hi)/2; if(f(m)>=0) hi=m; else lo=m; } return hi; },
    // linear interpolation in [[x,y],...] sorted by x; NaN outside range
    interp(tbl, x){ if(!tbl||!tbl.length) return NaN;
      if(x < tbl[0][0] || x > tbl[tbl.length-1][0]) return NaN;
      for(let i=0;i<tbl.length-1;i++){ const [x0,y0]=tbl[i],[x1,y1]=tbl[i+1];
        if(x>=x0 && x<=x1) return x1===x0 ? y0 : y0+(y1-y0)*(x-x0)/(x1-x0); }
      return tbl[tbl.length-1][1]; },
    // value at T, holding the 20 °C value for T below the first table point (e.g. 20..50 °C)
    atT(tbl, T){ if(!tbl||!tbl.length) return NaN; if(T <= tbl[0][0]) return tbl[0][1]; return AD.h.interp(tbl, T); }
  };

  /* Technical-drawing helpers (SVG strings). Coordinates in drawing units of the viewBox.
   * Classes: o = outline (thick), t = thin, c = centre line (dash-dot), h = hidden (dashed), d = dimension. */
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const r2=x=>Math.round(x*100)/100;
  const D = AD.h.draw = {
    // scale factor so a real-size box (mm) fits into (bw x bh) drawing units with padding
    fit:(realW,realH,bw,bh,pad=40)=>Math.min((bw-2*pad)/Math.max(realW,1e-9),(bh-2*pad)/Math.max(realH,1e-9)),
    svg(w,h,body,opt={}){
      const title=opt.title?D.titleBlock(w,h,opt.title,opt.sub||''):'';
      return `<svg class="tz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opt.title||'Zeichnung')}" xmlns="http://www.w3.org/2000/svg">`+
        `<defs><pattern id="tzh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" class="hl"/></pattern>`+
        `<pattern id="tzh2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="4" class="hl"/></pattern>`+
        `<marker id="tza" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1.5 L10 5 L0 8.5 z" class="ar"/></marker></defs>`+
        `<rect x="1" y="1" width="${w-2}" height="${h-2}" class="frame"/>`+body+title+`</svg>`;
    },
    line:(x1,y1,x2,y2,cls='o')=>`<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" class="${cls}"/>`,
    // hatch: false | true | 2 (opposite direction, for adjacent parts)
    poly:(pts,cls='o',hatch=false)=>`<polygon points="${pts.map(p=>r2(p[0])+','+r2(p[1])).join(' ')}" class="${cls}${hatch?' cut'+(hatch===2?'2':''):''}"/>`,
    pline:(pts,cls='o')=>`<polyline points="${pts.map(p=>r2(p[0])+','+r2(p[1])).join(' ')}" class="${cls}" fill="none"/>`,
    rect:(x,y,w,h,cls='o',hatch=false)=>`<rect x="${r2(Math.min(x,x+w))}" y="${r2(Math.min(y,y+h))}" width="${r2(Math.abs(w))}" height="${r2(Math.abs(h))}" class="${cls}${hatch?' cut'+(hatch===2?'2':''):''}"/>`,
    circle:(cx,cy,r,cls='o',hatch=false)=>`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" class="${cls}${hatch?' cut'+(hatch===2?'2':''):''}"/>`,
    path:(d,cls='o',hatch=false)=>`<path d="${d}" class="${cls}${hatch?' cut'+(hatch===2?'2':''):''}"/>`,
    text:(x,y,t,anchor='middle',cls='tx',rot=0)=>`<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" class="${cls}"${rot?` transform="rotate(${rot} ${r2(x)} ${r2(y)})"`:''}>${esc(t)}</text>`,
    // linear dimension between two points, offset perpendicular (drawing units, sign = side); text = label (e.g. 'Da 508')
    dim(x1,y1,x2,y2,off,text){
      const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,sg=Math.sign(off)||1;
      const a=[x1+nx*off,y1+ny*off],b=[x2+nx*off,y2+ny*off];
      let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90||ang<=-90) ang+=180;
      const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      return `<g class="dm">`+D.line(x1+nx*sg*2,y1+ny*sg*2,a[0]+nx*sg*4,a[1]+ny*sg*4,'d')+D.line(x2+nx*sg*2,y2+ny*sg*2,b[0]+nx*sg*4,b[1]+ny*sg*4,'d')+
        `<line x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}" class="d" marker-start="url(#tza)" marker-end="url(#tza)"/>`+
        `<text transform="translate(${r2(mx)} ${r2(my)}) rotate(${r2(ang)})" y="-3" text-anchor="middle" class="tx dt">${esc(text)}</text></g>`;
    },
    // leader with label: arrow at (x1,y1) pointing to the part, label at (x2,y2)
    leader:(x1,y1,x2,y2,text,anchor='start')=>`<g class="dm"><line x1="${r2(x2)}" y1="${r2(y2)}" x2="${r2(x1)}" y2="${r2(y1)}" class="d" marker-end="url(#tza)"/>${D.text(x2+(anchor==='start'?3:-3),y2-3,text,anchor,'tx dt')}</g>`,
    centre:(x1,y1,x2,y2)=>D.line(x1,y1,x2,y2,'c'),
    // group elements belonging to input field(s) -> highlighted when the field is focused/hovered
    tag:(ids,s)=>`<g data-p="${ids}">${s}</g>`,
    // title block bottom-right; keep title ≤ 28 and sub ≤ 44 characters
    titleBlock(w,h,title,sub){ const bw=Math.min(240,w*0.6), bh=30, x=w-bw-1, y=h-bh-1;
      return `<g class="tb"><rect x="${r2(x)}" y="${r2(y)}" width="${r2(bw)}" height="${bh}" class="t frame2"/>`+
        D.line(x,y+16,x+bw,y+16,'t')+D.text(x+6,y+12,title,'start','tx tb1')+D.text(x+6,y+26,sub,'start','tx tb2')+`</g>`; }
  };
  if (typeof module !== 'undefined') module.exports = AD;
})(typeof globalThis !== 'undefined' ? globalThis : window);
