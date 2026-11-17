# Battle Ninkasi - Texte und Textkorpus

Stand: 2026-11-17

Grobskizze, auszuarbeiten.

## Sprachdateien

+ Alle Texte im Spiel stehen in Sprachdateien, Code und Daten verweisen nur über Schlüssel darauf
+ Sprachen: Deutsch zuerst, Englisch vorgesehen
+ Fehlende Schlüssel werden beim Laden gemeldet (Prüfung wie bei den Daten, siehe [Architektur.md](Architektur.md))
+ Vorschlag, noch nicht bestätigt: Platzhalter und Grammatik im Text (Geschlecht, Mehrzahl, Fälle), damit z.B. "der Essigbakterie" und "dem Betriebskontrolleur" richtig gebildet werden

## Erzeugte Texte

Vorbild: Caves of Qud füllt Bücher aus einem Textkorpus.

+ Markow-Ketten: lernen aus einem Korpus, welches Wort auf welches folgt, und erzeugen neue Sätze im Stil der Vorlage; halb sinnvoll, halb wirr, passend für pseudo-sumerische Bücher oder den betrunkenen Mönch, der eine Brauanleitung abschreibt
+ Grammatiken und Vorlagen: Satzbausteine mit Platzhaltern, z.B. "Gesegnet sei [Gottheit], die [Zutat] in [Gefäß] verwandelte"; kontrolliert, mit eigenem Tonfall
+ Mischung: Vorlagen für den Rahmen, Markow für Füllstoff, echte Zitate als seltene Fundstücke
+ Ein Korpus pro Sprache, Markow-Ketten arbeiten nicht über Sprachgrenzen hinweg
+ Kein Sprachmodell zur Laufzeit (Kosten, Netz, nicht wiederholbar); während der Entwicklung darf ein Sprachmodell Vorlagen und Satzbausteine schreiben
+ Wiederholbarkeit: Jeder erzeugte Text bekommt einen abgeleiteten Startwert aus Lauf-Startwert und Objekt-ID

## Korpus

+ Nur gemeinfreie oder selbst erstellte Texte
+ Bei Übersetzungen zählt der Übersetzer: gemeinfrei erst 70 Jahre nach seinem Tod; Keilschrift-Originale sind gemeinfrei, viele moderne Übersetzungen nicht (z.B. ETCSL)
+ Herkunft und Rechtsgrundlage jedes Korpustextes werden festgehalten
+ Kandidaten, zu prüfen: Gilgamesch-Epos in alten Übersetzungen, Hymne an Ninkasi, mittelalterliche Brauanleitungen, Brauordnungen, Bibelstellen und antike Autoren zu Bier und Wein

## Offen

+ Liste der Korpustexte mit Quelle und Rechtsgrundlage
+ Wo erzeugte Texte vorkommen: Bücher, Schriftrollen, Inschriften, HACCP-Aushänge, Händlergerede
+ Format der Sprachdateien
