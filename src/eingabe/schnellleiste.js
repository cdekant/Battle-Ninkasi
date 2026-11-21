// Schnellleiste (siehe docs/Oberflaeche.md, Schnellleiste): Kern ohne DOM, damit er testbar ist.
// Anzeige-Zustand, nicht im Spielzustand; gespeichert im Teil oberflaeche des Speicherstands (eingabe/speicherstand.js):
//   leisten: { leisten: [[platz | null] x PLAETZE_DER_LEISTE] x ANZAHL_LEISTEN, aktiveLeiste, abgelegt: [schluessel] }
//   platz:   { art: "faehigkeit", faehigkeit, vonHand? } | { art: "gegenstand", typ, vonHand? }
// Gegenstände liegen nach ihrer Art (typ) auf dem Platz, nicht als einzelnes Stück: ist ein Stapel aufgebraucht, bleibt
// der Platz grau mit Anzahl 0 und füllt sich wieder, sobald Ninkasi ein Stück derselben Art trägt.
// Automatisch nachgeführt (leistenNachfuehren, nach jedem Befehl): neue Fähigkeiten und neue Getränkearten rücken auf
// den ersten freien Platz, zuerst der Leiste 1, dann 2 bis 5; was die Spielerin heruntergenommen hat (abgelegt), kommt
// nicht von selbst wieder; ein von Hand belegter Platz wird nie überschrieben. Wurfwaffen kommen nur von Hand dazu.
// Zustand eines Platzes für die Anzeige: { platz, anzahl?, abklingend?, grund? }

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { anzahlVon } from "../systeme/inventar.js";
import { faehigkeitPruefen, zuegeBisBereit } from "../systeme/faehigkeiten.js";
import { PLAETZE_DER_LEISTE } from "./aktionskatalog.js";

export const ANZAHL_LEISTEN = 5;

// Gründe, die nur am Ziel liegen; sie machen einen Platz nicht grau (der Zielmodus wählt erst das Ziel)
const GRUENDE_DES_ZIELS = ["ungueltig", "kein_ziel", "nicht_sichtbar", "zu_weit", "keine_sichtlinie"];

export function neueLeisten() {
  return { leisten: Array.from({ length: ANZAHL_LEISTEN }, () => Array(PLAETZE_DER_LEISTE).fill(null)), aktiveLeiste: 0, abgelegt: [] };
}

// Prüft einen gespeicherten Stand der Leisten; ungültig gibt es frische Leisten
export function leistenGueltig(leisten) {
  const gueltig = leisten && Array.isArray(leisten.leisten) && leisten.leisten.length === ANZAHL_LEISTEN
    && leisten.leisten.every((leiste) => Array.isArray(leiste) && leiste.length === PLAETZE_DER_LEISTE)
    && Number.isInteger(leisten.aktiveLeiste) && leisten.aktiveLeiste >= 0 && leisten.aktiveLeiste < ANZAHL_LEISTEN
    && Array.isArray(leisten.abgelegt);
  return gueltig ? structuredClone(leisten) : neueLeisten();
}

// Schlüssel eines Platzes, gleich für jede Stelle: "faehigkeit:<name>" oder "gegenstand:<typ>"
export function platzSchluessel(platz) {
  return platz.art === "faehigkeit" ? `faehigkeit:${platz.faehigkeit}` : `gegenstand:${platz.typ}`;
}

export const aktivePlaetze = (leisten) => leisten.leisten[leisten.aktiveLeiste];

function gepaeck(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  return (ninkasi.inventar || []).map((id) => entitaetMitId(spiel.zustand, id)).filter(Boolean);
}

function belegteSchluessel(leisten) {
  return new Set(leisten.leisten.flat().filter(Boolean).map(platzSchluessel));
}

// Fügt neue Fähigkeiten (in Lernreihenfolge) und neue Getränkearten (in der Reihenfolge des Gepäcks) auf freie Plätze;
// gibt den neuen Stand zurück (der alte bleibt unverändert)
export function leistenNachfuehren(spiel, leisten) {
  const ninkasi = spielerin(spiel.zustand);
  const neu = structuredClone(leisten);
  const belegt = belegteSchluessel(neu);
  const kandidaten = (ninkasi.faehigkeiten || []).map((faehigkeit) => ({ art: "faehigkeit", faehigkeit }));
  for (const gegenstand of gepaeck(spiel)) if (gegenstand.trinkbar) kandidaten.push({ art: "gegenstand", typ: gegenstand.typ });
  for (const platz of kandidaten) {
    const schluessel = platzSchluessel(platz);
    if (belegt.has(schluessel) || neu.abgelegt.includes(schluessel)) continue;
    const leiste = neu.leisten.find((plaetze) => plaetze.includes(null));
    if (!leiste) break;
    leiste[leiste.indexOf(null)] = platz;
    belegt.add(schluessel);
  }
  return neu;
}

// Legt einen Platz von Hand auf eine Stelle der aktiven Leiste; liegt dasselbe schon woanders, zieht es um
export function platzBelegen(leisten, stelle, platz) {
  const neu = structuredClone(leisten);
  const schluessel = platzSchluessel(platz);
  for (const leiste of neu.leisten) leiste.forEach((vorhanden, index) => { if (vorhanden && platzSchluessel(vorhanden) === schluessel) leiste[index] = null; });
  aktivePlaetze(neu)[stelle] = { ...structuredClone(platz), vonHand: true };
  neu.abgelegt = neu.abgelegt.filter((eintrag) => eintrag !== schluessel);
  return neu;
}

// Nimmt einen Platz der aktiven Leiste herunter; er kommt nicht von selbst wieder
export function platzLeeren(leisten, stelle) {
  const platz = aktivePlaetze(leisten)[stelle];
  if (!platz) return leisten;
  return ohneSchluessel(leisten, platzSchluessel(platz));
}

// Nimmt alles mit diesem Schlüssel von allen Leisten (Entf im Inventar und Fähigkeitenfenster)
export function ohneSchluessel(leisten, schluessel) {
  const neu = structuredClone(leisten);
  for (const leiste of neu.leisten) leiste.forEach((platz, index) => { if (platz && platzSchluessel(platz) === schluessel) leiste[index] = null; });
  if (!neu.abgelegt.includes(schluessel)) neu.abgelegt.push(schluessel);
  return neu;
}

// Tauscht zwei Stellen der aktiven Leiste; beide gelten danach als von Hand gelegt
export function plaetzeTauschen(leisten, von, nach) {
  if (von === nach) return leisten;
  const neu = structuredClone(leisten);
  const plaetze = aktivePlaetze(neu);
  [plaetze[von], plaetze[nach]] = [plaetze[nach], plaetze[von]];
  for (const stelle of [von, nach]) if (plaetze[stelle]) plaetze[stelle].vonHand = true;
  return neu;
}

export function leisteWechseln(leisten, nummer) {
  if (!Number.isInteger(nummer) || nummer < 0 || nummer >= ANZAHL_LEISTEN) return leisten;
  return { ...structuredClone(leisten), aktiveLeiste: nummer };
}

// Stellen (Leiste und Platz) eines Schlüssels, für die Anzeige im Fenster ("Leiste 1, Platz 3")
export function stellenVon(leisten, schluessel) {
  const stellen = [];
  leisten.leisten.forEach((leiste, nummer) => leiste.forEach((platz, stelle) => { if (platz && platzSchluessel(platz) === schluessel) stellen.push({ leiste: nummer, stelle }); }));
  return stellen;
}

// Erstes Stück einer Art im Gepäck oder null
export function erstesStueck(spiel, typ) {
  return gepaeck(spiel).find((gegenstand) => gegenstand.typ === typ) ?? null;
}

// Zustand eines Platzes für die Anzeige: Anzahl bei Gegenständen, Abklingzeit in Zügen, Grund, wenn er nicht geht
export function platzZustand(spiel, platz) {
  if (!platz) return null;
  const ninkasi = spielerin(spiel.zustand);
  if (platz.art === "gegenstand") {
    const anzahl = gepaeck(spiel).filter((gegenstand) => gegenstand.typ === platz.typ).reduce((summe, gegenstand) => summe + anzahlVon(gegenstand), 0);
    return { platz, anzahl, ...(anzahl === 0 && { grund: "nichts_mehr_davon" }) };
  }
  const abklingend = zuegeBisBereit(ninkasi, platz.faehigkeit);
  const grund = faehigkeitPruefen(spiel, ninkasi, platz.faehigkeit, undefined);
  return { platz, abklingend, ...(grund && !GRUENDE_DES_ZIELS.includes(grund) && { grund }) };
}

// Was ein Platz der aktiven Leiste tut: { befehl } (Getränk), { auswahl } (Fähigkeit oder Wurf, weiter über den
// Zielmodus), { grund } (geht nicht) oder null (leerer Platz). Ein Gegenstand wird getrunken, wenn er trinkbar ist,
// sonst geworfen.
export function platzAusloesen(spiel, leisten, stelle) {
  const platz = aktivePlaetze(leisten)[stelle];
  if (!platz) return null;
  if (platz.art === "gegenstand") {
    const stueck = erstesStueck(spiel, platz.typ);
    if (!stueck) return { grund: "nichts_mehr_davon" };
    return stueck.trinkbar ? { befehl: { art: "trinken", gegenstandId: stueck.id } } : { auswahl: { zweck: "werfen", gegenstandId: stueck.id } };
  }
  return { auswahl: { zweck: "faehigkeit", faehigkeit: platz.faehigkeit } };
}
