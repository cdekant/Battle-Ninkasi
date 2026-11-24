// Probeinhalt: vorläufige Inhalte zum Ausprobieren der Systeme, bis echter Inhalt in daten/ entsteht
// (siehe docs/Entwicklung.md, Probeinhalt). Kommt über datenZusammenfuegen (src/kern/daten.js) zum Grundgerüst;
// zusammengeführt wird in src/inhalt.js. Neue Dateien des Probeinhalts hier eintragen.
//   eintraege: Sammlungen wie im Grundgerüst, kein Name darf dort schon stehen
//   ergaenzen: Felder für Einträge des Grundgerüsts, je Sammlung und Name
//   abfolge, starttiefe: ersetzen die des Grundgerüsts
import gegner from "./gegner.js";
import getraenke from "./getraenke.js";
import wurfgegenstaende from "./wurfgegenstaende.js";
import ausruestung from "./ausruestung.js";
import effekte from "./effekte.js";
import schichten from "./schichten.js";
import fallen from "./fallen.js";
import zustaende from "./zustaende.js";
import faehigkeiten from "./faehigkeiten.js";
import risiken from "./risiken.js";
import fraktionen from "./fraktionen.js";
import gelaende from "./gelaende.js";
import ebenen from "./ebenen.js";
import populationen from "./populationen.js";
import etiketten from "./etiketten.js";
import skills from "./skills.js";
import arenen from "./arenen.js";
import zeichen from "./zeichen.js";

export default {
  eintraege: {
    wesen: gegner,
    gegenstaende: { ...getraenke, ...wurfgegenstaende, ...ausruestung },
    schichten,
    fallen,
    effekte,
    zustaende,
    faehigkeiten,
    risiken,
    fraktionen,
    gelaende,
    ebenen,
    populationen,
    etiketten,
    skills,
    arenen,
    zeichen,
  },
  // Ninkasi bekommt die vorläufige Fähigkeit für den Zielmodus, den Sprint und eine Psi-Fähigkeit
  ergaenzen: {
    wesen: { ninkasi: { faehigkeiten: ["testfaehigkeit", "sprint", "gedankenstich"] } },
  },
  // Hub, darunter drei Kellertiefen; der Lauf beginnt im ersten Keller
  abfolge: ["hub", "keller", "keller_dunkel", "keller"],
  starttiefe: 1,
};
