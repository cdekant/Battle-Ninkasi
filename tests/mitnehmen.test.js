// Mitnehmen beim Ebenenwechsel (siehe docs/Welt.md, Ebenen): Register "mitnehmen", Verfolger neben Ninkasi kommen mit,
// samt Gepäck und Platz in der Warteschlange; wer nicht kann oder keinen Platz findet, bleibt zurück

import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { meldungenMitschneiden, wesen as wesenErzeugen } from "./hilfen.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { spielerin, alleEntitaeten, istWesen, entitaetErzeugen, entitaetenAuf } from "../src/kern/zustand.js";
import { anmelden, abmelden } from "../src/kern/register.js";
import { positionSetzen, indexPruefen } from "../src/kern/raumindex.js";
import { warteschlangeGueltig } from "../src/kern/zeit.js";
import { betretbar, abstand, passierbar } from "../src/welt/karte.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { ebeneWechseln, verfolgt } from "../src/systeme/ebenen.js";

const DATEN = datenLaden(rohdaten, { texte });
const ACHT = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const gegner = (spiel) => alleEntitaeten(spiel.zustand).filter((entitaet) => istWesen(entitaet) && entitaet.id !== spiel.zustand.spielerinId && entitaet.ki);
const hatAkteur = (zustand, id) => zustand.warteschlange.some((eintrag) => eintrag.art === "akteur" && eintrag.akteurId === id);

// Freie Felder rund um Ninkasi (für das Wesen betretbar, ohne anderes Wesen), im Abstand weite
function freieFelderUm(spiel, wesen, weite) {
  const { x, y } = spielerin(spiel.zustand).position;
  const felder = [];
  for (let dy = -weite; dy <= weite; dy++) {
    for (let dx = -weite; dx <= weite; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== weite) continue;
      const feld = { x: x + dx, y: y + dy };
      if (betretbar(spiel, wesen, feld) && !entitaetenAuf(spiel.zustand, feld.x, feld.y).some(istWesen)) felder.push(feld);
    }
  }
  return felder;
}

// Ein Gegner der Ebene als Jäger im Abstand weite neben Ninkasi
function jaegerStellen(spiel, nummer = 0, weite = 1) {
  const jaeger = gegner(spiel)[nummer];
  positionSetzen(spiel.zustand, jaeger, freieFelderUm(spiel, jaeger, weite)[0]);
  jaeger.ki.wachzustand = "jagt";
  return jaeger;
}

test("ein Jäger neben Ninkasi folgt ihr über die Treppe, mit Gepäck und Platz in der Warteschlange", () => {
  const spiel = neuesSpiel(DATEN, 3);
  const jaeger = jaegerStellen(spiel, 0, 1);
  const fern = jaegerStellen(spiel, 1, 2);
  const flasche = entitaetErzeugen(spiel.zustand, { typ: "testflasche", text: "x" });
  jaeger.inventar = [flasche.id];
  assert.equal(verfolgt(spiel, jaeger, spielerin(spiel.zustand)), true);
  assert.equal(verfolgt(spiel, fern, spielerin(spiel.zustand)), false, "zu weit weg");
  const meldungen = meldungenMitschneiden(spiel);
  ebeneWechseln(spiel, 0);
  const ninkasi = spielerin(spiel.zustand);
  assert.equal(spiel.zustand.ebene.name, "hub");
  assert.deepEqual(gegner(spiel).map((wesen) => wesen.id), [jaeger.id], "nur der Jäger daneben kam mit");
  assert.equal(abstand(jaeger.position, ninkasi.position), 1, "er steht neben ihr");
  assert.ok(spiel.zustand.entitaeten[flasche.id], "sein Gepäck kam mit");
  assert.ok(hatAkteur(spiel.zustand, jaeger.id), "sein Platz in der Warteschlange blieb");
  assert.deepEqual(jaeger.ki.letzteBekanntePosition, ninkasi.position);
  assert.ok(spiel.zustand.abgelegteEbenen[1].entitaeten[fern.id], "der ferne blieb auf der alten Ebene");
  assert.equal(meldungen.find((meldung) => meldung.art === "gefolgt").wer.id, jaeger.id);
  assert.ok(warteschlangeGueltig(spiel.zustand));
  assert.deepEqual(indexPruefen(spiel.zustand), []);
  // und wieder hinab: er bleibt ihr auf den Fersen
  ebeneWechseln(spiel, 1);
  assert.ok(spiel.zustand.entitaeten[jaeger.id]?.position);
  assert.equal(abstand(jaeger.position, spielerin(spiel.zustand).position), 1);
});

test("wer schläft, flieht, starr ist, sich nicht bewegen kann oder folgt: false trägt, bleibt zurück", () => {
  const spiel = neuesSpiel(DATEN, 3);
  spiel.daten = { ...DATEN, zustaende: { ...DATEN.zustaende, phantomtest_starre: { text: "z.test", dauer: 100000, handlungsunfaehig: true } } };
  const ninkasi = spielerin(spiel.zustand);
  const [schlaefer, fluechtender, starrer, festgewachsener, treuer] = [0, 1, 2, 3, 4].map((nummer) => jaegerStellen(spiel, nummer, 1));
  schlaefer.ki.wachzustand = "schlaeft";
  fluechtender.ki = { ...fluechtender.ki, modul: "fliehen" };
  zustandSetzen(spiel, starrer, "phantomtest_starre", {});
  festgewachsener.bewegung = "unbeweglich";
  treuer.folgt = false;
  for (const wesen of [schlaefer, fluechtender, starrer, festgewachsener, treuer]) assert.equal(verfolgt(spiel, wesen, ninkasi), false, `Wesen ${wesen.id}`);
  ebeneWechseln(spiel, 0);
  assert.deepEqual(gegner(spiel), []);
});

test("Ninkasis Beschworene neben ihr kommen mit, auch ohne zu jagen", () => {
  const spiel = neuesSpiel(DATEN, 3);
  const ninkasi = spielerin(spiel.zustand);
  const diener = jaegerStellen(spiel, 0, 1);
  diener.beschworenVon = ninkasi.id;
  diener.ki.wachzustand = "wach";
  ebeneWechseln(spiel, 0);
  assert.ok(spiel.zustand.entitaeten[diener.id]?.position);
});

test("ohne freies Feld bei der Ankunft bleibt der Verfolger an seinem Platz auf der alten Ebene", () => {
  const spiel = neuesSpiel(DATEN, 3);
  ebeneWechseln(spiel, 0);
  // den Hub bis auf Ninkasis Feld mit Wesen füllen
  const { breite, hoehe } = spiel.zustand.ebene;
  const ninkasi = spielerin(spiel.zustand);
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      if (passierbar(spiel, x, y) && !(x === ninkasi.position.x && y === ninkasi.position.y)) wesenErzeugen(spiel, x, y, "ninkasi", 5);
    }
  }
  ebeneWechseln(spiel, 1);
  const jaeger = jaegerStellen(spiel, 0, 1);
  const platz = { ...jaeger.position };
  ebeneWechseln(spiel, 0);
  const abgelegt = spiel.zustand.abgelegteEbenen[1];
  assert.equal(spiel.zustand.entitaeten[jaeger.id], undefined);
  assert.deepEqual(abgelegt.entitaeten[jaeger.id].position, platz);
  assert.ok(abgelegt.warteschlange.some((eintrag) => eintrag.art === "akteur" && eintrag.akteurId === jaeger.id), "sein Eintrag ruht mit der Ebene");
  assert.ok(warteschlangeGueltig(spiel.zustand));
  assert.deepEqual(indexPruefen(spiel.zustand), []);
  ebeneWechseln(spiel, 1);
  assert.deepEqual(spiel.zustand.entitaeten[jaeger.id].position, platz, "bei der Rückkehr steht er noch dort");
  assert.ok(hatAkteur(spiel.zustand, jaeger.id));
});

test("weitere Einträge im Register mitnehmen bestimmen mit, wer mitkommt", () => {
  const spiel = neuesSpiel(DATEN, 3);
  const freund = gegner(spiel)[0];
  const eintrag = () => [freund.id];
  anmelden("mitnehmen", "testfreund", eintrag);
  try {
    ebeneWechseln(spiel, 0);
    assert.ok(spiel.zustand.entitaeten[freund.id]?.position, "von weit her mitgekommen");
    assert.ok(abstand(freund.position, spielerin(spiel.zustand).position) <= 2);
  } finally {
    abmelden("mitnehmen", "testfreund", eintrag);
  }
});
