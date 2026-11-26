// Trockenbier (src/systeme/trockenbier.js): Abfüllen am Kessel als Würze ohne Gärung, Anrühren mit Gefäß und Kultur wie
// ein Sud, Ablehnungen, Muffigwerden, Kniff nur mit der Kultur des Rezepts, Zeit im Kampf mit Schnellsud, Kveik und Hitze,
// das Fenster zum Anrühren (src/eingabe/anruehren.js), die Taste im Braufenster und die Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, meldungenMitschneiden, gegenstandTragen, weltLaufenLassen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import zustaende from "../daten/zustaende.js";
import { sudVorbereiten } from "../src/systeme/brauen.js";
import { anruehrenVorbereiten, anruehrenZeit, schnellsudVon, trockenbierIm } from "../src/systeme/trockenbier.js";
import { braufensterOeffnen, brauTaste, braubefehl } from "../src/eingabe/brauen.js";
import { anruehrenTaste, kulturenZumAnruehren } from "../src/eingabe/anruehren.js";
import { inventarTaste } from "../src/eingabe/inventar.js";

const RAUM = [
  "######",
  "#..u.#",
  "#....#",
  "######",
];

const GEGENSTAENDE = {
  ...sude,
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 80, farbe: 4, aromen: { malz: 80, suesse: 20 } } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
};
const KULTUREN = {
  hefe: { text: "k.hefe", vergaerung: 75, vertraegt: 90, aromen: { frucht: 10 } },
  schwach: { text: "k.schwach", vergaerung: 60, vertraegt: 40 },
  kveik: { text: "k.kveik", vergaerung: 80, vertraegt: 110, schnellsud: 1 },
};
const ZIELGEBIETE = {
  weit: { text: "z.weit", familie: "test", spannen: { malz: [0, 100] } },
  helles: { text: "z.helles", familie: "test", spannen: { farbe: [0, 20], malz: [50, 100] } },
};
// Kessel ohne Unschärfe: die Würze landet genau in der Mitte der Vorschau; die Fackel wärmt
const GELAENDE = {
  kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { portionen: 4, unschaerfe: 0 } },
  fackel: { text: "g.fackel", kennung: "f", passierbar: false, durchsichtig: false, hitze: true },
};
const TROCKENBIER = { gegenstand: "trockenbier", haltbarkeit: 500, muffig: "adjektiv.muffig", anruehren: { imKampfAb: 2, imKampf: { 2: 200, 3: 100 }, hitzeProzent: 75 } };

function spielBauen({ karte = RAUM } = {}) {
  const spiel = miniSpiel(karte, { gelaende: GELAENDE, effekte, zustaende, gegenstaende: GEGENSTAENDE, kulturen: KULTUREN, zielgebiete: ZIELGEBIETE, regeln: { brauen: { verderben: 0, schwach: { chance: 0, plus: 20 }, trockenbier: TROCKENBIER } } });
  const ninkasi = wesen(spiel, 2, 1, "ninkasi", 100, {
    werte: werteAusDaten({ lp: { grundwert: 100, anfangswert: 50 }, mp: { grundwert: 100, anfangswert: 50 }, pegel: { anfangswert: 0 } }),
    kulturen: ["hefe", "schwach"], inventar: [],
  });
  spiel.zustand.spielerinId = ninkasi.id;
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

const tragen = (spiel, ninkasi, typ, anzahl = 1) => gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
const ZWEI_TROCKENBIER = (malz) => ({ art: "brauen", zutaten: [{ gegenstandId: malz.id, menge: 4 }], portionen: 2, kultur: null, abfuellen: "trocken" });

// Ninkasi mit zwei Stück Trockenbier aus 4 Malz und so vielen Flaschen
function mitTrockenbier(flaschen = 1) {
  const aufbau = spielBauen();
  const malz = tragen(aufbau.spiel, aufbau.ninkasi, "malz", 4);
  assert.equal(befehlGeben(aufbau.spiel, ZWEI_TROCKENBIER(malz)).ok, true);
  if (flaschen) tragen(aufbau.spiel, aufbau.ninkasi, "flasche", flaschen);
  return { ...aufbau, trockenbier: trockenbierIm(aufbau.spiel, aufbau.ninkasi)[0] };
}

test("Abfüllen: die Würze ohne Gärung und ohne Alkohol, je Portion ein Stück ohne Gefäß, ohne Kultur", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 4);
  const vorschau = sudVorbereiten(spiel, ninkasi, ZWEI_TROCKENBIER(malz));
  assert.equal(vorschau.art, "trockenbier");
  assert.deepEqual(vorschau.bereich.alkohol, [0, 0]);
  assert.equal(befehlGeben(spiel, ZWEI_TROCKENBIER(malz)).ok, true, "ohne Flaschen");
  const [stueck] = trockenbierIm(spiel, ninkasi);
  assert.equal(stueck.anzahl, 2);
  assert.equal(entitaetMitId(spiel.zustand, malz.id), null, "das Malz ist verbraucht");
  // 4 x 80 / 2 = 160 °P/10, Farbe 8 gerundet auf 10, Süße 20 + 10 aus der warmen Maische
  assert.deepEqual(stueck.trockenbier, { wuerze: { stammwuerze: 160, alkohol: 0, bittere: 0, farbe: 10, malz: 80, roest: 0, frucht: 0, kraeuter: 0, saeure: 0, suesse: 30 }, maische: "warm" });
  assert.equal(stueck.verdirbt.nach, TROCKENBIER.haltbarkeit);
  assert.ok(meldungen.some((meldung) => meldung.art === "abgefuellt_trocken" && meldung.anzahl === 2));
  const mitKultur = befehlGeben(spiel, { ...ZWEI_TROCKENBIER(malz), kultur: "hefe" });
  assert.equal(mitKultur.grund, "ungueltig", "die Kultur kommt erst beim Anrühren");
  const malzNeu = tragen(spiel, ninkasi, "malz", 4);
  assert.equal(befehlGeben(spiel, { ...ZWEI_TROCKENBIER(malzNeu), abfuellen: "fass" }).grund, "ungueltig");
});

test("Anrühren: die Kultur vergärt die Würze wie ein Sud; Gefäß und ein Stück sind verbraucht, das Zielgebiet aufgedeckt", () => {
  const { spiel, ninkasi, meldungen, trockenbier } = mitTrockenbier();
  assert.equal(befehlGeben(spiel, { art: "anruehren", gegenstandId: trockenbier.id, kultur: "hefe" }).ok, true);
  assert.equal(trockenbier.anzahl ?? 1, 1, "ein Stück bleibt");
  const getraenk = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).find((gegenstand) => gegenstand.sud);
  // Vergärung 75 - 10 (warm) = 65 %, Alkohol 160 x 65 % x 50 % = 52, gerundet 50; Frucht aus der Hefe
  assert.deepEqual(getraenk.sud.profil, { stammwuerze: 160, alkohol: 50, bittere: 0, farbe: 10, malz: 80, roest: 0, frucht: 10, kraeuter: 0, saeure: 0, suesse: 30 });
  assert.equal(getraenk.sud.zielgebiet, "helles");
  assert.equal(getraenk.sud.stufe, "frisch");
  assert.equal(getraenk.wirdZu, "flasche");
  assert.ok(!ninkasi.inventar.some((id) => entitaetMitId(spiel.zustand, id)?.gefaess), "die Flasche ist gefüllt");
  assert.ok(meldungen.some((meldung) => meldung.art === "angeruehrt_getroffen" && meldung.zielgebiet === "helles"));
  assert.ok(spiel.zustand.wissen.zielgebiete.includes("helles"));
});

test("Anrühren: Ablehnungen ohne Trockenbier, Gefäß, Kultur oder Flora", () => {
  const ohneFlasche = mitTrockenbier(0);
  assert.equal(befehlGeben(ohneFlasche.spiel, { art: "anruehren", gegenstandId: ohneFlasche.trockenbier.id, kultur: "hefe" }).grund, "keine_gefaesse");
  const { spiel, ninkasi, trockenbier } = mitTrockenbier();
  const flasche = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).find((gegenstand) => gegenstand.gefaess);
  const grund = (befehl) => befehlGeben(spiel, { art: "anruehren", gegenstandId: trockenbier.id, ...befehl }).grund;
  assert.equal(grund({ gegenstandId: flasche.id, kultur: "hefe" }), "kein_trockenbier");
  assert.equal(grund({ kultur: "kveik" }), "kultur_unbekannt");
  assert.equal(grund({ kultur: "spontan" }), "keine_flora");
  assert.equal(grund({}), "ungueltig");
});

test("Muffig: nach der Haltbarkeit einmal muffig, angerührt ein verdorbener Sud", () => {
  const { spiel, ninkasi, meldungen, trockenbier } = mitTrockenbier();
  weltLaufenLassen(spiel, TROCKENBIER.haltbarkeit + 100);
  const [muffig] = trockenbierIm(spiel, ninkasi);
  assert.equal(muffig.trockenbier.muffig, true);
  assert.deepEqual(muffig.adjektive, ["adjektiv.muffig"]);
  assert.equal(muffig.verdirbt, undefined, "es verdirbt nicht weiter");
  assert.ok(meldungen.some((meldung) => meldung.art === "verdorben"));
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  assert.deepEqual(befehlGeben(spiel, { art: "anruehren", gegenstandId: muffig.id, kultur: "hefe" }), { ok: true });
  assert.ok(ninkasi.inventar.some((id) => entitaetMitId(spiel.zustand, id)?.typ === "sud_verdorben"));
  assert.ok(meldungen.some((meldung) => meldung.art === "angeruehrt_verdorben"));
  assert.ok(trockenbier);
});

test("Rezept: ein Trockenbier nach Rezept merkt es sich, der Kniff wirkt nur mit der Kultur des Rezepts", () => {
  const { spiel, ninkasi } = spielBauen();
  spiel.zustand.rezepte = { helles_rezept: { art: "gefunden", zielgebiet: "helles", portionen: 1, zutaten: [{ typ: "malz", menge: 2 }], verfahren: { maische: "warm", gewuerz: "frueh" }, kultur: "hefe", punkt: {}, guete: 100, gelungen: false } };
  const malz = tragen(spiel, ninkasi, "malz", 4);
  assert.equal(befehlGeben(spiel, ZWEI_TROCKENBIER(malz)).ok, true);
  const [stueck] = trockenbierIm(spiel, ninkasi);
  assert.equal(stueck.trockenbier.rezept, "helles_rezept");
  tragen(spiel, ninkasi, "flasche", 2);
  const sude = () => ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand?.sud);
  assert.equal(befehlGeben(spiel, { art: "anruehren", gegenstandId: stueck.id, kultur: "schwach" }).ok, true);
  assert.equal(sude()[0].sud.rezept, undefined, "andere Kultur: kein Kniff");
  assert.equal(befehlGeben(spiel, { art: "anruehren", gegenstandId: trockenbierIm(spiel, ninkasi)[0].id, kultur: "hefe" }).ok, true);
  assert.ok(sude().some((getraenk) => getraenk.sud.rezept === "helles_rezept"), "mit der Kultur des Rezepts");
  assert.equal(spiel.zustand.rezepte.helles_rezept.gelungen, false, "EP und Gelingen gibt es nur am Kessel");
});

test("Zeit: im Kampf erst ab Schnellsud 2, dann doppelt; Kveik zählt einen Tier höher; Hitze daneben beschleunigt", () => {
  const { spiel, ninkasi, trockenbier } = mitTrockenbier();
  const hefe = KULTUREN.hefe, kveik = KULTUREN.kveik;
  assert.equal(anruehrenZeit(spiel, ninkasi, hefe), 100, "außerhalb des Kampfes eine gewöhnliche Aktion");
  ninkasi.kampfZuletzt = spiel.zustand.zeit;
  assert.equal(anruehrenZeit(spiel, ninkasi, hefe), null);
  assert.equal(anruehrenVorbereiten(spiel, ninkasi, { gegenstandId: trockenbier.id, kultur: "hefe" }).grund, "im_kampf_anruehren");
  assert.equal(befehlGeben(spiel, { art: "anruehren", gegenstandId: trockenbier.id, kultur: "hefe" }).grund, "im_kampf_anruehren");
  ninkasi.kampfwerte = { schnellsud: 1 };
  assert.equal(schnellsudVon(spiel, ninkasi, kveik), 2);
  assert.equal(anruehrenZeit(spiel, ninkasi, kveik), 200, "mit Kveik erreicht Schnellsud 1 den Experten");
  ninkasi.kampfwerte = { schnellsud: 2 };
  assert.equal(anruehrenZeit(spiel, ninkasi, hefe), 200);
  assert.equal(anruehrenZeit(spiel, ninkasi, kveik), 100);
  ninkasi.kampfwerte = { schnellsud: 7 };
  assert.equal(anruehrenZeit(spiel, ninkasi, hefe), 100, "über dem höchsten Eintrag gilt der höchste");
  // eine Fackel daneben
  const warm = spielBauen({ karte: ["######", "#f.u.#", "#....#", "######"] });
  assert.equal(anruehrenZeit(warm.spiel, warm.ninkasi, hefe), 75);
});

test("Bedienung: Taste 5 im Braufenster füllt als Trockenbier ab; r im Inventar öffnet die Wahl der Kultur", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 4);
  const { zustand } = braufensterOeffnen(spiel);
  const trocken = brauTaste(zustand, { code: "Digit5" }, spiel).zustand;
  assert.equal(trocken.abfuellen, "trocken");
  const mitMalz = brauTaste(trocken, { code: "KeyA", zeichen: "a" }, spiel).zustand;
  const befehl = braubefehl(spiel, mitMalz);
  assert.equal(befehl.abfuellen, "trocken");
  assert.equal(befehl.kultur, null);
  assert.equal(brauTaste(trocken, { code: "Digit5" }, spiel).zustand.abfuellen, "gefaesse");
  assert.equal(befehlGeben(spiel, befehl).ok, true);
  assert.equal(entitaetMitId(spiel.zustand, malz.id)?.anzahl, 3);
  const [stueck] = trockenbierIm(spiel, ninkasi);
  const offen = inventarTaste({ gewaehlt: stueck.id }, "KeyR", spiel, "r");
  assert.deepEqual(offen.oeffnen, { art: "anruehren", zustand: { gegenstandId: stueck.id } });
  assert.deepEqual(inventarTaste({ gewaehlt: stueck.id }, "Enter", spiel).oeffnen, offen.oeffnen, "Enter rührt an");
  assert.deepEqual(kulturenZumAnruehren(spiel), ["hefe", "schwach"]);
  assert.deepEqual(anruehrenTaste({ gegenstandId: stueck.id }, { code: "KeyB", zeichen: "b" }, spiel), { zustand: null, befehl: { art: "anruehren", gegenstandId: stueck.id, kultur: "schwach" } });
  assert.deepEqual(anruehrenTaste({ gegenstandId: stueck.id }, { code: "KeyZ", zeichen: "z" }, spiel).zustand, { gegenstandId: stueck.id }, "ohne Kultur dort nichts");
  assert.equal(anruehrenTaste({ gegenstandId: stueck.id }, { code: "Escape" }, spiel).zustand, null);
});

test("Datenprüfung: Regeln des Trockenbiers, schnellsud der Kultur, hitze am Gelände", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "trockenbier"), "der Inhalt ist gültig");
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.trockenbier.gegenstand = "sud"; }, "regeln.brauen.trockenbier.gegenstand"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.trockenbier.haltbarkeit = 0; }, "regeln.brauen.trockenbier.haltbarkeit"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.trockenbier.anruehren.imKampf = { 3: 100 }; }, "braucht einen Eintrag für imKampfAb"));
  assert.ok(fehlerMit((roh) => { roh.kulturen.kveik.schnellsud = -1; }, "kulturen.kveik: schnellsud"));
  assert.ok(fehlerMit((roh) => { roh.gelaende.wandfackel.hitze = "heiß"; }, "gelaende.wandfackel: hitze"));
});
