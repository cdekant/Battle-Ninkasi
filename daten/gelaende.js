// Gelände. kennung: ein Zeichen, so steht das Feld in zustand.ebene.felder (nicht die Anzeige).
// laermdaempfung: Kosten, die Lärm beim Durchdringen zahlt (src/systeme/wahrnehmung.js); passierbare Felder kosten 1.
// Bewegungsarten (src/welt/karte.js): passierbar für alle, passierbarFuer: [Arten] für einzelne, undurchdringlich: true
// auch nicht phasend; beimFestsitzen: Effekt auf ein Wesen, das darin steht, ohne es betreten zu können
// (Vorgabe regeln.bewegung.beimFestsitzen, src/systeme/verschieben.js).
// Veränderliches Gelände (src/systeme/gelaende.js): tuer: { offen } bzw. { zu } für Türen, zerstoerbar: { wird },
// beimBenutzen: Effekt (Hebel), geschossdurchlaessig: abweichend von durchsichtig (Gitter).
// Feldschichten (src/systeme/schichten.js): gasdurchlaessig (Vorgabe wie passierbar), quelle: { gas, menge } je Welttick,
// brennbar in Prozent, brenndauer, verbrenntZu: Gelände nach dem Feuer.
// text: Name für Untersuchen und Tooltip (sprache/de/texte.js, gelaende.<name>).
export default {
  wand: { text: "gelaende.wand", kennung: "#", passierbar: false, durchsichtig: false, laermdaempfung: 8 }, // Kosten für Lärm, ohne Angabe undurchlässig
  boden: { text: "gelaende.boden", kennung: ".", passierbar: true, durchsichtig: true },
  // geht beim Hindurchgehen auf und von selbst wieder zu; zu versperrt sie Sicht und dämpft Lärm
  tuer_zu: { text: "gelaende.tuer_zu", kennung: "+", passierbar: false, durchsichtig: false, laermdaempfung: 3, tuer: { offen: "tuer_offen" }, zerstoerbar: { wird: "boden" }, brennbar: 20, brenndauer: 6, verbrenntZu: "boden" },
  tuer_offen: { text: "gelaende.tuer_offen", kennung: "'", passierbar: true, durchsichtig: true, tuer: { zu: "tuer_zu" }, zerstoerbar: { wird: "boden" }, brennbar: 20, brenndauer: 6, verbrenntZu: "boden" },
  // Treppen zwischen den Tiefen (src/systeme/ebenen.js)
  treppe_ab: { text: "gelaende.treppe_ab", kennung: ">", passierbar: true, durchsichtig: true, treppe: "ab" },
  treppe_auf: { text: "gelaende.treppe_auf", kennung: "<", passierbar: true, durchsichtig: true, treppe: "auf" },
  // gärt vor sich hin: Quelle von CO2 auf den Nachbarfeldern, man kommt nicht hindurch, sieht aber darüber
  gaerbottich: { text: "gelaende.gaerbottich", kennung: "O", passierbar: false, durchsichtig: true, laermdaempfung: 4, quelle: { gas: "co2", menge: 6 } },
};
