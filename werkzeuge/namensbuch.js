// Namensbuch (siehe docs/Entwicklung.md, Bot und Werkzeuge; Regel in docs/Architektur.md, Inhalte als Daten): führt
// daten/namensbuch.js nach und prüft es zusammen mit daten/umbenennungen.js (tests/namensbuch.test.js).
// Aufruf: node werkzeuge/namensbuch.js
//   nimmt neue Namen als vorläufig auf und streicht vorläufige, die es nicht mehr gibt; feste Namen bleiben immer
//   stehen, fest wird ein Name von Hand. Danach gibt es die verbliebenen Fehler aus (Rückgabewert 1, wenn es welche gibt).

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import rohdaten from "../daten/index.js";
import namensbuch from "../daten/namensbuch.js";
import umbenennungen from "../daten/umbenennungen.js";

// Arten mit Namen, die über einen Lauf hinaus Bestand haben sollen (Chronik, Vorwissen, Bestiarium)
export const NAMENSBUCH_ARTEN = ["wesen", "gegenstaende", "eigenschaften", "skills", "faehigkeiten", "zustaende", "fallen", "zielgebiete", "kulturen"];

// Namen einer Art in den Daten, ohne abstrakte Vorlagen, in der Reihenfolge der Daten
export function namenDerDaten(daten, art) {
  return Object.entries(daten[art] ?? {}).filter(([, eintrag]) => !eintrag?.abstrakt).map(([name]) => name);
}

// Alle Widersprüche zwischen Daten, Namensbuch und Umbenennungen als Liste von Texten
export function namensbuchFehler(buch, daten, tabelle) {
  const fehler = [];
  for (const art of Object.keys(tabelle)) {
    if (!NAMENSBUCH_ARTEN.includes(art)) fehler.push(`umbenennungen.${art}: keine Art des Namensbuchs`);
  }
  for (const art of NAMENSBUCH_ARTEN) {
    const vorhanden = new Set(namenDerDaten(daten, art));
    const { fest = [], vorlaeufig = [] } = buch[art] ?? {};
    const umbenannt = tabelle[art] ?? {};
    const festeMenge = new Set(fest);
    for (const name of vorhanden) {
      if (!festeMenge.has(name) && !vorlaeufig.includes(name)) fehler.push(`${art}.${name}: nicht im Namensbuch (node werkzeuge/namensbuch.js)`);
    }
    for (const name of vorlaeufig) {
      if (festeMenge.has(name)) fehler.push(`${art}.${name}: fest und vorläufig zugleich`);
      else if (!vorhanden.has(name)) fehler.push(`${art}.${name}: vorläufig, gibt es nicht mehr (node werkzeuge/namensbuch.js)`);
    }
    for (const name of fest) {
      if (!vorhanden.has(name) && !Object.hasOwn(umbenannt, name)) fehler.push(`${art}.${name}: fest, fehlt in den Daten ohne Eintrag in daten/umbenennungen.js`);
    }
    for (const [alt, neu] of Object.entries(umbenannt)) {
      if (vorhanden.has(alt)) fehler.push(`umbenennungen.${art}.${alt}: der alte Name steht noch in den Daten`);
      if (neu === null) continue;
      if (typeof neu !== "string") { fehler.push(`umbenennungen.${art}.${alt}: neuer Name muss ein Text oder null sein`); continue; }
      let ziel = neu;
      const besucht = new Set([alt]);
      while (typeof umbenannt[ziel] === "string" && !besucht.has(ziel)) { besucht.add(ziel); ziel = umbenannt[ziel]; }
      if (besucht.has(ziel)) fehler.push(`umbenennungen.${art}.${alt}: Umbenennungen im Kreis`);
      else if (umbenannt[ziel] !== null && !vorhanden.has(ziel)) fehler.push(`umbenennungen.${art}.${alt}: "${ziel}" gibt es nicht in den Daten`);
    }
  }
  return fehler;
}

// Nachgeführtes Namensbuch: feste Namen bleiben, vorläufig sind alle übrigen Namen der Daten
export function namensbuchNachgefuehrt(buch, daten) {
  const neu = {};
  for (const art of NAMENSBUCH_ARTEN) {
    const fest = [...(buch[art]?.fest ?? [])];
    neu[art] = { fest, vorlaeufig: namenDerDaten(daten, art).filter((name) => !fest.includes(name)) };
  }
  return neu;
}

const liste = (namen) => `[${namen.map((name) => JSON.stringify(name)).join(", ")}]`;

// Text der Datei daten/namensbuch.js
export function namensbuchText(buch) {
  const arten = NAMENSBUCH_ARTEN.map((art) => `  ${art}: {\n    fest: ${liste(buch[art].fest)},\n    vorlaeufig: ${liste(buch[art].vorlaeufig)},\n  },`);
  return `// Namensbuch (siehe docs/Architektur.md, Inhalte als Daten): alle Namen je Art, fest oder vorläufig.
// Feste Namen ändern sich nur mit einem Eintrag in daten/umbenennungen.js, vorläufige (Testinhalte) frei.
// Nachgeführt von node werkzeuge/namensbuch.js; fest wird ein Name von Hand, indem er von vorlaeufig nach fest wandert.
// Kein Teil der Spieldaten (nicht in daten/index.js), ändert also die Prüfsumme der Daten nicht.

export default {
${arten.join("\n")}
};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const nachgefuehrt = namensbuchNachgefuehrt(namensbuch, rohdaten);
  writeFileSync(new URL("../daten/namensbuch.js", import.meta.url), namensbuchText(nachgefuehrt));
  const fehler = namensbuchFehler(nachgefuehrt, rohdaten, umbenennungen);
  console.log(fehler.length ? fehler.join("\n") : "Namensbuch nachgeführt, keine Fehler");
  process.exitCode = fehler.length ? 1 : 0;
}
