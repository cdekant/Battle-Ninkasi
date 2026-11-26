// Kulturen gewinnen (src/systeme/kulturen.js) und ihre Formen (src/systeme/sud.js): neben dem Wesen in beide
// Richtungen, nicht auf Abstand, Formen mit Merkmalen, Rest nach dem Tod, Vergehen des Rests, Datenprüfung, Start ohne
// Kultur im Inhalt, dazu Platztausch und Vorsatz "angreifen" (src/systeme/bewegung.js, src/eingabe/eingabe.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, lernendeSpielerin, meldungenMitschneiden, weltLaufenLassen, allesSichtbar } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";
import { entitaetenAuf } from "../src/kern/zustand.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { sterben } from "../src/systeme/tod.js";
import { formSchluessel, formTeile, kulturdatenAufloesen, kulturBezug, gaerungBerechnen } from "../src/systeme/sud.js";
import { kulturformVon } from "../src/systeme/kulturen.js";
import { angriffInRichtung } from "../src/eingabe/eingabe.js";
import { naechsterReiseschritt, reiseBeginnen } from "../src/eingabe/reise.js";
import { platztauschMoeglich } from "../src/systeme/bewegung.js";
import vorgaben from "../src/eingabe/einstellungen.js";

const RAUM = [
  "#######",
  "#.....#",
  "#.....#",
  "#######",
];

const FRAKTIONEN = {
  ninkasi: { text: "f" },
  mikroben: { text: "f", beziehungen: { ninkasi: "neutral" } },
  feinde: { text: "f" },
};
const KULTUREN = { hefe: { text: "k.hefe", vergaerung: 60, vertraegt: 60, aromen: { frucht: 10 } } };
const ZUSTAENDE = {
  stark: { text: "z.stark", adjektiv: "a.stark", kulturmerkmal: [{ art: "plus", feld: "vertraegt", wert: 40 }, { art: "plus", feld: "vergaerung", wert: 50 }] },
  sauer: { text: "z.sauer", adjektiv: "a.sauer", modifikatoren: [{ ziel: "schaden", art: "plus", betrag: 1 }], kulturmerkmal: [{ art: "aroma", achse: "saeure", wert: 25 }] },
  gereizt: { text: "z.gereizt", adjektiv: "a.gereizt" },
};
const GEGENSTAENDE = { schleim: { text: "g.schleim", aufhebbar: true, gewicht: 0, verdirbt: { nach: 1000, wird: null } } };

function spielBauen() {
  const spiel = miniSpiel(RAUM, { fraktionen: FRAKTIONEN, kulturen: KULTUREN, zustaende: ZUSTAENDE, gegenstaende: GEGENSTAENDE, regeln: { brauen: { rest: "schleim" } } });
  const ninkasi = lernendeSpielerin(spiel, 1, 1);
  ninkasi.kulturen = [];
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}
const hefeStellen = (spiel, x, y) => wesen(spiel, x, y, "mikroben", 5, { typ: "hefe", text: "w.hefe", kultur: "hefe" });

test("Formen: Schlüssel mit sortierten Merkmalen, die Änderungen wirken in Reihenfolge, der Bezug trägt die Adjektive", () => {
  const { spiel } = spielBauen();
  assert.equal(formSchluessel("hefe"), "hefe");
  assert.equal(formSchluessel("hefe", ["stark", "sauer", "stark"]), "hefe~sauer~stark");
  assert.deepEqual(formTeile("hefe~sauer~stark"), { kultur: "hefe", merkmale: ["sauer", "stark"] });
  assert.equal(kulturdatenAufloesen(spiel.daten, "hefe"), KULTUREN.hefe, "ohne Merkmale die Kultur selbst");
  assert.equal(kulturdatenAufloesen(spiel.daten, "fremd~stark"), null);
  const form = kulturdatenAufloesen(spiel.daten, "hefe~sauer~stark");
  assert.deepEqual([form.vergaerung, form.vertraegt, form.aromen], [100, 100, { frucht: 10, saeure: 25 }], "vergaerung bleibt höchstens 100");
  assert.deepEqual(KULTUREN.hefe.aromen, { frucht: 10 }, "die Daten bleiben unberührt");
  assert.deepEqual(kulturBezug(spiel.daten, "hefe~sauer~stark"), { name: "hefe~sauer~stark", text: "k.hefe", adjektive: ["a.sauer", "a.stark"] });
  const gaerung = gaerungBerechnen(spiel.daten, { stammwuerze: 120, verfahren: { maische: "warm", gewuerz: "frueh" }, kultur: "hefe~stark" });
  const schwach = gaerungBerechnen(spiel.daten, { stammwuerze: 120, verfahren: { maische: "warm", gewuerz: "frueh" }, kultur: "hefe" });
  assert.ok(gaerung.alkohol > schwach.alkohol, "die Form gärt stärker");
  const hefe = hefeStellen(spiel, 4, 1);
  zustandSetzen(spiel, hefe, "stark", {});
  zustandSetzen(spiel, hefe, "gereizt", {});
  zustandSetzen(spiel, hefe, "sauer", {});
  assert.equal(kulturformVon(spiel, hefe), "hefe~sauer~stark", "nur Zustände mit kulturmerkmal zählen");
  assert.equal(kulturformVon(spiel, wesen(spiel, 5, 2, "feinde")), null);
});

test("Gewinnen neben dem Wesen: nach dem eigenen Zug und nach dem Zug der Quelle, nicht auf Abstand 2, Bekanntes bleibt still", () => {
  const { spiel, ninkasi } = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const vorher = ninkasi.freieEp;
  const hefe = hefeStellen(spiel, 4, 1);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.kulturen, [], "Abstand 2: nichts");
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.kulturen, ["hefe"], "daneben: gewonnen");
  assert.equal(ninkasi.freieEp, vorher + spiel.daten.regeln.lernen.wissenKultur);
  const gewonnen = meldungen.find((meldung) => meldung.art === "kultur_gewonnen");
  assert.deepEqual(gewonnen.kultur, { name: "hefe", text: "k.hefe" });
  befehlGeben(spiel, { art: "warten" });
  assert.equal(meldungen.filter((meldung) => meldung.art.startsWith("kultur_")).length, 1, "schon bekannt: still");

  // die Quelle kommt zu Ninkasi: ihr Zug zählt ebenso
  const starke = hefeStellen(spiel, 4, 2);
  zustandSetzen(spiel, starke, "stark", {});
  hakenAusloesen(spiel, "zug_ende", { quelleId: starke.id, zielId: starke.id, akteurId: starke.id, kettentiefe: 0 });
  assert.deepEqual(ninkasi.kulturen, ["hefe", "hefe~stark"], "eine Form ist eine eigene Kultur");
  assert.equal(ninkasi.freieEp, vorher + 2 * spiel.daten.regeln.lernen.wissenKultur);
  assert.equal(hefe.werte.lp.aktuell, 5, "ohne Angriff");
});

test("Rest nach dem Tod: trägt die Form, gibt sie beim Aufheben und vergeht nach seiner Zeit", () => {
  const { spiel, ninkasi } = spielBauen();
  const meldungen = meldungenMitschneiden(spiel);
  const hefe = hefeStellen(spiel, 5, 2);
  zustandSetzen(spiel, hefe, "sauer", {});
  sterben(spiel, hefe);
  const [rest] = entitaetenAuf(spiel.zustand, 5, 2);
  assert.deepEqual([rest.typ, rest.kultur], ["schleim", "hefe~sauer"]);
  assert.deepEqual(ninkasi.kulturen, [], "auf Abstand nichts");
  // ein zweiter Rest, den niemand aufhebt, vergeht
  const andere = hefeStellen(spiel, 5, 1);
  sterben(spiel, andere);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 1 });
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.deepEqual(ninkasi.position, { x: 5, y: 2 });
  assert.equal(befehlGeben(spiel, { art: "aufheben" }).ok, true);
  assert.ok(ninkasi.kulturen.includes("hefe~sauer"), "aufgehoben: gewonnen");
  assert.ok(!spiel.zustand.entitaeten[rest.id], "der Rest vergeht beim Aufheben");
  weltLaufenLassen(spiel, spiel.zustand.zeit + 2000);
  assert.deepEqual(entitaetenAuf(spiel.zustand, 5, 1), [], "der liegen gebliebene Rest ist vergangen");
  assert.ok(meldungen.some((meldung) => meldung.art === "vergangen" && meldung.traegerin === null));
});

test("Platztausch: neutral tauscht, feindlich wird angegriffen, angreifen: true greift auch Neutrale an; die Reise läuft durch", () => {
  const { spiel, ninkasi } = spielBauen();
  const hefe = hefeStellen(spiel, 2, 1);
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.deepEqual([ninkasi.position, hefe.position], [{ x: 2, y: 1 }, { x: 1, y: 1 }]);
  const reise = reiseBeginnen(spiel, { x: 1, y: 1 }, vorgaben);
  assert.equal(naechsterReiseschritt(spiel, reise.reise, vorgaben).befehl?.art, "bewegen", "eine Neutrale versperrt die Reise nicht");
  const feind = wesen(spiel, 3, 1, "feinde", 5);
  assert.equal(platztauschMoeglich(spiel, ninkasi, feind), false, "mit Feinden kein Tausch");
  assert.equal(platztauschMoeglich(spiel, hefe, ninkasi), false, "nur die gesteuerte Entität tauscht");
  ninkasi.angriffe = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];
  spiel.daten.effekte = { stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] } };
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: -1, dy: 0, angreifen: true }).ok, true);
  assert.deepEqual([ninkasi.position, hefe.werte.lp.aktuell], [{ x: 2, y: 1 }, 4], "ausdrücklich angegriffen, nicht getauscht");
  assert.deepEqual(angriffInRichtung({ aktion: "bewegen_w", befehl: { art: "bewegen", dx: -1, dy: 0 } }), { aktion: "angreifen", befehl: { art: "bewegen", dx: -1, dy: 0, angreifen: true } });
  assert.equal(angriffInRichtung({ aktion: "inventar" }), null, "jede andere Taste bricht ab");
  assert.equal(angriffInRichtung(null), null);
});

test("Platztausch in der offenen Tür: keines der beiden Felder wird leer, die Tür bleibt offen, niemand steht in der Wand", () => {
  const spiel = miniSpiel(["#####", "#.'.#", "#####"], { fraktionen: FRAKTIONEN });
  const ninkasi = lernendeSpielerin(spiel, 2, 1);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  const hefe = wesen(spiel, 3, 1, "mikroben", 5, { tueren: "nicht" });
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.deepEqual([ninkasi.position, hefe.position], [{ x: 3, y: 1 }, { x: 2, y: 1 }]);
  assert.equal(spiel.zustand.ebene.felder[1][2], "'", "die Tür bleibt offen, die Hefe steht darin");
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: -1, dy: 0 }).ok, true, "und zurück");
  assert.equal(spiel.zustand.ebene.felder[1][2], "'");
});

test("Datenprüfung: Merkmale, Kultur der Wesen, Rest, Trenner; Inhalt: Ninkasi beginnt ohne Kultur, die wilde Hefe gibt sie", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "kulturmerkmal"), "der Inhalt ist gültig");
  assert.ok(fehlerMit((roh) => { roh.zustaende.sauer.kulturmerkmal = [{ art: "mal" }]; }, "Änderungsart \"mal\""));
  assert.ok(fehlerMit((roh) => { roh.zustaende.sauer.kulturmerkmal = [{ art: "plus", feld: "farbe", wert: 1 }]; }, "zustaende.sauer.kulturmerkmal.plus: feld"));
  assert.ok(fehlerMit((roh) => { roh.zustaende.sauer.kulturmerkmal = [{ art: "aroma", achse: "alkohol", wert: 1 }]; }, "Aromaachse \"alkohol\""));
  assert.ok(fehlerMit((roh) => { roh.zustaende.sauer.kulturmerkmal = []; }, "zustaende.sauer.kulturmerkmal muss"));
  assert.ok(fehlerMit((roh) => { roh.wesen.wilde_hefe.kultur = "kefir"; }, "wesen.wilde_hefe: Kultur \"kefir\""));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.rest = "fremd"; }, "regeln.brauen.rest"));
  assert.ok(fehlerMit((roh) => { roh.kulturen["hefe~x"] = { ...roh.kulturen.bierhefe }; }, "trennt im Schlüssel"));
  assert.ok(fehlerMit((roh) => { roh.gegenstaende.hefeschleim.verdirbt.wird = "fremd"; }, "gegenstaende.hefeschleim: verdirbt"));
  const { daten } = vorbereiten(structuredClone(rohdaten));
  assert.deepEqual(daten.wesen.ninkasi.kulturen, []);
  assert.equal(daten.wesen.wilde_hefe.kultur, "wilde_hefe");
  assert.ok(daten.zustaende.uebervergaerend.modifikatoren.length > 0, "ein Merkmal verändert auch das Wesen");
});
