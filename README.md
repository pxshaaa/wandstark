# Wandstark

Strength calculations for pressure vessels, done in seconds instead of hours with the rulebook.

**Wandstark** is a browser-based strength calculator for pressure equipment. It computes required wall thicknesses and allowable pressures for shells, heads, cones, nozzles, pipe tees, flanges, stiffening rings and supports, assesses corrosion damage, and classifies equipment under the EU Pressure Equipment Directive.

Live (access code required): <https://tinyjar.app/wandstark/> · About page: <https://tinyjar.app/wandstark/about/>

The user interface is in German. Code comments, notes and documentation are partly German (engineering terms) and partly English.

> **Prototype — no warranty.** Wandstark is not validated against approved software and is not affiliated with TÜV NORD or any other inspection body. Results do not replace a review by an approved body. The person who uses the results remains responsible for the design. See [Disclaimer](#disclaimer).

## Why this exists

Pressure vessels and piping are designed to published technical codes: in Germany mainly the **AD 2000-Merkblätter**, in Europe **EN 13445** and **EN 13480**, internationally the **ASME Boiler and Pressure Vessel Code**. The formulas, factors and limits are written down in those codes. In practice, inspection bodies, manufacturers and engineering offices run them in specialised, mostly proprietary desktop software (one well-known example is DIMy by TÜV NORD). Such software is licensed per workstation and is hard to access for individuals, small offices and teaching.

Wandstark implements the same published rules independently: in the browser, on desktop and phone, with a schematic drawing, the full calculation path with the numbers used, applicability notes and a PDF report — also for a whole vessel made of several components. It uses only the code texts and public material, flange and profile tables. It contains no code or data from proprietary programs.

## What it calculates

31 calculation modules in 11 groups — see [docs/MODULES.md](docs/MODULES.md):

- AD 2000: B1 (cylinders, spheres), B2 (cones), B3 (dished heads), B4 (bolted dished heads), B5 (flat ends), B6 (external pressure incl. stiffening rings), B7/B8 (bolts, flanges), B9 (nozzles), B10 (thick-walled cylinders), B13 (bellows), S3 (supports)
- Pipe tees: AD 2000 B9 and EN 13480-3 §8.4
- EN 13445-3 shells, heads, cones · EN 13480-3 pipes and bends · ASME VIII-1 UG-27/32/34
- Assessment: API 579-1 Part 4 and 5, ASME B31G
- PED 2014/68/EU category

Features: material database (~350 entries: EN, old DIN, ASME II-D, line pipe, tubes, forgings, castings) with temperature interpolation, catalogue steel profiles and EN 1092-1 flanges, drawings with field highlighting, field explanations and glossary, projects stored in the browser, vessel projects with a combined PDF report, PDF preview.

## Quick start

Requirements: Node.js ≥ 18 (tests) and Python 3 (build). No npm dependencies.

```bash
./run-tests.sh                       # all tests; prints failures and a one-line summary
python3 build.py                     # builds index.html (single self-contained page)
open index.html                      # or any static file server
python3 build.py --standalone web/public/wandstark   # page for the self-hosted web app
```

`index.html` loads fonts and the PDF libraries from public CDNs. The `--standalone` build self-hosts them (`web/public/wandstark/fonts`, `vendor`).

## Repository layout

| Path | Content |
|---|---|
| `src/ad.js` | Module registry, the **module contract** (header comment), shared helpers, drawing helpers |
| `src/ui.js` | User interface: fields, material autofill, validation, results, drawings, projects, vessel projects |
| `src/report.js` | PDF report (jsPDF + AutoTable), PDF preview (pdf.js) |
| `src/body.html`, `src/style.css` | Page markup and styles |
| `modules/*.js` | One file per standard / component family; `*-tips.js` add texts only |
| `data/*.js` | Materials, steel profiles, standard flanges (see `data/SCHEMA.md`) |
| `tests/*.test.js` | Node tests, one or more per module; `r2-*` are property/fuzz suites |
| `build.py` | Concatenates everything into one HTML page |
| `web/` | Cloudflare Worker that serves the standalone page behind an access code |
| `docs/` | Architecture, modules, testing, deployment |
| `VERIFICATION.md` | Log of the review and verification rounds |
| `AGENTS.md` | Working rules for AI coding sessions (read this first in a new session) |

## Documentation

- [AGENTS.md](AGENTS.md) — start here if you are an AI assistant or a new contributor
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the code fits together, module contract, UI and report
- [docs/MODULES.md](docs/MODULES.md) — all modules with ids, files and scope
- [docs/TESTING.md](docs/TESTING.md) — test strategy and how to add tests
- [docs/DEPLOY.md](docs/DEPLOY.md) — building and deploying the web app
- [VERIFICATION.md](VERIFICATION.md) — what was reviewed and fixed, and what is still open

## Sources and copyright

The technical codes (AD 2000, EN, ASME, API, ISO, DIN) are copyrighted by their publishers and are **not** included in this repository. The code implements their published calculation rules and cites the relevant sections (e.g. "B9 §4.4.1", "EN 13480-3 §8.4.3") so results can be checked against a licensed copy. Links to unofficial copies of standards are deliberately not included; where a source was such a copy, the citation reads "(Normtext, nicht verlinkt)". Material, flange and profile values were compiled from public manufacturer datasheets and catalogues, which are linked where available; check them against the applicable standard before relying on them.

Names such as TÜV NORD, DIMy, ASME or API are used only to describe the context and the codes implemented. Wandstark is not affiliated with, endorsed by or derived from any of them.

## Disclaimer

This software is provided "as is", without warranty of any kind (see [LICENSE](LICENSE)). It is a prototype. Pressure equipment can fail dangerously. Never use Wandstark as the only basis for design, manufacture, repair, operation or approval of pressure equipment. Every result must be checked by a qualified engineer against the current edition of the applicable code, and approved where the law requires it.

Where the code text could not be verified, the modules fail closed: they show an error instead of a possibly wrong "Erfüllt" (pass). Remaining unverified assumptions are marked `UNVERIFIED` in the code and shown as warnings.

## License

Wandstark source code: [MIT License](LICENSE). Bundled third-party components keep their own licences — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
