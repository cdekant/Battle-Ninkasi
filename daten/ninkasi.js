// Ninkasi. Werte vorläufig, siehe docs/Charakter.md (Startwerte).
export default {
  ninkasi: {
    text: "wesen.ninkasi",
    fraktion: "ninkasi",
    werte: {
      lp: { grundwert: 100 },
      mp: { grundwert: 100 },
      pp: { grundwert: 100, anfangswert: 0 }, // Psi-Punkte; Start- und Höchstwert vorläufig
      pegel: { anfangswert: 0 }, // in Hundertstel Promille (100 = 1 ‰), ohne Grundwert nach oben offen
    },
    sicht: { reichweite: 8 },
    angriffe: [{ name: "faust", genauigkeit: 80, effekt: "faustschlag" }], // gegen Ausweichen 0 und Grundverteidigung 20: 80 %
    inventar: [],
    faehigkeiten: ["testfaehigkeit"], // vorläufig, für den Zielmodus (daten/faehigkeiten.js)
    // Plätze für Ausrüstung (src/systeme/ausruestung.js): Waffen in den Händen, Rüstung und Schmuck am Körper
    plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 },
    // Stoffwechsel, siehe src/systeme/stoffwechsel.js; alle Zahlen vorläufig.
    // Kurven: [Pegel in Hundertstel Promille, Hundertstel je Welttick], negativ ist Schwund.
    // Schwellen vorerst nur angezeigt und gemeldet.
    stoffwechsel: {
      abbauHundertstel: 100, // 0,01 ‰ je Welttick
      schwellen: [50, 100, 200, 300], // 0,5, 1, 2 und 3 ‰
      regeneration: {
        lp: [[0, 30], [150, 80], [400, 30], [800, 0]], // langsam, Optimum bei 1,5 ‰, darüber abnehmend
        mp: [[0, 80], [100, 40], [300, 0]], // nüchtern am schnellsten
        pp: [[0, -30], [50, 0], [150, 0], [400, 100]], // Schwund unter 0,5 ‰, Regeneration ab 1,5 ‰
      },
    },
  },
};
