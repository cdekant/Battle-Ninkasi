// Veränderliches Gelände, Geschosse durch Gitter, Türen, Benutzen, Fallen und ihre Erzeugung in der Ebene
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { entitaetErzeugen, alleEntitaeten } from "../src/kern/zustand.js";
import { gelaendeName, feldIndex } from "../src/welt/karte.js";
import { flugbahn } from "../src/welt/geometrie.js";
import { weg } from "../src/welt/wege.js";
import { gelaendeSetzen } from "../src/systeme/gelaende.js";
import { entdeckenChance, fallenMeiden } from "../src/systeme/fallen.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { vorbereiten } from "../src/kern/daten.js";
import { rohdatenMitTesteintraegen } from "./hilfen.js";

// "|" Gitter (Geschosse ja, Sicht nein), "o" Glas (Sicht ja, Geschosse nein), "h"/"H" Hebel
const GELAENDE = {
  gitter: { kennung: "|", passierbar: false, durchsichtig: false, geschossdurchlaessig: true },
  glas: { kennung: "o", passierbar: false, durchsichtig: true, geschossdurchlaessig: false },
  bruechig: { kennung: "%", passierbar: false, durchsichtig: false, zerstoerbar: { wird: "boden" } },
  hebel_aus: { kennung: "h", passierbar: false, durchsichtig: true, beimBenutzen: "hebel_umlegen" },
  hebel_an: { kennung: "H", passierbar: false, durchsichtig: true },
  aushang: { kennung: "a", passierbar: false, durchsichtig: true, beimBenutzen: "aushang_lesen" },
};

const EFFEKTE = {
  hebel_umlegen: { schritte: [{ baustein: "gelaende_setzen", gelaende: "hebel_an" }] },
  aushang_lesen: { schritte: [{ baustein: "heilen", menge: 5 }] },
  sprengen: { schritte: [{ baustein: "gelaende_zerstoeren", muster: { art: "kreis", radius: 1 } }] },
  mauern: { schritte: [{ baustein: "gelaende_setzen", gelaende: "wand" }] },
  eingeklemmt: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 4 }] },
  stich: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 3 }] },
};

function spielBauen(karte) {
  const spiel = miniSpiel(karte, { gelaende: GELAENDE, effekte: EFFEKTE });
  return { spiel, meldungen: meldungenMitschneiden(spiel) };
}

// Ninkasi am Zug mit Sichtweite
function ninkasiAmZug(spiel, x, y) {
  const ninkasi = spielerinSetzen(spiel, x, y);
  ninkasi.sicht = { reichweite: 8 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  sichtfeldAktualisieren(spiel);
  return ninkasi;
}

const falleLegen = (spiel, x, y, falle, zusatz = {}) =>
  entitaetErzeugen(spiel.zustand, { typ: "testfalle", text: "f.test", position: { x, y }, falle, ...zusatz });

test("gelaendeSetzen ändert das Feld, meldet es, und eine Wand auf einem Wesen klemmt es ein", () => {
  const { spiel, meldungen } = spielBauen(["#####", "#...#", "#####"]);
  const opfer = wesen(spiel, 2, 1, "feinde", 20);
  effektAnwenden(spiel, "mauern", { quelleId: opfer.id, zielId: null, zielfeld: { x: 2, y: 1 } });
  vorgangAbschliessen(spiel);
  assert.equal(gelaendeName(spiel, 2, 1), "wand");
  assert.deepEqual(meldungen.find((meldung) => meldung.art === "gelaende_geaendert").nachher, "wand");
  assert.equal(opfer.werte.lp.aktuell, 16);
  assert.notDeepEqual(opfer.position, { x: 2, y: 1 });
});

test("gelaende_zerstoeren wirkt nur auf Zerstörbares; Geschosse fliegen durch Gitter, nicht durch Glas", () => {
  const { spiel } = spielBauen(["#######", "#.%|o.#", "#######"]);
  const bahnDurchGitter = flugbahn(spiel, { x: 3, y: 1 }, { x: 5, y: 1 });
  assert.deepEqual(bahnDurchGitter.aufschlag, { x: 3, y: 1 }, "Glas hält auf, das Feld davor ist der Aufschlag");
  const gitterBahn = flugbahn(spiel, { x: 4, y: 1 }, { x: 2, y: 1 });
  assert.deepEqual(gitterBahn.felder, [{ x: 3, y: 1 }], "durchs Gitter, dann hält das Brüchige auf");
  const sprengerin = wesen(spiel, 1, 1, "ninkasi", 20);
  effektAnwenden(spiel, "sprengen", { quelleId: sprengerin.id, zielId: null, ursprung: { x: 2, y: 1 }, zielfeld: { x: 2, y: 1 } });
  vorgangAbschliessen(spiel);
  assert.deepEqual([gelaendeName(spiel, 2, 1), gelaendeName(spiel, 3, 1), gelaendeName(spiel, 2, 0)], ["boden", "gitter", "wand"]);
});

test("Türen: gehen beim Hindurchgehen auf und danach zu, bleiben offen, solange jemand drinsteht, versperren zu die Sicht", () => {
  const { spiel } = spielBauen(["#######", "#..+..#", "#######"]);
  const ninkasi = ninkasiAmZug(spiel, 2, 1);
  const hinter = feldIndex(spiel.zustand.ebene, 4, 1);
  assert.ok(!spiel.zustand.sichtbareFelder.includes(hinter), "zu: dahinter unsichtbar");
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(gelaendeName(spiel, 3, 1), "tuer_offen");
  assert.ok(spiel.zustand.sichtbareFelder.includes(hinter));
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(gelaendeName(spiel, 3, 1), "tuer_zu");
  assert.deepEqual(ninkasi.position, { x: 4, y: 1 });

  gelaendeSetzen(spiel, { x: 3, y: 1 }, "tuer_offen");
  wesen(spiel, 3, 1, "ninkasi", 5);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(gelaendeName(spiel, 3, 1), "tuer_offen", "da steht noch jemand");
});

test("Wer keine Türen öffnet, kommt nicht hindurch und findet keinen Weg; wer sie öffnet, schon", () => {
  const { spiel } = spielBauen(["#######", "#..+..#", "#######"]);
  const bakterium = wesen(spiel, 2, 1, "verderber", 10, { tueren: "nicht" });
  assert.equal(holen("befehle", "bewegen").pruefen(spiel, bakterium, { art: "bewegen", dx: 1, dy: 0 }), "wand");
  assert.equal(weg(spiel, { x: 2, y: 1 }, { x: 5, y: 1 }, { oeffnetTueren: false }), null);
  assert.equal(weg(spiel, { x: 2, y: 1 }, { x: 5, y: 1 }).length, 3);
});

test("Benutzen: ein Hebel nebenan legt sich um; ohne Hebel wird abgelehnt", () => {
  const { spiel, meldungen } = spielBauen(["#####", "#.h.#", "#####"]);
  ninkasiAmZug(spiel, 1, 1);
  assert.equal(befehlGeben(spiel, { art: "benutzen", dx: 0, dy: 1 }).grund, "nichts_zu_benutzen");
  assert.equal(befehlGeben(spiel, { art: "benutzen", dx: 1, dy: 0 }).ok, true);
  assert.equal(gelaendeName(spiel, 2, 1), "hebel_an");
  assert.ok(meldungen.some((meldung) => meldung.art === "benutzt"));
});

test("Benutzen: der Effekt trifft auch die Benutzerin, z.B. ein Aushang, der lehrt", () => {
  const { spiel } = spielBauen(["#####", "#.a.#", "#####"]);
  const ninkasi = ninkasiAmZug(spiel, 1, 1);
  ninkasi.werte.lp.aktuell = 50;
  assert.equal(befehlGeben(spiel, { art: "benutzen", dx: 1, dy: 0 }).ok, true);
  assert.equal(ninkasi.werte.lp.aktuell, 55);
  assert.equal(gelaendeName(spiel, 2, 1), "aushang", "das Feld bleibt, wie es ist");
});

test("Fallen lösen beim Betreten aus und gelten dann als entdeckt; Fliegende gehen darüber; kein Zorn auf Fallen", () => {
  const { spiel, meldungen } = spielBauen(["######", "#....#", "######"]);
  const falle = falleLegen(spiel, 2, 1, { tarnung: 50, effekt: "stich" });
  const opfer = wesen(spiel, 1, 1, "verderber", 10, { ki: { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null } });
  holen("befehle", "bewegen").ausfuehren(spiel, opfer, { art: "bewegen", dx: 1, dy: 0 });
  vorgangAbschliessen(spiel);
  assert.equal(opfer.werte.lp.aktuell, 7);
  assert.equal(falle.entdeckt, true);
  assert.ok(meldungen.some((meldung) => meldung.art === "falle_ausgeloest"));
  assert.ok(!meldungen.some((meldung) => meldung.art === "zorn") && !opfer.zornAuf, "kein Zorn auf eine Falle");
  assert.equal(opfer.ki.wachzustand, "schlaeft", "eine Falle weckt nicht wie ein Angriff");

  const fliegerin = wesen(spiel, 4, 1, "verderber", 10, { bewegung: "fliegend" });
  falleLegen(spiel, 3, 1, { tarnung: 50, effekt: "stich" });
  holen("befehle", "bewegen").ausfuehren(spiel, fliegerin, { art: "bewegen", dx: -1, dy: 0 });
  vorgangAbschliessen(spiel);
  assert.equal(fliegerin.werte.lp.aktuell, 10);
});

test("Entdecken: Chance nach Tarnung und Abstand, nur in Sicht und Reichweite, am Ende von Ninkasis Zug", () => {
  assert.deepEqual(entdeckenChance(30, 30, 1), { zaehler: 60, nenner: 120 }, "daneben 50 %");
  assert.deepEqual(entdeckenChance(30, 30, 3), { zaehler: 60, nenner: 180 }, "auf 3 Felder ein Drittel");

  const { spiel, meldungen } = spielBauen(["##########", "#........#", "##########"]);
  const ninkasi = ninkasiAmZug(spiel, 1, 1);
  const offensichtlich = falleLegen(spiel, 3, 1, { tarnung: 0, effekt: "stich" });
  const meisterhaft = falleLegen(spiel, 4, 1, { tarnung: 1000000, effekt: "stich" });
  const zuWeit = falleLegen(spiel, 8, 1, { tarnung: 0, effekt: "stich" });
  befehlGeben(spiel, { art: "warten" });
  assert.equal(offensichtlich.entdeckt, true);
  assert.ok(!meisterhaft.entdeckt);
  assert.ok(!zuWeit.entdeckt, "jenseits der Reichweite von 5");
  assert.equal(meldungen.filter((meldung) => meldung.art === "falle_entdeckt").length, 1);
  ninkasi.kampfwerte = { entdecken: 0 };
  const nichtGesehen = falleLegen(spiel, 2, 1, { tarnung: 0, effekt: "stich" });
  befehlGeben(spiel, { art: "warten" });
  assert.ok(!nichtGesehen.entdeckt, "ohne Entdecken nichts");
});

test("Wege: die KI meidet alle Fallen, Reise und Erkunden nur die entdeckten", () => {
  const { spiel } = spielBauen(["#####", "#...#", "#...#", "#####"]);
  const falle = falleLegen(spiel, 2, 1, { tarnung: 50, effekt: "stich" });
  assert.deepEqual(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { meiden: fallenMeiden(spiel) })[0], { x: 2, y: 2 });
  assert.equal(fallenMeiden(spiel, { nurBekannte: true }), null);
  falle.entdeckt = true;
  assert.deepEqual(weg(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }, { meiden: fallenMeiden(spiel, { nurBekannte: true }) })[0], { x: 2, y: 2 });
});

test("Die Ebene bekommt Türen an Raumzugängen und Fallen, wiederholbar je Startwert", () => {
  const daten = datenLaden(rohdaten, { texte });
  const zaehlen = (startwert) => {
    const spiel = neuesSpiel(daten, startwert);
    return { tueren: (spiel.zustand.ebene.felder.join("").match(/\+/g) || []).length, fallen: alleEntitaeten(spiel.zustand).filter((entitaet) => entitaet.falle).length, felder: spiel.zustand.ebene.felder.join("\n") };
  };
  const erste = zaehlen(9), zweite = zaehlen(9);
  assert.ok(erste.tueren > 0);
  assert.equal(erste.fallen, rohdaten.ebenen.keller.fallen.reduce((summe, eintrag) => summe + eintrag.anzahl, 0), "so viele, wie die Ebene bestellt");
  assert.equal(erste.felder, zweite.felder);
});

test("Datenprüfung: Türen, Zerstörbares, Hebel, Gitter, Fallen, tueren am Wesen, Regeln der Fallen", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.gelaende.testtuer.tuer = { offen: "gibt_es_nicht" }; }, 'Gelände "gibt_es_nicht"'],
    [(daten) => { daten.gelaende.testtuer.tuer = { auf: "boden" }; }, "tuer muss"],
    [(daten) => { daten.gelaende.testgelaende.zerstoerbar = { wird: "lava" }; }, 'Gelände "lava"'],
    [(daten) => { daten.gelaende.testgelaende.beimBenutzen = "gibt_es_nicht"; }, 'Effekt "gibt_es_nicht"'],
    [(daten) => { daten.gelaende.testgelaende.geschossdurchlaessig = "ja"; }, "geschossdurchlaessig"],
    [(daten) => { daten.fallen.testfalle.falle.tarnung = -1; }, "tarnung"],
    [(daten) => { daten.fallen.testfalle.falle.ausloesenFuer = ["kriechend"]; }, "ausloesenFuer"],
    [(daten) => { delete daten.zeichen.fallen.testfalle; }, "kein Zeichen"],
    [(daten) => { daten.ebenen.testebene.fallen = [{ typ: "gibt_es_nicht", anzahl: 1 }]; }, 'Falle "gibt_es_nicht"'],
    [(daten) => { daten.ebenen.testebene.tuerChance = 150; }, "tuerChance"],
    [(daten) => { daten.wesen.ninkasi.tueren = "eintreten"; }, "tueren"],
    [(daten) => { delete daten.regeln.fallen; }, "regeln.fallen"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
