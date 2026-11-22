// Zugriff auf die Karte der aktuellen Ebene.
// zustand.ebene = { name, breite, hoehe, felder: ["####..", ...], erkundet: [0, 1, ...] }
// Ein Feld ist ein Zeichen, die Kennung eines Geländes aus daten/gelaende.js.
// Bewegungsarten (am Wesen: bewegung, Vorgabe "laufend"; Zustände überlagern sie, kern/zustand.js bewegungVon):
//   passierbar: true      Gelände für alle Bewegungsarten
//   passierbarFuer: [...]  zusätzlich für diese Arten, z.B. Abgrund für fliegend, Wasser für fliegend und schwebend
//   phasend betritt jedes Gelände außer undurchdringlich: true (und nichts außerhalb der Karte)
//   unbeweglich steht, wo laufend stehen kann, bewegt sich aber nicht (systeme/bewegung.js)
//   fest: Gelände, das für keine Art außer phasend passierbar ist (Wand); dort prallt ein Stoß auf
// Türen (systeme/gelaende.js): tuer: { offen: Gelände } an der geschlossenen Tür; wer Türen öffnet (am Wesen
//   tueren: "oeffnen", Vorgabe, oder "nicht"), betritt sie, als wäre sie schon offen
// Geschosse fliegen durch, was durchsichtig ist, außer geschossdurchlaessig: false; mit geschossdurchlaessig: true
//   auch durch Undurchsichtiges (welt/geometrie.js flugbahn)

import { bewegungVon } from "../kern/zustand.js";

export function feldIndex(ebene, x, y) {
  return y * ebene.breite + x;
}

export function aufDerKarte(ebene, x, y) {
  return x >= 0 && y >= 0 && x < ebene.breite && y < ebene.hoehe;
}

// Geländename zu einer Kennung, Nachschlagetabelle liegt außerhalb des Zustands
function gelaendeNamenNachKennung(spiel) {
  if (!spiel.zwischenspeicher.gelaendeNamen) {
    spiel.zwischenspeicher.gelaendeNamen = {};
    for (const [name, gelaende] of Object.entries(spiel.daten.gelaende)) spiel.zwischenspeicher.gelaendeNamen[gelaende.kennung] = name;
  }
  return spiel.zwischenspeicher.gelaendeNamen;
}

export function gelaendeName(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, x, y)) return null;
  return gelaendeNamenNachKennung(spiel)[ebene.felder[y][x]];
}

export function gelaendeAuf(spiel, x, y) {
  const name = gelaendeName(spiel, x, y);
  return name ? spiel.daten.gelaende[name] : null;
}

export function passierbar(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  return Boolean(gelaende && gelaende.passierbar);
}

export const BEWEGUNGSARTEN = ["laufend", "fliegend", "schwebend", "phasend", "unbeweglich"];

function gelaendeBetretbar(gelaende, bewegungsart) {
  if (bewegungsart === "phasend") return !gelaende.undurchdringlich;
  if (gelaende.passierbar) return true;
  return bewegungsart !== "unbeweglich" && (gelaende.passierbarFuer || []).includes(bewegungsart);
}

// Ob ein Feld für eine Bewegungsart betretbar ist (ohne Rücksicht auf Wesen darauf); eine geschlossene Tür zählt
// wie die offene, wenn oeffnetTueren gilt
export function betretbarFuer(spiel, x, y, bewegungsart = "laufend", oeffnetTueren = true) {
  return gelaendeBetretbarFuer(spiel, gelaendeAuf(spiel, x, y), bewegungsart, oeffnetTueren);
}

// Wie betretbarFuer, aber für ein Gelände statt eines Felds (z.B. beim Erzeugen, bevor die Ebene im Zustand steht)
export function gelaendeBetretbarFuer(spiel, gelaende, bewegungsart = "laufend", oeffnetTueren = true) {
  if (!gelaende) return false;
  if (gelaendeBetretbar(gelaende, bewegungsart)) return true;
  const offen = oeffnetTueren && gelaende.tuer?.offen ? spiel.daten.gelaende[gelaende.tuer.offen] : null;
  return Boolean(offen) && gelaendeBetretbar(offen, bewegungsart);
}

export function oeffnetTueren(wesen) {
  return (wesen.tueren ?? "oeffnen") === "oeffnen";
}

// Ob ein Wesen mit seiner wirksamen Bewegungsart das Feld betreten (oder darauf stehen) kann
export function betretbar(spiel, wesen, feld) {
  return betretbarFuer(spiel, feld.x, feld.y, bewegungVon(wesen), oeffnetTueren(wesen));
}

// Festes Gelände (oder außerhalb der Karte): für niemanden passierbar außer phasend
export function fest(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  return !gelaende || (!gelaende.passierbar && !(gelaende.passierbarFuer || []).length);
}

export function durchsichtig(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  return Boolean(gelaende && gelaende.durchsichtig);
}

// Ob ein Geschoss das Feld durchfliegen kann: Vorgabe wie durchsichtig, abweichend mit geschossdurchlaessig
export function geschossdurchlaessig(spiel, x, y) {
  const gelaende = gelaendeAuf(spiel, x, y);
  if (!gelaende) return false;
  return gelaende.geschossdurchlaessig ?? Boolean(gelaende.durchsichtig);
}

// Schachbrett-Abstand (acht Richtungen, Diagonale zählt 1)
export function abstand(feldA, feldB) {
  return Math.max(Math.abs(feldA.x - feldB.x), Math.abs(feldA.y - feldB.y));
}
