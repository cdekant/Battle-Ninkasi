// Komponenten ohne Zahl (siehe docs/Architektur.md, Entitäten und Komponenten): die Lesefunktionen mit Überlagerung
// durch Zustände und ein Schutz davor, dass Systeme sie wieder direkt an der Entität lesen

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { plaetzeVon, tuerenVon, sichtVon, eigeneAngriffeVon, aussehenVon, bewegungVon } from "../src/kern/zustand.js";
import { angriffeVon } from "../src/systeme/kampf.js";
import { oeffnetTueren } from "../src/welt/karte.js";
import { miniSpiel, wesen } from "./hilfen.js";

const hauptverzeichnis = join(dirname(fileURLToPath(import.meta.url)), "..");

// Ein Zustand, wie ihn eine Gestalt später tragen könnte; die Daten erlauben die Felder an Zuständen noch nicht
const gestalt = (nummer, felder) => ({ nummer, name: `gestalt_${nummer}`, ...felder });

test("ohne Zustand gilt die eigene Komponente, sonst die Vorgabe", () => {
  const eigenes = { typ: "hefe", plaetze: { hand: 2 }, tueren: "nicht", sicht: { reichweite: 5 }, angriffe: [{ name: "biss" }] };
  assert.deepEqual(plaetzeVon(eigenes), { hand: 2 });
  assert.equal(tuerenVon(eigenes), "nicht");
  assert.deepEqual(sichtVon(eigenes), { reichweite: 5 });
  assert.deepEqual(eigeneAngriffeVon(eigenes), [{ name: "biss" }]);
  assert.equal(aussehenVon(eigenes), "hefe");
  const leer = { typ: "stein" };
  assert.deepEqual(plaetzeVon(leer), {});
  assert.equal(tuerenVon(leer), "oeffnen");
  assert.equal(sichtVon(leer), null);
  assert.deepEqual(eigeneAngriffeVon(leer), []);
  assert.equal(aussehenVon(leer), "stein");
});

test("der jüngste Zustand mit dem Feld überlagert die eigene Komponente", () => {
  const entitaet = {
    typ: "ninkasi", plaetze: { hand: 2 }, tueren: "oeffnen", sicht: { reichweite: 8 }, angriffe: [{ name: "faust" }],
    zustaende: [
      gestalt(1, { plaetze: { kopf: 1 }, tueren: "nicht", sicht: { reichweite: 3 }, angriffe: [{ name: "klaue" }], aussehen: "drache" }),
      gestalt(2, { aussehen: "statue", plaetze: { finger: 2 } }),
      gestalt(3, {}),
    ],
  };
  assert.deepEqual(plaetzeVon(entitaet), { finger: 2 });
  assert.equal(aussehenVon(entitaet), "statue");
  assert.equal(tuerenVon(entitaet), "nicht");
  assert.equal(oeffnetTueren(entitaet), false);
  assert.deepEqual(sichtVon(entitaet), { reichweite: 3 });
  assert.deepEqual(eigeneAngriffeVon(entitaet), [{ name: "klaue" }]);
  assert.equal(bewegungVon(entitaet), "laufend");
});

test("angriffeVon nimmt ohne Waffe die eigenen Profile über die Lesefunktion", () => {
  const spiel = miniSpiel(["..."]);
  const gegner = wesen(spiel, 1, 0);
  assert.deepEqual(angriffeVon(spiel, gegner), []);
  gegner.angriffe = [{ name: "biss" }];
  assert.deepEqual(angriffeVon(spiel, gegner), [{ name: "biss" }]);
  gegner.zustaende = [gestalt(1, { angriffe: [{ name: "klaue" }] })];
  assert.deepEqual(angriffeVon(spiel, gegner), [{ name: "klaue" }]);
});

// Direkte Zugriffe auf Komponenten ohne Zahl; erlaubt sind nur die Stellen unten, die keine Entität lesen
const ZUGRIFF = /(?:\.|\?\.)(plaetze|tueren|sicht|angriffe|bewegung|aussehen)\b/g;
const ERLAUBT = [
  /^src\/kern\/daten\.js$/, // Datenprüfung liest die Datensätze, nicht Entitäten
];
const ERLAUBTE_ZUGRIFFE = [
  /ausruestung\.angriffe\b/, // Profile an Gegenständen
  /regeln\??\.(bewegung|ausruestung\??\.plaetze)\b/, // Regelwerte
  /daten\.wesen\[[^\]]+\]\.bewegung\b/, // Vorlage vor dem Erzeugen (Beschwörung)
  /(definition|instanz)\.bewegung\b/, // ein Zustand bekommt seine Überlagerung (systeme/zustaende.js)
  /(kontext|titel)\.plaetze\b/, // Speicherplätze des Titelbildschirms
];

function dateienUnter(ordner) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) return dateienUnter(pfad);
    return eintrag.name.endsWith(".js") ? [pfad] : [];
  });
}

test("Systeme lesen Komponenten ohne Zahl nur über Lesefunktionen", () => {
  const verstoesse = [];
  for (const pfad of dateienUnter(join(hauptverzeichnis, "src"))) {
    const datei = relative(hauptverzeichnis, pfad).replaceAll("\\", "/");
    if (ERLAUBT.some((muster) => muster.test(datei))) continue;
    readFileSync(pfad, "utf8").split("\n").forEach((zeile, nummer) => {
      const ohneKommentar = zeile.replace(/\/\/.*$/, "");
      for (const treffer of ohneKommentar.matchAll(ZUGRIFF)) {
        const umgebung = ohneKommentar.slice(Math.max(0, treffer.index - 40), treffer.index + treffer[0].length);
        if (!ERLAUBTE_ZUGRIFFE.some((muster) => muster.test(umgebung))) verstoesse.push(`${datei}:${nummer + 1}: ${zeile.trim()}`);
      }
    });
  }
  assert.deepEqual(verstoesse, [], "direkter Zugriff statt plaetzeVon, tuerenVon, sichtVon, eigeneAngriffeVon, aussehenVon oder bewegungVon");
});
