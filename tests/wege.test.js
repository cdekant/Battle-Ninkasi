import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen } from "./hilfen.js";
import { weg, naechsterSchritt } from "../src/welt/wege.js";
import { passierbar, abstand, index } from "../src/welt/karte.js";

const KARTE = [
  "#########",
  "#.......#",
  "#.#####.#",
  "#.......#",
  "#########",
];

// Weg ist gültig: endet am Ziel, jeder Schritt ein Nachbarfeld und begehbar
function pruefeWeg(spiel, von, nach, w) {
  assert.ok(w && w.length > 0);
  assert.deepEqual(w.at(-1), nach);
  let vorher = von;
  for (const f of w) {
    assert.equal(abstand(vorher, f), 1);
    assert.ok(passierbar(spiel, f.x, f.y));
    vorher = f;
  }
}

test("von = nach ergibt leeren Weg", () => {
  assert.deepEqual(weg(miniSpiel(KARTE), { x: 1, y: 1 }, { x: 1, y: 1 }), []);
});

test("Weg ohne Startfeld, mit acht Richtungen so kurz wie der Schachbrett-Abstand", () => {
  const spiel = miniSpiel(["#######", "#.....#", "#.....#", "#.....#", "#######"]);
  const von = { x: 1, y: 1 }, nach = { x: 5, y: 3 };
  const w = weg(spiel, von, nach);
  pruefeWeg(spiel, von, nach, w);
  assert.equal(w.length, abstand(von, nach));
});

test("Weg führt um Wände herum", () => {
  const spiel = miniSpiel(KARTE);
  const von = { x: 4, y: 1 }, nach = { x: 4, y: 3 };
  const w = weg(spiel, von, nach);
  pruefeWeg(spiel, von, nach, w);
  assert.equal(w.length, 6);
});

test("Ziel in der Wand oder unerreichbar ergibt null", () => {
  const spiel = miniSpiel(["#####", "#.#.#", "#####"]);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 2, y: 1 }), null);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), null);
});

test("nurErkundet: unerkundete Felder sperren den Weg", () => {
  const spiel = miniSpiel(["#####", "#...#", "#####"]);
  const e = spiel.zustand.ebene;
  e.erkundet[index(e, 2, 1)] = 0;
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { nurErkundet: true }), null);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }).length, 2);
});

test("wesenMeiden: Wesen sperren den Weg, außer auf dem Ziel", () => {
  const spiel = miniSpiel(["######", "#....#", "######"]);
  wesen(spiel, 2, 1);
  wesen(spiel, 4, 1);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 4, y: 1 }, { wesenMeiden: true }), null);
  assert.deepEqual(weg(spiel, { x: 3, y: 1 }, { x: 4, y: 1 }, { wesenMeiden: true }), [{ x: 4, y: 1 }]);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 4, y: 1 }).length, 3);
});

test("naechsterSchritt ist das erste Feld des Weges, sonst null", () => {
  const spiel = miniSpiel(KARTE);
  assert.deepEqual(naechsterSchritt(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), { x: 2, y: 1 });
  assert.equal(naechsterSchritt(spiel, { x: 1, y: 1 }, { x: 1, y: 1 }), null);
  assert.equal(naechsterSchritt(spiel, { x: 1, y: 1 }, { x: 0, y: 0 }), null);
});
