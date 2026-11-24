# Battle Ninkasi - Entwicklung

Stand: 2026-11-24

Zuständig für: `starten.py`, `starten.bat`, `tests/*`, `werkzeuge/bot.js`, `werkzeuge/messung.js`, `werkzeuge/arena.js`, `werkzeuge/kompendium.js`, `werkzeuge/kompendium.html`, `werkzeuge/luecken.js`, `werkzeuge/namensbuch.js`, `datenproben/*`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md), [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md), [Anzeige.md](Anzeige.md), [Texte.md](Texte.md), [Dokumentation.md](Dokumentation.md)

## Zweck

Arbeitsweise am Code: Starten, Tests und Balancing, Bot und Werkzeuge, Kompendium, Messwerte, Ablauf einer Version, Stolpersteine, Grundgerüst und Probeinhalt. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

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
+ `tests/doku.test.js` prüft die Dokumentation: Markdown-Links auf vorhandene Dokumente, Verweise mit Abschnitt (im Code `docs/<Datei>.md, <Abschnitt>`, in Markdown "siehe" mit Link auf das Dokument, danach Komma und Abschnitt, für die Arbeitsliste auch `Punkt N`) auf vorhandene Überschriften, genau ein zuständiges Dokument je Datei in `src/`, `daten/`, `datenproben/`, `sprache/`, `grafik/`, `lib/`, `werkzeuge/`, `tests/`, je Startskript und für CLAUDE.md (`sprache/Literatur/` ausgenommen), jedes Dokument in CLAUDE.md, CLAUDE.md unter 12000 Zeichen, "Mitprüfen" in jedem Kopf und gegenseitig (die Arbeitsliste ausgenommen), in Design-Dokumenten (ohne "Zuständig für") je Abschnitt genau eine Zeile "Umsetzung:", deren Dokumente unter "Mitprüfen" stehen (ausgenommen Abschnitte wie Offen, Quellen, Vorbilder, Entscheidungen, Stand der Umsetzung); Text klein hinter einem Verweis (z.B. ein Pfad) gilt nicht als Abschnitt
+ `tests/probedurchstich.test.js`: typische Inhalte nur aus Daten (Teilung mit Obergrenze der Art und der Linie, Teilung beim Treffer, Myzel mit Sporen, Zerfall, Bossphase, Zauber über die Zeit, Psi, Ersatzwirkung, gewährte und gelehrte Fähigkeit, Heiler, Krankheit in Stufen, Kontrolleur mit Licht), die Daten stehen in der Datei, nicht in `datenproben/`; was Code verlangt, ist ein Test mit `todo` und dem Punkt der Arbeitsliste (siehe [Systemausbau.md](Systemausbau.md), Reihenfolge); ein `todo`-Test läuft mit, macht `node --test` aber nicht rot
+ `tests/hilfen.js` baut kleine Spiele aus Testkarten (ohne Dungeon-Erzeugung) mit Testeffekten, Schadensarten und Regelwerten (Grundverteidigung dort 0, damit Genauigkeit 100 ohne Ausweichen sicher trifft), samt Wesen, Spielerin und getragenen Gegenständen, macht auf Wunsch die ganze Karte sichtbar, lässt die Welt (Weltuhr, Zeitereignisse) bis zu einem Zeitpunkt laufen, schneidet Meldungen mit und meldet Haken nur für die Dauer eines Tests an; `rohdatenMitTesteintraegen` liefert die Spieldaten samt Testeinträgen (alle mit "test" im Namen)

Schnittstellen:

+ `node --test` im Hauptverzeichnis
+ Arena-Simulation (siehe Bot und Werkzeuge); vorgesehen: Statistiken über erzeugte Dungeons je Startwert (Items, Getränke, Gegner pro Ebene, Weglängen), Ausgabe als Tabellen, Auswertung und Diagramme mit Python

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
+ `node werkzeuge/messung.js [Gegner] [Befehle] [Startwert] [Türen in Prozent] [Brandherde] [Licht]`: Leistung bei vielen Gegnern, mit Licht 1 finster wie der dunkle Keller und mit einer Lampe an jedem Fernkämpfer (Türen `NaN` für die Vorgabe) (siehe [Architektur.md](Architektur.md), Leistung)
+ `node werkzeuge/arena.js <Arena | Kurzform> [Kämpfe=1000] [erster Startwert=1] [--taktik name] [--karte name] [--ninkasi variante] [--gegner variante] [--json datei]`: Arena-Simulation; ohne Argument nennt es Arenen und Taktiken; eine Arena aus `datenproben/arenen.js` läuft mit allen Paaren ihrer Varianten (eine Zeile je Paar), `--ninkasi` und `--gegner` beschränken; die Kurzform nach DCSS ("3 essigbakterium, fernkaempfer_test" ist eine Welle, "/" trennt Wellen) kämpft in `arena_offen` mit der Taktik `nahkampf`; Spielart und Aufstellung siehe [Architektur.md](Architektur.md), Spielarten
+ Exportiert für Tests und spätere Werkzeuge (Machtkurve): `kampfAusfuehren(daten, aufstellung, startwert, taktik?)`, `auswerten(kaempfe)`, `wilson(erfolge, anzahl)`, `quantil(werte, anteil)`, `kurzformLesen(daten, text)`, `variantenpaare(daten, name, wahl)`
+ `node werkzeuge/namensbuch.js`: führt `daten/namensbuch.js` nach, neue Namen kommen nach `vorlaeufig`, vorläufige, die es nicht mehr gibt, fallen weg, feste bleiben immer stehen; danach nennt es die übrigen Fehler (Rückgabewert 1); exportiert `NAMENSBUCH_ARTEN`, `namenDerDaten`, `namensbuchFehler`, `namensbuchNachgefuehrt`, `namensbuchText` für `tests/namensbuch.test.js` (Regel siehe [Architektur.md](Architektur.md), Inhalte als Daten)
+ `node werkzeuge/tiles-ableiten.js`: leitet die kleinen Tile-Sätze ab und schreibt `grafik/tileset.js` (siehe [Tileset.md](Tileset.md))

Regeln:

+ Der Bot prüft nach jedem Befehl Invarianten (u.a. kein Wesen mit Lebenswert 0, nichts Getragenes ohne Trägerin, keine verwaisten Zeitereignisse, keine liegengebliebenen Auslöser, räumlicher Index und Heap stimmen, Lernstand ganzzahlig und vollständig verteilt), spielt jeden Lauf aus Startwert und Befehlsliste nach und vergleicht die Zustände; jeden vierten Lauf speichert er mitten im Lauf, lädt ihn und verlangt nach den übrigen Befehlen denselben Zustand; jeder fünfte Lauf (Startwert % 5 = 3) spielt in der Testkammer (siehe [Architektur.md](Architektur.md), Spielarten) mit zufälligem Erzeugen und Tiefenwahl, auch in Tiefen, die es nicht gibt, und verlangt, dass Ninkasi nie stirbt und die Chronik nichts zählt
+ Jeder fünfte Lauf (Startwert % 5 = 4) spielt eine Arena aus `datenproben/arenen.js` der Reihe nach; jede zweite davon kämpft wie der automatische Kampf im Browser nach der Taktik (eingabe/arenakampf.js) mit gelegentlichen Zufallsbefehlen, die übrigen zufällig; nach dem Lauf zeichnet er das Endfenster und die Wahl der Arena mit allen Schaltern und verlangt nach einem Sieg, dass kein Feind mehr steht
+ Arena-Simulation: Ninkasi kämpft nach einer Taktik (`taktikbefehl`, siehe [Wesen.md](Wesen.md), KI); lehnt die Logik einen Befehl ab, wartet sie (Spalte "abgel."); nach `regeln.arena.grenzeBefehle` Befehlen gilt der Kampf als Patt; jeder Kampf folgt aus seinem Startwert und lässt sich wiederholen
+ Gemessen je Kampf aus den Meldungen: Ausgang (Sieg, Tod, Patt), geschaffte Wellen, Befehle, Zeit in Zeiteinheiten, eigene Züge, LP-Verlust (Anfang minus Ende), Schaden erlitten und ausgeteilt, geheilte LP, MP-Verbrauch, Getränke, Würfe, Fähigkeiten, Treffer (Schadensmeldungen Ninkasis) und Fehlschläge
+ Ausgabe je Zeile: Siegquote mit Wilson-Intervall 95 % (verlässlich auch nahe 0 und 100 %; bei 1000 Kämpfen etwa plus minus 3 Prozentpunkte), Tode, Patt, Zeit und LP-Verlust als Median, P10 und P90 über die Siege, Getränke, Würfe, Fähigkeiten und Ablehnungen im Mittel, Trefferquote; mit `--json` dazu alle Einzelkämpfe samt Startwert für Python
+ Die Taktik spielt einfach und gierig, die Siegquote gilt also für diese Taktik, nicht für eine gute Spielerin; jede Zeile nennt die Taktik (Vorbilder: [Bot für einen Roguelike](https://solodevstack.com/blog/balancing-a-roguelike-with-a-bot-that-plays-1000-games), [Spielstärke der Bots](https://steinmetz.union.edu/node/6383), [Wilson-Intervall](https://www.npmjs.org/package/wilson-score-rank))
+ Erfolg heißt die letzte Zeile `... 0 Fehler`; jeder Fehler nennt Startwert und Befehl, damit er sich mit demselben Aufruf nachstellen lässt
+ Die Zählungen am Ende (Fähigkeiten, lange Aktionen, Getränke und Würfe der Gegner, Würfe Ninkasis, Meldungen gezeigt, verborgen und gehört, Lernbefehle und Skillstufen, EP je Tiefe nach Herkunft, Erzeugen und Tiefenwahl in der Testkammer, Ausgänge und Wellen der Arenen) sind keine Prüfung, sondern ein grober Blick auf die Balance

## Kompendium

Werkzeug der Entwicklung: alle geladenen Inhalte (Grundgerüst und Probeinhalt, siehe `src/inhalt.js`) als Tabellen mit ihrer Herkunft und was ihnen noch fehlt. Bestiarium, Lore, Bierrezepte und Bierwissen für die Spielerin gehören nicht hierher, sondern ins Spiel; sie nutzen dieselben Steckbriefe (siehe [Anzeige.md](Anzeige.md), Beschreibung).

Schnittstellen:

+ `werkzeuge/kompendium.html` über den lokalen Server (`http://localhost:8000/werkzeuge/kompendium.html`): ein Reiter für die Lücken, je Art aus `ARTEN` (Wesen, Gegenstände, Gelände, Fallen, Oberflächen, Gase, Zustände, Fähigkeiten, Effekte, Skills, Eigenschaften, Fraktionen, Schadensarten, Etiketten, Populationen, Ebenen, Arenen, Taktiken) einer, einer für den Korpus und einer für das Wörterbuch aus dem Glossar (Deutsch, Englisch, Gebiet, beide Erklärungen; sortiert nach Deutsch oder Englisch ergibt sich de-en oder en-de); Tabellen mit Bild (Tile aus dem Satz 32, sonst das Zeichen), Name aus der Sprachdatei, den Merkmalen des Steckbriefs und den Lücken des Eintrags; sortierbar über die Kopfzeile, filterbar über alle Spalten; der gewählte Reiter steht im Anker der Adresse; die Zahl am Reiter ist gelb, wenn ein Eintrag Lücken hat
+ `node werkzeuge/kompendium.js [Art]`: ohne Art alle Lücken nach Gruppe, Rückgabewert 1 bei einer Lücke der Stufe Fehler; mit Art die Steckbriefe als Liste; mit `woerterbuch [de|en]` das Wörterbuch nach der Sprache sortiert (`woerterbuchText`); exportiert `quellenLaden()` und `lueckenText(luecken)`
+ `lueckenFinden({ rohdaten, sprache, tileset?, korpus?, literatur?, probenamen?, probentexte?, uebersetzungen? })` in `werkzeuge/luecken.js`: reine Funktion, Lücken als `{ gruppe, stufe, ort, meldung }`; Browser und Node laden die Quellen selbst (Korpus und Literatur dort per `fetch`, hier aus den Dateien), Namen und Texte des Probeinhalts kommen aus `src/inhalt.js`; `TILES_AUSSTEHEND` nennt Tiles des Grundgerüsts, die noch gezeichnet werden

Regeln:

+ Gruppen: `daten` (jede Meldung der Datenprüfung, Stufe Fehler), `tiles` (Eintrag aus `daten/zeichen.js` ohne Tile in einem oder allen Sätzen, Tile ohne Eintrag), `verweise` (Wesen, Gegenstand, Effekt, Zustand, Fähigkeit, Falle, Oberfläche oder Gas, dessen Name sonst nirgends in den Daten steht, weder als Wert noch als Schlüssel; Vorlagen und vom Code verwendete Einträge in `VOM_CODE_VERWENDET` ausgenommen), `texte` (Textschlüssel mit dem Vorsatz eines Datenbereichs wie `wesen.`, den kein Eintrag nennt; feste Adjektive eines genannten Hauptworts zählen als genannt; dazu jeder Schlüssel der deutschen Texte, der in einer Sprache aus `uebersetzungen` fehlt, als "fehlt in en"), `korpus` (über die Korpustexte aller Sprachen, benannt als `<sprache>/<datei>`: Kopf unvollständig, `art` unbekannt, Quelle fehlt in `sprache/literatur.json`, Stufe Fehler)
+ Stufen: Fehler für jede Meldung der Datenprüfung und des Korpus und für Tiles, Verweise und Texte des echten Inhalts; Warnung für den Probeinhalt, für Tiles in `TILES_AUSSTEHEND` und für alles, wenn die Quellen keine Namen des Probeinhalts nennen (Tests mit eigenen Daten); der geladene Inhalt hat keine Lücke der Stufe Fehler (geprüft von `tests/kompendium.test.js`); die Tabellen haben eine Spalte Herkunft (Probe oder echt)
+ Die Verweisprüfung ist eine Näherung: ein Name, der zufällig wie ein anderer Text in den Daten lautet, gilt als verwendet

## Messwerte

Gemessene Zahlen an einer Stelle, je mit Stand; neue Messungen ersetzen alte.

+ Leistung (Ziel siehe [Architektur.md](Architektur.md), Leistung), gemessen mit `werkzeuge/messung.js`: Stand 0.17.0 113 Wesen 0,4 ms, 341 Wesen 1,0 ms, 1173 Wesen 7 ms je Befehl; Stand 0.18.0 mit Türen an der Hälfte der Raumzugänge 356 Wesen etwa 1,7 bis 2,1 ms, 1176 Wesen etwa 12 bis 13 ms (Bakterien öffnen keine Türen und drängen sich in ihren Räumen, jede Suche im Umkreis findet so mehr Nachbarn); Stand 0.19.0 339 Wesen etwa 1,6 ms, 1160 Wesen etwa 8,5 ms, mit 30 Brandherden 2,2 ms; Stand 0.50.0 mit Umherziehen (`node werkzeuge/messung.js 300 200`) 353 Wesen etwa 2,7 ms gegen 1,95 ms ohne (über A* je Schritt waren es 10 ms, darum die Abstandskarten je Wegpunkt); Stand 0.51.0 mit Teilung (Messskript nach `werkzeuge/messung.js` mit 300 Essigbakterien, die sich teilen, solange sie Ninkasi sehen, 200 Befehle): 389 Wesen am Ende etwa 12 ms je Befehl gegen 3,1 ms ohne Teilung bei 285 Wesen; der Unterschied kommt von den vielen gleichzeitig Jagenden um Ninkasi (Zielwahl der Handlungen, Umkreissuche, Gefahrenprüfung), die Bedingung `anzahl_unter` kostet höchstens 2,5 ms, wenn sie nie früh abbricht; Stand 0.52.0 mit Licht (`node werkzeuge/messung.js 300 200 7 NaN 0 1`, 60 Lampen und 14 Wandfackeln) 351 Wesen etwa 5,2 bis 5,4 ms gegen 4,4 ms ohne Licht, ohne Licht so schnell wie vorher (auf dieser Maschine 4,5 ms für den Stand 0.51.0); Stand 0.53.0 mit Spüren und Duft (dieselben Aufrufe, Bakterien spüren 3 Felder weit) 350 Wesen etwa 5,9 ms gegen 5,3 ms für den Stand 0.52.0, ohne Licht 4,8 gegen 4,4 ms
+ Speichern: 2152 Befehle sind 62 kB, Nachspielen dauert knapp 1 s; ein Zustand sind etwa 40 kB, das Einsetzen unter 1 ms; `localStorage` fasst je Ursprung etwa 5 MB, also reichen auch fünf lange Läufe
+ EP je Lauf des Bots (3000 Befehle, zufällige Befehle, Tiefe 1): Stand 0.26.0 rund 1200 EP aus Erkundung gegen rund 55 aus Gegnern; Stand 2026-11-22 rund 1100 gegen rund 25
+ Arena, erster Befund mit 200 Kämpfen (Stand 0.43.0): drei Essigbakterien besiegt Ninkasi immer, fünf zu etwa 60 %, Ausrüstung und Skills ändern daran wenig; acht Essigbakterien und drei Fernkämpfer nie

## Ablauf einer Version

1. Plan mit Empfehlungen vorlegen, Freigabe abwarten
2. Umsetzen mit Tests; neue Dateien bekommen ein zuständiges Dokument; neue oder entfernte Namen in den Daten mit `node werkzeuge/namensbuch.js` ins Namensbuch, ein umbenannter oder entfernter fester Name mit Eintrag in `daten/umbenennungen.js`
3. Doku nach [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung nachführen, umgesetzte Punkte aus [Systemausbau.md](Systemausbau.md) streichen
4. Nummer in `src/version.js` erhöhen (Schema siehe [Architektur.md](Architektur.md), Versionen)
5. `node --test` und `node werkzeuge/bot.js` fehlerfrei
6. Commit (`Version X.Y.Z: Thema`), annotierter Tag `vX.Y.Z`, Push, alles erst auf ausdrücklichen Zuruf; reine Doku-Commits heißen `Doku: Thema` und bekommen keine Version

## Stolpersteine

+ `gesteuerteEntitaet` oder `spielerin`: wer handelt, was sie sieht und bei sich hat, fragt `gesteuerteEntitaet`; wer lernt, weiß, stirbt und die Bilanz des Laufs fragt `spielerin` (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); `tests/gesteuert.test.js` nennt die Dateien, die nur die gesteuerte Entität fragen dürfen
+ Komponenten ohne Zahl (`plaetze`, `tueren`, `sicht`, `spueren`, `angriffe`, `bewegung`, `aussehen`) nie direkt an der Entität lesen, sondern über ihre Lesefunktion (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); `tests/komponenten.test.js` meldet direkte Zugriffe, gewollte Ausnahmen (Datenprüfung, Steckbriefe, Gegenstände, Regelwerte, Vorlagen) stehen dort in einer Liste
+ Wissen aus früheren Läufen nie in der Logik aus der Chronik holen, sondern beim Start als Startoption `optionen.vorwissen` übergeben, sonst schlägt `tests/ablage.test.js` fehl (siehe [Architektur.md](Architektur.md), Speichern)
+ Einen festen Namen aus `daten/namensbuch.js` nie still umbenennen oder löschen, sonst verlieren die Chronik und andere Ablagen ihn; dafür gibt es `daten/umbenennungen.js`, `tests/namensbuch.test.js` meldet das Vergessen (siehe [Architektur.md](Architektur.md), Inhalte als Daten)
+ Eine Änderung in den Spieldaten macht die Speicherplätze veraltet (Prüfsumme der Daten, siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit); Texte in `sprache/` nicht
+ Python unter Windows: `Path.write_text` schreibt CRLF; immer `newline="\n"` angeben (Repo durchgängig LF, `.gitattributes`)
+ Python-Skripte mit Umlauten als Datei ausführen, nie über die Shell-Eingabe (stdin), sonst werden die Umlaute verfälscht
+ Der erste Schritt einer langen Aktion läuft sofort; `schritte: N` lässt dem Ziel N-1 Züge (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen)
+ Tests mit Fehlern in den Daten nutzen `rohdatenMitTesteintraegen`, nie den Spielinhalt
+ Tasten: die Belegung nennt physische Tasten (`KeyboardEvent.code`), Buchstaben in Fenstern und Zeichen ohne feste Lage gelten nach `KeyboardEvent.key`; wer das verwechselt, vertauscht auf der deutschen Tastatur Y und Z (siehe [Bedienung.md](Bedienung.md), Eingabe)
+ Logik ohne `Math.random()`, Uhrzeit und Winkelfunktionen (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), Kampfrechnung ohne `Math.exp` und `Math.pow` (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Neue Würfe im Spiel nie mit `spiel.zustand.zufallszustand`, sondern über `src/kern/wurf.js` mit einem Namen, sonst schlägt `tests/wurf.test.js` fehl (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit)
+ Die Kartengeneratoren von rot.js brechen ohne `timeLimit: Infinity` nach Uhrzeit ab (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit)

## Grundgerüst

Was `daten/` heute hält: nur, was die Regeln selbst brauchen, dazu Ninkasi; echter Inhalt kommt hier hinzu (siehe [Architektur.md](Architektur.md), Inhalte als Daten). Alle Zahlen vorläufig.

+ Regeln, Aktionen, Schadensarten, Eigenschaften, Taktiken (`nahkampf`, `fernkampf`), die Fraktion `ninkasi`; Gelände Wand, Boden, Tür offen und zu, Treppe hinauf und hinab; Effekte `faustschlag`, `eingeklemmt`, `brennen`, `rauch_husten`; das Gas `rauch`; Ebenen Hub (Tiefe 0, ein leerer Raum mit Treppe hinab), Testkammer (21x11 Felder, leer) und die Arenakarten; die Abfolge allein ist nur der Hub
+ Ninkasi: 100 LP, 100 MP, 0 von 100 PP, Pegel 0 (nach oben offen), Sichtweite 8, Bewegen 120, Faust 1W6+2 stumpf mit Genauigkeit 80 (80 % gegen ein Wesen ohne Ausweichen) und Kosten 50, ohne Fähigkeiten
+ Stoffwechsel je Welttick (`daten/ninkasi.js`): LP 0,3 nüchtern, 0,8 bei 1,5 ‰, darüber abnehmend; MP 0,8 nüchtern, 0 ab 3 ‰; PP Schwund 0,3 nüchtern, Stillstand von 0,5 bis 1,5 ‰, dann steigend bis 1,0 bei 4 ‰; danach Abbau des Pegels um 0,01 ‰; Schwellen 0,5, 1, 2 und 3 ‰ werden angezeigt und gemeldet, haben aber noch keine Wirkung; die Leiste zeigt zusätzlich das Optimum der LP
+ Alle Aktionen kosten 100 (`daten/aktionen.js`), abweichend Ninkasis Bewegen und die Angriffsprofile von Faust und Waffen; Tempo in Worten nach `regeln.tempo`
+ Tiles fehlen noch für Tür, Treppe und Feuer (`TILES_AUSSTEHEND` in `werkzeuge/luecken.js`, siehe [Systemausbau.md](Systemausbau.md), Punkt 11)

## Probeinhalt

Vorläufiger Inhalt in `datenproben/`, nur zum Ausprobieren der Systeme; er verschwindet, wenn echter Inhalt entsteht. Alle Zahlen vorläufig.

Daten:

+ `datenproben/index.js`: `{ eintraege, ergaenzen, abfolge, starttiefe }` für `datenZusammenfuegen` (siehe [Architektur.md](Architektur.md), Inhalte als Daten); die übrigen Dateien in `datenproben/` sind Sammlungen wie in `daten/`, Texte in `sprache/de/proben.js` (nur deutsch, im Englischen als Rückfall, siehe [Texte.md](Texte.md), Sprachdateien)

Regeln:

+ Kein Name des Probeinhalts steht im Grundgerüst, keiner im Namensbuch; Zähler der Chronik für Proben bleiben später unbenutzt liegen
+ Probeinhalt darf unvollständig sein: Lücken im Kompendium sind dort Warnungen, Zeichen statt Tiles erlaubt (siehe Kompendium und [Tileset.md](Tileset.md), Ablauf)
+ Tests, Bot und Werkzeuge spielen mit Grundgerüst und Probeinhalt (`src/inhalt.js`); Tests leiten Erwartungen aus den Daten ab, damit der Probeinhalt sich ändern darf

Inhalt:

+ Ebenen: unter dem Hub drei Kellertiefen zu 120x40 Feldern, die mittlere (`keller_dunkel`) finster mit 14 Wandfackeln (Reichweite 5, Stärke 80) am Rand der Räume (siehe [Welt.md](Welt.md), Licht), mit 16 bis 20 Wesen aus der Population (Essigbakterien in Rudeln von 1 bis 3, Fernkämpfer-Tests ab Tiefe 2 häufiger), 10 Bieren, einem Bierfass, 3 Brandflaschen, 3 Gärbottichen im Inneren der Räume, je 6 Säuredüsen und Klappergeschirren, je einem Stück Ausrüstung (zwei Kupferringe) samt einer Laterne, Türen an der Hälfte der Raumzugänge (siehe [Welt.md](Welt.md), Ebenen); der Lauf beginnt in Tiefe 1
+ Ninkasi bekommt die `testfaehigkeit` (Kreis mit Radius 1 auf ein Feld bis 6 weit, 10 MP, Abklingzeit 300, Trefferwurf je Wesen, sie selbst bleibt verschont), damit sich der Zielmodus ausprobieren lässt; sie setzt bei einem Treffer den `testzustand` (Ausweichen -2 für 500 Zeiteinheiten), damit die Anzeige der Zustände etwas zeigt; dazu den `sprint` (ohne Zeit, Abklingzeit 3000, Zustand `sprint` für 750: Bewegen -50 %, Pegelabbau +100 %), bis er mit dem Inhalt angeboren wird
+ Essigbakterium: 15 LP, Biss 1W4 Säure mit Genauigkeit 70 (nutzt 1 ab), 10 gebundene EP, Verhaltensmodul `jagen`, Fraktion `verderber` (lässt sich durch keinen Ruf umstimmen); spürt wie alle aus der Vorlage `bakterium` 3 Felder weit ohne Licht (`spueren`); im Probeinhalt teilt sich nichts
+ Fernkämpfer-Test (Zeichen F, ohne Tile): Testgegner für die KI mit Fähigkeiten, 10 LP, 15 gebundene EP, hält 3 Felder Abstand, Säurespucke (Geschoss über Verbündete, Abklingzeit 400, nutzt 1 ab) und angekündigter Säureschwall (Kreis mit Radius 1 auf das Feld beim Beginn, 3 Schritte, durch Schaden unterbrechbar, Abklingzeit 900, 30 %, nutzt 2 ab); trägt ein Bier und trinkt es unter 80 % LP mit 50 % Chance (Handlung `nutzen`, siehe [Wesen.md](Wesen.md), KI)
+ Fallen: Säuredüse (Tarnung 40, 2W4 Säure, nutzt 2 ab, hinterlässt Säure, die 1W3 je Tick verätzt und trocknet) und Klappergeschirr (Tarnung 20, Lärm 14, weckt die Nachbarschaft)
+ Feldschichten: Gärbottiche geben CO2 ab, das sich hinter geschlossenen Türen sammelt (ab 30 benommen, ab 70 Ersticken, vorläufig Giftschaden statt Zuständen); Brandflaschen zerspringen beim Wurf zu Hochprozentigem und entzünden es; Feuer 1W6, Rauch ab 40 undurchsichtig, ab 60 Husten
+ Getränke: Bier (+20 LP, Pegel +0,5 ‰, 900 g, stapelbar) wird zur leeren Flasche (400 g, Hauptwort mit festem Adjektiv) und verdirbt nach 50000 Zeiteinheiten zu Sauerbier (LP +5, Pegel +0,3 ‰); Bierfass mit 20 Schlucken zu einer Halben (2 kg Holz und 500 g je Schluck, voll 12 kg), wird zum Fass und verdirbt nicht; Bier und Bierfass dienen dem Zweck `heilen`; Brandflasche (900 g, stapelbar) dem Zweck `angriff`; Riechwasser (300 g, stapelbar) setzt den Zustand `witterung` (Spüren +5 für 200 Züge), zum Ausprobieren über die Testkammer
+ Ausrüstung von 20 g bis 6 kg: Schöpfkelle (Hand, flink, Kosten 70), Fasshammer (beide Hände, Kosten 100 wie die Norm, Ausweichen -5, betäubt mit 25 % für 100, Zustand `betaeubt` mit den Tags `kontrolle` und `wehrlos`), Lederschürze (Brust, Rüstung 2, Ausweichen -5), Kupferhelm (Kopf), Lederhose (Beine), Hopfenkette (Hals, LP-Regeneration +20 %), Kupferring (Finger), Laterne (Hand, Licht mit Reichweite 4 und Stärke 80, leuchtet angelegt und am Boden); Kupferhelm und Kupferringe bilden ein Set (Willenskraft); Lederschürze und Lederhose sind leichte Rüstung, der Kupferhelm schwere (Tags `ruestung_leicht`, `ruestung_schwer`); Lederschürze und Lederhose (Haltbarkeit 20, werden zu Lederfetzen) und Kupferhelm (30, wird zu Kupferschrott) nutzen sich unter Säure ab; Zeit zum An- und Ablegen und Verlangsamung je Stück siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung
+ Unbekanntes: noch kein unbekannter Gegenstand; die Gruppe `biere` (Tonkrug, Steinkrug, Bügelflasche, Henkelflasche, Bocksbeutel) wartet auf die Biersorten
+ Skills: Zähigkeit (Grund und Expertin, LP), Nahkampf (Genauigkeit mit Tag `nahkampf`), Ausweichen
+ Arenen (`datenproben/arenen.js`): Essigbakterien (drei, mit Varianten Ninkasi nackt, gerüstet, geübt und Gegner drei, fünf oder drei gereizte, ein Affix mit dem Zustand `gereizt`, Ausweichen -1, als Probe für Adjektive), Fernkämpfer in zwei Wellen (mit zwei Bier), Rudel im Engpass (sechs Essigbakterien vor dem Gang), Reihe aus dem Keller (sechs Rudel aus Tiefe 1, mit Bier und Brandflaschen, Taktik `fernkampf`), alle Gegner des Kellers; Befund siehe Messwerte
+ Auslöser sind im System vorhanden, im Probeinhalt aber nicht benutzt

## Verweise

+ Gesamte Arbeitsliste: [Systemausbau.md](Systemausbau.md); Lizenzen neuer Bibliotheken und Inhalte: `LIZENZEN.md`

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
