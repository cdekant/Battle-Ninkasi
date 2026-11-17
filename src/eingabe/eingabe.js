// Übersetzt Tastendrücke über die Belegung in Befehle oder Anzeige-Aktionen.
// Liest den Zustand nur, um Befehle zu vervollständigen (z.B. welches Getränk).

import { spielerin } from "../kern/zustand.js";
import { erstesGetraenk } from "../systeme/inventar.js";

// Gibt { befehl } oder { anzeige } oder null zurück
export function uebersetzen(tastenereignis, belegung, spiel) {
  if (tastenereignis.ctrlKey || tastenereignis.altKey || tastenereignis.metaKey) return null;
  const tastencode = tastenereignis.code;
  if (belegung.anzeige[tastencode]) return { anzeige: belegung.anzeige[tastencode] };
  const vorlage = belegung.befehle[tastencode];
  if (!vorlage) return null;
  const befehl = structuredClone(vorlage);
  if (befehl.art === "trinken" && befehl.gegenstandId === undefined) {
    const getraenkId = erstesGetraenk(spiel.zustand, spielerin(spiel.zustand));
    if (getraenkId !== null) befehl.gegenstandId = getraenkId;
  }
  return { befehl };
}
