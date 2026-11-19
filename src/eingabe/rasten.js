// Rasten bis voll: Ninkasi wartet Schritt für Schritt, bis die Vorräte aus einstellungen.rastenBis voll sind.
// Wie die Reise ohne Timer und ohne DOM, jeder Schritt ist ein gewöhnlicher Befehl "warten"; die Logik kennt kein Rasten.
// Ablauf: { lage, schrittzahl }

import { spielerin } from "../kern/zustand.js";
import { hoechstwert, hatWert } from "../kern/werte.js";
import { lageErfassen, sichtbareFeinde } from "../systeme/gefahr.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { unterwegsPruefen } from "./reise.js";

function vollGerastet(spiel, einstellungen) {
  const ninkasi = spielerin(spiel.zustand);
  return einstellungen.rastenBis.every((wertName) => !hatWert(ninkasi, wertName) || ninkasi.werte[wertName].aktuell >= hoechstwert(spiel, ninkasi, wertName));
}

// Gibt { ablauf } oder { grund } zurück; grund: "vorbei" | "feinde_in_sicht" | "schon_voll"
export function rastenBeginnen(spiel, einstellungen) {
  if (spiel.zustand.vorbei) return { grund: "vorbei" };
  if (sichtbareFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  if (vollGerastet(spiel, einstellungen)) return { grund: "schon_voll" };
  return { ablauf: { lage: lageErfassen(spiel), schrittzahl: 0 } };
}

// Gibt { befehl } oder { halt } zurück; halt: "voll", "vorbei", "handlungsunfaehig", "zu_lang" oder eine Gefahrenprüfung
export function naechsterRastschritt(spiel, ablauf, einstellungen) {
  if (spiel.zustand.vorbei) return { halt: "vorbei" };
  if (istHandlungsunfaehig(spiel, spielerin(spiel.zustand))) return { halt: "handlungsunfaehig" };
  const halt = unterwegsPruefen(spiel, ablauf, einstellungen.rastenHalt);
  if (halt) return { halt };
  if (vollGerastet(spiel, einstellungen)) return { halt: "voll" };
  if (ablauf.schrittzahl >= einstellungen.rastenHoechstens) return { halt: "zu_lang" };
  ablauf.schrittzahl++;
  return { befehl: { art: "warten" } };
}
