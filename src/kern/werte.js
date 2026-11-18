// Werte (LP, MP, PP, Pegel und weitere) als erweiterbarer Satz, berechnet aus Grundwert und Modifikatoren.
// Wert in der Entität:   werte: { lp: { grundwert: 100, aktuell: 100, hundertstelRest: 0 } }
//   ohne grundwert ist der Wert nach oben offen (z.B. der Pegel), nach unten bleibt er bei 0
//   hundertstelRest: Bruchteile in Hundertsteln, ein voller Punkt wird gutgeschrieben
// Modifikator: { ziel: "lp" | "kosten.bewegen" | "kosten.alle" | ..., art, betrag, quelle, tag?, wenn? }
//   art: "plus" | "prozent" | "mal" | "mindestens" | "hoechstens" | "setzen"; betrag ganzzahlig, bei "mal" in Prozent (150 = x1,5)
//   tag:  wirkt nur, wenn die Abfrage den Tag mitbringt (umstaende.tags), z.B. kosten für "psi", schaden für "feuer"
//   wenn: [{ bedingung, ...parameter }] alle müssen gelten (Register "modifikatorbedingungen", systeme/modifikatoren.js)
// Umstände einer Abfrage: { gegenueberId?, tags? }, z.B. das Ziel und die Tags eines Angriffs
// Modifikatoren werden bei jeder Abfrage aus allen Quellen gesammelt (Register "modifikatorquellen"), nichts wird nachgeführt.
// Verrechnung (siehe docs/Architektur.md, Modifikatoren):
//   (basiswert + Summe plus) x (100 + Summe prozent) / 100 x jedes mal / 100, einmal gerundet,
//   dann mindestens (der höchste), dann hoechstens (der niedrigste, gewinnt also); setzen zählt als beides.

import { anmelden, alle, holen } from "./register.js";

export const MODIFIKATORARTEN = ["plus", "prozent", "mal", "mindestens", "hoechstens", "setzen"];

// Einheitliche Rundung für Prozentrechnung
export function prozentVon(wert, prozent) {
  return Math.round((wert * prozent) / 100);
}

// Wiederholte Prozentrechnung, je Stufe einzeln gerundet (Dämpfung der Auslöser, Abschwächung je Sprung)
export function prozentWiederholt(wert, prozent, anzahlStufen) {
  let ergebnis = wert;
  for (let stufe = 0; stufe < anzahlStufen; stufe++) ergebnis = prozentVon(ergebnis, prozent);
  return ergebnis;
}

// Einheitliche Rundung beim Teilen (verteilter Schaden), teiler > 0
export function geteiltGerundet(wert, teiler) {
  return Math.round(wert / teiler);
}

// Alle Modifikatoren einer Entität aus allen Quellen, in der Reihenfolge der Anmeldung der Quellen
export function alleModifikatoren(spiel, entitaet) {
  const ergebnis = [];
  for (const [, quelle] of alle("modifikatorquellen")) ergebnis.push(...quelle(spiel, entitaet));
  return ergebnis;
}

function bedingungErfuellt(spiel, entitaet, { bedingung, ...parameter }, umstaende) {
  return holen("modifikatorbedingungen", bedingung)(spiel, entitaet, parameter, umstaende);
}

function modifikatorGilt(spiel, entitaet, modifikator, umstaende) {
  if (modifikator.tag !== undefined && !(umstaende.tags || []).includes(modifikator.tag)) return false;
  return (modifikator.wenn || []).every((bedingung) => bedingungErfuellt(spiel, entitaet, bedingung, umstaende));
}

// Schutz gegen Abfragen, die sich über Bedingungen oder Quellen selbst wieder aufrufen
const HOECHSTE_ABFRAGETIEFE = 8;
let abfrageTiefe = 0;

// Die wirksamen Modifikatoren mit einem der Ziele, jeweils mit Quelle; Grundlage für Erklärungen in der Anzeige
export function modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende = {}) {
  const zielListe = Array.isArray(ziele) ? ziele : [ziele];
  if (abfrageTiefe >= HOECHSTE_ABFRAGETIEFE) {
    throw new Error(`Modifikatoren für ${zielListe.join(", ")} fragen sich im Kreis ab (Bedingung oder Quelle ruft modifiziert auf)`);
  }
  abfrageTiefe++;
  try {
    return alleModifikatoren(spiel, entitaet)
      .filter((modifikator) => zielListe.includes(modifikator.ziel) && modifikatorGilt(spiel, entitaet, modifikator, umstaende));
  } finally {
    abfrageTiefe--;
  }
}

// Verrechnet Modifikatoren mit einem Basiswert; ganzzahlig bis zur einen Rundung am Ende
export function verrechnet(basiswert, modifikatoren) {
  let summePlus = 0, summeProzent = 0, zaehler = 1, nenner = 1;
  let untergrenze = -Infinity, obergrenze = Infinity;
  for (const { art, betrag } of modifikatoren) {
    if (art === "plus") summePlus += betrag;
    else if (art === "prozent") summeProzent += betrag;
    else if (art === "mal") { zaehler *= betrag; nenner *= 100; }
    if (art === "mindestens" || art === "setzen") untergrenze = Math.max(untergrenze, betrag);
    if (art === "hoechstens" || art === "setzen") obergrenze = Math.min(obergrenze, betrag);
  }
  const ergebnis = Math.round(((basiswert + summePlus) * (100 + summeProzent) * zaehler) / (100 * nenner));
  return Math.min(obergrenze, Math.max(untergrenze, ergebnis));
}

// Wendet alle Modifikatoren mit einem der Ziele auf einen Basiswert an
export function modifiziert(spiel, entitaet, ziele, basiswert, umstaende = {}) {
  return verrechnet(basiswert, modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende));
}

// Skaliert einen Modifikator mit einer Stärke in Prozent (Zustände): plus und prozent im Betrag,
// mal im Anteil über 100 (mal 150 bei 50 % wird mal 125), Grenzen gar nicht
export function modifikatorSkaliert(modifikator, staerkeProzent) {
  const { art, betrag } = modifikator;
  if (art === "plus" || art === "prozent") return { ...modifikator, betrag: prozentVon(betrag, staerkeProzent) };
  if (art === "mal") return { ...modifikator, betrag: 100 + prozentVon(betrag - 100, staerkeProzent) };
  return { ...modifikator };
}

// Wert, dessen Fall auf 0 tötet (Daten: lebenswert, Vorgabe "lp"); siehe systeme/tod.js
export function lebenswertName(entitaet) {
  return entitaet.lebenswert || "lp";
}

// Was beim Tod mit dem Inventar geschieht (Daten: beimTod: { inventar })
export const HINTERLASSENSCHAFT_REGELN = ["fallen_lassen", "vernichten"];

export function hatWert(entitaet, wertName) {
  return Boolean(entitaet.werte && entitaet.werte[wertName]);
}

// Ein Wert ohne Grundwert hat keine Obergrenze
export function hatHoechstwert(entitaet, wertName) {
  return entitaet.werte[wertName].grundwert !== undefined;
}

// Höchstwert aus Grundwert und Modifikatoren; Infinity für offene Werte (wird nur berechnet, nie gespeichert)
export function hoechstwert(spiel, entitaet, wertName) {
  if (!hatHoechstwert(entitaet, wertName)) return Infinity;
  return modifiziert(spiel, entitaet, wertName, entitaet.werte[wertName].grundwert);
}

// Ändert einen Wert innerhalb 0 bis Höchstwert, gibt die tatsächliche Änderung zurück.
// Ohne Haken; im Spiel läuft jede Änderung über wertAendern in kern/effekte.js.
export function wertBegrenztAendern(spiel, entitaet, wertName, aenderung) {
  const wert = entitaet.werte[wertName];
  const vorher = wert.aktuell;
  wert.aktuell = Math.max(0, Math.min(hoechstwert(spiel, entitaet, wertName), vorher + aenderung));
  return wert.aktuell - vorher;
}

// Änderung in Hundertsteln über den Rest; gibt die Änderung in vollen Punkten zurück
export function wertBegrenztAendernInHundertsteln(spiel, entitaet, wertName, hundertstel) {
  const wert = entitaet.werte[wertName];
  wert.hundertstelRest = (wert.hundertstelRest || 0) + hundertstel;
  const vollePunkte = Math.trunc(wert.hundertstelRest / 100);
  wert.hundertstelRest -= vollePunkte * 100;
  const geaendert = vollePunkte !== 0 ? wertBegrenztAendern(spiel, entitaet, wertName, vollePunkte) : 0;
  // am Anschlag keinen Rest ansammeln
  const amHoechstwert = wert.aktuell >= hoechstwert(spiel, entitaet, wertName) && wert.hundertstelRest > 0;
  const amNullpunkt = wert.aktuell <= 0 && wert.hundertstelRest < 0;
  if (amHoechstwert || amNullpunkt) wert.hundertstelRest = 0;
  return geaendert;
}

// Quelle "eigene": die Liste an der Entität (feste Modifikatoren, z.B. aus Daten der Wesen oder in Tests)
export function modifikatorHinzufuegen(entitaet, modifikator) {
  if (!entitaet.modifikatoren) entitaet.modifikatoren = [];
  entitaet.modifikatoren.push(modifikator);
}

// Entfällt eine Quelle, entfallen genau ihre Modifikatoren
export function modifikatorenEntfernen(entitaet, quelle) {
  if (entitaet.modifikatoren) entitaet.modifikatoren = entitaet.modifikatoren.filter((modifikator) => modifikator.quelle !== quelle);
}

anmelden("modifikatorquellen", "eigene", (spiel, entitaet) => entitaet.modifikatoren || []);

// Erzeugt den Wertesatz einer Entität aus Daten: { lp: { grundwert: 100, anfangswert?: 100 }, pegel: { anfangswert: 0 } }
export function werteAusDaten(wertedaten) {
  const werte = {};
  for (const [wertName, daten] of Object.entries(wertedaten || {})) {
    const aktuell = daten.anfangswert ?? daten.grundwert;
    werte[wertName] = daten.grundwert === undefined
      ? { aktuell, hundertstelRest: 0 }
      : { grundwert: daten.grundwert, aktuell, hundertstelRest: 0 };
  }
  return werte;
}
