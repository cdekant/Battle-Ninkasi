// Braufenster (siehe docs/Bedienung.md, Fenster, und docs/Sude.md, Befehl): reine Tastenlogik ohne DOM, wie
// eingabe/inventar.js. Fenster-Zustand der Anzeige (nicht im Spielzustand):
//   { kessel: { x, y }, mengen: { <gegenstandId>: menge }, maische, gewuerz, kultur: name | null }
//   Taste p öffnet am Kessel neben oder unter Ninkasi (braufensterOeffnen), ein Klick auf den Kessel ebenso
//   a bis z gibt ein Stück der Zutat an dieser Stelle in den Kessel, mit Umschalt nimmt sie eines heraus
//   1 wechselt die Maische, 2 die Gabe des Gewürzes, 3 die Kultur (ohne, dann die Kulturen Ninkasis)
//   Rücktaste leert den Kessel, Enter braut (schließt und gibt den Befehl brauen), Esc schließt
// Die Vorschau rechnet die Anzeige mit sudVorbereiten (systeme/brauen.js), dieselbe Rechnung wie der Befehl.

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { kesselBei, zutatenIm } from "../systeme/brauen.js";
import { anzahlVon } from "../systeme/inventar.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

const BESTAETIGEN = ["Enter", "NumpadEnter"];

// Zustand des Fensters am Kessel neben oder unter Ninkasi: { zustand } oder { grund }
export function braufensterOeffnen(spiel) {
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const kessel = kesselBei(spiel, ninkasi);
  if (!kessel) return { grund: "kein_kessel" };
  const { maische, gewuerz } = spiel.daten.regeln.brauen.verfahren;
  return { zustand: { kessel: { x: kessel.x, y: kessel.y }, mengen: {}, maische, gewuerz, kultur: (ninkasi.kulturen || [])[0] ?? null } };
}

// Der Befehl zum Zustand des Fensters: die gewählten Zutaten in der Reihenfolge des Gepäcks
export function braubefehl(spiel, zustand) {
  const zutaten = zutatenIm(spiel, gesteuerteEntitaet(spiel.zustand))
    .filter((zutat) => (zustand.mengen[zutat.id] ?? 0) > 0)
    .map((zutat) => ({ gegenstandId: zutat.id, menge: zustand.mengen[zutat.id] }));
  return { art: "brauen", kessel: zustand.kessel, zutaten, verfahren: { maische: zustand.maische, gewuerz: zustand.gewuerz }, kultur: zustand.kultur };
}

// Nächster Eintrag einer Liste nach dem jetzigen, am Ende wieder der erste
const naechster = (liste, jetzt) => liste[(liste.indexOf(jetzt) + 1) % liste.length];

// Verarbeitet eine Taste; gibt { zustand, befehl? } zurück (zustand null schließt)
export function brauTaste(zustand, taste, spiel) {
  if (taste.code === "Escape") return { zustand: null };
  if (BESTAETIGEN.includes(taste.code)) return { zustand: null, befehl: braubefehl(spiel, zustand) };
  const regeln = spiel.daten.regeln.brauen;
  if (taste.code === "Backspace" || taste.code === "Delete") return { zustand: { ...zustand, mengen: {} } };
  if (taste.code === "Digit1") return { zustand: { ...zustand, maische: naechster(Object.keys(regeln.maische), zustand.maische) } };
  if (taste.code === "Digit2") return { zustand: { ...zustand, gewuerz: naechster(Object.keys(regeln.gewuerz), zustand.gewuerz) } };
  if (taste.code === "Digit3") {
    const kulturen = [null, ...(gesteuerteEntitaet(spiel.zustand).kulturen || [])];
    return { zustand: { ...zustand, kultur: naechster(kulturen, zustand.kultur) } };
  }
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  if (!buchstabe) return { zustand };
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
