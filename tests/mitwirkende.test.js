// Mitwirkende: Abschnitte aus Impressum, Rollen, Vorbildern, Titelbildern, Tiles, Korpustexten, Literatur und
// Bibliotheken; Tiles nach gleicher Quellenangabe gruppiert; Abschnitte ohne Daten fallen weg; Fenster aus dem Titel
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { rohdaten, texte as texteJeSprache } from "../src/inhalt.js";
import grammatikDe from "../sprache/de/grammatik.js";
import korpuslisteDe from "../sprache/de/korpus/index.js";
import tileset from "../grafik/tileset.js";
import { datenLaden } from "../src/kern/spiel.js";
import { korpustextZerlegen } from "../src/anzeige/korpus.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { quellenangabeFehler } from "../src/anzeige/quellenangabe.js";
import { mitwirkendeSammeln, IMPRESSUM, ROLLEN, BIBLIOTHEKEN } from "../src/anzeige/mitwirkende.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/titel.js";
import { fensterOeffnen, fensterTaste } from "../src/eingabe/fenster.js";
import { titelOeffnen, titelEintraege } from "../src/eingabe/titel.js";
import "../src/eingabe/mitwirkende.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteJeSprache.de, grammatik);
const daten = datenLaden(rohdaten, { texte: texteJeSprache.de, nomenPruefen: grammatik.pruefen });
const literatur = JSON.parse(readFileSync("sprache/literatur.json", "utf8"));
const korpustexte = korpuslisteDe.map((name) => korpustextZerlegen(name, readFileSync(`sprache/de/korpus/${name}`, "utf8")));

test("Mitwirkende: alle Abschnitte in fester Folge, Rollen und Bibliotheken gültig", () => {
  const abschnitte = mitwirkendeSammeln(texte, { daten, tileset, korpustexte, literatur });
  assert.deepEqual(abschnitte.map(({ abschnitt }) => abschnitt), ["impressum", "spiel", "vorbilder", "titelbilder", "tiles", "texte", "literatur", "bibliotheken"]);
  for (const { abschnitt } of abschnitte) assert.ok(texteJeSprache.en[`mitwirkende.abschnitt.${abschnitt}`], `en: ${abschnitt}`);
  const zeilen = (name) => abschnitte.find(({ abschnitt }) => abschnitt === name).zeilen;
  assert.deepEqual(zeilen("impressum"), [{ was: IMPRESSUM.name, link: IMPRESSUM.repo }, { was: `chd: ${IMPRESSUM.name}` }]);
  assert.deepEqual(zeilen("spiel").map(({ text }) => text), ["chd", "chd · mit KI: Claude (Ausarbeitung)", "mit KI erstellt: Claude"]);
  for (const { rolle, quellenangabe } of ROLLEN) {
    for (const code of ["de", "en"]) {
      assert.ok(texteJeSprache[code][`mitwirkende.rolle.${rolle}`], `${code}: ${rolle}`);
      assert.deepEqual(quellenangabeFehler(quellenangabe, { texte: texteJeSprache[code] }), [], `${code}: ${rolle}`);
    }
  }
  assert.equal(zeilen("texte").length, korpuslisteDe.length, "jeder Korpustext");
  assert.equal(zeilen("literatur").length, literatur.length, "das ganze Verzeichnis");
  assert.ok(existsSync("lib/rot/LICENSE.txt") && BIBLIOTHEKEN.some(({ name }) => name === "rot.js"));
});

test("Mitwirkende: Tiles nach Quellenangabe gruppiert, mit Namen aus den Texten; abweichende Sätze einzeln", () => {
  const gleich = mitwirkendeSammeln(texte, { daten, tileset }).find(({ abschnitt }) => abschnitt === "tiles").zeilen;
  assert.equal(gleich.length, 1, "alle Tiles von Claude");
  assert.equal(gleich[0].text, "mit KI erstellt: Claude");
  assert.match(gleich[0].was, /Bier/);
  assert.match(gleich[0].was, /Wand/);
  const tile = { groesse: 2, pixel: ["..", ".."] };
  const gemischt = {
    palette: tileset.palette,
    quellenangabe: { vorgabe: { art: "generiert", beteiligt: [{ wer: "Claude" }] } },
    saetze: { 4: { bier: tile, unbekannt: tile }, 2: { bier: { ...tile, quellenangabe: { art: "chd" } }, unbekannt: tile } },
  };
  const zeilen = mitwirkendeSammeln(texte, { daten, tileset: gemischt }).find(({ abschnitt }) => abschnitt === "tiles").zeilen;
  assert.deepEqual(zeilen, [{ was: "Bier (4 px), unbekannt", text: "mit KI erstellt: Claude" }, { was: "Bier (2 px)", text: "chd" }]);
});

test("Mitwirkende: ohne Tiles, Korpus und Literatur fallen nur diese Abschnitte weg", () => {
  const abschnitte = mitwirkendeSammeln(texte, {});
  assert.deepEqual(abschnitte.map(({ abschnitt }) => abschnitt), ["impressum", "spiel", "vorbilder", "titelbilder", "bibliotheken"]);
});

test("Mitwirkende: Fenster aus dem Titel, mit Esc zu; Anzeige mit Link zum Repo", () => {
  assert.ok(titelEintraege([null, null, null]).includes("mitwirkende"));
  const stelle = titelEintraege([null, null, null]).indexOf("mitwirkende");
  const taste = { code: `Key${String.fromCharCode(65 + stelle)}`, zeichen: String.fromCharCode(97 + stelle) };
  const { stapel } = fensterTaste(fensterOeffnen([], "titel", titelOeffnen()), taste, { plaetze: [null, null, null] });
  assert.deepEqual(stapel.map(({ art }) => art), ["titel", "mitwirkende"]);
  const html = fensterHtml({ texte, daten, tileset, korpustexte, literatur }, stapel);
  assert.match(html, /Mitwirkende/);
  assert.match(html, new RegExp(`href="${IMPRESSUM.repo}"`));
  assert.deepEqual(fensterTaste(stapel, { code: "Escape" }, {}).stapel.map(({ art }) => art), ["titel"]);
});
