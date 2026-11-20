// Ereignisse (siehe docs/Architektur.md, Ereignisse)
// Haken: intern, dürfen eingreifen und den Kontext verändern (z.B. "vor_schaden")
// Meldungen: nach außen, rein lesend; Hörer dürfen weder den Zustand ändern noch den Spiel-Zufall benutzen

import { hat, holen } from "./register.js";
import { HAKENKATALOG } from "./hakenkatalog.js";

// Setzt ein Handler kontext.abgebrochen = true, laufen die weiteren Handler nicht mehr
export function hakenAusloesen(spiel, hakenName, kontext) {
  if (!(hakenName in HAKENKATALOG)) throw new Error(`Haken "${hakenName}" steht nicht im Katalog (kern/hakenkatalog.js)`);
  if (!hat("haken", hakenName)) return kontext;
  for (const handler of holen("haken", hakenName)) {
    if (kontext.abgebrochen) break;
    handler(spiel, kontext);
  }
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

// Kurzbezug auf eine Entität für Meldungen, bleibt gültig, auch wenn die Entität entfernt wird;
// ein unbekannter Gegenstand trägt sein Etikett mit (systeme/kennen.js), die Anzeige nennt dann dieses;
// ort ist die Position zur Zeit der Meldung (für die Wahrnehmbarkeit im Log, systeme/wahrnehmbar.js)
export function bezugAuf(entitaet) {
  const bezug = { id: entitaet.id, typ: entitaet.typ, text: entitaet.text };
  if (entitaet.etikett !== undefined) bezug.etikett = entitaet.etikett;
  if (entitaet.position) bezug.ort = { x: entitaet.position.x, y: entitaet.position.y };
  return bezug;
}
