// Bewegungsarten, Versetzen mit Haken, Stoßen, Ziehen, Tauschen, Teleportieren, Lage und Werfen
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar, hakenFuerTest, gegenstandTragen, weltLaufenLassen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { bewegungVon, positionSetzen } from "../src/kern/zustand.js";
import { weg } from "../src/welt/wege.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";

// "_" Abgrund (nur fliegend), "~" Wasser (fliegend, schwebend), "X" undurchdringlicher Fels
const GELAENDE = {
  abgrund: { kennung: "_", passierbarFuer: ["fliegend"], durchsichtig: true, beimFestsitzen: "sturz" },
  wasser: { kennung: "~", passierbarFuer: ["fliegend", "schwebend"], durchsichtig: true },
  fels: { kennung: "X", passierbar: false, durchsichtig: false, undurchdringlich: true },
};

const RAUM = [
  "##########",
  "#........#",
  "#........#",
  "#........#",
  "##########",
];

const EFFEKTE = {
  schubs: { schritte: [{ baustein: "stossen", weite: 3, menge: 2 }] },
  heranziehen: { schritte: [{ baustein: "ziehen", weite: 5 }] },
  platztausch: { schritte: [{ baustein: "tauschen" }] },
  blinzeln: { schritte: [{ baustein: "teleportieren", wer: "quelle" }] },
  wegzaubern: { schritte: [{ baustein: "teleportieren" }] },
  irgendwohin: { schritte: [{ baustein: "teleportieren", zufaellig: true }] },
  eingeklemmt: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 4 }] },
  sturz: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 7 }] },
  splitter: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 5 }] },
};

const ZUSTAENDE = {
  levitation: { text: "z.levitation", dauer: 300, bewegung: "fliegend" },
  phasen: { text: "z.phasen", dauer: 300, bewegung: "phasend" },
};

function spielBauen(karte = RAUM) {
  const spiel = miniSpiel(karte, { gelaende: GELAENDE, effekte: EFFEKTE, zustaende: ZUSTAENDE });
  return { spiel, meldungen: meldungenMitschneiden(spiel) };
}

const wirken = (spiel, effekt, quelle, ziel, zusatz = {}) => {
  effektAnwenden(spiel, effekt, { quelleId: quelle.id, zielId: ziel?.id ?? null, ...zusatz });
  vorgangAbschliessen(spiel);
};

const bewegenPruefen = (spiel, akteur, dx, dy) => holen("befehle", "bewegen").pruefen(spiel, akteur, { art: "bewegen", dx, dy });

test("Bewegungsarten: Gelände mit passierbarFuer, phasend durch Wände, nicht durch Undurchdringliches", () => {
  const { spiel } = spielBauen(["#######", "#._~#X#", "#######"]);
  const laeuferin = wesen(spiel, 1, 1);
  assert.equal(bewegenPruefen(spiel, laeuferin, 1, 0), "wand", "laufend nicht in den Abgrund");
  laeuferin.bewegung = "fliegend";
  assert.equal(bewegenPruefen(spiel, laeuferin, 1, 0), null);
  const schwebende = wesen(spiel, 2, 1, "feinde", 10, { bewegung: "schwebend" });
  assert.equal(bewegenPruefen(spiel, schwebende, 1, 0), null, "schwebend über Wasser");
  positionSetzen(spiel.zustand, schwebende, { x: 3, y: 1 });
  assert.equal(bewegenPruefen(spiel, schwebende, -1, 0), "wand", "schwebend nicht über den Abgrund");
  schwebende.bewegung = "phasend";
  assert.equal(bewegenPruefen(spiel, schwebende, 1, 0), null, "phasend in die Wand");
  positionSetzen(spiel.zustand, schwebende, { x: 4, y: 1 });
  assert.equal(bewegenPruefen(spiel, schwebende, 1, 0), "wand", "undurchdringlicher Fels");
});

test("Ein Zustand überlagert die Bewegungsart; die Wegfindung folgt ihr", () => {
  const { spiel } = spielBauen(["#####", "#._.#", "#####"]);
  const fliegerin = wesen(spiel, 1, 1);
  assert.equal(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), null);
  zustandSetzen(spiel, fliegerin, "levitation");
  assert.equal(bewegungVon(fliegerin), "fliegend");
  assert.deepEqual(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { bewegung: bewegungVon(fliegerin) }), [{ x: 2, y: 1 }, { x: 3, y: 1 }]);
});

test("Unbeweglich: kein Schritt, aber Angriff; die KI greift nur an, was daneben steht; Stoßen wirkt nicht", () => {
  const { spiel } = spielBauen();
  const angriffe = [{ name: "stich", genauigkeit: 100, effekt: "splitter" }];
  const totem = wesen(spiel, 3, 2, "verderber", 10, { bewegung: "unbeweglich", angriffe, ki: { modul: "jagen", letzteBekanntePosition: null }, sicht: { reichweite: 8 } });
  const ninkasi = spielerinSetzen(spiel, 6, 2);
  assert.equal(bewegenPruefen(spiel, totem, 1, 0), "unbeweglich");
  const jagen = holen("ki", "jagen");
  assert.deepEqual(jagen(spiel, totem, totem.ki), { art: "warten" });
  positionSetzen(spiel.zustand, ninkasi, { x: 4, y: 2 });
  assert.deepEqual(jagen(spiel, totem, totem.ki), { art: "bewegen", dx: 1, dy: 0, angreifen: true });
  assert.equal(bewegenPruefen(spiel, totem, 1, 0), null, "Angriff durch Hineinlaufen");
  wirken(spiel, "schubs", ninkasi, totem);
  assert.deepEqual(totem.position, { x: 3, y: 2 });
});

test("Versetzen löst verlaesst_feld und betritt_feld mit Feld und Art aus", (t) => {
  const { spiel } = spielBauen();
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  const gesehen = [];
  hakenFuerTest(t, "verlaesst_feld", (spiel, kontext) => gesehen.push(["verlaesst", kontext.position.x, kontext.art]));
  hakenFuerTest(t, "betritt_feld", (spiel, kontext) => gesehen.push(["betritt", kontext.position.x, kontext.art]));
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(gesehen, [["verlaesst", 1, "schritt"], ["betritt", 2, "schritt"]]);
});

test("Stoßen: frei bis zur Weite, Aufprall an der Wand je verbliebenem Feld, an einem Wesen für beide", () => {
  const frei = spielBauen();
  const schubserin = wesen(frei.spiel, 1, 2, "ninkasi", 50);
  const opfer = wesen(frei.spiel, 2, 2, "feinde", 20);
  wirken(frei.spiel, "schubs", schubserin, opfer);
  assert.deepEqual(opfer.position, { x: 5, y: 2 });
  assert.equal(opfer.werte.lp.aktuell, 20);

  const wand = spielBauen();
  const stosserin = wesen(wand.spiel, 6, 2, "ninkasi", 50);
  const vorDerWand = wesen(wand.spiel, 7, 2, "feinde", 20);
  wirken(wand.spiel, "schubs", stosserin, vorDerWand);
  assert.deepEqual(vorDerWand.position, { x: 8, y: 2 });
  assert.equal(vorDerWand.werte.lp.aktuell, 16, "zwei Felder blieben übrig, je 2 Schaden");
  assert.equal(wand.meldungen.find((meldung) => meldung.art === "gestossen").aufprall, "fest");

  const zwei = spielBauen();
  const schlaegerin = wesen(zwei.spiel, 1, 2, "ninkasi", 50);
  const erstes = wesen(zwei.spiel, 2, 2, "feinde", 20);
  const zweites = wesen(zwei.spiel, 4, 2, "feinde", 20);
  wirken(zwei.spiel, "schubs", schlaegerin, erstes);
  assert.deepEqual([erstes.position, erstes.werte.lp.aktuell, zweites.werte.lp.aktuell], [{ x: 3, y: 2 }, 16, 16]);
});

test("Stoßen in den Abgrund: kein Aufprall, die Lageprüfung lässt stürzen und drückt heraus", () => {
  const { spiel, meldungen } = spielBauen(["#######", "#..__.#", "#######"]);
  const schubserin = wesen(spiel, 1, 1, "ninkasi", 50);
  const opfer = wesen(spiel, 2, 1, "feinde", 20);
  wirken(spiel, "schubs", schubserin, opfer);
  assert.equal(opfer.werte.lp.aktuell, 13, "Sturz aus beimFestsitzen des Abgrunds, kein Aufprall");
  assert.ok(meldungen.some((meldung) => meldung.art === "festgesessen"));
  assert.deepEqual(opfer.position, { x: 2, y: 1 }, "aufs nächste freie Feld gedrückt");
  const gestossen = meldungen.find((meldung) => meldung.art === "gestossen");
  assert.deepEqual([gestossen.felder, gestossen.aufprall], [1, null], "endet im ersten Feld, das es nicht betreten kann");
});

test("Phasen endet in der Wand: eingeklemmt nach den Regeln, dann ins Freie", () => {
  const { spiel, meldungen } = spielBauen(["#####", "#.#.#", "#####"]);
  const geist = wesen(spiel, 2, 1, "feinde", 20);
  zustandSetzen(spiel, geist, "phasen");
  vorgangAbschliessen(spiel);
  assert.equal(geist.werte.lp.aktuell, 20, "phasend in der Wand ist nichts");
  weltLaufenLassen(spiel, 400);
  assert.equal(geist.werte.lp.aktuell, 16);
  assert.deepEqual(geist.position, { x: 1, y: 1 });
  assert.ok(meldungen.some((meldung) => meldung.art === "herausgedrueckt"));
});

test("Ziehen holt bis neben den Ursprung, Tauschen wechselt die Plätze", () => {
  const { spiel } = spielBauen();
  const anglerin = wesen(spiel, 1, 2, "ninkasi", 50);
  const fisch = wesen(spiel, 7, 2, "feinde", 20);
  wirken(spiel, "heranziehen", anglerin, fisch);
  assert.deepEqual(fisch.position, { x: 2, y: 2 });
  const fern = wesen(spiel, 5, 1, "feinde", 20);
  wirken(spiel, "platztausch", anglerin, fern);
  assert.deepEqual([anglerin.position, fern.position], [{ x: 5, y: 1 }, { x: 1, y: 2 }]);
});

test("Teleportieren: aufs Zielfeld, besetzt aufs nächste freie, zufällig auf ein freies Feld", () => {
  const { spiel } = spielBauen();
  const springerin = wesen(spiel, 1, 1, "ninkasi", 50);
  wirken(spiel, "blinzeln", springerin, null, { zielfeld: { x: 5, y: 2 } });
  assert.deepEqual(springerin.position, { x: 5, y: 2 });
  const imWeg = wesen(spiel, 7, 3, "feinde", 20);
  const opfer = wesen(spiel, 1, 3, "feinde", 20);
  wirken(spiel, "wegzaubern", springerin, opfer, { zielfeld: { x: 7, y: 3 } });
  assert.notDeepEqual(opfer.position, imWeg.position);
  assert.equal(Math.max(Math.abs(opfer.position.x - 7), Math.abs(opfer.position.y - 3)), 1, "daneben");
  wirken(spiel, "irgendwohin", springerin, opfer);
  const { x, y } = opfer.position;
  assert.equal(spiel.zustand.ebene.felder[y][x], ".");
});

test("unterbrechbar mit versetzt: ein Stoß bricht die lange Aktion ab, eigenes Versetzen nicht", () => {
  const { spiel, meldungen } = spielBauen();
  spiel.daten.faehigkeiten = { gebet: { text: "f.gebet", zeit: 100, dauer: { schritte: 3 }, unterbrechbar: ["versetzt"], ziel: { art: "selbst" }, wirkung: "splitter" } };
  const schubserin = wesen(spiel, 1, 2, "ninkasi", 50);
  const betende = wesen(spiel, 2, 2, "feinde", 20, { faehigkeiten: ["gebet"] });
  holen("befehle", "faehigkeit").ausfuehren(spiel, betende, { art: "faehigkeit", faehigkeit: "gebet" });
  assert.deepEqual(betende.laufendeAktion.unterbrechbar, ["versetzt"]);
  wirken(spiel, "blinzeln", betende, null, { zielfeld: { x: 3, y: 2 } });
  assert.ok(betende.laufendeAktion, "eigener Teleport");
  wirken(spiel, "schubs", schubserin, betende);
  assert.equal(betende.laufendeAktion, undefined);
  assert.equal(meldungen.find((meldung) => meldung.art === "aktion_abgebrochen").grund, "versetzt");
});

// Ninkasi am Zug, sieht alles, mit einem Gegenstand im Gepäck
function werferin(spiel, gegenstand = {}) {
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  const getragen = gegenstandTragen(spiel, ninkasi, { typ: "stein", text: "g.stein", ...gegenstand });
  return { ninkasi, getragen };
}

test("Werfen ohne wurf: der Gegenstand landet, am Aufschlag entsteht Lärm, der Wache anlockt", () => {
  const { spiel, meldungen } = spielBauen();
  const { ninkasi, getragen } = werferin(spiel);
  const wache = wesen(spiel, 8, 1, "verderber", 10, { ki: { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null } });
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: getragen.id, ziel: { x: 6, y: 2 } }).ok, true);
  assert.deepEqual(getragen.position, { x: 6, y: 2 });
  assert.equal(getragen.getragenVon, undefined);
  assert.deepEqual(ninkasi.inventar, []);
  assert.equal(meldungen.find((meldung) => meldung.art === "laerm").lautstaerke, spiel.daten.regeln.wahrnehmung.laermWurf);
  assert.deepEqual([wache.ki.wachzustand, wache.ki.letzteBekanntePosition], ["wach", { x: 6, y: 2 }]);
});

test("Werfen mit wurf.effekt: zerbricht am ersten Wesen und wirkt auf es; Gründe der Ablehnung", () => {
  const { spiel, meldungen } = spielBauen();
  spiel.daten.regeln.werfen = { ...spiel.daten.regeln.werfen, streuung: { chance: 0, weite: 2 } }; // ohne Streuung (tests/fernkampf.test.js)
  const { getragen } = werferin(spiel, { wurf: { effekt: "splitter", reichweite: 4 } });
  const getroffen = wesen(spiel, 4, 2, "feinde", 20);
  const geben = (befehl) => befehlGeben(spiel, { art: "werfen", gegenstandId: getragen.id, ...befehl });
  assert.equal(geben({ ziel: { x: 8, y: 2 } }).grund, "zu_weit");
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: 999, ziel: { x: 3, y: 2 } }).grund, "nichts_zu_werfen");
  assert.equal(geben({ ziel: { id: getroffen.id } }).ok, true);
  assert.equal(getroffen.werte.lp.aktuell, 15);
  assert.equal(spiel.zustand.entitaeten[getragen.id], undefined);
  assert.ok(meldungen.some((meldung) => meldung.art === "zerbrochen"));
});

test("Wurfwaffe (wurf.genauigkeit): ein Treffer wirkt, danach landet sie unter dem Ziel oder zerbricht; ein Fehlwurf landet, vom Stapel nur eine", () => {
  const { spiel, meldungen } = spielBauen();
  const { ninkasi, getragen } = werferin(spiel, { stapelbar: true, anzahl: 3, wurf: { effekt: "splitter", genauigkeit: 100000, reichweite: 4, bruchchance: 0 } });
  const getroffen = wesen(spiel, 4, 2, "feinde", 40);
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: getragen.id, ziel: { id: getroffen.id } }).ok, true);
  assert.ok(getroffen.werte.lp.aktuell < 40, "getroffen");
  const gelandetNachTreffer = meldungen.find((meldung) => meldung.art === "gelandet");
  assert.deepEqual(spiel.zustand.entitaeten[gelandetNachTreffer.was.id].position, { x: 4, y: 2 }, "unter dem Ziel");
  assert.ok(!meldungen.some((meldung) => meldung.art === "zerbrochen"));
  assert.equal(spiel.zustand.entitaeten[getragen.id].anzahl, 2, "zwei bleiben im Gepäck");
  assert.ok(ninkasi.inventar.includes(getragen.id));

  // bruchchance 100: nach dem Wurf ist sie verbraucht, ohne Meldung zerbrochen
  spiel.zustand.entitaeten[getragen.id].wurf = { effekt: "splitter", genauigkeit: 100000, reichweite: 4, bruchchance: 100 };
  meldungen.length = 0;
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: getragen.id, ziel: { id: getroffen.id } }).ok, true);
  assert.ok(!meldungen.some((meldung) => meldung.art === "gelandet"), "zerbrochen statt gelandet");
  assert.equal(spiel.zustand.entitaeten[getragen.id].anzahl, 1);

  // genauigkeit 0 verfehlt sicher: die Wurfwaffe landet beim Ziel und lässt sich aufheben
  spiel.zustand.entitaeten[getragen.id].wurf = { effekt: "splitter", genauigkeit: 0, reichweite: 4, bruchchance: 0 };
  const vorher = getroffen.werte.lp.aktuell;
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: getragen.id, ziel: { id: getroffen.id } }).ok, true);
  assert.equal(getroffen.werte.lp.aktuell, vorher, "verfehlt");
  assert.ok(meldungen.some((meldung) => meldung.art === "verfehlt"));
  const gelandet = meldungen.find((meldung) => meldung.art === "gelandet");
  assert.deepEqual(spiel.zustand.entitaeten[gelandet.was.id].position, { x: 4, y: 2 });
});
