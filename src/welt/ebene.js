// Erzeugung einer Ebene (siehe docs/Architektur.md, Ebenen): die Ebene der Tiefe t ist daten.abfolge[t], ein Eintrag
// aus daten/ebenen.js; mehrere Tiefen dürfen dieselbe Vorlage nutzen, jede bekommt ihren eigenen abgeleiteten Zufall.
// Ninkasi legt die Ebene nicht an; sie gibt die Treppenfelder zurück: { treppeAuf, treppeAb } (oder null).
//
// Feste Karte (karte: [Zeilen aus Geländekennungen], z.B. der Hub): unverändert übernommen, Treppen stehen darin.
// Erzeugte Ebene: Digger von rot.js, Inhalte mit eigenem abgeleiteten Zufall, damit die Ebene nicht vom Spielverlauf
// abhängt.
//   Treppen: hinauf in der Mitte des ersten Raums (dort kommt an, wer hinabsteigt, und dort beginnt das Spiel),
//   hinab in der Mitte des Raums, der davon am weitesten entfernt ist; jeweils nur, wenn es die Tiefe gibt
//   (Gelände gelaende.treppeAuf und gelaende.treppeAb der Ebene, Vorgabe "treppe_auf" und "treppe_ab").
//   Türen: an den Zugängen der Räume, die rot.js meldet, mit tuerChance Prozent; Gelände gelaende.tuer, Vorgabe "tuer_zu".
//   Gelände-Objekte (gelaendeObjekte: [{ gelaende, anzahl }], z.B. Gärbottiche) nur im Inneren von Räumen (nicht am Rand,
//   nicht im ersten Raum), so sperren sie keinen Durchgang.
//   Gegner: feste Liste gegner: [{ typ, anzahl }] und/oder population: { tabelle, anzahl: [min, max] } aus
//   daten/populationen.js; Gegenstände und Fallen (fallen: [{ typ, anzahl }]) auf freien Feldern außerhalb des ersten Raums.
// Population: Einträge { typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }; je Wurf
//   mit regeln.population.tieferChance Prozent aus einer Tiefe bis tieferBis tiefer gezogen (Gegner aus der Tiefe),
//   gewichtet unter den Einträgen der Tiefe; ein Rudel steht beieinander; Affixe sind Zustände beim Erzeugen.
// Alle Gegner höchstens bis zur Obergrenze der Population (regeln.population.hoechstWesen).

import RNG from "../../lib/rot/rng.js";
import Digger from "../../lib/rot/map/digger.js";
import { startwertAbleiten, zufallErzeugen, zufallsGanzzahl, mitProzentChance } from "../kern/zufall.js";
import { entitaetAusDatensatz, anzahlWesen } from "../kern/zustand.js";
import { melden } from "../kern/ereignisse.js";
import { zustandSetzen } from "../systeme/zustaende.js";
import { abstandQuadrat } from "./geometrie.js";

const leereSchichten = () => ({ oberflaeche: {}, gas: {}, feuer: {} });

export function ebenennameFuer(daten, tiefe) {
  return daten.abfolge[tiefe] ?? null;
}

// Felder einer festen Karte mit der Kennung eines Geländes
function felderMitKennung(zeilen, kennung) {
  const ergebnis = [];
  zeilen.forEach((zeile, y) => [...zeile].forEach((zeichen, x) => { if (zeichen === kennung) ergebnis.push({ x, y }); }));
  return ergebnis;
}

function festeKarte(spiel, ebenenName, ebenendaten) {
  const zeilen = ebenendaten.karte;
  spiel.zustand.ebene = {
    name: ebenenName, breite: zeilen[0].length, hoehe: zeilen.length, felder: [...zeilen],
    erkundet: new Array(zeilen[0].length * zeilen.length).fill(0), schichten: leereSchichten(),
  };
  const kennung = (rolle, vorgabe) => spiel.daten.gelaende[ebenendaten.gelaende?.[rolle] ?? vorgabe].kennung;
  return {
    treppeAuf: felderMitKennung(zeilen, kennung("treppeAuf", "treppe_auf"))[0] ?? null,
    treppeAb: felderMitKennung(zeilen, kennung("treppeAb", "treppe_ab"))[0] ?? null,
  };
}

// Erzeugt die Ebene der Tiefe und setzt sie als zustand.ebene; gibt { treppeAuf, treppeAb } zurück
export function ebeneErzeugen(spiel, tiefe) {
  const zustand = spiel.zustand;
  const ebenenName = ebenennameFuer(spiel.daten, tiefe);
  const ebenendaten = spiel.daten.ebenen[ebenenName];
  if (ebenendaten.karte) return festeKarte(spiel, ebenenName, ebenendaten);

  const gelaendeKennung = (rolle, vorgabe) => spiel.daten.gelaende[ebenendaten.gelaende[rolle] ?? vorgabe].kennung;
  const kennungWand = gelaendeKennung("wand"), kennungBoden = gelaendeKennung("boden");
  const { breite, hoehe } = ebenendaten;
  const schluessel = `ebene.${tiefe}.${ebenenName}`;

  // rot.js nutzt einen globalen Zufall; Startwert 0 ist dort ungültig
  RNG.setSeed(startwertAbleiten(zustand.startwert, schluessel) || 1);
  // timeLimit: Infinity, sonst bricht der Digger nach Uhrzeit ab und die Ebene ist nicht wiederholbar
  const digger = new Digger(breite, hoehe, { ...ebenendaten.digger, timeLimit: Infinity });
  const zeilen = Array.from({ length: hoehe }, () => new Array(breite).fill(kennungWand));
  // rot.js meldet je Feld 0 für Boden, 1 für Wand
  digger.create((x, y, feldart) => { if (feldart === 0) zeilen[y][x] = kennungBoden; });
  const raeume = digger.getRooms();

  // Türen an Raumzugängen, in fester Reihenfolge (Räume, dann Zugänge wie rot.js sie meldet)
  const tuerFelder = new Set();
  const tuerChance = ebenendaten.tuerChance ?? 0;
  if (tuerChance > 0) {
    const tuerZufall = zufallErzeugen(startwertAbleiten(zustand.startwert, `${schluessel}.tueren`));
    const kennungTuer = gelaendeKennung("tuer", "tuer_zu");
    for (const raum of raeume) {
      raum.getDoors((x, y) => {
        const feldSchluessel = `${x},${y}`;
        if (tuerFelder.has(feldSchluessel) || zeilen[y][x] !== kennungBoden) return;
        tuerFelder.add(feldSchluessel);
        if (zufallsGanzzahl(tuerZufall, 1, 100) <= tuerChance) zeilen[y][x] = kennungTuer;
      });
    }
  }

  // Treppen: hinauf im ersten Raum, hinab im Raum, dessen Mitte davon am weitesten entfernt ist
  const mitte = (raum) => { const [x, y] = raum.getCenter(); return { x, y }; };
  const startraum = raeume[0];
  const start = mitte(startraum);
  const fernsterRaum = raeume.slice(1).reduce((bester, raum) => (abstandQuadrat(mitte(raum), start) > abstandQuadrat(mitte(bester), start) ? raum : bester), raeume[raeume.length - 1]);
  const treppeAuf = ebenennameFuer(spiel.daten, tiefe - 1) ? start : null;
  const treppeAb = ebenennameFuer(spiel.daten, tiefe + 1) && fernsterRaum !== startraum ? mitte(fernsterRaum) : null;
  if (treppeAuf) zeilen[treppeAuf.y][treppeAuf.x] = gelaendeKennung("treppeAuf", "treppe_auf");
  if (treppeAb) zeilen[treppeAb.y][treppeAb.x] = gelaendeKennung("treppeAb", "treppe_ab");

  // Gelände-Objekte im Inneren der Räume außer dem ersten
  const objektFelder = [];
  for (const raum of raeume.slice(1)) {
    for (let y = raum.getTop() + 1; y <= raum.getBottom() - 1; y++) {
      for (let x = raum.getLeft() + 1; x <= raum.getRight() - 1; x++) if (zeilen[y][x] === kennungBoden) objektFelder.push({ x, y });
    }
  }
  const objektZufall = zufallErzeugen(startwertAbleiten(zustand.startwert, `${schluessel}.objekte`));
  for (const { gelaende, anzahl } of ebenendaten.gelaendeObjekte || []) {
    for (let i = 0; i < anzahl && objektFelder.length; i++) {
      const { x, y } = objektFelder.splice(zufallsGanzzahl(objektZufall, 0, objektFelder.length - 1), 1)[0];
      zeilen[y][x] = spiel.daten.gelaende[gelaende].kennung;
    }
  }

  zustand.ebene = {
    name: ebenenName, breite, hoehe,
    felder: zeilen.map((zeile) => zeile.join("")),
    erkundet: new Array(breite * hoehe).fill(0),
    schichten: leereSchichten(),
  };

  // freie Bodenfelder außerhalb des ersten Raums, in fester Reihenfolge; nichts in Türöffnungen
  const freieFelder = [];
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      if (zeilen[y][x] !== kennungBoden || tuerFelder.has(`${x},${y}`)) continue;
      const imStartraum = x >= startraum.getLeft() - 1 && x <= startraum.getRight() + 1
        && y >= startraum.getTop() - 1 && y <= startraum.getBottom() + 1;
      if (!imStartraum) freieFelder.push({ x, y });
    }
  }

  const inhaltsZufall = zufallErzeugen(startwertAbleiten(zustand.startwert, `${schluessel}.inhalt`));
  const freiesFeldZiehen = () => {
    if (freieFelder.length === 0) return null;
    return freieFelder.splice(zufallsGanzzahl(inhaltsZufall, 0, freieFelder.length - 1), 1)[0];
  };
  // das freie Feld, das einem anderen am nächsten liegt (bei Gleichstand das erste in der festen Reihenfolge)
  const freiesFeldNahe = (feld) => {
    if (freieFelder.length === 0) return null;
    let beste = 0;
    freieFelder.forEach((kandidat, stelle) => { if (abstandQuadrat(kandidat, feld) < abstandQuadrat(freieFelder[beste], feld)) beste = stelle; });
    return freieFelder.splice(beste, 1)[0];
  };

  const hoechstWesen = spiel.daten.regeln.population.hoechstWesen;
  const platzierung = { wesen: anzahlWesen(zustand), ausgefallen: 0 };
  const gegnerSetzen = (typ, feld) => {
    if (platzierung.wesen >= hoechstWesen) {
      platzierung.ausgefallen++;
      return null;
    }
    if (!feld) return null;
    platzierung.wesen++;
    return entitaetAusDatensatz(zustand, typ, spiel.daten.wesen[typ], feld);
  };
  for (const gegnerEintrag of ebenendaten.gegner || []) {
    for (let i = 0; i < gegnerEintrag.anzahl; i++) gegnerSetzen(gegnerEintrag.typ, platzierung.wesen < hoechstWesen ? freiesFeldZiehen() : null);
  }
  if (ebenendaten.population) populationSetzen(spiel, tiefe, ebenendaten.population, inhaltsZufall, { freiesFeldZiehen, freiesFeldNahe, gegnerSetzen });
  if (platzierung.ausgefallen) melden(spiel, "population_voll", { wesen: null, hoechstWesen, ausgefallen: platzierung.ausgefallen });

  for (const gegenstandEintrag of ebenendaten.gegenstaende || []) {
    for (let i = 0; i < gegenstandEintrag.anzahl; i++) {
      const feld = freiesFeldZiehen();
      if (feld) entitaetAusDatensatz(zustand, gegenstandEintrag.typ, spiel.daten.gegenstaende[gegenstandEintrag.typ], feld);
    }
  }
  for (const fallenEintrag of ebenendaten.fallen || []) {
    for (let i = 0; i < fallenEintrag.anzahl; i++) {
      const feld = freiesFeldZiehen();
      if (feld) entitaetAusDatensatz(zustand, fallenEintrag.typ, spiel.daten.fallen[fallenEintrag.typ], feld);
    }
  }
  return { treppeAuf, treppeAb };
}

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

function populationSetzen(spiel, tiefe, population, zufall, { freiesFeldZiehen, freiesFeldNahe, gegnerSetzen }) {
  const tabelle = spiel.daten.populationen[population.tabelle];
  const regeln = spiel.daten.regeln.population;
  let offen = zufallsGanzzahl(zufall, population.anzahl[0], population.anzahl[1]);
  for (let versuch = 0; offen > 0 && versuch < 1000; versuch++) {
    // gelegentlich ein Gegner aus der Tiefe
    let zugTiefe = tiefe;
    if (regeln.tieferChance > 0 && mitProzentChance(zufall, regeln.tieferChance)) zugTiefe += zufallsGanzzahl(zufall, 1, regeln.tieferBis);
    let kandidaten = eintraegeFuerTiefe(tabelle, zugTiefe);
    if (!kandidaten.length) kandidaten = eintraegeFuerTiefe(tabelle, tiefe);
    // nichts für diese Tiefe: der Wurf fällt aus, der nächste versucht es wieder (höchstens 1000 Versuche)
    if (!kandidaten.length) continue;
    const eintrag = gewichtetZiehen(zufall, kandidaten);
    const rudel = eintrag.rudel ? zufallsGanzzahl(zufall, eintrag.rudel[0], eintrag.rudel[1]) : 1;
    let anfuehrerin = null;
    for (let mitglied = 0; mitglied < Math.min(rudel, offen); mitglied++) {
      const feld = anfuehrerin ? freiesFeldNahe(anfuehrerin.position) : freiesFeldZiehen();
      const wesen = gegnerSetzen(eintrag.typ, feld);
      if (!wesen) return;
      anfuehrerin ??= wesen;
      for (const affix of eintrag.affixe || []) {
        if (mitProzentChance(zufall, affix.chance)) zustandSetzen(spiel, wesen, affix.zustand, { quelleId: wesen.id, urheberId: wesen.id });
      }
    }
    offen -= Math.min(rudel, offen);
  }
}
