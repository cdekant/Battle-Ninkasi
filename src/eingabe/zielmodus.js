// Zielmodus (siehe docs/Architektur.md, Zielmodus): reine Tasten- und Mauslogik ohne DOM, damit sie testbar ist.
// Anzeige-Zustand, nicht im Spielzustand: null oder { auswahl, zielart, cursor: { x, y } }
//   auswahl wie in systeme/vorschau.js: { zweck: "werfen", gegenstandId } oder { zweck: "faehigkeit", faehigkeit },
//   dazu { zweck: "untersuchen" } (Taste X): derselbe Cursor ohne Befehl, Enter tut nichts, Esc oder X schließt;
//   was der Cursor zeigt, beschreibt systeme/untersuchen.js
//   Bewegungstasten der Belegung verschieben den Cursor, die Maus setzt ihn; Tab springt zum nächsten Ziel in Sicht,
//   Enter bestätigt (nur, wenn die Vorschau keinen Grund dagegen nennt), Esc bricht ab.
// Fähigkeiten ohne Ziel oder mit Zielart selbst brauchen keinen Zielmodus, sie werden sofort zum Befehl.

import { spielerin, entitaetMitId, entitaetenAuf, istWesen } from "../kern/zustand.js";
import { aufDerKarte } from "../welt/karte.js";
import { istSichtbar } from "../systeme/sicht.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { faehigkeitFuer, faehigkeitPruefen } from "../systeme/faehigkeiten.js";
import { zielvorschau } from "../systeme/vorschau.js";

export const TASTEN_BESTAETIGEN = ["Enter", "NumpadEnter"];
export const TASTE_NAECHSTES_ZIEL = "Tab";
export const TASTE_ABBRECHEN = "Escape";
export const TASTE_UNTERSUCHEN = "KeyX";

const istUntersuchen = (modus) => modus.auswahl.zweck === "untersuchen";

// Gründe, die nur am Ziel liegen; sie hindern den Beginn des Zielmodus nicht
const GRUENDE_DES_ZIELS = ["ungueltig", "kein_ziel", "nicht_sichtbar", "zu_weit", "keine_sichtlinie"];

const quadratAbstand = (von, nach) => (von.x - nach.x) ** 2 + (von.y - nach.y) ** 2;

// Sichtbare Wesen, die nicht verbündet sind, nach Abstand zu Ninkasi und ID: die Reihenfolge für Tab
export function zieleInSicht(spiel) {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  return Object.values(zustand.entitaeten)
    .filter((entitaet) => istWesen(entitaet) && entitaet.position && entitaet.id !== ninkasi.id
      && istSichtbar(zustand, entitaet.position.x, entitaet.position.y)
      && beziehungZwischen(spiel, urheberVon(ninkasi), entitaet) !== "verbuendet")
    .sort((erstes, zweites) => quadratAbstand(erstes.position, ninkasi.position) - quadratAbstand(zweites.position, ninkasi.position) || erstes.id - zweites.id);
}

// Beginnt den Zielmodus: { modus } oder { befehl } (kein Ziel nötig) oder { grund } (geht gar nicht)
export function zielmodusBeginnen(spiel, auswahl) {
  const ninkasi = spielerin(spiel.zustand);
  let zielart;
  if (auswahl.zweck === "untersuchen") {
    zielart = { art: "feld" };
  } else if (auswahl.zweck === "werfen") {
    const gegenstand = (ninkasi.inventar || []).includes(auswahl.gegenstandId) ? entitaetMitId(spiel.zustand, auswahl.gegenstandId) : null;
    if (!gegenstand) return { grund: "nichts_zu_werfen" };
    zielart = { art: "geschoss", reichweite: gegenstand.wurf?.reichweite ?? spiel.daten.regeln.werfen.reichweite };
  } else {
    const definition = faehigkeitFuer(spiel, ninkasi, auswahl.faehigkeit);
    const befehl = { art: "faehigkeit", faehigkeit: auswahl.faehigkeit };
    if (!definition?.ziel || definition.ziel.art === "selbst" || definition.art === "aufrecht") return { befehl };
    const grund = faehigkeitPruefen(spiel, ninkasi, auswahl.faehigkeit, undefined);
    if (grund && !GRUENDE_DES_ZIELS.includes(grund)) return { grund };
    zielart = definition.ziel;
  }
  const erstesZiel = zieleInSicht(spiel)[0];
  const cursor = erstesZiel ? { ...erstesZiel.position } : { ...ninkasi.position };
  return { modus: { auswahl: structuredClone(auswahl), zielart, cursor } };
}

// Zielangabe für den Befehl aus dem Cursor, je nach Zielart
export function zielangabeVon(spiel, modus) {
  const { cursor, zielart } = modus;
  if (zielart.art === "wesen") {
    const wesen = istSichtbar(spiel.zustand, cursor.x, cursor.y) ? entitaetenAuf(spiel.zustand, cursor.x, cursor.y).find(istWesen) : null;
    return { id: wesen ? wesen.id : null };
  }
  if (zielart.art === "richtung") {
    const ninkasi = spielerin(spiel.zustand);
    return { dx: Math.sign(cursor.x - ninkasi.position.x), dy: Math.sign(cursor.y - ninkasi.position.y) };
  }
  return { x: cursor.x, y: cursor.y };
}

// Vorschau zum aktuellen Cursor (systeme/vorschau.js); beim Untersuchen null
export function zielmodusVorschau(spiel, modus) {
  if (istUntersuchen(modus)) return null;
  return zielvorschau(spiel, spielerin(spiel.zustand), modus.auswahl, zielangabeVon(spiel, modus));
}

// Setzt den Cursor auf ein Feld (Maus); außerhalb der Karte bleibt er stehen
export function cursorSetzen(spiel, modus, feld) {
  if (!aufDerKarte(spiel.zustand.ebene, feld.x, feld.y)) return modus;
  return { ...modus, cursor: { x: feld.x, y: feld.y } };
}

// Bestätigen: { modus: null, befehl } oder, wenn die Vorschau einen Grund nennt, { modus, grund }; Untersuchen bleibt offen
export function zielmodusBestaetigen(spiel, modus) {
  if (istUntersuchen(modus)) return { modus };
  const vorschau = zielmodusVorschau(spiel, modus);
  return vorschau.ok ? { modus: null, befehl: vorschau.befehl } : { modus, grund: vorschau.grund };
}

function naechstesZiel(spiel, modus) {
  const ziele = zieleInSicht(spiel);
  if (!ziele.length) return modus;
  const jetzt = ziele.findIndex((wesen) => wesen.position.x === modus.cursor.x && wesen.position.y === modus.cursor.y);
  return { ...modus, cursor: { ...ziele[(jetzt + 1) % ziele.length].position } };
}

// Verarbeitet eine Taste (KeyboardEvent.code) im Zielmodus; gibt { modus, befehl?, grund? } zurück
export function zielmodusTaste(spiel, modus, tastencode, belegung) {
  if (tastencode === TASTE_ABBRECHEN || (tastencode === TASTE_UNTERSUCHEN && istUntersuchen(modus))) return { modus: null };
  if (TASTEN_BESTAETIGEN.includes(tastencode)) return zielmodusBestaetigen(spiel, modus);
  if (tastencode === TASTE_NAECHSTES_ZIEL) return { modus: naechstesZiel(spiel, modus) };
  const vorlage = belegung.befehle[tastencode];
  if (vorlage?.art === "bewegen") return { modus: cursorSetzen(spiel, modus, { x: modus.cursor.x + vorlage.dx, y: modus.cursor.y + vorlage.dy }) };
  return { modus };
}
