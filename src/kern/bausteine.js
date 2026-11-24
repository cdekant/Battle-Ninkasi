// Grundbausteine des Effektsystems: kleine, stabile Funktionen (spiel, kontext, parameter).
// Neue Bausteine nur für wirklich neue Mechanik; Mods melden eigene im Register an.
// Jeder Baustein beschreibt seine Parameter in "parameter" für die Datenprüfung (kern/daten.js):
//   "text", "ganzzahl", "wahrheitswert", "effekt", "muster", "zustand", "wesen", "schadensart", mit "?" am Ende freiwillig;
//   eine Liste nennt die erlaubten Werte (freiwillig); "wuerfel|menge" siehe mengeBestimmen
// brauchtZiel: der Baustein wirkt auf ein Wesen und wird ohne Ziel übersprungen.
// vorab (freiwillig): (spiel, kontext, parameter) => Grund oder null; sagt vor dem Benutzen, dass der Schritt jetzt
//   nichts bewirken würde (z.B. beschwoeren: "kein_freies_feld"); gefragt von wirkungVorab
// Bausteine mit Zielauswahl (fuer_jedes_ziel, auf_feld, geschoss, springen) stehen in systeme/zielbausteine.js,
// zustand_setzen und zustand_entfernen in systeme/zustaende.js.

import { anmelden, holen } from "./register.js";
import { wurfWuerfel, wurfProzent } from "./wurf.js";
import { hakenAusloesen, melden, bezugAuf } from "./ereignisse.js";
import { effektAnwenden, wertAendern, ursprungAus, beteiligteAus, kontextVervollstaendigen } from "./effekte.js";
import { prozentVon, prozentWiederholt, geteiltGerundet } from "./werte.js";

// Menge eines Schritts:
//   wuerfel: "1W6+2" | menge: 5 | menge: { aus: "summeSchaden", prozent?: 50 } (aus der Ablage kontext.werte)
//   teilen: "anzahlZiele"   teilt durch einen Wert der Ablage (verteilter Schaden), wenn er über 1 liegt
//   auf: "quelle"         wirkt auf die Quelle statt auf das Ziel (schaden, heilen, wert_aendern)
//   prozentJeSprung: 70     je Sprung einer Kette (werte.sprungnummer) bleiben so viele Prozent
//   mitStaerke: true        skaliert mit der Stärke eines Zustands (werte.staerkeProzent, 100 = Stärke 1)
export function mengeBestimmen(spiel, kontext, parameter, wurfname = "menge") {
  const ablage = kontext.werte || {};
  let menge;
  if (parameter.wuerfel !== undefined) menge = wurfWuerfel(spiel, wurfname, parameter.wuerfel);
  else if (typeof parameter.menge === "object") menge = prozentVon(ablage[parameter.menge.aus] ?? 0, parameter.menge.prozent ?? 100);
  else menge = parameter.menge;
  if (parameter.teilen !== undefined && ablage[parameter.teilen] > 1) menge = geteiltGerundet(menge, ablage[parameter.teilen]);
  if (parameter.prozentJeSprung !== undefined) menge = prozentWiederholt(menge, parameter.prozentJeSprung, ablage.sprungnummer ?? 0);
  if (parameter.mitStaerke && ablage.staerkeProzent !== undefined) menge = prozentVon(menge, ablage.staerkeProzent);
  return menge;
}

export function bausteinAnmelden(name, parameterBeschreibung, funktion, { brauchtZiel = false, vorab = null } = {}) {
  funktion.parameter = parameterBeschreibung;
  funktion.brauchtZiel = brauchtZiel;
  funktion.vorab = vorab;
  anmelden("bausteine", name, funktion);
}

// Grund, aus dem ein Effekt jetzt ganz ohne Folge bliebe, oder null: nur wenn jeder Schritt auf oberster Ebene eine
// Vorabprüfung hat und sie einen Grund nennt (der erste zählt); Schritte ohne Vorabprüfung gelten als wirksam
export function wirkungVorab(spiel, effektName, kontext) {
  const effekt = spiel.daten.effekte[effektName];
  if (!effekt?.schritte?.length) return null;
  const vollerKontext = kontextVervollstaendigen(spiel, kontext, effekt);
  let ersterGrund = null;
  for (const schritt of effekt.schritte) {
    const vorab = holen("bausteine", schritt.baustein).vorab;
    const grund = vorab ? vorab(spiel, vollerKontext, schritt) : null;
    if (!grund) return null;
    ersterGrund ??= grund;
  }
  return ersterGrund;
}

const MENGE = { wuerfel: "wuerfel|menge", auf: ["ziel", "quelle"] };

// auf: "quelle" lässt einen Schritt auf die Quelle statt auf das Ziel wirken (Vampirbiss: Schaden am Ziel,
// Heilung an der Angreiferin); die Ablage kontext.werte bleibt dieselbe
const wirkkontext = (kontext, parameter) => (parameter.auf === "quelle" ? { ...kontext, zielId: kontext.quelleId } : kontext);

// Schaden an den LP des Ziels; Parameter: art (Schadensart aus daten/schadensarten.js), Menge siehe mengeBestimmen
// Haken "vor_schaden" darf die Menge ändern oder abbrechen (Treffer abgefangen), "nach_schaden" folgt bei Schaden > 0.
// Die Schadensrechnung (Angreifer, Krit, Rüstung, Widerstand) hängt mit festen Rängen an vor_schaden (systeme/kampf.js).
// Der tatsächliche Verlust kommt in die Ablage (werte.summeSchaden), z.B. für Lebensraub.
// Getötet wird erst in der Zustandsprüfung nach dem Vorgang (systeme/tod.js).
bausteinAnmelden("schaden", { art: "schadensart", ...MENGE }, (spiel, kontextDesSchritts, parameter) => {
  const kontext = wirkkontext(kontextDesSchritts, parameter);
  const zustand = spiel.zustand;
  const ziel = zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte.lp) return;
  const beteiligte = beteiligteAus(kontext);
  const hakenKontext = hakenAusloesen(spiel, "vor_schaden", { ...beteiligte, schadensart: parameter.art ?? null, menge: mengeBestimmen(spiel, kontext, parameter, "schaden"), abgebrochen: false });
  if (hakenKontext.abgebrochen) return;
  const schadenspunkte = Math.max(0, hakenKontext.menge);
  const quelle = zustand.entitaeten[kontext.quelleId];
  const verlust = -wertAendern(spiel, ziel, "lp", -schadenspunkte, ursprungAus(kontext));
  if (kontext.werte) kontext.werte.summeSchaden = (kontext.werte.summeSchaden ?? 0) + verlust;
  melden(spiel, "schaden", {
    quelle: quelle ? bezugAuf(quelle) : null, ziel: bezugAuf(ziel), menge: schadenspunkte, ursache: kontext.ursache, schadensart: hakenKontext.schadensart,
    kritisch: beteiligte.kritisch, ruestungAbzug: hakenKontext.ruestungAbzug ?? 0, widerstanden: hakenKontext.widerstanden ?? 0, immun: Boolean(hakenKontext.immun),
    trefferchance: beteiligte.trefferchance ?? null, kritfaktor: hakenKontext.kritfaktor ?? null,
  });
  if (schadenspunkte > 0) hakenAusloesen(spiel, "nach_schaden", { ...beteiligte, schadensart: hakenKontext.schadensart, menge: schadenspunkte });
}, { brauchtZiel: true });

// Heilt einen Wert (Standard LP); Parameter: wertName, Menge siehe mengeBestimmen
bausteinAnmelden("heilen", { wertName: "text?", ...MENGE }, (spiel, kontextDesSchritts, parameter) => {
  const kontext = wirkkontext(kontextDesSchritts, parameter);
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  const wertName = parameter.wertName || "lp";
  if (!ziel || !ziel.werte || !ziel.werte[wertName]) return;
  const geheilt = wertAendern(spiel, ziel, wertName, mengeBestimmen(spiel, kontext, parameter, "heilen"), ursprungAus(kontext));
  melden(spiel, "geheilt", { ziel: bezugAuf(ziel), wertName, menge: geheilt });
}, { brauchtZiel: true });

// Ändert einen beliebigen Wert um eine Menge (auch negativ); Parameter: wertName, Menge siehe mengeBestimmen
bausteinAnmelden("wert_aendern", { wertName: "text", ...MENGE }, (spiel, kontextDesSchritts, parameter) => {
  const kontext = wirkkontext(kontextDesSchritts, parameter);
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte[parameter.wertName]) return;
  const geaendert = wertAendern(spiel, ziel, parameter.wertName, mengeBestimmen(spiel, kontext, parameter), ursprungAus(kontext));
  melden(spiel, "wert_geaendert", { ziel: bezugAuf(ziel), wertName: parameter.wertName, menge: geaendert });
}, { brauchtZiel: true });

// Zufallsverzweigung: mit chance Prozent wirkt effekt, sonst (freiwillig) sonst; beide mit demselben Kontext,
// die Ablage kontext.werte bleibt geteilt. Wurf "zufall", es wird immer gewürfelt, auch bei 0 und 100.
bausteinAnmelden("zufall", { chance: "ganzzahl", effekt: "effekt", sonst: "effekt?" }, (spiel, kontext, parameter) => {
  const gewaehlt = wurfProzent(spiel, "zufall", parameter.chance) ? parameter.effekt : parameter.sonst;
  if (gewaehlt) effektAnwenden(spiel, gewaehlt, kontext);
});
