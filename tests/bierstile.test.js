// Bierstile (daten/bierstile.js, siehe docs/Texte.md, Bierstile): Kennzahlen, Glossar mit Quellen, Prüfung der Daten.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rohdaten, texte } from "../src/inhalt.js";
import { vorbereiten, KENNZAHLEN_DER_BIERSTILE } from "../src/kern/daten.js";
import { lueckenFinden } from "../werkzeuge/luecken.js";

const literatur = JSON.parse(readFileSync(new URL("../sprache/literatur.json", import.meta.url), "utf8"));
const RICHTLINIEN = ["bjcp2021styleguidelines", "ba2025styleguidelines", "ebs2025kategorien"];

test("Bierstile: 80 Stile, jeder mit Glossareintrag, Familie in beiden Sprachen und Quellen aus den Richtlinien", () => {
  const stile = Object.entries(rohdaten.bierstile);
  assert.equal(stile.length, 80);
  for (const [name, stil] of stile) {
    const eintrag = rohdaten.glossar[name];
    assert.equal(eintrag?.gebiet, "bierstile", name);
    assert.ok(eintrag.quellen.every((quelle) => RICHTLINIEN.includes(quelle)), `${name}: ${eintrag.quellen}`);
    for (const sprache of ["de", "en"]) assert.equal(typeof texte[sprache][`bierfamilie.${stil.familie}`], "string", `${sprache}: ${stil.familie}`);
  }
});

test("Bierstile: Kennzahlen in plausiblen Grenzen, Alkohol passt zur Stammwürze", () => {
  // Grenzen in den Einheiten der Daten: Zehntel °Plato, IBU, EBC, Zehntel Vol.-%
  const grenzen = { stammwuerze: [50, 300], bittere: [0, 120], farbe: [2, 120], alkohol: [10, 150] };
  for (const [name, stil] of Object.entries(rohdaten.bierstile)) {
    for (const kennzahl of KENNZAHLEN_DER_BIERSTILE) {
      const [unten, oben] = stil[kennzahl];
      assert.ok(unten >= grenzen[kennzahl][0] && oben <= grenzen[kennzahl][1], `${name}.${kennzahl}: ${unten}-${oben}`);
    }
    // grob ein Viertel bis zwei Drittel der Stammwürze wird zu Alkohol
    for (const seite of [0, 1]) {
      const anteil = stil.alkohol[seite] / stil.stammwuerze[seite];
      assert.ok(anteil >= 0.25 && anteil <= 0.65, `${name}: Alkohol ${stil.alkohol[seite]} zu Stammwürze ${stil.stammwuerze[seite]}`);
    }
  }
});

test("Bierstile: die Datenprüfung meldet Spannen, Gärung, Familie, fremde Felder und fehlende Glossareinträge", () => {
  const roh = {
    ...rohdaten,
    bierstile: {
      ...rohdaten.bierstile,
      probe: { familie: "nirgends", gaerung: "warm", stammwuerze: [120, 110], bittere: [10.5, 20], farbe: [5], alkohol: [-1, 50], hefe: "x" },
    },
  };
  const { fehler } = vorbereiten(roh, { texte: texte.de });
  for (const teil of ["bierfamilie.nirgends", "gaerung muss", "stammwuerze muss", "bittere muss", "farbe muss", "alkohol muss", "unbekannte Felder hefe", "braucht einen Eintrag probe"]) {
    assert.ok(fehler.some((meldung) => meldung.startsWith("bierstile.probe") && meldung.includes(teil)), `${teil}: ${fehler.join("; ")}`);
  }
  assert.deepEqual(vorbereiten(rohdaten, { texte: texte.de }).fehler, []);
});

test("Glossar: Quellen stehen im Literaturverzeichnis, das Kompendium meldet fremde, die Datenprüfung falsche Formen", () => {
  const schluessel = new Set(literatur.map((eintrag) => eintrag.id));
  for (const [name, eintrag] of Object.entries(rohdaten.glossar)) {
    for (const quelle of eintrag.quellen ?? []) assert.ok(schluessel.has(quelle), `${name}: ${quelle}`);
  }
  const glossar = { ...rohdaten.glossar, malz: { ...rohdaten.glossar.malz, quellen: ["unbekannt"] } };
  const luecken = lueckenFinden({ rohdaten: { ...rohdaten, glossar }, sprache: { texte: texte.de }, literatur });
  assert.deepEqual(luecken.filter((luecke) => luecke.ort.startsWith("glossar.")).map((luecke) => luecke.meldung), ['Quelle "unbekannt" fehlt in sprache/literatur.json']);
  for (const quellen of [[], "bjcp2021styleguidelines", ["a", "a"], [3]]) {
    const { fehler } = vorbereiten({ ...rohdaten, glossar: { ...rohdaten.glossar, malz: { ...rohdaten.glossar.malz, quellen } } }, { texte: texte.de });
    assert.ok(fehler.some((meldung) => meldung.startsWith("glossar.malz: quellen")), JSON.stringify(quellen));
  }
});
