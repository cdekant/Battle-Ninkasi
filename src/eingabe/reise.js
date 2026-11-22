// Reise: Ninkasi geht Schritt für Schritt zu einem Zielfeld.
// Kern ohne Timer und ohne DOM, damit Browser und Bots ihn gleich benutzen.
// Jeder Schritt ist ein gewöhnlicher Befehl "bewegen"; die Logik kennt keine Reise.
// Reise: { ziel: { x, y }, lage, schrittzahl }
// Später: automatisches Erkunden ist dieselbe Reise mit anderer Zielwahl.

import { gesteuerteEntitaet, entitaetenAuf, istWesen, bewegungVon } from "../kern/zustand.js";
import { feldIndex, betretbar } from "../welt/karte.js";
import { naechstesWegfeld } from "../welt/wege.js";
import { lageErfassen, sichtbareFeinde, gefahrPruefen } from "../systeme/gefahr.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { fallenMeiden } from "../systeme/fallen.js";
import { gefahrenMeiden, meidenZusammen } from "../systeme/schichten.js";

// Wege nur über Erkundetes, nach Ninkasis wirksamer Bewegungsart
const wegOptionen = (spiel) => ({ nurErkundet: true, bewegung: bewegungVon(gesteuerteEntitaet(spiel.zustand)), meiden: meidenZusammen(fallenMeiden(spiel, { nurBekannte: true }), gefahrenMeiden(spiel)) });

// Gibt { reise } oder { grund } zurück; grund: "kein_weg" | "feinde_in_sicht" | "vorbei"
export function reiseBeginnen(spiel, ziel, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { grund: "vorbei" };
  const ebene = zustand.ebene;
  if (!ebene.erkundet[feldIndex(ebene, ziel.x, ziel.y)] || !betretbar(spiel, gesteuerteEntitaet(zustand), ziel)) return { grund: "kein_weg" };
  if (!einstellungen.reiseTrotzFeinden && sichtbareFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  if (!naechstesWegfeld(spiel, gesteuerteEntitaet(zustand).position, ziel, wegOptionen(spiel))) return { grund: "kein_weg" };
  return { reise: { ziel: { x: ziel.x, y: ziel.y }, lage: lageErfassen(spiel), schrittzahl: 0 } };
}

// Prüfung nach jedem Schritt eines Ablaufs (Reise, Erkunden, Rasten); ablauf: { lage, schrittzahl }.
// Gibt den Haltegrund zurück (Gefahrenprüfung oder "gegenstand", je nach haltgruende) oder null und merkt die Lage.
export function unterwegsPruefen(spiel, ablauf, haltgruende) {
  if (ablauf.schrittzahl === 0) return null;
  const lageJetzt = lageErfassen(spiel);
  const gefahr = gefahrPruefen(ablauf.lage, lageJetzt, haltgruende);
  if (gefahr) return gefahr;
  ablauf.lage = lageJetzt;
  const position = gesteuerteEntitaet(spiel.zustand).position;
  const gegenstandHier = entitaetenAuf(spiel.zustand, position.x, position.y).some((entitaet) => entitaet.aufhebbar);
  if (haltgruende.includes("gegenstand") && gegenstandHier) return "gegenstand";
  return null;
}

// Gibt { befehl } oder { halt } zurück; halt: "angekommen", "vorbei", "kein_weg", "versperrt", "handlungsunfaehig",
// "gegenstand" oder der Name einer Gefahrenprüfung
export function naechsterReiseschritt(spiel, reise, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { halt: "vorbei" };
  if (istHandlungsunfaehig(spiel, gesteuerteEntitaet(zustand))) return { halt: "handlungsunfaehig" };
  const position = gesteuerteEntitaet(zustand).position;
  if (position.x === reise.ziel.x && position.y === reise.ziel.y) return { halt: "angekommen" };

  const halt = unterwegsPruefen(spiel, reise, einstellungen.reiseHalt);
  if (halt) return { halt };

  const naechstesFeld = naechstesWegfeld(spiel, position, reise.ziel, wegOptionen(spiel));
  if (!naechstesFeld) return { halt: "kein_weg" };
  if (entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).some(istWesen)) return { halt: "versperrt" };
  reise.schrittzahl++;
  return { befehl: { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y } };
}
