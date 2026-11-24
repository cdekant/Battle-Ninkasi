// Mehrere Ebenen: Start auf der Treppe, Wechsel, verlassene Ebenen ruhen, Hub, Population nach Tiefe;
// Plan des Laufs und Erzeugung in Schritten
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { anmelden, abmelden } from "../src/kern/register.js";
import { unerreichbareFelder } from "../src/welt/ebenenschritte.js";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { meldungenMitschneiden } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { spielerin, alleEntitaeten, istWesen } from "../src/kern/zustand.js";
import { indexPruefen } from "../src/kern/raumindex.js";
import { warteschlangeGueltig } from "../src/kern/zeit.js";
import { gelaendeAuf } from "../src/welt/karte.js";
import { eintraegeFuerTiefe } from "../src/welt/population.js";
import { ebeneWechseln } from "../src/systeme/ebenen.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { vorbereiten } from "../src/kern/daten.js";
import { rohdatenMitTesteintraegen } from "./hilfen.js";

const DATEN = datenLaden(rohdaten, { texte });
const treppeUnter = (spiel) => { const { x, y } = spielerin(spiel.zustand).position; return gelaendeAuf(spiel, x, y)?.treppe ?? null; };
const gegnerIds = (spiel) => alleEntitaeten(spiel.zustand).filter((entitaet) => istWesen(entitaet) && entitaet.id !== spiel.zustand.spielerinId).map((entitaet) => entitaet.id);

test("Das Spiel beginnt in der Starttiefe auf der Treppe hinauf", () => {
  const spiel = neuesSpiel(DATEN, 3);
  assert.equal(spiel.zustand.tiefe, 1);
  assert.equal(spiel.zustand.ebene.name, "keller");
  assert.equal(treppeUnter(spiel), "auf");
  assert.ok(gegnerIds(spiel).length >= rohdaten.ebenen.keller.population.anzahl[0], "mindestens so viele, wie die Ebene bestellt");
});

test("Hinauf in den Hub und zurück: die verlassene Ebene ruht und kommt unverändert wieder", () => {
  const spiel = neuesSpiel(DATEN, 3);
  spiel.daten = { ...DATEN, zustaende: { ...DATEN.zustaende, phantomtest_dauer: { text: "z.test", dauer: 100000 } } };
  const meldungen = meldungenMitschneiden(spiel);
  const gegner = gegnerIds(spiel);
  const einer = spiel.zustand.entitaeten[gegner[0]];
  zustandSetzen(spiel, einer, "phantomtest_dauer", {});
  const positionVorher = { ...einer.position };

  assert.equal(befehlGeben(spiel, { art: "treppe" }).ok, true);
  assert.equal(spiel.zustand.tiefe, 0);
  assert.equal(spiel.zustand.ebene.name, "hub");
  assert.equal(treppeUnter(spiel), "ab", "angekommen an der Treppe hinab");
  assert.deepEqual(gegnerIds(spiel), [], "der Hub ist leer");
  assert.ok(spiel.zustand.abgelegteEbenen[1]);
  assert.ok(!spiel.zustand.warteschlange.some((eintrag) => eintrag.art === "akteur" && gegner.includes(eintrag.akteurId)));
  assert.deepEqual(meldungen.find((meldung) => meldung.art === "ebene_gewechselt").tiefe, 0);

  for (let i = 0; i < 5; i++) befehlGeben(spiel, { art: "warten" });
  const endeVorher = spiel.zustand.abgelegteEbenen[1].entitaeten[einer.id].zustaende[0].ende;
  const zeitVorher = spiel.zustand.zeit;
  assert.equal(befehlGeben(spiel, { art: "treppe" }).ok, true);
  assert.equal(spiel.zustand.tiefe, 1);
  assert.equal(treppeUnter(spiel), "auf");
  assert.deepEqual(gegnerIds(spiel), gegner, "dieselben Wesen");
  assert.deepEqual(spiel.zustand.entitaeten[einer.id].position, positionVorher, "die Ebene hat geruht");
  assert.ok(spiel.zustand.entitaeten[einer.id].zustaende[0].ende > endeVorher, "das Ende des Zustands ist nachgerückt");
  assert.ok(spiel.zustand.warteschlange.every((eintrag) => eintrag.zeit >= zeitVorher), "nichts liegt in der Vergangenheit");
  assert.ok(warteschlangeGueltig(spiel.zustand));
  assert.deepEqual(indexPruefen(spiel.zustand), []);
  assert.deepEqual(spiel.zustand.abgelegteEbenen, { 0: spiel.zustand.abgelegteEbenen[0] });
});

test("Neue Tiefen werden erzeugt, je Startwert wiederholbar; die tiefste hat keine Treppe hinab", () => {
  const erste = neuesSpiel(DATEN, 8), zweite = neuesSpiel(DATEN, 8);
  ebeneWechseln(erste, 2);
  ebeneWechseln(zweite, 2);
  assert.equal(erste.zustand.ebene.felder.join("\n"), zweite.zustand.ebene.felder.join("\n"));
  assert.notEqual(erste.zustand.ebene.felder.join("\n"), erste.zustand.abgelegteEbenen[1].ebene.felder.join("\n"), "jede Tiefe eigen");
  assert.equal(treppeUnter(erste), "auf");
  assert.ok(erste.zustand.ebene.felder.join("").includes(">"));
  assert.ok(gegnerIds(erste).every((id) => erste.zustand.warteschlange.some((eintrag) => eintrag.akteurId === id)), "alle eingereiht");
  ebeneWechseln(erste, 3);
  assert.ok(!erste.zustand.ebene.felder.join("").includes(">"), "unter Tiefe 3 gibt es nichts");
});

test("Treppe: nur auf einer Treppe, nur für Ninkasi, nicht über die Abfolge hinaus; Nachspielen über Ebenen hinweg", () => {
  const spiel = neuesSpiel(DATEN, 5);
  befehlGeben(spiel, { art: "treppe" });
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.equal(befehlGeben(spiel, { art: "treppe" }).grund, "keine_treppe");
  befehlGeben(spiel, { art: "bewegen", dx: -1, dy: 0 });
  befehlGeben(spiel, { art: "treppe" });
  for (let i = 0; i < 3; i++) befehlGeben(spiel, { art: "warten" });
  const nachgespielt = nachspielen(DATEN, JSON.parse(JSON.stringify(spielstand(spiel))));
  assert.equal(JSON.stringify(nachgespielt.zustand), JSON.stringify(spiel.zustand));

  const hub = neuesSpiel(DATEN, 5);
  ebeneWechseln(hub, 0);
  hub.zustand.plan.tiefen = hub.zustand.plan.tiefen.slice(0, 1);
  assert.equal(befehlGeben(hub, { art: "treppe" }).grund, "keine_treppe", "ohne Tiefe darunter");
});

test("Population: gewichtet nach Tiefe, Rudel beieinander, Gegner aus der Tiefe, Affixe", () => {
  const tabelle = [{ typ: "a", gewicht: 10, tiefe: [1, 3] }, { typ: "b", gewicht: 2, tiefe: [1, 1] }, { typ: "c", gewicht: 5, tiefe: [2, 3] }];
  assert.deepEqual(eintraegeFuerTiefe(tabelle, 1).map((eintrag) => eintrag.typ), ["a", "b"]);
  assert.deepEqual(eintraegeFuerTiefe(tabelle, 3).map((eintrag) => eintrag.typ), ["a", "c"]);

  const roh = rohdatenMitTesteintraegen();
  roh.zustaende = { ...roh.zustaende, zaeh: { text: "zustand.zaeh" } };
  roh.populationen = { ...roh.populationen, test: [{ typ: "testwesen", gewicht: 1, tiefe: [3, 3], rudel: [3, 3], affixe: [{ zustand: "zaeh", chance: 100 }] }] };
  roh.ebenen.keller.population = { tabelle: "test", anzahl: [6, 6] };
  roh.regeln.population.tieferChance = 100;
  roh.regeln.population.tieferBis = 2;
  const spiel = neuesSpiel(datenLaden(roh, {}), 2);
  const gegner = gegnerIds(spiel).map((id) => spiel.zustand.entitaeten[id]);
  assert.equal(gegner.length, 6, "aus Tiefe 3 gezogen, obwohl die Ebene Tiefe 1 ist");
  assert.ok(gegner.every((wesen) => wesen.zustaende?.[0]?.name === "zaeh"));
  const [erste, zweite, dritte] = gegner;
  const abstand = (eins, zwei) => Math.max(Math.abs(eins.position.x - zwei.position.x), Math.abs(eins.position.y - zwei.position.y));
  assert.ok(abstand(erste, zweite) <= 2 && abstand(erste, dritte) <= 2, "ein Rudel steht beieinander");
});

test("Datenprüfung: Abfolge, Starttiefe, feste Karte, Population und Tabellen", () => {
  const pruefen = (aendern) => {
    const daten = rohdatenMitTesteintraegen();
    aendern(daten);
    return vorbereiten(daten).fehler;
  };
  const erwartet = [
    [(daten) => { daten.abfolge = ["hub", "atlantis"]; }, 'Ebene "atlantis"'],
    [(daten) => { daten.starttiefe = 9; }, "starttiefe"],
    [(daten) => { daten.ebenen.testkarte.karte = ["###", "#?#", "###"]; }, "unbekannte Kennungen ?"],
    [(daten) => { daten.ebenen.testkarte.karte = ["###", "#.", "###"]; }, "gleich langer Zeilen"],
    [(daten) => { daten.ebenen.testebene.population.tabelle = "zoo"; }, 'Tabelle "zoo"'],
    [(daten) => { daten.ebenen.testebene.population.anzahl = [9, 3]; }, "anzahl muss [min, max]"],
    [(daten) => { daten.populationen.testtabelle[0].tiefe = [3]; }, "tiefe muss [von, bis]"],
    [(daten) => { daten.populationen.testtabelle[0].gewicht = 0; }, "gewicht"],
    [(daten) => { daten.populationen.testtabelle[0].affixe = [{ zustand: "gibt_es_nicht", chance: 10 }]; }, 'Zustand "gibt_es_nicht"'],
    [(daten) => { daten.gelaende.testgelaende.treppe = "seitwaerts"; }, "treppe muss"],
    [(daten) => { daten.regeln.population.tieferChance = 120; }, "tieferChance"],
    [(daten) => { daten.regeln.ebenen.versuche = 0; }, "regeln.ebenen.versuche"],
    [(daten) => { daten.ebenen.testkarte.schritte = ["karte_fest", "zauberei", "ebene_anlegen"]; }, 'Ebenenschritt "zauberei" ist nicht angemeldet'],
    [(daten) => { daten.ebenen.testebene.schritte = ["karte_digger", "ebene_anlegen", "population"]; }, '"population" braucht freie_felder'],
    [(daten) => { daten.ebenen.testkarte.schritte = ["karte_fest", "ebene_anlegen", "erreichbarkeit"]; }, "muss vor dem Anlegen der Ebene stehen"],
    [(daten) => { daten.ebenen.testkarte.schritte = ["karte_fest", "erreichbarkeit"]; }, "kein Schritt legt die Ebene an"],
    [(daten) => { daten.regeln.ebenen.schritteFest = []; }, "regeln.ebenen.schritteFest (für ebenen.hub)"],
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});

// Fingerabdruck der Ebenen aus 0.32.0, vor der Erzeugung in Schritten: der Umbau ändert keine Ebene. Ändern neue
// Inhalte oder Regeln die Ebenen absichtlich, werden die Werte hier neu festgehalten. Neu festgehalten mit 0.39.0, weil
// die KI-Daten der Wesen das Format der Handlungen bekamen (ohne die KI gerechnet blieben die Werte gleich); neu mit
// 0.42.0 für zweck an Gegenständen, Ausstattung und die Handlung nutzen (ohne diese Felder blieben die Werte gleich);
// neu mit 0.50.0 für Wegpunkte, Wachzustand und Anführerin aus der Population und das Umherziehen (die Wesen ziehen
// schon beim Wechsel der Ebene; ohne diese Felder und ohne ihre Züge blieb die Erzeugung gleich); neu mit 0.52.0 für
// den dunklen Keller in Tiefe 2, die Laterne und sicht.imDunkeln an Ninkasi (mit der alten Abfolge, ohne Laterne und
// ohne imDunkeln blieben die Werte gleich); neu mit 0.58.0 für das Tempo Ninkasis (kosten am Wesen und an der Faust)
// und die Kosten der Waffen (mit den alten Kosten blieben die Werte gleich); neu mit 0.59.0 für den Sprint in Ninkasis
// Fähigkeiten und zeit und verlangsamung an der Ausrüstung (ohne diese Felder blieben die Werte gleich, auch mit dem
// Aufschlag der Türen); neu mit 0.60.0 für die Normierung von Essigbakterium und Fernkämpfer-Test (LP, EP, Biss; mit
// den alten Werten blieben die Werte gleich); neu mit 0.61.0 für die Sicht (Ninkasis Sichtweite 6, Sicht je Lichtstufe
// und sicht.imFinstern statt imDunkeln; mit Sichtweite 8, vollem Anteil und dem alten Namen blieben die Werte gleich);
// neu mit 0.62.0 für Ninkasis Stoffwechsel (Kurven nach der Norm, imKampf, kampfgewinn; mit den alten Daten des
// Stoffwechsels blieben die Werte gleich); neu mit 0.63.0 für Ninkasis Skala des Pegels (Kurven mal 4, Stufen,
// Strafen des Rauschs; mit dem alten Stoffwechsel blieben die Werte gleich); neu mit 0.64.0 für Glimmer, Filmriss und
// Gedankenstich an Ninkasi (ohne die drei blieben die Werte gleich).
test("Erzeugung in Schritten: dieselben Ebenen wie vorher", () => {
  const erwartet = { 1: "c43e9cb4980380e9", 2: "5955fbee3864f1cf", 3: "7926aaecf08ce239", 42: "b96e1c54aec0623f", 4711: "3607faa30fd80e8c" };
  for (const [startwert, fingerabdruck] of Object.entries(erwartet)) {
    const spiel = neuesSpiel(DATEN, Number(startwert));
    for (const tiefe of [2, 3, 0]) ebeneWechseln(spiel, tiefe);
    const { ebene, abgelegteEbenen, entitaeten } = spiel.zustand;
    // die Erinnerung der Karte (seit 0.37.0) ist Wissen Ninkasis und der Duft (seit 0.53.0) ihre Spur, beides nicht
    // Teil der Erzeugung, sie zählen nicht mit
    const ohneErinnerung = (karte) => { const { erinnerung, erinnerteDinge, duft, ...rest } = karte; return rest; };
    const abgelegt = Object.fromEntries(Object.entries(abgelegteEbenen).map(([tiefe, eintrag]) => [tiefe, { ...eintrag, ebene: ohneErinnerung(eintrag.ebene) }]));
    const ergebnis = createHash("sha256").update(JSON.stringify({ ebene: ohneErinnerung(ebene), abgelegt, entitaeten })).digest("hex").slice(0, 16);
    assert.equal(ergebnis, fingerabdruck, `Startwert ${startwert}`);
  }
});

test("Plan des Laufs: beim Start aus Startwert und Daten, eigene Planschritte erreichen die Ebenenschritte", () => {
  const spiel = neuesSpiel(DATEN, 7);
  assert.deepEqual(spiel.zustand.plan, { starttiefe: DATEN.starttiefe, tiefen: DATEN.abfolge.map((vorlage) => ({ vorlage, inhalte: [] })) });

  const planschritt = (planSpiel, plan, zufall) => { plan.tiefen[2].inhalte.push({ art: "testschatz", wurf: zufall[0] }); };
  const gesehen = [];
  const ebenenschritt = { braucht: ["ebene"], liefert: [], ausfuehren: (schrittSpiel, bau) => gesehen.push({ tiefe: bau.tiefe, inhalte: bau.planEintrag.inhalte }) };
  anmelden("planschritte", "testschatz", planschritt);
  anmelden("ebenenschritte", "testschatz", ebenenschritt);
  try {
    const roh = rohdatenMitTesteintraegen();
    for (const vorlage of new Set(roh.abfolge.slice(1))) roh.ebenen[vorlage].schritte = [...roh.regeln.ebenen.schritteErzeugt, "testschatz"];
    const daten = datenLaden(roh, {});
    const erste = neuesSpiel(daten, 7), zweite = neuesSpiel(daten, 7);
    assert.deepEqual(erste.zustand.plan, zweite.zustand.plan, "wiederholbar");
    assert.equal(erste.zustand.plan.tiefen[2].inhalte[0].art, "testschatz");
    ebeneWechseln(erste, 2);
    assert.deepEqual(gesehen.map((eintrag) => eintrag.tiefe), [1, 1, 2]);
    assert.equal(gesehen[2].inhalte[0].art, "testschatz", "die Ebene liest ihren Eintrag im Plan");
  } finally {
    abmelden("planschritte", "testschatz");
    abmelden("ebenenschritte", "testschatz");
  }
});

test("Schritte aus den Daten: eine Ebene ohne Population, Gegenstände und Fallen", () => {
  const roh = rohdatenMitTesteintraegen();
  roh.ebenen.keller.schritte = ["karte_digger", "tueren", "treppen", "gelaende_objekte", "erreichbarkeit", "ebene_anlegen"];
  const spiel = neuesSpiel(datenLaden(roh, {}), 3);
  assert.deepEqual(alleEntitaeten(spiel.zustand).map((entitaet) => entitaet.id), [spiel.zustand.spielerinId]);
  assert.equal(treppeUnter(spiel), "auf");
});

test("Erreichbarkeit: Inseln verwerfen den Versuch, der nächste würfelt neu; ohne Erfolg ein Fehler", () => {
  const insel = ["#####", "#.#.#", "#####"];
  const mitInsel = (zeilen) => zeilen.map((zeile) => [...zeile]);
  assert.deepEqual(unerreichbareFelder({ daten: DATEN }, mitInsel(insel), { x: 1, y: 1 }), [{ x: 3, y: 1 }]);
  assert.deepEqual(unerreichbareFelder({ daten: DATEN }, mitInsel(["#####", "#.+.#", "#####"]), { x: 1, y: 1 }), [], "Türen zählen als offen");
  assert.deepEqual(unerreichbareFelder({ daten: DATEN }, mitInsel(["####", "#.##", "##.#", "####"]), { x: 1, y: 1 }), [], "diagonal verbunden");

  const versuche = [];
  anmelden("ebenenschritte", "testkarte_insel", {
    braucht: [], liefert: ["karte", "treppen"],
    ausfuehren(spiel, bau) {
      versuche.push(bau.schluessel);
      bau.zeilen = mitInsel(bau.versuch === 1 ? insel : ["#####", "#...#", "#####"]);
      bau.treppen = { treppeAuf: null, treppeAb: { x: 1, y: 1 } };
    },
  });
  try {
    const roh = rohdatenMitTesteintraegen();
    roh.ebenen.testinsel = { breite: 10, hoehe: 10, gelaende: { wand: "wand", boden: "boden" }, schritte: ["testkarte_insel", "erreichbarkeit", "ebene_anlegen"] };
    roh.abfolge = ["testinsel"];
    roh.starttiefe = 0;
    const spiel = neuesSpiel(datenLaden(roh, {}), 1);
    assert.deepEqual(versuche, ["ebene.0.testinsel", "ebene.0.testinsel.versuch2"]);
    assert.equal(spiel.zustand.ebene.felder[1], "#...#");

    const immerInsel = rohdatenMitTesteintraegen();
    immerInsel.ebenen.inselkarte = { karte: insel };
    immerInsel.abfolge = ["inselkarte"];
    immerInsel.starttiefe = 0;
    assert.throws(() => neuesSpiel(datenLaden(immerInsel, {}), 1), /nach 10 Versuchen keine gültige Karte/);
  } finally {
    abmelden("ebenenschritte", "testkarte_insel");
  }
});
