// Kampfzustand (siehe docs/Wesen.md, Kampfzustand).
// Greift ein Wesen ein anderes an (Treffer, Fehlschlag, Schaden), merken sich beide den Zeitpunkt in kampfZuletzt.
// Im Kampf ist ein Wesen, solange seitdem weniger als regeln.kampf.nachwirkung vergangen ist; ein Zeitstempel statt
// eines Zeitereignisses, damit nichts ablaufen muss. Fallen und Fässer bringen niemanden in den Kampf.

import { anmelden } from "../kern/register.js";
import { istWesen } from "../kern/zustand.js";

export function imKampf(spiel, wesen) {
  if (wesen?.kampfZuletzt == null) return false;
  return spiel.zustand.zeit - wesen.kampfZuletzt < spiel.daten.regeln.kampf.nachwirkung;
}

function kampfMerken(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const angreiferin = entitaeten[kontext.urheberId], ziel = entitaeten[kontext.zielId];
  if (!istWesen(angreiferin) || !istWesen(ziel) || angreiferin.id === ziel.id) return;
  angreiferin.kampfZuletzt = spiel.zustand.zeit;
  ziel.kampfZuletzt = spiel.zustand.zeit;
}

for (const haken of ["nach_treffer", "verfehlt", "nach_schaden"]) anmelden("haken", haken, kampfMerken);
