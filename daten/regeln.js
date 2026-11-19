// Regelwerte, die das Balancing ändern darf, ohne Code anzufassen.
export default {
  // Auslöser, siehe src/kern/ausloeser.js
  ausloeser: {
    daempfungProStufe: 50, // Prozent der Chance, die je Kettenstufe erhalten bleibt
    hoechsteKettentiefe: 5, // tiefer wird nichts mehr ausgelöst
  },
  // Kampf, siehe src/systeme/kampf.js; alle Zahlen vorläufig
  // Halbwert: so viele Punkte ergeben 50 %, mehr Punkte nähern sich 100 % nur an
  kampf: {
    grundverteidigung: 20, // kommt zu jeder Verteidigung; Genauigkeit 80 gegen 0 Ausweichen trifft so zu 80 %
    halbwertWiderstand: 100, // 100 Punkte halber Schaden, 300 ein Viertel; -100 Punkte das Anderthalbfache
    halbwertBlocken: 50,
    halbwertKritchance: 50,
    kritfaktor: 150, // in Prozent, x1,5; Modifikatoren auf "kritfaktor" heben ihn nach oben offen
    mindestschadenNachRuestung: 1, // Rüstung senkt einen Treffer mit Schaden nicht unter diesen Wert
  },
};
