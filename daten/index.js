// Sammelt alle Inhaltsdaten. Neue Datendateien hier eintragen.
import ninkasi from "./ninkasi.js";
import gegner from "./gegner.js";
import getraenke from "./getraenke.js";
import effekte from "./effekte.js";
import aktionen from "./aktionen.js";
import gelaende from "./gelaende.js";
import ebenen from "./ebenen.js";
import zeichen from "./zeichen.js";

export default {
  wesen: { ...ninkasi, ...gegner },
  gegenstaende: { ...getraenke },
  effekte,
  aktionen,
  gelaende,
  ebenen,
  startebene: "keller",
  zeichen,
};
