# Battle Ninkasi - Bedienung

Stand: 2026-11-23

Zuständig für: `src/eingabe/aktionskatalog.js`, `src/eingabe/befehlszeile.js`, `src/eingabe/belegung.js`, `src/eingabe/belegunganpassen.js`, `src/eingabe/charakter.js`, `src/eingabe/eingabe.js`, `src/eingabe/einstellungen.js`, `src/eingabe/einstellungsfenster.js`, `src/eingabe/einstellungskatalog.js`, `src/eingabe/erkunden.js`, `src/eingabe/arenakampf.js`, `src/eingabe/erstellung.js`, `src/eingabe/esckette.js`, `src/eingabe/faehigkeiten.js`, `src/eingabe/fenster.js`, `src/eingabe/hilfe.js`, `src/eingabe/inventar.js`, `src/eingabe/karte.js`, `src/eingabe/laufen.js`, `src/eingabe/maus.js`, `src/eingabe/menue.js`, `src/eingabe/rasten.js`, `src/eingabe/reise.js`, `src/eingabe/schnellleiste.js`, `src/eingabe/texteingabe.js`, `src/eingabe/verlauf.js`, `src/eingabe/zielmodus.js`, `src/anzeige/fenster.js`, `src/anzeige/charakterfenster.js`, `src/anzeige/systemfenster.js`, `src/anzeige/einstellungsanzeige.js`, `src/systeme/vorschau.js`, `src/systeme/untersuchen.js`

Mitprüfen bei Änderungen: [Anzeige.md](Anzeige.md), [Oberflaeche.md](Oberflaeche.md), [Titelbildschirm.md](Titelbildschirm.md), [Charakter.md](Charakter.md), [Gegenstaende.md](Gegenstaende.md), [Animationen.md](Animationen.md), [Welt.md](Welt.md), [Architektur.md](Architektur.md)

## Zweck

Technik der Eingabe: wie Tasten und Maus über Aktionskatalog und Belegung zu Befehlen werden, die Abläufe (Reise, Laufen, Rasten, Erkunden), der Fensterstapel mit allen Fensterarten, Schnellleiste, Zielmodus, Untersuchen und Einstellungen. Das Schema der Oberfläche (was wo liegt, warum) steht in [Oberflaeche.md](Oberflaeche.md). Grundsatz: alles hier ist reine Tasten- und Mauslogik ohne DOM, damit es testbar ist; die Logik bekommt nur gewöhnliche Befehle. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Eingabe

Daten:

+ Aktionskatalog (`AKTIONEN` in `src/eingabe/aktionskatalog.js`): jede Aktion der Oberfläche einmal, `id: { text, gruppe, befehl?, knopf?, platz?, leiste?, ohneTaste? }`
  + `gruppe` aus `GRUPPEN` (bewegen, handeln, schnellleiste, ablaeufe, fenster, anzeige; Reihenfolge der Hilfe)
  + `befehl`: Vorlage des Befehls an die Logik (Bewegen, Warten, Treppe, Aufheben, Trinken, Fortsetzen); Aktionen ohne `befehl` wertet `src/main.js` aus (Fenster, Abläufe, Laufen, Schnellleiste, Zoom, Esc-Kette, Neustart)
  + `knopf`: Wort auf dem Knopf der Bedienzeile (`KNOEPFE`: inventar, faehigkeiten, charakter, karte, rasten, erkunden, hilfe, abbrechen)
  + `platz`: Stelle in der Schnellleiste (`schnellplatz_1` bis `schnellplatz_10`, `PLAETZE_DER_LEISTE` = 10); `leiste`: die Leiste, auf die umgeschaltet wird (`leiste_1` bis `leiste_5`)
  + `ohneTaste`: in der Vorgabe ohne Taste (bisher `einstellungen`), erreichbar über Spielmenü und Befehlszeile, belegbar im Einstellungsfenster
+ Belegung (Vorgabe in `src/eingabe/belegung.js`): `tasten` (physische Taste nach `KeyboardEvent.code` zu Aktion, in der Hilfe genannt), `weitereTasten` (wirken gleich, ohne Nennung, z.B. die US-Lage von + und -), `zeichen` (nach `KeyboardEvent.key`, für Zeichen ohne feste Lage wie `?`, `.`, `<`, `>`), `umschaltBewegen` (Aktion für Umschalt plus Bewegungstaste, `laufen`), `umschaltTasten` (physische Tasten mit Umschalt, Umschalt+1 bis 5 wechselt die Leiste), dazu Maustasten (links handeln, rechts untersuchen) und Mausrad (Zoom)
+ Eigene Belegung (`src/eingabe/belegunganpassen.js`): Abweichungen `{ tasten: { code: aktion | null }, zeichen: { zeichen: aktion | null } }` über der Vorgabe, gespeichert unter `battle-ninkasi.belegung`

Schnittstellen:

+ `uebersetzen(tastenereignis, belegung, spiel)` (`src/eingabe/eingabe.js`) gibt `{ aktion, befehl? }` bzw. beim Laufen `{ aktion, richtung }`; `aktionsergebnis(aktion, spiel)` macht dasselbe für eine Aktion ohne Taste (Befehlszeile)
+ `aktionDerTaste`, `platzDerTaste`, `befehlDerAktion`, `tastenDerAktion` (`src/eingabe/aktionskatalog.js`); auch der Zielmodus liest die Bewegungstasten über den Katalog
+ `abweichungenAnwenden` baut beim Start und nach jeder Änderung die wirksame Belegung; `tasteSetzen` (meldet die verdrängte Aktion), `tasteEntfernen`, `aktionAufVorgabe`, `konfliktVon`, `tasteGesperrt`, `aenderbareTasten`, `abweichungenGueltig`
+ Befehlszeile (`:`, `src/eingabe/befehlszeile.js`, Fensterart `befehlszeile`): Register der Quellen `befehlsquelleAnmelden(name, (kontext) => [{ schluessel, text, ziel }])`, bisher `aktionen` (ohne Laufen), `einstellungen` und `allmacht` (nur im allmächtigen Lauf: "Erzeugen: <Name>" für jedes Wesen und jeden Gegenstand aus `erzeugbareTypen`, "Nach Tiefe <n>" für jede Tiefe des Plans, siehe [Architektur.md](Architektur.md), Spielarten); `ziel` ist `{ aktion }`, `{ einstellung }` oder `{ befehl }`; `befehlstreffer` liefert höchstens `HOECHSTE_TREFFER` = 10
+ Texteingabe in Fenstern (`texteingabeTaste` in `src/eingabe/texteingabe.js`, höchstens 60 Zeichen): druckbare Zeichen hängen an, die Rücktaste löscht; `suchform` für Suchen ohne Rücksicht auf Groß- und Kleinschreibung, Umlaute als ae, oe, ue
+ Esc-Kette (`escSchritt({ zielModus, fensterStapel, laufenderAblauf })` in `src/eingabe/esckette.js`)

Regeln:

+ Vorgabe für die Bewegung nach den vi-Tasten der Roguelikes, nach der Lage der Taste: h j k l für links, unten, oben, rechts, y u b n für die Diagonalen (auf der deutschen Tastatur liegt y auf der Aufschrift Z, Code `KeyY`), `.` wartet; Ziffernblock (5 wartet) und Pfeiltasten bleiben belegt; Umschalt plus Richtung läuft
+ Weitere Tasten: g hebt auf, t trinkt (das erste Getränk im Gepäck), Leertaste setzt eine unterbrochene lange Aktion fort (`fortsetzen`), r rastet bis voll, o erkundet automatisch, a kämpft in der Arena automatisch, i öffnet das Inventarfenster (siehe [Gegenstaende.md](Gegenstaende.md), Inventar), f das Fähigkeitenfenster, c Charakter und Skills, Tab den Verlauf, ? die Hilfe, x untersucht, `<` oder `>` nimmt die Treppe, `:` öffnet die Befehlszeile, 1 bis 0 die Plätze der Schnellleiste, Umschalt+1 bis 5 wechselt die Leiste (auch bei offenem Fenster), d lässt fallen und w wirft (beide über das Inventar), m öffnet die Übersichtskarte, + und - zoomen, Esc die Esc-Kette; die Hilfe nennt Buchstaben klein, wie sie ohne Umschalt getippt werden
+ `aktionDerTaste` sucht in dieser Reihenfolge: Umschalt-Tasten (gehen allem vor), Zeichen (gehen den physischen Tasten vor), Tasten, weitere Tasten
+ Buchstaben in den Fenstern gelten nach dem Zeichen der Taste (`KeyboardEvent.key`, `buchstabeDerTaste` in `src/eingabe/inventar.js`), so passen sie zu jeder Tastaturbelegung; die Belegung selbst nennt physische Tasten (`KeyboardEvent.code`)
+ Offene Fenster und der Zielmodus bekommen jede Taste, bevor die Belegung greift; während ein Fenster Text oder eine Taste aufnimmt, fängt `src/main.js` weder `?` noch Umschalt+Ziffer ab
+ Esc als Kette: erst den Zielmodus abbrechen, dann das oberste Fenster schließen (das Fenster entscheidet selbst, z.B. erst zurück zur Liste), dann einen Ablauf abbrechen, sonst das Spielmenü öffnen
+ Eigene Belegung: gespeicherte Abweichungen auf Aktionen, die der Katalog nicht mehr kennt (umbenannt oder entfernt), fallen beim Lesen weg (`abweichungenGueltig`; siehe [Architektur.md](Architektur.md), Speichern)
+ Eigene Belegung: neu belegt wird immer die physische Taste; hat ihr Zeichen schon eine Aktion (z.B. `.`), verliert das Zeichen sie (Zeichen gehen sonst vor); gespeichert werden nur Abweichungen; nicht belegbar sind Esc, Enter, Tab, `?`, die Funktionstasten und Umschalt, Strg, Alt allein; Umschalt+Richtung und Umschalt+1 bis 5 sind fest
+ Es gibt eine einzige Belegung: für eine Tastatur mit Ziffernblock, aber ohne ihn spielbar (vi-Tasten); Ziffernblock und Pfeile liegen zusätzlich auf der Bewegung; Belegungssätze gibt es nicht
+ Befehlszeile: Treffer am Anfang des Texts zuerst, dann am Wortanfang oder am Anfang der ID, dann als Teilwort in Text oder ID, bei gleichem Rang alphabetisch; Tab übernimmt, Pfeile wählen, Enter führt aus (eine Aktion wie ihre Taste, eine Einstellung öffnet das Einstellungsfenster an diesem Eintrag, ein Befehl geht durch die Eingangstür); später können sich Bierrezepte, Lore-Texte oder Bücher als Quelle anmelden; Zusatzangaben wie `:zoom 32` folgen später
+ Einstellungen haben Vorgaben in `src/eingabe/einstellungen.js`; der Browser speichert nur Abweichungen davon (siehe Einstellungen)

## Maus, Reise, Laufen, Rasten und Erkunden

Daten:

+ Klickregeln (`KLICKREGELN` in `src/eingabe/maus.js`), geordnet, die erste passende greift: `aufheben` (eigenes Feld mit Gegenstand), `angreifen` (angrenzender sichtbarer Feind), `reisen` (sonst); weitere Regeln (Kessel, Händler) kommen in die Liste
+ Ablauf: Zustand in `src/main.js`, je Art ein Kern ohne Timer und DOM: Reise (`src/eingabe/reise.js`), Laufen (`src/eingabe/laufen.js`, mit `bemerkt`), Rasten (`src/eingabe/rasten.js`), Erkunden (`src/eingabe/erkunden.js`), automatischer Kampf in der Arena (`src/eingabe/arenakampf.js`)
+ Einstellungen dazu: `reisePause` (Takt), `reiseTrotzFeinden`, `reiseHalt` (Vorgabe `gegner_in_sicht`, `schaden`, `gegenstand`), `rastenBis` (Vorgabe LP und MP), `rastenTrotzFeinden`, `rastenHalt` (`gegner_in_sicht`, `schaden`), `rastenHoechstens` (1000)

Schnittstellen:

+ `klickDeuten(spiel, feld, regeln)`; je Ablauf ein Beginn und ein Schritt: `reiseBeginnen`/`naechsterReiseschritt`, `laufenBeginnen`/`naechsterLaufschritt` (dazu `bemerkenswerteNachbarn`), `rastenBeginnen`/`naechsterRastschritt`, `erkundenBeginnen`/`naechsterErkundungsschritt`, `arenakampfBeginnen`/`naechsterArenaschritt` (dazu `arenataktik`); jeder Schritt liefert einen gewöhnlichen Befehl oder einen Haltegrund
+ `unterwegsPruefen(spiel, ablauf, haltgruende)` in `src/eingabe/reise.js`: die Prüfung nach jedem Schritt, gemeinsam für alle Abläufe (Gefahrenprüfungen aus dem Register `gefahren`, siehe [Welt.md](Welt.md), Gefahrenprüfung)
+ Erkunden nutzt die Breitensuche `naechstesFeldMit` in `src/welt/wege.js`

Regeln:

+ Die Maus erzeugt nur gewöhnliche Befehle; die Logik kennt weder Maus noch Reise, Laufen, Rasten oder Erkunden; Browser und Bot benutzen dieselben Kerne, den Takt gibt im Browser `src/main.js` vor, alle Abläufe gleich
+ Ein Rechtsklick untersucht das Feld wie x (Zielmodus mit `{ zweck: "untersuchen" }`, Cursor auf dem Feld); das Kontextmenü des Browsers bleibt über der Karte zu; das Mausrad zoomt
+ Gereist wird nur über bekannte Felder und nach dem bekannten Gelände (siehe [Welt.md](Welt.md), Sicht und Erinnerung), der Weg wird bei jedem Schritt neu berechnet; beim Darüberfahren zeigt die Anzeige den Weg als Vorschau
+ Reise, Laufen und Erkunden beginnen auch mit Feinden in Sicht und halten nur bei einem neuen Feind (`reiseTrotzFeinden`, Vorgabe an; aus, beginnt mit Feinden in Sicht nichts); neu heißt: im Schritt davor nicht zu sehen, wer aus der Sicht gerät und wieder auftaucht, hält also erneut (Prüfung `gegner_in_sicht`, Vorbild Brogue)
+ Eine Reise hält bei den Gründen aus `reiseHalt`, außerdem bei Ankunft, fehlendem Weg, versperrtem Feld, Tod und jeder Taste oder jedem Klick; jede Taste und jeder Klick bricht jeden Ablauf ab
+ Laufen (Umschalt plus Richtung) geht geradeaus; beginnt nicht vor einem Hindernis (`versperrt`); hält wie die Reise, vor einem Hindernis (`hindernis`) oder Wesen (`versperrt`), vor einer bekannten Falle oder Gefahr (`gefahr_voraus`) und wenn neben Ninkasi eine Tür, eine Treppe oder ein Gegenstand neu in Reichweite kommt (`bemerkenswert`; schon Bemerktes hält nicht noch einmal); das Halten an Abzweigungen in Gängen fehlt noch
+ Rasten wartet, bis die Vorräte aus `rastenBis` voll sind; beginnt auch mit bekannten Feinden in Sicht (`rastenTrotzFeinden`), nicht aber, wenn schon alles voll ist; hält bei `rastenHalt` und nach höchstens `rastenHoechstens` Schritten, falls sich nichts mehr füllt (z.B. MP bei hohem Pegel)
+ Erkunden geht zum nächsten bekannten Feld am Rand des nie Gesehenen, nur über bekannte Felder (ein kartiertes, ungesehenes Gebiet wird also auch erkundet), nächster Rand per Breitensuche, bei jedem Schritt neu gewählt; hält wie die Reise und wenn nichts mehr zu erkunden ist
+ Automatischer Kampf (Aktion `autokampf`, Taste a): nur in der Arena (sonst "keine_arena"); jeder Schritt ist der Befehl der Taktik aus der Aufstellung (`optionen.arena.taktik`, siehe [Wesen.md](Wesen.md), KI), handlungsunfähig wartet Ninkasi; hält, wenn der Lauf vorbei ist, und wie jeder Ablauf bei jeder Taste; a beginnt wieder, so lässt sich jederzeit zwischen Hand und Automatik wechseln; im Takt `reisePause`; beginnt die Arena automatisch (siehe [Titelbildschirm.md](Titelbildschirm.md), Arena), läuft er gleich nach dem Start
+ Im Zielmodus setzt die Maus den Cursor, ein Klick bestätigt; der Tooltip zeigt beim Darüberfahren die Kurzfassung des Feldes (siehe Untersuchen)

## Fenster

Daten:

+ Fensterstapel (`src/eingabe/fenster.js`): `[{ art, zustand }]`, Anzeige-Zustand in `src/main.js`, nicht im Spielzustand
+ Fensterarten (Register der Eingabe, nicht das der Logik): `titel` (unterste Ebene, siehe [Titelbildschirm.md](Titelbildschirm.md)), `laeufe` (Speicherplätze), `ende` (nach dem Tod), `einstellungen` (aus Spielmenü, Titel, Befehlszeile), `befehlszeile` (`:`), `inventar` (i, mit `absicht` aus d und w), `faehigkeiten` (f), `charakter` (c), `verlauf` (Tab), `karte` (m, `src/eingabe/karte.js`), `menue` (Esc ohne anderes Offenes), `bestaetigung`, `hilfe` (?, auch aus jedem Fenster), `erstellung` (vor jedem neuen Lauf)
+ Zustände der Arten: Inventar `{ gewaehlt, absicht }` (`ABSICHTEN`: fallenlassen, werfen), Spielmenü `{ gewaehlt }` (`MENUE_EINTRAEGE`), Bestätigung `{ frage, werte?, aktion }`, Verlauf `{ filter, versatz, suche, sucheAktiv }`, Charakter `{ gewaehlt, eingabe }`, Erstellung `{ eigenschaften, gewaehlt }`, Fähigkeiten `{ gewaehlt }`, Hilfe `{ thema? }`, Einstellungen siehe dort
+ Fensterinhalt (Anzeige, je Art `(umgebung, zustand) => { titel, kopf?, liste, details?, fuss, breit?, knoepfe?, ohneSchliessen?, hilfewerte?, ebene? }`): `breit: true` auch ohne Einzelheiten breit (Verlauf), `knoepfe: [{ taste, text }]` als Knöpfe in der Fußzeile, `ohneSchliessen` ohne × (Charaktererstellung), `hilfewerte` für die Hilfe zu diesem Fenster, `ebene: true` für eine eigene Ebene statt eines Fensters (bisher der Titel)
+ Klickziele im HTML: `data-taste` (der Tastendruck, für den das Element steht, `tasteAttribut`, `buchstabeAttribut`), `data-ziel` (`zielAttribut`, z.B. `{ stelle }`, `{ zeile, schritt }`, `{ reiter }`), `data-ziehen` (Eintrag zum Ziehen auf die Schnellleiste)
+ Gespeichert: die letzte gültige Verteilung der Charaktererstellung unter `battle-ninkasi.eigenschaften`

Schnittstellen:

+ `fensterartAnmelden(name, { taste, klick? })`, `fensterart`, `oberstesFenster`, `fensterOeffnen`, `fensterTaste(stapel, taste, kontext)`, `fensterKlick(stapel, ziel, kontext)`
+ `taste(zustand, { code, zeichen, umschalt }, kontext)`, `kontext` wie die Umgebung der Anzeige (`spiel`, `daten`, `texte`, `belegung`, `belegungsVorgabe`, `abweichungen`, `einstellungen`, `vorgaben`, `leisten` ...), gibt `{ zustand, oeffnen?, befehl?, auswahl?, grund?, start?, aktion?, leiste?, befehlszeile?, einstellungen?, abweichungen? }` zurück:
  + `zustand: null` schließt das Fenster; `oeffnen` legt ein Fenster auf
  + `befehl` geht an die Logik; `auswahl` leert den Stapel und öffnet den Zielmodus; `grund` nennt das Log
  + `start` beginnt einen Lauf mit Startoptionen; `aktion` führt `fensteraktionAusfuehren` in `src/main.js` aus (ein Name oder `{ art, ... }`, z.B. `neustart`, `zum_titel`, `{ art: "neuesSpiel", stelle }`, Vollbild, Beenden)
  + `einstellungen` und `abweichungen` übernimmt `src/main.js` sofort und speichert sie; `befehlszeile` ist das Ziel eines Treffers; `leiste` ändert die Schnellleiste (`{ belegen: { stelle, platz } }` oder `{ entfernen: platz }`)
+ `klick(zustand, ziel, kontext)` der Fensterart (Inventar, Charakter, Erstellung, Einstellungen, Befehlszeile) für `data-ziel`
+ `listeBedienen` (`src/eingabe/menue.js`) für senkrechte Listen wie Menü, Titel, Läufe und Ende: Pfeile oder j/k rundum, Enter, Buchstabe wählt direkt
+ Anzeige: `fensterHtml` (`src/anzeige/fenster.js`); Inhalte von Charakter und Erstellung in `src/anzeige/charakterfenster.js`, von Spielmenü, Bestätigung, Verlauf, Übersichtskarte und Ende in `src/anzeige/systemfenster.js`, von Einstellungen und Befehlszeile in `src/anzeige/einstellungsanzeige.js`
+ Lesefunktionen für das Charakterfenster in `src/systeme/skills.js`: `skillUebersicht`, `epBisStufe` (darauf `epBisHoechststufe`), `lernvorschau` (dieselbe Rechnung wie `epAufSkill`, ändert nichts), `lerntempoProzent` (100 bei 2 x primär + sekundär = `bezugswert`), `ermoeglicht`; für die Erstellung `punkteZuVerteilen`, `restpunkte`, `vorgabeEigenschaften`, `erstellungHilfewerte` in `src/eingabe/erstellung.js`

Regeln:

+ Das oberste Fenster bekommt jede Taste, Fenster kosten keine Spielzeit; gezeigt wird nur das oberste, der Titel nennt den Weg durch den Stapel ("Charakter › Hilfe"); ohne Einzelheiten ist das Fenster schmal (600 statt 1100 px); ein offenes Fenster schluckt Klicks auf die Karte
+ Nach dem Tod öffnen sich nur Fenster, die nichts am Lauf ändern (`FENSTER_NACH_DEM_TOD` in `src/main.js`): Menü, Hilfe, Verlauf, Karte, Einstellungen, Befehlszeile, Bestätigung und Ende
+ Eine eigene Ebene (`ebene: true`) zeichnet `fensterHtml` nicht und lässt sie aus dem Weg durch den Stapel, ihr `fuss` gilt aber für die Hilfe darüber; gezeichnet wird sie von `titelHtml` (`src/anzeige/titel.js`) in `#titel`
+ Maus in Fenstern, Grundsatz "Klick ist Taste": `src/main.js` gibt `data-taste` als gewöhnliche Taste an `fensterTaste`; so gibt es keinen zweiten Weg durch die Logik, und Tastatur und Gamepad können nie weniger als die Maus; `data-ziel` wählt wie die Pfeile, die schon gewählte Zeile wirkt wie Enter
+ Das × in der Titelzeile trägt Esc; ein Rechtsklick im Fenster wirkt wie Esc (im Inventar also erst zurück zur Liste); ein Klick außerhalb des obersten Fensters (Karte, Seitenleiste, Log, Knopf Menü) schließt es, außer Charaktererstellung, Bestätigung und Titel; das Rad blättert im Verlauf, sonst die Listen des Browsers; Darüberfahren hebt hervor, ohne die Auswahl zu ändern
+ Inventar (`src/eingabe/inventar.js`): i öffnet und schließt, d und w öffnen mit Absicht; a bis z wählt den Gegenstand an dieser Stelle des Gepäcks, dann t trinken, a anlegen oder ablegen (je nachdem), f fallen lassen (der ganze Stapel), w werfen (weiter im Zielmodus), eine Ziffer legt die Art auf die Schnellleiste, Entf nimmt sie von allen Leisten, Esc zurück zur Auswahl; Angelegtes ist im Gepäck markiert; Enter hat eine Standardhandlung (trinken, wenn trinkbar, sonst anlegen oder ablegen, wenn ausrüstbar); mit Absicht lässt der Buchstabe den Gegenstand gleich fallen bzw. öffnet den Zielmodus zum Werfen, Titel und Fußzeile nennen die Absicht
+ Spielmenü: Fortsetzen, Hilfe und Einstellungen (legen sich darüber), Neuer Lauf (fragt über `bestaetigung` nach, abschaltbar mit `neustartNachfragen`; der alte Lauf geht als aufgegeben in die Chronik), Zum Titel (speichert), Beenden (`window.close()`; im Fenster aus `starten.py` erlaubt über `dom.allow_scripts_to_close_windows`, sonst nennt das Log Strg+W); der Fuß nennt Startwert und Version
+ Bestätigung: j, y oder Enter gibt die Aktion zurück, n oder Esc schließt; `werte` füllen die Platzhalter der Frage
+ Fenster nach dem Lauf (`ende`, `endeTaste`, `ENDE_EINTRAEGE`): öffnet sich nach dem Tod von selbst, nennt Tiefe und Züge; Neuer Lauf (derselbe Platz), Zum Titel, Verlauf ansehen; Esc schließt, Enter öffnet es wieder
+ Verlauf: das ganze Log, `VERLAUF_SEITE` = 30 Zeilen je Seite, Filter `VERLAUF_FILTER` (alle, geschehen, kampf, gefahr, fund, lernen, hinweis) per Buchstabe, Pfeile oder j/k, Bild auf und ab, Pos1 und Ende blättern; `/` beginnt die Suche (Tippen filtert nach Text wie die Befehlszeile, Enter beendet die Eingabe, die Suche bleibt stehen), Esc löscht erst die Suche und schließt dann, Tab schließt
+ Charakter und Skills: Kopf mit den sechs Eigenschaften (Grundwert, abweichender wirksamer Wert in Klammern) und den freien EP; Liste aus `skillUebersicht` nach Set und Tier mit Stufe (●●○○○) und "noch N EP"; gesperrte Skills ausgegraut, Skills mit `freischaltung` erst nach der Freischaltung sichtbar; Einzelheiten mit Tier, Stufe, EP bis zur nächsten und zur höchsten Stufe, Lerntempo in Prozent mit den Eigenschaften, Wirkung je Stufe (jetzt), Wirkungen ab Stufe, Voraussetzungen mit ✓ und ✗, ermöglichte Skills, Lernanlässe und Querlernen, dazu die Vorschau des Verteilens
+ Verteilen: Pfeile, Bild auf und ab (26 je Seite) und A bis Z wählen; Enter verteilt bis zur nächsten Stufe, Umschalt+Enter bis Stufe 5, Ziffern tippen eine Zahl, Rücktaste löscht, jeweils höchstens die freien EP; der Befehl ist `lernen` (ohne Spielzeit); Esc löscht erst die Zahl, dann schließt es; gesperrt oder ohne EP gibt es einen Grund statt eines Befehls
+ Charaktererstellung: vor jedem neuen Lauf (Fortsetzen eines Platzes überspringt sie); hinter dem Fenster liegt schon die Karte des Laufs, Enter beginnt ihn mit demselben Startwert und der Verteilung als Startoption, aber nur ohne Restpunkte (sonst Grund `punkte_uebrig`); Pfeile hoch und runter wählen, links und rechts oder - und + ändern, A holt die ausgewogene Vorgabe (`eigenschaften` an Ninkasi in `daten/ninkasi.js`), Esc tut nichts; vorbelegt mit der letzten gültigen Verteilung; die zu verteilenden Punkte rechnet allein `punkteZuVerteilen` (bisher `eigenschaftPunkte`, später mit Makeln und Vorzügen); ohne Erklärtext im Fenster, die Erklärung steht in der Hilfe, deren Text `{start}`, `{punkte}` und `{hoechstens}` aus `erstellungHilfewerte` füllt
+ Hilfe (`src/eingabe/hilfe.js`) in zwei Arten: aus einem Fenster mit `?` geöffnet trägt sie dessen Art als Thema und zeigt nur die Hilfe zum Fenster, den Text `hilfe.thema.<art>` (bisher Charaktererstellung und Charakter; sonst die allgemeine Erklärung der Fenster) und die Tasten aus der Fußzeile des Fensters darunter (`umgebung.darunter`); im Spiel ohne Fenster die allgemeine Hilfe mit allen Tasten aus Aktionskatalog und Belegung (`hilfeGruppen`), Tastennamen über `taste.<code>` in der Sprachdatei oder aus dem Code (`tastenname`, Buchstaben klein); Aktionen mit demselben Text stehen in einer Zeile (die zehn Plätze der Schnellleiste)
+ Tests ziehen `data-taste` und `data-ziel` aus dem HTML jedes Fensters und lösen sie aus; der Bot tut dasselbe alle 500 Befehle am echten Spielstand

## Schnellleiste

Daten:

+ Anzeige-Zustand (`src/eingabe/schnellleiste.js`), gespeichert im Teil `oberflaeche` des Speicherstands: `{ leisten: [5 x 10 Plätze], aktiveLeiste, abgelegt }` (`ANZAHL_LEISTEN` = 5)
+ Platz: `{ art: "faehigkeit", faehigkeit, vonHand? }` oder `{ art: "gegenstand", typ, vonHand? }`; `platzSchluessel` macht daraus den Schlüssel für `abgelegt` und `stellenVon`

Schnittstellen:

+ `neueLeisten`, `leistenGueltig`, `aktivePlaetze`
+ `leistenNachfuehren(spiel, leisten)` nach jedem angenommenen Befehl
+ Umbelegen: `platzBelegen` (zieht von einem anderen Platz um, gilt als von Hand), `plaetzeTauschen`, `platzLeeren` und `ohneSchluessel` (merken den Schlüssel als abgelegt), `leisteWechseln`
+ `platzZustand(spiel, platz)`: bei Gegenständen die Anzahl aller Stücke der Art, bei Fähigkeiten die Abklingzeit in Zügen, dazu ein Grund aus `faehigkeitPruefen`, der nicht am Ziel liegt
+ `platzAusloesen(spiel, leisten, stelle)`: ein trinkbarer Gegenstand wird sofort zum Befehl `trinken` mit dem ersten Stück der Art (`erstesStueck`), ein anderer zur Auswahl zum Werfen, eine Fähigkeit zur Auswahl für den Zielmodus mit `platz`; ein leerer Platz tut nichts
+ `stellenVon(leisten, schluessel)` sagt, wo ein Eintrag liegt; Inventar und Fähigkeitenfenster zeigen es in den Einzelheiten

Regeln:

+ Gegenstände liegen nach ihrer Art auf dem Platz: ist ein Stapel aufgebraucht, bleibt der Platz grau mit Anzahl 0 (Grund `nichts_mehr_davon`) und füllt sich wieder, sobald Ninkasi ein Stück derselben Art trägt; aufgebraucht zeigt er den Namen aus den Daten, eine unbekannte Art ihr Etikett
+ Nachführen: neue Fähigkeiten in Lernreihenfolge und neue Getränkearten in der Reihenfolge des Gepäcks rücken auf den ersten freien Platz der Leiste 1, dann der Leisten 2 bis 5; was heruntergenommen wurde (`abgelegt`), kommt nicht von selbst wieder; von Hand belegte Plätze bleiben; Wurfwaffen kommen nur von Hand dazu
+ Im Inventar und im Fähigkeitenfenster legt eine Ziffer das Gewählte auf diesen Platz der aktiven Leiste, Entf nimmt es von allen Leisten (Fensterergebnis `leiste`); mit der Maus tauscht ein Platz auf einen anderen gezogen, ein Eintrag aus diesen Fenstern (`data-ziehen`) belegt, ein Platz aus der Leiste gezogen wird leer
+ Ein Grund, der nicht am Ziel liegt, macht den Platz grau, der Tooltip nennt ihn

## Zielmodus

Vorbilder: DCSS (Cursor mit Tab zum nächsten Ziel, Vorschau getrennt von der Wirkung), Brogue (Bahn und Fläche vor dem Wurf sichtbar), Into the Breach (die Vorschau sagt, was passiert).

Daten:

+ Auswahl: `{ zweck: "werfen", gegenstandId }`, `{ zweck: "faehigkeit", faehigkeit }` oder `{ zweck: "untersuchen" }`
+ Zustand nur in der Anzeige (`src/eingabe/zielmodus.js`): `{ auswahl, zielart, cursor, platz? }`; `letztesZielId` in `src/main.js`, gesetzt bei jedem angenommenen Befehl mit Ziel
+ Feste Tasten: `TASTEN_BESTAETIGEN` (Enter), `TASTE_NAECHSTES_ZIEL` (Tab), `TASTE_ABBRECHEN` (Esc), `TASTE_UNTERSUCHEN` (x)

Schnittstellen:

+ `zielmodusBeginnen(spiel, auswahl, { platz, letztesZielId })` gibt den Modus zurück, bei Fähigkeiten ohne Ziel, mit Zielart `selbst` oder `aufrecht` gleich den Befehl, bei Gründen, die nicht am Ziel liegen (z.B. `abklingend`, `zu_wenig_mp`), den Grund
+ `zielmodusTaste`, `cursorSetzen`, `zielmodusBestaetigen`, `zielmodusVorschau`, `zieleInSicht`, `zielvorgabeVon`, `zielangabeVon`
+ Fähigkeitenfenster (`src/eingabe/faehigkeiten.js`, Taste f): a bis z wählt und zeigt Verbrauch, Abklingzeit und Platz in der Schnellleiste, Enter oder derselbe Buchstabe wirkt, Esc zurück bzw. schließt
+ Vorschau (`src/systeme/vorschau.js`, ändert nichts, würfelt nicht): `zielvorschau(spiel, akteur, auswahl, zielangabe)` gibt `ok`, den Grund (aus der Prüfung des Befehls), die Auflösung aus `zielAufloesen` (Felder, Bahn, siehe [Wirkungen.md](Wirkungen.md), Zielauswahl) und die betroffenen Wesen mit ihrer Trefferchance zurück; `trefferchanceVorschau`, `nahkampfchanceVorschau`
+ Geschossbahn: `src/anzeige/animation.js` (ohne Timer und DOM), abgespielt für jede Meldung `geschoss`, Takt `geschossPause` aus `src/main.js`

Regeln:

+ Werfen kommt aus dem Inventarfenster (Gegenstand wählen, dann w), Fähigkeiten aus dem Fähigkeitenfenster oder der Schnellleiste
+ Der Cursor beginnt nach der Zielvorgabe: `zielvorgabe` an der Fähigkeit ("feind", "gefaehrte", "selbst", von der Datenprüfung geprüft), ohne Angabe "gefaehrte" bei den Tags `heilung` oder `nuetzlich` an Fähigkeit oder Wirkung, sonst "feind"; Werfen zielt auf Feinde; "feind" ist das nächste nicht verbündete Wesen in Sicht, "gefaehrte" die nächste verletzte Verbündete oder Ninkasi, "selbst" Ninkasi; lebt das zuletzt gewählte Ziel und ist unter den Kandidaten, gewinnt es; ohne Kandidaten steht er auf Ninkasi
+ Die Bewegungstasten der Belegung schieben den Cursor, die Maus setzt ihn, Tab springt reihum zu den Wesen in Sicht (nach Abstand, dann ID), Enter oder Klick bestätigt, aus der Schnellleiste auch dieselbe Ziffer noch einmal (`platz`, Vorbild DCSS), Esc bricht ab; nennt die Vorschau einen Grund, bleibt der Zielmodus offen und das Log nennt ihn
+ Zielangabe aus dem Cursor nach Zielart: `wesen` die ID des Wesens dort (sonst keine), `richtung` das Vorzeichen des Versatzes, sonst das Feld
+ Betroffene wie bei der Wirkung (`wirkungsziele` in `src/systeme/faehigkeiten.js`, beim Wurf mit `wurf.effekt` das erste Wesen der Bahn, ohne Effekt niemand), für Ninkasi nur, was sie sieht
+ Trefferchance: beginnt die Wirkung mit `trefferwurf`, die Prozentzahl aus `trefferanteil` mit den Tags der Wirkung und der Effekte, gegen ein ahnungsloses Ziel 100 % als Hinterhalt; ohne Trefferwurf "sicher"; steckt er nur verschachtelt (z.B. in `fuer_jedes_ziel`), bleibt die Chance offen ("?"), dafür bräuchte es eine Simulation auf einer Kopie des Zustands; Blocken ist nicht eingerechnet
+ Anzeige: der Renderer zeigt die Bahn hell, die Fläche bläulich, die Betroffenen gelb umrandet und den Cursor grün (ginge) oder rot (Grund dagegen); die Seitenleiste nennt oben unter "Zielen", womit gezielt wird, den Grund und die Betroffenen mit Chance; Wirkungen innerhalb eines Effekts (z.B. der Brandkreis der Brandflasche) zeigt die Vorschau nicht
+ Geschossbahn: mit den Feldern, die Ninkasi sieht, ein helles Quadrat je Feld im Takt `geschossPause` (30 ms, 0 schaltet ab); mehrere Bahnen nacheinander, jede Taste überspringt sie und wirkt trotzdem; der Zustand ist dann schon weiter, die Animation ist reine Anzeige
+ Der Bot benutzt Ninkasis Fähigkeiten über dieselbe Logik (Tab oder Feld in der Nähe), auch mit Zielen, die abgelehnt werden

## Untersuchen

Vorbilder: DCSS (Beschreibung mit Trefferchance in beide Richtungen), Brogue (Seitenleiste und Beschreibung des Feldes unter dem Zeiger).

Daten:

+ Geländearten haben dafür einen Namen (`text` in `daten/gelaende.js`, die Datenprüfung verlangt ihn)

Schnittstellen (`src/systeme/untersuchen.js`, reine Lesefunktionen):

+ `feldBeschreiben(spiel, feld)`: nichts für ein unbekanntes Feld, für ein bekanntes, das Ninkasi gerade nicht sieht, das Erinnerte (Gelände, Oberfläche ohne Menge, unter `erinnert` Gegenstände und Fallen als Aussehen ohne ID), für ein sichtbares Gelände, Feldschichten mit Menge, Gegenstände, bekannte Fallen und Wesen
+ `wesenBeschreiben`: LP, Zustände mit Restdauer (`zustaendeVon`: angefangene Züge zu 100 Zeiteinheiten, unbegrenzt ohne), Wachzustand, laufende Aktion (`laufendeAktionVon`), Trefferchance des ersten Angriffsprofils in beide Richtungen (`nahkampfchanceVorschau`)
+ `werteAufschluesseln`: Höchstwerte, Genauigkeit des ersten Profils, Kampfwerte und Sichtweite Ninkasis, je mit Grundwert, Wert und jedem Modifikator samt Herkunft (`herkunftVon`: angeboren, Gegenstand, Zustand, Aura)
+ Tooltip: `tooltipHtml` in `src/anzeige/oberflaeche.js`, Element `#tooltip` über der Karte (siehe [Anzeige.md](Anzeige.md), Oberfläche)

Regeln:

+ Taste x oder ein Rechtsklick öffnet den Zielmodus mit der Auswahl `{ zweck: "untersuchen" }`: derselbe Cursor (Bewegungstasten, Maus, Tab), keine Vorschau, kein Befehl, keine Spielzeit; Enter und Klick tun nichts, Esc oder x schließt
+ Gegen Ahnungslose zeigt die Trefferchance 100 % als Hinterhalt, Blocken ist nicht eingerechnet
+ Die Aufschlüsselung zeigt nur Werte, die nicht 0 sind oder Modifikatoren haben; Modifikatoren mit Bedingungen an ein Gegenüber zählen dort nicht
+ Der Tooltip zeigt die Kurzfassung des Feldes unter dem Zeiger, beim Untersuchen unter dem Cursor, also auch per Tastatur; rechts neben dem Feld, am rechten Rand links davon; nicht während eines Ablaufs
+ Der Bot untersucht alle zehn Befehle Ninkasis Feld samt Werten, per Tab das nächste Wesen und ein Feld daneben, und zählt, welche Meldungen das Log zeigen, verbergen oder hören würde

## Einstellungen

Daten:

+ Vorgaben (`src/eingabe/einstellungen.js`): `layout` ("a", "b", "kompakt"), `oberflaecheGroesse` (15), `logZeilen` (8), `minikarte`, `zoom` (16) mit `zoomstufen` (16, 32, 48, 64), `reisePause` und `geschossPause` (je 30 ms), `reiseTrotzFeinden`, `reiseHalt`, `rastenBis`, `rastenTrotzFeinden`, `rastenHalt`, `rastenHoechstens`, `sofortAusloesen`, `neustartNachfragen`, `bewegungReduzieren`, `hoherKontrast`, `farbenblind`
+ Gespeichert werden nur Abweichungen, unter `battle-ninkasi.einstellungen`; Einstellungen sind keine Befehle und kommen nicht in den Spielstand
+ Einstellungskatalog (`EINSTELLUNGEN` in `src/eingabe/einstellungskatalog.js`): jede Einstellung einmal mit Reiter (`REITER`: anzeige, spiel, tasten, barrierefreiheit) und Art: `schalter`, `auswahl` (feste Werte), `zahl` (min, max, schritt, einheit), `listenschalter` (ein Eintrag einer Liste, z.B. `gegenstand` in `reiseHalt`), `knopf` (Aktion ohne gespeicherten Wert, z.B. Vollbild)
+ Texte `einstellung.<id>` und `.erklaerung`, Werte einer Auswahl `einstellung.<id>.wert.<wert>`, die Null einer Zahl darf eigenen Text haben (`.null`, z.B. "aus")
+ Zustand des Einstellungsfensters (`src/eingabe/einstellungsfenster.js`, Inhalt `src/anzeige/einstellungsanzeige.js`): `{ reiter, gewaehlt, tastenStelle, aufnahme, konflikt, hinweis }`

Schnittstellen:

+ `einstellungenImReiter`, `einstellungLesen`, `einstellungSetzen` (bringt Zahlen auf Grenzen und Schritt), `einstellungSchritt`, `einstellungVorgabe`
+ `einstellungenAnwenden` in `src/main.js`: `data-layout` an `#spiel`, `--log-zeilen` in Layout A, Schriftgröße von `:root`, `data-kontrast` und `data-palette` an `<html>` (überschreiben Farbvariablen in `stil.css`), Minikarte ein oder aus

Regeln:

+ Reiter Anzeige: Layout (A, B, kompakt), Größe der Oberfläche (Schriftgröße von `:root` in px, 12 bis 22, alle Maße in `rem` folgen), Zoom, Logzeilen (Layout A), Minikarte, Vollbild; Spiel: Reisetempo (auch für Laufen, Rasten, Erkunden), Geschossbahn (0 aus), Reisen und Rasten trotz Feinden, Halt bei Gegenständen, Schnellleiste sofort auslösen, Neustart nachfragen; Barrierefreiheit: Bewegung reduzieren (Geschossbahn, Effekte des Titelbilds), hoher Kontrast, Palette für Farbenblinde (Blau und Orange statt Grün und Rot)
+ Layout kompakt ist A mit 3 Logzeilen, Seitenleiste 20rem und kleineren Knöpfen, nur von Hand einstellbar
+ Sofort auslösen: ein Platz der Schnellleiste mit vorbelegtem, gültigem Ziel wirkt ohne zweiten Tastendruck; sonst bleibt der Zielmodus offen
+ Einstellungsfenster: die Kopfzeile nennt alle Reiter, Tab und Umschalt+Tab wechseln; Buchstabe oder Pfeile wählen, links und rechts oder - und + ändern, Enter schaltet um bzw. löst aus, Entf stellt die Vorgabe her; die Einzelheiten nennen Erklärung und Vorgabe; jede Änderung wirkt sofort und wird gespeichert
+ Reiter Tasten: alle Aktionen in der Reihenfolge der Hilfe außer den festen (Laufen, Leisten) mit ihren Tasten und einem freien Platz dahinter; Pfeile wählen Aktion und Taste, Enter nimmt eine neue Taste auf (ersetzt die gewählte oder kommt hinzu), eine gesperrte Taste nennt das Fenster, eine schon belegte als Konflikt mit der anderen Aktion (Enter verschiebt sie, Esc bricht ab), Entf nimmt die Taste weg, Rücktaste stellt die Aktion auf die Vorgabe, die letzte Zeile alle Tasten; geänderte Aktionen sind markiert
+ Ein Test prüft Reiter, Texte und Vorgaben des Katalogs

## Tests

+ `tests/aktionskatalog.test.js` (Katalog, Belegung, Übersetzen), `tests/einstellungen.test.js` (Katalog, eigene Belegung), `tests/fenster.test.js` und `tests/fensterklick.test.js` (Fensterstapel, Fensterarten, Klicks über `data-taste` und `data-ziel`), `tests/arena.test.js` (automatischer Kampf), `tests/oberflaeche.test.js` (Esc-Kette, Menü, Verlauf, dazu Log, Seitenleiste und Minikarte aus [Anzeige.md](Anzeige.md)), `tests/schnellleiste.test.js`, `tests/zielmodus.test.js` (Cursor, Zielvorgabe, Vorschau), `tests/untersuchen.test.js`, `tests/ablaeufe.test.js` (Reise, Laufen, Rasten, Erkunden)
+ Der Bot benutzt Abläufe, Zielmodus, Untersuchen und alle Fenster am echten Spielstand (siehe [Entwicklung.md](Entwicklung.md), Bot und Werkzeuge)

## Verweise

+ Schema der Oberfläche: [Oberflaeche.md](Oberflaeche.md); Titel, Läufe und Chronik: [Titelbildschirm.md](Titelbildschirm.md); Darstellung von Karte, Seitenleiste und Log: [Anzeige.md](Anzeige.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 12, u.a. Halten an Abzweigungen, Vorschau verschachtelter Wirkungen, Blocken in der angezeigten Chance

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
