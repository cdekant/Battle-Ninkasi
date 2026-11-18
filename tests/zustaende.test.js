import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Zustände an
import { miniSpiel, wesen, meldungenMitschneiden, weltLaufenLassen } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { modifiziert } from "../src/kern/werte.js";
import { zustandSetzen, hatZustand } from "../src/systeme/zustaende.js";

const KARTE = ["#######", "#.....#", "#######"];

const EFFEKTE = {
  giftschaden: { schritte: [{ baustein: "schaden", menge: 2, mitStaerke: true }] },
  vergiften: { schritte: [{ baustein: "zustand_setzen", zustand: "vergiftet" }] },
  entgiften: { schritte: [{ baustein: "zustand_entfernen", tag: "gift" }] },
  erfrischen: { schritte: [{ baustein: "heilen", menge: 3 }] },
  dornen: { schritte: [{ baustein: "schaden", menge: 1 }] },
  stoss: { schritte: [{ baustein: "schaden", menge: 5 }] },
  toedlich: { schritte: [{ baustein: "schaden", menge: 100 }] },
};

const ZUSTAENDE = {
  vergiftet: { text: "zustand.vergiftet", tags: ["gift"], dauer: 300, jeTick: "giftschaden" },
  saeure: { text: "zustand.saeure", dauer: 300, stapel: "aufaddieren", hoechstStapel: 2, jeTick: "giftschaden" },
  panzer: { text: "zustand.panzer", dauer: 300, stapel: "staerkster" },
  blutung: { text: "zustand.blutung", dauer: 300, stapel: "einzeln", hoechstStapel: 2 },
  abklingender_segen: { text: "zustand.segen", dauer: 1000, verlauf: "abklingend", modifikatoren: [{ ziel: "trefferchance", art: "plus", betrag: 10 }] },
  verflucht: { text: "zustand.verflucht", tags: ["gift"], beimBeginn: "erfrischen", beimEnde: "erfrischen" },
  dornenhaut: { text: "zustand.dornenhaut", dauer: 500, ausloeser: [{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }] },
  gebannt: { text: "zustand.gebannt", gebundenAnQuelle: true },
};

const spielBauen = () => miniSpiel(KARTE, { effekte: EFFEKTE, zustaende: ZUSTAENDE });
const instanzen = (entitaet, name) => (entitaet.zustaende || []).filter((instanz) => instanz.name === name);

test("Takt der Weltuhr: Wirkung je Welttick bis zum Ende, das Ende kommt über ein Zeitereignis", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const giftmischerin = wesen(spiel, 1, 1, "verderber");
  const opfer = wesen(spiel, 2, 1, "ninkasi", 20);
  effektAnwenden(spiel, "vergiften", { quelleId: giftmischerin.id, zielId: opfer.id });
  assert.ok(hatZustand(opfer, "vergiftet"));
  weltLaufenLassen(spiel, 1000);
  assert.equal(opfer.werte.lp.aktuell, 16, "Ticks bei 100 und 200, bei 300 endet das Gift");
  assert.equal(opfer.zustaende, undefined);
  const ende = meldungen.find((meldung) => meldung.art === "zustand_endet");
  assert.deepEqual([ende.zustand, ende.grund, ende.zeit], ["vergiftet", "abgelaufen", 300]);
  assert.equal(opfer.letzterVerlust.urheberId, giftmischerin.id);
  assert.deepEqual(opfer.letzterVerlust.mittel, { art: "zustand", name: "vergiftet" });
});

test("erneuern: höhere Stärke, längere Dauer; das Zeitereignis folgt dem neuen Ende", () => {
  const spiel = spielBauen();
  const opfer = wesen(spiel, 2, 1, "feinde", 100);
  const instanz = zustandSetzen(spiel, opfer, "vergiftet", { staerke: 2 });
  weltLaufenLassen(spiel, 200);
  zustandSetzen(spiel, opfer, "vergiftet", { staerke: 1 });
  assert.deepEqual([instanzen(opfer, "vergiftet").length, instanz.staerke, instanz.beginn, instanz.ende], [1, 2, 200, 500]);
  zustandSetzen(spiel, opfer, "vergiftet", { staerke: 3, dauer: 100 });
  assert.deepEqual([instanz.staerke, instanz.ende], [3, 500], "kürzere Dauer verkürzt nicht");
  weltLaufenLassen(spiel, 499);
  assert.ok(hatZustand(opfer, "vergiftet"), "das erste Zeitereignis bei 300 reiht sich neu ein");
  weltLaufenLassen(spiel, 500);
  assert.ok(!hatZustand(opfer, "vergiftet"));
});

test("aufaddieren: Stärken addieren bis hoechstStapel, die Wirkung skaliert mit mitStaerke", () => {
  const spiel = spielBauen();
  const opfer = wesen(spiel, 2, 1, "feinde", 50);
  zustandSetzen(spiel, opfer, "saeure", { staerke: 1 });
  zustandSetzen(spiel, opfer, "saeure", { staerke: 2 });
  zustandSetzen(spiel, opfer, "saeure", { staerke: 5 });
  const [instanz] = instanzen(opfer, "saeure");
  assert.deepEqual([instanz.stapel, instanz.staerke], [2, 3]);
  weltLaufenLassen(spiel, 100);
  assert.equal(opfer.werte.lp.aktuell, 44, "2 · Stärke 3");
});

test("staerkster: Schwächeres ändert nichts, mindestens gleich Starkes ersetzt", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1);
  const instanz = zustandSetzen(spiel, traegerin, "panzer", { staerke: 3 });
  weltLaufenLassen(spiel, 100);
  assert.equal(zustandSetzen(spiel, traegerin, "panzer", { staerke: 2 }), null);
  assert.deepEqual([instanz.staerke, instanz.ende], [3, 300]);
  zustandSetzen(spiel, traegerin, "panzer", { staerke: 4 });
  assert.deepEqual([instanz.staerke, instanz.ende], [4, 400]);
});

test("einzeln: eigene Instanzen mit eigenem Ende, höchstens hoechstStapel", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1);
  zustandSetzen(spiel, traegerin, "blutung");
  weltLaufenLassen(spiel, 100);
  zustandSetzen(spiel, traegerin, "blutung");
  assert.equal(zustandSetzen(spiel, traegerin, "blutung"), null);
  assert.equal(instanzen(traegerin, "blutung").length, 2);
  weltLaufenLassen(spiel, 300);
  assert.deepEqual(instanzen(traegerin, "blutung").map((instanz) => instanz.ende), [400]);
});

test("Verlauf abklingend: Modifikatoren werden je Welttick nachgeführt und am Ende entfernt", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1);
  zustandSetzen(spiel, traegerin, "abklingender_segen", { staerke: 2 });
  assert.equal(modifiziert(traegerin, "trefferchance", 50), 70);
  weltLaufenLassen(spiel, 500);
  assert.equal(modifiziert(traegerin, "trefferchance", 50), 60);
  weltLaufenLassen(spiel, 1000);
  assert.equal(modifiziert(traegerin, "trefferchance", 50), 50);
  assert.deepEqual(traegerin.modifikatoren, []);
});

test("Unbegrenzt bis zum Entfernen per Tag; beimBeginn und beimEnde wirken auf die Trägerin", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1, "feinde", 20);
  traegerin.werte.lp.aktuell = 10;
  effektAnwenden(spiel, "erfrischen", { zielId: traegerin.id });
  zustandSetzen(spiel, traegerin, "verflucht");
  zustandSetzen(spiel, traegerin, "vergiftet");
  weltLaufenLassen(spiel, 5000);
  assert.ok(hatZustand(traegerin, "verflucht"));
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, "entgiften", { zielId: traegerin.id });
  assert.ok(!hatZustand(traegerin, "verflucht"));
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "zustand_endet").map((meldung) => meldung.grund), ["entfernt"]);
  assert.equal(traegerin.werte.lp.aktuell, 15, "10, heilt 3 vorab und 3 beim Beginn, Gift 2 · 2, 3 beim Ende");
});

test("Auslöser an Zuständen: Dornenhaut schlägt zurück, solange sie besteht", () => {
  const spiel = spielBauen();
  const angreiferin = wesen(spiel, 1, 1, "ninkasi", 20);
  const igel = wesen(spiel, 2, 1, "feinde", 50);
  zustandSetzen(spiel, igel, "dornenhaut");
  effektAnwenden(spiel, "stoss", { quelleId: angreiferin.id, zielId: igel.id });
  vorgangAbschliessen(spiel);
  assert.equal(angreiferin.werte.lp.aktuell, 19);
  weltLaufenLassen(spiel, 500);
  effektAnwenden(spiel, "stoss", { quelleId: angreiferin.id, zielId: igel.id });
  vorgangAbschliessen(spiel);
  assert.equal(angreiferin.werte.lp.aktuell, 19, "abgelaufen");
});

test("Haken zustand_beginnt löst Auslöser der Trägerin aus", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1, "feinde", 20, { ausloeser: [{ bei: "zustand_beginnt", effekt: "erfrischen" }] });
  traegerin.werte.lp.aktuell = 10;
  zustandSetzen(spiel, traegerin, "panzer");
  vorgangAbschliessen(spiel);
  assert.equal(traegerin.werte.lp.aktuell, 13);
});

test("gebundenAnQuelle: Zustand endet mit dem Tod der Wirkenden", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const magierin = wesen(spiel, 1, 1, "verderber", 5);
  const opfer = wesen(spiel, 3, 1, "ninkasi");
  zustandSetzen(spiel, opfer, "gebannt", { quelleId: magierin.id });
  effektAnwenden(spiel, "toedlich", { quelleId: opfer.id, zielId: magierin.id });
  vorgangAbschliessen(spiel);
  assert.ok(!hatZustand(opfer, "gebannt"));
  assert.equal(meldungen.find((meldung) => meldung.art === "zustand_endet").grund, "quelle_tot");
});
