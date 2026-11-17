// Das Spiel: Zustand, Daten und die einzige Eingangstür für Befehle.
// spiel = { daten, zustand, befehle, hoerer, cache }
//   zustand: reine Daten (JSON), befehle: Aufzeichnung für den Spielstand,
//   hoerer: Empfänger der Meldungen, cache: abgeleitete Nachschlagetabellen (nicht im Zustand)

import "./bausteine.js";
import "../systeme/index.js";
import "../ki/index.js";
import VERSION from "../version.js";
import { vorbereiten, Datenfehler } from "./daten.js";
import { neuerZustand, holen as entitaet, alle, spieler } from "./zustand.js";
import { erzeugen as rngErzeugen, ableiten } from "./zufall.js";
import { WELTTICK, einreihen, erster, entnehmen, akteurEinreihen } from "./zeit.js";
import { holen, hat, alle as registerAlle } from "./register.js";
import { modifiziert } from "./werte.js";
import { melden } from "./ereignisse.js";
import { erzeugen as ebeneErzeugen } from "../welt/ebene.js";
import { aktualisieren as sichtAktualisieren } from "../systeme/sicht.js";

// Rohdaten prüfen und vorbereiten; wirft Datenfehler mit allen Meldungen
export function datenLaden(roh, texte) {
  const { daten, fehler } = vorbereiten(roh, texte);
  if (fehler.length) throw new Datenfehler(fehler);
  return daten;
}

export function neuesSpiel(daten, startwert) {
  const zustand = neuerZustand(startwert >>> 0);
  const spiel = { daten, zustand, befehle: [], hoerer: [], cache: {} };
  zustand.rng = rngErzeugen(ableiten(zustand.startwert, "spiel"));

  ebeneErzeugen(spiel, daten.startebene);
  for (const ent of alle(zustand)) {
    if (ent.id === zustand.spielerId || ent.ki) akteurEinreihen(zustand, ent.id, 0);
  }
  einreihen(zustand, { zeit: WELTTICK, art: "weltuhr" });
  sichtAktualisieren(spiel);
  weiter(spiel);
  return spiel;
}

// Zeitkosten einer Aktion für eine Entität, mit Modifikatoren für die Aktion und für alle
export function kosten(spiel, ent, aktion) {
  const basis = spiel.daten.aktionen[aktion];
  if (basis === undefined) throw new Error(`Keine Kosten für Aktion "${aktion}" in daten/aktionen.js`);
  return Math.max(1, modifiziert(ent, [`kosten.${aktion}`, "kosten.alle"], basis));
}

export function amZug(spiel) {
  const z = spiel.zustand;
  if (z.vorbei) return false;
  const e = erster(z);
  return Boolean(e && e.art === "akteur" && e.id === z.spielerId);
}

function pruefen(spiel, akteur, befehl) {
  if (!befehl || typeof befehl.art !== "string" || !hat("befehle", befehl.art)) return "unbekannt";
  return holen("befehle", befehl.art).pruefen(spiel, akteur, befehl);
}

function ausfuehren(spiel, akteur, befehl) {
  const aktion = holen("befehle", befehl.art).ausfuehren(spiel, akteur, befehl);
  const z = spiel.zustand;
  const nochDa = entitaet(z, akteur.id) && !(akteur.id === z.spielerId && z.vorbei);
  if (nochDa) akteurEinreihen(z, akteur.id, kosten(spiel, akteur, aktion));
}

// Die Eingangstür: einziger Weg, wie Entscheidungen der Spielerin in die Logik gelangen.
// Gibt { ok: true } oder { ok: false, grund } zurück; abgelehnte Befehle kosten nichts.
export function befehl(spiel, b) {
  const z = spiel.zustand;
  if (z.vorbei) return { ok: false, grund: "vorbei" };
  if (!amZug(spiel)) return { ok: false, grund: "nicht_am_zug" };
  const p = spieler(z);
  const grund = pruefen(spiel, p, b);
  if (grund) {
    melden(spiel, "abgelehnt", { grund, befehl: b });
    return { ok: false, grund };
  }
  spiel.befehle.push(structuredClone(b));
  entnehmen(z);
  ausfuehren(spiel, p, b);
  weiter(spiel);
  return { ok: true };
}

// Arbeitet die Warteschlange ab, bis Ninkasi am Zug ist oder das Spiel vorbei ist
function weiter(spiel) {
  const z = spiel.zustand;
  let schutz = 0;
  while (!z.vorbei) {
    const e = erster(z);
    if (!e || (e.art === "akteur" && e.id === z.spielerId)) return;
    entnehmen(z);
    if (e.art === "weltuhr") {
      for (const [, handler] of registerAlle("welttick")) handler(spiel);
      einreihen(z, { zeit: z.zeit + WELTTICK, art: "weltuhr" });
    } else if (e.art === "ereignis") {
      holen("zeitereignisse", e.typ)(spiel, e.daten);
    } else {
      const ent = entitaet(z, e.id);
      if (!ent || !ent.ki) continue;
      let b = holen("ki", ent.ki.modul)(spiel, ent);
      if (pruefen(spiel, ent, b)) b = { art: "warten" };
      ausfuehren(spiel, ent, b);
    }
    if (++schutz > 1000000) throw new Error("Warteschlange läuft endlos");
  }
}

// Spielstand = Version + Startwert + Befehlsliste; Laden heißt Nachspielen ohne Anzeige
export function spielstand(spiel) {
  return { version: VERSION, startwert: spiel.zustand.startwert, befehle: structuredClone(spiel.befehle) };
}

export function nachspielen(daten, stand) {
  if (stand.version !== VERSION) throw new Error(`Spielstand von Version ${stand.version}, dieses Spiel ist ${VERSION}`);
  const spiel = neuesSpiel(daten, stand.startwert);
  stand.befehle.forEach((b, i) => {
    const r = befehl(spiel, b);
    if (!r.ok) throw new Error(`Spielstand passt nicht: Befehl ${i} abgelehnt (${r.grund})`);
  });
  return spiel;
}
