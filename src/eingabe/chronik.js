// Chronik (siehe docs/Titelbildschirm.md): was über alle Läufe hinweg bleibt, getrennt von den Speicherplätzen und
// ohne Aufzeichnungen, damit sie neue Versionen übersteht. Kern ohne DOM und ohne localStorage; src/main.js speichert
// sie unter SPEICHERSCHLUESSEL_CHRONIK.
//   { format, laeufe: [{ version, pruefsumme, startwert, spielart, datum, tiefe, zuege, befehle, ergebnis, ursache }],
//     zaehler: { name: zahl } }
// Zähler sind frei benannt ("besiegt.<typ>", "gesehen.<typ>", "tode", "laeufe"); erhoben werden sie in der Oberfläche
// aus den Meldungen der Logik (ZAEHLREGELN) und aus dem Sichtfeld, nie in der Logik. Gezählt wird nur beim echten
// Spielen: Laden eines Schnappschusses meldet nichts, ein späterer Abspieler zählt nicht mit. Läufe der Spielarten in
// SPIELARTEN_OHNE_ZAEHLER (allmächtig) stehen mit ihrer Spielart in laeufe, zählen aber nicht (getrennte Wertung).
// Freischaltungen (Titelbilder, später Erfolge, Bestiarium) sind Bedingungen auf Zählern: { zaehler, mindestens }.
// Ein neues Format bringt eine Migration aus dem vorigen mit (CHRONIK_MIGRATIONEN), damit keine Chronik verloren geht;
// Namen in den Zählern folgen beim Lesen den Umbenennungen (daten/umbenennungen.js, eingabe/umbenennen.js).

import { nameNachUmbenennung } from "./umbenennen.js";

export const SPEICHERSCHLUESSEL_CHRONIK = "battle-ninkasi.chronik";
export const CHRONIK_FORMAT = 1;
export const HOECHSTENS_LAEUFE = 500; // älteste Einträge fallen heraus, die Zähler bleiben

export const SPIELARTEN_OHNE_ZAEHLER = ["allmaechtig", "arena"];

// Ob der Lauf in die Zähler eingeht
export function zaehltMit(spiel) {
  return !SPIELARTEN_OHNE_ZAEHLER.includes(spiel.optionen?.spielart ?? "normal");
}

// Migrationen: je altem Format n eine Funktion (chronik des Formats n) => chronik des Formats n + 1; ein neues Format
// heißt CHRONIK_FORMAT erhöhen und die Migration aus dem vorigen hier eintragen (geprüft von tests/titel.test.js)
export const CHRONIK_MIGRATIONEN = {};

// Welche Art von Namen hinter dem Punkt eines Zählers steht, für die Umbenennungen
export const ZAEHLER_MIT_NAMEN = { besiegt: "wesen", gesehen: "wesen" };

export function neueChronik() {
  return { format: CHRONIK_FORMAT, laeufe: [], zaehler: {} };
}

// Name eines Zählers nach den Umbenennungen ("besiegt.<typ>" mit dem neuen Typ)
export function zaehlerUmbenennen(name, umbenennungen) {
  const punkt = name.indexOf(".");
  const art = punkt > 0 ? ZAEHLER_MIT_NAMEN[name.slice(0, punkt)] : undefined;
  return art ? `${name.slice(0, punkt + 1)}${nameNachUmbenennung(umbenennungen, art, name.slice(punkt + 1))}` : name;
}

// Gespeicherte Chronik prüfen: ältere Formate migrieren, Namen umbenennen (Zähler zusammengelegt), ungültige Zähler
// fallen weg; Unlesbares ergibt eine neue. Eine Chronik aus einem neueren Format (ein älteres Spiel nach einem
// neueren) lässt sich nicht lesen und darf nicht überschrieben werden: dann eine neue mit neueresFormat: true, die
// src/main.js nicht speichert
export function chronikGueltig(roh, umbenennungen = {}) {
  if (!roh || typeof roh !== "object") return neueChronik();
  if (Number.isInteger(roh.format) && roh.format > CHRONIK_FORMAT) return { ...neueChronik(), neueresFormat: true };
  let chronik = roh;
  while (Number.isInteger(chronik?.format) && chronik.format < CHRONIK_FORMAT && CHRONIK_MIGRATIONEN[chronik.format]) chronik = CHRONIK_MIGRATIONEN[chronik.format](chronik);
  if (!chronik || chronik.format !== CHRONIK_FORMAT || !Array.isArray(chronik.laeufe) || !chronik.zaehler || typeof chronik.zaehler !== "object") return neueChronik();
  const zaehler = {};
  for (const [name, wert] of Object.entries(chronik.zaehler)) {
    if (!Number.isInteger(wert) || wert < 0) continue;
    const neuerName = zaehlerUmbenennen(name, umbenennungen);
    zaehler[neuerName] = (zaehler[neuerName] ?? 0) + wert;
  }
  return { format: CHRONIK_FORMAT, laeufe: chronik.laeufe.filter((lauf) => lauf && typeof lauf === "object"), zaehler };
}

export function zaehlerstand(chronik, name) {
  return chronik.zaehler[name] ?? 0;
}

export function zaehlerErhoehen(chronik, name, um = 1) {
  chronik.zaehler[name] = zaehlerstand(chronik, name) + um;
}

// Zählregeln je Art der Meldung: (meldung, spiel) => Name eines Zählers oder null; ein neuer Zähler ist eine Zeile hier
export const ZAEHLREGELN = {
  tod: (meldung, spiel) => {
    const ninkasiId = spiel.zustand.spielerinId;
    if (meldung.opfer.id === ninkasiId) return "tode";
    if (meldung.quelle?.id === ninkasiId) return `besiegt.${meldung.opfer.typ}`;
    return null;
  },
};

// Eine Meldung der Logik zählen (als Hörer angemeldet in src/main.js)
export function meldungZaehlen(chronik, spiel, meldung) {
  if (!zaehltMit(spiel)) return;
  const name = ZAEHLREGELN[meldung.art]?.(meldung, spiel);
  if (name) zaehlerErhoehen(chronik, name);
}

// Wesenarten in Sicht zählen, je Lauf jede Art einmal ("gesehen.<typ>"); gesehen: Set der Arten dieses Laufs, gehört
// zum Speicherstand (Teil oberflaeche), damit ein fortgesetzter Lauf nicht doppelt zählt. Freundliche Wesen sind damit
// auch "getroffen".
export function sichtungenZaehlen(chronik, spiel, gesehen) {
  const zustand = spiel.zustand;
  if (!zustand.sichtbareFelder || !zustand.ebene || !zaehltMit(spiel)) return;
  const sichtbar = new Set(zustand.sichtbareFelder);
  for (const entitaet of Object.values(zustand.entitaeten)) {
    if (!entitaet.position || entitaet.fraktion === undefined || entitaet.id === zustand.spielerinId || gesehen.has(entitaet.typ)) continue;
    if (!sichtbar.has(entitaet.position.y * zustand.ebene.breite + entitaet.position.x)) continue;
    gesehen.add(entitaet.typ);
    zaehlerErhoehen(chronik, `gesehen.${entitaet.typ}`);
  }
}

// Ein beendeter Lauf; ergebnis "tod" oder "aufgegeben"; todesmeldung: die Meldung "tod" Ninkasis oder null;
// datum (Millisekunden) und version setzt src/main.js
export function laufEintragen(chronik, spiel, { ergebnis, datum, version, todesmeldung = null }) {
  const ninkasi = spiel.zustand.entitaeten[spiel.zustand.spielerinId];
  chronik.laeufe.push({
    version,
    pruefsumme: spiel.daten?.pruefsumme ?? null,
    startwert: spiel.zustand.startwert,
    spielart: spiel.optionen.spielart ?? "normal",
    datum,
    tiefe: spiel.zustand.tiefe,
    zuege: ninkasi?.zuege ?? 0,
    befehle: spiel.befehle.length,
    ergebnis,
    ursache: todesmeldung ? { quelle: todesmeldung.quelle?.typ ?? null, ursache: todesmeldung.ursache ?? null } : null,
  });
  if (chronik.laeufe.length > HOECHSTENS_LAEUFE) chronik.laeufe.splice(0, chronik.laeufe.length - HOECHSTENS_LAEUFE);
  if (zaehltMit(spiel)) zaehlerErhoehen(chronik, "laeufe");
}

// Bedingung einer Freischaltung: null (immer frei) oder { zaehler, mindestens }
export function freigeschaltet(chronik, bedingung) {
  return !bedingung || zaehlerstand(chronik, bedingung.zaehler) >= bedingung.mindestens;
}
