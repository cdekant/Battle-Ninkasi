import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel } from "./hilfen.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { wertAendern } from "../src/kern/effekte.js";
import { holen } from "../src/kern/register.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";
import "../src/systeme/tod.js";
import "../src/systeme/kampfzustand.js";
import { rateBeimPegel, optimalerPegel, wirksameRate, gewinnJeTreffer } from "../src/systeme/stoffwechsel.js";
import { rohdaten } from "../src/inhalt.js";
import { wertAufKurve, stelleDesHoechstwerts } from "../src/kern/kurven.js";

const welttick = (spiel, anzahl = 1) => {
  for (let i = 0; i < anzahl; i++) holen("welttick", "stoffwechsel")(spiel);
};

function spielMitTrinkerin({ pegel = 0, lp = 50, mp = 50, pp = 50, regeneration = {}, abbauHundertstel = 0, schwellen = [], imKampf, kampfgewinn } = {}) {
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
    stoffwechsel: { abbauHundertstel, schwellen, regeneration, imKampf, kampfgewinn },
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

test("Im Kampf ruhen die Raten nach imKampf, ein Modifikator hebt den Anteil, danach wirkt wieder die volle Rate", () => {
  const { spiel, trinkerin } = spielMitTrinkerin({ regeneration: { lp: [[0, 100]], mp: [[0, 100]], pp: [[0, -100]] }, imKampf: { lp: 0, pp: 0 } });
  spiel.daten.regeln.kampf = { ...spiel.daten.regeln.kampf, nachwirkung: 500 };
  trinkerin.kampfZuletzt = spiel.zustand.zeit;
  welttick(spiel);
  assert.deepEqual([trinkerin.werte.lp.aktuell, trinkerin.werte.mp.aktuell, trinkerin.werte.pp.aktuell], [50, 51, 50], "ohne Eintrag gilt die volle Rate");
  modifikatorHinzufuegen(trinkerin, { ziel: "imKampf.lp", art: "plus", betrag: 25, quelle: "rauschheilung" });
  assert.equal(wirksameRate(spiel, trinkerin, "lp"), 25);
  modifikatorHinzufuegen(trinkerin, { ziel: "imKampf.lp", art: "plus", betrag: 200, quelle: "zuviel" });
  assert.equal(wirksameRate(spiel, trinkerin, "lp"), 100, "höchstens die volle Rate");
  spiel.zustand.zeit += 500;
  assert.equal(wirksameRate(spiel, trinkerin, "pp"), -100, "nach der Nachwirkung gilt die Kurve");
});

function zweiImKampf({ pegel }) {
  const { spiel, trinkerin } = spielMitTrinkerin({ pegel, pp: 0, kampfgewinn: { pp: { jeTreffer: 200, kurve: [[50, 0], [150, 100], [400, 200]] } } });
  const gegner = entitaetErzeugen(spiel.zustand, { fraktion: "freunde", position: { x: 1, y: 1 }, werte: werteAusDaten({ lp: { grundwert: 10 } }) });
  return { spiel, trinkerin, gegner };
}

test("Kampfespegel: jeder Treffer bringt Gewinn nach der Kurve über dem Pegel, ausgeteilt wie erlitten", () => {
  const { spiel, trinkerin, gegner } = zweiImKampf({ pegel: 150 });
  hakenAusloesen(spiel, "nach_treffer", { quelleId: trinkerin.id, urheberId: trinkerin.id, zielId: gegner.id, tags: [] });
  hakenAusloesen(spiel, "nach_treffer", { quelleId: gegner.id, urheberId: gegner.id, zielId: trinkerin.id, tags: [] });
  assert.equal(trinkerin.werte.pp.aktuell, 4);
  hakenAusloesen(spiel, "nach_treffer", { quelleId: trinkerin.id, urheberId: trinkerin.id, zielId: trinkerin.id, tags: [] });
  assert.equal(trinkerin.werte.pp.aktuell, 4, "kein Gewinn aus Treffern an sich selbst");

  trinkerin.werte.pegel.aktuell = 40;
  assert.equal(gewinnJeTreffer(spiel, trinkerin, "pp"), 0, "unter 0,5 ‰ nichts");
  trinkerin.werte.pegel.aktuell = 400;
  assert.equal(gewinnJeTreffer(spiel, trinkerin, "pp"), 400);
  modifikatorHinzufuegen(trinkerin, { ziel: "kampfgewinn.pp", art: "prozent", betrag: 50, quelle: "ekstase" });
  assert.equal(gewinnJeTreffer(spiel, trinkerin, "pp"), 600);
});

test("Ninkasis Regeneration erfüllt die Norm in Weltticks bis zur vollen Leiste", () => {
  const ninkasi = rohdaten.wesen.ninkasi;
  const norm = rohdaten.regeln.normierung.regeneration;
  const ticksBisVoll = (wertName, pegel) => Math.ceil((ninkasi.werte[wertName].grundwert * 100) / wertAufKurve(ninkasi.stoffwechsel.regeneration[wertName], pegel));
  assert.equal(ticksBisVoll("lp", 0), norm.lp.nuechtern);
  assert.equal(ticksBisVoll("lp", stelleDesHoechstwerts(ninkasi.stoffwechsel.regeneration.lp)), norm.lp.optimum);
  assert.equal(ticksBisVoll("lp", norm.pegelRausch), norm.lp.rausch);
  assert.equal(ticksBisVoll("mp", 0), norm.mp.nuechtern);
});
