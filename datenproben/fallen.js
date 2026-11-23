// Fallen (Aufbau siehe src/systeme/fallen.js): Entitäten auf einem Feld, verborgen, bis Ninkasi sie entdeckt.
// tarnung: Punkte gegen das Entdecken (Qualität der Falle); alle Zahlen vorläufig.
export default {
  // spritzt Säure auf, wer hineintritt
  saeureduese: {
    text: "falle.saeureduese",
    falle: { tarnung: 40, effekt: "saeureduese" },
  },
  // laut, aber harmlos: weckt die Nachbarschaft
  klappergeschirr: {
    text: "falle.klappergeschirr",
    falle: { tarnung: 20, effekt: "klappern" },
  },
};
