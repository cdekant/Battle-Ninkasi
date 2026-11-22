// Handlungen der KI (siehe docs/Wesen.md, KI): was ein jagendes Wesen gegen seine Beute tut, als Liste an der KI.
// Vorbild: Utility-KI nach Dave Mark (Infinite Axis Utility System), ganzzahlig.
// Daten an der KI:
//   handlungen: [{ handlung, gewicht?, chance?, abstandAb?, abstandBis?, wenn?, bewertung?: [{ eingabe, kurve }], ...Parameter }]
//   kurve: Stützpunkte oder der Name einer Kurve aus regeln.ki.kurven
//   wahl: "erste" (Vorgabe) | "beste" | "gewichtet" | { gewichtetUnterBesten: n }
// Ein Eintrag kommt in Frage, wenn gewicht und chance nicht 0 sind, der Abstand zur Beute (Schachbrett) zwischen
// abstandAb und abstandBis liegt, die Bedingungen in wenn gelten (Gegenüber ist die Beute), die Handlung einen Befehl
// liefert und seine Wertung über 0 liegt; erst dann wird chance (Prozent) gewürfelt, so bleibt die Zahlenfolge des Zufalls
// von unpassenden Einträgen unberührt.
// Wertung: gewicht (Vorgabe 100) mal je Bewertung den Wert ihrer Kurve an der Stelle der Eingabe, in Promille (0 bis 1000,
// abgeschnitten), abgerundet; ohne Bewertungen ist die Wertung das Gewicht.
// Wahl: "erste" nimmt den ersten Eintrag, der in Frage kommt (die Reihenfolge ist der Vorrang); "beste" den mit der höchsten
// Wertung (bei Gleichstand den früheren); "gewichtet" würfelt nach Wertung unter allen; gewichtetUnterBesten unter den n
// besten. Ein einziger Kandidat würfelt nicht.
// Register "kihandlungen": { parameter, befehl(spiel, wesen, beute, eintrag) => Befehl | VERFOLGEN | null }, ohne
//   Nebenwirkungen (die Wahl fragt alle Einträge); VERFOLGEN heißt: der Beute nachsetzen wie ohne Handlung (ki/verfolgen.js)
// Register "kieingaben": (spiel, wesen, beute) => ganze Zahl

import { anmelden, holen } from "../kern/register.js";
import { wurfProzent, wurfGanzzahl } from "../kern/wurf.js";
import { bedingungenErfuellt, hoechstwert, lebenswertName } from "../kern/werte.js";
import { wertAufKurve } from "../kern/kurven.js";
import { fraktionVon } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { trifftZu } from "../systeme/zielauswahl.js";
import { sieht, kandidatenInSicht } from "../systeme/sicht.js";
import { abwarten } from "./abwarten.js";
import { schrittWeg } from "./schritte.js";
import { faehigkeitsbefehl } from "./faehigkeitenwahl.js";
import { nutzbefehl } from "./nutzen.js";

export const VERFOLGEN = Object.freeze({ verfolgen: true });
export const WAHLREGELN = ["erste", "beste", "gewichtet"];
export const GEWICHT_VORGABE = 100;
const PROMILLE = 1000;

function handlungAnmelden(name, parameter, befehl) {
  anmelden("kihandlungen", name, { parameter, befehl });
}

// Grundhandlungen
handlungAnmelden("faehigkeit", { name: "text" }, (spiel, wesen, beute, eintrag) => faehigkeitsbefehl(spiel, wesen, eintrag.name, beute));
handlungAnmelden("nutzen", { zweck: "text" }, (spiel, wesen, beute, eintrag) => nutzbefehl(spiel, wesen, eintrag.zweck, beute));
handlungAnmelden("abstand_halten", { abstand: "ganzzahl" }, (spiel, wesen, beute, eintrag) => {
  // zu nah: zurückweichen (in die Ecke gedrängt kein Befehl, dann greift es an); genau richtig: warten; zu weit: null
  const entfernung = abstand(wesen.position, beute.position);
  if (entfernung === eintrag.abstand) return abwarten();
  if (entfernung > eintrag.abstand) return null;
  const richtung = schrittWeg(spiel, wesen, beute.position);
  return richtung ? { art: "bewegen", ...richtung } : null;
});
handlungAnmelden("fliehen", {}, (spiel, wesen, beute) => {
  const richtung = schrittWeg(spiel, wesen, beute.position);
  return richtung ? { art: "bewegen", ...richtung } : null;
});
handlungAnmelden("warten", {}, () => abwarten());
handlungAnmelden("verfolgen", {}, () => VERFOLGEN);

// Eingaben
const lpProzent = (spiel, wesen) => {
  const wert = wesen.werte?.[lebenswertName(wesen)];
  if (!wert) return 100;
  const hoechst = hoechstwert(spiel, wesen, lebenswertName(wesen));
  return hoechst === Infinity || hoechst <= 0 ? 100 : Math.floor((wert.aktuell * 100) / hoechst);
};
const sichtbareNach = (spiel, wesen, trifft) => {
  const sicht = { id: wesen.id, fraktion: fraktionVon(wesen) ?? null };
  return kandidatenInSicht(spiel, wesen).filter((kandidat) => kandidat.id !== wesen.id && kandidat.position
    && trifftZu(spiel, trifft, sicht, kandidat) && sieht(spiel, wesen, kandidat)).length;
};
anmelden("kieingaben", "abstand", (spiel, wesen, beute) => abstand(wesen.position, beute.position));
anmelden("kieingaben", "eigeneLpProzent", (spiel, wesen) => lpProzent(spiel, wesen));
anmelden("kieingaben", "beuteLpProzent", (spiel, wesen, beute) => lpProzent(spiel, beute));
anmelden("kieingaben", "feindeInSicht", (spiel, wesen) => sichtbareNach(spiel, wesen, "feinde"));
anmelden("kieingaben", "verbuendeteInSicht", (spiel, wesen) => sichtbareNach(spiel, wesen, "verbuendete"));

// Stützpunkte einer Kurve der Bewertung: angegeben oder benannt (regeln.ki.kurven)
export const kurveAufloesen = (spiel, kurve) => (typeof kurve === "string" ? spiel.daten.regeln.ki.kurven[kurve] : kurve);

// Wertung eines Eintrags (ganze Zahl >= 0)
export function wertung(spiel, wesen, beute, eintrag) {
  let ergebnis = eintrag.gewicht ?? GEWICHT_VORGABE;
  for (const { eingabe, kurve } of eintrag.bewertung || []) {
    const stelle = holen("kieingaben", eingabe)(spiel, wesen, beute);
    const promille = Math.min(PROMILLE, Math.max(0, wertAufKurve(kurveAufloesen(spiel, kurve), stelle)));
    ergebnis = Math.floor((ergebnis * promille) / PROMILLE);
  }
  return ergebnis;
}

// Befehl eines Eintrags und seine Wertung, oder null, wenn er nicht in Frage kommt (ohne den Wurf um chance)
function bewerten(spiel, wesen, beute, eintrag) {
  if (eintrag.chance === 0 || eintrag.gewicht === 0) return null;
  const entfernung = abstand(wesen.position, beute.position);
  if (eintrag.abstandAb !== undefined && entfernung < eintrag.abstandAb) return null;
  if (eintrag.abstandBis !== undefined && entfernung > eintrag.abstandBis) return null;
  if (!bedingungenErfuellt(spiel, wesen, eintrag.wenn, { gegenueberId: beute.id })) return null;
  const befehl = holen("kihandlungen", eintrag.handlung).befehl(spiel, wesen, beute, eintrag);
  if (!befehl) return null;
  const punkte = wertung(spiel, wesen, beute, eintrag);
  return punkte > 0 ? { befehl, punkte } : null;
}

const chanceGelingt = (spiel, eintrag) => eintrag.chance === undefined || eintrag.chance >= 100 || wurfProzent(spiel, "faehigkeitenwahl", eintrag.chance);

// Gewichtete Wahl unter Kandidaten [{ befehl, punkte }]
function gewichtetWaehlen(spiel, kandidaten) {
  if (kandidaten.length === 1) return kandidaten[0];
  const summe = kandidaten.reduce((gesamt, kandidat) => gesamt + kandidat.punkte, 0);
  let wurf = wurfGanzzahl(spiel, "ki_wahl", 1, summe);
  for (const kandidat of kandidaten) {
    if (wurf <= kandidat.punkte) return kandidat;
    wurf -= kandidat.punkte;
  }
  return kandidaten[kandidaten.length - 1];
}

// Befehl (oder VERFOLGEN) der gewählten Handlung gegen die Beute, oder null, wenn keine in Frage kommt
export function handlungWaehlen(spiel, wesen, ki, beute) {
  const handlungen = ki.handlungen || [];
  const wahl = ki.wahl ?? "erste";
  if (wahl === "erste") {
    for (const eintrag of handlungen) {
      const kandidat = bewerten(spiel, wesen, beute, eintrag);
      if (kandidat && chanceGelingt(spiel, eintrag)) return kandidat.befehl;
    }
    return null;
  }
  const kandidaten = [];
  for (const eintrag of handlungen) {
    const kandidat = bewerten(spiel, wesen, beute, eintrag);
    if (kandidat && chanceGelingt(spiel, eintrag)) kandidaten.push(kandidat);
  }
  if (!kandidaten.length) return null;
  if (wahl === "beste") return kandidaten.reduce((beste, kandidat) => (kandidat.punkte > beste.punkte ? kandidat : beste)).befehl;
  if (wahl === "gewichtet") return gewichtetWaehlen(spiel, kandidaten).befehl;
  // { gewichtetUnterBesten: n }: stabil nach Wertung absteigend, die ersten n
  const besten = kandidaten.map((kandidat, nummer) => ({ ...kandidat, nummer }))
    .sort((erster, zweiter) => zweiter.punkte - erster.punkte || erster.nummer - zweiter.nummer)
    .slice(0, wahl.gewichtetUnterBesten);
  return gewichtetWaehlen(spiel, besten).befehl;
}
