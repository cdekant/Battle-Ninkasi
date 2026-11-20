// Fähigkeitenfenster (siehe docs/Architektur.md, Zielmodus): reine Tastenlogik ohne DOM, wie eingabe/inventar.js.
// Fenster-Zustand der Anzeige (nicht im Spielzustand): null (zu) oder {} (offen).
//   zu:    Taste Z öffnet
//   offen: A bis Z wählt die Fähigkeit an dieser Stelle der Liste (faehigkeiten am Wesen), Esc schließt;
//          die Wahl schließt das Fenster und gibt die Auswahl für den Zielmodus zurück (eingabe/zielmodus.js)

import { spielerin } from "../kern/zustand.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";

// Name der Fähigkeit an einer Stelle der Liste oder null
export function faehigkeitAnStelle(spiel, stelle) {
  return (spielerin(spiel.zustand).faehigkeiten || [])[stelle] ?? null;
}

// Verarbeitet eine Taste (KeyboardEvent.code, dazu KeyboardEvent.key) bei offenem Fenster; gibt { fenster, auswahl? } zurück;
// Buchstaben nach dem Zeichen der Taste wie im Inventar (eingabe/inventar.js)
export function faehigkeitenTaste(fenster, tastencode, spiel, zeichen) {
  if (tastencode === "Escape") return { fenster: null };
  const buchstabe = buchstabeDerTaste(tastencode, zeichen);
  if (!buchstabe) return { fenster };
  const name = faehigkeitAnStelle(spiel, BUCHSTABEN.indexOf(buchstabe));
  return name ? { fenster: null, auswahl: { zweck: "faehigkeit", faehigkeit: name } } : { fenster };
}
