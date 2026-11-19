// Gegenstände zum Werfen (Werfen siehe src/systeme/werfen.js); Zahlen vorläufig.
export default {
  // zerspringt zu einer Lache Hochprozentigem und setzt sie in Brand
  brandflasche: {
    text: "gegenstand.brandflasche",
    aufhebbar: true, stapelbar: true, gewicht: 900,
    wurf: { effekt: "brandflasche_zerspringt" },
  },
};
