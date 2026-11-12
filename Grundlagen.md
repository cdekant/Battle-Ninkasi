# Battle Ninkasi - Grundlagen

Stand: 2026-11-12

## Spiel

+ Dungeon-Crawler/Roguelike, rundenbasiert
+ Permadeath, kein dauerhafter Fortschritt zwischen den Läufen
+ Gesteuert wird nur Ninkasi
+ Zufällig erzeugte Dungeons
+ Zielgruppe: zunächst nur privat, Steam als spätere Option

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

+ Tonfall: humorvoll, sarkastisch, düster, blutig, sexualisiert soweit möglich
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein
+ Dazu eine eigene Palette Signalfarben

## Offen

+ Kern der Idee (Rolle des Biers, was die "Bierschlächterin" ausmacht)
+ Welt und Schauplatz
+ Genaue Farbpalette
+ Bestätigung der Tileset-Regeln
+ Bestenliste der eigenen Läufe ja oder nein
