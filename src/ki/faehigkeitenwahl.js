// Fähigkeiten in der KI (siehe docs/Architektur.md, KI): welche Fähigkeit ein Wesen gegen seine Beute einsetzt.
// Daten an der KI: faehigkeiten: [{ name, chance?, abstandAb?, abstandBis?, wenn? }]
//   Die Einträge werden der Reihe nach geprüft, der erste passende wird benutzt. Ein Eintrag passt, wenn
//   der Abstand zur Beute (Schachbrett, wie die Reichweite des Nahkampfs) zwischen abstandAb und abstandBis liegt,
//   die Bedingungen in wenn am Wesen gelten (Gegenüber ist die Beute), die Fähigkeit benutzbar ist (faehigkeitPruefen)
//   und sie keine Verbündeten trifft; erst dann wird chance (Prozent, Vorgabe 100) gewürfelt.
//   Verbündete: zählt ein betroffenes Wesen außer der Wirkenden selbst als verbündet, unterbleibt die Fähigkeit,
//   außer die Zielart trifft ausdrücklich "verbuendete"; ueberVerbuendete an der Zielart lässt Geschosse darüber fliegen.
// Zielangabe nach Zielart: wesen und geschoss die Beute ({ id }), feld deren Feld (angekündigte Angriffe zielen so
// auf das Feld beim Beginn), selbst keine, richtung zur Beute, nur wenn sie daneben steht.

import { mitProzentChance } from "../kern/zufall.js";
import { bedingungenErfuellt } from "../kern/werte.js";
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

function eintragPasst(spiel, wesen, eintrag, beute) {
  if (eintrag.chance === 0) return null;
  const entfernung = abstand(wesen.position, beute.position);
  if (eintrag.abstandAb !== undefined && entfernung < eintrag.abstandAb) return null;
  if (eintrag.abstandBis !== undefined && entfernung > eintrag.abstandBis) return null;
  if (!bedingungenErfuellt(spiel, wesen, eintrag.wenn, { gegenueberId: beute.id })) return null;
  const definition = faehigkeitFuer(spiel, wesen, eintrag.name);
  if (!definition) return null;
  const zielangabe = zielangabeFuer(wesen, definition.ziel, beute);
  if (zielangabe === null) return null;
  if (faehigkeitPruefen(spiel, wesen, eintrag.name, zielangabe)) return null;
  if (trifftVerbuendete(spiel, wesen, definition.ziel, zielangabe)) return null;
  // erst würfeln, wenn sonst alles passt: so bleibt die Zahlenfolge des Zufalls von unbenutzbaren Einträgen unberührt
  if (eintrag.chance !== undefined && eintrag.chance < 100 && !mitProzentChance(spiel.zustand.zufallszustand, eintrag.chance)) return null;
  const befehl = { art: "faehigkeit", faehigkeit: eintrag.name };
  if (zielangabe !== undefined) befehl.ziel = zielangabe;
  return befehl;
}

// Befehl für die erste passende Fähigkeit gegen die Beute oder null
export function faehigkeitWaehlen(spiel, wesen, ki, beute) {
  for (const eintrag of ki.faehigkeiten || []) {
    const befehl = eintragPasst(spiel, wesen, eintrag, beute);
    if (befehl) return befehl;
  }
  return null;
}
