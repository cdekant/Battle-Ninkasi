// Zusammengesetzte Effekte aus Grundbausteinen (src/kern/bausteine.js)
export default {
  faustschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W6+2" }],
  },
  biss_klein: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W4" }],
  },
  // Rückschlag einer Psi-Fähigkeit auf die Wirkende (daten/risiken.js); vorläufig
  psi_rueckschlag: {
    schritte: [{ baustein: "schaden", art: "psi", wuerfel: "1W6" }],
  },
  bier_trinken: {
    schritte: [
      { baustein: "heilen", wertName: "lp", menge: 20 },
      { baustein: "wert_aendern", wertName: "pegel", menge: 50 }, // etwa 0,5 ‰
    ],
  },
};
