// Fallen (siehe docs/Welt.md, Gelände): Entitäten auf einem Feld mit der Komponente falle.
// Daten (daten/fallen.js): { text, falle: { tarnung, effekt, ausloesenFuer? }, verborgen? }
//   tarnung:       Punkte gegen das Entdecken, die Qualität der Falle (z.B. 20 plump, 80 meisterhaft)
//   effekt:        wirkt auf das Wesen, das hineintritt (Quelle die Falle, Ursache "falle"), eine Kettenstufe tiefer
//   ausloesenFuer: Bewegungsarten, die sie auslösen (Vorgabe ["laufend"]; Fliegende und Schwebende gehen darüber)
//   verborgen:     Vorgabe true; die Anzeige zeigt sie erst, wenn sie entdeckt ist (entdeckt: true an der Falle)
// Auslösen am Haken betritt_feld; die Falle gilt danach als entdeckt (Meldung "falle_ausgeloest").
// Entdecken am Haken zug_ende, nur für Ninkasi: für jede verborgene Falle, die sie sieht und die höchstens
// regeln.fallen.reichweite entfernt ist, nach ID, ein Wurf mit der Chance
//   E / (E + tarnung), E = entdecken × 2 / (1 + Abstand)   (daneben voll, auf 3 Felder die Hälfte)
// entdecken ist ein Kampfwert (Vorgabe regeln.fallen.entdeckenVorgabe), Skills ändern ihn über Modifikatoren.
// Wesen mit KI meiden alle Fallen (sie kennen ihre Ebene), Ninkasi meidet auf Reisen die entdeckten.

import { anmelden } from "../kern/register.js";
import { modifiziert } from "../kern/werte.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { wurfAnteil } from "../kern/wurf.js";
import { entitaetenAuf, bewegungVon, gesteuerteEntitaet } from "../kern/zustand.js";
import { fallenIds } from "../kern/raumindex.js";
import { abstand } from "../welt/karte.js";
import { istSichtbar } from "./sicht.js";

export function istBekannt(falle) {
  return falle.verborgen === false || Boolean(falle.entdeckt);
}

// Prüffunktion für die Wegfindung (welt/wege.js meiden): Felder mit Fallen, auf Wunsch nur bekannten; null ohne Fallen
export function fallenMeiden(spiel, { nurBekannte = false } = {}) {
  const felder = new Set();
  for (const id of fallenIds(spiel.zustand)) {
    const falle = spiel.zustand.entitaeten[id];
    if (!nurBekannte || istBekannt(falle)) felder.add(falle.position.y * 65536 + falle.position.x);
  }
  return felder.size ? (x, y) => felder.has(y * 65536 + x) : null;
}

export function entdeckenVon(spiel, wesen) {
  const vorgabe = wesen.kampfwerte?.entdecken ?? spiel.daten.regeln.fallen.entdeckenVorgabe;
  return Math.max(0, modifiziert(spiel, wesen, "entdecken", vorgabe));
}

// Chance als Bruch { zaehler, nenner }: E / (E + tarnung) mit E = entdecken × 2 / (1 + Abstand), ganzzahlig erweitert
export function entdeckenChance(entdecken, tarnung, entfernung) {
  return { zaehler: 2 * entdecken, nenner: 2 * entdecken + tarnung * (1 + entfernung) };
}

anmelden("haken", "betritt_feld", (spiel, kontext) => {
  const entitaeten = spiel.zustand.entitaeten;
  const wesen = entitaeten[kontext.zielId];
  if (!wesen) return;
  const kettentiefe = kontext.kettentiefe ?? 0;
  if (kettentiefe >= spiel.daten.regeln.ausloeser.hoechsteKettentiefe) return;
  for (const falle of entitaetenAuf(spiel.zustand, kontext.position.x, kontext.position.y)) {
    if (!falle.falle || !entitaeten[falle.id] || !entitaeten[wesen.id]) continue;
    if (!(falle.falle.ausloesenFuer ?? ["laufend"]).includes(bewegungVon(wesen))) continue;
    falle.entdeckt = true;
    melden(spiel, "falle_ausgeloest", { wer: bezugAuf(wesen), was: bezugAuf(falle) });
    const feld = { x: kontext.position.x, y: kontext.position.y };
    effektAnwenden(spiel, falle.falle.effekt, {
      quelleId: falle.id, zielId: wesen.id, ursprung: feld, zielfeld: feld,
      ursache: "falle", mittel: { art: "falle", name: falle.typ }, kettentiefe: kettentiefe + 1,
    });
  }
});

anmelden("haken", "zug_ende", (spiel, kontext) => {
  const zustand = spiel.zustand;
  if (kontext.akteurId !== gesteuerteEntitaet(zustand)?.id || zustand.vorbei) return;
  const gesteuerte = gesteuerteEntitaet(zustand);
  if (!gesteuerte?.position) return;
  const reichweite = spiel.daten.regeln.fallen.reichweite;
  let entdecken = null;
  for (const id of fallenIds(zustand)) {
    const falle = zustand.entitaeten[id];
    if (istBekannt(falle)) continue;
    const entfernung = abstand(gesteuerte.position, falle.position);
    if (entfernung > reichweite || !istSichtbar(zustand, falle.position.x, falle.position.y)) continue;
    entdecken ??= entdeckenVon(spiel, gesteuerte);
    const { zaehler, nenner } = entdeckenChance(entdecken, falle.falle.tarnung, entfernung);
    if (!wurfAnteil(spiel, "falle_entdecken", zaehler, nenner)) continue;
    falle.entdeckt = true;
    melden(spiel, "falle_entdeckt", { wer: bezugAuf(gesteuerte), was: bezugAuf(falle) });
  }
});
