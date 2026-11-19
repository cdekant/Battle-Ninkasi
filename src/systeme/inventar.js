// Befehle "aufheben" und "trinken".
// Befehle: { art: "aufheben" }, { art: "trinken", gegenstandId: id }
// Getragene Gegenstände haben keine Position, sondern getragenVon; die Trägerin führt sie in inventar.

import { anmelden } from "../kern/register.js";
import { entitaetenAuf, entitaetMitId, entitaetEntfernen, positionSetzen, ausDemInventarNehmen } from "../kern/zustand.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";

function aufhebbarHier(spiel, akteur) {
  return entitaetenAuf(spiel.zustand, akteur.position.x, akteur.position.y).find((entitaet) => entitaet.aufhebbar) || null;
}

anmelden("befehle", "aufheben", {
  pruefen(spiel, akteur) {
    if (!akteur.inventar) return "kein_inventar";
    return aufhebbarHier(spiel, akteur) ? null : "nichts_da";
  },
  ausfuehren(spiel, akteur) {
    const gegenstand = aufhebbarHier(spiel, akteur);
    positionSetzen(spiel.zustand, gegenstand, null);
    gegenstand.getragenVon = akteur.id;
    akteur.inventar.push(gegenstand.id);
    melden(spiel, "aufgehoben", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    return "aufheben";
  },
});

anmelden("befehle", "trinken", {
  pruefen(spiel, akteur, befehl) {
    const imInventar = akteur.inventar && Number.isInteger(befehl.gegenstandId) && akteur.inventar.includes(befehl.gegenstandId);
    if (!imInventar) return "nichts_zu_trinken";
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    return gegenstand && gegenstand.trinkbar ? null : "nicht_trinkbar";
  },
  ausfuehren(spiel, akteur, befehl) {
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    ausDemInventarNehmen(akteur, gegenstand.id);
    melden(spiel, "getrunken", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: gegenstand.id, art: "trinken", kettentiefe: 0 });
    entitaetEntfernen(spiel.zustand, gegenstand.id);
    effektAnwenden(spiel, gegenstand.trinkbar.effekt, { quelleId: akteur.id, zielId: akteur.id, ursache: "trinken", mittel: { art: "gegenstand", name: gegenstand.typ } });
    return "trinken";
  },
});

// Erster trinkbarer Gegenstand im Inventar (Hilfe für Eingabe und Bots, nur lesend)
export function erstesGetraenk(zustand, akteur) {
  for (const id of akteur.inventar || []) {
    const gegenstand = entitaetMitId(zustand, id);
    if (gegenstand && gegenstand.trinkbar) return gegenstand.id;
  }
  return null;
}
