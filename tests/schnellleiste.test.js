// Schnellleiste (eingabe/schnellleiste.js): fünf Leisten, Nachführen, Umbelegen, Zustand der Plätze, Auslösen, Belegen
// aus Inventar und Fähigkeitenfenster; dazu die
// Vorbelegung des Ziels (zielvorgabe) und das Bestätigen mit derselben Taste im Zielmodus (eingabe/zielmodus.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js";
import { miniSpiel, spielerinSetzen, wesen, allesSichtbar, gegenstandTragen } from "./hilfen.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { ANZAHL_LEISTEN, neueLeisten, leistenNachfuehren, leistenGueltig, aktivePlaetze, platzZustand, platzAusloesen, platzBelegen, platzLeeren, plaetzeTauschen, leisteWechseln, stellenVon } from "../src/eingabe/schnellleiste.js";
import { faehigkeitenTaste } from "../src/eingabe/faehigkeiten.js";
import { inventarTaste } from "../src/eingabe/inventar.js";
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

test("Nachführen: Fähigkeiten in Lernreihenfolge, danach jede Getränkeart einmal, Wurfwaffen nicht von selbst", () => {
  const { spiel, ninkasi } = aufstellen();
  gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true, anzahl: 2 });
  gegenstandTragen(spiel, ninkasi, { typ: "stein", wurf: {} });
  gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true });
  gegenstandTragen(spiel, ninkasi, { typ: "met", trinkbar: true });
  const leisten = leistenNachfuehren(spiel, neueLeisten());
  assert.equal(leisten.leisten.length, ANZAHL_LEISTEN);
  assert.deepEqual(aktivePlaetze(leisten).slice(0, 6), [
    { art: "faehigkeit", faehigkeit: "blick" }, { art: "faehigkeit", faehigkeit: "pflege" }, { art: "faehigkeit", faehigkeit: "stoss" },
    { art: "gegenstand", typ: "bier" }, { art: "gegenstand", typ: "met" }, null,
  ]);
  assert.equal(platzZustand(spiel, aktivePlaetze(leisten)[3]).anzahl, 3, "alle Stapel der Art zusammen");
  assert.equal(platzZustand(spiel, null), null);
  assert.deepEqual(leistenNachfuehren(spiel, leisten), leisten, "nichts doppelt");
});

test("Nachführen füllt nach Leiste 1 die Leisten 2 bis 5, ein von Hand belegter Platz bleibt", () => {
  const { spiel, ninkasi } = aufstellen();
  ninkasi.faehigkeiten = Array.from({ length: 12 }, (_, nummer) => `f${nummer}`);
  let leisten = neueLeisten();
  leisten = platzBelegen(leisten, 0, { art: "gegenstand", typ: "met" });
  leisten = leistenNachfuehren(spiel, leisten);
  assert.deepEqual(leisten.leisten[0][0], { art: "gegenstand", typ: "met", vonHand: true });
  assert.equal(leisten.leisten[0][1].faehigkeit, "f0");
  assert.deepEqual(leisten.leisten[1].slice(0, 3).map((platz) => platz?.faehigkeit ?? null), ["f9", "f10", "f11"]);
});

test("Umbelegen: belegen zieht um, tauschen, leeren bleibt leer, Leiste wechseln", () => {
  const { spiel } = aufstellen();
  let leisten = leistenNachfuehren(spiel, neueLeisten());
  leisten = platzBelegen(leisten, 5, { art: "faehigkeit", faehigkeit: "blick" });
  assert.equal(aktivePlaetze(leisten)[0], null, "vom alten Platz fort");
  assert.deepEqual(stellenVon(leisten, "faehigkeit:blick"), [{ leiste: 0, stelle: 5 }]);
  leisten = plaetzeTauschen(leisten, 5, 1);
  assert.equal(aktivePlaetze(leisten)[1].faehigkeit, "blick");
  assert.equal(aktivePlaetze(leisten)[5].faehigkeit, "pflege");
  leisten = platzLeeren(leisten, 1);
  assert.equal(aktivePlaetze(leisten)[1], null);
  assert.deepEqual(leistenNachfuehren(spiel, leisten), leisten, "heruntergenommen kommt nicht von selbst wieder");
  leisten = platzBelegen(leisten, 9, { art: "faehigkeit", faehigkeit: "blick" });
  assert.ok(!leisten.abgelegt.includes("faehigkeit:blick"), "von Hand wieder erlaubt");
  leisten = leisteWechseln(leisten, 2);
  assert.equal(leisten.aktiveLeiste, 2);
  assert.equal(leisteWechseln(leisten, 7), leisten, "ungültige Nummer ändert nichts");
  assert.deepEqual(leistenGueltig({ kaputt: true }), neueLeisten());
});

test("Auslösen: Getränk wird zum Befehl, Wurfwaffe und Fähigkeit zur Auswahl, aufgebraucht grau mit 0", () => {
  const { spiel, ninkasi } = aufstellen();
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true });
  const stein = gegenstandTragen(spiel, ninkasi, { typ: "stein", wurf: {} });
  let leisten = leistenNachfuehren(spiel, neueLeisten());
  leisten = platzBelegen(leisten, 8, { art: "gegenstand", typ: "stein" });
  assert.deepEqual(platzAusloesen(spiel, leisten, 3), { befehl: { art: "trinken", gegenstandId: bier.id } });
  assert.deepEqual(platzAusloesen(spiel, leisten, 8), { auswahl: { zweck: "werfen", gegenstandId: stein.id } });
  assert.deepEqual(platzAusloesen(spiel, leisten, 0), { auswahl: { zweck: "faehigkeit", faehigkeit: "blick" } });
  assert.equal(platzAusloesen(spiel, leisten, 9), null);
  ninkasi.inventar = [];
  assert.deepEqual(platzAusloesen(spiel, leisten, 3), { grund: "nichts_mehr_davon" });
  assert.deepEqual(platzZustand(spiel, aktivePlaetze(leisten)[3]), { platz: aktivePlaetze(leisten)[3], anzahl: 0, grund: "nichts_mehr_davon" });
});

test("Fenster: Ziffer legt das Gewählte auf die Leiste, Entf nimmt es herunter, d und w handeln direkt", () => {
  const { spiel, ninkasi } = aufstellen();
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "bier", trinkbar: true });
  assert.deepEqual(faehigkeitenTaste({ gewaehlt: "pflege" }, "Digit3", spiel, "3", belegung).leiste, { belegen: { stelle: 2, platz: { art: "faehigkeit", faehigkeit: "pflege" } } });
  assert.deepEqual(faehigkeitenTaste({ gewaehlt: "pflege" }, "Delete", spiel, "Delete", belegung).leiste, { entfernen: { art: "faehigkeit", faehigkeit: "pflege" } });
  assert.deepEqual(inventarTaste({ gewaehlt: bier.id }, "Digit0", spiel, "0", belegung).leiste, { belegen: { stelle: 9, platz: { art: "gegenstand", typ: "bier" } } });
  assert.deepEqual(inventarTaste({ gewaehlt: null, absicht: "fallenlassen" }, "KeyA", spiel, "a", belegung), { fenster: null, befehl: { art: "fallenlassen", gegenstandId: bier.id } });
  assert.deepEqual(inventarTaste({ gewaehlt: null, absicht: "werfen" }, "KeyA", spiel, "a", belegung), { fenster: null, auswahl: { zweck: "werfen", gegenstandId: bier.id } });
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

test("Zustand: Abklingzeit in Zügen, Grund nur, wenn es nicht am Ziel liegt", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.deepEqual(platzZustand(spiel, { art: "faehigkeit", faehigkeit: "blick" }), { platz: { art: "faehigkeit", faehigkeit: "blick" }, abklingend: 0 });
  ninkasi.abklingendBis = { blick: (ninkasi.zuege ?? 0) + 2 };
  const zustand = platzZustand(spiel, { art: "faehigkeit", faehigkeit: "blick" });
  assert.equal(zustand.abklingend, 2);
  assert.equal(zustand.grund, "abklingend");
});
