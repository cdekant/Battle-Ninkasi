// Tileset aus Zeichen: Ersatz, wo kein Tile aus grafik/ zur Zoomstufe passt.
// Farben nach den Tiles und der Palette in grafik/palette.js.
export default {
  gelaende: {
    wand: { zeichen: "#", farbe: "#8c7a63", hintergrund: "#2a221b" },
    boden: { zeichen: ".", farbe: "#6b5a44", hintergrund: "#14110e" },
    tuer_zu: { zeichen: "+", farbe: "#c87533", hintergrund: "#2a221b" },
    tuer_offen: { zeichen: "'", farbe: "#c87533", hintergrund: "#14110e" },
    gaerbottich: { zeichen: "O", farbe: "#c87533", hintergrund: "#2a221b" },
    treppe_ab: { zeichen: ">", farbe: "#f2c14e", hintergrund: "#14110e" },
    treppe_auf: { zeichen: "<", farbe: "#f2c14e", hintergrund: "#14110e" },
  },
  wesen: {
    ninkasi: { zeichen: "@", farbe: "#f2c14e" },
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
  // Feldschichten: Farbe der Überlagerung, bei Gas mit der Menge zunehmend deckend (src/anzeige/renderer.js)
  schichten: {
    saeure: { farbe: "#b4bd62" },
    brand: { farbe: "#e0a83a" },
    asche: { farbe: "#6b6b6b" },
    co2: { farbe: "#7fa7c9" },
    rauch: { farbe: "#9a9a9a" },
    feuer: { zeichen: "^", farbe: "#ff7a1a" },
  },
  fallen: {
    saeureduese: { zeichen: "^", farbe: "#b4bd62" },
    klappergeschirr: { zeichen: "^", farbe: "#c87533" },
  },
};
