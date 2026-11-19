// Inventar (siehe docs/Architektur.md, Gegenstände): aufheben, trinken, fallenlassen, Stapel, Ladungen, Behälter, Gewicht.
// Befehle: { art: "aufheben" }, { art: "trinken", gegenstandId }, { art: "fallenlassen", gegenstandId }
// Getragene Gegenstände haben keine Position, sondern getragenVon; die Trägerin führt sie in inventar.
// Daten am Gegenstand:
//   stapelbar: true   gleiche Gegenstände bilden einen Stapel (anzahl an der Entität, Vorgabe 1); gleich heißt: derselbe
//                     Typ und sonst dieselben Komponenten; Trinken und Werfen nehmen einen, Fallenlassen den ganzen Stapel
//   ladungen: { hoechstens, gewichtJe? }  z.B. ein Fass mit Schlucken; der Stand steht in ladungen.aktuell (Vorgabe
//                     hoechstens); Trinken nimmt eine Ladung
//   wirdZu: Typ       was nach dem letzten Gebrauch bleibt (leere Flasche, leeres Fass), kommt ins Gepäck
//   gewicht           in Gramm, mit Ladungen zuzüglich gewichtJe je Ladung; die Last ist die Summe über das Gepäck
// Tragkraft: wesen.tragkraft, sonst regeln.tragen.tragkraft, mit Modifikatoren auf "tragkraft"; Überladung verteuert das
//   Bewegen in Stufen (regeln.tragen.stufen: [{ ab: Prozent der Tragkraft, kosten: Prozent mehr }]), verboten ist nichts.

import { anmelden } from "../kern/register.js";
import { entitaetenAuf, entitaetMitId, entitaetEntfernen, entitaetErzeugen, entitaetAusDatensatz, positionSetzen, ausDemInventarNehmen } from "../kern/zustand.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { modifiziert } from "../kern/werte.js";

export const anzahlVon = (gegenstand) => gegenstand.anzahl ?? 1;
export const ladungenVon = (gegenstand) => (gegenstand.ladungen ? gegenstand.ladungen.aktuell ?? gegenstand.ladungen.hoechstens : null);

// Gewicht eines einzelnen Gegenstands (ohne den Stapel) in Gramm
export function einzelgewicht(gegenstand) {
  const ladungen = ladungenVon(gegenstand);
  return (gegenstand.gewicht ?? 0) + (ladungen ? ladungen * (gegenstand.ladungen.gewichtJe ?? 0) : 0);
}

// Last einer Trägerin in Gramm: alles im Gepäck, auch das Angelegte
export function lastVon(spiel, traegerin) {
  let summe = 0;
  for (const id of traegerin.inventar || []) {
    const gegenstand = entitaetMitId(spiel.zustand, id);
    if (gegenstand) summe += einzelgewicht(gegenstand) * anzahlVon(gegenstand);
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

// Komponenten, in denen zwei Gegenstände gleich sein müssen, um einen Stapel zu bilden
function stapelkennung(gegenstand) {
  const { id, anzahl, getragenVon, position, ...rest } = gegenstand;
  return JSON.stringify(rest);
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
    const bezug = bezugAuf(gegenstand), anzahl = anzahlVon(gegenstand);
    insInventar(spiel, akteur, gegenstand);
    melden(spiel, "aufgehoben", { wer: bezugAuf(akteur), was: bezug, anzahl });
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
    if (gegenstand.ladungen) {
      // ein Schluck aus dem Fass; nach dem letzten bleibt, was wirdZu sagt
      gegenstand.ladungen.aktuell = ladungenVon(gegenstand) - 1;
      if (gegenstand.ladungen.aktuell <= 0) {
        ausDemInventarNehmen(akteur, gegenstand.id);
        entitaetEntfernen(spiel.zustand, gegenstand.id);
        rueckstandAblegen(spiel, akteur, gegenstand);
      }
    } else {
      const getrunken = einenAbnehmen(spiel, akteur, gegenstand);
      entitaetEntfernen(spiel.zustand, getrunken.id);
      rueckstandAblegen(spiel, akteur, getrunken);
    }
    effektAnwenden(spiel, effekt, { quelleId: akteur.id, zielId: akteur.id, ursache: "trinken", mittel: { art: "gegenstand", name: typ } });
    return "trinken";
  },
});

anmelden("befehle", "fallenlassen", {
  pruefen(spiel, akteur, befehl) {
    return imGepaeck(akteur, befehl.gegenstandId) ? null : "nicht_im_gepaeck";
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
