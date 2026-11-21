// Bausteine mit Zielauswahl (siehe docs/Wirkungen.md, Zielauswahl): Sie wählen Felder oder Wesen
// und wenden darauf einen benannten Effekt an. Der innere Effekt teilt die Ablage kontext.werte.
//   fuer_jedes_ziel: { muster, effekt, trifft?, ohneUrheber? } auf jede getroffene Entität im Muster;
//                    schreibt werte.anzahlZiele (für teilen), Meldung "flaeche"
//   auf_feld:        { muster, effekt } auf jedes Feld, auch leere (Ziel null, Zielfeld das Feld), Meldung "flaeche"
//   geschoss:        { reichweite, effekt, durchdringend?, ueberZielHinaus?, ueberVerbuendete? } vom Ursprung zum Zielfeld;
//                    der Effekt wirkt am ersten Wesen oder am Aufschlag (dort Ursprung und Zielfeld),
//                    durchdringend auf jedes Wesen der Bahn; Meldung "geschoss"
//   springen:        { anzahl, reichweite, effekt, trifft?, ohneUrheber?, wahl? } wirkt auf das Ziel und springt
//                    bis zu anzahl Mal zum nächsten noch nicht getroffenen lebenden Wesen im Kreis mit Sichtlinie;
//                    werte.getroffeneIds, werte.sprungnummer (0 für das erste Ziel); je Sprung Meldung "geschoss"
// trifft: siehe systeme/zielauswahl.js; Vorgabe "alle", bei springen "wesen". wahl: "naechstes" (Vorgabe) | "zufaellig"

import { bausteinAnmelden } from "../kern/bausteine.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { zufallsGanzzahl } from "../kern/zufall.js";
import { lebenswertName } from "../kern/werte.js";
import { flugbahn, linie } from "../welt/geometrie.js";
import { musterFelder, entitaetenAufFeldern, verbuendeteUeberspringen, TRIFFT_ARTEN } from "./zielauswahl.js";

const feldKopie = (feld) => ({ x: feld.x, y: feld.y });

function quellbezug(spiel, kontext) {
  const quelle = spiel.zustand.entitaeten[kontext.quelleId];
  return quelle ? bezugAuf(quelle) : null;
}

function felderDesMusters(spiel, kontext, muster) {
  if (!kontext.ursprung) return [];
  return musterFelder(spiel, muster, { ursprung: kontext.ursprung, zielpunkt: kontext.zielfeld ?? kontext.ursprung, quelleId: kontext.quelleId });
}

function trefferoptionen(kontext, parameter, trifftVorgabe) {
  return { trifft: parameter.trifft ?? trifftVorgabe, urheberId: kontext.urheberId, urheberFraktion: kontext.urheberFraktion, ohneUrheber: Boolean(parameter.ohneUrheber) };
}

// Wendet den Effekt auf ein Wesen an, sofern es noch im Spiel ist
function aufEntitaet(spiel, kontext, effektName, entitaet, abweichung = {}) {
  if (!spiel.zustand.entitaeten[entitaet.id]) return;
  effektAnwenden(spiel, effektName, { ...kontext, zielId: entitaet.id, zielfeld: feldKopie(entitaet.position), ...abweichung });
}

const TREFFER = { trifft: TRIFFT_ARTEN, ohneUrheber: "wahrheitswert?" };

bausteinAnmelden("fuer_jedes_ziel", { muster: "muster", effekt: "effekt", ...TREFFER }, (spiel, kontext, parameter) => {
  const felder = felderDesMusters(spiel, kontext, parameter.muster);
  if (!felder.length) return;
  melden(spiel, "flaeche", { quelle: quellbezug(spiel, kontext), felder });
  const ziele = entitaetenAufFeldern(spiel, felder, trefferoptionen(kontext, parameter, "alle"));
  kontext.werte.anzahlZiele = ziele.length;
  for (const ziel of ziele) aufEntitaet(spiel, kontext, parameter.effekt, ziel);
});

bausteinAnmelden("auf_feld", { muster: "muster", effekt: "effekt" }, (spiel, kontext, parameter) => {
  const felder = felderDesMusters(spiel, kontext, parameter.muster);
  if (!felder.length) return;
  melden(spiel, "flaeche", { quelle: quellbezug(spiel, kontext), felder });
  for (const feld of felder) effektAnwenden(spiel, parameter.effekt, { ...kontext, zielId: null, zielfeld: feld });
});

bausteinAnmelden("geschoss", { reichweite: "ganzzahl", effekt: "effekt", durchdringend: "wahrheitswert?", ueberZielHinaus: "wahrheitswert?", ueberVerbuendete: "wahrheitswert?" }, (spiel, kontext, parameter) => {
  if (!kontext.ursprung || !kontext.zielfeld) return;
  const ueberspringen = parameter.ueberVerbuendete ? verbuendeteUeberspringen(spiel, { id: kontext.urheberId, fraktion: kontext.urheberFraktion ?? null }) : null;
  const bahn = flugbahn(spiel, kontext.ursprung, kontext.zielfeld, { ...parameter, ueberspringen });
  melden(spiel, "geschoss", { quelle: quellbezug(spiel, kontext), bahn: bahn.felder, aufschlag: bahn.aufschlag });
  const entitaeten = spiel.zustand.entitaeten;
  if (parameter.durchdringend) {
    for (const getroffenId of bahn.getroffene) {
      const getroffen = entitaeten[getroffenId];
      if (getroffen) aufEntitaet(spiel, kontext, parameter.effekt, getroffen, { ursprung: feldKopie(getroffen.position) });
    }
    return;
  }
  const zielId = bahn.getroffene[0] ?? null;
  effektAnwenden(spiel, parameter.effekt, { ...kontext, zielId, ursprung: bahn.aufschlag, zielfeld: bahn.aufschlag });
});

function lebt(entitaet) {
  const lebenswert = entitaet.werte?.[lebenswertName(entitaet)];
  return !lebenswert || lebenswert.aktuell > 0;
}

const SPRUNGWAHL = ["naechstes", "zufaellig"];

bausteinAnmelden("springen", { anzahl: "ganzzahl", reichweite: "ganzzahl", effekt: "effekt", ...TREFFER, wahl: SPRUNGWAHL }, (spiel, kontext, parameter) => {
  const zustand = spiel.zustand;
  const erstesZiel = zustand.entitaeten[kontext.zielId] ?? null;
  let position = erstesZiel?.position ?? kontext.zielfeld;
  if (!position) return;
  position = feldKopie(position);
  const getroffeneIds = [];
  const treffen = (ziel) => {
    kontext.werte.sprungnummer = getroffeneIds.length;
    getroffeneIds.push(ziel.id);
    kontext.werte.getroffeneIds = [...getroffeneIds];
    aufEntitaet(spiel, kontext, parameter.effekt, ziel);
  };
  if (erstesZiel) treffen(erstesZiel);
  const optionen = trefferoptionen(kontext, parameter, "wesen");
  for (let sprung = 0; sprung < parameter.anzahl; sprung++) {
    const umkreis = musterFelder(spiel, { art: "kreis", radius: parameter.reichweite }, { ursprung: position, zielpunkt: position, quelleId: kontext.quelleId });
    const kandidaten = entitaetenAufFeldern(spiel, umkreis, optionen).filter((entitaet) => !getroffeneIds.includes(entitaet.id) && lebt(entitaet));
    if (!kandidaten.length) break;
    const naechstes = parameter.wahl === "zufaellig" ? kandidaten[zufallsGanzzahl(zustand.zufallszustand, 0, kandidaten.length - 1)] : kandidaten[0];
    const ankunft = feldKopie(naechstes.position);
    melden(spiel, "geschoss", { quelle: quellbezug(spiel, kontext), bahn: linie(position, ankunft).slice(1), aufschlag: ankunft });
    treffen(naechstes);
    position = ankunft;
  }
});
