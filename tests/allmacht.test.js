// Spielart "allmaechtig" mit Testkammer (src/systeme/allmacht.js): Start in der Kammer, Erzeugen, Tiefe wählen,
// unverwundbar, Wiederholbarkeit, getrennte Wertung in der Chronik, Einträge der Befehlszeile
import { test } from "node:test";
import assert from "node:assert/strict";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { spielerin, entitaetMitId } from "../src/kern/zustand.js";
import { wertBegrenztAendern, hoechstwert } from "../src/kern/werte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { abstand, passierbar } from "../src/welt/karte.js";
import { erzeugbareTypen, istAllmaechtig } from "../src/systeme/allmacht.js";
import { neueChronik, meldungZaehlen, sichtungenZaehlen, laufEintragen, zaehlerstand, zaehltMit } from "../src/eingabe/chronik.js";
import { befehlseintraege } from "../src/eingabe/befehlszeile.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
const allmaechtig = (startwert = 7) => neuesSpiel(daten, startwert, { spielart: "allmaechtig" });

test("Allmacht: der Lauf beginnt in der Testkammer, die übrigen Tiefen sind die des normalen Laufs", () => {
  const spiel = allmaechtig();
  const normal = neuesSpiel(daten, 7);
  assert.ok(istAllmaechtig(spiel) && !istAllmaechtig(normal));
  assert.equal(spiel.zustand.tiefe, daten.regeln.allmacht.tiefe);
  assert.equal(spiel.zustand.ebene.name, "testkammer");
  assert.deepEqual(spiel.zustand.plan.tiefen.slice(1), normal.zustand.plan.tiefen.slice(1));
  assert.ok(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: daten.starttiefe }).ok);
  assert.deepEqual(spiel.zustand.ebene.felder, normal.zustand.ebene.felder, "dieselbe Ebene wie im normalen Lauf");
});

test("Allmacht: im normalen Lauf sind Erzeugen und Tiefe wählen abgelehnt", () => {
  const spiel = neuesSpiel(daten, 7);
  assert.deepEqual(befehlGeben(spiel, { art: "erzeugen", typ: "bier" }), { ok: false, grund: "nicht_allmaechtig" });
  assert.deepEqual(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: 2 }), { ok: false, grund: "nicht_allmaechtig" });
  assert.equal(spiel.befehle.length, 0);
});

test("Allmacht: Erzeugen setzt ein Wesen neben Ninkasi und legt einen Gegenstand ins Gepäck, ohne Zeit", () => {
  const spiel = allmaechtig();
  const ninkasi = spielerin(spiel.zustand);
  const { wesen, gegenstaende } = erzeugbareTypen(daten);
  assert.ok(!wesen.includes("ninkasi") && wesen.length && gegenstaende.length);
  const zeit = spiel.zustand.zeit, zuege = ninkasi.zuege ?? 0;
  const meldungen = [];
  hoererAnmelden(spiel, (meldung) => meldungen.push(meldung));

  assert.ok(befehlGeben(spiel, { art: "erzeugen", typ: wesen[0] }).ok);
  const erzeugt = meldungen.find((meldung) => meldung.art === "erzeugt");
  const neuesWesen = entitaetMitId(spiel.zustand, erzeugt.was.id);
  assert.equal(neuesWesen.typ, wesen[0]);
  assert.equal(abstand(neuesWesen.position, ninkasi.position), 1, "neben Ninkasi");
  if (neuesWesen.ki) assert.ok(spiel.zustand.warteschlange.some((eintrag) => eintrag.akteurId === neuesWesen.id), "eingereiht");

  const gepaeckVorher = ninkasi.inventar?.length ?? 0;
  assert.ok(befehlGeben(spiel, { art: "erzeugen", typ: gegenstaende[0] }).ok);
  assert.equal(ninkasi.inventar.length, gepaeckVorher + 1);
  assert.equal(entitaetMitId(spiel.zustand, ninkasi.inventar.at(-1)).typ, gegenstaende[0]);
  assert.equal(spiel.zustand.zeit, zeit, "ohne Zeit");
  assert.equal(ninkasi.zuege ?? 0, zuege);

  assert.deepEqual(befehlGeben(spiel, { art: "erzeugen", typ: "ninkasi" }), { ok: false, grund: "unbekannter_typ" });
  assert.deepEqual(befehlGeben(spiel, { art: "erzeugen", typ: "gibtesnicht" }), { ok: false, grund: "unbekannter_typ" });
});

test("Allmacht: Erzeugen setzt kein Wesen auf eine geschlossene Tür", () => {
  const spiel = allmaechtig();
  const ninkasi = spielerin(spiel.zustand);
  const ebene = spiel.zustand.ebene;
  // alle Nachbarfelder werden geschlossene Türen; das Wesen muss weiter weg auf ein offenes Feld
  const tuer = daten.gelaende.tuer_zu.kennung;
  for (let dy = -1; dy <= 1; dy++) {
    const y = ninkasi.position.y + dy;
    const zeile = ebene.felder[y].split("");
    for (let dx = -1; dx <= 1; dx++) if (dx || dy) zeile[ninkasi.position.x + dx] = tuer;
    ebene.felder[y] = zeile.join("");
  }
  const meldungen = [];
  hoererAnmelden(spiel, (meldung) => meldungen.push(meldung));
  assert.ok(befehlGeben(spiel, { art: "erzeugen", typ: "essigbakterium" }).ok);
  const neuesWesen = entitaetMitId(spiel.zustand, meldungen.find((meldung) => meldung.art === "erzeugt").was.id);
  assert.ok(passierbar(spiel, neuesWesen.position.x, neuesWesen.position.y), "nicht auf der Tür");
  assert.ok(abstand(neuesWesen.position, ninkasi.position) > 1);
});

test("Allmacht: Tiefe wählen wechselt in jede Tiefe des Plans", () => {
  const spiel = allmaechtig();
  assert.deepEqual(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: 0 }), { ok: false, grund: "schon_dort" });
  assert.deepEqual(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: daten.abfolge.length }), { ok: false, grund: "keine_tiefe" });
  assert.deepEqual(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: -1 }), { ok: false, grund: "keine_tiefe" });
  assert.deepEqual(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: "2" }), { ok: false, grund: "keine_tiefe" });
  const tiefste = daten.abfolge.length - 1;
  assert.ok(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: tiefste }).ok);
  assert.equal(spiel.zustand.tiefe, tiefste);
  assert.ok(befehlGeben(spiel, { art: "tiefe_waehlen", tiefe: 0 }).ok, "zurück in die Kammer");
  assert.equal(spiel.zustand.ebene.name, "testkammer");
});

test("Allmacht: Ninkasi stirbt nicht, die LP sind danach voll; im normalen Lauf stirbt sie", () => {
  for (const [spiel, ueberlebt] of [[allmaechtig(), true], [neuesSpiel(daten, 7), false]]) {
    const ninkasi = spielerin(spiel.zustand);
    const meldungen = [];
    hoererAnmelden(spiel, (meldung) => meldungen.push(meldung.art));
    wertBegrenztAendern(spiel, ninkasi, "lp", -10000);
    vorgangAbschliessen(spiel);
    assert.equal(spiel.zustand.vorbei, !ueberlebt);
    if (ueberlebt) {
      assert.equal(ninkasi.werte.lp.aktuell, hoechstwert(spiel, ninkasi, "lp"));
      assert.deepEqual(meldungen, ["allmacht_bewahrt"], "kein Tod gemeldet");
    } else assert.ok(meldungen.includes("tod"));
  }
});

test("Allmacht: Nachspielen ergibt denselben Zustand", () => {
  const spiel = allmaechtig(12);
  const { wesen, gegenstaende } = erzeugbareTypen(daten);
  const befehle = [
    { art: "erzeugen", typ: wesen.at(-1) }, { art: "erzeugen", typ: gegenstaende.at(-1) }, { art: "warten" },
    { art: "tiefe_waehlen", tiefe: 2 }, { art: "erzeugen", typ: wesen[0] }, { art: "warten" }, { art: "tiefe_waehlen", tiefe: 0 },
  ];
  for (const befehl of befehle) assert.ok(befehlGeben(spiel, befehl).ok, befehl.art);
  const nachgespielt = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
  assert.equal(nachgespielt.optionen.spielart, "allmaechtig");
  assert.deepEqual(nachgespielt.zustand, spiel.zustand);
});

test("Allmacht: die Chronik trägt den Lauf mit Spielart ein, zählt aber nicht mit", () => {
  const spiel = allmaechtig();
  const chronik = neueChronik();
  assert.ok(!zaehltMit(spiel) && zaehltMit(neuesSpiel(daten, 7)));
  hoererAnmelden(spiel, (meldung) => meldungZaehlen(chronik, spiel, meldung));
  befehlGeben(spiel, { art: "erzeugen", typ: erzeugbareTypen(daten).wesen[0] });
  sichtungenZaehlen(chronik, spiel, new Set());
  meldungZaehlen(chronik, spiel, { art: "tod", opfer: { id: spiel.zustand.spielerinId } });
  laufEintragen(chronik, spiel, { ergebnis: "aufgegeben", datum: 1, version: "test" });
  assert.equal(chronik.laeufe[0].spielart, "allmaechtig");
  assert.deepEqual(chronik.zaehler, {});
  assert.equal(zaehlerstand(chronik, "laeufe"), 0);
});

test("Allmacht: die Befehlszeile bietet Erzeugen und Tiefen nur im allmächtigen Lauf", () => {
  const ziele = (spiel) => befehlseintraege({ spiel, texte, belegung: {} }).filter((eintrag) => eintrag.ziel.befehl);
  assert.deepEqual(ziele(neuesSpiel(daten, 7)), []);
  const spiel = allmaechtig();
  const eintraege = ziele(spiel);
  const { wesen, gegenstaende } = erzeugbareTypen(daten);
  assert.equal(eintraege.length, wesen.length + gegenstaende.length + daten.abfolge.length);
  assert.ok(eintraege.every((eintrag) => eintrag.text && !eintrag.text.includes("undefined")));
  const tiefe = eintraege.find((eintrag) => eintrag.ziel.befehl.art === "tiefe_waehlen" && eintrag.ziel.befehl.tiefe === 2);
  assert.ok(befehlGeben(spiel, tiefe.ziel.befehl).ok);
});
