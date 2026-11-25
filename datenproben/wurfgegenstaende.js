// Gegenstände zum Werfen (Werfen siehe src/systeme/werfen.js; zweck an wurf für die KI: src/ki/nutzen.js); Zahlen vorläufig.
export default {
  // zerspringt zu einer Lache Hochprozentigem und setzt sie in Brand
  brandflasche: {
    text: "gegenstand.brandflasche",
    aufhebbar: true, stapelbar: true, gewicht: 900,
    wurf: { effekt: "brandflasche_zerspringt", zweck: ["angriff"] },
  },
  // Wurfwaffen (Vorbild Brogue): Trefferwurf nach wurf.genauigkeit; danach landen sie (nach einem Treffer unter dem
  // Ziel) oder zerbrechen nach bruchchance; das Wurfmesser macht etwa drei Viertel des Dolchs je Treffer
  wurfmesser: {
    text: "gegenstand.wurfmesser",
    aufhebbar: true, stapelbar: true, gewicht: 300,
    wurf: { effekt: "wurfmesser_treffer", genauigkeit: 80, reichweite: 5, kosten: 70, bruchchance: 10, zweck: ["angriff"] },
  },
  wurfspeer: {
    text: "gegenstand.wurfspeer",
    aufhebbar: true, stapelbar: true, gewicht: 1500,
    wurf: { effekt: "wurfspeer_treffer", genauigkeit: 75, reichweite: 4, kosten: 100, bruchchance: 20, zweck: ["angriff"] },
  },
};
