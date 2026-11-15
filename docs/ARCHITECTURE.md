# Architecture

Wandstark is plain JavaScript with no framework, no bundler and no npm dependencies. Every file is an IIFE that reads or extends one global object, `AD`. `build.py` concatenates the files in a fixed order into a single HTML page. The same files run unchanged in Node for the tests.

```
src/ad.js          registry + helpers + drawing kit          (loaded first)
data/materials.js  AD.materials, E tables                    (then data/mat_*.js append entries)
data/profiles.js   AD.profiles (IPE, HEA, HEB, UPN, L, T, FL, RHS)
data/flanges.js    EN 1092-1 standard flanges
modules/*.js       AD.register({...}) per component; *-tips.js only add texts
src/ui.js          browser UI (reads AD.modules, AD.materials, ...)
src/report.js      PDF report and preview
```

Load order matters: `build.py` lists `order = [...]` for modules, then appends any other module file alphabetically. Tip files must load after the module they decorate (e.g. `ffs-tips.js` after `ffs.js`; `b1-tips.js`, `b6-tips.js`, `b9-tips.js` load after all base modules because they sort after them).

## Units and conventions

- Pressure in **bar**, stresses in **N/mm²** (= MPa), lengths in **mm**, temperature in **°C**. 10 bar = 1 N/mm²; formulas usually contain `/10` or `20·K/S·v`.
- Numbers shown to users go through `H.fmt` / `H.n` (German decimal comma, at most 2 decimals; values below 0.1 keep two significant digits).
- UI texts are German. Keep them natural and short; avoid abbreviations, and add any that remain to `AD.glossary` (the UI turns them into `<abbr>` with a tap/hover long form).

## The module contract (`src/ad.js` header is the authoritative version)

```js
AD.register({
  id: 'b2',              // stable id — stored in saved projects, never rename
  name: 'Kegel', code: 'B2', group: 'Schalen',   // group = picker tab (see GROUPS in ui.js)
  icon: '<path …/>',     // inner SVG for a 44×34 viewBox
  usesE: false,          // true if the module needs the elastic modulus g.E
  fields: [ {id, label, sym, unit, def, type?:'num'|'select', options?, min?:'pos'|'zero'|'any',
             when?: {otherField: value|[values]} | (vals)=>boolean,   // visibility + validation
             tip?: 'explanation shown on ⓘ click', help?: 'small permanent hint'},
            {type:'heading', id:'h_more', label:'Weitere Parameter', fold:true} ],
  help: 'one paragraph: scope and edition',
  tips: ['three self-explanatory input tips'],
  calc(g, H) { return result },
  draw(g, H, r) { return '<svg …>' }   // optional, built only with H.draw helpers
});
```

`g` contains the shared inputs (`p` bar, `T` °C, `K20`, `K` N/mm², `E`, `S`, `ST`, `v`, `c1`, `c2`) plus the module's own fields (numbers; selects as strings). Hidden numeric fields arrive as numbers and may be `NaN` — ignore them.

`calc` returns:

```js
{ headline:{value, unit, label, of?, text?}, util, pmax /*bar, NaN if n/a*/, test /*null | {PT, req, have, unit, ok, note}*/,
  rows:[[label, symbol, value, unit]], notes:[[cls, text]] /* '' info, 'w' warning, 'e' error */,
  fail:Boolean, formula:'multi-line calculation path with the numbers actually used',
  noUtil?, stats?, testNote? }
```

Rules every module follows (and new code must keep):

- **Fail closed.** Invalid input, out-of-scope geometry, non-finite intermediate results or an unverifiable rule → `fail:true`, an `'e'` note, `pmax:NaN`. Never return a pass you cannot justify.
- **Cite the code section** in a comment next to each formula. Mark assumptions that could not be checked against the code text with `UNVERIFIED` and a `'w'` note.
- `util ≤ 1` ⇔ pass (when there is no other error); at `p = pmax` the module must pass and slightly above it must fail (there are property tests for this).
- `formula`, `rows`, `headline`, `util`, `pmax` and `test` must agree numerically.
- `test.ok === null` means "test pressure is reported but not assessed" (e.g. ASME UG-99); the UI shows a warning but does not block.

### Drawings

`draw()` must never throw. On invalid input it returns a small "Maße eingeben" drawing. Use only `H.draw` (`fit, svg, line, poly, pline, rect, circle, path, text, dim, leader, centre, tag, titleBlock`): ISO 128 line classes (`o` outline, `t` thin, `c` centre, `h` hidden), hatched cut material, real dimension values, a title block at the bottom right, viewBox width 420.

`H.draw.tag('fieldA fieldB', svg)` marks the SVG as belonging to those input fields. When a field is focused, the UI highlights the tagged elements in red. If a field has no tagged element, the UI says "„…“ ist nicht in der Zeichnung dargestellt". **Only tag real geometry of input fields** — never derived quantities (e.g. a length computed from two inputs) and never material fields.

## UI (`src/ui.js`)

- `vals[moduleId]` holds the raw input strings for every module. `renderFields()` draws the form, `shown(field)` evaluates `when`, `read()` parses and validates, and `calc()` runs the module, merges material notes and renders the result.
- **Approval logic** (in `calc()`): a result shows "Erfüllt" only if `util` is finite and ≤ 1, `fail` is false, there are no `'e'` notes from the module or the material checks, no non-finite numbers, and `test.ok !== false`.
- **Materials**: `fillMatSelect`, `applyMaterial` (K, K20, E, S from the selected entry; `H.atT` interpolation), `applyModuleMaterial` (module-specific values such as Rp/Rm for EN modules, ASME S/ST via `asmeAtT`, SMTS for B31G), `checkMaterialBand` (product thickness band vs. entered wall thickness; switches to the matching band or blocks), and `elasticTable` (ferritic / austenitic / sourced duplex table; nickel, aluminium, copper and titanium need manual E). Manual overrides are tracked in `kManual`, `eManual`, `k20Manual` and `modTouched`, and saved in snapshots. ASME modules start with SA-516 Gr 70 unless the user chose a material (`asmeDefaultMat`).
- **Texts**: `field.tip` opens only when the ⓘ button is clicked (no hover tooltip). `abbrify()` wraps glossary abbreviations in tips, help texts and notes.
- **Drawing card**: `renderDrawing`, `hilite` (field highlighting), `setPin` (pin the drawing while scrolling).
- **Projects**: `snapshot()` / `restore(s, {keepVessel, silent})`. Restore first initialises every module with its defaults, then applies migrations for older snapshots (e.g. renamed select values). Projects live in `localStorage` (`ad2000-projects`, last state `ad2000-last`, view `ad2000-view`, pin `ad2000-pin`).
- **Vessel projects**: a list of component snapshots (`vessel.comps`). `renderVessel`, `vRecompute` and `collectVessel` recompute every component for the combined report.
- `AD.ui = {...}` exposes helpers for the Node UI tests (`tests/ui-material.test.js`, `tests/r2-ui.test.js` boot the UI against a DOM stub).

## Report (`src/report.js`)

`buildPdf(data, ext)` creates the single-component report: parameters, schematic drawing (SVG → PNG), results, Hinweise und Auswertung, and the module's scope. `buildVesselPdf` adds a cover page with an overview and one section per component. `previewDoc` renders the PDF with pdf.js into a modal before download. `savePdf` uses the claude.ai `downloads` capability when available, otherwise a normal Blob download. jsPDF, AutoTable and pdf.js are loaded lazily, from cdnjs or from `vendor/` in the standalone build.

## Build (`build.py`)

- `python3 build.py` → `index.html`: one page fragment (title, style, body, script) for the claude.ai Artifact runtime. Fonts come from Google Fonts, PDF libraries from cdnjs.
- `python3 build.py --standalone <dir>` → `<dir>/index.html`: a full HTML document with self-hosted fonts (`fonts/`), vendor scripts (`vendor/`), no third-party requests, and a site footer.

## Web app (`web/`)

A Cloudflare Worker (`web/src/worker.js`) serves `web/public/` for `tinyjar.app/wandstark*` and checks a 4-digit access code before every asset (`run_worker_first`). Sessions are HMAC-signed cookies. A Durable Object (`Guard`) rate-limits wrong codes per IP and globally. `/wandstark/about/`, `/wandstark/privacy/` and `/wandstark/fonts/` are public. See [DEPLOY.md](DEPLOY.md).

## Adding a module

1. Create `modules/<id>.js` with `AD.register({...})`, following the contract above. Cite every formula.
2. Add `tip`s for all fields, a `help` paragraph and three `tips`.
3. Add `draw()` with tags on real input geometry.
4. Add `tests/<id>.test.js` (independent hand arithmetic, failing and out-of-range cases) and `tests/draw-<id>.test.js` (no throw, no NaN, inside the viewBox).
5. If it belongs to a new group, add the group to `GROUPS` in `src/ui.js` and to the contract comment in `src/ad.js`.
6. Run `./run-tests.sh` and `python3 build.py`, then open the page and check the module in the browser (desktop and phone width).
