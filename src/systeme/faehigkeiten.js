// Fähigkeiten (siehe docs/Wirkungen.md, Fähigkeiten): Magie, Psi, Fernkampf und körpereigene Aktionen als Daten.
// Daten (daten/faehigkeiten.js):
//   name: { text, art?, tags?, verbrauch?, material?, zeit?, abklingzeit?, voraussetzungen?, ziel?, wirkung?, zustand?, risiko?,
//           skill?, anforderung?, ausbau? }
//   art:             "aktiv" (Vorgabe) wirkt einmal; "aufrecht" setzt den Zustand an der Wirkenden, erneutes Benutzen beendet ihn
//   verbrauch:       { mp: 10, pp: 5, pegel: 20 } Vorräte; Modifikatoren auf verbrauch.<wert> und verbrauch.alle mit den Tags
//   material:        [{ typ, anzahl }] Gegenstände aus dem Inventar, werden verbraucht
//   zeit:            Grundkosten in Zeiteinheiten (Vorgabe aktionen.faehigkeit); Modifikatoren auf kosten.faehigkeit, kosten.alle
//   abklingzeit:     eigene Züge der Wirkenden, bis die Fähigkeit wieder bereit ist; Modifikatoren auf abklingzeit
//   voraussetzungen: [{ bedingung, ...parameter }] aus dem Register "modifikatorbedingungen", z.B. pegel_unter (nüchtern)
//   ziel:            Zielart wie in zielAufloesen (systeme/zielauswahl.js); bei "aktiv" Pflicht
//   wirkung:         benannter Effekt; mit muster im Ziel auf jede betroffene Entität, bei durchdringendem
//                    Geschoss auf jedes Wesen der Bahn, sonst einmal auf das Ziel (oder das Feld)
//   zustand:         bei "aufrecht" der Zustand, meist mit unterhalt (MP je Welttick, siehe systeme/zustaende.js)
//   risiko:          Name einer Risikotabelle (daten/risiken.js), gewürfelt vor der Wirkung über den Pegel
//   skill:           { name, stufe, risiko } der Skill, den die Fähigkeit verlangt; die Tabelle risiko wird über die
//                    fehlenden Stufen gewürfelt (Fundstück ohne passenden Skill, systeme/skills.js)
//   anforderung:     { eigenschaften: { koerperlichkeit: 15 }, risiko } weiche Anforderung; die Tabelle wird über die
//                    Summe der fehlenden Punkte (wirksame Werte) gewürfelt
//                    Reihenfolge der Würfe: skill, anforderung, risiko; der erste Ausgang mit wirkt: false beendet
//   ausbau:          [{ wenn, aendert }] Ausbau durch Skills: gilt wenn (Bedingungen an der Wirkenden, z.B. skill_ab),
//                    legt sich aendert flach über die Definition, in Datenreihenfolge (faehigkeitFuer)
//   dauer:           { schritte } lange Aktion (Ritual, Kanalisieren): bezahlt wird am Anfang, jeder Schritt kostet zeit,
//                    Risiko und Wirkung kommen nach dem letzten Schritt (siehe systeme/laufendeAktionen.js); das Ziel
//                    wird dann neu aufgelöst, passt es nicht mehr, verpufft die Wirkung (Meldung "verpufft")
//   beimAbbruch:     Effekt auf die Wirkende, wenn eine lange Aktion abgebrochen wird
//   ankuendigung:    Textschlüssel für den Beginn einer langen Aktion (angekündigter Angriff); die Meldung
//                    "aktion_beginnt" nennt dazu faehigkeit, ankuendigung und die Zielfelder (felder) beim Beginn
//   unterbrechbar:   Liste der Gründe, die die lange Aktion abbrechen: "schaden", "versetzt"; true heißt ["schaden"]
//                    (systeme/laufendeAktionen.js)
// Befehl: { art: "faehigkeit", faehigkeit, ziel?: { x, y } | { id } | { dx, dy } }
// Wesen kennen ihre Fähigkeiten als Liste: faehigkeiten: ["name"]; Abklingen über den Zugzähler zuege (kern/spiel.js)
//   abklingendBis: { name: zugnummer } ab diesem Stand des Zugzählers wieder bereit
// Risikotabelle: [{ name, chance: Kurve in Prozent, wirkt, effekt? }]; ein Wurf, die Ausgänge liegen
//   hintereinander; wirkt: false heißt, die Fähigkeit selbst wirkt nicht; der Verbrauch ist in jedem Fall bezahlt.

import { anmelden } from "../kern/register.js";
import { modifiziert, hatWert, bedingungenErfuellt } from "../kern/werte.js";
import { effektAnwenden, wertAendern } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { entitaetMitId, entitaetEntfernen, fraktionVon } from "../kern/zustand.js";
import { wurfGanzzahl } from "../kern/wurf.js";
import { wertAufKurve } from "../kern/kurven.js";
import { zielAufloesen, entitaetenAufFeldern } from "./zielauswahl.js";
import { zustandSetzen, zustandBeenden } from "./zustaende.js";
import { aktionBeginnen } from "./laufendeAktionen.js";
import { anzahlVon, einenAbnehmen } from "./inventar.js";
import { stufeVon, fehlendePunkte } from "./skills.js";

export const FAEHIGKEITSARTEN = ["aktiv", "aufrecht"];

export function faehigkeitVon(spiel, name) {
  return spiel.daten.faehigkeiten?.[name] ?? null;
}

// Die Definition, wie sie für diese Wirkende gilt: zutreffende Einträge aus ausbau flach darübergelegt
export function faehigkeitFuer(spiel, wesen, name) {
  const definition = faehigkeitVon(spiel, name);
  if (!definition?.ausbau || !wesen) return definition;
  let ergebnis = definition;
  for (const { wenn, aendert } of definition.ausbau) {
    if (bedingungenErfuellt(spiel, wesen, wenn, umstaendeVon(definition))) ergebnis = { ...ergebnis, ...aendert };
  }
  return ergebnis;
}

export function kenntFaehigkeit(wesen, name) {
  return (wesen.faehigkeiten || []).includes(name);
}

const tagsVon = (definition) => definition.tags || [];
const umstaendeVon = (definition) => ({ tags: tagsVon(definition) });

// Verbrauch nach Modifikatoren, z.B. { mp: 9 }
export function verbrauchVon(spiel, wesen, definition) {
  const ergebnis = {};
  for (const [wertName, menge] of Object.entries(definition.verbrauch || {})) {
    ergebnis[wertName] = Math.max(0, modifiziert(spiel, wesen, [`verbrauch.${wertName}`, "verbrauch.alle"], menge, umstaendeVon(definition)));
  }
  return ergebnis;
}

// Wie viele eigene Züge die Fähigkeit noch abklingt (0 = bereit)
export function zuegeBisBereit(wesen, name) {
  const bereitAb = wesen.abklingendBis?.[name];
  return bereitAb === undefined ? 0 : Math.max(0, bereitAb - (wesen.zuege ?? 0));
}

function abklingenLassen(spiel, wesen, name, definition) {
  const abklingzeit = Math.max(0, modifiziert(spiel, wesen, "abklingzeit", definition.abklingzeit ?? 0, umstaendeVon(definition)));
  if (abklingzeit === 0) return;
  if (!wesen.abklingendBis) wesen.abklingendBis = {};
  // der Zugzähler steigt nach dieser Aktion um eins; danach zählen abklingzeit weitere eigene Züge
  wesen.abklingendBis[name] = (wesen.zuege ?? 0) + 1 + abklingzeit;
}

export function voraussetzungenErfuellt(spiel, wesen, definition) {
  return bedingungenErfuellt(spiel, wesen, definition.voraussetzungen, umstaendeVon(definition));
}

// Material: je Eintrag so viele Stück aus dem Gepäck (Stapel zählen mit ihrer Anzahl), in der Reihenfolge des Inventars;
// gibt [{ id, stueck }] zurück oder null, wenn etwas fehlt; angelegte Gegenstände sind kein Material
function materialAuswaehlen(spiel, wesen, definition) {
  const gewaehlt = [];
  for (const { typ, anzahl } of definition.material || []) {
    let offen = anzahl;
    for (const id of wesen.inventar || []) {
      const gegenstand = entitaetMitId(spiel.zustand, id);
      if (offen <= 0 || gegenstand?.typ !== typ || (wesen.ausgeruestet || []).includes(id)) continue;
      const stueck = Math.min(offen, anzahlVon(gegenstand));
      gewaehlt.push({ id, stueck });
      offen -= stueck;
    }
    if (offen > 0) return null;
  }
  return gewaehlt;
}

// Der Zustand einer aufrechterhaltenen Fähigkeit, den die Wirkende selbst gesetzt hat
function aufrechteInstanz(wesen, definition) {
  return (wesen.zustaende || []).find((instanz) => instanz.name === definition.zustand && instanz.quelleId === wesen.id) || null;
}

// null, wenn die Fähigkeit jetzt benutzbar ist, sonst der Grund
export function faehigkeitPruefen(spiel, wesen, name, zielangabe) {
  const definition = faehigkeitFuer(spiel, wesen, name);
  if (!definition || !kenntFaehigkeit(wesen, name)) return "nicht_gelernt";
  if (definition.art === "aufrecht" && aufrechteInstanz(wesen, definition)) return null; // Beenden geht immer
  if (zuegeBisBereit(wesen, name) > 0) return "abklingend";
  if (!voraussetzungenErfuellt(spiel, wesen, definition)) return "voraussetzung";
  for (const [wertName, menge] of Object.entries(verbrauchVon(spiel, wesen, definition))) {
    if (menge > 0 && (!hatWert(wesen, wertName) || wesen.werte[wertName].aktuell < menge)) return `zu_wenig_${wertName}`;
  }
  if (!materialAuswaehlen(spiel, wesen, definition)) return "material_fehlt";
  if (definition.ziel) {
    const aufloesung = zielAufloesen(spiel, wesen, definition.ziel, zielangabe);
    if (!aufloesung.ok) return aufloesung.grund;
  }
  return null;
}

function kostenBezahlen(spiel, wesen, name, definition) {
  const ursprung = { urheberId: wesen.id, ursache: "faehigkeit", mittel: { art: "faehigkeit", name }, kettentiefe: 0 };
  for (const [wertName, menge] of Object.entries(verbrauchVon(spiel, wesen, definition))) {
    if (menge > 0) wertAendern(spiel, wesen, wertName, -menge, ursprung);
  }
  for (const { id, stueck } of materialAuswaehlen(spiel, wesen, definition)) {
    for (let i = 0; i < stueck; i++) entitaetEntfernen(spiel.zustand, einenAbnehmen(spiel, wesen, entitaetMitId(spiel.zustand, id)).id);
  }
}

// Würfelt eine Risikotabelle über x (Vorgabe: der Pegel der Wirkenden); gibt den Ausgang zurück oder null (nichts passiert)
export function risikoWuerfeln(spiel, wesen, tabellenName, x = undefined) {
  const tabelle = spiel.daten.risiken?.[tabellenName];
  if (!tabelle) throw new Error(`Unbekannte Risikotabelle "${tabellenName}"`);
  const wert = x ?? (hatWert(wesen, "pegel") ? wesen.werte.pegel.aktuell : 0);
  const chancen = tabelle.map((ausgang) => Math.max(0, wertAufKurve(ausgang.chance, wert)));
  if (chancen.every((chance) => chance === 0)) return null;
  let wurf = wurfGanzzahl(spiel, "risiko", 1, 100);
  for (let i = 0; i < tabelle.length; i++) {
    if (wurf <= chancen[i]) return tabelle[i];
    wurf -= chancen[i];
  }
  return null;
}

// Fehlende Stufen des verlangten Skills
export function fehlendeStufen(spiel, wesen, definition) {
  return definition.skill ? Math.max(0, definition.skill.stufe - stufeVon(spiel, wesen, definition.skill.name)) : 0;
}

// Die Würfe vor der Wirkung in ihrer Reihenfolge: [{ tabelle, x, wegen }]
function risikenDer(spiel, wesen, definition) {
  const liste = [];
  if (definition.skill) liste.push({ tabelle: definition.skill.risiko, x: fehlendeStufen(spiel, wesen, definition), wegen: "skill" });
  if (definition.anforderung) liste.push({ tabelle: definition.anforderung.risiko, x: fehlendePunkte(spiel, wesen, definition.anforderung.eigenschaften), wegen: "anforderung" });
  if (definition.risiko) liste.push({ tabelle: definition.risiko, x: undefined, wegen: "risiko" });
  return liste;
}

// Worauf die Wirkung angewandt wird: je betroffene Entität (Muster, durchdringendes Geschoss) oder einmal
export function wirkungsziele(spiel, wesen, zielart, aufloesung) {
  if (zielart.muster) {
    const optionen = { trifft: zielart.trifft ?? "alle", urheberId: wesen.id, urheberFraktion: fraktionVon(wesen), ohneUrheber: Boolean(zielart.ohneUrheber) };
    return entitaetenAufFeldern(spiel, aufloesung.felder, optionen).map((entitaet) => entitaet.id);
  }
  if (aufloesung.bahn && zielart.durchdringend) return [...aufloesung.bahn.getroffene];
  return [aufloesung.zielId];
}

function wirkungAnwenden(spiel, wesen, name, definition, zielangabe) {
  const zielart = definition.ziel;
  const aufloesung = zielAufloesen(spiel, wesen, zielart, zielangabe);
  if (!aufloesung.ok) {
    melden(spiel, "verpufft", { wer: bezugAuf(wesen), faehigkeit: name, grund: aufloesung.grund });
    return;
  }
  if (aufloesung.bahn) melden(spiel, "geschoss", { quelle: bezugAuf(wesen), bahn: aufloesung.bahn.felder, aufschlag: aufloesung.bahn.aufschlag });
  else if (zielart.muster) melden(spiel, "flaeche", { quelle: bezugAuf(wesen), felder: aufloesung.felder });
  const grundkontext = {
    quelleId: wesen.id, ursprung: aufloesung.ursprung, zielfeld: aufloesung.zielpunkt,
    ursache: "faehigkeit", kettentiefe: 0, mittel: { art: "faehigkeit", name }, tags: [...tagsVon(definition)], werte: {},
  };
  for (const zielId of wirkungsziele(spiel, wesen, zielart, aufloesung)) {
    if (zielId !== null && !spiel.zustand.entitaeten[zielId]) continue;
    const ziel = zielId === null ? null : spiel.zustand.entitaeten[zielId];
    effektAnwenden(spiel, definition.wirkung, { ...grundkontext, zielId, zielfeld: ziel?.position ? { ...ziel.position } : grundkontext.zielfeld });
  }
}

// Zeitkosten einer Fähigkeit bzw. eines Schritts ihrer langen Aktion
function zeitergebnis(spiel, definition) {
  return { aktion: "faehigkeit", grundkosten: definition.zeit ?? spiel.daten.aktionen.faehigkeit, umstaende: umstaendeVon(definition) };
}

// Risiko und Wirkung, sofort oder nach dem letzten Schritt einer langen Aktion
function faehigkeitWirken(spiel, wesen, name, definition, zielangabe) {
  melden(spiel, "faehigkeit", { wer: bezugAuf(wesen), faehigkeit: name, text: definition.text });
  for (const { tabelle, x, wegen } of risikenDer(spiel, wesen, definition)) {
    const ausgang = risikoWuerfeln(spiel, wesen, tabelle, x);
    if (!ausgang) continue;
    melden(spiel, "risiko", { wer: bezugAuf(wesen), faehigkeit: name, ausgang: ausgang.name, wegen });
    if (ausgang.effekt) {
      const position = wesen.position ? { ...wesen.position } : null;
      effektAnwenden(spiel, ausgang.effekt, { quelleId: wesen.id, zielId: wesen.id, ursprung: position, zielfeld: position, ursache: "risiko", mittel: { art: "faehigkeit", name }, tags: [...tagsVon(definition)] });
    }
    if (!ausgang.wirkt) return;
  }
  if (definition.art === "aufrecht") zustandSetzen(spiel, wesen, definition.zustand, { quelleId: wesen.id, urheberId: wesen.id });
  else wirkungAnwenden(spiel, wesen, name, definition, zielangabe);
}

anmelden("laufendeaktionen", "faehigkeit", {
  schrittkosten: (spiel, akteur, aktion) => zeitergebnis(spiel, faehigkeitFuer(spiel, akteur, aktion.faehigkeit)),
  abschliessen(spiel, akteur, aktion) {
    faehigkeitWirken(spiel, akteur, aktion.faehigkeit, faehigkeitFuer(spiel, akteur, aktion.faehigkeit), aktion.ziel);
  },
  abbrechen(spiel, akteur, aktion) {
    const definition = faehigkeitFuer(spiel, akteur, aktion.faehigkeit);
    if (!definition.beimAbbruch) return;
    const position = akteur.position ? { ...akteur.position } : null;
    effektAnwenden(spiel, definition.beimAbbruch, { quelleId: akteur.id, zielId: akteur.id, ursprung: position, zielfeld: position, ursache: "abbruch", mittel: { art: "faehigkeit", name: aktion.faehigkeit }, tags: [...tagsVon(definition)] });
  },
});

function faehigkeitAusfuehren(spiel, wesen, name, zielangabe) {
  const definition = faehigkeitFuer(spiel, wesen, name);
  const ergebnis = zeitergebnis(spiel, definition);
  if (definition.art === "aufrecht") {
    const instanz = aufrechteInstanz(wesen, definition);
    if (instanz) {
      zustandBeenden(spiel, wesen, instanz, "entfernt");
      return ergebnis;
    }
  }
  kostenBezahlen(spiel, wesen, name, definition);
  abklingenLassen(spiel, wesen, name, definition);
  if (definition.dauer) {
    const ziel = zielangabe === undefined ? null : structuredClone(zielangabe);
    const aufloesung = definition.ziel ? zielAufloesen(spiel, wesen, definition.ziel, zielangabe) : null;
    const meldungszusatz = { faehigkeit: name, ankuendigung: definition.ankuendigung ?? null, felder: aufloesung?.ok ? aufloesung.felder : [] };
    const aktion = { art: "faehigkeit", schritteGesamt: definition.dauer.schritte, faehigkeit: name, ziel };
    if (definition.unterbrechbar) aktion.unterbrechbar = definition.unterbrechbar === true ? ["schaden"] : [...definition.unterbrechbar];
    return aktionBeginnen(spiel, wesen, aktion, meldungszusatz);
  }
  faehigkeitWirken(spiel, wesen, name, definition, zielangabe);
  return ergebnis;
}

anmelden("befehle", "faehigkeit", {
  pruefen(spiel, akteur, befehl) {
    if (typeof befehl.faehigkeit !== "string") return "ungueltig";
    return faehigkeitPruefen(spiel, akteur, befehl.faehigkeit, befehl.ziel);
  },
  ausfuehren(spiel, akteur, befehl) {
    return faehigkeitAusfuehren(spiel, akteur, befehl.faehigkeit, befehl.ziel);
  },
});
