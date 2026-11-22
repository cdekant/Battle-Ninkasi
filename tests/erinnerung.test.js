// Erinnerung der Karte (siehe docs/Welt.md, Sicht und Erinnerung): was Ninkasi zuletzt gesehen hat, bleibt außer Sicht
// stehen; Kartieren macht bekannt ohne EP, Vergessen löscht das Wissen, nicht die einmal verdienten EP

import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { miniSpiel, lernendeSpielerin, wesen } from "./hilfen.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { entitaetErzeugen, entitaetEntfernen, spielerin } from "../src/kern/zustand.js";
import { positionSetzen } from "../src/kern/raumindex.js";
import { feldIndex, feldBekannt, bekannterGelaendeName } from "../src/welt/karte.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { kartieren, vergessen, erinnerteDingeAuf } from "../src/systeme/erinnerung.js";
import { feldBeschreiben } from "../src/systeme/untersuchen.js";
import { ebeneWechseln } from "../src/systeme/ebenen.js";
import { reiseBeginnen } from "../src/eingabe/reise.js";

const DATEN = datenLaden(rohdaten, { texte });

// Ein Gang, den eine Wand bei x = 5 in zwei Hälften teilt; Ninkasi sieht immer nur ihre Hälfte
const KARTE = ["##########", "#....#...#", "##########"];
const RECHTS = [6, 7, 8];

function aufstellen() {
  const spiel = miniSpiel([...KARTE]); // Kopie: die Tests verändern die Zeilen
  const ninkasi = lernendeSpielerin(spiel, 1, 1);
  ninkasi.sicht = { reichweite: 8 };
  const ebene = spiel.zustand.ebene;
  ebene.erkundet.fill(0);
  ebene.erinnerung.fill(null);
  sichtfeldAktualisieren(spiel);
  return { spiel, ninkasi, ebene };
}

function gehenNach(spiel, ninkasi, x, y) {
  positionSetzen(spiel.zustand, ninkasi, { x, y });
  sichtfeldAktualisieren(spiel);
}

test("Gesehenes bleibt außer Sicht so, wie Ninkasi es zuletzt gesehen hat", () => {
  const { spiel, ninkasi, ebene } = aufstellen();
  assert.equal(feldBekannt(ebene, 3, 1), true);
  assert.equal(feldBekannt(ebene, 7, 1), false, "hinter der Wand");
  // ein Gegenstand fällt in Sicht, dann geht Ninkasi hinüber
  const flasche = entitaetErzeugen(spiel.zustand, { typ: "flasche", text: "x", aufhebbar: true, position: { x: 3, y: 1 } });
  gehenNach(spiel, ninkasi, 7, 1);
  assert.deepEqual(erinnerteDingeAuf(ebene, feldIndex(ebene, 3, 1)).gegenstaende, [{ typ: "flasche", text: "x", anzahl: 1 }]);
  // außer Sicht verschwindet die Flasche und eine Wand entsteht: Ninkasi weiß davon nichts
  entitaetEntfernen(spiel.zustand, flasche.id);
  ebene.felder[1] = "#..#.#...#";
  assert.equal(bekannterGelaendeName(spiel, 3, 1), "boden");
  const beschreibung = feldBeschreiben(spiel, { x: 3, y: 1 });
  assert.equal(beschreibung.gelaende, "boden");
  assert.deepEqual(beschreibung.erinnert.gegenstaende, [{ typ: "flasche", text: "x", anzahl: 1 }]);
  // zurück in Sicht: die Erinnerung folgt dem heutigen Stand
  gehenNach(spiel, ninkasi, 1, 1);
  assert.equal(bekannterGelaendeName(spiel, 3, 1), "wand");
  assert.deepEqual(erinnerteDingeAuf(ebene, feldIndex(ebene, 3, 1)).gegenstaende, []);
});

test("Reise plant nach dem bekannten Gelände: eine erinnerte Wand trennt weiter, bis Ninkasi hinsieht", () => {
  const { spiel, ninkasi, ebene } = aufstellen();
  gehenNach(spiel, ninkasi, 7, 1);
  // die Wand bei 5 fällt, ohne dass die Sicht neu berechnet wird (als wäre es außer Sicht geschehen)
  ebene.felder[1] = "#........#";
  const einstellungen = { reiseTrotzFeinden: true, reiseHalt: [] };
  assert.equal(reiseBeginnen(spiel, { x: 1, y: 1 }, einstellungen).grund, "kein_weg", "nach der Erinnerung ist dort noch die Wand");
  sichtfeldAktualisieren(spiel);
  assert.ok(reiseBeginnen(spiel, { x: 1, y: 1 }, einstellungen).reise, "jetzt sieht sie die Lücke");
});

test("Kartieren macht bekannt ohne EP, erst das Sehen zählt; nach dem Vergessen bringt Wiedersehen keine EP", () => {
  const { spiel, ninkasi, ebene } = aufstellen();
  const indizes = RECHTS.map((x) => feldIndex(ebene, x, 1));
  const epVorher = ninkasi.freieEp;
  kartieren(spiel, indizes);
  assert.equal(feldBekannt(ebene, 7, 1), true);
  assert.equal(ebene.erkundet[feldIndex(ebene, 7, 1)], 0);
  assert.equal(ninkasi.freieEp, epVorher, "Kartieren bringt keine EP");
  gehenNach(spiel, ninkasi, 7, 1);
  const epGesehen = ninkasi.freieEp;
  assert.ok(epGesehen > epVorher, "das Sehen bringt sie");
  gehenNach(spiel, ninkasi, 1, 1);
  vergessen(spiel, indizes);
  assert.equal(feldBekannt(ebene, 7, 1), false);
  assert.equal(ebene.erkundet[feldIndex(ebene, 7, 1)], 1, "einmal gesehen bleibt gesehen");
  gehenNach(spiel, ninkasi, 7, 1);
  assert.equal(feldBekannt(ebene, 7, 1), true);
  assert.equal(ninkasi.freieEp, epGesehen, "Wiedersehen bringt keine EP");
});

test("Kartieren mit Dingen merkt auch, was darauf liegt; Wesen erinnert die Karte nie", () => {
  const { spiel, ebene } = aufstellen();
  entitaetErzeugen(spiel.zustand, { typ: "flasche", text: "x", aufhebbar: true, anzahl: 3, position: { x: 7, y: 1 } });
  wesen(spiel, 8, 1, "feinde");
  kartieren(spiel, [feldIndex(ebene, 6, 1)]);
  kartieren(spiel, [feldIndex(ebene, 7, 1), feldIndex(ebene, 8, 1)], { mitDingen: true });
  assert.deepEqual(erinnerteDingeAuf(ebene, feldIndex(ebene, 7, 1)).gegenstaende, [{ typ: "flasche", text: "x", anzahl: 3 }]);
  assert.deepEqual(erinnerteDingeAuf(ebene, feldIndex(ebene, 8, 1)), { oberflaeche: null, gegenstaende: [], fallen: [] });
  assert.equal(JSON.stringify(ebene.erinnerteDinge).includes("\"id\""), false, "keine IDs in der Erinnerung");
});

test("die verlassene Ebene behält ihre Erinnerung bis zur Rückkehr", () => {
  const spiel = neuesSpiel(DATEN, 7);
  const tiefe = spiel.zustand.tiefe;
  const vorher = [...spiel.zustand.ebene.erinnerung];
  assert.ok(vorher.some((kennung) => kennung !== null));
  ebeneWechseln(spiel, tiefe + 1);
  assert.ok(spiel.zustand.ebene.erinnerung.filter((kennung) => kennung !== null).length > 0, "die neue Ebene kennt nur das Gesehene");
  ebeneWechseln(spiel, tiefe);
  const nachher = spiel.zustand.ebene.erinnerung;
  vorher.forEach((kennung, index) => { if (kennung !== null) assert.notEqual(nachher[index], null, `Feld ${index}`); });
  assert.ok(spielerin(spiel.zustand));
});
