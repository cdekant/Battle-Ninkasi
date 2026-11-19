// Getränke und ihre Behälter (Stapel, Ladungen, wirdZu, gewicht in Gramm: src/systeme/inventar.js); Zahlen vorläufig
export default {
  // eine Halbe; die Flasche bleibt
  bier: {
    text: "gegenstand.bier", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "bier_trinken" }, wirdZu: "leere_flasche",
  },
  // 10 Liter in 20 Schlucken zu einer Halben, 2 kg Holz: voll 12 kg
  bierfass: {
    text: "gegenstand.bierfass", aufhebbar: true, gewicht: 2000, ladungen: { hoechstens: 20, gewichtJe: 500 },
    trinkbar: { effekt: "bier_trinken" }, wirdZu: "leeres_fass",
  },
  // Behälter, später für das Brauen; bis dahin Ballast oder etwas zum Werfen
  leere_flasche: { text: "gegenstand.leere_flasche", aufhebbar: true, stapelbar: true, gewicht: 400 },
  leeres_fass: { text: "gegenstand.leeres_fass", aufhebbar: true, gewicht: 2000 },
};
