// Reise: Ninkasi geht Schritt für Schritt zu einem Zielfeld.
// Kern ohne Timer und ohne DOM, damit Browser und Bots ihn gleich benutzen.
// Jeder Schritt ist ein gewöhnlicher Befehl "bewegen"; die Logik kennt keine Reise.
// Reise: { ziel: { x, y }, lage, schrittzahl }
// Später: automatisches Erkunden ist dieselbe Reise mit anderer Zielwahl.

import { spielerin, entitaetenAuf } from "../kern/zustand.js";
import { feldIndex, passierbar } from "../welt/karte.js";
import { naechstesWegfeld } from "../welt/wege.js";
import { lageErfassen, sichtbareFeinde, gefahrPruefen } from "../systeme/gefahr.js";
import { istWesen } from "../systeme/kampf.js";

const WEG_OPTIONEN = { nurErkundet: true };

// Gibt { reise } oder { grund } zurück; grund: "kein_weg" | "feinde_in_sicht" | "vorbei"
export function reiseBeginnen(spiel, ziel, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { grund: "vorbei" };
  const ebene = zustand.ebene;
  if (!ebene.erkundet[feldIndex(ebene, ziel.x, ziel.y)] || !passierbar(spiel, ziel.x, ziel.y)) return { grund: "kein_weg" };
  if (!einstellungen.reiseTrotzFeinden && sichtbareFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  if (!naechstesWegfeld(spiel, spielerin(zustand).position, ziel, WEG_OPTIONEN)) return { grund: "kein_weg" };
  return { reise: { ziel: { x: ziel.x, y: ziel.y }, lage: lageErfassen(spiel), schrittzahl: 0 } };
}

// Gibt { befehl } oder { halt } zurück; halt: "angekommen", "vorbei", "kein_weg", "versperrt",
// "gegenstand" oder der Name einer Gefahrenprüfung
export function naechsterReiseschritt(spiel, reise, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { halt: "vorbei" };
  const position = spielerin(zustand).position;
  if (position.x === reise.ziel.x && position.y === reise.ziel.y) return { halt: "angekommen" };

  if (reise.schrittzahl > 0) {
    const lageJetzt = lageErfassen(spiel);
    const gefahr = gefahrPruefen(reise.lage, lageJetzt, einstellungen.reiseHalt);
    if (gefahr) return { halt: gefahr };
    reise.lage = lageJetzt;
    const gegenstandHier = entitaetenAuf(zustand, position.x, position.y).some((entitaet) => entitaet.aufhebbar);
    if (einstellungen.reiseHalt.includes("gegenstand") && gegenstandHier) return { halt: "gegenstand" };
  }

  const naechstesFeld = naechstesWegfeld(spiel, position, reise.ziel, WEG_OPTIONEN);
  if (!naechstesFeld) return { halt: "kein_weg" };
  if (entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).some(istWesen)) return { halt: "versperrt" };
  reise.schrittzahl++;
  return { befehl: { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y } };
}
