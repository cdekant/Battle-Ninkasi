// Gelände des Probeinhalts (Felder wie in daten/gelaende.js beschrieben).
export default {
  // gärt vor sich hin: Quelle von CO2 auf den Nachbarfeldern, man kommt nicht hindurch, sieht aber darüber
  gaerbottich: { text: "gelaende.gaerbottich", kennung: "O", passierbar: false, durchsichtig: true, laermdaempfung: 4, quelle: { gas: "co2", menge: 6 } },
};
