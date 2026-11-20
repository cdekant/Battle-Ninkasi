// Befehl "werfen" (siehe docs/Architektur.md, Bewegung): einen getragenen Gegenstand entlang der Flugbahn werfen.
// Befehl: { art: "werfen", gegenstandId, ziel: { x, y } | { id } }
// Die Bahn ist die eines Geschosses (zielAufloesen mit Zielart geschoss): sie endet am ersten Wesen oder vor der Wand.
// Reichweite: wurf.reichweite am Gegenstand, sonst regeln.werfen.reichweite. Zeitkosten: aktionen.werfen.
// Daten am Gegenstand: wurf: { effekt?, reichweite? }
//   mit effekt zerbricht der Gegenstand am Aufschlag (Meldung "zerbrochen") und der Effekt wirkt dort: Ziel ist das
//   getroffene Wesen, sonst wirkt er nur aufs Feld (Ursache "wurf"); ob er treffen muss, sagen seine Daten (trefferwurf)
//   ohne effekt landet der Gegenstand auf dem Aufschlagfeld (Meldung "gelandet")
// Am Aufschlag entsteht Lärm (regeln.wahrnehmung.laermWurf): Wache gehen ihm nach, so taugt ein Wurf als Ablenkung.

import { anmelden } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, positionSetzen } from "../kern/zustand.js";
import { einenAbnehmen } from "./inventar.js";
import { fluchHindert } from "./ausruestung.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { zielAufloesen } from "./zielauswahl.js";
import { laermMachen } from "./wahrnehmung.js";

function geworfenerGegenstand(spiel, akteur, befehl) {
  if (!Number.isInteger(befehl.gegenstandId) || !(akteur.inventar || []).includes(befehl.gegenstandId)) return null;
  return entitaetMitId(spiel.zustand, befehl.gegenstandId);
}

export function wurfbahn(spiel, akteur, gegenstand, zielangabe) {
  const reichweite = gegenstand.wurf?.reichweite ?? spiel.daten.regeln.werfen.reichweite;
  return zielAufloesen(spiel, akteur, { art: "geschoss", reichweite }, zielangabe);
}

anmelden("befehle", "werfen", {
  pruefen(spiel, akteur, befehl) {
    const gegenstand = geworfenerGegenstand(spiel, akteur, befehl);
    if (!gegenstand) return "nichts_zu_werfen";
    if (fluchHindert(spiel, akteur, gegenstand.id)) return "verflucht";
    const aufloesung = wurfbahn(spiel, akteur, gegenstand, befehl.ziel);
    return aufloesung.ok ? null : aufloesung.grund;
  },
  ausfuehren(spiel, akteur, befehl) {
    const imGepaeck = geworfenerGegenstand(spiel, akteur, befehl);
    const { bahn } = wurfbahn(spiel, akteur, imGepaeck, befehl.ziel);
    // vom Stapel einer, sonst der Gegenstand selbst; auch eine angelegte Waffe lässt sich werfen
    const gegenstand = einenAbnehmen(spiel, akteur, imGepaeck);
    const aufschlag = { x: bahn.aufschlag.x, y: bahn.aufschlag.y };
    const getroffenId = bahn.getroffene[0] ?? null;
    melden(spiel, "geworfen", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: gegenstand.id, art: "werfen", kettentiefe: 0 });
    melden(spiel, "geschoss", { quelle: bezugAuf(akteur), bahn: bahn.felder, aufschlag });
    if (gegenstand.wurf?.effekt) {
      // erst entfernen, damit der Gegenstand nicht von seiner eigenen Wirkung getroffen wird
      entitaetEntfernen(spiel.zustand, gegenstand.id);
      melden(spiel, "zerbrochen", { was: bezugAuf(gegenstand), feld: aufschlag });
      effektAnwenden(spiel, gegenstand.wurf.effekt, {
        quelleId: akteur.id, zielId: getroffenId, ursprung: aufschlag, zielfeld: aufschlag,
        ursache: "wurf", mittel: { art: "gegenstand", name: gegenstand.typ },
      });
    } else {
      positionSetzen(spiel.zustand, gegenstand, aufschlag);
      melden(spiel, "gelandet", { was: bezugAuf(gegenstand), feld: aufschlag });
    }
    laermMachen(spiel, aufschlag, spiel.daten.regeln.wahrnehmung.laermWurf, akteur.id, "aufschlag");
    return "werfen";
  },
});
