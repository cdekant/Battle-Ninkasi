// Fähigkeiten: Magie, Psi, Fernkampf und körpereigene Aktionen (Aufbau siehe src/systeme/faehigkeiten.js).
// Fähigkeiten für Ninkasi folgen, wenn der Systemausbau abgeschlossen ist; bis dahin kennt sie nur testfaehigkeit,
// damit sich der Zielmodus im Browser ausprobieren lässt. Saeurespucke und Saeureschwall gehören dem Testgegner
// fernkaempfer_test (daten/gegner.js). zweck: wozu die KI sie mit der Handlung nutzen wählt (src/ki/nutzen.js).
// Alle Zahlen vorläufig.
export default {
  // Vorläufig für Ninkasi: Fläche auf ein Feld in Sicht, Trefferwurf je Wesen, sie selbst bleibt verschont
  testfaehigkeit: {
    text: "faehigkeit.testfaehigkeit", tags: ["magie"], verbrauch: { mp: 10 }, abklingzeit: 2,
    ziel: { art: "feld", reichweite: 6, muster: { art: "kreis", radius: 1 }, trifft: "wesen", ohneUrheber: true }, wirkung: "testfaehigkeit",
  },
  // Geschoss über Verbündete hinweg, mit Trefferwurf
  saeurespucke: {
    text: "faehigkeit.saeurespucke", tags: ["koerper"], zweck: ["angriff"], abklingzeit: 3,
    ziel: { art: "geschoss", reichweite: 6, trifft: "wesen", ueberVerbuendete: true }, wirkung: "saeurespritzer",
  },
  // Angekündigter Angriff auf das Feld, auf dem das Ziel beim Beginn stand; Schaden an der Wirkenden bricht ab.
  // Der erste Schritt läuft sofort, drei Schritte lassen dem Ziel also zwei Züge, um aus dem Kreis zu kommen
  saeureschwall: {
    text: "faehigkeit.saeureschwall", tags: ["koerper"], zweck: ["angriff"], abklingzeit: 8,
    dauer: { schritte: 3 }, ankuendigung: "faehigkeit.saeureschwall.ankuendigung", unterbrechbar: true,
    ziel: { art: "feld", reichweite: 5, muster: { art: "kreis", radius: 1 }, trifft: "wesen" }, wirkung: "saeureschwall",
  },
};
