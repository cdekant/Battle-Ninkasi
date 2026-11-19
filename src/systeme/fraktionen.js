// Fraktionen und ihre Beziehungen (siehe docs/Architektur.md, Fraktionen).
// Daten (daten/fraktionen.js): name: { text, beziehungen?: { andereFraktion: "feind" | "neutral" | "verbuendet" } }
//   Eine Beziehung gilt in beide Richtungen; sagen beide Seiten etwas anderes, gewinnt die strengere
//   (feind vor neutral vor verbuendet). Gleiche Fraktion ist verbündet, "eigene:<nummer>" (Zwietracht) mit allen
//   verfeindet; fehlt eine Angabe, gilt regeln.fraktionen.beziehungVorgabe.
// Zorn: Wer ein neutrales Wesen angreift, macht es und alle Wesen seiner Fraktion, die die Angreiferin sehen,
//   ihr gegenüber feindlich; jedes merkt sich das einzeln in zornAuf: [IDs]. Zorn geht vor der Tabelle.
// Urheber in Abfragen: { id, fraktion }, damit eine schon entfernte Urheberin ihre Fraktion behält.

import { anmelden } from "../kern/register.js";
import { fraktionVon, entitaetenMitPosition, istWesen } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { sieht } from "./sicht.js";

export const BEZIEHUNGEN = ["feind", "neutral", "verbuendet"];
const STRENGE = { verbuendet: 0, neutral: 1, feind: 2 };

// Beziehung zwischen zwei Fraktionen (Namen); ohne Fraktion auf einer Seite neutral
export function beziehung(spiel, ersteFraktion, zweiteFraktion) {
  if (ersteFraktion == null || zweiteFraktion == null) return "neutral";
  if (ersteFraktion === zweiteFraktion) return "verbuendet";
  if (String(ersteFraktion).startsWith("eigene:") || String(zweiteFraktion).startsWith("eigene:")) return "feind";
  const tabelle = spiel.daten.fraktionen || {};
  const angaben = [tabelle[ersteFraktion]?.beziehungen?.[zweiteFraktion], tabelle[zweiteFraktion]?.beziehungen?.[ersteFraktion]].filter(Boolean);
  if (angaben.length === 0) return spiel.daten.regeln.fraktionen.beziehungVorgabe;
  return angaben.reduce((strengste, angabe) => (STRENGE[angabe] > STRENGE[strengste] ? angabe : strengste));
}

export const urheberVon = (entitaet) => ({ id: entitaet.id, fraktion: fraktionVon(entitaet) ?? null });

// Beziehung einer Urheberin ({ id, fraktion }) zu einer Entität, mit Zorn
export function beziehungZwischen(spiel, urheber, entitaet) {
  if (urheber.id != null && urheber.id === entitaet.id) return "verbuendet";
  const urheberEntitaet = urheber.id != null ? spiel.zustand.entitaeten[urheber.id] : null;
  if (entitaet.zornAuf?.includes(urheber.id) || urheberEntitaet?.zornAuf?.includes(entitaet.id)) return "feind";
  return beziehung(spiel, urheber.fraktion, fraktionVon(entitaet));
}

function zornMerken(wesen, angreiferinId) {
  if (!wesen.zornAuf) wesen.zornAuf = [];
  if (!wesen.zornAuf.includes(angreiferinId)) wesen.zornAuf.push(angreiferinId);
}

// Greift die Urheberin ein neutrales Wesen an, werden es und seine Fraktion in Sicht zornig
function zornPruefen(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const angreiferin = entitaeten[kontext.urheberId], ziel = entitaeten[kontext.zielId];
  // nur Wesen ziehen Zorn auf sich, keine Fallen oder Fässer
  if (!angreiferin || !ziel || angreiferin.id === ziel.id || !istWesen(angreiferin)) return;
  if (beziehungZwischen(spiel, urheberVon(angreiferin), ziel) !== "neutral") return;
  const fraktion = fraktionVon(ziel);
  zornMerken(ziel, angreiferin.id);
  for (const genosse of entitaetenMitPosition(spiel.zustand)) {
    if (genosse === ziel || genosse === angreiferin || fraktionVon(genosse) !== fraktion) continue;
    if (sieht(spiel, genosse, angreiferin)) zornMerken(genosse, angreiferin.id);
  }
  melden(spiel, "zorn", { wer: bezugAuf(ziel), auf: bezugAuf(angreiferin) });
}

for (const haken of ["nach_treffer", "verfehlt", "nach_schaden"]) anmelden("haken", haken, zornPruefen);
