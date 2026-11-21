// Spielmenü und Bestätigung (siehe docs/Oberflaeche.md, Fenster und Unterbrechungen): reine Tastenlogik ohne DOM.
// Beide sind Fensterarten im Fensterstapel (eingabe/fenster.js); was sie auslösen, geben sie als ergebnis.aktion
// zurück, src/main.js führt es aus (die Logik kennt kein Menü).
//   menue:        Zustand { gewaehlt }; Buchstabe wählt direkt, Pfeile oder j/k bewegen, Enter bestätigt, Esc schließt
//   bestaetigung: Zustand { frage, aktion }; j oder Enter bestätigt (gibt aktion zurück), n oder Esc schließt
// Neustart fragt nach; Hilfe legt sich über das Menü; Layout schaltet um und lässt das Menü offen.

import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";

export const MENUE_EINTRAEGE = ["fortsetzen", "hilfe", "layout", "neustart", "beenden"];

const HOCH = ["ArrowUp", "KeyK"];
const RUNTER = ["ArrowDown", "KeyJ"];
const BESTAETIGEN = ["Enter", "NumpadEnter"];

export function menueOeffnen() {
  return { gewaehlt: 0 };
}

// Was ein Eintrag tut: Ergebnis im Format von fensterTaste
function eintragWaehlen(zustand, eintrag) {
  if (eintrag === "fortsetzen") return { zustand: null };
  if (eintrag === "hilfe") return { zustand, oeffnen: { art: "hilfe", zustand: {} } };
  if (eintrag === "neustart") return { zustand, oeffnen: { art: "bestaetigung", zustand: { frage: "menue.neustart_frage", aktion: "neustart" } } };
  if (eintrag === "layout") return { zustand, aktion: "layout" };
  return { zustand: null, aktion: eintrag };
}

export function menueTaste(zustand, taste) {
  if (taste.code === "Escape") return { zustand: null };
  if (HOCH.includes(taste.code)) return { zustand: { gewaehlt: (zustand.gewaehlt + MENUE_EINTRAEGE.length - 1) % MENUE_EINTRAEGE.length } };
  if (RUNTER.includes(taste.code)) return { zustand: { gewaehlt: (zustand.gewaehlt + 1) % MENUE_EINTRAEGE.length } };
  if (BESTAETIGEN.includes(taste.code)) return eintragWaehlen(zustand, MENUE_EINTRAEGE[zustand.gewaehlt]);
  const buchstabe = buchstabeDerTaste(taste.code, taste.zeichen);
  const stelle = buchstabe ? BUCHSTABEN.indexOf(buchstabe) : -1;
  if (stelle < 0 || stelle >= MENUE_EINTRAEGE.length) return { zustand };
  return eintragWaehlen({ gewaehlt: stelle }, MENUE_EINTRAEGE[stelle]);
}

export function bestaetigungTaste(zustand, taste) {
  if (taste.code === "Escape" || taste.code === "KeyN") return { zustand: null };
  if (taste.code === "KeyJ" || taste.code === "KeyY" || BESTAETIGEN.includes(taste.code)) return { zustand: null, aktion: zustand.aktion };
  return { zustand };
}

fensterartAnmelden("menue", { taste: (zustand, taste) => menueTaste(zustand, taste) });
fensterartAnmelden("bestaetigung", { taste: (zustand, taste) => bestaetigungTaste(zustand, taste) });
