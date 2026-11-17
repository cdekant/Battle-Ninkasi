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

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", item: 4711 }`
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
+ Nach einer Unterbrechung entscheidet die Spielerin per Befehl: weitermachen (und z.B. Treffer kassieren, um den Sud nicht zu verderben) oder abbrechen; Folgen eines Abbruchs (verdorben, minderwertig, wieder aufnehmbar) sind Spieldesign und noch offen

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

## Inhalte als Daten

+ Alle Inhalte liegen als JavaScript-Dateien vor, die nur Daten enthalten (`export default { ... }`), mit Kommentaren
+ Dazu gehören Charakter, Eigenschaften, Makel, Skills, Fähigkeiten, Gegner, Verbündete, Händler, Items, Getränke, Zutaten, Rezepte, Kessel, Effekte, Zustände, Tiles, Levelparameter
+ Vorlagen mit Vererbung: z.B. "Bakterium", davon abgeleitet "Essigbakterium" mit Abweichungen
+ Beim Laden werden alle Daten geprüft (Pflichtfelder, Typen, Verweise auf existierende Effekte, Verhaltensmodule, Texte); Fehler erscheinen beim Start mit klarer Meldung
+ Texte stehen nicht in den Daten, sondern als Schlüssel; siehe [Texte.md](Texte.md)

## Ereignisse

+ Interne Haken in der Logik dürfen eingreifen, z.B. "vor Schaden": Rüstung senkt den Wert, ein Schild fängt den Treffer ab; hier hängen Auslöser-Effekte und Zustände an
+ Meldungen nach außen ("Treffer", "Krit", "getrunken", "Tod") sind rein lesend; Anzeige, Log, schwebende Zahlen und Sound hängen sich daran
+ Was auf Meldungen reagiert, darf weder den Zustand ändern noch den Spiel-Zufall benutzen

## Zufall und Wiederholbarkeit

+ Spielstand = Spielversion + Prüfsumme der Daten + Startwert + Liste aller Befehle (JSON); Laden heißt Nachspielen ohne Anzeige
+ Startwert frei wählbar oder zufällig, Abfrage beim Spielstart (Vorbild: Brogue)
+ Zwei Zufallsquellen: Spiel-RNG für die Logik, kosmetischer RNG für Animationen, Partikel und Textvarianten
+ Abgeleitete Startwerte für Inhalte, die nicht vom Spielverlauf abhängen sollen, z.B. Buchtexte aus Lauf-Startwert und Objekt-ID
+ Regeln für die Logik: kein `Math.random()`, keine Uhrzeit, keine Winkelfunktionen, nur ganze Zahlen, feste Reihenfolge beim Durchlaufen von Sammlungen
+ Jede Änderung an Code oder Daten macht alte Spielstände ungültig; passen Version oder Prüfsumme nicht, gibt es eine klare Meldung
+ Nebennutzen: Spielstand als Fehlerbericht, Aufzeichnungen zum Anschauen, "Seed des Tages", automatische Tests

## Anzeige

+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Bezugsgröße 1920x1080, bevorzugt im Vollbild; Vollbild erst nach einer Nutzeraktion (Browser-Regel)
+ Ganzzahlige Skalierung, damit Pixelart scharf bleibt: 1080p 1:1, 4K doppelt, dazwischen 1:1 mit Rand
+ Tile-Größe ist eine Einstellung; Kandidaten 16 und 32 px; die Auflösung der Pixelart (16x16 doppelt oder 32x32 1:1) wird erst bei den ersten Tiles entschieden, bis dahin Zeichen als Platzhalter in beiden Größen testen
+ Eine Kamera ist immer eingebaut: Ist der Ausschnitt größer als das Level, ist das ganze Level sichtbar, sonst scrollt die Karte; Zoomstufen sind nur Kameraeinstellungen
+ Bei 32 px sind auf 1080p etwa 48x28 Felder sichtbar, bei 16 px etwa 96x56
+ Kameraverhalten (Folgen mit Randabstand, Zentrieren, Springen) ist austauschbar und einstellbar
+ Die Levelgröße ist ein Datenwert, Levels dürfen unterschiedlich groß sein; Ziel: größer als Brogue (79x29)
+ Die Sichtweite von Ninkasi ergibt sich aus Skills und Hindernissen; wie mit einer Sichtweite umgegangen wird, die größer ist als der Ausschnitt, ist offen (Kamera zoomt heraus, Begrenzung, Markierungen am Rand)
+ Texte der Oberfläche sind HTML/CSS mit eigenen Schriftgrößen, unabhängig vom Tile-Raster

## Tests und Balancing

+ Die Logik läuft in Node ohne Browser
+ Arena-Simulationen: Ninkasi mit Ausrüstung und Skills X gegen Gegner Y, tausendfach; Ergebnis: Siegquote, verbrauchte LP, Zeit bis zum Sieg
+ Statistiken über erzeugte Dungeons je Startwert: Items, Getränke, Gegner pro Ebene, Weglängen
+ Dumme Bots mit zufälligen Befehlen als einfacher Test auf Abstürze und ungültige Zustände
+ Ausgabe als Tabellen, Auswertung und Diagramme mit Python

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

## Verzeichnisse

Vorschlag, noch nicht bestätigt:

+ `index.html` als Einstieg
+ `src/kern/`: Zustand, Entitäten, Zeit, Zufall, Befehle, Ereignisse, Modifikatoren, Effekte, Register
+ `src/systeme/`: Bewegung, Kampf, Sicht, Pegel, Brauen, Handel u.a.
+ `src/ki/`: Verhaltensmodule
+ `src/welt/`: Dungeon-Erzeugung
+ `src/anzeige/`: Renderer, Kamera, Oberfläche, Effekte
+ `src/eingabe/`: Tastenbelegung, Übersetzung in Befehle
+ `daten/`: Inhalte als JS-Datendateien
+ `sprache/de/`, `sprache/en/`: Texte
+ `lib/`: Bibliotheken (rot.js) samt ihrer Lizenzdateien
+ `werkzeuge/`: Arena, Statistiken, Bots

## Offen

+ Elemente der Oberfläche: Seitenleiste, Log, Inventar, Skillübersicht
+ Übersichtskarte als Minimap, per Umschalttaste oder beides
+ Kameraverhalten im Detail
+ Sichtweite größer als der Ausschnitt
+ Auflösung der Pixelart (16x16 oder 32x32)
+ Folgen eines abgebrochenen Brauvorgangs
+ Verzeichnisstruktur bestätigen
