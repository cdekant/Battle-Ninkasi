// Handlungen der KI (siehe docs/Wesen.md, KI): Bewertung über Eingaben und Kurven, Wahlregeln, Grundhandlungen und
// Vorrangbefehle

import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, gegenstandTragen } from "./hilfen.js";
import { holen } from "../src/kern/register.js";
import { positionSetzen } from "../src/kern/zustand.js";
import { zufallErzeugen } from "../src/kern/zufall.js";
import { mitWurfquelle } from "../src/kern/wurf.js";
import { handlungWaehlen, wertung, VERFOLGEN } from "../src/ki/handlungen.js";
import { geltenderVorrang } from "../src/ki/vorrang.js";

const RAUM = [
  "###########",
  "#.........#",
  "#.........#",
  "#.........#",
  "###########",
];
const EFFEKTE = {
  spritzer: { schritte: [{ baustein: "schaden", art: "saeure", menge: 2 }] }, stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] },
  heilung: { schritte: [{ baustein: "heilen", menge: 5 }] },
};
const FAEHIGKEITEN = {
  spucke: { text: "f.spucke", zweck: ["angriff"], ziel: { art: "geschoss", reichweite: 6, trifft: "wesen" }, wirkung: "spritzer" },
  heilspruch: { text: "f.heilspruch", zweck: ["heilen"], ziel: { art: "wesen", reichweite: 6, trifft: "verbuendete" }, wirkung: "heilung" },
  selbstheilung: { text: "f.selbstheilung", zweck: ["heilen"], ziel: { art: "selbst" }, wirkung: "heilung" },
};
const ANGRIFFE = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  Object.assign(ninkasi, { angriffe: ANGRIFFE, sicht: { reichweite: 9 } });
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

function jaeger(spiel, x, y, kiZusatz = {}, lp = 10) {
  const ki = { modul: "jagen", letzteBekanntePosition: null, ...kiZusatz };
  return wesen(spiel, x, y, "verderber", lp, { ki, sicht: { reichweite: 9 }, angriffe: ANGRIFFE, faehigkeiten: ["spucke"] });
}

const entscheiden = (spiel, wesenMitKi) => holen("ki", "jagen")(spiel, wesenMitKi, wesenMitKi.ki);
const FLUCHT_BEI_WENIG_LP = { handlung: "fliehen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: [[0, 1000], [30, 1000], [31, 0]] }] };

test("Eingaben und Kurven: Wertung ist Gewicht mal Promille, abgerundet; 0 scheidet aus", () => {
  const { spiel, ninkasi } = aufstellen();
  const wesenMitKi = jaeger(spiel, 5, 2);
  const eintrag = { handlung: "warten", gewicht: 200, bewertung: [{ eingabe: "abstand", kurve: [[0, 0], [8, 1000]] }] };
  assert.equal(wertung(spiel, wesenMitKi, ninkasi, eintrag), 100, "Abstand 4: 500 Promille von 200");
  eintrag.bewertung.push({ eingabe: "beuteLpProzent", kurve: [[0, 333], [100, 333]] });
  assert.equal(wertung(spiel, wesenMitKi, ninkasi, eintrag), 33, "mal 333 Promille, abgerundet");
  assert.equal(wertung(spiel, wesenMitKi, ninkasi, { handlung: "warten" }), 100, "ohne Bewertung das Gewicht");
  assert.equal(wertung(spiel, wesenMitKi, ninkasi, { handlung: "warten", bewertung: [{ eingabe: "abstand", kurve: [[0, 5000]] }] }), 100, "über 1000 abgeschnitten");
  // Zählen in Sicht: Ninkasi ist Feindin, ein zweites Bakterium Verbündeter
  jaeger(spiel, 6, 2);
  assert.equal(holen("kieingaben", "feindeInSicht")(spiel, wesenMitKi, ninkasi), 1);
  assert.equal(holen("kieingaben", "verbuendeteInSicht")(spiel, wesenMitKi, ninkasi), 1);
  wesenMitKi.werte.lp.aktuell = 3;
  assert.equal(holen("kieingaben", "eigeneLpProzent")(spiel, wesenMitKi, ninkasi), 30);
});

test("erste: Reihenfolge ist Vorrang; Fliehen bei wenig LP vor dem Spucken", () => {
  const { spiel, ninkasi } = aufstellen();
  const spuckerin = jaeger(spiel, 5, 2, { handlungen: [FLUCHT_BEI_WENIG_LP, { handlung: "faehigkeit", name: "spucke", abstandAb: 2 }] });
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "faehigkeit", faehigkeit: "spucke", ziel: { id: ninkasi.id } }, "bei vollen LP spuckt sie");
  spuckerin.werte.lp.aktuell = 2;
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "bewegen", dx: 1, dy: -1 }, "bei 20 % flieht sie");
});

test("beste: die höchste Wertung gewinnt, bei Gleichstand die frühere", () => {
  const { spiel } = aufstellen();
  const naheBevorzugt = { handlung: "warten", bewertung: [{ eingabe: "abstand", kurve: [[1, 1000], [9, 0]] }] };
  const fernBevorzugt = { handlung: "verfolgen", bewertung: [{ eingabe: "abstand", kurve: [[1, 0], [9, 1000]] }] };
  const wesenMitKi = jaeger(spiel, 3, 2, { wahl: "beste", handlungen: [naheBevorzugt, fernBevorzugt] });
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "warten" }, "Abstand 2: warten wertet höher");
  positionSetzen(spiel.zustand, wesenMitKi, { x: 9, y: 2 });
  assert.equal(entscheiden(spiel, wesenMitKi).art, "bewegen", "Abstand 8: verfolgen wertet höher");
  wesenMitKi.ki.handlungen = [{ handlung: "warten" }, { handlung: "verfolgen" }];
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "warten" }, "Gleichstand: der frühere");
});

test("gewichtet: nach Wertung gewürfelt, aus der Wurfquelle; gewichtetUnterBesten lässt die schwachen aus", () => {
  const { spiel, ninkasi } = aufstellen();
  const ki = { wahl: "gewichtet", handlungen: [{ handlung: "warten", gewicht: 300 }, { handlung: "verfolgen", gewicht: 100 }] };
  const wesenMitKi = jaeger(spiel, 5, 2, ki);
  const zaehlung = { warten: 0, verfolgen: 0 };
  for (let i = 0; i < 400; i++) {
    const befehl = handlungWaehlen(spiel, wesenMitKi, wesenMitKi.ki, ninkasi);
    zaehlung[befehl === VERFOLGEN ? "verfolgen" : "warten"]++;
  }
  assert.ok(zaehlung.warten > 250 && zaehlung.verfolgen > 60, JSON.stringify(zaehlung));
  // in den Grenzen fällt der Wurf auf den kleinsten oder größten Wert: das erste oder letzte Gewicht
  const grenzen = (mengen) => ({ art: "grenzen", mengen, zufallszustand: zufallErzeugen(1) });
  assert.deepEqual(mitWurfquelle(spiel, grenzen("kleinste"), () => handlungWaehlen(spiel, wesenMitKi, wesenMitKi.ki, ninkasi)), { art: "warten" });
  assert.equal(mitWurfquelle(spiel, grenzen("groesste"), () => handlungWaehlen(spiel, wesenMitKi, wesenMitKi.ki, ninkasi)), VERFOLGEN);
  wesenMitKi.ki.wahl = { gewichtetUnterBesten: 1 };
  wesenMitKi.ki.handlungen.push({ handlung: "fliehen", gewicht: 50 });
  for (let i = 0; i < 20; i++) assert.deepEqual(handlungWaehlen(spiel, wesenMitKi, wesenMitKi.ki, ninkasi), { art: "warten" });
  // ein einziger Kandidat würfelt nicht
  wesenMitKi.ki.handlungen = [{ handlung: "warten", gewicht: 300 }];
  const vorher = [...spiel.zustand.zufallszustand];
  handlungWaehlen(spiel, wesenMitKi, wesenMitKi.ki, ninkasi);
  assert.deepEqual(spiel.zustand.zufallszustand, vorher);
});

test("ohne passende Handlung oder mit verfolgen setzt das Wesen der Beute nach", () => {
  const { spiel } = aufstellen();
  const wesenMitKi = jaeger(spiel, 5, 2, { handlungen: [{ handlung: "faehigkeit", name: "spucke", abstandBis: 1 }] });
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "bewegen", dx: -1, dy: 0 });
  wesenMitKi.ki.handlungen = [{ handlung: "verfolgen" }, { handlung: "warten" }];
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "bewegen", dx: -1, dy: 0 });
});

test("Vorrang angreifen: das befohlene Ziel wird Beute, auch wenn es sonst keins wäre; fort heißt Ende", () => {
  const { spiel, ninkasi } = aufstellen();
  const freund = jaeger(spiel, 8, 2);
  const diener = jaeger(spiel, 6, 2, { vorrang: { anweisung: "angreifen", zielId: freund.id } });
  assert.deepEqual(entscheiden(spiel, diener), { art: "bewegen", dx: 1, dy: 0 }, "zum Verbündeten statt zu Ninkasi");
  positionSetzen(spiel.zustand, diener, { x: 7, y: 2 });
  assert.deepEqual(entscheiden(spiel, diener), { art: "bewegen", dx: 1, dy: 0, angreifen: true });
  freund.werte.lp.aktuell = 0;
  assert.equal(geltenderVorrang(spiel, diener.ki), null);
  assert.equal(diener.ki.vorrang, undefined);
  assert.ok(ninkasi);
});

test("Vorrang warten und folgen; bis lässt ihn ablaufen", () => {
  const { spiel, ninkasi } = aufstellen();
  const diener = jaeger(spiel, 5, 2, { vorrang: { anweisung: "warten" } });
  assert.deepEqual(entscheiden(spiel, diener), { art: "warten" }, "Ninkasi ist fern: warten");
  positionSetzen(spiel.zustand, diener, { x: 2, y: 2 });
  assert.deepEqual(entscheiden(spiel, diener), { art: "bewegen", dx: -1, dy: 0, angreifen: true }, "daneben: wehrt sich");
  const begleiter = wesen(spiel, 8, 2, "ninkasi", 10, { ki: { modul: "jagen", letzteBekanntePosition: null, vorrang: { anweisung: "folgen" } }, sicht: { reichweite: 9 } });
  const schritt = entscheiden(spiel, begleiter);
  assert.deepEqual([schritt.art, schritt.dx], ["bewegen", -1], "geht zu Ninkasi");
  positionSetzen(spiel.zustand, diener, { x: 9, y: 3 });
  positionSetzen(spiel.zustand, begleiter, { x: 2, y: 1 });
  assert.equal(entscheiden(spiel, begleiter).art, "warten", "bei ihr angekommen");
  begleiter.ki.vorrang.bis = spiel.zustand.zeit;
  assert.equal(geltenderVorrang(spiel, begleiter.ki), null, "abgelaufen");
  assert.ok(ninkasi);
});

// Unterstützung: Ziele unter den Verbündeten

const HEILEN = { handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "zielLpProzent", kurve: "heilenNachLp" }] };
const heiler = (spiel, x, y, faehigkeiten = ["heilspruch"], handlungen = [HEILEN]) =>
  wesen(spiel, x, y, "verderber", 10, { ki: { modul: "jagen", letzteBekanntePosition: null, handlungen }, sicht: { reichweite: 9 }, angriffe: ANGRIFFE, faehigkeiten });

test("Unterstützung: heilt den bedürftigsten Verbündeten, keinen mit vollen LP", () => {
  const { spiel, ninkasi } = aufstellen();
  const helfer = heiler(spiel, 6, 2);
  const leicht = jaeger(spiel, 7, 2);
  const schwer = jaeger(spiel, 8, 3);
  jaeger(spiel, 5, 1);
  leicht.werte.lp.aktuell = 6;
  schwer.werte.lp.aktuell = 2;
  assert.deepEqual(entscheiden(spiel, helfer), { art: "faehigkeit", faehigkeit: "heilspruch", ziel: { id: schwer.id } });
  assert.equal(holen("kieingaben", "zielLpProzent")(spiel, helfer, ninkasi, schwer), 20);
  assert.equal(holen("kieingaben", "zielLpProzent")(spiel, helfer, ninkasi), 100, "ohne Ziel die Beute");
  schwer.werte.lp.aktuell = 10;
  leicht.werte.lp.aktuell = 10;
  assert.equal(entscheiden(spiel, helfer).art, "bewegen", "alle gesund: es setzt der Beute nach");
  helfer.werte.lp.aktuell = 1;
  assert.deepEqual(entscheiden(spiel, helfer), { art: "faehigkeit", faehigkeit: "heilspruch", ziel: { id: helfer.id } }, "auch sich selbst");
});

test("Unterstützung: wenn gilt mit dem Ziel als Gegenüber", () => {
  const { spiel } = aufstellen();
  const verwundeter = jaeger(spiel, 7, 2);
  verwundeter.werte.lp.aktuell = 2;
  const helfer = heiler(spiel, 6, 2, ["heilspruch"], [{ ...HEILEN, wenn: [{ bedingung: "gegenueber_tag", tag: "zelle" }] }]);
  assert.equal(entscheiden(spiel, helfer).art, "bewegen", "kein Ziel trägt den Tag");
  verwundeter.tags = ["zelle"];
  assert.deepEqual(entscheiden(spiel, helfer), { art: "faehigkeit", faehigkeit: "heilspruch", ziel: { id: verwundeter.id } });
});

test("Unterstützung: Zielart selbst nur für sich; ohne trifft verbuendete nur die Beute; Bier nur selbst", () => {
  const { spiel, ninkasi } = aufstellen();
  const verwundeter = jaeger(spiel, 7, 2);
  verwundeter.werte.lp.aktuell = 2;
  const selbstheiler = heiler(spiel, 6, 2, ["selbstheilung"]);
  assert.equal(entscheiden(spiel, selbstheiler).art, "bewegen", "heilt den Verbündeten nicht");
  selbstheiler.werte.lp.aktuell = 2;
  assert.deepEqual(entscheiden(spiel, selbstheiler), { art: "faehigkeit", faehigkeit: "selbstheilung" });
  // Spucke trifft "wesen": nach der Bewertung wäre der Verbündete das beste Ziel, sie trifft trotzdem nur die Beute
  const spucker = heiler(spiel, 6, 3, ["spucke"], [{ handlung: "nutzen", zweck: "angriff", bewertung: [{ eingabe: "zielLpProzent", kurve: [[0, 1000], [100, 100]] }] }]);
  positionSetzen(spiel.zustand, verwundeter, { x: 8, y: 1 });
  assert.deepEqual(entscheiden(spiel, spucker), { art: "faehigkeit", faehigkeit: "spucke", ziel: { id: ninkasi.id } });
  const trinker = heiler(spiel, 9, 2, [], [HEILEN]);
  const bier = gegenstandTragen(spiel, trinker, { typ: "bier", trinkbar: { effekt: "heilung", zweck: ["heilen"] } });
  assert.equal(entscheiden(spiel, trinker).art, "bewegen", "trinkt nicht für den Verbündeten");
  trinker.werte.lp.aktuell = 2;
  assert.deepEqual(entscheiden(spiel, trinker), { art: "trinken", gegenstandId: bier.id });
});
