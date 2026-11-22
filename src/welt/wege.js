// Wegfindung für alle Wesen (KI und Reise der Spielerin), AStar aus rot.js mit acht Richtungen.
// Optionen:
//   nurBekannt: nur Felder, deren Gelände Ninkasi kennt, und betretbar nach dem bekannten Gelände statt dem echten
//     (keine Hellseherei bei Reise und Erkunden, siehe systeme/erinnerung.js)
//   wesenMeiden: Felder mit Wesen gelten als versperrt (außer Start und Ziel)
//   bewegung: Bewegungsart, für die die Felder betretbar sein müssen (Vorgabe "laufend", siehe welt/karte.js)
//   oeffnetTueren: geschlossene Türen zählen als begehbar (Vorgabe true)
//   meiden: (x, y) => true für Felder, die der Weg meidet (außer Start und Ziel), z.B. bekannte Fallen
// Später: Kosten je Gelände (Fallen meiden) gelten dann für KI und Spielerin zugleich.

import AStar from "../../lib/rot/path/astar.js";
import { betretbarFuer, gelaendeBetretbarFuer, bekanntesGelaendeAuf, feldIndex, aufDerKarte } from "./karte.js";
import { entitaetenAuf, istWesen } from "../kern/zustand.js";

// Gibt die Felder des Weges ohne Startfeld zurück, [] wenn start = ziel, null wenn kein Weg
// Betretbar nach dem echten oder (nurBekannt) nach dem bekannten Gelände
function betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren) {
  if (!nurBekannt) return betretbarFuer(spiel, x, y, bewegung, oeffnetTueren);
  return gelaendeBetretbarFuer(spiel, bekanntesGelaendeAuf(spiel, x, y), bewegung, oeffnetTueren);
}

export function weg(spiel, start, ziel, { nurBekannt = false, wesenMeiden = false, bewegung = "laufend", oeffnetTueren = true, meiden = null } = {}) {
  if (start.x === ziel.x && start.y === ziel.y) return [];
  const feldBegehbar = (x, y) => {
    if (x === start.x && y === start.y) return true;
    if (!betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren)) return false;
    const istZiel = x === ziel.x && y === ziel.y;
    if (wesenMeiden && !istZiel && entitaetenAuf(spiel.zustand, x, y).some(istWesen)) return false;
    if (meiden && !istZiel && meiden(x, y)) return false;
    return true;
  };
  if (!feldBegehbar(ziel.x, ziel.y)) return null;
  const wegfelder = [];
  new AStar(ziel.x, ziel.y, feldBegehbar, { topology: 8 }).compute(start.x, start.y, (x, y) => wegfelder.push({ x, y }));
  return wegfelder.length ? wegfelder.slice(1) : null;
}

// Erstes Feld des Weges, null wenn kein Weg oder schon am Ziel
export function naechstesWegfeld(spiel, start, ziel, optionen) {
  const wegfelder = weg(spiel, start, ziel, optionen);
  return wegfelder && wegfelder.length ? wegfelder[0] : null;
}

const NACHBARN = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Nächstes begehbares Feld (Breitensuche in Schritten, ohne den Start), für das passt(x, y) gilt; null, wenn keins.
// Nachbarn in fester Reihenfolge, bei gleichem Abstand gewinnt das zuerst gefundene. nurBekannt und bewegung wie bei weg.
// Die Suche geht nur über Felder, die für die Bewegungsart betretbar sind (mitStart: auch der Start selbst wird geprüft).
export function naechstesFeldMit(spiel, start, passt, { nurBekannt = false, bewegung = "laufend", oeffnetTueren = true, mitStart = false } = {}) {
  if (mitStart && passt(start.x, start.y)) return { x: start.x, y: start.y };
  const ebene = spiel.zustand.ebene;
  const besucht = new Set([feldIndex(ebene, start.x, start.y)]);
  const warteliste = [start];
  for (let kopf = 0; kopf < warteliste.length; kopf++) {
    const feld = warteliste[kopf];
    for (const [dx, dy] of NACHBARN) {
      const x = feld.x + dx, y = feld.y + dy;
      if (!aufDerKarte(ebene, x, y)) continue;
      const index = feldIndex(ebene, x, y);
      if (besucht.has(index)) continue;
      besucht.add(index);
      if (!betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren)) continue;
      if (passt(x, y)) return { x, y };
      warteliste.push({ x, y });
    }
  }
  return null;
}

// Feld mit einem Nachbarn, den Ninkasi nie gesehen hat (auch wenn er kartiert ist): dort geht es weiter ins Unerkundete
export function amRandDesErkundeten(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  return NACHBARN.some(([dx, dy]) => aufDerKarte(ebene, x + dx, y + dy) && !ebene.erkundet[feldIndex(ebene, x + dx, y + dy)]);
}
