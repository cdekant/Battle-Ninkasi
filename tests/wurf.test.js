// Würfe über eine tauschbare Quelle (siehe docs/Architektur.md, Zufall und Wiederholbarkeit): gleiche Zahlenfolge im
// echten Spiel, fremder Zufall und Grenzen für Simulationen, und ein Schutz davor, dass Systeme wieder direkt würfeln

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { zufallErzeugen, zufallsGanzzahl, mitProzentChance, mitAnteil, wuerfeln } from "../src/kern/zufall.js";
import { wurfGanzzahl, wurfWuerfel, wurfProzent, wurfAnteil, wurfAuswahl, mitWurfquelle } from "../src/kern/wurf.js";
import { nahkampf } from "../src/systeme/kampf.js";
import { miniSpiel, wesen } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";

const hauptverzeichnis = join(dirname(fileURLToPath(import.meta.url)), "..");

// Dateien, die den Zufallszustand des Spiels anfassen dürfen: der Generator, die Schnittstelle, das Anlegen und das Feld
const ZUFALLSZUSTAND_ERLAUBT = ["src/kern/zufall.js", "src/kern/wurf.js", "src/kern/spiel.js", "src/kern/zustand.js"];

function dateienUnter(ordner) {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    return statSync(pfad).isDirectory() ? dateienUnter(pfad) : pfad.endsWith(".js") ? [pfad] : [];
  });
}

const leeresSpiel = () => miniSpiel(["....."], { startwert: 5 });

test("im echten Spiel dieselben Zahlen und derselbe Zustand wie mit kern/zufall.js", () => {
  const spiel = leeresSpiel();
  const vergleich = zufallErzeugen(5);
  const liste = ["a", "b", "c", "d"];
  for (let i = 0; i < 50; i++) {
    assert.equal(wurfGanzzahl(spiel, "test", 1, 20), zufallsGanzzahl(vergleich, 1, 20));
    assert.equal(wurfWuerfel(spiel, "test", "2W6+1"), wuerfeln(vergleich, "2W6+1"));
    assert.equal(wurfProzent(spiel, "test", 40), mitProzentChance(vergleich, 40));
    assert.equal(wurfAnteil(spiel, "test", 2, 7), mitAnteil(vergleich, 2, 7));
    assert.equal(wurfAuswahl(spiel, "test", liste), liste[zufallsGanzzahl(vergleich, 0, liste.length - 1)]);
  }
  assert.deepEqual(spiel.zustand.zufallszustand, vergleich);
});

test("fremder Zufall lässt den Spiel-Zufall unberührt", () => {
  const spiel = leeresSpiel();
  const vorher = [...spiel.zustand.zufallszustand];
  const fremd = zufallErzeugen(99);
  const vergleich = zufallErzeugen(99);
  mitWurfquelle(spiel, { art: "fremd", zufallszustand: fremd }, () => {
    for (let i = 0; i < 20; i++) {
      assert.equal(wurfWuerfel(spiel, "schaden", "1W8"), wuerfeln(vergleich, "1W8"));
      assert.equal(wurfAnteil(spiel, "treffer", 1, 3), mitAnteil(vergleich, 1, 3));
    }
  });
  assert.deepEqual(spiel.zustand.zufallszustand, vorher);
  assert.deepEqual(fremd, vergleich);
});

test("Grenzen: Mengen am kleinsten oder größten Wurf, festgelegte Chancen würfeln nicht", () => {
  const spiel = leeresSpiel();
  const vorher = [...spiel.zustand.zufallszustand];
  const fremd = zufallErzeugen(3);
  const fremdVorher = [...fremd];
  const chancen = { treffer: true, blocken: false };
  mitWurfquelle(spiel, { art: "grenzen", mengen: "kleinste", chancen, zufallszustand: fremd }, () => {
    assert.equal(wurfWuerfel(spiel, "schaden", "2W6+3"), 5);
    assert.equal(wurfWuerfel(spiel, "schaden", "1W4-1"), 0);
    assert.equal(wurfWuerfel(spiel, "schaden", 7), 7);
    assert.equal(wurfGanzzahl(spiel, "risiko", 1, 100), 1);
    assert.equal(wurfAnteil(spiel, "treffer", 0, 5), true, "festgelegt gilt auch gegen eine Chance von 0");
    assert.equal(wurfProzent(spiel, "blocken", 100), false);
  });
  assert.deepEqual(fremd, fremdVorher, "nichts gewürfelt");
  mitWurfquelle(spiel, { art: "grenzen", mengen: "groesste", zufallszustand: fremd }, () => {
    assert.equal(wurfWuerfel(spiel, "schaden", "2W6+3"), 15);
    assert.equal(wurfGanzzahl(spiel, "risiko", 1, 100), 100);
  });
  assert.deepEqual(fremd, fremdVorher, "Mengen würfeln in den Grenzen nicht");
  const vergleich = zufallErzeugen(3);
  mitWurfquelle(spiel, { art: "grenzen", mengen: "groesste", chancen, zufallszustand: fremd }, () => {
    assert.equal(wurfAnteil(spiel, "kritisch", 1, 2), mitAnteil(vergleich, 1, 2), "ohne Festlegung aus dem fremden Zufall");
    assert.equal(wurfAuswahl(spiel, "kette_wohin", ["a", "b", "c"]), ["a", "b", "c"][zufallsGanzzahl(vergleich, 0, 2)]);
  });
  assert.deepEqual(fremd, vergleich);
  assert.deepEqual(spiel.zustand.zufallszustand, vorher);
});

test("Baustein zufall: wirkt effekt mit der Chance, sonst sonst; die Ablage bleibt geteilt", () => {
  const effekte = {
    vielleicht: { schritte: [{ baustein: "zufall", chance: 30, effekt: "treffen", sonst: "heilen" }, { baustein: "schaden", menge: { aus: "summeSchaden" } }] },
    ohneSonst: { schritte: [{ baustein: "zufall", chance: 30, effekt: "treffen" }] },
    treffen: { schritte: [{ baustein: "schaden", menge: 2 }] },
    heilen: { schritte: [{ baustein: "heilen", menge: 1 }] },
  };
  const spiel = miniSpiel(["....."], { effekte, startwert: 5 });
  const ziel = wesen(spiel, 1, 0, "feinde", 20);
  ziel.werte.lp.aktuell = 10;
  const wirken = (name, chance) => mitWurfquelle(spiel, { art: "grenzen", mengen: "kleinste", chancen: { zufall: chance }, zufallszustand: zufallErzeugen(1) }, () => effektAnwenden(spiel, name, { zielId: ziel.id }));
  wirken("vielleicht", true);
  assert.equal(ziel.werte.lp.aktuell, 6, "getroffen mit 2, der zweite Schritt liest summeSchaden aus der geteilten Ablage");
  wirken("vielleicht", false);
  assert.equal(ziel.werte.lp.aktuell, 7, "sonst geheilt");
  wirken("ohneSonst", false);
  assert.equal(ziel.werte.lp.aktuell, 7, "ohne sonst geschieht nichts");
});

test("mitWurfquelle stellt die vorige Quelle auch nach einem Fehler wieder her", () => {
  const spiel = leeresSpiel();
  assert.throws(() => mitWurfquelle(spiel, { art: "fremd", zufallszustand: zufallErzeugen(1) }, () => { throw new Error("abbruch"); }), /abbruch/);
  assert.equal(spiel.wurfquelle, undefined);
  assert.equal(mitWurfquelle(spiel, { art: "zufall" }, () => 42), 42);
});

test("Fehler: Wurf ohne Namen, unbekannte Quelle, Quelle ohne Zufall, unbekannte Mengen", () => {
  const spiel = leeresSpiel();
  assert.throws(() => wurfProzent(spiel, "", 50), /ohne Namen/);
  assert.throws(() => wurfAnteil(spiel, undefined, 1, 2), /ohne Namen/);
  spiel.wurfquelle = { art: "hellsicht" };
  assert.throws(() => wurfGanzzahl(spiel, "test", 1, 6), /Unbekannte Wurfquelle/);
  spiel.wurfquelle = { art: "fremd" };
  assert.throws(() => wurfGanzzahl(spiel, "test", 1, 6), /ohne zufallszustand/);
  spiel.wurfquelle = { art: "grenzen", mengen: "mittlere", zufallszustand: zufallErzeugen(1) };
  assert.throws(() => wurfGanzzahl(spiel, "test", 1, 6), /unbekannten mengen/);
});

test("Nahkampf in den Grenzen: Treffer, Blocken und Krit nach Namen, Schaden am größten Wurf", () => {
  const spiel = miniSpiel(["#####", "#...#", "#####"], { effekte: { wucht: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W6+2" }] } } });
  const quelle = wesen(spiel, 1, 1, "ninkasi", 100, { angriffe: [{ name: "wucht", genauigkeit: 1, effekt: "wucht" }] });
  const ziel = wesen(spiel, 2, 1, "feinde", 100, { kampfwerte: { blocken: 1_000_000 } });
  const vorher = [...spiel.zustand.zufallszustand];
  const quelleDerWuerfe = (chancen) => ({ art: "grenzen", mengen: "groesste", chancen, zufallszustand: zufallErzeugen(1) });
  mitWurfquelle(spiel, quelleDerWuerfe({ treffer: true, blocken: false, kritisch: false }), () => nahkampf(spiel, quelle, ziel));
  assert.equal(ziel.werte.lp.aktuell, 92, "1W6+2 am größten Wurf");
  mitWurfquelle(spiel, quelleDerWuerfe({ treffer: true, blocken: false, kritisch: true }), () => nahkampf(spiel, quelle, ziel));
  assert.equal(ziel.werte.lp.aktuell, 80, "8 x1,5");
  mitWurfquelle(spiel, quelleDerWuerfe({ treffer: true, blocken: true }), () => nahkampf(spiel, quelle, ziel));
  assert.equal(ziel.werte.lp.aktuell, 80, "geblockt");
  assert.deepEqual(spiel.zustand.zufallszustand, vorher, "der Spiel-Zufall bleibt unberührt");
});

test("nur Generator, Schnittstelle und Anlegen fassen den Zufallszustand des Spiels an", () => {
  for (const pfad of dateienUnter(join(hauptverzeichnis, "src"))) {
    const datei = relative(hauptverzeichnis, pfad).replaceAll("\\", "/");
    if (ZUFALLSZUSTAND_ERLAUBT.includes(datei)) continue;
    assert.doesNotMatch(readFileSync(pfad, "utf8"), /zufallszustand/, `${datei} würfelt am Spiel-Zufall vorbei, statt kern/wurf.js zu nutzen`);
  }
});
