// Ebenen des Probeinhalts (Aufbau wie in daten/ebenen.js beschrieben). Zahlen vorläufig.
const keller = {
  breite: 120,
  hoehe: 40,
  gelaende: { wand: "wand", boden: "boden" },
  digger: { dugPercentage: 0.35, roomWidth: [4, 12], roomHeight: [3, 7], corridorLength: [3, 10] },
  population: { tabelle: "keller", anzahl: [32, 40] }, // Wesen je Ebene, nach Tiefe gezogen (datenproben/populationen.js)
  gegenstaende: [
    { typ: "bier", anzahl: 10 }, { typ: "bierfass", anzahl: 1 }, { typ: "brandflasche", anzahl: 3 },
    { typ: "schoepfkelle", anzahl: 1 }, { typ: "fasshammer", anzahl: 1 }, { typ: "lederschuerze", anzahl: 1 },
    { typ: "kupferhelm", anzahl: 1 }, { typ: "lederhose", anzahl: 1 }, { typ: "hopfenkette", anzahl: 1 }, { typ: "kupferring", anzahl: 2 },
    { typ: "schleuder", anzahl: 1 }, { typ: "kurzbogen", anzahl: 1 }, { typ: "schleuderstein", anzahl: 4, stapel: 5 }, { typ: "pfeil", anzahl: 2, stapel: 10 },
    { typ: "laterne", anzahl: 1 },
  ],
  fallen: [{ typ: "saeureduese", anzahl: 6 }, { typ: "klappergeschirr", anzahl: 6 }],
  tuerChance: 50, // Prozent der Raumzugänge mit Tür
  gelaendeObjekte: [{ gelaende: "gaerbottich", anzahl: 3 }], // im Inneren von Räumen, sperren keinen Durchgang
};

export default {
  keller,
  // der dunkle Keller: finster bis auf Wandfackeln, die Laterne aus dem Keller hilft (src/systeme/licht.js)
  keller_dunkel: {
    ...keller,
    licht: { grundhelligkeit: 0 },
    wandObjekte: [{ gelaende: "wandfackel", anzahl: 14 }], // auf Wänden am Rand der Räume
  },
};
