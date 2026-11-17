// Zugriff auf die Karte der aktuellen Ebene.
// zustand.ebene = { name, breite, hoehe, felder: ["####..", ...], erkundet: [0, 1, ...] }
// Ein Feld ist ein Zeichen, die Kennung eines Geländes aus daten/gelaende.js.

export function feldIndex(ebene, x, y) {
  return y * ebene.breite + x;
}

export function aufDerKarte(ebene, x, y) {
  return x >= 0 && y >= 0 && x < ebene.breite && y < ebene.hoehe;
}

// Geländename zu einer Kennung, Nachschlagetabelle liegt außerhalb des Zustands
function gelaendeNamenNachKennung(spiel) {
  if (!spiel.zwischenspeicher.gelaendeNamen) {
    spiel.zwischenspeicher.gelaendeNamen = {};
    for (const [name, gelaende] of Object.entries(spiel.daten.gelaende)) spiel.zwischenspeicher.gelaendeNamen[gelaende.kennung] = name;
  }
  return spiel.zwischenspeicher.gelaendeNamen;
}

export function gelaendeName(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, x, y)) return null;
  return gelaendeNamenNachKennung(spiel)[ebene.felder[y][x]];
}

export function gelaendeAuf(spiel, x, y) {
  const name = gelaendeName(spiel, x, y);
  return name ? spiel.daten.gelaende[name] : null;
}

export function passierbar(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  return Boolean(gelaende && gelaende.passierbar);
}

export function durchsichtig(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  return Boolean(gelaende && gelaende.durchsichtig);
}

// Schachbrett-Abstand (acht Richtungen, Diagonale zählt 1)
export function abstand(feldA, feldB) {
  return Math.max(Math.abs(feldA.x - feldB.x), Math.abs(feldA.y - feldB.y));
}
