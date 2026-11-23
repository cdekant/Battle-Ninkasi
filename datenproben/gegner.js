// Gegner. Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
export default {
  bakterium: {
    abstrakt: true,
    fraktion: "verderber",
    tueren: "nicht", // Mikroorganismen öffnen keine Türen
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
    spueren: { reichweite: 3 }, // spüren Beute ohne Licht entlang offener Felder (src/systeme/sinne.js), vorläufig
  },

  essigbakterium: {
    vorlage: "bakterium",
    text: "wesen.essigbakterium",
    werte: { lp: { grundwert: 15 } },
    ep: 10, // gebundene EP beim Tod (src/systeme/lernen.js), vorläufig
    angriffe: [{ name: "biss", genauigkeit: 70, effekt: "biss_klein" }],
  },

  // Testgegner für die KI mit Fähigkeiten und Gepäck: hält Abstand, spuckt, kündigt einen Säureschwall an und trinkt
  // bei wenig LP sein Bier; vorläufig
  fernkaempfer_test: {
    vorlage: "bakterium",
    text: "wesen.fernkaempfer_test",
    werte: { lp: { grundwert: 10 } },
    ep: 15,
    angriffe: [{ name: "biss", genauigkeit: 60, effekt: "biss_klein" }],
    faehigkeiten: ["saeurespucke", "saeureschwall"],
    ausstattung: [{ typ: "bier" }],
    ki: {
      // der Reihe nach (wahl "erste"): unter 80 % LP zur Hälfte trinken, sonst Schwall, Spucke, Abstand halten, nachsetzen
      handlungen: [
        { handlung: "nutzen", zweck: "heilen", chance: 50, bewertung: [{ eingabe: "eigeneLpProzent", kurve: "heilenNachLp" }] },
        { handlung: "faehigkeit", name: "saeureschwall", chance: 30, abstandAb: 2, abstandBis: 5 },
        { handlung: "faehigkeit", name: "saeurespucke", abstandAb: 2 },
        { handlung: "abstand_halten", abstand: 3 },
      ],
    },
  },
};
