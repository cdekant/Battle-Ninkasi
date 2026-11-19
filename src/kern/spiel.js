// Das Spiel: Zustand, Daten und die einzige Eingangstür für Befehle.
// spiel = { daten, zustand, befehle, hoerer, zwischenspeicher, anstehendeAusloeser }
//   zustand: reine Daten (JSON), befehle: Aufzeichnung für den Spielstand,
//   hoerer: Empfänger der Meldungen, zwischenspeicher: abgeleitete Nachschlagetabellen (nicht im Zustand),
//   anstehendeAusloeser: vorgemerkte Auslöser, nach jedem Vorgang leer (siehe kern/vorgang.js)

import "./bausteine.js";
import "./ausloeser.js";
import "../systeme/index.js";
import "../ki/index.js";
import VERSION from "../version.js";
import { vorbereiten, Datenfehler } from "./daten.js";
import { neuerZustand, entitaetMitId, alleEntitaeten, spielerin, kiVon } from "./zustand.js";
import { zufallErzeugen, startwertAbleiten } from "./zufall.js";
import { WELTTICK, einreihen, ersterEintrag, ersterEintragEntnehmen, akteurEinreihen } from "./zeit.js";
import { holen, hat, alle as alleImRegister } from "./register.js";
import { modifiziert } from "./werte.js";
import { melden, bezugAuf, hakenAusloesen } from "./ereignisse.js";
import { vorgangAbschliessen } from "./vorgang.js";
import { ebeneErzeugen } from "../welt/ebene.js";
import { sichtfeldAktualisieren } from "../systeme/sicht.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { aktionAbbrechen, laufendeAktionVorDemZug } from "../systeme/laufendeAktionen.js";
import { wahrnehmen } from "../systeme/wahrnehmung.js";

// Rohdaten prüfen und vorbereiten; wirft Datenfehler mit allen Meldungen.
// sprache: { texte, nomenPruefen? } (siehe kern/daten.js)
export function datenLaden(rohdaten, sprache) {
  const { daten, fehler } = vorbereiten(rohdaten, sprache);
  if (fehler.length) throw new Datenfehler(fehler);
  return daten;
}

export function neuesSpiel(daten, startwert) {
  const zustand = neuerZustand(startwert >>> 0);
  const spiel = { daten, zustand, befehle: [], hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
  zustand.zufallszustand = zufallErzeugen(startwertAbleiten(zustand.startwert, "spiel"));

  ebeneErzeugen(spiel, daten.startebene);
  for (const entitaet of alleEntitaeten(zustand)) {
    if (entitaet.id === zustand.spielerinId || entitaet.ki) akteurEinreihen(zustand, entitaet.id, 0);
  }
  einreihen(zustand, { zeit: WELTTICK, art: "weltuhr" });
  sichtfeldAktualisieren(spiel);
  warteschlangeAbarbeiten(spiel);
  return spiel;
}

// Zeitkosten einer Aktion für eine Entität, mit Modifikatoren für die Aktion und für alle; umstaende siehe kern/werte.js
// grundkosten: abweichende Grundkosten (z.B. eines Angriffsprofils), Vorgabe aus daten/aktionen.js
export function zeitkosten(spiel, entitaet, aktion, umstaende = {}, grundkosten = spiel.daten.aktionen[aktion]) {
  if (grundkosten === undefined) throw new Error(`Keine Kosten für Aktion "${aktion}" in daten/aktionen.js`);
  return Math.max(1, modifiziert(spiel, entitaet, [`kosten.${aktion}`, "kosten.alle"], grundkosten, umstaende));
}

// Ninkasi wartet auf eine Eingabe, außer ein Zustand gibt ihr eine KI (Furcht, Rausch, Psi-Kontrolle)
// oder eine lange Aktion läuft ohne Unterbrechung weiter
function wartetAufEingabe(zustand, eintrag) {
  if (!eintrag || eintrag.art !== "akteur" || eintrag.akteurId !== zustand.spielerinId) return false;
  const ninkasi = spielerin(zustand);
  const aktionLaeuft = ninkasi.laufendeAktion && !ninkasi.laufendeAktion.unterbrochen;
  return !kiVon(ninkasi) && !aktionLaeuft;
}

export function spielerinAmZug(spiel) {
  const zustand = spiel.zustand;
  return !zustand.vorbei && wartetAufEingabe(zustand, ersterEintrag(zustand));
}

// Gibt null zurück, wenn der Befehl gültig ist, sonst den Grund der Ablehnung
function befehlPruefen(spiel, akteur, befehl) {
  if (!befehl || typeof befehl.art !== "string" || !hat("befehle", befehl.art)) return "unbekannt";
  return holen("befehle", befehl.art).pruefen(spiel, akteur, befehl);
}

// Haken "vor_befehl": Zustände dürfen den Befehl verändern (Torkeln, Verwirrung); ein abgebrochener oder
// ungültig gewordener Befehl wird zu warten
function befehlVeraendern(spiel, akteur, befehl) {
  const kontext = hakenAusloesen(spiel, "vor_befehl", { akteurId: akteur.id, quelleId: akteur.id, zielId: null, kettentiefe: 0, befehl, abgebrochen: false });
  if (kontext.abgebrochen || befehlPruefen(spiel, akteur, kontext.befehl)) return { art: "warten" };
  return kontext.befehl;
}

// Führt einen gültigen Befehl aus, schließt den Vorgang ab und reiht die Akteurin wieder ein; gibt die Zeitkosten zurück
// (exportiert für Tests, im Spiel nur über befehlGeben und die KI)
export function befehlAusfuehren(spiel, akteur, befehl) {
  const wirksamerBefehl = befehlVeraendern(spiel, akteur, befehl);
  // jeder andere Befehl als "fortsetzen" bricht eine laufende Aktion ab
  if (akteur.laufendeAktion && wirksamerBefehl.art !== "fortsetzen") aktionAbbrechen(spiel, akteur, "befehl");
  // ausfuehren gibt die Aktionsart zurück oder { aktion, grundkosten?, umstaende? }
  const ergebnis = holen("befehle", wirksamerBefehl.art).ausfuehren(spiel, akteur, wirksamerBefehl);
  const { aktion, grundkosten, umstaende = {} } = typeof ergebnis === "string" ? { aktion: ergebnis } : ergebnis;
  // Zugzähler: jede ausgeführte Aktion zählt als ein eigener Zug (Abklingzeit der Fähigkeiten);
  // die letzte Aktion bestimmt die Heimlichkeitsweite (systeme/wahrnehmung.js)
  akteur.zuege = (akteur.zuege ?? 0) + 1;
  akteur.letzteAktion = aktion;
  vorgangAbschliessen(spiel);
  const zustand = spiel.zustand;
  const akteurNochImSpiel = entitaetMitId(zustand, akteur.id) && !(akteur.id === zustand.spielerinId && zustand.vorbei);
  if (!akteurNochImSpiel) return null;
  const kosten = zeitkosten(spiel, akteur, aktion, umstaende, grundkosten);
  akteurEinreihen(zustand, akteur.id, kosten);
  return kosten;
}

// Die Eingangstür: einziger Weg, wie Entscheidungen der Spielerin in die Logik gelangen.
// Gibt { ok: true } oder { ok: false, grund } zurück; abgelehnte Befehle kosten nichts.
// Ist Ninkasi handlungsunfähig, wird jede Eingabe angenommen, aufgezeichnet und als warten ausgeführt
// (Meldung "handlungsunfaehig", Rückgabe { ok: true, handlungsunfaehig: true }).
export function befehlGeben(spiel, befehl) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { ok: false, grund: "vorbei" };
  if (!spielerinAmZug(spiel)) return { ok: false, grund: "nicht_am_zug" };
  const ninkasi = spielerin(zustand);
  if (istHandlungsunfaehig(spiel, ninkasi)) {
    spiel.befehle.push(structuredClone(befehl ?? null));
    melden(spiel, "handlungsunfaehig", { wer: bezugAuf(ninkasi) });
    ersterEintragEntnehmen(zustand);
    befehlAusfuehren(spiel, ninkasi, { art: "warten" });
    warteschlangeAbarbeiten(spiel);
    return { ok: true, handlungsunfaehig: true };
  }
  const grund = befehlPruefen(spiel, ninkasi, befehl);
  if (grund) {
    melden(spiel, "abgelehnt", { grund, befehl });
    return { ok: false, grund };
  }
  spiel.befehle.push(structuredClone(befehl));
  ersterEintragEntnehmen(zustand);
  befehlAusfuehren(spiel, ninkasi, befehl);
  warteschlangeAbarbeiten(spiel);
  return { ok: true };
}

// Arbeitet die Warteschlange ab, bis Ninkasi am Zug ist oder das Spiel vorbei ist (exportiert für Tests)
export function warteschlangeAbarbeiten(spiel) {
  const zustand = spiel.zustand;
  let schleifenschutz = 0;
  while (!zustand.vorbei) {
    const eintrag = ersterEintrag(zustand);
    if (!eintrag) return;
    // lange Aktion: die Logik führt den nächsten Schritt selbst aus, sofern nichts unterbricht
    const akteurMitAktion = eintrag.art === "akteur" ? entitaetMitId(zustand, eintrag.akteurId) : null;
    if (akteurMitAktion?.laufendeAktion) {
      const weiter = laufendeAktionVorDemZug(spiel, akteurMitAktion);
      vorgangAbschliessen(spiel);
      if (zustand.vorbei) return;
      if (weiter) {
        ersterEintragEntnehmen(zustand);
        befehlAusfuehren(spiel, akteurMitAktion, { art: "fortsetzen" });
        if (++schleifenschutz > 1000000) throw new Error("Warteschlange läuft endlos");
        continue;
      }
    }
    if (wartetAufEingabe(zustand, eintrag)) return;
    ersterEintragEntnehmen(zustand);
    if (eintrag.art === "weltuhr") {
      for (const [, handler] of alleImRegister("welttick")) {
        handler(spiel);
        vorgangAbschliessen(spiel);
      }
      einreihen(zustand, { zeit: zustand.zeit + WELTTICK, art: "weltuhr" });
    } else if (eintrag.art === "ereignis") {
      holen("zeitereignisse", eintrag.ereignistyp)(spiel, eintrag.daten);
      vorgangAbschliessen(spiel);
    } else {
      const akteur = entitaetMitId(zustand, eintrag.akteurId);
      const ki = akteur && kiVon(akteur);
      if (!ki) continue;
      wahrnehmen(spiel, akteur);
      let befehl = istHandlungsunfaehig(spiel, akteur) ? { art: "warten" } : holen("ki", ki.modul)(spiel, akteur, ki);
      if (befehlPruefen(spiel, akteur, befehl)) befehl = { art: "warten" };
      befehlAusfuehren(spiel, akteur, befehl);
    }
    if (++schleifenschutz > 1000000) throw new Error("Warteschlange läuft endlos");
  }
}

// Spielstand = Version + Startwert + Befehlsliste; Laden heißt Nachspielen ohne Anzeige
export function spielstand(spiel) {
  return { version: VERSION, startwert: spiel.zustand.startwert, befehle: structuredClone(spiel.befehle) };
}

export function nachspielen(daten, stand) {
  if (stand.version !== VERSION) throw new Error(`Spielstand von Version ${stand.version}, dieses Spiel ist ${VERSION}`);
  const spiel = neuesSpiel(daten, stand.startwert);
  stand.befehle.forEach((befehl, nummer) => {
    const ergebnis = befehlGeben(spiel, befehl);
    if (!ergebnis.ok) throw new Error(`Spielstand passt nicht: Befehl ${nummer} abgelehnt (${ergebnis.grund})`);
  });
  return spiel;
}
