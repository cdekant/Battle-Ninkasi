// Ereignisse (siehe docs/Architektur.md, Ereignisse)
// Haken: intern, dürfen eingreifen und den Kontext verändern (z.B. "vor_schaden")
// Meldungen: nach außen, rein lesend; Hörer dürfen weder den Zustand ändern noch den Spiel-Zufall benutzen

import { hat, holen } from "./register.js";

export function hakenAusloesen(spiel, hakenName, kontext) {
  if (!hat("haken", hakenName)) return kontext;
  for (const handler of holen("haken", hakenName)) handler(spiel, kontext);
  return kontext;
}

// Hörer: (meldung) => void, wobei meldung = { art, zeit, ...daten }
export function hoererAnmelden(spiel, hoerer) {
  spiel.hoerer.push(hoerer);
}

export function melden(spiel, art, daten = {}) {
  if (spiel.hoerer.length === 0) return;
  if ("art" in daten || "zeit" in daten) throw new Error(`Meldung "${art}": Felder "art" und "zeit" sind reserviert`);
  const meldung = Object.freeze({ art, zeit: spiel.zustand.zeit, ...daten });
  for (const hoerer of spiel.hoerer) hoerer(meldung);
}

// Kurzbezug auf eine Entität für Meldungen, bleibt gültig, auch wenn die Entität entfernt wird
export function bezugAuf(entitaet) {
  return { id: entitaet.id, typ: entitaet.typ, text: entitaet.text };
}
