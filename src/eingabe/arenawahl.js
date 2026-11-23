// Wahl der Arena vom Titel aus (siehe docs/Titelbildschirm.md, Arena): Fensterart "arenawahl",
// reine Tastenlogik ohne DOM.
//   Zustand { gewaehlt, automatisch, taktik }: die Arenen aus daten/arenen.js in ihrer Reihenfolge; Buchstabe oder
//   Pfeile und Enter starten die Arena (ein freier Platz, sonst die Läufe zum Ersetzen wie beim neuen Spiel);
//   Leertaste schaltet zwischen von Hand und automatisch, Tab wechselt die Taktik (null: die der Arena); Esc schließt.
//   Ein Klick auf eine Zeile wählt sie, der zweite startet.
// Aktion für src/main.js: { art: "neuesSpiel", stelle, spielart: "arena", arena, automatisch, taktik }.
// kontext: { daten, plaetze }

import { fensterartAnmelden } from "./fenster.js";
import { listeBedienen } from "./menue.js";
import { platzFuerNeuesSpiel } from "./speicherstand.js";
import { neuesSpielAktion, laeufeOeffnen } from "./titel.js";

export const arenenListe = (daten) => Object.keys(daten.arenen ?? {});

export function arenawahlOeffnen() {
  return { gewaehlt: 0, automatisch: false, taktik: null };
}

// Taktik für die gewählte Arena: die im Fenster gewählte, sonst die der Arena, sonst die erste
export function taktikDerWahl(daten, zustand, arena) {
  return zustand.taktik ?? daten.arenen[arena]?.taktik ?? Object.keys(daten.taktiken)[0];
}

export function arenawahlTaste(zustand, taste, kontext = {}) {
  const daten = kontext.daten, plaetze = kontext.plaetze ?? [];
  if (taste.code === "Escape") return { zustand: null };
  const arenen = arenenListe(daten);
  if (!arenen.length) return { zustand };
  if (taste.code === "Space") return { zustand: { ...zustand, automatisch: !zustand.automatisch } };
  if (taste.code === "Tab") {
    const taktiken = Object.keys(daten.taktiken);
    const jetzt = taktikDerWahl(daten, zustand, arenen[zustand.gewaehlt]);
    return { zustand: { ...zustand, taktik: taktiken[(taktiken.indexOf(jetzt) + 1) % taktiken.length] } };
  }
  const { gewaehlt, waehlen } = listeBedienen(zustand.gewaehlt, arenen.length, taste);
  const neu = { ...zustand, gewaehlt };
  if (waehlen === null) return { zustand: neu };
  const arena = arenen[waehlen];
  const zusatz = { arena, automatisch: zustand.automatisch, taktik: taktikDerWahl(daten, zustand, arena) };
  const stelle = platzFuerNeuesSpiel(plaetze);
  if (stelle === null) return { zustand: neu, oeffnen: { art: "laeufe", zustand: laeufeOeffnen("ersetzen", plaetze, "arena", zusatz) } };
  return { zustand: neu, aktion: neuesSpielAktion(stelle, "arena", zusatz) };
}

export function arenawahlKlick(zustand, ziel, kontext = {}) {
  if (ziel.stelle === undefined) return { zustand };
  if (ziel.stelle !== zustand.gewaehlt) return { zustand: { ...zustand, gewaehlt: ziel.stelle } };
  return arenawahlTaste(zustand, { code: "Enter" }, kontext);
}

fensterartAnmelden("arenawahl", { taste: arenawahlTaste, klick: arenawahlKlick });
