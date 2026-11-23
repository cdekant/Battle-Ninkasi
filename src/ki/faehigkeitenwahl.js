// Handlung "faehigkeit" der KI (siehe docs/Wesen.md, KI; Wahl und Eintrag in ki/handlungen.js): der Befehl, mit dem ein
// Wesen eine Fähigkeit gegen ein Ziel einsetzt, oder null. Abstand, wenn und chance prüft die Wahl; hier zählt, ob die
// Fähigkeit zum Ziel passt, benutzbar ist (faehigkeitPruefen) und keine Verbündeten trifft.
//   Ziel: die Zielart selbst passt nur zum Wesen selbst; trifft die Zielart "verbuendete", passt jedes verbündete Wesen
//   (auch das Wesen selbst); sonst nur die Beute.
//   Verbündete: zählt ein betroffenes Wesen außer der Wirkenden selbst als verbündet, unterbleibt die Fähigkeit,
//   außer die Zielart trifft ausdrücklich "verbuendete"; ueberVerbuendete an der Zielart lässt Geschosse darüber fliegen.
// Zielangabe nach Zielart: wesen und geschoss das Ziel ({ id }), feld dessen Feld (angekündigte Angriffe zielen so
// auf das Feld beim Beginn), selbst keine, richtung zum Ziel, nur wenn es daneben steht.

import { fraktionVon } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { faehigkeitFuer, faehigkeitPruefen } from "../systeme/faehigkeiten.js";
import { zielAufloesen, trifftZu } from "../systeme/zielauswahl.js";

const sichtVon = (wesen) => ({ id: wesen.id, fraktion: fraktionVon(wesen) ?? null });

function zielPasst(spiel, wesen, zielart, ziel, beute) {
  if (zielart?.art === "selbst") return ziel.id === wesen.id;
  if (zielart?.trifft === "verbuendete") return trifftZu(spiel, "verbuendete", sichtVon(wesen), ziel);
  return ziel.id === beute.id;
}

function zielangabeFuer(wesen, zielart, ziel) {
  switch (zielart?.art) {
    case "wesen":
    case "geschoss":
      return { id: ziel.id };
    case "feld":
      return { x: ziel.position.x, y: ziel.position.y };
    case "richtung":
      return abstand(wesen.position, ziel.position) === 1 ? { dx: ziel.position.x - wesen.position.x, dy: ziel.position.y - wesen.position.y } : null;
    default:
      return undefined;
  }
}

function trifftVerbuendete(spiel, wesen, zielart, zielangabe) {
  if (!zielart || zielart.trifft === "verbuendete") return false;
  const aufloesung = zielAufloesen(spiel, wesen, zielart, zielangabe);
  if (!aufloesung.ok) return false;
  const sicht = sichtVon(wesen);
  return aufloesung.betroffene.some((id) => id !== wesen.id && trifftZu(spiel, "verbuendete", sicht, spiel.zustand.entitaeten[id]));
}

// Befehl für die Fähigkeit name gegen das Ziel oder null; beute: die Beute des Wesens (Vorgabe das Ziel)
export function faehigkeitsbefehl(spiel, wesen, name, ziel, beute = ziel) {
  const definition = faehigkeitFuer(spiel, wesen, name);
  if (!definition || !zielPasst(spiel, wesen, definition.ziel, ziel, beute)) return null;
  const zielangabe = zielangabeFuer(wesen, definition.ziel, ziel);
  if (zielangabe === null) return null;
  if (faehigkeitPruefen(spiel, wesen, name, zielangabe)) return null;
  if (trifftVerbuendete(spiel, wesen, definition.ziel, zielangabe)) return null;
  const befehl = { art: "faehigkeit", faehigkeit: name };
  if (zielangabe !== undefined) befehl.ziel = zielangabe;
  return befehl;
}
