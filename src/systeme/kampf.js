// Nahkampf: Trefferwurf, bei Treffer wirkt der Angriffseffekt aus den Daten.
// Angriff in den Daten: angriff: { trefferchance: 80, effekt: "faustschlag" }

import { chance } from "../kern/zufall.js";
import { modifiziert } from "../kern/werte.js";
import { anwenden } from "../kern/effekte.js";
import { melden, bezug } from "../kern/ereignisse.js";

export function istWesen(ent) {
  return Boolean(ent && ent.fraktion !== undefined && ent.werte && ent.werte.lp);
}

export function feindlich(a, b) {
  return istWesen(a) && istWesen(b) && a.fraktion !== b.fraktion;
}

export function nahkampf(spiel, angreifer, ziel) {
  const a = angreifer.angriff;
  if (!a) return;
  const treffer = modifiziert(angreifer, "trefferchance", a.trefferchance);
  if (chance(spiel.zustand.rng, treffer)) {
    anwenden(spiel, a.effekt, { quelle: angreifer.id, ziel: ziel.id, art: "nahkampf" });
  } else {
    melden(spiel, "verfehlt", { quelle: bezug(angreifer), ziel: bezug(ziel) });
  }
}
