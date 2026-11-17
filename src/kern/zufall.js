// Zufall mit Startwert, nur ganze Zahlen.
// Verfahren: sfc32 (Small Fast Counter, Chris Doty-Humphrey), Startwert über splitmix32.
// Der Zustand ist ein Array aus vier 32-Bit-Zahlen und damit als JSON speicherbar.
// Jede Änderung an diesem Modul ändert die Zahlenfolge und macht Spielstände ungültig.

function splitmix32(x) {
  x = (x + 0x9e3779b9) | 0;
  let z = x;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  z ^= z >>> 16;
  return [x, z >>> 0];
}

// Neuer Zufallszustand aus einem Startwert (ganze Zahl 0 bis 2^32-1)
export function erzeugen(startwert) {
  let x = startwert >>> 0;
  const s = [];
  for (let i = 0; i < 4; i++) {
    let z;
    [x, z] = splitmix32(x);
    s.push(z);
  }
  for (let i = 0; i < 12; i++) naechste(s);
  return s;
}

// Nächste Zahl 0 bis 2^32-1; verändert den Zustand s
export function naechste(s) {
  let [a, b, c, d] = s;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  s[0] = a; s[1] = b; s[2] = c; s[3] = d;
  return t >>> 0;
}

// Ganze Zahl von min bis max (beide eingeschlossen), ohne Verzerrung
export function ganzzahl(s, min, max) {
  const spanne = max - min + 1;
  if (spanne <= 1) return min;
  const grenze = 0x100000000 - (0x100000000 % spanne);
  let z;
  do { z = naechste(s); } while (z >= grenze);
  return min + (z % spanne);
}

// true mit einer Wahrscheinlichkeit von prozent (0 bis 100)
export function chance(s, prozent) {
  return ganzzahl(s, 1, 100) <= prozent;
}

// Würfelausdruck wie "2W6", "1W6+2", "1W4-1", "5"
export function wuerfeln(s, ausdruck) {
  const m = /^\s*(?:(\d+)\s*[wWdD]\s*(\d+))?\s*([+-]\s*\d+)?\s*$/.exec(String(ausdruck));
  if (!m || (!m[1] && !m[3])) {
    const n = Number(ausdruck);
    if (Number.isInteger(n)) return n;
    throw new Error(`Ungültiger Würfelausdruck "${ausdruck}"`);
  }
  let summe = 0;
  if (m[1]) {
    const anzahl = Number(m[1]), seiten = Number(m[2]);
    for (let i = 0; i < anzahl; i++) summe += ganzzahl(s, 1, seiten);
  }
  if (m[3]) summe += Number(m[3].replace(/\s/g, ""));
  return summe;
}

// Prüft einen Würfelausdruck, ohne zu würfeln (für die Datenprüfung)
export function istWuerfelausdruck(ausdruck) {
  if (Number.isInteger(ausdruck)) return true;
  return /^\s*(\d+\s*[wWdD]\s*\d+)?\s*([+-]\s*\d+)?\s*$/.test(String(ausdruck)) && String(ausdruck).trim() !== "";
}

// Abgeleiteter Startwert aus Lauf-Startwert und Kennung (z.B. "ebene.1"), FNV-1a
export function ableiten(startwert, kennung) {
  let h = 0x811c9dc5 ^ (startwert >>> 0);
  const text = String(kennung);
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return splitmix32(h)[1];
}
