// Fähigkeiten: Magie, Psi, Fernkampf und körpereigene Aktionen (Aufbau siehe src/systeme/faehigkeiten.js).
// Fähigkeiten für Ninkasi folgen, wenn der Systemausbau abgeschlossen ist; bis dahin kennt sie testfaehigkeit, damit
// sich der Zielmodus im Browser ausprobieren lässt, sprint und gedankenstich. Saeurespucke und Saeureschwall gehören dem Testgegner
// fernkaempfer_test (daten/gegner.js). zweck: wozu die KI sie mit der Handlung nutzen wählt (src/ki/nutzen.js).
// Alle Zahlen vorläufig.
export default {
  // Vorläufig für Ninkasi: Fläche auf ein Feld in Sicht, Trefferwurf je Wesen, sie selbst bleibt verschont
  testfaehigkeit: {
    text: "faehigkeit.testfaehigkeit", zweck: ["angriff"], tags: ["magie"], verbrauch: { mp: 10 }, abklingzeit: 300, risiko: "magie",
    ziel: { art: "feld", reichweite: 6, muster: { art: "kreis", radius: 1 }, trifft: "wesen", ohneUrheber: true }, wirkung: "testfaehigkeit",
  },
  // Vorläufig für Ninkasi: Sprint ohne Zeit (siehe docs/Grundlagen.md, Zeit und Tempo), angeboren mit dem Inhalt
  sprint: {
    text: "faehigkeit.sprint", tags: ["koerper"], ohneZeit: true, abklingzeit: 3000, ziel: { art: "selbst" }, wirkung: "sprint",
  },
  // Vorläufig für Ninkasi: eine Psi-Fähigkeit nach der Norm (10 PP), damit der Glimmer steigt (src/systeme/glimmer.js)
  gedankenstich: {
    text: "faehigkeit.gedankenstich", zweck: ["angriff"], tags: ["psi"], verbrauch: { pp: 10 }, abklingzeit: 300, risiko: "psi",
    ziel: { art: "wesen", reichweite: 6 }, wirkung: "gedankenstich",
  },
  // Geschoss über Verbündete hinweg, mit Trefferwurf
  saeurespucke: {
    text: "faehigkeit.saeurespucke", tags: ["koerper"], zweck: ["angriff"], abklingzeit: 400,
    ziel: { art: "geschoss", reichweite: 6, trifft: "wesen", ueberVerbuendete: true }, wirkung: "saeurespritzer",
  },
  // Angekündigter Angriff auf das Feld, auf dem das Ziel beim Beginn stand; Schaden an der Wirkenden bricht ab.
  // Der erste Schritt läuft sofort, drei Schritte lassen dem Ziel also zwei Züge, um aus dem Kreis zu kommen
  saeureschwall: {
    text: "faehigkeit.saeureschwall", tags: ["koerper"], zweck: ["angriff"], abklingzeit: 900,
    dauer: { schritte: 3 }, ankuendigung: "faehigkeit.saeureschwall.ankuendigung", unterbrechbar: true,
    ziel: { art: "feld", reichweite: 5, muster: { art: "kreis", radius: 1 }, trifft: "wesen" }, wirkung: "saeureschwall",
  },
};
