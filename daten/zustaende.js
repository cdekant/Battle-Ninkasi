// Zustände des Grundgerüsts (Aufbau siehe src/systeme/zustaende.js); was nur der Probeinhalt braucht, steht in
// datenproben/zustaende.js. Alle Zahlen vorläufig.
export default {
  // Filmriss (daten/effekte.js): die KI wartet für Ninkasi ab, die Anzeige lässt die Zeit sichtbar vergehen
  // (Einstellung gefuehrteZuegeBestaetigen); 5000 Zeiteinheiten, etwa 40 Züge Ninkasis
  filmriss: { text: "zustand.filmriss", dauer: 5000, ki: { modul: "abwarten" } },
  // Süße eines Suds (regeln.brauen.wirkungen): je Welttick 1 LP, die Dauer setzt der Sud; jeder Schluck läuft für sich
  // milde Krankheit aus der trüben Brühe eines misslungenen Absuds (daten/sude.js)
  unwohl: { text: "zustand.unwohl", adjektiv: "adjektiv.unwohl", dauer: 2000, modifikatoren: [{ ziel: "genauigkeit", art: "plus", betrag: -5 }, { ziel: "ausweichen", art: "plus", betrag: -2 }] },
  gestaerkt: { text: "zustand.gestaerkt", stapel: "einzeln", hoechstStapel: 10, jeTick: "gestaerkt_heilen" },
};
