// Spielart "allmaechtig" mit Testkammer (siehe docs/Architektur.md, Spielarten):
// zum Erkunden und Prüfen; alles läuft über die Startoptionen und die Eingangstür, damit auch ein Testlauf
// wiederholbar bleibt.
//   Testkammer: der Planschritt "testkammer" setzt regeln.allmacht.kammer als Vorlage der Tiefe regeln.allmacht.tiefe
//     (bisher der Hub) und lässt den Lauf dort beginnen; die übrigen Tiefen sind dieselben wie im normalen Lauf
//   Unverwundbar: Schaden wirkt wie sonst, aber am Haken "vor_tod" füllt die Allmacht Ninkasis Lebenswert wieder auf
//     und bricht den Tod ab (Meldung "allmacht_bewahrt"); sie läuft als letzte, damit andere Rettungen zuerst greifen
//   Befehl { art: "erzeugen", typ }: ohne Zeit; ein Wesen (daten.wesen, nicht abstrakt, nicht Ninkasi) kommt auf das
//     nächste freie, für es betretbare Feld neben Ninkasi und handelt nach einer Aktion Wartezeit, ein Gegenstand
//     (daten.gegenstaende) kommt in ihr Gepäck; Meldung "erzeugt"; Ablehnungen "nicht_allmaechtig",
//     "unbekannter_typ", "kein_freies_feld", "population_voll" (Obergrenze regeln.population.hoechstWesen)
//   Befehl { art: "tiefe_waehlen", tiefe }: Wechsel in jede Tiefe des Plans wie über eine Treppe (systeme/ebenen.js
//     ebeneWechseln, Zeitkosten aktionen.treppe); Ablehnungen "nicht_allmaechtig", "keine_tiefe", "schon_dort"
// Beide Befehle gehen nur an Ninkasi selbst.

import { anmelden, RANG_VORGABE } from "../kern/register.js";
import { ausDatenErzeugen, anzahlWesen, spielerin } from "../kern/zustand.js";
import { akteurEinreihen } from "../kern/zeit.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { lebenswertName, hoechstwert, wertBegrenztAendern } from "../kern/werte.js";
import { betretbarFuer } from "../welt/karte.js";
import { wesenAufFeld } from "../welt/geometrie.js";
import { naechstesFeldMit } from "../welt/wege.js";
import { ebenennameFuer } from "../welt/plan.js";
import { ebeneWechseln } from "./ebenen.js";
import { insInventar } from "./inventar.js";

const RANG_ALLMACHT = RANG_VORGABE * 10;

export function istAllmaechtig(spiel) {
  return spiel.optionen?.spielart === "allmaechtig";
}

// Was sich erzeugen lässt, je Art nach Namen geordnet (für die Befehlszeile und den Bot)
export function erzeugbareTypen(daten) {
  const wesen = Object.keys(daten.wesen).filter((typ) => typ !== "ninkasi" && !daten.wesen[typ].abstrakt).sort();
  const gegenstaende = Object.keys(daten.gegenstaende).filter((typ) => !daten.gegenstaende[typ].abstrakt).sort();
  return { wesen, gegenstaende };
}

function artDesTyps(daten, typ) {
  const { wesen, gegenstaende } = erzeugbareTypen(daten);
  if (wesen.includes(typ)) return "wesen";
  if (gegenstaende.includes(typ)) return "gegenstand";
  return null;
}

function freiesFeldFuer(spiel, ninkasi, typ) {
  const bewegung = spiel.daten.wesen[typ].bewegung ?? "laufend";
  // nur Felder, die jetzt offen sind: auf einer geschlossenen Tür stünde das Wesen in der Wand
  return naechstesFeldMit(spiel, ninkasi.position, (x, y) => betretbarFuer(spiel, x, y, bewegung, false) && wesenAufFeld(spiel, { x, y }).length === 0, { bewegung });
}

function nurNinkasiAllmaechtig(spiel, akteur) {
  if (!istAllmaechtig(spiel)) return "nicht_allmaechtig";
  return akteur.id === spiel.zustand.spielerinId ? null : "ungueltig";
}

anmelden("planschritte", "testkammer", (spiel, plan) => {
  if (!istAllmaechtig(spiel)) return;
  const { kammer, tiefe } = spiel.daten.regeln.allmacht;
  plan.tiefen[tiefe] = { vorlage: kammer, inhalte: [] };
  plan.starttiefe = tiefe;
});

anmelden("haken", "vor_tod", (spiel, kontext) => {
  if (!istAllmaechtig(spiel) || kontext.zielId !== spiel.zustand.spielerinId) return;
  const ninkasi = spielerin(spiel.zustand);
  const wertName = lebenswertName(ninkasi);
  wertBegrenztAendern(spiel, ninkasi, wertName, hoechstwert(spiel, ninkasi, wertName) - ninkasi.werte[wertName].aktuell);
  kontext.abgebrochen = true;
  melden(spiel, "allmacht_bewahrt", { wer: bezugAuf(ninkasi) });
}, { rang: RANG_ALLMACHT });

anmelden("befehle", "erzeugen", {
  ohneZeit: true,
  pruefen(spiel, akteur, befehl) {
    const grund = nurNinkasiAllmaechtig(spiel, akteur);
    if (grund) return grund;
    const art = artDesTyps(spiel.daten, befehl.typ);
    if (!art) return "unbekannter_typ";
    if (art === "gegenstand") return null;
    if (anzahlWesen(spiel.zustand) >= spiel.daten.regeln.population.hoechstWesen) return "population_voll";
    return freiesFeldFuer(spiel, akteur, befehl.typ) ? null : "kein_freies_feld";
  },
  ausfuehren(spiel, akteur, befehl) {
    const zustand = spiel.zustand;
    if (artDesTyps(spiel.daten, befehl.typ) === "gegenstand") {
      const neu = ausDatenErzeugen(spiel, "gegenstaende", befehl.typ, null);
      melden(spiel, "erzeugt", { wer: bezugAuf(akteur), was: bezugAuf(neu), wohin: "gepaeck" });
      insInventar(spiel, akteur, neu);
      return;
    }
    const wesen = ausDatenErzeugen(spiel, "wesen", befehl.typ, freiesFeldFuer(spiel, akteur, befehl.typ));
    if (wesen.ki) akteurEinreihen(zustand, wesen.id, spiel.daten.aktionen.warten);
    melden(spiel, "erzeugt", { wer: bezugAuf(akteur), was: bezugAuf(wesen), wohin: "feld" });
  },
});

anmelden("befehle", "tiefe_waehlen", {
  pruefen(spiel, akteur, befehl) {
    const grund = nurNinkasiAllmaechtig(spiel, akteur);
    if (grund) return grund;
    if (!Number.isInteger(befehl.tiefe) || !ebenennameFuer(spiel.zustand, befehl.tiefe)) return "keine_tiefe";
    return befehl.tiefe === spiel.zustand.tiefe ? "schon_dort" : null;
  },
  ausfuehren(spiel, akteur, befehl) {
    ebeneWechseln(spiel, befehl.tiefe);
    return "treppe";
  },
});
