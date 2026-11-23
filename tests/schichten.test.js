// Feldschichten: Oberfläche, Gas mit Ausgleich und Abbau, dichter Rauch, Feuer, Wege und Ebene
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
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
import { rohdatenMitTesteintraegen } from "./hilfen.js";

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
  schleim_giessen: { schritte: [{ baustein: "oberflaeche_setzen", art: "schleim", menge: 2 }] },
  anzuenden: { schritte: [{ baustein: "entzuenden" }] },
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

const urheberVon = (entitaet) => ({ urheberId: entitaet.id, urheberFraktion: entitaet.fraktion });
const ohneMenge = (eintrag) => eintrag && { urheberId: eintrag.urheberId, urheberFraktion: eintrag.urheberFraktion };

test("Urheberin: der Baustein trägt sie ein, die Fläche wirkt in ihrem Namen; eine Zugabe ohne lässt sie stehen, eine mit übernimmt", () => {
  const { spiel } = spielBauen();
  const erste = wesen(spiel, 1, 1, "feinde", 20), zweite = wesen(spiel, 1, 3, "feinde", 20);
  const opfer = wesen(spiel, 4, 2, "ninkasi", 20);
  effektAnwenden(spiel, "schleim_giessen", { quelleId: erste.id, zielfeld: { x: 4, y: 2 } });
  assert.deepEqual(schichtAuf(spiel, "oberflaeche", 4, 2), { art: "schleim", menge: 2, ...urheberVon(erste) });
  oberflaecheSetzen(spiel, { x: 4, y: 2 }, "schleim", 1);
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "oberflaeche", 4, 2)), urheberVon(erste), "ohne Urheberin bleibt die alte");
  tick(spiel);
  assert.equal(opfer.letzterVerlust.urheberId, erste.id, "jeTick wirkt im Namen der Urheberin");
  assert.equal(opfer.letzterVerlust.ursache, "oberflaeche");
  effektAnwenden(spiel, "schleim_giessen", { quelleId: zweite.id, zielfeld: { x: 4, y: 2 } });
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "oberflaeche", 4, 2)), urheberVon(zweite), "die neue übernimmt");
  oberflaecheSetzen(spiel, { x: 5, y: 2 }, "pfuetze", 2);
  assert.deepEqual(schichtAuf(spiel, "oberflaeche", 5, 2), { art: "pfuetze", menge: 2 }, "ohne Urheberin keine Felder dafür");
});

test("Urheberin erbt: Ausbreitung, Gas in leere Felder, Übergreifen des Feuers, Rauch und Asche", () => {
  const { spiel } = spielBauen(["#######", "#.....#", "#######"], { feuer: { brennen: "brennen", dauer: 2, rauch: "rauch", rauchMenge: 30 } });
  const wirkende = wesen(spiel, 5, 1, "feinde", 20);
  const urheber = { id: wirkende.id, fraktion: wirkende.fraktion };
  oberflaecheSetzen(spiel, { x: 1, y: 1 }, "brand", 3);
  oberflaecheSetzen(spiel, { x: 2, y: 1 }, "brand", 3);
  oberflaecheSetzen(spiel, { x: 4, y: 1 }, "myzel", 1, urheber);
  entzuenden(spiel, { x: 1, y: 1 }, urheber);
  tick(spiel);
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "oberflaeche", 3, 1) ?? schichtAuf(spiel, "oberflaeche", 5, 1)), urheberVon(wirkende), "Myzel breitet sich aus");
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "feuer", 2, 1)), urheberVon(wirkende), "das Feuer greift über");
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "gas", 1, 1)), urheberVon(wirkende), "Rauch");
  tick(spiel, 4);
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "oberflaeche", 1, 1)), urheberVon(wirkende), "Asche");
  const { spiel: gasspiel } = spielBauen();
  const andere = wesen(gasspiel, 5, 3, "feinde", 20);
  gasSetzen(gasspiel, { x: 1, y: 1 }, "nebel", 90, { id: andere.id, fraktion: andere.fraktion });
  gasSetzen(gasspiel, { x: 3, y: 1 }, "nebel", 5);
  tick(gasspiel);
  assert.deepEqual(ohneMenge(schichtAuf(gasspiel, "gas", 2, 1)), urheberVon(andere), "das Gas strömt in ein leeres Feld");
  assert.deepEqual(ohneMenge(schichtAuf(gasspiel, "gas", 3, 1)), { urheberId: undefined, urheberFraktion: undefined }, "in ein volles Feld gleicher Art bleibt dessen Urheberin");
});

test("Urheberin beim Feuer: der Baustein entzündet in ihrem Namen, die Todesursache nennt sie; Verpuffung ohne Urheberin des Feuers zählt die des Gases", () => {
  const { spiel, meldungen } = spielBauen();
  const wirkende = wesen(spiel, 1, 1, "feinde", 20);
  const opfer = wesen(spiel, 4, 2, "ninkasi", 2);
  oberflaecheSetzen(spiel, { x: 4, y: 2 }, "brand", 3);
  effektAnwenden(spiel, "anzuenden", { quelleId: wirkende.id, zielfeld: { x: 4, y: 2 } });
  tick(spiel);
  vorgangAbschliessen(spiel);
  const tod = meldungen.find((meldung) => meldung.art === "tod");
  assert.equal(tod.quelle.id, wirkende.id);
  assert.equal(tod.ursache, "feuer");
  gasSetzen(spiel, { x: 2, y: 2 }, "dampf", 20, { id: wirkende.id, fraktion: wirkende.fraktion });
  const nah = wesen(spiel, 2, 3, "ninkasi", 20);
  entzuenden(spiel, { x: 2, y: 2 });
  assert.equal(nah.letzterVerlust.urheberId, wirkende.id);
  assert.deepEqual(ohneMenge(schichtAuf(spiel, "feuer", 2, 2)), urheberVon(wirkende));
});

test("Wege meiden Feuer und Gefährliches; die Ebene stellt Gärbottiche ins Rauminnere", () => {
  const { spiel } = spielBauen(["#####", "#...#", "#...#", "#####"]);
  oberflaecheSetzen(spiel, { x: 2, y: 1 }, "brand", 3);
  entzuenden(spiel, { x: 2, y: 1 });
  assert.deepEqual(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { meiden: gefahrenMeiden(spiel) })[0], { x: 2, y: 2 });

  const daten = datenLaden(rohdaten, { texte });
  const echt = neuesSpiel(daten, 4);
  const bestellt = rohdaten.ebenen.keller.gelaendeObjekte.find((objekt) => objekt.gelaende === "gaerbottich")?.anzahl ?? 0;
  assert.equal((echt.zustand.ebene.felder.join("").match(/O/g) || []).length, bestellt, "so viele, wie die Ebene bestellt");
  assert.deepEqual(echt.zustand.ebene.schichten, { oberflaeche: {}, gas: {}, feuer: {} });
});

test("Datenprüfung: Schichten, Stufen, Gelände mit Quelle und Brennbarkeit, Regeln für Feuer", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.schichten.oberflaechen.testoberflaeche.brennbar = 150; }, "brennbar"],
    [(daten) => { daten.schichten.oberflaechen.testoberflaeche.verbrenntZu = "glut"; }, 'Oberfläche "glut"'],
    [(daten) => { daten.schichten.gase.testgas.stufen[1].ab = 10; }, "ab muss aufsteigen"],
    [(daten) => { daten.schichten.gase.testgas.stufen[0].wenn = [{ bedingung: "mondphase" }]; }, "nicht angemeldet"],
    [(daten) => { delete daten.zeichen.schichten.testgas; }, "kein Zeichen"],
    [(daten) => { daten.gelaende.testquelle.quelle = { gas: "lachgas", menge: 3 }; }, 'Gas "lachgas"'],
    [(daten) => { daten.gelaende.testquelle.verbrenntZu = "kohle"; }, 'Gelände "kohle"'],
    [(daten) => { daten.ebenen.testebene.gelaendeObjekte = [{ gelaende: "thron", anzahl: 1 }]; }, 'Gelände "thron"'],
    [(daten) => { delete daten.regeln.feuer; }, "regeln.feuer"],
    [(daten) => { daten.effekte.test = { schritte: [{ baustein: "oberflaeche_setzen", art: "lava", menge: 1 }] }; }, 'Oberfläche "lava"'],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
