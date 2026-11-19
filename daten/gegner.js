// Gegner. Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
export default {
  bakterium: {
    abstrakt: true,
    fraktion: "verderber",
    tueren: "nicht", // Mikroorganismen öffnen keine Türen
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
  },

  essigbakterium: {
    vorlage: "bakterium",
    text: "wesen.essigbakterium",
    werte: { lp: { grundwert: 15 } },
    angriffe: [{ name: "biss", genauigkeit: 70, effekt: "biss_klein" }],
  },

  // Testgegner für die KI mit Fähigkeiten: hält Abstand, spuckt und kündigt einen Säureschwall an; vorläufig
  fernkaempfer_test: {
    vorlage: "bakterium",
    text: "wesen.fernkaempfer_test",
    werte: { lp: { grundwert: 10 } },
    angriffe: [{ name: "biss", genauigkeit: 60, effekt: "biss_klein" }],
    faehigkeiten: ["saeurespucke", "saeureschwall"],
    ki: {
      faehigkeiten: [
        { name: "saeureschwall", chance: 30, abstandAb: 2, abstandBis: 5 },
        { name: "saeurespucke", abstandAb: 2 },
      ],
      abstandHalten: 3,
    },
  },
};
