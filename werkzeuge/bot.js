// Dummer Bot: spielt mit zufälligen Befehlen, prüft Invarianten und Wiederholbarkeit.
// Aufruf: node werkzeuge/bot.js [läufe=20] [befehle=3000] [erster Startwert=1]
// Für jeden Lauf: spielen, dann aus Startwert und Befehlsliste nachspielen und Zustände vergleichen.

import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { zufallErzeugen, zufallsGanzzahl } from "../src/kern/zufall.js";
import { alleEntitaeten, spielerin } from "../src/kern/zustand.js";
import { passierbar, gelaendeAuf } from "../src/welt/karte.js";
import { erstesGetraenk } from "../src/systeme/inventar.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { hoechstwert } from "../src/kern/werte.js";
import { reiseBeginnen, naechsterReiseschritt } from "../src/eingabe/reise.js";
import { rastenBeginnen, naechsterRastschritt } from "../src/eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "../src/eingabe/erkunden.js";
import { laufenBeginnen, naechsterLaufschritt } from "../src/eingabe/laufen.js";
import { neueLeisten, leistenNachfuehren, aktivePlaetze, platzZustand, platzAusloesen, platzBelegen, plaetzeTauschen, platzLeeren, leisteWechseln, ANZAHL_LEISTEN } from "../src/eingabe/schnellleiste.js";
import { speicherstandText, speicherstandLesen } from "../src/eingabe/speicherstand.js";
import { minikartenBild } from "../src/anzeige/minikarte.js";
import { menueOeffnen, menueTaste } from "../src/eingabe/menue.js";
import { verlaufOeffnen } from "../src/eingabe/verlauf.js";
import { zielmodusBeginnen, zielmodusTaste, zielangabeVon, cursorSetzen } from "../src/eingabe/zielmodus.js";
import belegung from "../src/eingabe/belegung.js";
import einstellungen from "../src/eingabe/einstellungen.js";
import { indexPruefen } from "../src/kern/raumindex.js";
import { warteschlangeGueltig } from "../src/kern/zeit.js";
import { feldBeschreiben, werteAufschluesseln } from "../src/systeme/untersuchen.js";
import { meldungWahrnehmbar, geraeuschGehoert } from "../src/systeme/wahrnehmbar.js";
import { charakterfensterOeffnen, charakterTaste } from "../src/eingabe/charakter.js";
import { erstellungOeffnen, erstellungTaste } from "../src/eingabe/erstellung.js";
import { fensterOeffnen } from "../src/eingabe/fenster.js";
import "../src/eingabe/inventar.js";
import "../src/eingabe/faehigkeiten.js";
import "../src/eingabe/hilfe.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/charakterfenster.js";
import "../src/anzeige/systemfenster.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { Log } from "../src/anzeige/log.js";
import { ARTEN } from "../src/anzeige/logzeilen.js";
import { Oberflaeche } from "../src/anzeige/oberflaeche.js";
import { Bedienzeile } from "../src/anzeige/bedienzeile.js";

const [anzahlLaeufe = 20, hoechsteBefehlszahl = 3000, ersterStartwert = 1] = process.argv.slice(2).map(Number);
const grammatik = erstelleGrammatik(grammatikDe);
const daten = datenLaden(rohdaten, { texte, nomenPruefen: grammatik.pruefen });
const anzeigetexte = erstelleTexte(texte, grammatik);

// Fenster, Log, Seitenleiste und Bedienzeile wie im Browser zeichnen (ohne DOM, ein Element ist hier nur ein Objekt
// mit innerHTML): fehlende Texte und Fehler in der Anzeige fallen so auch im Bot auf
const fehlendeTexte = new Set();
const warnen = console.warn;
const ohneDom = () => ({ innerHTML: "" });
let botLog = null;
let botLeisten = null;
function mitWarnungen(zeichnen) {
  console.warn = (meldung) => fehlendeTexte.add(meldung);
  try {
    zeichnen();
  } finally {
    console.warn = warnen;
  }
}
function fensterZeichnen(spiel, art, zustand) {
  mitWarnungen(() => fensterHtml({ spiel, daten, texte: anzeigetexte, belegung, logzeilen: botLog?.zeilen ?? [], einstellungen, version: "bot" }, fensterOeffnen([], art, zustand)));
}
const seitenleiste = new Oberflaeche(ohneDom(), anzeigetexte, "bot");
const bedienzeile = new Bedienzeile(ohneDom(), anzeigetexte, belegung);
function oberflaecheZeichnen(spiel) {
  mitWarnungen(() => {
    seitenleiste.anzeigen(spiel, { hervorgehobenId: spiel.zustand.spielerinId });
    seitenleiste.kopfHtml(spiel);
    bedienzeile.anzeigen(spiel, botLeisten);
    for (const platz of aktivePlaetze(botLeisten)) platzZustand(spiel, platz);
    const bild = minikartenBild(spiel, daten.zeichen);
    if (bild.felder.length !== bild.breite * bild.hoehe || bild.punkte.at(-1)?.art !== "ninkasi") throw new Error("Minikarte ohne Ninkasi oder mit falscher Größe");
  });
  for (const zeile of botLog.zeilen) if (!(zeile.art in ARTEN) || !["geschehen", "kampf"].includes(zeile.spalte)) throw new Error(`Logzeile ohne Art oder Spalte: ${JSON.stringify(zeile)}`);
}
// Spielmenü per Tasten wie im Browser: Pfeil runter und wieder hoch, dann Fortsetzen; nichts davon ändert den Lauf
function menueBedienen(spiel) {
  let zustand = menueOeffnen();
  zustand = menueTaste(zustand, { code: "ArrowDown" }).zustand;
  fensterZeichnen(spiel, "menue", zustand);
  zustand = menueTaste(zustand, { code: "KeyK" }).zustand;
  if (menueTaste(zustand, { code: "Enter" }).zustand !== null) throw new Error("Fortsetzen schließt das Menü nicht");
  fensterZeichnen(spiel, "verlauf", verlaufOeffnen());
  fensterZeichnen(spiel, "bestaetigung", { frage: "menue.neustart_frage", aktion: "neustart" });
}

function invariantenPruefen(spiel) {
  const zustand = spiel.zustand;
  const belegteFelder = new Set();
  for (const entitaet of alleEntitaeten(zustand)) {
    for (const [wertName, wert] of Object.entries(entitaet.werte || {})) {
      if (!Number.isInteger(wert.aktuell) || wert.aktuell < 0) throw new Error(`#${entitaet.id} ${wertName} ungültig: ${wert.aktuell}`);
      if (wert.aktuell > hoechstwert(spiel, entitaet, wertName)) throw new Error(`#${entitaet.id} ${wertName} über dem Höchstwert: ${wert.aktuell}`);
    }
    if (entitaet.position) {
      if (!passierbar(spiel, entitaet.position.x, entitaet.position.y)) throw new Error(`#${entitaet.id} steht in der Wand`);
      if (entitaet.fraktion !== undefined) {
        const feldSchluessel = `${entitaet.position.x},${entitaet.position.y}`;
        if (belegteFelder.has(feldSchluessel)) throw new Error(`Zwei Wesen auf ${feldSchluessel}`);
        belegteFelder.add(feldSchluessel);
      }
    }
  }
  if (!zustand.vorbei && spielerin(zustand).werte.lp.aktuell <= 0) throw new Error("Ninkasi tot, Spiel nicht vorbei");
  // Tod und Auslöser (siehe src/systeme/tod.js, src/kern/ausloeser.js)
  for (const entitaet of alleEntitaeten(zustand)) {
    const lebenswert = entitaet.werte?.[entitaet.lebenswert || "lp"];
    if (lebenswert && lebenswert.aktuell <= 0 && entitaet.id !== zustand.spielerinId) throw new Error(`#${entitaet.id} mit Lebenswert 0 noch im Spiel`);
    if (entitaet.getragenVon !== undefined && !zustand.entitaeten[entitaet.getragenVon]?.inventar?.includes(entitaet.id)) throw new Error(`#${entitaet.id} getragen von fehlender Trägerin`);
    // Stapel, Ladungen und Ausrüstung (src/systeme/inventar.js, src/systeme/ausruestung.js)
    if (entitaet.anzahl !== undefined && !(Number.isInteger(entitaet.anzahl) && entitaet.anzahl >= 1)) throw new Error(`#${entitaet.id} mit Anzahl ${entitaet.anzahl}`);
    if (entitaet.ladungen?.aktuell !== undefined && !(entitaet.ladungen.aktuell >= 1 && entitaet.ladungen.aktuell <= entitaet.ladungen.hoechstens)) throw new Error(`#${entitaet.id} mit ${entitaet.ladungen.aktuell} Ladungen`);
    for (const angelegtId of entitaet.ausgeruestet || []) if (!entitaet.inventar?.includes(angelegtId)) throw new Error(`#${entitaet.id} hat #${angelegtId} angelegt, aber nicht im Gepäck`);
    // Verschleiß und Unbekanntes (src/systeme/verschleiss.js, src/systeme/kennen.js)
    const haltbarkeit = entitaet.haltbarkeit?.aktuell;
    if (haltbarkeit !== undefined && !(Number.isInteger(haltbarkeit) && haltbarkeit >= 1 && haltbarkeit <= entitaet.haltbarkeit.hoechstens)) throw new Error(`#${entitaet.id} mit Haltbarkeit ${haltbarkeit} nach dem Vorgang`);
    if (entitaet.verdirbt) {
      if (!(entitaet.verdirbtUm >= zustand.zeit)) throw new Error(`#${entitaet.id} hätte um ${entitaet.verdirbtUm} verderben sollen`);
      if (!zustand.warteschlange.some((eintrag) => eintrag.gebundenAn === entitaet.id && eintrag.ereignistyp === "verderben" && eintrag.zeit === entitaet.verdirbtUm)) throw new Error(`#${entitaet.id} verdirbt ohne Zeitereignis`);
    }
    if (entitaet.etikett !== undefined && zustand.wissen?.erkannt.includes(entitaet.typ)) throw new Error(`#${entitaet.id} trägt ein Etikett, obwohl ${entitaet.typ} erkannt ist`);
  }
  for (const eintrag of zustand.warteschlange) {
    if (eintrag.gebundenAn !== undefined && !zustand.entitaeten[eintrag.gebundenAn]) throw new Error(`Zeitereignis gebunden an fehlende #${eintrag.gebundenAn}`);
  }
  if (spiel.anstehendeAusloeser.length) throw new Error("Auslöser nach Abschluss des Vorgangs noch vorgemerkt");
  // Leistung (kern/raumindex.js, kern/zeit.js): der Index stimmt mit dem Zustand überein, die Warteschlange ist ein Heap
  const abweichungen = indexPruefen(zustand);
  if (abweichungen.length) throw new Error(`Räumlicher Index weicht ab: ${abweichungen.join("; ")}`);
  if (!warteschlangeGueltig(zustand)) throw new Error("Warteschlange ist kein gültiger Heap");
  lernstandPruefen(spiel);
}

// Skills und EP (src/systeme/skills.js, src/systeme/lernen.js): ganzzahlig, Stufe höchstens 5, und die freien EP
// ändern sich nur durch Erkundung (wächst), Lernbefehle und den freien Teil gebundener EP (beides aus den Meldungen)
let epBuch = null;
const epJeTiefe = {};

function lernstandPruefen(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  const { bezugswert, stufen, raengeNachTier } = spiel.daten.regeln.lernen;
  if (!(Number.isInteger(ninkasi.freieEp) && ninkasi.freieEp >= 0)) throw new Error(`freie EP ungültig: ${ninkasi.freieEp}`);
  for (const [name, { lernpunkte, rest }] of Object.entries(ninkasi.skills)) {
    const definition = spiel.daten.skills[name];
    const hoechst = stufen.reduce((summe, kosten) => summe + kosten, 0) * (definition.rang ?? raengeNachTier[definition.tier - 1]);
    if (!(Number.isInteger(lernpunkte) && lernpunkte >= 0 && lernpunkte <= hoechst)) throw new Error(`${name}: Lernpunkte ${lernpunkte}`);
    if (!(Number.isInteger(rest) && rest >= 0 && rest < bezugswert)) throw new Error(`${name}: Rest ${rest}`);
  }
  const erkundung = ninkasi.freieEp - epBuch.erwartet;
  if (erkundung < 0) throw new Error(`${-erkundung} freie EP verloren`);
  const tiefe = (epJeTiefe[spiel.zustand.tiefe] ??= { erkundung: 0, gebunden: 0, frei: 0 });
  tiefe.erkundung += erkundung;
  epBuch.erwartet = ninkasi.freieEp;
}

// Lernmeldungen ins Buch; eine Verteilung muss aufgehen
function lernmeldungBuchen(spiel, meldung) {
  if (meldung.art === "gelernt") epBuch.erwartet -= meldung.ep;
  if (meldung.art !== "ep_erhalten") return;
  const verteilt = meldung.skills.reduce((summe, eintrag) => summe + eintrag.ep, 0) + meldung.frei;
  if (verteilt !== meldung.ep) throw new Error(`ep_erhalten: ${meldung.ep} EP, verteilt ${verteilt}`);
  epBuch.erwartet += meldung.frei;
  const tiefe = (epJeTiefe[spiel.zustand.tiefe] ??= { erkundung: 0, gebunden: 0, frei: 0 });
  tiefe.gebunden += meldung.ep - meldung.frei;
  tiefe.frei += meldung.frei;
}

// Eine zufällige gültige Verteilung der Eigenschaften wie bei der Erstellung
function zufallsEigenschaften(botZufall) {
  const { eigenschaftStart, eigenschaftPunkte, eigenschaftHoechstens } = daten.regeln.lernen;
  const eigenschaften = Object.fromEntries(Object.keys(daten.eigenschaften).map((name) => [name, eigenschaftStart]));
  const namen = Object.keys(eigenschaften);
  for (let punkt = 0; punkt < eigenschaftPunkte; punkt++) {
    const frei = namen.filter((name) => eigenschaften[name] < eigenschaftHoechstens);
    eigenschaften[frei[zufallsGanzzahl(botZufall, 0, frei.length - 1)]]++;
  }
  return eigenschaften;
}

function zufallsbefehl(botZufall, spiel) {
  const ninkasi = spielerin(spiel.zustand);
  const wurf = zufallsGanzzahl(botZufall, 1, 100);
  if (wurf <= 5) return { art: "warten" };
  if (wurf <= 10) return { art: "aufheben" };
  if (wurf <= 13 && ninkasi.werte.lp.aktuell < 70) return { art: "trinken", gegenstandId: erstesGetraenk(spiel.zustand, ninkasi) };
  if (wurf === 17 && ninkasi.inventar?.length) {
    // etwas fallen lassen, damit Gepäck und Boden in Bewegung bleiben
    return { art: "fallenlassen", gegenstandId: ninkasi.inventar[zufallsGanzzahl(botZufall, 0, ninkasi.inventar.length - 1)] };
  }
  const anlegbare = (ninkasi.inventar || []).filter((id) => spiel.zustand.entitaeten[id]?.ausruestung);
  if (wurf >= 14 && wurf <= 16 && anlegbare.length) {
    // Ausrüstung an- oder ablegen (tauscht bei vollem Platz)
    const id = anlegbare[zufallsGanzzahl(botZufall, 0, anlegbare.length - 1)];
    return { art: (ninkasi.ausgeruestet || []).includes(id) ? "ablegen" : "anlegen", gegenstandId: id };
  }
  if (wurf <= 15 && ninkasi.inventar?.length) {
    // Wurf auf ein Feld in der Nähe; abgelehnte Ziele (zu weit, nicht sichtbar) prüfen die Ablehnung gleich mit
    const ziel = { x: ninkasi.position.x + zufallsGanzzahl(botZufall, -5, 5), y: ninkasi.position.y + zufallsGanzzahl(botZufall, -5, 5) };
    return { art: "werfen", gegenstandId: ninkasi.inventar[0], ziel };
  }
  if (wurf >= 18 && wurf <= 20 && ninkasi.faehigkeiten?.length) return faehigkeitUeberZielmodus(botZufall, spiel, ninkasi);
  if (wurf === 22 && ninkasi.freieEp > 0) {
    const befehl = lernenUeberSkillfenster(botZufall, spiel);
    if (befehl) return befehl;
  }
  if (wurf === 21 && ninkasi.freieEp > 0) {
    // freie EP auf einen zufälligen Skill, auch gesperrte, so werden die Ablehnungen mitgeprüft
    const namen = Object.keys(spiel.daten.skills);
    anzahlLernbefehle++;
    return { art: "lernen", skill: namen[zufallsGanzzahl(botZufall, 0, namen.length - 1)], ep: zufallsGanzzahl(botZufall, 1, ninkasi.freieEp) };
  }
  return { art: "bewegen", dx: zufallsGanzzahl(botZufall, -1, 1), dy: zufallsGanzzahl(botZufall, -1, 1) };
}

// Freie EP wie im Browser über das Skillfenster (eingabe/charakter.js): einen Skill wählen, dann Enter, Umschalt+Enter
// oder eine getippte Zahl; zeichnet das Fenster dabei; null, wenn das Fenster nichts ausgibt (gesperrt, keine EP)
let anzahlUeberFenster = 0;
function lernenUeberSkillfenster(botZufall, spiel) {
  let zustand = charakterfensterOeffnen();
  for (let schritt = zufallsGanzzahl(botZufall, 0, 4); schritt > 0; schritt--) zustand = charakterTaste(zustand, { code: "ArrowDown" }, spiel).zustand;
  const art = zufallsGanzzahl(botZufall, 1, 3);
  if (art === 3) {
    for (const ziffer of String(zufallsGanzzahl(botZufall, 1, 200))) zustand = charakterTaste(zustand, { code: `Digit${ziffer}`, zeichen: ziffer }, spiel).zustand;
  }
  fensterZeichnen(spiel, "charakter", zustand);
  const ergebnis = charakterTaste(zustand, { code: "Enter", umschalt: art === 2 }, spiel);
  if (!ergebnis.befehl) return null;
  anzahlLernbefehle++;
  anzahlUeberFenster++;
  return ergebnis.befehl;
}

// Eigenschaften wie im Browser über die Charaktererstellung (eingabe/erstellung.js): zufällige Pfeiltasten, dann Enter;
// bleiben Punkte übrig, werden sie reihum vergeben
function eigenschaftenUeberErstellung(botZufall) {
  let zustand = erstellungOeffnen(daten, null);
  const tasten = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  for (let schritt = 0; schritt < 40; schritt++) zustand = erstellungTaste(zustand, { code: tasten[zufallsGanzzahl(botZufall, 0, 3)] }, daten).zustand;
  for (let versuch = 0; versuch < 60; versuch++) {
    const ergebnis = erstellungTaste(zustand, { code: "Enter" }, daten);
    if (ergebnis.start) return ergebnis.start.eigenschaften;
    zustand = erstellungTaste(erstellungTaste(zustand, { code: "ArrowDown" }, daten).zustand, { code: "ArrowRight" }, daten).zustand;
  }
  throw new Error("Charaktererstellung kommt nicht zum Start");
}

// Fähigkeit wie im Browser über den Zielmodus (eingabe/zielmodus.js): ein Ziel per Tab oder ein Feld in der Nähe;
// den Befehl gibt der Bot auch, wenn die Vorschau einen Grund dagegen nennt, so wird die Ablehnung mitgeprüft
function faehigkeitUeberZielmodus(botZufall, spiel, ninkasi) {
  const faehigkeit = ninkasi.faehigkeiten[zufallsGanzzahl(botZufall, 0, ninkasi.faehigkeiten.length - 1)];
  const beginn = zielmodusBeginnen(spiel, { zweck: "faehigkeit", faehigkeit });
  if (beginn.befehl) return beginn.befehl;
  if (!beginn.modus) return { art: "faehigkeit", faehigkeit };
  let modus = beginn.modus;
  if (zufallsGanzzahl(botZufall, 1, 2) === 1) modus = zielmodusTaste(spiel, modus, "Tab", belegung).modus;
  else modus = cursorSetzen(spiel, modus, { x: ninkasi.position.x + zufallsGanzzahl(botZufall, -7, 7), y: ninkasi.position.y + zufallsGanzzahl(botZufall, -7, 7) });
  return { art: "faehigkeit", faehigkeit, ziel: zielangabeVon(spiel, modus) };
}

// Ablauf der Eingabe aus Einzelbefehlen (Reise, Rasten, Erkunden), wie im Browser; gibt den Haltegrund zurück
function ablaufLaufenLassen(spiel, beginn, naechsterSchritt) {
  if (beginn.grund) return beginn.grund;
  const ablauf = beginn.reise ?? beginn.ablauf;
  for (let schritt = 0; schritt < 1500; schritt++) {
    const ergebnis = naechsterSchritt(spiel, ablauf, einstellungen);
    if (ergebnis.halt) return ergebnis.halt;
    if (!befehlGeben(spiel, ergebnis.befehl).ok) return "abgelehnt";
    invariantenPruefen(spiel);
  }
  return "zu_lang";
}

// Reise zu einem zufälligen erkundeten Feld, wie per Mausklick
function reisen(botZufall, spiel) {
  const ebene = spiel.zustand.ebene;
  const erkundeteFelder = [];
  ebene.erkundet.forEach((erkundet, feldIndex) => {
    const x = feldIndex % ebene.breite, y = Math.floor(feldIndex / ebene.breite);
    if (erkundet && passierbar(spiel, x, y)) erkundeteFelder.push({ x, y });
  });
  const ziel = erkundeteFelder[zufallsGanzzahl(botZufall, 0, erkundeteFelder.length - 1)];
  return ablaufLaufenLassen(spiel, reiseBeginnen(spiel, ziel, einstellungen), naechsterReiseschritt);
}

// Reise zu einer bekannten Treppe und hinüber in die nächste Tiefe (Ebenenwechsel, src/systeme/ebenen.js)
function treppeNehmen(botZufall, spiel) {
  const ebene = spiel.zustand.ebene;
  const treppen = [];
  ebene.erkundet.forEach((erkundet, feldIndex) => {
    const x = feldIndex % ebene.breite, y = Math.floor(feldIndex / ebene.breite);
    if (erkundet && gelaendeAuf(spiel, x, y)?.treppe) treppen.push({ x, y });
  });
  if (!treppen.length) return "keine_bekannt";
  const ziel = treppen[zufallsGanzzahl(botZufall, 0, treppen.length - 1)];
  const ninkasi = spielerin(spiel.zustand);
  const dort = ninkasi.position.x === ziel.x && ninkasi.position.y === ziel.y;
  const haltegrund = dort ? "angekommen" : ablaufLaufenLassen(spiel, reiseBeginnen(spiel, ziel, einstellungen), naechsterReiseschritt);
  if (haltegrund !== "angekommen" || spiel.zustand.vorbei) return haltegrund;
  const ergebnis = befehlGeben(spiel, { art: "treppe" });
  invariantenPruefen(spiel);
  return ergebnis.ok ? `nach_tiefe_${spiel.zustand.tiefe}` : ergebnis.grund;
}

// Laufen in eine zufällige Richtung, wie mit Umschalt plus Richtung
function laufen(botZufall, spiel) {
  const richtung = { dx: zufallsGanzzahl(botZufall, -1, 1), dy: zufallsGanzzahl(botZufall, -1, 1) };
  if (!richtung.dx && !richtung.dy) richtung.dx = 1;
  return ablaufLaufenLassen(spiel, laufenBeginnen(spiel, richtung, einstellungen), naechsterLaufschritt);
}

// Umbelegen wie mit Ziffer im Fenster, Ziehen oder Umschalt+Ziffer; würfelt nur mit dem Zufall des Bots
function leistenUmbelegen(botZufall, spiel) {
  const ninkasi = spielerin(spiel.zustand);
  const wurf = zufallsGanzzahl(botZufall, 1, 4);
  const stelle = zufallsGanzzahl(botZufall, 0, 9);
  if (wurf === 1) botLeisten = leisteWechseln(botLeisten, zufallsGanzzahl(botZufall, 0, ANZAHL_LEISTEN - 1));
  else if (wurf === 2) botLeisten = plaetzeTauschen(botLeisten, stelle, zufallsGanzzahl(botZufall, 0, 9));
  else if (wurf === 3) botLeisten = platzLeeren(botLeisten, stelle);
  else {
    const typ = spiel.zustand.entitaeten[(ninkasi.inventar || [])[0]]?.typ;
    if (typ) botLeisten = platzBelegen(botLeisten, stelle, { art: "gegenstand", typ });
  }
}

// Ein Platz der Schnellleiste wie mit seiner Ziffer: Getränk sofort, Fähigkeit über den Zielmodus, bestätigt mit
// derselben Ziffer; gibt einen Befehl zurück oder null
function schnellleisteBenutzen(botZufall, spiel) {
  const stelle = zufallsGanzzahl(botZufall, 0, 9);
  const ergebnis = platzAusloesen(spiel, botLeisten, stelle);
  if (!ergebnis || ergebnis.grund) return null;
  if (ergebnis.befehl) return ergebnis.befehl;
  const beginn = zielmodusBeginnen(spiel, ergebnis.auswahl, { platz: stelle });
  if (beginn.befehl) return beginn.befehl;
  if (!beginn.modus) return null;
  const ziffer = stelle === 9 ? "Digit0" : `Digit${stelle + 1}`;
  return zielmodusTaste(spiel, beginn.modus, ziffer, belegung).befehl ?? null;
}

// Ein zufälliger Ablauf: meist Reise, sonst Laufen, Erkunden, Rasten oder Treppe; gibt "art:haltegrund" zurück
function ablaufWaehlen(botZufall, spiel) {
  if (zufallsGanzzahl(botZufall, 1, 6) === 1) return `treppe:${treppeNehmen(botZufall, spiel)}`;
  if (zufallsGanzzahl(botZufall, 1, 4) === 1) return `laufen:${laufen(botZufall, spiel)}`;
  const wurf = zufallsGanzzahl(botZufall, 1, 5);
  if (wurf === 4) return `erkunden:${ablaufLaufenLassen(spiel, erkundenBeginnen(spiel, einstellungen), naechsterErkundungsschritt)}`;
  if (wurf === 5) return `rasten:${ablaufLaufenLassen(spiel, rastenBeginnen(spiel, einstellungen), naechsterRastschritt)}`;
  return `reise:${reisen(botZufall, spiel)}`;
}

let anzahlTode = 0, anzahlFehler = 0, anzahlGeladen = 0;
const reisenNachHaltegrund = {};
// Fähigkeiten der Gegner: gewirkt, lange Aktionen begonnen und abgebrochen
const gegnerfaehigkeiten = { gewirkt: 0, begonnen: 0, abgebrochen: 0 };
// Untersuchen wie mit Taste X: Ninkasis Feld mit ihren Werten, dann per Tab das nächste Wesen und ein Feld daneben;
// würfelt nicht, damit der Lauf derselbe bleibt
function untersuchen(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  feldBeschreiben(spiel, ninkasi.position);
  werteAufschluesseln(spiel, ninkasi);
  let modus = zielmodusBeginnen(spiel, { zweck: "untersuchen" }).modus;
  modus = zielmodusTaste(spiel, modus, "Tab", belegung).modus;
  feldBeschreiben(spiel, modus.cursor);
  modus = zielmodusTaste(spiel, modus, "Numpad6", belegung).modus;
  feldBeschreiben(spiel, modus.cursor);
  if (zielmodusTaste(spiel, modus, "KeyX", belegung).modus !== null) throw new Error("X schließt das Untersuchen nicht");
}

// Würfe und Fähigkeiten Ninkasis; Meldungen, die das Log zeigt, verbirgt oder als Geräusch hört
let anzahlWuerfe = 0, anzahlAngelegt = 0, ninkasisFaehigkeiten = 0, anzahlLernbefehle = 0, anzahlGelernt = 0, anzahlSkillstufen = 0;
const meldungenFuerNinkasi = { gezeigt: 0, verborgen: 0, gehoert: 0 };
console.log("Startwert  Befehle  Zeit     LP   MP   PP  Pegel  Getötet  Biere  Ergebnis");
for (let startwert = ersterStartwert; startwert < ersterStartwert + anzahlLaeufe; startwert++) {
  try {
    // jeder zweite Lauf mit eigener Verteilung der Eigenschaften (Startoption, gehört zum Spielstand)
    // jeder vierte über die Tasten der Charaktererstellung
    const verteilung = startwert % 4 === 0 ? eigenschaftenUeberErstellung(zufallErzeugen(startwert + 2_000_000)) : zufallsEigenschaften(zufallErzeugen(startwert + 1_000_000));
    const optionen = startwert % 2 === 0 ? { eigenschaften: verteilung } : {};
    const spiel = neuesSpiel(daten, startwert, optionen);
    botLog = new Log(ohneDom(), anzeigetexte);
    botLeisten = leistenNachfuehren(spiel, neueLeisten());
    // jeder vierte Lauf wird mitten im Lauf gespeichert und geladen; die Kopie bekommt am Ende die übrigen Befehle der
    // Aufzeichnung und muss denselben Zustand haben wie der echte Lauf (eingabe/speicherstand.js)
    let geladeneKopie = null;
    botLog.leeren(spiel);
    hoererAnmelden(spiel, (meldung) => mitWarnungen(() => botLog.melden(meldung)));
    epBuch = { erwartet: daten.regeln.lernen.startEp };
    let getoetet = 0, getrunkeneBiere = 0;
    hoererAnmelden(spiel, (meldung) => {
      lernmeldungBuchen(spiel, meldung);
      if (meldung.art === "gelernt") anzahlGelernt++;
      if (meldung.art === "skillstufe") anzahlSkillstufen++;
      if (geraeuschGehoert(spiel, meldung)) meldungenFuerNinkasi.gehoert++;
      else if (meldung.art !== "laerm") meldungenFuerNinkasi[meldungWahrnehmbar(spiel, meldung) ? "gezeigt" : "verborgen"]++;
      if (meldung.art === "tod" && meldung.opfer.id !== spiel.zustand.spielerinId) getoetet++;
      if (meldung.art === "getrunken") getrunkeneBiere++;
      if (meldung.art === "geworfen") anzahlWuerfe++;
      if (meldung.art === "angelegt") anzahlAngelegt++;
      if (meldung.art === "faehigkeit" && meldung.wer.id === spiel.zustand.spielerinId) ninkasisFaehigkeiten++;
      if (meldung.wer?.id === spiel.zustand.spielerinId) return;
      if (meldung.art === "faehigkeit") gegnerfaehigkeiten.gewirkt++;
      if (meldung.art === "aktion_beginnt") gegnerfaehigkeiten.begonnen++;
      if (meldung.art === "aktion_abgebrochen") gegnerfaehigkeiten.abgebrochen++;
    });
    const botZufall = zufallErzeugen(startwert);
    while (spiel.befehle.length < hoechsteBefehlszahl && !spiel.zustand.vorbei) {
      if (zufallsGanzzahl(botZufall, 1, 100) <= 3) {
        const haltegrund = ablaufWaehlen(botZufall, spiel);
        reisenNachHaltegrund[haltegrund] = (reisenNachHaltegrund[haltegrund] || 0) + 1;
        continue;
      }
      if (startwert % 4 === 1 && !geladeneKopie && spiel.befehle.length >= hoechsteBefehlszahl / 3) {
        const gelesen = speicherstandLesen(daten, speicherstandText(spiel, { leisten: botLeisten, logzeilen: botLog.zeilen }));
        if (gelesen.grund) throw new Error(`Speicherstand nicht lesbar: ${gelesen.grund}`);
        if (JSON.stringify(gelesen.oberflaeche.leisten) !== JSON.stringify(botLeisten)) throw new Error("Leisten nach dem Laden anders");
        geladeneKopie = gelesen.spiel;
      }
      if (zufallsGanzzahl(botZufall, 1, 40) === 1) leistenUmbelegen(botZufall, spiel);
      const ausDerLeiste = zufallsGanzzahl(botZufall, 1, 30) === 1 ? schnellleisteBenutzen(botZufall, spiel) : null;
      const befehl = ausDerLeiste ?? zufallsbefehl(botZufall, spiel);
      befehlGeben(spiel, befehl);
      botLeisten = leistenNachfuehren(spiel, botLeisten);
      invariantenPruefen(spiel);
      if (spiel.befehle.length % 10 === 0 && !spiel.zustand.vorbei) {
        untersuchen(spiel);
        oberflaecheZeichnen(spiel);
      }
      if (spiel.befehle.length % 500 === 0) menueBedienen(spiel);
    }
    if (geladeneKopie) {
      for (const befehl of spiel.befehle.slice(geladeneKopie.befehle.length)) {
        if (!befehlGeben(geladeneKopie, structuredClone(befehl)).ok) throw new Error("Geladene Kopie lehnt einen Befehl ab");
      }
      if (JSON.stringify(geladeneKopie.zustand) !== JSON.stringify(spiel.zustand)) throw new Error("Geladene Kopie ergibt anderen Zustand");
      anzahlGeladen++;
    }
    const nachgespielt = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
    const zustaendeGleich = JSON.stringify(nachgespielt.zustand) === JSON.stringify(spiel.zustand);
    if (!zustaendeGleich) throw new Error("Nachspielen ergibt anderen Zustand");
    const ninkasi = spielerin(spiel.zustand);
    if (spiel.zustand.vorbei) anzahlTode++;
    console.log(
      `${String(startwert).padStart(9)}  ${String(spiel.befehle.length).padStart(7)}  ${String(spiel.zustand.zeit).padStart(7)}  ` +
      `${String(ninkasi.werte.lp.aktuell).padStart(3)}  ${String(ninkasi.werte.mp.aktuell).padStart(3)}  ${String(ninkasi.werte.pp.aktuell).padStart(3)}  ` +
      `${String(ninkasi.werte.pegel.aktuell).padStart(5)}  ${String(getoetet).padStart(7)}  ` +
      `${String(getrunkeneBiere).padStart(5)}  ${spiel.zustand.vorbei ? "tot" : "lebt"}, nachgespielt ok`
    );
  } catch (fehler) {
    anzahlFehler++;
    console.log(`${String(startwert).padStart(9)}  FEHLER: ${fehler.stack}`);
  }
}
const haltegruende = Object.entries(reisenNachHaltegrund).map(([grund, anzahl]) => `${grund} ${anzahl}`).join(", ");
console.log(`\nAbläufe nach Haltegrund: ${haltegruende}`);
console.log(`Fähigkeiten der Gegner: ${gegnerfaehigkeiten.gewirkt} gewirkt, ${gegnerfaehigkeiten.begonnen} lange Aktionen begonnen, ${gegnerfaehigkeiten.abgebrochen} abgebrochen; ${anzahlAngelegt} Mal angelegt, ${anzahlWuerfe} Würfe Ninkasis, ${ninkasisFaehigkeiten} Fähigkeiten Ninkasis`);
console.log(`Meldungen für Ninkasi: ${meldungenFuerNinkasi.gezeigt} gezeigt, ${meldungenFuerNinkasi.verborgen} verborgen, ${meldungenFuerNinkasi.gehoert} gehört`);
console.log(`Lernen: ${anzahlLernbefehle} Lernbefehle (${anzahlUeberFenster} über das Skillfenster), ${anzahlGelernt} angenommen, ${anzahlSkillstufen} Skillstufen erreicht`);
if (fehlendeTexte.size) {
  console.log(`Fehlende Texte in den Fenstern: ${[...fehlendeTexte].join("; ")}`);
  anzahlFehler++;
}
// Grundlage der Anfangsbalance: was eine Tiefe an EP hergibt, gemittelt über die Läufe (Zahlen der Daten vorläufig)
const budget = Object.entries(epJeTiefe).sort(([links], [rechts]) => links - rechts)
  .map(([tiefe, { erkundung, gebunden, frei }]) => `Tiefe ${tiefe}: Erkundung ${Math.round(erkundung / anzahlLaeufe)}, gebunden ${Math.round(gebunden / anzahlLaeufe)}, frei aus Beute ${Math.round(frei / anzahlLaeufe)}`)
  .join("; ");
console.log(`EP je Lauf: ${budget}`);
console.log(`Speichern: ${anzahlGeladen} Läufe mitten im Lauf gespeichert und geladen`);
console.log(`${anzahlLaeufe} Läufe, ${anzahlTode} tot, ${anzahlFehler} Fehler`);
process.exitCode = anzahlFehler ? 1 : 0;
