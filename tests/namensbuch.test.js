// Stabile Namen (siehe docs/Architektur.md, Inhalte als Daten): Namensbuch und Umbenennungen passen zu den Daten
// (werkzeuge/namensbuch.js), Umbenennungen wirken auf Chronik und letzte Verteilung (eingabe/umbenennen.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import rohdaten from "../daten/index.js";
import namensbuch from "../daten/namensbuch.js";
import umbenennungen from "../daten/umbenennungen.js";
import { NAMENSBUCH_ARTEN, namensbuchFehler, namensbuchNachgefuehrt } from "../werkzeuge/namensbuch.js";
import { nameNachUmbenennung, eigenschaftenUmbenennen } from "../src/eingabe/umbenennen.js";
import { chronikGueltig } from "../src/eingabe/chronik.js";

test("Namensbuch: passt zu den Daten und Umbenennungen; Ninkasi und die Eigenschaften sind fest", () => {
  assert.deepEqual(namensbuchFehler(namensbuch, rohdaten, umbenennungen), []);
  assert.deepEqual(Object.keys(namensbuch), NAMENSBUCH_ARTEN);
  assert.ok(namensbuch.wesen.fest.includes("ninkasi"));
  assert.deepEqual(namensbuch.eigenschaften.fest, Object.keys(rohdaten.eigenschaften));
});

test("Namensbuch: neue, verschwundene und umbenannte Namen", () => {
  const daten = { wesen: { ninkasi: {}, vorlage: { abstrakt: true }, essig: {} } };
  const buch = { wesen: { fest: ["ninkasi"], vorlaeufig: ["essig"] } };
  assert.deepEqual(namensbuchFehler(buch, daten, {}), [], "abstrakte Vorlagen zählen nicht");
  const mitNeuem = { wesen: { ...daten.wesen, hefe: {} } };
  assert.match(namensbuchFehler(buch, mitNeuem, {}).join(), /wesen\.hefe: nicht im Namensbuch/);
  assert.deepEqual(namensbuchNachgefuehrt(buch, mitNeuem).wesen, { fest: ["ninkasi"], vorlaeufig: ["essig", "hefe"] });
  const ohneVorlaeufigen = { wesen: { ninkasi: {} } };
  assert.match(namensbuchFehler(buch, ohneVorlaeufigen, {}).join(), /essig: vorläufig, gibt es nicht mehr/);
  assert.deepEqual(namensbuchNachgefuehrt(buch, ohneVorlaeufigen).wesen.vorlaeufig, [], "vorläufige fallen ohne Eintrag weg");
  const ohneFesten = { wesen: { essig: {}, ninkasi_neu: {} } };
  const buchMitNeuem = { wesen: { fest: ["ninkasi"], vorlaeufig: ["essig", "ninkasi_neu"] } };
  assert.match(namensbuchFehler(buchMitNeuem, ohneFesten, {}).join(), /ninkasi: fest, fehlt in den Daten ohne Eintrag/);
  assert.deepEqual(namensbuchFehler(buchMitNeuem, ohneFesten, { wesen: { ninkasi: "ninkasi_neu" } }), [], "mit Eintrag erlaubt");
  assert.deepEqual(namensbuchNachgefuehrt(buchMitNeuem, ohneFesten).wesen.fest, ["ninkasi"], "feste Namen bleiben stehen");
  assert.deepEqual(namensbuchFehler({ wesen: { fest: ["ninkasi"], vorlaeufig: ["essig"] } }, { wesen: { essig: {} } }, { wesen: { ninkasi: null } }), [], "entfernt");
});

test("Namensbuch: Umbenennungen mit fehlendem Ziel, altem Namen in den Daten, Kreis oder fremder Art sind Fehler", () => {
  const daten = { wesen: { essig: {} } };
  const buch = { wesen: { fest: ["essig"], vorlaeufig: [] } };
  assert.match(namensbuchFehler(buch, daten, { wesen: { alt: "weg" } }).join(), /"weg" gibt es nicht/);
  assert.match(namensbuchFehler(buch, daten, { wesen: { essig: "essig2" } }).join(), /alte Name steht noch in den Daten/);
  assert.match(namensbuchFehler(buch, daten, { wesen: { a: "b", b: "a" } }).join(), /im Kreis/);
  assert.match(namensbuchFehler(buch, daten, { unbekannt: {} }).join(), /keine Art des Namensbuchs/);
  assert.deepEqual(namensbuchFehler(buch, daten, { wesen: { a: "b", b: "essig" } }), [], "Ketten bis zu einem vorhandenen Namen");
});

test("Umbenennen: Ketten, entfernte Namen, Eigenschaften und Zähler der Chronik", () => {
  const tabelle = { wesen: { a: "b", b: "c", weg: null }, eigenschaften: { kraft: "koerperlichkeit" } };
  assert.equal(nameNachUmbenennung(tabelle, "wesen", "a"), "c");
  assert.equal(nameNachUmbenennung(tabelle, "wesen", "weg"), "weg", "entfernt bleibt, wie es ist");
  assert.equal(nameNachUmbenennung(tabelle, "fallen", "a"), "a");
  assert.throws(() => nameNachUmbenennung({ wesen: { x: "y", y: "x" } }, "wesen", "x"), /im Kreis/);
  assert.deepEqual(eigenschaftenUmbenennen({ kraft: 14, klugheit: 12 }, tabelle), { koerperlichkeit: 14, klugheit: 12 });
  assert.equal(eigenschaftenUmbenennen(null, tabelle), null);
  const roh = { format: 1, laeufe: [], zaehler: { "besiegt.a": 2, "besiegt.c": 3, "gesehen.b": 1, "besiegt.weg": 4, tode: 5, "a.b": 1 } };
  assert.deepEqual(chronikGueltig(roh, tabelle).zaehler, { "besiegt.c": 5, "gesehen.c": 1, "besiegt.weg": 4, tode: 5, "a.b": 1 }, "zusammengelegt, Entferntes bleibt");
});
