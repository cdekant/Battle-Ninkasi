// Laufen (Umschalt plus Richtung): Ninkasi geht geradeaus, bis etwas Bemerkenswertes passiert.
// Wie die Reise ohne Timer und ohne DOM, jeder Schritt ist ein gewöhnlicher Befehl "bewegen"; die Logik kennt kein Laufen.
// Ablauf: { richtung: { dx, dy }, lage, schrittzahl, bemerkt }
//   bemerkt: Schlüssel der bemerkenswerten Nachbarfelder nach dem letzten Schritt; neu hinzukommende halten an
// Haltegründe: die der Reise (einstellungen.reiseHalt, also auch ein neuer Feind), ein Hindernis voraus, ein Wesen
// voraus, eine bekannte Falle oder Gefahr voraus, und ein neues Nachbarfeld mit Tür, Treppe oder Gegenstand.
// Das Halten an Abzweigungen in Gängen (wie DCSS) kommt später, siehe docs/Systemausbau.md.

import { gesteuerteEntitaet, entitaetenAuf, istWesen } from "../kern/zustand.js";
import { feldBekannt, feldIndex, betretbar, bekanntesGelaendeAuf } from "../welt/karte.js";
import { istSichtbar } from "../systeme/sicht.js";
import { erinnerteDingeAuf } from "../systeme/erinnerung.js";
import { wahrgenommeneFeinde, lageErfassen } from "../systeme/gefahr.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { fallenMeiden } from "../systeme/fallen.js";
import { gefahrenMeiden, meidenZusammen } from "../systeme/schichten.js";
import { unterwegsPruefen } from "./reise.js";

const NACHBARN = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Ein bekanntes Feld ist bemerkenswert, wenn dort nach Ninkasis Wissen eine Tür, eine Treppe oder ein aufhebbarer
// Gegenstand ist (außer Sicht: erinnert, systeme/erinnerung.js)
function bemerkenswert(spiel, x, y) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  if (!feldBekannt(ebene, x, y)) return false;
  const gelaende = bekanntesGelaendeAuf(spiel, x, y);
  if (gelaende?.tuer || gelaende?.treppe) return true;
  if (!istSichtbar(zustand, x, y)) return erinnerteDingeAuf(ebene, feldIndex(ebene, x, y)).gegenstaende.length > 0;
  return entitaetenAuf(zustand, x, y).some((entitaet) => entitaet.aufhebbar);
}

// Schlüssel der bemerkenswerten Nachbarfelder Ninkasis
export function bemerkenswerteNachbarn(spiel) {
  const { x, y } = gesteuerteEntitaet(spiel.zustand).position;
  return NACHBARN.filter(([dx, dy]) => bemerkenswert(spiel, x + dx, y + dy)).map(([dx, dy]) => `${x + dx},${y + dy}`);
}

// Gibt { ablauf } oder { grund } zurück; grund: "vorbei" | "feinde_in_sicht" | "versperrt"
export function laufenBeginnen(spiel, richtung, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { grund: "vorbei" };
  if (!einstellungen.reiseTrotzFeinden && wahrgenommeneFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  const gesteuerte = gesteuerteEntitaet(zustand);
  const erstesFeld = { x: gesteuerte.position.x + richtung.dx, y: gesteuerte.position.y + richtung.dy };
  if (!betretbar(spiel, gesteuerte, erstesFeld)) return { grund: "versperrt" };
  return { ablauf: { richtung: { dx: richtung.dx, dy: richtung.dy }, lage: lageErfassen(spiel), schrittzahl: 0, bemerkt: bemerkenswerteNachbarn(spiel) } };
}

// Gibt { befehl } oder { halt } zurück; halt: "vorbei", "handlungsunfaehig", "hindernis", "versperrt", "gefahr_voraus",
// "bemerkenswert", "gegenstand" oder eine Gefahrenprüfung
export function naechsterLaufschritt(spiel, ablauf, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { halt: "vorbei" };
  const gesteuerte = gesteuerteEntitaet(zustand);
  if (istHandlungsunfaehig(spiel, gesteuerte)) return { halt: "handlungsunfaehig" };
  const halt = unterwegsPruefen(spiel, ablauf, einstellungen.reiseHalt);
  if (halt) return { halt };
  if (ablauf.schrittzahl > 0) {
    const jetzt = bemerkenswerteNachbarn(spiel);
    const neu = jetzt.some((schluessel) => !ablauf.bemerkt.includes(schluessel));
    ablauf.bemerkt = jetzt;
    if (neu) return { halt: "bemerkenswert" };
  }
  const naechstesFeld = { x: gesteuerte.position.x + ablauf.richtung.dx, y: gesteuerte.position.y + ablauf.richtung.dy };
  if (!betretbar(spiel, gesteuerte, naechstesFeld)) return { halt: "hindernis" };
  if (entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).some(istWesen)) return { halt: "versperrt" };
  const meiden = meidenZusammen(fallenMeiden(spiel, { nurBekannte: true }), gefahrenMeiden(spiel));
  if (meiden?.(naechstesFeld.x, naechstesFeld.y)) return { halt: "gefahr_voraus" };
  ablauf.schrittzahl++;
  return { befehl: { art: "bewegen", dx: ablauf.richtung.dx, dy: ablauf.richtung.dy } };
}
