// Schrittwahl für Verhaltensmodule.

import { passierbar } from "../welt/karte.js";
import { ACHT_RICHTUNGEN, abstandQuadrat, wesenAufFeld } from "../welt/geometrie.js";

// Schritt weg von einer Position: das freie Nachbarfeld mit dem größten Abstand (dx² + dy²), bei Gleichstand das
// erste in fester Richtungsfolge; null, wenn keins weiter weg ist. Gibt { dx, dy } zurück.
export function schrittWeg(spiel, wesen, vonPosition) {
  const position = wesen.position;
  let besteRichtung = null, besterAbstand = abstandQuadrat(position, vonPosition);
  for (const richtung of ACHT_RICHTUNGEN) {
    const feld = { x: position.x + richtung.dx, y: position.y + richtung.dy };
    if (!passierbar(spiel, feld.x, feld.y) || wesenAufFeld(spiel, feld).length) continue;
    const feldAbstand = abstandQuadrat(feld, vonPosition);
    if (feldAbstand > besterAbstand) {
      besteRichtung = richtung;
      besterAbstand = feldAbstand;
    }
  }
  return besteRichtung ? { dx: besteRichtung.dx, dy: besteRichtung.dy } : null;
}
