// Brauen (siehe docs/Sude.md, Befehl und Wirkung; Spieldesign in docs/Brauen.md): ein Sud am Kessel aus Zutaten im
// Gepäck, abgefüllt in leere Gefäße; die Rechnung steht in systeme/sud.js.
// Befehl: { art: "brauen", kessel?: { x, y }, portionen?, zutaten: [{ gegenstandId, menge }], verfahren?: { maische, gewuerz },
//           kultur? }
//   kessel:    ein Feld mit Kessel neben oder unter der Brauerin; ohne Angabe der erste in fester Reihenfolge
//   portionen: wie viele Gefäße der Sud füllt, sein Volumen; höchstens portionen des Kessels, Vorgabe so viele, wie
//              Kessel und leere Gefäße erlauben; je Portion höchstens regeln.brauen.stueckeJePortion Stück Zutaten
//   verfahren: Schlüssel aus regeln.brauen.maische und regeln.brauen.gewuerz, Vorgabe regeln.brauen.verfahren
//   kultur:    eine Kultur der Brauerin (wesen.kulturen) oder "spontan" (die Flora der Ebene, systeme/flora.js); ohne
//              Kultur wird der Sud ein Absud (systeme/absud.js)
//   absicht:   nur für den Absud: "elixier" (Vorgabe) oder "gift"
//   Ablehnungen: im_kampf, kein_kessel, keine_zutaten, keine_zutat, zu_viel, kessel_voll, zu_viele_portionen,
//                kultur_unbekannt, keine_flora (spontan auf einer Ebene ohne Flora), keine_gefaesse (weniger leere Gefäße
//                als Portionen), ungueltig
// Ablauf: der Wurf "brauen" setzt je Achse den Punkt im Bereich der Vorschau, der Wurf "verderben" (1 bis 100)
// entscheidet: bis zur Chance des Verderbens verdorben (dann vielleicht ein Verderber, systeme/reifen.js), bis zu ihr plus
// regeln.brauen.schwach.chance sauer (die Säure steigt um schwach.plus), sonst gelungen; Zutaten und Gefäße sind
// verbraucht, die Portionen kommen ins Gepäck und beginnen zu reifen (systeme/reifen.js).
// Meldungen: gebraut (ohne Zielgebiet), gebraut_getroffen (mit zielgebiet), gebraut_verdorben, je mit wer, was, anzahl
// Absud: der Wurf "absud" (1 bis 100) wählt zwischen misslungen, gelungen und umgeschlagen (systeme/absud.js); die Kräuter
// darin lernt Ninkasi kennen, die Sorte erkennt sie; Meldungen absud_gelungen, absud_umgeschlagen, absud_misslungen mit
// wer, was und anzahl. Ein Absud verdirbt nicht.
// Baustein sud_wirken: wirkt beim Trinken den Sud aus der Ablage (kontext.werte.sud, gesetzt von trinken in
// systeme/inventar.js): Heilung je Wert, Zustände über die Zeit, Pegel, Effekt des Zielgebiets.
// Zutaten aufheben (Haken aufgehoben): beim ersten Aufheben einer Zutatenart im Lauf bekommt Ninkasi Wissens-EP
// (systeme/wissen.js); Kulturen gewinnen steht in systeme/kulturen.js.

import { anmelden, holen } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, ausDatenErzeugen, ausDemInventarNehmen } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { effektAnwenden } from "../kern/effekte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { modifiziert } from "../kern/werte.js";
import { WELTTICK } from "../kern/zeit.js";
import { wurfGanzzahl } from "../kern/wurf.js";
import { gelaendeAuf } from "../welt/karte.js";
import { imKampf } from "./kampfzustand.js";
import { insInventar, anzahlVon } from "./inventar.js";
import { zutatGebucht } from "./wissen.js";
import { aufgedeckteZielgebiete, rezeptFinden, nachDemSud } from "./rezepte.js";
import { stufenBeginnen, verderberWuerfeln } from "./reifen.js";
import { POLE, gegenpol, absudregeln, absudVorbereiten, ausgangWuerfeln, getraenkFuer, krautKennenlernen } from "./absud.js";
import { erkennen } from "./kennen.js";
import {
  brauregeln, achsenVon, sudRechnen, unschaerfeBerechnen, kulturdatenVon, SPONTAN, bereichBerechnen, zielgebietFinden, erreichbareZielgebiete,
  profilRunden, gueteRunden, wirkungBerechnen,
} from "./sud.js";

// Felder um die Brauerin in fester Reihenfolge, das eigene zuerst
const NACHBARN = [[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Kessel { x, y, kessel } neben oder unter dem Wesen; mit feld nur dort, sonst der erste; null ohne
export function kesselBei(spiel, wesen, feld = null) {
  if (!wesen?.position) return null;
  for (const [dx, dy] of NACHBARN) {
    const x = wesen.position.x + dx, y = wesen.position.y + dy;
    if (feld && (feld.x !== x || feld.y !== y)) continue;
    const kessel = gelaendeAuf(spiel, x, y)?.kessel;
    if (kessel) return { x, y, kessel };
  }
  return null;
}

const imGepaeck = (wesen, id) => Boolean(wesen.inventar) && wesen.inventar.includes(id);
const gegenstaendeIm = (spiel, wesen) => (wesen.inventar || []).map((id) => entitaetMitId(spiel.zustand, id)).filter(Boolean);

// Zutaten im Gepäck in seiner Reihenfolge
export const zutatenIm = (spiel, wesen) => gegenstaendeIm(spiel, wesen).filter((gegenstand) => gegenstand.zutat);
// Leere Gefäße im Gepäck in seiner Reihenfolge, ohne Angelegtes
export const gefaesseIm = (spiel, wesen) => gegenstaendeIm(spiel, wesen).filter((gegenstand) => gegenstand.gefaess && !(wesen.ausgeruestet || []).includes(gegenstand.id));
const anzahlGefaesse = (spiel, wesen) => gefaesseIm(spiel, wesen).reduce((summe, gefaess) => summe + anzahlVon(gefaess), 0);

// Prüft einen Befehl und rechnet seine Vorschau; { grund } oder { kessel, eingabe, mitte, gaerung, unschaerfe, bereich,
// erreichbar, fuellung, fassen, portionen, gefaesse, rezept }; erreichbar nennt nur aufgedeckte Zielgebiete, rezept ist
// der Schlüssel des Rezepts im Buch, nach dem gebraut wird (systeme/rezepte.js), oder null. Die Vorschau prüft weder den Kampf noch die Gefäße, damit das
// Fenster auch dann rechnet; fassen ist die höchste Füllung für diese Portionen. Ohne Kultur ein Absud: { art: "absud",
// kessel, eingabe: { zutaten, portionen, absicht }, wahr, vermutet, unbekannt, fuellung, fassen, portionen, gefaesse,
// rezept: null } (systeme/absud.js absudVorbereiten).
export function sudVorbereiten(spiel, wesen, befehl) {
  const regeln = brauregeln(spiel.daten);
  const kessel = kesselBei(spiel, wesen, befehl.kessel ?? null);
  if (!kessel) return { grund: "kein_kessel" };
  const verfahren = { ...regeln.verfahren, ...befehl.verfahren };
  if (!regeln.maische[verfahren.maische] || !regeln.gewuerz[verfahren.gewuerz]) return { grund: "ungueltig" };
  const kultur = befehl.kultur ?? null;
  const absicht = befehl.absicht ?? POLE[0];
  if (kultur === null && !POLE.includes(absicht)) return { grund: "ungueltig" };
  const flora = spiel.zustand.ebene?.flora ?? null;
  if (kultur === SPONTAN && !flora) return { grund: "keine_flora" };
  if (kultur !== null && kultur !== SPONTAN && !(wesen.kulturen || []).includes(kultur)) return { grund: "kultur_unbekannt" };
  if (!Array.isArray(befehl.zutaten) || befehl.zutaten.length === 0) return { grund: "keine_zutaten" };
  const zutaten = [], gesehen = new Set();
  let fuellung = 0;
  for (const { gegenstandId, menge } of befehl.zutaten) {
    if (!Number.isInteger(menge) || menge < 1 || gesehen.has(gegenstandId)) return { grund: "ungueltig" };
    gesehen.add(gegenstandId);
    const gegenstand = imGepaeck(wesen, gegenstandId) ? entitaetMitId(spiel.zustand, gegenstandId) : null;
    if (!gegenstand?.zutat) return { grund: "keine_zutat" };
    if (menge > anzahlVon(gegenstand)) return { grund: "zu_viel" };
    zutaten.push({ typ: gegenstand.typ, menge });
    fuellung += menge;
  }
  const gefaesse = anzahlGefaesse(spiel, wesen);
  const portionen = befehl.portionen ?? Math.max(1, Math.min(kessel.kessel.portionen, gefaesse));
  if (!Number.isInteger(portionen) || portionen < 1) return { grund: "ungueltig" };
  if (portionen > kessel.kessel.portionen) return { grund: "zu_viele_portionen" };
  const fassen = portionen * regeln.stueckeJePortion;
  if (fuellung > fassen) return { grund: "kessel_voll" };
  if (kultur === null) {
    const eingabe = { zutaten, portionen, absicht };
    return { art: "absud", kessel, eingabe, ...absudVorbereiten(spiel, wesen, eingabe), fuellung, fassen, portionen, gefaesse, rezept: null };
  }
  const kulturdaten = kulturdatenVon(spiel.daten, kultur, flora);
  const vertraegt = kulturdaten ? modifiziert(spiel, wesen, "brauen.vertraegt", kulturdaten.vertraegt) : undefined;
  const eingabe = { zutaten, verfahren, kultur, portionen, vertraegt, ...(kultur === SPONTAN && { flora }) };
  const { profil: mitte, gaerung } = sudRechnen(spiel.daten, eingabe);
  // nach Rezept wird die Vorschau eng (regeln.brauen.rezeptUnschaerfe Prozent)
  const rezept = rezeptFinden(spiel, eingabe);
  const spontan = kultur === SPONTAN ? regeln.spontan.unschaerfe : 100;
  const grundUnschaerfe = Math.floor(((kessel.kessel.unschaerfe ?? 100) * (rezept ? regeln.rezeptUnschaerfe : 100) * spontan) / 10000);
  const unschaerfe = unschaerfeBerechnen(spiel.daten, modifiziert(spiel, wesen, "brauen.unschaerfe", grundUnschaerfe));
  const bereich = bereichBerechnen(spiel.daten, mitte, unschaerfe);
  const erreichbar = erreichbareZielgebiete(spiel.daten, bereich, aufgedeckteZielgebiete(spiel));
  return { kessel, eingabe, mitte, gaerung, unschaerfe, bereich, erreichbar, fuellung, fassen, portionen, gefaesse, rezept };
}

// Chance in Prozent, dass ein Sud verdirbt: Regelwert plus Kessel plus Kultur (oder Flora), mit Modifikatoren auf
// brauen.verderben
export function verderbenChance(spiel, wesen, vorbereitet) {
  const kultur = kulturdatenVon(spiel.daten, vorbereitet.eingabe.kultur, vorbereitet.eingabe.flora);
  const grund = brauregeln(spiel.daten).verderben + (vorbereitet.kessel.kessel.verderben ?? 0) + (kultur?.verderben ?? 0);
  return Math.max(0, Math.min(100, modifiziert(spiel, wesen, "brauen.verderben", grund)));
}

// Nimmt menge Stück von einem Stapel im Gepäck, ohne neue Entitäten
function mengeVerbrauchen(spiel, wesen, gegenstand, menge) {
  if (anzahlVon(gegenstand) > menge) {
    gegenstand.anzahl = anzahlVon(gegenstand) - menge;
    return;
  }
  ausDemInventarNehmen(wesen, gegenstand.id);
  entitaetEntfernen(spiel.zustand, gegenstand.id);
}

// Punkt des Suds: je Achse in fester Reihenfolge ein Wurf im Bereich um die Mitte
function punktWuerfeln(spiel, vorbereitet) {
  const punkt = {};
  for (const achse of achsenVon(spiel.daten)) {
    const [unten, oben] = vorbereitet.bereich[achse];
    punkt[achse] = unten === oben ? unten : wurfGanzzahl(spiel, "brauen", unten, oben);
  }
  return punkt;
}

// Chance in Prozent, dass ein Sud nicht verdirbt, aber sauer wird (nach der Chance des Verderbens gewürfelt)
export function sauerChance(spiel, wesen, vorbereitet) {
  return Math.max(0, Math.min(100 - verderbenChance(spiel, wesen, vorbereitet), brauregeln(spiel.daten).schwach.chance));
}

// Ergebnis eines Suds: { typ, sud, text?, verdorben } für die Portionen
function ergebnisBestimmen(spiel, wesen, vorbereitet) {
  const daten = spiel.daten, regeln = brauregeln(daten);
  const punkt = punktWuerfeln(spiel, vorbereitet);
  const wurf = wurfGanzzahl(spiel, "verderben", 1, 100), verderben = verderbenChance(spiel, wesen, vorbereitet);
  if (wurf <= verderben) {
    const { achse, plus, guete, getraenk } = regeln.verdorben;
    punkt[achse] = Math.min(regeln.achsen[achse].hoechstens, punkt[achse] + plus);
    return { typ: getraenk, sud: { profil: profilRunden(daten, punkt), zielgebiet: null, guete }, verdorben: true };
  }
  // ein schwacher Wurf schiebt den Sud Richtung Säure, vor der Suche nach dem Zielgebiet
  if (wurf <= verderben + sauerChance(spiel, wesen, vorbereitet)) {
    const achse = regeln.verdorben.achse;
    punkt[achse] = Math.min(regeln.achsen[achse].hoechstens, punkt[achse] + regeln.schwach.plus);
  }
  const treffer = zielgebietFinden(daten, punkt);
  const sud = { profil: profilRunden(daten, punkt), zielgebiet: treffer?.name ?? null, guete: treffer ? gueteRunden(daten, treffer.guete) : regeln.gueteFrei };
  // nach einem gefundenen Rezept, das sein Zielgebiet trifft: der Kniff wirkt (systeme/sud.js wirkungBerechnen)
  const rezept = vorbereitet.rezept ? spiel.zustand.rezepte[vorbereitet.rezept] : null;
  if (rezept?.art === "gefunden" && rezept.zielgebiet === treffer?.name) sud.rezept = vorbereitet.rezept;
  return { typ: regeln.getraenk, sud, ...(treffer && { text: daten.zielgebiete[treffer.name].text }) };
}

anmelden("befehle", "brauen", {
  pruefen(spiel, akteur, befehl) {
    if (imKampf(spiel, akteur)) return "im_kampf";
    const vorbereitet = sudVorbereiten(spiel, akteur, befehl);
    if (vorbereitet.grund) return vorbereitet.grund;
    return vorbereitet.gefaesse >= vorbereitet.portionen ? null : "keine_gefaesse";
  },
  ausfuehren(spiel, akteur, befehl) {
    const vorbereitet = sudVorbereiten(spiel, akteur, befehl);
    if (vorbereitet.art === "absud") return absudAbfuellen(spiel, akteur, befehl, vorbereitet);
    const ergebnis = ergebnisBestimmen(spiel, akteur, vorbereitet);
    for (const { gegenstandId, menge } of befehl.zutaten) mengeVerbrauchen(spiel, akteur, entitaetMitId(spiel.zustand, gegenstandId), menge);
    const portion = portionenAbfuellen(spiel, akteur, vorbereitet.portionen, ergebnis.typ, (getraenk) => {
      getraenk.sud = structuredClone(ergebnis.sud);
      if (ergebnis.text) getraenk.text = ergebnis.text;
      stufenBeginnen(spiel, akteur, getraenk, ergebnis.verdorben);
    });
    const art = ergebnis.typ !== brauregeln(spiel.daten).getraenk ? "gebraut_verdorben" : ergebnis.sud.zielgebiet ? "gebraut_getroffen" : "gebraut";
    melden(spiel, art, { wer: bezugAuf(akteur), was: { ...bezugAuf(portion), anzahl: vorbereitet.portionen }, anzahl: vorbereitet.portionen, zielgebiet: ergebnis.sud.zielgebiet });
    if (art === "gebraut_getroffen") nachDemSud(spiel, akteur, vorbereitet, ergebnis.sud.zielgebiet);
    if (ergebnis.verdorben) verderberWuerfeln(spiel, vorbereitet.kessel, kulturdatenVon(spiel.daten, vorbereitet.eingabe.kultur, vorbereitet.eingabe.flora));
    return "brauen";
  },
});

// Füllt so viele Portionen eines Gegenstands typ ab, je Portion ein Gefäß in der Reihenfolge des Gepäcks; das Getränk
// wiegt sein Gefäß und wird nach dem Trinken wieder dazu; einrichten(getraenk) setzt vor dem Einsortieren, was es trägt.
// Gibt die letzte Portion im Gepäck (für die Meldung)
function portionenAbfuellen(spiel, akteur, portionen, typ, einrichten) {
  let portion = null;
  for (let i = 0; i < portionen; i++) {
    const gefaess = gefaesseIm(spiel, akteur)[0];
    const gefaessTyp = gefaess.typ, gefaessGewicht = gefaess.gewicht ?? 0;
    mengeVerbrauchen(spiel, akteur, gefaess, 1);
    const getraenk = ausDatenErzeugen(spiel, "gegenstaende", typ, null);
    getraenk.wirdZu = gefaessTyp;
    getraenk.gewicht = gefaessGewicht + brauregeln(spiel.daten).gewichtJePortion;
    einrichten(getraenk);
    portion = insInventar(spiel, akteur, getraenk);
  }
  return portion;
}

// Ein Absud am Kessel (siehe Kopf und systeme/absud.js), gewürfelt nach den wahren Chancen
function absudAbfuellen(spiel, akteur, befehl, vorbereitet) {
  const { wahr, eingabe } = vorbereitet;
  const regeln = absudregeln(spiel.daten);
  const ausgang = ausgangWuerfeln(wurfGanzzahl(spiel, "absud", 1, 100), wahr.chancen);
  for (const { gegenstandId, menge } of befehl.zutaten) mengeVerbrauchen(spiel, akteur, entitaetMitId(spiel.zustand, gegenstandId), menge);
  for (const typ of vorbereitet.unbekannt) krautKennenlernen(spiel, akteur, typ);
  const pol = ausgang === "gelungen" ? eingabe.absicht : gegenpol(eingabe.absicht);
  const typ = ausgang === "misslungen" ? regeln.misslungen : getraenkFuer(spiel.daten, wahr.fuehrend, pol);
  // erkannt vor dem Erzeugen, damit die Portionen kein Etikett tragen (systeme/kennen.js)
  erkennen(spiel, akteur, typ);
  const portion = portionenAbfuellen(spiel, akteur, vorbereitet.portionen, typ, (getraenk) => {
    if (ausgang === "misslungen") return;
    getraenk.absud = { richtung: wahr.fuehrend, pol, staerke: wahr.staerke };
    const adjektiv = regeln.adjektive?.[wahr.staerke];
    if (adjektiv) getraenk.adjektive = [adjektiv];
  });
  melden(spiel, `absud_${ausgang}`, { wer: bezugAuf(akteur), was: { ...bezugAuf(portion), anzahl: vorbereitet.portionen }, anzahl: vorbereitet.portionen });
  return "brauen";
}

// Wirkung eines getrunkenen Suds, siehe wirkungBerechnen in systeme/sud.js
bausteinAnmelden("sud_wirken", {}, (spiel, kontext) => {
  const sud = kontext.werte.sud;
  if (!sud) return;
  const wirkung = wirkungBerechnen(spiel.daten, sud);
  for (const [wertName, menge] of Object.entries(wirkung.mengen)) holen("bausteine", "heilen")(spiel, kontext, { wertName, menge });
  // über die Zeit: je Menge genau ein Welttick des Zustands (Süße heilt so nach und nach, daten/zustaende.js); die
  // Dauer endet eine Zeiteinheit nach dem letzten Takt, damit auch er wirkt, wo auch immer im Takt getrunken wird
  for (const { zustand, menge } of wirkung.zustaende) holen("bausteine", "zustand_setzen")(spiel, kontext, { zustand, dauer: menge * WELTTICK + 1 });
  if (wirkung.pegel > 0) holen("bausteine", "wert_aendern")(spiel, kontext, { wertName: "pegel", menge: wirkung.pegel });
  for (const effekt of wirkung.effekte) effektAnwenden(spiel, effekt, kontext);
}, { brauchtZiel: true });

// Aufgehobene Zutaten: Wissens-EP (siehe Kopf)
anmelden("haken", "aufgehoben", (spiel, kontext) => {
  const wesen = entitaetMitId(spiel.zustand, kontext.quelleId), gegenstand = entitaetMitId(spiel.zustand, kontext.gegenstandId);
  if (wesen && gegenstand?.zutat) zutatGebucht(spiel, wesen, gegenstand.typ);
});
