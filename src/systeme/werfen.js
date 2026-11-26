// Befehl "werfen" (siehe docs/Wesen.md, Bewegung): einen getragenen Gegenstand entlang der Flugbahn werfen.
// Befehl: { art: "werfen", gegenstandId, ziel: { x, y } | { id } }
// Die Bahn ist die eines Geschosses (zielAufloesen mit Zielart geschoss): sie endet am ersten Wesen oder vor der Wand.
// Reichweite (wurfReichweite): wurf.reichweite am Gegenstand, sonst nach seinem Gewicht auf der Kurve
//   regeln.werfen.reichweiteNachGewicht, danach Modifikatoren auf "reichweite" mit dem Tag "wurf" und den Tags des
//   Gegenstands (ein Skill wirft so etwa nur Tränke weiter); mindestens 1.
// Zeitkosten: wurf.kosten am Gegenstand, sonst aktionen.werfen.
// Daten am Gegenstand: wurf: { effekt?, reichweite?, genauigkeit?, kritchance?, kosten?, bruchchance? }
//   mit effekt und ohne genauigkeit zerspringt er am Aufschlag (Meldung "zerbrochen") und der Effekt wirkt dort: Ziel
//   ist das getroffene Wesen, sonst wirkt er nur aufs Feld (Ursache "wurf"); ob er treffen muss, sagen seine Daten
//   (trefferwurf); ein solcher Wurf streut (streuung)
//   mit effekt und genauigkeit ist er eine Wurfwaffe (Vorbild Brogue): Trefferwurf gegen das erste Wesen der Bahn (Tag
//   "wurf", systeme/kampf.js trefferwurfMitFolgen), ein Treffer wirkt den Effekt; danach landet sie, nach einem Treffer
//   unter dem Ziel, oder zerbricht nach bruchchance (Vorgabe regeln.fernkampf.bruchchance, landenOderBrechen)
//   ohne effekt landet der Gegenstand auf dem Aufschlagfeld (Meldung "gelandet"), ist es nicht passierbar, auf dem letzten
//   passierbaren Feld der Bahn davor
// Streuung: ein zerspringender Wurf geht mit regeln.werfen.streuung.chance (Prozent, Modifikator "streuung.chance" mit
//   den Tags wie bei der Reichweite) daneben, 1 bis streuung.weite Felder (Modifikator "streuung.weite") in eine gewürfelte Richtung
//   (Würfe "streuung", "streuung_weite", "streuung_richtung"), Meldung "streut"; die Vorschau zeigt den Bereich (streufelder)
// Nutzung für die KI (Register "nutzungen", ki/nutzen.js): wurf.zweck sagt, wozu ein Wesen den Gegenstand auf seine Beute
//   wirft; nur wenn die Bahn die Beute als erstes Wesen trifft (kein Verbündeter davor)
// Am Aufschlag entsteht Lärm (regeln.wahrnehmung.laermWurf): Wache gehen ihm nach, so taugt ein Wurf als Ablenkung.

import { anmelden } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, positionSetzen } from "../kern/zustand.js";
import { einenAbnehmen, einzelgewicht, ablageDesGetraenks } from "./inventar.js";
import { fluchHindert } from "./ausruestung.js";
import { effektAnwenden, kontextVervollstaendigen } from "../kern/effekte.js";
import { trefferwurfMitFolgen } from "./kampf.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { zielAufloesen } from "./zielauswahl.js";
import { laermMachen } from "./wahrnehmung.js";
import { passierbar, aufDerKarte } from "../welt/karte.js";
import { flugbahn } from "../welt/geometrie.js";
import { modifiziert } from "../kern/werte.js";
import { wertAufKurve } from "../kern/kurven.js";
import { wurfProzent, wurfGanzzahl } from "../kern/wurf.js";

// Richtungen der Streuung in fester Reihenfolge, im Uhrzeigersinn ab Norden
const RICHTUNGEN = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
// Umstände der Modifikatoren eines Wurfs: der Tag "wurf" und die Tags des Gegenstands
const umstaendeDesWurfs = (gegenstand) => ({ tags: ["wurf", ...(gegenstand?.tags || [])] });

function geworfenerGegenstand(spiel, akteur, befehl) {
  if (!Number.isInteger(befehl.gegenstandId) || !(akteur.inventar || []).includes(befehl.gegenstandId)) return null;
  return entitaetMitId(spiel.zustand, befehl.gegenstandId);
}

// Wo ein ganzer Gegenstand liegen bleibt: am Aufschlag, ist das Feld nicht passierbar (ein Gärbottich ist durchsichtig
// und lässt Geschosse durch), auf dem letzten passierbaren Feld der Bahn davor, sonst bei der Werferin
function landefeld(spiel, akteur, bahn) {
  const felder = [akteur.position, ...bahn.felder, bahn.aufschlag];
  for (let i = felder.length - 1; i >= 0; i--) if (passierbar(spiel, felder[i].x, felder[i].y)) return { x: felder[i].x, y: felder[i].y };
  return { x: akteur.position.x, y: akteur.position.y };
}

// Ein geworfenes oder verschossenes Stück nach dem Flug (auch systeme/fernkampf.js): es zerbricht nach bruchchance
// (Prozent, Wurf "bruch"; 0 und 100 würfeln nicht, Meldung "zerbrochen" außer bei 100) oder landet (Meldung "gelandet");
// gibt das Landefeld zurück, null, wenn es zerbrochen ist
export function landenOderBrechen(spiel, akteur, gegenstand, bahn, bruchchance) {
  const bricht = bruchchance >= 100 || (bruchchance > 0 && wurfProzent(spiel, "bruch", bruchchance));
  if (bricht) {
    entitaetEntfernen(spiel.zustand, gegenstand.id);
    if (bruchchance < 100) melden(spiel, "zerbrochen", { was: bezugAuf(gegenstand), feld: { x: bahn.aufschlag.x, y: bahn.aufschlag.y } });
    return null;
  }
  const feld = landefeld(spiel, akteur, bahn);
  positionSetzen(spiel.zustand, gegenstand, feld);
  melden(spiel, "gelandet", { was: bezugAuf(gegenstand), feld });
  return feld;
}

export const bruchchanceVorgabe = (spiel) => spiel.daten.regeln.fernkampf.bruchchance;

// Reichweite eines Wurfs für diese Werferin
export function wurfReichweite(spiel, akteur, gegenstand) {
  const grundwert = gegenstand.wurf?.reichweite ?? wertAufKurve(spiel.daten.regeln.werfen.reichweiteNachGewicht, einzelgewicht(gegenstand));
  return Math.max(1, modifiziert(spiel, akteur, "reichweite", grundwert, umstaendeDesWurfs(gegenstand)));
}

export function wurfbahn(spiel, akteur, gegenstand, zielangabe) {
  return zielAufloesen(spiel, akteur, { art: "geschoss", reichweite: wurfReichweite(spiel, akteur, gegenstand) }, zielangabe);
}

const zerspringt = (gegenstand) => Boolean(gegenstand.wurf?.effekt) && gegenstand.wurf.genauigkeit === undefined;

// Streuung dieser Werferin: { chance, weite } nach Regelwert und Modifikatoren, nie unter 0
function streuungVon(spiel, akteur, gegenstand) {
  const regel = spiel.daten.regeln.werfen.streuung;
  const umstaende = umstaendeDesWurfs(gegenstand);
  return {
    chance: Math.max(0, modifiziert(spiel, akteur, "streuung.chance", regel.chance, umstaende)),
    weite: Math.max(0, modifiziert(spiel, akteur, "streuung.weite", regel.weite, umstaende)),
  };
}

// Felder, auf die ein Wurf streuen kann (für die Vorschau): um den Aufschlag bis zur Weite, auf der Karte; leer, wenn
// der Gegenstand nicht zerspringt oder der Wurf nicht streut
export function streufelder(spiel, akteur, gegenstand, bahn) {
  if (!gegenstand || !zerspringt(gegenstand) || !bahn) return [];
  const { chance, weite } = streuungVon(spiel, akteur, gegenstand);
  if (chance <= 0 || weite <= 0) return [];
  const felder = [];
  for (let dy = -weite; dy <= weite; dy++) {
    for (let dx = -weite; dx <= weite; dx++) {
      const x = bahn.aufschlag.x + dx, y = bahn.aufschlag.y + dy;
      if ((dx || dy) && aufDerKarte(spiel.zustand.ebene, x, y)) felder.push({ x, y });
    }
  }
  return felder;
}

// Bahn eines streuenden Wurfs: mit der Chance zu einem Punkt neben dem Aufschlag, sonst die anvisierte
function gestreuteBahn(spiel, akteur, gegenstand, bahn) {
  const { chance, weite } = streuungVon(spiel, akteur, gegenstand);
  if (chance <= 0 || weite <= 0) return bahn;
  if (chance < 100 && !wurfProzent(spiel, "streuung", chance)) return bahn;
  const entfernung = wurfGanzzahl(spiel, "streuung_weite", 1, weite);
  const [dx, dy] = RICHTUNGEN[wurfGanzzahl(spiel, "streuung_richtung", 0, RICHTUNGEN.length - 1)];
  const ebene = spiel.zustand.ebene;
  const punkt = {
    x: Math.min(ebene.breite - 1, Math.max(0, bahn.aufschlag.x + dx * entfernung)),
    y: Math.min(ebene.hoehe - 1, Math.max(0, bahn.aufschlag.y + dy * entfernung)),
  };
  if (punkt.x === akteur.position.x && punkt.y === akteur.position.y) return bahn;
  const gestreut = flugbahn(spiel, akteur.position, punkt, { reichweite: wurfReichweite(spiel, akteur, gegenstand) + weite });
  melden(spiel, "streut", { was: bezugAuf(gegenstand), feld: { x: gestreut.aufschlag.x, y: gestreut.aufschlag.y } });
  return gestreut;
}

anmelden("befehle", "werfen", {
  pruefen(spiel, akteur, befehl) {
    const gegenstand = geworfenerGegenstand(spiel, akteur, befehl);
    if (!gegenstand) return "nichts_zu_werfen";
    if (fluchHindert(spiel, akteur, gegenstand.id)) return "verflucht";
    const aufloesung = wurfbahn(spiel, akteur, gegenstand, befehl.ziel);
    return aufloesung.ok ? null : aufloesung.grund;
  },
  ausfuehren(spiel, akteur, befehl) {
    const imGepaeck = geworfenerGegenstand(spiel, akteur, befehl);
    let { bahn } = wurfbahn(spiel, akteur, imGepaeck, befehl.ziel);
    // vom Stapel einer, sonst der Gegenstand selbst; auch eine angelegte Waffe lässt sich werfen
    const gegenstand = einenAbnehmen(spiel, akteur, imGepaeck);
    const wurf = gegenstand.wurf;
    melden(spiel, "geworfen", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: gegenstand.id, art: "werfen", kettentiefe: 0 });
    if (zerspringt(gegenstand)) bahn = gestreuteBahn(spiel, akteur, gegenstand, bahn);
    const aufschlag = { x: bahn.aufschlag.x, y: bahn.aufschlag.y };
    const getroffenId = bahn.getroffene[0] ?? null;
    melden(spiel, "geschoss", { quelle: bezugAuf(akteur), bahn: bahn.felder, aufschlag });
    if (wurf?.genauigkeit !== undefined) {
      // eine Wurfwaffe: Trefferwurf gegen das erste Wesen der Bahn, danach landet sie oder zerbricht
      if (getroffenId !== null) {
        trefferwurfMitFolgen(spiel, kontextVervollstaendigen(spiel, {
          quelleId: akteur.id, zielId: getroffenId, ursprung: aufschlag, zielfeld: aufschlag, tags: ["wurf"],
          ursache: "wurf", mittel: { art: "gegenstand", name: gegenstand.typ },
        }), { genauigkeit: wurf.genauigkeit, effekt: wurf.effekt, kritchance: wurf.kritchance });
      }
      landenOderBrechen(spiel, akteur, gegenstand, bahn, wurf.bruchchance ?? bruchchanceVorgabe(spiel));
    } else if (wurf?.effekt) {
      // erst entfernen, damit der Gegenstand nicht von seiner eigenen Wirkung getroffen wird
      entitaetEntfernen(spiel.zustand, gegenstand.id);
      melden(spiel, "zerbrochen", { was: bezugAuf(gegenstand), feld: aufschlag });
      effektAnwenden(spiel, wurf.effekt, {
        quelleId: akteur.id, zielId: getroffenId, ursprung: aufschlag, zielfeld: aufschlag,
        ursache: "wurf", mittel: { art: "gegenstand", name: gegenstand.typ }, werte: ablageDesGetraenks(gegenstand),
      });
    } else {
      landenOderBrechen(spiel, akteur, gegenstand, bahn, 0);
    }
    laermMachen(spiel, aufschlag, spiel.daten.regeln.wahrnehmung.laermWurf, akteur.id, "aufschlag");
    return { aktion: "werfen", grundkosten: wurf?.kosten };
  },
});

anmelden("nutzungen", "werfen", {
  feld: "wurf",
  ziel: "beute",
  befehl(spiel, wesen, beute, gegenstand) {
    if (fluchHindert(spiel, wesen, gegenstand.id)) return null;
    const aufloesung = wurfbahn(spiel, wesen, gegenstand, { id: beute.id });
    if (!aufloesung.ok || aufloesung.bahn.getroffene[0] !== beute.id) return null;
    return { art: "werfen", gegenstandId: gegenstand.id, ziel: { id: beute.id } };
  },
});
