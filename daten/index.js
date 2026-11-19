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

export default {
  wesen: { ...ninkasi, ...gegner },
  gegenstaende: { ...getraenke },
  effekte,
  schadensarten,
  zustaende,
  faehigkeiten,
  risiken,
  fraktionen,
  aktionen,
  gelaende,
  ebenen,
  startebene: "keller",
  zeichen,
  regeln,
};
