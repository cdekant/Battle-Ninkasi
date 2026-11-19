// Messung der Leistung bei vielen Gegnern (siehe docs/Architektur.md, Leistung).
// Aufruf: node werkzeuge/messung.js [Gegner=300] [Befehle=400] [Startwert=7]
// Erzeugt die Ebene "keller" mit der angegebenen Zahl Essigbakterien und einem Fünftel so vielen Fernkämpfern,
// macht Ninkasi unverwundbar und lässt sie zufällig laufen; ein Befehl heißt: Ninkasi handelt, danach alle anderen.
// Gemessen wird die Zeit je Befehl ohne Anzeige; die Obergrenze der Population wird für die Messung angehoben.

import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { zufallErzeugen, zufallsGanzzahl } from "../src/kern/zufall.js";
import { alleEntitaeten, istWesen, spielerin } from "../src/kern/zustand.js";

const [anzahlGegner = 300, anzahlBefehle = 400, startwert = 7] = process.argv.slice(2).map(Number);

const daten = structuredClone(rohdaten);
daten.ebenen.keller.gegner = [
  { typ: "essigbakterium", anzahl: anzahlGegner },
  { typ: "fernkaempfer_test", anzahl: Math.round(anzahlGegner / 5) },
];
daten.regeln.population.hoechstWesen = Math.max(daten.regeln.population.hoechstWesen, 2 * anzahlGegner);
const spiel = neuesSpiel(datenLaden(daten, { texte }), startwert);
const ninkasi = spielerin(spiel.zustand);
ninkasi.werte.lp.grundwert = ninkasi.werte.lp.aktuell = 1000000; // überlebt die Messung

const botZufall = zufallErzeugen(startwert);
const beginn = performance.now();
let gegeben = 0;
for (; gegeben < anzahlBefehle && !spiel.zustand.vorbei; gegeben++) {
  befehlGeben(spiel, { art: "bewegen", dx: zufallsGanzzahl(botZufall, -1, 1), dy: zufallsGanzzahl(botZufall, -1, 1) });
}
const dauer = performance.now() - beginn;
const wesen = alleEntitaeten(spiel.zustand).filter(istWesen).length;
console.log(`${wesen} Wesen (bestellt ${anzahlGegner} + ${Math.round(anzahlGegner / 5)} Gegner), ${gegeben} Befehle: ${(dauer / gegeben).toFixed(2)} ms je Befehl`);
