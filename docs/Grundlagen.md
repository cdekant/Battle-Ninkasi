# Battle Ninkasi - Grundlagen

Stand: 2026-11-16

## Spiel

+ Dungeon-Crawler/Roguelike, rundenbasiert
+ Permadeath, kein dauerhafter Fortschritt zwischen den Läufen
+ Gesteuert wird nur Ninkasi
+ Zufällig erzeugte Dungeons
+ Zielgruppe: zunächst nur privat, Steam als spätere Option

## Spielkern

+ Ninkasi ist die Inkarnation der mesopotamischen Göttin des Bieres, alkoholaffin
+ Alkohol ist Ressource: Bier, eventuell auch Wein und Spirituosen
+ Drei Werte: Lebenspunkte (LP), Magiepunkte (MP), Pegelpunkte (PP)
+ PP sind das Maß des Rauschpegels, Psi hat keinen eigenen Vorrat
+ Erstes Konzept: Bier füllt LP, Wein füllt MP, alle Getränke füllen PP
+ LP und MP regenerieren über die Zeit, aber nur mit Pegel: nüchtern keine Regeneration
+ Psi: hohes Risiko, hoher Ertrag; wirkt sofort auf Einzelziele (Gedanken, Furcht, Kontrolle, Teleport)
+ Magie: langsamer, wirkt über die Zeit
+ Spirituosen heben den Rauschpegel schneller als Wein und Bier
+ Rauschpegel klingt über die Zeit ab
+ Bestimmte Aktionen sind nur mit einem bestimmten Pegel durchführbar
+ Rauschpegel bringt Risiko
+ Idee, noch nicht bestätigt: häufige Anwendung von Psi lässt Gegner erscheinen (Vorbild: Glimmer in Caves of Qud)
+ Vorschlag, noch nicht bestätigt: über einer Schwelle drohen Torkeln, Fehlschläge, Filmriss

## Gegner

+ Mikroorganismen verschiedener Art
+ Betriebskontrolleure
+ Abstinenzler
+ Endboss: Gott der Nüchternheit
+ Vorschlag, noch nicht bestätigt: Sobrietas als Endboss (römische Personifikation der Nüchternheit, erschlägt in der "Psychomachia" des Prudentius die Luxuria)
+ Vorschlag, noch nicht bestätigt: Lykurg von Thrakien, Pentheus von Theben und eine Figur nach Carrie Nation als Bosse davor
+ Vorschlag, noch nicht bestätigt: Hefen ambivalent, Milchsäurebakterien, Essigbakterien und Schimmel als Verderber

## Technik

+ Läuft im Browser (HTML, CSS, JavaScript)
+ Spätere Steam-Fassung durch Verpacken mit Electron oder Tauri
+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Effekte wie schwebende Krit-Zahlen (größer, anders gefärbt) per CSS-Animation
+ rot.js für Dungeon-Erzeugung, Sichtfeld, Wegfindung, Zufall mit Startwert, Zugreihenfolge
+ Keine Spiele-Engine, kein Build-Schritt
+ Spiellogik getrennt von der Anzeige
+ Ergebnis zählt mehr als Lesbarkeit des Codes für den Autor

## Tileset

+ Zuerst Zeichen als Platzhalter, danach Tile für Tile ersetzen
+ Claude zeichnet die Tiles
+ Vorschlag, noch nicht bestätigt: 16x16 Pixel, vierfach vergrößert
+ Vorschlag, noch nicht bestätigt: Draufsicht, Figuren und Wände leicht von vorn
+ Vorschlag, noch nicht bestätigt: Licht von links oben, Figuren mit dunklem Rand, Umgebung gedämpft
+ Vorschlag, noch nicht bestätigt: zunächst keine Animation der Tiles
+ Erstliste: Boden, Wand, Tür, Treppe, Ninkasi, zwei Gegner, Trank, Truhe, Falle

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
+ Ziel eines Laufs und was zwei Läufe unterscheidet
+ Welt und Schauplatz
+ Genaue Farbpalette
+ Bestätigung der Tileset-Regeln
+ Bestenliste der eigenen Läufe ja oder nein
