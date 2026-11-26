// Trockenbier (siehe docs/Sude.md, Trockenbier; Spieldesign in docs/Brauen.md, Trockenbier und Sud im Kampf): die
// Würze eines Suds ohne Gärung, leicht und ohne Gefäß, angerührt mit einem leeren Gefäß und einer Kultur, ohne Kessel.
// Abfüllen: der Befehl brauen mit abfuellen: "trocken" und ohne Kultur (systeme/brauen.js) würfelt die Würze am Kessel
//   wie einen Sud (ohne Alkohol) und füllt je Portion ein Stück regeln.brauen.trockenbier.gegenstand ab, ohne Gefäß:
//   trockenbier: { wuerze, maische, kessel?, rezept? }; wuerze ist das gerundete Profil, maische die Maische (sie zählt
//   beim Vergären), kessel die Punkte des Kessels auf das Verderben, rezept ein gefundenes Rezept, dem nur die Kultur
//   fehlt. Meldung abgefuellt_trocken mit wer, was, anzahl. Hausrezepte und EP gibt es nur für Sude am Kessel.
//   Nach regeln.brauen.trockenbier.haltbarkeit wird es einmal muffig (trockenbier.muffig, Adjektiv muffig), Meldung
//   verdorben; angerührt gibt muffiges Trockenbier einen verdorbenen Sud.
// Befehl: { art: "anruehren", gegenstandId, kultur } verbraucht ein Stück und ein leeres Gefäß; die Kultur vergärt die
//   Würze ohne Wurf (systeme/sud.js wuerzeVergaeren), dann folgt der Wurf "verderben" wie am Kessel, ohne Verderber
//   (systeme/brauen.js ergebnisAusPunkt); ein Treffer deckt das Zielgebiet auf; der Kniff des Rezepts wirkt mit dessen
//   Kultur und Zielgebiet. Das Getränk reift und verdirbt wie jeder Sud (systeme/reifen.js).
//   kultur: eine Kultur der Anrührerin (wesen.kulturen) oder "spontan" (die Flora der Ebene)
//   Ablehnungen: kein_trockenbier, kultur_unbekannt, keine_flora, keine_gefaesse, im_kampf_anruehren, ungueltig
//   Meldungen: angeruehrt, angeruehrt_getroffen (mit zielgebiet), angeruehrt_verdorben, je mit wer, was
// Zeit (anruehrenZeit): außerhalb des Kampfes aktionen.anruehren; im Kampf erst ab dem Schnellsud anruehren.imKampfAb,
//   dann so viele Prozent davon, wie anruehren.imKampf beim höchsten Eintrag bis zum Schnellsud nennt; Hitze daneben
//   (ein brennendes Feld oder Gelände mit hitze auf dem eigenen Feld oder einem der acht Nachbarn) mal hitzeProzent.
// Schnellsud (schnellsudVon): Kampfwert schnellsud (Vorgabe 0, Modifikator schnellsud) plus schnellsud der Kultur
//   (Kveik zählt einen Tier höher, auch über den eigenen hinaus).

import { anmelden } from "../kern/register.js";
import { entitaetMitId, ausDatenErzeugen, ausDemInventarNehmen, grundkostenVon } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { modifiziert } from "../kern/werte.js";
import { gelaendeAuf } from "../welt/karte.js";
import { schichtAuf } from "../welt/schichten.js";
import { imKampf } from "./kampfzustand.js";
import { insInventar, verderbenEinplanen, anzahlVon } from "./inventar.js";
import { brauregeln, kulturdatenVon, SPONTAN, profilRunden, wuerzeVergaeren } from "./sud.js";
import { gefaesseIm, mengeVerbrauchen, portionenAbfuellen, ergebnisAusPunkt } from "./brauen.js";
import { zielgebietAufdecken } from "./rezepte.js";
import { stufenBeginnen } from "./reifen.js";

export const trockenregeln = (daten) => brauregeln(daten).trockenbier;

// Felder um ein Wesen, das eigene zuerst
const UMGEBUNG = [[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Hitze auf dem eigenen Feld oder daneben: ein brennendes Feld oder Gelände mit hitze
export function hitzeNahe(spiel, wesen) {
  if (!wesen?.position) return false;
  return UMGEBUNG.some(([dx, dy]) => {
    const x = wesen.position.x + dx, y = wesen.position.y + dy;
    return Boolean(gelaendeAuf(spiel, x, y)?.hitze) || Boolean(schichtAuf(spiel, "feuer", x, y));
  });
}

// Schnellsud eines Wesens mit einer Kultur (Daten der Kultur oder Flora, wahlweise)
export function schnellsudVon(spiel, wesen, kulturdaten = null) {
  return Math.max(0, modifiziert(spiel, wesen, "schnellsud", wesen.kampfwerte?.schnellsud ?? 0)) + (kulturdaten?.schnellsud ?? 0);
}

// Grundkosten des Anrührens in Zeiteinheiten, oder null, wenn es im Kampf (noch) nicht geht
export function anruehrenZeit(spiel, wesen, kulturdaten) {
  const { imKampfAb, imKampf: jeTier, hitzeProzent } = trockenregeln(spiel.daten).anruehren;
  const grund = grundkostenVon(spiel, wesen, "anruehren");
  let prozent = 100;
  if (imKampf(spiel, wesen)) {
    const schnellsud = schnellsudVon(spiel, wesen, kulturdaten);
    if (schnellsud < imKampfAb) return null;
    const tier = Math.max(...Object.keys(jeTier).map(Number).filter((stufe) => stufe <= schnellsud));
    prozent = jeTier[tier];
  }
  if (hitzeNahe(spiel, wesen)) prozent = Math.floor((prozent * hitzeProzent) / 100);
  return Math.max(1, Math.floor((grund * prozent) / 100));
}

// Trockenbier im Gepäck in seiner Reihenfolge
export const trockenbierIm = (spiel, wesen) => (wesen.inventar || []).map((id) => entitaetMitId(spiel.zustand, id)).filter((gegenstand) => gegenstand?.trockenbier);

// Prüft das Anrühren: { grund } oder { trockenbier, kultur, kulturdaten, flora, zeit }
export function anruehrenVorbereiten(spiel, wesen, befehl) {
  const trockenbier = (wesen.inventar || []).includes(befehl.gegenstandId) ? entitaetMitId(spiel.zustand, befehl.gegenstandId) : null;
  if (!trockenbier?.trockenbier) return { grund: "kein_trockenbier" };
  const kultur = befehl.kultur ?? null;
  if (typeof kultur !== "string") return { grund: "ungueltig" };
  const flora = spiel.zustand.ebene?.flora ?? null;
  if (kultur === SPONTAN && !flora) return { grund: "keine_flora" };
  if (kultur !== SPONTAN && !(wesen.kulturen || []).includes(kultur)) return { grund: "kultur_unbekannt" };
  if (!gefaesseIm(spiel, wesen).length) return { grund: "keine_gefaesse" };
  const kulturdaten = kulturdatenVon(spiel.daten, kultur, flora);
  const zeit = anruehrenZeit(spiel, wesen, kulturdaten);
  if (zeit === null) return { grund: "im_kampf_anruehren" };
  return { trockenbier, kultur, kulturdaten, flora, zeit };
}

// Chance in Prozent, dass ein angerührtes Trockenbier verdirbt: Regelwert plus Kessel des Abfüllens plus Kultur, mit
// Modifikatoren auf brauen.verderben
export function verderbenBeimAnruehren(spiel, wesen, trockenbier, kulturdaten) {
  const grund = brauregeln(spiel.daten).verderben + (trockenbier.trockenbier.kessel ?? 0) + (kulturdaten?.verderben ?? 0);
  return Math.max(0, Math.min(100, modifiziert(spiel, wesen, "brauen.verderben", grund)));
}

anmelden("befehle", "anruehren", {
  pruefen(spiel, akteur, befehl) {
    return anruehrenVorbereiten(spiel, akteur, befehl).grund ?? null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const { trockenbier, kultur, kulturdaten, flora, zeit } = anruehrenVorbereiten(spiel, akteur, befehl);
    const daten = spiel.daten, regeln = brauregeln(daten);
    const { wuerze, maische, rezept, muffig } = trockenbier.trockenbier;
    const vertraegt = modifiziert(spiel, akteur, "brauen.vertraegt", kulturdaten.vertraegt);
    const { profil: punkt } = wuerzeVergaeren(daten, wuerze, { maische, kultur, vertraegt, flora });
    const verderben = verderbenBeimAnruehren(spiel, akteur, trockenbier, kulturdaten);
    const sauer = Math.max(0, Math.min(100 - verderben, regeln.schwach.chance));
    // der Kniff des Rezepts nur mit dessen Kultur
    const nachRezept = rezept && spiel.zustand.rezepte?.[rezept]?.kultur === kultur ? rezept : null;
    const ergebnis = ergebnisAusPunkt(spiel, punkt, { verderben, sauer, rezept: nachRezept, verdorben: Boolean(muffig) });
    mengeVerbrauchen(spiel, akteur, trockenbier, 1);
    const portion = portionenAbfuellen(spiel, akteur, 1, ergebnis.typ, (getraenk) => {
      getraenk.sud = structuredClone(ergebnis.sud);
      if (ergebnis.text) getraenk.text = ergebnis.text;
      stufenBeginnen(spiel, akteur, getraenk, ergebnis.verdorben);
    });
    const art = ergebnis.verdorben ? "angeruehrt_verdorben" : ergebnis.sud.zielgebiet ? "angeruehrt_getroffen" : "angeruehrt";
    melden(spiel, art, { wer: bezugAuf(akteur), was: bezugAuf(portion), zielgebiet: ergebnis.sud.zielgebiet });
    if (art === "angeruehrt_getroffen") zielgebietAufdecken(spiel, akteur, ergebnis.sud.zielgebiet, "getroffen");
    return { aktion: "anruehren", grundkosten: zeit };
  },
});

// Füllt die Würze eines Suds als Trockenbier ab (aus dem Befehl brauen, systeme/brauen.js); punkt ist der Wurf am Kessel
export function trockenbierAbfuellen(spiel, akteur, vorbereitet, punkt) {
  const daten = spiel.daten, regeln = trockenregeln(daten);
  const wuerze = profilRunden(daten, { ...punkt, alkohol: 0 });
  let stueck = null;
  for (let i = 0; i < vorbereitet.portionen; i++) {
    const neu = ausDatenErzeugen(spiel, "gegenstaende", regeln.gegenstand, null);
    neu.trockenbier = {
      wuerze: { ...wuerze }, maische: vorbereitet.eingabe.verfahren.maische,
      ...(vorbereitet.kessel.kessel.verderben && { kessel: vorbereitet.kessel.kessel.verderben }),
      ...(vorbereitet.rezept && { rezept: vorbereitet.rezept }),
    };
    neu.verdirbt = { nach: regeln.haltbarkeit };
    neu.verdirbtUm = spiel.zustand.zeit + regeln.haltbarkeit;
    verderbenEinplanen(spiel.zustand, neu);
    stueck = insInventar(spiel, akteur, neu);
  }
  melden(spiel, "abgefuellt_trocken", { wer: bezugAuf(akteur), was: { ...bezugAuf(stueck), anzahl: vorbereitet.portionen }, anzahl: vorbereitet.portionen });
}

// Register "verderben" (systeme/verschleiss.js): Trockenbier wird einmal muffig, dann verdirbt es nicht weiter
anmelden("verderben", "trockenbier", (spiel, gegenstand) => {
  if (!gegenstand.trockenbier) return false;
  const vorher = bezugAuf(gegenstand), anzahl = anzahlVon(gegenstand);
  gegenstand.trockenbier.muffig = true;
  gegenstand.adjektive = [trockenregeln(spiel.daten).muffig];
  delete gegenstand.verdirbt;
  delete gegenstand.verdirbtUm;
  // im Gepäck neu einsortieren: ein gleicher muffiger Stapel nimmt ihn auf
  const traegerin = gegenstand.getragenVon !== undefined ? entitaetMitId(spiel.zustand, gegenstand.getragenVon) : null;
  let jetzt = gegenstand;
  if (traegerin) {
    ausDemInventarNehmen(traegerin, gegenstand.id);
    delete gegenstand.getragenVon;
    jetzt = insInventar(spiel, traegerin, gegenstand);
  }
  melden(spiel, "verdorben", { was: vorher, wird: bezugAuf(jetzt), traegerin: traegerin ? bezugAuf(traegerin) : null, anzahl });
  return true;
});
