import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel } from "./hilfen.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { wertAendern } from "../src/kern/effekte.js";
import { holen } from "../src/kern/register.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import "../src/systeme/tod.js";
import { rateBeimPegel, optimalerPegel } from "../src/systeme/stoffwechsel.js";

const welttick = (spiel, anzahl = 1) => {
  for (let i = 0; i < anzahl; i++) holen("welttick", "stoffwechsel")(spiel);
};

function spielMitTrinkerin({ pegel = 0, lp = 50, mp = 50, pp = 50, regeneration = {}, abbauHundertstel = 0, schwellen = [] } = {}) {
  const spiel = { ...miniSpiel(["###", "#.#", "###"]), hoerer: [] };
  const trinkerin = entitaetErzeugen(spiel.zustand, {
    fraktion: "feinde",
    position: { x: 1, y: 1 },
    werte: werteAusDaten({
      lp: { grundwert: 100, anfangswert: lp },
      mp: { grundwert: 100, anfangswert: mp },
      pp: { grundwert: 100, anfangswert: pp },
      pegel: { anfangswert: pegel },
    }),
    stoffwechsel: { abbauHundertstel, schwellen, regeneration },
  });
  const meldungen = [];
  hoererAnmelden(spiel, (meldung) => meldungen.push(meldung));
  return { spiel, trinkerin, meldungen };
}

const LP_KURVE = [[0, 30], [150, 80], [400, 30]];

test("Regeneration folgt der Kurve am aktuellen Pegel", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel: 150, regeneration: { lp: LP_KURVE } });
  welttick(spiel, 5);
  assert.equal(trinkerin.werte.lp.aktuell, 54);
  const nuechtern = spielMitTrinkerin({ pegel: 0, regeneration: { lp: LP_KURVE } });
  welttick(nuechtern.spiel, 10);
  assert.equal(nuechtern.trinkerin.werte.lp.aktuell, 53);
});

test("Negative Kurvenwerte sind Schwund, nie unter 0", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel: 0, pp: 2, regeneration: { pp: [[0, -30], [50, 0]] } });
  welttick(spiel, 4);
  assert.equal(trinkerin.werte.pp.aktuell, 1);
  welttick(spiel, 20);
  assert.equal(trinkerin.werte.pp.aktuell, 0);
});

test("Modifikatoren: Regeneration, Schwund und Kurvenverschiebung wirken getrennt", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel: 150, regeneration: { lp: LP_KURVE, pp: [[0, -30], [50, 0]] } });
  trinkerin.werte.pegel.aktuell = 0;
  assert.equal(rateBeimPegel(spiel, trinkerin, "pp"), -30);
  modifikatorHinzufuegen(trinkerin, { ziel: "regeneration.pp", art: "prozent", betrag: 100, quelle: "falsch" });
  assert.equal(rateBeimPegel(spiel, trinkerin, "pp"), -30, "Bonus auf Regeneration verstärkt keinen Schwund");
  modifikatorHinzufuegen(trinkerin, { ziel: "schwund.pp", art: "prozent", betrag: -50, quelle: "geistesanker" });
  assert.equal(rateBeimPegel(spiel, trinkerin, "pp"), -15);

  trinkerin.werte.pegel.aktuell = 150;
  modifikatorHinzufuegen(trinkerin, { ziel: "regeneration.lp", art: "prozent", betrag: 50, quelle: "heilschlaf" });
  assert.equal(rateBeimPegel(spiel, trinkerin, "lp"), 120);
  modifikatorHinzufuegen(trinkerin, { ziel: "kurvenverschiebung.lp", art: "plus", betrag: 100, quelle: "trinkfestigkeit" });
  trinkerin.werte.pegel.aktuell = 250;
  assert.equal(rateBeimPegel(spiel, trinkerin, "lp"), 120);
  assert.equal(optimalerPegel(spiel, trinkerin, "lp"), 250);
});

test("Abbau des Pegels je Welttick, mit Modifikator, nie unter 0", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel: 10, abbauHundertstel: 100 });
  welttick(spiel);
  assert.equal(trinkerin.werte.pegel.aktuell, 9);
  modifikatorHinzufuegen(trinkerin, { ziel: "abbau.pegel", art: "prozent", betrag: 100, quelle: "trinkfestigkeit" });
  welttick(spiel);
  assert.equal(trinkerin.werte.pegel.aktuell, 7);
  welttick(spiel, 10);
  assert.equal(trinkerin.werte.pegel.aktuell, 0);
});

test("Raten gelten für den Pegel vor dem Abbau", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel: 1, abbauHundertstel: 100, regeneration: { mp: [[0, 0], [1, 100]] } });
  welttick(spiel);
  assert.equal(trinkerin.werte.mp.aktuell, 51);
  assert.equal(trinkerin.werte.pegel.aktuell, 0);
});

test("Schwellen und Nüchternheit werden in beide Richtungen gemeldet", () => {
  const { spiel, trinkerin, meldungen } = spielMitTrinkerin({ pegel: 101, abbauHundertstel: 100, schwellen: [100] });
  welttick(spiel);
  assert.deepEqual(meldungen.map((meldung) => meldung.art), []);
  welttick(spiel);
  assert.deepEqual(meldungen.map((meldung) => [meldung.art, meldung.schwelle]), [["pegel_sinkt", 100]]);
  wertAendern(spiel, trinkerin, "pegel", 50);
  assert.deepEqual(meldungen.at(-1).art, "pegel_steigt");
  trinkerin.werte.pegel.aktuell = 1;
  welttick(spiel);
  assert.equal(meldungen.at(-1).art, "nuechtern");
});

test("Schwund der LP tötet nach dem Vorgang, Ursache ist der Schwund", () => {
  const { spiel, trinkerin, meldungen } = spielMitTrinkerin({ lp: 1, regeneration: { lp: [[0, -100]] } });
  welttick(spiel);
  assert.equal(trinkerin.werte.lp.aktuell, 0);
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[trinkerin.id], undefined);
  assert.equal(meldungen.at(-1).art, "tod");
  assert.equal(meldungen.at(-1).ursache, "schwund.lp");
});
