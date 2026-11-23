// Prüfsumme der Daten (siehe docs/Architektur.md, Zufall und Wiederholbarkeit): ein 32-Bit-FNV-1a-Wert über die
// JSON-Form, als Hex-Text mit acht Stellen. Die Daten sind Objekte mit fester Reihenfolge der Schlüssel und ohne
// Funktionen, ihre JSON-Form ist darum stabil. Nur ganze Zahlen, auch in Node.

const FNV_ANFANG = 0x811c9dc5;
const FNV_FAKTOR = 0x01000193;

export function pruefsummeBerechnen(wert) {
  const text = JSON.stringify(wert) ?? "";
  let summe = FNV_ANFANG;
  for (let i = 0; i < text.length; i++) {
    summe ^= text.charCodeAt(i);
    summe = Math.imul(summe, FNV_FAKTOR);
  }
  return (summe >>> 0).toString(16).padStart(8, "0");
}
