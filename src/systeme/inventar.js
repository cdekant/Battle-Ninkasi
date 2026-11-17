// Befehle "aufheben" und "trinken".
// Befehle: { art: "aufheben" }, { art: "trinken", item: id }
// Getragene Gegenstände haben keine Position, sondern getragenVon; die Trägerin führt sie in inventar.

import { anmelden } from "../kern/register.js";
import { an, holen, entfernen } from "../kern/zustand.js";
import { anwenden } from "../kern/effekte.js";
import { melden, bezug } from "../kern/ereignisse.js";

function aufhebbarHier(spiel, akteur) {
  return an(spiel.zustand, akteur.position.x, akteur.position.y).find((e) => e.aufhebbar) || null;
}

anmelden("befehle", "aufheben", {
  pruefen(spiel, akteur) {
    if (!akteur.inventar) return "kein_inventar";
    return aufhebbarHier(spiel, akteur) ? null : "nichts_da";
  },
  ausfuehren(spiel, akteur) {
    const g = aufhebbarHier(spiel, akteur);
    delete g.position;
    g.getragenVon = akteur.id;
    akteur.inventar.push(g.id);
    melden(spiel, "aufgehoben", { wer: bezug(akteur), was: bezug(g) });
    return "aufheben";
  },
});

anmelden("befehle", "trinken", {
  pruefen(spiel, akteur, b) {
    if (!akteur.inventar || !Number.isInteger(b.item) || !akteur.inventar.includes(b.item)) return "nichts_zu_trinken";
    const g = holen(spiel.zustand, b.item);
    return g && g.trinkbar ? null : "nicht_trinkbar";
  },
  ausfuehren(spiel, akteur, b) {
    const g = holen(spiel.zustand, b.item);
    akteur.inventar = akteur.inventar.filter((id) => id !== g.id);
    melden(spiel, "getrunken", { wer: bezug(akteur), was: bezug(g) });
    entfernen(spiel.zustand, g.id);
    anwenden(spiel, g.trinkbar.effekt, { quelle: akteur.id, ziel: akteur.id, art: "trinken" });
    return "trinken";
  },
});

// Erster trinkbarer Gegenstand im Inventar (Hilfe für Eingabe und Bots, nur lesend)
export function erstesGetraenk(zustand, akteur) {
  for (const id of akteur.inventar || []) {
    const g = holen(zustand, id);
    if (g && g.trinkbar) return g.id;
  }
  return null;
}
