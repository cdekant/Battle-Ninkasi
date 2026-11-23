# Battle Ninkasi - Entwicklung

Stand: 2026-11-23

Zuständig für: `starten.py`, `starten.bat`, `tests/*`, `werkzeuge/bot.js`, `werkzeuge/messung.js`, `werkzeuge/arena.js`, `werkzeuge/kompendium.js`, `werkzeuge/kompendium.html`, `werkzeuge/luecken.js`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md), [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md), [Anzeige.md](Anzeige.md), [Texte.md](Texte.md)

## Zweck

Arbeitsweise am Code: Starten, Tests und Balancing, Bot und Werkzeuge, Kompendium, Ablauf einer Version, Stolpersteine und der Stand des Spielinhalts. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Starten

Schnittstellen:

+ Startskript `starten.py` (unter Windows per `starten.bat`): Webserver auf `127.0.0.1:8000` (belegt: freier Port) ohne Zwischenspeicher (`Cache-Control: no-store`), dazu Firefox als eigene Instanz (`-no-remote`) mit Entwicklungsprofil `.firefox-profil/` (in `.gitignore`, wird bei Bedarf angelegt, Einstellungen über `user.js`); `--mit-leisten` für die gewohnte Oberfläche; Firefox-Pfad notfalls über die Umgebungsvariable `FIREFOX`
+ Von Hand: `python -m http.server` im Hauptverzeichnis, dann `http://localhost:8000/`, Ende mit Strg+C; die Seite öffnet den Titel, `?seed=1234` beginnt gleich einen Lauf mit diesem Startwert auf dem ersten leeren Platz (siehe [Architektur.md](Architektur.md), Speichern)

Regeln:

+ Fenster ohne Tabs, Adressleiste und Titelleiste über `chrome/userChrome.css` im Profil (dazu `toolkit.legacyUserProfileCustomizations.stylesheets` und `browser.tabs.inTitlebar` = 1); mit `--mit-leisten` bleibt `userChrome.css` leer; `dom.allow_scripts_to_close_windows` erlaubt "Beenden" im Spielmenü
+ Endet Firefox, endet der Server; unter Windows mit `-wait-for-browser`, da `firefox.exe` sonst nur einen sofort endenden Startprozess ist; endet Firefox ohne Fehler binnen 5 Sekunden, läuft der Server bis Strg+C weiter
+ Fester Port, weil Einstellungen und Speicherplätze im `localStorage` je Ursprung (Host und Port) liegen
+ Module laden nicht über `file://`, deshalb immer über einen Webserver

## Tests und Balancing

Daten:

+ Unittests mit dem in Node eingebauten `node:test` und `node:assert`, ohne Abhängigkeiten; Dateien in `tests/`, benannt nach dem geprüften Modul mit Endung `.test.js` (z. B. `tests/wege.test.js`); welche Tests zu welchem System gehören, nennt jedes technische Dokument unter "Tests"
+ `tests/doku.test.js` prüft die Dokumentation: Markdown-Links auf vorhandene Dokumente, Verweise mit Abschnitt (im Code `docs/<Datei>.md, <Abschnitt>`, in Markdown "siehe" mit Link auf das Dokument, danach Komma und Abschnitt, für die Arbeitsliste auch `Punkt N`) auf vorhandene Überschriften, genau ein zuständiges Dokument je Datei in `src/`, `daten/`, `sprache/`, `grafik/`, `lib/`, `werkzeuge/`, `tests/` und je Startskript (`sprache/Literatur/` ausgenommen), jedes Dokument in CLAUDE.md, CLAUDE.md unter 12000 Zeichen, "Mitprüfen" in jedem Kopf und gegenseitig (die Arbeitsliste ausgenommen), in Design-Dokumenten (ohne "Zuständig für") je Abschnitt genau eine Zeile "Umsetzung:", deren Dokumente unter "Mitprüfen" stehen (ausgenommen Abschnitte wie Offen, Quellen, Vorbilder, Entscheidungen, Stand der Umsetzung); Text klein hinter einem Verweis (z.B. ein Pfad) gilt nicht als Abschnitt
+ `tests/hilfen.js` baut kleine Spiele aus Testkarten (ohne Dungeon-Erzeugung) mit Testeffekten, Schadensarten und Regelwerten (Grundverteidigung dort 0, damit Genauigkeit 100 ohne Ausweichen sicher trifft), samt Wesen, Spielerin und getragenen Gegenständen, macht auf Wunsch die ganze Karte sichtbar, lässt die Welt (Weltuhr, Zeitereignisse) bis zu einem Zeitpunkt laufen, schneidet Meldungen mit und meldet Haken nur für die Dauer eines Tests an; `rohdatenMitTesteintraegen` liefert die Spieldaten samt Testeinträgen (alle mit "test" im Namen)

Schnittstellen:

+ `node --test` im Hauptverzeichnis
+ Arena-Simulation seit 0.43.0 (siehe Bot und Werkzeuge); vorgesehen: Statistiken über erzeugte Dungeons je Startwert (Items, Getränke, Gegner pro Ebene, Weglängen), Ausgabe als Tabellen, Auswertung und Diagramme mit Python

Regeln:

+ Die Logik läuft in Node ohne Browser
+ Testpflicht gilt für die Spiellogik (`src/kern/`, `src/systeme/`, `src/ki/`, `src/welt/`): Jede Änderung dort bringt Tests mit oder begründet im Vorschlag, warum keine nötig sind
+ Anzeige und Eingabe (`src/anzeige/`, `src/eingabe/`) sind ausgenommen, soweit sie keine eigene Logik enthalten; reine Logik dort (z. B. Klickregeln, Grammatik, Fensterarten) wird ebenfalls getestet
+ Tests prüfen Regeln und Ergebnisse (Trefferchance, Schwellen, Wege, Gefahrenprüfung), nicht die innere Umsetzung; Zufall immer über festen Startwert
+ Tests der Datenprüfung bauen ihre Fehler in eigene Testeinträge, nicht in den Spielinhalt; Erwartungen an den Inhalt (z.B. wie viele Fallen eine Ebene hat) leiten sie aus den Daten ab; so lässt sich jeder Inhalt ändern oder löschen, ohne dass ein Test bricht
+ Vor jedem Commit laufen `node --test` und `node werkzeuge/bot.js` fehlerfrei

## Bot und Werkzeuge

Schnittstellen:

+ `node werkzeuge/bot.js [Läufe=20] [Befehle=3000] [erster Startwert=1]`: der dumme Bot spielt mit zufälligen Befehlen, auch über Reise, Laufen, Rasten, Erkunden, Treppen, Fähigkeiten, Werfen, Lernen, Untersuchen und die Klicks aller Fenster
+ `node werkzeuge/messung.js [Gegner] [Befehle] [Startwert] [Türen in Prozent] [Brandherde]`: Leistung bei vielen Gegnern (siehe [Architektur.md](Architektur.md), Leistung)
+ `node werkzeuge/arena.js <Arena | Kurzform> [Kämpfe=1000] [erster Startwert=1] [--taktik name] [--karte name] [--ninkasi variante] [--gegner variante] [--json datei]`: Arena-Simulation; ohne Argument nennt es Arenen und Taktiken; eine Arena aus `daten/arenen.js` läuft mit allen Paaren ihrer Varianten (eine Zeile je Paar), `--ninkasi` und `--gegner` beschränken; die Kurzform nach DCSS ("3 essigbakterium, fernkaempfer_test" ist eine Welle, "/" trennt Wellen) kämpft in `arena_offen` mit der Taktik `nahkampf`; Spielart und Aufstellung siehe [Architektur.md](Architektur.md), Spielarten
+ Exportiert für Tests und spätere Werkzeuge (Machtkurve): `kampfAusfuehren(daten, aufstellung, startwert, taktik?)`, `auswerten(kaempfe)`, `wilson(erfolge, anzahl)`, `quantil(werte, anteil)`, `kurzformLesen(daten, text)`, `variantenpaare(daten, name, wahl)`
+ `node werkzeuge/tiles-ableiten.js`: leitet die kleinen Tile-Sätze ab und schreibt `grafik/tileset.js` (siehe [Tileset.md](Tileset.md))

Regeln:

+ Der Bot prüft nach jedem Befehl Invarianten (u.a. kein Wesen mit Lebenswert 0, nichts Getragenes ohne Trägerin, keine verwaisten Zeitereignisse, keine liegengebliebenen Auslöser, räumlicher Index und Heap stimmen, Lernstand ganzzahlig und vollständig verteilt), spielt jeden Lauf aus Startwert und Befehlsliste nach und vergleicht die Zustände; jeden vierten Lauf speichert er mitten im Lauf, lädt ihn und verlangt nach den übrigen Befehlen denselben Zustand; jeder fünfte Lauf (Startwert % 5 = 3) spielt in der Testkammer (siehe [Architektur.md](Architektur.md), Spielarten) mit zufälligem Erzeugen und Tiefenwahl, auch in Tiefen, die es nicht gibt, und verlangt, dass Ninkasi nie stirbt und die Chronik nichts zählt
+ Jeder fünfte Lauf (Startwert % 5 = 4) spielt eine Arena aus `daten/arenen.js` der Reihe nach; jede zweite davon kämpft wie der automatische Kampf im Browser nach der Taktik (eingabe/arenakampf.js) mit gelegentlichen Zufallsbefehlen, die übrigen zufällig; nach dem Lauf zeichnet er das Endfenster und die Wahl der Arena mit allen Schaltern und verlangt nach einem Sieg, dass kein Feind mehr steht
+ Arena-Simulation: Ninkasi kämpft nach einer Taktik (`taktikbefehl`, siehe [Wesen.md](Wesen.md), KI); lehnt die Logik einen Befehl ab, wartet sie (Spalte "abgel."); nach `regeln.arena.grenzeBefehle` Befehlen gilt der Kampf als Patt; jeder Kampf folgt aus seinem Startwert und lässt sich wiederholen
+ Gemessen je Kampf aus den Meldungen: Ausgang (Sieg, Tod, Patt), geschaffte Wellen, Befehle, Zeit in Zeiteinheiten, eigene Züge, LP-Verlust (Anfang minus Ende), Schaden erlitten und ausgeteilt, geheilte LP, MP-Verbrauch, Getränke, Würfe, Fähigkeiten, Treffer (Schadensmeldungen Ninkasis) und Fehlschläge
+ Ausgabe je Zeile: Siegquote mit Wilson-Intervall 95 % (verlässlich auch nahe 0 und 100 %; bei 1000 Kämpfen etwa plus minus 3 Prozentpunkte), Tode, Patt, Zeit und LP-Verlust als Median, P10 und P90 über die Siege, Getränke, Würfe, Fähigkeiten und Ablehnungen im Mittel, Trefferquote; mit `--json` dazu alle Einzelkämpfe samt Startwert für Python
+ Die Taktik spielt einfach und gierig, die Siegquote gilt also für diese Taktik, nicht für eine gute Spielerin; jede Zeile nennt die Taktik (Vorbilder: [Bot für einen Roguelike](https://solodevstack.com/blog/balancing-a-roguelike-with-a-bot-that-plays-1000-games), [Spielstärke der Bots](https://steinmetz.union.edu/node/6383), [Wilson-Intervall](https://www.npmjs.org/package/wilson-score-rank))
+ Erfolg heißt die letzte Zeile `... 0 Fehler`; jeder Fehler nennt Startwert und Befehl, damit er sich mit demselben Aufruf nachstellen lässt
+ Die Zählungen am Ende (Fähigkeiten, lange Aktionen, Getränke und Würfe der Gegner, Würfe Ninkasis, Meldungen gezeigt, verborgen und gehört, Lernbefehle und Skillstufen, EP je Tiefe nach Herkunft, Erzeugen und Tiefenwahl in der Testkammer, Ausgänge und Wellen der Arenen) sind keine Prüfung, sondern ein grober Blick auf die Balance

## Kompendium

Werkzeug der Entwicklung: alle Inhalte aus `daten/` als Tabellen und was ihnen noch fehlt. Bestiarium, Lore, Bierrezepte und Bierwissen für die Spielerin gehören nicht hierher, sondern ins Spiel; sie nutzen dieselben Steckbriefe (siehe [Anzeige.md](Anzeige.md), Beschreibung).

Schnittstellen:

+ `werkzeuge/kompendium.html` über den lokalen Server (`http://localhost:8000/werkzeuge/kompendium.html`): ein Reiter für die Lücken, je Art aus `ARTEN` (Wesen, Gegenstände, Gelände, Fallen, Oberflächen, Gase, Zustände, Fähigkeiten, Effekte, Skills, Eigenschaften, Fraktionen, Schadensarten, Etiketten, Populationen, Ebenen, Arenen, Taktiken) einer und einer für den Korpus; Tabellen mit Bild (Tile aus dem Satz 32, sonst das Zeichen), Name aus der Sprachdatei, den Merkmalen des Steckbriefs und den Lücken des Eintrags; sortierbar über die Kopfzeile, filterbar über alle Spalten; der gewählte Reiter steht im Anker der Adresse; die Zahl am Reiter ist gelb, wenn ein Eintrag Lücken hat
+ `node werkzeuge/kompendium.js [Art]`: ohne Art alle Lücken nach Gruppe, Rückgabewert 1 bei einer Lücke der Stufe Fehler; mit Art die Steckbriefe als Liste; exportiert `quellenLaden()` und `lueckenText(luecken)`
+ `lueckenFinden({ rohdaten, sprache, tileset?, korpus?, literatur? })` in `werkzeuge/luecken.js`: reine Funktion, Lücken als `{ gruppe, stufe, ort, meldung }`; Browser und Node laden die Quellen selbst (Korpus und Literatur dort per `fetch`, hier aus den Dateien)

Regeln:

+ Gruppen: `daten` (jede Meldung der Datenprüfung, Stufe Fehler), `tiles` (Eintrag aus `daten/zeichen.js` ohne Tile in einem oder allen Sätzen, Tile ohne Eintrag), `verweise` (Wesen, Gegenstand, Effekt, Zustand, Fähigkeit, Falle, Oberfläche oder Gas, dessen Name sonst nirgends in den Daten steht, weder als Wert noch als Schlüssel; Vorlagen und vom Code verwendete Einträge in `VOM_CODE_VERWENDET` ausgenommen), `texte` (Textschlüssel mit dem Vorsatz eines Datenbereichs wie `wesen.`, den kein Eintrag nennt), `korpus` (Kopf unvollständig, `art` unbekannt, Quelle fehlt in `sprache/literatur.json`, Stufe Fehler)
+ Stufe Warnung für alles, was Testinhalte bis zum Abschluss von [Systemausbau.md](Systemausbau.md), Punkt 15 sein dürfen; der Spielinhalt hat keine Lücke der Stufe Fehler (geprüft von `tests/kompendium.test.js`)
+ Die Verweisprüfung ist eine Näherung: ein Name, der zufällig wie ein anderer Text in den Daten lautet, gilt als verwendet

## Ablauf einer Version

1. Plan mit Empfehlungen vorlegen, Freigabe abwarten
2. Umsetzen mit Tests; neue Dateien bekommen ein zuständiges Dokument
3. Doku nach den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md) nachführen, umgesetzte Punkte aus [Systemausbau.md](Systemausbau.md) streichen
4. Nummer in `src/version.js` erhöhen (Schema siehe [Architektur.md](Architektur.md), Versionen)
5. `node --test` und `node werkzeuge/bot.js` fehlerfrei
6. Commit (`Version X.Y.Z: Thema`), annotierter Tag `vX.Y.Z`, Push, alles erst auf ausdrücklichen Zuruf; reine Doku-Commits heißen `Doku: Thema` und bekommen keine Version

## Stolpersteine

+ `gesteuerteEntitaet` oder `spielerin`: wer handelt, was sie sieht und bei sich hat, fragt `gesteuerteEntitaet`; wer lernt, weiß, stirbt und die Bilanz des Laufs fragt `spielerin` (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); `tests/gesteuert.test.js` nennt die Dateien, die nur die gesteuerte Entität fragen dürfen
+ Komponenten ohne Zahl (`plaetze`, `tueren`, `sicht`, `angriffe`, `bewegung`, `aussehen`) nie direkt an der Entität lesen, sondern über ihre Lesefunktion (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); `tests/komponenten.test.js` meldet direkte Zugriffe, gewollte Ausnahmen (Datenprüfung, Steckbriefe, Gegenstände, Regelwerte, Vorlagen) stehen dort in einer Liste
+ Wissen aus früheren Läufen nie in der Logik aus der Chronik holen, sondern beim Start als Startoption `optionen.vorwissen` übergeben, sonst schlägt `tests/ablage.test.js` fehl (siehe [Architektur.md](Architektur.md), Speichern)
+ Python unter Windows: `Path.write_text` schreibt CRLF; immer `newline="\n"` angeben (Repo durchgängig LF, `.gitattributes`)
+ Python-Skripte mit Umlauten als Datei ausführen, nie über die Shell-Eingabe (stdin), sonst werden die Umlaute verfälscht
+ Der erste Schritt einer langen Aktion läuft sofort; `schritte: N` lässt dem Ziel N-1 Züge (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen)
+ Tests mit Fehlern in den Daten nutzen `rohdatenMitTesteintraegen`, nie den Spielinhalt
+ Tasten: die Belegung nennt physische Tasten (`KeyboardEvent.code`), Buchstaben in Fenstern und Zeichen ohne feste Lage gelten nach `KeyboardEvent.key`; wer das verwechselt, vertauscht auf der deutschen Tastatur Y und Z (siehe [Bedienung.md](Bedienung.md), Eingabe)
+ Logik ohne `Math.random()`, Uhrzeit und Winkelfunktionen (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), Kampfrechnung ohne `Math.exp` und `Math.pow` (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Neue Würfe im Spiel nie mit `spiel.zustand.zufallszustand`, sondern über `src/kern/wurf.js` mit einem Namen, sonst schlägt `tests/wurf.test.js` fehl (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit)
+ Die Kartengeneratoren von rot.js brechen ohne `timeLimit: Infinity` nach Uhrzeit ab (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit)

## Stand des Spielinhalts

Der Inhalt ist vorläufig und dient dem Ausprobieren der Systeme; alle Zahlen stehen in `daten/`. Geschichte: begonnen als 0.0.0; 0.1.0 Maus und Reise, 0.2.0 Tiles im Spiel, 0.3.0 Pegel in Promille, Psi-Punkte und Stoffwechsel, 0.4.0 Tod als Zustandsprüfung, danach der Systemausbau nach [Systemausbau.md](Systemausbau.md).

+ Ebenen: Hub (Tiefe 0) als feste Karte, im allmächtigen Lauf an seiner Stelle die Testkammer (21x11 Felder, leer), drei Kellertiefen zu 120x40 Feldern mit 16 bis 20 Wesen aus der Population (Essigbakterien in Rudeln, Fernkämpfer-Tests), 10 Bieren, einem Bierfass, 3 Brandflaschen, 3 Gärbottichen, je 6 Säuredüsen und Klappergeschirren, je einem Stück Ausrüstung (zwei Kupferringe), Türen an der Hälfte der Raumzugänge, Treppen hinauf und hinab (siehe [Welt.md](Welt.md), Ebenen)
+ Ninkasi: 100 LP, 100 MP, 0 von 100 PP, Pegel 0 (nach oben offen), Sichtweite 8, Faust 1W6+2 stumpf mit Genauigkeit 80 (80 % gegen ein Wesen ohne Ausweichen), die vorläufige `testfaehigkeit`
+ Stoffwechsel je Welttick (`daten/ninkasi.js`): LP 0,3 nüchtern, 0,8 bei 1,5 ‰, darüber abnehmend; MP 0,8 nüchtern, 0 ab 3 ‰; PP Schwund 0,3 nüchtern, Stillstand von 0,5 bis 1,5 ‰, dann steigend bis 1,0 bei 4 ‰; danach Abbau des Pegels um 0,01 ‰; Schwellen 0,5, 1, 2 und 3 ‰ werden angezeigt und gemeldet, haben aber noch keine Wirkung; die Leiste zeigt zusätzlich das Optimum der LP
+ Essigbakterium: 15 LP, Biss 1W4 mit Genauigkeit 70, 10 gebundene EP, Verhaltensmodul `jagen`
+ Fernkämpfer-Test (ab 0.15.0, Zeichen F, noch ohne Tile): Testgegner für die KI mit Fähigkeiten, 10 LP, hält 3 Felder Abstand, Säurespucke (Geschoss über Verbündete, Abklingzeit 3) und angekündigter Säureschwall (Kreis mit Radius 1 auf das Feld beim Beginn, 3 Schritte, durch Schaden unterbrechbar, 30 %); trägt ein Bier und trinkt es ab 0.42.0 unter 80 % LP mit 50 % Chance (Handlung `nutzen`, siehe [Wesen.md](Wesen.md), KI)
+ Arenen (ab 0.43.0, `daten/arenen.js`): Essigbakterien (drei, mit Varianten Ninkasi nackt, gerüstet, geübt und Gegner drei oder fünf), Fernkämpfer in zwei Wellen (mit zwei Bier), Rudel im Engpass (sechs Essigbakterien vor dem Gang), Reihe aus dem Keller (sechs Rudel aus Tiefe 1, mit Bier und Brandflaschen, Taktik `fernkampf`), alle Gegner des Kellers; Taktiken `nahkampf` und `fernkampf` (`daten/taktiken.js`); erster Befund mit 200 Kämpfen: drei Essigbakterien besiegt Ninkasi immer, fünf zu etwa 60 %, Ausrüstung und Skills ändern daran wenig; acht Essigbakterien und drei Fernkämpfer nie
+ Bier: +20 LP, Pegel +0,5 ‰, wird zur leeren Flasche; Getränke, Ausrüstung und Verderben siehe [Gegenstaende.md](Gegenstaende.md)
+ Alle Aktionen kosten bisher 100 (`daten/aktionen.js`), abweichend nur Angriffsprofile der Waffen
+ Auslöser sind im System vorhanden, im Spielinhalt aber noch nicht benutzt
+ Noch nicht enthalten: ganzzahlige Skalierung mit Rand, Umschauen, Markierungen für Gegner außerhalb des Ausschnitts, Prüfsumme der Daten, Englisch

## Verweise

+ Gesamte Arbeitsliste: [Systemausbau.md](Systemausbau.md); Lizenzen neuer Bibliotheken und Inhalte: `LIZENZEN.md`

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
