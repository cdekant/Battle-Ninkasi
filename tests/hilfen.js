// Hilfen für Unittests: kleine Spiele aus Testkarten, ohne Dungeon-Erzeugung.
// Keine Testdatei (Endung nicht .test.js), wird von node --test nicht ausgeführt.

import gelaende from "../daten/gelaende.js";
import { neuerZustand, erzeugen } from "../src/kern/zustand.js";
import { ausDaten } from "../src/kern/werte.js";

// Spiel mit einer Karte aus Zeilen ("#" Wand, "." Boden), alles erkundet
export function miniSpiel(zeilen) {
  const zustand = neuerZustand(1);
  const breite = zeilen[0].length, hoehe = zeilen.length;
  zustand.ebene = { name: "test", breite, hoehe, felder: zeilen, erkundet: new Array(breite * hoehe).fill(1) };
  return { zustand, daten: { gelaende }, cache: {} };
}

// Wesen mit Position, Fraktion und LP
export function wesen(spiel, x, y, fraktion = "feinde", lp = 10) {
  return erzeugen(spiel.zustand, { fraktion, position: { x, y }, werte: ausDaten({ lp: { grund: lp } }) });
}

// Ninkasi als Spielerin
export function spielerin(spiel, x, y, lp = 100) {
  const p = wesen(spiel, x, y, "ninkasi", lp);
  spiel.zustand.spielerId = p.id;
  return p;
}
