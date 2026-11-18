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

test("Auslöser: Haken, Rolle, Ziel, Prozente und Effekt werden geprüft", () => {
  const mitAusloeser = (ausloeser) => mitNinkasi(() => ({ ausloeser: [ausloeser] }));
  const gueltig = { bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "biss_klein", chance: 30, daempfung: 50 };
  assert.deepEqual(mitAusloeser(gueltig), []);
  const erwartet = [
    [{ ...gueltig, bei: "gibt_es_nicht" }, "nicht im Katalog"],
    [{ ...gueltig, bei: "vor_schaden" }, "keine Auslöser erlaubt"],
    [{ ...gueltig, bei: "betritt_feld" }, "noch nicht ausgelöst"],
    [{ ...gueltig, rolle: "zuschauer" }, "rolle"],
    [{ ...gueltig, ziel: "feld" }, "ziel"],
    [{ ...gueltig, chance: 150 }, "chance"],
    [{ ...gueltig, effekt: "gibt_es_nicht" }, "Effekt"],
  ];
  for (const [ausloeser, teilDerMeldung] of erwartet) {
    assert.ok(mitAusloeser(ausloeser).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
});

test("Tod: Lebenswert und Hinterlassenschaft werden geprüft, Regeln sind Pflicht", () => {
  assert.ok(mitNinkasi(() => ({ lebenswert: "gibt_es_nicht" })).some((meldung) => meldung.includes("lebenswert")));
  assert.ok(mitNinkasi(() => ({ beimTod: { inventar: "verschenken" } })).some((meldung) => meldung.includes("beimTod.inventar")));
  const ohneRegeln = structuredClone(rohdaten);
  delete ohneRegeln.regeln;
  assert.ok(vorbereiten(ohneRegeln).fehler.some((meldung) => meldung.includes("regeln.ausloeser")));
});
