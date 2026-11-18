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
    [{ ...gueltig, ziel: "nachbarin" }, "ziel"],
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

test("Zielmuster, Bausteine mit Zielauswahl und Mengen werden geprüft", () => {
  const mitEffekt = (schritt) => {
    const daten = structuredClone(rohdaten);
    daten.effekte.test = { schritte: [schritt] };
    return vorbereiten(daten).fehler;
  };
  const gueltig = { baustein: "fuer_jedes_ziel", muster: { art: "kreis", radius: 1 }, effekt: "biss_klein", trifft: "feinde" };
  assert.deepEqual(mitEffekt(gueltig), []);
  assert.deepEqual(mitEffekt({ baustein: "springen", anzahl: 3, reichweite: 2, effekt: "biss_klein", wahl: "zufaellig" }), []);
  assert.deepEqual(mitEffekt({ baustein: "heilen", menge: { aus: "summeSchaden", prozent: 50 } }), []);
  const erwartet = [
    [{ ...gueltig, muster: { art: "spirale" } }, "nicht angemeldet"],
    [{ ...gueltig, muster: "kreis" }, "{ art, ... }"],
    [{ ...gueltig, muster: { art: "kreis" } }, "radius fehlt"],
    [{ ...gueltig, muster: { art: "kegel", laenge: 3, oeffnung: 77 } }, "oeffnung"],
    [{ ...gueltig, muster: { art: "kreis", radius: 1, durchWaende: "ja" } }, "durchWaende"],
    [{ ...gueltig, effekt: "gibt_es_nicht" }, "Effekt"],
    [{ ...gueltig, trifft: "freunde" }, "trifft"],
    [{ baustein: "geschoss", effekt: "biss_klein" }, "reichweite fehlt"],
    [{ baustein: "heilen", menge: { prozent: 50 } }, "menge.aus"],
    [{ baustein: "schaden", menge: 5, prozentJeSprung: -1 }, "prozentJeSprung"],
  ];
  for (const [schritt, teilDerMeldung] of erwartet) {
    assert.ok(mitEffekt(schritt).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
});

test("Effekte dürfen sich nicht im Kreis aufrufen", () => {
  const daten = structuredClone(rohdaten);
  daten.effekte.ping = { schritte: [{ baustein: "geschoss", reichweite: 3, effekt: "pong" }] };
  daten.effekte.pong = { schritte: [{ baustein: "fuer_jedes_ziel", muster: { art: "selbst" }, effekt: "ping" }] };
  daten.effekte.selbstbezug = { schritte: [{ baustein: "auf_feld", muster: { art: "feld" }, effekt: "selbstbezug" }] };
  const kreise = vorbereiten(daten).fehler.filter((meldung) => meldung.includes("im Kreis"));
  assert.equal(kreise.length, 2);
  assert.ok(kreise.some((meldung) => meldung.includes("ping > pong > ping")));
});

test("Angriff mit Muster und trifft wird geprüft", () => {
  const mitAngriff = (zusatz) => mitNinkasi((ninkasi) => ({ angriff: { ...ninkasi.angriff, ...zusatz } }));
  assert.deepEqual(mitAngriff({ muster: { art: "linie", laenge: 2 }, trifft: "feinde" }), []);
  assert.ok(mitAngriff({ muster: { art: "angrenzend", durchWaende: 1 } }).some((meldung) => meldung.includes("durchWaende")));
  assert.ok(mitAngriff({ muster: "angrenzend" }).some((meldung) => meldung.includes("angriff.muster")));
  assert.ok(mitAngriff({ trifft: "niemand" }).some((meldung) => meldung.includes("trifft")));
});
