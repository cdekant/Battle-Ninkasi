import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zufallErzeugen, naechsteZufallszahl, zufallsGanzzahl, mitProzentChance, wuerfeln, istWuerfelausdruck, startwertAbleiten,
} from "../src/kern/zufall.js";

const zahlenfolge = (zufallszustand, laenge) => Array.from({ length: laenge }, () => naechsteZufallszahl(zufallszustand));

test("Zahlenfolge zu Startwert 1 bleibt fest (sonst werden Spielstände ungültig)", () => {
  assert.deepEqual(zahlenfolge(zufallErzeugen(1), 5), [1828152527, 3394835397, 2967886022, 2251045104, 4148684523]);
  assert.equal(startwertAbleiten(1, "ebene.1"), 2499630942);
});

test("gleicher Startwert ergibt gleiche Folge, anderer Startwert eine andere", () => {
  const folge42 = zahlenfolge(zufallErzeugen(42), 10);
  assert.deepEqual(folge42, zahlenfolge(zufallErzeugen(42), 10));
  assert.notDeepEqual(folge42, zahlenfolge(zufallErzeugen(43), 10));
});

test("Zufallszustand übersteht JSON und läuft danach gleich weiter", () => {
  const original = zufallErzeugen(7);
  naechsteZufallszahl(original);
  const kopie = JSON.parse(JSON.stringify(original));
  assert.equal(naechsteZufallszahl(kopie), naechsteZufallszahl(original));
});

test("zufallsGanzzahl bleibt in den Grenzen und trifft jeden Wert", () => {
  const zufallszustand = zufallErzeugen(3);
  const gezogeneWerte = new Set();
  for (let i = 0; i < 1000; i++) {
    const zahl = zufallsGanzzahl(zufallszustand, -2, 3);
    assert.ok(Number.isInteger(zahl) && zahl >= -2 && zahl <= 3);
    gezogeneWerte.add(zahl);
  }
  assert.equal(gezogeneWerte.size, 6);
  assert.equal(zufallsGanzzahl(zufallszustand, 5, 5), 5);
});

test("mitProzentChance: 0 trifft nie, 100 immer", () => {
  const zufallszustand = zufallErzeugen(5);
  for (let i = 0; i < 200; i++) {
    assert.equal(mitProzentChance(zufallszustand, 0), false);
    assert.equal(mitProzentChance(zufallszustand, 100), true);
  }
});

test("wuerfeln: Festwerte und Bereiche der Würfelausdrücke", () => {
  const zufallszustand = zufallErzeugen(9);
  assert.equal(wuerfeln(zufallszustand, "5"), 5);
  assert.equal(wuerfeln(zufallszustand, 5), 5);
  const bereichNachAusdruck = { "1W6+2": [3, 8], "2W6": [2, 12], "1W4-1": [0, 3], "1d6": [1, 6] };
  for (const [ausdruck, [min, max]] of Object.entries(bereichNachAusdruck)) {
    for (let i = 0; i < 300; i++) {
      const ergebnis = wuerfeln(zufallszustand, ausdruck);
      assert.ok(ergebnis >= min && ergebnis <= max, `${ausdruck} ergab ${ergebnis}`);
    }
  }
  assert.throws(() => wuerfeln(zufallszustand, "W6"));
  assert.throws(() => wuerfeln(zufallszustand, "abc"));
});

test("istWuerfelausdruck erkennt gültige und ungültige Ausdrücke", () => {
  for (const ausdruck of ["2W6", "1W6+2", "1W4-1", "+3", 3]) assert.equal(istWuerfelausdruck(ausdruck), true, String(ausdruck));
  for (const ausdruck of ["", "  ", "W6", "abc", "2W"]) assert.equal(istWuerfelausdruck(ausdruck), false, `"${ausdruck}"`);
});

test("startwertAbleiten hängt von Startwert und Kennung ab", () => {
  assert.equal(startwertAbleiten(1, "ebene.1"), startwertAbleiten(1, "ebene.1"));
  assert.notEqual(startwertAbleiten(1, "ebene.1"), startwertAbleiten(1, "ebene.2"));
  assert.notEqual(startwertAbleiten(1, "ebene.1"), startwertAbleiten(2, "ebene.1"));
});
