// Zeitstrahl und Warteschlange (siehe docs/Architektur.md, Zeitmodell).
// Einträge: { zeit, art: "weltuhr" | "ereignis" | "akteur", akteurId?, ereignistyp?, daten?, gebundenAn?, einreihungsnummer }
// gebundenAn: ID einer Entität; wird sie entfernt, entfällt das Zeitereignis mit ihr
// Gleichstand: zuerst Weltuhr, dann Zeitereignisse (nach Einreihung),
// dann Akteure nach Erzeugungsreihenfolge (Entitäts-ID).

export const WELTTICK = 100;

const RANG_NACH_ART = { weltuhr: 0, ereignis: 1, akteur: 2 };

function vergleichen(eintragA, eintragB) {
  if (eintragA.zeit !== eintragB.zeit) return eintragA.zeit - eintragB.zeit;
  if (RANG_NACH_ART[eintragA.art] !== RANG_NACH_ART[eintragB.art]) return RANG_NACH_ART[eintragA.art] - RANG_NACH_ART[eintragB.art];
  if (eintragA.art === "akteur") return eintragA.akteurId - eintragB.akteurId;
  return eintragA.einreihungsnummer - eintragB.einreihungsnummer;
}

export function einreihen(zustand, eintrag) {
  eintrag.einreihungsnummer = zustand.einreihungszaehler++;
  zustand.warteschlange.push(eintrag);
}

export function akteurEinreihen(zustand, akteurId, verzoegerung) {
  einreihen(zustand, { zeit: zustand.zeit + verzoegerung, art: "akteur", akteurId });
}

// Zeitereignis: ereignistyp ist ein Name im Register "zeitereignisse"
export function ereignisEinreihen(zustand, zeitpunkt, ereignistyp, daten = {}, gebundenAn = null) {
  const eintrag = { zeit: zeitpunkt, art: "ereignis", ereignistyp, daten };
  if (gebundenAn !== null) eintrag.gebundenAn = gebundenAn;
  einreihen(zustand, eintrag);
}

function indexDesErstenEintrags(zustand) {
  const warteschlange = zustand.warteschlange;
  let bester = -1;
  for (let i = 0; i < warteschlange.length; i++) {
    if (bester < 0 || vergleichen(warteschlange[i], warteschlange[bester]) < 0) bester = i;
  }
  return bester;
}

export function ersterEintrag(zustand) {
  const position = indexDesErstenEintrags(zustand);
  return position < 0 ? null : zustand.warteschlange[position];
}

// Nimmt den ersten Eintrag heraus und stellt die Uhr auf seinen Zeitpunkt
export function ersterEintragEntnehmen(zustand) {
  const position = indexDesErstenEintrags(zustand);
  if (position < 0) return null;
  const [eintrag] = zustand.warteschlange.splice(position, 1);
  zustand.zeit = eintrag.zeit;
  return eintrag;
}

export function akteurEntfernen(zustand, akteurId) {
  zustand.warteschlange = zustand.warteschlange.filter((eintrag) => !(eintrag.art === "akteur" && eintrag.akteurId === akteurId));
}

export function gebundeneEreignisseEntfernen(zustand, entitaetId) {
  zustand.warteschlange = zustand.warteschlange.filter((eintrag) => eintrag.gebundenAn !== entitaetId);
}
