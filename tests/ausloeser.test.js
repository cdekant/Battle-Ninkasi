import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Auslöser an
import { miniSpiel, wesen, meldungenMitschneiden, hakenFuerTest } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { wirksameChance } from "../src/kern/ausloeser.js";
import { nahkampf } from "../src/systeme/kampf.js";

const KARTE = ["######", "#....#", "######"];

const EFFEKTE = {
  konter: { schritte: [{ baustein: "angreifen" }] },
  wut_setzen: { schritte: [{ baustein: "zustand_setzen", zustand: "wut" }] },
  stoss: { schritte: [{ baustein: "schaden", menge: 3 }] },
  dornen: { schritte: [{ baustein: "schaden", menge: 1 }] },
  doppeldornen: { schritte: [{ baustein: "schaden", menge: 2 }] },
  toedlich: { schritte: [{ baustein: "schaden", menge: 100 }] },
  freude: { schritte: [{ baustein: "heilen", menge: 1 }] },
};

const DORNEN = { bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" };

const ZUSTAENDE = { wut: { text: "z.wut" } };

function spielBauen(regeln) {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, zustaende: ZUSTAENDE, regeln });
  return { spiel, meldungen: meldungenMitschneiden(spiel) };
}

const schadensmeldungen = (meldungen) => meldungen.filter((meldung) => meldung.art === "schaden");

test("wirksameChance sinkt je Kettenstufe, einheitlich gerundet", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((stufe) => wirksameChance(100, stufe, 50)), [100, 50, 25, 13, 7, 4]);
  assert.equal(wirksameChance(30, 0, 50), 30);
  assert.equal(wirksameChance(100, 3, 100), 100);
});

test("Dornen: Schaden an der Trägerin trifft die Quelle, erst nach dem auslösenden Schritt", () => {
  const { spiel, meldungen } = spielBauen();
  const angreifer = wesen(spiel, 1, 1, "ninkasi", 20);
  const igel = wesen(spiel, 2, 1, "feinde", 20, { ausloeser: [DORNEN] });
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: igel.id });
  assert.equal(angreifer.werte.lp.aktuell, 20, "Auslöser warten auf den Abschluss des Vorgangs");
  vorgangAbschliessen(spiel);
  assert.equal(angreifer.werte.lp.aktuell, 19);
  assert.equal(schadensmeldungen(meldungen).at(-1).ursache, "ausloeser");
  assert.deepEqual(spiel.anstehendeAusloeser, []);
});

test("Rolle filtert: Dornen greifen nicht, wenn die Trägerin selbst zuschlägt", () => {
  const { spiel } = spielBauen();
  const igel = wesen(spiel, 1, 1, "feinde", 20, { ausloeser: [DORNEN] });
  const opfer = wesen(spiel, 2, 1, "ninkasi", 20);
  effektAnwenden(spiel, "stoss", { quelleId: igel.id, zielId: opfer.id });
  vorgangAbschliessen(spiel);
  assert.equal(igel.werte.lp.aktuell, 20);
});

test("Auslöser laufen in der Reihenfolge ihres Vormerkens", () => {
  const { spiel, meldungen } = spielBauen();
  const angreifer = wesen(spiel, 1, 1, "ninkasi", 20);
  const igel = wesen(spiel, 2, 1, "feinde", 20, { ausloeser: [DORNEN, { ...DORNEN, effekt: "doppeldornen" }] });
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: igel.id });
  vorgangAbschliessen(spiel);
  assert.deepEqual(schadensmeldungen(meldungen).map((meldung) => meldung.menge), [3, 1, 2]);
});

test("Kettengrenze: Dornen gegen Dornen endet nach der höchsten Kettentiefe", () => {
  const { spiel, meldungen } = spielBauen();
  const ungedaempft = { ...DORNEN, daempfung: 100 };
  const erster = wesen(spiel, 1, 1, "ninkasi", 50, { ausloeser: [ungedaempft] });
  const zweiter = wesen(spiel, 2, 1, "feinde", 50, { ausloeser: [ungedaempft] });
  effektAnwenden(spiel, "stoss", { quelleId: erster.id, zielId: zweiter.id });
  vorgangAbschliessen(spiel);
  // ein Stoß und fünf Stufen Dornen (hoechsteKettentiefe 5 in daten/regeln.js)
  assert.equal(schadensmeldungen(meldungen).length, 1 + spiel.daten.regeln.ausloeser.hoechsteKettentiefe);
});

test("Dämpfung aus den Regeln: bei 0 % endet die Kette nach der ersten Stufe", () => {
  const { spiel, meldungen } = spielBauen({ ausloeser: { daempfungProStufe: 0 } });
  const erster = wesen(spiel, 1, 1, "ninkasi", 50, { ausloeser: [DORNEN] });
  const zweiter = wesen(spiel, 2, 1, "feinde", 50, { ausloeser: [DORNEN] });
  effektAnwenden(spiel, "stoss", { quelleId: erster.id, zielId: zweiter.id });
  vorgangAbschliessen(spiel);
  assert.equal(schadensmeldungen(meldungen).length, 2);
});

test("Abgebrochener Haken: weitere Handler und Auslöser entfallen", (t) => {
  const { spiel, meldungen } = spielBauen();
  const angreifer = wesen(spiel, 1, 1, "ninkasi", 20);
  const igel = wesen(spiel, 2, 1, "feinde", 20, { ausloeser: [DORNEN] });
  const aufgerufen = [];
  hakenFuerTest(t, "vor_schaden", (spielImHaken, kontext) => { aufgerufen.push("schild"); kontext.abgebrochen = true; }, { rang: 10 });
  hakenFuerTest(t, "vor_schaden", () => aufgerufen.push("danach"), { rang: 20 });
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: igel.id });
  vorgangAbschliessen(spiel);
  assert.deepEqual(aufgerufen, ["schild"]);
  assert.deepEqual([igel.werte.lp.aktuell, angreifer.werte.lp.aktuell], [20, 20]);
  assert.deepEqual(schadensmeldungen(meldungen), []);
});

test("nach_tod: Auslöser des Opfers treffen den Verursacher", () => {
  const { spiel } = spielBauen();
  const angreifer = wesen(spiel, 1, 1, "ninkasi", 20);
  const essig = wesen(spiel, 2, 1, "feinde", 5, { ausloeser: [{ bei: "nach_tod", ziel: "quelle", effekt: "doppeldornen" }] });
  effektAnwenden(spiel, "toedlich", { quelleId: angreifer.id, zielId: essig.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[essig.id], undefined);
  assert.equal(angreifer.werte.lp.aktuell, 18);
});

test("Nahkampf löst nach_treffer und verfehlt aus", () => {
  const { spiel } = spielBauen();
  const ausloeser = [
    { bei: "nach_treffer", rolle: "quelle", effekt: "freude" },
    { bei: "verfehlt", rolle: "quelle", effekt: "doppeldornen" },
  ];
  const sicher = wesen(spiel, 1, 1, "ninkasi", 20, { ausloeser, angriffe: [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }] });
  sicher.werte.lp.aktuell = 10;
  const ziel = wesen(spiel, 2, 1, "feinde", 20);
  nahkampf(spiel, sicher, ziel);
  vorgangAbschliessen(spiel);
  assert.equal(sicher.werte.lp.aktuell, 11);
  sicher.angriffe[0].genauigkeit = 0;
  nahkampf(spiel, sicher, ziel);
  vorgangAbschliessen(spiel);
  assert.equal(sicher.werte.lp.aktuell, 9);
});

test("wenn: Bossphase beginnt unter 50 % LP genau einmal (ohne_zustand)", () => {
  const { spiel } = spielBauen();
  const phase = { bei: "nach_schaden", rolle: "ziel", effekt: "wut_setzen", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }, { bedingung: "ohne_zustand", zustand: "wut" }] };
  const angreifer = wesen(spiel, 1, 1, "ninkasi", 50);
  const boss = wesen(spiel, 2, 1, "feinde", 10, { ausloeser: [phase] });
  const anzahlWut = () => (boss.zustaende || []).filter((instanz) => instanz.name === "wut").length;
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: boss.id });
  vorgangAbschliessen(spiel);
  assert.equal(anzahlWut(), 0, "7 von 10 LP");
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: boss.id });
  vorgangAbschliessen(spiel);
  assert.equal(anzahlWut(), 1, "4 von 10 LP");
  effektAnwenden(spiel, "dornen", { quelleId: angreifer.id, zielId: boss.id });
  vorgangAbschliessen(spiel);
  assert.equal(anzahlWut(), 1, "kein zweites Mal");
});

test("Baustein angreifen: Konter nur daneben, gegenseitige Konter enden an der Kettengrenze", () => {
  const { spiel, meldungen } = spielBauen();
  const konter = { bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "konter", daempfung: 100 };
  const angriffe = [{ name: "stoss", genauigkeit: 100, effekt: "dornen" }];
  const erster = wesen(spiel, 1, 1, "ninkasi", 50, { angriffe, ausloeser: [konter] });
  const zweiter = wesen(spiel, 2, 1, "feinde", 50, { angriffe, ausloeser: [konter] });
  nahkampf(spiel, erster, zweiter);
  vorgangAbschliessen(spiel);
  assert.equal(schadensmeldungen(meldungen).length, 1 + spiel.daten.regeln.ausloeser.hoechsteKettentiefe);

  const fern = spielBauen();
  const schuetzin = wesen(fern.spiel, 1, 1, "ninkasi", 50);
  const igel = wesen(fern.spiel, 4, 1, "feinde", 50, { angriffe, ausloeser: [konter] });
  effektAnwenden(fern.spiel, "stoss", { quelleId: schuetzin.id, zielId: igel.id });
  vorgangAbschliessen(fern.spiel);
  assert.equal(schadensmeldungen(fern.meldungen).length, 1, "zu weit weg für einen Konter");
});
