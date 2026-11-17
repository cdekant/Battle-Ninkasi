// Erzeugung einer Ebene aus Levelparametern (daten/ebenen.js).
// Grundriss: Digger von rot.js mit abgeleitetem Startwert, Inhalte mit eigenem abgeleiteten RNG,
// damit die Ebene nicht vom Spielverlauf abhängt.

import RNG from "../../lib/rot/rng.js";
import Digger from "../../lib/rot/map/digger.js";
import { ableiten, erzeugen as rngErzeugen, ganzzahl } from "../kern/zufall.js";
import { ausDatensatz } from "../kern/zustand.js";

export function erzeugen(spiel, name) {
  const z = spiel.zustand;
  const p = spiel.daten.ebenen[name];
  const wand = spiel.daten.gelaende[p.gelaende.wand].kennung;
  const boden = spiel.daten.gelaende[p.gelaende.boden].kennung;

  // rot.js nutzt einen globalen RNG; Startwert 0 ist dort ungültig
  RNG.setSeed(ableiten(z.startwert, `ebene.${name}`) || 1);
  // timeLimit: Infinity, sonst bricht der Digger nach Uhrzeit ab und die Ebene ist nicht wiederholbar
  const digger = new Digger(p.breite, p.hoehe, { ...p.digger, timeLimit: Infinity });
  const zeilen = Array.from({ length: p.hoehe }, () => new Array(p.breite).fill(wand));
  digger.create((x, y, wert) => { if (wert === 0) zeilen[y][x] = boden; });

  z.ebene = {
    name,
    breite: p.breite,
    hoehe: p.hoehe,
    felder: zeilen.map((r) => r.join("")),
    erkundet: new Array(p.breite * p.hoehe).fill(0),
  };

  // Ninkasi in die Mitte des ersten Raums
  const raeume = digger.getRooms();
  const erster = raeume[0];
  const [sx, sy] = erster.getCenter();
  const ninkasi = ausDatensatz(z, "ninkasi", spiel.daten.wesen.ninkasi, { x: sx, y: sy });
  z.spielerId = ninkasi.id;

  // freie Bodenfelder außerhalb des Startraums, in fester Reihenfolge
  const frei = [];
  for (let y = 0; y < p.hoehe; y++) {
    for (let x = 0; x < p.breite; x++) {
      if (zeilen[y][x] !== boden) continue;
      const imStartraum = x >= erster.getLeft() - 1 && x <= erster.getRight() + 1 && y >= erster.getTop() - 1 && y <= erster.getBottom() + 1;
      if (!imStartraum) frei.push({ x, y });
    }
  }

  const rng = rngErzeugen(ableiten(z.startwert, `ebene.${name}.inhalt`));
  const ziehen = () => {
    if (frei.length === 0) return null;
    const i = ganzzahl(rng, 0, frei.length - 1);
    return frei.splice(i, 1)[0];
  };

  for (const g of p.gegner || []) {
    for (let i = 0; i < g.anzahl; i++) {
      const pos = ziehen();
      if (pos) ausDatensatz(z, g.typ, spiel.daten.wesen[g.typ], pos);
    }
  }
  for (const g of p.gegenstaende || []) {
    for (let i = 0; i < g.anzahl; i++) {
      const pos = ziehen();
      if (pos) ausDatensatz(z, g.typ, spiel.daten.gegenstaende[g.typ], pos);
    }
  }
}
