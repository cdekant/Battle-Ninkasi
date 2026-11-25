// Verschleiß: Verderben (auch in Stapeln und auf verlassenen Ebenen), Haltbarkeit, angefressen schwächer, kaputt
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { miniSpiel, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, allesSichtbar, weltLaufenLassen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { entitaetErzeugen, alleEntitaeten, spielerin } from "../src/kern/zustand.js";
import { kampfwert } from "../src/systeme/kampf.js";
import { einenAbnehmen } from "../src/systeme/inventar.js";
import { haltbarkeitProzent } from "../src/systeme/ausruestung.js";
import { vorbereiten } from "../src/kern/daten.js";

const RAUM = ["#######", "#.....#", "#.....#", "#######"];
const EFFEKTE = {
  schluck: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 1 }] },
  aetzen: { schritte: [{ baustein: "abnutzen", menge: 3 }] },
  aetzen_brust: { schritte: [{ baustein: "abnutzen", platz: "brust", menge: 3 }] },
  saeure_frisst: { schritte: [{ baustein: "abnutzen", art: "saeure", menge: 2 }] },
  feuer_frisst: { schritte: [{ baustein: "abnutzen", art: "feuer", menge: 2 }] },
};
const GEGENSTAENDE = {
  testbier: { text: "g.testbier", aufhebbar: true, stapelbar: true, trinkbar: { effekt: "schluck" }, verdirbt: { nach: 1000, wird: "testsauer" } },
  testsauer: { text: "g.testsauer", aufhebbar: true, stapelbar: true, trinkbar: { effekt: "schluck" } },
  testreste: { text: "g.testreste", aufhebbar: true, stapelbar: true },
};
// Rüstung 4 und Ausweichen -5; Haltbarkeit 10
const PLATTE = {
  typ: "platte", text: "g.platte", haltbarkeit: { hoechstens: 10, wirdZu: "testreste" },
  ausruestung: { platz: "brust", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 4 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] },
};
const HELM = { typ: "helm", text: "g.helm", haltbarkeit: { hoechstens: 10, wirdZu: "testreste" }, ausruestung: { platz: "kopf", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] } };

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, gegenstaende: GEGENSTAENDE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  Object.assign(ninkasi, { inventar: [], plaetze: { brust: 1, kopf: 1 }, kampfwerte: { ausweichen: 20 } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const bierHinlegen = (spiel, x, y, zusatz = {}) => entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE.testbier), typ: "testbier", position: { x, y }, ...zusatz });
const imGepaeck = (spiel, ninkasi) => ninkasi.inventar.map((id) => spiel.zustand.entitaeten[id]).map((gegenstand) => [gegenstand.typ, gegenstand.anzahl ?? 1]);

test("Verderben: zur Zeit wird das Bier im Gepäck zu Sauerbier, mit derselben Anzahl", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const bier = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testbier), typ: "testbier", anzahl: 3 });
  assert.equal(bier.verdirbtUm, 1000, "Zeitpunkt beim Erzeugen gesetzt");
  weltLaufenLassen(spiel, 999);
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testbier", 3]]);
  weltLaufenLassen(spiel, 1000);
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testsauer", 3]]);
  const meldung = meldungen.find((eintrag) => eintrag.art === "verdorben");
  assert.equal(meldung.traegerin.id, ninkasi.id);
  assert.equal(meldung.wird.typ, "testsauer");
});

test("Verderben auf dem Boden: das Bier wird am selben Ort sauer", () => {
  const { spiel } = aufstellen();
  bierHinlegen(spiel, 3, 2);
  weltLaufenLassen(spiel, 1000);
  const dort = alleEntitaeten(spiel.zustand).filter((entitaet) => entitaet.position?.x === 3 && entitaet.position?.y === 2);
  assert.deepEqual(dort.map((entitaet) => entitaet.typ), ["testsauer"]);
});

test("Stapel: fließen Biere zusammen, verdirbt der Stapel zum nach Anzahl gewichteten Durchschnitt", () => {
  const { spiel, ninkasi } = aufstellen();
  bierHinlegen(spiel, 1, 1); // verdirbt um 1000
  befehlGeben(spiel, { art: "aufheben" });
  spiel.zustand.zeit = 1000 - 1; // kurz vorher, die Welt läuft hier nicht von selbst
  bierHinlegen(spiel, 1, 1, { anzahl: 3, verdirbtUm: 2000 });
  befehlGeben(spiel, { art: "aufheben" });
  const stapel = spiel.zustand.entitaeten[ninkasi.inventar[0]];
  assert.equal(stapel.anzahl, 4);
  assert.equal(stapel.verdirbtUm, Math.floor((1000 * 1 + 2000 * 3) / 4), "1750");
  weltLaufenLassen(spiel, 1749);
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testbier", 4]], "das alte Zeitereignis um 1000 gilt nicht mehr");
  weltLaufenLassen(spiel, 1750);
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testsauer", 4]]);
});

test("Ein abgespaltenes Stück behält den Zeitpunkt und verdirbt für sich", () => {
  const { spiel, ninkasi } = aufstellen();
  const stapel = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testbier), typ: "testbier", anzahl: 2 });
  const stueck = einenAbnehmen(spiel, ninkasi, stapel);
  assert.equal(stueck.verdirbtUm, stapel.verdirbtUm);
  assert.ok(spiel.zustand.warteschlange.some((eintrag) => eintrag.gebundenAn === stueck.id && eintrag.ereignistyp === "verderben"));
});

test("Verlassene Ebenen: das Verderben ruht mit, Zeitpunkt und Zeitereignis rücken nach", () => {
  const daten = datenLaden(rohdaten, { texte });
  const spiel = neuesSpiel(daten, 3);
  const amBoden = alleEntitaeten(spiel.zustand).find((entitaet) => entitaet.typ === "bier" && entitaet.position);
  const vorher = amBoden.verdirbtUm;
  assert.equal(befehlGeben(spiel, { art: "treppe" }).ok, true, "hinauf in den Hub");
  for (let i = 0; i < 5; i++) befehlGeben(spiel, { art: "warten" });
  const abgelegtUm = spiel.zustand.abgelegteEbenen[1].abgelegtUm;
  const meldungen = meldungenMitschneiden(spiel);
  assert.equal(befehlGeben(spiel, { art: "treppe" }).ok, true, "hinab in den Keller");
  // vergangen bis zum Wechsel; danach läuft die Welt schon wieder bis zu Ninkasis nächstem Zug
  const vergangen = meldungen.find((meldung) => meldung.art === "ebene_gewechselt").zeit - abgelegtUm;
  assert.ok(vergangen > 0);
  assert.equal(spiel.zustand.entitaeten[amBoden.id].verdirbtUm, vorher + vergangen);
  const eintrag = spiel.zustand.warteschlange.find((e) => e.gebundenAn === amBoden.id && e.ereignistyp === "verderben");
  assert.equal(eintrag.zeit, vorher + vergangen, "das Zeitereignis rückt mit");
  assert.equal(spielerin(spiel.zustand).id, spiel.zustand.spielerinId);
});

test("Haltbarkeit: abnutzen trifft angelegte Ausrüstung mit Haltbarkeit, nur auf dem genannten Platz", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const platte = gegenstandTragen(spiel, ninkasi, structuredClone(PLATTE));
  const helm = gegenstandTragen(spiel, ninkasi, structuredClone(HELM));
  effektAnwenden(spiel, "aetzen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(platte.haltbarkeit.aktuell, undefined, "nicht angelegt: nichts");
  befehlGeben(spiel, { art: "anlegen", gegenstandId: platte.id });
  befehlGeben(spiel, { art: "anlegen", gegenstandId: helm.id });
  effektAnwenden(spiel, "aetzen_brust", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(platte.haltbarkeit.aktuell, 7);
  assert.equal(helm.haltbarkeit.aktuell, undefined, "der Helm bleibt heil");
  const meldung = meldungen.find((eintrag) => eintrag.art === "abgenutzt");
  assert.deepEqual([meldung.was.id, meldung.menge, meldung.prozent], [platte.id, 3, 70]);
});

test("Haltbarkeit: unempfindlich schützt nur gegen das Abnutzen seiner Art, gewürfelt nach der Chance", () => {
  const { spiel, ninkasi } = aufstellen();
  const leder = gegenstandTragen(spiel, ninkasi, { ...structuredClone(PLATTE), haltbarkeit: { hoechstens: 10, wirdZu: "testreste", unempfindlich: { saeure: 100 } } });
  befehlGeben(spiel, { art: "anlegen", gegenstandId: leder.id });
  effektAnwenden(spiel, "saeure_frisst", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(leder.haltbarkeit.aktuell, undefined, "gegen Säure zu 100 % unempfindlich");
  effektAnwenden(spiel, "feuer_frisst", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(leder.haltbarkeit.aktuell, 8, "Feuer frisst weiter");
  effektAnwenden(spiel, "aetzen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(leder.haltbarkeit.aktuell, 5, "ohne Art gilt keine Unempfindlichkeit");
  // mit 50 % über viele Würfe: manche fressen, manche nicht
  leder.haltbarkeit = { hoechstens: 1000, wirdZu: "testreste", unempfindlich: { saeure: 50 } };
  for (let i = 0; i < 40; i++) effektAnwenden(spiel, "saeure_frisst", { quelleId: ninkasi.id, zielId: ninkasi.id });
  const gefressen = (1000 - leder.haltbarkeit.aktuell) / 2;
  assert.ok(gefressen > 5 && gefressen < 35, `${gefressen} von 40 gefressen`);
});

test("Datenprüfung: haltbarkeit.unempfindlich und wurf.bleibt", () => {
  const roh = rohdatenMitTesteintraegen();
  const fehlerMit = (zusatz, teil) => {
    const daten = structuredClone(roh);
    Object.assign(daten.gegenstaende.testgegenstand, zusatz);
    return vorbereiten(daten).fehler.some((meldung) => meldung.includes("testgegenstand") && meldung.includes(teil));
  };
  const ruestung = (unempfindlich) => ({ haltbarkeit: { hoechstens: 5, wirdZu: "lederfetzen", unempfindlich }, ausruestung: { platz: "brust" } });
  assert.ok(fehlerMit(ruestung({ saeuer: 50 }), "Schadensart gibt es nicht"));
  assert.ok(fehlerMit(ruestung({ saeure: 0 }), "von 1 bis 100"));
  assert.ok(fehlerMit(ruestung([]), "unempfindlich"));
  assert.ok(!fehlerMit(ruestung({ saeure: 75 }), "unempfindlich"));
  assert.ok(fehlerMit({ wurf: { bleibt: true } }, "bleibt braucht einen effekt"));
  assert.ok(!fehlerMit({ wurf: { effekt: "wurfmesser_flug", bleibt: true } }, "wurf"));
});

test("Angefressen wirkt schwächer: Vorteile sinken mit der Haltbarkeit, Nachteile bleiben", () => {
  const { spiel, ninkasi } = aufstellen();
  const platte = gegenstandTragen(spiel, ninkasi, structuredClone(PLATTE));
  befehlGeben(spiel, { art: "anlegen", gegenstandId: platte.id });
  assert.equal(kampfwert(spiel, ninkasi, "ruestung"), 4);
  platte.haltbarkeit.aktuell = 5;
  assert.equal(haltbarkeitProzent(platte), 50);
  assert.equal(kampfwert(spiel, ninkasi, "ruestung"), 2, "halbe Haltbarkeit, halbe Rüstung");
  assert.equal(kampfwert(spiel, ninkasi, "ausweichen"), 15, "der Abzug aufs Ausweichen bleibt voll");
  platte.haltbarkeit.aktuell = 1;
  assert.equal(kampfwert(spiel, ninkasi, "ruestung"), 0, "10 % von 4, gerundet");
});

test("Kaputt bei 0: nach dem Vorgang bleibt wirdZu im Gepäck, nicht angelegt", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const platte = gegenstandTragen(spiel, ninkasi, structuredClone({ ...PLATTE, haltbarkeit: { hoechstens: 10, aktuell: 2, wirdZu: "testreste" } }));
  befehlGeben(spiel, { art: "anlegen", gegenstandId: platte.id });
  effektAnwenden(spiel, "aetzen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(platte.haltbarkeit.aktuell, 0);
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[platte.id], undefined);
  assert.deepEqual(imGepaeck(spiel, ninkasi), [["testreste", 1]]);
  assert.deepEqual(ninkasi.ausgeruestet, []);
  assert.equal(kampfwert(spiel, ninkasi, "ausweichen"), 20, "auch der Nachteil ist weg");
  assert.equal(meldungen.find((eintrag) => eintrag.art === "kaputt").wird.typ, "testreste");
});

test("Kein Verschleiß durch Gebrauch: Getroffenwerden nutzt die Rüstung nicht ab", () => {
  const { spiel, ninkasi } = aufstellen();
  spiel.daten.effekte.hieb = { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] };
  const platte = gegenstandTragen(spiel, ninkasi, structuredClone(PLATTE));
  befehlGeben(spiel, { art: "anlegen", gegenstandId: platte.id });
  effektAnwenden(spiel, "hieb", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(platte.haltbarkeit.aktuell, undefined);
});

test("Datenprüfung: verdirbt, haltbarkeit", () => {
  const roh = rohdatenMitTesteintraegen();
  const testgegenstand = roh.gegenstaende.testgegenstand;
  const fehlerMit = (zusatz) => {
    const daten = structuredClone(roh);
    Object.assign(daten.gegenstaende.testgegenstand, zusatz);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(vorbereiten(roh).fehler, [], "der Spielinhalt ist fehlerfrei");
  assert.ok(testgegenstand);
  assert.ok(fehlerMit({ verdirbt: { nach: 0, wird: "bier" } }).some((meldung) => meldung.includes("verdirbt muss")));
  assert.ok(fehlerMit({ verdirbt: { nach: 10, wird: "gibtsnicht" } }).some((meldung) => meldung.includes("verdirbt muss")));
  assert.ok(fehlerMit({ stapelbar: true, verdirbt: { nach: 10, wird: "bierfass" } }).some((meldung) => meldung.includes("muss darum stapelbar")));
  assert.ok(fehlerMit({ haltbarkeit: { hoechstens: 5, wirdZu: "leere_flasche" } }).some((meldung) => meldung.includes("nur an Ausrüstung")));
  assert.ok(fehlerMit({ ausruestung: { platz: "brust" }, haltbarkeit: { hoechstens: 5 } }).some((meldung) => meldung.includes("haltbarkeit muss")));
});
