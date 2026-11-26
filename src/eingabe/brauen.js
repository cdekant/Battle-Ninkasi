// Braufenster (siehe docs/Bedienung.md, Fenster, und docs/Sude.md, Befehl): reine Tastenlogik ohne DOM, wie
// eingabe/inventar.js. Fenster-Zustand der Anzeige (nicht im Spielzustand):
//   { kessel: { x, y }, portionen, mengen: { <gegenstandId>: menge }, maische, gewuerz, kultur: name | null,
//     absicht: "elixier" | "gift", liste: "zutaten" | "rezepte" }
//   Taste p öffnet am Kessel neben oder unter Ninkasi (braufensterOeffnen), ein Klick auf den Kessel ebenso; die
//   Portionen stehen zu Beginn auf so vielen, wie Kessel und leere Gefäße erlauben (mindestens 1)
//   + und - ändern die Portionen zwischen 1 und dem, was der Kessel hergibt
//   a bis z gibt ein Stück der Zutat an dieser Stelle in den Kessel, mit Umschalt nimmt sie eines heraus
//   1 wechselt die Maische, 2 die Gabe des Gewürzes, 3 die Kultur (ohne, spontan, wo die Ebene eine Flora hat, dann die
//   Kulturen Ninkasis), 4 die Absicht des Absuds (Elixier oder Gift, nur ohne Kultur von Belang)
//   Tab wechselt die Liste zwischen Zutaten und Rezepten (rezepteImBuch); in den Rezepten wählt a bis z ein Rezept:
//   es setzt Verfahren und Kultur und verteilt die Zutaten aus dem Gepäck (rezeptVerteilen), dann zurück zu den Zutaten
//   Rücktaste leert den Kessel, Enter braut (schließt und gibt den Befehl brauen), Esc schließt
// Die Vorschau rechnet die Anzeige mit sudVorbereiten (systeme/brauen.js), dieselbe Rechnung wie der Befehl.

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { kesselBei, zutatenIm, gefaesseIm } from "../systeme/brauen.js";
import { SPONTAN } from "../systeme/sud.js";
import { POLE } from "../systeme/absud.js";
import { anzahlVon } from "../systeme/inventar.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

const BESTAETIGEN = ["Enter", "NumpadEnter"];
const MEHR = { codes: ["NumpadAdd"], zeichen: ["+"] }, WENIGER = { codes: ["NumpadSubtract"], zeichen: ["-"] };
const passt = (taste, art) => art.codes.includes(taste.code) || art.zeichen.includes(taste.zeichen);

// Zustand des Fensters am Kessel neben oder unter Ninkasi: { zustand } oder { grund }
export function braufensterOeffnen(spiel) {
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const kessel = kesselBei(spiel, ninkasi);
  if (!kessel) return { grund: "kein_kessel" };
  const { maische, gewuerz } = spiel.daten.regeln.brauen.verfahren;
  const gefaesse = gefaesseIm(spiel, ninkasi).reduce((summe, gefaess) => summe + anzahlVon(gefaess), 0);
  const portionen = Math.max(1, Math.min(kessel.kessel.portionen, gefaesse));
  return { zustand: { kessel: { x: kessel.x, y: kessel.y }, portionen, mengen: {}, maische, gewuerz, kultur: (ninkasi.kulturen || [])[0] ?? null, absicht: POLE[0], liste: "zutaten" } };
}

// Rezepte im Buch des Laufs als [schluessel, rezept], gefundene vor den Hausrezepten (systeme/rezepte.js)
export function rezepteImBuch(spiel) {
  const buch = Object.entries(spiel.zustand.rezepte ?? {});
  return [...buch.filter(([, rezept]) => rezept.art === "gefunden"), ...buch.filter(([, rezept]) => rezept.art !== "gefunden")];
}

// Portionen für ein Rezept: die meisten bis zu den gewählten, bei denen jede Menge ganz aufgeht, sonst die wenigsten
// darüber bis zum Kessel; geht keine auf, bleiben die gewählten
function portionenFuer(rezept, gewaehlt, hoechstens) {
  const gehtAuf = (portionen) => rezept.zutaten.every(({ menge }) => (menge * portionen) % rezept.portionen === 0);
  for (let portionen = Math.min(gewaehlt, hoechstens); portionen >= 1; portionen--) if (gehtAuf(portionen)) return portionen;
  for (let portionen = gewaehlt + 1; portionen <= hoechstens; portionen++) if (gehtAuf(portionen)) return portionen;
  return gewaehlt;
}

// Zustand nach der Wahl eines Rezepts: Verfahren, Kultur, Portionen und die Zutaten aus dem Gepäck, so weit sie reichen
export function rezeptVerteilen(spiel, zustand, rezept) {
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const hoechstens = kesselBei(spiel, ninkasi, zustand.kessel)?.kessel.portionen ?? zustand.portionen;
  const portionen = portionenFuer(rezept, zustand.portionen, hoechstens);
  const mengen = {};
  for (const { typ, menge } of rezept.zutaten) {
    let fehlt = Math.floor((menge * portionen) / rezept.portionen);
    for (const zutat of zutatenIm(spiel, ninkasi).filter((gegenstand) => gegenstand.typ === typ)) {
      const nehmen = Math.min(fehlt, anzahlVon(zutat));
      if (nehmen > 0) mengen[zutat.id] = nehmen;
      fehlt -= nehmen;
    }
  }
  return { ...zustand, portionen, mengen, maische: rezept.verfahren.maische, gewuerz: rezept.verfahren.gewuerz, kultur: rezept.kultur, liste: "zutaten" };
}

// Der Befehl zum Zustand des Fensters: die gewählten Zutaten in der Reihenfolge des Gepäcks
export function braubefehl(spiel, zustand) {
  const zutaten = zutatenIm(spiel, gesteuerteEntitaet(spiel.zustand))
    .filter((zutat) => (zustand.mengen[zutat.id] ?? 0) > 0)
    .map((zutat) => ({ gegenstandId: zutat.id, menge: zustand.mengen[zutat.id] }));
  return { art: "brauen", kessel: zustand.kessel, portionen: zustand.portionen, zutaten, verfahren: { maische: zustand.maische, gewuerz: zustand.gewuerz }, kultur: zustand.kultur, absicht: zustand.absicht ?? POLE[0] };
}

// Nächster Eintrag einer Liste nach dem jetzigen, am Ende wieder der erste
const naechster = (liste, jetzt) => liste[(liste.indexOf(jetzt) + 1) % liste.length];

// Verarbeitet eine Taste; gibt { zustand, befehl? } zurück (zustand null schließt)
export function brauTaste(zustand, taste, spiel) {
  if (taste.code === "Escape") return { zustand: null };
  if (BESTAETIGEN.includes(taste.code)) return { zustand: null, befehl: braubefehl(spiel, zustand) };
  const regeln = spiel.daten.regeln.brauen;
  if (taste.code === "Backspace" || taste.code === "Delete") return { zustand: { ...zustand, mengen: {} } };
  if (taste.code === "Tab") return { zustand: { ...zustand, liste: zustand.liste === "rezepte" ? "zutaten" : "rezepte" } };
  if (passt(taste, MEHR) || passt(taste, WENIGER)) {
    const hoechstens = kesselBei(spiel, gesteuerteEntitaet(spiel.zustand), zustand.kessel)?.kessel.portionen ?? zustand.portionen;
    const portionen = Math.max(1, Math.min(hoechstens, zustand.portionen + (passt(taste, MEHR) ? 1 : -1)));
    return { zustand: { ...zustand, portionen } };
  }
  if (taste.code === "Digit1") return { zustand: { ...zustand, maische: naechster(Object.keys(regeln.maische), zustand.maische) } };
  if (taste.code === "Digit2") return { zustand: { ...zustand, gewuerz: naechster(Object.keys(regeln.gewuerz), zustand.gewuerz) } };
  if (taste.code === "Digit3") {
    const kulturen = [null, ...(spiel.zustand.ebene?.flora ? [SPONTAN] : []), ...(gesteuerteEntitaet(spiel.zustand).kulturen || [])];
    return { zustand: { ...zustand, kultur: naechster(kulturen, zustand.kultur) } };
  }
  if (taste.code === "Digit4") return { zustand: { ...zustand, absicht: naechster(POLE, zustand.absicht ?? POLE[0]) } };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  if (!buchstabe) return { zustand };
  if (zustand.liste === "rezepte") {
    const eintrag = rezepteImBuch(spiel)[BUCHSTABEN.indexOf(buchstabe)];
    return { zustand: eintrag ? rezeptVerteilen(spiel, zustand, eintrag[1]) : zustand };
  }
  const zutat = zutatenIm(spiel, gesteuerteEntitaet(spiel.zustand))[BUCHSTABEN.indexOf(buchstabe)];
  if (!zutat) return { zustand };
  const herausnehmen = taste.umschalt || (typeof taste.zeichen === "string" && taste.zeichen !== taste.zeichen.toLowerCase());
  const jetzt = zustand.mengen[zutat.id] ?? 0;
  const menge = herausnehmen ? Math.max(0, jetzt - 1) : Math.min(anzahlVon(zutat), jetzt + 1);
  return { zustand: { ...zustand, mengen: { ...zustand.mengen, [zutat.id]: menge } } };
}

// Als Fensterart im Fensterstapel (eingabe/fenster.js); ein Klick auf eine Zeile gibt ein Stück dazu
fensterartAnmelden("brauen", {
  taste(zustand, taste, { spiel }) {
    return brauTaste(zustand, taste, spiel);
  },
  klick(zustand, ziel, { spiel }) {
    const buchstabe = BUCHSTABEN[ziel.stelle];
    return buchstabe ? brauTaste(zustand, { code: `Key${buchstabe.toUpperCase()}`, zeichen: buchstabe }, spiel) : { zustand };
  },
});
