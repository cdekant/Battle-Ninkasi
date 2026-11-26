// Maus in Fenstern 0.31.0: "Klick ist Taste" (data-taste im HTML der Fenster), direkte Ziele (data-ziel, klick der
// Fensterarten), Knöpfe der Fußzeile, das × und die Standardhandlung des Inventars bei Enter
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js";
import { rohdaten, texteDe } from "../src/inhalt.js";
import grammatikDe from "../sprache/de/grammatik.js";
import vorgaben from "../src/eingabe/einstellungen.js";
import belegung from "../src/eingabe/belegung.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { spielerin } from "../src/kern/zustand.js";
import { gegenstandTragen } from "./hilfen.js";
import { fensterOeffnen, fensterTaste, fensterKlick } from "../src/eingabe/fenster.js";
import "../src/eingabe/inventar.js";
import "../src/eingabe/faehigkeiten.js";
import "../src/eingabe/hilfe.js";
import "../src/eingabe/menue.js";
import "../src/eingabe/verlauf.js";
import { charakterfensterOeffnen } from "../src/eingabe/charakter.js";
import { erstellungOeffnen } from "../src/eingabe/erstellung.js";
import { einstellungsfensterOeffnen, tastenZeilen } from "../src/eingabe/einstellungsfenster.js";
import { befehlszeileOeffnen } from "../src/eingabe/befehlszeile.js";
import { menueOeffnen, endeOeffnen } from "../src/eingabe/menue.js";
import { titelOeffnen, laeufeOeffnen } from "../src/eingabe/titel.js";
import { arenawahlOeffnen } from "../src/eingabe/arenawahl.js";
import { titelHtml } from "../src/anzeige/titel.js";
import { verlaufOeffnen } from "../src/eingabe/verlauf.js";
import { inventarTaste, inventarKlick } from "../src/eingabe/inventar.js";
import { leereAbweichungen } from "../src/eingabe/belegunganpassen.js";
import { neueLeisten, leistenNachfuehren } from "../src/eingabe/schnellleiste.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import "../src/anzeige/charakterfenster.js";
import "../src/anzeige/systemfenster.js";
import "../src/anzeige/einstellungsanzeige.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });

// Werte eines data-Attributs aus dem HTML (wie der Browser sie dem Hauptmodul gibt)
function attributwerte(html, name) {
  const werte = [];
  for (const treffer of html.matchAll(new RegExp(`data-${name}="([^"]*)"`, "g"))) werte.push(JSON.parse(treffer[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")));
  return werte;
}

function aufstellen() {
  const spiel = neuesSpiel(daten, 5);
  const ninkasi = spielerin(spiel.zustand);
  ninkasi.freieEp = 500;
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "bier", text: "gegenstand.bier", trinkbar: true });
  const helm = gegenstandTragen(spiel, ninkasi, { typ: "kupferhelm", text: "gegenstand.kupferhelm", ausruestung: { platz: "kopf" } });
  const plaetze = [{ vorschau: { tiefe: 2, zuege: 40, gespeichertAm: 1 } }, { grund: "version", version: "0.31.0" }, null];
  const umgebung = { spiel, daten, texte, belegung, belegungsVorgabe: belegung, abweichungen: leereAbweichungen(), einstellungen: vorgaben, vorgaben, leisten: leistenNachfuehren(spiel, neueLeisten()), logzeilen: [], version: "test", plaetze };
  return { spiel, ninkasi, bier, helm, umgebung };
}

const FENSTER = (daten) => [
  ["inventar", { gewaehlt: null }],
  ["faehigkeiten", { gewaehlt: null }],
  ["charakter", charakterfensterOeffnen()],
  ["erstellung", erstellungOeffnen(daten, null)],
  ["hilfe", {}],
  ["menue", menueOeffnen()],
  ["bestaetigung", { frage: "menue.neustart_frage", aktion: "neustart" }],
  ["verlauf", verlaufOeffnen()],
  ["einstellungen", einstellungsfensterOeffnen()],
  ["einstellungen", { ...einstellungsfensterOeffnen(), reiter: "tasten" }],
  ["befehlszeile", befehlszeileOeffnen()],
  ["laeufe", laeufeOeffnen("fortsetzen")],
  ["laeufe", laeufeOeffnen("ersetzen")],
  ["ende", endeOeffnen()],
  ["arenawahl", arenawahlOeffnen()],
  ["arenawahl", { ...arenawahlOeffnen(), automatisch: true }],
];

test("Jedes Fenster: data-taste und data-ziel lassen sich auslösen, ohne zu werfen; × außer bei der Erstellung", () => {
  const { umgebung } = aufstellen();
  for (const [art, zustand] of FENSTER(daten)) {
    const stapel = fensterOeffnen([], art, zustand);
    const html = fensterHtml(umgebung, stapel);
    const tasten = attributwerte(html, "taste");
    const ziele = attributwerte(html, "ziel");
    assert.ok(tasten.length + ziele.length > 0, `${art}: nichts klickbar`);
    assert.equal(tasten.some((taste) => taste.code === "Escape"), art !== "erstellung", `${art}: ×`);
    for (const taste of tasten) assert.ok(fensterTaste(stapel, taste, umgebung).stapel, `${art}: ${JSON.stringify(taste)}`);
    for (const ziel of ziele) assert.ok(fensterKlick(stapel, ziel, umgebung).stapel, `${art}: ${JSON.stringify(ziel)}`);
  }
});

test("Inventar: Klick wählt, der zweite Klick handelt; Enter trinkt bzw. legt an; Knöpfe passen zum Gegenstand", () => {
  const { spiel, bier, helm, umgebung } = aufstellen();
  const stelleVon = (id) => spielerin(spiel.zustand).inventar.indexOf(id);
  const gewaehlt = inventarKlick({ gewaehlt: null }, { stelle: stelleVon(helm.id) }, spiel, belegung).fenster;
  assert.deepEqual(gewaehlt, { gewaehlt: helm.id });
  assert.deepEqual(inventarKlick(gewaehlt, { stelle: stelleVon(bier.id) }, spiel, belegung).fenster, { gewaehlt: bier.id }, "andere Zeile wechselt die Auswahl");
  assert.deepEqual(inventarKlick(gewaehlt, { stelle: stelleVon(helm.id) }, spiel, belegung), { fenster: gewaehlt, befehl: { art: "anlegen", gegenstandId: helm.id } }, "legt an, das Fenster bleibt offen");
  assert.deepEqual(inventarTaste({ gewaehlt: bier.id }, "Enter", spiel).befehl, { art: "trinken", gegenstandId: bier.id });
  const html = fensterHtml(umgebung, fensterOeffnen([], "inventar", { gewaehlt: bier.id }));
  assert.match(html, /trinken/);
  assert.doesNotMatch(html, />anlegen</, "Bier legt man nicht an");
  assert.deepEqual(inventarKlick({ gewaehlt: null, absicht: "werfen" }, { stelle: stelleVon(bier.id) }, spiel, belegung).auswahl, { zweck: "werfen", gegenstandId: bier.id });
});

test("Charakter, Erstellung, Einstellungen und Befehlszeile: Klick wählt, der zweite wirkt wie Enter; − und + ändern", () => {
  const { umgebung } = aufstellen();
  const charakter = fensterOeffnen([], "charakter", charakterfensterOeffnen());
  assert.equal(fensterKlick(charakter, { stelle: 2 }, umgebung).stapel[0].zustand.gewaehlt, 2);
  assert.equal(fensterKlick(charakter, { stelle: 0 }, umgebung).befehl?.art, "lernen", "zweiter Klick verteilt");
  const erstellung = fensterOeffnen([], "erstellung", erstellungOeffnen(daten, null));
  const geaendert = fensterKlick(erstellung, { stelle: 1, aendern: -1 }, umgebung).stapel[0].zustand;
  assert.equal(geaendert.gewaehlt, 1);
  assert.notDeepEqual(geaendert.eigenschaften, erstellung[0].zustand.eigenschaften);
  const einstellungen = fensterOeffnen([], "einstellungen", einstellungsfensterOeffnen());
  assert.equal(fensterKlick(einstellungen, { reiter: "spiel" }, umgebung).stapel[0].zustand.reiter, "spiel");
  assert.equal(fensterKlick(einstellungen, { zeile: 1, schritt: 1 }, umgebung).einstellungen.oberflaecheGroesse, 16);
  assert.equal(fensterKlick(einstellungen, { zeile: 0 }, umgebung).einstellungen.layout, "b", "die schon gewählte Zeile schaltet um");
  const tasten = fensterOeffnen([], "einstellungen", { ...einstellungsfensterOeffnen(), reiter: "tasten" });
  const zeile = tastenZeilen().indexOf("inventar");
  const gewaehlt = fensterKlick(tasten, { zeile, tastenStelle: 0 }, umgebung).stapel;
  assert.equal(gewaehlt[0].zustand.aufnahme, false);
  assert.equal(fensterKlick(gewaehlt, { zeile, tastenStelle: 0 }, umgebung).stapel[0].zustand.aufnahme, true, "zweiter Klick nimmt auf");
  const befehlszeile = fensterOeffnen([], "befehlszeile", { eingabe: "hilf", gewaehlt: 0 });
  assert.deepEqual(fensterKlick(befehlszeile, { zeile: 0 }, umgebung).befehlszeile, { aktion: "hilfe" });
});

test("Titel: jedes data-taste und data-ziel der Titelebene lässt sich auslösen; Esc ist kein Klickziel", () => {
  const { umgebung } = aufstellen();
  const stapel = fensterOeffnen([], "titel", titelOeffnen());
  const html = titelHtml(umgebung, stapel);
  const tasten = attributwerte(html, "taste");
  const ziele = attributwerte(html, "ziel");
  assert.equal(tasten.length, 8, "acht Einträge mit zwei belegten Plätzen");
  assert.equal(ziele.length, 3, "drei Plätze");
  assert.ok(!tasten.some((taste) => taste.code === "Escape"));
  for (const taste of tasten) assert.ok(fensterTaste(stapel, taste, umgebung).stapel, JSON.stringify(taste));
  for (const ziel of ziele) assert.ok(fensterKlick(stapel, ziel, umgebung).stapel, JSON.stringify(ziel));
});
