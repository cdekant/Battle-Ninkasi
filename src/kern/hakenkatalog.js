// Katalog der internen Haken (siehe docs/Architektur.md, Ereignisse).
// Nur Haken aus diesem Katalog lassen sich anmelden und auslösen; Mods ergänzen hier eigene.
//   inBetrieb:        die Logik löst den Haken schon aus (sonst reserviert für einen späteren Ausbau)
//   ausloeserErlaubt: Auslöser aus Daten dürfen daran hängen (nur Haken "danach", nie "davor")
// Kontext der Haken mit Beteiligten: { quelleId, urheberId, zielId, ursache, kettentiefe, mittel, tags, kritisch, ... }

export const HAKENKATALOG = {
  vor_schaden: { inBetrieb: true, ausloeserErlaubt: false },      // + schadensart, menge; Handler ändern menge oder brechen ab (Ränge siehe systeme/kampf.js)
  nach_schaden: { inBetrieb: true, ausloeserErlaubt: true },      // + schadensart, menge (> 0)
  nach_treffer: { inBetrieb: true, ausloeserErlaubt: true },      // kritisch im Kontext
  verfehlt: { inBetrieb: true, ausloeserErlaubt: true },          // + grund ("ausgewichen" | "geblockt")
  vor_tod: { inBetrieb: true, ausloeserErlaubt: false },          // Abbruch verhindert den Tod, wenn der Lebenswert wieder über 0 liegt
  nach_tod: { inBetrieb: true, ausloeserErlaubt: true },          // + position des Opfers
  nach_wertaenderung: { inBetrieb: true, ausloeserErlaubt: false }, // { entitaet, wertName, vorher, nachher }
  vor_befehl: { inBetrieb: true, ausloeserErlaubt: false },       // { akteurId, befehl }; Handler ersetzen befehl oder brechen ab (dann warten)
  zustand_beginnt: { inBetrieb: true, ausloeserErlaubt: true },   // + zustand, nummer; Ziel ist die Trägerin
  zustand_endet: { inBetrieb: true, ausloeserErlaubt: true },
  vor_angriff: { inBetrieb: true, ausloeserErlaubt: false },       // + angriff (Name des Profils); Abbruch lässt diesen einzelnen Angriff aus     // + zustand, nummer, grund ("abgelaufen" | "entfernt" | "quelle_tot")
  // reserviert, siehe docs/Systemausbau.md
  zug_beginn: { inBetrieb: false, ausloeserErlaubt: true },
  zug_ende: { inBetrieb: false, ausloeserErlaubt: true },
  betritt_feld: { inBetrieb: false, ausloeserErlaubt: true },
  verlaesst_feld: { inBetrieb: false, ausloeserErlaubt: true },
  gegenstand_benutzt: { inBetrieb: false, ausloeserErlaubt: true },
};

// Auslöser in den Daten: { bei, rolle?, ziel?, effekt, chance?, daempfung? }
export const AUSLOESER_ROLLEN = ["quelle", "ziel"]; // welche Rolle die Trägerin im Ereignis haben muss
export const AUSLOESER_ZIELE = ["selbst", "quelle", "ziel", "feld"]; // worauf der Effekt wirkt
