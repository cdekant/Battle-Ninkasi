import { test } from "node:test";
import assert from "node:assert/strict";
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, meldungenMitschneiden } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { beziehung, beziehungZwischen, urheberVon, rufBei } from "../src/systeme/fraktionen.js";
import { imKampf } from "../src/systeme/kampfzustand.js";
import { holen } from "../src/kern/register.js";
import { entitaetEntfernen, entitaetErzeugen } from "../src/kern/zustand.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";
import { feindlich } from "../src/systeme/kampf.js";
import { entitaetenAufFeldern } from "../src/systeme/zielauswahl.js";

const RAUM = [
  "##########",
  "#........#",
  "#....#...#",
  "##########",
];

const FRAKTIONEN = {
  ninkasi: { text: "f", beziehungen: { haendler: "neutral", hefen: "verbuendet" } },
  haendler: { text: "f" },
  hefen: { text: "f", beziehungen: { ninkasi: "feind" } },
  verderber: { text: "f" },
};

const EFFEKTE = { stoss: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] } };

function aufstellen() {
  const spiel = miniSpiel(RAUM, { fraktionen: FRAKTIONEN, effekte: EFFEKTE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.angriffe = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];
  ninkasi.sicht = { reichweite: 8 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

test("Beziehungen: gleiche Fraktion verbündet, Vorgabe feind, in beide Richtungen, die strengere gewinnt", () => {
  const { spiel } = aufstellen();
  assert.equal(beziehung(spiel, "ninkasi", "ninkasi"), "verbuendet");
  assert.equal(beziehung(spiel, "ninkasi", "verderber"), "feind", "Vorgabe aus den Regeln");
  assert.equal(beziehung(spiel, "ninkasi", "haendler"), "neutral");
  assert.equal(beziehung(spiel, "haendler", "ninkasi"), "neutral", "gilt auch rückwärts");
  assert.equal(beziehung(spiel, "ninkasi", "hefen"), "feind", "verbuendet gegen feind: feind gewinnt");
  assert.equal(beziehung(spiel, "eigene:3", "haendler"), "feind");
  assert.equal(beziehung(spiel, null, "haendler"), "neutral");
  const freundlich = miniSpiel(RAUM, { fraktionen: FRAKTIONEN, regeln: { fraktionen: { beziehungVorgabe: "neutral" } } });
  assert.equal(beziehung(freundlich, "ninkasi", "verderber"), "neutral");
});

test("Neutrale: kein Angriff durch Hineinlaufen, sondern Platztausch; keine Ziele für feinde oder verbuendete", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const haendlerin = wesen(spiel, 2, 1, "haendler", 10);
  assert.equal(feindlich(spiel, ninkasi, haendlerin), false);
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.deepEqual([ninkasi.position, haendlerin.position, haendlerin.werte.lp.aktuell], [{ x: 2, y: 1 }, { x: 1, y: 1 }, 10], "getauscht, nicht angegriffen");
  assert.ok(meldungen.some((meldung) => meldung.art === "getauscht"));
  befehlGeben(spiel, { art: "bewegen", dx: -1, dy: 0 });
  assert.deepEqual(ninkasi.position, { x: 1, y: 1 }, "und zurück");
  haendlerin.bewegung = "unbeweglich";
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).grund, "besetzt", "ein unbewegliches Wesen tauscht nicht");
  delete haendlerin.bewegung;
  const felder = [{ x: 2, y: 1 }];
  assert.deepEqual(entitaetenAufFeldern(spiel, felder, { trifft: "feinde", urheberId: ninkasi.id }), []);
  assert.deepEqual(entitaetenAufFeldern(spiel, felder, { trifft: "verbuendete", urheberId: ninkasi.id }), []);
  assert.equal(entitaetenAufFeldern(spiel, felder, { trifft: "wesen", urheberId: ninkasi.id }).length, 1);
});

test("Zorn: das angegriffene Wesen und Genossen, die es sehen, werden feindlich; wer nichts sieht, bleibt neutral", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  const haendlerin = wesen(spiel, 2, 1, "haendler", 10);
  const zeugin = wesen(spiel, 4, 1, "haendler", 10, { sicht: { reichweite: 8 } });
  const hinterDerWand = wesen(spiel, 6, 2, "haendler", 10, { sicht: { reichweite: 8 } });
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0, angreifen: true }).ok, true);
  assert.equal(haendlerin.werte.lp.aktuell, 9);
  assert.deepEqual(haendlerin.zornAuf, [ninkasi.id]);
  assert.deepEqual(zeugin.zornAuf, [ninkasi.id]);
  assert.equal(hinterDerWand.zornAuf, undefined);
  assert.equal(feindlich(spiel, ninkasi, haendlerin), true, "Zorn gilt in beide Richtungen");
  assert.equal(beziehungZwischen(spiel, urheberVon(hinterDerWand), ninkasi), "neutral");
  assert.ok(meldungen.some((meldung) => meldung.art === "zorn"));
});

// Ruf und Beistand: haendler sind ausdrücklich mit den Verderbern verfeindet, fremde stehen ohne Angabe (Vorgabe feind)
const FRAKTIONEN_RUF = {
  ninkasi: { text: "f", beziehungen: { haendler: "neutral" } },
  haendler: { text: "f", beziehungen: { verderber: "feind" } },
  verderber: { text: "f" },
  fremde: { text: "f" },
  steine: { text: "f", rufFest: true, beziehungen: { ninkasi: "neutral" } },
};

function aufstellenMitRuf(regeln = {}) {
  const spiel = miniSpiel(RAUM, { fraktionen: FRAKTIONEN_RUF, effekte: EFFEKTE, regeln });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.angriffe = [{ name: "stoss", genauigkeit: 100, effekt: "stoss" }];
  ninkasi.sicht = { reichweite: 8 };
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

const schlafendeKi = () => ({ modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null });

test("Ruf: bei 0 gilt die Tabelle, sonst verschiebt er die Beziehung über die Schwellen", () => {
  const { spiel } = aufstellenMitRuf();
  assert.deepEqual(spiel.zustand.ruf, {});
  assert.equal(beziehung(spiel, "ninkasi", "haendler"), "neutral");
  assert.equal(beziehung(spiel, "ninkasi", "verderber"), "feind");
  spiel.zustand.ruf = { haendler: 50, verderber: 51 };
  assert.equal(beziehung(spiel, "ninkasi", "haendler"), "verbuendet", "0 + 50 erreicht die Schwelle");
  assert.equal(beziehung(spiel, "haendler", "ninkasi"), "verbuendet", "in beide Richtungen");
  assert.equal(beziehung(spiel, "ninkasi", "verderber"), "neutral", "-100 + 51 liegt über der Schwelle feind");
  spiel.zustand.ruf = { haendler: -50, verderber: 150 };
  assert.equal(beziehung(spiel, "ninkasi", "haendler"), "feind");
  assert.equal(beziehung(spiel, "ninkasi", "verderber"), "verbuendet");
  assert.equal(beziehung(spiel, "haendler", "verderber"), "feind", "zwischen fremden Fraktionen zählt der Ruf nicht");
  spiel.zustand.ruf = { steine: -500 };
  assert.equal(beziehung(spiel, "ninkasi", "steine"), "neutral", "rufFest");
});

test("Ruf: der Baustein ruf_aendern verschiebt ihn und meldet es, rufFest bleibt unberührt", () => {
  const { spiel } = aufstellenMitRuf();
  const meldungen = meldungenMitschneiden(spiel);
  const rufAendern = holen("bausteine", "ruf_aendern");
  rufAendern(spiel, {}, { fraktion: "haendler", menge: 30 });
  rufAendern(spiel, {}, { fraktion: "haendler", menge: -5 });
  rufAendern(spiel, {}, { fraktion: "steine", menge: 30 });
  assert.equal(rufBei(spiel, "haendler"), 25);
  assert.equal(rufBei(spiel, "steine"), 0);
  const rufmeldungen = meldungen.filter((meldung) => meldung.art === "ruf").map((meldung) => [meldung.fraktion, meldung.menge, meldung.ruf]);
  assert.deepEqual(rufmeldungen, [["haendler", 30, 30], ["haendler", -5, 25]]);
});

test("Ruf: eine Tötung hebt ihn bei ausdrücklichen Feinden des Opfers und senkt ihn bei dessen Fraktion, nur mit Zeugen", () => {
  const { spiel } = aufstellenMitRuf();
  const regeln = spiel.daten.regeln.fraktionen;
  wesen(spiel, 2, 1, "verderber", 1);
  wesen(spiel, 4, 1, "haendler", 10, { sicht: { reichweite: 8 } });
  wesen(spiel, 6, 2, "verderber", 10, { sicht: { reichweite: 8 } }); // hinter der Wand: kein Zeuge
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.equal(rufBei(spiel, "haendler"), regeln.rufToetungFeind);
  assert.equal(rufBei(spiel, "verderber"), 0, "kein Verderber hat zugesehen");
  assert.equal(rufBei(spiel, "fremde"), 0, "die Vorgabe feind zählt nicht");
});

test("Ruf: ohne Zeugenpflicht zählt jede Tötung; eine Täterin fremder Fraktion ändert nichts", () => {
  const ohneZeugen = aufstellenMitRuf({ fraktionen: { rufNurMitZeugen: false } });
  wesen(ohneZeugen.spiel, 2, 1, "verderber", 1);
  befehlGeben(ohneZeugen.spiel, { art: "bewegen", dx: 1, dy: 0 });
  const regeln = ohneZeugen.spiel.daten.regeln.fraktionen;
  assert.equal(rufBei(ohneZeugen.spiel, "haendler"), regeln.rufToetungFeind);
  assert.equal(rufBei(ohneZeugen.spiel, "verderber"), regeln.rufToetungEigene);

  const verkleidet = aufstellenMitRuf({ fraktionen: { rufNurMitZeugen: false } });
  verkleidet.ninkasi.fraktion = "fremde";
  wesen(verkleidet.spiel, 2, 1, "verderber", 1);
  befehlGeben(verkleidet.spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(verkleidet.spiel.zustand.ruf, {});
});

test("Kampfzustand: Angreiferin und Ziel sind bis zum Ende der Nachwirkung im Kampf, Fallen zählen nicht", () => {
  const { spiel, ninkasi } = aufstellenMitRuf();
  const verderber = wesen(spiel, 2, 1, "verderber", 10);
  assert.equal(imKampf(spiel, ninkasi), false);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(imKampf(spiel, ninkasi), true);
  assert.equal(imKampf(spiel, verderber), true);
  spiel.zustand.zeit = ninkasi.kampfZuletzt + spiel.daten.regeln.kampf.nachwirkung;
  assert.equal(imKampf(spiel, ninkasi), false);
  const falle = entitaetErzeugen(spiel.zustand, { position: { x: 3, y: 1 } });
  const opfer = wesen(spiel, 3, 2, "verderber", 10);
  hakenAusloesen(spiel, "nach_schaden", { quelleId: falle.id, urheberId: falle.id, zielId: opfer.id, menge: 1 });
  assert.equal(imKampf(spiel, opfer), false);
});

test("Beistand: neutrale Zuschauerinnen in Sicht, die mit dem Opfer verfeindet sind, stehen bei und jagen es", () => {
  const { spiel, ninkasi } = aufstellenMitRuf();
  const meldungen = meldungenMitschneiden(spiel);
  const verderber = wesen(spiel, 2, 1, "verderber", 10);
  const helferin = wesen(spiel, 4, 1, "haendler", 10, { sicht: { reichweite: 8 }, ki: schlafendeKi() });
  const hinterDerWand = wesen(spiel, 6, 2, "haendler", 10, { sicht: { reichweite: 8 } });
  const fremde = wesen(spiel, 4, 2, "fremde", 10, { sicht: { reichweite: 8 } });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(helferin.beistandFuer, { [ninkasi.id]: [verderber.id] });
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "verbuendet");
  assert.equal(beziehungZwischen(spiel, urheberVon(helferin), ninkasi), "verbuendet", "in beide Richtungen");
  assert.equal(helferin.ki.wachzustand, "jagt");
  assert.deepEqual(helferin.ki.letzteBekanntePosition, { x: 2, y: 1 });
  assert.equal(hinterDerWand.beistandFuer, undefined);
  assert.equal(fremde.beistandFuer, undefined, "feindliche Zuschauer helfen nicht");
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), hinterDerWand), "neutral");
  assert.equal(meldungen.filter((meldung) => meldung.art === "beistand").length, 1);
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(meldungen.filter((meldung) => meldung.art === "beistand").length, 1, "nur einmal gemeldet");
});

test("Beistand endet, wenn kein Gegner mehr da ist oder beide nicht mehr im Kampf sind", () => {
  const { spiel, ninkasi } = aufstellenMitRuf();
  const verderber = wesen(spiel, 2, 1, "verderber", 10);
  const helferin = wesen(spiel, 4, 1, "haendler", 10, { sicht: { reichweite: 8 } });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  const nachwirkung = spiel.daten.regeln.kampf.nachwirkung;
  spiel.zustand.zeit = Math.max(ninkasi.kampfZuletzt, helferin.kampfZuletzt) + nachwirkung;
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "neutral", "nicht mehr im Kampf");
  spiel.zustand.zeit -= nachwirkung;
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "verbuendet");
  entitaetEntfernen(spiel.zustand, verderber.id);
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "neutral", "Gegner weg");
});

test("Beistand: wer die Helferin angreift, macht sie zornig, der Beistand endet", () => {
  const { spiel, ninkasi } = aufstellenMitRuf();
  wesen(spiel, 1, 2, "verderber", 10);
  const helferin = wesen(spiel, 2, 1, "haendler", 10, { sicht: { reichweite: 8 } });
  befehlGeben(spiel, { art: "bewegen", dx: 0, dy: 1 });
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "verbuendet");
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0, angreifen: true });
  assert.deepEqual(helferin.zornAuf, [ninkasi.id]);
  assert.equal(helferin.beistandFuer, undefined);
  assert.equal(beziehungZwischen(spiel, urheberVon(ninkasi), helferin), "feind");
});
