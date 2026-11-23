// Aktionskatalog und Belegung (eingabe/aktionskatalog.js, eingabe/belegung.js), Übersetzen der Tasten
// (eingabe/eingabe.js), Hilfe aus dem Katalog (eingabe/hilfe.js, anzeige/fenster.js tastenname)
import { test } from "node:test";
import assert from "node:assert/strict";
import { texteDe } from "../src/inhalt.js";
import belegung from "../src/eingabe/belegung.js";
import { AKTIONEN, GRUPPEN, KNOEPFE, PLAETZE_DER_LEISTE, aktionDerTaste, befehlDerAktion, tastenDerAktion } from "../src/eingabe/aktionskatalog.js";
import { uebersetzen } from "../src/eingabe/eingabe.js";
import { hilfeGruppen, hilfeTaste } from "../src/eingabe/hilfe.js";
import { tastenname } from "../src/anzeige/fenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";

const texte = erstelleTexte(texteDe, { nomen: () => "" });

test("Belegung: jede Taste zeigt auf eine Aktion des Katalogs, jede Aktion hat eine angezeigte Taste", () => {
  for (const teil of ["tasten", "weitereTasten", "zeichen"]) {
    for (const [taste, aktion] of Object.entries(belegung[teil])) assert.ok(AKTIONEN[aktion], `${teil}.${taste}: unbekannte Aktion ${aktion}`);
  }
  for (const aktion of Object.keys(AKTIONEN)) {
    if (AKTIONEN[aktion].ohneTaste) assert.equal(tastenDerAktion(belegung, aktion).length, 0, `${aktion} ist ohne Taste gedacht`);
    else assert.ok(tastenDerAktion(belegung, aktion).length, `${aktion} hat keine Taste`);
  }
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
  assert.equal(aktionDerTaste(belegung, "KeyY", "z"), "bewegen_nw", "vi nach Lage: Aufschrift Z der deutschen Tastatur");
  assert.equal(aktionDerTaste(belegung, "KeyF", "f"), "faehigkeiten");
  assert.equal(aktionDerTaste(belegung, "Period", "."), "warten");
  assert.equal(aktionDerTaste(belegung, "IntlBackslash", ">"), "treppe");
  assert.equal(aktionDerTaste(belegung, "ArrowLeft"), "bewegen_w");
  assert.equal(aktionDerTaste(belegung, "Digit0", "0"), "schnellplatz_10");
  assert.equal(aktionDerTaste(belegung, "KeyC"), "charakter");
  assert.equal(aktionDerTaste(belegung, "KeyQ", "q"), null);
});

test("Übersetzen: Aktion mit Befehl, ohne Befehl, mit Strg nichts", () => {
  assert.deepEqual(uebersetzen({ code: "Numpad8", key: "8" }, belegung, null), { aktion: "bewegen_n", befehl: { art: "bewegen", dx: 0, dy: -1 } });
  assert.deepEqual(uebersetzen({ code: "KeyI", key: "i" }, belegung, null), { aktion: "inventar" });
  assert.equal(uebersetzen({ code: "KeyI", key: "i", ctrlKey: true }, belegung, null), null);
  assert.equal(uebersetzen({ code: "KeyQ", key: "q" }, belegung, null), null);
  assert.deepEqual(uebersetzen({ code: "KeyL", key: "L", shiftKey: true }, belegung, null), { aktion: "laufen", richtung: { dx: 1, dy: 0 } }, "Umschalt plus Richtung läuft");
  assert.deepEqual(uebersetzen({ code: "KeyI", key: "I", shiftKey: true }, belegung, null), { aktion: "inventar" }, "Umschalt ändert nur Bewegungen");
});

test("Knöpfe der Bedienzeile: acht Aktionen des Katalogs mit Text, Plätze der Leiste 0 bis 9", () => {
  assert.equal(KNOEPFE.length, 8);
  for (const aktion of KNOEPFE) assert.ok(AKTIONEN[aktion]?.knopf in texteDe, `Knopf ${aktion}`);
  const plaetze = Object.values(AKTIONEN).filter((eintrag) => eintrag.platz !== undefined).map((eintrag) => eintrag.platz);
  assert.deepEqual(plaetze, Array.from({ length: PLAETZE_DER_LEISTE }, (_, platz) => platz));
});

test("Hilfe: Gruppen aus dem Katalog, Tastennamen, schließen mit Esc oder ?", () => {
  const gruppen = hilfeGruppen(belegung);
  assert.deepEqual(gruppen.map(({ gruppe }) => gruppe), GRUPPEN);
  const anzahl = gruppen.reduce((summe, { eintraege }) => summe + eintraege.length, 0);
  const leistenwechsel = Object.values(AKTIONEN).filter((eintrag) => eintrag.leiste !== undefined).length;
  const ohneTaste = Object.values(AKTIONEN).filter((eintrag) => eintrag.ohneTaste).length;
  assert.equal(anzahl, Object.keys(AKTIONEN).length - PLAETZE_DER_LEISTE + 1 - leistenwechsel + 1 - ohneTaste, "jede Aktion mit Taste steht in der Hilfe, Plätze und Leistenwechsel je in einer Zeile");
  const wechsel = gruppen.find(({ gruppe }) => gruppe === "schnellleiste").eintraege[1];
  assert.equal(wechsel.tasten.map((taste) => tastenname(texte, taste)).join(", "), "Umschalt+1, Umschalt+2, Umschalt+3, Umschalt+4, Umschalt+5");
  assert.equal(aktionDerTaste(belegung, "Digit2", "\"", true), "leiste_2", "Umschalt+Ziffer vor dem Zeichen");
  assert.equal(aktionDerTaste(belegung, "Digit2", "2", false), "schnellplatz_2");
  const leiste = gruppen.find(({ gruppe }) => gruppe === "schnellleiste").eintraege[0];
  assert.deepEqual(leiste.tasten.map((taste) => tastenname(texte, taste)).join(""), "1234567890");
  const laufen = gruppen.find(({ gruppe }) => gruppe === "bewegen").eintraege.find(({ aktion }) => aktion === "laufen");
  assert.equal(tastenname(texte, laufen.tasten[0]), "Umschalt + Richtung");
  const zoom = gruppen.find(({ gruppe }) => gruppe === "anzeige").eintraege.find(({ aktion }) => aktion === "zoom_raus");
  assert.deepEqual(zoom.tasten.map((taste) => tastenname(texte, taste)), ["Num -", "-"], "die US-Lage steht nicht in der Hilfe");
  assert.equal(tastenname(texte, { code: "KeyY" }), "z");
  assert.equal(tastenname(texte, { code: "KeyG" }), "g", "klein, wie ohne Umschalt getippt");
  assert.equal(tastenname(texte, { code: "Numpad7" }), "Num 7");
  assert.equal(tastenname(texte, { code: "Digit3" }), "3");
  assert.equal(tastenname(texte, { zeichen: "?" }), "?");
  assert.equal(hilfeTaste({}, { code: "Escape" }).zustand, null);
  assert.equal(hilfeTaste({}, { code: "Minus", zeichen: "?" }).zustand, null);
  assert.deepEqual(hilfeTaste({}, { code: "KeyA", zeichen: "a" }).zustand, {});
});
