import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { befehlGeben, spielerinAmZug } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";

const RAUM = [
  "#########",
  "#.......#",
  "#.......#",
  "#########",
];

const EFFEKTE = {
  segen: { schritte: [{ baustein: "wert_aendern", wertName: "mp", menge: 50 }] },
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] },
  patzer: { schritte: [{ baustein: "schaden", art: "magie", menge: 7 }] },
};

const FAEHIGKEITEN = {
  ritual: { text: "f.ritual", verbrauch: { mp: 20 }, zeit: 100, dauer: { schritte: 3 }, ziel: { art: "selbst" }, wirkung: "segen", beimAbbruch: "patzer" },
  bann: { text: "f.bann", zeit: 100, dauer: { schritte: 3 }, ziel: { art: "wesen", reichweite: 2 }, wirkung: "stoss" },
};

const ZUSTAENDE = {
  betaeubt: { text: "z.betaeubt", dauer: 300, handlungsunfaehig: true },
};

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN, zustaende: ZUSTAENDE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 200, anfangswert: 100 } });
  ninkasi.faehigkeiten = Object.keys(FAEHIGKEITEN);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

// Wesen mit KI, das nach Ninkasi an die Reihe kommt
function kiWesen(spiel, x, y, ki, zusatz = {}) {
  const neues = wesen(spiel, x, y, "verderber", 10, { ki, sicht: { reichweite: 6 }, ...zusatz });
  akteurEinreihen(spiel.zustand, neues.id, 50);
  return neues;
}

const angreiferDaneben = (spiel, x, y) =>
  kiWesen(spiel, x, y, { modul: "jagen", letzteBekanntePosition: null }, { angriffe: [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }] });

test("Ritual: bezahlt am Anfang, die Logik führt alle Schritte aus, wirkt nach dem letzten", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ritual" }).ok, true);
  assert.equal(spiel.zustand.zeit, 200, "drei Schritte zu je 100, begonnen bei 0, 100 und 200");
  assert.equal(ninkasi.werte.mp.aktuell, 130, "100 - 20 + 50");
  assert.equal(ninkasi.laufendeAktion, undefined);
  assert.equal(spiel.befehle.length, 1, "aufgezeichnet wird nur der startende Befehl");
  assert.equal(ninkasi.zuege, 3);
  const arten = meldungen.map((meldung) => meldung.art);
  assert.ok(arten.indexOf("aktion_beginnt") < arten.indexOf("faehigkeit"));
});

test("Unterbrechung bei Schaden: Ninkasi wird gefragt, fortsetzen macht weiter, ein anderer Befehl bricht ab", () => {
  const { spiel, ninkasi } = aufstellen();
  angreiferDaneben(spiel, 2, 1);
  const meldungen = meldungenMitschneiden(spiel);
  befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ritual" });
  assert.equal(spielerinAmZug(spiel), true);
  assert.equal(ninkasi.laufendeAktion.unterbrochen, "schaden");
  assert.equal(ninkasi.laufendeAktion.schritteErledigt, 1);
  assert.equal(meldungen.filter((meldung) => meldung.art === "aktion_unterbrochen").length, 1);
  assert.equal(befehlGeben(spiel, { art: "fortsetzen" }).ok, true);
  assert.equal(ninkasi.laufendeAktion.schritteErledigt, 2);
  assert.equal(ninkasi.laufendeAktion.unterbrochen, "schaden", "der nächste Treffer unterbricht wieder");
  const lpVorher = ninkasi.werte.lp.aktuell;
  befehlGeben(spiel, { art: "warten" });
  assert.equal(ninkasi.laufendeAktion, undefined);
  assert.equal(ninkasi.werte.mp.aktuell, 80, "Kosten bleiben bezahlt, kein Segen");
  assert.ok(ninkasi.werte.lp.aktuell <= lpVorher - 7, "beimAbbruch wirkt");
  assert.equal(meldungen.find((meldung) => meldung.art === "aktion_abgebrochen").grund, "befehl");
  assert.equal(befehlGeben(spiel, { art: "fortsetzen" }).grund, "nichts_laufend");
});

test("Ein Feind, der schon in Sicht ist, unterbricht nicht", () => {
  const { spiel, ninkasi } = aufstellen();
  wesen(spiel, 7, 2, "verderber", 10);
  befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ritual" });
  assert.equal(ninkasi.laufendeAktion, undefined);
  assert.equal(ninkasi.werte.mp.aktuell, 130);
});

test("Handlungsunfähig bricht die lange Aktion ab", () => {
  const { spiel, ninkasi } = aufstellen();
  angreiferDaneben(spiel, 2, 1);
  befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ritual" });
  zustandSetzen(spiel, ninkasi, "betaeubt");
  befehlGeben(spiel, { art: "fortsetzen" });
  assert.equal(ninkasi.laufendeAktion, undefined);
});

test("Passt das Ziel am Ende nicht mehr, verpufft die Wirkung", () => {
  const { spiel } = aufstellen();
  const bleibt = wesen(spiel, 3, 1, "verderber", 10);
  befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "bann", ziel: { id: bleibt.id } });
  assert.equal(bleibt.werte.lp.aktuell, 7, "in Reichweite geblieben");

  const zweites = aufstellen();
  const fluechtling = kiWesen(zweites.spiel, 3, 1, { modul: "fliehen" });
  const meldungen = meldungenMitschneiden(zweites.spiel);
  befehlGeben(zweites.spiel, { art: "faehigkeit", faehigkeit: "bann", ziel: { id: fluechtling.id } });
  assert.ok(fluechtling.position.x > 3, "geflohen");
  assert.equal(fluechtling.werte.lp.aktuell, 10);
  assert.equal(meldungen.find((meldung) => meldung.art === "verpufft").grund, "zu_weit");
});
