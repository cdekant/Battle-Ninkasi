// Gegner. Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
export default {
  bakterium: {
    abstrakt: true,
    fraktion: "verderber",
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
  },

  essigbakterium: {
    vorlage: "bakterium",
    text: "wesen.essigbakterium",
    werte: { lp: { grundwert: 15 } },
    angriff: { trefferchance: 70, effekt: "biss_klein" },
  },
};
