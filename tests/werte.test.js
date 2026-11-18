import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prozentVon, hoechstwert, hatHoechstwert, wertBegrenztAendern, wertBegrenztAendernInHundertsteln,
  modifikatorHinzufuegen, modifikatorenEntfernen, werteAusDaten,
  verrechnet, modifiziert, modifikatorSkaliert, modifikatorenAufgeschluesselt,
} from "../src/kern/werte.js";
import { anmelden, abmelden } from "../src/kern/register.js";

// Ohne Zustände und weitere Quellen braucht die Abfrage nichts aus dem Spiel
const SPIEL = {};

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
  assert.equal(hoechstwert(SPIEL, wesen, "pegel"), Infinity);
});

test("Offener Wert steigt über jede Grenze und bleibt nach unten bei 0", () => {
  const wesen = { werte: werteAusDaten({ pegel: { anfangswert: 0 } }) };
  assert.equal(wertBegrenztAendern(SPIEL, wesen, "pegel", 5000), 5000);
  assert.equal(wertBegrenztAendern(SPIEL, wesen, "pegel", -6000), -5000);
  assert.equal(wesen.werte.pegel.aktuell, 0);
  wertBegrenztAendernInHundertsteln(SPIEL, wesen, "pegel", 250);
  assert.equal(wesen.werte.pegel.aktuell, 2);
  assert.equal(wesen.werte.pegel.hundertstelRest, 50);
  wertBegrenztAendernInHundertsteln(SPIEL, wesen, "pegel", -400);
  assert.equal(wesen.werte.pegel.aktuell, 0);
  assert.equal(wesen.werte.pegel.hundertstelRest, 0);
  assert.equal(JSON.stringify(wesen.werte), '{"pegel":{"aktuell":0,"hundertstelRest":0}}');
});

test("prozentVon rundet kaufmännisch", () => {
  assert.equal(prozentVon(5, 50), 3);
  assert.equal(prozentVon(10, 25), 3);
  assert.equal(prozentVon(100, -10), -10);
});

test("Höchstwert: Plus vor Prozent, Prozente auf Grundwert und Plus", () => {
  const wesen = wesenMitLp(100);
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 10, quelle: "a" });
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "prozent", betrag: 25, quelle: "b" });
  modifikatorHinzufuegen(wesen, { ziel: "mp", art: "plus", betrag: 99, quelle: "c" });
  assert.equal(hoechstwert(SPIEL, wesen, "lp"), 138, "(100 + 10) x 125 % = 137,5");
});

test("Entfernen einer Quelle entfernt genau deren Modifikatoren", () => {
  const wesen = wesenMitLp(100);
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 10, quelle: "ring" });
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 5, quelle: "trank" });
  modifikatorenEntfernen(wesen, "ring");
  assert.equal(hoechstwert(SPIEL, wesen, "lp"), 105);
});

test("wertBegrenztAendern bleibt zwischen 0 und Höchstwert und meldet die tatsächliche Änderung", () => {
  const wesen = wesenMitLp(100, 90);
  assert.equal(wertBegrenztAendern(SPIEL, wesen, "lp", 20), 10);
  assert.equal(wesen.werte.lp.aktuell, 100);
  assert.equal(wertBegrenztAendern(SPIEL, wesen, "lp", -150), -100);
  assert.equal(wesen.werte.lp.aktuell, 0);
});

test("Änderung in Hundertsteln sammelt Bruchteile und schreibt volle Punkte gut", () => {
  const wesen = wesenMitLp(100, 50);
  assert.equal(wertBegrenztAendernInHundertsteln(SPIEL, wesen, "lp", 50), 0);
  assert.equal(wertBegrenztAendernInHundertsteln(SPIEL, wesen, "lp", 50), 1);
  assert.equal(wesen.werte.lp.aktuell, 51);
  assert.equal(wesen.werte.lp.hundertstelRest, 0);
  assert.equal(wertBegrenztAendernInHundertsteln(SPIEL, wesen, "lp", -150), -1);
  assert.equal(wesen.werte.lp.aktuell, 50);
  assert.equal(wesen.werte.lp.hundertstelRest, -50);
});

test("Änderung in Hundertsteln sammelt am Anschlag keinen Rest", () => {
  const vollesWesen = wesenMitLp(100);
  wertBegrenztAendernInHundertsteln(SPIEL, vollesWesen, "lp", 50);
  assert.equal(vollesWesen.werte.lp.hundertstelRest, 0);
  const leeresWesen = wesenMitLp(100, 0);
  wertBegrenztAendernInHundertsteln(SPIEL, leeresWesen, "lp", -50);
  assert.equal(leeresWesen.werte.lp.hundertstelRest, 0);
});

const mod = (art, betrag, ziel = "x") => ({ ziel, art, betrag, quelle: "test" });

test("Verrechnung: Prozente addieren sich, nur mal multipliziert", () => {
  const zehnMalFuenfProzent = Array.from({ length: 10 }, () => mod("prozent", 5));
  assert.equal(verrechnet(100, zehnMalFuenfProzent), 150, "kein Zinseszins");
  assert.equal(verrechnet(100, [mod("mal", 105), mod("mal", 105)]), 110, "110,25 gerundet");
  assert.equal(verrechnet(100, [mod("plus", 20), mod("prozent", 50), mod("mal", 200)]), 360);
  assert.equal(verrechnet(100, [mod("prozent", -150)]), -50, "Grenzen nach unten setzen erst die Aufrufer");
});

test("Verrechnung: einmal gerundet am Ende, unabhängig von der Reihenfolge", () => {
  const modifikatoren = [mod("mal", 133), mod("prozent", 7), mod("mal", 91), mod("plus", 3)];
  const ergebnis = verrechnet(37, modifikatoren);
  assert.equal(ergebnis, Math.round(40 * 1.07 * 1.33 * 0.91));
  assert.equal(verrechnet(37, [...modifikatoren].reverse()), ergebnis);
});

test("Grenzen: mindestens, hoechstens gewinnt, setzen zählt als beides", () => {
  assert.equal(verrechnet(3, [mod("mindestens", 5)]), 5);
  assert.equal(verrechnet(8, [mod("mindestens", 5), mod("mindestens", 6)]), 8);
  assert.equal(verrechnet(8, [mod("hoechstens", 1), mod("plus", 4)]), 1, "Blindheit schlägt Fernsicht");
  assert.equal(verrechnet(8, [mod("mindestens", 5), mod("hoechstens", 2)]), 2);
  assert.equal(verrechnet(8, [mod("setzen", 0), mod("prozent", 300)]), 0);
});

test("Skalieren mit der Stärke: Beträge und Anteil über 100, Grenzen nicht", () => {
  assert.equal(modifikatorSkaliert(mod("plus", 10), 250).betrag, 25);
  assert.equal(modifikatorSkaliert(mod("prozent", -20), 50).betrag, -10);
  assert.equal(modifikatorSkaliert(mod("mal", 150), 50).betrag, 125);
  assert.equal(modifikatorSkaliert(mod("mal", 50), 200).betrag, 0);
  assert.equal(modifikatorSkaliert(mod("hoechstens", 1), 30).betrag, 1);
});

test("Modifikatorquellen: alle angemeldeten Quellen werden bei jeder Abfrage gesammelt", () => {
  const wesen = wesenMitLp(100);
  modifikatorHinzufuegen(wesen, { ziel: "lp", art: "plus", betrag: 10, quelle: "ring" });
  let auraAktiv = true;
  const aura = (spiel, entitaet) => (auraAktiv && entitaet === wesen ? [{ ziel: "lp", art: "prozent", betrag: 50, quelle: "aura" }] : []);
  anmelden("modifikatorquellen", "testaura", aura);
  try {
    assert.equal(modifiziert(SPIEL, wesen, "lp", 100), 165);
    assert.deepEqual(modifikatorenAufgeschluesselt(SPIEL, wesen, "lp").map((modifikator) => modifikator.quelle), ["ring", "aura"]);
    auraAktiv = false;
    assert.equal(hoechstwert(SPIEL, wesen, "lp"), 110, "ohne Nachführen sofort weg");
  } finally {
    abmelden("modifikatorquellen", "testaura");
  }
});
