# Third-party notices

Wandstark's own source code is licensed under the MIT License (see `LICENSE`). The standalone web build bundles the following third-party components. Each keeps its own licence, and the full licence texts are in `licenses/`.

| Component | Version | Files | Licence |
|---|---|---|---|
| jsPDF | 2.5.1 | `web/public/wandstark/vendor/jspdf.umd.min.js` | MIT — `licenses/MIT-jsPDF.txt` |
| jsPDF-AutoTable | 3.8.2 | `web/public/wandstark/vendor/jspdf.plugin.autotable.min.js` | MIT — `licenses/MIT-jspdf-autotable.txt` |
| PDF.js (Mozilla) | 3.11.174 | `web/public/wandstark/vendor/pdf.min.js`, `pdf.worker.min.js` | Apache License 2.0 — `licenses/Apache-2.0-pdfjs.txt` |
| IBM Plex Sans, IBM Plex Mono | — | `web/public/wandstark/fonts/*.woff2` | SIL Open Font License 1.1 — `licenses/OFL-1.1-IBM-Plex.txt` |

The single-page build (`index.html`) loads the same libraries from cdnjs.cloudflare.com and the fonts from Google Fonts at runtime instead of bundling them.

## Technical codes and data

The technical codes implemented (AD 2000-Merkblätter, EN 13445, EN 13480, EN 1092-1, EN material standards, ASME BPVC, API 579-1/ASME FFS-1, ASME B31G, ISO, DIN) are copyrighted by their publishers. They are **not** included in this repository. The code only implements their calculation rules and cites section numbers.

Material, steel-profile and flange values in `data/` are factual values compiled from public manufacturer datasheets and catalogues (e.g. ArcelorMittal, Tata Steel, Outokumpu, Eurometals, steel and tube producers), which are cited per entry. Verify them against the applicable standard before use.

Product and company names (TÜV NORD, DIMy, ASME, API and others) are used only to describe the context and the codes implemented. They belong to their owners. Wandstark is not affiliated with or endorsed by them.
