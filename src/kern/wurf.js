// Würfe im Spiel über eine tauschbare Quelle (siehe docs/Architektur.md, Zufall und Wiederholbarkeit).
// Jeder Wurf während des Spiels läuft über diese Funktionen statt über spiel.zustand.zufallszustand, damit eine Simulation
// (Vorschau) gegen einen fremden Zufall oder feste Grenzen würfeln kann und nicht verrät, was gleich wirklich fällt.
// Jeder Wurf trägt einen kurzen Namen (z.B. "treffer", "blocken", "kritisch", "schaden"), über den eine Simulation
// einzelne Chancen festlegen kann.
//
// Quelle: spiel.wurfquelle, ein Laufzeitfeld außerhalb des Zustands (nicht gespeichert)
//   fehlt | { art: "zufall" }                               der echte Spiel-Zufall (spiel.zustand.zufallszustand)
//   { art: "fremd", zufallszustand }                        ein eigener Zufallszustand (aus zufallErzeugen)
//   { art: "grenzen", mengen, chancen?, zufallszustand }    mengen "kleinste" | "groesste" für Würfel und Ganzzahlen,
//                                                           chancen { name: true | false } legt Chancen fest; Chancen
//                                                           ohne Festlegung und Auswahlen würfeln aus zufallszustand
// Im echten Spiel rufen die Funktionen genau die Funktionen aus kern/zufall.js in derselben Reihenfolge, die Zahlenfolge
// bleibt also gleich. Wo ein sicherer Fall nicht würfelt, entscheidet der Aufrufer wie bisher.

import { zufallsGanzzahl, mitProzentChance, mitAnteil, wuerfeln, wuerfelSpanne } from "./zufall.js";

const ARTEN = ["zufall", "fremd", "grenzen"];
const MENGEN = ["kleinste", "groesste"];

function quelleVon(spiel) {
  const quelle = spiel.wurfquelle;
  if (!quelle || quelle.art === "zufall") return null;
  if (!ARTEN.includes(quelle.art)) throw new Error(`Unbekannte Wurfquelle "${quelle.art}"`);
  if (!Array.isArray(quelle.zufallszustand)) throw new Error(`Wurfquelle "${quelle.art}" ohne zufallszustand`);
  if (quelle.art === "grenzen" && !MENGEN.includes(quelle.mengen)) throw new Error(`Wurfquelle "grenzen" mit unbekannten mengen "${quelle.mengen}"`);
  return quelle;
}

function namePruefen(name) {
  if (typeof name !== "string" || name === "") throw new Error("Wurf ohne Namen");
}

// Zufallszustand, aus dem gewürfelt wird: der echte oder der der fremden Quelle
function zufallszustandVon(spiel, quelle) {
  return quelle ? quelle.zufallszustand : spiel.zustand.zufallszustand;
}

// Festgelegte Chance (true | false) oder undefined
function festgelegt(quelle, name) {
  return quelle?.art === "grenzen" ? quelle.chancen?.[name] : undefined;
}

// Ganze Zahl von min bis max (beide eingeschlossen); in "grenzen" min oder max
export function wurfGanzzahl(spiel, name, min, max) {
  namePruefen(name);
  const quelle = quelleVon(spiel);
  if (quelle?.art === "grenzen") return quelle.mengen === "kleinste" ? min : Math.max(min, max);
  return zufallsGanzzahl(zufallszustandVon(spiel, quelle), min, max);
}

// Würfelausdruck wie "1W6+2"; in "grenzen" der kleinste oder größte Wurf
export function wurfWuerfel(spiel, name, ausdruck) {
  namePruefen(name);
  const quelle = quelleVon(spiel);
  if (quelle?.art === "grenzen") {
    const { kleinster, groesster } = wuerfelSpanne(ausdruck);
    return quelle.mengen === "kleinste" ? kleinster : groesster;
  }
  return wuerfeln(zufallszustandVon(spiel, quelle), ausdruck);
}

// true mit einer Wahrscheinlichkeit von prozent (0 bis 100); in "grenzen" nach chancen, sonst gewürfelt
export function wurfProzent(spiel, name, prozent) {
  namePruefen(name);
  const quelle = quelleVon(spiel);
  const fest = festgelegt(quelle, name);
  if (fest !== undefined) return fest;
  return mitProzentChance(zufallszustandVon(spiel, quelle), prozent);
}

// true mit einer Wahrscheinlichkeit von zaehler / nenner (exakt, sichere Fälle würfeln nicht); in "grenzen" nach chancen
export function wurfAnteil(spiel, name, zaehler, nenner) {
  namePruefen(name);
  const quelle = quelleVon(spiel);
  const fest = festgelegt(quelle, name);
  if (fest !== undefined) return fest;
  return mitAnteil(zufallszustandVon(spiel, quelle), zaehler, nenner);
}

// Ein Eintrag aus einer Liste in fester Reihenfolge (undefined bei leerer Liste); auch in "grenzen" gewürfelt,
// denn eine Wahl hat keine Grenze
export function wurfAuswahl(spiel, name, liste) {
  namePruefen(name);
  const quelle = quelleVon(spiel);
  return liste[zufallsGanzzahl(zufallszustandVon(spiel, quelle), 0, liste.length - 1)];
}

// Führt funktion mit einer anderen Wurfquelle aus und stellt die vorige danach wieder her; gibt ihr Ergebnis zurück
export function mitWurfquelle(spiel, wurfquelle, funktion) {
  const vorher = spiel.wurfquelle;
  spiel.wurfquelle = wurfquelle;
  try {
    return funktion();
  } finally {
    spiel.wurfquelle = vorher;
  }
}
