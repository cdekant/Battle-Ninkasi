// Inventarfenster (siehe docs/Bedienung.md, Eingabe): reine Tastenlogik ohne DOM, damit sie testbar ist.
// Fenster-Zustand der Anzeige (nicht im Spielzustand): null (zu) oder { gewaehlt: null | gegenstandId, absicht? }.
//   zu:                 Taste i öffnet; d und w öffnen mit absicht "fallenlassen" bzw. "werfen"
//   offen, nichts gewählt: a bis z wählt den Gegenstand an dieser Stelle des Gepäcks, Esc oder i schließt;
//                       mit absicht lässt der Buchstabe den Gegenstand gleich fallen bzw. wirft ihn
//   offen, gewählt:     t trinken, a anlegen oder ablegen (je nachdem), f fallen lassen (der ganze Stapel),
//                       w werfen (schließt und gibt die Auswahl für den Zielmodus zurück, eingabe/zielmodus.js),
//                       eine Ziffer legt die Art auf diesen Platz der aktiven Leiste, Entf nimmt sie von allen Leisten
//                       (ergebnis.leiste, eingabe/schnellleiste.js), Enter die Standardhandlung (trinken, wenn trinkbar,
//                       sonst anlegen oder ablegen, wenn ausrüstbar), Esc zurück zur Auswahl
// Maus (klick mit { stelle }): wählt die Zeile; mit Absicht wirkt sie gleich; die schon gewählte Zeile wirkt wie Enter
// Buchstaben gelten nach dem Zeichen der Taste (KeyboardEvent.key), so passen sie zu jeder Tastaturbelegung;
// ohne Zeichen (Tests, Bot) nach dem Tastencode der US-Belegung.

import { gesteuerteEntitaet, entitaetMitId } from "../kern/zustand.js";
import { istAngelegt } from "../systeme/ausruestung.js";
import { fensterartAnmelden } from "./fenster.js";
import { platzDerTaste } from "./aktionskatalog.js";

export const ABSICHTEN = ["fallenlassen", "werfen"];

export const BUCHSTABEN = "abcdefghijklmnopqrstuvwxyz";

// Buchstabe a bis z einer Taste oder null; zeichen ist KeyboardEvent.key
export function buchstabeDerTaste(tastencode, zeichen) {
  if (typeof zeichen === "string" && zeichen.length === 1) {
    const klein = zeichen.toLowerCase();
    return BUCHSTABEN.includes(klein) ? klein : null;
  }
  return /^Key([A-Z])$/.exec(tastencode)?.[1]?.toLowerCase() ?? null;
}

// Gegenstand an einer Stelle des Gepäcks (Reihenfolge des Inventars) oder null
export function gegenstandAnStelle(spiel, stelle) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  const id = (gesteuerte.inventar || [])[stelle];
  return id === undefined ? null : entitaetMitId(spiel.zustand, id);
}

// Verarbeitet eine Taste (KeyboardEvent.code, dazu KeyboardEvent.key) bei offenem Fenster;
// gibt { fenster, befehl?, auswahl?, leiste? } zurück
export function inventarTaste(fenster, tastencode, spiel, zeichen, belegung) {
  if (tastencode === "Escape" || tastencode === "KeyI") return { fenster: fenster.gewaehlt !== null ? { gewaehlt: null } : null };
  if (fenster.gewaehlt !== null && (tastencode === "Enter" || tastencode === "NumpadEnter")) return standardhandlung(fenster, spiel);
  if (fenster.gewaehlt !== null) {
    const typ = entitaetMitId(spiel.zustand, fenster.gewaehlt)?.typ;
    if (typ && (tastencode === "Delete" || tastencode === "Backspace")) return { fenster, leiste: { entfernen: { art: "gegenstand", typ } } };
    const stelle = typ && belegung ? platzDerTaste(belegung, tastencode) : null;
    if (stelle !== null) return { fenster, leiste: { belegen: { stelle, platz: { art: "gegenstand", typ } } } };
  }
  const buchstabe = buchstabeDerTaste(tastencode, zeichen);
  if (!buchstabe) return { fenster };
  if (fenster.gewaehlt === null) {
    const gegenstand = gegenstandAnStelle(spiel, BUCHSTABEN.indexOf(buchstabe));
    if (!gegenstand) return { fenster };
    if (fenster.absicht === "werfen") return { fenster: null, auswahl: { zweck: "werfen", gegenstandId: gegenstand.id } };
    if (fenster.absicht === "fallenlassen") return { fenster: null, befehl: { art: "fallenlassen", gegenstandId: gegenstand.id } };
    return { fenster: { gewaehlt: gegenstand.id } };
  }
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  if (buchstabe === "t") return { fenster: null, befehl: { art: "trinken", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "w") return { fenster: null, auswahl: { zweck: "werfen", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "f") return { fenster: null, befehl: { art: "fallenlassen", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "a") {
    const art = istAngelegt(gesteuerte, fenster.gewaehlt) ? "ablegen" : "anlegen";
    return { fenster: null, befehl: { art, gegenstandId: fenster.gewaehlt } };
  }
  return { fenster };
}

// Enter auf einem gewählten Gegenstand: trinken, wenn trinkbar, sonst anlegen oder ablegen, wenn ausrüstbar
function standardhandlung(fenster, spiel) {
  const gegenstand = entitaetMitId(spiel.zustand, fenster.gewaehlt);
  if (!gegenstand) return { fenster };
  if (gegenstand.trinkbar) return { fenster: null, befehl: { art: "trinken", gegenstandId: gegenstand.id } };
  if (gegenstand.ausruestung) {
    const art = istAngelegt(gesteuerteEntitaet(spiel.zustand), gegenstand.id) ? "ablegen" : "anlegen";
    return { fenster: null, befehl: { art, gegenstandId: gegenstand.id } };
  }
  return { fenster };
}

// Klick auf eine Zeile des Gepäcks; gibt dasselbe zurück wie inventarTaste
export function inventarKlick(fenster, ziel, spiel, belegung) {
  const gegenstand = gegenstandAnStelle(spiel, ziel.stelle);
  if (!gegenstand) return { fenster };
  if (fenster.gewaehlt === gegenstand.id) return standardhandlung(fenster, spiel);
  const buchstabe = BUCHSTABEN[ziel.stelle];
  if (fenster.gewaehlt === null && buchstabe) return inventarTaste(fenster, `Key${buchstabe.toUpperCase()}`, spiel, buchstabe, belegung);
  return { fenster: { ...fenster, gewaehlt: gegenstand.id } };
}

// Als Fensterart im Fensterstapel (eingabe/fenster.js); Zustand { gewaehlt }
fensterartAnmelden("inventar", {
  taste(zustand, taste, { spiel, belegung }) {
    const { fenster, befehl, auswahl, leiste } = inventarTaste(zustand, taste.code, spiel, taste.zeichen, belegung);
    return { zustand: fenster, ...(befehl && { befehl }), ...(auswahl && { auswahl }), ...(leiste && { leiste }) };
  },
  klick(zustand, ziel, { spiel, belegung }) {
    const { fenster, befehl, auswahl, leiste } = inventarKlick(zustand, ziel, spiel, belegung);
    return { zustand: fenster, ...(befehl && { befehl }), ...(auswahl && { auswahl }), ...(leiste && { leiste }) };
  },
});
