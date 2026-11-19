// Risikotabellen der Fähigkeiten (siehe src/systeme/faehigkeiten.js); alle Zahlen vorläufig.
// Je Ausgang: chance als Kurve [Pegel in Hundertstel Promille, Prozent], wirkt (ob die Fähigkeit trotzdem wirkt), effekt?
// Ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander; was übrig bleibt, geht gut.
export default {
  // Psi: nüchtern unzuverlässig, am sichersten um 1,5 ‰, darüber drohen Rückschläge
  psi: [
    { name: "fehlschlag", chance: [[0, 30], [150, 5], [400, 10], [800, 30]], wirkt: false },
    { name: "rueckschlag", chance: [[0, 0], [300, 0], [800, 20]], wirkt: false, effekt: "psi_rueckschlag" },
  ],
};
