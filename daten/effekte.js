// Zusammengesetzte Effekte aus Grundbausteinen (src/kern/bausteine.js)
export default {
  faustschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W6+2" }],
  },
  biss_klein: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W4" }],
  },
  // Fähigkeiten des Testgegners fernkaempfer_test (daten/faehigkeiten.js); vorläufig
  saeurespritzer: {
    schritte: [{ baustein: "trefferwurf", genauigkeit: 70, effekt: "saeurespritzer_treffer" }],
  },
  saeurespritzer_treffer: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W4+1" }],
  },
  saeureschwall: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "2W4" }],
  },
  // Waffen (daten/ausruestung.js); vorläufig
  kellenschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W8+2" }],
  },
  hammerschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6+3" }],
  },
  // Fallen (daten/fallen.js); vorläufig
  saeureduese: {
    schritte: [
      { baustein: "schaden", art: "saeure", wuerfel: "2W4" },
      { baustein: "oberflaeche_setzen", art: "saeure", menge: 4, muster: { art: "kreis", radius: 1 } },
    ],
  },
  klappern: {
    schritte: [{ baustein: "laerm", lautstaerke: 14 }],
  },
  // Feldschichten (daten/schichten.js) und Feuer (regeln.feuer); vorläufig
  saeure_veraetzt: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W3" }],
  },
  co2_benommen: {
    schritte: [{ baustein: "schaden", art: "gift", menge: 1 }],
  },
  co2_ersticken: {
    schritte: [{ baustein: "schaden", art: "gift", wuerfel: "1W6" }],
  },
  rauch_husten: {
    schritte: [{ baustein: "schaden", art: "gift", menge: 1 }],
  },
  brennen: {
    schritte: [{ baustein: "schaden", art: "feuer", wuerfel: "1W6" }],
  },
  brandflasche_zerspringt: {
    schritte: [
      { baustein: "oberflaeche_setzen", art: "brand", menge: 4, muster: { art: "kreis", radius: 1 } },
      { baustein: "entzuenden", muster: { art: "kreis", radius: 1 } },
    ],
  },
  // Wer in Gelände festsitzt, das er nicht betreten kann (src/systeme/verschieben.js, regeln.bewegung); vorläufig
  eingeklemmt: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6" }],
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
