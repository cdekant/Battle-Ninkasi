# Battle Ninkasi - Texte und Textkorpus

Stand: 2026-11-23

Zuständig für: `sprache/*`, `src/anzeige/texte.js`, `src/anzeige/grammatik.js`, `src/anzeige/korpus.js`

Mitprüfen bei Änderungen: [Anzeige.md](Anzeige.md), [Architektur.md](Architektur.md), [Entwicklung.md](Entwicklung.md)

Grobskizze, auszuarbeiten.

## Sprachdateien

+ Alle Texte im Spiel stehen in Sprachdateien, Code und Daten verweisen nur über Schlüssel darauf
+ Sprachen: Deutsch und Englisch; jeder Text entsteht in beiden, das Englische frei nachgeschrieben statt Satz für Satz übersetzt (Englisch noch offen, siehe [Systemausbau.md](Systemausbau.md), Punkt 9)
+ Anrede: Oberflächentexte sprechen die Spielerin mit "du" an, erzählende Texte (Log, Beschreibungen) sprechen in der dritten Person über Ninkasi; ein Lauf heißt "Lauf"
+ Fehlende Schlüssel werden beim Laden gemeldet (Prüfung wie bei den Daten, siehe Inhalte als Daten in [Architektur.md](Architektur.md))
+ Format: `sprache/de/texte.js` mit `export default { schluessel: text }`; Texte enthalten Platzhalter wie `{menge}`; der Satzanfang wird groß geschrieben
+ Wesen und Gegenstände sind Hauptwörter: Geschlecht (`m`, `f`, `n`), bei Eigennamen `eigenname: true`, und alle vier Fälle der Einzahl ohne Artikel, z.B. `{ geschlecht: "n", einzahl: { nom: "Essigbakterium", gen: "Essigbakteriums", dat: "Essigbakterium", akk: "Essigbakterium" } }`; unregelmäßige Beugung (des Bären) steht so ausgeschrieben in den Fällen
+ Die Artikel kommen als Tabelle nach Art, Geschlecht und Fall aus `sprache/de/grammatik.js`; den Code dazu liefert `src/anzeige/grammatik.js`; Eigennamen stehen ohne Artikel, ihr Geschlecht dient später den Fürwörtern
+ Platzhalter für Hauptwörter: `{ziel.akk}` mit bestimmtem Artikel (Standard: Nominativ, bestimmt), `{was.nom.ein}` mit unbestimmtem, `{wer.gen.ohne}` ohne Artikel
+ Etiketten unbekannter Gegenstände (`daten/etiketten.js`, siehe Unbekanntes in [Gegenstaende.md](Gegenstaende.md)) sind Hauptwörter unter `etikett.<name>`; ein unbekannter Gegenstand nennt sein Etikett statt seines Namens (Bezug mit `etikett`); solange es keine Adjektivendungen gibt, sind Namen und Etiketten Hauptwörter ohne Adjektiv (Sauerbier, Bügelflasche)
+ Schadensarten stehen als einfache Wörter unter `schaden.<art>` (z.B. `schaden.saeure`: "Säure"); das Log setzt sie als `{art}` ein
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
+ Geschützte moderne Übersetzungen dienen nur als Fachquelle: Wir dichten aus dem gemeinfreien Original eigenständig nach und übernehmen keinen Wortlaut; das Zitatrecht deckt Zitate als Spielausstattung nicht
+ Kandidaten, zu prüfen: Gilgamesch-Epos in alten Übersetzungen, mittelalterliche Brauanleitungen, Brauordnungen, Bibelstellen und antike Autoren zu Bier und Wein

### Ablage und Format

+ Korpustexte: `sprache/<sprache>/korpus/<name>.md`, eine Datei pro Text, Zeile = Vers, Leerzeile = Strophe, Sprecherrollen als `(Hausherr:)` am Zeilenanfang
+ YAML-Kopf im Pandoc-Stil mit `titel`, `art` (`nachdichtung`, `gemeinfrei`, `eigen`), `vorlage` (gemeinfreies Original), `quelle` (Schlüssel im Literaturverzeichnis), `lizenz`
+ Literaturverzeichnis: `sprache/literatur.json` im Format CSL-JSON, für alle Sprachen gemeinsam; liest das Spiel direkt, Pandoc mit `--citeproc --bibliography`, für biber per `pandoc sprache/literatur.json -t biblatex` umwandeln
+ Schlüssel (`id`) nach dem Schema `autorJahrKurztitel`: klein, ohne Umlaute und Leerzeichen, z.B. `sallaberger2020ninkasi`; ein "siehe auch" im Spiel verweist nur über diesen Schlüssel, die Anzeige liefert die Sprachdatei
+ Originale und Rohtexte liegen in `sprache/Literatur/` (in `.gitignore`, nicht im Repo), benannt nach dem Schlüssel: `<schluessel>.pdf`, `<schluessel>-rohtext.txt`
+ Hinweise zur Nutzung einer Quelle (etwa "nur Fachquelle") stehen im CSL-Feld `note`

### Korpustexte

| Datei | Art | Quelle | Rechtsgrundlage |
|---|---|---|---|
| `de/korpus/ninkasi-hymne.md` | Nachdichtung | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `de/korpus/trinklied.md` | Nachdichtung | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `de/korpus/ninkasi-hymne-b.md` | Nachdichtung, andere Lesart | `etcsl4231ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `de/korpus/trinklied-b.md` | Nachdichtung, freiere Bilder | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |

+ Varianten desselben Originals tragen die Endung `-b`, `-c` usw.; sie folgen einer anderen Lesart oder anderen Bildern und erweitern so den Wortschatz der Markow-Ketten
+ Weitere Fachquellen ohne eigene Nachdichtung: `sallaberger2012bierbrauen` (auf ZORA nicht gefunden, keine freie Lizenz bekannt, daher keine wörtlichen Zitate)

## Offen

+ Korpustexte noch nicht an Spielinhalte gekoppelt (Brauschritte, Fundstücke); das Spiel liest sie zur Laufzeit (`sprache/de/korpus/index.js` als Liste der Dateien, `src/anzeige/korpus.js` zerlegt in Kopf, Strophen und Sätze) und zeigt einen Satz als Spruch im Titel; ein neuer Korpustext braucht seine Zeile in der Liste
+ Laden von `sprache/literatur.json` im Spiel (`fetch` oder `import … with { type: "json" }`); den Kopf der Korpustexte und ihre Quellenschlüssel prüft das Kompendium (siehe [Entwicklung.md](Entwicklung.md), Kompendium)
+ Abdeckung der Texte je Eintrag (welcher Gegner, welches Getränk hat Beschreibung, Fundtext, Zitat), sobald Korpus und Inhalte gekoppelt sind; als Reiter des Kompendiums
+ Wo erzeugte Texte vorkommen: Bücher, Schriftrollen, Inschriften, HACCP-Aushänge, Händlergerede
+ Mehrzahl und Adjektive im Detail
+ Vorhandene Texte an die Regel der Anrede angleichen (die Hilfe zur Charaktererstellung sagt noch "Run")
+ Platzhalter in Hilfetexten: ein Fenster gibt seiner Hilfe Werte mit (`hilfewerte`, z.B. `{punkte}` in `hilfe.thema.erstellung`), damit Zahlen aus den Regeln nicht fest im Text stehen
