// Zusammenführen der Inhalte (src/kern/zusammenfuegen.js), Grundgerüst und Probeinhalt (src/inhalt.js),
// siehe docs/Architektur.md, Inhalte als Daten
import { test } from "node:test";
import assert from "node:assert/strict";
import { datenZusammenfuegen, namenDesZusatzes } from "../src/kern/zusammenfuegen.js";
import { rohdaten, texteDe, probenamen, probentexte } from "../src/inhalt.js";
import grundgeruest from "../daten/index.js";
import probeinhalt from "../datenproben/index.js";
import texteGrund from "../sprache/de/texte.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { lueckenFinden } from "../werkzeuge/luecken.js";

const grundstock = {
  wesen: { held: { text: "a", werte: { lp: 3 } } },
  effekte: {},
  schichten: { oberflaechen: { pfuetze: { text: "p" } }, gase: {} },
  zeichen: { wesen: { held: { zeichen: "@" } } },
  abfolge: ["oben"],
  starttiefe: 0,
};

test("Zusammenführen: neue Einträge kommen dazu, auch eine Ebene tiefer in schichten und zeichen", () => {
  const ergebnis = datenZusammenfuegen(grundstock, {
    eintraege: { wesen: { ork: { text: "o" } }, schichten: { gase: { dampf: { text: "d" } } }, zeichen: { wesen: { ork: { zeichen: "o" } } } },
  });
  assert.deepEqual(Object.keys(ergebnis.wesen), ["held", "ork"]);
  assert.deepEqual(Object.keys(ergebnis.schichten.oberflaechen), ["pfuetze"]);
  assert.deepEqual(Object.keys(ergebnis.schichten.gase), ["dampf"]);
  assert.deepEqual(Object.keys(ergebnis.zeichen.wesen), ["held", "ork"]);
  assert.deepEqual(Object.keys(grundstock.wesen), ["held"], "der Grundstock bleibt unverändert");
});

test("Zusammenführen: ein Name, den der Grundstock schon hat, ist ein Fehler, auch verschachtelt", () => {
  assert.throws(() => datenZusammenfuegen(grundstock, { eintraege: { wesen: { held: {} } } }), /wesen\.held gibt es schon/);
  assert.throws(() => datenZusammenfuegen(grundstock, { eintraege: { schichten: { oberflaechen: { pfuetze: {} } } } }), /schichten\.oberflaechen\.pfuetze gibt es schon/);
});

test("Zusammenführen: ergaenzen setzt Felder an vorhandenen Einträgen, abfolge und starttiefe werden ersetzt", () => {
  const ergebnis = datenZusammenfuegen(grundstock, { ergaenzen: { wesen: { held: { faehigkeiten: ["blinzeln"] } } }, abfolge: ["oben", "unten"], starttiefe: 1 });
  assert.deepEqual(ergebnis.wesen.held, { text: "a", werte: { lp: 3 }, faehigkeiten: ["blinzeln"] });
  assert.deepEqual(ergebnis.abfolge, ["oben", "unten"]);
  assert.equal(ergebnis.starttiefe, 1);
  assert.throws(() => datenZusammenfuegen(grundstock, { ergaenzen: { wesen: { niemand: {} } } }), /kein Eintrag des Grundstocks/);
});

test("Zusammenführen: unbekannte Sammlungen und Teile sind Fehler", () => {
  assert.throws(() => datenZusammenfuegen(grundstock, { eintraege: { zauber: {} } }), /keine Sammlung des Grundstocks/);
  assert.throws(() => datenZusammenfuegen(grundstock, { regeln: {} }), /unbekannter Teil/);
});

test("Zusammenführen: namenDesZusatzes nennt die Namen je Sammlung", () => {
  assert.deepEqual(namenDesZusatzes({ eintraege: { wesen: { ork: {} }, schichten: { gase: { dampf: {} } } } }), { wesen: ["ork"], "schichten.gase": ["dampf"] });
});

test("Grundgerüst: lädt allein ohne Fehler, ein Lauf beginnt im Hub", () => {
  const daten = datenLaden(grundgeruest, { texte: texteGrund });
  const spiel = neuesSpiel(daten, 7);
  assert.equal(spiel.zustand.tiefe, 0);
  assert.equal(Object.keys(daten.wesen).join(), "ninkasi");
});

test("Inhalt: Grundgerüst und Probeinhalt zusammen, Ninkasi mit der Fähigkeit des Probeinhalts", () => {
  assert.deepEqual(rohdaten.abfolge, probeinhalt.abfolge);
  assert.deepEqual(rohdaten.wesen.ninkasi.faehigkeiten, ["testfaehigkeit"]);
  assert.deepEqual(grundgeruest.wesen.ninkasi.faehigkeiten, [], "das Grundgerüst bleibt ohne Probe");
  assert.ok(probenamen.wesen.includes("essigbakterium"));
  assert.ok(probentexte.includes("wesen.essigbakterium") && "wesen.essigbakterium" in texteDe);
  assert.ok(!("wesen.essigbakterium" in texteGrund));
});

test("Lücken: an echtem Inhalt Fehler, am Probeinhalt und ohne Angabe der Proben Warnung", () => {
  const daten = structuredClone(rohdaten);
  daten.effekte.echt_unbenutzt = { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] };
  daten.effekte.probe_unbenutzt = { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] };
  const namen = { ...probenamen, effekte: [...probenamen.effekte, "probe_unbenutzt"] };
  const stufe = (luecken, ort) => luecken.find((luecke) => luecke.ort === ort)?.stufe;
  const streng = lueckenFinden({ rohdaten: daten, probenamen: namen, probentexte });
  assert.equal(stufe(streng, "effekte.echt_unbenutzt"), "fehler");
  assert.equal(stufe(streng, "effekte.probe_unbenutzt"), "warnung");
  assert.equal(stufe(lueckenFinden({ rohdaten: daten }), "effekte.echt_unbenutzt"), "warnung");
});
