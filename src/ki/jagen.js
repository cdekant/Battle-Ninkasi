// Verhaltensmodul "jagen": sieht der Gegner Ninkasi, läuft er auf sie zu und greift an;
// verliert er sie aus den Augen, geht er zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", ziel: { x, y } | null }
// Sicht vereinfacht: Der Gegner sieht Ninkasi, wenn sie ihn sieht und er nah genug ist.

import AStar from "../../lib/rot/path/astar.js";
import { anmelden } from "../kern/register.js";
import { spieler, an } from "../kern/zustand.js";
import { passierbar, abstand } from "../welt/karte.js";
import { istSichtbar, sichtweite } from "../systeme/sicht.js";
import { istWesen } from "../systeme/kampf.js";
import { abwarten } from "./abwarten.js";

function naechsterSchritt(spiel, von, nach) {
  const weg = [];
  const astar = new AStar(nach.x, nach.y, (x, y) => passierbar(spiel, x, y), { topology: 8 });
  astar.compute(von.x, von.y, (x, y) => weg.push({ x, y }));
  return weg.length > 1 ? weg[1] : null;
}

anmelden("ki", "jagen", (spiel, ent) => {
  const z = spiel.zustand;
  const p = spieler(z);
  if (!p || z.vorbei) return abwarten();

  const pos = ent.position;
  if (istSichtbar(z, pos.x, pos.y) && abstand(pos, p.position) <= sichtweite(ent)) {
    ent.ki.ziel = { x: p.position.x, y: p.position.y };
  }
  const ziel = ent.ki.ziel;
  if (!ziel) return abwarten();
  if (ziel.x === pos.x && ziel.y === pos.y) {
    ent.ki.ziel = null;
    return abwarten();
  }

  const s = naechsterSchritt(spiel, pos, ziel);
  if (!s) return abwarten();
  const blocker = an(z, s.x, s.y).find(istWesen);
  if (blocker && blocker.id !== p.id) return abwarten();
  return { art: "bewegen", dx: s.x - pos.x, dy: s.y - pos.y };
});
