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
    // Ruf: gehört dieser Fraktion; Ansehen = Grundwert der Beziehung aus der Tabelle + Ruf, die Schwellen ordnen es
    // wieder zu (bis feind: feind, ab verbuendet: verbündet, dazwischen neutral); alle Zahlen vorläufig
    rufTraeger: "ninkasi",
    rufGrundwert: { feind: -100, neutral: 0, verbuendet: 100 },
    rufSchwellen: { feind: -50, verbuendet: 50 },
    rufToetungFeind: 10, // Tötung eines Wesens: Ruf bei den ausdrücklichen Feinden seiner Fraktion
    rufToetungEigene: -25, // Tötung eines Wesens: Ruf bei seiner eigenen Fraktion
    rufNurMitZeugen: true, // eine Tötung zählt für eine Fraktion nur, wenn eines ihrer Wesen Täterin oder Opfer sieht
  },
  // KI, siehe src/ki/handlungen.js und src/ki/nutzen.js: Zwecke der Handlung nutzen; benannte Kurven für die Bewertung
  // (Promille), die alle Wesen teilen; Umherziehen siehe src/ki/umherziehen.js; Zahlen vorläufig
  // Spielart "arena", siehe src/systeme/arena.js: Abstand der ersten Welle (Felder nach rechts), Wachzustand der Gegner,
  // Grenze für Werkzeug und Bot (Befehle bis zum Patt)
  arena: { abstand: 5, wachzustand: "jagt", grenzeBefehle: 500 },
  ki: {
    zwecke: ["heilen", "angriff"],
    kurven: {
      heilenNachLp: [[0, 1000], [20, 1000], [80, 0]], // LP in Prozent: dringend bis 20 %, ab 80 % gar nicht
    },
    wegpunktSicht: 7, // jedes begehbare Feld liegt in dieser Sichtweite eines Wegpunkts (Ebenenschritt wegpunkte)
    rudelAbstand: 5, // weiter entfernt geht ein Mitglied des Rudels zur Anführerin, sonst wartet es
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
  // Spur als Duft, siehe src/systeme/duft.js; Vorbild Brogue, alle Zahlen vorläufig
  duft: {
    jeZug: 3, // so viel steigt der Zähler mit jedem Zug der gesteuerten Entität (ein Schritt gerade kostet 2, schräg 3)
    reichweite: 8, // so weit legt sich ihr Duft in ihrer Sichtlinie, ohne Rücksicht auf Licht
    haltbarkeitZuege: 20, // älterem Duft folgt niemand mehr
  },
  // Licht, siehe src/systeme/licht.js; alle Zahlen vorläufig
  licht: {
    // Stufen der Helligkeit (0 bis 100) aufsteigend, die erste ab 0: Felder einer Stufe sieht ein Wesen bis zum Anteil
    // sichtAnteil (Prozent) seiner Sichtweite, abgerundet, nie unter sicht.imFinstern; heimlichkeit skaliert die
    // Heimlichkeitsweite in Prozent; Text unter licht.<name>; die oberste Stufe ist der Stand ohne Licht in den Daten
    // (Grundhelligkeit 100)
    stufen: [
      { name: "finster", ab: 0, heimlichkeit: 50, sichtAnteil: 0 },
      { name: "dunkel", ab: 20, heimlichkeit: 50, sichtAnteil: 50 },
      { name: "daemmrig", ab: 40, heimlichkeit: 70, sichtAnteil: 75 },
      { name: "hell", ab: 60, heimlichkeit: 85, sichtAnteil: 100 },
      { name: "taghell", ab: 80, heimlichkeit: 100, sichtAnteil: 100 },
    ],
    imFinstern: 1, // so weit sieht ein Wesen ohne eigene Angabe sicht.imFinstern auf finstere Felder
  },
  // Bewegung, siehe src/systeme/verschieben.js
  bewegung: {
    beimFestsitzen: "eingeklemmt", // Effekt auf ein Wesen in Gelände, das es nicht betreten kann, ohne eigenes beimFestsitzen
    // Steht ein Wesen, das kein Ziel ist, auf dem Weg eines Jägers, geht er um alle Wesen herum, wenn dieser Weg
    // höchstens so viele Felder länger ist; sonst wartet er (src/ki/jagen.js, Vorbild Brogue)
    umwegHoechstens: 4,
  },
  // Population, siehe src/systeme/beschwoerung.js und src/welt/population.js (Tabellen in datenproben/populationen.js)
  population: {
    hoechstWesen: 500, // mehr Wesen entstehen nicht (Beschwören, Erzeugen der Ebene), Meldung population_voll
    tieferChance: 10, // Prozent je Wurf der Population: ein Gegner aus einer tieferen Tiefe
    tieferBis: 2, // höchstens so viele Tiefen tiefer
    schlafChance: 50, // Prozent je Rudel: es schläft beim Erzeugen der Ebene, sonst ist es wach und zieht umher
  },
  // Spielart "allmaechtig", siehe src/systeme/allmacht.js: diese Ebene aus daten/ebenen.js ersetzt die Vorlage dieser
  // Tiefe im Plan des Laufs, dort beginnt der Lauf
  allmacht: { kammer: "testkammer", tiefe: 0 },
  // Erzeugung der Ebenen in Schritten, siehe src/welt/ebene.js und src/welt/ebenenschritte.js; eine Ebene in
  // daten/ebenen.js kann mit schritte eine eigene Folge nennen
  ebenen: {
    schritteErzeugt: ["karte_digger", "tueren", "treppen", "gelaende_objekte", "wand_objekte", "erreichbarkeit", "ebene_anlegen", "wegpunkte", "freie_felder", "population", "gegenstaende", "fallen"],
    schritteFest: ["karte_fest", "erreichbarkeit", "ebene_anlegen"], // Ebenen mit fester karte, z.B. der Hub
    versuche: 10, // so viele Versuche mit neuem Zufall, wenn ein Schritt die Karte verwirft (z.B. Erreichbarkeit)
    folgen: { abstand: 1 }, // so nah muss ein Verfolger bei Ninkasi stehen, um über die Treppe mitzukommen (src/systeme/ebenen.js)
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
    licht: { reichweite: 4, staerke: 70, farbe: "#ff9a3c" }, // jedes brennende Feld leuchtet (src/systeme/licht.js)
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
    nachwirkung: 500, // so lange nach dem letzten Angriff (eigener oder erlittener) ist ein Wesen im Kampf (src/systeme/kampfzustand.js)
  },
  // Abnehmende Kontrolle, siehe src/systeme/zustaende.js kontrollDauer: Wirkung der ersten, zweiten, dritten
  // Kontrolle in Folge in Prozent der Dauer, danach immun; die Folge beginnt neu, wenn so lange nach dem Ende der
  // letzten keine mehr kam; Zahlen vorläufig
  kontrolle: { stufen: [100, 50, 25], erholung: 1000 },
  // Normierung, siehe werkzeuge/normierung.js und docs/Wesen.md, Normierung: Zielwerte gegen Ninkasi zu Beginn (Faust,
  // ohne Skills und Ausrüstung); Treffer bis zum Tod in beide Richtungen und EP je Stärke 1 bis 5, Trefferchancen in
  // Prozent, toleranz in Prozent der Treffer; dazu die Stufen von Kontrolldauer und Abklingzeit und der Verbrauch eines
  // Standardzaubers und einer Psi-Fähigkeit, nach denen sich Inhalt richtet; alle Zahlen vorläufig
  normierung: {
    toleranz: 10,
    trefferchance: { ninkasi: 80, wesen: 70 },
    sicht: { ninkasi: 6, wesen: 7 }, // Sichtweite zu Beginn und eines gewöhnlichen Wesens, je Lichtstufe nach regeln.licht
    staerken: [
      { ninkasiTreffer: 2, wesenTreffer: 25, ep: 5 }, // Futter
      { ninkasiTreffer: 3, wesenTreffer: 18, ep: 10 }, // gewöhnlich
      { ninkasiTreffer: 4, wesenTreffer: 12, ep: 20 }, // zäh
      { ninkasiTreffer: 6, wesenTreffer: 9, ep: 40 }, // gefährlich
      { ninkasiTreffer: 8, wesenTreffer: 6, ep: 80 }, // Elite, ein Duell
    ],
    kontrolle: { kurz: 100, mittel: 200, lang: 400 },
    abklingzeit: { kurz: 300, mittel: 1000, lang: 3000 },
    verbrauch: { zauber: { mp: 10 }, psi: { pp: 10 } },
    // Weltticks von leer bis voll außerhalb des Kampfes für Ninkasi zu Beginn (tests/stoffwechsel.test.js): nüchtern,
    // im Optimum der Kurve und im Rausch bei pegelRausch (12 ‰, Ninkasis Stufe im_rausch)
    regeneration: { pegelRausch: 1200, lp: { nuechtern: 400, optimum: 150, rausch: 400 }, mp: { nuechtern: 200 } },
  },
  // Tempo in Worten beim Untersuchen (src/systeme/untersuchen.js): stufen [bis Zeiteinheiten, Stufe] aufsteigend, darüber
  // die Stufe darueber; Texte tempo.bewegen.<stufe> und tempo.angriff.<stufe>; Norm 100, Ninkasi bewegt sich anfangs mit 120
  tempo: {
    stufen: [[50, "sehr_schnell"], [80, "schnell"], [110, "normal"], [160, "langsam"]],
    darueber: "sehr_langsam",
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
