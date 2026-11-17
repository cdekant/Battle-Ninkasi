import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugen, naechste, ganzzahl, chance, wuerfeln, istWuerfelausdruck, ableiten } from "../src/kern/zufall.js";

test("Zahlenfolge zu Startwert 1 bleibt fest (sonst werden Spielstände ungültig)", () => {
  const s = erzeugen(1);
  assert.deepEqual([1, 2, 3, 4, 5].map(() => naechste(s)), [1828152527, 3394835397, 2967886022, 2251045104, 4148684523]);
  assert.equal(ableiten(1, "ebene.1"), 2499630942);
});

test("gleicher Startwert ergibt gleiche Folge, anderer Startwert eine andere", () => {
  const a = erzeugen(42), b = erzeugen(42), c = erzeugen(43);
  const folge = (s) => Array.from({ length: 10 }, () => naechste(s));
  const fa = folge(a);
  assert.deepEqual(fa, folge(b));
  assert.notDeepEqual(fa, folge(c));
});

test("Zustand übersteht JSON und läuft danach gleich weiter", () => {
  const s = erzeugen(7);
  naechste(s);
  const kopie = JSON.parse(JSON.stringify(s));
  assert.equal(naechste(kopie), naechste(s));
});

test("ganzzahl bleibt in den Grenzen und trifft jeden Wert", () => {
  const s = erzeugen(3);
  const gesehen = new Set();
  for (let i = 0; i < 1000; i++) {
    const z = ganzzahl(s, -2, 3);
    assert.ok(Number.isInteger(z) && z >= -2 && z <= 3);
    gesehen.add(z);
  }
  assert.equal(gesehen.size, 6);
  assert.equal(ganzzahl(s, 5, 5), 5);
});

test("chance 0 trifft nie, chance 100 immer", () => {
  const s = erzeugen(5);
  for (let i = 0; i < 200; i++) {
    assert.equal(chance(s, 0), false);
    assert.equal(chance(s, 100), true);
  }
});

test("wuerfeln: Festwerte und Bereiche der Würfelausdrücke", () => {
  const s = erzeugen(9);
  assert.equal(wuerfeln(s, "5"), 5);
  assert.equal(wuerfeln(s, 5), 5);
  const bereiche = { "1W6+2": [3, 8], "2W6": [2, 12], "1W4-1": [0, 3], "1d6": [1, 6] };
  for (const [ausdruck, [min, max]] of Object.entries(bereiche)) {
    for (let i = 0; i < 300; i++) {
      const w = wuerfeln(s, ausdruck);
      assert.ok(w >= min && w <= max, `${ausdruck} ergab ${w}`);
    }
  }
  assert.throws(() => wuerfeln(s, "W6"));
  assert.throws(() => wuerfeln(s, "abc"));
});

test("istWuerfelausdruck erkennt gültige und ungültige Ausdrücke", () => {
  for (const a of ["2W6", "1W6+2", "1W4-1", "+3", 3]) assert.equal(istWuerfelausdruck(a), true, String(a));
  for (const a of ["", "  ", "W6", "abc", "2W"]) assert.equal(istWuerfelausdruck(a), false, `"${a}"`);
});

test("ableiten hängt von Startwert und Kennung ab", () => {
  assert.equal(ableiten(1, "ebene.1"), ableiten(1, "ebene.1"));
  assert.notEqual(ableiten(1, "ebene.1"), ableiten(1, "ebene.2"));
  assert.notEqual(ableiten(1, "ebene.1"), ableiten(2, "ebene.1"));
});
