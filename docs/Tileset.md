# Battle Ninkasi - Tileset

Stand: 2026-11-17

Plan für das Zeichnen der Tiles; wird nach Bedarf umgebaut. Regeln zur Anzeige (Sätze, Zoom, Ersatz fehlender Tiles) stehen in [Architektur.md](Architektur.md), Grundsätze in [Grundlagen.md](Grundlagen.md).

## Stil

Vorläufig festgelegt, wird nach der Stilprobe bestätigt oder geändert:

+ Draufsicht, Figuren und Wände leicht von vorn
+ Licht von links oben
+ Figuren mit dunklem Rand, Umgebung gedämpft, damit Figuren und Gegenstände sich abheben
+ Zunächst keine Animation
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein, dazu Signalfarben (siehe Design in [Grundlagen.md](Grundlagen.md))

## Werkzeuge

+ Claude zeichnet die Tiles direkt als Pixeldaten, ohne Bildprogramm und ohne Claude Design
+ Claude Design (Artifact-Typ "Design") arbeitet mit HTML, CSS und SVG statt mit einem Pixelraster und taugt deshalb nicht für die Tiles selbst; höchstens für Stimmungsentwürfe vorab
+ Das Werkzeug DesignSync gleicht nur UI-Komponenten eines Design-Systems ab und kommt nicht in Frage
+ Eine direkte Verbindung zwischen Repo und Claude Design gibt es nicht; Claude überträgt Dateien bei Bedarf von Hand

## Pixeldaten

+ Ein Tile ist eine JS-Datendatei (`export default { ... }`) mit Größe, Verweis auf die Palette und einer Pixelmatrix: je Zeile eine Zeichenkette, je Pixel ein Zeichen, das für eine Farbe der Palette steht; Leerzeichen oder Punkt für durchsichtig (Festlegung beim ersten Tile)
+ Die Palette ist eine eigene Datendatei mit begrenzter Farbzahl, jede Farbe mit einem Zeichen als Schlüssel; alle Tiles teilen sie
+ Die Namen der Tiles folgen den Schlüsseln in `daten/zeichen.js` (`wand`, `boden`, `ninkasi`, `essigbakterium`, `bier` usw.)
+ Der Renderer baut die Bilder beim Start aus den Pixeldaten (Offscreen-Canvas); kein Build-Schritt, keine PNG-Dateien im Repo
+ Vorteile: Änderungen sind im Git-Diff lesbar, Claude kann jedes Pixel gezielt ändern, Palettenwechsel färbt alle Tiles zugleich um
+ Export als PNG (z. B. für Screenshots oder spätere Werkzeuge) bleibt möglich, ist aber vorerst nicht nötig

## Wände von vorn

+ Wände leicht von vorn brauchen zwei Ansichten: Oberseite und Vorderseite
+ Der Renderer wählt die Vorderseite, wenn unter der Wand ein begehbares Feld liegt, sonst die Oberseite
+ Das ist reine Anzeige und berührt die Logik nicht; weitere Nachbarschaftsregeln (Ecken, Übergänge) erst bei Bedarf

## Vorschau und Abstimmung

+ Eine Vorschauseite im Repo zeigt Palette, alle Tiles in allen Zoomstufen und eine kleine Testszene, gelesen aus denselben Datendateien wie das Spiel
+ Zum Abstimmen veröffentlicht Claude die Vorschauseite als Artifact auf claude.ai; dort lassen sich Kommentare an einzelne Stellen hängen, Claude liest sie und überarbeitet die Pixeldaten im Repo
+ Maßgeblich sind immer die Dateien im Repo, das Artifact ist nur Ansicht

## Ablauf

1. Palette: Farbfelder und eine Probe aus Boden und Wand, abstimmen, danach "Genaue Farbpalette" in [Grundlagen.md](Grundlagen.md) schließen
2. Stilprobe in 64 px: Boden, Wand (Oberseite und Vorderseite), Ninkasi, Essigbakterium, Bier; danach Stilregeln bestätigen oder ändern
3. Einbau in den Renderer: Tiles aus Pixeldaten, Ersatz fehlender Tiles durch Zeichen
4. Erstliste in 64 px vervollständigen: Tür, Treppe, zweiter Gegner, Truhe, Falle
5. Generalisieren von Hand auf 48, 32 und 16 px, kleinster Satz zuletzt
6. Danach Tile für Tile nach Bedarf neuer Inhalte

## Ablage und Lizenz

+ Tiles und Palette liegen in `grafik/`, getrennt von `daten/`, weil für sie die Grafiklizenz gilt (CC BY-NC-SA 4.0) und nicht die Codelizenz; siehe [LIZENZEN.md](../LIZENZEN.md)
+ Genaue Ordnerstruktur in `grafik/` wird beim ersten Tile festgelegt und hier nachgetragen
