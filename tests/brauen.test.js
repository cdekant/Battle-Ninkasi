// Brauen (src/systeme/sud.js und src/systeme/brauen.js): Profil aus Zutaten, Verfahren und Kultur, Zielgebiet und Güte,
// Runden, Wirkung beim Trinken, der Befehl am Kessel mit Wurf und Verderben, Ablehnungen, Braufenster und Klickregel
// (src/eingabe/brauen.js, src/eingabe/maus.js) und die Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, meldungenMitschneiden, gegenstandTragen, weltLaufenLassen, lernendeSpielerin } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId, ausDatenErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { zufallErzeugen } from "../src/kern/zufall.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import zustaende from "../daten/zustaende.js";
import { profilBerechnen, gaerungBerechnen, zielgebietFinden, profilRunden, wirkungBerechnen } from "../src/systeme/sud.js";
import { spinnennetzSvg } from "../src/anzeige/spinnennetz.js";
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
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 80, farbe: 4, aromen: { malz: 80, suesse: 20 } } },
  kraut: { text: "g.kraut", aufhebbar: true, stapelbar: true, gewicht: 100, zutat: { art: "gewuerz", bitter: 20, aromen: { kraeuter: 100 } } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
  krug: { text: "g.krug", aufhebbar: true, gewicht: 0, kultur: "schwach" },
};
const KULTUREN = {
  hefe: { text: "k.hefe", vergaerung: 75, vertraegt: 90, aromen: { frucht: 10 } },
  schwach: { text: "k.schwach", vergaerung: 60, vertraegt: 40 },
};
const ZIELGEBIETE = {
  weit: { text: "z.weit", familie: "test", spannen: { malz: [0, 100] } },
  helles: { text: "z.helles", familie: "test", spannen: { farbe: [0, 20], malz: [50, 100] }, bonus: 150 },
};
// Kessel ohne Unschärfe: der Sud landet genau in der Mitte der Vorschau
const KESSEL = { kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { portionen: 4, unschaerfe: 0 } } };

function spielBauen({ regeln = {}, kessel = KESSEL, x = 2, y = 1 } = {}) {
  const spiel = miniSpiel(RAUM, { gelaende: kessel, effekte, zustaende, gegenstaende: GEGENSTAENDE, kulturen: KULTUREN, zielgebiete: ZIELGEBIETE, regeln: { brauen: { verderben: 0, ...regeln } } });
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

test("Profil: Kennzahlen je Portion, Aromen nach Menge gemittelt, Kultur und Maische kommen dazu", () => {
  const profil = profilBerechnen(daten(), { zutaten: [{ typ: "malz", menge: 8 }], verfahren: VERFAHREN_WARM, kultur: "hefe", portionen: 4 });
  // Vergärung 75 - 10 (warm) = 65 %, Alkohol 160 x 65 % x 50 % = 52; Süße 20 + 10 (warm), Frucht aus der Hefe
  assert.deepEqual(profil, { stammwuerze: 160, alkohol: 52, bittere: 0, farbe: 8, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 });
  const halb = profilBerechnen(daten(), { zutaten: [{ typ: "malz", menge: 4 }], verfahren: VERFAHREN_WARM, kultur: "hefe", portionen: 4 });
  assert.equal(halb.stammwuerze, 80, "halb so viel auf dieselben Portionen, halb so stark");
});

test("Profil: ohne Kultur kein Alkohol; Gewürz früh bitter, spät Aroma; kühl gemaischt trockener", () => {
  const eingabe = (gewuerz) => ({ zutaten: [{ typ: "malz", menge: 4 }, { typ: "kraut", menge: 2 }], verfahren: { maische: "kuehl", gewuerz }, kultur: null, portionen: 4 });
  const frueh = profilBerechnen(daten(), eingabe("frueh")), spaet = profilBerechnen(daten(), eingabe("spaet"));
  assert.equal(frueh.alkohol, 0);
  assert.deepEqual([frueh.bittere, frueh.kraeuter], [10, 16]);
  assert.deepEqual([spaet.bittere, spaet.kraeuter], [3, 33]);
  assert.equal(frueh.suesse, 3, "13 aus dem Malz, 10 weniger durch die kühle Maische");
});

test("Gärung: weniger Portionen geben einen stärkeren Sud; was die Kultur nicht verträgt, bleibt als Restzucker und wird süß", () => {
  const stark = profilBerechnen(daten(), { zutaten: [{ typ: "malz", menge: 8 }], verfahren: VERFAHREN_WARM, kultur: "schwach", portionen: 2 });
  // 8 x 80 / 2 = 320, begrenzt auf 250; vergärbar 320 x 50 % = 160, die Kultur verträgt 4 %, also vergoren 80
  assert.deepEqual(gaerungBerechnen(daten(), { stammwuerze: 320, verfahren: VERFAHREN_WARM, kultur: "schwach" }), { vergaerung: 50, vergoren: 80, restzucker: 80, alkohol: 40 });
  assert.deepEqual([stark.stammwuerze, stark.alkohol, stark.suesse], [250, 40, 70], "Süße 20 aus dem Malz, 10 aus der Maische, 40 aus dem Restzucker");
  const mehr = gaerungBerechnen(daten(), { stammwuerze: 320, verfahren: VERFAHREN_WARM, kultur: "schwach", vertraegt: 80 });
  assert.deepEqual([mehr.alkohol, mehr.restzucker], [80, 0], "verträgt sie mehr (Modifikator brauen.vertraegt), gärt alles");
  assert.deepEqual(gaerungBerechnen(daten(), { stammwuerze: 320, verfahren: VERFAHREN_WARM, kultur: null }), { vergaerung: 0, vergoren: 0, restzucker: 0, alkohol: 0 });
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
  // Budget 160 x 20 % x 90 % x 150 % = 43; Malz 28 heilt LP sofort, Süße 10 x 150 % über die Zeit, Frucht 3 füllt MP
  assert.deepEqual(wirkungBerechnen(daten(), { profil, zielgebiet: "helles", guete: 90 }), { mengen: { lp: 28, mp: 3 }, zustaende: [{ zustand: "gestaerkt", menge: 15 }], pegel: 50, effekte: [] });
  const ohneAroma = { ...profil, malz: 0, frucht: 0, suesse: 0 };
  assert.deepEqual(wirkungBerechnen(daten(), { profil: ohneAroma, zielgebiet: null, guete: 100 }).mengen, { lp: 32 }, "alles an wirkungOhneAroma");
});

test("Brauen am Kessel: Zutaten und Gefäße verbraucht, Portionen stapeln mit Namen des Zielgebiets, Trinken wirkt", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 6);
  tragen(spiel, ninkasi, "flasche", 3);
  assert.equal(brauen(spiel, [{ gegenstandId: malz.id, menge: 6 }]).ok, true, "ohne Angabe so viele Portionen wie Flaschen");
  const gepaeck = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id));
  assert.equal(gepaeck.length, 1, "Malz und Flaschen sind fort");
  const [bier] = gepaeck;
  assert.deepEqual([bier.typ, bier.anzahl, bier.text, bier.wirdZu, bier.gewicht], ["sud", 3, "z.helles", "flasche", 900]);
  assert.deepEqual([bier.sud.zielgebiet, bier.sud.guete, bier.sud.profil.alkohol], ["helles", 90, 50]);
  const meldung = meldungen.find((eintrag) => eintrag.art === "gebraut_getroffen");
  assert.deepEqual([meldung.anzahl, meldung.zielgebiet], [3, "helles"]);
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit, 100, "ein Sud kostet eine Aktion");

  assert.equal(befehlGeben(spiel, { art: "trinken", gegenstandId: bier.id }).ok, true);
  assert.deepEqual([ninkasi.werte.lp.aktuell, ninkasi.werte.mp.aktuell, ninkasi.werte.pegel.aktuell], [78, 53, 50], "Malz heilt sofort");
  const [gestaerkt] = ninkasi.zustaende;
  assert.deepEqual([gestaerkt.name, gestaerkt.ende - spiel.zustand.zeit], ["gestaerkt", 1501], "Süße 15 Weltticks lang");
  weltLaufenLassen(spiel, spiel.zustand.zeit + 2000);
  assert.equal(ninkasi.werte.lp.aktuell, 93, "je Welttick 1 LP, zusammen 15");
  const typen = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id).typ);
  assert.deepEqual(typen, ["sud", "flasche"], "die Flasche kommt zurück");
});

test("Brauen: der Wurf setzt den Punkt im Bereich der Vorschau, ein verdorbener Sud wird sauer und schwach", () => {
  const { spiel, ninkasi } = spielBauen({ kessel: { kessel: { ...KESSEL.kessel, kessel: { portionen: 4 } } } });
  const malz = tragen(spiel, ninkasi, "malz", 2);
  tragen(spiel, ninkasi, "flasche", 1);
  const vorschau = sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "hefe" });
  assert.deepEqual(vorschau.bereich.malz, [72, 88]);
  assert.deepEqual(vorschau.erreichbar, [], "im Nebel ist nichts erreichbar");
  spiel.zustand.wissen = { zielgebiete: ["helles", "weit"] };
  assert.deepEqual(sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "hefe" }).erreichbar, ["weit", "helles"], "aufgedeckt, in der Reihenfolge der Daten");
  spiel.wurfquelle = { art: "grenzen", mengen: "groesste", zufallszustand: zufallErzeugen(1) };
  brauen(spiel, [{ gegenstandId: malz.id, menge: 2 }]);
  const bier = entitaetMitId(spiel.zustand, ninkasi.inventar[0]);
  assert.equal(bier.sud.profil.malz, 90, "88 gerundet");

  const verdorben = spielBauen({ regeln: { verderben: 100 } });
  const malz2 = tragen(verdorben.spiel, verdorben.ninkasi, "malz", 2);
  tragen(verdorben.spiel, verdorben.ninkasi, "flasche", 1);
  brauen(verdorben.spiel, [{ gegenstandId: malz2.id, menge: 2 }]);
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
  assert.equal(grund(alles, { portionen: 5 }), "zu_viele_portionen");
  assert.equal(grund(alles, { portionen: 0 }), "ungueltig");
  assert.equal(grund(alles, { portionen: 3 }), "keine_gefaesse", "zwei Flaschen für drei Portionen");
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
  assert.ok(fehlerMit((roh) => { roh.gelaende.tonkessel.kessel.portionen = 0; }, "gelaende.tonkessel: kessel muss"));
  assert.ok(fehlerMit((roh) => { roh.wesen.ninkasi.kulturen = ["kefir"]; }, "Kultur \"kefir\""));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.hefekrug.kultur = "kefir"; }, "gegenstaende.hefekrug: Kultur \"kefir\""));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.wirkungen.suesse = { zustand: "fremd", prozent: 100 }; }, "regeln.brauen.wirkungen.suesse"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.stueckeJePortion = 0; }, "regeln.brauen.stueckeJePortion"));
});

test("Braufenster: öffnet nur am Kessel, Portionen nach Flaschen und Kessel, Buchstaben füllen, Ziffern wechseln, Enter gibt den Befehl", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 2);
  tragen(spiel, ninkasi, "kraut", 1);
  tragen(spiel, ninkasi, "flasche", 1);
  let { zustand } = braufensterOeffnen(spiel);
  assert.deepEqual(zustand, { kessel: { x: 3, y: 1 }, portionen: 1, mengen: {}, maische: "warm", gewuerz: "frueh", kultur: "hefe", liste: "zutaten" }, "so viele Portionen wie Flaschen");
  const taste = (code, zusatz = {}) => (zustand = brauTaste(zustand, { code, ...zusatz }, spiel).zustand);
  for (let i = 0; i < 5; i++) taste("NumpadAdd");
  assert.equal(zustand.portionen, 4, "höchstens die Portionen des Kessels");
  taste("Slash", { zeichen: "-" }); taste("Slash", { zeichen: "-" }); taste("Slash", { zeichen: "-" }); taste("Slash", { zeichen: "-" });
  assert.equal(zustand.portionen, 1, "mindestens eine");
  taste("KeyA"); taste("KeyA"); taste("KeyA");
  assert.equal(zustand.mengen[malz.id], 2, "nicht mehr, als Ninkasi trägt");
  taste("KeyA", { zeichen: "A", umschalt: true });
  assert.equal(zustand.mengen[malz.id], 1);
  taste("Digit1"); taste("Digit2"); taste("Digit3");
  assert.deepEqual([zustand.maische, zustand.gewuerz, zustand.kultur], ["kuehl", "spaet", null]);
  taste("Digit3");
  const ende = brauTaste(zustand, { code: "Enter" }, spiel);
  assert.equal(ende.zustand, null);
  assert.deepEqual(ende.befehl, { art: "brauen", kessel: { x: 3, y: 1 }, portionen: 1, zutaten: [{ gegenstandId: malz.id, menge: 1 }], verfahren: { maische: "kuehl", gewuerz: "spaet" }, kultur: "hefe" });
  assert.equal(befehlGeben(spiel, ende.befehl).ok, true);
  assert.deepEqual(klickDeuten(spiel, { x: 3, y: 1 }), { aktion: "brauen" }, "ein Klick auf den Kessel daneben öffnet das Fenster");

  const fern = spielBauen({ x: 1, y: 2 });
  assert.deepEqual(braufensterOeffnen(fern.spiel), { grund: "kein_kessel" });
  assert.equal(klickDeuten(fern.spiel, { x: 3, y: 1 }).aktion, undefined, "zu weit weg: reisen");
});

test("Kulturen und Zutaten aufheben: die Probe gibt ihre Kultur und vergeht, beim ersten Mal gibt es Wissens-EP", () => {
  const spiel = miniSpiel(RAUM, { gegenstaende: GEGENSTAENDE, kulturen: KULTUREN, zielgebiete: ZIELGEBIETE });
  const ninkasi = lernendeSpielerin(spiel, 1, 1);
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  const meldungen = meldungenMitschneiden(spiel);
  const { wissenKultur, wissenZutat } = spiel.daten.regeln.lernen;
  const vorher = ninkasi.freieEp;
  ausDatenErzeugen(spiel, "gegenstaende", "krug", { x: 1, y: 1 });
  assert.equal(befehlGeben(spiel, { art: "aufheben" }).ok, true);
  assert.deepEqual(ninkasi.kulturen, ["schwach"]);
  assert.deepEqual(ninkasi.inventar, [], "der Krug vergeht");
  assert.equal(ninkasi.freieEp, vorher + wissenKultur);
  assert.ok(meldungen.some((meldung) => meldung.art === "kultur_gewonnen"));
  ausDatenErzeugen(spiel, "gegenstaende", "krug", { x: 1, y: 1 });
  befehlGeben(spiel, { art: "aufheben" });
  assert.deepEqual([ninkasi.kulturen, ninkasi.freieEp], [["schwach"], vorher + wissenKultur], "dieselbe Kultur zweimal: nichts Neues");
  assert.ok(meldungen.some((meldung) => meldung.art === "kultur_bekannt"));
  for (let i = 0; i < 2; i++) {
    ausDatenErzeugen(spiel, "gegenstaende", "malz", { x: 1, y: 1 });
    befehlGeben(spiel, { art: "aufheben" });
  }
  assert.equal(ninkasi.freieEp, vorher + wissenKultur + wissenZutat, "je Zutatenart einmal im Lauf");
});

test("Spinnennetz: Speichen je Achse, Band der Vorschau, Profil, Umrisse nur auf genannten Achsen", () => {
  const achsen = { a: { hoechstens: 100 }, b: { hoechstens: 100 }, c: { hoechstens: 100 }, d: { hoechstens: 100 } };
  const svg = spinnennetzSvg(achsen, {
    bereich: { a: [0, 50], b: [0, 50], c: [0, 50], d: [0, 50] }, punkt: { a: 100, b: 0, c: 0, d: 0 },
    umrisse: [{ spannen: { a: [20, 40] }, hervorgehoben: true }], beschriftungen: { a: "<A>" }, titel: "Netz",
  });
  assert.equal((svg.match(/netz-speiche/g) || []).length, 4);
  assert.equal((svg.match(/netz-ring/g) || []).length, 4);
  assert.match(svg, /class="netz-band" fill-rule="evenodd" d="M0,-50L50,0L0,50L-50,0ZM0,0L0,0L0,0L0,0Z"/);
  assert.match(svg, /<polygon class="netz-profil" points="0,-100 0,0 0,0 0,0"/, "die erste Achse zeigt nach oben");
  assert.equal((svg.match(/netz-umriss hervorgehoben/g) || []).length, 1, "ein Abschnitt für die eine genannte Achse");
  assert.match(svg, /x1="0" y1="-20" x2="0" y2="-40"/);
  assert.match(svg, /&lt;A&gt;/, "Beschriftungen werden maskiert");
  assert.match(svg, /role="img" aria-label="Netz"/);
});
