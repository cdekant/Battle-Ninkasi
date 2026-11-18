// Bedingungen am Modifikator und Auren als Modifikatorquelle (siehe docs/Architektur.md, Modifikatoren).
//
// Bedingungen (Register "modifikatorbedingungen"): (spiel, entitaet, parameter, umstaende) => true, wenn der Modifikator gilt.
// Jede Bedingung beschreibt ihre Parameter in "parameter" für die Datenprüfung. Bedingungen lesen nur Rohwerte
// (aktuell, grundwert) und rufen modifiziert nicht auf, sonst greift der Schutz in kern/werte.js.
//   pegel_ab { wert }               Pegel mindestens wert (100 = 1 ‰)
//   pegel_unter { wert }            Pegel unter wert, z.B. "nüchtern"
//   wert_unter_prozent { wert, prozent }  aktueller Wert unter prozent des Grundwerts (ohne Modifikatoren)
//   gegenueber_tag { tag }          das Gegenüber der Abfrage (umstaende.gegenueberId) trägt den Tag
//
// Auren (Modifikatorquelle "auren"): an Wesen und Zuständen
//   auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]
//   reichweite: Kreis wie in der Zielauswahl (dx² + dy² <= r·(r+1)), ohne Modifikatoren
//   trifft:     aus Sicht der Trägerin, wie in der Zielauswahl: "feinde" | "verbuendete" | "wesen" | "alle"
//   selbst:     auch die Trägerin (Vorgabe false); sichtlinie: nur mit freier Sichtlinie (Vorgabe false, wirkt durch Wände)
//   In Zuständen skalieren die Modifikatoren der Aura mit Stärke und Verlauf wie die übrigen.
// Quelle der Modifikatoren: "aura:<id der Trägerin>" bzw. "aura:zustand:<nummer>".

import { anmelden } from "../kern/register.js";
import { alleEntitaeten, fraktionVon } from "../kern/zustand.js";
import { modifikatorSkaliert, hatWert } from "../kern/werte.js";
import { inReichweite, sichtlinieFrei } from "../welt/geometrie.js";
import { trifftZu } from "./zielauswahl.js";
import { staerkeProzent } from "./zustaende.js";

function bedingungAnmelden(name, parameterBeschreibung, funktion) {
  funktion.parameter = parameterBeschreibung;
  anmelden("modifikatorbedingungen", name, funktion);
}

const pegelVon = (entitaet) => (hatWert(entitaet, "pegel") ? entitaet.werte.pegel.aktuell : 0);

bedingungAnmelden("pegel_ab", { wert: "ganzzahl" }, (spiel, entitaet, { wert }) => pegelVon(entitaet) >= wert);

bedingungAnmelden("pegel_unter", { wert: "ganzzahl" }, (spiel, entitaet, { wert }) => pegelVon(entitaet) < wert);

bedingungAnmelden("wert_unter_prozent", { wert: "text", prozent: "ganzzahl" }, (spiel, entitaet, parameter) => {
  const wert = entitaet.werte?.[parameter.wert];
  if (!wert || wert.grundwert === undefined) return false;
  return wert.aktuell * 100 < wert.grundwert * parameter.prozent;
});

bedingungAnmelden("gegenueber_tag", { tag: "text" }, (spiel, entitaet, parameter, umstaende) => {
  const gegenueber = spiel.zustand.entitaeten[umstaende.gegenueberId];
  return Boolean(gegenueber?.tags?.includes(parameter.tag));
});

// Alle Auren einer Trägerin: eigene und die ihrer Zustände, je mit Stärke in Prozent und Quelle
function aurenVon(spiel, traegerin) {
  const ergebnis = (traegerin.auren || []).map((aura) => ({ aura, prozent: 100, quelle: `aura:${traegerin.id}` }));
  for (const instanz of traegerin.zustaende || []) {
    const auren = spiel.daten.zustaende?.[instanz.name]?.auren || [];
    for (const aura of auren) ergebnis.push({ aura, prozent: staerkeProzent(spiel, instanz), quelle: `aura:zustand:${instanz.nummer}` });
  }
  return ergebnis;
}

function auraErreicht(spiel, traegerin, aura, entitaet) {
  if (entitaet === traegerin) return aura.selbst === true;
  if (!inReichweite(traegerin.position, entitaet.position, aura.reichweite)) return false;
  if (!trifftZu(aura.trifft, fraktionVon(traegerin) ?? null, entitaet)) return false;
  return !aura.sichtlinie || sichtlinieFrei(spiel, traegerin.position, entitaet.position);
}

// Trägerinnen nach ID, ihre Auren in der Reihenfolge der Daten; die Trägerin braucht eine Position (liegt also nicht im Inventar)
anmelden("modifikatorquellen", "auren", (spiel, entitaet) => {
  if (!entitaet.position) return [];
  const ergebnis = [];
  for (const traegerin of alleEntitaeten(spiel.zustand)) {
    if (!traegerin.position || (!traegerin.auren && !traegerin.zustaende)) continue;
    for (const { aura, prozent, quelle } of aurenVon(spiel, traegerin)) {
      if (!auraErreicht(spiel, traegerin, aura, entitaet)) continue;
      for (const modifikator of aura.modifikatoren) ergebnis.push({ ...modifikatorSkaliert(modifikator, prozent), quelle });
    }
  }
  return ergebnis;
});
