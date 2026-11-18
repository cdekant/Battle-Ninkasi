// Regelwerte, die das Balancing ändern darf, ohne Code anzufassen.
export default {
  // Auslöser, siehe src/kern/ausloeser.js
  ausloeser: {
    daempfungProStufe: 50, // Prozent der Chance, die je Kettenstufe erhalten bleibt
    hoechsteKettentiefe: 5, // tiefer wird nichts mehr ausgelöst
  },
};
