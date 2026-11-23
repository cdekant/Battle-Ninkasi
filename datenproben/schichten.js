// Arten der Feldschichten des Probeinhalts (Aufbau wie in daten/schichten.js beschrieben). Zahlen vorläufig.
export default {
  oberflaechen: {
    // aus der Säuredüse; verätzt, wer darin steht, und trocknet langsam ab
    saeure: { text: "oberflaeche.saeure", schwund: 1, hoechstens: 6, jeTick: "saeure_veraetzt", gefaehrlich: true },
    // Hochprozentiges aus der Brandflasche: brennt lichterloh, verdunstet sonst
    brand: { text: "oberflaeche.brand", schwund: 1, hoechstens: 6, brennbar: 100, brenndauer: 4, verbrenntZu: "asche" },
    asche: { text: "oberflaeche.asche", hoechstens: 1 },
  },
  gase: {
    // aus den Gärbottichen; sammelt sich hinter geschlossenen Türen, wer nicht anaerob lebt, wird benommen, dann erstickt er
    co2: {
      text: "gas.co2", abbau: 1, gefaehrlich: true,
      stufen: [
        { ab: 30, effekt: "co2_benommen", wenn: [{ bedingung: "ohne_tag", tag: "anaerob" }] },
        { ab: 70, effekt: "co2_ersticken", wenn: [{ bedingung: "ohne_tag", tag: "anaerob" }] },
      ],
    },
  },
};
