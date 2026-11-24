import { test } from "node:test";
import assert from "node:assert/strict";
import { promilleText, leistenanteil, TEILSTRICHE } from "../src/anzeige/pegelanzeige.js";

test("promilleText: deutsches Komma, eine oder zwei Nachkommastellen", () => {
  assert.equal(promilleText(0), "0,0 ‰");
  assert.equal(promilleText(50), "0,5 ‰");
  assert.equal(promilleText(25), "0,25 ‰");
  assert.equal(promilleText(100), "1,0 ‰");
  assert.equal(promilleText(235), "2,35 ‰");
  assert.equal(promilleText(1605), "16,05 ‰");
  assert.equal(promilleText(-50), "-0,5 ‰");
});

test("leistenanteil: Teilstriche gleich breit, dazwischen linear", () => {
  const abschnitte = TEILSTRICHE.length - 1;
  TEILSTRICHE.forEach((teilstrich, nummer) => assert.equal(leistenanteil(teilstrich), nummer / abschnitte));
  assert.equal(leistenanteil(100), 0.5 / abschnitte);
  assert.equal(leistenanteil(1200), 3.5 / abschnitte);
});

test("leistenanteil: unter 0 leer, über dem letzten Teilstrich voll", () => {
  assert.equal(leistenanteil(-10), 0);
  assert.equal(leistenanteil(99999), 1);
});
