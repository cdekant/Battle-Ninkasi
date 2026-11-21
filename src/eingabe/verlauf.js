// Verlauf (Tab): das ganze Log als Fenster mit Filter und Suche (siehe docs/Oberflaeche.md, Log); reine Tastenlogik
// ohne DOM. Zustand { filter, versatz, suche, sucheAktiv }: filter aus VERLAUF_FILTER, versatz Zeilen vom Ende
// (0 zeigt die neuesten), suche ein Text, den jede gezeigte Zeile enthält (ohne Rücksicht auf Groß- und
// Kleinschreibung und Umlaute, eingabe/texteingabe.js).
// Buchstabe wählt den Filter, Pfeile oder j/k blättern um eine Zeile, Bild auf/ab um eine Seite, Pos1/Ende springen,
// / beginnt die Suche: Tippen sucht, Enter beendet die Eingabe (die Suche bleibt), Esc löscht sie; ohne Suche
// schließen Esc und Tab.

import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";
import { texteingabeTaste, suchform } from "./texteingabe.js";

export const VERLAUF_FILTER = ["alle", "geschehen", "kampf", "gefahr", "fund", "lernen", "hinweis"];
export const VERLAUF_SEITE = 30;

// Ob eine Logzeile (anzeige/log.js) zu Filter und Suche passt
export function passtZumFilter(zeile, filter, suche = "") {
  if (suche && !suchform(zeile.text).includes(suchform(suche))) return false;
  if (filter === "alle") return true;
  if (filter === "geschehen" || filter === "kampf") return zeile.spalte === filter;
  return zeile.art === filter;
}

export function verlaufOeffnen() {
  return { filter: "alle", versatz: 0, suche: "", sucheAktiv: false };
}

export function verlaufTaste(zustand, taste) {
  const suche = zustand.suche ?? "";
  if (zustand.sucheAktiv) {
    if (taste.code === "Escape") return { zustand: { ...zustand, suche: "", sucheAktiv: false, versatz: 0 } };
    if (taste.code === "Enter" || taste.code === "NumpadEnter") return { zustand: { ...zustand, sucheAktiv: false } };
    const text = texteingabeTaste(suche, taste);
    return { zustand: text === null ? zustand : { ...zustand, suche: text, versatz: 0 } };
  }
  if (taste.code === "Escape" && suche) return { zustand: { ...zustand, suche: "", versatz: 0 } };
  if (taste.code === "Escape" || taste.code === "Tab") return { zustand: null };
  if (taste.zeichen === "/") return { zustand: { ...zustand, sucheAktiv: true } };
  const blaettern = { ArrowUp: 1, KeyK: 1, ArrowDown: -1, KeyJ: -1, PageUp: VERLAUF_SEITE, PageDown: -VERLAUF_SEITE }[taste.code];
  if (blaettern) return { zustand: { ...zustand, versatz: Math.max(0, zustand.versatz + blaettern) } };
  if (taste.code === "End") return { zustand: { ...zustand, versatz: 0 } };
  if (taste.code === "Home") return { zustand: { ...zustand, versatz: Infinity } };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const filter = buchstabe ? VERLAUF_FILTER[BUCHSTABEN.indexOf(buchstabe)] : undefined;
  return { zustand: filter ? { ...zustand, filter, versatz: 0 } : zustand };
}

fensterartAnmelden("verlauf", { taste: (zustand, taste) => verlaufTaste(zustand, taste) });
