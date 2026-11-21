// Übersichtskarte (Taste m; siehe docs/Oberflaeche.md, Seitenleiste): Fensterart "karte" im Fensterstapel, reine
// Tastenlogik ohne DOM. Den Inhalt zeichnet anzeige/minikarte.js in ein Canvas des Fensters (src/main.js), ein Klick
// darauf reist dorthin und schließt das Fenster. Zustand {}; Esc oder m schließt.

import { fensterartAnmelden } from "./fenster.js";

export function karteTaste(zustand, taste) {
  return { zustand: taste.code === "Escape" || taste.code === "KeyM" ? null : zustand };
}

fensterartAnmelden("karte", { taste: (zustand, taste) => karteTaste(zustand, taste) });
