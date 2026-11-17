// Tileset: Palette und Tiles je Satz (Kantenlänge in Pixeln).
// Schlüssel der Tiles folgen daten/zeichen.js; Wände haben zwei Ansichten (Oberseite, Vorderseite).
import palette from "./palette.js";
import boden64 from "./tiles/64/boden.js";
import wandOben64 from "./tiles/64/wand-oben.js";
import wandVorn64 from "./tiles/64/wand-vorn.js";

export default {
  palette,
  saetze: {
    64: {
      boden: boden64,
      wandOben: wandOben64,
      wandVorn: wandVorn64,
    },
  },
};
