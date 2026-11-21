// Speicherstand des Browsers (siehe docs/Architektur.md, Speichern): Kern ohne DOM und ohne localStorage, damit er
// testbar ist; src/main.js schreibt und liest die Texte unter den Schlüsseln der Speicherplätze.
//   { version, startwert, optionen, befehle, zustand, vorschau, oberflaeche: { leisten, log, gesehen } }
// Spielstand (Startwert, Startoptionen, Befehle) ist die verbindliche Aufzeichnung; der Schnappschuss des Zustands
// lädt sofort, ohne Nachspielen (kern/spiel.js ausSchnappschuss). Die Teile vorschau und oberflaeche liest die Logik
// nie: vorschau zeigt der Titel, ohne den Zustand einzusetzen; gesehen sind die Wesenarten, die die Chronik in diesem
// Lauf schon gezählt hat (eingabe/chronik.js).
// Drei Speicherplätze für nebeneinander laufende Läufe (seit 0.32.0); ein Platz ist ein Lauf, keine Sicherung.
// Passt die Version nicht oder ist der Text kaputt, gibt es einen Grund statt eines Spiels.

import VERSION from "../version.js";
import { schnappschuss, ausSchnappschuss } from "../kern/spiel.js";
import { spielerin } from "../kern/zustand.js";
import { leistenGueltig } from "./schnellleiste.js";

export const ANZAHL_PLAETZE = 3;
export const speicherschluesselPlatz = (stelle) => `battle-ninkasi.lauf.${stelle + 1}`;
// bis 0.31.0 gab es nur einen Platz; sein Stand passt zu keiner neueren Version und wird beim Start gelöscht
export const SPEICHERSCHLUESSEL_ALTER_LAUF = "battle-ninkasi.lauf";
// der zuletzt beendete Lauf samt Aufzeichnung, für ein späteres Abspielen (docs/Titelbildschirm.md)
export const SPEICHERSCHLUESSEL_LETZTER_LAUF = "battle-ninkasi.letzter_lauf";
export const GESPEICHERTE_LOGZEILEN = 200;

// Was der Titel über einen Lauf zeigt; gespeichertAm (Millisekunden) setzt src/main.js, außerhalb der Logik
export function vorschauAusSpiel(spiel, gespeichertAm = null) {
  const zustand = spiel.zustand;
  return { tiefe: zustand.tiefe, zuege: spielerin(zustand)?.zuege ?? 0, startwert: zustand.startwert, spielart: spiel.optionen.spielart ?? "normal", gespeichertAm };
}

// Text des Speicherstands zu einem Spiel und dem Anzeige-Zustand der Oberfläche
export function speicherstandText(spiel, { leisten, logzeilen = [], gesehen = [], gespeichertAm = null }) {
  return JSON.stringify({
    ...schnappschuss(spiel),
    vorschau: vorschauAusSpiel(spiel, gespeichertAm),
    oberflaeche: { leisten, log: logzeilen.slice(-GESPEICHERTE_LOGZEILEN), gesehen: [...gesehen] },
  });
}

// Liest einen Speicherstand: { spiel, oberflaeche: { leisten, log, gesehen } } oder { grund, version? };
// grund: "kaputt" (kein lesbarer Stand), "version" (andere Version), "fehler" (Zustand lässt sich nicht einsetzen)
export function speicherstandLesen(daten, text) {
  let stand;
  try {
    stand = JSON.parse(text);
  } catch {
    return { grund: "kaputt" };
  }
  if (!stand || typeof stand !== "object" || !stand.zustand) return { grund: "kaputt" };
  if (stand.version !== VERSION) return { grund: "version", version: String(stand.version) };
  try {
    const spiel = ausSchnappschuss(daten, stand);
    const log = Array.isArray(stand.oberflaeche?.log) ? stand.oberflaeche.log : [];
    const gesehen = Array.isArray(stand.oberflaeche?.gesehen) ? stand.oberflaeche.gesehen.filter((typ) => typeof typ === "string") : [];
    return { spiel, oberflaeche: { leisten: leistenGueltig(stand.oberflaeche?.leisten), log, gesehen } };
  } catch {
    return { grund: "fehler" };
  }
}

// Was der Titel über einen Platz wissen muss, ohne den Zustand einzusetzen: null (leer), { vorschau } oder
// { vorschau?, grund: "kaputt" | "version", version? } (veraltet oder unlesbar, nur noch zu löschen oder zu ersetzen)
export function platzVorschau(text) {
  if (!text) return null;
  let stand;
  try {
    stand = JSON.parse(text);
  } catch {
    return { grund: "kaputt" };
  }
  if (!stand || typeof stand !== "object" || !stand.zustand) return { grund: "kaputt" };
  const vorschau = stand.vorschau && typeof stand.vorschau === "object" ? stand.vorschau : null;
  if (stand.version !== VERSION) return { vorschau, grund: "version", version: String(stand.version) };
  return { vorschau: vorschau ?? { tiefe: null, zuege: null, gespeichertAm: null } };
}

// Ein Platz, auf dem sich weiterspielen lässt
export const platzSpielbar = (platz) => Boolean(platz && !platz.grund);

// Stelle für ein neues Spiel: der erste leere Platz, sonst der erste veraltete; null, wenn alle Läufe spielbar sind
// (dann wählt die Spielerin, welcher weichen soll)
export function platzFuerNeuesSpiel(plaetze) {
  const leer = plaetze.findIndex((platz) => platz === null);
  if (leer >= 0) return leer;
  const veraltet = plaetze.findIndex((platz) => platz && platz.grund);
  return veraltet >= 0 ? veraltet : null;
}

// Stelle des zuletzt gespielten spielbaren Laufs oder null
export function zuletztGespielt(plaetze) {
  let beste = null;
  plaetze.forEach((platz, stelle) => {
    if (!platzSpielbar(platz)) return;
    if (beste === null || (platz.vorschau.gespeichertAm ?? 0) > (plaetze[beste].vorschau.gespeichertAm ?? 0)) beste = stelle;
  });
  return beste;
}
