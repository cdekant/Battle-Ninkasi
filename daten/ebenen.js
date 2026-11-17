// Levelparameter. digger: Optionen für den Digger von rot.js.
export default {
  keller: {
    breite: 120,
    hoehe: 40,
    gelaende: { wand: "wand", boden: "boden" },
    digger: { dugPercentage: 0.35, roomWidth: [4, 12], roomHeight: [3, 7], corridorLength: [3, 10] },
    gegner: [{ typ: "essigbakterium", anzahl: 15 }],
    gegenstaende: [{ typ: "bier", anzahl: 10 }],
  },
};
