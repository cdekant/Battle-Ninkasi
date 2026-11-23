// Untersuchen (systeme/untersuchen.js, Taste X im Zielmodus), Wahrnehmbarkeit der Meldungen und Hören
// (systeme/wahrnehmbar.js), Buchstaben nach dem Zeichen der Taste (eingabe/inventar.js) und die Texte dazu
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, spielerinSetzen, wesen, allesSichtbar, gegenstandTragen, meldungenMitschneiden } from "./hilfen.js";
import { entitaetErzeugen } from "../src/kern/zustand.js";
import { bezugAuf } from "../src/kern/ereignisse.js";
import { feldIndex } from "../src/welt/karte.js";
import { erinnerungAuffrischen } from "../src/systeme/erinnerung.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { laermMachen, GERAEUSCHE } from "../src/systeme/wahrnehmung.js";
import { KAMPFWERTE } from "../src/systeme/kampf.js";
import { nahkampfchanceVorschau } from "../src/systeme/vorschau.js";
import { feldBeschreiben, zustaendeVon, werteAufschluesseln, herkunftVon, laufendeAktionVon } from "../src/systeme/untersuchen.js";
import { meldungWahrnehmbar, richtungZu, geraeuschGehoert } from "../src/systeme/wahrnehmbar.js";
import { zielmodusBeginnen, zielmodusTaste, zielmodusVorschau, zielmodusBestaetigen } from "../src/eingabe/zielmodus.js";
import { buchstabeDerTaste, inventarTaste } from "../src/eingabe/inventar.js";
import { faehigkeitenTaste } from "../src/eingabe/faehigkeiten.js";
import belegung from "../src/eingabe/belegung.js";
import { texteDe as texte, rohdaten } from "../src/inhalt.js";

const KARTE = [
  "############",
  "#..........#",
  "#..........#",
  "#..........#",
  "############",
];

const EFFEKTE = { treffer: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] } };
const ZUSTAENDE = {
  test: { text: "t", dauer: 250, modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: 3 }] },
  ewig: { text: "e" },
};
const SCHICHTEN = { oberflaechen: { saeure: { text: "oberflaeche.saeure", hoechstens: 6 } }, gase: {} };

function aufstellen() {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, zustaende: ZUSTAENDE, schichten: SCHICHTEN });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  ninkasi.angriffe = [{ name: "faust", genauigkeit: 80, effekt: "treffer" }];
  ninkasi.kampfwerte = { ausweichen: 20 };
  ninkasi.inventar = [];
  // Genauigkeit 60 gegen Ausweichen 20 bei Grundverteidigung 0 (tests/hilfen.js): 75 %; Ninkasi 80 gegen 20: 80 %
  const gegner = wesen(spiel, 4, 1, "feinde", 12, { angriffe: [{ name: "biss", genauigkeit: 60, effekt: "treffer" }], kampfwerte: { ausweichen: 20 } });
  allesSichtbar(spiel);
  return { spiel, ninkasi, gegner };
}

test("Untersuchen: sichtbar alles, außer Sicht das Erinnerte, unbekannt nichts", () => {
  const { spiel, ninkasi, gegner } = aufstellen();
  const ebene = spiel.zustand.ebene;
  const flasche = entitaetErzeugen(spiel.zustand, { typ: "flasche", text: "x", aufhebbar: true, position: { x: 4, y: 1 } });
  ebene.schichten = { oberflaeche: { [feldIndex(ebene, 4, 1)]: { art: "saeure", menge: 3 } }, gas: {}, feuer: {} };
  const beschreibung = feldBeschreiben(spiel, { x: 4, y: 1 });
  assert.equal(beschreibung.sichtbar, true);
  assert.equal(beschreibung.gelaende, "boden");
  assert.deepEqual(beschreibung.schichten, [{ schicht: "oberflaeche", art: "saeure", menge: 3 }]);
  assert.deepEqual(beschreibung.gegenstaende, [flasche.id]);
  const [beschriebenerGegner] = beschreibung.wesen;
  assert.equal(beschriebenerGegner.id, gegner.id);
  assert.deepEqual(beschriebenerGegner.lp, { aktuell: 12, hoechst: 12 });
  assert.deepEqual(beschriebenerGegner.chanceNinkasi, { prozent: 80 });
  assert.deepEqual(beschriebenerGegner.chanceGegen, { prozent: 75 });
  // Ninkasi selbst ohne Chancen und ohne Wachzustand
  const selbst = feldBeschreiben(spiel, ninkasi.position).wesen[0];
  assert.equal(selbst.chanceNinkasi, null);
  assert.equal(selbst.wachzustand, null);
  // gerade nicht sichtbar: was erinnert ist (Gelände, Oberfläche ohne Menge, Gegenstand als Aussehen), das Wesen nicht
  erinnerungAuffrischen(spiel, [feldIndex(ebene, 4, 1)]);
  spiel.zustand.sichtbareFelder = [feldIndex(ebene, 1, 1)];
  assert.deepEqual(feldBeschreiben(spiel, { x: 4, y: 1 }), {
    x: 4, y: 1, sichtbar: false, gelaende: "boden", schichten: [{ schicht: "oberflaeche", art: "saeure", menge: null }],
    gegenstaende: [], fallen: [], wesen: [], erinnert: { gegenstaende: [{ typ: "flasche", text: "x", anzahl: 1 }], fallen: [] },
  });
  // unbekannt oder außerhalb der Karte: nichts
  ebene.erinnerung[feldIndex(ebene, 4, 1)] = null;
  assert.equal(feldBeschreiben(spiel, { x: 4, y: 1 }), null);
  assert.equal(feldBeschreiben(spiel, { x: 40, y: 1 }), null);
});

test("Untersuchen: verborgene Fallen bleiben verborgen, Wachzustand und Hinterhalt", () => {
  const { spiel, ninkasi, gegner } = aufstellen();
  const verborgen = entitaetErzeugen(spiel.zustand, { typ: "falle", text: "f", position: { x: 2, y: 2 }, falle: { tarnung: 10, effekt: "treffer" } });
  assert.deepEqual(feldBeschreiben(spiel, { x: 2, y: 2 }).fallen, []);
  verborgen.entdeckt = true;
  assert.deepEqual(feldBeschreiben(spiel, { x: 2, y: 2 }).fallen, [verborgen.id]);
  gegner.ki = { modul: "jagen", wachzustand: "schlaeft", letzteBekanntePosition: null };
  const beschrieben = feldBeschreiben(spiel, gegner.position).wesen[0];
  assert.equal(beschrieben.wachzustand, "schlaeft");
  assert.deepEqual(beschrieben.chanceNinkasi, { prozent: 100, hinterhalt: true });
  // ohne Angriff keine Chance
  ninkasi.angriffe = [];
  assert.equal(nahkampfchanceVorschau(spiel, ninkasi, gegner), null);
});

test("Zustände mit Restdauer in Zügen, laufende Aktion, Aufschlüsselung der Werte mit Herkunft", () => {
  const { spiel, ninkasi } = aufstellen();
  zustandSetzen(spiel, ninkasi, "test", { quelleId: ninkasi.id, urheberId: ninkasi.id });
  zustandSetzen(spiel, ninkasi, "ewig", { quelleId: ninkasi.id, urheberId: ninkasi.id });
  const [test1, ewig] = zustaendeVon(spiel, ninkasi);
  assert.equal(test1.name, "test");
  assert.equal(test1.zuege, 3); // 250 Zeiteinheiten sind angefangene 3 Züge
  assert.equal(ewig.zuege, null);
  spiel.zustand.zeit = 240;
  assert.equal(zustaendeVon(spiel, ninkasi)[0].zuege, 1);

  ninkasi.laufendeAktion = { art: "faehigkeit", faehigkeit: "ritual", schritteGesamt: 5, schritteErledigt: 2, unterbrochen: null };
  assert.deepEqual(laufendeAktionVon(ninkasi), { art: "faehigkeit", faehigkeit: "ritual", erledigt: 2, gesamt: 5, unterbrochen: null });

  const helm = gegenstandTragen(spiel, ninkasi, { typ: "helm", text: "h" });
  ninkasi.modifikatoren = [{ ziel: "ruestung", art: "plus", betrag: 2 }];
  const werte = werteAufschluesseln(spiel, ninkasi);
  const namen = werte.map((eintrag) => eintrag.name);
  assert.deepEqual(namen, ["lp", "genauigkeit", "ausweichen", "ruestung", "heimlichkeit"]);
  const ausweichen = werte.find((eintrag) => eintrag.name === "ausweichen");
  assert.deepEqual(ausweichen, { name: "ausweichen", grundwert: 20, wert: 23, modifikatoren: [{ art: "plus", betrag: 3, herkunft: { art: "zustand", name: "test" } }] });
  assert.deepEqual(werte.find((eintrag) => eintrag.name === "ruestung").modifikatoren[0].herkunft, { art: "eigen" });
  assert.deepEqual(herkunftVon(ninkasi, `ausruestung:${helm.id}`), { art: "gegenstand", id: helm.id });
  assert.deepEqual(herkunftVon(ninkasi, "aura:zustand:3"), { art: "aura" });
});

test("Untersuchen mit X: Cursor ohne Befehl, Enter bleibt, X und Esc schließen, Tab springt", () => {
  const { spiel, gegner } = aufstellen();
  const beginn = zielmodusBeginnen(spiel, { zweck: "untersuchen" });
  assert.equal(beginn.befehl, undefined);
  assert.deepEqual(beginn.modus.cursor, gegner.position);
  assert.equal(zielmodusVorschau(spiel, beginn.modus), null);
  assert.deepEqual(zielmodusBestaetigen(spiel, beginn.modus), { modus: beginn.modus });
  assert.deepEqual(zielmodusTaste(spiel, beginn.modus, "Enter", belegung), { modus: beginn.modus });
  const verschoben = zielmodusTaste(spiel, beginn.modus, "Numpad2", belegung).modus;
  assert.deepEqual(verschoben.cursor, { x: 4, y: 2 });
  assert.deepEqual(zielmodusTaste(spiel, verschoben, "Tab", belegung).modus.cursor, gegner.position);
  assert.equal(zielmodusTaste(spiel, verschoben, "KeyX", belegung).modus, null);
  assert.equal(zielmodusTaste(spiel, verschoben, "Escape", belegung).modus, null);
  assert.equal(belegung.tasten.KeyX, "untersuchen");
  // beim Werfen oder Zielen schließt X nicht
  const zielen = { auswahl: { zweck: "faehigkeit", faehigkeit: "x" }, zielart: { art: "feld" }, cursor: { x: 2, y: 2 } };
  assert.notEqual(zielmodusTaste(spiel, zielen, "KeyX", belegung).modus, null);
});

test("Buchstaben nach dem Zeichen der Taste: Z auf deutscher Tastatur (Tastencode KeyY) ist z", () => {
  assert.equal(buchstabeDerTaste("KeyY", "z"), "z");
  assert.equal(buchstabeDerTaste("KeyZ", "Y"), "y");
  assert.equal(buchstabeDerTaste("KeyY", undefined), "y");
  assert.equal(buchstabeDerTaste("Semicolon", "ö"), null);
  assert.equal(buchstabeDerTaste("Digit1", "1"), null);
  const { spiel, ninkasi } = aufstellen();
  const gegenstaende = Array.from({ length: 26 }, (_, stelle) => gegenstandTragen(spiel, ninkasi, { typ: `ding${stelle}`, text: "x" }));
  assert.deepEqual(inventarTaste({ gewaehlt: null }, "KeyY", spiel, "z").fenster, { gewaehlt: gegenstaende[25].id });
  assert.deepEqual(inventarTaste({ gewaehlt: null }, "KeyZ", spiel, "y").fenster, { gewaehlt: gegenstaende[24].id });
  ninkasi.faehigkeiten = ["eins", "zwei"];
  assert.deepEqual(faehigkeitenTaste({}, "KeyB", spiel, "b").fenster, { gewaehlt: "zwei" });
});

test("Meldungen: wahrnehmbar mit Ninkasi, mit sichtbarem Ort oder ganz ohne Ort; bemerkt nur bei Sicht", () => {
  const { spiel, ninkasi, gegner } = aufstellen();
  const ebene = spiel.zustand.ebene;
  const anderer = wesen(spiel, 8, 3, "feinde", 5);
  const meldung = (art, daten) => ({ art, zeit: 0, ...daten });
  assert.deepEqual(bezugAuf(gegner).ort, { x: 4, y: 1 });
  spiel.zustand.sichtbareFelder = [feldIndex(ebene, 1, 1), feldIndex(ebene, 4, 1)];
  assert.equal(meldungWahrnehmbar(spiel, meldung("schaden", { quelle: bezugAuf(gegner), ziel: bezugAuf(anderer) })), true);
  assert.equal(meldungWahrnehmbar(spiel, meldung("schaden", { quelle: bezugAuf(anderer), ziel: bezugAuf(anderer) })), false);
  assert.equal(meldungWahrnehmbar(spiel, meldung("schaden", { quelle: bezugAuf(anderer), ziel: bezugAuf(ninkasi) })), true);
  assert.equal(meldungWahrnehmbar(spiel, meldung("bemerkt", { wer: bezugAuf(anderer), ziel: bezugAuf(ninkasi) })), false);
  assert.equal(meldungWahrnehmbar(spiel, meldung("bemerkt", { wer: bezugAuf(gegner), ziel: bezugAuf(ninkasi) })), true);
  assert.equal(meldungWahrnehmbar(spiel, meldung("pegel_steigt", { schwelle: 500 })), true);
  assert.equal(meldungWahrnehmbar(spiel, meldung("flaeche", { quelle: null, felder: [{ x: 8, y: 3 }, { x: 4, y: 1 }] })), true);
  assert.equal(meldungWahrnehmbar(spiel, meldung("flaeche", { quelle: null, felder: [{ x: 8, y: 3 }] })), false);
});

test("Hören: Lärm außer Sicht wird zum Geräusch mit Richtung, hinter dicken Wänden nicht", () => {
  const spiel = miniSpiel([
    "##########",
    "#........#",
    "#........#",
    "##########",
  ]);
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const ebene = spiel.zustand.ebene;
  spiel.zustand.sichtbareFelder = [feldIndex(ebene, 1, 1)];
  const meldungen = meldungenMitschneiden(spiel);
  laermMachen(spiel, { x: 8, y: 1 }, 10, null, "nahkampf");
  assert.equal(meldungen.at(-1).gesteuerteHoert, true);
  assert.deepEqual(geraeuschGehoert(spiel, meldungen.at(-1)), { geraeusch: "nahkampf", richtung: "o" });
  // zu leise
  laermMachen(spiel, { x: 8, y: 1 }, 3, null, "aufschlag");
  assert.equal(geraeuschGehoert(spiel, meldungen.at(-1)), null);
  // eigener Lärm und gesehener Lärm sind kein Geräusch
  laermMachen(spiel, { x: 8, y: 1 }, 10, ninkasi.id);
  assert.equal(meldungen.at(-1).gesteuerteHoert, false);
  spiel.zustand.sichtbareFelder.push(feldIndex(ebene, 8, 1));
  laermMachen(spiel, { x: 8, y: 1 }, 10);
  assert.equal(geraeuschGehoert(spiel, meldungen.at(-1)), null);
  assert.equal(richtungZu({ x: 5, y: 5 }, { x: 5, y: 1 }), "n");
  assert.equal(richtungZu({ x: 5, y: 5 }, { x: 1, y: 9 }), "sw");
  assert.equal(richtungZu({ x: 5, y: 5 }, { x: 9, y: 4 }), "o");
  assert.equal(richtungZu({ x: 5, y: 5 }, { x: 5, y: 5 }), null);
});

test("Texte für Untersuchen, Zustände, Geräusche und Gelände sind vorhanden", () => {
  const schluessel = [
    "log.zustand_beginnt", "log.zustand_endet", "log.abgewichen", "log.beschworen", "log.erschienen", "log.verschwindet",
    ...GERAEUSCHE.map((geraeusch) => `log.geraeusch.${geraeusch}`),
    ...["n", "no", "o", "so", "s", "sw", "w", "nw", "nah"].map((richtung) => `richtung.${richtung}`),
    ...["schlaeft", "wach", "jagt"].map((wachzustand) => `ui.wachzustand.${wachzustand}`),
    ...["eigen", "aura", "sonstige"].map((herkunft) => `ui.herkunft.${herkunft}`),
    ...["lp", "mp", "pp", "genauigkeit", ...KAMPFWERTE, "reichweiteSicht", "sichtImDunkeln"].map((wert) => `ui.wert.${wert}`),
    ...Object.values(rohdaten.gelaende).map((gelaende) => gelaende.text),
  ];
  assert.deepEqual(schluessel.filter((eintrag) => !(eintrag in texte)), []);
});
