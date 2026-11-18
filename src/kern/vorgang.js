// Abschluss eines Vorgangs (siehe docs/Architektur.md, Tod und Zustandsprüfung).
// Ein Vorgang ist ein ausgeführter Befehl, ein Handler der Weltuhr oder ein Zeitereignis.
// Danach laufen abwechselnd alle Zustandsprüfungen (z.B. Tod) und der nächste vorgemerkte Auslöser,
// bis nichts mehr ansteht; so wirkt eine Flächenwirkung auf alle Ziele, bevor das erste stirbt.

import { alle } from "./register.js";
import { anstehendeAusloeser, naechstenAusloeserAusfuehren } from "./ausloeser.js";

const HOECHSTE_DURCHLAEUFE = 100000;

export function vorgangAbschliessen(spiel) {
  for (let durchlauf = 0; durchlauf < HOECHSTE_DURCHLAEUFE; durchlauf++) {
    let geaendert = false;
    for (const [, pruefung] of alle("zustandspruefungen")) {
      if (pruefung(spiel)) geaendert = true;
    }
    // Spiel vorbei: anstehende Auslöser verfallen
    if (spiel.zustand.vorbei) {
      anstehendeAusloeser(spiel).length = 0;
      return;
    }
    if (naechstenAusloeserAusfuehren(spiel)) geaendert = true;
    if (!geaendert) return;
  }
  throw new Error("Vorgang kommt nicht zum Abschluss");
}
