// Räumender Bot (werkzeuge/raeumen.js): ein Lauf räumt die erste Ebene, lässt sich nachspielen, die EP gehen auf
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { datenLaden } from "../src/kern/spiel.js";
import { spielerin } from "../src/kern/zustand.js";
import { laufRaeumen, nachspielenPruefen, grundskillsAufFuenf, LERNREIHENFOLGE } from "../werkzeuge/raeumen.js";

const daten = datenLaden(rohdaten, { texte });

test("Räumen: die erste Ebene wird geräumt und erkundet, der Lauf lässt sich nachspielen", () => {
  const lauf = laufRaeumen(daten, 1);
  assert.equal(lauf.ergebnis, "geraeumt");
  const [ebene] = lauf.ebenen;
  assert.equal(ebene.tiefe, 1);
  assert.equal(ebene.besiegt, ebene.feinde, "alle Feinde besiegt");
  assert.ok(ebene.feinde > 20);
  assert.equal(ebene.erkundet, ebene.felder, "alles erkundet");
  nachspielenPruefen(daten, lauf.spiel);
});

test("Räumen: die EP nach Herkunft gehen in Lernstand und freie EP auf", () => {
  const lauf = laufRaeumen(daten, 2);
  const ninkasi = spielerin(lauf.spiel.zustand);
  const { start, erkundung, gebunden, freiAusBeute, gesamt } = lauf.ep;
  assert.equal(start, daten.regeln.lernen.startEp);
  assert.equal(gesamt, start + erkundung + gebunden + freiAusBeute);
  assert.ok(erkundung > 0 && gebunden > 0);
  // gebundene EP stecken in Skills, freie wurden nach der Lernreihenfolge verteilt oder liegen noch
  assert.ok(LERNREIHENFOLGE.some((skill) => lauf.skills[skill] > 0));
  assert.ok(ninkasi.freieEp >= 0);
  assert.equal(lauf.grundskillsAufFuenf, grundskillsAufFuenf(daten, gesamt));
});

test("Räumen: Grundskills auf Stufe 5 aus den EP einer durchschnittlichen Ninkasi", () => {
  // Eigenschaften im Mittel 13 1/3, Lernpunkte = EP x 40 / 40; ein Grundskill auf 5 kostet 1250 Lernpunkte
  assert.equal(grundskillsAufFuenf(daten, 1250), 1);
  assert.equal(grundskillsAufFuenf(daten, 2500), 2);
  assert.equal(grundskillsAufFuenf(daten, 0), 0);
});
