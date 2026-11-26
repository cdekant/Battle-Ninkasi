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
  // Absud (datenproben/absudrichtungen.js): Dauer und Stärke setzt der Absud; Beträge je Stärke 1
  feuerschutz: { text: "zustand.feuerschutz", modifikatoren: [{ ziel: "widerstand", tag: "feuer", art: "plus", betrag: 10 }, { ziel: "schaden", tag: "feuer", art: "prozent", betrag: 10 }] },
  feuerfest: { text: "zustand.feuerfest", modifikatoren: [{ ziel: "immunitaet", tag: "feuer", art: "plus", betrag: 1 }] },
  brennend: { text: "zustand.brennend", adjektiv: "adjektiv.brennend", jeTick: "absud_brennen", modifikatoren: [{ ziel: "widerstand", tag: "feuer", art: "plus", betrag: -10 }] },
  saeureschutz: { text: "zustand.saeureschutz", modifikatoren: [{ ziel: "widerstand", tag: "saeure", art: "plus", betrag: 10 }, { ziel: "schaden", tag: "saeure", art: "prozent", betrag: 10 }] },
  veraetzt: { text: "zustand.veraetzt", adjektiv: "adjektiv.veraetzt", jeTick: "absud_aetzen", modifikatoren: [{ ziel: "widerstand", tag: "saeure", art: "plus", betrag: -10 }] },
  hellsicht: { text: "zustand.hellsicht", modifikatoren: [{ ziel: "reichweiteSicht", art: "plus", betrag: 1 }, { ziel: "sichtImFinstern", art: "plus", betrag: 1 }] },
  trugbilder: { text: "zustand.trugbilder", adjektiv: "adjektiv.verwirrt", modifikatoren: [{ ziel: "genauigkeit", art: "plus", betrag: -5 }, { ziel: "reichweiteSicht", art: "plus", betrag: -1 }] },
  gereizt: { text: "zustand.gereizt", adjektiv: "adjektiv.gereizt", modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -1 }] },
  // Merkmale der Kulturen (src/systeme/kulturen.js) als Affixe der wilden Hefe: verändern das Wesen über modifikatoren
  // und seine Kultur über kulturmerkmal; vorläufig
  uebervergaerend: {
    text: "zustand.uebervergaerend", adjektiv: "adjektiv.uebervergaerend",
    modifikatoren: [{ ziel: "kosten.bewegen", art: "prozent", betrag: -40 }, { ziel: "lp", art: "plus", betrag: 4 }],
    kulturmerkmal: [{ art: "plus", feld: "vergaerung", wert: 20 }, { art: "plus", feld: "vertraegt", wert: 40 }],
  },
  sauer: {
    text: "zustand.sauer", adjektiv: "adjektiv.sauer",
    modifikatoren: [{ ziel: "schaden", art: "plus", betrag: 1 }],
    kulturmerkmal: [{ art: "aroma", achse: "saeure", wert: 25 }, { art: "plus", feld: "verderben", wert: 5 }],
  },
};
