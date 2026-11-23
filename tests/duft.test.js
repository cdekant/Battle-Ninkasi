// Spur als Duft (siehe docs/Welt.md, Duft): Legen nach jedem Zug der gesteuerten Entität, Abstand und Maximum,
// Folgen um die Ecke, Haltbarkeit, Spurweite und Abschalten an der KI.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { befehlAusfuehren } from "../src/kern/spiel.js";
import { positionSetzen } from "../src/kern/raumindex.js";
import { miniSpiel, wesen, spielerinSetzen } from "./hilfen.js";
import { holen } from "../src/kern/register.js";
import { wachzustandVon } from "../src/systeme/wahrnehmung.js";
import { duftabstand, duftAuf, duftLegen, duftFrisch, duftfeld } from "../src/systeme/duft.js";

const RAUM = [
  "###########",
  "#.........#",
  "#.........#",
  "###########",
];

// Ein Gang mit einer Ecke: oben nach rechts, dann nach unten
const ECKE = [
  "#######",
  "#.....#",
  "#####.#",
  "#####.#",
  "#######",
];

const jaeger = (spiel, x, y, ki = {}) =>
  wesen(spiel, x, y, "verderber", 20, { ki: { modul: "jagen", letzteBekanntePosition: null, ...ki }, sicht: { reichweite: 8 } });

// Ninkasi geht die Felder ab und hinterlässt auf jedem Duft
function gehen(spiel, ninkasi, felder) {
  for (const feld of felder) {
    positionSetzen(spiel.zustand, ninkasi, feld);
    duftLegen(spiel);
  }
}

test("Duftabstand: die längere Achse doppelt, die kürzere einfach", () => {
  assert.deepEqual([[1, 0], [0, 1], [1, 1], [2, 1], [3, 0]].map(([x, y]) => duftabstand({ x: 0, y: 0 }, { x, y })), [2, 2, 3, 5, 6]);
});

test("Duft legen: der Zähler steigt je Zug, mit der Entfernung schwächer, ein Feld behält den stärksten Wert", () => {
  const spiel = miniSpiel(RAUM);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  assert.equal(duftAuf(spiel, 1, 1), 0, "vor dem ersten Zug kein Duft");
  duftLegen(spiel);
  duftLegen(spiel);
  assert.equal(spiel.zustand.duftZaehler, 6);
  assert.deepEqual([[1, 1], [2, 1], [2, 2], [3, 1], [4, 2]].map(([x, y]) => duftAuf(spiel, x, y)), [6, 4, 3, 2, 0]);
  positionSetzen(spiel.zustand, ninkasi, { x: 5, y: 1 });
  duftLegen(spiel);
  assert.equal(duftAuf(spiel, 1, 1), 6, "der neue Duft (9 - 8) ist schwächer als der alte");
  assert.equal(duftAuf(spiel, 5, 1), 9);
});

test("Duft nur in der Sichtlinie, ohne Rücksicht auf Licht", () => {
  const spiel = miniSpiel(["#######", "#..#..#", "#######"]);
  spiel.zustand.ebene.licht = { grundhelligkeit: 0 };
  spielerinSetzen(spiel, 1, 1);
  duftLegen(spiel);
  duftLegen(spiel);
  assert.equal(duftAuf(spiel, 2, 1), 4, "im Finstern genauso");
  assert.equal(duftAuf(spiel, 5, 1), 0, "hinter der Wand nichts");
});

test("Duft legt nur der Zug der gesteuerten Entität", () => {
  const spiel = miniSpiel(RAUM);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const fremd = jaeger(spiel, 8, 2, { wachzustand: "schlaeft" });
  befehlAusfuehren(spiel, fremd, { art: "warten" });
  assert.equal(spiel.zustand.duftZaehler, 0);
  befehlAusfuehren(spiel, ninkasi, { art: "warten" });
  assert.equal(spiel.zustand.duftZaehler, 3);
  assert.equal(duftAuf(spiel, 1, 1), 3);
});

test("Duft folgen: ein Jäger, der Ninkasi verloren hat, folgt ihrer Spur um die Ecke bis zu ihr", () => {
  const spiel = miniSpiel(ECKE);
  spiel.zustand.ebene.licht = { grundhelligkeit: 0 }; // im Finstern sieht er sie nicht
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  gehen(spiel, ninkasi, [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }]);
  const bakterium = jaeger(spiel, 1, 1);
  const jagen = holen("ki", "jagen");
  const weg = [];
  for (let schritt = 0; schritt < 8; schritt++) {
    const befehl = jagen(spiel, bakterium, bakterium.ki);
    assert.equal(befehl.art, "bewegen", `Schritt ${schritt}: ${JSON.stringify(befehl)}`);
    const feld = { x: bakterium.position.x + befehl.dx, y: bakterium.position.y + befehl.dy };
    if (befehl.angreifen) {
      assert.deepEqual(feld, ninkasi.position);
      break;
    }
    positionSetzen(spiel.zustand, bakterium, feld);
    weg.push(`${feld.x},${feld.y}`);
  }
  assert.deepEqual(weg, ["2,1", "3,1", "4,1", "5,2"]);
  assert.equal(wachzustandVon(bakterium), "jagt");
});

test("Duft folgen: nicht mit altem Duft, nicht jenseits der Spurweite, nicht mit duftFolgen false", () => {
  const aufstellen = ({ regeln = {}, ki = {} } = {}) => {
    const spiel = miniSpiel(RAUM, { regeln });
    spiel.zustand.ebene.licht = { grundhelligkeit: 0 };
    const ninkasi = spielerinSetzen(spiel, 1, 1);
    gehen(spiel, ninkasi, [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }]);
    const bakterium = jaeger(spiel, 2, 1, ki);
    return { spiel, ninkasi, bakterium };
  };
  const frisch = aufstellen();
  assert.deepEqual(duftfeld(frisch.spiel, frisch.bakterium), { x: 3, y: 1 });
  // zwei Züge Haltbarkeit: der Duft auf 3,1 ist drei Züge alt
  const alt = aufstellen({ regeln: { duft: { haltbarkeitZuege: 2 } } });
  assert.equal(duftFrisch(alt.spiel, duftAuf(alt.spiel, 3, 1)), true, "von Ninkasis heutigem Zug aus gelegt");
  alt.spiel.zustand.duftZaehler += 9;
  assert.equal(duftfeld(alt.spiel, alt.bakterium), null);
  // Spurweite 0: der Jäger verliert sie sofort und wird an seiner letzten bekannten Position wach
  const fern = aufstellen({ regeln: { wahrnehmung: { spurFaktor: 0 } } });
  fern.bakterium.ki.letzteBekanntePosition = { x: 2, y: 1 };
  assert.deepEqual(holen("ki", "jagen")(fern.spiel, fern.bakterium, fern.bakterium.ki), { art: "warten" });
  assert.equal(fern.bakterium.ki.wachzustand, "wach");
  const abgeschaltet = aufstellen({ ki: { duftFolgen: false, letzteBekanntePosition: { x: 2, y: 1 } } });
  assert.deepEqual(holen("ki", "jagen")(abgeschaltet.spiel, abgeschaltet.bakterium, abgeschaltet.bakterium.ki), { art: "warten" });
});
