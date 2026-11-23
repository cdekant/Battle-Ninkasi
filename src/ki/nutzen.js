// Handlung "nutzen" der KI (siehe docs/Wesen.md, KI; Wahl und Eintrag in ki/handlungen.js): der Befehl, mit dem ein
// Wesen etwas nutzt, das einem Zweck dient (regeln.ki.zwecke, z.B. heilen, angriff), gegen ein Ziel, oder null.
// Gefragt wird der Reihe nach: erst die Fähigkeiten (eigene, dann gewährte, faehigkeitenVon) mit dem Zweck in zweck, dann die
// Gegenstände im Gepäck in dessen Reihenfolge; das erste, das einen Befehl liefert, gilt.
// Register "nutzungen": { feld, ziel: "selbst" | "beute", befehl(spiel, wesen, ziel, gegenstand) => Befehl | null }, ohne
//   Nebenwirkungen. Ein Gegenstand dient einem Zweck über eine Nutzung, wenn gegenstand[feld].zweck ihn enthält
//   (trinkbar.zweck, wurf.zweck); ziel sagt, wen die Nutzung trifft: selbst nur das Wesen, beute nur seine Beute.
//   Angemeldet von den Systemen, die den Befehl kennen (trinken in systeme/inventar.js, werfen in systeme/werfen.js).

import { alle } from "../kern/register.js";
import { entitaetMitId } from "../kern/zustand.js";
import { faehigkeitFuer, faehigkeitenVon } from "../systeme/faehigkeiten.js";
import { faehigkeitsbefehl } from "./faehigkeitenwahl.js";

function faehigkeitNutzen(spiel, wesen, zweck, ziel, beute) {
  for (const name of faehigkeitenVon(spiel, wesen)) {
    if (!faehigkeitFuer(spiel, wesen, name)?.zweck?.includes(zweck)) continue;
    const befehl = faehigkeitsbefehl(spiel, wesen, name, ziel, beute);
    if (befehl) return befehl;
  }
  return null;
}

const nutzungPasst = (nutzung, wesen, ziel, beute) => (nutzung.ziel === "selbst" ? ziel.id === wesen.id : ziel.id === beute.id);

function gegenstandNutzen(spiel, wesen, zweck, ziel, beute) {
  for (const id of wesen.inventar || []) {
    const gegenstand = entitaetMitId(spiel.zustand, id);
    if (!gegenstand) continue;
    for (const [, nutzung] of alle("nutzungen")) {
      if (!gegenstand[nutzung.feld]?.zweck?.includes(zweck) || !nutzungPasst(nutzung, wesen, ziel, beute)) continue;
      const befehl = nutzung.befehl(spiel, wesen, ziel, gegenstand);
      if (befehl) return befehl;
    }
  }
  return null;
}

// beute: die Beute des Wesens (Vorgabe das Ziel)
export function nutzbefehl(spiel, wesen, zweck, ziel, beute = ziel) {
  return faehigkeitNutzen(spiel, wesen, zweck, ziel, beute) ?? gegenstandNutzen(spiel, wesen, zweck, ziel, beute);
}
