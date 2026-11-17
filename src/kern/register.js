// Register: Code meldet hier Bausteine an, Daten verweisen nur per Name darauf.
// Auch Mods melden sich hier an. Reihenfolge der Anmeldung ist die Reihenfolge
// beim Durchlaufen (wichtig für Wiederholbarkeit, z.B. bei Welttick und Haken).

const ARTEN = [
  "befehle",        // Befehlsarten: { pruefen, ausfuehren }
  "bausteine",      // Effekt-Grundbausteine: (spiel, kontext, parameter) => void
  "ki",             // Verhaltensmodule: (spiel, akteur) => befehl
  "zielmuster",     // Zielmuster: (spiel, akteur, parameter) => [{x, y}]
  "welttick",       // Handler der Weltuhr: (spiel) => void
  "zeitereignisse", // Handler für Zeitereignisse: (spiel, daten) => void
  "haken",          // interne Haken, Listen je Name: (spiel, kontext) => void
  "gefahren",       // Gefahrenprüfungen: (vorher, nachher) => true bei neuer Gefahr; Lage aus systeme/gefahr.js
];

const register = {};
for (const art of ARTEN) register[art] = new Map();

function registerDerArt(art) {
  const eintraege = register[art];
  if (!eintraege) throw new Error(`Unbekannte Registerart "${art}"`);
  return eintraege;
}

export function anmelden(art, name, wert) {
  const eintraege = registerDerArt(art);
  if (art === "haken") {
    if (!eintraege.has(name)) eintraege.set(name, []);
    eintraege.get(name).push(wert);
    return;
  }
  if (eintraege.has(name)) throw new Error(`Register ${art}: "${name}" ist schon angemeldet`);
  eintraege.set(name, wert);
}

export function hat(art, name) {
  return registerDerArt(art).has(name);
}

export function holen(art, name) {
  const eintraege = registerDerArt(art);
  if (!eintraege.has(name)) throw new Error(`Register ${art}: "${name}" ist nicht angemeldet`);
  return eintraege.get(name);
}

// Alle Einträge einer Art in Anmeldereihenfolge
export function alle(art) {
  return [...registerDerArt(art).entries()];
}
