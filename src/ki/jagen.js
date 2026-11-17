// Verhaltensmodul "jagen": sieht der Gegner Ninkasi, läuft er auf sie zu und greift an;
// verliert er sie aus den Augen, geht er zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", ziel: { x, y } | null }
// Sicht vereinfacht: Der Gegner sieht Ninkasi, wenn sie ihn sieht und er nah genug ist.

import { anmelden } from "../kern/register.js";
import { spieler, an } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { naechsterSchritt } from "../welt/wege.js";
import { istSichtbar, sichtweite } from "../systeme/sicht.js";
import { istWesen } from "../systeme/kampf.js";
import { abwarten } from "./abwarten.js";

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
