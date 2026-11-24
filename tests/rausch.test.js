// Strafen des Rauschs (systeme/stoffwechsel.js): Befehlsveränderer und Modifikatoren über dem Pegel, Danebenschlagen
// (systeme/befehlsveraenderer.js), Schlag ins Leere (systeme/bewegung.js) und der Modifikator risiko.<ausgang>
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme, Zustände und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { befehlGeben, datenLaden } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { werteAusDaten, modifiziert, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { rauschchance, rauschstufe } from "../src/systeme/stoffwechsel.js";
import { risikochance } from "../src/systeme/faehigkeiten.js";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";

const GANG = ["#####", "#...#", "#####"];
const RAUM = ["#####", "#...#", "#...#", "#...#", "#####"];
const EFFEKTE = { stoss: { schritte: [{ baustein: "schaden", menge: 3 }] } };
const ANGRIFFE = [{ name: "stoss", genauigkeit: 100, effekt: "stoss", kosten: 50 }];
const SICHER = [[0, 100]];

// Ninkasi mit Pegel und Strafen des Rauschs, am Zug
function trinkerinAmZug(spiel, x, y, { pegel = 0, befehle = [], modifikatoren } = {}) {
  const ninkasi = spielerinSetzen(spiel, x, y);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, pegel: { anfangswert: pegel } });
  Object.assign(ninkasi, { angriffe: ANGRIFFE, sicht: { reichweite: 6 }, stoffwechsel: { rausch: { befehle, modifikatoren } } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return ninkasi;
}

const spielBauen = (karte = GANG) => miniSpiel(karte, { effekte: EFFEKTE });

test("Rausch: der Veränderer wirkt erst, wenn die Kurve über dem Pegel eine Chance gibt", () => {
  const befehle = [{ veraenderer: "abweichen", chance: [[1199, 0], [1200, 100]] }];
  const nuechtern = spielBauen();
  const ninkasi = trinkerinAmZug(nuechtern, 2, 1, { pegel: 1199, befehle });
  assert.equal(rauschchance(nuechtern, ninkasi, befehle[0]), 0);
  befehlGeben(nuechtern, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.position, { x: 3, y: 1 }, "unter der Schwelle wie gewollt");

  const betrunken = spielBauen();
  const torkelnde = trinkerinAmZug(betrunken, 2, 1, { pegel: 1200, befehle });
  befehlGeben(betrunken, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(torkelnde.position, { x: 1, y: 1 }, "im Gang bleibt nur die Gegenrichtung");
});

test("Rausch: rausch.<veraenderer> mildert die Chance (Standfestigkeit), begrenzt auf 0 bis 100", () => {
  const spiel = spielBauen();
  const eintrag = { veraenderer: "abweichen", chance: [[0, 40]] };
  const ninkasi = trinkerinAmZug(spiel, 2, 1, { pegel: 500, befehle: [eintrag] });
  modifikatorHinzufuegen(ninkasi, { ziel: "rausch.abweichen", art: "prozent", betrag: -50, quelle: "skill:standfestigkeit" });
  assert.equal(rauschchance(spiel, ninkasi, eintrag), 20);
  modifikatorHinzufuegen(ninkasi, { ziel: "rausch.abweichen", art: "plus", betrag: -100, quelle: "test" });
  assert.equal(rauschchance(spiel, ninkasi, eintrag), 0);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.position, { x: 3, y: 1 });
});

test("Rausch: Modifikatoren gelten mit der Quelle rausch nach ihren Bedingungen", () => {
  const spiel = spielBauen();
  const modifikatoren = [800, 1200].map((wert) => ({ ziel: "genauigkeit", art: "plus", betrag: -5, wenn: [{ bedingung: "pegel_ab", wert }] }));
  const ninkasi = trinkerinAmZug(spiel, 2, 1, { pegel: 799, modifikatoren });
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 80), 80);
  ninkasi.werte.pegel.aktuell = 1000;
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 80), 75);
  ninkasi.werte.pegel.aktuell = 1200;
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 80), 70);
});

test("Danebenschlagen: der Schlag trifft ein Wesen um 45° daneben, Verbündete eingeschlossen", () => {
  const spiel = spielBauen(RAUM);
  const ninkasi = trinkerinAmZug(spiel, 1, 2, { pegel: 2000, befehle: [{ veraenderer: "daneben_schlagen", chance: SICHER }] });
  const feind = wesen(spiel, 2, 2, "feinde");
  const freundin = wesen(spiel, 2, 1, "ninkasi");
  const andererFeind = wesen(spiel, 2, 3, "feinde");
  const meldungen = meldungenMitschneiden(spiel);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(feind.werte.lp.aktuell, 10, "das eigentliche Ziel bleibt heil");
  assert.equal(freundin.werte.lp.aktuell + andererFeind.werte.lp.aktuell, 17, "eines der beiden Wesen daneben ist getroffen");
  assert.ok(meldungen.some((meldung) => meldung.art === "daneben_geschlagen"));
});

test("Danebenschlagen: ohne Wesen daneben geht der Schlag ins Leere, kostet einen Angriff und bewegt nicht", () => {
  const spiel = spielBauen(RAUM);
  const ninkasi = trinkerinAmZug(spiel, 1, 2, { pegel: 2000, befehle: [{ veraenderer: "daneben_schlagen", chance: SICHER }] });
  const feind = wesen(spiel, 2, 2, "feinde");
  const meldungen = meldungenMitschneiden(spiel);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual([ninkasi.position, feind.werte.lp.aktuell], [{ x: 1, y: 2 }, 10]);
  assert.ok(meldungen.some((meldung) => meldung.art === "ins_leere"));
  const eintrag = spiel.zustand.warteschlange.find((kandidat) => kandidat.akteurId === ninkasi.id);
  assert.equal(eintrag.zeit, 50, "wieder am Zug nach so langer Zeit wie ein Angriff mit dem Profil");
});

test("Danebenschlagen: Schritte ohne Angriff und andere Befehle bleiben unverändert", () => {
  const spiel = spielBauen(RAUM);
  const ninkasi = trinkerinAmZug(spiel, 1, 2, { pegel: 2000, befehle: [{ veraenderer: "daneben_schlagen", chance: SICHER }] });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.position, { x: 2, y: 2 });
  assert.equal(befehlGeben(spiel, { art: "warten" }).ok, true);
});

test("Schlag ins Leere: nur mit Angriffsprofilen gültig, steht doch ein Wesen dort, wird es angegriffen", () => {
  const spiel = spielBauen(RAUM);
  const ninkasi = trinkerinAmZug(spiel, 1, 2);
  const freundin = wesen(spiel, 2, 1, "ninkasi");
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: -1, insLeere: true });
  assert.equal(freundin.werte.lp.aktuell, 7);
  ninkasi.angriffe = [];
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0, insLeere: true }).ok, false);
});

test("risiko.<ausgang> verändert die Chance eines Ausgangs, nie unter 0; sichere Ausgänge bleiben sicher", () => {
  const spiel = spielBauen();
  const ninkasi = trinkerinAmZug(spiel, 2, 1, { pegel: 1600 });
  const ausgang = { name: "rueckschlag", chance: [[0, 0], [1200, 0], [3200, 20]] };
  assert.equal(risikochance(spiel, ninkasi, ausgang, 2200), 10);
  modifikatorHinzufuegen(ninkasi, { ziel: "risiko.rueckschlag", art: "prozent", betrag: -50, quelle: "skill:selbstbeherrschung" });
  assert.equal(risikochance(spiel, ninkasi, ausgang, 2200), 5);
  modifikatorHinzufuegen(ninkasi, { ziel: "risiko.rueckschlag", art: "plus", betrag: 30, quelle: "test" });
  assert.equal(risikochance(spiel, ninkasi, ausgang, 1000), 0, "unter der Schwelle bleibt es bei 0");
});

test("Ninkasis Skala: bis 2 ‰ nüchtern, die Strafen beginnen im Rausch bei 12 ‰", () => {
  const daten = datenLaden(rohdaten, { texte });
  const stoffwechsel = daten.wesen.ninkasi.stoffwechsel;
  const spiel = spielBauen();
  const ninkasi = trinkerinAmZug(spiel, 2, 1, { pegel: 199 });
  ninkasi.stoffwechsel = structuredClone(stoffwechsel);
  assert.equal(rauschstufe(ninkasi), "nuechtern");
  ninkasi.werte.pegel.aktuell = 200;
  assert.equal(rauschstufe(ninkasi), "angeheitert");
  const [torkeln, danebenschlagen] = stoffwechsel.rausch.befehle;
  ninkasi.werte.pegel.aktuell = 1199;
  assert.deepEqual([rauschchance(spiel, ninkasi, torkeln), rauschchance(spiel, ninkasi, danebenschlagen)], [0, 0]);
  ninkasi.werte.pegel.aktuell = 1200;
  assert.equal(rauschstufe(ninkasi), "im_rausch");
  assert.ok(rauschchance(spiel, ninkasi, torkeln) > 0 && rauschchance(spiel, ninkasi, danebenschlagen) > 0);
  ninkasi.werte.pegel.aktuell = 799;
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 80), 80, "unter 8 ‰ ohne Abzug");
  ninkasi.werte.pegel.aktuell = 800;
  assert.ok(modifiziert(spiel, ninkasi, "genauigkeit", 80) < 80, "berauscht trifft schlechter");
});
