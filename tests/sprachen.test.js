// Sprachdateien (siehe docs/Texte.md, Sprachdateien): Hauptwörter und Adjektive nach der Grammatik ihrer Sprache,
// gleiche Platzhalter in beiden Sprachen, dieselben Schlüssel im Grundgerüst, keine doppelten Schlüssel, Wahl der Sprache.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import regelnDe from "../sprache/de/grammatik.js";
import regelnEn from "../sprache/en/grammatik.js";
import { texte, texteDesGrundgeruests } from "../src/inhalt.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { platzhalterVon } from "../src/anzeige/texte.js";
import { SPRACHEN, spracheWaehlen, EINSTELLUNGEN } from "../src/eingabe/einstellungskatalog.js";

const grammatiken = { de: erstelleGrammatik(regelnDe), en: erstelleGrammatik(regelnEn) };
const istHauptwort = (eintrag) => typeof eintrag === "object" && eintrag !== null && "einzahl" in eintrag;
const istAdjektiv = (eintrag) => typeof eintrag === "object" && eintrag !== null && "adjektiv" in eintrag;

test("jede Sprache der Einstellung hat Texte und Grammatik", () => {
  assert.deepEqual(Object.keys(texte).sort(), [...SPRACHEN].sort());
  assert.deepEqual(Object.keys(grammatiken).sort(), [...SPRACHEN].sort());
  for (const sprache of SPRACHEN) assert.equal(texte[sprache]["sprache.code"], sprache);
  assert.deepEqual(EINSTELLUNGEN.sprache.werte, ["browser", ...SPRACHEN]);
});

test("Hauptwörter und Adjektive sind nach der Grammatik ihrer Sprache vollständig", () => {
  for (const sprache of SPRACHEN) {
    const fehler = [];
    for (const [schluessel, eintrag] of Object.entries(texte[sprache])) {
      if (typeof eintrag === "string") continue;
      if (istHauptwort(eintrag)) {
        fehler.push(...grammatiken[sprache].pruefen(eintrag, `${sprache}: ${schluessel}`));
        for (const adjektiv of eintrag.adjektive ?? []) {
          if (!istAdjektiv(texte[sprache][adjektiv])) fehler.push(`${sprache}: ${schluessel}: Adjektiv ${adjektiv} fehlt`);
        }
      } else if (istAdjektiv(eintrag)) {
        fehler.push(...grammatiken[sprache].adjektivPruefen(eintrag, `${sprache}: ${schluessel}`));
      } else {
        fehler.push(`${sprache}: ${schluessel}: weder Text noch Hauptwort noch Adjektiv`);
      }
    }
    assert.deepEqual(fehler, []);
  }
});

test("ein Schlüssel hat in beiden Sprachen dieselbe Art und dieselben Platzhalter", () => {
  const fehler = [];
  for (const [schluessel, englisch] of Object.entries(texte.en)) {
    const deutsch = texte.de[schluessel];
    if (deutsch === undefined) { fehler.push(`${schluessel}: nur englisch`); continue; }
    const art = (eintrag) => (typeof eintrag === "string" ? "text" : istHauptwort(eintrag) ? "hauptwort" : "adjektiv");
    if (art(deutsch) !== art(englisch)) fehler.push(`${schluessel}: ${art(deutsch)} gegen ${art(englisch)}`);
    else if (art(deutsch) === "text" && platzhalterVon(deutsch).join() !== platzhalterVon(englisch).join()) {
      fehler.push(`${schluessel}: Platzhalter ${platzhalterVon(deutsch)} gegen ${platzhalterVon(englisch)}`);
    }
  }
  assert.deepEqual(fehler, []);
});

test("das Grundgerüst hat in beiden Sprachen dieselben Schlüssel", () => {
  const nurDeutsch = Object.keys(texteDesGrundgeruests.de).filter((schluessel) => !(schluessel in texteDesGrundgeruests.en));
  assert.deepEqual(nurDeutsch, []);
});

// Doppelte Schlüssel fallen beim Laden nicht auf, im Objekt gewinnt still der letzte; darum liest dieser Test die
// Sprachdateien als Text: Schlüssel der obersten Ebene stehen mit zwei Leerzeichen Einzug am Zeilenanfang
test("kein Schlüssel steht in einer Sprachdatei doppelt", () => {
  const sprachordner = fileURLToPath(new URL("../sprache/", import.meta.url));
  const doppelt = [];
  for (const sprache of readdirSync(sprachordner, { withFileTypes: true }).filter((eintrag) => eintrag.isDirectory())) {
    const ordner = join(sprachordner, sprache.name);
    for (const datei of readdirSync(ordner).filter((name) => name.endsWith(".js"))) {
      const schluessel = [...readFileSync(join(ordner, datei), "utf8").matchAll(/^  "([^"]+)":/gm)].map((treffer) => treffer[1]);
      const gesehen = new Set();
      for (const name of schluessel) {
        if (gesehen.has(name)) doppelt.push(`${sprache.name}/${datei}: ${name}`);
        gesehen.add(name);
      }
    }
  }
  assert.deepEqual(doppelt, []);
});

test("Sprache der Einstellung: gewählt, sonst die erste des Browsers, die es gibt, sonst Englisch", () => {
  assert.equal(spracheWaehlen("de", ["en-US"]), "de");
  assert.equal(spracheWaehlen("en", ["de-DE"]), "en");
  assert.equal(spracheWaehlen("browser", ["de-AT", "en"]), "de");
  assert.equal(spracheWaehlen("browser", ["fr-FR", "EN-gb", "de"]), "en");
  assert.equal(spracheWaehlen("browser", ["fr", "de"]), "de");
  assert.equal(spracheWaehlen("browser", ["fr"]), "en");
  assert.equal(spracheWaehlen(undefined, []), "en");
  assert.equal(spracheWaehlen("klingonisch", [undefined]), "en");
});
