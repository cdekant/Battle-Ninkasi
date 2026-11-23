// Arena-Simulation (siehe docs/Entwicklung.md, Bot und Werkzeuge): Ninkasi kämpft nach einer Taktik
// (src/ki/taktik.js) tausendfach in der Spielart "arena" (src/systeme/arena.js); Ausgabe als Tabelle, auf Wunsch
// alle Einzelkämpfe als JSON für die Auswertung mit Python.
// Aufruf: node werkzeuge/arena.js <Arena | Kurzform> [Kämpfe=1000] [erster Startwert=1]
//           [--taktik name] [--karte name] [--ninkasi variante] [--gegner variante] [--json datei]
//   Arena: Name aus datenproben/arenen.js; hat sie Varianten, läuft jede Kombination (eine Zeile je Paar), --ninkasi und
//   --gegner beschränken auf eine. Kurzform wie in DCSS: "3 essigbakterium, fernkaempfer_test" ist eine Welle,
//   "/" trennt Wellen ("3 essigbakterium / 2 fernkaempfer_test"), Karte arena_offen, Taktik nahkampf.
// Jeder Kampf folgt aus seinem Startwert und lässt sich mit demselben Aufruf wiederholen; Patt nach
// regeln.arena.grenzeBefehle Befehlen. Lehnt die Logik einen Befehl der Taktik ab, wartet Ninkasi (gezählt).

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import VERSION from "../src/version.js";
import { datenLaden, neuesSpiel, befehlGeben } from "../src/kern/spiel.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { spielerin } from "../src/kern/zustand.js";
import { aufstellungAus } from "../src/systeme/arena.js";
import { taktikbefehl } from "../src/ki/taktik.js";

// Kurzform "3 essigbakterium, fernkaempfer_test / 2 x" als Aufstellung, oder null, wenn kein Wesen darin vorkommt
export function kurzformLesen(daten, text) {
  const wellen = text.split("/").map((welle) => welle.split(",").map((teil) => teil.trim()).filter(Boolean).map((teil) => {
    const [, anzahl, typ] = teil.match(/^(?:(\d+)\s+)?(\S+)$/) ?? [];
    return typ ? { typ, anzahl: anzahl ? Number(anzahl) : 1 } : { typ: teil, anzahl: 1 };
  }));
  if (!wellen.flat().some((eintrag) => daten.wesen[eintrag.typ])) return null;
  return { name: text, karte: "arena_offen", taktik: "nahkampf", wellen };
}

// Ein Kampf: { startwert, ausgang: "sieg" | "tod" | "patt", wellen, befehle, abgelehnt, zeit, zuege, lpVerlust,
// schadenErlitten, schadenAusgeteilt, geheilt, mpVerbrauch, getraenke, wuerfe, faehigkeiten, treffer, fehlschlaege }
export function kampfAusfuehren(daten, aufstellung, startwert, taktikName = aufstellung.taktik ?? "nahkampf") {
  const taktik = daten.taktiken[taktikName];
  if (!taktik) throw new Error(`Taktik "${taktikName}" gibt es nicht`);
  const spiel = neuesSpiel(daten, startwert, { spielart: "arena", arena: aufstellung });
  const ninkasi = spielerin(spiel.zustand);
  const lpVorher = ninkasi.werte.lp.aktuell, mpVorher = ninkasi.werte.mp?.aktuell ?? 0;
  const zaehler = { schadenErlitten: 0, schadenAusgeteilt: 0, geheilt: 0, getraenke: 0, wuerfe: 0, faehigkeiten: 0, treffer: 0, fehlschlaege: 0 };
  const vonNinkasi = (bezug) => bezug?.id === ninkasi.id;
  hoererAnmelden(spiel, (meldung) => {
    if (meldung.art === "schaden" && vonNinkasi(meldung.ziel)) zaehler.schadenErlitten += meldung.menge;
    if (meldung.art === "schaden" && vonNinkasi(meldung.quelle)) { zaehler.schadenAusgeteilt += meldung.menge; zaehler.treffer++; }
    if (meldung.art === "verfehlt" && vonNinkasi(meldung.quelle)) zaehler.fehlschlaege++;
    if (meldung.art === "geheilt" && vonNinkasi(meldung.ziel) && meldung.wertName === "lp") zaehler.geheilt += meldung.menge;
    if (meldung.art === "getrunken" && vonNinkasi(meldung.wer)) zaehler.getraenke++;
    if (meldung.art === "geworfen" && vonNinkasi(meldung.wer)) zaehler.wuerfe++;
    if (meldung.art === "faehigkeit" && vonNinkasi(meldung.wer)) zaehler.faehigkeiten++;
  });
  const grenze = daten.regeln.arena.grenzeBefehle;
  let abgelehnt = 0;
  while (!spiel.zustand.vorbei && spiel.befehle.length < grenze) {
    if (!befehlGeben(spiel, taktikbefehl(spiel, taktik)).ok) {
      abgelehnt++;
      befehlGeben(spiel, { art: "warten" });
    }
  }
  const { zustand } = spiel;
  const ausgang = !zustand.vorbei ? "patt" : zustand.ergebnis === "sieg" ? "sieg" : "tod";
  return {
    startwert, ausgang, wellen: ausgang === "sieg" ? zustand.arena.wellen.length : zustand.arena.welle, befehle: spiel.befehle.length, abgelehnt,
    zeit: zustand.zeit, zuege: ninkasi.zuege ?? 0, lpVerlust: lpVorher - ninkasi.werte.lp.aktuell,
    mpVerbrauch: mpVorher - (ninkasi.werte.mp?.aktuell ?? 0), ...zaehler,
  };
}

// Wilson-Intervall (95 %) einer Quote erfolge / anzahl, als Anteile von 0 bis 1
export function wilson(erfolge, anzahl, z = 1.96) {
  if (!anzahl) return { unten: 0, oben: 0 };
  const quote = erfolge / anzahl, z2 = z * z;
  const mitte = (quote + z2 / (2 * anzahl)) / (1 + z2 / anzahl);
  const breite = (z * Math.sqrt((quote * (1 - quote)) / anzahl + z2 / (4 * anzahl * anzahl))) / (1 + z2 / anzahl);
  return { unten: Math.max(0, mitte - breite), oben: Math.min(1, mitte + breite) };
}

// Wert an einem Anteil (0 bis 1) der sortierten Werte, nächster Rang
export function quantil(werte, anteil) {
  if (!werte.length) return null;
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.min(sortiert.length - 1, Math.max(0, Math.ceil(anteil * sortiert.length) - 1))];
}

const mittel = (werte) => (werte.length ? werte.reduce((summe, wert) => summe + wert, 0) / werte.length : null);
const verteilung = (werte) => ({ median: quantil(werte, 0.5), p10: quantil(werte, 0.1), p90: quantil(werte, 0.9) });

// Auswertung einer Reihe von Kämpfen: Quoten, Wilson-Intervall, Verteilungen über die Siege, Mittel über alle
export function auswerten(kaempfe) {
  const siege = kaempfe.filter((kampf) => kampf.ausgang === "sieg");
  const anzahl = (ausgang) => kaempfe.filter((kampf) => kampf.ausgang === ausgang).length;
  return {
    kaempfe: kaempfe.length, siege: siege.length, tode: anzahl("tod"), patt: anzahl("patt"),
    siegquote: kaempfe.length ? siege.length / kaempfe.length : 0, intervall: wilson(siege.length, kaempfe.length),
    zeit: verteilung(siege.map((kampf) => kampf.zeit)), lpVerlust: verteilung(siege.map((kampf) => kampf.lpVerlust)),
    getraenke: mittel(kaempfe.map((kampf) => kampf.getraenke)), wuerfe: mittel(kaempfe.map((kampf) => kampf.wuerfe)),
    faehigkeiten: mittel(kaempfe.map((kampf) => kampf.faehigkeiten)), abgelehnt: mittel(kaempfe.map((kampf) => kampf.abgelehnt)),
    trefferquote: (() => { const treffer = kaempfe.reduce((summe, kampf) => summe + kampf.treffer, 0), alle = treffer + kaempfe.reduce((summe, kampf) => summe + kampf.fehlschlaege, 0); return alle ? treffer / alle : null; })(),
  };
}

// Alle Paare aus Varianten Ninkasis und der Gegner einer Arena, beschränkt durch die Wahl auf der Kommandozeile
export function variantenpaare(daten, name, { ninkasi = null, gegner = null } = {}) {
  const varianten = daten.arenen[name]?.varianten ?? {};
  const ninkasiListe = ninkasi ? [ninkasi] : Object.keys(varianten.ninkasi ?? {});
  const gegnerListe = gegner ? [gegner] : Object.keys(varianten.gegner ?? {});
  const paare = [];
  for (const ninkasiVariante of ninkasiListe.length ? ninkasiListe : [null]) {
    for (const gegnerVariante of gegnerListe.length ? gegnerListe : [null]) paare.push({ ninkasi: ninkasiVariante, gegner: gegnerVariante });
  }
  return paare;
}

const prozent = (anteil) => (anteil === null ? "-" : `${Math.round(anteil * 100)} %`);
const zahl = (wert) => (wert === null ? "-" : Number.isInteger(wert) ? String(wert) : wert.toFixed(1).replace(".", ","));
const dreier = ({ median, p10, p90 }) => (median === null ? "-" : `${median}/${p10}/${p90}`);

function tabelleAusgeben(zeilen) {
  const kopf = ["Ninkasi", "Gegner", "Sieg", "95 %", "Tod", "Patt", "Zeit Med/P10/P90", "LP-Verlust", "Getränke", "Würfe", "Fähigk.", "Treffer", "abgel."];
  const tabelle = zeilen.map(({ ninkasi, gegner, auswertung: a }) => [
    ninkasi ?? "-", gegner ?? "-", prozent(a.siegquote), `${Math.round(a.intervall.unten * 100)}-${Math.round(a.intervall.oben * 100)} %`,
    String(a.tode), String(a.patt), dreier(a.zeit), dreier(a.lpVerlust), zahl(a.getraenke), zahl(a.wuerfe), zahl(a.faehigkeiten), prozent(a.trefferquote), zahl(a.abgelehnt),
  ]);
  const breiten = kopf.map((spalte, stelle) => Math.max(spalte.length, ...tabelle.map((zeile) => zeile[stelle].length)));
  const zeileText = (zeile) => zeile.map((feld, stelle) => feld.padEnd(breiten[stelle])).join("  ").trimEnd();
  console.log(zeileText(kopf));
  for (const zeile of tabelle) console.log(zeileText(zeile));
}

function argumenteLesen(argumente) {
  const benannt = {}, frei = [];
  for (let stelle = 0; stelle < argumente.length; stelle++) {
    if (argumente[stelle].startsWith("--")) benannt[argumente[stelle].slice(2)] = argumente[++stelle];
    else frei.push(argumente[stelle]);
  }
  return { benannt, frei };
}

function hauptprogramm() {
  const { benannt, frei } = argumenteLesen(process.argv.slice(2));
  const [ziel, anzahlText = "1000", startText = "1"] = frei;
  const daten = datenLaden(rohdaten, { texte });
  if (!ziel) {
    console.log(`Arenen: ${Object.keys(daten.arenen).join(", ")}\nTaktiken: ${Object.keys(daten.taktiken).join(", ")}`);
    return;
  }
  const anzahl = Number(anzahlText), ersterStartwert = Number(startText);
  const kurzform = daten.arenen[ziel] ? null : kurzformLesen(daten, ziel);
  if (!daten.arenen[ziel] && !kurzform) throw new Error(`"${ziel}" ist weder eine Arena noch eine Kurzform mit bekannten Wesen`);
  const paare = kurzform ? [{ ninkasi: null, gegner: null }] : variantenpaare(daten, ziel, { ninkasi: benannt.ninkasi, gegner: benannt.gegner });
  const zeilen = [], alleKaempfe = [];
  for (const paar of paare) {
    const aufstellung = kurzform ? { ...kurzform } : aufstellungAus(daten, ziel, paar);
    if (benannt.karte) aufstellung.karte = benannt.karte;
    const taktik = benannt.taktik ?? aufstellung.taktik ?? "nahkampf";
    const kaempfe = [];
    for (let startwert = ersterStartwert; startwert < ersterStartwert + anzahl; startwert++) kaempfe.push(kampfAusfuehren(daten, aufstellung, startwert, taktik));
    zeilen.push({ ...paar, taktik, karte: aufstellung.karte, auswertung: auswerten(kaempfe) });
    alleKaempfe.push(...kaempfe.map((kampf) => ({ ...paar, ...kampf })));
  }
  console.log(`${kurzform ? `"${ziel}"` : ziel}, Karte ${zeilen[0].karte}, Taktik ${zeilen[0].taktik}, ${anzahl} Kämpfe ab Startwert ${ersterStartwert} (Version ${VERSION})`);
  tabelleAusgeben(zeilen);
  console.log("Zeit in Zeiteinheiten (100 je Aktion), Zeit und LP-Verlust über die Siege, Getränke, Würfe, Fähigkeiten und Ablehnungen im Mittel je Kampf");
  if (benannt.json) {
    writeFileSync(benannt.json, JSON.stringify({ version: VERSION, ziel, anzahl, ersterStartwert, zeilen, kaempfe: alleKaempfe }, null, 1));
    console.log(`Einzelkämpfe in ${benannt.json}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) hauptprogramm();
