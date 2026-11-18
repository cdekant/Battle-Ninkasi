// Nahkampf: Trefferwurf, bei Treffer wirkt der Angriffseffekt aus den Daten; danach Haken "nach_treffer" oder "verfehlt".
// Angriff in den Daten: angriff: { trefferchance: 80, effekt: "faustschlag" }

import { mitProzentChance } from "../kern/zufall.js";
import { modifiziert } from "../kern/werte.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";

export function istWesen(entitaet) {
  return Boolean(entitaet && entitaet.fraktion !== undefined && entitaet.werte && entitaet.werte.lp);
}

export function feindlich(erstesWesen, zweitesWesen) {
  return istWesen(erstesWesen) && istWesen(zweitesWesen) && erstesWesen.fraktion !== zweitesWesen.fraktion;
}

export function nahkampf(spiel, angreifer, ziel) {
  const angriff = angreifer.angriff;
  if (!angriff) return;
  const trefferchance = modifiziert(angreifer, "trefferchance", angriff.trefferchance);
  const beteiligte = { quelleId: angreifer.id, zielId: ziel.id, ursache: "nahkampf", kettentiefe: 0 };
  if (mitProzentChance(spiel.zustand.zufallszustand, trefferchance)) {
    effektAnwenden(spiel, angriff.effekt, beteiligte);
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligte });
  } else {
    melden(spiel, "verfehlt", { quelle: bezugAuf(angreifer), ziel: bezugAuf(ziel) });
    hakenAusloesen(spiel, "verfehlt", { ...beteiligte });
  }
}
