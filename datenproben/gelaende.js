// Gelände des Probeinhalts (Felder wie in daten/gelaende.js beschrieben).
export default {
  // gärt vor sich hin: Quelle von CO2 auf den Nachbarfeldern, man kommt nicht hindurch, sieht aber darüber
  gaerbottich: { text: "gelaende.gaerbottich", kennung: "O", passierbar: false, durchsichtig: true, laermdaempfung: 4, quelle: { gas: "co2", menge: 6 } },
  // Kessel aus Ton (sumerische Tradition): hier wird gebraut (src/systeme/brauen.js, docs/Sude.md, Befehl)
  tonkessel: { text: "gelaende.tonkessel", kennung: "u", passierbar: false, durchsichtig: true, laermdaempfung: 4, kessel: { portionen: 4 } },
  // Fackel in der Wand: Wand, die leuchtet (src/systeme/licht.js) und wärmt (hitze, Anrühren von Trockenbier,
  // src/systeme/trockenbier.js), gesetzt vom Ebenenschritt wand_objekte
  wandfackel: { text: "gelaende.wandfackel", kennung: "*", hitze: true, passierbar: false, durchsichtig: false, laermdaempfung: 8, licht: { reichweite: 5, staerke: 80, farbe: "#ffb347" } },
};
