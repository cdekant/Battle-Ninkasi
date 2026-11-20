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
import { zielmodusBeginnen, zielmodusTaste, zielangabeVon, cursorSetzen } from "../src/eingabe/zielmodus.js";
import belegung from "../src/eingabe/belegung.js";
import einstellungen from "../src/eingabe/einstellungen.js";
import { indexPruefen } from "../src/kern/raumindex.js";
import { warteschlangeGueltig } from "../src/kern/zeit.js";

const [anzahlLaeufe = 20, hoechsteBefehlszahl = 3000, ersterStartwert = 1] = process.argv.slice(2).map(Number);
const daten = datenLaden(rohdaten, { texte, nomenPruefen: erstelleGrammatik(grammatikDe).pruefen });

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
  return { art: "bewegen", dx: zufallsGanzzahl(botZufall, -1, 1), dy: zufallsGanzzahl(botZufall, -1, 1) };
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

// Ein zufälliger Ablauf: meist Reise, sonst Erkunden, Rasten oder Treppe; gibt "art:haltegrund" zurück
function ablaufWaehlen(botZufall, spiel) {
  if (zufallsGanzzahl(botZufall, 1, 6) === 1) return `treppe:${treppeNehmen(botZufall, spiel)}`;
  const wurf = zufallsGanzzahl(botZufall, 1, 5);
  if (wurf === 4) return `erkunden:${ablaufLaufenLassen(spiel, erkundenBeginnen(spiel, einstellungen), naechsterErkundungsschritt)}`;
  if (wurf === 5) return `rasten:${ablaufLaufenLassen(spiel, rastenBeginnen(spiel, einstellungen), naechsterRastschritt)}`;
  return `reise:${reisen(botZufall, spiel)}`;
}

let anzahlTode = 0, anzahlFehler = 0;
const reisenNachHaltegrund = {};
// Fähigkeiten der Gegner: gewirkt, lange Aktionen begonnen und abgebrochen
const gegnerfaehigkeiten = { gewirkt: 0, begonnen: 0, abgebrochen: 0 };
// Würfe und Fähigkeiten Ninkasis
let anzahlWuerfe = 0, anzahlAngelegt = 0, ninkasisFaehigkeiten = 0;
console.log("Startwert  Befehle  Zeit     LP   MP   PP  Pegel  Getötet  Biere  Ergebnis");
for (let startwert = ersterStartwert; startwert < ersterStartwert + anzahlLaeufe; startwert++) {
  try {
    const spiel = neuesSpiel(daten, startwert);
    let getoetet = 0, getrunkeneBiere = 0;
    hoererAnmelden(spiel, (meldung) => {
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
      befehlGeben(spiel, zufallsbefehl(botZufall, spiel));
      invariantenPruefen(spiel);
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
console.log(`${anzahlLaeufe} Läufe, ${anzahlTode} tot, ${anzahlFehler} Fehler`);
process.exitCode = anzahlFehler ? 1 : 0;
