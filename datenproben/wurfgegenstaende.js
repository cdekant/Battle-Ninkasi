// Gegenstände zum Werfen (Werfen siehe src/systeme/werfen.js; zweck an wurf für die KI: src/ki/nutzen.js); Zahlen vorläufig.
export default {
  // zerspringt zu einer Lache Hochprozentigem und setzt sie in Brand
  brandflasche: {
    text: "gegenstand.brandflasche",
    aufhebbar: true, stapelbar: true, gewicht: 900,
    wurf: { effekt: "brandflasche_zerspringt", zweck: ["angriff"] },
  },
  // Wurfwaffen der Arena wurfwaffen (datenproben/arenen.js): treffen mit Trefferwurf und bleiben liegen (wurf.bleibt)
  wurfmesser: {
    text: "gegenstand.wurfmesser",
    aufhebbar: true, stapelbar: true, gewicht: 300,
    wurf: { effekt: "wurfmesser_flug", reichweite: 5, bleibt: true, zweck: ["angriff"] },
  },
  wurfspeer: {
    text: "gegenstand.wurfspeer",
    aufhebbar: true, stapelbar: true, gewicht: 1500,
    wurf: { effekt: "wurfspeer_flug", reichweite: 4, bleibt: true, zweck: ["angriff"] },
  },
};
