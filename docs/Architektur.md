# Battle Ninkasi - Architektur

Stand: 2026-11-22

Zuständig für: `index.html`, `package.json`, `lib/*`, `src/main.js`, `src/version.js`, `src/kern/spiel.js`, `src/kern/zustand.js`, `src/kern/zeit.js`, `src/kern/zufall.js`, `src/kern/wurf.js`, `src/kern/ereignisse.js`, `src/kern/hakenkatalog.js`, `src/kern/register.js`, `src/kern/daten.js`, `src/kern/raumindex.js`, `src/kern/kurven.js`, `src/systeme/index.js`, `src/systeme/allmacht.js`, `src/eingabe/speicherstand.js`, `daten/index.js`, `daten/regeln.js`, `daten/aktionen.js`

Mitprüfen bei Änderungen: [Wirkungen.md](Wirkungen.md), [Entwicklung.md](Entwicklung.md), [Titelbildschirm.md](Titelbildschirm.md), [Grundlagen.md](Grundlagen.md), [Texte.md](Texte.md), [Ausblick.md](Ausblick.md), [Welt.md](Welt.md), [Bedienung.md](Bedienung.md)

## Zweck

Der Kern, auf dem alle Systeme stehen: wie Befehle in die Logik kommen, wie Zustand, Zeit und Zufall aufgebaut sind, wie Systeme sich über Register und Haken einhängen, wie Inhalte geladen und Läufe gespeichert werden. Jeder Abschnitt nennt, soweit vorhanden, Daten (Formate), Schnittstellen (Funktionen, Register, Haken) und Regeln (was immer gelten muss).

## Grundsätze

+ Modularität und Erweiterbarkeit haben Vorrang, auch auf Kosten höherer Code-Komplexität
+ Spiellogik und Anzeige strikt getrennt: Die Logik kennt kein DOM, kein Canvas, keine Tasten
+ Die Logik läuft auch ohne Browser (Node), für Tests, Simulationen und Balancing
+ Inhalte sind Daten, Mechanik ist Code; neue Inhalte brauchen im Regelfall keinen neuen Code
+ Jeder Lauf ist aus Startwert und Befehlsliste exakt reproduzierbar
+ Keine Spiele-Engine, kein Build-Schritt; JavaScript-Module (ES-Module), lokal über einen Webserver gestartet, da Module über `file://` nicht laden; `package.json` enthält nur `"type": "module"` und `"private": true`, damit Node alle `.js`-Dateien als ES-Module liest
+ Einzige Bibliothek: rot.js 2.2.1 (BSD-3-Clause) unverändert als ES-Module in `lib/rot/` mit `LICENSE.txt`; benutzt werden Digger (Dungeon), PreciseShadowcasting (Sichtfeld) und AStar (Wegfindung); Warteschlange und Spiel-Zufall sind eigener Code, da sie als JSON speicherbar sein müssen
+ Einstieg im Browser: `index.html` lädt `src/main.js`; es verdrahtet Logik, Anzeige und Eingabe, hält Fensterstapel, Speicherplätze und Chronik und setzt beim Start das Favicon aus dem Tile `ninkasi` (Satz 32)
+ Spieleinstellungen liegen im `localStorage` und gelten je Ursprung (Host und Port); deshalb startet das Startskript auf festem Port (siehe [Entwicklung.md](Entwicklung.md), Starten)

## Datenfluss

1. Eingabe (Tastatur, Maus, später Gamepad) wird über eine frei belegbare Zuordnung in Aktionen des Aktionskatalogs und daraus in Befehle übersetzt (siehe [Bedienung.md](Bedienung.md), Eingabe und Fenster)
2. Befehle gehen durch eine einzige Eingangstür (`befehlGeben`) in die Logik und werden für den Spielstand aufgezeichnet
3. Die Logik prüft den Befehl (am Zug? zulässig?), führt ihn aus und verändert den Zustand
4. Die Logik meldet Ereignisse nach außen (`melden`)
5. Anzeige, Log, Chronik und später Effekte und Sound reagieren auf Meldungen und lesen den Zustand, ohne ihn zu verändern

## Befehle

Daten:

+ Ein Befehl ist ein reines Datenobjekt, z.B. `{ art: "trinken", gegenstandId: 4711 }`
+ Befehlsarten stehen im Register `befehle` als `{ pruefen, ausfuehren, ohneZeit? }`; `ausfuehren` gibt die Aktionsart zurück oder `{ aktion, grundkosten?, umstaende? }`

Schnittstellen (`src/kern/spiel.js`):

+ `befehlGeben(spiel, befehl)` → `{ ok: true }` oder `{ ok: false, grund }`; Gründe des Kerns: `vorbei`, `nicht_am_zug`, `unbekannt` (keine angemeldete Befehlsart), sonst der Grund aus `pruefen` (Meldung `abgelehnt`)
+ Ablauf: prüfen, aufzeichnen (`spiel.befehle`), `befehlAusfuehren` (Befehlsveränderer und Haken `vor_befehl`, Abbruch einer laufenden Aktion außer bei `fortsetzen`, Ausführen, Zugzähler `zuege` und `letzteAktion`, Haken `zug_ende`, `vorgangAbschliessen`, Wiedereinreihen mit `zeitkosten`), danach `warteschlangeAbarbeiten` bis die gesteuerte Entität wieder am Zug ist
+ Befehle gehen an die gesteuerte Entität (siehe Entitäten und Komponenten), Befehlsarten mit `ohneZeit` an Ninkasi selbst
+ Ist die gesteuerte Entität handlungsunfähig, wird jede Eingabe angenommen, aufgezeichnet und als `warten` ausgeführt (Meldung `handlungsunfaehig`, Rückgabe mit `handlungsunfaehig: true`)
+ Befehlsarten mit `ohneZeit: true` (bisher `lernen`, siehe [Wesen.md](Wesen.md), Skills und Lernen) sind Entscheidungen ohne Spielzeit: geprüft, aufgezeichnet und ausgeführt, aber ohne Zug, Zugzähler, `vor_befehl`, `zug_ende` und ohne eine laufende Aktion abzubrechen
+ `zeitkosten(spiel, entitaet, aktion, umstaende, grundkosten)`: Grundkosten aus `daten/aktionen.js` oder dem Angriffsprofil, Modifikatoren `kosten.<aktion>` und `kosten.alle`, Zuschlag bei Überlast (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)

Regeln:

+ Alles, was die Spielerin entscheidet, ist ein Befehl: Bewegen, Angreifen, Trinken, Brauen, aber auch Menüentscheidungen wie Skillwahl, Handel, Rezeptwahl, Weiterbrauen oder Abbrechen
+ Die Anzeige verändert den Spielzustand nie direkt, sie erzeugt nur Befehle
+ Keine Befehle sind reine Anzeige-Zustände: Fenster öffnen, im Log blättern, Tooltips, Karte verschieben, Zoom; sie kosten keine Zeit und kommen nicht in den Spielstand
+ Einstellungen (Tastenbelegung, Zoom, Kameraverhalten) sind keine Befehle und werden getrennt gespeichert
+ Tastatur, Maus, Gamepad, Testbots und Simulationen benutzen denselben Weg; abgelehnte Befehle kosten nichts und werden nicht aufgezeichnet
+ Gegner benutzen dieselben Befehlsarten über `befehlAusfuehren`, ihre Befehle werden aber nicht aufgezeichnet; verändert ein Zustand einen Befehl, wird der ursprüngliche aufgezeichnet (siehe [Wirkungen.md](Wirkungen.md), Zustände)

## Entitäten und Komponenten

Daten (`src/kern/zustand.js`):

+ Zustand: `{ startwert, zeit, naechsteId, naechsteZustandsnummer, einreihungszaehler, warteschlange, entitaeten, spielerinId, vorbei, ebene, tiefe, plan, abgelegteEbenen, sichtbareFelder, zufallszustand, wissen, ruf }`; `tiefe` und `abgelegteEbenen` siehe [Welt.md](Welt.md), Ebenen, `plan` siehe [Welt.md](Welt.md), Plan des Laufs, `wissen` siehe [Gegenstaende.md](Gegenstaende.md), Unbekanntes, `ruf` siehe [Wesen.md](Wesen.md), Fraktionen
+ Spiel: `{ daten, zustand, optionen, befehle, hoerer, zwischenspeicher, anstehendeAusloeser }`; nur `zustand`, `optionen` und `befehle` sind Lauf, der Rest ist abgeleitet oder flüchtig
+ Eine Entität ist eine ID plus Komponenten, z.B. Position, Werte, Inventar, KI, Fraktion, Handel, Braukessel, Sicht; `entitaetAusDatensatz` übernimmt alle Felder eines Datensatzes außer `vorlage`, `abstrakt` und `werte` als Komponenten, `werte` werden über `werteAusDaten` aufgebaut
+ Wesen können in den Daten außerdem `tags`, feste `modifikatoren` und `auren` tragen, siehe [Wirkungen.md](Wirkungen.md), Modifikatoren
+ Werte (LP, MP, PP, Pegel und weitere) sind ein erweiterbarer Satz, keine fest verdrahteten Felder; ein Wert ohne Grundwert ist nach oben offen (z.B. der Pegel), sein Höchstwert wird als `Infinity` berechnet und nie gespeichert; nach unten bleibt jeder Wert bei 0
+ Kurven sind Daten: Stützpunkte `[[stelle, wert], ...]`, aufsteigend nach der Stelle, dazwischen linear und ganzzahlig, außerhalb gleichbleibend (`src/kern/kurven.js`: `wertAufKurve`, `stelleDesHoechstwerts`, `kurvenfehler` für die Datenprüfung); z.B. Regeneration über dem Pegel (siehe [Wesen.md](Wesen.md), Stoffwechsel)

Schnittstellen:

+ Erzeugen: `entitaetErzeugen`, `entitaetAusDatensatz`; danach laufen die Handler des Registers `beimErzeugen` (`(zustand, entitaet) => void`), auch für einen abgespaltenen Teil eines Stapels; so planen Gegenstände ihr Verderben ein und bekommen ihr Etikett
+ Erzeugen aus Daten: `ausDatenErzeugen(spiel, bereich, typ, position)` (`bereich` `"wesen"` oder `"gegenstaende"`) erzeugt aus `spiel.daten[bereich][typ]` und lässt danach die Handler des Registers `ausDaten` (`(spiel, entitaet, datensatz) => void`) ergänzen, was nur aus den Daten folgt, z.B. die Ausstattung eines Wesens (siehe [Gegenstaende.md](Gegenstaende.md), Inventar); alles, was im Spiel aus Daten entsteht (Start, Ebenen, Population, Beschwören, Allmacht), geht hier durch, außer Gegenständen, die nur einen anderen ersetzen (Rückstand, Verderben); Felder eines Datensatzes, die keine Komponenten werden: `vorlage`, `abstrakt`, `werte` (werden umgerechnet), `ausstattung`
+ Lesen: `entitaetMitId`, `alleEntitaeten`, `entitaetenAuf`, `entitaetenImUmkreis`, `entitaetenMitPosition`, `spielerin`, `gesteuerteEntitaet`, `istGesteuert`, `istWesen`, `fraktionVon`, `kiVon`, `bewegungVon`, `plaetzeVon`, `tuerenVon`, `sichtVon`, `eigeneAngriffeVon`, `aussehenVon`, `anzahlWesen`
+ Entfernen: `entitaetEntfernen` (mit gebundenen Zeitereignissen), `ausDemInventarNehmen`

Regeln:

+ Alles in der Welt ist eine Entität: Ninkasi, Gegner, Verbündete, Händler, Items, Kessel, Fallen; Unterschiede entstehen allein durch die Kombination der Komponenten
+ Beispiele: Psi-Kontrolle ändert die Fraktion; Kulturhefe als Verbündete ist ein Dateneintrag; ein Phage tauscht beim Befall Komponenten des Bakteriums aus; ein wandernder Händler hat eine Handelskomponente und eine friedliche Fraktion
+ Der gesamte Zustand ist reine Daten und als JSON serialisierbar (keine Funktionen, keine DOM-Objekte)
+ Zwei Rollen, eine Figur: `gesteuerteEntitaet(zustand)` ist, wer Befehle über die Eingangstür bekommt, wessen Sicht gilt und wem Kamera, Zielmodus, Abläufe, Seitenleiste, Gepäck, Fähigkeiten und Schnellleiste folgen; `spielerin(zustand)` ist Ninkasi, die lernt, weiß (Kennen), deren Tod den Lauf beendet und deren Züge die Bilanz zählt; freie EP und Skills zeigt die Seitenleiste von Ninkasi. Vorerst ist die gesteuerte Entität immer Ninkasi, ohne eigenes Feld im Zustand; `istGesteuert(zustand, entitaet)` ersetzt den Vergleich mit `spielerinId`. Vorkehrung für Besessenheit, siehe [Ausblick.md](Ausblick.md), Steuerung anderer Wesen
+ Komponenten ohne Zahl (Fraktion, KI, Bewegungsart, Plätze, Türen, Sicht, eigene Angriffe, Aussehen) liest der Code nur über ihre Lesefunktionen in `src/kern/zustand.js`; jede nimmt den Wert des jüngsten Zustands, der das Feld trägt, sonst den der Entität. Zustände tragen bisher nur `fraktion`, `ki` und `bewegung` (siehe [Wirkungen.md](Wirkungen.md), Zustände); die übrigen Felder sind die Vorkehrung für Verwandlung (siehe [Ausblick.md](Ausblick.md), Verwandlung), die Datenprüfung lässt sie an Zuständen noch nicht zu. `aussehenVon` liefert den Namen, unter dem die Anzeige Zeichen und Tile sucht, Vorgabe der Typ. Zahlenwerte gehen über Modifikatoren (siehe [Wirkungen.md](Wirkungen.md), Modifikatoren)
+ Positionen ändern sich nur über `positionSetzen` (`src/kern/raumindex.js`), damit der räumliche Index stimmt; Wesen bewegt `versetzen` (siehe [Wesen.md](Wesen.md), Bewegung)

## Zeitmodell

Daten (`src/kern/zeit.js`):

+ Ein einziger Zeitstrahl in ganzzahligen Zeiteinheiten; Dauern werden in Zeiteinheiten angegeben, nicht in Ticks
+ Die Warteschlange enthält drei Arten von Einträgen: Akteure (`art: "akteur"`, Ninkasi, Gegner, Verbündete), die nach dem Handeln mit ihren Aktionskosten wieder eingereiht werden; die Weltuhr (`art: "weltuhr"`) alle `WELTTICK` = 100 Einheiten; Zeitereignisse (`art: "ereignis"`, z.B. "Status endet bei T=4350"), optional an eine Entität gebunden (`gebundenAn`), dann entfallen sie mit ihr
+ Kosten je Aktionsart in `daten/aktionen.js` (Standard 100; Bewegen, Nahkampf, Fernkampf, Trinken, Psi, Magie, Brauen u.a.); Modifikatoren zielen auf eine Aktionsart oder auf alle

Schnittstellen:

+ `einreihen`, `akteurEinreihen(zustand, id, verzoegerung)`, `ereignisEinreihen(zustand, zeitpunkt, typ, daten, gebundenAn)`, `ersterEintrag`, `ersterEintragEntnehmen`, `akteurEntfernen`, `gebundeneEreignisseEntfernen`, `eintraegeHerausnehmen` und `eintraegeEinfuegen` (Wechsel der Ebene), `warteschlangeGueltig` (Bot)
+ Register `welttick` (`(spiel) => void`, z.B. Stoffwechsel, Feldschichten) und `zeitereignisse` (`(spiel, daten) => void`)
+ `warteschlangeAbarbeiten` in `src/kern/spiel.js`: Weltuhr, Zeitereignisse, KI-Akteure (`wahrnehmen`, dann Verhaltensmodul aus dem Register `ki`, ungültige Befehle werden zu `warten`) und Schritte langer Aktionen, bis die gesteuerte Entität am Zug ist; nach jedem Eintrag `vorgangAbschliessen`

Regeln:

+ Aktionskosten statt Runden: Jede Aktion kostet Zeit; wer an der Reihe ist, bestimmt die Warteschlange nach Zeitpunkt
+ Gleichstand wird fest aufgelöst: zuerst die Weltuhr, dann Zeitereignisse, dann Akteure nach Reihenfolge der Einreihung; die Ordnung ist vollständig, die Reihenfolge der Entnahme hängt also nicht vom Aufbau des Heaps ab
+ Die Warteschlange ist ein binärer Heap im Array (bleibt JSON); Entfernen filtert und baut den Heap neu auf
+ Zugzähler: Jede ausgeführte Aktion erhöht `zuege` der Akteurin um eins, gleich wie viel Zeit sie kostet; daran misst sich die Abklingzeit der Fähigkeiten, wer schneller handelt, hat sie in Weltzeit früher zurück
+ Prozentuale Änderungen werden einheitlich gerundet; Rundungsfehler liegen bei etwa 1 % und werden hingenommen
+ Bruchteile (z.B. 0,3 LP pro Tick) laufen über ganzzahlige Speicher in Hundertsteln, ein voller Punkt wird gutgeschrieben, der Rest bleibt stehen
+ Lange Aktionen (z.B. Brauen mit 2000 Einheiten) laufen in Schritten und werden unterbrochen, sobald eine Gefahr auftaucht (Gegner im Sichtfeld, Schaden); nach einer Unterbrechung entscheidet die Spielerin per Befehl: weitermachen oder abbrechen (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen; Folgen eines Abbruchs sind Spieldesign, siehe [Grundlagen.md](Grundlagen.md))
+ Schleifenschutz: mehr als eine Million Einträge ohne Eingabe der Spielerin werfen einen Fehler

## Ereignisse

Zwei Wege: Haken greifen intern ein und dürfen den Kontext ändern, Meldungen gehen nach außen und sind rein lesend (`src/kern/ereignisse.js`).

Daten:

+ Katalog der Haken `HAKENKATALOG` in `src/kern/hakenkatalog.js`, je Haken `{ inBetrieb, ausloeserErlaubt }`: `inBetrieb` sagt, ob die Logik ihn schon auslöst, `ausloeserErlaubt`, ob Auslöser aus Daten daran hängen dürfen (nur Haken "danach")
+ In Betrieb: `vor_schaden` (Schadensart und Menge, Menge ändern oder abbrechen; Ränge `RANG_ANGREIFER` 50, `RANG_RUESTUNG` 200, `RANG_WIDERSTAND` 300, siehe [Wesen.md](Wesen.md), Kampfwerte), `nach_schaden` (bei Schaden über 0), `nach_treffer` (mit `kritisch`), `verfehlt` (mit `grund` "ausgewichen" oder "geblockt"), `vor_tod`, `nach_tod` (mit `position`), `nach_wertaenderung` (`entitaet`, `wertName`, `vorher`, `nachher`), `zustand_beginnt`, `zustand_endet` (mit `grund`), `vor_befehl` (Befehl ersetzen oder abbrechen, dann `warten`), `vor_angriff` (einzelnen Angriff abbrechen), `verlaesst_feld` und `betritt_feld` (mit `position` und `art`, siehe [Wesen.md](Wesen.md), Bewegung), `zug_ende` (`akteurId`, Quelle und Ziel die Akteurin, nach jeder Aktion, z.B. Fallen entdecken), `gegenstand_benutzt` (`gegenstandId`, `art` "trinken", "werfen", "anlegen" oder "ablegen")
+ Reserviert für den Ausbau ([Systemausbau.md](Systemausbau.md)): `zug_beginn`
+ Kontext der Haken mit Beteiligten: `{ quelleId, urheberId, zielId, ursache, kettentiefe, mittel, tags, kritisch }`, dazu je Haken weitere Felder (`menge`, `position`)
+ Meldung: `{ art, zeit, ...daten }`, eingefroren; die Felder `art` und `zeit` sind reserviert
+ Bezug auf eine Entität in Meldungen (`bezugAuf`): `{ id, typ, text, etikett?, ort? }`, `ort` die Position zur Zeit der Meldung; bleibt gültig, auch wenn die Entität entfernt wird; ein unbekannter Gegenstand trägt sein Etikett mit, alte Log-Zeilen ändern sich beim Erkennen nicht

Schnittstellen:

+ `hakenAusloesen(spiel, name, kontext)` → Kontext; Handler über `anmelden("haken", name, handler, { rang })`
+ `melden(spiel, art, daten)`; Hörer über `hoererAnmelden(spiel, hoerer)` (in `src/main.js`: Log, Geschossanimation, Chronik)
+ Meldungen der Gegenstände: `verdorben` und `kaputt` (`was`, `wird`, `traegerin`), `abgenutzt` (`wer`, `was`, `menge`, `prozent`), `fluch_entdeckt` und `fluch_aufgehoben` (`wer`, `was`), `erkannt` (`wer`, `vorher` mit dem Etikett, `was`); das Log zeigt sie nur für Ninkasis Sachen
+ Für die Anzeige von Flächen und Geschossen: `flaeche` (`felder`) und `geschoss` (`bahn`, `aufschlag`, abgespielt im Zielmodus, siehe [Bedienung.md](Bedienung.md), Zielmodus); `aktion_beginnt` nennt bei Fähigkeiten auch `faehigkeit`, `ankuendigung` und `felder`
+ Wertänderungen laufen über eine gemeinsame Funktion (`wertAendern` in `src/kern/effekte.js`), die `nach_wertaenderung` auslöst (z.B. für Pegelschwellen); sie nimmt den Ursprung `{ urheberId, ursache, mittel, kettentiefe }` mit; sinkt der Lebenswert, merkt sich das Wesen den Ursprung als `letzterVerlust`, zugerechnet der Urheberin (ein Wurf zählt für die Werferin, nicht für die Flasche)

Regeln:

+ Nur Haken aus dem Katalog lassen sich anmelden und auslösen, Tippfehler werfen sofort; Mods ergänzen den Katalog
+ Handler laufen nach Rang (kleiner zuerst, Vorgabe `RANG_VORGABE` 100), bei gleichem Rang nach Anmeldung
+ Setzt ein Handler `kontext.abgebrochen = true`, laufen die weiteren Handler nicht mehr (z.B. Schild fängt den Treffer ab, Tod verhindert)
+ Was auf Meldungen reagiert, darf weder den Zustand ändern noch den Spiel-Zufall benutzen

## Register

Daten (`src/kern/register.js`): feste Liste der Registerarten, jede eine Zuordnung Name → Eintrag:

+ `befehle` (`{ pruefen, ausfuehren, ohneZeit? }`), `bausteine` (`(spiel, kontext, parameter) => void`), `ki` (`(spiel, akteur, ki) => befehl`), `modifikatorquellen` (`(spiel, entitaet) => [modifikator]`), `modifikatorbedingungen`, `befehlsveraenderer`, `zielmuster` (`(spiel, auswahl, parameter) => [{x, y}]`), `welttick`, `zeitereignisse`, `haken` (Listen je Name), `gefahren`, `zustandspruefungen` (`(spiel) => true`, wenn sie etwas verändert haben), `laufendeaktionen`, `beimErzeugen`, `ausDaten` (siehe Entitäten und Komponenten), `ausloeserquellen`, `lernanlaesse`, `planschritte` (`(spiel, plan, zufall) => void`), `ebenenschritte` (`{ braucht, liefert, verwirft?, ausfuehren }`) und `mitnehmen` (`(spiel, ninkasi, wechsel) => [id]`), siehe [Welt.md](Welt.md), Plan des Laufs und [Welt.md](Welt.md), Ebenen; `kihandlungen`, `kieingaben` und `nutzungen`, siehe [Wesen.md](Wesen.md), KI

Schnittstellen:

+ `anmelden(art, name, wert, { rang? })`, `abmelden`, `hat`, `holen`, `alle`
+ Systeme melden sich beim Import an; `src/kern/spiel.js` importiert `src/systeme/index.js` und `src/ki/index.js`, damit Browser, Tests und Bot dieselben Register haben; die Reihenfolge der Imports dort ist die Anmeldereihenfolge

Regeln:

+ Daten verweisen nur per Name auf Code; erweiterbar ist grundsätzlich alles über Register (siehe [Wirkungen.md](Wirkungen.md), Effektsystem)
+ Reihenfolge der Anmeldung ist die Reihenfolge beim Durchlaufen (wichtig für Wiederholbarkeit, z.B. bei Welttick und Zustandsprüfungen)
+ Die Listen, die `holen` für Haken und `alle` liefern, liegen eingefroren auf Vorrat und werden erst bei einer An- oder Abmeldung neu gebildet; Aufrufer dürfen sie nicht verändern
+ Eine unbekannte Registerart wirft

## Inhalte als Daten

Daten:

+ Alle Inhalte liegen als JavaScript-Dateien in `daten/` vor, die nur Daten enthalten (`export default { ... }`), mit Kommentaren; `daten/index.js` sammelt sie (neue Datendateien dort eintragen), `daten/regeln.js` hält die Regelwerte, die das Balancing ändern darf, ohne Code anzufassen
+ Dazu gehören Charakter, Eigenschaften, Makel, Skills, Fähigkeiten, Gegner, Verbündete, Händler, Items, Getränke, Zutaten, Rezepte, Kessel, Effekte, Zustände, Tiles, Levelparameter
+ Vorlagen mit Vererbung für Wesen, Gegenstände und Zustände: Einträge mit `abstrakt: true` sind Vorlagen, `vorlage` erbt von ihnen (z.B. "Bakterium", davon abgeleitet "Essigbakterium" mit Abweichungen)

Schnittstellen:

+ `datenLaden(rohdaten, sprache)` in `src/kern/spiel.js` → geprüfte Daten oder `Datenfehler` mit allen Meldungen; darunter `vorbereiten` in `src/kern/daten.js` (`{ daten, fehler }`, Vorlagen aufgelöst)

Regeln:

+ Beim Laden werden alle Daten geprüft (Pflichtfelder, Typen, Verweise auf vorhandene Effekte, Zustände, Verhaltensmodule, Gelände, Texte, Kreise in Effekten); Fehler erscheinen beim Start gesammelt mit klarer Meldung
+ Texte stehen nicht in den Daten, sondern als Schlüssel; siehe [Texte.md](Texte.md)

## Zufall und Wiederholbarkeit

Daten:

+ Spielstand (`spielstand` in `src/kern/spiel.js`): `{ version, startwert, optionen, befehle }`; `optionen` sind die Startoptionen (Eigenschaften aus der Charaktererstellung und seit 0.32.0 die Spielart); Laden heißt Nachspielen ohne Anzeige (`nachspielen`)
+ Vorgesehen, noch nicht umgesetzt: eine Prüfsumme der Daten (samt Mods) im Spielstand; bisher prüft das Laden nur die Version
+ Spielart in den Startoptionen: siehe Abschnitt Spielarten
+ Spiel-Zufall: eigener Generator sfc32 (`src/kern/zufall.js`), nur ganze Zahlen, Zustand aus vier 32-Bit-Zahlen im Spielzustand (`zufallszustand`)

Schnittstellen (`src/kern/zufall.js`):

+ `zufallErzeugen`, `naechsteZufallszahl`, `zufallsGanzzahl(z, min, max)`, `mitProzentChance(z, prozent)`, `mitAnteil(z, zaehler, nenner)` (exakter Bruch), `wuerfeln(z, "1W6+2")`, `wuerfelSpanne("1W6+2")` (kleinster und größter Wurf, ohne zu würfeln), `istWuerfelausdruck`, `startwertAbleiten(startwert, kennung)`
+ Abgeleitete Startwerte: Spiel-Zufall (`"spiel"`), Plan des Laufs (`"plan"`), Grundriss (`"ebene.<tiefe>.<name>"`, bei einem neuen Versuch mit `.versuch<n>`), Türen, Objekte und Inhalt einer Ebene (`.tueren`, `.objekte`, `.inhalt` dahinter) haben eigene Quellen, damit die Ebene nicht vom Spielverlauf abhängt; ebenso die Etiketten unbekannter Gegenstände (`"etiketten"`); später z.B. Buchtexte aus Lauf-Startwert und Objekt-ID

Schnittstellen (`src/kern/wurf.js`, seit 0.36.0):

+ Würfe im Spiel: `wurfGanzzahl(spiel, name, min, max)`, `wurfWuerfel(spiel, name, ausdruck)`, `wurfProzent(spiel, name, prozent)`, `wurfAnteil(spiel, name, zaehler, nenner)`, `wurfAuswahl(spiel, name, liste)`; jeder Wurf trägt einen kurzen Namen (`treffer`, `blocken`, `kritisch`, `schaden`, `heilen`, `menge`, `angriffsprofil`, `risiko`, `ausloeser`, `faehigkeitenwahl`, `bemerken`, `erkennen`, `falle_entdecken`, `abweichen`, `ziel_verfehlen`, `ausbreitung`, `gasabbau`, `entzuenden`, Auswahlen mit `_wohin` wie `kette_wohin`, dazu `zufallsfeld`); ein Wurf ohne Namen wirft
+ Quelle der Würfe: `spiel.wurfquelle`, ein Laufzeitfeld außerhalb des Zustands, nicht gespeichert; ohne Angabe oder mit `{ art: "zufall" }` der Spiel-Zufall, `{ art: "fremd", zufallszustand }` ein eigener Zufallszustand (für viele Simulationen, aus denen Spannen folgen), `{ art: "grenzen", mengen: "kleinste" | "groesste", chancen?: { <name>: true | false }, zufallszustand }` Würfel und Ganzzahlen am kleinsten oder größten Wurf, festgelegte Chancen ohne Wurf, nicht festgelegte Chancen und Auswahlen aus dem eigenen Zufallszustand
+ `mitWurfquelle(spiel, wurfquelle, funktion)` führt eine Funktion mit einer anderen Quelle aus und stellt die vorige danach wieder her, auch nach einem Fehler
+ Zweck: eine Vorschau, die eine Wirkung auf einer Kopie simuliert, verrät mit einer anderen Quelle nicht, was gleich wirklich fällt (siehe [Ausblick.md](Ausblick.md), Vorschau durch Simulation); die Simulation selbst (Kopie des Spiels samt Laufzeitdaten) ist noch nicht gebaut

Regeln:

+ Regeln für die Logik: kein `Math.random()`, keine Uhrzeit, keine Winkelfunktionen, nur ganze Zahlen, feste Reihenfolge beim Durchlaufen von Sammlungen
+ Jede Änderung am Verfahren des Zufalls ändert die Zahlenfolge
+ Jeder Wurf während des Spiels läuft über `src/kern/wurf.js`; nur Generator, Schnittstelle und das Anlegen in `src/kern/spiel.js` fassen `zufallszustand` an (geprüft von `tests/wurf.test.js`); die Welterzeugung würfelt mit eigenen abgeleiteten Startwerten; im echten Spiel rufen die Wurffunktionen dieselben Funktionen in derselben Reihenfolge wie zuvor, die Zahlenfolge blieb mit 0.36.0 gleich
+ Sichere Fälle (Chance 0 oder 100) würfeln nicht, wo der Aufrufer sie vorher prüft; so bleibt die Zahlenfolge von solchen Fällen ungestört
+ Startwert eines neuen Laufs: zufällig (`crypto.getRandomValues` in `src/main.js`) oder über `?seed=` in der Adresse (Zahl, sonst aus dem Text abgeleitet), ebenso `?spielart=` (nur eine aus `SPIELARTEN`); beide gelten nur mit einem leeren Platz; eine Abfrage im Titel nach dem Vorbild Brogue ist vorgesehen
+ Kosmetischer Zufall (Titelbild, Spruch im Titel, später Animationen, Partikel und Textvarianten) nutzt `Math.random()` nur in der Anzeige und berührt den Spiel-Zufall nie
+ rot.js hat einen eigenen, globalen Zufall; er wird nur für die Dungeon-Erzeugung benutzt und vorher mit einem abgeleiteten Startwert gesetzt (`RNG.setSeed` im Schritt `karte_digger`, `src/welt/ebenenschritte.js`)
+ Fallstrick: Die Kartengeneratoren von rot.js (Digger, Uniform) brechen nach einer Zeitgrenze ab (`timeLimit`, gemessen mit `Date.now()`); sie wird deshalb immer auf `Infinity` gesetzt
+ Jede Änderung an Code oder Daten macht alte Spielstände ungültig; passt die Version nicht, wirft das Laden mit klarer Meldung
+ Nebennutzen: Spielstand als Fehlerbericht, Aufzeichnungen zum Anschauen, "Seed des Tages", automatische Tests

## Spielarten

Vorbilder: DCSS (Wizard Mode zum Prüfen, Läufe darin zählen nicht), NetHack (Explore Mode); Ideen für weitere Spielarten in [Titelbildschirm.md](Titelbildschirm.md), Ideen für später.

Daten:

+ `optionen.spielart` (Liste `SPIELARTEN` in `src/kern/spiel.js`: "normal" als Vorgabe und "allmaechtig" seit 0.41.0; eine unbekannte wirft)
+ Regelwerte `regeln.allmacht`: `kammer` (Ebene aus `daten/ebenen.js`, "testkammer", ein leerer Raum mit Treppe hinab) und `tiefe` (0, sonst der Hub); geprüft beim Laden

Schnittstellen (`src/systeme/allmacht.js`, seit 0.41.0):

+ `istAllmaechtig(spiel)`, `erzeugbareTypen(daten)` → `{ wesen, gegenstaende }` (nach Namen geordnet, ohne abstrakte Vorlagen und ohne Ninkasi)
+ Planschritt `testkammer` (siehe [Welt.md](Welt.md), Plan des Laufs): setzt im allmächtigen Lauf die Kammer als Vorlage ihrer Tiefe und `plan.starttiefe` auf diese Tiefe
+ Befehl `erzeugen { typ }`, ohne Zeit: ein Wesen auf das nächste freie, für es betretbare Feld neben Ninkasi (handelt nach einer Aktion Wartezeit), ein Gegenstand in ihr Gepäck; Meldung `erzeugt { wer, was, wohin: "feld" | "gepaeck" }`; Ablehnungen `nicht_allmaechtig`, `unbekannter_typ`, `kein_freies_feld`, `population_voll` (Obergrenze `regeln.population.hoechstWesen`)
+ Befehl `tiefe_waehlen { tiefe }`: Wechsel in jede Tiefe des Plans wie über eine Treppe (`ebeneWechseln`, siehe [Welt.md](Welt.md), Ebenen), Zeitkosten `aktionen.treppe`; Ablehnungen `nicht_allmaechtig`, `keine_tiefe`, `schon_dort`
+ Haken `vor_tod` mit Rang 1000: im allmächtigen Lauf füllt er Ninkasis Lebenswert auf und bricht den Tod ab, Meldung `allmacht_bewahrt` (siehe [Wirkungen.md](Wirkungen.md), Tod und Zustandsprüfung)

Regeln:

+ Eine Spielart gehört zum Lauf, nicht zu den Einstellungen, und lässt sich im Lauf nicht wechseln; die Logik liest sie aus den Startoptionen, so bleibt auch ein Testlauf wiederholbar und die Chronik weiß, wie gespielt wurde; künftige Spielarten (weich, friedlich, eigene Regeln wie die Häufigkeit der Monster) kommen ebenso
+ Allmächtig heißt Testkammer: der Lauf beginnt in der Kammer, die übrigen Tiefen sind dieselben wie im normalen Lauf mit demselben Startwert, weil jede Ebene aus eigenen abgeleiteten Startwerten entsteht; man prüft also die echten Ebenen
+ Unverwundbar heißt: Schaden wirkt wie sonst (die Zahlen bleiben prüfbar), nur der Tod fällt aus; die Allmacht läuft als letzte am Haken, damit andere Rettungen zuerst greifen
+ Erzeugen und Tiefe wählen gehen nur an Ninkasi selbst und laufen wie alles über die Eingangstür, sie stehen also in der Aufzeichnung
+ Getrennte Wertung: die Chronik trägt den Lauf mit seiner Spielart ein, die Zähler zählen nicht mit (siehe [Titelbildschirm.md](Titelbildschirm.md), Stand der Umsetzung 0.41.0)
+ Bedienung: Erzeugen und Tiefen über die Befehlszeile (siehe [Bedienung.md](Bedienung.md), Eingabe)

## Speichern

Daten:

+ Speicherstand (`speicherstandText` in `src/eingabe/speicherstand.js`): `{ version, startwert, optionen, befehle, zustand, vorschau, oberflaeche: { leisten, log, gesehen } }`
+ `vorschau` (`vorschauAusSpiel`): Tiefe, Züge, Startwert, Spielart, `gespeichertAm`; der Titel liest sie über `platzVorschau`, ohne den Zustand einzusetzen
+ `oberflaeche` liest die Logik nie: Stand der Schnellleiste, die letzten `GESPEICHERTE_LOGZEILEN` = 200 Logzeilen (`zeilenEinsetzen` in `src/anzeige/log.js`) und `gesehen`, die Wesenarten, die die Chronik in diesem Lauf schon gezählt hat
+ Schlüssel im `localStorage`: drei Plätze `battle-ninkasi.lauf.1` bis `.3` (`ANZAHL_PLAETZE`, `speicherschluesselPlatz`), `battle-ninkasi.letzter_lauf`, `battle-ninkasi.chronik`; der eine Platz bis 0.31.0 (`battle-ninkasi.lauf`) wird beim Start gelöscht

Schnittstellen:

+ `schnappschuss(spiel)` (Spielstand plus Kopie des reinen JSON-Zustands) und `ausSchnappschuss(daten, stand)` in `src/kern/spiel.js`; `speicherstandLesen`, `platzVorschau`, `platzSpielbar`, `platzFuerNeuesSpiel`, `zuletztGespielt` in `src/eingabe/speicherstand.js` (ohne DOM und ohne `localStorage`)
+ `src/main.js` schreibt: gesammelt höchstens alle 300 ms nach einem Befehl und sofort beim Verlassen der Seite (`pagehide`), nicht während der Charaktererstellung; der Platz des laufenden Spiels ist `aktuelleStelle`
+ Ende eines Laufs (`laufAbschliessen` in `src/main.js`, einmal je Lauf): nach dem Tod oder beim Aufgeben über "Neuer Lauf" ein Eintrag in die Chronik, der ganze Stand bleibt als `battle-ninkasi.letzter_lauf` für ein späteres Abspielen, der Platz wird frei
+ Chronik (`src/eingabe/chronik.js`): `{ format, laeufe, zaehler }`, Läufe mit Version, Startwert, Spielart, Datum, Tiefe, Zügen, Befehlen, Ergebnis und Ursache (höchstens 500, die Zähler bleiben); Zähler frei benannt (`besiegt.<typ>` für Siege Ninkasis, `gesehen.<typ>` einmal je Lauf und Art, `tode`, `laeufe`), erhoben in der Oberfläche aus den Meldungen (Tabelle `ZAEHLREGELN`) und dem Sichtfeld nach jedem Befehl, nie in der Logik; Läufe der Spielarten in `SPIELARTEN_OHNE_ZAEHLER` (bisher "allmaechtig", Abfrage `zaehltMit(spiel)`) stehen in `laeufe`, zählen aber in keinem Zähler, auch nicht in `laeufe`; Freischaltungen sind Bedingungen `{ zaehler, mindestens }` (`freigeschaltet`), zuerst für Titelbilder, später für Erfolge, Bestiarium und Kompendium

Regeln:

+ Die Plätze sind nebeneinander laufende Läufe, keine Sicherungen desselben Laufs
+ Der Spielstand (Startwert, Startoptionen, Befehle) bleibt die verbindliche Aufzeichnung; der Schnappschuss lädt ohne Nachspielen; Index und Zwischenspeicher entstehen aus dem Zustand neu, die vorgemerkten Auslöser sind zwischen zwei Befehlen leer
+ Gemessen: 2152 Befehle sind 62 kB, Nachspielen dauert knapp 1 s; ein Zustand sind etwa 40 kB, das Umwandeln unter 1 ms; deshalb lädt der Schnappschuss und nicht die Befehlsliste
+ Beim Start der Seite erscheint der Titel (siehe [Titelbildschirm.md](Titelbildschirm.md)); Fortsetzen lädt einen Platz, die Charaktererstellung entfällt, das Log nennt das Fortsetzen; ein Platz aus einer anderen Version oder unlesbar heißt im Titel veraltet und lässt sich nur ersetzen oder löschen; lässt sich ein Zustand nicht einsetzen, wird der Platz gelöscht und der Titel sagt es
+ `?seed=` beginnt gleich einen Lauf mit diesem Startwert auf dem ersten leeren Platz (sonst erscheint der Titel) und verschwindet danach aus der Adresse; der Startwert wird nicht in die Adresse geschrieben
+ Die Chronik ist getrennt von den Plätzen und ohne Aufzeichnungen, damit sie neue Versionen übersteht
+ Wissen über Läufe hinweg (seit 0.40.1 als Regel): die Chronik ist die einzige Ablage außerhalb des Laufs; Wissen nur zum Zeigen (Bestiarium, Glossar) liest die Anzeige direkt aus ihr, ohne Eintrag im Spielstand; Wissen mit Wirkung auf die Logik (ein bekanntes Rezept erlaubt das Brauen, ein Gegenstand ist schon erkannt) übernimmt die Oberfläche beim Start des Laufs als Startoption `optionen.vorwissen`, die Logik liest nur `spiel.optionen` und nie die Ablage (geprüft von `tests/ablage.test.js`)
+ Das Vorwissen gilt, wie es beim Start war: was während des Laufs in die Chronik kommt, wirkt erst im nächsten Lauf; das Feld `vorwissen` und sein Format legt das erste System an, das es braucht

## Versionen

+ Schema Ära.Feature.Fix, z.B. 0.3.1: erste Zahl Ära (ein großer Entwicklungsabschnitt), zweite Zahl Feature (eine neue Funktion), dritte Zahl kleines Feature oder Fehlerbehebung; steigt eine Zahl, beginnen die Zahlen rechts davon wieder bei 0
+ 0.0.0 ist die erste Version des Prototyps
+ Einzige Quelle der Versionsnummer ist das Modul `src/version.js` (`export default "<Version>"`), von Browser und Node gleich importiert; die Version ist Teil jedes Spielstands, siehe Zufall und Wiederholbarkeit
+ Jede Version bekommt einen annotierten Git-Tag (`v0.3.1`), auch Fehlerbehebungen; Ablauf siehe [Entwicklung.md](Entwicklung.md), Ablauf einer Version
+ Commits zwischen zwei Versionen tragen dieselbe Nummer wie die vorige Version; verbindlich nachspielbar sind nur Spielstände getaggter Versionen

## Leistung

Schnittstellen (`src/kern/raumindex.js`):

+ Räumlicher Index: je Feld und je Zelle von 8x8 Feldern die IDs, dazu alle Entitäten mit Position, die Fallen und die möglichen Trägerinnen von Auren, alles aufsteigend nach ID
+ Pflege: `entitaetIndexieren`, `entitaetAusIndexNehmen`, `positionSetzen`, `zustaendeGeaendert`, `indexVerwerfen` (Wechsel der Ebene), `indexPruefen` (Bot)
+ Abfragen: `idsAufFeld`, `idsImUmkreis` (Quadrat um eine Mitte, für Lärm), `idsMitPosition`, `fallenIds`, `traegerinnenIds`; darauf `entitaetenAuf`, `entitaetenImUmkreis`, `entitaetenMitPosition` (Gefahrenprüfung, Zorn) und `kandidatenInSicht` (`src/systeme/sicht.js`: für Ninkasi alle mit Position, für andere die innerhalb ihrer Sichtweite; Zielwahl der KI, Bemerken)
+ Vormerkungen der Zustandsprüfungen neben dem Index: `lageVormerken`/`lageOffenEntnehmen`, `todVormerken`/`todOffenEntnehmen`, `kaputtVormerken`/`kaputtOffenEntnehmen`; dazu die Menge der sichtbaren Felder für `istSichtbar`

Regeln:

+ Ziel: 300 Gegner unter 2 ms je Befehl (Ninkasi handelt, danach alle anderen); gemessen mit `node werkzeuge/messung.js [Gegner] [Befehle] [Startwert] [Türen in Prozent] [Brandherde]`, das Essigbakterien und ein Fünftel so viele Fernkämpfer aufstellt
+ Die Reihenfolge der Ergebnisse des Index ist dieselbe wie beim Durchlauf über alle Entitäten
+ Der Index hängt in einer `WeakMap` am Zustandsobjekt, nicht im Zustand: er kommt weder in Spielstände noch in Vergleiche und entsteht beim ersten Zugriff neu, z.B. nach dem Laden oder Nachspielen; der Bot vergleicht ihn nach jedem Befehl mit einem frisch aufgebauten und prüft den Heap
+ Obergrenze der Population `regeln.population.hoechstWesen` (500): darüber entsteht nichts mehr, nicht stillschweigend: Beschwören meldet `population_voll`, das Log zeigt den Hinweis hervorgehoben und die Konsole warnt; bestellt eine Ebene mit Ninkasi mehr Wesen, ist das ein Datenfehler
+ Vorbilder: Gitter als räumlicher Index (bei Rasterspielen üblich), Prüfungen nur für Vorgemerktes; Brogue und DCSS simulieren die ganze Ebene, ferne Wesen werden hier ebenso voll simuliert

Messwerte:

+ Stand 0.17.0: 113 Wesen 0,4 ms, 341 Wesen 1,0 ms, 1173 Wesen 7 ms je Befehl (vorher 1,5 ms, 9,2 ms und quadratisches Wachstum)
+ Stand 0.18.0 mit Türen an der Hälfte der Raumzugänge: 356 Wesen etwa 1,7 bis 2,1 ms, 1176 Wesen etwa 12 bis 13 ms, ohne Türen wie 0.17.0; Bakterien öffnen keine Türen und drängen sich in ihren Räumen, jede Suche im Umkreis findet so mehr Nachbarn
+ Stand 0.19.0: 339 Wesen etwa 1,6 ms, 1160 Wesen etwa 8,5 ms; mit 30 Brandherden 2,2 ms, Feuer, Rauch und das neu berechnete Sichtfeld kosten etwas

## Mods

+ Mods bringen Daten mit und, wenn nötig, eigene Grundbausteine, Verhaltensmodule und Zielmuster als Code, die sich in den Registern anmelden, und ergänzen den Katalog der Haken
+ Beispiel: "Ninkasi wird sauer - das Kombucha-Mod"

## Tests

+ `tests/zeit.test.js` (Warteschlange, Gleichstand, Heap), `tests/zufall.test.js` (sfc32, Würfel, Anteile), `tests/register.test.js` (Ränge, Vorrat), `tests/kurven.test.js`, `tests/daten.test.js` (Datenprüfung), `tests/speichern.test.js` (Schnappschuss, Speicherstand, Plätze), `tests/leistung.test.js` (räumlicher Index), `tests/ausloeser.test.js` und `tests/tod.test.js` (Vorgang), `tests/gesteuert.test.js` (gesteuerte Entität; Dateien für Eingabe, Sicht, Kamera und Zielmodus fragen nicht `spielerin()`), `tests/komponenten.test.js` (Lesefunktionen der Komponenten ohne Zahl mit Überlagerung; Wächter gegen direkte Zugriffe in `src/` mit einer Liste begründeter Ausnahmen), `tests/ablage.test.js` (die Logik in `src/kern/`, `src/systeme/`, `src/ki/` und `src/welt/` nennt weder Chronik noch Browserspeicher)
+ Der Bot prüft Wiederholbarkeit (Nachspielen), Index und Heap nach jedem Befehl und das Laden mitten im Lauf (siehe [Entwicklung.md](Entwicklung.md), Bot und Werkzeuge)

## Verweise

+ Spieldesign: [Grundlagen.md](Grundlagen.md); Speicherplätze und Chronik aus Sicht der Spielerin: [Titelbildschirm.md](Titelbildschirm.md)
+ Offen in [Systemausbau.md](Systemausbau.md): reservierter Haken `zug_beginn` (Punkt 1); Prüfsumme der Daten samt Mods als Idee in [Ausblick.md](Ausblick.md)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
