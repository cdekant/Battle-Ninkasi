// Welcher Inhalt geladen wird (siehe docs/Architektur.md, Inhalte als Daten): vorerst das Grundgerüst aus daten/ plus
// der Probeinhalt aus datenproben/, samt Texten. Browser, Werkzeuge und Tests laden Inhalte nur hierüber; entsteht
// echter Inhalt, ändert sich nur diese Datei. Das Namensbuch liest weiter nur daten/index.js.

import grundgeruest from "../daten/index.js";
import probeinhalt from "../datenproben/index.js";
import texteGrund from "../sprache/de/texte.js";
import texteProben from "../sprache/de/proben.js";
import texteGrundEn from "../sprache/en/texte.js";
import { datenZusammenfuegen, namenDesZusatzes } from "./kern/zusammenfuegen.js";

export const rohdaten = datenZusammenfuegen(grundgeruest, probeinhalt);

// Texte je Sprache; Schlüssel des Probeinhalts dürfen keine des Grundgerüsts überdecken. Der Probeinhalt ist nur
// deutsch, im Englischen gelten seine deutschen Texte als Rückfall (src/anzeige/texte.js)
const doppelt = Object.keys(texteProben).filter((schluessel) => schluessel in texteGrund);
if (doppelt.length) throw new Error(`Texte des Probeinhalts gibt es schon: ${doppelt.join(", ")}`);
export const texte = { de: { ...texteGrund, ...texteProben }, en: texteGrundEn };
// Texte des Grundgerüsts je Sprache, für den Vergleich der Sprachen (tests/sprachen.test.js)
export const texteDesGrundgeruests = { de: texteGrund, en: texteGrundEn };

// Namen des Probeinhalts je Sammlung, für das Kompendium (Lücken dort nur als Warnung)
export const probenamen = namenDesZusatzes(probeinhalt);
export const texteDe = texte.de;
// Schlüssel der Texte des Probeinhalts, ebenfalls für das Kompendium
export const probentexte = Object.keys(texteProben);
