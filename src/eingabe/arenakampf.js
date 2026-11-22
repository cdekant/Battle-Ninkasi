// Automatischer Kampf in der Arena (siehe docs/Bedienung.md, Maus, Reise, Laufen, Rasten und Erkunden): ein Ablauf wie
// Reise oder Erkunden, Kern ohne Timer und DOM; jeder Schritt ist der Befehl der Taktik (ki/taktik.js) für Ninkasi.
// Die Taktik steht in der Aufstellung der Arena (optionen.arena.taktik, gewählt in eingabe/arenawahl.js).
// Ablauf: { taktik }; hält, wenn der Lauf vorbei ist; jede Taste bricht ihn ab wie jeden Ablauf (src/main.js).

import { istArena } from "../systeme/arena.js";
import { taktikbefehl } from "../ki/taktik.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { gesteuerteEntitaet } from "../kern/zustand.js";

// Taktik der Arena eines Spiels: die der Aufstellung, sonst die erste aus den Daten
export function arenataktik(spiel) {
  return spiel.optionen.arena?.taktik ?? Object.keys(spiel.daten.taktiken)[0];
}

// Gibt { ablauf } oder { grund } zurück; grund: "keine_arena" | "vorbei"
export function arenakampfBeginnen(spiel) {
  if (!istArena(spiel)) return { grund: "keine_arena" };
  if (spiel.zustand.vorbei) return { grund: "vorbei" };
  return { ablauf: { taktik: arenataktik(spiel) } };
}

// Gibt { befehl } oder { halt } zurück; halt: "vorbei"; handlungsunfähig wartet Ninkasi (die Zeit läuft weiter)
export function naechsterArenaschritt(spiel, ablauf) {
  if (spiel.zustand.vorbei) return { halt: "vorbei" };
  if (istHandlungsunfaehig(spiel, gesteuerteEntitaet(spiel.zustand))) return { befehl: { art: "warten" } };
  return { befehl: taktikbefehl(spiel, spiel.daten.taktiken[ablauf.taktik]) };
}
