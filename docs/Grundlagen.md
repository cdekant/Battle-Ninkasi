# Battle Ninkasi - Grundlagen

Stand: 2026-11-18

## Spiel

+ Dungeon-Crawler/Roguelike, rundenbasiert
+ Permadeath, kein dauerhafter Fortschritt zwischen den Läufen
+ Gesteuert wird nur Ninkasi
+ Zufällig erzeugte Dungeons
+ Hub: fester Ort zwischen den Ebenen mit Diensten (Händler u.a.), ähnliche Dienste unterwegs durch wandernde Händler und Nebengottheiten
+ Zielgruppe: zunächst nur privat, Steam als spätere Option, Steam Deck kein Ziel
+ Open Source: Code unter GPL-3.0-or-later, Texte und Grafik unter CC BY-NC-SA 4.0, siehe [LIZENZEN.md](../LIZENZEN.md)

## Spielkern

+ Ninkasi ist die Inkarnation der mesopotamischen Göttin des Bieres, alkoholaffin
+ Alkohol ist Ressource: Bier, Wein und Brand
+ Drei Vorräte: Lebenspunkte (LP), Magiepunkte (MP), Psi-Punkte (PP)
+ Dazu der Pegel, gemessen in Promille: 100 entsprechen 1 ‰, nach oben offen; in der Oberfläche als ‰, in Text und Doku "Pegel"
+ Magie und Psi sind getrennte Systeme mit eigenem Vorrat
+ Magie: gebunden an Ritual, Schrift und Alchemie, kostet neben MP auch Zeit und Material; langsamer, wirkt über die Zeit, etwas mehr in Richtung Crowd Control
+ Psi: sofort und rein geistig, hohes Risiko, hoher Ertrag; wirkt auf Einzelziele (Gedanken, Furcht, Kontrolle, Teleport); Wirksamkeit und Risiko steigen mit dem Pegel
+ Jeder Vorrat regeneriert mit eigenem Verlauf über den Pegel:
  + LP regenerieren immer, langsam (Vorbild: Brogue); ohne Pegel etwas langsamer, am schnellsten bei einem optimalen Pegel weit über dem von Normalsterblichen, darüber wieder abnehmend
  + MP regenerieren nüchtern am schnellsten, je höher der Pegel, desto langsamer
  + PP regenerieren nur bei hohem Pegel, je höher, desto schneller; unter einer niedrigen Schwelle schwinden sie
  + Regeneration und Schwund sind für jeden Vorrat möglich; Skills, Schriftrollen, Items und Zustände passen Rate, Schwund und Lage der Verläufe an, siehe [Architektur.md](Architektur.md)
+ Folge: Auf Magie bereitet man sich nüchtern vor, Psi braucht für Regeneration und Wirksamkeit einen möglichst hohen Pegel, bei dem das Risiko steigt; Mischbuilds müssen ihren Rausch planen
+ Meditieren und Schriftrollen schreiben nur nüchtern
+ Vorschlag, noch nicht bestätigt: Bier füllt LP, Wein füllt MP, Brand füllt PP oder wirkt nur über den Pegel; jedes Getränk hebt den Pegel nach seinem Alkoholgehalt
+ Brand hebt den Pegel schneller als Wein und Bier
+ Wein füllt MP sofort, bremst über den Pegel aber die MP-Regeneration
+ Pegel klingt über die Zeit ab
+ Vorschlag, noch nicht bestätigt: linearer Abbau wie in der Wirklichkeit (etwa 0,1 bis 0,15 ‰ pro Stunde), Trinkfestigkeit beschleunigt ihn; ein hoher Pegel hält so lange an
+ Option, noch nicht entschieden: Ausdauer als vierter Vorrat
  + Kosten nur für körperliche Sonderaktionen (Kopfstoß, Bierfontäne, Sprint, Ringen, Werfen), nie für Bewegen und normales Angreifen
  + Regeneriert schnell und unabhängig vom Pegel, der einzige Vorrat, der auch nüchtern verlässlich zurückkommt
  + Name vielleicht "Puste"
  + Kater: Sinkt der Pegel nach einem Rausch, sinkt vorübergehend die höchste Ausdauer; Ansatzpunkt für den Makel Aldehyd-Dehydrogenase-Mangel
+ Bestimmte Aktionen sind nur mit einem bestimmten Pegel durchführbar
+ Pegel bringt Risiko
+ Brausystem mit Zutaten und Rezepten
+ Gebraut wird an festen Altären (Braukessel) oder in mobilen Kesseln
+ Kessel in Tiers nach Material: Kupfer, Eisen, Edelstahl, Silber, Gold
+ Vorschlag, noch nicht bestätigt: weitere Materialien wie Ton (sumerische Brautradition), Holz (Fass), Bronze
+ Idee, noch nicht bestätigt: häufige Anwendung von Psi lässt Gegner erscheinen (Vorbild: Glimmer in Caves of Qud)
+ Vorschlag, noch nicht bestätigt: über einer Schwelle drohen Torkeln, Fehlschläge, Filmriss

## Charakter

+ Charaktererstellung, Eigenschaften, Skills und EP: siehe [Charakter.md](Charakter.md)

## Gegner

+ Mikroorganismen verschiedener Art
+ Betriebskontrolleure
+ Abstinenzler
+ Endboss: Gott der Nüchternheit
+ Vorschlag, noch nicht bestätigt: Sobrietas als Endboss (römische Personifikation der Nüchternheit, erschlägt in der "Psychomachia" des Prudentius die Luxuria)
+ Vorschlag, noch nicht bestätigt: Lykurg von Thrakien, Pentheus von Theben und eine Figur nach Carrie Nation als Bosse davor
+ Vorschlag, noch nicht bestätigt: Hefen ambivalent, Milchsäurebakterien, Essigbakterien und Schimmel als Verderber
+ Idee, noch nicht bestätigt: Mikroorganismen teilen sich, ausgehend von einer Mutterzelle
+ Ideen, auszuarbeiten: jede Gruppe der Mikroorganismen mit eigener Mechanik
+ Bakterien: Zweiteilung in zwei gleiche Zellen, schnelles Wachstum (Milchsäure, Essig, Fäulnis)
+ Hefen: Sprossung, die Mutterzelle bleibt und sprosst weiter; Kulturhefe als möglicher Verbündeter, wilde Hefe (Brettanomyces) als Verderber
+ Schimmel: kaum beweglich, Myzel wächst Feld für Feld, setzt beim Tod Sporen frei (Vorbild: Flechte in Brogue)
+ Bakteriophagen: befallen Bakterien und machen sie zu neuen Phagen, Gegner, der Gegner frisst
+ Biofilm: Kolonie, die sich gemeinsam panzert, einzeln schwach, im Verbund zäh
+ Endosporen: ruhende Bakterien, erwachen später (Wärme, Feuer)
+ Protozoen und Amöben: einzelne Jäger, die andere Mikroorganismen fressen

## Technik

+ Läuft im Browser (HTML, CSS, JavaScript)
+ Spätere Steam-Fassung durch Verpacken mit Electron oder Tauri
+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Effekte wie schwebende Krit-Zahlen (größer, anders gefärbt) per CSS-Animation
+ rot.js für Dungeon-Erzeugung, Sichtfeld, Wegfindung, Zufall mit Startwert, Zugreihenfolge
+ Keine Spiele-Engine, kein Build-Schritt
+ Spiellogik getrennt von der Anzeige
+ Ergebnis zählt mehr als Lesbarkeit des Codes für den Autor; bei Namen sticht die Lesbarkeit, sie bleiben ausdrücklich (siehe CLAUDE.md)
+ Läufe aus Startwert und Befehlsliste reproduzierbar, Inhalte als Daten, Zeitmodell mit Aktionskosten
+ Bezugsgröße 1920x1080, Kamera mit Scrollen, Tile-Größe einstellbar
+ Texte zweisprachig über Sprachdateien, Textkorpus für erzeugte Texte
+ Details: [Architektur.md](Architektur.md), [Texte.md](Texte.md)

## Tileset

+ Keine Zeichen als Platzhalter: Neue Entitäten kommen direkt als Tile ins Spiel
+ Claude zeichnet die Tiles
+ Pixelart in vier Sätzen (16, 32, 48, 64 px); gezeichnet wird der größte, die kleineren werden per Werkzeug abgeleitet und von Hand nachgearbeitet; Einzelheiten in [Architektur.md](Architektur.md)
+ Draufsicht, Figuren und Wände leicht von vorn
+ Licht von links oben, Figuren mit dunklem Rand, Umgebung gedämpft
+ Zunächst keine Animation der Tiles; ausgenommen ist das Flackern von Licht, siehe Licht in [Architektur.md](Architektur.md)
+ Palette mit 62 Farben und verbindliche Artstyle-Fibel in [Tileset.md](Tileset.md)
+ Erstliste: Boden, Wand, Tür, Treppe, Ninkasi, zwei Gegner, Bier, Truhe, Falle
+ Arbeitsweise, Pixeldaten, Vorschau und Ablauf: [Tileset.md](Tileset.md)

## Design

+ Tonfall: bis ins Mark sarkastisch, schwarzer Humor, düster, blutig, mit einer guten Portion Sex/Pornographie
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein
+ Dazu eine eigene Palette Signalfarben
+ Palette der Tiles festgelegt: `grafik/palette.js`, siehe [Tileset.md](Tileset.md)

## Offen

+ Regeneration im Detail: Raten und Form der Verläufe
+ Wo das Optimum der LP-Regeneration liegt (etwa 1,5 ‰?) und ob Trinkfestigkeit es nach oben verschiebt
+ Ob die LP-Regeneration bei sehr hohem Pegel negativ wird (Alkoholvergiftung), als natürliche Grenze des offenen Pegels
+ Ob die MP-Regeneration bei hohem Pegel auf null sinkt oder nur immer langsamer wird
+ Wofür der Brand gut ist: PP direkt füllen oder nur über den Pegel wirken
+ Ab welcher Schwelle "nüchtern" für Meditieren und Schriftrollen gilt
+ Worin das Risiko von Psi besteht (Fehlschlag, Kontrollverlust, Rückschlag); der Mechanismus (Risikotabellen über den Pegel) steht seit 0.12.0, siehe Fähigkeiten in [Architektur.md](Architektur.md)
+ Magie im Detail: welche Wirkungen über die Zeit (Schaden, Flächen, Segen und Fluch, Beschwörung)
+ Pegel im Detail: Schwellen, Risiken, Aktionen mit Mindestpegel
+ Ausdauer: ob überhaupt, Zuordnung zu Gewandtheit oder Körperlichkeit, Verhältnis zu einer Nahrungsuhr
+ Endboss: Sobrietas oder erfundener Gott der Nüchternheit
+ Unterschiede der Mikroorganismen ausarbeiten (Hefen, Bakterien, Schimmel, weitere Gruppen)
+ Brausystem im Detail: Zutaten, Rezepte, Wirkung der Kessel-Tiers, Reihenfolge der Materialien
+ Folgen eines abgebrochenen Brauvorgangs: verdorben, minderwertig oder wieder aufnehmbar (Unterbrechung und Entscheidung per Befehl regelt [Architektur.md](Architektur.md))
+ Dienste des Hubs im Detail
+ Ziel eines Laufs und was zwei Läufe unterscheidet
+ Welt und Schauplatz
+ Bestenliste der eigenen Läufe ja oder nein
+ Licht und Wahrnehmung (vorläufige Ideen in [Architektur.md](Architektur.md)): wie Ninkasi ohne Nachtsicht im Dunkeln sieht (gar nicht, geringe Reichweite, abhängig vom Pegel)
+ Ob Mikroorganismen durch Wände spüren oder nur entlang von Wegen, wie ein Geruch
+ Ob Kontrolleure Taschenlampen tragen (bewegliche Lichtquelle, später vielleicht als Lichtkegel in Blickrichtung)
+ Wertebereich und Stufenzahl der Helligkeit in der Logik, Reichweiten und Stärken der Lichtquellen
+ Ob getragenes Licht für Ninkasi vorgesehen ist (Laterne, Fackel) und wie es ihre Sichtbarkeit für Gegner beeinflusst
