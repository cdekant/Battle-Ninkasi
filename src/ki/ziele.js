// Zielwahl für Verhaltensmodule: das nächste sichtbare Wesen, das nach trifft ein Ziel ist.
// Sehen siehe systeme/sicht.js (sieht), trifft siehe systeme/zielauswahl.js, aus Sicht des Wesens selbst.

import { fraktionVon } from "../kern/zustand.js";
import { lebenswertName } from "../kern/werte.js";
import { abstandQuadrat } from "../welt/geometrie.js";
import { trifftZu } from "../systeme/zielauswahl.js";
import { sieht, kandidatenInSicht } from "../systeme/sicht.js";

function lebt(entitaet) {
  const lebenswert = entitaet.werte?.[lebenswertName(entitaet)];
  return !lebenswert || lebenswert.aktuell > 0;
}

export function istZielFuer(spiel, betrachter, kandidat, trifft) {
  return kandidat.id !== betrachter.id && trifftZu(spiel, trifft, { id: betrachter.id, fraktion: fraktionVon(betrachter) ?? null }, kandidat);
}

// Nächstes Ziel nach Abstand (dx² + dy²), bei Gleichstand nach Entitäts-ID; null, wenn keins zu sehen ist
// passt (freiwillig): weitere Bedingung an den Kandidaten, z.B. innerhalb der Spurweite
export function naechstesSichtbaresZiel(spiel, betrachter, trifft = "feinde", passt = () => true) {
  let bestes = null, besterAbstand = Infinity;
  for (const kandidat of kandidatenInSicht(spiel, betrachter)) {
    if (!kandidat.position || !lebt(kandidat) || !istZielFuer(spiel, betrachter, kandidat, trifft)) continue;
    if (!sieht(spiel, betrachter, kandidat) || !passt(kandidat)) continue;
    const kandidatAbstand = abstandQuadrat(betrachter.position, kandidat.position);
    if (kandidatAbstand < besterAbstand) {
      bestes = kandidat;
      besterAbstand = kandidatAbstand;
    }
  }
  return bestes;
}
