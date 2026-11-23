// Sinne (siehe docs/Wesen.md, Wahrnehmung): Arten der Wahrnehmung, Spüren ohne Licht entlang offener Felder,
// Bemerken und Jagen nach Gespürtem, Gefahr und Untersuchen für Ninkasi.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, rohdatenMitTesteintraegen } from "./hilfen.js";
import { vorbereiten } from "../src/kern/daten.js";
import { alle, holen } from "../src/kern/register.js";
import { feldIndex } from "../src/welt/karte.js";
import { wahrnehmungsart, nimmtWahr, spuert, reichweiteSpueren, wesenMitWahrnehmungsart, WAHRNEHMUNGSARTEN } from "../src/systeme/sinne.js";
import { wahrnehmen } from "../src/systeme/wahrnehmung.js";
import { wahrgenommeneFeinde } from "../src/systeme/gefahr.js";
import { feldBeschreiben } from "../src/systeme/untersuchen.js";

const RAUM = [
  "###########",
  "#.........#",
  "#.........#",
  "###########",
];

// Zwei Kammern, getrennt durch eine Wand mit einem Feld in der Mitte (Kennung frei wählbar)
const kammern = (mitte) => [
  "#######",
  `#..${mitte}..#`,
  "#######",
];

const GELAENDE = {
  wasser: { text: "gelaende.wasser", kennung: "~", passierbar: false, passierbarFuer: ["fliegend"], durchsichtig: true },
};

// Ein jagendes Bakterium mit Sicht und Spüren
const spuerer = (spiel, x, y, zusatz = {}) =>
  wesen(spiel, x, y, "verderber", 20, { ki: { modul: "jagen", letzteBekanntePosition: null }, sicht: { reichweite: 8 }, spueren: { reichweite: 3 }, ...zusatz });

function finster(karte = RAUM) {
  const spiel = miniSpiel(karte, { gelaende: GELAENDE });
  spiel.zustand.ebene.licht = { grundhelligkeit: 0 };
  return spiel;
}

test("Sinne: sehen vor spüren, in der Reihenfolge der Anmeldung", () => {
  assert.deepEqual(alle("sinne").map(([name, sinn]) => [name, sinn.art]), [["sehen", "gesehen"], ["spueren", "gespuert"]]);
  assert.deepEqual(WAHRNEHMUNGSARTEN, ["gesehen", "gespuert"]);
});

test("Spüren ohne Licht: im Finstern gespürt bis zur Reichweite, im Hellen gesehen", () => {
  const spiel = finster();
  const ninkasi = spielerinSetzen(spiel, 4, 1);
  const bakterium = spuerer(spiel, 1, 1);
  assert.equal(wahrnehmungsart(spiel, bakterium, ninkasi), "gespuert", "drei Felder im Finstern: nicht gesehen, aber gespürt");
  ninkasi.position.x = 5;
  assert.equal(wahrnehmungsart(spiel, bakterium, ninkasi), null, "jenseits der Reichweite");
  spiel.zustand.ebene.licht = { grundhelligkeit: 100 };
  assert.equal(wahrnehmungsart(spiel, bakterium, ninkasi), "gesehen");
  const ohneSpueren = spuerer(spiel, 1, 2, { spueren: undefined });
  assert.equal(reichweiteSpueren(spiel, ohneSpueren), 0);
  assert.equal(spuert(spiel, ohneSpueren, ninkasi), false);
});

test("Spüren entlang offener Felder: Wand und geschlossene Tür halten es auf, offene Tür und Wasser nicht", () => {
  const ergebnis = (mitte) => {
    const spiel = finster(kammern(mitte));
    const ninkasi = spielerinSetzen(spiel, 5, 1);
    const bakterium = spuerer(spiel, 1, 1, { spueren: { reichweite: 4 } });
    return spuert(spiel, bakterium, ninkasi);
  };
  assert.equal(ergebnis("#"), false, "Wand");
  assert.equal(ergebnis("+"), false, "geschlossene Tür");
  assert.equal(ergebnis("'"), true, "offene Tür");
  assert.equal(ergebnis("~"), true, "Wasser ist offen, auch wenn man es nicht betreten kann");
  // durch die Wand nur auf dem Umweg, der hier zu lang ist
  const spiel = finster(["#######", "#..#..#", "#.....#", "#######"]);
  const ninkasi = spielerinSetzen(spiel, 4, 1);
  const bakterium = spuerer(spiel, 2, 1, { spueren: { reichweite: 2 } });
  assert.equal(spuert(spiel, bakterium, ninkasi), true, "zwei Schritte über das Feld unter der Wand");
  bakterium.spueren.reichweite = 1;
  assert.equal(spuert(spiel, bakterium, ninkasi), false);
});

test("Spüren über Modifikatoren: reichweiteSpueren auch ohne eigene Komponente", () => {
  const spiel = finster();
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const bakterium = spuerer(spiel, 4, 1);
  assert.equal(nimmtWahr(spiel, ninkasi, bakterium), false, "Ninkasi sieht ohne Sichtfeld nichts und spürt nicht");
  ninkasi.modifikatoren = [{ ziel: "reichweiteSpueren", art: "plus", betrag: 3 }];
  assert.equal(reichweiteSpueren(spiel, ninkasi), 3);
  assert.equal(wahrnehmungsart(spiel, ninkasi, bakterium), "gespuert");
  assert.deepEqual(wesenMitWahrnehmungsart(spiel, ninkasi, "gespuert").map((entitaet) => entitaet.id), [bakterium.id]);
});

test("Bemerken durch Spüren: ein schlafendes Wesen bemerkt Ninkasi im Finstern", () => {
  const spiel = miniSpiel(RAUM, { regeln: { wahrnehmung: { bemerkenChance: 100 } } });
  spiel.zustand.ebene.licht = { grundhelligkeit: 0 };
  spielerinSetzen(spiel, 3, 1);
  const bakterium = spuerer(spiel, 1, 1, { ki: { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null } });
  const blind = spuerer(spiel, 1, 2, { ki: { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null }, spueren: undefined });
  wahrnehmen(spiel, bakterium);
  wahrnehmen(spiel, blind);
  assert.equal(bakterium.ki.wachzustand, "jagt");
  assert.equal(blind.ki.wachzustand, "schlaeft", "ohne Spüren sieht es im Finstern nur ein Feld weit");
});

test("Jagen nach Gespürtem: das Wesen setzt der Beute im Finstern nach", () => {
  const spiel = finster();
  spielerinSetzen(spiel, 4, 1);
  const bakterium = spuerer(spiel, 1, 1);
  const befehl = holen("ki", "jagen")(spiel, bakterium, bakterium.ki);
  assert.deepEqual(befehl, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(bakterium.ki.letzteBekanntePosition, { x: 4, y: 1 });
});

test("Gefahr und Untersuchen: gespürte Feinde zählen, auf unbekanntem Feld ohne Gelände und ohne Art", () => {
  const spiel = finster();
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.modifikatoren = [{ ziel: "reichweiteSpueren", art: "plus", betrag: 3 }];
  const bakterium = spuerer(spiel, 4, 1);
  assert.deepEqual(wahrgenommeneFeinde(spiel), [bakterium.id]);
  const ebene = spiel.zustand.ebene;
  ebene.erinnerung[feldIndex(ebene, 4, 1)] = null;
  const beschreibung = feldBeschreiben(spiel, { x: 4, y: 1 });
  assert.equal(beschreibung.gespuert, 1);
  assert.equal(beschreibung.gelaende, null);
  assert.deepEqual(beschreibung.wesen, [], "die Art bleibt verborgen");
  assert.equal(feldBeschreiben(spiel, { x: 5, y: 1 }).gespuert, 0);
  ebene.erinnerung[feldIndex(ebene, 6, 1)] = null;
  assert.equal(feldBeschreiben(spiel, { x: 6, y: 1 }), null, "unbekannt und nichts gespürt");
});

test("Datenprüfung: spueren, ki.duftFolgen und regeln.duft", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(pruefen(() => {}), []);
  const erwartet = [
    [(daten) => { daten.wesen.testwesen.spueren = { reichweite: -1 }; }, "wesen.testwesen: spueren muss"],
    [(daten) => { daten.wesen.testwesen.ki = { modul: "jagen", duftFolgen: "ja" }; }, "duftFolgen"],
    [(daten) => { delete daten.regeln.duft; }, "regeln.duft fehlt"],
    [(daten) => { daten.regeln.duft = { ...daten.regeln.duft, jeZug: 0 }; }, "regeln.duft.jeZug muss"],
  ];
  for (const [aendern, anfang] of erwartet) {
    const fehler = pruefen(aendern);
    assert.ok(fehler.some((meldung) => meldung.includes(anfang)), `${anfang}: ${fehler.join("; ")}`);
  }
});
