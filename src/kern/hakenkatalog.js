// Katalog der internen Haken (siehe docs/Architektur.md, Ereignisse).
// Nur Haken aus diesem Katalog lassen sich anmelden und auslösen; Mods ergänzen hier eigene.
//   inBetrieb:        die Logik löst den Haken schon aus (sonst reserviert für einen späteren Ausbau)
//   ausloeserErlaubt: Auslöser aus Daten dürfen daran hängen (nur Haken "danach", nie "davor")
//   ersatzErlaubt:    Ersatzwirkungen aus Daten dürfen daran hängen (nur Haken "davor", Regel je Haken in systeme/ersatz.js)
// Kontext der Haken mit Beteiligten: { quelleId, urheberId, zielId, ursache, kettentiefe, mittel, tags, kritisch, ... }

export const HAKENKATALOG = {
  vor_schaden: { inBetrieb: true, ausloeserErlaubt: false, ersatzErlaubt: true },      // + schadensart, menge; Handler ändern menge oder brechen ab (Ränge siehe unten)
  nach_schaden: { inBetrieb: true, ausloeserErlaubt: true },      // + schadensart, menge (> 0)
  nach_treffer: { inBetrieb: true, ausloeserErlaubt: true },      // kritisch im Kontext
  verfehlt: { inBetrieb: true, ausloeserErlaubt: true },          // + grund ("ausgewichen" | "geblockt")
  vor_tod: { inBetrieb: true, ausloeserErlaubt: false, ersatzErlaubt: true }, // Abbruch verhindert den Tod, wenn der Lebenswert wieder über 0 liegt
  nach_tod: { inBetrieb: true, ausloeserErlaubt: true },          // + position des Opfers
  nach_wertaenderung: { inBetrieb: true, ausloeserErlaubt: false }, // { entitaet, wertName, vorher, nachher }
  vor_befehl: { inBetrieb: true, ausloeserErlaubt: false },       // { akteurId, befehl }; Handler ersetzen befehl oder brechen ab (dann warten)
  zustand_beginnt: { inBetrieb: true, ausloeserErlaubt: true },   // + zustand, nummer; Ziel ist die Trägerin
  zustand_endet: { inBetrieb: true, ausloeserErlaubt: true },     // + zustand, nummer, grund ("abgelaufen" | "entfernt" | "quelle_tot")
  vor_angriff: { inBetrieb: true, ausloeserErlaubt: false },       // + angriff (Name des Profils); Abbruch lässt diesen einzelnen Angriff aus
  // Ziel ist das bewegte Wesen, Quelle wer es bewegt (bei einem Schritt es selbst); + position (das Feld), art
  // ("schritt" | "stoss" | "zug" | "tausch" | "teleport" | "herausgedrueckt"), siehe systeme/bewegung.js
  verlaesst_feld: { inBetrieb: true, ausloeserErlaubt: true },
  betritt_feld: { inBetrieb: true, ausloeserErlaubt: true },
  zug_ende: { inBetrieb: true, ausloeserErlaubt: true },         // { akteurId }, Quelle und Ziel die Akteurin; nach ihrer Aktion
  // + gegenstandId, art ("trinken" | "werfen" | "anlegen" | "ablegen"); Quelle und Ziel die Benutzerin
  gegenstand_benutzt: { inBetrieb: true, ausloeserErlaubt: true },
  // + faehigkeit (Name), verbrauch ({ wert: menge }, bezahlt); Quelle und Ziel die Wirkende; nach dem Bezahlen, vor Risiko
  // und Wirkung (auch wenn sie dann fehlschlägt), systeme/faehigkeiten.js
  faehigkeit_gewirkt: { inBetrieb: true, ausloeserErlaubt: true },
  // + tiefe; Quelle und Ziel die Spielerin; nach jedem Wechsel der Ebene, wenn sie angekommen ist (systeme/ebenen.js)
  ebene_betreten: { inBetrieb: true, ausloeserErlaubt: true },
  // reserviert, siehe docs/Systemausbau.md
  zug_beginn: { inBetrieb: false, ausloeserErlaubt: true },
};

// Auslöser in den Daten: { bei, rolle?, ziel?, effekt, chance?, daempfung?, wenn? }
// Ränge der Schadensrechnung am Haken vor_schaden (systeme/kampf.js); Handler ohne Rang (100) liegen zwischen Angreifer
// und Rüstung. Hier im Kern, damit Systeme sie ohne Importkreis über systeme/kampf.js lesen (z.B. systeme/lernen.js).
export const RANG_ANGREIFER = 50, RANG_RUESTUNG = 200, RANG_WIDERSTAND = 300;
// Ersatzwirkungen (systeme/ersatz.js) nach dem Widerstand, damit nur echter Schaden eine Barriere verbraucht;
// am Haken vor_tod vor der Allmacht
export const RANG_ERSATZ = 400;

export const AUSLOESER_ROLLEN = ["quelle", "ziel"]; // welche Rolle die Trägerin im Ereignis haben muss
export const AUSLOESER_ZIELE = ["selbst", "quelle", "ziel", "feld"]; // worauf der Effekt wirkt
