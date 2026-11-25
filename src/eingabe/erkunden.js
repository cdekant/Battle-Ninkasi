// Auto-Erkunden: Ninkasi geht Schritt für Schritt zum nächsten bekannten Feld am Rand des nie Gesehenen
// (Breitensuche über bekannte Felder; ein kartiertes, ungesehenes Gebiet wird also auch erkundet), bis nichts mehr zu erkunden ist oder etwas sie aufhält.
// Wie die Reise, nur mit anderer Zielwahl; jeder Schritt ist ein gewöhnlicher Befehl "bewegen".
// Bekannte Fallen und Gefahren (Säure, CO2, Feuer) meidet es; liegt das Unerkundete nur noch hinter ihnen, hält es einmal
// mit "gefahr_im_weg". Wer danach wieder erkundet (trotzGefahr, src/main.js merkt sich den Halt), geht über sie hinweg.
// Ablauf: { lage, schrittzahl, trotzGefahr }

import { gesteuerteEntitaet, entitaetenAuf, istWesen, bewegungVon } from "../kern/zustand.js";
import { naechstesWegfeld, naechstesFeldMit, amRandDesErkundeten } from "../welt/wege.js";
import { lageErfassen, wahrgenommeneFeinde } from "../systeme/gefahr.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { unterwegsPruefen } from "./reise.js";
import { fallenMeiden } from "../systeme/fallen.js";
import { gefahrenMeiden, meidenZusammen } from "../systeme/schichten.js";

// Wege nur über Bekanntes und nach dem bekannten Gelände, nach der wirksamen Bewegungsart der gesteuerten Entität;
// ohneMeiden: auch über bekannte Fallen und Gefahren
function wegOptionen(spiel, ohneMeiden = false) {
  const optionen = { nurBekannt: true, bewegung: bewegungVon(gesteuerteEntitaet(spiel.zustand)) };
  if (!ohneMeiden) optionen.meiden = meidenZusammen(fallenMeiden(spiel, { nurBekannte: true }), gefahrenMeiden(spiel));
  return optionen;
}

function naechstesRandfeld(spiel, ohneMeiden = false) {
  const position = gesteuerteEntitaet(spiel.zustand).position;
  return naechstesFeldMit(spiel, position, (x, y) => amRandDesErkundeten(spiel, x, y), wegOptionen(spiel, ohneMeiden));
}

// Ziel des nächsten Schritts: { ziel, ohneMeiden } oder { grund }; das sichere Randfeld zuerst, sonst mit trotzGefahr
// eines hinter einer Gefahr; ohne trotzGefahr "gefahr_im_weg", wenn es so eins gibt, sonst "alles_erkundet"
function zielWaehlen(spiel, trotzGefahr) {
  const sicher = naechstesRandfeld(spiel);
  if (sicher) return { ziel: sicher, ohneMeiden: false };
  const hinterGefahr = naechstesRandfeld(spiel, true);
  if (!hinterGefahr) return { grund: "alles_erkundet" };
  return trotzGefahr ? { ziel: hinterGefahr, ohneMeiden: true } : { grund: "gefahr_im_weg" };
}

// Gibt { ablauf } oder { grund } zurück; grund: "vorbei" | "feinde_in_sicht" | "alles_erkundet" | "gefahr_im_weg"
export function erkundenBeginnen(spiel, einstellungen, { trotzGefahr = false } = {}) {
  if (spiel.zustand.vorbei) return { grund: "vorbei" };
  if (!einstellungen.reiseTrotzFeinden && wahrgenommeneFeinde(spiel).length) return { grund: "feinde_in_sicht" };
  const wahl = zielWaehlen(spiel, trotzGefahr);
  if (wahl.grund) return { grund: wahl.grund };
  return { ablauf: { lage: lageErfassen(spiel), schrittzahl: 0, trotzGefahr } };
}

// Gibt { befehl } oder { halt } zurück; halt: "alles_erkundet", "gefahr_im_weg", "vorbei", "handlungsunfaehig",
// "versperrt", "kein_weg", "gegenstand" oder eine Gefahrenprüfung
export function naechsterErkundungsschritt(spiel, ablauf, einstellungen) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { halt: "vorbei" };
  if (istHandlungsunfaehig(spiel, gesteuerteEntitaet(zustand))) return { halt: "handlungsunfaehig" };
  const halt = unterwegsPruefen(spiel, ablauf, einstellungen.reiseHalt);
  if (halt) return { halt };
  const wahl = zielWaehlen(spiel, ablauf.trotzGefahr);
  if (wahl.grund) return { halt: wahl.grund };
  const position = gesteuerteEntitaet(zustand).position;
  const naechstesFeld = naechstesWegfeld(spiel, position, wahl.ziel, wegOptionen(spiel, wahl.ohneMeiden));
  if (!naechstesFeld) return { halt: "kein_weg" };
  if (entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).some(istWesen)) return { halt: "versperrt" };
  ablauf.schrittzahl++;
  return { befehl: { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y } };
}
