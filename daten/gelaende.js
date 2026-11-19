// Gelände. kennung: ein Zeichen, so steht das Feld in zustand.ebene.felder (nicht die Anzeige).
// laermdaempfung: Kosten, die Lärm beim Durchdringen zahlt (src/systeme/wahrnehmung.js); passierbare Felder kosten 1.
export default {
  wand: { kennung: "#", passierbar: false, durchsichtig: false, laermdaempfung: 8 }, // Kosten für Lärm, ohne Angabe undurchlässig
  boden: { kennung: ".", passierbar: true, durchsichtig: true },
};
