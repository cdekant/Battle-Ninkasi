// Hilfen für Unittests: kleine Spiele aus Testkarten, ohne Dungeon-Erzeugung.
// Keine Testdatei (Endung nicht .test.js), wird von node --test nicht ausgeführt.

import gelaende from "../daten/gelaende.js";
import { neuerZustand, entitaetErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";

// Spiel mit einer Karte aus Zeilen ("#" Wand, "." Boden), alles erkundet
export function miniSpiel(kartenzeilen) {
  const zustand = neuerZustand(1);
  const breite = kartenzeilen[0].length, hoehe = kartenzeilen.length;
  zustand.ebene = { name: "test", breite, hoehe, felder: kartenzeilen, erkundet: new Array(breite * hoehe).fill(1) };
  return { zustand, daten: { gelaende }, zwischenspeicher: {} };
}

// Wesen mit Position, Fraktion und LP
export function wesen(spiel, x, y, fraktion = "feinde", lp = 10) {
  return entitaetErzeugen(spiel.zustand, { fraktion, position: { x, y }, werte: werteAusDaten({ lp: { grundwert: lp } }) });
}

// Ninkasi als Spielerin
export function spielerinSetzen(spiel, x, y, lp = 100) {
  const ninkasi = wesen(spiel, x, y, "ninkasi", lp);
  spiel.zustand.spielerinId = ninkasi.id;
  return ninkasi;
}
