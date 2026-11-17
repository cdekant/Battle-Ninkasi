import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerin } from "./hilfen.js";
import { sichtbareFeinde, lage, pruefen } from "../src/systeme/gefahr.js";
import { index } from "../src/welt/karte.js";

const ALLE = ["gegner_in_sicht", "schaden"];

test("gegner_in_sicht nur bei einem neu sichtbaren Feind", () => {
  assert.equal(pruefen({ feinde: [2], lp: 50 }, { feinde: [2, 3], lp: 50 }, ALLE), "gegner_in_sicht");
  assert.equal(pruefen({ feinde: [2, 3], lp: 50 }, { feinde: [2], lp: 50 }, ALLE), null);
  assert.equal(pruefen({ feinde: [2], lp: 50 }, { feinde: [2], lp: 50 }, ALLE), null);
});

test("schaden nur bei verlorenen LP", () => {
  assert.equal(pruefen({ feinde: [], lp: 50 }, { feinde: [], lp: 49 }, ALLE), "schaden");
  assert.equal(pruefen({ feinde: [], lp: 50 }, { feinde: [], lp: 60 }, ALLE), null);
});

test("pruefen meldet die erste zutreffende Prüfung der Liste und überspringt unbekannte", () => {
  const vorher = { feinde: [], lp: 50 }, nachher = { feinde: [4], lp: 40 };
  assert.equal(pruefen(vorher, nachher, ["schaden", "gegner_in_sicht"]), "schaden");
  assert.equal(pruefen(vorher, nachher, ["gibt_es_nicht", "gegner_in_sicht"]), "gegner_in_sicht");
  assert.equal(pruefen(vorher, nachher, []), null);
});

test("sichtbareFeinde: nur sichtbare Wesen fremder Fraktion, IDs aufsteigend", () => {
  const spiel = miniSpiel(["#######", "#.....#", "#######"]);
  const e = spiel.zustand.ebene;
  const p = spielerin(spiel, 1, 1);
  const fern = wesen(spiel, 5, 1);
  const nah = wesen(spiel, 3, 1);
  wesen(spiel, 2, 1, "ninkasi");
  spiel.zustand.sichtbar = [1, 2, 3, 4].map((x) => index(e, x, 1));
  assert.deepEqual(sichtbareFeinde(spiel), [nah.id]);
  spiel.zustand.sichtbar.push(index(e, 5, 1));
  assert.deepEqual(sichtbareFeinde(spiel), [fern.id, nah.id]);
  assert.deepEqual(lage(spiel), { feinde: [fern.id, nah.id], lp: p.werte.lp.aktuell });
});
