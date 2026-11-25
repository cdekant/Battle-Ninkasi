// Fernangriff (siehe docs/Bedienung.md, Eingabe): eine Taste für Schuss und Wurf, Vorbild der Köcher in DCSS.
// Mit angelegter Fernwaffe schießt Ninkasi, sonst wirft sie eine Wurfwaffe: die Art, die sie zuletzt geworfen hat
// (letzteWurfwaffe, Anzeige-Zustand in src/main.js), sonst die erste Wurfwaffe im Gepäck. Reine Logik ohne DOM.

import { gesteuerteEntitaet, entitaetMitId } from "../kern/zustand.js";
import { fernwaffeVon } from "../systeme/fernkampf.js";
import { istAngelegt } from "../systeme/ausruestung.js";

const istWurfwaffe = (gegenstand) => gegenstand?.wurf?.genauigkeit !== undefined;

// Die Wurfwaffe für den Fernangriff: ein Stück der Art letzteWurfwaffe (Typ), sonst die erste im Gepäck; null ohne
export function wurfwaffeFuerFernangriff(spiel, wesen, letzteWurfwaffe = null) {
  const wurfwaffen = (wesen.inventar || []).map((id) => entitaetMitId(spiel.zustand, id))
    .filter((gegenstand) => istWurfwaffe(gegenstand) && !istAngelegt(wesen, gegenstand.id));
  return wurfwaffen.find((gegenstand) => gegenstand.typ === letzteWurfwaffe) ?? wurfwaffen[0] ?? null;
}

// Auswahl für den Zielmodus: { auswahl } mit zweck schiessen oder werfen, sonst { grund: "kein_fernangriff" }
export function fernangriffAuswahl(spiel, letzteWurfwaffe = null) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  const waffe = fernwaffeVon(spiel, gesteuerte);
  if (waffe) return { auswahl: { zweck: "schiessen", waffeId: waffe.id } };
  const wurfwaffe = wurfwaffeFuerFernangriff(spiel, gesteuerte, letzteWurfwaffe);
  return wurfwaffe ? { auswahl: { zweck: "werfen", gegenstandId: wurfwaffe.id } } : { grund: "kein_fernangriff" };
}

// Typ der Wurfwaffe, die ein Befehl wirft (für letzteWurfwaffe), sonst null; vor dem Befehl zu fragen
export function geworfeneWurfwaffe(spiel, befehl) {
  if (befehl?.art !== "werfen") return null;
  const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
  return istWurfwaffe(gegenstand) ? gegenstand.typ : null;
}
