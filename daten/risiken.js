// Risikotabellen der Fähigkeiten (siehe src/systeme/faehigkeiten.js); alle Zahlen vorläufig.
// Je Ausgang: chance als Kurve [x, Prozent], wirkt (ob die Fähigkeit trotzdem wirkt), effekt?
// x ist beim Risiko einer Fähigkeit (risiko) der Pegel in Hundertstel Promille, bei skill.risiko die fehlenden
// Skillstufen, bei anforderung.risiko die fehlenden Punkte der Eigenschaften.
// Ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander; was übrig bleibt, geht gut.
export default {
  // Psi: nüchtern unzuverlässig, am sichersten um 1,5 ‰, darüber drohen Rückschläge
  psi: [
    { name: "fehlschlag", chance: [[0, 30], [150, 5], [400, 10], [800, 30]], wirkt: false },
    { name: "rueckschlag", chance: [[0, 0], [300, 0], [800, 20]], wirkt: false, effekt: "psi_rueckschlag" },
  ],
  // Fundstück ohne passenden Skill (Vorbild DCSS): je fehlender Stufe deutlich unsicherer
  ohne_skill: [
    { name: "ungeschickt", chance: [[0, 0], [1, 25], [3, 60], [5, 85]], wirkt: false },
  ],
  // Fähigkeit mit fehlenden Punkten einer Anforderung: weich, je fehlendem Punkt etwas unsicherer
  anforderung: [
    { name: "ueberfordert", chance: [[0, 0], [1, 5], [10, 50]], wirkt: false },
  ],
};
