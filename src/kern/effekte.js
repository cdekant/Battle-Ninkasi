// Effektsystem (siehe docs/Architektur.md, Effektsystem)
// Zusammengesetzte Effekte sind Daten: { schritte: [ { baustein: "schaden", wuerfel: "1W6" }, ... ] }
// Grundbausteine sind Code im Register "bausteine", siehe bausteine.js.
// Kontext: { quelleId, zielId, ursache?: "nahkampf" | "trinken" | "ausloeser" | ..., kettentiefe?: 0 }
//   kettentiefe: 0 für Befehle und Welt, je Auslöser eine Stufe mehr (siehe kern/ausloeser.js)
// Getötet wird hier nicht: Fällt der Lebenswert auf 0, stirbt das Wesen in der Zustandsprüfung
// nach dem Vorgang (systeme/tod.js); dafür merkt sich das Wesen, wer den Wert zuletzt gesenkt hat.

import { holen } from "./register.js";
import { hakenAusloesen } from "./ereignisse.js";
import { wertBegrenztAendern, wertBegrenztAendernInHundertsteln, lebenswertName } from "./werte.js";

export function effektAnwenden(spiel, effektName, kontext) {
  const effekt = spiel.daten.effekte[effektName];
  if (!effekt) throw new Error(`Unbekannter Effekt "${effektName}"`);
  for (const schritt of effekt.schritte) {
    if (!spiel.zustand.entitaeten[kontext.zielId]) break;
    holen("bausteine", schritt.baustein)(spiel, kontext, schritt);
  }
}

// Ursprung einer Wertänderung aus einem Effektkontext: wer, warum, auf welcher Kettenstufe
export function ursprungAus(kontext) {
  return { urheberId: kontext.quelleId ?? null, ursache: kontext.ursache ?? null, kettentiefe: kontext.kettentiefe ?? 0 };
}

// Sinkt der Lebenswert, merkt sich das Wesen den Ursprung für Todesursache und Auslöser
function verlustMerken(entitaet, wertName, geaendert, ursprung) {
  if (geaendert < 0 && wertName === lebenswertName(entitaet) && ursprung) entitaet.letzterVerlust = { ...ursprung };
}

// Wertänderungen laufen hierüber, damit der Haken "nach_wertaenderung" greift (z.B. Pegelschwellen)
// ursprung (optional): { urheberId, ursache, kettentiefe }, siehe ursprungAus
export function wertAendern(spiel, entitaet, wertName, aenderung, ursprung = null) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendern(entitaet, wertName, aenderung);
  verlustMerken(entitaet, wertName, geaendert, ursprung);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}

export function wertAendernInHundertsteln(spiel, entitaet, wertName, hundertstel, ursprung = null) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendernInHundertsteln(entitaet, wertName, hundertstel);
  verlustMerken(entitaet, wertName, geaendert, ursprung);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}
