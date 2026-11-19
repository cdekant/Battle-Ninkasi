// Verschieben von Wesen (siehe docs/Architektur.md, Bewegung): Bausteine stossen, ziehen, tauschen, teleportieren
// und die Zustandsprüfung "lage" für Wesen auf Feldern, die sie nicht betreten können.
//   stossen:       { weite, wuerfel|menge, art? } schiebt das Ziel weg vom Ursprung, entlang der verlängerten Linie
//                  vom Ursprung durch das Ziel (bei einem Schlag die Angreiferin, bei einer Explosion die Mitte);
//                  liegt der Ursprung auf dem Ziel (Geschoss, Fähigkeit auf ein Wesen), zählt die Position der Quelle.
//                  Ein Hindernis (fest für das Ziel, ein Wesen, der Kartenrand) hält auf: Aufprall mit
//                  wuerfel|menge je verbliebenem Feld als Schaden (art, Vorgabe "stumpf", Tag "aufprall") am Ziel,
//                  ein Wesen als Hindernis bekommt denselben Schaden. Gelände, das das Ziel nicht betreten kann, aber
//                  nicht fest ist (Abgrund, Wasser), hält nicht auf: das Ziel landet darin und die Lageprüfung folgt.
//   ziehen:        { weite } holt das Ziel zum Ursprung hin, höchstens bis daneben; Hindernisse halten ohne Schaden auf
//   tauschen:      {} Quelle und Ziel tauschen die Plätze, wenn jedes das Feld des anderen betreten kann
//   teleportieren: { wer?, muster?, zufaellig? } versetzt das Ziel (wer: "quelle" die Quelle, z.B. Blinzeln)
//                  ohne Angabe auf das Zielfeld, mit muster auf ein zufälliges freies Feld des Musters
//                  (vom Ursprung zum Zielfeld), mit zufaellig: true auf ein zufälliges freies Feld der Ebene;
//                  ist das Zielfeld besetzt oder nicht betretbar, auf das nächste freie (Breitensuche)
// Unbewegliche Wesen lassen sich mit keinem dieser Bausteine bewegen. Frei heißt: betretbar und ohne anderes Wesen.
// Lage (Zustandsprüfung nach jedem Vorgang, nur für vorgemerkte Wesen, kern/raumindex.js): steht ein lebendes Wesen auf einem Feld, das es mit seiner wirksamen
// Bewegungsart nicht betreten kann (Phasen endet in der Wand, Levitation über dem Abgrund, hineingestoßen), wirkt
// beimFestsitzen des Geländes (Vorgabe regeln.bewegung.beimFestsitzen) auf das Wesen; lebt es danach noch, wird es
// auf das nächste freie Feld gedrückt (Meldung "herausgedrueckt"). Gibt es kein freies Feld, passiert nichts.

import { anmelden, holen } from "../kern/register.js";
import { bausteinAnmelden, mengeBestimmen } from "../kern/bausteine.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { zufallsGanzzahl } from "../kern/zufall.js";
import { istWesen, bewegungVon } from "../kern/zustand.js";
import { lageOffenEntnehmen } from "../kern/raumindex.js";
import { lebenswertName } from "../kern/werte.js";
import { aufDerKarte, betretbar, betretbarFuer, fest, gelaendeAuf, gelaendeName } from "../welt/karte.js";
import { gleichesFeld, linie, verlaengerung, wesenAufFeld } from "../welt/geometrie.js";
import { naechstesFeldMit } from "../welt/wege.js";
import { versetzen, istUnbeweglich } from "./bewegung.js";
import { musterFelder } from "./zielauswahl.js";

const feldKopie = (feld) => ({ x: feld.x, y: feld.y });

// Ob ein Wesen auf das Feld kann: betretbar und kein anderes Wesen darauf
function freiFuer(spiel, wesen, feld) {
  return betretbar(spiel, wesen, feld) && !wesenAufFeld(spiel, feld).some((anderes) => anderes.id !== wesen.id);
}

// Was eine Verschiebung aufhält: { art: "rand" | "fest" } oder { art: "wesen", wesen }; null, wenn nichts
function hindernisFuer(spiel, wesen, feld) {
  if (!aufDerKarte(spiel.zustand.ebene, feld.x, feld.y)) return { art: "rand" };
  const anderes = wesenAufFeld(spiel, feld).find((kandidat) => kandidat.id !== wesen.id);
  if (anderes) return { art: "wesen", wesen: anderes };
  if (fest(spiel, feld.x, feld.y) && !betretbar(spiel, wesen, feld)) return { art: "fest" };
  return null;
}

// Das bewegliche Ziel eines Effekts oder null
function bewegbaresZiel(spiel, kontext) {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  return ziel?.position && istWesen(ziel) && !istUnbeweglich(ziel) ? ziel : null;
}

// Bezugspunkt für Stoßen und Ziehen: der Ursprung, liegt er auf dem Ziel, die Position der Quelle
function bezugspunkt(spiel, kontext, ziel) {
  const quelle = spiel.zustand.entitaeten[kontext.quelleId];
  const ursprung = kontext.ursprung;
  if (ursprung && !gleichesFeld(ursprung, ziel.position)) return ursprung;
  return quelle?.position && !gleichesFeld(quelle.position, ziel.position) ? quelle.position : null;
}

const versetzoptionen = (kontext) => ({ urheberId: kontext.urheberId ?? kontext.quelleId ?? undefined, kettentiefe: kontext.kettentiefe });

// Schiebt das Ziel Feld für Feld; endet am Hindernis oder, ohne Aufprall, in Gelände, das es nicht betreten kann.
// Gibt { bewegt, hindernis } zurück.
function schieben(spiel, kontext, ziel, felder, art) {
  let bewegt = 0;
  for (const feld of felder) {
    const hindernis = hindernisFuer(spiel, ziel, feld);
    if (hindernis) return { bewegt, hindernis };
    versetzen(spiel, ziel, feld, art, versetzoptionen(kontext));
    bewegt++;
    if (!betretbar(spiel, ziel, feld)) break;
  }
  return { bewegt, hindernis: null };
}

bausteinAnmelden("stossen", { weite: "ganzzahl", wuerfel: "wuerfel|menge", art: "schadensart?" }, (spiel, kontext, parameter) => {
  const ziel = bewegbaresZiel(spiel, kontext);
  const bezug = ziel && bezugspunkt(spiel, kontext, ziel);
  if (!bezug) return;
  const von = feldKopie(ziel.position);
  const { bewegt, hindernis } = schieben(spiel, kontext, ziel, verlaengerung(bezug, ziel.position, parameter.weite), "stoss");
  const verbleibend = parameter.weite - bewegt;
  const aufprall = hindernis && verbleibend > 0 ? hindernis.art : null;
  melden(spiel, "gestossen", { wer: bezugAuf(ziel), von, nach: feldKopie(ziel.position), felder: bewegt, aufprall });
  if (!aufprall) return;
  const schaden = holen("bausteine", "schaden");
  const aufprallParameter = { art: parameter.art ?? "stumpf", menge: mengeBestimmen(spiel, kontext, parameter) * verbleibend };
  const aufprallKontext = { ...kontext, tags: [...kontext.tags, "aufprall"] };
  schaden(spiel, { ...aufprallKontext, zielId: ziel.id }, aufprallParameter);
  if (hindernis.art === "wesen" && spiel.zustand.entitaeten[hindernis.wesen.id]) schaden(spiel, { ...aufprallKontext, zielId: hindernis.wesen.id }, aufprallParameter);
}, { brauchtZiel: true });

bausteinAnmelden("ziehen", { weite: "ganzzahl" }, (spiel, kontext, parameter) => {
  const ziel = bewegbaresZiel(spiel, kontext);
  const bezug = ziel && bezugspunkt(spiel, kontext, ziel);
  if (!bezug) return;
  const von = feldKopie(ziel.position);
  // ohne das Startfeld und ohne den Bezugspunkt selbst
  const felder = linie(ziel.position, bezug).slice(1, -1).slice(0, parameter.weite);
  const { bewegt } = schieben(spiel, kontext, ziel, felder, "zug");
  if (bewegt) melden(spiel, "gezogen", { wer: bezugAuf(ziel), von, nach: feldKopie(ziel.position), felder: bewegt });
}, { brauchtZiel: true });

bausteinAnmelden("tauschen", {}, (spiel, kontext) => {
  const ziel = bewegbaresZiel(spiel, kontext);
  const quelle = spiel.zustand.entitaeten[kontext.quelleId];
  if (!ziel || !quelle?.position || quelle.id === ziel.id || istUnbeweglich(quelle)) return;
  const feldDerQuelle = feldKopie(quelle.position), feldDesZiels = feldKopie(ziel.position);
  if (!betretbar(spiel, quelle, feldDesZiels) || !betretbar(spiel, ziel, feldDerQuelle)) return;
  versetzen(spiel, quelle, feldDesZiels, "tausch", versetzoptionen(kontext));
  versetzen(spiel, ziel, feldDerQuelle, "tausch", versetzoptionen(kontext));
  melden(spiel, "getauscht", { wer: bezugAuf(quelle), mit: bezugAuf(ziel) });
}, { brauchtZiel: true });

// Zufälliges Feld aus einer Liste in fester Reihenfolge oder null
function zufallsfeld(spiel, felder) {
  if (!felder.length) return null;
  return felder[zufallsGanzzahl(spiel.zustand.zufallszustand, 0, felder.length - 1)];
}

function teleportziel(spiel, kontext, wesen, parameter) {
  const ebene = spiel.zustand.ebene;
  const frei = (feld) => !gleichesFeld(feld, wesen.position) && freiFuer(spiel, wesen, feld);
  if (parameter.zufaellig) {
    const felder = [];
    for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) if (frei({ x, y })) felder.push({ x, y });
    return zufallsfeld(spiel, felder);
  }
  if (parameter.muster) {
    const ursprung = kontext.ursprung ?? wesen.position;
    const auswahl = { ursprung, zielpunkt: kontext.zielfeld ?? ursprung, quelleId: kontext.quelleId };
    return zufallsfeld(spiel, musterFelder(spiel, parameter.muster, auswahl).filter(frei));
  }
  const zielfeld = kontext.zielfeld;
  if (!zielfeld || gleichesFeld(zielfeld, wesen.position)) return null;
  if (frei(zielfeld)) return feldKopie(zielfeld);
  return naechstesFeldMit(spiel, zielfeld, (x, y) => frei({ x, y }), { bewegung: "phasend" });
}

bausteinAnmelden("teleportieren", { wer: ["ziel", "quelle"], muster: "muster?", zufaellig: "wahrheitswert?" }, (spiel, kontext, parameter) => {
  const entitaeten = spiel.zustand.entitaeten;
  const wesen = parameter.wer === "quelle" ? entitaeten[kontext.quelleId] : entitaeten[kontext.zielId];
  if (!wesen?.position || !istWesen(wesen) || istUnbeweglich(wesen)) return;
  const feld = teleportziel(spiel, kontext, wesen, parameter);
  if (!feld) return;
  const von = feldKopie(wesen.position);
  versetzen(spiel, wesen, feld, "teleport", versetzoptionen(kontext));
  melden(spiel, "teleportiert", { wer: bezugAuf(wesen), von, nach: feldKopie(feld) });
});

const lebt = (wesen) => (wesen.werte?.[lebenswertName(wesen)]?.aktuell ?? 1) > 0;

anmelden("zustandspruefungen", "lage", (spiel) => {
  const zustand = spiel.zustand;
  let geaendert = false;
  // nur Wesen, die seit der letzten Prüfung versetzt wurden oder deren Zustände sich geändert haben (kern/raumindex.js)
  for (const wesenId of lageOffenEntnehmen(zustand)) {
    const wesen = zustand.entitaeten[wesenId];
    if (!wesen || !wesen.position || !istWesen(wesen) || !lebt(wesen)) continue;
    if (betretbar(spiel, wesen, wesen.position)) continue;
    if (wesen.id === zustand.spielerinId && zustand.vorbei) continue;
    const bewegung = bewegungVon(wesen);
    const ausweg = naechstesFeldMit(spiel, wesen.position, (x, y) => betretbarFuer(spiel, x, y, bewegung) && !wesenAufFeld(spiel, { x, y }).length, { bewegung: "phasend" });
    if (!ausweg) continue;
    const position = feldKopie(wesen.position);
    const effekt = gelaendeAuf(spiel, position.x, position.y)?.beimFestsitzen ?? spiel.daten.regeln.bewegung.beimFestsitzen;
    melden(spiel, "festgesessen", { wer: bezugAuf(wesen), feld: position });
    effektAnwenden(spiel, effekt, { quelleId: null, zielId: wesen.id, ursprung: position, zielfeld: position, ursache: "festsitzen", mittel: { art: "gelaende", name: gelaendeName(spiel, position.x, position.y) } });
    geaendert = true;
    if (!zustand.entitaeten[wesen.id] || !lebt(wesen)) continue;
    versetzen(spiel, wesen, ausweg, "herausgedrueckt");
    melden(spiel, "herausgedrueckt", { wer: bezugAuf(wesen), von: position, nach: feldKopie(ausweg) });
  }
  return geaendert;
});
