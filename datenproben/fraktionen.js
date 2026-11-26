// Fraktionen des Probeinhalts (Aufbau wie in daten/fraktionen.js beschrieben).
export default {
  jaegerinnen: { text: "fraktion.jaegerinnen", rufFest: true }, // Psi-Jägerinnen (src/systeme/glimmer.js), vorläufig
  verderber: { text: "fraktion.verderber", rufFest: true },
  // Mikroorganismen, die Ninkasi ihre Kultur geben (src/systeme/kulturen.js): neutral, bis sie angegriffen werden
  // (Zorn) oder der Ruf zu tief sinkt; vorläufig
  mikroben: { text: "fraktion.mikroben", beziehungen: { ninkasi: "neutral", verderber: "neutral" } }, // Bakterien, die das Bier verderben; lassen sich nicht umstimmen (vorläufig)
};
