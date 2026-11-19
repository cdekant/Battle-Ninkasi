// Fähigkeiten: Magie, Psi, Fernkampf und körpereigene Aktionen (Aufbau siehe src/systeme/faehigkeiten.js).
// Fähigkeiten für Ninkasi folgen, wenn der Systemausbau abgeschlossen ist; die beiden hier gehören dem
// Testgegner fernkaempfer_test (daten/gegner.js), Zahlen vorläufig.
export default {
  // Geschoss über Verbündete hinweg, mit Trefferwurf
  saeurespucke: {
    text: "faehigkeit.saeurespucke", tags: ["koerper"], abklingzeit: 3,
    ziel: { art: "geschoss", reichweite: 6, trifft: "wesen", ueberVerbuendete: true }, wirkung: "saeurespritzer",
  },
  // Angekündigter Angriff auf das Feld, auf dem das Ziel beim Beginn stand; Schaden an der Wirkenden bricht ab.
  // Der erste Schritt läuft sofort, drei Schritte lassen dem Ziel also zwei Züge, um aus dem Kreis zu kommen
  saeureschwall: {
    text: "faehigkeit.saeureschwall", tags: ["koerper"], abklingzeit: 8,
    dauer: { schritte: 3 }, ankuendigung: "faehigkeit.saeureschwall.ankuendigung", unterbrechbar: true,
    ziel: { art: "feld", reichweite: 5, muster: { art: "kreis", radius: 1 }, trifft: "wesen" }, wirkung: "saeureschwall",
  },
};
