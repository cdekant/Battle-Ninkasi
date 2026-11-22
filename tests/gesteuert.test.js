// Gesteuerte Entität und Ninkasi (siehe docs/Architektur.md, Entitäten und Komponenten): die Lesefunktionen und ein Schutz davor,
// dass Eingabe, Sicht, Kamera und Zielmodus wieder spielerin() fragen

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gesteuerteEntitaet, istGesteuert, spielerin } from "../src/kern/zustand.js";
import { miniSpiel, spielerinSetzen, wesen } from "./hilfen.js";

const hauptverzeichnis = join(dirname(fileURLToPath(import.meta.url)), "..");

// Dateien, die nur nach der gesteuerten Entität fragen dürfen (wer handelt, was sie sieht und hat);
// Ninkasi selbst (Lernen, Wissen, Tod, Bilanz) fragen andere Dateien weiter mit spielerin()
const NUR_GESTEUERT = [
  "src/eingabe/zielmodus.js", "src/eingabe/reise.js", "src/eingabe/erkunden.js", "src/eingabe/laufen.js",
  "src/eingabe/rasten.js", "src/eingabe/maus.js", "src/eingabe/inventar.js", "src/eingabe/faehigkeiten.js",
  "src/eingabe/schnellleiste.js", "src/eingabe/eingabe.js",
  "src/anzeige/fenster.js", "src/anzeige/bedienzeile.js", "src/anzeige/minikarte.js", "src/anzeige/ankuendigungen.js",
  "src/systeme/sicht.js", "src/systeme/gefahr.js", "src/systeme/untersuchen.js", "src/systeme/schichten.js",
  "src/systeme/gelaende.js", "src/systeme/fallen.js", "src/systeme/bewegung.js", "src/systeme/laufendeAktionen.js",
  "src/systeme/zielauswahl.js", "src/systeme/vorschau.js", "src/systeme/wahrnehmbar.js", "src/systeme/wahrnehmung.js",
];

test("gesteuerte Entität ist vorerst Ninkasi", () => {
  const spiel = miniSpiel(["....."]);
  const ninkasi = spielerinSetzen(spiel, 1, 0);
  const anderes = wesen(spiel, 3, 0);
  assert.equal(gesteuerteEntitaet(spiel.zustand), spielerin(spiel.zustand));
  assert.equal(gesteuerteEntitaet(spiel.zustand), ninkasi);
  assert.equal(istGesteuert(spiel.zustand, ninkasi), true);
  assert.equal(istGesteuert(spiel.zustand, { id: ninkasi.id }), true);
  assert.equal(istGesteuert(spiel.zustand, anderes), false);
  assert.equal(istGesteuert(spiel.zustand, null), false);
});

test("ohne Ninkasi gibt es keine gesteuerte Entität", () => {
  const spiel = miniSpiel(["....."]);
  const anderes = wesen(spiel, 3, 0);
  assert.equal(gesteuerteEntitaet(spiel.zustand), null);
  assert.equal(istGesteuert(spiel.zustand, anderes), false);
});

test("Eingabe, Sicht, Kamera und Zielmodus fragen nicht nach spielerin()", () => {
  for (const datei of NUR_GESTEUERT) {
    const quelltext = readFileSync(join(hauptverzeichnis, datei), "utf8");
    assert.doesNotMatch(quelltext, /\bspielerin\(|\bspielerinId\b/, `${datei} fragt spielerin() statt gesteuerteEntitaet()`);
  }
});
