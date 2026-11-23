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
  // Testkammer der Spielart "allmaechtig" (src/systeme/allmacht.js, regeln.allmacht): ersetzt dort den Hub
  testkammer: {
    karte: [
      "#####################",
      "#...................#",
      "#...................#",
      "#...................#",
      "#...................#",
      "#.........>.........#",
      "#...................#",
      "#...................#",
      "#...................#",
      "#...................#",
      "#####################",
    ],
  },
  // Arenen der Spielart "arena" (src/systeme/arena.js, datenproben/arenen.js): ohne Treppen, Ninkasi beginnt links in der
  // mittleren Zeile, die Gegner stehen ihr gegenüber; ohne Erreichbarkeitsprüfung, die eine Treppe als Ausgang braucht
  arena_offen: {
    schritte: ["karte_fest", "ebene_anlegen"],
    karte: [
      "###################",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "#.................#",
      "###################",
    ],
  },
  // ein Gang vor einem Raum: Rudel kommen nur einzeln heran
  arena_gang: {
    schritte: ["karte_fest", "ebene_anlegen"],
    karte: [
      "#####################",
      "#############.......#",
      "#############.......#",
      "#...................#",
      "#############.......#",
      "#############.......#",
      "#####################",
    ],
  },
};
