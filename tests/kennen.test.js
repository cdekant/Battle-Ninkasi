// Fluch und Unbekanntes: verfluchte Ausrüstung, Etiketten je Lauf, Erkennen durch Trinken, Benutzen und Kennerschaft
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, allesSichtbar, weltLaufenLassen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { befehlGeben, befehlAusfuehren } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { bezugAuf } from "../src/kern/ereignisse.js";
import { etikettenZuordnen, istUnbekannt, erkennenChance } from "../src/systeme/kennen.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import grammatik from "../sprache/de/grammatik.js";
import { vorbereiten } from "../src/kern/daten.js";

const RAUM = ["#######", "#.....#", "#.....#", "#######"];
const EFFEKTE = {
  schluck: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 1 }] },
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] },
  weihwasser: { schritte: [{ baustein: "fluch_aufheben" }] },
};
const ETIKETTEN = { biere: ["e.krug", "e.flasche", "e.fass"], ringe: ["e.matt", "e.glatt"] };
const GEGENSTAENDE = {
  testhell: { text: "g.testhell", aufhebbar: true, stapelbar: true, trinkbar: { effekt: "schluck" }, unbekannt: { gruppe: "biere", schwierigkeit: 0 } },
  testdunkel: { text: "g.testdunkel", aufhebbar: true, stapelbar: true, trinkbar: { effekt: "schluck" }, unbekannt: { gruppe: "biere", schwierigkeit: 0 } },
  testring: { text: "g.testring", aufhebbar: true, ausruestung: { platz: "finger" }, unbekannt: { gruppe: "ringe", schwierigkeit: 1000000 } },
  testleichtring: { text: "g.testleichtring", aufhebbar: true, ausruestung: { platz: "finger" }, unbekannt: { gruppe: "ringe", schwierigkeit: 0 } },
  testklinge: { text: "g.testklinge", aufhebbar: true, ausruestung: { platz: "hand", angriffe: [{ name: "klinge", genauigkeit: 100, effekt: "stoss" }] }, unbekannt: { gruppe: "ringe", schwierigkeit: 1000000 } },
};
const VERFLUCHT = { typ: "fluchring", text: "g.fluchring", verflucht: true, ausruestung: { platz: "finger" } };
const RING = { typ: "ring", text: "g.ring", ausruestung: { platz: "finger" } };

function aufstellen(startwert = 1) {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, gegenstaende: GEGENSTAENDE, etiketten: ETIKETTEN, startwert });
  etikettenZuordnen(spiel);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  Object.assign(ninkasi, { inventar: [], plaetze: { finger: 1, hand: 1 } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const neu = (spiel, typ, zusatz = {}) => entitaetErzeugen(spiel.zustand, { ...structuredClone(GEGENSTAENDE[typ]), typ, ...zusatz });
const geben = (spiel, art, gegenstand) => befehlGeben(spiel, { art, gegenstandId: gegenstand.id });

test("Fluch: zeigt sich beim Anlegen; dann kein Ablegen, Fallenlassen, Werfen oder Wegtauschen", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const fluchring = gegenstandTragen(spiel, ninkasi, structuredClone(VERFLUCHT));
  const ring = gegenstandTragen(spiel, ninkasi, structuredClone(RING));
  assert.equal(fluchring.fluchBekannt, undefined, "vor dem Anlegen unbekannt");
  assert.equal(geben(spiel, "anlegen", fluchring).ok, true);
  assert.equal(fluchring.fluchBekannt, true);
  assert.ok(meldungen.some((meldung) => meldung.art === "fluch_entdeckt"));
  assert.equal(geben(spiel, "ablegen", fluchring).grund, "verflucht");
  assert.equal(geben(spiel, "fallenlassen", fluchring).grund, "verflucht");
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: fluchring.id, ziel: { x: 3, y: 1 } }).grund, "verflucht");
  assert.equal(geben(spiel, "anlegen", ring).grund, "verflucht", "der einzige Fingerplatz bleibt belegt");
  assert.equal(geben(spiel, "fallenlassen", ring).ok, true, "nicht Angelegtes geht ohne Weiteres");
});

test("Fluch aufheben: danach lässt sich der Gegenstand ablegen", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const fluchring = gegenstandTragen(spiel, ninkasi, structuredClone(VERFLUCHT));
  geben(spiel, "anlegen", fluchring);
  effektAnwenden(spiel, "weihwasser", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(fluchring.verflucht, undefined);
  assert.ok(meldungen.some((meldung) => meldung.art === "fluch_aufgehoben"));
  assert.equal(geben(spiel, "ablegen", fluchring).ok, true);
});

test("Etiketten: je Typ eines der Gruppe, verschieden, je Startwert wiederholbar und zwischen Läufen verschieden", () => {
  const zuordnung = (startwert) => aufstellen(startwert).spiel.zustand.wissen.etiketten;
  const erste = zuordnung(1);
  assert.ok(ETIKETTEN.biere.includes(erste.testhell) && ETIKETTEN.biere.includes(erste.testdunkel));
  assert.notEqual(erste.testhell, erste.testdunkel);
  assert.ok(ETIKETTEN.ringe.includes(erste.testring));
  assert.deepEqual(zuordnung(1), erste, "derselbe Startwert, dieselbe Zuordnung");
  const verschieden = [2, 3, 4, 5, 6, 7, 8, 9].some((startwert) => JSON.stringify(zuordnung(startwert)) !== JSON.stringify(erste));
  assert.ok(verschieden, "andere Läufe, andere Etiketten");
});

test("Unbekannt: der Gegenstand trägt sein Etikett, der Bezug nennt es, die Anzeige zeigt es", () => {
  const { spiel } = aufstellen();
  const bier = neu(spiel, "testhell", { position: { x: 2, y: 1 } });
  const etikett = spiel.zustand.wissen.etiketten.testhell;
  assert.equal(bier.etikett, etikett);
  assert.equal(bezugAuf(bier).etikett, etikett);
  const texte = erstelleTexte({ [etikett]: "Etikett", "g.testhell": "Hell" }, erstelleGrammatik(grammatik));
  assert.equal(texte.nomenForm(bezugAuf(bier)), "Etikett");
});

test("Trinken erkennt die ganze Art sofort, auch was anderswo liegt; nur Ninkasi lernt", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const bier = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testhell), typ: "testhell" });
  const amBoden = neu(spiel, "testhell", { position: { x: 4, y: 2 } });
  const anderes = neu(spiel, "testdunkel", { position: { x: 4, y: 2 } });
  assert.ok(bier.etikett);
  geben(spiel, "trinken", bier);
  assert.equal(istUnbekannt(spiel.zustand, "testhell"), false);
  assert.equal(amBoden.etikett, undefined);
  assert.ok(anderes.etikett, "eine andere Art bleibt unbekannt");
  const meldung = meldungen.find((eintrag) => eintrag.art === "erkannt");
  assert.deepEqual([meldung.vorher.text, meldung.was.text], [spiel.zustand.wissen.etiketten.testhell, "g.testhell"]);
  assert.equal(neu(spiel, "testhell").etikett, undefined, "Neues dieser Art kommt schon erkannt");

  const gegner = wesen(spiel, 3, 1, "feinde", 10, { inventar: [] });
  const fremdes = gegenstandTragen(spiel, gegner, { ...structuredClone(GEGENSTAENDE.testdunkel), typ: "testdunkel" });
  befehlAusfuehren(spiel, gegner, { art: "trinken", gegenstandId: fremdes.id });
  assert.equal(istUnbekannt(spiel.zustand, "testdunkel"), true, "ein Gegner verrät nichts");
});

test("Benutzen: die Chance steigt mit der Vertrautheit, angelegter Schmuck je Welttick", () => {
  assert.deepEqual(erkennenChance(1, 0, 9), { zaehler: 1, nenner: 10 });
  assert.deepEqual(erkennenChance(9, 0, 9), { zaehler: 9, nenner: 18 }, "nach 9 Benutzungen die Hälfte");
  assert.deepEqual(erkennenChance(1, 9, 10), { zaehler: 10, nenner: 20 }, "Kennerschaft hilft");

  const { spiel, ninkasi } = aufstellen();
  const schwer = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testring), typ: "testring" });
  const leicht = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testleichtring), typ: "testleichtring" });
  geben(spiel, "anlegen", schwer);
  weltLaufenLassen(spiel, 300);
  assert.equal(spiel.zustand.wissen.vertrautheit.testring, 3, "drei Weltticks angelegt");
  assert.equal(spiel.zustand.wissen.vertrautheit.testleichtring, undefined, "im Gepäck zählt nichts");
  assert.equal(istUnbekannt(spiel.zustand, "testring"), true, "bei dieser Schwierigkeit noch nicht");

  ninkasi.ausgeruestet = [leicht.id]; // getauscht, ohne dass Ninkasi am Zug sein muss
  weltLaufenLassen(spiel, 400);
  assert.equal(istUnbekannt(spiel.zustand, "testleichtring"), false, "Schwierigkeit 0: sicher nach dem ersten Welttick");
});

test("Benutzen: eine Waffe wird je Angriff vertrauter", () => {
  const { spiel, ninkasi } = aufstellen();
  const klinge = gegenstandTragen(spiel, ninkasi, { ...structuredClone(GEGENSTAENDE.testklinge), typ: "testklinge" });
  geben(spiel, "anlegen", klinge);
  wesen(spiel, 2, 1, "feinde", 50);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(spiel.zustand.wissen.vertrautheit.testklinge, 2);
});

test("Aufheben: ohne Kennerschaft kein Wurf, mit Kennerschaft und leichter Art sicher erkannt", () => {
  const { spiel, ninkasi } = aufstellen();
  neu(spiel, "testhell", { position: { x: 1, y: 1 } });
  geben(spiel, "aufheben", {});
  assert.equal(istUnbekannt(spiel.zustand, "testhell"), true);
  ninkasi.kampfwerte = { kennerschaft: 5 };
  neu(spiel, "testdunkel", { position: { x: 1, y: 1 } });
  befehlGeben(spiel, { art: "aufheben" });
  assert.equal(istUnbekannt(spiel.zustand, "testdunkel"), false);
});

test("Datenprüfung: verflucht, unbekannt, etiketten", () => {
  const roh = rohdatenMitTesteintraegen();
  const fehlerMit = (zusatz, etiketten = null) => {
    const daten = structuredClone(roh);
    Object.assign(daten.gegenstaende.testgegenstand, zusatz);
    if (etiketten) daten.etiketten = etiketten;
    return vorbereiten(daten).fehler;
  };
  assert.ok(fehlerMit({ verflucht: true }).some((meldung) => meldung.includes("verflucht wirkt nur an Ausrüstung")));
  assert.ok(fehlerMit({ unbekannt: { gruppe: "gibtsnicht", schwierigkeit: 1 } }).some((meldung) => meldung.includes("unbekannt muss")));
  assert.ok(fehlerMit({ unbekannt: { gruppe: "biere", schwierigkeit: -1 } }).some((meldung) => meldung.includes("schwierigkeit muss")));
  assert.ok(fehlerMit({ unbekannt: { gruppe: "testgruppe", schwierigkeit: 1 } }, { testgruppe: [] }).some((meldung) => meldung.includes("nur 0 Etiketten")));
  assert.ok(fehlerMit({}, { testgruppe: ["e.a", "e.a"] }).some((meldung) => meldung.includes("verschiedener Textschlüssel")));
});
