// Englische Texte. Schlüssel -> Text; Wesen und Gegenstände sind Hauptwörter { einzahl, mehrzahl, eigenname?,
// adjektive?, artikel? }, Adjektive { adjektiv, artikel? }; die Artikel kommen aus grammatik.js. Dieselben Schlüssel und
// Platzhalter wie sprache/de/texte.js, frei nachgeschrieben statt Satz für Satz übersetzt (siehe docs/Texte.md).
// Fehlende Schlüssel fallen auf das Deutsche zurück (src/anzeige/texte.js), bis jeder Text in beiden Sprachen steht
// (docs/Systemausbau.md, Punkt 9).
export default {
  // Wesen und Gegenstände
  "wesen.ninkasi": { eigenname: true, einzahl: "Ninkasi" },
  // Einstellungen
  "sprache.code": "en",
  "einstellung.sprache": "Language",
  "einstellung.sprache.erklaerung": "Language of the game's texts. Automatic follows your browser. Changing it reloads the page; a run in progress stays saved.",
  "einstellung.sprache.wert.browser": "Automatic",
  "einstellung.sprache.wert.de": "Deutsch",
  "einstellung.sprache.wert.en": "English",
};
