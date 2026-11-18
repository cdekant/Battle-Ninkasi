// Laden und Prüfen der Inhalte (siehe docs/Architektur.md, Inhalte als Daten)
// Löst Vorlagen auf (Vererbung über "vorlage") und prüft Pflichtfelder, Typen und Verweise.
// Fehler werden gesammelt und zusammen gemeldet.

import { hat, holen } from "./register.js";
import { istWuerfelausdruck } from "./zufall.js";
import { kurvenfehler } from "./kurven.js";
import { HAKENKATALOG, AUSLOESER_ROLLEN, AUSLOESER_ZIELE } from "./hakenkatalog.js";
import { HINTERLASSENSCHAFT_REGELN } from "./werte.js";

const istObjekt = (wert) => wert && typeof wert === "object" && !Array.isArray(wert);

// Tiefes Zusammenführen: Objekte werden gemischt, alles andere (auch Arrays) ersetzt
function mischen(basis, abweichung) {
  const ergebnis = structuredClone(basis);
  for (const [schluessel, wert] of Object.entries(abweichung)) {
    if (istObjekt(wert) && istObjekt(ergebnis[schluessel])) {
      ergebnis[schluessel] = mischen(ergebnis[schluessel], wert);
    } else {
      ergebnis[schluessel] = structuredClone(wert);
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

function pruefeEffektVerweis(daten, effektName, ort, fehler) {
  if (!daten.effekte[effektName]) fehler.push(`${ort}: Effekt "${effektName}" gibt es nicht`);
}

function pruefeWesen(daten, sprache, name, wesen, fehler) {
  const ort = `wesen.${name}`;
  if (wesen.abstrakt) return;
  pruefeText(sprache.texte, wesen.text, ort, fehler);
  pruefeNomen(sprache, wesen.text, fehler);
  if (typeof wesen.fraktion !== "string") fehler.push(`${ort}: fraktion fehlt`);
  if (!wesen.werte || !wesen.werte.lp) fehler.push(`${ort}: werte.lp fehlt`);
  for (const [wertName, wertDaten] of Object.entries(wesen.werte || {})) {
    // ohne grundwert nach oben offen, dann ist anfangswert Pflicht
    if (wertDaten.grundwert === undefined) {
      if (wertDaten.anfangswert === undefined) fehler.push(`${ort}: werte.${wertName} braucht grundwert oder, wenn nach oben offen, anfangswert`);
    } else if (!istGanzzahl(wertDaten.grundwert) || wertDaten.grundwert < 0) {
      fehler.push(`${ort}: werte.${wertName}.grundwert muss eine ganze Zahl >= 0 sein`);
    }
    if (wertDaten.anfangswert !== undefined && (!istGanzzahl(wertDaten.anfangswert) || wertDaten.anfangswert < 0)) fehler.push(`${ort}: werte.${wertName}.anfangswert muss eine ganze Zahl >= 0 sein`);
  }
  if (wesen.angriff) {
    if (!istGanzzahl(wesen.angriff.trefferchance)) fehler.push(`${ort}: angriff.trefferchance muss eine ganze Zahl sein`);
    pruefeEffektVerweis(daten, wesen.angriff.effekt, `${ort}.angriff`, fehler);
    if (wesen.angriff.muster && !hat("zielmuster", wesen.angriff.muster)) fehler.push(`${ort}: Zielmuster "${wesen.angriff.muster}" ist nicht angemeldet`);
  }
  if (wesen.ki && !hat("ki", wesen.ki.modul)) fehler.push(`${ort}: Verhaltensmodul "${wesen.ki.modul}" ist nicht angemeldet`);
  if (wesen.stoffwechsel) pruefeStoffwechsel(wesen, ort, fehler);
  if (wesen.sicht && !istGanzzahl(wesen.sicht.reichweite)) fehler.push(`${ort}: sicht.reichweite muss eine ganze Zahl sein`);
  if (wesen.lebenswert !== undefined && !wesen.werte?.[wesen.lebenswert]) fehler.push(`${ort}: lebenswert "${wesen.lebenswert}" ist kein Wert des Wesens`);
  if (wesen.beimTod?.inventar !== undefined && !HINTERLASSENSCHAFT_REGELN.includes(wesen.beimTod.inventar)) {
    fehler.push(`${ort}: beimTod.inventar muss eines von ${HINTERLASSENSCHAFT_REGELN.join(", ")} sein`);
  }
  if (wesen.ausloeser !== undefined) pruefeAusloeser(daten, wesen.ausloeser, ort, fehler);
  if (!daten.zeichen.wesen[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

const istProzent = (wert) => istGanzzahl(wert) && wert >= 0 && wert <= 100;

// Auslöser, siehe kern/ausloeser.js
function pruefeAusloeser(daten, liste, ort, fehler) {
  if (!Array.isArray(liste)) return fehler.push(`${ort}: ausloeser muss eine Liste sein`);
  liste.forEach((ausloeser, nummer) => {
    const eintragOrt = `${ort}.ausloeser[${nummer}]`;
    const haken = HAKENKATALOG[ausloeser.bei];
    if (!haken) fehler.push(`${eintragOrt}: Haken "${ausloeser.bei}" steht nicht im Katalog`);
    else if (!haken.ausloeserErlaubt) fehler.push(`${eintragOrt}: am Haken "${ausloeser.bei}" sind keine Auslöser erlaubt`);
    else if (!haken.inBetrieb) fehler.push(`${eintragOrt}: Haken "${ausloeser.bei}" wird noch nicht ausgelöst`);
    if (ausloeser.rolle !== undefined && !AUSLOESER_ROLLEN.includes(ausloeser.rolle)) fehler.push(`${eintragOrt}: rolle muss eines von ${AUSLOESER_ROLLEN.join(", ")} sein`);
    if (ausloeser.ziel !== undefined && !AUSLOESER_ZIELE.includes(ausloeser.ziel)) fehler.push(`${eintragOrt}: ziel muss eines von ${AUSLOESER_ZIELE.join(", ")} sein`);
    for (const feld of ["chance", "daempfung"]) {
      if (ausloeser[feld] !== undefined && !istProzent(ausloeser[feld])) fehler.push(`${eintragOrt}: ${feld} muss eine ganze Zahl von 0 bis 100 sein`);
    }
    pruefeEffektVerweis(daten, ausloeser.effekt, eintragOrt, fehler);
  });
}

function pruefeRegeln(regeln, fehler) {
  const ausloeser = regeln?.ausloeser;
  if (!ausloeser) return fehler.push("regeln.ausloeser fehlt");
  if (!istProzent(ausloeser.daempfungProStufe)) fehler.push("regeln.ausloeser.daempfungProStufe muss eine ganze Zahl von 0 bis 100 sein");
  if (!istGanzzahl(ausloeser.hoechsteKettentiefe) || ausloeser.hoechsteKettentiefe < 0) fehler.push("regeln.ausloeser.hoechsteKettentiefe muss eine ganze Zahl >= 0 sein");
}

// Stoffwechsel: braucht den Wert pegel, Kurven nur für vorhandene Werte (siehe systeme/stoffwechsel.js)
function pruefeStoffwechsel(wesen, ort, fehler) {
  const stoffwechsel = wesen.stoffwechsel;
  if (!wesen.werte || !wesen.werte.pegel) fehler.push(`${ort}: stoffwechsel braucht den Wert pegel`);
  if (stoffwechsel.abbauHundertstel !== undefined && (!istGanzzahl(stoffwechsel.abbauHundertstel) || stoffwechsel.abbauHundertstel < 0)) {
    fehler.push(`${ort}: stoffwechsel.abbauHundertstel muss eine ganze Zahl >= 0 sein`);
  }
  const schwellen = stoffwechsel.schwellen || [];
  if (!Array.isArray(schwellen) || !schwellen.every((schwelle) => istGanzzahl(schwelle) && schwelle > 0)) {
    fehler.push(`${ort}: stoffwechsel.schwellen müssen ganze Zahlen > 0 sein`);
  }
  for (const [wertName, kurve] of Object.entries(stoffwechsel.regeneration || {})) {
    if (!wesen.werte || !wesen.werte[wertName]) fehler.push(`${ort}: stoffwechsel.regeneration.${wertName} ohne Wert ${wertName}`);
    fehler.push(...kurvenfehler(kurve, `${ort}.stoffwechsel.regeneration.${wertName}`));
  }
}

function pruefeGegenstand(daten, sprache, name, gegenstand, fehler) {
  const ort = `gegenstaende.${name}`;
  if (gegenstand.abstrakt) return;
  pruefeText(sprache.texte, gegenstand.text, ort, fehler);
  pruefeNomen(sprache, gegenstand.text, fehler);
  if (gegenstand.trinkbar) pruefeEffektVerweis(daten, gegenstand.trinkbar.effekt, `${ort}.trinkbar`, fehler);
  if (!daten.zeichen.gegenstaende[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

function pruefeEffekt(name, effekt, fehler) {
  const ort = `effekte.${name}`;
  if (!Array.isArray(effekt.schritte) || effekt.schritte.length === 0) return fehler.push(`${ort}: schritte fehlen`);
  effekt.schritte.forEach((schritt, nummer) => {
    const schrittOrt = `${ort}.schritte[${nummer}]`;
    if (!hat("bausteine", schritt.baustein)) return fehler.push(`${schrittOrt}: Baustein "${schritt.baustein}" ist nicht angemeldet`);
    const parameterBeschreibung = holen("bausteine", schritt.baustein).parameter || {};
    for (const [feld, typ] of Object.entries(parameterBeschreibung)) {
      if (typ === "wuerfel|menge") {
        if (schritt.wuerfel === undefined && schritt.menge === undefined) fehler.push(`${schrittOrt}: wuerfel oder menge fehlt`);
        if (schritt.wuerfel !== undefined && !istWuerfelausdruck(schritt.wuerfel)) fehler.push(`${schrittOrt}: ungültiger Würfelausdruck "${schritt.wuerfel}"`);
        if (schritt.menge !== undefined && !istGanzzahl(schritt.menge)) fehler.push(`${schrittOrt}: menge muss eine ganze Zahl sein`);
      } else if (typ === "text" && typeof schritt[feld] !== "string") {
        fehler.push(`${schrittOrt}: ${feld} fehlt`);
      }
    }
  });
}

function pruefeEbene(daten, name, ebene, fehler) {
  const ort = `ebenen.${name}`;
  for (const masz of ["breite", "hoehe"]) {
    if (!istGanzzahl(ebene[masz]) || ebene[masz] < 10) fehler.push(`${ort}: ${masz} muss eine ganze Zahl >= 10 sein`);
  }
  for (const gegner of ebene.gegner || []) {
    if (!daten.wesen[gegner.typ] || daten.wesen[gegner.typ].abstrakt) fehler.push(`${ort}: Gegner "${gegner.typ}" gibt es nicht`);
  }
  for (const gegenstand of ebene.gegenstaende || []) {
    if (!daten.gegenstaende[gegenstand.typ]) fehler.push(`${ort}: Gegenstand "${gegenstand.typ}" gibt es nicht`);
  }
  for (const rolle of ["wand", "boden"]) {
    if (!daten.gelaende[ebene.gelaende?.[rolle]]) fehler.push(`${ort}: gelaende.${rolle} verweist auf unbekanntes Gelände`);
  }
}

// Gibt { daten, fehler } zurück; daten mit aufgelösten Vorlagen.
// sprache: { texte, nomenPruefen? }, nomenPruefen(eintrag, ort) gibt eine Liste von Fehlern zurück
export function vorbereiten(rohdaten, sprache = {}) {
  const fehler = [];
  const daten = { ...rohdaten };
  daten.wesen = vorlagenAufloesen(rohdaten.wesen, "wesen", fehler);
  daten.gegenstaende = vorlagenAufloesen(rohdaten.gegenstaende, "gegenstaende", fehler);

  for (const [name, effekt] of Object.entries(daten.effekte)) pruefeEffekt(name, effekt, fehler);
  for (const [name, wesen] of Object.entries(daten.wesen)) pruefeWesen(daten, sprache, name, wesen, fehler);
  for (const [name, gegenstand] of Object.entries(daten.gegenstaende)) pruefeGegenstand(daten, sprache, name, gegenstand, fehler);
  for (const [name, ebene] of Object.entries(daten.ebenen)) pruefeEbene(daten, name, ebene, fehler);
  for (const [name, gelaende] of Object.entries(daten.gelaende)) {
    if (typeof gelaende.kennung !== "string" || gelaende.kennung.length !== 1) fehler.push(`gelaende.${name}: kennung muss genau ein Zeichen sein`);
    if (!daten.zeichen.gelaende[name]) fehler.push(`gelaende.${name}: kein Zeichen in daten/zeichen.js`);
  }
  for (const [aktion, kosten] of Object.entries(daten.aktionen)) {
    if (!istGanzzahl(kosten) || kosten <= 0) fehler.push(`aktionen.${aktion}: Kosten müssen eine ganze Zahl > 0 sein`);
  }
  pruefeRegeln(daten.regeln, fehler);
  if (!daten.wesen.ninkasi) fehler.push("wesen.ninkasi fehlt");
  return { daten, fehler };
}

export class Datenfehler extends Error {
  constructor(fehler) {
    super(`Fehler in den Daten:\n${fehler.map((meldung) => "  " + meldung).join("\n")}`);
    this.fehler = fehler;
  }
}
