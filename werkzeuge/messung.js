// Messung der Leistung bei vielen Gegnern (siehe docs/Architektur.md, Leistung).
// Aufruf: node werkzeuge/messung.js [Gegner=300] [Befehle=400] [Startwert=7] [Türen in Prozent=aus den Daten] [Brandherde=0]
// Erzeugt die Ebene "keller" mit der angegebenen Zahl Essigbakterien und einem Fünftel so vielen Fernkämpfern,
// macht Ninkasi unverwundbar und lässt sie zufällig laufen; ein Befehl heißt: Ninkasi handelt, danach alle anderen.
// Gemessen wird die Zeit je Befehl ohne Anzeige; die Obergrenze der Population wird für die Messung angehoben.
// Türen kosten Zeit, weil Wesen, die keine Türen öffnen, sich in ihren Räumen drängen (mehr Nachbarn je Suche).
// Brandherde: so viele Kreise aus Hochprozentigem (Radius 2) auf zufälligen Bodenfeldern, zu Beginn entzündet,
// für einen Fall mit Feuer und Rauch (Feldschichten, src/systeme/schichten.js).

import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { zufallErzeugen, zufallsGanzzahl } from "../src/kern/zufall.js";
import { alleEntitaeten, istWesen, spielerin } from "../src/kern/zustand.js";
import { passierbar } from "../src/welt/karte.js";
import { kreis } from "../src/welt/geometrie.js";
import { oberflaecheSetzen, entzuenden } from "../src/systeme/schichten.js";

const [anzahlGegner = 300, anzahlBefehle = 400, startwert = 7, tuerChance, brandherde = 0] = process.argv.slice(2).map(Number);

const daten = structuredClone(rohdaten);
daten.ebenen.keller.gegner = [
  { typ: "essigbakterium", anzahl: anzahlGegner },
  { typ: "fernkaempfer_test", anzahl: Math.round(anzahlGegner / 5) },
];
if (tuerChance !== undefined) daten.ebenen.keller.tuerChance = tuerChance;
delete daten.ebenen.keller.population; // die feste Zahl oben statt der Population nach Tiefe
daten.regeln.population.hoechstWesen = Math.max(daten.regeln.population.hoechstWesen, 2 * anzahlGegner);
const spiel = neuesSpiel(datenLaden(daten, { texte }), startwert);
const ninkasi = spielerin(spiel.zustand);
ninkasi.werte.lp.grundwert = ninkasi.werte.lp.aktuell = 1000000; // überlebt die Messung

const botZufall = zufallErzeugen(startwert);
const ebene = spiel.zustand.ebene;
for (let herd = 0; herd < brandherde; herd++) {
  let mitte;
  do mitte = { x: zufallsGanzzahl(botZufall, 0, ebene.breite - 1), y: zufallsGanzzahl(botZufall, 0, ebene.hoehe - 1) };
  while (!passierbar(spiel, mitte.x, mitte.y));
  for (const feld of kreis(mitte, 2)) oberflaecheSetzen(spiel, feld, "brand", 6);
  for (const feld of kreis(mitte, 2)) entzuenden(spiel, feld);
}
const beginn = performance.now();
let gegeben = 0;
for (; gegeben < anzahlBefehle && !spiel.zustand.vorbei; gegeben++) {
  befehlGeben(spiel, { art: "bewegen", dx: zufallsGanzzahl(botZufall, -1, 1), dy: zufallsGanzzahl(botZufall, -1, 1) });
}
const dauer = performance.now() - beginn;
const wesen = alleEntitaeten(spiel.zustand).filter(istWesen).length;
console.log(`${wesen} Wesen (bestellt ${anzahlGegner} + ${Math.round(anzahlGegner / 5)} Gegner, Türen ${daten.ebenen.keller.tuerChance ?? 0} %, ${brandherde} Brandherde), ${gegeben} Befehle: ${(dauer / gegeben).toFixed(2)} ms je Befehl`);
