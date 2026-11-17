// Effektsystem (siehe docs/Architektur.md, Effektsystem)
// Zusammengesetzte Effekte sind Daten: { schritte: [ { baustein: "schaden", wuerfel: "1W6" }, ... ] }
// Grundbausteine sind Code im Register "bausteine", siehe bausteine.js.
// Kontext: { quelleId, zielId, ursache?: "nahkampf" | "trinken" | ... }

import { holen } from "./register.js";
import { hakenAusloesen, melden, bezugAuf } from "./ereignisse.js";
import { wertBegrenztAendern, wertBegrenztAendernInHundertsteln } from "./werte.js";
import { entitaetEntfernen } from "./zustand.js";
import { akteurEntfernen } from "./zeit.js";

export function effektAnwenden(spiel, effektName, kontext) {
  const effekt = spiel.daten.effekte[effektName];
  if (!effekt) throw new Error(`Unbekannter Effekt "${effektName}"`);
  for (const schritt of effekt.schritte) {
    // Ziel kann zwischen Schritten sterben
    if (!spiel.zustand.entitaeten[kontext.zielId]) break;
    holen("bausteine", schritt.baustein)(spiel, kontext, schritt);
  }
}

// Wertänderungen laufen hierüber, damit der Haken "nach_wertaenderung" greift (z.B. Pegelschwellen)
export function wertAendern(spiel, entitaet, wertName, aenderung) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendern(entitaet, wertName, aenderung);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}

export function wertAendernInHundertsteln(spiel, entitaet, wertName, hundertstel) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendernInHundertsteln(entitaet, wertName, hundertstel);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}

export function toeten(spiel, entitaet, quelleId) {
  const zustand = spiel.zustand;
  const quelle = zustand.entitaeten[quelleId];
  melden(spiel, "tod", { opfer: bezugAuf(entitaet), quelle: quelle ? bezugAuf(quelle) : null });
  if (entitaet.id === zustand.spielerinId) {
    zustand.vorbei = true;
    akteurEntfernen(zustand, entitaet.id);
  } else {
    entitaetEntfernen(zustand, entitaet.id);
  }
}
