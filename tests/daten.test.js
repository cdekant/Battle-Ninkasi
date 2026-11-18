import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import { vorbereiten } from "../src/kern/daten.js";

function mitNinkasi(abweichung) {
  const daten = structuredClone(rohdaten);
  daten.wesen.ninkasi = { ...daten.wesen.ninkasi, ...abweichung(daten.wesen.ninkasi) };
  return vorbereiten(daten).fehler;
}

test("Die mitgelieferten Daten sind fehlerfrei", () => {
  assert.deepEqual(vorbereiten(structuredClone(rohdaten)).fehler, []);
});

test("Ein offener Wert braucht einen Anfangswert", () => {
  const fehler = mitNinkasi((ninkasi) => ({ werte: { ...ninkasi.werte, pegel: {} } }));
  assert.ok(fehler.some((meldung) => meldung.includes("werte.pegel")));
});

test("Stoffwechsel: Kurven werden geprüft, nur für vorhandene Werte, Pegel ist Pflicht", () => {
  const kaputteKurve = mitNinkasi((ninkasi) => ({ stoffwechsel: { ...ninkasi.stoffwechsel, regeneration: { lp: [[10, 1], [5, 2]] } } }));
  assert.ok(kaputteKurve.some((meldung) => meldung.includes("aufsteigen")));
  const fremderWert = mitNinkasi((ninkasi) => ({ stoffwechsel: { ...ninkasi.stoffwechsel, regeneration: { ausdauer: [[0, 1]] } } }));
  assert.ok(fremderWert.some((meldung) => meldung.includes("ohne Wert ausdauer")));
  const ohnePegel = mitNinkasi((ninkasi) => {
    const { pegel: _, ...werteOhnePegel } = ninkasi.werte;
    return { werte: werteOhnePegel };
  });
  assert.ok(ohnePegel.some((meldung) => meldung.includes("braucht den Wert pegel")));
});
