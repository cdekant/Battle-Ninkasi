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
      glimmer: { anfangswert: 0 }, // Psi lockt Jägerinnen an (src/systeme/glimmer.js), ohne Grundwert, sinkt nie von selbst
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
    // Ninkasis Skala liegt viermal so hoch wie die der Sterblichen: bis 2 ‰ ist sie nüchtern (docs/Grundlagen.md, Spielkern).
    stoffwechsel: {
      abbauHundertstel: 200, // 0,02 ‰ je Welttick
      stufen: [
        { name: "angeheitert", ab: 200 }, { name: "beschwipst", ab: 400 }, { name: "berauscht", ab: 800 },
        { name: "im_rausch", ab: 1200 }, { name: "sturzbetrunken", ab: 2000 }, { name: "vollrausch", ab: 3200 },
      ],
      regeneration: {
        lp: [[0, 25], [600, 67], [1200, 25], [3200, 0]], // voll nüchtern in 400 Ticks, im Optimum bei 6 ‰ in 150, bei 12 ‰ in 400
        mp: [[0, 50], [400, 25], [1200, 0]], // nüchtern am schnellsten, voll in 200 Ticks
        pp: [[0, -30], [600, -10], [1600, 0]], // außerhalb des Kampfes nur Schwund, bei hohem Pegel kaum
      },
      imKampf: { lp: 0, mp: 0, pp: 0 }, // im Kampf ruhen alle drei; Regeneration im Kampf später über Skills (imKampf.lp)
      // Kampfespegel: PP je Treffer, ausgeteilt wie erlitten; unter 2 ‰ nichts, bei 6 ‰ 2 PP, ab 16 ‰ 4 PP;
      // so reicht ein gewöhnlicher Kampf (etwa 3 Treffer ausgeteilt, 1 bis 2 erlitten) bei 6 ‰ für eine Psi-Fähigkeit (10 PP)
      kampfgewinn: { pp: { jeTreffer: 200, kurve: [[200, 0], [600, 100], [1600, 200]] } },
      // Strafen des Rauschs: ab berauscht (8 ‰) sinkt die Genauigkeit, im Rausch (ab 12 ‰) torkelt sie und schlägt daneben
      rausch: {
        befehle: [
          { veraenderer: "abweichen", chance: [[1199, 0], [1200, 5], [2000, 15], [3200, 30]] },
          { veraenderer: "daneben_schlagen", chance: [[1199, 0], [1200, 5], [2000, 15], [3200, 30]] },
        ],
        modifikatoren: [800, 1200, 2000, 3200].map((wert) => ({ ziel: "genauigkeit", art: "plus", betrag: -5, wenn: [{ bedingung: "pegel_ab", wert }] })),
      },
      // Filmriss im Vollrausch: alle 100 Weltticks außerhalb des Kampfes 3 % ab 32 ‰, 10 % bei 48 ‰, 25 % ab 64 ‰
      filmriss: { alleTicks: 100, chance: [[3199, 0], [3200, 3], [4800, 10], [6400, 25]], effekt: "filmriss" },
    },
  },
};
