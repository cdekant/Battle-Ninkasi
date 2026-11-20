// Aktionskatalog und Belegung (eingabe/aktionskatalog.js, eingabe/belegung.js), Übersetzen der Tasten
// (eingabe/eingabe.js), Hilfe aus dem Katalog (eingabe/hilfe.js, anzeige/fenster.js tastenname)
import { test } from "node:test";
import assert from "node:assert/strict";
import texteDe from "../sprache/de/texte.js";
import belegung from "../src/eingabe/belegung.js";
import { AKTIONEN, GRUPPEN, aktionDerTaste, befehlDerAktion, tastenDerAktion } from "../src/eingabe/aktionskatalog.js";
import { uebersetzen } from "../src/eingabe/eingabe.js";
import { hilfeGruppen, hilfeTaste } from "../src/eingabe/hilfe.js";
import { tastenname } from "../src/anzeige/fenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";

const texte = erstelleTexte(texteDe, { nomen: () => "" });

test("Belegung: jede Taste zeigt auf eine Aktion des Katalogs, jede Aktion hat eine angezeigte Taste", () => {
  for (const teil of ["tasten", "weitereTasten", "zeichen"]) {
    for (const [taste, aktion] of Object.entries(belegung[teil])) assert.ok(AKTIONEN[aktion], `${teil}.${taste}: unbekannte Aktion ${aktion}`);
  }
  for (const aktion of Object.keys(AKTIONEN)) assert.ok(tastenDerAktion(belegung, aktion).length, `${aktion} hat keine Taste`);
  const doppelt = Object.keys(belegung.tasten).filter((taste) => taste in belegung.weitereTasten);
  assert.deepEqual(doppelt, [], "eine Taste steht nur einmal");
});

test("Katalog: Texte, Gruppen und Befehlsvorlagen", () => {
  for (const [aktion, eintrag] of Object.entries(AKTIONEN)) {
    assert.ok(eintrag.text in texteDe, `Text ${eintrag.text} fehlt`);
    assert.ok(GRUPPEN.includes(eintrag.gruppe), `${aktion}: unbekannte Gruppe`);
  }
  for (const gruppe of GRUPPEN) assert.ok(`hilfe.gruppe.${gruppe}` in texteDe);
  const befehl = befehlDerAktion("bewegen_nw");
  assert.deepEqual(befehl, { art: "bewegen", dx: -1, dy: -1 });
  befehl.dx = 5;
  assert.equal(AKTIONEN.bewegen_nw.befehl.dx, -1, "eine Kopie, der Katalog bleibt");
  assert.equal(befehlDerAktion("inventar"), null);
  assert.equal(befehlDerAktion(null), null);
});

test("Taste zu Aktion: Zeichen vor Tasten, weitere Tasten wirken mit", () => {
  assert.equal(aktionDerTaste(belegung, "Minus", "?"), "hilfe", "Umschalt+ß auf deutscher Tastatur");
  assert.equal(aktionDerTaste(belegung, "Slash", "?"), "hilfe", "Umschalt+/ auf US-Tastatur");
  assert.equal(aktionDerTaste(belegung, "Minus", "ß"), "zoom_raus", "die Lage von - auf US-Tastatur");
  assert.equal(aktionDerTaste(belegung, "KeyY", "z"), "faehigkeiten");
  assert.equal(aktionDerTaste(belegung, "KeyC"), "charakter");
  assert.equal(aktionDerTaste(belegung, "KeyQ", "q"), null);
});

test("Übersetzen: Aktion mit Befehl, ohne Befehl, mit Strg nichts", () => {
  assert.deepEqual(uebersetzen({ code: "Numpad8", key: "8" }, belegung, null), { aktion: "bewegen_n", befehl: { art: "bewegen", dx: 0, dy: -1 } });
  assert.deepEqual(uebersetzen({ code: "KeyI", key: "i" }, belegung, null), { aktion: "inventar" });
  assert.equal(uebersetzen({ code: "KeyI", key: "i", ctrlKey: true }, belegung, null), null);
  assert.equal(uebersetzen({ code: "KeyQ", key: "q" }, belegung, null), null);
});

test("Hilfe: Gruppen aus dem Katalog, Tastennamen, schließen mit Esc oder ?", () => {
  const gruppen = hilfeGruppen(belegung);
  assert.deepEqual(gruppen.map(({ gruppe }) => gruppe), GRUPPEN);
  const anzahl = gruppen.reduce((summe, { eintraege }) => summe + eintraege.length, 0);
  assert.equal(anzahl, Object.keys(AKTIONEN).length, "jede Aktion steht in der Hilfe");
  const zoom = gruppen.find(({ gruppe }) => gruppe === "anzeige").eintraege.find(({ aktion }) => aktion === "zoom_raus");
  assert.deepEqual(zoom.tasten.map((taste) => tastenname(texte, taste)), ["Num -", "-"], "die US-Lage steht nicht in der Hilfe");
  assert.equal(tastenname(texte, { code: "KeyY" }), "Z");
  assert.equal(tastenname(texte, { code: "KeyG" }), "G");
  assert.equal(tastenname(texte, { code: "Numpad7" }), "Num 7");
  assert.equal(tastenname(texte, { code: "Digit3" }), "3");
  assert.equal(tastenname(texte, { zeichen: "?" }), "?");
  assert.equal(hilfeTaste({}, { code: "Escape" }).zustand, null);
  assert.equal(hilfeTaste({}, { code: "Minus", zeichen: "?" }).zustand, null);
  assert.deepEqual(hilfeTaste({}, { code: "KeyA", zeichen: "a" }).zustand, {});
});
