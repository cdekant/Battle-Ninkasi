// Licht (siehe docs/Welt.md, Licht): Helligkeit als Abfrage, Quellen, Stufen, Sehen im Dunkeln, Heimlichkeit, Ebenen.
import { test } from "node:test";
import { positionSetzen } from "../src/kern/raumindex.js";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { vorbereiten } from "../src/kern/daten.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { feldIndex, gelaendeName } from "../src/welt/karte.js";
import { helligkeitAuf, lichtbeitrag, lichtWirkt, lichtstufeAuf, stufeVonHelligkeit, lichtAufFeld } from "../src/systeme/licht.js";
import { sieht, sichtfeldAktualisieren, istSichtbar, sichtImDunkeln } from "../src/systeme/sicht.js";
import { heimlichkeitsweite } from "../src/systeme/wahrnehmung.js";
import { versetzen } from "../src/systeme/bewegung.js";
import { holen } from "../src/kern/register.js";
import { ebeneWechseln } from "../src/systeme/ebenen.js";

const RAUM = [
  "###############",
  "#.............#",
  "#.............#",
  "#.............#",
  "###############",
];

const GELAENDE = {
  fackel: { text: "gelaende.fackel", kennung: "*", passierbar: false, durchsichtig: false, licht: { reichweite: 2, staerke: 60 } },
};

const LAMPE = { reichweite: 3, staerke: 80 };

// Ebene in Finsternis; Ninkasi links, ihr Sichtfeld aus dem Schattenwurf
function dunkel({ karte = RAUM, grundhelligkeit = 0, gelaende = {} } = {}) {
  const spiel = miniSpiel(karte, { gelaende: { ...GELAENDE, ...gelaende } });
  spiel.zustand.ebene.licht = { grundhelligkeit };
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.sicht = { reichweite: 12, imDunkeln: 2 };
  return { spiel, ninkasi };
}

test("Ohne Licht in den Daten ist jedes Feld taghell, und Licht wirkt nicht", () => {
  const spiel = miniSpiel(RAUM);
  assert.equal(lichtWirkt(spiel), false);
  assert.equal(helligkeitAuf(spiel, 5, 2), 100);
  assert.equal(lichtstufeAuf(spiel, 5, 2).name, "taghell");
  spiel.zustand.ebene.licht = { grundhelligkeit: 85 };
  assert.equal(lichtWirkt(spiel), false, "schon die Grundhelligkeit liegt in der obersten Stufe");
});

test("Beitrag einer Quelle: zum Rand hin die halbe Stärke, jenseits der Reichweite nichts", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((entfernung) => lichtbeitrag(LAMPE, entfernung)), [80, 66, 53, 40, 0]);
  assert.deepEqual([0, 1].map((entfernung) => lichtbeitrag({ reichweite: 0, staerke: 30 }, entfernung)), [30, 0]);
});

test("Stufen: finster, dunkel, dämmrig, hell und taghell nach regeln.licht.stufen", () => {
  const spiel = miniSpiel(RAUM);
  const namen = [0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map((helligkeit) => stufeVonHelligkeit(spiel, helligkeit).name);
  assert.deepEqual(namen, ["finster", "finster", "dunkel", "dunkel", "daemmrig", "daemmrig", "hell", "hell", "taghell", "taghell"]);
});

test("Quellen: Wesen, angelegter Gegenstand von der Trägerin aus, am Boden ja, im Gepäck nicht", () => {
  const { spiel } = dunkel();
  const traeger = wesen(spiel, 7, 2, "feinde", 10);
  const lampe = gegenstandTragen(spiel, traeger, { typ: "lampe", ausruestung: { platz: "hand" }, licht: LAMPE });
  assert.equal(helligkeitAuf(spiel, 7, 2), 0, "im Gepäck leuchtet nichts");
  traeger.ausgeruestet = [lampe.id];
  assert.equal(helligkeitAuf(spiel, 7, 2), 80);
  assert.equal(helligkeitAuf(spiel, 9, 2), 53);
  assert.equal(helligkeitAuf(spiel, 11, 2), 0);
  entitaetErzeugen(spiel.zustand, { typ: "gluehwurm", position: { x: 9, y: 2 }, licht: { reichweite: 1, staerke: 30 } });
  assert.equal(helligkeitAuf(spiel, 9, 2), 83, "Quellen addieren sich");
  entitaetErzeugen(spiel.zustand, { typ: "lampe_am_boden", position: { x: 9, y: 2 }, licht: LAMPE });
  assert.equal(helligkeitAuf(spiel, 9, 2), 100, "höchstens 100");
  assert.equal(lichtWirkt(spiel), true);
});

test("Quellen: Gelände und Feuer; Wände halten das Licht auf", () => {
  const karte = [
    "###############",
    "#*.....#......#",
    "#......#......#",
    "#......#......#",
    "###############",
  ];
  const { spiel } = dunkel({ karte });
  assert.equal(helligkeitAuf(spiel, 2, 1), 45, "die Fackel in der Wand leuchtet in den Raum");
  assert.equal(helligkeitAuf(spiel, 4, 1), 0);
  const ebene = spiel.zustand.ebene;
  ebene.schichten = { oberflaeche: {}, gas: {}, feuer: { [feldIndex(ebene, 5, 2)]: { menge: 3 } } };
  const feuerlicht = spiel.daten.regeln.feuer.licht;
  assert.equal(helligkeitAuf(spiel, 5, 2), feuerlicht.staerke);
  assert.equal(helligkeitAuf(spiel, 8, 2), 0, "hinter der Wand bleibt es finster");
  const { beitraege } = lichtAufFeld(spiel, 5, 2);
  assert.equal(beitraege[0].licht.farbe, feuerlicht.farbe, "die Anzeige kennt die Farbe");
});

test("Sehen: ein Ziel auf einem finsteren Feld nur bis sichtImDunkeln, im Licht so weit wie die Sichtweite", () => {
  const { spiel, ninkasi } = dunkel();
  const waechter = wesen(spiel, 7, 2, "feinde", 10, { sicht: { reichweite: 9 } });
  assert.equal(sichtImDunkeln(spiel, waechter), 1, "Vorgabe aus regeln.licht.imDunkeln");
  assert.equal(sieht(spiel, waechter, ninkasi), false);
  positionSetzen(spiel.zustand, ninkasi, { x: 6, y: 2 });
  assert.equal(sieht(spiel, waechter, ninkasi), true, "aus nächster Nähe");
  positionSetzen(spiel.zustand, ninkasi, { x: 3, y: 2 });
  waechter.modifikatoren = [{ ziel: "sichtImDunkeln", art: "plus", betrag: 3 }];
  assert.equal(sieht(spiel, waechter, ninkasi), true, "Nachtsicht als Modifikator");
  waechter.modifikatoren = [];
  entitaetErzeugen(spiel.zustand, { typ: "lampe_am_boden", position: { x: 3, y: 3 }, licht: { reichweite: 1, staerke: 40 } });
  assert.equal(lichtstufeAuf(spiel, 3, 2).name, "dunkel");
  assert.equal(sieht(spiel, waechter, ninkasi), true, "schon dunkel reicht zum Sehen");
});

test("Ninkasis Sichtfeld: finstere Felder nur aus der Nähe, beleuchtete auch von weitem", () => {
  const { spiel } = dunkel();
  sichtfeldAktualisieren(spiel);
  assert.equal(istSichtbar(spiel.zustand, 3, 2), true);
  assert.equal(istSichtbar(spiel.zustand, 4, 2), false);
  entitaetErzeugen(spiel.zustand, { typ: "lampe_am_boden", position: { x: 10, y: 2 }, licht: LAMPE });
  sichtfeldAktualisieren(spiel);
  assert.equal(istSichtbar(spiel.zustand, 10, 2), true);
  assert.equal(istSichtbar(spiel.zustand, 13, 2), true, "der Rand des Scheins ist noch dämmrig");
  assert.equal(istSichtbar(spiel.zustand, 6, 2), false, "dazwischen bleibt es finster");
  assert.equal(spiel.zustand.ebene.erkundet[feldIndex(spiel.zustand.ebene, 6, 2)], 1, "der Test-Ebene gilt alles als erkundet");
});

test("Eine bewegte Lampe ändert Ninkasis Sichtfeld sofort", () => {
  const { spiel } = dunkel();
  const traeger = wesen(spiel, 11, 2, "feinde", 10, { licht: LAMPE });
  sichtfeldAktualisieren(spiel);
  assert.equal(istSichtbar(spiel.zustand, 7, 2), false);
  versetzen(spiel, traeger, { x: 8, y: 2 }, "laufen");
  assert.equal(istSichtbar(spiel.zustand, 7, 2), true);
});

test("Weltuhr: wo Licht wirkt, folgt Ninkasis Sichtfeld dem Licht (eine Laterne angelegt)", () => {
  const { spiel, ninkasi } = dunkel();
  sichtfeldAktualisieren(spiel);
  assert.equal(istSichtbar(spiel.zustand, 4, 2), false);
  const laterne = gegenstandTragen(spiel, ninkasi, { typ: "laterne", ausruestung: { platz: "hand" }, licht: LAMPE });
  ninkasi.ausgeruestet = [laterne.id];
  holen("welttick", "licht")(spiel);
  assert.equal(istSichtbar(spiel.zustand, 4, 2), true);
});

test("Heimlichkeit nach der Stufe des eigenen Felds", () => {
  const { spiel, ninkasi } = dunkel({ grundhelligkeit: 45 });
  assert.equal(lichtstufeAuf(spiel, 1, 2).name, "daemmrig");
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 5, "7 mal 70 %");
  spiel.zustand.ebene.licht.grundhelligkeit = 100;
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 7);
  spiel.zustand.ebene.licht.grundhelligkeit = 0;
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 4, "finster: die Hälfte, gerundet");
});

test("Ebenen: der dunkle Keller ist finster und hat Wandfackeln am Rand der Räume", () => {
  const daten = datenLaden(rohdaten, { texte });
  const tiefe = daten.abfolge.indexOf("keller_dunkel");
  assert.ok(tiefe > 0, "der Probeinhalt hat einen dunklen Keller");
  const spiel = neuesSpiel(daten, 3);
  ebeneWechseln(spiel, tiefe);
  const ebene = spiel.zustand.ebene;
  assert.equal(ebene.licht.grundhelligkeit, 0);
  assert.equal(lichtWirkt(spiel), true);
  const fackeln = [];
  for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) if (gelaendeName(spiel, x, y) === "wandfackel") fackeln.push({ x, y });
  assert.equal(fackeln.length, daten.ebenen.keller_dunkel.wandObjekte[0].anzahl);
  // jede Fackel grenzt waagrecht oder senkrecht an Boden
  const anBoden = ({ x, y }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => gelaendeName(spiel, x + dx, y + dy) === "boden");
  assert.ok(fackeln.every(anBoden));
  assert.ok(fackeln.some(({ x, y }) => helligkeitAuf(spiel, x + 1, y) > 0 || helligkeitAuf(spiel, x - 1, y) > 0 || helligkeitAuf(spiel, x, y + 1) > 0 || helligkeitAuf(spiel, x, y - 1) > 0));
});

test("Datenprüfung: Licht an Quellen, Ebenen, Sicht und in den Regeln", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(pruefen(() => {}), []);
  const erwartet = [
    [(daten) => { daten.gelaende.testgelaende.licht = { reichweite: -1, staerke: 50 }; }, "gelaende.testgelaende: licht muss"],
    [(daten) => { daten.gegenstaende.testgegenstand = { ...daten.gegenstaende.testgegenstand, licht: { reichweite: 2, staerke: 150 } }; }, "gegenstaende.testgegenstand: licht muss"],
    [(daten) => { daten.ebenen.keller.licht = { grundhelligkeit: 101 }; }, "ebenen.keller: licht muss"],
    [(daten) => { daten.ebenen.keller.wandObjekte = [{ gelaende: "gibtsnicht", anzahl: 1 }]; }, "ebenen.keller.wandObjekte"],
    [(daten) => { daten.wesen.ninkasi.sicht.imDunkeln = -1; }, "sicht.imDunkeln"],
    [(daten) => { daten.regeln.licht.stufen[2].ab = 10; }, "ab muss aufsteigen"],
    [(daten) => { daten.regeln.licht.stufen[0].ab = 5; }, "die erste Stufe beginnt bei 0"],
    [(daten) => { daten.regeln.licht.stufen.at(-1).heimlichkeit = 90; }, "die oberste Stufe"],
    [(daten) => { daten.regeln.feuer.licht = { reichweite: 2 }; }, "regeln.feuer: licht muss"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});

test("Texte der Stufen sind vorhanden", () => {
  const fehler = vorbereiten(structuredClone(rohdaten), { texte }).fehler;
  assert.deepEqual(fehler.filter((meldung) => meldung.includes("regeln.licht")), []);
});
