import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Zustände an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, weltLaufenLassen } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { fraktionVon } from "../src/kern/zustand.js";
import { nahkampf } from "../src/systeme/kampf.js";

const KARTE = [
  "#########",
  "#.......#",
  "#.......#",
  "#.......#",
  "#########",
];

const EFFEKTE = {
  hefe_rufen: { schritte: [{ baustein: "beschwoeren", wesen: "bierhefe", anzahl: 2, zustand: "beschworen" }] },
  hefe_auf_zeit: { schritte: [{ baustein: "beschwoeren", wesen: "bierhefe", zustand: "beschworen", dauer: 200 }] },
  speere_rufen: { schritte: [{ baustein: "beschwoeren", wesen: "geisterspeer", anzahl: 8, zustand: "beschworen" }] },
  verschwinden: { schritte: [{ baustein: "verschwinden" }] },
  toedlich: { schritte: [{ baustein: "schaden", menge: 100 }] },
};

const ZUSTAENDE = {
  beschworen: { text: "zustand.beschworen", gebundenAnQuelle: true, beimEnde: "verschwinden" },
};

const WESEN = {
  bierhefe: { text: "wesen.bierhefe", fraktion: "hefen", werte: { lp: { grundwert: 5 } }, ki: { modul: "jagen", letzteBekanntePosition: null }, angriff: { trefferchance: 100, effekt: "toedlich" } },
  geisterspeer: { text: "wesen.geisterspeer", fraktion: "geister", werte: { lp: { grundwert: 1 } }, ki: { modul: "jagen", letzteBekanntePosition: null } },
};

const spielBauen = () => miniSpiel(KARTE, { effekte: EFFEKTE, zustaende: ZUSTAENDE, wesen: WESEN });
const beschworene = (spiel, typ) => Object.values(spiel.zustand.entitaeten).filter((entitaet) => entitaet.typ === typ);

test("Beschwören: auf freien Feldern um die Beschwörerin, mit ihrer Fraktion, eingereiht und mit Zustand", () => {
  const spiel = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 2, 2);
  wesen(spiel, 1, 1, "verderber");
  effektAnwenden(spiel, "hefe_rufen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  const hefen = beschworene(spiel, "bierhefe");
  assert.deepEqual(hefen.map((hefe) => hefe.position), [{ x: 2, y: 1 }, { x: 1, y: 2 }], "erste freie Felder nach Abstand und Feldindex");
  for (const hefe of hefen) {
    assert.deepEqual([fraktionVon(hefe), hefe.beschworenVon, hefe.zustaende[0].name], ["ninkasi", ninkasi.id, "beschworen"]);
    assert.ok(spiel.zustand.warteschlange.some((eintrag) => eintrag.art === "akteur" && eintrag.akteurId === hefe.id && eintrag.zeit === 100));
  }
});

test("Tötet eine beschworene Hefe, zählt der Tod für die Beschwörerin", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const ninkasi = spielerinSetzen(spiel, 2, 2);
  const bakterium = wesen(spiel, 4, 1, "verderber");
  effektAnwenden(spiel, "hefe_rufen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  const [hefe] = beschworene(spiel, "bierhefe");
  nahkampf(spiel, hefe, bakterium);
  vorgangAbschliessen(spiel);
  const tod = meldungen.find((meldung) => meldung.art === "tod");
  assert.deepEqual([tod.opfer.id, tod.quelle.id, tod.mittel.art], [bakterium.id, ninkasi.id, "angriff"]);
});

test("Die beschworenen Speere verschwinden mit dem Tod des Necro-Brauers, ohne selbst zu sterben", () => {
  const spiel = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const ninkasi = spielerinSetzen(spiel, 6, 2);
  const necro = wesen(spiel, 2, 2, "verderber");
  effektAnwenden(spiel, "speere_rufen", { quelleId: necro.id, zielId: necro.id });
  assert.equal(beschworene(spiel, "geisterspeer").length, 8);
  effektAnwenden(spiel, "toedlich", { quelleId: ninkasi.id, zielId: necro.id });
  vorgangAbschliessen(spiel);
  assert.equal(beschworene(spiel, "geisterspeer").length, 0);
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "tod").map((meldung) => meldung.opfer.id), [necro.id]);
  assert.equal(meldungen.filter((meldung) => meldung.art === "verschwindet").length, 8);
  assert.ok(!spiel.zustand.warteschlange.some((eintrag) => eintrag.art === "akteur" && eintrag.akteurId !== ninkasi.id));
});

test("Verschwindet die Beschwörerin, verschwinden auch ihre Beschworenen; Beschwörung auf Zeit endet von selbst", () => {
  const spiel = spielBauen();
  const necro = wesen(spiel, 2, 2, "verderber");
  effektAnwenden(spiel, "speere_rufen", { quelleId: necro.id, zielId: necro.id });
  effektAnwenden(spiel, "verschwinden", { zielId: necro.id });
  assert.deepEqual([spiel.zustand.entitaeten[necro.id], beschworene(spiel, "geisterspeer").length], [undefined, 0]);

  const ninkasi = spielerinSetzen(spiel, 6, 2);
  effektAnwenden(spiel, "hefe_auf_zeit", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(beschworene(spiel, "bierhefe").length, 1);
  weltLaufenLassen(spiel, 200);
  assert.equal(beschworene(spiel, "bierhefe").length, 0);
  effektAnwenden(spiel, "verschwinden", { zielId: ninkasi.id });
  assert.ok(spiel.zustand.entitaeten[ninkasi.id], "Ninkasi verschwindet nicht");
});
