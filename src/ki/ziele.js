// Zielwahl für Verhaltensmodule: das nächste wahrgenommene Wesen, das nach trifft ein Ziel ist.
// Wahrnehmen siehe systeme/sinne.js (gesehen oder gespürt), trifft siehe systeme/zielauswahl.js, aus Sicht des Wesens selbst.

import { fraktionVon } from "../kern/zustand.js";
import { lebenswertName } from "../kern/werte.js";
import { abstandQuadrat } from "../welt/geometrie.js";
import { trifftZu } from "../systeme/zielauswahl.js";
import { nimmtWahr, kandidatenWahrnehmbar } from "../systeme/sinne.js";

function lebt(entitaet) {
  const lebenswert = entitaet.werte?.[lebenswertName(entitaet)];
  return !lebenswert || lebenswert.aktuell > 0;
}

export function istZielFuer(spiel, betrachter, kandidat, trifft) {
  return kandidat.id !== betrachter.id && trifftZu(spiel, trifft, { id: betrachter.id, fraktion: fraktionVon(betrachter) ?? null }, kandidat);
}

// Nächstes Ziel nach Abstand (dx² + dy²), bei Gleichstand nach Entitäts-ID; null, wenn keins wahrgenommen wird
// passt (freiwillig): weitere Bedingung an den Kandidaten, z.B. innerhalb der Spurweite
export function naechstesWahrgenommenesZiel(spiel, betrachter, trifft = "feinde", passt = () => true) {
  let bestes = null, besterAbstand = Infinity;
  for (const kandidat of kandidatenWahrnehmbar(spiel, betrachter)) {
    if (!kandidat.position || !lebt(kandidat) || !istZielFuer(spiel, betrachter, kandidat, trifft)) continue;
    const kandidatAbstand = abstandQuadrat(betrachter.position, kandidat.position);
    if (kandidatAbstand >= besterAbstand || !passt(kandidat) || !nimmtWahr(spiel, betrachter, kandidat)) continue;
    bestes = kandidat;
    besterAbstand = kandidatAbstand;
  }
  return bestes;
}
