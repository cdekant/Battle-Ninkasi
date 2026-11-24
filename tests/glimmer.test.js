// Glimmer und Psi-Jägerinnen (systeme/glimmer.js), Filmriss (systeme/stoffwechsel.js, Baustein vergessen in
// systeme/erinnerung.js) und geführte Züge zum Miterleben (kern/spiel.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme, Zustände und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden } from "./hilfen.js";
import { befehlAusfuehren, warteschlangeAbarbeiten, gefuehrterZugSteht, gefuehrtenZugAusfuehren, spielerinAmZug, datenLaden } from "../src/kern/spiel.js";
import { akteurEinreihen, ereignisEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";
import { werteAusDaten, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { alleEntitaeten, entitaetEntfernen } from "../src/kern/zustand.js";
import { zustandSetzen, hatZustand } from "../src/systeme/zustaende.js";
import { glimmerZuwachs, jaegerinFuer, istJaegerin, jaegerinErscheinen } from "../src/systeme/glimmer.js";
import { abstand } from "../src/welt/karte.js";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";

const RAUM = [
  "##############",
  "#............#",
  "#............#",
  "#............#",
  "##############",
];
const EFFEKTE = {
  stich: { schritte: [{ baustein: "schaden", art: "psi", menge: 1 }] },
  zauber: { schritte: [{ baustein: "schaden", art: "magie", menge: 1 }] },
  filmriss: { schritte: [{ baustein: "vergessen" }, { baustein: "zustand_setzen", zustand: "filmriss" }] },
};
const FAEHIGKEITEN = {
  stich: { text: "f.stich", tags: ["psi"], verbrauch: { pp: 10 }, ziel: { art: "wesen", reichweite: 20 }, wirkung: "stich" },
  zauber: { text: "f.zauber", tags: ["magie"], verbrauch: { mp: 10 }, ziel: { art: "wesen", reichweite: 20 }, wirkung: "zauber" },
};
const ZUSTAENDE = { filmriss: { text: "zustand.filmriss", dauer: 500, ki: { modul: "abwarten" } } };
const JAEGERIN = (glimmerAb) => ({
  text: "w.jaegerin", fraktion: "feinde", psiJaegerin: { glimmerAb }, werte: { lp: { grundwert: 10 } },
  ki: { modul: "jagen", letzteBekanntePosition: null }, angriffe: [{ name: "biss", genauigkeit: 100, effekt: "stich" }],
});
// sicherer Wurf, kleiner Abstand für den kleinen Raum
const SICHER = { zuwachs: [[0, 100], [3200, 200]], betreten: [[0, 100]], psi: [[0, 100]], eintreffen: [100, 100], abstand: 5, senkenBeimAuftreten: 33 };

function aufstellen({ glimmer = 0, tiefe = 1, regeln = SICHER, jaegerinnen = { jaegerin: JAEGERIN(30) } } = {}) {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN, zustaende: ZUSTAENDE, wesen: jaegerinnen });
  spiel.daten.regeln.glimmer = regeln;
  spiel.zustand.tiefe = tiefe;
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100 }, pp: { grundwert: 100 }, pegel: { anfangswert: 0 }, glimmer: { anfangswert: glimmer } });
  ninkasi.faehigkeiten = Object.keys(FAEHIGKEITEN);
  ninkasi.sicht = { reichweite: 20 };
  // sichtbar ist die linke Hälfte, die Jägerin erscheint rechts
  spiel.zustand.sichtbareFelder = RAUM.flatMap((zeile, y) => [...zeile].map((_, x) => (x < 7 ? y * zeile.length + x : null))).filter((index) => index !== null);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi };
}

const jaegerinnenIm = (spiel) => alleEntitaeten(spiel.zustand).filter((entitaet) => istJaegerin(spiel, entitaet));

test("Glimmer: nur Psi hebt ihn, um die bezahlten PP mal dem Anteil beim Pegel; der Modifikator glimmer mildert", () => {
  const { spiel, ninkasi } = aufstellen({ tiefe: 0 });
  const ziel = wesen(spiel, 5, 2);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "zauber", ziel: { id: ziel.id } });
  assert.equal(ninkasi.werte.glimmer.aktuell, 0, "Magie lässt den Glimmer in Ruhe");
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: ziel.id } });
  assert.equal(ninkasi.werte.glimmer.aktuell, 10, "nüchtern mal 1");
  ninkasi.werte.pegel.aktuell = 3200;
  assert.equal(glimmerZuwachs(spiel, ninkasi, 10), 20, "ab 32 ‰ mal 2");
  modifikatorHinzufuegen(ninkasi, { ziel: "glimmer", art: "prozent", betrag: -50, quelle: "skill:abschirmen" });
  assert.equal(glimmerZuwachs(spiel, ninkasi, 10), 10);
  assert.equal(glimmerZuwachs(spiel, ninkasi, 0), 0);
});

test("Jägerin: es kommt die mit der höchsten erreichten Schwelle", () => {
  const { spiel } = aufstellen({ jaegerinnen: { schwach: JAEGERIN(30), stark: JAEGERIN(100), vorlage: { ...JAEGERIN(10), abstrakt: true } } });
  assert.equal(jaegerinFuer(spiel, 29), null);
  assert.equal(jaegerinFuer(spiel, 30), "schwach");
  assert.equal(jaegerinFuer(spiel, 150), "stark");
});

test("Jägerin bei Psi: erscheint außer Sicht mit Abstand, kennt Ninkasi, senkt den Glimmer; höchstens eine", () => {
  const { spiel, ninkasi } = aufstellen({ glimmer: 30 });
  const meldungen = meldungenMitschneiden(spiel);
  const ziel = wesen(spiel, 3, 2);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: ziel.id } });
  const [jaegerin, ...weitere] = jaegerinnenIm(spiel);
  assert.ok(jaegerin && !weitere.length);
  assert.ok(abstand(jaegerin.position, ninkasi.position) >= SICHER.abstand);
  assert.deepEqual(jaegerin.ki.vorrang, { anweisung: "angreifen", zielId: ninkasi.id });
  assert.equal(ninkasi.werte.glimmer.aktuell, 40 - 13, "erst +10, dann ein Drittel weniger (abgerundet)");
  assert.ok(meldungen.some((meldung) => meldung.art === "jaegerin_naht"));
  ninkasi.abklingzeiten = {};
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: ziel.id } });
  assert.equal(jaegerinnenIm(spiel).length, 1, "solange eine lebt, kommt keine zweite");
});

test("Jägerin: nicht unter der Schwelle, nicht im Hub, nicht ohne freies Feld außer Sicht", () => {
  const unter = aufstellen({ glimmer: 19 });
  befehlAusfuehren(unter.spiel, unter.ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: wesen(unter.spiel, 3, 2).id } });
  assert.equal(jaegerinnenIm(unter.spiel).length, 0, "29 nach dem Stich, die Schwelle liegt bei 30");

  const hub = aufstellen({ glimmer: 100, tiefe: 0 });
  befehlAusfuehren(hub.spiel, hub.ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: wesen(hub.spiel, 3, 2).id } });
  assert.equal(jaegerinnenIm(hub.spiel).length, 0);

  const allesSichtbar = aufstellen({ glimmer: 100 });
  allesSichtbar.spiel.zustand.sichtbareFelder = Array.from({ length: RAUM.length * RAUM[0].length }, (_, index) => index);
  befehlAusfuehren(allesSichtbar.spiel, allesSichtbar.ninkasi, { art: "faehigkeit", faehigkeit: "stich", ziel: { id: wesen(allesSichtbar.spiel, 3, 2).id } });
  assert.equal(jaegerinnenIm(allesSichtbar.spiel).length, 0);
  assert.equal(allesSichtbar.ninkasi.werte.glimmer.aktuell, 110, "ohne Auftreten sinkt nichts");
});

test("Jägerin: nur auf Feldern, von denen ein Weg zu Ninkasi führt", () => {
  const spiel = miniSpiel(["###########", "#....#....#", "###########"], { effekte: EFFEKTE, faehigkeiten: FAEHIGKEITEN, zustaende: ZUSTAENDE, wesen: { jaegerin: JAEGERIN(30) } });
  spiel.daten.regeln.glimmer = { ...SICHER, abstand: 1 };
  spiel.zustand.tiefe = 1;
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, pp: { grundwert: 100 }, pegel: { anfangswert: 0 }, glimmer: { anfangswert: 30 } });
  spiel.zustand.sichtbareFelder = [1 * 11 + 1];
  for (let i = 0; i < 10; i++) {
    const jaegerin = jaegerinErscheinen(spiel);
    assert.ok(jaegerin.position.x >= 2 && jaegerin.position.x <= 4, `links der Wand, nicht in der Kammer rechts (${jaegerin.position.x})`);
    entitaetEntfernen(spiel.zustand, jaegerin.id);
    ninkasi.werte.glimmer.aktuell = 30;
  }
});

test("Jägerin beim Betreten: das Eintreffen kommt später und verfällt, wenn Ninkasi die Ebene inzwischen verlassen hat", () => {
  const { spiel, ninkasi } = aufstellen({ glimmer: 60 });
  hakenAusloesen(spiel, "ebene_betreten", { quelleId: ninkasi.id, zielId: ninkasi.id, tiefe: 1 });
  const eintrag = spiel.zustand.warteschlange.find((kandidat) => kandidat.ereignistyp === "jaegerin_eintreffen");
  assert.ok(eintrag, "eingeplant");
  assert.equal(eintrag.zeit, spiel.zustand.zeit + 100);
  assert.equal(jaegerinnenIm(spiel).length, 0, "noch nicht da");
  holen("zeitereignisse", "jaegerin_eintreffen")(spiel, eintrag.daten);
  assert.equal(jaegerinnenIm(spiel).length, 1);

  const zweites = aufstellen({ glimmer: 60 });
  hakenAusloesen(zweites.spiel, "ebene_betreten", { quelleId: zweites.ninkasi.id, zielId: zweites.ninkasi.id, tiefe: 1 });
  const verfallen = zweites.spiel.zustand.warteschlange.find((kandidat) => kandidat.ereignistyp === "jaegerin_eintreffen");
  zweites.spiel.zustand.ebeneBetretenUm = zweites.spiel.zustand.zeit + 1; // wieder betreten, ein neuer Besuch
  holen("zeitereignisse", "jaegerin_eintreffen")(zweites.spiel, verfallen.daten);
  assert.equal(jaegerinnenIm(zweites.spiel).length, 0);
});

function trinkerinMitFilmriss(spiel, ninkasi, { chance = [[0, 100]] } = {}) {
  ninkasi.stoffwechsel = { filmriss: { alleTicks: 1, chance, effekt: "filmriss" } };
  ninkasi.werte.pegel.aktuell = 4000;
}

test("Filmriss: außerhalb des Kampfes vergisst Ninkasi die Karte bis auf das Sichtbare und wird geführt", () => {
  const { spiel, ninkasi } = aufstellen({ tiefe: 0 });
  trinkerinMitFilmriss(spiel, ninkasi);
  spiel.zustand.sichtbareFelder = [ninkasi.position.y * RAUM[0].length + ninkasi.position.x];
  holen("welttick", "stoffwechsel")(spiel);
  assert.ok(hatZustand(ninkasi, "filmriss"));
  const ebene = spiel.zustand.ebene;
  const erinnert = ebene.erinnerung.map((kennung, index) => (kennung === null ? null : index)).filter((index) => index !== null);
  assert.deepEqual(erinnert, spiel.zustand.sichtbareFelder);
  assert.equal(ebene.erkundet.every((wert) => wert === 1), true, "erkundet bleibt");
});

test("Filmriss: nicht im Kampf, nicht ohne Chance; rausch.filmriss mildert", () => {
  const imKampf = aufstellen({ tiefe: 0 });
  trinkerinMitFilmriss(imKampf.spiel, imKampf.ninkasi);
  imKampf.ninkasi.kampfZuletzt = imKampf.spiel.zustand.zeit;
  holen("welttick", "stoffwechsel")(imKampf.spiel);
  assert.equal(hatZustand(imKampf.ninkasi, "filmriss"), false, "im Kampf hält das Adrenalin");

  const gemildert = aufstellen({ tiefe: 0 });
  trinkerinMitFilmriss(gemildert.spiel, gemildert.ninkasi);
  modifikatorHinzufuegen(gemildert.ninkasi, { ziel: "rausch.filmriss", art: "prozent", betrag: -100, quelle: "skill:standfestigkeit" });
  holen("welttick", "stoffwechsel")(gemildert.spiel);
  assert.equal(hatZustand(gemildert.ninkasi, "filmriss"), false);
});

test("Geführte Züge: mit fuehrungZeigen hält die Warteschlange davor an, ohne läuft sie durch; dieselbe Folge", () => {
  const ablauf = (zeigen) => {
    const { spiel, ninkasi } = aufstellen({ tiefe: 0 });
    spiel.fuehrungZeigen = zeigen;
    zustandSetzen(spiel, ninkasi, "filmriss");
    const zeiten = [];
    meldungenMitschneiden(spiel);
    warteschlangeAbarbeiten(spiel);
    let halte = 0;
    while (gefuehrterZugSteht(spiel)) {
      halte++;
      zeiten.push(spiel.zustand.zeit);
      gefuehrtenZugAusfuehren(spiel);
    }
    return { halte, zeit: spiel.zustand.zeit, amZug: spielerinAmZug(spiel), filmriss: hatZustand(ninkasi, "filmriss") };
  };
  const gezeigt = ablauf(true), durch = ablauf(false);
  assert.ok(gezeigt.halte > 1, "jeder geführte Zug ein Halt");
  assert.equal(durch.halte, 0);
  assert.deepEqual([gezeigt.zeit, gezeigt.amZug, gezeigt.filmriss], [durch.zeit, durch.amZug, durch.filmriss]);
  assert.deepEqual([durch.amZug, durch.filmriss], [true, false], "danach ist Ninkasi wieder selbst am Zug");
});

test("Grundgerüst: Ninkasi hat Glimmer und Filmriss, die Regeln des Glimmers sind gültig", () => {
  const daten = datenLaden(rohdaten, { texte });
  const ninkasi = daten.wesen.ninkasi;
  assert.equal(ninkasi.werte.glimmer.anfangswert, 0);
  assert.equal(ninkasi.stoffwechsel.filmriss.effekt, "filmriss");
  assert.ok(daten.zustaende.filmriss.ki);
  assert.ok(jaegerinFuer({ daten }, 30), "der Probeinhalt bringt eine Jägerin ab 30");
});
