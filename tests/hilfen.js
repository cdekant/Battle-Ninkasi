// Hilfen für Unittests: kleine Spiele aus Testkarten, ohne Dungeon-Erzeugung.
// Keine Testdatei (Endung nicht .test.js), wird von node --test nicht ausgeführt.

import { rohdaten } from "../src/inhalt.js";
import gelaende from "../daten/gelaende.js";
import regeln from "../daten/regeln.js";
import aktionen from "../daten/aktionen.js";
import schadensarten from "../daten/schadensarten.js";
import fraktionen from "../daten/fraktionen.js";
import { neuerZustand, entitaetErzeugen } from "../src/kern/zustand.js";
import { werteAusDaten } from "../src/kern/werte.js";
import { zufallErzeugen } from "../src/kern/zufall.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { anmelden, abmelden, alle, holen } from "../src/kern/register.js";
import { WELTTICK, einreihen, ersterEintrag, ersterEintragEntnehmen } from "../src/kern/zeit.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import eigenschaftsdaten from "../daten/eigenschaften.js";
import { lernenEinrichten } from "../src/systeme/lernen.js";

// Spiel mit einer Karte aus Zeilen ("#" Wand, "." Boden), alles erkundet und bekannt (Erinnerung wie die Karte).
// optionen: { gelaende: zusätzliches Testgelände (z.B. Abgrund mit eigener kennung), schichten: { oberflaechen, gase },
//            effekte: Testeffekte, zustaende: Testzustände, wesen: Testwesen (zum Beschwören), faehigkeiten, risiken,
//            gegenstaende: Testgegenstände, etiketten: Etiketten unbekannter Gegenstände, skills: Testskills,
//            regeln: Abweichungen der Regelwerte, startwert }; die Eigenschaften sind die aus daten/eigenschaften.js
// Abweichend von daten/regeln.js ist die Grundverteidigung 0: Genauigkeit 100 gegen ein Wesen ohne Ausweichen trifft sicher,
// Genauigkeit 0 verfehlt sicher, beides ohne zu würfeln.
export function miniSpiel(kartenzeilen, { gelaende: testgelaende = {}, schichten = { oberflaechen: {}, gase: {} }, fraktionen: fraktionsdaten = fraktionen, effekte = {}, zustaende = {}, wesen: wesensdaten = {}, faehigkeiten = {}, risiken = {}, gegenstaende = {}, etiketten = {}, skills = {}, regeln: regelAbweichungen = {}, startwert = 1 } = {}) {
  const zustand = neuerZustand(startwert);
  zustand.zufallszustand = zufallErzeugen(startwert);
  const breite = kartenzeilen[0].length, hoehe = kartenzeilen.length;
  zustand.ebene = { name: "test", breite, hoehe, felder: kartenzeilen, erkundet: new Array(breite * hoehe).fill(1), erinnerung: kartenzeilen.join("").split(""), erinnerteDinge: {} };
  const testregeln = {
    ...regeln,
    ausloeser: { ...regeln.ausloeser, ...regelAbweichungen.ausloeser },
    kampf: { ...regeln.kampf, grundverteidigung: 0, ...regelAbweichungen.kampf },
    laufendeAktionen: { ...regeln.laufendeAktionen, ...regelAbweichungen.laufendeAktionen },
    fraktionen: { ...regeln.fraktionen, ...regelAbweichungen.fraktionen },
    wahrnehmung: { ...regeln.wahrnehmung, ...regelAbweichungen.wahrnehmung },
    bewegung: { ...regeln.bewegung, ...regelAbweichungen.bewegung },
    werfen: { ...regeln.werfen, ...regelAbweichungen.werfen },
    population: { ...regeln.population, ...regelAbweichungen.population },
    fallen: { ...regeln.fallen, ...regelAbweichungen.fallen },
    tragen: { ...regeln.tragen, ...regelAbweichungen.tragen },
    schichten: { ...regeln.schichten, ...regelAbweichungen.schichten },
    feuer: { ...regeln.feuer, ...regelAbweichungen.feuer },
    lernen: { ...regeln.lernen, ...regelAbweichungen.lernen },
    licht: { ...regeln.licht, ...regelAbweichungen.licht },
  };
  return { zustand, daten: { gelaende: { ...gelaende, ...testgelaende }, schichten, aktionen, fraktionen: fraktionsdaten, effekte, schadensarten, zustaende, wesen: wesensdaten, faehigkeiten, risiken, gegenstaende, etiketten, eigenschaften: eigenschaftsdaten, skills, regeln: testregeln }, befehle: [], hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
}

// Ninkasi, die lernt (skills, freieEp, freigeschaltet); eigenschaften ohne Prüfung der Erstellungsregeln, Vorgabe alle 10
export function lernendeSpielerin(spiel, x, y, { eigenschaften = {}, lp = 100 } = {}) {
  const ninkasi = spielerinSetzen(spiel, x, y, lp);
  ninkasi.eigenschaften = { ...Object.fromEntries(Object.keys(eigenschaftsdaten).map((name) => [name, 10])), ...eigenschaften };
  lernenEinrichten(spiel, ninkasi);
  return ninkasi;
}

// Rohdaten mit eigenen Testeinträgen (alle mit "test" im Namen) für Tests der Datenprüfung: die Tests bauen ihre
// Fehler in diese Einträge ein, nicht in den Spielinhalt, der sich so frei ändern und löschen lässt.
// Texte prüft vorbereiten ohne Sprachdaten nicht; Zeichen schon, darum stehen sie mit dabei.
export function rohdatenMitTesteintraegen() {
  const daten = structuredClone(rohdaten);
  const zeichen = (bereich, name) => { daten.zeichen[bereich] ??= {}; daten.zeichen[bereich][name] = { zeichen: "?", farbe: "#ffffff" }; };
  daten.effekte.testeffekt = { schritte: [{ baustein: "schaden", art: "stumpf", menge: 1 }] };
  daten.fraktionen.testfraktion = { text: "fraktion.testfraktion" };
  daten.gelaende.testgelaende = { text: "gelaende.testgelaende", kennung: "§", passierbar: false, durchsichtig: false };
  daten.gelaende.testtuer = { text: "gelaende.testtuer", kennung: "¤", passierbar: false, durchsichtig: false, tuer: { offen: "boden" } };
  daten.gelaende.testquelle = { text: "gelaende.testquelle", kennung: "¦", passierbar: false, durchsichtig: true, quelle: { gas: "testgas", menge: 1 }, brennbar: 10, verbrenntZu: "boden" };
  for (const name of ["testgelaende", "testtuer", "testquelle"]) zeichen("gelaende", name);
  daten.fallen.testfalle = { text: "falle.testfalle", falle: { tarnung: 10, effekt: "testeffekt" } };
  zeichen("fallen", "testfalle");
  daten.schichten.oberflaechen.testoberflaeche = { text: "oberflaeche.test", brennbar: 50, verbrenntZu: "testoberflaeche" };
  daten.schichten.gase.testgas = { text: "gas.test", abbau: 1, stufen: [{ ab: 10, effekt: "testeffekt" }, { ab: 20, effekt: "testeffekt" }] };
  zeichen("schichten", "testoberflaeche");
  zeichen("schichten", "testgas");
  daten.faehigkeiten.testritual = { text: "faehigkeit.test", dauer: { schritte: 2 }, unterbrechbar: true, ziel: { art: "selbst" }, wirkung: "testeffekt" };
  daten.faehigkeiten.testgeschoss = { text: "faehigkeit.testgeschoss", ziel: { art: "geschoss", reichweite: 3 }, wirkung: "testeffekt" };
  daten.wesen.testwesen = {
    text: "wesen.testwesen", fraktion: "testfraktion", werte: { lp: { grundwert: 5 } },
    faehigkeiten: ["testgeschoss", "testritual"],
    ki: { modul: "jagen", letzteBekanntePosition: null, handlungen: [{ handlung: "faehigkeit", name: "testgeschoss" }, { handlung: "faehigkeit", name: "testritual" }] },
  };
  zeichen("wesen", "testwesen");
  daten.wesen.testvorlage = { abstrakt: true, fraktion: "testfraktion" };
  daten.gegenstaende.testgegenstand = { text: "gegenstand.testgegenstand", aufhebbar: true };
  zeichen("gegenstaende", "testgegenstand");
  daten.populationen.testtabelle = [{ typ: "testwesen", gewicht: 1, tiefe: [1, 1] }];
  daten.ebenen.testebene = {
    breite: 20, hoehe: 20, gelaende: { wand: "wand", boden: "boden" }, digger: {},
    population: { tabelle: "testtabelle", anzahl: [1, 2] }, fallen: [{ typ: "testfalle", anzahl: 1 }],
    gelaendeObjekte: [{ gelaende: "testquelle", anzahl: 1 }], tuerChance: 10,
  };
  daten.ebenen.testkarte = { karte: ["###", "#.#", "###"] };
  daten.skills.testskill_grund = {
    text: "skill.testskill_grund", set: "testskill", tier: 1, primaer: "koerperlichkeit", sekundaer: "klugheit",
    jeStufe: [{ ziel: "lp", art: "prozent", betrag: 1 }], abStufe: { 2: { modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] } },
    lernt: [{ anlass: "wirkung", tags: ["testtag"] }], verwandt: [{ skill: "testskill_experte", anteil: 10 }],
  };
  daten.skills.testskill_experte = { text: "skill.testskill_experte", set: "testskill", tier: 2, primaer: "koerperlichkeit", sekundaer: "klugheit" };
  daten.faehigkeiten.testkunst = {
    text: "faehigkeit.testkunst", ziel: { art: "selbst" }, wirkung: "testeffekt",
    skill: { name: "testskill_grund", stufe: 1, risiko: "ohne_skill" }, anforderung: { eigenschaften: { klugheit: 12 }, risiko: "anforderung" },
    ausbau: [{ wenn: [{ bedingung: "skill_ab", skill: "testskill_grund", stufe: 2 }], aendert: { zeit: 50 } }],
  };
  daten.gegenstaende.testkeule = {
    text: "gegenstand.testkeule", aufhebbar: true,
    ausruestung: { platz: "hand", anforderung: { koerperlichkeit: 15 }, abzugJePunkt: [{ ziel: "genauigkeit", art: "prozent", betrag: -3 }] },
  };
  zeichen("gegenstaende", "testkeule");
  return daten;
}

// Wesen mit Position, Fraktion und LP; weitere Komponenten (ausloeser, angriff, beimTod ...) über zusatz
export function wesen(spiel, x, y, fraktion = "feinde", lp = 10, zusatz = {}) {
  return entitaetErzeugen(spiel.zustand, { fraktion, position: { x, y }, werte: werteAusDaten({ lp: { grundwert: lp } }), ...zusatz });
}

// Ninkasi als Spielerin
export function spielerinSetzen(spiel, x, y, lp = 100) {
  const ninkasi = wesen(spiel, x, y, "ninkasi", lp);
  spiel.zustand.spielerinId = ninkasi.id;
  return ninkasi;
}

// Ninkasi sieht die ganze Karte (statt des Schattenwurfs aus systeme/sicht.js)
export function allesSichtbar(spiel) {
  const ebene = spiel.zustand.ebene;
  spiel.zustand.sichtbareFelder = Array.from({ length: ebene.breite * ebene.hoehe }, (_, feldIndex) => feldIndex);
}

// Gegenstand im Inventar einer Trägerin
export function gegenstandTragen(spiel, traegerin, komponenten = {}) {
  const gegenstand = entitaetErzeugen(spiel.zustand, { aufhebbar: true, ...komponenten, getragenVon: traegerin.id });
  if (!traegerin.inventar) traegerin.inventar = [];
  traegerin.inventar.push(gegenstand.id);
  return gegenstand;
}

// Lässt die Welt bis zu einem Zeitpunkt laufen: Weltuhr und Zeitereignisse samt Abschluss des Vorgangs,
// Akteure werden übersprungen (sie handeln in diesen Tests nicht)
export function weltLaufenLassen(spiel, bisZeit) {
  const zustand = spiel.zustand;
  if (!zustand.warteschlange.some((eintrag) => eintrag.art === "weltuhr")) {
    einreihen(zustand, { zeit: (Math.floor(zustand.zeit / WELTTICK) + 1) * WELTTICK, art: "weltuhr" });
  }
  for (let eintrag = ersterEintrag(zustand); eintrag && eintrag.zeit <= bisZeit; eintrag = ersterEintrag(zustand)) {
    ersterEintragEntnehmen(zustand);
    if (eintrag.art === "weltuhr") {
      for (const [, handler] of alle("welttick")) {
        handler(spiel);
        vorgangAbschliessen(spiel);
      }
      einreihen(zustand, { zeit: zustand.zeit + WELTTICK, art: "weltuhr" });
    } else if (eintrag.art === "ereignis") {
      holen("zeitereignisse", eintrag.ereignistyp)(spiel, eintrag.daten);
      vorgangAbschliessen(spiel);
    }
  }
  zustand.zeit = bisZeit;
}

// Schneidet alle Meldungen mit
export function meldungenMitschneiden(spiel) {
  const meldungen = [];
  hoererAnmelden(spiel, (meldung) => meldungen.push(meldung));
  return meldungen;
}

// Meldet einen Haken nur für die Dauer eines Tests an (t: Testkontext von node:test)
export function hakenFuerTest(t, hakenName, handler, optionen) {
  anmelden("haken", hakenName, handler, optionen);
  t.after(() => abmelden("haken", hakenName, handler));
  return handler;
}
