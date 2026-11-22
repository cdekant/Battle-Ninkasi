// Fraktionen (siehe src/systeme/fraktionen.js). beziehungen nennen nur Abweichungen von regeln.fraktionen.beziehungVorgabe;
// eine Beziehung gilt in beide Richtungen, bei Widerspruch gewinnt die strengere.
// Werte: "feind" | "neutral" | "verbuendet"
export default {
  ninkasi: { text: "fraktion.ninkasi" },
  verderber: { text: "fraktion.verderber", rufFest: true }, // Bakterien, die das Bier verderben; lassen sich nicht umstimmen (vorläufig)
};
