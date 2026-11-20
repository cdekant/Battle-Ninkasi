// Angekündigte Angriffe in der Anzeige: die Zielfelder der langen Aktionen sichtbarer Wesen, deren Fähigkeit
// eine ankuendigung hat (siehe systeme/faehigkeiten.js). Wird beim Zeichnen aus dem Zustand berechnet, nichts
// wird gespeichert; liest nur.

import { alleEntitaeten } from "../kern/zustand.js";
import { istSichtbar } from "../systeme/sicht.js";
import { faehigkeitFuer } from "../systeme/faehigkeiten.js";
import { zielAufloesen } from "../systeme/zielauswahl.js";

// Felder [{ x, y }] ohne Doppelte, in der Reihenfolge der Wesen nach Entitäts-ID
export function angekuendigteFelder(spiel) {
  const zustand = spiel.zustand;
  const gesehen = new Set();
  const felder = [];
  for (const wesen of alleEntitaeten(zustand)) {
    const aktion = wesen.laufendeAktion;
    if (wesen.id === zustand.spielerinId || aktion?.art !== "faehigkeit" || !wesen.position) continue;
    if (!istSichtbar(zustand, wesen.position.x, wesen.position.y)) continue;
    const definition = faehigkeitFuer(spiel, wesen, aktion.faehigkeit);
    if (!definition?.ankuendigung || !definition.ziel) continue;
    const aufloesung = zielAufloesen(spiel, wesen, definition.ziel, aktion.ziel ?? undefined);
    if (!aufloesung.ok) continue;
    for (const feld of aufloesung.felder) {
      const schluessel = `${feld.x},${feld.y}`;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      felder.push({ x: feld.x, y: feld.y });
    }
  }
  return felder;
}
