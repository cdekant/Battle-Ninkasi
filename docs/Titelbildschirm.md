# Battle Ninkasi - Titelbildschirm

Stand: 2026-11-23

Zuständig für: `src/eingabe/titel.js`, `src/eingabe/arenawahl.js`, `src/eingabe/chronik.js`, `src/anzeige/titel.js`, `src/anzeige/titelbilder.js`

Mitprüfen bei Änderungen: [Oberflaeche.md](Oberflaeche.md), [Bedienung.md](Bedienung.md), [Architektur.md](Architektur.md)

Titelbildschirm, Fenster nach dem Lauf und die Ideen, die daran hängen. Der Rahmen (Bildschirme, Fenster, Tasten) steht in [Oberflaeche.md](Oberflaeche.md), das Speichern unter Speichern in [Architektur.md](Architektur.md).

## Vorbilder

Was ein Titel in anderen Spielen leistet (aus Kenntnis der Spiele, nicht im Einzelnen nachgeprüft):

+ Weiche: Fortsetzen, Neues Spiel, Einstellungen, Extras, Beenden; gute Titel wählen Fortsetzen vor, wenn ein Spielstand da ist (Elden Ring, Skyrim, Baldur's Gate 3)
+ Stimmung: Bild, Logo, Musik (Brogue mit Flammenschrift, Hollow Knight, Darkest Dungeon mit Erzähler)
+ Technik: Ladezeit überbrücken, Controller und Konto bestimmen (Konsolen), Sprache und Helligkeit beim ersten Start; im Browser die erste Geste für Ton und Vollbild
+ Fortschritt: Spielstände mit Vorschau (Hollow Knight, Darkest Dungeon); Titel, die sich mit dem Spiel ändern (Undertale, Menüstile in Hollow Knight, der Berg in Celeste)
+ Meta: Bestenliste und Ruhmeshalle (DCSS, Brogue, Caves of Qud), Statistik und Kompendium (Slay the Spire, Spelunky)
+ Spielarten: Tagesherausforderung (Slay the Spire, Spelunky, Caves of Qud), fester Startwert (DCSS, Brogue), Tutorial und Sprint (DCSS), Stufen nach dem Sieg (Ascension), eigene Regeln (Custom Mode), Classic, Roleplay und Wander (Caves of Qud)
+ Aufzeichnungen ansehen (Brogue, möglich durch Determinismus)
+ Vorführmodus nach Leerlauf (Spielhalle, Intro-Filme)
+ Kleine Abwechslung: wechselnder Spruch (Minecraft, Terraria)
+ Roguelites zeigen den Titel selten: der Tod führt direkt in den nächsten Lauf oder den Hub
+ Fehler, die man vermeidet: Vorspann ohne Überspringen, "Drücke eine Taste" ohne Grund, verstecktes Fortsetzen, Einstellungen erst im Spiel, Neues Spiel überschreibt ohne Rückfrage

## Entscheidungen

+ Kein "Drücke eine Taste": die Seite öffnet direkt das Hauptmenü mit Titelbild; der erste Klick oder Tastendruck im Menü ist die Geste, die der Browser später für Ton verlangt
+ Weiche mit Vorwahl: Fortsetzen ist vorgewählt, wenn ein Lauf gespeichert ist, sonst Neues Spiel; Bedienung wie das Spielmenü (Buchstaben, Pfeile, Enter, Klick, "Klick ist Taste")
+ Drei Spalten: links das Menü, in der Mitte das Bild, rechts Vorschau des Laufs, später Ruhmeshalle und Statistik
+ Titelbild quadratisch `Artwork/titel/cover-ninkasi-bierschlaechterin-02.jpg` (1408x1408, ohne eingemalte Schrift, CC0, öffentliches Konzeptbild); auf großen Bildschirmen wird es etwas pixelig, das passt; das Querformat `-01` bleibt als zweites Titelbild
+ Das Bild füllt das Fenster und darf seitlich und in der Höhe beschnitten werden; ein Fokuspunkt je Bild hält Ninkasi im Blick
+ "Battle Ninkasi – Die Rückkehr der Bierschlächterin" steht in der linken Spalte
+ Drei Speicherplätze für nebeneinander laufende Läufe
+ Freischaltbare Titelbilder: Ninkasi im Kampf mit einem Wesen, sichtbar erst, wenn es einmal besiegt oder, bei freundlichen Wesen, getroffen wurde
+ Keine alten Versionen vorhalten, um Aufzeichnungen abzuspielen
+ Fortsetzen zeigt eine Vorschau aus dem gespeicherten Lauf
+ Ein wechselnder Spruch aus allen Korpustexten, ohne gepflegte Liste der Sprüche; darunter der Titel des Korpustexts
+ Einstellungen und Hilfe sind schon im Titel erreichbar (vorhandene Fenster)
+ Neues Spiel fragt nach, wenn noch ein Lauf gespeichert ist
+ Nach dem Lauf (Tod oder Sieg) ein eigener Bildschirm: neuer Lauf, zum Titel, Aufzeichnung sichern, gleich abspielen, Laufbericht, Ruhmeshalle
+ Bestenliste der eigenen Läufe ja, als Ruhmeshalle
+ Vorspann heißt Intro-Film mit Lore und Vorgeschichte, überspringbar und ganz abschaltbar (Idee in [Oberflaeche.md](Oberflaeche.md), Bildschirme)

## Aufbau

+ Das Bild füllt den ganzen Bildschirm (`object-fit: cover`, Fokuspunkt als `object-position`); die Spalten links und rechts sind keine Kästen, sondern ein weicher Verlauf ins Dunkle über dem Bildrand, so dass man sie nur an der Anordnung der Elemente erkennt; die Mitte bleibt frei
+ Links: Spielname mit Untertitel, darunter das Menü senkrecht
+ Rechts: Vorschau des gewählten Laufs, der Spruch aus dem Korpus; später Ruhmeshalle und Statistik
+ Bei schmalen Fenstern rückt alles über das Bild, der Verlauf wird dichter
+ Das Bild trägt keine eigene Schrift, der Spielname steht nur links
+ Stil: das gemalte Bild bleibt Titelbild; Herunterskalieren macht keine Pixelart (bei 320x180 wird der Untertitel unlesbar, mit 32 Farben verlieren die Schleime ihr Grün); echte Pixelart müsste eigens gezeichnet werden und passt eher zum Intro-Film oder als freischaltbares Titelbild
+ Lebendigkeit ohne neues Bild: Dampf und Funken als leichte Animation über dem Bild, abschaltbar über Bewegung reduzieren
+ Mehrere Titelbilder: je Start eines aus den freigeschalteten, keine Bildfolge während des Menüs

Menü der ersten Version: Fortsetzen, Neues Spiel, Läufe (ab zwei belegten Plätzen), Einstellungen, Hilfe, Beenden; keine ausgegrauten Platzhalter für Kommendes.

## Speicherplätze

+ Drei Plätze, ein Schlüssel je Platz (`battle-ninkasi.lauf.1` bis `.3`); Fortsetzen nimmt den zuletzt gespielten, Läufe zeigt alle, Neues Spiel wählt einen freien Platz oder fragt, welcher Lauf weichen soll
+ Größe: der Browserspeicher reicht für mehrere lange Läufe (Messwerte in [Entwicklung.md](Entwicklung.md), Messwerte)
+ Plätze sind nebeneinander laufende Läufe, keine Sicherungen desselben Laufs (Permadeath bleibt)

## Ideen für später

Festgehalten, nicht eingeplant:

+ Ruhmeshalle mit Laufbericht (Morgue, als Todesbericht in [Ausblick.md](Ausblick.md)), Statistik des letzten Laufs und Gesamtstatistik, alles aus der Chronik
+ Weitere Zähler der Chronik, z.B. jemals entdeckte Bierrezepte oder besiegte Abstinenzler; ein neuer Zähler ist eine Zeile in `ZAEHLREGELN`
+ Abspieler für Aufzeichnungen, aus dem Titel und direkt nach dem Lauf; braucht nur die vollständigen Befehle im Spielstand und den aufbewahrten letzten Lauf, beides gibt es
+ Lauf mit festem Startwert (gibt es schon als `?seed=`, fehlt nur das Eingabefeld) und Bier des Tages (Startwert aus dem Datum)
+ Bestiarium, Glossar, Rezeptbuch und Bücher (siehe [Ausblick.md](Ausblick.md), Bestiarium, Glossar, Rezeptbuch)
+ Freischaltbare Titelbilder und Menüstile durch Errungenschaften
+ Vorführmodus: nach einiger Zeit ohne Eingabe spielt eine eigene, sinnvolle Spielweise (erkunden, kämpfen, trinken, zur Treppe reisen, aus den Abläufen) hinter dem Titel einen echten Lauf; jede Taste kehrt zurück; der Bot ist ein Zufallsprüfer und taugt dafür nicht, die Spielweise kann auf den Taktiken aufbauen, die Browser und Werkzeuge schon teilen (`src/ki/taktik.js`, siehe [Wesen.md](Wesen.md), KI); der Hintergrund des Titels ist schon ein eigenes Element
+ Sprachknopf, die aktive Sprache ist markiert
+ Spielarten: Tutorial, Sprint, Stufen nach dem Sieg, eigene Regeln (z.B. Häufigkeit der Monster)
+ Weicher Modus: beim Tod zurück zum letzten gesicherten Stand
+ Friedlicher Modus (keine Feinde oder keine Angriffe); der allmächtige Modus (zum Erkunden und Prüfen) ist als Testkammer umgesetzt
+ Intro-Film mit Menüeintrag "Vorgeschichte" und Einstellung (nur beim ersten Start oder nie), jederzeit nachrüstbar

## Was schon jetzt zu beachten ist

Damit die Ideen später ohne Umbau dazukommen:

+ Spielarten und eigene Regeln laufen über die Startoptionen des Spielstands (`optionen`), die die Logik bei `neuesSpiel` bekommt; so bleiben sie Teil der Aufzeichnung und wiederholbar
+ Ruhmeshalle und Statistik lesen die Chronik: getrennt vom Lauf, Ergebnisse statt Aufzeichnungen, so übersteht sie neue Versionen
+ Aufzeichnungen lassen sich nur mit derselben Version und derselben Prüfsumme der Daten abspielen, weil Code und Daten den Lauf bestimmen (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit); die Ruhmeshalle merkt sich die Version; alte Versionen werden nicht vorgehalten, wer eine alte Aufzeichnung sehen will, holt den Git-Tag der Version
+ Freischaltbare Titelbilder, Erfolge und das Bestiarium lesen dieselben Zähler der Chronik (`gesehen.<typ>`, `besiegt.<typ>`); eine Freischaltung ist eine Bedingung `{ zaehler, mindestens }`
+ Das Datum für das Bier des Tages wird außerhalb der Logik in einen Startwert verwandelt
+ Läufe anderer Spielarten werden getrennt gewertet (siehe [Architektur.md](Architektur.md), Spielarten); auch der weiche Modus ist eine Spielart, auch wenn die Logik von ihm wenig merkt (beim Tod bietet die Oberfläche einen früheren Schnappschuss an)

## Titel und Plätze

+ Titel als unterste Fensterart `titel` (`src/eingabe/titel.js`, Anzeige `src/anzeige/titel.js`) in der eigenen Ebene `#titel`; Esc und ein Klick daneben schließen ihn nicht; Fenster darüber stehen mittig im ganzen Fenster
+ Menü: Fortsetzen (zuletzt gespielter Lauf, nur mit spielbarem Platz), Neues Spiel, Läufe (ab zwei belegten Plätzen), Einstellungen, Hilfe, Beenden; Buchstaben, Pfeile, j/k, Enter, Klick
+ Rechte Spalte: die drei Plätze ("Platz 1: Tiefe 2, Zug 340, 21.11.2026", frei, veraltet), ein Klick setzt fort oder beginnt auf einem freien Platz; darunter der Spruch
+ Neues Spiel nimmt den ersten leeren Platz, sonst einen veralteten; sind alle spielbar belegt, öffnet sich `laeufe` zum Ersetzen mit Nachfrage; `laeufe` setzt fort, beginnt auf freien Plätzen neu, fragt bei veralteten nach und löscht mit Entf nach Nachfrage
+ Spielmenü mit Zum Titel; nach dem Tod öffnet sich `ende` (Neuer Lauf auf demselben Platz, Zum Titel, Verlauf)
+ Titelbilder in `src/anzeige/titelbilder.js` (Datei, Fokus, Freischaltung), geladen direkt aus `Artwork/titel/` ohne Kopie; je Start eines aus den freigeschalteten; ein Test prüft die Dateien
+ Spruch: `sprache/de/korpus/index.js` listet die Korpusdateien (ein Test vergleicht mit dem Ordner), `src/anzeige/korpus.js` zerlegt sie (Kopf, Strophen, Verse ohne Sprecher und Anführungszeichen) in Sätze von höchstens drei Versen; längere gehen als Ausschnitt ihrer ersten zwei Verse ein, Sätze mit Lücken ("...") fallen weg; unter dem Spruch steht der Titel des Korpustexts
+ Chronik, letzter Lauf und Spielart wie unter "Was schon jetzt zu beachten ist", Einzelheiten unter Speichern in [Architektur.md](Architektur.md)
+ Vollbild ist ein Knopf, keine Einstellung; `?seed=` gilt nur mit einem leeren Platz
+ Die Gestaltung (Breite der Spalten, Verlauf, Schriftgrößen) steht in CSS-Variablen und wird nach der Prüfung im Browser nachgestellt

## Testkammer

+ Menü: nach Neues Spiel der Eintrag Testkammer, ein neuer Lauf der Spielart "allmaechtig" (siehe [Architektur.md](Architektur.md), Spielarten) ohne Charaktererstellung, mit den Eigenschaften aus den Daten; er nimmt einen Platz wie Neues Spiel, sind alle belegt, öffnet sich `laeufe` zum Ersetzen (Zustand mit `spielart`); die Aktion ist dann `{ art: "neuesSpiel", stelle, spielart }`
+ Ebenso `?spielart=allmaechtig` in der Adresse, auch zusammen mit `?seed=`
+ Neuer Lauf aus dem Spielmenü oder nach dem Lauf behält die Spielart
+ Der Platz zeigt die Spielart hinter der Vorschau ("Platz 1: Tiefe 0, Zug 12, 22.11.2026 (Testkammer)"), der Kopf der Seitenleiste ebenso hinter Ort und Zeit
+ Chronik: der Lauf steht mit Spielart in `laeufe`, die Zähler (auch `laeufe`, `tode`, `besiegt.<typ>`, `gesehen.<typ>`) zählen nicht mit, Testen schaltet also keine Titelbilder frei

## Arena

+ Menü: nach Testkammer der Eintrag Arena; er öffnet die Fensterart `arenawahl` (`src/eingabe/arenawahl.js`, Anzeige in `src/anzeige/titel.js`) mit den Arenen aus `daten/arenen.js` (Name, Zahl der Wellen oder die Population), darunter von Hand oder automatisch und bei automatisch die Taktik (Spielart und Aufstellung siehe [Architektur.md](Architektur.md), Spielarten)
+ Bedienung: Buchstabe oder Pfeile und Enter starten, Leertaste schaltet zwischen von Hand und automatisch, Tab wechselt die Taktik (Vorgabe die der Arena), Esc schließt; Klick wählt, der zweite startet; Knöpfe für Leertaste und Tab
+ Start wie Testkammer: ein Platz, sind alle belegt, `laeufe` zum Ersetzen (Zustand mit `spielart` und `zusatz`); die Aktion ist `{ art: "neuesSpiel", stelle, spielart: "arena", arena, automatisch, taktik }`; die gewählte Taktik geht in die Aufstellung (`taktik`), bleibt also im Spielstand
+ Adresse: `?spielart=arena`, dazu `?arena=<name>` (Vorgabe die erste) und `?auto=1`
+ Nach dem Kampf öffnet sich `ende` auch beim Sieg (Titel "Die Arena ist leer", Bilanz mit Wellen und Zügen); statt Neuer Lauf heißt der erste Eintrag Nochmal: dieselbe Aufstellung mit dem nächsten Startwert, wieder automatisch, wenn die Arena so begann; Neustart aus dem Spielmenü behält ebenso die Aufstellung
+ Chronik: Ergebnis "sieg" oder "tod", gezählt wird nicht (`SPIELARTEN_OHNE_ZAEHLER`)
+ Offen: eigene Aufstellungen im Browser (Kurzform in der Befehlszeile wie im Werkzeug, oder ein Fenster zum Zusammenstellen), Varianten der Arenen in der Wahl

## Geänderte Daten

+ Ein Platz mit anderer Prüfsumme der Daten heißt "Platz 2: Daten geändert, nicht mehr spielbar" und lässt sich wie ein veralteter nur ersetzen (eigene Nachfrage `laeufe.daten_frage`) oder löschen; Neues Spiel nimmt ihn wie einen veralteten
+ Die Chronik trägt je Lauf die Prüfsumme der Daten, für das spätere Abspielen; ihr Format lässt sich migrieren, Namen in ihren Zählern folgen den Umbenennungen (siehe [Architektur.md](Architektur.md), Speichern)

## Offen

+ Welche Ideen für später in die erste Version wandern
