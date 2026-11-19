// Abläufe der Eingabe aus Einzelbefehlen: Rasten und Auto-Erkunden (die Reise prüft der Bot)
import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { feldIndex, passierbar } from "../src/welt/karte.js";
import { naechstesFeldMit, amRandDesErkundeten } from "../src/welt/wege.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { rastenBeginnen, naechsterRastschritt } from "../src/eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "../src/eingabe/erkunden.js";
import vorgaben from "../src/eingabe/einstellungen.js";

const HOEHLE = [
  "############",
  "#....#.....#",
  "#.##.#.###.#",
  "#.#..#...#.#",
  "#.#.####.#.#",
  "#..........#",
  "############",
];

function ninkasiIn(karte, x, y, { allesErkundet = true } = {}) {
  const spiel = miniSpiel(karte);
  const ninkasi = spielerinSetzen(spiel, x, y);
  ninkasi.sicht = { reichweite: 2 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  if (!allesErkundet) spiel.zustand.ebene.erkundet.fill(0);
  sichtfeldAktualisieren(spiel);
  return { spiel, ninkasi };
}

// Führt einen Ablauf bis zum Halt aus; gibt den Haltegrund und die Zahl der Schritte zurück
function bisZumHalt(spiel, ablauf, naechsterSchritt, einstellungen = vorgaben) {
  for (let schritt = 0; schritt < 500; schritt++) {
    const ergebnis = naechsterSchritt(spiel, ablauf, einstellungen);
    if (ergebnis.halt) return { halt: ergebnis.halt, schritte: schritt };
    assert.equal(befehlGeben(spiel, ergebnis.befehl).ok, true);
  }
  throw new Error("Ablauf hält nicht an");
}

test("naechstesFeldMit: Breitensuche über begehbare Felder, ohne den Start", () => {
  const spiel = miniSpiel(HOEHLE);
  assert.deepEqual(naechstesFeldMit(spiel, { x: 1, y: 1 }, (x, y) => x === 4 && y === 3), { x: 4, y: 3 });
  assert.equal(naechstesFeldMit(spiel, { x: 1, y: 1 }, () => false), null);
  spiel.zustand.ebene.erkundet[feldIndex(spiel.zustand.ebene, 4, 1)] = 0;
  assert.equal(amRandDesErkundeten(spiel, 3, 1), true);
  assert.equal(amRandDesErkundeten(spiel, 1, 4), false);
});

test("Auto-Erkunden läuft, bis alle erreichbaren Felder erkundet sind", () => {
  const { spiel } = ninkasiIn(HOEHLE, 1, 1, { allesErkundet: false });
  const beginn = erkundenBeginnen(spiel, vorgaben);
  assert.ok(beginn.ablauf);
  const { halt, schritte } = bisZumHalt(spiel, beginn.ablauf, naechsterErkundungsschritt);
  assert.equal(halt, "alles_erkundet");
  assert.ok(schritte > 5);
  const ebene = spiel.zustand.ebene;
  for (let y = 0; y < ebene.hoehe; y++) {
    for (let x = 0; x < ebene.breite; x++) if (passierbar(spiel, x, y)) assert.equal(ebene.erkundet[feldIndex(ebene, x, y)], 1, `Feld ${x},${y}`);
  }
  assert.equal(erkundenBeginnen(spiel, vorgaben).grund, "alles_erkundet");
});

test("Auto-Erkunden beginnt nicht mit Feinden in Sicht", () => {
  const { spiel } = ninkasiIn(HOEHLE, 1, 1, { allesErkundet: false });
  wesen(spiel, 2, 1, "verderber", 10);
  assert.equal(erkundenBeginnen(spiel, vorgaben).grund, "feinde_in_sicht");
});

test("Rasten: wartet bis voll, hält nach höchstens so vielen Schritten, beginnt nicht, wenn schon voll", () => {
  const { spiel, ninkasi } = ninkasiIn(HOEHLE, 1, 1);
  assert.equal(rastenBeginnen(spiel, vorgaben).grund, "schon_voll");
  ninkasi.werte.lp.aktuell = 50;
  const kurz = { ...vorgaben, rastenHoechstens: 3 };
  const { halt, schritte } = bisZumHalt(spiel, rastenBeginnen(spiel, kurz).ablauf, naechsterRastschritt, kurz);
  assert.deepEqual([halt, schritte], ["zu_lang", 3]);
  const ablauf = rastenBeginnen(spiel, vorgaben).ablauf;
  befehlGeben(spiel, naechsterRastschritt(spiel, ablauf, vorgaben).befehl);
  ninkasi.werte.lp.aktuell = 100;
  assert.equal(naechsterRastschritt(spiel, ablauf, vorgaben).halt, "voll");
});

test("Rasten hält, wenn ein Feind auftaucht", () => {
  const { spiel, ninkasi } = ninkasiIn(HOEHLE, 1, 1);
  ninkasi.werte.lp.aktuell = 50;
  const ablauf = rastenBeginnen(spiel, vorgaben).ablauf;
  befehlGeben(spiel, naechsterRastschritt(spiel, ablauf, vorgaben).befehl);
  wesen(spiel, 2, 1, "verderber", 10);
  sichtfeldAktualisieren(spiel);
  assert.equal(naechsterRastschritt(spiel, ablauf, vorgaben).halt, "gegner_in_sicht");
});
