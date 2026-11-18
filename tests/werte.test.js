import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prozentVon, hoechstwert, hatHoechstwert, wertBegrenztAendern, wertBegrenztAendernInHundertsteln,
  modifikatorHinzufuegen, modifikatorenEntfernen, werteAusDaten,
} from "../src/kern/werte.js";

const wesenMitLp = (grundwert = 100, anfangswert) => ({ werte: werteAusDaten({ lp: { grundwert, anfangswert } }) });

test("werteAusDaten: Anfangswert ist der Grundwert, wenn nichts anderes angegeben ist", () => {
  assert.deepEqual(werteAusDaten({ lp: { grundwert: 100 }, pp: { grundwert: 100, anfangswert: 0 } }), {
    lp: { grundwert: 100, aktuell: 100, hundertstelRest: 0 },
    pp: { grundwert: 100, aktuell: 0, hundertstelRest: 0 },
  });
});

test("werteAusDaten: ohne Grundwert ist der Wert nach oben offen", () => {
  const wesen = { werte: werteAusDaten({ pegel: { anfangswert: 0 } }) };
  assert.deepEqual(wesen.werte, { pegel: { aktuell: 0, hundertstelRest: 0 } });
  assert.equal(hatHoechstwert(wesen, "pegel"), false);
  assert.equal(hoechstwert(wesen, "pegel"), Infinity);
});

test("Offener Wert steigt über jede Grenze und bleibt nach unten bei 0", () => {
  const wesen = { werte: werteAusDaten({ pegel: { anfangswert: 0 } }) };
  assert.equal(wertBegrenztAendern(wesen, "pegel", 5000), 5000);
  assert.equal(wertBegrenztAendern(wesen, "pegel", -6000), -5000);
  assert.equal(wesen.werte.pegel.aktuell, 0);
  wertBegrenztAendernInHundertsteln(wesen, "pegel", 250);
  assert.equal(wesen.werte.pegel.aktuell, 2);
  assert.equal(wesen.werte.pegel.hundertstelRest, 50);
  wertBegrenztAendernInHundertsteln(wesen, "pegel", -400);
  assert.equal(wesen.werte.pegel.aktuell, 0);
  assert.equal(wesen.werte.pegel.hundertstelRest, 0);
  assert.equal(JSON.stringify(wesen.werte), '{"pegel":{"aktuell":0,"hundertstelRest":0}}');
});

test("prozentVon rundet kaufmännisch", () => {
  assert.equal(prozentVon(5, 50), 3);
  assert.equal(prozentVon(10, 25), 3);
  assert.equal(prozentVon(100, -10), -10);
});

test("Höchstwert: Plus und Prozent vom Grundwert werden addiert", () => {
  const wesen = wesenMitLp(100);
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 10, quelle: "a" });
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "prozent", betrag: 25, quelle: "b" });
  modifikatorHinzufuegen(wesen, { ziel: "mp", art: "plus", betrag: 99, quelle: "c" });
  assert.equal(hoechstwert(wesen, "lp"), 135);
});

test("Entfernen einer Quelle entfernt genau deren Modifikatoren", () => {
  const wesen = wesenMitLp(100);
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 10, quelle: "ring" });
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 5, quelle: "trank" });
  modifikatorenEntfernen(wesen, "ring");
  assert.equal(hoechstwert(wesen, "lp"), 105);
});

test("wertBegrenztAendern bleibt zwischen 0 und Höchstwert und meldet die tatsächliche Änderung", () => {
  const wesen = wesenMitLp(100, 90);
  assert.equal(wertBegrenztAendern(wesen, "lp", 20), 10);
  assert.equal(wesen.werte.lp.aktuell, 100);
  assert.equal(wertBegrenztAendern(wesen, "lp", -150), -100);
  assert.equal(wesen.werte.lp.aktuell, 0);
});

test("Änderung in Hundertsteln sammelt Bruchteile und schreibt volle Punkte gut", () => {
  const wesen = wesenMitLp(100, 50);
  assert.equal(wertBegrenztAendernInHundertsteln(wesen, "lp", 50), 0);
  assert.equal(wertBegrenztAendernInHundertsteln(wesen, "lp", 50), 1);
  assert.equal(wesen.werte.lp.aktuell, 51);
  assert.equal(wesen.werte.lp.hundertstelRest, 0);
  assert.equal(wertBegrenztAendernInHundertsteln(wesen, "lp", -150), -1);
  assert.equal(wesen.werte.lp.aktuell, 50);
  assert.equal(wesen.werte.lp.hundertstelRest, -50);
});

test("Änderung in Hundertsteln sammelt am Anschlag keinen Rest", () => {
  const vollesWesen = wesenMitLp(100);
  wertBegrenztAendernInHundertsteln(vollesWesen, "lp", 50);
  assert.equal(vollesWesen.werte.lp.hundertstelRest, 0);
  const leeresWesen = wesenMitLp(100, 0);
  wertBegrenztAendernInHundertsteln(leeresWesen, "lp", -50);
  assert.equal(leeresWesen.werte.lp.hundertstelRest, 0);
});
