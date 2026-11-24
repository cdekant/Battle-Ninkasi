// Das Spiel: Zustand, Daten und die einzige Eingangstür für Befehle.
// spiel = { daten, zustand, befehle, hoerer, zwischenspeicher, anstehendeAusloeser }
//   zustand: reine Daten (JSON), befehle: Aufzeichnung für den Spielstand,
//   hoerer: Empfänger der Meldungen, zwischenspeicher: abgeleitete Nachschlagetabellen (nicht im Zustand),
//   anstehendeAusloeser: vorgemerkte Auslöser, nach jedem Vorgang leer (siehe kern/vorgang.js)
//   wurfquelle (freiwillig, nicht gespeichert): woher die Würfe kommen, ohne Angabe der Spiel-Zufall (siehe kern/wurf.js)

import "./bausteine.js";
import "./ausloeser.js";
import "../systeme/index.js";
import "../ki/index.js";
import VERSION from "../version.js";
import { vorbereiten, Datenfehler } from "./daten.js";
import { neuerZustand, entitaetMitId, alleEntitaeten, spielerin, gesteuerteEntitaet, kiVon, ausDatenErzeugen, grundkostenVon } from "./zustand.js";
import { zufallErzeugen, startwertAbleiten } from "./zufall.js";
import { WELTTICK, einreihen, ersterEintrag, ersterEintragEntnehmen, akteurEinreihen } from "./zeit.js";
import { holen, hat, alle as alleImRegister } from "./register.js";
import { modifiziert, prozentVon } from "./werte.js";
import { melden, bezugAuf, hakenAusloesen } from "./ereignisse.js";
import { vorgangAbschliessen } from "./vorgang.js";
import { ebeneErzeugen } from "../welt/ebene.js";
import { laufPlanen } from "../welt/plan.js";
import { sichtfeldAktualisieren } from "../systeme/sicht.js";
import { istHandlungsunfaehig } from "../systeme/zustaende.js";
import { aktionAbbrechen, laufendeAktionVorDemZug } from "../systeme/laufendeAktionen.js";
import { wahrnehmen } from "../systeme/wahrnehmung.js";
import { lastZuschlag } from "../systeme/inventar.js";
import { verlangsamungVon } from "../systeme/ausruestung.js";
import { etikettenZuordnen } from "../systeme/kennen.js";
import { lernenEinrichten } from "../systeme/lernen.js";

// Rohdaten prüfen und vorbereiten; wirft Datenfehler mit allen Meldungen.
// sprache: { texte, nomenPruefen? } (siehe kern/daten.js)
export function datenLaden(rohdaten, sprache) {
  const { daten, fehler } = vorbereiten(rohdaten, sprache);
  if (fehler.length) throw new Datenfehler(fehler);
  return daten;
}

// Spielarten (docs/Titelbildschirm.md): eine Spielart gehört zum Lauf, nicht zu den Einstellungen, und lässt sich im
// Lauf nicht wechseln; "normal", "allmaechtig" (Testkammer, systeme/allmacht.js) und "arena" (Kämpfe nach einer
// Aufstellung in optionen.arena, systeme/arena.js), weitere (weich, friedlich, eigene Regeln) kommen als Startoption
export const SPIELARTEN = ["normal", "allmaechtig", "arena"];

// optionen: { eigenschaften?, spielart?, arena? } aus der Charaktererstellung (Eigenschaften geprüft in systeme/lernen.js
// lernenEinrichten) und der Wahl des Laufs; sie gehören zum Spielstand, damit das Nachspielen denselben Lauf erzeugt
export function neuesSpiel(daten, startwert, optionen = {}) {
  const startoptionen = { spielart: "normal", ...structuredClone(optionen) };
  if (!SPIELARTEN.includes(startoptionen.spielart)) throw new Error(`Unbekannte Spielart ${startoptionen.spielart}`);
  const zustand = neuerZustand(startwert >>> 0);
  const spiel = { daten, zustand, optionen: startoptionen, befehle: [], hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
  zustand.zufallszustand = zufallErzeugen(startwertAbleiten(zustand.startwert, "spiel"));
  // vor der ersten Ebene, damit schon ihre Gegenstände ihr Etikett tragen (systeme/kennen.js)
  etikettenZuordnen(spiel);
  // der Plan des Laufs steht fest, bevor die erste Ebene entsteht (welt/plan.js)
  laufPlanen(spiel);

  // Ninkasi beginnt auf der Treppe hinauf der Starttiefe des Plans (oder auf der Treppe hinab, wenn es keine gibt)
  zustand.tiefe = zustand.plan.starttiefe;
  const { treppeAuf, treppeAb } = ebeneErzeugen(spiel, zustand.tiefe);
  const ninkasi = ausDatenErzeugen(spiel, "wesen", "ninkasi", treppeAuf ?? treppeAb);
  zustand.spielerinId = ninkasi.id;
  lernenEinrichten(spiel, ninkasi, optionen.eigenschaften);
  for (const [, handler] of alleImRegister("laufbeginn")) handler(spiel, ninkasi);
  for (const entitaet of alleEntitaeten(zustand)) {
    if (entitaet.id === zustand.spielerinId || entitaet.ki) akteurEinreihen(zustand, entitaet.id, 0);
  }
  einreihen(zustand, { zeit: WELTTICK, art: "weltuhr" });
  sichtfeldAktualisieren(spiel);
  warteschlangeAbarbeiten(spiel);
  return spiel;
}

// Zeitkosten einer Aktion für eine Entität, mit Modifikatoren für die Aktion und für alle; umstaende siehe kern/werte.js
// grundkosten: abweichende Grundkosten (z.B. eines Angriffsprofils), Vorgabe das Tempo der Entität (grundkostenVon)
// Danach zwei Aufschläge in Prozent, zusammengezählt: Rüstung verlangsamt jede Aktion (systeme/ausruestung.js
// verlangsamungVon), Überladung (systeme/inventar.js lastZuschlag) nur das Bewegen.
export function zeitkosten(spiel, entitaet, aktion, umstaende = {}, grundkosten = grundkostenVon(spiel, entitaet, aktion)) {
  if (grundkosten === undefined) throw new Error(`Keine Kosten für Aktion "${aktion}" in daten/aktionen.js`);
  const kosten = modifiziert(spiel, entitaet, [`kosten.${aktion}`, "kosten.alle"], grundkosten, umstaende);
  const zuschlag = verlangsamungVon(spiel, entitaet) + (aktion === "bewegen" ? lastZuschlag(spiel, entitaet) : 0);
  return Math.max(1, zuschlag ? prozentVon(kosten, 100 + zuschlag) : kosten);
}

// Die gesteuerte Entität (vorerst Ninkasi) wartet auf eine Eingabe, außer ein Zustand gibt ihr eine KI (Furcht,
// Rausch, Psi-Kontrolle) oder eine lange Aktion läuft ohne Unterbrechung weiter
function wartetAufEingabe(zustand, eintrag) {
  const gesteuerte = gesteuerteEntitaet(zustand);
  if (!eintrag || eintrag.art !== "akteur" || !gesteuerte || eintrag.akteurId !== gesteuerte.id) return false;
  const aktionLaeuft = gesteuerte.laufendeAktion && !gesteuerte.laufendeAktion.unterbrochen;
  return !kiVon(gesteuerte) && !aktionLaeuft;
}

export function spielerinAmZug(spiel) {
  const zustand = spiel.zustand;
  return !zustand.vorbei && wartetAufEingabe(zustand, ersterEintrag(zustand));
}

// Gibt null zurück, wenn der Befehl gültig ist, sonst den Grund der Ablehnung
function befehlPruefen(spiel, akteur, befehl) {
  if (!befehl || typeof befehl.art !== "string" || !hat("befehle", befehl.art)) return "unbekannt";
  return holen("befehle", befehl.art).pruefen(spiel, akteur, befehl);
}

// Haken "vor_befehl": Zustände dürfen den Befehl verändern (Torkeln, Verwirrung); ein abgebrochener oder
// ungültig gewordener Befehl wird zu warten
function befehlVeraendern(spiel, akteur, befehl) {
  const kontext = hakenAusloesen(spiel, "vor_befehl", { akteurId: akteur.id, quelleId: akteur.id, zielId: null, kettentiefe: 0, befehl, abgebrochen: false });
  if (kontext.abgebrochen || befehlPruefen(spiel, akteur, kontext.befehl)) return { art: "warten" };
  return kontext.befehl;
}

// Führt einen gültigen Befehl aus, schließt den Vorgang ab und reiht die Akteurin wieder ein; gibt die Zeitkosten zurück
// (exportiert für Tests, im Spiel nur über befehlGeben und die KI)
export function befehlAusfuehren(spiel, akteur, befehl) {
  const wirksamerBefehl = befehlVeraendern(spiel, akteur, befehl);
  // jeder andere Befehl als "fortsetzen" bricht eine laufende Aktion ab
  if (akteur.laufendeAktion && wirksamerBefehl.art !== "fortsetzen") aktionAbbrechen(spiel, akteur, "befehl");
  // ausfuehren gibt die Aktionsart zurück oder { aktion, grundkosten?, umstaende?, ohneZeit? }
  const ergebnis = holen("befehle", wirksamerBefehl.art).ausfuehren(spiel, akteur, wirksamerBefehl);
  const { aktion, grundkosten, umstaende = {}, ohneZeit = false } = typeof ergebnis === "string" ? { aktion: ergebnis } : ergebnis;
  // Eine Aktion ohne Zeit (Sprint) zählt keinen Zug und lässt die letzte Aktion stehen; der Merker ohneZeitGenutzt
  // erlaubt bis zur nächsten Aktion mit Zeit keine weitere (systeme/faehigkeiten.js)
  if (ohneZeit) akteur.ohneZeitGenutzt = true;
  else {
    delete akteur.ohneZeitGenutzt;
    // Zugzähler: jede ausgeführte Aktion zählt als ein eigener Zug (Bilanz, Log, Speicherplätze);
    // die letzte Aktion bestimmt die Heimlichkeitsweite (systeme/wahrnehmung.js)
    akteur.zuege = (akteur.zuege ?? 0) + 1;
    akteur.letzteAktion = aktion;
  }
  // Haken zug_ende, solange die Akteurin noch im Spiel ist (z.B. Fallen entdecken, systeme/fallen.js)
  if (entitaetMitId(spiel.zustand, akteur.id)) hakenAusloesen(spiel, "zug_ende", { quelleId: akteur.id, zielId: akteur.id, akteurId: akteur.id, kettentiefe: 0 });
  vorgangAbschliessen(spiel);
  const zustand = spiel.zustand;
  const akteurNochImSpiel = entitaetMitId(zustand, akteur.id) && !(akteur.id === zustand.spielerinId && zustand.vorbei);
  if (!akteurNochImSpiel) return null;
  // ohne Zeit kommt sie sofort wieder an die Reihe; bei Gleichstand ordnet die ID, also vor allen, die nach ihr kamen
  const kosten = ohneZeit ? 0 : zeitkosten(spiel, akteur, aktion, umstaende, grundkosten);
  // Aufschub: eine Betäubung, während sie selbst handelte und keinen Eintrag hatte (systeme/betaeubung.js)
  const aufschub = akteur.aufschub ?? 0;
  delete akteur.aufschub;
  akteurEinreihen(zustand, akteur.id, kosten + aufschub);
  return kosten;
}

// Befehlsarten mit ohneZeit (z.B. lernen, systeme/skills.js) kosten keine Spielzeit: kein Zug, kein Zugzähler, kein
// zug_ende, kein vor_befehl, keine Unterbrechung einer laufenden Aktion; aufgezeichnet werden sie wie alle anderen
function befehlOhneZeit(befehl) {
  return Boolean(befehl && typeof befehl.art === "string" && hat("befehle", befehl.art) && holen("befehle", befehl.art).ohneZeit);
}

function befehlOhneZeitGeben(spiel, ninkasi, befehl) {
  const grund = befehlPruefen(spiel, ninkasi, befehl);
  if (grund) {
    melden(spiel, "abgelehnt", { grund, befehl });
    return { ok: false, grund };
  }
  spiel.befehle.push(structuredClone(befehl));
  holen("befehle", befehl.art).ausfuehren(spiel, ninkasi, befehl);
  vorgangAbschliessen(spiel);
  return { ok: true };
}

// Die Eingangstür: einziger Weg, wie Entscheidungen der Spielerin in die Logik gelangen.
// Gibt { ok: true } oder { ok: false, grund } zurück; abgelehnte Befehle kosten nichts.
// Befehle gehen an die gesteuerte Entität (vorerst Ninkasi); Befehle ohne Zeit (lernen) gehen an Ninkasi selbst.
// Ist die gesteuerte Entität handlungsunfähig, wird jede Eingabe angenommen, aufgezeichnet und als warten ausgeführt
// (Meldung "handlungsunfaehig", Rückgabe { ok: true, handlungsunfaehig: true }).
export function befehlGeben(spiel, befehl) {
  const zustand = spiel.zustand;
  if (zustand.vorbei) return { ok: false, grund: "vorbei" };
  if (!spielerinAmZug(spiel)) return { ok: false, grund: "nicht_am_zug" };
  if (befehlOhneZeit(befehl)) return befehlOhneZeitGeben(spiel, spielerin(zustand), befehl);
  const gesteuerte = gesteuerteEntitaet(zustand);
  if (istHandlungsunfaehig(spiel, gesteuerte)) {
    spiel.befehle.push(structuredClone(befehl ?? null));
    melden(spiel, "handlungsunfaehig", { wer: bezugAuf(gesteuerte) });
    ersterEintragEntnehmen(zustand);
    befehlAusfuehren(spiel, gesteuerte, { art: "warten" });
    warteschlangeAbarbeiten(spiel);
    return { ok: true, handlungsunfaehig: true };
  }
  const grund = befehlPruefen(spiel, gesteuerte, befehl);
  if (grund) {
    melden(spiel, "abgelehnt", { grund, befehl });
    return { ok: false, grund };
  }
  spiel.befehle.push(structuredClone(befehl));
  ersterEintragEntnehmen(zustand);
  befehlAusfuehren(spiel, gesteuerte, befehl);
  warteschlangeAbarbeiten(spiel);
  return { ok: true };
}

// Arbeitet die Warteschlange ab, bis die gesteuerte Entität am Zug ist oder das Spiel vorbei ist (exportiert für Tests)
export function warteschlangeAbarbeiten(spiel) {
  const zustand = spiel.zustand;
  let schleifenschutz = 0;
  while (!zustand.vorbei) {
    const eintrag = ersterEintrag(zustand);
    if (!eintrag) return;
    // lange Aktion: die Logik führt den nächsten Schritt selbst aus, sofern nichts unterbricht
    const akteurMitAktion = eintrag.art === "akteur" ? entitaetMitId(zustand, eintrag.akteurId) : null;
    if (akteurMitAktion?.laufendeAktion) {
      const weiter = laufendeAktionVorDemZug(spiel, akteurMitAktion);
      vorgangAbschliessen(spiel);
      if (zustand.vorbei) return;
      if (weiter) {
        ersterEintragEntnehmen(zustand);
        befehlAusfuehren(spiel, akteurMitAktion, { art: "fortsetzen" });
        if (++schleifenschutz > 1000000) throw new Error("Warteschlange läuft endlos");
        continue;
      }
    }
    if (wartetAufEingabe(zustand, eintrag)) return;
    ersterEintragEntnehmen(zustand);
    if (eintrag.art === "weltuhr") {
      for (const [, handler] of alleImRegister("welttick")) {
        handler(spiel);
        vorgangAbschliessen(spiel);
      }
      einreihen(zustand, { zeit: zustand.zeit + WELTTICK, art: "weltuhr" });
    } else if (eintrag.art === "ereignis") {
      holen("zeitereignisse", eintrag.ereignistyp)(spiel, eintrag.daten);
      vorgangAbschliessen(spiel);
    } else {
      const akteur = entitaetMitId(zustand, eintrag.akteurId);
      const ki = akteur && kiVon(akteur);
      if (!ki) continue;
      wahrnehmen(spiel, akteur);
      let befehl = istHandlungsunfaehig(spiel, akteur) ? { art: "warten" } : holen("ki", ki.modul)(spiel, akteur, ki);
      if (befehlPruefen(spiel, akteur, befehl)) befehl = { art: "warten" };
      befehlAusfuehren(spiel, akteur, befehl);
    }
    if (++schleifenschutz > 1000000) throw new Error("Warteschlange läuft endlos");
  }
}

// Spielstand = Version + Prüfsumme der Daten + Startwert + Startoptionen + Befehlsliste; Laden heißt Nachspielen ohne
// Anzeige
export function spielstand(spiel) {
  return { version: VERSION, pruefsumme: spiel.daten.pruefsumme, startwert: spiel.zustand.startwert, optionen: structuredClone(spiel.optionen ?? {}), befehle: structuredClone(spiel.befehle) };
}

// Schnappschuss = Spielstand + Kopie des Zustands (reines JSON); Fortsetzen daraus braucht kein Nachspielen.
// Der räumliche Index und der Zwischenspeicher sind aus dem Zustand ableitbar und entstehen beim ersten Zugriff neu.
// Zwischen zwei Befehlen sind die vorgemerkten Auslöser leer, ein Schnappschuss nach einem Befehl verliert also nichts.
export function schnappschuss(spiel) {
  return { ...spielstand(spiel), zustand: structuredClone(spiel.zustand) };
}

// Passt ein Spielstand zu dieser Version und diesen Daten? null oder der Grund: "version" oder "daten" (Prüfsumme der
// Daten weicht ab, kern/pruefsumme.js); streng, weil ein Zustand per Namen auf die Daten verweist und ein Lauf aus
// alten und neuen Daten nicht mehr nachspielbar wäre
export function spielstandUnpassend(daten, stand) {
  if (stand.version !== VERSION) return "version";
  if (stand.pruefsumme !== daten.pruefsumme) return "daten";
  return null;
}

function spielstandPruefen(daten, stand) {
  const grund = spielstandUnpassend(daten, stand);
  if (grund === "version") throw new Error(`Spielstand von Version ${stand.version}, dieses Spiel ist ${VERSION}`);
  if (grund === "daten") throw new Error(`Spielstand mit Prüfsumme der Daten ${stand.pruefsumme}, diese Daten haben ${daten.pruefsumme}`);
}

export function ausSchnappschuss(daten, stand) {
  spielstandPruefen(daten, stand);
  if (!stand.zustand) throw new Error("Spielstand ohne Zustand");
  return { daten, zustand: structuredClone(stand.zustand), optionen: structuredClone(stand.optionen ?? {}), befehle: structuredClone(stand.befehle ?? []), hoerer: [], zwischenspeicher: {}, anstehendeAusloeser: [] };
}

export function nachspielen(daten, stand) {
  spielstandPruefen(daten, stand);
  const spiel = neuesSpiel(daten, stand.startwert, stand.optionen ?? {});
  stand.befehle.forEach((befehl, nummer) => {
    const ergebnis = befehlGeben(spiel, befehl);
    if (!ergebnis.ok) throw new Error(`Spielstand passt nicht: Befehl ${nummer} abgelehnt (${ergebnis.grund})`);
  });
  return spiel;
}
