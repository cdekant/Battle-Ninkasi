# Battle Ninkasi - Texte und Textkorpus

Stand: 2026-11-25

Zuständig für: `sprache/*`, `src/anzeige/texte.js`, `src/anzeige/grammatik.js`, `src/anzeige/korpus.js`, `src/anzeige/glossar.js`, `daten/glossar.js`, `daten/bierstile.js`

Mitprüfen bei Änderungen: [Anzeige.md](Anzeige.md), [Architektur.md](Architektur.md), [Entwicklung.md](Entwicklung.md), [Fundus.md](Fundus.md), [Skills.md](Skills.md)

Grobskizze, auszuarbeiten.

## Sprachdateien

+ Alle Texte im Spiel stehen in Sprachdateien, Code und Daten verweisen nur über Schlüssel darauf
+ Sprachen: Deutsch und Englisch (`SPRACHEN` in `src/eingabe/einstellungskatalog.js`); jeder Text entsteht in beiden, das Englische frei nachgeschrieben statt Satz für Satz übersetzt; ein Schlüssel hat in beiden Sprachen dieselben Platzhalter
+ Anrede: Oberflächentexte sprechen die Spielerin mit "du" an (englisch "you"), erzählende Texte (Log, Beschreibungen) sprechen in der dritten Person über Ninkasi; ein Lauf heißt "Lauf" (englisch "run")
+ Format: `sprache/<code>/texte.js` mit `export default { schluessel: text }`; Texte enthalten Platzhalter wie `{menge}`; der Satzanfang wird groß geschrieben
+ Texte des Probeinhalts in `sprache/de/proben.js`, ohne englische Fassung; `src/inhalt.js` legt sie zu denen des Grundgerüsts, doppelte Schlüssel sind ein Fehler (siehe [Entwicklung.md](Entwicklung.md), Probeinhalt)
+ Rückfall: fehlt im Englischen ein Schlüssel, gilt der deutsche Text mit der deutschen Grammatik (`erstelleTexte(texte, grammatik, rueckfall)` in `src/anzeige/texte.js`); so erscheinen die Proben im Englischen deutsch, bis echter Inhalt sie ersetzt
+ Sprachwahl: Einstellung `sprache` (siehe [Bedienung.md](Bedienung.md), Einstellungen); `src/main.js` baut die Texte einmal beim Laden und setzt `lang` an `<html>`, ein Wechsel lädt die Seite neu; Log-Zeilen bleiben in der Sprache, in der sie entstanden sind
+ Tastennamen (`taste.<code>`) folgen der Tastatur der Sprache: deutsch die deutsche (KeyY heißt z, BracketRight +), englisch die US-Tastatur (y, `]`); Hilfetexte nennen Tasten, deren Aufschrift von der Tastatur abhängt, nicht mit ihrem Zeichen
+ Schadensarten stehen als einfache Wörter unter `schaden.<art>` (z.B. `schaden.saeure`: "Säure"); das Log setzt sie als `{art}` ein
+ Etiketten unbekannter Gegenstände (`datenproben/etiketten.js`, siehe Unbekanntes in [Gegenstaende.md](Gegenstaende.md)) sind Hauptwörter unter `etikett.<name>`; ein unbekannter Gegenstand nennt sein Etikett statt seines Namens (Bezug mit `etikett`)
+ Ein Satz, dessen Verb der Zahl folgt, hat eine zweite Fassung `<schluessel>.mehrzahl` ("Hier liegen 3 Biere"); `textNachZahl(schluessel, anzahl, werte)` wählt sie, wenn die Anzahl größer als 1 ist und es sie gibt
+ Prüfung: die Datenprüfung meldet Textschlüssel aus den Daten, die in der deutschen Sprachdatei fehlen, unvollständige Hauptwörter und Verweise auf Adjektive, die keine sind; `tests/sprachen.test.js` prüft beide Sprachen nach ihrer Grammatik, dieselben Platzhalter je Schlüssel, dieselben Schlüssel im Grundgerüst und dass kein Schlüssel in einer Sprachdatei doppelt steht (im Objekt gewönne still der letzte); fehlende Schlüssel aus dem Code erscheinen als `[schluessel]` und als Warnung in der Konsole

## Grammatik

Daten:

+ Regeln je Sprache in `sprache/<code>/grammatik.js` mit `verfahren`; den Code liefert `src/anzeige/grammatik.js`: `"faelle"` (Deutsch, Artikel und Endungen aus Tabellen) und `"englisch"` (a oder an, ohne Fälle)
+ Hauptwort deutsch: `{ geschlecht: "m" | "f" | "n", eigenname?, adjektive?, einzahl: { nom, gen, dat, akk }, mehrzahl: { nom, gen, dat, akk } }`, z.B. `{ geschlecht: "n", einzahl: { nom: "Bier", gen: "Biers", dat: "Bier", akk: "Bier" }, mehrzahl: { nom: "Biere", gen: "Biere", dat: "Bieren", akk: "Biere" } }`; unregelmäßige Formen stehen ausgeschrieben, Eigennamen brauchen keine Mehrzahl
+ Hauptwort englisch: `{ einzahl, mehrzahl, eigenname?, adjektive?, artikel?: "a" | "an" }`, z.B. `{ einzahl: "lantern", mehrzahl: "lanterns" }`
+ Adjektiv: `{ adjektiv, stamm? }` (deutsch, `stamm` für Endungen wie dunkel, dunkle), `{ adjektiv, artikel? }` (englisch), unter `adjektiv.<name>`
+ Deutsche Tabellen: `artikel` (`bestimmt` mit `m`, `f`, `n`, `p` für die Mehrzahl; `ein` ohne Mehrzahl), `deklination` (Artikelart zur Beugung: bestimmt schwach, ein gemischt, ohne und Zahl stark), `adjektivendungen` (schwach, gemischt, stark nach Geschlecht oder `p` und Fall)
+ Englische Regeln: `bestimmt` ("the"), `vokale`, `ausnahmenA` (Wortanfänge mit Vokal, die nach einem Mitlaut klingen: unicorn, European) und `ausnahmenAn` (hour, honest, heir)

Schnittstellen:

+ `erstelleGrammatik(regeln)` → `{ nomen(eintrag, fall, artikel, { anzahl, adjektive }), pruefen(eintrag, ort), adjektivPruefen(eintrag, ort), artikelarten }`
+ Platzhalter für Hauptwörter: `{ziel.akk}` mit bestimmtem Artikel (Standard: Nominativ, bestimmt), `{was.nom.ein}` mit unbestimmtem, `{was.akk.zahl}` ohne Artikel, aber mit der Zahl in der Mehrzahl, `{wer.gen.ohne}` ohne Artikel; das Englische übergeht den Fall außer dem Genitiv
+ `nomenForm(bezug, fall, artikel)` in `src/anzeige/texte.js`: die Anzahl aus `bezug.anzahl`, die Adjektive aus `bezug.adjektive` (Meldungen) oder den Zuständen einer Entität, dazu die festen des Hauptworts

Regeln:

+ Mehrzahl, wenn die Anzahl größer als 1 ist (in beiden Sprachen nach CLDR nur "eins" und "andere"); die Zahl steht als Ziffer: "die 3 Biere", "3 Biere", "the 3 beers", "3 beers"; beim unbestimmten Artikel steht in der Mehrzahl die Zahl
+ Eigennamen stehen ohne Artikel, ohne Mehrzahl und ohne Adjektive; ihr Geschlecht dient später den Fürwörtern
+ Adjektive stehen vor dem Hauptwort, zuerst die aus Zuständen (Affixe), dann die festen des Hauptworts: "ein gereiztes Essigbakterium", "einer leeren Flasche"; ein Zustand nennt sein Adjektiv mit `adjektiv` (siehe [Wirkungen.md](Wirkungen.md), Zustände); Adjektive kommen aus derselben Sprache wie ihr Hauptwort
+ Englisch: a oder an nach dem ersten gezeigten Wort, also dem ersten Adjektiv oder dem Hauptwort ("an empty bottle"); `artikel` am Eintrag geht vor, dann die Ausnahmen, dann der Anfangsbuchstabe; Genitiv mit "'s", in der Mehrzahl auf s nur mit "'"
+ Listen zeigen Stapel mit der Zahl in der Mehrzahl ("3 Biere"), ein einzelnes Stück eines Stapels in der Einzahl (Werfen, Schnellleiste, Überschrift im Inventar)

## Glossar

Daten:

+ `daten/glossar.js` im Grundgerüst: `{ <name>: { gebiet, text, quellen? } }`, z.B. `malz: { gebiet: "maelzen", text: "glossar.malz" }`; Gebiete bisher Rohstoffe, Mälzen, Sudhaus, Gärung, Keller, Verderb und Hygiene, Bierstile, Geschichte
+ `quellen` (freiwillig): Schlüssel aus `sprache/literatur.json`, auf die sich der Eintrag stützt; bisher bei den Bierstilen
+ In beiden Sprachdateien: `glossar.<name>` (der Begriff, ein einfacher Text), `glossar.<name>.erklaerung` (ein Satz, enzyklopädisch, ernsthaft und informativ) und `glossargebiet.<gebiet>`

Schnittstellen:

+ `glossarEintraege(glossar, texte)` in `src/anzeige/glossar.js`: `[{ name, gebiet, begriff, erklaerung }]` in einer Sprache, nach dem Begriff sortiert
+ `woerterbuch(glossar, { de: texte, en: texte })`: je Begriff die Texte aller Sprachen, sortiert nach der ersten; im Kompendium als Reiter Wörterbuch und als `node werkzeuge/kompendium.js woerterbuch [de|en]` (siehe [Entwicklung.md](Entwicklung.md), Kompendium)

Regeln:

+ Die Datenprüfung verlangt je Begriff `text`, `text.erklaerung` und den Text des Gebiets, `quellen` als Liste verschiedener Schlüssel, andere Felder sind ein Fehler; ob es die Quellen im Literaturverzeichnis gibt, prüfen das Kompendium (`lueckenFinden` mit `literatur`) und `tests/bierstile.test.js`; die Erklärungen zählen im Kompendium als genannt
+ Ein Begriff entsteht in beiden Sprachen zugleich, die Erklärung frei in jeder Sprache geschrieben; die englischen Begriffe sind die der Brauer (wort, grist, liquor), wo es keinen gibt, bleibt der deutsche (krausen)
+ Die Begriffe sind Inhalt und kommen von der Nutzerin bzw. dem Nutzer; die vorhandenen sind ein Startbestand, ein Skill zum Anlegen folgt mit Punkt 11 (siehe [Systemausbau.md](Systemausbau.md))
+ Das Glossar im Spiel kommt später (siehe [Ausblick.md](Ausblick.md), Bestiarium, Glossar, Rezeptbuch)

## Bierstile

Die allgemein anerkannten Bierstile mit ihren Kennzahlen, zusammengefasst aus den Richtlinien für Bierwettbewerbe; Ziele für die Rezepte des Brausystems (siehe [Systemausbau.md](Systemausbau.md), Punkt 10).

Daten:

+ `daten/bierstile.js` im Grundgerüst: `{ <name>: { familie, gaerung, stammwuerze, bittere, farbe, alkohol } }`, z.B. `pils: { familie: "lager_hell", gaerung: "untergaerig", stammwuerze: [110, 129], bittere: [25, 50], farbe: [5, 8], alkohol: [44, 53] }`
+ Kennzahlen als Spanne `[unten, oben]` in ganzen Zahlen: Stammwürze in Zehntel °Plato, Bittere in IBU, Farbe in EBC, Alkohol in Zehntel Vol.-%
+ `gaerung`: eine von `GAERUNGEN` in `src/kern/daten.js` (obergaerig, untergaerig, spontan, gemischt)
+ Familien: Helles Lager, Bernsteinfarbenes und dunkles Lager, Bock, Weizen, Deutsche obergärige Biere, Britische Ales, Porter und Stout, Amerikanische Ales, Belgische Ales, Sauer und wild, Historische Biere; Namen unter `bierfamilie.<familie>` in beiden Sprachdateien; weitere Familien (sumerisch, ägyptisch, mittelalterlich) kommen mit dem Brausystem
+ Begriff, Erklärung und Quellen jedes Stils stehen im Glossar unter demselben Namen im Gebiet `bierstile`; dort stehen auch die Oberbegriffe Ale, Lagerbier, Bockbier, Sauerbier und Kwass ohne Kennzahlen

Regeln:

+ 80 Stile, aufgenommen, wenn mindestens zwei der Richtlinien `bjcp2021styleguidelines`, `ba2025styleguidelines` und `ebs2025kategorien` sie beschreiben; Spielarten (amerikanische Abwandlungen, Frucht, Holz, Kräuter, Honig, Rauch auf einem Grundstil) fallen unter den Grundstil oder sind Zusätze im Brausystem
+ Jede Grenze ist der Median dieser Grenze in den Richtlinien, die einen Wert nennen; offene Grenzen ("40+ SRM", "< 29 EBC") zählen nur auf ihrer Seite; so liegt die Spanne zwischen Schnittmenge und Gesamtspanne, und eine einzelne weite Auslegung zieht sie nicht auf
+ Umrechnung: SRM mal 1,97 ergibt EBC, das spezifische Gewicht geht über die übliche Näherung in °Plato; Kellerbier nimmt die untere Grenze der Farbe vom Helles, weil nur der EBS eine obere nennt
+ `quellen` eines Stils nennen nur die Richtlinien, deren Zahlen eingeflossen sind; `ba2016worldbeercup` ist die ältere Ausgabe der Brewers Association und zählt nicht mit, sonst hätte sie beim Median zwei Stimmen
+ Die Texte sind eigene Zusammenfassungen ohne Wortlaut der Richtlinien (siehe Korpus)
+ `tests/bierstile.test.js` prüft Zahl, Glossar, Familien, plausible Grenzen der Kennzahlen und dass der Alkohol zur Stammwürze passt

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
+ Übersetzungen unter nicht kommerzieller Lizenz (CC BY-NC-SA, etwa das eBL-Korpus) gelten ebenso nur als Fachquelle, damit das Spiel verkäuflich bleibt; die Quelle wird trotzdem angegeben
+ Eine Nachdichtung geht vom Original aus (Umschrift oder Normalisierung), die moderne Übersetzung dient dem Verständnis; eigene Wortwahl, eigene Bilder und wo möglich eine eigene Lesart, damit sie keine Bearbeitung der Übersetzung ist; gemeinfreie alte Übersetzungen dürfen zum Abgleich dienen
+ Gilgamesch-Epos in der gemeinfreien Übersetzung `ungnad1911gilgamesch`, einzulesen mit [Systemausbau.md](Systemausbau.md), Punkt 18
+ eBL-Korpus (electronic Babylonian Library, LMU München, `https://www.ebl.lmu.de/corpus`): akkadische Literatur (L), Magie (Mag) und Divination (D) mit Normalisierung und englischer Übersetzung; lokal als Rohtext in `sprache/Literatur/ebl/` (`text/` je Kapitel eine Zeile mit Nummer, Akkadisch und Englisch, `json/` die Antworten der Schnittstelle `https://www.ebl.lmu.de/api/texts`, `treffer-<gruppe>.txt` Fundstellen je Suchbegriff); ein Werk bekommt seinen Eintrag im Literaturverzeichnis, sobald daraus nachgedichtet wird oder es als Kandidat feststeht
+ Gilgamesch-Epos ganz nachgedichtet aus der eBL-Fassung (`george2022gilgamesch`), eine Datei je Tafel (`gilgamesch-tafel-<nn>.md`, Tafel I bis XII); Lücken der jungbabylonischen Fassung sind aus den altbabylonischen Stücken ergänzt, reine Bruchstücke ausgelassen, wörtliche Wiederholungen der Vorlage stehen beim ersten Mal ganz und danach in Kurzform, weil sie Titelsprüche und Markow-Ketten gleichförmig machen; jede Abweichung von der Vorlage steht im Kopf unter `vorlage`
+ Aus Maqlû (`abusch2024maqlu`) sind 24 der stärksten Beschwörungen gegen Hexen ausgewählt, je eine Datei `maqlu-<nn>-<kurzname>.md` mit Tafel und Anfangsvers unter `vorlage`; lange, gleichförmige Anrufungen (etwa Tafel II, "Girra, vollkommener Herr", und Tafel IV, "Brenne, lodere") fehlen bewusst
+ Omen der Schenke (`omen-der-schenke.md`): eigene Omen über Bier, Schenke und Brauen im Bau von Šumma ālu (`mittermayer2021summaalu`), "Wenn …: …" mit der Lösung "Damit es nicht naht: …"; weitere Omen für Spielinhalte (Fundstücke, Vorzeichen auf einer Ebene) folgen demselben Bau
+ Namen, Berufe, Tiere, Pflanzen und Orte aus dem Korpus als Stoff für Inhalte: siehe [Fundus.md](Fundus.md); die Rohliste mit Fundstellen je Werk liegt in `sprache/Literatur/ebl/fundus.txt`
+ Kandidaten aus dem eBL-Korpus: keine offen; weitere Werke nach Bedarf aus `sprache/Literatur/ebl/`
+ Weitere Kandidaten, zu prüfen: weitere alte Übersetzungen des Gilgamesch-Epos, mittelalterliche Brauanleitungen, Brauordnungen, Bibelstellen und antike Autoren zu Bier und Wein

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
| `en/korpus/ninkasi-hymne.md` | Nachdichtung, aus der deutschen übertragen | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `en/korpus/ninkasi-hymne-b.md` | Nachdichtung, aus der deutschen übertragen | `etcsl4231ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `en/korpus/trinklied.md` | Nachdichtung, aus der deutschen übertragen | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `en/korpus/trinklied-b.md` | Nachdichtung, aus der deutschen übertragen | `sallaberger2020ninkasi` | eigener Text, CC BY-NC-SA 4.0; sumerisches Original gemeinfrei |
| `de/korpus/istar-unterwelt.md` | Nachdichtung aus der akkadischen Normalisierung, eigene Lesart an einzelnen Stellen | `setaelae2022istar` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/istar-unterwelt.md` | Nachdichtung, aus der deutschen übertragen | `setaelae2022istar` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-01.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel I | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-01.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-02.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel II, Lücken aus der altbabylonischen Pennsylvania-Tafel | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-02.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-03.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel III, zerstörte Stellen ausgelassen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-03.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-04.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel IV, zweiter Traum aus der altbabylonischen Schøyen-Tafel, Wiederholungen gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-04.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-05.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel V, Wiederholungen gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-05.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-06.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel VI | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-06.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-07.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel VII, Unterwelt in den Wendungen von `istar-unterwelt.md` | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-07.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-08.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel VIII, Gabenkatalog gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-08.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-09.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel IX, Doppelstunden gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-09.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-10.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel X, Šiduris Rat aus der altbabylonischen Tafel VA+BM, Wiederholungen gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-10.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-11.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel XI, Wiederholungen gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-11.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/gilgamesch-tafel-12.md` | Nachdichtung aus der akkadischen Normalisierung, jungbabylonische Tafel XII, Wiederholungen gekürzt | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/gilgamesch-tafel-12.md` | Nachdichtung, aus der deutschen übertragen | `george2022gilgamesch` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/palme-und-rebe.md` | Nachdichtung aus der akkadischen Normalisierung, Bruchstück ohne Anfang und Ende | `jimenez2021palmeundrebe` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/palme-und-rebe.md` | Nachdichtung, aus der deutschen übertragen | `jimenez2021palmeundrebe` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/maqlu-01-goetter-der-nacht.md` bis `maqlu-24-als-die-hexe-den-fluss-ueberquerte.md` | Nachdichtung aus der akkadischen Normalisierung, 24 ausgewählte Beschwörungen, je eine Datei | `abusch2024maqlu` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `en/korpus/maqlu-01-goetter-der-nacht.md` bis `maqlu-24-als-die-hexe-den-fluss-ueberquerte.md` | Nachdichtung, aus der deutschen übertragen | `abusch2024maqlu` | eigener Text, CC BY-NC-SA 4.0; akkadisches Original gemeinfrei |
| `de/korpus/omen-der-schenke.md` | eigen, im Bau der Omen aus Šumma ālu, zwei Omen nachgedichtet | `mittermayer2021summaalu` | eigener Text, CC BY-NC-SA 4.0; akkadisches Vorbild gemeinfrei |
| `en/korpus/omen-der-schenke.md` | eigen, aus der deutschen übertragen | `mittermayer2021summaalu` | eigener Text, CC BY-NC-SA 4.0; akkadisches Vorbild gemeinfrei |

+ Varianten desselben Originals tragen die Endung `-b`, `-c` usw.; sie folgen einer anderen Lesart oder anderen Bildern und erweitern so den Wortschatz der Markow-Ketten
+ Die englischen Korpustexte sind aus unseren deutschen Nachdichtungen übertragen, im selben altertümlichen Ton (thou, hath) und mit denselben Dateinamen; aus den modernen Übersetzungen der Fachquellen stammt kein Wortlaut
+ Weitere Fachquellen ohne eigene Nachdichtung: `sallaberger2012bierbrauen` (auf ZORA nicht gefunden, keine freie Lizenz bekannt, daher keine wörtlichen Zitate); für die Bierstile `bjcp2021styleguidelines`, `ba2025styleguidelines`, `ba2016worldbeercup` und `ebs2025kategorien` (keine freie Lizenz, Merkmale und Kennzahlen nur eigenständig zusammengefasst, siehe Bierstile)

## Offen

+ Korpustexte noch nicht an Spielinhalte gekoppelt (Brauschritte, Fundstücke); das Spiel liest die der gewählten Sprache zur Laufzeit (`sprache/<sprache>/korpus/index.js` als Liste der Dateien, `src/anzeige/korpus.js` zerlegt in Kopf, Strophen und Sätze) und zeigt einen Satz als Spruch im Titel; ein neuer Korpustext braucht seine Zeile in der Liste
+ Laden von `sprache/literatur.json` im Spiel (`fetch` oder `import … with { type: "json" }`); den Kopf der Korpustexte und ihre Quellenschlüssel prüft das Kompendium (siehe [Entwicklung.md](Entwicklung.md), Kompendium)
+ Abdeckung der Texte je Eintrag (welcher Gegner, welches Getränk hat Beschreibung, Fundtext, Zitat), sobald Korpus und Inhalte gekoppelt sind; als Reiter des Kompendiums
+ Wo erzeugte Texte vorkommen: Bücher, Schriftrollen, Inschriften, HACCP-Aushänge, Händlergerede
+ Platzhalter in Hilfetexten: ein Fenster gibt seiner Hilfe Werte mit (`hilfewerte`, z.B. `{punkte}` in `hilfe.thema.erstellung`), damit Zahlen aus den Regeln nicht fest im Text stehen
