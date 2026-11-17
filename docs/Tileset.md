# Battle Ninkasi - Tileset

Stand: 2026-11-17

Plan für das Zeichnen der Tiles; wird nach Bedarf umgebaut. Regeln zur Anzeige (Sätze, Zoom, Ersatz fehlender Tiles) stehen in [Architektur.md](Architektur.md), Grundsätze in [Grundlagen.md](Grundlagen.md).

## Stil

Vorläufig festgelegt, wird nach der Stilprobe bestätigt oder geändert:

+ Draufsicht, Figuren und Wände leicht von vorn
+ Licht von links oben
+ Figuren mit dunklem Rand, Umgebung gedämpft, damit Figuren und Gegenstände sich abheben
+ Zunächst keine Animation; Flackern von Licht ist ausgenommen, es entsteht in der Lichtkarte, nicht im Tile
+ Dynamisches Licht kommt zur eingezeichneten Beleuchtung hinzu (Lichtkarte über der Karte, siehe Licht in [Architektur.md](Architektur.md)); Tiles mit leuchtenden Pixeln (Augen, Glut) bekommen dafür später eine Maske
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein, dazu Signalfarben (siehe Design in [Grundlagen.md](Grundlagen.md))

## Werkzeuge

+ Claude zeichnet die Tiles direkt als Pixeldaten, ohne Bildprogramm und ohne Claude Design
+ Claude Design (Artifact-Typ "Design") arbeitet mit HTML, CSS und SVG statt mit einem Pixelraster und taugt deshalb nicht für die Tiles selbst; höchstens für Stimmungsentwürfe vorab
+ Das Werkzeug DesignSync gleicht nur UI-Komponenten eines Design-Systems ab und kommt nicht in Frage
+ Eine direkte Verbindung zwischen Repo und Claude Design gibt es nicht; Claude überträgt Dateien bei Bedarf von Hand

## Pixeldaten

+ Ein Tile ist eine JS-Datendatei (`export default { groesse, pixel }`) mit einer Pixelmatrix: je Zeile eine Zeichenkette, je Pixel ein Zeichen, das für eine Farbe der Palette steht; Punkt für durchsichtig
+ Die Palette (`grafik/palette.js`) ist eine eigene Datendatei mit begrenzter Farbzahl, jede Farbe mit Zeichen, Rampe, Stufe und Hexwert; alle Tiles teilen sie
+ Palette mit 62 Farben, Schlüssel sind genau die Zeichen `0`-`9`, `a`-`z`, `A`-`Z`; mehr Farben nur, wenn dafür eine andere wegfällt
+ Jedes Tile darf jede Farbe benutzen, die Rampen ordnen nur
+ Materialien: `0` Schwarz (Umriss, tiefster Schatten, Stout), `1` bis `5` Stein, `a` bis `g` Bier (Porter bis Pils), `6` `7` Schaum, `8` Glanz, `h` `i` `j` Holz, `k` `l` `m` Kupfer, `n` `o` `p` Edelstahl, `q` `r` `s` Gold, `t` `u` `v` Hopfen, `w` `x` `y` Rosa, `A` bis `F` Haut, `G` `H` `I` Lapis
+ Geteilte Schatten: Rampen mit drei Stufen leihen sich ihre dunkelste Farbe bei einer Nachbarrampe (Holz und Kupfer bei Bier und Haut, Stahl bei Stein, Gold und Hopfen bei Holz, Rosa bei Blut und Magie, Lapis beim Schwarz)
+ Signalfarben mit je drei Stufen: `J` `K` `L` Blut, `M` `N` `O` Säure, `P` `Q` `R` Gift, `S` `T` `U` Lauge, `V` `W` `X` Psi, `Y` `Z` `z` Magie; Säure, Gift, Psi und Magie enden in einer Leuchtfarbe, dazu `9` Leuchtrot einzeln
+ Innerhalb einer Rampe von dunkel nach hell; `.` ist durchsichtig
+ Signalfarben tragen eine Bedeutung im Spiel und stehen nicht großflächig für neutrales Material (Hopfen hat deshalb eine eigene Rampe); kleine Akzente wie rote Augen sind erlaubt
+ Die Namen der Tiles folgen den Schlüsseln in `daten/zeichen.js` (`boden`, `ninkasi`, `essigbakterium`, `bier` usw.); Wände haben zwei Ansichten, `wandOben` und `wandVorn`
+ Erste Entwürfe darf Claude mit einem Hilfsskript vorzeichnen (Fugen, Rauschen) und dann von Hand nacharbeiten; maßgeblich ist allein die Datendatei, das Hilfsskript kommt nicht ins Repo
+ Der Renderer baut die Bilder beim Start aus den Pixeldaten (Offscreen-Canvas); kein Build-Schritt, keine PNG-Dateien im Repo
+ Vorteile: Änderungen sind im Git-Diff lesbar, Claude kann jedes Pixel gezielt ändern, Palettenwechsel färbt alle Tiles zugleich um
+ Export als PNG (z. B. für Screenshots oder spätere Werkzeuge) bleibt möglich, ist aber vorerst nicht nötig

## Wände von vorn

+ Wände leicht von vorn brauchen zwei Ansichten: Oberseite und Vorderseite
+ Der Renderer wählt die Vorderseite, wenn unter der Wand ein begehbares Feld liegt, sonst die Oberseite
+ Das ist reine Anzeige und berührt die Logik nicht; weitere Nachbarschaftsregeln (Ecken, Übergänge) erst bei Bedarf

## Vorschau und Abstimmung

+ Die Vorschauseite `grafik/vorschau.html` zeigt Palette, alle Tiles einfach, doppelt und als 3x3-Kachelung (Nahtstellen) und eine Testszene mit Zoomwahl, gelesen aus denselben Datendateien wie das Spiel; lokal unter `http://localhost:8000/grafik/vorschau.html`
+ Zum Abstimmen veröffentlicht Claude die Vorschauseite als Artifact auf claude.ai (Tilewerkstatt: https://claude.ai/artifact/97GFDzcvppAWoM23EPijm5, privat); die Datendateien gehen mit denselben relativen Pfaden mit, deshalb liegt die Seite in `grafik/`
+ Dort lassen sich Kommentare an einzelne Stellen hängen, Claude liest sie und überarbeitet die Pixeldaten im Repo
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
+ `grafik/palette.js`: Palette
+ `grafik/tileset.js`: Palette und Tiles je Satz (`saetze: { 64: { boden, wandOben, wandVorn } }`), Einstieg für Renderer und Vorschau
+ `grafik/tiles/<Satz>/<name>.js`: ein Tile je Datei, Dateinamen klein mit Bindestrichen (`wand-vorn.js`)
+ `grafik/vorschau.html`: Vorschauseite; sie ist Code und steht unter der Codelizenz
