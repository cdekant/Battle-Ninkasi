// Übersetzt Tastendrücke über Belegung und Aktionskatalog (eingabe/aktionskatalog.js) in Aktionen und Befehle.
// Liest den Zustand nur, um Befehle zu vervollständigen (z.B. welches Getränk).

import { spielerin } from "../kern/zustand.js";
import { erstesGetraenk } from "../systeme/inventar.js";
import { aktionDerTaste, befehlDerAktion } from "./aktionskatalog.js";

// Gibt { aktion, befehl? } oder null zurück; befehl nur bei Aktionen mit Vorlage.
// Umschalt plus eine Bewegungstaste wird zur Aktion belegung.umschaltBewegen mit { richtung: { dx, dy } } (Laufen).
export function uebersetzen(tastenereignis, belegung, spiel) {
  if (tastenereignis.ctrlKey || tastenereignis.altKey || tastenereignis.metaKey) return null;
  const aktion = aktionDerTaste(belegung, tastenereignis.code, tastenereignis.key, tastenereignis.shiftKey);
  if (!aktion) return null;
  const vorlage = befehlDerAktion(aktion);
  if (vorlage?.art === "bewegen" && tastenereignis.shiftKey && belegung.umschaltBewegen) {
    return { aktion: belegung.umschaltBewegen, richtung: { dx: vorlage.dx, dy: vorlage.dy } };
  }
  return aktionsergebnis(aktion, spiel);
}

// { aktion, befehl? } zu einer Aktion, der Befehl vervollständigt (z.B. welches Getränk); auch für die Befehlszeile
export function aktionsergebnis(aktion, spiel) {
  const befehl = befehlDerAktion(aktion);
  if (!befehl) return { aktion };
  if (befehl.art === "trinken" && befehl.gegenstandId === undefined && spiel) {
    const getraenkId = erstesGetraenk(spiel.zustand, spielerin(spiel.zustand));
    if (getraenkId !== null) befehl.gegenstandId = getraenkId;
  }
  return { aktion, befehl };
}
