// Spielmenü, Bestätigung und das Fenster nach dem Lauf (siehe docs/Oberflaeche.md, Fenster und Unterbrechungen):
// reine Tastenlogik ohne DOM. Alle drei sind Fensterarten im Fensterstapel (eingabe/fenster.js); was sie auslösen,
// geben sie als ergebnis.aktion zurück, src/main.js führt es aus (die Logik kennt kein Menü).
//   menue:        Zustand { gewaehlt }; Buchstabe wählt direkt, Pfeile oder j/k bewegen, Enter bestätigt, Esc schließt
//   bestaetigung: Zustand { frage, werte?, aktion }; j oder Enter bestätigt (gibt aktion zurück), n oder Esc schließt;
//                 aktion ist ein Name oder ein Objekt { art, ... } (z.B. { art: "neuesSpiel", stelle })
//   ende:         nach dem Tod Ninkasis: neuer Lauf, zum Titel, Verlauf; Esc schließt, Enter öffnet es wieder
// Neustart fragt nach (abschaltbar, Einstellung neustartNachfragen); Hilfe und Einstellungen legen sich über das Menü.

import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";
import { einstellungsfensterOeffnen } from "./einstellungsfenster.js";
import { verlaufOeffnen } from "./verlauf.js";

export const MENUE_EINTRAEGE = ["fortsetzen", "hilfe", "einstellungen", "neustart", "zum_titel", "beenden"];
export const ENDE_EINTRAEGE = ["neustart", "zum_titel", "verlauf"];

const HOCH = ["ArrowUp", "KeyK"];
const RUNTER = ["ArrowDown", "KeyJ"];
const BESTAETIGEN = ["Enter", "NumpadEnter"];

// Bedienung einer senkrechten Liste wie im Spielmenü: Pfeile oder j/k bewegen (rundum), Enter wählt das Gewählte,
// ein Buchstabe wählt seine Zeile direkt. Gibt { gewaehlt, waehlen } zurück; waehlen ist die gewählte Stelle oder null.
export function listeBedienen(gewaehlt, anzahl, taste) {
  const jetzt = Math.min(Math.max(gewaehlt, 0), anzahl - 1);
  if (HOCH.includes(taste.code)) return { gewaehlt: (jetzt + anzahl - 1) % anzahl, waehlen: null };
  if (RUNTER.includes(taste.code)) return { gewaehlt: (jetzt + 1) % anzahl, waehlen: null };
  if (BESTAETIGEN.includes(taste.code)) return { gewaehlt: jetzt, waehlen: jetzt };
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const stelle = buchstabe ? BUCHSTABEN.indexOf(buchstabe) : -1;
  if (stelle < 0 || stelle >= anzahl) return { gewaehlt: jetzt, waehlen: null };
  return { gewaehlt: stelle, waehlen: stelle };
}

export function menueOeffnen() {
  return { gewaehlt: 0 };
}

// Was ein Eintrag tut: Ergebnis im Format von fensterTaste; kontext.einstellungen (neustartNachfragen)
function eintragWaehlen(zustand, eintrag, kontext = {}) {
  if (eintrag === "fortsetzen") return { zustand: null };
  if (eintrag === "hilfe") return { zustand, oeffnen: { art: "hilfe", zustand: {} } };
  if (eintrag === "einstellungen") return { zustand, oeffnen: { art: "einstellungen", zustand: einstellungsfensterOeffnen() } };
  if (eintrag === "neustart") {
    if (kontext.einstellungen?.neustartNachfragen === false) return { zustand: null, aktion: "neustart" };
    return { zustand, oeffnen: { art: "bestaetigung", zustand: { frage: "menue.neustart_frage", aktion: "neustart" } } };
  }
  return { zustand: null, aktion: eintrag };
}

export function menueTaste(zustand, taste, kontext = {}) {
  if (taste.code === "Escape") return { zustand: null };
  const { gewaehlt, waehlen } = listeBedienen(zustand.gewaehlt, MENUE_EINTRAEGE.length, taste);
  if (waehlen === null) return { zustand: { gewaehlt } };
  return eintragWaehlen({ gewaehlt }, MENUE_EINTRAEGE[waehlen], kontext);
}

export function bestaetigungTaste(zustand, taste) {
  if (taste.code === "Escape" || taste.code === "KeyN") return { zustand: null };
  if (taste.code === "KeyJ" || taste.code === "KeyY" || BESTAETIGEN.includes(taste.code)) return { zustand: null, aktion: zustand.aktion };
  return { zustand };
}

export function endeOeffnen() {
  return { gewaehlt: 0 };
}

export function endeTaste(zustand, taste) {
  if (taste.code === "Escape") return { zustand: null };
  const { gewaehlt, waehlen } = listeBedienen(zustand.gewaehlt, ENDE_EINTRAEGE.length, taste);
  if (waehlen === null) return { zustand: { gewaehlt } };
  if (ENDE_EINTRAEGE[waehlen] === "verlauf") return { zustand: { gewaehlt }, oeffnen: { art: "verlauf", zustand: verlaufOeffnen() } };
  return { zustand: null, aktion: ENDE_EINTRAEGE[waehlen] };
}

fensterartAnmelden("menue", { taste: (zustand, taste, kontext) => menueTaste(zustand, taste, kontext) });
fensterartAnmelden("bestaetigung", { taste: (zustand, taste) => bestaetigungTaste(zustand, taste) });
fensterartAnmelden("ende", { taste: (zustand, taste) => endeTaste(zustand, taste) });
