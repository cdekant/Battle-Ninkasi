// Gelände. kennung: ein Zeichen, so steht das Feld in zustand.ebene.felder (nicht die Anzeige).
// laermdaempfung: Kosten, die Lärm beim Durchdringen zahlt (src/systeme/wahrnehmung.js); passierbare Felder kosten 1.
// Bewegungsarten (src/welt/karte.js): passierbar für alle, passierbarFuer: [Arten] für einzelne, undurchdringlich: true
// auch nicht phasend; beimFestsitzen: Effekt auf ein Wesen, das darin steht, ohne es betreten zu können
// (Vorgabe regeln.bewegung.beimFestsitzen, src/systeme/verschieben.js).
// Veränderliches Gelände (src/systeme/gelaende.js): tuer: { offen } bzw. { zu } für Türen, zerstoerbar: { wird },
// beimBenutzen: Effekt (Hebel), geschossdurchlaessig: abweichend von durchsichtig (Gitter).
export default {
  wand: { kennung: "#", passierbar: false, durchsichtig: false, laermdaempfung: 8 }, // Kosten für Lärm, ohne Angabe undurchlässig
  boden: { kennung: ".", passierbar: true, durchsichtig: true },
  // geht beim Hindurchgehen auf und von selbst wieder zu; zu versperrt sie Sicht und dämpft Lärm
  tuer_zu: { kennung: "+", passierbar: false, durchsichtig: false, laermdaempfung: 3, tuer: { offen: "tuer_offen" }, zerstoerbar: { wird: "boden" } },
  tuer_offen: { kennung: "'", passierbar: true, durchsichtig: true, tuer: { zu: "tuer_zu" }, zerstoerbar: { wird: "boden" } },
};
