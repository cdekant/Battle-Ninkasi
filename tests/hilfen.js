// Hilfen für Unittests: kleine Spiele aus Testkarten, ohne Dungeon-Erzeugung.
// Keine Testdatei (Endung nicht .test.js), wird von node --test nicht ausgeführt.

import gelaende from "../daten/gelaende.js";
import regeln from "../daten/regeln.js";
import { neuerZustand, entitaetErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { zufallErzeugen } from "../src/kern/zufall.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { anmelden, abmelden } from "../src/kern/register.js";

// Spiel mit einer Karte aus Zeilen ("#" Wand, "." Boden), alles erkundet.
// optionen: { effekte: Testeffekte, regeln: Abweichungen der Regelwerte, startwert }
export function miniSpiel(kartenzeilen, { effekte = {}, regeln: regelAbweichungen = {}, startwert = 1 } = {}) {
  const zustand = neuerZustand(startwert);
  zustand.zufallszustand = zufallErzeugen(startwert);
  const breite = kartenzeilen[0].length, hoehe = kartenzeilen.length;
  zustand.ebene = { name: "test", breite, hoehe, felder: kartenzeilen, erkundet: new Array(breite * hoehe).fill(1) };
  const testregeln = { ...regeln, ausloeser: { ...regeln.ausloeser, ...regelAbweichungen.ausloeser } };
  return { zustand, daten: { gelaende, effekte, regeln: testregeln }, befehle: [], hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
}

// Wesen mit Position, Fraktion und LP; weitere Komponenten (ausloeser, angriff, beimTod ...) über zusatz
export function wesen(spiel, x, y, fraktion = "feinde", lp = 10, zusatz = {}) {
  return entitaetErzeugen(spiel.zustand, { fraktion, position: { x, y }, werte: werteAusDaten({ lp: { grundwert: lp } }), ...zusatz });
}

// Ninkasi als Spielerin
export function spielerinSetzen(spiel, x, y, lp = 100) {
  const ninkasi = wesen(spiel, x, y, "ninkasi", lp);
  spiel.zustand.spielerinId = ninkasi.id;
  return ninkasi;
}

// Gegenstand im Inventar einer Trägerin
export function gegenstandTragen(spiel, traegerin, komponenten = {}) {
  const gegenstand = entitaetErzeugen(spiel.zustand, { aufhebbar: true, ...komponenten, getragenVon: traegerin.id });
  if (!traegerin.inventar) traegerin.inventar = [];
  traegerin.inventar.push(gegenstand.id);
  return gegenstand;
}

// Schneidet alle Meldungen mit
export function meldungenMitschneiden(spiel) {
  const meldungen = [];
  hoererAnmelden(spiel, (meldung) => meldungen.push(meldung));
  return meldungen;
}

// Meldet einen Haken nur für die Dauer eines Tests an (t: Testkontext von node:test)
export function hakenFuerTest(t, hakenName, handler, optionen) {
  anmelden("haken", hakenName, handler, optionen);
  t.after(() => abmelden("haken", hakenName, handler));
  return handler;
}
