// Einstellungsfenster (siehe docs/Oberflaeche.md, Einstellungen): Fensterart "einstellungen", reine Tastenlogik ohne DOM.
// Zustand { reiter, gewaehlt, tastenStelle, aufnahme, konflikt, hinweis }
// kontext: { einstellungen, vorgaben, belegung, belegungsVorgabe, abweichungen } (src/main.js)
// Ergebnis zusätzlich: einstellungen (neue Einstellungen), abweichungen (neue Tastenbelegung), aktion (z.B. vollbild);
// src/main.js wendet sie sofort an und speichert sie.
// Alle Reiter: Tab und Umschalt+Tab wechseln den Reiter, Esc schließt.
// Reiter mit Einstellungen: Buchstabe oder Pfeile hoch und runter wählen, Pfeile links und rechts oder - und + ändern,
//   Enter schaltet um (Schalter, Auswahl) bzw. löst aus (Knopf), Entf setzt die gewählte Einstellung auf die Vorgabe.
// Reiter "tasten": Pfeile hoch und runter (Bild auf und ab seitenweise) wählen die Aktion, links und rechts eine ihrer
//   Tasten oder den freien Platz dahinter; Enter nimmt eine neue Taste auf (ersetzt die gewählte bzw. kommt hinzu);
//   hat sie schon eine andere Aktion, nennt das Fenster den Konflikt, Enter bestätigt, Esc bricht ab; Entf nimmt die
//   gewählte Taste weg, Rücktaste stellt die Aktion auf die Vorgabe; die letzte Zeile stellt alle Tasten zurück.

import { REITER, EINSTELLUNGEN, einstellungenImReiter, einstellungSchritt, einstellungVorgabe } from "./einstellungskatalog.js";
import { AKTIONEN, GRUPPEN } from "./aktionskatalog.js";
import { aenderbareTasten, konfliktVon, tasteSetzen, tasteEntfernen, aktionAufVorgabe, tasteGesperrt, leereAbweichungen } from "./belegunganpassen.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

export const ALLE_AUF_VORGABE = "alle_auf_vorgabe";
const TASTEN_SEITE = 10;
// Aktionen mit fester Belegung (Umschalt-Kombinationen) stehen nicht auf der Seite
const FESTE_AKTIONEN = (aktion) => aktion === "laufen" || AKTIONEN[aktion].leiste !== undefined;

// Zeilen der Tastenseite: Aktionen in der Reihenfolge der Hilfe, zuletzt "alle auf Vorgabe"
export function tastenZeilen() {
  const zeilen = [];
  for (const gruppe of GRUPPEN) {
    for (const [aktion, eintrag] of Object.entries(AKTIONEN)) if (eintrag.gruppe === gruppe && !FESTE_AKTIONEN(aktion)) zeilen.push(aktion);
  }
  return [...zeilen, ALLE_AUF_VORGABE];
}

export function einstellungsfensterOeffnen(einstellung = null) {
  const reiter = einstellung ? EINSTELLUNGEN[einstellung].reiter : REITER[0];
  const gewaehlt = einstellung ? einstellungenImReiter(reiter).indexOf(einstellung) : 0;
  return { reiter, gewaehlt, tastenStelle: 0, aufnahme: false, konflikt: null, hinweis: null };
}

const zeilenzahl = (reiter) => (reiter === "tasten" ? tastenZeilen().length : einstellungenImReiter(reiter).length);

function reiterWechseln(zustand, richtung) {
  const stelle = (REITER.indexOf(zustand.reiter) + richtung + REITER.length) % REITER.length;
  return { ...einstellungsfensterOeffnen(), reiter: REITER[stelle] };
}

function einstellungenTaste(zustand, taste, kontext) {
  const ids = einstellungenImReiter(zustand.reiter);
  const id = ids[zustand.gewaehlt];
  if (taste.code === "ArrowUp") return { zustand: { ...zustand, gewaehlt: Math.max(0, zustand.gewaehlt - 1) } };
  if (taste.code === "ArrowDown") return { zustand: { ...zustand, gewaehlt: Math.min(ids.length - 1, zustand.gewaehlt + 1) } };
  if (!id) return { zustand };
  const eintrag = EINSTELLUNGEN[id];
  if (taste.code === "ArrowLeft" || taste.zeichen === "-") return { zustand, einstellungen: einstellungSchritt(kontext.einstellungen, id, -1) };
  if (taste.code === "ArrowRight" || taste.zeichen === "+") return { zustand, einstellungen: einstellungSchritt(kontext.einstellungen, id, 1) };
  if (taste.code === "Enter" || taste.code === "NumpadEnter") {
    if (eintrag.art === "knopf") return { zustand, aktion: eintrag.aktion };
    if (eintrag.art === "zahl") return { zustand };
    return { zustand, einstellungen: einstellungSchritt(kontext.einstellungen, id, 1) };
  }
  if (taste.code === "Delete") return eintrag.art === "knopf" ? { zustand } : { zustand, einstellungen: einstellungVorgabe(kontext.einstellungen, kontext.vorgaben, id) };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const stelle = buchstabe ? BUCHSTABEN.indexOf(buchstabe) : -1;
  return { zustand: stelle >= 0 && stelle < ids.length ? { ...zustand, gewaehlt: stelle } : zustand };
}

function tastenTaste(zustand, taste, kontext) {
  const zeilen = tastenZeilen();
  const aktion = zeilen[zustand.gewaehlt];
  const tasten = aktion === ALLE_AUF_VORGABE ? [] : aenderbareTasten(kontext.belegung, aktion);
  const alteTaste = tasten[zustand.tastenStelle] ?? null;
  const ruhig = { ...zustand, hinweis: null };

  // Konflikt: Enter verschiebt die Taste, Esc bricht ab
  if (zustand.konflikt) {
    if (taste.code === "Enter" || taste.code === "NumpadEnter") {
      const { abweichungen } = tasteSetzen(kontext.belegungsVorgabe, kontext.abweichungen, aktion, alteTaste, zustand.konflikt.neueTaste);
      return { zustand: { ...ruhig, konflikt: null, aufnahme: false }, abweichungen };
    }
    return { zustand: { ...ruhig, konflikt: null, aufnahme: false } };
  }
  // Aufnahme: die nächste Taste wird die neue
  if (zustand.aufnahme) {
    if (taste.code === "Escape") return { zustand: { ...ruhig, aufnahme: false } };
    const neueTaste = { code: taste.code, ...(typeof taste.zeichen === "string" && taste.zeichen.length === 1 && { zeichen: taste.zeichen }) };
    if (/^(Shift|Control|Alt|Meta)/.test(taste.code)) return { zustand };
    if (tasteGesperrt(neueTaste)) return { zustand: { ...zustand, hinweis: "gesperrt" } };
    const verdraengt = konfliktVon(kontext.belegung, neueTaste, aktion);
    if (verdraengt) return { zustand: { ...ruhig, konflikt: { neueTaste, verdraengt } } };
    const { abweichungen } = tasteSetzen(kontext.belegungsVorgabe, kontext.abweichungen, aktion, alteTaste, neueTaste);
    return { zustand: { ...ruhig, aufnahme: false }, abweichungen };
  }

  const auswahl = (gewaehlt) => ({ zustand: { ...ruhig, gewaehlt: Math.min(zeilen.length - 1, Math.max(0, gewaehlt)), tastenStelle: 0 } });
  if (taste.code === "ArrowUp") return auswahl(zustand.gewaehlt - 1);
  if (taste.code === "ArrowDown") return auswahl(zustand.gewaehlt + 1);
  if (taste.code === "PageUp") return auswahl(zustand.gewaehlt - TASTEN_SEITE);
  if (taste.code === "PageDown") return auswahl(zustand.gewaehlt + TASTEN_SEITE);
  if (aktion === ALLE_AUF_VORGABE) {
    return taste.code === "Enter" || taste.code === "NumpadEnter" ? { zustand: ruhig, abweichungen: leereAbweichungen() } : { zustand: ruhig };
  }
  // links und rechts über die Tasten der Aktion und den freien Platz dahinter
  if (taste.code === "ArrowLeft") return { zustand: { ...ruhig, tastenStelle: Math.max(0, zustand.tastenStelle - 1) } };
  if (taste.code === "ArrowRight") return { zustand: { ...ruhig, tastenStelle: Math.min(tasten.length, zustand.tastenStelle + 1) } };
  if (taste.code === "Enter" || taste.code === "NumpadEnter") return { zustand: { ...ruhig, aufnahme: true } };
  if (taste.code === "Delete" && alteTaste) return { zustand: { ...ruhig, tastenStelle: 0 }, abweichungen: tasteEntfernen(kontext.belegungsVorgabe, kontext.abweichungen, alteTaste) };
  if (taste.code === "Backspace") return { zustand: { ...ruhig, tastenStelle: 0 }, abweichungen: aktionAufVorgabe(kontext.belegungsVorgabe, kontext.abweichungen, aktion) };
  return { zustand: ruhig };
}

export function einstellungsfensterTaste(zustand, taste, kontext) {
  const inEingabe = zustand.aufnahme || zustand.konflikt;
  if (!inEingabe && taste.code === "Escape") return { zustand: null };
  if (!inEingabe && taste.code === "Tab") return { zustand: reiterWechseln(zustand, taste.umschalt ? -1 : 1) };
  const ergebnis = zustand.reiter === "tasten" ? tastenTaste(zustand, taste, kontext) : einstellungenTaste(zustand, taste, kontext);
  // die gewählte Zeile bleibt in den Grenzen des Reiters
  if (ergebnis.zustand) ergebnis.zustand.gewaehlt = Math.min(ergebnis.zustand.gewaehlt, zeilenzahl(ergebnis.zustand.reiter) - 1);
  return ergebnis;
}

// Klick: { reiter } wechselt den Reiter; { zeile, schritt? } wählt eine Zeile (die schon gewählte wirkt wie Enter,
// schritt -1 oder +1 ändert sie wie links und rechts); auf der Tastenseite { zeile, tastenStelle } wählt eine Taste der
// Aktion (die schon gewählte nimmt wie Enter eine neue auf). Während Aufnahme oder Konflikt zählen Klicks nicht.
export function einstellungsfensterKlick(zustand, ziel, kontext) {
  if (zustand.aufnahme || zustand.konflikt) return { zustand };
  if (ziel.reiter) return { zustand: REITER.includes(ziel.reiter) ? { ...einstellungsfensterOeffnen(), reiter: ziel.reiter } : zustand };
  if (!(ziel.zeile >= 0 && ziel.zeile < zeilenzahl(zustand.reiter))) return { zustand };
  const tastenStelle = ziel.tastenStelle ?? 0;
  const schonGewaehlt = ziel.zeile === zustand.gewaehlt && (zustand.reiter !== "tasten" || tastenStelle === zustand.tastenStelle);
  const gewaehlt = { ...zustand, gewaehlt: ziel.zeile, tastenStelle, hinweis: null };
  if (ziel.schritt) return einstellungsfensterTaste(gewaehlt, { code: ziel.schritt > 0 ? "ArrowRight" : "ArrowLeft" }, kontext);
  if (schonGewaehlt) return einstellungsfensterTaste(gewaehlt, { code: "Enter" }, kontext);
  return { zustand: gewaehlt };
}

fensterartAnmelden("einstellungen", {
  taste: (zustand, taste, kontext) => einstellungsfensterTaste(zustand, taste, kontext),
  klick: (zustand, ziel, kontext) => einstellungsfensterKlick(zustand, ziel, kontext),
});
