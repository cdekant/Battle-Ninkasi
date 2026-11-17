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
];

const register = {};
for (const art of ARTEN) register[art] = new Map();

function art_(art) {
  const r = register[art];
  if (!r) throw new Error(`Unbekannte Registerart "${art}"`);
  return r;
}

export function anmelden(art, name, wert) {
  const r = art_(art);
  if (art === "haken") {
    if (!r.has(name)) r.set(name, []);
    r.get(name).push(wert);
    return;
  }
  if (r.has(name)) throw new Error(`Register ${art}: "${name}" ist schon angemeldet`);
  r.set(name, wert);
}

export function hat(art, name) {
  return art_(art).has(name);
}

export function holen(art, name) {
  const r = art_(art);
  if (!r.has(name)) throw new Error(`Register ${art}: "${name}" ist nicht angemeldet`);
  return r.get(name);
}

// Alle Einträge einer Art in Anmeldereihenfolge
export function alle(art) {
  return [...art_(art).entries()];
}
