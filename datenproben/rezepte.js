// Gefundene Rezepte des Probeinhalts (siehe docs/Sude.md, Nebel und Rezepte): Zutaten im Verhältnis zu den Portionen, Verfahren,
// Kultur, ein Kniff und die freien EP beim ersten Gelingen; gelehrt von der Tontafel (datenproben/zutaten.js). Zahlen
// vorläufig.
//   kniff: { bonus?, effekt? }: bonus sind Prozentpunkte auf das Budget der Wirkung, effekt wirkt beim Trinken zusätzlich
export default {
  // eine Portion aus zwei Bierbroten und einer Dattel als Kniff: dunkel und röstig, mit der wilden Hefe vom Start
  dunkles_bier: {
    text: "rezept.dunkles_bier", zielgebiet: "dunkles_bier", portionen: 1,
    zutaten: [{ typ: "bierbrot", menge: 2 }, { typ: "datteln", menge: 1 }],
    verfahren: { maische: "warm", gewuerz: "frueh" }, kultur: "wilde_hefe",
    kniff: { bonus: 20 }, ep: 100,
  },
};
