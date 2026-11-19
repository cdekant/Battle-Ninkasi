// Feldschichten: Oberfläche, Gas mit Ausgleich und Abbau, dichter Rauch, Feuer, Wege und Ebene
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { miniSpiel, wesen, spielerinSetzen, weltLaufenLassen, meldungenMitschneiden } from "./hilfen.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { holen } from "../src/kern/register.js";
import { gelaendeName, feldIndex } from "../src/welt/karte.js";
import { flugbahn, sichtlinieFrei } from "../src/welt/geometrie.js";
import { weg } from "../src/welt/wege.js";
import { schichtAuf, schichtenVon } from "../src/welt/schichten.js";
import { oberflaecheSetzen, gasSetzen, entzuenden, gefahrenMeiden } from "../src/systeme/schichten.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { vorbereiten } from "../src/kern/daten.js";

const GELAENDE = {
  holz: { kennung: "=", passierbar: false, durchsichtig: false, brennbar: 100, brenndauer: 2, verbrenntZu: "boden" },
  bottich: { kennung: "O", passierbar: false, durchsichtig: true, quelle: { gas: "dunst", menge: 22 } },
};

const SCHICHTEN = {
  oberflaechen: {
    schleim: { text: "o.schleim", hoechstens: 5, jeTick: "aetzen", beimBetreten: "aetzen" },
    pfuetze: { text: "o.pfuetze", schwund: 1 },
    brand: { text: "o.brand", schwund: 1, brennbar: 100, brenndauer: 2, verbrenntZu: "asche" },
    asche: { text: "o.asche" },
    myzel: { text: "o.myzel", ausbreitung: { chance: 100 } },
  },
  gase: {
    dunst: { text: "g.dunst", stufen: [{ ab: 10, effekt: "husten", wenn: [{ bedingung: "ohne_tag", tag: "anaerob" }] }, { ab: 50, effekt: "ersticken" }] },
    nebel: { text: "g.nebel" },
    rauch: { text: "g.rauch", abbau: 50, undurchsichtigAb: 40 },
    dampf: { text: "g.dampf", brennbar: 100, explodiert: "verpuffung" },
  },
};

const EFFEKTE = {
  aetzen: { schritte: [{ baustein: "schaden", art: "saeure", menge: 1 }] },
  husten: { schritte: [{ baustein: "schaden", art: "gift", menge: 1 }] },
  ersticken: { schritte: [{ baustein: "schaden", art: "gift", menge: 5 }] },
  brennen: { schritte: [{ baustein: "schaden", art: "feuer", menge: 2 }] },
  verpuffung: { schritte: [{ baustein: "fuer_jedes_ziel", muster: { art: "kreis", radius: 1 }, trifft: "wesen", effekt: "brennen" }] },
};

const RAUM = ["#########", "#.......#", "#.......#", "#.......#", "#########"];

function spielBauen(karte = RAUM, regeln = {}) {
  const spiel = miniSpiel(karte, { gelaende: GELAENDE, schichten: SCHICHTEN, effekte: EFFEKTE, regeln: { feuer: { brennen: "brennen", dauer: 2, rauch: "rauch", rauchMenge: 0 }, ...regeln } });
  return { spiel, meldungen: meldungenMitschneiden(spiel) };
}

const tick = (spiel, anzahl = 1) => weltLaufenLassen(spiel, spiel.zustand.zeit + 100 * anzahl);
const gasSumme = (spiel) => Object.values(schichtenVon(spiel.zustand.ebene).gas).reduce((summe, eintrag) => summe + eintrag.menge, 0);

test("Oberfläche: gleiche Art addiert bis zur Grenze, eine andere verdrängt, nie auf der Wand; Schwund lässt sie trocknen", () => {
  const { spiel } = spielBauen();
  oberflaecheSetzen(spiel, { x: 2, y: 2 }, "schleim", 3);
  oberflaecheSetzen(spiel, { x: 2, y: 2 }, "schleim", 4);
  assert.deepEqual(schichtAuf(spiel, "oberflaeche", 2, 2), { art: "schleim", menge: 5 });
  oberflaecheSetzen(spiel, { x: 2, y: 2 }, "pfuetze", 2);
  assert.deepEqual(schichtAuf(spiel, "oberflaeche", 2, 2), { art: "pfuetze", menge: 2 });
  oberflaecheSetzen(spiel, { x: 0, y: 0 }, "pfuetze", 2);
  assert.equal(schichtAuf(spiel, "oberflaeche", 0, 0), null);
  tick(spiel, 2);
  assert.equal(schichtAuf(spiel, "oberflaeche", 2, 2), null, "getrocknet");
});

test("Oberfläche wirkt beim Betreten und je Welttick auf Laufende, nicht auf Fliegende; Myzel breitet sich aus", () => {
  const { spiel } = spielBauen();
  oberflaecheSetzen(spiel, { x: 3, y: 2 }, "schleim", 5);
  const laeuferin = wesen(spiel, 2, 2, "feinde", 20);
  holen("befehle", "bewegen").ausfuehren(spiel, laeuferin, { art: "bewegen", dx: 1, dy: 0 });
  vorgangAbschliessen(spiel);
  assert.equal(laeuferin.werte.lp.aktuell, 19, "beim Betreten");
  const fliegerin = wesen(spiel, 3, 3, "feinde", 20, { bewegung: "fliegend" });
  oberflaecheSetzen(spiel, { x: 3, y: 3 }, "schleim", 5);
  tick(spiel);
  assert.deepEqual([laeuferin.werte.lp.aktuell, fliegerin.werte.lp.aktuell], [18, 20]);

  oberflaecheSetzen(spiel, { x: 6, y: 1 }, "myzel", 1);
  tick(spiel);
  const myzelfelder = Object.values(schichtenVon(spiel.zustand.ebene).oberflaeche).filter((eintrag) => eintrag.art === "myzel").length;
  assert.equal(myzelfelder, 2);
});

test("Gas: der Ausgleich erhält die Menge, Wände und geschlossene Türen halten auf, Gase vermischen sich nicht", () => {
  const { spiel } = spielBauen(["#######", "#..+..#", "#######"]);
  gasSetzen(spiel, { x: 1, y: 1 }, "nebel", 90);
  tick(spiel, 10);
  assert.equal(gasSumme(spiel), 90, "ohne Abbau bleibt alles");
  assert.ok(schichtAuf(spiel, "gas", 2, 1).menge > 0, "verteilt");
  assert.equal(schichtAuf(spiel, "gas", 4, 1), null, "hinter der geschlossenen Tür nichts");
  gasSetzen(spiel, { x: 2, y: 1 }, "dunst", 1);
  assert.equal(schichtAuf(spiel, "gas", 2, 1).art, "nebel", "die größere Menge behauptet sich");
});

test("Gas: Quelle am Gelände strömt auf die Nachbarn aus, Abbau im Mittel genau, Stufen nach Menge und Bedingung", () => {
  const { spiel } = spielBauen(["#####", "#.O.#", "#####"]);
  const atmende = wesen(spiel, 1, 1, "feinde", 50);
  const anaerobe = wesen(spiel, 3, 1, "feinde", 50, { tags: ["anaerob"] });
  tick(spiel);
  assert.deepEqual([schichtAuf(spiel, "gas", 1, 1).menge, schichtAuf(spiel, "gas", 3, 1).menge], [11, 11], "22 auf zwei Felder");
  assert.deepEqual([atmende.werte.lp.aktuell, anaerobe.werte.lp.aktuell], [49, 50], "ab 10 husten, nur wer atmet");
  tick(spiel, 5);
  assert.ok(schichtAuf(spiel, "gas", 1, 1).menge >= 50);
  assert.ok(anaerobe.werte.lp.aktuell < 50, "ab 50 erstickt auch, wer anaerob lebt (die Stufe hat keine Bedingung)");

  const abbau = spielBauen(["###", "#.#", "###"]).spiel;
  gasSetzen(abbau, { x: 1, y: 1 }, "rauch", 100);
  tick(abbau);
  assert.equal(gasSumme(abbau), 50, "die Hälfte von 100, ohne Wurf");
});

test("Dichter Rauch versperrt Sicht und Sichtlinie, aber keine Geschosse", () => {
  const { spiel } = spielBauen(["#######", "#.....#", "#######"]);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.sicht = { reichweite: 6 };
  gasSetzen(spiel, { x: 3, y: 1 }, "rauch", 60);
  sichtfeldAktualisieren(spiel);
  assert.ok(!spiel.zustand.sichtbareFelder.includes(feldIndex(spiel.zustand.ebene, 5, 1)));
  assert.ok(!sichtlinieFrei(spiel, { x: 1, y: 1 }, { x: 5, y: 1 }));
  assert.deepEqual(flugbahn(spiel, { x: 1, y: 1 }, { x: 5, y: 1 }).aufschlag, { x: 5, y: 1 });
  gasSetzen(spiel, { x: 3, y: 1 }, "rauch", 0);
  schichtenVon(spiel.zustand.ebene).gas[feldIndex(spiel.zustand.ebene, 3, 1)].menge = 20;
  assert.ok(sichtlinieFrei(spiel, { x: 1, y: 1 }, { x: 5, y: 1 }), "dünner Rauch versperrt nichts");
});

test("Feuer: entzündet nur Brennbares, brennt Wesen, greift über, erlischt zu Asche und verbrennt Holz", () => {
  const { spiel } = spielBauen(["#######", "#..=..#", "#######"]);
  assert.equal(entzuenden(spiel, { x: 1, y: 1 }), false, "nichts zu brennen");
  oberflaecheSetzen(spiel, { x: 1, y: 1 }, "brand", 3);
  oberflaecheSetzen(spiel, { x: 2, y: 1 }, "brand", 3);
  const opfer = wesen(spiel, 2, 1, "feinde", 20);
  assert.equal(entzuenden(spiel, { x: 1, y: 1 }), true);
  tick(spiel);
  assert.equal(opfer.werte.lp.aktuell, 20, "das Nachbarfeld fängt erst Feuer");
  assert.ok(schichtAuf(spiel, "feuer", 2, 1));
  tick(spiel);
  assert.equal(opfer.werte.lp.aktuell, 18);
  assert.deepEqual(schichtAuf(spiel, "oberflaeche", 1, 1), { art: "asche", menge: 1 });
  tick(spiel, 4);
  assert.equal(gelaendeName(spiel, 3, 1), "boden", "das Holz ist verbrannt");
  assert.equal(Object.keys(schichtenVon(spiel.zustand.ebene).feuer).length, 0, "alles erloschen");
});

test("Brennbares Gas verpufft auf einmal; Feuer erzeugt Rauch", () => {
  const { spiel } = spielBauen(RAUM, { feuer: { brennen: "brennen", dauer: 2, rauch: "rauch", rauchMenge: 30 } });
  gasSetzen(spiel, { x: 3, y: 2 }, "dampf", 20);
  const nah = wesen(spiel, 4, 2, "feinde", 20);
  entzuenden(spiel, { x: 3, y: 2 });
  vorgangAbschliessen(spiel);
  assert.equal(nah.werte.lp.aktuell, 18, "Verpuffung trifft die Nachbarschaft");
  assert.equal(schichtAuf(spiel, "gas", 3, 2), null);
  tick(spiel);
  assert.equal(schichtAuf(spiel, "gas", 3, 2)?.art, "rauch");
});

test("Wege meiden Feuer und Gefährliches; die Ebene stellt Gärbottiche ins Rauminnere", () => {
  const { spiel } = spielBauen(["#####", "#...#", "#...#", "#####"]);
  oberflaecheSetzen(spiel, { x: 2, y: 1 }, "brand", 3);
  entzuenden(spiel, { x: 2, y: 1 });
  assert.deepEqual(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { meiden: gefahrenMeiden(spiel) })[0], { x: 2, y: 2 });

  const daten = datenLaden(rohdaten, { texte });
  const echt = neuesSpiel(daten, 4);
  assert.equal((echt.zustand.ebene.felder.join("").match(/O/g) || []).length, 3);
  assert.deepEqual(echt.zustand.ebene.schichten, { oberflaeche: {}, gas: {}, feuer: {} });
});

test("Datenprüfung: Schichten, Stufen, Gelände mit Quelle und Brennbarkeit, Regeln für Feuer", () => {
  const pruefen = (aendern) => {
    const daten = structuredClone(rohdaten);
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.schichten.oberflaechen.saeure.brennbar = 150; }, "brennbar"],
    [(daten) => { daten.schichten.oberflaechen.brand.verbrenntZu = "glut"; }, 'Oberfläche "glut"'],
    [(daten) => { daten.schichten.gase.co2.stufen[1].ab = 10; }, "ab muss aufsteigen"],
    [(daten) => { daten.schichten.gase.co2.stufen[0].wenn = [{ bedingung: "mondphase" }]; }, "nicht angemeldet"],
    [(daten) => { delete daten.zeichen.schichten.rauch; }, "kein Zeichen"],
    [(daten) => { daten.gelaende.gaerbottich.quelle = { gas: "lachgas", menge: 3 }; }, 'Gas "lachgas"'],
    [(daten) => { daten.gelaende.tuer_zu.verbrenntZu = "kohle"; }, 'Gelände "kohle"'],
    [(daten) => { daten.ebenen.keller.gelaendeObjekte = [{ gelaende: "thron", anzahl: 1 }]; }, 'Gelände "thron"'],
    [(daten) => { delete daten.regeln.feuer; }, "regeln.feuer"],
    [(daten) => { daten.effekte.test = { schritte: [{ baustein: "oberflaeche_setzen", art: "lava", menge: 1 }] }; }, 'Oberfläche "lava"'],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
