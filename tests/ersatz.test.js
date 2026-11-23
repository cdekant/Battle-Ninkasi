import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Ersatzwirkungen an
import { miniSpiel, wesen, spielerinSetzen, gegenstandTragen, meldungenMitschneiden } from "./hilfen.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { zustandSetzen, hatZustand } from "../src/systeme/zustaende.js";

const KARTE = ["########", "#......#", "########"];

const EFFEKTE = {
  hieb: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 10 }] },
  durchschlag: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 10 }], tags: ["unblockbar"] },
  toedlich: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 500 }] },
  phoenix: { schritte: [{ baustein: "heilen", menge: 10 }] },
  funken: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 3 }] },
};

const ZUSTAENDE = {
  barriere: { text: "zustand.barriere", stapel: "aufaddieren", ersatz: [{ bei: "vor_schaden", verbrauchen: true }] },
  funkenbarriere: { text: "zustand.funkenbarriere", ersatz: [{ bei: "vor_schaden", effekt: "funken" }] },
  dornenbarriere: { text: "zustand.dornenbarriere", ersatz: [{ bei: "vor_schaden", ziel: "quelle", effekt: "funken" }] },
  feuerbarriere: { text: "zustand.feuerbarriere", ersatz: [{ bei: "vor_schaden", tag: "feuer", verbrauchen: true }] },
  leeres_versprechen: { text: "zustand.leeres_versprechen", ersatz: [{ bei: "vor_tod", verbrauchen: true }] },
};

function aufstellen() {
  const spiel = miniSpiel(KARTE, { effekte: EFFEKTE, zustaende: ZUSTAENDE });
  const ninkasi = spielerinSetzen(spiel, 1, 1);
  const feind = wesen(spiel, 2, 1, "feinde", 30);
  return { spiel, ninkasi, feind };
}

const treffen = (spiel, quelle, ziel, effekt = "hieb") => effektAnwenden(spiel, effekt, { quelleId: quelle.id, zielId: ziel.id });

test("Barriere: jeder Stapel fängt einen Treffer ganz ab, der letzte endet mit dem Grund verbraucht", () => {
  const { spiel, ninkasi, feind } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  zustandSetzen(spiel, ninkasi, "barriere");
  zustandSetzen(spiel, ninkasi, "barriere");
  treffen(spiel, feind, ninkasi);
  assert.equal(ninkasi.werte.lp.aktuell, 100);
  assert.equal(ninkasi.zustaende[0].stapel, 1);
  treffen(spiel, feind, ninkasi);
  assert.equal(ninkasi.werte.lp.aktuell, 100);
  assert.equal(hatZustand(ninkasi, "barriere"), false);
  assert.equal(meldungen.find((meldung) => meldung.art === "zustand_endet").grund, "verbraucht");
  treffen(spiel, feind, ninkasi);
  assert.equal(ninkasi.werte.lp.aktuell, 90);
  const gewirkt = meldungen.filter((meldung) => meldung.art === "ersatz_gewirkt");
  assert.deepEqual(gewirkt.map((meldung) => [meldung.haken, meldung.zustand, meldung.quelle.id]), [["vor_schaden", "barriere", feind.id], ["vor_schaden", "barriere", feind.id]]);
});

test("Barriere achtet unblockbar und verbraucht sich nicht an Schaden, den die Immunität schon auf 0 bringt", () => {
  const { spiel, ninkasi, feind } = aufstellen();
  zustandSetzen(spiel, ninkasi, "barriere");
  treffen(spiel, feind, ninkasi, "durchschlag");
  assert.equal(ninkasi.werte.lp.aktuell, 90, "unblockbar geht durch");
  ninkasi.immun = ["stumpf"];
  treffen(spiel, feind, ninkasi);
  assert.equal(hatZustand(ninkasi, "barriere"), true, "nach dem Widerstand: kein echter Schaden, keine Ersatzwirkung");
});

test("Ersatzwirkung mit Tag greift nur bei passender Schadensart oder passendem Tag", () => {
  const { spiel, ninkasi, feind } = aufstellen();
  zustandSetzen(spiel, ninkasi, "feuerbarriere");
  treffen(spiel, feind, ninkasi);
  assert.equal(ninkasi.werte.lp.aktuell, 90);
  effektAnwenden(spiel, "hieb", { quelleId: feind.id, zielId: ninkasi.id, tags: ["feuer"] });
  assert.equal(ninkasi.werte.lp.aktuell, 90);
  assert.equal(hatZustand(ninkasi, "feuerbarriere"), false);
});

test("Der Effekt einer Ersatzwirkung löst sie nicht wieder aus; Ziel quelle trifft die Angreiferin", () => {
  const { spiel, ninkasi, feind } = aufstellen();
  zustandSetzen(spiel, ninkasi, "funkenbarriere");
  treffen(spiel, feind, ninkasi);
  assert.equal(ninkasi.werte.lp.aktuell, 97, "die Funken treffen die Trägerin, die Barriere fängt sie nicht");
  assert.equal(hatZustand(ninkasi, "funkenbarriere"), true, "ohne verbrauchen bleibt sie");
  const zweites = aufstellen();
  zustandSetzen(zweites.spiel, zweites.ninkasi, "dornenbarriere");
  treffen(zweites.spiel, zweites.feind, zweites.ninkasi);
  assert.deepEqual([zweites.ninkasi.werte.lp.aktuell, zweites.feind.werte.lp.aktuell], [100, 27]);
});

test("Am Haken vor_tod: was nicht rettet, wird nicht verbraucht, die nächste Quelle der Kaskade rettet", () => {
  const { spiel, ninkasi } = aufstellen();
  const meldungen = meldungenMitschneiden(spiel);
  zustandSetzen(spiel, ninkasi, "leeres_versprechen");
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "phoenixbier", text: "gegenstand.phoenixbier", stapelbar: true, anzahl: 2, ersatz: [{ bei: "vor_tod", effekt: "phoenix", verbrauchen: true }] });
  effektAnwenden(spiel, "toedlich", { quelleId: null, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.vorbei, false);
  assert.equal(ninkasi.werte.lp.aktuell, 10);
  assert.equal(hatZustand(ninkasi, "leeres_versprechen"), true, "ohne Wirkung nicht verbraucht");
  assert.equal(bier.anzahl, 1, "ein Stück vom Stapel");
  assert.ok(!meldungen.some((meldung) => meldung.art === "tod"));
  assert.equal(meldungen.find((meldung) => meldung.art === "ersatz_gewirkt").was.id, bier.id);
});

test("Ohne Rettung stirbt das Wesen trotz Ersatzwirkung", () => {
  const { spiel, feind } = aufstellen();
  zustandSetzen(spiel, feind, "leeres_versprechen");
  effektAnwenden(spiel, "toedlich", { quelleId: null, zielId: feind.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.entitaeten[feind.id], undefined);
});

test("Ein angelegtes Amulett rettet nur angelegt und wird dabei verbraucht und abgelegt", () => {
  const { spiel, ninkasi } = aufstellen();
  gegenstandTragen(spiel, ninkasi, { typ: "lebensamulett", ausruestung: { platz: "hals", ersatz: [{ bei: "vor_tod", effekt: "phoenix", verbrauchen: true }] } });
  effektAnwenden(spiel, "toedlich", { quelleId: null, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(spiel.zustand.vorbei, true, "im Gepäck wirkt ausruestung.ersatz nicht");
  const zweites = aufstellen();
  const angelegt = gegenstandTragen(zweites.spiel, zweites.ninkasi, { typ: "lebensamulett", ausruestung: { platz: "hals", ersatz: [{ bei: "vor_tod", effekt: "phoenix", verbrauchen: true }] } });
  zweites.ninkasi.ausgeruestet = [angelegt.id];
  effektAnwenden(zweites.spiel, "toedlich", { quelleId: null, zielId: zweites.ninkasi.id });
  vorgangAbschliessen(zweites.spiel);
  assert.equal(zweites.ninkasi.werte.lp.aktuell, 10);
  assert.equal(zweites.spiel.zustand.entitaeten[angelegt.id], undefined);
  assert.deepEqual([zweites.ninkasi.ausgeruestet, zweites.ninkasi.inventar], [[], []]);
});

test("Eine eigene Ersatzwirkung des Wesens fällt beim Verbrauchen weg", () => {
  const { spiel, feind } = aufstellen();
  feind.ersatz = [{ bei: "vor_schaden", verbrauchen: true }];
  treffen(spiel, spiel.zustand.entitaeten[spiel.zustand.spielerinId], feind);
  assert.equal(feind.werte.lp.aktuell, 30);
  assert.equal(feind.ersatz, undefined);
});
