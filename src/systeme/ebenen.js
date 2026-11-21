// Mehrere Ebenen (siehe docs/Welt.md, Ebenen): Treppen, Wechsel der Ebene, verlassene Ebenen ruhen.
// Befehl { art: "treppe" }: nur Ninkasi, auf einem Gelände mit treppe: "ab" oder "auf"; Ablehnung "keine_treppe",
//   wenn dort keine Treppe ist oder es die Tiefe nicht gibt. Zeitkosten aktionen.treppe.
// Wechsel: die alte Ebene wird samt ihrer Entitäten (alles außer Ninkasi und dem, was sie trägt) und deren Einträgen
//   der Warteschlange (Akteure, gebundene Zeitereignisse) in zustand.abgelegteEbenen[tiefe] gelegt, mit dem Zeitpunkt.
//   Kommt Ninkasi zurück, ruht die Ebene nachträglich: alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände)
//   rücken um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt (welt/ebene.js), ihre Wesen eingereiht.
//   Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien
//   Feld. Der Wechsel verwirft den räumlichen Index; die Position Ninkasis wird deshalb hier direkt gesetzt, der Index
//   entsteht danach neu. Meldung "ebene_gewechselt". Die Weltuhr läuft weiter, sie gehört keiner Ebene.

import { anmelden } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { spielerin, entitaetenAuf, istWesen } from "../kern/zustand.js";
import { indexVerwerfen } from "../kern/raumindex.js";
import { akteurEinreihen, eintraegeHerausnehmen, eintraegeEinfuegen } from "../kern/zeit.js";
import { gelaendeAuf, betretbar } from "../welt/karte.js";
import { naechstesFeldMit } from "../welt/wege.js";
import { ebeneErzeugen, ebenennameFuer } from "../welt/ebene.js";
import { sichtfeldAktualisieren } from "./sicht.js";

const RICHTUNG = { ab: 1, auf: -1 };

// Was Ninkasi mitnimmt: sie selbst und alles, was sie (auch verschachtelt) trägt
function mitgenommen(zustand, ninkasi) {
  const ids = new Set([ninkasi.id]);
  const offen = [...(ninkasi.inventar || [])];
  while (offen.length) {
    const id = offen.pop();
    if (ids.has(id) || !zustand.entitaeten[id]) continue;
    ids.add(id);
    offen.push(...(zustand.entitaeten[id].inventar || []));
  }
  return ids;
}

function ebeneAblegen(spiel, ninkasi) {
  const zustand = spiel.zustand;
  const bleibt = mitgenommen(zustand, ninkasi);
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

export function ebeneWechseln(spiel, zieltiefe) {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  const hinab = zieltiefe > zustand.tiefe;
  ebeneAblegen(spiel, ninkasi);
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
  sichtfeldAktualisieren(spiel);
  melden(spiel, "ebene_gewechselt", { wer: bezugAuf(ninkasi), tiefe: zieltiefe, ebene: zustand.ebene.name, richtung: hinab ? "ab" : "auf" });
}

anmelden("befehle", "treppe", {
  pruefen(spiel, akteur) {
    if (akteur.id !== spiel.zustand.spielerinId) return "ungueltig";
    const richtung = gelaendeAuf(spiel, akteur.position.x, akteur.position.y)?.treppe;
    if (!richtung || !ebenennameFuer(spiel.daten, spiel.zustand.tiefe + RICHTUNG[richtung])) return "keine_treppe";
    return null;
  },
  ausfuehren(spiel, akteur) {
    const richtung = gelaendeAuf(spiel, akteur.position.x, akteur.position.y).treppe;
    ebeneWechseln(spiel, spiel.zustand.tiefe + RICHTUNG[richtung]);
    return "treppe";
  },
});
