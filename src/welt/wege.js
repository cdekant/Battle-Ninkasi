// Wegfindung für alle Wesen (KI und Reise der Spielerin), AStar aus rot.js mit acht Richtungen.
// Optionen:
//   nurBekannt: nur Felder, deren Gelände Ninkasi kennt, und betretbar nach dem bekannten Gelände statt dem echten
//     (keine Hellseherei bei Reise und Erkunden, siehe systeme/erinnerung.js)
//   wesenMeiden: Felder mit Wesen gelten als versperrt (außer Start und Ziel)
//   bewegung: Bewegungsart, für die die Felder betretbar sein müssen (Vorgabe "laufend", siehe welt/karte.js)
//   oeffnetTueren: geschlossene Türen zählen als begehbar (Vorgabe true)
//   meiden: (x, y) => true für Felder, die der Weg meidet (außer Start und Ziel), z.B. bekannte Fallen
// Später: Kosten je Gelände (Fallen meiden) gelten dann für KI und Spielerin zugleich.
// Abstandskarte (Dijkstra-Karte, Vorbild Brogue) für Ziele, zu denen viele Wesen oft gehen (Wegpunkte beim Umherziehen):
//   einmal berechnet, im zwischenspeicher je Ebene gehalten; gelaendeSetzen verwirft sie (systeme/gelaende.js).

import AStar from "../../lib/rot/path/astar.js";
import { betretbarFuer, gelaendeBetretbarFuer, bekanntesGelaendeAuf, feldIndex, aufDerKarte } from "./karte.js";
import { entitaetenAuf, istWesen } from "../kern/zustand.js";

// Gibt die Felder des Weges ohne Startfeld zurück, [] wenn start = ziel, null wenn kein Weg
// Betretbar nach dem echten oder (nurBekannt) nach dem bekannten Gelände
function betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren) {
  if (!nurBekannt) return betretbarFuer(spiel, x, y, bewegung, oeffnetTueren);
  return gelaendeBetretbarFuer(spiel, bekanntesGelaendeAuf(spiel, x, y), bewegung, oeffnetTueren);
}

export function weg(spiel, start, ziel, { nurBekannt = false, wesenMeiden = false, bewegung = "laufend", oeffnetTueren = true, meiden = null } = {}) {
  if (start.x === ziel.x && start.y === ziel.y) return [];
  const feldBegehbar = (x, y) => {
    if (x === start.x && y === start.y) return true;
    if (!betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren)) return false;
    const istZiel = x === ziel.x && y === ziel.y;
    if (wesenMeiden && !istZiel && entitaetenAuf(spiel.zustand, x, y).some(istWesen)) return false;
    if (meiden && !istZiel && meiden(x, y)) return false;
    return true;
  };
  if (!feldBegehbar(ziel.x, ziel.y)) return null;
  const wegfelder = [];
  new AStar(ziel.x, ziel.y, feldBegehbar, { topology: 8 }).compute(start.x, start.y, (x, y) => wegfelder.push({ x, y }));
  return wegfelder.length ? wegfelder.slice(1) : null;
}

// Erstes Feld des Weges, null wenn kein Weg oder schon am Ziel
export function naechstesWegfeld(spiel, start, ziel, optionen) {
  const wegfelder = weg(spiel, start, ziel, optionen);
  return wegfelder && wegfelder.length ? wegfelder[0] : null;
}

const NACHBARN = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Abstandskarte zum Feld ziel: je Feldindex die Zahl der Schritte in acht Richtungen bis zum Ziel, -1, wenn es von dort
// nicht erreichbar ist; über Felder, die für bewegung (und oeffnetTueren) betretbar sind, Wesen zählen nicht
export function abstandskarte(spiel, ziel, { bewegung = "laufend", oeffnetTueren = true } = {}) {
  const ebene = spiel.zustand.ebene;
  let speicher = spiel.zwischenspeicher.abstandskarten;
  if (speicher?.ebene !== ebene) speicher = spiel.zwischenspeicher.abstandskarten = { ebene, karten: new Map() };
  const schluessel = `${ziel.x},${ziel.y},${bewegung},${oeffnetTueren}`;
  const gespeichert = speicher.karten.get(schluessel);
  if (gespeichert) return gespeichert;
  const karte = new Int32Array(ebene.breite * ebene.hoehe).fill(-1);
  if (aufDerKarte(ebene, ziel.x, ziel.y) && betretbarFuer(spiel, ziel.x, ziel.y, bewegung, oeffnetTueren)) {
    karte[feldIndex(ebene, ziel.x, ziel.y)] = 0;
    const warteliste = [ziel];
    for (let kopf = 0; kopf < warteliste.length; kopf++) {
      const feld = warteliste[kopf];
      const weiter = karte[feldIndex(ebene, feld.x, feld.y)] + 1;
      for (const [dx, dy] of NACHBARN) {
        const x = feld.x + dx, y = feld.y + dy;
        if (!aufDerKarte(ebene, x, y) || karte[feldIndex(ebene, x, y)] >= 0 || !betretbarFuer(spiel, x, y, bewegung, oeffnetTueren)) continue;
        karte[feldIndex(ebene, x, y)] = weiter;
        warteliste.push({ x, y });
      }
    }
  }
  speicher.karten.set(schluessel, karte);
  return karte;
}

// Nächstes begehbares Feld (Breitensuche in Schritten, ohne den Start), für das passt(x, y) gilt; null, wenn keins.
// Nachbarn in fester Reihenfolge, bei gleichem Abstand gewinnt das zuerst gefundene. nurBekannt und bewegung wie bei weg.
// Die Suche geht nur über Felder, die für die Bewegungsart betretbar sind (mitStart: auch der Start selbst wird geprüft);
// mit meiden weder über gemiedene Felder noch zu ihnen, so findet sie nur, was ein Weg mit demselben meiden erreicht.
export function naechstesFeldMit(spiel, start, passt, { nurBekannt = false, bewegung = "laufend", oeffnetTueren = true, mitStart = false, meiden = null } = {}) {
  if (mitStart && passt(start.x, start.y)) return { x: start.x, y: start.y };
  const ebene = spiel.zustand.ebene;
  const besucht = new Set([feldIndex(ebene, start.x, start.y)]);
  const warteliste = [start];
  for (let kopf = 0; kopf < warteliste.length; kopf++) {
    const feld = warteliste[kopf];
    for (const [dx, dy] of NACHBARN) {
      const x = feld.x + dx, y = feld.y + dy;
      if (!aufDerKarte(ebene, x, y)) continue;
      const index = feldIndex(ebene, x, y);
      if (besucht.has(index)) continue;
      besucht.add(index);
      if (!betretbarNach(spiel, x, y, nurBekannt, bewegung, oeffnetTueren)) continue;
      if (meiden && meiden(x, y)) continue;
      if (passt(x, y)) return { x, y };
      warteliste.push({ x, y });
    }
  }
  return null;
}

// Feld mit einem Nachbarn, den Ninkasi nie gesehen hat (auch wenn er kartiert ist): dort geht es weiter ins Unerkundete
export function amRandDesErkundeten(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  return NACHBARN.some(([dx, dy]) => aufDerKarte(ebene, x + dx, y + dy) && !ebene.erkundet[feldIndex(ebene, x + dx, y + dy)]);
}
