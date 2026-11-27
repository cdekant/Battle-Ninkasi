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
    { typ: "laterne", anzahl: 1 }, { typ: "holzkessel", anzahl: 1 }, { typ: "kupferkessel", anzahl: 1 },
    { typ: "gerstenmalz", anzahl: 3, stapel: 4 }, { typ: "emmer", anzahl: 2, stapel: 3 }, { typ: "bierbrot", anzahl: 2, stapel: 2 },
    { typ: "datteln", anzahl: 2, stapel: 3 }, { typ: "honig", anzahl: 1, stapel: 2 }, { typ: "wacholder", anzahl: 2, stapel: 2 },
    { typ: "roestmalz", anzahl: 1, stapel: 2 }, { typ: "gerste", anzahl: 1, stapel: 3 },
    { typ: "senfsaat", anzahl: 2, stapel: 2 }, { typ: "bilsenkraut", anzahl: 1, stapel: 2 }, { typ: "kamille", anzahl: 1, stapel: 2 },
    { typ: "feuerelixier", anzahl: 1 }, { typ: "sichtgift", anzahl: 1 },
    { typ: "hefekrug", anzahl: 1 }, { typ: "sauerkrug", anzahl: 1 }, { typ: "kveikring", anzahl: 1 }, { typ: "tontafel_dunkles_bier", anzahl: 1 },
  ],
  fallen: [{ typ: "saeureduese", anzahl: 6 }, { typ: "klappergeschirr", anzahl: 6 }],
  tuerChance: 50, // Prozent der Raumzugänge mit Tür
  gelaendeObjekte: [{ gelaende: "gaerbottich", anzahl: 3 }, { gelaende: "tonkessel", anzahl: 2 }], // im Inneren von Räumen, sperren keinen Durchgang
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
