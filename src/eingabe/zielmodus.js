// Zielmodus (siehe docs/Bedienung.md, Zielmodus): reine Tasten- und Mauslogik ohne DOM, damit sie testbar ist.
// Anzeige-Zustand, nicht im Spielzustand: null oder { auswahl, zielart, cursor: { x, y }, platz? }
//   auswahl wie in systeme/vorschau.js: { zweck: "werfen", gegenstandId }, { zweck: "schiessen", waffeId } oder
//   { zweck: "faehigkeit", faehigkeit },
//   dazu { zweck: "untersuchen" } (Taste X): derselbe Cursor ohne Befehl, Enter tut nichts, Esc oder X schließt;
//   was der Cursor zeigt, beschreibt systeme/untersuchen.js
//   Bewegungstasten der Belegung verschieben den Cursor, die Maus setzt ihn; Tab springt zum nächsten Ziel in Sicht,
//   Enter bestätigt (nur, wenn die Vorschau keinen Grund dagegen nennt), Esc bricht ab.
//   platz: aus der Schnellleiste begonnen (eingabe/schnellleiste.js); dieselbe Taste noch einmal bestätigt (wie DCSS).
// Vorbelegung des Cursors nach der zielvorgabe der Fähigkeit ("feind", "gefaehrte", "selbst"); ohne Angabe
// "gefaehrte" bei den Tags heilung oder nuetzlich der Wirkung, sonst "feind"; Werfen und Schießen zielen auf Feinde. Lebt das zuletzt
// gewählte Ziel und ist in Sicht, gewinnt es (letztesZielId, Anzeige-Zustand in src/main.js).
// Fähigkeiten ohne Ziel oder mit Zielart selbst brauchen keinen Zielmodus, sie werden sofort zum Befehl.

import { gesteuerteEntitaet, entitaetMitId, entitaetenAuf, istWesen } from "../kern/zustand.js";
import { aufDerKarte } from "../welt/karte.js";
import { istSichtbar } from "../systeme/sicht.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { faehigkeitFuer, faehigkeitPruefen } from "../systeme/faehigkeiten.js";
import { zielvorschau } from "../systeme/vorschau.js";
import { wurfReichweite } from "../systeme/werfen.js";
import { fernwaffeVon, schussZielart } from "../systeme/fernkampf.js";
import { holen } from "../kern/register.js";
import { hoechstwert } from "../kern/werte.js";
import { AKTIONEN, aktionDerTaste, befehlDerAktion } from "./aktionskatalog.js";

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
  const gesteuerte = gesteuerteEntitaet(zustand);
  return Object.values(zustand.entitaeten)
    .filter((entitaet) => istWesen(entitaet) && entitaet.position && entitaet.id !== gesteuerte.id
      && istSichtbar(zustand, entitaet.position.x, entitaet.position.y)
      && beziehungZwischen(spiel, urheberVon(gesteuerte), entitaet) !== "verbuendet")
    .sort((erstes, zweites) => quadratAbstand(erstes.position, gesteuerte.position) - quadratAbstand(zweites.position, gesteuerte.position) || erstes.id - zweites.id);
}

// Sichtbare Verbündete samt Ninkasi, verletzte zuerst, dann nach Abstand und ID
function gefaehrtenInSicht(spiel) {
  const zustand = spiel.zustand;
  const gesteuerte = gesteuerteEntitaet(zustand);
  const verletzt = (wesen) => (wesen.werte?.lp ? wesen.werte.lp.aktuell < hoechstwert(spiel, wesen, "lp") : false);
  return Object.values(zustand.entitaeten)
    .filter((entitaet) => istWesen(entitaet) && entitaet.position && istSichtbar(zustand, entitaet.position.x, entitaet.position.y)
      && (entitaet.id === gesteuerte.id || beziehungZwischen(spiel, urheberVon(gesteuerte), entitaet) === "verbuendet"))
    .sort((erstes, zweites) => verletzt(zweites) - verletzt(erstes)
      || quadratAbstand(erstes.position, gesteuerte.position) - quadratAbstand(zweites.position, gesteuerte.position) || erstes.id - zweites.id);
}

// Art der Vorbelegung einer Auswahl: "feind", "gefaehrte" oder "selbst"
export function zielvorgabeVon(spiel, auswahl) {
  if (auswahl.zweck !== "faehigkeit") return "feind";
  const definition = faehigkeitFuer(spiel, gesteuerteEntitaet(spiel.zustand), auswahl.faehigkeit);
  if (definition?.zielvorgabe) return definition.zielvorgabe;
  const tags = [...(definition?.tags || []), ...(spiel.daten.effekte?.[definition?.wirkung]?.tags || [])];
  return tags.includes("heilung") || tags.includes("nuetzlich") ? "gefaehrte" : "feind";
}

// Startfeld des Cursors: das zuletzt gewählte Ziel, wenn es lebt, in Sicht ist und zur Vorgabe passt, sonst nach der Vorgabe
function startcursor(spiel, auswahl, letztesZielId) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  const vorgabe = auswahl.zweck === "untersuchen" ? "feind" : zielvorgabeVon(spiel, auswahl);
  if (vorgabe === "selbst") return { ...gesteuerte.position };
  const kandidaten = vorgabe === "gefaehrte" ? gefaehrtenInSicht(spiel) : zieleInSicht(spiel);
  const letztes = letztesZielId != null ? kandidaten.find((wesen) => wesen.id === letztesZielId) : null;
  const ziel = letztes ?? kandidaten[0];
  return ziel ? { ...ziel.position } : { ...gesteuerte.position };
}

// Beginnt den Zielmodus: { modus } oder { befehl } (kein Ziel nötig) oder { grund } (geht gar nicht)
// optionen: { platz? (Schnellleiste), letztesZielId? }
export function zielmodusBeginnen(spiel, auswahl, { platz, letztesZielId } = {}) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  let zielart;
  if (auswahl.zweck === "untersuchen") {
    zielart = { art: "feld" };
  } else if (auswahl.zweck === "werfen") {
    const gegenstand = (gesteuerte.inventar || []).includes(auswahl.gegenstandId) ? entitaetMitId(spiel.zustand, auswahl.gegenstandId) : null;
    if (!gegenstand) return { grund: "nichts_zu_werfen" };
    zielart = { art: "geschoss", reichweite: wurfReichweite(spiel, gesteuerte, gegenstand) };
  } else if (auswahl.zweck === "schiessen") {
    const waffe = fernwaffeVon(spiel, gesteuerte, auswahl.waffeId);
    if (!waffe) return { grund: "keine_fernwaffe" };
    // eine leere Waffe oder fehlende Munition hindert schon den Beginn
    const grund = holen("befehle", "schiessen").pruefen(spiel, gesteuerte, { art: "schiessen", waffeId: waffe.id, ziel: undefined });
    if (grund && !GRUENDE_DES_ZIELS.includes(grund)) return { grund };
    zielart = schussZielart(spiel, gesteuerte, waffe);
  } else {
    const definition = faehigkeitFuer(spiel, gesteuerte, auswahl.faehigkeit);
    const befehl = { art: "faehigkeit", faehigkeit: auswahl.faehigkeit };
    if (!definition?.ziel || definition.ziel.art === "selbst" || definition.art === "aufrecht") return { befehl };
    const grund = faehigkeitPruefen(spiel, gesteuerte, auswahl.faehigkeit, undefined);
    if (grund && !GRUENDE_DES_ZIELS.includes(grund)) return { grund };
    zielart = definition.ziel;
  }
  const cursor = startcursor(spiel, auswahl, letztesZielId);
  return { modus: { auswahl: structuredClone(auswahl), zielart, cursor, ...(platz !== undefined && { platz }) } };
}

// Zielangabe für den Befehl aus dem Cursor, je nach Zielart
export function zielangabeVon(spiel, modus) {
  const { cursor, zielart } = modus;
  if (zielart.art === "wesen") {
    const wesen = istSichtbar(spiel.zustand, cursor.x, cursor.y) ? entitaetenAuf(spiel.zustand, cursor.x, cursor.y).find(istWesen) : null;
    return { id: wesen ? wesen.id : null };
  }
  if (zielart.art === "richtung") {
    const gesteuerte = gesteuerteEntitaet(spiel.zustand);
    return { dx: Math.sign(cursor.x - gesteuerte.position.x), dy: Math.sign(cursor.y - gesteuerte.position.y) };
  }
  return { x: cursor.x, y: cursor.y };
}

// Vorschau zum aktuellen Cursor (systeme/vorschau.js); beim Untersuchen null
export function zielmodusVorschau(spiel, modus) {
  if (istUntersuchen(modus)) return null;
  return zielvorschau(spiel, gesteuerteEntitaet(spiel.zustand), modus.auswahl, zielangabeVon(spiel, modus));
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
  const aktion = aktionDerTaste(belegung, tastencode);
  if (modus.platz !== undefined && AKTIONEN[aktion]?.platz === modus.platz) return zielmodusBestaetigen(spiel, modus);
  if (tastencode === TASTE_NAECHSTES_ZIEL) return { modus: naechstesZiel(spiel, modus) };
  const vorlage = befehlDerAktion(aktion);
  if (vorlage?.art === "bewegen") return { modus: cursorSetzen(spiel, modus, { x: modus.cursor.x + vorlage.dx, y: modus.cursor.y + vorlage.dy }) };
  return { modus };
}
