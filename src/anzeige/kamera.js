// Kamera: Ausschnitt der Karte in Feldern, linke obere Ecke (x, y).
// Folgen mit Randabstand: bewegt sich erst, wenn das Ziel näher als ein Viertel des Ausschnitts
// an den Rand kommt. Am Levelrand bleibt sie stehen, kleinere Levels stehen mittig.
// Reiner Anzeige-Zustand, gehört nicht zum Spielzustand.

export function neueKamera() {
  return { x: 0, y: 0, gesetzt: false };
}

function achse(alt, gesetzt, pos, ansicht, level) {
  if (level <= ansicht) return -Math.floor((ansicht - level) / 2);
  const rand = Math.floor(ansicht / 4);
  let k = gesetzt ? alt : pos - Math.floor(ansicht / 2);
  if (pos < k + rand) k = pos - rand;
  if (pos > k + ansicht - 1 - rand) k = pos - (ansicht - 1 - rand);
  return Math.max(0, Math.min(level - ansicht, k));
}

// ansicht: { breite, hoehe } in Feldern; ebene: { breite, hoehe }
export function folgen(kamera, ziel, ansicht, ebene) {
  kamera.x = achse(kamera.x, kamera.gesetzt, ziel.x, ansicht.breite, ebene.breite);
  kamera.y = achse(kamera.y, kamera.gesetzt, ziel.y, ansicht.hoehe, ebene.hoehe);
  kamera.gesetzt = true;
}
