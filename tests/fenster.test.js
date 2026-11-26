// Fensterstapel (eingabe/fenster.js), Skillfenster (eingabe/charakter.js), Charaktererstellung (eingabe/erstellung.js)
// und die Anzeige aller Fenster mit dem Spielinhalt (anzeige/fenster.js, anzeige/charakterfenster.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe } from "../src/inhalt.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "../src/eingabe/belegung.js";
import { miniSpiel, lernendeSpielerin, gegenstandTragen } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { spielerin, positionSetzen } from "../src/kern/zustand.js";
import { gelaendeAuf } from "../src/welt/karte.js";
import { braufensterOeffnen } from "../src/eingabe/brauen.js";
import "../src/anzeige/braufenster.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { skillUebersicht, stufeVon, eigenschaftenPruefen } from "../src/systeme/skills.js";
import { fensterartAnmelden, fensterOeffnen, fensterTaste, oberstesFenster } from "../src/eingabe/fenster.js";
import "../src/eingabe/inventar.js";
import "../src/eingabe/faehigkeiten.js";
import "../src/eingabe/hilfe.js";
import { charakterTaste, charakterfensterOeffnen, geplanteEp, SEITENLAENGE } from "../src/eingabe/charakter.js";
import { erstellungOeffnen, erstellungTaste, restpunkte, vorgabeEigenschaften } from "../src/eingabe/erstellung.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/charakterfenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });

const taste = (code, zeichen, umschalt = false) => ({ code, zeichen, umschalt });

// Testfensterart: zählt Tasten, Esc schließt, O legt ein zweites auf, W gibt eine Auswahl zurück
fensterartAnmelden("testfenster", {
  taste(zustand, eingabe) {
    if (eingabe.code === "Escape") return { zustand: null };
    if (eingabe.code === "KeyO") return { zustand, oeffnen: { art: "testfenster", zustand: { tasten: 0 } } };
    if (eingabe.code === "KeyW") return { zustand, auswahl: { zweck: "test" } };
    return { zustand: { tasten: zustand.tasten + 1 }, befehl: { art: "warten" } };
  },
});

test("Fensterstapel: das oberste bekommt die Taste, null schließt, oeffnen legt auf, Auswahl leert den Stapel", () => {
  let stapel = fensterOeffnen([], "testfenster", { tasten: 0 });
  let ergebnis = fensterTaste(stapel, taste("KeyA", "a"), {});
  assert.deepEqual(ergebnis, { stapel: [{ art: "testfenster", zustand: { tasten: 1 } }], befehl: { art: "warten" } });
  stapel = fensterTaste(ergebnis.stapel, taste("KeyO", "o"), {}).stapel;
  assert.equal(stapel.length, 2);
  assert.deepEqual(oberstesFenster(stapel).zustand, { tasten: 0 });
  stapel = fensterTaste(stapel, taste("Escape"), {}).stapel;
  assert.deepEqual(stapel, [{ art: "testfenster", zustand: { tasten: 1 } }], "nur das oberste schließt");
  stapel = fensterTaste(fensterTaste(stapel, taste("KeyO", "o"), {}).stapel, taste("KeyW", "w"), {});
  assert.deepEqual(stapel, { stapel: [], auswahl: { zweck: "test" } });
  assert.deepEqual(fensterTaste([], taste("KeyA", "a"), {}), { stapel: [] });
  assert.equal(oberstesFenster([]), null);
  assert.throws(() => fensterOeffnen([], "gibt_es_nicht"), /Unbekannte Fensterart/);
});

const KARTE = ["#######", "#.....#", "#######"];
const SKILLS = {
  kraft_grund: { text: "s.kraft", set: "kraft", tier: 1, primaer: "koerperlichkeit", sekundaer: "gewandtheit", jeStufe: [{ ziel: "lp", art: "prozent", betrag: 5 }] },
  kraft_experte: { text: "s.kraft2", set: "kraft", tier: 2, primaer: "koerperlichkeit", sekundaer: "gewandtheit" },
  geheim: { text: "s.geheim", set: "geheim", tier: 1, primaer: "braukunde", sekundaer: "klugheit", freischaltung: true },
};

function aufstellen() {
  const spiel = miniSpiel(KARTE, { skills: SKILLS });
  const ninkasi = lernendeSpielerin(spiel, 1, 1);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi };
}

test("Skillfenster: wählen mit Pfeilen und Buchstaben, Enter bis zur nächsten Stufe, Umschalt+Enter bis Stufe 5", () => {
  const { spiel, ninkasi } = aufstellen();
  let zustand = charakterfensterOeffnen();
  assert.deepEqual(skillUebersicht(spiel, ninkasi).map((eintrag) => eintrag.name), ["kraft_grund", "kraft_experte"], "nicht freigeschaltet bleibt unsichtbar");
  zustand = charakterTaste(zustand, taste("ArrowDown"), spiel).zustand;
  assert.equal(zustand.gewaehlt, 1);
  zustand = charakterTaste(zustand, taste("ArrowDown"), spiel).zustand;
  assert.equal(zustand.gewaehlt, 1, "am Ende bleibt die Wahl stehen");
  assert.equal(charakterTaste(zustand, taste("Enter"), spiel).grund, "skill_voraussetzung", "gesperrt: nichts verteilt");
  zustand = charakterTaste(zustand, taste("KeyA", "a"), spiel).zustand;
  assert.equal(zustand.gewaehlt, 0);
  assert.equal(charakterTaste(zustand, taste("KeyZ", "z"), spiel).zustand.gewaehlt, 0, "an Z liegt nichts");
  const naechste = charakterTaste(zustand, taste("Enter"), spiel);
  assert.deepEqual(naechste.befehl, { art: "lernen", skill: "kraft_grund", ep: 67 }, "50 Lernpunkte bei Lerntempo 75 %");
  assert.ok(befehlGeben(spiel, naechste.befehl).ok);
  assert.equal(stufeVon(spiel, ninkasi, "kraft_grund"), 1);
  const alles = charakterTaste(zustand, taste("Enter", undefined, true), spiel);
  assert.equal(alles.befehl.ep, ninkasi.freieEp, "300 Start-EP reichen nicht bis Stufe 5: alles, was da ist");
});

test("Skillfenster: Ziffern tippen eine Zahl, Rücktaste und Esc löschen, Esc ohne Zahl schließt", () => {
  const { spiel, ninkasi } = aufstellen();
  let zustand = charakterfensterOeffnen();
  zustand = charakterTaste(zustand, taste("Digit0", "0"), spiel).zustand;
  assert.equal(zustand.eingabe, "", "keine führende Null");
  for (const ziffer of ["1", "2", "5"]) zustand = charakterTaste(zustand, taste(`Digit${ziffer}`, ziffer), spiel).zustand;
  assert.equal(zustand.eingabe, "125");
  zustand = charakterTaste(zustand, taste("Backspace"), spiel).zustand;
  assert.equal(zustand.eingabe, "12");
  const ergebnis = charakterTaste(zustand, taste("Enter"), spiel);
  assert.deepEqual(ergebnis.befehl, { art: "lernen", skill: "kraft_grund", ep: 12 });
  assert.equal(ergebnis.zustand.eingabe, "", "nach dem Verteilen ist die Zahl weg");
  zustand = charakterTaste(zustand, taste("Numpad9", "9"), spiel).zustand;
  assert.equal(zustand.eingabe, "129", "Ziffernblock mit Num-Lock tippt auch");
  assert.equal(charakterTaste({ ...zustand, eingabe: "9999" }, taste("Enter"), spiel).befehl.ep, ninkasi.freieEp, "höchstens die freien EP");
  const geloescht = charakterTaste(zustand, taste("Escape"), spiel).zustand;
  assert.equal(geloescht.eingabe, "");
  assert.equal(charakterTaste(geloescht, taste("Escape"), spiel).zustand, null);
  ninkasi.freieEp = 0;
  assert.equal(charakterTaste(charakterfensterOeffnen(), taste("Enter"), spiel).grund, "zu_wenig_ep");
});

test("Skillfenster: Bild auf und ab blättern um eine Seite, Buchstaben gelten auf der Seite", () => {
  const viele = Object.fromEntries(Array.from({ length: 30 }, (_, nummer) => [`s${nummer}`, { text: `s.${nummer}`, set: `set${nummer}`, tier: 1, primaer: "klugheit", sekundaer: "braukunde" }]));
  const spiel = miniSpiel(KARTE, { skills: viele });
  lernendeSpielerin(spiel, 1, 1);
  let zustand = charakterTaste(charakterfensterOeffnen(), taste("PageDown"), spiel).zustand;
  assert.equal(zustand.gewaehlt, SEITENLAENGE);
  zustand = charakterTaste(zustand, taste("KeyC", "c"), spiel).zustand;
  assert.equal(zustand.gewaehlt, SEITENLAENGE + 2);
  assert.equal(charakterTaste(zustand, taste("KeyZ", "z"), spiel).zustand.gewaehlt, SEITENLAENGE + 2, "auf Seite 2 gibt es nur vier");
  assert.equal(charakterTaste(zustand, taste("PageDown"), spiel).zustand.gewaehlt, 29);
  assert.equal(charakterTaste(zustand, taste("PageUp"), spiel).zustand.gewaehlt, 2);
});

test("Geplante EP: Zahl, nächste oder höchste Stufe, nie mehr als frei", () => {
  const eintrag = { epBisNaechste: 40, epBisHoechste: 900 };
  assert.equal(geplanteEp({ freieEp: 100 }, eintrag, "", false), 40);
  assert.equal(geplanteEp({ freieEp: 100 }, eintrag, "", true), 100);
  assert.equal(geplanteEp({ freieEp: 1000 }, eintrag, "", true), 900);
  assert.equal(geplanteEp({ freieEp: 100 }, eintrag, "70", false), 70);
});

test("Charaktererstellung: Grenzen, Restpunkte, ausgewogene Vorgabe, Start nur ohne Rest", () => {
  let zustand = erstellungOeffnen(daten, null);
  assert.deepEqual(zustand.eigenschaften, vorgabeEigenschaften(daten));
  assert.equal(restpunkte(daten, zustand.eigenschaften), 0, "die Vorgabe verteilt alle Punkte");
  assert.equal(erstellungTaste(zustand, taste("ArrowRight"), daten).zustand, zustand, "ohne Rest kein Punkt mehr");
  zustand = erstellungTaste(zustand, taste("ArrowLeft"), daten).zustand;
  assert.equal(zustand.eigenschaften.koerperlichkeit, 13);
  assert.equal(erstellungTaste(zustand, taste("Enter"), daten).grund, "punkte_uebrig");
  zustand = erstellungTaste(zustand, taste("ArrowDown"), daten).zustand;
  zustand = erstellungTaste(zustand, taste("BracketRight", "+"), daten).zustand;
  assert.equal(zustand.eigenschaften.trinkfestigkeit, 15);
  const start = erstellungTaste(zustand, taste("Enter"), daten);
  assert.equal(start.zustand, null);
  assert.equal(eigenschaftenPruefen(daten, start.start.eigenschaften), null);
  assert.equal(erstellungTaste(zustand, taste("ArrowUp"), daten).zustand.gewaehlt, 0);
  assert.equal(erstellungTaste({ ...zustand, gewaehlt: 0 }, taste("ArrowUp"), daten).zustand.gewaehlt, 5, "rundherum");
  const zurueck = erstellungTaste(zustand, taste("KeyA", "a"), daten).zustand;
  assert.deepEqual(zurueck.eigenschaften, vorgabeEigenschaften(daten));
  const unten = { eigenschaften: { ...zustand.eigenschaften, gewandtheit: 10 }, gewaehlt: 2 };
  assert.equal(erstellungTaste(unten, taste("ArrowLeft"), daten).zustand, unten, "nicht unter 10");
  assert.equal(erstellungTaste(zustand, taste("Escape"), daten).zustand, zustand, "Esc tut nichts");
});

test("Charaktererstellung: eine gültige frühere Verteilung wird übernommen, eine ungültige nicht", () => {
  const frueher = { koerperlichkeit: 20, trinkfestigkeit: 20, gewandtheit: 10, sinnlichkeit: 10, klugheit: 10, braukunde: 10 };
  assert.deepEqual(erstellungOeffnen(daten, frueher).eigenschaften, frueher);
  assert.deepEqual(erstellungOeffnen(daten, { ...frueher, braukunde: 19 }).eigenschaften, vorgabeEigenschaften(daten));
  assert.deepEqual(erstellungOeffnen(daten, "Unsinn").eigenschaften, vorgabeEigenschaften(daten));
});

test("Anzeige: jedes Fenster entsteht mit dem Spielinhalt ohne fehlende Texte", (t) => {
  const warnungen = [];
  t.mock.method(console, "warn", (meldung) => warnungen.push(meldung));
  const spiel = neuesSpiel(daten, 7);
  const ninkasi = spielerin(spiel.zustand);
  const kelle = gegenstandTragen(spiel, ninkasi, { text: "gegenstand.schoepfkelle", haltbarkeit: { aktuell: 3, hoechstens: 10 } });
  const umgebung = { spiel, daten, texte, belegung };
  const zeigen = (art, zustand) => fensterHtml(umgebung, fensterOeffnen([], art, zustand));
  assert.equal(fensterHtml(umgebung, []), "");
  assert.match(zeigen("inventar", { gewaehlt: null }), /Inventar/);
  assert.match(zeigen("inventar", { gewaehlt: kelle.id }), /Haltbarkeit/);
  assert.match(zeigen("faehigkeiten", {}), /Fähigkeiten/);
  assert.match(zeigen("hilfe", {}), /Charakter und Skills/);
  const erstellung = zeigen("erstellung", erstellungOeffnen(daten, null));
  assert.match(erstellung, /Noch zu verteilen/);
  assert.match(erstellung, /fenster-rahmen schmal/, "ohne Einzelheiten schmal");
  assert.doesNotMatch(erstellung, /fenster-details/);
  const hilfeZurErstellung = fensterHtml(umgebung, fensterOeffnen(fensterOeffnen([], "erstellung", erstellungOeffnen(daten, null)), "hilfe", { thema: "erstellung" }));
  assert.match(hilfeZurErstellung, /Charaktererstellung › Hilfe/);
  assert.match(hilfeZurErstellung, /class="thema"/, "der Text zum Fenster");
  assert.match(hilfeZurErstellung, new RegExp(`du verteilst ${daten.regeln.lernen.eigenschaftPunkte} Punkte`), "die Punkte aus den Regeln, nicht fest im Text");
  assert.doesNotMatch(hilfeZurErstellung, /\{(start|punkte|hoechstens)\}/, "alle Platzhalter gefüllt");
  assert.ok(hilfeZurErstellung.includes(texteDe["ui.erstellung_hinweis"]), "die Tasten des Fensters darunter");
  assert.doesNotMatch(hilfeZurErstellung, /Charakter und Skills/, "nicht die ganze Belegung");
  assert.match(hilfeZurErstellung, /fenster-rahmen schmal/);
  const hilfeZumInventar = fensterHtml(umgebung, fensterOeffnen(fensterOeffnen([], "inventar", { gewaehlt: null }), "hilfe", { thema: "inventar" }));
  assert.doesNotMatch(hilfeZumInventar, /class="thema"/, "ohne eigenen Text");
  assert.ok(hilfeZumInventar.includes(texteDe["hilfe.fenster"]), "dafür die allgemeine Erklärung der Fenster");
  assert.match(zeigen("hilfe", {}), /Charakter und Skills/, "die allgemeine Hilfe nennt alle Tasten");
  for (let gewaehlt = 0; gewaehlt < skillUebersicht(spiel, ninkasi).length; gewaehlt++) {
    assert.match(zeigen("charakter", { gewaehlt, eingabe: gewaehlt === 1 ? "30" : "" }), /Lerntempo/);
  }
  // Braufenster am Tonkessel mit Zutaten und Flasche, danach das gebraute Getränk mit seinem Profil im Inventar
  const ebene = spiel.zustand.ebene;
  let kessel = null;
  for (let y = 0; y < ebene.hoehe && !kessel; y++) for (let x = 0; x < ebene.breite && !kessel; x++) if (gelaendeAuf(spiel, x, y)?.kessel) kessel = { x, y };
  positionSetzen(spiel.zustand, ninkasi, kessel);
  ninkasi.kulturen = ["wilde_hefe"]; // Ninkasi beginnt ohne Kultur (src/systeme/kulturen.js)
  const malz = gegenstandTragen(spiel, ninkasi, { typ: "gerstenmalz", ...structuredClone(daten.gegenstaende.gerstenmalz), anzahl: 2 });
  gegenstandTragen(spiel, ninkasi, { typ: "leere_flasche", ...structuredClone(daten.gegenstaende.leere_flasche) });
  assert.doesNotMatch(zeigen("brauen", { ...braufensterOeffnen(spiel).zustand, mengen: { [malz.id]: 2 } }), /netz-umriss/, "im Nebel keine Umrisse");
  spiel.zustand.wissen.zielgebiete = ["gefiltertes_bier", "dunkles_bier"];
  const nurWasser = zeigen("brauen", braufensterOeffnen(spiel).zustand);
  assert.match(nurWasser, /<svg class="spinnennetz"/, "das Netz auch ohne Zutaten");
  assert.match(nurWasser, /netz-umriss/, "ohne Zutaten mit den Umrissen der aufgedeckten Zielgebiete");
  assert.doesNotMatch(nurWasser, /netz-band|netz-profil|hervorgehoben/, "ohne Zutaten ohne Vorschau und ohne Hervorhebung");
  assert.match(nurWasser, /<\/svg><p class="leise">Ohne Zutaten wird das nur heißes Wasser/, "unter dem Netz der Grund");
  const braufenster = zeigen("brauen", { ...braufensterOeffnen(spiel).zustand, mengen: { [malz.id]: 2 } });
  assert.match(braufenster, /<svg class="spinnennetz"/, "die Vorschau als Spinnennetz");
  assert.match(braufenster, /netz-umriss/, "mit den Umrissen der aufgedeckten Zielgebiete");
  assert.match(braufenster, /frei gebraut/);
  assert.match(zeigen("brauen", { ...braufensterOeffnen(spiel).zustand, liste: "rezepte" }), /Noch keine Rezepte im Buch/);
  assert.match(braufenster, /Restzucker/);
  assert.match(braufenster, /1 Portion · Kessel 2\/4/);
  befehlGeben(spiel, { art: "brauen", zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "wilde_hefe" });
  const sud = ninkasi.inventar.map((id) => spiel.zustand.entitaeten[id]).find((gegenstand) => gegenstand.sud);
  const imInventar = zeigen("inventar", { gewaehlt: sud.id });
  assert.match(imInventar, /<svg class="spinnennetz"/, "das Profil eines Getränks als Spinnennetz");
  assert.match(imInventar, /Güte/);
  const doppelt = fensterHtml(umgebung, fensterOeffnen(fensterOeffnen([], "charakter", charakterfensterOeffnen()), "hilfe"));
  assert.match(doppelt, /Charakter › Hilfe/, "der Titel nennt den Weg durch den Stapel");
  assert.deepEqual(warnungen, []);
});
