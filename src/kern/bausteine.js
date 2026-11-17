// Grundbausteine des Effektsystems: kleine, stabile Funktionen (spiel, kontext, parameter).
// Neue Bausteine nur für wirklich neue Mechanik; Mods melden eigene im Register an.
// Jeder Baustein beschreibt seine Parameter in "parameter" für die Datenprüfung.

import { anmelden } from "./register.js";
import { wuerfeln } from "./zufall.js";
import { hakenAusloesen, melden, bezugAuf } from "./ereignisse.js";
import { wertAendern, toeten } from "./effekte.js";

function mengeBestimmen(spiel, parameter) {
  return parameter.wuerfel !== undefined ? wuerfeln(spiel.zustand.zufallszustand, parameter.wuerfel) : parameter.menge;
}

function bausteinAnmelden(name, parameterBeschreibung, funktion) {
  funktion.parameter = parameterBeschreibung;
  anmelden("bausteine", name, funktion);
}

// Schaden an den LP des Ziels; Parameter: wuerfel oder menge
bausteinAnmelden("schaden", { wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const zustand = spiel.zustand;
  const ziel = zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte.lp) return;
  const hakenKontext = hakenAusloesen(spiel, "vor_schaden", {
    quelleId: kontext.quelleId, zielId: kontext.zielId, ursache: kontext.ursache, menge: mengeBestimmen(spiel, parameter),
  });
  const schadenspunkte = Math.max(0, hakenKontext.menge);
  const quelle = zustand.entitaeten[kontext.quelleId];
  wertAendern(spiel, ziel, "lp", -schadenspunkte);
  melden(spiel, "schaden", { quelle: quelle ? bezugAuf(quelle) : null, ziel: bezugAuf(ziel), menge: schadenspunkte, ursache: kontext.ursache });
  if (ziel.werte.lp.aktuell <= 0) toeten(spiel, ziel, kontext.quelleId);
});

// Heilt einen Wert (Standard LP); Parameter: wertName, wuerfel oder menge
bausteinAnmelden("heilen", { wertName: "text?", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  const wertName = parameter.wertName || "lp";
  if (!ziel || !ziel.werte || !ziel.werte[wertName]) return;
  const geheilt = wertAendern(spiel, ziel, wertName, mengeBestimmen(spiel, parameter));
  melden(spiel, "geheilt", { ziel: bezugAuf(ziel), wertName, menge: geheilt });
});

// Ändert einen beliebigen Wert um eine Menge (auch negativ); Parameter: wertName, wuerfel oder menge
bausteinAnmelden("wert_aendern", { wertName: "text", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel || !ziel.werte || !ziel.werte[parameter.wertName]) return;
  const geaendert = wertAendern(spiel, ziel, parameter.wertName, mengeBestimmen(spiel, parameter));
  melden(spiel, "wert_geaendert", { ziel: bezugAuf(ziel), wertName: parameter.wertName, menge: geaendert });
});
