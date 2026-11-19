// Zielmuster und Zielauswahl (siehe docs/Architektur.md, Zielauswahl).
// Zielmuster im Register "zielmuster": (spiel, auswahl, parameter) => [{x, y}]
//   auswahl = { ursprung, zielpunkt, quelleId }; in den Daten z.B. muster: { art: "kreis", radius: 1 }
//   jedes Muster beschreibt seine Parameter in "parameter" für die Datenprüfung (wie die Bausteine)
//   Kreis, Kegel und angrenzend nur mit Sichtlinie vom Ursprung (keine Explosion um die Ecke),
//   abschaltbar mit durchWaende: true; Linie und Strahl enden an undurchsichtigen Feldern
// Getroffen werden Entitäten auf den Feldern nach trifft, aus Sicht der Urheberin:
//   "alle" (auch Gegenstände), "wesen", "feinde", "verbuendete" (nach der Beziehung, systeme/fraktionen.js)
// Zielarten für Fähigkeiten (Punkt 6) und Vorschau: siehe zielAufloesen.

import { anmelden, holen } from "../kern/register.js";
import { entitaetenAuf, fraktionVon, istWesen } from "../kern/zustand.js";
import { aufDerKarte } from "../welt/karte.js";
import { kreis, kegel, flugbahn, sichtlinieFrei, felderOrdnen, gleichesFeld, inReichweite, KEGEL_OEFFNUNGEN } from "../welt/geometrie.js";
import { beziehungZwischen } from "./fraktionen.js";
import { istSichtbar } from "./sicht.js";

function musterAnmelden(name, parameterBeschreibung, funktion) {
  funktion.parameter = parameterBeschreibung;
  anmelden("zielmuster", name, funktion);
}

const DURCH_WAENDE = { durchWaende: "wahrheitswert?" };

function vomUrsprungErreichbar(spiel, auswahl, parameter, felder) {
  if (parameter.durchWaende) return felder;
  return felder.filter((feld) => sichtlinieFrei(spiel, auswahl.ursprung, feld));
}

// Felder einer Linie ab dem Ursprung in Richtung Zielpunkt, ohne den Ursprung; Wesen halten nicht auf
function linienfelder(spiel, auswahl, laenge) {
  if (gleichesFeld(auswahl.ursprung, auswahl.zielpunkt)) return [];
  return flugbahn(spiel, auswahl.ursprung, auswahl.zielpunkt, { reichweite: laenge, durchdringend: true, ueberZielHinaus: true }).felder;
}

musterAnmelden("selbst", {}, (spiel, auswahl) => [auswahl.ursprung]);
musterAnmelden("feld", {}, (spiel, auswahl) => [auswahl.zielpunkt]);
musterAnmelden("angrenzend", DURCH_WAENDE, (spiel, auswahl, parameter) =>
  vomUrsprungErreichbar(spiel, auswahl, parameter, kreis(auswahl.ursprung, 1).filter((feld) => !gleichesFeld(feld, auswahl.ursprung))));
musterAnmelden("kreis", { radius: "ganzzahl", ...DURCH_WAENDE }, (spiel, auswahl, parameter) =>
  vomUrsprungErreichbar(spiel, auswahl, parameter, kreis(auswahl.ursprung, parameter.radius)));
musterAnmelden("linie", { laenge: "ganzzahl" }, (spiel, auswahl, parameter) => linienfelder(spiel, auswahl, parameter.laenge));
musterAnmelden("strahl", { laenge: "ganzzahl?" }, (spiel, auswahl, parameter) => linienfelder(spiel, auswahl, parameter.laenge ?? Infinity));
// Öffnung in Grad, Vorgabe 90
musterAnmelden("kegel", { laenge: "ganzzahl", oeffnung: Object.keys(KEGEL_OEFFNUNGEN).map(Number), ...DURCH_WAENDE }, (spiel, auswahl, parameter) => {
  const richtung = { dx: auswahl.zielpunkt.x - auswahl.ursprung.x, dy: auswahl.zielpunkt.y - auswahl.ursprung.y };
  if (richtung.dx === 0 && richtung.dy === 0) return [];
  return vomUrsprungErreichbar(spiel, auswahl, parameter, kegel(auswahl.ursprung, richtung, parameter.laenge, parameter.oeffnung ?? 90));
});

// Felder eines Musters auf der Karte in fester Reihenfolge (Abstand zum Ursprung, dann Feldindex)
export function musterFelder(spiel, muster, auswahl) {
  const { art, ...parameter } = muster;
  const felder = holen("zielmuster", art)(spiel, auswahl, parameter);
  return felderOrdnen(spiel.zustand.ebene, auswahl.ursprung, felder);
}

export const TRIFFT_ARTEN = ["alle", "wesen", "feinde", "verbuendete"];

// urheber: { id, fraktion }; feinde und verbuendete nach der Beziehung (systeme/fraktionen.js), Neutrale sind keins von beiden
export function trifftZu(spiel, trifft, urheber, entitaet) {
  if (trifft === "alle") return true;
  if (!istWesen(entitaet)) return false;
  if (trifft === "wesen") return true;
  if (urheber.fraktion == null) return false;
  const beziehung = beziehungZwischen(spiel, urheber, entitaet);
  return trifft === "feinde" ? beziehung === "feind" : beziehung === "verbuendet";
}

// Entitäten auf den Feldern, in der Reihenfolge der Felder, je Feld nach Entitäts-ID.
// optionen: { trifft (Vorgabe "alle"), urheberId, urheberFraktion (Vorgabe die der Urheberin), ohneUrheber }
export function entitaetenAufFeldern(spiel, felder, { trifft = "alle", urheberId = null, urheberFraktion, ohneUrheber = false } = {}) {
  const zustand = spiel.zustand;
  const fraktion = urheberFraktion !== undefined ? urheberFraktion : fraktionVon(zustand.entitaeten[urheberId]) ?? null;
  const ergebnis = [];
  for (const feld of felder) {
    for (const entitaet of entitaetenAuf(zustand, feld.x, feld.y)) {
      if (ohneUrheber && entitaet.id === urheberId) continue;
      if (trifftZu(spiel, trifft, { id: urheberId, fraktion }, entitaet)) ergebnis.push(entitaet);
    }
  }
  return ergebnis;
}

export const ZIELARTEN = ["selbst", "wesen", "feld", "richtung", "geschoss"];

const istVersatz = (wert) => Number.isInteger(wert) && wert >= -1 && wert <= 1;
const istFeldangabe = (angabe) => Number.isInteger(angabe?.x) && Number.isInteger(angabe?.y);

// Wesen als Ziel: per ID, mit Position
function zielwesen(spiel, zielangabe) {
  if (!Number.isInteger(zielangabe?.id)) return null;
  const entitaet = spiel.zustand.entitaeten[zielangabe.id];
  return entitaet && entitaet.position && istWesen(entitaet) ? entitaet : null;
}

// Ziel prüfen, das die Akteurin sehen und erreichen muss; null, wenn alles passt, sonst der Grund
function zielpunktPruefen(spiel, akteur, zielart, zielpunkt, sichtlinieNoetig) {
  const zustand = spiel.zustand;
  if (!aufDerKarte(zustand.ebene, zielpunkt.x, zielpunkt.y)) return "ungueltig";
  if (akteur.id === zustand.spielerinId && !istSichtbar(zustand, zielpunkt.x, zielpunkt.y)) return "nicht_sichtbar";
  if (zielart.reichweite !== undefined && !inReichweite(akteur.position, zielpunkt, zielart.reichweite)) return "zu_weit";
  if (sichtlinieNoetig && !sichtlinieFrei(spiel, akteur.position, zielpunkt)) return "keine_sichtlinie";
  return null;
}

// Ursprung und Zielpunkt je Zielart: { ursprung, zielpunkt, zielId, bahn } oder { grund }
//   selbst:   beides die Akteurin
//   wesen:    beides das Wesen (smite auf ein Wesen); zielangabe { id }
//   feld:     beides das Feld (smite); zielangabe { x, y }
//   richtung: Ursprung die Akteurin, Zielpunkt ein Feld weiter; zielangabe { dx, dy }
//   geschoss: Bahn von der Akteurin zum Ziel, beides der Aufschlag; zielangabe { x, y } oder { id }
function auswahlBestimmen(spiel, akteur, zielart, zielangabe) {
  const position = { x: akteur.position.x, y: akteur.position.y };
  const sichtlinieNoetig = zielart.brauchtSichtlinie ?? true;
  switch (zielart.art) {
    case "selbst":
      return { ursprung: position, zielpunkt: position, zielId: akteur.id };
    case "wesen": {
      const ziel = zielwesen(spiel, zielangabe);
      if (!ziel) return { grund: "kein_ziel" };
      const zielpunkt = { x: ziel.position.x, y: ziel.position.y };
      const grund = zielpunktPruefen(spiel, akteur, zielart, zielpunkt, sichtlinieNoetig);
      return grund ? { grund } : { ursprung: zielpunkt, zielpunkt, zielId: ziel.id };
    }
    case "feld": {
      if (!istFeldangabe(zielangabe)) return { grund: "ungueltig" };
      const zielpunkt = { x: zielangabe.x, y: zielangabe.y };
      const grund = zielpunktPruefen(spiel, akteur, zielart, zielpunkt, sichtlinieNoetig);
      return grund ? { grund } : { ursprung: zielpunkt, zielpunkt, zielId: null };
    }
    case "richtung": {
      if (!istVersatz(zielangabe?.dx) || !istVersatz(zielangabe?.dy) || (zielangabe.dx === 0 && zielangabe.dy === 0)) return { grund: "ungueltig" };
      return { ursprung: position, zielpunkt: { x: position.x + zielangabe.dx, y: position.y + zielangabe.dy }, zielId: null };
    }
    case "geschoss": {
      const ziel = zielwesen(spiel, zielangabe);
      const anvisiert = ziel ? { x: ziel.position.x, y: ziel.position.y } : istFeldangabe(zielangabe) ? { x: zielangabe.x, y: zielangabe.y } : null;
      if (!anvisiert) return { grund: "ungueltig" };
      if (gleichesFeld(anvisiert, position)) return { grund: "kein_ziel" };
      // die Bahn selbst entscheidet über Wände, eine eigene Sichtlinie braucht es nicht
      const grund = zielpunktPruefen(spiel, akteur, zielart, anvisiert, false);
      if (grund) return { grund };
      const bahn = flugbahn(spiel, position, anvisiert, { reichweite: zielart.reichweite, durchdringend: zielart.durchdringend, ueberZielHinaus: zielart.ueberZielHinaus });
      return { ursprung: bahn.aufschlag, zielpunkt: bahn.aufschlag, zielId: bahn.getroffene[0] ?? null, bahn };
    }
    default:
      return { grund: "ungueltig" };
  }
}

// Löst eine Zielangabe auf, ohne etwas zu ändern oder zu würfeln: Grundlage für Befehle mit Ziel,
// den Zielmodus der Anzeige, Tooltips und die KI.
// zielart: { art, reichweite?, brauchtSichtlinie? (Vorgabe true), muster?, trifft?, ohneUrheber?, durchdringend?, ueberZielHinaus? }
// Gibt { ok: true, ursprung, zielpunkt, zielId, bahn, felder, betroffene: [IDs] } oder { ok: false, grund } zurück.
// Für Ninkasi stehen in betroffene nur Entitäten auf Feldern, die sie sieht.
export function zielAufloesen(spiel, akteur, zielart, zielangabe) {
  if (!akteur || !akteur.position || !ZIELARTEN.includes(zielart?.art)) return { ok: false, grund: "ungueltig" };
  const auswahl = auswahlBestimmen(spiel, akteur, zielart, zielangabe);
  if (auswahl.grund) return { ok: false, grund: auswahl.grund };
  const zustand = spiel.zustand;
  const { ursprung, zielpunkt, zielId, bahn = null } = auswahl;
  const trefferoptionen = { trifft: zielart.trifft ?? "alle", urheberId: akteur.id, ohneUrheber: Boolean(zielart.ohneUrheber) };
  let felder, betroffene;
  if (zielart.muster) {
    felder = musterFelder(spiel, zielart.muster, { ursprung, zielpunkt, quelleId: akteur.id });
    betroffene = entitaetenAufFeldern(spiel, felder, trefferoptionen);
  } else if (bahn) {
    felder = bahn.felder;
    betroffene = bahn.getroffene.map((id) => zustand.entitaeten[id]);
  } else {
    felder = [zielpunkt];
    betroffene = entitaetenAufFeldern(spiel, felder, trefferoptionen);
  }
  if (akteur.id === zustand.spielerinId) {
    betroffene = betroffene.filter((entitaet) => istSichtbar(zustand, entitaet.position.x, entitaet.position.y));
  }
  return { ok: true, ursprung, zielpunkt, zielId, bahn, felder, betroffene: betroffene.map((entitaet) => entitaet.id) };
}
