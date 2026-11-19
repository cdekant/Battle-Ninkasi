// Leistung: räumlicher Index, Umkreissuche, Warteschlange als Heap, Obergrenze der Population
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { effektAnwenden, wertAendern } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { entitaetenAuf, entitaetEntfernen, entitaetenImUmkreis, positionSetzen, alleEntitaeten, neuerZustand } from "../src/kern/zustand.js";
import { indexPruefen, idsImUmkreis, indexVerwerfen } from "../src/kern/raumindex.js";
import { einreihen, ersterEintragEntnehmen, akteurEntfernen, akteurEinreihen, warteschlangeGueltig } from "../src/kern/zeit.js";
import { zufallErzeugen, zufallsGanzzahl } from "../src/kern/zufall.js";
import { vorbereiten } from "../src/kern/daten.js";

const RAUM = [
  "############",
  "#..........#",
  "#..........#",
  "#..........#",
  "############",
];

test("Der Index folgt Erzeugen, Bewegen, Aufheben, Werfen, Tod mit Hinterlassenschaft und Entfernen", () => {
  const spiel = miniSpiel(RAUM, { effekte: { toedlich: { schritte: [{ baustein: "schaden", menge: 100 }] } } });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  const traegerin = wesen(spiel, 5, 2, "feinde", 5, { inventar: [] });
  const beute = gegenstandTragen(spiel, traegerin, { typ: "stein", text: "g.stein" });
  const liegend = wesen(spiel, 3, 3, "feinde");
  const pruefen = (wann) => assert.deepEqual(indexPruefen(spiel.zustand), [], wann);
  pruefen("nach dem Erzeugen");
  assert.deepEqual(entitaetenAuf(spiel.zustand, 5, 2).map((entitaet) => entitaet.id), [traegerin.id]);

  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  pruefen("nach dem Schritt");
  effektAnwenden(spiel, "toedlich", { quelleId: ninkasi.id, zielId: traegerin.id });
  vorgangAbschliessen(spiel);
  pruefen("nach dem Tod");
  assert.deepEqual(entitaetenAuf(spiel.zustand, 5, 2).map((entitaet) => entitaet.id), [beute.id], "fallen gelassen");

  positionSetzen(spiel.zustand, ninkasi, { x: 5, y: 2 });
  assert.equal(befehlGeben(spiel, { art: "aufheben" }).ok, true);
  pruefen("nach dem Aufheben");
  allesSichtbar(spiel);
  assert.deepEqual(befehlGeben(spiel, { art: "werfen", gegenstandId: beute.id, ziel: { x: 8, y: 2 } }), { ok: true });
  pruefen("nach dem Wurf");
  assert.deepEqual(entitaetenAuf(spiel.zustand, 8, 2).map((entitaet) => entitaet.id), [beute.id]);
  entitaetEntfernen(spiel.zustand, liegend.id);
  pruefen("nach dem Entfernen");
});

test("Umkreissuche: dasselbe wie die Suche über alle Entitäten, auch an Zellgrenzen und mit großem Radius", () => {
  const zufall = zufallErzeugen(3);
  const spiel = miniSpiel(["#".repeat(60), ...Array.from({ length: 38 }, () => "#" + ".".repeat(58) + "#"), "#".repeat(60)]);
  for (let i = 0; i < 150; i++) wesen(spiel, zufallsGanzzahl(zufall, 1, 58), zufallsGanzzahl(zufall, 1, 38));
  for (let i = 0; i < 60; i++) {
    const mitte = { x: zufallsGanzzahl(zufall, -5, 64), y: zufallsGanzzahl(zufall, -5, 44) };
    const radius = zufallsGanzzahl(zufall, 0, 30);
    const erwartet = alleEntitaeten(spiel.zustand)
      .filter((entitaet) => Math.abs(entitaet.position.x - mitte.x) <= radius && Math.abs(entitaet.position.y - mitte.y) <= radius)
      .map((entitaet) => entitaet.id);
    assert.deepEqual(idsImUmkreis(spiel.zustand, mitte, radius), erwartet, `Mitte ${mitte.x},${mitte.y}, Radius ${radius}`);
  }
  assert.equal(entitaetenImUmkreis(spiel.zustand, { x: 30, y: 20 }, Infinity).length, 150);
});

test("Der Index gehört nicht in den Zustand und entsteht nach dem Nachspielen neu", () => {
  const daten = datenLaden(rohdaten, { texte });
  const spiel = neuesSpiel(daten, 5);
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [1, 1], [0, -1]]) befehlGeben(spiel, { art: "bewegen", dx, dy });
  const nachgespielt = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
  assert.equal(JSON.stringify(nachgespielt.zustand), JSON.stringify(spiel.zustand));
  assert.deepEqual(indexPruefen(nachgespielt.zustand), []);
  assert.deepEqual(Object.keys(spiel.zustand).sort(), Object.keys(neuerZustand(1)).sort(), "keine neuen Felder im Zustand");
  indexVerwerfen(spiel.zustand);
  assert.deepEqual(indexPruefen(spiel.zustand), [], "verworfen und neu aufgebaut");
});

test("Heap: entnimmt in derselben Reihenfolge wie eine vollständige Sortierung, auch nach dem Entfernen", () => {
  const zufall = zufallErzeugen(11);
  const zustand = neuerZustand(1);
  const vergleich = [];
  const vergleichen = (erster, zweiter) => erster.zeit - zweiter.zeit || erster.einreihungsnummer - zweiter.einreihungsnummer;
  for (let runde = 0; runde < 400; runde++) {
    if (zufallsGanzzahl(zufall, 1, 3) < 3 || !zustand.warteschlange.length) {
      const eintrag = { zeit: zustand.zeit + zufallsGanzzahl(zufall, 0, 300), art: "ereignis", ereignistyp: "test", daten: {} };
      einreihen(zustand, eintrag);
      vergleich.push(eintrag);
    } else {
      vergleich.sort(vergleichen);
      assert.equal(ersterEintragEntnehmen(zustand), vergleich.shift());
    }
    assert.ok(warteschlangeGueltig(zustand));
  }
  for (const akteurId of [1, 2, 3]) einreihen(zustand, { zeit: zustand.zeit + 5, art: "akteur", akteurId });
  akteurEntfernen(zustand, 2);
  assert.ok(warteschlangeGueltig(zustand));
  assert.ok(!zustand.warteschlange.some((eintrag) => eintrag.akteurId === 2));
});

test("Obergrenze der Population: Beschwören endet dort mit ausdrücklichem Hinweis, die Datenprüfung warnt bei Ebenen", () => {
  const wesensdaten = { hefe: { text: "w.hefe", fraktion: "hefen", werte: { lp: { grundwert: 5 } } } };
  const spiel = miniSpiel(RAUM, { wesen: wesensdaten, effekte: { rufen: { schritte: [{ baustein: "beschwoeren", wesen: "hefe", anzahl: 5 }] } }, regeln: { population: { hoechstWesen: 4 } } });
  const meldungen = meldungenMitschneiden(spiel);
  const rufende = spielerinSetzen(spiel, 5, 2);
  wesen(spiel, 1, 1);
  effektAnwenden(spiel, "rufen", { quelleId: rufende.id, zielId: rufende.id });
  assert.equal(alleEntitaeten(spiel.zustand).filter((entitaet) => entitaet.typ === "hefe").length, 2);
  const hinweis = meldungen.find((meldung) => meldung.art === "population_voll");
  assert.deepEqual([hinweis.hoechstWesen, hinweis.ausgefallen], [4, 3]);

  const daten = structuredClone(rohdaten);
  daten.regeln.population.hoechstWesen = 10;
  assert.ok(vorbereiten(daten).fehler.some((meldung) => meldung.includes("regeln.population.hoechstWesen (10)")));
});

test("Tod nur für vorgemerkte: wer über wertAendern auf 0 fällt, stirbt nach dem Vorgang", () => {
  const spiel = miniSpiel(RAUM);
  const opfer = wesen(spiel, 2, 2, "feinde", 3);
  wertAendern(spiel, opfer, "lp", -3);
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[opfer.id], undefined);
});
