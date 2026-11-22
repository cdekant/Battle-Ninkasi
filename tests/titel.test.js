// Titelbildschirm 0.32.0: Speicherplätze mit Vorschau, Titel und Läufe, Fenster nach dem Lauf, Chronik, Spielart,
// Korpus und Titelbilder
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import korpusliste from "../sprache/de/korpus/index.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen, SPIELARTEN } from "../src/kern/spiel.js";
import { spielerin } from "../src/kern/zustand.js";
import { speicherstandText, speicherstandLesen, platzVorschau, platzFuerNeuesSpiel, zuletztGespielt, platzSpielbar, vorschauAusSpiel, ANZAHL_PLAETZE } from "../src/eingabe/speicherstand.js";
import { neueLeisten } from "../src/eingabe/schnellleiste.js";
import { titelEintraege, titelOeffnen, titelTaste, titelKlick, laeufeOeffnen, laeufeTaste, laeufeKlick } from "../src/eingabe/titel.js";
import { endeOeffnen, endeTaste, ENDE_EINTRAEGE } from "../src/eingabe/menue.js";
import { fensterOeffnen, fensterTaste } from "../src/eingabe/fenster.js";
import "../src/eingabe/hilfe.js";
import "../src/eingabe/verlauf.js";
import { neueChronik, chronikGueltig, meldungZaehlen, sichtungenZaehlen, laufEintragen, zaehlerstand, freigeschaltet, HOECHSTENS_LAEUFE } from "../src/eingabe/chronik.js";
import { korpustextZerlegen, saetzeAus, spruchWaehlen } from "../src/anzeige/korpus.js";
import { TITELBILDER, titelbildWaehlen } from "../src/anzeige/titelbilder.js";
import { titelHtml, speicherplatzText } from "../src/anzeige/titel.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/systemfenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });

const spielbar = (gespeichertAm) => ({ vorschau: { tiefe: 1, zuege: 10, gespeichertAm } });
const veraltet = { vorschau: null, grund: "version", version: "0.31.0" };

test("Speicherstand: Vorschau ohne Zustand lesen, gesehene Arten kommen zurück, veraltet und kaputt", () => {
  const spiel = neuesSpiel(daten, 7);
  befehlGeben(spiel, { art: "warten" });
  const text = speicherstandText(spiel, { leisten: neueLeisten(), gesehen: new Set(["essigbakterium"]), gespeichertAm: 1234 });
  const platz = platzVorschau(text);
  assert.deepEqual(platz.vorschau, vorschauAusSpiel(spiel, 1234));
  assert.equal(platz.vorschau.zuege, spielerin(spiel.zustand).zuege);
  assert.ok(platzSpielbar(platz));
  assert.deepEqual(speicherstandLesen(daten, text).oberflaeche.gesehen, ["essigbakterium"]);
  assert.equal(platzVorschau(null), null, "leer");
  assert.deepEqual(platzVorschau("{kaputt"), { grund: "kaputt" });
  const alt = platzVorschau(JSON.stringify({ ...JSON.parse(text), version: "0.0.1" }));
  assert.equal(alt.grund, "version");
  assert.equal(alt.version, "0.0.1");
  assert.ok(!platzSpielbar(alt));
});

test("Speicherplätze: neues Spiel nimmt den ersten leeren, dann einen veralteten Platz; zuletzt gespielt", () => {
  assert.equal(ANZAHL_PLAETZE, 3);
  assert.equal(platzFuerNeuesSpiel([spielbar(1), null, null]), 1);
  assert.equal(platzFuerNeuesSpiel([spielbar(1), veraltet, null]), 2, "leer vor veraltet");
  assert.equal(platzFuerNeuesSpiel([spielbar(1), veraltet, spielbar(2)]), 1);
  assert.equal(platzFuerNeuesSpiel([spielbar(1), spielbar(2), spielbar(3)]), null);
  assert.equal(zuletztGespielt([spielbar(5), veraltet, spielbar(9)]), 2);
  assert.equal(zuletztGespielt([null, veraltet, null]), null);
});

test("Titel: Einträge nach den Plätzen, Fortsetzen nimmt den letzten Lauf, Esc schließt nicht", () => {
  assert.deepEqual(titelEintraege([null, null, null]), ["neues_spiel", "testkammer", "arena", "einstellungen", "hilfe", "beenden"]);
  assert.deepEqual(titelEintraege([spielbar(1), null, null]), ["fortsetzen", "neues_spiel", "testkammer", "arena", "einstellungen", "hilfe", "beenden"]);
  assert.deepEqual(titelEintraege([veraltet, spielbar(1), null]), ["fortsetzen", "neues_spiel", "testkammer", "arena", "laeufe", "einstellungen", "hilfe", "beenden"], "Läufe ab zwei belegten Plätzen");
  const plaetze = [spielbar(1), null, spielbar(8)];
  assert.deepEqual(titelTaste(titelOeffnen(), { code: "Enter" }, { plaetze }).aktion, { art: "fortsetzen", stelle: 2 }, "Fortsetzen ist vorgewählt");
  assert.deepEqual(titelTaste(titelOeffnen(), { code: "KeyB", zeichen: "b" }, { plaetze }).aktion, { art: "neuesSpiel", stelle: 1 });
  assert.deepEqual(titelTaste(titelOeffnen(), { code: "Escape" }, { plaetze }).zustand, titelOeffnen());
  assert.deepEqual(titelTaste(titelOeffnen(), { code: "KeyC", zeichen: "c" }, { plaetze }).aktion, { art: "neuesSpiel", stelle: 1, spielart: "allmaechtig" }, "Testkammer");
  assert.equal(titelTaste(titelOeffnen(), { code: "KeyD", zeichen: "d" }, { plaetze }).oeffnen.art, "arenawahl");
  assert.equal(titelTaste(titelOeffnen(), { code: "KeyH", zeichen: "h" }, { plaetze }).aktion, "beenden");
  assert.equal(titelTaste(titelOeffnen(), { code: "KeyF", zeichen: "f" }, { plaetze }).oeffnen.art, "einstellungen");
  assert.deepEqual(titelKlick(titelOeffnen(), { stelle: 0 }, { plaetze }).aktion, { art: "fortsetzen", stelle: 0 }, "Klick auf einen Platz");
  assert.deepEqual(titelKlick(titelOeffnen(), { stelle: 1 }, { plaetze }).aktion, { art: "neuesSpiel", stelle: 1 }, "Klick auf einen freien Platz");
});

test("Läufe: alle belegt verdrängt einen Lauf mit Nachfrage; veraltete fragen; Entf löscht mit Nachfrage", () => {
  const voll = [spielbar(1), spielbar(2), spielbar(3)];
  const ergebnis = titelTaste(titelOeffnen(), { code: "KeyB", zeichen: "b" }, { plaetze: voll });
  assert.equal(ergebnis.oeffnen.art, "laeufe");
  assert.equal(ergebnis.oeffnen.zustand.zweck, "ersetzen");
  const stapel = fensterTaste(fensterOeffnen([], "titel", titelOeffnen()), { code: "KeyB", zeichen: "b" }, { plaetze: voll }).stapel;
  const nachfrage = fensterTaste(stapel, { code: "KeyB", zeichen: "b" }, { plaetze: voll });
  assert.deepEqual(nachfrage.stapel.map(({ art }) => art), ["titel", "laeufe", "bestaetigung"]);
  assert.deepEqual(fensterTaste(nachfrage.stapel, { code: "KeyJ", zeichen: "j" }, {}).aktion, { art: "neuesSpiel", stelle: 1 });
  const testkammer = titelTaste(titelOeffnen(), { code: "KeyC", zeichen: "c" }, { plaetze: voll });
  assert.deepEqual(testkammer.oeffnen.zustand, { gewaehlt: 0, zweck: "ersetzen", spielart: "allmaechtig" }, "Testkammer ersetzt einen Lauf");
  const ersetzen = laeufeTaste(testkammer.oeffnen.zustand, { code: "KeyA", zeichen: "a" }, { plaetze: voll });
  assert.deepEqual(ersetzen.oeffnen.zustand.aktion, { art: "neuesSpiel", stelle: 0, spielart: "allmaechtig" });
  const mitAltem = [spielbar(1), veraltet, null];
  assert.equal(laeufeTaste(laeufeOeffnen("fortsetzen", mitAltem), { code: "KeyB", zeichen: "b" }, { plaetze: mitAltem }).oeffnen.zustand.frage, "laeufe.veraltet_frage");
  assert.deepEqual(laeufeTaste(laeufeOeffnen("fortsetzen", mitAltem), { code: "KeyC", zeichen: "c" }, { plaetze: mitAltem }).aktion, { art: "neuesSpiel", stelle: 2 }, "freier Platz beginnt neu");
  assert.deepEqual(laeufeTaste({ gewaehlt: 0, zweck: "fortsetzen" }, { code: "Delete" }, { plaetze: mitAltem }).oeffnen.zustand.aktion, { art: "platzLoeschen", stelle: 0 });
  assert.equal(laeufeTaste({ gewaehlt: 2, zweck: "fortsetzen" }, { code: "Delete" }, { plaetze: mitAltem }).oeffnen, undefined, "ein leerer Platz ist nicht zu löschen");
  assert.equal(laeufeKlick({ gewaehlt: 0, zweck: "fortsetzen" }, { stelle: 2 }, { plaetze: mitAltem }).zustand.gewaehlt, 2, "erster Klick wählt");
  assert.deepEqual(laeufeKlick({ gewaehlt: 0, zweck: "fortsetzen" }, { stelle: 0 }, { plaetze: mitAltem }).aktion, { art: "fortsetzen", stelle: 0 }, "zweiter Klick wirkt");
});

test("Fenster nach dem Lauf: neuer Lauf, zum Titel, Verlauf darüber; Esc schließt", () => {
  assert.deepEqual(ENDE_EINTRAEGE, ["neustart", "zum_titel", "verlauf"]);
  assert.deepEqual(endeTaste(endeOeffnen(), { code: "Enter" }), { zustand: null, aktion: "neustart" });
  assert.deepEqual(endeTaste(endeOeffnen(), { code: "KeyB", zeichen: "b" }), { zustand: null, aktion: "zum_titel" });
  assert.equal(endeTaste(endeOeffnen(), { code: "KeyC", zeichen: "c" }).oeffnen.art, "verlauf");
  assert.equal(endeTaste(endeOeffnen(), { code: "Escape" }).zustand, null);
});

test("Titel: eigene Ebene mit Bild, Menü, Plätzen und Spruch; Fenster darüber ohne den Titel im Weg", () => {
  const plaetze = [spielbar(Date.UTC(2026, 10, 21)), veraltet, null];
  const umgebung = { texte, plaetze, titelbild: TITELBILDER[0], spruch: { verse: ["Erster Vers,", "zweiter Vers."], titel: "Hymne" }, version: "test" };
  const stapel = fensterOeffnen([], "titel", titelOeffnen());
  const html = titelHtml(umgebung, stapel);
  for (const erwartet of [TITELBILDER[0].datei, "Battle Ninkasi", "Die Rückkehr der Bierschlächterin", "Fortsetzen", "Erster Vers,<br>zweiter Vers.", "Hymne", "aus Version 0.31.0", "Platz 3: frei"]) assert.ok(html.includes(erwartet), erwartet);
  assert.equal(fensterHtml(umgebung, stapel), "", "der Titel ist kein Fenster");
  assert.equal(titelHtml(umgebung, fensterOeffnen([], "menue", {})), "");
  const mitHilfe = fensterOeffnen(stapel, "hilfe", { thema: "titel" });
  const hilfe = fensterHtml(umgebung, mitHilfe);
  assert.match(hilfe, /<h1>Hilfe/, "der Titel steht nicht im Weg durch den Stapel");
  assert.match(hilfe, /drei Plätze/);
  assert.equal(speicherplatzText(texte, plaetze[0], 0), "Platz 1: Tiefe 1, Zug 10, 21.11.2026");
});

test("Chronik: Siege Ninkasis und Tode zählen, Sichtungen einmal je Lauf, Läufe mit Ergebnis, Freischaltung", () => {
  const chronik = neueChronik();
  const spiel = { zustand: { spielerinId: 1 }, optionen: {} };
  meldungZaehlen(chronik, spiel, { art: "tod", opfer: { id: 5, typ: "essigbakterium" }, quelle: { id: 1 } });
  meldungZaehlen(chronik, spiel, { art: "tod", opfer: { id: 6, typ: "essigbakterium" }, quelle: { id: 7 } });
  meldungZaehlen(chronik, spiel, { art: "tod", opfer: { id: 1, typ: "ninkasi" }, quelle: { id: 7, typ: "abstinenzler" } });
  meldungZaehlen(chronik, spiel, { art: "getrunken" });
  assert.deepEqual(chronik.zaehler, { "besiegt.essigbakterium": 1, tode: 1 });
  const zustand = {
    spielerinId: 1, ebene: { breite: 10 }, sichtbareFelder: [12, 13],
    entitaeten: { 1: { id: 1, typ: "ninkasi", fraktion: "n", position: { x: 2, y: 1 } }, 2: { id: 2, typ: "hefe", fraktion: "f", position: { x: 3, y: 1 } }, 3: { id: 3, typ: "hefe", fraktion: "f", position: { x: 3, y: 1 } }, 4: { id: 4, typ: "schimmel", fraktion: "f", position: { x: 9, y: 9 } } },
  };
  const gesehen = new Set();
  sichtungenZaehlen(chronik, { zustand }, gesehen);
  sichtungenZaehlen(chronik, { zustand }, gesehen);
  assert.equal(zaehlerstand(chronik, "gesehen.hefe"), 1, "einmal je Lauf");
  assert.equal(zaehlerstand(chronik, "gesehen.schimmel"), 0, "nicht in Sicht");
  assert.equal(zaehlerstand(chronik, "gesehen.ninkasi"), 0);
  const echt = neuesSpiel(daten, 3);
  laufEintragen(chronik, echt, { ergebnis: "tod", datum: 1, version: "test", todesmeldung: { quelle: { typ: "abstinenzler" }, ursache: "schlag" } });
  assert.deepEqual(chronik.laeufe[0], { version: "test", startwert: 3, spielart: "normal", datum: 1, tiefe: echt.zustand.tiefe, zuege: 0, befehle: 0, ergebnis: "tod", ursache: { quelle: "abstinenzler", ursache: "schlag" } });
  for (let i = 0; i < HOECHSTENS_LAEUFE + 5; i++) laufEintragen(chronik, echt, { ergebnis: "aufgegeben", datum: 2, version: "test" });
  assert.equal(chronik.laeufe.length, HOECHSTENS_LAEUFE, "älteste fallen heraus");
  assert.equal(zaehlerstand(chronik, "laeufe"), HOECHSTENS_LAEUFE + 6, "der Zähler bleibt");
  assert.ok(freigeschaltet(chronik, null));
  assert.ok(freigeschaltet(chronik, { zaehler: "besiegt.essigbakterium", mindestens: 1 }));
  assert.ok(!freigeschaltet(chronik, { zaehler: "besiegt.abstinenzler", mindestens: 1 }));
  assert.deepEqual(chronikGueltig(JSON.parse(JSON.stringify(chronik))), chronik, "übersteht JSON");
  assert.deepEqual(chronikGueltig({ format: 99 }), neueChronik());
  assert.deepEqual(chronikGueltig({ format: 1, laeufe: [], zaehler: { gut: 2, schlecht: -1, text: "x" } }).zaehler, { gut: 2 });
});

test("Spielart: Startoption mit Vorgabe normal, unbekannte wirft, Nachspielen behält sie", () => {
  assert.deepEqual(SPIELARTEN, ["normal", "allmaechtig", "arena"]);
  const spiel = neuesSpiel(daten, 11);
  assert.equal(spiel.optionen.spielart, "normal");
  befehlGeben(spiel, { art: "warten" });
  assert.equal(nachspielen(daten, spielstand(spiel)).optionen.spielart, "normal");
  assert.throws(() => neuesSpiel(daten, 11, { spielart: "weich" }), /Unbekannte Spielart/);
});

test("Korpus: Liste passt zum Ordner, Kopf und Verse ohne Sprecher, Sätze höchstens drei Verse, ein Spruch", () => {
  const imOrdner = readdirSync("sprache/de/korpus").filter((name) => name.endsWith(".md")).sort();
  assert.deepEqual([...korpusliste].sort(), imOrdner);
  const korpustexte = korpusliste.map((name) => korpustextZerlegen(name, readFileSync(`sprache/de/korpus/${name}`, "utf8")));
  for (const korpustext of korpustexte) {
    assert.ok(korpustext.kopf.titel, korpustext.name);
    for (const strophe of korpustext.strophen) for (const vers of strophe) assert.doesNotMatch(vers, /^\(|"/, vers);
  }
  const saetze = korpustexte.flatMap((korpustext) => saetzeAus(korpustext));
  assert.ok(saetze.length >= 20, `nur ${saetze.length} Sätze`);
  for (const satz of saetze) {
    assert.ok(satz.verse.length >= 1 && satz.verse.length <= 3);
    assert.ok(!satz.verse.some((vers) => vers.includes("...")), "keine Lücken");
  }
  const zerlegt = korpustextZerlegen("probe.md", "---\ntitel: Probe\n---\n\n(Chor:) \"Eins, zwei,\ndrei.\"\n\nVier\nfünf,\nsechs,\nsieben,\nacht.\n");
  assert.deepEqual(zerlegt.strophen, [["Eins, zwei,", "drei."], ["Vier", "fünf,", "sechs,", "sieben,", "acht."]]);
  assert.deepEqual(saetzeAus(zerlegt).map(({ verse }) => verse), [["Eins, zwei,", "drei."], ["Vier", "fünf…"]], "langer Satz als Ausschnitt");
  assert.deepEqual(spruchWaehlen([zerlegt], 0), { verse: ["Eins, zwei,", "drei."], titel: "Probe" });
  assert.equal(spruchWaehlen([], 0.5), null);
});

test("Titelbilder: jede Datei existiert, Fokus in Prozent, Wahl nur unter freigeschalteten", () => {
  for (const bild of TITELBILDER) {
    assert.ok(existsSync(bild.datei), bild.datei);
    assert.ok(bild.fokus.x >= 0 && bild.fokus.x <= 100 && bild.fokus.y >= 0 && bild.fokus.y <= 100);
  }
  const chronik = neueChronik();
  assert.ok(TITELBILDER.includes(titelbildWaehlen(chronik, 0.99)));
  assert.equal(titelbildWaehlen(chronik, 0), TITELBILDER[0]);
});
