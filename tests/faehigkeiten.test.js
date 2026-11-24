import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, meldungenMitschneiden, gegenstandTragen, weltLaufenLassen } from "./hilfen.js";
import { befehlAusfuehren } from "../src/kern/spiel.js";
import { holen } from "../src/kern/register.js";
import { werteAusDaten, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { zeitBisBereit, risikoWuerfeln, faehigkeitenVon, herkunftDer } from "../src/systeme/faehigkeiten.js";
import { rohdatenMitTesteintraegen, spielerinSetzen, allesSichtbar } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { vorbereiten } from "../src/kern/daten.js";
import { positionSetzen } from "../src/kern/zustand.js";

const KARTE = [
  "##########",
  "#........#",
  "#........#",
  "#........#",
  "##########",
];

const EFFEKTE = {
  spritzer: { schritte: [{ baustein: "schaden", art: "saeure", menge: 5 }] },
  rueckschlag: { schritte: [{ baustein: "schaden", art: "psi", menge: 3 }] },
  vampirbiss: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 6 }, { baustein: "heilen", menge: { aus: "summeSchaden", prozent: 50 }, auf: "quelle" }] },
};

const FAEHIGKEITEN = {
  spucke: { text: "f.spucke", tags: ["magie"], verbrauch: { mp: 10 }, zeit: 150, ziel: { art: "geschoss", reichweite: 5 }, wirkung: "spritzer" },
  flaeche: { text: "f.flaeche", ziel: { art: "feld", reichweite: 6, muster: { art: "kreis", radius: 1 }, trifft: "feinde" }, wirkung: "spritzer" },
  langsam: { text: "f.langsam", abklingzeit: 200, ziel: { art: "wesen", reichweite: 5 }, wirkung: "spritzer" },
  nuechtern: { text: "f.nuechtern", voraussetzungen: [{ bedingung: "pegel_unter", wert: 50 }], ziel: { art: "selbst" }, wirkung: "spritzer" },
  hopfenzauber: { text: "f.hopfen", material: [{ typ: "hopfen", anzahl: 2 }], ziel: { art: "selbst" }, wirkung: "spritzer" },
  gedanke: { text: "f.gedanke", tags: ["psi"], verbrauch: { pp: 5 }, risiko: "psi", ziel: { art: "wesen", reichweite: 5 }, wirkung: "spritzer" },
  schild: { text: "f.schild", art: "aufrecht", verbrauch: { mp: 5 }, zustand: "schild" },
};

const ZUSTAENDE = {
  schild: { text: "z.schild", unterhalt: { mp: 4 }, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }] },
  verwirrt: { text: "z.verwirrt", befehl: { veraenderer: "ziel_verfehlen", chance: 100 } },
};

const RISIKEN = {
  psi: [
    { name: "fehlschlag", chance: [[0, 100], [100, 0]], wirkt: false },
    { name: "rueckschlag", chance: [[0, 0], [100, 0], [200, 100]], wirkt: false, effekt: "rueckschlag" },
  ],
};

function aufstellen() {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN, zustaende: ZUSTAENDE, risiken: RISIKEN });
  const hexe = wesen(spiel, 1, 2, "hefen", 50, {
    werte: werteAusDaten({ lp: { grundwert: 50 }, mp: { grundwert: 100 }, pp: { grundwert: 100 }, pegel: { anfangswert: 0 } }),
    faehigkeiten: Object.keys(FAEHIGKEITEN), inventar: [],
  });
  const feind = wesen(spiel, 4, 2, "bakterien", 20);
  return { spiel, hexe, feind };
}

const pruefen = (spiel, akteur, befehl) => holen("befehle", "faehigkeit").pruefen(spiel, akteur, befehl);
const benutzen = (faehigkeit, ziel) => ({ art: "faehigkeit", faehigkeit, ziel });

test("Fähigkeit: Verbrauch nach Modifikatoren, Wirkung am Ziel, Zeit mit den Tags", () => {
  const { spiel, hexe, feind } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  modifikatorHinzufuegen(hexe, { ziel: "verbrauch.mp", tag: "magie", art: "prozent", betrag: -50, quelle: "test" });
  modifikatorHinzufuegen(hexe, { ziel: "kosten.faehigkeit", tag: "magie", art: "plus", betrag: -50, quelle: "test" });
  const kosten = befehlAusfuehren(spiel, hexe, benutzen("spucke", { id: feind.id }));
  assert.equal(hexe.werte.mp.aktuell, 95);
  assert.equal(feind.werte.lp.aktuell, 15);
  assert.equal(kosten, 100, "150 - 50");
  assert.deepEqual(feind.letzterVerlust.mittel, { art: "faehigkeit", name: "spucke" });
  assert.ok(meldungen.some((meldung) => meldung.art === "geschoss"));
  assert.equal(meldungen.find((meldung) => meldung.art === "faehigkeit").faehigkeit, "spucke");
});

test("Fähigkeit: Gründe der Ablehnung", () => {
  const { spiel, hexe, feind } = aufstellen();
  assert.equal(pruefen(spiel, hexe, benutzen("gibt_es_nicht")), "nicht_gelernt");
  hexe.faehigkeiten = ["spucke"];
  assert.equal(pruefen(spiel, hexe, benutzen("flaeche", { x: 4, y: 2 })), "nicht_gelernt");
  hexe.faehigkeiten = Object.keys(FAEHIGKEITEN);
  hexe.werte.mp.aktuell = 9;
  assert.equal(pruefen(spiel, hexe, benutzen("spucke", { id: feind.id })), "zu_wenig_mp");
  hexe.werte.mp.aktuell = 100;
  assert.equal(pruefen(spiel, hexe, benutzen("spucke", { id: feind.id })), null);
  positionSetzen(spiel.zustand, feind, { x: 8, y: 2 });
  assert.equal(pruefen(spiel, hexe, benutzen("spucke", { id: feind.id })), "zu_weit");
  hexe.werte.pegel.aktuell = 80;
  assert.equal(pruefen(spiel, hexe, benutzen("nuechtern")), "voraussetzung");
  hexe.werte.pegel.aktuell = 0;
  assert.equal(pruefen(spiel, hexe, benutzen("nuechtern")), null);
});

test("Abklingzeit läuft in Weltzeit ab dem Wirken, eigene Züge beschleunigen sie nicht", () => {
  const { spiel, hexe, feind } = aufstellen();
  const beginn = spiel.zustand.zeit;
  befehlAusfuehren(spiel, hexe, benutzen("langsam", { id: feind.id }));
  assert.equal(zeitBisBereit(spiel, hexe, "langsam"), 200);
  assert.equal(pruefen(spiel, hexe, benutzen("langsam", { id: feind.id })), "abklingend");
  befehlAusfuehren(spiel, hexe, { art: "warten" });
  befehlAusfuehren(spiel, hexe, { art: "warten" });
  assert.equal(pruefen(spiel, hexe, benutzen("langsam", { id: feind.id })), "abklingend", "Züge ohne vergangene Weltzeit zählen nicht");
  spiel.zustand.zeit = beginn + 199;
  assert.equal(zeitBisBereit(spiel, hexe, "langsam"), 1);
  spiel.zustand.zeit = beginn + 200;
  assert.equal(pruefen(spiel, hexe, benutzen("langsam", { id: feind.id })), null);
  modifikatorHinzufuegen(hexe, { ziel: "abklingzeit", art: "plus", betrag: -200, quelle: "test" });
  befehlAusfuehren(spiel, hexe, benutzen("langsam", { id: feind.id }));
  assert.equal(zeitBisBereit(spiel, hexe, "langsam"), 0);
});

test("Material wird aus dem Inventar verbraucht", () => {
  const { spiel, hexe } = aufstellen();
  const hopfen = gegenstandTragen(spiel, hexe, { typ: "hopfen" });
  assert.equal(pruefen(spiel, hexe, benutzen("hopfenzauber")), "material_fehlt");
  const zweiter = gegenstandTragen(spiel, hexe, { typ: "hopfen" });
  const anderes = gegenstandTragen(spiel, hexe, { typ: "bier" });
  befehlAusfuehren(spiel, hexe, benutzen("hopfenzauber"));
  assert.deepEqual(hexe.inventar, [anderes.id]);
  assert.equal(spiel.zustand.entitaeten[hopfen.id], undefined);
  assert.equal(spiel.zustand.entitaeten[zweiter.id], undefined);
});

test("Muster: die Wirkung trifft jede betroffene Entität", () => {
  const { spiel, hexe, feind } = aufstellen();
  const zweiter = wesen(spiel, 5, 3, "bakterien", 20);
  const freund = wesen(spiel, 4, 1, "hefen", 20);
  befehlAusfuehren(spiel, hexe, benutzen("flaeche", { x: 4, y: 2 }));
  assert.deepEqual([feind.werte.lp.aktuell, zweiter.werte.lp.aktuell, freund.werte.lp.aktuell], [15, 15, 20]);
});

test("Risiko: Ausgänge nach Pegel, der Verbrauch ist bezahlt, Rückschlag trifft die Wirkende", () => {
  const { spiel, hexe, feind } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  befehlAusfuehren(spiel, hexe, benutzen("gedanke", { id: feind.id }));
  assert.equal(hexe.werte.pp.aktuell, 95);
  assert.equal(feind.werte.lp.aktuell, 20, "nüchtern sicherer Fehlschlag");
  assert.equal(meldungen.find((meldung) => meldung.art === "risiko").ausgang, "fehlschlag");
  hexe.werte.pegel.aktuell = 100;
  assert.equal(risikoWuerfeln(spiel, hexe, "psi"), null, "bei 1 ‰ alle Chancen 0, kein Wurf");
  befehlAusfuehren(spiel, hexe, benutzen("gedanke", { id: feind.id }));
  assert.equal(feind.werte.lp.aktuell, 15);
  hexe.werte.pegel.aktuell = 200;
  befehlAusfuehren(spiel, hexe, benutzen("gedanke", { id: feind.id }));
  assert.equal(feind.werte.lp.aktuell, 15);
  assert.equal(hexe.werte.lp.aktuell, 47);
});

test("Aufrechterhalten: Zustand mit Unterhalt je Welttick, endet ohne Vorrat oder beim erneuten Benutzen", () => {
  const { spiel, hexe } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  befehlAusfuehren(spiel, hexe, benutzen("schild"));
  assert.equal(hexe.werte.mp.aktuell, 95);
  assert.equal(hexe.zustaende[0].name, "schild");
  weltLaufenLassen(spiel, 200);
  assert.equal(hexe.werte.mp.aktuell, 87, "zwei Weltticks je 4");
  befehlAusfuehren(spiel, hexe, benutzen("schild"));
  assert.equal(hexe.zustaende, undefined);
  assert.equal(hexe.werte.mp.aktuell, 87, "Beenden kostet nichts");
  befehlAusfuehren(spiel, hexe, benutzen("schild"));
  hexe.werte.mp.aktuell = 5;
  weltLaufenLassen(spiel, 500);
  assert.equal(hexe.zustaende, undefined);
  assert.equal(hexe.werte.mp.aktuell, 1);
  assert.equal(meldungen.filter((meldung) => meldung.art === "zustand_endet").at(-1).grund, "unterhalt");
});

test("ziel_verfehlen: Verwirrung lässt das Ziel auf ein anderes Wesen daneben rutschen", () => {
  const { spiel, hexe, feind } = aufstellen();
  const daneben = wesen(spiel, 5, 2, "bakterien", 20);
  zustandSetzen(spiel, hexe, "verwirrt");
  befehlAusfuehren(spiel, hexe, benutzen("langsam", { id: feind.id }));
  assert.equal(feind.werte.lp.aktuell, 20);
  assert.equal(daneben.werte.lp.aktuell, 15);
  const allein = aufstellen();
  zustandSetzen(allein.spiel, allein.hexe, "verwirrt");
  befehlAusfuehren(allein.spiel, allein.hexe, benutzen("langsam", { id: allein.feind.id }));
  assert.equal(allein.feind.werte.lp.aktuell, 15, "niemand daneben: das Ziel bleibt");
});

test("auf: quelle lässt einen Schritt auf die Quelle wirken (Vampirbiss)", () => {
  const { spiel, hexe, feind } = aufstellen();
  hexe.werte.lp.aktuell = 30;
  effektAnwenden(spiel, "vampirbiss", { quelleId: hexe.id, zielId: feind.id });
  assert.equal(feind.werte.lp.aktuell, 14);
  assert.equal(hexe.werte.lp.aktuell, 33);
});

// Gewährte und gelehrte Fähigkeiten

const GEWAEHRT = {
  effekte: { ...EFFEKTE, gabe: { schritte: [{ baustein: "wert_aendern", wertName: "mp", menge: 1 }] }, spucke_lehren: { schritte: [{ baustein: "faehigkeit_lehren", faehigkeit: "spucke" }] } },
  faehigkeiten: { ...FAEHIGKEITEN, langsam: { ...FAEHIGKEITEN.langsam, abklingzeit: 500 }, eingebung: { text: "f.eingebung", zeit: 100, dauer: { schritte: 3 }, ziel: { art: "selbst" }, wirkung: "gabe" } },
  zustaende: { ...ZUSTAENDE, erleuchtet: { text: "z.erleuchtet", dauer: 150, faehigkeiten: ["eingebung", "langsam"] } },
  risiken: RISIKEN,
};

function gewaehrtAufstellen() {
  const spiel = miniSpiel(KARTE, GEWAEHRT);
  const hexe = wesen(spiel, 1, 2, "hefen", 50, {
    werte: werteAusDaten({ lp: { grundwert: 50 }, mp: { grundwert: 100 } }), faehigkeiten: ["langsam"], inventar: [], plaetze: { hand: 2 },
  });
  const feind = wesen(spiel, 4, 2, "bakterien", 20);
  return { spiel, hexe, feind };
}

const paddel = (spiel, traegerin, faehigkeiten = ["spucke", "schild"]) => gegenstandTragen(spiel, traegerin, { typ: "paddel", ausruestung: { platz: "hand", faehigkeiten } });

test("Gewährt: angelegte Gegenstände und Zustände geben Fähigkeiten, eigene zuerst, jede nur einmal", () => {
  const { spiel, hexe } = gewaehrtAufstellen();
  const stueck = paddel(spiel, hexe);
  assert.deepEqual(faehigkeitenVon(spiel, hexe), ["langsam"], "im Gepäck wirkt nichts");
  befehlAusfuehren(spiel, hexe, { art: "anlegen", gegenstandId: stueck.id });
  zustandSetzen(spiel, hexe, "erleuchtet");
  assert.deepEqual(faehigkeitenVon(spiel, hexe), ["langsam", "spucke", "schild", "eingebung"]);
  assert.deepEqual(hexe.faehigkeiten, ["langsam"], "die eigene Liste bleibt");
  assert.deepEqual(herkunftDer(spiel, hexe, "spucke"), { eigen: false, quellen: [{ faehigkeit: "spucke", quelle: `ausruestung:${stueck.id}`, gegenstandId: stueck.id }] });
  assert.equal(herkunftDer(spiel, hexe, "langsam").eigen, true);
  befehlAusfuehren(spiel, hexe, { art: "ablegen", gegenstandId: stueck.id });
  assert.equal(pruefen(spiel, hexe, benutzen("spucke", { id: 0 })), "nicht_gelernt");
});

test("Gewährt: die Abklingzeit hängt an der Fähigkeit, nicht an der Quelle", () => {
  const { spiel, hexe, feind } = gewaehrtAufstellen();
  hexe.faehigkeiten = [];
  const stueck = paddel(spiel, hexe, ["langsam"]);
  befehlAusfuehren(spiel, hexe, { art: "anlegen", gegenstandId: stueck.id });
  befehlAusfuehren(spiel, hexe, benutzen("langsam", { id: feind.id }));
  befehlAusfuehren(spiel, hexe, { art: "ablegen", gegenstandId: stueck.id });
  befehlAusfuehren(spiel, hexe, { art: "anlegen", gegenstandId: stueck.id });
  assert.equal(pruefen(spiel, hexe, benutzen("langsam", { id: feind.id })), "abklingend", "Ablegen und Anlegen setzt nichts zurück");
});

test("Gewährt: eine aufrechte Fähigkeit endet, wenn ihre Quelle wegfällt", () => {
  const { spiel, hexe } = gewaehrtAufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const stueck = paddel(spiel, hexe);
  befehlAusfuehren(spiel, hexe, { art: "anlegen", gegenstandId: stueck.id });
  befehlAusfuehren(spiel, hexe, benutzen("schild"));
  assert.equal(hexe.zustaende[0].ausFaehigkeit, "schild");
  befehlAusfuehren(spiel, hexe, { art: "ablegen", gegenstandId: stueck.id });
  assert.equal(hexe.zustaende, undefined);
  assert.equal(meldungen.filter((meldung) => meldung.art === "zustand_endet").at(-1).grund, "entfernt");
});

test("Gewährt: eine lange Aktion verpufft, wenn die Fähigkeit vor dem letzten Schritt wegfällt", () => {
  const { spiel } = gewaehrtAufstellen();
  const ninkasi = spielerinSetzen(spiel, 7, 2);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100, anfangswert: 50 } });
  ninkasi.faehigkeiten = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  const meldungen = meldungenMitschneiden(spiel);
  zustandSetzen(spiel, ninkasi, "erleuchtet");
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "eingebung" }).ok, true);
  assert.equal(ninkasi.werte.mp.aktuell, 50, "die Erleuchtung endet nach 150, die Eingebung erst nach dem dritten Schritt");
  assert.equal(meldungen.find((meldung) => meldung.art === "verpufft").grund, "nicht_gelernt");
});

test("faehigkeit_lehren: gelernt ist gelernt, auch wenn sie schon gewährt war; schon eigen bleibt alles", () => {
  const { spiel, hexe, feind } = gewaehrtAufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const stueck = paddel(spiel, hexe);
  befehlAusfuehren(spiel, hexe, { art: "anlegen", gegenstandId: stueck.id });
  effektAnwenden(spiel, "spucke_lehren", { quelleId: hexe.id, zielId: hexe.id });
  assert.deepEqual(hexe.faehigkeiten, ["langsam", "spucke"]);
  befehlAusfuehren(spiel, hexe, { art: "ablegen", gegenstandId: stueck.id });
  assert.deepEqual(faehigkeitenVon(spiel, hexe), ["langsam", "spucke"], "bleibt nach dem Ablegen");
  effektAnwenden(spiel, "spucke_lehren", { quelleId: hexe.id, zielId: hexe.id });
  assert.deepEqual(hexe.faehigkeiten, ["langsam", "spucke"]);
  assert.deepEqual(meldungen.filter((meldung) => meldung.art.startsWith("faehigkeit_")).map((meldung) => meldung.art), ["faehigkeit_gelernt", "faehigkeit_schon_bekannt"]);
  effektAnwenden(spiel, "spucke_lehren", { quelleId: hexe.id, zielId: feind.id });
  assert.equal(feind.faehigkeiten, undefined, "ohne eigene Liste lernt ein Wesen nichts");
});

test("Datenprüfung: gewährte Fähigkeiten, lesbar und faehigkeit_lehren", () => {
  const pruefenDaten = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(pruefenDaten((daten) => {
    daten.gegenstaende.testkeule.ausruestung.faehigkeiten = ["testgeschoss"];
    daten.gegenstaende.testgegenstand.lesbar = { effekt: "testeffekt", bleibt: true };
    daten.effekte.testlehre = { schritte: [{ baustein: "faehigkeit_lehren", faehigkeit: "testritual" }] };
  }), []);
  const erwartet = [
    [(daten) => { daten.gegenstaende.testkeule.ausruestung.faehigkeiten = ["gibt_es_nicht"]; }, 'Fähigkeit "gibt_es_nicht"'],
    [(daten) => { daten.gegenstaende.testkeule.ausruestung.faehigkeiten = "testgeschoss"; }, "faehigkeiten muss"],
    [(daten) => { daten.zustaende[Object.keys(daten.zustaende)[0]].faehigkeiten = ["gibt_es_nicht"]; }, 'Fähigkeit "gibt_es_nicht"'],
    [(daten) => { daten.gegenstaende.testgegenstand.lesbar = { effekt: "gibt_es_nicht" }; }, 'Effekt "gibt_es_nicht"'],
    [(daten) => { daten.gegenstaende.testgegenstand.lesbar = { effekt: "testeffekt", bleibt: "ja" }; }, "bleibt"],
    [(daten) => { daten.gegenstaende.testgegenstand.lesbar = "rolle"; }, "lesbar muss"],
    [(daten) => { daten.gegenstaende.testgegenstand.lesbar = { effekt: "testeffekt" }; delete daten.aktionen.lesen; }, "aktionen.lesen"],
    [(daten) => { daten.effekte.testlehre = { schritte: [{ baustein: "faehigkeit_lehren", faehigkeit: "gibt_es_nicht" }] }; }, 'Fähigkeit "gibt_es_nicht"'],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefenDaten(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
