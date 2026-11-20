// Zielmodus: Vorschau mit Trefferchance (systeme/vorschau.js), Tastenlogik (eingabe/zielmodus.js),
// Fähigkeitenfenster und Werfen aus dem Inventar, Animation der Geschossbahn (anzeige/animation.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, spielerinSetzen, wesen, allesSichtbar, gegenstandTragen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { trefferchanceVorschau, zielvorschau } from "../src/systeme/vorschau.js";
import { zielmodusBeginnen, zielmodusTaste, zielmodusBestaetigen, zielangabeVon, zieleInSicht, cursorSetzen } from "../src/eingabe/zielmodus.js";
import { faehigkeitenTaste } from "../src/eingabe/faehigkeiten.js";
import { inventarTaste } from "../src/eingabe/inventar.js";
import { neueAnimation, geschossEinreihen, laeuftAnimation, aktuellesGeschoss, animationWeiter, animationLeeren } from "../src/anzeige/animation.js";
import belegung from "../src/eingabe/belegung.js";

const KARTE = [
  "############",
  "#..........#",
  "#..........#",
  "#..........#",
  "#..........#",
  "############",
];

const EFFEKTE = {
  treffer: { schritte: [{ baustein: "schaden", art: "magie", menge: 3 }] },
  zielwurf: { schritte: [{ baustein: "trefferwurf", genauigkeit: 70, effekt: "treffer" }] },
  verschachtelt: { schritte: [{ baustein: "fuer_jedes_ziel", muster: { art: "kreis", radius: 1 }, effekt: "zielwurf" }] },
  zerspringt: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 2 }] },
};

const FAEHIGKEITEN = {
  flaeche: { text: "f.flaeche", verbrauch: { mp: 10 }, abklingzeit: 2, ziel: { art: "feld", reichweite: 6, muster: { art: "kreis", radius: 1 }, trifft: "wesen", ohneUrheber: true }, wirkung: "zielwurf" },
  heilung: { text: "f.heilung", ziel: { art: "selbst" }, wirkung: "treffer" },
  blick: { text: "f.blick", ziel: { art: "wesen", reichweite: 8 }, wirkung: "treffer" },
  stoss: { text: "f.stoss", ziel: { art: "richtung" }, wirkung: "treffer" },
};

function aufstellen() {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100 } });
  ninkasi.faehigkeiten = Object.keys(FAEHIGKEITEN);
  ninkasi.inventar = [];
  // Ausweichen 30 gegen Genauigkeit 70 bei Grundverteidigung 0 (tests/hilfen.js): 70 %
  const nah = wesen(spiel, 5, 2, "feinde", 20, { kampfwerte: { ausweichen: 30 } });
  const daneben = wesen(spiel, 6, 2, "feinde", 20);
  const fern = wesen(spiel, 10, 4, "feinde", 20);
  allesSichtbar(spiel);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, nah, daneben, fern };
}

test("Vorschau: Trefferchance aus dem ersten Trefferwurf, sicher ohne, offen bei verschachteltem", () => {
  const { spiel, ninkasi, nah, daneben } = aufstellen();
  assert.deepEqual(trefferchanceVorschau(spiel, ninkasi, nah, "zielwurf"), { prozent: 70 });
  assert.deepEqual(trefferchanceVorschau(spiel, ninkasi, daneben, "zielwurf"), { prozent: 100 });
  assert.deepEqual(trefferchanceVorschau(spiel, ninkasi, nah, "treffer"), { sicher: true });
  assert.equal(trefferchanceVorschau(spiel, ninkasi, nah, "verschachtelt"), null);
  // ein ahnungsloses Ziel trifft sicher als Hinterhalt
  nah.ki = { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null };
  assert.deepEqual(trefferchanceVorschau(spiel, ninkasi, nah, "zielwurf"), { prozent: 100, hinterhalt: true });
});

test("Vorschau einer Fläche: Felder, Betroffene mit Chance, Ninkasi verschont; zu weit nennt den Grund", () => {
  const { spiel, ninkasi, nah, daneben } = aufstellen();
  const vorschau = zielvorschau(spiel, ninkasi, { zweck: "faehigkeit", faehigkeit: "flaeche" }, { x: 5, y: 2 });
  assert.equal(vorschau.ok, true);
  assert.equal(vorschau.aufloesung.felder.length, 9);
  assert.deepEqual(vorschau.betroffene, [{ id: nah.id, chance: { prozent: 70 } }, { id: daneben.id, chance: { prozent: 100 } }]);
  assert.deepEqual(vorschau.befehl, { art: "faehigkeit", faehigkeit: "flaeche", ziel: { x: 5, y: 2 } });
  const zuWeit = zielvorschau(spiel, ninkasi, { zweck: "faehigkeit", faehigkeit: "flaeche" }, { x: 10, y: 4 });
  assert.equal(zuWeit.ok, false);
  assert.equal(zuWeit.grund, "zu_weit");
  // die Vorschau ändert nichts und würfelt nicht
  assert.equal(ninkasi.werte.mp.aktuell, 100);
});

test("Vorschau eines Wurfs: das erste Wesen der Bahn mit Effekt, ohne Effekt trifft der Wurf niemanden", () => {
  const { spiel, ninkasi, nah } = aufstellen();
  const flasche = gegenstandTragen(spiel, ninkasi, { typ: "flasche", wurf: { effekt: "zerspringt" } });
  const stein = gegenstandTragen(spiel, ninkasi, { typ: "stein" });
  const mitEffekt = zielvorschau(spiel, ninkasi, { zweck: "werfen", gegenstandId: flasche.id }, { x: 6, y: 2 });
  assert.equal(mitEffekt.ok, true);
  assert.deepEqual(mitEffekt.aufloesung.bahn.aufschlag, { x: 5, y: 2 }, "die Bahn endet am ersten Wesen");
  assert.deepEqual(mitEffekt.betroffene, [{ id: nah.id, chance: { sicher: true } }]);
  const ohneEffekt = zielvorschau(spiel, ninkasi, { zweck: "werfen", gegenstandId: stein.id }, { x: 6, y: 2 });
  assert.equal(ohneEffekt.ok, true);
  assert.deepEqual(ohneEffekt.betroffene, []);
});

test("Zielmodus beginnt am nächsten Feind, Tab wechselt reihum, Bewegungstasten schieben den Cursor", () => {
  const { spiel, nah, daneben, fern } = aufstellen();
  assert.deepEqual(zieleInSicht(spiel).map((entitaet) => entitaet.id), [nah.id, daneben.id, fern.id]);
  let { modus } = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "flaeche" });
  assert.deepEqual(modus.cursor, nah.position);
  modus = zielmodusTaste(spiel, modus, "Tab", belegung).modus;
  assert.deepEqual(modus.cursor, daneben.position);
  modus = zielmodusTaste(spiel, modus, "Tab", belegung).modus;
  modus = zielmodusTaste(spiel, modus, "Tab", belegung).modus;
  assert.deepEqual(modus.cursor, nah.position, "nach dem letzten wieder das erste");
  modus = zielmodusTaste(spiel, modus, "Numpad3", belegung).modus;
  assert.deepEqual(modus.cursor, { x: 6, y: 3 });
  // außerhalb der Karte bleibt der Cursor stehen
  assert.deepEqual(cursorSetzen(spiel, modus, { x: -1, y: 0 }).cursor, { x: 6, y: 3 });
  assert.equal(zielmodusTaste(spiel, modus, "Escape", belegung).modus, null);
});

test("Zielmodus: Enter gibt den Befehl nur ohne Grund dagegen, der Befehl wirkt wie angezeigt", () => {
  const { spiel, ninkasi, fern } = aufstellen();
  let { modus } = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "flaeche" });
  const zuWeit = zielmodusBestaetigen(spiel, cursorSetzen(spiel, modus, fern.position));
  assert.equal(zuWeit.grund, "zu_weit");
  assert.ok(zuWeit.modus, "bei einem Grund bleibt der Zielmodus offen");
  const ergebnis = zielmodusTaste(spiel, modus, "Enter", belegung);
  assert.equal(ergebnis.modus, null);
  assert.equal(befehlGeben(spiel, ergebnis.befehl).ok, true);
  assert.equal(ninkasi.werte.mp.aktuell, 90);
  // abklingend: der Zielmodus beginnt gar nicht erst
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "flaeche" }), { grund: "abklingend" });
});

test("Zielmodus: ohne Ziel sofort ein Befehl, Zielangabe nach Zielart", () => {
  const { spiel, nah } = aufstellen();
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "heilung" }), { befehl: { art: "faehigkeit", faehigkeit: "heilung" } });
  const blick = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "blick" }).modus;
  assert.deepEqual(zielangabeVon(spiel, blick), { id: nah.id });
  assert.deepEqual(zielangabeVon(spiel, cursorSetzen(spiel, blick, { x: 3, y: 1 })), { id: null });
  const stoss = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit: "stoss" }).modus;
  assert.deepEqual(zielangabeVon(spiel, stoss), { dx: 1, dy: 0 });
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "werfen", gegenstandId: 999 }), { grund: "nichts_zu_werfen" });
});

test("Fähigkeitenfenster und Werfen aus dem Inventar führen zur Auswahl für den Zielmodus", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.deepEqual(faehigkeitenTaste({}, "KeyA", spiel), { fenster: null, auswahl: { zweck: "faehigkeit", faehigkeit: "flaeche" } });
  assert.deepEqual(faehigkeitenTaste({}, "KeyZ", spiel), { fenster: {} }, "keine Fähigkeit an dieser Stelle");
  assert.deepEqual(faehigkeitenTaste({}, "Escape", spiel), { fenster: null });
  const flasche = gegenstandTragen(spiel, ninkasi, { typ: "flasche", wurf: { effekt: "zerspringt" } });
  assert.deepEqual(inventarTaste({ gewaehlt: flasche.id }, "KeyW", spiel), { fenster: null, auswahl: { zweck: "werfen", gegenstandId: flasche.id } });
});

test("Animation: Bahnen nacheinander Feld für Feld, Leeren überspringt alles", () => {
  const animation = neueAnimation();
  geschossEinreihen(animation, []);
  assert.equal(laeuftAnimation(animation), false, "eine ungesehene Bahn zeigt nichts");
  geschossEinreihen(animation, [{ x: 1, y: 1 }, { x: 2, y: 1 }]);
  geschossEinreihen(animation, [{ x: 5, y: 5 }]);
  assert.deepEqual(aktuellesGeschoss(animation), { x: 1, y: 1 });
  assert.equal(animationWeiter(animation), true);
  assert.deepEqual(aktuellesGeschoss(animation), { x: 2, y: 1 });
  assert.equal(animationWeiter(animation), true);
  assert.deepEqual(aktuellesGeschoss(animation), { x: 5, y: 5 });
  assert.equal(animationWeiter(animation), false);
  assert.equal(aktuellesGeschoss(animation), null);
  geschossEinreihen(animation, [{ x: 1, y: 1 }]);
  animationLeeren(animation);
  assert.equal(laeuftAnimation(animation), false);
});
