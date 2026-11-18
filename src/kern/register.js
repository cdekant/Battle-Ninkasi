// Register: Code meldet hier Bausteine an, Daten verweisen nur per Name darauf.
// Auch Mods melden sich hier an. Reihenfolge der Anmeldung ist die Reihenfolge
// beim Durchlaufen (wichtig für Wiederholbarkeit, z.B. bei Welttick und Haken).
// Haken laufen nach Rang (kleiner zuerst, Vorgabe 100), bei gleichem Rang nach Anmeldung;
// nur Haken aus dem Katalog (kern/hakenkatalog.js) sind zulässig.

import { HAKENKATALOG } from "./hakenkatalog.js";

const ARTEN = [
  "befehle",            // Befehlsarten: { pruefen, ausfuehren }
  "bausteine",          // Effekt-Grundbausteine: (spiel, kontext, parameter) => void
  "ki",                 // Verhaltensmodule: (spiel, akteur) => befehl
  "zielmuster",         // Zielmuster: (spiel, auswahl, parameter) => [{x, y}], auswahl = { ursprung, zielpunkt, quelleId }
  "welttick",           // Handler der Weltuhr: (spiel) => void
  "zeitereignisse",     // Handler für Zeitereignisse: (spiel, daten) => void
  "haken",              // interne Haken, Listen je Name: (spiel, kontext) => void
  "gefahren",           // Gefahrenprüfungen: (vorher, nachher) => true bei neuer Gefahr; Lage aus systeme/gefahr.js
  "zustandspruefungen", // Prüfungen nach jedem Vorgang: (spiel) => true, wenn sie etwas verändert haben
];

export const RANG_VORGABE = 100;

const register = {};
for (const art of ARTEN) register[art] = new Map();

function registerDerArt(art) {
  const eintraege = register[art];
  if (!eintraege) throw new Error(`Unbekannte Registerart "${art}"`);
  return eintraege;
}

// optionen: { rang } nur für Haken
export function anmelden(art, name, wert, optionen = {}) {
  const eintraege = registerDerArt(art);
  if (art === "haken") {
    if (!(name in HAKENKATALOG)) throw new Error(`Haken "${name}" steht nicht im Katalog (kern/hakenkatalog.js)`);
    if (!eintraege.has(name)) eintraege.set(name, []);
    const liste = eintraege.get(name);
    const rang = optionen.rang ?? RANG_VORGABE;
    // hinter allen mit kleinerem oder gleichem Rang einfügen, so bleibt die Anmeldereihenfolge erhalten
    const position = liste.findIndex((eintrag) => eintrag.rang > rang);
    liste.splice(position < 0 ? liste.length : position, 0, { rang, handler: wert });
    return;
  }
  if (eintraege.has(name)) throw new Error(`Register ${art}: "${name}" ist schon angemeldet`);
  eintraege.set(name, wert);
}

// Entfernt einen Eintrag; bei Haken genau den angegebenen Handler (für Tests und Mods)
export function abmelden(art, name, wert) {
  const eintraege = registerDerArt(art);
  if (art === "haken") {
    const liste = eintraege.get(name) || [];
    const position = liste.findIndex((eintrag) => eintrag.handler === wert);
    if (position >= 0) liste.splice(position, 1);
    if (liste.length === 0) eintraege.delete(name);
    return;
  }
  eintraege.delete(name);
}

export function hat(art, name) {
  return registerDerArt(art).has(name);
}

// Bei Haken: die Handler in Ausführungsreihenfolge (als neue Liste)
export function holen(art, name) {
  const eintraege = registerDerArt(art);
  if (!eintraege.has(name)) throw new Error(`Register ${art}: "${name}" ist nicht angemeldet`);
  if (art === "haken") return eintraege.get(name).map((eintrag) => eintrag.handler);
  return eintraege.get(name);
}

// Alle Einträge einer Art in Anmeldereihenfolge
export function alle(art) {
  return [...registerDerArt(art).entries()];
}
