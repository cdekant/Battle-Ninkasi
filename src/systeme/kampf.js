// Nahkampf: Trefferwurf, bei Treffer wirkt der Angriffseffekt aus den Daten; danach Haken "nach_treffer" oder "verfehlt".
// Angriff in den Daten: angriff: { trefferchance: 80, effekt: "faustschlag", muster?, trifft? }
//   muster (siehe systeme/zielauswahl.js) vom Angreifer in Richtung des Ziels, z.B. Rundumschlag
//   { art: "angrenzend" } oder Speer { art: "linie", laenge: 2 }; jedes getroffene Wesen bekommt einen
//   eigenen Trefferwurf, in der Reihenfolge der Felder; trifft Vorgabe "wesen", der Angreifer nie selbst

import { mitProzentChance } from "../kern/zufall.js";
import { modifiziert } from "../kern/werte.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { fraktionVon } from "../kern/zustand.js";
import { musterFelder, entitaetenAufFeldern } from "./zielauswahl.js";

export function istWesen(entitaet) {
  return Boolean(entitaet && entitaet.fraktion !== undefined && entitaet.werte && entitaet.werte.lp);
}

export function feindlich(erstesWesen, zweitesWesen) {
  return istWesen(erstesWesen) && istWesen(zweitesWesen) && fraktionVon(erstesWesen) !== fraktionVon(zweitesWesen);
}

function angriffsziele(spiel, angreifer, ziel) {
  const angriff = angreifer.angriff;
  if (!angriff.muster) return [ziel];
  const auswahl = { ursprung: { ...angreifer.position }, zielpunkt: { ...ziel.position }, quelleId: angreifer.id };
  const felder = musterFelder(spiel, angriff.muster, auswahl);
  return entitaetenAufFeldern(spiel, felder, { trifft: angriff.trifft ?? "wesen", urheberId: angreifer.id, urheberFraktion: fraktionVon(angreifer), ohneUrheber: true });
}

export function nahkampf(spiel, angreifer, ziel) {
  if (!angreifer.angriff) return;
  for (const getroffenes of angriffsziele(spiel, angreifer, ziel)) {
    if (spiel.zustand.entitaeten[getroffenes.id]) einzelangriff(spiel, angreifer, getroffenes);
  }
}

function einzelangriff(spiel, angreifer, ziel) {
  const angriff = angreifer.angriff;
  const umstaende = { gegenueberId: ziel.id, tags: spiel.daten.effekte?.[angriff.effekt]?.tags || [] };
  const trefferchance = modifiziert(spiel, angreifer, "trefferchance", angriff.trefferchance, umstaende);
  const mittel = { art: "angriff", name: angriff.effekt };
  const beteiligte = { quelleId: angreifer.id, urheberId: angreifer.beschworenVon ?? angreifer.id, zielId: ziel.id, ursache: "nahkampf", kettentiefe: 0, mittel };
  if (mitProzentChance(spiel.zustand.zufallszustand, trefferchance)) {
    effektAnwenden(spiel, angriff.effekt, beteiligte);
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligte });
  } else {
    melden(spiel, "verfehlt", { quelle: bezugAuf(angreifer), ziel: bezugAuf(ziel) });
    hakenAusloesen(spiel, "verfehlt", { ...beteiligte });
  }
}
