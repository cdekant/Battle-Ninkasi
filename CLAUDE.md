# Battle Ninkasi - Die Rückkehr der Bierschlächterin

Roguelike um Ninkasi, die sumerische Göttin des Biers, im Browser ohne Engine und ohne Build; Spiel in [docs/Grundlagen.md](docs/Grundlagen.md).

## Axiome

+ Niemals Code schreiben, immer Freigabe abwarten.
+ CLAUDE.md unter 12000 Zeichen Länge halten, Ziel 10500; wird sie länger: Dokumentation auslagern und darauf verweisen.
+ Keine Änderung ist vollständig, bevor die Dokumentation nach den Pflichten unter "Dokumentation" geprüft und nachgeführt ist.
+ Code grundsätzlich einfach halten aber immer prüfen, ob Wartbarkeit, Modularität und Erweiterbarkeit gegeben ist.
+ Kommunikation im Chat auf Deutsch.
+ Namen von Funktionen, Variablen, Parametern und Datenfeldern sind ausdrücklich und menschenlesbar statt knapp: deutsch, camelCase, der Name sagt, was drinsteht (z. B. `reichweiteSicht` statt `weite`, `entitaet` statt `e`, `spielerin` statt `p`). Ausnahmen nur für Koordinaten (`x`, `y`, `dx`, `dy`), reine Schleifenzähler (`i`) und nachgebaute Fremdverfahren, die die Namen ihrer Referenz behalten (z. B. sfc32 in `src/kern/zufall.js`).
+ Änderungen an der Spiellogik bringen Tests mit (`node:test`, ohne Abhängigkeiten) oder begründen, warum keine nötig sind; vor jedem Commit laufen Tests und Bot fehlerfrei. Details in [docs/Entwicklung.md](docs/Entwicklung.md).

## Designprinzipien

+ Logik und Anzeige strikt getrennt: `src/kern/`, `src/systeme/`, `src/ki/`, `src/welt/` kennen weder DOM noch Canvas noch Tasten und laufen auch in Node (Tests, Bot, Balancing).
+ Eine Eingangstür: jede Entscheidung der Spielerin ist ein Befehl (reines Datenobjekt) über `befehlGeben`; Anzeige und Eingabe verändern den Zustand nie direkt.
+ Inhalte sind Daten, Mechanik ist Code: neue Gegner, Fähigkeiten, Zustände und Gegenstände sind Einträge in `daten/`, die nur per Name auf Code verweisen.
+ Erweitern über Register und Haken statt über Abfragen im Code: Systeme melden Befehlsarten, Bausteine, Modifikatorquellen, KI-Module und Fensterarten an.
+ Wiederholbar: der ganze Zustand ist JSON, jeder Lauf folgt exakt aus Startwert und Befehlsliste; kein `Math.random()`, keine Uhrzeit, nur ganze Zahlen und Brüche.
+ Durchschaubar statt geheim: Formeln bleiben einfach, die Oberfläche zeigt Ergebnisse (Trefferchance, Kosten) statt Rechenwege.
+ Keine Abhängigkeiten außer rot.js in `lib/`, kein Build-Schritt, ES-Module über einen lokalen Webserver.

## Ablauf eines Zugs

Taste → `eingabe/eingabe.js` (Belegung → Aktion aus dem Aktionskatalog) → Befehl → `befehlGeben` in `kern/spiel.js` (prüfen, aufzeichnen) → `befehlAusfuehren` (Haken `vor_befehl`, Befehlsart aus dem Register `befehle`, Haken `zug_ende`) → `vorgangAbschliessen` in `kern/vorgang.js` (Tod und Zustandsprüfungen) → Wiedereinreihen mit Zeitkosten → `warteschlangeAbarbeiten` (Weltuhr, Zeitereignisse, KI-Akteure, lange Aktionen) bis Ninkasi wieder am Zug ist → Meldungen über `melden` (`kern/ereignisse.js`) an Log und Chronik → Anzeige liest den Zustand und zeichnet.

## Ordner

+ `index.html`, `src/main.js`: Einstieg im Browser, verdrahtet Logik, Anzeige und Eingabe; `src/version.js` einzige Quelle der Versionsnummer
+ `src/kern/`: Spiel und Eingangstür (`spiel.js`), Zustand, Zeit, Zufall, Ereignisse und Haken, Register, Vorgang, Werte, Kurven, Effektsystem und Grundbausteine, Auslöser, Datenprüfung
+ `src/systeme/`: die Mechanik je Thema (Kampf, Bewegung, Zustände, Fähigkeiten, Inventar, Gelände, Wahrnehmung, Skills, Lernen u.a.); melden sich beim Import in Registern an (`systeme/index.js`)
+ `src/ki/`: Verhaltensmodule (`abwarten`, `jagen`, `fliehen`), Zielwahl, Schrittwahl, Wahl der Fähigkeiten
+ `src/welt/`: Erzeugung der Ebenen, Karte, Feldschichten, Wegfindung, Geometrie
+ `src/eingabe/`: Aktionskatalog, Belegung, Fensterstapel und Fensterarten, Maus, Abläufe (Reise, Laufen, Rasten, Erkunden), Zielmodus, Einstellungen, Speicherstand; reine Tastenlogik ohne DOM
+ `src/anzeige/`: Renderer, Tilebilder, Kamera, Seitenleiste, Log, Fensterinhalte, Titel, Texte und Grammatik, `stil.css`
+ `daten/`: Inhalte als JS-Daten, gesammelt in `daten/index.js`; Regelwerte für das Balancing in `daten/regeln.js`
+ `sprache/`: Texte, Grammatik und Korpus je Sprache; `grafik/`: Palette und Tiles als Pixeldaten; `lib/`: rot.js mit Lizenz
+ `tests/`: Unittests, `tests/hilfen.js` baut kleine Testspiele; `werkzeuge/`: Bot, Messung, Ableiten der Tiles
+ `Artwork/`: Konzeptbilder (siehe unten)

## Grundbegriffe

+ Entität, Komponente, Wert, Zeitmodell, Ereignis, Haken, Register, Speichern: [docs/Architektur.md](docs/Architektur.md)
+ Wirkungsart, Effekt, Baustein, Modifikator, Auslöser, Zustand, Zielmuster, Fähigkeit, lange Aktion, Vorgang: [docs/Wirkungen.md](docs/Wirkungen.md)
+ Kampfwert, Angriffsprofil, Fraktion, Wahrnehmung, Verhaltensmodul, Bewegungsart, Skill, Lernpunkte: [docs/Wesen.md](docs/Wesen.md)
+ Gelände, Feldschicht, Ebene, Tiefe: [docs/Welt.md](docs/Welt.md); Stapel, Ladung, Platz, Verschleiß, Etikett: [docs/Gegenstaende.md](docs/Gegenstaende.md)
+ Aktion, Belegung, Fensterart, Fensterstapel, Ablauf, Zielmodus, Schnellleiste: [docs/Bedienung.md](docs/Bedienung.md)

## Dokumente

Spieldesign:

+ [docs/Grundlagen.md](docs/Grundlagen.md): Spiel, Spielkern, Charakter, Gegner, Technik, Design, offene Fragen
+ [docs/Charakter.md](docs/Charakter.md): Eigenschaften, Skills, EP und Charaktererstellung
+ [docs/Oberflaeche.md](docs/Oberflaeche.md): Schema der Oberfläche (Layout, Log, Fenster, Tastatur nach vi), Entscheidungen, Stand der Umsetzung
+ [docs/Titelbildschirm.md](docs/Titelbildschirm.md): Titel, Speicherplätze, Chronik, Ideen für später
+ [docs/Animationen.md](docs/Animationen.md): Effektschicht, Kampfanimation, Kamera (zurückgestellt)
+ [docs/Texte.md](docs/Texte.md): Sprachdateien, Textkorpus, Literaturverzeichnis (`sprache/literatur.json`, Originale in `sprache/Literatur/` nicht im Repo)
+ [docs/Tileset.md](docs/Tileset.md): Artstyle-Fibel, Pixeldaten, Varianten; neue Tiles folgen der Fibel
+ [docs/Ausblick.md](docs/Ausblick.md): Ideen ohne Entscheidung, ihre Folgen für den Kern und Vorkehrungen, Recherche

Technik:

+ [docs/Architektur.md](docs/Architektur.md): Kern (Grundsätze, Datenfluss, Befehle, Entitäten, Zeit, Ereignisse, Register, Daten, Wiederholbarkeit, Speichern, Versionen, Leistung)
+ [docs/Wirkungen.md](docs/Wirkungen.md): Wirkungsarten, Effekte, Modifikatoren, Auslöser, Zustände, Zielauswahl, Fähigkeiten, lange Aktionen, Tod
+ [docs/Wesen.md](docs/Wesen.md): Kampfwerte, Fraktionen, Wahrnehmung, KI, Bewegung, Stoffwechsel, Skills und Lernen
+ [docs/Welt.md](docs/Welt.md): Gelände, Feldschichten, Ebenen, Wegfindung, Sicht, Licht, Gefahrenprüfung
+ [docs/Gegenstaende.md](docs/Gegenstaende.md): Inventar, Ausrüstung, Verschleiß, Unbekanntes
+ [docs/Anzeige.md](docs/Anzeige.md): Renderer, Seitenleiste, Kamera, Log
+ [docs/Bedienung.md](docs/Bedienung.md): Eingabe, Maus und Abläufe, Fenster, Schnellleiste, Zielmodus, Untersuchen, Einstellungen
+ [docs/Entwicklung.md](docs/Entwicklung.md): Starten, Tests, Bot, Werkzeuge, Ablauf einer Version, Stolpersteine, Stand des Spielinhalts

Arbeitsliste: [docs/Systemausbau.md](docs/Systemausbau.md), fehlende Strukturen und bekannte Fehler; umgesetzte Punkte wandern in das zuständige Dokument.

## Dokumentation

Kaskade: CLAUDE.md gibt Prinzipien, Ordner und Wegweiser; jedes Dokument in `docs/` beschreibt sein Thema im Einzelnen. Jedes Dokument nennt im Kopf "Mitprüfen bei Änderungen" (Nachbardokumente, gegenseitig); technische Dokumente zusätzlich "Zuständig für" (Dateien und Ordner, die sie beschreiben).

+ Jede Datei in `src/`, `daten/`, `sprache/`, `grafik/`, `lib/`, `werkzeuge/`, `tests/` und jedes Startskript hat genau ein zuständiges Dokument; neue Dateien bekommen es sofort, neue Dokumente einen Eintrag hier.
+ Wer eine Datei ändert, führt ihr zuständiges Dokument nach und prüft die Dokumente aus dessen "Mitprüfen"; ändern sich Prinzipien, Ordner oder Begriffe, auch CLAUDE.md.
+ Jede Aussage steht an genau einer Stelle; andere verweisen darauf, in Markdown als Link auf das Dokument mit dem Abschnitt dahinter, im Code als `siehe docs/<Dokument>.md, <Abschnitt>`.
+ Design-Dokumente (ohne "Zuständig für") sagen was und warum, technische wie (Daten, Schnittstellen, Regeln); Zahlen und Formeln stehen nur im technischen Dokument oder in `daten/regeln.js`. Jeder Design-Abschnitt endet mit "Umsetzung: siehe …", "teilweise, siehe …; offen: …", "offen" oder "keine"; dort Genanntes steht unter "Mitprüfen".
+ Widersprechen sich Doku und Code, wird das gemeldet und nicht still einseitig angepasst.
+ Vor jedem Commit: Verweise, Zuordnung, Köpfe, Umsetzungszeilen und Limit stimmen (geprüft von `tests/doku.test.js` bei `node --test`); Tests und Bot laufen fehlerfrei. Doppeltes und inhaltliche Widersprüche findet kein Test, das bleibt Handarbeit.

## Repository und Umgebung

+ Öffentliches Repo: https://github.com/cdekant/Battle-Ninkasi, grundsätzlich auf Hauptbranch `main` arbeiten
+ Starten: `starten.bat` (Windows) bzw. `./starten.py` (Debian) startet Server und eigene Firefox-Instanz mit Profil `.firefox-profil/` (nicht im Repo) als Fenster ohne Leisten (`--mit-leisten` für die gewohnte Oberfläche), Schließen des Fensters beendet den Server; von Hand: `python -m http.server`, dann `http://localhost:8000/`, Ende mit Strg+C; Test der Logik: `node --test` (Unittests in `tests/`) und `node werkzeuge/bot.js`
+ Zeilenenden im Repo durchgängig LF, festgelegt in `.gitattributes`.
+ Versionen nach Schema Ära.Feature.Fix, Nummer in `src/version.js`, jede Version mit annotiertem Git-Tag; Ablauf in [docs/Entwicklung.md](docs/Entwicklung.md).
+ `Artwork/` enthält Konzeptbilder als JPG (Qualität 85) in Themenordnern (`kampf/`, `titel/`, `tempel/`, `brauerei/`, `ninkasi/`); öffentliche Bilder liegen direkt im Themenordner (im Repo), die private Sammlung in `<thema>/privat/` (ignoriert, selbst sichern); veröffentlichen heißt eine Ebene nach oben schieben; ein neues Thema bekommt `.gitkeep` und `privat/`; Dateinamen klein, mit Bindestrichen, ohne Umlaute und Leerzeichen, Varianten nummeriert (`-01`); `Artwork/ComfyAI/` (Arbeitsordner der Bilderzeugung) ist ignoriert.
+ Lizenzen: Code GPL-3.0-or-later (`LICENSE`), Texte und Grafik CC BY-NC-SA 4.0, öffentliche Konzeptbilder CC0; Übersicht in `LIZENZEN.md`, Volltexte in `LICENSES/`. Neue Bibliotheken bringen ihre Lizenzdatei mit, neue Bilder und Korpustexte werden in `LIZENZEN.md` eingeordnet.
