// Lücken in den Inhalten (siehe docs/Entwicklung.md, Kompendium): was ein Eintrag noch braucht, damit er im Spiel
// vollständig ist. Reine Funktion ohne DOM und ohne Dateizugriff; das Kompendium im Browser (werkzeuge/kompendium.html)
// und in Node (werkzeuge/kompendium.js) laden die Quellen selbst und geben sie hinein.
//
// Eine Lücke: { gruppe, stufe, ort, meldung }
//   gruppe: "daten" (Fehler der Datenprüfung), "tiles", "verweise", "texte", "korpus"
//   stufe:  "fehler" (das Spiel startet so nicht oder zeigt falsch, oder echter Inhalt ist unvollständig) oder
//           "warnung" (erlaubt: Probeinhalt darf unvollständig sein, siehe docs/Entwicklung.md, Probeinhalt)
// Tiles, Verweise und Texte sind Fehler für echten Inhalt, sobald die Quellen sagen, was Probeinhalt ist
// (probenamen, probentexte); ohne diese Angabe gilt alles als Probe (Tests mit eigenen Daten).

import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und KI-Module an, die die Datenprüfung kennen muss
import { vorbereiten } from "../src/kern/daten.js";
import { quellenangabeAusKopf, quellenangabeFehler } from "../src/anzeige/quellenangabe.js";

// Bereiche in daten/zeichen.js, die der Renderer als Tile zeichnen kann (Name des Tiles = Name des Eintrags)
export const TILEBEREICHE = ["gelaende", "wesen", "gegenstaende", "fallen", "schichten"];

// Sammlungen in den Rohdaten, deren Einträge jemand verwenden sollte; ein Verweis ist der Name als Text irgendwo
// in den übrigen Daten, als Wert oder als Schlüssel (so stehen z.B. Schadensarten in widerstaende)
export const VERWEISBEREICHE = {
  wesen: ["wesen"],
  gegenstaende: ["gegenstaende"],
  effekte: ["effekte"],
  zustaende: ["zustaende"],
  faehigkeiten: ["faehigkeiten"],
  fallen: ["fallen"],
  oberflaechen: ["schichten", "oberflaechen"],
  gase: ["schichten", "gase"],
};

// Einträge, die der Code selbst verwendet und die deshalb in den Daten niemand nennen muss
export const VOM_CODE_VERWENDET = { wesen: ["ninkasi"] };

// Tiles des Grundgerüsts, die noch gezeichnet werden (docs/Systemausbau.md, Punkt 11); bis dahin nur eine Warnung
export const TILES_AUSSTEHEND = ["gelaende.tuer_zu", "gelaende.tuer_offen", "gelaende.treppe_ab", "gelaende.treppe_auf", "schichten.feuer", "gegenstaende.sud", "gegenstaende.sud_verdorben", "gegenstaende.essig", "gegenstaende.bruehe", "gegenstaende.trockenbier", "gelaende.braukessel"];

// Sammlung der Namen in probenamen (src/inhalt.js) je Bereich der Tiles und Verweise
const PROBENSAMMLUNG = { oberflaechen: "schichten.oberflaechen", gase: "schichten.gase" };

// quellen: { rohdaten, sprache: { texte, nomenPruefen? }, tileset?, korpus?: [{ name, kopf }], literatur?: [{ id }],
//            probenamen?: { <sammlung>: [name] }, probentexte?: [schluessel], uebersetzungen?: { <sprache>: texte } }
// uebersetzungen: weitere Sprachen; jeder Schlüssel der deutschen Texte, der dort fehlt, ist eine Lücke der Gruppe texte
export function lueckenFinden(quellen) {
  const luecken = [];
  const melden = (gruppe, stufe, ort, meldung) => luecken.push({ gruppe, stufe, ort, meldung });
  const streng = Boolean(quellen.probenamen);
  // Stufe einer Lücke an einem Eintrag: Probe oder ausstehend heißt Warnung, echter Inhalt Fehler
  const stufeAm = (sammlung, name, ausstehend = false) =>
    !streng || ausstehend || (quellen.probenamen[sammlung] ?? []).includes(name) ? "warnung" : "fehler";

  const { fehler } = vorbereiten(quellen.rohdaten, quellen.sprache);
  for (const meldung of fehler) {
    const [ort, ...rest] = meldung.split(": ");
    melden("daten", "fehler", rest.length ? ort : "daten", rest.length ? rest.join(": ") : meldung);
  }

  if (quellen.tileset) tileLuecken(quellen.rohdaten, quellen.tileset, melden, stufeAm);
  verweisLuecken(quellen.rohdaten, melden, stufeAm);
  if (quellen.sprache?.texte) {
    const probentexte = new Set(quellen.probentexte ?? []);
    const stufeFuer = (schluessel) => (!streng || probentexte.has(schluessel) ? "warnung" : "fehler");
    textLuecken(quellen.rohdaten, quellen.sprache.texte, melden, stufeFuer);
    for (const [code, texte] of Object.entries(quellen.uebersetzungen ?? {})) {
      for (const schluessel of Object.keys(quellen.sprache.texte)) {
        if (!(schluessel in texte)) melden("texte", stufeFuer(schluessel), schluessel, `fehlt in ${code}`);
      }
    }
  }
  if (quellen.korpus) korpusLuecken(quellen.korpus, quellen.literatur ?? [], quellen.sprache?.texte ?? null, melden);
  if (quellen.literatur) glossarQuellenLuecken(quellen.rohdaten.glossar ?? {}, quellen.literatur, melden);
  return luecken;
}

// Tiles fehlen je Satz; ein Eintrag ohne jedes Tile wird einmal gemeldet, nicht viermal
function tileLuecken(rohdaten, tileset, melden, stufeAm) {
  const satzGroessen = Object.keys(tileset.saetze).map(Number).sort((a, b) => b - a);
  for (const bereich of TILEBEREICHE) {
    for (const [name, eintrag] of Object.entries(rohdaten.zeichen[bereich] ?? {})) {
      if (bereich === "schichten" && !eintrag.zeichen) continue; // Überlagerung ohne eigenes Bild
      const fehlend = satzGroessen.filter((groesse) => !tileset.saetze[groesse][name]);
      const stufe = stufeAm(`zeichen.${bereich}`, name, TILES_AUSSTEHEND.includes(`${bereich}.${name}`));
      if (fehlend.length === satzGroessen.length) melden("tiles", stufe, `${bereich}.${name}`, "kein Tile, nur Zeichen");
      else if (fehlend.length) melden("tiles", stufe, `${bereich}.${name}`, `Tile fehlt in Satz ${fehlend.join(", ")}`);
    }
  }
  for (const [groesse, satz] of Object.entries(tileset.saetze)) {
    for (const name of Object.keys(satz)) {
      if (!TILEBEREICHE.some((bereich) => rohdaten.zeichen[bereich]?.[name])) melden("tiles", "warnung", `tile.${name}`, `Tile in Satz ${groesse} gehört zu keinem Eintrag`);
    }
  }
}

// Alle Texte in einem Datenbaum, als Werte und als Schlüssel; ueberspringen(pfad) lässt einen Teilbaum aus,
// schluesselZaehlt(pfad) entscheidet, ob die Schlüssel des Objekts unter pfad mitzählen
function texteSammeln(wert, pfad, ueberspringen, schluesselZaehlt, ablage) {
  if (ueberspringen(pfad)) return ablage;
  if (typeof wert === "string") ablage.add(wert);
  else if (Array.isArray(wert)) wert.forEach((teil, nummer) => texteSammeln(teil, [...pfad, nummer], ueberspringen, schluesselZaehlt, ablage));
  else if (wert && typeof wert === "object") {
    const mitSchluesseln = schluesselZaehlt(pfad);
    for (const [schluessel, teil] of Object.entries(wert)) {
      if (mitSchluesseln) ablage.add(schluessel);
      texteSammeln(teil, [...pfad, schluessel], ueberspringen, schluesselZaehlt, ablage);
    }
  }
  return ablage;
}

const beginntMit = (pfad, anfang) => anfang.every((teil, nummer) => pfad[nummer] === teil);
const gleich = (pfad, anderer) => pfad.length === anderer.length && beginntMit(pfad, anderer);

// Ein Eintrag ohne Verweis aus den übrigen Daten kommt im Spiel nie vor; sein eigener Eintrag, die Namen seiner
// Sammlung und die Zeichen zählen nicht
function verweisLuecken(rohdaten, melden, stufeAm) {
  for (const [bereich, sammlungspfad] of Object.entries(VERWEISBEREICHE)) {
    const sammlung = sammlungspfad.reduce((teil, schluessel) => teil?.[schluessel], rohdaten) ?? {};
    for (const [name, eintrag] of Object.entries(sammlung)) {
      if (eintrag?.abstrakt || VOM_CODE_VERWENDET[bereich]?.includes(name)) continue;
      const eigener = [...sammlungspfad, name];
      const genannt = texteSammeln(rohdaten, [], (pfad) => pfad[0] === "zeichen" || gleich(pfad, eigener), (pfad) => !gleich(pfad, sammlungspfad), new Set());
      if (!genannt.has(name)) melden("verweise", stufeAm(PROBENSAMMLUNG[bereich] ?? bereich, name), `${bereich}.${name}`, "nirgends verwendet");
    }
  }
}

// Textschlüssel mit dem Vorsatz eines Datenbereichs (wesen., gegenstand. usw.), die kein Eintrag nennt; die festen
// Adjektive eines genannten Hauptworts (adjektive, siehe docs/Texte.md, Grammatik) zählen als genannt, ebenso Zusätze
// eines genannten Schlüssels (glossar.malz.erklaerung zu glossar.malz)
function textLuecken(rohdaten, texte, melden, stufeFuer) {
  const genannt = texteSammeln(rohdaten, [], () => false, () => true, new Set());
  for (const schluessel of [...genannt]) for (const adjektiv of texte[schluessel]?.adjektive ?? []) genannt.add(adjektiv);
  const vorsaetze = new Set([...genannt].filter((text) => text in texte && text.includes(".")).map((text) => text.split(".")[0]));
  for (const schluessel of Object.keys(texte)) {
    const vorsatz = schluessel.split(".")[0];
    const zusatzVonGenanntem = schluessel.split(".").some((_, stelle, teile) => stelle > 1 && genannt.has(teile.slice(0, stelle).join(".")));
    if (vorsaetze.has(vorsatz) && !genannt.has(schluessel) && !zusatzVonGenanntem) melden("texte", stufeFuer(schluessel), schluessel, "Text ohne Eintrag in den Daten");
  }
}

// Korpustexte brauchen einen vollständigen Kopf und eine gültige Quellenangabe (siehe docs/Texte.md, Korpus und
// Quellenangabe); beteiligt ist freiwillig, ohne KI fehlt es
export const KORPUSKOPF = ["titel", "art", "vorlage", "nach", "quelle", "lizenz"];

// Quellen der Glossareinträge (siehe docs/Texte.md, Glossar) stehen im Literaturverzeichnis
function glossarQuellenLuecken(glossar, literatur, melden) {
  const schluessel = new Set(literatur.map((eintrag) => eintrag.id));
  for (const [name, eintrag] of Object.entries(glossar)) {
    for (const quelle of eintrag.quellen ?? []) {
      if (!schluessel.has(quelle)) melden("verweise", "fehler", `glossar.${name}`, `Quelle "${quelle}" fehlt in sprache/literatur.json`);
    }
  }
}

function korpusLuecken(korpus, literatur, texte, melden) {
  for (const { name, kopf } of korpus) {
    const ort = `korpus.${name}`;
    for (const feld of KORPUSKOPF) if (!kopf[feld]) melden("korpus", "fehler", ort, `Kopf ohne ${feld}`);
    if (!kopf.art) continue;
    for (const fehler of quellenangabeFehler(quellenangabeAusKopf(kopf), { literatur, texte })) melden("korpus", "fehler", ort, fehler);
  }
}
