// Ninkasi. Werte vorläufig, siehe docs/Charakter.md (Startwerte).
export default {
  ninkasi: {
    text: "wesen.ninkasi",
    fraktion: "ninkasi",
    werte: {
      lp: { grundwert: 100 },
      mp: { grundwert: 100 },
      pp: { grundwert: 100, anfangswert: 0 }, // Höchstwert der PP vorläufig 100
    },
    sicht: { reichweite: 8 },
    angriff: { trefferchance: 80, effekt: "faustschlag" },
    inventar: [],
    // Raten in Hundertsteln pro Welttick; Schwellen vorerst nur angezeigt und gemeldet
    pegel: { abklingenHundertstel: 100, regenerationHundertstel: { lp: 50, mp: 50 }, schwellen: [25, 50, 75] },
  },
};
