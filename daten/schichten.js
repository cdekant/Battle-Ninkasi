// Arten der Feldschichten (Aufbau siehe src/systeme/schichten.js); Feuer in daten/regeln.js (feuer). Zahlen vorläufig.
// Grundgerüst: nur, was die Regeln selbst brauchen; weitere Arten bringt der Inhalt mit (Probeinhalt in datenproben/schichten.js).
export default {
  oberflaechen: {},
  gase: {
    // aus Feuer (regeln.feuer.rauch); dicht versperrt er die Sicht
    rauch: { text: "gas.rauch", abbau: 15, undurchsichtigAb: 40, stufen: [{ ab: 60, effekt: "rauch_husten" }] },
  },
};
