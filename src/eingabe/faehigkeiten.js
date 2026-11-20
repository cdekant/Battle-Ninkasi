// Fähigkeitenfenster (siehe docs/Architektur.md, Zielmodus): reine Tastenlogik ohne DOM, wie eingabe/inventar.js.
// Fenster-Zustand der Anzeige (nicht im Spielzustand): null (zu) oder {} (offen).
//   zu:    Taste Z öffnet
//   offen: A bis Z wählt die Fähigkeit an dieser Stelle der Liste (faehigkeiten am Wesen), Esc schließt;
//          die Wahl schließt das Fenster und gibt die Auswahl für den Zielmodus zurück (eingabe/zielmodus.js)

import { spielerin } from "../kern/zustand.js";
import { BUCHSTABEN } from "./inventar.js";

// Name der Fähigkeit an einer Stelle der Liste oder null
export function faehigkeitAnStelle(spiel, stelle) {
  return (spielerin(spiel.zustand).faehigkeiten || [])[stelle] ?? null;
}

// Verarbeitet eine Taste (KeyboardEvent.code) bei offenem Fenster; gibt { fenster, auswahl? } zurück
export function faehigkeitenTaste(fenster, tastencode, spiel) {
  if (tastencode === "Escape") return { fenster: null };
  const buchstabe = /^Key([A-Z])$/.exec(tastencode)?.[1]?.toLowerCase();
  if (!buchstabe) return { fenster };
  const name = faehigkeitAnStelle(spiel, BUCHSTABEN.indexOf(buchstabe));
  return name ? { fenster: null, auswahl: { zweck: "faehigkeit", faehigkeit: name } } : { fenster };
}
