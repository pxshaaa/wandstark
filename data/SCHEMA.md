# Material entry schema (all data/mat*.js files)
Each file is an IIFE that APPENDS entries: `(function(AD){ AD.materials.push(...entries); })(globalThis.AD);`
(data/materials.js runs first and creates AD.materials; it also defines AD.Eferritic / AD.Eaustenitic.)

Entry fields:
- id        UNIQUE string: `<grade> | <standard> | <product/thickness band>`, e.g. `P235GH | EN 10216-2 | Rohr t ≤ 16`
- name      short display name, e.g. `P235GH (1.0345) Rohr`
- family    UI group, one of: 'EN Blech' | 'EN Rohr' | 'EN Schmiedestück' | 'EN Stahlguss' | 'EN Stab/Schraube' |
            'Leitungsrohr' | 'DIN (alt)' | 'ASME'
- std       standard incl. edition if known, e.g. 'EN 10216-2:2013'
- product   product form and thickness band, e.g. 'Nahtloses Rohr, T ≤ 16 mm'
- type      'ferritic' | 'austenitic' | 'duplex' | 'cast' | 'nickel' | 'other'
- K         [[T °C, N/mm²], ...] ascending T: AD 2000 strength value K = ReH / Rp0.2 (ferritic) or Rp1.0 (austenitic),
            first point at 20 °C. Only sourced points; no invented interpolation points.
- Rm        minimum tensile strength at 20 °C (lower bound of range), N/mm²
- RmT       optional [[T, Rm]] elevated-temperature tensile strength if the standard gives it
- A         optional minimum elongation in % (needed for EN 13445 austenitic rule A >= 30/35 %)
- S         default AD 2000 B0 safety factor for this product form (1.5 rolled/forged, 2.0 cast w/o test, etc.)
- E         optional [[T, N/mm²]] elastic modulus table, else type default is used
- aliases   array of other designations (material number, old DIN names, UNS), e.g. ['1.0345','H I']
- replaces  (new grades) array of old designations it replaces; replacedBy (old grades) string with the current EN grade
- asmeS     ASME only: [[T °C, MPa]] maximum allowable stress S from ASME BPVC Section II-D Table 1A (Div. 1)
- asmeEdition ASME only: e.g. 'ASME II-D 2021'
- Tmax      upper temperature of the K (or asmeS) table
- note      German note incl. SOURCE (table number + URL) for the values; write 'UNVERIFIED' for any value you could not source
Rules: values must come from the standard or manufacturer/steelmaker datasheets reproducing it; cite per entry.
Never copy-paste the same table to a different thickness band without the source saying so.
