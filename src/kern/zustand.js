// Spielzustand und Entitäten. Der gesamte Zustand ist reine Daten (JSON-serialisierbar).
// Eine Entität ist eine ID plus Komponenten, z.B.
//   { id, typ, text, position: {x, y}, werte, fraktion, ki, sicht, angriffe, inventar, trinkbar, zustaende, ... }
// Entitäten liegen in einem Objekt mit ganzzahligen Schlüsseln; JavaScript durchläuft solche
// Schlüssel aufsteigend, die Reihenfolge ist also fest (Erzeugungsreihenfolge).
// Positionen ändern sich nur über positionSetzen (kern/raumindex.js), damit der räumliche Index stimmt.

import { werteAusDaten } from "./werte.js";
import { akteurEntfernen, gebundeneEreignisseEntfernen } from "./zeit.js";
import { alle } from "./register.js";
import { entitaetIndexieren, entitaetAusIndexNehmen, idsAufFeld, idsImUmkreis, idsMitPosition } from "./raumindex.js";

export { positionSetzen } from "./raumindex.js";

export function neuerZustand(startwert) {
  return {
    startwert,
    zeit: 0,
    naechsteId: 1,
    naechsteZustandsnummer: 1, // Nummern der Zustände an Entitäten (systeme/zustaende.js)
    einreihungszaehler: 0,
    warteschlange: [],
    entitaeten: {},
    spielerinId: null,
    vorbei: false,
    ebene: null,
    tiefe: null, // Tiefe der aktuellen Ebene im Plan des Laufs (welt/ebene.js)
    plan: null, // Plan des Laufs: was jede Tiefe bekommt, beim Start festgelegt (welt/plan.js)
    abgelegteEbenen: {}, // verlassene Ebenen nach Tiefe, sie ruhen bis zur Rückkehr (systeme/ebenen.js)
    sichtbareFelder: [], // Feldindizes, die Ninkasi gerade sieht (aufsteigend)
    duftZaehler: 0, // steigt mit jedem Zug der gesteuerten Entität; der Duft je Feld steht in ebene.duft (systeme/duft.js)
    zufallszustand: null, // Zustand des Spiel-Zufalls
    wissen: null, // was Ninkasi in diesem Lauf über unbekannte Gegenstände weiß (systeme/kennen.js)
    ruf: {}, // Ruf der Fraktion regeln.fraktionen.rufTraeger bei anderen Fraktionen, fehlt heißt 0 (systeme/fraktionen.js)
  };
}

export function entitaetErzeugen(zustand, komponenten) {
  const id = zustand.naechsteId++;
  const entitaet = { id, ...komponenten };
  if (entitaet.position) entitaet.position = { x: entitaet.position.x, y: entitaet.position.y };
  zustand.entitaeten[id] = entitaet;
  entitaetIndexieren(zustand, entitaet);
  // Systeme ergänzen, was eine neue Entität braucht (Register "beimErzeugen"), auch für abgespaltene Stapel
  for (const [, handler] of alle("beimErzeugen")) handler(zustand, entitaet);
  return entitaet;
}

// Felder eines Datensatzes, die keine Komponenten sind; ausstattung legt systeme/inventar.js beim Erzeugen aus Daten an
const KEINE_KOMPONENTEN = new Set(["vorlage", "abstrakt", "werte", "ausstattung"]);

// Entität aus einem geprüften Datensatz (Wesen oder Gegenstand)
export function entitaetAusDatensatz(zustand, typ, datensatz, position) {
  const komponenten = { typ };
  for (const [schluessel, wert] of Object.entries(datensatz)) {
    if (KEINE_KOMPONENTEN.has(schluessel)) continue;
    komponenten[schluessel] = structuredClone(wert);
  }
  if (datensatz.werte) komponenten.werte = werteAusDaten(datensatz.werte);
  if (position) komponenten.position = { x: position.x, y: position.y };
  return entitaetErzeugen(zustand, komponenten);
}

// Wesen oder Gegenstand aus spiel.daten[bereich][typ] ("wesen" | "gegenstaende"); danach ergänzen die Systeme, was nur
// aus den Daten folgt (Register "ausDaten", z.B. die Ausstattung eines Wesens). Alles, was im Spiel aus Daten entsteht,
// geht hier durch, außer Gegenstände, die nur einen anderen ersetzen (Rückstand, Verderben)
export function ausDatenErzeugen(spiel, bereich, typ, position) {
  const datensatz = spiel.daten[bereich][typ];
  const entitaet = entitaetAusDatensatz(spiel.zustand, typ, datensatz, position);
  for (const [, handler] of alle("ausDaten")) handler(spiel, entitaet, datensatz);
  return entitaet;
}

export function entitaetMitId(zustand, id) {
  return zustand.entitaeten[id] || null;
}

export function alleEntitaeten(zustand) {
  return Object.values(zustand.entitaeten);
}

// Zahl der Wesen im Zustand (für die Obergrenze der Population, regeln.population)
export function anzahlWesen(zustand) {
  let anzahl = 0;
  for (const entitaet of Object.values(zustand.entitaeten)) if (istWesen(entitaet)) anzahl++;
  return anzahl;
}

// Entitäten mit Position, nach ID (aus dem räumlichen Index)
export function entitaetenMitPosition(zustand) {
  return idsMitPosition(zustand).map((id) => zustand.entitaeten[id]);
}

// Entitäten mit Position im Quadrat um die Mitte (Schachbrett-Abstand höchstens radius), nach ID; Grundlage für
// Sicht, Bemerken und Lärm: wer weiter weg ist, kommt gar nicht erst in Frage
export function entitaetenImUmkreis(zustand, mitte, radius) {
  return idsImUmkreis(zustand, mitte, radius).map((id) => zustand.entitaeten[id]);
}

// Entitäten auf einem Feld (nur solche mit Position, also nicht getragene), nach ID
export function entitaetenAuf(zustand, x, y) {
  return idsAufFeld(zustand, x, y).map((id) => zustand.entitaeten[id]);
}

// Nimmt einen Gegenstand aus dem Inventar einer Trägerin und, falls angelegt, aus ihrer Ausrüstung (systeme/ausruestung.js)
export function ausDemInventarNehmen(traegerin, gegenstandId) {
  if (traegerin.inventar) traegerin.inventar = traegerin.inventar.filter((id) => id !== gegenstandId);
  if (traegerin.ausgeruestet) traegerin.ausgeruestet = traegerin.ausgeruestet.filter((id) => id !== gegenstandId);
}

// Entfernt eine Entität samt ihrem Platz in der Warteschlange, ihren gebundenen Zeitereignissen
// und allem, was sie trägt; ist sie selbst getragen, verschwindet sie aus dem Inventar der Trägerin.
// Wer Getragenes behalten will (z.B. fallen lassen beim Tod), muss es vorher herausnehmen.
export function entitaetEntfernen(zustand, id) {
  const entitaet = zustand.entitaeten[id];
  if (!entitaet) return;
  if (entitaet.getragenVon !== undefined) {
    const traegerin = zustand.entitaeten[entitaet.getragenVon];
    if (traegerin) ausDemInventarNehmen(traegerin, id);
  }
  for (const getragenId of entitaet.inventar || []) entitaetEntfernen(zustand, getragenId);
  entitaetAusIndexNehmen(zustand, entitaet);
  delete zustand.entitaeten[id];
  akteurEntfernen(zustand, id);
  gebundeneEreignisseEntfernen(zustand, id);
}

// Wirksame Komponente (Fraktion, KI, Bewegungsart und die übrigen ohne Zahl): die des jüngsten Zustands, der sie
// überlagert (systeme/zustaende.js), sonst die eigene
function juengsteUeberlagerung(entitaet, feld) {
  const zustaende = entitaet?.zustaende || [];
  for (let position = zustaende.length - 1; position >= 0; position--) {
    if (zustaende[position][feld] !== undefined) return zustaende[position][feld];
  }
  return entitaet?.[feld];
}

// Ein Wesen hat eine Fraktion und LP (im Unterschied zu Gegenständen)
export function istWesen(entitaet) {
  return Boolean(entitaet && entitaet.fraktion !== undefined && entitaet.werte && entitaet.werte.lp);
}

export function fraktionVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "fraktion");
}

export function kiVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "ki");
}

// Wirksame Bewegungsart (siehe welt/karte.js): die des jüngsten überlagernden Zustands, sonst die eigene, Vorgabe "laufend"
export function bewegungVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "bewegung") ?? "laufend";
}

// Komponenten ohne Zahl nur über diese Lesefunktionen (Vorkehrung für Verwandlung, siehe docs/Architektur.md,
// Entitäten und Komponenten); Zustände tragen die Felder bisher nicht, dann gilt die eigene Komponente
export function plaetzeVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "plaetze") ?? {};
}

export function tuerenVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "tueren") ?? "oeffnen";
}

export function sichtVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "sicht") ?? null;
}

export function spuerenVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "spueren") ?? null;
}

// Die eigenen Angriffsprofile ohne Waffen; alle Profile liefert angriffeVon in systeme/kampf.js
export function eigeneAngriffeVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "angriffe") ?? [];
}

// Name, unter dem die Anzeige Zeichen und Tile sucht (daten/zeichen.js, grafik/); Vorgabe der Typ
export function aussehenVon(entitaet) {
  return juengsteUeberlagerung(entitaet, "aussehen") ?? entitaet.typ;
}

// Ninkasi: wer lernt, wer weiß, wessen Tod den Lauf beendet, wessen Züge die Bilanz zählt
export function spielerin(zustand) {
  return entitaetMitId(zustand, zustand.spielerinId);
}

// Die gesteuerte Entität: wer Befehle über die Eingangstür bekommt, wessen Sicht gilt, wem Kamera, Zielmodus und
// Abläufe folgen; vorerst immer Ninkasi, ohne eigenes Feld im Zustand (siehe docs/Architektur.md, Entitäten und Komponenten)
export function gesteuerteEntitaet(zustand) {
  return spielerin(zustand);
}

export function istGesteuert(zustand, entitaet) {
  return Boolean(entitaet) && entitaet.id === gesteuerteEntitaet(zustand)?.id;
}
