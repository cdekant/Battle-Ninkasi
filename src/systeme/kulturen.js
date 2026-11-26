// Kulturen gewinnen und ihre Formen (siehe docs/Sude.md, Kulturen; Spieldesign in docs/Brauen.md, Kulturen).
// Form: eine Kultur der Daten (daten.kulturen) mit Merkmalen; Schlüssel "<kultur>~<merkmal>~<merkmal>", die Merkmale
//   sortiert, ohne Merkmale nur der Name der Kultur; die Rechnung der Formen steht in systeme/sud.js. Ein Merkmal ist ein Zustand mit kulturmerkmal: [{ art, ... }]
//   (daten/zustaende), als Affix der Population (welt/population.js) am Wesen; er verändert das Wesen mit seinen
//   Modifikatoren wie jeder Zustand und die Kultur mit seinen Änderungen, sein Adjektiv steht vor ihrem Namen.
// Änderungsarten im Register "kulturaenderungen": { anwenden(kultur, aenderung), pruefen(aenderung, { aromaachsen }) },
//   pruefen (für die Datenprüfung) gibt einen Fehlertext oder null:
//   plus:  { feld: "vergaerung" | "vertraegt" | "verderben" | "schnellsud", wert } zählt wert dazu (vergaerung bleibt
//          0 bis 100, vertraegt und schnellsud ab 0)
//   aroma: { achse, wert } zählt wert zum Aroma der Kultur dazu (ab 0)
// Quelle: ein Wesen mit kultur: name (Daten); seine Form folgt aus den Merkmalen unter seinen Zuständen.
// Gewinnen (Sammlerin ist ein Wesen mit kulturen: [Schlüssel], im Spiel Ninkasi):
//   neben dem Wesen: am Ende jedes Zugs (Haken zug_ende) der Sammlerin oder der Quelle, wenn beide auf benachbarten
//     Feldern stehen (Schachbrett-Abstand 1); ohne Wahrnehmung, eine schon bekannte Form bleibt still
//   am Rest: stirbt eine Quelle, liegt auf ihrem Feld ein Gegenstand regeln.brauen.rest mit kultur: Form (Haken
//     nach_tod); ohne rest (Grundgerüst) bleibt nichts
//   eine Probe aufheben: ein Gegenstand mit kultur gibt sie jedem Wesen, das ihn aufhebt, und vergeht (Haken aufgehoben);
//     schon bekannt: kultur_bekannt
// Meldungen: kultur_gewonnen und kultur_bekannt mit wer und kultur (Bezug mit name, text und adjektive); beim ersten
//   Gewinn einer Form Wissens-EP (systeme/wissen.js).

import { anmelden } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, ausDatenErzeugen, ausDemInventarNehmen, entitaetenImUmkreis, istWesen } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { kulturGebucht } from "./wissen.js";
import { formSchluessel, kulturBezug } from "./sud.js";

const FELDER_PLUS = { vergaerung: [0, 100], vertraegt: [0, Infinity], verderben: [-Infinity, Infinity], schnellsud: [0, Infinity] };
const begrenzt = (wert, [unten, oben]) => Math.max(unten, Math.min(oben, wert));

anmelden("kulturaenderungen", "plus", {
  anwenden(kultur, aenderung) {
    kultur[aenderung.feld] = begrenzt((kultur[aenderung.feld] ?? 0) + aenderung.wert, FELDER_PLUS[aenderung.feld]);
  },
  pruefen(aenderung) {
    if (!(aenderung.feld in FELDER_PLUS)) return `feld muss eines von ${Object.keys(FELDER_PLUS).join(", ")} sein`;
    return Number.isInteger(aenderung.wert) ? null : "wert muss eine ganze Zahl sein";
  },
});

anmelden("kulturaenderungen", "aroma", {
  anwenden(kultur, aenderung) {
    kultur.aromen = { ...kultur.aromen, [aenderung.achse]: Math.max(0, (kultur.aromen?.[aenderung.achse] ?? 0) + aenderung.wert) };
  },
  pruefen(aenderung, { aromaachsen }) {
    if (!aromaachsen.includes(aenderung.achse)) return `Aromaachse "${aenderung.achse}" gibt es nicht`;
    return Number.isInteger(aenderung.wert) ? null : "wert muss eine ganze Zahl sein";
  },
});

// Form, die ein Wesen als Quelle gibt, oder null
export function kulturformVon(spiel, wesen) {
  if (!wesen?.kultur) return null;
  const merkmale = (wesen.zustaende || []).map((instanz) => instanz.name).filter((name) => spiel.daten.zustaende?.[name]?.kulturmerkmal);
  return formSchluessel(wesen.kultur, merkmale);
}

const istSammlerin = (wesen) => Array.isArray(wesen?.kulturen);

// Gibt der Sammlerin eine Form; true, wenn sie neu war. still: eine bekannte Form ohne Meldung
export function kulturGewinnen(spiel, wesen, schluessel, { still = false } = {}) {
  const neu = !(wesen.kulturen || []).includes(schluessel);
  if (!neu && still) return false;
  if (neu) wesen.kulturen = [...(wesen.kulturen || []), schluessel];
  const kultur = kulturBezug(spiel.daten, schluessel);
  melden(spiel, neu ? "kultur_gewonnen" : "kultur_bekannt", { wer: bezugAuf(wesen), kultur });
  if (neu) kulturGebucht(spiel, wesen, schluessel, kultur);
  return neu;
}

// Wesen auf den Nachbarfeldern, nach ID
const nachbarwesen = (spiel, wesen) => entitaetenImUmkreis(spiel.zustand, wesen.position, 1)
  .filter((anderes) => anderes.id !== wesen.id && istWesen(anderes));

anmelden("haken", "zug_ende", (spiel, kontext) => {
  const akteur = entitaetMitId(spiel.zustand, kontext.akteurId);
  if (!akteur?.position || !istWesen(akteur)) return;
  if (istSammlerin(akteur)) {
    for (const quelle of nachbarwesen(spiel, akteur)) if (quelle.kultur) kulturGewinnen(spiel, akteur, kulturformVon(spiel, quelle), { still: true });
  }
  if (akteur.kultur) {
    const form = kulturformVon(spiel, akteur);
    for (const sammlerin of nachbarwesen(spiel, akteur)) if (istSammlerin(sammlerin)) kulturGewinnen(spiel, sammlerin, form, { still: true });
  }
});

// Rest einer gestorbenen Quelle auf ihrem letzten Feld
anmelden("haken", "nach_tod", (spiel, kontext) => {
  const quelle = entitaetMitId(spiel.zustand, kontext.zielId);
  const rest = spiel.daten.regeln.brauen?.rest;
  if (!quelle?.kultur || !rest || !kontext.position) return;
  const gegenstand = ausDatenErzeugen(spiel, "gegenstaende", rest, kontext.position);
  gegenstand.kultur = kulturformVon(spiel, quelle);
});

// Eine Probe aufheben (siehe Kopf)
anmelden("haken", "aufgehoben", (spiel, kontext) => {
  const wesen = entitaetMitId(spiel.zustand, kontext.quelleId), gegenstand = entitaetMitId(spiel.zustand, kontext.gegenstandId);
  if (!wesen || !gegenstand?.kultur) return;
  ausDemInventarNehmen(wesen, gegenstand.id);
  entitaetEntfernen(spiel.zustand, gegenstand.id);
  kulturGewinnen(spiel, wesen, gegenstand.kultur);
});
