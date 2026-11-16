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
+ Vier Werte: Lebenspunkte (LP), Magiepunkte (MP), Psipunkte (PP), Rauschpunkte (RP)
+ RP sind das Maß des Rauschpegels
+ Erstes Konzept: Bier füllt LP, Wein füllt MP, Spirituosen füllen PP, alle heben den Rauschpegel
+ Rauschpegel bringt Risiko, manche Aktionen brauchen aber einen Mindestpegel (noch nicht bestätigt)
+ Vorschlag, noch nicht bestätigt: Rauschpegel sinkt mit der Zeit, über einer Schwelle drohen Torkeln, Fehlschläge, Filmriss

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

+ Abgrenzung von MP und PP (wofür Magie, wofür Psi)
+ Rauschpegel im Detail: Schwellen, Risiken, Aktionen mit Mindestpegel
+ Wein und Spirituosen ja oder nein
+ Endboss: Sobrietas oder erfundener Gott der Nüchternheit
+ Ziel eines Laufs und was zwei Läufe unterscheidet
+ Welt und Schauplatz
+ Genaue Farbpalette
+ Bestätigung der Tileset-Regeln
+ Bestenliste der eigenen Läufe ja oder nein
