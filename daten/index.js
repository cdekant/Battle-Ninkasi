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
import zustaende from "./zustaende.js";

export default {
  wesen: { ...ninkasi },
  gegenstaende: {},
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
  // Tiefen von oben nach unten: 0 ist der Hub, das Spiel beginnt in starttiefe; der Plan des Laufs übernimmt sie (src/welt/plan.js)
  abfolge: ["hub"],
  starttiefe: 0,
  zeichen,
  regeln,
};
