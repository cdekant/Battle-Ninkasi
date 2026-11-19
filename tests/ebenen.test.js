// Mehrere Ebenen: Start auf der Treppe, Wechsel, verlassene Ebenen ruhen, Hub, Population nach Tiefe
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { meldungenMitschneiden } from "./hilfen.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { spielerin, alleEntitaeten, istWesen } from "../src/kern/zustand.js";
import { indexPruefen } from "../src/kern/raumindex.js";
import { warteschlangeGueltig } from "../src/kern/zeit.js";
import { gelaendeAuf } from "../src/welt/karte.js";
import { eintraegeFuerTiefe } from "../src/welt/ebene.js";
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
  hub.daten = { ...hub.daten, abfolge: ["hub"] };
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
  ];
  for (const [aendern, teilDerMeldung] of erwartet) assert.ok(pruefen(aendern).some((meldung) => meldung.includes(teilDerMeldung)), teilDerMeldung);
});
