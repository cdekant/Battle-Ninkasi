// Sammelt alle Inhaltsdaten. Neue Datendateien hier eintragen.
import ninkasi from "./ninkasi.js";
import gegner from "./gegner.js";
import getraenke from "./getraenke.js";
import effekte from "./effekte.js";
import schadensarten from "./schadensarten.js";
import aktionen from "./aktionen.js";
import gelaende from "./gelaende.js";
import ebenen from "./ebenen.js";
import zeichen from "./zeichen.js";
import regeln from "./regeln.js";
import zustaende from "./zustaende.js";
import faehigkeiten from "./faehigkeiten.js";
import risiken from "./risiken.js";
import fraktionen from "./fraktionen.js";
import fallen from "./fallen.js";
import schichten from "./schichten.js";
import wurfgegenstaende from "./wurfgegenstaende.js";
import populationen from "./populationen.js";
import ausruestung from "./ausruestung.js";
import etiketten from "./etiketten.js";

export default {
  wesen: { ...ninkasi, ...gegner },
  gegenstaende: { ...getraenke, ...wurfgegenstaende, ...ausruestung },
  schichten,
  fallen,
  effekte,
  schadensarten,
  zustaende,
  faehigkeiten,
  risiken,
  fraktionen,
  aktionen,
  gelaende,
  ebenen,
  populationen,
  etiketten,
  // Tiefen von oben nach unten: 0 ist der Hub, das Spiel beginnt in starttiefe (src/welt/ebene.js, src/systeme/ebenen.js)
  abfolge: ["hub", "keller", "keller", "keller"],
  starttiefe: 1,
  zeichen,
  regeln,
};
