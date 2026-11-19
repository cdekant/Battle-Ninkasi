// Kampf (siehe docs/Architektur.md, Kampfwerte): Trefferwurf, Blocken, Krit, Nahkampf und die Schadensrechnung
// über Rüstung, Widerstand und Immunität.
//
// Angriff in den Daten: angriff: { genauigkeit: 80, effekt: "faustschlag", tags?, kritchance?, muster?, trifft? }
//   muster (siehe systeme/zielauswahl.js) vom Angreifer in Richtung des Ziels, z.B. Rundumschlag
//   { art: "angrenzend" } oder Speer { art: "linie", laenge: 2 }; jedes getroffene Wesen bekommt einen
//   eigenen Trefferwurf, in der Reihenfolge der Felder; trifft Vorgabe "wesen", der Angreifer nie selbst
// Kampfwerte am Wesen: kampfwerte: { ausweichen?, willenskraft?, blocken?, ruestung?, kritchance? } als Punkte (Vorgabe 0),
//   abgefragt über Modifikatoren mit gleichnamigem Ziel; widerstaende: { saeure: 100, feuer: -50 }; immun: ["psi"]
// Punkte werden über einen Halbwert zu Anteilen, die sich 100 % nur annähern: punkte / (punkte + halbwert).
//   Trefferchance: genauigkeit / (genauigkeit + verteidigung + grundverteidigung)
//   Widerstand R:  menge × H / (H + R), negativ menge × (H − 2R) / (H − R), nähert sich also dem Doppelten
// Marker als Tags an Angriff oder Effekt: verfehlt_nie, unblockbar, ignoriert_ruestung
// Regelwerte in daten/regeln.js (kampf).

import { mitAnteil } from "../kern/zufall.js";
import { modifiziert } from "../kern/werte.js";
import { effektAnwenden, beteiligteAus } from "../kern/effekte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { anmelden } from "../kern/register.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { fraktionVon } from "../kern/zustand.js";
import { musterFelder, entitaetenAufFeldern } from "./zielauswahl.js";

export const KAMPFWERTE = ["ausweichen", "willenskraft", "blocken", "ruestung", "kritchance"];
export const VERTEIDIGUNGEN = ["ausweichen", "willenskraft"];
export const MARKER = ["verfehlt_nie", "unblockbar", "ignoriert_ruestung"];

// Ränge der Schadensrechnung am Haken vor_schaden; Handler ohne Rang (100) liegen zwischen Angreifer und Rüstung
export const RANG_ANGREIFER = 50, RANG_RUESTUNG = 200, RANG_WIDERSTAND = 300;

export function istWesen(entitaet) {
  return Boolean(entitaet && entitaet.fraktion !== undefined && entitaet.werte && entitaet.werte.lp);
}

export function feindlich(erstesWesen, zweitesWesen) {
  return istWesen(erstesWesen) && istWesen(zweitesWesen) && fraktionVon(erstesWesen) !== fraktionVon(zweitesWesen);
}

const kampfregeln = (spiel) => spiel.daten.regeln.kampf;

// Kampfwert eines Wesens aus Daten und Modifikatoren, nie unter 0; zusatz kommt zur Basis (z.B. kritchance am Angriff)
export function kampfwert(spiel, wesen, name, umstaende = {}, zusatz = 0) {
  return Math.max(0, modifiziert(spiel, wesen, name, (wesen.kampfwerte?.[name] ?? 0) + zusatz, umstaende));
}

// Anteil in Prozent, gerundet; nur für Anzeige und Vorschau, gewürfelt wird exakt (mitAnteil)
export function anteilInProzent(zaehler, nenner) {
  return nenner > 0 ? Math.round((Math.max(0, zaehler) * 100) / nenner) : 0;
}

// Trefferchance als Bruch { zaehler, nenner }; verfehlt_nie ergibt 1/1
// wurf: { quelle?, ziel, genauigkeit, gegen?, tags? }; ohne Quelle (Falle) gilt die Genauigkeit ohne Modifikatoren
export function trefferanteil(spiel, { quelle, ziel, genauigkeit, gegen = "ausweichen", tags = [] }) {
  if (tags.includes("verfehlt_nie")) return { zaehler: 1, nenner: 1 };
  const wirksameGenauigkeit = Math.max(0, quelle ? modifiziert(spiel, quelle, "genauigkeit", genauigkeit, { gegenueberId: ziel.id, tags }) : genauigkeit);
  const verteidigung = kampfwert(spiel, ziel, gegen, { gegenueberId: quelle?.id, tags }) + kampfregeln(spiel).grundverteidigung;
  return { zaehler: wirksameGenauigkeit, nenner: wirksameGenauigkeit + verteidigung };
}

// Trefferwurf, Blocken und Krit nacheinander; gibt { ergebnis: "treffer" | "ausgewichen" | "geblockt", kritisch } zurück
// wurf wie bei trefferanteil, dazu kritchance? (Punkte zusätzlich zu denen der Quelle)
export function trefferwurf(spiel, wurf) {
  const zufallszustand = spiel.zustand.zufallszustand;
  const { quelle, ziel, tags = [] } = wurf;
  const regeln = kampfregeln(spiel);
  const { zaehler, nenner } = trefferanteil(spiel, wurf);
  if (!mitAnteil(zufallszustand, zaehler, nenner)) return { ergebnis: "ausgewichen", kritisch: false };
  if (!tags.includes("unblockbar")) {
    const blocken = kampfwert(spiel, ziel, "blocken", { gegenueberId: quelle?.id, tags });
    if (mitAnteil(zufallszustand, blocken, blocken + regeln.halbwertBlocken)) return { ergebnis: "geblockt", kritisch: false };
  }
  const kritchance = quelle ? kampfwert(spiel, quelle, "kritchance", { gegenueberId: ziel.id, tags }, wurf.kritchance ?? 0) : 0;
  return { ergebnis: "treffer", kritisch: mitAnteil(zufallszustand, kritchance, kritchance + regeln.halbwertKritchance) };
}

const tagsDesEffekts = (spiel, effektName) => spiel.daten.effekte?.[effektName]?.tags || [];

function angriffsziele(spiel, angreifer, ziel) {
  const angriff = angreifer.angriff;
  if (!angriff.muster) return [ziel];
  const auswahl = { ursprung: { ...angreifer.position }, zielpunkt: { ...ziel.position }, quelleId: angreifer.id };
  const felder = musterFelder(spiel, angriff.muster, auswahl);
  return entitaetenAufFeldern(spiel, felder, { trifft: angriff.trifft ?? "wesen", urheberId: angreifer.id, urheberFraktion: fraktionVon(angreifer), ohneUrheber: true });
}

export function nahkampf(spiel, angreifer, ziel) {
  if (!angreifer.angriff) return;
  for (const getroffenes of angriffsziele(spiel, angreifer, ziel)) {
    if (spiel.zustand.entitaeten[getroffenes.id]) einzelangriff(spiel, angreifer, getroffenes);
  }
}

function einzelangriff(spiel, angreifer, ziel) {
  const angriff = angreifer.angriff;
  const tags = [...(angriff.tags || [])];
  for (const tag of tagsDesEffekts(spiel, angriff.effekt)) if (!tags.includes(tag)) tags.push(tag);
  const { ergebnis, kritisch } = trefferwurf(spiel, { quelle: angreifer, ziel, genauigkeit: angriff.genauigkeit, tags, kritchance: angriff.kritchance });
  const mittel = { art: "angriff", name: angriff.effekt };
  const beteiligte = { quelleId: angreifer.id, urheberId: angreifer.beschworenVon ?? angreifer.id, zielId: ziel.id, ursache: "nahkampf", kettentiefe: 0, mittel, tags, kritisch };
  if (ergebnis === "treffer") {
    effektAnwenden(spiel, angriff.effekt, beteiligte);
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligte });
  } else {
    melden(spiel, "verfehlt", { quelle: bezugAuf(angreifer), ziel: bezugAuf(ziel), grund: ergebnis });
    hakenAusloesen(spiel, "verfehlt", { ...beteiligte, grund: ergebnis });
  }
}

// Trefferwurf als Baustein für Fernkampf, Magie, Psi und Flächen:
//   { baustein: "trefferwurf", genauigkeit, effekt, gegen?, sonst?, kritchance? }
//   gegen: Verteidigung des Ziels (Vorgabe "ausweichen", Psi z.B. "willenskraft");
//   sonst: Effekt bei Fehlschlag, z.B. halber Schaden bei einer Explosion
bausteinAnmelden("trefferwurf", { genauigkeit: "ganzzahl", effekt: "effekt", gegen: VERTEIDIGUNGEN, sonst: "effekt?", kritchance: "ganzzahl?" }, (spiel, kontext, parameter) => {
  const entitaeten = spiel.zustand.entitaeten;
  const ziel = entitaeten[kontext.zielId];
  const quelle = entitaeten[kontext.quelleId];
  const tags = [...kontext.tags];
  for (const tag of tagsDesEffekts(spiel, parameter.effekt)) if (!tags.includes(tag)) tags.push(tag);
  const { ergebnis, kritisch } = trefferwurf(spiel, { quelle, ziel, genauigkeit: parameter.genauigkeit, gegen: parameter.gegen, tags, kritchance: parameter.kritchance });
  if (ergebnis === "treffer") {
    effektAnwenden(spiel, parameter.effekt, { ...kontext, kritisch });
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligteAus(kontext), kritisch });
    return;
  }
  melden(spiel, "verfehlt", { quelle: quelle ? bezugAuf(quelle) : null, ziel: bezugAuf(ziel), grund: ergebnis });
  hakenAusloesen(spiel, "verfehlt", { ...beteiligteAus(kontext), kritisch: false, grund: ergebnis });
  if (parameter.sonst) effektAnwenden(spiel, parameter.sonst, { ...kontext, kritisch: false });
}, { brauchtZiel: true });

// Schadensrechnung am Haken vor_schaden; kontext: { quelleId, zielId, tags, kritisch, schadensart, menge }
const umstaendeDesSchadens = (kontext, gegenueberId) => ({ gegenueberId, tags: kontext.schadensart ? [...kontext.tags, kontext.schadensart] : kontext.tags });

// Angreifer: Modifikator "schaden" (mit den Tags und der Schadensart), danach der Krit
anmelden("haken", "vor_schaden", (spiel, kontext) => {
  const quelle = spiel.zustand.entitaeten[kontext.quelleId];
  if (!quelle) return;
  const umstaende = umstaendeDesSchadens(kontext, kontext.zielId);
  kontext.menge = modifiziert(spiel, quelle, "schaden", kontext.menge, umstaende);
  if (kontext.kritisch) {
    const kritfaktor = Math.max(100, modifiziert(spiel, quelle, "kritfaktor", kampfregeln(spiel).kritfaktor, umstaende));
    kontext.menge = Math.round((kontext.menge * kritfaktor) / 100);
  }
}, { rang: RANG_ANGREIFER });

// Rüstung des Ziels gegen eine Schadensart: ruestung (nur Arten mit ruestung: true) und ruestung.<art>
export function ruestungGegen(spiel, ziel, art, umstaende = {}) {
  if (!art) return 0;
  const ziele = [`ruestung.${art}`];
  let basis = 0;
  if (spiel.daten.schadensarten?.[art]?.ruestung) {
    ziele.push("ruestung");
    basis = ziel.kampfwerte?.ruestung ?? 0;
  }
  return Math.max(0, modifiziert(spiel, ziel, ziele, basis, umstaende));
}

// Fester Abzug, ein Treffer mit Schaden behält mindestens mindestschadenNachRuestung
anmelden("haken", "vor_schaden", (spiel, kontext) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel || kontext.menge <= 0 || kontext.tags.includes("ignoriert_ruestung")) return;
  const ruestung = ruestungGegen(spiel, ziel, kontext.schadensart, umstaendeDesSchadens(kontext, kontext.quelleId));
  if (ruestung === 0) return;
  const nachher = Math.max(Math.min(kontext.menge, kampfregeln(spiel).mindestschadenNachRuestung), kontext.menge - ruestung);
  kontext.ruestungAbzug = kontext.menge - nachher;
  kontext.menge = nachher;
}, { rang: RANG_RUESTUNG });

export function istImmun(spiel, ziel, art, umstaende = {}) {
  return Boolean(art && (ziel.immun || []).includes(art)) || modifiziert(spiel, ziel, "immunitaet", 0, umstaende) > 0;
}

// Widerstandspunkte gegen eine Schadensart (negativ: verwundbar)
export function widerstandGegen(spiel, ziel, art, umstaende = {}) {
  return modifiziert(spiel, ziel, "widerstand", (art && ziel.widerstaende?.[art]) || 0, umstaende);
}

// Schaden nach Widerstand, einmal gerundet; nähert sich 0 (hoher Widerstand) bzw. dem Doppelten (hohe Verwundbarkeit)
export function schadenNachWiderstand(menge, widerstand, halbwert) {
  if (widerstand >= 0) return Math.round((menge * halbwert) / (halbwert + widerstand));
  return Math.round((menge * (halbwert - 2 * widerstand)) / (halbwert - widerstand));
}

anmelden("haken", "vor_schaden", (spiel, kontext) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel || kontext.menge <= 0) return;
  const umstaende = umstaendeDesSchadens(kontext, kontext.quelleId);
  if (istImmun(spiel, ziel, kontext.schadensart, umstaende)) {
    kontext.immun = true;
    kontext.widerstanden = kontext.menge;
    kontext.menge = 0;
    return;
  }
  const widerstand = widerstandGegen(spiel, ziel, kontext.schadensart, umstaende);
  if (widerstand === 0) return;
  const nachher = schadenNachWiderstand(kontext.menge, widerstand, kampfregeln(spiel).halbwertWiderstand);
  kontext.widerstanden = kontext.menge - nachher;
  kontext.menge = nachher;
}, { rang: RANG_WIDERSTAND });
