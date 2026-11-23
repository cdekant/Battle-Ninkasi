// Population einer Ebene (siehe docs/Welt.md, Ebenen): feste Gegner und Wesen aus einer Tabelle nach Tiefe,
// gesetzt vom Ebenenschritt "population" (welt/ebenenschritte.js).
// Population: Einträge { typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }; je Wurf
//   mit regeln.population.tieferChance Prozent aus einer Tiefe bis tieferBis tiefer gezogen (Gegner aus der Tiefe),
//   gewichtet unter den Einträgen der Tiefe; ein Rudel steht beieinander; Affixe sind Zustände beim Erzeugen.
// Alle Gegner höchstens bis zur Obergrenze der Population (regeln.population.hoechstWesen).
// Wachzustand: ein Rudel (ein fester Gegner ist ein Rudel für sich) schläft mit regeln.population.schlafChance Prozent,
//   sonst ist es wach und zieht umher (ki/umherziehen.js); einmal je Rudel gewürfelt mit dem eigenen Zufall "schlaf", so
//   bleibt der Zufall "inhalt" unberührt. Nur Wesen mit KI ohne eigenen wachzustand in den Daten.
// Rudel: jedes weitere Mitglied trägt ki.anfuehrerinId, die ID des ersten.

import { zufallsGanzzahl, mitProzentChance } from "../kern/zufall.js";
import { ausDatenErzeugen, anzahlWesen } from "../kern/zustand.js";
import { melden } from "../kern/ereignisse.js";
import { zustandSetzen } from "../systeme/zustaende.js";
import { abstandQuadrat } from "./geometrie.js";

// Einträge einer Populationstabelle, die zu einer Tiefe passen
export function eintraegeFuerTiefe(tabelle, tiefe) {
  return tabelle.filter((eintrag) => tiefe >= eintrag.tiefe[0] && tiefe <= eintrag.tiefe[1]);
}

// Gewichteter Wurf unter Einträgen (feste Reihenfolge der Daten)
function gewichtetZiehen(zufall, eintraege) {
  const summe = eintraege.reduce((gesamt, eintrag) => gesamt + eintrag.gewicht, 0);
  let wurf = zufallsGanzzahl(zufall, 1, summe);
  for (const eintrag of eintraege) {
    if (wurf <= eintrag.gewicht) return eintrag;
    wurf -= eintrag.gewicht;
  }
  return eintraege[eintraege.length - 1];
}

// Freies Feld ziehen: zufällig unter bau.freieFelder (das Feld wird belegt), null, wenn keins mehr frei ist
export function freiesFeldZiehen(bau, zufall) {
  if (bau.freieFelder.length === 0) return null;
  return bau.freieFelder.splice(zufallsGanzzahl(zufall, 0, bau.freieFelder.length - 1), 1)[0];
}

// Das freie Feld, das einem anderen am nächsten liegt (bei Gleichstand das erste in der festen Reihenfolge)
function freiesFeldNahe(bau, feld) {
  if (bau.freieFelder.length === 0) return null;
  let beste = 0;
  bau.freieFelder.forEach((kandidat, stelle) => { if (abstandQuadrat(kandidat, feld) < abstandQuadrat(bau.freieFelder[beste], feld)) beste = stelle; });
  return bau.freieFelder.splice(beste, 1)[0];
}

// Setzt die festen Gegner (ebenendaten.gegner) und die Population (ebenendaten.population) auf freie Felder
// Wachzustand eines neuen Rudels: "schlaeft" oder "wach"
const rudelschlaf = (spiel, bau) => (mitProzentChance(bau.zufall("schlaf"), spiel.daten.regeln.population.schlafChance) ? "schlaeft" : "wach");

// Wachzustand und Anführerin an ein neues Mitglied eines Rudels
function insRudel(wesen, wachzustand, anfuehrerin) {
  if (!wesen.ki) return;
  if (wesen.ki.wachzustand === undefined) wesen.ki.wachzustand = wachzustand;
  if (anfuehrerin && anfuehrerin !== wesen) wesen.ki.anfuehrerinId = anfuehrerin.id;
}

export function populationSetzen(spiel, bau, zufall) {
  const zustand = spiel.zustand;
  const hoechstWesen = spiel.daten.regeln.population.hoechstWesen;
  const platzierung = { wesen: anzahlWesen(zustand), ausgefallen: 0 };
  const gegnerSetzen = (typ, feld) => {
    if (platzierung.wesen >= hoechstWesen) {
      platzierung.ausgefallen++;
      return null;
    }
    if (!feld) return null;
    platzierung.wesen++;
    return ausDatenErzeugen(spiel, "wesen", typ, feld);
  };
  for (const gegnerEintrag of bau.ebenendaten.gegner || []) {
    for (let i = 0; i < gegnerEintrag.anzahl; i++) {
      const wesen = gegnerSetzen(gegnerEintrag.typ, platzierung.wesen < hoechstWesen ? freiesFeldZiehen(bau, zufall) : null);
      if (wesen) insRudel(wesen, rudelschlaf(spiel, bau), null);
    }
  }
  if (bau.ebenendaten.population) tabelleSetzen(spiel, bau, zufall, gegnerSetzen);
  if (platzierung.ausgefallen) melden(spiel, "population_voll", { wesen: null, hoechstWesen, ausgefallen: platzierung.ausgefallen });
}

// Ein Wurf auf eine Populationstabelle: gelegentlich aus der Tiefe (regeln.population.tieferChance), gewichtet unter
// den Einträgen der Tiefe, dazu die Größe des Rudels; { eintrag, rudel } oder null, wenn die Tiefe nichts hat.
// Auch für die Wellen der Arena (systeme/arena.js)
export function rudelZiehen(spiel, tabelle, tiefe, zufall) {
  const regeln = spiel.daten.regeln.population;
  let zugTiefe = tiefe;
  if (regeln.tieferChance > 0 && mitProzentChance(zufall, regeln.tieferChance)) zugTiefe += zufallsGanzzahl(zufall, 1, regeln.tieferBis);
  let kandidaten = eintraegeFuerTiefe(tabelle, zugTiefe);
  if (!kandidaten.length) kandidaten = eintraegeFuerTiefe(tabelle, tiefe);
  if (!kandidaten.length) return null;
  const eintrag = gewichtetZiehen(zufall, kandidaten);
  return { eintrag, rudel: rudelgroesse(zufall, eintrag) };
}

export const rudelgroesse = (zufall, eintrag) => (eintrag.rudel ? zufallsGanzzahl(zufall, eintrag.rudel[0], eintrag.rudel[1]) : 1);

function tabelleSetzen(spiel, bau, zufall, gegnerSetzen) {
  const population = bau.ebenendaten.population;
  const tabelle = spiel.daten.populationen[population.tabelle];
  let offen = zufallsGanzzahl(zufall, population.anzahl[0], population.anzahl[1]);
  for (let versuch = 0; offen > 0 && versuch < 1000; versuch++) {
    const gezogen = rudelZiehen(spiel, tabelle, bau.tiefe, zufall);
    // nichts für diese Tiefe: der Wurf fällt aus, der nächste versucht es wieder (höchstens 1000 Versuche)
    if (!gezogen) continue;
    const { eintrag, rudel } = gezogen;
    let anfuehrerin = null, wachzustand = null;
    for (let mitglied = 0; mitglied < Math.min(rudel, offen); mitglied++) {
      const feld = anfuehrerin ? freiesFeldNahe(bau, anfuehrerin.position) : freiesFeldZiehen(bau, zufall);
      const wesen = gegnerSetzen(eintrag.typ, feld);
      if (!wesen) return;
      anfuehrerin ??= wesen;
      wachzustand ??= rudelschlaf(spiel, bau);
      insRudel(wesen, wachzustand, anfuehrerin);
      for (const affix of eintrag.affixe || []) {
        if (mitProzentChance(zufall, affix.chance)) zustandSetzen(spiel, wesen, affix.zustand, { quelleId: wesen.id, urheberId: wesen.id });
      }
    }
    offen -= Math.min(rudel, offen);
  }
}
