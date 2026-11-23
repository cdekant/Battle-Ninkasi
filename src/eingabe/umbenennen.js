// Umbenennungen anwenden (siehe docs/Architektur.md, Speichern): Namen aus der Ablage außerhalb des Laufs (Chronik,
// letzte Verteilung der Eigenschaften) folgen der Tabelle in daten/umbenennungen.js. Nur die Oberfläche wendet sie an,
// die Logik liest sie nie. Ohne DOM und ohne localStorage, damit es testbar ist.
//   umbenennungen: { <art>: { <alter Name>: <neuer Name> | null } }, null heißt entfernt: der Name bleibt, wie er ist
// Ketten (a wird b, b wird c) folgen bis zum Ende; ein Kreis in der Tabelle wirft.

export function nameNachUmbenennung(umbenennungen, art, name) {
  const tabelle = umbenennungen?.[art] ?? {};
  const besucht = new Set([name]);
  let aktuell = name;
  while (typeof tabelle[aktuell] === "string") {
    aktuell = tabelle[aktuell];
    if (besucht.has(aktuell)) throw new Error(`Umbenennungen von ${art} im Kreis bei ${aktuell}`);
    besucht.add(aktuell);
  }
  return aktuell;
}

// Schlüssel eines Objekts umbenennen; treffen zwei auf denselben neuen Namen, entscheidet zusammenfuehren(alt, neu)
export function schluesselUmbenennen(objekt, umbenennungen, art, zusammenfuehren = (_, neu) => neu) {
  const ergebnis = {};
  for (const [name, wert] of Object.entries(objekt)) {
    const neuerName = nameNachUmbenennung(umbenennungen, art, name);
    ergebnis[neuerName] = Object.hasOwn(ergebnis, neuerName) ? zusammenfuehren(ergebnis[neuerName], wert) : wert;
  }
  return ergebnis;
}

// Letzte Verteilung der Eigenschaften ({ name: zahl }) mit umbenannten Eigenschaften; anderes bleibt, wie es ist
export function eigenschaftenUmbenennen(verteilung, umbenennungen) {
  if (!verteilung || typeof verteilung !== "object" || Array.isArray(verteilung)) return verteilung;
  return schluesselUmbenennen(verteilung, umbenennungen, "eigenschaften");
}
