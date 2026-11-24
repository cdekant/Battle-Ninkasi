// Handlungen der KI (siehe docs/Wesen.md, KI): was ein jagendes Wesen tut, solange es seine Beute sieht, als Liste an der KI.
// Vorbild: Utility-KI nach Dave Mark (Infinite Axis Utility System), ganzzahlig.
// Daten an der KI:
//   handlungen: [{ handlung, gewicht?, chance?, abstandAb?, abstandBis?, wenn?, bewertung?: [{ eingabe, kurve }], ...Parameter }]
//   kurve: Stützpunkte oder der Name einer Kurve aus regeln.ki.kurven
//   wahl: "erste" (Vorgabe) | "beste" | "gewichtet" | { gewichtetUnterBesten: n }
// Ein Eintrag kommt in Frage, wenn gewicht und chance nicht 0 sind, der Abstand zur Beute (Schachbrett) zwischen
// abstandAb und abstandBis liegt und es ein Ziel gibt, für das die Bedingungen in wenn gelten (Gegenüber ist das Ziel),
// die Wertung über 0 liegt und die Handlung einen Befehl liefert; erst dann wird chance (Prozent) gewürfelt, so bleibt
// die Zahlenfolge des Zufalls von unpassenden Einträgen unberührt.
// Ziele: eine Handlung mit zielwahl (faehigkeit, nutzen) prüft die Beute, das Wesen selbst und die sichtbaren
// Verbündeten nach Abstand und ID, der Eintrag zählt mit seinem besten Ziel (bei Gleichstand dem früheren); jede
// andere Handlung hat die Beute als Ziel.
// Wertung: gewicht (Vorgabe 100) mal je Bewertung den Wert ihrer Kurve an der Stelle der Eingabe, in Promille (0 bis 1000,
// abgeschnitten), abgerundet; ohne Bewertungen ist die Wertung das Gewicht.
// Wahl: "erste" nimmt den ersten Eintrag, der in Frage kommt (die Reihenfolge ist der Vorrang); "beste" den mit der höchsten
// Wertung (bei Gleichstand den früheren); "gewichtet" würfelt nach Wertung unter allen; gewichtetUnterBesten unter den n
// besten. Ein einziger Kandidat würfelt nicht.
// Register "kihandlungen": { parameter, zielwahl?, befehl(spiel, wesen, beute, eintrag, ziel) => Befehl | VERFOLGEN | null },
//   ohne Nebenwirkungen (die Wahl fragt alle Einträge und Ziele); VERFOLGEN heißt: der Beute nachsetzen wie ohne Handlung
//   (ki/verfolgen.js)
// Register "kieingaben": (spiel, wesen, beute, ziel) => ganze Zahl

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
import { zeitkosten } from "../kern/spiel.js";

export const VERFOLGEN = Object.freeze({ verfolgen: true });
export const WAHLREGELN = ["erste", "beste", "gewichtet"];
export const GEWICHT_VORGABE = 100;
const PROMILLE = 1000;

function handlungAnmelden(name, parameter, befehl, zielwahl = false) {
  anmelden("kihandlungen", name, { parameter, zielwahl, befehl });
}

// Grundhandlungen
handlungAnmelden("faehigkeit", { name: "text" }, (spiel, wesen, beute, eintrag, ziel) => faehigkeitsbefehl(spiel, wesen, eintrag.name, ziel, beute), true);
handlungAnmelden("nutzen", { zweck: "text" }, (spiel, wesen, beute, eintrag, ziel) => nutzbefehl(spiel, wesen, eintrag.zweck, ziel, beute), true);
handlungAnmelden("abstand_halten", { abstand: "ganzzahl" }, (spiel, wesen, beute, eintrag) => {
  // zu nah: zurückweichen (in die Ecke gedrängt kein Befehl, dann greift es an); genau richtig: warten; zu weit: null
  const entfernung = abstand(wesen.position, beute.position);
  if (entfernung === eintrag.abstand) return abwarten();
  if (entfernung > eintrag.abstand) return null;
  const richtung = schrittWeg(spiel, wesen, beute.position);
  return richtung ? { art: "bewegen", ...richtung } : null;
});
// Fliehen nur vor Langsameren (siehe docs/Grundlagen.md, Zeit und Tempo): wer nicht schneller ist, nimmt die nächste Handlung
handlungAnmelden("fliehen", {}, (spiel, wesen, beute) => {
  if (zeitkosten(spiel, wesen, "bewegen") >= zeitkosten(spiel, beute, "bewegen")) return null;
  const richtung = schrittWeg(spiel, wesen, beute.position);
  return richtung ? { art: "bewegen", ...richtung } : null;
});
handlungAnmelden("warten", {}, () => abwarten());
handlungAnmelden("verfolgen", {}, () => VERFOLGEN);

// Eingaben
const lebt = (entitaet) => (entitaet.werte?.[lebenswertName(entitaet)]?.aktuell ?? 1) > 0;
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
anmelden("kieingaben", "zielLpProzent", (spiel, wesen, beute, ziel = beute) => lpProzent(spiel, ziel));
anmelden("kieingaben", "feindeInSicht", (spiel, wesen) => sichtbareNach(spiel, wesen, "feinde"));
anmelden("kieingaben", "verbuendeteInSicht", (spiel, wesen) => sichtbareNach(spiel, wesen, "verbuendete"));

// Stützpunkte einer Kurve der Bewertung: angegeben oder benannt (regeln.ki.kurven)
export const kurveAufloesen = (spiel, kurve) => (typeof kurve === "string" ? spiel.daten.regeln.ki.kurven[kurve] : kurve);

// Wertung eines Eintrags gegen ein Ziel (Vorgabe die Beute), ganze Zahl >= 0
export function wertung(spiel, wesen, beute, eintrag, ziel = beute) {
  let ergebnis = eintrag.gewicht ?? GEWICHT_VORGABE;
  for (const { eingabe, kurve } of eintrag.bewertung || []) {
    const stelle = holen("kieingaben", eingabe)(spiel, wesen, beute, ziel);
    const promille = Math.min(PROMILLE, Math.max(0, wertAufKurve(kurveAufloesen(spiel, kurve), stelle)));
    ergebnis = Math.floor((ergebnis * promille) / PROMILLE);
  }
  return ergebnis;
}

// Mögliche Ziele einer Handlung mit zielwahl: die Beute, das Wesen selbst, dann die lebenden sichtbaren Verbündeten
// nach Abstand (Schachbrett) und ID
function moeglicheZiele(spiel, wesen, beute) {
  const sicht = { id: wesen.id, fraktion: fraktionVon(wesen) ?? null };
  const verbuendete = kandidatenInSicht(spiel, wesen)
    .filter((kandidat) => kandidat.id !== wesen.id && kandidat.id !== beute.id && kandidat.position && lebt(kandidat)
      && trifftZu(spiel, "verbuendete", sicht, kandidat) && sieht(spiel, wesen, kandidat))
    .sort((erster, zweiter) => abstand(wesen.position, erster.position) - abstand(wesen.position, zweiter.position) || erster.id - zweiter.id);
  return beute.id === wesen.id ? [wesen, ...verbuendete] : [beute, wesen, ...verbuendete];
}

// Befehl eines Eintrags und seine Wertung gegen sein bestes Ziel, oder null, wenn er nicht in Frage kommt (ohne den Wurf
// um chance); zieleHolen liefert die möglichen Ziele, einmal je Wahl berechnet
function bewerten(spiel, wesen, beute, eintrag, zieleHolen) {
  if (eintrag.chance === 0 || eintrag.gewicht === 0) return null;
  const entfernung = abstand(wesen.position, beute.position);
  if (eintrag.abstandAb !== undefined && entfernung < eintrag.abstandAb) return null;
  if (eintrag.abstandBis !== undefined && entfernung > eintrag.abstandBis) return null;
  const handlung = holen("kihandlungen", eintrag.handlung);
  let bester = null;
  for (const ziel of handlung.zielwahl ? zieleHolen() : [beute]) {
    if (!bedingungenErfuellt(spiel, wesen, eintrag.wenn, { gegenueberId: ziel.id })) continue;
    const punkte = wertung(spiel, wesen, beute, eintrag, ziel);
    if (punkte <= 0 || (bester && punkte <= bester.punkte)) continue;
    const befehl = handlung.befehl(spiel, wesen, beute, eintrag, ziel);
    if (befehl) bester = { befehl, punkte };
  }
  return bester;
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

// Befehl (oder VERFOLGEN) der gewählten Handlung, oder null, wenn keine in Frage kommt
export function handlungWaehlen(spiel, wesen, ki, beute) {
  const handlungen = ki.handlungen || [];
  const wahl = ki.wahl ?? "erste";
  let ziele = null;
  const zieleHolen = () => (ziele ??= moeglicheZiele(spiel, wesen, beute));
  if (wahl === "erste") {
    for (const eintrag of handlungen) {
      const kandidat = bewerten(spiel, wesen, beute, eintrag, zieleHolen);
      if (kandidat && chanceGelingt(spiel, eintrag)) return kandidat.befehl;
    }
    return null;
  }
  const kandidaten = [];
  for (const eintrag of handlungen) {
    const kandidat = bewerten(spiel, wesen, beute, eintrag, zieleHolen);
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
