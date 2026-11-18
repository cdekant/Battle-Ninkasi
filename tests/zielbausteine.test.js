import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Zielmuster an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { bausteinAnmelden } from "../src/kern/bausteine.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { nahkampf } from "../src/systeme/kampf.js";

const KARTE = [
  "###########",
  "#.........#",
  "#.........#",
  "#.........#",
  "#.........#",
  "#.........#",
  "###########",
];

const KREIS = { art: "kreis", radius: 1 };

const EFFEKTE = {
  stich: { schritte: [{ baustein: "schaden", menge: 4 }] },
  vernichten: { schritte: [{ baustein: "schaden", menge: 100 }] },
  feuerball: { schritte: [{ baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "stich" }] },
  feuerball_ohne_mich: { schritte: [{ baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "stich", ohneUrheber: true }] },
  feuerball_feinde: { schritte: [{ baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "stich", trifft: "feinde" }] },
  lebensraub: {
    schritte: [
      { baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "stich", ohneUrheber: true },
      { baustein: "heilen", menge: { aus: "summeSchaden", prozent: 50 } },
    ],
  },
  verteilter_schlag: { schritte: [{ baustein: "schaden", menge: 12, teilen: "anzahlZiele" }] },
  verteilt: { schritte: [{ baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "verteilter_schlag", trifft: "feinde" }] },
  wurf: { schritte: [{ baustein: "geschoss", reichweite: 8, effekt: "vernichten" }] },
  sprengwurf: { schritte: [{ baustein: "geschoss", reichweite: 8, effekt: "feuerball" }] },
  blitzschlag: { schritte: [{ baustein: "schaden", menge: 10, prozentJeSprung: 50 }] },
  kettenblitz: { schritte: [{ baustein: "springen", anzahl: 2, reichweite: 2, effekt: "blitzschlag", trifft: "feinde" }] },
  wilder_blitz: { schritte: [{ baustein: "springen", anzahl: 10, reichweite: 9, effekt: "stich", trifft: "feinde", wahl: "zufaellig" }] },
  ohne_ziel_weiter: { schritte: [{ baustein: "schaden", menge: 3 }, { baustein: "fuer_jedes_ziel", muster: KREIS, effekt: "stich" }] },
  felder_merken: { schritte: [{ baustein: "auf_feld", muster: KREIS, effekt: "feld_merken" }] },
  feld_merken: { schritte: [{ baustein: "test_feld_merken" }] },
};

const gemerkteFelder = [];
bausteinAnmelden("test_feld_merken", {}, (spiel, kontext) => gemerkteFelder.push({ zielId: kontext.zielId, ...kontext.zielfeld }));

const spielBauen = () => miniSpiel(KARTE, { effekte: EFFEKTE });
const lp = (...entitaeten) => entitaeten.map((entitaet) => entitaet.werte.lp.aktuell);

test("fuer_jedes_ziel: Eigenbeschuss als Vorgabe, ohneUrheber und trifft schränken ein", () => {
  for (const [effektName, erwartet] of [["feuerball", [6, 6, 6]], ["feuerball_ohne_mich", [10, 6, 6]], ["feuerball_feinde", [10, 6, 10]]]) {
    const spiel = spielBauen();
    const ninkasi = wesen(spiel, 5, 3, "ninkasi");
    const feind = wesen(spiel, 4, 3, "verderber");
    const freundin = wesen(spiel, 6, 3, "ninkasi");
    effektAnwenden(spiel, effektName, { quelleId: ninkasi.id, zielId: null });
    assert.deepEqual(lp(ninkasi, feind, freundin), erwartet, effektName);
  }
});

test("Flächenwirkung trifft alle, bevor das erste Ziel stirbt", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 5, 3, "ninkasi", 100);
  const erster = wesen(spiel, 4, 3, "verderber", 4), zweiter = wesen(spiel, 6, 3, "verderber", 4);
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, "feuerball_feinde", { quelleId: ninkasi.id });
  assert.deepEqual(lp(erster, zweiter), [0, 0]);
  vorgangAbschliessen(spiel);
  assert.deepEqual([spiel.zustand.entitaeten[erster.id], spiel.zustand.entitaeten[zweiter.id]], [undefined, undefined]);
  assert.equal(meldungen.filter((meldung) => meldung.art === "tod").length, 2);
  assert.equal(meldungen.find((meldung) => meldung.art === "flaeche").felder.length, 9);
});

test("Lebensraub und verteilter Schaden über die Ablage", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 5, 3, "ninkasi", 100);
  ninkasi.werte.lp.aktuell = 50;
  const feinde = [wesen(spiel, 4, 3, "verderber"), wesen(spiel, 6, 3, "verderber"), wesen(spiel, 5, 2, "verderber")];
  effektAnwenden(spiel, "lebensraub", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(ninkasi.werte.lp.aktuell, 56, "50 % von 3 · 4 Schaden");
  effektAnwenden(spiel, "verteilt", { quelleId: ninkasi.id });
  assert.deepEqual(lp(...feinde), [2, 2, 2], "12 Schaden auf drei Ziele");
});

test("geschoss: trifft das erste Wesen, der Tod geht auf die Urheberin des Wurfs", () => {
  const spiel = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 1, 3);
  const davor = wesen(spiel, 4, 3, "verderber"), dahinter = wesen(spiel, 7, 3, "verderber");
  const flasche = entitaetErzeugen(spiel.zustand, { typ: "flasche", position: { x: 1, y: 3 } });
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, "wurf", { quelleId: flasche.id, urheberId: ninkasi.id, zielfeld: { x: 7, y: 3 }, mittel: { art: "gegenstand", name: "flasche" } });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[davor.id], undefined);
  assert.equal(dahinter.werte.lp.aktuell, 10);
  const tod = meldungen.find((meldung) => meldung.art === "tod");
  assert.deepEqual([tod.quelle.id, tod.mittel], [ninkasi.id, { art: "gegenstand", name: "flasche" }]);
  assert.deepEqual(meldungen.find((meldung) => meldung.art === "geschoss").aufschlag, { x: 4, y: 3 });
});

test("geschoss mit Explosion am Aufschlag", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 1, 3, "ninkasi");
  const ziel = wesen(spiel, 7, 3, "verderber"), nachbar = wesen(spiel, 8, 4, "verderber"), fern = wesen(spiel, 9, 3, "verderber");
  effektAnwenden(spiel, "sprengwurf", { quelleId: ninkasi.id, zielId: ziel.id });
  assert.deepEqual(lp(ninkasi, ziel, nachbar, fern), [10, 6, 6, 10]);
});

test("springen: Kettenblitz zum nächsten Ziel, mit Anzahl, Reichweite und Abschwächung je Sprung", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 1, 3, "ninkasi", 20);
  const [erstes, naechstes, drittes, ausserhalb] = [[3, 3], [4, 2], [5, 3], [7, 3]].map(([x, y]) => wesen(spiel, x, y, "verderber", 20));
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, "kettenblitz", { quelleId: ninkasi.id, zielId: erstes.id });
  assert.deepEqual(lp(ninkasi, erstes, naechstes, drittes, ausserhalb), [20, 10, 15, 17, 20], "10, dann 5, dann 3");
  assert.equal(meldungen.filter((meldung) => meldung.art === "geschoss").length, 2);
});

test("springen mit Zufall: jedes Ziel höchstens einmal, wiederholbar", () => {
  const ablauf = () => {
    const spiel = spielBauen();
    const ninkasi = wesen(spiel, 1, 1, "ninkasi");
    const feinde = [[3, 3], [5, 5], [8, 2], [9, 5]].map(([x, y]) => wesen(spiel, x, y, "verderber"));
    const meldungen = meldungenMitschneiden(spiel);
    effektAnwenden(spiel, "wilder_blitz", { quelleId: ninkasi.id, zielId: feinde[0].id });
    return { lp: lp(...feinde), reihenfolge: meldungen.filter((meldung) => meldung.art === "schaden").map((meldung) => meldung.ziel.id) };
  };
  const erster = ablauf();
  assert.deepEqual(erster.lp, [6, 6, 6, 6]);
  assert.equal(new Set(erster.reihenfolge).size, 4);
  assert.deepEqual(ablauf(), erster);
});

test("Ein Schritt ohne Ziel wird übersprungen, der Effekt läuft weiter; auf_feld trifft auch leere Felder", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 5, 3, "ninkasi");
  const feind = wesen(spiel, 4, 3, "verderber");
  effektAnwenden(spiel, "ohne_ziel_weiter", { quelleId: ninkasi.id, zielId: null });
  assert.deepEqual(lp(ninkasi, feind), [6, 6]);
  gemerkteFelder.length = 0;
  effektAnwenden(spiel, "felder_merken", { quelleId: ninkasi.id, zielId: null, ursprung: { x: 2, y: 2 } });
  assert.equal(gemerkteFelder.length, 9);
  assert.ok(gemerkteFelder.every((feld) => feld.zielId === null));
  assert.deepEqual(gemerkteFelder[0], { zielId: null, x: 2, y: 2 });
});

test("Auslöser mit Ziel feld: Sporen um die letzte Position treffen die Feinde des Opfers", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 4, 3, "ninkasi");
  const sporenbakterium = wesen(spiel, 5, 3, "verderber", 1, { ausloeser: [{ bei: "nach_tod", ziel: "feld", effekt: "feuerball_feinde" }] });
  const artgenosse = wesen(spiel, 6, 3, "verderber");
  effektAnwenden(spiel, "vernichten", { quelleId: ninkasi.id, zielId: sporenbakterium.id });
  vorgangAbschliessen(spiel);
  assert.deepEqual(lp(ninkasi, artgenosse), [6, 10]);
});

test("Nahkampf mit Muster: Rundumschlag trifft alle angrenzenden Wesen, Speer zwei Felder in Linie", () => {
  const spiel = spielBauen();
  const ninkasi = wesen(spiel, 5, 3, "ninkasi", 10, { angriff: { trefferchance: 100, effekt: "stich", muster: { art: "angrenzend" } } });
  const [osten, norden, sueden] = [[6, 3], [5, 2], [5, 4]].map(([x, y]) => wesen(spiel, x, y, "verderber"));
  const freundin = wesen(spiel, 4, 3, "ninkasi");
  const fern = wesen(spiel, 7, 3, "verderber");
  nahkampf(spiel, ninkasi, osten);
  assert.deepEqual(lp(ninkasi, osten, norden, sueden, freundin, fern), [10, 6, 6, 6, 6, 10]);
  ninkasi.angriff.muster = { art: "linie", laenge: 2 };
  nahkampf(spiel, ninkasi, osten);
  assert.deepEqual(lp(osten, fern, norden), [2, 6, 6]);
});
