// Werte (LP, MP, PP, Pegel und weitere) als erweiterbarer Satz, berechnet aus Grundwert und Modifikatoren.
// Wert in der Entität:   werte: { lp: { grundwert: 100, aktuell: 100, hundertstelRest: 0 } }
//   ohne grundwert ist der Wert nach oben offen (z.B. der Pegel), nach unten bleibt er bei 0
//   hundertstelRest: Bruchteile in Hundertsteln, ein voller Punkt wird gutgeschrieben
// Modifikator:           { ziel: "lp" | "kosten.bewegen" | "kosten.alle" | ..., art: "plus" | "prozent", betrag, quelle }
// Verrechnung vorläufig: alle Plus-Werte und alle Prozente addieren, Prozente vom Grundwert.

// Einheitliche Rundung für Prozentrechnung
export function prozentVon(wert, prozent) {
  return Math.round((wert * prozent) / 100);
}

// Wiederholte Prozentrechnung, je Stufe einzeln gerundet (Dämpfung der Auslöser, Abschwächung je Sprung)
export function prozentWiederholt(wert, prozent, anzahlStufen) {
  let ergebnis = wert;
  for (let stufe = 0; stufe < anzahlStufen; stufe++) ergebnis = prozentVon(ergebnis, prozent);
  return ergebnis;
}

// Einheitliche Rundung beim Teilen (verteilter Schaden), teiler > 0
export function geteiltGerundet(wert, teiler) {
  return Math.round(wert / teiler);
}

// Wendet alle Modifikatoren mit einem der Ziele auf einen Basiswert an
export function modifiziert(entitaet, ziele, basiswert) {
  const zielListe = Array.isArray(ziele) ? ziele : [ziele];
  let summePlus = 0, summeProzent = 0;
  for (const modifikator of entitaet.modifikatoren || []) {
    if (!zielListe.includes(modifikator.ziel)) continue;
    if (modifikator.art === "plus") summePlus += modifikator.betrag;
    else if (modifikator.art === "prozent") summeProzent += modifikator.betrag;
  }
  return basiswert + summePlus + prozentVon(basiswert, summeProzent);
}

// Wert, dessen Fall auf 0 tötet (Daten: lebenswert, Vorgabe "lp"); siehe systeme/tod.js
export function lebenswertName(entitaet) {
  return entitaet.lebenswert || "lp";
}

// Was beim Tod mit dem Inventar geschieht (Daten: beimTod: { inventar })
export const HINTERLASSENSCHAFT_REGELN = ["fallen_lassen", "vernichten"];

export function hatWert(entitaet, wertName) {
  return Boolean(entitaet.werte && entitaet.werte[wertName]);
}

// Ein Wert ohne Grundwert hat keine Obergrenze
export function hatHoechstwert(entitaet, wertName) {
  return entitaet.werte[wertName].grundwert !== undefined;
}

// Höchstwert aus Grundwert und Modifikatoren; Infinity für offene Werte (wird nur berechnet, nie gespeichert)
export function hoechstwert(entitaet, wertName) {
  if (!hatHoechstwert(entitaet, wertName)) return Infinity;
  return modifiziert(entitaet, wertName, entitaet.werte[wertName].grundwert);
}

// Ändert einen Wert innerhalb 0 bis Höchstwert, gibt die tatsächliche Änderung zurück.
// Ohne Haken; im Spiel läuft jede Änderung über wertAendern in kern/effekte.js.
export function wertBegrenztAendern(entitaet, wertName, aenderung) {
  const wert = entitaet.werte[wertName];
  const vorher = wert.aktuell;
  wert.aktuell = Math.max(0, Math.min(hoechstwert(entitaet, wertName), vorher + aenderung));
  return wert.aktuell - vorher;
}

// Änderung in Hundertsteln über den Rest; gibt die Änderung in vollen Punkten zurück
export function wertBegrenztAendernInHundertsteln(entitaet, wertName, hundertstel) {
  const wert = entitaet.werte[wertName];
  wert.hundertstelRest = (wert.hundertstelRest || 0) + hundertstel;
  const vollePunkte = Math.trunc(wert.hundertstelRest / 100);
  wert.hundertstelRest -= vollePunkte * 100;
  const geaendert = vollePunkte !== 0 ? wertBegrenztAendern(entitaet, wertName, vollePunkte) : 0;
  // am Anschlag keinen Rest ansammeln
  const amHoechstwert = wert.aktuell >= hoechstwert(entitaet, wertName) && wert.hundertstelRest > 0;
  const amNullpunkt = wert.aktuell <= 0 && wert.hundertstelRest < 0;
  if (amHoechstwert || amNullpunkt) wert.hundertstelRest = 0;
  return geaendert;
}

export function modifikatorHinzufuegen(entitaet, modifikator) {
  if (!entitaet.modifikatoren) entitaet.modifikatoren = [];
  entitaet.modifikatoren.push(modifikator);
}

// Entfällt eine Quelle, entfallen genau ihre Modifikatoren
export function modifikatorenEntfernen(entitaet, quelle) {
  if (entitaet.modifikatoren) entitaet.modifikatoren = entitaet.modifikatoren.filter((modifikator) => modifikator.quelle !== quelle);
}

// Erzeugt den Wertesatz einer Entität aus Daten: { lp: { grundwert: 100, anfangswert?: 100 }, pegel: { anfangswert: 0 } }
export function werteAusDaten(wertedaten) {
  const werte = {};
  for (const [wertName, daten] of Object.entries(wertedaten || {})) {
    const aktuell = daten.anfangswert ?? daten.grundwert;
    werte[wertName] = daten.grundwert === undefined
      ? { aktuell, hundertstelRest: 0 }
      : { grundwert: daten.grundwert, aktuell, hundertstelRest: 0 };
  }
  return werte;
}
