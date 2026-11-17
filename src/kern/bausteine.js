// Grundbausteine des Effektsystems: kleine, stabile Funktionen (spiel, kontext, parameter).
// Neue Bausteine nur für wirklich neue Mechanik; Mods melden eigene im Register an.
// Jeder Baustein beschreibt seine Parameter in "parameter" für die Datenprüfung.

import { anmelden } from "./register.js";
import { wuerfeln } from "./zufall.js";
import { haken, melden, bezug } from "./ereignisse.js";
import { wertAendern, toeten } from "./effekte.js";

function menge(spiel, p) {
  return p.wuerfel !== undefined ? wuerfeln(spiel.zustand.rng, p.wuerfel) : p.menge;
}

function baustein(name, parameter, funktion) {
  funktion.parameter = parameter;
  anmelden("bausteine", name, funktion);
}

// Schaden an den LP des Ziels; Parameter: wuerfel oder menge
baustein("schaden", { wuerfel: "wuerfel|menge" }, (spiel, k, p) => {
  const z = spiel.zustand;
  const ziel = z.entitaeten[k.ziel];
  if (!ziel || !ziel.werte || !ziel.werte.lp) return;
  const ctx = haken(spiel, "vor_schaden", { quelle: k.quelle, ziel: k.ziel, art: k.art, menge: menge(spiel, p) });
  const betrag = Math.max(0, ctx.menge);
  const quelle = z.entitaeten[k.quelle];
  wertAendern(spiel, ziel, "lp", -betrag);
  melden(spiel, "schaden", { quelle: quelle ? bezug(quelle) : null, ziel: bezug(ziel), menge: betrag, angriffsart: k.art });
  if (ziel.werte.lp.aktuell <= 0) toeten(spiel, ziel, k.quelle);
});

// Heilt einen Wert (Standard LP); Parameter: wert, wuerfel oder menge
baustein("heilen", { wert: "text?", wuerfel: "wuerfel|menge" }, (spiel, k, p) => {
  const ziel = spiel.zustand.entitaeten[k.ziel];
  const wert = p.wert || "lp";
  if (!ziel || !ziel.werte || !ziel.werte[wert]) return;
  const geheilt = wertAendern(spiel, ziel, wert, menge(spiel, p));
  melden(spiel, "geheilt", { ziel: bezug(ziel), wert, menge: geheilt });
});

// Ändert einen beliebigen Wert um eine Menge (auch negativ); Parameter: wert, wuerfel oder menge
baustein("wert_aendern", { wert: "text", wuerfel: "wuerfel|menge" }, (spiel, k, p) => {
  const ziel = spiel.zustand.entitaeten[k.ziel];
  if (!ziel || !ziel.werte || !ziel.werte[p.wert]) return;
  const geaendert = wertAendern(spiel, ziel, p.wert, menge(spiel, p));
  melden(spiel, "wert_geaendert", { ziel: bezug(ziel), wert: p.wert, menge: geaendert });
});
