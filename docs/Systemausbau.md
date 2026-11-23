# Battle Ninkasi - Systemausbau

Stand: 2026-11-23

Mitprüfen bei Änderungen: alle Dokumente, deren Punkte hier umgesetzt werden

Arbeitsliste der offenen Arbeit an Systemen, Werkzeugen und Doku, bevor und während der Inhalt entsteht. Was umgesetzt ist, steht im zuständigen Dokument, wie es dazu kam, in der Git-Historie; wie Punkte entstehen und gestrichen werden, regelt [Dokumentation.md](Dokumentation.md), Lebenslauf einer Aussage. Ideen ohne Entscheidung stehen in [Ausblick.md](Ausblick.md), offene Fragen des Spieldesigns in [Grundlagen.md](Grundlagen.md), Offen und [Charakter.md](Charakter.md), Offen.

## Arbeitsweise

+ Jeder Punkt wird vor der Umsetzung als Vorschlag ausgearbeitet und freigegeben
+ Status je Punkt: offen oder in Arbeit
+ Konkreter Inhalt (Gegner, Gegenstände, Effekte, Skills, Fähigkeiten, Rituale, Quests, Raumstrukturen) entsteht erst, wenn die Punkte 3 bis 11 erledigt sind; bis dahin gibt es nur Probeinhalt zum Ausprobieren der Systeme (siehe [Entwicklung.md](Entwicklung.md), Probeinhalt)

## Reihenfolge

Stand 2026-11-23, vor dem Inhalt in dieser Folge, die Systemlücken nach ihrer Wirkung auf den Inhalt, das Kleine und Breite zuerst:

1. Licht und Wahrnehmung (Punkt 3)
2. Englisch, Mehrzahl und Glossar (Punkt 9)
3. Spieldesign vor dem Inhalt mit der Machtkurve (Punkt 10)
4. Anleitungen, Werkzeuge und Grundgerüst (Punkt 11)
5. Danach der Inhalt (Punkt 14)

Daneben, ohne festen Platz: kleinere Reste der Systeme mit dem ersten Bedarf (Punkt 8), Oberfläche (Punkt 12); zurückgestellt: Darstellung (Punkt 13). Erledigt sind Punkt 1 (Probeinhalt auslagern), Punkt 2 (Probedurchstich), Punkt 4 (Ersatzwirkungen), Punkt 5 (gewährte und gelehrte Fähigkeiten), Punkt 6 (Teilung und Wachstum), Punkt 7 (KI: Unterstützung und Umherziehen) und Punkt 15 (Reste des Effektsystems), die Nummern der übrigen bleiben.

Die Proben des Probedurchstichs stehen in `tests/probedurchstich.test.js`; jede Lücke dort ist ein Test mit `todo` und dem Punkt, der sie schließt, mit einem Entwurf der Daten (siehe [Entwicklung.md](Entwicklung.md), Tests und Balancing). Wer einen Punkt umsetzt, nimmt dort das `todo` weg.

## Bekannte Fehler

+ Derzeit keine

## 3. Licht und Wahrnehmung

Status: offen, erst Recherche, dann neu designen und überarbeiten

+ Probe: der Kontrolleur mit Taschenlampe bemerkt Ninkasi im Dunkeln nur im Schein seiner Lampe

+ Helligkeit je Feld, Lichtquellen, Licht im Renderer (Ideen in [Welt.md](Welt.md), Licht); ohne Angabe gilt jedes Feld als hell, das Spiel verhält sich dann wie bisher
+ Licht in der Wahrnehmung (Brogue: Heimlichkeitsweite im Licht doppelt, im Dunkeln halb), Spüren ohne Licht, Spur als Geruch (Duftkarte nach Brogue, passend zu Mikroorganismen, die entlang von Wegen spüren); Ideen in [Wesen.md](Wesen.md), Wahrnehmung
+ Art der Wahrnehmung statt ja oder nein (gesehen, gespürt, kartiert), die neue Systeme statt `istSichtbar` fragen (siehe [Ausblick.md](Ausblick.md), Hellsicht, Spüren, Unsichtbarkeit)
+ Licht durch Feuer; Nachtsicht und Fernsicht als Modifikatorziele für spätere Skills
+ Offene Fragen des Spieldesigns in [Grundlagen.md](Grundlagen.md), Offen
+ Die Ideen an den genannten Stellen werden dabei an einer Stelle zusammengeführt

## 8. Kleinere Reste der Systeme

Status: offen, jeweils mit dem ersten Bedarf

+ Ladungen als Verbrauch einer gewährten Fähigkeit (Zauberstab, Regel in [Grundlagen.md](Grundlagen.md), Spielkern): Entwurf `verbrauch: { ladungen: 1 }`, bezahlt vom zuerst angelegten Gegenstand der Quelle, der noch Ladungen hat; jede gewährte Fähigkeit kennt ihre Quelle (`gegenstandId`, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten); das Fähigkeitenfenster zeigt die Summe der Ladungen
+ Lesen mit Ziel: eine Rolle wirkt eine Fähigkeit einmal, ohne sie zu lehren (Entwurf `lesbar: { faehigkeit }`, Befehl `lesen { gegenstandId, ziel? }` über den Zielmodus); heute wirkt ein lesbarer Gegenstand nur auf die Leserin
+ Haken `zug_beginn` in Betrieb nehmen
+ Ersatzwirkungen an weiteren Haken "davor" (z.B. `vor_angriff` für ein Ausweichen aus Daten) und eine Barriere als Puffer mit Fassungsvermögen statt ganzer Treffer (Entwurf `fasst`, Vorbild ToME), siehe [Wirkungen.md](Wirkungen.md), Ersatzwirkungen
+ Auslöser mit Filter auf den Grund des Ereignisses (`verfehlt` mit `grund: "geblockt"`), etwa für Verschleiß eines Schilds beim Blocken; Verschleiß durch Gebrauch bleibt bis dahin ausgeschlossen (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß)
+ Angefressene Waffen: wie sie schwächer werden, braucht einen Eingriff in die Schadensrechnung (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß)
+ Sturz in einen Abgrund auf die Ebene darunter (siehe [Wesen.md](Wesen.md), Bewegung)
+ Abzug einer Anforderung nur für den Angriff mit genau dieser Waffe (über Tags der Profile)
+ Lernanlässe für das Bewältigen von Fallen, Schlössern und Rezepten, mit diesen Systemen
+ Ausdrückliches Suchen nach Fallen (mehrere Züge, doppeltes Entdecken), vielleicht zusammen mit dem Rasten
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud), erst wenn mehr als die Beteiligten gefragt werden
+ Nach dem Anspielen prüfen, ob die Sichtlinie Ersatzlinien oder einen symmetrischen Schattenwurf braucht (siehe [Wirkungen.md](Wirkungen.md), Zielauswahl)
+ Gewichtung `anteil` der gebundenen EP zum Vergleich mit `erste`; Ortsbindung des Verteilens (`regeln.lernen.ort`), falls gewünscht
+ Leistung, wenn viele Wesen zugleich jagen (etwa nach Teilungen um Ninkasi): 389 Wesen etwa 12 ms je Befehl gegen das Ziel 2 ms für 300 (siehe [Entwicklung.md](Entwicklung.md), Messwerte); mit dem ersten Inhalt, der so viele Teilende bringt, Zielwahl der Handlungen und Umkreissuche verbessern, dazu einen Zähler je Typ für `anzahl_unter`

## 9. Englisch, Mehrzahl und Glossar

Status: offen

+ Englische Sprachdatei mit eigener Grammatik (a/an); Texte werden im Englischen frei nachgeschrieben, nicht Satz für Satz übersetzt; ab dann entsteht jeder Text in beiden Sprachen
+ Die Datenprüfung meldet jeden Schlüssel, der in einer der Sprachen fehlt
+ Mehrzahl in beiden Sprachen (Holzpantinen), Adjektivendungen für Affixe (siehe [Texte.md](Texte.md), Sprachdateien)
+ Anrede einheitlich: Oberflächentexte sprechen die Spielerin mit "du" an, erzählende Texte (Log, Beschreibungen) bleiben in der dritten Person über Ninkasi, ein Lauf heißt "Lauf" (offen in [Texte.md](Texte.md), Offen)
+ Glossar der Fachbegriffe des Brauens als Daten mit Deutsch, Englisch und kurzer Erklärung; daraus ein Wörterbuch de-en und en-de im Kompendium, später das Glossar im Spiel (siehe [Ausblick.md](Ausblick.md), Bestiarium, Glossar, Rezeptbuch)

## 10. Spieldesign vor dem Inhalt

Status: offen; jeweils zuerst in [Grundlagen.md](Grundlagen.md) oder [Charakter.md](Charakter.md) entscheiden, mit Recherche bei anderen Spielen

+ Zeitskala: Maßstab für schnell und langsam bei Wesen, Waffen und Aktionen; Idee: Ninkasi ist von Haus aus etwas langsamer als der Standard, erst Bewegungsskills machen sie schneller, Alternative: Skills senken die Kosten nur für Nahkampf oder nur für Zauber; die Anzeige der Restdauer in Zügen hängt daran (siehe [Bedienung.md](Bedienung.md), Untersuchen)
+ Pegelschwellen mit Wirkung, darin Torkeln aus dem Pegel und die Folgen von Rückschlag und Glimmer (offen in [Grundlagen.md](Grundlagen.md), Spielkern)
+ Brausystem: Kern des Spiels, bestimmt Zutaten, Gegenstände, Beute, Orte und Rezepte; Brauen danach als eigene Art langer Aktion (offen in [Grundlagen.md](Grundlagen.md), Spielkern)
+ Machtkurve: Budget je Tiefe für alle Arten von Inhalt als Regelwerte, ein Werkzeug warnt bei Ausreißern; braucht Zeitskala, Pegel und Brausystem; darin:
  + Länge und Ziel eines Laufs (offen in [Grundlagen.md](Grundlagen.md), Offen)
  + Ninkasis Grundausstattung als Bezug: was sie ohne Skills auf der ersten Tiefe kann
  + Ökonomie der Vorräte als ein Kreislauf mit Skill- und Brausystem: Rasten und Regeneration, Bier als Heilung, Brauen als Quelle, Skills als Hebel, Druck gegen endloses Rasten, Ausdauer und Nahrung (siehe [Ausblick.md](Ausblick.md), Druck gegen endloses Rasten)
  + EP aus Erkundung gegen EP aus Gegnern, bezogen auf die zu erwartenden Skillstufen je Ebene und die Builds, die daraus folgen (Messwerte in [Entwicklung.md](Entwicklung.md), Messwerte)
  + der Befund der Arena, dass Ausrüstung und Skills bisher wenig ändern
+ Flüssigkeiten und Gase: tiefes Wasser, Strömung und Schwimmen, Fließen, Verdunsten zu Gas, Schwere des Gases und vor allem, ob Flüssigkeiten sich mischen, weil das Mischen das Format der Feldschichten ändert und am Brausystem hängt (siehe [Ausblick.md](Ausblick.md), Flüssigkeiten und Gase)
+ Inhaltsplan grob: Thema je Tiefe, Gegnerfamilien (Mikroorganismen mit eigener Mechanik, Bosse, offen in [Grundlagen.md](Grundlagen.md), Gegner), Rolle des Hubs; im Einzelnen zuletzt

## 11. Anleitungen, Werkzeuge und Grundgerüst

Status: offen

+ Anleitungen zum Anlegen von Inhalten, je Art eine (Gegner, Gegenstand, Effekt, Skill, Fähigkeit, Ritual, Quest, Raumstruktur): Datenformat, Einordnung in die Machtkurve, Tile nach der Fibel, Texte in beiden Sprachen, Tests; Form: Claude-Code-Skills unter `.claude/skills/`; Beispiel Gegner: Tiefe und Rolle geben das Budget, daraus Werte, Angriffe, Fähigkeiten und EP, dann Thema, Verhalten, Tile, Texte; braucht die Machtkurve (Punkt 10)
+ Tiles für das Grundgerüst vor dem ersten echten Inhalt: Tür offen und zu, Treppe hinauf und hinab, Feuer; danach `TILES_AUSSTEHEND` in `werkzeuge/luecken.js` leeren (siehe [Tileset.md](Tileset.md), Ablauf)
+ Testkammer: ein Feld zum Erzeugen über den Zielmodus wählen, Wesen und Gegenstände entfernen (siehe [Architektur.md](Architektur.md), Spielarten)
+ Arena: eigene Aufstellungen im Browser (siehe [Titelbildschirm.md](Titelbildschirm.md), Ideen für später), bessere Taktiken (Abstand halten, Engpass suchen), Statistiken über erzeugte Dungeons (siehe [Entwicklung.md](Entwicklung.md), Tests und Balancing)
+ Kompendium: Abdeckung der Texte je Eintrag (siehe [Texte.md](Texte.md), Offen)
+ Schutz der Ablagen: die gesammelten Kandidaten, darunter eine Prüfsumme des Codes im Spielstand, damit auch eine Codeänderung ohne neue Version alte Stände ungültig macht (siehe [Ausblick.md](Ausblick.md), Schutz der Ablagen)
+ Messung der Leistung mit dem heutigen Stand wiederholen (siehe [Architektur.md](Architektur.md), Leistung)

## 12. Oberfläche

Status: offen, ohne festen Platz in der Reihenfolge

+ Im Browser prüfen: Einstellungen, Tastenbelegung, Befehlszeile, Suche im Verlauf, Klicks in allen Fenstern, Titelbildschirm, Skillfenster, Charaktererstellung, Verteilen der EP, Inventarfenster; dazu kleine Nacharbeiten an den Fenstern und die Gestaltung des Titels
+ Laufen hält noch nicht an Abzweigungen in Gängen (wie DCSS)
+ Automatisches Erkunden über eine Dijkstra-Karte (Vorbild Brogue): Ziele mit Gewichten (unentdeckte Felder, erinnerte Gegenstände zum Aufheben), Gefahren und später Kosten je Gelände; heute geht es zum nächsten Rand (Quellen in [Ausblick.md](Ausblick.md), Recherche)
+ Gehörten Lärm nachprüfen, sobald Gegner untereinander kämpfen, Beschworene und Fallen Lärm machen (im Probeinhalt kommt er kaum vor)
+ Reise und Erkunden halten mit `kein_weg`, wenn eine entdeckte Falle den einzigen Weg versperrt; später vielleicht mit Nachfrage
+ Treppe per Maus (Reise zur Treppe und hinüber)
+ Fallenlassen einer Teilmenge (Abfrage der Anzahl)
+ Gefahreneinschätzung beim Untersuchen
+ Blocken in der angezeigten Chance; Vorschau von Wirkungen innerhalb eines Effekts (siehe [Ausblick.md](Ausblick.md), Vorschau durch Simulation)
+ Mindestpegel als Kante an der Schnellleiste; Restzeit des Verderbens im Gepäck ("frisch", "bald sauer")
+ Farbpalette des Spiels festlegen: die Farben der Oberfläche (heute verstreute Variablen in `stil.css`, Farben von Gelände und Schichten in `daten/zeichen.js`, Minikarte, Effekte des Titels in `src/anzeige/titeleffekte.js`) als eine benannte Liste mit Bedeutung, abgestimmt auf die Pixel-Palette (`grafik/palette.js`, [Tileset.md](Tileset.md)) und die Signalfarben, dazu die Palette für Farbenblinde; dokumentiert an einer Stelle in [Anzeige.md](Anzeige.md)
+ Offenes aus dem Schema in [Oberflaeche.md](Oberflaeche.md) und [Titelbildschirm.md](Titelbildschirm.md), Ideen für später

## 13. Darstellung

Status: zurückgestellt, Entwurf in [Animationen.md](Animationen.md) und [Tileset.md](Tileset.md), Varianten und Bewegung; reine Anzeige ohne Einfluss auf die Logik

+ Gerüst für Effekte im Bildtakt statt `src/anzeige/animation.js`
+ Kampfanimation: schwebende Zahlen für Schaden, Krit und Heilung, Aufblitzen bei Treffern, Explosion und Schwall aus der Meldung `flaeche`, Geschosse
+ Varianten und Schmuck für Boden und Wand, Vorderseite der Wand
+ Bewegte Tiles
+ Metaeffekte des Pegels und der LP (siehe [Oberflaeche.md](Oberflaeche.md), Klassen der Elemente)
+ Weiches Scrollen der Kamera (siehe [Anzeige.md](Anzeige.md), Kamera)

## 14. Mit dem Inhalt

Status: offen; was der Inhalt abdecken muss, damit keine Mechanik ungenutzt bleibt; jeweils mit dem Spieldesign in den Design-Dokumenten

+ Skillkatalog als eigene Sitzung, darin Kennerschaft, Nachtsicht und Fernsicht als Skills, ein Skill gegen den Psi-Rückschlag (Modifikatoren auf Psi-Schaden verstärken auch den Rückschlag, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten), Kampfwerte aus Skills (Ausweichen aus Gewandtheit, Widerstand gegen Gift aus Trinkfestigkeit), Tragkraft; Makel und Vorzüge in der Charaktererstellung mit ihrem Katalog (siehe [Charakter.md](Charakter.md), Charaktererstellung)
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
