// Namensbuch (siehe docs/Architektur.md, Inhalte als Daten): alle Namen je Art, fest oder vorläufig.
// Feste Namen ändern sich nur mit einem Eintrag in daten/umbenennungen.js, vorläufige (Testinhalte) frei.
// Nachgeführt von node werkzeuge/namensbuch.js; fest wird ein Name von Hand, indem er von vorlaeufig nach fest wandert.
// Kein Teil der Spieldaten (nicht in daten/index.js), ändert also die Prüfsumme der Daten nicht.

export default {
  wesen: {
    fest: ["ninkasi"],
    vorlaeufig: [],
  },
  gegenstaende: {
    fest: [],
    vorlaeufig: ["sud", "sud_verdorben", "essig"],
  },
  eigenschaften: {
    fest: ["koerperlichkeit", "trinkfestigkeit", "gewandtheit", "sinnlichkeit", "klugheit", "braukunde"],
    vorlaeufig: [],
  },
  skills: {
    fest: [],
    vorlaeufig: [],
  },
  faehigkeiten: {
    fest: [],
    vorlaeufig: [],
  },
  zustaende: {
    fest: [],
    vorlaeufig: ["filmriss", "gestaerkt"],
  },
  fallen: {
    fest: [],
    vorlaeufig: [],
  },
  zielgebiete: {
    fest: [],
    vorlaeufig: [],
  },
  kulturen: {
    fest: [],
    vorlaeufig: [],
  },
};
