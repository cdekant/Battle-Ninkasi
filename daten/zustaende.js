// Zustände: zeitlich begrenzte Wirkungen an einer Entität (Aufbau siehe src/systeme/zustaende.js).
// Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
// Zustände im Spielinhalt folgen, wenn der Systemausbau abgeschlossen ist; bis dahin nur der vorläufige testzustand.
export default {
  // Vorläufig: setzt die Testfähigkeit Ninkasis (daten/effekte.js), damit die Anzeige der Zustände etwas zeigt
  testzustand: { text: "zustand.testzustand", dauer: 500, modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -2 }] },
};
