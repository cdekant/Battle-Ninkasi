// Probeinhalt: vorläufige Inhalte zum Ausprobieren der Systeme, bis echter Inhalt in daten/ entsteht
// (siehe docs/Entwicklung.md, Probeinhalt). Kommt über datenZusammenfuegen (src/kern/daten.js) zum Grundgerüst;
// zusammengeführt wird in src/inhalt.js. Neue Dateien des Probeinhalts hier eintragen.
//   eintraege: Sammlungen wie im Grundgerüst, kein Name darf dort schon stehen
//   ergaenzen: Felder für Einträge des Grundgerüsts, je Sammlung und Name
//   abfolge, starttiefe: ersetzen die des Grundgerüsts
import gegner from "./gegner.js";
import getraenke from "./getraenke.js";
import wurfgegenstaende from "./wurfgegenstaende.js";
import fernwaffen from "./fernwaffen.js";
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
import zutaten from "./zutaten.js";
import kulturen from "./kulturen.js";
import zielgebiete from "./zielgebiete.js";
import rezepte from "./rezepte.js";
import absudrichtungen from "./absudrichtungen.js";
import absude from "./absude.js";

export default {
  eintraege: {
    wesen: gegner,
    gegenstaende: { ...getraenke, ...wurfgegenstaende, ...fernwaffen, ...ausruestung, ...zutaten, ...absude },
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
    kulturen,
    zielgebiete,
    rezepte,
    absudrichtungen,
  },
  // Ninkasi bekommt die vorläufige Fähigkeit für den Zielmodus, den Sprint und eine Psi-Fähigkeit, dazu die
  // Grundausstattung (docs/Charakter.md, Startwerte): den Dolch angelegt und Wurfmesser im Gepäck; Kulturen gewinnt sie
  // im Lauf (docs/Sude.md, Kulturen): wilde Hefe lebt im Keller, Bierhefe und Milchsäure liegen dort als Krüge
  ergaenzen: {
    // Verderber aus dem Kessel (src/systeme/reifen.js): das Essigbakterium
    // Rest einer gestorbenen Kulturquelle (src/systeme/kulturen.js): Hefeschleim
    regeln: { brauen: { verderber: { chance: 30, wesen: "essigbakterium" }, rest: "hefeschleim" } },
    // Essig führt im Absud zur Säure (datenproben/absudrichtungen.js)
    gegenstaende: { essig: { zutat: { art: "grundstoff", aromen: { saeure: 100 }, richtungen: { saeure: 40 } } } },
    wesen: {
      ninkasi: {
        faehigkeiten: ["testfaehigkeit", "sprint", "gedankenstich"],
        ausstattung: [{ typ: "dolch", angelegt: true }, { typ: "wurfmesser", anzahl: 8 }],
      },
    },
  },
  // Hub, darunter drei Kellertiefen; der Lauf beginnt im ersten Keller
  abfolge: ["hub", "keller", "keller_dunkel", "keller"],
  starttiefe: 1,
};
