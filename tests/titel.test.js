// Titelbildschirm 0.32.0: Speicherplätze mit Vorschau, Titel und Läufe, Fenster nach dem Lauf, Chronik, Spielart,
// Korpus, Titelbilder und ihre Effekte
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { rohdaten, texteDe } from "../src/inhalt.js";
import grammatikDe from "../sprache/de/grammatik.js";
import korpuslisteDe from "../sprache/de/korpus/index.js";
import korpuslisteEn from "../sprache/en/korpus/index.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen, SPIELARTEN } from "../src/kern/spiel.js";
import { spielerin } from "../src/kern/zustand.js";
import { speicherstandText, speicherstandLesen, platzVorschau, platzFuerNeuesSpiel, zuletztGespielt, platzSpielbar, vorschauAusSpiel, ANZAHL_PLAETZE } from "../src/eingabe/speicherstand.js";
import { neueLeisten } from "../src/eingabe/schnellleiste.js";
import { titelEintraege, titelOeffnen, titelTaste, titelKlick, laeufeOeffnen, laeufeTaste, laeufeKlick } from "../src/eingabe/titel.js";
import { endeOeffnen, endeTaste, ENDE_EINTRAEGE } from "../src/eingabe/menue.js";
import { fensterOeffnen, fensterTaste } from "../src/eingabe/fenster.js";
import "../src/eingabe/hilfe.js";
import "../src/eingabe/verlauf.js";
import { neueChronik, chronikGueltig, meldungZaehlen, sichtungenZaehlen, laufEintragen, zaehlerstand, freigeschaltet, HOECHSTENS_LAEUFE, CHRONIK_FORMAT, CHRONIK_MIGRATIONEN } from "../src/eingabe/chronik.js";
import { korpustextZerlegen, saetzeAus, spruchWaehlen } from "../src/anzeige/korpus.js";
import { TITELBILDER, titelbildWaehlen } from "../src/anzeige/titelbilder.js";
import { ausschnittWaehlen, augenLeuchten, funkenBahn, blitzErzeugen, blitzHelligkeit, weichesLeuchten } from "../src/anzeige/titeleffekte.js";
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
  const platz = platzVorschau(text, daten.pruefsumme);
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
  const andereDaten = platzVorschau(text, "00000000");
  assert.equal(andereDaten.grund, "daten", "andere Prüfsumme der Daten");
  assert.deepEqual(andereDaten.vorschau, platz.vorschau);
  assert.ok(!platzSpielbar(andereDaten));
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
  const mitAnderenDaten = [{ vorschau: null, grund: "daten" }, null, null];
  assert.equal(laeufeTaste(laeufeOeffnen("fortsetzen", mitAnderenDaten), { code: "KeyA", zeichen: "a" }, { plaetze: mitAnderenDaten }).oeffnen.zustand.frage, "laeufe.daten_frage", "andere Daten fragen eigens");
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
  assert.equal(speicherplatzText(texte, { vorschau: null, grund: "daten" }, 1), "Platz 2: Daten geändert, nicht mehr spielbar");
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
  assert.deepEqual(chronik.laeufe[0], { version: "test", pruefsumme: daten.pruefsumme, startwert: 3, spielart: "normal", datum: 1, tiefe: echt.zustand.tiefe, zuege: 0, befehle: 0, ergebnis: "tod", ursache: { quelle: "abstinenzler", ursache: "schlag" } });
  for (let i = 0; i < HOECHSTENS_LAEUFE + 5; i++) laufEintragen(chronik, echt, { ergebnis: "aufgegeben", datum: 2, version: "test" });
  assert.equal(chronik.laeufe.length, HOECHSTENS_LAEUFE, "älteste fallen heraus");
  assert.equal(zaehlerstand(chronik, "laeufe"), HOECHSTENS_LAEUFE + 6, "der Zähler bleibt");
  assert.ok(freigeschaltet(chronik, null));
  assert.ok(freigeschaltet(chronik, { zaehler: "besiegt.essigbakterium", mindestens: 1 }));
  assert.ok(!freigeschaltet(chronik, { zaehler: "besiegt.abstinenzler", mindestens: 1 }));
  assert.deepEqual(chronikGueltig(JSON.parse(JSON.stringify(chronik))), chronik, "übersteht JSON");
  assert.deepEqual(chronikGueltig({ format: CHRONIK_FORMAT + 1 }), { ...neueChronik(), neueresFormat: true }, "neueres Format bleibt unberührt");
  assert.deepEqual(chronikGueltig({ laeufe: [], zaehler: {} }), neueChronik(), "ohne Format unlesbar");
  assert.deepEqual(chronikGueltig({ format: 1, laeufe: [], zaehler: { gut: 2, schlecht: -1, text: "x" } }).zaehler, { gut: 2 });
});

test("Chronik: jedes ältere Format hat eine Migration, eine Migration führt genau ein Format weiter", () => {
  for (let format = 1; format < CHRONIK_FORMAT; format++) assert.equal(typeof CHRONIK_MIGRATIONEN[format], "function", `Migration aus Format ${format} fehlt`);
  for (const format of Object.keys(CHRONIK_MIGRATIONEN).map(Number)) {
    assert.ok(Number.isInteger(format) && format >= 1 && format < CHRONIK_FORMAT, `Migration aus Format ${format} passt nicht`);
    assert.equal(CHRONIK_MIGRATIONEN[format]({ format, laeufe: [], zaehler: {} }).format, format + 1);
  }
});

test("Spielart: Startoption mit Vorgabe normal, unbekannte wirft, Nachspielen behält sie", () => {
  assert.deepEqual(SPIELARTEN, ["normal", "allmaechtig", "arena"]);
  const spiel = neuesSpiel(daten, 11);
  assert.equal(spiel.optionen.spielart, "normal");
  befehlGeben(spiel, { art: "warten" });
  assert.equal(nachspielen(daten, spielstand(spiel)).optionen.spielart, "normal");
  assert.throws(() => neuesSpiel(daten, 11, { spielart: "weich" }), /Unbekannte Spielart/);
});

test("Korpus je Sprache: Liste passt zum Ordner, Kopf und Verse ohne Sprecher, Sätze höchstens drei Verse, ein Spruch", () => {
  for (const [code, korpusliste] of Object.entries({ de: korpuslisteDe, en: korpuslisteEn })) {
    const imOrdner = readdirSync(`sprache/${code}/korpus`).filter((name) => name.endsWith(".md")).sort();
    assert.deepEqual([...korpusliste].sort(), imOrdner, code);
    const korpustexte = korpusliste.map((name) => korpustextZerlegen(name, readFileSync(`sprache/${code}/korpus/${name}`, "utf8")));
    for (const korpustext of korpustexte) {
      assert.ok(korpustext.kopf.titel, korpustext.name);
      for (const strophe of korpustext.strophen) for (const vers of strophe) assert.doesNotMatch(vers, /^\(|"/, vers);
    }
    const saetze = korpustexte.flatMap((korpustext) => saetzeAus(korpustext));
    assert.ok(saetze.length >= 20, `${code}: nur ${saetze.length} Sätze`);
    for (const satz of saetze) {
      assert.ok(satz.verse.length >= 1 && satz.verse.length <= 3);
      assert.ok(!satz.verse.some((vers) => vers.includes("...")), "keine Lücken");
    }
  }
  const zerlegt = korpustextZerlegen("probe.md", "---\ntitel: Probe\n---\n\n(Chor:) \"Eins, zwei,\ndrei.\"\n\nVier\nfünf,\nsechs,\nsieben,\nacht.\n");
  assert.deepEqual(zerlegt.strophen, [["Eins, zwei,", "drei."], ["Vier", "fünf,", "sechs,", "sieben,", "acht."]]);
  assert.deepEqual(saetzeAus(zerlegt).map(({ verse }) => verse), [["Eins, zwei,", "drei."], ["Vier", "fünf…"]], "langer Satz als Ausschnitt");
  assert.deepEqual(spruchWaehlen([zerlegt], 0), { verse: ["Eins, zwei,", "drei."], titel: "Probe" });
  assert.equal(spruchWaehlen([], 0.5), null);
});

test("Titelbilder: jede Datei existiert, Schutzbereich in Prozent, Wahl nur unter freigeschalteten", () => {
  for (const bild of TITELBILDER) {
    assert.ok(existsSync(bild.datei), bild.datei);
    const { links, oben, rechts, unten } = bild.schutzbereich;
    assert.ok(links >= 0 && links < rechts && rechts <= 100 && oben >= 0 && oben < unten && unten <= 100, bild.datei);
  }
  const chronik = neueChronik();
  assert.ok(TITELBILDER.includes(titelbildWaehlen(chronik, 0.99)));
  assert.equal(titelbildWaehlen(chronik, 0), TITELBILDER[0]);
});

test("Titeleffekte: Masken und Sprites existieren, Punkte in Prozent, nur bekannte Masken", () => {
  const imBild = (punkt) => punkt.x >= 0 && punkt.x <= 100 && punkt.y >= 0 && punkt.y <= 100;
  for (const { datei, effekte } of TITELBILDER) {
    if (!effekte) continue;
    const masken = effekte.masken ?? {};
    for (const maske of Object.values(masken)) assert.ok(existsSync(maske), maske);
    for (const datei of Object.values(effekte.sprites ?? {}).flat()) assert.ok(existsSync(datei), datei);
    for (const ventil of effekte.dampfstoesse ?? []) assert.ok(["links", "rechts"].includes(ventil.richtung), `${datei}: Ventil ${JSON.stringify(ventil)}`);
    const genannt = [...(effekte.vordergrund ?? []), effekte.aura, effekte.blitze?.widerschein, effekte.blitze?.ueberschlagMaske, effekte.blitze?.kontur].filter(Boolean);
    for (const name of genannt) assert.ok(name in masken, `${datei}: Maske ${name}`);
    for (const wesen of effekte.augen ?? []) assert.ok(["gelb", "rot"].includes(wesen.farbe) && wesen.groesse > 0 && wesen.punkte.length, `${datei}: Augen`);
    const punkte = [...(effekte.dampf ?? []), ...(effekte.dampfstoesse ?? []), ...(effekte.augen ?? []).flatMap((wesen) => wesen.punkte), ...(effekte.blitze?.quellen ?? []), ...(effekte.blitze?.ziele ?? []), ...(effekte.blitze?.ueberschlaege ?? [])];
    for (const punkt of punkte) assert.ok(imBild(punkt), `${datei}: ${JSON.stringify(punkt)}`);
    if (effekte.blitze) assert.ok(effekte.blitze.quellen.length && effekte.blitze.ziele.length, `${datei}: Blitze brauchen Quellen und Ziele`);
  }
});

test("Titeleffekte: Blitz verästelt, trifft sein Ziel und folgt dem Zufall", () => {
  const zufallAus = (startwert) => {
    let wert = startwert;
    return () => ((wert = (wert * 1103515245 + 12345) % 2147483648) / 2147483648);
  };
  const von = { x: 100, y: 50 };
  const nach = { x: 900, y: 700 };
  const straenge = blitzErzeugen(von, nach, zufallAus(7));
  const [haupt, ...aeste] = straenge;
  assert.deepEqual(haupt.punkte[0], von);
  assert.deepEqual(haupt.punkte.at(-1), nach);
  assert.equal(haupt.punkte.length, 2 ** 6 + 1, "sechs Stufen Halbierung");
  assert.equal(haupt.staerke, 1);
  for (const ast of aeste) {
    assert.ok(ast.staerke < 1 && ast.tiefe >= 1 && ast.tiefe <= 2);
    assert.ok(ast.punkte.length < haupt.punkte.length);
  }
  for (const strang of straenge) for (const punkt of strang.punkte) assert.ok(Number.isFinite(punkt.x) && Number.isFinite(punkt.y));
  assert.deepEqual(blitzErzeugen(von, nach, zufallAus(7)), straenge, "gleicher Zufall, gleicher Blitz");
  // über viele Blitze gibt es Äste
  const astZahl = Array.from({ length: 20 }, (_, i) => blitzErzeugen(von, nach, zufallAus(i + 1)).length - 1).reduce((summe, zahl) => summe + zahl, 0);
  assert.ok(astZahl >= 20, `Äste: ${astZahl}`);
  assert.equal(blitzErzeugen(von, nach, zufallAus(3), { astTiefe: 0 }).length, 1, "ohne Äste nur der Hauptpfad");
});

test("Titeleffekte: Blitz flackert kurz, Lichthöfe schwellen weich", () => {
  assert.equal(blitzHelligkeit(-1), 0);
  assert.equal(blitzHelligkeit(0), 1);
  assert.ok(blitzHelligkeit(70) < blitzHelligkeit(100), "Nachschlag nach kurzem Dunkel");
  assert.equal(blitzHelligkeit(10000), 0);
  // weich: nach dem Anstieg nur noch fallend, ohne zweiten Gipfel
  let vorher = weichesLeuchten(60, 600);
  assert.equal(vorher, 1);
  for (let alter = 80; alter < 600; alter += 20) {
    const jetzt = weichesLeuchten(alter, 600);
    assert.ok(jetzt <= vorher);
    vorher = jetzt;
  }
  assert.equal(weichesLeuchten(600, 600), 0);
});

test("Titelbild: Ausschnitt füllt Höhe und freie Mitte, der Schutzbereich rückt in die Mitte", () => {
  const ninkasi = { links: 27, oben: 31, rechts: 72, unten: 85 };
  const nahe = (wert, soll) => Math.abs(wert - soll) < 0.01;
  // 16:9 mit Spalten von 384 px: das Bild füllt genau die freie Mitte (1152 px), seitlich unter den Spalten Rand,
  // oben und unten steht es 72 px über; der Schutzbereich rückt so weit nach oben, wie es ohne Lücke geht
  const breitbild = ausschnittWaehlen(1920, 1080, 2000, 2000, ninkasi, { links: 384, rechts: 1536 });
  assert.ok(nahe(breitbild.massstab, 0.576) && nahe(breitbild.versatzX, 384) && nahe(breitbild.versatzY, -72), JSON.stringify(breitbild));
  // ohne Spalten füllt es die ganze Breite und wird oben und unten beschnitten
  const ohneSpalten = ausschnittWaehlen(1920, 1080, 2000, 2000, ninkasi);
  assert.ok(nahe(ohneSpalten.massstab, 0.96) && ohneSpalten.versatzX === 0, JSON.stringify(ohneSpalten));
  // sehr breit: die freie Mitte ist breiter als das Bild hoch, es wird größer und oben und unten beschnitten,
  // der Schutzbereich steht senkrecht mittig, ohne Lücke
  const sehrBreit = ausschnittWaehlen(2560, 1080, 2000, 2000, ninkasi, { links: 384, rechts: 2176 });
  assert.ok(nahe(sehrBreit.massstab, 0.896));
  const bildhoehe = 2000 * sehrBreit.massstab;
  assert.ok(nahe(sehrBreit.versatzY + ((ninkasi.oben + ninkasi.unten) / 200) * bildhoehe, 540), "Schutzbereich senkrecht mittig");
  assert.ok(sehrBreit.versatzY <= 0 && sehrBreit.versatzY >= 1080 - bildhoehe, "keine Lücke");
  // hoch und schmal: Höhe füllt, waagerecht rückt der Schutzbereich in die freie Mitte
  const hoch = ausschnittWaehlen(1000, 1500, 2000, 2000, ninkasi, { links: 400, rechts: 1000 });
  assert.ok(nahe(hoch.massstab, 0.75) && hoch.versatzY === 0);
  assert.ok(nahe(hoch.versatzX + ((ninkasi.links + ninkasi.rechts) / 200) * 1500, 700), `Mitte bei 700 px: ${hoch.versatzX}`);
  // nicht weiter verschieben, als das Bild Rand hat
  assert.equal(ausschnittWaehlen(1000, 1500, 2000, 2000, ninkasi, { links: 900, rechts: 1000 }).versatzX, 0);
  assert.equal(ausschnittWaehlen(1000, 1500, 2000, 2000, ninkasi, { links: 0, rechts: 100 }).versatzX, -500);
  // Schutzbereich höher als das Fenster: sein oberer Rand bleibt sichtbar
  const flach = ausschnittWaehlen(3000, 600, 2000, 2000, ninkasi);
  assert.ok(nahe(flach.versatzY, -0.31 * 2000 * flach.massstab), `oberer Rand bei ${flach.versatzY}`);
});

test("Titeleffekte: Augen schwellen zwischen schwach und hell", () => {
  const werte = Array.from({ length: 100 }, (_, i) => augenLeuchten(i * 40, 4000, 0));
  assert.ok(Math.min(...werte) > 0.1 && Math.max(...werte) < 0.9);
  assert.ok(Math.max(...werte) - Math.min(...werte) > 0.6, "deutliches An- und Abschwellen");
});

test("Titeleffekte: Feuerwerksfunken fliegen geradeaus nach außen", () => {
  const start = { x: 100, y: 100 };
  assert.deepEqual(funkenBahn(start, 0, 120, 0), start);
  const waagerecht = funkenBahn(start, 0, 120, 500);
  assert.ok(Math.abs(waagerecht.x - 160) < 1e-9 && Math.abs(waagerecht.y - 100) < 1e-9, "eine halbe Sekunde mit 120 px/s, ohne Absinken");
  const schraeg = funkenBahn(start, Math.PI / 4, 100, 1000);
  assert.ok(Math.abs(schraeg.x - schraeg.y) < 1e-9, "auf der Geraden im Winkel");
});
