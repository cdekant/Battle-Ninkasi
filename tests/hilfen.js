// Hilfen für Unittests: kleine Spiele aus Testkarten, ohne Dungeon-Erzeugung.
// Keine Testdatei (Endung nicht .test.js), wird von node --test nicht ausgeführt.

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

// Spiel mit einer Karte aus Zeilen ("#" Wand, "." Boden), alles erkundet.
// optionen: { gelaende: zusätzliches Testgelände (z.B. Abgrund mit eigener kennung), effekte: Testeffekte, zustaende: Testzustände, wesen: Testwesen (zum Beschwören), faehigkeiten, risiken,
//            gegenstaende: Testgegenstände, regeln: Abweichungen der Regelwerte, startwert }
// Abweichend von daten/regeln.js ist die Grundverteidigung 0: Genauigkeit 100 gegen ein Wesen ohne Ausweichen trifft sicher,
// Genauigkeit 0 verfehlt sicher, beides ohne zu würfeln.
export function miniSpiel(kartenzeilen, { gelaende: testgelaende = {}, fraktionen: fraktionsdaten = fraktionen, effekte = {}, zustaende = {}, wesen: wesensdaten = {}, faehigkeiten = {}, risiken = {}, gegenstaende = {}, regeln: regelAbweichungen = {}, startwert = 1 } = {}) {
  const zustand = neuerZustand(startwert);
  zustand.zufallszustand = zufallErzeugen(startwert);
  const breite = kartenzeilen[0].length, hoehe = kartenzeilen.length;
  zustand.ebene = { name: "test", breite, hoehe, felder: kartenzeilen, erkundet: new Array(breite * hoehe).fill(1) };
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
  };
  return { zustand, daten: { gelaende: { ...gelaende, ...testgelaende }, aktionen, fraktionen: fraktionsdaten, effekte, schadensarten, zustaende, wesen: wesensdaten, faehigkeiten, risiken, gegenstaende, regeln: testregeln }, befehle: [], hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
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
