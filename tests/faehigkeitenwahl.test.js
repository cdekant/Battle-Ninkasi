// KI mit Fähigkeiten: Wahl der Fähigkeit, Abstand halten, Verbündete schonen, angekündigte Angriffe
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { befehlGeben, warteschlangeAbarbeiten } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { angekuendigteFelder } from "../src/anzeige/ankuendigungen.js";

const RAUM = [
  "###########",
  "#.........#",
  "#.........#",
  "#.........#",
  "###########",
];

const EFFEKTE = {
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] },
  spritzer: { schritte: [{ baustein: "schaden", art: "saeure", menge: 2 }] },
  schwall: { schritte: [{ baustein: "schaden", art: "saeure", menge: 5 }] },
  heilung: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 5 }] },
};

const FAEHIGKEITEN = {
  spucke: { text: "f.spucke", ziel: { art: "geschoss", reichweite: 6, trifft: "wesen" }, wirkung: "spritzer" },
  bogenspucke: { text: "f.bogenspucke", ziel: { art: "geschoss", reichweite: 6, trifft: "wesen", ueberVerbuendete: true }, wirkung: "spritzer" },
  wolke: { text: "f.wolke", ziel: { art: "feld", reichweite: 6, muster: { art: "kreis", radius: 1 }, trifft: "wesen" }, wirkung: "spritzer" },
  selbstheilung: { text: "f.selbstheilung", ziel: { art: "selbst" }, wirkung: "heilung" },
  schwall: {
    text: "f.schwall", zeit: 100, abklingzeit: 20, dauer: { schritte: 3 }, ankuendigung: "f.schwall.ankuendigung", unterbrechbar: true,
    ziel: { art: "feld", reichweite: 5, muster: { art: "kreis", radius: 1 }, trifft: "wesen" }, wirkung: "schwall",
  },
};

const ANGRIFFE = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  Object.assign(ninkasi, { angriffe: ANGRIFFE, sicht: { reichweite: 9 } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

// Wesen mit KI "jagen", den Fähigkeiten aus den KI-Einträgen und weiteren Angaben an der KI
function schuetze(spiel, x, y, kiEintraege, kiZusatz = {}, zusatz = {}) {
  const ki = { modul: "jagen", letzteBekanntePosition: null, faehigkeiten: kiEintraege, ...kiZusatz };
  return wesen(spiel, x, y, "verderber", 10, { ki, sicht: { reichweite: 9 }, angriffe: ANGRIFFE, faehigkeiten: kiEintraege.map((eintrag) => eintrag.name), ...zusatz });
}

const entscheiden = (spiel, wesenMitKi) => holen("ki", "jagen")(spiel, wesenMitKi, wesenMitKi.ki);

test("Die KI setzt eine Fähigkeit im Abstandsbereich ein, sonst jagt sie wie gewohnt", () => {
  const { spiel, ninkasi } = aufstellen();
  const spuckerin = schuetze(spiel, 5, 2, [{ name: "spucke", abstandAb: 2, abstandBis: 4 }]);
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "faehigkeit", faehigkeit: "spucke", ziel: { id: ninkasi.id } });
  spuckerin.position = { x: 2, y: 2 };
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "bewegen", dx: -1, dy: 0, angreifen: true }, "zu nah: Nahkampf");
  spuckerin.position = { x: 8, y: 2 };
  assert.equal(entscheiden(spiel, spuckerin).art, "bewegen", "zu weit: kommt näher");
});

test("Erster passender Eintrag gewinnt; wenn mit Bedingungen; chance 0 nie", () => {
  const { spiel, ninkasi } = aufstellen();
  const eintraege = [
    { name: "selbstheilung", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }] },
    { name: "spucke", chance: 0 },
    { name: "wolke" },
  ];
  const wesenMitKi = schuetze(spiel, 5, 2, eintraege);
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "faehigkeit", faehigkeit: "wolke", ziel: { x: ninkasi.position.x, y: ninkasi.position.y } });
  wesenMitKi.werte.lp.aktuell = 4;
  assert.deepEqual(entscheiden(spiel, wesenMitKi), { art: "faehigkeit", faehigkeit: "selbstheilung" }, "angeschlagen: heilt sich");
});

test("Nur bei gesehener Beute und nur, wenn die Fähigkeit benutzbar ist (Abklingzeit)", () => {
  const { spiel } = aufstellen();
  const spuckerin = schuetze(spiel, 5, 2, [{ name: "spucke" }]);
  spuckerin.abklingendBis = { spucke: 5 };
  assert.equal(entscheiden(spiel, spuckerin).art, "bewegen");
  spuckerin.abklingendBis = {};
  Object.assign(spuckerin.ki, { wachzustand: "wach", letzteBekanntePosition: null });
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "warten" }, "wach ohne Lärm: keine Beute, keine Fähigkeit");
});

test("Kein Schuss durch Verbündete; mit ueberVerbuendete fliegt das Geschoss darüber", () => {
  const { spiel, ninkasi } = aufstellen();
  const spuckerin = schuetze(spiel, 5, 2, [{ name: "spucke" }]);
  wesen(spiel, 3, 2, "verderber", 10);
  assert.equal(entscheiden(spiel, spuckerin).art, "bewegen", "ein Verbündeter steht auf der Bahn");
  spuckerin.faehigkeiten.push("bogenspucke");
  spuckerin.ki.faehigkeiten = [{ name: "spucke" }, { name: "bogenspucke" }];
  assert.deepEqual(entscheiden(spiel, spuckerin), { art: "faehigkeit", faehigkeit: "bogenspucke", ziel: { id: ninkasi.id } });

  const meldungen = meldungenMitschneiden(spiel);
  spiel.zustand.spielerinId = null; // die Schützin handelt hier ohne Ninkasi als Akteurin
  holen("befehle", "faehigkeit").ausfuehren(spiel, spuckerin, { art: "faehigkeit", faehigkeit: "bogenspucke", ziel: { id: ninkasi.id } });
  vorgangAbschliessen(spiel);
  const schaden = meldungen.filter((meldung) => meldung.art === "schaden");
  assert.deepEqual(schaden.map((meldung) => meldung.ziel.id), [ninkasi.id], "nur Ninkasi getroffen, nicht der Verbündete");
});

test("Flächen mit Verbündeten darin unterbleiben", () => {
  const { spiel } = aufstellen();
  const werferin = schuetze(spiel, 6, 2, [{ name: "wolke" }]);
  wesen(spiel, 2, 1, "verderber", 10);
  assert.equal(entscheiden(spiel, werferin).art, "bewegen");
});

test("abstandHalten: zu nah zurückweichen, auf Abstand warten, weiter weg näher kommen, in der Ecke angreifen", () => {
  const { spiel, ninkasi } = aufstellen();
  const schuetzin = schuetze(spiel, 3, 2, [], { abstandHalten: 3 });
  assert.deepEqual(entscheiden(spiel, schuetzin), { art: "bewegen", dx: 1, dy: -1 }, "weg von Ninkasi");
  schuetzin.position = { x: 4, y: 2 };
  assert.deepEqual(entscheiden(spiel, schuetzin), { art: "warten" });
  schuetzin.position = { x: 7, y: 2 };
  assert.equal(entscheiden(spiel, schuetzin).dx, -1);
  // in der Ecke: kein Feld weiter weg, dann wie sonst (Nahkampf)
  ninkasi.position = { x: 8, y: 2 };
  schuetzin.position = { x: 9, y: 1 };
  wesen(spiel, 9, 2, "verderber", 10);
  wesen(spiel, 8, 1, "verderber", 10);
  assert.deepEqual(entscheiden(spiel, schuetzin), { art: "bewegen", dx: -1, dy: 1, angreifen: true });
});

test("Angekündigter Angriff: zwei Schritte aufs Feld, Ausweichen hilft, die Anzeige kennt die Felder", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const schwallerin = schuetze(spiel, 5, 2, [{ name: "schwall" }]);
  akteurEinreihen(spiel.zustand, schwallerin.id, 50);
  befehlGeben(spiel, { art: "warten" });
  const beginn = meldungen.find((meldung) => meldung.art === "aktion_beginnt");
  assert.equal(beginn.ankuendigung, "f.schwall.ankuendigung");
  assert.equal(beginn.faehigkeit, "schwall");
  assert.equal(beginn.felder.length, 9, "Kreis mit Radius 1 um Ninkasi");
  assert.ok(schwallerin.laufendeAktion);
  assert.deepEqual(angekuendigteFelder(spiel), beginn.felder);

  // Ninkasi geht aus dem Kreis, bevor der Schwall kommt
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  while (schwallerin.laufendeAktion) befehlGeben(spiel, { art: "warten" });
  assert.equal(ninkasi.werte.lp.aktuell, 100, "ausgewichen");
  assert.ok(meldungen.some((meldung) => meldung.art === "flaeche"));
  assert.deepEqual(angekuendigteFelder(spiel), []);
});

test("Angekündigter Angriff trifft, wer stehen bleibt", () => {
  const { spiel, ninkasi } = aufstellen();
  const schwallerin = schuetze(spiel, 5, 2, [{ name: "schwall" }]);
  akteurEinreihen(spiel.zustand, schwallerin.id, 50);
  befehlGeben(spiel, { art: "warten" });
  while (schwallerin.laufendeAktion) befehlGeben(spiel, { art: "warten" });
  assert.equal(ninkasi.werte.lp.aktuell, 95);
});

test("unterbrechbar: Schaden bricht die lange Aktion eines Gegners ab", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const schwallerin = schuetze(spiel, 5, 2, [{ name: "schwall" }]);
  akteurEinreihen(spiel.zustand, schwallerin.id, 50);
  befehlGeben(spiel, { art: "warten" });
  assert.ok(schwallerin.laufendeAktion);
  effektAnwenden(spiel, "stoss", { quelleId: ninkasi.id, zielId: schwallerin.id });
  vorgangAbschliessen(spiel);
  assert.equal(schwallerin.laufendeAktion, undefined);
  assert.equal(meldungen.find((meldung) => meldung.art === "aktion_abgebrochen")?.grund, "schaden");
  warteschlangeAbarbeiten(spiel);
  assert.equal(ninkasi.werte.lp.aktuell, 100);
});
