# Battle Ninkasi - Architektur

Stand: 2026-11-21

Zuständig für: `index.html`, `package.json`, `starten.py`, `starten.bat`, `lib/*`, `src/main.js`, `src/version.js`, `src/kern/spiel.js`, `src/kern/zustand.js`, `src/kern/zeit.js`, `src/kern/zufall.js`, `src/kern/ereignisse.js`, `src/kern/hakenkatalog.js`, `src/kern/register.js`, `src/kern/daten.js`, `src/kern/raumindex.js`, `src/kern/kurven.js`, `src/systeme/index.js`, `src/systeme/stoffwechsel.js`, `src/eingabe/speicherstand.js`, `daten/index.js`, `daten/regeln.js`, `daten/aktionen.js`

Mitprüfen bei Änderungen: [Wirkungen.md](Wirkungen.md), [Entwicklung.md](Entwicklung.md), [Titelbildschirm.md](Titelbildschirm.md)

Kern des Spiels: Grundsätze, Datenfluss, Befehle, Entitäten, Zeit, Ereignisse, Register, Wiederholbarkeit, Speichern und Versionen.

## Grundsätze

+ Modularität und Erweiterbarkeit haben Vorrang, auch auf Kosten höherer Code-Komplexität
+ Spiellogik und Anzeige strikt getrennt: Die Logik kennt kein DOM, kein Canvas, keine Tasten
+ Die Logik läuft auch ohne Browser (Node), für Tests, Simulationen und Balancing
+ Inhalte sind Daten, Mechanik ist Code; neue Inhalte brauchen im Regelfall keinen neuen Code
+ Jeder Lauf ist aus Startwert und Befehlsliste exakt reproduzierbar
+ Keine Spiele-Engine, kein Build-Schritt; JavaScript-Module (ES-Module), lokal über einen Webserver gestartet, da Module über `file://` nicht laden
+ Startskript `starten.py` (unter Windows per `starten.bat`): Webserver auf `127.0.0.1:8000` (belegt: freier Port) ohne Zwischenspeicher (`Cache-Control: no-store`), dazu Firefox als eigene Instanz (`-no-remote`) mit Entwicklungsprofil `.firefox-profil/` (in `.gitignore`, wird bei Bedarf angelegt, Einstellungen über `user.js`); Fenster ohne Tabs, Adressleiste und Titelleiste über `chrome/userChrome.css` im Profil (dazu `toolkit.legacyUserProfileCustomizations.stylesheets` und `browser.tabs.inTitlebar` = 1), mit `--mit-leisten` gewohnte Oberfläche, dann bleibt `userChrome.css` leer; endet Firefox, endet der Server; unter Windows mit `-wait-for-browser`, da `firefox.exe` sonst nur einen sofort endenden Startprozess ist; endet Firefox ohne Fehler binnen 5 Sekunden, läuft der Server bis Strg+C weiter; Firefox-Pfad notfalls über Umgebungsvariable `FIREFOX`
+ Spieleinstellungen liegen im `localStorage` und gelten je Ursprung (Host und Port); deshalb fester Port

## Datenfluss

1. Eingabe (Tastatur, Maus, später Gamepad) wird über eine frei belegbare Zuordnung in Aktionen des Aktionskatalogs und daraus in Befehle übersetzt (siehe [Bedienung.md](Bedienung.md), Eingabe und Fenster)
2. Befehle gehen durch eine einzige Eingangstür in die Logik und werden für den Spielstand aufgezeichnet
3. Die Logik prüft den Befehl (am Zug? zulässig?), führt ihn aus und verändert den Zustand
4. Die Logik meldet Ereignisse nach außen
5. Anzeige, Log, Effekte und später Sound reagieren auf Ereignisse und lesen den Zustand, ohne ihn zu verändern

## Befehle

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", gegenstandId: 4711 }`
+ Alles, was die Spielerin entscheidet, ist ein Befehl: Bewegen, Angreifen, Trinken, Brauen, aber auch Menüentscheidungen wie Skillwahl, Handel, Rezeptwahl, Weiterbrauen oder Abbrechen
+ Die Anzeige verändert den Spielzustand nie direkt, sie erzeugt nur Befehle
+ Keine Befehle sind reine Anzeige-Zustände: Fenster öffnen, im Log blättern, Tooltips, Karte verschieben, Zoom; sie kosten keine Zeit und kommen nicht in den Spielstand
+ Befehlsarten mit `ohneZeit: true` im Register `befehle` (bisher `lernen`, siehe [Wesen.md](Wesen.md), Skills und Lernen) sind Entscheidungen ohne Spielzeit: `befehlGeben` prüft, zeichnet auf und führt aus, aber ohne Zug, Zugzähler, `vor_befehl`, `zug_ende` und ohne eine laufende Aktion abzubrechen
+ Einstellungen (Tastenbelegung, Zoom, Kameraverhalten) sind keine Befehle und werden getrennt gespeichert
+ Tastatur, Maus, Gamepad, Testbots und Simulationen benutzen denselben Weg

## Entitäten und Komponenten

+ Alles in der Welt ist eine Entität: Ninkasi, Gegner, Verbündete, Händler, Items, Kessel, Fallen
+ Eine Entität ist eine ID plus Komponenten, z.B. Position, Werte, Inventar, KI, Fraktion, Handel, Braukessel, Sicht
+ Unterschiede entstehen allein durch die Kombination der Komponenten
+ Beispiele: Psi-Kontrolle ändert die Fraktion; Kulturhefe als Verbündete ist ein Dateneintrag; ein Phage tauscht beim Befall Komponenten des Bakteriums aus; ein wandernder Händler hat eine Handelskomponente und eine friedliche Fraktion
+ Wesen können in den Daten außerdem `tags`, feste `modifikatoren` und `auren` tragen, siehe [Wirkungen.md](Wirkungen.md), Modifikatoren
+ Werte (LP, MP, PP, Pegel und weitere) sind ein erweiterbarer Satz, keine fest verdrahteten Felder
+ Ein Wert ohne Grundwert ist nach oben offen (z.B. der Pegel), sein Höchstwert wird als `Infinity` berechnet und nie gespeichert; nach unten bleibt jeder Wert bei 0
+ Kurven sind Daten: Stützpunkte `[[stelle, wert], ...]`, dazwischen linear und ganzzahlig, außerhalb gleichbleibend (`src/kern/kurven.js`); z.B. Regeneration über dem Pegel
+ Stoffwechsel (`src/systeme/stoffwechsel.js`): Komponente mit Abbau des Pegels, Schwellen und je Wert einer Kurve der Regeneration über dem Pegel (Hundertstel je Welttick); negative Kurvenwerte sind Schwund, für jeden Wert möglich, Schwund der LP kann töten
+ Skills, Schriftrollen, Items und Zustände passen den Stoffwechsel über Modifikatoren an: `regeneration.<wert>` auf positive Raten, `schwund.<wert>` auf den Betrag negativer Raten, `kurvenverschiebung.<wert>` verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben), `abbau.pegel` auf den Abbau
+ Der gesamte Zustand ist reine Daten und als JSON serialisierbar (keine Funktionen, keine DOM-Objekte); dazu gehören die Tiefe der aktuellen Ebene (`tiefe`), die verlassenen Ebenen (`abgelegteEbenen`, siehe [Welt.md](Welt.md), Ebenen) und das Wissen des Laufs über unbekannte Gegenstände (`wissen`, siehe [Gegenstaende.md](Gegenstaende.md), Unbekanntes)
+ Positionen ändern sich nur über `positionSetzen` (`src/kern/raumindex.js`), damit der räumliche Index stimmt; Wesen bewegt `versetzen` (siehe [Wesen.md](Wesen.md), Bewegung)
+ Nach dem Erzeugen jeder Entität laufen die Handler des Registers `beimErzeugen` (`(zustand, entitaet) => void`), auch für einen abgespaltenen Teil eines Stapels; so planen Gegenstände ihr Verderben ein und bekommen ihr Etikett

## Zeitmodell

+ Ein einziger Zeitstrahl in ganzzahligen Zeiteinheiten
+ Aktionskosten statt Runden: Jede Aktion kostet Zeit, Standard 100; wer an der Reihe ist, bestimmt die Warteschlange nach Zeitpunkt
+ Kosten je Aktionsart verschieden (Bewegen, Nahkampf, Fernkampf, Trinken, Psi, Magie, Brauen u.a.); Modifikatoren zielen auf eine Aktionsart oder auf alle
+ Zugzähler: Jede ausgeführte Aktion erhöht `zuege` der Akteurin um eins, gleich wie viel Zeit sie kostet; daran misst sich die Abklingzeit der Fähigkeiten, wer schneller handelt, hat sie in Weltzeit früher zurück
+ Prozentuale Änderungen werden einheitlich gerundet; Rundungsfehler liegen bei etwa 1% und werden hingenommen
+ Die Warteschlange enthält drei Arten von Einträgen:
  + Akteure (Ninkasi, Gegner, Verbündete), die nach dem Handeln mit ihren Aktionskosten wieder eingereiht werden
  + die Weltuhr, alle 100 Einheiten (ein Welttick): Stoffwechsel (Regeneration, Schwund, Abbau des Pegels), Magie über die Zeit
  + Zeitereignisse, z.B. "Status endet bei T=4350", "Endospore erwacht bei T=8000"; ein Zeitereignis kann an eine Entität gebunden sein (`gebundenAn`) und entfällt, wenn sie entfernt wird
+ Gleichstand wird fest aufgelöst: zuerst die Weltuhr, dann Zeitereignisse, dann Akteure nach Erzeugungsreihenfolge
+ Die Warteschlange ist ein binärer Heap im Array (bleibt JSON, `src/kern/zeit.js`); die Ordnung ist vollständig, die Reihenfolge der Entnahme hängt also nicht vom Aufbau des Heaps ab; Entfernen filtert und baut den Heap neu auf
+ Dauern werden in Zeiteinheiten angegeben, nicht in Ticks
+ Bruchteile (z.B. 0,3 LP pro Tick) laufen über ganzzahlige Speicher in Hundertsteln, ein voller Punkt wird gutgeschrieben, der Rest bleibt stehen
+ Lange Aktionen (z.B. Brauen mit 2000 Einheiten) laufen in Schritten und werden unterbrochen, sobald eine Gefahr auftaucht (Gegner im Sichtfeld, Schaden); siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen
+ Nach einer Unterbrechung entscheidet die Spielerin per Befehl: weitermachen (und z.B. Treffer kassieren, um den Sud nicht zu verderben) oder abbrechen; die Folgen eines Abbruchs sind Spieldesign, siehe [Grundlagen.md](Grundlagen.md)

## Ereignisse

+ Interne Haken in der Logik dürfen eingreifen, z.B. "vor Schaden": Rüstung senkt den Wert, ein Schild fängt den Treffer ab; hier hängen Auslöser-Effekte und Zustände an
+ Nur Haken aus dem Katalog `src/kern/hakenkatalog.js` lassen sich anmelden und auslösen, Tippfehler fallen sofort auf; Mods ergänzen den Katalog
+ Der Katalog nennt je Haken, ob die Logik ihn schon auslöst (`inBetrieb`) und ob Auslöser aus Daten daran hängen dürfen (`ausloeserErlaubt`, nur bei Haken "danach")
+ In Betrieb: `vor_schaden` (Schadensart und Menge, Menge ändern oder abbrechen; Ränge der Schadensrechnung siehe [Wesen.md](Wesen.md), Kampfwerte), `nach_schaden` (bei Schaden über 0), `nach_treffer` (mit `kritisch`), `verfehlt` (mit `grund`), `vor_tod`, `nach_tod`, `nach_wertaenderung`, `zustand_beginnt`, `zustand_endet`, `vor_befehl` (Befehl ersetzen oder abbrechen), `vor_angriff` (einzelnen Angriff abbrechen), `verlaesst_feld` und `betritt_feld` (siehe [Wesen.md](Wesen.md), Bewegung)
+ `zug_ende` (`akteurId`, Quelle und Ziel die Akteurin) nach jeder Aktion, z.B. Fallen entdecken
+ `gegenstand_benutzt` (`gegenstandId`, `art`) beim Trinken, Werfen, Anlegen und Ablegen
+ Meldungen der Gegenstände: `verdorben` und `kaputt` (`was`, `wird`, `traegerin`), `abgenutzt` (`wer`, `was`, `menge`, `prozent`), `fluch_entdeckt` und `fluch_aufgehoben` (`wer`, `was`), `erkannt` (`wer`, `vorher` mit dem Etikett, `was`); das Log zeigt sie nur für Ninkasis Sachen
+ Reserviert für den Ausbau ([Systemausbau.md](Systemausbau.md)): `zug_beginn`
+ Kontext der Haken mit Beteiligten: `{ quelleId, urheberId, zielId, ursache, kettentiefe, mittel, tags, kritisch }`, dazu je Haken weitere Felder (`menge`, `position`)
+ Handler laufen nach Rang (kleiner zuerst, Vorgabe 100), bei gleichem Rang nach Anmeldung; so ist die Reihenfolge ausdrücklich geregelt, wenn Handler den Kontext verändern
+ Setzt ein Handler `kontext.abgebrochen = true`, laufen die weiteren Handler nicht mehr (z.B. Schild fängt den Treffer ab, Tod verhindert)
+ Meldungen nach außen ("Treffer", "Krit", "getrunken", "Tod") sind rein lesend; Anzeige, Log, schwebende Zahlen und Sound hängen sich daran
+ Für die Anzeige von Flächen und Geschossen: `flaeche` (`felder`) und `geschoss` (`bahn`, `aufschlag`, abgespielt im Zielmodus, siehe dort); `aktion_beginnt` nennt bei Fähigkeiten auch `faehigkeit`, `ankuendigung` und `felder`
+ Meldungen verweisen auf Entitäten über Bezüge (`{ id, typ, text, etikett?, ort? }`, `ort` die Position zur Zeit der Meldung), die auch nach dem Entfernen der Entität gültig bleiben; ein unbekannter Gegenstand trägt sein Etikett mit, die Anzeige nennt dann dieses, alte Log-Zeilen ändern sich beim Erkennen nicht; die Felder `art` und `zeit` sind reserviert
+ Wertänderungen laufen über eine gemeinsame Funktion, die den Haken "nach_wertaenderung" auslöst (z.B. für Pegelschwellen); sie nimmt den Ursprung `{ urheberId, ursache, mittel, kettentiefe }` mit; sinkt der Lebenswert, merkt sich das Wesen den Ursprung als `letzterVerlust`, zugerechnet der Urheberin (ein Wurf zählt für die Werferin, nicht für die Flasche)
+ Was auf Meldungen reagiert, darf weder den Zustand ändern noch den Spiel-Zufall benutzen

## Inhalte als Daten

+ Alle Inhalte liegen als JavaScript-Dateien vor, die nur Daten enthalten (`export default { ... }`), mit Kommentaren
+ Dazu gehören Charakter, Eigenschaften, Makel, Skills, Fähigkeiten, Gegner, Verbündete, Händler, Items, Getränke, Zutaten, Rezepte, Kessel, Effekte, Zustände, Tiles, Levelparameter
+ Vorlagen mit Vererbung: z.B. "Bakterium", davon abgeleitet "Essigbakterium" mit Abweichungen
+ Beim Laden werden alle Daten geprüft (Pflichtfelder, Typen, Verweise auf existierende Effekte, Verhaltensmodule, Texte); Fehler erscheinen beim Start mit klarer Meldung
+ Texte stehen nicht in den Daten, sondern als Schlüssel; siehe [Texte.md](Texte.md)

## Zufall und Wiederholbarkeit

+ Spielstand = Spielversion + Prüfsumme der Daten + Startwert + Startoptionen (die Eigenschaften aus der Charaktererstellung und seit 0.32.0 die Spielart) + Liste aller Befehle (JSON); Laden heißt Nachspielen ohne Anzeige
+ Spielart (`optionen.spielart`, Liste `SPIELARTEN` in `src/kern/spiel.js`, Vorgabe und bisher einzige "normal"; eine unbekannte wirft): gehört zum Lauf, nicht zu den Einstellungen, und lässt sich im Lauf nicht wechseln; künftige Spielarten (weich, friedlich, allmächtig, eigene Regeln wie die Häufigkeit der Monster) liest die Logik aus den Startoptionen, so bleibt der Lauf wiederholbar und die Chronik weiß, wie gespielt wurde (siehe [Titelbildschirm.md](Titelbildschirm.md))
+ Startwert frei wählbar oder zufällig, Abfrage beim Spielstart (Vorbild: Brogue)
+ Zwei Zufallsquellen: Spiel-RNG für die Logik, kosmetischer RNG für Animationen, Partikel und Textvarianten
+ Abgeleitete Startwerte für Inhalte, die nicht vom Spielverlauf abhängen sollen, z.B. Buchtexte aus Lauf-Startwert und Objekt-ID
+ Regeln für die Logik: kein `Math.random()`, keine Uhrzeit, keine Winkelfunktionen, nur ganze Zahlen, feste Reihenfolge beim Durchlaufen von Sammlungen
+ Spiel-RNG: eigener Generator sfc32 (`src/kern/zufall.js`), nur ganze Zahlen, Zustand aus vier 32-Bit-Zahlen im Spielzustand; jede Änderung am Verfahren ändert die Zahlenfolge
+ rot.js hat einen eigenen, globalen RNG; er wird nur für die Dungeon-Erzeugung benutzt und vorher mit einem abgeleiteten Startwert gesetzt
+ Fallstrick: Die Kartengeneratoren von rot.js (Digger, Uniform) brechen nach einer Zeitgrenze ab (`timeLimit`, gemessen mit `Date.now()`); sie wird deshalb immer auf `Infinity` gesetzt
+ Abgeleitete Startwerte: Spiel-RNG (`"spiel"`), Grundriss (`"ebene.<name>"`) und Inhalt einer Ebene (`"ebene.<name>.inhalt"`) haben eigene Quellen, damit die Ebene nicht vom Spielverlauf abhängt; ebenso die Etiketten unbekannter Gegenstände (`"etiketten"`)
+ Jede Änderung an Code oder Daten macht alte Spielstände ungültig; passen Version oder Prüfsumme nicht, gibt es eine klare Meldung
+ Nebennutzen: Spielstand als Fehlerbericht, Aufzeichnungen zum Anschauen, "Seed des Tages", automatische Tests

## Speichern

+ Seit 0.29.0 speichert der Browser den laufenden Lauf von selbst (`src/eingabe/speicherstand.js` ohne DOM, `localStorage` auf dem Platz des Laufs in `src/main.js`), gesammelt höchstens alle 300 ms nach einem Befehl und sofort beim Verlassen der Seite (`pagehide`); nicht während der Charaktererstellung
+ Drei Speicherplätze seit 0.32.0 (`battle-ninkasi.lauf.1` bis `.3`, `speicherschluesselPlatz`): nebeneinander laufende Läufe, keine Sicherungen desselben Laufs; der Platz des laufenden Spiels steht in `src/main.js` (`aktuelleStelle`); der eine Platz bis 0.31.0 (`battle-ninkasi.lauf`) wird beim Start gelöscht
+ Speicherstand: `{ version, startwert, optionen, befehle, zustand, vorschau, oberflaeche: { leisten, log, gesehen } }`; `vorschau` (`vorschauAusSpiel`: Tiefe, Züge, Startwert, Spielart, `gespeichertAm`) liest der Titel über `platzVorschau`, ohne den Zustand einzusetzen; `gesehen` sind die Wesenarten, die die Chronik in diesem Lauf schon gezählt hat; der Spielstand (Startwert, Startoptionen, Befehle) bleibt die verbindliche Aufzeichnung, der Schnappschuss des Zustands (`schnappschuss` in `src/kern/spiel.js`, eine Kopie des reinen JSON) lädt ohne Nachspielen (`ausSchnappschuss`); Index und Zwischenspeicher entstehen aus dem Zustand neu, die vorgemerkten Auslöser sind zwischen zwei Befehlen leer
+ Gemessen: 2152 Befehle sind 62 kB, Nachspielen dauert knapp 1 s; ein Zustand sind etwa 40 kB, das Umwandeln unter 1 ms; deshalb lädt der Schnappschuss und nicht die Befehlsliste
+ Der Teil `oberflaeche` liest die Logik nie: Stand der Schnellleiste und die letzten 200 Logzeilen (`zeilenEinsetzen` in `src/anzeige/log.js`)
+ Beim Start der Seite erscheint der Titel (siehe [Titelbildschirm.md](Titelbildschirm.md)); Fortsetzen lädt einen Platz, die Charaktererstellung entfällt, das Log nennt das Fortsetzen; ein Platz aus einer anderen Version oder unlesbar heißt im Titel veraltet und lässt sich nur ersetzen oder löschen; lässt sich ein Zustand nicht einsetzen, wird der Platz gelöscht und der Titel sagt es
+ `?seed=` beginnt gleich einen Lauf mit diesem Startwert auf dem ersten leeren Platz (sonst erscheint der Titel) und verschwindet danach aus der Adresse; der Startwert wird nicht mehr in die Adresse geschrieben, `&neu` entfällt
+ Ende eines Laufs (`laufAbschliessen` in `src/main.js`, einmal je Lauf): nach dem Tod oder beim Aufgeben über "Neuer Lauf" ein Eintrag in die Chronik, der ganze Stand bleibt als `battle-ninkasi.letzter_lauf` für ein späteres Abspielen, der Platz wird frei
+ Chronik (`src/eingabe/chronik.js`, `battle-ninkasi.chronik`): getrennt von den Plätzen und ohne Aufzeichnungen, damit sie neue Versionen übersteht; `{ format, laeufe, zaehler }`, Läufe mit Version, Startwert, Spielart, Datum, Tiefe, Zügen, Befehlen, Ergebnis und Ursache (höchstens 500, die Zähler bleiben); Zähler frei benannt (`besiegt.<typ>` für Siege Ninkasis, `gesehen.<typ>` einmal je Lauf und Art, `tode`, `laeufe`), erhoben in der Oberfläche aus den Meldungen (Tabelle `ZAEHLREGELN`) und dem Sichtfeld nach jedem Befehl, nie in der Logik; Freischaltungen sind Bedingungen `{ zaehler, mindestens }` (`freigeschaltet`), zuerst für Titelbilder, später für Erfolge, Bestiarium und Kompendium
+ Prüfung: ein Unittest setzt einen Schnappschuss mitten im Lauf fort und vergleicht mit dem echten Lauf; der Bot speichert jeden vierten Lauf mitten im Lauf, lädt ihn, gibt der Kopie am Ende die übrigen Befehle der Aufzeichnung und verlangt denselben Zustand

## Versionen

+ Schema Ära.Feature.Fix, z.B. 0.3.1
+ Erste Zahl: Ära, ein großer Entwicklungsabschnitt
+ Zweite Zahl: Feature, eine neue Funktion
+ Dritte Zahl: kleines Feature oder Fehlerbehebung
+ Steigt eine Zahl, beginnen die Zahlen rechts davon wieder bei 0
+ 0.0.0 ist die erste Version des Prototyps
+ Die Version ist Teil jedes Spielstands, siehe Zufall und Wiederholbarkeit
+ Einzige Quelle der Versionsnummer ist das Modul `src/version.js` (`export default "<Version>"`), von Browser und Node gleich importiert
+ Jede Version bekommt einen annotierten Git-Tag (`v0.3.1`), auch Fehlerbehebungen
+ Ablauf: Nummer in `src/version.js` erhöhen, committen, taggen, pushen
+ Commits zwischen zwei Versionen tragen dieselbe Nummer wie die vorige Version; verbindlich nachspielbar sind nur Spielstände getaggter Versionen

## Leistung

+ Ziel: 300 Gegner unter 2 ms je Befehl (Ninkasi handelt, danach alle anderen); gemessen mit `node werkzeuge/messung.js [Gegner] [Befehle] [Startwert] [Türen in Prozent] [Brandherde]`, das Essigbakterien und ein Fünftel so viele Fernkämpfer aufstellt
+ Stand 0.17.0: 113 Wesen 0,4 ms, 341 Wesen 1,0 ms, 1173 Wesen 7 ms je Befehl (vorher 1,5 ms, 9,2 ms und quadratisches Wachstum)
+ Stand 0.18.0 mit Türen an der Hälfte der Raumzugänge: 356 Wesen etwa 1,7 bis 2,1 ms, 1176 Wesen etwa 12 bis 13 ms, ohne Türen wie 0.17.0 (vierter Parameter des Messwerkzeugs); Bakterien öffnen keine Türen und drängen sich in ihren Räumen, jede Suche im Umkreis findet so mehr Nachbarn
+ Stand 0.19.0: 339 Wesen etwa 1,6 ms, 1160 Wesen etwa 8,5 ms; mit 30 Brandherden (fünfter Parameter des Messwerkzeugs) 2,2 ms, Feuer, Rauch und das neu berechnete Sichtfeld kosten etwas
+ Die Listen, die das Register für Haken und Zustandsprüfungen liefert, liegen eingefroren auf Vorrat und werden erst bei einer An- oder Abmeldung neu gebildet (`src/kern/register.js`)
+ Vorbilder: Gitter als räumlicher Index (bei Rasterspielen üblich), Prüfungen nur für Vorgemerktes; Brogue und DCSS simulieren die ganze Ebene, ferne Wesen werden hier ebenso voll simuliert
+ Räumlicher Index (`src/kern/raumindex.js`): je Feld und je Zelle von 8x8 Feldern die IDs, dazu alle Entitäten mit Position und die möglichen Trägerinnen von Auren, alles aufsteigend nach ID; die Reihenfolge der Ergebnisse ist also dieselbe wie beim Durchlauf über alle Entitäten
+ Der Index hängt in einer `WeakMap` am Zustandsobjekt, nicht im Zustand: er kommt weder in Spielstände noch in Vergleiche und entsteht beim ersten Zugriff neu, z.B. nach dem Laden oder Nachspielen; `indexVerwerfen` beim Wechsel der Ebene
+ Gepflegt wird er über `positionSetzen`, Erzeugen und Entfernen von Entitäten und Änderungen an Zuständen (`zustaendeGeaendert`); der Bot vergleicht ihn nach jedem Befehl mit einem frisch aufgebauten (`indexPruefen`) und prüft den Heap (`warteschlangeGueltig`)
+ Nutzer: `entitaetenAuf` (ein Feld), `entitaetenImUmkreis` (Quadrat um eine Mitte, für Lärm), `kandidatenInSicht` (`src/systeme/sicht.js`: für Ninkasi alle mit Position, für andere die innerhalb ihrer Sichtweite; Zielwahl der KI, Bemerken), `entitaetenMitPosition` (Gefahrenprüfung, Zorn), Auren nur über die Trägerinnen
+ Neben dem Index liegen die Vormerkungen der Zustandsprüfungen (`lageOffen`, `todOffen`) und die Menge der sichtbaren Felder für `istSichtbar`
+ Obergrenze der Population `regeln.population.hoechstWesen` (500): darüber entsteht nichts mehr, nicht stillschweigend: Beschwören meldet `population_voll`, das Log zeigt den Hinweis hervorgehoben und die Konsole warnt; bestellt eine Ebene mit Ninkasi mehr Wesen, ist das ein Datenfehler

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
