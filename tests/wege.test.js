import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen } from "./hilfen.js";
import { weg, naechstesWegfeld } from "../src/welt/wege.js";
import { passierbar, abstand, feldIndex } from "../src/welt/karte.js";

const KARTE_MIT_MITTELWAND = [
  "#########",
  "#.......#",
  "#.#####.#",
  "#.......#",
  "#########",
];

// Weg ist gültig: endet am Ziel, jeder Schritt ein Nachbarfeld und begehbar
function wegPruefen(spiel, start, ziel, wegfelder) {
  assert.ok(wegfelder && wegfelder.length > 0);
  assert.deepEqual(wegfelder.at(-1), ziel);
  let vorigesFeld = start;
  for (const feld of wegfelder) {
    assert.equal(abstand(vorigesFeld, feld), 1);
    assert.ok(passierbar(spiel, feld.x, feld.y));
    vorigesFeld = feld;
  }
}

test("start = ziel ergibt leeren Weg", () => {
  assert.deepEqual(weg(miniSpiel(KARTE_MIT_MITTELWAND), { x: 1, y: 1 }, { x: 1, y: 1 }), []);
});

test("Weg ohne Startfeld, mit acht Richtungen so kurz wie der Schachbrett-Abstand", () => {
  const spiel = miniSpiel(["#######", "#.....#", "#.....#", "#.....#", "#######"]);
  const start = { x: 1, y: 1 }, ziel = { x: 5, y: 3 };
  const wegfelder = weg(spiel, start, ziel);
  wegPruefen(spiel, start, ziel, wegfelder);
  assert.equal(wegfelder.length, abstand(start, ziel));
});

test("Weg führt um Wände herum", () => {
  const spiel = miniSpiel(KARTE_MIT_MITTELWAND);
  const start = { x: 4, y: 1 }, ziel = { x: 4, y: 3 };
  const wegfelder = weg(spiel, start, ziel);
  wegPruefen(spiel, start, ziel, wegfelder);
  assert.equal(wegfelder.length, 6);
});

test("Ziel in der Wand oder unerreichbar ergibt null", () => {
  const spiel = miniSpiel(["#####", "#.#.#", "#####"]);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 2, y: 1 }), null);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), null);
});

test("nurBekannt: unbekannte Felder sperren den Weg", () => {
  const spiel = miniSpiel(["#####", "#...#", "#####"]);
  const ebene = spiel.zustand.ebene;
  ebene.erinnerung[feldIndex(ebene, 2, 1)] = null;
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { nurBekannt: true }), null);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }).length, 2);
});

test("nurBekannt: betretbar nach dem bekannten Gelände, nicht nach dem echten", () => {
  const spiel = miniSpiel(["#####", "#.#.#", "#.#.#", "#...#", "#####"]);
  const ebene = spiel.zustand.ebene;
  // die Wand bei 2,1 ist außer Sicht gefallen, Ninkasi erinnert sie noch: ihr Weg führt außen herum
  ebene.felder[1] = "#...#";
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { nurBekannt: true }).length, 4);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }).length, 2, "die KI kennt das echte Gelände");
  // umgekehrt: eine erinnerte Lücke, die inzwischen zu ist, verspricht einen kurzen Weg, bis Ninkasi hinsieht
  ebene.felder[1] = "#.#.#";
  ebene.erinnerung[feldIndex(ebene, 2, 1)] = ".";
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { nurBekannt: true }).length, 2);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }).length, 4);
});

test("wesenMeiden: Wesen sperren den Weg, außer auf dem Ziel", () => {
  const spiel = miniSpiel(["######", "#....#", "######"]);
  wesen(spiel, 2, 1);
  wesen(spiel, 4, 1);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 4, y: 1 }, { wesenMeiden: true }), null);
  assert.deepEqual(weg(spiel, { x: 3, y: 1 }, { x: 4, y: 1 }, { wesenMeiden: true }), [{ x: 4, y: 1 }]);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 4, y: 1 }).length, 3);
});

test("naechstesWegfeld ist das erste Feld des Weges, sonst null", () => {
  const spiel = miniSpiel(KARTE_MIT_MITTELWAND);
  assert.deepEqual(naechstesWegfeld(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), { x: 2, y: 1 });
  assert.equal(naechstesWegfeld(spiel, { x: 1, y: 1 }, { x: 1, y: 1 }), null);
  assert.equal(naechstesWegfeld(spiel, { x: 1, y: 1 }, { x: 0, y: 0 }), null);
});
