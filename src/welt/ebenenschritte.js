// Schritte der Ebenenerzeugung (siehe docs/Welt.md, Ebenen); der Ablauf und der Baukontext bau stehen in welt/ebene.js.
// Jeder Schritt: { braucht: [...], liefert: [...], verwirft?: true, ausfuehren(spiel, bau) }; braucht und liefert
// sind Namen von Teilen des Baus (karte, raeume, treppen, ebene, freie_felder), die Datenprüfung hält die Folge ein.
// Ein Schritt mit verwirft darf NEUER_VERSUCH zurückgeben; er muss vor "ebene_anlegen" stehen, damit noch nichts im
// Zustand steht, wenn der Versuch verworfen wird.
//
//   karte_digger: Digger von rot.js mit ebenendaten.digger, Gelände gelaende.wand und gelaende.boden
//   karte_fest: feste karte (Zeilen aus Geländekennungen, z.B. der Hub), Treppen stehen darin
//   tueren: an den Zugängen der Räume, die rot.js meldet, mit tuerChance Prozent; Gelände gelaende.tuer, Vorgabe
//     "tuer_zu"; alle Zugänge bleiben für freie_felder gesperrt, auch ohne Tür
//   treppen: hinauf in der Mitte des ersten Raums (dort kommt an, wer hinabsteigt, und dort beginnt das Spiel), hinab in
//     der Mitte des Raums, der davon am weitesten entfernt ist; jeweils nur, wenn es die Tiefe im Plan gibt
//     (gelaende.treppeAuf und gelaende.treppeAb, Vorgabe "treppe_auf" und "treppe_ab")
//   gelaende_objekte: gelaendeObjekte [{ gelaende, anzahl }] nur im Inneren von Räumen (nicht am Rand, nicht im ersten
//     Raum), so sperren sie keinen Durchgang
//   wand_objekte: wandObjekte [{ gelaende, anzahl }] auf Wandfeldern (gelaende.wand), die waagrecht oder senkrecht an
//     den Boden eines Raums grenzen, etwa Wandfackeln (systeme/licht.js); Zufall "wandobjekte"
//   erreichbarkeit: jedes Feld, das ein laufendes Wesen betreten kann (Türen zählen als offen), muss von der Treppe
//     hinauf (sonst hinab, sonst der Mitte des ersten Raums) in acht Richtungen erreichbar sein, sonst neuer Versuch
//   ebene_anlegen: setzt zustand.ebene
//   wegpunkte: Ziele für umherziehende Wesen (ki/umherziehen.js) in zustand.ebene.wegpunkte [{ x, y }], Vorbild Brogue: die
//     begehbaren Felder (Türen zählen als offen) in einer Reihenfolge aus dem Zufall "wegpunkte"; ein Feld wird Wegpunkt,
//     wenn es noch kein Wegpunkt innerhalb von regeln.ki.wegpunktSicht sieht (Sicht durch das Gelände, rot.js)
//   freie_felder: Bodenfelder (gelaende.boden) außerhalb des ersten Raums und seines Rands, ohne Zugänge, in fester
//     Reihenfolge; ohne Räume (feste Karte) alle Bodenfelder
//   population, gegenstaende, fallen: auf freien Feldern (welt/population.js), mit dem gemeinsamen Zufall "inhalt"

import RNG from "../../lib/rot/rng.js";
import Digger from "../../lib/rot/map/digger.js";
import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { anmelden } from "../kern/register.js";
import { startwertAbleiten, zufallsGanzzahl } from "../kern/zufall.js";
import { ausDatenErzeugen } from "../kern/zustand.js";
import { gelaendeBetretbarFuer, betretbarFuer, durchsichtig, aufDerKarte, feldIndex } from "./karte.js";
import { abstandQuadrat } from "./geometrie.js";
import { ebenennameFuer } from "./plan.js";
import { populationSetzen, freiesFeldZiehen } from "./population.js";

export const NEUER_VERSUCH = "neuer_versuch";

const NACHBARN = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Gelände je Rolle der Ebene ohne Angabe in ebenendaten.gelaende
export const GELAENDE_VORGABEN = { wand: "wand", boden: "boden", tuer: "tuer_zu", treppeAuf: "treppe_auf", treppeAb: "treppe_ab" };

// Kennung des Geländes für eine Rolle der Ebene (wand, boden, tuer, treppeAuf, treppeAb)
export function kennungFuer(spiel, bau, rolle) {
  return spiel.daten.gelaende[bau.ebenendaten.gelaende?.[rolle] ?? GELAENDE_VORGABEN[rolle]].kennung;
}

const mitte = (raum) => { const [x, y] = raum.getCenter(); return { x, y }; };

function felderMitKennung(zeilen, kennung) {
  const ergebnis = [];
  zeilen.forEach((zeile, y) => zeile.forEach((zeichen, x) => { if (zeichen === kennung) ergebnis.push({ x, y }); }));
  return ergebnis;
}

anmelden("ebenenschritte", "karte_digger", {
  braucht: [], liefert: ["karte", "raeume"],
  ausfuehren(spiel, bau) {
    const { breite, hoehe } = bau.ebenendaten;
    const kennungWand = kennungFuer(spiel, bau, "wand"), kennungBoden = kennungFuer(spiel, bau, "boden");
    // rot.js nutzt einen globalen Zufall; Startwert 0 ist dort ungültig
    RNG.setSeed(startwertAbleiten(spiel.zustand.startwert, bau.schluessel) || 1);
    // timeLimit: Infinity, sonst bricht der Digger nach Uhrzeit ab und die Ebene ist nicht wiederholbar
    const digger = new Digger(breite, hoehe, { ...bau.ebenendaten.digger, timeLimit: Infinity });
    bau.zeilen = Array.from({ length: hoehe }, () => new Array(breite).fill(kennungWand));
    // rot.js meldet je Feld 0 für Boden, 1 für Wand
    digger.create((x, y, feldart) => { if (feldart === 0) bau.zeilen[y][x] = kennungBoden; });
    bau.raeume = digger.getRooms();
  },
});

anmelden("ebenenschritte", "karte_fest", {
  braucht: [], liefert: ["karte", "treppen"],
  ausfuehren(spiel, bau) {
    bau.zeilen = bau.ebenendaten.karte.map((zeile) => [...zeile]);
    bau.treppen = {
      treppeAuf: felderMitKennung(bau.zeilen, kennungFuer(spiel, bau, "treppeAuf"))[0] ?? null,
      treppeAb: felderMitKennung(bau.zeilen, kennungFuer(spiel, bau, "treppeAb"))[0] ?? null,
    };
  },
});

// Türen in fester Reihenfolge (Räume, dann Zugänge, wie rot.js sie meldet)
anmelden("ebenenschritte", "tueren", {
  braucht: ["karte", "raeume"], liefert: [],
  ausfuehren(spiel, bau) {
    const tuerChance = bau.ebenendaten.tuerChance ?? 0;
    if (tuerChance <= 0) return;
    const zufall = bau.zufall("tueren");
    const kennungBoden = kennungFuer(spiel, bau, "boden"), kennungTuer = kennungFuer(spiel, bau, "tuer");
    for (const raum of bau.raeume) {
      raum.getDoors((x, y) => {
        const feldSchluessel = `${x},${y}`;
        if (bau.tuerFelder.has(feldSchluessel) || bau.zeilen[y][x] !== kennungBoden) return;
        bau.tuerFelder.add(feldSchluessel);
        if (zufallsGanzzahl(zufall, 1, 100) <= tuerChance) bau.zeilen[y][x] = kennungTuer;
      });
    }
  },
});

anmelden("ebenenschritte", "treppen", {
  braucht: ["karte", "raeume"], liefert: ["treppen"],
  ausfuehren(spiel, bau) {
    const startraum = bau.raeume[0];
    const start = mitte(startraum);
    const fernsterRaum = bau.raeume.slice(1).reduce((bester, raum) => (abstandQuadrat(mitte(raum), start) > abstandQuadrat(mitte(bester), start) ? raum : bester), bau.raeume[bau.raeume.length - 1]);
    const treppeAuf = ebenennameFuer(spiel.zustand, bau.tiefe - 1) ? start : null;
    const treppeAb = ebenennameFuer(spiel.zustand, bau.tiefe + 1) && fernsterRaum !== startraum ? mitte(fernsterRaum) : null;
    if (treppeAuf) bau.zeilen[treppeAuf.y][treppeAuf.x] = kennungFuer(spiel, bau, "treppeAuf");
    if (treppeAb) bau.zeilen[treppeAb.y][treppeAb.x] = kennungFuer(spiel, bau, "treppeAb");
    bau.treppen = { treppeAuf, treppeAb };
  },
});

anmelden("ebenenschritte", "gelaende_objekte", {
  braucht: ["karte", "raeume"], liefert: [],
  ausfuehren(spiel, bau) {
    const kennungBoden = kennungFuer(spiel, bau, "boden");
    const objektFelder = [];
    for (const raum of bau.raeume.slice(1)) {
      for (let y = raum.getTop() + 1; y <= raum.getBottom() - 1; y++) {
        for (let x = raum.getLeft() + 1; x <= raum.getRight() - 1; x++) if (bau.zeilen[y][x] === kennungBoden) objektFelder.push({ x, y });
      }
    }
    const zufall = bau.zufall("objekte");
    for (const { gelaende, anzahl } of bau.ebenendaten.gelaendeObjekte || []) {
      for (let i = 0; i < anzahl && objektFelder.length; i++) {
        const { x, y } = objektFelder.splice(zufallsGanzzahl(zufall, 0, objektFelder.length - 1), 1)[0];
        bau.zeilen[y][x] = spiel.daten.gelaende[gelaende].kennung;
      }
    }
  },
});

anmelden("ebenenschritte", "wand_objekte", {
  braucht: ["karte", "raeume"], liefert: [],
  ausfuehren(spiel, bau) {
    const objekte = bau.ebenendaten.wandObjekte || [];
    if (!objekte.length) return;
    const kennungWand = kennungFuer(spiel, bau, "wand");
    const hoehe = bau.zeilen.length, breite = bau.zeilen[0].length;
    const istWand = (x, y) => x >= 0 && y >= 0 && x < breite && y < hoehe && bau.zeilen[y][x] === kennungWand;
    const gesehen = new Set();
    const wandFelder = [];
    const dazu = (x, y) => {
      if (!istWand(x, y) || gesehen.has(`${x},${y}`)) return;
      gesehen.add(`${x},${y}`);
      wandFelder.push({ x, y });
    };
    // der Rand jedes Raums ohne Ecken, in fester Reihenfolge
    for (const raum of bau.raeume) {
      for (let x = raum.getLeft(); x <= raum.getRight(); x++) { dazu(x, raum.getTop() - 1); dazu(x, raum.getBottom() + 1); }
      for (let y = raum.getTop(); y <= raum.getBottom(); y++) { dazu(raum.getLeft() - 1, y); dazu(raum.getRight() + 1, y); }
    }
    const zufall = bau.zufall("wandobjekte");
    for (const { gelaende, anzahl } of objekte) {
      for (let i = 0; i < anzahl && wandFelder.length; i++) {
        const { x, y } = wandFelder.splice(zufallsGanzzahl(zufall, 0, wandFelder.length - 1), 1)[0];
        bau.zeilen[y][x] = spiel.daten.gelaende[gelaende].kennung;
      }
    }
  },
});

// Begehbare Felder, die vom Start aus nicht erreichbar sind, als [{ x, y }] in fester Reihenfolge
export function unerreichbareFelder(spiel, zeilen, start) {
  const gelaendeNachKennung = {};
  for (const gelaende of Object.values(spiel.daten.gelaende)) gelaendeNachKennung[gelaende.kennung] = gelaende;
  const hoehe = zeilen.length, breite = zeilen[0].length;
  const begehbar = (x, y) => x >= 0 && y >= 0 && x < breite && y < hoehe && gelaendeBetretbarFuer(spiel, gelaendeNachKennung[zeilen[y][x]]);
  const erreicht = new Uint8Array(breite * hoehe);
  const offen = [];
  if (start && begehbar(start.x, start.y)) {
    erreicht[start.y * breite + start.x] = 1;
    offen.push(start);
  }
  while (offen.length) {
    const { x, y } = offen.pop();
    for (const [dx, dy] of NACHBARN) {
      const nachbarX = x + dx, nachbarY = y + dy;
      if (!begehbar(nachbarX, nachbarY) || erreicht[nachbarY * breite + nachbarX]) continue;
      erreicht[nachbarY * breite + nachbarX] = 1;
      offen.push({ x: nachbarX, y: nachbarY });
    }
  }
  const ergebnis = [];
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) if (begehbar(x, y) && !erreicht[y * breite + x]) ergebnis.push({ x, y });
  return ergebnis;
}

anmelden("ebenenschritte", "erreichbarkeit", {
  braucht: ["karte", "treppen"], liefert: [], verwirft: true,
  ausfuehren(spiel, bau) {
    const start = bau.treppen.treppeAuf ?? bau.treppen.treppeAb ?? (bau.raeume.length ? mitte(bau.raeume[0]) : null);
    if (unerreichbareFelder(spiel, bau.zeilen, start).length) return NEUER_VERSUCH;
  },
});

anmelden("ebenenschritte", "ebene_anlegen", {
  braucht: ["karte"], liefert: ["ebene"],
  ausfuehren(spiel, bau) {
    const hoehe = bau.zeilen.length, breite = bau.zeilen[0].length;
    spiel.zustand.ebene = {
      name: bau.name, breite, hoehe,
      felder: bau.zeilen.map((zeile) => zeile.join("")),
      erkundet: new Array(breite * hoehe).fill(0),
      erinnerung: new Array(breite * hoehe).fill(null),
      erinnerteDinge: {},
      schichten: { oberflaeche: {}, gas: {}, feuer: {} },
    };
    // Grundhelligkeit aus der Vorlage (systeme/licht.js); ohne Angabe ist jedes Feld taghell
    if (bau.ebenendaten.licht) spiel.zustand.ebene.licht = structuredClone(bau.ebenendaten.licht);
  },
});

anmelden("ebenenschritte", "wegpunkte", {
  braucht: ["ebene"], liefert: [],
  ausfuehren(spiel, bau) {
    const ebene = spiel.zustand.ebene;
    const zufall = bau.zufall("wegpunkte");
    const felder = [];
    for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) if (betretbarFuer(spiel, x, y)) felder.push({ x, y });
    // Fisher-Yates mit dem Zufall der Ebene
    for (let i = felder.length - 1; i > 0; i--) {
      const j = zufallsGanzzahl(zufall, 0, i);
      [felder[i], felder[j]] = [felder[j], felder[i]];
    }
    const abgedeckt = new Uint8Array(ebene.breite * ebene.hoehe);
    const schattenwurf = new PreciseShadowcasting((x, y) => aufDerKarte(ebene, x, y) && durchsichtig(spiel, x, y), { topology: 8 });
    ebene.wegpunkte = [];
    for (const feld of felder) {
      if (abgedeckt[feldIndex(ebene, feld.x, feld.y)]) continue;
      ebene.wegpunkte.push(feld);
      schattenwurf.compute(feld.x, feld.y, spiel.daten.regeln.ki.wegpunktSicht, (x, y) => {
        if (aufDerKarte(ebene, x, y)) abgedeckt[feldIndex(ebene, x, y)] = 1;
      });
    }
  },
});

anmelden("ebenenschritte", "freie_felder", {
  braucht: ["ebene"], liefert: ["freie_felder"],
  ausfuehren(spiel, bau) {
    const kennungBoden = kennungFuer(spiel, bau, "boden");
    const startraum = bau.raeume[0];
    for (let y = 0; y < bau.zeilen.length; y++) {
      for (let x = 0; x < bau.zeilen[y].length; x++) {
        if (bau.zeilen[y][x] !== kennungBoden || bau.tuerFelder.has(`${x},${y}`)) continue;
        const imStartraum = startraum && x >= startraum.getLeft() - 1 && x <= startraum.getRight() + 1
          && y >= startraum.getTop() - 1 && y <= startraum.getBottom() + 1;
        if (!imStartraum) bau.freieFelder.push({ x, y });
      }
    }
  },
});

anmelden("ebenenschritte", "population", {
  braucht: ["ebene", "freie_felder"], liefert: [],
  ausfuehren(spiel, bau) {
    populationSetzen(spiel, bau, bau.zufall("inhalt"));
  },
});

// Einträge [{ typ, anzahl }] einer Liste der Ebene als Entitäten aus einem Teil der Daten auf freie Felder
function aufFreieFelderSetzen(spiel, bau, eintraege, datenteil) {
  const zufall = bau.zufall("inhalt");
  for (const eintrag of eintraege || []) {
    for (let i = 0; i < eintrag.anzahl; i++) {
      const feld = freiesFeldZiehen(bau, zufall);
      if (feld) ausDatenErzeugen(spiel, datenteil, eintrag.typ, feld);
    }
  }
}

anmelden("ebenenschritte", "gegenstaende", {
  braucht: ["ebene", "freie_felder"], liefert: [],
  ausfuehren(spiel, bau) { aufFreieFelderSetzen(spiel, bau, bau.ebenendaten.gegenstaende, "gegenstaende"); },
});

anmelden("ebenenschritte", "fallen", {
  braucht: ["ebene", "freie_felder"], liefert: [],
  ausfuehren(spiel, bau) { aufFreieFelderSetzen(spiel, bau, bau.ebenendaten.fallen, "fallen"); },
});
