# Battle Ninkasi - Systemausbau

Stand: 2026-11-19

Arbeitsliste der Strukturen, die Logik und Datenmodell noch brauchen, damit Fernkampf, Flächenwirkung, Effekte über Zeit, Magie, Psi, Nahkampf und viele Gegner überwiegend als Daten abbildbar sind. Grundlage ist eine Prüfung von Doku und Code mit Stand 0.3.0. Die Begriffe (Wirkungsarten, Effektsystem, Register, Zeitmodell) stehen in [Architektur.md](Architektur.md).

## Arbeitsweise

+ Jeder Punkt wird vor der Umsetzung als Vorschlag ausgearbeitet und freigegeben
+ Ist ein Punkt umgesetzt, wandert seine Beschreibung nach [Architektur.md](Architektur.md) (bzw. [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md)) und wird hier gestrichen; bleibt nur ein Rest offen, steht hier nur der Rest
+ Status je Punkt: offen, in Arbeit, umgesetzt in Version X
+ Die Reihenfolge ist eine Empfehlung: 1 bis 4 sind Kernarchitektur, danach sind die meisten Systeme Daten plus wenige neue Bausteine

## Bekannte Fehler

+ Zurzeit keine; die drei Fehler aus der Prüfung (Tod durch `wert_aendern`, verwaiste Gegenstände, verwaiste Zeitereignisse) sind mit 0.4.0 behoben

## 1. Tod, Haken, Auslöser

Status: umgesetzt in Version 0.4.0, beschrieben in [Architektur.md](Architektur.md) (Ereignisse, Tod und Zustandsprüfung, Auslöser)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Ersatzwirkungen aus Daten (z.B. "Phönixbier verhindert einmal den Tod", "Schild fängt einen Treffer ab"): eigener Typ, der sofort am Haken "davor" wirkt und sich verbrauchen kann; mit den Zuständen (Punkt 3)
+ Auslöser auch an Skills (mit dem Skillsystem) und am Inventar der Trägerin, das nicht angelegt ist (die Ausrüstung ist seit 0.21.0 Teil der Kaskade)
+ Die reservierten Haken des Katalogs in Betrieb nehmen: `zug_beginn` (Punkt 3, sobald etwas ihn braucht); `betritt_feld` und `verlaesst_feld` sind seit 0.16.0 in Betrieb, `zug_ende` seit 0.18.0, `gegenstand_benutzt` seit 0.21.0
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud); erst nötig, wenn mehr als die Beteiligten gefragt werden
+ Erster Auslöser im Spielinhalt (z.B. Säurespritzer des Essigbakteriums beim Tod): Spieldesign, noch nicht entschieden

## 2. Effektkontext, Zielauswahl, verschachtelte Effekte

Status: umgesetzt in Version 0.5.0, beschrieben in [Architektur.md](Architektur.md) (Effektsystem, Auslöser, Zielauswahl)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Zielmodus und Tooltip der Anzeige auf Grundlage von `zielAufloesen` (Oberfläche); den Befehl `faehigkeit` gibt es seit 0.12.0
+ Vorschau je Wesen "sicher" oder "vielleicht" getroffen; seit 0.10.0 liefert `trefferanteil` die Chance ohne Würfeln, offen ist die Anzeige (Punkt 6)
+ Sichtlinie und Flugbahn für die KI (Punkt 7); nach dem Anspielen prüfen, ob Ersatzlinien oder symmetrischer Schattenwurf für das Sichtfeld nötig sind
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt (Punkt 9), Animation der Meldungen `geschoss` und `flaeche` in der Anzeige

## 3. Zustände

Status: umgesetzt in Version 0.6.0 (Grundgerüst) und 0.7.0 (Verhalten, Beschwörung), beschrieben in [Architektur.md](Architektur.md) (Zustände, Befehle, Wahrnehmung)

Entschieden: Takt ist die Weltuhr; Stapelregel je Zustand, Vorgabe `erneuern`; Verlauf mit drei Namen oder eigener Kurve; handlungsunfähige Ninkasi wartet je Eingabe eine Aktion; Torkeln und Verwirrung über denselben Veränderer, Verwirrung greift auch Freunde an; Beschworene werden der Beschwörerin zugerechnet; Zustände im Spielinhalt erst, wenn der Systemausbau abgeschlossen ist (bis dahin nur in den Tests); seit 0.8.0 kommen ihre Modifikatoren aus der Modifikatorquelle `zustaende`

Offener Rest:

+ Anzeige der Zustände an Ninkasi und an Gegnern (Oberfläche, Log-Texte zu `zustand_beginnt`, `zustand_endet`, `abgewichen`, `beschworen`, `verschwindet`); mit dem großen Punkt Oberfläche
+ Torkeln aus dem Pegel: eine Schwelle des Stoffwechsels setzt einen Zustand (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Ob gebundene EP für Tötungen durch Beschworene in den Skill der Beschwörung fließen: Spieldesign in [Charakter.md](Charakter.md)

## 4. Modifikatoren

Status: umgesetzt in Version 0.8.0 (Register der Modifikatorquellen, Verrechnung, Zustände ohne Nachführen) und 0.9.0 (Bedingungen, Tags, Auren), beschrieben in [Architektur.md](Architektur.md) (Modifikatoren, Zustände)

Entschieden: Verrechnung nach dem Vorbild "increased" und "more" (Prozente addieren, nur `mal` multipliziert, einmal gerundet, `hoechstens` gewinnt gegen `mindestens`); Boni zwischen Quellen multiplizieren nicht automatisch, sondern nur über `mal` in den Daten; Auren ohne Sichtlinie (Option `sichtlinie: true`), `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl, standardmäßig nicht auf sich selbst; Tags als eigenes Feld am Modifikator

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Modifikatorquelle `skills` (mit dem Skillsystem in [Charakter.md](Charakter.md)); `ausruestung` seit 0.21.0
+ Tags in weiteren Abfragen: Schadensarten und Widerstände seit 0.10.0, Verbrauch, Zeit und Abklingzeit der Fähigkeiten seit 0.12.0
+ Anzeige der Aufschlüsselung (`modifikatorenAufgeschluesselt`) in der Oberfläche

## 5. Kampfwerte

Status: umgesetzt in Version 0.10.0 (Schadensarten, Widerstand, Immunität, Rüstung, Ausweichen, Willenskraft, Blocken, Krit, Marker, Baustein `trefferwurf`) und 0.11.0 (Angriffsprofile mit Zeitkosten, `vor_angriff`), beschrieben in [Architektur.md](Architektur.md) (Kampfwerte)

Entschieden: Kampfwerte sind Punkte, die über einen Halbwert zu Anteilen werden, die sich 100 % nur annähern (Trefferchance, Blocken, Kritchance, Widerstand); Trefferchance als Verhältnis von Genauigkeit zu Verteidigung plus Grundverteidigung, ohne harte Grenzen; Rüstung als fester Abzug mit Mindestschaden 1; Verwundbarkeit nähert sich dem doppelten Schaden; Immunität als eigener Sonderfall; Kritfaktor x1,5 als Regelwert, nach oben offen; `art` am Baustein `schaden` ist Pflicht; mehrere Angriffe laufen in einer Aktion nacheinander, die Aktion kostet so viel wie ihr langsamstes Profil; Durchschaubarkeit kommt aus der Anzeige der errechneten Prozentzahl, nicht aus der Formel

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Ersatzwirkungen (Rest aus Punkt 1) achten den Marker `unblockbar`
+ Anzeige: schwebende Krit-Zahlen, Trefferchance in Tooltip und Untersuchen; mit dem großen Punkt Oberfläche
+ Zuordnung der Eigenschaften zu Kampfwerten (Gewandtheit zu Ausweichen, Trinkfestigkeit zu Widerstand gegen Gift): Skillsystem in [Charakter.md](Charakter.md)

## 6. Fähigkeiten und lange Aktionen

Status: umgesetzt in Version 0.12.0 (Datentyp Fähigkeit, Befehl `faehigkeit`, Verbrauch, Material, Abklingzeit, Voraussetzungen, Risikotabellen, aufrechterhaltene Zauber mit Unterhalt, dazu `auf: "quelle"` und der Veränderer `ziel_verfehlen`) und 0.13.0 (lange Aktionen mit Unterbrechung und `fortsetzen`, Rasten und Auto-Erkunden in der Eingabe), beschrieben in [Architektur.md](Architektur.md) (Fähigkeiten, Lange Aktionen, Zustände, Maus, Reise, Rasten und Erkunden)

Entschieden: Modifikatorziele `verbrauch.<wert>` für Vorräte, `kosten.*` bleibt die Zeit; Abklingzeit in eigenen Zügen der Wirkenden (schneller Handelnde haben Fähigkeiten in Weltzeit früher zurück); Psi-Risiko als Mechanismus mit vorläufigen Zahlen, die Folgen von Rückschlag und Glimmer sind Spieldesign; Rituale und Brauen laufen in der Logik, Rasten und Auto-Erkunden in der Eingabe wie die Reise; beim Abbruch einer langen Aktion sind die Kosten verloren, `beimAbbruch` wirkt; die Gründe zur Unterbrechung stehen in den Regeln, weil sie das Nachspielen bestimmen

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Zielmodus und Tooltip der Anzeige auf Grundlage von `zielAufloesen`, Belegung für Fähigkeiten, Anzeige einer laufenden Aktion (Fortschritt); mit dem großen Punkt Oberfläche
+ Gegner benutzen Fähigkeiten (Auswahl in der KI), kündigen Angriffe an und lassen sich bei langen Aktionen durch Schaden unterbrechen (Punkt 7)
+ Brauen als eigene Art langer Aktion (Register `laufendeaktionen`), sobald das Brausystem entworfen ist ([Grundlagen.md](Grundlagen.md))
+ Folgen von Rückschlag und Glimmer (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Passive Fähigkeiten sind Modifikatoren und Auslöser aus Skills und Ausrüstung (Modifikatorquellen `skills`, `ausruestung`)

## 7. Fernkampf, Fraktionen, Wahrnehmung, viele Gegner

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.14.0 (Fraktionen als Daten mit Zorn, Wahrnehmung mit Wachzustand, Heimlichkeit, Bemerken, Lärm und Hinterhalt), 0.15.0 (die KI nutzt Fähigkeiten und hält Abstand, schont Verbündete, `ueberVerbuendete`, angekündigte und unterbrechbare lange Aktionen, Baustein `angreifen`, Auslöser mit `wenn`, Testgegner Fernkämpfer-Test), 0.16.0 (Bewegungsarten mit `passierbarFuer` und `phasend`, `versetzen` mit den Haken `betritt_feld` und `verlaesst_feld`, Stoßen, Ziehen, Tauschen, Teleportieren, Lageprüfung, Werfen, `unterbrechbar` als Liste) und 0.17.0 (räumlicher Index, Zustandsprüfungen nur für Vorgemerktes, Warteschlange als Heap, Obergrenze der Population, Messwerkzeug), beschrieben in [Architektur.md](Architektur.md) (Fraktionen, Wahrnehmung, KI, Bewegung, Leistung, Kampfwerte, Fähigkeiten, Lange Aktionen, Auslöser, Zielauswahl)

Entschieden: Vorgabe für Paare ohne Angabe ist feind, die Tabelle nennt Abweichungen; Zorn trifft das angegriffene Wesen und Genossen, die die Angreiferin sehen, nicht die ganze Fraktion; Wahrnehmung nach Brogue mit Heimlichkeit als Modifikatorziel für Skills; Hinterhalt trifft sicher und kritisch, mehr Schaden über Modifikatoren mit `gegenueber_ahnungslos`; Lärm über Weglänge, Gelände dämpft nach `laermdaempfung`; die Nutzung von Fähigkeiten steht an der KI des Wesens; keine Gelegenheitsangriffe; keine Mehrfeld-Wesen, Bossphasen über Auslöser mit Bedingungen; mit `abstandHalten` wartet ein Wesen auf genau dem Abstand, statt zu pendeln; die KI schont Verbündete bei allen Zielarten und Mustern; `unterbrechbar` gilt auch für Ninkasi und nennt die Gründe (`schaden`, `versetzt`); `schwebend` heißt knapp über dem Boden, `fliegend` überquert alles, beides nur über `passierbarFuer`; `phasend` geht durch Wände, endet es darin, entscheidet die Lageprüfung mit `beimFestsitzen`; Aufprall nur an festem Gelände, Wesen und Kartenrand, die Menge steht am Baustein; Index per `WeakMap` neben dem Zustand, ferne Wesen voll simuliert, Obergrenze 500 mit ausdrücklichem Hinweis

Offener Rest:

+ Licht in der Wahrnehmung (Brogue: Heimlichkeitsweite im Licht doppelt, im Dunkeln halb), Spüren ohne Licht, Umherziehen wacher Wesen, Spur als Geruch (Brogue folgt der Spielerin über eine Duftkarte um Ecken, passend zu Mikroorganismen, die entlang von Wegen spüren); siehe Wahrnehmung und Licht in [Architektur.md](Architektur.md)
+ Ruf bei ganzen Fraktionen (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Anzeige von Wachzustand und Heimlichkeitsweite (Oberfläche)
+ Zielmodus der Oberfläche für Werfen und Fähigkeiten (Taste, Auswahl des Gegenstands bzw. der Fähigkeit, Ziel per Maus und Tastatur, Vorschau aus `zielAufloesen`); Werfen gibt es seit 0.16.0 nur in Logik, Tests und Bot
+ Die Anzeige spielt die Bahn aus der Meldung `geschoss` ab (Oberfläche, aus 0.15.0 verschoben); die Zielfelder angekündigter Angriffe werden schon markiert
+ Tile für den Fernkämpfer-Test (bisher nur Zeichen F), falls er im Spiel bleibt

## 8. Gelände, Feldschichten, Ebenen

Status: umgesetzt bis auf den offenen Rest, in den Versionen 0.18.0 (veränderliches Gelände, `geschossdurchlaessig`, Türen, `tueren` am Wesen, Benutzen, Fallen mit Entdecken, Haken `zug_ende`) , 0.19.0 (Feldschichten Oberfläche, Gas und Feuer, dichter Rauch versperrt die Sicht, Gärbottiche, Brandflasche) und 0.20.0 (Abfolge der Tiefen, Treppen, verlassene Ebenen ruhen, Hub als feste Karte, Population nach Tiefe mit Rudeln, Gegnern aus der Tiefe und Affixen), beschrieben in [Architektur.md](Architektur.md) (Gelände, Feldschichten, Ebenen, Wegfindung)

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

Status: in Arbeit; umgesetzt in Version 0.21.0 (Plätze, anlegen und ablegen mit Tauschen, Modifikatorquelle `ausruestung`, Waffen statt Faust, Sets mit `traegt_tag`, Auslöser an der Ausrüstung, Haken `gegenstand_benutzt`, Inventarfenster), beschrieben in [Architektur.md](Architektur.md) (Ausrüstung)

Entschieden: Aufteilung in 0.21.0, 0.22.0 und 0.23.0; Plätze Kopf, Brust, Beine, Hals und zwei Finger für Rüstung und Schmuck, zwei Hände für Waffen; ein voller Platz wird in einem Befehl getauscht; Waffen ersetzen die Faust; Flüche sind unbekannt bis zum Anlegen; Biersorten sind ein eigenes Thema, 0.23.0 baut nur die Mechanik für Unbekanntes

Offen, Version 0.22.0 (Stapel, Ladungen, Behälter, Gewicht):

+ Stapel: `stapelbar` und `anzahl`; Gleiches fließt beim Aufheben zusammen, Trinken, Werfen und Fallenlassen nehmen einen
+ Ladungen `ladungen: { aktuell, hoechstens }` (Fass mit Schlucken), Behälter über `wirdZu` nach dem letzten Schluck (leere Flasche, Fass, für das Brauen)
+ Gewicht in Gramm, Tragkraft aus den Regeln mit Modifikatoren auf `tragkraft` (später Körperlichkeit); Überladung bremst in Stufen nach NetHack (ab 100 % Bewegen +25 %, ab 150 % +100 %)
+ Befehl `fallenlassen`, im Inventarfenster

Offen, Version 0.23.0 (Haltbarkeit, Verderben, Fluch, Unbekanntes):

+ Verderben `verdirbt: { nach, wird }` als Zeitereignis am Gegenstand (Bier wird sauer), ruht in verlassenen Ebenen mit
+ Haltbarkeit der Ausrüstung, Säure nagt daran; bei 0 kaputt als Zustandsprüfung wie der Tod
+ Fluch: verflucht lässt sich nicht ablegen, unbekannt bis zum Anlegen
+ Unbekannte Gegenstände nach Brogue: je Lauf zufällig zugeordnete Etiketten, Probieren erkennt und kostet, das Wissen gilt für den Lauf; Erkennen später über Sinnlichkeit und Braukunde (Skills), bis dahin ein Kampfwert `kennerschaft`; die Biersorten selbst sind Spieldesign

Offener Rest:

+ Tiles für die Ausrüstung (bisher nur Zeichen)
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt
+ Mehrzahlwörter in der Grammatik (z.B. Holzpantinen), bisher nur Einzahl
+ Das Inventarfenster im Browser ausprobieren: die Tastenlogik ist getestet, die Darstellung in der Seitenleiste nicht

## 10. Weitere Systeme aus gängigen Roguelikes

Status: offen, jeweils erst Spieldesign in [Grundlagen.md](Grundlagen.md) entscheiden

+ Gunst der Nebengottheiten als Wert mit Geboten und Tabus (Vorbild DCSS)
+ Fallen, Türen, Schlüssel, Hebel, Themenräume (Vorbild Brogue "Machines"); Struktur für Rätsel, die EP bringen
+ Druck gegen endloses Rasten: Nahrungsuhr, Nachrücken oder Verderben; LP regenerieren immer, Pegelabbau und Psi-Schwund allein sind kein Druck
+ Telepathie (Psi-Gedankenlesen als Wahrnehmungsart "Wesen durch Wände") und Unsichtbarkeit
+ Filmriss als Mechanik: Zeitsprung, verlorene Erinnerung an erkundete Felder
+ Untersuchen mit Beschreibung und Gefahreneinschätzung, Vorschau der Trefferchance ohne Spiel-Zufall
+ Todesbericht (Morgue) mit Todesursache und Statistik des Laufs; braucht die Urheberkette aus Punkt 2
+ Speichern als Schnappschuss zusätzlich zum Nachspielen, da lange Läufe sonst langsam laden; Mods gehören in die Prüfsumme der Daten
+ Vorschau durch Simulation auf einer Kopie des Zustands (Vorbild Desktop Dungeons), z.B. "wie viel Schaden macht dieser Angriff"; der Zustand ist JSON, die Kopie also billig
+ Leichen als Hinterlassenschaft: gärende Überreste, Nahrung für Mikroorganismen
