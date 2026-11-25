// Tileset aus Zeichen: Ersatz, wo kein Tile aus grafik/ zur Zoomstufe passt.
// Farben nach den Tiles und der Palette in grafik/palette.js. Grundgerüst; der Probeinhalt bringt eigene Zeichen mit
// (datenproben/zeichen.js).
export default {
  gelaende: {
    wand: { zeichen: "#", farbe: "#8c7a63", hintergrund: "#2a221b" },
    boden: { zeichen: ".", farbe: "#6b5a44", hintergrund: "#14110e" },
    tuer_zu: { zeichen: "+", farbe: "#c87533", hintergrund: "#2a221b" },
    tuer_offen: { zeichen: "'", farbe: "#c87533", hintergrund: "#14110e" },
    treppe_ab: { zeichen: ">", farbe: "#f2c14e", hintergrund: "#14110e" },
    treppe_auf: { zeichen: "<", farbe: "#f2c14e", hintergrund: "#14110e" },
  },
  wesen: {
    ninkasi: { zeichen: "@", farbe: "#f2c14e" },
  },
  gegenstaende: {
    sud: { zeichen: "!", farbe: "#d9a441" },
    sud_verdorben: { zeichen: "!", farbe: "#a8a04a" },
    essig: { zeichen: "!", farbe: "#c9c08a" },
  },
  // Feldschichten: Farbe der Überlagerung, bei Gas mit der Menge zunehmend deckend (src/anzeige/renderer.js)
  schichten: {
    rauch: { farbe: "#9a9a9a" },
    feuer: { zeichen: "^", farbe: "#ff7a1a" },
  },
  fallen: {},
};
