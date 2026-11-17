// Laden und Prüfen der Inhalte (siehe docs/Architektur.md, Inhalte als Daten)
// Löst Vorlagen auf (Vererbung über "vorlage") und prüft Pflichtfelder, Typen und Verweise.
// Fehler werden gesammelt und zusammen gemeldet.

import { hat, holen } from "./register.js";
import { istWuerfelausdruck } from "./zufall.js";

// Tiefes Zusammenführen: Objekte werden gemischt, alles andere (auch Arrays) ersetzt
function mischen(basis, abweichung) {
  const ergebnis = structuredClone(basis);
  for (const [k, v] of Object.entries(abweichung)) {
    if (v && typeof v === "object" && !Array.isArray(v) && ergebnis[k] && typeof ergebnis[k] === "object" && !Array.isArray(ergebnis[k])) {
      ergebnis[k] = mischen(ergebnis[k], v);
    } else {
      ergebnis[k] = structuredClone(v);
    }
  }
  return ergebnis;
}

function vorlagenAufloesen(sammlung, bereich, fehler) {
  const fertig = {};
  const aufloesen = (name, kette) => {
    if (fertig[name]) return fertig[name];
    const eintrag = sammlung[name];
    if (!eintrag.vorlage) return (fertig[name] = structuredClone(eintrag));
    if (kette.includes(eintrag.vorlage)) {
      fehler.push(`${bereich}.${name}: Vorlagen bilden einen Kreis (${[...kette, eintrag.vorlage].join(" > ")})`);
      return (fertig[name] = structuredClone(eintrag));
    }
    if (!sammlung[eintrag.vorlage]) {
      fehler.push(`${bereich}.${name}: Vorlage "${eintrag.vorlage}" gibt es nicht`);
      return (fertig[name] = structuredClone(eintrag));
    }
    const basis = aufloesen(eintrag.vorlage, [...kette, eintrag.vorlage]);
    const { abstrakt: _, ...basisOhneAbstrakt } = basis;
    return (fertig[name] = mischen(basisOhneAbstrakt, eintrag));
  };
  for (const name of Object.keys(sammlung)) aufloesen(name, [name]);
  return fertig;
}

const istGanzzahl = Number.isInteger;

function pruefeText(texte, schluessel, ort, fehler) {
  if (typeof schluessel !== "string") return fehler.push(`${ort}: Textschlüssel fehlt`);
  if (texte && !(schluessel in texte)) fehler.push(`${ort}: Text "${schluessel}" fehlt in der Sprachdatei`);
}

// Texte von Wesen und Gegenständen sind Hauptwörter; die Prüfung kommt von der Grammatik der Sprache
function pruefeNomen(sprache, schluessel, fehler) {
  if (!sprache.nomenPruefen || !sprache.texte || !(schluessel in sprache.texte)) return;
  fehler.push(...sprache.nomenPruefen(sprache.texte[schluessel], `Text "${schluessel}"`));
}

function pruefeEffekt(daten, name, ort, fehler) {
  if (!daten.effekte[name]) fehler.push(`${ort}: Effekt "${name}" gibt es nicht`);
}

function pruefeWesen(daten, sprache, name, w, fehler) {
  const ort = `wesen.${name}`;
  if (w.abstrakt) return;
  pruefeText(sprache.texte, w.text, ort, fehler);
  pruefeNomen(sprache, w.text, fehler);
  if (typeof w.fraktion !== "string") fehler.push(`${ort}: fraktion fehlt`);
  if (!w.werte || !w.werte.lp) fehler.push(`${ort}: werte.lp fehlt`);
  for (const [wn, wd] of Object.entries(w.werte || {})) {
    if (!istGanzzahl(wd.grund) || wd.grund < 0) fehler.push(`${ort}: werte.${wn}.grund muss eine ganze Zahl >= 0 sein`);
    if (wd.start !== undefined && !istGanzzahl(wd.start)) fehler.push(`${ort}: werte.${wn}.start muss eine ganze Zahl sein`);
  }
  if (w.angriff) {
    if (!istGanzzahl(w.angriff.trefferchance)) fehler.push(`${ort}: angriff.trefferchance muss eine ganze Zahl sein`);
    pruefeEffekt(daten, w.angriff.effekt, `${ort}.angriff`, fehler);
    if (w.angriff.muster && !hat("zielmuster", w.angriff.muster)) fehler.push(`${ort}: Zielmuster "${w.angriff.muster}" ist nicht angemeldet`);
  }
  if (w.ki && !hat("ki", w.ki.modul)) fehler.push(`${ort}: Verhaltensmodul "${w.ki.modul}" ist nicht angemeldet`);
  if (w.sicht && !istGanzzahl(w.sicht.weite)) fehler.push(`${ort}: sicht.weite muss eine ganze Zahl sein`);
  if (!daten.zeichen.wesen[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

function pruefeGegenstand(daten, sprache, name, g, fehler) {
  const ort = `gegenstaende.${name}`;
  if (g.abstrakt) return;
  pruefeText(sprache.texte, g.text, ort, fehler);
  pruefeNomen(sprache, g.text, fehler);
  if (g.trinkbar) pruefeEffekt(daten, g.trinkbar.effekt, `${ort}.trinkbar`, fehler);
  if (!daten.zeichen.gegenstaende[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

function pruefeEffektdaten(name, e, fehler) {
  const ort = `effekte.${name}`;
  if (!Array.isArray(e.schritte) || e.schritte.length === 0) return fehler.push(`${ort}: schritte fehlen`);
  e.schritte.forEach((s, i) => {
    const o = `${ort}.schritte[${i}]`;
    if (!hat("bausteine", s.baustein)) return fehler.push(`${o}: Baustein "${s.baustein}" ist nicht angemeldet`);
    const spec = holen("bausteine", s.baustein).parameter || {};
    for (const [feld, typ] of Object.entries(spec)) {
      if (typ === "wuerfel|menge") {
        if (s.wuerfel === undefined && s.menge === undefined) fehler.push(`${o}: wuerfel oder menge fehlt`);
        if (s.wuerfel !== undefined && !istWuerfelausdruck(s.wuerfel)) fehler.push(`${o}: ungültiger Würfelausdruck "${s.wuerfel}"`);
        if (s.menge !== undefined && !istGanzzahl(s.menge)) fehler.push(`${o}: menge muss eine ganze Zahl sein`);
      } else if (typ === "text" && typeof s[feld] !== "string") {
        fehler.push(`${o}: ${feld} fehlt`);
      }
    }
  });
}

function pruefeEbene(daten, name, e, fehler) {
  const ort = `ebenen.${name}`;
  for (const f of ["breite", "hoehe"]) if (!istGanzzahl(e[f]) || e[f] < 10) fehler.push(`${ort}: ${f} muss eine ganze Zahl >= 10 sein`);
  for (const g of e.gegner || []) if (!daten.wesen[g.typ] || daten.wesen[g.typ].abstrakt) fehler.push(`${ort}: Gegner "${g.typ}" gibt es nicht`);
  for (const g of e.gegenstaende || []) if (!daten.gegenstaende[g.typ]) fehler.push(`${ort}: Gegenstand "${g.typ}" gibt es nicht`);
  for (const t of ["wand", "boden"]) if (!daten.gelaende[e.gelaende?.[t]]) fehler.push(`${ort}: gelaende.${t} verweist auf unbekanntes Gelände`);
}

// Gibt { daten, fehler } zurück; daten mit aufgelösten Vorlagen.
// sprache: { texte, nomenPruefen? }, nomenPruefen(eintrag, ort) gibt eine Liste von Fehlern zurück
export function vorbereiten(roh, sprache = {}) {
  const fehler = [];
  const daten = { ...roh };
  daten.wesen = vorlagenAufloesen(roh.wesen, "wesen", fehler);
  daten.gegenstaende = vorlagenAufloesen(roh.gegenstaende, "gegenstaende", fehler);

  for (const [n, e] of Object.entries(daten.effekte)) pruefeEffektdaten(n, e, fehler);
  for (const [n, w] of Object.entries(daten.wesen)) pruefeWesen(daten, sprache, n, w, fehler);
  for (const [n, g] of Object.entries(daten.gegenstaende)) pruefeGegenstand(daten, sprache, n, g, fehler);
  for (const [n, e] of Object.entries(daten.ebenen)) pruefeEbene(daten, n, e, fehler);
  for (const [n, g] of Object.entries(daten.gelaende)) {
    if (typeof g.kennung !== "string" || g.kennung.length !== 1) fehler.push(`gelaende.${n}: kennung muss genau ein Zeichen sein`);
    if (!daten.zeichen.gelaende[n]) fehler.push(`gelaende.${n}: kein Zeichen in daten/zeichen.js`);
  }
  for (const [n, k] of Object.entries(daten.aktionen)) if (!istGanzzahl(k) || k <= 0) fehler.push(`aktionen.${n}: Kosten müssen eine ganze Zahl > 0 sein`);
  if (!daten.wesen.ninkasi) fehler.push("wesen.ninkasi fehlt");
  return { daten, fehler };
}

export class Datenfehler extends Error {
  constructor(fehler) {
    super(`Fehler in den Daten:\n${fehler.map((f) => "  " + f).join("\n")}`);
    this.fehler = fehler;
  }
}
