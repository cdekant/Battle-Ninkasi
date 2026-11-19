// Befehle "bewegen" (mit Angriff durch Hineinlaufen) und "warten".
// Befehle: { art: "bewegen", dx: -1..1, dy: -1..1, angreifen? }, { art: "warten" }
// Hineinlaufen greift Feinde an; mit angreifen: true jedes Wesen (Rausch, Verwirrung, gezielter Angriff auf Freunde).

import { anmelden } from "../kern/register.js";
import { entitaetenAuf } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { passierbar } from "../welt/karte.js";
import { istWesen, feindlich, nahkampf, kannAngreifen } from "./kampf.js";
import { sichtfeldAktualisieren } from "./sicht.js";

function zielfeld(akteur, befehl) {
  return { x: akteur.position.x + befehl.dx, y: akteur.position.y + befehl.dy };
}

function wesenAuf(spiel, x, y) {
  return entitaetenAuf(spiel.zustand, x, y).find(istWesen) || null;
}

const istEinzelschritt = (versatz) => Number.isInteger(versatz) && versatz >= -1 && versatz <= 1;

anmelden("befehle", "bewegen", {
  pruefen(spiel, akteur, befehl) {
    if (!istEinzelschritt(befehl.dx) || !istEinzelschritt(befehl.dy) || (befehl.dx === 0 && befehl.dy === 0)) return "ungueltig";
    if (befehl.angreifen !== undefined && typeof befehl.angreifen !== "boolean") return "ungueltig";
    const { x, y } = zielfeld(akteur, befehl);
    const anderesWesen = wesenAuf(spiel, x, y);
    if (anderesWesen) return kannAngreifen(spiel, akteur) && (feindlich(akteur, anderesWesen) || befehl.angreifen === true) ? null : "besetzt";
    if (!passierbar(spiel, x, y)) return "wand";
    return null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const { x, y } = zielfeld(akteur, befehl);
    const anderesWesen = wesenAuf(spiel, x, y);
    if (anderesWesen) {
      return { aktion: "nahkampf", grundkosten: nahkampf(spiel, akteur, anderesWesen) };
    }
    akteur.position = { x, y };
    if (akteur.id === spiel.zustand.spielerinId) {
      sichtfeldAktualisieren(spiel);
      for (const gegenstand of entitaetenAuf(spiel.zustand, x, y)) {
        if (gegenstand.aufhebbar) melden(spiel, "liegt_hier", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
      }
    }
    return "bewegen";
  },
});

anmelden("befehle", "warten", {
  pruefen() { return null; },
  ausfuehren() { return "warten"; },
});
