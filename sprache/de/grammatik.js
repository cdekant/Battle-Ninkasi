// Deutsche Grammatikregeln als Daten (siehe docs/Texte.md, Grammatik): Artikel und Adjektivendungen nach Art,
// Geschlecht oder Mehrzahl ("p") und Fall. Hauptwörter und Adjektive in texte.js geben ihre Formen an, die Artikel
// und Endungen kommen von hier, den Code liefert src/anzeige/grammatik.js (Verfahren "faelle").
export default {
  verfahren: "faelle",
  faelle: ["nom", "gen", "dat", "akk"],
  geschlechter: ["m", "f", "n"],
  artikel: {
    bestimmt: {
      m: { nom: "der", gen: "des", dat: "dem", akk: "den" },
      f: { nom: "die", gen: "der", dat: "der", akk: "die" },
      n: { nom: "das", gen: "des", dat: "dem", akk: "das" },
      p: { nom: "die", gen: "der", dat: "den", akk: "die" },
    },
    // in der Mehrzahl steht statt des unbestimmten Artikels die Zahl
    ein: {
      m: { nom: "ein", gen: "eines", dat: "einem", akk: "einen" },
      f: { nom: "eine", gen: "einer", dat: "einer", akk: "eine" },
      n: { nom: "ein", gen: "eines", dat: "einem", akk: "ein" },
    },
  },
  // Beugung der Adjektive nach der Art des Artikels davor; die Zahl in der Mehrzahl zählt wie kein Artikel
  deklination: { bestimmt: "schwach", ein: "gemischt", ohne: "stark", zahl: "stark" },
  adjektivendungen: {
    schwach: {
      m: { nom: "e", gen: "en", dat: "en", akk: "en" },
      f: { nom: "e", gen: "en", dat: "en", akk: "e" },
      n: { nom: "e", gen: "en", dat: "en", akk: "e" },
      p: { nom: "en", gen: "en", dat: "en", akk: "en" },
    },
    gemischt: {
      m: { nom: "er", gen: "en", dat: "en", akk: "en" },
      f: { nom: "e", gen: "en", dat: "en", akk: "e" },
      n: { nom: "es", gen: "en", dat: "en", akk: "es" },
    },
    stark: {
      m: { nom: "er", gen: "en", dat: "em", akk: "en" },
      f: { nom: "e", gen: "er", dat: "er", akk: "e" },
      n: { nom: "es", gen: "en", dat: "em", akk: "es" },
      p: { nom: "e", gen: "er", dat: "en", akk: "e" },
    },
  },
};
