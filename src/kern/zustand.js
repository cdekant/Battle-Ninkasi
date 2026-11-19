// Spielzustand und Entitäten. Der gesamte Zustand ist reine Daten (JSON-serialisierbar).
// Eine Entität ist eine ID plus Komponenten, z.B.
//   { id, typ, text, position: {x, y}, werte, fraktion, ki, sicht, angriffe, inventar, trinkbar, zustaende, ... }
// Entitäten liegen in einem Objekt mit ganzzahligen Schlüsseln; JavaScript durchläuft solche
// Schlüssel aufsteigend, die Reihenfolge ist also fest (Erzeugungsreihenfolge).

import { werteAusDaten } from "./werte.js";
import { akteurEntfernen, gebundeneEreignisseEntfernen } from "./zeit.js";

export function neuerZustand(startwert) {
  return {
    startwert,
    zeit: 0,
    naechsteId: 1,
    naechsteZustandsnummer: 1, // Nummern der Zustände an Entitäten (systeme/zustaende.js)
    einreihungszaehler: 0,
    warteschlange: [],
    entitaeten: {},
    spielerinId: null,
    vorbei: false,
    ebene: null,
    sichtbareFelder: [], // Feldindizes, die Ninkasi gerade sieht (aufsteigend)
    zufallszustand: null, // Zustand des Spiel-Zufalls
  };
}

export function entitaetErzeugen(zustand, komponenten) {
  const id = zustand.naechsteId++;
  const entitaet = { id, ...komponenten };
  zustand.entitaeten[id] = entitaet;
  return entitaet;
}

// Felder eines Datensatzes, die keine Komponenten sind
const KEINE_KOMPONENTEN = new Set(["vorlage", "abstrakt", "werte"]);

// Entität aus einem geprüften Datensatz (Wesen oder Gegenstand)
export function entitaetAusDatensatz(zustand, typ, datensatz, position) {
  const komponenten = { typ };
  for (const [schluessel, wert] of Object.entries(datensatz)) {
    if (KEINE_KOMPONENTEN.has(schluessel)) continue;
    komponenten[schluessel] = structuredClone(wert);
  }
  if (datensatz.werte) komponenten.werte = werteAusDaten(datensatz.werte);
  if (position) komponenten.position = { x: position.x, y: position.y };
  return entitaetErzeugen(zustand, komponenten);
}

export function entitaetMitId(zustand, id) {
  return zustand.entitaeten[id] || null;
}

export function alleEntitaeten(zustand) {
  return Object.values(zustand.entitaeten);
}

// Entitäten auf einem Feld (nur solche mit Position, also nicht getragene)
export function entitaetenAuf(zustand, x, y) {
  return alleEntitaeten(zustand).filter((entitaet) => entitaet.position && entitaet.position.x === x && entitaet.position.y === y);
}

// Entfernt eine Entität samt ihrem Platz in der Warteschlange, ihren gebundenen Zeitereignissen
// und allem, was sie trägt; ist sie selbst getragen, verschwindet sie aus dem Inventar der Trägerin.
// Wer Getragenes behalten will (z.B. fallen lassen beim Tod), muss es vorher herausnehmen.
export function entitaetEntfernen(zustand, id) {
  const entitaet = zustand.entitaeten[id];
  if (!entitaet) return;
  if (entitaet.getragenVon !== undefined) {
    const traegerin = zustand.entitaeten[entitaet.getragenVon];
    if (traegerin && traegerin.inventar) traegerin.inventar = traegerin.inventar.filter((getragenId) => getragenId !== id);
  }
  for (const getragenId of entitaet.inventar || []) entitaetEntfernen(zustand, getragenId);
  delete zustand.entitaeten[id];
  akteurEntfernen(zustand, id);
  gebundeneEreignisseEntfernen(zustand, id);
}

// Wirksame Fraktion und KI: die des jüngsten Zustands, der sie überlagert (systeme/zustaende.js), sonst die eigene
function juengsteUeberlagerung(entitaet, feld) {
  const zustaende = entitaet?.zustaende || [];
  for (let position = zustaende.length - 1; position >= 0; position--) {
    if (zustaende[position][feld] !== undefined) return zustaende[position][feld];
  }
  return entitaet?.[feld];
}

// Ein Wesen hat eine Fraktion und LP (im Unterschied zu Gegenständen)
export function istWesen(entitaet) {
  return Boolean(entitaet && entitaet.fraktion !== undefined && entitaet.werte && entitaet.werte.lp);
}

export function fraktionVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "fraktion");
}

export function kiVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "ki");
}

// Wirksame Bewegungsart (siehe welt/karte.js): die des jüngsten überlagernden Zustands, sonst die eigene, Vorgabe "laufend"
export function bewegungVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "bewegung") ?? "laufend";
}

export function spielerin(zustand) {
  return entitaetMitId(zustand, zustand.spielerinId);
}
