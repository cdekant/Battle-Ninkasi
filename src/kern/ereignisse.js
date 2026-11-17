// Ereignisse (siehe docs/Architektur.md, Ereignisse)
// Haken: intern, dürfen eingreifen und den Kontext verändern (z.B. "vor_schaden")
// Meldungen: nach außen, rein lesend; Hörer dürfen weder den Zustand ändern noch den Spiel-Zufall benutzen

import { hat, holen } from "./register.js";

export function haken(spiel, name, kontext) {
  if (!hat("haken", name)) return kontext;
  for (const handler of holen("haken", name)) handler(spiel, kontext);
  return kontext;
}

// Hörer: (meldung) => void, wobei meldung = { art, zeit, ...daten }
export function hoeren(spiel, hoerer) {
  spiel.hoerer.push(hoerer);
}

export function melden(spiel, art, daten = {}) {
  if (spiel.hoerer.length === 0) return;
  if ("art" in daten || "zeit" in daten) throw new Error(`Meldung "${art}": Felder "art" und "zeit" sind reserviert`);
  const meldung = Object.freeze({ art, zeit: spiel.zustand.zeit, ...daten });
  for (const h of spiel.hoerer) h(meldung);
}

// Kurzbezug auf eine Entität für Meldungen, bleibt gültig, auch wenn die Entität entfernt wird
export function bezug(ent) {
  return { id: ent.id, typ: ent.typ, text: ent.text };
}
