// Glossar der Fachbegriffe des Brauens (daten/glossar.js, src/anzeige/glossar.js, siehe docs/Texte.md, Glossar):
// Texte in beiden Sprachen, Prüfung der Daten, Wörterbuch in beide Richtungen.

import { test } from "node:test";
import assert from "node:assert/strict";
import { rohdaten, texte } from "../src/inhalt.js";
import regelnDe from "../sprache/de/grammatik.js";
import regelnEn from "../sprache/en/grammatik.js";
import { vorbereiten } from "../src/kern/daten.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { glossarEintraege, woerterbuch } from "../src/anzeige/glossar.js";
import { lueckenFinden } from "../werkzeuge/luecken.js";

const deutsch = erstelleTexte(texte.de, erstelleGrammatik(regelnDe));
const englisch = erstelleTexte(texte.en, erstelleGrammatik(regelnEn));

test("Glossar: jeder Begriff hat Begriff, Erklärung und Gebiet in beiden Sprachen, eigens geschrieben", () => {
  const eintraege = Object.entries(rohdaten.glossar);
  assert.ok(eintraege.length >= 40, `nur ${eintraege.length} Begriffe`);
  for (const [name, eintrag] of eintraege) {
    for (const sprache of ["de", "en"]) {
      for (const schluessel of [eintrag.text, `${eintrag.text}.erklaerung`, `glossargebiet.${eintrag.gebiet}`]) {
        assert.equal(typeof texte[sprache][schluessel], "string", `${sprache}: ${schluessel} (${name})`);
      }
    }
    assert.notEqual(texte.de[`${eintrag.text}.erklaerung`], texte.en[`${eintrag.text}.erklaerung`], `${name}: Erklärung übersetzt`);
  }
});

test("Glossar: die Datenprüfung meldet fehlende Texte, Gebiete und fremde Felder", () => {
  const roh = { ...rohdaten, glossar: { probe: { gebiet: "nirgends", text: "glossar.probe", farbe: "rot" } } };
  const { fehler } = vorbereiten(roh, { texte: { ...texte.de, "glossar.probe": "Probe" } });
  assert.ok(fehler.some((meldung) => meldung.includes("glossar.probe.erklaerung")), fehler.join("; "));
  assert.ok(fehler.some((meldung) => meldung.includes("glossargebiet.nirgends")));
  assert.ok(fehler.some((meldung) => meldung.includes("unbekannte Felder farbe")));
  assert.deepEqual(vorbereiten(rohdaten, { texte: texte.de }).fehler, []);
});

test("Glossar: Einträge je Sprache sortiert, Wörterbuch de-en und en-de", () => {
  const glossar = { malz: { gebiet: "maelzen", text: "glossar.malz" }, hefe: { gebiet: "rohstoffe", text: "glossar.hefe" } };
  assert.deepEqual(glossarEintraege(glossar, deutsch).map((eintrag) => eintrag.begriff), ["Hefe", "Malz"]);
  assert.deepEqual(glossarEintraege(glossar, englisch).map((eintrag) => eintrag.begriff), ["malt", "yeast"]);
  const deEn = woerterbuch(glossar, { de: deutsch, en: englisch });
  assert.deepEqual(deEn.map((zeile) => [zeile.de.begriff, zeile.en.begriff]), [["Hefe", "yeast"], ["Malz", "malt"]]);
  assert.equal(deEn[1].en.gebiet, "Malting");
  const enDe = woerterbuch(glossar, { en: englisch, de: deutsch });
  assert.deepEqual(enDe.map((zeile) => zeile.name), ["malz", "hefe"]);
});

test("Glossar: Erklärungen gelten im Kompendium als genannt, ein Begriff ohne Eintrag nicht", () => {
  const luecken = lueckenFinden({ rohdaten, sprache: { texte: { ...texte.de, "glossar.vergessen": "Vergessen" } } })
    .filter((luecke) => luecke.gruppe === "texte");
  assert.deepEqual(luecken.map((luecke) => luecke.ort), ["glossar.vergessen"]);
});
