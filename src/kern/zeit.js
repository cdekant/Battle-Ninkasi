// Zeitstrahl und Warteschlange (siehe docs/Architektur.md, Zeitmodell).
// Einträge: { zeit, art: "weltuhr" | "ereignis" | "akteur", akteurId?, ereignistyp?, daten?, gebundenAn?, einreihungsnummer }
// gebundenAn: ID einer Entität; wird sie entfernt, entfällt das Zeitereignis mit ihr
// Gleichstand: zuerst Weltuhr, dann Zeitereignisse (nach Einreihung),
// dann Akteure nach Erzeugungsreihenfolge (Entitäts-ID).
// Die Warteschlange ist ein binärer Heap im Array (bleibt JSON): der erste Eintrag liegt vorn, Einreihen und
// Entnehmen kosten log n. Die Ordnung ist vollständig (die Einreihungsnummer ist eindeutig), die Reihenfolge der
// Entnahme hängt also nicht vom Aufbau des Heaps ab. Wer die Warteschlange liest, darf sie nicht umordnen.

export const WELTTICK = 100;

const RANG_NACH_ART = { weltuhr: 0, ereignis: 1, akteur: 2 };

function vergleichen(eintragA, eintragB) {
  if (eintragA.zeit !== eintragB.zeit) return eintragA.zeit - eintragB.zeit;
  if (RANG_NACH_ART[eintragA.art] !== RANG_NACH_ART[eintragB.art]) return RANG_NACH_ART[eintragA.art] - RANG_NACH_ART[eintragB.art];
  if (eintragA.art === "akteur") return eintragA.akteurId - eintragB.akteurId;
  return eintragA.einreihungsnummer - eintragB.einreihungsnummer;
}

function tauschen(heap, erste, zweite) {
  const zwischen = heap[erste];
  heap[erste] = heap[zweite];
  heap[zweite] = zwischen;
}

function aufsteigen(heap, stelle) {
  while (stelle > 0) {
    const eltern = (stelle - 1) >> 1;
    if (vergleichen(heap[stelle], heap[eltern]) >= 0) return;
    tauschen(heap, stelle, eltern);
    stelle = eltern;
  }
}

function absinken(heap, stelle) {
  for (;;) {
    const links = 2 * stelle + 1, rechts = links + 1;
    let kleinste = stelle;
    if (links < heap.length && vergleichen(heap[links], heap[kleinste]) < 0) kleinste = links;
    if (rechts < heap.length && vergleichen(heap[rechts], heap[kleinste]) < 0) kleinste = rechts;
    if (kleinste === stelle) return;
    tauschen(heap, stelle, kleinste);
    stelle = kleinste;
  }
}

// Baut den Heap aus einem beliebig geordneten Array neu auf (nach dem Herausfiltern von Einträgen)
function heapAufbauen(heap) {
  for (let stelle = (heap.length >> 1) - 1; stelle >= 0; stelle--) absinken(heap, stelle);
  return heap;
}

export function einreihen(zustand, eintrag) {
  eintrag.einreihungsnummer = zustand.einreihungszaehler++;
  zustand.warteschlange.push(eintrag);
  aufsteigen(zustand.warteschlange, zustand.warteschlange.length - 1);
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

export function ersterEintrag(zustand) {
  return zustand.warteschlange[0] ?? null;
}

// Nimmt den ersten Eintrag heraus und stellt die Uhr auf seinen Zeitpunkt
export function ersterEintragEntnehmen(zustand) {
  const heap = zustand.warteschlange;
  if (!heap.length) return null;
  const eintrag = heap[0];
  const letzter = heap.pop();
  if (heap.length) {
    heap[0] = letzter;
    absinken(heap, 0);
  }
  zustand.zeit = eintrag.zeit;
  return eintrag;
}

// Entfernen ist selten (Tod, Entfernen einer Entität): filtern und den Heap neu aufbauen, nur wenn sich etwas ändert
function entfernenWo(zustand, trifftZu) {
  if (!zustand.warteschlange.some(trifftZu)) return;
  zustand.warteschlange = heapAufbauen(zustand.warteschlange.filter((eintrag) => !trifftZu(eintrag)));
}

export function akteurEntfernen(zustand, akteurId) {
  entfernenWo(zustand, (eintrag) => eintrag.art === "akteur" && eintrag.akteurId === akteurId);
}

// Schiebt den Eintrag einer Akteurin um verzoegerung nach hinten (Betäubung, systeme/betaeubung.js); gibt den neuen
// Zeitpunkt zurück oder null, wenn sie gerade keinen Eintrag hat (sie handelt in diesem Moment)
export function akteurVerschieben(zustand, akteurId, verzoegerung) {
  const eintrag = zustand.warteschlange.find((kandidat) => kandidat.art === "akteur" && kandidat.akteurId === akteurId);
  if (!eintrag) return null;
  eintrag.zeit += verzoegerung;
  heapAufbauen(zustand.warteschlange);
  return eintrag.zeit;
}

// Entfernt die an eine Entität gebundenen Zeitereignisse, mit ereignistyp nur die dieses Typs
export function gebundeneEreignisseEntfernen(zustand, entitaetId, ereignistyp = null) {
  entfernenWo(zustand, (eintrag) => eintrag.gebundenAn === entitaetId && (ereignistyp === null || eintrag.ereignistyp === ereignistyp));
}

// Nimmt alle Einträge heraus, auf die trifftZu passt, und gibt sie zurück (Wechsel der Ebene, systeme/ebenen.js)
export function eintraegeHerausnehmen(zustand, trifftZu) {
  const herausgenommen = zustand.warteschlange.filter(trifftZu);
  if (herausgenommen.length) zustand.warteschlange = heapAufbauen(zustand.warteschlange.filter((eintrag) => !trifftZu(eintrag)));
  return herausgenommen;
}

// Fügt früher herausgenommene Einträge wieder ein, mit ihrer Einreihungsnummer (die Reihenfolge bleibt so erhalten)
export function eintraegeEinfuegen(zustand, eintraege) {
  if (!eintraege.length) return;
  zustand.warteschlange = heapAufbauen([...zustand.warteschlange, ...eintraege]);
}

// Ob die Warteschlange ein gültiger Heap ist (Bot, Tests)
export function warteschlangeGueltig(zustand) {
  const heap = zustand.warteschlange;
  for (let stelle = 1; stelle < heap.length; stelle++) {
    if (vergleichen(heap[stelle], heap[(stelle - 1) >> 1]) < 0) return false;
  }
  return true;
}
