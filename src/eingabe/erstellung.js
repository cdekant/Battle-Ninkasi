// Charaktererstellung (siehe docs/Charakter.md, Charaktererstellung, und docs/Architektur.md, Fenster):
// reine Tastenlogik ohne DOM. Fensterart "erstellung" im Fensterstapel (eingabe/fenster.js), Zustand
// { eigenschaften: { name: wert }, gewaehlt }: Pfeil hoch und runter wählen die Eigenschaft, Pfeil links und rechts
// oder - und + ändern sie, A holt die ausgewogene Vorgabe aus den Daten zurück, Enter startet, sobald alle Punkte
// verteilt sind (ergebnis.start = { eigenschaften }, Startoption für neuesSpiel). Esc tut nichts: ohne Ninkasi kein Lauf.
// Grenzen aus regeln.lernen (eigenschaftStart, eigenschaftPunkte, eigenschaftHoechstens), geprüft mit eigenschaftenPruefen.

import { eigenschaftenPruefen } from "../systeme/skills.js";
import { buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

const TASTEN_BESTAETIGEN = ["Enter", "NumpadEnter"];
const TASTEN_MEHR = ["ArrowRight", "NumpadAdd"];
const TASTEN_WENIGER = ["ArrowLeft", "NumpadSubtract"];

export const namenDerEigenschaften = (daten) => Object.keys(daten.eigenschaften);

// Die ausgewogene Vorgabe: die Eigenschaften Ninkasis aus den Daten
export function vorgabeEigenschaften(daten) {
  return { ...daten.wesen.ninkasi.eigenschaften };
}

// Punkte, die zu verteilen sind; einzige Stelle der Rechnung, damit Makel und Vorzüge sie später verschieben können
// (Makel geben Punkte, Vorzüge kosten welche, siehe docs/Charakter.md), bisher nur regeln.lernen.eigenschaftPunkte
export function punkteZuVerteilen(daten) {
  return daten.regeln.lernen.eigenschaftPunkte;
}

// Noch zu verteilende Punkte
export function restpunkte(daten, eigenschaften) {
  const { eigenschaftStart } = daten.regeln.lernen;
  const summe = namenDerEigenschaften(daten).reduce((zwischensumme, name) => zwischensumme + (eigenschaften[name] ?? 0), 0);
  return eigenschaftStart * namenDerEigenschaften(daten).length + punkteZuVerteilen(daten) - summe;
}

// Werte für die Platzhalter im Hilfetext der Erstellung (hilfe.thema.erstellung): {start}, {punkte}, {hoechstens}
export function erstellungHilfewerte(daten) {
  const { eigenschaftStart, eigenschaftHoechstens } = daten.regeln.lernen;
  return { start: eigenschaftStart, punkte: punkteZuVerteilen(daten), hoechstens: eigenschaftHoechstens };
}

// Zustand beim Öffnen; eine gültige frühere Verteilung (aus dem Browser) wird übernommen, sonst die Vorgabe
export function erstellungOeffnen(daten, frueher) {
  const gueltig = frueher && !eigenschaftenPruefen(daten, frueher);
  return { eigenschaften: gueltig ? { ...frueher } : vorgabeEigenschaften(daten), gewaehlt: 0 };
}

function aendern(daten, zustand, richtung) {
  const { eigenschaftStart, eigenschaftHoechstens } = daten.regeln.lernen;
  const name = namenDerEigenschaften(daten)[zustand.gewaehlt];
  const neu = zustand.eigenschaften[name] + richtung;
  if (neu < eigenschaftStart || neu > eigenschaftHoechstens || (richtung > 0 && restpunkte(daten, zustand.eigenschaften) <= 0)) return { zustand };
  return { zustand: { ...zustand, eigenschaften: { ...zustand.eigenschaften, [name]: neu } } };
}

// Verarbeitet eine Taste; gibt { zustand, start?, grund? } zurück
export function erstellungTaste(zustand, taste, daten) {
  const anzahl = namenDerEigenschaften(daten).length;
  if (TASTEN_BESTAETIGEN.includes(taste.code)) {
    if (restpunkte(daten, zustand.eigenschaften) !== 0 || eigenschaftenPruefen(daten, zustand.eigenschaften)) return { zustand, grund: "punkte_uebrig" };
    return { zustand: null, start: { eigenschaften: { ...zustand.eigenschaften } } };
  }
  if (taste.code === "ArrowDown") return { zustand: { ...zustand, gewaehlt: (zustand.gewaehlt + 1) % anzahl } };
  if (taste.code === "ArrowUp") return { zustand: { ...zustand, gewaehlt: (zustand.gewaehlt + anzahl - 1) % anzahl } };
  if (TASTEN_MEHR.includes(taste.code) || taste.zeichen === "+") return aendern(daten, zustand, 1);
  if (TASTEN_WENIGER.includes(taste.code) || taste.zeichen === "-") return aendern(daten, zustand, -1);
  if (buchstabeDerTaste(taste.code, taste.zeichen) === "a") return { zustand: { ...zustand, eigenschaften: vorgabeEigenschaften(daten) } };
  return { zustand };
}

fensterartAnmelden("erstellung", { taste: (zustand, taste, { daten }) => erstellungTaste(zustand, taste, daten) });
