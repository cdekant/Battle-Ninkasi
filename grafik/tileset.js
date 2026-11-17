// Tileset: Palette und Tiles je Satz (Kantenlänge in Pixeln).
// Erzeugt von werkzeuge/tiles-ableiten.js aus den Dateien in tiles/, nicht von Hand ändern.
// Schlüssel der Tiles folgen daten/zeichen.js.
import palette from "./palette.js";
import bier64 from "./tiles/64/bier.js";
import boden64 from "./tiles/64/boden.js";
import essigbakterium64 from "./tiles/64/essigbakterium.js";
import ninkasi64 from "./tiles/64/ninkasi.js";
import wand64 from "./tiles/64/wand.js";
import bier48 from "./tiles/48/bier.js";
import boden48 from "./tiles/48/boden.js";
import essigbakterium48 from "./tiles/48/essigbakterium.js";
import ninkasi48 from "./tiles/48/ninkasi.js";
import wand48 from "./tiles/48/wand.js";
import bier32 from "./tiles/32/bier.js";
import boden32 from "./tiles/32/boden.js";
import essigbakterium32 from "./tiles/32/essigbakterium.js";
import ninkasi32 from "./tiles/32/ninkasi.js";
import wand32 from "./tiles/32/wand.js";
import bier16 from "./tiles/16/bier.js";
import boden16 from "./tiles/16/boden.js";
import essigbakterium16 from "./tiles/16/essigbakterium.js";
import ninkasi16 from "./tiles/16/ninkasi.js";
import wand16 from "./tiles/16/wand.js";

export default {
  palette,
  saetze: {
    64: { bier: bier64, boden: boden64, essigbakterium: essigbakterium64, ninkasi: ninkasi64, wand: wand64 },
    48: { bier: bier48, boden: boden48, essigbakterium: essigbakterium48, ninkasi: ninkasi48, wand: wand48 },
    32: { bier: bier32, boden: boden32, essigbakterium: essigbakterium32, ninkasi: ninkasi32, wand: wand32 },
    16: { bier: bier16, boden: boden16, essigbakterium: essigbakterium16, ninkasi: ninkasi16, wand: wand16 },
  },
};
