// Getränke und ihre Behälter (Stapel, Ladungen, wirdZu, gewicht in Gramm: src/systeme/inventar.js); Zahlen vorläufig
// zweck an trinkbar: wozu Wesen mit KI es trinken (src/ki/nutzen.js, Zwecke in daten/regeln.js)
// Verderben (verdirbt: { nach, wird }, src/systeme/verschleiss.js): 50000 Zeiteinheiten sind 500 Weltticks
export default {
  // eine Halbe; die Flasche bleibt; mit der Zeit wird sie sauer
  bier: {
    text: "gegenstand.bier", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "bier_trinken", zweck: ["heilen"] }, wirdZu: "leere_flasche", verdirbt: { nach: 50000, wird: "sauerbier" },
  },
  // verdorbenes Bier, schon halb Essig: trinkbar, aber kein Vergnügen
  sauerbier: {
    text: "gegenstand.sauerbier", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "sauerbier_trinken" }, wirdZu: "leere_flasche",
  },
  // 10 Liter in 20 Schlucken zu einer Halben, 2 kg Holz: voll 12 kg
  bierfass: {
    text: "gegenstand.bierfass", aufhebbar: true, gewicht: 2000, ladungen: { hoechstens: 20, gewichtJe: 500 },
    trinkbar: { effekt: "bier_trinken", zweck: ["heilen"] }, wirdZu: "leeres_fass",
  },
  // Behälter, später für das Brauen; bis dahin Ballast oder etwas zum Werfen
  leere_flasche: { text: "gegenstand.leere_flasche", aufhebbar: true, stapelbar: true, gewicht: 400 },
  leeres_fass: { text: "gegenstand.leeres_fass", aufhebbar: true, gewicht: 2000 },
};
