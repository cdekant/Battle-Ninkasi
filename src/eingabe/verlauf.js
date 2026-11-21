// Verlauf (Tab): das ganze Log als Fenster mit Filter (siehe docs/Oberflaeche.md, Log); reine Tastenlogik ohne DOM.
// Zustand { filter, versatz }: filter aus VERLAUF_FILTER, versatz Zeilen vom Ende (0 zeigt die neuesten).
// Buchstabe wählt den Filter, Pfeile oder j/k blättern um eine Zeile, Bild auf/ab um eine Seite, Pos1/Ende springen,
// Esc oder Tab schließt. Die Suche mit / folgt später.

import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

export const VERLAUF_FILTER = ["alle", "geschehen", "kampf", "gefahr", "fund", "lernen", "hinweis"];
export const VERLAUF_SEITE = 30;

// Ob eine Logzeile (anzeige/log.js) zum Filter passt
export function passtZumFilter(zeile, filter) {
  if (filter === "alle") return true;
  if (filter === "geschehen" || filter === "kampf") return zeile.spalte === filter;
  return zeile.art === filter;
}

export function verlaufOeffnen() {
  return { filter: "alle", versatz: 0 };
}

export function verlaufTaste(zustand, taste) {
  if (taste.code === "Escape" || taste.code === "Tab") return { zustand: null };
  const blaettern = { ArrowUp: 1, KeyK: 1, ArrowDown: -1, KeyJ: -1, PageUp: VERLAUF_SEITE, PageDown: -VERLAUF_SEITE }[taste.code];
  if (blaettern) return { zustand: { ...zustand, versatz: Math.max(0, zustand.versatz + blaettern) } };
  if (taste.code === "End") return { zustand: { ...zustand, versatz: 0 } };
  if (taste.code === "Home") return { zustand: { ...zustand, versatz: Infinity } };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const filter = buchstabe ? VERLAUF_FILTER[BUCHSTABEN.indexOf(buchstabe)] : undefined;
  return { zustand: filter ? { filter, versatz: 0 } : zustand };
}

fensterartAnmelden("verlauf", { taste: (zustand, taste) => verlaufTaste(zustand, taste) });
