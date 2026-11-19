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

export default {
  wesen: { ...ninkasi, ...gegner },
  gegenstaende: { ...getraenke },
  effekte,
  schadensarten,
  zustaende,
  aktionen,
  gelaende,
  ebenen,
  startebene: "keller",
  zeichen,
  regeln,
};
