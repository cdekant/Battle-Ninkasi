// Reifen und Verderben gebrauter Sude (src/systeme/reifen.js), der Wurf mit drei Ausgängen und der Verderber aus dem
// Kessel (src/systeme/brauen.js), die wilde Flora der Ebene und die spontane Gärung (src/systeme/flora.js) und die
// Datenprüfung dazu.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, meldungenMitschneiden, gegenstandTragen, weltLaufenLassen, wesen } from "./hilfen.js";
import { befehlGeben, datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId, alleEntitaeten } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { ebeneWechseln } from "../src/systeme/ebenen.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import zustaende from "../daten/zustaende.js";
import { wirkungBerechnen } from "../src/systeme/sud.js";
import { sudVorbereiten } from "../src/systeme/brauen.js";
import { dauerDerStufen } from "../src/systeme/reifen.js";
import { braufensterOeffnen, brauTaste } from "../src/eingabe/brauen.js";

const RAUM = ["######", "#..u.#", "#....#", "######"];
const GEGENSTAENDE = {
  ...sude,
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 80, farbe: 4, aromen: { malz: 80, suesse: 20 } } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
};
const ZIELGEBIETE = { helles: { text: "z.helles", familie: "test", spannen: { farbe: [0, 20], malz: [50, 100] } } };
const KEIM = { text: "w.keim", fraktion: "verderber", werte: { lp: { grundwert: 5 } }, ki: { modul: "abwarten" } };
const WARM = { maische: "warm", gewuerz: "frueh" };

function spielBauen(regeln = {}) {
  const kessel = { kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { portionen: 4, unschaerfe: 0 } } };
  const spiel = miniSpiel(RAUM, {
    gelaende: kessel, effekte, zustaende, gegenstaende: GEGENSTAENDE, zielgebiete: ZIELGEBIETE, wesen: { keim: KEIM },
    kulturen: { hefe: { text: "k.hefe", vergaerung: 75, vertraegt: 90 } },
    regeln: { brauen: { verderben: 0, schwach: { chance: 0, plus: 20 }, verderber: { chance: 100, wesen: "keim" }, ...regeln } },
  });
  const ninkasi = wesen(spiel, 2, 1, "ninkasi", 100, { werte: werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100 }, pegel: { anfangswert: 0 } }), kulturen: ["hefe"], inventar: [] });
  spiel.zustand.spielerinId = ninkasi.id;
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}
const tragen = (spiel, ninkasi, typ, anzahl = 1) => gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
const getraenke = (spiel, ninkasi) => ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand.sud || gegenstand.typ === "essig");
// ein Sud aus menge Malz auf eine Portion
function brauen(spiel, ninkasi, menge = 2, zusatz = {}) {
  const malz = tragen(spiel, ninkasi, "malz", menge);
  tragen(spiel, ninkasi, "flasche");
  return befehlGeben(spiel, { art: "brauen", zutaten: [{ gegenstandId: malz.id, menge }], kultur: "hefe", verfahren: WARM, portionen: 1, ...zusatz });
}

test("Dauer der Stufen: Grund mal Zuschlag aus Achsen und Güte, höchstens bis zur Grenze", () => {
  const { spiel, ninkasi } = spielBauen();
  const sud = { profil: { stammwuerze: 160, alkohol: 50, bittere: 0, farbe: 10, malz: 80, roest: 0, frucht: 0, kraeuter: 0, saeure: 0, suesse: 30 }, guete: 90 };
  // Zuschlag 50 (Alkohol) + 27 (Güte 90 x 30 %) = 77, also 177 % von 30000
  assert.equal(dauerDerStufen(spiel, ninkasi, sud), 53100);
  assert.equal(dauerDerStufen(spiel, ninkasi, { ...sud, profil: { ...sud.profil, saeure: 100, bittere: 100 } }), 60000, "höchstens 200 %");
});

test("Stufen: frisch, reif nur für starke Sude, schal, sauer mit mehr Säure, danach Essig; der Name trägt die Stufe", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  brauen(spiel, ninkasi, 2);
  let [bier] = getraenke(spiel, ninkasi);
  assert.deepEqual([bier.sud.stufe, bier.adjektive], ["frisch", undefined]);
  const nach = bier.verdirbt.nach;
  assert.equal(bier.verdirbtUm, spiel.zustand.zeit + nach);
  const weiter = () => { weltLaufenLassen(spiel, getraenke(spiel, ninkasi)[0].verdirbtUm); return getraenke(spiel, ninkasi)[0]; };
  bier = weiter();
  assert.deepEqual([bier.sud.stufe, bier.adjektive], ["reif", ["adjektiv.reif"]], "16 °P sind stark genug");
  assert.ok(meldungen.some((meldung) => meldung.art === "verdorben" && meldung.wird.adjektive?.includes("adjektiv.reif")));
  bier = weiter();
  assert.equal(bier.sud.stufe, "schal");
  const saeure = bier.sud.profil.saeure;
  bier = weiter();
  assert.deepEqual([bier.sud.stufe, bier.sud.profil.saeure], ["sauer", saeure + 20]);
  bier = weiter();
  assert.deepEqual([bier.typ, bier.sud], ["essig", undefined], "am Ende Essig");

  const schwach = spielBauen();
  brauen(schwach.spiel, schwach.ninkasi, 1);
  const [duenn] = getraenke(schwach.spiel, schwach.ninkasi);
  weltLaufenLassen(schwach.spiel, duenn.verdirbtUm);
  assert.equal(getraenke(schwach.spiel, schwach.ninkasi)[0].sud.stufe, "schal", "8 °P überspringen die Reife");
});

test("Stufen: Portionen stapeln nur in derselben Stufe; die Wirkung folgt der Stufe", () => {
  const { spiel, ninkasi } = spielBauen();
  brauen(spiel, ninkasi, 2);
  weltLaufenLassen(spiel, getraenke(spiel, ninkasi)[0].verdirbtUm);
  // nach dem Laufenlassen der Welt ist Ninkasi wieder am Zug
  spiel.zustand.warteschlange = spiel.zustand.warteschlange.filter((eintrag) => eintrag.akteurId !== ninkasi.id);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  const zweiter = brauen(spiel, ninkasi, 2);
  assert.equal(zweiter.ok, true, JSON.stringify(zweiter));
  assert.deepEqual(getraenke(spiel, ninkasi).map((bier) => bier.sud.stufe), ["reif", "frisch"]);
  const [reif, frisch] = getraenke(spiel, ninkasi);
  const lp = (sud) => wirkungBerechnen(spiel.daten, sud).mengen.lp;
  assert.ok(lp(reif.sud) > lp(frisch.sud), "reif wirkt stärker");
  assert.equal(lp({ ...frisch.sud, stufe: "schal" }), Math.floor((lp(frisch.sud) * 80) / 100));
});

test("Wurf: ein schwacher Wurf macht den Sud sauer, ein verdorbener beginnt sauer und ruft einen Verderber", () => {
  const sauer = spielBauen({ schwach: { chance: 100, plus: 20 } });
  brauen(sauer.spiel, sauer.ninkasi, 2);
  const [saures] = getraenke(sauer.spiel, sauer.ninkasi);
  assert.deepEqual([saures.typ, saures.sud.profil.saeure, saures.sud.stufe], ["sud", 20, "frisch"]);

  const { spiel, ninkasi, meldungen } = spielBauen({ verderben: 100 });
  brauen(spiel, ninkasi, 2);
  const [verdorben] = getraenke(spiel, ninkasi);
  assert.deepEqual([verdorben.typ, verdorben.sud.stufe], ["sud_verdorben", "sauer"]);
  const keim = alleEntitaeten(spiel.zustand).find((entitaet) => entitaet.typ === "keim");
  assert.ok(keim, "ein Verderber entsteht");
  assert.ok(Math.abs(keim.position.x - 3) <= 1 && Math.abs(keim.position.y - 1) <= 1, "neben dem Kessel");
  assert.ok(meldungen.some((meldung) => meldung.art === "verderber_entsteht"));
  const vorschau = sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: tragen(spiel, ninkasi, "malz", 2).id, menge: 2 }], kultur: "hefe", verfahren: WARM, portionen: 1 });
  assert.ok(!vorschau.grund);

  const ohne = spielBauen({ verderben: 100, verderber: { chance: 100, wesen: null } });
  brauen(ohne.spiel, ohne.ninkasi, 2);
  assert.ok(!alleEntitaeten(ohne.spiel.zustand).some((entitaet) => entitaet.typ === "keim"), "ohne Wesen kein Verderber");
});

const DATEN = datenLaden(rohdaten, { texte });

test("Flora: jede erzeugte Ebene hat eine wilde Flora aus den Spannen, wiederholbar; der Hub hat keine", () => {
  const spiel = neuesSpiel(DATEN, 11), noch = neuesSpiel(DATEN, 11);
  const flora = spiel.zustand.ebene.flora, spontan = DATEN.regeln.brauen.spontan;
  assert.deepEqual(flora, noch.zustand.ebene.flora);
  assert.ok(flora.vergaerung >= spontan.vergaerung[0] && flora.vergaerung <= spontan.vergaerung[1]);
  assert.deepEqual(Object.keys(flora.aromen), Object.keys(spontan.aromen));
  ebeneWechseln(spiel, 0);
  assert.equal(spiel.zustand.ebene.flora, undefined);
});

test("Spontane Gärung: mit der Flora der Ebene, unschärfer; ohne Flora abgelehnt; im Fenster wählbar", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 2);
  tragen(spiel, ninkasi, "flasche");
  const befehl = { zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "spontan", verfahren: WARM, portionen: 1 };
  assert.equal(sudVorbereiten(spiel, ninkasi, befehl).grund, "keine_flora");
  spiel.zustand.ebene.flora = { vergaerung: 50, vertraegt: 30, verderben: 10, aromen: { saeure: 30 } };
  spiel.daten.gelaende.kessel.kessel.unschaerfe = 100;
  const vorschau = sudVorbereiten(spiel, ninkasi, befehl);
  // Vergärung 50 - 10 (warm), 160 x 40 % = 64 vergärbar, die Flora verträgt 3 %, also 60 vergoren
  assert.deepEqual([vorschau.mitte.alkohol, vorschau.gaerung.restzucker, vorschau.mitte.saeure], [30, 4, 30]);
  assert.deepEqual(vorschau.bereich.malz, [68, 92], "Unschärfe 8 x 150 % = 12");
  let { zustand } = braufensterOeffnen(spiel);
  zustand = brauTaste(zustand, { code: "Digit3" }, spiel).zustand;
  assert.equal(zustand.kultur, null);
  zustand = brauTaste(zustand, { code: "Digit3" }, spiel).zustand;
  assert.equal(zustand.kultur, "spontan");
  assert.equal(befehlGeben(spiel, { art: "brauen", ...befehl }).ok, true);
});

test("Datenprüfung: Stufen, Reifen, schwacher Wurf, Verderber, Essig und spontane Gärung", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "regeln.brauen"), "der Inhalt ist gültig");
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.stufen = []; }, "regeln.brauen.stufen"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.verdorben.stufe = "faul"; }, "regeln.brauen.verdorben.stufe"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.essig = "dolch"; }, "regeln.brauen.essig"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.reifen.gewichte.hopfen = 10; }, "Achse \"hopfen\""));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.schwach.chance = 120; }, "regeln.brauen.schwach"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.verderber.wesen = "fremd"; }, "regeln.brauen.verderber.wesen"));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.spontan.aromen.umami = [0, 10]; }, "Aromaachse \"umami\""));
  assert.ok(fehlerMit((roh) => { roh.kulturen.spontan = { ...roh.kulturen.bierhefe }; }, "der Name \"spontan\""));
  assert.ok(fehlerMit((roh) => { roh.kulturen.bierhefe.verderber = "fremd"; }, "Verderber \"fremd\""));
});
