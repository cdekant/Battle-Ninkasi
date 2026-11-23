// Spielart "arena" (src/systeme/arena.js), Taktik (src/ki/taktik.js), automatischer Kampf (src/eingabe/arenakampf.js),
// Wahl der Arena (src/eingabe/arenawahl.js), Endfenster in der Arena und das Werkzeug werkzeuge/arena.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { rohdaten, texteDe } from "../src/inhalt.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { vorbereiten } from "../src/kern/daten.js";
import { spielerin, alleEntitaeten, istWesen } from "../src/kern/zustand.js";
import { todVormerken } from "../src/kern/raumindex.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { meldungenMitschneiden, rohdatenMitTesteintraegen } from "./hilfen.js";
import { istArena, aufstellungAus, feindeInDerArena } from "../src/systeme/arena.js";
import { stufeVon } from "../src/systeme/skills.js";
import { abstand } from "../src/welt/karte.js";
import { taktikbefehl } from "../src/ki/taktik.js";
import { arenakampfBeginnen, naechsterArenaschritt } from "../src/eingabe/arenakampf.js";
import { arenawahlOeffnen, arenawahlTaste, arenenListe } from "../src/eingabe/arenawahl.js";
import { laeufeTaste } from "../src/eingabe/titel.js";
import { endeTaste, endeOeffnen, endeEintraege, ENDE_EINTRAEGE } from "../src/eingabe/menue.js";
import { neueChronik, meldungZaehlen, laufEintragen, zaehltMit } from "../src/eingabe/chronik.js";
import { kurzformLesen, kampfAusfuehren, wilson, quantil, auswerten, variantenpaare } from "../werkzeuge/arena.js";

const daten = datenLaden(rohdaten, { texte: texteDe });
const arena = (aufstellung, startwert = 3) => neuesSpiel(daten, startwert, { spielart: "arena", arena: aufstellung });
const feinde = (spiel) => feindeInDerArena(spiel);

// Alle Feinde fallen lassen und den Vorgang abschließen (Tod und Wellen sind Zustandsprüfungen)
function welleBesiegen(spiel) {
  for (const feind of feinde(spiel)) {
    feind.werte.lp.aktuell = 0;
    todVormerken(spiel.zustand, feind);
  }
  vorgangAbschliessen(spiel);
}

test("Arena: Aufstellung mit Start, Eigenschaften, Skills, Gepäck, Ausrüstung und Werten; die erste Welle steht gegenüber und jagt", () => {
  const spiel = arena({
    karte: "arena_offen", abstand: 6,
    ninkasi: { eigenschaften: { klugheit: 18 }, skills: { nahkampf_grund: 2 }, gepaeck: [{ typ: "bier", anzahl: 2 }], ausruestung: ["fasshammer"], werte: { lp: 40 } },
    wellen: [[{ typ: "essigbakterium", anzahl: 2 }]],
  });
  const ninkasi = spielerin(spiel.zustand);
  assert.ok(istArena(spiel));
  assert.equal(spiel.zustand.ebene.name, "arena_offen");
  assert.deepEqual(spiel.zustand.plan.tiefen.map((tiefe) => tiefe.vorlage), ["arena_offen"], "nur die Arena, keine Treppen");
  assert.equal(ninkasi.eigenschaften.klugheit, 18);
  assert.equal(stufeVon(spiel, ninkasi, "nahkampf_grund"), 2);
  assert.equal(ninkasi.werte.lp.aktuell, 40);
  const gepaeck = ninkasi.inventar.map((id) => spiel.zustand.entitaeten[id]);
  assert.deepEqual(gepaeck.map((gegenstand) => [gegenstand.typ, gegenstand.anzahl ?? 1]), [["bier", 2], ["fasshammer", 1]]);
  assert.deepEqual(ninkasi.ausgeruestet, [gepaeck[1].id]);
  const gegner = feinde(spiel);
  assert.equal(gegner.length, 2);
  assert.ok(gegner.every((wesen) => (wesen.ki.wachzustand ?? "jagt") === "jagt"));
  assert.deepEqual(spiel.zustand.arena, { welle: 0, wellen: [[{ typ: "essigbakterium", anzahl: 2 }]] });
});

test("Arena: Wellen nacheinander ohne Rast, Sieg nach der letzten; Tod endet sie wie sonst", () => {
  const spiel = arena(aufstellungAus(daten, "fernkaempfer"));
  const meldungen = meldungenMitschneiden(spiel);
  const ninkasi = spielerin(spiel.zustand);
  ninkasi.werte.lp.aktuell = 33;
  welleBesiegen(spiel);
  assert.equal(spiel.zustand.arena.welle, 1);
  assert.equal(feinde(spiel).length, 2, "die zweite Welle");
  assert.equal(ninkasi.werte.lp.aktuell, 33, "keine Rast");
  assert.ok(feinde(spiel).every((wesen) => abstand(wesen.position, ninkasi.position) > 1), "gegenüber, nicht neben Ninkasi");
  assert.ok(spiel.zustand.warteschlange.some((eintrag) => eintrag.akteurId === feinde(spiel)[0].id), "eingereiht");
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "arena_welle").map(({ welle, von }) => [welle, von]), [[2, 2]]);
  welleBesiegen(spiel);
  assert.ok(spiel.zustand.vorbei);
  assert.equal(spiel.zustand.ergebnis, "sieg");
  assert.ok(meldungen.some((meldung) => meldung.art === "arena_sieg"));
  assert.deepEqual(befehlGeben(spiel, { art: "warten" }), { ok: false, grund: "vorbei" });

  const verloren = arena(aufstellungAus(daten, "essigbakterien"));
  const opfer = spielerin(verloren.zustand);
  opfer.werte.lp.aktuell = 0;
  todVormerken(verloren.zustand, opfer);
  vorgangAbschliessen(verloren);
  assert.ok(verloren.zustand.vorbei);
  assert.equal(verloren.zustand.ergebnis, undefined, "Tod ohne Ergebnis Sieg");
});

test("Arena: Wellen aus der Population, alle Einträge einmal oder gezogene Rudel, fest je Startwert", () => {
  const tabelle = daten.populationen.keller.filter((eintrag) => eintrag.tiefe[0] <= 1 && eintrag.tiefe[1] >= 1);
  const alle = arena({ karte: "arena_offen", population: { tabelle: "keller", tiefe: 1, alle: true } });
  assert.deepEqual(alle.zustand.arena.wellen.map((welle) => welle[0].typ), tabelle.map((eintrag) => eintrag.typ));
  const gezogen = (startwert) => arena({ karte: "arena_offen", wellen: [[{ typ: "essigbakterium" }]], population: { tabelle: "keller", tiefe: 1, wellen: 5 } }, startwert).zustand.arena.wellen;
  assert.equal(gezogen(4).length, 6, "erst die festen, dann fünf gezogene");
  assert.deepEqual(gezogen(4), gezogen(4));
  for (const welle of gezogen(4).slice(1)) assert.ok(tabelle.some((eintrag) => eintrag.typ === welle[0].typ));
});

test("Arena: Varianten der Aufstellung, Fehler in Aufstellung und Daten", () => {
  const geruestet = aufstellungAus(daten, "essigbakterien", { ninkasi: "geruestet", gegner: "fuenf" });
  assert.deepEqual(geruestet.varianten, { ninkasi: "geruestet", gegner: "fuenf" });
  assert.deepEqual(geruestet.wellen, [[{ typ: "essigbakterium", anzahl: 5 }]]);
  assert.ok(geruestet.ninkasi.ausruestung.includes("fasshammer"));
  assert.equal(geruestet.text, undefined, "nur die Aufstellung, ohne Text");
  assert.throws(() => aufstellungAus(daten, "gibtesnicht"), /gibt es nicht/);
  assert.throws(() => aufstellungAus(daten, "essigbakterien", { gegner: "hundert" }), /keine Variante/);
  assert.throws(() => arena({ karte: "keller", wellen: [[{ typ: "essigbakterium" }]] }), /feste[rn]? Karte/);
  assert.throws(() => arena({ karte: "arena_offen", wellen: [] }), /braucht wellen oder population/);
  assert.throws(() => arena({ karte: "arena_offen", wellen: [[{ typ: "essigbakterium" }]], ninkasi: { ausruestung: ["bier"] } }), /kein Gegenstand zum Anlegen/);

  const pruefen = (aendern) => {
    const roh = rohdatenMitTesteintraegen();
    aendern(roh);
    return vorbereiten(roh).fehler;
  };
  const erwartet = [
    [(roh) => { roh.arenen.essigbakterien.wellen = [[{ typ: "ninkasi" }]]; }, 'Wesen "ninkasi" gibt es nicht als Gegner'],
    [(roh) => { roh.arenen.essigbakterien.taktik = "zaubern"; }, 'Taktik "zaubern" gibt es nicht'],
    [(roh) => { roh.arenen.essigbakterien.varianten.ninkasi.geuebt = { skills: { gibtesnicht: 2 } }; }, 'varianten.ninkasi.geuebt.skills: Skill "gibtesnicht"'],
    [(roh) => { roh.arenen.essigbakterien.varianten.gegner.drei = { population: { tiefe: 1 } }; }, "braucht wellen oder alle: true"],
    [(roh) => { roh.arenen.essigbakterien.ninkasi = { werte: { mut: 3 } }; }, 'Ninkasi hat keinen Wert "mut"'],
    [(roh) => { roh.arenen.essigbakterien.wachzustand = "traeumt"; }, "wachzustand muss eines von"],
    [(roh) => { roh.taktiken.nahkampf.handlungen = [{ handlung: "zaubern" }]; }, 'Handlung "zaubern" ist nicht angemeldet'],
    [(roh) => { roh.regeln.arena.abstand = 0; }, "regeln.arena.abstand"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});

test("Arena: Nachspielen ergibt denselben Zustand; die Chronik trägt sie ein, zählt aber nicht mit", () => {
  const spiel = arena(aufstellungAus(daten, "keller_reihe"), 9);
  const chronik = neueChronik();
  spiel.hoerer.push((meldung) => meldungZaehlen(chronik, spiel, meldung));
  const taktik = daten.taktiken.fernkampf;
  for (let schritt = 0; schritt < 200 && !spiel.zustand.vorbei; schritt++) befehlGeben(spiel, taktikbefehl(spiel, taktik));
  assert.equal(JSON.stringify(nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel)))).zustand), JSON.stringify(spiel.zustand));
  assert.equal(zaehltMit(spiel), false);
  laufEintragen(chronik, spiel, { ergebnis: spiel.zustand.ergebnis ?? "tod", datum: 0, version: "test" });
  assert.equal(chronik.laeufe[0].spielart, "arena");
  assert.deepEqual(chronik.zaehler, {});
});

test("Taktik: trinkt bei wenig LP, geht zum nächsten Feind außer Sicht, wartet ohne Feinde", () => {
  const spiel = arena({ karte: "arena_offen", taktik: "nahkampf", ninkasi: { gepaeck: [{ typ: "bier" }] }, wellen: [[{ typ: "essigbakterium" }]] });
  const ninkasi = spielerin(spiel.zustand);
  const taktik = daten.taktiken.nahkampf;
  const nah = taktikbefehl(spiel, taktik);
  assert.equal(nah.art, "bewegen", "volle LP: auf den Feind zu");
  ninkasi.werte.lp.aktuell = 30;
  assert.deepEqual(taktikbefehl(spiel, taktik), { art: "trinken", gegenstandId: ninkasi.inventar[0] });
  ninkasi.werte.lp.aktuell = 100;
  spiel.zustand.sichtbareFelder = [];
  assert.equal(taktikbefehl(spiel, taktik).art, "bewegen", "außer Sicht: trotzdem hin");
  for (const feind of feinde(spiel)) delete feind.position;
  assert.deepEqual(taktikbefehl(spiel, taktik), { art: "warten" });
});

test("Automatischer Kampf: nur in der Arena, Schritte nach der Taktik der Aufstellung, hält am Ende", () => {
  assert.deepEqual(arenakampfBeginnen(neuesSpiel(daten, 3)), { grund: "keine_arena" });
  const spiel = arena({ ...aufstellungAus(daten, "essigbakterien"), taktik: "fernkampf" });
  const { ablauf } = arenakampfBeginnen(spiel);
  assert.deepEqual(ablauf, { taktik: "fernkampf" });
  let schritte = 0;
  for (; schritte < 500; schritte++) {
    const schritt = naechsterArenaschritt(spiel, ablauf);
    if (schritt.halt) break;
    assert.ok(befehlGeben(spiel, schritt.befehl).ok, JSON.stringify(schritt.befehl));
  }
  assert.ok(spiel.zustand.vorbei && schritte < 500);
  assert.deepEqual(naechsterArenaschritt(spiel, ablauf), { halt: "vorbei" });
  assert.deepEqual(arenakampfBeginnen(spiel), { grund: "vorbei" });
});

test("Wahl der Arena: Leertaste, Tab und Start auf einem freien Platz oder über die Läufe; Endfenster mit Nochmal", () => {
  const kontext = { daten, plaetze: [null, null, null] };
  let zustand = arenawahlOeffnen();
  zustand = arenawahlTaste(zustand, { code: "ArrowDown" }, kontext).zustand;
  zustand = arenawahlTaste(zustand, { code: "Space" }, kontext).zustand;
  assert.equal(zustand.automatisch, true);
  const zweite = arenenListe(daten)[1];
  const taktiken = Object.keys(daten.taktiken);
  zustand = arenawahlTaste(zustand, { code: "Tab" }, kontext).zustand;
  assert.equal(zustand.taktik, taktiken[(taktiken.indexOf(daten.arenen[zweite].taktik) + 1) % taktiken.length], "nach der Taktik der Arena die nächste");
  assert.deepEqual(arenawahlTaste(zustand, { code: "Enter" }, kontext).aktion, { art: "neuesSpiel", stelle: 0, spielart: "arena", arena: zweite, automatisch: true, taktik: zustand.taktik });
  assert.equal(arenawahlTaste(arenawahlOeffnen(), { code: "Escape" }, kontext).zustand, null);

  const belegt = [{ vorschau: {} }, { vorschau: {} }, { vorschau: {} }];
  const ersetzen = arenawahlTaste(arenawahlOeffnen(), { code: "Enter" }, { daten, plaetze: belegt }).oeffnen;
  assert.equal(ersetzen.art, "laeufe");
  const frage = laeufeTaste(ersetzen.zustand, { code: "Enter" }, { plaetze: belegt }).oeffnen.zustand;
  assert.deepEqual(frage.aktion, { art: "neuesSpiel", stelle: 0, spielart: "arena", arena: arenenListe(daten)[0], automatisch: false, taktik: daten.arenen[arenenListe(daten)[0]].taktik });

  const spiel = arena(aufstellungAus(daten, "essigbakterien"));
  assert.deepEqual(endeEintraege(spiel), ["nochmal", "zum_titel", "verlauf"]);
  assert.deepEqual(endeEintraege(neuesSpiel(daten, 3)), ENDE_EINTRAEGE);
  assert.equal(endeTaste(endeOeffnen(), { code: "Enter" }, { spiel }).aktion, "nochmal");
});

test("Werkzeug: Kurzform, Wilson-Intervall, Quantile, Varianten und ein Kampf aus seinem Startwert", () => {
  assert.deepEqual(kurzformLesen(daten, "3 essigbakterium, fernkaempfer_test / 2 essigbakterium").wellen, [[{ typ: "essigbakterium", anzahl: 3 }, { typ: "fernkaempfer_test", anzahl: 1 }], [{ typ: "essigbakterium", anzahl: 2 }]]);
  assert.equal(kurzformLesen(daten, "drei mal nichts"), null);
  const intervall = wilson(50, 100);
  assert.ok(Math.abs(intervall.unten - 0.4038) < 0.001 && Math.abs(intervall.oben - 0.5962) < 0.001);
  assert.deepEqual(wilson(0, 10).unten, 0);
  assert.equal(quantil([5, 1, 3, 2, 4], 0.5), 3);
  assert.equal(quantil([], 0.5), null);
  assert.equal(variantenpaare(daten, "essigbakterien").length, 9);
  assert.deepEqual(variantenpaare(daten, "essigbakterien", { ninkasi: "nackt", gegner: "drei" }), [{ ninkasi: "nackt", gegner: "drei" }]);
  assert.deepEqual(variantenpaare(daten, "engpass"), [{ ninkasi: null, gegner: null }]);
  const aufstellung = aufstellungAus(daten, "essigbakterien");
  const kampf = kampfAusfuehren(daten, aufstellung, 5);
  assert.deepEqual(kampfAusfuehren(daten, aufstellung, 5), kampf, "derselbe Startwert, derselbe Kampf");
  assert.ok(["sieg", "tod", "patt"].includes(kampf.ausgang));
  assert.ok(kampf.treffer > 0 && kampf.schadenAusgeteilt > 0);
  const auswertung = auswerten([kampf, { ...kampf, ausgang: "tod" }]);
  assert.equal(auswertung.kaempfe, 2);
  assert.equal(auswertung.siegquote, kampf.ausgang === "sieg" ? 0.5 : 0);
});
