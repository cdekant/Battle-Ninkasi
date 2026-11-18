// Zustände (siehe docs/Architektur.md, Zustände): zeitlich begrenzte Wirkungen an einer Entität.
// Daten (daten/zustaende.js):
//   name: { text, tags?, dauer?, stapel?, hoechstStapel?, verlauf?, modifikatoren?, jeTick?, beimBeginn?, beimEnde?,
//           ausloeser?, gebundenAnQuelle? }
//   dauer:        Zeiteinheiten; ohne Angabe unbegrenzt, bis der Zustand entfernt wird
//   stapel:       was beim erneuten Anwenden desselben Zustands geschieht (Vorgabe "erneuern"):
//                 "erneuern"    eine Instanz, die höhere Stärke, die längere Dauer
//                 "aufaddieren" eine Instanz, Stärken addiert bis hoechstStapel Anwendungen, Dauer erneuert
//                 "staerkster"  nur eine mindestens gleich starke Anwendung ersetzt die alte, sonst nichts
//                 "einzeln"     jede Anwendung eine eigene Instanz, höchstens hoechstStapel
//   verlauf:      "gleichbleibend" (Vorgabe) | "abklingend" | "ansteigend" | eigene Kurve
//                 [[anteilProzent, staerkeProzent], ...] über den Anteil der verstrichenen Dauer
//   modifikatoren: [{ ziel, art, betrag }], betrag je Stärke 1, mit dem Verlauf skaliert
//   jeTick, beimBeginn, beimEnde: Effekte auf die Trägerin; Mengen mit mitStaerke skalieren mit der Stärke
//   gebundenAnQuelle: endet mit dem Tod der Quelle (aufrechterhaltener Zauber)
// Instanz an der Entität: zustaende: [{ nummer, name, quelleId, urheberId, urheberFraktion, beginn, ende, staerke, stapel }]
// Takt: Weltuhr (je Welttick, solange zeit < ende); Hast und Verlangsamung der Trägerin ändern daran nichts.
// Ende: Zeitereignis "zustand_ende", gebunden an die Trägerin; wurde der Zustand inzwischen verlängert,
// reiht es sich zum neuen Ende wieder ein. Modifikatoren stehen mit der Quelle "zustand:<nummer>" in der
// Liste der Trägerin und werden bei Beginn, Stapeln und jedem Welttick nachgeführt.

import { anmelden } from "../kern/register.js";
import { alleEntitaeten } from "../kern/zustand.js";
import { ereignisEinreihen } from "../kern/zeit.js";
import { hakenAusloesen, melden, bezugAuf } from "../kern/ereignisse.js";
import { effektAnwenden } from "../kern/effekte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { wertAufKurve } from "../kern/kurven.js";
import { prozentVon, modifikatorHinzufuegen, modifikatorenEntfernen } from "../kern/werte.js";

export const STAPELREGELN = ["erneuern", "aufaddieren", "staerkster", "einzeln"];

export const VERLAEUFE = {
  gleichbleibend: [[0, 100], [100, 100]],
  abklingend: [[0, 100], [100, 0]],
  ansteigend: [[0, 0], [100, 100]],
};

function definitionVon(spiel, name) {
  const definition = spiel.daten.zustaende?.[name];
  if (!definition) throw new Error(`Unbekannter Zustand "${name}"`);
  return definition;
}

export function hatZustand(entitaet, name) {
  return (entitaet.zustaende || []).some((instanz) => instanz.name === name);
}

// Stärke in Prozent nach dem Verlauf (100 = Stärke 1 zu Beginn eines gleichbleibenden Zustands)
export function staerkeProzent(spiel, instanz) {
  const definition = definitionVon(spiel, instanz.name);
  const kurve = Array.isArray(definition.verlauf) ? definition.verlauf : VERLAEUFE[definition.verlauf ?? "gleichbleibend"];
  const dauer = instanz.ende === null ? 0 : instanz.ende - instanz.beginn;
  const anteilProzent = dauer > 0 ? Math.floor(((spiel.zustand.zeit - instanz.beginn) * 100) / dauer) : 0;
  return instanz.staerke * wertAufKurve(kurve, anteilProzent);
}

const modifikatorQuelle = (instanz) => `zustand:${instanz.nummer}`;

function modifikatorenNachfuehren(spiel, traegerin, instanz) {
  modifikatorenEntfernen(traegerin, modifikatorQuelle(instanz));
  const definition = definitionVon(spiel, instanz.name);
  if (!definition.modifikatoren?.length) return;
  const prozent = staerkeProzent(spiel, instanz);
  for (const modifikator of definition.modifikatoren) {
    modifikatorHinzufuegen(traegerin, { ziel: modifikator.ziel, art: modifikator.art, betrag: prozentVon(modifikator.betrag, prozent), quelle: modifikatorQuelle(instanz) });
  }
}

// Kontext für Effekte und Haken eines Zustands; wirkt auf die Trägerin, zugerechnet der Urheberin
function zustandsKontext(spiel, traegerin, instanz, kettentiefe = 0) {
  const definition = definitionVon(spiel, instanz.name);
  const position = traegerin.position ? { x: traegerin.position.x, y: traegerin.position.y } : null;
  return {
    quelleId: instanz.quelleId, urheberId: instanz.urheberId, urheberFraktion: instanz.urheberFraktion,
    zielId: traegerin.id, ursprung: position, zielfeld: position,
    ursache: "zustand", kettentiefe, mittel: { art: "zustand", name: instanz.name }, tags: [...(definition.tags || [])],
    werte: { staerkeProzent: staerkeProzent(spiel, instanz) },
  };
}

function zustandsEffekt(spiel, traegerin, instanz, effektName, kettentiefe) {
  if (effektName) effektAnwenden(spiel, effektName, zustandsKontext(spiel, traegerin, instanz, kettentiefe));
}

function hakenKontext(traegerin, instanz, kettentiefe, zusatz = {}) {
  return { quelleId: instanz.quelleId, urheberId: instanz.urheberId, zielId: traegerin.id, ursache: "zustand", kettentiefe, zustand: instanz.name, nummer: instanz.nummer, ...zusatz };
}

function neueInstanz(spiel, traegerin, name, angaben, ende) {
  const zustand = spiel.zustand;
  const instanz = {
    nummer: zustand.naechsteZustandsnummer++, name,
    quelleId: angaben.quelleId, urheberId: angaben.urheberId, urheberFraktion: angaben.urheberFraktion,
    beginn: zustand.zeit, ende, staerke: angaben.staerke, stapel: 1,
  };
  if (!traegerin.zustaende) traegerin.zustaende = [];
  traegerin.zustaende.push(instanz);
  if (ende !== null) ereignisEinreihen(zustand, ende, "zustand_ende", { traegerinId: traegerin.id, nummer: instanz.nummer }, traegerin.id);
  modifikatorenNachfuehren(spiel, traegerin, instanz);
  melden(spiel, "zustand_beginnt", { wer: bezugAuf(traegerin), zustand: name, staerke: instanz.staerke });
  hakenAusloesen(spiel, "zustand_beginnt", hakenKontext(traegerin, instanz, angaben.kettentiefe));
  zustandsEffekt(spiel, traegerin, instanz, definitionVon(spiel, name).beimBeginn, angaben.kettentiefe);
  return instanz;
}

// Erneuert Dauer und Urheberin einer vorhandenen Instanz; der Verlauf beginnt neu, wenn das Ende später liegt
function dauerErneuern(spiel, instanz, angaben, ende) {
  instanz.quelleId = angaben.quelleId;
  instanz.urheberId = angaben.urheberId;
  instanz.urheberFraktion = angaben.urheberFraktion;
  if (instanz.ende === null || ende === null || ende <= instanz.ende) return;
  instanz.beginn = spiel.zustand.zeit;
  instanz.ende = ende;
}

// Setzt einen Zustand nach seiner Stapelregel; angaben: { quelleId, urheberId, urheberFraktion, dauer?, staerke?, kettentiefe? }
// Gibt die betroffene Instanz zurück oder null, wenn die Anwendung nichts geändert hat.
export function zustandSetzen(spiel, traegerin, name, angaben = {}) {
  const definition = definitionVon(spiel, name);
  const vollstaendig = {
    quelleId: angaben.quelleId ?? null, urheberId: angaben.urheberId ?? angaben.quelleId ?? null,
    urheberFraktion: angaben.urheberFraktion ?? spiel.zustand.entitaeten[angaben.urheberId ?? angaben.quelleId]?.fraktion ?? null,
    staerke: angaben.staerke ?? 1, kettentiefe: angaben.kettentiefe ?? 0,
  };
  const dauer = angaben.dauer ?? definition.dauer;
  const ende = dauer === undefined ? null : spiel.zustand.zeit + dauer;
  const vorhandene = (traegerin.zustaende || []).filter((instanz) => instanz.name === name);
  const regel = definition.stapel ?? "erneuern";
  const hoechstStapel = definition.hoechstStapel ?? Infinity;
  if (regel === "einzeln") return vorhandene.length < hoechstStapel ? neueInstanz(spiel, traegerin, name, vollstaendig, ende) : null;
  const instanz = vorhandene[0];
  if (!instanz) return neueInstanz(spiel, traegerin, name, vollstaendig, ende);
  if (regel === "staerkster") {
    if (vollstaendig.staerke < instanz.staerke) return null;
    instanz.staerke = vollstaendig.staerke;
    dauerErneuern(spiel, instanz, vollstaendig, ende);
  } else if (regel === "aufaddieren") {
    if (instanz.stapel < hoechstStapel) {
      instanz.stapel++;
      instanz.staerke += vollstaendig.staerke;
    }
    dauerErneuern(spiel, instanz, vollstaendig, ende);
  } else {
    instanz.staerke = Math.max(instanz.staerke, vollstaendig.staerke);
    dauerErneuern(spiel, instanz, vollstaendig, ende);
  }
  modifikatorenNachfuehren(spiel, traegerin, instanz);
  return instanz;
}

// Beendet eine Instanz; grund: "abgelaufen" | "entfernt" | "quelle_tot"
export function zustandBeenden(spiel, traegerin, instanz, grund, kettentiefe = 0) {
  if (!traegerin.zustaende?.includes(instanz)) return;
  traegerin.zustaende = traegerin.zustaende.filter((andere) => andere !== instanz);
  if (traegerin.zustaende.length === 0) delete traegerin.zustaende;
  modifikatorenEntfernen(traegerin, modifikatorQuelle(instanz));
  melden(spiel, "zustand_endet", { wer: bezugAuf(traegerin), zustand: instanz.name, grund });
  hakenAusloesen(spiel, "zustand_endet", hakenKontext(traegerin, instanz, kettentiefe, { grund }));
  zustandsEffekt(spiel, traegerin, instanz, definitionVon(spiel, instanz.name).beimEnde, kettentiefe);
}

anmelden("zeitereignisse", "zustand_ende", (spiel, { traegerinId, nummer }) => {
  const traegerin = spiel.zustand.entitaeten[traegerinId];
  const instanz = traegerin?.zustaende?.find((kandidat) => kandidat.nummer === nummer);
  if (!instanz) return;
  if (instanz.ende > spiel.zustand.zeit) {
    ereignisEinreihen(spiel.zustand, instanz.ende, "zustand_ende", { traegerinId, nummer }, traegerinId);
    return;
  }
  zustandBeenden(spiel, traegerin, instanz, "abgelaufen");
});

// Je Welttick: Verlauf der Modifikatoren nachführen, dann jeTick; Entitäten nach ID, Zustände in ihrer Reihenfolge
anmelden("welttick", "zustaende", (spiel) => {
  const zustand = spiel.zustand;
  for (const traegerin of alleEntitaeten(zustand)) {
    for (const instanz of [...(traegerin.zustaende || [])]) {
      if (!zustand.entitaeten[traegerin.id] || !traegerin.zustaende?.includes(instanz)) continue;
      if (instanz.ende !== null && zustand.zeit >= instanz.ende) continue;
      modifikatorenNachfuehren(spiel, traegerin, instanz);
      zustandsEffekt(spiel, traegerin, instanz, definitionVon(spiel, instanz.name).jeTick, 0);
    }
  }
});

// Stirbt eine Quelle, enden ihre gebundenen Zustände (aufrechterhaltener Zauber)
anmelden("haken", "nach_tod", (spiel, kontext) => {
  for (const traegerin of alleEntitaeten(spiel.zustand)) {
    for (const instanz of [...(traegerin.zustaende || [])]) {
      if (instanz.quelleId === kontext.zielId && definitionVon(spiel, instanz.name).gebundenAnQuelle) {
        zustandBeenden(spiel, traegerin, instanz, "quelle_tot", kontext.kettentiefe ?? 0);
      }
    }
  }
});

// Bausteine: zustand_setzen { zustand, dauer?, staerke? } und zustand_entfernen { zustand? | tag? } auf das Ziel
bausteinAnmelden("zustand_setzen", { zustand: "zustand", dauer: "ganzzahl?", staerke: "ganzzahl?" }, (spiel, kontext, parameter) => {
  zustandSetzen(spiel, spiel.zustand.entitaeten[kontext.zielId], parameter.zustand, {
    quelleId: kontext.quelleId, urheberId: kontext.urheberId, urheberFraktion: kontext.urheberFraktion,
    dauer: parameter.dauer, staerke: parameter.staerke, kettentiefe: kontext.kettentiefe,
  });
}, { brauchtZiel: true });

bausteinAnmelden("zustand_entfernen", { zustand: "zustand?", tag: "text?" }, (spiel, kontext, parameter) => {
  const traegerin = spiel.zustand.entitaeten[kontext.zielId];
  for (const instanz of [...(traegerin.zustaende || [])]) {
    const passt = instanz.name === parameter.zustand || (parameter.tag !== undefined && (definitionVon(spiel, instanz.name).tags || []).includes(parameter.tag));
    if (passt) zustandBeenden(spiel, traegerin, instanz, "entfernt", kontext.kettentiefe);
  }
}, { brauchtZiel: true });
