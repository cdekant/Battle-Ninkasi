// Mitwirkende (aus dem Titelmenü; siehe docs/Titelbildschirm.md, Mitwirkende): Fensterart "mitwirkende" im
// Fensterstapel (eingabe/fenster.js), nur zum Lesen; der Inhalt steht in anzeige/mitwirkende.js. Zustand {}. Esc schließt.

import { fensterartAnmelden } from "./fenster.js";

export function mitwirkendeTaste(zustand, taste) {
  return { zustand: taste.code === "Escape" ? null : zustand };
}

fensterartAnmelden("mitwirkende", { taste: mitwirkendeTaste });
