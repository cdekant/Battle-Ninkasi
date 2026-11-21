// Speichern (kern/spiel.js schnappschuss und ausSchnappschuss, eingabe/speicherstand.js): ein Schnappschuss mitten im
// Lauf setzt genau so fort wie der echte Lauf; Version, kaputter Text und der Teil oberflaeche
import { test } from "node:test";
import assert from "node:assert/strict";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { datenLaden, neuesSpiel, befehlGeben, schnappschuss, ausSchnappschuss } from "../src/kern/spiel.js";
import { speicherstandText, speicherstandLesen, GESPEICHERTE_LOGZEILEN } from "../src/eingabe/speicherstand.js";
import { neueLeisten, leistenNachfuehren, leisteWechseln } from "../src/eingabe/schnellleiste.js";

const grammatik = erstelleGrammatik(grammatikDe);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });

// Feste Folge von Befehlen ohne Zufall des Tests: im Kreis gehen, warten, trinken
function befehlFuer(nummer) {
  const richtungen = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  if (nummer % 9 === 8) return { art: "warten" };
  const [dx, dy] = richtungen[Math.floor(nummer / 3) % richtungen.length];
  return { art: "bewegen", dx, dy };
}

test("Schnappschuss mitten im Lauf: als JSON gespeichert, geladen und fortgesetzt gleicht er dem echten Lauf", () => {
  const echt = neuesSpiel(daten, 31);
  for (let nummer = 0; nummer < 150 && !echt.zustand.vorbei; nummer++) befehlGeben(echt, befehlFuer(nummer));
  const geladen = ausSchnappschuss(daten, JSON.parse(JSON.stringify(schnappschuss(echt))));
  assert.deepEqual(geladen.befehle, echt.befehle);
  for (let nummer = 150; nummer < 300 && !echt.zustand.vorbei; nummer++) {
    const befehl = befehlFuer(nummer);
    assert.equal(befehlGeben(geladen, befehl).ok, befehlGeben(echt, befehl).ok);
  }
  assert.equal(JSON.stringify(geladen.zustand), JSON.stringify(echt.zustand));
});

test("Speicherstand: Spiel, Leisten und Log kommen zurück; andere Version und kaputter Text geben einen Grund", () => {
  const spiel = neuesSpiel(daten, 7);
  befehlGeben(spiel, { art: "warten" });
  const leisten = leisteWechseln(leistenNachfuehren(spiel, neueLeisten()), 1);
  const logzeilen = Array.from({ length: GESPEICHERTE_LOGZEILEN + 20 }, (_, nummer) => ({ zug: nummer, spalte: "geschehen", art: "geschehen", text: `Zeile ${nummer}`, anzahl: 1 }));
  const text = speicherstandText(spiel, { leisten, logzeilen });
  const gelesen = speicherstandLesen(daten, text);
  assert.equal(JSON.stringify(gelesen.spiel.zustand), JSON.stringify(spiel.zustand));
  assert.equal(gelesen.oberflaeche.leisten.aktiveLeiste, 1);
  assert.equal(gelesen.oberflaeche.log.length, GESPEICHERTE_LOGZEILEN, "nur die letzten Zeilen");
  assert.equal(gelesen.oberflaeche.log.at(-1).text, `Zeile ${GESPEICHERTE_LOGZEILEN + 19}`);
  const andereVersion = JSON.stringify({ ...JSON.parse(text), version: "0.0.1" });
  assert.deepEqual(speicherstandLesen(daten, andereVersion), { grund: "version", version: "0.0.1" });
  assert.deepEqual(speicherstandLesen(daten, "{kaputt"), { grund: "kaputt" });
  assert.deepEqual(speicherstandLesen(daten, "{}"), { grund: "kaputt" });
  const ohneLeisten = JSON.stringify({ ...JSON.parse(text), oberflaeche: {} });
  assert.deepEqual(speicherstandLesen(daten, ohneLeisten).oberflaeche, { leisten: neueLeisten(), log: [], gesehen: [] }, "fehlende Oberfläche wird frisch");
});
