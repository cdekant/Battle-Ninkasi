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
    // Steht ein Wesen, das kein Ziel ist, auf dem Weg eines Jägers, geht er um alle Wesen herum, wenn dieser Weg
    // höchstens so viele Felder länger ist; sonst wartet er (src/ki/jagen.js, Vorbild Brogue)
    umwegHoechstens: 4,
  },
  // Population, siehe src/systeme/beschwoerung.js und src/welt/ebene.js (Tabellen in daten/populationen.js)
  population: {
    hoechstWesen: 500, // mehr Wesen entstehen nicht (Beschwören, Erzeugen der Ebene), Meldung population_voll
    tieferChance: 10, // Prozent je Wurf der Population: ein Gegner aus einer tieferen Tiefe
    tieferBis: 2, // höchstens so viele Tiefen tiefer
  },
  // Fallen, siehe src/systeme/fallen.js; Zahlen vorläufig
  fallen: {
    entdeckenVorgabe: 30, // Kampfwert entdecken ohne eigene Angabe
    reichweite: 5, // weiter entfernte Fallen werden nicht entdeckt
  },
  // Feldschichten und Feuer, siehe src/systeme/schichten.js; Zahlen vorläufig
  schichten: {
    hoechstOberflaeche: 10, // Menge einer Oberfläche je Feld ohne eigenes hoechstens
    hoechstGas: 1000, // Menge eines Gases je Feld ohne eigenes hoechstens
  },
  feuer: {
    brennen: "brennen", // Effekt auf Wesen in einem brennenden Feld, je Welttick und beim Betreten
    dauer: 3, // Brenndauer in Weltticks ohne eigene brenndauer
    rauch: "rauch", // Gas, das ein Feuer je Welttick erzeugt
    rauchMenge: 20,
  },
  // Ausrüstung, siehe src/systeme/ausruestung.js: die Namen der Plätze, die Wesen und Gegenstände nennen dürfen
  ausruestung: {
    plaetze: ["hand", "kopf", "brust", "beine", "hals", "finger"],
  },
  // Tragen, siehe src/systeme/inventar.js; Skills auf "tragkraft" folgen mit dem Skillsystem
  tragen: {
    tragkraft: 20000, // in Gramm, ohne eigene tragkraft am Wesen
    stufen: [{ ab: 100, kosten: 25 }, { ab: 150, kosten: 100 }], // ab Prozent der Tragkraft kostet Bewegen so viel mehr
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
  // Eigenschaften, Skills und EP, siehe docs/Charakter.md, src/systeme/skills.js und src/systeme/lernen.js; alle Zahlen vorläufig
  lernen: {
    eigenschaftStart: 10, // jede Eigenschaft beginnt hier
    eigenschaftPunkte: 20, // so viele Punkte verteilt die Spielerin bei der Erstellung
    eigenschaftHoechstens: 20, // Höchstwert bei der Erstellung; dauerhafte Gaben dürfen darüber heben
    bezugswert: 40, // Lernpunkte = EP x (2 x primär + sekundär) / bezugswert
    stufen: [50, 100, 200, 350, 550], // Kosten der Stufen 1 bis 5 in Lernpunkten bei Rang 1
    raengeNachTier: [1, 2, 4, 8], // Grund, Experte, Meister, göttlich
    tierVoraussetzungen: [[], [3], [4, 3], [5, 4, 3]], // je Tier die nötigen Stufen der Tiers darunter im selben Set
    startEp: 300, // Startguthaben freier EP statt Startskills
    epJeFeld: 1, // freie EP je Feld, das zum ersten Mal gesehen wird
    verrechnung: "multiplizieren", // Prozente verschiedener Skills: "multiplizieren" (ein mal je Eintrag) oder "addieren"
    gewichtung: "erste", // Beitragsbuch: jeder Lernanlass zählt je Gegner einmal ("anteil" folgt später)
    topfFaktor: 3, // ein Topf je Abstammungslinie fasst so viele Male die EP der Mutter
    ort: "jederzeit", // wo freie EP verteilt werden dürfen; Orte (Altar, Hub) folgen vielleicht später
    // Abzug je fehlendem Punkt einer Anforderung an angelegter Ausrüstung (ohne eigenes abzugJePunkt)
    anforderungAbzug: [{ ziel: "genauigkeit", art: "prozent", betrag: -5 }, { ziel: "schaden", art: "prozent", betrag: -5 }],
  },
};
