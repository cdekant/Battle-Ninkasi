# Battle Ninkasi - Die Rückkehr der Bierschlächterin

## Axiome

+ Niemals Code schreiben, immer Freigabe abwarten.
+ CLAUDE.md unter 6000 Zeichen Länge halten, wird sie länger: Dokumentation auslagern und darauf verweisen.
+ Keine Änderung ist vollständig bevor nicht CLAUDE.md und die weitere Dokumentation in `docs/` hinsichtlich der Änderungen geprüft und nachgeführt ist.
+ Code grundsätzlich einfach halten aber immer prüfen, ob Wartbarkeit, Modularität und Erweiterbarkeit gegeben ist.

## Projektbeschreibung

+ Roguelike-Spiel, Details in [docs/Grundlagen.md](docs/Grundlagen.md)
+ Charakter, Eigenschaften, Skills und EP in [docs/Charakter.md](docs/Charakter.md)
+ Weitere Dokumentation liegt in `docs/`.
+ CLAUDE.md verweist direkt auf jedes Dokument in `docs/`, nicht nur über Verweise in anderen Dokumenten.

## Repository und Umgebung

+ Öffentliches Repo: https://github.com/cdekant/Battle-Ninkasi, grundsätzlich auf Hauptbranch `main` arbeiten
+ Zeilenenden im Repo durchgängig LF, festgelegt in `.gitattributes`.
