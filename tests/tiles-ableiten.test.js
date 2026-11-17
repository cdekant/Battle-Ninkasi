import { test } from "node:test";
import assert from "node:assert/strict";
import { tileAbleiten, umrissFinden, umrissSetzen, ableitungPruefen } from "../werkzeuge/tiles-ableiten.js";

const palette = {
  durchsichtig: ".",
  farben: [
    { zeichen: "0", rampe: "schwarz", stufe: 0, hex: "#000000" },
    { zeichen: "a", rampe: "probe", stufe: 0, hex: "#404040" },
    { zeichen: "b", rampe: "probe", stufe: 1, hex: "#c0c0c0" },
    { zeichen: "c", rampe: "andere", stufe: 0, hex: "#808080" },
    { zeichen: "r", rampe: "blut", stufe: 0, hex: "#c00000" },
  ],
};

test("Gelände ohne Umriss: Flächenmittel, nächste Farbe nur aus der Vorlage", () => {
  // je 2x2 Fläche: a/a/a/a -> a, b/b/b/b -> b, a/b gemischt liegt bei c, c kommt aber in der Vorlage nicht vor
  const vorlage = ["aabb", "aabb", "abbb", "abbb"];
  assert.deepEqual(tileAbleiten(vorlage, 2, palette), ["ab", "ab"]);
});

test("Umriss wird erkannt, nicht mitgemittelt und neu gesetzt", () => {
  const vorlage = [
    "........",
    "..0000..",
    ".0bbbb0.",
    ".0bbbb0.",
    ".0bbbb0.",
    ".0bbbb0.",
    "..0000..",
    "........",
  ];
  assert.equal(umrissFinden(vorlage, ".").size, 16);
  assert.deepEqual(tileAbleiten(vorlage, 4, palette), [".00.", "0bb0", "0bb0", ".00."]);
});

test("Schwarz im Inneren ist kein Umriss", () => {
  const vorlage = ["....", ".0b.", ".b0.", "...."];
  assert.deepEqual([...umrissFinden(vorlage, ".")], ["1,1", "2,2"]);
  assert.equal(umrissFinden(["bbb", "b0b", "bbb"], ".").size, 0);
});

test("umrissSetzen umrandet die Figur nur auf durchsichtigen Pixeln", () => {
  assert.deepEqual(umrissSetzen(["...", ".b.", "..."], "."), [".0.", "0b0", ".0."]);
});

test("Vorrangfarben: ein einzelnes Signalpixel überlebt die Verkleinerung", () => {
  const vorlage = ["bbbb", "brbb", "bbbb", "bbbb"];
  assert.deepEqual(tileAbleiten(vorlage, 2, palette), ["rb", "bb"]);
});

test("Fugen: bei Gelände gewinnt eine durchgehende dunkle Linie, ein einzelnes Korn nicht", () => {
  // Faktor 4: links eine senkrechte Fuge (Anteil 1/4), rechts nur ein einzelnes dunkles Korn (1/16)
  const vorlage = [
    "0bbbbbbb",
    "0bbbbb0b",
    "0bbbbbbb",
    "0bbbbbbb",
    "0bbbbbbb",
    "0bbbbbbb",
    "0bbbbbbb",
    "0bbbbbbb",
  ];
  assert.deepEqual(tileAbleiten(vorlage, 2, palette), ["0b", "0b"]);
});

test("ableitungPruefen meldet verschwundene Signalfarben, zerfallene Figuren und ausgedünnte Fugen", () => {
  assert.deepEqual(ableitungPruefen(["0r..", "00..", "....", "...."], ["0...", "....", "....", "...."], palette),
    ["Signalfarbe verschwunden: r"]);
  assert.deepEqual(ableitungPruefen(["bbb.", "....", "....", "...."], ["b.b.", "....", "....", "...."], palette),
    ["Figur zerfallen: 2 statt 1 Teile"]);
  assert.deepEqual(ableitungPruefen(["0b", "0b"], ["bb", "bb"], palette),
    ['Fugen ausgedünnt: Anteil "0" 0 % statt 50 %']);
  assert.deepEqual(ableitungPruefen(["0b", "0b"], ["0b", "0b"], palette), []);
});

test("krummer Faktor 64 zu 48 ergibt die richtige Größe", () => {
  const vorlage = Array.from({ length: 64 }, () => "a".repeat(64));
  const ergebnis = tileAbleiten(vorlage, 48, palette);
  assert.equal(ergebnis.length, 48);
  assert.ok(ergebnis.every((zeile) => zeile === "a".repeat(48)));
});
