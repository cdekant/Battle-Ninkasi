// Ninkasi. Werte vorläufig, siehe docs/Charakter.md (Startwerte).
export default {
  ninkasi: {
    text: "wesen.ninkasi",
    fraktion: "ninkasi",
    werte: {
      lp: { grund: 100 },
      mp: { grund: 100 },
      pp: { grund: 100, start: 0 }, // Höchstwert der PP vorläufig 100
    },
    sicht: { weite: 8 },
    angriff: { trefferchance: 80, effekt: "faustschlag" },
    inventar: [],
    // Raten in Hundertsteln pro Welttick; Schwellen vorerst nur angezeigt und gemeldet
    pegel: { abklingen: 100, regeneration: { lp: 50, mp: 50 }, schwellen: [25, 50, 75] },
  },
};
