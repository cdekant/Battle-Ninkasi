// Eigene Tastenbelegung (siehe docs/Bedienung.md, Eingabe): Abweichungen von der Vorgabe (eingabe/belegung.js),
// ohne DOM, damit sie testbar ist. src/main.js speichert die Abweichungen unter battle-ninkasi.belegung und baut beim
// Start einmal die wirksame Belegung (abweichungenAnwenden).
//   abweichungen: { tasten: { code: aktion | null }, zeichen: { zeichen: aktion | null } }, null nimmt eine Taste weg
// Eine Taste ist { code } (physische Taste, KeyboardEvent.code) oder { zeichen } (KeyboardEvent.key); neu belegt wird
// immer die physische Taste. Zeichen gehen bei der Auswertung den Tasten vor; belegt man eine Taste, deren Zeichen
// schon eine Aktion hat, verliert das Zeichen diese Aktion, sonst wirkte die neue Belegung nicht.
// Nicht belegbar (GESPERRT): Esc, Enter und Tab (Fenster, Zielmodus), ?, die Funktionstasten des Browsers und
// Umschalt, Strg, Alt allein. Umschalt+Ziffer (Leisten) und Umschalt+Richtung (Laufen) sind fest.

import { AKTIONEN, tastenDerAktion } from "./aktionskatalog.js";

const GESPERRTE_CODES = ["Escape", "Enter", "NumpadEnter", "Tab", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "ContextMenu"];
const GESPERRTE_ZEICHEN = ["?"];

export const leereAbweichungen = () => ({ tasten: {}, zeichen: {} });

// Gespeicherte Abweichungen prüfen; Aktionen, die der Katalog nicht mehr kennt (umbenannt oder entfernt), fallen weg,
// statt mitgeschleppt zu werden (siehe docs/Architektur.md, Speichern)
export function abweichungenGueltig(abweichungen) {
  const gueltig = abweichungen && typeof abweichungen.tasten === "object" && typeof abweichungen.zeichen === "object";
  if (!gueltig) return leereAbweichungen();
  const bekannt = ([, aktion]) => aktion === null || Object.hasOwn(AKTIONEN, aktion);
  return { tasten: Object.fromEntries(Object.entries(abweichungen.tasten).filter(bekannt)), zeichen: Object.fromEntries(Object.entries(abweichungen.zeichen).filter(bekannt)) };
}

export function tasteGesperrt(taste) {
  if (taste.code && (GESPERRTE_CODES.includes(taste.code) || /^F\d+$/.test(taste.code))) return true;
  return taste.zeichen !== undefined && GESPERRTE_ZEICHEN.includes(taste.zeichen);
}

// Wirksame Belegung: Vorgabe mit den Abweichungen darüber (die Vorgabe bleibt unverändert)
export function abweichungenAnwenden(vorgabe, abweichungen) {
  const belegung = structuredClone(vorgabe);
  for (const teil of ["tasten", "zeichen"]) {
    for (const [taste, aktion] of Object.entries(abweichungen?.[teil] || {})) {
      if (aktion === null) delete belegung[teil][taste];
      else belegung[teil][taste] = aktion;
    }
  }
  return belegung;
}

// Die änderbaren Tasten einer Aktion (ohne Umschalt-Kombinationen und Pseudotasten)
export function aenderbareTasten(belegung, aktion) {
  return tastenDerAktion(belegung, aktion).filter((taste) => !taste.umschalt && taste.code !== "UmschaltRichtung");
}

// Welche andere Aktion eine aufgenommene Taste { code, zeichen? } schon hat, oder null
export function konfliktVon(belegung, neueTaste, aktion) {
  const ueberZeichen = neueTaste.zeichen !== undefined ? belegung.zeichen?.[neueTaste.zeichen] : undefined;
  const andere = [ueberZeichen, belegung.tasten[neueTaste.code]].find((vorhanden) => vorhanden && vorhanden !== aktion);
  return andere ?? null;
}

const teilVon = (taste) => (taste.zeichen !== undefined && taste.code === undefined ? "zeichen" : "tasten");
const schluesselVon = (taste) => (teilVon(taste) === "zeichen" ? taste.zeichen : taste.code);

// Belegt eine aufgenommene Taste mit einer Aktion; alteTaste (falls angegeben) verliert die Aktion. Gibt
// { abweichungen, verdraengt } zurück: verdraengt ist die Aktion, die die Taste vorher hatte, oder null.
export function tasteSetzen(vorgabe, abweichungen, aktion, alteTaste, neueTaste) {
  const neu = abweichungenGueltig(abweichungen);
  const belegung = abweichungenAnwenden(vorgabe, neu);
  const verdraengt = konfliktVon(belegung, neueTaste, aktion);
  if (alteTaste) neu[teilVon(alteTaste)][schluesselVon(alteTaste)] = null;
  if (neueTaste.zeichen !== undefined && belegung.zeichen?.[neueTaste.zeichen] && belegung.zeichen[neueTaste.zeichen] !== aktion) neu.zeichen[neueTaste.zeichen] = null;
  neu.tasten[neueTaste.code] = aktion;
  return { abweichungen: aufraeumen(vorgabe, neu), verdraengt };
}

// Nimmt einer Aktion eine Taste weg
export function tasteEntfernen(vorgabe, abweichungen, taste) {
  const neu = abweichungenGueltig(abweichungen);
  neu[teilVon(taste)][schluesselVon(taste)] = null;
  return aufraeumen(vorgabe, neu);
}

// Eine Aktion zurück auf ihre Vorgabe: alle Abweichungen, die sie betreffen, fallen weg
export function aktionAufVorgabe(vorgabe, abweichungen, aktion) {
  const neu = abweichungenGueltig(abweichungen);
  for (const teil of ["tasten", "zeichen"]) {
    for (const [taste, ziel] of Object.entries(neu[teil])) {
      if (ziel === aktion || vorgabe[teil]?.[taste] === aktion) delete neu[teil][taste];
    }
  }
  return neu;
}

// Abweichungen, die der Vorgabe gleichen, fallen weg (gespeichert wird nur, was abweicht)
function aufraeumen(vorgabe, abweichungen) {
  for (const teil of ["tasten", "zeichen"]) {
    for (const [taste, aktion] of Object.entries(abweichungen[teil])) {
      const inDerVorgabe = vorgabe[teil]?.[taste] ?? null;
      if (aktion === inDerVorgabe) delete abweichungen[teil][taste];
    }
  }
  return abweichungen;
}
