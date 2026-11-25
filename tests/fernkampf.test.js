// Fernkampf (src/systeme/fernkampf.js) und die Änderungen am Werfen (src/systeme/werfen.js): Schuss aus dem Gepäck und
// aus dem Magazin, Nachladen, Auffüllen über die Zeit, Salve, Strahl, Wirkung der Munition, Lärm, Reichweite nach
// Gewicht, Streuung, KI-Handlungen, Fernangriff der Eingabe, Vorschau und Datenprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, meldungenMitschneiden, allesSichtbar, gegenstandTragen } from "./hilfen.js";
import { befehlGeben } from "../src/kern/spiel.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { holen } from "../src/kern/register.js";
import { ausDatenErzeugen } from "../src/kern/zustand.js";
import { magazinStand, munitionsvorrat, fernwaffeVon } from "../src/systeme/fernkampf.js";
import { wurfReichweite, streufelder, wurfbahn } from "../src/systeme/werfen.js";
import { lastVon } from "../src/systeme/inventar.js";
import { zielvorschau } from "../src/systeme/vorschau.js";
import { fernangriffAuswahl } from "../src/eingabe/fernangriff.js";
import { zielmodusBeginnen } from "../src/eingabe/zielmodus.js";
import { handlungWaehlen } from "../src/ki/handlungen.js";

const RAUM = [
  "##############",
  "#............#",
  "#............#",
  "#............#",
  "##############",
];

const EFFEKTE = {
  treffer: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 5 }] },
  glut: { schritte: [{ baustein: "schaden", art: "feuer", menge: 2 }] },
  splitter: { schritte: [{ baustein: "schaden", art: "schnitt", menge: 3 }] },
};

const schuss = (zusatz = {}) => ({ name: "schuss", genauigkeit: 100000, effekt: "treffer", reichweite: 8, tags: ["fernkampf", "spann"], ...zusatz });
const GEGENSTAENDE = {
  bogen: { text: "g.bogen", aufhebbar: true, gewicht: 800, ausruestung: { platz: "hand", schuss: schuss({ sorte: "pfeil", kosten: 150 }) } },
  pistole: { text: "g.pistole", aufhebbar: true, gewicht: 1000, ausruestung: { platz: "hand", schuss: schuss({ sorte: "kugel", kosten: 70, laerm: 15, magazin: { fasst: 3, nachladen: 200 }, tags: ["fernkampf", "feuer"] }) } },
  salve: { text: "g.salve", aufhebbar: true, ausruestung: { platz: "hand", schuss: schuss({ sorte: "kugel", schuesse: 2, magazin: { fasst: 3 } }) } },
  druck: { text: "g.druck", aufhebbar: true, ausruestung: { platz: "hand", schuss: schuss({ magazin: { fasst: 2, auffuellen: { je: 300 } } }) } },
  laser: { text: "g.laser", aufhebbar: true, ausruestung: { platz: "hand", schuss: schuss({ zielart: "strahl", sorte: "zelle", magazin: { fasst: 5 } }) } },
  pfeil: { text: "g.pfeil", aufhebbar: true, stapelbar: true, gewicht: 30, geschoss: { sorte: "pfeil", bruchchance: 0 } },
  brandpfeil: { text: "g.brandpfeil", aufhebbar: true, stapelbar: true, gewicht: 40, geschoss: { sorte: "pfeil", effekt: "glut", bruchchance: 100 } },
  kugel: { text: "g.kugel", aufhebbar: true, stapelbar: true, gewicht: 20, geschoss: { sorte: "kugel", bruchchance: 100 } },
  silberkugel: { text: "g.silberkugel", aufhebbar: true, stapelbar: true, gewicht: 25, geschoss: { sorte: "kugel", bruchchance: 100, genauigkeit: 5 } },
  zelle: { text: "g.zelle", aufhebbar: true, stapelbar: true, gewicht: 200, geschoss: { sorte: "zelle", bruchchance: 100 } },
};

function spielBauen(regeln = {}) {
  const spiel = miniSpiel(RAUM, { effekte: EFFEKTE, gegenstaende: GEGENSTAENDE, regeln });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi, meldungen: meldungenMitschneiden(spiel) };
}

// Ein Gegenstand aus den Testdaten im Gepäck, mit anzahl als Stapel
function tragen(spiel, ninkasi, typ, anzahl = 1) {
  return gegenstandTragen(spiel, ninkasi, { typ, ...structuredClone(GEGENSTAENDE[typ]), ...(anzahl > 1 && { anzahl }) });
}

// Eine Waffe aus den Testdaten, angelegt
function anlegen(spiel, ninkasi, typ) {
  const waffe = tragen(spiel, ninkasi, typ);
  ninkasi.ausgeruestet = [...(ninkasi.ausgeruestet || []), waffe.id];
  return waffe;
}

const schiessen = (spiel, ziel, zusatz = {}) => befehlGeben(spiel, { art: "schiessen", ziel, ...zusatz });

test("Schuss ohne Magazin: nimmt ein Stück aus dem Gepäck, trifft, landet unter dem Ziel, kostet die Zeit der Waffe", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  anlegen(spiel, ninkasi, "bogen");
  const pfeile = tragen(spiel, ninkasi, "pfeil", 3);
  const ziel = wesen(spiel, 5, 2, "feinde", 20);
  const ergebnis = schiessen(spiel, { id: ziel.id });
  assert.equal(ergebnis.ok, true);
  assert.equal(ziel.werte.lp.aktuell, 15);
  assert.equal(pfeile.anzahl, 2);
  const gelandet = meldungen.find((meldung) => meldung.art === "gelandet");
  assert.deepEqual(spiel.zustand.entitaeten[gelandet.was.id].position, { x: 5, y: 2 });
  assert.ok(meldungen.some((meldung) => meldung.art === "geschossen"));
  assert.equal(ninkasi.letzteAktion, "schiessen");
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit, 150, "kosten der Waffe");
  // ohne Munition und ohne Fernwaffe
  pfeile.anzahl = 1;
  ninkasi.inventar = ninkasi.inventar.filter((id) => id !== pfeile.id);
  assert.equal(holen("befehle", "schiessen").pruefen(spiel, ninkasi, { art: "schiessen", ziel: { id: ziel.id } }), "keine_munition");
  ninkasi.ausgeruestet = [];
  assert.equal(holen("befehle", "schiessen").pruefen(spiel, ninkasi, { art: "schiessen", ziel: { id: ziel.id } }), "keine_fernwaffe");
});

test("Munition mit eigener Wirkung und Bruch: der Brandpfeil wirkt zusätzlich und ist danach verbraucht; gewählt über munitionId", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  anlegen(spiel, ninkasi, "bogen");
  tragen(spiel, ninkasi, "pfeil", 2);
  const brand = tragen(spiel, ninkasi, "brandpfeil", 2);
  const ziel = wesen(spiel, 5, 2, "feinde", 20);
  assert.equal(schiessen(spiel, { id: ziel.id }, { munitionId: brand.id }).ok, true);
  assert.equal(ziel.werte.lp.aktuell, 13, "5 vom Bogen und 2 Glut");
  assert.equal(brand.anzahl, 1);
  assert.ok(!meldungen.some((meldung) => meldung.art === "gelandet" || meldung.art === "zerbrochen"), "verbraucht ohne Meldung");
});

test("Magazin: leer schießt nicht, Nachladen füllt das ganze Magazin aus mehreren Stapeln, Gewicht, Kosten, Wechsel der Art", () => {
  const { spiel, ninkasi } = spielBauen();
  const pistole = anlegen(spiel, ninkasi, "pistole");
  const ziel = wesen(spiel, 5, 2, "feinde", 50);
  assert.equal(schiessen(spiel, { id: ziel.id }).grund, "leer");
  assert.equal(befehlGeben(spiel, { art: "nachladen" }).grund, "keine_munition");
  const erste = tragen(spiel, ninkasi, "kugel", 2);
  const zweite = tragen(spiel, ninkasi, "kugel", 2);
  zweite.verdirbtUm = 1; // ein eigener Stapel derselben Art
  const lastVorher = lastVon(spiel, ninkasi);
  assert.equal(befehlGeben(spiel, { art: "nachladen" }).ok, true);
  assert.deepEqual(pistole.geladen, { typ: "kugel", anzahl: 3, gewichtJe: 20 });
  assert.equal(spiel.zustand.entitaeten[erste.id], undefined, "der erste Stapel ist aufgebraucht");
  assert.equal(zweite.anzahl, 1);
  assert.equal(lastVon(spiel, ninkasi), lastVorher, "die Munition wiegt im Magazin weiter");
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit, 200, "nachladen kostet die Zeit des Magazins");
  assert.equal(befehlGeben(spiel, { art: "nachladen" }).grund, "schon_geladen");
  assert.equal(schiessen(spiel, { id: ziel.id }).ok, true);
  assert.equal(magazinStand(spiel, pistole), 2);
  assert.deepEqual(munitionsvorrat(spiel, ninkasi, pistole), { geladen: 2, fasst: 3, imGepaeck: 1, typ: "kugel" });
  // eine andere Art: der Rest kommt zurück ins Gepäck
  const silber = tragen(spiel, ninkasi, "silberkugel", 5);
  assert.equal(befehlGeben(spiel, { art: "nachladen", munitionId: silber.id }).ok, true);
  assert.deepEqual([pistole.geladen.typ, pistole.geladen.anzahl, silber.anzahl], ["silberkugel", 3, 2]);
  const kugelnImGepaeck = ninkasi.inventar.map((id) => spiel.zustand.entitaeten[id]).filter((gegenstand) => gegenstand.typ === "kugel");
  assert.equal(kugelnImGepaeck.reduce((summe, gegenstand) => summe + (gegenstand.anzahl ?? 1), 0), 3, "1 im Gepäck und 2 aus dem Magazin");
  // Lärm: laut am Abschuss, Wesen in der Nähe wachen auf
  assert.equal(holen("befehle", "nachladen").pruefen(spiel, ninkasi, { art: "nachladen", waffeId: 999 }), "keine_fernwaffe");
});

test("Salve: jeder Schuss mit eigener Munition, sie endet mit dem leeren Magazin; Lärm am Abschuss nach der Waffe", () => {
  const { spiel, ninkasi, meldungen } = spielBauen();
  const salve = anlegen(spiel, ninkasi, "salve");
  salve.geladen = { typ: "kugel", anzahl: 3, gewichtJe: 20 };
  const ziel = wesen(spiel, 5, 2, "feinde", 50);
  assert.equal(schiessen(spiel, { id: ziel.id }).ok, true);
  assert.equal(ziel.werte.lp.aktuell, 40, "zwei Treffer");
  assert.equal(magazinStand(spiel, salve), 1);
  assert.equal(schiessen(spiel, { id: ziel.id }).ok, true);
  assert.equal(ziel.werte.lp.aktuell, 35, "nur noch ein Schuss im Magazin");
  assert.equal(salve.geladen, undefined);
  const laerm = meldungen.filter((meldung) => meldung.art === "laerm" && meldung.geraeusch === "schuss");
  assert.equal(laerm[0].lautstaerke, spiel.daten.regeln.wahrnehmung.laermSchuss, "ohne laerm an der Waffe die Vorgabe");
});

test("Strahl: trifft alle Wesen auf der Linie bis zur Reichweite", () => {
  const { spiel, ninkasi } = spielBauen();
  const laser = anlegen(spiel, ninkasi, "laser");
  laser.geladen = { typ: "zelle", anzahl: 5, gewichtJe: 200 };
  const vorne = wesen(spiel, 3, 2, "feinde", 20), hinten = wesen(spiel, 6, 2, "feinde", 20);
  assert.equal(schiessen(spiel, { id: vorne.id }).ok, true);
  assert.deepEqual([vorne.werte.lp.aktuell, hinten.werte.lp.aktuell], [15, 15]);
  const vorschau = zielvorschau(spiel, ninkasi, { zweck: "schiessen", waffeId: laser.id }, { id: vorne.id });
  assert.deepEqual(vorschau.betroffene.map(({ id }) => id), [vorne.id, hinten.id]);
});

test("Auffüllen über die Zeit: beginnt leer, ein Schuss je Abschnitt, höchstens fasst, nachladen geht nicht", () => {
  const { spiel, ninkasi } = spielBauen();
  const druck = anlegen(spiel, ninkasi, "druck");
  const ziel = wesen(spiel, 5, 2, "feinde", 50);
  assert.equal(magazinStand(spiel, druck), 0);
  assert.equal(befehlGeben(spiel, { art: "nachladen" }).grund, "nicht_nachladbar");
  spiel.zustand.zeit = 700;
  spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit = 700;
  assert.equal(magazinStand(spiel, druck), 2, "höchstens fasst");
  assert.equal(schiessen(spiel, { id: ziel.id }).ok, true);
  assert.equal(magazinStand(spiel, druck), 1);
  spiel.zustand.zeit = 1000;
  assert.equal(magazinStand(spiel, druck), 2, "das volle Magazin füllt ab dem Schuss nach");
});

test("Ausstattung mit geladen: ein Wesen aus Daten trägt ein volles Magazin; Fundstücke liegen leer", () => {
  const { spiel } = spielBauen();
  spiel.daten.wesen = { schuetzin: { fraktion: "feinde", plaetze: { hand: 2 }, werte: { lp: { grundwert: 10 } }, ausstattung: [{ typ: "pistole", angelegt: true, geladen: "kugel" }] } };
  const schuetzin = ausDatenErzeugen(spiel, "wesen", "schuetzin", { x: 8, y: 2 });
  const pistole = fernwaffeVon(spiel, schuetzin);
  assert.deepEqual(pistole.geladen, { typ: "kugel", anzahl: 3, gewichtJe: 20 });
  assert.equal(ausDatenErzeugen(spiel, "gegenstaende", "pistole", { x: 9, y: 2 }).geladen, undefined);
});

test("KI: schießt, wenn die Bahn die Beute trifft, und lädt nach, wenn das Magazin leer ist", () => {
  const { spiel, ninkasi } = spielBauen();
  spiel.daten.wesen = { schuetzin: { fraktion: "feinde", plaetze: { hand: 2 }, werte: { lp: { grundwert: 10 } }, ausstattung: [{ typ: "pistole", angelegt: true }, { typ: "kugel", anzahl: 6 }] } };
  const schuetzin = ausDatenErzeugen(spiel, "wesen", "schuetzin", { x: 8, y: 2 });
  const ki = { handlungen: [{ handlung: "schiessen", abstandAb: 2 }, { handlung: "nachladen", abstandAb: 2 }] };
  assert.deepEqual(handlungWaehlen(spiel, schuetzin, ki, ninkasi), { art: "nachladen", waffeId: fernwaffeVon(spiel, schuetzin).id });
  fernwaffeVon(spiel, schuetzin).geladen = { typ: "kugel", anzahl: 3, gewichtJe: 20 };
  assert.deepEqual(handlungWaehlen(spiel, schuetzin, ki, ninkasi), { art: "schiessen", waffeId: fernwaffeVon(spiel, schuetzin).id, ziel: { id: ninkasi.id } });
  // ein Verbündeter in der Bahn: kein Schuss
  wesen(spiel, 5, 2, "feinde", 10);
  assert.equal(handlungWaehlen(spiel, schuetzin, ki, ninkasi), null);
});

test("Werfen: Reichweite nach dem Gewicht und mit Modifikator, eigene Kosten der Wurfwaffe", () => {
  const { spiel, ninkasi } = spielBauen();
  const leicht = gegenstandTragen(spiel, ninkasi, { typ: "stein", text: "g.stein", gewicht: 100 });
  const schwer = gegenstandTragen(spiel, ninkasi, { typ: "fels", text: "g.fels", gewicht: 5000 });
  const genannt = gegenstandTragen(spiel, ninkasi, { typ: "messer", text: "g.messer", gewicht: 5000, wurf: { effekt: "splitter", genauigkeit: 100000, reichweite: 5, kosten: 70, bruchchance: 0 } });
  assert.deepEqual([wurfReichweite(spiel, ninkasi, leicht), wurfReichweite(spiel, ninkasi, schwer), wurfReichweite(spiel, ninkasi, genannt)], [8, 2, 5]);
  const ring = gegenstandTragen(spiel, ninkasi, { typ: "ring", text: "g.ring", ausruestung: { platz: "finger", modifikatoren: [{ ziel: "reichweite", art: "plus", betrag: 2 }] } });
  ninkasi.ausgeruestet = [ring.id];
  assert.equal(wurfReichweite(spiel, ninkasi, schwer), 4);
  const ziel = wesen(spiel, 4, 2, "feinde", 20);
  assert.equal(befehlGeben(spiel, { art: "werfen", gegenstandId: genannt.id, ziel: { id: ziel.id } }).ok, true);
  assert.equal(spiel.zustand.warteschlange.find((eintrag) => eintrag.akteurId === ninkasi.id).zeit, 70);
});

test("Streuung: ein zerspringender Wurf geht mit der Chance daneben, die Vorschau zeigt den Bereich; Wurfwaffen streuen nicht", () => {
  const flasche = { typ: "flasche", text: "g.flasche", gewicht: 500, wurf: { effekt: "splitter" } };
  const sicher = spielBauen({ werfen: { streuung: { chance: 100, weite: 1 } } });
  const geworfen = gegenstandTragen(sicher.spiel, sicher.ninkasi, flasche);
  const bahn = wurfbahn(sicher.spiel, sicher.ninkasi, geworfen, { x: 6, y: 2 }).bahn;
  assert.equal(streufelder(sicher.spiel, sicher.ninkasi, geworfen, bahn).length, 8, "die acht Felder um den Aufschlag");
  assert.equal(zielvorschau(sicher.spiel, sicher.ninkasi, { zweck: "werfen", gegenstandId: geworfen.id }, { x: 6, y: 2 }).streuung.length, 8);
  assert.equal(befehlGeben(sicher.spiel, { art: "werfen", gegenstandId: geworfen.id, ziel: { x: 6, y: 2 } }).ok, true);
  const streut = sicher.meldungen.find((meldung) => meldung.art === "streut");
  assert.ok(streut, "mit Chance 100 immer daneben");
  assert.notDeepEqual(streut.feld, { x: 6, y: 2 });
  const ohne = spielBauen({ werfen: { streuung: { chance: 0, weite: 2 } } });
  const ruhig = gegenstandTragen(ohne.spiel, ohne.ninkasi, flasche);
  assert.deepEqual(streufelder(ohne.spiel, ohne.ninkasi, ruhig, bahn), []);
  const messer = gegenstandTragen(sicher.spiel, sicher.ninkasi, { typ: "messer", text: "g.messer", wurf: { effekt: "splitter", genauigkeit: 80 } });
  assert.deepEqual(streufelder(sicher.spiel, sicher.ninkasi, messer, bahn), []);
});

test("Eingabe: Fernangriff schießt mit Fernwaffe, sonst die zuletzt geworfene Wurfwaffe; Zielmodus lehnt eine leere Waffe ab", () => {
  const { spiel, ninkasi } = spielBauen();
  assert.deepEqual(fernangriffAuswahl(spiel), { grund: "kein_fernangriff" });
  const messer = gegenstandTragen(spiel, ninkasi, { typ: "messer", text: "g.messer", wurf: { effekt: "splitter", genauigkeit: 80 } });
  const speer = gegenstandTragen(spiel, ninkasi, { typ: "speer", text: "g.speer", wurf: { effekt: "splitter", genauigkeit: 70 } });
  assert.deepEqual(fernangriffAuswahl(spiel), { auswahl: { zweck: "werfen", gegenstandId: messer.id } });
  assert.deepEqual(fernangriffAuswahl(spiel, "speer"), { auswahl: { zweck: "werfen", gegenstandId: speer.id } });
  const pistole = anlegen(spiel, ninkasi, "pistole");
  assert.deepEqual(fernangriffAuswahl(spiel, "speer"), { auswahl: { zweck: "schiessen", waffeId: pistole.id } });
  assert.deepEqual(zielmodusBeginnen(spiel, { zweck: "schiessen", waffeId: pistole.id }), { grund: "leer" });
  pistole.geladen = { typ: "kugel", anzahl: 3, gewichtJe: 20 };
  wesen(spiel, 6, 2, "feinde", 10);
  const beginn = zielmodusBeginnen(spiel, { zweck: "schiessen", waffeId: pistole.id });
  assert.deepEqual([beginn.modus.zielart.reichweite, beginn.modus.cursor], [8, { x: 6, y: 2 }]);
});

test("Datenprüfung: Schuss, Magazin, Munition, Wurf und Ausstattung mit geladen", () => {
  const fehlerMit = (aendern, teil) => {
    const daten = structuredClone(rohdaten);
    aendern(daten);
    return vorbereiten(daten).fehler.some((meldung) => meldung.includes(teil));
  };
  const bogen = (daten) => daten.gegenstaende.kurzbogen.ausruestung.schuss;
  assert.ok(!fehlerMit(() => {}, "schuss"), "der Probeinhalt ist gültig");
  assert.ok(fehlerMit((daten) => { delete bogen(daten).sorte; }, "ohne magazin braucht der Schuss eine sorte"));
  assert.ok(fehlerMit((daten) => { bogen(daten).sorte = "kiesel"; }, "keine Munition mit geschoss.sorte"));
  assert.ok(fehlerMit((daten) => { bogen(daten).zielart = "bogen"; }, "zielart muss eines von"));
  assert.ok(fehlerMit((daten) => { bogen(daten).magazin = { fasst: 0 }; }, "magazin muss"));
  assert.ok(fehlerMit((daten) => { bogen(daten).magazin = { fasst: 2, auffuellen: { je: 10 } }; }, "entweder aus Munition"));
  assert.ok(fehlerMit((daten) => { delete daten.gegenstaende.druckkanone.ausruestung.schuss.magazin.auffuellen; }, "über auffuellen selbst füllen"));
  assert.ok(fehlerMit((daten) => { daten.gegenstaende.pfeil.geschoss.bruchchance = 120; }, "geschoss: bruchchance"));
  assert.ok(fehlerMit((daten) => { daten.gegenstaende.brandflasche.wurf.bruchchance = 10; }, "bruchchance gilt nur mit genauigkeit"));
  assert.ok(fehlerMit((daten) => { daten.gegenstaende.wurfmesser.wurf.kosten = 0; }, "kosten muss eine ganze Zahl > 0"));
  assert.ok(fehlerMit((daten) => { daten.wesen.schuetzin_test.ausstattung[0].geladen = "schleuderstein"; }, "geladen geht nur mit einer Fernwaffe"));
  assert.ok(fehlerMit((daten) => { daten.ebenen.keller.gegenstaende.push({ typ: "kurzbogen", anzahl: 1, stapel: 3 }); }, "stapel von"));
});
