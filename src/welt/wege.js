// Wegfindung für alle Wesen (KI und Reise der Spielerin), AStar aus rot.js mit acht Richtungen.
// Optionen:
//   nurErkundet: nur Felder, die Ninkasi schon gesehen hat (keine Hellseherei bei der Reise)
//   wesenMeiden: Felder mit Wesen gelten als versperrt (außer Start und Ziel)
//   bewegung: Bewegungsart, für die die Felder betretbar sein müssen (Vorgabe "laufend", siehe welt/karte.js)
// Später: Kosten je Gelände (Fallen meiden) gelten dann für KI und Spielerin zugleich.

import AStar from "../../lib/rot/path/astar.js";
import { betretbarFuer, feldIndex, aufDerKarte } from "./karte.js";
import { entitaetenAuf, istWesen } from "../kern/zustand.js";

// Gibt die Felder des Weges ohne Startfeld zurück, [] wenn start = ziel, null wenn kein Weg
export function weg(spiel, start, ziel, { nurErkundet = false, wesenMeiden = false, bewegung = "laufend" } = {}) {
  if (start.x === ziel.x && start.y === ziel.y) return [];
  const ebene = spiel.zustand.ebene;
  const feldBegehbar = (x, y) => {
    if (x === start.x && y === start.y) return true;
    if (!betretbarFuer(spiel, x, y, bewegung)) return false;
    if (nurErkundet && !ebene.erkundet[feldIndex(ebene, x, y)]) return false;
    const istZiel = x === ziel.x && y === ziel.y;
    if (wesenMeiden && !istZiel && entitaetenAuf(spiel.zustand, x, y).some(istWesen)) return false;
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
// Nachbarn in fester Reihenfolge, bei gleichem Abstand gewinnt das zuerst gefundene. nurErkundet und bewegung wie bei weg.
// Die Suche geht nur über Felder, die für die Bewegungsart betretbar sind (mitStart: auch der Start selbst wird geprüft).
export function naechstesFeldMit(spiel, start, passt, { nurErkundet = false, bewegung = "laufend", mitStart = false } = {}) {
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
      if (!betretbarFuer(spiel, x, y, bewegung) || (nurErkundet && !ebene.erkundet[index])) continue;
      if (passt(x, y)) return { x, y };
      warteliste.push({ x, y });
    }
  }
  return null;
}

// Erkundetes Feld mit einem unerkundeten Nachbarn: dort geht es weiter ins Unbekannte
export function amRandDesErkundeten(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  return NACHBARN.some(([dx, dy]) => aufDerKarte(ebene, x + dx, y + dy) && !ebene.erkundet[feldIndex(ebene, x + dx, y + dy)]);
}
