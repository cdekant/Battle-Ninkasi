// Ausrüstung: Plätze, anlegen und tauschen, Modifikatoren, Waffen statt Faust, Sets, Auslöser, Haken, Inventarfenster
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, allesSichtbar, hakenFuerTest } from "./hilfen.js";
import { befehlGeben, zeitkosten } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { entitaetEntfernen } from "../src/kern/zustand.js";
import { kampfwert, angriffeVon } from "../src/systeme/kampf.js";
import { inventarTaste } from "../src/eingabe/inventar.js";
import { vorbereiten } from "../src/kern/daten.js";

const RAUM = ["#######", "#.....#", "#.....#", "#######"];
const PLAETZE = { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 };
const FAUST = [{ name: "faust", genauigkeit: 80, effekt: "stoss" }];

const EFFEKTE = {
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 2 }] },
  dornen: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 1 }] },
  heil: { schritte: [{ baustein: "heilen", wertName: "lp", menge: 1 }] },
};

const KELLE = { typ: "kelle", text: "g.kelle", ausruestung: { platz: "hand", angriffe: [{ name: "kelle", genauigkeit: 85, effekt: "stoss", kosten: 90 }] } };
const HAMMER = { typ: "hammer", text: "g.hammer", ausruestung: { platz: "hand", belegt: 2, angriffe: [{ name: "hammer", genauigkeit: 70, effekt: "stoss", kosten: 150 }] } };
const SCHUERZE = { typ: "schuerze", text: "g.schuerze", ausruestung: { platz: "brust", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] } };
const SET = { ziel: "willenskraft", art: "plus", betrag: 10, wenn: [{ bedingung: "traegt_tag", tag: "kupfer", anzahl: 2 }] };
const RING = { typ: "ring", text: "g.ring", tags: ["kupfer"], ausruestung: { platz: "finger", modifikatoren: [{ ziel: "willenskraft", art: "plus", betrag: 5 }, SET] } };

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  Object.assign(ninkasi, { inventar: [], plaetze: { ...PLAETZE }, angriffe: FAUST, kampfwerte: { ausweichen: 20 } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const tragen = (spiel, ninkasi, vorlage) => gegenstandTragen(spiel, ninkasi, structuredClone(vorlage));
const geben = (spiel, art, gegenstand) => befehlGeben(spiel, { art, gegenstandId: gegenstand.id });

test("Anlegen: Modifikatoren wirken, solange angelegt; Ablegen nimmt sie wieder weg", () => {
  const { spiel, ninkasi } = aufstellen();
  const schuerze = tragen(spiel, ninkasi, SCHUERZE);
  assert.equal(geben(spiel, "anlegen", schuerze).ok, true);
  assert.deepEqual([kampfwert(spiel, ninkasi, "ruestung"), kampfwert(spiel, ninkasi, "ausweichen")], [2, 15]);
  assert.equal(geben(spiel, "anlegen", schuerze).grund, "schon_angelegt");
  assert.equal(geben(spiel, "ablegen", schuerze).ok, true);
  assert.deepEqual([kampfwert(spiel, ninkasi, "ruestung"), kampfwert(spiel, ninkasi, "ausweichen")], [0, 20]);
  assert.equal(geben(spiel, "ablegen", schuerze).grund, "nicht_angelegt");
  assert.deepEqual(ninkasi.inventar, [schuerze.id], "bleibt im Gepäck");
});

test("Waffen ersetzen die Faust, zwei Waffen sind zwei Profile; der Zweihänder tauscht beide aus und kostet beides", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const ersteKelle = tragen(spiel, ninkasi, KELLE), zweiteKelle = tragen(spiel, ninkasi, KELLE), hammer = tragen(spiel, ninkasi, HAMMER);
  assert.deepEqual(angriffeVon(spiel, ninkasi).map((profil) => profil.name), ["faust"]);
  geben(spiel, "anlegen", ersteKelle);
  assert.deepEqual(angriffeVon(spiel, ninkasi).map((profil) => profil.name), ["kelle"]);
  geben(spiel, "anlegen", zweiteKelle);
  assert.deepEqual(angriffeVon(spiel, ninkasi).map((profil) => profil.name), ["kelle", "kelle"]);
  const ergebnis = holen("befehle", "anlegen").ausfuehren(spiel, ninkasi, { art: "anlegen", gegenstandId: hammer.id });
  assert.equal(ergebnis.grundkosten, 300, "anlegen und zweimal ablegen");
  assert.deepEqual(ninkasi.ausgeruestet, [hammer.id]);
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "abgelegt").length, 2);
  holen("befehle", "ablegen").ausfuehren(spiel, ninkasi, { art: "ablegen", gegenstandId: hammer.id });
  assert.deepEqual(angriffeVon(spiel, ninkasi).map((profil) => profil.name), ["faust"], "wieder mit der Faust");
  assert.ok(zeitkosten(spiel, ninkasi, "anlegen") > 0);
});

test("Ohne passenden Platz kein Anlegen; nur Ausrüstung lässt sich anlegen, nur aus dem Gepäck", () => {
  const { spiel, ninkasi } = aufstellen();
  const hammer = tragen(spiel, ninkasi, HAMMER);
  ninkasi.plaetze = { hand: 1 };
  assert.equal(geben(spiel, "anlegen", hammer).grund, "kein_platz", "ein Zweihänder braucht zwei Hände");
  const stein = tragen(spiel, ninkasi, { typ: "stein", text: "g.stein" });
  assert.equal(geben(spiel, "anlegen", stein).grund, "nicht_anlegbar");
  const fremd = tragen(spiel, wesen(spiel, 5, 2, "feinde", 5, { inventar: [] }), KELLE);
  assert.equal(geben(spiel, "anlegen", fremd).grund, "nicht_im_gepaeck");
});

test("Sets: zwei Kupferteile geben den Bonus, eines nicht", () => {
  const { spiel, ninkasi } = aufstellen();
  const ersterRing = tragen(spiel, ninkasi, RING), zweiterRing = tragen(spiel, ninkasi, RING);
  geben(spiel, "anlegen", ersterRing);
  assert.equal(kampfwert(spiel, ninkasi, "willenskraft"), 5);
  geben(spiel, "anlegen", zweiterRing);
  assert.equal(kampfwert(spiel, ninkasi, "willenskraft"), 30, "je 5 und je 10 aus dem Set");
});

test("Auslöser an der Ausrüstung gelten für die Trägerin; der Haken gegenstand_benutzt meldet Trinken, Anlegen, Ablegen, Werfen", (t) => {
  const { spiel, ninkasi } = aufstellen();
  const dornenpanzer = tragen(spiel, ninkasi, { typ: "panzer", text: "g.panzer", ausruestung: { platz: "brust", ausloeser: [{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }] } });
  const arten = [];
  hakenFuerTest(t, "gegenstand_benutzt", (spiel, kontext) => arten.push(kontext.art));
  geben(spiel, "anlegen", dornenpanzer);
  const angreifer = wesen(spiel, 2, 1, "feinde", 10);
  effektAnwenden(spiel, "stoss", { quelleId: angreifer.id, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(angreifer.werte.lp.aktuell, 9, "der Dornenpanzer sticht zurück");

  const bier = tragen(spiel, ninkasi, { typ: "bier", text: "g.bier", trinkbar: { effekt: "heil" } });
  geben(spiel, "trinken", bier);
  const kelle = tragen(spiel, ninkasi, KELLE);
  geben(spiel, "anlegen", kelle);
  geben(spiel, "ablegen", kelle);
  geben(spiel, "anlegen", kelle);
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: kelle.id, ziel: { x: 4, y: 2 } }).ok, true);
  assert.deepEqual(arten, ["anlegen", "trinken", "anlegen", "ablegen", "anlegen", "werfen"]);
  assert.deepEqual(ninkasi.ausgeruestet, [dornenpanzer.id], "die geworfene Waffe ist nicht mehr angelegt");
});

test("Entfernen und Tod räumen die Ausrüstung mit auf", () => {
  const { spiel, ninkasi } = aufstellen();
  const ring = tragen(spiel, ninkasi, RING);
  geben(spiel, "anlegen", ring);
  entitaetEntfernen(spiel.zustand, ring.id);
  assert.deepEqual([ninkasi.inventar, ninkasi.ausgeruestet], [[], []]);

  const traegerin = wesen(spiel, 4, 2, "feinde", 3, { inventar: [], plaetze: { ...PLAETZE } });
  const kelle = tragen(spiel, traegerin, KELLE);
  holen("befehle", "anlegen").ausfuehren(spiel, traegerin, { art: "anlegen", gegenstandId: kelle.id });
  effektAnwenden(spiel, "stoss", { quelleId: ninkasi.id, zielId: traegerin.id });
  effektAnwenden(spiel, "stoss", { quelleId: ninkasi.id, zielId: traegerin.id });
  vorgangAbschliessen(spiel);
  assert.deepEqual(spiel.zustand.entitaeten[kelle.id].position, { x: 4, y: 2 }, "fällt zu Boden");
});

test("Inventarfenster: wählen, handeln, zurück und schließen", () => {
  const { spiel, ninkasi } = aufstellen();
  const schuerze = tragen(spiel, ninkasi, SCHUERZE);
  const bier = tragen(spiel, ninkasi, { typ: "bier", text: "g.bier", trinkbar: { effekt: "heil" } });
  let fenster = { gewaehlt: null };
  assert.deepEqual(inventarTaste(fenster, "KeyZ", spiel), { fenster }, "an Z liegt nichts");
  fenster = inventarTaste(fenster, "KeyA", spiel).fenster;
  assert.deepEqual(fenster, { gewaehlt: schuerze.id });
  assert.deepEqual(inventarTaste(fenster, "KeyA", spiel), { fenster: null, befehl: { art: "anlegen", gegenstandId: schuerze.id } });
  ninkasi.ausgeruestet = [schuerze.id];
  assert.equal(inventarTaste(fenster, "KeyA", spiel).befehl.art, "ablegen");
  assert.deepEqual(inventarTaste(fenster, "Escape", spiel), { fenster: { gewaehlt: null } });
  assert.deepEqual(inventarTaste({ gewaehlt: null }, "Escape", spiel), { fenster: null });
  assert.deepEqual(inventarTaste({ gewaehlt: bier.id }, "KeyT", spiel).befehl, { art: "trinken", gegenstandId: bier.id });
});

test("Datenprüfung: Plätze an Wesen und Gegenständen, Waffenprofile, Modifikatoren der Ausrüstung", () => {
  const pruefen = (aendern) => {
    const daten = structuredClone(rohdaten);
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.gegenstaende.lederhose.ausruestung.platz = "schwanz"; }, "platz muss eines von"],
    [(daten) => { daten.gegenstaende.fasshammer.ausruestung.belegt = 0; }, "belegt"],
    [(daten) => { daten.gegenstaende.schoepfkelle.ausruestung.angriffe = []; }, "mindestens einem Profil"],
    [(daten) => { daten.gegenstaende.kupferring.ausruestung.modifikatoren = [{ ziel: "ruestung" }]; }, "braucht ziel, art"],
    [(daten) => { daten.wesen.ninkasi.plaetze = { fluegel: 2 }; }, 'Platz "fluegel"'],
    [(daten) => { daten.gegenstaende.kupferring.tags = "kupfer"; }, "tags muss eine Liste"],
    [(daten) => { delete daten.regeln.ausruestung; }, "regeln.ausruestung.plaetze"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
