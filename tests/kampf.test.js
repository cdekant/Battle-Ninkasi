import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine und Systeme an
import { miniSpiel, wesen, meldungenMitschneiden } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { modifikatorHinzufuegen } from "../src/kern/werte.js";
import { zufallErzeugen, mitAnteil } from "../src/kern/zufall.js";
import { nahkampf, trefferanteil, anteilInProzent, schadenNachWiderstand, kampfwert } from "../src/systeme/kampf.js";

const KARTE = [
  "#######",
  "#.....#",
  "#######",
];

const EFFEKTE = {
  hieb: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 10 }] },
  klaps: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 2 }] },
  saeurespritzer: { schritte: [{ baustein: "schaden", art: "saeure", menge: 10 }] },
  flamme: { schritte: [{ baustein: "schaden", art: "feuer", menge: 10 }], tags: ["magie"] },
  gedankenstoss: { schritte: [{ baustein: "trefferwurf", genauigkeit: 100, gegen: "willenskraft", effekt: "psischaden", sonst: "streifschuss" }] },
  psischaden: { schritte: [{ baustein: "schaden", art: "psi", menge: 8 }] },
  streifschuss: { schritte: [{ baustein: "schaden", art: "psi", menge: 4 }] },
  durchbohren: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 10 }], tags: ["ignoriert_ruestung"] },
};

const SEHR_VIEL = 1_000_000_000;

function aufstellen({ angreifer = {}, ziel = {}, regeln } = {}) {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, regeln });
  const quelle = wesen(spiel, 1, 1, "ninkasi", 100, angreifer);
  const getroffenes = wesen(spiel, 2, 1, "feinde", 100, ziel);
  return { spiel, quelle, ziel: getroffenes };
}

function schadenDurch(effektName, aufstellung = {}, kontext = {}) {
  const { spiel, quelle, ziel } = aufstellen(aufstellung);
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, effektName, { quelleId: quelle.id, zielId: ziel.id, ...kontext });
  return { verlust: 100 - ziel.werte.lp.aktuell, meldung: meldungen.find((meldung) => meldung.art === "schaden"), meldungen };
}

test("mitAnteil würfelt exakt und lässt sichere Fälle aus", () => {
  const zufallszustand = zufallErzeugen(7);
  const vorher = [...zufallszustand];
  assert.equal(mitAnteil(zufallszustand, 0, 5), false);
  assert.equal(mitAnteil(zufallszustand, 5, 5), true);
  assert.deepEqual(zufallszustand, vorher, "kein Wurf");
  let treffer = 0;
  for (let i = 0; i < 3000; i++) if (mitAnteil(zufallszustand, 1, 3)) treffer++;
  assert.ok(treffer > 900 && treffer < 1100, `etwa ein Drittel, war ${treffer}`);
});

test("Trefferchance: Genauigkeit gegen Verteidigung und Grundverteidigung, nähert sich 0 und 100 % an", () => {
  const { spiel, quelle, ziel } = aufstellen({ ziel: { kampfwerte: { ausweichen: 20 } }, regeln: { kampf: { grundverteidigung: 20 } } });
  const anteil = (genauigkeit, tags) => trefferanteil(spiel, { quelle, ziel, genauigkeit, tags });
  assert.deepEqual(anteil(80), { zaehler: 80, nenner: 120 });
  assert.equal(anteilInProzent(80, 120), 67);
  const sehrGenau = anteil(10_000);
  assert.ok(sehrGenau.zaehler < sehrGenau.nenner, "nie sicher");
  assert.deepEqual(anteil(80, ["verfehlt_nie"]), { zaehler: 1, nenner: 1 });
  modifikatorHinzufuegen(quelle, { ziel: "genauigkeit", art: "plus", betrag: 40, quelle: "test" });
  modifikatorHinzufuegen(ziel, { ziel: "ausweichen", art: "plus", betrag: -100, quelle: "test" });
  assert.equal(kampfwert(spiel, ziel, "ausweichen"), 0, "nie unter 0");
  assert.deepEqual(anteil(80), { zaehler: 120, nenner: 140 });
});

test("Gegen Willenskraft: der Baustein trefferwurf wirkt sonst den Ersatz", () => {
  const getroffen = schadenDurch("gedankenstoss", { ziel: { kampfwerte: { ausweichen: SEHR_VIEL } } });
  assert.equal(getroffen.verlust, 8, "Ausweichen zählt gegen Psi nicht");
  const abgewehrt = schadenDurch("gedankenstoss", { ziel: { kampfwerte: { willenskraft: SEHR_VIEL } } });
  assert.equal(abgewehrt.verlust, 4);
  assert.equal(abgewehrt.meldungen.find((meldung) => meldung.art === "verfehlt").grund, "ausgewichen");
});

test("Blocken fängt einen gelungenen Treffer ab, unblockbar umgeht es", () => {
  const { spiel, quelle, ziel } = aufstellen({ angreifer: { angriff: { genauigkeit: 100, effekt: "hieb" } }, ziel: { kampfwerte: { blocken: SEHR_VIEL } } });
  const meldungen = meldungenMitschneiden(spiel);
  nahkampf(spiel, quelle, ziel);
  assert.equal(ziel.werte.lp.aktuell, 100);
  assert.equal(meldungen.find((meldung) => meldung.art === "verfehlt").grund, "geblockt");
  quelle.angriff.tags = ["unblockbar"];
  nahkampf(spiel, quelle, ziel);
  assert.equal(ziel.werte.lp.aktuell, 90);
});

test("Krit: Faktor aus den Regeln, über Modifikatoren nach oben offen, vor der Rüstung", () => {
  const kritisch = { angriff: { genauigkeit: 100, effekt: "hieb" }, kampfwerte: { kritchance: SEHR_VIEL } };
  const { spiel, quelle, ziel } = aufstellen({ angreifer: kritisch });
  const meldungen = meldungenMitschneiden(spiel);
  nahkampf(spiel, quelle, ziel);
  assert.equal(ziel.werte.lp.aktuell, 85, "x1,5");
  assert.equal(meldungen.find((meldung) => meldung.art === "schaden").kritisch, true);
  modifikatorHinzufuegen(quelle, { ziel: "kritfaktor", art: "plus", betrag: 150, quelle: "test" });
  nahkampf(spiel, quelle, ziel);
  assert.equal(ziel.werte.lp.aktuell, 55, "x3");
  const gepanzert = aufstellen({ angreifer: kritisch, ziel: { kampfwerte: { ruestung: 3 } } });
  nahkampf(gepanzert.spiel, gepanzert.quelle, gepanzert.ziel);
  assert.equal(gepanzert.ziel.werte.lp.aktuell, 88, "15 - 3");
});

test("Ohne Kritchance kein Krit", () => {
  const { spiel, quelle, ziel } = aufstellen({ angreifer: { angriff: { genauigkeit: 100, effekt: "hieb" } } });
  for (let i = 0; i < 5; i++) nahkampf(spiel, quelle, ziel);
  assert.equal(ziel.werte.lp.aktuell, 50);
});

test("Rüstung: fester Abzug gegen körperliche Arten, ruestung.<art> gegen andere, mindestens 1 Schaden", () => {
  const panzer = { kampfwerte: { ruestung: 3 } };
  assert.equal(schadenDurch("hieb", { ziel: panzer }).verlust, 7);
  assert.equal(schadenDurch("hieb", { ziel: panzer }).meldung.ruestungAbzug, 3);
  assert.equal(schadenDurch("saeurespritzer", { ziel: panzer }).verlust, 10, "gegen Säure hilft ruestung nicht");
  const schuerze = { ...panzer, modifikatoren: [{ ziel: "ruestung.saeure", art: "plus", betrag: 4, quelle: "schuerze" }] };
  assert.equal(schadenDurch("saeurespritzer", { ziel: schuerze }).verlust, 6);
  assert.equal(schadenDurch("hieb", { ziel: schuerze }).verlust, 7, "ruestung.saeure nicht gegen Stumpfes");
  assert.equal(schadenDurch("klaps", { ziel: { kampfwerte: { ruestung: 50 } } }).verlust, 1);
  assert.equal(schadenDurch("durchbohren", { ziel: panzer }).verlust, 10);
});

test("Widerstand nähert sich dem vollen Schutz an, Verwundbarkeit dem Doppelten", () => {
  assert.equal(schadenNachWiderstand(100, 100, 100), 50);
  assert.equal(schadenNachWiderstand(100, 300, 100), 25);
  assert.equal(schadenNachWiderstand(100, 9900, 100), 1);
  assert.equal(schadenNachWiderstand(100, -100, 100), 150);
  assert.equal(schadenNachWiderstand(100, -9900, 100), 199);
  assert.equal(schadenDurch("saeurespritzer", { ziel: { widerstaende: { saeure: 100 } } }).verlust, 5);
  assert.equal(schadenDurch("hieb", { ziel: { widerstaende: { saeure: 100 } } }).verlust, 10, "nur gegen die eigene Art");
  assert.equal(schadenDurch("flamme", { ziel: { widerstaende: { feuer: -100 } } }).verlust, 15);
  const quellen = [{ ziel: "widerstand", tag: "feuer", art: "plus", betrag: 100, quelle: "a" }, { ziel: "widerstand", tag: "feuer", art: "plus", betrag: 200, quelle: "b" }];
  assert.equal(schadenDurch("flamme", { ziel: { modifikatoren: quellen } }).verlust, 3, "Punkte addieren sich: 10 x 100 / 400");
});

test("Immunität ergibt genau 0 und wird gemeldet", () => {
  const { verlust, meldung } = schadenDurch("saeurespritzer", { ziel: { immun: ["saeure"] } });
  assert.equal(verlust, 0);
  assert.equal(meldung.immun, true);
  assert.equal(meldung.schadensart, "saeure");
  const ueberModifikator = { modifikatoren: [{ ziel: "immunitaet", tag: "feuer", art: "setzen", betrag: 1, quelle: "test" }] };
  assert.equal(schadenDurch("flamme", { ziel: ueberModifikator }).verlust, 0);
  assert.equal(schadenDurch("hieb", { ziel: ueberModifikator }).verlust, 10);
});

test("Schaden des Angreifers: Tags der Schadensart und des Mittels, Reihenfolge Angreifer, Rüstung, Widerstand", () => {
  const feuerbonus = [{ ziel: "schaden", tag: "feuer", art: "prozent", betrag: 50, quelle: "a" }, { ziel: "schaden", tag: "magie", art: "plus", betrag: 2, quelle: "b" }];
  assert.equal(schadenDurch("flamme", { angreifer: { modifikatoren: feuerbonus } }).verlust, 18, "(10 + 2) x 1,5");
  assert.equal(schadenDurch("hieb", { angreifer: { modifikatoren: feuerbonus } }).verlust, 10);
  const alles = { angreifer: { modifikatoren: [{ ziel: "schaden", art: "plus", betrag: 10, quelle: "a" }] }, ziel: { kampfwerte: { ruestung: 4 }, widerstaende: { stumpf: 100 } } };
  assert.equal(schadenDurch("hieb", alles).verlust, 8, "(20 - 4) / 2");
});
