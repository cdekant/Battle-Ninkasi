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
import { WAHLREGELN } from "../ki/handlungen.js";
import { UNTERBRECHUNGSGRUENDE } from "../systeme/laufendeAktionen.js";
import { BEWEGUNGSARTEN } from "../welt/karte.js";
import { HOECHSTE_STUFE, ANZAHL_TIERS, eigenschaftenPruefen } from "../systeme/skills.js";

// Vorbelegung des Cursors im Zielmodus (eingabe/zielmodus.js)
const ZIELVORGABEN = ["feind", "gefaehrte", "selbst"];

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
  pruefeParameter(daten, { bewegung: BEWEGUNGSARTEN, tueren: ["oeffnen", "nicht"], tragkraft: "ganzzahl?", folgt: "wahrheitswert?" }, wesen, ort, fehler);
  // gebundene EP und Eigenschaften, siehe systeme/lernen.js und systeme/skills.js
  pruefeParameter(daten, { ep: "ganzzahl?" }, wesen, ort, fehler);
  if (wesen.eigenschaften !== undefined) {
    if (!istObjekt(wesen.eigenschaften)) fehler.push(`${ort}: eigenschaften muss ein Objekt { eigenschaft: wert } sein`);
    else if (name === "ninkasi") {
      const grund = daten.regeln?.lernen ? eigenschaftenPruefen(daten, wesen.eigenschaften) : null;
      if (grund) fehler.push(`${ort}.eigenschaften: ${grund}`);
    } else {
      for (const [eigenschaft, wert] of Object.entries(wesen.eigenschaften)) {
        if (!daten.eigenschaften?.[eigenschaft]) fehler.push(`${ort}.eigenschaften: Eigenschaft "${eigenschaft}" gibt es nicht`);
        else if (!(istGanzzahl(wert) && wert >= 1)) fehler.push(`${ort}.eigenschaften.${eigenschaft} muss eine ganze Zahl >= 1 sein`);
      }
    }
  }
  if (wesen.plaetze !== undefined) {
    const plaetze = daten.regeln?.ausruestung?.plaetze || [];
    if (!istObjekt(wesen.plaetze)) fehler.push(`${ort}: plaetze muss ein Objekt { platz: anzahl } sein`);
    else for (const [platz, anzahl] of Object.entries(wesen.plaetze)) {
      if (!plaetze.includes(platz)) fehler.push(`${ort}.plaetze: Platz "${platz}" steht nicht in regeln.ausruestung.plaetze`);
      if (!istZahlAbNull(anzahl)) fehler.push(`${ort}.plaetze.${platz} muss eine ganze Zahl >= 0 sein`);
    }
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

function pruefeRegeln(daten, regeln, fehler) {
  const ausloeser = regeln?.ausloeser;
  if (!ausloeser) return fehler.push("regeln.ausloeser fehlt");
  if (!istProzent(ausloeser.daempfungProStufe)) fehler.push("regeln.ausloeser.daempfungProStufe muss eine ganze Zahl von 0 bis 100 sein");
  if (!istGanzzahl(ausloeser.hoechsteKettentiefe) || ausloeser.hoechsteKettentiefe < 0) fehler.push("regeln.ausloeser.hoechsteKettentiefe muss eine ganze Zahl >= 0 sein");
  const unterbrechen = regeln.laufendeAktionen?.unterbrechen;
  if (!istTextliste(unterbrechen)) fehler.push("regeln.laufendeAktionen.unterbrechen muss eine Liste von Gefahrenprüfungen sein");
  else for (const name of unterbrechen) if (!hat("gefahren", name)) fehler.push(`regeln.laufendeAktionen.unterbrechen: Gefahrenprüfung "${name}" ist nicht angemeldet`);
  if (!BEZIEHUNGEN.includes(regeln.fraktionen?.beziehungVorgabe)) fehler.push(`regeln.fraktionen.beziehungVorgabe muss eines von ${BEZIEHUNGEN.join(", ")} sein`);
  pruefeRufregeln(daten, regeln.fraktionen ?? {}, fehler);
  if (!istZahlAbNull(regeln.kampf?.nachwirkung)) fehler.push("regeln.kampf.nachwirkung muss eine ganze Zahl >= 0 sein");
  const wahrnehmung = regeln.wahrnehmung;
  if (!wahrnehmung) fehler.push("regeln.wahrnehmung fehlt");
  else {
    for (const feld of ["heimlichkeitVorgabe", "heimlichkeitMindestens", "spurFaktor", "laermNahkampf", "laermWurf"]) {
      if (!istZahlAbNull(wahrnehmung[feld])) fehler.push(`regeln.wahrnehmung.${feld} muss eine ganze Zahl >= 0 sein`);
    }
    if (!istProzent(wahrnehmung.bemerkenChance)) fehler.push("regeln.wahrnehmung.bemerkenChance muss eine ganze Zahl von 0 bis 100 sein");
    if (!istObjekt(wahrnehmung.heimlichkeitNachAktion) || !Object.values(wahrnehmung.heimlichkeitNachAktion).every(istZahlAbNull)) {
      fehler.push("regeln.wahrnehmung.heimlichkeitNachAktion muss { aktion: Prozent } sein");
    }
  }
  if (!istObjekt(regeln.bewegung)) fehler.push("regeln.bewegung fehlt");
  else pruefeParameter(daten, { beimFestsitzen: "effekt", umwegHoechstens: "ganzzahl?" }, regeln.bewegung, "regeln.bewegung", fehler);
  if (!istGanzzahl(regeln.werfen?.reichweite) || regeln.werfen.reichweite < 1) fehler.push("regeln.werfen.reichweite muss eine ganze Zahl >= 1 sein");
  if (!istGanzzahl(regeln.population?.hoechstWesen) || regeln.population.hoechstWesen < 1) fehler.push("regeln.population.hoechstWesen muss eine ganze Zahl >= 1 sein");
  if (!istProzent(regeln.population?.tieferChance)) fehler.push("regeln.population.tieferChance muss eine ganze Zahl von 0 bis 100 sein");
  if (!istZahlAbNull(regeln.population?.tieferBis)) fehler.push("regeln.population.tieferBis muss eine ganze Zahl >= 0 sein");
  if (!istGanzzahl(regeln.ebenen?.versuche) || regeln.ebenen.versuche < 1) fehler.push("regeln.ebenen.versuche muss eine ganze Zahl >= 1 sein");
  if (!istZahlAbNull(regeln.ebenen?.folgen?.abstand)) fehler.push("regeln.ebenen.folgen.abstand muss eine ganze Zahl >= 0 sein");
  if (!istObjekt(regeln.schichten)) fehler.push("regeln.schichten fehlt");
  else pruefeParameter(daten, { hoechstOberflaeche: "ganzzahl", hoechstGas: "ganzzahl" }, regeln.schichten, "regeln.schichten", fehler);
  if (!istObjekt(regeln.feuer)) fehler.push("regeln.feuer fehlt");
  else pruefeParameter(daten, { brennen: "effekt", dauer: "ganzzahl", rauch: "gas?", rauchMenge: "ganzzahl" }, regeln.feuer, "regeln.feuer", fehler);
  if (!istTextliste(regeln.ausruestung?.plaetze)) fehler.push("regeln.ausruestung.plaetze muss eine Liste von Namen sein");
  const tragen = regeln.tragen;
  if (!istZahlAbNull(tragen?.tragkraft)) fehler.push("regeln.tragen.tragkraft muss eine ganze Zahl >= 0 sein");
  if (!Array.isArray(tragen?.stufen) || !tragen.stufen.every((stufe, nummer) => istZahlAbNull(stufe?.ab) && istZahlAbNull(stufe?.kosten) && (nummer === 0 || stufe.ab > tragen.stufen[nummer - 1].ab))) {
    fehler.push("regeln.tragen.stufen muss eine Liste [{ ab, kosten }] mit aufsteigendem ab sein");
  }
  if (!istObjekt(regeln.fallen)) fehler.push("regeln.fallen fehlt");
  else pruefeParameter(daten, { entdeckenVorgabe: "ganzzahl", reichweite: "ganzzahl" }, regeln.fallen, "regeln.fallen", fehler);
  pruefeLernregeln(daten, regeln.lernen, fehler);
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

// Feldschichten: { oberflaechen, gase }, siehe systeme/schichten.js; Zeichen in zeichen.schichten
function pruefeSchichten(daten, sprache, fehler) {
  const schichten = daten.schichten;
  if (!istObjekt(schichten) || !istObjekt(schichten.oberflaechen) || !istObjekt(schichten.gase)) return fehler.push("schichten { oberflaechen, gase } fehlen");
  const prozentfeld = (werte, feld, ort) => {
    if (werte[feld] !== undefined && !istProzent(werte[feld])) fehler.push(`${ort}: ${feld} muss eine ganze Zahl von 0 bis 100 sein`);
  };
  for (const [name, art] of Object.entries(schichten.oberflaechen)) {
    const ort = `schichten.oberflaechen.${name}`;
    pruefeText(sprache.texte, art.text, ort, fehler);
    pruefeParameter(daten, { schwund: "ganzzahl?", hoechstens: "ganzzahl?", beimBetreten: "effekt?", jeTick: "effekt?", brenndauer: "ganzzahl?", verbrenntZu: "oberflaeche?", gefaehrlich: "wahrheitswert?" }, art, ort, fehler);
    prozentfeld(art, "brennbar", ort);
    if (art.ausbreitung !== undefined) {
      if (!istObjekt(art.ausbreitung)) fehler.push(`${ort}: ausbreitung muss { chance } sein`);
      else if (!istProzent(art.ausbreitung.chance)) fehler.push(`${ort}.ausbreitung: chance muss eine ganze Zahl von 0 bis 100 sein`);
    }
    const arten = art.ausloesenFuer;
    if (arten !== undefined && !(istTextliste(arten) && arten.every((bewegung) => BEWEGUNGSARTEN.includes(bewegung)))) fehler.push(`${ort}: ausloesenFuer muss eine Liste aus ${BEWEGUNGSARTEN.join(", ")} sein`);
    if (!daten.zeichen.schichten?.[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js (schichten)`);
  }
  for (const [name, art] of Object.entries(schichten.gase)) {
    const ort = `schichten.gase.${name}`;
    pruefeText(sprache.texte, art.text, ort, fehler);
    pruefeParameter(daten, { hoechstens: "ganzzahl?", undurchsichtigAb: "ganzzahl?", explodiert: "effekt?", gefaehrlich: "wahrheitswert?" }, art, ort, fehler);
    prozentfeld(art, "abbau", ort);
    prozentfeld(art, "brennbar", ort);
    if (art.stufen !== undefined) {
      if (!Array.isArray(art.stufen)) fehler.push(`${ort}: stufen muss eine Liste sein`);
      else art.stufen.forEach((stufe, nummer) => {
        const stelle = `${ort}.stufen[${nummer}]`;
        pruefeParameter(daten, { ab: "ganzzahl", effekt: "effekt" }, stufe, stelle, fehler);
        if (nummer > 0 && istGanzzahl(stufe.ab) && stufe.ab <= art.stufen[nummer - 1].ab) fehler.push(`${stelle}: ab muss aufsteigen`);
        if (stufe.wenn !== undefined) {
          if (!Array.isArray(stufe.wenn)) fehler.push(`${stelle}: wenn muss eine Liste sein`);
          else pruefeBedingungen(daten, stufe.wenn, `${stelle}.wenn`, fehler);
        }
      });
    }
    if (!daten.zeichen.schichten?.[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js (schichten)`);
  }
  if (!daten.zeichen.schichten?.feuer) fehler.push("zeichen.schichten.feuer fehlt");
}

// Fallen: { text, falle: { tarnung, effekt, ausloesenFuer? }, verborgen? }, siehe systeme/fallen.js
function pruefeFalle(daten, sprache, name, falle, fehler) {
  const ort = `fallen.${name}`;
  pruefeText(sprache.texte, falle.text, ort, fehler);
  pruefeNomen(sprache, falle.text, fehler);
  if (!istObjekt(falle.falle)) return fehler.push(`${ort}: falle { tarnung, effekt } fehlt`);
  pruefeParameter(daten, { tarnung: "ganzzahl", effekt: "effekt" }, falle.falle, `${ort}.falle`, fehler);
  const arten = falle.falle.ausloesenFuer;
  if (arten !== undefined && !(istTextliste(arten) && arten.every((art) => BEWEGUNGSARTEN.includes(art)))) fehler.push(`${ort}.falle: ausloesenFuer muss eine Liste aus ${BEWEGUNGSARTEN.join(", ")} sein`);
  pruefeParameter(daten, { verborgen: "wahrheitswert?" }, falle, ort, fehler);
  if (!daten.zeichen.fallen?.[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

function pruefeGegenstand(daten, sprache, name, gegenstand, fehler) {
  const ort = `gegenstaende.${name}`;
  if (gegenstand.abstrakt) return;
  pruefeText(sprache.texte, gegenstand.text, ort, fehler);
  pruefeNomen(sprache, gegenstand.text, fehler);
  if (gegenstand.trinkbar) pruefeEffektVerweis(daten, gegenstand.trinkbar.effekt, `${ort}.trinkbar`, fehler);
  if (gegenstand.tags !== undefined && !istTextliste(gegenstand.tags)) fehler.push(`${ort}: tags muss eine Liste von Texten sein`);
  // Stapel, Ladungen, Behälter, Gewicht, siehe systeme/inventar.js
  pruefeParameter(daten, { stapelbar: "wahrheitswert?", gewicht: "ganzzahl?" }, gegenstand, ort, fehler);
  if (gegenstand.wirdZu !== undefined && !daten.gegenstaende[gegenstand.wirdZu]) fehler.push(`${ort}: wirdZu: Gegenstand "${gegenstand.wirdZu}" gibt es nicht`);
  if (gegenstand.ladungen !== undefined) {
    const ladungen = gegenstand.ladungen;
    if (!istObjekt(ladungen) || !(istGanzzahl(ladungen.hoechstens) && ladungen.hoechstens > 0)) fehler.push(`${ort}: ladungen muss { hoechstens > 0, gewichtJe? } sein`);
    else pruefeParameter(daten, { gewichtJe: "ganzzahl?" }, ladungen, `${ort}.ladungen`, fehler);
    if (gegenstand.stapelbar) fehler.push(`${ort}: ein Gegenstand mit ladungen ist nicht stapelbar`);
  }
  // Ausrüstung, siehe systeme/ausruestung.js
  if (gegenstand.ausruestung !== undefined) {
    const ausruestung = gegenstand.ausruestung;
    if (!istObjekt(ausruestung)) fehler.push(`${ort}: ausruestung muss ein Objekt { platz, ... } sein`);
    else {
      const plaetze = daten.regeln?.ausruestung?.plaetze || [];
      if (!plaetze.includes(ausruestung.platz)) fehler.push(`${ort}.ausruestung: platz muss eines von ${plaetze.join(", ")} sein`);
      if (ausruestung.belegt !== undefined && !(istGanzzahl(ausruestung.belegt) && ausruestung.belegt > 0)) fehler.push(`${ort}.ausruestung: belegt muss eine ganze Zahl > 0 sein`);
      if (ausruestung.angriffe !== undefined) pruefeAngriffe(daten, ausruestung.angriffe, `${ort}.ausruestung`, fehler);
      if (ausruestung.modifikatoren !== undefined) pruefeModifikatoren(daten, ausruestung.modifikatoren, `${ort}.ausruestung.modifikatoren`, fehler);
      if (ausruestung.ausloeser !== undefined) pruefeAusloeser(daten, ausruestung.ausloeser, `${ort}.ausruestung`, fehler);
      // Anforderungen, siehe systeme/skills.js
      if (ausruestung.anforderung !== undefined) pruefeAnforderung(daten, ausruestung.anforderung, `${ort}.ausruestung.anforderung`, fehler);
      if (ausruestung.abzugJePunkt !== undefined) pruefeAnforderungsabzug(daten, ausruestung.abzugJePunkt, `${ort}.ausruestung.abzugJePunkt`, fehler);
    }
  }
  // Werfen, siehe systeme/werfen.js
  if (gegenstand.wurf !== undefined) {
    if (!istObjekt(gegenstand.wurf)) fehler.push(`${ort}: wurf muss ein Objekt { effekt?, reichweite? } sein`);
    else {
      pruefeParameter(daten, { effekt: "effekt?", reichweite: "ganzzahl?" }, gegenstand.wurf, `${ort}.wurf`, fehler);
      if (gegenstand.wurf.reichweite === 0) fehler.push(`${ort}.wurf: reichweite muss eine ganze Zahl >= 1 sein`);
    }
  }
  pruefeVerschleiss(daten, gegenstand, ort, fehler);
  // Fluch und Unbekanntes, siehe systeme/ausruestung.js und systeme/kennen.js
  pruefeParameter(daten, { verflucht: "wahrheitswert?" }, gegenstand, ort, fehler);
  if (gegenstand.verflucht && !gegenstand.ausruestung) fehler.push(`${ort}: verflucht wirkt nur an Ausrüstung`);
  if (gegenstand.unbekannt !== undefined) {
    const unbekannt = gegenstand.unbekannt;
    if (!istObjekt(unbekannt) || !daten.etiketten?.[unbekannt.gruppe]) fehler.push(`${ort}: unbekannt muss { gruppe, schwierigkeit } mit einer Gruppe aus daten/etiketten.js sein`);
    else if (!istZahlAbNull(unbekannt.schwierigkeit)) fehler.push(`${ort}.unbekannt: schwierigkeit muss eine ganze Zahl >= 0 sein`);
  }
  if (!daten.zeichen.gegenstaende[name]) fehler.push(`${ort}: kein Zeichen in daten/zeichen.js`);
}

// Verderben und Haltbarkeit, siehe systeme/verschleiss.js
function pruefeVerschleiss(daten, gegenstand, ort, fehler) {
  const verdirbt = gegenstand.verdirbt;
  if (verdirbt !== undefined) {
    if (!istObjekt(verdirbt) || !(istGanzzahl(verdirbt.nach) && verdirbt.nach > 0) || !daten.gegenstaende[verdirbt.wird]) {
      fehler.push(`${ort}: verdirbt muss { nach > 0, wird: Gegenstand } sein`);
    } else if (gegenstand.stapelbar && !daten.gegenstaende[verdirbt.wird].stapelbar) {
      fehler.push(`${ort}.verdirbt: ein Stapel verdirbt als Ganzes, "${verdirbt.wird}" muss darum stapelbar sein`);
    }
  }
  const haltbarkeit = gegenstand.haltbarkeit;
  if (haltbarkeit !== undefined) {
    if (!istObjekt(haltbarkeit) || !(istGanzzahl(haltbarkeit.hoechstens) && haltbarkeit.hoechstens > 0) || !daten.gegenstaende[haltbarkeit.wirdZu]) {
      fehler.push(`${ort}: haltbarkeit muss { hoechstens > 0, wirdZu: Gegenstand } sein`);
    }
    if (!gegenstand.ausruestung) fehler.push(`${ort}: haltbarkeit nutzt sich nur an Ausrüstung ab`);
    if (gegenstand.stapelbar) fehler.push(`${ort}: ein Gegenstand mit haltbarkeit ist nicht stapelbar`);
  }
}

// Etiketten unbekannter Gegenstände: { gruppe: [Textschlüssel] }, je Gruppe mindestens so viele wie Typen
function pruefeEtiketten(daten, sprache, fehler) {
  for (const [gruppe, etiketten] of Object.entries(daten.etiketten || {})) {
    const ort = `etiketten.${gruppe}`;
    if (!istTextliste(etiketten) || new Set(etiketten).size !== etiketten.length) {
      fehler.push(`${ort} muss eine Liste verschiedener Textschlüssel sein`);
      continue;
    }
    for (const schluessel of etiketten) {
      pruefeText(sprache.texte, schluessel, ort, fehler);
      pruefeNomen(sprache, schluessel, fehler);
    }
    const typen = Object.values(daten.gegenstaende).filter((gegenstand) => !gegenstand.abstrakt && gegenstand.unbekannt?.gruppe === gruppe).length;
    if (typen > etiketten.length) fehler.push(`${ort}: ${typen} unbekannte Gegenstände, aber nur ${etiketten.length} Etiketten`);
  }
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
// "muster", "zustand", "wesen", "schadensart", "fraktion", "gelaende", "oberflaeche", "gas", "skill", "eigenschaft", mit "?" freiwillig; eine Liste nennt erlaubte Werte (freiwillig); "wuerfel|menge"
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
    else if (grundtyp === "fraktion" && !daten.fraktionen?.[wert]) fehler.push(`${ort}.${feld}: Fraktion "${wert}" gibt es nicht`);
    else if (grundtyp === "wesen" && (!daten.wesen?.[wert] || daten.wesen[wert].abstrakt)) fehler.push(`${ort}.${feld}: Wesen "${wert}" gibt es nicht`);
    else if (grundtyp === "gelaende" && !daten.gelaende?.[wert]) fehler.push(`${ort}.${feld}: Gelände "${wert}" gibt es nicht`);
    else if (grundtyp === "oberflaeche" && !daten.schichten?.oberflaechen?.[wert]) fehler.push(`${ort}.${feld}: Oberfläche "${wert}" gibt es nicht`);
    else if (grundtyp === "gas" && !daten.schichten?.gase?.[wert]) fehler.push(`${ort}.${feld}: Gas "${wert}" gibt es nicht`);
    else if (grundtyp === "skill" && !daten.skills?.[wert]) fehler.push(`${ort}.${feld}: Skill "${wert}" gibt es nicht`);
    else if (grundtyp === "eigenschaft" && !daten.eigenschaften?.[wert]) fehler.push(`${ort}.${feld}: Eigenschaft "${wert}" gibt es nicht`);
  }
}

const istTextliste = (wert) => Array.isArray(wert) && wert.every((eintrag) => typeof eintrag === "string");

const BEDINGUNGEN_MIT_EIGENSCHAFT = ["eigenschaft_ab", "eigenschaft_unter"];

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
    // eigenschaft_ab und eigenschaft_unter lesen den wirksamen Wert: an einem Modifikator auf eine Eigenschaft fragte er sich selbst ab
    const liestEigenschaft = modifikator.wenn.some((bedingung) => BEDINGUNGEN_MIT_EIGENSCHAFT.includes(bedingung?.bedingung));
    if (liestEigenschaft && typeof modifikator.ziel === "string" && modifikator.ziel.startsWith("eigenschaft.")) {
      fehler.push(`${stelle}: ein Modifikator auf ${modifikator.ziel} darf keine Bedingung auf Eigenschaften haben`);
    }
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
  pruefeParameter(daten, { beimAbbruch: "effekt?" }, faehigkeit, ort, fehler);
  const unterbrechbar = faehigkeit.unterbrechbar;
  if (unterbrechbar !== undefined && unterbrechbar !== true && unterbrechbar !== false && !(istTextliste(unterbrechbar) && unterbrechbar.every((grund) => UNTERBRECHUNGSGRUENDE.includes(grund)))) {
    fehler.push(`${ort}: unterbrechbar muss true, false oder eine Liste aus ${UNTERBRECHUNGSGRUENDE.join(", ")} sein`);
  }
  if (faehigkeit.ankuendigung !== undefined) pruefeText(sprache.texte, faehigkeit.ankuendigung, `${ort}.ankuendigung`, fehler);
  if ((faehigkeit.ankuendigung !== undefined || faehigkeit.unterbrechbar !== undefined) && faehigkeit.dauer === undefined) fehler.push(`${ort}: ankuendigung und unterbrechbar gibt es nur mit dauer`);
  if (faehigkeit.risiko !== undefined && !daten.risiken?.[faehigkeit.risiko]) fehler.push(`${ort}: Risikotabelle "${faehigkeit.risiko}" gibt es nicht`);
  // Vorbelegung des Cursors im Zielmodus (eingabe/zielmodus.js); nur Anzeige
  if (faehigkeit.zielvorgabe !== undefined && !ZIELVORGABEN.includes(faehigkeit.zielvorgabe)) fehler.push(`${ort}: zielvorgabe muss eines von ${ZIELVORGABEN.join(", ")} sein`);
  // Skill, Anforderung und Ausbau, siehe systeme/faehigkeiten.js
  if (faehigkeit.skill !== undefined) {
    if (!istObjekt(faehigkeit.skill)) fehler.push(`${ort}: skill muss { name, stufe, risiko } sein`);
    else {
      pruefeParameter(daten, { name: "skill" }, faehigkeit.skill, `${ort}.skill`, fehler);
      pruefeStufe(faehigkeit.skill.stufe, `${ort}.skill`, fehler);
      if (!daten.risiken?.[faehigkeit.skill.risiko]) fehler.push(`${ort}.skill: Risikotabelle "${faehigkeit.skill.risiko}" gibt es nicht`);
    }
  }
  if (faehigkeit.anforderung !== undefined) {
    if (!istObjekt(faehigkeit.anforderung)) fehler.push(`${ort}: anforderung muss { eigenschaften, risiko } sein`);
    else {
      pruefeAnforderung(daten, faehigkeit.anforderung.eigenschaften, `${ort}.anforderung.eigenschaften`, fehler);
      if (!daten.risiken?.[faehigkeit.anforderung.risiko]) fehler.push(`${ort}.anforderung: Risikotabelle "${faehigkeit.anforderung.risiko}" gibt es nicht`);
    }
  }
  if (faehigkeit.ausbau !== undefined) {
    if (!Array.isArray(faehigkeit.ausbau)) fehler.push(`${ort}: ausbau muss eine Liste [{ wenn, aendert }] sein`);
    else faehigkeit.ausbau.forEach((eintrag, nummer) => {
      const stelle = `${ort}.ausbau[${nummer}]`;
      if (!Array.isArray(eintrag?.wenn)) fehler.push(`${stelle}: wenn muss eine Liste von Bedingungen sein`);
      else pruefeBedingungen(daten, eintrag.wenn, `${stelle}.wenn`, fehler);
      if (!istObjekt(eintrag?.aendert)) fehler.push(`${stelle}: aendert muss ein Objekt sein`);
      else {
        if (eintrag.aendert.ausbau !== undefined || eintrag.aendert.art !== undefined) fehler.push(`${stelle}: aendert darf ausbau und art nicht ändern`);
        // das Geänderte muss für sich eine gültige Fähigkeit ergeben
        pruefeFaehigkeit(daten, sprache, `${name}.ausbau[${nummer}]`, { ...faehigkeit, ...eintrag.aendert, ausbau: undefined }, fehler);
      }
    });
  }
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

// Eigenschaften, Skills und Lernregeln, siehe systeme/skills.js und systeme/lernen.js

const istStufe = (wert) => istGanzzahl(wert) && wert >= 1 && wert <= HOECHSTE_STUFE;

function pruefeStufe(stufe, ort, fehler) {
  if (!istStufe(stufe)) fehler.push(`${ort}: stufe muss eine ganze Zahl von 1 bis ${HOECHSTE_STUFE} sein`);
}

// Anforderung { eigenschaft: wert } an Gegenständen und Fähigkeiten
function pruefeAnforderung(daten, anforderung, ort, fehler) {
  if (!istObjekt(anforderung)) return fehler.push(`${ort}: muss ein Objekt { eigenschaft: wert } sein`);
  for (const [eigenschaft, wert] of Object.entries(anforderung)) {
    if (!daten.eigenschaften?.[eigenschaft]) fehler.push(`${ort}: Eigenschaft "${eigenschaft}" gibt es nicht`);
    if (!istZahlAbNull(wert)) fehler.push(`${ort}.${eigenschaft} muss eine ganze Zahl >= 0 sein`);
  }
}

// Abzug je fehlendem Punkt: Modifikatoren plus oder prozent, nie auf eine Eigenschaft
function pruefeAnforderungsabzug(daten, liste, ort, fehler) {
  pruefeModifikatoren(daten, liste, ort, fehler);
  if (!Array.isArray(liste)) return;
  liste.forEach((modifikator, nummer) => {
    if (!["plus", "prozent"].includes(modifikator?.art)) fehler.push(`${ort}[${nummer}]: art muss plus oder prozent sein`);
    if (typeof modifikator?.ziel === "string" && modifikator.ziel.startsWith("eigenschaft.")) fehler.push(`${ort}[${nummer}]: ein Abzug der Anforderung darf keine Eigenschaft treffen`);
  });
}

function pruefeEigenschaften(daten, sprache, fehler) {
  if (!istObjekt(daten.eigenschaften) || Object.keys(daten.eigenschaften).length === 0) return fehler.push("eigenschaften fehlen (daten/eigenschaften.js)");
  for (const [name, eigenschaft] of Object.entries(daten.eigenschaften)) pruefeText(sprache.texte, eigenschaft?.text, `eigenschaften.${name}`, fehler);
}

function pruefeLernregeln(daten, lernen, fehler) {
  if (!istObjekt(lernen)) return fehler.push("regeln.lernen fehlt");
  const ort = "regeln.lernen";
  pruefeParameter(daten, { eigenschaftStart: "ganzzahl", eigenschaftPunkte: "ganzzahl", eigenschaftHoechstens: "ganzzahl", startEp: "ganzzahl", epJeFeld: "ganzzahl", topfFaktor: "ganzzahl" }, lernen, ort, fehler);
  pruefeParameter(daten, { verrechnung: ["multiplizieren", "addieren"], gewichtung: ["erste"], ort: ["jederzeit"] }, lernen, ort, fehler);
  for (const feld of ["verrechnung", "gewichtung", "ort"]) if (lernen[feld] === undefined) fehler.push(`${ort}: ${feld} fehlt`);
  if (!(istGanzzahl(lernen.bezugswert) && lernen.bezugswert > 0)) fehler.push(`${ort}.bezugswert muss eine ganze Zahl > 0 sein`);
  if (!(Array.isArray(lernen.stufen) && lernen.stufen.length === HOECHSTE_STUFE && lernen.stufen.every((kosten) => istGanzzahl(kosten) && kosten > 0))) {
    fehler.push(`${ort}.stufen muss ${HOECHSTE_STUFE} ganze Zahlen > 0 enthalten`);
  }
  if (!(Array.isArray(lernen.raengeNachTier) && lernen.raengeNachTier.length === ANZAHL_TIERS && lernen.raengeNachTier.every((rang) => istGanzzahl(rang) && rang > 0))) {
    fehler.push(`${ort}.raengeNachTier muss ${ANZAHL_TIERS} ganze Zahlen > 0 enthalten`);
  }
  const tierVoraussetzungen = lernen.tierVoraussetzungen;
  if (!(Array.isArray(tierVoraussetzungen) && tierVoraussetzungen.length === ANZAHL_TIERS && tierVoraussetzungen.every((liste, tier) => Array.isArray(liste) && liste.length <= tier && liste.every(istStufe)))) {
    fehler.push(`${ort}.tierVoraussetzungen muss je Tier eine Liste von Stufen der Tiers darunter sein`);
  }
  if (lernen.eigenschaftHoechstens < lernen.eigenschaftStart) fehler.push(`${ort}: eigenschaftHoechstens liegt unter eigenschaftStart`);
  pruefeAnforderungsabzug(daten, lernen.anforderungAbzug ?? "fehlt", `${ort}.anforderungAbzug`, fehler);
}

// Skills: { text, set, tier, rang?, primaer, sekundaer, voraussetzungen?, freischaltung?, jeStufe?, abStufe?, lernt?, verwandt? }
function pruefeSkill(daten, sprache, name, skill, fehler) {
  const ort = `skills.${name}`;
  if (!istObjekt(skill)) return fehler.push(`${ort}: muss ein Objekt sein`);
  pruefeText(sprache.texte, skill.text, ort, fehler);
  if (typeof skill.set !== "string") fehler.push(`${ort}: set fehlt`);
  if (!(istGanzzahl(skill.tier) && skill.tier >= 1 && skill.tier <= ANZAHL_TIERS)) fehler.push(`${ort}: tier muss eine ganze Zahl von 1 bis ${ANZAHL_TIERS} sein`);
  if (skill.rang !== undefined && !(istGanzzahl(skill.rang) && skill.rang > 0)) fehler.push(`${ort}: rang muss eine ganze Zahl > 0 sein`);
  pruefeParameter(daten, { primaer: "eigenschaft", sekundaer: "eigenschaft", freischaltung: "wahrheitswert?" }, skill, ort, fehler);
  if (skill.voraussetzungen !== undefined) {
    if (!Array.isArray(skill.voraussetzungen)) fehler.push(`${ort}: voraussetzungen muss eine Liste [{ skill, stufe }] sein`);
    else skill.voraussetzungen.forEach((voraussetzung, nummer) => {
      const stelle = `${ort}.voraussetzungen[${nummer}]`;
      pruefeParameter(daten, { skill: "skill" }, voraussetzung ?? {}, stelle, fehler);
      pruefeStufe(voraussetzung?.stufe, stelle, fehler);
    });
  }
  if (skill.jeStufe !== undefined) {
    pruefeModifikatoren(daten, skill.jeStufe, `${ort}.jeStufe`, fehler);
    if (Array.isArray(skill.jeStufe)) skill.jeStufe.forEach((modifikator, nummer) => {
      if (!["plus", "prozent"].includes(modifikator?.art)) fehler.push(`${ort}.jeStufe[${nummer}]: art muss plus oder prozent sein`);
    });
  }
  if (skill.abStufe !== undefined) {
    if (!istObjekt(skill.abStufe)) fehler.push(`${ort}: abStufe muss ein Objekt { stufe: { modifikatoren?, ausloeser? } } sein`);
    else for (const [stufe, eintrag] of Object.entries(skill.abStufe)) {
      const stelle = `${ort}.abStufe.${stufe}`;
      if (!istStufe(Number(stufe))) fehler.push(`${stelle}: die Stufe muss eine ganze Zahl von 1 bis ${HOECHSTE_STUFE} sein`);
      if (!istObjekt(eintrag)) {
        fehler.push(`${stelle}: muss { modifikatoren?, ausloeser? } sein`);
        continue;
      }
      if (eintrag.modifikatoren !== undefined) pruefeModifikatoren(daten, eintrag.modifikatoren, `${stelle}.modifikatoren`, fehler);
      if (eintrag.ausloeser !== undefined) pruefeAusloeser(daten, eintrag.ausloeser, stelle, fehler);
    }
  }
  if (skill.lernt !== undefined) {
    if (!Array.isArray(skill.lernt)) fehler.push(`${ort}: lernt muss eine Liste [{ anlass, tags? }] sein`);
    else skill.lernt.forEach((eintrag, nummer) => {
      const stelle = `${ort}.lernt[${nummer}]`;
      if (!hat("lernanlaesse", eintrag?.anlass)) fehler.push(`${stelle}: Lernanlass "${eintrag?.anlass}" ist nicht angemeldet`);
      if (eintrag?.tags !== undefined && !istTextliste(eintrag.tags)) fehler.push(`${stelle}: tags muss eine Liste von Texten sein`);
    });
  }
  if (skill.verwandt !== undefined) {
    if (!Array.isArray(skill.verwandt)) fehler.push(`${ort}: verwandt muss eine Liste [{ skill, anteil }] sein`);
    else skill.verwandt.forEach((eintrag, nummer) => {
      const stelle = `${ort}.verwandt[${nummer}]`;
      pruefeParameter(daten, { skill: "skill" }, eintrag ?? {}, stelle, fehler);
      if (eintrag?.skill === name) fehler.push(`${stelle}: ein Skill ist nicht mit sich selbst verwandt`);
      if (!istProzent(eintrag?.anteil)) fehler.push(`${stelle}: anteil muss eine ganze Zahl von 0 bis 100 sein`);
    });
  }
}

// Je Set jeder Tier höchstens einmal; Voraussetzungen (eigene und die der Tiers) ohne Kreis
function pruefeSkills(daten, sprache, fehler) {
  const skills = daten.skills || {};
  for (const [name, skill] of Object.entries(skills)) pruefeSkill(daten, sprache, name, skill, fehler);
  const tiersJeSet = {};
  for (const [name, skill] of Object.entries(skills)) {
    const belegt = (tiersJeSet[skill.set] ??= {});
    if (belegt[skill.tier]) fehler.push(`skills.${name}: Set "${skill.set}" hat Tier ${skill.tier} schon (${belegt[skill.tier]})`);
    else belegt[skill.tier] = name;
  }
  const verlangt = (name) => {
    const skill = skills[name];
    const ausTiers = Object.entries(tiersJeSet[skill.set] || {}).filter(([tier]) => Number(tier) < skill.tier).map(([, anderer]) => anderer);
    return [...ausTiers, ...(Array.isArray(skill.voraussetzungen) ? skill.voraussetzungen.map((eintrag) => eintrag?.skill) : [])].filter((anderer) => skills[anderer]);
  };
  const fertig = new Set();
  const besuchen = (name, kette) => {
    if (fertig.has(name)) return;
    for (const anderer of verlangt(name)) {
      const position = kette.indexOf(anderer);
      if (position >= 0) fehler.push(`skills.${anderer}: Voraussetzungen bilden einen Kreis (${[...kette.slice(position), anderer].join(" > ")})`);
      else besuchen(anderer, [...kette, anderer]);
    }
    fertig.add(name);
  };
  for (const name of Object.keys(skills)) besuchen(name, [name]);
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

// KI-Komponente: { modul, trifft?, wachzustand?, handlungen?, wahl? }, siehe ki/jagen.js und ki/handlungen.js
// bekannte: die Fähigkeiten des Wesens (bei einer KI aus einem Zustand null, dann zählt nur, dass es sie gibt)
function pruefeKi(daten, ki, ort, fehler, bekannte = null) {
  if (!istObjekt(ki) || !hat("ki", ki.modul)) return fehler.push(`${ort}: Verhaltensmodul "${ki?.modul}" ist nicht angemeldet`);
  pruefeParameter(daten, { trifft: TRIFFT_ARTEN, wachzustand: WACHZUSTAENDE }, ki, ort, fehler);
  // das Format vor 0.39.0
  if (ki.faehigkeiten !== undefined) fehler.push(`${ort}: faehigkeiten an der KI gibt es nicht mehr, Fähigkeiten stehen als { handlung: "faehigkeit", name } in handlungen`);
  if (ki.abstandHalten !== undefined) fehler.push(`${ort}: abstandHalten gibt es nicht mehr, dafür { handlung: "abstand_halten", abstand } in handlungen`);
  if (ki.wahl !== undefined && !WAHLREGELN.includes(ki.wahl)) {
    const unterBesten = istObjekt(ki.wahl) && Object.keys(ki.wahl).length === 1 ? ki.wahl.gewichtetUnterBesten : undefined;
    if (!istGanzzahl(unterBesten) || unterBesten < 1) fehler.push(`${ort}: wahl muss "erste", "beste", "gewichtet" oder { gewichtetUnterBesten: n } mit n >= 1 sein`);
  }
  if (ki.handlungen === undefined) return;
  if (!Array.isArray(ki.handlungen)) return fehler.push(`${ort}: handlungen muss eine Liste sein`);
  ki.handlungen.forEach((eintrag, nummer) => {
    const stelle = `${ort}.handlungen[${nummer}]`;
    if (!istObjekt(eintrag)) return fehler.push(`${stelle}: Eintrag muss ein Objekt { handlung, ... } sein`);
    if (!hat("kihandlungen", eintrag.handlung)) return fehler.push(`${stelle}: Handlung "${eintrag.handlung}" ist nicht angemeldet`);
    pruefeParameter(daten, { abstandAb: "ganzzahl?", abstandBis: "ganzzahl?", gewicht: "ganzzahl?", ...holen("kihandlungen", eintrag.handlung).parameter }, eintrag, stelle, fehler);
    if (eintrag.chance !== undefined && !istProzent(eintrag.chance)) fehler.push(`${stelle}: chance muss eine ganze Zahl von 0 bis 100 sein`);
    if (eintrag.handlung === "abstand_halten" && istGanzzahl(eintrag.abstand) && eintrag.abstand < 1) fehler.push(`${stelle}: abstand muss eine ganze Zahl > 0 sein`);
    if (eintrag.handlung === "faehigkeit" && typeof eintrag.name === "string") {
      if (!daten.faehigkeiten?.[eintrag.name]) fehler.push(`${stelle}: Fähigkeit "${eintrag.name}" gibt es nicht`);
      else if (bekannte && !bekannte.includes(eintrag.name)) fehler.push(`${stelle}: das Wesen kennt die Fähigkeit "${eintrag.name}" nicht (faehigkeiten)`);
    }
    if (eintrag.wenn !== undefined) {
      if (!Array.isArray(eintrag.wenn)) fehler.push(`${stelle}: wenn muss eine Liste sein`);
      else pruefeBedingungen(daten, eintrag.wenn, `${stelle}.wenn`, fehler);
    }
    if (eintrag.bewertung === undefined) return;
    if (!Array.isArray(eintrag.bewertung)) return fehler.push(`${stelle}: bewertung muss eine Liste { eingabe, kurve } sein`);
    eintrag.bewertung.forEach((bewertung, bewertungsnummer) => {
      const bewertungsort = `${stelle}.bewertung[${bewertungsnummer}]`;
      if (!istObjekt(bewertung)) return fehler.push(`${bewertungsort}: Eintrag muss ein Objekt { eingabe, kurve } sein`);
      if (!hat("kieingaben", bewertung.eingabe)) fehler.push(`${bewertungsort}: Eingabe "${bewertung.eingabe}" ist nicht angemeldet`);
      const kurvenmeldungen = kurvenfehler(bewertung.kurve, `${bewertungsort}.kurve`);
      fehler.push(...kurvenmeldungen);
      if (!kurvenmeldungen.length && bewertung.kurve.some(([, wert]) => wert < 0 || wert > 1000)) fehler.push(`${bewertungsort}.kurve: Werte in Promille von 0 bis 1000`);
    });
  });
}

// Ruf in regeln.fraktionen (siehe systeme/fraktionen.js): jeder Grundwert liegt in der Zone seiner Beziehung, damit
// Ruf 0 die Tabelle ergibt
function pruefeRufregeln(daten, regeln, fehler) {
  if (!daten.fraktionen?.[regeln.rufTraeger]) fehler.push(`regeln.fraktionen.rufTraeger: Fraktion "${regeln.rufTraeger}" gibt es nicht`);
  const grundwert = regeln.rufGrundwert ?? {}, schwellen = regeln.rufSchwellen ?? {};
  const alleZahlen = BEZIEHUNGEN.every((name) => istGanzzahl(grundwert[name])) && istGanzzahl(schwellen.feind) && istGanzzahl(schwellen.verbuendet);
  if (!alleZahlen) fehler.push("regeln.fraktionen.rufGrundwert braucht ganze Zahlen für feind, neutral, verbuendet, rufSchwellen für feind und verbuendet");
  else if (!(grundwert.feind <= schwellen.feind && schwellen.feind < grundwert.neutral && grundwert.neutral < schwellen.verbuendet && schwellen.verbuendet <= grundwert.verbuendet)) {
    fehler.push("regeln.fraktionen: jeder rufGrundwert muss in der Zone seiner Beziehung liegen (feind <= Schwelle feind < neutral < Schwelle verbuendet <= verbuendet)");
  }
  for (const feld of ["rufToetungFeind", "rufToetungEigene"]) if (!istGanzzahl(regeln[feld])) fehler.push(`regeln.fraktionen.${feld} muss eine ganze Zahl sein`);
  if (typeof regeln.rufNurMitZeugen !== "boolean") fehler.push("regeln.fraktionen.rufNurMitZeugen muss true oder false sein");
}

// Fraktionen: { text, beziehungen?, rufFest? }, siehe systeme/fraktionen.js
function pruefeFraktionen(daten, sprache, fehler) {
  for (const [name, fraktion] of Object.entries(daten.fraktionen || {})) {
    const ort = `fraktionen.${name}`;
    pruefeText(sprache.texte, fraktion.text, ort, fehler);
    for (const [andere, wert] of Object.entries(fraktion.beziehungen || {})) {
      if (!daten.fraktionen[andere]) fehler.push(`${ort}.beziehungen: Fraktion "${andere}" gibt es nicht`);
      if (!BEZIEHUNGEN.includes(wert)) fehler.push(`${ort}.beziehungen.${andere} muss eines von ${BEZIEHUNGEN.join(", ")} sein`);
    }
    if (fraktion.rufFest !== undefined && typeof fraktion.rufFest !== "boolean") fehler.push(`${ort}.rufFest muss true oder false sein`);
  }
}

// Zustände, siehe systeme/zustaende.js
function pruefeZustand(daten, sprache, name, zustand, fehler) {
  const ort = `zustaende.${name}`;
  if (zustand.abstrakt) return;
  pruefeText(sprache.texte, zustand.text, ort, fehler);
  if (zustand.dauer !== undefined && !(istGanzzahl(zustand.dauer) && zustand.dauer > 0)) fehler.push(`${ort}: dauer muss eine ganze Zahl > 0 sein`);
  if (zustand.hoechstStapel !== undefined && !(istGanzzahl(zustand.hoechstStapel) && zustand.hoechstStapel > 0)) fehler.push(`${ort}: hoechstStapel muss eine ganze Zahl > 0 sein`);
  const felder = { stapel: STAPELREGELN, jeTick: "effekt?", beimBeginn: "effekt?", beimEnde: "effekt?", gebundenAnQuelle: "wahrheitswert?", handlungsunfaehig: "wahrheitswert?", fraktion: "text?", bewegung: BEWEGUNGSARTEN };
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

// Feste Karte: gleich lange Zeilen aus Kennungen bekannter Gelände
function pruefeKarte(daten, karte, ort, fehler) {
  if (!Array.isArray(karte) || !karte.length || !karte.every((zeile) => typeof zeile === "string" && zeile.length === karte[0].length)) {
    return fehler.push(`${ort}: karte muss eine Liste gleich langer Zeilen sein`);
  }
  const kennungen = new Set(Object.values(daten.gelaende).map((gelaende) => gelaende.kennung));
  const fremde = [...new Set(karte.join(""))].filter((zeichen) => !kennungen.has(zeichen));
  if (fremde.length) fehler.push(`${ort}: karte enthält unbekannte Kennungen ${fremde.join(" ")}`);
}

// Folge der Ebenenschritte (welt/ebene.js): jeder angemeldet, was er braucht, liefert ein früherer, verwerfende
// Schritte vor dem, der die Ebene anlegt, und am Ende muss eine Ebene stehen
function pruefeSchrittfolge(schritte, ort, fehler) {
  if (!istTextliste(schritte) || !schritte.length) return fehler.push(`${ort} muss eine Liste von Ebenenschritten sein`);
  const geliefert = new Set();
  for (const schrittName of schritte) {
    if (!hat("ebenenschritte", schrittName)) {
      fehler.push(`${ort}: Ebenenschritt "${schrittName}" ist nicht angemeldet`);
      continue;
    }
    const schritt = holen("ebenenschritte", schrittName);
    for (const teil of schritt.braucht) if (!geliefert.has(teil)) fehler.push(`${ort}: "${schrittName}" braucht ${teil}, das kein früherer Schritt liefert`);
    if (schritt.verwirft && geliefert.has("ebene")) fehler.push(`${ort}: "${schrittName}" kann den Versuch verwerfen und muss vor dem Anlegen der Ebene stehen`);
    for (const teil of schritt.liefert) geliefert.add(teil);
  }
  if (!geliefert.has("ebene")) fehler.push(`${ort}: kein Schritt legt die Ebene an`);
}

function pruefeEbene(daten, name, ebene, fehler) {
  const ort = `ebenen.${name}`;
  const vorgabe = ebene.karte !== undefined ? "schritteFest" : "schritteErzeugt";
  if (ebene.schritte !== undefined) pruefeSchrittfolge(ebene.schritte, `${ort}.schritte`, fehler);
  else if (daten.regeln?.ebenen) pruefeSchrittfolge(daten.regeln.ebenen[vorgabe], `regeln.ebenen.${vorgabe} (für ${ort})`, fehler);
  if (ebene.karte !== undefined) pruefeKarte(daten, ebene.karte, `${ort}`, fehler);
  else for (const masz of ["breite", "hoehe"]) {
    if (!istGanzzahl(ebene[masz]) || ebene[masz] < 10) fehler.push(`${ort}: ${masz} muss eine ganze Zahl >= 10 sein`);
  }
  if (ebene.population !== undefined) {
    const population = ebene.population;
    if (!daten.populationen?.[population?.tabelle]) fehler.push(`${ort}.population: Tabelle "${population?.tabelle}" gibt es nicht`);
    const anzahl = population?.anzahl;
    if (!(Array.isArray(anzahl) && anzahl.length === 2 && anzahl.every(istZahlAbNull) && anzahl[0] <= anzahl[1])) fehler.push(`${ort}.population: anzahl muss [min, max] sein`);
  }
  for (const gegner of ebene.gegner || []) {
    if (!daten.wesen[gegner.typ] || daten.wesen[gegner.typ].abstrakt) fehler.push(`${ort}: Gegner "${gegner.typ}" gibt es nicht`);
  }
  // ausdrücklich statt stillschweigend: mit Ninkasi mehr Wesen, als die Obergrenze der Population zulässt
  const hoechstePopulation = istGanzzahl(ebene.population?.anzahl?.[1]) ? ebene.population.anzahl[1] : 0;
  const bestellt = 1 + hoechstePopulation + (ebene.gegner || []).reduce((summe, gegner) => summe + (istGanzzahl(gegner.anzahl) ? gegner.anzahl : 0), 0);
  const hoechstWesen = daten.regeln?.population?.hoechstWesen;
  if (istGanzzahl(hoechstWesen) && bestellt > hoechstWesen) fehler.push(`${ort}: ${bestellt} Wesen mit Ninkasi, mehr als regeln.population.hoechstWesen (${hoechstWesen})`);
  for (const falle of ebene.fallen || []) {
    if (!daten.fallen?.[falle.typ]) fehler.push(`${ort}: Falle "${falle.typ}" gibt es nicht`);
  }
  for (const objekt of ebene.gelaendeObjekte || []) pruefeParameter(daten, { gelaende: "gelaende", anzahl: "ganzzahl" }, objekt, `${ort}.gelaendeObjekte`, fehler);
  if (ebene.tuerChance !== undefined && !istProzent(ebene.tuerChance)) fehler.push(`${ort}: tuerChance muss eine ganze Zahl von 0 bis 100 sein`);
  for (const gegenstand of ebene.gegenstaende || []) {
    if (!daten.gegenstaende[gegenstand.typ]) fehler.push(`${ort}: Gegenstand "${gegenstand.typ}" gibt es nicht`);
  }
  if (ebene.karte === undefined) for (const rolle of ["wand", "boden"]) {
    if (!daten.gelaende[ebene.gelaende?.[rolle]]) fehler.push(`${ort}: gelaende.${rolle} verweist auf unbekanntes Gelände`);
  }
  for (const rolle of ["tuer", "treppeAuf", "treppeAb"]) {
    if (ebene.gelaende?.[rolle] !== undefined && !daten.gelaende[ebene.gelaende[rolle]]) fehler.push(`${ort}: gelaende.${rolle} verweist auf unbekanntes Gelände`);
  }
}

// Abfolge der Tiefen und Populationstabellen, siehe welt/ebene.js
function pruefeAbfolge(daten, fehler) {
  if (!istTextliste(daten.abfolge) || !daten.abfolge.length) return fehler.push("abfolge muss eine Liste von Ebenen sein");
  daten.abfolge.forEach((name, tiefe) => { if (!daten.ebenen[name]) fehler.push(`abfolge[${tiefe}]: Ebene "${name}" gibt es nicht`); });
  if (!istGanzzahl(daten.starttiefe) || daten.starttiefe < 0 || daten.starttiefe >= daten.abfolge.length) fehler.push("starttiefe muss eine Tiefe der abfolge sein");
  for (const [tabellenName, tabelle] of Object.entries(daten.populationen || {})) {
    if (!Array.isArray(tabelle)) {
      fehler.push(`populationen.${tabellenName} muss eine Liste sein`);
      continue;
    }
    tabelle.forEach((eintrag, nummer) => {
      const stelle = `populationen.${tabellenName}[${nummer}]`;
      if (!daten.wesen[eintrag.typ] || daten.wesen[eintrag.typ].abstrakt) fehler.push(`${stelle}: Wesen "${eintrag.typ}" gibt es nicht`);
      if (!(istGanzzahl(eintrag.gewicht) && eintrag.gewicht > 0)) fehler.push(`${stelle}: gewicht muss eine ganze Zahl > 0 sein`);
      const istBereich = (wert) => Array.isArray(wert) && wert.length === 2 && wert.every(istZahlAbNull) && wert[0] <= wert[1];
      if (!istBereich(eintrag.tiefe)) fehler.push(`${stelle}: tiefe muss [von, bis] sein`);
      if (eintrag.rudel !== undefined && !(istBereich(eintrag.rudel) && eintrag.rudel[0] >= 1)) fehler.push(`${stelle}: rudel muss [min, max] mit min >= 1 sein`);
      for (const affix of eintrag.affixe || []) {
        pruefeParameter(daten, { zustand: "zustand" }, affix, `${stelle}.affixe`, fehler);
        if (!istProzent(affix.chance)) fehler.push(`${stelle}.affixe: chance muss eine ganze Zahl von 0 bis 100 sein`);
      }
    });
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
  pruefeSchichten(daten, sprache, fehler);
  pruefeFraktionen(daten, sprache, fehler);
  for (const [name, effekt] of Object.entries(daten.effekte)) pruefeEffekt(daten, name, effekt, fehler);
  pruefeEffektKreise(daten, fehler);
  for (const [name, zustand] of Object.entries(daten.zustaende)) pruefeZustand(daten, sprache, name, zustand, fehler);
  pruefeRisiken(daten, fehler);
  pruefeEigenschaften(daten, sprache, fehler);
  pruefeSkills(daten, sprache, fehler);
  for (const [name, faehigkeit] of Object.entries(daten.faehigkeiten || {})) pruefeFaehigkeit(daten, sprache, name, faehigkeit, fehler);
  for (const [name, wesen] of Object.entries(daten.wesen)) pruefeWesen(daten, sprache, name, wesen, fehler);
  for (const [name, gegenstand] of Object.entries(daten.gegenstaende)) pruefeGegenstand(daten, sprache, name, gegenstand, fehler);
  pruefeEtiketten(daten, sprache, fehler);
  for (const [name, falle] of Object.entries(daten.fallen || {})) pruefeFalle(daten, sprache, name, falle, fehler);
  for (const [name, ebene] of Object.entries(daten.ebenen)) pruefeEbene(daten, name, ebene, fehler);
  pruefeAbfolge(daten, fehler);
  for (const [name, gelaende] of Object.entries(daten.gelaende)) {
    pruefeText(sprache.texte, gelaende.text, `gelaende.${name}`, fehler);
    if (typeof gelaende.kennung !== "string" || gelaende.kennung.length !== 1) fehler.push(`gelaende.${name}: kennung muss genau ein Zeichen sein`);
    if (gelaende.laermdaempfung !== undefined && !istZahlAbNull(gelaende.laermdaempfung)) fehler.push(`gelaende.${name}: laermdaempfung muss eine ganze Zahl >= 0 sein`);
    // Bewegungsarten, siehe welt/karte.js
    pruefeParameter(daten, { treppe: ["ab", "auf"] }, gelaende, `gelaende.${name}`, fehler);
    pruefeParameter(daten, { passierbar: "wahrheitswert?", undurchdringlich: "wahrheitswert?", beimFestsitzen: "effekt?", beimBenutzen: "effekt?", geschossdurchlaessig: "wahrheitswert?" }, gelaende, `gelaende.${name}`, fehler);
    // Türen und Zerstören, siehe systeme/gelaende.js
    if (gelaende.tuer !== undefined) {
      if (!istObjekt(gelaende.tuer) || Object.keys(gelaende.tuer).length !== 1 || !["offen", "zu"].includes(Object.keys(gelaende.tuer)[0])) fehler.push(`gelaende.${name}: tuer muss { offen } oder { zu } sein`);
      else pruefeParameter(daten, { offen: "gelaende?", zu: "gelaende?" }, gelaende.tuer, `gelaende.${name}.tuer`, fehler);
    }
    // Feldschichten, siehe systeme/schichten.js
    pruefeParameter(daten, { gasdurchlaessig: "wahrheitswert?", brenndauer: "ganzzahl?", verbrenntZu: "gelaende?" }, gelaende, `gelaende.${name}`, fehler);
    if (gelaende.brennbar !== undefined && !istProzent(gelaende.brennbar)) fehler.push(`gelaende.${name}: brennbar muss eine ganze Zahl von 0 bis 100 sein`);
    if (gelaende.quelle !== undefined) pruefeParameter(daten, { gas: "gas", menge: "ganzzahl" }, istObjekt(gelaende.quelle) ? gelaende.quelle : {}, `gelaende.${name}.quelle`, fehler);
    if (gelaende.zerstoerbar !== undefined) pruefeParameter(daten, { wird: "gelaende" }, istObjekt(gelaende.zerstoerbar) ? gelaende.zerstoerbar : {}, `gelaende.${name}.zerstoerbar`, fehler);
    const passierbarFuer = gelaende.passierbarFuer;
    if (passierbarFuer !== undefined && !(istTextliste(passierbarFuer) && passierbarFuer.every((art) => BEWEGUNGSARTEN.includes(art)))) {
      fehler.push(`gelaende.${name}: passierbarFuer muss eine Liste aus ${BEWEGUNGSARTEN.join(", ")} sein`);
    }
    if (!daten.zeichen.gelaende[name]) fehler.push(`gelaende.${name}: kein Zeichen in daten/zeichen.js`);
  }
  for (const [aktion, kosten] of Object.entries(daten.aktionen)) {
    if (!istGanzzahl(kosten) || kosten <= 0) fehler.push(`aktionen.${aktion}: Kosten müssen eine ganze Zahl > 0 sein`);
  }
  pruefeRegeln(daten, daten.regeln, fehler);
  if (!daten.wesen.ninkasi) fehler.push("wesen.ninkasi fehlt");
  return { daten, fehler };
}

export class Datenfehler extends Error {
  constructor(fehler) {
    super(`Fehler in den Daten:\n${fehler.map((meldung) => "  " + meldung).join("\n")}`);
    this.fehler = fehler;
  }
}
