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
    // Grundwerte der Eigenschaften (src/systeme/skills.js); vorläufige Verteilung, bis die Charaktererstellung sie wählt
    eigenschaften: { koerperlichkeit: 14, trinkfestigkeit: 14, gewandtheit: 13, sinnlichkeit: 13, klugheit: 13, braukunde: 13 },
    // Tempo in Zeiteinheiten (siehe docs/Grundlagen.md, Zeit und Tempo): zu Fuß ein Fünftel langsamer als die Norm 100
    kosten: { bewegen: 120 },
    sicht: { reichweite: 6, imFinstern: 2 }, // knapp unter einem gewöhnlichen Gegner (7); auf finstere Felder zwei Felder weit (src/systeme/sicht.js)
    // gegen Ausweichen 0 und Grundverteidigung 20: 80 %; Tag für den Skill nahkampf_grund; Fäuste in der halben Zeit der Norm
    angriffe: [{ name: "faust", genauigkeit: 80, effekt: "faustschlag", kosten: 50, tags: ["nahkampf"] }],
    inventar: [],
    faehigkeiten: [], // eigene Fähigkeiten folgen mit dem Inhalt; der Probeinhalt ergänzt die testfaehigkeit (datenproben/index.js)
    // Plätze für Ausrüstung (src/systeme/ausruestung.js): Waffen in den Händen, Rüstung und Schmuck am Körper
    plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 },
    // Stoffwechsel, siehe src/systeme/stoffwechsel.js; alle Zahlen vorläufig, LP und MP nach regeln.normierung.regeneration.
    // Kurven: [Pegel in Hundertstel Promille, Hundertstel je Welttick], negativ ist Schwund.
    // Schwellen vorerst nur angezeigt und gemeldet.
    stoffwechsel: {
      abbauHundertstel: 100, // 0,01 ‰ je Welttick
      schwellen: [50, 100, 200, 300], // 0,5, 1, 2 und 3 ‰
      regeneration: {
        lp: [[0, 25], [150, 67], [300, 25], [800, 0]], // voll nüchtern in 400 Ticks, im Optimum bei 1,5 ‰ in 150, bei 3 ‰ in 400
        mp: [[0, 50], [100, 25], [300, 0]], // nüchtern am schnellsten, voll in 200 Ticks
        pp: [[0, -30], [150, -10], [400, 0]], // außerhalb des Kampfes nur Schwund, bei hohem Pegel kaum
      },
      imKampf: { lp: 0, mp: 0, pp: 0 }, // im Kampf ruhen alle drei; Regeneration im Kampf später über Skills (imKampf.lp)
      // Kampfespegel: PP je Treffer, ausgeteilt wie erlitten; unter 0,5 ‰ nichts, bei 1,5 ‰ 2 PP, bei 4 ‰ 4 PP;
      // so reicht ein gewöhnlicher Kampf (etwa 3 Treffer ausgeteilt, 1 bis 2 erlitten) bei 1,5 ‰ für eine Psi-Fähigkeit (10 PP)
      kampfgewinn: { pp: { jeTreffer: 200, kurve: [[50, 0], [150, 100], [400, 200]] } },
    },
  },
};
