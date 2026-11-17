// Deutsche Grammatikregeln als Daten: Artikel nach Art, Geschlecht und Fall.
// Hauptwörter in texte.js geben Geschlecht und ihre Formen je Fall an, die Artikel kommen von hier.
// Später: Mehrzahl ("p"), Adjektivendungen für Affixe.
export default {
  faelle: ["nom", "gen", "dat", "akk"],
  geschlechter: ["m", "f", "n"],
  artikel: {
    bestimmt: {
      m: { nom: "der", gen: "des", dat: "dem", akk: "den" },
      f: { nom: "die", gen: "der", dat: "der", akk: "die" },
      n: { nom: "das", gen: "des", dat: "dem", akk: "das" },
    },
    ein: {
      m: { nom: "ein", gen: "eines", dat: "einem", akk: "einen" },
      f: { nom: "eine", gen: "einer", dat: "einer", akk: "eine" },
      n: { nom: "ein", gen: "eines", dat: "einem", akk: "ein" },
    },
  },
};
