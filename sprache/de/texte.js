// Deutsche Texte. Schlüssel -> Text, für Wesen und Gegenstände ein Hauptwort mit Geschlecht und Fällen.
// Artikel kommen aus grammatik.js. Platzhalter: {menge}, {ziel.akk}, {was.nom.ein}, {wer.gen.ohne},
// siehe docs/Texte.md.
export default {
  // Wesen und Gegenstände
  "wesen.ninkasi": {
    geschlecht: "f", eigenname: true,
    einzahl: { nom: "Ninkasi", gen: "Ninkasis", dat: "Ninkasi", akk: "Ninkasi" },
  },
  "wesen.essigbakterium": {
    geschlecht: "n",
    einzahl: { nom: "Essigbakterium", gen: "Essigbakteriums", dat: "Essigbakterium", akk: "Essigbakterium" },
  },
  "gegenstand.bier": {
    geschlecht: "n",
    einzahl: { nom: "Bier", gen: "Biers", dat: "Bier", akk: "Bier" },
  },

  // Log
  "log.willkommen": "Ninkasi erwacht in einem feuchten Keller. Nüchtern. Das muss sich ändern.",
  "log.schaden": "{quelle.nom} trifft {ziel.akk}: {menge} Schaden ({art}).",
  "log.schaden_kritisch": "{quelle.nom} trifft {ziel.akk} kritisch: {menge} Schaden ({art}).",
  "log.schaden_immun": "{quelle.nom} trifft {ziel.akk}, doch {art} richtet nichts aus.",
  "log.verfehlt": "{quelle.nom} verfehlt {ziel.akk}.",
  "log.geblockt": "{ziel.nom} blockt den Angriff {quelle.gen}.",
  "log.tod": "{opfer.nom} zerplatzt zu saurem Matsch.",
  "log.tod_ninkasi": "Ninkasi stirbt. Ausgerechnet nüchterner als ihr lieb war. [Eingabe] für einen neuen Lauf.",
  "log.liegt_hier": "Hier liegt {was.nom.ein}.",
  "log.aufgehoben": "{wer.nom} nimmt {was.akk} an sich.",
  "log.getrunken": "{wer.nom} leert {was.akk} in einem Zug.",
  "log.geheilt": "+{menge} {wertName}.",
  "log.wert_geaendert": "{menge} {wertName}.",
  "log.pegel_steigt": "Pegel über {schwelle}. Die Welt wird freundlicher.",
  "log.pegel_sinkt": "Pegel unter {schwelle}. Die Welt wird schärfer, leider.",
  "log.handlungsunfaehig": "Leider nicht möglich. Ninkasi kann sich nicht rühren.",
  "log.nuechtern": "Stocknüchtern. Der Kopf wird klar, der Geist leer.",
  "log.abgelehnt.wand": "Die Wand gibt nicht nach.",
  "log.abgelehnt.besetzt": "Da steht schon jemand.",
  "log.abgelehnt.nichts_da": "Hier liegt nichts außer Dreck.",
  "log.abgelehnt.nichts_zu_trinken": "Nichts zu trinken. Eine Tragödie.",
  "log.abgelehnt.nicht_trinkbar": "Das ist nicht trinkbar, so verzweifelt ist sie noch nicht.",
  "log.abgelehnt.ungueltig": "Das geht so nicht.",
  "log.abgelehnt.unbekannt": "Unbekannter Befehl.",

  // Schadensarten (Platzhalter {art} im Log)
  "schaden.stumpf": "stumpf",
  "schaden.schnitt": "Schnitt",
  "schaden.saeure": "Säure",
  "schaden.lauge": "Lauge",
  "schaden.feuer": "Feuer",
  "schaden.elektrisch": "Strom",
  "schaden.alkohol": "Alkohol",
  "schaden.gift": "Gift",
  "schaden.psi": "Psi",
  "schaden.magie": "Magie",

  // Reise per Maus (nur Anzeige, keine Spielereignisse); "angekommen" und "abgebrochen" bleiben stumm
  "reise.kein_weg": "Dorthin kennt Ninkasi keinen Weg.",
  "reise.feinde_in_sicht": "Mit Feinden in Sicht wird nicht spaziert.",
  "reise.gegner_in_sicht": "Etwas regt sich. Ninkasi bleibt stehen.",
  "reise.schaden": "Autsch. Schluss mit dem Ausflug.",
  "reise.versperrt": "Da steht jemand im Weg.",

  // Oberfläche
  "ui.lp": "LP",
  "ui.mp": "MP",
  "ui.pp": "PP",
  "ui.pegel": "Pegel",
  "ui.promille": "Promille",
  "ui.gepaeck": "Gepäck",
  "ui.leer": "nichts",
  "ui.in_sicht": "In Sicht",
  "ui.niemand": "niemand",
  "ui.startwert": "Startwert",
  "ui.zeit": "Zeit",
  "ui.version": "Version",
  "ui.tasten": "Ziffernblock: bewegen, 5: warten, G: aufheben, T: trinken, +/-: Zoom, Tab: Log. Maus: Klick reist, greift an oder hebt auf, Rad zoomt, jede Taste hält an.",
  "ui.datenfehler": "Fehler in den Daten",
};
