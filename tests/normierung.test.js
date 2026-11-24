// Normierung (siehe docs/Wesen.md, Normierung): die Normwesen treffen ihre Stärke aus regeln.normierung, die
// Probegegner sind eingeordnet, die Datenprüfung kennt die Zielwerte; Rechnung in werkzeuge/normierung.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { datenLaden } from "../src/kern/spiel.js";
import { vorbereiten } from "../src/kern/daten.js";
import { normwerte, abweichungenVon, mittlererSchaden } from "../werkzeuge/normierung.js";
import { rohdatenMitTesteintraegen } from "./hilfen.js";

const DATEN = datenLaden(rohdaten, texte);

test("Mittlerer Schaden: Würfel, feste Menge und hinter einem Trefferwurf", () => {
  const daten = {
    effekte: {
      wuerfel: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6+1" }] },
      fest: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] },
      gezielt: { schritte: [{ baustein: "trefferwurf", genauigkeit: 50, effekt: "wuerfel" }] },
      nichts: { schritte: [{ baustein: "heilen", menge: 3 }] },
    },
  };
  assert.deepEqual(["wuerfel", "fest", "gezielt", "nichts"].map((name) => mittlererSchaden(daten, name)), [8, 3, 8, 0]);
});

test("Normwesen: jede Stärke trifft ihre Zielwerte innerhalb der Toleranz", () => {
  const { staerken } = DATEN.regeln.normierung;
  const typen = staerken.map((stufe, stelle) => `normwesen_${stelle + 1}`);
  const zeilen = normwerte(DATEN, typen);
  assert.equal(zeilen.length, staerken.length);
  zeilen.forEach((zeile, stelle) => {
    assert.equal(zeile.staerke, stelle + 1, zeile.typ);
    assert.deepEqual(abweichungenVon(DATEN, zeile, stelle + 1), [], zeile.typ);
  });
  for (let stelle = 1; stelle < zeilen.length; stelle++) assert.ok(zeilen[stelle].wesen.zeit < zeilen[stelle - 1].wesen.zeit, "jede Stärke tötet schneller");
});

test("Probegegner: das Essigbakterium ist Stärke 1, der Fernkämpfer-Test im Nahkampf Stärke 2", () => {
  const zeilen = normwerte(DATEN, ["essigbakterium", "fernkaempfer_test"]);
  assert.deepEqual(zeilen.map((zeile) => zeile.staerke), [1, 2]);
  for (const zeile of zeilen) assert.deepEqual(abweichungenVon(DATEN, zeile), [], zeile.typ);
});

test("Sicht: Ninkasi zu Beginn knapp unter einem gewöhnlichen Wesen, die Normwesen und Probegegner auf der Norm", () => {
  const { sicht } = DATEN.regeln.normierung;
  assert.ok(sicht.ninkasi < sicht.wesen, "Ninkasi wird zuerst gesehen");
  assert.equal(DATEN.wesen.ninkasi.sicht.reichweite, sicht.ninkasi);
  const typen = [1, 2, 3, 4, 5].map((stelle) => `normwesen_${stelle}`).concat("essigbakterium");
  for (const typ of typen) assert.equal(DATEN.wesen[typ].sicht.reichweite, sicht.wesen, typ);
});

test("Datenprüfung: Zielwerte der Normierung", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { delete daten.regeln.normierung; }, "regeln.normierung fehlt"],
    [(daten) => { daten.regeln.normierung.toleranz = 150; }, "regeln.normierung.toleranz"],
    [(daten) => { daten.regeln.normierung.trefferchance = { ninkasi: 80 }; }, "regeln.normierung.trefferchance"],
    [(daten) => { daten.regeln.normierung.sicht = { ninkasi: 0, wesen: 7 }; }, "regeln.normierung.sicht"],
    [(daten) => { daten.regeln.normierung.staerken = [{ ninkasiTreffer: 0, wesenTreffer: 5, ep: 1 }]; }, "regeln.normierung.staerken"],
    [(daten) => { daten.regeln.normierung.abklingzeit = { kurz: -1 }; }, "regeln.normierung.abklingzeit"],
    [(daten) => { daten.regeln.normierung.verbrauch = { zauber: 10 }; }, "regeln.normierung.verbrauch"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
