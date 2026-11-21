// Lange Aktionen (siehe docs/Wirkungen.md, Lange Aktionen): Rituale, später Brauen, laufen über mehrere Schritte.
// Komponente an der Akteurin:
//   laufendeAktion: { art, schritteGesamt, schritteErledigt, unterbrochen: null | Grund, lage, unterbrechbar?, ...Daten der Art }
//   unterbrechbar: Liste der Gründe, die die Aktion sofort abbrechen, für jedes Wesen (UNTERBRECHUNGSGRUENDE):
//     "schaden" (Haken nach_schaden), "versetzt" (von einer anderen Urheberin bewegt, systeme/bewegung.js)
// Register "laufendeaktionen": art -> {
//   schrittkosten(spiel, akteur, aktion) => { aktion, grundkosten?, umstaende? }  Zeitkosten eines Schritts
//   abschliessen(spiel, akteur, aktion)          nach dem letzten Schritt
//   abbrechen(spiel, akteur, aktion, grund)      beim Abbruch; bezahlte Kosten bleiben bezahlt
// }
// Ablauf: der startende Befehl führt den ersten Schritt aus; ist die Akteurin wieder dran, führt die Logik den
// nächsten Schritt ohne Eingabe aus (Befehl "fortsetzen", nicht aufgezeichnet). Bei Ninkasi laufen davor die
// Gefahrenprüfungen aus regeln.laufendeAktionen.unterbrechen gegen die Lage beim letzten Schritt; trifft eine zu,
// pausiert die Aktion (Meldung "aktion_unterbrochen") und Ninkasi wird gefragt: "fortsetzen" macht weiter,
// jeder andere Befehl bricht ab (kern/spiel.js). Handlungsunfähig bricht ab.

import { anmelden, holen } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { lageErfassen, gefahrPruefen } from "./gefahr.js";
import { istHandlungsunfaehig } from "./zustaende.js";

export const UNTERBRECHUNGSGRUENDE = ["schaden", "versetzt"];

const istSpielerin = (spiel, akteur) => akteur.id === spiel.zustand.spielerinId;
const eintragVon = (aktion) => holen("laufendeaktionen", aktion.art);

function lageMerken(spiel, akteur, aktion) {
  aktion.lage = istSpielerin(spiel, akteur) ? lageErfassen(spiel) : null;
}

// Führt einen Schritt aus; nach dem letzten wird die Aktion abgeschlossen. Gibt das Ergebnis für die Zeitkosten zurück.
function schrittAusfuehren(spiel, akteur) {
  const aktion = akteur.laufendeAktion;
  aktion.schritteErledigt++;
  const ergebnis = eintragVon(aktion).schrittkosten(spiel, akteur, aktion);
  lageMerken(spiel, akteur, aktion);
  if (aktion.schritteErledigt >= aktion.schritteGesamt) {
    delete akteur.laufendeAktion;
    eintragVon(aktion).abschliessen(spiel, akteur, aktion);
  }
  return ergebnis;
}

// Beginnt eine lange Aktion und führt ihren ersten Schritt aus; aktion: { art, schritteGesamt, unterbrechbar?, ...Daten der Art }
// meldungszusatz: weitere Angaben in der Meldung "aktion_beginnt", z.B. Ankündigung und Zielfelder einer Fähigkeit
export function aktionBeginnen(spiel, akteur, aktion, meldungszusatz = {}) {
  akteur.laufendeAktion = { ...aktion, schritteErledigt: 0, unterbrochen: null, lage: null };
  melden(spiel, "aktion_beginnt", { ...meldungszusatz, wer: bezugAuf(akteur), aktionsart: aktion.art, schritte: aktion.schritteGesamt });
  return schrittAusfuehren(spiel, akteur);
}

export function aktionAbbrechen(spiel, akteur, grund) {
  const aktion = akteur.laufendeAktion;
  if (!aktion) return;
  delete akteur.laufendeAktion;
  melden(spiel, "aktion_abgebrochen", { wer: bezugAuf(akteur), aktionsart: aktion.art, grund });
  eintragVon(aktion).abbrechen(spiel, akteur, aktion, grund);
}

// Schaden bricht eine unterbrechbare lange Aktion ab
anmelden("haken", "nach_schaden", (spiel, kontext) => {
  const getroffen = spiel.zustand.entitaeten[kontext.zielId];
  if (getroffen?.laufendeAktion?.unterbrechbar?.includes("schaden")) aktionAbbrechen(spiel, getroffen, "schaden");
});

// Vor dem Zug einer Akteurin mit laufender Aktion: Abbruch bei Handlungsunfähigkeit, Pause bei Gefahr (nur Ninkasi).
// Gibt true zurück, wenn die Logik den nächsten Schritt selbst ausführen darf.
export function laufendeAktionVorDemZug(spiel, akteur) {
  const aktion = akteur.laufendeAktion;
  if (!aktion || aktion.unterbrochen) return false;
  if (istHandlungsunfaehig(spiel, akteur)) {
    aktionAbbrechen(spiel, akteur, "handlungsunfaehig");
    return false;
  }
  if (istSpielerin(spiel, akteur) && aktion.lage) {
    const gefahr = gefahrPruefen(aktion.lage, lageErfassen(spiel), spiel.daten.regeln.laufendeAktionen.unterbrechen);
    if (gefahr) {
      aktion.unterbrochen = gefahr;
      melden(spiel, "aktion_unterbrochen", { wer: bezugAuf(akteur), aktionsart: aktion.art, grund: gefahr });
      return false;
    }
  }
  return true;
}

// Befehl "fortsetzen": nächster Schritt einer laufenden Aktion, nach einer Unterbrechung auf Wunsch der Spielerin
anmelden("befehle", "fortsetzen", {
  pruefen(spiel, akteur) {
    return akteur.laufendeAktion ? null : "nichts_laufend";
  },
  ausfuehren(spiel, akteur) {
    akteur.laufendeAktion.unterbrochen = null;
    return schrittAusfuehren(spiel, akteur);
  },
});
