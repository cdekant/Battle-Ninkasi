// Katalog der internen Haken (siehe docs/Architektur.md, Ereignisse).
// Nur Haken aus diesem Katalog lassen sich anmelden und auslösen; Mods ergänzen hier eigene.
//   inBetrieb:        die Logik löst den Haken schon aus (sonst reserviert für einen späteren Ausbau)
//   ausloeserErlaubt: Auslöser aus Daten dürfen daran hängen (nur Haken "danach", nie "davor")
// Kontext der Haken mit Beteiligten: { quelleId, zielId, ursache, kettentiefe, ... }

export const HAKENKATALOG = {
  vor_schaden: { inBetrieb: true, ausloeserErlaubt: false },      // + menge; Handler ändern menge oder brechen ab
  nach_schaden: { inBetrieb: true, ausloeserErlaubt: true },      // + menge (> 0)
  nach_treffer: { inBetrieb: true, ausloeserErlaubt: true },
  verfehlt: { inBetrieb: true, ausloeserErlaubt: true },
  vor_tod: { inBetrieb: true, ausloeserErlaubt: false },          // Abbruch verhindert den Tod, wenn der Lebenswert wieder über 0 liegt
  nach_tod: { inBetrieb: true, ausloeserErlaubt: true },          // + position des Opfers
  nach_wertaenderung: { inBetrieb: true, ausloeserErlaubt: false }, // { entitaet, wertName, vorher, nachher }
  // reserviert, siehe docs/Systemausbau.md
  vor_befehl: { inBetrieb: false, ausloeserErlaubt: false },
  zug_beginn: { inBetrieb: false, ausloeserErlaubt: true },
  zug_ende: { inBetrieb: false, ausloeserErlaubt: true },
  zustand_beginnt: { inBetrieb: false, ausloeserErlaubt: true },
  zustand_endet: { inBetrieb: false, ausloeserErlaubt: true },
  vor_angriff: { inBetrieb: false, ausloeserErlaubt: false },
  betritt_feld: { inBetrieb: false, ausloeserErlaubt: true },
  verlaesst_feld: { inBetrieb: false, ausloeserErlaubt: true },
  gegenstand_benutzt: { inBetrieb: false, ausloeserErlaubt: true },
};

// Auslöser in den Daten: { bei, rolle?, ziel?, effekt, chance?, daempfung? }
export const AUSLOESER_ROLLEN = ["quelle", "ziel"]; // welche Rolle die Trägerin im Ereignis haben muss
export const AUSLOESER_ZIELE = ["selbst", "quelle", "ziel"]; // worauf der Effekt wirkt
