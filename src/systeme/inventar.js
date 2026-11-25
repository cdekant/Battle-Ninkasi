// Inventar (siehe docs/Gegenstaende.md, Inventar): aufheben, trinken, lesen, fallenlassen, Stapel, Ladungen, Behälter, Gewicht.
// Befehle: { art: "aufheben" }, { art: "trinken", gegenstandId }, { art: "lesen", gegenstandId }, { art: "fallenlassen", gegenstandId }
// Getragene Gegenstände haben keine Position, sondern getragenVon; die Trägerin führt sie in inventar.
// Daten am Gegenstand:
//   stapelbar: true   gleiche Gegenstände bilden einen Stapel (anzahl an der Entität, Vorgabe 1); gleich heißt: derselbe
//                     Typ und sonst dieselben Komponenten; Trinken und Werfen nehmen einen, Fallenlassen den ganzen Stapel
//   ladungen: { hoechstens, gewichtJe? }  z.B. ein Fass mit Schlucken; der Stand steht in ladungen.aktuell (Vorgabe
//                     hoechstens); Trinken nimmt eine Ladung
//   lesbar: { effekt, bleibt? }  Lesen wendet effekt auf die Leserin an (Ursache "lesen"); ohne bleibt ist ein Stück
//                     verbraucht (Schriftrolle), mit bleibt: true bleibt der Gegenstand (Braubuch); was er tut, sagt
//                     allein der Effekt: lehren (faehigkeit_lehren) oder einmal wirken (Verbrauchsgegenstand)
//   wirdZu: Typ       was nach dem letzten Gebrauch bleibt (leere Flasche, leeres Fass), kommt ins Gepäck
//   gewicht           in Gramm, mit Ladungen zuzüglich gewichtJe je Ladung; die Last ist die Summe über das Gepäck
//   verdirbt: { nach, wird }  nach so vielen Zeiteinheiten wird der Gegenstand zu wird (systeme/verschleiss.js); der
//                     Zeitpunkt steht in verdirbtUm, fließen Stapel zusammen, gilt ihr nach Anzahl gewichteter Durchschnitt
// Ausstattung am Wesen: ausstattung: [{ typ, anzahl?, angelegt? }]  was es beim Erzeugen aus Daten im Gepäck hat (Vorgabe
//   anzahl 1), mit angelegt schon angelegt (ohne Zeit, systeme/ausruestung.js anlegenOhneZeit),
//   z.B. Bier zum Heilen für einen Gegner; stapelbare fließen zu einem Stapel zusammen
// Nutzung für die KI (Register "nutzungen", ki/nutzen.js): trinkbar.zweck sagt, wozu ein Wesen den Gegenstand selbst trinkt
// Tragkraft: wesen.tragkraft, sonst regeln.tragen.tragkraft, mit Modifikatoren auf "tragkraft"; Überladung verteuert das
//   Bewegen in Stufen (regeln.tragen.stufen: [{ ab: Prozent der Tragkraft, kosten: Prozent mehr }]), verboten ist nichts.

import { anmelden } from "../kern/register.js";
import { entitaetenAuf, entitaetMitId, entitaetEntfernen, entitaetErzeugen, entitaetAusDatensatz, ausDatenErzeugen, positionSetzen, ausDemInventarNehmen } from "../kern/zustand.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { modifiziert } from "../kern/werte.js";
import { ereignisEinreihen, gebundeneEreignisseEntfernen } from "../kern/zeit.js";
import { erkennen, beimAufhebenErkennen } from "./kennen.js";
import { fluchHindert, gefuehltesGewicht, anlegenOhneZeit } from "./ausruestung.js";

// Verderben: ein Gegenstand mit verdirbt bekommt beim Erzeugen seinen Zeitpunkt und ein gebundenes Zeitereignis
// (Handler in systeme/verschleiss.js); ein abgespaltener Teil eines Stapels behält den Zeitpunkt
export function verderbenEinplanen(zustand, gegenstand) {
  gebundeneEreignisseEntfernen(zustand, gegenstand.id, "verderben");
  ereignisEinreihen(zustand, gegenstand.verdirbtUm, "verderben", { gegenstandId: gegenstand.id }, gegenstand.id);
}

anmelden("beimErzeugen", "verderben", (zustand, entitaet) => {
  if (!entitaet.verdirbt) return;
  entitaet.verdirbtUm ??= zustand.zeit + entitaet.verdirbt.nach;
  verderbenEinplanen(zustand, entitaet);
});

anmelden("ausDaten", "ausstattung", (spiel, wesen, datensatz) => {
  for (const { typ, anzahl = 1, angelegt = false } of datensatz.ausstattung || []) {
    for (let i = 0; i < anzahl; i++) {
      const gegenstand = insInventar(spiel, wesen, ausDatenErzeugen(spiel, "gegenstaende", typ, null));
      const grund = angelegt ? anlegenOhneZeit(spiel, wesen, gegenstand) : null;
      if (grund) throw new Error(`Ausstattung: "${typ}" lässt sich nicht anlegen (${grund})`);
    }
  }
});

anmelden("nutzungen", "trinken", { feld: "trinkbar", ziel: "selbst", befehl: (spiel, wesen, ziel, gegenstand) => ({ art: "trinken", gegenstandId: gegenstand.id }) });

export const anzahlVon = (gegenstand) => gegenstand.anzahl ?? 1;
export const ladungenVon = (gegenstand) => (gegenstand.ladungen ? gegenstand.ladungen.aktuell ?? gegenstand.ladungen.hoechstens : null);

// Gewicht eines einzelnen Gegenstands (ohne den Stapel) in Gramm, mit Ladungen und der Munition im Magazin
// (geladen: { anzahl, gewichtJe? }, systeme/fernkampf.js)
export function einzelgewicht(gegenstand) {
  const ladungen = ladungenVon(gegenstand);
  const magazin = gegenstand.geladen ? (gegenstand.geladen.anzahl ?? 0) * (gegenstand.geladen.gewichtJe ?? 0) : 0;
  return (gegenstand.gewicht ?? 0) + (ladungen ? ladungen * (gegenstand.ladungen.gewichtJe ?? 0) : 0) + magazin;
}

// Last einer Trägerin in Gramm: alles im Gepäck, auch das Angelegte, dieses mit seinem gefühlten Gewicht
// (systeme/ausruestung.js gefuehltesGewicht)
export function lastVon(spiel, traegerin) {
  let summe = 0;
  for (const id of traegerin.inventar || []) {
    const gegenstand = entitaetMitId(spiel.zustand, id);
    if (gegenstand) summe += gefuehltesGewicht(spiel, traegerin, gegenstand, einzelgewicht(gegenstand)) * anzahlVon(gegenstand);
  }
  return summe;
}

export function tragkraftVon(spiel, traegerin) {
  return Math.max(0, modifiziert(spiel, traegerin, "tragkraft", traegerin.tragkraft ?? spiel.daten.regeln.tragen.tragkraft));
}

// Zuschlag aufs Bewegen in Prozent nach der höchsten erreichten Stufe der Überladung (0 ohne)
export function lastZuschlag(spiel, traegerin) {
  if (!traegerin.inventar?.length) return 0;
  const last = lastVon(spiel, traegerin), tragkraft = tragkraftVon(spiel, traegerin);
  let zuschlag = 0;
  for (const stufe of spiel.daten.regeln.tragen.stufen) if (last * 100 >= tragkraft * stufe.ab) zuschlag = stufe.kosten;
  return zuschlag;
}

// Komponenten, in denen zwei Gegenstände gleich sein müssen, um einen Stapel zu bilden; der Zeitpunkt des Verderbens
// zählt nicht, er wird gemittelt
function stapelkennung(gegenstand) {
  const { id, anzahl, getragenVon, position, verdirbtUm, ...rest } = gegenstand;
  return JSON.stringify(rest);
}

// Gewichteter Durchschnitt der Zeitpunkte des Verderbens, abgerundet; die Restzeit aller Stücke bleibt so in Summe gleich
function verderbenMitteln(zustand, stapel, hinzu) {
  if (stapel.verdirbtUm === undefined || hinzu.verdirbtUm === undefined) return;
  const anzahlStapel = anzahlVon(stapel), anzahlHinzu = anzahlVon(hinzu);
  const mittel = Math.floor((stapel.verdirbtUm * anzahlStapel + hinzu.verdirbtUm * anzahlHinzu) / (anzahlStapel + anzahlHinzu));
  if (mittel === stapel.verdirbtUm) return;
  stapel.verdirbtUm = mittel;
  verderbenEinplanen(zustand, stapel);
}

// Legt einen Gegenstand ins Gepäck; ein stapelbarer fließt in einen gleichen Stapel (der aufgenommene verschwindet dann).
// Gibt den Gegenstand im Gepäck zurück.
export function insInventar(spiel, traegerin, gegenstand) {
  if (gegenstand.position) positionSetzen(spiel.zustand, gegenstand, null);
  if (gegenstand.stapelbar) {
    const kennung = stapelkennung(gegenstand);
    const stapel = (traegerin.inventar || []).map((id) => entitaetMitId(spiel.zustand, id))
      .find((kandidat) => kandidat && kandidat.id !== gegenstand.id && stapelkennung(kandidat) === kennung && !(traegerin.ausgeruestet || []).includes(kandidat.id));
    if (stapel) {
      verderbenMitteln(spiel.zustand, stapel, gegenstand);
      stapel.anzahl = anzahlVon(stapel) + anzahlVon(gegenstand);
      entitaetEntfernen(spiel.zustand, gegenstand.id);
      return stapel;
    }
  }
  gegenstand.getragenVon = traegerin.id;
  if (!traegerin.inventar) traegerin.inventar = [];
  traegerin.inventar.push(gegenstand.id);
  return gegenstand;
}

// Nimmt einen einzelnen Gegenstand aus dem Gepäck: vom Stapel einen abgespalten, sonst den Gegenstand selbst.
// Gibt die Entität zurück, die nicht mehr getragen wird (ohne Position).
export function einenAbnehmen(spiel, traegerin, gegenstand) {
  if (anzahlVon(gegenstand) > 1) {
    gegenstand.anzahl -= 1;
    const { id, anzahl, getragenVon, ...rest } = gegenstand;
    return entitaetErzeugen(spiel.zustand, structuredClone(rest));
  }
  ausDemInventarNehmen(traegerin, gegenstand.id);
  delete gegenstand.getragenVon;
  return gegenstand;
}

// Was nach dem letzten Gebrauch bleibt (wirdZu), kommt ins Gepäck
function rueckstandAblegen(spiel, traegerin, gegenstand) {
  if (!gegenstand.wirdZu) return;
  const rueckstand = entitaetAusDatensatz(spiel.zustand, gegenstand.wirdZu, spiel.daten.gegenstaende[gegenstand.wirdZu], null);
  insInventar(spiel, traegerin, rueckstand);
}

// Verbraucht ein Stück aus dem Gepäck (auch ein angelegtes, es wird dabei abgelegt): bei Ladungen eine Ladung (ein
// Schluck aus dem Fass), sonst eines vom Stapel; nach dem letzten bleibt, was wirdZu sagt
export function einStueckVerbrauchen(spiel, traegerin, gegenstand) {
  if (gegenstand.ladungen) {
    gegenstand.ladungen.aktuell = ladungenVon(gegenstand) - 1;
    if (gegenstand.ladungen.aktuell > 0) return;
    ausDemInventarNehmen(traegerin, gegenstand.id);
    entitaetEntfernen(spiel.zustand, gegenstand.id);
    rueckstandAblegen(spiel, traegerin, gegenstand);
    return;
  }
  const verbraucht = einenAbnehmen(spiel, traegerin, gegenstand);
  entitaetEntfernen(spiel.zustand, verbraucht.id);
  rueckstandAblegen(spiel, traegerin, verbraucht);
}

function aufhebbarHier(spiel, akteur) {
  return entitaetenAuf(spiel.zustand, akteur.position.x, akteur.position.y).find((entitaet) => entitaet.aufhebbar) || null;
}

const benutzt = (spiel, wesen, gegenstand, art) => hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: wesen.id, zielId: wesen.id, gegenstandId: gegenstand.id, art, kettentiefe: 0 });
const imGepaeck = (akteur, gegenstandId) => Boolean(akteur.inventar) && Number.isInteger(gegenstandId) && akteur.inventar.includes(gegenstandId);

anmelden("befehle", "aufheben", {
  pruefen(spiel, akteur) {
    if (!akteur.inventar) return "kein_inventar";
    return aufhebbarHier(spiel, akteur) ? null : "nichts_da";
  },
  ausfuehren(spiel, akteur) {
    const gegenstand = aufhebbarHier(spiel, akteur);
    const bezug = bezugAuf(gegenstand), anzahl = anzahlVon(gegenstand), typ = gegenstand.typ;
    const imGepaeckAls = insInventar(spiel, akteur, gegenstand);
    melden(spiel, "aufgehoben", { wer: bezugAuf(akteur), was: bezug, anzahl });
    beimAufhebenErkennen(spiel, akteur, typ);
    hakenAusloesen(spiel, "aufgehoben", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: imGepaeckAls.id, kettentiefe: 0 });
    return "aufheben";
  },
});

anmelden("befehle", "trinken", {
  pruefen(spiel, akteur, befehl) {
    if (!imGepaeck(akteur, befehl.gegenstandId)) return "nichts_zu_trinken";
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    return gegenstand && gegenstand.trinkbar ? null : "nicht_trinkbar";
  },
  ausfuehren(spiel, akteur, befehl) {
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    melden(spiel, "getrunken", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    benutzt(spiel, akteur, gegenstand, "trinken");
    const effekt = gegenstand.trinkbar.effekt, typ = gegenstand.typ;
    // ein gebrauter Sud bringt sein Profil in die Ablage des Effekts (Baustein sud_wirken, systeme/brauen.js)
    const werte = gegenstand.sud ? { sud: structuredClone(gegenstand.sud) } : {};
    einStueckVerbrauchen(spiel, akteur, gegenstand);
    // wer trinkt, merkt, was es war (Vorbild Brogue); erkannt vor der Wirkung, damit deren Meldungen den Namen tragen
    erkennen(spiel, akteur, typ);
    effektAnwenden(spiel, effekt, { quelleId: akteur.id, zielId: akteur.id, ursache: "trinken", mittel: { art: "gegenstand", name: typ }, werte });
    return "trinken";
  },
});

anmelden("befehle", "lesen", {
  pruefen(spiel, akteur, befehl) {
    if (!imGepaeck(akteur, befehl.gegenstandId)) return "nicht_im_gepaeck";
    return entitaetMitId(spiel.zustand, befehl.gegenstandId)?.lesbar ? null : "nicht_lesbar";
  },
  ausfuehren(spiel, akteur, befehl) {
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    melden(spiel, "gelesen", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    benutzt(spiel, akteur, gegenstand, "lesen");
    const { effekt, bleibt } = gegenstand.lesbar, typ = gegenstand.typ;
    if (!bleibt) {
      const gelesen = einenAbnehmen(spiel, akteur, gegenstand);
      entitaetEntfernen(spiel.zustand, gelesen.id);
      rueckstandAblegen(spiel, akteur, gelesen);
    }
    // wer liest, weiß, was es war; erkannt vor der Wirkung, damit deren Meldungen den Namen tragen
    erkennen(spiel, akteur, typ);
    const position = akteur.position ? { ...akteur.position } : null;
    effektAnwenden(spiel, effekt, { quelleId: akteur.id, zielId: akteur.id, ursprung: position, zielfeld: position, ursache: "lesen", mittel: { art: "gegenstand", name: typ } });
    return "lesen";
  },
});

anmelden("befehle", "fallenlassen", {
  pruefen(spiel, akteur, befehl) {
    if (!imGepaeck(akteur, befehl.gegenstandId)) return "nicht_im_gepaeck";
    return fluchHindert(spiel, akteur, befehl.gegenstandId) ? "verflucht" : null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    benutzt(spiel, akteur, gegenstand, "fallenlassen");
    ausDemInventarNehmen(akteur, gegenstand.id); // auch Angelegtes, es wird dabei abgelegt
    delete gegenstand.getragenVon;
    positionSetzen(spiel.zustand, gegenstand, akteur.position);
    melden(spiel, "fallengelassen", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand), anzahl: anzahlVon(gegenstand) });
    return "fallenlassen";
  },
});

// Erster trinkbarer Gegenstand im Inventar (Hilfe für Eingabe und Bots, nur lesend)
export function erstesGetraenk(zustand, akteur) {
  for (const id of akteur.inventar || []) {
    const gegenstand = entitaetMitId(zustand, id);
    if (gegenstand && gegenstand.trinkbar) return gegenstand.id;
  }
  return null;
}
