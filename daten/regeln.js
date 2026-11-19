// Regelwerte, die das Balancing ändern darf, ohne Code anzufassen.
export default {
  // Auslöser, siehe src/kern/ausloeser.js
  ausloeser: {
    daempfungProStufe: 50, // Prozent der Chance, die je Kettenstufe erhalten bleibt
    hoechsteKettentiefe: 5, // tiefer wird nichts mehr ausgelöst
  },
  // Fraktionen, siehe src/systeme/fraktionen.js
  fraktionen: {
    beziehungVorgabe: "feind", // für Paare ohne Angabe in daten/fraktionen.js
  },
  // Wahrnehmung, siehe src/systeme/wahrnehmung.js; Vorbild Brogue, alle Zahlen vorläufig
  wahrnehmung: {
    heimlichkeitVorgabe: 7, // Heimlichkeitsweite ohne eigenen Kampfwert heimlichkeit
    heimlichkeitMindestens: 2,
    // nach der letzten eigenen Aktion, in Prozent: Kämpfen verdoppelt, Warten (Rasten) halbiert
    heimlichkeitNachAktion: { nahkampf: 200, faehigkeit: 200, warten: 50 },
    bemerkenChance: 25, // Prozent je Zug für ein Wesen innerhalb der Weite, das noch nichts bemerkt hat
    spurFaktor: 3, // ein jagendes Wesen verliert die Spur jenseits dieses Vielfachen der Weite
    laermNahkampf: 6, // Lautstärke eines Nahkampfs (Kosten der Ausbreitung, freies Feld 1)
    laermWurf: 4, // Lautstärke am Aufschlag eines geworfenen Gegenstands
  },
  // Bewegung, siehe src/systeme/verschieben.js
  bewegung: {
    beimFestsitzen: "eingeklemmt", // Effekt auf ein Wesen in Gelände, das es nicht betreten kann, ohne eigenes beimFestsitzen
  },
  // Population, siehe src/systeme/beschwoerung.js und src/welt/ebene.js
  population: {
    hoechstWesen: 500, // mehr Wesen entstehen nicht (Beschwören, Erzeugen der Ebene), Meldung population_voll
  },
  // Werfen, siehe src/systeme/werfen.js
  werfen: {
    reichweite: 6, // ohne wurf.reichweite am Gegenstand
  },
  // Lange Aktionen (Rituale, Brauen), siehe src/systeme/laufendeAktionen.js:
  // Gefahrenprüfungen (Register "gefahren"), die Ninkasi unterbrechen und fragen
  laufendeAktionen: {
    unterbrechen: ["gegner_in_sicht", "schaden"],
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
