// Feldschichten neben der Karte (siehe docs/Welt.md, Feldschichten): reiner Datenzugriff, ändert nichts.
// zustand.ebene.schichten = { oberflaeche: { feldindex: { art, menge } }, gas: { ... }, feuer: { feldindex: { menge } } }
// Nur belegte Felder stehen darin; je Feld und Schicht höchstens eine Art. Die Arten stehen in daten/schichten.js
// (oberflaechen, gase), das Feuer in den Regeln (regeln.feuer). Geschrieben wird über systeme/schichten.js.

import { aufDerKarte, feldIndex, durchsichtig, gelaendeAuf } from "./karte.js";

export const SCHICHTEN = ["oberflaeche", "gas", "feuer"];

// Die Schichten der Ebene, beim Schreiben angelegt; lesend gibt es ohne sie leere Tabellen
export function schichtenVon(ebene, anlegen = false) {
  if (!ebene.schichten && anlegen) ebene.schichten = { oberflaeche: {}, gas: {}, feuer: {} };
  return ebene.schichten ?? { oberflaeche: {}, gas: {}, feuer: {} };
}

// Eintrag einer Schicht auf einem Feld oder null
export function schichtAuf(spiel, schicht, x, y) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, x, y)) return null;
  return schichtenVon(ebene)[schicht][feldIndex(ebene, x, y)] ?? null;
}

export function feldVonIndex(ebene, index) {
  return { x: index % ebene.breite, y: Math.floor(index / ebene.breite) };
}

// Belegte Feldindizes einer Schicht, aufsteigend (feste Reihenfolge für Weltuhr und Zufall)
export function belegteFelder(ebene, schicht) {
  return Object.keys(schichtenVon(ebene)[schicht]).map(Number).sort((erster, zweiter) => erster - zweiter);
}

// Ob Gas das Feld durchdringt: gasdurchlaessig am Gelände, Vorgabe wie passierbar (Wände, geschlossene Türen halten es auf)
export function gasdurchlaessig(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  if (!gelaende) return false;
  return gelaende.gasdurchlaessig ?? Boolean(gelaende.passierbar);
}

// Ob ein Feld die Sicht durchlässt: das Gelände und kein Gas, das ab einer Menge undurchsichtig ist (dichter Rauch)
export function sichtdurchlaessig(spiel, x, y) {
  if (!durchsichtig(spiel, x, y)) return false;
  const gas = schichtAuf(spiel, "gas", x, y);
  if (!gas) return true;
  const grenze = spiel.daten.schichten?.gase?.[gas.art]?.undurchsichtigAb;
  return grenze === undefined || gas.menge < grenze;
}
