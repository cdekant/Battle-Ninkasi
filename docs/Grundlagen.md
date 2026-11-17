# Battle Ninkasi - Grundlagen

Stand: 2026-11-17

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
+ Alkohol ist Ressource: Bier, eventuell auch Wein und Spirituosen
+ Drei Werte: Lebenspunkte (LP), Magiepunkte (MP), Pegelpunkte (PP)
+ PP sind das Maß des Rauschpegels, Psi hat keinen eigenen Vorrat
+ Erstes Konzept: Bier füllt LP, Wein füllt MP, alle Getränke füllen PP
+ LP und MP regenerieren über die Zeit, aber nur mit Pegel: nüchtern keine Regeneration
+ Psi: hohes Risiko, hoher Ertrag; wirkt sofort auf Einzelziele (Gedanken, Furcht, Kontrolle, Teleport)
+ Magie: langsamer, wirkt über die Zeit, etwas mehr in Richtung Crowd Control
+ Spirituosen heben den Rauschpegel schneller als Wein und Bier
+ Rauschpegel klingt über die Zeit ab
+ Bestimmte Aktionen sind nur mit einem bestimmten Pegel durchführbar
+ Rauschpegel bringt Risiko
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
+ Ergebnis zählt mehr als Lesbarkeit des Codes für den Autor
+ Läufe aus Startwert und Befehlsliste reproduzierbar, Inhalte als Daten, Zeitmodell mit Aktionskosten
+ Bezugsgröße 1920x1080, Kamera mit Scrollen, Tile-Größe einstellbar
+ Texte zweisprachig über Sprachdateien, Textkorpus für erzeugte Texte
+ Details: [Architektur.md](Architektur.md), [Texte.md](Texte.md)

## Tileset

+ Zuerst Zeichen als Platzhalter, danach Tile für Tile ersetzen
+ Claude zeichnet die Tiles
+ Pixelart in vier Sätzen (16, 32, 48, 64 px), zuerst der größte, die kleineren von Hand generalisiert; Einzelheiten in [Architektur.md](Architektur.md)
+ Vorläufig festgelegt, Bestätigung nach der Stilprobe: Draufsicht, Figuren und Wände leicht von vorn
+ Vorläufig festgelegt, Bestätigung nach der Stilprobe: Licht von links oben, Figuren mit dunklem Rand, Umgebung gedämpft
+ Vorläufig festgelegt, Bestätigung nach der Stilprobe: zunächst keine Animation der Tiles
+ Erstliste: Boden, Wand, Tür, Treppe, Ninkasi, zwei Gegner, Trank, Truhe, Falle
+ Arbeitsweise, Pixeldaten, Vorschau und Ablauf: [Tileset.md](Tileset.md)

## Design

+ Tonfall: bis ins Mark sarkastisch, schwarzer Humor, düster, blutig, mit einer guten Portion Sex/Pornographie
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein
+ Dazu eine eigene Palette Signalfarben

## Offen

+ Regeneration im Detail: ab welchem Pegel, wie schnell, ob sie mit dem Pegel steigt
+ Wie Psi mit dem Pegel zusammenhängt: Mindestpegel, Pegel verbrauchen oder Pegel weiter erhöhen
+ Worin das Risiko von Psi besteht (Fehlschlag, Kontrollverlust, Rückschlag)
+ Magie im Detail: welche Wirkungen über die Zeit (Schaden, Flächen, Segen und Fluch, Beschwörung)
+ Rauschpegel im Detail: Schwellen, Risiken, Aktionen mit Mindestpegel
+ Wein und Spirituosen ja oder nein
+ Endboss: Sobrietas oder erfundener Gott der Nüchternheit
+ Unterschiede der Mikroorganismen ausarbeiten (Hefen, Bakterien, Schimmel, weitere Gruppen)
+ Brausystem im Detail: Zutaten, Rezepte, Wirkung der Kessel-Tiers, Reihenfolge der Materialien
+ Folgen eines abgebrochenen Brauvorgangs: verdorben, minderwertig oder wieder aufnehmbar (Unterbrechung und Entscheidung per Befehl regelt [Architektur.md](Architektur.md))
+ Dienste des Hubs im Detail
+ Ziel eines Laufs und was zwei Läufe unterscheidet
+ Welt und Schauplatz
+ Genaue Farbpalette, wird im ersten Schritt des Tilesets festgelegt, siehe [Tileset.md](Tileset.md)
+ Endgültige Bestätigung der Tileset-Regeln nach der Stilprobe
+ Bestenliste der eigenen Läufe ja oder nein
