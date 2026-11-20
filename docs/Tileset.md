# Battle Ninkasi - Tileset

Stand: 2026-11-18

Plan für das Zeichnen der Tiles; wird nach Bedarf umgebaut. Regeln zur Anzeige (Sätze, Zoom, Ersatz fehlender Tiles) stehen in [Architektur.md](Architektur.md), Grundsätze in [Grundlagen.md](Grundlagen.md).

## Artstyle-Fibel

Verbindliche Regeln für jedes Tile, damit das Tileset wie aus einem Guss wirkt; jedes neue Tile wird gegen sie geprüft. Nach der Stilprobe bestätigt (2026-11-17); Änderungen nur mit Absprache. Referenztiles: `boden`, `wand`, `ninkasi`, `essigbakterium`, `bier`.

### Grundsätze

+ Draufsicht für den Boden, Figuren und Wände frontal bis leicht von vorn
+ Licht von links oben: Höhen oben links in der hellsten, Schatten unten rechts in der dunkelsten Stufe der eigenen Rampe; kein Licht von rechts, keine Glanzpunkte unten
+ Figuren mit dunklem Rand, Umgebung gedämpft, damit Figuren und Gegenstände sich abheben
+ Zunächst keine Animation; Flackern von Licht ist ausgenommen, es entsteht in der Lichtkarte, nicht im Tile (Entwurf für bewegte Tiles siehe Varianten und Bewegung)
+ Dynamisches Licht kommt zur eingezeichneten Beleuchtung hinzu (Lichtkarte über der Karte, siehe Licht in [Architektur.md](Architektur.md)); Tiles mit leuchtenden Pixeln (Augen, Glut) bekommen dafür später eine Maske
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein, dazu Signalfarben (siehe Design in [Grundlagen.md](Grundlagen.md))

### Raster und Maße

+ Figuren stehen auf einer gemeinsamen Fußlinie etwa 4 px über dem unteren Rand und sind waagerecht mittig
+ Ninkasi ist das Maß: etwa 50 px hoch in 64 px; andere Wesen werden relativ zu ihr festgelegt (Bakterium klein, Kontrolleur gleich groß, Bosse dürfen das Tile sprengen)
+ Gegenstände bleiben im inneren Bereich von etwa 32 px

### Umriss

+ Figuren und Gegenstände tragen einen geschlossenen Rand in Schwarz `0`, einen Pixel breit, außen um die Form
+ Gelände trägt keinen Rand

### Kontrast nach Ebenen

+ Boden dunkel und ruhig (Stein `1` bis `2`, wenig Körnung)
+ Wand hell (Stein `3` bis `5`), klar vom Boden getrennt
+ Figuren und Gegenstände satt und kräftig
+ Signal- und Leuchtfarben nur als Akzente
+ Ziel: auch in 16 px sofort lesbar, wo man gehen kann, wo nicht und was sich bewegt

### Farbbudget

+ Je Figur höchstens etwa drei Rampen, je Geländetile höchstens zwei, Schwarz nicht mitgezählt
+ Jede Farbe kommt in einem Tile in mindestens zwei Pixeln vor, damit kein Rauschen entsteht

### Detaildichte

+ In 64 px Formen statt Linien; keine Linien schmaler als 2 px außer Umriss, Fugen und angedeuteten Körperlinien
+ Gesichter knapp: Augen als zwei Pixel mit Lichtpunkt, Brauen, Mund als kurzer Strich
+ Kleinere Sätze (48, 32, 16 px) haben dieselben Formen wie 64 px, weil sie daraus abgeleitet werden (siehe Werkzeuge)
+ Signalakzente wie rote Augen bleiben in jeder Größe sichtbar (in 16 px als einzelne Pixel), Gelände behält erkennbare Fugen und Quader; das Werkzeug sorgt dafür und warnt, wo es nicht gelingt
+ Ableitungsfreundlich zeichnen: wichtige Details in 64 px mindestens 4x4 px groß, getrennte Details (z. B. zwei Augen) mindestens 8 px voneinander entfernt (Mitte zu Mitte), damit sie in 16 px nicht verschmelzen; Fugen als durchgehende Linien
+ 16 px: Silhouette, Hauptfarben und ein Akzent genügen; Gesichter außer leuchtenden Augen dürfen verschwinden

### Prüfungen

+ Silhouettentest: Jede Figur ist als reine Schwarzfläche erkennbar
+ Gelände ist nahtlos kachelbar, geprüft in der 3x3-Ansicht, ohne auffällige Wiederholung
+ Später in der Tilewerkstatt: Prüfansichten für Silhouette, Graustufen und Verkleinerung; automatisch prüfbar sind erlaubte Zeichen, geschlossener Umriss und Zahl der Rampen je Tile

### Formensprache

+ Ninkasi und Verbündete: warm, rund, Biertöne und Haut
+ Mikroorganismen: organisch, Form und Farbe nach mikroskopischem Vorbild (z. B. Essigbakterium als pralles, blassgrünes, körniges Stäbchen), die Bedrohung zeigen Signalakzente wie leuchtend rote Augen
+ Kontrolleure und Abstinenzler: grau, kühl und eckig, Stahl und Stein
+ So zeigt schon die Form, wer Freund und wer Feind ist

### Nacktheit

+ Ninkasi startet nackt ohne Ausrüstung; der Körper wird mit Umriss und Schattierung gezeichnet, Brust mit angedeuteten Brustwarzen, Scham als angedeutetes Y mit Haar, ohne weitere Einzelheiten

## Werkzeuge

+ Claude zeichnet die Tiles direkt als Pixeldaten, ohne Bildprogramm und ohne Claude Design
+ Claude Design (Artifact-Typ "Design") arbeitet mit HTML, CSS und SVG statt mit einem Pixelraster und taugt deshalb nicht für die Tiles selbst; höchstens für Stimmungsentwürfe vorab
+ Das Werkzeug DesignSync gleicht nur UI-Komponenten eines Design-Systems ab und kommt nicht in Frage
+ Eine direkte Verbindung zwischen Repo und Claude Design gibt es nicht; Claude überträgt Dateien bei Bedarf von Hand
+ `werkzeuge/tiles-ableiten.js` leitet aus dem Satz 64 die Sätze 48, 32 und 16 ab und schreibt `grafik/tileset.js` neu; Aufruf `node werkzeuge/tiles-ableiten.js [--ueberschreiben] [tilename ...]`
+ Verfahren je Zielpixel über die Fläche der Vorlage (auch beim krummen Faktor 64 zu 48):
  + Umriss der Vorlage ausblenden; zu wenig Deckung ergibt Durchsichtigkeit
  + Vorrangfarben: Kommt eine Signalfarbe (Blut, Säure, Gift, Lauge, Psi, Magie, Leuchtrot) in der Fläche vor, gewinnt sie; Augen, Wunden und Glut bleiben so in jeder Größe sichtbar
  + Fugen: Bei Gelände (ohne Durchsichtigkeit) gewinnt die dunkelste Farbe, wenn sie etwa eine durchgehende Linie von 1 px über die Fläche bildet; einzelne dunkle Körner zählen nicht
  + sonst Flächenmittel, gesetzt auf die nächste Farbe aus den Farben der Vorlage
  + Umriss in Schwarz neu setzen, wenn die Vorlage einen hatte
+ Prüfung: Das Werkzeug vergleicht jedes abgeleitete Tile (auch vorhandene, nachgearbeitete) mit der Vorlage und warnt bei verschwundenen Signalfarben, zerfallenen Figuren (mehr zusammenhängende Teile als die Vorlage) und ausgedünnten Fugen (dunkelste Farbe auf weniger als die Hälfte ihres Anteils gesunken)
+ Ohne Warnung genügt ein kurzer Blick in die Tilewerkstatt; was kein Werkzeug beurteilen kann, ist die Wirkung, etwa ob ein Gesicht klein noch stimmt
+ Ohne `--ueberschreiben` bleiben vorhandene Dateien unberührt, damit Handnacharbeit erhalten bleibt; nachgearbeitete Dateien tragen im Kopfkommentar "nicht überschreiben"
+ Bisher von Hand: nur die Augen des Essigbakteriums in 48, 32 und 16 px getrennt (die Vorrangregel ließ die eng stehenden Augen zu einem Fleck verschmelzen); Gelände braucht seit der Fugenregel keine Nacharbeit mehr
+ Ablauf für ein neues Tile: in 64 px zeichnen, `node werkzeuge/tiles-ableiten.js <tilename>` aufrufen, Warnungen nacharbeiten, in der Tilewerkstatt ansehen
+ Warum nicht zur Laufzeit verkleinern: ohne Glättung verschwinden einzelne Pixel (Umriss, Augen) und bei 48 px werden Pixel ungleich breit; mit Glättung wird alles weich und verlässt die Palette

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
+ Die Namen der Tiles folgen den Schlüsseln in `daten/zeichen.js` (`boden`, `wand`, `ninkasi`, `essigbakterium`, `bier` usw.)
+ Ninkasi ist frontal nach dem Burney-Relief gezeichnet (gemeinfreies altbabylonisches Relief, nur als Vorlage benutzt), nackt, da sie ohne Ausrüstung startet; Ausrüstung kommt später als eigene Tiles oder Varianten
+ Erste Entwürfe darf Claude mit einem Hilfsskript vorzeichnen (Fugen, Rauschen) und dann von Hand nacharbeiten; maßgeblich ist allein die Datendatei, das Hilfsskript kommt nicht ins Repo
+ Der Renderer baut die Bilder beim Start aus den Pixeldaten (Offscreen-Canvas); kein Build-Schritt, keine PNG-Dateien im Repo
+ Vorteile: Änderungen sind im Git-Diff lesbar, Claude kann jedes Pixel gezielt ändern, Palettenwechsel färbt alle Tiles zugleich um
+ Export als PNG (z. B. für Screenshots oder spätere Werkzeuge) bleibt möglich, ist aber vorerst nicht nötig

## Wände von vorn

+ Vorerst ein einziges Wand-Tile: helle Quader mit Mauerkrone, deutlich heller als der dunkle Boden
+ Später möglich: zwei Ansichten (Oberseite, Vorderseite), der Renderer wählt die Vorderseite, wenn unter der Wand ein begehbares Feld liegt; reine Anzeige, weitere Nachbarschaftsregeln (Ecken, Übergänge) erst bei Bedarf

## Varianten und Bewegung

Entwurf, noch nicht entschieden; ändert die Fibel erst nach Absprache. Gehört zu Punkt 12 in [Systemausbau.md](Systemausbau.md), die Effektschicht steht in [Animationen.md](Animationen.md).

+ Ziel: Boden und Wände nicht alle identisch, sondern mit kleinen Variationen, damit die Karte lebendiger wirkt
+ Der Renderer wählt die Variante fest nach Ebene und Feld (Streuwert aus Ebene und Koordinaten), nicht mit dem Spiel-Zufall: gleich nach dem Neuladen, das Nachspielen bleibt unberührt
+ Varianten als eigene Tiles mit Nummer (`boden-01`, `boden-02` ...) und Gewicht, z.B. der schlichte Boden häufig, Riss oder Fleck selten
+ Empfehlung zwei Stufen: Grundvarianten mit kaum sichtbaren Unterschieden (etwa 3 je Geländeart) und seltene Schmuckstücke (Risse, Pfützen, Moos); Schmuck wahlweise als eigene Schicht über dem Boden, dann frei kombinierbar
+ Regeln für die Fibel: dieselbe Palette, kein neuer Blickfang, nahtlos kachelbar (Prüfung in der 3x3-Kachelung der Vorschau); die kleinen Sätze werden wie gewohnt abgeleitet
+ Die Vorderseite der Wand (siehe Wände von vorn) passt in dasselbe Paket
+ Bewegte Tiles (blubbernder Gärbottich, flackerndes Feuer, wogendes Gas): mehrere Bilder je Tile, Takt aus der Effektschicht ([Animationen.md](Animationen.md)); hebt "Zunächst keine Animation" auf

## Vorschau und Abstimmung

+ Die Vorschauseite `grafik/vorschau.html` zeigt Palette, alle Tiles in allen Sätzen in Originalgröße und vergrößert, den Satz 64 als 3x3-Kachelung (Nahtstellen) und eine Testszene mit Zoomwahl, gelesen aus denselben Datendateien wie das Spiel; lokal unter `http://localhost:8000/grafik/vorschau.html`
+ Zum Abstimmen veröffentlicht Claude die Vorschauseite als Artifact auf claude.ai (Tilewerkstatt: https://claude.ai/artifact/97GFDzcvppAWoM23EPijm5, privat); die Datendateien gehen mit denselben relativen Pfaden mit, deshalb liegt die Seite in `grafik/`
+ Dort lassen sich Kommentare an einzelne Stellen hängen, Claude liest sie und überarbeitet die Pixeldaten im Repo
+ Maßgeblich sind immer die Dateien im Repo, das Artifact ist nur Ansicht

## Ablauf

1. Palette: Farbfelder und eine Probe aus Boden und Wand (erledigt, 62 Farben)
2. Stilprobe in 64 px: Boden, Wand, Ninkasi, Essigbakterium, Bier; Artstyle-Fibel bestätigt (erledigt)
3. Einbau in den Renderer: Tiles aus Pixeldaten, Ersatz fehlender Tiles durch Zeichen (erledigt, `src/anzeige/tilebilder.js`, Tests in `tests/tilebilder.test.js`)
4. Kleine Sätze 48, 32 und 16 px für die fünf Tiles der Stilprobe: zunächst von Hand generalisiert, wegen abweichender Formen ersetzt durch Ableiten per Werkzeug mit Nacharbeit (erledigt)
5. Erstliste in 64 px vervollständigen: Tür, Treppe, zweiter Gegner, Truhe, Falle; kleine Sätze per Werkzeug
6. Danach Tile für Tile nach Bedarf neuer Inhalte; jede neue Entität kommt direkt als Tile, ohne Zeichen als Platzhalter

## Offene Fragen

+ Laden bei vielen Tiles: Ein Tile in 64 px ist als Datei etwa 4,7 KB groß; bei einigen hundert Tiles in vier Sätzen wären es Megabytes in tausenden Dateien, je eine Anfrage beim Laden. Lokal und in Electron/Tauri unkritisch, über das Netz bremsend. Möglich: Tiles je Satz und Kategorie in einer Datei bündeln oder Pixelzeilen kompakter speichern (ohne Build-Schritt). Entscheiden, sobald es etwa hundert Tiles sind
+ Bauen und Zeichnen sind dagegen unkritisch: einige Millionen Pixel beim Start, Gelände nur bei Änderungen neu zeichnen; falls nötig Atlas je Satz oder zwischengespeichertes Gelände

## Ablage und Lizenz

+ Tiles und Palette liegen in `grafik/`, getrennt von `daten/`, weil für sie die Grafiklizenz gilt (CC BY-NC-SA 4.0) und nicht die Codelizenz; siehe [LIZENZEN.md](../LIZENZEN.md)
+ `grafik/palette.js`: Palette
+ `grafik/tileset.js`: Palette und Tiles je Satz (`saetze: { 64: { bier, boden, ... }, 48: { ... }, 32: { ... }, 16: { ... } }`), Einstieg für Renderer und Vorschau; erzeugt vom Werkzeug, nicht von Hand ändern
+ `grafik/tiles/<Satz>/<name>.js`: ein Tile je Datei, Dateinamen klein mit Bindestrichen (z. B. `ninkasi.js`)
+ `grafik/vorschau.html`: Vorschauseite; sie ist Code und steht unter der Codelizenz
