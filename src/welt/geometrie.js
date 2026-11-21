// Geometrie auf dem Gitter (siehe docs/Wirkungen.md, Zielauswahl).
// Nur ganze Zahlen und keine Winkelfunktionen, damit jede Maschine dieselben Felder berechnet.
//   linie:          symmetrisch, von A nach B ergibt dieselben Felder wie von B nach A, nur umgekehrt
//   sichtlinieFrei: kein undurchsichtiges Feld zwischen den Endpunkten; ein Diagonalschritt an einer
//                   Wandecke ist frei, wenn eine der beiden Seiten frei ist
//   flugbahn:       Linie bis zum Ziel (oder darüber hinaus), endet an Wand, Reichweite oder erstem Wesen
//   kreis, kegel:   Abstand als dx² + dy²; ein Feld liegt im Kreis mit Radius r, wenn dx² + dy² <= r·(r+1)
// Reihenfolge der Felder in Mustern: nach Abstand zum Ursprung (dx² + dy²), dann nach Feldindex.

import { aufDerKarte, durchsichtig, geschossdurchlaessig, feldIndex } from "./karte.js";
import { sichtdurchlaessig } from "./schichten.js";
import { entitaetenAuf, istWesen } from "../kern/zustand.js";

// Die acht Nachbarrichtungen in fester Reihenfolge (zeilenweise von links oben)
export const ACHT_RICHTUNGEN = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([dx, dy]) => ({ dx, dy }));

export const gleichesFeld = (feldA, feldB) => feldA.x === feldB.x && feldA.y === feldB.y;

const feldKopie = (feld) => ({ x: feld.x, y: feld.y });

export function abstandQuadrat(feldA, feldB) {
  const dx = feldA.x - feldB.x, dy = feldA.y - feldB.y;
  return dx * dx + dy * dy;
}

// Grenze des Kreises mit Radius r; gilt auch für Reichweiten
export const kreisgrenze = (radius) => radius * (radius + 1);

export function inReichweite(von, nach, reichweite) {
  return abstandQuadrat(von, nach) <= kreisgrenze(reichweite);
}

// Ganzzahlige Division, zur nächsten ganzen Zahl gerundet (Hälfte aufwärts); nenner > 0
function geteiltZurNaechsten(zaehler, nenner) {
  return Math.floor((2 * zaehler + nenner) / (2 * nenner));
}

function linieVomStart(start, ende) {
  const dx = ende.x - start.x, dy = ende.y - start.y;
  const schritte = Math.max(Math.abs(dx), Math.abs(dy));
  const felder = [];
  for (let schritt = 0; schritt <= schritte; schritt++) {
    felder.push({ x: start.x + geteiltZurNaechsten(dx * schritt, schritte), y: start.y + geteiltZurNaechsten(dy * schritt, schritte) });
  }
  return felder;
}

// Felder von "von" bis "nach", beide eingeschlossen; je Schritt ein Feld weiter (acht Richtungen).
// Symmetrisch: gerechnet wird immer vom kleineren Endpunkt aus (erst y, dann x), bei Bedarf umgedreht.
export function linie(von, nach) {
  if (gleichesFeld(von, nach)) return [feldKopie(von)];
  const vonIstKleiner = von.y < nach.y || (von.y === nach.y && von.x < nach.x);
  return vonIstKleiner ? linieVomStart(von, nach) : linieVomStart(nach, von).reverse();
}

// Diagonalschritt an einer Wandecke: frei, wenn eine der beiden Seiten durchsichtig ist
function schrittFrei(spiel, vonFeld, nachFeld) {
  if (vonFeld.x === nachFeld.x || vonFeld.y === nachFeld.y) return true;
  return durchsichtig(spiel, nachFeld.x, vonFeld.y) || durchsichtig(spiel, vonFeld.x, nachFeld.y);
}

// Endpunkte zählen nicht: eine Wand als Ziel ist sichtbar
export function sichtlinieFrei(spiel, von, nach) {
  const felder = linie(von, nach);
  for (let nummer = 1; nummer < felder.length; nummer++) {
    if (!schrittFrei(spiel, felder[nummer - 1], felder[nummer])) return false;
    const istEndpunkt = nummer === felder.length - 1;
    // die Sicht hält auch dichter Rauch auf (welt/schichten.js), Wandecken bleiben eine Frage des Geländes
    if (!istEndpunkt && !sichtdurchlaessig(spiel, felder[nummer].x, felder[nummer].y)) return false;
  }
  return true;
}

// Wesen auf einem Feld, in fester Reihenfolge (Entitäts-ID)
export function wesenAufFeld(spiel, feld) {
  return entitaetenAuf(spiel.zustand, feld.x, feld.y).filter(istWesen);
}

// Die ersten anzahl Felder hinter "durch" auf der Linie von "von" durch "durch" hinaus (Stoßrichtung); auch außerhalb der Karte
export function verlaengerung(von, durch, anzahl) {
  if (gleichesFeld(von, durch) || anzahl <= 0) return [];
  const schritte = linie(von, durch).length - 1;
  // die verlängerte Linie geht genau durch "durch", wie bei der Flugbahn mit ueberZielHinaus
  const faktor = Math.ceil((schritte + anzahl) / schritte);
  const fern = { x: von.x + (durch.x - von.x) * faktor, y: von.y + (durch.y - von.y) * faktor };
  return linie(von, fern).slice(schritte + 1, schritte + 1 + anzahl);
}

// Bahn eines Geschosses von "von" in Richtung "nach", ohne das Startfeld.
// optionen: { reichweite, durchdringend, ueberZielHinaus, ueberspringen }
//   ohne ueberZielHinaus endet die Bahn am Ziel, sonst erst an der Reichweite (Maß wie beim Kreis)
//   Felder, die Geschosse nicht durchlassen (karte.js geschossdurchlaessig), und gesperrte Wandecken halten auf,
//   das Feld davor ist der Aufschlag
//   das erste Wesen hält auf, außer bei durchdringend
//   ueberspringen(wesen): Wesen, für die sie true liefert, fliegt das Geschoss über (nicht getroffen, hält nicht auf)
// Gibt { felder, getroffene: [IDs], aufschlag } zurück; ändert nichts.
export function flugbahn(spiel, von, nach, { reichweite = Infinity, durchdringend = false, ueberZielHinaus = false, ueberspringen = null } = {}) {
  const ergebnis = { felder: [], getroffene: [], aufschlag: feldKopie(von) };
  if (gleichesFeld(von, nach)) return ergebnis;
  let bahn = linie(von, nach);
  if (ueberZielHinaus) {
    // die verlängerte Linie geht genau durch "nach", ab dort wird sie angehängt
    const schritte = bahn.length - 1;
    const ebene = spiel.zustand.ebene;
    const hoechsteSchritte = Number.isFinite(reichweite) ? reichweite : Math.max(ebene.breite, ebene.hoehe);
    const faktor = Math.max(1, Math.ceil(hoechsteSchritte / schritte));
    const fern = { x: von.x + (nach.x - von.x) * faktor, y: von.y + (nach.y - von.y) * faktor };
    bahn = bahn.concat(linie(von, fern).slice(schritte + 1));
  }
  for (let nummer = 1; nummer < bahn.length; nummer++) {
    const feld = bahn[nummer];
    if (!inReichweite(von, feld, reichweite)) break;
    if (!geschossdurchlaessig(spiel, feld.x, feld.y) || !schrittFrei(spiel, bahn[nummer - 1], feld)) break;
    ergebnis.felder.push(feld);
    ergebnis.aufschlag = feldKopie(feld);
    for (const wesen of wesenAufFeld(spiel, feld)) if (!ueberspringen?.(wesen)) ergebnis.getroffene.push(wesen.id);
    if (ergebnis.getroffene.length && !durchdringend) break;
  }
  return ergebnis;
}

// Alle Felder im Kreis um die Mitte, auch außerhalb der Karte
export function kreis(mitte, radius) {
  const grenze = kreisgrenze(radius);
  const felder = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= grenze) felder.push({ x: mitte.x + dx, y: mitte.y + dy });
    }
  }
  return felder;
}

// Öffnungen des Kegels in Grad mit dem Tangens des halben Winkels in Tausendsteln
export const KEGEL_OEFFNUNGEN = { 30: 268, 45: 414, 60: 577, 90: 1000, 120: 1732 };

// Felder im Kegel ab "von" in Richtung { dx, dy } (beliebige Länge, nicht 0), ohne "von" selbst.
// Ein Feld gehört dazu, wenn es vor "von" liegt (Skalarprodukt > 0), der Winkel zur Richtung höchstens
// die halbe Öffnung beträgt (|Kreuzprodukt| <= Skalarprodukt · Tangens) und es im Kreis der Länge liegt.
export function kegel(von, richtung, laenge, oeffnung) {
  const tangensTausendstel = KEGEL_OEFFNUNGEN[oeffnung];
  if (tangensTausendstel === undefined) throw new Error(`Kegel: Öffnung ${oeffnung} gibt es nicht`);
  const grenze = kreisgrenze(laenge);
  const felder = [];
  for (let dy = -laenge; dy <= laenge; dy++) {
    for (let dx = -laenge; dx <= laenge; dx++) {
      if (dx * dx + dy * dy > grenze) continue;
      const skalar = dx * richtung.dx + dy * richtung.dy;
      if (skalar <= 0) continue;
      const kreuz = Math.abs(dx * richtung.dy - dy * richtung.dx);
      if (kreuz * 1000 <= skalar * tangensTausendstel) felder.push({ x: von.x + dx, y: von.y + dy });
    }
  }
  return felder;
}

// Nur Felder auf der Karte, ohne doppelte, nach Abstand zum Ursprung, dann nach Feldindex
export function felderOrdnen(ebene, ursprung, felder) {
  const nachIndex = new Map();
  for (const feld of felder) {
    if (aufDerKarte(ebene, feld.x, feld.y)) nachIndex.set(feldIndex(ebene, feld.x, feld.y), feldKopie(feld));
  }
  return [...nachIndex.entries()]
    .sort(([indexA, feldA], [indexB, feldB]) => abstandQuadrat(ursprung, feldA) - abstandQuadrat(ursprung, feldB) || indexA - indexB)
    .map(([, feld]) => feld);
}
