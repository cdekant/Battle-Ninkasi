// Gefahrenprüfung: reine Lesefunktionen, verändern nichts und benutzen keinen Zufall.
// Eine Lage ist ein Schnappschuss der für Gefahr wichtigen Werte; zwei Lagen werden verglichen.
// Genutzt von der Reise per Maus, später auch von langen Aktionen (Brauen).
// Neue Prüfungen meldet man im Register "gefahren" an.

import { anmelden, hat, holen } from "../kern/register.js";
import { entitaetenMitPosition, gesteuerteEntitaet } from "../kern/zustand.js";
import { feindlich } from "./kampf.js";
import { nimmtWahr } from "./sinne.js";

// Feinde, die Ninkasi gerade wahrnimmt, gesehen oder gespürt (systeme/sinne.js), IDs aufsteigend
export function wahrgenommeneFeinde(spiel) {
  const zustand = spiel.zustand;
  const gesteuerte = gesteuerteEntitaet(zustand);
  return entitaetenMitPosition(zustand)
    .filter((entitaet) => entitaet.position && feindlich(spiel, gesteuerte, entitaet) && nimmtWahr(spiel, gesteuerte, entitaet))
    .map((entitaet) => entitaet.id);
}

export function lageErfassen(spiel) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  return { feinde: wahrgenommeneFeinde(spiel), lp: gesteuerte.werte.lp.aktuell };
}

// Ein Feind ist wahrgenommen worden, der es vorher nicht war
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
