// Arenen der Spielart "arena" (Aufbau und Regeln siehe src/systeme/arena.js): benannte Aufstellungen für Kämpfe von
// Hand, automatisch im Browser und im Werkzeug werkzeuge/arena.js. Vorläufig, zum Ausprobieren der Systeme; die
// Machtkurve (docs/Systemausbau.md, Punkt 10) braucht später eigene.

// Ninkasi mit je einer Waffe gegen dieselben Gegner (Faust als Bezug, Fasshammer zum Vergleich)
const WAFFEN = {
  faust: {},
  dolch: { ausruestung: ["pruefdolch"] },
  schwert: { ausruestung: ["pruefschwert"] },
  speer: { ausruestung: ["pruefspeer"] },
  zweihaender: { ausruestung: ["pruefzweihaender"] },
  fasshammer: { ausruestung: ["fasshammer"] },
};
// je Familie zwei Gewichte, mit dem Prüfschwert
const RUESTUNGEN = {
  ohne: { ausruestung: ["pruefschwert"] },
  lederwams: { ausruestung: ["pruefschwert", "lederwams"] },
  polsterrock: { ausruestung: ["pruefschwert", "polsterrock"] },
  schuppenhemd: { ausruestung: ["pruefschwert", "schuppenhemd"] },
  plattenharnisch: { ausruestung: ["pruefschwert", "plattenharnisch"] },
};

export default {
  essigbakterien: {
    text: "arena.essigbakterien", karte: "arena_offen", taktik: "nahkampf",
    wellen: [[{ typ: "essigbakterium", anzahl: 3 }]],
    varianten: {
      ninkasi: {
        nackt: {},
        geruestet: { ausruestung: ["fasshammer", "lederschuerze", "kupferhelm"] },
        geuebt: { skills: { nahkampf_grund: 3, zaehigkeit_grund: 2 } },
      },
      gegner: {
        drei: { wellen: [[{ typ: "essigbakterium", anzahl: 3 }]] },
        fuenf: { wellen: [[{ typ: "essigbakterium", anzahl: 5 }]] },
        // Affix mit Adjektiv: drei gereizte Essigbakterien (Probe für docs/Texte.md, Grammatik)
        gereizt: { wellen: [[{ typ: "essigbakterium", anzahl: 3, affixe: [{ zustand: "gereizt", chance: 100 }] }]] },
      },
    },
  },
  fernkaempfer: {
    text: "arena.fernkaempfer", karte: "arena_offen", taktik: "nahkampf",
    ninkasi: { gepaeck: [{ typ: "bier", anzahl: 2 }] },
    wellen: [[{ typ: "fernkaempfer_test" }], [{ typ: "fernkaempfer_test", anzahl: 2 }]],
  },
  engpass: {
    text: "arena.engpass", karte: "arena_gang", taktik: "nahkampf", abstand: 13,
    wellen: [[{ typ: "essigbakterium", anzahl: 6 }]],
  },
  // eine Reihe wie im Keller der Tiefe 1, ohne Rast zwischen den Wellen
  keller_reihe: {
    text: "arena.keller_reihe", karte: "arena_offen", taktik: "fernkampf",
    ninkasi: { gepaeck: [{ typ: "bier", anzahl: 3 }, { typ: "brandflasche", anzahl: 2 }] },
    population: { tabelle: "keller", tiefe: 1, wellen: 6 },
  },
  // jeder Eintrag der Population von Tiefe 1 einmal
  keller_alle: {
    text: "arena.keller_alle", karte: "arena_offen", taktik: "nahkampf",
    population: { tabelle: "keller", tiefe: 1, alle: true },
  },
  // Normierung (siehe docs/Wesen.md, Normierung): Ninkasi zu Beginn gegen ein bzw. drei Normwesen je Stärke
  normwesen: {
    text: "arena.normwesen", karte: "arena_offen", taktik: "nahkampf",
    wellen: [[{ typ: "normwesen_1" }]],
    varianten: {
      gegner: {
        s1: { wellen: [[{ typ: "normwesen_1" }]] },
        s2: { wellen: [[{ typ: "normwesen_2" }]] },
        s3: { wellen: [[{ typ: "normwesen_3" }]] },
        s4: { wellen: [[{ typ: "normwesen_4" }]] },
        s5: { wellen: [[{ typ: "normwesen_5" }]] },
      },
    },
  },
  // Prüfwaffen und Prüfrüstungen (Ziele und Messwerte in docs/Entwicklung.md, Messwerte)
  pruefwaffen: {
    text: "arena.pruefwaffen", karte: "arena_offen", taktik: "nahkampf",
    wellen: [[{ typ: "normwesen_3" }]],
    varianten: {
      ninkasi: WAFFEN,
      gegner: {
        s1: { wellen: [[{ typ: "normwesen_1" }]] },
        s2: { wellen: [[{ typ: "normwesen_2" }]] },
        s3: { wellen: [[{ typ: "normwesen_3" }]] },
        s4: { wellen: [[{ typ: "normwesen_4" }]] },
        s5: { wellen: [[{ typ: "normwesen_5" }]] },
      },
    },
  },
  pruefwaffen_drei: {
    text: "arena.pruefwaffen_drei", karte: "arena_offen", taktik: "nahkampf",
    wellen: [[{ typ: "normwesen_2", anzahl: 3 }]],
    varianten: {
      ninkasi: WAFFEN,
      gegner: {
        s1: { wellen: [[{ typ: "normwesen_1", anzahl: 3 }]] },
        s2: { wellen: [[{ typ: "normwesen_2", anzahl: 3 }]] },
        s3: { wellen: [[{ typ: "normwesen_3", anzahl: 3 }]] },
        s4: { wellen: [[{ typ: "normwesen_4", anzahl: 3 }]] },
      },
    },
  },
  // immer mit dem Prüfschwert, damit nur die Rüstung wechselt
  pruefruestung: {
    text: "arena.pruefruestung", karte: "arena_offen", taktik: "nahkampf",
    ninkasi: { ausruestung: ["pruefschwert"] },
    wellen: [[{ typ: "normwesen_3" }]],
    varianten: {
      ninkasi: RUESTUNGEN,
      gegner: {
        s2: { wellen: [[{ typ: "normwesen_2" }]] },
        s3: { wellen: [[{ typ: "normwesen_3" }]] },
        s4: { wellen: [[{ typ: "normwesen_4" }]] },
        drei_s2: { wellen: [[{ typ: "normwesen_2", anzahl: 3 }]] },
      },
    },
  },
  // fünf Wellen ohne Erholung: Rüstung lohnt, wenn sich die Treffer über mehrere Kämpfe summieren
  kette: {
    text: "arena.kette", karte: "arena_offen", taktik: "nahkampf",
    ninkasi: { ausruestung: ["pruefschwert"] },
    wellen: [
      [{ typ: "normwesen_2", anzahl: 2 }], [{ typ: "normwesen_3" }], [{ typ: "normwesen_2", anzahl: 2 }],
      [{ typ: "normwesen_3", anzahl: 2 }], [{ typ: "normwesen_4" }],
    ],
    varianten: {
      ninkasi: {
        ohne: { ausruestung: ["pruefschwert"] },
        leicht: { ausruestung: ["pruefschwert", "polsterrock"] },
        schwer: { ausruestung: ["pruefschwert", "plattenharnisch"] },
      },
    },
  },
  // Wurfwaffen auf Abstand, danach Nahkampf mit der Faust
  wurfwaffen: {
    text: "arena.wurfwaffen", karte: "arena_offen", taktik: "fernkampf", abstand: 8,
    ninkasi: { gepaeck: [{ typ: "wurfmesser", anzahl: 5 }] },
    wellen: [[{ typ: "normwesen_3" }]],
    varianten: {
      ninkasi: {
        faust: { gepaeck: [] },
        wurfmesser: { gepaeck: [{ typ: "wurfmesser", anzahl: 5 }] },
        wurfspeere: { gepaeck: [{ typ: "wurfspeer", anzahl: 2 }] },
      },
      gegner: {
        s2: { wellen: [[{ typ: "normwesen_2" }]] },
        s3: { wellen: [[{ typ: "normwesen_3" }]] },
        drei_s2: { wellen: [[{ typ: "normwesen_2", anzahl: 3 }]] },
      },
    },
  },
  normwesen_drei: {
    text: "arena.normwesen_drei", karte: "arena_offen", taktik: "nahkampf",
    wellen: [[{ typ: "normwesen_1", anzahl: 3 }]],
    varianten: {
      gegner: {
        s1: { wellen: [[{ typ: "normwesen_1", anzahl: 3 }]] },
        s2: { wellen: [[{ typ: "normwesen_2", anzahl: 3 }]] },
        s3: { wellen: [[{ typ: "normwesen_3", anzahl: 3 }]] },
        s4: { wellen: [[{ typ: "normwesen_4", anzahl: 3 }]] },
        s5: { wellen: [[{ typ: "normwesen_5", anzahl: 3 }]] },
      },
    },
  },
};
