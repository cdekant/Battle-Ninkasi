# Battle Ninkasi - Texte und Textkorpus

Stand: 2026-11-17

Grobskizze, auszuarbeiten.

## Sprachdateien

+ Alle Texte im Spiel stehen in Sprachdateien, Code und Daten verweisen nur über Schlüssel darauf
+ Sprachen: Deutsch zuerst, Englisch vorgesehen
+ Fehlende Schlüssel werden beim Laden gemeldet (Prüfung wie bei den Daten, siehe [Architektur.md](Architektur.md))
+ Format: `sprache/de/texte.js` mit `export default { schluessel: text }`; Texte enthalten Platzhalter wie `{menge}`; der Satzanfang wird groß geschrieben
+ Wesen und Gegenstände sind Hauptwörter: Geschlecht (`m`, `f`, `n`), bei Eigennamen `eigenname: true`, und alle vier Fälle der Einzahl ohne Artikel, z.B. `{ geschlecht: "n", einzahl: { nom: "Essigbakterium", gen: "Essigbakteriums", dat: "Essigbakterium", akk: "Essigbakterium" } }`; unregelmäßige Beugung (des Bären) steht so ausgeschrieben in den Fällen
+ Die Artikel kommen als Tabelle nach Art, Geschlecht und Fall aus `sprache/de/grammatik.js`; den Code dazu liefert `src/anzeige/grammatik.js`; Eigennamen stehen ohne Artikel, ihr Geschlecht dient später den Fürwörtern
+ Platzhalter für Hauptwörter: `{ziel.akk}` mit bestimmtem Artikel (Standard: Nominativ, bestimmt), `{was.nom.ein}` mit unbestimmtem, `{wer.gen.ohne}` ohne Artikel
+ Jede Sprache bekommt ihre eigene Regeltabelle; Sprachen mit Sonderregeln (englisch a/an) bekommen zusätzlich eigenen Code
+ Später: Mehrzahl (`mehrzahl` mit den vier Fällen, Artikel für `p`), Adjektivendungen für Affixe (ein verfluchtes Braupaddel)
+ Die Datenprüfung meldet Textschlüssel aus den Daten, die in der Sprachdatei fehlen, und unvollständige Hauptwörter (Geschlecht, Fälle); fehlende Schlüssel aus dem Code erscheinen als `[schluessel]` und als Warnung in der Konsole

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
+ Mehrzahl und Adjektive im Detail
