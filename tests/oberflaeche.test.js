// Oberfläche 0.28.0: Logzeilen in zwei Spalten mit Seite und Ton (anzeige/logzeilen.js, anzeige/log.js), Esc-Kette
// (eingabe/esckette.js), Spielmenü, Bestätigung und Verlauf (eingabe/menue.js, eingabe/verlauf.js,
// anzeige/systemfenster.js), Seitenleiste und Bedienzeile ohne DOM (anzeige/oberflaeche.js, anzeige/bedienzeile.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "../src/eingabe/belegung.js";
import vorgaben from "../src/eingabe/einstellungen.js";
import { miniSpiel, spielerinSetzen, wesen, allesSichtbar } from "./hilfen.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { bezugAuf } from "../src/kern/ereignisse.js";
import { zeilenAusMeldung, seiteVon, ARTEN, ZAHLENSPALTEN } from "../src/anzeige/logzeilen.js";
import { Log, logzeileHtml, logkopfHtml } from "../src/anzeige/log.js";
import { escSchritt } from "../src/eingabe/esckette.js";
import { fensterOeffnen, fensterTaste } from "../src/eingabe/fenster.js";
import { menueOeffnen, menueTaste, bestaetigungTaste, MENUE_EINTRAEGE } from "../src/eingabe/menue.js";
import { verlaufOeffnen, verlaufTaste, passtZumFilter, VERLAUF_FILTER } from "../src/eingabe/verlauf.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/systemfenster.js";
import "../src/eingabe/inventar.js";
import "../src/eingabe/faehigkeiten.js";
import { Oberflaeche } from "../src/anzeige/oberflaeche.js";
import { Bedienzeile } from "../src/anzeige/bedienzeile.js";
import { minikartenBild, feldgroesseFuer, feldAmPunkt } from "../src/anzeige/minikarte.js";
import { neueLeisten, leistenNachfuehren } from "../src/eingabe/schnellleiste.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
const ohneDom = () => ({ innerHTML: "" });

function aufstellen() {
  const spiel = miniSpiel(["#######", "#.....#", "#######"]);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const feind = wesen(spiel, 3, 1, "feinde", 20);
  const freundin = wesen(spiel, 2, 1, "ninkasi", 20);
  allesSichtbar(spiel);
  const kontext = { spiel, texte, zustandsname: (name) => name };
  return { spiel, ninkasi, feind, freundin, kontext };
}

test("Seite: Ninkasi, Verbündete, Gegner, ohne Wesen neutral", () => {
  const { spiel, ninkasi, feind, freundin } = aufstellen();
  assert.equal(seiteVon(spiel, bezugAuf(ninkasi)), "ninkasi");
  assert.equal(seiteVon(spiel, bezugAuf(freundin)), "verbuendet");
  assert.equal(seiteVon(spiel, bezugAuf(feind)), "gegner");
  assert.equal(seiteVon(spiel, { id: 9999 }), "neutral");
  assert.equal(seiteVon(spiel, null), "neutral");
});

test("Logzeilen: Kampf mit Seite, Ton und Zahlen, Geschehen mit Art", () => {
  const { spiel, ninkasi, feind, freundin, kontext } = aufstellen();
  const schaden = (quelle, zusatz) => zeilenAusMeldung(kontext, { art: "schaden", quelle: bezugAuf(quelle), ziel: bezugAuf(quelle === feind ? ninkasi : feind), menge: 9, schadensart: "stumpf", kritisch: false, ruestungAbzug: 0, widerstanden: 0, immun: false, trefferchance: 78, kritfaktor: null, ...zusatz })[0];
  const krit = schaden(ninkasi, { kritisch: true, kritfaktor: 150, ruestungAbzug: 2 });
  assert.deepEqual([krit.spalte, krit.art, krit.seite, krit.ton], ["kampf", "krit", "ninkasi", "krit"]);
  assert.deepEqual(krit.zahlen.map((zahl) => zahl.text), ["78", "9", "x1,5", "−2"]);
  assert.deepEqual(krit.zahlen.map((zahl) => zahl.klasse), ZAHLENSPALTEN, "in der Reihenfolge der festen Spalten");
  assert.equal(schaden(freundin).seite, "verbuendet");
  const gegnerisch = schaden(feind, { schadensart: "psi" });
  assert.deepEqual([gegnerisch.seite, gegnerisch.ton, gegnerisch.magisch], ["gegner", "treffer", true]);
  assert.equal(schaden(feind, { immun: true }).ton, "abgewehrt");
  const abgezogen = schaden(feind, { widerstanden: 3, ruestungAbzug: 2 }).zahlen.at(-1);
  assert.deepEqual([abgezogen.text, abgezogen.titel], ["−5", "−2 Rüstung, −3 Widerstand"], "Abzug zusammen, die Aufteilung im Tooltip");
  const verfehlt = zeilenAusMeldung(kontext, { art: "verfehlt", quelle: bezugAuf(feind), ziel: bezugAuf(ninkasi), grund: "geblockt", trefferchance: 40 })[0];
  assert.deepEqual([verfehlt.spalte, verfehlt.seite, verfehlt.ton, verfehlt.zahlen[0].text], ["kampf", "gegner", "abgewehrt", "40"]);
  const tod = zeilenAusMeldung(kontext, { art: "tod", opfer: bezugAuf(feind), quelle: null })[0];
  assert.deepEqual([tod.spalte, tod.art, tod.seite], ["kampf", "tod", "ninkasi"], "ohne Quelle die Seite, der der Tod nützt");
  const eigenerTod = zeilenAusMeldung(kontext, { art: "tod", opfer: bezugAuf(ninkasi), quelle: bezugAuf(feind) })[0];
  assert.deepEqual([eigenerTod.spalte, eigenerTod.art], ["geschehen", "gefahr"]);
  const pegel = zeilenAusMeldung(kontext, { art: "pegel_steigt", schwelle: 500 })[0];
  assert.deepEqual([pegel.spalte, pegel.art], ["geschehen", "pegel"]);
  assert.deepEqual(zeilenAusMeldung(kontext, { art: "gibt_es_nicht" }), []);
  for (const zeile of [krit, verfehlt, tod, eigenerTod, pegel]) assert.ok(zeile.art in ARTEN);
});

test("Log: Zugmarke, gleiche Zeilen zusammengefasst, zwei Spalten, Strich zwischen den Zügen", () => {
  const { spiel, ninkasi } = aufstellen();
  const log = new Log(ohneDom(), texte);
  log.leeren(spiel);
  ninkasi.zuege = 4;
  log.zeile("Es tropft.");
  log.zeile("Es tropft.");
  log.hinzufuegen({ spalte: "kampf", art: "angriff", text: "Hieb.", seite: "ninkasi", ton: "treffer" });
  ninkasi.zuege = 5;
  log.zeile("Es tropft.");
  assert.equal(log.zeilen.length, 2);
  assert.deepEqual([log.zeilen[0].anzahl, log.zeilen[0].zug], [3, 5], "zusammengefasst, die Zugmarke wandert mit");
  assert.match(log.element.innerHTML, /data-spalte="geschehen".*data-spalte="kampf"/s);
  assert.match(log.element.innerHTML, /x3/);
  assert.match(logzeileHtml({ zug: 6, art: "krit", text: "<b>", seite: "gegner", ton: "krit", anzahl: 1 }, { zug: 5 }), /seite-gegner ton-krit neuer-zug.*&lt;b&gt;/s, "Klassen und maskierter Text");
  const kampfzeile = logzeileHtml({ zug: 6, spalte: "kampf", art: "angriff", text: "Hieb.", seite: "ninkasi", ton: "treffer", anzahl: 1, zahlen: [{ text: "9", klasse: "menge" }] });
  assert.equal((kampfzeile.match(/class="zahl /g) || []).length, 4, "vier feste Zahlenspalten, auch leere");
  assert.match(logkopfHtml(texte, "kampf"), /title="Trefferchance in Prozent">%<.*>DMG<.*>×<.*>–</s);
  assert.doesNotMatch(logzeileHtml({ zug: 6, spalte: "geschehen", art: "geschehen", text: "Tropf.", anzahl: 1 }), /class="zahl /, "das Geschehen hat keine Zahlen");
});

test("Esc-Kette: Zielmodus, Fenster, Ablauf, sonst Spielmenü", () => {
  assert.equal(escSchritt({ zielModus: {}, fensterStapel: [{}], laufenderAblauf: {} }), "zielmodus");
  assert.equal(escSchritt({ zielModus: null, fensterStapel: [{}], laufenderAblauf: {} }), "fenster");
  assert.equal(escSchritt({ zielModus: null, fensterStapel: [], laufenderAblauf: {} }), "ablauf");
  assert.equal(escSchritt({ zielModus: null, fensterStapel: [], laufenderAblauf: null }), "menue");
});

test("Spielmenü: Buchstabe, Pfeile, Enter; Neustart fragt nach, Hilfe und Einstellungen legen sich darüber", () => {
  const zustand = menueOeffnen();
  assert.equal(menueTaste(zustand, { code: "ArrowUp" }).zustand.gewaehlt, MENUE_EINTRAEGE.length - 1, "läuft rund");
  assert.deepEqual(menueTaste(zustand, { code: "Enter" }), { zustand: null }, "Fortsetzen schließt");
  assert.equal(menueTaste(zustand, { code: "Escape" }).zustand, null);
  const stapel = fensterOeffnen([], "menue", zustand);
  const neustart = fensterTaste(stapel, { code: "KeyD", zeichen: "d" }, {});
  assert.deepEqual(neustart.stapel.map(({ art }) => art), ["menue", "bestaetigung"]);
  const bestaetigt = fensterTaste(neustart.stapel, { code: "KeyJ", zeichen: "j" }, {});
  assert.equal(bestaetigt.aktion, "neustart");
  assert.deepEqual(bestaetigt.stapel.map(({ art }) => art), ["menue"]);
  assert.equal(fensterTaste(neustart.stapel, { code: "KeyN", zeichen: "n" }, {}).aktion, undefined, "nein tut nichts");
  assert.deepEqual(fensterTaste(stapel, { code: "KeyB", zeichen: "b" }, {}).stapel.map(({ art }) => art), ["menue", "hilfe"]);
  const einstellungen = fensterTaste(stapel, { code: "KeyC", zeichen: "c" }, {});
  assert.deepEqual(einstellungen.stapel.map(({ art }) => art), ["menue", "einstellungen"], "Einstellungen legen sich über das Menü");
  assert.deepEqual(menueTaste(zustand, { code: "KeyD", zeichen: "d" }, { einstellungen: { neustartNachfragen: false } }), { zustand: null, aktion: "neustart" }, "ohne Nachfrage");
  assert.deepEqual(menueTaste(zustand, { code: "KeyE", zeichen: "e" }), { zustand: null, aktion: "zum_titel" });
  assert.deepEqual(menueTaste(zustand, { code: "KeyF", zeichen: "f" }), { zustand: null, aktion: "beenden" });
  assert.deepEqual(menueTaste(zustand, { code: "KeyZ", zeichen: "z" }), { zustand }, "an z liegt nichts");
  assert.deepEqual(bestaetigungTaste({ frage: "x", aktion: "a" }, { code: "Enter" }), { zustand: null, aktion: "a" });
});

test("Verlauf: Filter nach Spalte und Art, Blättern nie unter 0, Tab schließt", () => {
  const zeilen = [{ spalte: "geschehen", art: "fund" }, { spalte: "kampf", art: "krit" }];
  assert.deepEqual(zeilen.filter((zeile) => passtZumFilter(zeile, "kampf")), [zeilen[1]]);
  assert.deepEqual(zeilen.filter((zeile) => passtZumFilter(zeile, "fund")), [zeilen[0]]);
  assert.equal(zeilen.filter((zeile) => passtZumFilter(zeile, "alle")).length, 2);
  let zustand = verlaufOeffnen();
  zustand = verlaufTaste(zustand, { code: "ArrowDown" }).zustand;
  assert.equal(zustand.versatz, 0);
  zustand = verlaufTaste(zustand, { code: "PageUp" }).zustand;
  assert.ok(zustand.versatz > 0);
  assert.deepEqual(verlaufTaste(zustand, { code: "KeyC", zeichen: "c" }).zustand, { ...zustand, filter: VERLAUF_FILTER[2], versatz: 0 });
  assert.equal(verlaufTaste(zustand, { code: "Tab" }).zustand, null);
});

test("Anzeige: Menü, Bestätigung, Verlauf, Seitenleiste und Bedienzeile ohne fehlende Texte", (t) => {
  const warnungen = [];
  t.mock.method(console, "warn", (meldung) => warnungen.push(meldung));
  const spiel = neuesSpiel(daten, 7);
  const log = new Log(ohneDom(), texte);
  log.leeren(spiel);
  log.zeile("Willkommen.");
  log.hinzufuegen({ spalte: "kampf", art: "angriff", text: "Hieb.", seite: "ninkasi", ton: "treffer", zahlen: [{ text: "9", klasse: "menge" }] });
  const umgebung = { spiel, daten, texte, belegung, logzeilen: log.zeilen, einstellungen: vorgaben, version: "test" };
  const zeigen = (art, zustand) => fensterHtml(umgebung, fensterOeffnen([], art, zustand));
  assert.match(zeigen("menue", menueOeffnen()), /Spielmenü.*Einstellungen.*Neuer Lauf/s);
  assert.match(zeigen("bestaetigung", { frage: "menue.neustart_frage", aktion: "neustart" }), /Wirklich\?/);
  const verlauf = zeigen("verlauf", verlaufOeffnen());
  assert.match(verlauf, /Willkommen.*Hieb/s);
  assert.doesNotMatch(verlauf, /schmal/, "der Verlauf ist breit");
  assert.doesNotMatch(zeigen("verlauf", { filter: "kampf", versatz: 0 }), /Willkommen/);
  const seitenleiste = new Oberflaeche(ohneDom(), texte, "test");
  seitenleiste.anzeigen(spiel, { hervorgehobenId: spiel.zustand.spielerinId });
  assert.match(seitenleiste.kopfHtml(spiel), /Tiefe \d+ · Zug \d+/);
  const bedienzeile = new Bedienzeile(ohneDom(), texte, belegung);
  bedienzeile.anzeigen(spiel, leistenNachfuehren(spiel, neueLeisten()));
  assert.match(bedienzeile.element.innerHTML, /class="leiste-nummer"[^>]*>1</);
  assert.equal((bedienzeile.element.innerHTML.match(/data-platz=/g) || []).length, 10);
  assert.equal((bedienzeile.element.innerHTML.match(/data-aktion=/g) || []).length, 8);
  assert.match(bedienzeile.element.innerHTML, /Gepäck.*Karte.*Menü/s);
  assert.match(zeigen("karte", {}), /uebersichtskarte.*Treppe/s);
  assert.match(zeigen("faehigkeiten", { gewaehlt: null }), /Fähigkeiten/);
  assert.match(zeigen("inventar", { gewaehlt: null, absicht: "werfen" }), /Werfen/);
  assert.deepEqual(warnungen, []);
});

test("Minikarte: Farbe je erkundetem Feld, gedämpft außer Sicht, Punkte für Treppe, Wesen und zuletzt Ninkasi", () => {
  const spiel = miniSpiel(["#####", "#..>#", "#####"]);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  wesen(spiel, 2, 1, "feinde", 10);
  spiel.zustand.ebene.erkundet[0] = 0;
  spiel.zustand.sichtbareFelder = [6, 7, 8];
  const bild = minikartenBild(spiel, daten.zeichen);
  assert.deepEqual([bild.breite, bild.hoehe, bild.felder.length], [5, 3, 15]);
  assert.equal(bild.felder[0], null, "unerkundet");
  assert.equal(bild.felder[6], daten.zeichen.gelaende.boden.farbe);
  assert.deepEqual([bild.gedaempft[6], bild.gedaempft[1]], [false, true]);
  assert.deepEqual(bild.punkte.map(({ art }) => art), ["treppe", "gegner", "ninkasi"]);
  assert.equal(bild.punkte.at(-1).id, ninkasi.id);
  assert.equal(feldgroesseFuer(400, 120, 3), 3);
  assert.equal(feldgroesseFuer(200, 120, 3), 1);
  assert.deepEqual(feldAmPunkt(bild, 3, 7, 4), { x: 2, y: 1 });
  assert.equal(feldAmPunkt(bild, 3, 99, 4), null);
});
