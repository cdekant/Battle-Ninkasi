import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Systeme, Bedingungen und Quellen an
import { miniSpiel, wesen, weltLaufenLassen } from "./hilfen.js";
import { modifiziert, hoechstwert, werteAusDaten, modifikatorenAufgeschluesselt } from "../src/kern/werte.js";
import { anmelden, abmelden } from "../src/kern/register.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { nahkampf } from "../src/systeme/kampf.js";

const KARTE = ["########", "#......#", "########"];
const KARTE_MIT_WAND = ["#######", "#..#..#", "#######"];

const bonus = (betrag, zusatz = {}) => ({ ziel: "trefferchance", art: "plus", betrag, ...zusatz });

test("Tag: wirkt nur, wenn die Abfrage den Tag mitbringt", () => {
  const spiel = miniSpiel(KARTE);
  const psionikerin = wesen(spiel, 1, 1, "ninkasi", 10, { modifikatoren: [{ ziel: "kosten", tag: "psi", art: "prozent", betrag: -10 }] });
  assert.equal(modifiziert(spiel, psionikerin, "kosten", 100), 100);
  assert.equal(modifiziert(spiel, psionikerin, "kosten", 100, { tags: ["feuer"] }), 100);
  assert.equal(modifiziert(spiel, psionikerin, "kosten", 100, { tags: ["magie", "psi"] }), 90);
});

test("Bedingungen pegel_ab und pegel_unter lesen den aktuellen Pegel", () => {
  const spiel = miniSpiel(KARTE);
  const trinkerin = wesen(spiel, 1, 1, "ninkasi", 10, {
    modifikatoren: [bonus(20, { wenn: [{ bedingung: "pegel_ab", wert: 150 }] }), bonus(5, { wenn: [{ bedingung: "pegel_unter", wert: 50 }] })],
  });
  trinkerin.werte = { ...trinkerin.werte, ...werteAusDaten({ pegel: { anfangswert: 0 } }) };
  assert.equal(modifiziert(spiel, trinkerin, "trefferchance", 50), 55, "nüchtern");
  trinkerin.werte.pegel.aktuell = 100;
  assert.equal(modifiziert(spiel, trinkerin, "trefferchance", 50), 50);
  trinkerin.werte.pegel.aktuell = 150;
  assert.equal(modifiziert(spiel, trinkerin, "trefferchance", 50), 70);
});

test("wert_unter_prozent misst am Grundwert, so kann ein Modifikator auf denselben Wert zielen", () => {
  const spiel = miniSpiel(KARTE);
  const verzweifelte = wesen(spiel, 1, 1, "ninkasi", 100, {
    modifikatoren: [{ ziel: "lp", art: "plus", betrag: 50, wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 30 }] }],
  });
  assert.equal(hoechstwert(spiel, verzweifelte, "lp"), 100);
  verzweifelte.werte.lp.aktuell = 29;
  assert.equal(hoechstwert(spiel, verzweifelte, "lp"), 150);
  verzweifelte.werte.lp.aktuell = 30;
  assert.equal(hoechstwert(spiel, verzweifelte, "lp"), 100);
});

test("gegenueber_tag: Genauigkeit nur gegen Bakterien, im Nahkampf über die Umstände", () => {
  const spiel = miniSpiel(KARTE, { effekte: { biss: { schritte: [{ baustein: "schaden", menge: 1 }] } } });
  const jaegerin = wesen(spiel, 1, 1, "ninkasi", 10, {
    angriffe: [{ name: "biss", genauigkeit: 0, effekt: "biss" }],
    modifikatoren: [bonus(100, { ziel: "genauigkeit", wenn: [{ bedingung: "gegenueber_tag", tag: "bakterium" }] })],
  });
  const hefe = wesen(spiel, 2, 1, "feinde", 10, { tags: ["hefe"] });
  const bakterium = wesen(spiel, 3, 1, "feinde", 10, { tags: ["bakterium", "essig"] });
  assert.equal(modifiziert(spiel, jaegerin, "genauigkeit", 0, { gegenueberId: bakterium.id }), 100);
  nahkampf(spiel, jaegerin, hefe);
  nahkampf(spiel, jaegerin, bakterium);
  assert.equal(hefe.werte.lp.aktuell, 10, "Genauigkeit 0 verfehlt immer");
  assert.equal(bakterium.werte.lp.aktuell, 9);
});

test("Rekursion über eine Bedingung wird mit klarer Meldung abgebrochen", () => {
  const spiel = miniSpiel(KARTE);
  const kreisende = (spielDerAbfrage, entitaet) => modifiziert(spielDerAbfrage, entitaet, "lp", 0) > 0;
  kreisende.parameter = {};
  anmelden("modifikatorbedingungen", "test_kreisend", kreisende);
  try {
    const wesenImKreis = wesen(spiel, 1, 1, "ninkasi", 10, { modifikatoren: [{ ziel: "lp", art: "plus", betrag: 1, wenn: [{ bedingung: "test_kreisend" }] }] });
    assert.throws(() => hoechstwert(spiel, wesenImKreis, "lp"), /im Kreis/);
    assert.equal(hoechstwert(spiel, wesen(spiel, 2, 1, "ninkasi", 10), "lp"), 10, "nach dem Abbruch wieder normal");
  } finally {
    abmelden("modifikatorbedingungen", "test_kreisend");
  }
});

test("Aura: wirkt im Kreis auf die gewählten Wesen, nicht auf die Trägerin, und folgt der Position", () => {
  const spiel = miniSpiel(KARTE);
  const mutterhefe = wesen(spiel, 1, 1, "hefe", 10, { auren: [{ reichweite: 2, trifft: "verbuendete", modifikatoren: [bonus(10)] }] });
  const naheHefe = wesen(spiel, 3, 1, "hefe");
  const ferneHefe = wesen(spiel, 4, 1, "hefe");
  const feindin = wesen(spiel, 2, 1, "ninkasi");
  assert.equal(modifiziert(spiel, naheHefe, "trefferchance", 50), 60);
  assert.deepEqual(modifikatorenAufgeschluesselt(spiel, naheHefe, "trefferchance").map((modifikator) => modifikator.quelle), [`aura:${mutterhefe.id}`]);
  assert.equal(modifiziert(spiel, ferneHefe, "trefferchance", 50), 50, "dx = 3 liegt außerhalb von Radius 2");
  assert.equal(modifiziert(spiel, feindin, "trefferchance", 50), 50);
  assert.equal(modifiziert(spiel, mutterhefe, "trefferchance", 50), 50);
  naheHefe.position = { x: 5, y: 1 };
  assert.equal(modifiziert(spiel, naheHefe, "trefferchance", 50), 50, "außer Reichweite gelaufen");
  mutterhefe.auren[0].selbst = true;
  assert.equal(modifiziert(spiel, mutterhefe, "trefferchance", 50), 60);
});

test("Aura: ohne Vorgabe durch Wände, mit sichtlinie nur bei freier Sicht", () => {
  const spiel = miniSpiel(KARTE_MIT_WAND);
  const aura = { reichweite: 3, trifft: "feinde", modifikatoren: [bonus(-10)] };
  wesen(spiel, 2, 1, "hefe", 10, { auren: [aura] });
  const hinterDerWand = wesen(spiel, 4, 1, "ninkasi");
  assert.equal(modifiziert(spiel, hinterDerWand, "trefferchance", 50), 40);
  aura.sichtlinie = true;
  assert.equal(modifiziert(spiel, hinterDerWand, "trefferchance", 50), 50);
});

test("Aura in einem Zustand skaliert mit dem Verlauf und endet mit ihm", () => {
  const zustaende = {
    bierdunst: { text: "zustand.bierdunst", dauer: 1000, verlauf: "abklingend", auren: [{ reichweite: 1, trifft: "feinde", modifikatoren: [bonus(-20)] }] },
  };
  const spiel = miniSpiel(KARTE, { zustaende });
  const ninkasi = wesen(spiel, 1, 1, "ninkasi");
  const gegner = wesen(spiel, 2, 1, "feinde");
  const instanz = zustandSetzen(spiel, ninkasi, "bierdunst");
  assert.equal(modifiziert(spiel, gegner, "trefferchance", 50), 30);
  assert.deepEqual(modifikatorenAufgeschluesselt(spiel, gegner, "trefferchance").map((modifikator) => modifikator.quelle), [`aura:zustand:${instanz.nummer}`]);
  weltLaufenLassen(spiel, 500);
  assert.equal(modifiziert(spiel, gegner, "trefferchance", 50), 40);
  weltLaufenLassen(spiel, 1000);
  assert.equal(modifiziert(spiel, gegner, "trefferchance", 50), 50);
  assert.equal(modifiziert(spiel, ninkasi, "trefferchance", 50), 50, "die Trägerin selbst nie");
});
