import { test } from "node:test";
import assert from "node:assert/strict";
import { passendeSaetze, pixelZuRgba, tilesetPruefen, tileQuellenangabe } from "../src/anzeige/tilebilder.js";
import tileset from "../grafik/tileset.js";
import { rohdaten, texte as texteJeSprache } from "../src/inhalt.js";
const zeichensatz = rohdaten.zeichen; // Grundgerüst und Probeinhalt

const palette = {
  durchsichtig: ".",
  farben: [
    { zeichen: "0", rampe: "schwarz", stufe: 0, hex: "#000000" },
    { zeichen: "a", rampe: "probe", stufe: 0, hex: "#102030" },
  ],
};

test("passendeSaetze: nur ganzzahlige Vielfache, der größte Satz zuerst", () => {
  assert.deepEqual(passendeSaetze([64], 64), [64]);
  assert.deepEqual(passendeSaetze([64], 128), [64]);
  assert.deepEqual(passendeSaetze([64], 32), []);
  assert.deepEqual(passendeSaetze([64], 48), []);
  assert.deepEqual(passendeSaetze([16, 32, 64], 64), [64, 32, 16]);
  assert.deepEqual(passendeSaetze([16, 32, 64], 48), [16]);
  assert.deepEqual(passendeSaetze([16, 48], 96), [48, 16]);
});

test("pixelZuRgba: Farben aus der Palette, durchsichtige Pixel bleiben leer", () => {
  const rgba = pixelZuRgba({ groesse: 2, pixel: ["a.", "0a"] }, palette);
  assert.deepEqual([...rgba], [
    0x10, 0x20, 0x30, 255, 0, 0, 0, 0,
    0, 0, 0, 255, 0x10, 0x20, 0x30, 255,
  ]);
});

test("tilesetPruefen meldet falsche Größe, falsche Zeilen und unbekannte Zeichen", () => {
  const fehler = tilesetPruefen({
    palette,
    quellenangabe: { vorgabe: { art: "chd" } },
    saetze: { 2: { gut: { groesse: 2, pixel: ["a.", "0a"] }, schlecht: { groesse: 2, pixel: ["aX", "0"] } }, 4: { klein: { groesse: 2, pixel: ["..", ".."] } } },
  });
  assert.deepEqual(fehler, [
    'tiles/2/schlecht: Zeile 0 enthält unbekanntes Zeichen "X"',
    "tiles/2/schlecht: Zeile 1 hat 1 statt 2 Zeichen",
    "tiles/4/klein: groesse 2 passt nicht zum Satz 4",
  ]);
});

test("Quellenangabe der Tiles: Tile vor Satz vor Vorgabe; fehlende und fehlerhafte Angaben werden gemeldet", () => {
  const tile = { groesse: 2, pixel: ["a.", "0a"] };
  const claude = { art: "generiert", beteiligt: [{ wer: "Claude" }] };
  const satz = { art: "chd" };
  const eigen = { art: "frei", nach: "dem Burney-Relief", beteiligt: [{ wer: "Claude" }] };
  const probe = { palette, quellenangabe: { vorgabe: claude, saetze: { 4: satz } }, saetze: { 2: { tile, mitAngabe: { ...tile, quellenangabe: eigen } }, 4: { tile: { ...tile, groesse: 4, pixel: ["a...", "....", "....", "...."] } } } };
  assert.deepEqual(tileQuellenangabe(probe, 2, "tile"), claude, "Vorgabe");
  assert.deepEqual(tileQuellenangabe(probe, 4, "tile"), satz, "Satz vor Vorgabe");
  assert.deepEqual(tileQuellenangabe(probe, 2, "mitAngabe"), eigen, "Tile vor allem");
  assert.equal(tileQuellenangabe(probe, 2, "fehlt"), null);
  assert.deepEqual(tilesetPruefen(probe), []);
  const ohne = tilesetPruefen({ palette, saetze: { 2: { tile } } });
  assert.deepEqual(ohne, ["tiles/2/tile: ohne Quellenangabe"]);
  const kaputt = tilesetPruefen({ palette, quellenangabe: { vorgabe: { art: "generiert" } }, saetze: { 2: { tile: { ...tile, quellenangabe: { art: "eigen" } } } } });
  assert.equal(kaputt.length, 2);
  assert.equal(kaputt[0], "quellenangabe.vorgabe: generiert ohne beteiligt");
  assert.match(kaputt[1], /^tiles\/2\/tile: art "eigen" ist keine/);
});

test("das Tileset in grafik/ ist fehlerfrei, jedes Tile mit Quellenangabe", () => {
  assert.deepEqual(tilesetPruefen(tileset, { texte: texteJeSprache.de }), []);
  assert.deepEqual(tilesetPruefen(tileset, { texte: texteJeSprache.en }), []);
});

test("jedes Tile hat einen Eintrag in den Zeichen als Ersatz", () => {
  const zeichenNamen = new Set([
    ...Object.keys(zeichensatz.gelaende), ...Object.keys(zeichensatz.wesen), ...Object.keys(zeichensatz.gegenstaende),
  ]);
  for (const satz of Object.values(tileset.saetze)) {
    for (const name of Object.keys(satz)) assert.ok(zeichenNamen.has(name), `${name} fehlt in den Zeichen`);
  }
});
