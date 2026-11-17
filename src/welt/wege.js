// Wegfindung für alle Wesen (KI und Reise der Spielerin), AStar aus rot.js mit acht Richtungen.
// Optionen:
//   nurErkundet: nur Felder, die Ninkasi schon gesehen hat (keine Hellseherei bei der Reise)
//   wesenMeiden: Felder mit Wesen gelten als versperrt (außer Start und Ziel)
// Später: Kosten je Gelände (Fallen meiden) gelten dann für KI und Spielerin zugleich.

import AStar from "../../lib/rot/path/astar.js";
import { passierbar, index } from "./karte.js";
import { an } from "../kern/zustand.js";
import { istWesen } from "../systeme/kampf.js";

// Gibt die Felder des Weges ohne Startfeld zurück, [] wenn von = nach, null wenn kein Weg
export function weg(spiel, von, nach, { nurErkundet = false, wesenMeiden = false } = {}) {
  if (von.x === nach.x && von.y === nach.y) return [];
  const e = spiel.zustand.ebene;
  const frei = (x, y) => {
    if (x === von.x && y === von.y) return true;
    if (!passierbar(spiel, x, y)) return false;
    if (nurErkundet && !e.erkundet[index(e, x, y)]) return false;
    if (wesenMeiden && !(x === nach.x && y === nach.y) && an(spiel.zustand, x, y).some(istWesen)) return false;
    return true;
  };
  if (!frei(nach.x, nach.y)) return null;
  const felder = [];
  new AStar(nach.x, nach.y, frei, { topology: 8 }).compute(von.x, von.y, (x, y) => felder.push({ x, y }));
  return felder.length ? felder.slice(1) : null;
}

export function naechsterSchritt(spiel, von, nach, optionen) {
  const w = weg(spiel, von, nach, optionen);
  return w && w.length ? w[0] : null;
}
