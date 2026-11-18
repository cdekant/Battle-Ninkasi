// Kurven aus Stützpunkten: [[stelle, wert], ...], aufsteigend nach der Stelle, nur ganze Zahlen.
// Zwischen zwei Stützpunkten linear verbunden, einheitlich gerundet wie prozentVon (Math.round);
// vor dem ersten und hinter dem letzten Stützpunkt gleichbleibend.
// Beispiel: Regeneration über dem Pegel, [[0, 30], [150, 80], [400, 30]].

export function wertAufKurve(stuetzpunkte, stelle) {
  const [ersteStelle, ersterWert] = stuetzpunkte[0];
  if (stelle <= ersteStelle) return ersterWert;
  for (let i = 1; i < stuetzpunkte.length; i++) {
    const [rechteStelle, rechterWert] = stuetzpunkte[i];
    if (stelle > rechteStelle) continue;
    const [linkeStelle, linkerWert] = stuetzpunkte[i - 1];
    const anstieg = Math.round(((rechterWert - linkerWert) * (stelle - linkeStelle)) / (rechteStelle - linkeStelle));
    return linkerWert + anstieg + 0; // + 0 macht aus -0 eine 0
  }
  return stuetzpunkte[stuetzpunkte.length - 1][1];
}

// Stelle des höchsten Werts (bei Gleichstand die erste), z.B. das Optimum einer Regenerationskurve
export function stelleDesHoechstwerts(stuetzpunkte) {
  let beste = stuetzpunkte[0];
  for (const stuetzpunkt of stuetzpunkte) if (stuetzpunkt[1] > beste[1]) beste = stuetzpunkt;
  return beste[0];
}

// Prüft eine Kurve für die Datenprüfung, gibt eine Liste von Fehlern zurück
export function kurvenfehler(stuetzpunkte, ort) {
  if (!Array.isArray(stuetzpunkte) || stuetzpunkte.length === 0) return [`${ort}: Kurve braucht mindestens einen Stützpunkt`];
  const fehler = [];
  stuetzpunkte.forEach((stuetzpunkt, nummer) => {
    const istPaar = Array.isArray(stuetzpunkt) && stuetzpunkt.length === 2 && stuetzpunkt.every(Number.isInteger);
    if (!istPaar) return fehler.push(`${ort}[${nummer}]: Stützpunkt muss [stelle, wert] aus ganzen Zahlen sein`);
    const vorgaenger = stuetzpunkte[nummer - 1];
    if (nummer > 0 && Array.isArray(vorgaenger) && stuetzpunkt[0] <= vorgaenger[0]) {
      fehler.push(`${ort}[${nummer}]: Stellen müssen streng aufsteigen`);
    }
  });
  return fehler;
}
