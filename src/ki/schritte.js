// Schrittwahl für Verhaltensmodule.

import { betretbar } from "../welt/karte.js";
import { bewegungVon } from "../kern/zustand.js";
import { ACHT_RICHTUNGEN, abstandQuadrat, wesenAufFeld } from "../welt/geometrie.js";

// Schritt weg von einer Position: das freie Nachbarfeld mit dem größten Abstand (dx² + dy²), bei Gleichstand das
// erste in fester Richtungsfolge; null, wenn keins weiter weg ist oder das Wesen unbeweglich ist. Gibt { dx, dy } zurück.
// Nur Felder, die das Wesen mit seiner Bewegungsart betreten kann.
export function schrittWeg(spiel, wesen, vonPosition) {
  if (bewegungVon(wesen) === "unbeweglich") return null;
  const position = wesen.position;
  let besteRichtung = null, besterAbstand = abstandQuadrat(position, vonPosition);
  for (const richtung of ACHT_RICHTUNGEN) {
    const feld = { x: position.x + richtung.dx, y: position.y + richtung.dy };
    if (!betretbar(spiel, wesen, feld) || wesenAufFeld(spiel, feld).length) continue;
    const feldAbstand = abstandQuadrat(feld, vonPosition);
    if (feldAbstand > besterAbstand) {
      besteRichtung = richtung;
      besterAbstand = feldAbstand;
    }
  }
  return besteRichtung ? { dx: besteRichtung.dx, dy: besteRichtung.dy } : null;
}
