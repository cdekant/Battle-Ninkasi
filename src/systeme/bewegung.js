// Befehle "bewegen" (mit Angriff durch Hineinlaufen) und "warten".
// Befehle: { art: "bewegen", dx: -1..1, dy: -1..1 }, { art: "warten" }

import { anmelden } from "../kern/register.js";
import { an } from "../kern/zustand.js";
import { melden, bezug } from "../kern/ereignisse.js";
import { passierbar } from "../welt/karte.js";
import { istWesen, feindlich, nahkampf } from "./kampf.js";
import { aktualisieren as sichtAktualisieren } from "./sicht.js";

function ziel(akteur, b) {
  return { x: akteur.position.x + b.dx, y: akteur.position.y + b.dy };
}

function wesenAn(spiel, x, y) {
  return an(spiel.zustand, x, y).find(istWesen) || null;
}

const schritt = (n) => Number.isInteger(n) && n >= -1 && n <= 1;

anmelden("befehle", "bewegen", {
  pruefen(spiel, akteur, b) {
    if (!schritt(b.dx) || !schritt(b.dy) || (b.dx === 0 && b.dy === 0)) return "ungueltig";
    const { x, y } = ziel(akteur, b);
    const anderes = wesenAn(spiel, x, y);
    if (anderes) return feindlich(akteur, anderes) && akteur.angriff ? null : "besetzt";
    if (!passierbar(spiel, x, y)) return "wand";
    return null;
  },
  ausfuehren(spiel, akteur, b) {
    const { x, y } = ziel(akteur, b);
    const anderes = wesenAn(spiel, x, y);
    if (anderes) {
      nahkampf(spiel, akteur, anderes);
      return "nahkampf";
    }
    akteur.position = { x, y };
    if (akteur.id === spiel.zustand.spielerId) {
      sichtAktualisieren(spiel);
      for (const g of an(spiel.zustand, x, y)) {
        if (g.aufhebbar) melden(spiel, "liegt_hier", { wer: bezug(akteur), was: bezug(g) });
      }
    }
    return "bewegen";
  },
});

anmelden("befehle", "warten", {
  pruefen() { return null; },
  ausfuehren() { return "warten"; },
});
