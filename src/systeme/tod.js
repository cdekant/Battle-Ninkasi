// Tod als Zustandsprüfung (siehe docs/Architektur.md, Tod und Zustandsprüfung).
// Nach jedem Vorgang stirbt jedes Wesen, dessen Lebenswert (Daten: lebenswert, Vorgabe "lp") bei 0 liegt,
// in fester Reihenfolge nach Entitäts-ID. Geprüft werden nur Wesen, bei denen seit der letzten Prüfung ein Wert auf 0
// gefallen ist (vorgemerkt in kern/werte.js, kern/raumindex.js); im Spiel läuft jede Änderung über wertAendern.
// Ablauf je Wesen:
//   1. Haken "vor_tod": Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt
//   2. Meldung "tod" mit Urheber, Ursache und Mittel (aus letzterVerlust, siehe kern/effekte.js)
//   3. Haken "nach_tod" mit der letzten Position, hier hängen Auslöser (Sporen, Säurespritzer)
//   4. Hinterlassenschaft nach Daten: beimTod: { inventar: "fallen_lassen" (Vorgabe) | "vernichten" }
//   5. Entfernen samt Akteur und gebundenen Zeitereignissen; bei Ninkasi ist das Spiel vorbei, sie bleibt im Zustand

import { anmelden } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, positionSetzen } from "../kern/zustand.js";
import { todOffenEntnehmen } from "../kern/raumindex.js";
import { akteurEntfernen } from "../kern/zeit.js";
import { lebenswertName } from "../kern/werte.js";
import { hakenAusloesen, melden, bezugAuf } from "../kern/ereignisse.js";

function istTot(entitaet) {
  const lebenswert = entitaet.werte && entitaet.werte[lebenswertName(entitaet)];
  return Boolean(lebenswert) && lebenswert.aktuell <= 0;
}

function hinterlassenschaftVerteilen(spiel, entitaet) {
  const regel = entitaet.beimTod?.inventar ?? "fallen_lassen";
  for (const gegenstandId of [...(entitaet.inventar || [])]) {
    const gegenstand = entitaetMitId(spiel.zustand, gegenstandId);
    if (!gegenstand) continue;
    if (regel === "fallen_lassen" && entitaet.position) {
      delete gegenstand.getragenVon;
      positionSetzen(spiel.zustand, gegenstand, entitaet.position);
    } else {
      entitaetEntfernen(spiel.zustand, gegenstandId);
    }
  }
  if (entitaet.inventar) entitaet.inventar = [];
  if (entitaet.ausgeruestet) entitaet.ausgeruestet = [];
}

// Gibt true zurück, wenn das Wesen gestorben ist
export function sterben(spiel, entitaet) {
  const zustand = spiel.zustand;
  const verlust = entitaet.letzterVerlust || { urheberId: null, ursache: null, mittel: null, kettentiefe: 0 };
  const mittel = verlust.mittel ?? null;
  const beteiligte = { quelleId: verlust.urheberId, urheberId: verlust.urheberId, zielId: entitaet.id, ursache: verlust.ursache, kettentiefe: verlust.kettentiefe, mittel };

  const vorher = hakenAusloesen(spiel, "vor_tod", { ...beteiligte, abgebrochen: false });
  if (vorher.abgebrochen && !istTot(entitaet)) {
    delete entitaet.letzterVerlust;
    return false;
  }

  const urheber = entitaetMitId(zustand, verlust.urheberId);
  melden(spiel, "tod", { opfer: bezugAuf(entitaet), quelle: urheber ? bezugAuf(urheber) : null, ursache: verlust.ursache, mittel });
  const position = entitaet.position ? { x: entitaet.position.x, y: entitaet.position.y } : null;
  hakenAusloesen(spiel, "nach_tod", { ...beteiligte, position });

  if (entitaet.id === zustand.spielerinId) {
    zustand.vorbei = true;
    akteurEntfernen(zustand, entitaet.id);
  } else {
    hinterlassenschaftVerteilen(spiel, entitaet);
    entitaetEntfernen(zustand, entitaet.id);
  }
  return true;
}

anmelden("zustandspruefungen", "tod", (spiel) => {
  const zustand = spiel.zustand;
  let jemandGestorben = false;
  for (const entitaetId of todOffenEntnehmen(zustand)) {
    const entitaet = zustand.entitaeten[entitaetId];
    if (!entitaet || !istTot(entitaet)) continue;
    if (entitaet.id === zustand.spielerinId && zustand.vorbei) continue;
    if (sterben(spiel, entitaet)) jemandGestorben = true;
  }
  return jemandGestorben;
});
