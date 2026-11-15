# Working on Wandstark — guide for AI sessions and new contributors

Read this file first, then [README.md](README.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the header comment of `src/ad.js` (the module contract). [VERIFICATION.md](VERIFICATION.md) explains what has been reviewed and why some paths are deliberately blocked.

## What this is

A pressure-equipment strength calculator (AD 2000, EN 13445-3, EN 13480-3, ASME VIII-1, API 579-1, ASME B31G, PED). Engineers rely on the results. **A wrong "Erfüllt" (pass) is the worst possible bug.** A blocked calculation with a clear reason is acceptable; a wrong number is not.

## Commands

```bash
./run-tests.sh                                        # all tests (a few minutes); must end with "0 failing"
node tests/<file>.test.js                             # one test file
python3 build.py                                      # index.html
python3 build.py --standalone web/public/wandstark   # web app page
node web/test-guard.mjs                               # access-gate tests
```

No npm install is needed. Node ≥ 18, Python 3.

## Rules for calculation code

1. **Primary text first.** Every formula, factor and limit comes from the code text and has a section citation in a comment next to it (e.g. `// B9 §4.4.1, Gl. (10)`). Do not add links to unofficial copies of standards; cite standard, edition and section instead.
2. **Fail closed.** If input is invalid, out of scope, non-finite, or a rule cannot be verified, return `fail:true` with a German `'e'` note and `pmax:NaN`. Mark remaining assumptions `UNVERIFIED` in a comment plus a `'w'` note.
3. **Never relax a safety check to make a test pass.** Change a test expectation only if it encoded a confirmed bug, and say so.
4. **Consistency.** `util ≤ 1` ⇔ pass; `p = pmax` must pass and slightly above must fail; `formula`, `rows`, `headline`, `util`, `pmax` and `test` must show the same numbers. Use `H.fmt` (max. 2 decimals).
5. **Tests with independent arithmetic** for every change (see [docs/TESTING.md](docs/TESTING.md)). Property suites live in `tests/r2-*.test.js`; extend them when you touch a module.
6. **Saved projects must keep working.** Field ids and select values are stored in snapshots. If you rename one, add a migration in `restore()` (`src/ui.js`).

## Rules for UI texts (German)

- Natural, correct German; short but understandable on its own. No filler phrases.
- Abbreviations only where needed; every remaining one goes into `AD.glossary` (shown as a tap/hover long form).
- Use the correct symbols: **Da** = Außendurchmesser, **Di** = Innendurchmesser.
- `field.tip` explains what to enter (one or two sentences, ≤ 220 characters). `module.tips` are three input tips: what to do and why, readable without the form.
- Explanations open only via a click on the ⓘ button. No hover tooltips, no question-mark cursor.
- Keep different damage types separate (Risse, Kerben, Beulen, Nahtkorrosion each get their own answer); never lump them into one sentence as if they were the same.
- Rarely changed or derivable fields go into a folded "Weitere Parameter" heading (`{type:'heading', fold:true}`).

## Rules for drawings

- Built only with `H.draw` helpers; must never throw; no `NaN`; everything inside the viewBox.
- `H.draw.tag('fieldId', svg)` only on real geometry of input fields. Never tag derived quantities or material fields.
- Show the loss/feature on the side the user selected (e.g. inner metal loss drawn on the inner surface).

## Shared files

`src/ad.js`, `src/ui.js`, `src/report.js`, `src/style.css` and `src/body.html` affect every module. After changing them, check **all** modules in the browser (desktop and phone width), the PDF preview and a vessel project. After changing one module, check that module only.

## Things that are deliberately blocked (do not "fix" by removing the block)

- B6 half-pipe heating channels (B6 §7.4.2 proof not implemented).
- B6 catalogue profiles that exceed the EC3 class-3 slenderness limits for the chosen material.
- API 579 Part 5 assessment of pipe bends (Level 1 covers straight shells only).
- B3 β and B5 C must be read from the code charts and entered; no presets.
- B8 when the material's product thickness band cannot be checked against the flange.
- EN castings without the casting route; single-run governing welds in EN 13445.
- Several S3 sub-checks and the overall B13 proof.

Lifting a block needs the primary rule, an implementation, independent tests and a review.

## Secrets and deployment

Never commit secrets. The web app's access code and session secret are Cloudflare Worker secrets (`PASSCODE`, `SESSION_SECRET`). The deploy token is read from `CLOUDFLARE_API_TOKEN`. See [docs/DEPLOY.md](docs/DEPLOY.md).

## Where to start for common tasks

| Task | Look at |
|---|---|
| Fix a formula | `modules/<file>.js` (citations in comments), its `tests/<id>.test.js` and `tests/r2-*.test.js` |
| Change a field explanation or tip | `modules/*-tips.js` or the module's `fields` |
| Material values | `data/mat_*.js` (schema in `data/SCHEMA.md`), autofill logic in `src/ui.js` (`applyMaterial`, `applyModuleMaterial`, `checkMaterialBand`, `elasticTable`) |
| PDF report | `src/report.js` |
| Highlighting in drawings | the module's `draw()` (`H.draw.tag`), `hilite()` in `src/ui.js` |
| New module | "Adding a module" in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
