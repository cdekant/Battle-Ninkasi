// Zeitskala (siehe docs/Grundlagen.md, Zeit und Tempo): Aktionen ohne Zeit, Betäubung und abnehmende Kontrolle,
// wehrlos, Kampfzustand als Bedingung, Verlangsamung und gefühltes Gewicht der Rüstung, Wechselzeit, Türen
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden, allesSichtbar, rohdatenMitTesteintraegen } from "./hilfen.js";
import { vorbereiten } from "../src/kern/daten.js";
import { befehlGeben, befehlAusfuehren, zeitkosten, spielerinAmZug } from "../src/kern/spiel.js";
import { akteurEinreihen, akteurVerschieben, ersterEintrag } from "../src/kern/zeit.js";
import { neuerZustand } from "../src/kern/zustand.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { holen } from "../src/kern/register.js";
import { bedingungenErfuellt } from "../src/kern/werte.js";
import { kontrollDauer, zustandSetzen, istWehrlos } from "../src/systeme/zustaende.js";
import { trefferwurf } from "../src/systeme/kampf.js";
import { trefferchanceVorschau } from "../src/systeme/vorschau.js";
import { verlangsamungVon } from "../src/systeme/ausruestung.js";
import { lastVon } from "../src/systeme/inventar.js";

const RAUM = ["########", "#......#", "#......#", "########"];
const SEHR_VIEL = 100000;

const EFFEKTE = {
  hieb: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 10 }] },
  sprint: { schritte: [{ baustein: "zustand_setzen", zustand: "sprint" }] },
  betaeuben: { schritte: [{ baustein: "betaeuben", dauer: 200, zustand: "betaeubt" }] },
};
const ZUSTAENDE = {
  sprint: { text: "z.sprint", dauer: 750, modifikatoren: [{ ziel: "kosten.bewegen", art: "prozent", betrag: -50 }] },
  betaeubt: { text: "z.betaeubt", tags: ["kontrolle", "wehrlos"] },
  gefesselt: { text: "z.gefesselt", dauer: 400, tags: ["kontrolle"] },
};
const FAEHIGKEITEN = {
  sprint: { text: "f.sprint", ohneZeit: true, ziel: { art: "selbst" }, wirkung: "sprint" },
  ruhig: { text: "f.ruhig", ohneZeit: true, ziel: { art: "selbst" }, wirkung: "sprint" },
  ritual: { text: "f.ritual", voraussetzungen: [{ bedingung: "ausser_kampf" }], dauer: { schritte: 3 }, ziel: { art: "selbst" }, wirkung: "hieb" },
};

function aufstellen() {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, zustaende: ZUSTAENDE, faehigkeiten: FAEHIGKEITEN });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  Object.assign(ninkasi, { inventar: [], plaetze: { hand: 2, brust: 1, kopf: 1 }, faehigkeiten: ["sprint", "ruhig", "ritual"], kosten: { bewegen: 120 } });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const kontext = (spiel, quelle, ziel) => ({ quelleId: quelle.id, urheberId: quelle.id, zielId: ziel.id, kettentiefe: 0, ursache: "test" });

test("Warteschlange: akteurVerschieben rückt den Eintrag nach hinten, ohne Eintrag null", () => {
  const zustand = neuerZustand(1);
  akteurEinreihen(zustand, 1, 100);
  akteurEinreihen(zustand, 2, 150);
  assert.equal(akteurVerschieben(zustand, 1, 100), 200);
  assert.equal(ersterEintrag(zustand).akteurId, 2);
  assert.equal(akteurVerschieben(zustand, 3, 100), null);
});

test("Ohne Zeit: der Sprint kostet keine Zeit und keinen Zug, eine zweite Aktion ohne Zeit erst nach einer mit Zeit", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "sprint" }).ok, true);
  assert.equal(spiel.zustand.zeit, 0);
  assert.equal(ninkasi.zuege ?? 0, 0);
  assert.ok(spielerinAmZug(spiel), "sofort wieder an der Reihe");
  assert.equal(zeitkosten(spiel, ninkasi, "bewegen"), 60, "Bewegen in der halben Zeit");
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ruhig" }).grund, "schon_ohne_zeit");
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.equal(ersterEintrag(spiel.zustand).zeit, 60);
  assert.equal(ninkasi.zuege, 1);
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "ruhig" }).ok, true);
});

test("Abnehmende Kontrolle: 100, 50 und 25 %, dann immun; nach der Erholung beginnt die Folge neu", () => {
  const { spiel } = aufstellen();
  const ziel = wesen(spiel, 3, 1, "feinde", 50);
  const meldungen = meldungenMitschneiden(spiel);
  assert.deepEqual([kontrollDauer(spiel, ziel, 200), kontrollDauer(spiel, ziel, 200), kontrollDauer(spiel, ziel, 200), kontrollDauer(spiel, ziel, 200)], [200, 100, 50, 0]);
  assert.equal(meldungen.filter((meldung) => meldung.art === "kontrolle_immun").length, 1);
  const { erholung } = spiel.daten.regeln.kontrolle;
  spiel.zustand.zeit = 200 + erholung - 1;
  assert.equal(kontrollDauer(spiel, ziel, 200), 0, "noch nicht erholt");
  spiel.zustand.zeit = 200 + erholung;
  assert.equal(kontrollDauer(spiel, ziel, 200), 200);
});

test("Abnehmende Kontrolle gilt für jeden Zustand mit dem Tag kontrolle", () => {
  const { spiel, ninkasi } = aufstellen();
  const ziel = wesen(spiel, 3, 1, "feinde", 50);
  const erste = zustandSetzen(spiel, ziel, "gefesselt", { quelleId: ninkasi.id });
  assert.equal(erste.ende - erste.beginn, 400);
  ziel.zustaende = [];
  const zweite = zustandSetzen(spiel, ziel, "gefesselt", { quelleId: ninkasi.id, dauer: 300 });
  assert.equal(zweite.ende - zweite.beginn, 150);
  ziel.zustaende = [];
  zustandSetzen(spiel, ziel, "gefesselt", { quelleId: ninkasi.id });
  ziel.zustaende = [];
  assert.equal(zustandSetzen(spiel, ziel, "gefesselt", { quelleId: ninkasi.id }), null, "immun");
});

test("Betäubung: schiebt den nächsten Zug hinaus, wehrlos bis dahin, bricht eine lange Aktion ab", () => {
  const { spiel, ninkasi } = aufstellen();
  const ziel = wesen(spiel, 3, 1, "feinde", 50);
  akteurEinreihen(spiel.zustand, ziel.id, 30);
  ziel.faehigkeiten = ["ritual"];
  ziel.laufendeAktion = { art: "faehigkeit", faehigkeit: "ritual", schritteGesamt: 3, schritteErledigt: 1 };
  const meldungen = meldungenMitschneiden(spiel);
  effektAnwenden(spiel, "betaeuben", kontext(spiel, ninkasi, ziel));
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ziel.id).zeit, 230);
  const instanz = ziel.zustaende.find((kandidat) => kandidat.name === "betaeubt");
  assert.equal(instanz.ende, 230, "bis zum nächsten Zug");
  assert.ok(istWehrlos(spiel, ziel));
  assert.equal(ziel.laufendeAktion, undefined);
  assert.equal(meldungen.find((meldung) => meldung.art === "aktion_abgebrochen").grund, "betaeubt");
  assert.equal(ziel.kontrolle.anzahl, 1, "zählt einmal, nicht noch einmal über den Zustand");
});

test("Betäubung ohne Eintrag (sie handelt gerade): der Aufschub kommt beim Wiedereinreihen dazu", () => {
  const { spiel, ninkasi } = aufstellen();
  const ziel = wesen(spiel, 3, 1, "feinde", 50);
  effektAnwenden(spiel, "betaeuben", kontext(spiel, ninkasi, ziel));
  assert.equal(ziel.aufschub, 200);
  const kosten = befehlAusfuehren(spiel, ziel, { art: "warten" });
  assert.equal(kosten, 100);
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ziel.id).zeit, 300);
  assert.equal(ziel.aufschub, undefined);
});

test("Wehrlos: sicher getroffen und nicht geblockt, aber ohne Krit; die Vorschau zeigt 100 %; Bedingung gegenueber_wehrlos", () => {
  const { spiel, ninkasi } = aufstellen();
  ninkasi.kampfwerte = { kritchance: SEHR_VIEL };
  const ziel = wesen(spiel, 2, 1, "feinde", 50, { kampfwerte: { ausweichen: SEHR_VIEL, blocken: SEHR_VIEL } });
  assert.equal(trefferwurf(spiel, { quelle: ninkasi, ziel, genauigkeit: 10 }).ergebnis, "ausgewichen");
  assert.equal(bedingungenErfuellt(spiel, ninkasi, [{ bedingung: "gegenueber_wehrlos" }], { gegenueberId: ziel.id }), false);
  zustandSetzen(spiel, ziel, "betaeubt", { quelleId: ninkasi.id, dauer: 100, kontrolleGeprueft: true });
  assert.deepEqual(trefferwurf(spiel, { quelle: ninkasi, ziel, genauigkeit: 10 }), { ergebnis: "treffer", kritisch: false, hinterhalt: false, trefferchance: 100 });
  assert.deepEqual(trefferwurf(spiel, { ziel, genauigkeit: 0 }).ergebnis, "treffer", "auch ohne Quelle (Falle)");
  spiel.daten.effekte.angriff = { schritte: [{ baustein: "trefferwurf", genauigkeit: 10, effekt: "hieb" }] };
  assert.deepEqual(trefferchanceVorschau(spiel, ninkasi, ziel, "angriff"), { prozent: 100 });
  assert.equal(bedingungenErfuellt(spiel, ninkasi, [{ bedingung: "gegenueber_wehrlos" }], { gegenueberId: ziel.id }), true);
});

test("Kampfzustand als Voraussetzung: ausser_kampf und im_kampf", () => {
  const { spiel, ninkasi } = aufstellen();
  const pruefen = () => holen("befehle", "faehigkeit").pruefen(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "ritual" });
  assert.equal(pruefen(), null);
  assert.equal(bedingungenErfuellt(spiel, ninkasi, [{ bedingung: "im_kampf" }]), false);
  ninkasi.kampfZuletzt = spiel.zustand.zeit;
  assert.equal(pruefen(), "voraussetzung");
  assert.equal(bedingungenErfuellt(spiel, ninkasi, [{ bedingung: "im_kampf" }]), true);
  spiel.zustand.zeit += spiel.daten.regeln.kampf.nachwirkung;
  assert.equal(pruefen(), null);
});

const LEDER = { typ: "leder", text: "g.leder", gewicht: 2000, tags: ["ruestung_leicht"], ausruestung: { platz: "brust", zeit: 200, verlangsamung: 6 } };
const HELM = { typ: "helm", text: "g.helm", gewicht: 1000, tags: ["ruestung_schwer"], ausruestung: { platz: "kopf", verlangsamung: 10 } };
const DOLCH = { typ: "dolch", text: "g.dolch", ausruestung: { platz: "hand", zeit: 50 } };
const ZWEIHAENDER = { typ: "zweihaender", text: "g.zweihaender", ausruestung: { platz: "hand", belegt: 2, zeit: 150 } };

test("Rüstung verlangsamt jede Aktion; Modifikatoren je Tag mindern das und das gefühlte Gewicht, nie unter 0", () => {
  const { spiel, ninkasi } = aufstellen();
  const leder = gegenstandTragen(spiel, ninkasi, structuredClone(LEDER));
  const helm = gegenstandTragen(spiel, ninkasi, structuredClone(HELM));
  assert.equal(lastVon(spiel, ninkasi), 3000);
  ninkasi.ausgeruestet = [leder.id, helm.id];
  assert.equal(verlangsamungVon(spiel, ninkasi), 16);
  assert.equal(zeitkosten(spiel, ninkasi, "warten"), 116);
  assert.equal(zeitkosten(spiel, ninkasi, "bewegen"), 139, "120 + 16 %");
  ninkasi.modifikatoren = [
    { ziel: "verlangsamung.ruestung_leicht", art: "prozent", betrag: -50, quelle: "test" },
    { ziel: "verlangsamung.ruestung_schwer", art: "plus", betrag: -20, quelle: "test" },
    { ziel: "gewicht.ruestung_leicht", art: "prozent", betrag: -50, quelle: "test" },
  ];
  assert.equal(verlangsamungVon(spiel, ninkasi), 3);
  assert.equal(lastVon(spiel, ninkasi), 2000, "die Lederrüstung fühlt sich halb so schwer an");
  ninkasi.ausgeruestet = [helm.id];
  assert.equal(lastVon(spiel, ninkasi), 3000, "im Gepäck zählt das volle Gewicht");
});

test("Wechselzeit: jedes Stück kostet seine zeit, ein Tausch die Summe; ohne zeit die Kosten der Trägerin", () => {
  const { spiel, ninkasi } = aufstellen();
  const ersterDolch = gegenstandTragen(spiel, ninkasi, structuredClone(DOLCH));
  const zweiterDolch = gegenstandTragen(spiel, ninkasi, structuredClone(DOLCH));
  const zweihaender = gegenstandTragen(spiel, ninkasi, structuredClone(ZWEIHAENDER));
  const helm = gegenstandTragen(spiel, ninkasi, structuredClone(HELM));
  const kosten = (art, gegenstand) => befehlAusfuehren(spiel, ninkasi, { art, gegenstandId: gegenstand.id });
  assert.equal(kosten("anlegen", ersterDolch), 50);
  assert.equal(kosten("anlegen", zweiterDolch), 50);
  assert.equal(kosten("anlegen", zweihaender), 250, "150 + zweimal 50 fürs Ablegen");
  assert.equal(kosten("ablegen", zweihaender), 150);
  assert.equal(kosten("anlegen", helm), 110, "die Vorgabe 100, dazu die Verlangsamung des Helms");
});

test("Tür: der Schritt auf eine geschlossene Tür kostet den Aufschlag auf die eigenen Grundkosten", () => {
  const spiel = miniSpiel(["#####", "#.+.#", "#####"], { effekte: EFFEKTE, zustaende: ZUSTAENDE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.kosten = { bewegen: 120 };
  allesSichtbar(spiel);
  const aufschlag = spiel.daten.gelaende.tuer_zu.tuer.aufschlag;
  assert.equal(befehlAusfuehren(spiel, ninkasi, { art: "bewegen", dx: 1, dy: 0 }), Math.round((120 * (100 + aufschlag)) / 100));
  assert.equal(befehlAusfuehren(spiel, ninkasi, { art: "bewegen", dx: 1, dy: 0 }), 120, "aus der offenen Tür heraus ohne Aufschlag");
});

test("Datenprüfung: ohneZeit, Wechselzeit, Verlangsamung, Aufschlag der Tür, Regeln der Kontrolle", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(pruefen(() => {}), []);
  const erwartet = [
    [(daten) => { daten.faehigkeiten.testritual.ohneZeit = true; }, "ohneZeit gibt es nicht mit dauer"],
    [(daten) => { daten.faehigkeiten.testgeschoss.ohneZeit = "ja"; }, "ohneZeit"],
    [(daten) => { daten.gegenstaende.testkeule.ausruestung.zeit = 0; }, "zeit muss eine ganze Zahl > 0 sein"],
    [(daten) => { daten.gegenstaende.testkeule.ausruestung.verlangsamung = -5; }, "verlangsamung muss"],
    [(daten) => { daten.gelaende.testtuer.tuer = { offen: "boden", aufschlag: -10 }; }, "aufschlag muss"],
    [(daten) => { daten.gelaende.testtuer.tuer = { zu: "boden", aufschlag: 10 }; }, "tuer muss"],
    [(daten) => { daten.regeln.kontrolle = { stufen: [100, -50], erholung: 1000 }; }, "regeln.kontrolle.stufen"],
    [(daten) => { delete daten.regeln.kontrolle; }, "regeln.kontrolle.erholung"],
    [(daten) => { daten.effekte.testeffekt.schritte = [{ baustein: "betaeuben", dauer: 100 }]; }, "zustand"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
