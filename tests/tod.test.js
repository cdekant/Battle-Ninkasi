import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Auslöser an
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, hakenFuerTest } from "./hilfen.js";
import { effektAnwenden, wertAendern } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { anmelden, holen } from "../src/kern/register.js";
import { entitaetEntfernen } from "../src/kern/zustand.js";
import { ereignisEinreihen, akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten } from "../src/kern/werte.js";

const KARTE = ["########", "#......#", "########"];

const EFFEKTE = {
  aderlass: { schritte: [{ baustein: "wert_aendern", wertName: "lp", menge: -50 }] },
  hieb: { schritte: [{ baustein: "schaden", menge: 10 }] },
  rundumschlag: { schritte: [{ baustein: "test_alle_feinde", menge: 10 }] },
};

// Testbaustein als Ersatz für eine Flächenwirkung: Schaden an allen Wesen der Fraktion "feinde"
anmelden("bausteine", "test_alle_feinde", (spiel, kontext, parameter) => {
  for (const entitaet of Object.values(spiel.zustand.entitaeten)) {
    if (entitaet.fraktion === "feinde") holen("bausteine", "schaden")(spiel, { ...kontext, zielId: entitaet.id }, parameter);
  }
});

const spielBauen = () => miniSpiel(KARTE, { effekte: EFFEKTE });

test("wert_aendern auf 0 LP tötet, aber erst beim Abschluss des Vorgangs", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const opfer = wesen(spiel, 2, 1);
  effektAnwenden(spiel, "aderlass", { quelleId: ninkasi.id, zielId: opfer.id, ursache: "test" });
  assert.equal(opfer.werte.lp.aktuell, 0);
  assert.ok(spiel.zustand.entitaeten[opfer.id], "lebt noch bis zur Zustandsprüfung");
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[opfer.id], undefined);
  const tod = meldungen.find((meldung) => meldung.art === "tod");
  assert.deepEqual([tod.opfer.id, tod.quelle.id, tod.ursache], [opfer.id, ninkasi.id, "test"]);
});

test("Flächenwirkung trifft alle Ziele, Tode danach in fester Reihenfolge", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const feinde = [wesen(spiel, 2, 1, "feinde", 5), wesen(spiel, 3, 1, "feinde", 5), wesen(spiel, 4, 1, "feinde", 5)];
  effektAnwenden(spiel, "rundumschlag", { quelleId: ninkasi.id, zielId: ninkasi.id, ursache: "test" });
  vorgangAbschliessen(spiel);
  const ablauf = meldungen.map((meldung) => `${meldung.art}:${(meldung.ziel || meldung.opfer).id}`);
  const ids = feinde.map((feind) => feind.id);
  assert.deepEqual(ablauf, [...ids.map((id) => `schaden:${id}`), ...ids.map((id) => `tod:${id}`)]);
});

test("vor_tod verhindert den Tod nur, wenn der Lebenswert danach über 0 liegt", (t) => {
  const spiel = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const gerettet = wesen(spiel, 2, 1, "feinde", 5, { rettungsanker: true });
  const verloren = wesen(spiel, 3, 1, "feinde", 5);
  hakenFuerTest(t, "vor_tod", (spielImHaken, kontext) => {
    const entitaet = spielImHaken.zustand.entitaeten[kontext.zielId];
    if (entitaet.rettungsanker) entitaet.werte.lp.aktuell = 1;
    kontext.abgebrochen = true;
  });
  for (const ziel of [gerettet, verloren]) effektAnwenden(spiel, "hieb", { quelleId: ninkasi.id, zielId: ziel.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[gerettet.id].werte.lp.aktuell, 1);
  assert.equal(spiel.zustand.entitaeten[gerettet.id].letzterVerlust, undefined);
  assert.equal(spiel.zustand.entitaeten[verloren.id], undefined);
});

test("Hinterlassenschaft: Inventar fällt aufs Feld oder wird vernichtet", () => {
  const spiel = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const traeger = wesen(spiel, 3, 1);
  const vernichter = wesen(spiel, 4, 1, "feinde", 10, { beimTod: { inventar: "vernichten" } });
  const fallengelassen = gegenstandTragen(spiel, traeger);
  const vernichtet = gegenstandTragen(spiel, vernichter);
  for (const ziel of [traeger, vernichter]) effektAnwenden(spiel, "aderlass", { quelleId: ninkasi.id, zielId: ziel.id });
  vorgangAbschliessen(spiel);
  assert.deepEqual(spiel.zustand.entitaeten[fallengelassen.id].position, { x: 3, y: 1 });
  assert.equal(spiel.zustand.entitaeten[fallengelassen.id].getragenVon, undefined);
  assert.equal(spiel.zustand.entitaeten[vernichtet.id], undefined);
});

test("Entfernen nimmt Akteur, gebundene Zeitereignisse und Getragenes mit, ungebundene Ereignisse bleiben", () => {
  const spiel = spielBauen();
  const zustand = spiel.zustand;
  const wesenMitAllem = wesen(spiel, 2, 1);
  const getragen = gegenstandTragen(spiel, wesenMitAllem);
  akteurEinreihen(zustand, wesenMitAllem.id, 100);
  ereignisEinreihen(zustand, 500, "erwachen", {}, wesenMitAllem.id);
  ereignisEinreihen(zustand, 600, "weltgeschehen", { akteurId: wesenMitAllem.id });
  entitaetEntfernen(zustand, wesenMitAllem.id);
  assert.equal(zustand.entitaeten[getragen.id], undefined);
  assert.deepEqual(zustand.warteschlange.map((eintrag) => eintrag.ereignistyp), ["weltgeschehen"]);
});

test("Entfernt man Getragenes, verschwindet es aus dem Inventar der Trägerin", () => {
  const spiel = spielBauen();
  const traegerin = wesen(spiel, 2, 1);
  const gegenstand = gegenstandTragen(spiel, traegerin);
  entitaetEntfernen(spiel.zustand, gegenstand.id);
  assert.deepEqual(traegerin.inventar, []);
});

test("Stirbt Ninkasi, ist das Spiel vorbei und sie bleibt im Zustand", () => {
  const spiel = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 1, 1, 30);
  const gegner = wesen(spiel, 2, 1);
  effektAnwenden(spiel, "aderlass", { quelleId: gegner.id, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.vorbei, true);
  assert.ok(spiel.zustand.entitaeten[ninkasi.id]);
});

test("Ein eigener Lebenswert ersetzt die LP", () => {
  const spiel = spielBauen();
  const biofilm = wesen(spiel, 2, 1, "feinde", 10, {
    lebenswert: "zusammenhalt",
    werte: werteAusDaten({ lp: { grundwert: 10 }, zusammenhalt: { grundwert: 3 } }),
  });
  wertAendern(spiel, biofilm, "lp", -10);
  vorgangAbschliessen(spiel);
  assert.ok(spiel.zustand.entitaeten[biofilm.id], "LP bei 0 töten nicht, wenn ein anderer Lebenswert gilt");
  wertAendern(spiel, biofilm, "zusammenhalt", -3);
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[biofilm.id], undefined);
});
