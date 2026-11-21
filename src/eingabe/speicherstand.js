// Speicherstand des Browsers (siehe docs/Architektur.md, Speichern): Kern ohne DOM und ohne localStorage, damit er
// testbar ist; src/main.js schreibt und liest den Text unter SPEICHERSCHLUESSEL_LAUF.
//   { version, startwert, optionen, befehle, zustand, oberflaeche: { leisten, log } }
// Spielstand (Startwert, Startoptionen, Befehle) ist die verbindliche Aufzeichnung; der Schnappschuss des Zustands
// lädt sofort, ohne Nachspielen (kern/spiel.js ausSchnappschuss). Der Teil oberflaeche liest die Logik nie.
// Passt die Version nicht oder ist der Text kaputt, gibt es einen Grund statt eines Spiels; der Lauf beginnt dann neu.

import VERSION from "../version.js";
import { schnappschuss, ausSchnappschuss } from "../kern/spiel.js";
import { leistenGueltig } from "./schnellleiste.js";

export const SPEICHERSCHLUESSEL_LAUF = "battle-ninkasi.lauf";
export const GESPEICHERTE_LOGZEILEN = 200;

// Text des Speicherstands zu einem Spiel und dem Anzeige-Zustand der Oberfläche
export function speicherstandText(spiel, { leisten, logzeilen = [] }) {
  return JSON.stringify({ ...schnappschuss(spiel), oberflaeche: { leisten, log: logzeilen.slice(-GESPEICHERTE_LOGZEILEN) } });
}

// Liest einen Speicherstand: { spiel, oberflaeche: { leisten, log } } oder { grund, version? };
// grund: "kaputt" (kein lesbarer Stand), "version" (andere Version), "fehler" (Zustand lässt sich nicht einsetzen)
export function speicherstandLesen(daten, text) {
  let stand;
  try {
    stand = JSON.parse(text);
  } catch {
    return { grund: "kaputt" };
  }
  if (!stand || typeof stand !== "object" || !stand.zustand) return { grund: "kaputt" };
  if (stand.version !== VERSION) return { grund: "version", version: String(stand.version) };
  try {
    const spiel = ausSchnappschuss(daten, stand);
    const log = Array.isArray(stand.oberflaeche?.log) ? stand.oberflaeche.log : [];
    return { spiel, oberflaeche: { leisten: leistenGueltig(stand.oberflaeche?.leisten), log } };
  } catch {
    return { grund: "fehler" };
  }
}
