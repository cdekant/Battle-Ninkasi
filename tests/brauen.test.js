// Brauen (src/systeme/sud.js und src/systeme/brauen.js): Profil aus Zutaten, Verfahren und Kultur, Zielgebiet und Güte,
// Runden, Wirkung beim Trinken, der Befehl am Kessel mit Wurf und Verderben, Ablehnungen, Braufenster und Klickregel
// (src/eingabe/brauen.js, src/eingabe/maus.js) und die Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, meldungenMitschneiden, gegenstandTragen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { zufallErzeugen } from "../src/kern/zufall.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import { profilBerechnen, zielgebietFinden, profilRunden, wirkungBerechnen } from "../src/systeme/sud.js";
import { sudVorbereiten } from "../src/systeme/brauen.js";
import { braufensterOeffnen, brauTaste } from "../src/eingabe/brauen.js";
import { klickDeuten } from "../src/eingabe/maus.js";

const RAUM = [
  "######",
  "#..u.#",
  "#....#",
  "######",
];

const GEGENSTAENDE = {
  ...sude,
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 160, farbe: 8, aromen: { malz: 80, suesse: 20 } } },
  kraut: { text: "g.kraut", aufhebbar: true, stapelbar: true, gewicht: 100, zutat: { art: "gewuerz", bitter: 40, aromen: { kraeuter: 100 } } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
};
const KULTUREN = { hefe: { text: "k.hefe", vergaerung: 75, vertraegt: 90, aromen: { frucht: 10 } } };
const ZIELGEBIETE = {
  weit: { text: "z.weit", familie: "test", spannen: { malz: [0, 100] } },
  helles: { text: "z.helles", familie: "test", spannen: { farbe: [0, 20], malz: [50, 100] }, bonus: 150 },
};
// Kessel ohne Unschärfe: der Sud landet genau in der Mitte der Vorschau
const KESSEL = { kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { fasst: 8, portionen: 4, unschaerfe: 0 } } };

function spielBauen({ regeln = {}, kessel = KESSEL, x = 2, y = 1 } = {}) {
  const spiel = miniSpiel(RAUM, { gelaende: kessel, effekte, gegenstaende: GEGENSTAENDE, kulturen: KULTUREN, zielgebiete: ZIELGEBIETE, regeln: { brauen: { verderben: 0, ...regeln } } });
  const ninkasi = wesen(spiel, x, y, "ninkasi", 100, {
    werte: werteAusDaten({ lp: { grundwert: 100, anfangswert: 50 }, mp: { grundwert: 100, anfangswert: 50 }, pegel: { anfangswert: 0 } }),
    kulturen: ["hefe"], inventar: [],
  });
  spiel.zustand.spielerinId = ninkasi.id;
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const tragen = (spiel, ninkasi, typ, anzahl = 1) => gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
const brauen = (spiel, zutaten, zusatz = {}) => befehlGeben(spiel, { art: "brauen", zutaten, kultur: "hefe", ...zusatz });
const daten = () => spielBauen().spiel.daten;
const VERFAHREN_WARM = { maische: "warm", gewuerz: "frueh" };

test("Profil: Kennzahlen je vollem Kessel, Aromen nach Menge gemittelt, Kultur und Maische kommen dazu", () => {
  const profil = profilBerechnen(daten(), { zutaten: [{ typ: "malz", menge: 8 }], verfahren: VERFAHREN_WARM, kultur: "hefe", fasst: 8 });
  // Vergärung 75 - 10 (warm) = 65 %, Alkohol 160 x 65 % x 50 % = 52; Süße 20 + 10 (warm), Frucht aus der Hefe
  assert.deepEqual(profil, { stammwuerze: 160, alkohol: 52, bittere: 0, farbe: 8, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 });
  const halb = profilBerechnen(daten(), { zutaten: [{ typ: "malz", menge: 4 }], verfahren: VERFAHREN_WARM, kultur: "hefe", fasst: 8 });
  assert.equal(halb.stammwuerze, 80, "halb gefüllt, halb so stark");
});

test("Profil: ohne Kultur kein Alkohol; Gewürz früh bitter, spät Aroma; kühl gemaischt trockener", () => {
  const eingabe = (gewuerz) => ({ zutaten: [{ typ: "malz", menge: 4 }, { typ: "kraut", menge: 2 }], verfahren: { maische: "kuehl", gewuerz }, kultur: null, fasst: 8 });
  const frueh = profilBerechnen(daten(), eingabe("frueh")), spaet = profilBerechnen(daten(), eingabe("spaet"));
  assert.equal(frueh.alkohol, 0);
  assert.deepEqual([frueh.bittere, frueh.kraeuter], [10, 16]);
  assert.deepEqual([spaet.bittere, spaet.kraeuter], [3, 33]);
  assert.equal(frueh.suesse, 3, "13 aus dem Malz, 10 weniger durch die kühle Maische");
});

test("Zielgebiet: das engste gewinnt, Güte 100 in der Mitte und gueteAmRand am Rand; Runden auf die Stufen", () => {
  const profil = { stammwuerze: 160, alkohol: 52, bittere: 0, farbe: 8, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 };
  assert.deepEqual(zielgebietFinden(daten(), profil), { name: "helles", guete: 94 });
  assert.deepEqual(zielgebietFinden(daten(), { ...profil, farbe: 20 }), { name: "helles", guete: 70 });
  assert.deepEqual(zielgebietFinden(daten(), { ...profil, farbe: 30 }).name, "weit");
  assert.equal(zielgebietFinden(daten(), { ...profil, malz: 100, farbe: 30 }).name, "weit");
  assert.deepEqual(profilRunden(daten(), profil), { stammwuerze: 160, alkohol: 50, bittere: 0, farbe: 10, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 });
});

test("Wirkung: Budget aus Stammwürze, Güte und Bonus, anteilig auf die Aromen; Pegel aus dem Alkohol", () => {
  const profil = { stammwuerze: 160, alkohol: 50, bittere: 0, farbe: 10, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 };
  // Budget 160 x 20 % x 90 % x 150 % = 43; Malz 28 und Süße 10 heilen LP, Frucht 3 füllt MP
  assert.deepEqual(wirkungBerechnen(daten(), { profil, zielgebiet: "helles", guete: 90 }), { mengen: { lp: 38, mp: 3 }, pegel: 50, effekt: null });
  const ohneAroma = { ...profil, malz: 0, frucht: 0, suesse: 0 };
  assert.deepEqual(wirkungBerechnen(daten(), { profil: ohneAroma, zielgebiet: null, guete: 100 }).mengen, { lp: 32 }, "alles an wirkungOhneAroma");
});

test("Brauen am Kessel: Zutaten und Gefäße verbraucht, Portionen stapeln mit Namen des Zielgebiets, Trinken wirkt", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 8);
  tragen(spiel, ninkasi, "flasche", 3);
  assert.equal(brauen(spiel, [{ gegenstandId: malz.id, menge: 8 }]).ok, true);
  const gepaeck = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id));
  assert.equal(gepaeck.length, 1, "Malz und Flaschen sind fort");
  const [bier] = gepaeck;
  assert.deepEqual([bier.typ, bier.anzahl, bier.text, bier.wirdZu, bier.gewicht], ["sud", 3, "z.helles", "flasche", 900]);
  assert.deepEqual([bier.sud.zielgebiet, bier.sud.guete, bier.sud.profil.alkohol], ["helles", 90, 50]);
  const meldung = meldungen.find((eintrag) => eintrag.art === "gebraut_getroffen");
  assert.deepEqual([meldung.anzahl, meldung.zielgebiet], [3, "helles"]);
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit, 100, "ein Sud kostet eine Aktion");

  assert.equal(befehlGeben(spiel, { art: "trinken", gegenstandId: bier.id }).ok, true);
  assert.deepEqual([ninkasi.werte.lp.aktuell, ninkasi.werte.mp.aktuell, ninkasi.werte.pegel.aktuell], [88, 53, 50]);
  const typen = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id).typ);
  assert.deepEqual(typen, ["sud", "flasche"], "die Flasche kommt zurück");
});

test("Brauen: der Wurf setzt den Punkt im Bereich der Vorschau, ein verdorbener Sud wird sauer und schwach", () => {
  const { spiel, ninkasi } = spielBauen({ kessel: { kessel: { ...KESSEL.kessel, kessel: { fasst: 8, portionen: 4 } } } });
  const malz = tragen(spiel, ninkasi, "malz", 8);
  tragen(spiel, ninkasi, "flasche", 1);
  const vorschau = sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: malz.id, menge: 8 }], kultur: "hefe" });
  assert.deepEqual(vorschau.bereich.malz, [72, 88]);
  assert.deepEqual(vorschau.erreichbar, ["weit", "helles"]);
  spiel.wurfquelle = { art: "grenzen", mengen: "groesste", zufallszustand: zufallErzeugen(1) };
  brauen(spiel, [{ gegenstandId: malz.id, menge: 8 }]);
  const bier = entitaetMitId(spiel.zustand, ninkasi.inventar[0]);
  assert.equal(bier.sud.profil.malz, 90, "88 gerundet");

  const verdorben = spielBauen({ regeln: { verderben: 100 } });
  const malz2 = tragen(verdorben.spiel, verdorben.ninkasi, "malz", 8);
  tragen(verdorben.spiel, verdorben.ninkasi, "flasche", 1);
  brauen(verdorben.spiel, [{ gegenstandId: malz2.id, menge: 8 }]);
  const sauer = entitaetMitId(verdorben.spiel.zustand, verdorben.ninkasi.inventar[0]);
  assert.deepEqual([sauer.typ, sauer.sud.zielgebiet, sauer.sud.guete, sauer.sud.profil.saeure], ["sud_verdorben", null, 30, 40]);
  assert.ok(verdorben.meldungen.some((eintrag) => eintrag.art === "gebraut_verdorben"));
});

test("Brauen: Ablehnungen", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 10);
  const flasche = tragen(spiel, ninkasi, "flasche", 2);
  const grund = (zutaten, zusatz) => brauen(spiel, zutaten, zusatz).grund;
  const alles = [{ gegenstandId: malz.id, menge: 2 }];
  assert.equal(grund([]), "keine_zutaten");
  assert.equal(grund([{ gegenstandId: flasche.id, menge: 1 }]), "keine_zutat");
  assert.equal(grund([{ gegenstandId: malz.id, menge: 11 }]), "zu_viel");
  assert.equal(grund([{ gegenstandId: malz.id, menge: 9 }]), "kessel_voll");
  assert.equal(grund([{ gegenstandId: malz.id, menge: 1 }, { gegenstandId: malz.id, menge: 1 }]), "ungueltig");
  assert.equal(grund([{ gegenstandId: malz.id, menge: 0 }]), "ungueltig");
  assert.equal(grund(alles, { verfahren: { maische: "lauwarm" } }), "ungueltig");
  assert.equal(grund(alles, { kultur: "fremd" }), "kultur_unbekannt");
  assert.equal(grund(alles, { kessel: { x: 1, y: 1 } }), "kein_kessel");
  ninkasi.kampfZuletzt = spiel.zustand.zeit;
  assert.equal(grund(alles), "im_kampf");
  delete ninkasi.kampfZuletzt;
  ninkasi.inventar = ninkasi.inventar.filter((id) => id !== flasche.id);
  assert.equal(grund(alles), "keine_gefaesse");

  const fern = spielBauen({ x: 1, y: 2 });
  const malz3 = tragen(fern.spiel, fern.ninkasi, "malz", 2);
  assert.equal(brauen(fern.spiel, [{ gegenstandId: malz3.id, menge: 2 }]).grund, "kein_kessel");
});

test("Datenprüfung: Regeln, Kulturen, Zielgebiete, Zutaten, Kessel und Kulturen der Wesen", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "brauen"), "der Inhalt ist gültig");
  assert.ok(!fehlerMit(() => {}, "zielgebiete"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.verfahren.maische = "lauwarm"; }, "regeln.brauen.verfahren"));
  assert.ok(fehlerMit((roh) => { delete roh.regeln.brauen.achsen.farbe; }, "Kennzahl farbe fehlt"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.getraenk = "dolch"; }, "regeln.brauen.getraenk"));
  assert.ok(fehlerMit((roh) => { roh.kulturen.bierhefe.vergaerung = 120; }, "kulturen.bierhefe: vergaerung"));
  assert.ok(fehlerMit((roh) => { roh.zielgebiete.starkes_bier.spannen.alkohol = [90, 80]; }, "zielgebiete.starkes_bier.spannen.alkohol"));
  assert.ok(fehlerMit((roh) => { roh.zielgebiete.starkes_bier.spannen.hopfen = [0, 10]; }, "Achse \"hopfen\""));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.honig.zutat.art = "zucker"; }, "gegenstaende.honig: zutat muss"));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.honig.zutat.aromen.umami = 5; }, "Aromaachse \"umami\""));
  assert.ok(fehlerMit((roh) => { roh.gelaende.tonkessel.kessel.fasst = 0; }, "gelaende.tonkessel: kessel muss"));
  assert.ok(fehlerMit((roh) => { roh.wesen.ninkasi.kulturen = ["kefir"]; }, "Kultur \"kefir\""));
});

test("Braufenster: öffnet nur am Kessel, Buchstaben füllen und leeren, Ziffern wechseln, Enter gibt den Befehl", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 2);
  tragen(spiel, ninkasi, "kraut", 1);
  tragen(spiel, ninkasi, "flasche", 1);
  let { zustand } = braufensterOeffnen(spiel);
  assert.deepEqual(zustand, { kessel: { x: 3, y: 1 }, mengen: {}, maische: "warm", gewuerz: "frueh", kultur: "hefe" });
  const taste = (code, zusatz = {}) => (zustand = brauTaste(zustand, { code, ...zusatz }, spiel).zustand);
  taste("KeyA"); taste("KeyA"); taste("KeyA");
  assert.equal(zustand.mengen[malz.id], 2, "nicht mehr, als Ninkasi trägt");
  taste("KeyA", { zeichen: "A", umschalt: true });
  assert.equal(zustand.mengen[malz.id], 1);
  taste("Digit1"); taste("Digit2"); taste("Digit3");
  assert.deepEqual([zustand.maische, zustand.gewuerz, zustand.kultur], ["kuehl", "spaet", null]);
  taste("Digit3");
  const ende = brauTaste(zustand, { code: "Enter" }, spiel);
  assert.equal(ende.zustand, null);
  assert.deepEqual(ende.befehl, { art: "brauen", kessel: { x: 3, y: 1 }, zutaten: [{ gegenstandId: malz.id, menge: 1 }], verfahren: { maische: "kuehl", gewuerz: "spaet" }, kultur: "hefe" });
  assert.equal(befehlGeben(spiel, ende.befehl).ok, true);
  assert.deepEqual(klickDeuten(spiel, { x: 3, y: 1 }), { aktion: "brauen" }, "ein Klick auf den Kessel daneben öffnet das Fenster");

  const fern = spielBauen({ x: 1, y: 2 });
  assert.deepEqual(braufensterOeffnen(fern.spiel), { grund: "kein_kessel" });
  assert.equal(klickDeuten(fern.spiel, { x: 3, y: 1 }).aktion, undefined, "zu weit weg: reisen");
});
