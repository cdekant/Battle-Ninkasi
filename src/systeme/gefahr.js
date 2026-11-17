// Gefahrenprüfung: reine Lesefunktionen, verändern nichts und benutzen keinen Zufall.
// Eine Lage ist ein Schnappschuss der für Gefahr wichtigen Werte; zwei Lagen werden verglichen.
// Genutzt von der Reise per Maus, später auch von langen Aktionen (Brauen).
// Neue Prüfungen meldet man im Register "gefahren" an.

import { anmelden, hat, holen } from "../kern/register.js";
import { alle, spieler } from "../kern/zustand.js";
import { feindlich } from "./kampf.js";
import { istSichtbar } from "./sicht.js";

// Feinde, die Ninkasi gerade sieht (IDs aufsteigend)
export function sichtbareFeinde(spiel) {
  const z = spiel.zustand;
  const p = spieler(z);
  return alle(z)
    .filter((e) => e.position && feindlich(p, e) && istSichtbar(z, e.position.x, e.position.y))
    .map((e) => e.id);
}

export function lage(spiel) {
  const p = spieler(spiel.zustand);
  return { feinde: sichtbareFeinde(spiel), lp: p.werte.lp.aktuell };
}

// Ein Feind ist in Sicht gekommen, der vorher nicht sichtbar war
anmelden("gefahren", "gegner_in_sicht", (vorher, nachher) => nachher.feinde.some((id) => !vorher.feinde.includes(id)));

// Ninkasi hat LP verloren
anmelden("gefahren", "schaden", (vorher, nachher) => nachher.lp < vorher.lp);

// Gibt den Namen der ersten zutreffenden Prüfung aus der Liste zurück, sonst null
export function pruefen(vorher, nachher, namen) {
  for (const name of namen) {
    if (hat("gefahren", name) && holen("gefahren", name)(vorher, nachher)) return name;
  }
  return null;
}
