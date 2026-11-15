# Module overview

All calculation modules register themselves with `AD.register({...})` (contract in `src/ad.js`, explained in [ARCHITECTURE.md](ARCHITECTURE.md)). The picker groups them by `group`. Ids are stable — they are stored in saved projects, so never rename one.

| Group | id | Name | Code | File |
|---|---|---|---|---|
| Schalen | `cyl` | Zylinder | B1 | modules/b1.js |
| Schalen | `sph` | Kugel | B1 | modules/b1.js |
| Böden | `b3` | Gewölbter Boden | B3 | modules/b1.js |
| Böden | `b5` | Ebener Boden | B5 | modules/b1.js |
| Schalen | `b10` | Dickwandig | B10 | modules/b10.js |
| Schalen | `b2` | Kegel | B2 | modules/b2.js |
| Schalen | `b6` | Zylinder Außendruck | B6 | modules/b6.js |
| Böden | `b4` | Tellerboden | B4 | modules/b4.js |
| Ausschnitte | `b9` | Stutzen | B9 | modules/b9.js |
| Ausschnitte | `b9k` | Stutzen Kugel/Boden | B9 | modules/b9k.js |
| Verbindungen | `b7` | Schrauben | B7 | modules/b7b8.js |
| Verbindungen | `b8` | Flansch | B8 | modules/b7b8.js |
| Verbindungen | `b13` | Kompensator | B13 | modules/b13.js |
| Zusatzlasten | `s3` | Sattellager | S3/2 | modules/s3.js |
| Zusatzlasten | `s3p` | Tragpratzen | S3/4 | modules/s3b.js |
| Zusatzlasten | `s3o` | Tragösen | nicht AD | modules/s3b.js |
| Zusatzlasten | `s31` | Standzarge | S3/1 | modules/s31.js |
| Bewertung | `ffs4` | Allgemeiner Abtrag | API 579 Teil 4 | modules/ffs.js |
| Bewertung | `ffs5` | Örtlicher Abtrag (LTA) | API 579 Teil 5 | modules/ffs.js |
| Bewertung | `b31g` | Korrosion Rohrleitung | ASME B31G | modules/ffs.js |
| EN 13445 | `en_shell` | Zylinder/Kugel | EN 13445-3 §7.4 | modules/en13445.js |
| EN 13445 | `en_head` | Gewölbte Böden | EN 13445-3 §7.5 | modules/en13445.js |
| EN 13445 | `en_cone` | Kegel | EN 13445-3 §7.6 | modules/en13445.js |
| EN 13480 | `pipe` | Gerades Rohr | EN 13480-3 §6.1 | modules/en13480.js |
| EN 13480 | `bend` | Rohrbogen | EN 13480-3 §6.2.3 | modules/en13480.js |
| ASME | `ug27` | Zylinder/Kugel | UG-27 | modules/asme.js |
| ASME | `ug32` | Böden | UG-32 | modules/asme.js |
| ASME | `ug34` | Ebene Böden | UG-34 | modules/asme.js |
| Richtlinie | `ped` | Kategorie nach Druckgeräterichtlinie | 2014/68/EU | modules/ped.js |
| T-Stücke | `tee_ad` | T-Stück | B9 Rohr | modules/tee.js |
| T-Stücke | `tee_en` | T-Stück | EN 13480-3 | modules/tee.js |

Tip files (`*-tips.js`) contain no calculation logic. They attach field explanations (`field.tip`), input tips (`module.tips`) and glossary entries (`AD.glossary`) to modules that were registered earlier, and `ffs-tips.js` also moves rarely changed fields into the folded "Weitere Parameter" section.

## What each module covers (short)

- **B1 / B3 / B5 / B10 (`modules/b1.js`, `b10.js`)** — cylinders and spheres under internal pressure, dished heads (Klöpper / Korbbogen, β must be read from the B3 charts and entered), flat ends (C must be entered), thick-walled cylinders. Includes PED test-pressure check and the 2 mm minimum wall.
- **B2 (`b2.js`)** — cones under internal pressure, angle entered directly or derived from axial length and the two diameters (also with a knuckle: L = ΔR·cot φ + (r + s)·tan(φ/2)).
- **B4 (`b4.js`)** — bolted dished heads with continuous gasket.
- **B6 (`b6.js`)** — cylinders under external pressure: elastic buckling, plastic deformation, ovality, stiffening rings (flat bar, L, UPN, T, IPE/HEA/HEB, RHS from catalogue, custom dimensions or manual composite values; inside or outside the shell). Half-pipe heating channels are blocked (B6 §7.4.2 not implemented).
- **B9 / B9k (`b9.js`, `b9k.js`)** — single radial nozzle in a cylinder (di/Di ≤ 0.8) and in spheres/heads (cylinder substitute, marked unverified).
- **T-pieces (`tee.js`)** — pipe tees and branch pipes: AD 2000 B9 up to di/Di = 1 and EN 13480-3 §8.4 pressure-area method; welded-on, extruded (≤ 0.8) or forged.
- **B7 / B8 (`b7b8.js`)** — bolts and flanges, optional EN 1092-1 standard flange data (`data/flanges.js`).
- **B13 (`b13.js`)** — single-ply bellows, partial check only.
- **S3 family (`s3.js`, `s3b.js`, `s31.js`)** — saddles, local loads, standing vessels; partial checks, several parts deliberately blocked.
- **Assessment (`ffs.js`)** — API 579-1 Part 4 (general metal loss), Part 5 (local thin area), ASME B31G (original / modified); inner/outer loss, pipe bends (bends blocked for Part 5).
- **EN 13445-3 (`en13445.js`)**, **EN 13480-3 (`en13480.js`)**, **ASME VIII-1 UG-27/32/34 (`asme.js`)**, **PED category (`ped.js`)**.

Each module's own help text, notes and code comments state the edition it follows and what is not covered.
