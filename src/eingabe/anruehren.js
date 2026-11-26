// Anrühren von Trockenbier (siehe docs/Bedienung.md, Fenster, und docs/Sude.md, Trockenbier): Fensterart "anruehren"
// über dem Inventar, geöffnet mit r oder Enter auf einem Trockenbier. Zustand { gegenstandId }.
//   Liste: die Kulturen zum Anrühren (kulturenZumAnruehren): spontan, wo die Ebene eine Flora hat, dann die Kulturen
//   Ninkasis; a bis z oder ein Klick wählt und gibt den Befehl anruehren (das Fenster schließt), Esc schließt.
// Reine Tastenlogik ohne DOM; den Inhalt zeigt anzeige/braufenster.js.

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { SPONTAN } from "../systeme/sud.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

export const anruehrenOeffnen = (gegenstandId) => ({ art: "anruehren", zustand: { gegenstandId } });

// Kulturen zur Wahl in fester Reihenfolge
export function kulturenZumAnruehren(spiel) {
  return [...(spiel.zustand.ebene?.flora ? [SPONTAN] : []), ...(gesteuerteEntitaet(spiel.zustand).kulturen || [])];
}

export function anruehrenTaste(zustand, taste, spiel) {
  if (taste.code === "Escape") return { zustand: null };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const kultur = buchstabe ? kulturenZumAnruehren(spiel)[BUCHSTABEN.indexOf(buchstabe)] : undefined;
  if (kultur === undefined) return { zustand };
  return { zustand: null, befehl: { art: "anruehren", gegenstandId: zustand.gegenstandId, kultur } };
}

fensterartAnmelden("anruehren", {
  taste(zustand, taste, { spiel }) {
    return anruehrenTaste(zustand, taste, spiel);
  },
  klick(zustand, ziel, { spiel }) {
    const buchstabe = BUCHSTABEN[ziel.stelle];
    return buchstabe ? anruehrenTaste(zustand, { code: `Key${buchstabe.toUpperCase()}`, zeichen: buchstabe }, spiel) : { zustand };
  },
});
