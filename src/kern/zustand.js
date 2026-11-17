// Spielzustand und Entitäten. Der gesamte Zustand ist reine Daten (JSON-serialisierbar).
// Eine Entität ist eine ID plus Komponenten, z.B.
//   { id, typ, text, position: {x, y}, werte, fraktion, ki, sicht, angriff, inventar, trinkbar, ... }
// Entitäten liegen in einem Objekt mit ganzzahligen Schlüsseln; JavaScript durchläuft solche
// Schlüssel aufsteigend, die Reihenfolge ist also fest (Erzeugungsreihenfolge).

import { ausDaten } from "./werte.js";
import { akteurEntfernen } from "./zeit.js";

export function neuerZustand(startwert) {
  return {
    startwert,
    zeit: 0,
    naechsteId: 1,
    zeitzaehler: 0,
    warteschlange: [],
    entitaeten: {},
    spielerId: null,
    vorbei: false,
    ebene: null,
    sichtbar: [],   // Feldindizes, die Ninkasi gerade sieht (aufsteigend)
    rng: null,      // Zustand des Spiel-RNG
  };
}

export function erzeugen(zustand, komponenten) {
  const id = zustand.naechsteId++;
  const ent = { id, ...komponenten };
  zustand.entitaeten[id] = ent;
  return ent;
}

// Felder eines Datensatzes, die keine Komponenten sind
const META = new Set(["vorlage", "abstrakt", "werte"]);

// Entität aus einem geprüften Datensatz (Wesen oder Gegenstand)
export function ausDatensatz(zustand, typ, datensatz, position) {
  const komponenten = { typ };
  for (const [schluessel, wert] of Object.entries(datensatz)) {
    if (META.has(schluessel)) continue;
    komponenten[schluessel] = structuredClone(wert);
  }
  if (datensatz.werte) komponenten.werte = ausDaten(datensatz.werte);
  if (position) komponenten.position = { x: position.x, y: position.y };
  return erzeugen(zustand, komponenten);
}

export function holen(zustand, id) {
  return zustand.entitaeten[id] || null;
}

export function alle(zustand) {
  return Object.values(zustand.entitaeten);
}

// Entitäten auf einem Feld (nur solche mit Position, also nicht getragene)
export function an(zustand, x, y) {
  return alle(zustand).filter((e) => e.position && e.position.x === x && e.position.y === y);
}

export function entfernen(zustand, id) {
  delete zustand.entitaeten[id];
  akteurEntfernen(zustand, id);
}

export function spieler(zustand) {
  return holen(zustand, zustand.spielerId);
}
