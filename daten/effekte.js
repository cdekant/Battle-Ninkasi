// Zusammengesetzte Effekte aus Grundbausteinen (src/kern/bausteine.js)
export default {
  faustschlag: {
    schritte: [{ baustein: "schaden", wuerfel: "1W6+2" }],
  },
  biss_klein: {
    schritte: [{ baustein: "schaden", wuerfel: "1W4" }],
  },
  bier_trinken: {
    schritte: [
      { baustein: "heilen", wertName: "lp", menge: 20 },
      { baustein: "wert_aendern", wertName: "pp", menge: 20 },
    ],
  },
};
