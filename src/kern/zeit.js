// Zeitstrahl und Warteschlange (siehe docs/Architektur.md, Zeitmodell).
// Einträge: { zeit, art: "weltuhr" | "ereignis" | "akteur", id?, nr, ... }
// Gleichstand: zuerst Weltuhr, dann Zeitereignisse (nach Einreihung),
// dann Akteure nach Erzeugungsreihenfolge (Entitäts-ID).

export const WELTTICK = 100;

const RANG = { weltuhr: 0, ereignis: 1, akteur: 2 };

function vergleichen(a, b) {
  if (a.zeit !== b.zeit) return a.zeit - b.zeit;
  if (RANG[a.art] !== RANG[b.art]) return RANG[a.art] - RANG[b.art];
  if (a.art === "akteur") return a.id - b.id;
  return a.nr - b.nr;
}

export function einreihen(zustand, eintrag) {
  eintrag.nr = zustand.zeitzaehler++;
  zustand.warteschlange.push(eintrag);
}

export function akteurEinreihen(zustand, id, verzoegerung) {
  einreihen(zustand, { zeit: zustand.zeit + verzoegerung, art: "akteur", id });
}

// Zeitereignis: typ ist ein Name im Register "zeitereignisse"
export function ereignisEinreihen(zustand, zeitpunkt, typ, daten = {}) {
  einreihen(zustand, { zeit: zeitpunkt, art: "ereignis", typ, daten });
}

function indexDesErsten(zustand) {
  const q = zustand.warteschlange;
  let best = -1;
  for (let i = 0; i < q.length; i++) {
    if (best < 0 || vergleichen(q[i], q[best]) < 0) best = i;
  }
  return best;
}

export function erster(zustand) {
  const i = indexDesErsten(zustand);
  return i < 0 ? null : zustand.warteschlange[i];
}

// Nimmt den ersten Eintrag heraus und stellt die Uhr auf seinen Zeitpunkt
export function entnehmen(zustand) {
  const i = indexDesErsten(zustand);
  if (i < 0) return null;
  const [eintrag] = zustand.warteschlange.splice(i, 1);
  zustand.zeit = eintrag.zeit;
  return eintrag;
}

export function akteurEntfernen(zustand, id) {
  zustand.warteschlange = zustand.warteschlange.filter((e) => !(e.art === "akteur" && e.id === id));
}
