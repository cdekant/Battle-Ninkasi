import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, meldungenMitschneiden } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { beziehung, beziehungZwischen, urheberVon } from "../src/systeme/fraktionen.js";
import { feindlich } from "../src/systeme/kampf.js";
import { entitaetenAufFeldern } from "../src/systeme/zielauswahl.js";

const RAUM = [
  "##########",
  "#........#",
  "#....#...#",
  "##########",
];

const FRAKTIONEN = {
  ninkasi: { text: "f", beziehungen: { haendler: "neutral", hefen: "verbuendet" } },
  haendler: { text: "f" },
  hefen: { text: "f", beziehungen: { ninkasi: "feind" } },
  verderber: { text: "f" },
};

const EFFEKTE = { stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] } };

function aufstellen() {
  const spiel = miniSpiel(RAUM, { fraktionen: FRAKTIONEN, effekte: EFFEKTE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.angriffe = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];
  ninkasi.sicht = { reichweite: 8 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

test("Beziehungen: gleiche Fraktion verbündet, Vorgabe feind, in beide Richtungen, die strengere gewinnt", () => {
  const { spiel } = aufstellen();
  assert.equal(beziehung(spiel, "ninkasi", "ninkasi"), "verbuendet");
  assert.equal(beziehung(spiel, "ninkasi", "verderber"), "feind", "Vorgabe aus den Regeln");
  assert.equal(beziehung(spiel, "ninkasi", "haendler"), "neutral");
  assert.equal(beziehung(spiel, "haendler", "ninkasi"), "neutral", "gilt auch rückwärts");
  assert.equal(beziehung(spiel, "ninkasi", "hefen"), "feind", "verbuendet gegen feind: feind gewinnt");
  assert.equal(beziehung(spiel, "eigene:3", "haendler"), "feind");
  assert.equal(beziehung(spiel, null, "haendler"), "neutral");
  const freundlich = miniSpiel(RAUM, { fraktionen: FRAKTIONEN, regeln: { fraktionen: { beziehungVorgabe: "neutral" } } });
  assert.equal(beziehung(freundlich, "ninkasi", "verderber"), "neutral");
});

test("Neutrale: kein Angriff durch Hineinlaufen, keine Ziele für feinde oder verbuendete", () => {
  const { spiel, ninkasi } = aufstellen();
  const haendlerin = wesen(spiel, 2, 1, "haendler", 10);
  assert.equal(feindlich(spiel, ninkasi, haendlerin), false);
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).grund, "besetzt");
  const felder = [{ x: 2, y: 1 }];
  assert.deepEqual(entitaetenAufFeldern(spiel, felder, { trifft: "feinde", urheberId: ninkasi.id }), []);
  assert.deepEqual(entitaetenAufFeldern(spiel, felder, { trifft: "verbuendete", urheberId: ninkasi.id }), []);
  assert.equal(entitaetenAufFeldern(spiel, felder, { trifft: "wesen", urheberId: ninkasi.id }).length, 1);
});

test("Zorn: das angegriffene Wesen und Genossen, die es sehen, werden feindlich; wer nichts sieht, bleibt neutral", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const haendlerin = wesen(spiel, 2, 1, "haendler", 10);
  const zeugin = wesen(spiel, 4, 1, "haendler", 10, { sicht: { reichweite: 8 } });
  const hinterDerWand = wesen(spiel, 6, 2, "haendler", 10, { sicht: { reichweite: 8 } });
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0, angreifen: true }).ok, true);
  assert.equal(haendlerin.werte.lp.aktuell, 9);
  assert.deepEqual(haendlerin.zornAuf, [ninkasi.id]);
  assert.deepEqual(zeugin.zornAuf, [ninkasi.id]);
  assert.equal(hinterDerWand.zornAuf, undefined);
  assert.equal(feindlich(spiel, ninkasi, haendlerin), true, "Zorn gilt in beide Richtungen");
  assert.equal(beziehungZwischen(spiel, urheberVon(hinterDerWand), ninkasi), "neutral");
  assert.ok(meldungen.some((meldung) => meldung.art === "zorn"));
});
