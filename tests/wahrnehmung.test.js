import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Systeme, Bedingungen und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, meldungenMitschneiden } from "./hilfen.js";
import { holen } from "../src/kern/register.js";
import { modifikatorHinzufuegen } from "../src/kern/werte.js";
import { nahkampf } from "../src/systeme/kampf.js";
import { heimlichkeitsweite, wahrnehmen, istAhnungslos, laermFelder, laermMachen } from "../src/systeme/wahrnehmung.js";
import { feldIndex } from "../src/welt/karte.js";

const RAUM = [
  "#############",
  "#.....#.....#",
  "#.....#.....#",
  "#############",
];

const EFFEKTE = { hieb: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 4 }] } };

function aufstellen(regeln = {}) {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, regeln: { wahrnehmung: regeln } });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.angriffe = [{ name: "hieb", genauigkeit: 0, effekt: "hieb" }];
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

const schlaefer = (spiel, x, y, zusatz = {}) =>
  wesen(spiel, x, y, "verderber", 20, { ki: { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null }, sicht: { reichweite: 8 }, ...zusatz });

test("Heimlichkeitsweite: Vorgabe 7, Kämpfen verdoppelt, Warten halbiert, Modifikatoren, Untergrenze", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 7);
  ninkasi.letzteAktion = "nahkampf";
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 14);
  ninkasi.letzteAktion = "warten";
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 4, "3,5 gerundet");
  modifikatorHinzufuegen(ninkasi, { ziel: "heimlichkeit", art: "plus", betrag: -6, quelle: "skill" });
  assert.equal(heimlichkeitsweite(spiel, ninkasi), 2, "Untergrenze");
});

test("Bemerken: nur innerhalb der Weite und mit der Chance", () => {
  const sicher = aufstellen({ bemerkenChance: 100 });
  const nah = schlaefer(sicher.spiel, 5, 1);
  wahrnehmen(sicher.spiel, nah);
  assert.equal(nah.ki.wachzustand, "jagt");
  sicher.ninkasi.letzteAktion = "warten";
  const fern = schlaefer(sicher.spiel, 5, 2);
  fern.position = { x: 6, y: 1 };
  wahrnehmen(sicher.spiel, fern);
  assert.equal(fern.ki.wachzustand, "schlaeft", "Abstand 5 jenseits der halbierten Weite 4");
  const nie = aufstellen({ bemerkenChance: 0 });
  const tief = schlaefer(nie.spiel, 2, 1);
  wahrnehmen(nie.spiel, tief);
  assert.equal(tief.ki.wachzustand, "schlaeft");
});

test("Hinterhalt: ahnungslose Ziele werden sicher und kritisch getroffen, danach jagen sie", () => {
  const { spiel, ninkasi } = aufstellen();
  const opfer = schlaefer(spiel, 2, 1);
  const meldungen = meldungenMitschneiden(spiel);
  modifikatorHinzufuegen(ninkasi, { ziel: "kritfaktor", art: "plus", betrag: 50, quelle: "dolch", wenn: [{ bedingung: "gegenueber_ahnungslos" }] });
  assert.equal(istAhnungslos(opfer), true);
  nahkampf(spiel, ninkasi, opfer);
  assert.equal(opfer.werte.lp.aktuell, 12, "Genauigkeit 0 trifft trotzdem, 4 x 2");
  assert.ok(meldungen.some((meldung) => meldung.art === "hinterhalt"));
  assert.equal(opfer.ki.wachzustand, "jagt");
  assert.deepEqual(opfer.ki.letzteBekanntePosition, { x: 1, y: 1 });
  nahkampf(spiel, ninkasi, opfer);
  assert.equal(opfer.werte.lp.aktuell, 12, "wach: Genauigkeit 0 verfehlt");
});

test("Lärm: Kosten je Feld, Wände dämpfen nach laermdaempfung, Schlafende werden wach und gehen nach", () => {
  const { spiel } = aufstellen();
  const ebene = spiel.zustand.ebene;
  const durchDieWand = (lautstaerke) => laermFelder(spiel, { x: 5, y: 1 }, lautstaerke).has(feldIndex(ebene, 7, 1));
  assert.equal(durchDieWand(8), false, "die Wand kostet 8, das Feld dahinter 1 mehr");
  assert.equal(durchDieWand(9), true);
  const nebenan = schlaefer(spiel, 3, 2);
  const drueben = schlaefer(spiel, 9, 1);
  laermMachen(spiel, { x: 5, y: 1 }, 6);
  assert.equal(nebenan.ki.wachzustand, "wach");
  assert.deepEqual(nebenan.ki.letzteBekanntePosition, { x: 5, y: 1 });
  assert.equal(drueben.ki.wachzustand, "schlaeft");
});

test("Nahkampf macht Lärm", () => {
  const { spiel, ninkasi } = aufstellen();
  ninkasi.angriffe[0].genauigkeit = 100;
  const gegner = wesen(spiel, 2, 1, "verderber", 20, { ki: { modul: "jagen", letzteBekanntePosition: null } });
  const schlaefrig = schlaefer(spiel, 5, 2);
  nahkampf(spiel, ninkasi, gegner);
  assert.equal(schlaefrig.ki.wachzustand, "wach");
});

test("Jagen nach Wachzustand: schlafend wartet, wach geht nur Lärm nach, jagend verliert die Spur und wird wach", () => {
  const { spiel } = aufstellen();
  const jagen = holen("ki", "jagen");
  const wesenImRaum = schlaefer(spiel, 3, 1);
  assert.deepEqual(jagen(spiel, wesenImRaum, wesenImRaum.ki), { art: "warten" });
  wesenImRaum.ki.wachzustand = "wach";
  assert.deepEqual(jagen(spiel, wesenImRaum, wesenImRaum.ki), { art: "warten" }, "sieht Ninkasi, hat sie aber nicht bemerkt");
  wesenImRaum.ki.letzteBekanntePosition = { x: 4, y: 1 };
  assert.deepEqual(jagen(spiel, wesenImRaum, wesenImRaum.ki), { art: "bewegen", dx: 1, dy: 0 });
  wesenImRaum.ki.wachzustand = "jagt";
  wesenImRaum.ki.letzteBekanntePosition = null;
  assert.equal(jagen(spiel, wesenImRaum, wesenImRaum.ki).dx, -1, "jagt Ninkasi");
  const ohneSpur = aufstellen({ spurFaktor: 0 });
  const verloren = schlaefer(ohneSpur.spiel, 3, 1);
  Object.assign(verloren.ki, { wachzustand: "jagt", letzteBekanntePosition: { x: 3, y: 1 } });
  assert.deepEqual(jagen(ohneSpur.spiel, verloren, verloren.ki), { art: "warten" });
  assert.equal(verloren.ki.wachzustand, "wach");
});
