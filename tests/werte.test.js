import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prozentVon, maximum, aendern, aendernHundertstel, modifikatorHinzufuegen, modifikatorenEntfernen, ausDaten,
} from "../src/kern/werte.js";

const wesen = (grund = 100, start) => ({ werte: ausDaten({ lp: { grund, start } }) });

test("ausDaten: Startwert ist der Grundwert, wenn nichts anderes angegeben ist", () => {
  assert.deepEqual(ausDaten({ lp: { grund: 100 }, pp: { grund: 100, start: 0 } }), {
    lp: { grund: 100, aktuell: 100, speicher: 0 },
    pp: { grund: 100, aktuell: 0, speicher: 0 },
  });
});

test("prozentVon rundet kaufmännisch", () => {
  assert.equal(prozentVon(5, 50), 3);
  assert.equal(prozentVon(10, 25), 3);
  assert.equal(prozentVon(100, -10), -10);
});

test("Maximum: Plus und Prozent vom Grundwert werden addiert", () => {
  const e = wesen(100);
  modifikatorHinzufuegen(e, { ziel: "lp", art: "plus", betrag: 10, quelle: "a" });
  modifikatorHinzufuegen(e, { ziel: "lp", art: "prozent", betrag: 25, quelle: "b" });
  modifikatorHinzufuegen(e, { ziel: "mp", art: "plus", betrag: 99, quelle: "c" });
  assert.equal(maximum(e, "lp"), 135);
});

test("Entfernen einer Quelle entfernt genau deren Modifikatoren", () => {
  const e = wesen(100);
  modifikatorHinzufuegen(e, { ziel: "lp", art: "plus", betrag: 10, quelle: "ring" });
  modifikatorHinzufuegen(e, { ziel: "lp", art: "plus", betrag: 5, quelle: "trank" });
  modifikatorenEntfernen(e, "ring");
  assert.equal(maximum(e, "lp"), 105);
});

test("aendern bleibt zwischen 0 und Maximum und meldet die tatsächliche Änderung", () => {
  const e = wesen(100, 90);
  assert.equal(aendern(e, "lp", 20), 10);
  assert.equal(e.werte.lp.aktuell, 100);
  assert.equal(aendern(e, "lp", -150), -100);
  assert.equal(e.werte.lp.aktuell, 0);
});

test("aendernHundertstel sammelt Bruchteile und schreibt volle Punkte gut", () => {
  const e = wesen(100, 50);
  assert.equal(aendernHundertstel(e, "lp", 50), 0);
  assert.equal(aendernHundertstel(e, "lp", 50), 1);
  assert.equal(e.werte.lp.aktuell, 51);
  assert.equal(e.werte.lp.speicher, 0);
  assert.equal(aendernHundertstel(e, "lp", -150), -1);
  assert.equal(e.werte.lp.aktuell, 50);
  assert.equal(e.werte.lp.speicher, -50);
});

test("aendernHundertstel sammelt am Anschlag keinen Rest", () => {
  const voll = wesen(100);
  aendernHundertstel(voll, "lp", 50);
  assert.equal(voll.werte.lp.speicher, 0);
  const leer = wesen(100, 0);
  aendernHundertstel(leer, "lp", -50);
  assert.equal(leer.werte.lp.speicher, 0);
});
