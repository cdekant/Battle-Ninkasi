// Kampf (siehe docs/Wesen.md, Kampfwerte): Trefferwurf, Blocken, Krit, Nahkampf und die Schadensrechnung
// über Rüstung, Widerstand und Immunität.
//
// Angriffsprofile in den Daten: angriffe: [{ name, genauigkeit, effekt, kosten?, chance?, tags?, kritchance?, muster?, trifft? }]
//   Eine Angriffsaktion führt die Profile nacheinander in der Reihenfolge der Daten aus, jedes mit eigenem Wurf;
//   ein Profil mit chance (Prozent) wird nur so oft mitgenommen, kommt keines zum Zug, das erste.
//   kosten: Zeitkosten des Profils (Vorgabe kosten.nahkampf des Wesens, sonst aktionen.nahkampf); die Aktion kostet so
//   viel wie ihr langsamstes Profil,
//   Modifikatoren auf kosten.nahkampf und kosten.alle wirken darauf.
//   muster (siehe systeme/zielauswahl.js) vom Angreifer in Richtung des Ziels, z.B. Rundumschlag
//   { art: "angrenzend" } oder Speer { art: "linie", laenge: 2 }; jedes getroffene Wesen bekommt einen
//   eigenen Trefferwurf, in der Reihenfolge der Felder; trifft Vorgabe "wesen", der Angreifer nie selbst.
//   Wessen Lebenswert schon bei 0 liegt, wird von weiteren Profilen derselben Aktion nicht mehr angegriffen.
//   Vor jedem einzelnen Angriff läuft der Haken vor_angriff; ein Abbruch lässt diesen Angriff aus.
// Zugriff auf die Profile nur über angriffeVon: angelegte Waffen ersetzen die eigenen Profile (systeme/ausruestung.js).
// Kampfwerte am Wesen: kampfwerte: { ausweichen?, willenskraft?, blocken?, ruestung?, kritchance?, heimlichkeit? } als Punkte
//   (Vorgabe 0, heimlichkeit siehe systeme/wahrnehmung.js, entdecken siehe systeme/fallen.js, kennerschaft siehe systeme/kennen.js),
//   abgefragt über Modifikatoren mit gleichnamigem Ziel; widerstaende: { saeure: 100, feuer: -50 }; immun: ["psi"]
// Punkte werden über einen Halbwert zu Anteilen, die sich 100 % nur annähern: punkte / (punkte + halbwert).
//   Trefferchance: genauigkeit / (genauigkeit + verteidigung + grundverteidigung)
//   Widerstand R:  menge × H / (H + R), negativ menge × (H − 2R) / (H − R), nähert sich also dem Doppelten
// Marker als Tags an Angriff oder Effekt: verfehlt_nie, unblockbar, ignoriert_ruestung
// Regelwerte in daten/regeln.js (kampf).

import { wurfAnteil, wurfProzent } from "../kern/wurf.js";
import { modifiziert, lebenswertName } from "../kern/werte.js";
import { effektAnwenden, beteiligteAus } from "../kern/effekte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { anmelden } from "../kern/register.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { fraktionVon, istWesen, eigeneAngriffeVon, grundkostenVon } from "../kern/zustand.js";

export { istWesen };
import { musterFelder, entitaetenAufFeldern } from "./zielauswahl.js";
import { beziehungZwischen, urheberVon } from "./fraktionen.js";
import { istAhnungslos, laermMachen } from "./wahrnehmung.js";
import { istWehrlos } from "./zustaende.js";
import { abstand } from "../welt/karte.js";
import { waffenprofile } from "./ausruestung.js";

export const KAMPFWERTE = ["ausweichen", "willenskraft", "blocken", "ruestung", "kritchance", "heimlichkeit", "entdecken", "kennerschaft"];
export const VERTEIDIGUNGEN = ["ausweichen", "willenskraft"];
export const MARKER = ["verfehlt_nie", "unblockbar", "ignoriert_ruestung"];

// Ränge der Schadensrechnung am Haken vor_schaden stehen in kern/hakenkatalog.js
import { RANG_ANGREIFER, RANG_RUESTUNG, RANG_WIDERSTAND } from "../kern/hakenkatalog.js";
export { RANG_ANGREIFER, RANG_RUESTUNG, RANG_WIDERSTAND };

// Feindlich nach der Beziehung (systeme/fraktionen.js), mit Zorn
export function feindlich(spiel, erstesWesen, zweitesWesen) {
  return istWesen(erstesWesen) && istWesen(zweitesWesen) && beziehungZwischen(spiel, urheberVon(erstesWesen), zweitesWesen) === "feind";
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

// Trefferwurf, Blocken und Krit nacheinander; gibt { ergebnis: "treffer" | "ausgewichen" | "geblockt", kritisch, hinterhalt,
// trefferchance } zurück (trefferchance in Prozent vor dem Blocken, nur für die Anzeige im Log)
// wurf wie bei trefferanteil, dazu kritchance? (Punkte zusätzlich zu denen der Quelle)
// Hinterhalt: ein ahnungsloses Ziel (systeme/wahrnehmung.js) wird sicher getroffen, nicht geblockt und kritisch;
// ein wehrloses (systeme/zustaende.js istWehrlos) sicher und nicht geblockt, aber ohne Krit, auch von einer Falle
export function trefferwurf(spiel, wurf) {
  const { quelle, ziel, tags = [] } = wurf;
  if (quelle && istAhnungslos(ziel)) {
    melden(spiel, "hinterhalt", { quelle: bezugAuf(quelle), ziel: bezugAuf(ziel) });
    return { ergebnis: "treffer", kritisch: true, hinterhalt: true, trefferchance: 100 };
  }
  if (istWehrlos(spiel, ziel)) return { ergebnis: "treffer", kritisch: false, hinterhalt: false, trefferchance: 100 };
  const regeln = kampfregeln(spiel);
  const { zaehler, nenner } = trefferanteil(spiel, wurf);
  const trefferchance = anteilInProzent(zaehler, nenner);
  if (!wurfAnteil(spiel, "treffer", zaehler, nenner)) return { ergebnis: "ausgewichen", kritisch: false, hinterhalt: false, trefferchance };
  if (!tags.includes("unblockbar")) {
    const blocken = kampfwert(spiel, ziel, "blocken", { gegenueberId: quelle?.id, tags });
    if (wurfAnteil(spiel, "blocken", blocken, blocken + regeln.halbwertBlocken)) return { ergebnis: "geblockt", kritisch: false, hinterhalt: false, trefferchance };
  }
  const kritchance = quelle ? kampfwert(spiel, quelle, "kritchance", { gegenueberId: ziel.id, tags }, wurf.kritchance ?? 0) : 0;
  return { ergebnis: "treffer", kritisch: wurfAnteil(spiel, "kritisch", kritchance, kritchance + regeln.halbwertKritchance), hinterhalt: false, trefferchance };
}

const tagsDesEffekts = (spiel, effektName) => spiel.daten.effekte?.[effektName]?.tags || [];

// Die Angriffsprofile eines Wesens; einziger Zugriff. Angelegte Waffen ersetzen die eigenen Profile (die Faust),
// siehe systeme/ausruestung.js
export function angriffeVon(spiel, wesen) {
  return waffenprofile(spiel, wesen) ?? eigeneAngriffeVon(wesen);
}

export function kannAngreifen(spiel, wesen) {
  return angriffeVon(spiel, wesen).length > 0;
}

// Grundkosten eines Profils in Zeiteinheiten für den Angreifer
export function kostenDesProfils(spiel, angreifer, profil) {
  return profil.kosten ?? grundkostenVon(spiel, angreifer, "nahkampf");
}

// Grundkosten eines Angriffs mit allen Profilen ohne Wurf (das langsamste), null ohne Profile; für die Anzeige
export function angriffskosten(spiel, angreifer) {
  const profile = angriffeVon(spiel, angreifer);
  return profile.length === 0 ? null : Math.max(...profile.map((profil) => kostenDesProfils(spiel, angreifer, profil)));
}

// Welche Profile eine Aktion ausführt: ohne chance immer, sonst nach Wurf; kommt keines zum Zug, das erste
function profileDerAktion(spiel, profile) {
  const gewaehlt = profile.filter((profil) => profil.chance === undefined || wurfProzent(spiel, "angriffsprofil", profil.chance));
  return gewaehlt.length > 0 ? gewaehlt : profile.slice(0, 1);
}

function angriffsziele(spiel, angreifer, profil, ziel) {
  if (!profil.muster) return [ziel];
  const auswahl = { ursprung: { ...angreifer.position }, zielpunkt: { ...ziel.position }, quelleId: angreifer.id };
  const felder = musterFelder(spiel, profil.muster, auswahl);
  return entitaetenAufFeldern(spiel, felder, { trifft: profil.trifft ?? "wesen", urheberId: angreifer.id, urheberFraktion: fraktionVon(angreifer), ohneUrheber: true });
}

const lebenswertUeberNull = (wesen) => (wesen.werte?.[lebenswertName(wesen)]?.aktuell ?? 0) > 0;

// Führt die Profile gegen ein Ziel aus (Kettentiefe für Angriffe aus Auslösern); gibt die ausgeführten Profile zurück
function profileAusfuehren(spiel, angreifer, ziel, ausgefuehrt, kettentiefe) {
  ausgefuehrt.forEach((profil, nummer) => {
    for (const getroffenes of angriffsziele(spiel, angreifer, profil, ziel)) {
      if (!spiel.zustand.entitaeten[getroffenes.id]) continue;
      if (nummer > 0 && !lebenswertUeberNull(getroffenes)) continue;
      einzelangriff(spiel, angreifer, profil, getroffenes, kettentiefe);
    }
  });
  laermMachen(spiel, angreifer.position, spiel.daten.regeln.wahrnehmung.laermNahkampf, angreifer.id, "nahkampf");
}

// Angriffsaktion gegen ein Ziel mit allen Profilen; gibt die Grundkosten zurück (das langsamste ausgeführte Profil)
export function nahkampf(spiel, angreifer, ziel) {
  const profile = angriffeVon(spiel, angreifer);
  if (profile.length === 0) return grundkostenVon(spiel, angreifer, "nahkampf");
  const ausgefuehrt = profileDerAktion(spiel, profile);
  profileAusfuehren(spiel, angreifer, ziel, ausgefuehrt, 0);
  return Math.max(...ausgefuehrt.map((profil) => kostenDesProfils(spiel, angreifer, profil)));
}

function einzelangriff(spiel, angreifer, profil, ziel, kettentiefe = 0) {
  const tags = [...(profil.tags || [])];
  for (const tag of tagsDesEffekts(spiel, profil.effekt)) if (!tags.includes(tag)) tags.push(tag);
  const mittel = { art: "angriff", name: profil.name };
  const urheberId = angreifer.beschworenVon ?? angreifer.id;
  const vorher = hakenAusloesen(spiel, "vor_angriff", { quelleId: angreifer.id, urheberId, zielId: ziel.id, ursache: "nahkampf", kettentiefe, mittel, tags, angriff: profil.name, abgebrochen: false });
  if (vorher.abgebrochen) return;
  const { ergebnis, kritisch, trefferchance } = trefferwurf(spiel, { quelle: angreifer, ziel, genauigkeit: profil.genauigkeit, tags, kritchance: profil.kritchance });
  const beteiligte = { quelleId: angreifer.id, urheberId, zielId: ziel.id, ursache: "nahkampf", kettentiefe, mittel, tags, kritisch, trefferchance };
  if (ergebnis === "treffer") {
    effektAnwenden(spiel, profil.effekt, beteiligte);
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligte });
  } else {
    melden(spiel, "verfehlt", { quelle: bezugAuf(angreifer), ziel: bezugAuf(ziel), grund: ergebnis, trefferchance });
    hakenAusloesen(spiel, "verfehlt", { ...beteiligte, grund: ergebnis });
  }
}

// Angriff als Baustein, z.B. Konter aus einem Auslöser: { baustein: "angreifen", profil? }
//   Die Quelle greift das Ziel mit ihren Angriffsprofilen an wie bei einer Angriffsaktion, ohne Zeitkosten;
//   mit profil nur dieses eine Profil (fehlt es der Quelle, passiert nichts). Nur gegen ein Ziel daneben.
//   Die Angriffe laufen auf der Kettentiefe des Effekts, so enden gegenseitige Konter an der höchsten Kettentiefe.
bausteinAnmelden("angreifen", { profil: "text?" }, (spiel, kontext, parameter) => {
  const entitaeten = spiel.zustand.entitaeten;
  const angreifer = entitaeten[kontext.quelleId], ziel = entitaeten[kontext.zielId];
  if (!angreifer?.position || !ziel?.position || angreifer.id === ziel.id) return;
  if (abstand(angreifer.position, ziel.position) > 1) return;
  const profile = angriffeVon(spiel, angreifer);
  const ausgefuehrt = parameter.profil === undefined ? profileDerAktion(spiel, profile) : profile.filter((profil) => profil.name === parameter.profil);
  if (ausgefuehrt.length === 0) return;
  profileAusfuehren(spiel, angreifer, ziel, ausgefuehrt, kontext.kettentiefe ?? 0);
}, { brauchtZiel: true });

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
  const { ergebnis, kritisch, trefferchance } = trefferwurf(spiel, { quelle, ziel, genauigkeit: parameter.genauigkeit, gegen: parameter.gegen, tags, kritchance: parameter.kritchance });
  if (ergebnis === "treffer") {
    effektAnwenden(spiel, parameter.effekt, { ...kontext, kritisch, trefferchance });
    hakenAusloesen(spiel, "nach_treffer", { ...beteiligteAus(kontext), kritisch });
    return;
  }
  melden(spiel, "verfehlt", { quelle: quelle ? bezugAuf(quelle) : null, ziel: bezugAuf(ziel), grund: ergebnis, trefferchance });
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
    kontext.kritfaktor = kritfaktor;
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
