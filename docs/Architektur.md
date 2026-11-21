# Battle Ninkasi - Architektur

Stand: 2026-11-21

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

1. Eingabe (Tastatur, Maus, später Gamepad) wird über eine frei belegbare Zuordnung in Aktionen des Aktionskatalogs und daraus in Befehle übersetzt (siehe Eingabe und Fenster)
2. Befehle gehen durch eine einzige Eingangstür in die Logik und werden für den Spielstand aufgezeichnet
3. Die Logik prüft den Befehl (am Zug? zulässig?), führt ihn aus und verändert den Zustand
4. Die Logik meldet Ereignisse nach außen
5. Anzeige, Log, Effekte und später Sound reagieren auf Ereignisse und lesen den Zustand, ohne ihn zu verändern

## Befehle

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", gegenstandId: 4711 }`
+ Alles, was die Spielerin entscheidet, ist ein Befehl: Bewegen, Angreifen, Trinken, Brauen, aber auch Menüentscheidungen wie Skillwahl, Handel, Rezeptwahl, Weiterbrauen oder Abbrechen
+ Die Anzeige verändert den Spielzustand nie direkt, sie erzeugt nur Befehle
+ Keine Befehle sind reine Anzeige-Zustände: Fenster öffnen, im Log blättern, Tooltips, Karte verschieben, Zoom; sie kosten keine Zeit und kommen nicht in den Spielstand
+ Befehlsarten mit `ohneZeit: true` im Register `befehle` (bisher `lernen`, siehe Skills und Lernen) sind Entscheidungen ohne Spielzeit: `befehlGeben` prüft, zeichnet auf und führt aus, aber ohne Zug, Zugzähler, `vor_befehl`, `zug_ende` und ohne eine laufende Aktion abzubrechen
+ Einstellungen (Tastenbelegung, Zoom, Kameraverhalten) sind keine Befehle und werden getrennt gespeichert
+ Tastatur, Maus, Gamepad, Testbots und Simulationen benutzen denselben Weg

## Entitäten und Komponenten

+ Alles in der Welt ist eine Entität: Ninkasi, Gegner, Verbündete, Händler, Items, Kessel, Fallen
+ Eine Entität ist eine ID plus Komponenten, z.B. Position, Werte, Inventar, KI, Fraktion, Handel, Braukessel, Sicht
+ Unterschiede entstehen allein durch die Kombination der Komponenten
+ Beispiele: Psi-Kontrolle ändert die Fraktion; Kulturhefe als Verbündete ist ein Dateneintrag; ein Phage tauscht beim Befall Komponenten des Bakteriums aus; ein wandernder Händler hat eine Handelskomponente und eine friedliche Fraktion
+ Wesen können in den Daten außerdem `tags`, feste `modifikatoren` und `auren` tragen, siehe Modifikatoren
+ Werte (LP, MP, PP, Pegel und weitere) sind ein erweiterbarer Satz, keine fest verdrahteten Felder
+ Ein Wert ohne Grundwert ist nach oben offen (z.B. der Pegel), sein Höchstwert wird als `Infinity` berechnet und nie gespeichert; nach unten bleibt jeder Wert bei 0
+ Kurven sind Daten: Stützpunkte `[[stelle, wert], ...]`, dazwischen linear und ganzzahlig, außerhalb gleichbleibend (`src/kern/kurven.js`); z.B. Regeneration über dem Pegel
+ Stoffwechsel (`src/systeme/stoffwechsel.js`): Komponente mit Abbau des Pegels, Schwellen und je Wert einer Kurve der Regeneration über dem Pegel (Hundertstel je Welttick); negative Kurvenwerte sind Schwund, für jeden Wert möglich, Schwund der LP kann töten
+ Skills, Schriftrollen, Items und Zustände passen den Stoffwechsel über Modifikatoren an: `regeneration.<wert>` auf positive Raten, `schwund.<wert>` auf den Betrag negativer Raten, `kurvenverschiebung.<wert>` verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben), `abbau.pegel` auf den Abbau
+ Der gesamte Zustand ist reine Daten und als JSON serialisierbar (keine Funktionen, keine DOM-Objekte); dazu gehören die Tiefe der aktuellen Ebene (`tiefe`), die verlassenen Ebenen (`abgelegteEbenen`, siehe Ebenen) und das Wissen des Laufs über unbekannte Gegenstände (`wissen`, siehe Unbekanntes)
+ Positionen ändern sich nur über `positionSetzen` (`src/kern/raumindex.js`), damit der räumliche Index stimmt; Wesen bewegt `versetzen` (siehe Bewegung)
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
+ Lange Aktionen (z.B. Brauen mit 2000 Einheiten) laufen in Schritten und werden unterbrochen, sobald eine Gefahr auftaucht (Gegner im Sichtfeld, Schaden); siehe Lange Aktionen
+ Nach einer Unterbrechung entscheidet die Spielerin per Befehl: weitermachen (und z.B. Treffer kassieren, um den Sud nicht zu verderben) oder abbrechen; die Folgen eines Abbruchs sind Spieldesign, siehe [Grundlagen.md](Grundlagen.md)

## Wirkungsarten

Skills, Items, Zustände und Fähigkeiten wirken über sechs Arten, die frei kombinierbar sind:

1. Modifikatoren ändern Zahlen, z.B. "Braupaddel der Geschwindigkeit: Angriff kostet 33% weniger Zeit", "Skill: Bewegung 5% schneller"
2. Auslöser-Effekte reagieren auf Ereignisse, z.B. "bei Angriff, 15% Chance, weiterer Angriff", "beim Tod Sporen freisetzen"
3. Aktionsveränderer ändern, wie eine Aktion abläuft: Zielmuster, Reichweite, Fläche; z.B. "Braupaddel des Rundumschlags trifft alle angrenzenden Felder", "Speer trifft zwei Felder in Linie"; Zielmuster sind Daten (`muster: { art: "angrenzend" }`, `muster: { art: "linie", laenge: 2 }`), siehe Zielauswahl
4. Zustände sind zeitlich begrenzt, mit Verlauf (gleichbleibend, abklingend, ansteigend) und Stapelregel (erneuern, aufaddieren, nur der stärkste, einzeln); sie bündeln selbst Modifikatoren und Auslöser; z.B. Schaden über Zeit, abklingender Segen, sich steigernde Vergiftung; siehe Zustände
5. Auren wirken auf andere im Umkreis der Trägerin, z.B. "Gegner in der Nähe langsamer", "Hefen in der Nähe sprossen schneller"
6. Gewährte Aktionen schalten eine neue Aktion frei, z.B. "Braupaddel erlaubt Ansturm"

Jede Wirkungsart kann zusätzlich tragen:

+ Bedingungen: nur ab Pegel X, nur gegen Bakterien, nur unter 30% LP, nur mit zwei Kupfer-Items (Sets, Synergien)
+ Nachteile: negative Werte, z.B. für verfluchte Items

Jeder Modifikator kennt seine Quelle (Skill, Item, Zustand, Pegel); entfällt die Quelle, entfallen genau ihre Modifikatoren. Werte werden bei Bedarf aus Grundwert und Modifikatoren berechnet, siehe Modifikatoren.

## Modifikatoren

+ Modifikator: `{ ziel, art, betrag, quelle, tag?, wenn? }`, z.B. `{ ziel: "kosten.bewegen", art: "prozent", betrag: -5 }`; Ziele sind Namen wie `lp`, `genauigkeit`, `ausweichen`, `ruestung`, `ruestung.<art>`, `widerstand`, `schaden`, `kritfaktor` (siehe Kampfwerte), `reichweiteSicht`, `kosten.<aktion>`, `kosten.alle`, `verbrauch.<wert>`, `verbrauch.alle`, `abklingzeit`, `unterhalt.<wert>` (siehe Fähigkeiten), `regeneration.<wert>`, `schwund.<wert>`, `kurvenverschiebung.<wert>`, `abbau.pegel`, `eigenschaft.<name>` (siehe Skills und Lernen)
+ Arten: `plus`, `prozent`, `mal` (Betrag in Prozent, `150` heißt x1,5), `mindestens`, `hoechstens`, `setzen` (zählt als `mindestens` und `hoechstens` mit demselben Betrag); alle Beträge ganzzahlig
+ Verrechnung (`verrechnet` in `src/kern/werte.js`, Vorbild "increased" und "more" in Path of Exile): (Basiswert + Summe aller `plus`) x (100 + Summe aller `prozent`) / 100 x jedes `mal` / 100, ganzzahlig gerechnet und einmal am Ende gerundet, die Reihenfolge der Modifikatoren spielt also keine Rolle; danach hebt `mindestens` (der höchste) und senkt `hoechstens` (der niedrigste), bei Widerspruch gewinnt `hoechstens` (Blindheit schlägt Fernsicht)
+ Prozente addieren sich, zehnmal +5 % sind +50 %; nur `mal` multipliziert, und nur dort, wo die Daten es ausdrücklich sagen; so wachsen Werte nicht unbemerkt exponentiell; Skills multiplizieren sich untereinander, indem die Quelle `skills` je Skill einen `mal`-Modifikator liefert (entschieden in [Charakter.md](Charakter.md), umstellbar über `regeln.lernen.verrechnung`, siehe Skills und Lernen)
+ Kein Wert baut auf seinem letzten Ergebnis auf, jede Abfrage rechnet vom Grundwert; Untergrenzen wie "Kosten mindestens 1" setzen die Aufrufer
+ Quellen sind ein Register (`modifikatorquellen`), Signatur `(spiel, entitaet) => [modifikator]`; `modifiziert(spiel, entitaet, ziele, basiswert)` sammelt bei jeder Abfrage aus allen Quellen in der Reihenfolge der Anmeldung, gespeichert oder nachgeführt wird nichts; mitgeliefert `eigene`, `auren`, `zustaende`, `ausruestung` (siehe Ausrüstung), `skills` und `anforderungen` (siehe Skills und Lernen)
+ Mitgelieferte Quellen: `eigene` (die Liste `entitaet.modifikatoren`, mit `modifikatorHinzufuegen` und `modifikatorenEntfernen` je Quelle), `zustaende` (siehe Zustände), `auren`, `ausruestung`, `skills` (Quelle `skill:<name>`) und `anforderungen` (Abzüge für nicht erfüllte Anforderungen angelegter Gegenstände, Quelle `anforderung:<id>`)
+ `modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende?)` liefert die wirksamen Modifikatoren mit ihrer Quelle, als Grundlage für Erklärungen in der Oberfläche
+ `hoechstwert(spiel, entitaet, wertName)` und alle Begrenzungen von Werten rechnen über `modifiziert`; nach oben offene Werte (Pegel) haben keinen Höchstwert
+ Umstände einer Abfrage: `modifiziert(spiel, entitaet, ziele, basiswert, { gegenueberId?, tags? })`; der Trefferwurf gibt für Genauigkeit und Verteidigung das Gegenüber und die Tags von Angriff und Effekt mit, die Schadensrechnung dazu die Schadensart, `zeitkosten` reicht Umstände durch
+ Tags: ein Modifikator mit `tag` wirkt nur, wenn die Abfrage den Tag in `umstaende.tags` mitbringt, z.B. `{ ziel: "kosten", tag: "psi", art: "prozent", betrag: -10 }` für alle Psi-Fähigkeiten, auch künftige; Wesen tragen `tags` (z.B. `["bakterium", "essig"]`), Schadensarten gehen als Tag in die Abfragen der Schadensrechnung (siehe Kampfwerte)
+ Bedingungen: `wenn: [{ bedingung, ...parameter }]`, alle müssen gelten; Register `modifikatorbedingungen`, Signatur `(spiel, entitaet, parameter, umstaende) => boolean`, Parameter für die Datenprüfung wie bei den Bausteinen (`src/systeme/modifikatoren.js`)
+ Mitgelieferte Bedingungen: `pegel_ab { wert }`, `pegel_unter { wert }` (z.B. nüchtern), `wert_unter_prozent { wert, prozent }` (gemessen am Grundwert ohne Modifikatoren), `gegenueber_tag { tag }`, `gegenueber_ahnungslos` (Hinterhalt, siehe Wahrnehmung), `hat_zustand { zustand }`, `ohne_zustand { zustand }`, `hat_tag { tag }`, `ohne_tag { tag }`, `traegt_tag { tag, anzahl? }` (Sets aus angelegten Gegenständen), `skill_ab { skill, stufe }`, `eigenschaft_ab { eigenschaft, wert }`, `eigenschaft_unter { eigenschaft, wert }` (siehe Skills und Lernen); dieselben Bedingungen gelten für `voraussetzungen` an Fähigkeiten, `wenn` an Auslösern und an Einträgen der KI (`bedingungenErfuellt` in `src/kern/werte.js`); Schwellen des Pegels sind damit gewöhnliche Modifikatoren mit `pegel_ab`
+ Bedingungen lesen nur Rohwerte und rufen `modifiziert` nicht auf; fragen sich Modifikatoren doch im Kreis ab, bricht ein Schutz nach acht Ebenen mit einer Fehlermeldung ab
+ Ausnahme: `eigenschaft_ab` und `eigenschaft_unter` lesen den wirksamen Wert samt Modifikatoren, damit ein Kraftbier eine Anforderung erfüllt; die Datenprüfung verbietet sie an Modifikatoren auf `eigenschaft.*` (direkter Kreis), indirekte fängt der Schutz
+ Auren (Modifikatorquelle `auren`): `auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen; Reichweite als Kreis wie in der Zielauswahl, `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl (`feinde`, `verbuendete`, `wesen`, `alle`); standardmäßig nicht auf die Trägerin selbst und durch Wände (Gerüche, Dunst, Sporen), mit `sichtlinie: true` nur bei freier Sicht; Auren in Zuständen skalieren mit Stärke und Verlauf; Quelle `aura:<id>` bzw. `aura:zustand:<nummer>`
+ Auren werden bei jeder Abfrage gesucht, aber nur unter den möglichen Trägerinnen aus dem räumlichen Index (siehe Leistung)

## Kampfwerte

+ Vorbilder: Caves of Qud (erst Ausweichen gegen den Treffer, dann Rüstung gegen den Schaden; schwere Rüstung kostet Ausweichen), Brogue (Trefferchance aus Genauigkeit und Verteidigung ohne harte Grenzen), DCSS (Willenskraft gegen geistige Angriffe, Waffen mit eigener Geschwindigkeit), Path of Exile (Widerstände brauchen eine Grenze, weil sich Prozente addieren)
+ Code in `src/systeme/kampf.js`, Regelwerte in `daten/regeln.js` (`kampf`), Schadensarten in `daten/schadensarten.js`
+ Grundsatz: Kampfwerte sind Punkte, die sich addieren (wie alle Modifikatoren); erst am Ende werden sie über einen Halbwert zu einem Anteil `punkte / (punkte + halbwert)`, der sich 100 % nur annähert; jede weitere Quelle hilft, aber immer weniger
+ Gerechnet wird nur mit ganzen Zahlen und Brüchen, nicht mit `Math.exp` oder `Math.pow`, die nicht in jedem Browser bit-genau gleich sind; gewürfelt wird der Bruch exakt (`mitAnteil` in `src/kern/zufall.js`), sichere Fälle würfeln nicht; Prozentzahlen (`anteilInProzent`) nur für die Anzeige
+ Schadensarten: `stumpf`, `schnitt` (beide mit `ruestung: true`), `saeure`, `lauge`, `feuer`, `elektrisch`, `alkohol`, `gift`, `psi`, `magie` (reine Magie, z.B. Energieball); jeder Schritt `schaden` nennt Pflicht seine `art`; das Mittel ist davon getrennt ein Tag am Effekt: ein magischer Feuerball macht `feuer` mit dem Tag `magie`
+ Angriffsprofile am Wesen: `angriffe: [{ name, genauigkeit, effekt, kosten?, chance?, tags?, kritchance?, muster?, trifft? }]`, Zugriff nur über `angriffeVon(spiel, wesen)`: angelegte Waffen ersetzen die eigenen Profile (siehe Ausrüstung); `name` ist je Wesen eindeutig und steht als `mittel.name` in Todesursache und Haken
+ Eine Angriffsaktion führt alle Profile nacheinander in der Reihenfolge der Daten aus, jedes mit eigenem Trefferwurf und, mit `muster`, eigener Zielauswahl; ein Profil mit `chance` (Prozent) wird nur so oft mitgenommen, kommt keines zum Zug, greift das erste; wessen Lebenswert schon bei 0 liegt, wird von weiteren Profilen derselben Aktion nicht mehr angegriffen (Vorbild sind Monster mit mehreren Angriffen in DCSS)
+ Zeitkosten je Profil (`kosten`, Vorgabe `aktionen.nahkampf`), z.B. Dolch 70, Fasshammer 150; die Aktion kostet so viel wie ihr langsamstes Profil, Modifikatoren auf `kosten.nahkampf` und `kosten.alle` wirken darauf; ein schnelles Wesen greift so gegen ein langsames öfter an (Vorbild Waffenverzögerung in DCSS)
+ Vor jedem einzelnen Angriff läuft der Haken `vor_angriff` mit dem Namen des Profils (`angriff`); ein Abbruch lässt diesen Angriff aus, z.B. Furcht oder eine Ladehemmung
+ Kampfwerte am Wesen: `kampfwerte: { ausweichen, willenskraft, blocken, ruestung, kritchance, heimlichkeit, entdecken, kennerschaft }`, Vorgabe je 0 (Heimlichkeit siehe Wahrnehmung, Entdecken siehe Gelände, Kennerschaft siehe Unbekanntes), abgefragt über Modifikatoren mit gleichnamigem Ziel, nie unter 0 (`kampfwert`); dazu `widerstaende: { saeure: 100, feuer: -50 }` und `immun: ["psi"]`
  + `ausweichen`: Verteidigung gegen körperliche Angriffe und Geschosse
  + `willenskraft`: Verteidigung gegen Psi (und Magie, wo die Daten es sagen)
  + `blocken`: fängt einen schon gelungenen Treffer ganz ab (Schild, Schleimhülle)
  + `ruestung`: fester Abzug je Treffer
  + `kritchance`: Chance der Angreiferin auf einen Krit
+ Ablauf eines Angriffs (`trefferwurf`): Trefferwurf, Blocken, Krit-Wurf; das Ergebnis nennt dazu `trefferchance` (Prozent vor dem Blocken, gegen Ahnungslose 100, nur für das Log); Fehlschläge melden `verfehlt` mit `grund` (`ausgewichen`, `geblockt`) und `trefferchance` und lösen den Haken `verfehlt` mit demselben Grund aus, Treffer wirken den Effekt mit `kritisch` im Kontext und lösen `nach_treffer` aus
  + Trefferchance: `genauigkeit / (genauigkeit + verteidigung + grundverteidigung)`; die Genauigkeit über Modifikatoren der Quelle (ohne Quelle, z.B. bei einer Falle, unverändert), die Verteidigung nach `gegen`; die Grundverteidigung (Regelwert 20) sorgt dafür, dass auch ein Ziel ohne eigene Verteidigung nicht sicher getroffen wird; Genauigkeit 80 gegen Ausweichen 0 trifft so zu 80 %, gegen 80 zu 44 %
  + Blocken: `blocken / (blocken + halbwertBlocken)`; Kritchance ebenso mit `halbwertKritchance`, die `kritchance` des Angriffs kommt zu der des Wesens
+ Baustein `trefferwurf { genauigkeit, effekt, gegen?, sonst?, kritchance? }` für Fernkampf, Magie, Psi und Flächen; `gegen` Vorgabe `ausweichen`, Psi z.B. `willenskraft`; `sonst` wirkt bei einem Fehlschlag, z.B. halber Schaden einer Explosion, der man ausweicht (Vorbild Rettungswurf); wo kein Wurf passt, lassen die Daten ihn weg
+ `trefferanteil(spiel, { quelle, ziel, genauigkeit, gegen, tags })` liefert die Trefferchance als Bruch ohne zu würfeln, Grundlage für Vorschau, Tooltip und KI
+ Schadensrechnung am Haken `vor_schaden`, feste Ränge: Angreiferin (50: Modifikator `schaden` mit den Tags und der Schadensart, danach Krit mit `kritfaktor`), Handler ohne Rang (100, z.B. Abfangen), Rüstung (200), Widerstand und Immunität (300)
+ Krit: Regelwert `kritfaktor` 150 (x1,5), Modifikatoren auf `kritfaktor` heben ihn nach oben offen; er wirkt vor der Rüstung, Krits schlagen sich also besser durch Panzer
+ Rüstung: fester Abzug, ein Treffer mit Schaden behält mindestens `mindestschadenNachRuestung` (1); `ruestung` wirkt nur gegen Arten mit `ruestung: true`, `ruestung.<art>` aus Modifikatoren gegen genau diese Art, z.B. eine säurefeste Schürze mit `ruestung.saeure`; den Abzug auf das Ausweichen nennt jede Rüstung selbst in ihren Daten (Gegenstände, Punkt 9 der Arbeitsliste)
+ Widerstand R in Punkten aus `widerstaende` und Modifikatoren auf `widerstand` mit der Art als Tag (ohne Tag gegen alles): Schaden × H / (H + R); mit dem Halbwert H 100 halbieren 100 Punkte, 300 Punkte lassen ein Viertel; negative Punkte machen verwundbar, Schaden × (H − 2R) / (H − R), das nähert sich dem Doppelten (−100 Punkte: x1,5); einmal gerundet
+ Immunität als Sonderfall: `immun` am Wesen oder ein Modifikator auf `immunitaet` mit der Art als Tag (Betrag über 0), Schaden genau 0
+ Hinterhalt: Ein Angriff mit Quelle auf ein ahnungsloses Ziel (siehe Wahrnehmung) trifft sicher, wird nicht geblockt und ist kritisch, Meldung `hinterhalt`; mehr Schaden im Hinterhalt geben Modifikatoren mit der Bedingung `gegenueber_ahnungslos`, z.B. auf `kritfaktor` für einen Dolch-Skill
+ Marker als Tags an Angriff oder Effekt: `verfehlt_nie` (kein Trefferwurf), `unblockbar` (kein Blocken; künftige Ersatzwirkungen wie ein Schild, der den Treffer abfängt, sollen ihn ebenso achten), `ignoriert_ruestung`
+ Meldung `schaden` mit `schadensart`, `kritisch`, `kritfaktor` (Prozent, ohne Krit `null`), `ruestungAbzug`, `widerstanden`, `immun` und `trefferchance` (aus dem Trefferwurf davor, im Effektkontext weitergereicht, ohne Trefferwurf `null`); das Log zeigt die Art, eigene Zeilen für Krit, Immunität und Blocken und die Zahlen in der Kampfspalte (siehe Log)

## Fähigkeiten

+ Vorbilder: Tales of Maj'Eyal (aktive Talente mit Kosten und Abklingzeit, aufrechterhaltene mit gebundenem Vorrat), DCSS (Fehlschlag und Folgen eines Zaubers), Caves of Qud (Glimmer: geistige Macht lockt Jäger an)
+ Fähigkeiten sind Daten (`daten/faehigkeiten.js`), umgesetzt in `src/systeme/faehigkeiten.js`; Wesen kennen sie als Liste `faehigkeiten: ["name"]`; im Spielinhalt gibt es bisher die beiden des Testgegners `fernkaempfer_test` (Säurespucke, Säureschwall) und die vorläufige `testfaehigkeit` Ninkasis (Kreis mit Radius 1 auf ein Feld bis 6 weit, 10 MP, Trefferwurf je Wesen, sie selbst bleibt verschont), damit sich der Zielmodus ausprobieren lässt; eigentliche Fähigkeiten für Ninkasi folgen nach dem Systemausbau; wann Gegner sie einsetzen, steht an ihrer KI (siehe KI)
+ Aufbau: `{ text, art?, tags?, verbrauch?, material?, zeit?, abklingzeit?, voraussetzungen?, ziel?, wirkung?, zustand?, risiko?, skill?, anforderung?, ausbau?, dauer?, beimAbbruch?, ankuendigung?, unterbrechbar? }`
  + `art`: `aktiv` (Vorgabe) wirkt einmal; `aufrecht` setzt `zustand` an der Wirkenden, erneutes Benutzen beendet ihn ohne Kosten; den laufenden Preis trägt der Zustand als `unterhalt` (siehe Zustände)
  + `verbrauch: { mp, pp, pegel, ... }` aus den Vorräten, Modifikatoren auf `verbrauch.<wert>` und `verbrauch.alle` mit den Tags der Fähigkeit (`kosten.*` bleibt der Zeit vorbehalten)
  + `material: [{ typ, anzahl }]` aus dem Inventar, wird verbraucht
  + `zeit`: Grundkosten, Vorgabe `aktionen.faehigkeit`; Modifikatoren auf `kosten.faehigkeit` und `kosten.alle` mit den Tags
  + `abklingzeit`: eigene Züge der Wirkenden (Zugzähler, siehe Zeitmodell), Modifikatoren auf `abklingzeit`; am Wesen `abklingendBis: { name: zugnummer }`
  + `voraussetzungen`: Bedingungen aus dem Register `modifikatorbedingungen`, z.B. `pegel_unter` (nüchtern), `pegel_ab`, `skill_ab`, `eigenschaft_ab`
  + `skill: { name, stufe, risiko }`: die Fähigkeit verlangt einen Skill; fehlen Stufen, wird die Tabelle `risiko` über die fehlenden Stufen gewürfelt (Fundstück ohne passenden Skill, Vorbild DCSS)
  + `anforderung: { eigenschaften: { klugheit: 12 }, risiko }`: weiche Anforderung, die Tabelle wird über die Summe der fehlenden Punkte (wirksame Werte) gewürfelt
  + `ausbau: [{ wenn, aendert }]`: Ausbau durch Skills; zutreffende Einträge (Bedingungen an der Wirkenden, meist `skill_ab`) legen `aendert` in Datenreihenfolge flach über die Definition; `faehigkeitFuer(spiel, wesen, name)` liefert die so geltende Definition und wird überall benutzt, wo die Wirkende bekannt ist (Prüfen, Wirken, lange Aktion, Vorschau, KI, Anzeige); `ausbau` und `art` lassen sich nicht ändern
  + `ziel`: Zielart wie in `zielAufloesen` (siehe Zielauswahl); die Wirkung trifft mit `muster` jede betroffene Entität, bei durchdringendem Geschoss jedes Wesen der Bahn, sonst einmal das Ziel oder das Feld; Meldungen `geschoss` bzw. `flaeche`
  + `wirkung`: benannter Effekt mit Ursache `faehigkeit` und Mittel `{ art: "faehigkeit", name }`
  + `dauer: { schritte }`: lange Aktion (Ritual, Kanalisieren), bezahlt wird am Anfang, jeder Schritt kostet `zeit`, Risiko und Wirkung kommen nach dem letzten Schritt; das Ziel wird dann neu aufgelöst, passt es nicht mehr, verpufft die Wirkung (Meldung `verpufft`); `beimAbbruch`: Effekt auf die Wirkende beim Abbruch (siehe Lange Aktionen)
  + Angekündigte Angriffe sind lange Aktionen mit `ankuendigung` (Textschlüssel für das Log) und meist der Zielart `feld`: das Ziel ist das Feld beim Beginn, wer bis zum letzten Schritt das Muster verlässt, weicht aus; die Meldung `aktion_beginnt` nennt `faehigkeit`, `ankuendigung` und die Zielfelder (`felder`), die Anzeige markiert die Felder, solange die Aktion läuft; der erste Schritt läuft sofort, `schritte: 3` lässt dem Ziel also zwei Züge
  + `unterbrechbar`: Liste der Gründe, die die lange Aktion abbrechen, `schaden` und `versetzt`; `true` heißt `["schaden"]` (siehe Lange Aktionen)
+ Befehl `{ art: "faehigkeit", faehigkeit, ziel?: { x, y } | { id } | { dx, dy } }`; Gründe der Ablehnung: `nicht_gelernt`, `abklingend`, `voraussetzung`, `zu_wenig_<wert>`, `material_fehlt` und die der Zielauswahl; Ablauf: Verbrauch und Material bezahlen, Abklingzeit setzen, Meldung `faehigkeit`, Risiko würfeln, wirken
+ Risikotabellen (`daten/risiken.js`): `[{ name, chance, wirkt, effekt? }]`, die Chance jedes Ausgangs ist eine Kurve über x: bei `risiko` der Pegel der Wirkenden, bei `skill.risiko` die fehlenden Stufen, bei `anforderung.risiko` die fehlenden Punkte; gewürfelt wird in der Reihenfolge Skill, Anforderung, Risiko, der erste Ausgang mit `wirkt: false` beendet (Meldung `risiko` mit `wegen`); je Tabelle ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander, sind alle Chancen 0, wird nicht gewürfelt; `wirkt: false` heißt, die Fähigkeit selbst wirkt nicht, der Verbrauch ist in jedem Fall bezahlt; `effekt` trifft die Wirkende (Ursache `risiko`); Meldung `risiko`
+ Vorläufige Tabelle `psi`: Fehlschlag nüchtern 30 %, bei 1,5 ‰ am seltensten (5 %), darüber wieder steigend; Rückschlag ab 3 ‰ bis 20 % bei 8 ‰ (Effekt `psi_rueckschlag`); dass Psi mit dem Pegel stärker wirkt, geht über Modifikatoren mit `pegel_ab` und dem Tag `psi`; dazu `ohne_skill` (1 fehlende Stufe 25 %, 3: 60 %, 5: 85 %) und `anforderung` (1 fehlender Punkt 5 %, 10: 50 %), beide vorläufig
+ Glimmer (Psi lockt Gegner an) wäre ein Wert `glimmer`, den Psi-Fähigkeiten über `wert_aendern` erhöhen; seine Folgen sind Spieldesign ([Grundlagen.md](Grundlagen.md))

## Lange Aktionen

+ Vorbild: die "Delays" in DCSS, mehrschrittige Aktionen mit festen Gründen zur Unterbrechung
+ Rituale, Kanalisieren und später das Brauen laufen in der Logik (`src/systeme/laufendeAktionen.js`), weil sie einen Fortschritt und Folgen beim Abbruch haben; Rasten und Auto-Erkunden sind dagegen Abläufe der Eingabe aus gewöhnlichen Befehlen (siehe Maus, Reise, Rasten und Erkunden)
+ Komponente an der Akteurin: `laufendeAktion: { art, schritteGesamt, schritteErledigt, unterbrochen, lage, unterbrechbar?, ...Daten der Art }`; Arten im Register `laufendeaktionen` mit `schrittkosten`, `abschliessen` und `abbrechen`; mitgeliefert ist `faehigkeit` (Fähigkeiten mit `dauer`)
+ Der startende Befehl führt den ersten Schritt aus; ist die Akteurin wieder dran, führt die Logik den nächsten Schritt selbst aus (Befehl `fortsetzen`, nicht aufgezeichnet, das Nachspielen ergibt ihn wieder); aufgezeichnet wird nur, was die Spielerin eingibt
+ Vor jedem automatischen Schritt Ninkasis laufen die Gefahrenprüfungen aus `regeln.laufendeAktionen.unterbrechen` (Vorgabe `gegner_in_sicht`, `schaden`) gegen die Lage beim letzten Schritt; trifft eine zu, pausiert die Aktion (`unterbrochen`, Meldung `aktion_unterbrochen`) und Ninkasi wird gefragt; die Liste steht in den Regeln, nicht in den Einstellungen, weil sie das Nachspielen bestimmt
+ Befehl `fortsetzen` (Leertaste) macht weiter, jeder andere Befehl bricht ab (Meldung `aktion_abgebrochen` mit Grund `befehl`); bezahlte Kosten bleiben bezahlt, `abbrechen` der Art wirkt (bei Fähigkeiten `beimAbbruch`); Handlungsunfähigkeit bricht ebenfalls ab
+ Gegner mit langer Aktion führen ihre Schritte ohne Gefahrenprüfung aus
+ `unterbrechbar` nennt die Gründe, die die lange Aktion jedes Wesens sofort abbrechen, auch die Ninkasis: `schaden` (Haken `nach_schaden`) und `versetzt` (von einer anderen Urheberin gestoßen, gezogen, getauscht oder teleportiert, siehe Bewegung); bei Fähigkeiten kommt die Liste aus deren Daten, so legt jede Fähigkeit und später jedes Rezept selbst fest, wie störanfällig es ist

## Skills und Lernen

+ Spieldesign in [Charakter.md](Charakter.md); Code in `src/systeme/skills.js` (Eigenschaften, Stufen, Quellen, Bedingungen, Befehl, Bausteine) und `src/systeme/lernen.js` (EP, Lernanlässe, Beitragsbuch, Verteilung, Topf); Regelwerte in `regeln.lernen` (`daten/regeln.js`), alle Zahlen vorläufig
+ Eigenschaften (`daten/eigenschaften.js`): Körperlichkeit, Trinkfestigkeit, Gewandtheit, Sinnlichkeit, Klugheit, Braukunde; Grundwerte an Ninkasi als `eigenschaften: { koerperlichkeit: 14, ... }`, vorläufig 14, 14, 13, 13, 13, 13 bis zur Charaktererstellung; vorübergehende Änderungen sind Modifikatoren auf `eigenschaft.<name>` (`eigenschaftWirksam`); das Lerntempo rechnet mit dem Grundwert, Anforderungen und Bedingungen mit dem wirksamen Wert
+ Startoption: `neuesSpiel(daten, startwert, { eigenschaften })` ersetzt die Vorgabe, geprüft gegen `eigenschaftStart` (10), `eigenschaftPunkte` (20) und `eigenschaftHoechstens` (20); die Optionen gehören zum Spielstand
+ Baustein `eigenschaft_aendern { eigenschaft, wuerfel|menge }` ändert den Grundwert dauerhaft (mindestens 1, nach oben offen), Meldung `eigenschaft_geaendert`
+ Skills (`daten/skills.js`): `{ text, set, tier, rang?, primaer, sekundaer, voraussetzungen?, freischaltung?, jeStufe?, abStufe?, lernt?, verwandt? }`; Tier 1 bis 4 (Grund, Experte, Meister, göttlich), je Set jeder Tier einmal; `rang` ohne Angabe aus `raengeNachTier` (1, 2, 4, 8); im Spielinhalt vorläufig Zähigkeit (Grund und Expertin, LP), Nahkampf (Genauigkeit mit Tag `nahkampf`) und Ausweichen, der Katalog folgt in einer eigenen Sitzung
+ Lernstand an Ninkasi: `skills: { name: { lernpunkte, rest } }`, `freieEp`, `freigeschaltet: [name]`, angelegt von `lernenEinrichten` beim Spielbeginn; ohne diese Komponenten (Unittests mit eigener Ninkasi) bleibt das Lernen still
+ Umrechnung beim Eingang: Lernpunkte = EP x (2 x primär + sekundär) / `bezugswert` (40), ganzzahlig mit `rest`; Stufen 1 bis 5 bei den aufsummierten Schwellen aus `stufen` (50, 100, 200, 350, 550) x Rang; Stufen gehen nie verloren
+ Voraussetzungen: die der Tiers aus `tierVoraussetzungen` im selben Set (Experte: Grund 3; Meister: 4, 3; göttlich: 5, 4, 3) und die eigenen `voraussetzungen: [{ skill, stufe }]`; die Datenprüfung verbietet Kreise; ein gesperrter, nicht freigeschalteter oder vollendeter Skill nimmt keine EP auf, auch keine gebundenen
+ `freischaltung: true`: lernbar erst nach dem Baustein `skill_freischalten { skill }` (Braubücher, Rezepturen), Meldung `skill_freigeschaltet`
+ Wirkung über die Modifikatorquelle `skills`: `jeStufe` (nur `plus` und `prozent`) wächst mit der Stufe, ein Prozent wird bei `verrechnung: "multiplizieren"` zu einem `mal` (100 + Prozent x Stufe), bei `"addieren"` bleibt es `prozent`; `abStufe: { 3: { modifikatoren?, ausloeser? } }` gilt ab der Stufe unverändert; Auslöser der Skills über das Register `ausloeserquellen` (siehe Auslöser)
+ Befehl `lernen { skill, ep }` ohne Zeitkosten verteilt freie EP; Ablehnungen `ungueltig`, `unbekannter_skill`, `nicht_freigeschaltet`, `skill_voraussetzung`, `hoechststufe`, `zu_wenig_ep`; mehr EP als bis Stufe 5 nötig werden nicht abgebucht; Meldungen `gelernt`, `skillstufe`; `regeln.lernen.ort` hält eine spätere Ortsbindung offen (nur `jederzeit` umgesetzt)
+ Freie EP: Startguthaben `startEp` (300), dazu `epJeFeld` (1) je Feld, das Ninkasi zum ersten Mal sieht (`sichtfeldAktualisieren`); ein später magisch kartiertes Feld bekommt einen eigenen Wert in `erkundet` und bringt erst beim Sehen EP
+ Gebundene EP: Wesen mit `ep` in den Daten (vorläufig Essigbakterium 10, `fernkaempfer_test` 15) führen ein Beitragsbuch `beitraege: [{ anlass, tags }]`, je Anlass und Tags ein Eintrag (Gewichtung `erste`); Lernanlässe im Register `lernanlaesse`:
  + `wirkung`: Ninkasi ist Urheberin eines Treffers, eines Schadens (mit der Schadensart als Tag) oder eines Zustands (dessen Tags) am Wesen; Tags von Angriff, Fähigkeit und Effekt; wirkt eine Beschworene Ninkasis, zählt es für Ninkasi mit dem Tag `beschworen`
  + `ausgewichen`, `geblockt`: das Wesen verfehlt Ninkasi
  + `ruestung`: Ninkasis Rüstung fängt Schaden des Wesens ab (Haken `vor_schaden` nach dem Rang der Rüstung)
  + `schaden_erlitten`: das Wesen fügt Ninkasi Schaden zu
+ Verteilung beim Tod (Haken `nach_tod`), gleich wer tötet, sobald das Buch einen Eintrag hat: die EP zu gleichen Teilen je Bucheintrag, je Eintrag zu gleichen Teilen auf die Skills, deren `lernt: [{ anlass, tags? }]` passt (gleicher Anlass, Tags des Skills im Eintrag enthalten); `verwandt: [{ skill, anteil }]` gibt zusätzlich Anteile an verwandte Skills (Querlernen); Rundungsreste, Einträge ohne passenden Skill und was ein Skill nicht aufnimmt, werden freie EP; Meldung `ep_erhalten { wer, opfer, ep, skills: [{ skill, ep }], frei }`
+ Topf je Abstammungslinie: `beschwoeren` mit `abstammung: true` (Zellteilung) gibt dem neuen Wesen die `topfId` der Quelle; hat sie keine, eröffnet sie einen Topf mit ep x `topfFaktor` (3) in `zustand.toepfe`; wer zu einem Topf gehört, bringt höchstens den Rest darin; im Spielinhalt teilt sich bisher nichts
+ Anforderungen an Ausrüstung: `ausruestung.anforderung: { koerperlichkeit: 15 }`, wahlweise `abzugJePunkt` (sonst `regeln.lernen.anforderungAbzug`: Genauigkeit und Schaden je -5 %); je fehlendem Punkt (wirksamer Wert) gilt der Abzug einmal, für die Trägerin insgesamt (Quelle `anforderungen`), ein Prozentabzug sinkt nicht unter -100; feiner über Tags der Angriffsprofile später
+ Anzeige: das Log zeigt nur, was Ninkasi lernt (`skillstufe`, `gelernt`, `skill_freigeschaltet`, `ep_erhalten`, `eigenschaft_geaendert`); Skillfenster und Charaktererstellung seit 0.27.0 (siehe Fenster)
+ Der Bot gibt zufällige Lernbefehle, verteilt jede zweite Partie die Eigenschaften neu, prüft den Lernstand (ganzzahlig, höchstens Stufe 5, keine freien EP verloren, jede Verteilung geht auf) und gibt das EP-Budget je Tiefe aus (Erkundung, gebunden, frei aus Beute)

## Effektsystem

+ Zwei Schichten, wie Lego: Der Code liefert die Steine, die Daten bauen daraus
+ Grundbausteine sind Code: wenige Dutzend kleine, stabile Funktionen, z.B. Schaden, Heilen, Pegel ändern, Zustand setzen, Beschwören, Versetzen, Fraktion ändern, Feld verändern
+ Zusammengesetzte Effekte sind Daten, benannt und wiederverwendbar, z.B. "Feuerbier-Explosion": Fläche 3x3, Feuerschaden 2W6, Zustand "brennend" für 300 Einheiten
+ Ein neuer Grundbaustein ist nur für eine wirklich neue Mechanik nötig
+ Benannte Verhaltensmodule (Code) für alles, was sich nicht aus Bausteinen zusammensetzen lässt: KI-Muster wie Zweiteilung, Sprossung, Myzelwachstum, Phagen-Befall, Bossphasen; die Daten verweisen nur darauf, z.B. `ki: "sprossung"` mit Parametern
+ Grundbausteine, Verhaltensmodule und Zielmuster werden in Registern angemeldet; auch Mods können dort eigene anmelden
+ Erweiterbar ist grundsätzlich alles über Register (`src/kern/register.js`): Befehlsarten, Grundbausteine, Verhaltensmodule, Modifikatorquellen, Befehlsveränderer, Zielmuster, Handler der Weltuhr, Zeitereignisse, interne Haken, Gefahrenprüfungen, Zustandsprüfungen, Arten langer Aktionen und Handler beim Erzeugen von Entitäten; Systeme und Verhaltensmodule melden sich beim Import an, die Reihenfolge der Anmeldung ist fest; `abmelden` entfernt einen Eintrag wieder (Tests, Mods)
+ Kontext eines Effekts: `{ quelleId, urheberId, urheberFraktion, zielId, ursprung, zielfeld, ursache, kettentiefe, mittel, tags, kritisch, werte }` (`src/kern/effekte.js`); die Quelle wirkt unmittelbar (Wesen, Fass, Geschoss, Falle), der Urheberin wird die Wirkung zugerechnet (EP, Zorn, Todesursache), Vorgabe ist die Quelle, bei Beschworenen deren Beschwörerin (`beschworenVon`); ihre Fraktion bleibt erhalten, auch wenn sie schon entfernt ist
+ `ursprung` ist das Feld, von dem Muster ausgehen (Vorgabe Position der Quelle), `zielfeld` das anvisierte Feld (Vorgabe Position des Ziels); `zielId` kann null sein, dann wirkt der Effekt auf ein Feld
+ `mittel`: `{ art: "angriff" | "faehigkeit" | "gegenstand" | "zustand" | "falle" | "gelaende", name }`; `tags` z.B. `["feuer", "magie"]` für Modifikatoren und gebundene EP, die Tags eines Effekts (`tags` in den Daten) kommen dazu
+ `werte` ist eine Ablage zwischen Schritten, über alle Verschachtelungen eines Effekts geteilt: `schaden` zählt den tatsächlichen Verlust in `summeSchaden`, `fuer_jedes_ziel` schreibt `anzahlZiele`, `springen` schreibt `getroffeneIds` und `sprungnummer`
+ `kritisch` setzt ein kritischer Trefferwurf, verschachtelte Effekte erben es (siehe Kampfwerte)
+ Mengen der Bausteine `schaden` (mit Pflichtfeld `art`), `heilen`, `wert_aendern`: `wuerfel`, feste `menge` oder `menge: { aus: "summeSchaden", prozent: 50 }` aus der Ablage (Lebensraub); mit `auf: "quelle"` wirkt ein Schritt auf die Quelle statt auf das Ziel (Vampirbiss: Schaden am Ziel, Heilung an der Angreiferin); dazu `teilen: "anzahlZiele"` (verteilter Schaden) und `prozentJeSprung` (Abschwächung je Sprung einer Kette)
+ Bausteine erklären, ob sie ein Wesen brauchen (`brauchtZiel`); ein Schritt ohne Ziel wird übersprungen, der Effekt läuft weiter
+ Bausteine beschreiben ihre Parameter für die Datenprüfung: `text`, `ganzzahl`, `wahrheitswert`, `effekt`, `muster`, mit `?` freiwillig, eine Liste nennt die erlaubten Werte; benannte Effekte dürfen sich nicht im Kreis aufrufen
+ Eine Befehlsart besteht aus `pruefen` (Grund der Ablehnung oder nichts) und `ausfuehren` (gibt die Aktionsart für die Zeitkosten zurück, oder `{ aktion, grundkosten?, umstaende? }`, wenn die Grundkosten abweichen, z.B. beim Nahkampf aus den Angriffsprofilen, oder Tags für die Modifikatoren der Zeit mitkommen, z.B. bei Fähigkeiten); Gegner benutzen dieselben Befehlsarten, ihre Befehle werden aber nicht aufgezeichnet
+ Vor dem Ausführen läuft jeder Befehl, von Ninkasi wie von der KI, durch den Haken `vor_befehl`; Zustände verändern ihn dort (Torkeln, Verwirrung), ein abgebrochener oder ungültig gewordener Befehl wird zu warten; aufgezeichnet wird der ursprüngliche Befehl
+ `bewegen` greift durch Hineinlaufen Feinde an, mit `angreifen: true` jedes Wesen (gezielter Angriff, Rausch, Verwirrung); Bewegungsarten, Verschieben und Werfen siehe Bewegung
+ Baustein `angreifen { profil? }` (`src/systeme/kampf.js`): die Quelle greift das Ziel mit ihren Angriffsprofilen an wie bei einer Angriffsaktion, ohne Zeitkosten, mit `profil` nur dieses eine; nur gegen ein Ziel daneben; für Konter aus Auslösern, z.B. `{ bei: "verfehlt", rolle: "ziel", ziel: "quelle", effekt: "konter" }`; die Angriffe laufen auf der Kettentiefe des Effekts, gegenseitige Konter enden so an der Kettengrenze

## Inhalte als Daten

+ Alle Inhalte liegen als JavaScript-Dateien vor, die nur Daten enthalten (`export default { ... }`), mit Kommentaren
+ Dazu gehören Charakter, Eigenschaften, Makel, Skills, Fähigkeiten, Gegner, Verbündete, Händler, Items, Getränke, Zutaten, Rezepte, Kessel, Effekte, Zustände, Tiles, Levelparameter
+ Vorlagen mit Vererbung: z.B. "Bakterium", davon abgeleitet "Essigbakterium" mit Abweichungen
+ Beim Laden werden alle Daten geprüft (Pflichtfelder, Typen, Verweise auf existierende Effekte, Verhaltensmodule, Texte); Fehler erscheinen beim Start mit klarer Meldung
+ Texte stehen nicht in den Daten, sondern als Schlüssel; siehe [Texte.md](Texte.md)

## Ereignisse

+ Interne Haken in der Logik dürfen eingreifen, z.B. "vor Schaden": Rüstung senkt den Wert, ein Schild fängt den Treffer ab; hier hängen Auslöser-Effekte und Zustände an
+ Nur Haken aus dem Katalog `src/kern/hakenkatalog.js` lassen sich anmelden und auslösen, Tippfehler fallen sofort auf; Mods ergänzen den Katalog
+ Der Katalog nennt je Haken, ob die Logik ihn schon auslöst (`inBetrieb`) und ob Auslöser aus Daten daran hängen dürfen (`ausloeserErlaubt`, nur bei Haken "danach")
+ In Betrieb: `vor_schaden` (Schadensart und Menge, Menge ändern oder abbrechen; Ränge der Schadensrechnung siehe Kampfwerte), `nach_schaden` (bei Schaden über 0), `nach_treffer` (mit `kritisch`), `verfehlt` (mit `grund`), `vor_tod`, `nach_tod`, `nach_wertaenderung`, `zustand_beginnt`, `zustand_endet`, `vor_befehl` (Befehl ersetzen oder abbrechen), `vor_angriff` (einzelnen Angriff abbrechen), `verlaesst_feld` und `betritt_feld` (siehe Bewegung)
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

## Tod und Zustandsprüfung

+ Vorbild sind die "state-based actions" von Magic: The Gathering: Getötet wird nicht mitten in einer Wirkung, sondern an festen Punkten
+ Ein Vorgang ist ein ausgeführter Befehl, ein Handler der Weltuhr oder ein Zeitereignis; danach läuft `vorgangAbschliessen` (`src/kern/vorgang.js`): abwechselnd alle Zustandsprüfungen und der nächste vorgemerkte Auslöser, bis nichts mehr ansteht
+ Zustandsprüfungen sind ein Register (`zustandspruefungen`), die erste ist der Tod (`src/systeme/tod.js`), dann die Lage (siehe Bewegung), dann kaputte Gegenstände (siehe Verschleiß); später z.B. der Filmriss
+ Geprüft wird nur, was vorgemerkt ist (siehe Leistung): beim Tod Entitäten, bei denen ein Wert über `wertAendern` auf 0 gefallen ist, bei der Lage versetzte Wesen und solche mit geänderten Zuständen, bei kaputt Gegenstände, deren Haltbarkeit auf 0 gefallen ist; im Spiel läuft jede Änderung eines Werts über `wertAendern`, auch in Tests
+ Folge: Eine Flächenwirkung trifft alle Ziele, auch wenn das erste schon tot ist; mehrere Tode im selben Vorgang laufen nach Entitäts-ID
+ Es stirbt, wessen Lebenswert bei 0 liegt; der Lebenswert ist ein Datenfeld (`lebenswert`, Vorgabe `lp`), z.B. der Zusammenhalt eines Biofilms
+ Ablauf je Wesen: Haken `vor_tod` (Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt, sonst stirbt es trotzdem), Meldung `tod` mit Urheberin, Ursache und Mittel aus `letzterVerlust`, Haken `nach_tod` mit der letzten Position, Hinterlassenschaft, Entfernen
+ Hinterlassenschaft nach Daten: `beimTod: { inventar: "fallen_lassen" }` (Vorgabe, aufs Feld des Wesens) oder `"vernichten"`
+ Entfernen nimmt den Akteur, gebundene Zeitereignisse und alles Getragene mit; Getragenes verschwindet aus dem Inventar der Trägerin
+ Stirbt Ninkasi, ist das Spiel vorbei; sie bleibt im Zustand (Anzeige, später Todesbericht), noch vorgemerkte Auslöser verfallen
+ Ursachen bisher: `nahkampf`, `trinken`, `ausloeser`, `zustand`, `schwund.<wert>` (Stoffwechsel)

## Auslöser

+ Auslöser sind Daten an einer Entität: `ausloeser: [{ bei, rolle?, ziel?, effekt, chance?, daempfung?, wenn? }]`, z.B. Dornen `{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }`
+ `wenn`: Bedingungen wie an Modifikatoren, geprüft an der Trägerin beim Ausführen und vor dem Wurf, Gegenüber ist die andere Partei des Ereignisses; Bossphase: `{ bei: "nach_schaden", rolle: "ziel", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }, { bedingung: "ohne_zustand", zustand: "raserei" }], effekt: "raserei_setzen" }` beginnt genau einmal
+ `bei`: Haken aus dem Katalog mit `ausloeserErlaubt` und `inBetrieb`; `rolle`: Rolle der Trägerin im Ereignis (`quelle` oder `ziel`, ohne Angabe jede); `ziel`: worauf der Effekt wirkt (`selbst` als Vorgabe, `quelle`, `ziel` oder `feld`: die Position im Ereignis, bei `nach_tod` die letzte Position des Opfers, sonst die der Trägerin; der Effekt läuft dann ohne Wesen als Ziel mit Ursprung und Zielfeld dort, z.B. Sporen im Kreis); `chance` in Prozent, Vorgabe 100
+ Haken und Auslöser sind getrennt: Haken sind Code, wirken sofort und dürfen den Kontext ändern; Auslöser merkt ein Verteiler (Rang 1000, nach allen Code-Handlern) nur vor, abgearbeitet werden sie nach dem laufenden Schritt nacheinander in der Reihenfolge des Vormerkens (`src/kern/ausloeser.js`); kein Auslöser greift so mitten in eine Schadensrechnung ein
+ Die Warteschlange der Auslöser liegt im Spiel, nicht im Zustand; sie ist nach jedem Vorgang leer
+ Gefragt werden die beteiligten Entitäten, zuerst die Quelle, dann das Ziel; je Entität zuerst ihre eigenen Auslöser, dann die ihrer Zustände (z.B. Dornenhaut), dann die ihrer angelegten Gegenstände (Kaskade nach Caves of Qud, z.B. Dornenpanzer), dann die weiterer Quellen aus dem Register `ausloeserquellen` (`(spiel, entitaet) => [{ ausloeser, schluessel }]`), bisher die der Skills (`abStufe`, siehe Skills und Lernen)
+ Ketten: Befehle und Welt wirken auf Kettenstufe 0, der Effekt eines Auslösers eine Stufe tiefer als sein Ereignis; die Chance sinkt je Stufe auf `daempfung` Prozent (einheitlich gerundet: 100, 50, 25, 13, 7 ...), ab der höchsten Kettentiefe wird nichts mehr vorgemerkt
+ Regelwerte in `daten/regeln.js`: `daempfungProStufe` 50, `hoechsteKettentiefe` 5; `daempfung` am Auslöser überschreibt die Regel (100 heißt ungedämpft)
+ Sichere Chancen (0 und 100) würfeln nicht, damit die Zahlenfolge des Zufalls ungestört bleibt
+ Kettenreaktionen der Welt (Feuer greift auf Gas über, Fässer explodieren nacheinander) laufen nicht über Auslöser, sondern über die Zeit (Weltuhr, Zeitereignisse); sie sind von der Kettengrenze nicht betroffen und für die Spielerin sichtbar
+ Ersatzwirkungen aus Daten ("Phönixbier verhindert einmal den Tod") sind ein eigener Typ, da sie sofort wirken müssen; Entwurf in [Systemausbau.md](Systemausbau.md)

## Zustände

+ Zustände sind Daten (`daten/zustaende.js`, mit Vorlagen), umgesetzt in `src/systeme/zustaende.js`: `{ text, tags, dauer, stapel, hoechstStapel, verlauf, modifikatoren, auren, jeTick, beimBeginn, beimEnde, ausloeser, gebundenAnQuelle }`
+ An der Entität als Liste von Instanzen: `zustaende: [{ nummer, name, quelleId, urheberId, urheberFraktion, beginn, ende, staerke, stapel }]`; die Nummer zählt der Zustand des Spiels hoch
+ `dauer` in Zeiteinheiten, ohne Angabe unbegrenzt bis zum Entfernen; `staerke` Vorgabe 1
+ Takt ist die Weltuhr: je Welttick wirkt `jeTick`, solange das Ende nicht erreicht ist; Hast und Verlangsamung der Trägerin ändern daran nichts (Vorbild DCSS: Hast hilft, Verlangsamung schadet)
+ Ende über das Zeitereignis `zustand_ende`, gebunden an die Trägerin; wurde der Zustand inzwischen verlängert, reiht es sich zum neuen Ende wieder ein
+ Stapelregel je Zustand, Vorgabe `erneuern` (eine Instanz, höhere Stärke, längere Dauer); `aufaddieren` (Stärken addiert bis `hoechstStapel` Anwendungen, Dauer erneuert), `staerkster` (nur eine mindestens gleich starke Anwendung ersetzt, sonst nichts), `einzeln` (eigene Instanzen mit eigenem Ende, höchstens `hoechstStapel`); verschiedene Zustände bestehen immer nebeneinander
+ Verlauf `gleichbleibend` (Vorgabe), `abklingend`, `ansteigend` oder eine eigene Kurve `[[anteilProzent, staerkeProzent], ...]` über den Anteil der verstrichenen Dauer; wird die Dauer verlängert, beginnt der Verlauf neu
+ Modifikatoren gelten je Stärke 1 und skalieren mit Stärke und Verlauf zur Zeit der Abfrage (`modifikatorSkaliert`): `plus` und `prozent` im Betrag, `mal` im Anteil über 100 (`mal 150` bei Stärke 50 % wird `mal 125`), Grenzen gar nicht; die Modifikatorquelle `zustaende` liefert sie mit der Quelle `zustand:<nummer>`, endet der Zustand, entfallen sie ohne Nachführen
+ `jeTick`, `beimBeginn`, `beimEnde` wirken auf die Trägerin mit Ursprung an ihrer Position, zugerechnet der Urheberin, Ursache `zustand`, Mittel `{ art: "zustand", name }`, Tags des Zustands; Mengen mit `mitStaerke: true` skalieren mit der Stärke (`werte.staerkeProzent`, 100 = Stärke 1)
+ Bausteine `zustand_setzen { zustand, dauer?, staerke? }` und `zustand_entfernen { zustand? , tag? }` auf das Ziel
+ Haken `zustand_beginnt` und `zustand_endet` (mit `grund`: `abgelaufen`, `entfernt`, `quelle_tot`, `unterhalt`), Meldungen gleichen Namens
+ `unterhalt: { mp: 2 }` kostet die Trägerin je Welttick, vor `jeTick`; Modifikatoren auf `unterhalt.<wert>` mit den Tags des Zustands; reicht ein Vorrat nicht, endet der Zustand mit dem Grund `unterhalt` (aufrechterhaltene Zauber)
+ `gebundenAnQuelle: true`: der Zustand endet mit dem Tod oder Verschwinden der Quelle (aufrechterhaltener Zauber, Beschworene)
+ `handlungsunfaehig: true` (Betäubung, Lähmung, Filmriss): die Trägerin muss warten; bei Ninkasi wird jede Eingabe angenommen, aufgezeichnet, mit der Meldung `handlungsunfaehig` ("Leider nicht möglich") beantwortet und als warten ausgeführt, je Eingabe vergeht eine Aktion; eine Reise hält an
+ `befehl: { veraenderer, ...parameter }` verändert jeden Befehl der Trägerin über das Register `befehlsveraenderer` (`src/systeme/befehlsveraenderer.js`); mitgeliefert sind `ziel_verfehlen { chance }` für Verwirrung beim Befehl `faehigkeit` (das Ziel rutscht auf ein anderes Wesen daneben, ein Feld auf ein Nachbarfeld, eine Richtung um 45°, nur auf Ziele, die der Befehl zulässt) und `abweichen { chance, freundeAngreifen? }` für Torkeln und Verwirrung: ein Schritt geht mit der Chance, skaliert mit der Stärke, auf ein zufälliges anderes freies Nachbarfeld (im Gang also zurück), gibt es keins, wie gewollt; ein Feind dort wird angegriffen, ein Verbündeter nur mit `freundeAngreifen`, sonst zählt sein Feld nicht als frei
+ `ki: { modul, ...parameter }` überlagert die KI (Furcht mit `fliehen`, Rausch mit `jagen` und `trifft: "wesen"`); bei Ninkasi übernimmt die KI für die Dauer, das Spiel wartet dann nicht auf Eingaben
+ `fraktion` überlagert die Fraktion: `"urheber"` (Psi-Kontrolle), `"eigene"` (Zwietracht, mit allen verfeindet) oder ein Fraktionsname
+ Fraktion und KI werden beim Beginn in die Instanz geschrieben; `fraktionVon` und `kiVon` (`src/kern/zustand.js`) liefern die des jüngsten überlagernden Zustands, sonst die eigene; nach dem Ende gilt von selbst wieder der ursprüngliche Stand, die eigene KI behält ihr Gedächtnis
+ Beschwören und Verschwinden (`src/systeme/beschwoerung.js`): `beschwoeren { wesen, anzahl?, muster?, zustand?, dauer?, abstammung? }` erzeugt Wesen auf freien Feldern des Musters (Vorgabe angrenzend), mit der Fraktion der Urheberin und `beschworenVon`, eingereiht nach einer Aktion Wartezeit, mit dem Zustand (Quelle die Beschwörerin); `abstammung: true` teilt den EP-Topf der Quelle (siehe Skills und Lernen); `verschwinden` entfernt das Ziel ohne Tod, ohne `nach_tod` und ohne Hinterlassenschaft, nicht bei Ninkasi
+ Beispiel ganz als Daten: `beschworen: { gebundenAnQuelle: true, beimEnde: "verschwinden" }`, mit `dauer` auch eine Beschwörung auf Zeit (Vorbild Brogue: Geisterklingen verschwinden mit dem Goblin-Beschwörer)
+ Die Datenprüfung verfolgt Kreise auch über Zustände: ein Effekt, der einen Zustand setzt, dessen `beimBeginn` ihn wieder aufruft, ist ein Fehler
+ Im Spielinhalt bisher nur der vorläufige `testzustand` (Ausweichen -2 für 5 Züge), den Ninkasis `testfaehigkeit` bei einem Treffer setzt, damit die Anzeige der Zustände etwas zeigt

## Zielauswahl

+ Vorbilder: Dungeon Crawl Stone Soup (Zielarten smite, bolt, beam, cone, explosion; Vorschau getrennt von der Wirkung), Tales of Maj'Eyal (Ziel als Tabelle mit Radius, Eigen- und Freundbeschuss als Datenfeld), Red Blob Games (Linien auf Gittern, Symmetrie, diagonale Wandecken)
+ Geometrie (`src/welt/geometrie.js`), rein und ganzzahlig, ohne Winkelfunktionen: `linie` symmetrisch (gerechnet vom kleineren Endpunkt aus), `sichtlinieFrei` (kein undurchsichtiges Feld zwischen den Endpunkten), `flugbahn` (bis zum Ziel oder mit `ueberZielHinaus` bis zur Reichweite, endet an Feldern, die Geschosse nicht durchlassen (`geschossdurchlaessig`, siehe Gelände), oder am ersten Wesen, außer `durchdringend`; Wesen, für die `ueberspringen(wesen)` wahr ist, werden überflogen), `kreis`, `kegel`
+ Diagonale Wandecken großzügig: ein Diagonalschritt ist frei, wenn eine der beiden Seiten frei ist
+ Kreis: ein Feld gehört dazu, wenn `dx² + dy² <= r·(r+1)`; Radius 1 ist das volle 3x3, Radius 2 ein 5x5 ohne Ecken; Reichweiten werden ebenso gemessen
+ Kegel: Öffnung in Grad (30, 45, 60, 90 als Vorgabe, 120), geprüft über Skalar- und Kreuzprodukt mit einer Tabelle des Tangens in Tausendsteln; in allen acht Richtungen gespiegelt gleich
+ Zielmuster sind Daten mit einem Muster aus dem Register `zielmuster`, Signatur `(spiel, auswahl, parameter) => [{x, y}]` mit `auswahl = { ursprung, zielpunkt, quelleId }` (`src/systeme/zielauswahl.js`)
+ Mitgeliefert: `selbst` (Ursprung), `feld` (Zielpunkt), `angrenzend`, `linie` (`laenge`), `strahl` (bis zum Hindernis, `laenge` freiwillig), `kreis` (`radius`), `kegel` (`laenge`, `oeffnung`); Linie und Strahl laufen vom Ursprung in Richtung Zielpunkt und enden an undurchsichtigen Feldern
+ Kreis, Kegel und angrenzend nur mit Sichtlinie vom Ursprung (keine Explosion um die Ecke), abschaltbar mit `durchWaende: true`; dichter Rauch hält die Sichtlinie auf (siehe Feldschichten), also auch solche Muster
+ Feste Reihenfolge der Felder: nach Abstand zum Ursprung (`dx² + dy²`), dann nach Feldindex; je Feld die Entitäten nach ID
+ Wer getroffen wird, sagt `trifft` aus Sicht der Urheberin: `alle` (auch Gegenstände, Vorgabe), `wesen`, `feinde`, `verbuendete` (nach der Beziehung der Fraktionen, Neutrale sind keins von beiden, siehe Fraktionen); `ohneUrheber: true` nimmt die Urheberin aus; Eigenbeschuss ist also möglich, solange die Daten nichts anderes sagen
+ Zielarten: `selbst`, `wesen` (per ID), `feld` (smite), `richtung` (`dx`, `dy`), `geschoss`; dazu `reichweite`, `brauchtSichtlinie` (Vorgabe ja), `muster`, `trifft`, `ohneUrheber`, `durchdringend`, `ueberZielHinaus`, `ueberVerbuendete` (das Geschoss fliegt über Verbündete der Akteurin hinweg)
+ Ursprung und Zielpunkt je Zielart: bei `selbst` die Akteurin, bei `wesen` und `feld` das Ziel selbst, bei `richtung` die Akteurin und das Feld daneben, bei `geschoss` der Aufschlag; Format der Zielangabe `{ x, y }`, `{ id }` oder `{ dx, dy }`
+ `zielAufloesen(spiel, akteur, zielart, zielangabe)` gibt Ursprung, Zielpunkt, Ziel, Bahn, Felder und Betroffene zurück oder den Grund der Ablehnung (`ungueltig`, `kein_ziel`, `nicht_sichtbar`, `zu_weit`, `keine_sichtlinie`); ändert nichts, würfelt nicht und ist zugleich Vorschau für Zielmodus, Tooltip und KI; für Ninkasi zählen nur Felder, die sie sieht
+ Gesehen, aber nicht zu treffen: eine symmetrische Linie für Sicht und Wurf, der Schattenwurf des Sichtfelds kann davon abweichen; nach dem Anspielen prüfen, ob Ersatzlinien (Brogue, DCSS) oder symmetrischer Schattenwurf nötig sind
+ Bausteine mit Zielauswahl (`src/systeme/zielbausteine.js`), der innere Effekt teilt die Ablage:
  + `fuer_jedes_ziel`: `{ muster, effekt, trifft, ohneUrheber }` auf jede getroffene Entität im Muster
  + `auf_feld`: `{ muster, effekt }` auf jedes Feld, auch leere (Ziel null); Grundlage für Feldschichten
  + `geschoss`: `{ reichweite, effekt, durchdringend, ueberZielHinaus, ueberVerbuendete }` vom Ursprung zum Zielfeld, der Effekt wirkt am ersten Wesen oder am Aufschlag, dort liegen dann Ursprung und Zielfeld (z.B. Explosion mit `fuer_jedes_ziel`); durchdringend auf jedes Wesen der Bahn
  + `springen` (Kettenblitz): `{ anzahl, reichweite, effekt, trifft, ohneUrheber, wahl }` wirkt auf das Ziel und springt bis zu `anzahl` Mal zum nächsten noch nicht getroffenen lebenden Wesen im Kreis mit Sichtlinie (`wahl`: `naechstes` als Vorgabe oder `zufaellig`), `trifft` hier Vorgabe `wesen`; auch für springende Krankheit oder übergreifende Psi-Kontrolle
+ Nahkampf mit Muster: `muster` am Angriffsprofil vom Angreifer in Richtung des Ziels, z.B. Rundumschlag `{ art: "angrenzend" }`, Speer `{ art: "linie", laenge: 2 }`; jedes getroffene Wesen bekommt einen eigenen Trefferwurf (siehe Kampfwerte), `trifft` am Profil Vorgabe `wesen`, der Angreifer nie selbst

## Zufall und Wiederholbarkeit

+ Spielstand = Spielversion + Prüfsumme der Daten + Startwert + Startoptionen (bisher die Eigenschaften aus der Charaktererstellung) + Liste aller Befehle (JSON); Laden heißt Nachspielen ohne Anzeige
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

+ Seit 0.29.0 speichert der Browser den laufenden Lauf von selbst (`src/eingabe/speicherstand.js` ohne DOM, `localStorage` unter `battle-ninkasi.lauf` in `src/main.js`), gesammelt höchstens alle 300 ms nach einem Befehl und sofort beim Verlassen der Seite (`pagehide`); nicht während der Charaktererstellung
+ Speicherstand: `{ version, startwert, optionen, befehle, zustand, oberflaeche: { leisten, log } }`; der Spielstand (Startwert, Startoptionen, Befehle) bleibt die verbindliche Aufzeichnung, der Schnappschuss des Zustands (`schnappschuss` in `src/kern/spiel.js`, eine Kopie des reinen JSON) lädt ohne Nachspielen (`ausSchnappschuss`); Index und Zwischenspeicher entstehen aus dem Zustand neu, die vorgemerkten Auslöser sind zwischen zwei Befehlen leer
+ Gemessen: 2152 Befehle sind 62 kB, Nachspielen dauert knapp 1 s; ein Zustand sind etwa 40 kB, das Umwandeln unter 1 ms; deshalb lädt der Schnappschuss und nicht die Befehlsliste
+ Der Teil `oberflaeche` liest die Logik nie: Stand der Schnellleiste und die letzten 200 Logzeilen (`zeilenEinsetzen` in `src/anzeige/log.js`)
+ Laden beim Start der Seite: ein gespeicherter Lauf geht vor (`?seed=` gilt nur ohne ihn oder mit `&neu`), die Charaktererstellung entfällt, das Log nennt das Fortsetzen; passt die Version nicht, ist der Text kaputt oder lässt sich der Zustand nicht einsetzen, wird der Stand verworfen, ein neuer Lauf beginnt und das Log nennt den Grund (`log.stand_verworfen.<grund>`)
+ Tod und "Neuer Lauf" löschen den Stand
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

## Anzeige

+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Bezugsgröße 1920x1080, bevorzugt im Vollbild; Vollbild erst nach einer Nutzeraktion (Browser-Regel)
+ Ganzzahlige Skalierung, damit Pixelart scharf bleibt: 1080p 1:1, 4K doppelt, dazwischen 1:1 mit Rand
+ Pixelart in vier Sätzen: 16, 32, 48 und 64 px
+ Gezeichnet wird nur der größte Satz (64 px); die kleineren leitet `werkzeuge/tiles-ableiten.js` daraus ab (Flächenmittel, Vorrang für Signalfarben, Fugenregel für Gelände, Palette, Umriss neu) und warnt bei Verdacht auf verlorene Details; nachgearbeitet wird nur bei Warnungen oder sichtbaren Mängeln; so haben alle Sätze dieselben Formen
+ Keine Zeichen als Platzhalter: Jede neue Entität kommt direkt als Tile ins Spiel, gezeichnet in 64 px, die kleineren Sätze abgeleitet; das Zeichen bleibt nur Absicherung, falls ein Tile fehlt
+ Ein Tileset ist eine Datendatei mit Einträgen je Auflösung; der Renderer wählt zur Zoomstufe den passenden Satz und einen ganzzahligen Faktor
+ Tiles sind Pixeldaten (Palette plus Pixelmatrix als JS-Datendatei in `grafik/`), der Renderer baut daraus beim Start die Bilder; Einzelheiten in [Tileset.md](Tileset.md)
+ Zoom ist eine Einstellung mit frei festlegbaren Stufen, nicht an bestimmte Tile-Größen gebunden; scharf bleibt Pixelart nur in ganzzahligen Vielfachen ihrer Auflösung (16 als 16, 32, 48, 64 px; 32 als 32, 64, 96 px)
+ Der Renderer zeichnet ein Tile, wenn ein Satz scharf zur Zoomstufe passt (Zoom ist ganzzahliges Vielfaches, größter Satz zuerst; fehlt dort das Tile, der nächste), sonst das Zeichen aus `daten/zeichen.js`; die Bilder baut `src/anzeige/tilebilder.js` beim Start, Fehler im Tileset erscheinen wie Datenfehler
+ Standard-Zoomstufe 16 px; vorhanden sind die Sätze 64, 48, 32 und 16 px
+ Offen: Bei einem Geräte-Pixelverhältnis ungleich 1 (z. B. 125 % Skalierung unter Windows) ist ein Tile-Pixel kein ganzzahliges Vielfaches eines Bildschirmpixels; gehört zur ganzzahligen Skalierung, siehe oben
+ Eine Kamera ist immer eingebaut: Ist der Ausschnitt größer als das Level, ist das ganze Level sichtbar, sonst scrollt die Karte; Zoomstufen sind nur Kameraeinstellungen
+ Die Levelgröße ist ein Datenwert, Levels dürfen unterschiedlich groß sein; Ziel: größer als Brogue (79x29)
+ Texte der Oberfläche sind HTML/CSS mit eigenen Schriftgrößen, unabhängig vom Tile-Raster
+ Markierungen über der Karte: Wegvorschau, Feld unter dem Zeiger, die Zielfelder angekündigter Angriffe sichtbarer Gegner (rötlich, `src/anzeige/ankuendigungen.js`, beim Zeichnen aus `laufendeAktion` berechnet, nicht gespeichert), die Vorschau des Zielmodus und das fliegende Geschoss (siehe Zielmodus)
+ Das Log zeigt nur, was Ninkasi wahrnimmt (`meldungWahrnehmbar` in `src/systeme/wahrnehmbar.js`, reine Lesefunktion mit Tests): Meldungen mit ihr als Beteiligter (`wer`, `ziel`, `quelle`, `opfer`, `was`, `mit`, `auf`, `traegerin`, `vorher`), Meldungen, bei denen ein beteiligter Bezug mit `ort` oder ein Feld (`ursprung`, `aufschlag`, `bahn`, `felder`) gerade sichtbar ist, und Meldungen ganz ohne Ort (Pegel, Hinweise); `bemerkt` nur, wenn sie das bemerkende Wesen sieht
+ Hören: Lärm, der Ninkasis Feld erreicht (`spielerinHoert` an der Meldung `laerm`) und dessen Ursprung sie nicht sieht, schreibt das Log als vage Zeile mit grober Richtung (`geraeuschGehoert`, `richtungZu`: acht Himmelsrichtungen), je nach `geraeusch` Kampflärm, Klirren oder ein Geräusch, höchstens eine Zeile je 100 Zeiteinheiten; wer dort was tut, sagt es nicht
+ Texte zu Zuständen: `log.zustand_beginnt` und `log.zustand_endet` allgemein, ein Zustand kann eigene mitbringen (`log.zustand.<name>.beginnt` bzw. `.endet`); dazu `abgewichen`, `beschworen` (ohne Urheberin `log.erschienen`) und `verschwindet`

## Oberfläche

+ Seit 0.28.0 das Layout aus [Oberflaeche.md](Oberflaeche.md): Zonen als CSS-Grid (`src/anzeige/stil.css`), Maße als Variablen in `rem` (`--breite-seite`, `--hoehe-log`, `--hoehe-bedienzeile`), so dass die Größe der Oberfläche über die Schriftgröße skaliert, getrennt vom Zoom der Tiles; Farben als Variablen, getrennt vom Layout
+ Variante A (Vorgabe): Karte, darunter das Log in zwei Spalten, rechts die Seitenleiste, unten die Bedienzeile; Variante B: links oben die Minikarte so breit wie die Spalte, darunter das Log (Geschehen über Kampf), Karte in der Mitte; `layoutAnwenden` in `src/main.js` setzt das Canvas der Minikarte dafür um; die Variante steht als `data-layout` an `#spiel`, Einstellung `layout` ("a", "b"), bis zum Einstellungsfenster umgeschaltet im Spielmenü
+ Über der Karte liegen eine noch leere Effektschicht (`#effektschicht`, für die Metaeffekte aus Punkt 12), der Tooltip und die Fenster
+ Seitenleiste (`#seitenkopf`, `#minikarte`, `#seiteninhalt`; `src/anzeige/oberflaeche.js`): Kopf mit Tiefe und Zug (`kopfHtml`), darunter die Minikarte, dann Ninkasi (LP, MP und PP als Balken, Pegel, freie EP immer, auch 0, Heimlichkeitsweite, laufende Aktion "Schritt 2 von 5", Zustände mit Stärke und Restdauer, Last), Zielen bzw. Untersuchen nur im Zielmodus (siehe dort), Gefährten mit LP, dann "In Sicht": die übrigen Wesen nach Abstand (Schachbrett, dann ID) mit Wachzustand (außer `jagt`), Zuständen und "wirkt etwas" bei einer laufenden Aktion (Vorbild Brogue); Startwert und Version zeigt das Spielmenü
+ Der Pegel ist nach oben offen und wird logarithmisch angezeigt (`src/anzeige/pegelanzeige.js`), in Verdopplungsschritten gleicher Breite (0, 0,5, 1, 2, 4, 8, 16 ‰ ...); eingezeichnet sind Schwellen und das Optimum der LP-Regeneration, daneben steht der genaue Wert (z.B. 2,35 ‰)
+ Bedienzeile (`src/anzeige/bedienzeile.js`): links die Nummer der aktiven Leiste und die Schnellleiste (siehe Schnellleiste), rechts acht Knöpfe in zwei Reihen aus dem Aktionskatalog (`KNOEPFE`, Text `knopf`), je mit Taste und Wort: Gepäck, Fähigkeiten, Charakter, Karte; Rasten, Erkunden, Hilfe, Menü; den Verlauf öffnet Tab oder ein Klick auf das Log; ein Klick wirkt wie die Taste, bei offenem Fenster oder im Zielmodus geht nur Menü (wie Esc); Knöpfe nehmen keinen Fokus
+ Inventar, Fähigkeiten, Charakter und Skills, Verlauf, Spielmenü, Hilfe, später Handel und Brauen als Fenster über der Karte; Öffnen und Schließen sind keine Befehle (siehe Fenster)
+ Minikarte und Übersichtskarte (`src/anzeige/minikarte.js`): `minikartenBild` rechnet ohne DOM je Feld die Farbe des Geländes aus `daten/zeichen.js` (Unerkundetes leer, gerade nicht Sichtbares gedämpft) und Punkte für Treppen, Gegenstände und Wesen in Sicht (Feind rot, Gefährte blau, neutral grau, Ninkasi weiß zuletzt); gezeichnet mit höchstens 3 px je Feld in der Seitenleiste, die Übersichtskarte (Taste m, Fenster `karte`) mit höchstens 10 px und Legende; ein Klick auf eine von beiden reist dorthin (nur über Erkundetes)
+ Hervorheben (Vorbild Brogue): Steht der Zeiger über einem Wesen der Seitenleiste (`data-wesen`), bekommt sein Feld auf der Karte und auf der Minikarte einen Rahmen; das Wesen unter dem Zeiger auf der Karte oder unter dem Cursor beim Untersuchen ist in der Seitenleiste hervorgehoben
+ Alle Elemente sind Anzeige und lassen sich ändern, ohne die Logik zu berühren
+ Was noch aussteht (Befehlszeile, Suche im Verlauf, Einstellungen, Titel), steht in [Oberflaeche.md](Oberflaeche.md) unter Stand der Umsetzung

## Log

+ Zwei Spalten (`src/anzeige/log.js`): Geschehen (Erzählung, Bemerktes, Gehörtes, Hinweise) und Kampf (Treffer, Abwehr, Tod anderer, gewirkte Fähigkeiten, angekündigte Angriffe); in Variante B übereinander; je Spalte stehen die neuesten Zeilen unten, wie viele sichtbar sind, entscheidet das Layout
+ Die Form einer Zeile entsteht ohne DOM in `src/anzeige/logzeilen.js` (`zeilenAusMeldung`, mit Tests): `{ spalte, art, text, seite?, ton?, magisch?, zahlen? }`; die Art (`ARTEN`) gibt Symbol und Filter (Gefahr ⚠, Angriff ⚔, Krit ✦, abgewehrt ○, Widerstand ◆, Tod ☠, Heilung, Pegel, Fund, Lernen, Geschehen, Hinweis); Farbe nie allein
+ Jede Zeile in festen Spalten: Zugmarke (Zugzähler `zuege` Ninkasis, ein Strich trennt ihre Züge), Symbol, Text, im Kampf dazu je eine schmale Spalte für Chance, Schaden, Krit und Abzug (`ZAHLENSPALTEN`, Kopfzeile kurz "%", "DMG", "×", "–", der Tooltip nennt die Bedeutung; leere Zellen bleiben stehen); Abzug fasst Rüstung und Widerstand zusammen, der Tooltip nennt die Aufteilung; gleiche Zeilen hintereinander werden zu "x3" zusammengefasst, ältere werden in vier Stufen blasser
+ Kampf nach Seite und Ton: die Farbfamilie folgt, wer handelt (`seiteVon`: Ninkasi Grün, Verbündete Blau, Gegner Rot, Neutrale Grau), der Ton dem Ausgang (Treffer, Krit hell und fett, abgewehrt gedämpft); bei Gegnern Gelb für angekündigte Angriffe und Lila für Psi und Magie; ein Tod in der Farbe der Seite, die ihn verursacht hat (ohne Quelle der Seite, der er nützt); Farben als Variablen in `stil.css`
+ Zahlen im Kampf: Trefferchance (die Logik meldet `trefferchance` an `schaden` und `verfehlt`, in Prozent vor dem Blocken; ohne Trefferwurf `null`), Schaden, Krit-Faktor (`kritfaktor` an `schaden`, sonst `null`), Abzug der Rüstung, Widerstand
+ Der Verlauf (Tab) zeigt das ganze Log (höchstens 500 Zeilen) als Fenster mit Filter nach Spalte oder Art (siehe Fenster)

## Kamera

+ Folgen mit Randabstand: Die Kamera bewegt sich erst, wenn Ninkasi näher als etwa ein Viertel des Ausschnitts an den Rand kommt
+ Am Levelrand bleibt die Kamera stehen, jenseits des Levels ist nichts zu sehen; kleinere Levels stehen mittig
+ Zunächst feldweises Springen, weiches Scrollen später als reine Anzeige (siehe [Animationen.md](Animationen.md))
+ Umschauen: Karte frei verschieben per Maus oder Taste, ein Anzeige-Zustand
+ Weitere Verhaltensweisen (Zentrieren, Springen) bleiben austauschbar und einstellbar

## Sichtweite

+ Die Sichtweite von Ninkasi ergibt sich aus Skills und Hindernissen
+ Ist sie größer als der Ausschnitt, wird nicht herausgezoomt; stattdessen zeigen Markierungen am Kartenrand Gegner außerhalb des Ausschnitts, die Gegnerliste der Seitenleiste nennt alle sichtbaren Gegner

## Licht

Vorläufige Ideen, noch nicht umgesetzt. Licht ist hauptsächlich Spielmechanik, Stimmung ein Nebeneffekt.

+ Die Logik rechnet je Feld eine Helligkeit als ganze Zahl (z. B. 0 bis 100); sie ist Teil des Zustands oder wird daraus deterministisch berechnet
+ Lichtquellen sind eine Komponente mit Reichweite und Stärke, die Farbe ist nur für die Anzeige; Beispiele: Fackel an der Wand mit Reichweite 10, glühender Kessel, getragene Laterne
+ Ausbreitung je Quelle über dasselbe Verfahren wie das Sichtfeld (rot.js PreciseShadowcasting), Stärke nimmt mit der Entfernung ganzzahlig ab; mehrere Quellen addieren sich bis zu einer Obergrenze
+ Feste Quellen werden nur neu berechnet, wenn sich etwas ändert (Tür, gelöschte Fackel, bewegte Quelle)
+ Anzeige: Eine Lichtkarte mit einem Pixel je Feld wird geglättet auf Kartengröße skaliert und per Mischmodus "multiply" über die Karte gelegt; Schwarz ist dunkel, Weiß unverändert, Farben tönen (Fackel warm, Psi cyan); so entstehen weiche Übergänge statt Stufen
+ Leuchtende Pixel (Augen, Leuchtfarben, Glut) zeichnet der Renderer nach der Abdunklung erneut, sie bleiben im Dunkeln sichtbar; dafür trägt ein Tile eine Maske seiner leuchtenden Pixel
+ Flackern ist reine Anzeige über den kosmetischen Zufall, die Logik rechnet mit festen Werten
+ Dieselbe Abdunklung kann auch erkundete, aber gerade nicht sichtbare Felder darstellen

## Fraktionen

+ Vorbild Caves of Qud: Feindliche greifen an, Neutrale tun nichts, werden aber feindlich, wenn man sie absichtlich trifft
+ Daten in `daten/fraktionen.js`: `{ text, beziehungen?: { andereFraktion: "feind" | "neutral" | "verbuendet" } }`, umgesetzt in `src/systeme/fraktionen.js`; die Datenprüfung verlangt, dass jedes Wesen eine bekannte Fraktion trägt
+ Eine Beziehung gilt in beide Richtungen; sagen beide Seiten etwas anderes, gewinnt die strengere (feind vor neutral vor verbuendet); gleiche Fraktion ist verbündet, `eigene:<nummer>` (Zwietracht) mit allen verfeindet; fehlt eine Angabe, gilt `regeln.fraktionen.beziehungVorgabe` (Vorgabe `feind`, wie vor 0.14.0), die Tabelle nennt nur Abweichungen
+ `beziehungZwischen(spiel, urheber, entitaet)` mit `urheber = { id, fraktion }` ist die eine Quelle für `feindlich`, `trifft` (Zielauswahl, Auren, KI) und die Anzeige "In Sicht"; Neutrale greift man nicht durch Hineinlaufen an, nur ausdrücklich (`angreifen: true`)
+ Zorn: Trifft oder verfehlt eine Urheberin ein neutrales Wesen oder schadet ihm, werden es und alle Wesen seiner Fraktion, die die Urheberin gerade sehen, ihr gegenüber feindlich; jedes merkt sich das einzeln (`zornAuf: [IDs]`, gilt in beide Richtungen und vor der Tabelle); wer nichts mitbekommt, bleibt neutral; Meldung `zorn`; ein Ruf bei ganzen Fraktionen ist Spieldesign für später

## Wahrnehmung

+ Vorbild Brogue (Heimlichkeitsweite, Chance je Zug, Spur verlieren, Angriffe auf Ahnungslose); umgesetzt in `src/systeme/wahrnehmung.js`, Regelwerte in `regeln.wahrnehmung`
+ Dichter Rauch versperrt Ninkasis Sichtfeld und die Sichtlinie aller anderen (siehe Feldschichten)
+ Sehen (`sieht` in `src/systeme/sicht.js`): Ninkasi sieht, was in ihrem Sichtfeld liegt; alle anderen sehen ein Ziel mit freier Sichtlinie innerhalb ihrer Sichtweite, auch Ninkasi
+ Wachzustand in der KI-Komponente: `ki.wachzustand` `schlaeft`, `wach` oder `jagt` (Vorgabe `jagt`, das Verhalten vor 0.14.0); in den Daten z.B. `ki: { modul: "jagen", wachzustand: "schlaeft" }`
  + `schlaeft`: tut nichts, bis es jemanden bemerkt (dann `jagt`) oder Lärm hört (dann `wach`)
  + `wach`: hat noch niemanden bemerkt, geht Lärm nach (`letzteBekanntePosition`), sonst wartet es
  + `jagt`: verfolgt das nächste sichtbare Ziel innerhalb der Spurweite (`spurFaktor` mal die Heimlichkeitsweite des Ziels, Vorgabe 3); findet es an der letzten bekannten Position niemanden mehr, wird die eigene KI wieder `wach` (eine überlagerte KI wie Rausch bleibt, wie sie ist)
+ Heimlichkeitsweite eines Ziels: Kampfwert `heimlichkeit` (Vorgabe `heimlichkeitVorgabe` 7) mit Modifikatoren auf `heimlichkeit` (Skills), dann nach der letzten eigenen Aktion skaliert (`heimlichkeitNachAktion`: Nahkampf und Fähigkeit verdoppeln, Warten halbiert), nie unter `heimlichkeitMindestens` (2); die letzte Aktion merkt sich jede Akteurin als `letzteAktion`
+ Bemerken: Vor dem Zug eines Wesens mit eigener KI, das nicht jagt, würfelt es für jedes sichtbare feindliche Ziel innerhalb von dessen Heimlichkeitsweite mit `bemerkenChance` (25 %), nach Abstand und ID; Meldung `bemerkt`
+ Wer getroffen, verfehlt oder geschädigt wird, jagt sofort und kennt die Position der Urheberin
+ Ahnungslos ist ein Wesen mit KI, das nicht jagt; Angriffe darauf sind ein Hinterhalt (siehe Kampfwerte)
+ Lärm (`laermMachen`, Baustein `laerm { lautstaerke }`, Meldung `laerm`): breitet sich aus wie eine Wegsuche mit Kosten, ein passierbares Feld kostet 1, anderes Gelände seine `laermdaempfung` (Wand 8), ohne Angabe dringt nichts durch; wer innerhalb der Lautstärke liegt, hört ihn: Schlafende werden wach (Meldung `aufgewacht`), Wache gehen der Quelle nach, wer jagt, bleibt dabei; jeder Nahkampf macht Lärm (`laermNahkampf` 6); die Meldung nennt das Geräusch (`geraeusch`: `nahkampf`, `aufschlag`, `sonstiges`) und ob Ninkasi es hört (`spielerinHoert`, nicht bei eigenem Lärm), siehe Anzeige

Vorläufige Ideen, noch nicht umgesetzt:

+ Sehen braucht Licht: Ein Wesen sieht ein Ziel nur, wenn das Feld des Ziels hell genug ist; Brogue verdoppelt die Heimlichkeitsweite im Licht und halbiert sie im Dunkeln; z. B. Lebensmittelkontrolleure
+ Spüren braucht kein Licht: Wahrnehmung im Umkreis, unabhängig von der Helligkeit; z. B. Mikroorganismen
+ Nachtsicht und Fernsicht werden Skills: Nachtsicht senkt die nötige Helligkeit zum Sehen, Fernsicht erhöht die Sichtweite; siehe [Charakter.md](Charakter.md)
+ Wer Licht trägt, sieht mehr und wird selbst gesehen
+ Umherziehen (Brogue "wandering") als eigenes Verhalten wacher Wesen

## KI

+ Vorbilder: Brogue (Monster mit Abstand, `MONST_MAINTAINS_DISTANCE`; kein Bolt durch Verbündete), DCSS (Häufigkeit je Monsterzauber), Hoplite und Into the Breach (angekündigte Angriffe mit sichtbarem Zielfeld)
+ Verhaltensmodule im Register `ki` (`src/ki/`): `abwarten`, `jagen` (siehe Wahrnehmung), `fliehen`; Zielwahl in `src/ki/ziele.js`, Schrittwahl weg von einer Position (`schrittWeg`) in `src/ki/schritte.js`, für Flucht und Abstand
+ Fähigkeiten an der KI: `ki: { modul: "jagen", faehigkeiten: [{ name, chance?, abstandAb?, abstandBis?, wenn? }], abstandHalten? }`; das Wesen muss die Fähigkeiten kennen (`faehigkeiten` am Wesen), die Datenprüfung achtet darauf
+ Sieht das jagende Wesen seine Beute, prüft es die Einträge der Reihe nach und setzt den ersten passenden ein (`src/ki/faehigkeitenwahl.js`), vor Nahkampf und Bewegung; ein Eintrag passt, wenn der Abstand (Schachbrett) im Bereich liegt, `wenn` am Wesen gilt (Gegenüber ist die Beute), `faehigkeitPruefen` nichts einwendet und kein Verbündeter betroffen wäre; erst dann wird `chance` gewürfelt (Vorgabe 100, sichere Fälle würfeln nicht)
+ Verbündete schonen: zählt unter den Betroffenen aus `zielAufloesen` ein anderes Wesen als verbündet, unterbleibt die Fähigkeit, außer die Zielart trifft ausdrücklich `verbuendete`; mit `ueberVerbuendete` an der Zielart fliegen Geschosse darüber
+ Zielangabe nach Zielart: `wesen` und `geschoss` die Beute, `feld` ihr Feld (angekündigte Angriffe zielen so auf das Feld beim Beginn), `selbst` keine, `richtung` zur Beute, nur wenn sie daneben steht
+ Umweg: steht auf dem nächsten Feld des Weges ein Wesen, das kein Ziel ist (ein Verbündeter im Gang), sucht der Jäger einen Weg um alle Wesen herum (`wesenMeiden`) und nimmt ihn, wenn er höchstens `regeln.bewegung.umwegHoechstens` (4) Felder länger ist; sonst wartet er (Vorbild Brogue); so gehen Rudel um den Vordermann herum, ohne sich in langen Gängen zu verlaufen
+ `abstandHalten: n`: steht die Beute näher als n, weicht das Wesen zurück (in die Ecke gedrängt greift es normal an), auf genau n Feldern wartet es, bei mehr kommt es näher

## Eingabe

+ Vorgabe für die Bewegung seit 0.28.0 nach den vi-Tasten der Roguelikes, nach der Lage der Taste: h j k l für links, unten, oben, rechts, y u b n für die Diagonalen (auf der deutschen Tastatur liegt y auf der Aufschrift Z, Code `KeyY`), `.` wartet; Ziffernblock (5 wartet) und Pfeiltasten bleiben belegt; Umschalt plus Richtung läuft (siehe Laufen)
+ Aktionskatalog (`src/eingabe/aktionskatalog.js`): jede Aktion der Oberfläche einmal, `id: { text, gruppe, befehl?, knopf?, platz?, leiste? }`; Aktionen mit `befehl` werden zum Befehl an die Logik (Bewegen, Warten, Treppe, Aufheben, Trinken, Fortsetzen), die übrigen wertet `src/main.js` aus (Fenster, Abläufe, Laufen, Schnellleiste, Zoom, Esc-Kette, Neustart); `knopf` ist das Wort auf dem Knopf der Bedienzeile (`KNOEPFE`), `platz` die Stelle in der Schnellleiste (`schnellplatz_1` bis `schnellplatz_10`, `platzDerTaste`), `leiste` die Leiste, auf die umgeschaltet wird (`leiste_1` bis `leiste_5`); aus Katalog und Belegung entstehen Hilfe und Knöpfe, später Befehlszeile und Seite zur Tastenbelegung ([Oberflaeche.md](Oberflaeche.md))
+ Die Belegung ist frei änderbar, siehe Datenfluss (`src/eingabe/belegung.js`): `tasten` (physische Taste nach `KeyboardEvent.code` zu Aktion, in der Hilfe genannt), `weitereTasten` (wirken gleich, ohne Nennung, z.B. die US-Lage von + und -), `zeichen` (nach `KeyboardEvent.key`, für Zeichen ohne feste Lage wie `?`, `.`, `<`, `>`, gehen vor), `umschaltBewegen` (Aktion für Umschalt plus Bewegungstaste, `laufen`), `umschaltTasten` (physische Tasten mit Umschalt, Umschalt+1 bis 5 wechselt die Leiste; gehen allem vor), dazu Maustasten (links handeln, rechts untersuchen) und Mausrad; `aktionDerTaste` sucht in dieser Reihenfolge, `uebersetzen` (`src/eingabe/eingabe.js`) gibt `{ aktion, befehl? }` bzw. beim Laufen `{ aktion, richtung }`; auch der Zielmodus liest die Bewegungstasten über den Katalog
+ Weitere Tasten: Leertaste setzt eine unterbrochene lange Aktion fort (`fortsetzen`), r rastet bis voll, o erkundet automatisch, i öffnet das Inventarfenster (siehe Ausrüstung und Inventar), f das Fähigkeitenfenster (siehe Zielmodus), c Charakter und Skills, Tab den Verlauf, ? die Hilfe (siehe Fenster), x untersucht (siehe Untersuchen), `<` oder `>` nimmt die Treppe, `:` öffnet die Befehlszeile, 1 bis 0 die Plätze der Schnellleiste, Umschalt+1 bis 5 wechselt die Leiste (auch bei offenem Fenster), d lässt fallen und w wirft (beide über das Inventar), m öffnet die Übersichtskarte, Esc die Esc-Kette; die Hilfe nennt Buchstaben klein, wie sie ohne Umschalt getippt werden
+ Befehlszeile (`:`, `src/eingabe/befehlszeile.js`, Fensterart `befehlszeile`): Treffer aus einem Register von Quellen (`befehlsquelleAnmelden(name, (kontext) => [{ schluessel, text, ziel }])`), bisher Aktionen (ohne Laufen) und Einstellungen; später können sich Bierrezepte, Lore-Texte oder Bücher als Quelle anmelden; Suche ohne Rücksicht auf Groß- und Kleinschreibung, Umlaute als ae, oe, ue (`suchform` in `src/eingabe/texteingabe.js`), Anfang des Texts vor Wortanfang oder Anfang der ID vor Teilwort, höchstens 10 Treffer; Tab übernimmt, Pfeile wählen, Enter führt aus (Aktion wie ihre Taste über `aktionsergebnis` in `src/eingabe/eingabe.js`, Einstellung öffnet das Einstellungsfenster an diesem Eintrag); Zusatzangaben wie `:zoom 32` folgen später
+ Texteingabe in Fenstern (`texteingabeTaste`): druckbare Zeichen hängen an, die Rücktaste löscht; während ein Fenster Text oder eine Taste aufnimmt, fängt `src/main.js` weder `?` noch Umschalt+Ziffer ab
+ Esc als Kette (`escSchritt` in `src/eingabe/esckette.js`): erst den Zielmodus abbrechen, dann das oberste Fenster schließen (das Fenster entscheidet selbst, z.B. erst zurück zur Liste), dann einen Ablauf abbrechen, sonst das Spielmenü öffnen
+ Buchstaben in den Fenstern gelten nach dem Zeichen der Taste (`KeyboardEvent.key`, `buchstabeDerTaste` in `src/eingabe/inventar.js`), so passen sie zu jeder Tastaturbelegung; die Belegung selbst nennt physische Tasten (`KeyboardEvent.code`)
+ Offene Fenster und der Zielmodus bekommen jede Taste, bevor die Belegung greift
+ Einstellungen haben Vorgaben in `src/eingabe/einstellungen.js`; der Browser speichert nur Abweichungen davon (siehe Einstellungen)
+ Eigene Tastenbelegung (`src/eingabe/belegunganpassen.js`, ohne DOM): Abweichungen `{ tasten: { code: aktion | null }, zeichen: { zeichen: aktion | null } }` über der Vorgabe, gespeichert unter `battle-ninkasi.belegung`; `src/main.js` baut daraus beim Start und nach jeder Änderung die wirksame Belegung (`abweichungenAnwenden`) und reicht sie wie bisher weiter; neu belegt wird immer die physische Taste, hat ihr Zeichen schon eine Aktion (z.B. `.`), verliert das Zeichen sie (Zeichen gehen sonst vor); `tasteSetzen` meldet die verdrängte Aktion, `aktionAufVorgabe` und Aufräumen sorgen dafür, dass nur Abweichungen gespeichert werden; nicht belegbar sind Esc, Enter, Tab, `?`, die Funktionstasten und Umschalt, Strg, Alt allein; Umschalt+Richtung und Umschalt+1 bis 5 sind fest
+ Es gibt eine einzige Belegung: für eine Tastatur mit Ziffernblock, aber ohne ihn spielbar (vi-Tasten); Ziffernblock und Pfeile liegen zusätzlich auf der Bewegung; Belegungssätze gibt es nicht

## Maus, Reise, Laufen, Rasten und Erkunden

+ Die Maus erzeugt nur gewöhnliche Befehle; die Logik kennt weder Maus noch Reise, Rasten oder Erkunden
+ Ein Klick wird über eine geordnete Liste von Klickregeln gedeutet (`src/eingabe/maus.js`), die erste passende greift: eigenes Feld mit Gegenstand hebt auf, angrenzender sichtbarer Feind wird angegriffen, sonst Reise zum Feld; weitere Regeln (Kessel, Händler) kommen in die Liste
+ Ein Rechtsklick untersucht das Feld wie x (Zielmodus mit `{ zweck: "untersuchen" }`, Cursor auf dem Feld); das Kontextmenü des Browsers bleibt über der Karte zu
+ Eine Reise ist eine Folge von Befehlen "bewegen"; der Kern (`src/eingabe/reise.js`) liefert Schritt für Schritt den nächsten Befehl oder einen Grund zum Anhalten und kommt ohne Timer und DOM aus, Browser und Bot benutzen ihn gleich; den Takt gibt im Browser `src/main.js` vor (Einstellung `reisePause`)
+ Gereist wird nur über erkundete Felder, der Weg wird bei jedem Schritt neu berechnet; beim Darüberfahren zeigt die Anzeige den Weg als Vorschau
+ Seit 0.28.0 beginnen Reise, Laufen und Erkunden auch mit Feinden in Sicht und halten nur bei einem neuen Feind (Einstellung `reiseTrotzFeinden`, Vorgabe an; aus, beginnt mit Feinden in Sicht nichts); neu heißt: im Schritt davor nicht zu sehen, wer aus der Sicht gerät und wieder auftaucht, hält also erneut (Prüfung `gegner_in_sicht`, Vorbild Brogue); Rasten ebenso (siehe unten)
+ Eine Reise hält an bei: neuem Feind in Sicht, Schaden, Gegenstand auf dem Feld (Liste `reiseHalt` in den Einstellungen), außerdem bei Ankunft, fehlendem Weg, versperrtem Feld, Tod und jeder Taste oder jedem Klick
+ Das Mausrad zoomt
+ Laufen, Rasten und Erkunden sind Abläufe derselben Art (`src/eingabe/laufen.js`, `src/eingabe/rasten.js`, `src/eingabe/erkunden.js`): Schritt für Schritt ein gewöhnlicher Befehl oder ein Haltegrund, ohne Timer und DOM; `src/main.js` taktet alle Abläufe gleich, jede Taste und jeder Klick bricht ab; die Prüfung nach jedem Schritt (`unterwegsPruefen` in `src/eingabe/reise.js`) teilen sich alle
+ Laufen (Umschalt plus Richtung) geht geradeaus; beginnt nicht vor einem Hindernis (`versperrt`); hält wie die Reise (`reiseHalt`), vor einem Hindernis (`hindernis`) oder Wesen (`versperrt`), vor einer bekannten Falle oder Gefahr (`gefahr_voraus`) und wenn neben Ninkasi eine Tür, eine Treppe oder ein Gegenstand neu in Reichweite kommt (`bemerkenswert`, gemerkt in `bemerkt`, damit schon Bemerktes nicht noch einmal hält); das Halten an Abzweigungen in Gängen fehlt noch
+ Rasten wartet, bis die Vorräte aus `rastenBis` (Vorgabe LP und MP) voll sind; beginnt seit 0.28.0 auch mit bekannten Feinden in Sicht (Einstellung `rastenTrotzFeinden`, Vorgabe an), nicht aber, wenn schon alles voll ist; hält bei `rastenHalt` (neuer Feind, Schaden) und nach höchstens `rastenHoechstens` Schritten, falls sich nichts mehr füllt (z.B. MP bei hohem Pegel)
+ Erkunden geht zum nächsten erkundeten Feld am Rand des Unbekannten (Breitensuche `naechstesFeldMit` in `src/welt/wege.js`, nur über erkundete Felder), bei jedem Schritt neu gewählt; hält wie die Reise (`reiseHalt`) und wenn nichts mehr zu erkunden ist
+ Im Zielmodus setzt die Maus den Cursor, ein Klick bestätigt (siehe Zielmodus)
+ Der Tooltip zeigt beim Darüberfahren die Kurzfassung des Feldes unter dem Zeiger (siehe Untersuchen)

## Einstellungen

+ Einstellungskatalog (`src/eingabe/einstellungskatalog.js`, ohne DOM): jede Einstellung einmal mit Reiter (Anzeige, Spiel, Tasten, Barrierefreiheit) und Art: `schalter`, `auswahl` (feste Werte), `zahl` (min, max, schritt, einheit), `listenschalter` (ein Eintrag einer Liste, z.B. `gegenstand` in `reiseHalt`), `knopf` (Aktion ohne gespeicherten Wert, z.B. Vollbild); Texte `einstellung.<id>` und `.erklaerung`, Werte einer Auswahl `einstellung.<id>.wert.<wert>`, die Null einer Zahl darf eigenen Text haben (`.null`, z.B. "aus"); `einstellungLesen`, `einstellungSetzen` (bringt Zahlen auf Grenzen und Schritt), `einstellungSchritt`, `einstellungVorgabe`; ein Test prüft Reiter, Texte und Vorgaben
+ Anzeige: Layout (A, B, kompakt), Größe der Oberfläche (Schriftgröße von `:root` in px, 12 bis 22, alle Maße in `rem` folgen), Zoom, Logzeilen (Layout A), Minikarte, Vollbild; Spiel: Reisetempo (auch für Laufen, Rasten, Erkunden), Geschossbahn (0 aus), Reisen und Rasten trotz Feinden, Halt bei Gegenständen, Schnellleiste sofort auslösen, Neustart nachfragen; Barrierefreiheit: Bewegung reduzieren (bisher die Geschossbahn), hoher Kontrast, Palette für Farbenblinde
+ Wirkung (`einstellungenAnwenden` in `src/main.js`): `data-layout` an `#spiel`, `--log-zeilen` in Layout A, Schriftgröße, `data-kontrast` und `data-palette` an `<html>` (überschreiben Farbvariablen in `stil.css`; die Palette ersetzt Grün und Rot durch Blau und Orange), Minikarte ein oder aus; Layout kompakt ist A mit 3 Logzeilen, Seitenleiste 20rem und kleineren Knöpfen, nur von Hand einstellbar
+ Sofort auslösen: ein Platz der Schnellleiste mit vorbelegtem, gültigem Ziel wirkt ohne zweiten Tastendruck; sonst bleibt der Zielmodus offen
+ Einstellungsfenster (`src/eingabe/einstellungsfenster.js`, Inhalt `src/anzeige/einstellungsanzeige.js`, Zustand `{ reiter, gewaehlt, tastenStelle, aufnahme, konflikt, hinweis }`): die Kopfzeile nennt alle Reiter, Tab und Umschalt+Tab wechseln; Buchstabe oder Pfeile wählen, links und rechts oder - und + ändern, Enter schaltet um bzw. löst aus, Entf stellt die Vorgabe her; die Einzelheiten nennen Erklärung und Vorgabe; jede Änderung wirkt sofort und wird gespeichert
+ Reiter Tasten: alle Aktionen in der Reihenfolge der Hilfe außer den festen (Laufen, Leisten) mit ihren Tasten und einem freien Platz dahinter; Pfeile wählen Aktion und Taste, Enter nimmt eine neue Taste auf (ersetzt die gewählte oder kommt hinzu), eine gesperrte Taste nennt das Fenster, eine schon belegte als Konflikt mit der anderen Aktion (Enter verschiebt sie, Esc bricht ab), Entf nimmt die Taste weg, Rücktaste stellt die Aktion auf die Vorgabe, die letzte Zeile alle Tasten; geänderte Aktionen sind markiert
+ Einstellungen ohne Taste in der Vorgabe (`ohneTaste` im Aktionskatalog, bisher `einstellungen`) erreicht man über Spielmenü und Befehlszeile und kann ihnen im Reiter Tasten eine geben

## Schnellleiste

+ `src/eingabe/schnellleiste.js` (ohne DOM, mit Tests); Anzeige-Zustand, gespeichert im Teil `oberflaeche` des Speicherstands: `{ leisten: [5 x 10 Plätze], aktiveLeiste, abgelegt }`, ein Platz `{ art: "faehigkeit", faehigkeit, vonHand? }` oder `{ art: "gegenstand", typ, vonHand? }`
+ Gegenstände liegen nach ihrer Art auf dem Platz: ist ein Stapel aufgebraucht, bleibt der Platz grau mit Anzahl 0 (Grund `nichts_mehr_davon`) und füllt sich wieder, sobald Ninkasi ein Stück derselben Art trägt; aufgebraucht zeigt er den Namen aus den Daten, eine unbekannte Art ihr Etikett
+ Nachführen (`leistenNachfuehren`, nach jedem angenommenen Befehl): neue Fähigkeiten in Lernreihenfolge und neue Getränkearten in der Reihenfolge des Gepäcks rücken auf den ersten freien Platz der Leiste 1, dann der Leisten 2 bis 5; was heruntergenommen wurde (`abgelegt`), kommt nicht von selbst wieder; von Hand belegte Plätze bleiben; Wurfwaffen kommen nur von Hand dazu
+ Umbelegen: `platzBelegen` (zieht von einem anderen Platz um, gilt als von Hand), `plaetzeTauschen`, `platzLeeren` und `ohneSchluessel` (merken den Schlüssel als abgelegt), `leisteWechseln`; im Inventar und im Fähigkeitenfenster legt eine Ziffer das Gewählte auf diesen Platz der aktiven Leiste, Entf nimmt es von allen Leisten (Fensterergebnis `leiste`); mit der Maus tauscht ein Platz auf einen anderen gezogen, ein Eintrag aus diesen Fenstern (`data-ziehen`) belegt, ein Platz aus der Leiste gezogen wird leer
+ `platzZustand`: bei Gegenständen die Anzahl aller Stücke der Art, bei Fähigkeiten die Abklingzeit in Zügen; ein Grund aus `faehigkeitPruefen`, der nicht am Ziel liegt, macht den Platz grau, der Tooltip nennt ihn
+ `platzAusloesen`: ein trinkbarer Gegenstand wird sofort zum Befehl `trinken` mit dem ersten Stück der Art, ein anderer zur Auswahl zum Werfen, eine Fähigkeit zur Auswahl für den Zielmodus mit `platz`; ein leerer Platz tut nichts
+ `stellenVon` sagt, wo ein Eintrag liegt; Inventar und Fähigkeitenfenster zeigen es in den Einzelheiten

## Zielmodus

+ Vorbilder: DCSS (Cursor mit Tab zum nächsten Ziel, Vorschau getrennt von der Wirkung), Brogue (Bahn und Fläche vor dem Wurf sichtbar), Into the Breach (die Vorschau sagt, was passiert)
+ Werfen kommt aus dem Inventarfenster (Gegenstand wählen, dann w), Fähigkeiten aus dem Fähigkeitenfenster (Taste f; a bis z wählt und zeigt Verbrauch, Abklingzeit und Platz in der Schnellleiste, Enter oder derselbe Buchstabe wirkt, Esc zurück bzw. schließt; `src/eingabe/faehigkeiten.js`, Zustand `{ gewaehlt }`) oder der Schnellleiste; alle liefern eine Auswahl `{ zweck: "werfen", gegenstandId }` bzw. `{ zweck: "faehigkeit", faehigkeit }`
+ `src/eingabe/zielmodus.js` ist reine Tasten- und Mauslogik ohne DOM wie das Inventarfenster, Zustand nur in der Anzeige: `{ auswahl, zielart, cursor, platz? }`; `zielmodusBeginnen` gibt den Modus zurück, bei Fähigkeiten ohne Ziel, mit Zielart `selbst` oder `aufrecht` gleich den Befehl, bei Gründen, die nicht am Ziel liegen (z.B. `abklingend`, `zu_wenig_mp`), den Grund
+ Der Cursor beginnt nach der Zielvorgabe (`zielvorgabeVon`): `zielvorgabe` an der Fähigkeit ("feind", "gefaehrte", "selbst", von der Datenprüfung geprüft), ohne Angabe "gefaehrte" bei den Tags `heilung` oder `nuetzlich` an Fähigkeit oder Wirkung, sonst "feind"; Werfen zielt auf Feinde; "feind" ist das nächste nicht verbündete Wesen in Sicht, "gefaehrte" die nächste verletzte Verbündete oder Ninkasi, "selbst" Ninkasi; lebt das zuletzt gewählte Ziel (`letztesZielId` in `src/main.js`, gesetzt bei jedem angenommenen Befehl mit Ziel) und ist unter den Kandidaten, gewinnt es; ohne Kandidaten steht er auf Ninkasi; die Bewegungstasten der Belegung schieben ihn, die Maus setzt ihn, Tab springt reihum zu den Wesen in Sicht (nach Abstand, dann ID), Enter oder Klick bestätigt, aus der Schnellleiste auch dieselbe Ziffer noch einmal (`platz`, Vorbild DCSS), Esc bricht ab; nennt die Vorschau einen Grund, bleibt der Zielmodus offen und das Log nennt ihn
+ Zielangabe aus dem Cursor nach Zielart: `wesen` die ID des Wesens dort (sonst keine), `richtung` das Vorzeichen des Versatzes, sonst das Feld
+ Vorschau (`src/systeme/vorschau.js`, ändert nichts, würfelt nicht): `zielvorschau(spiel, akteur, auswahl, zielangabe)` gibt `ok`, den Grund (aus der Prüfung des Befehls), die Auflösung aus `zielAufloesen` (Felder, Bahn) und die betroffenen Wesen mit ihrer Trefferchance zurück; Betroffene wie bei der Wirkung (`wirkungsziele` in `src/systeme/faehigkeiten.js`, beim Wurf mit `wurf.effekt` das erste Wesen der Bahn, ohne Effekt niemand), für Ninkasi nur, was sie sieht
+ Trefferchance (`trefferchanceVorschau`): beginnt die Wirkung mit `trefferwurf`, die Prozentzahl aus `trefferanteil` mit den Tags der Wirkung und der Effekte, gegen ein ahnungsloses Ziel 100 % als Hinterhalt; ohne Trefferwurf "sicher"; steckt er nur verschachtelt (z.B. in `fuer_jedes_ziel`), bleibt die Chance offen ("?"), dafür bräuchte es eine Simulation auf einer Kopie des Zustands; Blocken ist nicht eingerechnet
+ Anzeige: der Renderer zeigt die Bahn hell, die Fläche bläulich, die Betroffenen gelb umrandet und den Cursor grün (ginge) oder rot (Grund dagegen); die Seitenleiste nennt oben unter "Zielen", womit gezielt wird, den Grund und die Betroffenen mit Chance; Wirkungen innerhalb eines Effekts (z.B. der Brandkreis der Brandflasche) zeigt die Vorschau nicht
+ Geschossbahn: jede Meldung `geschoss` wird mit den Feldern, die Ninkasi sieht, abgespielt, ein helles Quadrat je Feld im Takt der Einstellung `geschossPause` (30 ms, 0 schaltet ab; `src/anzeige/animation.js` ohne Timer und DOM, den Takt gibt `src/main.js` vor); mehrere Bahnen nacheinander, jede Taste überspringt sie und wirkt trotzdem; der Zustand ist dann schon weiter, die Animation ist reine Anzeige
+ Der Bot benutzt Ninkasis Fähigkeiten über dieselbe Logik (Tab oder Feld in der Nähe), auch mit Zielen, die abgelehnt werden

## Untersuchen

+ Vorbilder: DCSS (Beschreibung mit Trefferchance in beide Richtungen), Brogue (Seitenleiste und Beschreibung des Feldes unter dem Zeiger)
+ Taste x oder ein Rechtsklick öffnet den Zielmodus mit der Auswahl `{ zweck: "untersuchen" }`: derselbe Cursor (Bewegungstasten, Maus, Tab), keine Vorschau, kein Befehl, keine Spielzeit; Enter und Klick tun nichts, Esc oder x schließt
+ `src/systeme/untersuchen.js` (reine Lesefunktionen): `feldBeschreiben(spiel, feld)` gibt nichts für ein nie gesehenes Feld, für ein erkundetes, das Ninkasi gerade nicht sieht, nur das Gelände (erinnert), für ein sichtbares Gelände, Feldschichten mit Menge, Gegenstände, bekannte Fallen und Wesen
+ Wesen (`wesenBeschreiben`): LP, Zustände mit Restdauer (`zustaendeVon`: angefangene Züge zu 100 Zeiteinheiten, unbegrenzt ohne), Wachzustand, laufende Aktion (`laufendeAktionVon`), Trefferchance des ersten Angriffsprofils in beide Richtungen (`nahkampfchanceVorschau` in `src/systeme/vorschau.js`, gegen Ahnungslose 100 % als Hinterhalt, Blocken nicht eingerechnet)
+ Auf Ninkasi zeigt die Seitenleiste dazu die Aufschlüsselung ihrer Werte (`werteAufschluesseln`): Höchstwerte, Genauigkeit des ersten Profils, Kampfwerte und Sichtweite, je mit Grundwert, Wert und jedem Modifikator samt Herkunft (`herkunftVon`: angeboren, Gegenstand, Zustand, Aura); nur Werte, die nicht 0 sind oder Modifikatoren haben; Modifikatoren mit Bedingungen an ein Gegenüber zählen dort nicht
+ Tooltip (`tooltipHtml` in `src/anzeige/oberflaeche.js`, Element `#tooltip` über der Karte): die Kurzfassung des Feldes unter dem Zeiger, beim Untersuchen unter dem Cursor, also auch per Tastatur; rechts neben dem Feld, am rechten Rand links davon; nicht während eines Ablaufs
+ Geländearten haben dafür einen Namen (`text` in `daten/gelaende.js`, die Datenprüfung verlangt ihn)
+ Der Bot untersucht alle zehn Befehle Ninkasis Feld samt Werten, per Tab das nächste Wesen und ein Feld daneben, und zählt, welche Meldungen das Log zeigen, verbergen oder hören würde

## Fenster

+ Seit 0.27.0 ein Fensterstapel über der Karte (`src/eingabe/fenster.js`, reine Tastenlogik ohne DOM): `[{ art, zustand }]`, Anzeige-Zustand in `src/main.js`, nicht im Spielzustand; das oberste Fenster bekommt jede Taste, Fenster kosten keine Spielzeit; Schema und Grammatik in [Oberflaeche.md](Oberflaeche.md)
+ Fensterarten melden sich mit `fensterartAnmelden(name, { taste })` an (ein Register der Eingabe, nicht das der Logik): `taste(zustand, { code, zeichen, umschalt }, kontext)` (kontext wie die Umgebung der Anzeige: `spiel`, `daten`, `texte`, `belegung`, `belegungsVorgabe`, `abweichungen`, `einstellungen`, `vorgaben`, `leisten` ...) gibt `{ zustand, oeffnen?, befehl?, auswahl?, grund?, start?, aktion?, leiste?, befehlszeile?, einstellungen?, abweichungen? }` zurück; alle Felder außer `zustand` und `oeffnen` reicht `fensterTaste` weiter; `zustand: null` schließt das Fenster, `befehl` geht an die Logik, `auswahl` leert den Stapel und öffnet den Zielmodus, `grund` nennt das Log, `oeffnen` legt ein Fenster auf, `start` beginnt einen Lauf mit Startoptionen, `aktion` führt `src/main.js` aus (Neustart, Vollbild, Beenden), `einstellungen` und `abweichungen` übernimmt es sofort und speichert sie, `befehlszeile` ist das Ziel eines Treffers, `leiste` ändert die Schnellleiste (`{ belegen: { stelle, platz } }` oder `{ entfernen: platz }`)
+ Arten: `einstellungen` (Spielmenü, Befehlszeile), `befehlszeile` (`:`), `inventar` (i, mit `absicht` aus d und w), `faehigkeiten` (f), `charakter` (c), `verlauf` (Tab), `karte` (m, `src/eingabe/karte.js`), `menue` (Esc ohne anderes Offenes), `bestaetigung`, `hilfe` (?, auch aus jedem Fenster), `erstellung` (vor jedem Lauf); nach dem Tod öffnen sich nur Menü, Hilfe, Verlauf und Karte
+ Inventar mit Absicht (Zustand `{ gewaehlt, absicht }`, `absicht` "fallenlassen" oder "werfen"): der Buchstabe lässt den Gegenstand gleich fallen bzw. öffnet den Zielmodus zum Werfen; Titel und Fußzeile nennen die Absicht
+ Spielmenü (`src/eingabe/menue.js`, Zustand `{ gewaehlt }`, Inhalt in `src/anzeige/systemfenster.js`): Fortsetzen, Hilfe und Einstellungen (legen sich darüber), Neuer Lauf (fragt über `bestaetigung` nach, abschaltbar mit `neustartNachfragen`), Beenden (`window.close()`; im Fenster aus `starten.py` erlaubt über `dom.allow_scripts_to_close_windows`, sonst nennt das Log Strg+W); Buchstabe wählt direkt, Pfeile oder j/k und Enter; der Fuß nennt Startwert und Version
+ Bestätigung (Zustand `{ frage, aktion }`): j, y oder Enter gibt die Aktion zurück, n oder Esc schließt; die Liste der bestätigungspflichtigen Fälle folgt mit den Einstellungen
+ Verlauf (`src/eingabe/verlauf.js`, Zustand `{ filter, versatz, suche, sucheAktiv }`): das ganze Log, 30 Zeilen je Seite, Filter `VERLAUF_FILTER` (alles, Geschehen, Kampf, Gefahr, Funde, Lernen, Hinweise) per Buchstabe, Pfeile oder j/k, Bild auf und ab, Pos1 und Ende blättern; `/` beginnt die Suche (Tippen filtert nach Text wie die Befehlszeile, Enter beendet die Eingabe, die Suche bleibt stehen), Esc löscht erst die Suche und schließt dann, Tab schließt
+ Ein Fensterinhalt darf `breit: true` angeben (Verlauf), dann ist er auch ohne Einzelheiten breit
+ Anzeige (`src/anzeige/fenster.js`, Inhalte von Charakter und Erstellung in `src/anzeige/charakterfenster.js`): je Art ein Inhalt `(umgebung, zustand) => { titel, kopf?, liste, details?, fuss }`, gezeigt wird nur das oberste Fenster, der Titel nennt den Weg durch den Stapel ("Charakter › Hilfe"); ohne Einzelheiten ist das Fenster schmal (600 statt 1100 px); ein offenes Fenster schluckt Klicks auf die Karte
+ Charakter und Skills (`src/eingabe/charakter.js`, Zustand `{ gewaehlt, eingabe }`): Kopf mit den sechs Eigenschaften (Grundwert, abweichender wirksamer Wert in Klammern) und den freien EP; Liste aus `skillUebersicht` nach Set und Tier mit Stufe (●●○○○) und "noch N EP"; gesperrte Skills ausgegraut, Skills mit `freischaltung` erst nach der Freischaltung sichtbar; Einzelheiten mit Tier, Stufe, EP bis zur nächsten und zur höchsten Stufe, Lerntempo in Prozent mit den Eigenschaften, Wirkung je Stufe (jetzt), Wirkungen ab Stufe, Voraussetzungen mit ✓ und ✗, ermöglichte Skills, Lernanlässe und Querlernen, dazu die Vorschau des Verteilens
+ Verteilen: Pfeile, Bild auf und ab (26 je Seite) und A bis Z wählen; Enter verteilt bis zur nächsten Stufe, Umschalt+Enter bis Stufe 5, Ziffern tippen eine Zahl, Rücktaste löscht, jeweils höchstens die freien EP; der Befehl ist `lernen` (ohne Spielzeit); Esc löscht erst die Zahl, dann schließt es; gesperrt oder ohne EP gibt es einen Grund statt eines Befehls
+ Lesefunktionen dafür in `src/systeme/skills.js`: `skillUebersicht`, `epBisStufe` (darauf `epBisHoechststufe`), `lernvorschau` (dieselbe Rechnung wie `epAufSkill`, ändert nichts), `lerntempoProzent` (100 bei 2 x primär + sekundär = `bezugswert`), `ermoeglicht`
+ Charaktererstellung (`src/eingabe/erstellung.js`, Zustand `{ eigenschaften, gewaehlt }`): vor jedem Lauf, auch nach Neuladen und Neustart; Pfeile hoch und runter wählen, links und rechts oder - und + ändern, A holt die ausgewogene Vorgabe (`eigenschaften` an Ninkasi in `daten/ninkasi.js`), Enter startet nur ohne Restpunkte (sonst Grund `punkte_uebrig`), Esc tut nichts; die zu verteilenden Punkte rechnet allein `punkteZuVerteilen` (bisher `eigenschaftPunkte`, später mit Makeln und Vorzügen), der Hilfetext füllt `{start}`, `{punkte}` und `{hoechstens}` aus `erstellungHilfewerte` (ein Fensterinhalt darf `hilfewerte` für die Hilfe zu ihm mitgeben); ohne Erklärtext im Fenster, die Erklärung steht in der Hilfe (`?`); vorbelegt mit der letzten gültigen Verteilung, die der Browser speichert (`battle-ninkasi.eigenschaften`); hinter dem Fenster liegt schon die Karte des Laufs, Enter beginnt ihn mit demselben Startwert und der Verteilung als Startoption
+ Hilfe (`src/eingabe/hilfe.js`) in zwei Arten: aus einem Fenster mit `?` geöffnet trägt sie dessen Art als Thema (`{ thema }`) und zeigt nur die Hilfe zum Fenster, den Text `hilfe.thema.<art>` (bisher Charaktererstellung und Charakter; sonst die allgemeine Erklärung der Fenster) und die Tasten aus der Fußzeile des Fensters darunter (`umgebung.darunter`); im Spiel ohne Fenster die allgemeine Hilfe mit allen Tasten, die aus Aktionskatalog und Belegung entstehen (`hilfeGruppen`), Tastennamen über `taste.<code>` in der Sprachdatei oder aus dem Code (`tastenname`, Buchstaben klein); Aktionen mit demselben Text stehen in einer Zeile (die zehn Plätze der Schnellleiste)

## Gefahrenprüfung

+ Reine Lesefunktionen in `src/systeme/gefahr.js`: Eine Lage ist ein Schnappschuss (sichtbare Feinde, LP), zwei Lagen werden verglichen
+ Prüfungen sind im Register "gefahren" angemeldet (`gegner_in_sicht`, `schaden`); Reise, Laufen, Rasten und Erkunden nutzen sie mit den Listen aus den Einstellungen, lange Aktionen mit der Liste aus den Regeln

## Bewegung

+ Vorbilder: Brogue (fliegende Wesen über Abgrund und Wasser, unbewegliche Totems, zerplatzende Würfe, Lärm des Aufschlags als Ablenkung), DCSS (Aufprall beim Stoß für beide, Teleport auf das nächste freie Feld), Into the Breach (vorhersagbarer Aufprall)
+ Bewegungsarten (`src/welt/karte.js`): am Wesen `bewegung`, Vorgabe `laufend`, sonst `fliegend`, `schwebend`, `phasend`, `unbeweglich`; ein Zustand überlagert sie mit `bewegung` (Levitation, Phasen), `bewegungVon` liefert die wirksame wie bei Fraktion und KI
+ Gelände: `passierbar: true` gilt für alle, `passierbarFuer: [Arten]` für einzelne (Abgrund für `fliegend`, Wasser für `fliegend` und `schwebend`); was eine Art kann, sagen also die Daten; `phasend` betritt jedes Gelände außer `undurchdringlich: true`; `unbeweglich` steht, wo `laufend` steht
+ `betretbar(spiel, wesen, feld)` gilt für Schritte, Wege (Option `bewegung` in `src/welt/wege.js`), Schrittwahl der KI, Beschwören, Reise und Erkunden; Sicht und Lärm hängen weiter am Gelände selbst
+ Unbeweglich: der Schritt auf ein freies Feld wird mit `unbeweglich` abgelehnt, Angreifen durch Hineinlaufen geht; `jagen` setzt Fähigkeiten ein, greift an, was daneben steht, und wartet sonst; Stoßen, Ziehen, Tauschen und Teleportieren wirken nicht
+ Alles, was Wesen bewegt, läuft über `versetzen(spiel, wesen, feld, art, { urheberId, kettentiefe })` (`src/systeme/bewegung.js`) mit den Haken `verlaesst_feld` und `betritt_feld` (Ziel das bewegte Wesen, Quelle wer es bewegt, `position` das Feld, `art` `schritt`, `stoss`, `zug`, `tausch`, `teleport` oder `herausgedrueckt`); Grundlage für Fallen (Punkt 8) und den räumlichen Index (Punkt 7)
+ Bausteine (`src/systeme/verschieben.js`):
  + `stossen { weite, wuerfel|menge, art? }`: weg vom Ursprung entlang der verlängerten Linie durch das Ziel (Schlag: die Angreiferin, Explosion: die Mitte; liegt der Ursprung auf dem Ziel, zählt die Quelle); Feld für Feld, bis ein Hindernis aufhält: festes Gelände, das das Ziel nicht betreten kann, ein Wesen, der Kartenrand; dann Aufprall mit der Menge je verbliebenem Feld als Schaden (`art` Vorgabe `stumpf`, Tag `aufprall`), ein Wesen als Hindernis bekommt denselben Schaden; die Menge steht am Baustein und läuft durch die gewöhnliche Schadensrechnung, so skaliert sie über die Daten, Modifikatoren der Urheberin und Rüstung des Ziels; Meldung `gestossen`
  + Gelände, das das Ziel nicht betreten kann, aber nicht fest ist (Abgrund, Wasser), hält nicht auf: das Ziel landet darin, die Lageprüfung folgt
  + `ziehen { weite }`: zum Ursprung hin, höchstens bis daneben, Hindernisse halten ohne Schaden auf; Meldung `gezogen`
  + `tauschen`: Quelle und Ziel tauschen die Plätze, wenn jedes das Feld des anderen betreten kann; Meldung `getauscht`
  + `teleportieren { wer?, muster?, zufaellig? }`: das Ziel (mit `wer: "quelle"` die Quelle, z.B. Blinzeln) aufs Zielfeld, mit `muster` auf ein zufälliges freies Feld des Musters, mit `zufaellig` auf ein zufälliges freies Feld der Ebene; ist das Zielfeld besetzt oder nicht betretbar, aufs nächste freie (Breitensuche); gezogen wird aus einer festen Reihenfolge; Meldung `teleportiert`
+ Lage (Zustandsprüfung nach jedem Vorgang, nach dem Tod): steht ein lebendes Wesen auf einem Feld, das es mit seiner wirksamen Bewegungsart nicht betreten kann (Phasen endet in der Wand, Levitation über dem Abgrund, hineingestoßen), wirkt `beimFestsitzen` des Geländes, sonst `regeln.bewegung.beimFestsitzen` (`eingeklemmt`, 2W6 stumpf, vorläufig); lebt es danach, wird es aufs nächste freie Feld gedrückt; Meldungen `festgesessen` und `herausgedrueckt`; der Sturz in einen Abgrund folgt mit den Ebenen (Punkt 8)
+ Werfen (`src/systeme/werfen.js`): Befehl `{ art: "werfen", gegenstandId, ziel: { x, y } | { id } }` entlang der Bahn eines Geschosses (bis zum ersten Wesen oder vor die Wand), Reichweite `wurf.reichweite` am Gegenstand, sonst `regeln.werfen.reichweite` (6), Zeitkosten `aktionen.werfen`; mit `wurf: { effekt }` zerbricht der Gegenstand am Aufschlag und der Effekt wirkt dort (Ziel das getroffene Wesen, Ursache `wurf`), sonst landet er auf dem Feld; am Aufschlag entsteht Lärm (`laermWurf` 4), dem Wache nachgehen; Meldungen `geworfen`, `geschoss`, `zerbrochen` bzw. `gelandet`; Gründe der Ablehnung `nichts_zu_werfen` und die der Zielauswahl; im Browser über das Inventarfenster (W) und den Zielmodus
+ Werfen gibt es bisher nur in Logik, Tests und Bot; der Zielmodus der Oberfläche für Werfen und Fähigkeiten folgt (siehe [Systemausbau.md](Systemausbau.md))

## Gelände

+ Vorbild Brogue: Türen öffnen sich beim Hindurchgehen und schließen sich von selbst, Fallen sind verborgen, bis man sie entdeckt; Wesen der Ebene kennen ihre Fallen
+ Jede Geländeart hat einen Namen (`text`) für Untersuchen und Tooltip
+ Veränderliches Gelände (`src/systeme/gelaende.js`): `gelaendeSetzen(spiel, feld, name)` ändert ein Feld der Karte (sie bleibt eine Liste von Zeichenketten), meldet `gelaende_geaendert`, berechnet Ninkasis Sichtfeld neu, wenn das Feld in ihrer Sichtweite liegt, und merkt Wesen darauf für die Lageprüfung vor (eine Wand auf ihrem Feld klemmt sie ein, siehe Bewegung)
+ Bausteine `gelaende_setzen { gelaende, muster? }` (Zielfeld oder Felder des Musters) und `gelaende_zerstoeren { muster? }` (Gelände mit `zerstoerbar: { wird }` wird zu `wird`, z.B. eine Tür zu Boden); Parameterart `gelaende` in der Datenprüfung
+ `geschossdurchlaessig` am Gelände: Vorgabe wie `durchsichtig`; ein Gitter ist undurchsichtig, lässt aber Geschosse durch, Glas umgekehrt; die Sichtlinie bleibt davon unberührt
+ Befehl `benutzen { dx, dy }` auf ein Nachbarfeld oder das eigene: Gelände mit `beimBenutzen: effekt` (Hebel, Schalter), Ziel des Effekts ist das Feld, Ursache `benutzen`, Meldung `benutzt`, Zeitkosten `aktionen.benutzen`; Ablehnung `nichts_zu_benutzen`; Hebel mit Wirkung in der Ferne brauchen Themenräume (Punkt 10)
+ Türen: zwei Geländearten, die geschlossene mit `tuer: { offen }`, die offene mit `tuer: { zu }`; betritt ein Wesen, das Türen öffnet, die geschlossene, geht sie auf (Haken `betritt_feld`), verlässt das letzte Wesen die offene und liegt nichts darin, geht sie zu (`verlaesst_feld`); geschlossen versperrt sie die Sicht und dämpft Lärm (`laermdaempfung` 3)
+ Wer Türen öffnet, steht am Wesen: `tueren: "oeffnen"` (Vorgabe) oder `"nicht"`; Bakterien öffnen keine, eine geschlossene Tür hält sie auf; für sie ist die Tür wie eine Wand, auch in der Wegfindung (Option `oeffnetTueren`)
+ Die Ebene setzt Türen an die Zugänge der Räume, die rot.js meldet, mit `tuerChance` Prozent und eigenem abgeleitetem Zufall; in Türöffnungen entsteht nichts
+ Fallen (`src/systeme/fallen.js`, Daten in `daten/fallen.js`): Entitäten auf einem Feld mit `falle: { tarnung, effekt, ausloesenFuer? }` und `verborgen` (Vorgabe ja); die Ebene legt sie nach `fallen: [{ typ, anzahl }]`
+ Auslösen am Haken `betritt_feld`, nur für die Bewegungsarten in `ausloesenFuer` (Vorgabe `laufend`), Quelle die Falle, Ursache `falle`, eine Kettenstufe tiefer; danach gilt sie als entdeckt (`entdeckt`), Meldung `falle_ausgeloest`; Fallen wecken nicht und ziehen keinen Zorn auf sich (das gilt nur für Wesen als Urheberin)
+ Entdecken am Haken `zug_ende`, nur für Ninkasi: für jede verborgene Falle, die sie sieht und die höchstens `regeln.fallen.reichweite` (5) entfernt ist, ein Wurf mit E / (E + Tarnung), E = Entdecken × 2 / (1 + Abstand); Entdecken ist ein Kampfwert (Vorgabe `regeln.fallen.entdeckenVorgabe` 30), Skills ändern ihn über Modifikatoren; Beispiel Entdecken 30 gegen Tarnung 30: daneben 50 %, auf 3 Felder 33 % je Zug; Meldung `falle_entdeckt`
+ Die Anzeige zeigt Fallen erst, wenn sie bekannt sind (`istBekannt`); Wesen mit KI meiden alle Fallen, Reise und Erkunden die entdeckten (Option `meiden` der Wegfindung); liegt eine entdeckte Falle in einem Gang ohne Umweg, hält die Reise mit `kein_weg`
+ Im Spielinhalt (Zahlen vorläufig): Säuredüse (Tarnung 40, 2W4 Säure) und Klappergeschirr (Tarnung 20, Lärm 14, weckt die Nachbarschaft); Türen und Fallen haben noch keine Tiles, nur Zeichen

## Feldschichten

+ Vorbild Brogue: je Feld höchstens eine Gasart, die sich auf die Nachbarn verteilt und je Art verfliegt; dichter Rauch versperrt die Sicht; Feuer springt nach der Brennbarkeit der Nachbarn über, verbrennt Brennbares und erzeugt Rauch; Monster meiden Feuer und schädliches Gas
+ Drei Schichten neben der Karte in `zustand.ebene.schichten`, nur belegte Felder: `oberflaeche` und `gas` mit `{ art, menge }`, `feuer` mit `{ menge }` (Brenndauer in Weltticks); Datenzugriff in `src/welt/schichten.js`, alles Weitere in `src/systeme/schichten.js`, Arten in `daten/schichten.js` (`oberflaechen`, `gase`), Feuer in `regeln.feuer`, Obergrenzen in `regeln.schichten`
+ Je Feld und Schicht höchstens eine Art: gleiche Art addiert bis `hoechstens` (Vorgabe aus den Regeln), auf der Oberfläche verdrängt eine andere Art die alte, beim Gas behauptet sich die größere Menge
+ Oberfläche (nur auf passierbarem Gelände): `schwund` je Welttick (ruht, solange das Feld brennt), `beimBetreten` (Haken `betritt_feld`), `jeTick` auf Wesen darin, beides für `ausloesenFuer` (Vorgabe `laufend`, `unbeweglich`), `brennbar`, `brenndauer`, `verbrenntZu`, `ausbreitung: { chance }` auf ein Nachbarfeld ohne Oberfläche (Myzel), `gefaehrlich` (Wege meiden sie)
+ Gas (nur auf gasdurchlässigen Feldern: `gasdurchlaessig` am Gelände, Vorgabe wie passierbar; Wände und geschlossene Türen halten es auf): je Welttick Quellen am Gelände (`quelle: { gas, menge }`, ein undurchlässiges Gelände wie der Gärbottich gibt sein Gas gleichmäßig an die durchlässigen Nachbarn ab), Ausgleich, Abbau, Wirkung
+ Ausgleich: je Paar aus Gasfeld und Nachbar fließt ein Neuntel des Unterschieds vom volleren ins leerere Feld, abgerundet, alles aus dem alten Stand berechnet; die Gesamtmenge bleibt genau erhalten, verschiedene Gase vermischen sich nicht
+ Abbau `abbau` in Prozent je Tick; der Bruchteil wird gewürfelt (1 % von 50 ist mit 50 % Chance 1), so bleiben auch kleine Mengen nicht ewig und große bauen sich im Mittel genau ab
+ Wirkung über `stufen: [{ ab, effekt, wenn? }]`: je Welttick die höchste erreichte Stufe, deren `wenn` am Wesen gilt, z.B. CO2 ab 30 benommen, ab 70 Ersticken, beides nur ohne den Tag `anaerob`; `undurchsichtigAb` lässt dichtes Gas die Sicht versperren (Ninkasis Sichtfeld wird dann je Welttick neu berechnet), Geschosse fliegen hindurch
+ Feuer je Welttick und brennendem Feld: `regeln.feuer.brennen` auf Wesen darin (auch beim Betreten), Rauch (`regeln.feuer.rauch`, `rauchMenge`), Übergreifen auf jedes nicht brennende Nachbarfeld mit der Chance seiner Brennbarkeit (die höchste aus Gelände, Oberfläche und Gas); dann sinkt die Menge um 1, erlischt das Feuer, verbrennen Oberfläche und Gelände zu `verbrenntZu` (eine Holztür zu Boden), neu entzündete Felder brennen ab dem nächsten Tick
+ Brennbares Gas fängt auf einmal Feuer, verschwindet und wirkt `explodiert` am Feld (Verpuffung)
+ Bausteine: `oberflaeche_setzen { art, menge, muster? }`, `gas_setzen { art, menge, muster? }`, `entzuenden { muster? }` (nur wo etwas brennt); Parameterarten `oberflaeche` und `gas` in der Datenprüfung
+ Wiederholbar: alle Würfe über den Spiel-Zufall, immer nach Feldindex aufsteigend; die Weltuhr bearbeitet nur belegte Felder; die Liste der Gasquellen hält der `zwischenspeicher`, `gelaendeSetzen` verwirft sie
+ Wege: die KI meidet Feuer und Gefährliches (`gefahrenMeiden`, zusammen mit den Fallen über `meidenZusammen`), Reise und Erkunden ebenso
+ Anzeige: farbige Überlagerung auf sichtbaren Feldern, Oberfläche und Feuer unter den Entitäten, Gas darüber mit der Menge zunehmend deckend; Farben in `zeichen.schichten`; Tiles folgen
+ Im Spielinhalt (Zahlen vorläufig): die Säuredüse hinterlässt Säure (verätzt 1W3 je Tick, trocknet); drei Gärbottiche je Ebene im Inneren der Räume (Gelände-Objekte, sperren keinen Durchgang) geben CO2 ab, das sich hinter geschlossenen Türen sammelt; drei Brandflaschen je Ebene zerspringen beim Wurf zu Hochprozentigem und entzünden es; Feuer 1W6, Rauch ab 40 undurchsichtig, ab 60 Husten; Benommenheit und Ersticken sind vorläufig Giftschaden, bis es Zustände im Spielinhalt gibt

## Inventar

+ Vorbilder: NetHack (Last in Stufen, jede bremst mehr), Brogue und DCSS (Stapel gleicher Gegenstände)
+ Code in `src/systeme/inventar.js`: Befehle `aufheben`, `trinken`, `fallenlassen { gegenstandId }` (der ganze Stapel aufs eigene Feld, Angelegtes wird dabei abgelegt, Meldung `fallengelassen`, Zeitkosten `aktionen.fallenlassen`)
+ Stapel: `stapelbar: true` am Gegenstand, `anzahl` an der Entität (Vorgabe 1); beim Aufheben fließt ein Gegenstand in einen Stapel, der in allen übrigen Komponenten gleich ist (`insInventar`), so stapeln sich z.B. Sauerbier und Bier nicht; nur der Zeitpunkt des Verderbens zählt nicht, er wird gemittelt (siehe Verschleiß); Trinken, Werfen und Material für Fähigkeiten nehmen einen (`einenAbnehmen` spaltet dafür einen ab), Fallenlassen den ganzen Stapel; auf dem Boden fließt nichts zusammen
+ Ladungen: `ladungen: { hoechstens, gewichtJe? }`, der Stand in `ladungen.aktuell` (Vorgabe `hoechstens`); Trinken nimmt eine Ladung; ein Gegenstand mit Ladungen stapelt sich nicht
+ Behälter: `wirdZu: Typ` kommt nach dem letzten Gebrauch ins Gepäck (Bier zu leerer Flasche, Bierfass zu Fass), Grundlage für das Brauen
+ Gewicht `gewicht` in Gramm, mit Ladungen zuzüglich `gewichtJe` je Ladung; die Last ist die Summe über das Gepäck, Angelegtes eingeschlossen (`lastVon`)
+ Tragkraft `tragkraft` am Wesen, sonst `regeln.tragen.tragkraft` (20 kg), mit Modifikatoren auf `tragkraft` (Skills folgen mit dem Skillsystem); Überladung nach `regeln.tragen.stufen` (ab 100 % Bewegen +25 %, ab 150 % +100 %), verboten ist nichts; der Zuschlag wirkt in `zeitkosten` (`src/kern/spiel.js`) nur aufs Bewegen und nach allen Modifikatoren
+ Anzeige: das Inventarfenster zeigt Stapel (x 3), Ladungen (19/20), Angelegtes und die Last (Last 3,2 / 20 kg, rot "überladen"), die Seitenleiste nur die Last; im Inventarfenster F fallen lassen
+ Im Spielinhalt (Zahlen vorläufig): Bier 900 g, stapelbar, wird zur leeren Flasche (400 g, stapelbar) und verdirbt zu Sauerbier; Bierfass mit 20 Schlucken zu einer Halben, 2 kg Holz und 500 g je Schluck, voll 12 kg, wird zum Fass; Brandflasche 900 g, stapelbar; Ausrüstung von 20 g (Kupferring) bis 6 kg (Fasshammer)

## Ausrüstung

+ Vorbilder: Brogue (wenige Plätze), DCSS (Tauschen in einem Befehl), NetHack (Flüche, unbekannt bis zum Anlegen), Caves of Qud (Ereignisse laufen auch durch die Ausrüstung der Trägerin)
+ Plätze am Wesen: `plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 }` (Ninkasi); die Namen stehen in `regeln.ausruestung.plaetze`; Waffen in den Händen, Rüstung und Schmuck an Kopf, Brust, Beinen, Hals und zwei Fingern
+ Gegenstand: `ausruestung: { platz, belegt?, angriffe?, modifikatoren?, ausloeser?, anforderung?, abzugJePunkt? }` und `tags` am Gegenstand (Anforderungen siehe Skills und Lernen); `belegt` (Vorgabe 1) zählt die Stellen, ein Zweihänder belegt beide Hände (`src/systeme/ausruestung.js`)
+ Angelegt ist, was in `ausgeruestet: [IDs]` steht; der Gegenstand bleibt im Inventar; `ausDemInventarNehmen` (`src/kern/zustand.js`) nimmt ihn aus beidem (Trinken, Werfen, Fallenlassen, Entfernen), beim Tod fällt alles mit dem Inventar zu Boden; angelegte Gegenstände stapeln sich nicht und sind kein Material
+ Befehle `anlegen { gegenstandId }` und `ablegen { gegenstandId }`; ist der Platz voll, legt derselbe Befehl die ältesten Gegenstände dort ab, bis genug frei ist, und kostet beides (`aktionen.anlegen` plus je `aktionen.ablegen`); Ablehnungen `nicht_im_gepaeck`, `nicht_anlegbar`, `schon_angelegt`, `kein_platz`, `nicht_angelegt`, `verflucht`; Meldungen `angelegt`, `abgelegt`
+ Modifikatoren angelegter Gegenstände wirken über die Modifikatorquelle `ausruestung` (Quelle `ausruestung:<id>`), z.B. Rüstung und der Abzug aufs Ausweichen bei schwerer Rüstung; Sets über die Bedingung `traegt_tag { tag, anzahl }` an einem gewöhnlichen Modifikator
+ Waffen: angelegte Gegenstände mit `angriffe` ersetzen die eigenen Profile des Wesens (die Faust), zwei Waffen sind zwei Profile, die Aktion kostet so viel wie das langsamste (`angriffeVon` in `src/systeme/kampf.js`)
+ Auslöser an der Ausrüstung gelten für die Trägerin, nach ihren eigenen und denen ihrer Zustände (siehe Auslöser)
+ Fluch: `verflucht: true` am Gegenstand; angelegt lässt er sich weder ablegen noch fallen lassen, werfen oder beim Anlegen eines anderen wegtauschen (Ablehnung `verflucht`); bekannt wird der Fluch erst beim Anlegen (`fluchBekannt`, Meldung `fluch_entdeckt`, im Gepäck "verflucht"); beim Tod fällt er mit allem anderen; der Baustein `fluch_aufheben` nimmt die Flüche aller angelegten Gegenstände des Ziels (Meldung `fluch_aufgehoben`), einen Gegenstand dafür gibt es noch nicht
+ Angefressene Ausrüstung wirkt schwächer (siehe Verschleiß): die Vorteile ihrer Modifikatoren (`plus` und `prozent` über 0, `mal` über 100) sinken im Verhältnis der Haltbarkeit (`haltbarkeitProzent`, skaliert wie bei den Zuständen), Nachteile bleiben voll; eine zerfressene Platte schützt kaum noch und bleibt doch schwer
+ Haken `gegenstand_benutzt` mit `gegenstandId` und `art` (`trinken`, `werfen`, `anlegen`, `ablegen`)
+ Inventarfenster über der Karte (`src/eingabe/inventar.js`, Fensterart `inventar`, reine Tastenlogik, Zustand nur in der Anzeige): I öffnet, A bis Z wählt, dann T trinken, A anlegen oder ablegen, W werfen (weiter im Zielmodus), F fallen lassen, Esc zurück oder zu; Angelegtes ist im Gepäck markiert
+ Im Spielinhalt (Zahlen vorläufig, `daten/ausruestung.js`): Schöpfkelle (Hand, flink), Fasshammer (beide Hände, langsam, Ausweichen -5), Lederschürze (Brust, Rüstung 2, Ausweichen -5), Kupferhelm (Kopf), Lederhose (Beine), Hopfenkette (Hals, LP-Regeneration +20 %), zwei Kupferringe (Finger); Kupferhelm und Kupferringe bilden ein Set (Willenskraft); Lederschürze und Lederhose (Haltbarkeit 20, werden zu Lederfetzen) und Kupferhelm (30, wird zu Kupferschrott) nutzen sich unter Säure ab

## Verschleiß

+ Code in `src/systeme/verschleiss.js`; Vorbilder NetHack (Säure frisst in Stufen, angefressen schützt weniger) und Brogue (Säure greift Rüstung an)
+ Verderben: `verdirbt: { nach, wird }` am Gegenstand; beim Erzeugen bekommt er den Zeitpunkt `verdirbtUm` und ein gebundenes Zeitereignis `verderben` (`verderbenEinplanen` in `src/systeme/inventar.js`); zur Zeit wird er zum Typ `wird`, am selben Ort oder im selben Gepäck, mit derselben Anzahl (`gegenstandErsetzen`, Meldung `verdorben`)
+ Stapel: fließen zwei zusammen, gilt der nach Anzahl gewichtete Durchschnitt beider Zeitpunkte, abgerundet; die Restzeit aller Stücke bleibt so in Summe gleich, dafür verdirbt der Stapel auf einmal; ein abgespaltenes Stück behält den Zeitpunkt und bekommt sein eigenes Zeitereignis; die Datenprüfung verlangt, dass ein stapelbarer Gegenstand zu einem stapelbaren verdirbt
+ Auf verlassenen Ebenen ruht das Verderben mit (`verdirbtUm` rückt wie die Zeitereignisse nach), was Ninkasi trägt, verdirbt weiter
+ Haltbarkeit: `haltbarkeit: { hoechstens, wirdZu }` an Ausrüstung (beides Pflicht, nicht stapelbar), der Stand in `haltbarkeit.aktuell` (Vorgabe `hoechstens`)
+ Abgenutzt wird nur über den Baustein `abnutzen { platz?, wuerfel | menge }`, nicht durch Gebrauch (Zuschlagen, Getroffenwerden): er trifft einen angelegten Gegenstand des Ziels mit Haltbarkeit, mit `platz` nur dort, sonst zufällig einen davon (Meldung `abgenutzt`)
+ Bei 0 ist der Gegenstand kaputt: die Zustandsprüfung `kaputt` nach Tod und Lage macht ihn zu `wirdZu`, abgelegt und ins Gepäck der Trägerin (Meldung `kaputt`); er verschwindet also nie ganz
+ Anzeige im Gepäck: unter 75 % "angefressen", unter 50 % "stark angefressen", unter 25 % "zerfressen", jeweils mit dem Prozentwert
+ Im Spielinhalt (Zahlen vorläufig): Bier verdirbt nach 50000 Zeiteinheiten (500 Weltticks) zu Sauerbier (LP +5, Pegel +0,3 ‰ statt +20 und +0,5 ‰); das Bierfass verdirbt nicht; Biss der Essigbakterien und Säurespritzer nutzen 1 ab, Säureschwall und Säuredüse 2

## Unbekanntes

+ Code in `src/systeme/kennen.js`; Vorbild Brogue: je Lauf zufällig zugeordnete Etiketten, erkannt wird immer die ganze Art, das Wissen gilt für den Lauf
+ Am Typ: `unbekannt: { gruppe, schwierigkeit }`; Etiketten je Gruppe in `daten/etiketten.js` (Textschlüssel mit Hauptwort, je Gruppe mindestens so viele wie Typen)
+ Beim Spielstart, vor der ersten Ebene, ordnet `etikettenZuordnen` jedem unbekannten Typ ein Etikett seiner Gruppe zu, mit dem abgeleiteten Zufall `"etiketten"`; das Wissen steht im Zustand: `wissen: { etiketten: { typ: etikett }, erkannt: [typ], vertrautheit: { typ: Zahl } }`
+ Ein Gegenstand eines noch nicht erkannten Typs bekommt beim Erzeugen `etikett`; Bezüge und Anzeige nennen dann das Etikett (siehe Ereignisse); beim Erkennen verlieren alle Gegenstände dieses Typs ihr Etikett, auch auf verlassenen Ebenen (Meldung `erkannt`)
+ Nur Ninkasi erkennt; Gegner verraten nichts
+ Trinken erkennt sofort, die Wirkung spürt man
+ Benutzen erhöht die Vertrautheit der Art: je Welttick, in dem Rüstung oder Schmuck angelegt ist, und je Angriff mit einem Profil einer Waffe (Haken `vor_angriff`); mit jeder Erhöhung ein Wurf `(vertrautheit + kennerschaft) / (vertrautheit + kennerschaft + schwierigkeit)`, dieselbe Form wie die Kampfwerte, die Chance nähert sich mit der Zeit 100 %; Schwierigkeit 0 erkennt beim ersten Mal
+ Aufheben: ein Wurf `kennerschaft / (kennerschaft + schwierigkeit)`, ohne Kennerschaft keiner
+ `kennerschaft` ist ein Kampfwert (Vorgabe 0, Modifikatoren mit gleichnamigem Ziel); später hebt ihn ein Skill mit Sinnlichkeit und Braukunde ([Charakter.md](Charakter.md))
+ Fluch und Art sind getrennt: der Fluch zeigt sich beim Anlegen (siehe Ausrüstung), die Art erst durch Vertrautheit
+ Im Spielinhalt noch ohne unbekannte Gegenstände; die Gruppe `biere` (Tonkrug, Steinkrug, Bügelflasche, Henkelflasche, Bocksbeutel) wartet auf die Biersorten

## Ebenen

+ Vorbilder: Brogue und DCSS (Ebenen bleiben erhalten, Treppen verbinden sie), Grundlagen (Hub zwischen den Ebenen)
+ Abfolge der Tiefen in `daten/index.js`: `abfolge: ["hub", "keller", "keller", "keller"]` (Tiefe 0 ist der Hub), `starttiefe: 1`; mehrere Tiefen dürfen dieselbe Vorlage aus `daten/ebenen.js` nutzen, jede bekommt ihren eigenen abgeleiteten Zufall (`ebene.<tiefe>.<name>`), ist je Startwert also wiederholbar und doch verschieden
+ Erzeugung (`src/welt/ebene.js`, `ebeneErzeugen(spiel, tiefe)`): eine feste Karte (`karte`: Zeilen aus Geländekennungen, z.B. der Hub) wird übernommen; sonst Digger von rot.js mit Treppe hinauf in der Mitte des ersten Raums und Treppe hinab in der Mitte des Raums, der davon am weitesten entfernt ist, jeweils nur, wenn es die Tiefe gibt; Ninkasi legt die Erzeugung nicht an, sie gibt die Treppen zurück; zu Beginn steht Ninkasi auf der Treppe hinauf der Starttiefe
+ Treppen sind Gelände mit `treppe: "ab"` oder `"auf"`; Befehl `{ art: "treppe" }` (Taste <> auf deutscher Tastatur), nur für Ninkasi, Ablehnung `keine_treppe`, Zeitkosten `aktionen.treppe`; Meldung `ebene_gewechselt` mit `tiefe` und `richtung`
+ Wechsel (`src/systeme/ebenen.js`): die alte Ebene kommt mit allen Entitäten außer Ninkasi und dem, was sie trägt, und deren Einträgen der Warteschlange (Akteure, gebundene Zeitereignisse) samt Zeitpunkt nach `zustand.abgelegteEbenen[tiefe]`; die Weltuhr gehört keiner Ebene und läuft weiter
+ Verlassene Ebenen ruhen: bei der Rückkehr rücken alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände) um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt und ihre Wesen eingereiht; Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien Feld
+ Der Wechsel verwirft den räumlichen Index (siehe Leistung); nur hier wird Ninkasis Position deshalb direkt gesetzt, der Index entsteht danach neu; Gasquellen und andere Vorräte im `zwischenspeicher` hängen an der Ebene und entstehen ebenso neu
+ Wesen folgen Ninkasi nicht über Treppen; Nachholen der Zeit verlassener Ebenen (Population wächst auf eine Tragfähigkeit zu) kommt mit Punkt 10 der Arbeitsliste
+ Population nach Tiefe (`population: { tabelle, anzahl: [min, max] }` an der Ebene, Tabellen in `daten/populationen.js`): Einträge `{ typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }`; je Wurf gewichtet unter den Einträgen der Tiefe, mit `regeln.population.tieferChance` (10 %) aus einer bis zu `tieferBis` (2) Tiefen tieferen; ein Rudel steht beieinander (jedes weitere Mitglied auf dem freien Feld, das dem ersten am nächsten liegt), Affixe sind Zustände beim Erzeugen; findet ein Wurf nichts, fällt er aus; eine feste Liste `gegner` geht weiterhin
+ Im Spielinhalt (Zahlen vorläufig): der Hub ist ein leerer Raum mit Treppe hinab (Dienste folgen), drei Kellertiefen mit 16 bis 20 Wesen, Essigbakterien in Rudeln von 1 bis 3, Fernkämpfer ab Tiefe 2 häufiger; Treppen haben noch keine Tiles

## Wegfindung

+ Ein gemeinsames Modul `src/welt/wege.js` für KI und Reise, AStar aus rot.js mit acht Richtungen, je Bewegungsart (Option `bewegung`), mit oder ohne Türen (`oeffnetTueren`) und mit Feldern, die gemieden werden (`meiden`, z.B. Fallen)
+ Optionen: nur erkundete Felder (Spielerin, keine Hellseherei), Wesen meiden
+ Später: Kosten je Gelände (Fallen meiden), dann für KI und Spielerin zugleich

## Prototyp

+ Stand 0.4.0, begonnen als 0.0.0; 0.1.0 Maus und Reise, 0.2.0 Tiles im Spiel, 0.3.0 Pegel in Promille, Psi-Punkte und Stoffwechsel, 0.4.0 Tod als Zustandsprüfung, Katalog der Haken, Auslöser aus Daten
+ Umfang: Hub und drei Kellertiefen, Bewegen, Sichtfeld, ein Gegnertyp, Nahkampf, ein Getränk, Pegel, Log
+ Tiles in allen vier Sätzen (ab 0.2.0), Zeichen nur noch als Absicherung
+ rot.js 2.2.1 (Lizenz BSD-3-Clause) liegt unverändert als ES-Module in `lib/rot/`, mit `LICENSE.txt`; benutzt werden Digger (Dungeon), PreciseShadowcasting (Sichtfeld) und AStar (Wegfindung der Gegner); Warteschlange und Spiel-RNG sind eigener Code, da sie als JSON speicherbar sein müssen
+ Starten: im Hauptverzeichnis `python -m http.server`, dann `http://localhost:8000/`; Startwert per `?seed=1234`, sonst zufällig, er wird in die URL geschrieben
+ Testen: `node werkzeuge/bot.js [Läufe] [Befehle] [erster Startwert]` spielt mit zufälligen Befehlen, prüft Invarianten (u.a. kein Wesen mit Lebenswert 0, nichts Getragenes ohne Trägerin, keine verwaisten Zeitereignisse, keine liegengebliebenen Auslöser) und vergleicht den Zustand nach dem Nachspielen; am Ende zählt er, wie oft Gegner Fähigkeiten gewirkt, lange Aktionen begonnen und abgebrochen haben und wie oft Ninkasi geworfen hat; er reist auch zu bekannten Treppen und wechselt die Ebene
+ Ebene "keller" (Tiefen 1 bis 3): 120x40 Felder, 16 bis 20 Wesen aus der Population (Essigbakterien in Rudeln, Fernkämpfer-Tests), 10 Biere, 3 Brandflaschen, 3 Gärbottiche, je 6 Säuredüsen und Klappergeschirre, je ein Stück Ausrüstung (zwei Kupferringe), Türen an der Hälfte der Raumzugänge, Treppen hinauf und hinab; Ebene "hub" (Tiefe 0) als feste Karte
+ Ninkasi: 100 LP, 100 MP, 0 von 100 PP, Pegel 0 (nach oben offen), Sichtweite 8, Nahkampf 1W6+2 stumpf mit Genauigkeit 80 (80 % gegen ein Wesen ohne Ausweichen)
+ Essigbakterium: 15 LP, Biss 1W4 mit 70%, Verhaltensmodul "jagen" (sieht es Ninkasi, folgt es ihr, sonst geht es zur letzten bekannten Position und wartet)
+ Fernkämpfer-Test (ab 0.15.0, Zeichen F, noch ohne Tile): Testgegner für die KI mit Fähigkeiten, 10 LP, hält 3 Felder Abstand, Säurespucke (Geschoss über Verbündete, Abklingzeit 3) und angekündigter Säureschwall (Kreis mit Radius 1 auf das Feld beim Beginn, 3 Schritte, durch Schaden unterbrechbar, 30 %); Zahlen vorläufig
+ Bier: aufheben mit G, trinken mit T; +20 LP, Pegel +0,5 ‰; die Flasche bleibt; ein Bierfass mit 20 Schlucken je Ebene
+ Stoffwechsel je Welttick, Zahlen vorläufig in `daten/ninkasi.js`: LP 0,3 nüchtern, 0,8 bei 1,5 ‰, darüber abnehmend; MP 0,8 nüchtern, 0 ab 3 ‰; PP Schwund 0,3 nüchtern, Stillstand von 0,5 bis 1,5 ‰, dann steigend bis 1,0 bei 4 ‰; danach Abbau des Pegels um 0,01 ‰
+ Schwellen 0,5, 1, 2 und 3 ‰ werden angezeigt und gemeldet, haben aber noch keine Wirkung; die Leiste zeigt zusätzlich das Optimum der LP
+ Alle Aktionen kosten 100
+ Tasten: Ziffernblock zum Bewegen, 5 Warten, <> Treppe, I Inventar, +/- Zoom (16, 32, 48, 64 px), Tab klappt das Log auf, Eingabe startet nach dem Tod einen neuen Lauf
+ Maus (ab 0.1.0): Klick reist, greift an oder hebt auf, Rad zoomt, siehe Maus, Reise, Rasten und Erkunden
+ Nicht enthalten: Vollbild, ganzzahlige Skalierung für 4K, Umschauen, Markierungen für Gegner außerhalb des Ausschnitts, Prüfsumme der Daten, Englisch (Übersichtskarte und Speichern seit 0.29.0)
+ Vereinfachung: Ein Gegner sieht Ninkasi, wenn sie ihn sieht und er innerhalb seiner Sichtweite steht
+ Auslöser sind im System vorhanden, im Spielinhalt aber noch nicht benutzt
+ Fehlende Strukturen stehen als Arbeitsliste in [Systemausbau.md](Systemausbau.md)

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

## Tests und Balancing

+ Die Logik läuft in Node ohne Browser
+ Unittests mit dem in Node eingebauten `node:test` und `node:assert`, ohne Abhängigkeiten; Dateien in `tests/`, benannt nach dem geprüften Modul mit Endung `.test.js` (z. B. `tests/wege.test.js`); Aufruf `node --test` im Hauptverzeichnis
+ Testpflicht gilt für die Spiellogik (`src/kern/`, `src/systeme/`, `src/ki/`, `src/welt/`): Jede Änderung dort bringt Tests mit oder begründet im Vorschlag, warum keine nötig sind
+ Tests prüfen Regeln und Ergebnisse (Trefferchance, Schwellen, Wege, Gefahrenprüfung), nicht die innere Umsetzung; Zufall immer über festen Startwert
+ Anzeige und Eingabe (`src/anzeige/`, `src/eingabe/`) sind ausgenommen, soweit sie keine eigene Logik enthalten; reine Logik dort (z. B. Klickregeln, Grammatik) wird ebenfalls getestet
+ Vor jedem Commit laufen `node --test` und `node werkzeuge/bot.js` fehlerfrei
+ Arena-Simulationen: Ninkasi mit Ausrüstung und Skills X gegen Gegner Y, tausendfach; Ergebnis: Siegquote, verbrauchte LP, Zeit bis zum Sieg
+ Statistiken über erzeugte Dungeons je Startwert: Items, Getränke, Gegner pro Ebene, Weglängen
+ Dumme Bots mit zufälligen Befehlen als einfacher Test auf Abstürze und ungültige Zustände
+ Tests der Datenprüfung bauen ihre Fehler in eigene Testeinträge (`rohdatenMitTesteintraegen` in `tests/hilfen.js`, alle mit "test" im Namen), nicht in den Spielinhalt; Erwartungen an den Inhalt (z.B. wie viele Fallen eine Ebene hat) leiten sie aus den Daten ab; so lässt sich jeder Inhalt ändern oder löschen, ohne dass ein Test bricht
+ Messung der Leistung bei vielen Gegnern mit `node werkzeuge/messung.js`, siehe Leistung
+ Ausgabe als Tabellen, Auswertung und Diagramme mit Python

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

## Verzeichnisse

+ `index.html` als Einstieg, `src/main.js` verdrahtet Logik, Anzeige und Eingabe und setzt beim Start das Favicon aus dem Tile `ninkasi` (Satz 32)
+ `package.json`: nur `"type": "module"` und `"private": true`, damit Node alle `.js`-Dateien als ES-Module liest; keine Abhängigkeiten, kein Build
+ `src/version.js`: Versionsnummer
+ `src/kern/`: Spiel und Eingangstür für Befehle (`spiel.js`), Zustand und Entitäten, räumlicher Index, Zeit, Zufall, Ereignisse und Katalog der Haken, Auslöser, Abschluss eines Vorgangs, Werte und Modifikatoren, Kurven, Effekte, Grundbausteine, Register, Datenprüfung
+ `src/systeme/`: Bewegung, Kampf (Trefferwurf, Schadensrechnung), Fraktionen, Wahrnehmung, Sicht, Stoffwechsel, Inventar, Gefahrenprüfung, Tod, Zielauswahl samt Zielmustern, Bausteine mit Zielauswahl, Zustände, Befehlsveränderer, Beschwörung, Verschieben und Lage, Werfen, veränderliches Gelände und Türen, Fallen, Feldschichten und Feuer, Ebenen und Treppen, Ausrüstung und Flüche, Stapel, Ladungen und Last, Verschleiß (Verderben, Haltbarkeit), Unbekanntes, Bedingungen der Modifikatoren und Auren, Fähigkeiten, lange Aktionen, Vorschau für den Zielmodus, Untersuchen, Wahrnehmbarkeit der Meldungen für das Log, später Brauen, Handel u.a.
+ `src/ki/`: Verhaltensmodule (`abwarten`, `jagen`, `fliehen`), ihre Zielwahl, Schrittwahl und die Wahl der Fähigkeiten
+ `src/welt/`: Dungeon-Erzeugung mit Treppen und Population nach Tiefe, Zugriff auf die Karte und die Feldschichten, Wegfindung, Geometrie (Linie, Sichtlinie, Flugbahn, Kreis, Kegel)
+ `src/anzeige/`: Renderer, Tilebilder (Pixeldaten zu Bildern), Kamera, Oberfläche mit Tooltip, Fenster (Rahmen, Inventar, Fähigkeiten, Hilfe, Charakter, Erstellung), Anzeige des Pegels, Log, angekündigte Angriffe, Animation der Geschossbahn, Textzugriff und Grammatik
+ `src/eingabe/`: Aktionskatalog, Belegung, Übersetzung in Befehle, Fensterstapel mit Inventar-, Fähigkeiten-, Charakterfenster, Charaktererstellung und Hilfe, Maus und Klickregeln, Reise, Rasten, Erkunden, Zielmodus samt Untersuchen, Vorgaben der Einstellungen
+ `daten/`: Inhalte als JS-Datendateien, gesammelt in `daten/index.js`; `daten/zustaende.js` die Zustände; `daten/faehigkeiten.js` die Fähigkeiten, `daten/risiken.js` ihre Risikotabellen; `daten/regeln.js` hält Regelwerte für das Balancing (z.B. Kettengrenze der Auslöser, Halbwerte des Kampfs); `daten/schadensarten.js` die Schadensarten; `daten/fraktionen.js` die Fraktionen und ihre Beziehungen; `daten/etiketten.js` die Etiketten unbekannter Gegenstände; `daten/zeichen.js` ist das Tileset aus Zeichen, Ersatz, wo kein Tile aus `grafik/` passt
+ `grafik/`: Palette und Tiles als Pixeldaten, unter der Grafiklizenz, dazu die Vorschauseite `vorschau.html`; siehe [Tileset.md](Tileset.md)
+ `sprache/de/`, `sprache/en/`: Texte (`texte.js`) und Grammatikregeln (`grammatik.js`) als Daten
+ `lib/`: Bibliotheken (rot.js) samt ihrer Lizenzdateien
+ `werkzeuge/`: Arena, Statistiken, Bots; `tiles-ableiten.js` leitet die kleinen Tile-Sätze ab und schreibt `grafik/tileset.js`
+ `tests/`: Unittests (`*.test.js`), siehe Tests und Balancing; `tests/hilfen.js` baut kleine Spiele aus Testkarten (ohne Dungeon-Erzeugung) mit Testeffekten, Schadensarten und Regelwerten (Grundverteidigung dort 0, damit Genauigkeit 100 ohne Ausweichen sicher trifft), samt Wesen, Spielerin und getragenen Gegenständen, macht auf Wunsch die ganze Karte sichtbar, lässt die Welt (Weltuhr, Zeitereignisse) bis zu einem Zeitpunkt laufen, schneidet Meldungen mit und meldet Haken nur für die Dauer eines Tests an
