// Bedingungen am Modifikator und Auren als Modifikatorquelle (siehe docs/Wirkungen.md, Modifikatoren).
//
// Bedingungen (Register "modifikatorbedingungen"): (spiel, entitaet, parameter, umstaende) => true, wenn der Modifikator gilt.
// Jede Bedingung beschreibt ihre Parameter in "parameter" für die Datenprüfung. Bedingungen lesen nur Rohwerte
// (aktuell, grundwert) und rufen modifiziert nicht auf, sonst greift der Schutz in kern/werte.js.
//   pegel_ab { wert }               Pegel mindestens wert (100 = 1 ‰)
//   pegel_unter { wert }            Pegel unter wert, z.B. "nüchtern"
//   wert_unter_prozent { wert, prozent }  aktueller Wert unter prozent des Grundwerts (ohne Modifikatoren)
//   gegenueber_tag { tag }          das Gegenüber der Abfrage (umstaende.gegenueberId) trägt den Tag
//   gegenueber_ahnungslos {}        das Gegenüber ist ahnungslos (Hinterhalt, systeme/wahrnehmung.js)
//   hat_tag { tag }                 die Entität trägt den Tag (tags in den Daten)
//   ohne_tag { tag }                die Entität trägt den Tag nicht, z.B. Gas wirkt nur auf Wesen ohne "anaerob"
//   traegt_tag { tag, anzahl? }     mindestens anzahl (Vorgabe 1) angelegte Gegenstände tragen den Tag (Sets)
//   hat_zustand { zustand }         die Entität trägt den Zustand
//   ohne_zustand { zustand }        die Entität trägt den Zustand nicht, z.B. damit eine Bossphase nur einmal beginnt
// Bedingungen des Skillsystems (skill_ab, eigenschaft_ab, eigenschaft_unter) stehen in systeme/skills.js; die
// beiden zu Eigenschaften lesen als Ausnahme den wirksamen Wert samt Modifikatoren.
//
// Auren (Modifikatorquelle "auren"): an Wesen und Zuständen
//   auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]
//   reichweite: Kreis wie in der Zielauswahl (dx² + dy² <= r·(r+1)), ohne Modifikatoren
//   trifft:     aus Sicht der Trägerin, wie in der Zielauswahl: "feinde" | "verbuendete" | "wesen" | "alle"
//   selbst:     auch die Trägerin (Vorgabe false); sichtlinie: nur mit freier Sichtlinie (Vorgabe false, wirkt durch Wände)
//   In Zuständen skalieren die Modifikatoren der Aura mit Stärke und Verlauf wie die übrigen.
// Quelle der Modifikatoren: "aura:<id der Trägerin>" bzw. "aura:zustand:<nummer>".

import { anmelden } from "../kern/register.js";
import { fraktionVon } from "../kern/zustand.js";
import { modifikatorSkaliert, hatWert } from "../kern/werte.js";
import { traegerinnenIds } from "../kern/raumindex.js";
import { inReichweite, sichtlinieFrei } from "../welt/geometrie.js";
import { trifftZu } from "./zielauswahl.js";
import { staerkeProzent } from "./zustaende.js";
import { istAhnungslos } from "./wahrnehmung.js";

export function bedingungAnmelden(name, parameterBeschreibung, funktion) {
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

bedingungAnmelden("gegenueber_ahnungslos", {}, (spiel, entitaet, parameter, umstaende) => istAhnungslos(spiel.zustand.entitaeten[umstaende.gegenueberId]));

bedingungAnmelden("hat_tag", { tag: "text" }, (spiel, entitaet, parameter) => Boolean(entitaet.tags?.includes(parameter.tag)));

bedingungAnmelden("ohne_tag", { tag: "text" }, (spiel, entitaet, parameter) => !entitaet.tags?.includes(parameter.tag));

bedingungAnmelden("traegt_tag", { tag: "text", anzahl: "ganzzahl?" }, (spiel, entitaet, parameter) => {
  const mitTag = (entitaet.ausgeruestet || []).filter((id) => spiel.zustand.entitaeten[id]?.tags?.includes(parameter.tag)).length;
  return mitTag >= (parameter.anzahl ?? 1);
});

const traegtZustand = (entitaet, name) => (entitaet.zustaende || []).some((instanz) => instanz.name === name);

bedingungAnmelden("hat_zustand", { zustand: "zustand" }, (spiel, entitaet, parameter) => traegtZustand(entitaet, parameter.zustand));

bedingungAnmelden("ohne_zustand", { zustand: "zustand" }, (spiel, entitaet, parameter) => !traegtZustand(entitaet, parameter.zustand));

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
  if (!trifftZu(spiel, aura.trifft, { id: traegerin.id, fraktion: fraktionVon(traegerin) ?? null }, entitaet)) return false;
  return !aura.sichtlinie || sichtlinieFrei(spiel, traegerin.position, entitaet.position);
}

// Trägerinnen nach ID, ihre Auren in der Reihenfolge der Daten; die Trägerin braucht eine Position (liegt also nicht im Inventar)
anmelden("modifikatorquellen", "auren", (spiel, entitaet) => {
  if (!entitaet.position) return [];
  const ergebnis = [];
  const entitaeten = spiel.zustand.entitaeten;
  for (const traegerinId of traegerinnenIds(spiel.zustand)) {
    const traegerin = entitaeten[traegerinId];
    for (const { aura, prozent, quelle } of aurenVon(spiel, traegerin)) {
      if (!auraErreicht(spiel, traegerin, aura, entitaet)) continue;
      for (const modifikator of aura.modifikatoren) ergebnis.push({ ...modifikatorSkaliert(modifikator, prozent), quelle });
    }
  }
  return ergebnis;
});
