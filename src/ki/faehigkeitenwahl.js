// Handlung "faehigkeit" der KI (siehe docs/Wesen.md, KI; Wahl und Eintrag in ki/handlungen.js): der Befehl, mit dem ein
// Wesen eine Fähigkeit gegen seine Beute einsetzt, oder null. Abstand, wenn und chance prüft die Wahl; hier zählt, ob die
// Fähigkeit benutzbar ist (faehigkeitPruefen) und keine Verbündeten trifft.
//   Verbündete: zählt ein betroffenes Wesen außer der Wirkenden selbst als verbündet, unterbleibt die Fähigkeit,
//   außer die Zielart trifft ausdrücklich "verbuendete"; ueberVerbuendete an der Zielart lässt Geschosse darüber fliegen.
// Zielangabe nach Zielart: wesen und geschoss die Beute ({ id }), feld deren Feld (angekündigte Angriffe zielen so
// auf das Feld beim Beginn), selbst keine, richtung zur Beute, nur wenn sie daneben steht.

import { fraktionVon } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { faehigkeitFuer, faehigkeitPruefen } from "../systeme/faehigkeiten.js";
import { zielAufloesen, trifftZu } from "../systeme/zielauswahl.js";

function zielangabeFuer(wesen, zielart, beute) {
  switch (zielart?.art) {
    case "wesen":
    case "geschoss":
      return { id: beute.id };
    case "feld":
      return { x: beute.position.x, y: beute.position.y };
    case "richtung":
      return abstand(wesen.position, beute.position) === 1 ? { dx: beute.position.x - wesen.position.x, dy: beute.position.y - wesen.position.y } : null;
    default:
      return undefined;
  }
}

function trifftVerbuendete(spiel, wesen, zielart, zielangabe) {
  if (!zielart || zielart.trifft === "verbuendete") return false;
  const aufloesung = zielAufloesen(spiel, wesen, zielart, zielangabe);
  if (!aufloesung.ok) return false;
  const sicht = { id: wesen.id, fraktion: fraktionVon(wesen) ?? null };
  return aufloesung.betroffene.some((id) => id !== wesen.id && trifftZu(spiel, "verbuendete", sicht, spiel.zustand.entitaeten[id]));
}

// Befehl für die Fähigkeit name gegen die Beute oder null
export function faehigkeitsbefehl(spiel, wesen, name, beute) {
  const definition = faehigkeitFuer(spiel, wesen, name);
  if (!definition) return null;
  const zielangabe = zielangabeFuer(wesen, definition.ziel, beute);
  if (zielangabe === null) return null;
  if (faehigkeitPruefen(spiel, wesen, name, zielangabe)) return null;
  if (trifftVerbuendete(spiel, wesen, definition.ziel, zielangabe)) return null;
  const befehl = { art: "faehigkeit", faehigkeit: name };
  if (zielangabe !== undefined) befehl.ziel = zielangabe;
  return befehl;
}
