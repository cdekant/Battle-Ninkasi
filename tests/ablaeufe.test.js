// Abläufe der Eingabe aus Einzelbefehlen: Rasten, Auto-Erkunden, Reise und Laufen (die Reise prüft auch der Bot)
import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { feldIndex, passierbar } from "../src/welt/karte.js";
import { naechstesFeldMit, amRandDesErkundeten } from "../src/welt/wege.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { positionSetzen } from "../src/kern/raumindex.js";
import { rastenBeginnen, naechsterRastschritt } from "../src/eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "../src/eingabe/erkunden.js";
import { reiseBeginnen, naechsterReiseschritt } from "../src/eingabe/reise.js";
import { laufenBeginnen, naechsterLaufschritt } from "../src/eingabe/laufen.js";
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

test("Auto-Erkunden meidet bekannte Fallen: nur dahinter Unerkundetes hält einmal mit gefahr_im_weg, trotzGefahr geht hinüber", () => {
  const GANG = ["############", "#..........#", "############"];
  const spiel = miniSpiel(GANG, { effekte: { kitzeln: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 0 }] } } });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.sicht = { reichweite: 2 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  spiel.zustand.ebene.erkundet.fill(0);
  const falle = entitaetErzeugen(spiel.zustand, { falle: { tarnung: 10, effekt: "kitzeln" }, entdeckt: true });
  positionSetzen(spiel.zustand, falle, { x: 4, y: 1 });
  sichtfeldAktualisieren(spiel);
  const meiden = (x, y) => x === 4 && y === 1;
  assert.equal(naechstesFeldMit(spiel, { x: 1, y: 1 }, (x) => x === 6, { meiden }), null, "mit meiden nicht über das Feld");
  assert.deepEqual(naechstesFeldMit(spiel, { x: 1, y: 1 }, (x) => x === 6), { x: 6, y: 1 });

  const beginn = erkundenBeginnen(spiel, vorgaben);
  const { halt } = beginn.ablauf ? bisZumHalt(spiel, beginn.ablauf, naechsterErkundungsschritt) : { halt: beginn.grund };
  assert.equal(halt, "gefahr_im_weg", "nicht kein_weg");
  assert.ok(ninkasi.position.x < 4, "vor der Falle stehen geblieben");
  assert.equal(erkundenBeginnen(spiel, vorgaben).grund, "gefahr_im_weg");

  const trotz = erkundenBeginnen(spiel, vorgaben, { trotzGefahr: true });
  assert.ok(trotz.ablauf);
  assert.equal(bisZumHalt(spiel, trotz.ablauf, naechsterErkundungsschritt).halt, "alles_erkundet");
  assert.ok(ninkasi.position.x > 4, "über die Falle hinweg");
});

test("Auto-Erkunden beginnt mit bekannten Feinden in Sicht, ohne reiseTrotzFeinden nicht", () => {
  const { spiel } = ninkasiIn(HOEHLE, 1, 1, { allesErkundet: false });
  wesen(spiel, 2, 1, "verderber", 10);
  sichtfeldAktualisieren(spiel);
  assert.ok(erkundenBeginnen(spiel, vorgaben).ablauf);
  assert.equal(erkundenBeginnen(spiel, { ...vorgaben, reiseTrotzFeinden: false }).grund, "feinde_in_sicht");
});

test("Reise hält nur bei neuen Feinden: ein bekannter hält nicht, wer aus der Sicht gerät und wiederkommt, schon", () => {
  const { spiel } = ninkasiIn(HOEHLE, 1, 1);
  const feind = wesen(spiel, 1, 3, "verderber", 10);
  sichtfeldAktualisieren(spiel);
  const reise = reiseBeginnen(spiel, { x: 4, y: 1 }, vorgaben).reise;
  assert.ok(reise, "beginnt trotz bekanntem Feind");
  reise.schrittzahl = 1; // wie nach dem ersten Schritt
  assert.ok(naechsterReiseschritt(spiel, reise, vorgaben).befehl, "bekannter Feind hält nicht");
  positionSetzen(spiel.zustand, feind, { x: 10, y: 5 });
  sichtfeldAktualisieren(spiel);
  assert.ok(naechsterReiseschritt(spiel, reise, vorgaben).befehl, "außer Sicht");
  positionSetzen(spiel.zustand, feind, { x: 1, y: 3 });
  sichtfeldAktualisieren(spiel);
  assert.equal(naechsterReiseschritt(spiel, reise, vorgaben).halt, "gegner_in_sicht", "wieder aufgetaucht");
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

const GANG = [
  "############",
  "#..........#",
  "#.......>..#",
  "############",
];

test("Laufen: geradeaus bis zum Hindernis, beginnt nicht vor einer Wand", () => {
  const { spiel, ninkasi } = ninkasiIn(GANG, 1, 1);
  assert.equal(laufenBeginnen(spiel, { dx: -1, dy: 0 }, vorgaben).grund, "versperrt");
  const { halt } = bisZumHalt(spiel, laufenBeginnen(spiel, { dx: 1, dy: 0 }, vorgaben).ablauf, naechsterLaufschritt);
  assert.equal(halt, "bemerkenswert", "die Treppe kommt in Reichweite");
  assert.deepEqual(ninkasi.position, { x: 7, y: 1 });
  const weiter = bisZumHalt(spiel, laufenBeginnen(spiel, { dx: 1, dy: 0 }, vorgaben).ablauf, naechsterLaufschritt);
  assert.equal(weiter.halt, "hindernis", "die schon bemerkte Treppe hält nicht noch einmal");
  assert.deepEqual(ninkasi.position, { x: 10, y: 1 });
});

test("Laufen hält bei einem neuen Feind, ein bekannter hält nicht", () => {
  const { spiel, ninkasi } = ninkasiIn(GANG, 1, 1);
  ninkasi.sicht = { reichweite: 20 };
  wesen(spiel, 4, 2, "verderber", 10);
  sichtfeldAktualisieren(spiel);
  const ablauf = laufenBeginnen(spiel, { dx: 1, dy: 0 }, vorgaben).ablauf;
  assert.ok(ablauf, "beginnt trotz bekanntem Feind");
  assert.ok(naechsterLaufschritt(spiel, ablauf, vorgaben).befehl);
  assert.equal(laufenBeginnen(spiel, { dx: 1, dy: 0 }, { ...vorgaben, reiseTrotzFeinden: false }).grund, "feinde_in_sicht");
});

test("Rasten beginnt mit bekanntem Feind in Sicht und hält erst bei einem neuen, ohne rastenTrotzFeinden gar nicht", () => {
  const { spiel, ninkasi } = ninkasiIn(HOEHLE, 1, 1);
  ninkasi.werte.lp.aktuell = 50;
  wesen(spiel, 2, 1, "verderber", 10);
  sichtfeldAktualisieren(spiel);
  const ablauf = rastenBeginnen(spiel, vorgaben).ablauf;
  assert.ok(ablauf);
  ablauf.schrittzahl = 1;
  assert.ok(naechsterRastschritt(spiel, ablauf, vorgaben).befehl, "der bekannte Feind hält nicht");
  assert.equal(rastenBeginnen(spiel, { ...vorgaben, rastenTrotzFeinden: false }).grund, "feinde_in_sicht");
});
