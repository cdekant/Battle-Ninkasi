// Mehrere Ebenen (siehe docs/Welt.md, Ebenen): Treppen, Wechsel der Ebene, verlassene Ebenen ruhen.
// Befehl { art: "treppe" }: nur Ninkasi, auf einem Gelände mit treppe: "ab" oder "auf"; Ablehnung "keine_treppe",
//   wenn dort keine Treppe ist oder es die Tiefe nicht gibt. Zeitkosten aktionen.treppe.
// Wechsel: die alte Ebene wird samt ihrer Entitäten (alles außer den Mitgenommenen) und deren Einträgen der
//   Warteschlange (Akteure, gebundene Zeitereignisse) in zustand.abgelegteEbenen[tiefe] gelegt, mit dem Zeitpunkt.
// Mitnehmen: das Register "mitnehmen" sammelt, wer mitkommt, je Eintrag (spiel, ninkasi, wechsel) => [id] mit
//   wechsel = { von, nach, richtung }; angemeldet sind "getragenes" (Ninkasi selbst) und "verfolger" (wer neben ihr
//   steht und sie jagt, und ihre Beschworenen, siehe verfolgt); was ein Mitgenommener trägt, kommt immer mit.
//   Mitgenommene Wesen behalten ihren Platz in der Warteschlange und kommen auf das nächste freie, für sie betretbare
//   Feld neben Ninkasi (Meldung "gefolgt"); findet sich keins, bleiben sie auf der alten Ebene an ihrem Platz.
//   Kommt Ninkasi zurück, ruht die Ebene nachträglich: alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände)
//   rücken um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt (welt/ebene.js), ihre Wesen eingereiht.
//   Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien
//   Feld. Der Wechsel verwirft den räumlichen Index; die Position Ninkasis wird deshalb hier direkt gesetzt, der Index
//   entsteht danach neu. Meldung "ebene_gewechselt". Die Weltuhr läuft weiter, sie gehört keiner Ebene.

import { anmelden, alle } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { spielerin, entitaetenAuf, entitaetenMitPosition, istWesen, kiVon, bewegungVon, fraktionVon } from "../kern/zustand.js";
import { indexVerwerfen } from "../kern/raumindex.js";
import { akteurEinreihen, eintraegeHerausnehmen, eintraegeEinfuegen } from "../kern/zeit.js";
import { gelaendeAuf, betretbar, abstand, oeffnetTueren } from "../welt/karte.js";
import { naechstesFeldMit } from "../welt/wege.js";
import { ebeneErzeugen } from "../welt/ebene.js";
import { ebenennameFuer } from "../welt/plan.js";
import { sichtfeldAktualisieren } from "./sicht.js";
import { erinnerungAuffrischen } from "./erinnerung.js";
import { istHandlungsunfaehig } from "./zustaende.js";
import { istUnbeweglich } from "./bewegung.js";
import { wachzustandVon } from "./wahrnehmung.js";
import { trifftZu } from "./zielauswahl.js";

const RICHTUNG = { ab: 1, auf: -1 };

// Ob ein Wesen Ninkasi über die Treppe folgt (Vorbilder Brogue und NetHack): es steht höchstens regeln.ebenen.folgen.abstand
// Felder entfernt, kann handeln und sich bewegen, trägt nicht folgt: false, und es jagt sie (KI "jagen" im Wachzustand
// "jagt", sie ist sein Ziel; wer flieht, hat eine andere KI) oder ist von ihr beschworen
export function verfolgt(spiel, wesen, ninkasi) {
  if (wesen.id === ninkasi.id || !istWesen(wesen) || !wesen.position || wesen.folgt === false) return false;
  if (abstand(wesen.position, ninkasi.position) > spiel.daten.regeln.ebenen.folgen.abstand) return false;
  if (istHandlungsunfaehig(spiel, wesen) || istUnbeweglich(wesen)) return false;
  if (wesen.beschworenVon === ninkasi.id) return true;
  const ki = kiVon(wesen);
  if (ki?.modul !== "jagen" || wachzustandVon(wesen) !== "jagt") return false;
  return trifftZu(spiel, ki.trifft ?? "feinde", { id: wesen.id, fraktion: fraktionVon(wesen) ?? null }, ninkasi);
}

anmelden("mitnehmen", "getragenes", (spiel, ninkasi) => [ninkasi.id]);
anmelden("mitnehmen", "verfolger", (spiel, ninkasi) =>
  entitaetenMitPosition(spiel.zustand).filter((wesen) => verfolgt(spiel, wesen, ninkasi)).map((wesen) => wesen.id));

// Eine Entität und alles, was sie (auch verschachtelt) trägt
function mitGetragenem(zustand, startIds) {
  const ids = new Set();
  const offen = [...startIds];
  while (offen.length) {
    const id = offen.pop();
    if (ids.has(id) || !zustand.entitaeten[id]) continue;
    ids.add(id);
    offen.push(...(zustand.entitaeten[id].inventar || []));
  }
  return ids;
}

// Alle IDs, die mitkommen: die der Einträge im Register und was sie tragen
function mitgenommen(spiel, ninkasi, wechsel) {
  return mitGetragenem(spiel.zustand, alle("mitnehmen").flatMap(([, eintrag]) => eintrag(spiel, ninkasi, wechsel)));
}

function ebeneAblegen(spiel, bleibt) {
  const zustand = spiel.zustand;
  const entitaeten = {};
  for (const [id, entitaet] of Object.entries(zustand.entitaeten)) {
    if (bleibt.has(Number(id))) continue;
    entitaeten[id] = entitaet;
    delete zustand.entitaeten[id];
  }
  const gehoertZurEbene = (eintrag) => (eintrag.art === "akteur" && eintrag.akteurId in entitaeten) || (eintrag.gebundenAn !== undefined && eintrag.gebundenAn in entitaeten);
  const warteschlange = eintraegeHerausnehmen(zustand, gehoertZurEbene);
  zustand.abgelegteEbenen[zustand.tiefe] = { ebene: zustand.ebene, entitaeten, warteschlange, abgelegtUm: zustand.zeit };
}

// Holt eine abgelegte Ebene zurück; alle Zeitangaben rücken um die vergangene Zeit nach (die Ebene hat geruht)
function ebeneZurueckholen(spiel, tiefe) {
  const zustand = spiel.zustand;
  const abgelegt = zustand.abgelegteEbenen[tiefe];
  delete zustand.abgelegteEbenen[tiefe];
  const vergangen = zustand.zeit - abgelegt.abgelegtUm;
  zustand.ebene = abgelegt.ebene;
  for (const [id, entitaet] of Object.entries(abgelegt.entitaeten)) {
    for (const instanz of entitaet.zustaende || []) {
      instanz.beginn += vergangen;
      if (instanz.ende !== null) instanz.ende += vergangen;
    }
    if (entitaet.verdirbtUm !== undefined) entitaet.verdirbtUm += vergangen; // das Verderben ruht mit (systeme/verschleiss.js)
    zustand.entitaeten[id] = entitaet;
  }
  for (const eintrag of abgelegt.warteschlange) eintrag.zeit += vergangen;
  eintraegeEinfuegen(zustand, abgelegt.warteschlange);
}

// Neue Tiefe: erzeugen und die Wesen mit KI einreihen
function ebeneNeuErzeugen(spiel, tiefe) {
  const zustand = spiel.zustand;
  const vorher = new Set(Object.keys(zustand.entitaeten));
  ebeneErzeugen(spiel, tiefe);
  for (const [id, entitaet] of Object.entries(zustand.entitaeten)) {
    if (!vorher.has(id) && entitaet.ki) akteurEinreihen(zustand, entitaet.id, 0);
  }
}

// Felder der Treppen einer Ebene mit der Richtung ("ab" oder "auf")
function treppeIn(spiel, richtung) {
  const ebene = spiel.zustand.ebene;
  for (let y = 0; y < ebene.hoehe; y++) {
    for (let x = 0; x < ebene.breite; x++) if (gelaendeAuf(spiel, x, y)?.treppe === richtung) return { x, y };
  }
  return null;
}

// Legt ein mitgenommenes Wesen samt Getragenem und seinen Einträgen der Warteschlange zurück auf die verlassene Ebene
function zuruecklassen(spiel, wesen, alteTiefe, altePosition) {
  const zustand = spiel.zustand;
  const abgelegt = zustand.abgelegteEbenen[alteTiefe];
  const ids = mitGetragenem(zustand, [wesen.id]);
  wesen.position = { x: altePosition.x, y: altePosition.y };
  for (const id of ids) {
    abgelegt.entitaeten[id] = zustand.entitaeten[id];
    delete zustand.entitaeten[id];
  }
  const gehoertDazu = (eintrag) => (eintrag.art === "akteur" && ids.has(eintrag.akteurId)) || (eintrag.gebundenAn !== undefined && ids.has(eintrag.gebundenAn));
  abgelegt.warteschlange.push(...eintraegeHerausnehmen(zustand, gehoertDazu));
}

// Stellt die mitgenommenen Wesen (außer Ninkasi) neben sie, in der Reihenfolge ihrer ID; ohne freies Feld bleiben sie
// zurück; gibt die IDs der Angekommenen zurück
function verfolgerAufstellen(spiel, ninkasi, alteTiefe, altePositionen) {
  const zustand = spiel.zustand;
  const angekommen = [];
  for (const [id, altePosition] of altePositionen) {
    const wesen = zustand.entitaeten[id];
    const frei = naechstesFeldMit(spiel, ninkasi.position, (x, y) => betretbar(spiel, wesen, { x, y }) && !entitaetenAuf(zustand, x, y).some(istWesen), { bewegung: bewegungVon(wesen), oeffnetTueren: oeffnetTueren(wesen) });
    if (!frei) {
      zuruecklassen(spiel, wesen, alteTiefe, altePosition);
      continue;
    }
    wesen.position = { x: frei.x, y: frei.y };
    indexVerwerfen(zustand);
    const ki = kiVon(wesen);
    if (ki && "letzteBekanntePosition" in ki) ki.letzteBekanntePosition = { x: ninkasi.position.x, y: ninkasi.position.y };
    angekommen.push(id);
  }
  return angekommen;
}

export function ebeneWechseln(spiel, zieltiefe) {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  const alteTiefe = zustand.tiefe;
  const hinab = zieltiefe > alteTiefe;
  // was Ninkasi zuletzt gesehen hat, bleibt der verlassenen Ebene als Erinnerung (systeme/erinnerung.js)
  erinnerungAuffrischen(spiel, zustand.sichtbareFelder);
  const mitgenommeneIds = mitgenommen(spiel, ninkasi, { von: alteTiefe, nach: zieltiefe, richtung: hinab ? "ab" : "auf" });
  // die mitgenommenen Wesen verlassen ihr Feld bis zur Ankunft, damit sie auf der neuen Ebene nichts besetzen
  const altePositionen = [...mitgenommeneIds].sort((idA, idB) => idA - idB)
    .map((id) => zustand.entitaeten[id])
    .filter((entitaet) => entitaet.id !== ninkasi.id && istWesen(entitaet) && entitaet.position)
    .map((wesen) => [wesen.id, wesen.position]);
  for (const [id] of altePositionen) delete zustand.entitaeten[id].position;
  ebeneAblegen(spiel, mitgenommeneIds);
  zustand.tiefe = zieltiefe;
  if (zustand.abgelegteEbenen[zieltiefe]) ebeneZurueckholen(spiel, zieltiefe);
  else ebeneNeuErzeugen(spiel, zieltiefe);
  // Ankunft an der Gegentreppe; der Index entsteht nach dem Wechsel neu
  const ankunft = treppeIn(spiel, hinab ? "auf" : "ab") ?? treppeIn(spiel, hinab ? "ab" : "auf");
  ninkasi.position = { x: ankunft.x, y: ankunft.y };
  indexVerwerfen(zustand);
  const besetzt = entitaetenAuf(zustand, ankunft.x, ankunft.y).some((entitaet) => istWesen(entitaet) && entitaet.id !== ninkasi.id);
  if (besetzt) {
    const frei = naechstesFeldMit(spiel, ankunft, (x, y) => betretbar(spiel, ninkasi, { x, y }) && !entitaetenAuf(zustand, x, y).some(istWesen));
    if (frei) ninkasi.position = frei;
    indexVerwerfen(zustand);
  }
  const angekommen = verfolgerAufstellen(spiel, ninkasi, alteTiefe, altePositionen);
  zustand.sichtbareFelder = [];
  sichtfeldAktualisieren(spiel);
  melden(spiel, "ebene_gewechselt", { wer: bezugAuf(ninkasi), tiefe: zieltiefe, ebene: zustand.ebene.name, richtung: hinab ? "ab" : "auf" });
  for (const id of angekommen) melden(spiel, "gefolgt", { wer: bezugAuf(zustand.entitaeten[id]), wem: bezugAuf(ninkasi) });
}

anmelden("befehle", "treppe", {
  pruefen(spiel, akteur) {
    if (akteur.id !== spiel.zustand.spielerinId) return "ungueltig";
    const richtung = gelaendeAuf(spiel, akteur.position.x, akteur.position.y)?.treppe;
    if (!richtung || !ebenennameFuer(spiel.zustand, spiel.zustand.tiefe + RICHTUNG[richtung])) return "keine_treppe";
    return null;
  },
  ausfuehren(spiel, akteur) {
    const richtung = gelaendeAuf(spiel, akteur.position.x, akteur.position.y).treppe;
    ebeneWechseln(spiel, spiel.zustand.tiefe + RICHTUNG[richtung]);
    return "treppe";
  },
});
