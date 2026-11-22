// Feldschichten (siehe docs/Welt.md, Feldschichten): Oberfläche, Gas und Feuer neben der Karte, Vorbild Brogue.
// Datenzugriff in welt/schichten.js; Arten in daten/schichten.js, Feuer in regeln.feuer, Obergrenzen in regeln.schichten.
//
// Oberfläche { art, menge }: oberflaechen.<art> = { text, schwund?, hoechstens?, beimBetreten?, jeTick?, ausloesenFuer?,
//   brennbar?, brenndauer?, verbrenntZu?, ausbreitung?: { chance }, gefaehrlich? }
//   liegt nur auf passierbarem Gelände; gleiche Art addiert die Menge, eine andere verdrängt die alte;
//   je Welttick: jeTick auf Wesen darin (Bewegungsarten aus ausloesenFuer, Vorgabe laufend und unbeweglich),
//   Schwund (ruht, solange das Feld brennt, damit Brennbares bis zum Ende brennt), Ausbreitung mit chance auf ein Nachbarfeld ohne Oberfläche (zufällig aus den freien, feste Reihenfolge);
//   beimBetreten am Haken betritt_feld
// Gas { art, menge }: gase.<art> = { text, abbau, stufen?: [{ ab, effekt, wenn? }], undurchsichtigAb?, brennbar?,
//   explodiert?, gefaehrlich?, hoechstens? }
//   nur auf gasdurchlässigen Feldern; gleiche Art addiert, eine andere wird verdrängt, wenn die neue Menge größer ist;
//   je Welttick: Quellen am Gelände (quelle: { gas, menge }), Ausgleich (je Paar aus Gasfeld und Nachbar ein
//   Neuntel des Unterschieds, abgerundet, aus dem alten Stand, die Gesamtmenge bleibt), Abbau in Prozent (der Bruchteil
//   als Wurf: 1 % von 50 ist mit 50 % Chance 1, im Mittel also genau 1 %),
//   dann die höchste erreichte Stufe auf jedes Wesen darin, deren wenn am Wesen gilt
// Feuer { menge }: Brenndauer in Weltticks; je Welttick und brennendem Feld: regeln.feuer.brennen auf Wesen darin,
//   Rauch (regeln.feuer.rauch), Übergreifen auf jedes nicht brennende Nachbarfeld mit der Chance seiner Brennbarkeit
//   (die höchste aus Gelände, Oberfläche, Gas), Menge minus 1; erlischt es, verbrennen Oberfläche und Gelände zu
//   verbrenntZu (oder verschwinden). Brennbares Gas fängt auf einmal Feuer und wirkt explodiert am Feld.
// Bausteine: oberflaeche_setzen { art, menge, muster? }, gas_setzen { art, menge, muster? }, entzuenden { muster? }
// Würfe über den Spiel-Zufall, immer nach Feldindex aufsteigend, damit Spielstände wiederholbar bleiben.

import { anmelden } from "../kern/register.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden } from "../kern/ereignisse.js";
import { wurfProzent, wurfAuswahl } from "../kern/wurf.js";
import { bedingungenErfuellt } from "../kern/werte.js";
import { entitaetenAuf, bewegungVon, istWesen, gesteuerteEntitaet } from "../kern/zustand.js";
import { aufDerKarte, feldIndex, gelaendeAuf, passierbar } from "../welt/karte.js";
import { ACHT_RICHTUNGEN } from "../welt/geometrie.js";
import { schichtenVon, schichtAuf, belegteFelder, feldVonIndex, gasdurchlaessig } from "../welt/schichten.js";
import { musterFelder } from "./zielauswahl.js";
import { gelaendeSetzen } from "./gelaende.js";
import { sichtfeldAktualisieren } from "./sicht.js";

const oberflaecheDaten = (spiel, art) => spiel.daten.schichten.oberflaechen[art];
const gasDaten = (spiel, art) => spiel.daten.schichten.gase[art];
const regelnSchichten = (spiel) => spiel.daten.regeln.schichten;

function nachbarIndizes(ebene, index) {
  const { x, y } = feldVonIndex(ebene, index);
  const ergebnis = [];
  for (const { dx, dy } of ACHT_RICHTUNGEN) if (aufDerKarte(ebene, x + dx, y + dy)) ergebnis.push(feldIndex(ebene, x + dx, y + dy));
  return ergebnis;
}

// Wesen auf einem Feld (nach ID)
const wesenAufIndex = (spiel, index) => {
  const { x, y } = feldVonIndex(spiel.zustand.ebene, index);
  return entitaetenAuf(spiel.zustand, x, y).filter(istWesen);
};

function aufWesenWirken(spiel, effekt, wesen, index, ursache, mittel) {
  if (!spiel.zustand.entitaeten[wesen.id]) return;
  const feld = feldVonIndex(spiel.zustand.ebene, index);
  effektAnwenden(spiel, effekt, { quelleId: null, zielId: wesen.id, ursprung: feld, zielfeld: feld, ursache, mittel });
}

const betroffenVonOberflaeche = (daten, wesen) => (daten.ausloesenFuer ?? ["laufend", "unbeweglich"]).includes(bewegungVon(wesen));

// Oberfläche

export function oberflaecheSetzen(spiel, feld, art, menge) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, feld.x, feld.y) || !passierbar(spiel, feld.x, feld.y) || menge <= 0) return;
  const tabelle = schichtenVon(ebene, true).oberflaeche;
  const index = feldIndex(ebene, feld.x, feld.y);
  const vorher = tabelle[index];
  const hoechstens = oberflaecheDaten(spiel, art).hoechstens ?? regelnSchichten(spiel).hoechstOberflaeche;
  const neu = vorher?.art === art ? vorher.menge + menge : menge;
  tabelle[index] = { art, menge: Math.min(hoechstens, neu) };
}

function oberflaecheEntfernen(spiel, index) {
  delete schichtenVon(spiel.zustand.ebene, true).oberflaeche[index];
}

// Gas

export function gasSetzen(spiel, feld, art, menge) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, feld.x, feld.y) || !gasdurchlaessig(spiel, feld.x, feld.y) || menge <= 0) return;
  gasAufIndexSetzen(spiel, feldIndex(ebene, feld.x, feld.y), art, menge);
}

function gasAufIndexSetzen(spiel, index, art, menge) {
  const tabelle = schichtenVon(spiel.zustand.ebene, true).gas;
  const vorher = tabelle[index];
  const hoechstens = gasDaten(spiel, art).hoechstens ?? regelnSchichten(spiel).hoechstGas;
  if (vorher && vorher.art !== art && vorher.menge >= menge) return; // die größere Menge behauptet sich
  const neu = vorher?.art === art ? vorher.menge + menge : menge;
  tabelle[index] = { art, menge: Math.min(hoechstens, neu) };
}

// Feuer

// Brennbarkeit eines Felds in Prozent: die höchste aus Gelände, Oberfläche und Gas
export function brennbarkeit(spiel, x, y) {
  const oberflaeche = schichtAuf(spiel, "oberflaeche", x, y);
  const gas = schichtAuf(spiel, "gas", x, y);
  return Math.max(
    gelaendeAuf(spiel, x, y)?.brennbar ?? 0,
    oberflaeche ? oberflaecheDaten(spiel, oberflaeche.art).brennbar ?? 0 : 0,
    gas ? gasDaten(spiel, gas.art).brennbar ?? 0 : 0,
  );
}

// Entzündet ein Feld, wenn etwas darauf brennt; brennbares Gas verpufft dabei auf einmal. Gibt true zurück, wenn es brennt.
export function entzuenden(spiel, feld) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, feld.x, feld.y) || brennbarkeit(spiel, feld.x, feld.y) <= 0) return false;
  const schichten = schichtenVon(ebene, true);
  const index = feldIndex(ebene, feld.x, feld.y);
  if (schichten.feuer[index]) return true;
  const oberflaeche = schichten.oberflaeche[index];
  const gas = schichten.gas[index];
  const dauer = Math.max(
    regelnFeuer(spiel).dauer,
    gelaendeAuf(spiel, feld.x, feld.y)?.brenndauer ?? 0,
    oberflaeche ? oberflaecheDaten(spiel, oberflaeche.art).brenndauer ?? 0 : 0,
  );
  schichten.feuer[index] = { menge: dauer };
  melden(spiel, "entzuendet", { feld: { x: feld.x, y: feld.y } });
  if (gas && gasDaten(spiel, gas.art).brennbar) {
    delete schichten.gas[index];
    const explodiert = gasDaten(spiel, gas.art).explodiert;
    if (explodiert) effektAnwenden(spiel, explodiert, { quelleId: null, zielId: null, ursprung: { ...feld }, zielfeld: { ...feld }, ursache: "feuer", mittel: { art: "gas", name: gas.art } });
  }
  return true;
}

const regelnFeuer = (spiel) => spiel.daten.regeln.feuer;

// Bausteine

function felderDesEffekts(spiel, kontext, muster) {
  const zielfeld = kontext.zielfeld ?? kontext.ursprung;
  if (!zielfeld) return [];
  if (!muster) return [zielfeld];
  return musterFelder(spiel, muster, { ursprung: kontext.ursprung ?? zielfeld, zielpunkt: zielfeld, quelleId: kontext.quelleId });
}

bausteinAnmelden("oberflaeche_setzen", { art: "oberflaeche", menge: "ganzzahl", muster: "muster?" }, (spiel, kontext, parameter) => {
  for (const feld of felderDesEffekts(spiel, kontext, parameter.muster)) oberflaecheSetzen(spiel, feld, parameter.art, parameter.menge);
});

bausteinAnmelden("gas_setzen", { art: "gas", menge: "ganzzahl", muster: "muster?" }, (spiel, kontext, parameter) => {
  for (const feld of felderDesEffekts(spiel, kontext, parameter.muster)) gasSetzen(spiel, feld, parameter.art, parameter.menge);
});

bausteinAnmelden("entzuenden", { muster: "muster?" }, (spiel, kontext, parameter) => {
  for (const feld of felderDesEffekts(spiel, kontext, parameter.muster)) entzuenden(spiel, feld);
});

// Beim Betreten: Oberfläche und Feuer
anmelden("haken", "betritt_feld", (spiel, kontext) => {
  const wesen = spiel.zustand.entitaeten[kontext.zielId];
  if (!wesen || !istWesen(wesen)) return;
  const { x, y } = kontext.position;
  const index = feldIndex(spiel.zustand.ebene, x, y);
  const oberflaeche = schichtAuf(spiel, "oberflaeche", x, y);
  const daten = oberflaeche && oberflaecheDaten(spiel, oberflaeche.art);
  if (daten?.beimBetreten && betroffenVonOberflaeche(daten, wesen)) aufWesenWirken(spiel, daten.beimBetreten, wesen, index, "oberflaeche", { art: "oberflaeche", name: oberflaeche.art });
  if (schichtAuf(spiel, "feuer", x, y)) aufWesenWirken(spiel, regelnFeuer(spiel).brennen, wesen, index, "feuer", { art: "feuer", name: "feuer" });
});

// Weltuhr: Oberfläche

anmelden("welttick", "oberflaeche", (spiel) => {
  const ebene = spiel.zustand.ebene;
  if (!ebene?.schichten) return;
  const tabelle = ebene.schichten.oberflaeche;
  for (const index of belegteFelder(ebene, "oberflaeche")) {
    const eintrag = tabelle[index];
    if (!eintrag) continue;
    const daten = oberflaecheDaten(spiel, eintrag.art);
    if (daten.jeTick) {
      for (const wesen of wesenAufIndex(spiel, index)) if (betroffenVonOberflaeche(daten, wesen)) aufWesenWirken(spiel, daten.jeTick, wesen, index, "oberflaeche", { art: "oberflaeche", name: eintrag.art });
    }
    if (daten.ausbreitung && wurfProzent(spiel, "ausbreitung", daten.ausbreitung.chance)) {
      const freie = nachbarIndizes(ebene, index).filter((nachbar) => !tabelle[nachbar] && passierbar(spiel, nachbar % ebene.breite, Math.floor(nachbar / ebene.breite)));
      if (freie.length) tabelle[wurfAuswahl(spiel, "ausbreitung_wohin", freie)] = { art: eintrag.art, menge: 1 };
    }
    if (daten.schwund && tabelle[index] && !ebene.schichten.feuer[index]) {
      tabelle[index].menge -= daten.schwund;
      if (tabelle[index].menge <= 0) oberflaecheEntfernen(spiel, index);
    }
  }
});

// Weltuhr: Gas

// Felder mit Gasquellen, aus der Karte abgeleitet und im zwischenspeicher gehalten; gelaendeSetzen verwirft ihn
// (systeme/gelaende.js), ein Wechsel der Ebene auch
function gasquellen(spiel) {
  const ebene = spiel.zustand.ebene;
  const zwischen = spiel.zwischenspeicher;
  if (zwischen.gasquellen?.ebene !== ebene) {
    const quellen = [];
    for (let y = 0; y < ebene.hoehe; y++) {
      for (let x = 0; x < ebene.breite; x++) {
        const quelle = gelaendeAuf(spiel, x, y)?.quelle;
        if (quelle) quellen.push({ x, y, quelle });
      }
    }
    zwischen.gasquellen = { ebene, quellen };
  }
  return zwischen.gasquellen.quellen;
}

// Quelle auf das Gelände selbst (undurchlässig wie ein Gärbottich): das Gas tritt auf den durchlässigen Nachbarfeldern aus
function quelleAusstroemen(spiel, { x, y, quelle }) {
  if (gasdurchlaessig(spiel, x, y)) return gasSetzen(spiel, { x, y }, quelle.gas, quelle.menge);
  const ebene = spiel.zustand.ebene;
  const offene = nachbarIndizes(ebene, feldIndex(ebene, x, y)).filter((index) => gasdurchlaessig(spiel, index % ebene.breite, Math.floor(index / ebene.breite)));
  if (!offene.length) return;
  // gleichmäßig verteilt, der Rest auf die ersten Felder in fester Reihenfolge
  const teil = Math.floor(quelle.menge / offene.length);
  offene.forEach((index, nummer) => {
    const menge = teil + (nummer < quelle.menge % offene.length ? 1 : 0);
    if (menge > 0) gasAufIndexSetzen(spiel, index, quelle.gas, menge);
  });
}

// Ausgleich aus dem alten Stand: je Paar fließt ein Neuntel des Unterschieds vom volleren ins leerere Feld
function gasAusgleichen(spiel) {
  const ebene = spiel.zustand.ebene;
  const tabelle = schichtenVon(ebene, true).gas;
  const aenderungen = new Map();
  const aendern = (index, art, menge) => {
    const bisher = aenderungen.get(index);
    aenderungen.set(index, { art: bisher?.art ?? art, menge: (bisher?.menge ?? 0) + menge });
  };
  for (const index of belegteFelder(ebene, "gas")) {
    const { art, menge } = tabelle[index];
    for (const nachbar of nachbarIndizes(ebene, index)) {
      if (!gasdurchlaessig(spiel, nachbar % ebene.breite, Math.floor(nachbar / ebene.breite))) continue;
      const dort = tabelle[nachbar];
      if (dort && dort.art !== art) continue; // verschiedene Gase vermischen sich nicht
      const fluss = Math.floor((menge - (dort?.menge ?? 0)) / 9);
      if (fluss <= 0) continue;
      aendern(index, art, -fluss);
      aendern(nachbar, art, fluss);
    }
  }
  for (const [index, { art, menge }] of [...aenderungen].sort(([erster], [zweiter]) => erster - zweiter)) {
    const neu = (tabelle[index]?.menge ?? 0) + menge;
    if (neu > 0) tabelle[index] = { art: tabelle[index]?.art ?? art, menge: neu };
    else delete tabelle[index];
  }
}

anmelden("welttick", "gas", (spiel) => {
  const ebene = spiel.zustand.ebene;
  if (!ebene) return;
  for (const quelle of gasquellen(spiel)) quelleAusstroemen(spiel, quelle);
  if (!ebene.schichten) return;
  gasAusgleichen(spiel);
  const tabelle = ebene.schichten.gas;
  let sichtBetroffen = false;
  for (const index of belegteFelder(ebene, "gas")) {
    const eintrag = tabelle[index];
    const daten = gasDaten(spiel, eintrag.art);
    if (daten.abbau) {
      const hundertstel = eintrag.menge * daten.abbau;
      const rest = hundertstel % 100;
      eintrag.menge -= Math.floor(hundertstel / 100) + (rest > 0 && wurfProzent(spiel, "gasabbau", rest) ? 1 : 0);
    }
    if (eintrag.menge <= 0) {
      delete tabelle[index];
      if (daten.undurchsichtigAb !== undefined) sichtBetroffen = true;
      continue;
    }
    if (daten.undurchsichtigAb !== undefined) sichtBetroffen = true;
    for (const wesen of wesenAufIndex(spiel, index)) {
      const stufe = [...(daten.stufen || [])].reverse().find((kandidat) => eintrag.menge >= kandidat.ab && bedingungenErfuellt(spiel, wesen, kandidat.wenn));
      if (stufe) aufWesenWirken(spiel, stufe.effekt, wesen, index, "gas", { art: "gas", name: eintrag.art });
    }
  }
  // dichter Rauch kommt und geht: Ninkasis Sichtfeld neu berechnen
  if (sichtBetroffen && gesteuerteEntitaet(spiel.zustand)?.position) sichtfeldAktualisieren(spiel);
});

// Weltuhr: Feuer

anmelden("welttick", "feuer", (spiel) => {
  const ebene = spiel.zustand.ebene;
  if (!ebene?.schichten) return;
  const schichten = ebene.schichten;
  const brennend = belegteFelder(ebene, "feuer");
  if (!brennend.length) return;
  const regeln = regelnFeuer(spiel);
  const zuEntzuenden = new Set();
  for (const index of brennend) {
    for (const wesen of wesenAufIndex(spiel, index)) aufWesenWirken(spiel, regeln.brennen, wesen, index, "feuer", { art: "feuer", name: "feuer" });
    const feld = feldVonIndex(ebene, index);
    if (regeln.rauch) gasSetzen(spiel, feld, regeln.rauch, regeln.rauchMenge);
    for (const nachbar of nachbarIndizes(ebene, index)) {
      if (schichten.feuer[nachbar] || zuEntzuenden.has(nachbar)) continue;
      const chance = brennbarkeit(spiel, nachbar % ebene.breite, Math.floor(nachbar / ebene.breite));
      if (chance > 0 && wurfProzent(spiel, "entzuenden", chance)) zuEntzuenden.add(nachbar);
    }
  }
  // erst abbrennen lassen, dann die neuen Felder entzünden (sie brennen ab dem nächsten Welttick)
  for (const index of brennend) {
    const eintrag = schichten.feuer[index];
    if (!eintrag) continue;
    eintrag.menge -= 1;
    if (eintrag.menge > 0) continue;
    delete schichten.feuer[index];
    const feld = feldVonIndex(ebene, index);
    const oberflaeche = schichten.oberflaeche[index];
    const datenOberflaeche = oberflaeche && oberflaecheDaten(spiel, oberflaeche.art);
    if (datenOberflaeche?.brennbar) {
      delete schichten.oberflaeche[index];
      if (datenOberflaeche.verbrenntZu) oberflaecheSetzen(spiel, feld, datenOberflaeche.verbrenntZu, 1);
    }
    const gelaende = gelaendeAuf(spiel, feld.x, feld.y);
    if (gelaende?.brennbar && gelaende.verbrenntZu) gelaendeSetzen(spiel, feld, gelaende.verbrenntZu);
    melden(spiel, "erloschen", { feld });
  }
  for (const index of [...zuEntzuenden].sort((erster, zweiter) => erster - zweiter)) entzuenden(spiel, feldVonIndex(ebene, index));
});

// Für die Wegfindung (welt/wege.js meiden): Felder mit Feuer oder mit gefährlicher Oberfläche oder Gas; null, wenn keine
export function gefahrenMeiden(spiel) {
  const ebene = spiel.zustand.ebene;
  if (!ebene?.schichten) return null;
  const felder = new Set();
  for (const index of belegteFelder(ebene, "feuer")) felder.add(index);
  for (const schicht of ["oberflaeche", "gas"]) {
    const arten = schicht === "gas" ? spiel.daten.schichten.gase : spiel.daten.schichten.oberflaechen;
    for (const index of belegteFelder(ebene, schicht)) if (arten[ebene.schichten[schicht][index].art].gefaehrlich) felder.add(index);
  }
  return felder.size ? (x, y) => felder.has(feldIndex(ebene, x, y)) : null;
}

// Mehrere Prüfungen für meiden zu einer zusammenfassen (null-Einträge fallen weg)
export function meidenZusammen(...pruefungen) {
  const vorhanden = pruefungen.filter(Boolean);
  if (!vorhanden.length) return null;
  return (x, y) => vorhanden.some((pruefung) => pruefung(x, y));
}
