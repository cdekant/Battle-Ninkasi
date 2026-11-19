// Auto-Erkunden: Ninkasi geht Schritt für Schritt zum nächsten erkundeten Feld am Rand des Unbekannten
// (Breitensuche über erkundete Felder), bis nichts mehr zu erkunden ist oder etwas sie aufhält.
// Wie die Reise, nur mit anderer Zielwahl; jeder Schritt ist ein gewöhnlicher Befehl "bewegen".
// Ablauf: { lage, schrittzahl }

import { spielerin, entitaetenAuf } from "../kern/zustand.js";
import { naechstesWegfeld, naechstesFeldMit, amRandDesErkundeten } from "../welt/wege.js";
import { lageErfassen, sichtbareFeinde } from "../systeme/gefahr.js";
import { istWesen } from "../systeme/kampf.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { unterwegsPruefen } from "./reise.js";

const WEG_OPTIONEN = { nurErkundet: true };

function naechstesRandfeld(spiel) {
  const position = spielerin(spiel.zustand).position;
  return naechstesFeldMit(spiel, position, (x, y) => amRandDesErkundeten(spiel, x, y), WEG_OPTIONEN);
}

// Gibt { ablauf } oder { grund } zurück; grund: "vorbei" | "feinde_in_sicht" | "alles_erkundet"
export function erkundenBeginnen(spiel, einstellungen) {
  if (spiel.zustand.vorbei) return { grund: "vorbei" };
  if (!einstellungen.reiseTrotzFeinden && sichtbareFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  if (!naechstesRandfeld(spiel)) return { grund: "alles_erkundet" };
  return { ablauf: { lage: lageErfassen(spiel), schrittzahl: 0 } };
}

// Gibt { befehl } oder { halt } zurück; halt: "alles_erkundet", "vorbei", "handlungsunfaehig", "versperrt", "kein_weg",
// "gegenstand" oder eine Gefahrenprüfung
export function naechsterErkundungsschritt(spiel, ablauf, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { halt: "vorbei" };
  if (istHandlungsunfaehig(spiel, spielerin(zustand))) return { halt: "handlungsunfaehig" };
  const halt = unterwegsPruefen(spiel, ablauf, einstellungen.reiseHalt);
  if (halt) return { halt };
  const ziel = naechstesRandfeld(spiel);
  if (!ziel) return { halt: "alles_erkundet" };
  const position = spielerin(zustand).position;
  const naechstesFeld = naechstesWegfeld(spiel, position, ziel, WEG_OPTIONEN);
  if (!naechstesFeld) return { halt: "kein_weg" };
  if (entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).some(istWesen)) return { halt: "versperrt" };
  ablauf.schrittzahl++;
  return { befehl: { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y } };
}
