# Battle Ninkasi - Die Rückkehr der Bierschlächterin

## Axiome

+ Niemals Code schreiben, immer Freigabe abwarten.
+ CLAUDE.md unter 6000 Zeichen Länge halten, wird sie länger: Dokumentation auslagern und darauf verweisen.
+ Keine Änderung ist vollständig bevor nicht CLAUDE.md und die weitere Dokumentation in `docs/` hinsichtlich der Änderungen geprüft und nachgeführt ist.
+ Code grundsätzlich einfach halten aber immer prüfen, ob Wartbarkeit, Modularität und Erweiterbarkeit gegeben ist.
+ Kommunikation im Chat auf Deutsch.
+ Namen von Funktionen, Variablen, Parametern und Datenfeldern sind ausdrücklich und menschenlesbar statt knapp: deutsch, camelCase, der Name sagt, was drinsteht (z. B. `reichweiteSicht` statt `weite`, `entitaet` statt `e`, `spielerin` statt `p`). Ausnahmen nur für Koordinaten (`x`, `y`, `dx`, `dy`), reine Schleifenzähler (`i`) und nachgebaute Fremdverfahren, die die Namen ihrer Referenz behalten (z. B. sfc32 in `src/kern/zufall.js`).
+ Änderungen an der Spiellogik bringen Tests mit (`node:test`, ohne Abhängigkeiten) oder begründen, warum keine nötig sind; vor jedem Commit laufen Tests und Bot fehlerfrei. Details in [docs/Architektur.md](docs/Architektur.md).

## Projektbeschreibung

+ Roguelike-Spiel, Details in [docs/Grundlagen.md](docs/Grundlagen.md)
+ Charakter, Eigenschaften, Skills und EP in [docs/Charakter.md](docs/Charakter.md)
+ Technische Architektur (Datenfluss, Befehle, Zeitmodell, Wirkungsarten, Effekte, Wiederholbarkeit, Anzeige, Licht, Wahrnehmung) in [docs/Architektur.md](docs/Architektur.md)
+ Sprachdateien, Textkorpus (`sprache/de/korpus/`) und Literaturverzeichnis (`sprache/literatur.json`, Originale in `sprache/Literatur/` nicht im Repo) in [docs/Texte.md](docs/Texte.md)
+ Tileset: Artstyle-Fibel, Pixeldaten, Vorschau und Ablauf in [docs/Tileset.md](docs/Tileset.md); neue Tiles folgen der Fibel
+ Weitere Dokumentation liegt in `docs/`.
+ CLAUDE.md verweist direkt auf jedes Dokument in `docs/`, nicht nur über Verweise in anderen Dokumenten.

## Repository und Umgebung

+ Öffentliches Repo: https://github.com/cdekant/Battle-Ninkasi, grundsätzlich auf Hauptbranch `main` arbeiten
+ Starten: `starten.bat` (Windows) bzw. `./starten.py` (Debian) startet Server und eigene Firefox-Instanz mit Profil `.firefox-profil/` (nicht im Repo), Schließen des Fensters beendet den Server; von Hand: `python -m http.server`, dann `http://localhost:8000/`, Ende mit Strg+C; Test der Logik: `node --test` (Unittests in `tests/`) und `node werkzeuge/bot.js`
+ Zeilenenden im Repo durchgängig LF, festgelegt in `.gitattributes`.
+ Versionen nach Schema Ära.Feature.Fix, Nummer in `src/version.js`, jede Version mit annotiertem Git-Tag; Details in [docs/Architektur.md](docs/Architektur.md).
+ `Artwork/` enthält Konzeptbilder als JPG (Qualität 85), in Unterordnern nach Thema (`kampf/`, `titel/`, `tempel/`, `brauerei/`, `ninkasi/`); Dateinamen klein, mit Bindestrichen, ohne Umlaute und Leerzeichen, Varianten nummeriert (`-01`).
+ Lizenzen: Code GPL-3.0-or-later (`LICENSE`), Texte und Grafik CC BY-NC-SA 4.0, Konzeptbilder CC0; Übersicht in `LIZENZEN.md`, Volltexte in `LICENSES/`. Neue Bibliotheken bringen ihre Lizenzdatei mit, neue Bilder und Korpustexte werden in `LIZENZEN.md` eingeordnet.
