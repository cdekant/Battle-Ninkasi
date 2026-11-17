// Wegfindung für alle Wesen (KI und Reise der Spielerin), AStar aus rot.js mit acht Richtungen.
// Optionen:
//   nurErkundet: nur Felder, die Ninkasi schon gesehen hat (keine Hellseherei bei der Reise)
//   wesenMeiden: Felder mit Wesen gelten als versperrt (außer Start und Ziel)
// Später: Kosten je Gelände (Fallen meiden) gelten dann für KI und Spielerin zugleich.

import AStar from "../../lib/rot/path/astar.js";
import { passierbar, feldIndex } from "./karte.js";
import { entitaetenAuf } from "../kern/zustand.js";
import { istWesen } from "../systeme/kampf.js";

// Gibt die Felder des Weges ohne Startfeld zurück, [] wenn start = ziel, null wenn kein Weg
export function weg(spiel, start, ziel, { nurErkundet = false, wesenMeiden = false } = {}) {
  if (start.x === ziel.x && start.y === ziel.y) return [];
  const ebene = spiel.zustand.ebene;
  const feldBegehbar = (x, y) => {
    if (x === start.x && y === start.y) return true;
    if (!passierbar(spiel, x, y)) return false;
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
