// Anzeige des Pegels: Text in Promille und Lage auf der logarithmischen Leiste.
// Reine Rechnung ohne DOM, getestet in tests/pegelanzeige.test.js.
// Der Pegel zählt in Hundertstel Promille (100 = 1 ‰).

// Teilstriche der Leiste in Verdopplungsschritten, gleich breit: 0, 0,5, 1, 2, 4, 8, 16 ‰
export const TEILSTRICHE = [0, 50, 100, 200, 400, 800, 1600];

// "2,35 ‰", "1,5 ‰", "1,0 ‰", "0,25 ‰": mindestens eine, höchstens zwei Nachkommastellen
export function promilleText(pegel) {
  const betrag = Math.abs(pegel);
  const ganzzahl = Math.trunc(betrag / 100);
  const hundertstel = String(betrag % 100).padStart(2, "0");
  const nachkomma = hundertstel.endsWith("0") ? hundertstel[0] : hundertstel;
  return `${pegel < 0 ? "-" : ""}${ganzzahl},${nachkomma} ‰`;
}

// Lage eines Pegels auf der Leiste von 0 bis 1; über dem letzten Teilstrich voll
export function leistenanteil(pegel) {
  const abschnitte = TEILSTRICHE.length - 1;
  if (pegel <= 0) return 0;
  for (let i = 1; i < TEILSTRICHE.length; i++) {
    if (pegel <= TEILSTRICHE[i]) {
      const imAbschnitt = (pegel - TEILSTRICHE[i - 1]) / (TEILSTRICHE[i] - TEILSTRICHE[i - 1]);
      return (i - 1 + imAbschnitt) / abschnitte;
    }
  }
  return 1;
}
