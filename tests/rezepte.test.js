// Nebel und Rezeptbuch (src/systeme/rezepte.js): Vorwissen beim Start, Aufdecken, Zählregel und Vorwissen aus der
// Chronik (src/eingabe/chronik.js), Rezept lernen über die Tontafel, Erkennen nach dem Verhältnis, enge Vorschau, Kniff
// nur beim Treffer, EP beim ersten Gelingen, Hausrezepte, die Rezeptliste im Braufenster und die Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, meldungenMitschneiden, gegenstandTragen, lernendeSpielerin } from "./hilfen.js";
import { befehlGeben, datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { entitaetMitId, spielerin } from "../src/kern/zustand.js";
import sude from "../daten/sude.js";
import effekte from "../daten/effekte.js";
import zustaende from "../daten/zustaende.js";
import { wirkungBerechnen } from "../src/systeme/sud.js";
import { sudVorbereiten } from "../src/systeme/brauen.js";
import { nachRezept, aufgedeckteZielgebiete } from "../src/systeme/rezepte.js";
import { braufensterOeffnen, brauTaste, rezepteImBuch } from "../src/eingabe/brauen.js";
import { neueChronik, meldungZaehlen, vorwissenAusChronik } from "../src/eingabe/chronik.js";

const RAUM = ["######", "#..u.#", "#....#", "######"];
const GEGENSTAENDE = {
  ...sude,
  malz: { text: "g.malz", aufhebbar: true, stapelbar: true, gewicht: 500, zutat: { art: "grundstoff", extrakt: 80, farbe: 4, aromen: { malz: 80, suesse: 20 } } },
  kraut: { text: "g.kraut", aufhebbar: true, stapelbar: true, gewicht: 100, zutat: { art: "gewuerz", bitter: 20, aromen: { kraeuter: 100 } } },
  flasche: { text: "g.flasche", aufhebbar: true, stapelbar: true, gewicht: 400, gefaess: true },
  tafel: { text: "g.tafel", aufhebbar: true, gewicht: 300, lesbar: { effekt: "lerne_helles" } },
};
const ZIELGEBIETE = {
  weit: { text: "z.weit", familie: "test", spannen: { malz: [0, 100] } },
  helles: { text: "z.helles", familie: "test", spannen: { farbe: [0, 20], malz: [50, 100] }, bonus: 150 },
};
const WARM = { maische: "warm", gewuerz: "frueh" };
const REZEPTE = {
  helles_rezept: { text: "r.helles", zielgebiet: "helles", portionen: 2, zutaten: [{ typ: "malz", menge: 4 }], verfahren: WARM, kultur: "hefe", kniff: { bonus: 50 }, ep: 70 },
  // trifft mit Malz und Kraut das engere helle Bier, nicht sein eigenes Zielgebiet: kein Kniff
  weit_rezept: { text: "r.weit", zielgebiet: "weit", portionen: 1, zutaten: [{ typ: "malz", menge: 2 }, { typ: "kraut", menge: 1 }], verfahren: WARM, kultur: "hefe", kniff: { bonus: 50 }, ep: 30 },
};
const TEST_EFFEKTE = {
  ...effekte,
  lerne_helles: { schritte: [{ baustein: "rezept_lernen", rezept: "helles_rezept" }] },
  lerne_weit: { schritte: [{ baustein: "rezept_lernen", rezept: "weit_rezept" }] },
};

// unschaerfe 0: der Sud landet genau in der Mitte der Vorschau
function spielBauen({ unschaerfe = 0 } = {}) {
  const kessel = { kessel: { text: "g.kessel", kennung: "u", passierbar: false, durchsichtig: true, kessel: { portionen: 4, unschaerfe } } };
  const spiel = miniSpiel(RAUM, {
    gelaende: kessel, effekte: TEST_EFFEKTE, zustaende, gegenstaende: GEGENSTAENDE, zielgebiete: ZIELGEBIETE,
    kulturen: { hefe: { text: "k.hefe", vergaerung: 75, vertraegt: 90 } }, regeln: { brauen: { verderben: 0, schwach: { chance: 0, plus: 20 } } },
  });
  spiel.daten.rezepte = REZEPTE;
  const ninkasi = lernendeSpielerin(spiel, 2, 1);
  Object.assign(ninkasi, { inventar: [], kulturen: ["hefe"] });
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}
const tragen = (spiel, ninkasi, typ, anzahl = 1) => gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
const lernen = (spiel, ninkasi, effekt) => befehlGeben(spiel, { art: "lesen", gegenstandId: gegenstandTragen(spiel, ninkasi, { typ: "tafel", ...structuredClone(GEGENSTAENDE.tafel), lesbar: { effekt } }).id });
const brauen = (spiel, zutaten, zusatz = {}) => befehlGeben(spiel, { art: "brauen", zutaten, kultur: "hefe", verfahren: WARM, ...zusatz });
const getraenke = (spiel, ninkasi) => ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand.sud);

const DATEN = datenLaden(rohdaten, { texte });

test("Nebel: Vorwissen aus den Startoptionen, nur vorhandene Zielgebiete; allmächtig kennt alle; die Chronik zählt das Aufdecken", () => {
  const spiel = neuesSpiel(DATEN, 3, { vorwissen: { zielgebiete: ["dunkles_bier", "gibt_es_nicht", "dunkles_bier"] } });
  assert.deepEqual(aufgedeckteZielgebiete(spiel), ["dunkles_bier"]);
  assert.deepEqual(aufgedeckteZielgebiete(neuesSpiel(DATEN, 3)), [], "ohne Vorwissen im Nebel");
  assert.deepEqual(aufgedeckteZielgebiete(neuesSpiel(DATEN, 3, { spielart: "allmaechtig" })), Object.keys(DATEN.zielgebiete));

  const chronik = neueChronik();
  meldungZaehlen(chronik, spiel, { art: "zielgebiet_entdeckt", zielgebiet: { name: "starkes_bier" } });
  meldungZaehlen(chronik, spiel, { art: "zielgebiet_entdeckt", zielgebiet: { name: "starkes_bier" } });
  assert.equal(chronik.zaehler["entdeckt.starkes_bier"], 2);
  assert.deepEqual(vorwissenAusChronik(chronik), { zielgebiete: ["starkes_bier"] });
});

test("Rezept lernen: die Tontafel des Probeinhalts lehrt ein Rezept, deckt sein Zielgebiet auf, und es liegt darin", () => {
  const spiel = neuesSpiel(DATEN, 3);
  const ninkasi = spielerin(spiel.zustand);
  const tafel = gegenstandTragen(spiel, ninkasi, { typ: "tontafel_dunkles_bier", ...structuredClone(DATEN.gegenstaende.tontafel_dunkles_bier) });
  assert.equal(befehlGeben(spiel, { art: "lesen", gegenstandId: tafel.id }).ok, true);
  const rezept = spiel.zustand.rezepte.dunkles_bier;
  assert.deepEqual([rezept.art, rezept.zielgebiet, rezept.gelungen], ["gefunden", "dunkles_bier", false]);
  assert.ok(rezept.guete >= 80, `der bewährte Weg liegt gut im Zielgebiet (Güte ${rezept.guete})`);
  assert.deepEqual(aufgedeckteZielgebiete(spiel), ["dunkles_bier"]);
});

test("Nach Rezept: dasselbe Verhältnis zu den Portionen, gleiche Kultur und gleiches Verfahren", () => {
  const rezept = { ...REZEPTE.helles_rezept };
  const eingabe = (menge, portionen, zusatz = {}) => ({ zutaten: [{ typ: "malz", menge }], verfahren: WARM, kultur: "hefe", portionen, ...zusatz });
  assert.equal(nachRezept(rezept, eingabe(2, 1)), true);
  assert.equal(nachRezept(rezept, eingabe(6, 3)), true);
  assert.equal(nachRezept(rezept, { ...eingabe(0, 3), zutaten: [{ typ: "malz", menge: 4 }, { typ: "malz", menge: 2 }] }), true, "zwei Stapel derselben Art zählen zusammen");
  assert.equal(nachRezept(rezept, eingabe(3, 1)), false);
  assert.equal(nachRezept(rezept, eingabe(2, 1, { kultur: null })), false);
  assert.equal(nachRezept(rezept, eingabe(2, 1, { verfahren: { maische: "kuehl", gewuerz: "frueh" } })), false);
  assert.equal(nachRezept(rezept, { ...eingabe(2, 1), zutaten: [{ typ: "malz", menge: 2 }, { typ: "kraut", menge: 1 }] }), false);
});

test("Nach Rezept gebraut: enge Vorschau, Kniff beim Treffer, EP nur beim ersten Gelingen", () => {
  const { spiel, ninkasi, meldungen } = spielBauen({ unschaerfe: 100 });
  const malz = tragen(spiel, ninkasi, "malz", 8);
  tragen(spiel, ninkasi, "flasche", 4);
  const frei = sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "hefe", verfahren: WARM, portionen: 1 });
  assert.deepEqual([frei.rezept, frei.bereich.malz], [null, [72, 88]]);
  lernen(spiel, ninkasi, "lerne_helles");
  assert.ok(meldungen.some((meldung) => meldung.art === "rezept_gelernt"));
  assert.deepEqual(aufgedeckteZielgebiete(spiel), ["helles"]);
  const eng = sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: malz.id, menge: 2 }], kultur: "hefe", verfahren: WARM, portionen: 1 });
  assert.deepEqual([eng.rezept, eng.bereich.malz], ["helles_rezept", [78, 82]], "Unschärfe 8 x 30 % = 2");
  assert.deepEqual(eng.erreichbar, ["helles"], "nur Aufgedecktes ist erreichbar");

  const vorher = ninkasi.freieEp;
  brauen(spiel, [{ gegenstandId: malz.id, menge: 2 }], { portionen: 1 });
  const [bier] = getraenke(spiel, ninkasi);
  assert.deepEqual([bier.sud.zielgebiet, bier.sud.rezept], ["helles", "helles_rezept"]);
  assert.equal(ninkasi.freieEp, vorher + 70);
  assert.ok(spiel.zustand.rezepte.helles_rezept.gelungen);
  const mitKniff = wirkungBerechnen(spiel.daten, bier.sud), ohneKniff = wirkungBerechnen(spiel.daten, { ...bier.sud, rezept: undefined });
  assert.ok(mitKniff.mengen.lp > ohneKniff.mengen.lp, "der Kniff hebt das Budget");
  brauen(spiel, [{ gegenstandId: ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).find((g) => g.typ === "malz").id, menge: 2 }], { portionen: 1 });
  assert.equal(ninkasi.freieEp, vorher + 70, "das zweite Gelingen bringt nichts");
  assert.equal(spiel.zustand.rezepte["haus:helles"], undefined, "nach einem gefundenen Rezept entsteht kein Hausrezept");
});

test("Kniff nur, wenn der Sud das Zielgebiet seines Rezepts trifft", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 2), kraut = tragen(spiel, ninkasi, "kraut");
  tragen(spiel, ninkasi, "flasche");
  lernen(spiel, ninkasi, "lerne_weit");
  const vorher = ninkasi.freieEp;
  brauen(spiel, [{ gegenstandId: malz.id, menge: 2 }, { gegenstandId: kraut.id, menge: 1 }], { portionen: 1 });
  const [bier] = getraenke(spiel, ninkasi);
  assert.deepEqual([bier.sud.zielgebiet, bier.sud.rezept], ["helles", undefined], "das engere helle Bier gewinnt");
  assert.equal(ninkasi.freieEp, vorher);
  assert.equal(spiel.zustand.rezepte.weit_rezept.gelungen, false);
});

test("Hausrezept: ein freier Treffer kommt ins Buch, ein besserer ersetzt ihn, ein schlechterer nicht", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  tragen(spiel, ninkasi, "flasche", 3);
  const malzUndKraut = () => {
    const malz = tragen(spiel, ninkasi, "malz", 2), kraut = tragen(spiel, ninkasi, "kraut");
    return [{ gegenstandId: malz.id, menge: 2 }, { gegenstandId: kraut.id, menge: 1 }];
  };
  brauen(spiel, malzUndKraut(), { portionen: 1 });
  const erstes = spiel.zustand.rezepte["haus:helles"];
  assert.deepEqual([erstes.art, erstes.portionen, erstes.zutaten], ["haus", 1, [{ typ: "malz", menge: 2 }, { typ: "kraut", menge: 1 }]]);
  assert.ok(meldungen.some((meldung) => meldung.art === "hausrezept" && meldung.zielgebiet.name === "helles"));
  assert.deepEqual(aufgedeckteZielgebiete(spiel), ["helles"], "der Treffer deckt sein Zielgebiet auf");
  assert.ok(meldungen.some((meldung) => meldung.art === "zielgebiet_entdeckt" && meldung.wie === "getroffen"));

  const malz = tragen(spiel, ninkasi, "malz", 2);
  brauen(spiel, [{ gegenstandId: malz.id, menge: 2 }], { portionen: 1 });
  const besser = spiel.zustand.rezepte["haus:helles"];
  assert.ok(besser.guete > erstes.guete);
  assert.deepEqual(besser.zutaten, [{ typ: "malz", menge: 2 }]);
  assert.ok(meldungen.some((meldung) => meldung.art === "hausrezept_besser"));

  brauen(spiel, malzUndKraut(), { portionen: 1 });
  assert.deepEqual(spiel.zustand.rezepte["haus:helles"].zutaten, [{ typ: "malz", menge: 2 }], "das schlechtere ersetzt nichts");
  assert.equal(sudVorbereiten(spiel, ninkasi, { zutaten: [{ gegenstandId: tragen(spiel, ninkasi, "malz", 4).id, menge: 4 }], kultur: "hefe", verfahren: WARM, portionen: 2 }).rezept, "haus:helles", "nach Hausrezept");
});

test("Braufenster: Tab zeigt die Rezepte, ein Buchstabe verteilt die Zutaten für passende Portionen", () => {
  const { spiel, ninkasi } = spielBauen();
  const malz = tragen(spiel, ninkasi, "malz", 5);
  tragen(spiel, ninkasi, "flasche", 3);
  lernen(spiel, ninkasi, "lerne_helles");
  let { zustand } = braufensterOeffnen(spiel);
  assert.equal(zustand.portionen, 3);
  zustand = brauTaste({ ...zustand, kultur: null, maische: "kuehl" }, { code: "Tab" }, spiel).zustand;
  assert.equal(zustand.liste, "rezepte");
  assert.deepEqual(rezepteImBuch(spiel).map(([schluessel]) => schluessel), ["helles_rezept"]);
  zustand = brauTaste(zustand, { code: "KeyA", zeichen: "a" }, spiel).zustand;
  assert.deepEqual([zustand.liste, zustand.portionen, zustand.mengen[malz.id], zustand.kultur, zustand.maische], ["zutaten", 3, 5, "hefe", "warm"], "3 Portionen brauchen 6, da sind nur 5");
  assert.equal(sudVorbereiten(spiel, ninkasi, { art: "brauen", ...zustandBefehl(zustand, malz) }).rezept, null, "mit 5 von 6 nicht nach Rezept");
  zustand = brauTaste({ ...zustand, portionen: 2, liste: "rezepte" }, { code: "KeyA", zeichen: "a" }, spiel).zustand;
  assert.deepEqual([zustand.portionen, zustand.mengen[malz.id]], [2, 4]);
  assert.equal(sudVorbereiten(spiel, ninkasi, zustandBefehl(zustand, malz)).rezept, "helles_rezept");
});
const zustandBefehl = (zustand, malz) => ({ zutaten: [{ gegenstandId: malz.id, menge: zustand.mengen[malz.id] }], kultur: zustand.kultur, verfahren: { maische: zustand.maische, gewuerz: zustand.gewuerz }, portionen: zustand.portionen });

test("Datenprüfung: Rezepte und der Baustein rezept_lernen", () => {
  const fehlerMit = (aendern, teil) => {
    const roh = structuredClone(rohdaten);
    aendern(roh);
    return vorbereiten(roh).fehler.some((meldung) => meldung.includes(teil));
  };
  assert.ok(!fehlerMit(() => {}, "rezepte"), "der Inhalt ist gültig");
  assert.ok(fehlerMit((roh) => { roh.rezepte.dunkles_bier.zielgebiet = "fremd"; }, "rezepte.dunkles_bier: Zielgebiet"));
  assert.ok(fehlerMit((roh) => { roh.rezepte.dunkles_bier.kultur = "fremd"; }, "rezepte.dunkles_bier: Kultur"));
  assert.ok(fehlerMit((roh) => { roh.rezepte.dunkles_bier.portionen = 0; }, "rezepte.dunkles_bier: portionen"));
  assert.ok(fehlerMit((roh) => { roh.rezepte.dunkles_bier.zutaten.push({ typ: "dolch", menge: 1 }); }, "\"dolch\" ist keine Zutat"));
  assert.ok(fehlerMit((roh) => { roh.rezepte.dunkles_bier.kniff = { bonus: -5 }; }, "rezepte.dunkles_bier: kniff"));
  assert.ok(fehlerMit((roh) => { roh.effekte.rezept_dunkles_bier.schritte[0].rezept = "fremd"; }, "Rezept \"fremd\""));
  assert.ok(fehlerMit((roh) => { roh.regeln.brauen.rezeptUnschaerfe = 120; }, "regeln.brauen.rezeptUnschaerfe"));
});
