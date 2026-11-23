// Spielart "arena" (siehe docs/Architektur.md, Spielarten): Kämpfe nach einer Aufstellung, von Hand, automatisch
// (ki/taktik.js über eingabe/arenakampf.js) oder tausendfach im Werkzeug werkzeuge/arena.js. Die Aufstellung steht in
// den Startoptionen (optionen.arena), so folgt jeder Kampf wie jeder Lauf aus Startwert, Optionen und Befehlen.
//   Aufstellung: { name?, varianten?, karte, taktik?, abstand?, wachzustand?, start?: { x, y },
//     ninkasi?: { eigenschaften?, skills?: { name: stufe }, ausruestung?: [typ], gepaeck?: [{ typ, anzahl? }], werte? },
//     wellen?: [[{ typ, anzahl? }]], population?: { tabelle?, tiefe, wellen?, alle? } }; geprüft in kern/daten.js
//     (arenaFehler); benannte Aufstellungen in datenproben/arenen.js, aufstellungAus löst Name und Varianten auf
//   Planschritt "arena": der Plan hat nur die Tiefe 0 mit der Karte der Aufstellung, ohne Treppen
//   Laufbeginn: Ninkasi steht auf start (Vorgabe: das erste begehbare Feld der mittleren Zeile von links), bekommt
//     Eigenschaften, Skills bis zur Stufe (über die EP, Voraussetzungen gelten), Gepäck, angelegte Ausrüstung und
//     Anfangswerte; die Wellen stehen fest: erst die festen, dann aus der Population mit dem Zufall "arena" (alle: jeder
//     Eintrag der Tiefe einmal, wellen: so viele gezogene Rudel wie in welt/population.js); die erste Welle steht
//     abstand Felder rechts von Ninkasi (Vorgabe regeln.arena.abstand) und jagt (wachzustand, Vorgabe regeln.arena)
//   Zustandsprüfung "arena": lebt kein Feind Ninkasis mehr, kommt die nächste Welle, Ninkasi gegenüber (gespiegelt an
//     der Mitte der Karte), ohne Rast; nach der letzten endet der Lauf mit zustand.ergebnis "sieg" (Meldung
//     "arena_sieg"); Meldung "arena_welle { welle, von }" bei jeder Welle; der Tod endet ihn wie sonst
// Wiederholbar: die Wellen stehen im Zustand (zustand.arena), Affixe werfen den Spiel-Zufall (Wurf "arena_affix").

import { anmelden, holen } from "../kern/register.js";
import { ausDatenErzeugen, alleEntitaeten, istWesen, spielerin, anzahlWesen, positionSetzen } from "../kern/zustand.js";
import { akteurEinreihen } from "../kern/zeit.js";
import { melden } from "../kern/ereignisse.js";
import { zufallErzeugen, startwertAbleiten } from "../kern/zufall.js";
import { wurfProzent } from "../kern/wurf.js";
import { wertBegrenztAendern } from "../kern/werte.js";
import { arenaFehler, arenaTabelle } from "../kern/daten.js";
import { betretbarFuer, passierbar } from "../welt/karte.js";
import { wesenAufFeld } from "../welt/geometrie.js";
import { naechstesFeldMit } from "../welt/wege.js";
import { eintraegeFuerTiefe, rudelZiehen, rudelgroesse } from "../welt/population.js";
import { insInventar } from "./inventar.js";
import { epAufSkill, epBisStufe, stufeVon } from "./skills.js";
import { zustandSetzen } from "./zustaende.js";
import { beziehungZwischen, urheberVon } from "./fraktionen.js";

export function istArena(spiel) {
  return spiel.optionen?.spielart === "arena";
}

// Startoption einer benannten Arena aus datenproben/arenen.js; varianten: { ninkasi?, gegner? } (Namen aus ihren varianten).
// Ninkasis Variante ergänzt und ersetzt Felder ihres Teils, die der Gegner ersetzt wellen und population.
export function aufstellungAus(daten, name, varianten = {}) {
  const arena = daten.arenen?.[name];
  if (!arena) throw new Error(`Arena "${name}" gibt es nicht`);
  const { text, varianten: moeglich = {}, ...aufstellung } = structuredClone(arena);
  const gewaehlt = {};
  if (varianten.ninkasi) {
    const teil = moeglich.ninkasi?.[varianten.ninkasi];
    if (!teil) throw new Error(`Arena "${name}" hat keine Variante "${varianten.ninkasi}" für Ninkasi`);
    aufstellung.ninkasi = { ...aufstellung.ninkasi, ...teil };
    gewaehlt.ninkasi = varianten.ninkasi;
  }
  if (varianten.gegner) {
    const teil = moeglich.gegner?.[varianten.gegner];
    if (!teil) throw new Error(`Arena "${name}" hat keine Variante "${varianten.gegner}" für die Gegner`);
    aufstellung.wellen = teil.wellen ?? [];
    if (teil.population) aufstellung.population = teil.population;
    else delete aufstellung.population;
    gewaehlt.gegner = varianten.gegner;
  }
  return { name, ...(Object.keys(gewaehlt).length ? { varianten: gewaehlt } : {}), ...aufstellung };
}

const aufstellungVon = (spiel) => spiel.optionen.arena;

anmelden("planschritte", "arena", (spiel, plan) => {
  if (!istArena(spiel)) return;
  plan.tiefen = [{ vorlage: aufstellungVon(spiel)?.karte, inhalte: [] }];
  plan.starttiefe = 0;
});

// Erstes begehbares Feld der mittleren Zeile von links
function startfeld(spiel) {
  const ebene = spiel.zustand.ebene;
  const y = Math.floor(ebene.hoehe / 2);
  for (let x = 0; x < ebene.breite; x++) if (passierbar(spiel, x, y)) return { x, y };
  throw new Error(`Arena "${ebene.name}": kein begehbares Feld in der mittleren Zeile`);
}

// Wellen aus festen Wellen und Population, jede eine Liste [{ typ, anzahl, affixe? }]
function wellenFestlegen(spiel, aufstellung) {
  const wellen = (aufstellung.wellen ?? []).map((welle) => welle.map(({ typ, anzahl = 1 }) => ({ typ, anzahl })));
  const population = aufstellung.population;
  if (!population) return wellen;
  const zufall = zufallErzeugen(startwertAbleiten(spiel.zustand.startwert, "arena"));
  const tabelle = spiel.daten.populationen[arenaTabelle(spiel.daten, population)];
  const welleAus = (eintrag, anzahl) => [{ typ: eintrag.typ, anzahl, ...(eintrag.affixe ? { affixe: eintrag.affixe } : {}) }];
  if (population.alle) for (const eintrag of eintraegeFuerTiefe(tabelle, population.tiefe)) wellen.push(welleAus(eintrag, rudelgroesse(zufall, eintrag)));
  for (let nummer = 0; nummer < (population.wellen ?? 0); nummer++) {
    const gezogen = rudelZiehen(spiel, tabelle, population.tiefe, zufall);
    if (gezogen) wellen.push(welleAus(gezogen.eintrag, gezogen.rudel));
  }
  return wellen;
}

function ninkasiEinrichten(spiel, ninkasi, teil) {
  Object.assign(ninkasi.eigenschaften ??= {}, teil.eigenschaften);
  for (const [name, stufe] of Object.entries(teil.skills ?? {})) {
    epAufSkill(spiel, ninkasi, name, epBisStufe(spiel, ninkasi, name, stufe));
    if (stufeVon(spiel, ninkasi, name) < stufe) throw new Error(`Arena: Skill "${name}" erreicht Stufe ${stufe} nicht (Voraussetzungen?)`);
  }
  for (const { typ, anzahl = 1 } of teil.gepaeck ?? []) {
    for (let i = 0; i < anzahl; i++) insInventar(spiel, ninkasi, ausDatenErzeugen(spiel, "gegenstaende", typ, null));
  }
  const anlegen = holen("befehle", "anlegen");
  for (const typ of teil.ausruestung ?? []) {
    const gegenstand = insInventar(spiel, ninkasi, ausDatenErzeugen(spiel, "gegenstaende", typ, null));
    const grund = anlegen.pruefen(spiel, ninkasi, { gegenstandId: gegenstand.id });
    if (grund) throw new Error(`Arena: "${typ}" lässt sich nicht anlegen (${grund})`);
    anlegen.ausfuehren(spiel, ninkasi, { gegenstandId: gegenstand.id });
  }
  for (const [name, wert] of Object.entries(teil.werte ?? {})) wertBegrenztAendern(spiel, ninkasi, name, wert - ninkasi.werte[name].aktuell);
}

anmelden("laufbeginn", "arena", (spiel, ninkasi) => {
  if (!istArena(spiel)) return;
  const aufstellung = aufstellungVon(spiel);
  const fehler = arenaFehler(spiel.daten, aufstellung);
  if (fehler.length) throw new Error(`Aufstellung der Arena:\n  ${fehler.join("\n  ")}`);
  const start = aufstellung.start ?? startfeld(spiel);
  if (!passierbar(spiel, start.x, start.y)) throw new Error(`Arena: Start ${start.x},${start.y} ist nicht begehbar`);
  positionSetzen(spiel.zustand, ninkasi, start);
  ninkasiEinrichten(spiel, ninkasi, aufstellung.ninkasi ?? {});
  const wellen = wellenFestlegen(spiel, aufstellung);
  if (!wellen.length) throw new Error("Arena: die Population gibt für diese Tiefe keine Gegner her");
  spiel.zustand.arena = { welle: 0, wellen };
  const abstand = aufstellung.abstand ?? spiel.daten.regeln.arena.abstand;
  // die erste Welle reiht neuesSpiel mit allen Wesen ein
  welleSetzen(spiel, { x: start.x + abstand, y: start.y }, false);
});

// Wesen einer Welle auf die nächsten freien Felder um punkt
function welleSetzen(spiel, punkt, einreihen) {
  const zustand = spiel.zustand;
  const { welle, wellen } = zustand.arena;
  const wachzustand = aufstellungVon(spiel).wachzustand ?? spiel.daten.regeln.arena.wachzustand;
  const hoechstWesen = spiel.daten.regeln.population.hoechstWesen;
  let ausgefallen = 0;
  for (const { typ, anzahl, affixe } of wellen[welle]) {
    const bewegung = spiel.daten.wesen[typ].bewegung ?? "laufend";
    for (let i = 0; i < anzahl; i++) {
      const frei = (x, y) => betretbarFuer(spiel, x, y, bewegung, false) && wesenAufFeld(spiel, { x, y }).length === 0;
      const feld = anzahlWesen(zustand) < hoechstWesen ? naechstesFeldMit(spiel, punkt, frei, { bewegung, mitStart: true }) : null;
      if (!feld) { ausgefallen++; continue; }
      const wesen = ausDatenErzeugen(spiel, "wesen", typ, feld);
      if (wesen.ki) wesen.ki.wachzustand = wachzustand;
      for (const affix of affixe ?? []) {
        if (wurfProzent(spiel, "arena_affix", affix.chance)) zustandSetzen(spiel, wesen, affix.zustand, { quelleId: wesen.id, urheberId: wesen.id });
      }
      if (einreihen && wesen.ki) akteurEinreihen(zustand, wesen.id, spiel.daten.aktionen.warten);
    }
  }
  if (ausgefallen) melden(spiel, "population_voll", { wesen: null, hoechstWesen, ausgefallen });
  melden(spiel, "arena_welle", { welle: welle + 1, von: wellen.length });
}

// Feinde Ninkasis, die noch auf der Karte stehen
export function feindeInDerArena(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  const sicht = urheberVon(ninkasi);
  return alleEntitaeten(spiel.zustand).filter((entitaet) => istWesen(entitaet) && entitaet.position && entitaet.id !== ninkasi.id && beziehungZwischen(spiel, sicht, entitaet) === "feind");
}

anmelden("zustandspruefungen", "arena", (spiel) => {
  const zustand = spiel.zustand;
  if (!zustand.arena || zustand.vorbei || feindeInDerArena(spiel).length) return false;
  if (zustand.arena.welle + 1 < zustand.arena.wellen.length) {
    zustand.arena.welle++;
    const position = spielerin(zustand).position, ebene = zustand.ebene;
    welleSetzen(spiel, { x: ebene.breite - 1 - position.x, y: ebene.hoehe - 1 - position.y }, true);
    return true;
  }
  zustand.vorbei = true;
  zustand.ergebnis = "sieg";
  melden(spiel, "arena_sieg", { wellen: zustand.arena.wellen.length });
  return true;
});
