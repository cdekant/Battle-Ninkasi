// Register: Code meldet hier Bausteine an, Daten verweisen nur per Name darauf.
// Auch Mods melden sich hier an. Reihenfolge der Anmeldung ist die Reihenfolge
// beim Durchlaufen (wichtig für Wiederholbarkeit, z.B. bei Welttick und Haken).
// Haken laufen nach Rang (kleiner zuerst, Vorgabe 100), bei gleichem Rang nach Anmeldung;
// nur Haken aus dem Katalog (kern/hakenkatalog.js) sind zulässig.

import { HAKENKATALOG } from "./hakenkatalog.js";

const ARTEN = [
  "befehle",            // Befehlsarten: { pruefen, ausfuehren }
  "bausteine",          // Effekt-Grundbausteine: (spiel, kontext, parameter) => void
  "ki",                 // Verhaltensmodule: (spiel, akteur, ki) => befehl; ki ist die wirksame KI-Komponente (siehe kiVon)
  "modifikatorquellen", // Quellen der Modifikatoren: (spiel, entitaet) => [modifikator], bei jeder Abfrage gesammelt
  "faehigkeitsquellen", // Quellen gewährter Fähigkeiten: (spiel, wesen) => [{ faehigkeit, quelle, gegenstandId? | zustand? }] (systeme/faehigkeiten.js)
  "modifikatorbedingungen", // Bedingungen am Modifikator: (spiel, entitaet, parameter, umstaende) => true, wenn er gilt
  "befehlsveraenderer", // Veränderer aus Zuständen: (spiel, akteur, befehl, parameter, staerkeProzent) => befehl
  "zielmuster",         // Zielmuster: (spiel, auswahl, parameter) => [{x, y}], auswahl = { ursprung, zielpunkt, quelleId }
  "welttick",           // Handler der Weltuhr: (spiel) => void
  "zeitereignisse",     // Handler für Zeitereignisse: (spiel, daten) => void
  "haken",              // interne Haken, Listen je Name: (spiel, kontext) => void
  "gefahren",           // Gefahrenprüfungen: (vorher, nachher) => true bei neuer Gefahr; Lage aus systeme/gefahr.js
  "zustandspruefungen", // Prüfungen nach jedem Vorgang: (spiel) => true, wenn sie etwas verändert haben
  "laufendeaktionen",   // Arten langer Aktionen: { schrittkosten, abschliessen, abbrechen } (systeme/laufendeAktionen.js)
  "beimErzeugen",       // nach dem Erzeugen jeder Entität: (zustand, entitaet) => void, z.B. Verderben einplanen, Etikett
  "ausDaten",           // nach dem Erzeugen aus Daten (kern/zustand.js ausDatenErzeugen): (spiel, entitaet, datensatz) => void, z.B. Ausstattung
  "ausloeserquellen",   // weitere Auslöser einer Entität nach Zuständen und Ausrüstung: (spiel, entitaet) => [{ ausloeser, schluessel }]
  "ersatzquellen",      // weitere Ersatzwirkungen einer Entität nach dem Gepäck (systeme/ersatz.js): (spiel, entitaet) => [{ eintrag, schluessel, gegenstandId? | zustand?, verbrauchen(kettentiefe) }]
  "lernanlaesse",       // Lernanlässe der Skills (systeme/lernen.js): { beschreibung }; Daten nennen sie in lernt
  "planschritte",       // Schritte des Plans des Laufs (welt/plan.js): (spiel, plan, zufall) => void, beim Start nacheinander
  "laufbeginn",         // beim Start nach dem Einrichten Ninkasis (kern/spiel.js neuesSpiel): (spiel, ninkasi) => void, z.B. Arena
  "ebenenschritte",     // Schritte der Ebenenerzeugung (welt/ebene.js): { braucht, liefert, verwirft?, ausfuehren(spiel, bau) }
  "mitnehmen",          // wer beim Ebenenwechsel mitkommt (systeme/ebenen.js): (spiel, ninkasi, wechsel) => [id]
  "kihandlungen",       // Handlungen der KI (ki/handlungen.js): { parameter, zielwahl?, befehl(spiel, wesen, beute, eintrag, ziel) }
  "kieingaben",         // Eingaben der Bewertung (ki/handlungen.js): (spiel, wesen, beute, ziel) => ganze Zahl
  "nutzungen",          // wie die KI einen Gegenstand nutzt (ki/nutzen.js): { feld, ziel, befehl(spiel, wesen, ziel, gegenstand) }
  "sinne",              // Arten der Wahrnehmung (systeme/sinne.js): { art, reichweite(spiel, betrachter), nimmtWahr(spiel, betrachter, ziel) }; die Anmeldereihenfolge ist der Vorrang
];

export const RANG_VORGABE = 100;

const register = {};
for (const art of ARTEN) register[art] = new Map();

// Vorrat der Listen, die holen (Haken) und alle liefern: sie werden bei jedem Vorgang viele Male gebraucht und erst
// bei einer An- oder Abmeldung neu gebildet; die Listen sind eingefroren, Aufrufer dürfen sie nicht verändern
const vorrat = new Map();

function ausDemVorrat(schluessel, bilden) {
  if (!vorrat.has(schluessel)) vorrat.set(schluessel, Object.freeze(bilden()));
  return vorrat.get(schluessel);
}

function registerDerArt(art) {
  const eintraege = register[art];
  if (!eintraege) throw new Error(`Unbekannte Registerart "${art}"`);
  return eintraege;
}

// optionen: { rang } nur für Haken
export function anmelden(art, name, wert, optionen = {}) {
  const eintraege = registerDerArt(art);
  vorrat.clear();
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
  vorrat.clear();
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

// Bei Haken: die Handler in Ausführungsreihenfolge (eingefrorene Liste aus dem Vorrat)
export function holen(art, name) {
  const eintraege = registerDerArt(art);
  if (!eintraege.has(name)) throw new Error(`Register ${art}: "${name}" ist nicht angemeldet`);
  if (art === "haken") return ausDemVorrat(`haken:${name}`, () => eintraege.get(name).map((eintrag) => eintrag.handler));
  return eintraege.get(name);
}

// Alle Einträge einer Art in Anmeldereihenfolge (eingefrorene Liste aus dem Vorrat)
export function alle(art) {
  return ausDemVorrat(`alle:${art}`, () => [...registerDerArt(art).entries()]);
}
