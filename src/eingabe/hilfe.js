// Hilfe (Taste ?; siehe docs/Bedienung.md, Fenster): Fensterart "hilfe" im Fensterstapel (eingabe/fenster.js).
// Der Inhalt entsteht aus Aktionskatalog und Belegung (hilfeGruppen), nichts davon ist von Hand geschrieben.
// Zustand { thema? }: aus einem Fenster geöffnet, ist das Thema dessen Art; die Anzeige zeigt dann nur die Hilfe zum
// Fenster (Text hilfe.thema.<art>, sonst die allgemeine Erklärung der Fenster, dazu dessen Tasten), ohne Thema die
// allgemeine Hilfe mit allen Tasten (anzeige/fenster.js). Esc oder ? schließt.

import { AKTIONEN, GRUPPEN, tastenDerAktion } from "./aktionskatalog.js";
import { fensterartAnmelden } from "./fenster.js";

// [{ gruppe, eintraege: [{ aktion, text, tasten: [{ code } | { zeichen }] }] }], nur Aktionen mit Taste;
// Aktionen mit demselben Text (die Plätze der Schnellleiste) stehen in einer Zeile mit allen ihren Tasten
export function hilfeGruppen(belegung) {
  return GRUPPEN.map((gruppe) => {
    const eintraege = [];
    for (const [aktion, eintrag] of Object.entries(AKTIONEN)) {
      if (eintrag.gruppe !== gruppe) continue;
      const tasten = tastenDerAktion(belegung, aktion);
      if (!tasten.length) continue;
      const gleicherText = eintraege.find((vorhanden) => vorhanden.text === eintrag.text);
      if (gleicherText) gleicherText.tasten.push(...tasten);
      else eintraege.push({ aktion, text: eintrag.text, tasten });
    }
    return { gruppe, eintraege };
  }).filter((gruppe) => gruppe.eintraege.length);
}

export function hilfeTaste(zustand, taste) {
  return { zustand: taste.code === "Escape" || taste.zeichen === "?" ? null : zustand };
}

fensterartAnmelden("hilfe", { taste: (zustand, taste) => hilfeTaste(zustand, taste) });
