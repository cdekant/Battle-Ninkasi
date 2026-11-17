// Tileset: Palette und Tiles je Satz (Kantenlänge in Pixeln).
// Schlüssel der Tiles folgen daten/zeichen.js.
import palette from "./palette.js";
import boden64 from "./tiles/64/boden.js";
import wand64 from "./tiles/64/wand.js";
import ninkasi64 from "./tiles/64/ninkasi.js";
import essigbakterium64 from "./tiles/64/essigbakterium.js";
import bier64 from "./tiles/64/bier.js";

export default {
  palette,
  saetze: {
    64: {
      boden: boden64,
      wand: wand64,
      ninkasi: ninkasi64,
      essigbakterium: essigbakterium64,
      bier: bier64,
    },
  },
};
