// Schnellleiste (eingabe/schnellleiste.js): automatische Belegung, Zustand der Plätze, Auslösen; dazu die
// Vorbelegung des Ziels (zielvorgabe) und das Bestätigen mit derselben Taste im Zielmodus (eingabe/zielmodus.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js";
import { miniSpiel, spielerinSetzen, wesen, allesSichtbar, gegenstandTragen } from "./hilfen.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { plaetzeDerLeiste, platzZustand, platzAusloesen } from "../src/eingabe/schnellleiste.js";
import { zielmodusBeginnen, zielmodusTaste, zielvorgabeVon } from "../src/eingabe/zielmodus.js";
import belegung from "../src/eingabe/belegung.js";

const KARTE = [
  "##########",
  "#........#",
  "#........#",
  "##########",
];

const EFFEKTE = { treffer: { schritte: [{ baustein: "schaden", art: "magie", menge: 3 }] }, pflaster: { schritte: [{ baustein: "heilen", menge: 3 }], tags: ["heilung"] } };
const FAEHIGKEITEN = {
  blick: { text: "f.blick", abklingzeit: 3, ziel: { art: "wesen", reichweite: 8 }, wirkung: "treffer" },
  pflege: { text: "f.pflege", ziel: { art: "wesen", reichweite: 8 }, wirkung: "pflaster" },
  stoss: { text: "f.stoss", zielvorgabe: "selbst", ziel: { art: "feld", reichweite: 8 }, wirkung: "treffer" },
};

function aufstellen() {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100 } });
  ninkasi.faehigkeiten = ["blick", "pflege", "stoss"];
  ninkasi.inventar = [];
  const nah = wesen(spiel, 4, 1, "feinde", 20);
  const fern = wesen(spiel, 8, 2, "feinde", 20);
  allesSichtbar(spiel);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, nah, fern };
}

test("Belegung: Fähigkeiten in Lernreihenfolge, danach jede Getränkeart einmal, Rest frei", () => {
  const { spiel, ninkasi } = aufstellen();
  gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true, anzahl: 2 });
  gegenstandTragen(spiel, ninkasi, { typ: "stein" });
  gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true });
  gegenstandTragen(spiel, ninkasi, { typ: "met", trinkbar: true });
  const plaetze = plaetzeDerLeiste(spiel);
  assert.equal(plaetze.length, 10);
  assert.deepEqual(plaetze.slice(0, 6), [
    { art: "faehigkeit", faehigkeit: "blick" }, { art: "faehigkeit", faehigkeit: "pflege" }, { art: "faehigkeit", faehigkeit: "stoss" },
    { art: "getraenk", typ: "bier" }, { art: "getraenk", typ: "met" }, null,
  ]);
  assert.equal(platzZustand(spiel, plaetze[3]).anzahl, 3, "alle Stapel der Art zusammen");
  assert.equal(platzZustand(spiel, null), null);
});

test("Auslösen: Getränk wird zum Befehl, Fähigkeit zur Auswahl für den Zielmodus, leerer Platz nichts", () => {
  const { spiel, ninkasi } = aufstellen();
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true });
  assert.deepEqual(platzAusloesen(spiel, 3), { befehl: { art: "trinken", gegenstandId: bier.id } });
  assert.deepEqual(platzAusloesen(spiel, 0), { auswahl: { zweck: "faehigkeit", faehigkeit: "blick" } });
  assert.equal(platzAusloesen(spiel, 9), null);
});

test("Zustand: Abklingzeit in Zügen, Grund nur, wenn es nicht am Ziel liegt", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.deepEqual(platzZustand(spiel, { art: "faehigkeit", faehigkeit: "blick" }), { platz: { art: "faehigkeit", faehigkeit: "blick" }, abklingend: 0 });
  ninkasi.abklingendBis = { blick: (ninkasi.zuege ?? 0) + 2 };
  const zustand = platzZustand(spiel, { art: "faehigkeit", faehigkeit: "blick" });
  assert.equal(zustand.abklingend, 2);
  assert.equal(zustand.grund, "abklingend");
});

test("Zielvorgabe: Feind nach Abstand, Gefährte bei Heilung, Selbst aus den Daten; das letzte Ziel gewinnt", () => {
  const { spiel, ninkasi, nah, fern } = aufstellen();
  assert.equal(zielvorgabeVon(spiel, { zweck: "faehigkeit", faehigkeit: "blick" }), "feind");
  assert.equal(zielvorgabeVon(spiel, { zweck: "faehigkeit", faehigkeit: "pflege" }), "gefaehrte");
  assert.equal(zielvorgabeVon(spiel, { zweck: "werfen", gegenstandId: 1 }), "feind");
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "blick" }).modus.cursor, nah.position);
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "blick" }, { letztesZielId: fern.id }).modus.cursor, fern.position);
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "stoss" }).modus.cursor, ninkasi.position);
  const verbuendet = wesen(spiel, 2, 2, "ninkasi", 20);
  verbuendet.werte.lp.aktuell = 5;
  allesSichtbar(spiel);
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "pflege" }).modus.cursor, verbuendet.position, "verletzte Gefährtin vor der unverletzten Ninkasi");
});

test("Zielmodus aus der Leiste: dieselbe Taste bestätigt, eine andere Ziffer nicht", () => {
  const { spiel, nah } = aufstellen();
  const { modus } = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "blick" }, { platz: 0 });
  assert.equal(modus.platz, 0);
  assert.deepEqual(zielmodusTaste(spiel, modus, "Digit2", belegung), { modus });
  const bestaetigt = zielmodusTaste(spiel, modus, "Digit1", belegung);
  assert.equal(bestaetigt.modus, null);
  assert.deepEqual(bestaetigt.befehl, { art: "faehigkeit", faehigkeit: "blick", ziel: { id: nah.id } });
});
