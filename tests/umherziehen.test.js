// Umherziehen wacher Wesen (siehe docs/Wesen.md, KI): Wegpunkte der Ebene, Wachzustand und Anführerin aus der
// Population, Ziehen von Wegpunkt zu Wegpunkt und Rudel

import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { vorbereiten } from "../src/kern/daten.js";
import { holen } from "../src/kern/register.js";
import { positionSetzen, alleEntitaeten, istWesen } from "../src/kern/zustand.js";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { betretbarFuer, durchsichtig, aufDerKarte, feldIndex } from "../src/welt/karte.js";
import PreciseShadowcasting from "../lib/rot/fov/precise-shadowcasting.js";

const DATEN = datenLaden(rohdaten, { texte });

// Ein Gang mit Wand in der Mitte, damit Ninkasi links außer Sicht bleibt
const RAUM = [
  "######################",
  "#....................#",
  "#....................#",
  "#....................#",
  "######################",
];

function aufstellen() {
  const spiel = miniSpiel(RAUM);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  spiel.zustand.ebene.wegpunkte = [{ x: 18, y: 2 }, { x: 10, y: 2 }, { x: 4, y: 3 }];
  return { spiel, ninkasi };
}

// Ein waches Wesen, das Ninkasi nicht sieht (Sichtweite 1)
const wacher = (spiel, x, y, kiZusatz = {}) =>
  wesen(spiel, x, y, "verderber", 10, { ki: { modul: "jagen", wachzustand: "wach", letzteBekanntePosition: null, ...kiZusatz }, sicht: { reichweite: 1 } });
const entscheiden = (spiel, wesenMitKi) => holen("ki", "jagen")(spiel, wesenMitKi, wesenMitKi.ki);

test("Wegpunkte: jedes begehbare Feld liegt in Sicht eines Wegpunkts, die Liste folgt aus dem Startwert", () => {
  const spiel = neuesSpiel(DATEN, 3);
  const ebene = spiel.zustand.ebene;
  const { wegpunkte } = ebene;
  assert.ok(wegpunkte.length > 1);
  const abgedeckt = new Uint8Array(ebene.breite * ebene.hoehe);
  const schattenwurf = new PreciseShadowcasting((x, y) => aufDerKarte(ebene, x, y) && durchsichtig(spiel, x, y), { topology: 8 });
  for (const wegpunkt of wegpunkte) {
    assert.ok(betretbarFuer(spiel, wegpunkt.x, wegpunkt.y), "auf begehbarem Feld");
    schattenwurf.compute(wegpunkt.x, wegpunkt.y, DATEN.regeln.ki.wegpunktSicht, (x, y) => { if (aufDerKarte(ebene, x, y)) abgedeckt[feldIndex(ebene, x, y)] = 1; });
  }
  for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) if (betretbarFuer(spiel, x, y)) assert.ok(abgedeckt[feldIndex(ebene, x, y)], `Feld ${x},${y}`);
  assert.deepEqual(neuesSpiel(DATEN, 3).zustand.ebene.wegpunkte, wegpunkte);
});

test("Population: ein Rudel schläft oder wacht gemeinsam, Mitglieder kennen ihre Anführerin", () => {
  const zustaende = new Set();
  let mitglieder = 0;
  for (const startwert of [1, 2, 3, 4, 5]) {
    const spiel = neuesSpiel(DATEN, startwert);
    for (const entitaet of alleEntitaeten(spiel.zustand)) {
      if (!istWesen(entitaet) || !entitaet.ki || entitaet.id === spiel.zustand.spielerinId) continue;
      zustaende.add(entitaet.ki.wachzustand);
      if (entitaet.ki.anfuehrerinId == null) continue;
      mitglieder++;
      const anfuehrerin = spiel.zustand.entitaeten[entitaet.ki.anfuehrerinId];
      assert.equal(anfuehrerin.typ, entitaet.typ);
      assert.equal(anfuehrerin.ki.anfuehrerinId, undefined, "die Anführerin folgt niemandem");
      assert.equal(entitaet.ki.wachzustand, anfuehrerin.ki.wachzustand, "das Rudel schläft oder wacht gemeinsam");
    }
  }
  assert.ok(mitglieder > 0, "es gibt Rudel");
  assert.deepEqual([...zustaende].sort(), ["schlaeft", "wach"]);
});

test("Umherziehen: zum Wegpunkt, dann zum nächsten unbesuchten; sind alle besucht, beginnt es neu", () => {
  const { spiel } = aufstellen();
  const zieher = wacher(spiel, 15, 2, { wanderung: { tiefe: spiel.zustand.tiefe, ziel: 0, besucht: [] } });
  const richtung = (befehl) => [befehl.art, befehl.dx];
  assert.deepEqual(richtung(entscheiden(spiel, zieher)), ["bewegen", 1]);
  positionSetzen(spiel.zustand, zieher, { x: 17, y: 2 });
  assert.deepEqual(richtung(entscheiden(spiel, zieher)), ["bewegen", -1], "erreicht: weiter zum nächsten, Nummer 1");
  assert.deepEqual(zieher.ki.wanderung, { tiefe: spiel.zustand.tiefe, ziel: 1, besucht: [0] });
  positionSetzen(spiel.zustand, zieher, { x: 10, y: 1 });
  entscheiden(spiel, zieher);
  assert.deepEqual([zieher.ki.wanderung.ziel, zieher.ki.wanderung.besucht], [2, [0, 1]]);
  positionSetzen(spiel.zustand, zieher, { x: 4, y: 2 });
  entscheiden(spiel, zieher);
  assert.deepEqual([zieher.ki.wanderung.ziel, zieher.ki.wanderung.besucht], [1, [2]], "alle besucht: neu, ohne den gerade erreichten");
});

test("Umherziehen: erster Wegpunkt gewürfelt, auf einer anderen Ebene neu; Lärm hat Vorrang; umherziehen false wartet", () => {
  const { spiel } = aufstellen();
  const zieher = wacher(spiel, 12, 2);
  assert.equal(entscheiden(spiel, zieher).art, "bewegen");
  assert.equal(zieher.ki.wanderung.tiefe, spiel.zustand.tiefe);
  zieher.ki.wanderung = { tiefe: 99, ziel: 0, besucht: [1, 2] };
  entscheiden(spiel, zieher);
  assert.equal(zieher.ki.wanderung.tiefe, spiel.zustand.tiefe, "auf dieser Ebene neu begonnen");
  assert.ok(zieher.ki.wanderung.besucht.length <= 1);
  zieher.ki.wanderung = { tiefe: spiel.zustand.tiefe, ziel: 0, besucht: [] };
  zieher.ki.letzteBekanntePosition = { x: 5, y: 2 };
  assert.equal(entscheiden(spiel, zieher).dx, -1, "geht dem Lärm nach, nicht zum Wegpunkt rechts");
  const waechter = wacher(spiel, 8, 3, { umherziehen: false });
  assert.deepEqual(entscheiden(spiel, waechter), { art: "warten" });
  const schlaefer = wacher(spiel, 8, 1, { wachzustand: "schlaeft" });
  assert.deepEqual(entscheiden(spiel, schlaefer), { art: "warten" });
});

test("Rudel: ein Mitglied bleibt bei der Anführerin; ist sie tot, zieht es allein", () => {
  const { spiel } = aufstellen();
  const anfuehrerin = wacher(spiel, 18, 2, { umherziehen: false });
  const mitglied = wacher(spiel, 6, 2, { anfuehrerinId: anfuehrerin.id });
  assert.equal(entscheiden(spiel, mitglied).dx, 1, "mehr als rudelAbstand: zu ihr");
  positionSetzen(spiel.zustand, mitglied, { x: 18 - spiel.daten.regeln.ki.rudelAbstand, y: 2 });
  assert.deepEqual(entscheiden(spiel, mitglied), { art: "warten" }, "nah genug");
  anfuehrerin.werte.lp.aktuell = 0;
  assert.equal(entscheiden(spiel, mitglied).art, "bewegen");
  assert.equal(mitglied.ki.anfuehrerinId, undefined);
  assert.ok(mitglied.ki.wanderung, "zieht allein");
});

test("Daten: umherziehen ist ein Wahrheitswert, die Regeln verlangen Sicht, Abstand und Schlafchance", () => {
  const daten = rohdatenMitTesteintraegen();
  const mitKi = Object.values(daten.wesen).find((eintrag) => eintrag.ki);
  mitKi.ki.umherziehen = "ja";
  daten.regeln.ki.wegpunktSicht = 0;
  daten.regeln.ki.rudelAbstand = -1;
  delete daten.regeln.population.schlafChance;
  const fehler = vorbereiten(daten).fehler.join("\n");
  for (const teil of ["umherziehen muss true oder false sein", "regeln.ki.wegpunktSicht", "regeln.ki.rudelAbstand", "regeln.population.schlafChance"]) assert.ok(fehler.includes(teil), teil);
});

test("Abstandskarte: Schritte zum Ziel, -1 für Unerreichbares; neues Gelände verwirft sie", async () => {
  const { abstandskarte } = await import("../src/welt/wege.js");
  const { gelaendeSetzen } = await import("../src/systeme/gelaende.js");
  const { spiel } = aufstellen();
  const ebene = spiel.zustand.ebene;
  const karte = abstandskarte(spiel, { x: 18, y: 2 });
  assert.equal(karte[feldIndex(ebene, 15, 1)], 3);
  assert.equal(karte[feldIndex(ebene, 0, 0)], -1, "Wand");
  assert.equal(abstandskarte(spiel, { x: 18, y: 2 }), karte, "aus dem Zwischenspeicher");
  for (const y of [1, 2, 3]) gelaendeSetzen(spiel, { x: 12, y }, "wand");
  const neu = abstandskarte(spiel, { x: 18, y: 2 });
  assert.notEqual(neu, karte);
  assert.equal(neu[feldIndex(ebene, 5, 2)], -1, "hinter der neuen Wand");
});

test("Umherziehen: ein unerreichbarer Wegpunkt gilt als besucht", () => {
  const { spiel } = aufstellen();
  spiel.zustand.ebene.wegpunkte = [{ x: 0, y: 0 }, { x: 4, y: 2 }];
  const zieher = wacher(spiel, 10, 2, { wanderung: { tiefe: spiel.zustand.tiefe, ziel: 0, besucht: [] } });
  assert.equal(entscheiden(spiel, zieher).dx, -1);
  assert.deepEqual(zieher.ki.wanderung, { tiefe: spiel.zustand.tiefe, ziel: 1, besucht: [0] });
});
