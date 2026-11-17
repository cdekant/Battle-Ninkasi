// Deutsche Texte. Schlüssel -> Text oder, für Wesen und Gegenstände, Formen nach Fall.
// Platzhalter: {name} bzw. {wer.nom}, {ziel.akk} usw. (Formen: name, nom, akk, dat)
// Format vorläufig, siehe docs/Texte.md.
export default {
  // Wesen und Gegenstände
  "wesen.ninkasi": { name: "Ninkasi", nom: "Ninkasi", akk: "Ninkasi", dat: "Ninkasi" },
  "wesen.essigbakterium": { name: "Essigbakterium", nom: "das Essigbakterium", akk: "das Essigbakterium", dat: "dem Essigbakterium" },
  "gegenstand.bier": { name: "Bier", nom: "das Bier", akk: "das Bier", dat: "dem Bier", ein: "ein Bier" },

  // Log
  "log.willkommen": "Ninkasi erwacht in einem feuchten Keller. Nüchtern. Das muss sich ändern.",
  "log.schaden": "{quelle.nom} trifft {ziel.akk}: {menge} Schaden.",
  "log.verfehlt": "{quelle.nom} verfehlt {ziel.akk}.",
  "log.tod": "{opfer.nom} zerplatzt zu saurem Matsch.",
  "log.tod_ninkasi": "Ninkasi stirbt. Ausgerechnet nüchterner als ihr lieb war. [Eingabe] für einen neuen Lauf.",
  "log.liegt_hier": "Hier liegt {was.ein}.",
  "log.aufgehoben": "{wer.nom} nimmt {was.akk} an sich.",
  "log.getrunken": "{wer.nom} leert {was.akk} in einem Zug.",
  "log.geheilt": "+{menge} {wert}.",
  "log.wert_geaendert": "{menge} {wert}.",
  "log.pegel_steigt": "Pegel über {schwelle}. Die Welt wird freundlicher.",
  "log.pegel_sinkt": "Pegel unter {schwelle}. Die Welt wird schärfer, leider.",
  "log.nuechtern": "Stocknüchtern. Keine Regeneration, keine Gnade.",
  "log.abgelehnt.wand": "Die Wand gibt nicht nach.",
  "log.abgelehnt.besetzt": "Da steht schon jemand.",
  "log.abgelehnt.nichts_da": "Hier liegt nichts außer Dreck.",
  "log.abgelehnt.nichts_zu_trinken": "Nichts zu trinken. Eine Tragödie.",
  "log.abgelehnt.nicht_trinkbar": "Das ist nicht trinkbar, so verzweifelt ist sie noch nicht.",
  "log.abgelehnt.ungueltig": "Das geht so nicht.",
  "log.abgelehnt.unbekannt": "Unbekannter Befehl.",

  // Oberfläche
  "ui.lp": "LP",
  "ui.mp": "MP",
  "ui.pp": "PP",
  "ui.pegel": "Pegel",
  "ui.gepaeck": "Gepäck",
  "ui.leer": "nichts",
  "ui.in_sicht": "In Sicht",
  "ui.niemand": "niemand",
  "ui.startwert": "Startwert",
  "ui.zeit": "Zeit",
  "ui.version": "Version",
  "ui.tasten": "Ziffernblock: bewegen, 5: warten, G: aufheben, T: trinken, +/-: Zoom, Tab: Log",
  "ui.datenfehler": "Fehler in den Daten",
};
