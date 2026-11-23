// Zusammengesetzte Effekte aus Grundbausteinen (src/kern/bausteine.js)
export default {
  faustschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W6+2" }],
  },
  rauch_husten: {
    schritte: [{ baustein: "schaden", art: "gift", menge: 1 }],
  },
  brennen: {
    schritte: [{ baustein: "schaden", art: "feuer", wuerfel: "1W6" }],
  },
  // Wer in Gelände festsitzt, das er nicht betreten kann (src/systeme/verschieben.js, regeln.bewegung); vorläufig
  eingeklemmt: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6" }],
  },
};
