import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Zielmuster an
import { miniSpiel, wesen } from "./hilfen.js";
import { linie, sichtlinieFrei, flugbahn, kreis, kegel, felderOrdnen, KEGEL_OEFFNUNGEN } from "../src/welt/geometrie.js";

const alsText = (felder) => felder.map((feld) => `${feld.x},${feld.y}`);
const alsMenge = (felder) => new Set(alsText(felder));

// Bild eines Musters um die Mitte (0, 0): "#" getroffen, "." nicht
function bild(felder, radius) {
  const menge = alsMenge(felder);
  const zeilen = [];
  for (let y = -radius; y <= radius; y++) {
    let zeile = "";
    for (let x = -radius; x <= radius; x++) zeile += menge.has(`${x},${y}`) ? "#" : ".";
    zeilen.push(zeile);
  }
  return zeilen;
}

// Die acht Spiegelungen und Drehungen des Gitters
const SYMMETRIEN = [
  ({ x, y }) => ({ x, y }), ({ x, y }) => ({ x: -x, y }), ({ x, y }) => ({ x, y: -y }), ({ x, y }) => ({ x: -x, y: -y }),
  ({ x, y }) => ({ x: y, y: x }), ({ x, y }) => ({ x: -y, y: x }), ({ x, y }) => ({ x: y, y: -x }), ({ x, y }) => ({ x: -y, y: -x }),
];
const ACHT_RICHTUNGEN = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([dx, dy]) => ({ dx, dy }));

test("Linien sind symmetrisch und lückenlos, über alle Paare in 15x15", () => {
  const felder = [];
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) felder.push({ x, y });
  for (const von of felder) {
    for (const nach of felder) {
      const hin = linie(von, nach);
      assert.deepEqual(hin, linie(nach, von).reverse());
      assert.deepEqual([hin[0], hin.at(-1)], [von, nach]);
      assert.equal(hin.length, Math.max(Math.abs(nach.x - von.x), Math.abs(nach.y - von.y)) + 1);
      for (let nummer = 1; nummer < hin.length; nummer++) {
        assert.ok(Math.max(Math.abs(hin[nummer].x - hin[nummer - 1].x), Math.abs(hin[nummer].y - hin[nummer - 1].y)) === 1);
      }
    }
  }
});

test("Kreis: dx² + dy² <= r·(r+1), Radius 1 ist das volle 3x3", () => {
  const mitte = { x: 0, y: 0 };
  assert.deepEqual(bild(kreis(mitte, 0), 1), ["...", ".#.", "..."]);
  assert.deepEqual(bild(kreis(mitte, 1), 1), ["###", "###", "###"]);
  assert.deepEqual(bild(kreis(mitte, 2), 2), [".###.", "#####", "#####", "#####", ".###."]);
  assert.deepEqual(bild(kreis(mitte, 3), 3), ["..###..", ".#####.", "#######", "#######", "#######", ".#####.", "..###.."]);
});

test("Kegel: Form nach Öffnung, in allen acht Richtungen gespiegelt gleich", () => {
  const mitte = { x: 0, y: 0 };
  assert.deepEqual(bild(kegel(mitte, { dx: 1, dy: 0 }, 2, 90), 2), [".....", "...##", "...##", "...##", "....."]);
  assert.deepEqual(bild(kegel(mitte, { dx: 1, dy: 1 }, 2, 90), 2), [".....", ".....", "...##", "..###", "..##."]);
  for (const oeffnung of Object.keys(KEGEL_OEFFNUNGEN).map(Number)) {
    for (const richtung of ACHT_RICHTUNGEN) {
      const urbild = kegel(mitte, richtung, 4, oeffnung);
      for (const spiegeln of SYMMETRIEN) {
        const gedrehteRichtung = spiegeln({ x: richtung.dx, y: richtung.dy });
        const erwartet = alsMenge(urbild.map(spiegeln));
        assert.deepEqual(alsMenge(kegel(mitte, { dx: gedrehteRichtung.x, dy: gedrehteRichtung.y }, 4, oeffnung)), erwartet);
      }
    }
  }
  assert.throws(() => kegel(mitte, { dx: 1, dy: 0 }, 2, 77), /Öffnung/);
});

test("Sichtlinie: Wände dazwischen sperren, Wandecken sind großzügig", () => {
  const spiel = miniSpiel([
    "#######",
    "#..#..#",
    "#.....#",
    "##.####",
    "#######",
  ]);
  assert.ok(sichtlinieFrei(spiel, { x: 1, y: 1 }, { x: 5, y: 2 }));
  assert.ok(!sichtlinieFrei(spiel, { x: 1, y: 1 }, { x: 5, y: 1 }), "Wand bei 3,1");
  assert.ok(sichtlinieFrei(spiel, { x: 1, y: 1 }, { x: 3, y: 1 }), "Wand als Endpunkt ist sichtbar");
  // Diagonalschritt von 1,2 nach 2,3: Seite 2,2 frei, 1,3 Wand
  assert.ok(sichtlinieFrei(spiel, { x: 1, y: 2 }, { x: 2, y: 3 }));
  const eckig = miniSpiel(["####", "#.##", "##.#", "####"]);
  assert.ok(!sichtlinieFrei(eckig, { x: 1, y: 1 }, { x: 2, y: 2 }), "beide Seiten zu");
});

test("Flugbahn endet am ersten Wesen, durchdringend erst an der Wand, sonst am Ziel", () => {
  const spiel = miniSpiel(["#########", "#.......#", "#########"]);
  const erstes = wesen(spiel, 3, 1), zweites = wesen(spiel, 5, 1);
  const von = { x: 1, y: 1 };
  const einfach = flugbahn(spiel, von, { x: 6, y: 1 });
  assert.deepEqual([einfach.getroffene, einfach.aufschlag], [[erstes.id], { x: 3, y: 1 }]);
  const durch = flugbahn(spiel, von, { x: 6, y: 1 }, { durchdringend: true });
  assert.deepEqual([durch.getroffene, durch.aufschlag], [[erstes.id, zweites.id], { x: 6, y: 1 }]);
  const weiter = flugbahn(spiel, von, { x: 2, y: 1 }, { durchdringend: true, ueberZielHinaus: true });
  assert.deepEqual(weiter.aufschlag, { x: 7, y: 1 }, "Feld vor der Wand");
  const kurz = flugbahn(spiel, von, { x: 2, y: 1 }, { durchdringend: true, ueberZielHinaus: true, reichweite: 3 });
  assert.deepEqual(kurz.aufschlag, { x: 4, y: 1 }, "Reichweite");
  assert.deepEqual(flugbahn(spiel, von, von).felder, []);
  const ueber = flugbahn(spiel, von, { x: 6, y: 1 }, { ueberspringen: (getroffen) => getroffen.id === erstes.id });
  assert.deepEqual([ueber.getroffene, ueber.aufschlag], [[zweites.id], { x: 5, y: 1 }], "übersprungen wird nicht getroffen und hält nicht auf");
});

test("Felder ordnen: nach Abstand zum Ursprung, dann nach Feldindex, ohne doppelte und ohne Felder außerhalb", () => {
  const ebene = { breite: 5, hoehe: 5 };
  const felder = [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 2 }];
  assert.deepEqual(alsText(felderOrdnen(ebene, { x: 2, y: 2 }, felder)), ["2,2", "2,1", "1,2", "3,2", "1,1"]);
});
