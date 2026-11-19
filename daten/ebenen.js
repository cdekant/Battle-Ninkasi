// Ebenen (Aufbau siehe src/welt/ebene.js). Die Abfolge der Tiefen steht in daten/index.js (abfolge, starttiefe);
// mehrere Tiefen dürfen dieselbe Vorlage nutzen. digger: Optionen für den Digger von rot.js. Zahlen vorläufig.
export default {
  // fester Ort zwischen den Ebenen; Dienste (Händler u.a.) folgen, siehe docs/Grundlagen.md
  hub: {
    karte: [
      "###########",
      "#.........#",
      "#.........#",
      "#....>....#",
      "#.........#",
      "#.........#",
      "###########",
    ],
  },
  keller: {
    breite: 120,
    hoehe: 40,
    gelaende: { wand: "wand", boden: "boden" },
    digger: { dugPercentage: 0.35, roomWidth: [4, 12], roomHeight: [3, 7], corridorLength: [3, 10] },
    population: { tabelle: "keller", anzahl: [16, 20] }, // Wesen je Ebene, nach Tiefe gezogen (daten/populationen.js)
    gegenstaende: [
      { typ: "bier", anzahl: 10 }, { typ: "brandflasche", anzahl: 3 },
      { typ: "schoepfkelle", anzahl: 1 }, { typ: "fasshammer", anzahl: 1 }, { typ: "lederschuerze", anzahl: 1 },
      { typ: "kupferhelm", anzahl: 1 }, { typ: "lederhose", anzahl: 1 }, { typ: "hopfenkette", anzahl: 1 }, { typ: "kupferring", anzahl: 2 },
    ],
    fallen: [{ typ: "saeureduese", anzahl: 6 }, { typ: "klappergeschirr", anzahl: 6 }],
    tuerChance: 50, // Prozent der Raumzugänge mit Tür
    gelaendeObjekte: [{ gelaende: "gaerbottich", anzahl: 3 }], // im Inneren von Räumen, sperren keinen Durchgang
  },
};
