# Battle Ninkasi - Architektur

Stand: 2026-11-18

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

1. Eingabe (Tastatur, Maus, später Gamepad) wird über eine frei belegbare Zuordnung in Befehle übersetzt
2. Befehle gehen durch eine einzige Eingangstür in die Logik und werden für den Spielstand aufgezeichnet
3. Die Logik prüft den Befehl (am Zug? zulässig?), führt ihn aus und verändert den Zustand
4. Die Logik meldet Ereignisse nach außen
5. Anzeige, Log, Effekte und später Sound reagieren auf Ereignisse und lesen den Zustand, ohne ihn zu verändern

## Befehle

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", gegenstandId: 4711 }`
+ Alles, was die Spielerin entscheidet, ist ein Befehl: Bewegen, Angreifen, Trinken, Brauen, aber auch Menüentscheidungen wie Skillwahl, Handel, Rezeptwahl, Weiterbrauen oder Abbrechen
+ Die Anzeige verändert den Spielzustand nie direkt, sie erzeugt nur Befehle
+ Keine Befehle sind reine Anzeige-Zustände: Fenster öffnen, im Log blättern, Tooltips, Karte verschieben, Zoom; sie kosten keine Zeit und kommen nicht in den Spielstand
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
+ Der gesamte Zustand ist reine Daten und als JSON serialisierbar (keine Funktionen, keine DOM-Objekte)

## Zeitmodell

+ Ein einziger Zeitstrahl in ganzzahligen Zeiteinheiten
+ Aktionskosten statt Runden: Jede Aktion kostet Zeit, Standard 100; wer an der Reihe ist, bestimmt die Warteschlange nach Zeitpunkt
+ Kosten je Aktionsart verschieden (Bewegen, Nahkampf, Fernkampf, Trinken, Psi, Magie, Brauen u.a.); Modifikatoren zielen auf eine Aktionsart oder auf alle
+ Prozentuale Änderungen werden einheitlich gerundet; Rundungsfehler liegen bei etwa 1% und werden hingenommen
+ Die Warteschlange enthält drei Arten von Einträgen:
  + Akteure (Ninkasi, Gegner, Verbündete), die nach dem Handeln mit ihren Aktionskosten wieder eingereiht werden
  + die Weltuhr, alle 100 Einheiten (ein Welttick): Stoffwechsel (Regeneration, Schwund, Abbau des Pegels), Magie über die Zeit
  + Zeitereignisse, z.B. "Status endet bei T=4350", "Endospore erwacht bei T=8000"; ein Zeitereignis kann an eine Entität gebunden sein (`gebundenAn`) und entfällt, wenn sie entfernt wird
+ Gleichstand wird fest aufgelöst: zuerst die Weltuhr, dann Zeitereignisse, dann Akteure nach Erzeugungsreihenfolge
+ Dauern werden in Zeiteinheiten angegeben, nicht in Ticks
+ Bruchteile (z.B. 0,3 LP pro Tick) laufen über ganzzahlige Speicher in Hundertsteln, ein voller Punkt wird gutgeschrieben, der Rest bleibt stehen
+ Lange Aktionen (z.B. Brauen mit 2000 Einheiten) laufen in Schritten und werden unterbrochen, sobald eine Gefahr auftaucht (Gegner im Sichtfeld, Schaden)
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

+ Modifikator: `{ ziel, art, betrag, quelle, tag?, wenn? }`, z.B. `{ ziel: "kosten.bewegen", art: "prozent", betrag: -5 }`; Ziele sind Namen wie `lp`, `genauigkeit`, `ausweichen`, `ruestung`, `ruestung.<art>`, `widerstand`, `schaden`, `kritfaktor` (siehe Kampfwerte), `reichweiteSicht`, `kosten.<aktion>`, `kosten.alle`, `regeneration.<wert>`, `schwund.<wert>`, `kurvenverschiebung.<wert>`, `abbau.pegel`
+ Arten: `plus`, `prozent`, `mal` (Betrag in Prozent, `150` heißt x1,5), `mindestens`, `hoechstens`, `setzen` (zählt als `mindestens` und `hoechstens` mit demselben Betrag); alle Beträge ganzzahlig
+ Verrechnung (`verrechnet` in `src/kern/werte.js`, Vorbild "increased" und "more" in Path of Exile): (Basiswert + Summe aller `plus`) x (100 + Summe aller `prozent`) / 100 x jedes `mal` / 100, ganzzahlig gerechnet und einmal am Ende gerundet, die Reihenfolge der Modifikatoren spielt also keine Rolle; danach hebt `mindestens` (der höchste) und senkt `hoechstens` (der niedrigste), bei Widerspruch gewinnt `hoechstens` (Blindheit schlägt Fernsicht)
+ Prozente addieren sich, zehnmal +5 % sind +50 %; nur `mal` multipliziert, und nur dort, wo die Daten es ausdrücklich sagen; so wachsen Werte nicht unbemerkt exponentiell, Spielraum für Boni zwischen Quellen (Vorschlag in [Charakter.md](Charakter.md)) gibt `mal`
+ Kein Wert baut auf seinem letzten Ergebnis auf, jede Abfrage rechnet vom Grundwert; Untergrenzen wie "Kosten mindestens 1" setzen die Aufrufer
+ Quellen sind ein Register (`modifikatorquellen`), Signatur `(spiel, entitaet) => [modifikator]`; `modifiziert(spiel, entitaet, ziele, basiswert)` sammelt bei jeder Abfrage aus allen Quellen in der Reihenfolge der Anmeldung, gespeichert oder nachgeführt wird nichts
+ Mitgelieferte Quellen: `eigene` (die Liste `entitaet.modifikatoren`, mit `modifikatorHinzufuegen` und `modifikatorenEntfernen` je Quelle), `zustaende` (siehe Zustände); Ausrüstung, Skills und Auren melden sich später als eigene Quellen an
+ `modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende?)` liefert die wirksamen Modifikatoren mit ihrer Quelle, als Grundlage für Erklärungen in der Oberfläche
+ `hoechstwert(spiel, entitaet, wertName)` und alle Begrenzungen von Werten rechnen über `modifiziert`; nach oben offene Werte (Pegel) haben keinen Höchstwert
+ Umstände einer Abfrage: `modifiziert(spiel, entitaet, ziele, basiswert, { gegenueberId?, tags? })`; der Trefferwurf gibt für Genauigkeit und Verteidigung das Gegenüber und die Tags von Angriff und Effekt mit, die Schadensrechnung dazu die Schadensart, `zeitkosten` reicht Umstände durch
+ Tags: ein Modifikator mit `tag` wirkt nur, wenn die Abfrage den Tag in `umstaende.tags` mitbringt, z.B. `{ ziel: "kosten", tag: "psi", art: "prozent", betrag: -10 }` für alle Psi-Fähigkeiten, auch künftige; Wesen tragen `tags` (z.B. `["bakterium", "essig"]`), Schadensarten gehen als Tag in die Abfragen der Schadensrechnung (siehe Kampfwerte)
+ Bedingungen: `wenn: [{ bedingung, ...parameter }]`, alle müssen gelten; Register `modifikatorbedingungen`, Signatur `(spiel, entitaet, parameter, umstaende) => boolean`, Parameter für die Datenprüfung wie bei den Bausteinen (`src/systeme/modifikatoren.js`)
+ Mitgelieferte Bedingungen: `pegel_ab { wert }`, `pegel_unter { wert }` (z.B. nüchtern), `wert_unter_prozent { wert, prozent }` (gemessen am Grundwert ohne Modifikatoren), `gegenueber_tag { tag }`; Schwellen des Pegels sind damit gewöhnliche Modifikatoren mit `pegel_ab`
+ Bedingungen lesen nur Rohwerte und rufen `modifiziert` nicht auf; fragen sich Modifikatoren doch im Kreis ab, bricht ein Schutz nach acht Ebenen mit einer Fehlermeldung ab
+ Auren (Modifikatorquelle `auren`): `auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen; Reichweite als Kreis wie in der Zielauswahl, `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl (`feinde`, `verbuendete`, `wesen`, `alle`); standardmäßig nicht auf die Trägerin selbst und durch Wände (Gerüche, Dunst, Sporen), mit `sichtlinie: true` nur bei freier Sicht; Auren in Zuständen skalieren mit Stärke und Verlauf; Quelle `aura:<id>` bzw. `aura:zustand:<nummer>`
+ Auren werden bei jeder Abfrage über alle Entitäten gesucht; ein räumlicher Index kommt mit Punkt 7 der Arbeitsliste, wenn viele Wesen es nötig machen

## Kampfwerte

+ Vorbilder: Caves of Qud (erst Ausweichen gegen den Treffer, dann Rüstung gegen den Schaden; schwere Rüstung kostet Ausweichen), Brogue (Trefferchance aus Genauigkeit und Verteidigung ohne harte Grenzen), DCSS (Willenskraft gegen geistige Angriffe, Waffen mit eigener Geschwindigkeit), Path of Exile (Widerstände brauchen eine Grenze, weil sich Prozente addieren)
+ Code in `src/systeme/kampf.js`, Regelwerte in `daten/regeln.js` (`kampf`), Schadensarten in `daten/schadensarten.js`
+ Grundsatz: Kampfwerte sind Punkte, die sich addieren (wie alle Modifikatoren); erst am Ende werden sie über einen Halbwert zu einem Anteil `punkte / (punkte + halbwert)`, der sich 100 % nur annähert; jede weitere Quelle hilft, aber immer weniger
+ Gerechnet wird nur mit ganzen Zahlen und Brüchen, nicht mit `Math.exp` oder `Math.pow`, die nicht in jedem Browser bit-genau gleich sind; gewürfelt wird der Bruch exakt (`mitAnteil` in `src/kern/zufall.js`), sichere Fälle würfeln nicht; Prozentzahlen (`anteilInProzent`) nur für die Anzeige
+ Schadensarten: `stumpf`, `schnitt` (beide mit `ruestung: true`), `saeure`, `lauge`, `feuer`, `elektrisch`, `alkohol`, `gift`, `psi`, `magie` (reine Magie, z.B. Energieball); jeder Schritt `schaden` nennt Pflicht seine `art`; das Mittel ist davon getrennt ein Tag am Effekt: ein magischer Feuerball macht `feuer` mit dem Tag `magie`
+ Angriff am Wesen: `angriff: { genauigkeit, effekt, tags?, kritchance?, muster?, trifft? }`
+ Kampfwerte am Wesen: `kampfwerte: { ausweichen, willenskraft, blocken, ruestung, kritchance }`, Vorgabe je 0, abgefragt über Modifikatoren mit gleichnamigem Ziel, nie unter 0 (`kampfwert`); dazu `widerstaende: { saeure: 100, feuer: -50 }` und `immun: ["psi"]`
  + `ausweichen`: Verteidigung gegen körperliche Angriffe und Geschosse
  + `willenskraft`: Verteidigung gegen Psi (und Magie, wo die Daten es sagen)
  + `blocken`: fängt einen schon gelungenen Treffer ganz ab (Schild, Schleimhülle)
  + `ruestung`: fester Abzug je Treffer
  + `kritchance`: Chance der Angreiferin auf einen Krit
+ Ablauf eines Angriffs (`trefferwurf`): Trefferwurf, Blocken, Krit-Wurf; Fehlschläge melden `verfehlt` mit `grund` (`ausgewichen`, `geblockt`) und lösen den Haken `verfehlt` mit demselben Grund aus, Treffer wirken den Effekt mit `kritisch` im Kontext und lösen `nach_treffer` aus
  + Trefferchance: `genauigkeit / (genauigkeit + verteidigung + grundverteidigung)`; die Genauigkeit über Modifikatoren der Quelle (ohne Quelle, z.B. bei einer Falle, unverändert), die Verteidigung nach `gegen`; die Grundverteidigung (Regelwert 20) sorgt dafür, dass auch ein Ziel ohne eigene Verteidigung nicht sicher getroffen wird; Genauigkeit 80 gegen Ausweichen 0 trifft so zu 80 %, gegen 80 zu 44 %
  + Blocken: `blocken / (blocken + halbwertBlocken)`; Kritchance ebenso mit `halbwertKritchance`, die `kritchance` des Angriffs kommt zu der des Wesens
+ Baustein `trefferwurf { genauigkeit, effekt, gegen?, sonst?, kritchance? }` für Fernkampf, Magie, Psi und Flächen; `gegen` Vorgabe `ausweichen`, Psi z.B. `willenskraft`; `sonst` wirkt bei einem Fehlschlag, z.B. halber Schaden einer Explosion, der man ausweicht (Vorbild Rettungswurf); wo kein Wurf passt, lassen die Daten ihn weg
+ `trefferanteil(spiel, { quelle, ziel, genauigkeit, gegen, tags })` liefert die Trefferchance als Bruch ohne zu würfeln, Grundlage für Vorschau, Tooltip und KI
+ Schadensrechnung am Haken `vor_schaden`, feste Ränge: Angreiferin (50: Modifikator `schaden` mit den Tags und der Schadensart, danach Krit mit `kritfaktor`), Handler ohne Rang (100, z.B. Abfangen), Rüstung (200), Widerstand und Immunität (300)
+ Krit: Regelwert `kritfaktor` 150 (x1,5), Modifikatoren auf `kritfaktor` heben ihn nach oben offen; er wirkt vor der Rüstung, Krits schlagen sich also besser durch Panzer
+ Rüstung: fester Abzug, ein Treffer mit Schaden behält mindestens `mindestschadenNachRuestung` (1); `ruestung` wirkt nur gegen Arten mit `ruestung: true`, `ruestung.<art>` aus Modifikatoren gegen genau diese Art, z.B. eine säurefeste Schürze mit `ruestung.saeure`; den Abzug auf das Ausweichen nennt jede Rüstung selbst in ihren Daten (Gegenstände, Punkt 9 der Arbeitsliste)
+ Widerstand R in Punkten aus `widerstaende` und Modifikatoren auf `widerstand` mit der Art als Tag (ohne Tag gegen alles): Schaden × H / (H + R); mit dem Halbwert H 100 halbieren 100 Punkte, 300 Punkte lassen ein Viertel; negative Punkte machen verwundbar, Schaden × (H − 2R) / (H − R), das nähert sich dem Doppelten (−100 Punkte: x1,5); einmal gerundet
+ Immunität als Sonderfall: `immun` am Wesen oder ein Modifikator auf `immunitaet` mit der Art als Tag (Betrag über 0), Schaden genau 0
+ Marker als Tags an Angriff oder Effekt: `verfehlt_nie` (kein Trefferwurf), `unblockbar` (kein Blocken; künftige Ersatzwirkungen wie ein Schild, der den Treffer abfängt, sollen ihn ebenso achten), `ignoriert_ruestung`
+ Meldung `schaden` mit `schadensart`, `kritisch`, `ruestungAbzug`, `widerstanden` und `immun`; das Log zeigt die Art und eigene Zeilen für Krit, Immunität und Blocken

## Effektsystem

+ Zwei Schichten, wie Lego: Der Code liefert die Steine, die Daten bauen daraus
+ Grundbausteine sind Code: wenige Dutzend kleine, stabile Funktionen, z.B. Schaden, Heilen, Pegel ändern, Zustand setzen, Beschwören, Versetzen, Fraktion ändern, Feld verändern
+ Zusammengesetzte Effekte sind Daten, benannt und wiederverwendbar, z.B. "Feuerbier-Explosion": Fläche 3x3, Feuerschaden 2W6, Zustand "brennend" für 300 Einheiten
+ Ein neuer Grundbaustein ist nur für eine wirklich neue Mechanik nötig
+ Benannte Verhaltensmodule (Code) für alles, was sich nicht aus Bausteinen zusammensetzen lässt: KI-Muster wie Zweiteilung, Sprossung, Myzelwachstum, Phagen-Befall, Bossphasen; die Daten verweisen nur darauf, z.B. `ki: "sprossung"` mit Parametern
+ Grundbausteine, Verhaltensmodule und Zielmuster werden in Registern angemeldet; auch Mods können dort eigene anmelden
+ Erweiterbar ist grundsätzlich alles über Register (`src/kern/register.js`): Befehlsarten, Grundbausteine, Verhaltensmodule, Modifikatorquellen, Befehlsveränderer, Zielmuster, Handler der Weltuhr, Zeitereignisse, interne Haken, Gefahrenprüfungen und Zustandsprüfungen; Systeme und Verhaltensmodule melden sich beim Import an, die Reihenfolge der Anmeldung ist fest; `abmelden` entfernt einen Eintrag wieder (Tests, Mods)
+ Kontext eines Effekts: `{ quelleId, urheberId, urheberFraktion, zielId, ursprung, zielfeld, ursache, kettentiefe, mittel, tags, kritisch, werte }` (`src/kern/effekte.js`); die Quelle wirkt unmittelbar (Wesen, Fass, Geschoss, Falle), der Urheberin wird die Wirkung zugerechnet (EP, Zorn, Todesursache), Vorgabe ist die Quelle, bei Beschworenen deren Beschwörerin (`beschworenVon`); ihre Fraktion bleibt erhalten, auch wenn sie schon entfernt ist
+ `ursprung` ist das Feld, von dem Muster ausgehen (Vorgabe Position der Quelle), `zielfeld` das anvisierte Feld (Vorgabe Position des Ziels); `zielId` kann null sein, dann wirkt der Effekt auf ein Feld
+ `mittel`: `{ art: "angriff" | "faehigkeit" | "gegenstand" | "zustand" | "falle" | "gelaende", name }`; `tags` z.B. `["feuer", "magie"]` für Modifikatoren und gebundene EP, die Tags eines Effekts (`tags` in den Daten) kommen dazu
+ `werte` ist eine Ablage zwischen Schritten, über alle Verschachtelungen eines Effekts geteilt: `schaden` zählt den tatsächlichen Verlust in `summeSchaden`, `fuer_jedes_ziel` schreibt `anzahlZiele`, `springen` schreibt `getroffeneIds` und `sprungnummer`
+ `kritisch` setzt ein kritischer Trefferwurf, verschachtelte Effekte erben es (siehe Kampfwerte)
+ Mengen der Bausteine `schaden` (mit Pflichtfeld `art`), `heilen`, `wert_aendern`: `wuerfel`, feste `menge` oder `menge: { aus: "summeSchaden", prozent: 50 }` aus der Ablage (Lebensraub); dazu `teilen: "anzahlZiele"` (verteilter Schaden) und `prozentJeSprung` (Abschwächung je Sprung einer Kette)
+ Bausteine erklären, ob sie ein Wesen brauchen (`brauchtZiel`); ein Schritt ohne Ziel wird übersprungen, der Effekt läuft weiter
+ Bausteine beschreiben ihre Parameter für die Datenprüfung: `text`, `ganzzahl`, `wahrheitswert`, `effekt`, `muster`, mit `?` freiwillig, eine Liste nennt die erlaubten Werte; benannte Effekte dürfen sich nicht im Kreis aufrufen
+ Eine Befehlsart besteht aus `pruefen` (Grund der Ablehnung oder nichts) und `ausfuehren` (gibt die Aktionsart für die Zeitkosten zurück); Gegner benutzen dieselben Befehlsarten, ihre Befehle werden aber nicht aufgezeichnet
+ Vor dem Ausführen läuft jeder Befehl, von Ninkasi wie von der KI, durch den Haken `vor_befehl`; Zustände verändern ihn dort (Torkeln, Verwirrung), ein abgebrochener oder ungültig gewordener Befehl wird zu warten; aufgezeichnet wird der ursprüngliche Befehl
+ `bewegen` greift durch Hineinlaufen Feinde an, mit `angreifen: true` jedes Wesen (gezielter Angriff, Rausch, Verwirrung)

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
+ In Betrieb: `vor_schaden` (Schadensart und Menge, Menge ändern oder abbrechen; Ränge der Schadensrechnung siehe Kampfwerte), `nach_schaden` (bei Schaden über 0), `nach_treffer` (mit `kritisch`), `verfehlt` (mit `grund`), `vor_tod`, `nach_tod`, `nach_wertaenderung`, `zustand_beginnt`, `zustand_endet`, `vor_befehl` (Befehl ersetzen oder abbrechen)
+ Reserviert für den Ausbau ([Systemausbau.md](Systemausbau.md)): `zug_beginn`, `zug_ende`, `vor_angriff`, `betritt_feld`, `verlaesst_feld`, `gegenstand_benutzt`
+ Kontext der Haken mit Beteiligten: `{ quelleId, urheberId, zielId, ursache, kettentiefe, mittel, tags, kritisch }`, dazu je Haken weitere Felder (`menge`, `position`)
+ Handler laufen nach Rang (kleiner zuerst, Vorgabe 100), bei gleichem Rang nach Anmeldung; so ist die Reihenfolge ausdrücklich geregelt, wenn Handler den Kontext verändern
+ Setzt ein Handler `kontext.abgebrochen = true`, laufen die weiteren Handler nicht mehr (z.B. Schild fängt den Treffer ab, Tod verhindert)
+ Meldungen nach außen ("Treffer", "Krit", "getrunken", "Tod") sind rein lesend; Anzeige, Log, schwebende Zahlen und Sound hängen sich daran
+ Für die Anzeige von Flächen und Geschossen: `flaeche` (`felder`) und `geschoss` (`bahn`, `aufschlag`), Animation folgt später
+ Meldungen verweisen auf Entitäten über Bezüge (`{ id, typ, text }`), die auch nach dem Entfernen der Entität gültig bleiben; die Felder `art` und `zeit` sind reserviert
+ Wertänderungen laufen über eine gemeinsame Funktion, die den Haken "nach_wertaenderung" auslöst (z.B. für Pegelschwellen); sie nimmt den Ursprung `{ urheberId, ursache, mittel, kettentiefe }` mit; sinkt der Lebenswert, merkt sich das Wesen den Ursprung als `letzterVerlust`, zugerechnet der Urheberin (ein Wurf zählt für die Werferin, nicht für die Flasche)
+ Was auf Meldungen reagiert, darf weder den Zustand ändern noch den Spiel-Zufall benutzen

## Tod und Zustandsprüfung

+ Vorbild sind die "state-based actions" von Magic: The Gathering: Getötet wird nicht mitten in einer Wirkung, sondern an festen Punkten
+ Ein Vorgang ist ein ausgeführter Befehl, ein Handler der Weltuhr oder ein Zeitereignis; danach läuft `vorgangAbschliessen` (`src/kern/vorgang.js`): abwechselnd alle Zustandsprüfungen und der nächste vorgemerkte Auslöser, bis nichts mehr ansteht
+ Zustandsprüfungen sind ein Register (`zustandspruefungen`), die erste ist der Tod (`src/systeme/tod.js`); später z.B. Gegenstände mit Haltbarkeit 0 oder der Filmriss
+ Folge: Eine Flächenwirkung trifft alle Ziele, auch wenn das erste schon tot ist; mehrere Tode im selben Vorgang laufen nach Entitäts-ID
+ Es stirbt, wessen Lebenswert bei 0 liegt; der Lebenswert ist ein Datenfeld (`lebenswert`, Vorgabe `lp`), z.B. der Zusammenhalt eines Biofilms
+ Ablauf je Wesen: Haken `vor_tod` (Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt, sonst stirbt es trotzdem), Meldung `tod` mit Urheberin, Ursache und Mittel aus `letzterVerlust`, Haken `nach_tod` mit der letzten Position, Hinterlassenschaft, Entfernen
+ Hinterlassenschaft nach Daten: `beimTod: { inventar: "fallen_lassen" }` (Vorgabe, aufs Feld des Wesens) oder `"vernichten"`
+ Entfernen nimmt den Akteur, gebundene Zeitereignisse und alles Getragene mit; Getragenes verschwindet aus dem Inventar der Trägerin
+ Stirbt Ninkasi, ist das Spiel vorbei; sie bleibt im Zustand (Anzeige, später Todesbericht), noch vorgemerkte Auslöser verfallen
+ Ursachen bisher: `nahkampf`, `trinken`, `ausloeser`, `zustand`, `schwund.<wert>` (Stoffwechsel)

## Auslöser

+ Auslöser sind Daten an einer Entität: `ausloeser: [{ bei, rolle?, ziel?, effekt, chance?, daempfung? }]`, z.B. Dornen `{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }`
+ `bei`: Haken aus dem Katalog mit `ausloeserErlaubt` und `inBetrieb`; `rolle`: Rolle der Trägerin im Ereignis (`quelle` oder `ziel`, ohne Angabe jede); `ziel`: worauf der Effekt wirkt (`selbst` als Vorgabe, `quelle`, `ziel` oder `feld`: die Position im Ereignis, bei `nach_tod` die letzte Position des Opfers, sonst die der Trägerin; der Effekt läuft dann ohne Wesen als Ziel mit Ursprung und Zielfeld dort, z.B. Sporen im Kreis); `chance` in Prozent, Vorgabe 100
+ Haken und Auslöser sind getrennt: Haken sind Code, wirken sofort und dürfen den Kontext ändern; Auslöser merkt ein Verteiler (Rang 1000, nach allen Code-Handlern) nur vor, abgearbeitet werden sie nach dem laufenden Schritt nacheinander in der Reihenfolge des Vormerkens (`src/kern/ausloeser.js`); kein Auslöser greift so mitten in eine Schadensrechnung ein
+ Die Warteschlange der Auslöser liegt im Spiel, nicht im Zustand; sie ist nach jedem Vorgang leer
+ Gefragt werden die beteiligten Entitäten, zuerst die Quelle, dann das Ziel; je Entität zuerst ihre eigenen Auslöser, dann die ihrer Zustände (z.B. Dornenhaut); Ausrüstung und Skills kommen mit ihrem Ausbau dazu
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
+ Haken `zustand_beginnt` und `zustand_endet` (mit `grund`: `abgelaufen`, `entfernt`, `quelle_tot`), Meldungen gleichen Namens
+ `gebundenAnQuelle: true`: der Zustand endet mit dem Tod oder Verschwinden der Quelle (aufrechterhaltener Zauber, Beschworene)
+ `handlungsunfaehig: true` (Betäubung, Lähmung, Filmriss): die Trägerin muss warten; bei Ninkasi wird jede Eingabe angenommen, aufgezeichnet, mit der Meldung `handlungsunfaehig` ("Leider nicht möglich") beantwortet und als warten ausgeführt, je Eingabe vergeht eine Aktion; eine Reise hält an
+ `befehl: { veraenderer, ...parameter }` verändert jeden Befehl der Trägerin über das Register `befehlsveraenderer` (`src/systeme/befehlsveraenderer.js`); mitgeliefert ist `abweichen { chance, freundeAngreifen? }` für Torkeln und Verwirrung: ein Schritt geht mit der Chance, skaliert mit der Stärke, auf ein zufälliges anderes freies Nachbarfeld (im Gang also zurück), gibt es keins, wie gewollt; ein Feind dort wird angegriffen, ein Verbündeter nur mit `freundeAngreifen`, sonst zählt sein Feld nicht als frei
+ `ki: { modul, ...parameter }` überlagert die KI (Furcht mit `fliehen`, Rausch mit `jagen` und `trifft: "wesen"`); bei Ninkasi übernimmt die KI für die Dauer, das Spiel wartet dann nicht auf Eingaben
+ `fraktion` überlagert die Fraktion: `"urheber"` (Psi-Kontrolle), `"eigene"` (Zwietracht, mit allen verfeindet) oder ein Fraktionsname
+ Fraktion und KI werden beim Beginn in die Instanz geschrieben; `fraktionVon` und `kiVon` (`src/kern/zustand.js`) liefern die des jüngsten überlagernden Zustands, sonst die eigene; nach dem Ende gilt von selbst wieder der ursprüngliche Stand, die eigene KI behält ihr Gedächtnis
+ Beschwören und Verschwinden (`src/systeme/beschwoerung.js`): `beschwoeren { wesen, anzahl?, muster?, zustand?, dauer? }` erzeugt Wesen auf freien Feldern des Musters (Vorgabe angrenzend), mit der Fraktion der Urheberin und `beschworenVon`, eingereiht nach einer Aktion Wartezeit, mit dem Zustand (Quelle die Beschwörerin); `verschwinden` entfernt das Ziel ohne Tod, ohne `nach_tod` und ohne Hinterlassenschaft, nicht bei Ninkasi
+ Beispiel ganz als Daten: `beschworen: { gebundenAnQuelle: true, beimEnde: "verschwinden" }`, mit `dauer` auch eine Beschwörung auf Zeit (Vorbild Brogue: Geisterklingen verschwinden mit dem Goblin-Beschwörer)
+ Die Datenprüfung verfolgt Kreise auch über Zustände: ein Effekt, der einen Zustand setzt, dessen `beimBeginn` ihn wieder aufruft, ist ein Fehler

## Zielauswahl

+ Vorbilder: Dungeon Crawl Stone Soup (Zielarten smite, bolt, beam, cone, explosion; Vorschau getrennt von der Wirkung), Tales of Maj'Eyal (Ziel als Tabelle mit Radius, Eigen- und Freundbeschuss als Datenfeld), Red Blob Games (Linien auf Gittern, Symmetrie, diagonale Wandecken)
+ Geometrie (`src/welt/geometrie.js`), rein und ganzzahlig, ohne Winkelfunktionen: `linie` symmetrisch (gerechnet vom kleineren Endpunkt aus), `sichtlinieFrei` (kein undurchsichtiges Feld zwischen den Endpunkten), `flugbahn` (bis zum Ziel oder mit `ueberZielHinaus` bis zur Reichweite, endet an Wand oder erstem Wesen, außer `durchdringend`), `kreis`, `kegel`
+ Diagonale Wandecken großzügig: ein Diagonalschritt ist frei, wenn eine der beiden Seiten frei ist
+ Kreis: ein Feld gehört dazu, wenn `dx² + dy² <= r·(r+1)`; Radius 1 ist das volle 3x3, Radius 2 ein 5x5 ohne Ecken; Reichweiten werden ebenso gemessen
+ Kegel: Öffnung in Grad (30, 45, 60, 90 als Vorgabe, 120), geprüft über Skalar- und Kreuzprodukt mit einer Tabelle des Tangens in Tausendsteln; in allen acht Richtungen gespiegelt gleich
+ Zielmuster sind Daten mit einem Muster aus dem Register `zielmuster`, Signatur `(spiel, auswahl, parameter) => [{x, y}]` mit `auswahl = { ursprung, zielpunkt, quelleId }` (`src/systeme/zielauswahl.js`)
+ Mitgeliefert: `selbst` (Ursprung), `feld` (Zielpunkt), `angrenzend`, `linie` (`laenge`), `strahl` (bis zum Hindernis, `laenge` freiwillig), `kreis` (`radius`), `kegel` (`laenge`, `oeffnung`); Linie und Strahl laufen vom Ursprung in Richtung Zielpunkt und enden an undurchsichtigen Feldern
+ Kreis, Kegel und angrenzend nur mit Sichtlinie vom Ursprung (keine Explosion um die Ecke), abschaltbar mit `durchWaende: true`
+ Feste Reihenfolge der Felder: nach Abstand zum Ursprung (`dx² + dy²`), dann nach Feldindex; je Feld die Entitäten nach ID
+ Wer getroffen wird, sagt `trifft` aus Sicht der Urheberin: `alle` (auch Gegenstände, Vorgabe), `wesen`, `feinde` (andere Fraktion), `verbuendete` (gleiche Fraktion); `ohneUrheber: true` nimmt die Urheberin aus; Eigenbeschuss ist also möglich, solange die Daten nichts anderes sagen
+ Zielarten: `selbst`, `wesen` (per ID), `feld` (smite), `richtung` (`dx`, `dy`), `geschoss`; dazu `reichweite`, `brauchtSichtlinie` (Vorgabe ja), `muster`, `trifft`, `ohneUrheber`, `durchdringend`, `ueberZielHinaus`
+ Ursprung und Zielpunkt je Zielart: bei `selbst` die Akteurin, bei `wesen` und `feld` das Ziel selbst, bei `richtung` die Akteurin und das Feld daneben, bei `geschoss` der Aufschlag; Format der Zielangabe `{ x, y }`, `{ id }` oder `{ dx, dy }`
+ `zielAufloesen(spiel, akteur, zielart, zielangabe)` gibt Ursprung, Zielpunkt, Ziel, Bahn, Felder und Betroffene zurück oder den Grund der Ablehnung (`ungueltig`, `kein_ziel`, `nicht_sichtbar`, `zu_weit`, `keine_sichtlinie`); ändert nichts, würfelt nicht und ist zugleich Vorschau für Zielmodus, Tooltip und KI; für Ninkasi zählen nur Felder, die sie sieht
+ Gesehen, aber nicht zu treffen: eine symmetrische Linie für Sicht und Wurf, der Schattenwurf des Sichtfelds kann davon abweichen; nach dem Anspielen prüfen, ob Ersatzlinien (Brogue, DCSS) oder symmetrischer Schattenwurf nötig sind
+ Bausteine mit Zielauswahl (`src/systeme/zielbausteine.js`), der innere Effekt teilt die Ablage:
  + `fuer_jedes_ziel`: `{ muster, effekt, trifft, ohneUrheber }` auf jede getroffene Entität im Muster
  + `auf_feld`: `{ muster, effekt }` auf jedes Feld, auch leere (Ziel null); Grundlage für Feldschichten
  + `geschoss`: `{ reichweite, effekt, durchdringend, ueberZielHinaus }` vom Ursprung zum Zielfeld, der Effekt wirkt am ersten Wesen oder am Aufschlag, dort liegen dann Ursprung und Zielfeld (z.B. Explosion mit `fuer_jedes_ziel`); durchdringend auf jedes Wesen der Bahn
  + `springen` (Kettenblitz): `{ anzahl, reichweite, effekt, trifft, ohneUrheber, wahl }` wirkt auf das Ziel und springt bis zu `anzahl` Mal zum nächsten noch nicht getroffenen lebenden Wesen im Kreis mit Sichtlinie (`wahl`: `naechstes` als Vorgabe oder `zufaellig`), `trifft` hier Vorgabe `wesen`; auch für springende Krankheit oder übergreifende Psi-Kontrolle
+ Nahkampf mit Muster: `angriff.muster` vom Angreifer in Richtung des Ziels, z.B. Rundumschlag `{ art: "angrenzend" }`, Speer `{ art: "linie", laenge: 2 }`; jedes getroffene Wesen bekommt einen eigenen Trefferwurf (siehe Kampfwerte), `angriff.trifft` Vorgabe `wesen`, der Angreifer nie selbst

## Zufall und Wiederholbarkeit

+ Spielstand = Spielversion + Prüfsumme der Daten + Startwert + Liste aller Befehle (JSON); Laden heißt Nachspielen ohne Anzeige
+ Startwert frei wählbar oder zufällig, Abfrage beim Spielstart (Vorbild: Brogue)
+ Zwei Zufallsquellen: Spiel-RNG für die Logik, kosmetischer RNG für Animationen, Partikel und Textvarianten
+ Abgeleitete Startwerte für Inhalte, die nicht vom Spielverlauf abhängen sollen, z.B. Buchtexte aus Lauf-Startwert und Objekt-ID
+ Regeln für die Logik: kein `Math.random()`, keine Uhrzeit, keine Winkelfunktionen, nur ganze Zahlen, feste Reihenfolge beim Durchlaufen von Sammlungen
+ Spiel-RNG: eigener Generator sfc32 (`src/kern/zufall.js`), nur ganze Zahlen, Zustand aus vier 32-Bit-Zahlen im Spielzustand; jede Änderung am Verfahren ändert die Zahlenfolge
+ rot.js hat einen eigenen, globalen RNG; er wird nur für die Dungeon-Erzeugung benutzt und vorher mit einem abgeleiteten Startwert gesetzt
+ Fallstrick: Die Kartengeneratoren von rot.js (Digger, Uniform) brechen nach einer Zeitgrenze ab (`timeLimit`, gemessen mit `Date.now()`); sie wird deshalb immer auf `Infinity` gesetzt
+ Abgeleitete Startwerte: Spiel-RNG (`"spiel"`), Grundriss (`"ebene.<name>"`) und Inhalt einer Ebene (`"ebene.<name>.inhalt"`) haben eigene Quellen, damit die Ebene nicht vom Spielverlauf abhängt
+ Jede Änderung an Code oder Daten macht alte Spielstände ungültig; passen Version oder Prüfsumme nicht, gibt es eine klare Meldung
+ Nebennutzen: Spielstand als Fehlerbericht, Aufzeichnungen zum Anschauen, "Seed des Tages", automatische Tests

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

## Oberfläche

+ Karte auf dem größten Teil des Bildschirms, rechts eine Seitenleiste (etwa 400 px), unten ein Log (4 bis 5 Zeilen, aufklappbar)
+ Sichtbar bei 1080p neben Seitenleiste und Log: bei 16 px etwa 95x57 Felder, bei 32 px etwa 47x28, bei 48 px etwa 31x19, bei 64 px etwa 23x14
+ Seitenleiste: LP, MP und PP als Balken, Pegel als eigene, auffällige Anzeige in ‰ mit eingezeichneten Schwellen, aktive Zustände, Liste der sichtbaren Gegner (Vorbild: Brogue)
+ Der Pegel ist nach oben offen und wird logarithmisch angezeigt (`src/anzeige/pegelanzeige.js`), in Verdopplungsschritten gleicher Breite (0, 0,5, 1, 2, 4, 8, 16 ‰ ...); eingezeichnet sind Schwellen und das Optimum der LP-Regeneration, daneben steht der genaue Wert (z.B. 2,35 ‰)
+ Inventar, Skillübersicht, Handel und Brauen als Fenster über der Karte; Öffnen und Schließen sind keine Befehle
+ Übersichtskarte per Umschalttaste, gezeichnet vom selben Renderer mit kleinen Feldern (4 bis 8 px); eine Minimap in der Seitenleiste ist später mit demselben Renderer möglich
+ Alle Elemente sind Anzeige und lassen sich ändern, ohne die Logik zu berühren

## Kamera

+ Folgen mit Randabstand: Die Kamera bewegt sich erst, wenn Ninkasi näher als etwa ein Viertel des Ausschnitts an den Rand kommt
+ Am Levelrand bleibt die Kamera stehen, jenseits des Levels ist nichts zu sehen; kleinere Levels stehen mittig
+ Zunächst feldweises Springen, weiches Scrollen später als reine Anzeige
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

## Wahrnehmung

Umgesetzt ist bisher eine Vereinfachung (`sieht` in `src/systeme/sicht.js`): Ninkasi sieht, was in ihrem Sichtfeld liegt; ein Wesen sieht Ninkasi, wenn sie es sieht und es nah genug ist; andere Wesen sehen einander mit freier Sichtlinie innerhalb ihrer Sichtweite. Verhaltensmodule wählen ihr Ziel darüber (`src/ki/ziele.js`): `jagen` verfolgt das nächste sichtbare Wesen, das nach `trifft` ein Ziel ist (Vorgabe `feinde`), `fliehen` weicht der Urheberin seines Zustands oder dem nächsten sichtbaren Feind aus.

Vorläufige Ideen, noch nicht umgesetzt:

+ Wahrnehmung ist eine Komponente mit kombinierbaren Arten
+ Sehen braucht Licht: Ein Wesen sieht ein Ziel nur in Sichtlinie, innerhalb seiner Sichtweite und wenn das Feld des Ziels hell genug ist; z. B. Lebensmittelkontrolleure
+ Spüren braucht kein Licht: Wahrnehmung im Umkreis, unabhängig von der Helligkeit; z. B. Mikroorganismen
+ Später weitere Arten, z. B. Hören (Lärm beim Kampf)
+ Nachtsicht und Fernsicht werden Skills: Nachtsicht senkt die nötige Helligkeit zum Sehen, Fernsicht erhöht die Sichtweite; siehe [Charakter.md](Charakter.md)
+ Wer Licht trägt, sieht mehr und wird selbst gesehen
+ Die bisherige Vereinfachung des Prototyps (ein Gegner sieht Ninkasi, wenn sie ihn sieht) wird dadurch ersetzt

## Eingabe

+ Vorgabe für die Bewegung: Ziffernblock, acht Richtungen, 5 für Warten
+ Die Belegung ist frei änderbar, siehe Datenfluss; sie umfasst Tasten, Maustasten und das Mausrad (`src/eingabe/belegung.js`)
+ Einstellungen (Zoom, Reise) haben Vorgaben in `src/eingabe/einstellungen.js`; der Browser speichert nur Abweichungen davon

## Maus und Reise

+ Die Maus erzeugt nur gewöhnliche Befehle; die Logik kennt weder Maus noch Reise
+ Ein Klick wird über eine geordnete Liste von Klickregeln gedeutet (`src/eingabe/maus.js`), die erste passende greift: eigenes Feld mit Gegenstand hebt auf, angrenzender sichtbarer Feind wird angegriffen, sonst Reise zum Feld; weitere Regeln (Kessel, Händler) kommen in die Liste
+ Eine Reise ist eine Folge von Befehlen "bewegen"; der Kern (`src/eingabe/reise.js`) liefert Schritt für Schritt den nächsten Befehl oder einen Grund zum Anhalten und kommt ohne Timer und DOM aus, Browser und Bot benutzen ihn gleich; den Takt gibt im Browser `src/main.js` vor (Einstellung `reisePause`)
+ Gereist wird nur über erkundete Felder, der Weg wird bei jedem Schritt neu berechnet; beim Darüberfahren zeigt die Anzeige den Weg als Vorschau
+ Solange Feinde in Sicht sind, beginnt keine Reise (Einstellung `reiseTrotzFeinden`, Vorgabe aus); ist sie an, hält die Reise nur bei neu auftauchenden Feinden
+ Eine Reise hält an bei: neuem Feind in Sicht, Schaden, Gegenstand auf dem Feld (Liste `reiseHalt` in den Einstellungen), außerdem bei Ankunft, fehlendem Weg, versperrtem Feld, Tod und jeder Taste oder jedem Klick
+ Das Mausrad zoomt
+ Später auf derselben Grundlage: automatisches Erkunden (andere Zielwahl), Tooltips und Umschauen am Feld unter dem Zeiger

## Gefahrenprüfung

+ Reine Lesefunktionen in `src/systeme/gefahr.js`: Eine Lage ist ein Schnappschuss (sichtbare Feinde, LP), zwei Lagen werden verglichen
+ Prüfungen sind im Register "gefahren" angemeldet (`gegner_in_sicht`, `schaden`); die Reise nutzt sie, später auch lange Aktionen wie das Brauen

## Wegfindung

+ Ein gemeinsames Modul `src/welt/wege.js` für KI und Reise, AStar aus rot.js mit acht Richtungen
+ Optionen: nur erkundete Felder (Spielerin, keine Hellseherei), Wesen meiden
+ Später: Kosten je Gelände (Fallen meiden), dann für KI und Spielerin zugleich

## Prototyp

+ Stand 0.4.0, begonnen als 0.0.0; 0.1.0 Maus und Reise, 0.2.0 Tiles im Spiel, 0.3.0 Pegel in Promille, Psi-Punkte und Stoffwechsel, 0.4.0 Tod als Zustandsprüfung, Katalog der Haken, Auslöser aus Daten
+ Umfang: eine Ebene, Bewegen, Sichtfeld, ein Gegnertyp, Nahkampf, ein Getränk, Pegel, Log
+ Tiles in allen vier Sätzen (ab 0.2.0), Zeichen nur noch als Absicherung
+ rot.js 2.2.1 (Lizenz BSD-3-Clause) liegt unverändert als ES-Module in `lib/rot/`, mit `LICENSE.txt`; benutzt werden Digger (Dungeon), PreciseShadowcasting (Sichtfeld) und AStar (Wegfindung der Gegner); Warteschlange und Spiel-RNG sind eigener Code, da sie als JSON speicherbar sein müssen
+ Starten: im Hauptverzeichnis `python -m http.server`, dann `http://localhost:8000/`; Startwert per `?seed=1234`, sonst zufällig, er wird in die URL geschrieben
+ Testen: `node werkzeuge/bot.js [Läufe] [Befehle] [erster Startwert]` spielt mit zufälligen Befehlen, prüft Invarianten (u.a. kein Wesen mit Lebenswert 0, nichts Getragenes ohne Trägerin, keine verwaisten Zeitereignisse, keine liegengebliebenen Auslöser) und vergleicht den Zustand nach dem Nachspielen
+ Ebene "keller": 120x40 Felder, 15 Essigbakterien, 10 Biere
+ Ninkasi: 100 LP, 100 MP, 0 von 100 PP, Pegel 0 (nach oben offen), Sichtweite 8, Nahkampf 1W6+2 stumpf mit Genauigkeit 80 (80 % gegen ein Wesen ohne Ausweichen)
+ Essigbakterium: 15 LP, Biss 1W4 mit 70%, Verhaltensmodul "jagen" (sieht es Ninkasi, folgt es ihr, sonst geht es zur letzten bekannten Position und wartet)
+ Bier: aufheben mit G, trinken mit T; +20 LP, Pegel +0,5 ‰
+ Stoffwechsel je Welttick, Zahlen vorläufig in `daten/ninkasi.js`: LP 0,3 nüchtern, 0,8 bei 1,5 ‰, darüber abnehmend; MP 0,8 nüchtern, 0 ab 3 ‰; PP Schwund 0,3 nüchtern, Stillstand von 0,5 bis 1,5 ‰, dann steigend bis 1,0 bei 4 ‰; danach Abbau des Pegels um 0,01 ‰
+ Schwellen 0,5, 1, 2 und 3 ‰ werden angezeigt und gemeldet, haben aber noch keine Wirkung; die Leiste zeigt zusätzlich das Optimum der LP
+ Alle Aktionen kosten 100
+ Tasten: Ziffernblock zum Bewegen, 5 Warten, +/- Zoom (16, 32, 48, 64 px), Tab klappt das Log auf, Eingabe startet nach dem Tod einen neuen Lauf
+ Maus (ab 0.1.0): Klick reist, greift an oder hebt auf, Rad zoomt, siehe Maus und Reise
+ Nicht enthalten: Vollbild, ganzzahlige Skalierung für 4K, Übersichtskarte, Umschauen, Markierungen für Gegner außerhalb des Ausschnitts, Spielstand speichern und laden (Nachspielen ist vorhanden), Prüfsumme der Daten, Englisch
+ Vereinfachung: Ein Gegner sieht Ninkasi, wenn sie ihn sieht und er innerhalb seiner Sichtweite steht
+ Auslöser sind im System vorhanden, im Spielinhalt aber noch nicht benutzt
+ Fehlende Strukturen stehen als Arbeitsliste in [Systemausbau.md](Systemausbau.md)

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
+ Ausgabe als Tabellen, Auswertung und Diagramme mit Python

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

## Verzeichnisse

+ `index.html` als Einstieg, `src/main.js` verdrahtet Logik, Anzeige und Eingabe und setzt beim Start das Favicon aus dem Tile `ninkasi` (Satz 32)
+ `package.json`: nur `"type": "module"` und `"private": true`, damit Node alle `.js`-Dateien als ES-Module liest; keine Abhängigkeiten, kein Build
+ `src/version.js`: Versionsnummer
+ `src/kern/`: Spiel und Eingangstür für Befehle (`spiel.js`), Zustand und Entitäten, Zeit, Zufall, Ereignisse und Katalog der Haken, Auslöser, Abschluss eines Vorgangs, Werte und Modifikatoren, Kurven, Effekte, Grundbausteine, Register, Datenprüfung
+ `src/systeme/`: Bewegung, Kampf (Trefferwurf, Schadensrechnung), Sicht, Stoffwechsel, Inventar, Gefahrenprüfung, Tod, Zielauswahl samt Zielmustern, Bausteine mit Zielauswahl, Zustände, Befehlsveränderer, Beschwörung, Bedingungen der Modifikatoren und Auren, später Brauen, Handel u.a.
+ `src/ki/`: Verhaltensmodule (`abwarten`, `jagen`, `fliehen`) und ihre Zielwahl
+ `src/welt/`: Dungeon-Erzeugung, Zugriff auf die Karte, Wegfindung, Geometrie (Linie, Sichtlinie, Flugbahn, Kreis, Kegel)
+ `src/anzeige/`: Renderer, Tilebilder (Pixeldaten zu Bildern), Kamera, Oberfläche, Anzeige des Pegels, Log, Effekte, Textzugriff und Grammatik
+ `src/eingabe/`: Belegung, Übersetzung in Befehle, Maus und Klickregeln, Reise, Vorgaben der Einstellungen
+ `daten/`: Inhalte als JS-Datendateien, gesammelt in `daten/index.js`; `daten/zustaende.js` die Zustände; `daten/regeln.js` hält Regelwerte für das Balancing (z.B. Kettengrenze der Auslöser, Halbwerte des Kampfs); `daten/schadensarten.js` die Schadensarten; `daten/zeichen.js` ist das Tileset aus Zeichen, Ersatz, wo kein Tile aus `grafik/` passt
+ `grafik/`: Palette und Tiles als Pixeldaten, unter der Grafiklizenz, dazu die Vorschauseite `vorschau.html`; siehe [Tileset.md](Tileset.md)
+ `sprache/de/`, `sprache/en/`: Texte (`texte.js`) und Grammatikregeln (`grammatik.js`) als Daten
+ `lib/`: Bibliotheken (rot.js) samt ihrer Lizenzdateien
+ `werkzeuge/`: Arena, Statistiken, Bots; `tiles-ableiten.js` leitet die kleinen Tile-Sätze ab und schreibt `grafik/tileset.js`
+ `tests/`: Unittests (`*.test.js`), siehe Tests und Balancing; `tests/hilfen.js` baut kleine Spiele aus Testkarten (ohne Dungeon-Erzeugung) mit Testeffekten, Schadensarten und Regelwerten (Grundverteidigung dort 0, damit Genauigkeit 100 ohne Ausweichen sicher trifft), samt Wesen, Spielerin und getragenen Gegenständen, macht auf Wunsch die ganze Karte sichtbar, lässt die Welt (Weltuhr, Zeitereignisse) bis zu einem Zeitpunkt laufen, schneidet Meldungen mit und meldet Haken nur für die Dauer eines Tests an
