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
  // Filmriss im Vollrausch (src/systeme/stoffwechsel.js): die Karte der Ebene ist vergessen bis auf das Sichtbare, dann
  // eine Weile ohne eigenes Handeln (Zustand filmriss in daten/zustaende.js)
  filmriss: {
    schritte: [{ baustein: "vergessen" }, { baustein: "zustand_setzen", zustand: "filmriss" }],
  },
};
