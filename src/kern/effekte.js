// Effektsystem (siehe docs/Wirkungen.md, Effektsystem)
// Zusammengesetzte Effekte sind Daten: { schritte: [ { baustein: "schaden", wuerfel: "1W6" }, ... ], tags? }
// Grundbausteine sind Code im Register "bausteine", siehe bausteine.js und systeme/zielbausteine.js.
// Kontext: { quelleId, urheberId, urheberFraktion, zielId, ursprung, zielfeld, ursache, kettentiefe, mittel, tags, kritisch, werte }
//   quelleId:    wirkt unmittelbar (Wesen, Fass, Geschoss, Falle)
//   urheberId:   wird die Wirkung zugerechnet (EP, Zorn, Todesursache), Vorgabe die Quelle, bei Beschworenen
//                deren Beschwörerin (beschworenVon);
//                urheberFraktion bleibt erhalten, auch wenn die Urheberin schon entfernt ist
//   zielId:      das Wesen, auf das ein Schritt wirkt, oder null (Wirkung auf ein Feld)
//   ursprung:    Feld, von dem Muster ausgehen, Vorgabe die Position der Quelle
//   zielfeld:    anvisiertes Feld, Vorgabe die Position des Ziels
//   ursache:     "nahkampf" | "trinken" | "ausloeser" | ...
//   kettentiefe: 0 für Befehle und Welt, je Auslöser eine Stufe mehr (siehe kern/ausloeser.js)
//   mittel:      { art: "angriff" | "faehigkeit" | "gegenstand" | "zustand" | "falle" | "gelaende", name } oder null
//   tags:        z.B. ["feuer", "magie"]; die Tags des Effekts kommen dazu
//   kritisch:    true, wenn ein Trefferwurf kritisch war (systeme/kampf.js); verschachtelte Effekte erben es
//   trefferchance: Prozent des Trefferwurfs davor (nur für die Meldung schaden), sonst nicht gesetzt
//   werte:       Ablage zwischen Schritten, über alle Verschachtelungen eines Effekts geteilt
//                (summeSchaden, anzahlZiele, getroffeneIds, sprungnummer)
// Ein Baustein mit brauchtZiel wird übersprungen, wenn das Ziel (bei auf: "quelle" die Quelle) fehlt; der Effekt läuft weiter.
// Getötet wird hier nicht: Fällt der Lebenswert auf 0, stirbt das Wesen in der Zustandsprüfung
// nach dem Vorgang (systeme/tod.js); dafür merkt sich das Wesen, wem der Verlust zuzurechnen ist.

import { holen } from "./register.js";
import { fraktionVon } from "./zustand.js";
import { hakenAusloesen } from "./ereignisse.js";
import { wertBegrenztAendern, wertBegrenztAendernInHundertsteln, lebenswertName } from "./werte.js";

const feldKopie = (feld) => (feld ? { x: feld.x, y: feld.y } : null);

// Ergänzt die Vorgaben; werte bleibt dasselbe Objekt, damit verschachtelte Effekte es teilen
export function kontextVervollstaendigen(spiel, kontext, effekt = {}) {
  const entitaeten = spiel.zustand.entitaeten;
  const quelle = entitaeten[kontext.quelleId], ziel = entitaeten[kontext.zielId];
  const quelleId = kontext.quelleId ?? null;
  const urheberId = kontext.urheberId ?? quelle?.beschworenVon ?? quelleId;
  const ursprung = kontext.ursprung ?? feldKopie(quelle?.position) ?? feldKopie(ziel?.position);
  const tags = [...(kontext.tags || [])];
  for (const tag of effekt.tags || []) if (!tags.includes(tag)) tags.push(tag);
  return {
    ...kontext,
    quelleId,
    urheberId,
    urheberFraktion: kontext.urheberFraktion !== undefined ? kontext.urheberFraktion : fraktionVon(entitaeten[urheberId]) ?? fraktionVon(quelle) ?? null,
    zielId: kontext.zielId ?? null,
    ursprung,
    zielfeld: kontext.zielfeld ?? feldKopie(ziel?.position) ?? ursprung,
    ursache: kontext.ursache ?? null,
    kettentiefe: kontext.kettentiefe ?? 0,
    mittel: kontext.mittel ?? null,
    tags,
    kritisch: kontext.kritisch ?? false,
    ...(kontext.trefferchance !== undefined && { trefferchance: kontext.trefferchance }),
    werte: kontext.werte ?? {},
  };
}

export function effektAnwenden(spiel, effektName, kontext) {
  const effekt = spiel.daten.effekte[effektName];
  if (!effekt) throw new Error(`Unbekannter Effekt "${effektName}"`);
  const vollerKontext = kontextVervollstaendigen(spiel, kontext, effekt);
  for (const schritt of effekt.schritte) {
    const baustein = holen("bausteine", schritt.baustein);
    const wirktAufId = schritt.auf === "quelle" ? vollerKontext.quelleId : vollerKontext.zielId;
    if (baustein.brauchtZiel && !spiel.zustand.entitaeten[wirktAufId]) continue;
    baustein(spiel, vollerKontext, schritt);
  }
}

// Beteiligte eines Effekts für den Kontext von Haken
export function beteiligteAus(kontext) {
  return {
    quelleId: kontext.quelleId ?? null,
    urheberId: kontext.urheberId ?? kontext.quelleId ?? null,
    zielId: kontext.zielId ?? null,
    ursache: kontext.ursache ?? null,
    kettentiefe: kontext.kettentiefe ?? 0,
    mittel: kontext.mittel ?? null,
    tags: kontext.tags ?? [],
    kritisch: kontext.kritisch ?? false,
    ...(kontext.trefferchance !== undefined && { trefferchance: kontext.trefferchance }),
  };
}

// Ursprung einer Wertänderung aus einem Effektkontext: wem zugerechnet, warum, womit, auf welcher Kettenstufe
export function ursprungAus(kontext) {
  return { urheberId: kontext.urheberId ?? kontext.quelleId ?? null, ursache: kontext.ursache ?? null, mittel: kontext.mittel ? { ...kontext.mittel } : null, kettentiefe: kontext.kettentiefe ?? 0 };
}

// Sinkt der Lebenswert, merkt sich das Wesen den Ursprung für Todesursache und Auslöser
function verlustMerken(entitaet, wertName, geaendert, ursprung) {
  if (geaendert < 0 && wertName === lebenswertName(entitaet) && ursprung) entitaet.letzterVerlust = { ...ursprung };
}

// Wertänderungen laufen hierüber, damit der Haken "nach_wertaenderung" greift (z.B. Pegelschwellen)
// ursprung (optional): { urheberId, ursache, mittel, kettentiefe }, siehe ursprungAus
export function wertAendern(spiel, entitaet, wertName, aenderung, ursprung = null) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendern(spiel, entitaet, wertName, aenderung);
  verlustMerken(entitaet, wertName, geaendert, ursprung);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}

export function wertAendernInHundertsteln(spiel, entitaet, wertName, hundertstel, ursprung = null) {
  const vorher = entitaet.werte[wertName].aktuell;
  const geaendert = wertBegrenztAendernInHundertsteln(spiel, entitaet, wertName, hundertstel);
  verlustMerken(entitaet, wertName, geaendert, ursprung);
  if (geaendert !== 0) hakenAusloesen(spiel, "nach_wertaenderung", { entitaet, wertName, vorher, nachher: entitaet.werte[wertName].aktuell });
  return geaendert;
}
