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
  // ein gebrauter Sud: die Wirkung folgt aus seinem Profil (Baustein sud_wirken, src/systeme/brauen.js)
  sud_trinken: {
    schritte: [{ baustein: "sud_wirken" }],
  },
  // ein Absud (src/systeme/absud.js): getrunken auf die Trinkende, geworfen auf alle Wesen um den Aufschlag
  absud_trinken: {
    schritte: [{ baustein: "absud_wirken" }],
  },
  absud_zerspringt: {
    schritte: [{ baustein: "fuer_jedes_ziel", muster: { art: "kreis", radius: 1 }, effekt: "absud_trinken" }],
  },
  // die trübe Brühe eines misslungenen Absuds (daten/sude.js): eine milde Krankheit
  bruehe_trinken: {
    schritte: [{ baustein: "zustand_setzen", zustand: "unwohl" }],
  },
  bruehe_zerspringt: {
    schritte: [{ baustein: "fuer_jedes_ziel", muster: { art: "kreis", radius: 1 }, effekt: "bruehe_trinken" }],
  },
  // je Welttick des Zustands gestaerkt (daten/zustaende.js)
  gestaerkt_heilen: {
    schritte: [{ baustein: "heilen", wertName: "lp", menge: 1, mitStaerke: true }],
  },
  filmriss: {
    schritte: [{ baustein: "vergessen" }, { baustein: "zustand_setzen", zustand: "filmriss" }],
  },
};
