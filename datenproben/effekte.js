// Effekte des Probeinhalts aus Grundbausteinen (src/kern/bausteine.js); die des Grundgerüsts in daten/effekte.js.
export default {
  // Säure frisst an angelegter Rüstung (Baustein abnutzen, src/systeme/verschleiss.js)
  biss_klein: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "2W3" }, { baustein: "abnutzen", art: "saeure", menge: 1 }],
  },
  biss_mittel: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W6+2" }, { baustein: "abnutzen", art: "saeure", menge: 1 }],
  },
  // Normwesen (datenproben/gegner.js): mittlerer Schaden 4, 5,5, 8, 11 und 16,5 gegen 100 LP
  normschlag_1: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W3" }] },
  normschlag_2: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W6+2" }] },
  normschlag_3: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6+1" }] },
  // Angriff der Psi-Jägerin, Stärke 3 mit Psi statt stumpf; Gedankenstich Ninkasis, eine Psi-Fähigkeit nach der Norm
  gedankenpeitsche: { schritte: [{ baustein: "schaden", art: "psi", wuerfel: "2W6+1" }] },
  gedankenstich: { schritte: [{ baustein: "schaden", art: "psi", wuerfel: "2W6" }] },
  normschlag_4: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W8+2" }] },
  normschlag_5: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "3W8+3" }] },
  // Vorläufige Fähigkeit Ninkasis (daten/faehigkeiten.js)
  testfaehigkeit: {
    schritte: [{ baustein: "trefferwurf", genauigkeit: 70, effekt: "testfaehigkeit_treffer" }],
  },
  testfaehigkeit_treffer: {
    schritte: [{ baustein: "schaden", art: "magie", wuerfel: "1W6+1" }, { baustein: "zustand_setzen", zustand: "testzustand" }],
  },
  // Fähigkeiten des Testgegners fernkaempfer_test (daten/faehigkeiten.js); vorläufig
  saeurespritzer: {
    schritte: [{ baustein: "trefferwurf", genauigkeit: 70, effekt: "saeurespritzer_treffer" }],
  },
  saeurespritzer_treffer: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "1W4+1" }, { baustein: "abnutzen", art: "saeure", menge: 1 }],
  },
  saeureschwall: {
    schritte: [{ baustein: "schaden", art: "saeure", wuerfel: "2W4" }, { baustein: "abnutzen", art: "saeure", menge: 2 }],
  },
  // Waffen (daten/ausruestung.js); vorläufig
  kellenschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "1W8+2" }],
  },
  // ein Viertel der Treffer betäubt (src/systeme/betaeubung.js)
  hammerschlag: {
    schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "2W6+3" }, { baustein: "zufall", chance: 25, effekt: "betaeubender_schlag" }],
  },
  betaeubender_schlag: {
    schritte: [{ baustein: "betaeuben", dauer: 100, zustand: "betaeubt" }],
  },
  // Prüfwaffen für die Arena (datenproben/ausruestung.js, docs/Entwicklung.md, Messwerte); vorläufig
  dolchstich: { schritte: [{ baustein: "schaden", art: "schnitt", wuerfel: "1W6+4" }] },
  pruefschwert_hieb: { schritte: [{ baustein: "schaden", art: "schnitt", wuerfel: "1W6+15" }] },
  pruefspeer_stoss: { schritte: [{ baustein: "schaden", art: "schnitt", wuerfel: "1W8+11" }] },
  pruefzweihaender_schlag: { schritte: [{ baustein: "schaden", art: "stumpf", wuerfel: "3W6+18" }] },
  // Wurfwaffen (datenproben/wurfgegenstaende.js): der Schaden beim Treffer, den Trefferwurf macht das Werfen
  wurfmesser_treffer: { schritte: [{ baustein: "schaden", art: "schnitt", wuerfel: "1W6+2" }] },
  wurfspeer_treffer: { schritte: [{ baustein: "schaden", art: "schnitt", wuerfel: "2W6+3" }] },
  // Sprint (datenproben/faehigkeiten.js): der Zustand macht das Bewegen schneller
  sprint: {
    schritte: [{ baustein: "zustand_setzen", zustand: "sprint" }],
  },
  // Fallen (daten/fallen.js); vorläufig
  saeureduese: {
    schritte: [
      { baustein: "schaden", art: "saeure", wuerfel: "2W4" },
      { baustein: "abnutzen", art: "saeure", menge: 2 },
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
  brandflasche_zerspringt: {
    schritte: [
      { baustein: "oberflaeche_setzen", art: "brand", menge: 4, muster: { art: "kreis", radius: 1 } },
      { baustein: "entzuenden", muster: { art: "kreis", radius: 1 } },
    ],
  },
  // Rückschlag einer Psi-Fähigkeit auf die Wirkende (daten/risiken.js); vorläufig
  psi_rueckschlag: {
    schritte: [{ baustein: "schaden", art: "psi", wuerfel: "1W6" }],
  },
  // Kontrollverlust einer Psi-Fähigkeit: Rückschlag und für eine Weile verwirrt; vorläufig
  psi_kontrollverlust: {
    schritte: [{ baustein: "schaden", art: "psi", wuerfel: "1W6" }, { baustein: "zustand_setzen", zustand: "verwirrt", dauer: 300 }],
  },
  riechwasser_trinken: {
    schritte: [{ baustein: "zustand_setzen", zustand: "witterung" }],
  },
  sauerbier_trinken: {
    schritte: [
      { baustein: "heilen", wertName: "lp", menge: 5 },
      { baustein: "wert_aendern", wertName: "pegel", menge: 30 },
    ],
  },
  bier_trinken: {
    schritte: [
      { baustein: "heilen", wertName: "lp", menge: 20 },
      { baustein: "wert_aendern", wertName: "pegel", menge: 50 }, // etwa 0,5 ‰
    ],
  },
};
