// Laden und Prüfen der Inhalte (siehe docs/Architektur.md, Inhalte als Daten)
// Löst Vorlagen auf (Vererbung über "vorlage") und prüft Pflichtfelder, Typen und Verweise.
// Fehler werden gesammelt und zusammen gemeldet.

import { hat, holen } from "./register.js";
import { istWuerfelausdruck } from "./zufall.js";
import { kurvenfehler } from "./kurven.js";
import { HAKENKATALOG, AUSLOESER_ROLLEN, AUSLOESER_ZIELE } from "./hakenkatalog.js";
import { HINTERLASSENSCHAFT_REGELN, MODIFIKATORARTEN } from "./werte.js";
import { TRIFFT_ARTEN, ZIELARTEN } from "../systeme/zielauswahl.js";
import { STAPELREGELN, VERLAEUFE } from "../systeme/zustaende.js";
import { KAMPFWERTE } from "../systeme/kampf.js";
import { FAEHIGKEITSARTEN } from "../systeme/faehigkeiten.js";
import { BEZIEHUNGEN } from "../systeme/fraktionen.js";
import { WACHZUSTAENDE } from "../systeme/wahrnehmung.js";

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
  else if (!daten.fraktionen?.[wesen.fraktion]) fehler.push(`${ort}: Fraktion "${wesen.fraktion}" gibt es nicht`);
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
  if (wesen.angriff !== undefined) fehler.push(`${ort}: angriff gibt es nicht mehr, Angriffe stehen als Liste in angriffe`);
  if (wesen.angriffe !== undefined) pruefeAngriffe(daten, wesen.angriffe, ort, fehler);
  pruefeKampfwerte(daten, wesen, ort, fehler);
  if (wesen.faehigkeiten !== undefined) {
    if (!istTextliste(wesen.faehigkeiten)) fehler.push(`${ort}: faehigkeiten muss eine Liste von Namen sein`);
    else for (const faehigkeit of wesen.faehigkeiten) if (!daten.faehigkeiten?.[faehigkeit]) fehler.push(`${ort}: Fähigkeit "${faehigkeit}" gibt es nicht`);
  }
  if (wesen.ki) pruefeKi(daten, wesen.ki, `${ort}.ki`, fehler, istTextliste(wesen.faehigkeiten) ? wesen.faehigkeiten : []);
  if (wesen.stoffwechsel) pruefeStoffwechsel(wesen, ort, fehler);
  if (wesen.sicht && !istGanzzahl(wesen.sicht.reichweite)) fehler.push(`${ort}: sicht.reichweite muss eine ganze Zahl sein`);
  if (wesen.lebenswert !== undefined && !wesen.werte?.[wesen.lebenswert]) fehler.push(`${ort}: lebenswert "${wesen.lebenswert}" ist kein Wert des Wesens`);
  if (wesen.beimTod?.inventar !== undefined && !HINTERLASSENSCHAFT_REGELN.includes(wesen.beimTod.inventar)) {
    fehler.push(`${ort}: beimTod.inventar muss eines von ${HINTERLASSENSCHAFT_REGELN.join(", ")} sein`);
  }
  if (wesen.ausloeser !== undefined) pruefeAusloeser(daten, wesen.ausloeser, ort, fehler);
  if (wesen.tags !== undefined && !istTextliste(wesen.tags)) fehler.push(`${ort}: tags muss eine Liste von Texten sein`);
  if (wesen.modifikatoren !== undefined) pruefeModifikatoren(daten, wesen.modifikatoren, `${ort}.modifikatoren`, fehler);
  if (wesen.auren !== undefined) pruefeAuren(daten, wesen.auren, ort, fehler);
  if (!daten.zeichen.wesen[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

// Angriffsprofile, siehe systeme/kampf.js
function pruefeAngriffe(daten, angriffe, ort, fehler) {
  if (!Array.isArray(angriffe) || angriffe.length === 0) return fehler.push(`${ort}: angriffe muss eine Liste mit mindestens einem Profil sein`);
  const namen = new Set();
  angriffe.forEach((profil, nummer) => {
    const stelle = `${ort}.angriffe[${nummer}]`;
    if (!istObjekt(profil)) return fehler.push(`${stelle}: Profil muss ein Objekt sein`);
    pruefeParameter(daten, { name: "text", genauigkeit: "ganzzahl", effekt: "effekt", kritchance: "ganzzahl?", trifft: TRIFFT_ARTEN }, profil, stelle, fehler);
    if (namen.has(profil.name)) fehler.push(`${stelle}: name "${profil.name}" kommt doppelt vor`);
    namen.add(profil.name);
    if (profil.kosten !== undefined && !(istGanzzahl(profil.kosten) && profil.kosten > 0)) fehler.push(`${stelle}: kosten muss eine ganze Zahl > 0 sein`);
    if (profil.chance !== undefined && !istProzent(profil.chance)) fehler.push(`${stelle}: chance muss eine ganze Zahl von 0 bis 100 sein`);
    if (profil.muster !== undefined) pruefeMuster(daten, profil.muster, `${stelle}.muster`, fehler);
    if (profil.tags !== undefined && !istTextliste(profil.tags)) fehler.push(`${stelle}: tags muss eine Liste von Texten sein`);
  });
}

// Kampfwerte, Widerstände und Immunität, siehe systeme/kampf.js
function pruefeKampfwerte(daten, wesen, ort, fehler) {
  if (wesen.kampfwerte !== undefined) {
    if (!istObjekt(wesen.kampfwerte)) fehler.push(`${ort}: kampfwerte muss ein Objekt sein`);
    else for (const [name, punkte] of Object.entries(wesen.kampfwerte)) {
      if (!KAMPFWERTE.includes(name)) fehler.push(`${ort}: kampfwerte.${name} gibt es nicht (${KAMPFWERTE.join(", ")})`);
      else if (!istZahlAbNull(punkte)) fehler.push(`${ort}: kampfwerte.${name} muss eine ganze Zahl >= 0 sein`);
    }
  }
  if (wesen.widerstaende !== undefined) {
    if (!istObjekt(wesen.widerstaende)) fehler.push(`${ort}: widerstaende muss ein Objekt sein`);
    else for (const [art, punkte] of Object.entries(wesen.widerstaende)) {
      if (!daten.schadensarten?.[art]) fehler.push(`${ort}: widerstaende.${art}: Schadensart gibt es nicht`);
      else if (!istGanzzahl(punkte)) fehler.push(`${ort}: widerstaende.${art} muss eine ganze Zahl sein`);
    }
  }
  if (wesen.immun !== undefined) {
    if (!istTextliste(wesen.immun)) fehler.push(`${ort}: immun muss eine Liste von Schadensarten sein`);
    else for (const art of wesen.immun) if (!daten.schadensarten?.[art]) fehler.push(`${ort}: immun: Schadensart "${art}" gibt es nicht`);
  }
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
    if (ausloeser.wenn !== undefined) {
      if (!Array.isArray(ausloeser.wenn)) fehler.push(`${eintragOrt}: wenn muss eine Liste sein`);
      else pruefeBedingungen(daten, ausloeser.wenn, `${eintragOrt}.wenn`, fehler);
    }
  });
}

// Regelwerte des Kampfs: Untergrenze je Feld
const KAMPFREGELN = { grundverteidigung: 0, halbwertWiderstand: 1, halbwertBlocken: 1, halbwertKritchance: 1, kritfaktor: 100, mindestschadenNachRuestung: 0 };

function pruefeRegeln(regeln, fehler) {
  const ausloeser = regeln?.ausloeser;
  if (!ausloeser) return fehler.push("regeln.ausloeser fehlt");
  if (!istProzent(ausloeser.daempfungProStufe)) fehler.push("regeln.ausloeser.daempfungProStufe muss eine ganze Zahl von 0 bis 100 sein");
  if (!istGanzzahl(ausloeser.hoechsteKettentiefe) || ausloeser.hoechsteKettentiefe < 0) fehler.push("regeln.ausloeser.hoechsteKettentiefe muss eine ganze Zahl >= 0 sein");
  const unterbrechen = regeln.laufendeAktionen?.unterbrechen;
  if (!istTextliste(unterbrechen)) fehler.push("regeln.laufendeAktionen.unterbrechen muss eine Liste von Gefahrenprüfungen sein");
  else for (const name of unterbrechen) if (!hat("gefahren", name)) fehler.push(`regeln.laufendeAktionen.unterbrechen: Gefahrenprüfung "${name}" ist nicht angemeldet`);
  if (!BEZIEHUNGEN.includes(regeln.fraktionen?.beziehungVorgabe)) fehler.push(`regeln.fraktionen.beziehungVorgabe muss eines von ${BEZIEHUNGEN.join(", ")} sein`);
  const wahrnehmung = regeln.wahrnehmung;
  if (!wahrnehmung) fehler.push("regeln.wahrnehmung fehlt");
  else {
    for (const feld of ["heimlichkeitVorgabe", "heimlichkeitMindestens", "spurFaktor", "laermNahkampf"]) {
      if (!istZahlAbNull(wahrnehmung[feld])) fehler.push(`regeln.wahrnehmung.${feld} muss eine ganze Zahl >= 0 sein`);
    }
    if (!istProzent(wahrnehmung.bemerkenChance)) fehler.push("regeln.wahrnehmung.bemerkenChance muss eine ganze Zahl von 0 bis 100 sein");
    if (!istObjekt(wahrnehmung.heimlichkeitNachAktion) || !Object.values(wahrnehmung.heimlichkeitNachAktion).every(istZahlAbNull)) {
      fehler.push("regeln.wahrnehmung.heimlichkeitNachAktion muss { aktion: Prozent } sein");
    }
  }
  if (!regeln.kampf) return fehler.push("regeln.kampf fehlt");
  for (const [feld, untergrenze] of Object.entries(KAMPFREGELN)) {
    const wert = regeln.kampf[feld];
    if (!istGanzzahl(wert) || wert < untergrenze) fehler.push(`regeln.kampf.${feld} muss eine ganze Zahl >= ${untergrenze} sein`);
  }
}

// Schadensarten: { text, ruestung? }
function pruefeSchadensarten(daten, sprache, fehler) {
  if (!istObjekt(daten.schadensarten)) return fehler.push("schadensarten fehlen");
  for (const [name, schadensart] of Object.entries(daten.schadensarten)) {
    const ort = `schadensarten.${name}`;
    pruefeText(sprache.texte, schadensart.text, ort, fehler);
    pruefeParameter(daten, { ruestung: "wahrheitswert?" }, schadensart, ort, fehler);
  }
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

// Menge eines Schritts, siehe mengeBestimmen in kern/bausteine.js
function pruefeMenge(schritt, ort, fehler) {
  if (schritt.wuerfel === undefined && schritt.menge === undefined) fehler.push(`${ort}: wuerfel oder menge fehlt`);
  if (schritt.wuerfel !== undefined && !istWuerfelausdruck(schritt.wuerfel)) fehler.push(`${ort}: ungültiger Würfelausdruck "${schritt.wuerfel}"`);
  if (istObjekt(schritt.menge)) {
    if (typeof schritt.menge.aus !== "string") fehler.push(`${ort}: menge.aus fehlt`);
    if (schritt.menge.prozent !== undefined && !istZahlAbNull(schritt.menge.prozent)) fehler.push(`${ort}: menge.prozent muss eine ganze Zahl >= 0 sein`);
  } else if (schritt.menge !== undefined && !istGanzzahl(schritt.menge)) {
    fehler.push(`${ort}: menge muss eine ganze Zahl oder { aus, prozent } sein`);
  }
  if (schritt.teilen !== undefined && typeof schritt.teilen !== "string") fehler.push(`${ort}: teilen muss ein Name aus der Ablage sein`);
  if (schritt.prozentJeSprung !== undefined && !istZahlAbNull(schritt.prozentJeSprung)) fehler.push(`${ort}: prozentJeSprung muss eine ganze Zahl >= 0 sein`);
  if (schritt.mitStaerke !== undefined && typeof schritt.mitStaerke !== "boolean") fehler.push(`${ort}: mitStaerke muss true oder false sein`);
}

const istZahlAbNull = (wert) => istGanzzahl(wert) && wert >= 0;

// Parameter nach Beschreibung (siehe kern/bausteine.js): "text", "ganzzahl", "wahrheitswert", "effekt",
// "muster", "zustand", "wesen", "schadensart", mit "?" freiwillig; eine Liste nennt erlaubte Werte (freiwillig); "wuerfel|menge"
function pruefeParameter(daten, beschreibung, werte, ort, fehler) {
  for (const [feld, typ] of Object.entries(beschreibung)) {
    const wert = werte[feld];
    if (Array.isArray(typ)) {
      if (wert !== undefined && !typ.includes(wert)) fehler.push(`${ort}: ${feld} muss eines von ${typ.join(", ")} sein`);
      continue;
    }
    if (typ === "wuerfel|menge") {
      pruefeMenge(werte, ort, fehler);
      continue;
    }
    const freiwillig = typ.endsWith("?");
    const grundtyp = freiwillig ? typ.slice(0, -1) : typ;
    if (wert === undefined) {
      if (!freiwillig) fehler.push(`${ort}: ${feld} fehlt`);
      continue;
    }
    if (grundtyp === "text" && typeof wert !== "string") fehler.push(`${ort}: ${feld} muss ein Text sein`);
    else if (grundtyp === "ganzzahl" && !istZahlAbNull(wert)) fehler.push(`${ort}: ${feld} muss eine ganze Zahl >= 0 sein`);
    else if (grundtyp === "wahrheitswert" && typeof wert !== "boolean") fehler.push(`${ort}: ${feld} muss true oder false sein`);
    else if (grundtyp === "effekt") pruefeEffektVerweis(daten, wert, `${ort}.${feld}`, fehler);
    else if (grundtyp === "muster") pruefeMuster(daten, wert, `${ort}.${feld}`, fehler);
    else if (grundtyp === "zustand" && !daten.zustaende?.[wert]) fehler.push(`${ort}.${feld}: Zustand "${wert}" gibt es nicht`);
    else if (grundtyp === "schadensart" && !daten.schadensarten?.[wert]) fehler.push(`${ort}.${feld}: Schadensart "${wert}" gibt es nicht`);
    else if (grundtyp === "wesen" && (!daten.wesen?.[wert] || daten.wesen[wert].abstrakt)) fehler.push(`${ort}.${feld}: Wesen "${wert}" gibt es nicht`);
  }
}

const istTextliste = (wert) => Array.isArray(wert) && wert.every((eintrag) => typeof eintrag === "string");

// Modifikatoren: [{ ziel, art, betrag, tag?, wenn? }], siehe kern/werte.js
function pruefeModifikatoren(daten, liste, ort, fehler) {
  if (!Array.isArray(liste)) {
    fehler.push(`${ort}: muss eine Liste sein`);
    return;
  }
  liste.forEach((modifikator, nummer) => {
    const stelle = `${ort}[${nummer}]`;
    const gueltig = typeof modifikator?.ziel === "string" && MODIFIKATORARTEN.includes(modifikator.art) && istGanzzahl(modifikator.betrag);
    if (!gueltig) fehler.push(`${stelle}: braucht ziel, art (${MODIFIKATORARTEN.join(", ")}) und betrag als ganze Zahl`);
    if (modifikator?.tag !== undefined && typeof modifikator.tag !== "string") fehler.push(`${stelle}: tag muss ein Text sein`);
    if (modifikator?.wenn === undefined) return;
    if (!Array.isArray(modifikator.wenn)) {
      fehler.push(`${stelle}: wenn muss eine Liste sein`);
      return;
    }
    pruefeBedingungen(daten, modifikator.wenn, `${stelle}.wenn`, fehler);
  });
}

// Bedingungen aus dem Register "modifikatorbedingungen": [{ bedingung, ...parameter }] (wenn, voraussetzungen)
function pruefeBedingungen(daten, liste, ort, fehler) {
  liste.forEach((bedingung, nummer) => {
    const stelle = `${ort}[${nummer}]`;
    if (!hat("modifikatorbedingungen", bedingung?.bedingung)) fehler.push(`${stelle}: Bedingung "${bedingung?.bedingung}" ist nicht angemeldet`);
    else pruefeParameter(daten, holen("modifikatorbedingungen", bedingung.bedingung).parameter || {}, bedingung, stelle, fehler);
  });
}

// Vorräte als { wertName: ganze Zahl >= 0 } (verbrauch, unterhalt)
function pruefeVorratsmengen(mengen, ort, fehler) {
  if (!istObjekt(mengen)) return fehler.push(`${ort} muss ein Objekt { wert: menge } sein`);
  for (const [wertName, menge] of Object.entries(mengen)) {
    if (!istZahlAbNull(menge)) fehler.push(`${ort}.${wertName} muss eine ganze Zahl >= 0 sein`);
  }
}

// Zielart wie in zielAufloesen (systeme/zielauswahl.js)
function pruefeZielart(daten, zielart, ort, fehler) {
  if (!istObjekt(zielart) || !ZIELARTEN.includes(zielart.art)) return fehler.push(`${ort}: art muss eines von ${ZIELARTEN.join(", ")} sein`);
  const felder = { reichweite: "ganzzahl?", brauchtSichtlinie: "wahrheitswert?", ohneUrheber: "wahrheitswert?", durchdringend: "wahrheitswert?", ueberZielHinaus: "wahrheitswert?", ueberVerbuendete: "wahrheitswert?", trifft: TRIFFT_ARTEN };
  pruefeParameter(daten, felder, zielart, ort, fehler);
  if (zielart.muster !== undefined) pruefeMuster(daten, zielart.muster, `${ort}.muster`, fehler);
}

// Fähigkeiten, siehe systeme/faehigkeiten.js
function pruefeFaehigkeit(daten, sprache, name, faehigkeit, fehler) {
  const ort = `faehigkeiten.${name}`;
  pruefeText(sprache.texte, faehigkeit.text, ort, fehler);
  const art = faehigkeit.art ?? "aktiv";
  if (!FAEHIGKEITSARTEN.includes(art)) fehler.push(`${ort}: art muss eines von ${FAEHIGKEITSARTEN.join(", ")} sein`);
  if (faehigkeit.tags !== undefined && !istTextliste(faehigkeit.tags)) fehler.push(`${ort}: tags muss eine Liste von Texten sein`);
  if (faehigkeit.verbrauch !== undefined) pruefeVorratsmengen(faehigkeit.verbrauch, `${ort}: verbrauch`, fehler);
  if (faehigkeit.zeit !== undefined && !(istGanzzahl(faehigkeit.zeit) && faehigkeit.zeit > 0)) fehler.push(`${ort}: zeit muss eine ganze Zahl > 0 sein`);
  if (faehigkeit.zeit === undefined && daten.aktionen.faehigkeit === undefined) fehler.push(`${ort}: ohne zeit braucht es aktionen.faehigkeit`);
  if (faehigkeit.abklingzeit !== undefined && !istZahlAbNull(faehigkeit.abklingzeit)) fehler.push(`${ort}: abklingzeit muss eine ganze Zahl >= 0 sein`);
  if (faehigkeit.material !== undefined) {
    if (!Array.isArray(faehigkeit.material)) fehler.push(`${ort}: material muss eine Liste sein`);
    else faehigkeit.material.forEach((eintrag, nummer) => {
      if (!daten.gegenstaende[eintrag?.typ]) fehler.push(`${ort}.material[${nummer}]: Gegenstand "${eintrag?.typ}" gibt es nicht`);
      if (!(istGanzzahl(eintrag?.anzahl) && eintrag.anzahl > 0)) fehler.push(`${ort}.material[${nummer}]: anzahl muss eine ganze Zahl > 0 sein`);
    });
  }
  if (faehigkeit.voraussetzungen !== undefined) {
    if (!Array.isArray(faehigkeit.voraussetzungen)) fehler.push(`${ort}: voraussetzungen muss eine Liste sein`);
    else pruefeBedingungen(daten, faehigkeit.voraussetzungen, `${ort}.voraussetzungen`, fehler);
  }
  if (faehigkeit.dauer !== undefined && !(istObjekt(faehigkeit.dauer) && istGanzzahl(faehigkeit.dauer.schritte) && faehigkeit.dauer.schritte > 0)) fehler.push(`${ort}: dauer muss { schritte } mit einer ganzen Zahl > 0 sein`);
  pruefeParameter(daten, { beimAbbruch: "effekt?", unterbrechbar: "wahrheitswert?" }, faehigkeit, ort, fehler);
  if (faehigkeit.ankuendigung !== undefined) pruefeText(sprache.texte, faehigkeit.ankuendigung, `${ort}.ankuendigung`, fehler);
  if ((faehigkeit.ankuendigung !== undefined || faehigkeit.unterbrechbar !== undefined) && faehigkeit.dauer === undefined) fehler.push(`${ort}: ankuendigung und unterbrechbar gibt es nur mit dauer`);
  if (faehigkeit.risiko !== undefined && !daten.risiken?.[faehigkeit.risiko]) fehler.push(`${ort}: Risikotabelle "${faehigkeit.risiko}" gibt es nicht`);
  if (art === "aktiv") {
    if (faehigkeit.ziel === undefined) fehler.push(`${ort}: ziel fehlt`);
    else pruefeZielart(daten, faehigkeit.ziel, `${ort}.ziel`, fehler);
    pruefeParameter(daten, { wirkung: "effekt" }, faehigkeit, ort, fehler);
  } else if (art === "aufrecht") {
    pruefeParameter(daten, { zustand: "zustand" }, faehigkeit, ort, fehler);
  }
}

// Risikotabellen: [{ name, chance: Kurve, wirkt, effekt? }]
function pruefeRisiken(daten, fehler) {
  for (const [name, tabelle] of Object.entries(daten.risiken || {})) {
    const ort = `risiken.${name}`;
    if (!Array.isArray(tabelle) || tabelle.length === 0) {
      fehler.push(`${ort}: muss eine Liste mit mindestens einem Ausgang sein`);
      continue;
    }
    tabelle.forEach((ausgang, nummer) => {
      const stelle = `${ort}[${nummer}]`;
      pruefeParameter(daten, { name: "text", wirkt: "wahrheitswert", effekt: "effekt?" }, ausgang, stelle, fehler);
      fehler.push(...kurvenfehler(ausgang.chance, `${stelle}.chance`));
    });
  }
}

// Auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }], siehe systeme/modifikatoren.js
function pruefeAuren(daten, auren, ort, fehler) {
  if (!Array.isArray(auren)) {
    fehler.push(`${ort}: auren muss eine Liste sein`);
    return;
  }
  auren.forEach((aura, nummer) => {
    const stelle = `${ort}.auren[${nummer}]`;
    pruefeParameter(daten, { reichweite: "ganzzahl", selbst: "wahrheitswert?", sichtlinie: "wahrheitswert?" }, aura, stelle, fehler);
    if (!TRIFFT_ARTEN.includes(aura.trifft)) fehler.push(`${stelle}: trifft muss eines von ${TRIFFT_ARTEN.join(", ")} sein`);
    pruefeModifikatoren(daten, aura.modifikatoren ?? "fehlt", `${stelle}.modifikatoren`, fehler);
  });
}

// Zielmuster: { art, ...parameter }, siehe systeme/zielauswahl.js
function pruefeMuster(daten, muster, ort, fehler) {
  if (!istObjekt(muster) || typeof muster.art !== "string") return fehler.push(`${ort}: Zielmuster braucht die Form { art, ... }`);
  if (!hat("zielmuster", muster.art)) return fehler.push(`${ort}: Zielmuster "${muster.art}" ist nicht angemeldet`);
  pruefeParameter(daten, holen("zielmuster", muster.art).parameter || {}, muster, ort, fehler);
}

function pruefeEffekt(daten, name, effekt, fehler) {
  const ort = `effekte.${name}`;
  if (effekt.tags !== undefined && !(Array.isArray(effekt.tags) && effekt.tags.every((tag) => typeof tag === "string"))) fehler.push(`${ort}: tags muss eine Liste von Texten sein`);
  if (!Array.isArray(effekt.schritte) || effekt.schritte.length === 0) return fehler.push(`${ort}: schritte fehlen`);
  effekt.schritte.forEach((schritt, nummer) => {
    const schrittOrt = `${ort}.schritte[${nummer}]`;
    if (!hat("bausteine", schritt.baustein)) return fehler.push(`${schrittOrt}: Baustein "${schritt.baustein}" ist nicht angemeldet`);
    pruefeParameter(daten, holen("bausteine", schritt.baustein).parameter || {}, schritt, schrittOrt, fehler);
  });
}

// Namen der Effekte, die ein Effekt sofort aufruft: Parameter vom Typ "effekt" und, über Parameter vom
// Typ "zustand", die Effekte beim Beginn und Ende dieses Zustands (jeTick wirkt erst später)
function aufgerufeneEffekte(daten, effekt) {
  const namen = [];
  for (const schritt of effekt.schritte || []) {
    if (!hat("bausteine", schritt.baustein)) continue;
    for (const [feld, typ] of Object.entries(holen("bausteine", schritt.baustein).parameter || {})) {
      if (typeof schritt[feld] !== "string") continue;
      if (typ === "effekt" || typ === "effekt?") namen.push(schritt[feld]);
      const zustand = (typ === "zustand" || typ === "zustand?") && daten.zustaende?.[schritt[feld]];
      if (zustand) for (const anlass of ["beimBeginn", "beimEnde"]) if (typeof zustand[anlass] === "string") namen.push(zustand[anlass]);
    }
  }
  return namen;
}

// Benannte Effekte dürfen sich nicht im Kreis aufrufen; jeder Kreis wird einmal gemeldet
function pruefeEffektKreise(daten, fehler) {
  const effekte = daten.effekte;
  const fertig = new Set();
  const besuchen = (name, kette) => {
    if (fertig.has(name) || !effekte[name]) return;
    for (const aufgerufen of aufgerufeneEffekte(daten, effekte[name])) {
      const position = kette.indexOf(aufgerufen);
      if (position >= 0) fehler.push(`effekte.${aufgerufen}: Effekte rufen sich im Kreis auf (${[...kette.slice(position), aufgerufen].join(" > ")})`);
      else besuchen(aufgerufen, [...kette, aufgerufen]);
    }
    fertig.add(name);
  };
  for (const name of Object.keys(effekte)) besuchen(name, [name]);
}

// KI-Komponente: { modul, trifft?, wachzustand?, faehigkeiten?, abstandHalten? }, siehe ki/jagen.js und ki/faehigkeitenwahl.js
// bekannte: die Fähigkeiten des Wesens (bei einer KI aus einem Zustand null, dann zählt nur, dass es sie gibt)
function pruefeKi(daten, ki, ort, fehler, bekannte = null) {
  if (!istObjekt(ki) || !hat("ki", ki.modul)) return fehler.push(`${ort}: Verhaltensmodul "${ki?.modul}" ist nicht angemeldet`);
  pruefeParameter(daten, { trifft: TRIFFT_ARTEN, wachzustand: WACHZUSTAENDE, abstandHalten: "ganzzahl?" }, ki, ort, fehler);
  if (ki.abstandHalten === 0) fehler.push(`${ort}: abstandHalten muss eine ganze Zahl > 0 sein`);
  if (ki.faehigkeiten === undefined) return;
  if (!Array.isArray(ki.faehigkeiten)) return fehler.push(`${ort}: faehigkeiten muss eine Liste sein`);
  ki.faehigkeiten.forEach((eintrag, nummer) => {
    const stelle = `${ort}.faehigkeiten[${nummer}]`;
    if (!istObjekt(eintrag)) return fehler.push(`${stelle}: Eintrag muss ein Objekt { name, ... } sein`);
    pruefeParameter(daten, { name: "text", abstandAb: "ganzzahl?", abstandBis: "ganzzahl?" }, eintrag, stelle, fehler);
    if (eintrag.chance !== undefined && !istProzent(eintrag.chance)) fehler.push(`${stelle}: chance muss eine ganze Zahl von 0 bis 100 sein`);
    if (typeof eintrag.name === "string" && !daten.faehigkeiten?.[eintrag.name]) fehler.push(`${stelle}: Fähigkeit "${eintrag.name}" gibt es nicht`);
    else if (bekannte && typeof eintrag.name === "string" && !bekannte.includes(eintrag.name)) fehler.push(`${stelle}: das Wesen kennt die Fähigkeit "${eintrag.name}" nicht (faehigkeiten)`);
    if (eintrag.wenn !== undefined) {
      if (!Array.isArray(eintrag.wenn)) fehler.push(`${stelle}: wenn muss eine Liste sein`);
      else pruefeBedingungen(daten, eintrag.wenn, `${stelle}.wenn`, fehler);
    }
  });
}

// Fraktionen: { text, beziehungen? }, siehe systeme/fraktionen.js
function pruefeFraktionen(daten, sprache, fehler) {
  for (const [name, fraktion] of Object.entries(daten.fraktionen || {})) {
    const ort = `fraktionen.${name}`;
    pruefeText(sprache.texte, fraktion.text, ort, fehler);
    for (const [andere, wert] of Object.entries(fraktion.beziehungen || {})) {
      if (!daten.fraktionen[andere]) fehler.push(`${ort}.beziehungen: Fraktion "${andere}" gibt es nicht`);
      if (!BEZIEHUNGEN.includes(wert)) fehler.push(`${ort}.beziehungen.${andere} muss eines von ${BEZIEHUNGEN.join(", ")} sein`);
    }
  }
}

// Zustände, siehe systeme/zustaende.js
function pruefeZustand(daten, sprache, name, zustand, fehler) {
  const ort = `zustaende.${name}`;
  if (zustand.abstrakt) return;
  pruefeText(sprache.texte, zustand.text, ort, fehler);
  if (zustand.dauer !== undefined && !(istGanzzahl(zustand.dauer) && zustand.dauer > 0)) fehler.push(`${ort}: dauer muss eine ganze Zahl > 0 sein`);
  if (zustand.hoechstStapel !== undefined && !(istGanzzahl(zustand.hoechstStapel) && zustand.hoechstStapel > 0)) fehler.push(`${ort}: hoechstStapel muss eine ganze Zahl > 0 sein`);
  const felder = { stapel: STAPELREGELN, jeTick: "effekt?", beimBeginn: "effekt?", beimEnde: "effekt?", gebundenAnQuelle: "wahrheitswert?", handlungsunfaehig: "wahrheitswert?", fraktion: "text?" };
  pruefeParameter(daten, felder, zustand, ort, fehler);
  if (zustand.ki !== undefined) pruefeKi(daten, zustand.ki, `${ort}.ki`, fehler);
  if (zustand.befehl !== undefined) {
    const veraenderer = zustand.befehl?.veraenderer;
    if (!hat("befehlsveraenderer", veraenderer)) fehler.push(`${ort}.befehl: Befehlsveränderer "${veraenderer}" ist nicht angemeldet`);
    else pruefeParameter(daten, holen("befehlsveraenderer", veraenderer).parameter || {}, zustand.befehl, `${ort}.befehl`, fehler);
  }
  if (typeof zustand.verlauf === "string") {
    if (!(zustand.verlauf in VERLAEUFE)) fehler.push(`${ort}: verlauf muss eines von ${Object.keys(VERLAEUFE).join(", ")} oder eine Kurve sein`);
  } else if (zustand.verlauf !== undefined) {
    fehler.push(...kurvenfehler(zustand.verlauf, `${ort}.verlauf`));
  }
  if (zustand.tags !== undefined && !(Array.isArray(zustand.tags) && zustand.tags.every((tag) => typeof tag === "string"))) fehler.push(`${ort}: tags muss eine Liste von Texten sein`);
  if (zustand.modifikatoren !== undefined) pruefeModifikatoren(daten, zustand.modifikatoren, `${ort}.modifikatoren`, fehler);
  if (zustand.auren !== undefined) pruefeAuren(daten, zustand.auren, ort, fehler);
  if (zustand.ausloeser !== undefined) pruefeAusloeser(daten, zustand.ausloeser, ort, fehler);
  if (zustand.unterhalt !== undefined) pruefeVorratsmengen(zustand.unterhalt, `${ort}: unterhalt`, fehler);
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
  daten.zustaende = vorlagenAufloesen(rohdaten.zustaende || {}, "zustaende", fehler);

  pruefeSchadensarten(daten, sprache, fehler);
  pruefeFraktionen(daten, sprache, fehler);
  for (const [name, effekt] of Object.entries(daten.effekte)) pruefeEffekt(daten, name, effekt, fehler);
  pruefeEffektKreise(daten, fehler);
  for (const [name, zustand] of Object.entries(daten.zustaende)) pruefeZustand(daten, sprache, name, zustand, fehler);
  pruefeRisiken(daten, fehler);
  for (const [name, faehigkeit] of Object.entries(daten.faehigkeiten || {})) pruefeFaehigkeit(daten, sprache, name, faehigkeit, fehler);
  for (const [name, wesen] of Object.entries(daten.wesen)) pruefeWesen(daten, sprache, name, wesen, fehler);
  for (const [name, gegenstand] of Object.entries(daten.gegenstaende)) pruefeGegenstand(daten, sprache, name, gegenstand, fehler);
  for (const [name, ebene] of Object.entries(daten.ebenen)) pruefeEbene(daten, name, ebene, fehler);
  for (const [name, gelaende] of Object.entries(daten.gelaende)) {
    if (typeof gelaende.kennung !== "string" || gelaende.kennung.length !== 1) fehler.push(`gelaende.${name}: kennung muss genau ein Zeichen sein`);
    if (gelaende.laermdaempfung !== undefined && !istZahlAbNull(gelaende.laermdaempfung)) fehler.push(`gelaende.${name}: laermdaempfung muss eine ganze Zahl >= 0 sein`);
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
