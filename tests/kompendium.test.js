// Kompendium: Beschreibung der Inhalte (src/anzeige/beschreibung.js) und Lücken (werkzeuge/luecken.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { ARTEN, eintragsnamen, steckbrief, vorkommenVon, angriffKurz, modifikatorKurz, schrittKurz } from "../src/anzeige/beschreibung.js";
import { lueckenFinden } from "../werkzeuge/luecken.js";
import { quellenLaden, lueckenText } from "../werkzeuge/kompendium.js";

const { daten } = vorbereiten(rohdaten, { texte });

test("Kompendium: jede Art liefert für jeden Eintrag einen Steckbrief", () => {
  for (const art of Object.keys(ARTEN)) {
    for (const name of eintragsnamen(daten, art)) {
      const brief = steckbrief(daten, art, name);
      assert.equal(brief.name, name);
      assert.equal(typeof brief.merkmale, "object", `${art}.${name}`);
    }
  }
  assert.equal(steckbrief(daten, "wesen", "gibt_es_nicht"), null);
});

test("Kompendium: Steckbrief eines Wesens mit Werten, Angriffen, Vorlage und Vorkommen", () => {
  const brief = steckbrief(daten, "wesen", "essigbakterium");
  assert.equal(brief.text, "wesen.essigbakterium");
  assert.equal(brief.zeichen.zeichen, "e");
  const essigbakterium = rohdaten.wesen.essigbakterium;
  assert.deepEqual(brief.merkmale.werte, [`lp ${essigbakterium.werte.lp.grundwert}`]);
  assert.equal(brief.merkmale.fraktion, "verderber"); // aus der Vorlage bakterium
  assert.deepEqual(brief.merkmale.angriffe, [`biss ${essigbakterium.angriffe[0].genauigkeit} % → biss_klein`]);
  assert.ok(brief.merkmale.vorkommen.includes("keller 1–3"));
  assert.equal(steckbrief(daten, "wesen", "bakterium").abstrakt, true);
});

test("Kompendium: Kurzformen für Angriffe, Modifikatoren, Schritte und Vorkommen", () => {
  assert.equal(angriffKurz({ name: "hammer", genauigkeit: 70, effekt: "schlag", kosten: 150 }), "hammer 70 % → schlag, 150 Zeit");
  assert.equal(angriffKurz({ name: "faust", genauigkeit: 80, effekt: "schlag", kosten: 100 }), "faust 80 % → schlag");
  assert.equal(modifikatorKurz({ ziel: "ausweichen", art: "plus", betrag: -5 }), "ausweichen -5");
  assert.equal(modifikatorKurz({ ziel: "regeneration.lp", art: "prozent", betrag: 20, wenn: [{ bedingung: "traegt_tag" }] }), "regeneration.lp +20 % (wenn traegt_tag)");
  assert.equal(schrittKurz({ baustein: "schaden", art: "saeure", wuerfel: "1W4" }), "schaden art=saeure wuerfel=1W4");
  const testdaten = { populationen: { keller: [{ typ: "x", tiefe: [2, 2] }, { typ: "x", tiefe: [3, 5] }] }, arenen: { a: { wellen: [[{ typ: "x", anzahl: 1 }]] } } };
  assert.deepEqual(vorkommenVon(testdaten, "x"), ["keller 2", "keller 3–5", "arena a"]);
});

test("Kompendium: der Spielinhalt hat keine Lücke der Stufe Fehler", () => {
  const fehler = lueckenFinden(quellenLaden()).filter((luecke) => luecke.stufe === "fehler");
  assert.deepEqual(fehler, []);
});

test("Kompendium: Lücken in Daten, Tiles, Verweisen, Texten und Korpus werden gefunden", () => {
  const roh = {
    ...rohdaten,
    wesen: { ...rohdaten.wesen, geist: { ...rohdaten.wesen.essigbakterium } },
    effekte: { ...rohdaten.effekte, leer: { schritte: [] } },
    zeichen: { ...rohdaten.zeichen, wesen: { ...rohdaten.zeichen.wesen, geist: { zeichen: "g", farbe: "#ffffff" } } },
  };
  const tileset = { saetze: { 32: { geist: {}, fremd: {} }, 16: {} } };
  const luecken = lueckenFinden({
    rohdaten: roh,
    sprache: { texte: { ...texte, "wesen.alt": "Alt" } },
    tileset,
    korpus: [{ name: "a.md", kopf: { titel: "A", art: "falsch", vorlage: "v", nach: "n", lizenz: "l", quelle: "unbekannt" } }],
    literatur: [{ id: "bekannt" }],
  });
  const gefunden = (gruppe, ort) => luecken.find((luecke) => luecke.gruppe === gruppe && luecke.ort === ort);
  assert.equal(gefunden("daten", "effekte.leer").stufe, "fehler");
  assert.equal(gefunden("verweise", "wesen.geist").stufe, "warnung");
  assert.equal(gefunden("verweise", "effekte.leer").stufe, "warnung");
  assert.equal(gefunden("verweise", "wesen.essigbakterium"), undefined); // steht in einer Population
  assert.equal(gefunden("verweise", "wesen.ninkasi"), undefined); // verwendet der Code
  assert.equal(gefunden("verweise", "wesen.bakterium"), undefined); // Vorlage
  assert.match(gefunden("tiles", "wesen.geist").meldung, /Satz 16/);
  assert.match(gefunden("tiles", "wesen.essigbakterium").meldung, /kein Tile/);
  assert.ok(gefunden("tiles", "tile.fremd"));
  assert.ok(gefunden("texte", "wesen.alt"));
  assert.equal(gefunden("texte", "wesen.essigbakterium"), undefined);
  const korpus = luecken.filter((luecke) => luecke.gruppe === "korpus").map((luecke) => luecke.meldung);
  assert.equal(korpus.length, 2);
  assert.ok(korpus.some((meldung) => meldung.includes("falsch")) && korpus.some((meldung) => meldung.includes("unbekannt")));
});

test("Kompendium: die Textausgabe ordnet nach Gruppe und zählt die Fehler", () => {
  const zeilen = lueckenText([
    { gruppe: "tiles", stufe: "warnung", ort: "wesen.x", meldung: "kein Tile, nur Zeichen" },
    { gruppe: "daten", stufe: "fehler", ort: "effekte.y", meldung: "schritte fehlen" },
  ]);
  assert.deepEqual(zeilen, ["tiles (1)", "  wesen.x: kein Tile, nur Zeichen", "daten (1)", "  FEHLER effekte.y: schritte fehlen", "2 Lücken, davon 1 Fehler"]);
});

test("Kompendium: ein Schlüssel, der in einer Übersetzung fehlt, ist eine Lücke, beim Probeinhalt eine Warnung", () => {
  const luecken = lueckenFinden({
    rohdaten,
    sprache: { texte: { ...texte, "ui.neu": "Neu" } },
    probenamen: {},
    probentexte: ["wesen.essigbakterium"],
    uebersetzungen: { en: Object.fromEntries(Object.keys(texte).filter((schluessel) => schluessel !== "wesen.essigbakterium").map((schluessel) => [schluessel, texte[schluessel]])) },
  }).filter((luecke) => luecke.gruppe === "texte" && luecke.meldung === "fehlt in en");
  assert.deepEqual(luecken.map(({ ort, stufe }) => [ort, stufe]), [["wesen.essigbakterium", "warnung"], ["ui.neu", "fehler"]]);
});
