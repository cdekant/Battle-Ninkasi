// Inventarfenster (siehe docs/Architektur.md, Eingabe): reine Tastenlogik ohne DOM, damit sie testbar ist.
// Fenster-Zustand der Anzeige (nicht im Spielzustand): null (zu) oder { gewaehlt: null | gegenstandId }.
//   zu:                 Taste I öffnet
//   offen, nichts gewählt: A bis Z wählt den Gegenstand an dieser Stelle des Gepäcks, Esc oder I schließt
//   offen, gewählt:     T trinken, A anlegen oder ablegen (je nachdem), F fallen lassen (der ganze Stapel),
//                       W werfen (schließt und gibt die Auswahl für den Zielmodus zurück, eingabe/zielmodus.js),
//                       Esc zurück zur Auswahl
// Buchstaben gelten nach dem Zeichen der Taste (KeyboardEvent.key), so passen sie zu jeder Tastaturbelegung;
// ohne Zeichen (Tests, Bot) nach dem Tastencode der US-Belegung.

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { istAngelegt } from "../systeme/ausruestung.js";

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
  const ninkasi = spielerin(spiel.zustand);
  const id = (ninkasi.inventar || [])[stelle];
  return id === undefined ? null : entitaetMitId(spiel.zustand, id);
}

// Verarbeitet eine Taste (KeyboardEvent.code, dazu KeyboardEvent.key) bei offenem Fenster; gibt { fenster, befehl?, auswahl? } zurück
export function inventarTaste(fenster, tastencode, spiel, zeichen) {
  if (tastencode === "Escape" || tastencode === "KeyI") return { fenster: fenster.gewaehlt !== null ? { gewaehlt: null } : null };
  const buchstabe = buchstabeDerTaste(tastencode, zeichen);
  if (!buchstabe) return { fenster };
  if (fenster.gewaehlt === null) {
    const gegenstand = gegenstandAnStelle(spiel, BUCHSTABEN.indexOf(buchstabe));
    return { fenster: gegenstand ? { gewaehlt: gegenstand.id } : fenster };
  }
  const ninkasi = spielerin(spiel.zustand);
  if (buchstabe === "t") return { fenster: null, befehl: { art: "trinken", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "w") return { fenster: null, auswahl: { zweck: "werfen", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "f") return { fenster: null, befehl: { art: "fallenlassen", gegenstandId: fenster.gewaehlt } };
  if (buchstabe === "a") {
    const art = istAngelegt(ninkasi, fenster.gewaehlt) ? "ablegen" : "anlegen";
    return { fenster: null, befehl: { art, gegenstandId: fenster.gewaehlt } };
  }
  return { fenster };
}
