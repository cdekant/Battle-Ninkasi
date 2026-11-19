// Tileset aus Zeichen: Ersatz, wo kein Tile aus grafik/ zur Zoomstufe passt.
// Farben nach den Tiles und der Palette in grafik/palette.js.
export default {
  gelaende: {
    wand: { zeichen: "#", farbe: "#8c7a63", hintergrund: "#2a221b" },
    boden: { zeichen: ".", farbe: "#6b5a44", hintergrund: "#14110e" },
    tuer_zu: { zeichen: "+", farbe: "#c87533", hintergrund: "#2a221b" },
    tuer_offen: { zeichen: "'", farbe: "#c87533", hintergrund: "#14110e" },
  },
  wesen: {
    ninkasi: { zeichen: "@", farbe: "#f2c14e" },
    essigbakterium: { zeichen: "e", farbe: "#b4bd62" },
    fernkaempfer_test: { zeichen: "F", farbe: "#d2763a" },
  },
  gegenstaende: {
    bier: { zeichen: "!", farbe: "#e0952b" },
  },
  fallen: {
    saeureduese: { zeichen: "^", farbe: "#b4bd62" },
    klappergeschirr: { zeichen: "^", farbe: "#c87533" },
  },
};
