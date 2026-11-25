// Brauen (siehe docs/Sude.md, Befehl und Wirkung; Spieldesign in docs/Brauen.md): ein Sud am Kessel aus Zutaten im
// Gepäck, abgefüllt in leere Gefäße; die Rechnung steht in systeme/sud.js.
// Befehl: { art: "brauen", kessel?: { x, y }, portionen?, zutaten: [{ gegenstandId, menge }], verfahren?: { maische, gewuerz },
//           kultur? }
//   kessel:    ein Feld mit Kessel neben oder unter der Brauerin; ohne Angabe der erste in fester Reihenfolge
//   portionen: wie viele Gefäße der Sud füllt, sein Volumen; höchstens portionen des Kessels, Vorgabe so viele, wie
//              Kessel und leere Gefäße erlauben; je Portion höchstens regeln.brauen.stueckeJePortion Stück Zutaten
//   verfahren: Schlüssel aus regeln.brauen.maische und regeln.brauen.gewuerz, Vorgabe regeln.brauen.verfahren
//   kultur:    eine Kultur der Brauerin (wesen.kulturen), ohne sie gärt der Sud nicht (kein Alkohol)
//   Ablehnungen: im_kampf, kein_kessel, keine_zutaten, keine_zutat, zu_viel, kessel_voll, zu_viele_portionen,
//                kultur_unbekannt, keine_gefaesse (weniger leere Gefäße als Portionen), ungueltig
// Ablauf: der Wurf "brauen" setzt je Achse den Punkt im Bereich der Vorschau, der Wurf "verderben" entscheidet über das
// Verderben; Zutaten und Gefäße sind verbraucht, die Portionen kommen ins Gepäck (sie stapeln nach gerundetem Profil).
// Meldungen: gebraut (ohne Zielgebiet), gebraut_getroffen (mit zielgebiet), gebraut_verdorben, je mit wer, was, anzahl
// Baustein sud_wirken: wirkt beim Trinken den Sud aus der Ablage (kontext.werte.sud, gesetzt von trinken in
// systeme/inventar.js): Heilung je Wert, Zustände über die Zeit, Pegel, Effekt des Zielgebiets.
// Kulturen gewinnen (Haken aufgehoben): ein Gegenstand mit kultur: name gibt seine Kultur an das Wesen, das ihn aufhebt,
// und vergeht (Meldung kultur_gewonnen, schon gehabt kultur_bekannt); Ninkasi bekommt beim ersten Gewinn einer Kultur und beim ersten
// Aufheben einer Zutatenart im Lauf Wissens-EP (systeme/wissen.js).

import { anmelden, holen } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, ausDatenErzeugen, ausDemInventarNehmen } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { effektAnwenden } from "../kern/effekte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { modifiziert } from "../kern/werte.js";
import { WELTTICK } from "../kern/zeit.js";
import { wurfGanzzahl, wurfProzent } from "../kern/wurf.js";
import { gelaendeAuf } from "../welt/karte.js";
import { imKampf } from "./kampfzustand.js";
import { insInventar, anzahlVon } from "./inventar.js";
import { kulturGebucht, zutatGebucht } from "./wissen.js";
import { aufgedeckteZielgebiete, rezeptFinden, nachDemSud } from "./rezepte.js";
import {
  brauregeln, achsenVon, sudRechnen, unschaerfeBerechnen, bereichBerechnen, zielgebietFinden, erreichbareZielgebiete,
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
// Fenster auch dann rechnet; fassen ist die höchste Füllung für diese Portionen.
export function sudVorbereiten(spiel, wesen, befehl) {
  const regeln = brauregeln(spiel.daten);
  const kessel = kesselBei(spiel, wesen, befehl.kessel ?? null);
  if (!kessel) return { grund: "kein_kessel" };
  const verfahren = { ...regeln.verfahren, ...befehl.verfahren };
  if (!regeln.maische[verfahren.maische] || !regeln.gewuerz[verfahren.gewuerz]) return { grund: "ungueltig" };
  const kultur = befehl.kultur ?? null;
  if (kultur !== null && !(wesen.kulturen || []).includes(kultur)) return { grund: "kultur_unbekannt" };
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
  const vertraegt = kultur === null ? undefined : modifiziert(spiel, wesen, "brauen.vertraegt", spiel.daten.kulturen[kultur].vertraegt);
  const eingabe = { zutaten, verfahren, kultur, portionen, vertraegt };
  const { profil: mitte, gaerung } = sudRechnen(spiel.daten, eingabe);
  // nach Rezept wird die Vorschau eng (regeln.brauen.rezeptUnschaerfe Prozent)
  const rezept = rezeptFinden(spiel, eingabe);
  const grundUnschaerfe = Math.floor(((kessel.kessel.unschaerfe ?? 100) * (rezept ? regeln.rezeptUnschaerfe : 100)) / 100);
  const unschaerfe = unschaerfeBerechnen(spiel.daten, modifiziert(spiel, wesen, "brauen.unschaerfe", grundUnschaerfe));
  const bereich = bereichBerechnen(spiel.daten, mitte, unschaerfe);
  const erreichbar = erreichbareZielgebiete(spiel.daten, bereich, aufgedeckteZielgebiete(spiel));
  return { kessel, eingabe, mitte, gaerung, unschaerfe, bereich, erreichbar, fuellung, fassen, portionen, gefaesse, rezept };
}

// Chance in Prozent, dass ein Sud verdirbt: Regelwert plus Kessel plus Kultur, mit Modifikatoren auf brauen.verderben
export function verderbenChance(spiel, wesen, vorbereitet) {
  const kultur = vorbereitet.eingabe.kultur ? spiel.daten.kulturen[vorbereitet.eingabe.kultur] : null;
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

// Ergebnis eines Suds: { typ, sud, text? } für die Portionen
function ergebnisBestimmen(spiel, wesen, vorbereitet) {
  const daten = spiel.daten, regeln = brauregeln(daten);
  const punkt = punktWuerfeln(spiel, vorbereitet);
  if (wurfProzent(spiel, "verderben", verderbenChance(spiel, wesen, vorbereitet))) {
    const { achse, plus, guete, getraenk } = regeln.verdorben;
    punkt[achse] = Math.min(regeln.achsen[achse].hoechstens, punkt[achse] + plus);
    return { typ: getraenk, sud: { profil: profilRunden(daten, punkt), zielgebiet: null, guete } };
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
    const ergebnis = ergebnisBestimmen(spiel, akteur, vorbereitet);
    for (const { gegenstandId, menge } of befehl.zutaten) mengeVerbrauchen(spiel, akteur, entitaetMitId(spiel.zustand, gegenstandId), menge);
    // je Portion ein Gefäß in der Reihenfolge des Gepäcks; das Getränk wiegt sein Gefäß und wird nach dem Trinken wieder dazu
    let portion = null;
    for (let i = 0; i < vorbereitet.portionen; i++) {
      const gefaess = gefaesseIm(spiel, akteur)[0];
      const gefaessTyp = gefaess.typ, gefaessGewicht = gefaess.gewicht ?? 0;
      mengeVerbrauchen(spiel, akteur, gefaess, 1);
      const getraenk = ausDatenErzeugen(spiel, "gegenstaende", ergebnis.typ, null);
      getraenk.sud = structuredClone(ergebnis.sud);
      if (ergebnis.text) getraenk.text = ergebnis.text;
      getraenk.wirdZu = gefaessTyp;
      getraenk.gewicht = gefaessGewicht + brauregeln(spiel.daten).gewichtJePortion;
      portion = insInventar(spiel, akteur, getraenk);
    }
    const art = ergebnis.typ !== brauregeln(spiel.daten).getraenk ? "gebraut_verdorben" : ergebnis.sud.zielgebiet ? "gebraut_getroffen" : "gebraut";
    melden(spiel, art, { wer: bezugAuf(akteur), was: { ...bezugAuf(portion), anzahl: vorbereitet.portionen }, anzahl: vorbereitet.portionen, zielgebiet: ergebnis.sud.zielgebiet });
    if (art === "gebraut_getroffen") nachDemSud(spiel, akteur, vorbereitet, ergebnis.sud.zielgebiet);
    return "brauen";
  },
});

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

// Aufgehobenes: Kulturen gewinnen, Wissens-EP für Zutaten (siehe Kopf)
anmelden("haken", "aufgehoben", (spiel, kontext) => {
  const wesen = entitaetMitId(spiel.zustand, kontext.quelleId), gegenstand = entitaetMitId(spiel.zustand, kontext.gegenstandId);
  if (!wesen || !gegenstand) return;
  if (gegenstand.zutat) zutatGebucht(spiel, wesen, gegenstand.typ);
  const kultur = gegenstand.kultur;
  if (!kultur) return;
  const neu = !(wesen.kulturen || []).includes(kultur);
  if (neu) wesen.kulturen = [...(wesen.kulturen || []), kultur];
  ausDemInventarNehmen(wesen, gegenstand.id);
  entitaetEntfernen(spiel.zustand, gegenstand.id);
  melden(spiel, neu ? "kultur_gewonnen" : "kultur_bekannt", { wer: bezugAuf(wesen), kultur: { name: kultur, text: spiel.daten.kulturen[kultur].text } });
  if (neu) kulturGebucht(spiel, wesen, kultur);
});
