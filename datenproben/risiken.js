// Risikotabellen der Fähigkeiten (siehe src/systeme/faehigkeiten.js); alle Zahlen vorläufig.
// Je Ausgang: chance als Kurve [x, Prozent], wirkt (ob die Fähigkeit trotzdem wirkt), effekt?
// x ist beim Risiko einer Fähigkeit (risiko) der Pegel in Hundertstel Promille, bei skill.risiko die fehlenden
// Skillstufen, bei anforderung.risiko die fehlenden Punkte der Eigenschaften.
// Ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander; was übrig bleibt, geht gut.
export default {
  // Psi: nüchtern unzuverlässig, am sichersten um 6 ‰, im Rausch (ab 12 ‰) drohen Rückschläge, sturzbetrunken
  // (ab 20 ‰) dazu der Kontrollverlust
  psi: [
    { name: "fehlschlag", chance: [[0, 30], [600, 5], [1600, 10], [3200, 30]], wirkt: false },
    { name: "rueckschlag", chance: [[0, 0], [1200, 0], [3200, 20]], wirkt: false, effekt: "psi_rueckschlag" },
    { name: "kontrollverlust", chance: [[0, 0], [2000, 0], [3200, 10]], wirkt: false, effekt: "psi_kontrollverlust" },
  ],
  // Magie: nüchtern sicher, ab berauscht (8 ‰) drohen Fehlschläge, die feine Arbeit leidet zuerst
  magie: [
    { name: "verpatzt", chance: [[0, 0], [800, 0], [1200, 10], [2000, 25], [3200, 50]], wirkt: false },
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
