/* Hersteller-Nennmaße, mm; abgerufen 13.11.2026. Vor modules/b7b8.js laden.
 * API: AD.flanges[Typ ('01'|'11')][PN][DN]; AD.gaskets[PN][DN].
 * PN 10/16/25/40; bevorzugte DN-Reihe 15–500 (keine Zwischen-DN).
 * Typ 11: Emsal, EN-Ausführung, Spalten D,k,d2,n,civata,b,d1_EN,d3_EN,h1,s_EN,r.
 * https://emsalvana.com/en/en-1092-1-type-11
 * Typ 01: Zickwolff EN1092-1:2018, D,K,L,n,M,C1; PN16 bis DN40 wie PN10,
 * PN25 bis DN150 wie PN40 (Normverweise Tabelle 7).
 * https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/
 * Fehlende Lagerzeilen PN25 DN300/350/450/500 und PN40 DN300/350/400:
 * Micronsteel, Tabellen TYPE 01 PN25 / PN40 (Herstellerwerte, Ausgabe unbekannt).
 * https://www.micronsteel.com/en-1092-1-type-01-flange/
 * UNVERIFIED: Typ01 PN40 DN450/500 C=null, keine verifizierte Blattdicke;
 * nicht schätzen. DN500 nach Zickwolff nur nach Vereinbarung.
 * Dichtungen: GORE EN1514-1:1997, Form IBC, normale ID (NICHT reduzierte ID*).
 * https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf
 * Keine Druck-Temperatur-Freigabe, keine Toleranz-/Korrosionsabzüge.
 * hub: A Rohr-Außen-Ø, N Ansatz-Außen-Ø am Blatt, H Gesamthöhe,
 * s Wand am Schweißende, r Ansatzradius. Keine automatische B8-Ansatzübernahme.
 */
(function(AD){
'use strict';
AD.flanges = {
  "11": {
    "10": {
      "15": {
        "DN": 15,
        "PN": 10,
        "type": "11",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "hub": {
          "A": 21.3,
          "N": 32,
          "H": 38,
          "s": 2,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 10,
        "type": "11",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 26.9,
          "N": 40,
          "H": 40,
          "s": 2.3,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 10,
        "type": "11",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 33.7,
          "N": 46,
          "H": 40,
          "s": 2.6,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 10,
        "type": "11",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 42.4,
          "N": 56,
          "H": 42,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 10,
        "type": "11",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 48.3,
          "N": 64,
          "H": 45,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 10,
        "type": "11",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 60.3,
          "N": 74,
          "H": 45,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 10,
        "type": "11",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 76.1,
          "N": 92,
          "H": 45,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 10,
        "type": "11",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 88.9,
          "N": 105,
          "H": 50,
          "s": 3.2,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 10,
        "type": "11",
        "D": 220,
        "K": 180,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 114.3,
          "N": 131,
          "H": 52,
          "s": 3.6,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 10,
        "type": "11",
        "D": 250,
        "K": 210,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "hub": {
          "A": 139.7,
          "N": 156,
          "H": 55,
          "s": 4,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 10,
        "type": "11",
        "D": 285,
        "K": 240,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 22,
        "hub": {
          "A": 168.3,
          "N": 184,
          "H": 55,
          "s": 4.5,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 10,
        "type": "11",
        "D": 340,
        "K": 295,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "hub": {
          "A": 219.1,
          "N": 234,
          "H": 62,
          "s": 6.3,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 10,
        "type": "11",
        "D": 395,
        "K": 350,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 26,
        "hub": {
          "A": 273,
          "N": 292,
          "H": 68,
          "s": 6.3,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 10,
        "type": "11",
        "D": 445,
        "K": 400,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 26,
        "hub": {
          "A": 323.9,
          "N": 342,
          "H": 68,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 10,
        "type": "11",
        "D": 505,
        "K": 460,
        "L": 22,
        "n": 16,
        "bolt": "M20",
        "C": 26,
        "hub": {
          "A": 355.6,
          "N": 385,
          "H": 68,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 10,
        "type": "11",
        "D": 565,
        "K": 515,
        "L": 26,
        "n": 16,
        "bolt": "M24",
        "C": 26,
        "hub": {
          "A": 406.4,
          "N": 440,
          "H": 72,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 10,
        "type": "11",
        "D": 615,
        "K": 565,
        "L": 26,
        "n": 20,
        "bolt": "M24",
        "C": 28,
        "hub": {
          "A": 457,
          "N": 488,
          "H": 72,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 10,
        "type": "11",
        "D": 670,
        "K": 620,
        "L": 26,
        "n": 20,
        "bolt": "M24",
        "C": 28,
        "hub": {
          "A": 508,
          "N": 542,
          "H": 75,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      }
    },
    "16": {
      "15": {
        "DN": 15,
        "PN": 16,
        "type": "11",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "hub": {
          "A": 21.3,
          "N": 32,
          "H": 38,
          "s": 2,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 16,
        "type": "11",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 26.9,
          "N": 40,
          "H": 40,
          "s": 2.3,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 16,
        "type": "11",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 33.7,
          "N": 46,
          "H": 40,
          "s": 2.6,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 16,
        "type": "11",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 42.4,
          "N": 56,
          "H": 42,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 16,
        "type": "11",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 48.3,
          "N": 64,
          "H": 45,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 16,
        "type": "11",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 60.3,
          "N": 74,
          "H": 45,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 16,
        "type": "11",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 76.1,
          "N": 92,
          "H": 45,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 16,
        "type": "11",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 88.9,
          "N": 105,
          "H": 50,
          "s": 3.2,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 16,
        "type": "11",
        "D": 220,
        "K": 180,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 114.3,
          "N": 131,
          "H": 52,
          "s": 3.6,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 16,
        "type": "11",
        "D": 250,
        "K": 210,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "hub": {
          "A": 139.7,
          "N": 156,
          "H": 55,
          "s": 4,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 16,
        "type": "11",
        "D": 285,
        "K": 240,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 22,
        "hub": {
          "A": 168.3,
          "N": 184,
          "H": 55,
          "s": 4.5,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 16,
        "type": "11",
        "D": 340,
        "K": 295,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 24,
        "hub": {
          "A": 219.1,
          "N": 235,
          "H": 62,
          "s": 6.3,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 16,
        "type": "11",
        "D": 405,
        "K": 355,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 26,
        "hub": {
          "A": 273,
          "N": 292,
          "H": 70,
          "s": 6.3,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 16,
        "type": "11",
        "D": 460,
        "K": 410,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 28,
        "hub": {
          "A": 323.9,
          "N": 344,
          "H": 78,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 16,
        "type": "11",
        "D": 520,
        "K": 470,
        "L": 26,
        "n": 16,
        "bolt": "M24",
        "C": 30,
        "hub": {
          "A": 355.6,
          "N": 390,
          "H": 82,
          "s": 8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 16,
        "type": "11",
        "D": 580,
        "K": 525,
        "L": 30,
        "n": 16,
        "bolt": "M27",
        "C": 32,
        "hub": {
          "A": 406.4,
          "N": 445,
          "H": 85,
          "s": 8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 16,
        "type": "11",
        "D": 640,
        "K": 585,
        "L": 30,
        "n": 20,
        "bolt": "M27",
        "C": 34,
        "hub": {
          "A": 457,
          "N": 490,
          "H": 83,
          "s": 8.8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 16,
        "type": "11",
        "D": 715,
        "K": 650,
        "L": 33,
        "n": 20,
        "bolt": "M30",
        "C": 36,
        "hub": {
          "A": 508,
          "N": 548,
          "H": 84,
          "s": 8.8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      }
    },
    "25": {
      "15": {
        "DN": 15,
        "PN": 25,
        "type": "11",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "hub": {
          "A": 21.3,
          "N": 32,
          "H": 38,
          "s": 2,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 25,
        "type": "11",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 26.9,
          "N": 40,
          "H": 40,
          "s": 2.3,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 25,
        "type": "11",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 33.7,
          "N": 46,
          "H": 40,
          "s": 2.6,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 25,
        "type": "11",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 42.4,
          "N": 56,
          "H": 42,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 25,
        "type": "11",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 48.3,
          "N": 64,
          "H": 45,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 25,
        "type": "11",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 60.3,
          "N": 75,
          "H": 48,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 25,
        "type": "11",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "hub": {
          "A": 76.1,
          "N": 90,
          "H": 52,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 25,
        "type": "11",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 24,
        "hub": {
          "A": 88.9,
          "N": 105,
          "H": 58,
          "s": 3.2,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 25,
        "type": "11",
        "D": 235,
        "K": 190,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "hub": {
          "A": 114.3,
          "N": 134,
          "H": 65,
          "s": 3.6,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 25,
        "type": "11",
        "D": 270,
        "K": 220,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 26,
        "hub": {
          "A": 139.7,
          "N": 162,
          "H": 68,
          "s": 4,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 25,
        "type": "11",
        "D": 300,
        "K": 250,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 28,
        "hub": {
          "A": 168.3,
          "N": 192,
          "H": 75,
          "s": 4.5,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 25,
        "type": "11",
        "D": 360,
        "K": 310,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 30,
        "hub": {
          "A": 219.1,
          "N": 244,
          "H": 80,
          "s": 6.3,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 25,
        "type": "11",
        "D": 425,
        "K": 370,
        "L": 30,
        "n": 12,
        "bolt": "M27",
        "C": 32,
        "hub": {
          "A": 273,
          "N": 298,
          "H": 88,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 25,
        "type": "11",
        "D": 485,
        "K": 430,
        "L": 30,
        "n": 16,
        "bolt": "M27",
        "C": 34,
        "hub": {
          "A": 323.9,
          "N": 352,
          "H": 92,
          "s": 8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 25,
        "type": "11",
        "D": 555,
        "K": 490,
        "L": 33,
        "n": 16,
        "bolt": "M30",
        "C": 38,
        "hub": {
          "A": 355.6,
          "N": 398,
          "H": 100,
          "s": 8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 25,
        "type": "11",
        "D": 620,
        "K": 550,
        "L": 36,
        "n": 16,
        "bolt": "M33",
        "C": 40,
        "hub": {
          "A": 406.4,
          "N": 452,
          "H": 110,
          "s": 8.8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 25,
        "type": "11",
        "D": 670,
        "K": 600,
        "L": 36,
        "n": 20,
        "bolt": "M33",
        "C": 46,
        "hub": {
          "A": 457,
          "N": 500,
          "H": 110,
          "s": 8.8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 25,
        "type": "11",
        "D": 730,
        "K": 660,
        "L": 36,
        "n": 20,
        "bolt": "M33",
        "C": 48,
        "hub": {
          "A": 508,
          "N": 558,
          "H": 125,
          "s": 10,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      }
    },
    "40": {
      "15": {
        "DN": 15,
        "PN": 40,
        "type": "11",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "hub": {
          "A": 21.3,
          "N": 32,
          "H": 38,
          "s": 2,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 40,
        "type": "11",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 26.9,
          "N": 40,
          "H": 40,
          "s": 2.3,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 40,
        "type": "11",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 18,
        "hub": {
          "A": 33.7,
          "N": 46,
          "H": 40,
          "s": 2.6,
          "r": 4
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 40,
        "type": "11",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 42.4,
          "N": 56,
          "H": 42,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 40,
        "type": "11",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "hub": {
          "A": 48.3,
          "N": 64,
          "H": 45,
          "s": 2.6,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 40,
        "type": "11",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "hub": {
          "A": 60.3,
          "N": 75,
          "H": 48,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 40,
        "type": "11",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "hub": {
          "A": 76.1,
          "N": 90,
          "H": 52,
          "s": 2.9,
          "r": 6
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 40,
        "type": "11",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 24,
        "hub": {
          "A": 88.9,
          "N": 105,
          "H": 58,
          "s": 3.2,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 40,
        "type": "11",
        "D": 235,
        "K": 190,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "hub": {
          "A": 114.3,
          "N": 134,
          "H": 65,
          "s": 3.6,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 40,
        "type": "11",
        "D": 270,
        "K": 220,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 26,
        "hub": {
          "A": 139.7,
          "N": 162,
          "H": 68,
          "s": 4,
          "r": 8
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 40,
        "type": "11",
        "D": 300,
        "K": 250,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 28,
        "hub": {
          "A": 168.3,
          "N": 192,
          "H": 75,
          "s": 4.5,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 40,
        "type": "11",
        "D": 375,
        "K": 320,
        "L": 30,
        "n": 12,
        "bolt": "M27",
        "C": 34,
        "hub": {
          "A": 219.1,
          "N": 244,
          "H": 88,
          "s": 6.3,
          "r": 10
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 40,
        "type": "11",
        "D": 450,
        "K": 385,
        "L": 33,
        "n": 12,
        "bolt": "M30",
        "C": 38,
        "hub": {
          "A": 273,
          "N": 306,
          "H": 105,
          "s": 7.1,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 40,
        "type": "11",
        "D": 515,
        "K": 450,
        "L": 33,
        "n": 16,
        "bolt": "M30",
        "C": 42,
        "hub": {
          "A": 323.9,
          "N": 362,
          "H": 115,
          "s": 8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 40,
        "type": "11",
        "D": 580,
        "K": 510,
        "L": 36,
        "n": 16,
        "bolt": "M33",
        "C": 46,
        "hub": {
          "A": 355.6,
          "N": 408,
          "H": 125,
          "s": 8.8,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 40,
        "type": "11",
        "D": 660,
        "K": 585,
        "L": 39,
        "n": 16,
        "bolt": "M36",
        "C": 50,
        "hub": {
          "A": 406.4,
          "N": 462,
          "H": 135,
          "s": 11,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 40,
        "type": "11",
        "D": 685,
        "K": 610,
        "L": 39,
        "n": 20,
        "bolt": "M36",
        "C": 57,
        "hub": {
          "A": 457,
          "N": 500,
          "H": 135,
          "s": 12.5,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 40,
        "type": "11",
        "D": 755,
        "K": 670,
        "L": 42,
        "n": 20,
        "bolt": "M39",
        "C": 57,
        "hub": {
          "A": 508,
          "N": 562,
          "H": 140,
          "s": 14.2,
          "r": 12
        },
        "source": "https://emsalvana.com/en/en-1092-1-type-11",
        "unverified": []
      }
    }
  },
  "01": {
    "10": {
      "15": {
        "DN": 15,
        "PN": 10,
        "type": "01",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 14,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 10,
        "type": "01",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 10,
        "type": "01",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 10,
        "type": "01",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 10,
        "type": "01",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 10,
        "type": "01",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 10,
        "type": "01",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 10,
        "type": "01",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 10,
        "type": "01",
        "D": 220,
        "K": 180,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 10,
        "type": "01",
        "D": 250,
        "K": 210,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 10,
        "type": "01",
        "D": 285,
        "K": 240,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 10,
        "type": "01",
        "D": 340,
        "K": 295,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 10,
        "type": "01",
        "D": 395,
        "K": 350,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 26,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 10,
        "type": "01",
        "D": 445,
        "K": 400,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 26,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 10,
        "type": "01",
        "D": 505,
        "K": 460,
        "L": 22,
        "n": 16,
        "bolt": "M20",
        "C": 30,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 10,
        "type": "01",
        "D": 565,
        "K": 515,
        "L": 26,
        "n": 16,
        "bolt": "M24",
        "C": 32,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 10,
        "type": "01",
        "D": 615,
        "K": 565,
        "L": 26,
        "n": 20,
        "bolt": "M24",
        "C": 36,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 10,
        "type": "01",
        "D": 670,
        "K": 620,
        "L": 26,
        "n": 20,
        "bolt": "M24",
        "C": 38,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      }
    },
    "16": {
      "15": {
        "DN": 15,
        "PN": 16,
        "type": "01",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 14,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 16,
        "type": "01",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 16,
        "type": "01",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 16,
        "type": "01",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 16,
        "type": "01",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 16,
        "type": "01",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 16,
        "type": "01",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 16,
        "type": "01",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 16,
        "type": "01",
        "D": 220,
        "K": 180,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 16,
        "type": "01",
        "D": 250,
        "K": 210,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 16,
        "type": "01",
        "D": 285,
        "K": 240,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 24,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 16,
        "type": "01",
        "D": 340,
        "K": 295,
        "L": 22,
        "n": 12,
        "bolt": "M20",
        "C": 26,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 16,
        "type": "01",
        "D": 405,
        "K": 355,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 29,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 16,
        "type": "01",
        "D": 460,
        "K": 410,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 32,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 16,
        "type": "01",
        "D": 520,
        "K": 470,
        "L": 26,
        "n": 16,
        "bolt": "M24",
        "C": 35,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 16,
        "type": "01",
        "D": 580,
        "K": 525,
        "L": 30,
        "n": 16,
        "bolt": "M27",
        "C": 38,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 16,
        "type": "01",
        "D": 640,
        "K": 585,
        "L": 30,
        "n": 20,
        "bolt": "M27",
        "C": 42,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 16,
        "type": "01",
        "D": 715,
        "K": 650,
        "L": 33,
        "n": 20,
        "bolt": "M30",
        "C": 46,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      }
    },
    "25": {
      "15": {
        "DN": 15,
        "PN": 25,
        "type": "01",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 14,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 25,
        "type": "01",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 25,
        "type": "01",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 25,
        "type": "01",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 25,
        "type": "01",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 25,
        "type": "01",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 25,
        "type": "01",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 25,
        "type": "01",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 24,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 25,
        "type": "01",
        "D": 235,
        "K": 190,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 26,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 25,
        "type": "01",
        "D": 270,
        "K": 220,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 28,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 25,
        "type": "01",
        "D": 300,
        "K": 250,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 30,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 25,
        "type": "01",
        "D": 360,
        "K": 310,
        "L": 26,
        "n": 12,
        "bolt": "M24",
        "C": 32,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 25,
        "type": "01",
        "D": 425,
        "K": 370,
        "L": 30,
        "n": 12,
        "bolt": "M27",
        "C": 35,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 25,
        "type": "01",
        "D": 485,
        "K": 430,
        "L": 30,
        "n": 16,
        "bolt": "M27",
        "C": 38,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 25,
        "type": "01",
        "D": 555,
        "K": 490,
        "L": 33,
        "n": 16,
        "bolt": "M30",
        "C": 42,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 25,
        "type": "01",
        "D": 620,
        "K": 550,
        "L": 36,
        "n": 16,
        "bolt": "M33",
        "C": 48,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 25,
        "type": "01",
        "D": 670,
        "K": 600,
        "L": 36,
        "n": 20,
        "bolt": "M33",
        "C": 54,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "500": {
        "DN": 500,
        "PN": 25,
        "type": "01",
        "D": 730,
        "K": 660,
        "L": 36,
        "n": 20,
        "bolt": "M33",
        "C": 58,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      }
    },
    "40": {
      "15": {
        "DN": 15,
        "PN": 40,
        "type": "01",
        "D": 95,
        "K": 65,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 14,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "20": {
        "DN": 20,
        "PN": 40,
        "type": "01",
        "D": 105,
        "K": 75,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "25": {
        "DN": 25,
        "PN": 40,
        "type": "01",
        "D": 115,
        "K": 85,
        "L": 14,
        "n": 4,
        "bolt": "M12",
        "C": 16,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "32": {
        "DN": 32,
        "PN": 40,
        "type": "01",
        "D": 140,
        "K": 100,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "40": {
        "DN": 40,
        "PN": 40,
        "type": "01",
        "D": 150,
        "K": 110,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 18,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "50": {
        "DN": 50,
        "PN": 40,
        "type": "01",
        "D": 165,
        "K": 125,
        "L": 18,
        "n": 4,
        "bolt": "M16",
        "C": 20,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "65": {
        "DN": 65,
        "PN": 40,
        "type": "01",
        "D": 185,
        "K": 145,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 22,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "80": {
        "DN": 80,
        "PN": 40,
        "type": "01",
        "D": 200,
        "K": 160,
        "L": 18,
        "n": 8,
        "bolt": "M16",
        "C": 24,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "100": {
        "DN": 100,
        "PN": 40,
        "type": "01",
        "D": 235,
        "K": 190,
        "L": 22,
        "n": 8,
        "bolt": "M20",
        "C": 26,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "125": {
        "DN": 125,
        "PN": 40,
        "type": "01",
        "D": 270,
        "K": 220,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 28,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "150": {
        "DN": 150,
        "PN": 40,
        "type": "01",
        "D": 300,
        "K": 250,
        "L": 26,
        "n": 8,
        "bolt": "M24",
        "C": 30,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "200": {
        "DN": 200,
        "PN": 40,
        "type": "01",
        "D": 375,
        "K": 320,
        "L": 30,
        "n": 12,
        "bolt": "M27",
        "C": 36,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "250": {
        "DN": 250,
        "PN": 40,
        "type": "01",
        "D": 450,
        "K": 385,
        "L": 33,
        "n": 12,
        "bolt": "M30",
        "C": 42,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": []
      },
      "300": {
        "DN": 300,
        "PN": 40,
        "type": "01",
        "D": 515,
        "K": 450,
        "L": 33,
        "n": 16,
        "bolt": "M30",
        "C": 52,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "350": {
        "DN": 350,
        "PN": 40,
        "type": "01",
        "D": 580,
        "K": 510,
        "L": 36,
        "n": 16,
        "bolt": "M33",
        "C": 58,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "400": {
        "DN": 400,
        "PN": 40,
        "type": "01",
        "D": 660,
        "K": 585,
        "L": 39,
        "n": 16,
        "bolt": "M36",
        "C": 65,
        "source": "https://www.micronsteel.com/en-1092-1-type-01-flange/",
        "unverified": []
      },
      "450": {
        "DN": 450,
        "PN": 40,
        "type": "01",
        "D": 685,
        "K": 610,
        "L": 39,
        "n": 20,
        "bolt": "M36",
        "C": null,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": [
          "C"
        ]
      },
      "500": {
        "DN": 500,
        "PN": 40,
        "type": "01",
        "D": 755,
        "K": 670,
        "L": 42,
        "n": 20,
        "bolt": "M39",
        "C": null,
        "source": "https://www.zickwolff.de/wissen/en/flanges/plate-flange-type-01/",
        "unverified": [
          "C"
        ]
      }
    }
  }
};
AD.gaskets = {
  "10": {
    "15": {
      "DN": 15,
      "PN": 10,
      "form": "IBC",
      "di": 22,
      "da": 51,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "20": {
      "DN": 20,
      "PN": 10,
      "form": "IBC",
      "di": 27,
      "da": 61,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "25": {
      "DN": 25,
      "PN": 10,
      "form": "IBC",
      "di": 34,
      "da": 71,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "32": {
      "DN": 32,
      "PN": 10,
      "form": "IBC",
      "di": 43,
      "da": 82,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "40": {
      "DN": 40,
      "PN": 10,
      "form": "IBC",
      "di": 49,
      "da": 92,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "50": {
      "DN": 50,
      "PN": 10,
      "form": "IBC",
      "di": 61,
      "da": 107,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "65": {
      "DN": 65,
      "PN": 10,
      "form": "IBC",
      "di": 77,
      "da": 127,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "80": {
      "DN": 80,
      "PN": 10,
      "form": "IBC",
      "di": 89,
      "da": 142,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "100": {
      "DN": 100,
      "PN": 10,
      "form": "IBC",
      "di": 115,
      "da": 162,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "125": {
      "DN": 125,
      "PN": 10,
      "form": "IBC",
      "di": 141,
      "da": 192,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "150": {
      "DN": 150,
      "PN": 10,
      "form": "IBC",
      "di": 169,
      "da": 218,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "200": {
      "DN": 200,
      "PN": 10,
      "form": "IBC",
      "di": 220,
      "da": 273,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "250": {
      "DN": 250,
      "PN": 10,
      "form": "IBC",
      "di": 273,
      "da": 328,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "300": {
      "DN": 300,
      "PN": 10,
      "form": "IBC",
      "di": 324,
      "da": 378,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "350": {
      "DN": 350,
      "PN": 10,
      "form": "IBC",
      "di": 356,
      "da": 438,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "400": {
      "DN": 400,
      "PN": 10,
      "form": "IBC",
      "di": 407,
      "da": 489,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "450": {
      "DN": 450,
      "PN": 10,
      "form": "IBC",
      "di": 458,
      "da": 539,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "500": {
      "DN": 500,
      "PN": 10,
      "form": "IBC",
      "di": 508,
      "da": 594,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    }
  },
  "16": {
    "15": {
      "DN": 15,
      "PN": 16,
      "form": "IBC",
      "di": 22,
      "da": 51,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "20": {
      "DN": 20,
      "PN": 16,
      "form": "IBC",
      "di": 27,
      "da": 61,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "25": {
      "DN": 25,
      "PN": 16,
      "form": "IBC",
      "di": 34,
      "da": 71,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "32": {
      "DN": 32,
      "PN": 16,
      "form": "IBC",
      "di": 43,
      "da": 82,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "40": {
      "DN": 40,
      "PN": 16,
      "form": "IBC",
      "di": 49,
      "da": 92,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "50": {
      "DN": 50,
      "PN": 16,
      "form": "IBC",
      "di": 61,
      "da": 107,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "65": {
      "DN": 65,
      "PN": 16,
      "form": "IBC",
      "di": 77,
      "da": 127,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "80": {
      "DN": 80,
      "PN": 16,
      "form": "IBC",
      "di": 89,
      "da": 142,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "100": {
      "DN": 100,
      "PN": 16,
      "form": "IBC",
      "di": 115,
      "da": 162,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "125": {
      "DN": 125,
      "PN": 16,
      "form": "IBC",
      "di": 141,
      "da": 192,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "150": {
      "DN": 150,
      "PN": 16,
      "form": "IBC",
      "di": 169,
      "da": 218,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "200": {
      "DN": 200,
      "PN": 16,
      "form": "IBC",
      "di": 220,
      "da": 273,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "250": {
      "DN": 250,
      "PN": 16,
      "form": "IBC",
      "di": 273,
      "da": 329,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "300": {
      "DN": 300,
      "PN": 16,
      "form": "IBC",
      "di": 324,
      "da": 384,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "350": {
      "DN": 350,
      "PN": 16,
      "form": "IBC",
      "di": 356,
      "da": 444,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "400": {
      "DN": 400,
      "PN": 16,
      "form": "IBC",
      "di": 407,
      "da": 495,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "450": {
      "DN": 450,
      "PN": 16,
      "form": "IBC",
      "di": 458,
      "da": 555,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "500": {
      "DN": 500,
      "PN": 16,
      "form": "IBC",
      "di": 508,
      "da": 617,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    }
  },
  "25": {
    "15": {
      "DN": 15,
      "PN": 25,
      "form": "IBC",
      "di": 22,
      "da": 51,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "20": {
      "DN": 20,
      "PN": 25,
      "form": "IBC",
      "di": 27,
      "da": 61,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "25": {
      "DN": 25,
      "PN": 25,
      "form": "IBC",
      "di": 34,
      "da": 71,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "32": {
      "DN": 32,
      "PN": 25,
      "form": "IBC",
      "di": 43,
      "da": 82,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "40": {
      "DN": 40,
      "PN": 25,
      "form": "IBC",
      "di": 49,
      "da": 92,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "50": {
      "DN": 50,
      "PN": 25,
      "form": "IBC",
      "di": 61,
      "da": 107,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "65": {
      "DN": 65,
      "PN": 25,
      "form": "IBC",
      "di": 77,
      "da": 127,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "80": {
      "DN": 80,
      "PN": 25,
      "form": "IBC",
      "di": 89,
      "da": 142,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "100": {
      "DN": 100,
      "PN": 25,
      "form": "IBC",
      "di": 115,
      "da": 168,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "125": {
      "DN": 125,
      "PN": 25,
      "form": "IBC",
      "di": 141,
      "da": 194,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "150": {
      "DN": 150,
      "PN": 25,
      "form": "IBC",
      "di": 169,
      "da": 224,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "200": {
      "DN": 200,
      "PN": 25,
      "form": "IBC",
      "di": 220,
      "da": 284,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "250": {
      "DN": 250,
      "PN": 25,
      "form": "IBC",
      "di": 273,
      "da": 340,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "300": {
      "DN": 300,
      "PN": 25,
      "form": "IBC",
      "di": 324,
      "da": 400,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "350": {
      "DN": 350,
      "PN": 25,
      "form": "IBC",
      "di": 356,
      "da": 457,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "400": {
      "DN": 400,
      "PN": 25,
      "form": "IBC",
      "di": 407,
      "da": 514,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "450": {
      "DN": 450,
      "PN": 25,
      "form": "IBC",
      "di": 458,
      "da": 564,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "500": {
      "DN": 500,
      "PN": 25,
      "form": "IBC",
      "di": 508,
      "da": 624,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    }
  },
  "40": {
    "15": {
      "DN": 15,
      "PN": 40,
      "form": "IBC",
      "di": 22,
      "da": 51,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "20": {
      "DN": 20,
      "PN": 40,
      "form": "IBC",
      "di": 27,
      "da": 61,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "25": {
      "DN": 25,
      "PN": 40,
      "form": "IBC",
      "di": 34,
      "da": 71,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "32": {
      "DN": 32,
      "PN": 40,
      "form": "IBC",
      "di": 43,
      "da": 82,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "40": {
      "DN": 40,
      "PN": 40,
      "form": "IBC",
      "di": 49,
      "da": 92,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "50": {
      "DN": 50,
      "PN": 40,
      "form": "IBC",
      "di": 61,
      "da": 107,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "65": {
      "DN": 65,
      "PN": 40,
      "form": "IBC",
      "di": 77,
      "da": 127,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "80": {
      "DN": 80,
      "PN": 40,
      "form": "IBC",
      "di": 89,
      "da": 142,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "100": {
      "DN": 100,
      "PN": 40,
      "form": "IBC",
      "di": 115,
      "da": 168,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "125": {
      "DN": 125,
      "PN": 40,
      "form": "IBC",
      "di": 141,
      "da": 194,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "150": {
      "DN": 150,
      "PN": 40,
      "form": "IBC",
      "di": 169,
      "da": 224,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "200": {
      "DN": 200,
      "PN": 40,
      "form": "IBC",
      "di": 220,
      "da": 290,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "250": {
      "DN": 250,
      "PN": 40,
      "form": "IBC",
      "di": 273,
      "da": 352,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "300": {
      "DN": 300,
      "PN": 40,
      "form": "IBC",
      "di": 324,
      "da": 417,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "350": {
      "DN": 350,
      "PN": 40,
      "form": "IBC",
      "di": 356,
      "da": 474,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "400": {
      "DN": 400,
      "PN": 40,
      "form": "IBC",
      "di": 407,
      "da": 546,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "450": {
      "DN": 450,
      "PN": 40,
      "form": "IBC",
      "di": 458,
      "da": 571,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    },
    "500": {
      "DN": 500,
      "PN": 40,
      "form": "IBC",
      "di": 508,
      "da": 628,
      "source": "https://www.gore.com/sites/default/files/2016-04/gasket-sizes-DIN.pdf",
      "unverified": []
    }
  }
};
})(globalThis.AD);
