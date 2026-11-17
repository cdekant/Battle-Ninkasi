import { test } from "node:test";
import assert from "node:assert/strict";
import { passendeSaetze, pixelZuRgba, tilesetPruefen } from "../src/anzeige/tilebilder.js";
import tileset from "../grafik/tileset.js";
import zeichensatz from "../daten/zeichen.js";

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
    saetze: { 2: { gut: { groesse: 2, pixel: ["a.", "0a"] }, schlecht: { groesse: 2, pixel: ["aX", "0"] } }, 4: { klein: { groesse: 2, pixel: ["..", ".."] } } },
  });
  assert.deepEqual(fehler, [
    'tiles/2/schlecht: Zeile 0 enthält unbekanntes Zeichen "X"',
    "tiles/2/schlecht: Zeile 1 hat 1 statt 2 Zeichen",
    "tiles/4/klein: groesse 2 passt nicht zum Satz 4",
  ]);
});

test("das Tileset in grafik/ ist fehlerfrei", () => {
  assert.deepEqual(tilesetPruefen(tileset), []);
});

test("jedes Tile hat einen Eintrag in daten/zeichen.js als Ersatz", () => {
  const zeichenNamen = new Set([
    ...Object.keys(zeichensatz.gelaende), ...Object.keys(zeichensatz.wesen), ...Object.keys(zeichensatz.gegenstaende),
  ]);
  for (const satz of Object.values(tileset.saetze)) {
    for (const name of Object.keys(satz)) assert.ok(zeichenNamen.has(name), `${name} fehlt in daten/zeichen.js`);
  }
});
