// Titelbildschirm und Wahl der Läufe (siehe docs/Titelbildschirm.md): reine Tastenlogik ohne DOM.
//   titel:  unterste Fensterart im Stapel; Esc und ein Klick daneben schließen ihn nicht. Zustand { gewaehlt, hinweis? }.
//           Einträge je nach Speicherplätzen: Fortsetzen (zuletzt gespielter Lauf, vorgewählt), Neues Spiel, Testkammer
//           (neues Spiel der Spielart "allmaechtig"), Arena (öffnet die Wahl der Arena, eingabe/arenawahl.js), Läufe (ab zwei
//           belegten Plätzen), Einstellungen, Hilfe, Mitwirkende (eingabe/mitwirkende.js), Beenden. Ein Klick auf einen
//           Platz der rechten Spalte trägt
//           data-ziel { stelle } und setzt diesen Lauf fort.
//   laeufe: die drei Speicherplätze; Zustand { gewaehlt, zweck }; zweck "fortsetzen" (Lauf wählen) oder "ersetzen"
//           (alle Plätze belegt, ein neues Spiel verdrängt einen Lauf, mit Nachfrage); Entf löscht mit Nachfrage;
//           spielart und zusatz (nur beim Ersetzen für Testkammer und Arena) gehen in die Aktion neuesSpiel.
// kontext.plaetze: [null | { vorschau, grund? }] (eingabe/speicherstand.js platzVorschau), aus src/main.js.
// Aktionen für src/main.js: { art: "fortsetzen", stelle }, { art: "neuesSpiel", stelle, spielart?, ...zusatz } (spielart
// nur, wenn nicht "normal"; zusatz der Arena: { arena, automatisch, taktik }), { art: "platzLoeschen", stelle },
// "beenden".

import { fensterartAnmelden } from "./fenster.js";
import { listeBedienen } from "./menue.js";
import { einstellungsfensterOeffnen } from "./einstellungsfenster.js";
import { platzSpielbar, platzFuerNeuesSpiel, zuletztGespielt } from "./speicherstand.js";
import { arenawahlOeffnen } from "./arenawahl.js";
import "./mitwirkende.js";

export function titelEintraege(plaetze) {
  const spielbar = plaetze.some(platzSpielbar);
  const belegt = plaetze.filter(Boolean).length;
  return [...(spielbar ? ["fortsetzen"] : []), "neues_spiel", "testkammer", "arena", ...(belegt >= 2 ? ["laeufe"] : []), "einstellungen", "hilfe", "mitwirkende", "beenden"];
}

export function titelOeffnen() {
  return { gewaehlt: 0 };
}

// zusatz: weitere Startwahl einer Spielart, z.B. der Arena { arena, automatisch, taktik }
export function neuesSpielAktion(stelle, spielart = "normal", zusatz = {}) {
  return spielart === "normal" ? { art: "neuesSpiel", stelle } : { art: "neuesSpiel", stelle, spielart, ...zusatz };
}

const SPIELART_DES_EINTRAGS = { neues_spiel: "normal", testkammer: "allmaechtig" };

function titelEintragWaehlen(zustand, eintrag, plaetze) {
  if (eintrag === "fortsetzen") return { zustand, aktion: { art: "fortsetzen", stelle: zuletztGespielt(plaetze) } };
  if (eintrag in SPIELART_DES_EINTRAGS) {
    const spielart = SPIELART_DES_EINTRAGS[eintrag];
    const stelle = platzFuerNeuesSpiel(plaetze);
    if (stelle === null) return { zustand, oeffnen: { art: "laeufe", zustand: laeufeOeffnen("ersetzen", plaetze, spielart) } };
    return { zustand, aktion: neuesSpielAktion(stelle, spielart) };
  }
  if (eintrag === "arena") return { zustand, oeffnen: { art: "arenawahl", zustand: arenawahlOeffnen() } };
  if (eintrag === "laeufe") return { zustand, oeffnen: { art: "laeufe", zustand: laeufeOeffnen("fortsetzen", plaetze) } };
  if (eintrag === "einstellungen") return { zustand, oeffnen: { art: "einstellungen", zustand: einstellungsfensterOeffnen() } };
  if (eintrag === "hilfe") return { zustand, oeffnen: { art: "hilfe", zustand: {} } };
  if (eintrag === "mitwirkende") return { zustand, oeffnen: { art: "mitwirkende", zustand: {} } };
  return { zustand, aktion: eintrag };
}

export function titelTaste(zustand, taste, kontext = {}) {
  const plaetze = kontext.plaetze ?? [];
  if (taste.code === "Escape") return { zustand };
  const eintraege = titelEintraege(plaetze);
  const { gewaehlt, waehlen } = listeBedienen(zustand.gewaehlt, eintraege.length, taste);
  const neu = { gewaehlt };
  if (waehlen === null) return { zustand: neu };
  return titelEintragWaehlen(neu, eintraege[waehlen], plaetze);
}

// Klick auf einen Platz in der rechten Spalte: wie die Wahl in den Läufen
export function titelKlick(zustand, ziel, kontext = {}) {
  if (ziel.stelle === undefined) return { zustand };
  return { ...platzWaehlen(ziel.stelle, kontext.plaetze ?? [], "fortsetzen"), zustand };
}

// Läufe

export function laeufeOeffnen(zweck, plaetze = [], spielart = "normal", zusatz = null) {
  const zustand = { gewaehlt: zweck === "fortsetzen" ? zuletztGespielt(plaetze) ?? 0 : 0, zweck };
  if (spielart === "normal") return zustand;
  return zusatz ? { ...zustand, spielart, zusatz } : { ...zustand, spielart };
}

// Was die Wahl eines Platzes bedeutet (ohne zustand, den setzt die aufrufende Fensterart)
function platzWaehlen(stelle, plaetze, zweck, spielart = "normal", zusatz = {}) {
  const platz = plaetze[stelle] ?? null;
  const nummer = { platz: stelle + 1 };
  if (zweck === "ersetzen" && platzSpielbar(platz)) {
    return { oeffnen: { art: "bestaetigung", zustand: { frage: "laeufe.ersetzen_frage", werte: nummer, aktion: neuesSpielAktion(stelle, spielart, zusatz) } } };
  }
  if (platz?.grund === "daten") {
    return { oeffnen: { art: "bestaetigung", zustand: { frage: "laeufe.daten_frage", werte: nummer, aktion: neuesSpielAktion(stelle, spielart, zusatz) } } };
  }
  if (platz?.grund) {
    return { oeffnen: { art: "bestaetigung", zustand: { frage: "laeufe.veraltet_frage", werte: { ...nummer, version: platz.version ?? "?" }, aktion: neuesSpielAktion(stelle, spielart, zusatz) } } };
  }
  if (!platz) return { aktion: neuesSpielAktion(stelle, spielart, zusatz) };
  return { aktion: { art: "fortsetzen", stelle } };
}

export function laeufeTaste(zustand, taste, kontext = {}) {
  const plaetze = kontext.plaetze ?? [];
  if (taste.code === "Escape") return { zustand: null };
  if ((taste.code === "Delete" || taste.code === "Backspace") && plaetze[zustand.gewaehlt]) {
    const stelle = zustand.gewaehlt;
    return { zustand, oeffnen: { art: "bestaetigung", zustand: { frage: "laeufe.loeschen_frage", werte: { platz: stelle + 1 }, aktion: { art: "platzLoeschen", stelle } } } };
  }
  const { gewaehlt, waehlen } = listeBedienen(zustand.gewaehlt, plaetze.length || 1, taste);
  const neu = { ...zustand, gewaehlt };
  if (waehlen === null) return { zustand: neu };
  return { zustand: neu, ...platzWaehlen(waehlen, plaetze, zustand.zweck, zustand.spielart, zustand.zusatz) };
}

// Klick auf eine Zeile wählt sie, der zweite Klick wirkt wie Enter
export function laeufeKlick(zustand, ziel, kontext = {}) {
  if (ziel.stelle === undefined) return { zustand };
  if (ziel.stelle !== zustand.gewaehlt) return { zustand: { ...zustand, gewaehlt: ziel.stelle } };
  return laeufeTaste(zustand, { code: "Enter" }, kontext);
}

fensterartAnmelden("titel", { taste: titelTaste, klick: titelKlick });
fensterartAnmelden("laeufe", { taste: laeufeTaste, klick: laeufeKlick });
