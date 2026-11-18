// Grundbausteine des Effektsystems: kleine, stabile Funktionen (spiel, kontext, parameter).
// Neue Bausteine nur für wirklich neue Mechanik; Mods melden eigene im Register an.
// Jeder Baustein beschreibt seine Parameter in "parameter" für die Datenprüfung.

import { anmelden } from "./register.js";
import { wuerfeln } from "./zufall.js";
import { hakenAusloesen, melden, bezugAuf } from "./ereignisse.js";
import { wertAendern, ursprungAus } from "./effekte.js";

function mengeBestimmen(spiel, parameter) {
  return parameter.wuerfel !== undefined ? wuerfeln(spiel.zustand.zufallszustand, parameter.wuerfel) : parameter.menge;
}

function bausteinAnmelden(name, parameterBeschreibung, funktion) {
  funktion.parameter = parameterBeschreibung;
  anmelden("bausteine", name, funktion);
}

// Schaden an den LP des Ziels; Parameter: wuerfel oder menge
// Haken "vor_schaden" darf die Menge ändern oder abbrechen (Treffer abgefangen), "nach_schaden" folgt bei Schaden > 0.
// Getötet wird erst in der Zustandsprüfung nach dem Vorgang (systeme/tod.js).
bausteinAnmelden("schaden", { wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const zustand = spiel.zustand;
  const ziel = zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte.lp) return;
  const beteiligte = { quelleId: kontext.quelleId, zielId: kontext.zielId, ursache: kontext.ursache, kettentiefe: kontext.kettentiefe ?? 0 };
  const hakenKontext = hakenAusloesen(spiel, "vor_schaden", { ...beteiligte, menge: mengeBestimmen(spiel, parameter), abgebrochen: false });
  if (hakenKontext.abgebrochen) return;
  const schadenspunkte = Math.max(0, hakenKontext.menge);
  const quelle = zustand.entitaeten[kontext.quelleId];
  wertAendern(spiel, ziel, "lp", -schadenspunkte, ursprungAus(kontext));
  melden(spiel, "schaden", { quelle: quelle ? bezugAuf(quelle) : null, ziel: bezugAuf(ziel), menge: schadenspunkte, ursache: kontext.ursache });
  if (schadenspunkte > 0) hakenAusloesen(spiel, "nach_schaden", { ...beteiligte, menge: schadenspunkte });
});

// Heilt einen Wert (Standard LP); Parameter: wertName, wuerfel oder menge
bausteinAnmelden("heilen", { wertName: "text?", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  const wertName = parameter.wertName || "lp";
  if (!ziel || !ziel.werte || !ziel.werte[wertName]) return;
  const geheilt = wertAendern(spiel, ziel, wertName, mengeBestimmen(spiel, parameter), ursprungAus(kontext));
  melden(spiel, "geheilt", { ziel: bezugAuf(ziel), wertName, menge: geheilt });
});

// Ändert einen beliebigen Wert um eine Menge (auch negativ); Parameter: wertName, wuerfel oder menge
bausteinAnmelden("wert_aendern", { wertName: "text", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte[parameter.wertName]) return;
  const geaendert = wertAendern(spiel, ziel, parameter.wertName, mengeBestimmen(spiel, parameter), ursprungAus(kontext));
  melden(spiel, "wert_geaendert", { ziel: bezugAuf(ziel), wertName: parameter.wertName, menge: geaendert });
});
