// Übersetzt Tastendrücke über die Belegung in Befehle oder Anzeige-Aktionen.
// Liest den Zustand nur, um Befehle zu vervollständigen (z.B. welches Getränk).

import { spieler } from "../kern/zustand.js";
import { erstesGetraenk } from "../systeme/inventar.js";

// Gibt { befehl } oder { anzeige } oder null zurück
export function uebersetzen(ereignis, belegung, spiel) {
  if (ereignis.ctrlKey || ereignis.altKey || ereignis.metaKey) return null;
  const code = ereignis.code;
  if (belegung.anzeige[code]) return { anzeige: belegung.anzeige[code] };
  const vorlage = belegung.befehle[code];
  if (!vorlage) return null;
  const befehl = structuredClone(vorlage);
  if (befehl.art === "trinken" && befehl.item === undefined) {
    const id = erstesGetraenk(spiel.zustand, spieler(spiel.zustand));
    if (id !== null) befehl.item = id;
  }
  return { befehl };
}
