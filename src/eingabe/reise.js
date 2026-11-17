// Reise: Ninkasi geht Schritt für Schritt zu einem Zielfeld.
// Kern ohne Timer und ohne DOM, damit Browser und Bots ihn gleich benutzen.
// Jeder Schritt ist ein gewöhnlicher Befehl "bewegen"; die Logik kennt keine Reise.
// Später: automatisches Erkunden ist dieselbe Reise mit anderer Zielwahl.

import { spieler, an } from "../kern/zustand.js";
import { index, passierbar } from "../welt/karte.js";
import { naechsterSchritt as wegSchritt } from "../welt/wege.js";
import { lage, sichtbareFeinde, pruefen } from "../systeme/gefahr.js";
import { istWesen } from "../systeme/kampf.js";

const WEG = { nurErkundet: true };

// Gibt { reise } oder { grund } zurück; grund: "kein_weg" | "feinde_in_sicht" | "vorbei"
export function reiseBeginnen(spiel, ziel, einstellungen) {
  const z = spiel.zustand;
  if (z.vorbei) return { grund: "vorbei" };
  const e = z.ebene;
  if (!e.erkundet[index(e, ziel.x, ziel.y)] || !passierbar(spiel, ziel.x, ziel.y)) return { grund: "kein_weg" };
  if (!einstellungen.reiseTrotzFeinden && sichtbareFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  if (!wegSchritt(spiel, spieler(z).position, ziel, WEG)) return { grund: "kein_weg" };
  return { reise: { ziel: { x: ziel.x, y: ziel.y }, lage: lage(spiel), schritte: 0 } };
}

// Gibt { befehl } oder { halt } zurück; halt: "angekommen", "vorbei", "kein_weg", "versperrt",
// "gegenstand" oder der Name einer Gefahrenprüfung
export function naechsterSchritt(spiel, reise, einstellungen) {
  const z = spiel.zustand;
  if (z.vorbei) return { halt: "vorbei" };
  const p = spieler(z);
  const pos = p.position;
  if (pos.x === reise.ziel.x && pos.y === reise.ziel.y) return { halt: "angekommen" };

  if (reise.schritte > 0) {
    const jetzt = lage(spiel);
    const gefahr = pruefen(reise.lage, jetzt, einstellungen.reiseHalt);
    if (gefahr) return { halt: gefahr };
    reise.lage = jetzt;
    if (einstellungen.reiseHalt.includes("gegenstand") && an(z, pos.x, pos.y).some((g) => g.aufhebbar)) return { halt: "gegenstand" };
  }

  const s = wegSchritt(spiel, pos, reise.ziel, WEG);
  if (!s) return { halt: "kein_weg" };
  if (an(z, s.x, s.y).some(istWesen)) return { halt: "versperrt" };
  reise.schritte++;
  return { befehl: { art: "bewegen", dx: s.x - pos.x, dy: s.y - pos.y } };
}
