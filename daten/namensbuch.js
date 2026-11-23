// Namensbuch (siehe docs/Architektur.md, Inhalte als Daten): alle Namen je Art, fest oder vorläufig.
// Feste Namen ändern sich nur mit einem Eintrag in daten/umbenennungen.js, vorläufige (Testinhalte) frei.
// Nachgeführt von node werkzeuge/namensbuch.js; fest wird ein Name von Hand, indem er von vorlaeufig nach fest wandert.
// Kein Teil der Spieldaten (nicht in daten/index.js), ändert also die Prüfsumme der Daten nicht.

export default {
  wesen: {
    fest: ["ninkasi"],
    vorlaeufig: ["essigbakterium", "fernkaempfer_test"],
  },
  gegenstaende: {
    fest: [],
    vorlaeufig: ["bier", "sauerbier", "bierfass", "leere_flasche", "leeres_fass", "brandflasche", "schoepfkelle", "fasshammer", "lederschuerze", "kupferhelm", "lederhose", "hopfenkette", "kupferring", "lederfetzen", "kupferschrott"],
  },
  eigenschaften: {
    fest: ["koerperlichkeit", "trinkfestigkeit", "gewandtheit", "sinnlichkeit", "klugheit", "braukunde"],
    vorlaeufig: [],
  },
  skills: {
    fest: [],
    vorlaeufig: ["zaehigkeit_grund", "zaehigkeit_experte", "nahkampf_grund", "ausweichen_grund"],
  },
  faehigkeiten: {
    fest: [],
    vorlaeufig: ["testfaehigkeit", "saeurespucke", "saeureschwall"],
  },
  zustaende: {
    fest: [],
    vorlaeufig: ["testzustand"],
  },
  fallen: {
    fest: [],
    vorlaeufig: ["saeureduese", "klappergeschirr"],
  },
};
