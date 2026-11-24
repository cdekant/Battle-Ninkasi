import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { rohdatenMitTesteintraegen } from "./hilfen.js";

function mitNinkasi(abweichung) {
  const daten = structuredClone(rohdaten);
  daten.wesen.ninkasi = { ...daten.wesen.ninkasi, ...abweichung(daten.wesen.ninkasi) };
  return vorbereiten(daten).fehler;
}

test("Die mitgelieferten Daten sind fehlerfrei, die Testeinträge auch", () => {
  assert.deepEqual(vorbereiten(structuredClone(rohdaten)).fehler, []);
  assert.deepEqual(vorbereiten(rohdatenMitTesteintraegen()).fehler, []);
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
  const kampfFalsch = mitNinkasi((ninkasi) => ({ stoffwechsel: { ...ninkasi.stoffwechsel, imKampf: { lp: 150, ausdauer: 0 } } }));
  assert.ok(kampfFalsch.some((meldung) => meldung.includes("imKampf.lp muss")));
  assert.ok(kampfFalsch.some((meldung) => meldung.includes("imKampf.ausdauer ohne Kurve")));
  const gewinnFalsch = mitNinkasi((ninkasi) => ({ stoffwechsel: { ...ninkasi.stoffwechsel, kampfgewinn: { pp: { jeTreffer: -1, kurve: [] }, ausdauer: { jeTreffer: 1, kurve: [[0, 1]] } } } }));
  assert.ok(gewinnFalsch.some((meldung) => meldung.includes("kampfgewinn.pp.jeTreffer")));
  assert.ok(gewinnFalsch.some((meldung) => meldung.includes("kampfgewinn.pp.kurve")));
  assert.ok(gewinnFalsch.some((meldung) => meldung.includes("kampfgewinn.ausdauer ohne Wert")));
});

test("Auslöser: Haken, Rolle, Ziel, Prozente und Effekt werden geprüft", () => {
  const mitAusloeser = (ausloeser) => mitNinkasi(() => ({ ausloeser: [ausloeser] }));
  const gueltig = { bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "biss_klein", chance: 30, daempfung: 50 };
  assert.deepEqual(mitAusloeser(gueltig), []);
  const erwartet = [
    [{ ...gueltig, bei: "gibt_es_nicht" }, "nicht im Katalog"],
    [{ ...gueltig, bei: "vor_schaden" }, "keine Auslöser erlaubt"],
    [{ ...gueltig, bei: "zug_beginn" }, "noch nicht ausgelöst"],
    [{ ...gueltig, rolle: "zuschauer" }, "rolle"],
    [{ ...gueltig, ziel: "nachbarin" }, "ziel"],
    [{ ...gueltig, chance: 150 }, "chance"],
    [{ ...gueltig, effekt: "gibt_es_nicht" }, "Effekt"],
    [{ ...gueltig, wenn: { bedingung: "pegel_ab" } }, "wenn muss eine Liste"],
    [{ ...gueltig, wenn: [{ bedingung: "mondphase" }] }, "nicht angemeldet"],
  ];
  assert.deepEqual(mitAusloeser({ ...gueltig, wenn: [{ bedingung: "pegel_ab", wert: 10 }] }), []);
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

test("Kampfwerte, Widerstände, Immunität, Schadensarten und Regeln des Kampfs werden geprüft", () => {
  const gueltig = { kampfwerte: { ausweichen: 10, ruestung: 2 }, widerstaende: { saeure: 100, feuer: -50 }, immun: ["psi"] };
  assert.deepEqual(mitNinkasi(() => gueltig), []);
  const erwartet = [
    [{ kampfwerte: { tarnung: 3 } }, "kampfwerte.tarnung"],
    [{ kampfwerte: { ruestung: -1 } }, "kampfwerte.ruestung"],
    [{ widerstaende: { kaelte: 50 } }, "widerstaende.kaelte"],
    [{ widerstaende: { feuer: 1.5 } }, "widerstaende.feuer"],
    [{ immun: ["laerm"] }, 'Schadensart "laerm"'],
  ];
  for (const [abweichung, teilDerMeldung] of erwartet) {
    assert.ok(mitNinkasi(() => abweichung).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const mitEffekt = (schritt) => {
    const daten = structuredClone(rohdaten);
    daten.effekte.test = { schritte: [schritt] };
    return vorbereiten(daten).fehler;
  };
  assert.ok(mitEffekt({ baustein: "schaden", menge: 3 }).some((meldung) => meldung.includes("art fehlt")));
  assert.ok(mitEffekt({ baustein: "schaden", art: "laerm", menge: 3 }).some((meldung) => meldung.includes('Schadensart "laerm"')));
  assert.deepEqual(mitEffekt({ baustein: "trefferwurf", genauigkeit: 90, gegen: "willenskraft", effekt: "biss_klein", sonst: "faustschlag" }), []);
  assert.ok(mitEffekt({ baustein: "trefferwurf", genauigkeit: 90, gegen: "ruestung", effekt: "biss_klein" }).some((meldung) => meldung.includes("gegen")));
  const ohneText = structuredClone(rohdaten);
  ohneText.schadensarten.kaelte = { ruestung: "ja" };
  const fehler = vorbereiten(ohneText).fehler;
  assert.ok(fehler.some((meldung) => meldung.includes("schadensarten.kaelte: Textschlüssel")));
  assert.ok(fehler.some((meldung) => meldung.includes("schadensarten.kaelte: ruestung")));
  const schiefeRegeln = structuredClone(rohdaten);
  schiefeRegeln.regeln.kampf.kritfaktor = 90;
  assert.ok(vorbereiten(schiefeRegeln).fehler.some((meldung) => meldung.includes("regeln.kampf.kritfaktor")));
  delete schiefeRegeln.regeln.kampf;
  assert.ok(vorbereiten(schiefeRegeln).fehler.some((meldung) => meldung.includes("regeln.kampf fehlt")));
});

test("Angriffsprofile werden geprüft", () => {
  const mitAngriff = (zusatz) => mitNinkasi((ninkasi) => ({ angriffe: [{ ...ninkasi.angriffe[0], ...zusatz }] }));
  assert.deepEqual(mitAngriff({ muster: { art: "linie", laenge: 2 }, trifft: "feinde", kosten: 70, chance: 30, tags: ["unblockbar"], kritchance: 5 }), []);
  const erwartet = [
    [{ muster: { art: "angrenzend", durchWaende: 1 } }, "durchWaende"],
    [{ muster: "angrenzend" }, "angriffe[0].muster"],
    [{ trifft: "niemand" }, "trifft"],
    [{ name: undefined }, "name fehlt"],
    [{ genauigkeit: undefined }, "genauigkeit fehlt"],
    [{ effekt: "gibt_es_nicht" }, "Effekt"],
    [{ kosten: 0 }, "kosten"],
    [{ chance: 150 }, "chance"],
    [{ tags: "unblockbar" }, "angriffe[0]: tags"],
  ];
  for (const [zusatz, teilDerMeldung] of erwartet) {
    assert.ok(mitAngriff(zusatz).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const faust = rohdaten.wesen.ninkasi.angriffe[0];
  assert.ok(mitNinkasi(() => ({ angriffe: [faust, faust] })).some((meldung) => meldung.includes("doppelt")));
  assert.ok(mitNinkasi(() => ({ angriffe: [] })).some((meldung) => meldung.includes("mindestens einem Profil")));
  assert.ok(mitNinkasi(() => ({ angriff: faust })).some((meldung) => meldung.includes("angriff gibt es nicht mehr")));
});

test("Zustände: Felder, Verweise und Kreise über Beginn und Ende werden geprüft", () => {
  const mitZustand = (zustand, effekte = {}) => {
    const daten = structuredClone(rohdaten);
    daten.zustaende = { ...daten.zustaende, test: zustand };
    Object.assign(daten.effekte, effekte);
    return vorbereiten(daten).fehler;
  };
  const gueltig = {
    text: "test", dauer: 300, stapel: "aufaddieren", hoechstStapel: 3, verlauf: "abklingend", tags: ["gift"],
    modifikatoren: [{ ziel: "trefferchance", art: "plus", betrag: -10 }], jeTick: "biss_klein",
    ausloeser: [{ bei: "nach_schaden", effekt: "biss_klein" }],
  };
  assert.deepEqual(mitZustand(gueltig), []);
  assert.deepEqual(mitZustand({ ...gueltig, verlauf: [[0, 50], [100, 100]] }), []);
  const erwartet = [
    [{ ...gueltig, text: undefined }, "Textschlüssel"],
    [{ ...gueltig, dauer: 0 }, "dauer"],
    [{ ...gueltig, stapel: "verdoppeln" }, "stapel"],
    [{ ...gueltig, hoechstStapel: 0 }, "hoechstStapel"],
    [{ ...gueltig, verlauf: "wellig" }, "verlauf"],
    [{ ...gueltig, verlauf: [[50, 1], [10, 2]] }, "aufsteigen"],
    [{ ...gueltig, modifikatoren: [{ ziel: "lp", art: "verdoppeln", betrag: 2 }] }, "modifikatoren[0]"],
    [{ ...gueltig, jeTick: "gibt_es_nicht" }, "Effekt"],
    [{ ...gueltig, ausloeser: [{ bei: "vor_schaden", effekt: "biss_klein" }] }, "keine Auslöser erlaubt"],
  ];
  for (const [zustand, teilDerMeldung] of erwartet) {
    assert.ok(mitZustand(zustand).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const unbekannt = mitZustand(gueltig, { setzen: { schritte: [{ baustein: "zustand_setzen", zustand: "gibt_es_nicht" }] } });
  assert.ok(unbekannt.some((meldung) => meldung.includes('Zustand "gibt_es_nicht"')));
  const kreis = mitZustand({ text: "test", beimBeginn: "setzen" }, { setzen: { schritte: [{ baustein: "zustand_setzen", zustand: "test" }] } });
  assert.ok(kreis.some((meldung) => meldung.includes("setzen > setzen")));
});

test("Ersatzwirkungen werden geprüft: Haken mit ersatzErlaubt, Ziel, Chance, Effekt", () => {
  const mitErsatz = (ersatz) => {
    const daten = structuredClone(rohdaten);
    daten.zustaende = { ...daten.zustaende, test: { text: "test", ersatz } };
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(mitErsatz([{ bei: "vor_tod", effekt: "biss_klein", verbrauchen: true }, { bei: "vor_schaden", ziel: "quelle", tag: "feuer", chance: 50 }]), []);
  const erwartet = [
    [{ bei: "nach_schaden" }, "keine Ersatzwirkungen erlaubt"],
    [{ bei: "gibt_es_nicht" }, "nicht im Katalog"],
    [{ bei: "vor_tod", ziel: "feld" }, "ziel"],
    [{ bei: "vor_tod", chance: 120 }, "chance"],
    [{ bei: "vor_tod", effekt: "gibt_es_nicht" }, "gibt_es_nicht"],
    [{ bei: "vor_tod", verbrauchen: "ja" }, "verbrauchen"],
  ];
  for (const [eintrag, teilDerMeldung] of erwartet) {
    assert.ok(mitErsatz([eintrag]).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
});

test("Verhalten in Zuständen und Beschwören werden geprüft", () => {
  const mitZustand = (zustand, effekte = {}) => {
    const daten = rohdatenMitTesteintraegen();
    daten.zustaende = { ...daten.zustaende, test: { text: "test", ...zustand } };
    Object.assign(daten.effekte, effekte);
    return vorbereiten(daten).fehler;
  };
  const gueltig = { handlungsunfaehig: false, fraktion: "urheber", ki: { modul: "jagen", trifft: "wesen" }, befehl: { veraenderer: "abweichen", chance: 30, freundeAngreifen: true } };
  assert.deepEqual(mitZustand(gueltig), []);
  const erwartet = [
    [{ handlungsunfaehig: "ja" }, "handlungsunfaehig"],
    [{ fraktion: 3 }, "fraktion"],
    [{ ki: { modul: "tanzen" } }, "Verhaltensmodul"],
    [{ ki: { modul: "jagen", trifft: "niemand" } }, "trifft"],
    [{ befehl: { veraenderer: "zaubern" } }, "Befehlsveränderer"],
    [{ befehl: { veraenderer: "abweichen" } }, "chance fehlt"],
  ];
  for (const [zustand, teilDerMeldung] of erwartet) {
    assert.ok(mitZustand(zustand).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const rufen = (wesen) => ({ rufen: { schritte: [{ baustein: "beschwoeren", wesen }] } });
  assert.deepEqual(mitZustand({}, rufen("testwesen")), []);
  assert.ok(mitZustand({}, rufen("testvorlage")).some((meldung) => meldung.includes('Wesen "testvorlage"')), "abstrakte Vorlage");
  assert.ok(mitZustand({}, rufen("drache")).some((meldung) => meldung.includes('Wesen "drache"')));
});

test("Modifikatoren, Tags und Auren an Wesen und Zuständen werden geprüft", () => {
  const modifikator = { ziel: "trefferchance", art: "plus", betrag: 10, tag: "psi", wenn: [{ bedingung: "pegel_ab", wert: 100 }, { bedingung: "gegenueber_tag", tag: "bakterium" }] };
  const aura = { reichweite: 2, trifft: "feinde", sichtlinie: true, modifikatoren: [modifikator] };
  const gueltig = { tags: ["hefe"], modifikatoren: [modifikator], auren: [aura] };
  assert.deepEqual(mitNinkasi(() => gueltig), []);
  const erwartet = [
    [{ ...gueltig, tags: "hefe" }, "tags"],
    [{ ...gueltig, modifikatoren: [{ ...modifikator, tag: 3 }] }, "tag muss ein Text"],
    [{ ...gueltig, modifikatoren: [{ ...modifikator, wenn: { bedingung: "pegel_ab" } }] }, "wenn muss eine Liste"],
    [{ ...gueltig, modifikatoren: [{ ...modifikator, wenn: [{ bedingung: "gibt_es_nicht" }] }] }, 'Bedingung "gibt_es_nicht"'],
    [{ ...gueltig, modifikatoren: [{ ...modifikator, wenn: [{ bedingung: "pegel_ab" }] }] }, "wenn[0]: wert fehlt"],
    [{ ...gueltig, auren: [{ ...aura, trifft: "freunde" }] }, "trifft"],
    [{ ...gueltig, auren: [{ ...aura, reichweite: -1 }] }, "reichweite"],
    [{ ...gueltig, auren: [{ ...aura, modifikatoren: undefined }] }, "auren[0].modifikatoren"],
    [{ ...gueltig, auren: [{ ...aura, modifikatoren: [{ ...modifikator, art: "doppelt" }] }] }, "auren[0].modifikatoren[0]"],
  ];
  for (const [abweichung, teilDerMeldung] of erwartet) {
    assert.ok(mitNinkasi(() => abweichung).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const daten = structuredClone(rohdaten);
  daten.zustaende = { ...daten.zustaende, test: { text: "test", auren: [{ ...aura, trifft: "niemand" }] } };
  assert.ok(vorbereiten(daten).fehler.some((meldung) => meldung.includes("zustaende.test.auren[0]")));
});

test("Fähigkeiten, Risikotabellen und Unterhalt werden geprüft", () => {
  const mitFaehigkeit = (faehigkeit, zusatz = {}) => {
    const daten = structuredClone(rohdaten);
    daten.faehigkeiten = { ...daten.faehigkeiten, test: faehigkeit };
    Object.assign(daten, zusatz);
    return vorbereiten(daten).fehler;
  };
  const gueltig = {
    text: "wesen.ninkasi", tags: ["psi"], verbrauch: { pp: 5, pegel: 10 }, material: [{ typ: "bier", anzahl: 1 }], zeit: 150, abklingzeit: 3,
    voraussetzungen: [{ bedingung: "pegel_ab", wert: 100 }], risiko: "psi", ziel: { art: "geschoss", reichweite: 6, trifft: "wesen" }, wirkung: "biss_klein",
  };
  assert.deepEqual(mitFaehigkeit(gueltig), []);
  assert.deepEqual(mitFaehigkeit({ ...gueltig, dauer: { schritte: 3 }, beimAbbruch: "biss_klein" }), []);
  const regeln = structuredClone(rohdaten.regeln);
  regeln.laufendeAktionen.unterbrechen = ["schaden", "erdbeben"];
  assert.ok(mitFaehigkeit(gueltig, { regeln }).some((meldung) => meldung.includes('Gefahrenprüfung "erdbeben"')));
  assert.deepEqual(mitFaehigkeit({ text: "wesen.ninkasi", art: "aufrecht", zustand: "test" }, { zustaende: { ...rohdaten.zustaende, test: { text: "wesen.ninkasi", unterhalt: { mp: 2 } } } }), []);
  const erwartet = [
    [{ ...gueltig, text: undefined }, "Textschlüssel"],
    [{ ...gueltig, art: "passiv" }, "art muss"],
    [{ ...gueltig, verbrauch: { mp: -1 } }, "verbrauch.mp"],
    [{ ...gueltig, material: [{ typ: "hopfen", anzahl: 1 }] }, 'Gegenstand "hopfen"'],
    [{ ...gueltig, material: [{ typ: "bier", anzahl: 0 }] }, "anzahl"],
    [{ ...gueltig, zeit: 0 }, "zeit"],
    [{ ...gueltig, abklingzeit: -2 }, "abklingzeit"],
    [{ ...gueltig, voraussetzungen: [{ bedingung: "betrunken" }] }, 'Bedingung "betrunken"'],
    [{ ...gueltig, risiko: "chaos" }, 'Risikotabelle "chaos"'],
    [{ ...gueltig, ziel: undefined }, "ziel fehlt"],
    [{ ...gueltig, ziel: { art: "kegel" } }, "ziel: art muss"],
    [{ ...gueltig, ziel: { art: "feld", muster: { art: "spirale" } } }, "nicht angemeldet"],
    [{ ...gueltig, wirkung: undefined }, "wirkung fehlt"],
    [{ text: "wesen.ninkasi", art: "aufrecht", zustand: "gibt_es_nicht" }, 'Zustand "gibt_es_nicht"'],
    [{ ...gueltig, dauer: { schritte: 0 } }, "dauer"],
    [{ ...gueltig, dauer: 3 }, "dauer"],
    [{ ...gueltig, beimAbbruch: "gibt_es_nicht" }, "beimAbbruch"],
  ];
  for (const [faehigkeit, teilDerMeldung] of erwartet) {
    assert.ok(mitFaehigkeit(faehigkeit).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  assert.ok(mitNinkasi(() => ({ faehigkeiten: ["fliegen"] })).some((meldung) => meldung.includes('Fähigkeit "fliegen"')));
  const kaputteRisiken = { risiken: { psi: [{ name: "fehlschlag", chance: [[10, 5], [5, 1]] }] } };
  const fehler = mitFaehigkeit(gueltig, kaputteRisiken);
  assert.ok(fehler.some((meldung) => meldung.includes("risiken.psi[0]: wirkt fehlt")));
  assert.ok(fehler.some((meldung) => meldung.includes("aufsteigen")));
  const daten = structuredClone(rohdaten);
  daten.zustaende = { ...daten.zustaende, test: { text: "wesen.ninkasi", unterhalt: { mp: "viel" } } };
  assert.ok(vorbereiten(daten).fehler.some((meldung) => meldung.includes("unterhalt.mp")));
});

test("Fraktionen, Wachzustand, Lärmdämpfung und Regeln der Wahrnehmung werden geprüft", () => {
  const mitDaten = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  assert.deepEqual(mitDaten((daten) => { daten.fraktionen.testfraktion.beziehungen = { ninkasi: "neutral" }; }), []);
  const erwartet = [
    [(daten) => { daten.fraktionen.testfraktion.beziehungen = { drachen: "feind" }; }, 'Fraktion "drachen"'],
    [(daten) => { daten.fraktionen.testfraktion.beziehungen = { ninkasi: "freundlich" }; }, "beziehungen.ninkasi"],
    [(daten) => { delete daten.fraktionen.testfraktion.text; }, "fraktionen.testfraktion: Textschlüssel"],
    [(daten) => { daten.wesen.testwesen.fraktion = "piraten"; }, 'Fraktion "piraten"'],
    [(daten) => { daten.wesen.testwesen.ki = { modul: "jagen", wachzustand: "doest" }; }, "wachzustand"],
    [(daten) => { daten.gelaende.testgelaende.laermdaempfung = -1; }, "laermdaempfung"],
    [(daten) => { daten.regeln.fraktionen.beziehungVorgabe = "egal"; }, "beziehungVorgabe"],
    [(daten) => { daten.regeln.wahrnehmung.bemerkenChance = 120; }, "bemerkenChance"],
    [(daten) => { daten.regeln.wahrnehmung.heimlichkeitNachAktion = { warten: "halb" }; }, "heimlichkeitNachAktion"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) {
    assert.ok(mitDaten(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  assert.deepEqual(mitDaten((daten) => { daten.wesen.testwesen.ki = { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null }; }), []);
});

test("KI mit Fähigkeiten, Ankündigung und Unterbrechbarkeit werden geprüft", () => {
  const mitGegner = (abweichung, faehigkeit = null) => {
    const daten = rohdatenMitTesteintraegen();
    if (faehigkeit) daten.faehigkeiten.test = faehigkeit;
    const gegner = daten.wesen.testwesen;
    daten.wesen.testwesen = { ...gegner, ...abweichung(gegner) };
    return vorbereiten(daten).fehler;
  };
  const mitKi = (ki) => mitGegner((gegner) => ({ ki: { ...gegner.ki, ...ki } }));
  const erwartet = [
    [{ abstandHalten: 3 }, "abstandHalten gibt es nicht mehr"],
    [{ faehigkeiten: [{ name: "testgeschoss" }] }, "faehigkeiten an der KI gibt es nicht mehr"],
    [{ handlungen: "spucke" }, "handlungen muss eine Liste"],
    [{ handlungen: [{ handlung: "tanzen" }] }, 'Handlung "tanzen" ist nicht angemeldet'],
    [{ handlungen: [{ handlung: "faehigkeit", name: "gibt_es_nicht" }] }, 'Fähigkeit "gibt_es_nicht" gibt es nicht'],
    [{ handlungen: [{ handlung: "faehigkeit", name: "testgeschoss", chance: 120 }] }, "chance"],
    [{ handlungen: [{ handlung: "faehigkeit", name: "testgeschoss", abstandAb: -1 }] }, "abstandAb"],
    [{ handlungen: [{ handlung: "faehigkeit", name: "testgeschoss", wenn: [{ bedingung: "mondphase" }] }] }, "nicht angemeldet"],
    [{ handlungen: [{ handlung: "abstand_halten", abstand: 0 }] }, "abstand muss eine ganze Zahl > 0"],
    [{ handlungen: [{ handlung: "abstand_halten" }] }, "abstand"],
    [{ handlungen: [{ handlung: "warten", bewertung: [{ eingabe: "mondphase", kurve: [[0, 1000]] }] }] }, 'Eingabe "mondphase"'],
    [{ handlungen: [{ handlung: "warten", bewertung: [{ eingabe: "abstand", kurve: [[0, 2000]] }] }] }, "Promille"],
    [{ handlungen: [{ handlung: "warten", bewertung: [{ eingabe: "abstand", kurve: [] }] }] }, "Stützpunkt"],
    [{ wahl: "zufall" }, "wahl muss"],
    [{ wahl: { gewichtetUnterBesten: 0 } }, "wahl muss"],
  ];
  for (const [ki, teilDerMeldung] of erwartet) assert.ok(mitKi(ki).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  assert.deepEqual(mitKi({ wahl: { gewichtetUnterBesten: 2 }, handlungen: [{ handlung: "fliehen", gewicht: 50, bewertung: [{ eingabe: "eigeneLpProzent", kurve: [[0, 1000], [30, 0]] }] }] }), []);
  const unbekannt = mitGegner(() => ({ faehigkeiten: ["testgeschoss"] }));
  assert.ok(unbekannt.some((meldung) => meldung.includes('kennt die Fähigkeit "testritual" nicht')));

  const ohneDauer = { text: "wesen.ninkasi", ankuendigung: "wesen.ninkasi", unterbrechbar: true, ziel: { art: "selbst" }, wirkung: "testeffekt" };
  assert.ok(mitGegner(() => ({}), ohneDauer).some((meldung) => meldung.includes("nur mit dauer")));
  assert.ok(mitGegner(() => ({}), { ...ohneDauer, dauer: { schritte: 2 }, ziel: { art: "geschoss", ueberVerbuendete: "ja" } }).some((meldung) => meldung.includes("ueberVerbuendete")));
  assert.deepEqual(mitGegner(() => ({}), { ...ohneDauer, dauer: { schritte: 2 } }), []);
});

test("Bewegungsarten, Tempo, Gelände, Würfe, Unterbrechungsgründe und Regeln der Bewegung werden geprüft", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.wesen.ninkasi.bewegung = "kriechend"; }, "bewegung muss eines von"],
    [(daten) => { daten.wesen.ninkasi.kosten = { fliegen: 50 }; }, 'Aktion "fliegen"'],
    [(daten) => { daten.wesen.ninkasi.kosten = { bewegen: 0 }; }, "kosten.bewegen muss eine ganze Zahl > 0"],
    [(daten) => { daten.regeln.tempo.stufen = [[100, "normal"], [50, "schnell"]]; }, "regeln.tempo.stufen"],
    [(daten) => { daten.regeln.tempo.darueber = 5; }, "regeln.tempo.darueber"],
    [(daten) => { daten.zustaende.test = { text: "t", bewegung: "hüpfend" }; }, "bewegung muss eines von"],
    [(daten) => { daten.gelaende.testgelaende.passierbarFuer = ["tauchend"]; }, "passierbarFuer"],
    [(daten) => { daten.gelaende.testgelaende.undurchdringlich = "ja"; }, "undurchdringlich"],
    [(daten) => { daten.gelaende.testgelaende.beimFestsitzen = "gibt_es_nicht"; }, 'Effekt "gibt_es_nicht"'],
    [(daten) => { daten.gegenstaende.testgegenstand.wurf = { effekt: "gibt_es_nicht" }; }, 'Effekt "gibt_es_nicht"'],
    [(daten) => { daten.gegenstaende.testgegenstand.wurf = { reichweite: 0 }; }, "reichweite"],
    [(daten) => { daten.faehigkeiten.testritual.unterbrechbar = ["husten"]; }, "unterbrechbar"],
    [(daten) => { delete daten.regeln.bewegung; }, "regeln.bewegung"],
    [(daten) => { daten.regeln.werfen = { reichweite: 0 }; }, "regeln.werfen.reichweite"],
    [(daten) => { delete daten.regeln.wahrnehmung.laermWurf; }, "laermWurf"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) {
    assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
  }
  const gueltig = pruefen((daten) => {
    daten.gelaende.testgelaende.undurchdringlich = false;
    daten.gelaende.testgelaende.passierbarFuer = ["phasend"];
    daten.gegenstaende.testgegenstand.wurf = { effekt: "testeffekt", reichweite: 4 };
    daten.faehigkeiten.testritual.unterbrechbar = ["schaden", "versetzt"];
  });
  assert.deepEqual(gueltig, []);
});
