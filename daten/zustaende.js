// Zustände des Grundgerüsts (Aufbau siehe src/systeme/zustaende.js); was nur der Probeinhalt braucht, steht in
// datenproben/zustaende.js. Alle Zahlen vorläufig.
export default {
  // Filmriss (daten/effekte.js): die KI wartet für Ninkasi ab, die Anzeige lässt die Zeit sichtbar vergehen
  // (Einstellung gefuehrteZuegeBestaetigen); 5000 Zeiteinheiten, etwa 40 Züge Ninkasis
  filmriss: { text: "zustand.filmriss", dauer: 5000, ki: { modul: "abwarten" } },
};
