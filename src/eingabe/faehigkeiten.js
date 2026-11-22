// Fähigkeitenfenster (siehe docs/Bedienung.md, Zielmodus und Schnellleiste): reine Tastenlogik ohne DOM, wie
// eingabe/inventar.js. Fenster-Zustand der Anzeige (nicht im Spielzustand): null (zu) oder { gewaehlt: null | name }.
//   zu:       Taste f öffnet
//   offen:    a bis z wählt die Fähigkeit an dieser Stelle der Liste (faehigkeiten am Wesen); die Einzelheiten zeigen
//             Verbrauch, Abklingzeit und ihren Platz in der Schnellleiste
//   gewählt:  Enter oder derselbe Buchstabe noch einmal wirkt (schließt und gibt die Auswahl für den Zielmodus zurück,
//             eingabe/zielmodus.js), eine Ziffer legt sie auf diesen Platz der aktiven Leiste, Entf nimmt sie von
//             allen Leisten (ergebnis.leiste, eingabe/schnellleiste.js), Esc zurück zur Auswahl bzw. schließt

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { BUCHSTABEN, buchstabeDerTaste } from "./inventar.js";
import { fensterartAnmelden } from "./fenster.js";
import { platzDerTaste } from "./aktionskatalog.js";

const BESTAETIGEN = ["Enter", "NumpadEnter"];
const ENTFERNEN = ["Delete", "Backspace"];

// Name der Fähigkeit an einer Stelle der Liste oder null
export function faehigkeitAnStelle(spiel, stelle) {
  return (gesteuerteEntitaet(spiel.zustand).faehigkeiten || [])[stelle] ?? null;
}

const auswahlVon = (name) => ({ zweck: "faehigkeit", faehigkeit: name });

// Verarbeitet eine Taste (KeyboardEvent.code, dazu KeyboardEvent.key) bei offenem Fenster;
// gibt { fenster, auswahl?, leiste? } zurück; Buchstaben nach dem Zeichen der Taste wie im Inventar
export function faehigkeitenTaste(fenster, tastencode, spiel, zeichen, belegung) {
  const gewaehlt = fenster.gewaehlt ?? null;
  if (tastencode === "Escape") return { fenster: gewaehlt ? { gewaehlt: null } : null };
  if (gewaehlt && BESTAETIGEN.includes(tastencode)) return { fenster: null, auswahl: auswahlVon(gewaehlt) };
  if (gewaehlt && ENTFERNEN.includes(tastencode)) return { fenster, leiste: { entfernen: { art: "faehigkeit", faehigkeit: gewaehlt } } };
  const stelle = gewaehlt && belegung ? platzDerTaste(belegung, tastencode) : null;
  if (stelle !== null) return { fenster, leiste: { belegen: { stelle, platz: { art: "faehigkeit", faehigkeit: gewaehlt } } } };
  const buchstabe = buchstabeDerTaste(tastencode, zeichen);
  if (!buchstabe) return { fenster };
  const name = faehigkeitAnStelle(spiel, BUCHSTABEN.indexOf(buchstabe));
  if (!name) return { fenster };
  if (name === gewaehlt) return { fenster: null, auswahl: auswahlVon(name) };
  return { fenster: { gewaehlt: name } };
}

// Als Fensterart im Fensterstapel (eingabe/fenster.js); Zustand { gewaehlt }
fensterartAnmelden("faehigkeiten", {
  taste(zustand, taste, { spiel, belegung }) {
    const { fenster, auswahl, leiste } = faehigkeitenTaste(zustand, taste.code, spiel, taste.zeichen, belegung);
    return { zustand: fenster, ...(auswahl && { auswahl }), ...(leiste && { leiste }) };
  },
});
