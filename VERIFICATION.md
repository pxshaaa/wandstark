# Unabhängige Prüfung – 13.11.2026

8 unabhängige Claude-Prüfer (nur lesend, eigene Nachrechnung, öffentliche Quellen) + 2 Klärungsprüfer.

| Bereich | Ergebnis | Behoben |
|---|---|---|
| B1/B3/B4/B5/B10 + Kern | 76 Nachrechnungen ok; 5 schwer, 3 geringfügig | fail-Flag bei util>1 (B1, B3, B5), 2-mm-Minimum B5, E-Modul nach Werkstofftyp |
| B2 Kegel, B6 Außendruck | B6 0,00 % Abweichung; B2: kein Außendruck-Hinweis, 8 Koeffizienten-Tippfehler | Hinweis "nur Innendruck", 8 Koeffizienten (φ 10/20/30/50/60/70°) gegen Scan korrigiert (max. Δs 0,44 %) |
| B9, B9k, B7/B8, Flansche | 0,00 % Abweichung; 58 Flanschmaße ok | – |
| S3/1, S3/2, S3/4, B13 | 1 kritisch (S3/4 vorbelegte Diagrammwerte), 1 schwer | Tafel-/Diagrammwerte ohne Vorbelegung, Bestätigung deckt Tafel 1 + Bilder 2–5 |
| EN 13445, EN 13480, ASME | alle Formeln exakt; 1 schwer (RmT Austenit) | Fehlermeldung + Feld wird eingeblendet, wenn Rm,T fehlt |
| API 579, B31G, PED | 0 kritisch/schwer; 19 PED-Grenzpaare ok | – |
| EN-Werkstoffe | >150 Werte; 4 Verdachtsfälle | alle 4 gegen Primärtabellen als korrekt bestätigt |
| Leitungsrohr, DIN alt, ASME, Profile | 0 Fehler; 1 Formalie | replacedBy 17 Mn 4 |

## Nicht unabhängig belegbar (kostenpflichtige / nicht zugängliche Primärtexte)
- AD 2000 B10 Obergrenze Da/Di (1,5 gesetzt, konservativ), B3-Kalottenhöhen, B4 β (als UNVERIFIED markiert), B5 Tafel-1-C-Werte (Eingabe)
- S3/1 und S3/4 Gleichungen (nur Plausibilität), S3/2 Satteltragfähigkeit (Teilnachweis, sperrt)
- API 579 Tabelle 5.2 Folias-Werte, B31G-Anhangbeispiel, PED Tabellen 3–6, 8, 9 (nur Selbstkonsistenz)
- Großteil ASME II-D Table 1A (nur 8 Werte unabhängig bestätigt), DIN-Warmwerte über 20 °C

## Quellen-Nachrecherche (13.11.2026, 4 Rechercheure)
Quelle u. a. AD 2000 Taschenbuch 2016 ((Normtext, nicht verlinkt)).
| Punkt | Ergebnis |
|---|---|
| B10 Da/Di-Grenze | gefunden: 1,2 < Da/Di ≤ 1,5 (S. 324) – Code korrekt; Gl. (1)–(3) korrekt |
| B3 Kalotte/Krempe, DIN 28011/28013 | gefunden (S. 205–217) – R, r, h2, (se−c)/Da, Kalottennachweis korrekt |
| B4 β | gefunden (S. 218–222): β1 = 1 + 0,833·√(R/t)·sinα·cosα, sinα = di/(2R), β ≥ 1,85 – **Code korrigiert** (vorher ohne sinα·cosα, überkonservativ) |
| S3/1 Standzarge | gefunden (S. 831–832): Gl. (23), (24), (27) inkl. 0,9 korrekt; Beulnachweis verweist auf DASt 013 (Modul sperrt korrekt) |
| S3/4 Tragpratzen | gefunden (S. 856–862): Gl. (1)–(5), Tafel 2, Bilder 2–5, Grenzen korrekt; Kommentar §7.3→§7.4 korrigiert |
| Tragösen | in keinem Merkblatt S3/0–S3/7 geregelt – "nicht AD" korrekt |
| PED Anhang II Tab. 1–9 | gefunden (Richtlinientext S. 69–73) – alle Grenzen exakt korrekt |
| DIN 17175, 17440, 17243 Warmwerte | gefunden – 23/23 Sorten exakt; 17 Mn 4 um 400/450 °C ergänzt |
| DIN 17155, 17245 Warmwerte | nicht frei verfügbar – bleiben 20-°C-only |
| ASME II-D Table 1A/Y-1 | nicht frei verfügbar (einzige Vorschau offline) – offen |
| API 579 Tab. 5.2 (Folias) | nicht frei verfügbar – offen |
| B31G-2012 Beispiel | existiert in Ausgabe 2012 nicht (erst 2023) |

## 14.11.2026 — Full sweep (Codex gpt-6.1-sol medium, 6 reviewers) + Astra medium (calc + texts)
- Astra: 1 calc issue (tee extruded > 0,8) + 27 text issues + 8 feedback gaps — all fixed.
- Sol sweep: 37 findings (9 critical, 15 major), all fixed with regression tests:
  B1/B3/B5/B2 (9), B6 catalogue A/Iy cap (critical) + tags, B9/B9k/tee (7), B7/B8/S3 (3),
  EN 13445/13480 castings (2 critical), EN heads corroded Di, EN single-run welds, ASME UG-32(e) cap, UG-99 note, FFS tags,
  materials/UI (6 critical): ASME sparse interpolation, cast autofill block, snapshot overrides, duplex E, thickness bands, missing A,
  validation order, search/report binding, bolting stresses.
- Post-merge: E fallback restored (ferritic / austenitic / duplex sourced; Ni/Al/Cu/Ti manual), EN product/weld defaults = common case, B10 defaults 300×40.
- 53 test files, 4106/4106 checks; browser sweep of all 31 modules matches previous release, PDF preview + vessel OK.
- Not covered: fixes not re-reviewed by a second sweep; drawings PNG-checked only for tee + corrosion.

## 14.11.2026 — Round 2 deep hunt (8 Codex gpt-6.1-sol medium review+fix workers)
- ~70 bugs fixed across all scopes; property/fuzz suites added (tests/r2-*.test.js: pmax round trip, monotonicity, boundary values, invalid inputs, oracles, snapshot round trips).
- Main-agent corrections after merge: B2 angle from dimensions WITH knuckle implemented exactly (L = ΔR·cotφ + (r+s)·tan(φ/2)) instead of blocking;
  ASME UG-99 test state (pressure only) informs instead of blocking; ASME modules auto-select SA-516 Gr 70 if no ASME material chosen.
- Deliberately fail-closed (documented): B6 catalogue UPN/T/RHS and all L-profiles (axis/unsymmetric bending not verified; use IPE/HE/FL or "Eigene Maße" for U/T/RHS);
  API 579 Part 5 with pipe bends; B3 β and B5 C must be entered (no preset); B8 needs a material whose thickness band fits the flange.
- 61 test files, 48 777/48 777 checks; browser sweep of all modules, PDF preview, vessel project OK.

## 14.11.2026 — B6 ring profiles L/UPN/T/RHS, inside rings
- Catalogue L (54), UPN (14), T (10), RHS (14) records with tabulated A, Iy, Iz, centroid distances; L with Iu, Iv, Iyz (ArcelorMittal 2023-4, Eurometals, Tata Hybox).
- Tabulated axis parallel to vessel axis per orientation (B6 10.2006 §7.4.1, eq. 9–12, Is ≥ h⁴/3000); custom = exact sharp-corner geometry; EN 13445-3 §8.5.3.8 (52)/(53) proportions + EC3 class 3.
- Inside rings for all sections (mirrored geometry, inward centroid diameter); half-pipes still blocked (B6 §7.4.2 heating channel).
- Independent review: catalogue data, axis mapping and composite values confirmed by hand (UPN 100, T 100, RHS 100x60x4, L 50x5); 3 missing guards fixed (manual Dm range, test-state slenderness, I-section proportion guard).
- 64 test files, 49 296/49 296 checks.
