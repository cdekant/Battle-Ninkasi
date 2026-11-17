// Zugriff auf die Karte der aktuellen Ebene.
// zustand.ebene = { name, breite, hoehe, felder: ["####..", ...], erkundet: [0, 1, ...] }
// Ein Feld ist ein Zeichen, die Kennung eines Geländes aus daten/gelaende.js.

export function index(ebene, x, y) {
  return y * ebene.breite + x;
}

export function imLevel(ebene, x, y) {
  return x >= 0 && y >= 0 && x < ebene.breite && y < ebene.hoehe;
}

// Geländename zu einer Kennung, Nachschlagetabelle liegt außerhalb des Zustands
function nachKennung(spiel) {
  if (!spiel.cache.gelaende) {
    spiel.cache.gelaende = {};
    for (const [name, g] of Object.entries(spiel.daten.gelaende)) spiel.cache.gelaende[g.kennung] = name;
  }
  return spiel.cache.gelaende;
}

export function gelaendeName(spiel, x, y) {
  const e = spiel.zustand.ebene;
  if (!imLevel(e, x, y)) return null;
  return nachKennung(spiel)[e.felder[y][x]];
}

export function gelaende(spiel, x, y) {
  const name = gelaendeName(spiel, x, y);
  return name ? spiel.daten.gelaende[name] : null;
}

export function passierbar(spiel, x, y) {
  const g = gelaende(spiel, x, y);
  return Boolean(g && g.passierbar);
}

export function durchsichtig(spiel, x, y) {
  const g = gelaende(spiel, x, y);
  return Boolean(g && g.durchsichtig);
}

// Schachbrett-Abstand (acht Richtungen, Diagonale zählt 1)
export function abstand(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
