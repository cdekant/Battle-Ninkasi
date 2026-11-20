// Skills: Umrechnung der EP, Stufen und Ränge, Voraussetzungen, Modifikatorquelle, Bedingungen, Befehl lernen,
// Bausteine, Anforderungen an Ausrüstung und Fähigkeiten, Ausbau, Auslöser der Skills, Datenprüfung
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { miniSpiel, wesen, lernendeSpielerin, gegenstandTragen, meldungenMitschneiden, rohdatenMitTesteintraegen } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben, befehlAusfuehren, spielstand, nachspielen } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { modifiziert, modifikatorHinzufuegen, bedingungenErfuellt } from "../src/kern/werte.js";
import { spielerin } from "../src/kern/zustand.js";
import { vorbereiten } from "../src/kern/daten.js";
import { faehigkeitVon, faehigkeitFuer } from "../src/systeme/faehigkeiten.js";
import {
  schwellenVon, stufeVon, skillVon, epAufSkill, epBisHoechststufe, skillGesperrt, voraussetzungenVon,
  eigenschaftGrundwert, eigenschaftWirksam,
} from "../src/systeme/skills.js";

const KARTE = [
  "#######",
  "#.....#",
  "#.....#",
  "#######",
];

const DORNEN = { bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" };

const SKILLS = {
  kraft_grund: {
    text: "s.kraft", set: "kraft", tier: 1, primaer: "koerperlichkeit", sekundaer: "gewandtheit",
    jeStufe: [{ ziel: "lp", art: "prozent", betrag: 5 }], abStufe: { 2: { modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] } },
  },
  kraft_experte: { text: "s.kraft2", set: "kraft", tier: 2, primaer: "koerperlichkeit", sekundaer: "gewandtheit", jeStufe: [{ ziel: "lp", art: "prozent", betrag: 5 }] },
  zaeh: {
    text: "s.zaeh", set: "zaeh", tier: 1, primaer: "trinkfestigkeit", sekundaer: "koerperlichkeit",
    voraussetzungen: [{ skill: "kraft_grund", stufe: 1 }], jeStufe: [{ ziel: "ausweichen", art: "plus", betrag: 4 }],
  },
  geheim: { text: "s.geheim", set: "geheim", tier: 1, primaer: "braukunde", sekundaer: "klugheit", freischaltung: true },
  stachel: { text: "s.stachel", set: "stachel", tier: 1, primaer: "koerperlichkeit", sekundaer: "klugheit", abStufe: { 1: { ausloeser: [DORNEN] } } },
};

const EFFEKTE = {
  stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 2 }] },
  dornen: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] },
  kratzer: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] },
  freischalten: { schritte: [{ baustein: "skill_freischalten", skill: "geheim" }] },
  klueger: { schritte: [{ baustein: "eigenschaft_aendern", eigenschaft: "klugheit", menge: 2 }] },
  verdummen: { schritte: [{ baustein: "eigenschaft_aendern", eigenschaft: "klugheit", menge: -50 }] },
};

const RISIKEN = {
  ohne: [{ name: "ungeschickt", chance: [[0, 0], [1, 100]], wirkt: false }],
  ueber: [{ name: "ueberfordert", chance: [[0, 0], [1, 100]], wirkt: false }],
};

const KUNST = { text: "f.kunst", ziel: { art: "selbst" }, wirkung: "kratzer", skill: { name: "kraft_grund", stufe: 1, risiko: "ohne" }, anforderung: { eigenschaften: { klugheit: 11 }, risiko: "ueber" } };
const SCHLAG = {
  text: "f.schlag", ziel: { art: "selbst" }, wirkung: "kratzer", zeit: 100,
  ausbau: [
    { wenn: [{ bedingung: "skill_ab", skill: "kraft_grund", stufe: 1 }], aendert: { zeit: 80 } },
    { wenn: [{ bedingung: "skill_ab", skill: "kraft_grund", stufe: 2 }], aendert: { zeit: 60, verbrauch: { mp: 0 } } },
  ],
};

function aufstellen({ eigenschaften, regeln } = {}) {
  const spiel = miniSpiel(KARTE, { skills: SKILLS, effekte: EFFEKTE, risiken: RISIKEN, faehigkeiten: { kunst: KUNST, schlag: SCHLAG }, regeln });
  const ninkasi = lernendeSpielerin(spiel, 1, 1, { eigenschaften });
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const stufeSetzen = (ninkasi, name, lernpunkte) => { ninkasi.skills[name] = { lernpunkte, rest: 0 }; };

test("Umrechnung: EP x (2 x primär + sekundär) / Bezugswert, Bruchteile bleiben im Rest", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.equal(epAufSkill(spiel, ninkasi, "kraft_grund", 10), 0);
  assert.deepEqual(ninkasi.skills.kraft_grund, { lernpunkte: 7, rest: 20 }, "300 / 40");
  epAufSkill(spiel, ninkasi, "kraft_grund", 10);
  assert.deepEqual(ninkasi.skills.kraft_grund, { lernpunkte: 15, rest: 0 }, "der Rest wird eingelöst");
  const stark = aufstellen({ eigenschaften: { koerperlichkeit: 20, gewandtheit: 20 } });
  epAufSkill(stark.spiel, stark.ninkasi, "kraft_grund", 10);
  assert.deepEqual(stark.ninkasi.skills.kraft_grund, { lernpunkte: 15, rest: 0 }, "doppelte Eigenschaften, doppeltes Tempo");
});

test("Stufen: Schwellen aufsummiert und mit dem Rang des Tiers vervielfacht", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.deepEqual(schwellenVon(spiel, skillVon(spiel, "kraft_grund")), [50, 150, 350, 700, 1250]);
  assert.deepEqual(schwellenVon(spiel, skillVon(spiel, "kraft_experte")), [100, 300, 700, 1400, 2500]);
  assert.deepEqual(schwellenVon(spiel, { tier: 1, rang: 3 }), [150, 450, 1050, 2100, 3750], "eigener Rang");
  assert.equal(stufeVon(spiel, ninkasi, "kraft_grund"), 0);
  stufeSetzen(ninkasi, "kraft_grund", 149);
  assert.equal(stufeVon(spiel, ninkasi, "kraft_grund"), 1);
  stufeSetzen(ninkasi, "kraft_grund", 150);
  assert.equal(stufeVon(spiel, ninkasi, "kraft_grund"), 2);
});

test("Über Stufe 5 hinaus nimmt ein Skill nichts auf; jede neue Stufe wird gemeldet", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  assert.equal(epBisHoechststufe(spiel, ninkasi, "kraft_grund"), 1667, "1250 x 40 / 30, aufgerundet");
  assert.equal(epAufSkill(spiel, ninkasi, "kraft_grund", 2000), 333);
  assert.deepEqual(ninkasi.skills.kraft_grund, { lernpunkte: 1250, rest: 0 });
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "skillstufe").map((meldung) => meldung.stufe), [1, 2, 3, 4, 5]);
  assert.equal(skillGesperrt(spiel, ninkasi, "kraft_grund"), "hoechststufe");
  assert.equal(epAufSkill(spiel, ninkasi, "kraft_grund", 5), 5);
});

test("Voraussetzungen der Tiers und eigene: gesperrte Skills nehmen nichts auf", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.deepEqual(voraussetzungenVon(spiel, "kraft_experte"), [{ skill: "kraft_grund", stufe: 3 }]);
  assert.equal(skillGesperrt(spiel, ninkasi, "kraft_experte"), "skill_voraussetzung");
  assert.equal(skillGesperrt(spiel, ninkasi, "zaeh"), "skill_voraussetzung");
  assert.equal(epAufSkill(spiel, ninkasi, "zaeh", 10), 10);
  assert.equal(ninkasi.skills.zaeh, undefined);
  stufeSetzen(ninkasi, "kraft_grund", 50);
  assert.equal(skillGesperrt(spiel, ninkasi, "zaeh"), null);
  assert.equal(skillGesperrt(spiel, ninkasi, "kraft_experte"), "skill_voraussetzung");
  stufeSetzen(ninkasi, "kraft_grund", 350);
  assert.equal(skillGesperrt(spiel, ninkasi, "kraft_experte"), null);
  assert.equal(skillGesperrt(spiel, ninkasi, "geheim"), "nicht_freigeschaltet");
  assert.equal(skillGesperrt(spiel, ninkasi, "gibtsnicht"), "unbekannter_skill");
});

test("Quelle skills: plus wächst mit der Stufe, Prozente verschiedener Skills multiplizieren, abStufe gilt ab der Stufe", () => {
  const { spiel, ninkasi } = aufstellen();
  stufeSetzen(ninkasi, "kraft_grund", 50);
  assert.deepEqual([modifiziert(spiel, ninkasi, "lp", 100), modifiziert(spiel, ninkasi, "ruestung", 0)], [105, 0]);
  stufeSetzen(ninkasi, "kraft_grund", 150);
  stufeSetzen(ninkasi, "kraft_experte", 300);
  stufeSetzen(ninkasi, "zaeh", 150);
  assert.deepEqual([modifiziert(spiel, ninkasi, "lp", 100), modifiziert(spiel, ninkasi, "ruestung", 0), modifiziert(spiel, ninkasi, "ausweichen", 0)], [121, 1, 8]);
  const addierend = aufstellen({ regeln: { lernen: { verrechnung: "addieren" } } });
  stufeSetzen(addierend.ninkasi, "kraft_grund", 150);
  stufeSetzen(addierend.ninkasi, "kraft_experte", 300);
  assert.equal(modifiziert(addierend.spiel, addierend.ninkasi, "lp", 100), 120);
});

test("Bedingungen: skill_ab mit der Stufe, eigenschaft_ab und eigenschaft_unter mit dem wirksamen Wert", () => {
  const { spiel, ninkasi } = aufstellen();
  const skillAb = [{ bedingung: "skill_ab", skill: "kraft_grund", stufe: 2 }];
  const eigenschaftAb = [{ bedingung: "eigenschaft_ab", eigenschaft: "koerperlichkeit", wert: 12 }];
  const eigenschaftUnter = [{ bedingung: "eigenschaft_unter", eigenschaft: "koerperlichkeit", wert: 12 }];
  assert.equal(bedingungenErfuellt(spiel, ninkasi, skillAb), false);
  stufeSetzen(ninkasi, "kraft_grund", 150);
  assert.equal(bedingungenErfuellt(spiel, ninkasi, skillAb), true);
  assert.deepEqual([bedingungenErfuellt(spiel, ninkasi, eigenschaftAb), bedingungenErfuellt(spiel, ninkasi, eigenschaftUnter)], [false, true]);
  modifikatorHinzufuegen(ninkasi, { ziel: "eigenschaft.koerperlichkeit", art: "plus", betrag: 2, quelle: "kraftbier" });
  assert.deepEqual([eigenschaftGrundwert(ninkasi, "koerperlichkeit"), eigenschaftWirksam(spiel, ninkasi, "koerperlichkeit")], [10, 12]);
  assert.deepEqual([bedingungenErfuellt(spiel, ninkasi, eigenschaftAb), bedingungenErfuellt(spiel, ninkasi, eigenschaftUnter)], [true, false]);
  delete ninkasi.skills.kraft_grund;
  epAufSkill(spiel, ninkasi, "kraft_grund", 10);
  assert.equal(ninkasi.skills.kraft_grund.lernpunkte, 7, "das Lerntempo bleibt beim Grundwert");
});

test("Befehl lernen: Ablehnungen, keine Spielzeit, mehr EP als nötig bleiben frei", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  const lernen = (skill, ep) => befehlGeben(spiel, { art: "lernen", skill, ep });
  assert.equal(ninkasi.freieEp, 300, "Startguthaben");
  assert.equal(lernen("gibtsnicht", 10).grund, "unbekannter_skill");
  assert.equal(lernen("kraft_grund", 0).grund, "ungueltig");
  assert.equal(lernen("kraft_grund", "viel").grund, "ungueltig");
  assert.equal(lernen("geheim", 10).grund, "nicht_freigeschaltet");
  assert.equal(lernen("kraft_experte", 10).grund, "skill_voraussetzung");
  assert.equal(lernen("kraft_grund", 301).grund, "zu_wenig_ep");
  assert.equal(spiel.befehle.length, 0, "Abgelehntes wird nicht aufgezeichnet");
  const zeit = spiel.zustand.zeit, zuege = ninkasi.zuege, warteschlange = structuredClone(spiel.zustand.warteschlange);
  assert.equal(lernen("kraft_grund", 100).ok, true);
  assert.deepEqual([ninkasi.freieEp, ninkasi.skills.kraft_grund.lernpunkte, stufeVon(spiel, ninkasi, "kraft_grund")], [200, 75, 1]);
  assert.deepEqual([spiel.zustand.zeit, ninkasi.zuege, spiel.zustand.warteschlange], [zeit, zuege, warteschlange], "keine Zeit, kein Zug");
  assert.equal(meldungen.find((meldung) => meldung.art === "gelernt").ep, 100);
  ninkasi.freieEp = 5000;
  assert.equal(lernen("kraft_grund", 5000).ok, true);
  assert.deepEqual([ninkasi.freieEp, stufeVon(spiel, ninkasi, "kraft_grund")], [5000 - 1567, 5], "abgebucht wird nur bis Stufe 5");
  assert.equal(lernen("kraft_grund", 1).grund, "hoechststufe");
  assert.equal(spiel.befehle.length, 2);
});

test("Baustein skill_freischalten macht einen Skill lernbar, einmal gemeldet", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  effektAnwenden(spiel, "freischalten", { quelleId: ninkasi.id, zielId: ninkasi.id });
  effektAnwenden(spiel, "freischalten", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.deepEqual(ninkasi.freigeschaltet, ["geheim"]);
  assert.equal(meldungen.filter((meldung) => meldung.art === "skill_freigeschaltet").length, 1);
  assert.equal(befehlGeben(spiel, { art: "lernen", skill: "geheim", ep: 10 }).ok, true);
});

test("Baustein eigenschaft_aendern: dauerhaft am Grundwert, mindestens 1, nur an Wesen mit Eigenschaften", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  effektAnwenden(spiel, "klueger", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(ninkasi.eigenschaften.klugheit, 12);
  effektAnwenden(spiel, "verdummen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.equal(ninkasi.eigenschaften.klugheit, 1);
  assert.deepEqual(meldungen.filter((meldung) => meldung.art === "eigenschaft_geaendert").map((meldung) => meldung.menge), [2, -11]);
  const bakterium = wesen(spiel, 3, 1);
  effektAnwenden(spiel, "klueger", { quelleId: ninkasi.id, zielId: bakterium.id });
  assert.equal(bakterium.eigenschaften, undefined);
});

test("Anforderung an Ausrüstung: Abzug je fehlendem Punkt mit dem wirksamen Wert, Vorgabe aus den Regeln, höchstens -100 %", () => {
  const { spiel, ninkasi } = aufstellen();
  const keule = gegenstandTragen(spiel, ninkasi, { ausruestung: { platz: "hand", anforderung: { koerperlichkeit: 15 }, abzugJePunkt: [{ ziel: "genauigkeit", art: "prozent", betrag: -3 }] } });
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 100), 100, "im Gepäck gilt nichts");
  ninkasi.ausgeruestet = [keule.id];
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 100), 85);
  modifikatorHinzufuegen(ninkasi, { ziel: "eigenschaft.koerperlichkeit", art: "plus", betrag: 3, quelle: "kraftbier" });
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 100), 94);
  const hut = gegenstandTragen(spiel, ninkasi, { ausruestung: { platz: "kopf", anforderung: { klugheit: 12 } } });
  ninkasi.ausgeruestet = [hut.id];
  assert.deepEqual([modifiziert(spiel, ninkasi, "genauigkeit", 100), modifiziert(spiel, ninkasi, "schaden", 100)], [90, 90], "regeln.lernen.anforderungAbzug");
  hut.ausruestung.anforderung = { klugheit: 40 };
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 100), 0);
});

test("Fähigkeit mit Skill und Anforderung: erst der Skill, dann die Anforderung, der erste Fehlschlag beendet", () => {
  const { spiel, ninkasi, meldungen } = aufstellen();
  ninkasi.faehigkeiten = ["kunst"];
  const wirken = () => befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "kunst" });
  const risiken = () => meldungen.filter((meldung) => meldung.art === "risiko").map((meldung) => `${meldung.wegen}:${meldung.ausgang}`);
  wirken();
  assert.deepEqual([risiken(), ninkasi.werte.lp.aktuell], [["skill:ungeschickt"], 100]);
  stufeSetzen(ninkasi, "kraft_grund", 50);
  wirken();
  assert.deepEqual([risiken(), ninkasi.werte.lp.aktuell], [["skill:ungeschickt", "anforderung:ueberfordert"], 100]);
  modifikatorHinzufuegen(ninkasi, { ziel: "eigenschaft.klugheit", art: "plus", betrag: 1, quelle: "kluges_bier" });
  wirken();
  assert.deepEqual([risiken().length, ninkasi.werte.lp.aktuell], [2, 99], "alles erfüllt: kein Wurf, die Wirkung kommt");
});

test("Ausbau: zutreffende Einträge legen sich in Datenreihenfolge über die Definition", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.equal(faehigkeitFuer(spiel, ninkasi, "schlag").zeit, 100);
  stufeSetzen(ninkasi, "kraft_grund", 50);
  assert.equal(faehigkeitFuer(spiel, ninkasi, "schlag").zeit, 80);
  stufeSetzen(ninkasi, "kraft_grund", 150);
  assert.deepEqual([faehigkeitFuer(spiel, ninkasi, "schlag").zeit, faehigkeitFuer(spiel, ninkasi, "schlag").verbrauch], [60, { mp: 0 }]);
  assert.equal(faehigkeitVon(spiel, "schlag").zeit, 100, "die Daten bleiben unverändert");
  assert.equal(faehigkeitFuer(spiel, null, "schlag").zeit, 100);
});

test("Auslöser aus abStufe gelten ab der Stufe, in der Kaskade nach der Ausrüstung", () => {
  const { spiel, ninkasi } = aufstellen();
  const feind = wesen(spiel, 2, 1, "feinde", 20);
  effektAnwenden(spiel, "stoss", { quelleId: feind.id, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(feind.werte.lp.aktuell, 20);
  stufeSetzen(ninkasi, "stachel", 50);
  effektAnwenden(spiel, "stoss", { quelleId: feind.id, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(feind.werte.lp.aktuell, 19);
});

test("Startoption eigenschaften: geprüft, im Spielstand, Lernen wird gleich nachgespielt", () => {
  const daten = datenLaden(rohdaten, { texte });
  const eigenschaften = { koerperlichkeit: 20, trinkfestigkeit: 10, gewandtheit: 15, sinnlichkeit: 15, klugheit: 10, braukunde: 10 };
  assert.throws(() => neuesSpiel(daten, 5, { eigenschaften: { ...eigenschaften, braukunde: 11 } }), /Eigenschaften ungültig/);
  assert.throws(() => neuesSpiel(daten, 5, { eigenschaften: { ...eigenschaften, koerperlichkeit: 21, gewandtheit: 14 } }), /Eigenschaften ungültig/);
  const spiel = neuesSpiel(daten, 5, { eigenschaften });
  assert.equal(befehlGeben(spiel, { art: "lernen", skill: "nahkampf_grund", ep: 100 }).ok, true);
  befehlGeben(spiel, { art: "warten" });
  assert.equal(befehlGeben(spiel, { art: "lernen", skill: "ausweichen_grund", ep: 50 }).ok, true);
  const nachgespielt = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
  const [vorher, nachher] = [spielerin(spiel.zustand), spielerin(nachgespielt.zustand)];
  assert.deepEqual(nachher.eigenschaften, eigenschaften);
  assert.deepEqual([nachher.skills, nachher.freieEp], [vorher.skills, vorher.freieEp]);
  assert.equal(vorher.skills.nahkampf_grund.lernpunkte, 137, "100 x 55 / 40");
});

test("Datenprüfung: Skills, Kreise, Tiers je Set, Eigenschaften und Anforderungen", () => {
  const fehlerMit = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const enthaelt = (fehler, teil) => assert.ok(fehler.some((meldung) => meldung.includes(teil)), `erwartet: ${teil}\n${fehler.join("\n")}`);
  enthaelt(fehlerMit((daten) => { daten.skills.testskill_grund.voraussetzungen = [{ skill: "testskill_experte", stufe: 1 }]; }), "Kreis");
  enthaelt(fehlerMit((daten) => { daten.skills.testskill_zweiter = { ...daten.skills.testskill_experte, tier: 1 }; }), "hat Tier 1 schon");
  enthaelt(fehlerMit((daten) => { daten.skills.testskill_grund.jeStufe = [{ ziel: "lp", art: "mal", betrag: 110 }]; }), "plus oder prozent");
  enthaelt(fehlerMit((daten) => { daten.skills.testskill_grund.lernt = [{ anlass: "gibtsnicht" }]; }), "Lernanlass");
  enthaelt(fehlerMit((daten) => { daten.skills.testskill_grund.primaer = "schoenheit"; }), "Eigenschaft \"schoenheit\"");
  enthaelt(fehlerMit((daten) => {
    daten.skills.testskill_grund.abStufe = { 2: { modifikatoren: [{ ziel: "eigenschaft.klugheit", art: "plus", betrag: 1, wenn: [{ bedingung: "eigenschaft_ab", eigenschaft: "klugheit", wert: 12 }] }] } };
  }), "keine Bedingung auf Eigenschaften");
  enthaelt(fehlerMit((daten) => { daten.wesen.ninkasi.eigenschaften = { ...daten.wesen.ninkasi.eigenschaften, braukunde: 14 }; }), "die Summe ist 81");
  enthaelt(fehlerMit((daten) => { daten.gegenstaende.testkeule.ausruestung.anforderung = { anmut: 3 }; }), "Eigenschaft \"anmut\"");
  enthaelt(fehlerMit((daten) => { daten.gegenstaende.testkeule.ausruestung.abzugJePunkt = [{ ziel: "eigenschaft.klugheit", art: "plus", betrag: -1 }]; }), "keine Eigenschaft treffen");
  enthaelt(fehlerMit((daten) => { daten.faehigkeiten.testkunst.skill.stufe = 6; }), "stufe muss");
  enthaelt(fehlerMit((daten) => { daten.faehigkeiten.testkunst.ausbau[0].aendert = { art: "aufrecht" }; }), "ausbau und art nicht");
  enthaelt(fehlerMit((daten) => { daten.wesen.essigbakterium.ep = -1; }), "ep");
});
