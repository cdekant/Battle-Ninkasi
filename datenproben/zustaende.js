// Zustände: zeitlich begrenzte Wirkungen an einer Entität (Aufbau siehe src/systeme/zustaende.js).
// Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
// Probeinhalt: nur vorläufige Zustände; Zustände des echten Inhalts folgen mit ihm (docs/Systemausbau.md, Punkt 14).
export default {
  // Vorläufig: setzt die Testfähigkeit Ninkasis (daten/effekte.js), damit die Anzeige der Zustände etwas zeigt
  testzustand: { text: "zustand.testzustand", dauer: 500, modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -2 }] },
  // Vorläufig: Spüren ohne Licht für eine Weile (src/systeme/sinne.js), aus dem Riechwasser
  witterung: { text: "zustand.witterung", dauer: 20000, modifikatoren: [{ ziel: "reichweiteSpueren", art: "plus", betrag: 5 }] },
  // Vorläufig: Affix mit Adjektiv (ein gereiztes Essigbakterium), aus der Arena essigbakterien, Variante gereizt
  // Vorläufig: Sprint (datenproben/faehigkeiten.js), Bewegen in der halben Zeit, der Pegel sinkt doppelt so schnell
  sprint: { text: "zustand.sprint", dauer: 750, modifikatoren: [{ ziel: "kosten.bewegen", art: "prozent", betrag: -50 }, { ziel: "abbau.pegel", art: "prozent", betrag: 100 }] },
  // Vorläufig: Betäubung (src/systeme/betaeubung.js), die Dauer setzt der Baustein betaeuben; wehrlos bis zum nächsten Zug
  betaeubt: { text: "zustand.betaeubt", adjektiv: "adjektiv.betaeubt", tags: ["kontrolle", "wehrlos"] },
  // Vorläufig: Kontrollverlust der Psi (datenproben/risiken.js), Schritte weichen ab und treffen auch Verbündete
  verwirrt: { text: "zustand.verwirrt", adjektiv: "adjektiv.verwirrt", tags: ["kontrolle"], dauer: 300, befehl: { veraenderer: "abweichen", chance: 50, freundeAngreifen: true } },
  gereizt: { text: "zustand.gereizt", adjektiv: "adjektiv.gereizt", modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -1 }] },
};
