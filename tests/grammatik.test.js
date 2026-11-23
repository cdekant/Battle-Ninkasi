// Grammatik und Textzugriff (siehe docs/Texte.md, Grammatik): Mehrzahl, Adjektivendungen, a und an, Rückfall der Sprache.

import { test } from "node:test";
import assert from "node:assert/strict";
import regelnDe from "../sprache/de/grammatik.js";
import regelnEn from "../sprache/en/grammatik.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { erstelleTexte, platzhalterVon } from "../src/anzeige/texte.js";

const deutsch = erstelleGrammatik(regelnDe);
const englisch = erstelleGrammatik(regelnEn);

const fallweise = (nom, gen, dat, akk) => ({ nom, gen, dat, akk });
const flasche = { geschlecht: "f", einzahl: fallweise("Flasche", "Flasche", "Flasche", "Flasche"), mehrzahl: fallweise("Flaschen", "Flaschen", "Flaschen", "Flaschen") };
const hammer = { geschlecht: "m", einzahl: fallweise("Fasshammer", "Fasshammers", "Fasshammer", "Fasshammer"), mehrzahl: fallweise("Fasshämmer", "Fasshämmer", "Fasshämmern", "Fasshämmer") };
const bier = { geschlecht: "n", einzahl: fallweise("Bier", "Biers", "Bier", "Bier"), mehrzahl: fallweise("Biere", "Biere", "Bieren", "Biere") };
const ninkasi = { geschlecht: "f", eigenname: true, einzahl: fallweise("Ninkasi", "Ninkasis", "Ninkasi", "Ninkasi") };
const leer = { adjektiv: "leer" }, dunkel = { adjektiv: "dunkel", stamm: "dunkl" };

test("Deutsch: Artikel und Zahl in Einzahl und Mehrzahl", () => {
  assert.equal(deutsch.nomen(bier), "das Bier");
  assert.equal(deutsch.nomen(bier, "gen"), "des Biers");
  assert.equal(deutsch.nomen(bier, "akk", "ein"), "ein Bier");
  assert.equal(deutsch.nomen(bier, "nom", "zahl"), "Bier", "zahl ohne Mehrzahl: ohne Artikel");
  assert.equal(deutsch.nomen(bier, "akk", "bestimmt", { anzahl: 3 }), "die 3 Biere");
  assert.equal(deutsch.nomen(bier, "dat", "bestimmt", { anzahl: 3 }), "den 3 Bieren");
  assert.equal(deutsch.nomen(bier, "nom", "ein", { anzahl: 3 }), "3 Biere", "unbestimmt in der Mehrzahl: die Zahl");
  assert.equal(deutsch.nomen(bier, "nom", "zahl", { anzahl: 2 }), "2 Biere");
  assert.equal(deutsch.nomen(bier, "nom", "ohne", { anzahl: 2 }), "Biere");
  assert.equal(deutsch.nomen(bier, "nom", "bestimmt", { anzahl: 1 }), "das Bier", "1 ist Einzahl");
});

test("Deutsch: Adjektive nach starker, schwacher und gemischter Beugung", () => {
  const mitLeer = { adjektive: [leer] };
  assert.equal(deutsch.nomen(flasche, "nom", "bestimmt", mitLeer), "die leere Flasche");
  assert.equal(deutsch.nomen(flasche, "gen", "bestimmt", mitLeer), "der leeren Flasche");
  assert.equal(deutsch.nomen(flasche, "dat", "ein", mitLeer), "einer leeren Flasche");
  assert.equal(deutsch.nomen(flasche, "nom", "ohne", mitLeer), "leere Flasche");
  assert.equal(deutsch.nomen(flasche, "dat", "ohne", mitLeer), "leerer Flasche");
  assert.equal(deutsch.nomen(flasche, "nom", "ein", { anzahl: 3, adjektive: [leer] }), "3 leere Flaschen");
  assert.equal(deutsch.nomen(flasche, "akk", "bestimmt", { anzahl: 3, adjektive: [leer] }), "die 3 leeren Flaschen");
  assert.equal(deutsch.nomen(flasche, "dat", "zahl", { anzahl: 3, adjektive: [leer] }), "3 leeren Flaschen");
  assert.equal(deutsch.nomen(hammer, "nom", "ein", { adjektive: [dunkel] }), "ein dunkler Fasshammer", "stamm statt adjektiv");
  assert.equal(deutsch.nomen(hammer, "akk", "bestimmt", { adjektive: [leer] }), "den leeren Fasshammer");
  assert.equal(deutsch.nomen(bier, "nom", "ein", { adjektive: [leer] }), "ein leeres Bier");
  assert.equal(deutsch.nomen(bier, "dat", "ohne", { adjektive: [leer] }), "leerem Bier");
  assert.equal(deutsch.nomen(bier, "nom", "bestimmt", { adjektive: [dunkel, leer] }), "das dunkle leere Bier", "mehrere Adjektive gleich gebeugt");
});

test("Deutsch: Eigennamen ohne Artikel, Mehrzahl und Adjektive", () => {
  assert.equal(deutsch.nomen(ninkasi, "akk", "bestimmt", { anzahl: 2, adjektive: [leer] }), "Ninkasi");
  assert.equal(deutsch.nomen(ninkasi, "gen"), "Ninkasis");
});

test("Deutsch: Prüfung verlangt Einzahl und Mehrzahl, Eigennamen nur die Einzahl", () => {
  assert.deepEqual(deutsch.pruefen(bier, "bier"), []);
  assert.deepEqual(deutsch.pruefen(ninkasi, "ninkasi"), []);
  const ohneMehrzahl = { geschlecht: "n", einzahl: bier.einzahl };
  assert.ok(deutsch.pruefen(ohneMehrzahl, "x").some((fehler) => fehler.includes("mehrzahl.nom fehlt")));
  assert.ok(deutsch.pruefen({ ...bier, geschlecht: "p" }, "x").some((fehler) => fehler.includes("geschlecht")));
  assert.deepEqual(deutsch.adjektivPruefen(dunkel, "dunkel"), []);
  assert.equal(deutsch.adjektivPruefen({ stamm: "x" }, "x").length, 1);
});

const laterne = { einzahl: "lantern", mehrzahl: "lanterns" };
const flascheEn = { einzahl: "bottle", mehrzahl: "bottles" };
const bakterium = { einzahl: "bacterium", mehrzahl: "bacteria" };

test("Englisch: the, a und an, Zahl und Genitiv", () => {
  assert.equal(englisch.nomen(laterne), "the lantern");
  assert.equal(englisch.nomen(laterne, "akk", "ein"), "a lantern", "Fälle ändern nichts");
  assert.equal(englisch.nomen(laterne, "nom", "bestimmt", { anzahl: 3 }), "the 3 lanterns");
  assert.equal(englisch.nomen(laterne, "nom", "ein", { anzahl: 3 }), "3 lanterns");
  assert.equal(englisch.nomen(laterne, "nom", "zahl"), "lantern");
  assert.equal(englisch.nomen(laterne, "gen"), "the lantern's");
  assert.equal(englisch.nomen(laterne, "gen", "bestimmt", { anzahl: 2 }), "the 2 lanterns'");
  assert.equal(englisch.nomen(bakterium, "gen", "ohne", { anzahl: 2 }), "bacteria's");
  assert.equal(englisch.nomen({ eigenname: true, einzahl: "Ninkasi" }, "gen", "ein", { adjektive: [{ adjektiv: "empty" }] }), "Ninkasi's");
});

test("Englisch: a oder an nach dem ersten Wort, mit Ausnahmen und ausdrücklicher Wahl", () => {
  const ein = (eintrag, adjektive = []) => englisch.nomen(eintrag, "nom", "ein", { adjektive });
  assert.equal(ein(flascheEn, [{ adjektiv: "empty" }]), "an empty bottle");
  assert.equal(ein({ einzahl: "acorn", mehrzahl: "acorns" }, [{ adjektiv: "rotten" }]), "a rotten acorn", "das Adjektiv entscheidet");
  assert.equal(ein({ einzahl: "unicorn", mehrzahl: "unicorns" }), "a unicorn");
  assert.equal(ein({ einzahl: "hour", mehrzahl: "hours" }), "an hour");
  assert.equal(ein({ einzahl: "Honest brewer", mehrzahl: "honest brewers" }), "an Honest brewer", "groß geschrieben gilt dieselbe Ausnahme");
  assert.equal(ein({ einzahl: "SOS flare", mehrzahl: "SOS flares", artikel: "an" }), "an SOS flare", "artikel am Hauptwort");
  assert.equal(ein(laterne, [{ adjektiv: "unholy", artikel: "an" }]), "an unholy lantern", "artikel am Adjektiv");
  assert.equal(ein(laterne, [{ adjektiv: "old" }, { adjektiv: "brass" }]), "an old brass lantern");
});

test("Englisch: Prüfung verlangt Einzahl und Mehrzahl", () => {
  assert.deepEqual(englisch.pruefen(laterne, "laterne"), []);
  assert.deepEqual(englisch.pruefen({ eigenname: true, einzahl: "Ninkasi" }, "ninkasi"), []);
  assert.equal(englisch.pruefen({ einzahl: "lantern" }, "x").length, 1);
  assert.equal(englisch.pruefen({ ...laterne, artikel: "the" }, "x").length, 1);
  assert.throws(() => erstelleGrammatik({ verfahren: "gibtesnicht" }), /Verfahren/);
});

test("Textzugriff: Mehrzahl aus dem Bezug, Adjektive aus Zuständen und Hauptwort, Satz nach der Zahl", () => {
  const texte = erstelleTexte({
    "gegenstand.flasche": { ...flasche, adjektive: ["adjektiv.leer"] },
    "wesen.bier": bier,
    "adjektiv.leer": leer,
    "adjektiv.gereizt": { adjektiv: "gereizt" },
    "log.liegt": "Hier liegt {was.nom.ein}.",
    "log.liegt.mehrzahl": "Hier liegen {was.nom.ein}.",
  }, deutsch);
  assert.equal(texte.nomenForm({ text: "gegenstand.flasche" }, "nom", "ein"), "eine leere Flasche");
  assert.equal(texte.nomenForm({ text: "gegenstand.flasche", anzahl: 4 }, "nom", "zahl"), "4 leere Flaschen");
  const gereiztesBier = { text: "wesen.bier", zustaende: [{ name: "gereizt", adjektiv: "adjektiv.gereizt" }] };
  assert.equal(texte.nomenForm(gereiztesBier, "dat", "ein"), "einem gereizten Bier", "Entität mit Zustand");
  assert.equal(texte.nomenForm({ text: "wesen.bier", adjektive: ["adjektiv.gereizt"] }), "das gereizte Bier", "Bezug einer Meldung");
  assert.equal(texte.textNachZahl("log.liegt", 1, { was: { text: "wesen.bier" } }), "Hier liegt ein Bier.");
  assert.equal(texte.textNachZahl("log.liegt", 3, { was: { text: "wesen.bier", anzahl: 3 } }), "Hier liegen 3 Biere.");
});

test("Textzugriff: fehlende Schlüssel fallen auf die zweite Sprache mit deren Grammatik zurück", () => {
  const texte = erstelleTexte(
    { "gegenstand.laterne": laterne, "log.nimmt": "{wer.nom} takes {was.akk.ein}." },
    englisch,
    { texte: { "wesen.bier": bier, "log.nimmt": "{wer.nom} nimmt {was.akk}.", "log.nur_deutsch": "Nur deutsch" }, grammatik: deutsch },
  );
  assert.equal(texte.text("log.nimmt", { wer: { text: "gegenstand.laterne" }, was: { text: "gegenstand.laterne" } }), "the lantern takes a lantern.");
  assert.equal(texte.text("log.nur_deutsch"), "Nur deutsch");
  assert.equal(texte.nomenForm({ text: "wesen.bier" }, "akk", "ein"), "ein Bier", "deutsches Hauptwort mit deutscher Grammatik");
  assert.ok(texte.hatSchluessel("log.nur_deutsch"));
  assert.deepEqual(platzhalterVon("{wer.nom} trifft {ziel.akk.ein}: {menge} ({menge})"), ["menge", "wer", "ziel"]);
});
