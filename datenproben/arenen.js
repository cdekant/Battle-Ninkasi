// Arenen der Spielart "arena" (Aufbau und Regeln siehe src/systeme/arena.js): benannte Aufstellungen für Kämpfe von
// Hand, automatisch im Browser und im Werkzeug werkzeuge/arena.js. Vorläufig, zum Ausprobieren der Systeme; die
// Machtkurve (docs/Systemausbau.md, Punkt 10) braucht später eigene.
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
