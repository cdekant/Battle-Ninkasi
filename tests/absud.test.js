// Absud (src/systeme/absud.js und der Befehl brauen ohne Kultur in src/systeme/brauen.js): Richtung, Mächtigkeit,
// Absicht und Misslingen, die drei Ausgänge, Wirken beim Trinken und Werfen, Stufen, Wissen über Kräuter mit der
// Vermutung und dem Vorwissen aus der Chronik, unbekannte gefundene Absude, das Braufenster und die Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, meldungenMitschneiden, gegenstandTragen, allesSichtbar } from "./hilfen.js";
import { befehlGeben, neuesSpiel } from "../src/kern/spiel.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import regeln from "../daten/regeln.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import zustaende from "../daten/zustaende.js";
import { sudVorbereiten } from "../src/systeme/brauen.js";
import { zutatImAbsud, krautUnbekannt, stufeDesPols } from "../src/systeme/absud.js";
import { etikettenZuordnen, istUnbekannt } from "../src/systeme/kennen.js";
import { neueChronik, meldungZaehlen, vorwissenAusChronik } from "../src/eingabe/chronik.js";
import { braufensterOeffnen, brauTaste } from "../src/eingabe/brauen.js";
import { fensterOeffnen } from "../src/eingabe/fenster.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/braufenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import grammatikDe from "../sprache/de/grammatik.js";
import { texteDe } from "../src/inhalt.js";
import { datenLaden } from "../src/kern/spiel.js";
import { spielerin } from "../src/kern/zustand.js";
import { gelaendeSetzen } from "../src/systeme/gelaende.js";

const RAUM = [
  "########",
  "#..u...#",
  "#......#",
  "########",
];

const absudGetraenk = (text, richtung, pol) => ({
  text, aufhebbar: true, stapelbar: true, gewicht: 900, absud: { richtung, pol, staerke: 1 },
  trinkbar: { effekt: "absud_trinken" }, wurf: { effekt: "absud_zerspringt" }, unbekannt: { gruppe: "absude", schwierigkeit: 50 },
});
const GEGENSTAENDE = {
  ...sude,
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 80 } },
  senf: { text: "g.senf", aufhebbar: true, stapelbar: true, gewicht: 100, zutat: { art: "gewuerz", richtungen: { feuer: 30 } } },
  // unbekannt, neigt zum Gift und macht das Misslingen wahrscheinlicher
  bilsen: { text: "g.bilsen", aufhebbar: true, stapelbar: true, gewicht: 100, zutat: { art: "gewuerz", richtungen: { sicht: 30 }, neigung: -30, misslingen: 5, schwierigkeit: 60 } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
  feuerelixier: absudGetraenk("g.feuerelixier", "feuer", "elixier"),
  feuergift: absudGetraenk("g.feuergift", "feuer", "gift"),
  sichtelixier: absudGetraenk("g.sichtelixier", "sicht", "elixier"),
  sichtgift: absudGetraenk("g.sichtgift", "sicht", "gift"),
};
const RICHTUNGEN = {
  feuer: { text: "r.feuer", elixier: { stufen: [{ ab: 1, zustand: "schutz" }, { ab: 3, zustand: "fest", misslingen: 25 }] }, gift: { stufen: [{ ab: 1, zustand: "brand" }] } },
  sicht: { text: "r.sicht", elixier: { stufen: [{ ab: 1, zustand: "klar" }] }, gift: { stufen: [{ ab: 1, zustand: "trug" }] } },
};
const ZUSTAENDE = {
  ...zustaende,
  schutz: { text: "z.schutz", modifikatoren: [{ ziel: "widerstand", tag: "feuer", art: "plus", betrag: 10 }] },
  fest: { text: "z.fest", modifikatoren: [{ ziel: "immunitaet", tag: "feuer", art: "plus", betrag: 1 }] },
  brand: { text: "z.brand", modifikatoren: [{ ziel: "widerstand", tag: "feuer", art: "plus", betrag: -10 }] },
  klar: { text: "z.klar" },
  trug: { text: "z.trug" },
};
const KESSEL = { kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { portionen: 4 } } };
// gelingt sicher: kein Misslingen, Absicht immer
const SICHER = { misslingen: 0, absicht: { grund: 100, mindestens: 0, hoechstens: 100 } };

function spielBauen(absud = {}) {
  const spiel = miniSpiel(RAUM, {
    gelaende: KESSEL, effekte, zustaende: ZUSTAENDE, gegenstaende: GEGENSTAENDE, absudrichtungen: RICHTUNGEN,
    etiketten: { absude: ["e.a", "e.b", "e.c", "e.d"] },
    regeln: { werfen: { streuung: { ...regeln.werfen.streuung, chance: 0 } }, brauen: { stueckeJePortion: 8, absud: { ...regeln.brauen.absud, ...absud } } },
  });
  const ninkasi = wesen(spiel, 2, 1, "ninkasi", 100, { werte: werteAusDaten({ lp: { grundwert: 100 }, pegel: { anfangswert: 0 } }), kulturen: [], inventar: [] });
  spiel.zustand.spielerinId = ninkasi.id;
  spiel.optionen = { spielart: "normal" };
  etikettenZuordnen(spiel);
  spiel.zustand.wissen.kraeuter = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const tragen = (spiel, ninkasi, typ, anzahl = 1) => gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
const brauen = (spiel, zutaten, zusatz = {}) => befehlGeben(spiel, { art: "brauen", zutaten, kultur: null, ...zusatz });
const imGepaeck = (spiel, ninkasi, typ) => ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand.typ === typ);

test("Rechnung: die stärkste Richtung führt, Mächtigkeit aus Extrakt je Portion, Absicht nach der Neigung, Misslingen mit Kraut", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 4), senf = tragen(spiel, ninkasi, "senf", 2), bilsen = tragen(spiel, ninkasi, "bilsen", 2);
  tragen(spiel, ninkasi, "flasche", 4);
  const vorschau = (zutaten, zusatz = {}) => sudVorbereiten(spiel, ninkasi, { art: "brauen", zutaten, kultur: null, ...zusatz });
  const gleichstand = vorschau([{ gegenstandId: senf.id, menge: 2 }, { gegenstandId: bilsen.id, menge: 2 }], { portionen: 1 });
  assert.equal(gleichstand.art, "absud");
  assert.deepEqual(gleichstand.wahr.punkte, { feuer: 60, sicht: 60 });
  assert.equal(gleichstand.wahr.fuehrend, "feuer", "bei Gleichstand die erste der Daten");
  // Neigung im Mittel (0 + 0 - 30 - 30) / 4 = -15: Elixier 70 - 15 = 55 %; Misslingen 10 + 5 aus dem Bilsenkraut
  assert.equal(gleichstand.wahr.absicht, 55);
  assert.equal(gleichstand.wahr.chancen.misslungen, 15);
  assert.deepEqual(gleichstand.wahr.chancen, { misslungen: 15, gelungen: Math.floor((85 * 55) / 100), umgeschlagen: 85 - Math.floor((85 * 55) / 100) });
  assert.equal(vorschau([{ gegenstandId: senf.id, menge: 2 }, { gegenstandId: bilsen.id, menge: 2 }], { portionen: 1, absicht: "gift" }).wahr.absicht, 85, "das Gift folgt der Neigung");
  // 4 Malz auf 1 Portion: Extrakt 320, Stärke 320 / 60 = 5; auf 4 Portionen 80, Stärke 1
  assert.equal(vorschau([{ gegenstandId: malz.id, menge: 4 }, { gegenstandId: senf.id, menge: 1 }], { portionen: 1 }).wahr.staerke, 5);
  assert.equal(vorschau([{ gegenstandId: malz.id, menge: 4 }, { gegenstandId: senf.id, menge: 1 }], { portionen: 4 }).wahr.staerke, 1);
  // Stärke 5 erreicht die anspruchsvolle Stufe "fest", die das Misslingen um 25 hebt
  const stark = vorschau([{ gegenstandId: malz.id, menge: 4 }, { gegenstandId: senf.id, menge: 1 }], { portionen: 1 });
  assert.equal(stark.wahr.stufe.zustand, "fest");
  assert.equal(stark.wahr.chancen.misslungen, 35);
  assert.equal(stufeDesPols(spiel.daten, "feuer", "elixier", 2).zustand, "schutz");
  const ohneRichtung = vorschau([{ gegenstandId: malz.id, menge: 1 }]);
  assert.equal(ohneRichtung.wahr.fuehrend, null);
  assert.equal(ohneRichtung.wahr.chancen.misslungen, 100, "ohne Richtung misslingt der Absud immer");
  assert.equal(vorschau([{ gegenstandId: senf.id, menge: 1 }], { absicht: "trank" }).grund, "ungueltig");
});

test("Befehl: gelungen in die Absicht, kein Alkohol, kein Verderben; Trinken setzt den Zustand mit Stärke und Dauer", () => {
  const { spiel, ninkasi, meldungen } = spielBauen(SICHER);
  const malz = tragen(spiel, ninkasi, "malz", 2), senf = tragen(spiel, ninkasi, "senf", 1);
  tragen(spiel, ninkasi, "flasche", 2);
  assert.equal(brauen(spiel, [{ gegenstandId: malz.id, menge: 2 }, { gegenstandId: senf.id, menge: 1 }], { portionen: 1 }).ok, true);
  const [elixier] = imGepaeck(spiel, ninkasi, "feuerelixier");
  assert.deepEqual(elixier.absud, { richtung: "feuer", pol: "elixier", staerke: 2 }, "160 Extrakt auf eine Portion, Stärke 2");
  assert.equal(elixier.verdirbtUm, undefined, "ein Absud verdirbt nicht");
  assert.equal(elixier.etikett, undefined, "was Ninkasi braut, kennt sie");
  assert.equal(imGepaeck(spiel, ninkasi, "flasche")[0].anzahl ?? 1, 1);
  assert.ok(meldungen.some((meldung) => meldung.art === "absud_gelungen"));
  assert.equal(befehlGeben(spiel, { art: "trinken", gegenstandId: elixier.id }).ok, true);
  const instanz = ninkasi.zustaende.find((zustand) => zustand.name === "schutz");
  assert.equal(instanz.staerke, 2);
  assert.ok(instanz.ende - instanz.beginn >= regeln.brauen.absud.dauer - 1);
  assert.equal(ninkasi.werte.pegel.aktuell, 0, "Elixiere heben den Pegel nicht");
});

test("Befehl: umgeschlagen ins Gegenteil derselben Richtung; misslungen zur Brühe, die unwohl macht", () => {
  const umschlag = spielBauen({ misslingen: 0, absicht: { grund: 0, mindestens: 0, hoechstens: 0 } });
  const senf = tragen(umschlag.spiel, umschlag.ninkasi, "senf", 1);
  tragen(umschlag.spiel, umschlag.ninkasi, "flasche", 1);
  assert.equal(brauen(umschlag.spiel, [{ gegenstandId: senf.id, menge: 1 }]).ok, true);
  assert.equal(imGepaeck(umschlag.spiel, umschlag.ninkasi, "feuergift").length, 1);
  assert.ok(umschlag.meldungen.some((meldung) => meldung.art === "absud_umgeschlagen"));

  const daneben = spielBauen({ misslingen: 100 });
  const senf2 = tragen(daneben.spiel, daneben.ninkasi, "senf", 1);
  tragen(daneben.spiel, daneben.ninkasi, "flasche", 1);
  assert.equal(brauen(daneben.spiel, [{ gegenstandId: senf2.id, menge: 1 }]).ok, true);
  const [bruehe] = imGepaeck(daneben.spiel, daneben.ninkasi, "bruehe");
  assert.ok(bruehe);
  assert.ok(daneben.meldungen.some((meldung) => meldung.art === "absud_misslungen"));
  befehlGeben(daneben.spiel, { art: "trinken", gegenstandId: bruehe.id });
  assert.ok(daneben.ninkasi.zustaende.some((zustand) => zustand.name === "unwohl"));
});

test("Werfen: der Absud zerspringt und wirkt auf jedes Wesen um den Aufschlag; die Sorte ist danach erkannt", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  allesSichtbar(spiel);
  const gift = tragen(spiel, ninkasi, "feuergift", 1);
  gift.absud = { richtung: "feuer", pol: "gift", staerke: 3 };
  assert.ok(istUnbekannt(spiel.zustand, "feuergift"));
  const a = wesen(spiel, 5, 1, "feinde", 20), b = wesen(spiel, 5, 2, "feinde", 20), fern = wesen(spiel, 1, 2, "feinde", 20);
  const ergebnis = befehlGeben(spiel, { art: "werfen", gegenstandId: gift.id, ziel: { id: a.id } });
  assert.equal(ergebnis.ok, true);
  assert.ok(meldungen.some((meldung) => meldung.art === "zerbrochen"));
  for (const getroffen of [a, b]) assert.equal(getroffen.zustaende?.find((zustand) => zustand.name === "brand")?.staerke, 3);
  assert.ok(!(fern.zustaende ?? []).some((zustand) => zustand.name === "brand"));
  assert.ok(!istUnbekannt(spiel.zustand, "feuergift"));
});

test("Kräuter: Vermutung nach Kräuterkunde und Schwierigkeit, fest je Lauf; Brauen macht das Kraut bekannt", () => {
  const { spiel, ninkasi, meldungen } = spielBauen({ ...SICHER, vermutung: { grund: 0 } });
  assert.ok(krautUnbekannt(spiel, "bilsen"));
  assert.ok(!krautUnbekannt(spiel, "senf"), "ohne Schwierigkeit kennt Ninkasi eine Zutat");
  // ohne Kräuterkunde und ohne Grund liegt die Vermutung daneben: die Punkte auf einer anderen Richtung, Neigung umgekehrt
  const falsch = zutatImAbsud(spiel, ninkasi, "bilsen");
  assert.deepEqual(falsch, { richtungen: { feuer: 30 }, neigung: 30, misslingen: 0, vermutet: true });
  assert.deepEqual(zutatImAbsud(spiel, ninkasi, "bilsen"), falsch, "dieselbe Vermutung bei jedem Blick");
  ninkasi.kampfwerte = { kraeuterkunde: 100000 };
  assert.deepEqual(zutatImAbsud(spiel, ninkasi, "bilsen"), { richtungen: { sicht: 30 }, neigung: -30, misslingen: 5, vermutet: true }, "mit Kräuterkunde stimmt sie");
  ninkasi.kampfwerte = {};
  const bilsen = tragen(spiel, ninkasi, "bilsen", 1);
  tragen(spiel, ninkasi, "flasche", 1);
  const vorschau = sudVorbereiten(spiel, ninkasi, { art: "brauen", zutaten: [{ gegenstandId: bilsen.id, menge: 1 }], kultur: null });
  assert.equal(vorschau.vermutet.fuehrend, "feuer", "die Anzeige folgt der Vermutung");
  assert.equal(vorschau.wahr.fuehrend, "sicht", "der Befehl der Wahrheit");
  assert.deepEqual(vorschau.unbekannt, ["bilsen"]);
  assert.equal(brauen(spiel, [{ gegenstandId: bilsen.id, menge: 1 }]).ok, true);
  assert.equal(imGepaeck(spiel, ninkasi, "sichtelixier").length, 1);
  assert.ok(!krautUnbekannt(spiel, "bilsen"));
  const meldung = meldungen.find((eintrag) => eintrag.art === "kraut_erkannt");
  assert.equal(meldung.was.typ, "bilsen");
  assert.equal(zutatImAbsud(spiel, ninkasi, "bilsen").vermutet, false);

  // über Läufe hinweg: die Chronik zählt das Erkennen, das Vorwissen bringt es in den nächsten Lauf
  const chronik = neueChronik();
  meldungZaehlen(chronik, spiel, meldung);
  assert.deepEqual(vorwissenAusChronik(chronik).kraeuter, ["bilsen"]);
  const daten = vorbereiten(rohdaten).daten;
  const vorwissend = neuesSpiel(daten, 3, { vorwissen: { kraeuter: ["bilsenkraut", "gibt_es_nicht"] } });
  assert.deepEqual(vorwissend.zustand.wissen.kraeuter, ["bilsenkraut"]);
  assert.ok(neuesSpiel(daten, 3, { spielart: "allmaechtig" }).zustand.wissen.kraeuter.includes("senfsaat"));
});

test("Braufenster: ohne Kultur Balken je Richtung, Mächtigkeit und Chancen, unbekannte Kräuter mit Fragezeichen; 4 wechselt die Absicht", () => {
  const grammatik = erstelleGrammatik(grammatikDe);
  const texte = erstelleTexte(texteDe, grammatik);
  const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
  const spiel = neuesSpiel(daten, 5);
  const ninkasi = spielerin(spiel.zustand);
  ninkasi.kulturen = [];
  gelaendeSetzen(spiel, { x: ninkasi.position.x + 1, y: ninkasi.position.y }, "tonkessel");
  const bilsen = gegenstandTragen(spiel, ninkasi, { typ: "bilsenkraut", ...structuredClone(daten.gegenstaende.bilsenkraut) });
  gegenstandTragen(spiel, ninkasi, { typ: "leere_flasche", ...structuredClone(daten.gegenstaende.leere_flasche) });
  let { zustand } = braufensterOeffnen(spiel);
  assert.equal(zustand.kultur, null, "ohne Kultur steht das Fenster auf dem Absud");
  const stelle = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand.zutat).findIndex((gegenstand) => gegenstand.id === bilsen.id);
  const buchstabe = "abcdefghijklmnopqrstuvwxyz"[stelle];
  zustand = brauTaste(zustand, { code: `Key${buchstabe.toUpperCase()}`, zeichen: buchstabe }, spiel).zustand;
  assert.equal(zustand.mengen[bilsen.id], 1);
  const html = fensterHtml({ spiel, daten, texte, version: "test" }, fensterOeffnen([], "brauen", zustand));
  assert.match(html, /brau-absud/, "Balken je Richtung");
  assert.match(html, /Bilsenkraut <span class="leise">\?<\/span>/, "das unbekannte Kraut mit Fragezeichen");
  assert.match(html, /Gelingt mit \d+ %/);
  assert.match(html, /Vermutung/);
  zustand = brauTaste(zustand, { code: "Digit4" }, spiel).zustand;
  const ende = brauTaste(zustand, { code: "Enter" }, spiel);
  assert.equal(ende.befehl.absicht, "gift");
  assert.equal(ende.befehl.kultur, null);
});

test("Datenprüfung: Regeln des Absuds, Richtungen mit Stufen und je Pol genau einem Getränk, Beiträge der Zutaten", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "absud"), "der Inhalt ist gültig");
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.absud.staerkeJe = 0; }, "regeln.brauen.absud.staerkeJe"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.absud.misslungen = "dolch"; }, "regeln.brauen.absud.misslungen"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.absud.absicht.mindestens = 99; }, "regeln.brauen.absud.absicht"));
  assert.ok(fehlerMit((roh) => { roh.absudrichtungen.feuer.elixier.stufen[0].ab = 2; }, "die erste Stufe gilt ab Stärke 1"));
  assert.ok(fehlerMit((roh) => { roh.absudrichtungen.feuer.gift.stufen[0].zustand = "gibt_es_nicht"; }, "Zustand \"gibt_es_nicht\""));
  assert.ok(fehlerMit((roh) => { delete roh.gegenstaende.feuergift; }, "absudrichtungen.feuer.gift: genau ein Gegenstand"));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.senfsaat.zutat.richtungen = { wasser: 10 }; }, "Richtung \"wasser\""));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.kamille.zutat.neigung = "viel"; }, "zutat.neigung"));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.feuerelixier.absud.pol = "trank"; }, "gegenstaende.feuerelixier: absud muss"));
});
