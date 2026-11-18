// Zustände, die Verhalten ändern: Befehl verändern, handlungsunfähig, KI und Fraktion überlagern
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme, Zustände und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar } from "./hilfen.js";
import { befehlGeben, warteschlangeAbarbeiten } from "../src/kern/spiel.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { fraktionVon, kiVon } from "../src/kern/zustand.js";
import { zustandSetzen } from "../src/systeme/zustaende.js";
import { feindlich } from "../src/systeme/kampf.js";

const GANG = ["#####", "#...#", "#####"];
const RAUM = [
  "#########",
  "#.......#",
  "#.......#",
  "#.......#",
  "#########",
];

const EFFEKTE = {
  stoss: { schritte: [{ baustein: "schaden", menge: 3 }] },
};

const ZUSTAENDE = {
  torkelnd: { text: "zustand.torkelnd", dauer: 1000, befehl: { veraenderer: "abweichen", chance: 100 } },
  verwirrt: { text: "zustand.verwirrt", dauer: 1000, befehl: { veraenderer: "abweichen", chance: 100, freundeAngreifen: true } },
  leicht_verwirrt: { text: "zustand.verwirrt", dauer: 1000, verlauf: "abklingend", befehl: { veraenderer: "abweichen", chance: 100 } },
  betaeubt: { text: "zustand.betaeubt", dauer: 300, handlungsunfaehig: true },
  kontrolliert: { text: "zustand.kontrolliert", dauer: 500, fraktion: "urheber" },
  zwietracht: { text: "zustand.zwietracht", dauer: 500, fraktion: "eigene" },
  rasend: { text: "zustand.rasend", dauer: 500, ki: { modul: "jagen", trifft: "wesen" } },
  furcht: { text: "zustand.furcht", dauer: 250, ki: { modul: "fliehen" } },
};

const spielBauen = (karte = RAUM) => miniSpiel(karte, { effekte: EFFEKTE, zustaende: ZUSTAENDE });
const ANGRIFF = { trefferchance: 100, effekt: "stoss" };
const bakterium = (spiel, x, y, zusatz = {}) =>
  wesen(spiel, x, y, "verderber", 10, { ki: { modul: "jagen", letzteBekanntePosition: null }, sicht: { reichweite: 6 }, angriff: ANGRIFF, ...zusatz });

// Ninkasi ist am Zug
function ninkasiAmZug(spiel, x, y, zusatz = {}) {
  const ninkasi = spielerinSetzen(spiel, x, y);
  Object.assign(ninkasi, { angriff: ANGRIFF, sicht: { reichweite: 6 } }, zusatz);
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return ninkasi;
}

test("Torkeln im Gang: nur die Gegenrichtung ist frei, ein Freund dort zählt nicht als frei", () => {
  const spiel = spielBauen(GANG);
  const ninkasi = ninkasiAmZug(spiel, 2, 1);
  zustandSetzen(spiel, ninkasi, "torkelnd");
  assert.equal(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }).ok, true);
  assert.deepEqual(ninkasi.position, { x: 1, y: 1 }, "statt nach Osten nach Westen");

  const zweites = spielBauen(GANG);
  const torkelnde = ninkasiAmZug(zweites, 2, 1);
  const freundin = wesen(zweites, 1, 1, "ninkasi");
  zustandSetzen(zweites, torkelnde, "torkelnd");
  befehlGeben(zweites, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual([torkelnde.position, freundin.werte.lp.aktuell], [{ x: 3, y: 1 }, 10], "kein anderes Feld frei, also wie gewollt");
});

test("Verwirrt mit freundeAngreifen: das Ausweichfeld mit dem Freund wird angegriffen", () => {
  const spiel = spielBauen(GANG);
  const ninkasi = ninkasiAmZug(spiel, 2, 1);
  const freundin = wesen(spiel, 1, 1, "ninkasi");
  const meldungen = meldungenMitschneiden(spiel);
  zustandSetzen(spiel, ninkasi, "verwirrt");
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual([ninkasi.position, freundin.werte.lp.aktuell], [{ x: 2, y: 1 }, 7]);
  assert.ok(meldungen.some((meldung) => meldung.art === "abgewichen"));
  assert.equal(befehlGeben(spiel, { art: "warten" }).ok, true, "andere Befehle bleiben unverändert");
});

test("Die Chance des Abweichens skaliert mit der Stärke; im Verlauf sinkt sie bis 0", () => {
  const spiel = spielBauen();
  const ninkasi = ninkasiAmZug(spiel, 4, 2);
  const instanz = zustandSetzen(spiel, ninkasi, "leicht_verwirrt");
  Object.assign(instanz, { beginn: -1000, ende: 0 }); // am Ende des Verlaufs: Stärke 0 %, es wird nicht gewürfelt
  const zufallVorher = [...spiel.zustand.zufallszustand];
  befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(ninkasi.position, { x: 5, y: 2 });
  assert.deepEqual(spiel.zustand.zufallszustand, zufallVorher);
});

test("Handlungsunfähig: jede Eingabe wird angenommen, gemeldet und als warten ausgeführt, bis der Zustand endet", () => {
  const spiel = spielBauen();
  const ninkasi = ninkasiAmZug(spiel, 4, 2);
  const meldungen = meldungenMitschneiden(spiel);
  zustandSetzen(spiel, ninkasi, "betaeubt");
  for (let eingabe = 0; eingabe < 3; eingabe++) {
    assert.deepEqual(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }), { ok: true, handlungsunfaehig: true });
  }
  assert.equal(spiel.zustand.zeit, 300, "drei Züge zu je 100, dann endet die Betäubung");
  assert.deepEqual(ninkasi.position, { x: 4, y: 2 });
  assert.equal(meldungen.filter((meldung) => meldung.art === "handlungsunfaehig").length, 3);
  assert.deepEqual(befehlGeben(spiel, { art: "bewegen", dx: 1, dy: 0 }), { ok: true }, "bei 300 endet die Betäubung vor ihrem Zug");
  assert.deepEqual(ninkasi.position, { x: 5, y: 2 });
  assert.equal(spiel.befehle.length, 4, "auch die Eingaben während der Betäubung stehen im Spielstand");
});

test("Handlungsunfähige Gegner greifen nicht an", () => {
  const spiel = spielBauen();
  const ninkasi = ninkasiAmZug(spiel, 4, 2);
  const gegner = bakterium(spiel, 5, 2);
  akteurEinreihen(spiel.zustand, gegner.id, 0);
  zustandSetzen(spiel, gegner, "betaeubt");
  befehlGeben(spiel, { art: "warten" });
  assert.equal(ninkasi.werte.lp.aktuell, 100);
  befehlGeben(spiel, { art: "warten" });
  befehlGeben(spiel, { art: "warten" });
  befehlGeben(spiel, { art: "warten" });
  assert.ok(ninkasi.werte.lp.aktuell < 100, "nach der Betäubung greift er wieder an");
});

test("Psi-Kontrolle: das Bakterium wechselt zu Ninkasi und jagt seine Artgenossen, danach wieder sie", () => {
  const spiel = spielBauen();
  const ninkasi = ninkasiAmZug(spiel, 1, 2);
  const kontrolliert = bakterium(spiel, 4, 2);
  const artgenosse = bakterium(spiel, 6, 2);
  zustandSetzen(spiel, kontrolliert, "kontrolliert", { quelleId: ninkasi.id });
  assert.equal(fraktionVon(kontrolliert), "ninkasi");
  assert.ok(feindlich(kontrolliert, artgenosse) && !feindlich(kontrolliert, ninkasi));
  const jagen = holen("ki", "jagen");
  assert.deepEqual(jagen(spiel, kontrolliert, kiVon(kontrolliert)), { art: "bewegen", dx: 1, dy: 0 });
  assert.deepEqual(kontrolliert.ki.letzteBekanntePosition, { x: 6, y: 2 });
  kontrolliert.zustaende = undefined;
  assert.equal(fraktionVon(kontrolliert), "verderber");
  assert.deepEqual(jagen(spiel, kontrolliert, kiVon(kontrolliert)).dx, -1, "wieder hinter Ninkasi her");
});

test("Zwietracht: eigene Fraktion, mit allen verfeindet; greift den Nächsten an", () => {
  const spiel = spielBauen();
  ninkasiAmZug(spiel, 1, 2);
  const zerstritten = bakterium(spiel, 5, 2);
  const nachbar = bakterium(spiel, 6, 2);
  zustandSetzen(spiel, zerstritten, "zwietracht");
  assert.ok(feindlich(zerstritten, nachbar) && feindlich(nachbar, zerstritten));
  assert.deepEqual(holen("ki", "jagen")(spiel, zerstritten, kiVon(zerstritten)), { art: "bewegen", dx: 1, dy: 0, angreifen: true });
});

test("Rausch: die überlagerte KI jagt jedes Wesen, auch Verbündete; die eigene KI bleibt unberührt", () => {
  const spiel = spielBauen();
  ninkasiAmZug(spiel, 1, 2);
  const rasend = bakterium(spiel, 5, 2);
  const freund = bakterium(spiel, 6, 2);
  zustandSetzen(spiel, rasend, "rasend");
  const ueberlagert = kiVon(rasend);
  assert.notEqual(ueberlagert, rasend.ki);
  assert.deepEqual(holen("ki", "jagen")(spiel, rasend, ueberlagert), { art: "bewegen", dx: 1, dy: 0, angreifen: true });
  assert.equal(rasend.ki.letzteBekanntePosition, null);
  assert.equal(freund.werte.lp.aktuell, 10);
});

test("Furcht an Ninkasi: die KI übernimmt und flieht vor der Urheberin, danach wartet das Spiel wieder auf Eingaben", () => {
  const spiel = spielBauen();
  const ninkasi = ninkasiAmZug(spiel, 3, 2);
  const schreck = bakterium(spiel, 2, 2, { ki: undefined });
  zustandSetzen(spiel, ninkasi, "furcht", { quelleId: schreck.id });
  assert.equal(befehlGeben(spiel, { art: "warten" }).grund, "nicht_am_zug");
  warteschlangeAbarbeiten(spiel);
  assert.equal(spiel.zustand.zeit, 250, "Züge bei 0, 100 und 200, bei 250 endet die Furcht");
  assert.deepEqual(ninkasi.position, { x: 6, y: 1 }, "drei Schritte weg, jeweils auf das fernste Feld");
  assert.equal(befehlGeben(spiel, { art: "warten" }).ok, true);
});
