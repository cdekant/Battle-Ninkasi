// Charakter- und Skillfenster (Taste C; siehe docs/Architektur.md, Fenster): reine Tastenlogik ohne DOM.
// Fensterart "charakter" im Fensterstapel (eingabe/fenster.js), Zustand { gewaehlt, eingabe }:
//   gewaehlt: Stelle in der Skillübersicht (systeme/skills.js skillUebersicht), eingabe: getippte Zahl als Text
//   Pfeil hoch und runter wählen, Bild auf und ab blättern um eine Seite (26), A bis Z wählt auf der Seite;
//   Ziffern tippen eine Zahl EP, Rücktaste löscht die letzte;
//   Enter verteilt die getippte Zahl, ohne Zahl bis zur nächsten Stufe, Umschalt+Enter bis Stufe 5, jeweils höchstens
//   die freien EP (Befehl lernen, ohne Spielzeit); Esc löscht erst die Zahl, dann schließt es.
// Was Enter täte, zeigt das Fenster vorher (geplanteEp, lernvorschau in systeme/skills.js).

import { spielerin } from "../kern/zustand.js";
import { skillUebersicht } from "../systeme/skills.js";
import { buchstabeDerTaste, BUCHSTABEN } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

export const SEITENLAENGE = BUCHSTABEN.length;
const HOECHSTE_ZIFFERN = 6;
const TASTEN_BESTAETIGEN = ["Enter", "NumpadEnter"];

export function charakterfensterOeffnen() {
  return { gewaehlt: 0, eingabe: "" };
}

// Ziffer einer Taste oder null: nach dem Zeichen, ohne Zeichen nach Digit0 bis Digit9
function zifferDerTaste(tastencode, zeichen) {
  if (typeof zeichen === "string") return /^[0-9]$/.test(zeichen) ? zeichen : null;
  return /^Digit([0-9])$/.exec(tastencode)?.[1] ?? null;
}

// EP, die Enter verteilen würde: die getippte Zahl, sonst bis zur nächsten bzw. höchsten Stufe; höchstens die freien EP
export function geplanteEp(ninkasi, eintrag, eingabe, bisHoechste) {
  const gewuenscht = eingabe ? Number(eingabe) : bisHoechste ? eintrag.epBisHoechste : eintrag.epBisNaechste;
  return Math.min(gewuenscht, ninkasi.freieEp ?? 0);
}

function verteilen(spiel, zustand, umschalt) {
  const ninkasi = spielerin(spiel.zustand);
  const eintrag = skillUebersicht(spiel, ninkasi)[zustand.gewaehlt];
  if (!eintrag) return { zustand };
  if (eintrag.gesperrt) return { zustand, grund: eintrag.gesperrt };
  const ep = geplanteEp(ninkasi, eintrag, zustand.eingabe, umschalt);
  if (!(ep > 0)) return { zustand: { ...zustand, eingabe: "" }, grund: "zu_wenig_ep" };
  return { zustand: { ...zustand, eingabe: "" }, befehl: { art: "lernen", skill: eintrag.name, ep } };
}

// Verarbeitet eine Taste; gibt { zustand, befehl?, grund? } zurück
export function charakterTaste(zustand, taste, spiel) {
  const anzahl = skillUebersicht(spiel, spielerin(spiel.zustand)).length;
  const waehlen = (stelle) => ({ zustand: { gewaehlt: Math.max(0, Math.min(anzahl - 1, stelle)), eingabe: "" } });
  if (taste.code === "Escape") return { zustand: zustand.eingabe ? { ...zustand, eingabe: "" } : null };
  if (TASTEN_BESTAETIGEN.includes(taste.code)) return verteilen(spiel, zustand, Boolean(taste.umschalt));
  if (taste.code === "ArrowDown") return waehlen(zustand.gewaehlt + 1);
  if (taste.code === "ArrowUp") return waehlen(zustand.gewaehlt - 1);
  if (taste.code === "PageDown") return waehlen(zustand.gewaehlt + SEITENLAENGE);
  if (taste.code === "PageUp") return waehlen(zustand.gewaehlt - SEITENLAENGE);
  if (taste.code === "Backspace") return { zustand: { ...zustand, eingabe: zustand.eingabe.slice(0, -1) } };
  const ziffer = zifferDerTaste(taste.code, taste.zeichen);
  if (ziffer !== null) {
    if (zustand.eingabe.length >= HOECHSTE_ZIFFERN || (zustand.eingabe === "" && ziffer === "0")) return { zustand };
    return { zustand: { ...zustand, eingabe: zustand.eingabe + ziffer } };
  }
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  if (buchstabe) {
    const stelle = Math.floor(zustand.gewaehlt / SEITENLAENGE) * SEITENLAENGE + BUCHSTABEN.indexOf(buchstabe);
    return stelle < anzahl ? waehlen(stelle) : { zustand };
  }
  return { zustand };
}

fensterartAnmelden("charakter", { taste: (zustand, taste, { spiel }) => charakterTaste(zustand, taste, spiel) });
