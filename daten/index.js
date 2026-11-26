// Grundgerüst der Inhaltsdaten: was die Regeln selbst brauchen und der echte Inhalt. Neue Datendateien hier eintragen.
// Was das Spiel tatsächlich lädt (Grundgerüst plus Probeinhalt), entscheidet src/inhalt.js
// (siehe docs/Architektur.md, Inhalte als Daten).
import ninkasi from "./ninkasi.js";
import effekte from "./effekte.js";
import schadensarten from "./schadensarten.js";
import aktionen from "./aktionen.js";
import gelaende from "./gelaende.js";
import ebenen from "./ebenen.js";
import zeichen from "./zeichen.js";
import regeln from "./regeln.js";
import fraktionen from "./fraktionen.js";
import schichten from "./schichten.js";
import eigenschaften from "./eigenschaften.js";
import taktiken from "./taktiken.js";
import glossar from "./glossar.js";
import bierstile from "./bierstile.js";
import zustaende from "./zustaende.js";
import sude from "./sude.js";

export default {
  wesen: { ...ninkasi },
  gegenstaende: { ...sude },
  schichten,
  fallen: {},
  effekte,
  schadensarten,
  zustaende,
  faehigkeiten: {},
  risiken: {},
  fraktionen,
  aktionen,
  gelaende,
  ebenen,
  populationen: {},
  etiketten: {},
  eigenschaften,
  skills: {},
  arenen: {},
  taktiken,
  glossar,
  bierstile,
  // Brauen (siehe docs/Sude.md): Kulturen, Zielgebiete und Rezepte bringt der Inhalt mit
  kulturen: {},
  zielgebiete: {},
  rezepte: {},
  // Absud (src/systeme/absud.js): Richtungen mit ihren Polen bringt der Inhalt mit
  absudrichtungen: {},
  // Tiefen von oben nach unten: 0 ist der Hub, das Spiel beginnt in starttiefe; der Plan des Laufs übernimmt sie (src/welt/plan.js)
  abfolge: ["hub"],
  starttiefe: 0,
  zeichen,
  regeln,
};
