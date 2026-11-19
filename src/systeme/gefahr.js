// Gefahrenprüfung: reine Lesefunktionen, verändern nichts und benutzen keinen Zufall.
// Eine Lage ist ein Schnappschuss der für Gefahr wichtigen Werte; zwei Lagen werden verglichen.
// Genutzt von der Reise per Maus, später auch von langen Aktionen (Brauen).
// Neue Prüfungen meldet man im Register "gefahren" an.

import { anmelden, hat, holen } from "../kern/register.js";
import { alleEntitaeten, spielerin } from "../kern/zustand.js";
import { feindlich } from "./kampf.js";
import { istSichtbar } from "./sicht.js";

// Feinde, die Ninkasi gerade sieht (IDs aufsteigend)
export function sichtbareFeinde(spiel) {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  return alleEntitaeten(zustand)
    .filter((entitaet) => entitaet.position && feindlich(spiel, ninkasi, entitaet) && istSichtbar(zustand, entitaet.position.x, entitaet.position.y))
    .map((entitaet) => entitaet.id);
}

export function lageErfassen(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  return { feinde: sichtbareFeinde(spiel), lp: ninkasi.werte.lp.aktuell };
}

// Ein Feind ist in Sicht gekommen, der vorher nicht sichtbar war
anmelden("gefahren", "gegner_in_sicht", (vorher, nachher) => nachher.feinde.some((feindId) => !vorher.feinde.includes(feindId)));

// Ninkasi hat LP verloren
anmelden("gefahren", "schaden", (vorher, nachher) => nachher.lp < vorher.lp);

// Gibt den Namen der ersten zutreffenden Prüfung aus der Liste zurück, sonst null
export function gefahrPruefen(lageVorher, lageNachher, pruefungsNamen) {
  for (const name of pruefungsNamen) {
    if (hat("gefahren", name) && holen("gefahren", name)(lageVorher, lageNachher)) return name;
  }
  return null;
}
