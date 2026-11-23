// Englische Grammatikregeln als Daten (siehe docs/Texte.md, Grammatik): ein Artikel, a oder an nach dem Anfang des
// ersten Worts, ohne Fälle. Den Code liefert src/anzeige/grammatik.js (Verfahren "englisch").
// Ausnahmen gelten für Wortanfänge, klein geschrieben; ein Hauptwort oder Adjektiv kann mit artikel: "a" | "an"
// ausdrücklich wählen.
export default {
  verfahren: "englisch",
  bestimmt: "the",
  vokale: "aeiou",
  // beginnt mit einem Vokal, klingt aber nach einem Mitlaut: a unicorn, a European, a one-eyed rat
  ausnahmenA: ["uni", "use", "usu", "uti", "eu", "one", "once", "ewe"],
  // beginnt mit einem Mitlaut, klingt aber nach einem Vokal: an hour, an honest brewer, an heir
  ausnahmenAn: ["hour", "honest", "honor", "honour", "heir"],
};
