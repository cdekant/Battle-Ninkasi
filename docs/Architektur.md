# Battle Ninkasi - Architektur

Stand: 2026-11-17

## Grundsätze

+ Modularität und Erweiterbarkeit haben Vorrang, auch auf Kosten höherer Code-Komplexität
+ Spiellogik und Anzeige strikt getrennt: Die Logik kennt kein DOM, kein Canvas, keine Tasten
+ Die Logik läuft auch ohne Browser (Node), für Tests, Simulationen und Balancing
+ Inhalte sind Daten, Mechanik ist Code; neue Inhalte brauchen im Regelfall keinen neuen Code
+ Jeder Lauf ist aus Startwert und Befehlsliste exakt reproduzierbar
+ Keine Spiele-Engine, kein Build-Schritt; JavaScript-Module (ES-Module), lokal über einen Webserver gestartet (z.B. `python -m http.server`), da Module über `file://` nicht laden

## Datenfluss

1. Eingabe (Tastatur, Maus, später Gamepad) wird über eine frei belegbare Zuordnung in Befehle übersetzt
2. Befehle gehen durch eine einzige Eingangstür in die Logik und werden für den Spielstand aufgezeichnet
3. Die Logik prüft den Befehl (am Zug? zulässig?), führt ihn aus und verändert den Zustand
4. Die Logik meldet Ereignisse nach außen
5. Anzeige, Log, Effekte und später Sound reagieren auf Ereignisse und lesen den Zustand, ohne ihn zu verändern

## Befehle

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", gegenstandId: 4711 }`
+ Alles, was die Spielerin entscheidet, ist ein Befehl: Bewegen, Angreifen, Trinken, Brauen, aber auch Menüentscheidungen wie Skillwahl, Handel, Rezeptwahl, Weiterbrauen oder Abbrechen
+ Die Anzeige verändert den Spielzustand nie direkt, sie erzeugt nur Befehle
+ Keine Befehle sind reine Anzeige-Zustände: Fenster öffnen, im Log blättern, Tooltips, Karte verschieben, Zoom; sie kosten keine Zeit und kommen nicht in den Spielstand
+ Einstellungen (Tastenbelegung, Zoom, Kameraverhalten) sind keine Befehle und werden getrennt gespeichert
+ Tastatur, Maus, Gamepad, Testbots und Simulationen benutzen denselben Weg

## Entitäten und Komponenten

+ Alles in der Welt ist eine Entität: Ninkasi, Gegner, Verbündete, Händler, Items, Kessel, Fallen
+ Eine Entität ist eine ID plus Komponenten, z.B. Position, Werte, Inventar, KI, Fraktion, Handel, Braukessel, Sicht
+ Unterschiede entstehen allein durch die Kombination der Komponenten
+ Beispiele: Psi-Kontrolle ändert die Fraktion; Kulturhefe als Verbündete ist ein Dateneintrag; ein Phage tauscht beim Befall Komponenten des Bakteriums aus; ein wandernder Händler hat eine Handelskomponente und eine friedliche Fraktion
+ Werte (LP, MP, PP und weitere) sind ein erweiterbarer Satz, keine fest verdrahteten Felder
+ Der gesamte Zustand ist reine Daten und als JSON serialisierbar (keine Funktionen, keine DOM-Objekte)

## Zeitmodell

+ Ein einziger Zeitstrahl in ganzzahligen Zeiteinheiten
+ Aktionskosten statt Runden: Jede Aktion kostet Zeit, Standard 100; wer an der Reihe ist, bestimmt die Warteschlange nach Zeitpunkt
+ Kosten je Aktionsart verschieden (Bewegen, Nahkampf, Fernkampf, Trinken, Psi, Magie, Brauen u.a.); Modifikatoren zielen auf eine Aktionsart oder auf alle
+ Prozentuale Änderungen werden einheitlich gerundet; Rundungsfehler liegen bei etwa 1% und werden hingenommen
+ Die Warteschlange enthält drei Arten von Einträgen:
  + Akteure (Ninkasi, Gegner, Verbündete), die nach dem Handeln mit ihren Aktionskosten wieder eingereiht werden
  + die Weltuhr, alle 100 Einheiten (ein Welttick): Regeneration, Abklingen des Pegels, Magie über die Zeit
  + Zeitereignisse, z.B. "Status endet bei T=4350", "Endospore erwacht bei T=8000"
+ Gleichstand wird fest aufgelöst: zuerst die Weltuhr, dann Zeitereignisse, dann Akteure nach Erzeugungsreihenfolge
+ Dauern werden in Zeiteinheiten angegeben, nicht in Ticks
+ Bruchteile (z.B. 0,3 LP pro Tick) laufen über ganzzahlige Speicher in Hundertsteln, ein voller Punkt wird gutgeschrieben, der Rest bleibt stehen
+ Lange Aktionen (z.B. Brauen mit 2000 Einheiten) laufen in Schritten und werden unterbrochen, sobald eine Gefahr auftaucht (Gegner im Sichtfeld, Schaden)
+ Nach einer Unterbrechung entscheidet die Spielerin per Befehl: weitermachen (und z.B. Treffer kassieren, um den Sud nicht zu verderben) oder abbrechen; die Folgen eines Abbruchs sind Spieldesign, siehe [Grundlagen.md](Grundlagen.md)

## Wirkungsarten

Skills, Items, Zustände und Fähigkeiten wirken über sechs Arten, die frei kombinierbar sind:

1. Modifikatoren ändern Zahlen, z.B. "Braupaddel der Geschwindigkeit: Angriff kostet 33% weniger Zeit", "Skill: Bewegung 5% schneller"
2. Auslöser-Effekte reagieren auf Ereignisse, z.B. "bei Angriff, 15% Chance, weiterer Angriff", "beim Tod Sporen freisetzen"
3. Aktionsveränderer ändern, wie eine Aktion abläuft: Zielmuster, Reichweite, Fläche; z.B. "Braupaddel des Rundumschlags trifft alle angrenzenden Felder", "Speer trifft zwei Felder in Linie"; Zielmuster sind Daten (`muster: "angrenzend"`, `muster: "linie", laenge: 2`)
4. Zustände sind zeitlich begrenzt, mit Verlauf (gleichbleibend, abklingend, ansteigend) und Stapelregel (erneuern, aufaddieren, nur der stärkste); sie bündeln selbst Modifikatoren und Auslöser; z.B. Schaden über Zeit, abklingender Segen, sich steigernde Vergiftung
5. Auren wirken auf andere im Umkreis der Trägerin, z.B. "Gegner in der Nähe langsamer", "Hefen in der Nähe sprossen schneller"
6. Gewährte Aktionen schalten eine neue Aktion frei, z.B. "Braupaddel erlaubt Ansturm"

Jede Wirkungsart kann zusätzlich tragen:

+ Bedingungen: nur ab Pegel X, nur gegen Bakterien, nur unter 30% LP, nur mit zwei Kupfer-Items (Sets, Synergien)
+ Nachteile: negative Werte, z.B. für verfluchte Items

Jeder Modifikator kennt seine Quelle (Skill, Item, Zustand, Pegel); entfällt die Quelle, entfallen genau ihre Modifikatoren. Werte werden bei Bedarf aus Grundwert und Modifikatoren berechnet. Wie Boni verrechnet werden (addieren, multiplizieren), regelt [Charakter.md](Charakter.md).

## Effektsystem

+ Zwei Schichten, wie Lego: Der Code liefert die Steine, die Daten bauen daraus
+ Grundbausteine sind Code: wenige Dutzend kleine, stabile Funktionen, z.B. Schaden, Heilen, Pegel ändern, Zustand setzen, Beschwören, Versetzen, Fraktion ändern, Feld verändern
+ Zusammengesetzte Effekte sind Daten, benannt und wiederverwendbar, z.B. "Feuerbier-Explosion": Fläche 3x3, Feuerschaden 2W6, Zustand "brennend" für 300 Einheiten
+ Ein neuer Grundbaustein ist nur für eine wirklich neue Mechanik nötig
+ Benannte Verhaltensmodule (Code) für alles, was sich nicht aus Bausteinen zusammensetzen lässt: KI-Muster wie Zweiteilung, Sprossung, Myzelwachstum, Phagen-Befall, Bossphasen; die Daten verweisen nur darauf, z.B. `ki: "sprossung"` mit Parametern
+ Grundbausteine, Verhaltensmodule und Zielmuster werden in Registern angemeldet; auch Mods können dort eigene anmelden
+ Erweiterbar ist grundsätzlich alles über Register (`src/kern/register.js`): Befehlsarten, Grundbausteine, Verhaltensmodule, Zielmuster, Handler der Weltuhr, Zeitereignisse, interne Haken und Gefahrenprüfungen; Systeme und Verhaltensmodule melden sich beim Import an, die Reihenfolge der Anmeldung ist fest
+ Eine Befehlsart besteht aus `pruefen` (Grund der Ablehnung oder nichts) und `ausfuehren` (gibt die Aktionsart für die Zeitkosten zurück); Gegner benutzen dieselben Befehlsarten, ihre Befehle werden aber nicht aufgezeichnet

## Inhalte als Daten

+ Alle Inhalte liegen als JavaScript-Dateien vor, die nur Daten enthalten (`export default { ... }`), mit Kommentaren
+ Dazu gehören Charakter, Eigenschaften, Makel, Skills, Fähigkeiten, Gegner, Verbündete, Händler, Items, Getränke, Zutaten, Rezepte, Kessel, Effekte, Zustände, Tiles, Levelparameter
+ Vorlagen mit Vererbung: z.B. "Bakterium", davon abgeleitet "Essigbakterium" mit Abweichungen
+ Beim Laden werden alle Daten geprüft (Pflichtfelder, Typen, Verweise auf existierende Effekte, Verhaltensmodule, Texte); Fehler erscheinen beim Start mit klarer Meldung
+ Texte stehen nicht in den Daten, sondern als Schlüssel; siehe [Texte.md](Texte.md)

## Ereignisse

+ Interne Haken in der Logik dürfen eingreifen, z.B. "vor Schaden": Rüstung senkt den Wert, ein Schild fängt den Treffer ab; hier hängen Auslöser-Effekte und Zustände an
+ Meldungen nach außen ("Treffer", "Krit", "getrunken", "Tod") sind rein lesend; Anzeige, Log, schwebende Zahlen und Sound hängen sich daran
+ Meldungen verweisen auf Entitäten über Bezüge (`{ id, typ, text }`), die auch nach dem Entfernen der Entität gültig bleiben; die Felder `art` und `zeit` sind reserviert
+ Wertänderungen laufen über eine gemeinsame Funktion, die den Haken "nach_wertaenderung" auslöst (z.B. für Pegelschwellen)
+ Was auf Meldungen reagiert, darf weder den Zustand ändern noch den Spiel-Zufall benutzen

## Zufall und Wiederholbarkeit

+ Spielstand = Spielversion + Prüfsumme der Daten + Startwert + Liste aller Befehle (JSON); Laden heißt Nachspielen ohne Anzeige
+ Startwert frei wählbar oder zufällig, Abfrage beim Spielstart (Vorbild: Brogue)
+ Zwei Zufallsquellen: Spiel-RNG für die Logik, kosmetischer RNG für Animationen, Partikel und Textvarianten
+ Abgeleitete Startwerte für Inhalte, die nicht vom Spielverlauf abhängen sollen, z.B. Buchtexte aus Lauf-Startwert und Objekt-ID
+ Regeln für die Logik: kein `Math.random()`, keine Uhrzeit, keine Winkelfunktionen, nur ganze Zahlen, feste Reihenfolge beim Durchlaufen von Sammlungen
+ Spiel-RNG: eigener Generator sfc32 (`src/kern/zufall.js`), nur ganze Zahlen, Zustand aus vier 32-Bit-Zahlen im Spielzustand; jede Änderung am Verfahren ändert die Zahlenfolge
+ rot.js hat einen eigenen, globalen RNG; er wird nur für die Dungeon-Erzeugung benutzt und vorher mit einem abgeleiteten Startwert gesetzt
+ Fallstrick: Die Kartengeneratoren von rot.js (Digger, Uniform) brechen nach einer Zeitgrenze ab (`timeLimit`, gemessen mit `Date.now()`); sie wird deshalb immer auf `Infinity` gesetzt
+ Abgeleitete Startwerte: Spiel-RNG (`"spiel"`), Grundriss (`"ebene.<name>"`) und Inhalt einer Ebene (`"ebene.<name>.inhalt"`) haben eigene Quellen, damit die Ebene nicht vom Spielverlauf abhängt
+ Jede Änderung an Code oder Daten macht alte Spielstände ungültig; passen Version oder Prüfsumme nicht, gibt es eine klare Meldung
+ Nebennutzen: Spielstand als Fehlerbericht, Aufzeichnungen zum Anschauen, "Seed des Tages", automatische Tests

## Versionen

+ Schema Ära.Feature.Fix, z.B. 0.3.1
+ Erste Zahl: Ära, ein großer Entwicklungsabschnitt
+ Zweite Zahl: Feature, eine neue Funktion
+ Dritte Zahl: kleines Feature oder Fehlerbehebung
+ Steigt eine Zahl, beginnen die Zahlen rechts davon wieder bei 0
+ 0.0.0 ist die erste Version des Prototyps
+ Die Version ist Teil jedes Spielstands, siehe Zufall und Wiederholbarkeit
+ Einzige Quelle der Versionsnummer ist das Modul `src/version.js` (`export default "0.0.0"`), von Browser und Node gleich importiert
+ Jede Version bekommt einen annotierten Git-Tag (`v0.3.1`), auch Fehlerbehebungen
+ Ablauf: Nummer in `src/version.js` erhöhen, committen, taggen, pushen
+ Commits zwischen zwei Versionen tragen dieselbe Nummer wie die vorige Version; verbindlich nachspielbar sind nur Spielstände getaggter Versionen

## Anzeige

+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Bezugsgröße 1920x1080, bevorzugt im Vollbild; Vollbild erst nach einer Nutzeraktion (Browser-Regel)
+ Ganzzahlige Skalierung, damit Pixelart scharf bleibt: 1080p 1:1, 4K doppelt, dazwischen 1:1 mit Rand
+ Pixelart in vier Sätzen: 16, 32, 48 und 64 px, jeder Satz eigens gezeichnet, größere Sätze mit mehr Details
+ Gezeichnet wird zuerst der größte Satz (64 px), die kleineren entstehen daraus durch Generalisieren von Hand, nicht durch Verkleinern
+ Begonnen wird mit einem Satz; fehlende Sätze und fehlende Tiles ersetzt der Renderer durch Skalieren eines vorhandenen Satzes oder durch ein Zeichen
+ Ein Tileset ist eine Datendatei mit Einträgen je Auflösung; der Renderer wählt zur Zoomstufe den passenden Satz und einen ganzzahligen Faktor
+ Tiles sind Pixeldaten (Palette plus Pixelmatrix als JS-Datendatei in `grafik/`), der Renderer baut daraus beim Start die Bilder; Einzelheiten in [Tileset.md](Tileset.md)
+ Zoom ist eine Einstellung mit frei festlegbaren Stufen, nicht an bestimmte Tile-Größen gebunden; scharf bleibt Pixelart nur in ganzzahligen Vielfachen ihrer Auflösung (16 als 16, 32, 48, 64 px; 32 als 32, 64, 96 px)
+ Bis zu den ersten Tiles Zeichen als Platzhalter in allen Zoomstufen
+ Standard-Zoomstufe vorerst 16 px, jederzeit änderbar
+ Eine Kamera ist immer eingebaut: Ist der Ausschnitt größer als das Level, ist das ganze Level sichtbar, sonst scrollt die Karte; Zoomstufen sind nur Kameraeinstellungen
+ Die Levelgröße ist ein Datenwert, Levels dürfen unterschiedlich groß sein; Ziel: größer als Brogue (79x29)
+ Texte der Oberfläche sind HTML/CSS mit eigenen Schriftgrößen, unabhängig vom Tile-Raster

## Oberfläche

+ Karte auf dem größten Teil des Bildschirms, rechts eine Seitenleiste (etwa 400 px), unten ein Log (4 bis 5 Zeilen, aufklappbar)
+ Sichtbar bei 1080p neben Seitenleiste und Log: bei 16 px etwa 95x57 Felder, bei 32 px etwa 47x28, bei 48 px etwa 31x19, bei 64 px etwa 23x14
+ Seitenleiste: LP und MP als Balken, Pegel als eigene, auffällige Anzeige mit eingezeichneten Schwellen, aktive Zustände, Liste der sichtbaren Gegner (Vorbild: Brogue)
+ Inventar, Skillübersicht, Handel und Brauen als Fenster über der Karte; Öffnen und Schließen sind keine Befehle
+ Übersichtskarte per Umschalttaste, gezeichnet vom selben Renderer mit kleinen Feldern (4 bis 8 px); eine Minimap in der Seitenleiste ist später mit demselben Renderer möglich
+ Alle Elemente sind Anzeige und lassen sich ändern, ohne die Logik zu berühren

## Kamera

+ Folgen mit Randabstand: Die Kamera bewegt sich erst, wenn Ninkasi näher als etwa ein Viertel des Ausschnitts an den Rand kommt
+ Am Levelrand bleibt die Kamera stehen, jenseits des Levels ist nichts zu sehen; kleinere Levels stehen mittig
+ Zunächst feldweises Springen, weiches Scrollen später als reine Anzeige
+ Umschauen: Karte frei verschieben per Maus oder Taste, ein Anzeige-Zustand
+ Weitere Verhaltensweisen (Zentrieren, Springen) bleiben austauschbar und einstellbar

## Sichtweite

+ Die Sichtweite von Ninkasi ergibt sich aus Skills und Hindernissen
+ Ist sie größer als der Ausschnitt, wird nicht herausgezoomt; stattdessen zeigen Markierungen am Kartenrand Gegner außerhalb des Ausschnitts, die Gegnerliste der Seitenleiste nennt alle sichtbaren Gegner

## Eingabe

+ Vorgabe für die Bewegung: Ziffernblock, acht Richtungen, 5 für Warten
+ Die Belegung ist frei änderbar, siehe Datenfluss; sie umfasst Tasten, Maustasten und das Mausrad (`src/eingabe/belegung.js`)
+ Einstellungen (Zoom, Reise) haben Vorgaben in `src/eingabe/einstellungen.js`; der Browser speichert nur Abweichungen davon

## Maus und Reise

+ Die Maus erzeugt nur gewöhnliche Befehle; die Logik kennt weder Maus noch Reise
+ Ein Klick wird über eine geordnete Liste von Klickregeln gedeutet (`src/eingabe/maus.js`), die erste passende greift: eigenes Feld mit Gegenstand hebt auf, angrenzender sichtbarer Feind wird angegriffen, sonst Reise zum Feld; weitere Regeln (Kessel, Händler) kommen in die Liste
+ Eine Reise ist eine Folge von Befehlen "bewegen"; der Kern (`src/eingabe/reise.js`) liefert Schritt für Schritt den nächsten Befehl oder einen Grund zum Anhalten und kommt ohne Timer und DOM aus, Browser und Bot benutzen ihn gleich; den Takt gibt im Browser `src/main.js` vor (Einstellung `reisePause`)
+ Gereist wird nur über erkundete Felder, der Weg wird bei jedem Schritt neu berechnet; beim Darüberfahren zeigt die Anzeige den Weg als Vorschau
+ Solange Feinde in Sicht sind, beginnt keine Reise (Einstellung `reiseTrotzFeinden`, Vorgabe aus); ist sie an, hält die Reise nur bei neu auftauchenden Feinden
+ Eine Reise hält an bei: neuem Feind in Sicht, Schaden, Gegenstand auf dem Feld (Liste `reiseHalt` in den Einstellungen), außerdem bei Ankunft, fehlendem Weg, versperrtem Feld, Tod und jeder Taste oder jedem Klick
+ Das Mausrad zoomt
+ Später auf derselben Grundlage: automatisches Erkunden (andere Zielwahl), Tooltips und Umschauen am Feld unter dem Zeiger

## Gefahrenprüfung

+ Reine Lesefunktionen in `src/systeme/gefahr.js`: Eine Lage ist ein Schnappschuss (sichtbare Feinde, LP), zwei Lagen werden verglichen
+ Prüfungen sind im Register "gefahren" angemeldet (`gegner_in_sicht`, `schaden`); die Reise nutzt sie, später auch lange Aktionen wie das Brauen

## Wegfindung

+ Ein gemeinsames Modul `src/welt/wege.js` für KI und Reise, AStar aus rot.js mit acht Richtungen
+ Optionen: nur erkundete Felder (Spielerin, keine Hellseherei), Wesen meiden
+ Später: Kosten je Gelände (Fallen meiden), dann für KI und Spielerin zugleich

## Erster Prototyp

+ Version 0.0.0
+ Umfang: eine Ebene, Bewegen, Sichtfeld, ein Gegnertyp, Nahkampf, ein Getränk, Pegel, Log
+ Zeichen als Platzhalter statt Tiles
+ rot.js 2.2.1 (Lizenz BSD-3-Clause) liegt unverändert als ES-Module in `lib/rot/`, mit `LICENSE.txt`; benutzt werden Digger (Dungeon), PreciseShadowcasting (Sichtfeld) und AStar (Wegfindung der Gegner); Warteschlange und Spiel-RNG sind eigener Code, da sie als JSON speicherbar sein müssen
+ Starten: im Hauptverzeichnis `python -m http.server`, dann `http://localhost:8000/`; Startwert per `?seed=1234`, sonst zufällig, er wird in die URL geschrieben
+ Testen: `node werkzeuge/bot.js [Läufe] [Befehle] [erster Startwert]` spielt mit zufälligen Befehlen, prüft Invarianten und vergleicht den Zustand nach dem Nachspielen
+ Ebene "keller": 120x40 Felder, 15 Essigbakterien, 10 Biere
+ Ninkasi: 100 LP, 100 MP, PP 0 von 100, Sichtweite 8, Nahkampf 1W6+2 mit 80% Trefferchance
+ Essigbakterium: 15 LP, Biss 1W4 mit 70%, Verhaltensmodul "jagen" (sieht es Ninkasi, folgt es ihr, sonst geht es zur letzten bekannten Position und wartet)
+ Bier: aufheben mit G, trinken mit T; +20 LP, +20 PP
+ Pegel je Welttick: PP -1, mit PP > 0 Regeneration 0,5 LP und 0,5 MP; Schwellen 25, 50, 75 werden angezeigt und gemeldet, haben aber noch keine Wirkung
+ Alle Aktionen kosten 100
+ Tasten: Ziffernblock zum Bewegen, 5 Warten, +/- Zoom (16, 32, 48, 64 px), Tab klappt das Log auf, Eingabe startet nach dem Tod einen neuen Lauf
+ Maus (ab 0.1.0): Klick reist, greift an oder hebt auf, Rad zoomt, siehe Maus und Reise
+ Nicht enthalten: Vollbild, ganzzahlige Skalierung für 4K, Übersichtskarte, Umschauen, Markierungen für Gegner außerhalb des Ausschnitts, Spielstand speichern und laden (Nachspielen ist vorhanden), Prüfsumme der Daten, Englisch
+ Vereinfachung: Ein Gegner sieht Ninkasi, wenn sie ihn sieht und er innerhalb seiner Sichtweite steht

## Tests und Balancing

+ Die Logik läuft in Node ohne Browser
+ Unittests mit dem in Node eingebauten `node:test` und `node:assert`, ohne Abhängigkeiten; Dateien in `tests/`, benannt nach dem geprüften Modul mit Endung `.test.js` (z. B. `tests/wege.test.js`); Aufruf `node --test` im Hauptverzeichnis
+ Testpflicht gilt für die Spiellogik (`src/kern/`, `src/systeme/`, `src/ki/`, `src/welt/`): Jede Änderung dort bringt Tests mit oder begründet im Vorschlag, warum keine nötig sind
+ Tests prüfen Regeln und Ergebnisse (Trefferchance, Schwellen, Wege, Gefahrenprüfung), nicht die innere Umsetzung; Zufall immer über festen Startwert
+ Anzeige und Eingabe (`src/anzeige/`, `src/eingabe/`) sind ausgenommen, soweit sie keine eigene Logik enthalten; reine Logik dort (z. B. Klickregeln, Grammatik) wird ebenfalls getestet
+ Vor jedem Commit laufen `node --test` und `node werkzeuge/bot.js` fehlerfrei
+ Arena-Simulationen: Ninkasi mit Ausrüstung und Skills X gegen Gegner Y, tausendfach; Ergebnis: Siegquote, verbrauchte LP, Zeit bis zum Sieg
+ Statistiken über erzeugte Dungeons je Startwert: Items, Getränke, Gegner pro Ebene, Weglängen
+ Dumme Bots mit zufälligen Befehlen als einfacher Test auf Abstürze und ungültige Zustände
+ Ausgabe als Tabellen, Auswertung und Diagramme mit Python

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

## Verzeichnisse

+ `index.html` als Einstieg, `src/main.js` verdrahtet Logik, Anzeige und Eingabe
+ `package.json`: nur `"type": "module"` und `"private": true`, damit Node alle `.js`-Dateien als ES-Module liest; keine Abhängigkeiten, kein Build
+ `src/version.js`: Versionsnummer
+ `src/kern/`: Spiel und Eingangstür für Befehle (`spiel.js`), Zustand und Entitäten, Zeit, Zufall, Ereignisse, Werte und Modifikatoren, Effekte, Grundbausteine, Register, Datenprüfung
+ `src/systeme/`: Bewegung, Kampf, Sicht, Pegel, Inventar, Gefahrenprüfung, später Brauen, Handel u.a.
+ `src/ki/`: Verhaltensmodule
+ `src/welt/`: Dungeon-Erzeugung, Zugriff auf die Karte, Wegfindung
+ `src/anzeige/`: Renderer, Kamera, Oberfläche, Log, Effekte, Textzugriff und Grammatik
+ `src/eingabe/`: Belegung, Übersetzung in Befehle, Maus und Klickregeln, Reise, Vorgaben der Einstellungen
+ `daten/`: Inhalte als JS-Datendateien, gesammelt in `daten/index.js`; `daten/zeichen.js` ist das Tileset aus Zeichen
+ `grafik/`: Palette und Tiles als Pixeldaten, unter der Grafiklizenz, dazu die Vorschauseite `vorschau.html`; siehe [Tileset.md](Tileset.md)
+ `sprache/de/`, `sprache/en/`: Texte (`texte.js`) und Grammatikregeln (`grammatik.js`) als Daten
+ `lib/`: Bibliotheken (rot.js) samt ihrer Lizenzdateien
+ `werkzeuge/`: Arena, Statistiken, Bots
+ `tests/`: Unittests (`*.test.js`), siehe Tests und Balancing; `tests/hilfen.js` baut kleine Spiele aus Testkarten (ohne Dungeon-Erzeugung) samt Wesen und Spielerin
