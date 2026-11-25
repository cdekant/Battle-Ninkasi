// Lernen: freie EP aus Tiefe und Wissen, gebundener Anteil, Beitragsbuch mit aktiven und passiven Anlässen, Verteilung beim Tod,
// Querlernen, Überlauf zu freien EP, Topf je Abstammungslinie, Tötungen durch Beschworene
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, lernendeSpielerin, meldungenMitschneiden, gegenstandTragen } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { nahkampf } from "../src/systeme/kampf.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { epAufteilen } from "../src/systeme/lernen.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";

const KARTE = [
  "#########",
  "#.......#",
  "#.......#",
  "#.......#",
  "#########",
];

const SKILLS = {
  hauen: { text: "s.hauen", set: "hauen", tier: 1, primaer: "koerperlichkeit", sekundaer: "gewandtheit", lernt: [{ anlass: "wirkung", tags: ["nahkampf"] }] },
  pruegeln: {
    text: "s.pruegeln", set: "pruegeln", tier: 1, primaer: "koerperlichkeit", sekundaer: "gewandtheit",
    lernt: [{ anlass: "wirkung", tags: ["nahkampf"] }], verwandt: [{ skill: "flink", anteil: 50 }],
  },
  flink: { text: "s.flink", set: "flink", tier: 1, primaer: "gewandtheit", sekundaer: "sinnlichkeit", lernt: [{ anlass: "ausgewichen" }] },
  hefemeisterin: { text: "s.hefe", set: "hefe", tier: 1, primaer: "braukunde", sekundaer: "klugheit", lernt: [{ anlass: "wirkung", tags: ["beschworen"] }] },
};

const EFFEKTE = {
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 2 }] },
  toedlich: { schritte: [{ baustein: "schaden", menge: 1000 }] },
  teilen: { schritte: [{ baustein: "beschwoeren", wesen: "zelle", abstammung: true }] },
  knospen: { schritte: [{ baustein: "beschwoeren", wesen: "zelle" }] },
};

const WESEN = { zelle: { text: "w.zelle", fraktion: "feinde", werte: { lp: { grundwert: 5 } }, ep: 10 } };
const ZUSTAENDE = { gift: { text: "z.gift", tags: ["gift"] } };
const FAUST = [{ name: "faust", genauigkeit: 100, effekt: "stoss", tags: ["nahkampf"] }];

// die Tests des Beitragsbuchs binden alle EP (anteilGebunden 100), der Anteil hat einen eigenen Test
function aufstellen({ skills = SKILLS, regeln = {} } = {}) {
  const spiel = miniSpiel(KARTE, { skills, effekte: EFFEKTE, wesen: WESEN, zustaende: ZUSTAENDE, regeln: { ...regeln, lernen: { anteilGebunden: 100, ...regeln.lernen } } });
  const ninkasi = lernendeSpielerin(spiel, 1, 2);
  ninkasi.angriffe = FAUST;
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const toeten = (spiel, opfer, quelleId = null) => {
  effektAnwenden(spiel, "toedlich", { quelleId, zielId: opfer.id });
  vorgangAbschliessen(spiel);
};

const epMeldungen = (meldungen) => meldungen.filter((meldung) => meldung.art === "ep_erhalten");

test("Erkunden bringt keine EP: neu gesehene Felder werden erkundet, die freien EP bleiben", () => {
  const { spiel, ninkasi } = aufstellen();
  ninkasi.sicht = { reichweite: 8 };
  spiel.zustand.ebene.erkundet.fill(0);
  sichtfeldAktualisieren(spiel);
  assert.ok(spiel.zustand.sichtbareFelder.length > 0);
  assert.ok(spiel.zustand.sichtbareFelder.every((index) => spiel.zustand.ebene.erkundet[index] === 1));
  assert.equal(ninkasi.freieEp, 300);
});

test("Tiefen-EP: je neu erreichter Tiefe einmal nach der Kurve, übersprungene zählen mit, nicht in der Arena", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ regeln: { lernen: { tiefenEp: [[1, 0], [2, 100], [4, 300]] } } });
  assert.equal(ninkasi.tiefsteTiefe, spiel.zustand.tiefe);
  const betreten = (tiefe) => hakenAusloesen(spiel, "ebene_betreten", { quelleId: ninkasi.id, zielId: ninkasi.id, kettentiefe: 0, tiefe });
  ninkasi.tiefsteTiefe = 1;
  betreten(2);
  assert.equal(ninkasi.freieEp, 400);
  betreten(1);
  betreten(2);
  assert.equal(ninkasi.freieEp, 400, "zurück und wieder hinab bringt nichts");
  betreten(4);
  assert.equal(ninkasi.freieEp, 400 + 200 + 300, "Tiefe 3 und 4");
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "ep_frei").map((meldung) => [meldung.quelle, meldung.ep, meldung.was.tiefe]), [["tiefe", 100, 2], ["tiefe", 200, 3], ["tiefe", 300, 4]]);
  spiel.optionen = { spielart: "arena" };
  betreten(5);
  assert.equal(ninkasi.freieEp, 900, "in der Arena keine freien EP");
});

test("Wissens-EP: das erste Sehen einer Wesenart bringt ihre EP nach wissenWesenart, je Art einmal, nur gesehen", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ regeln: { lernen: { wissenWesenart: 50 } } });
  ninkasi.sicht = { reichweite: 8 };
  wesen(spiel, 4, 2, "feinde", 10, { typ: "zelle", text: "w.zelle", ep: 10 });
  wesen(spiel, 5, 2, "feinde", 10, { typ: "zelle", text: "w.zelle", ep: 10 });
  wesen(spiel, 6, 2, "feinde", 10, { typ: "ohne_ep", text: "w.ohne" });
  sichtfeldAktualisieren(spiel);
  assert.equal(ninkasi.freieEp, 305, "die Hälfte von 10, nur einmal für die Art");
  sichtfeldAktualisieren(spiel);
  assert.equal(ninkasi.freieEp, 305);
  assert.deepEqual(spiel.zustand.wissen.gesehen, ["zelle"]);
  const meldung = meldungen.find((eintrag) => eintrag.art === "ep_frei");
  assert.deepEqual([meldung.quelle, meldung.ep, meldung.was.typ], ["wissen", 5, "zelle"]);
  // außer Sicht (hinter der Reichweite) zählt nichts
  const fern = aufstellen();
  fern.ninkasi.sicht = { reichweite: 1 };
  wesen(fern.spiel, 7, 2, "feinde", 10, { typ: "zelle", text: "w.zelle", ep: 10 });
  sichtfeldAktualisieren(fern.spiel);
  assert.equal(fern.ninkasi.freieEp, 300);
});

test("Gebundener Anteil: nur anteilGebunden Prozent fließen über das Buch, der Rest kommt gleich frei", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ skills: { hauen: SKILLS.hauen }, regeln: { lernen: { anteilGebunden: 50 } } });
  const feind = wesen(spiel, 2, 2, "feinde", 50, { ep: 11 });
  nahkampf(spiel, ninkasi, feind);
  toeten(spiel, feind);
  const [meldung] = epMeldungen(meldungen);
  const gebunden = meldung.skills.reduce((summe, eintrag) => summe + eintrag.ep, 0);
  assert.ok(gebunden > 0 && gebunden <= 5, "höchstens die Hälfte von 11, abgerundet, geht in Skills");
  assert.ok(meldung.frei >= 6, "mindestens der freie Rest");
  assert.equal(gebunden + meldung.frei, 11);
  assert.equal(ninkasi.freieEp, 300 + meldung.frei);
});

test("Beitragsbuch: Treffer, Schaden und Zustand Ninkasis, je Anlass und Tags nur das erste Mal", () => {
  const { spiel, ninkasi } = aufstellen();
  const feind = wesen(spiel, 2, 2, "feinde", 50, { ep: 10 });
  nahkampf(spiel, ninkasi, feind);
  vorgangAbschliessen(spiel);
  const nachDemErsten = structuredClone(feind.beitraege);
  assert.deepEqual(nachDemErsten, [{ anlass: "wirkung", tags: ["nahkampf", "stumpf"] }, { anlass: "wirkung", tags: ["nahkampf"] }]);
  nahkampf(spiel, ninkasi, feind);
  vorgangAbschliessen(spiel);
  assert.deepEqual(feind.beitraege, nachDemErsten, "Gewichtung erste");
  zustandSetzen(spiel, feind, "gift", { quelleId: ninkasi.id });
  assert.deepEqual(feind.beitraege.at(-1), { anlass: "wirkung", tags: ["gift"] });
  assert.equal(ninkasi.beitraege, undefined, "Ninkasi führt kein Buch über sich");
});

test("Passive Anlässe: ausweichen, blocken, Rüstung und erlittener Schaden stehen im Buch der Angreiferin", () => {
  const { spiel, ninkasi } = aufstellen();
  const daneben = wesen(spiel, 2, 2, "feinde", 50, { angriffe: [{ name: "biss", genauigkeit: 0, effekt: "stoss" }] });
  nahkampf(spiel, daneben, ninkasi);
  assert.deepEqual(daneben.beitraege, [{ anlass: "ausgewichen", tags: [] }]);
  const beisser = wesen(spiel, 1, 1, "feinde", 50, { angriffe: [{ name: "biss", genauigkeit: 100, effekt: "stoss", tags: ["biss"] }] });
  ninkasi.kampfwerte = { ruestung: 1 };
  nahkampf(spiel, beisser, ninkasi);
  assert.deepEqual(beisser.beitraege, [{ anlass: "ruestung", tags: ["biss", "stumpf"] }, { anlass: "schaden_erlitten", tags: ["biss", "stumpf"] }]);
  const geblockt = wesen(spiel, 2, 1, "feinde", 50, { angriffe: [{ name: "biss", genauigkeit: 100, effekt: "stoss" }] });
  ninkasi.kampfwerte = { blocken: 1_000_000_000 };
  nahkampf(spiel, geblockt, ninkasi);
  assert.deepEqual(geblockt.beitraege, [{ anlass: "geblockt", tags: [] }]);
});

test("Anlass Rüstung: Tags der angelegten Stücke, die Rüstung geben, stehen im Eintrag", () => {
  const { spiel, ninkasi } = aufstellen();
  const schuerze = gegenstandTragen(spiel, ninkasi, { tags: ["ruestung_leicht"], ausruestung: { platz: "brust", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] } });
  const ring = gegenstandTragen(spiel, ninkasi, { tags: ["kupfer"], ausruestung: { platz: "finger", modifikatoren: [{ ziel: "willenskraft", art: "plus", betrag: 5 }] } });
  ninkasi.ausgeruestet = [schuerze.id, ring.id];
  const beisser = wesen(spiel, 1, 1, "feinde", 50, { angriffe: [{ name: "biss", genauigkeit: 100, effekt: "stoss", tags: ["biss"] }] });
  nahkampf(spiel, beisser, ninkasi);
  assert.deepEqual(beisser.beitraege[0], { anlass: "ruestung", tags: ["biss", "ruestung_leicht", "stumpf"] }, "ohne den Tag des Rings");
});

test("Aufteilung: gleich je Bucheintrag, dann je passendem Skill; Querlernen zusätzlich; Reste und Unpassendes frei", () => {
  const { spiel } = aufstellen();
  const beitraege = [{ anlass: "wirkung", tags: ["nahkampf", "stumpf"] }, { anlass: "ausgewichen", tags: [] }, { anlass: "geblockt", tags: [] }];
  assert.deepEqual(epAufteilen(spiel, beitraege, 20), { zuteilung: { hauen: 3, pruegeln: 3, flink: 7 }, frei: 8 });
});

test("Tod: das Buch entscheidet, auch beim Tod durch eine Falle; ohne Beitrag keine EP", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ skills: { hauen: SKILLS.hauen } });
  const feind = wesen(spiel, 2, 2, "feinde", 50, { ep: 10 });
  nahkampf(spiel, ninkasi, feind);
  vorgangAbschliessen(spiel);
  toeten(spiel, feind);
  assert.deepEqual(ninkasi.skills.hauen, { lernpunkte: 7, rest: 20 }, "10 EP x 30 / 40");
  const meldung = epMeldungen(meldungen)[0];
  assert.deepEqual([meldung.ep, meldung.skills, meldung.frei], [10, [{ skill: "hauen", ep: 10 }], 0]);
  const unberuehrt = wesen(spiel, 3, 2, "feinde", 50, { ep: 10 });
  toeten(spiel, unberuehrt);
  assert.equal(epMeldungen(meldungen).length, 1);
  assert.equal(ninkasi.freieEp, 300);
});

test("Was ein Skill nicht aufnimmt (Stufe 5), wird freie EP", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ skills: { hauen: SKILLS.hauen } });
  ninkasi.skills.hauen = { lernpunkte: 1250, rest: 0 };
  const feind = wesen(spiel, 2, 2, "feinde", 50, { ep: 10, beitraege: [{ anlass: "wirkung", tags: ["nahkampf"] }] });
  toeten(spiel, feind);
  assert.equal(ninkasi.freieEp, 310);
  const meldung = epMeldungen(meldungen)[0];
  assert.deepEqual([meldung.skills, meldung.frei], [[], 10]);
});

test("Topf je Abstammungslinie: Teilungen über drei Generationen bringen zusammen höchstens ep x topfFaktor", () => {
  const { spiel, ninkasi, meldungen } = aufstellen({ skills: { flink: SKILLS.flink } });
  const mutter = wesen(spiel, 5, 2, "feinde", 5, { ep: 10 });
  const zellen = [mutter];
  for (let generation = 0; generation < 3; generation++) {
    const vorher = new Set(Object.keys(spiel.zustand.entitaeten));
    effektAnwenden(spiel, "teilen", { quelleId: zellen.at(-1).id, zielId: zellen.at(-1).id });
    vorgangAbschliessen(spiel);
    zellen.push(Object.values(spiel.zustand.entitaeten).find((entitaet) => !vorher.has(String(entitaet.id))));
  }
  assert.deepEqual(zellen.map((zelle) => zelle.topfId), [mutter.id, mutter.id, mutter.id, mutter.id]);
  assert.equal(spiel.zustand.toepfe[mutter.id], 30);
  for (const zelle of zellen) {
    zelle.beitraege = [{ anlass: "ausgewichen", tags: [] }];
    toeten(spiel, zelle);
  }
  assert.deepEqual(epMeldungen(meldungen).map((meldung) => meldung.ep), [10, 10, 10]);
  assert.equal(spiel.zustand.toepfe[mutter.id], 0);
  assert.ok(ninkasi.skills.flink.lernpunkte > 0);
  const vorher = new Set(Object.keys(spiel.zustand.entitaeten));
  const fremde = wesen(spiel, 5, 3, "feinde", 5, { ep: 10 });
  effektAnwenden(spiel, "knospen", { quelleId: fremde.id, zielId: fremde.id });
  vorgangAbschliessen(spiel);
  const knospe = Object.values(spiel.zustand.entitaeten).find((entitaet) => !vorher.has(String(entitaet.id)) && entitaet.id !== fremde.id);
  assert.deepEqual([fremde.topfId, knospe.topfId], [undefined, undefined], "ohne abstammung kein Topf");
});

test("Beschworene Ninkasis lernen für sie, mit dem Tag beschworen", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  const hefe = wesen(spiel, 2, 2, "ninkasi", 10, { beschworenVon: ninkasi.id, angriffe: [{ name: "biss", genauigkeit: 100, effekt: "stoss" }] });
  const feind = wesen(spiel, 3, 2, "feinde", 50, { ep: 12 });
  nahkampf(spiel, hefe, feind);
  vorgangAbschliessen(spiel);
  assert.deepEqual(feind.beitraege, [{ anlass: "wirkung", tags: ["beschworen", "stumpf"] }, { anlass: "wirkung", tags: ["beschworen"] }]);
  toeten(spiel, feind, hefe.id);
  assert.deepEqual(epMeldungen(meldungen)[0].skills, [{ skill: "hefemeisterin", ep: 12 }]);
});
