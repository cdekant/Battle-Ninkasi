// Handlung "nutzen" der KI (src/ki/nutzen.js, siehe docs/Wesen.md, KI): Fähigkeiten vor Gegenständen, Trinken nach
// einer benannten Kurve, Werfen nur bei freier Bahn; Ausstattung beim Erzeugen aus Daten (src/systeme/inventar.js);
// Datenprüfung der Zwecke, Kurven und Ausstattung

import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, gegenstandTragen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { holen } from "../src/kern/register.js";
import { ausDatenErzeugen, entitaetMitId } from "../src/kern/zustand.js";
import { vorbereiten } from "../src/kern/daten.js";
import { wertung } from "../src/ki/handlungen.js";
import { nutzbefehl } from "../src/ki/nutzen.js";

const RAUM = [
  "###########",
  "#.........#",
  "#.........#",
  "#.........#",
  "###########",
];
const EFFEKTE = { spritzer: { schritte: [{ baustein: "schaden", art: "saeure", menge: 2 }] }, stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] } };
const FAEHIGKEITEN = { spucke: { text: "f.spucke", zweck: ["angriff"], ziel: { art: "geschoss", reichweite: 6, trifft: "wesen" }, wirkung: "spritzer" } };
const ANGRIFFE = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];
const BIER = { typ: "bier", stapelbar: true, trinkbar: { effekt: "spritzer", zweck: ["heilen"] } };
const FLASCHE = { typ: "flasche", stapelbar: true, wurf: { effekt: "spritzer", zweck: ["angriff"] } };
const TRINKEN_BEI_WENIG_LP = { handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: "heilenNachLp" }] };

function aufstellen(optionen = {}) {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN, ...optionen });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  Object.assign(ninkasi, { angriffe: ANGRIFFE, sicht: { reichweite: 9 } });
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

function jaeger(spiel, x, y, handlungen = [], zusatz = {}) {
  const ki = { modul: "jagen", letzteBekanntePosition: null, handlungen };
  return wesen(spiel, x, y, "verderber", 10, { ki, sicht: { reichweite: 9 }, angriffe: ANGRIFFE, ...zusatz });
}

const entscheiden = (spiel, wesenMitKi) => holen("ki", "jagen")(spiel, wesenMitKi, wesenMitKi.ki);

test("Nutzen: Trinken nach der benannten Kurve heilenNachLp, nur mit passendem Zweck", () => {
  const { spiel, ninkasi } = aufstellen();
  const trinker = jaeger(spiel, 5, 2, [TRINKEN_BEI_WENIG_LP, { handlung: "warten" }]);
  const bier = gegenstandTragen(spiel, trinker, BIER);
  assert.deepEqual(entscheiden(spiel, trinker), { art: "warten" }, "volle LP: kein Grund zu trinken");
  trinker.werte.lp.aktuell = 5;
  assert.deepEqual(entscheiden(spiel, trinker), { art: "trinken", gegenstandId: bier.id }, "halbe LP: trinkt");
  // die benannte Kurve wertet wie dieselben Stützpunkte direkt am Eintrag
  const direkt = { ...TRINKEN_BEI_WENIG_LP, bewertung: [{ eingabe: "eigeneLpProzent", kurve: spiel.daten.regeln.ki.kurven.heilenNachLp }] };
  assert.equal(wertung(spiel, trinker, ninkasi, TRINKEN_BEI_WENIG_LP), wertung(spiel, trinker, ninkasi, direkt));
  bier.trinkbar.zweck = ["angriff"];
  assert.deepEqual(entscheiden(spiel, trinker), { art: "warten" }, "ohne den Zweck heilen trinkt es nicht");
});

test("Nutzen: eigene Fähigkeiten vor dem Gepäck, Gegenstände in der Reihenfolge des Gepäcks", () => {
  const { spiel, ninkasi } = aufstellen();
  const werfer = jaeger(spiel, 5, 2, [], { faehigkeiten: ["spucke"] });
  const flasche = gegenstandTragen(spiel, werfer, FLASCHE);
  assert.deepEqual(nutzbefehl(spiel, werfer, "angriff", ninkasi), { art: "faehigkeit", faehigkeit: "spucke", ziel: { id: ninkasi.id } });
  werfer.faehigkeiten = [];
  assert.deepEqual(nutzbefehl(spiel, werfer, "angriff", ninkasi), { art: "werfen", gegenstandId: flasche.id, ziel: { id: ninkasi.id } });
  const zweite = gegenstandTragen(spiel, werfer, { ...FLASCHE, typ: "flasche_zwei" });
  werfer.inventar = [zweite.id, flasche.id];
  assert.equal(nutzbefehl(spiel, werfer, "angriff", ninkasi).gegenstandId, zweite.id, "der erste im Gepäck");
  assert.equal(nutzbefehl(spiel, werfer, "heilen", ninkasi), null, "nichts zum Heilen");
});

test("Nutzen: geworfen wird nur, wenn die Bahn zuerst die Beute trifft", () => {
  const { spiel, ninkasi } = aufstellen();
  const werfer = jaeger(spiel, 5, 2, [{ handlung: "nutzen", zweck: "angriff" }, { handlung: "warten" }]);
  gegenstandTragen(spiel, werfer, FLASCHE);
  assert.equal(entscheiden(spiel, werfer).art, "werfen");
  jaeger(spiel, 3, 2); // ein Verbündeter in der Bahn
  assert.equal(nutzbefehl(spiel, werfer, "angriff", ninkasi), null);
  assert.deepEqual(entscheiden(spiel, werfer), { art: "warten" }, "dann die nächste Handlung");
});

test("Ausstattung: beim Erzeugen aus Daten im Gepäck, stapelbare als ein Stapel", () => {
  const { spiel } = aufstellen({
    gegenstaende: { bier: { text: "g.bier", aufhebbar: true, stapelbar: true }, keule: { text: "g.keule", aufhebbar: true } },
    wesen: { traeger: { text: "w.traeger", fraktion: "verderber", werte: { lp: { grundwert: 5 } }, ausstattung: [{ typ: "bier", anzahl: 3 }, { typ: "keule", anzahl: 2 }] } },
  });
  const traeger = ausDatenErzeugen(spiel, "wesen", "traeger", { x: 5, y: 2 });
  assert.equal(traeger.ausstattung, undefined, "ausstattung ist keine Komponente");
  const gepaeck = traeger.inventar.map((id) => entitaetMitId(spiel.zustand, id));
  assert.deepEqual(gepaeck.map((gegenstand) => [gegenstand.typ, gegenstand.anzahl ?? 1]), [["bier", 3], ["keule", 1], ["keule", 1]]);
  assert.ok(gepaeck.every((gegenstand) => gegenstand.getragenVon === traeger.id && !gegenstand.position));
});

test("Datenprüfung: Zwecke, benannte Kurven und Ausstattung", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(pruefen(() => {}), [], "der Spielinhalt mit Testeinträgen ist fehlerfrei");
  const erwartet = [
    [(daten) => { daten.gegenstaende.testgegenstand.trinkbar = { effekt: "testeffekt", zweck: ["zaubern"] }; }, 'testgegenstand.trinkbar: Zweck "zaubern" steht nicht in regeln.ki.zwecke'],
    [(daten) => { daten.gegenstaende.testgegenstand.wurf = { zweck: "angriff" }; }, "zweck muss eine Liste von Zwecken sein"],
    [(daten) => { daten.faehigkeiten.testgeschoss.zweck = ["zaubern"]; }, 'Zweck "zaubern"'],
    [(daten) => { daten.wesen.testwesen.ki.handlungen.push({ handlung: "nutzen", zweck: "zaubern" }); }, 'Zweck "zaubern"'],
    [(daten) => { daten.wesen.testwesen.ki.handlungen.push({ handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: "gibtesnicht" }] }); }, 'Kurve "gibtesnicht" steht nicht in regeln.ki.kurven'],
    [(daten) => { daten.regeln.ki.kurven.testkurve = [[0, 2000]]; }, "regeln.ki.kurven.testkurve: Werte in Promille"],
    [(daten) => { daten.regeln.ki.zwecke = "heilen"; }, "regeln.ki.zwecke muss eine Liste"],
    [(daten) => { daten.wesen.testwesen.ausstattung = { typ: "testgegenstand" }; }, "ausstattung muss eine Liste"],
    [(daten) => { daten.wesen.testwesen.ausstattung = [{ typ: "gibtesnicht" }]; }, 'Gegenstand "gibtesnicht" gibt es nicht'],
    [(daten) => { daten.wesen.testwesen.ausstattung = [{ typ: "testgegenstand", anzahl: 0 }]; }, "anzahl muss eine ganze Zahl > 0"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
