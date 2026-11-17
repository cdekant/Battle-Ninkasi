// Kamera: Ausschnitt der Karte in Feldern, linke obere Ecke (x, y).
// Folgen mit Randabstand: bewegt sich erst, wenn das Ziel näher als ein Viertel des Ausschnitts
// an den Rand kommt. Am Levelrand bleibt sie stehen, kleinere Levels stehen mittig.
// Reiner Anzeige-Zustand, gehört nicht zum Spielzustand.

export function neueKamera() {
  return { x: 0, y: 0, gesetzt: false };
}

// Kameraposition auf einer Achse (x oder y)
function kameraAufAchse(bisherigeKamera, gesetzt, zielKoordinate, ausschnittGroesse, ebenenGroesse) {
  if (ebenenGroesse <= ausschnittGroesse) return -Math.floor((ausschnittGroesse - ebenenGroesse) / 2);
  const randabstand = Math.floor(ausschnittGroesse / 4);
  let kamera = gesetzt ? bisherigeKamera : zielKoordinate - Math.floor(ausschnittGroesse / 2);
  if (zielKoordinate < kamera + randabstand) kamera = zielKoordinate - randabstand;
  if (zielKoordinate > kamera + ausschnittGroesse - 1 - randabstand) kamera = zielKoordinate - (ausschnittGroesse - 1 - randabstand);
  return Math.max(0, Math.min(ebenenGroesse - ausschnittGroesse, kamera));
}

// ansicht: { breite, hoehe } in Feldern; ebene: { breite, hoehe }
export function folgen(kamera, ziel, ansicht, ebene) {
  kamera.x = kameraAufAchse(kamera.x, kamera.gesetzt, ziel.x, ansicht.breite, ebene.breite);
  kamera.y = kameraAufAchse(kamera.y, kamera.gesetzt, ziel.y, ansicht.hoehe, ebene.hoehe);
  kamera.gesetzt = true;
}
