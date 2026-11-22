// Handlung "nutzen" der KI (siehe docs/Wesen.md, KI; Wahl und Eintrag in ki/handlungen.js): der Befehl, mit dem ein
// Wesen etwas nutzt, das einem Zweck dient (regeln.ki.zwecke, z.B. heilen, angriff), oder null.
// Gefragt wird der Reihe nach: erst die eigenen Fähigkeiten (faehigkeiten am Wesen) mit dem Zweck in zweck, dann die
// Gegenstände im Gepäck in dessen Reihenfolge; das erste, das einen Befehl liefert, gilt.
// Register "nutzungen": { feld, befehl(spiel, wesen, beute, gegenstand) => Befehl | null }, ohne Nebenwirkungen. Ein
//   Gegenstand dient einem Zweck über eine Nutzung, wenn gegenstand[feld].zweck ihn enthält (trinkbar.zweck, wurf.zweck);
//   angemeldet von den Systemen, die den Befehl kennen (trinken in systeme/inventar.js, werfen in systeme/werfen.js).

import { alle } from "../kern/register.js";
import { entitaetMitId } from "../kern/zustand.js";
import { faehigkeitFuer } from "../systeme/faehigkeiten.js";
import { faehigkeitsbefehl } from "./faehigkeitenwahl.js";

function faehigkeitNutzen(spiel, wesen, zweck, beute) {
  for (const name of wesen.faehigkeiten || []) {
    if (!faehigkeitFuer(spiel, wesen, name)?.zweck?.includes(zweck)) continue;
    const befehl = faehigkeitsbefehl(spiel, wesen, name, beute);
    if (befehl) return befehl;
  }
  return null;
}

function gegenstandNutzen(spiel, wesen, zweck, beute) {
  for (const id of wesen.inventar || []) {
    const gegenstand = entitaetMitId(spiel.zustand, id);
    if (!gegenstand) continue;
    for (const [, nutzung] of alle("nutzungen")) {
      if (!gegenstand[nutzung.feld]?.zweck?.includes(zweck)) continue;
      const befehl = nutzung.befehl(spiel, wesen, beute, gegenstand);
      if (befehl) return befehl;
    }
  }
  return null;
}

export function nutzbefehl(spiel, wesen, zweck, beute) {
  return faehigkeitNutzen(spiel, wesen, zweck, beute) ?? gegenstandNutzen(spiel, wesen, zweck, beute);
}
