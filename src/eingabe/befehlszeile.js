// Befehlszeile (Taste ":"; siehe docs/Oberflaeche.md, Tastatur): Fensterart "befehlszeile", reine Tastenlogik ohne DOM.
// Die Treffer kommen aus einem Register von Quellen (befehlsquelleAnmelden): bisher Aktionen und Einstellungen; später
// melden sich Bierrezepte, Lore-Texte oder Bücher als weitere Quelle an, ohne dass sich hier etwas ändert.
//   Quelle: (kontext) => [{ schluessel, text, ziel }]; kontext { spiel, texte, belegung }
//   ziel:   { aktion } (src/main.js führt sie aus) oder { einstellung } (öffnet das Einstellungsfenster dort)
// Zustand { eingabe, gewaehlt }: Tippen sucht, Pfeile wählen, Tab übernimmt den gewählten Treffer in die Eingabe,
// Enter führt ihn aus (ergebnis.befehlszeile = ziel), Esc schließt. Zusatzangaben (":zoom 32") folgen später.

import { AKTIONEN } from "./aktionskatalog.js";
import { EINSTELLUNGEN } from "./einstellungskatalog.js";
import { fensterartAnmelden } from "./fenster.js";
import { texteingabeTaste, suchform } from "./texteingabe.js";

export const HOECHSTE_TREFFER = 10;

const quellen = new Map();

export function befehlsquelleAnmelden(name, quelle) {
  quellen.set(name, quelle);
}

// Alle Einträge aller Quellen in der Reihenfolge ihrer Anmeldung
export function befehlseintraege(kontext) {
  return [...quellen.values()].flatMap((quelle) => quelle(kontext));
}

// Treffer zur Eingabe: Anfang des Texts vor Wortanfang oder Anfang der ID vor Teilwort, dann alphabetisch nach Text;
// leere Eingabe zeigt die ersten Einträge
export function befehlstreffer(eintraege, eingabe) {
  const gesucht = suchform(eingabe.trim());
  if (!gesucht) return eintraege.slice(0, HOECHSTE_TREFFER);
  const bewertet = [];
  for (const eintrag of eintraege) {
    const text = suchform(eintrag.text), schluessel = suchform(eintrag.schluessel);
    const amWortanfang = text.split(/[\s(),.:-]+/).some((wort) => wort.startsWith(gesucht));
    if (text.startsWith(gesucht)) bewertet.push({ eintrag, rang: 0 });
    else if (amWortanfang || schluessel.startsWith(gesucht)) bewertet.push({ eintrag, rang: 1 });
    else if (text.includes(gesucht) || schluessel.includes(gesucht)) bewertet.push({ eintrag, rang: 2 });
  }
  bewertet.sort((erster, zweiter) => erster.rang - zweiter.rang || erster.eintrag.text.localeCompare(zweiter.eintrag.text, "de"));
  return bewertet.slice(0, HOECHSTE_TREFFER).map(({ eintrag }) => eintrag);
}

// Aktionen ohne Laufen (braucht eine Richtung) und ohne die Befehlszeile selbst
befehlsquelleAnmelden("aktionen", ({ texte }) => Object.entries(AKTIONEN)
  .filter(([aktion]) => aktion !== "laufen" && aktion !== "befehlszeile")
  .map(([aktion, eintrag]) => ({ schluessel: aktion, text: texte.text(eintrag.text), ziel: { aktion } })));

befehlsquelleAnmelden("einstellungen", ({ texte }) => Object.keys(EINSTELLUNGEN)
  .map((id) => ({ schluessel: id, text: `${texte.text("befehlszeile.einstellung")}: ${texte.text(`einstellung.${id}`)}`, ziel: { einstellung: id } })));

export function befehlszeileOeffnen() {
  return { eingabe: "", gewaehlt: 0 };
}

export function befehlszeileTaste(zustand, taste, kontext) {
  if (taste.code === "Escape") return { zustand: null };
  const treffer = befehlstreffer(befehlseintraege(kontext), zustand.eingabe);
  if (taste.code === "ArrowDown") return { zustand: { ...zustand, gewaehlt: Math.min(treffer.length - 1, zustand.gewaehlt + 1) } };
  if (taste.code === "ArrowUp") return { zustand: { ...zustand, gewaehlt: Math.max(0, zustand.gewaehlt - 1) } };
  const gewaehlt = treffer[Math.min(zustand.gewaehlt, treffer.length - 1)];
  if (taste.code === "Tab") return { zustand: gewaehlt ? { eingabe: gewaehlt.text, gewaehlt: 0 } : zustand };
  if (taste.code === "Enter" || taste.code === "NumpadEnter") return gewaehlt ? { zustand: null, befehlszeile: gewaehlt.ziel } : { zustand };
  const eingabe = texteingabeTaste(zustand.eingabe, taste);
  return { zustand: eingabe === null ? zustand : { eingabe, gewaehlt: 0 } };
}

// Klick auf einen Treffer ({ zeile }): wählt ihn, den schon gewählten führt er aus wie Enter
export function befehlszeileKlick(zustand, ziel, kontext) {
  if (ziel.zeile === zustand.gewaehlt) return befehlszeileTaste(zustand, { code: "Enter" }, kontext);
  return { zustand: { ...zustand, gewaehlt: ziel.zeile } };
}

fensterartAnmelden("befehlszeile", {
  taste: (zustand, taste, kontext) => befehlszeileTaste(zustand, taste, kontext),
  klick: (zustand, ziel, kontext) => befehlszeileKlick(zustand, ziel, kontext),
});
