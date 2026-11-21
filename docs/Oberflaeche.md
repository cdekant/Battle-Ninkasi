# Battle Ninkasi - Oberfläche

Stand: 2026-11-20, Entwurf, nicht umgesetzt, Entscheidungen getroffen

Schema der Oberfläche: Prinzipien, Layout, Leisten, Log, Fenster, Tastatur, Einstellungen. Alles hier ist Anzeige und Eingabe; die Logik kennt weder Fenster noch Leisten und bekommt nur gewöhnliche Befehle. Was heute umgesetzt ist, beschreibt [Architektur.md](Architektur.md) (Anzeige, Oberfläche, Eingabe, Zielmodus, Untersuchen); Bewegung und Effekte stehen in [Animationen.md](Animationen.md), die Arbeitsliste in Punkt 11 von [Systemausbau.md](Systemausbau.md). Entschiedenes und Offenes steht am Ende unter Entscheidungen.

## Vorbilder

| Spiel | Hauptschirm | Was wir übernehmen |
|:--|:--|:--|
| Brogue | Seitenleiste mit Werten und den Wesen in Sicht nach Abstand, Log oben (3 Zeilen), Knopfreihe unten | Liste der Wesen in Sicht, Seitenleiste und Karte heben sich beim Darüberfahren gegenseitig hervor |
| DCSS (WebTiles) | Karte links, Werte und Gegnerliste rechts, Meldungen unten | Log mit Spalten (Zugmarke vorn), Fenster als Stapel |
| Cogmind | Karte mittig, Teileliste dauerhaft, Logs oben; Layouts voll, "semi-modal" und "modal" als Einstellung | Umschaltbare Layouts, getrennte Logs für Geschehen und Kampf, Skalieren über Schriftgröße und Zeilen, was nicht ständig Aufmerksamkeit braucht, wird zum Fenster |
| Caves of Qud | Modernes Overlay mit Fähigkeitenleiste, Systemmenü rechts oben, klassische Oberfläche abschaltbar | Leiste automatisch belegt und umbelegbar, mehrere Leisten, Suchfeld in Listen, Tastatur, Maus und Gamepad gleichwertig |
| ToME | Hotkey-Leiste unten mit Abklingzeit als Zahl, HUD-Teile verschiebbar, mehrere Stile | Abklingzeit in der Leiste, Stil getrennt vom Layout |
| Shattered Pixel Dungeon | Werkzeugleiste unten mit 4 bis 6 Schnellplätzen, spiegelbar | Schnellplätze zielen von selbst |
| Diablo, WoW, BG3 | Aktionsleiste unten mittig, Abklingzeit als Kreissegment, Minikarte oben rechts | Darstellung der Abklingzeit; BG3 zeigt, dass eine nur automatische Leiste stört |

## Prinzipien

1. Karte zuerst, die Minikarte als Zweites: die Karte bekommt den größten Teil des Schirms, die Minikarte den zweitwichtigsten Platz
2. Was eine erfahrene Spielerin ständig braucht, steht ohne Fenster da; alles andere öffnet sich bei Bedarf (Cogmind)
3. Jedes Element kostet Aufmerksamkeit (Shafer); Elemente stehen in Prioritätsstufen (siehe unten), höhere Stufen bekommen Platz, Größe und Kontrast
4. Tastatur zuerst, ohne Ziffernblock spielbar, Belegung angelehnt an vi bzw. neovim; die Maus kann alles auch, das Gamepad wird vorbereitet (siehe Gamepad)
5. Keine Information nur beim Darüberfahren: was der Tooltip zeigt, zeigt auch Untersuchen (X), damit Tastatur und Gamepad nichts verpassen
6. Farbe nie allein, immer mit Form, Symbol oder Text; Symbole mit Text; Text untereinander statt nebeneinander
7. Vorsicht mit Reitern: sie verstecken Information vor Neulingen (Shafer); wo es Reiter gibt, zeigt die Kopfzeile alle
8. Rückmeldung zuerst auf der Karte, das Log liefert die Einzelheiten
9. Fenster folgen einer gemeinsamen Grammatik, Esc schließt das oberste
10. Skalieren über Schriftgröße und Zeilen, getrennt vom Zoom der Karte
11. Einstellungen nicht verstecken: vom ersten Start an erreichbar, alles Umstellbare ist Einstellung, gespeichert werden nur Abweichungen von der Vorgabe
12. Layout und Stil sind getrennt: Zonen und Anordnung sind das eine, Farben, Rahmen und Schriften das andere

## Klassen der Elemente

Nach Fagerholt und Lorentzon ("Beyond the HUD", 2009): diegetisch (in Geschichte und Raum), nicht-diegetisch (weder noch), räumlich (im Raum, nicht in der Geschichte), meta (in der Geschichte, nicht im Raum).

+ Nicht-diegetisch: fast alles, Leisten, Seitenleiste, Log, Fenster
+ Räumlich: Markierungen auf der Karte (Ankündigungen, Zielvorschau, Wegvorschau, Randmarker, später schwebende Zahlen und Lebensbalken über Wesen)
+ Meta: Bildschirmeffekte, die Ninkasis Zustand spürbar machen, ohne etwas anzuzeigen (bei hohem Pegel Verschwimmen, Schwanken, Doppelbilder; bei wenig LP ein roter Rand); reine Anzeige, umgesetzt mit der Darstellung (Punkt 12)
+ Vorbereitet wird schon mit dem neuen Layout: eine eigene Effektschicht über der Karte und unter der Oberfläche, so dass die Effekte nur die Karte treffen und Texte lesbar bleiben; jeder Effekt hat einen eigenen Schalter in den Einstellungen, "Bewegung reduzieren" schaltet alle bewegten Effekte zugleich ab
+ Diegetisch: zunächst nichts; denkbar sind Rezeptbuch und Etiketten als Gegenstände der Welt

## Prioritätsstufen

| Stufe | Elemente | Ort |
|:--|:--|:--|
| Kritisch | Karte, LP, Pegel, angekündigte Angriffe, Gefahr in Sicht | Karte, Kopf der Seitenleiste |
| Wichtig | MP, PP, Zustände, Schnellleiste mit Abklingzeit, Wesen in Sicht, Zielen und Untersuchen | Seitenleiste, Schnellleiste |
| Information | Log, Minikarte, laufende Aktion, Heimlichkeit, Tiefe und Zeit | Log, Seitenleiste (Kopf mit Ort und Zeit) |
| Hintergrund | Knöpfe, Hilfe, Version | Bedienzeile, Fenster |

## Bestand und Neubeginn

Die Darstellung kann weitgehend neu entstehen, die Systeme darunter bleiben:

+ Bleibt: Logik und Meldungen, die Auswahl des Wahrnehmbaren (`src/systeme/wahrnehmbar.js`), Vorschau und Untersuchen (`vorschau.js`, `untersuchen.js`), die DOM-freien Kerne der Eingabe (Zielmodus, Inventar- und Fähigkeitenfenster, Reise, Rasten, Erkunden), Pegelanzeige, Texte und Sprachdateien, Renderer und Kamera
+ Umgesetzt in 0.27.0: Aktionskatalog (`src/eingabe/aktionskatalog.js`) mit Belegung Taste zu Aktion, Fensterstapel über der Karte (`src/eingabe/fenster.js`, `src/anzeige/fenster.js`) nach der Grammatik unten, Inventar und Fähigkeiten als Fenster, Charakter und Skills (C), Charaktererstellung vor jedem Lauf, Hilfe (?) aus dem Katalog; die Seitenleiste zeigt freie EP und bis zur Schnellleiste eine Kurzliste der Fähigkeiten, siehe Fenster in [Architektur.md](Architektur.md)
+ Neu: Aufbau der Seite (`index.html`, `stil.css`), `src/anzeige/oberflaeche.js` als Seitenleiste, die Darstellung des Logs (`src/anzeige/log.js` behält die Übersetzung der Meldungen), Bedienzeile mit Schnellleiste und Knöpfen, Minikarte, Spielmenü, Einstellungen, Tastenbelegung

## Bildschirme

+ Titel: Neues Spiel, Fortsetzen, Einstellungen, Hilfe, Beenden; jederzeit nachrüstbar als reine Anzeige vor der Charaktererstellung, sinnvoll mit 0.28.0 (Spielmenü und Einstellungen nutzen dieselben Knöpfe); der Titel ist zugleich die erste Handlung der Spielerin, die der Browser für Ton und Vollbild verlangt; Hintergrund aus `Artwork/titel/` denkbar
+ Idee: Intro-Film als Bildfolge in Pixelart (klein, im Stil) statt Video, jede Taste überspringt, eine Einstellung zeigt ihn nur beim ersten Start; mit Punkt 12 (Darstellung); Bild und Ton unter CC BY-NC-SA 4.0 in `LIZENZEN.md`
+ Charaktererstellung: Eigenschaften verteilen (Punkt 13, die Logik nimmt die Verteilung als Startoption)
+ Spiel: das Layout unten
+ Tod: Laufbericht (Morgue, Punkt 10), Neustart

## Layout

Bezugsgröße 1920x1080. Zonen als CSS-Grid, Maße als Variablen, Schriftgrößen in `rem`, so dass die Größe der Oberfläche eine Einstellung ist, getrennt vom Zoom der Tiles.

### Variante A (Vorgabe)

```
+---------------------------------------------------------------+----------------------+
|                                                               | Tiefe 3 · Zug 1234   |
|                                                               +----------------------+
|                                                               | MINIKARTE            |
|                                                               +----------------------+
|                          KARTE                                | NINKASI              |
|            (Markierungen, Tooltip, Randmarker)                | LP, MP, PP, Pegel    |
|                                                               | Zustände, Aktion     |
|                                                               +----------------------+
|                                                               | ZIELEN/UNTERSUCHEN   |
|                                                               | (nur bei Bedarf)     |
|                                                               +----------------------+
|                                                               | IN SICHT, GEFÄHRTEN  |
+-------------------------------+-------------------------------+                      |
| Log Geschehen (8 Zeilen)      | Log Kampf (8 Zeilen)          |                      |
+-------------------------------+-------------------------------+----------------------+
| Schnellleiste [1]..[0], Nummer der Leiste                     | [i] [f] [c] [m]      |
|                                                               | [r] [o] [?] [Esc]    |
+---------------------------------------------------------------+----------------------+
```

+ Höhen: Log 8 Zeilen etwa 176 px, Bedienzeile etwa 56 px; für die Karte bleiben etwa 1520x848 px, bei 16 px etwa 95x53 Felder, bei 32 px etwa 47x26
+ Seitenleiste etwa 400 px; Minikarte mit 4 px je Feld (100x40 Felder ergeben 400x160 px), bei größeren Ebenen 3 px oder ein Ausschnitt
+ Das Log liegt zwischen Karte und Bedienzeile: nah am Geschehen, die Schnellleiste dafür am unteren Rand wie in Diablo, WoW, BG3 und ToME

### Variante B (umstellbar)

```
+------------------+---------------------------------------------+------------------+
| MINIKARTE        |                                             | Tiefe 3 · Zug    |
|                  |                                             +------------------+
+------------------+                   KARTE                     | NINKASI          |
| LOG              |                                             | ZIELEN           |
| (hoch, etwa      |                                             | IN SICHT         |
|  40 Zeilen,      |                                             |                  |
|  einspaltig)     +---------------------------------------------+------------------+
|                  | Schnellleiste [1]..[0]                      | [i] [f] [c] [m]  |
|                  |                                             | [r] [o] [?] [Esc]|
+------------------+---------------------------------------------+------------------+
```

+ Linke und rechte Spalte etwa 360 px; Karte etwa 1200x1024 px, bei 16 px etwa 75x64 Felder, bei 32 px etwa 37x32
+ Mehr Logzeilen und eine höhere Karte, dafür schmaler; Spalten im Log passen hier nicht, Geschehen und Kampf liegen als Umschalter übereinander

### Weitere Varianten

+ Log oben wie Brogue und Cogmind; die Bedienzeile bleibt unten
+ Seitenleiste links; die Knöpfe wandern mit ihr
+ Kompakt für kleine Fenster: Log 3 Zeilen, Wesen in Sicht als Fenster (Vorbild das "modale" Layout von Cogmind)

## Bedienzeile

+ Am unteren Rand in jeder Variante dieselbe Zeile: links die Schnellleiste unter der Karte, rechts die Knöpfe unten in der Seitenleiste; so bleibt die Handbewegung beim Wechsel des Layouts gleich
+ Knöpfe für die Maus: klickbar, jeder mit Taste und kurzem Wort (z. B. "[i] Gepäck"), in zwei Reihen zu je vier, bei 400 px etwa 96 px je Knopf: Gepäck, Fähigkeiten, Charakter, Karte; Rasten, Erkunden, Hilfe, Menü
+ Die Knöpfe entstehen aus dem Aktionskatalog (siehe Tastatur)
+ Eine Kopfleiste gibt es nicht; Ort und Zeit (Tiefe, Ebene, Zug) stehen im Kopf der Seitenleiste wie bei Brogue, die Karte gewinnt so etwa 28 px Höhe

## Seitenleiste

+ Kopf: Ort und Zeit (Tiefe, Ebene, Zug)
+ Minikarte (Variante A, in B oben in der linken Spalte): erkundete Felder, Ninkasi, Treppen, bekannte Wesen; Klick reist dorthin; die große Übersichtskarte (Taste m) zeichnet derselbe Renderer
+ Ninkasi: LP, MP, PP als Balken, Platz für einen vierten Vorrat (Ausdauer, falls sie kommt), Pegel logarithmisch mit Schwellen, Zustände mit Stärke und Restdauer, laufende Aktion, Heimlichkeit, später Helligkeit des eigenen Feldes (Licht)
+ Zielen und Untersuchen: nur sichtbar, solange der Zielmodus offen ist
+ In Sicht: Wesen nach Abstand mit Wachzustand und Zuständen, "wirkt etwas" bei laufender Aktion; darüber Gefährten (Beschworene, Verbündete) mit LP
+ Seitenleiste und Karte heben sich beim Darüberfahren und beim Untersuchen gegenseitig hervor (Brogue)
+ Gepäck und Fähigkeitenliste stehen nicht mehr in der Seitenleiste, sondern in Fenstern; die Schnellleiste zeigt das Wichtigste davon

## Schnellleiste

+ 10 Plätze auf den Tasten 1 bis 0; belegbar mit Fähigkeiten und Gegenständen (Getränke, Wurfwaffen, Schriftrollen)
+ Automatische Belegung: neu gelernte Fähigkeiten und neue Arten von Getränken rücken auf den ersten freien Platz (Vorbild Qud); umbelegen und umsortieren im Fähigkeiten- bzw. Inventarfenster und per Ziehen mit der Maus; ein von Hand belegter Platz wird nie automatisch überschrieben
+ Mehrere Leisten (Vorbild Qud), umgeschaltet mit einer Taste, die Nummer der Leiste steht daneben
+ Gegenstände liegen nach ihrer Art auf dem Platz, nicht als einzelnes Stück: ist ein Stapel aufgebraucht, bleibt der Platz grau mit Anzahl 0 und füllt sich wieder, sobald Ninkasi ein Stück derselben Art trägt
+ Je Platz: Symbol, Taste, Anzahl bzw. Ladungen, Abklingzeit als Zahl der Züge mit abgedunkeltem Symbol (ToME, Qud), Mindestpegel als Kante mit eigener Form, nicht verfügbar grau mit dem Grund aus der Prüfung des Befehls im Tooltip
+ Unbekannte Gegenstände zeigen, was Ninkasi weiß (siehe Unbekanntes in [Architektur.md](Architektur.md)): Etikett statt Name, Ladungen als "?", bis sie bekannt sind; eine Abklingzeit zeigt der Platz erst, wenn die Art bekannt ist oder Ninkasi sie einmal erlebt hat; die Leiste verrät nie mehr als das Inventarfenster
+ Zielen: braucht die Wirkung ein Ziel, öffnet die Taste den Zielmodus mit vorbelegtem Cursor; ein zweiter Druck derselben Taste bestätigt (Vorbild DCSS), Tab wechselt das Ziel, Esc bricht ab
+ Vorbelegung des Cursors nach der Art der Wirkung: schädlich auf den nächsten Feind in Sicht, nützlich auf den nächsten verletzten Gefährten bzw. Ninkasi selbst; lebt das zuletzt gewählte Ziel und ist in Sicht, gewinnt es; die Art steht als Angabe `zielvorgabe` ("feind", "gefaehrte", "selbst") in den Daten der Fähigkeit bzw. des Gegenstands, ohne Angabe folgt sie aus den Tags der Wirkung
+ Einstellung "sofort auslösen": mit vorbelegtem Ziel ohne Bestätigung wirken (Vorbild Shattered Pixel Dungeon), Vorgabe aus

## Log

+ Unten in zwei Spalten (Variante A): links das Geschehen (Erzählung, Bemerktes, Gehörtes, Hinweise), rechts der Kampf mit Zahlen (Trefferchance, Schaden, Abzug der Rüstung, Krit); Vorbild Cogmind mit getrenntem Kampflog
+ Jede Zeile in Spalten: Zug (Zugmarke, ein Strich trennt die Aktionen Ninkasis wie bei DCSS), Art als Symbol, Text, rechtsbündig die Zahlen
+ Gleiche Zeilen hintereinander werden zusammengefasst ("x3")
+ Neueste Zeile unten, ältere werden blasser
+ Arten mit Farbe und Symbol: Gefahr, Schaden genommen, Schaden ausgeteilt, Heilung, Pegel, Fund, Gespräch, Hinweis
+ Verlauf als Fenster (Strg+P wie in vielen Roguelikes, oder Tab): ganze Länge, Filter nach Art, Suche mit /
+ Das Log zeigt weiterhin nur, was Ninkasi wahrnimmt

## Fenster

+ Ein Stapel über der Karte; das oberste bekommt jede Taste zuerst; Fenster kosten keine Spielzeit
+ Grammatik: Titel mit allen Reitern, links eine Liste mit Buchstaben, rechts die Einzelheiten des Gewählten, unten eine Fußzeile mit den gültigen Tasten; Suche mit / in langen Listen (Qud)
+ Bewegung in Listen: Pfeiltasten oder Strg+j/k; ein Buchstabe wählt direkt; Enter bestätigt; Esc schließt
+ Erklärungen stehen nicht im Fenster selbst, sondern in der Hilfe zum Fenster: `?` in einem Fenster zeigt nur den Text zu diesem Fenster und seine Tasten, `?` im Spiel die allgemeine Hilfe mit allen Tasten (seit 0.27.0, Texte zuerst für Charaktererstellung und Charakter); die ganze Belegung steht nie dauerhaft auf dem Schirm, sichtbar ist, was gerade gilt: die Fußzeile des Fensters, der Hinweis "?: Hilfe", ab 0.28.0 die Tasten auf Knöpfen und Plätzen der Bedienzeile
+ Inventar und Ausrüstung
+ Fähigkeiten (mit Belegung der Schnellleiste)
+ Charakter und Skills (0.27.0)
+ Logverlauf
+ Übersichtskarte
+ Hilfe mit Tastenübersicht aus dem Aktionskatalog
+ Spielmenü: Fortsetzen, Einstellungen, Hilfe, Neustart, Beenden
+ Einstellungen
+ Bestätigung
+ Später: Handel und Dienste, Brauen mit Rezeptbuch, Gespräch (Händler, Nebengottheiten), Ritual und Schriftrollen schreiben, Journal (Ziel des Laufs)

## Unterbrechungen

+ Ein Fenster, das bestätigt werden muss, nur bei Tod, einer Treppe ohne Rückweg und riskanten Handlungen (Lava, unbekannten Fluch anlegen, Angriff auf Neutrale); jede Bestätigung ist in den Einstellungen abschaltbar
+ Die Liste der bestätigungspflichtigen Fälle ist Daten und erweiterbar
+ Alles andere bleibt in Log und Karte

## Esc als Kette

1. Zielmodus abbrechen
2. Oberstes Fenster schließen
3. Reise, Rasten oder Erkunden abbrechen
4. Ist nichts davon offen: Spielmenü öffnen

## Tastatur

+ Spielbar ohne Ziffernblock; Ziffernblock und Pfeiltasten bleiben zusätzlich belegt
+ Bewegung nach den vi-Tasten der Roguelikes (seit Rogue, NetHack): h j k l für links, unten, oben, rechts, y u b n für die Diagonalen; Umschalt plus Richtung läuft, bis etwas Bemerkenswertes passiert
+ Die Belegung nennt physische Tasten (`KeyboardEvent.code`), so bleibt die Form erhalten: auf der deutschen Tastatur liegt die Diagonale links oben auf der Taste mit der Aufschrift Z (entschieden: nach Lage, nicht nach Buchstabe)
+ Zeichen ohne feste Lage (`:`, `/`, `?`, `<`, `>`) gelten nach dem Zeichen (`KeyboardEvent.key`), weil sie auf der deutschen Tastatur anders liegen
+ Aus neovim übernommen: Modi statt Tastenkombinationen (Normalmodus, Zielmodus mit denselben Richtungstasten, Fenster), `:` öffnet eine Befehlszeile mit Vervollständigung über alle Aktionen des Katalogs, `/` sucht in Listen, `?` zeigt die Hilfe, Esc verlässt jeden Modus
+ Nicht übernommen: Zahlen vor einem Befehl (sie gehören der Schnellleiste); das Laufen mit Umschalt deckt den häufigsten Fall ab
+ Aktionskatalog: jede Aktion der Oberfläche hat eine ID, einen Text aus der Sprachdatei, eine Vorgabetaste und optional eine Schaltfläche; daraus entstehen die Knöpfe der Bedienzeile, Hilfe, Befehlszeile, Tooltips und die Seite zur Tastenbelegung
+ Belegungssätze als Vorgaben zum Wählen: "vi" (Vorgabe) und "Ziffernblock"; eigene Änderungen liegen darüber

Vorschlag für die Vorgabe, Buchstaben nach der deutschen Aufschrift:

| Taste | Aktion | heute |
|:--|:--|:--|
| h j k l, Z u b n | Bewegen (Z ist die Lage von y) | Ziffernblock |
| Umschalt + Richtung | Laufen | neu |
| . | Warten | Ziffernblock 5 |
| g | Aufheben | g |
| d | Fallenlassen | im Inventar |
| t | Trinken (wählt im Zweifel) | t |
| w | Werfen (fragt nach dem Gegenstand) | w im Inventar |
| i | Inventar | i |
| f | Fähigkeiten | z |
| c | Charakter und Skills | neu |
| x | Untersuchen | x |
| r | Rasten | r |
| o | Erkunden | o |
| m | Übersichtskarte | neu |
| < > | Treppe | <> |
| Leertaste | Fortsetzen | Leertaste |
| 1 bis 0 | Schnellleiste | neu |
| Tab bzw. Strg+P | Log aufklappen bzw. Verlauf | Tab |
| : | Befehlszeile | neu |
| ? | Hilfe | neu |
| Esc | Kette (siehe oben) | Reise abbrechen |
| + - | Zoom | + - |

+ Die Leisten wechselt Umschalt+1 bis 5; Strg+1 bis 5 schied aus, weil es im Browser die Reiter wechselt und sich nicht sicher abfangen lässt

## Maus

+ Klickregeln wie bisher (aufheben, angreifen, reisen), dazu Klick auf Minikarte, Schaltflächen, Plätze der Schnellleiste und Wesen in der Seitenleiste
+ Ziehen belegt die Schnellleiste
+ Rechtsklick auf ein Feld öffnet dessen ausführliche Beschreibung wie Untersuchen mit X, das Kontextmenü des Browsers wird dafür unterdrückt; der linke Klick handelt wie bisher
+ Mausrad zoomt über der Karte und blättert über Listen und Log

## Gamepad

Für später; vorbereiten kostet fast nichts, wenn drei Regeln von Anfang an gelten:

+ Jede Handlung steht im Aktionskatalog, keine ist nur per Maus erreichbar
+ Jedes Fenster ist mit Richtung, Bestätigen und Zurück bedienbar, der Fokus ist immer sichtbar
+ Keine Information nur beim Darüberfahren (Prinzip 5); Zielmodus und Untersuchen haben schon einen Cursor

Die eigentliche Anbindung (Gamepad-API im Takt von `src/main.js`, Belegung der Knöpfe, ein Ringmenü für die Schnellleiste, Knopfsymbole in Hilfe und Fußzeilen) wäre dann eine eigene, überschaubare Version.

## Einstellungen

+ Anzeige: Zoom, Größe der Oberfläche, Schriftgröße, Vollbild, Layout (Variante A, B, kompakt), Seitenleiste links oder rechts, Log oben oder unten und seine Zeilen, Minikarte an oder aus, Verzögerung des Tooltips
+ Spiel: Reisetempo, Haltegründe, Bestätigungen, Animationen und Geschossbahn, "sofort auslösen" der Schnellleiste
+ Tasten: Belegungssatz, Belegung jeder Aktion mit Erkennung von Konflikten, Vorgabe wiederherstellen
+ Barrierefreiheit: Kontrast, Palette für Farbenblinde, Bewegung reduzieren (schaltet alle bewegten Effekte ab), jeder Metaeffekt einzeln an oder aus, Stärke der Metaeffekte
+ Später: Ton, Sprache, Gamepad
+ Gespeichert wird wie bisher nur die Abweichung von der Vorgabe (`src/eingabe/einstellungen.js`)

## Mechaniken, die noch kommen, und ihr Platz

Die Oberfläche lässt sich jetzt durchplanen; was noch fehlt, bekommt einen vorbereiteten Platz:

+ Brausystem: Fenster Brauen mit Rezeptbuch, laufende Aktion in der Seitenleiste (vorhanden)
+ Hub, Händler, Nebengottheiten: Fenster Handel und Gespräch, Klickregeln für Händler und Kessel
+ Magie mit Ritual, Schrift und Material: Fähigkeitenfenster und laufende Aktion, Fenster für Schriftrollen
+ Licht: Abdunklung der Karte (Renderer), Helligkeit des eigenen Feldes in der Seitenleiste
+ Ausdauer, falls sie kommt: vierter Balken
+ Schwellen des Pegels: in der Pegelanzeige eingezeichnet (vorhanden), Mindestpegel an der Schnellleiste
+ Beschworene und Verbündete: Abschnitt Gefährten
+ Charaktererstellung, Titel, Tod mit Laufbericht, Bestenliste: eigene Bildschirme
+ Ziel des Laufs: Journal als Fenster

## Festlegen, später, umschaltbar

Jetzt festzulegen, weil spätere Änderungen teuer wären:

+ Aktionskatalog als einzige Quelle für Tasten, Schaltflächen, Hilfe und Befehlszeile
+ Fensterstapel mit gemeinsamer Grammatik; Inventar und Fähigkeiten ziehen um, das Skillfenster nutzt ihn als Erstes
+ Zonen als CSS-Grid mit Variablen, Größe der Oberfläche über `rem`
+ Ablage der Belegung der Schnellleiste
+ Esc-Kette und Vorrang der Eingabe (Zielmodus, Fenster, Abläufe, Belegung)

Später festlegbar, ohne dass etwas bricht:

+ Farben, Rahmen, Schriften, Stile (eventuell mehrere wie bei ToME)
+ Symbole der Fähigkeiten (Tiles)
+ Metaeffekte des Pegels, schwebende Zahlen, Lebensbalken über Wesen (Punkt 12)
+ Ton, Gamepad, Tutorial
+ Zahl der Plätze und Leisten

Als Einstellung umschaltbar:

+ Layout-Variante, Seite der Seitenleiste, Lage und Zeilen des Logs, Minikarte, Schnellleiste an oder aus, Bestätigungen, Tooltip

## Entscheidungen

Entschieden am 2026-11-20:

+ Layout: Variante A und B werden beide umgesetzt und sind umstellbar, Vorgabe vorläufig A
+ vi-Tasten nach Lage (`KeyboardEvent.code`): die Form bleibt, auf der deutschen Tastatur liegt die Diagonale links oben auf Z
+ Umschalten der Leisten mit Umschalt+1 bis 5
+ Vorbelegung des Ziels über eine Angabe `zielvorgabe` ("feind", "gefaehrte", "selbst") in den Daten der Fähigkeit bzw. des Gegenstands, ohne Angabe abgeleitet aus den Tags der Wirkung
+ Ablage der Schnellleiste: ein eigener Teil `oberflaeche` im Spielstand (Belegung der Leisten, später weitere Anzeigedaten des Laufs); der Spielstand besteht sonst aus Version, Startwert, Startoptionen und Befehlsliste und wird beim Laden nachgespielt, der Teil `oberflaeche` wird mitgespeichert und beim Laden wieder eingesetzt, aber nicht nachgespielt; die Logik liest ihn nie
+ Rechtsklick untersucht (siehe Maus)
+ Metaeffekte als Idee festgehalten und vorbereitet (Effektschicht, Schalter in den Einstellungen), umgesetzt mit der Darstellung (Punkt 12)
+ Reihenfolge: 0.27.0 Aktionskatalog, Fensterstapel und Skillfenster; 0.28.0 neues Layout mit Bedienzeile (Schnellleiste und Knöpfe), Log in Spalten, Minikarte, Esc-Kette, Spielmenü, Einstellungen und vi-Belegung; die Einordnung neben den übrigen Schwerpunkten (Zustände im Inhalt, Licht, Brausystem) wird bei der weiteren Planung abgestimmt
+ Knöpfe für die Maus in einer Bedienzeile am unteren Rand mit der Schnellleiste, unten in der Seitenleiste; keine Kopfleiste (siehe Bedienzeile)

Offen ist derzeit nichts; neue Fragen kommen hierher.

## Quellen

+ Cogmind, Full UI Upscaling: [Teil 1](https://www.gridsagegames.com/blog/2024/01/full-ui-upscaling-part-1-history-and-theory/), [Teil 2](https://www.gridsagegames.com/blog/2024/01/full-ui-upscaling-part-2-holy-mockups/), [Teil 5](https://www.gridsagegames.com/blog/2024/02/full-ui-upscaling-part-5-completion-and-demos/)
+ Caves of Qud: [Spring Molting](https://freeholdgames.itch.io/cavesofqud/devlog/744713/the-spring-molting-update-is-now-live), [Gamepad und Abilities](https://freeholdgames.itch.io/cavesofqud/devlog/552024/gamepad-support-new-abilities-screen-beta-is-now-live)
+ Jon Shafer, [Building a Solid UI](https://gamedeveloper.com/design/building-a-solid-ui)
+ [Shattered Pixel Dungeon v0.3.1](https://shatteredpixel.com/blog/shattered-pixel-dungeon-v031.html)
+ ToME, [Interface Style](https://te4.org/wiki/Interface_Style)
+ DCSS, [tileweb.h](https://sources.debian.org/src/crawl/2%3A0.34.0-1/source/tileweb.h)
+ Xbox Accessibility Guidelines [107](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/107) und [112](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/112), [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/basic/), [Unity zu Barrierefreiheit](https://unity.com/blog/video-game-accessibility-basics)
+ Fagerholt und Lorentzon, [Zusammenfassung](https://gamedeveloper.com/design/user-interface-design-in-video-games)
+ [Modale Fenster in Spielen](https://indieklem.substack.com/p/5-best-practices-for-modals-in-video), [Hierarchie nach Gewichtung](https://www.strayspark.studio/blog/game-ui-ux-design-principles)
+ BG3, [Hotbar](https://www.gfinityesports.com/guides/baldurs-gate-3-edit-hotbar)
+ Angaben zu Brogue, DCSS-Layout, ToME-Leiste, Diablo, WoW und BG3 ohne Link aus eigener Kenntnis der Spiele, nicht eigens belegt
