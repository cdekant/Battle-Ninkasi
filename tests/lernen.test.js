// Lernen: freie EP aus Erkundung, Beitragsbuch mit aktiven und passiven Anlässen, Verteilung beim Tod,
// Querlernen, Überlauf zu freien EP, Topf je Abstammungslinie, Tötungen durch Beschworene
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, lernendeSpielerin, meldungenMitschneiden } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { nahkampf } from "../src/systeme/kampf.js";
import { sichtfeldAktualisieren } from "../src/systeme/sicht.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { epAufteilen } from "../src/systeme/lernen.js";

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

function aufstellen({ skills = SKILLS, regeln } = {}) {
  const spiel = miniSpiel(KARTE, { skills, effekte: EFFEKTE, wesen: WESEN, zustaende: ZUSTAENDE, regeln });
  const ninkasi = lernendeSpielerin(spiel, 1, 2);
  ninkasi.angriffe = FAUST;
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const toeten = (spiel, opfer, quelleId = null) => {
  effektAnwenden(spiel, "toedlich", { quelleId, zielId: opfer.id });
  vorgangAbschliessen(spiel);
};

const epMeldungen = (meldungen) => meldungen.filter((meldung) => meldung.art === "ep_erhalten");

test("Erkundung: jedes zum ersten Mal gesehene Feld bringt epJeFeld freie EP, nur einmal", () => {
  const { spiel, ninkasi } = aufstellen({ regeln: { lernen: { epJeFeld: 2 } } });
  ninkasi.sicht = { reichweite: 8 };
  spiel.zustand.ebene.erkundet.fill(0);
  sichtfeldAktualisieren(spiel);
  const gesehen = spiel.zustand.sichtbareFelder.length;
  assert.ok(gesehen > 0);
  assert.equal(ninkasi.freieEp, 300 + 2 * gesehen);
  sichtfeldAktualisieren(spiel);
  assert.equal(ninkasi.freieEp, 300 + 2 * gesehen);
  const ohneLernen = miniSpiel(KARTE);
  const andere = spielerinSetzen(ohneLernen, 1, 2);
  andere.sicht = { reichweite: 8 };
  ohneLernen.zustand.ebene.erkundet.fill(0);
  sichtfeldAktualisieren(ohneLernen);
  assert.equal(andere.freieEp, undefined, "ohne Lernstand bleibt alles still");
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
