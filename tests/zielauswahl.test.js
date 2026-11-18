import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Zielmuster an
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar } from "./hilfen.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { musterFelder, entitaetenAufFeldern, zielAufloesen } from "../src/systeme/zielauswahl.js";

const KARTE = [
  "#########",
  "#.......#",
  "#.......#",
  "#...#...#",
  "#.......#",
  "#########",
];

const alsText = (felder) => felder.map((feld) => `${feld.x},${feld.y}`);
const muster = (spiel, art, parameter, ursprung, zielpunkt = ursprung) => alsText(musterFelder(spiel, { art, ...parameter }, { ursprung, zielpunkt }));

test("Linie, Strahl und angrenzend; Linie und Strahl enden an der Wand", () => {
  const spiel = miniSpiel(KARTE);
  assert.deepEqual(muster(spiel, "linie", { laenge: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }), ["3,2", "4,2"]);
  assert.deepEqual(muster(spiel, "strahl", {}, { x: 1, y: 3 }, { x: 2, y: 3 }), ["2,3", "3,3"]);
  assert.deepEqual(muster(spiel, "strahl", { laenge: 1 }, { x: 1, y: 3 }, { x: 2, y: 3 }), ["2,3"]);
  assert.equal(muster(spiel, "angrenzend", {}, { x: 2, y: 2 }).length, 8);
  assert.deepEqual(muster(spiel, "selbst", {}, { x: 2, y: 2 }, { x: 5, y: 1 }), ["2,2"]);
  assert.deepEqual(muster(spiel, "feld", {}, { x: 2, y: 2 }, { x: 5, y: 1 }), ["5,1"]);
});

test("Kreis und Kegel: keine Explosion um die Ecke, außer mit durchWaende", () => {
  const spiel = miniSpiel(KARTE);
  const mitte = { x: 5, y: 3 };
  assert.ok(muster(spiel, "kreis", { radius: 1 }, mitte).includes("4,3"), "die Wand selbst gehört dazu");
  assert.ok(!muster(spiel, "kreis", { radius: 2 }, mitte).includes("3,3"), "hinter der Wand");
  assert.ok(muster(spiel, "kreis", { radius: 2, durchWaende: true }, mitte).includes("3,3"));
  const kegelNachWesten = muster(spiel, "kegel", { laenge: 3 }, { x: 6, y: 3 }, { x: 5, y: 3 });
  assert.ok(kegelNachWesten.includes("5,3") && !kegelNachWesten.includes("3,3"));
  assert.deepEqual(muster(spiel, "kegel", { laenge: 3 }, mitte, mitte), [], "ohne Richtung kein Kegel");
});

test("trifft und ohneUrheber, aus Sicht der Urheberin", () => {
  const spiel = miniSpiel(KARTE);
  const ninkasi = wesen(spiel, 2, 2, "ninkasi");
  const feind = wesen(spiel, 3, 2, "verderber");
  const freundin = wesen(spiel, 2, 1, "ninkasi");
  const flasche = entitaetErzeugen(spiel.zustand, { position: { x: 3, y: 1 } });
  const felder = musterFelder(spiel, { art: "kreis", radius: 1 }, { ursprung: { x: 2, y: 2 }, zielpunkt: { x: 2, y: 2 } });
  const ids = (optionen) => entitaetenAufFeldern(spiel, felder, { urheberId: ninkasi.id, ...optionen }).map((entitaet) => entitaet.id);
  assert.deepEqual(ids({}), [ninkasi.id, freundin.id, feind.id, flasche.id], "Vorgabe alle, nach Abstand und Feldindex");
  assert.deepEqual(ids({ trifft: "wesen" }), [ninkasi.id, freundin.id, feind.id]);
  assert.deepEqual(ids({ trifft: "feinde" }), [feind.id]);
  assert.deepEqual(ids({ trifft: "verbuendete" }), [ninkasi.id, freundin.id]);
  assert.deepEqual(ids({ trifft: "verbuendete", ohneUrheber: true }), [freundin.id]);
  assert.deepEqual(ids({ trifft: "feinde", urheberId: null, urheberFraktion: "verderber" }), [ninkasi.id, freundin.id], "Fraktion einer entfernten Urheberin");
});

test("Zielart wesen und feld: Reichweite, Sichtlinie, Sicht von Ninkasi", () => {
  const spiel = miniSpiel(KARTE);
  const ninkasi = spielerinSetzen(spiel, 2, 3);
  const hinterDerWand = wesen(spiel, 6, 3, "verderber");
  const nah = wesen(spiel, 3, 2, "verderber");
  const zielart = { art: "wesen", reichweite: 5 };
  assert.equal(zielAufloesen(spiel, ninkasi, zielart, { id: nah.id }).grund, "nicht_sichtbar");
  allesSichtbar(spiel);
  assert.equal(zielAufloesen(spiel, ninkasi, zielart, { id: hinterDerWand.id }).grund, "keine_sichtlinie");
  assert.equal(zielAufloesen(spiel, ninkasi, { ...zielart, brauchtSichtlinie: false }, { id: hinterDerWand.id }).ok, true);
  assert.equal(zielAufloesen(spiel, ninkasi, { ...zielart, reichweite: 3 }, { id: hinterDerWand.id }).grund, "zu_weit");
  assert.equal(zielAufloesen(spiel, ninkasi, zielart, { id: 999 }).grund, "kein_ziel");
  const getroffen = zielAufloesen(spiel, ninkasi, zielart, { id: nah.id });
  assert.deepEqual([getroffen.ursprung, getroffen.zielId, getroffen.betroffene], [{ x: 3, y: 2 }, nah.id, [nah.id]]);
  const flaeche = zielAufloesen(spiel, ninkasi, { art: "feld", muster: { art: "kreis", radius: 1 }, trifft: "feinde" }, { x: 3, y: 3 });
  assert.deepEqual(flaeche.betroffene, [nah.id]);
  assert.equal(zielAufloesen(spiel, ninkasi, { art: "feld" }, { x: 99, y: 1 }).grund, "ungueltig");
});

test("Zielart geschoss: Aufschlag am ersten Wesen wird Ursprung des Musters", () => {
  const spiel = miniSpiel(KARTE);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  allesSichtbar(spiel);
  const davor = wesen(spiel, 4, 1, "verderber");
  const dahinter = wesen(spiel, 6, 1, "verderber");
  const daneben = wesen(spiel, 5, 2, "verderber");
  const einfach = zielAufloesen(spiel, ninkasi, { art: "geschoss", reichweite: 8 }, { id: dahinter.id });
  assert.deepEqual([einfach.zielpunkt, einfach.zielId, einfach.betroffene], [{ x: 4, y: 1 }, davor.id, [davor.id]]);
  const explosion = zielAufloesen(spiel, ninkasi, { art: "geschoss", reichweite: 8, muster: { art: "kreis", radius: 1 } }, { x: 6, y: 1 });
  assert.deepEqual(explosion.betroffene, [davor.id, daneben.id]);
  const durch = zielAufloesen(spiel, ninkasi, { art: "geschoss", reichweite: 8, durchdringend: true }, { x: 6, y: 1 });
  assert.deepEqual(durch.betroffene, [davor.id, dahinter.id]);
  assert.equal(zielAufloesen(spiel, ninkasi, { art: "geschoss", reichweite: 8 }, { x: 1, y: 1 }).grund, "kein_ziel");
});

test("Zielart richtung mit Kegel und selbst mit Kreis; die Vorschau ändert weder Zustand noch Zufall", () => {
  const spiel = miniSpiel(KARTE);
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  allesSichtbar(spiel);
  const feind = wesen(spiel, 3, 2, "verderber");
  const vorher = JSON.stringify(spiel.zustand);
  const kegel = zielAufloesen(spiel, ninkasi, { art: "richtung", muster: { art: "kegel", laenge: 3 } }, { dx: 1, dy: 0 });
  assert.deepEqual(kegel.betroffene, [feind.id]);
  assert.equal(zielAufloesen(spiel, ninkasi, { art: "richtung" }, { dx: 2, dy: 0 }).grund, "ungueltig");
  const nova = zielAufloesen(spiel, ninkasi, { art: "selbst", muster: { art: "kreis", radius: 2 }, ohneUrheber: true }, {});
  assert.deepEqual(nova.betroffene, [feind.id]);
  assert.equal(JSON.stringify(spiel.zustand), vorher);
});
