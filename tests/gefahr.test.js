import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen } from "./hilfen.js";
import { wahrgenommeneFeinde, lageErfassen, gefahrPruefen } from "../src/systeme/gefahr.js";
import { feldIndex } from "../src/welt/karte.js";

const ALLE_PRUEFUNGEN = ["gegner_in_sicht", "schaden"];

test("gegner_in_sicht nur bei einem neu sichtbaren Feind", () => {
  assert.equal(gefahrPruefen({ feinde: [2], lp: 50 }, { feinde: [2, 3], lp: 50 }, ALLE_PRUEFUNGEN), "gegner_in_sicht");
  assert.equal(gefahrPruefen({ feinde: [2, 3], lp: 50 }, { feinde: [2], lp: 50 }, ALLE_PRUEFUNGEN), null);
  assert.equal(gefahrPruefen({ feinde: [2], lp: 50 }, { feinde: [2], lp: 50 }, ALLE_PRUEFUNGEN), null);
});

test("schaden nur bei verlorenen LP", () => {
  assert.equal(gefahrPruefen({ feinde: [], lp: 50 }, { feinde: [], lp: 49 }, ALLE_PRUEFUNGEN), "schaden");
  assert.equal(gefahrPruefen({ feinde: [], lp: 50 }, { feinde: [], lp: 60 }, ALLE_PRUEFUNGEN), null);
});

test("gefahrPruefen meldet die erste zutreffende Prüfung der Liste und überspringt unbekannte", () => {
  const lageVorher = { feinde: [], lp: 50 }, lageNachher = { feinde: [4], lp: 40 };
  assert.equal(gefahrPruefen(lageVorher, lageNachher, ["schaden", "gegner_in_sicht"]), "schaden");
  assert.equal(gefahrPruefen(lageVorher, lageNachher, ["gibt_es_nicht", "gegner_in_sicht"]), "gegner_in_sicht");
  assert.equal(gefahrPruefen(lageVorher, lageNachher, []), null);
});

test("wahrgenommeneFeinde: nur sichtbare Wesen fremder Fraktion, IDs aufsteigend", () => {
  const spiel = miniSpiel(["#######", "#.....#", "#######"]);
  const ebene = spiel.zustand.ebene;
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const fernerFeind = wesen(spiel, 5, 1);
  const naherFeind = wesen(spiel, 3, 1);
  wesen(spiel, 2, 1, "ninkasi");
  spiel.zustand.sichtbareFelder = [1, 2, 3, 4].map((x) => feldIndex(ebene, x, 1));
  assert.deepEqual(wahrgenommeneFeinde(spiel), [naherFeind.id]);
  spiel.zustand.sichtbareFelder.push(feldIndex(ebene, 5, 1));
  assert.deepEqual(wahrgenommeneFeinde(spiel), [fernerFeind.id, naherFeind.id]);
  assert.deepEqual(lageErfassen(spiel), { feinde: [fernerFeind.id, naherFeind.id], lp: ninkasi.werte.lp.aktuell });
});
