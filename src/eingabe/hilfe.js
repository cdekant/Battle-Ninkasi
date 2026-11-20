// Hilfe (Taste ?; siehe docs/Architektur.md, Fenster): Fensterart "hilfe" im Fensterstapel (eingabe/fenster.js).
// Der Inhalt entsteht aus Aktionskatalog und Belegung (hilfeGruppen), nichts davon ist von Hand geschrieben.
// Zustand { thema? }: aus einem Fenster geöffnet, ist das Thema dessen Art; die Anzeige zeigt dann nur die Hilfe zum
// Fenster (Text hilfe.thema.<art>, sonst die allgemeine Erklärung der Fenster, dazu dessen Tasten), ohne Thema die
// allgemeine Hilfe mit allen Tasten (anzeige/fenster.js). Esc oder ? schließt.

import { AKTIONEN, GRUPPEN, tastenDerAktion } from "./aktionskatalog.js";
import { fensterartAnmelden } from "./fenster.js";

// [{ gruppe, eintraege: [{ aktion, text, tasten: [{ code } | { zeichen }] }] }], nur Aktionen mit Taste
export function hilfeGruppen(belegung) {
  return GRUPPEN.map((gruppe) => ({
    gruppe,
    eintraege: Object.entries(AKTIONEN)
      .filter(([, eintrag]) => eintrag.gruppe === gruppe)
      .map(([aktion, eintrag]) => ({ aktion, text: eintrag.text, tasten: tastenDerAktion(belegung, aktion) }))
      .filter((eintrag) => eintrag.tasten.length),
  })).filter((gruppe) => gruppe.eintraege.length);
}

export function hilfeTaste(zustand, taste) {
  return { zustand: taste.code === "Escape" || taste.zeichen === "?" ? null : zustand };
}

fensterartAnmelden("hilfe", { taste: (zustand, taste) => hilfeTaste(zustand, taste) });
