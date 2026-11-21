// Schnellleiste (siehe docs/Oberflaeche.md, Schnellleiste): Kern ohne DOM, damit er testbar ist.
// Stand 0.28.0, Grundform: zehn Plätze auf den Tasten 1 bis 0, automatisch belegt und bei jedem Zeichnen neu
// berechnet, nicht umbelegbar und nicht gespeichert. Erst die Fähigkeiten Ninkasis in der Reihenfolge, in der sie
// sie gelernt hat, dann jede Art von Getränk im Gepäck (nach der ersten Stelle im Gepäck). Wurfwaffen, Umbelegen,
// mehrere Leisten und die Ablage im Spielstand folgen mit 0.29.0.
// Platz: null oder { art: "faehigkeit", faehigkeit } | { art: "getraenk", typ }
// Zustand eines Platzes für die Anzeige: { platz, anzahl?, abklingend?, grund? }

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { anzahlVon } from "../systeme/inventar.js";
import { faehigkeitPruefen, zuegeBisBereit } from "../systeme/faehigkeiten.js";
import { PLAETZE_DER_LEISTE } from "./aktionskatalog.js";

// Gründe, die nur am Ziel liegen; sie machen einen Platz nicht grau (der Zielmodus wählt erst das Ziel)
const GRUENDE_DES_ZIELS = ["ungueltig", "kein_ziel", "nicht_sichtbar", "zu_weit", "keine_sichtlinie"];

function gepaeck(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  return (ninkasi.inventar || []).map((id) => entitaetMitId(spiel.zustand, id)).filter(Boolean);
}

// Die automatische Belegung: Liste mit PLAETZE_DER_LEISTE Einträgen, freie Plätze sind null
export function plaetzeDerLeiste(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  const belegt = (ninkasi.faehigkeiten || []).map((faehigkeit) => ({ art: "faehigkeit", faehigkeit }));
  const getraenkearten = [];
  for (const gegenstand of gepaeck(spiel)) {
    if (gegenstand.trinkbar && !getraenkearten.includes(gegenstand.typ)) getraenkearten.push(gegenstand.typ);
  }
  belegt.push(...getraenkearten.map((typ) => ({ art: "getraenk", typ })));
  return Array.from({ length: PLAETZE_DER_LEISTE }, (_, stelle) => belegt[stelle] ?? null);
}

// Erstes Stück einer Art im Gepäck oder null
export function erstesStueck(spiel, typ) {
  return gepaeck(spiel).find((gegenstand) => gegenstand.typ === typ) ?? null;
}

// Zustand eines Platzes für die Anzeige: Anzahl bei Gegenständen, Abklingzeit in Zügen, Grund, wenn er nicht geht
export function platzZustand(spiel, platz) {
  if (!platz) return null;
  const ninkasi = spielerin(spiel.zustand);
  if (platz.art === "getraenk") {
    const anzahl = gepaeck(spiel).filter((gegenstand) => gegenstand.typ === platz.typ).reduce((summe, gegenstand) => summe + anzahlVon(gegenstand), 0);
    return { platz, anzahl, ...(anzahl === 0 && { grund: "nichts_zu_trinken" }) };
  }
  const abklingend = zuegeBisBereit(ninkasi, platz.faehigkeit);
  const grund = faehigkeitPruefen(spiel, ninkasi, platz.faehigkeit, undefined);
  return { platz, abklingend, ...(grund && !GRUENDE_DES_ZIELS.includes(grund) && { grund }) };
}

// Was die Taste eines Platzes tut: { befehl } (Getränk), { auswahl } (Fähigkeit, weiter über den Zielmodus),
// { grund } (geht nicht) oder null (leerer Platz)
export function platzAusloesen(spiel, stelle) {
  const platz = plaetzeDerLeiste(spiel)[stelle];
  if (!platz) return null;
  if (platz.art === "getraenk") {
    const stueck = erstesStueck(spiel, platz.typ);
    return stueck ? { befehl: { art: "trinken", gegenstandId: stueck.id } } : { grund: "nichts_zu_trinken" };
  }
  return { auswahl: { zweck: "faehigkeit", faehigkeit: platz.faehigkeit } };
}
