// Zeichen des Probeinhalts (Aufbau wie in daten/zeichen.js beschrieben); der Probeinhalt darf ohne Tiles auskommen.
export default {
  gelaende: {
    gaerbottich: { zeichen: "O", farbe: "#c87533", hintergrund: "#2a221b" },
  },
  wesen: {
    essigbakterium: { zeichen: "e", farbe: "#b4bd62" },
    fernkaempfer_test: { zeichen: "F", farbe: "#d2763a" },
  },
  gegenstaende: {
    bier: { zeichen: "!", farbe: "#e0952b" },
    bierfass: { zeichen: "&", farbe: "#a07a4a" },
    sauerbier: { zeichen: "!", farbe: "#a8a04a" },
    lederfetzen: { zeichen: ",", farbe: "#8c5a33" },
    kupferschrott: { zeichen: ",", farbe: "#5f8f7a" },
    leere_flasche: { zeichen: "!", farbe: "#8c7a63" },
    leeres_fass: { zeichen: "&", farbe: "#6b5a44" },
    brandflasche: { zeichen: "!", farbe: "#e5533d" },
    schoepfkelle: { zeichen: ")", farbe: "#b8b8b8" },
    fasshammer: { zeichen: ")", farbe: "#8c7a63" },
    lederschuerze: { zeichen: "[", farbe: "#8c5a33" },
    kupferhelm: { zeichen: "[", farbe: "#c87533" },
    lederhose: { zeichen: "[", farbe: "#a07a4a" },
    hopfenkette: { zeichen: "\"", farbe: "#8fbf4a" },
    kupferring: { zeichen: "=", farbe: "#c87533" },
  },
  schichten: {
    saeure: { farbe: "#b4bd62" },
    brand: { farbe: "#e0a83a" },
    asche: { farbe: "#6b6b6b" },
    co2: { farbe: "#7fa7c9" },
  },
  fallen: {
    saeureduese: { zeichen: "^", farbe: "#b4bd62" },
    klappergeschirr: { zeichen: "^", farbe: "#c87533" },
  },
};
