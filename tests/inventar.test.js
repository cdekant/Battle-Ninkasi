// Inventar: Stapel, Ladungen, Behälter, Gewicht und Überladung, Fallenlassen, Material aus Stapeln
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, spielerinSetzen, allesSichtbar, rohdatenMitTesteintraegen } from "./hilfen.js";
import { befehlGeben, zeitkosten } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetErzeugen, entitaetenAuf, alleEntitaeten } from "../src/kern/zustand.js";
import { modifikatorHinzufuegen } from "../src/kern/werte.js";
import { lastVon, lastZuschlag, einzelgewicht } from "../src/systeme/inventar.js";
import { inventarTaste } from "../src/eingabe/inventar.js";
import { vorbereiten } from "../src/kern/daten.js";

const RAUM = ["#######", "#.....#", "#.....#", "#######"];
const EFFEKTE = { schluck: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 1 }] }, nichts: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 0 }] } };
const GEGENSTAENDE = {
  testbier: { typ: "testbier", text: "g.testbier", aufhebbar: true, stapelbar: true, gewicht: 900, trinkbar: { effekt: "schluck" }, wirdZu: "testflasche" },
  testflasche: { text: "g.testflasche", aufhebbar: true, stapelbar: true, gewicht: 400 },
  testfass: { typ: "testfass", text: "g.testfass", aufhebbar: true, gewicht: 2000, ladungen: { hoechstens: 20, gewichtJe: 500 }, trinkbar: { effekt: "schluck" }, wirdZu: "testleerfass" },
  testleerfass: { text: "g.testleerfass", aufhebbar: true, gewicht: 2000 },
};

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, gegenstaende: GEGENSTAENDE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

const hinlegen = (spiel, x, y, typ, zusatz = {}) => entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE[typ]), typ, position: { x, y }, ...zusatz });
const imGepaeck = (spiel, ninkasi) => ninkasi.inventar.map((id) => spiel.zustand.entitaeten[id]).map((gegenstand) => [gegenstand.typ, gegenstand.anzahl ?? 1]);

test("Stapel: Gleiches fließt beim Aufheben zusammen, Trinken nimmt eins und lässt die Flasche zurück", () => {
  const { spiel, ninkasi } = aufstellen();
  hinlegen(spiel, 1, 1, "testbier");
  hinlegen(spiel, 1, 1, "testbier", { anzahl: 2 });
  befehlGeben(spiel, { art: "aufheben" });
  befehlGeben(spiel, { art: "aufheben" });
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testbier", 3]]);
  const bier = spiel.zustand.entitaeten[ninkasi.inventar[0]];
  befehlGeben(spiel, { art: "trinken", gegenstandId: bier.id });
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testbier", 2], ["testflasche", 1]]);
  befehlGeben(spiel, { art: "trinken", gegenstandId: bier.id });
  befehlGeben(spiel, { art: "trinken", gegenstandId: bier.id });
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testflasche", 3]], "die Flaschen stapeln sich");
  assert.equal(spiel.zustand.entitaeten[bier.id], undefined);
});

test("Nur wirklich Gleiches stapelt sich: andere Komponenten bleiben getrennt", () => {
  const { spiel, ninkasi } = aufstellen();
  hinlegen(spiel, 1, 1, "testbier");
  hinlegen(spiel, 1, 1, "testbier", { verdorben: true });
  befehlGeben(spiel, { art: "aufheben" });
  befehlGeben(spiel, { art: "aufheben" });
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testbier", 1], ["testbier", 1]]);
});

test("Ladungen: das Fass gibt 20 Schlucke, wird mit jedem leichter, danach bleibt das leere Fass", () => {
  const { spiel, ninkasi } = aufstellen();
  hinlegen(spiel, 1, 1, "testfass");
  befehlGeben(spiel, { art: "aufheben" });
  const fass = spiel.zustand.entitaeten[ninkasi.inventar[0]];
  assert.equal(einzelgewicht(fass), 12000);
  befehlGeben(spiel, { art: "trinken", gegenstandId: fass.id });
  assert.deepEqual([fass.ladungen.aktuell, lastVon(spiel, ninkasi)], [19, 11500]);
  fass.ladungen.aktuell = 1;
  befehlGeben(spiel, { art: "trinken", gegenstandId: fass.id });
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testleerfass", 1]]);
});

test("Werfen nimmt einen vom Stapel, Fallenlassen den ganzen Stapel, Angelegtes wird dabei abgelegt", () => {
  const { spiel, ninkasi } = aufstellen();
  hinlegen(spiel, 1, 1, "testbier", { anzahl: 3 });
  befehlGeben(spiel, { art: "aufheben" });
  const stapel = spiel.zustand.entitaeten[ninkasi.inventar[0]];
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: stapel.id, ziel: { x: 4, y: 1 } }).ok, true);
  assert.equal(stapel.anzahl, 2);
  assert.deepEqual(entitaetenAuf(spiel.zustand, 4, 1).map((gegenstand) => [gegenstand.typ, gegenstand.anzahl ?? 1]), [["testbier", 1]]);
  assert.equal(befehlGeben(spiel, { art: "fallenlassen", gegenstandId: stapel.id }).ok, true);
  assert.deepEqual(ninkasi.inventar, []);
  assert.deepEqual(entitaetenAuf(spiel.zustand, 1, 1).filter((entitaet) => entitaet.id !== ninkasi.id).map((gegenstand) => gegenstand.anzahl), [2]);

  const ring = entitaetErzeugen(spiel.zustand, { typ: "testring", text: "g.ring", ausruestung: { platz: "finger" }, getragenVon: ninkasi.id });
  ninkasi.inventar.push(ring.id);
  ninkasi.ausgeruestet = [ring.id];
  befehlGeben(spiel, { art: "fallenlassen", gegenstandId: ring.id });
  assert.deepEqual(ninkasi.ausgeruestet, []);
  assert.equal(befehlGeben(spiel, { art: "fallenlassen", gegenstandId: ring.id }).grund, "nicht_im_gepaeck");
});

test("Überladung verteuert das Bewegen in Stufen; mehr Tragkraft hebt sie auf", () => {
  const { spiel, ninkasi } = aufstellen();
  ninkasi.tragkraft = 10000;
  const fass = entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE.testfass), typ: "testfass", getragenVon: ninkasi.id });
  ninkasi.inventar.push(fass.id);
  assert.equal(lastZuschlag(spiel, ninkasi), 25, "12 kg bei 10 kg Tragkraft");
  assert.equal(zeitkosten(spiel, ninkasi, "bewegen"), 125);
  assert.equal(zeitkosten(spiel, ninkasi, "warten"), 100, "nur das Bewegen wird teurer");
  ninkasi.tragkraft = 8000;
  assert.equal(zeitkosten(spiel, ninkasi, "bewegen"), 200, "ab 150 %");
  modifikatorHinzufuegen(ninkasi, { ziel: "tragkraft", art: "plus", betrag: 6000, quelle: "test" });
  assert.equal(lastZuschlag(spiel, ninkasi), 0);
});

test("Material für Fähigkeiten kommt auch aus Stapeln", () => {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, gegenstaende: GEGENSTAENDE, faehigkeiten: { brauen: { text: "f.brauen", material: [{ typ: "testbier", anzahl: 2 }], ziel: { art: "selbst" }, wirkung: "nichts" } } });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  Object.assign(ninkasi, { inventar: [], faehigkeiten: ["brauen"] });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  const stapel = entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE.testbier), typ: "testbier", anzahl: 3, getragenVon: ninkasi.id });
  ninkasi.inventar.push(stapel.id);
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "brauen" }).ok, true);
  assert.equal(stapel.anzahl, 1);
  assert.equal(alleEntitaeten(spiel.zustand).filter((entitaet) => entitaet.typ === "testbier").length, 1, "keine verwaisten Abspaltungen");
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "brauen" }).grund, "material_fehlt");
});

test("Inventarfenster: F lässt fallen", () => {
  const { spiel, ninkasi } = aufstellen();
  const bier = entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE.testbier), typ: "testbier", getragenVon: ninkasi.id });
  ninkasi.inventar.push(bier.id);
  assert.deepEqual(inventarTaste({ gewaehlt: bier.id }, "KeyF", spiel).befehl, { art: "fallenlassen", gegenstandId: bier.id });
});

test("Datenprüfung: Stapel, Gewicht, Ladungen, wirdZu und Regeln des Tragens", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten, daten.gegenstaende.testgegenstand);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten, testgegenstand) => { testgegenstand.stapelbar = "ja"; }, "stapelbar"],
    [(daten, testgegenstand) => { testgegenstand.gewicht = -1; }, "gewicht"],
    [(daten, testgegenstand) => { testgegenstand.wirdZu = "staub"; }, 'Gegenstand "staub"'],
    [(daten, testgegenstand) => { testgegenstand.ladungen = { hoechstens: 0 }; }, "ladungen muss"],
    [(daten, testgegenstand) => { Object.assign(testgegenstand, { ladungen: { hoechstens: 3 }, stapelbar: true }); }, "nicht stapelbar"],
    [(daten) => { daten.regeln.tragen.stufen = [{ ab: 150, kosten: 100 }, { ab: 100, kosten: 25 }]; }, "aufsteigendem ab"],
    [(daten) => { delete daten.regeln.tragen; }, "regeln.tragen.tragkraft"],
    [(daten) => { daten.wesen.ninkasi.tragkraft = "viel"; }, "tragkraft"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
