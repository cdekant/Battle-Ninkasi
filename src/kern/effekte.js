// Effektsystem (siehe docs/Architektur.md, Effektsystem)
// Zusammengesetzte Effekte sind Daten: { schritte: [ { baustein: "schaden", wuerfel: "1W6" }, ... ] }
// Grundbausteine sind Code im Register "bausteine", siehe bausteine.js.
// Kontext: { quelle: id, ziel: id, art?: "nahkampf" | ... }

import { holen } from "./register.js";
import { haken, melden, bezug } from "./ereignisse.js";
import { aendern, aendernHundertstel } from "./werte.js";
import { entfernen } from "./zustand.js";
import { akteurEntfernen } from "./zeit.js";

export function anwenden(spiel, effektName, kontext) {
  const effekt = spiel.daten.effekte[effektName];
  if (!effekt) throw new Error(`Unbekannter Effekt "${effektName}"`);
  for (const schritt of effekt.schritte) {
    // Ziel kann zwischen Schritten sterben
    if (!spiel.zustand.entitaeten[kontext.ziel]) break;
    holen("bausteine", schritt.baustein)(spiel, kontext, schritt);
  }
}

// Wertänderungen laufen hierüber, damit der Haken "nach_wertaenderung" greift (z.B. Pegelschwellen)
export function wertAendern(spiel, ent, name, delta) {
  const vorher = ent.werte[name].aktuell;
  const geaendert = aendern(ent, name, delta);
  if (geaendert !== 0) haken(spiel, "nach_wertaenderung", { ent, name, vorher, nachher: ent.werte[name].aktuell });
  return geaendert;
}

export function wertAendernHundertstel(spiel, ent, name, hundertstel) {
  const vorher = ent.werte[name].aktuell;
  const geaendert = aendernHundertstel(ent, name, hundertstel);
  if (geaendert !== 0) haken(spiel, "nach_wertaenderung", { ent, name, vorher, nachher: ent.werte[name].aktuell });
  return geaendert;
}

export function toeten(spiel, ent, quelleId) {
  const z = spiel.zustand;
  const quelle = z.entitaeten[quelleId];
  melden(spiel, "tod", { opfer: bezug(ent), quelle: quelle ? bezug(quelle) : null });
  if (ent.id === z.spielerId) {
    z.vorbei = true;
    akteurEntfernen(z, ent.id);
  } else {
    entfernen(z, ent.id);
  }
}
