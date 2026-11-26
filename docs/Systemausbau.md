# Battle Ninkasi - Systemausbau

Stand: 2026-11-26

Mitprüfen bei Änderungen: alle Dokumente, deren Punkte hier umgesetzt werden

Arbeitsliste der offenen Arbeit an Systemen, Werkzeugen und Doku, bevor und während der Inhalt entsteht. Was umgesetzt ist, steht im zuständigen Dokument, wie es dazu kam, in der Git-Historie; wie Punkte entstehen und gestrichen werden, regelt [Dokumentation.md](Dokumentation.md), Lebenslauf einer Aussage. Ideen ohne Entscheidung stehen in [Ausblick.md](Ausblick.md), offene Fragen des Spieldesigns in [Grundlagen.md](Grundlagen.md), Offen, [Charakter.md](Charakter.md), Offen und [Spielverlauf.md](Spielverlauf.md), Offen.

## Arbeitsweise

+ Jeder Punkt wird vor der Umsetzung als Vorschlag ausgearbeitet und freigegeben
+ Status je Punkt: offen oder in Arbeit
+ Konkreter Inhalt (Gegner, Gegenstände, Effekte, Skills, Fähigkeiten, Rituale, Quests, Raumstrukturen) entsteht erst, wenn die Punkte 8, 10, 11, 16, 20 und 23 erledigt sind; bis dahin gibt es nur Probeinhalt zum Ausprobieren der Systeme (siehe [Entwicklung.md](Entwicklung.md), Probeinhalt)

## Reihenfolge

Stand 2026-11-25, vor dem Inhalt in dieser Folge, die Systemlücken nach ihrer Wirkung auf den Inhalt, das Kleine und Breite zuerst:

1. Spieldesign vor dem Inhalt mit der Machtkurve (Punkt 10) und das Brausystem (Punkt 23)
2. Ebenenbau: Ebenenbilder, Übergänge und feste Strukturen (Punkt 16)
3. Anleitungen, Werkzeuge und Grundgerüst (Punkt 11)
4. Danach der Inhalt (Punkt 14)

Daneben, ohne festen Platz: Skills für Anhänger (Punkt 21, Umbaurisiko gering, umgesetzt mit den Begleitern bzw. den Geistern früherer Läufe), kleinere Reste der Systeme mit dem ersten Bedarf (Punkt 8), Oberfläche (Punkt 12), Korpustexte aus dem Gilgamesch-Epos (Punkt 18), Auszeichnung in Texten (Punkt 19, spätestens mit dem Fenster des Glossars); zurückgestellt: Darstellung (Punkt 13). Erledigt sind Punkt 1 (Probeinhalt auslagern), Punkt 2 (Probedurchstich), Punkt 3 (Licht, Wahrnehmungsarten, Spüren und Duft), Punkt 4 (Ersatzwirkungen), Punkt 5 (gewährte und gelehrte Fähigkeiten), Punkt 6 (Teilung und Wachstum), Punkt 7 (KI: Unterstützung und Umherziehen), Punkt 9 (Englisch, Mehrzahl und Glossar), Punkt 15 (Reste des Effektsystems), Punkt 17 (Bierstile), Punkt 22 (Fernwaffen) und der Entwurf des Skillkatalogs in [Skills.md](Skills.md) (Grundlage von Punkt 20), die Nummern der übrigen bleiben.

Die Proben des Probedurchstichs stehen in `tests/probedurchstich.test.js`; jede Lücke dort ist ein Test mit `todo` und dem Punkt, der sie schließt, mit einem Entwurf der Daten (siehe [Entwicklung.md](Entwicklung.md), Tests und Balancing). Wer einen Punkt umsetzt, nimmt dort das `todo` weg.

## Bekannte Fehler

+ Derzeit keine

## 8. Kleinere Reste der Systeme

Status: offen, jeweils mit dem ersten Bedarf

+ Ladungen als Verbrauch einer gewährten Fähigkeit (Zauberstab, Regel in [Grundlagen.md](Grundlagen.md), Spielkern): Entwurf `verbrauch: { ladungen: 1 }`, bezahlt vom zuerst angelegten Gegenstand der Quelle, der noch Ladungen hat; jede gewährte Fähigkeit kennt ihre Quelle (`gegenstandId`, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten); das Fähigkeitenfenster zeigt die Summe der Ladungen; prüfen, ob die Ladungen als Magazin ohne Nachladen ins Modell der Fernwaffen passen (siehe [Wesen.md](Wesen.md), Fernkampf)
+ Lesen mit Ziel: eine Rolle wirkt eine Fähigkeit einmal, ohne sie zu lehren (Entwurf `lesbar: { faehigkeit }`, Befehl `lesen { gegenstandId, ziel? }` über den Zielmodus); heute wirkt ein lesbarer Gegenstand nur auf die Leserin
+ Haken `zug_beginn` in Betrieb nehmen
+ Licht ein- und ausschalten: ein Zustand an der Quelle (Entwurf `licht.an`) und ein Befehl dafür (Lampe, Laterne, Fackel löschen), mit dem ersten Inhalt, der es braucht (siehe [Welt.md](Welt.md), Licht)
+ Ersatzwirkungen an weiteren Haken "davor" (z.B. `vor_angriff` für ein Ausweichen aus Daten) und eine Barriere als Puffer mit Fassungsvermögen statt ganzer Treffer (Entwurf `fasst`, Vorbild ToME), siehe [Wirkungen.md](Wirkungen.md), Ersatzwirkungen
+ Auslöser mit Filter auf den Grund des Ereignisses (`verfehlt` mit `grund: "geblockt"`), etwa für Gegenwurf, Riposte und Zurückwerfen (siehe Punkt 20)
+ Angefressene Waffen: wie sie schwächer werden, braucht einen Eingriff in die Schadensrechnung (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß)
+ Sturz in einen Abgrund auf die Ebene darunter (siehe [Wesen.md](Wesen.md), Bewegung)
+ Abzug einer Anforderung nur für den Angriff mit genau dieser Waffe (über Tags der Profile)
+ Lernanlässe für das Bewältigen von Fallen, Schlössern und Rezepten, mit diesen Systemen
+ Ausdrückliches Suchen nach Fallen (mehrere Züge, doppeltes Entdecken), vielleicht zusammen mit dem Rasten
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud), erst wenn mehr als die Beteiligten gefragt werden
+ Nach dem Anspielen prüfen, ob die Sichtlinie Ersatzlinien oder einen symmetrischen Schattenwurf braucht (siehe [Wirkungen.md](Wirkungen.md), Zielauswahl)
+ Skills der Arena in EP statt in Stufen (`skills: { name: ep }` in `datenproben/arenen.js`), die EP fließen mit den Eigenschaften der Arena-Ninkasi in Lernpunkte wie beim Verteilen freier EP; so vergleicht die Arena Builds mit gleichem Budget; später vielleicht ein Budget `ep` mit Verteilregel; alle Inhaltsdaten nennen EP, nur Unittests setzen Stufen direkt
+ Verzauberungen, Anstriche und Bestreichen: mehrere zugleich an einem Stück, erster Fall der Säureschutz aus einem häufigen Rezept des Absuds; Waffen mit Elixier oder Gift bestreichen (Entwurf Komponente `bestrichen: { richtung, art, staerke, ladungen }`, je Treffer eine Ladung), Munition ebenso (ein Fläschchen für einen Teil des Stapels, der als eigener Stapel abspaltet); Spieldesign in [Grundlagen.md](Grundlagen.md), Spielkern, und [Brauen.md](Brauen.md), Absud und Bestreichen
+ Leiser Lärm für Schritte, damit Lauschen mehr hört als Kämpfe; mit einer Prüfung der Leistung bei vielen Wesen; ändert die Fingerabdrücke in `tests/ebenen.test.js`
+ Abzug der zweiten Hand: die Profile der zweiten Waffe tragen in `angriffeVon` den Tag `zweite_hand`, der Abzug wirkt als Modifikator darauf (Entwurf `regeln.kampf.zweiteHand: { genauigkeit: -20, schaden: -25, kostenAufschlag: 20 }` in Prozent, der Aufschlag auf die Kosten der langsameren Waffe); heute sind zwei Waffen ohne Nachteil (Entscheidung in [Skills.md](Skills.md), Kampf, Handhabung)
+ Aktionen ohne Zeit für die KI (Sprint der Gegner): eine Handlung dafür erst mit dem ersten Gegner, der sprinten soll; die Flucht nur vor Langsameren rechnet bisher ohne Sprint (Entscheidung 2026-11-24, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten)
+ Gewichtung `anteil` der gebundenen EP zum Vergleich mit `erste`; Ortsbindung des Verteilens (`regeln.lernen.ort`), falls gewünscht
+ Leistung, wenn viele Wesen zugleich jagen (etwa nach Teilungen um Ninkasi): 389 Wesen etwa 12 ms je Befehl gegen das Ziel 2 ms für 300 (siehe [Entwicklung.md](Entwicklung.md), Messwerte); mit dem ersten Inhalt, der so viele Teilende bringt, Zielwahl der Handlungen und Umkreissuche verbessern, dazu einen Zähler je Typ für `anzahl_unter`

## 10. Spieldesign vor dem Inhalt

Status: in Arbeit; jeweils zuerst in [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md) oder [Spielverlauf.md](Spielverlauf.md) entscheiden, mit Recherche bei anderen Spielen; der Rahmen (offene Tiefe in Kapiteln, erstes Kapitel, Epochen, Bosse, was Läufe unterscheidet) steht in [Spielverlauf.md](Spielverlauf.md), Breite und Spezialisierung in [Charakter.md](Charakter.md), Skills

+ Brausystem: das Spieldesign steht in [Brauen.md](Brauen.md), die Umsetzung in Punkt 23; im Spieldesign noch zu klären (dort unter Offen): die Achsen und ihre Wirkungen, weitere Familien von Zielgebieten nach den antiken (ägyptisch, mittelalterlich) und ihre Zuordnung zu den Epochen (siehe [Spielverlauf.md](Spielverlauf.md), Epochen und Wertschöpfungskette)
+ Machtkurve: Budget je Tiefe für alle Arten von Inhalt als Regelwerte, ein Werkzeug warnt bei Ausreißern (Vorläufer `werkzeuge/normierung.js`, siehe [Wesen.md](Wesen.md), Normierung); braucht Pegel und Brausystem; darin:
  + Ziel der Anfangsbalance am Ende des ersten Kapitels für eine ausgewogene und eine spezialisierte Ninkasi (siehe [Charakter.md](Charakter.md), Skills)
  + Kernskills der Archetypen als Prüfsteine für Arena und Simulation (siehe [Spielverlauf.md](Spielverlauf.md), Was zwei Läufe unterscheidet)
  + Fundstücke, die mit der Tiefe wachsen, und einfache Waffen jeder Art, die verlässlich zu bekommen sind
  + Ninkasis Grundausstattung als Bezug: was sie ohne Skills auf der ersten Tiefe kann; entschieden ist Dolch und Wurfwaffen ohne Rüstung (siehe [Charakter.md](Charakter.md), Startwerte), damit ändert sich der Bezug der Normierung von der Faust zum Dolch
  + Befund des räumenden Bots (siehe [Entwicklung.md](Entwicklung.md), Messwerte): die Gegner der ersten Ebene treffen ihr Ziel, die Erkundung bringt mit 1 EP je Feld etwa 3000 statt 700 bis 1000 EP, zusammen reicht es für fast vier statt zwei Grundskills auf Stufe 5; entschieden: keine EP je Feld mehr, dafür Tiefen-EP und Wissens-EP, und nur ein Anteil der EP aus Bewältigtem ist gebunden (siehe [Charakter.md](Charakter.md), Freie EP und Gebundene EP); die gründlich spielende Ninkasi überlebt die erste Ebene immer und trinkt kaum, das ist gewollt (siehe [Spielverlauf.md](Spielverlauf.md), Erstes Kapitel); offen ist, wie die Härte ab der zweiten Ebene steigt
  + Die Tiefen-EP senken, sobald echter Inhalt mehr Wissen bringt (heute 1000 für Tiefe 2, weil der Probeinhalt nur zwei Wesenarten hat); Wissens-EP für Zutaten und Kulturen mit dem Brausystem (Punkt 23), für besondere Orte mit dem Ebenenbau (Punkt 16)
  + Eine eilige Strategie für den räumenden Bot (zielstrebig zur Treppe) als Untergrenze des EP-Budgets
  + Fernwaffen nachregeln: mit den Probewerten fällt ein Gegner der Stärke 3 auf Abstand 8 fast immer vor der Berührung (siehe [Entwicklung.md](Entwicklung.md), Messwerte); der räumende Bot legt Fernwaffen noch nicht an, die Taktik `fernkampf` hält keinen Abstand (siehe Punkt 11, Arena)
  + Ziele für Skills in der Arena, sobald es Waffenskills gibt (Punkt 20), mit Skills in EP (Punkt 8)
  + Ökonomie der Vorräte als ein Kreislauf mit Skill- und Brausystem: Rasten und Regeneration, Bier als Heilung, Brauen als Quelle, Skills als Hebel, Druck gegen endloses Rasten, Ausdauer und Nahrung (siehe [Ausblick.md](Ausblick.md), Druck gegen endloses Rasten); darin Rasten als Weg zu heilen gegen den Zeitdruck, was der Sprint verbraucht (heute nur doppelter Pegelabbau) und der Verbrauch je Ebene mit Ninkasis Anfangstempo als Maßstab
  + EP aus Erkundung gegen EP aus Gegnern, bezogen auf die zu erwartenden Skillstufen je Ebene und die Builds, die daraus folgen (Messwerte in [Entwicklung.md](Entwicklung.md), Messwerte)
  + der Befund der Arena: die Prüfstücke zeigen, dass Ausrüstung mit passenden Werten deutlich wirkt (siehe [Entwicklung.md](Entwicklung.md), Messwerte); offen bleiben die Skills und die Gegner mit Säure, gegen die Rüstung kaum schützt
  + Die Norm der Regeneration (siehe [Wesen.md](Wesen.md), Normierung) und der Gewinn der PP im Kampf mit der Arena prüfen, sobald es Psi-Fähigkeiten gibt
+ Flüssigkeiten und Gase in einer eigenen Sitzung: tiefes Wasser, Strömung und Schwimmen, Fließen, Verdunsten zu Gas, Schwere des Gases (siehe [Ausblick.md](Ausblick.md), Flüssigkeiten und Gase); entschieden ist, dass Lachen sich nicht mischen (siehe [Brauen.md](Brauen.md), Grundsätze)
+ Die Ebenen des Spieldesigns nach dem Rahmen, im Gespräch zu klären (siehe [Spielverlauf.md](Spielverlauf.md), Offen): Kreisläufe auf drei Zeitskalen (Zug, Ebene, Lauf), Spannungen, Ökonomie, Machtkurve, Inhaltsplan grob; die Unterpunkte dieses Punkts gehören dazu
+ Noch in [Spielverlauf.md](Spielverlauf.md) zu klären (dort unter Offen): welche Systeme tieferen Kapiteln vorbehalten bleiben; welche Figuren in den Hub ziehen, wodurch, und was eine Stufe des Hubs ausmacht; wann der Hopfen kommt (Freischaltung durch den ersten Fund oder hoch im Skillbaum); wie die Erzählung drinnen und draußen und die Reise durch die Zeit begründet; die Rohstoffe Sumers mit Quellen; die Kernskills der Archetypen (mit der Machtkurve); der Boss des ersten Kapitels (mit dem Inhaltsplan)
+ Inhaltsplan grob für das erste Kapitel: Systeme, die tieferen Kapiteln vorbehalten bleiben, Gegnerfamilien (Mikroorganismen mit eigener Mechanik, offen in [Grundlagen.md](Grundlagen.md), Gegner), der erste Boss, Rolle des Hubs, Rohstoffe Sumers (offen in [Spielverlauf.md](Spielverlauf.md), Offen); im Einzelnen zuletzt

## 11. Anleitungen, Werkzeuge und Grundgerüst

Status: offen

+ Anleitungen zum Anlegen von Inhalten, je Art eine (Gegner, Gegenstand, Effekt, Skill, Fähigkeit, Ritual, Quest, Raumstruktur): Datenformat, Einordnung in die Machtkurve, Tile nach der Fibel, Texte in beiden Sprachen, Tests; Form: Claude-Code-Skills unter `.claude/skills/`; Beispiel Gegner: Tiefe und Rolle geben das Budget, daraus Werte, Angriffe, Fähigkeiten und EP, dann Thema, Verhalten, Tile, Texte; braucht die Machtkurve (Punkt 10)
+ Tiles für das Grundgerüst vor dem ersten echten Inhalt: Tür offen und zu, Treppe hinauf und hinab, Feuer, die Getränke aus dem Brauen und der Essig; danach `TILES_AUSSTEHEND` in `werkzeuge/luecken.js` leeren (siehe [Tileset.md](Tileset.md), Ablauf)
+ Testkammer: ein Feld zum Erzeugen über den Zielmodus wählen, Wesen und Gegenstände entfernen (siehe [Architektur.md](Architektur.md), Spielarten)
+ Arena: eigene Aufstellungen im Browser (siehe [Titelbildschirm.md](Titelbildschirm.md), Ideen für später), bessere Taktiken (Abstand halten, Engpass suchen), Statistiken über erzeugte Dungeons (siehe [Entwicklung.md](Entwicklung.md), Tests und Balancing)
+ Kompendium: Abdeckung der Texte je Eintrag (siehe [Texte.md](Texte.md), Offen)
+ Skill für Begriffe des Glossars: legt einen Begriff an allen drei Stellen an (`daten/glossar.js`, beide Sprachdateien), mit Prüfung von Name und Gebiet und dem Test des Glossars; die Texte schreibt die Nutzerin bzw. der Nutzer, der Skill entwirft nur auf Zuruf (siehe [Texte.md](Texte.md), Glossar)
+ Schutz der Ablagen: die gesammelten Kandidaten, darunter eine Prüfsumme des Codes im Spielstand, damit auch eine Codeänderung ohne neue Version alte Stände ungültig macht (siehe [Ausblick.md](Ausblick.md), Schutz der Ablagen)
+ Messung der Leistung mit dem heutigen Stand wiederholen (siehe [Architektur.md](Architektur.md), Leistung)
+ Werkzeug für die Weltzeit je Ebene (Erkunden, Kampf nach Taktik, Rasten bis voll) als Maßstab für den Verbrauch je Ebene; ein erster Versuch blieb an Rändern hängen, die Erkunden nicht erreicht (`kein_weg`, siehe Punkt 12), und kam nur in 3 von 20 Läufen auf Tiefe 1 durch (rund 1050 Ticks)

## 12. Oberfläche

Status: offen, ohne festen Platz in der Reihenfolge

+ Im Browser prüfen: Einstellungen, Tastenbelegung, Befehlszeile, Suche im Verlauf, Klicks in allen Fenstern, Titelbildschirm, Skillfenster, Charaktererstellung, Verteilen der EP, Inventarfenster, Gewinn der Kulturen neben dem Wesen oder als Befehl (siehe [Brauen.md](Brauen.md), Offen), Platztausch mit Neutralen und Vorsatz angreifen (v); dazu kleine Nacharbeiten an den Fenstern und die Gestaltung des Titels
+ Laufen hält noch nicht an Abzweigungen in Gängen (wie DCSS)
+ Automatisches Erkunden über eine Dijkstra-Karte (Vorbild Brogue): Ziele mit Gewichten (unentdeckte Felder, erinnerte Gegenstände zum Aufheben), Gefahren und später Kosten je Gelände; heute geht es zum nächsten Rand (Quellen in [Ausblick.md](Ausblick.md), Recherche)
+ Gehörten Lärm nachprüfen, sobald Gegner untereinander kämpfen, Beschworene und Fallen Lärm machen (im Probeinhalt kommt er kaum vor)
+ Reise und Erkunden halten mit `kein_weg`, wenn eine entdeckte Falle den einzigen Weg versperrt; später vielleicht mit Nachfrage
+ Skillfenster umschaltbar für Anfänger, etwa alle Skills oder nur die gerade lernbaren (siehe [Charakter.md](Charakter.md), Skills)
+ Treppe per Maus (Reise zur Treppe und hinüber)
+ Fallenlassen einer Teilmenge (Abfrage der Anzahl)
+ Gefahreneinschätzung beim Untersuchen
+ Blocken in der angezeigten Chance; Vorschau von Wirkungen innerhalb eines Effekts (siehe [Ausblick.md](Ausblick.md), Vorschau durch Simulation)
+ Mindestpegel als Kante an der Schnellleiste; Restzeit des Verderbens im Gepäck ("frisch", "bald sauer")
+ Farbpalette des Spiels festlegen: die Farben der Oberfläche (heute verstreute Variablen in `stil.css`, Farben von Gelände und Schichten in `daten/zeichen.js`, Minikarte, Effekte des Titels in `src/anzeige/titeleffekte.js`) als eine benannte Liste mit Bedeutung, abgestimmt auf die Pixel-Palette (`grafik/palette.js`, [Tileset.md](Tileset.md)) und die Signalfarben, dazu die Palette für Farbenblinde; dokumentiert an einer Stelle in [Anzeige.md](Anzeige.md)
+ Titelbilder als Fortschritt (siehe [Titelbildschirm.md](Titelbildschirm.md), Entscheidungen): die Chronik zählt nur in den Spielarten, die freischalten dürfen, als Liste der zählenden statt `SPIELARTEN_OHNE_ZAEHLER`, damit eine neue Spielart von selbst nichts freischaltet; ein neu freigeschaltetes Bild zuerst zeigen und im Fenster `ende` melden; die Bilder selbst entstehen mit dem Inhalt
+ Ablage: die Zugriffe auf `localStorage` in `src/main.js` hinter eine Schnittstelle (lesen, schreiben, löschen je Schlüssel), damit später Dateien darunter liegen können (siehe [Ausblick.md](Ausblick.md), Spielstände als Dateien); dauerhaften Speicher anfordern (`navigator.storage.persist()`); im Titel Läufe und Chronik als Datei sichern und wieder laden (Wechsel des Browsers, Sicherung von Hand); im Spielmenü "Speichern und zum Titel"
+ Offenes aus dem Schema in [Oberflaeche.md](Oberflaeche.md) und [Titelbildschirm.md](Titelbildschirm.md), Ideen für später

## 13. Darstellung

Status: zurückgestellt, Entwurf in [Animationen.md](Animationen.md) und [Tileset.md](Tileset.md), Varianten und Bewegung; reine Anzeige ohne Einfluss auf die Logik

+ Gerüst für Effekte im Bildtakt statt `src/anzeige/animation.js`
+ Kampfanimation: schwebende Zahlen für Schaden, Krit und Heilung, Aufblitzen bei Treffern, Explosion und Schwall aus der Meldung `flaeche`, Geschosse
+ Varianten und Schmuck für Boden und Wand, Vorderseite der Wand
+ Bewegte Tiles
+ Rüstung und Schmuck verändern das Aussehen von Ninkasis Tile: je Platz am Körper eine eigene Pixelschicht über dem Grundtile (siehe [Tileset.md](Tileset.md))
+ Metaeffekte des Pegels und der LP (siehe [Oberflaeche.md](Oberflaeche.md), Klassen der Elemente)
+ Weiches Scrollen der Kamera (siehe [Anzeige.md](Anzeige.md), Kamera)
+ Licht: leuchtende Pixel (Augen, Glut) nach der Abdunklung neu zeichnen, mit einer Maske je Tile; Flackern über den kosmetischen Zufall; dieselbe Abdunklung auch für erinnerte Felder (siehe [Anzeige.md](Anzeige.md), Anzeige und [Tileset.md](Tileset.md))

## 14. Mit dem Inhalt

Status: offen; was der Inhalt abdecken muss, damit keine Mechanik ungenutzt bleibt; jeweils mit dem Spieldesign in den Design-Dokumenten

+ Skillkatalog nach dem Entwurf aus Punkt 20, darin Kennerschaft, Nachtsicht und Fernsicht als Skills, ein Skill gegen den Psi-Rückschlag (Modifikatoren auf Psi-Schaden verstärken auch den Rückschlag, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten), Kampfwerte aus Skills (Ausweichen aus Gewandtheit, Widerstand gegen Gift aus Trinkfestigkeit), Tragkraft; Makel und Vorzüge in der Charaktererstellung mit ihrem Katalog (siehe [Charakter.md](Charakter.md), Charaktererstellung)
+ Ninkasis eigene Fähigkeiten statt der `testfaehigkeit`
+ Zustände im Inhalt, darunter Benommenheit und Ersticken statt Giftschaden
+ Erster Auslöser im Inhalt (z.B. Säurespritzer des Essigbakteriums beim Tod)
+ Waffen mit Muster (Rundumschlag, Speer), Gegner mit Wurfgegenständen, Flüche und unbekannte Gegenstände (die Biersorten nutzen die Gruppe `biere`), ein Gegenstand mit `fluch_aufheben`
+ Ob gebundene EP für Tötungen durch Beschworene in den Skill der Beschwörung fließen (siehe [Charakter.md](Charakter.md), Erfahrungspunkte (EP))
+ Dienste des Hubs, Reparieren, Verwertung der Reste als Material, leere Flaschen werfen und befüllen
+ Verderben weiterer Dinge (Zutaten, Leichen), Leichen als gärende Hinterlassenschaft
+ Mehr Ebenenarten, Themenräume, Hebel mit Wirkung in der Ferne, verschlossene Türen mit Schlüssel (Ideen in [Ausblick.md](Ausblick.md), Themenräume und Rätsel)
+ Abstraktes Nachholen verlassener Ebenen, falls die Machtkurve es verlangt (siehe [Ausblick.md](Ausblick.md), Nachrückende Gegner)
+ Ruf bei ganzen Fraktionen: weitere Taten (siehe [Ausblick.md](Ausblick.md), Fraktionen: Ruf und Beistand)

## 16. Ebenenbau

Status: offen, in eigenen Sitzungen; das Spieldesign steht in [Spielverlauf.md](Spielverlauf.md), Ebenenbilder und Übergänge

+ Ebenenbilder als Daten: Bauweise, Wand- und Bodentiles, Ausstattung, Gegner
+ Übergänge über mehrere Level: der Plan des Laufs gibt jeder Tiefe einen Anteil je Bild, die Ebenenschritte lesen ihn; die Merkmale dürfen versetzt überblenden (siehe [Welt.md](Welt.md), Plan des Laufs)
+ Feste Strukturen und Raumstrukturen in den zufälligen Ebenen (siehe [Ausblick.md](Ausblick.md), Feste Strukturen), darunter Fundorte von Kulturen: ein alter Kessel mit Gärrest in der ersten Ebene, alte Flaschen in Schatzkammern (siehe [Brauen.md](Brauen.md), Kulturen)
+ Ebenen unter freiem Himmel
+ Hub zwischen den Kapiteln im Plan des Laufs: der Lauf beginnt im leeren Hub, nach dem Boss führt der Weg in den Hub der nächsten Stufe, Figuren aus den Leveln seit dem letzten Boss ziehen ein (siehe [Spielverlauf.md](Spielverlauf.md), Hub); heute steht der Hub im Probeinhalt als Tiefe 0 vor dem ersten Level
+ Weiche Spielart (siehe [Spielverlauf.md](Spielverlauf.md), Hub): Eintrag in `SPIELARTEN`, bei jedem Betreten des Hubs ein Schnappschuss im Speicherstand (am Haken `ebene_betreten`, also beim Ankommen; ein späteres Betreten ersetzt ihn), nach dem Tod ein Fenster mit Aufgeben (weiter wie mit Permadeath zu `ende`, `laufAbschliessen`) oder Rückkehr (Schnappschuss einsetzen, kein Eintrag in die Chronik), Auswahl im Titel; die Rückkehr übernimmt `oberflaeche.gesehen` aus dem laufenden Stand statt aus dem Schnappschuss, sonst zählt `gesehen.<typ>` doppelt; die Aufzeichnung führt vom Schnappschuss beim Betreten des Hubs weiter, der Zweig von dort bis zum Tod fällt weg

## 18. Korpustexte aus dem Gilgamesch-Epos

Status: in Arbeit; das Epos ist ganz nachgedichtet (siehe [Texte.md](Texte.md), Korpus)

+ `ungnad1911gilgamesch` (gemeinfrei) aus `sprache/Literatur/` einlesen und an ausgewählten Stellen Varianten (`-b`) mit seiner Lesart gewinnen, in beiden Sprachen
+ Weitere Werke aus dem eBL-Korpus nach Bedarf (umgesetzt: Ištar, Gilgamesch, Dattelpalme und Weinstock, Maqlû, Omen der Schenke; siehe [Texte.md](Texte.md), Korpus)

## 19. Auszeichnung in Texten

Status: offen

+ Eine kleine Auszeichnung nach Markdown in den Sprachdateien: `**fett**`, `*kursiv*`, `\n` als Zeilenumbruch, eine Leerzeile als neuer Absatz; heute sind Texte schlichte Zeichenketten mit Platzhaltern (siehe [Texte.md](Texte.md), Sprachdateien), ein `\n` wird zum Leerzeichen und Sternchen erscheinen wörtlich (so in `glossar.hopfen.erklaerung`)
+ Eine Funktion in `src/anzeige/texte.js` maskiert den Text und setzt danach die Auszeichnung in HTML um; wo kein HTML entsteht (Log, Tooltips), entfernt sie nur die Zeichen
+ Alle Fenster zeigen Texte über diese Funktion; heute maskieren Log, Titel und Systemfenster, während Hilfe und Einstellungen Texte roh als HTML einsetzen (z.B. `src/anzeige/einstellungsanzeige.js`)
+ `tests/sprachen.test.js` prüft, dass jede Auszeichnung geschlossen ist; das Kompendium zeigt die Auszeichnung ebenso

## 20. Umsetzung der Skills

Status: Entwurf aller Kategorien steht in [Skills.md](Skills.md), offen ist die Umsetzung; das Dokument ist der Skillkatalog im Entwurf und gehört zu den Grundfesten des Spieldesigns

+ Vor dem ersten festen Skillnamen im Namensbuch: eine Regel für Skills, die gestrichen werden, während alte Spielstände Lernpunkte in ihnen halten (Vorschlag: sie werden zu freien EP, wie alles, was kein Skill aufnehmen kann); umbenannte gehen schon über `daten/umbenennungen.js` (siehe [Architektur.md](Architektur.md), Inhalte als Daten)
+ Alle Kategorien entworfen: Körper und Bewegung, Stoffwechsel und Pegel, Wahrnehmung, Kampf, Brauen, Anlagen und Fallen, Soziales, Magie, Psi; offen bleibt die Umsetzung je Kategorie, wie unten aufgeführt
+ Angeborene Grundfähigkeiten: körperliche ohne Vorrat (Faustschlag, Werfen), die Gaben der Göttin ohne Vorrat (Brauen) und höchstens eine je Vorrat; die erste ist der Sprint, die zweite das Meditieren für die MP, die dritte das Zeitblinzeln für die PP (siehe [Charakter.md](Charakter.md), Skills)
+ Lernanlass `entkommen` für Laufen und Sprint: zählt, wenn ein Wesen Ninkasi aus dem Kampf verliert, während sie läuft oder sprintet, je Wesen einmal wie alle Anlässe (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Lernanlass `berauscht` für die Skills des Stoffwechsels: zählt, wenn Ninkasi an einem Wesen wirkt, während ihr Pegel über einer Schwelle liegt (mit den Tags der Wirkung, damit etwa die Trunkene Faust nur aus waffenlosem Kampf im Rausch lernt) (welche, mit den Pegelschwellen aus Punkt 10), je Wesen einmal
+ Lernanlass `erspaeht` für die Skills der Wahrnehmung: zählt, wenn Ninkasi ein Wesen wahrnimmt, das sie noch nicht bemerkt hat, je Wesen einmal; Tags nach der Art: `fern` jenseits der halben Sichtweite, `finster` und `dunkel` nach der Lichtstufe auf dem Feld des Wesens, `gespuert`, `gehoert`
+ Lernanlass `hinterhalt` für Schleichen (heute nur Meldung `hinterhalt`, siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Gebundene EP ohne Tod: Kennerschaft bekommt je erkanntem Typ einen festen Betrag (Regelwert), Fallengespür beim Entdecken einen festen Teil der EP der Falle, das Entschärfen den Rest; Fallen und Typen bleiben so je Ebene bzw. Lauf endlich
+ Gespür für Schätze und für Magie brauchen einen Sinn, der Gegenstände wahrnimmt; die Sinne im Register `sinne` nehmen bisher nur Wesen wahr
+ Lauschen braucht einen Modifikator auf die Reichweite, mit der Lärm Ninkasi erreicht, die Nennung von Art und Anzahl im Log (Lärm eines Zugs gebündelt) und die Art der Wahrnehmung `gehoert` für die Anzeige auf der Karte
+ Kampf: Tags für Gattung und Handhabung an den Angriffsprofilen (`kurze_klinge`, `lange_klinge`, `wucht`, `stange`, `zweihand`, `waffenlos`, `wurf`, `spann`, `feuer`, `druck`, `energie`), zugleich Lernanlass; im Probeinhalt ein kleiner Schritt in den Daten; Gattungen späterer Epochen mit `freischaltung` beim ersten Fund
+ Trunkene Faust: Torkeln über `pegel_ab` (steht), Tritt als zweites Profil mit `chance` am angeborenen Angriff und Stoßen (steht), Gegenwurf als Auslöser am Skill bei `ausgewichen` (braucht den Auslöser mit Filter auf den Grund, Punkt 8) und einen Zustand "umgeworfen" mit `wehrlos`
+ Verteidigung: Obergrenze des Widerstands als Regelwert (Entwurf `regeln.kampf.widerstandHoechstens` 90 %, gilt für Widerstand aus Modifikatoren, nicht für `immun` in den Daten); Rettungswurf der Reaktion gegen Fallen (eine eigene Verteidigung neben `ausweichen` und `willenskraft` oder ein Trefferwurf im Effekt der Falle); Parieren braucht Blocken nur gegen Angriffe mit dem Tag `nahkampf` und eine angelegte Nahkampfwaffe; Ausweichschritt und Riposte als Auslöser am Skill bei `verfehlt` mit Grund (Auslöser mit Filter, Punkt 8), der Ausweichschritt als Bewegung ohne Zeit
+ Ringen: Zustand "festgehalten" (keine Bewegung, weniger Ausweichen, nicht wehrlos, endet, wenn die Haltende sich entfernt oder loslässt); Griffe als Fähigkeiten mit einer Bedingung "Ziel von mir festgehalten", die den Zustand danach beenden; eine Größe der Wesen erst mit dem Inhalt
+ Nahkampf mit Waffen: Tags der Waffentypen für die Spezialisierungen (`dolch`, `braupaddel` usw.); göttliche Tiers brauchen die Zustände Blutung und betäubt (mit der Betäubung aus Punkt 10) und einen Auslöser, wenn ein Feind in die Reichweite tritt (Haken `betritt_feld`); Eigenheiten einzelner Waffen über ihre Daten (Kosten, `linie`, `angrenzend`, `unblockbar`, `ignoriert_ruestung`)
+ Handhabung: Lernanlässe nach der Belegung der Hände (Tags `zwei_waffen` und `einhand_frei`, gesetzt nach dem, was angelegt ist); Fechten braucht eine Bedingung "zweite Hand frei", die Finte einen Zustand mit weniger Verteidigung; der Durchschlag braucht den übrigen Schaden eines tödlichen Treffers
+ Schilde und Präzision: Blocken des Schilds nur gegen Nahkampf und Geschosse (Magie, Psi und Strahlen nach den Daten des Schilds); Gewicht und Verlangsamung des Schilds über Schildkampf statt über die Rüstungsskills; Deckung als Minderung von Flächenschaden; Zurückwerfen als Auslöser bei `verfehlt` mit Grund `geblockt` (Auslöser mit Filter, Punkt 8); Lernanlass `kritisch` (Haken `nach_treffer` mit `kritisch`), je Wesen einmal; Präzision nur für Angriffe mit `nahkampf`, `fernkampf` oder `wurf`; ein Zustand "verwundbar" mit weniger Rüstung
+ Standfestigkeit mildert über `rausch.<veraenderer>`, `rausch.filmriss` und `risiko.<ausgang>` (stehen, siehe [Wesen.md](Wesen.md), Stoffwechsel); der Tier Experte von Abschirmen ("Jägerinnen finden Ninkasi später") braucht einen Modifikator auf das Eintreffen (`regeln.glimmer.eintreffen`); Rauschgeist braucht die Verschiebung der Kurve zu niedrigerem Pegel (negatives `kurvenverschiebung.pp`, rechnerisch möglich, ungetestet)
+ Kampftrinken, Rauschkraft und Fontäne: ein Modifikator auf die Zeitkosten des Trinkens; Trinken aus einem angelegten Gefäß (ein Platz oder die Hand als Quelle des Befehls `trinken`); ein zweiter Schluck in einer Aktion; Rauschkraft über Modifikatoren mit `pegel_ab` und dem Tag `nahkampf` (steht), dazu mildere Betäubung im Rausch; die Fontäne als Fähigkeit mit Zielmuster Kegel, Kosten an Pegel und dem Effekt des zuletzt Getrunkenen, Tag `fontaene`
+ Abwehr nach Kategorien: innere Schadensarten (Gift, Alkohol, Infektion) bei Stoffwechsel und Pegel, äußere (Feuer, Säure, Lauge, Elektrisch) bei Kampf, Verteidigung, Magie und Psi in ihren Kategorien
+ Brauen, alles mit dem Brausystem aus Punkt 23: angeborene Fähigkeit `brauen`; ein Wert der Kräuterkunde aus dem Set Kräuter und Würze für die Vermutung über unbekannte Kräuter; Alchemie auf die Chance der Absicht und das Misslingen des Absuds; Tags an den Rezepten für die Art der Zutaten, die Kultur und die Schule (Entwurf `getreide`, `frucht`, `honig`, `kraeuter`, `milch`, `tee`, `hopfen`, `bierhefe`, `weinhefe`, `wilde_hefe`, `sumerisch`, `spontan`, `reinheitsgebot`, `hopfenstopfen`), zugleich Lernanlass beim ersten Gelingen eines gefundenen Rezepts; Hausrezepte als Typen, die im Lauf entstehen, mit erzeugtem Namen und ohne `ep`; Stapeln nach Rezept und Gütestufe; Freischaltung von Hopfen, Reinheitsgebot und Hopfenstopfen beim ersten Hopfenfund; der Schnellsud braucht eine Bedingung für das Brauen (kein Kampf, keine Feinde in der Nähe), die seine Tiers lockern, und den Feldsud; Kulturen, die sich durch Gebrauch verbessern, und Skills auf `brauen.vertraegt`; das Ernten über die Sets der Rohstoffe; Kampfrausch hebt den Pegel bei Treffern
+ Anlagen und Fallen: Kenntnis der Fallen je Heimatebene statt "Wesen mit KI meiden alle Fallen" (siehe [Welt.md](Welt.md), Gelände): ein Wesen kennt die Fallen der Ebene, auf der es erzeugt wurde, Ninkasis eigene keiner; Entdecken als Wert auch an Gegnern, ein Rettungswurf gegen Fallen für Gegner; Entschärfen als Befehl mit Chance und Auslösen beim Fehlschlag; Fallen als Gegenstände zum Aufstellen (Befehl mit Zeitkosten) und Bergen, gestellte Fallen mit Ninkasi als Urheberin und dem Tag `falle`; Laden einer Falle mit Gebrautem, dessen Effekt die Falle in ihrer Zielart wirkt; Schlösser an Türen und Truhen mit Befehl und Lernanlass, Verschließen; Arten von Anlagen mit Etikett und Lernanlass beim ersten Inbetriebnehmen je Art, Überlasten; Reparatur als Befehl mit Werkzeug und Material, ohne gebundene EP; Bauen von Barrikaden braucht veränderbares Gelände (siehe [Ausblick.md](Ausblick.md), Veränderbares Gelände)
+ Soziales: Befehl `sprechen` mit Gesprächen als Daten (siehe [Ausblick.md](Ausblick.md), Handel, Währung, Gespräch), Wahlen mit der Bedingung Skillstufe und den Tags der Arten (`ueberreden`, `einschuechtern`, `verfuehren`, `luegen`) als Lernanlass; ein Merkmal "versteht" an Wesen für Gespräch und Täuschung; kampflos bewältigt als neuer Abschluss neben dem Tod, der das Beitragsbuch auszahlt, je Wesen einmal, danach ohne EP (Ergeben, Abzug, Freundschaft, Zähmen, Bekehren); Wettrinken als lange Aktion zweier Wesen mit Pegel und Schwelle; Lernanlass erster Handel je Händler und erste Schwelle des Rufs je Fraktion; Zähmen und Gezähmte als Begleiter mit dem Tag `begleiter` und dem Tag ihrer Gattung (`hefe`, `bakterie`, `schimmel`, `tier`, `automat`); Obergrenze der Verbündeten als Wert, den Führung hebt; Ausbildung braucht Punkt 21
+ Magie: Tags der Schulen (`zerstoerung`, `bann`, `segen`, `fluch`, `beschworen`, `hellsicht`), der Wege (`formel`, `alchemie`, `gabe`, ein eigener für die Zauber des Braupaddels) und `ritual` an Fähigkeiten, zugleich Lernanlass; Lernanlass Kritisch mit dem Tag `magie` für den Fokus; Meditieren als angeborene Fähigkeit: Beginn nur außerhalb des Kampfes, ein Zustand "Sammlung", der mit der Zeit bis zu einer Obergrenze wächst und mit einer Kurve über den Pegel (Optimum bei leichtem Pegel, siehe [Wesen.md](Wesen.md), Stoffwechsel), Ende beim ersten eigenen Schaden genommen oder ausgeteilt (Haken `nach_schaden`), Entladung je Art als Buff oder als Verstärkung des ersten Angriffs, MP schneller während der Sammlung; ein Modifikator, der den Kampfzustand früher enden lässt; das verzauberte Braupaddel als Waffe mit gewährtem Zauber und Ladungen, zwei Skills mit gleichem Namen und eigener Kennung; Schriftrollen schreiben als Befehl, nur nüchtern; Magieabwehr als Widerstand gegen `magie` und gegen Zustände mit dem Tag `magie`
+ Psi: Tags der Disziplinen (`telepathie`, `furcht`, `kontrolle`, `ortswechsel`, `psychokinese`, `vorahnung`) an Fähigkeiten, zugleich Lernanlass; Lernanlass Kritisch mit dem Tag `psi` für die Schärfe, Fehlschlag und Rückschlag als Lernanlass der Selbstbeherrschung; der Rückschlag auf das Ziel statt auf Ninkasi als Ausgang der Risikotabelle; Glimmer als Wert mit Folgen (Psi-Jägerinnen, Geister) und ein Modifikator, der sein Wachsen bremst; Ekstase als passiver Zustand, der ab einem Pegel im Kampf mit Schaden genommen und ausgeteilt wächst, auf dem Gewinn der PP je Treffer (siehe [Wesen.md](Wesen.md), Stoffwechsel)
+ Zeitblinzeln (Spieldesign in [Skills.md](Skills.md), Psi): Haltepunkte als Kopien des Zustands vor den letzten eigenen Zügen (der Schnappschuss existiert, siehe [Architektur.md](Architektur.md), Speichern); die Umkehr ist selbst ein Befehl, beim Nachspielen entstehen dieselben Haltepunkte von selbst; der Zufallszustand kehrt mit zurück; nach der Umkehr übertragen: Erinnerung der Karte, Kosten und Abklingzeit des Blinzelns, Glimmer; verworfen: EP und Meldungen der verworfenen Zeit, das Log vermerkt die Vorahnung; zu klären: ob Haltepunkte in den Spielstand gehören; Vorkehrung weiter: alles außerhalb des Zustands ableitbar halten (räumlicher Index, Zwischenspeicher) und nichts Laufbezogenes in die Chronik schreiben, bevor der Lauf endet; Umbaurisiko mittel; die Vision des göttlichen Tiers braucht einen Lauf auf einer Kopie des Zustands (siehe [Ausblick.md](Ausblick.md), Vorschau durch Simulation)
+ Probewerte aus dem Entwurf, bis die Skills umgesetzt sind: Zähigkeit LP von 100 auf 300 über vier Tiers, Regeneration der LP von 0 auf 1 je Tick, Laufen Kosten fürs Bewegen von 120 auf 80 über vier Tiers, Tragkraft von 20 kg auf 40 kg, Bremsen durch die Last von 100 % auf 50 %; Leber Abbau des Pegels von 100 auf 200 Hundertstel je Welttick über zwei Tiers, Rauschheilung Optimum der LP von 1,5 ‰ auf 3 ‰, Klarer Kopf Kurve der MP um 1 ‰ nach rechts, Rauschgeist Schwund der PP von 100 % auf 25 %, Abwehr Widerstand gegen Gift und Alkohol bis 50 %; Fernsicht Sichtweite von 6 leicht bis 10 (Grundtier), mit Experte und Meister bis 20; Dämmersicht `sichtAnteil.daemmrig` +25 (Grundtier), `sichtAnteil.dunkel` +50 (Experte); Nachtsicht Sicht im Finstern von 2 bis zur halben Sichtweite; Gespür für Wesen Reichweite von 0 auf 3; Fallengespür Entdecken von 30 auf 90; Kennerschaft von 0 auf 60, Verschleiß und Verderben bis 50 % langsamer; Ausweichen +4 je Stufe im Grundtier (wie heute im Probeinhalt); Abhärtung Widerstand bis 50 % aus Skills allein; Riposte 5 % je Stufe ab Meister; Faustkampf Schaden +10 % je Stufe im Experten-Tier, Kombination 5 % je Stufe, Faustwaffen bis Kosten 30 gegen 50 der bloßen Faust

## 21. Skills für Anhänger

Status: offen, ohne festen Platz; nach dem Umbaurisiko eingeordnet

+ Vorschlag: Gegner bekommen feste Werte in ihren Daten, Verbündete (Begleiter, das Tier der Jägerin) und die Geister früherer Läufe tragen Skills; die Geister brauchen das, weil sie den Build einer früheren Ninkasi tragen (siehe [Ausblick.md](Ausblick.md), Geister früherer Läufe)
+ Umbaurisiko gering: Modifikator- und Auslöserquelle `skills`, die Bedingung `skill_ab` und der Ausbau der Fähigkeiten lesen den Lernstand an jedem Wesen; an Ninkasi gebunden sind nur das Einrichten, das Gewinnen von EP mit dem Beitragsbuch, die Datenprüfung der Startskills und die Arena (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Umsetzung mit den Begleitern bzw. den Geistern früherer Läufe; das Set Ausbildung braucht es, damit Verbündete mitlernen (siehe [Skills.md](Skills.md), Soziales)

## 23. Brausystem

Status: in Arbeit; der Kern steht in [Sude.md](Sude.md) (Profil je Portion mit Restzucker, Zielgebiete, Befehl am Kessel, Wirkung sofort und über die Zeit, Kulturproben zum Aufheben, Nebel und Rezeptbuch, Reifen und Verderben, Verderber, spontane Gärung, Absud, Trockenbier), das Braufenster mit Spinnennetz in [Bedienung.md](Bedienung.md), Fenster, Spieldesign in [Brauen.md](Brauen.md)

Schnitt der Versionen: als Nächstes Kessel als Gegenstand, danach moderne Stile

+ Reiter für Getränke und Kulturen im Inventar
+ Rezepte: die EP beim ersten Gelingen eines gefundenen Rezepts gebunden statt frei, mit den Tags der Rezepte und den Brauskills (Punkt 20); eigene kleine Zielgebiete gefundener Rezepte, nur mit ihrem Kniff erreichbar; ein eigenes Fenster des Rezeptbuchs außerhalb des Kessels; der Punkt des Rezepts im Spinnennetz
+ Zielgebiete der modernen Stile aus `daten/bierstile.js`, Hopfen; dafür die Achse der Stammwürze bis 30 °P (die stärksten Stile reichen bis 28 °P), die Gärungsart der Stile (untergärig, obergärig, gemischt, spontan) als Eigenschaft der Kulturen und Spannen auf den Aromaachsen von Hand
+ Wirkung: Röst, Rauch, Schutz durch Säure als Zustände; Zusätze, Kulturen und Fähigkeiten als weitere Quellen der Wirkung; Potenzen und Exponenten der Brauwirklichkeit als Kurven, wenn die linearen Formeln nicht tragen
+ Verderben: Hygiene als Einfluss auf die Chance, Skills auf `brauen.haltbarkeit`; die Zahlen der Stufen, des Reifens, des schwachen Wurfs und des Verderbers nachregeln
+ Später zum Absud (der Kern steht in [Sude.md](Sude.md), Absud): Güte der Zutaten und Magie als Quellen der Mächtigkeit, ob der Absud MP kostet (siehe [Brauen.md](Brauen.md), Offen), Rezepte des Absuds (das Schema der Rezepte mit der Richtung statt des Zielgebiets, darunter der Säureschutz), Posca und Oxymel als solche Rezepte mit Essig, die Brennblase für Brand mit dem Kessel als Gegenstand
+ Kessel als Gegenstand, Tiers nach Material; ein Kessel im Hub
+ Später zum Trockenbier (der Kern steht in [Sude.md](Sude.md), Trockenbier): die Tiers des Schnellsuds als Skill (Punkt 20), der Feldsud, eine Fackel in der Hand als Hitze, das geworfene Trockenbier (siehe [Brauen.md](Brauen.md), Trockenbier und Sud im Kampf)
+ Stapeln nach Stufe des Verderbens; freie Sude als Einzelstücke, bis sie Hausrezept werden (heute nach gerundetem Profil, Zielgebiet, Güte und gefundenem Rezept)
+ Der Zufallsbot braut selten (er steht kaum mit Zutaten und Flaschen an einem Kessel) und rührt darum auch kein Trockenbier an; ein Bot, der Zutaten sammelt und zum Kessel geht, mit der eiligen Strategie (Punkt 10)
