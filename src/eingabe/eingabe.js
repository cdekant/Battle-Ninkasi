// Übersetzt Tastendrücke über Belegung und Aktionskatalog (eingabe/aktionskatalog.js) in Aktionen und Befehle.
// Liest den Zustand nur, um Befehle zu vervollständigen (z.B. welches Getränk).

import { spielerin } from "../kern/zustand.js";
import { erstesGetraenk } from "../systeme/inventar.js";
import { aktionDerTaste, befehlDerAktion } from "./aktionskatalog.js";

// Gibt { aktion, befehl? } oder null zurück; befehl nur bei Aktionen mit Vorlage
export function uebersetzen(tastenereignis, belegung, spiel) {
  if (tastenereignis.ctrlKey || tastenereignis.altKey || tastenereignis.metaKey) return null;
  const aktion = aktionDerTaste(belegung, tastenereignis.code, tastenereignis.key);
  if (!aktion) return null;
  const befehl = befehlDerAktion(aktion);
  if (!befehl) return { aktion };
  if (befehl.art === "trinken" && befehl.gegenstandId === undefined) {
    const getraenkId = erstesGetraenk(spiel.zustand, spielerin(spiel.zustand));
    if (getraenkId !== null) befehl.gegenstandId = getraenkId;
  }
  return { aktion, befehl };
}
