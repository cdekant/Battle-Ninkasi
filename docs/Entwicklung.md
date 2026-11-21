# Battle Ninkasi - Entwicklung

Stand: 2026-11-21

Zuständig für: `starten.py`, `starten.bat`, `tests/*`, `werkzeuge/bot.js`, `werkzeuge/messung.js`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md)

Arbeitsweise am Code: Tests, Bot, Werkzeuge, Prototyp, Ablauf einer Version und Stolpersteine.

## Starten

+ Startskript `starten.py` (unter Windows per `starten.bat`): Webserver auf `127.0.0.1:8000` (belegt: freier Port) ohne Zwischenspeicher (`Cache-Control: no-store`), dazu Firefox als eigene Instanz (`-no-remote`) mit Entwicklungsprofil `.firefox-profil/` (in `.gitignore`, wird bei Bedarf angelegt, Einstellungen über `user.js`)
+ Fenster ohne Tabs, Adressleiste und Titelleiste über `chrome/userChrome.css` im Profil (dazu `toolkit.legacyUserProfileCustomizations.stylesheets` und `browser.tabs.inTitlebar` = 1); mit `--mit-leisten` gewohnte Oberfläche, dann bleibt `userChrome.css` leer
+ Endet Firefox, endet der Server; unter Windows mit `-wait-for-browser`, da `firefox.exe` sonst nur einen sofort endenden Startprozess ist; endet Firefox ohne Fehler binnen 5 Sekunden, läuft der Server bis Strg+C weiter; Firefox-Pfad notfalls über Umgebungsvariable `FIREFOX`
+ Fester Port, weil Einstellungen und Speicherplätze im `localStorage` je Ursprung (Host und Port) liegen
+ Von Hand: `python -m http.server`, dann `http://localhost:8000/`

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
+ Tests der Datenprüfung bauen ihre Fehler in eigene Testeinträge (`rohdatenMitTesteintraegen` in `tests/hilfen.js`, alle mit "test" im Namen), nicht in den Spielinhalt; Erwartungen an den Inhalt (z.B. wie viele Fallen eine Ebene hat) leiten sie aus den Daten ab; so lässt sich jeder Inhalt ändern oder löschen, ohne dass ein Test bricht
+ Messung der Leistung bei vielen Gegnern mit `node werkzeuge/messung.js`, siehe [Architektur.md](Architektur.md), Leistung
+ Ausgabe als Tabellen, Auswertung und Diagramme mit Python

## Bot und Werkzeuge

+ `node werkzeuge/bot.js [Läufe=20] [Befehle=3000] [erster Startwert=1]`: spielt mit zufälligen Befehlen, prüft Invarianten, spielt jeden Lauf aus Startwert und Befehlsliste nach und vergleicht die Zustände; speichert mitten im Lauf und lädt wieder; zählt Meldungen (gezeigt, verborgen, gehört), Lernbefehle und Skillstufen, EP je Tiefe nach Herkunft
+ Erfolg heißt die letzte Zeile `... 0 Fehler`; jeder Fehler nennt Startwert und Befehl, damit er sich mit demselben Aufruf nachstellen lässt
+ Die Zählungen sind keine Prüfung, sondern ein grober Blick auf die Balance (z.B. Erkundungs-EP gegen EP aus Gegnern)
+ `node werkzeuge/messung.js`: Leistung bei vielen Gegnern, siehe [Architektur.md](Architektur.md), Leistung
+ `node werkzeuge/tiles-ableiten.js`: leitet die kleinen Tile-Sätze ab, siehe [Tileset.md](Tileset.md)

## Ablauf einer Version

1. Plan mit Empfehlungen vorlegen, Freigabe abwarten
2. Umsetzen mit Tests; neue Dateien bekommen ein zuständiges Dokument
3. Doku nach den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md) nachführen, umgesetzte Punkte aus [Systemausbau.md](Systemausbau.md) streichen
4. Nummer in `src/version.js` erhöhen (Schema siehe [Architektur.md](Architektur.md), Versionen)
5. `node --test` und `node werkzeuge/bot.js` fehlerfrei
6. Commit (`Version X.Y.Z: Thema`), annotierter Tag `vX.Y.Z`, Push, alles erst auf ausdrücklichen Zuruf; reine Doku-Commits heißen `Doku: Thema` und bekommen keine Version

## Stolpersteine

+ Python unter Windows: `Path.write_text` schreibt CRLF; immer `newline="\n"` angeben (Repo durchgängig LF, `.gitattributes`)
+ Python-Skripte mit Umlauten als Datei ausführen, nie über die Shell-Eingabe (stdin), sonst werden die Umlaute verfälscht
+ Der erste Schritt einer langen Aktion läuft sofort; `schritte: N` lässt dem Ziel N-1 Züge (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen)
+ Tests mit Fehlern in den Daten nutzen `rohdatenMitTesteintraegen` (siehe oben), nie den Spielinhalt
+ Tasten: die Belegung nennt physische Tasten (`KeyboardEvent.code`), Buchstaben in Fenstern und Zeichen ohne feste Lage gelten nach `KeyboardEvent.key`; wer das verwechselt, vertauscht auf der deutschen Tastatur Y und Z (siehe [Bedienung.md](Bedienung.md), Eingabe)
+ Logik ohne `Math.random()`, Uhrzeit und Winkelfunktionen (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), Kampfrechnung ohne `Math.exp` und `Math.pow` (siehe [Wesen.md](Wesen.md), Kampfwerte)

## Prototyp

+ Stand 0.4.0, begonnen als 0.0.0; 0.1.0 Maus und Reise, 0.2.0 Tiles im Spiel, 0.3.0 Pegel in Promille, Psi-Punkte und Stoffwechsel, 0.4.0 Tod als Zustandsprüfung, Katalog der Haken, Auslöser aus Daten
+ Umfang: Hub und drei Kellertiefen, Bewegen, Sichtfeld, ein Gegnertyp, Nahkampf, ein Getränk, Pegel, Log
+ Tiles in allen vier Sätzen (ab 0.2.0), Zeichen nur noch als Absicherung
+ rot.js 2.2.1 (Lizenz BSD-3-Clause) liegt unverändert als ES-Module in `lib/rot/`, mit `LICENSE.txt`; benutzt werden Digger (Dungeon), PreciseShadowcasting (Sichtfeld) und AStar (Wegfindung der Gegner); Warteschlange und Spiel-RNG sind eigener Code, da sie als JSON speicherbar sein müssen
+ Starten: im Hauptverzeichnis `python -m http.server`, dann `http://localhost:8000/`; die Seite öffnet den Titel; `?seed=1234` beginnt gleich einen Lauf mit diesem Startwert auf dem ersten leeren Platz
+ Testen: `node werkzeuge/bot.js [Läufe] [Befehle] [erster Startwert]` spielt mit zufälligen Befehlen, prüft Invarianten (u.a. kein Wesen mit Lebenswert 0, nichts Getragenes ohne Trägerin, keine verwaisten Zeitereignisse, keine liegengebliebenen Auslöser) und vergleicht den Zustand nach dem Nachspielen; am Ende zählt er, wie oft Gegner Fähigkeiten gewirkt, lange Aktionen begonnen und abgebrochen haben und wie oft Ninkasi geworfen hat; er reist auch zu bekannten Treppen und wechselt die Ebene
+ Ebene "keller" (Tiefen 1 bis 3): 120x40 Felder, 16 bis 20 Wesen aus der Population (Essigbakterien in Rudeln, Fernkämpfer-Tests), 10 Biere, 3 Brandflaschen, 3 Gärbottiche, je 6 Säuredüsen und Klappergeschirre, je ein Stück Ausrüstung (zwei Kupferringe), Türen an der Hälfte der Raumzugänge, Treppen hinauf und hinab; Ebene "hub" (Tiefe 0) als feste Karte
+ Ninkasi: 100 LP, 100 MP, 0 von 100 PP, Pegel 0 (nach oben offen), Sichtweite 8, Nahkampf 1W6+2 stumpf mit Genauigkeit 80 (80 % gegen ein Wesen ohne Ausweichen)
+ Essigbakterium: 15 LP, Biss 1W4 mit 70%, Verhaltensmodul "jagen" (sieht es Ninkasi, folgt es ihr, sonst geht es zur letzten bekannten Position und wartet)
+ Fernkämpfer-Test (ab 0.15.0, Zeichen F, noch ohne Tile): Testgegner für die KI mit Fähigkeiten, 10 LP, hält 3 Felder Abstand, Säurespucke (Geschoss über Verbündete, Abklingzeit 3) und angekündigter Säureschwall (Kreis mit Radius 1 auf das Feld beim Beginn, 3 Schritte, durch Schaden unterbrechbar, 30 %); Zahlen vorläufig
+ Bier: aufheben mit G, trinken mit T; +20 LP, Pegel +0,5 ‰; die Flasche bleibt; ein Bierfass mit 20 Schlucken je Ebene
+ Stoffwechsel je Welttick, Zahlen vorläufig in `daten/ninkasi.js`: LP 0,3 nüchtern, 0,8 bei 1,5 ‰, darüber abnehmend; MP 0,8 nüchtern, 0 ab 3 ‰; PP Schwund 0,3 nüchtern, Stillstand von 0,5 bis 1,5 ‰, dann steigend bis 1,0 bei 4 ‰; danach Abbau des Pegels um 0,01 ‰
+ Schwellen 0,5, 1, 2 und 3 ‰ werden angezeigt und gemeldet, haben aber noch keine Wirkung; die Leiste zeigt zusätzlich das Optimum der LP
+ Alle Aktionen kosten 100
+ Tasten: Ziffernblock zum Bewegen, 5 Warten, <> Treppe, I Inventar, +/- Zoom (16, 32, 48, 64 px), Tab klappt das Log auf, Eingabe startet nach dem Tod einen neuen Lauf
+ Maus (ab 0.1.0): Klick reist, greift an oder hebt auf, Rad zoomt, siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden
+ Nicht enthalten: Vollbild, ganzzahlige Skalierung für 4K, Umschauen, Markierungen für Gegner außerhalb des Ausschnitts, Prüfsumme der Daten, Englisch (Übersichtskarte und Speichern seit 0.29.0)
+ Vereinfachung: Ein Gegner sieht Ninkasi, wenn sie ihn sieht und er innerhalb seiner Sichtweite steht
+ Auslöser sind im System vorhanden, im Spielinhalt aber noch nicht benutzt
+ Fehlende Strukturen stehen als Arbeitsliste in [Systemausbau.md](Systemausbau.md)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
