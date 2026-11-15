# Testing

```bash
./run-tests.sh
```

Runs every `tests/*.test.js` with Node and prints failing files with their first errors, plus a one-line summary (`N test files, M failing, checks x/y`). Each test file prints `PASS x/y` as its last line; the runner reads that line. A full run takes a few minutes because of the property suites.

## Kinds of tests

| Files | Purpose |
|---|---|
| `tests/<module>.test.js` | Worked examples with **independent hand arithmetic** written in the test (never by calling the module), failing cases, out-of-range cases |
| `tests/draw-<module>.test.js` | `draw()` for defaults, edge cases and NaN input: returns `<svg`, no `NaN`/`undefined`, all coordinates inside the viewBox. Writes SVGs to `out/` |
| `tests/tips-*.test.js` | Every field has a tip ≤ 220 characters, three input tips, drawing tags reference existing fields |
| `tests/mat*.test.js`, `tests/materials.test.js` | Material entries: schema, ascending temperatures, plausibility, source citation, sample values checked against the source tables |
| `tests/profiles.test.js`, `tests/b6-profiles.test.js`, `tests/flanges.test.js` | Catalogue data spot checks and section properties |
| `tests/r2-*.test.js` | **Property / fuzz suites** (hundreds of seeded random inputs per module): `p = pmax` passes and slightly above fails, monotonicity (more pressure → more thickness; thicker wall → higher pmax), headline/util/pmax/rows/formula agree, no non-finite value with `fail:false`, invalid inputs fail closed, exact boundaries at applicability limits |
| `tests/ui-material.test.js`, `tests/r2-ui.test.js` | UI logic in Node with a DOM stub: material autofill, thickness bands, E tables, snapshot round trips for every module, PDF content |

## Writing a test

```js
'use strict';
const assert = require('node:assert/strict');
const AD = require('../src/ad.js'); require('../data/materials.js'); require('../modules/b2.js');
const m = AD.modules.find(x => x.id === 'b2');
let pass = 0, total = 0;
const test = (name, fn) => { total++; try { fn(); pass++; } catch (e) { console.error('FAIL ' + name, e.message); process.exitCode = 1; } };

test('cone 30°, hand calculation', () => {
  const g = { p: 10, T: 20, K: 235, K20: 235, S: 1.5, ST: 1.1, v: 1, c1: 0, c2: 0, Da: 1000, sn: 10, phi: 30, junction: 'sharp', geoMode: 'angle' };
  const r = m.calc(g, AD.h);
  const expected = /* write the formula out by hand, citing the code section */ 0;
  assert.ok(Math.abs(r.headline.value - expected) < 1e-9);
});
console.log(`PASS ${pass}/${total}`);
```

Rules:

- Compute expected values independently. A test that calls the module to get its expectation proves nothing.
- Only change an existing expectation when it encoded a confirmed bug, and say so in a comment.
- Never weaken a safety check to make a test pass.

## Browser checks

There are no automated browser tests in the repository. After changes to shared files (`src/ui.js`, `src/report.js`, `src/style.css`, `src/ad.js`), open `index.html` and click through every module at desktop and phone width. Check the PDF preview and a vessel project as well. A headless Playwright script that opens every module and lists its status and error notes has been useful for this. After changes to one module, check only that module.
