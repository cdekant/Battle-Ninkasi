// Wahrnehmbarkeit von Meldungen für Ninkasi (siehe docs/Anzeige.md, Anzeige): reine Lesefunktionen für das Log,
// ändern nichts und würfeln nicht. Eine Meldung ist wahrnehmbar, wenn
//   Ninkasi beteiligt ist (in einem der BEZUGSFELDER), außer bei Meldungen in NUR_SICHT, oder
//   ein beteiligter Bezug mit Ort (bezugAuf merkt sich die Position) oder ein Feld der Meldung (ursprung, aufschlag,
//   bahn, felder) gerade sichtbar ist, oder
//   die Meldung gar keinen Ort hat (Pegel, Hinweise, Erkennen im eigenen Gepäck).
// Hören: eine Meldung "laerm", deren Lärm Ninkasis Feld erreicht (spielerinHoert) und deren Ursprung sie nicht sieht,
// gibt sie als Geräusch mit grober Richtung wieder, nie mit dem, was dort geschieht.

import { istSichtbar } from "./sicht.js";

const BEZUGSFELDER = ["wer", "ziel", "quelle", "opfer", "was", "mit", "auf", "traegerin", "vorher"];
const ORTSFELDER = ["ursprung", "aufschlag"];
const FELDLISTEN = ["bahn", "felder"];
// Meldungen, bei denen Ninkasis Beteiligung nicht reicht: dass ein Ungesehenes sie bemerkt, merkt sie nicht
const NUR_SICHT = ["bemerkt"];

// Himmelsrichtungen im Uhrzeigersinn ab Osten in Schritten von 45 Grad (y wächst nach Süden)
const RICHTUNGEN = ["o", "no", "n", "nw", "w", "sw", "s", "so"];

const istBezug = (wert) => wert !== null && typeof wert === "object" && "id" in wert;

export function meldungWahrnehmbar(spiel, meldung) {
  const zustand = spiel.zustand;
  const bezuege = BEZUGSFELDER.map((feldName) => meldung[feldName]).filter(istBezug);
  const istNinkasi = (bezug) => bezug.id === zustand.spielerinId;
  if (!NUR_SICHT.includes(meldung.art) && bezuege.some(istNinkasi)) return true;
  // Ninkasis eigener Ort zählt nicht als gesehen, sonst reichte ihre Beteiligung doch
  const orte = bezuege.filter((bezug) => bezug.ort && !istNinkasi(bezug)).map((bezug) => bezug.ort);
  for (const feldName of ORTSFELDER) if (meldung[feldName]) orte.push(meldung[feldName]);
  for (const feldName of FELDLISTEN) if (Array.isArray(meldung[feldName])) orte.push(...meldung[feldName]);
  if (!orte.length) return true;
  return orte.some((ort) => istSichtbar(zustand, ort.x, ort.y));
}

// Grobe Richtung von einem Feld zum anderen ("n", "no", ... "nw") oder null auf demselben Feld
export function richtungZu(von, nach) {
  const dx = nach.x - von.x, dy = nach.y - von.y;
  if (dx === 0 && dy === 0) return null;
  const sektor = Math.round(Math.atan2(-dy, dx) / (Math.PI / 4));
  return RICHTUNGEN[(sektor + 8) % 8];
}

// Was Ninkasi von einer Meldung hört: { geraeusch, richtung } oder null (nicht gehört oder ohnehin gesehen)
export function geraeuschGehoert(spiel, meldung) {
  if (meldung.art !== "laerm" || !meldung.spielerinHoert) return null;
  const zustand = spiel.zustand;
  if (istSichtbar(zustand, meldung.ursprung.x, meldung.ursprung.y)) return null;
  const ninkasi = zustand.entitaeten[zustand.spielerinId];
  if (!ninkasi?.position) return null;
  return { geraeusch: meldung.geraeusch ?? "sonstiges", richtung: richtungZu(ninkasi.position, meldung.ursprung) };
}
