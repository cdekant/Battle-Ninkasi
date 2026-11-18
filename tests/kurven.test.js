import { test } from "node:test";
import assert from "node:assert/strict";
import { wertAufKurve, stelleDesHoechstwerts, kurvenfehler } from "../src/kern/kurven.js";

const kurve = [[0, 30], [150, 80], [400, 30], [800, 0]];

test("wertAufKurve trifft die Stützpunkte genau", () => {
  assert.equal(wertAufKurve(kurve, 0), 30);
  assert.equal(wertAufKurve(kurve, 150), 80);
  assert.equal(wertAufKurve(kurve, 400), 30);
  assert.equal(wertAufKurve(kurve, 800), 0);
});

test("wertAufKurve verbindet linear und rundet", () => {
  assert.equal(wertAufKurve(kurve, 75), 55);
  assert.equal(wertAufKurve(kurve, 275), 55);
  assert.equal(wertAufKurve([[0, 0], [3, 1]], 1), 0);
  assert.equal(wertAufKurve([[0, 0], [3, 1]], 2), 1);
});

test("wertAufKurve bleibt vor dem ersten und hinter dem letzten Stützpunkt gleich", () => {
  assert.equal(wertAufKurve(kurve, -50), 30);
  assert.equal(wertAufKurve(kurve, 5000), 0);
  assert.equal(wertAufKurve([[100, 7]], 0), 7);
  assert.equal(wertAufKurve([[100, 7]], 900), 7);
});

test("wertAufKurve kann negativ werden und liefert nie -0", () => {
  const schwund = [[0, -30], [50, 0], [150, 0], [400, 100]];
  assert.equal(wertAufKurve(schwund, 0), -30);
  assert.equal(wertAufKurve(schwund, 25), -15);
  assert.ok(Object.is(wertAufKurve([[0, -1], [100, 0]], 99), 0));
  assert.equal(wertAufKurve(schwund, 100), 0);
  assert.equal(wertAufKurve(schwund, 275), 50);
});

test("stelleDesHoechstwerts findet das Optimum", () => {
  assert.equal(stelleDesHoechstwerts(kurve), 150);
  assert.equal(stelleDesHoechstwerts([[0, 5], [10, 5]]), 0);
});

test("kurvenfehler meldet leere Kurven, falsche Paare und fallende Stellen", () => {
  assert.deepEqual(kurvenfehler(kurve, "k"), []);
  assert.equal(kurvenfehler([], "k").length, 1);
  assert.equal(kurvenfehler([[0, 1.5]], "k").length, 1);
  assert.equal(kurvenfehler([[0, 1], [0, 2]], "k").length, 1);
  assert.equal(kurvenfehler([[10, 1], [5, 2]], "k").length, 1);
});
