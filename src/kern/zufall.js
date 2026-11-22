// Zufall mit Startwert, nur ganze Zahlen.
// Verfahren: sfc32 (Small Fast Counter, Chris Doty-Humphrey), Startwert über splitmix32.
// Der Zufallszustand ist ein Array aus vier 32-Bit-Zahlen und damit als JSON speicherbar.
// Jede Änderung an diesem Modul ändert die Zahlenfolge und macht Spielstände ungültig.
// Die kurzen Namen in splitmix32 und sfc32 folgen den Referenzumsetzungen der Verfahren.

function splitmix32(x) {
  x = (x + 0x9e3779b9) | 0;
  let z = x;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  z ^= z >>> 16;
  return [x, z >>> 0];
}

// Neuer Zufallszustand aus einem Startwert (ganze Zahl 0 bis 2^32-1)
export function zufallErzeugen(startwert) {
  let splitmixZustand = startwert >>> 0;
  const zufallszustand = [];
  for (let i = 0; i < 4; i++) {
    let zahl;
    [splitmixZustand, zahl] = splitmix32(splitmixZustand);
    zufallszustand.push(zahl);
  }
  for (let i = 0; i < 12; i++) naechsteZufallszahl(zufallszustand);
  return zufallszustand;
}

// Nächste Zahl 0 bis 2^32-1 (Verfahren sfc32); verändert den Zufallszustand
export function naechsteZufallszahl(zufallszustand) {
  let [a, b, c, d] = zufallszustand;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  zufallszustand[0] = a; zufallszustand[1] = b; zufallszustand[2] = c; zufallszustand[3] = d;
  return t >>> 0;
}

// Ganze Zahl von min bis max (beide eingeschlossen), ohne Verzerrung
export function zufallsGanzzahl(zufallszustand, min, max) {
  const spanne = max - min + 1;
  if (spanne <= 1) return min;
  const grenze = 0x100000000 - (0x100000000 % spanne);
  let zahl;
  do { zahl = naechsteZufallszahl(zufallszustand); } while (zahl >= grenze);
  return min + (zahl % spanne);
}

// true mit einer Wahrscheinlichkeit von prozent (0 bis 100)
export function mitProzentChance(zufallszustand, prozent) {
  return zufallsGanzzahl(zufallszustand, 1, 100) <= prozent;
}

// true mit einer Wahrscheinlichkeit von zaehler / nenner (ganze Zahlen, nenner > 0), exakt ohne Rundung;
// sichere Fälle (zaehler <= 0 oder >= nenner) würfeln nicht
export function mitAnteil(zufallszustand, zaehler, nenner) {
  if (zaehler <= 0) return false;
  if (zaehler >= nenner) return true;
  return zufallsGanzzahl(zufallszustand, 0, nenner - 1) < zaehler;
}

// Zerlegt einen Würfelausdruck in { anzahl, seiten, zuschlag } (ein fester Wert hat anzahl 0); wirft bei ungültigen
function wuerfelausdruckZerlegen(ausdruck) {
  const treffer = /^\s*(?:(\d+)\s*[wWdD]\s*(\d+))?\s*([+-]\s*\d+)?\s*$/.exec(String(ausdruck));
  if (!treffer || (!treffer[1] && !treffer[3])) {
    const festwert = Number(ausdruck);
    if (Number.isInteger(festwert)) return { anzahl: 0, seiten: 0, zuschlag: festwert };
    throw new Error(`Ungültiger Würfelausdruck "${ausdruck}"`);
  }
  const [, anzahlText, seitenText, zuschlagText] = treffer;
  return {
    anzahl: anzahlText ? Number(anzahlText) : 0,
    seiten: anzahlText ? Number(seitenText) : 0,
    zuschlag: zuschlagText ? Number(zuschlagText.replace(/\s/g, "")) : 0,
  };
}

// Würfelausdruck wie "2W6", "1W6+2", "1W4-1", "5"
export function wuerfeln(zufallszustand, ausdruck) {
  const { anzahl, seiten, zuschlag } = wuerfelausdruckZerlegen(ausdruck);
  let summe = 0;
  for (let i = 0; i < anzahl; i++) summe += zufallsGanzzahl(zufallszustand, 1, seiten);
  return summe + zuschlag;
}

// Kleinster und größter Wurf eines Würfelausdrucks, ohne zu würfeln: { kleinster, groesster }
// (ein Würfel mit 0 Seiten zeigt wie in zufallsGanzzahl immer 1)
export function wuerfelSpanne(ausdruck) {
  const { anzahl, seiten, zuschlag } = wuerfelausdruckZerlegen(ausdruck);
  return { kleinster: anzahl + zuschlag, groesster: anzahl * Math.max(1, seiten) + zuschlag };
}

// Prüft einen Würfelausdruck, ohne zu würfeln (für die Datenprüfung)
export function istWuerfelausdruck(ausdruck) {
  if (Number.isInteger(ausdruck)) return true;
  return /^\s*(\d+\s*[wWdD]\s*\d+)?\s*([+-]\s*\d+)?\s*$/.test(String(ausdruck)) && String(ausdruck).trim() !== "";
}

// Abgeleiteter Startwert aus Lauf-Startwert und Kennung (z.B. "ebene.1"), FNV-1a
export function startwertAbleiten(startwert, kennung) {
  let hashwert = 0x811c9dc5 ^ (startwert >>> 0);
  const text = String(kennung);
  for (let i = 0; i < text.length; i++) {
    hashwert ^= text.charCodeAt(i);
    hashwert = Math.imul(hashwert, 0x01000193);
  }
  return splitmix32(hashwert)[1];
}
