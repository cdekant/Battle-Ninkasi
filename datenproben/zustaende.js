// Zustände: zeitlich begrenzte Wirkungen an einer Entität (Aufbau siehe src/systeme/zustaende.js).
// Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
// Probeinhalt: nur der vorläufige testzustand; Zustände des echten Inhalts folgen mit ihm (docs/Systemausbau.md, Punkt 14).
export default {
  // Vorläufig: setzt die Testfähigkeit Ninkasis (daten/effekte.js), damit die Anzeige der Zustände etwas zeigt
  testzustand: { text: "zustand.testzustand", dauer: 500, modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -2 }] },
  // Vorläufig: Spüren ohne Licht für eine Weile (src/systeme/sinne.js), aus dem Riechwasser
  witterung: { text: "zustand.witterung", dauer: 20000, modifikatoren: [{ ziel: "reichweiteSpueren", art: "plus", betrag: 5 }] },
};
