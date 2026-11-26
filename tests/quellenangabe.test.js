// Quellenangabe: Format, Prüfung, Kurzbeleg und Zeile; jeder Korpustext und jedes Titelbild hat eine gültige Angabe
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { texte as texteJeSprache } from "../src/inhalt.js";
import grammatikDe from "../sprache/de/grammatik.js";
import korpuslisteDe from "../sprache/de/korpus/index.js";
import korpuslisteEn from "../sprache/en/korpus/index.js";
import { korpustextZerlegen } from "../src/anzeige/korpus.js";
import { TITELBILDER } from "../src/anzeige/titelbilder.js";
import { QUELLENANGABE_ARTEN, quellenangabeAusKopf, quellenangabeFehler, quellenangabeText, kurzbeleg } from "../src/anzeige/quellenangabe.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const texte = erstelleTexte(texteJeSprache.de, erstelleGrammatik(grammatikDe));
const literatur = JSON.parse(readFileSync("sprache/literatur.json", "utf8"));

test("Quellenangabe: jeder Korpustext und jedes Titelbild ist gültig, jede Art hat in jeder Sprache ihren Text", () => {
  for (const [code, korpusliste] of Object.entries({ de: korpuslisteDe, en: korpuslisteEn })) {
    for (const art of QUELLENANGABE_ARTEN) assert.ok(texteJeSprache[code][`quellenangabe.nach.${art}`], `${code}: ${art}`);
    for (const name of korpusliste) {
      const { kopf } = korpustextZerlegen(name, readFileSync(`sprache/${code}/korpus/${name}`, "utf8"));
      assert.ok(kopf.nach, `${code}/${name}: nach`);
      assert.deepEqual(quellenangabeFehler(quellenangabeAusKopf(kopf), { literatur, texte: texteJeSprache[code] }), [], `${code}/${name}`);
    }
    for (const bild of TITELBILDER) {
      assert.ok(bild.quellenangabe, `${bild.datei}: ohne Quellenangabe`);
      assert.deepEqual(quellenangabeFehler(bild.quellenangabe, { literatur, texte: texteJeSprache[code] }), [], `${code}: ${bild.datei}`);
    }
  }
});

test("Quellenangabe: Kopf eines Korpustexts, Fehler, Kurzbeleg", () => {
  assert.deepEqual(quellenangabeAusKopf({ titel: "T", art: "chd", beteiligt: "Grok (dampf, masken); Claude" }),
    { art: "chd", beteiligt: [{ wer: "Grok", anteil: "dampf" }, { wer: "Grok", anteil: "masken" }, { wer: "Claude" }] });
  assert.deepEqual(quellenangabeAusKopf({ titel: "T" }), {});
  assert.deepEqual(quellenangabeFehler({ art: "chd" }), [], "selbst gemacht braucht nichts weiter");
  const fehler = quellenangabeFehler({ art: "generiert", quelle: "unbekannt" }, { literatur, texte: texteJeSprache.de });
  assert.deepEqual(fehler, ["generiert ohne beteiligt", 'Quelle "unbekannt" fehlt in sprache/literatur.json']);
  assert.match(quellenangabeFehler({ art: "eigen" })[0], /art "eigen" ist keine/);
  assert.deepEqual(quellenangabeFehler({ art: "generiert", beteiligt: [{ wer: "X", anteil: "zauber" }] }, { texte: texteJeSprache.de }), ['Anteil "zauber" ohne Text']);
  const eintrag = (id) => literatur.find((kandidat) => kandidat.id === id);
  assert.equal(kurzbeleg(eintrag("sallaberger2020ninkasi"), "u. a."), "Sallaberger 2020");
  assert.equal(kurzbeleg(eintrag("george2022gilgamesch"), "u. a."), "George u. a. 2022", "ab drei Namen");
  assert.equal(kurzbeleg(eintrag("mittermayer2021summaalu"), "u. a."), "Mittermayer 2021", "Körperschaft als Autorin, daher die Herausgeberin");
  assert.equal(kurzbeleg({ author: [{ family: "A" }, { family: "B" }], issued: { "date-parts": [[1999]] } }, "u. a."), "A / B 1999");
  assert.equal(kurzbeleg({ author: [{ literal: "Verein" }] }, "u. a."), "Verein", "ohne Jahr");
});

test("Quellenangabe als Zeile: Vorlage, vgl. und KI je nach Angabe; Anteile je Werkzeug zusammengefasst", () => {
  const omen = { art: "frei", nach: "der akkadischen Omenserie Šumma ālu", quelle: "mittermayer2021summaalu", beteiligt: [{ wer: "Claude" }] };
  assert.equal(quellenangabeText(texte, omen, literatur), "frei nach der akkadischen Omenserie Šumma ālu · vgl. Mittermayer 2021 · mit KI erstellt: Claude");
  assert.equal(quellenangabeText(texte, omen), "frei nach der akkadischen Omenserie Šumma ālu · mit KI erstellt: Claude", "ohne Literatur kein vgl.");
  assert.equal(quellenangabeText(texte, TITELBILDER[0].quellenangabe), "mit KI erstellt: ChatGPT (Motiv), Grok (Dampf, Masken, Format), Claude (Animation)");
  assert.equal(quellenangabeText(texte, TITELBILDER[0].quellenangabe, literatur, { was: "Titelbild" }), "Titelbild mit KI erstellt: ChatGPT (Motiv), Grok (Dampf, Masken, Format), Claude (Animation)");
  assert.equal(quellenangabeText(texte, { art: "chd" }), "", "selbst gemacht ohne Vorlage: keine Zeile");
  assert.equal(quellenangabeText(texte, undefined), "");
});
