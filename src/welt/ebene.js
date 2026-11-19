// Erzeugung einer Ebene aus Levelparametern (daten/ebenen.js).
// Grundriss: Digger von rot.js mit abgeleitetem Startwert, Inhalte mit eigenem abgeleiteten Zufall,
// damit die Ebene nicht vom Spielverlauf abhängt.

import RNG from "../../lib/rot/rng.js";
import Digger from "../../lib/rot/map/digger.js";
import { startwertAbleiten, zufallErzeugen, zufallsGanzzahl } from "../kern/zufall.js";
import { entitaetAusDatensatz, anzahlWesen } from "../kern/zustand.js";
import { melden } from "../kern/ereignisse.js";

export function ebeneErzeugen(spiel, ebenenName) {
  const zustand = spiel.zustand;
  const ebenendaten = spiel.daten.ebenen[ebenenName];
  const kennungWand = spiel.daten.gelaende[ebenendaten.gelaende.wand].kennung;
  const kennungBoden = spiel.daten.gelaende[ebenendaten.gelaende.boden].kennung;
  const { breite, hoehe } = ebenendaten;

  // rot.js nutzt einen globalen Zufall; Startwert 0 ist dort ungültig
  RNG.setSeed(startwertAbleiten(zustand.startwert, `ebene.${ebenenName}`) || 1);
  // timeLimit: Infinity, sonst bricht der Digger nach Uhrzeit ab und die Ebene ist nicht wiederholbar
  const digger = new Digger(breite, hoehe, { ...ebenendaten.digger, timeLimit: Infinity });
  const zeilen = Array.from({ length: hoehe }, () => new Array(breite).fill(kennungWand));
  // rot.js meldet je Feld 0 für Boden, 1 für Wand
  digger.create((x, y, feldart) => { if (feldart === 0) zeilen[y][x] = kennungBoden; });

  zustand.ebene = {
    name: ebenenName,
    breite,
    hoehe,
    felder: zeilen.map((zeile) => zeile.join("")),
    erkundet: new Array(breite * hoehe).fill(0),
  };

  // Ninkasi in die Mitte des ersten Raums
  const startraum = digger.getRooms()[0];
  const [startX, startY] = startraum.getCenter();
  const ninkasi = entitaetAusDatensatz(zustand, "ninkasi", spiel.daten.wesen.ninkasi, { x: startX, y: startY });
  zustand.spielerinId = ninkasi.id;

  // freie Bodenfelder außerhalb des Startraums, in fester Reihenfolge
  const freieFelder = [];
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      if (zeilen[y][x] !== kennungBoden) continue;
      const imStartraum = x >= startraum.getLeft() - 1 && x <= startraum.getRight() + 1
        && y >= startraum.getTop() - 1 && y <= startraum.getBottom() + 1;
      if (!imStartraum) freieFelder.push({ x, y });
    }
  }

  const inhaltsZufall = zufallErzeugen(startwertAbleiten(zustand.startwert, `ebene.${ebenenName}.inhalt`));
  const freiesFeldZiehen = () => {
    if (freieFelder.length === 0) return null;
    const gezogen = zufallsGanzzahl(inhaltsZufall, 0, freieFelder.length - 1);
    return freieFelder.splice(gezogen, 1)[0];
  };

  // Gegner höchstens bis zur Obergrenze der Population (regeln.population.hoechstWesen)
  const hoechstWesen = spiel.daten.regeln.population.hoechstWesen;
  let wesen = anzahlWesen(zustand), ausgefallen = 0;
  for (const gegnerEintrag of ebenendaten.gegner || []) {
    for (let i = 0; i < gegnerEintrag.anzahl; i++) {
      if (wesen >= hoechstWesen) {
        ausgefallen++;
        continue;
      }
      const feld = freiesFeldZiehen();
      if (!feld) continue;
      entitaetAusDatensatz(zustand, gegnerEintrag.typ, spiel.daten.wesen[gegnerEintrag.typ], feld);
      wesen++;
    }
  }
  if (ausgefallen) melden(spiel, "population_voll", { wesen: null, hoechstWesen, ausgefallen });
  for (const gegenstandEintrag of ebenendaten.gegenstaende || []) {
    for (let i = 0; i < gegenstandEintrag.anzahl; i++) {
      const feld = freiesFeldZiehen();
      if (feld) entitaetAusDatensatz(zustand, gegenstandEintrag.typ, spiel.daten.gegenstaende[gegenstandEintrag.typ], feld);
    }
  }
}
