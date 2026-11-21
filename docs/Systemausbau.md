# Battle Ninkasi - Systemausbau

Stand: 2026-11-20

Mitprüfen bei Änderungen: alle Dokumente, deren Punkte hier umgesetzt werden

Arbeitsliste der Strukturen, die Logik und Datenmodell noch brauchen, damit Fernkampf, Flächenwirkung, Effekte über Zeit, Magie, Psi, Nahkampf und viele Gegner überwiegend als Daten abbildbar sind. Grundlage ist eine Prüfung von Doku und Code mit Stand 0.3.0. Die Begriffe stehen in [Architektur.md](Architektur.md) (Zeitmodell, Register) und [Wirkungen.md](Wirkungen.md) (Wirkungsarten, Effektsystem).

## Arbeitsweise

+ Jeder Punkt wird vor der Umsetzung als Vorschlag ausgearbeitet und freigegeben
+ Ist ein Punkt umgesetzt, wandert seine Beschreibung in das zuständige technische Dokument (Übersicht in CLAUDE.md, Dokumentation; bzw. [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md)) und wird hier gestrichen; bleibt nur ein Rest offen, steht hier nur der Rest
+ Status je Punkt: offen, in Arbeit, umgesetzt in Version X
+ Die Reihenfolge ist eine Empfehlung: 1 bis 4 sind Kernarchitektur, danach sind die meisten Systeme Daten plus wenige neue Bausteine
+ Nächste Schritte (Stand 2026-11-21): Browserprüfung von 0.30.0 bis 0.32.0 (Einstellungen, Tastenbelegung, Befehlszeile, Suche, Klicks in allen Fenstern, Titelbildschirm), dazu die kleinen Nacharbeiten an den Fenstern aus 0.27.0 und die Gestaltung des Titels; danach die Ideen aus [Titelbildschirm.md](Titelbildschirm.md) (Ruhmeshalle, Abspielen, Spielarten) neben den übrigen Schwerpunkten einordnen
+ Nächste Schwerpunkte (Stand 2026-11-20): Skillsystem (Punkt 13, Mechanik seit 0.26.0, Skillfenster seit 0.27.0, offen der Katalog), bevor Details der Reste angegangen werden (davon hängen Kennerschaft und Nachtsicht ab); danach Zustände im Spielinhalt (Punkt 3), dann Licht (Punkt 7), vor Inhalt und Balancing, weil es Heimlichkeit und Gefahr verschiebt; das Brausystem in einer eigenen Sitzung; Darstellung (Punkt 12) ist zurückgestellt
+ Licht lässt sich nachreichen: ohne Angabe gilt jedes Feld als hell, das Spiel verhält sich dann wie bisher

## Bekannte Fehler

+ Vertauschte Buchstaben Y und Z in Inventar- und Fähigkeitenfenster auf der deutschen Tastatur: mit 0.25.0 behoben (Buchstaben nach `KeyboardEvent.key`)
+ Die drei Fehler aus der Prüfung (Tod durch `wert_aendern`, verwaiste Gegenstände, verwaiste Zeitereignisse) sind mit 0.4.0 behoben

## 1. Tod, Haken, Auslöser

Status: umgesetzt in Version 0.4.0, beschrieben in [Architektur.md](Architektur.md) (Ereignisse), [Wirkungen.md](Wirkungen.md) (Tod und Zustandsprüfung, Auslöser)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Ersatzwirkungen aus Daten (z.B. "Phönixbier verhindert einmal den Tod", "Schild fängt einen Treffer ab"): eigener Typ, der sofort am Haken "davor" wirkt und sich verbrauchen kann; mit den Zuständen (Punkt 3)
+ Auslöser auch an Skills (mit dem Skillsystem, Punkt 13) und am Inventar der Trägerin, das nicht angelegt ist (die Ausrüstung ist seit 0.21.0 Teil der Kaskade)
+ Die reservierten Haken des Katalogs in Betrieb nehmen: `zug_beginn` (Punkt 3, sobald etwas ihn braucht); `betritt_feld` und `verlaesst_feld` sind seit 0.16.0 in Betrieb, `zug_ende` seit 0.18.0, `gegenstand_benutzt` seit 0.21.0
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud); erst nötig, wenn mehr als die Beteiligten gefragt werden
+ Erster Auslöser im Spielinhalt (z.B. Säurespritzer des Essigbakteriums beim Tod): Spieldesign, noch nicht entschieden

## 2. Effektkontext, Zielauswahl, verschachtelte Effekte

Status: umgesetzt in Version 0.5.0, beschrieben in [Wirkungen.md](Wirkungen.md) (Effektsystem, Auslöser, Zielauswahl)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Sichtlinie und Flugbahn für die KI (Punkt 7); nach dem Anspielen prüfen, ob Ersatzlinien oder symmetrischer Schattenwurf für das Sichtfeld nötig sind
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt (Punkt 9), Animation der Meldung `flaeche` (Punkt 12, `geschoss` seit 0.24.0)

## 3. Zustände

Status: umgesetzt in Version 0.6.0 (Grundgerüst) und 0.7.0 (Verhalten, Beschwörung), beschrieben in [Wirkungen.md](Wirkungen.md) (Zustände), [Architektur.md](Architektur.md) (Befehle), [Wesen.md](Wesen.md) (Wahrnehmung)

Entschieden: Takt ist die Weltuhr; Stapelregel je Zustand, Vorgabe `erneuern`; Verlauf mit drei Namen oder eigener Kurve; handlungsunfähige Ninkasi wartet je Eingabe eine Aktion; Torkeln und Verwirrung über denselben Veränderer, Verwirrung greift auch Freunde an; Beschworene werden der Beschwörerin zugerechnet; Zustände im Spielinhalt erst, wenn der Systemausbau abgeschlossen ist (bis dahin nur in den Tests und seit 0.25.0 der vorläufige `testzustand` der Testfähigkeit); seit 0.8.0 kommen ihre Modifikatoren aus der Modifikatorquelle `zustaende`

Offener Rest:

+ Torkeln aus dem Pegel: eine Schwelle des Stoffwechsels setzt einen Zustand (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Ob gebundene EP für Tötungen durch Beschworene in den Skill der Beschwörung fließen: Spieldesign in [Charakter.md](Charakter.md), mit dem Beitragsbuch (Punkt 13)

## 4. Modifikatoren

Status: umgesetzt in Version 0.8.0 (Register der Modifikatorquellen, Verrechnung, Zustände ohne Nachführen) und 0.9.0 (Bedingungen, Tags, Auren), beschrieben in [Wirkungen.md](Wirkungen.md) (Modifikatoren, Zustände)

Entschieden: Verrechnung nach dem Vorbild "increased" und "more" (Prozente addieren, nur `mal` multipliziert, einmal gerundet, `hoechstens` gewinnt gegen `mindestens`); Boni zwischen Quellen multiplizieren nicht automatisch, sondern nur über `mal` in den Daten; Auren ohne Sichtlinie (Option `sichtlinie: true`), `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl, standardmäßig nicht auf sich selbst; Tags als eigenes Feld am Modifikator

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Modifikatorquelle `skills` (Punkt 13); `ausruestung` seit 0.21.0
+ Tags in weiteren Abfragen: Schadensarten und Widerstände seit 0.10.0, Verbrauch, Zeit und Abklingzeit der Fähigkeiten seit 0.12.0

## 5. Kampfwerte

Status: umgesetzt in Version 0.10.0 (Schadensarten, Widerstand, Immunität, Rüstung, Ausweichen, Willenskraft, Blocken, Krit, Marker, Baustein `trefferwurf`) und 0.11.0 (Angriffsprofile mit Zeitkosten, `vor_angriff`), beschrieben in [Wesen.md](Wesen.md) (Kampfwerte)

Entschieden: Kampfwerte sind Punkte, die über einen Halbwert zu Anteilen werden, die sich 100 % nur annähern (Trefferchance, Blocken, Kritchance, Widerstand); Trefferchance als Verhältnis von Genauigkeit zu Verteidigung plus Grundverteidigung, ohne harte Grenzen; Rüstung als fester Abzug mit Mindestschaden 1; Verwundbarkeit nähert sich dem doppelten Schaden; Immunität als eigener Sonderfall; Kritfaktor x1,5 als Regelwert, nach oben offen; `art` am Baustein `schaden` ist Pflicht; mehrere Angriffe laufen in einer Aktion nacheinander, die Aktion kostet so viel wie ihr langsamstes Profil; Durchschaubarkeit kommt aus der Anzeige der errechneten Prozentzahl, nicht aus der Formel

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Ersatzwirkungen (Rest aus Punkt 1) achten den Marker `unblockbar`
+ Anzeige: schwebende Krit-Zahlen (Punkt 12); Trefferchance im Zielmodus seit 0.24.0, beim Untersuchen seit 0.25.0
+ Kampfwerte aus Skills (z.B. Ausweichen aus einem Skill der Gewandtheit, Widerstand gegen Gift aus einem der Trinkfestigkeit); Eigenschaften speisen Kampfwerte nicht direkt (entschieden 2026-11-20, [Charakter.md](Charakter.md)), die Zuordnung steht im Skillkatalog

## 6. Fähigkeiten und lange Aktionen

Status: umgesetzt in Version 0.12.0 (Datentyp Fähigkeit, Befehl `faehigkeit`, Verbrauch, Material, Abklingzeit, Voraussetzungen, Risikotabellen, aufrechterhaltene Zauber mit Unterhalt, dazu `auf: "quelle"` und der Veränderer `ziel_verfehlen`) und 0.13.0 (lange Aktionen mit Unterbrechung und `fortsetzen`, Rasten und Auto-Erkunden in der Eingabe), beschrieben in [Wirkungen.md](Wirkungen.md) (Fähigkeiten, Lange Aktionen, Zustände), [Bedienung.md](Bedienung.md) (Maus, Reise, Laufen, Rasten und Erkunden)

Entschieden: Modifikatorziele `verbrauch.<wert>` für Vorräte, `kosten.*` bleibt die Zeit; Abklingzeit in eigenen Zügen der Wirkenden (schneller Handelnde haben Fähigkeiten in Weltzeit früher zurück); Psi-Risiko als Mechanismus mit vorläufigen Zahlen, die Folgen von Rückschlag und Glimmer sind Spieldesign; Rituale und Brauen laufen in der Logik, Rasten und Auto-Erkunden in der Eingabe wie die Reise; beim Abbruch einer langen Aktion sind die Kosten verloren, `beimAbbruch` wirkt; die Gründe zur Unterbrechung stehen in den Regeln, weil sie das Nachspielen bestimmen

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Gegner benutzen Fähigkeiten (Auswahl in der KI), kündigen Angriffe an und lassen sich bei langen Aktionen durch Schaden unterbrechen (Punkt 7)
+ Brauen als eigene Art langer Aktion (Register `laufendeaktionen`), sobald das Brausystem entworfen ist ([Grundlagen.md](Grundlagen.md))
+ Folgen von Rückschlag und Glimmer (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Passive Fähigkeiten sind Modifikatoren und Auslöser aus Skills und Ausrüstung (Modifikatorquellen `skills`, `ausruestung`)

## 7. Fernkampf, Fraktionen, Wahrnehmung, viele Gegner

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.14.0 (Fraktionen als Daten mit Zorn, Wahrnehmung mit Wachzustand, Heimlichkeit, Bemerken, Lärm und Hinterhalt), 0.15.0 (die KI nutzt Fähigkeiten und hält Abstand, schont Verbündete, `ueberVerbuendete`, angekündigte und unterbrechbare lange Aktionen, Baustein `angreifen`, Auslöser mit `wenn`, Testgegner Fernkämpfer-Test), 0.16.0 (Bewegungsarten mit `passierbarFuer` und `phasend`, `versetzen` mit den Haken `betritt_feld` und `verlaesst_feld`, Stoßen, Ziehen, Tauschen, Teleportieren, Lageprüfung, Werfen, `unterbrechbar` als Liste) und 0.17.0 (räumlicher Index, Zustandsprüfungen nur für Vorgemerktes, Warteschlange als Heap, Obergrenze der Population, Messwerkzeug), beschrieben in [Wesen.md](Wesen.md) (Fraktionen, Wahrnehmung, KI, Bewegung, Kampfwerte), [Architektur.md](Architektur.md) (Leistung), [Wirkungen.md](Wirkungen.md) (Fähigkeiten, Lange Aktionen, Auslöser, Zielauswahl)

Entschieden: Vorgabe für Paare ohne Angabe ist feind, die Tabelle nennt Abweichungen; Zorn trifft das angegriffene Wesen und Genossen, die die Angreiferin sehen, nicht die ganze Fraktion; Wahrnehmung nach Brogue mit Heimlichkeit als Modifikatorziel für Skills; Hinterhalt trifft sicher und kritisch, mehr Schaden über Modifikatoren mit `gegenueber_ahnungslos`; Lärm über Weglänge, Gelände dämpft nach `laermdaempfung`; die Nutzung von Fähigkeiten steht an der KI des Wesens; keine Gelegenheitsangriffe; keine Mehrfeld-Wesen, Bossphasen über Auslöser mit Bedingungen; mit `abstandHalten` wartet ein Wesen auf genau dem Abstand, statt zu pendeln; die KI schont Verbündete bei allen Zielarten und Mustern; `unterbrechbar` gilt auch für Ninkasi und nennt die Gründe (`schaden`, `versetzt`); `schwebend` heißt knapp über dem Boden, `fliegend` überquert alles, beides nur über `passierbarFuer`; `phasend` geht durch Wände, endet es darin, entscheidet die Lageprüfung mit `beimFestsitzen`; Aufprall nur an festem Gelände, Wesen und Kartenrand, die Menge steht am Baustein; Index per `WeakMap` neben dem Zustand, ferne Wesen voll simuliert, Obergrenze 500 mit ausdrücklichem Hinweis

Offener Rest:

+ Licht in der Wahrnehmung (Brogue: Heimlichkeitsweite im Licht doppelt, im Dunkeln halb), Spüren ohne Licht, Umherziehen wacher Wesen, Spur als Geruch (Brogue folgt der Spielerin über eine Duftkarte um Ecken, passend zu Mikroorganismen, die entlang von Wegen spüren); siehe Wahrnehmung in [Wesen.md](Wesen.md) und Licht in [Welt.md](Welt.md)
+ Ruf bei ganzen Fraktionen (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Tile für den Fernkämpfer-Test (bisher nur Zeichen F), falls er im Spiel bleibt

## 8. Gelände, Feldschichten, Ebenen

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.18.0 (veränderliches Gelände, `geschossdurchlaessig`, Türen, `tueren` am Wesen, Benutzen, Fallen mit Entdecken, Haken `zug_ende`) , 0.19.0 (Feldschichten Oberfläche, Gas und Feuer, dichter Rauch versperrt die Sicht, Gärbottiche, Brandflasche) und 0.20.0 (Abfolge der Tiefen, Treppen, verlassene Ebenen ruhen, Hub als feste Karte, Population nach Tiefe mit Rudeln, Gegnern aus der Tiefe und Affixen), beschrieben in [Welt.md](Welt.md) (Gelände, Feldschichten, Ebenen, Wegfindung)

Entschieden: Aufteilung in 0.18.0, 0.19.0 und 0.20.0; Türen nach Brogue, sie öffnen sich beim Hindurchgehen und schließen sich von selbst, wer sie öffnet, steht am Wesen (Bakterien nicht); Fallen verborgen, Entdecken nach Tarnung, Abstand und dem Kampfwert `entdecken`; verlassene Ebenen ruhen; Gas als ganzzahlige Konzentration je Feld mit Diffusion nach Brogue, Wände und geschlossene Türen halten es auf, ohne Schwerkraft, Druck und Temperatur; Flüssigkeiten zunächst als Oberfläche mit Menge, ohne Fließen; je Feld und Schicht eine Art, auf der Oberfläche verdrängt die neue, beim Gas die größere Menge; Wirkung des Gases in Stufen; dichter Rauch versperrt die Sicht

Offener Rest:

+ Tiles für Türen, Treppen, Fallen, Gärbottich und Brandflasche, Darstellung der Schichten über Tiles (bisher Zeichen und Farben)
+ Reise und Erkunden halten mit `kein_weg`, wenn eine entdeckte Falle den einzigen Weg versperrt; später vielleicht mit Nachfrage, ob Ninkasi darübergehen soll
+ Ausdrückliches Suchen nach Fallen (mehrere Züge, doppeltes Entdecken), vielleicht zusammen mit dem Rasten
+ Hebel mit Wirkung in der Ferne und verschlossene Türen mit Schlüssel: mit den Themenräumen (Punkt 10)
+ Abstraktes Nachholen verlassener Ebenen: Population wächst je vergangener Zeit logistisch auf eine Tragfähigkeit aus den Daten zu (Punkt 10, Druck gegen endloses Rasten)
+ Benommenheit und Ersticken als Zustände statt Giftschaden, sobald es Zustände im Spielinhalt gibt
+ Bewusst noch ohne: Endosporen, die Feuer weckt (es gibt keine Endosporen), Licht durch Feuer (mit dem Licht), Fließen von Flüssigkeiten
+ Wesen folgen Ninkasi über Treppen (Brogue: wer neben ihr steht, kommt mit)
+ Dienste des Hubs (Spieldesign in [Grundlagen.md](Grundlagen.md)); bisher ein leerer Raum mit Treppe
+ Treppe per Maus (Reise zur Treppe und hinüber); bisher nur die Taste <>
+ Mehr Ebenenarten und Gegner, damit die Population nach Tiefe etwas zu unterscheiden hat; Themenräume wie der Gärkeller (Punkt 10)

## 9. Gegenstände

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.21.0 (Plätze, anlegen und ablegen mit Tauschen, Modifikatorquelle `ausruestung`, Waffen statt Faust, Sets mit `traegt_tag`, Auslöser an der Ausrüstung, Haken `gegenstand_benutzt`, Inventarfenster), 0.22.0 (Stapel, Ladungen, Behälter mit `wirdZu`, Gewicht und Last in Stufen, Befehl `fallenlassen`, Bierfass) und 0.23.0 (Verderben mit gemitteltem Zeitpunkt in Stapeln, Haltbarkeit mit Baustein `abnutzen` und Zustandsprüfung `kaputt`, angefressen schwächer, Fluch mit `fluch_aufheben`, Unbekanntes mit Etiketten je Lauf, Vertrautheit und Kampfwert `kennerschaft`, Register `beimErzeugen`), beschrieben in [Gegenstaende.md](Gegenstaende.md) (Inventar, Ausrüstung, Verschleiß, Unbekanntes)

Entschieden: Aufteilung in 0.21.0, 0.22.0 und 0.23.0; Plätze Kopf, Brust, Beine, Hals und zwei Finger für Rüstung und Schmuck, zwei Hände für Waffen; ein voller Platz wird in einem Befehl getauscht; Waffen ersetzen die Faust; Flüche sind unbekannt bis zum Anlegen; Biersorten sind ein eigenes Thema, 0.23.0 baut nur die Mechanik für Unbekanntes; Bier wird zur leeren Flasche, der Ballast ist gewollt; Tragkraft 20 kg als Startwert, Modifikatoren durch Skills offen; Fallenlassen nimmt den ganzen Stapel; Bierfass mit 20 Schlucken zu einer Halben; fließen Stapel zusammen, verdirbt der ganze Stapel zum nach Anzahl gewichteten Durchschnitt; abgenutzt wird nur über Effekte (Säure), nicht durch Zuschlagen oder Getroffenwerden, verbraucht werden nur Ladungen; angefressen wirkt ein Gegenstand schwächer (Vorteile im Verhältnis der Haltbarkeit, Nachteile voll), damit sich der Wechsel zu anderer Rüstung irgendwann lohnt; kaputt wird ein Gegenstand zu `wirdZu`, er verschwindet nicht; Trinken erkennt sofort, Ausrüstung über eine mit der Benutzung steigende Chance, Aufheben nur mit Kennerschaft

Offener Rest:

+ Tiles für die Ausrüstung, Sauerbier, Lederfetzen und Kupferschrott (bisher nur Zeichen)
+ Angefressene Waffen: wie sie schwächer werden (z.B. weniger Schaden), braucht einen Eingriff in die Schadensrechnung; bisher nagt die Säure nur an Rüstung, Waffen haben keine Haltbarkeit
+ Reparieren (z.B. im Hub) und Verwertung der Reste (Lederfetzen, Kupferschrott) als Material
+ Flüche und unbekannte Gegenstände im Spielinhalt: die Biersorten nutzen die Gruppe `biere` (Spieldesign in [Grundlagen.md](Grundlagen.md)), ein Gegenstand mit `fluch_aufheben` (Weihwasser, Segen einer Nebengottheit)
+ Kennerschaft als Skill mit Sinnlichkeit und Braukunde (Punkt 13, Skillkatalog)
+ Verderben weiterer Dinge (Zutaten, Leichen) und ob das Bierfass verdirbt; die Anzeige der Restzeit (z.B. "frisch", "bald sauer")
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt
+ Mehrzahlwörter in der Grammatik (z.B. Holzpantinen), bisher nur Einzahl
+ Das Inventarfenster im Browser ausprobieren: die Tastenlogik ist getestet, die Darstellung in der Seitenleiste nicht
+ Fallenlassen einer Teilmenge (Abfrage der Anzahl), bisher immer der ganze Stapel
+ Leere Flaschen werfen (Köder, zerbrechen zu Scherben) und befüllen (mit dem Brausystem)

## 10. Weitere Systeme aus gängigen Roguelikes

Status: offen, jeweils erst Spieldesign in [Grundlagen.md](Grundlagen.md) entscheiden

+ Gunst der Nebengottheiten als Wert mit Geboten und Tabus (Vorbild DCSS)
+ Fallen, Türen, Schlüssel, Hebel, Themenräume (Vorbild Brogue "Machines"); Struktur für Rätsel, die EP bringen
+ Druck gegen endloses Rasten: Nahrungsuhr, Nachrücken oder Verderben (seit 0.23.0 wird Bier sauer); LP regenerieren immer, Pegelabbau und Psi-Schwund allein sind kein Druck
+ Telepathie (Psi-Gedankenlesen als Wahrnehmungsart "Wesen durch Wände") und Unsichtbarkeit
+ Filmriss als Mechanik: Zeitsprung, verlorene Erinnerung an erkundete Felder
+ Gefahreneinschätzung beim Untersuchen (Untersuchen mit Beschreibung und Trefferchance ohne Spiel-Zufall seit 0.25.0)
+ Todesbericht (Morgue) mit Todesursache und Statistik des Laufs; braucht die Urheberkette aus Punkt 2
+ Speichern als Schnappschuss zusätzlich zum Nachspielen, da lange Läufe sonst langsam laden; Mods gehören in die Prüfsumme der Daten
+ Vorschau durch Simulation auf einer Kopie des Zustands (Vorbild Desktop Dungeons), z.B. "wie viel Schaden macht dieser Angriff"; der Zustand ist JSON, die Kopie also billig
+ Leichen als Hinterlassenschaft: gärende Überreste, Nahrung für Mikroorganismen

## 11. Oberfläche

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.24.0 (Zielmodus für Werfen und Fähigkeiten mit Vorschau und Trefferchance, Fähigkeitenfenster, Werfen aus dem Inventar, Animation der Geschossbahn, vorläufige `testfaehigkeit` für Ninkasi) und 0.25.0 (Untersuchen mit X und Tooltip, Aufschlüsselung der Werte Ninkasis, Zustände, laufende Aktion, Wachzustand und Heimlichkeitsweite in der Seitenleiste, Log nur mit Wahrnehmbarem, Hören von Lärm außer Sicht, Texte zu Zuständen, Buchstaben nach `KeyboardEvent.key`, vorläufiger `testzustand`), beschrieben in [Bedienung.md](Bedienung.md) (Zielmodus, Untersuchen, Eingabe), [Anzeige.md](Anzeige.md) (Anzeige, Oberfläche), [Wesen.md](Wesen.md) (Wahrnehmung)

Entschieden: zwei Versionen, 0.24.0 Zielmodus und 0.25.0 Untersuchen und Zustände; Tasten W (werfen im Inventarfenster), Z (Fähigkeiten), X (untersuchen); Ninkasi bekommt bis zu ihren eigentlichen Fähigkeiten die vorläufige `testfaehigkeit` (der gleichnamige Testeintrag in `tests/hilfen.js` heißt seitdem `testritual`), dazu den vorläufigen `testzustand`; Kosmetik wie schwebende Zahlen ist ein eigener Punkt (12, seit dem Entwurf "Darstellung"); das Log zeigt keine Meldungen ohne Sichtkontakt, Lärm außer Sicht hört Ninkasi als vage Zeile mit Richtung; der Tooltip erscheint beim Darüberfahren mit der Maus und folgt beim Untersuchen dem Cursor

Offener Rest:

+ Schema der Oberfläche in [Oberflaeche.md](Oberflaeche.md): seit 0.27.0 Aktionskatalog, Fensterstapel, Charakterfenster, Charaktererstellung und Hilfe; seit 0.28.0 Layout A und B, Log in zwei Spalten mit Farben nach Seite, Bedienzeile, Esc-Kette, Spielmenü, Verlauf, vi-Belegung, Laufen; seit 0.29.0 Schnellleiste vollständig, Speichern, Minikarte und Übersichtskarte; seit 0.30.0 Einstellungen samt Tastenbelegung, Befehlszeile und Suche im Verlauf; seit 0.31.0 Klicks in Fenstern; seit 0.32.0 Titelbildschirm mit drei Speicherplätzen, Fenster nach dem Lauf und Chronik (siehe [Anzeige.md](Anzeige.md) (Oberfläche, Log), [Bedienung.md](Bedienung.md) (Schnellleiste, Einstellungen, Eingabe, Fenster), [Architektur.md](Architektur.md) (Speichern) und [Titelbildschirm.md](Titelbildschirm.md))
+ 0.30.0 und 0.31.0 im Browser prüfen (Einstellungen, Tastenbelegung, Befehlszeile, Suche, Klicks in Fenstern); 0.28.0 und 0.29.0 sind geprüft, die Fenster aus 0.27.0 sind angesehen, kleine Nacharbeiten stehen aus
+ Laufen hält noch nicht an Abzweigungen in Gängen (wie DCSS)
+ Gehörter Lärm kommt im jetzigen Inhalt kaum vor (im Bot 0 Mal), weil fast nur Kämpfe mit Ninkasi Lärm machen; mit Kämpfen unter Gegnern, Beschworenen und Fallen nachprüfen

Später:

+ Vorschau von Wirkungen innerhalb eines Effekts (Brandkreis der Brandflasche, verschachtelte Trefferwürfe) über eine Simulation auf einer Kopie des Zustands (Punkt 10)
+ Blocken in der angezeigten Chance

## 12. Darstellung

Status: zurückgestellt, Entwurf in [Animationen.md](Animationen.md) (Effektschicht, Kampfanimation, Kamera) und [Tileset.md](Tileset.md) (Varianten und Bewegung); reine Anzeige ohne Einfluss auf die Logik

Entschieden: Animationen halten die Eingabe auf, bis alle Meldungen seit Ninkasis letzter Aktion nacheinander abgespielt sind; Reise, Rasten und Erkunden halten dafür an (Schalter im Gerüst); bewegte Tiles laufen auch ohne vergehende Spielzeit und halten nichts auf; Reihenfolge Gerüst, Kampfanimation, bewegte Tiles; Varianten in zwei Stufen, gesondert zurückgestellt

+ Gerüst für Effekte im Bildtakt statt `src/anzeige/animation.js`
+ Kampfanimation: schwebende Zahlen für Schaden, Krit und Heilung, Aufblitzen bei Treffern, Explosion und Schwall aus der Meldung `flaeche`, Geschosse
+ Varianten und Schmuck für Boden und Wand, Vorderseite der Wand
+ Bewegte Tiles
+ Metaeffekte des Pegels und der LP, vorbereitet mit dem Layout (siehe Klassen der Elemente in [Oberflaeche.md](Oberflaeche.md))
+ Weiches Scrollen der Kamera (siehe Kamera in [Anzeige.md](Anzeige.md))

## 13. Skillsystem

Status: Mechanik umgesetzt in 0.26.0 (Eigenschaften, Skills, Lernpunkte, freie und gebundene EP, Beitragsbuch, Topf je Abstammungslinie, Anforderungen, Risiko ohne Skill, Ausbau), Skillfenster und Charaktererstellung in 0.27.0, beschrieben in [Wesen.md](Wesen.md) (Skills und Lernen), [Bedienung.md](Bedienung.md) (Fenster), Spieldesign in [Charakter.md](Charakter.md); im Spielinhalt nur vorläufige Skills (Zähigkeit, Nahkampf, Ausweichen)

Offen:

+ Skillfenster, Charaktererstellung und die Tasten zum Verteilen der EP im Browser ausprobieren (die Tastenlogik ist getestet, die Darstellung nur ohne Browser erzeugt)
+ Idee: Zielstufe je Skill wie in DCSS, eingehende freie EP fließen von selbst dorthin
+ Makel und Vorzüge in der Charaktererstellung, mit ihrem Katalog, gewählt vor der Punkteverteilung; dann rechnen `punkteZuVerteilen` (Oberfläche) und `eigenschaftenPruefen` (Logik, bisher fest `eigenschaftPunkte`) mit den gewählten Makeln und Vorzügen als Startoption
+ Skillkatalog als eigene Sitzung, danach Kennerschaft, Nachtsicht und Fernsicht als Skills
+ Anfangsbalance: Der Bot misst je Lauf von 3000 Befehlen rund 1200 EP aus Erkundung und nur rund 55 aus Gegnern (Tiefe 1, vorläufige Zahlen); das Verhältnis von `epJeFeld` zu den `ep` der Gegner ist vor dem Katalog festzulegen
+ Gewichtung `anteil` (nach Schadensanteil) zum Vergleich mit `erste`
+ Ortsbindung des Verteilens (`regeln.lernen.ort`), falls gewünscht
+ Lernanlässe für das Bewältigen von Fallen, Schlössern und Rezepten, mit diesen Systemen
+ Abzug einer Anforderung nur für den Angriff mit genau dieser Waffe (über Tags der Profile); bisher gilt er für die Trägerin insgesamt
+ Magisch kartierte Felder: eigener Wert in `erkundet`, EP erst beim Sehen
